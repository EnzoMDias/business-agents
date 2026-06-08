# CLI_VALIDATION.md — Resultados Empíricos dos Testes

**Projecto:** Agent Office
**Data:** 2026-06-08
**Executado por:** devops
**CLI version:** 2.1.168
**Python:** 3.14.5
**pip:** 26.1.1
**OS:** Windows 11 Home 10.0.26200

---

## Resumo Executivo

| Teste | Estado | Observação crítica |
|-------|--------|--------------------|
| A — flags disponíveis | PASSOU | Todas as flags necessárias confirmadas |
| B — schema stream-json + session_id | PASSOU | session_id presente em todos os chunks; --verbose obrigatório |
| C — --agent com subagente local | PASSOU | Subagente local invocado correctamente |
| D — --resume com session_id | PASSOU | Contexto preservado entre invocações |
| E — --agent + --resume em conjunto | PASSOU | Funcionam sem conflito |

---

## Teste A — Flags disponíveis

**Comando:** `claude --help`

**Resultado:** PASSOU

**Flags confirmadas presentes:**

| Flag | Presente | Nota |
|------|----------|------|
| `--agent <agent>` | Sim | "Agent for the current session. Overrides the 'agent' setting." |
| `--resume / -r [value]` | Sim | "Resume a conversation by session ID, or open interactive picker" |
| `--output-format <format>` | Sim | choices: "text", "json", "stream-json" |
| `--session-id <uuid>` | Sim | "Use a specific session ID for the conversation (must be a valid UUID)" |
| `--fork-session` | Sim | "When resuming, create a new session ID instead of reusing the original" |
| `--no-session-persistence` | Sim | "Disable session persistence - sessions will not be saved to disk" |
| `--print / -p` | Sim | "Print response and exit (useful for pipes)" |
| `--verbose` | Sim | "Override verbose mode setting from config" |
| `--include-partial-messages` | Sim | "Include partial message chunks as they arrive (only with --print + stream-json)" |

**Nota crítica:** A flag `--output-format stream-json` requer `--verbose` quando usada com `--print`. Sem `--verbose`, o CLI retorna erro:
```
Error: When using --print, --output-format=stream-json requires --verbose
```

**Impacto na arquitectura:** O `runner.py` DEVE incluir `--verbose` no comando. Actualizar documentação.

---

## Teste B — Schema stream-json e localização do session_id

**Comando:** `claude --print --output-format stream-json --verbose "responde apenas: ok"`

**Resultado:** PASSOU

**Descoberta crítica:** `--verbose` é OBRIGATÓRIO com `--output-format stream-json --print`.

### Chunks emitidos (ordem de emissão)

**Chunk 1 — type: "system" / subtype: "init"**
```json
{
  "type": "system",
  "subtype": "init",
  "cwd": "C:\\Users\\Enzo\\Documents\\DEV\\claude-agents",
  "session_id": "dc46a85d-3307-400a-9ac1-551eddd2d00b",
  "tools": ["Task", "AskUserQuestion", "Bash", "..."],
  "mcp_servers": [],
  "model": "claude-sonnet-4-6",
  "permissionMode": "default",
  "slash_commands": ["..."],
  "apiKeySource": "none",
  "claude_code_version": "2.1.168",
  "output_style": "default",
  "agents": ["architect", "backend_dev", "challenger", "claude", "dba", "devops",
             "discovery", "Explore", "frontend_dev", "general-purpose", "Plan",
             "qa", "statusline-setup", "synthesizer"],
  "skills": ["..."],
  "plugins": [],
  "analytics_disabled": false,
  "product_feedback_disabled": false,
  "uuid": "ed3f755b-ed42-4bf4-b934-b9787e1c5985",
  "memory_paths": {"auto": "C:\\Users\\Enzo\\.claude\\projects\\...\\memory\\"},
  "fast_mode_state": "off"
}
```

**Chunk 2 — type: "assistant" (streaming parcial com conteúdo)**
```json
{
  "type": "assistant",
  "message": {
    "model": "claude-sonnet-4-6",
    "id": "msg_01NMKw2bcv8mgXwph6rFBtdZ",
    "type": "message",
    "role": "assistant",
    "content": [{"type": "text", "text": "ok"}],
    "stop_reason": null,
    "stop_sequence": null,
    "stop_details": null,
    "usage": {
      "input_tokens": 3,
      "cache_creation_input_tokens": 23074,
      "cache_read_input_tokens": 0,
      "cache_creation": {
        "ephemeral_5m_input_tokens": 0,
        "ephemeral_1h_input_tokens": 23074
      },
      "output_tokens": 1,
      "service_tier": "standard",
      "inference_geo": "not_available"
    },
    "diagnostics": null,
    "context_management": null
  },
  "parent_tool_use_id": null,
  "session_id": "dc46a85d-3307-400a-9ac1-551eddd2d00b",
  "uuid": "07f52147-578a-4fa8-8e76-233061d00533",
  "request_id": "req_011CbrUe7rrJH6o3BAHeuxfv"
}
```

