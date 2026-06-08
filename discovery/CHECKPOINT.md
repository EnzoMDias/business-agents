# CHECKPOINT — Discovery Session

**Projecto:** Agent Office (Interface Visual para Agentes Claude Code)
**Data:** 2026-06-08
**Estado:** DISCOVERY COMPLETO — pronto para produção
**Agente actual:** synthesizer
**Próximo agente:** devops

---

## Estado final

O ciclo de discovery está concluído. Todos os documentos foram gerados e estão
prontos para o departamento de produção.

Documentos produzidos:
- `discovery/BRIEF.md` — resumo executivo
- `discovery/ARCHITECTURE.md` — arquitectura consolidada com correcções do challenger
- `discovery/DECISIONS.md` — 8 ADRs com alternativas descartadas
- `discovery/STACK.md` — stack completa com versões e justificações
- `discovery/TASKS.md` — 12 tarefas ordenadas por dependência

---

## Problema real (versão final)

O utilizador tem 9 subagentes Claude Code em `.claude/agents/` e a única forma de
interagir com eles é via terminal. O terminal não comunica qual agente está activo,
não persiste o contexto de conversação de forma acessível e não torna o workflow
multi-agente intuitivo.

**O problema real é:** ausência de uma interface de conversação que (1) apresente
visualmente quais agentes existem, (2) indique qual está activo em cada momento,
e (3) mantenha sessão contínua com memória de contexto — tal como o chat do Claude.ai,
mas para os agentes locais do utilizador.

---

## Contexto técnico confirmado

- Sistema: Windows 11 Home (local, sem deploy)
- Agentes Claude Code em: `.claude/agents/` (9 agentes: discovery, architect,
  challenger, synthesizer, backend_dev, frontend_dev, dba, devops, qa)
- Docker Agent: **fora de escopo** — completamente eliminado
- Interacção actual: exclusivamente via terminal
- Stack aprovada: Python FastAPI + HTML/CSS/JS vanilla, sem frameworks JS pesados
- Arranque: script PowerShell
- Streaming: WebSocket em tempo real

---

## Decisões chave aprovadas

| Decisão | Resolução |
|---------|-----------|
| Routing de agentes | Flag nativa `--agent <nome>` — sem keyword matching |
| Agente activo | Estado da UI (clique na estação) — não inferido do texto |
| Contexto de sessão | `--resume <session_id>` — stateless por invocação |
| Reset de sessão | Sempre explícito com aviso ao utilizador — nunca silencioso |
| Session ID | Backend controla UUID próprio; `cli_session_id` é campo separado |
| `--fork-session` | Anti-pattern proibido, documentado no código |
| Defensive parsing | Obrigatório no runner.py com log de campos desconhecidos |
| Binding | Exclusivamente 127.0.0.1 |

---

## Pendências para produção (confirmadas em T01)

1. Versão mínima do claude CLI que suporta `--agent` com subagentes locais
2. Confirmar em que chunk do stream-json aparece o `session_id`
3. Confirmar que `--agent architect` invoca `.claude/agents/architect.md`

---

## Riscos activos

| Risco | Mitigação |
|-------|-----------|
| `--resume` com limitações não documentadas | Confirmado empiricamente em T01 antes de implementar |
| Schema stream-json pode mudar | Defensive parsing com fallback e log |
| Windows Firewall no port 8000 | `start.ps1` informa utilizador |

---

## Histórico de iterações

| # | Data | Acção |
|---|------|-------|
| 1 | 2026-06-08 | Análise inicial do escopo. 5 perguntas formuladas. Aguarda resposta. |
| 2 | 2026-06-08 | P1 parcialmente respondida. Aprofundamento solicitado. |
| 3 | 2026-06-08 | Todas as respostas recebidas. Lacunas fechadas. Estado: PRONTO PARA ARCHITECT. |
| 4 | 2026-06-08 | Debate architect vs. challenger concluído. Correcções integradas. |
| 5 | 2026-06-08 | Synthesizer gerou documentos finais. Discovery completo. |
