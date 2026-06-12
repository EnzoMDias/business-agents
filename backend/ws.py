import json
import logging
import re

import aiosqlite
from fastapi import WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from . import runner, session_manager
from .models import WSMessageIn

logger = logging.getLogger(__name__)

# Padrão: [AGENTE ACTIVO: nome] — sempre na primeira linha da resposta
_ACTIVE_AGENT_RE = re.compile(r"^\[AGENTE ACTIVO:\s*([^\]]+)\]", re.IGNORECASE)
# Quantos caracteres bufferisar antes de desistir de encontrar o marcador
_MARKER_BUF_LIMIT = 120


async def websocket_endpoint(websocket: WebSocket, db: aiosqlite.Connection) -> None:
    await websocket.accept()
    logger.info("WebSocket conectado: %s", websocket.client)

    try:
        while True:
            raw = await websocket.receive_text()

            try:
                data = json.loads(raw)
                msg_in = WSMessageIn.model_validate(data)
            except (json.JSONDecodeError, ValidationError) as exc:
                await websocket.send_json({"type": "error", "error": f"Payload inválido: {exc}"})
                continue

            agent = msg_in.agent
            content = msg_in.content
            requested_session_id = msg_in.session_id

            session: dict | None = None

            if requested_session_id is not None:
                cursor = await db.execute(
                    "SELECT * FROM sessions WHERE id = ? AND state = 'active'",
                    (requested_session_id,),
                )
                row = await cursor.fetchone()
                if row is not None:
                    session = dict(row)

            if session is None:
                session = await session_manager.get_active_session(db, agent)

            if session is None:
                session = await session_manager.create_session(db, agent)
                logger.info("Nova sessão criada: %s para agente %s", session["id"], agent)

            session_id: str = session["id"]
            cli_session_id: str | None = session.get("cli_session_id")

            await session_manager.add_message(db, session_id, "user", content, agent)
            await websocket.send_json({"type": "session_id", "session_id": session_id})

            full_response_parts: list[str] = []
            got_done = False
            got_error = False

            marker_buf = ""
            marker_resolved = False

            async for chunk in runner.invoke(agent, content, cli_session_id):
                chunk_type = chunk.get("type")

                if chunk_type == "session_id":
                    new_cli_id = chunk["session_id"]
                    if new_cli_id != cli_session_id:
                        await session_manager.update_cli_session_id(db, session_id, new_cli_id)
                        cli_session_id = new_cli_id

                elif chunk_type == "chunk":
                    text = chunk.get("content", "")

                    if not marker_resolved:
                        marker_buf += text
                        m = _ACTIVE_AGENT_RE.match(marker_buf.lstrip())
                        if m:
                            active_agent_name = m.group(1).strip().lower()
                            await websocket.send_json({
                                "type": "active_agent",
                                "agent": active_agent_name,
                            })
                            # Texto após o marcador (pode ter \n no início)
                            after_marker = marker_buf[marker_buf.index("]") + 1:].lstrip("\n")
                            marker_resolved = True
                            marker_buf = ""
                            if after_marker:
                                full_response_parts.append(after_marker)
                                await websocket.send_json({
                                    "type": "chunk",
                                    "content": after_marker,
                                    "agent": agent,
                                })
                        elif len(marker_buf) >= _MARKER_BUF_LIMIT:
                            # Sem marcador — flush do buffer como texto normal
                            marker_resolved = True
                            full_response_parts.append(marker_buf)
                            await websocket.send_json({
                                "type": "chunk",
                                "content": marker_buf,
                                "agent": agent,
                            })
                            marker_buf = ""
                    else:
                        full_response_parts.append(text)
                        await websocket.send_json({
                            "type": "chunk",
                            "content": text,
                            "agent": agent,
                        })

                elif chunk_type == "done":
                    got_done = True
                    # Flush do buffer se ficou por resolver (mensagem muito curta)
                    if not marker_resolved and marker_buf:
                        full_response_parts.append(marker_buf)
                    full_text = "".join(full_response_parts)
                    if full_text:
                        await session_manager.add_message(db, session_id, "assistant", full_text, agent)
                    await websocket.send_json({"type": "done"})

                elif chunk_type == "error":
                    got_error = True
                    error_text = chunk.get("error", "Erro desconhecido")
                    logger.error("runner error para agente %s: %s", agent, error_text)

                    if "session" in error_text.lower():
                        await session_manager.expire_session(db, session_id)
                        await websocket.send_json({"type": "session_expired", "agent": agent})
                    else:
                        await websocket.send_json({"type": "error", "error": error_text})

                else:
                    logger.warning("ws: chunk com tipo desconhecido do runner: %s", chunk_type)

            if not got_done and not got_error:
                if not marker_resolved and marker_buf:
                    full_response_parts.append(marker_buf)
                full_text = "".join(full_response_parts)
                if full_text:
                    await session_manager.add_message(db, session_id, "assistant", full_text, agent)
                await websocket.send_json({"type": "done"})

    except WebSocketDisconnect:
        logger.info("WebSocket desconectado: %s", websocket.client)
    except Exception as exc:
        logger.exception("Erro inesperado no WebSocket handler: %s", exc)
        try:
            await websocket.send_json({"type": "error", "error": "Erro interno do servidor"})
        except Exception:
            pass