**Chunk 3 — type: "rate_limit_event"**
```json
{
  "type": "rate_limit_event",
  "rate_limit_info": {
    "status": "allowed",
    "resetsAt": 1780963200,
    "rateLimitType": "five_hour",
    "overageStatus": "rejected",
    "overageDisabledReason": "org_level_disabled",
    "isUsingOverage": false
  },
  "uuid": "be4a465f-e12a-41f4-882e-ffec669831ea",
  "session_id": "dc46a85d-3307-400a-9ac1-551eddd2d00b"
}
```

**Chunk 4 — type: "result" / subtype: "success" (chunk final)**
```json
{
  "type": "result",
  "subtype": "success",
  "is_error": false,
  "api_error_status": null,
  "duration_ms": 1532,
  "duration_api_ms": 3030,
  "ttft_ms": 1470,
  "ttft_stream_ms": 1469,
  "time_to_request_ms": 31,
  "num_turns": 1,
  "result": "ok",
  "stop_reason": "end_turn",
  "session_id": "dc46a85d-3307-400a-9ac1-551eddd2d00b",
  "total_cost_usd": 0.08709750000000001,
  "usage": {
    "input_tokens": 3,
    "cache_creation_input_tokens": 23074,
    "cache_read_input_tokens": 0,
    "output_tokens": 4,
    "server_tool_use": {"web_search_requests": 0, "web_fetch_requests": 0},
    "service_tier": "standard",
    "cache_creation": {
      "ephemeral_1h_input_tokens": 23074,
      "ephemeral_5m_input_tokens": 0
    },
    "inference_geo": "not_available",
    "iterations": [{"input_tokens": 3, "output_tokens": 4, "...": "..."}],
    "speed": "standard"
  },
  "modelUsage": {
    "claude-haiku-4-5-20251001": {"inputTokens": 441, "outputTokens": 12, "...": "..."},
    "claude-sonnet-4-6": {"inputTokens": 3, "outputTokens": 4, "...": "..."}
  },
  "permission_denials": [],
  "terminal_reason": "completed",
  "fast_mode_state": "off",
  "uuid": "990fc50f-74fd-4e30-b0ea-58d51e1478d4"
}
```

### Onde aparece o session_id

O `session_id` está presente em **TODOS os chunks**, a partir do primeiro (`system/init`).

| Chunk | session_id presente |
|-------|---------------------|
| system/init | Sim — primeiro a emiti-lo |
| assistant | Sim |
| rate_limit_event | Sim |
| result/success | Sim |
| user (tool_result) | Sim |
| system/thinking_tokens | Sim |

**Decisão para o runner.py:** extrair o `session_id` do primeiro chunk `system/init`. É o mais fiável e chega antes de qualquer conteúdo.

### Tipos de chunks observados

| type | subtype | Descrição |
|------|---------|-----------|
| system | init | Primeiro chunk. Contém session_id, tools, agents, model, version. |
| system | thinking_tokens | Emitido durante raciocínio interno do modelo. |
| assistant | — | Contém mensagem com content[], usage, model id. |
| user | — | Emitido quando o CLI usa tools (tool_result). Contém histórico de tool calls. |
| rate_limit_event | — | Informação de rate limit. Não tem conteúdo para o utilizador. |
| result | success | Último chunk. Contém resultado final, duração, custos, uso de tokens. |
| result | error | Chunk final em caso de erro (exit code != 0). |

### Campos presentes em todos os chunks
- `type` — string discriminante
- `session_id` — UUID da sessão (presente em todos os chunks após init)
- `uuid` — UUID único do chunk

---

## Teste C — --agent com subagente local

**Comando:** `claude --print --output-format stream-json --verbose --agent discovery "responde apenas: qual e o teu nome e papel"`

**Resultado:** PASSOU

**Confirmação:** O subagente `discovery` em `.claude/agents/discovery.md` foi invocado correctamente. A resposta identificou-se como "Discovery — Especialista em descoberta de produto", conforme o ficheiro local.

**Observação no chunk system/init:** O campo `agents` lista os agentes locais disponíveis:
```json
"agents": ["architect", "backend_dev", "challenger", "claude", "dba", "devops",
           "discovery", "Explore", "frontend_dev", "general-purpose", "Plan",
           "qa", "statusline-setup", "synthesizer"]
```

Isto confirma que `--agent <nome>` resolve para `.claude/agents/<nome>.md` quando o ficheiro existe localmente. Não é um agente remoto.

**session_id obtido:** `a591af22-839a-4b7e-a4bc-2ecbed406e4f`

---

## Teste D — --resume com session_id

**Comando:** `claude --print --output-format stream-json --verbose --resume dc46a85d-3307-400a-9ac1-551eddd2d00b "confirma: lembras-te da mensagem anterior?"`

**session_id usado (do Teste B):** `dc46a85d-3307-400a-9ac1-551eddd2d00b`

**Resultado:** PASSOU

**Confirmação:** O modelo respondeu "Sim, a tua mensagem anterior foi: 'responde apenas: ok'", demonstrando que o contexto da sessão anterior foi preservado correctamente.

