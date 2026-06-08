# TASKS.md — Agent Office

**Projecto:** Agent Office  
**Data:** 2026-06-08  
**Estado:** Pronto para produção  

---

## Ordem de dependências

```
T01 → T02 → T03 → T04 → T05 → T06 → T07 → T08 → T09 → T10
                   ↓
                  T11 (paralelo com T05+)
```

---

## FASE 1 — Setup e Scaffolding

### T01 — Verificar e configurar ambiente

**Agente:** devops  
**Estimativa:** 1-2h  
**Bloqueia:** tudo  

**Descrição:**  
Verificar que todos os pré-requisitos estão instalados e funcionais no Windows 11
do utilizador. Confirmar que o claude CLI suporta as flags necessárias.

**Critérios de aceitação:**
- [ ] Python 3.11+ instalado e acessível no PATH (`python --version`)
- [ ] `pip` funcional
- [ ] `claude --version` retorna versão instalada
- [ ] `claude --agent architect --print --output-format stream-json "test"` executa sem erro
- [ ] Confirmado que `--agent architect` invoca `.claude/agents/architect.md` (não agente remoto)
- [ ] Confirmado em que chunk do stream-json aparece o `session_id`
- [ ] Resultados documentados em `discovery/CHECKPOINT.md` (versões encontradas)

---

### T02 — Scaffold da estrutura de pastas e ficheiros base

**Agente:** devops  
**Estimativa:** 1h  
**Bloqueia:** T03, T04, T11  

**Descrição:**  
Criar a estrutura de pastas do projecto e ficheiros de configuração base.

**Critérios de aceitação:**
- [ ] Pasta `agent-office/` criada com estrutura conforme `ARCHITECTURE.md`
- [ ] `requirements.txt` com versões fixas: fastapi>=0.111, uvicorn>=0.29, python-dotenv>=1.0, pydantic>=2.0
- [ ] `.env.example` com variáveis: `PORT=8000`, `CLAUDE_WORK_DIR=.`
- [ ] `.gitignore` com: `*.db`, `.env`, `__pycache__/`, `venv/`
- [ ] `start.ps1` criado (ver T03)
- [ ] `data/` pasta criada (SQLite vai aqui)

---

### T03 — Script de arranque `start.ps1`

**Agente:** devops  
**Estimativa:** 2h  
**Bloqueia:** T04  

**Descrição:**  
Script PowerShell que prepara e arranca a aplicação com um único comando.

**Critérios de aceitação:**
- [ ] Verifica Python 3.11+ instalado; mensagem de erro clara se não encontrado
- [ ] Cria venv se não existir (`venv/`)
- [ ] Activa venv e instala/actualiza dependências
- [ ] Copia `.env.example` para `.env` se `.env` não existir
- [ ] Verifica se port 8000 (ou `$PORT` do `.env`) está livre; erro se ocupado
- [ ] Informa utilizador se Windows Firewall pode bloquear o port (mensagem informativa, não bloqueante)
- [ ] Arranca `uvicorn backend.main:app --host 127.0.0.1 --port 8000`
- [ ] Abre browser em `http://localhost:8000` após 2 segundos
- [ ] Script executável sem `-ExecutionPolicy Bypass` adicional (ou instrução clara de como correr)

---

## FASE 2 — Backend Core

### T04 — Base de dados: schema e conexão

**Agente:** dba  
**Estimativa:** 2h  
**Bloqueia:** T05  

**Descrição:**  
Implementar `database.py` com conexão SQLite e criação automática do schema.

**Critérios de aceitação:**
- [ ] `database.py` com função `get_connection()` que devolve `sqlite3.Connection`
- [ ] Schema criado automaticamente se `sessions.db` não existir (migrations inline)
- [ ] Tabelas `sessions` e `messages` conforme schema em `ARCHITECTURE.md`
- [ ] Índices criados: `idx_messages_session`, `idx_sessions_agent`
- [ ] `WAL mode` activado (`PRAGMA journal_mode=WAL`) para leitura concorrente
- [ ] `foreign_keys` activados (`PRAGMA foreign_keys=ON`)
- [ ] Teste manual: criar sessão, inserir mensagem, ler de volta sem erro

---

### T05 — Session Manager

**Agente:** backend_dev  
**Estimativa:** 3h  
**Bloqueia:** T06  

**Descrição:**  
Implementar `session_manager.py` com CRUD de sessões e lógica de estado.

