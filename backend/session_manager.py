import uuid
from datetime import datetime, timezone


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _row_to_dict(row) -> dict:
    return dict(row) if row is not None else None


async def create_session(db, agent: str) -> dict:
    session_id = str(uuid.uuid4())
    now = _now()
    await db.execute(
        "INSERT INTO sessions (id, agent, cli_session_id, state, created_at, updated_at) "
        "VALUES (?, ?, NULL, 'active', ?, ?)",
        (session_id, agent, now, now),
    )
    await db.commit()
    row = await db.execute(
        "SELECT * FROM sessions WHERE id = ?", (session_id,)
    )
    return _row_to_dict(await row.fetchone())


async def get_active_session(db, agent: str) -> dict | None:
    cursor = await db.execute(
        "SELECT * FROM sessions WHERE agent = ? AND state = 'active' "
        "ORDER BY updated_at DESC LIMIT 1",
        (agent,),
    )
    return _row_to_dict(await cursor.fetchone())


async def update_cli_session_id(db, session_id: str, cli_session_id: str) -> None:
    await db.execute(
        "UPDATE sessions SET cli_session_id = ?, updated_at = ? WHERE id = ?",
        (cli_session_id, _now(), session_id),
    )
    await db.commit()


async def expire_session(db, session_id: str) -> None:
    await db.execute(
        "UPDATE sessions SET state = 'expired', updated_at = ? WHERE id = ?",
        (_now(), session_id),
    )
    await db.commit()


async def close_session(db, session_id: str) -> None:
    await db.execute(
        "UPDATE sessions SET state = 'closed', updated_at = ? WHERE id = ?",
        (_now(), session_id),
    )
    await db.commit()


async def add_message(
    db, session_id: str, role: str, content: str, agent: str
) -> None:
    await db.execute(
        "INSERT INTO messages (session_id, role, content, agent, timestamp) "
        "VALUES (?, ?, ?, ?, ?)",
        (session_id, role, content, agent, _now()),
    )
    await db.commit()


async def get_messages(db, session_id: str) -> list[dict]:
    cursor = await db.execute(
        "SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC",
        (session_id,),
    )
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]


async def get_all_sessions(db) -> list[dict]:
    cursor = await db.execute(
        "SELECT * FROM sessions ORDER BY updated_at DESC"
    )
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]
