import os
from pathlib import Path

import aiosqlite
from dotenv import load_dotenv

load_dotenv()

_BACKEND_DIR = Path(__file__).parent
_DEFAULT_DB_PATH = _BACKEND_DIR.parent / "data" / "sessions.db"
_SCHEMA_PATH = _BACKEND_DIR / "db" / "schema.sql"

DB_PATH = Path(os.getenv("DB_PATH", str(_DEFAULT_DB_PATH)))


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA foreign_keys = ON")
    try:
        yield db
    finally:
        await db.close()


async def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    schema = _SCHEMA_PATH.read_text(encoding="utf-8")
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA foreign_keys = ON")
        # WAL mode: permite leitura concorrente enquanto uma escrita está em curso.
        await db.execute("PRAGMA journal_mode = WAL")
        await db.executescript(schema)
        await db.commit()