**Critérios de aceitação:**
- [ ] `get_or_create_session(agent: str) -> dict` — devolve sessão activa ou cria nova
- [ ] `update_cli_session_id(session_id: str, cli_id: str)` — actualiza campo `cli_session_id`
- [ ] `invalidate_session(session_id: str)` — muda `state` para `expired`
- [ ] `close_session(session_id: str)` — muda `state` para `closed`
- [ ] `get_session(session_id: str) -> dict | None`
- [ ] Todos os timestamps em ISO 8601 UTC
- [ ] Nenhuma função lança excepção por sessão não encontrada — devolve `None`

---

### T06 — Runner: invocação do CLI com streaming

**Agente:** backend_dev  
**Estimativa:** 4h  
**Bloqueia:** T07  

**Descrição:**  
Implementar `runner.py` — o componente mais crítico. Invoca o claude CLI via
subprocess e faz streaming do output JSON linha a linha.

**Critérios de aceitação:**
- [ ] `async def invoke(agent, session_id, cli_session_id, message) -> AsyncGenerator`
- [ ] Constrói comando como lista Python (nunca string com `shell=True`)
- [ ] Com `cli_session_id`: inclui `--resume <id>`; sem ele: omite `--resume`
- [ ] Flag `--agent <nome>` sempre presente
- [ ] Flag `--print --output-format stream-json` sempre presente
- [ ] Lê stdout linha a linha de forma assíncrona
- [ ] **Defensive parsing:** tenta parsear cada linha como JSON; se falhar, log WARNING e continuar
- [ ] **Defensive parsing:** campos desconhecidos no JSON → log WARNING, ignorar
- [ ] Emite chunks `{ type: "chunk", content: "..." }` para campos de conteúdo
- [ ] Detecta e extrai `session_id` do stream; emite `{ type: "session_id", value: "..." }`
- [ ] Detecta erro do CLI (exit code != 0 ou type "error") → emite `{ type: "error", message: "..." }`
- [ ] Emite `{ type: "done" }` quando processo termina
- [ ] **Anti-pattern documentado em comentário:** `--fork-session` proibido e porquê
- [ ] Testado manualmente com `claude --agent architect --print --output-format stream-json "hello"`

---

### T07 — WebSocket handler

**Agente:** backend_dev  
**Estimativa:** 3h  
**Bloqueia:** T08  

**Descrição:**  
Implementar `ws.py` com o handler WebSocket que orquestra session_manager e runner.

**Critérios de aceitação:**
- [ ] Endpoint `ws://localhost:8000/ws`
- [ ] Aceita mensagem `{ agent: str, message: str }` — validado com Pydantic
- [ ] Chama `session_manager.get_or_create_session(agent)`
- [ ] Chama `runner.invoke(...)` e faz pipe dos chunks para o WebSocket
- [ ] Quando runner emite `session_id` → chama `session_manager.update_cli_session_id(...)`
- [ ] Quando runner emite `error` de sessão inválida → chama `session_manager.invalidate_session(...)` e envia `{ type: "session_expired", agent: "..." }` ao cliente
- [ ] Regista mensagem do utilizador em `messages` antes de invocar o runner
- [ ] Regista resposta completa em `messages` após `done`
- [ ] Gestão de excepções: WebSocket desligado durante streaming não causa crash
- [ ] Apenas aceita conexões de `127.0.0.1`

---

### T08 — FastAPI app principal

**Agente:** backend_dev  
**Estimativa:** 1h  
**Bloqueia:** T09  

**Descrição:**  
Implementar `main.py` com a app FastAPI, routes e servir ficheiros estáticos.

**Critérios de aceitação:**
- [ ] `app = FastAPI()` com título "Agent Office"
- [ ] Mount `StaticFiles` em `/` a servir `frontend/`
- [ ] Include router do WebSocket (`ws.py`)
- [ ] Route `GET /api/agents` devolve lista dos 9 agentes com nome e descrição
- [ ] Route `GET /api/sessions/{agent}` devolve sessão activa do agente (ou null)
- [ ] `GET /` serve `frontend/index.html`
- [ ] App arranca sem erros: `uvicorn backend.main:app --host 127.0.0.1 --port 8000`

---

## FASE 3 — Frontend

### T09 — Estrutura HTML e layout base

