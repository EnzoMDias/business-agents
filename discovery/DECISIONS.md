# DECISIONS.md — Agent Office (ADR)

**Projecto:** Agent Office  
**Data:** 2026-06-08  
**Formato:** Architecture Decision Records (ADR)  

---

## ADR-001 — Routing de agentes via flag nativa `--agent`, não keyword matching

**Estado:** Aceite  
**Data:** 2026-06-08  

### Contexto
O architect propôs routing por keyword matching no texto da mensagem ("age como architect",
"@architect") para determinar qual agente invocar. O challenger identificou que o
Claude CLI tem a flag `--agent <nome>` nativamente.

### Decisão
O agente activo é estado da UI, não inferido do conteúdo da mensagem.
O utilizador selecciona o agente clicando na estação no office view.
O backend usa `--agent <nome>` na invocação do CLI.

### Alternativas descartadas
- **Keyword matching no texto** — frágil, ambíguo, cria falsos positivos, não necessário.
- **`@nome` no início da mensagem** — protocolo artificial quando existe uma alternativa nativa.

### Consequências
- UI necessita de estado explícito (qual estação está activa).
- Backend recebe `{ agent: "architect", message: "..." }` — sem parsing de texto.
- Invocação simplificada e determinística.

---

## ADR-002 — Defensive parsing obrigatório para stream-json

**Estado:** Aceite  
**Data:** 2026-06-08  

### Contexto
O output `--output-format stream-json` do Claude CLI não tem schema público garantido.
Pode mudar entre versões sem aviso. O architect não mencionou este risco.

### Decisão
O `runner.py` deve:
1. Parsear apenas campos esperados (`type`, `content`, `session_id`).
2. Registar um `WARNING` para qualquer campo desconhecido encontrado.
3. Nunca fazer `raise` por campo desconhecido — ignorar e continuar.
4. Ter fallback explícito para `type` desconhecido.

### Alternativas descartadas
- **Parse estrito com schema fixo** — quebra na primeira actualização do CLI.
- **Ignorar campos sem log** — impossível diagnosticar regressões.

### Consequências
- Compatibilidade forward com versões futuras do CLI.
- Diagnóstico facilitado de mudanças de schema via logs.

---

## ADR-003 — Reset de sessão é sempre explícito, nunca silencioso

**Estado:** Aceite  
**Data:** 2026-06-08  

### Contexto
Quando um `session_id` expira, o sistema precisa de reagir. O architect não especificou
o comportamento. O challenger identificou o reset silencioso como falha de UX grave.

### Decisão
Quando o CLI retorna erro de sessão inválida:
1. Backend marca `state = expired` na BD.
2. Backend envia `{ type: "session_expired", agent: "..." }` via WebSocket.
3. UI mostra aviso visível com texto explicativo e dois botões: [Iniciar nova sessão] [Cancelar].
4. Nenhuma mensagem é enviada ao CLI sem confirmação do utilizador.

### Alternativas descartadas
- **Reset automático silencioso** — o utilizador perde contexto sem saber. Inaceitável.
- **Bloquear envio sem explicação** — UI fica presa sem diagnóstico.

### Consequências
- O utilizador sabe sempre quando perde contexto.
- A nova sessão começa sem contexto — e isso é explícito na UI.

---

## ADR-004 — Backend controla session IDs, não o CLI

**Estado:** Aceite  
**Data:** 2026-06-08  

### Contexto
O architect dependia dos session_ids gerados pelo CLI. O challenger levantou o risco
de o CLI mudar o formato ou comportamento dos IDs sem aviso.

### Decisão
O backend gera UUIDs próprios para identificar sessões (`sessions.id`).
O `cli_session_id` é um campo separado que regista o ID devolvido pelo CLI.
O backend usa `cli_session_id` para o `--resume`, mas o ciclo de vida da sessão
é controlado pelo campo `state` gerido pelo `session_manager.py`.

### Alternativas descartadas
- **Usar directamente o ID do CLI como chave primária** — coupling com formato externo
  não controlado.

### Consequências
- O backend pode actualizar `cli_session_id` se o CLI o mudar sem perder a sessão.
- O histórico de mensagens mantém-se ligado ao UUID do backend.

---

## ADR-005 — `--fork-session` é anti-pattern proibido

**Estado:** Aceite  
**Data:** 2026-06-08  

### Contexto
O challenger identificou `--fork-session` como flag de risco: comportamento não
documentado, pode criar sessões orfãs e duplicar contexto.

### Decisão
A flag `--fork-session` não é usada em nenhuma parte do código.
Um comentário explícito no `runner.py` documenta este anti-pattern com o motivo.

### Alternativas descartadas
- **Usar para criar sessões paralelas de debug** — risco não justificado.

### Consequências
- Funcionalidade de fork não disponível na v1.
- Se necessário no futuro, requer validação separada com testes explícitos.

---

