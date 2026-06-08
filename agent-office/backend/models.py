from pydantic import BaseModel


class Message(BaseModel):
    role: str
    content: str
    agent: str
    timestamp: str


class Session(BaseModel):
    id: str
    agent: str
    cli_session_id: str | None
    state: str
    created_at: str
    updated_at: str


class WSMessageIn(BaseModel):
    type: str
    content: str
    agent: str
    session_id: str | None = None


class WSChunkOut(BaseModel):
    type: str
    content: str | None = None
    agent: str | None = None
    session_id: str | None = None
    error: str | None = None
