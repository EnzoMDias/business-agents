# BRIEF.md — Agent Office

**Projecto:** Agent Office  
**Data:** 2026-06-08  
**Estado:** Aprovado — pronto para produção  

---

## O que vamos construir

Uma interface web local que transforma os teus 9 subagentes Claude Code numa
experiência de chat — igual ao Claude.ai, mas para os agentes que correm na tua
máquina.

Hoje interages com eles via terminal. Não sabes qual está activo, o contexto
perde-se entre sessões e trocar de agente é manual e invisível.

Com o Agent Office:
- Abres o browser em `localhost:8000`
- Vês os 9 agentes num "escritório" visual — cada um na sua estação
- Clicas no agente que queres usar
- Escreves normalmente, como no Claude.ai
- A resposta aparece em tempo real, linha a linha
- O contexto fica guardado — amanhã continua de onde ficaste

---

## O que podes fazer quando estiver pronto

- Conversar com qualquer agente com um clique, sem abrir terminal
- Ver claramente qual agente está activo em cada momento
- Ter histórico completo de todas as conversas, organizado por agente
- Trocar de agente a meio de uma sessão de trabalho sem perder contexto
- Quando um agente "esquece" o contexto (sessão expirada), receber aviso
  claro e decidir o que fazer — sem surpresas

---

## O que fica fora desta versão

- Acesso de outros dispositivos da rede (só funciona no teu computador)
- Utilização em telemóvel ou tablet
- Múltiplas conversas em paralelo com o mesmo agente
- Execução automática de agentes (o utilizador é sempre quem decide)
- Qualquer tipo de cloud, Docker ou deploy externo

---

## Estimativa de esforço por fase

| Fase | Conteúdo | Estimativa |
|------|----------|-----------|
| 1 — Setup | Ambiente, scaffold, script de arranque | 4-5h |
| 2 — Backend | Base de dados, runner CLI, WebSocket, API | 13-15h |
| 3 — Frontend | HTML, CSS pixel art, JavaScript client | 10-12h |
| 4 — Validação | Testes end-to-end, ajustes finais | 3-4h |
| **Total** | | **30-36h** |

As estimativas assumem que o ambiente está configurado e o claude CLI está
funcional. A fase mais incerta é o runner (T06) — depende do comportamento
exacto do stream-json do CLI, que precisa de ser confirmado empiricamente.

---

## Risco principal

O mecanismo `--resume <session_id>` do Claude CLI é o coração do sistema.
Se esse mecanismo tiver limitações não documentadas (timeout agressivo, IDs
que mudam, comportamento diferente no Windows), o modelo de sessão precisa
de ser ajustado. O devops confirma isto na primeira tarefa (T01) antes de
qualquer implementação.
