# ARCHITECTURE.md — Agent Office

**Projecto:** Agent Office  
**Data:** 2026-06-08  
**Estado:** Aprovado — pronto para produção  

---

## Problema

Interface web local para interagir com 9 subagentes Claude Code (`.claude/agents/`).
O terminal não oferece visibilidade de qual agente está activo nem persistência de
contexto acessível. Esta interface resolve os dois problemas.

---

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (localhost:8000)              │
│                                                              │
│  ┌──────────────────┐        ┌──────────────────────────┐   │
│  │  Office View     │        │      Chat Panel           │   │
│  │                  │        │                           │   │
│  │  [D] [A] [C] [S] │        │  ┌─────────────────────┐ │   │
│  │  [B] [F] [b] [O] │        │  │  message history    │ │   │
│  │        [Q]       │        │  └─────────────────────┘ │   │
│  │                  │        │  [input] [send]           │   │
│  │  Active: ARCH ◀──┼────────┼──────────────────────────┘   │
│  └──────────────────┘        │                           │   │
│                              └───────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ WebSocket ws://localhost:8000/ws
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    FastAPI (Python 3.11+)                     │
│                                                              │
│  ┌─────────────────┐   ┌──────────────────────────────────┐ │
│  │  WebSocket      │   │         session_manager.py        │ │
│  │  handler        │──▶│                                   │ │
│  │  (ws.py)        │   │  get_or_create_session(agent)     │ │
│  └─────────────────┘   │  invalidate_session(session_id)   │ │
│                        └──────────────┬───────────────────┘ │
│                                       │                      │
│                        ┌──────────────▼───────────────────┐ │
│                        │         runner.py                 │ │
│                        │                                   │ │
│                        │  invoke(agent, session_id, msg)   │ │
│                        │  → subprocess claude CLI          │ │
│                        │  → yield stream chunks            │ │
│                        └──────────────┬───────────────────┘ │
│                                       │                      │
│                        ┌──────────────▼───────────────────┐ │
│                        │         SQLite (sessions.db)      │ │
│                        │                                   │ │
│                        │  sessions, messages               │ │
│                        └──────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │ subprocess
                         │
┌────────────────────────▼────────────────────────────────────┐
│              claude CLI (Claude Code)                        │
│                                                              │
│  claude --agent <nome> --print                               │
│        --output-format stream-json                           │
│        --resume <session_id>                                 │
│        "<mensagem>"                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Fluxo Completo de uma Mensagem

### Estado normal (sessão activa)

```
1. Utilizador escreve mensagem no chat → clica Send
2. Browser envia via WebSocket: { agent: "architect", message: "..." }
3. WebSocket handler recebe → chama session_manager.get_or_create_session("architect")
4. session_manager consulta SQLite:
   - Se sessão existe e state = "active" → devolve session_id
   - Se não existe → session_id = None (primeira invocação sem --resume)
5. runner.py constrói comando:
   - Com sessão: claude --agent architect --print --output-format stream-json
                       --resume <session_id> "<mensagem>"
   - Sem sessão: claude --agent architect --print --output-format stream-json
                       "<mensagem>"
6. runner.py inicia subprocess, lê stdout linha a linha (stream-json)
7. Para cada chunk JSON:
   - Tenta parsear campos conhecidos (type, content, session_id, etc.)
   - Campos desconhecidos → log WARNING, ignorar (defensive parsing)
   - Se type = "assistant" → envia chunk via WebSocket ao browser
   - Se contém session_id → session_manager.update_session_id(novo_id)
8. Processo termina → runner.py emite { type: "done" }
9. Browser renderiza resposta incremental no chat panel
10. SQLite regista mensagem (input + output + timestamp + agent + session_id)
```

### Quando session_id expira ou é inválido

```
1. runner.py invoca claude --resume <session_id_antigo>
2. Claude CLI retorna erro (exit code != 0 ou JSON com type = "error")
3. runner.py detecta o erro → não silencia
4. session_manager.invalidate_session(session_id) → state = "expired"
5. WebSocket envia ao browser: { type: "session_expired", agent: "architect" }
6. Browser mostra aviso visível ao utilizador:
   "Sessão do Architect expirou. O contexto anterior não está disponível.
    Iniciar nova sessão?" [Confirmar] [Cancelar]
7. Se utilizador confirma → session_manager cria nova sessão (sem --resume)
8. A nova sessão começa sem contexto — isso é explícito na UI
```

Nota: não existe reset silencioso. O utilizador toma a decisão consciente.

---

## Routing de Agentes

### Decisão aprovada

O agente activo é **estado da UI**, não inferido do conteúdo da mensagem.

O utilizador selecciona o agente clicando na estação correspondente no office view.
A estação activa fica destacada visualmente. Todas as mensagens subsequentes vão
para esse agente.

### Invocação CLI

```
claude --agent <nome> --print --output-format stream-json [--resume <id>] "<msg>"
```

O `--agent <nome>` é a flag nativa do Claude CLI. Não existe keyword matching
nem parsing de `@nome` no texto da mensagem.

### Alternativa descartada

Routing por keyword matching ("age como architect", "@architect") — descartado
pelo challenger. Frágil, ambíguo e desnecessário dado que `--agent` existe nativamente.

