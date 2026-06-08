# STACK.md — Agent Office

**Projecto:** Agent Office  
**Data:** 2026-06-08  
**Estado:** Aprovado — pronto para produção  

---

## Resumo

| Camada | Tecnologia | Versão Mínima |
|--------|-----------|---------------|
| Runtime | Python | 3.11 |
| Web framework | FastAPI | 0.111 |
| ASGI server | Uvicorn | 0.29 |
| WebSocket | FastAPI WebSocket (built-in) | — |
| Base de dados | SQLite | 3.35 (built-in Python) |
| ORM / query | sqlite3 (stdlib) | — |
| Frontend | HTML5 + CSS3 + JavaScript ES2022 | — |
| CLI invocado | Claude CLI (Claude Code) | ver pendência abaixo |
| Arranque | PowerShell 5.1+ | Windows 11 |
| Variáveis de ambiente | python-dotenv | 1.0 |
| Validação | Pydantic v2 | 2.0 |

---

## Detalhes por Componente

### Python 3.11+

**Justificação:** suporte nativo a `tomllib`, melhorias de performance no asyncio,
`ExceptionGroup` para gestão de erros em tarefas async. Disponível no Windows 11
via instalador oficial ou `winget`.  
**Descartado:** Python 3.9/3.10 — sem suporte a algumas APIs async usadas pelo FastAPI moderno.

---

### FastAPI 0.111+

**Justificação:** suporte nativo a WebSocket sem dependências externas, integração
directa com Pydantic v2, servidor de ficheiros estáticos para o frontend, geração
automática de docs (útil para debug). Asyncio nativo alinha com streaming.  
**Descartado:** Flask — sem suporte nativo a WebSocket nem async. Django — overhead
desnecessário para uma app single-page local.

---

### Uvicorn 0.29+

**Justificação:** servidor ASGI de referência para FastAPI. Baixo overhead, suporte
a `--reload` para desenvolvimento.  
**Descartado:** Hypercorn, Daphne — menos testados com FastAPI, sem vantagem no contexto local.

---

### SQLite (stdlib)

**Justificação:** zero dependências externas, ficheiro único em `data/sessions.db`,
adequado para carga local (1 utilizador, sem concorrência). Backup trivial (copiar ficheiro).  
**Descartado:** PostgreSQL — overkill para uso pessoal local. Redis — desnecessário
sem necessidade de TTL ou pub/sub. SQLAlchemy — overhead de ORM desnecessário para
schema simples de 2 tabelas.

---

### WebSocket (FastAPI built-in)

**Justificação:** streaming de chunks do CLI em tempo real sem polling. Bidirecional.
Nativo no FastAPI sem bibliotecas adicionais.  
**Descartado:** Server-Sent Events (SSE) — unidireccional, impede envio de mensagens
do browser sem segundo canal HTTP. Long polling — ineficiente para streaming contínuo.

---

### HTML5 + CSS3 + JavaScript ES2022 (vanilla)

**Justificação:** aprovado explicitamente pelo utilizador. Sem frameworks JS pesados.
Sem build step. Sem `node_modules`. O frontend é servido directamente pelo FastAPI
como ficheiros estáticos.  
**Descartado:** React, Vue, Svelte — requerem build toolchain (Node.js, bundler),
aumentam complexidade de setup sem benefício para uma UI local single-user.

---

### python-dotenv 1.0+

**Justificação:** gestão de variáveis de ambiente via ficheiro `.env`. Padrão da
indústria, zero magia.  
**Descartado:** hardcoding — violação das regras do projecto.

---

### Pydantic v2 2.0+

**Justificação:** incluído com FastAPI. Validação dos payloads WebSocket (agent name,
message content). Evita inputs malformados antes de chegarem ao runner.  
**Nota:** usar apenas para modelos de request/response — não mapear modelos SQLite
para Pydantic (sqlite3 stdlib é suficiente).

---

## Claude CLI

**Flags usadas:**
```
claude --agent <nome> --print --output-format stream-json [--resume <session_id>] "<msg>"
```

**Flags proibidas:**
- `--fork-session` — anti-pattern documentado em ARCHITECTURE.md

**Pendência:** confirmar versão mínima do claude CLI que suporta `--agent` com
subagentes locais em `.claude/agents/`. Esta verificação deve ser feita pelo
`/agent devops` no setup do ambiente.

---

## PowerShell

**Versão:** 5.1 (Windows 11 built-in)  
**Justificação:** disponível sem instalação adicional. O `start.ps1` faz:
1. Verificar Python instalado
2. Criar/activar venv
3. Instalar dependências (`pip install -r requirements.txt`)
4. Verificar se port 8000 está livre
5. Arrancar uvicorn

**Não usa:** PowerShell 7 — requer instalação separada, sem vantagem para este uso.

---

## O que fica fora da stack

| Tecnologia | Motivo de exclusão |
|-----------|-------------------|
| Docker | Fora de escopo — decisão do utilizador |
| Node.js / npm | Sem frameworks JS — não necessário |
| Redis | Sem necessidade de cache distribuído |
| SQLAlchemy | Overhead desnecessário para 2 tabelas |
| Celery / task queue | Sem jobs assíncronos em background |
| Nginx | Sem reverse proxy — local only |
| HTTPS/TLS | Sem exposição externa — localhost only |
