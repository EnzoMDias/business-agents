# Anti-patterns proibidos: shell=True (injecção de comandos), --fork-session
# (sessões orfãs), reset silencioso de sessão expirada.

import asyncio
import json
import logging
import os
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import AsyncGenerator

logger = logging.getLogger(__name__)

_CLAUDE_WORK_DIR = Path(
    os.getenv("CLAUDE_WORK_DIR", str(Path(__file__).parent.parent))
)

_executor = ThreadPoolExecutor(max_workers=8, thread_name_prefix="runner")
_SENTINEL = object()


def _claude_prefix() -> list[str]:
    # No Windows, wrappers .cmd não podem ser lançados directamente pelo
    # CreateProcess — precisam de 'cmd.exe /c'. Sem risco de injecção porque
    # usamos list-form.
    exe = shutil.which("claude")
    if exe is None:
        raise FileNotFoundError("claude CLI não encontrado no PATH")
    if sys.platform == "win32" and Path(exe).suffix.lower() in (".cmd", ".bat"):
        return ["cmd.exe", "/c", exe]
    return [exe]


def _build_command(agent: str, message: str, cli_session_id: str | None) -> list[str]:
    cmd = _claude_prefix() + [
        "--agent", agent,
        "--print",
        "--output-format", "stream-json",
        "--verbose",
        "--dangerously-skip-permissions",
    ]
    if cli_session_id is not None:
        cmd += ["--resume", cli_session_id]
    cmd += ["--include-partial-messages", message]
    return cmd


def _extract_text_from_content(content) -> str | None:
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


def _read_stdout(
    proc: subprocess.Popen,
    queue: asyncio.Queue,
    loop: asyncio.AbstractEventLoop,
) -> None:
    try:
        for raw_line in proc.stdout:
            line = raw_line.decode("utf-8", errors="replace").strip()
            loop.call_soon_threadsafe(queue.put_nowait, line)
    finally:
        loop.call_soon_threadsafe(queue.put_nowait, _SENTINEL)


async def invoke(
    agent: str,
    message: str,
    cli_session_id: str | None,
) -> AsyncGenerator[dict, None]:
    """Yields: session_id | chunk | done | error"""
    cmd = _build_command(agent, message, cli_session_id)
    logger.debug("runner command: %s", cmd)

    # subprocess.Popen funciona em todos os event loops do Windows (incluindo
    # SelectorEventLoop do Python 3.14), ao contrário de
    # asyncio.create_subprocess_exec que exige ProactorEventLoop.
    proc = subprocess.Popen(
        cmd,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=str(_CLAUDE_WORK_DIR),
    )

    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue()
    loop.run_in_executor(_executor, _read_stdout, proc, queue, loop)

    accumulated_response: list[str] = []
    _stream_concluded = False

    while True:
        item = await queue.get()
        if item is _SENTINEL:
            break

        line: str = item
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

        elif chunk_type in ("rate_limit_event", "user", "stream_event"):
            pass

        else:
            logger.warning("runner: tipo de chunk desconhecido: %s", chunk_type)

    await loop.run_in_executor(None, proc.wait)

    stderr_raw = await loop.run_in_executor(None, proc.stderr.read)
    if stderr_raw:
        logger.debug("runner stderr: %s", stderr_raw.decode("utf-8", errors="replace"))

    if proc.returncode != 0 and not _stream_concluded:
        # Evita duplo-envio quando o CLI emite result/success mas retorna exit code != 0.
        yield {
            "type": "error",
            "error": f"CLI terminou com exit code {proc.returncode}",
        }