**Agente:** frontend_dev  
**Estimativa:** 2h  
**Bloqueia:** T10, T11  

**Descrição:**  
Implementar `index.html` com estrutura semântica e layout de dois painéis.

**Critérios de aceitação:**
- [ ] Dois painéis: office view (esquerda/topo) e chat panel (direita/principal)
- [ ] Office view contém 9 estações (uma por agente), identificadas por nome
- [ ] Chat panel contém: área de histórico de mensagens, input de texto, botão de envio
- [ ] Indicador de agente activo visível no chat panel ("A falar com: Architect")
- [ ] Estrutura semântica com `<main>`, `<section>`, `<article>`
- [ ] Sem CSS no HTML — tudo em `style.css`
- [ ] Sem JavaScript no HTML — tudo em `app.js`

---

### T10 — CSS: estilos e visual das estações

**Agente:** frontend_dev  
**Estimativa:** 4h  
**Bloqueia:** T11  

**Descrição:**  
Implementar `style.css` com o visual pixel art abstracto e estados das estações.

**Critérios de aceitação:**
- [ ] Tema escuro (fundo #1a1a2e ou similar)
- [ ] 9 estações com blocos coloridos distintos por agente (cor diferente por agente)
- [ ] Estação activa: borda destacada + animação de pulse (CSS animation)
- [ ] Estação inactiva: opacidade reduzida
- [ ] Estação com sessão expirada: cor ou ícone de aviso
- [ ] Chat panel: mensagens do utilizador alinhadas à direita, respostas à esquerda
- [ ] Streaming de texto: cursor piscante enquanto resposta chega
- [ ] Sem JavaScript para visuais — apenas CSS
- [ ] Responsivo para viewport >= 1024px (sem mobile)

---

### T11 — JavaScript: cliente WebSocket e lógica UI

**Agente:** frontend_dev  
**Estimativa:** 4h  

**Descrição:**  
Implementar `app.js` com toda a lógica de cliente WebSocket e interacção da UI.

**Critérios de aceitação:**
- [ ] Conexão WebSocket a `ws://localhost:8000/ws`
- [ ] Reconexão automática com backoff se conexão cair (max 5 tentativas)
- [ ] Click em estação → actualiza estado activo, envia todas as mensagens para esse agente
- [ ] Envio de mensagem: `{ agent: "architect", message: "texto" }` via WebSocket
- [ ] Recepção de chunks `{ type: "chunk" }` → append ao bloco de resposta activo
- [ ] Recepção de `{ type: "done" }` → fecha bloco de resposta, remove cursor
- [ ] Recepção de `{ type: "session_expired" }` → mostra modal/aviso com texto explícito e botões [Iniciar nova sessão] [Cancelar]
- [ ] Nova sessão: envia `{ type: "reset_session", agent: "..." }` ao backend (ou simplesmente reinicia com mensagem nova sem --resume)
- [ ] Histórico de mensagens: carrega últimas N mensagens da sessão ao activar estação
- [ ] Input bloqueado enquanto aguarda resposta (sem double-send)
- [ ] Enter no input envia mensagem; Shift+Enter insere nova linha
- [ ] Scroll automático ao fundo quando nova mensagem chega

---

## FASE 4 — Validação

### T12 — Testes de integração end-to-end

**Agente:** qa  
**Estimativa:** 3h  
**Depende de:** T11  

**Descrição:**  
Validar os fluxos principais antes de declarar a v1 pronta.

**Critérios de aceitação:**
- [ ] Fluxo completo: arranque → clicar agente → enviar mensagem → receber resposta streaming → histórico guardado
- [ ] Troca de agente: enviar mensagem para architect, trocar para challenger, enviar mensagem — confirmar que vão para agentes correctos
- [ ] Sessão expirada: simular erro de sessão inválida (mock ou forçar ID errado) → aviso aparece → confirmar → nova sessão funciona
- [ ] Reconnect WebSocket: fechar e reabrir browser → sessão retoma sem erro
- [ ] Dois agentes com sessões activas: alternar entre eles preserva contexto de cada um
- [ ] Todos os testes documentados em `qa/TEST_RESULTS.md`

---

## Resumo de responsabilidades

| Agente | Tarefas |
|--------|---------|
| devops | T01, T02, T03 |
| dba | T04 |
| backend_dev | T05, T06, T07, T08 |
| frontend_dev | T09, T10, T11 |
| qa | T12 |