---

## Schema SQLite

```sql
CREATE TABLE sessions (
    id          TEXT PRIMARY KEY,        -- UUID gerado pelo backend
    agent       TEXT NOT NULL,           -- nome do agente (ex: "architect")
    cli_session_id TEXT,                 -- session_id devolvido pelo CLI (pode mudar)
    state       TEXT NOT NULL DEFAULT 'active',  -- active | expired | closed
    created_at  TEXT NOT NULL,           -- ISO 8601
    updated_at  TEXT NOT NULL            -- ISO 8601
);

CREATE TABLE messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  TEXT NOT NULL REFERENCES sessions(id),
    role        TEXT NOT NULL,           -- user | assistant
    content     TEXT NOT NULL,
    agent       TEXT NOT NULL,
    timestamp   TEXT NOT NULL            -- ISO 8601
);

CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_sessions_agent   ON sessions(agent, state);
```

### Nota sobre session_id

O backend gera o UUID da sessão (`sessions.id`). O `cli_session_id` é o identificador
devolvido pelo CLI no stream-json, que pode diferir ou actualizar-se entre invocações.
O backend controla o ciclo de vida da sessão; o CLI é tratado como dependência externa.

---

## Gestão de Sessão — Casos de Uso

| Situação | Comportamento |
|----------|---------------|
| Primeira mensagem para agente | Invoca sem `--resume`. CLI devolve `cli_session_id`. Guarda em SQLite. |
| Mensagens seguintes | Invoca com `--resume <cli_session_id>`. |
| CLI devolve novo session_id | Actualiza `cli_session_id` na BD. A sessão do backend mantém o mesmo UUID. |
| CLI retorna erro de sessão | Marca `state = expired`. Notifica UI. Aguarda confirmação do utilizador. |
| Utilizador fecha browser | Sessão fica `active` em BD. Na reabertura, retoma com `--resume`. |
| Utilizador inicia nova sessão explicitamente | Cria nova linha em `sessions`. Sessão anterior fica `closed`. |

---

## Estrutura de Ficheiros

```
agent-office/
├── start.ps1                  # ponto de entrada único
├── backend/
│   ├── main.py                # FastAPI app, routers
│   ├── ws.py                  # WebSocket handler
│   ├── runner.py              # subprocess claude CLI + stream parser
│   ├── session_manager.py     # CRUD sessões + lógica de estado
│   ├── database.py            # conexão SQLite + migrations
│   └── models.py              # Pydantic models
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js                 # WebSocket client + UI logic
├── data/
│   └── sessions.db            # SQLite (criado automaticamente)
├── requirements.txt
└── .env.example               # CLAUDE_WORK_DIR, PORT, etc.
```

---

## Segurança

| Aspecto | Decisão |
|---------|---------|
| Autenticação | Nenhuma — uso pessoal local |
| Binding | Apenas `127.0.0.1` — nunca `0.0.0.0` |
| Input sanitization | Mensagens passadas ao CLI como argumento posicional, não interpoladas em shell string. Usar `subprocess.run([...], ...)` com lista, nunca `shell=True`. |
| Segredos | Variáveis de ambiente via `.env`. Nunca hardcoded. |
| Windows Firewall | O script `start.ps1` informa o utilizador se o port 8000 estiver bloqueado. |

---

## Anti-patterns Documentados

```python
# PROIBIDO — não usar fork-session
# claude --fork-session <id> ...
# Motivo: comportamento não documentado, pode criar sessões orfãs
# e duplicar contexto de forma imprevisível.

# PROIBIDO — não usar shell=True
# subprocess.run(f"claude --agent {agent} ...", shell=True)
# Motivo: injecção de comandos via input do utilizador.

# PROIBIDO — reset silencioso de sessão
# Se cli_session_id expirar, nunca reiniciar sem notificar o utilizador.
```

---

## Riscos Residuais

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Schema do stream-json muda entre versões do CLI | Média | Defensive parsing com fallback. Log de campos desconhecidos. |
| `--resume` não funciona em determinada versão do CLI | Baixa | Verificar versão no arranque. Documentar versão mínima testada. |
| Windows ConPTY interfere com subprocess | Baixa | Usar `subprocess` standard com `stdout=PIPE`. Testar na instalação. |
| Port 8000 ocupado | Baixa | Configurável via `.env`. `start.ps1` verifica antes de arrancar. |
| Sessão CLI expira por inactividade | Média | UI avisa o utilizador. Sem magia. |

---

## Pendências Arquitecturais

1. **Verificação do campo `session_id` no stream-json** — confirmar em que chunk
   do output o CLI devolve o session_id (primeiro chunk? último? campo separado?).
   O runner.py deve ser testado manualmente antes da implementação completa.

2. **Versão mínima do claude CLI** — identificar qual versão introduziu `--agent`
   e `--resume`. Documentar em `STACK.md` e verificar no `start.ps1`.

3. **Comportamento de `--agent` com subagentes locais** — confirmar que
   `--agent architect` invoca `.claude/agents/architect.md` e não um agente
   remoto. Testar no ambiente do utilizador antes de implementar o runner.
