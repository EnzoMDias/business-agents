# business-agents — Claude Code

Time multi-agent para desenvolvimento de software organizado em dois departamentos:
**Descoberta** e **Produção**.

## Como funciona

O utilizador descreve uma ideia. O departamento de descoberta conduz o processo
até ao briefing aprovado. O departamento de produção implementa com base nesse briefing.
A transição entre departamentos é sempre validada pelo utilizador.

## Agentes disponíveis

### Departamento de Descoberta
- `/agent discovery` — extrai o problema real, formula perguntas certas
- `/agent architect` — propõe stack e arquitectura com trade-offs
- `/agent challenger` — questiona propostas, aponta riscos e pontos cegos
- `/agent synthesizer` — consolida o debate e gera os documentos finais

### Departamento de Produção
- `/agent backend_dev` — implementa o backend completo
- `/agent frontend_dev` — implementa o frontend completo
- `/agent dba` — schema, migrations, índices, optimizações de BD
- `/agent devops` — ambiente, instalações, dependências, configurações
- `/agent qa` — testes, validação, parecer de entrega

## Regras globais

- Nada é fechado sem aprovação explícita do utilizador.
- Nada é implementado sem tarefa rastreável em `discovery/TASKS.md`.
- Stack definida no discovery — não alterar sem aprovação.
- Nunca hardcodar segredos — usar variáveis de ambiente.
- Commits pequenos e descritivos após cada entrega aprovada.

## Sugestão de próximo agente

**Regra obrigatória para todos os agentes:** no final de cada resposta, sempre
indicar o próximo passo recomendado neste formato:

```
---
➡ Próximo agente: /agent nome-do-agente
Motivo: explicação em uma linha do porquê.
```

Se não houver próximo agente (aguarda resposta do utilizador), indica:

```
---
⏳ Aguarda a tua resposta antes de avançar.
```

## Checkpoint

O estado da sessão de discovery é gravado em `discovery/CHECKPOINT.md`.
Quando retomares uma sessão, lê o checkpoint antes de qualquer acção:
- Se existir: resume o estado e pergunta se quer continuar ou recomeçar.
- Se não existir: começa do zero com a ideia inicial do utilizador.

## Estrutura de ficheiros gerados

```
discovery/
├── CHECKPOINT.md      # estado da sessão (gravado automaticamente)
├── BRIEF.md           # resumo executivo aprovado
├── ARCHITECTURE.md    # arquitectura aprovada
├── DECISIONS.md       # registo de decisões (ADRs)
├── STACK.md           # stack técnica completa
└── TASKS.md           # primeiras tarefas para produção
```
