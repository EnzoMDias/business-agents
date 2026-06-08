"""
runner.py — Invoca o Claude CLI via subprocess e faz streaming do output JSON.

Anti-patterns proibidos (ver ARCHITECTURE.md):
  - shell=True: permite injecção de comandos via input do utilizador.
  - --fork-session: comportamento não documentado; pode criar sessões orfãs
    e duplicar contexto de forma imprevisível.
  - Reset silencioso de sessão: se cli_session_id expirar, nunca reiniciar
    sem notificar o utilizador.
"""

import asyncio
import json
import logging
import os
from asyncio.subprocess import DEVNULL, PIPE
from pathlib import Path
from typing import AsyncGenerator

logger = logging.getLogger(__name__)

_TIMEOUT = int(os.getenv("RUNNER_TIMEOUT_SECONDS", "120"))

# Directório de trabalho onde está .claude/agents/
# Deve coincidir com CLAUDE_WORK_DIR em main.py.
_CLAUDE_WORK_DIR = Path(
    os.getenv("CLAUDE_WORK_DIR", r"C:\Users\Enzo\Documents\DEV\claude-agents")
)


def _build_command(agent: str, message: str, cli_session_id: str | None) -> list[str]:
    cmd = [
        "claude",
        "--agent", agent,
        "--print",
        "--output-format", "stream-json",
        "--verbose",
    ]
    if cli_session_id is not None:
        cmd += ["--resume", cli_session_id]
    cmd += ["--include-partial-messages", message]
    return cmd


def _extract_text_from_content(content) -> str | None:
    """Extrai texto do campo content de um chunk assistant.

    O CLI devolve content como lista de blocos:
      [{"type": "text", "text": "..."}]
    Concatena todos os blocos de texto encontrados.
    """
    if not isinstance(content, list):
        return None
    parts = []
    for block in content:
        if not isinstance(block, dict):
            continue
        if block.get("type") == "text":
            text = block.get("text")
            if isinstance(text, str):
                parts.append(text)
    return "".join(parts) if parts else None


async def invoke(
    agent: str,
    message: str,
    cli_session_id: str | None,
) -> AsyncGenerator[dict, None]:
    """Invoca o Claude CLI e faz yield de chunks normalizados.

    Yields:
        {"type": "session_id", "session_id": str}
            — extraído do chunk system/init (primeiro chunk)
        {"type": "chunk", "content": str}
            — texto parcial do assistente (chunks assistant)
        {"type": "done", "cost_usd": float | None, "duration_ms": int | None}
            — processo concluído com sucesso (chunk result/success)
        {"type": "error", "error": str}
            — exit code != 0, ou chunk result com subtype error
    """
    cmd = _build_command(agent, message, cli_session_id)
    logger.debug("runner command: %s", cmd)

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdin=DEVNULL,
        stdout=PIPE,
        stderr=PIPE,
        cwd=str(_CLAUDE_WORK_DIR),
    )

    accumulated_response: list[str] = []
    _stream_concluded = False  # True se o stream já emitiu done ou error

    try:
        async with asyncio.timeout(_TIMEOUT):
            async for raw_line in proc.stdout:
                line = raw_line.decode("utf-8", errors="replace").strip()
                if not line:
                    continue

                try:
                    chunk = json.loads(line)
                except json.JSONDecodeError as exc:
                    logger.warning("runner: linha não é JSON válido — %s | linha: %.200s", exc, line)
                    continue

                if not isinstance(chunk, dict):
                    logger.warning("runner: chunk não é dict — tipo: %s", type(chunk).__name__)
                    continue

                chunk_type = chunk.get("type")

                if chunk_type == "system":
                    subtype = chunk.get("subtype")
                    if subtype == "init":
                        session_id = chunk.get("session_id")
                        if isinstance(session_id, str) and session_id:
                            yield {"type": "session_id", "session_id": session_id}
                        else:
                            logger.warning("runner: system/init sem session_id válido — chunk: %.200s", chunk)
                    # system/thinking_tokens e outros subtypes: ignorar

                elif chunk_type == "assistant":
                    message_field = chunk.get("message")
                    if not isinstance(message_field, dict):
                        logger.warning("runner: assistant chunk sem campo 'message' — chunk: %.200s", chunk)
                        continue

                    content_field = message_field.get("content")
                    text = _extract_text_from_content(content_field)
                    if text:
                        accumulated_response.append(text)
                        yield {"type": "chunk", "content": text}

                elif chunk_type == "result":
                    subtype = chunk.get("subtype")
                    if subtype == "success":
                        _stream_concluded = True
                        cost = chunk.get("total_cost_usd")
                        duration = chunk.get("duration_ms")
                        yield {
                            "type": "done",
                            "cost_usd": cost if isinstance(cost, (int, float)) else None,
                            "duration_ms": duration if isinstance(duration, (int, float)) else None,
                        }
                    elif subtype == "error":
                        _stream_concluded = True
                        error_text = chunk.get("result") or "CLI retornou erro desconhecido"
                        yield {"type": "error", "error": str(error_text)}
                    else:
                        logger.warning("runner: result com subtype desconhecido: %s", subtype)

                elif chunk_type in ("rate_limit_event", "user"):
                    # rate_limit_event: informativo, não relevante para o cliente.
                    # user: tool use results — não retransmitir ao cliente.
                    pass

                else:
                    logger.warning("runner: tipo de chunk desconhecido: %s", chunk_type)

    except asyncio.TimeoutError:
        proc.kill()
        await proc.wait()
        yield {"type": "error", "error": f"Timeout após {_TIMEOUT}s a aguardar resposta do CLI"}
        return

    await proc.wait()

    stderr_raw = await proc.stderr.read()
    if stderr_raw:
        logger.debug("runner stderr: %s", stderr_raw.decode("utf-8", errors="replace"))

    if proc.returncode != 0 and not _stream_concluded:
        # Só emite erro se o stream ainda não concluiu com done ou error.
        # Evita duplo-envio quando o CLI emite result/success mas retorna exit code != 0.
        yield {
            "type": "error",
            "error": f"CLI terminou com exit code {proc.returncode}",
        }