## ADR-006 — Modelo de sessão: stateless por invocação, contexto via `--resume`

**Estado:** Aceite  
**Data:** 2026-06-08  

### Contexto
Duas abordagens possíveis para contexto: (a) processo `claude` vivo com janela de
contexto activa, ou (b) guardar histórico e reinjectar no próximo prompt.

### Decisão
Abordagem (b) via `--resume <session_id>`:
- Cada mensagem lança um processo `claude` novo que termina após a resposta.
- O contexto é mantido pelo próprio mecanismo de sessão do Claude CLI.
- O backend não injeta histórico manualmente.

### Alternativas descartadas
- **Processo `claude` persistente** — complexidade de gestão de processo no Windows
  (PTY, ConPTY, winpty), risco de processo órfão, difícil de monitorizar. Risco
  técnico principal identificado no discovery — evitado intencionalmente.
- **Injectar histórico manualmente** — duplicação de contexto, custo de tokens
  cresce linearmente, comportamento diverge do Claude nativo.

### Consequências
- Latência por mensagem inclui startup do processo claude.
- Sem gestão de processos persistentes no Windows.
- Dependência do mecanismo `--resume` do CLI.

---

## ADR-007 — Stack: FastAPI + SQLite + WebSocket + vanilla JS

**Estado:** Aceite  
**Data:** 2026-06-08  

### Contexto
Escolha de stack para a interface web local.

### Decisão
FastAPI (Python) + SQLite (stdlib) + WebSocket nativo + HTML/CSS/JS vanilla.
Sem frameworks JS. Sem build step. Frontend servido como ficheiros estáticos pelo FastAPI.

### Alternativas descartadas
- **React/Vue/Svelte** — requerem Node.js + bundler, aumentam setup sem benefício local.
- **Flask** — sem WebSocket nativo, sem async.
- **PostgreSQL** — overkill para 1 utilizador local.
- **Docker** — explicitamente fora de escopo pelo utilizador.

### Consequências
- Setup mínimo: Python + pip. Sem Node.js.
- Frontend sem hot-reload automático (aceitável para uso pessoal).
- Toda a lógica JS em ficheiros planos — sem módulos ES nativos complexos.

---

## ADR-008 — Binding exclusivo a 127.0.0.1

**Estado:** Aceite  
**Data:** 2026-06-08  

### Contexto
App local sem autenticação. Binding a `0.0.0.0` exporia a API a toda a rede local.

### Decisão
Uvicorn arranca sempre com `--host 127.0.0.1`. O `start.ps1` não aceita override
para `0.0.0.0`.

### Consequências
- App inacessível de outros dispositivos da rede — comportamento correcto.
- Sem necessidade de firewall rules adicionais.

---

## ADR-009 — aiosqlite em vez de sqlite3 stdlib para acesso async

**Estado:** Aceite  
**Data:** 2026-06-08  

### Contexto
O STACK.md indica `sqlite3 (stdlib)` como camada de query. No entanto, o backend
usa FastAPI com endpoints async. Usar `sqlite3` síncrono dentro de coroutines bloqueia
o event loop do uvicorn.

### Decisão
Usar `aiosqlite` (já declarado em `requirements.txt`) como wrapper async sobre `sqlite3`.
A API é idêntica ao `sqlite3` mas não-bloqueante. O `row_factory = aiosqlite.Row`
permite acesso por nome de coluna sem mapeamento manual.

### Alternativas descartadas
- **sqlite3 puro com `run_in_executor`** — possível, mas verboso e sem vantagem face ao aiosqlite.
- **SQLAlchemy async** — proibido por decisão de arquitectura (overhead de ORM desnecessário).

### Consequências
- Todas as funções do `session_manager.py` são coroutines (`async def`).
- O `get_db()` é um generator async compatível com FastAPI Depends.

---

## ADR-010 — Timestamps UTC com formato ISO 8601 explícito

**Estado:** Aceite  
**Data:** 2026-06-08  

### Contexto
SQLite não tem tipo nativo de data/hora. É necessário definir um formato canónico
para os campos `created_at`, `updated_at` e `timestamp`.

### Decisão
Formato: `YYYY-MM-DDTHH:MM:SSZ` via `datetime.now(timezone.utc).strftime(...)`.
O sufixo `Z` indica explicitamente UTC — sem ambiguidade de fuso horário.
Gerado sempre pelo backend, nunca pelo SQLite.

### Alternativas descartadas
- **`datetime.utcnow().isoformat() + "Z"`** — `utcnow()` está deprecated no Python 3.12+;
  substituído por `datetime.now(timezone.utc)`.
- **Unix timestamp (INTEGER)** — menos legível em queries e logs.
- **`CURRENT_TIMESTAMP` do SQLite** — formato diferente, sem o `Z` explícito.

### Consequências
- Timestamps consistentes e legíveis em toda a base de dados.
- Ordenação lexicográfica equivale a ordenação cronológica (ISO 8601 garante isto).
