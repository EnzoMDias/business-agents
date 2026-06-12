import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

import aiosqlite
from fastapi import Depends, FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .database import DB_PATH, init_db, get_db
from .ws import websocket_endpoint

logger = logging.getLogger(__name__)

_BACKEND_DIR = Path(__file__).parent
_FRONTEND_DIR = _BACKEND_DIR.parent / "frontend"

# CLAUDE_WORK_DIR aponta para o directório de trabalho onde está .claude/agents/
_CLAUDE_WORK_DIR = Path(
    os.getenv("CLAUDE_WORK_DIR", str(Path(__file__).parent.parent))
)

_FALLBACK_AGENTS = [
    "architect",
    "backend_dev",
    "challenger",
    "claude",
    "dba",
    "devops",
    "discovery",
    "frontend_dev",
    "qa",
    "synthesizer",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info("Base de dados inicializada: %s", DB_PATH)
    yield


app = FastAPI(title="Agent Office", lifespan=lifespan)

# CORS restrito a localhost — sem acesso externo.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)



@app.get("/api/agents")
async def list_agents() -> list[str]:
    """Lista agentes disponíveis lendo .claude/agents/ ou usa fallback."""
    agents_dir = _CLAUDE_WORK_DIR / ".claude" / "agents"
    if agents_dir.is_dir():
        names = sorted(
            p.stem
            for p in agents_dir.iterdir()
            if p.suffix == ".md" and p.is_file()
        )
        if names:
            return names
    logger.warning(
        "Pasta .claude/agents/ não encontrada em %s — usando lista de fallback",
        _CLAUDE_WORK_DIR,
    )
    return _FALLBACK_AGENTS


@app.get("/api/sessions")
async def list_sessions(db: aiosqlite.Connection = Depends(get_db)) -> list[dict]:
    from .session_manager import get_all_sessions
    return await get_all_sessions(db)


@app.get("/api/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: str,
    db: aiosqlite.Connection = Depends(get_db),
) -> list[dict]:
    from .session_manager import get_messages
    return await get_messages(db, session_id)



@app.websocket("/ws")
async def ws_route(
    websocket: WebSocket,
    db: aiosqlite.Connection = Depends(get_db),
) -> None:
    await websocket_endpoint(websocket, db)


# A rota GET "/" deve ser declarada antes do mount para ter prioridade.
@app.get("/")
async def serve_index() -> FileResponse:
    return FileResponse(_FRONTEND_DIR / "index.html")


# Mount em /static para não colidir com "/" e as rotas /api/*.
if _FRONTEND_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=_FRONTEND_DIR), name="static")
else:
    logger.warning("Pasta frontend/ não encontrada em %s", _FRONTEND_DIR)