**Observação no chunk system/init:** O `session_id` no init é o MESMO que foi passado com `--resume`, confirmando que a sessão foi retomada (não criada de novo):
```json
{"type": "system", "subtype": "init", "session_id": "dc46a85d-3307-400a-9ac1-551eddd2d00b", ...}
```

**Observação de cache:** O chunk `assistant` mostrou `cache_read_input_tokens: 23074`, confirmando que o contexto anterior foi lido da cache (não recalculado).

---

## Teste E — --agent + --resume em conjunto

**Comando:** `claude --print --output-format stream-json --verbose --agent discovery --resume a591af22-839a-4b7e-a4bc-2ecbed406e4f "lembras-te do que falámos?"`

**Resultado:** PASSOU

**Confirmação:** `--agent` e `--resume` funcionam sem conflito. O agente `discovery` foi carregado E a sessão anterior foi retomada. O modelo confirmou o contexto (lembrava o projecto Agent Office e o estado do discovery).

**Chunks adicionais observados neste teste:**
- `system/thinking_tokens` — chunks emitidos durante raciocínio do modelo com campos `estimated_tokens` e `estimated_tokens_delta`.
- `user` com `tool_result` — emitido quando o agente usou a tool `Read` para ler o CHECKPOINT.md.

---

## Descobertas Críticas para a Arquitectura

### 1. --verbose é OBRIGATÓRIO

O comando correcto para o `runner.py` é:
```
claude --agent <nome> --print --output-format stream-json --verbose [--resume <id>] "<msg>"
```
Sem `--verbose`, o CLI retorna exit code 1 com mensagem de erro.

### 2. session_id disponível no primeiro chunk

O `session_id` está no chunk `system/init` — o primeiro chunk emitido. O `runner.py` deve extraí-lo imediatamente ao processar o primeiro chunk, antes de qualquer chunk `assistant`.

### 3. session_id consistente em toda a sessão

O mesmo UUID é repetido em todos os chunks da sessão. Não muda durante uma invocação. Ao usar `--resume`, o `session_id` no `system/init` confirma qual sessão foi retomada.

### 4. Chunks parciais do assistant (com --include-partial-messages)

O chunk `assistant` observado tem `stop_reason: null` — indica que é uma mensagem parcial (streaming). O campo `content[0].text` pode conter o texto parcial acumulado até ao momento. Para streaming real de tokens, usar `--include-partial-messages`.

### 5. Chunks a ignorar no runner.py

O `runner.py` deve processar apenas os tipos relevantes e ignorar os restantes:
- `system/init` — extrair `session_id`, registar versão
- `assistant` — emitir conteúdo ao WebSocket
- `result/success` — emitir `{ type: "done" }`
- `result/error` ou `is_error: true` — emitir `{ type: "error" }`
- `system/thinking_tokens` — ignorar (não enviar ao utilizador)
- `rate_limit_event` — ignorar (ou logar em debug)
- `user` (tool_result) — ignorar

### 6. Aviso de stdin no stderr

O CLI emite sempre no stderr:
```
Warning: no stdin data received in 3s, proceeding without it.
```
Este aviso é inofensivo quando stdin não está ligado. O runner.py deve separar stdout (stream JSON) de stderr (logs/avisos) e não confundir os dois.

Para suprimir o aviso, redirigir stdin de null:
```python
subprocess.Popen([...], stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
```

### 7. Python 3.14.5 instalado (superior ao mínimo 3.11)

Python 3.14.5 está disponível. A stack aprovada exigia Python 3.11+. Compatível.

---

## Decisões impostas pelos resultados

| Decisão | Fundamento |
|---------|-----------|
| Adicionar `--verbose` ao comando no runner.py | Obrigatório — sem ele, stream-json falha |
| Extrair session_id do chunk `system/init` | É o primeiro chunk e o mais fiável |
| Usar `stdin=subprocess.DEVNULL` no Popen | Evita o aviso de stdin no stderr |
| Separar stdout e stderr no subprocess | Stderr contém avisos; stdout contém o stream JSON |
| Ignorar chunks de tipo `system/thinking_tokens` e `rate_limit_event` | Não têm conteúdo relevante para o utilizador |
| Incluir `--include-partial-messages` para streaming real | Necessário para ver tokens à medida que chegam |

---

## Ambiente confirmado

| Componente | Versão | Estado |
|-----------|--------|--------|
| Claude CLI | 2.1.168 | Instalado e funcional |
| Python | 3.14.5 | Instalado — superior ao mínimo exigido (3.11+) |
| pip | 26.1.1 | Funcional |
| PowerShell | 5.1 (Windows 11) | Disponível |
| OS | Windows 11 Home 10.0.26200 | Confirmado |

---

## Estrutura criada

```
agent-office/
├── backend/
│   └── db/
├── frontend/
│   ├── css/
│   └── js/
├── data/
├── requirements.txt
├── .env.example
├── .gitignore
└── start.ps1
```
