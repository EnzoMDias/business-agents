-- Agent Office — schema SQLite
-- Motor: SQLite 3.35+ (built-in Python)
-- Encoding: UTF-8
-- Foreign keys: activar com PRAGMA foreign_keys = ON em cada conexão

CREATE TABLE IF NOT EXISTS sessions (
    id             TEXT PRIMARY KEY,               -- UUID gerado pelo backend (uuid4)
    agent          TEXT NOT NULL,                  -- nome do agente (ex: "architect")
    cli_session_id TEXT,                           -- session_id devolvido pelo CLI; pode mudar entre invocações
    state          TEXT NOT NULL DEFAULT 'active', -- active | expired | closed
    created_at     TEXT NOT NULL,                  -- ISO 8601 UTC (ex: "2026-06-08T14:00:00Z")
    updated_at     TEXT NOT NULL                   -- ISO 8601 UTC; actualizado em cada transição de estado
);

CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id), -- integridade referencial
    role       TEXT NOT NULL,                          -- user | assistant
    content    TEXT NOT NULL,
    agent      TEXT NOT NULL,                          -- redundante por conveniência em queries de histórico
    timestamp  TEXT NOT NULL                           -- ISO 8601 UTC
);

-- Suporta lookup de mensagens por sessão (padrão de acesso dominante)
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);

-- Suporta get_active_session(agent) sem full scan
CREATE INDEX IF NOT EXISTS idx_sessions_agent ON sessions(agent, state);
