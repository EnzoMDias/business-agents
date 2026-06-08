# business-agents — Claude Code

Time multi-agent para desenvolvimento de software organizado em dois departamentos:
**Descoberta** e **Produção**. Esta branch usa Claude Code em vez do Docker Agent —
não requer chave de API separada, funciona com a assinatura Pro do claude.ai.

## Como funciona

```
Ideia inicial
     ↓
/agent discovery  →  perguntas  →  respostas
     ↓
/agent architect  →  proposta de stack e arquitectura
     ↓
/agent challenger →  riscos e pontos cegos
     ↓
Utilizador aprova
     ↓
/agent synthesizer → gera documentos em discovery/
     ↓
/agent devops     →  prepara ambiente
/agent dba        →  cria schema
/agent backend_dev → implementa backend
/agent frontend_dev → implementa frontend
/agent qa         →  valida e emite parecer
     ↓
Utilizador aprova → commit
```

O Claude Code sugere sempre o próximo agente a invocar no final de cada resposta.
O teu trabalho é validar e invocar o agente sugerido com `/agent nome`.

## Estrutura

```
business-agents/  (branch: claude-code)
├── CLAUDE.md                    # contexto global e regras de orquestração
├── README.md
└── .claude/
    └── agents/
        ├── discovery.md         # extrai o problema real
        ├── architect.md         # propõe stack e arquitectura
        ├── challenger.md        # questiona e aponta riscos
        ├── synthesizer.md       # gera os documentos finais
        ├── backend_dev.md       # implementa o backend
        ├── frontend_dev.md      # implementa o frontend
        ├── dba.md               # schema, migrations, índices
        ├── devops.md            # ambiente e instalações
        └── qa.md                # testes e validação
```

## Pré-requisitos

- Subscrição Claude Pro — [claude.ai](https://claude.ai)
- Claude Code instalado:
  ```powershell
  npm install -g @anthropic-ai/claude-code
  ```

## Configuração inicial

**1. Clona o repositório na branch claude-code**
```powershell
git clone -b claude-code https://github.com/EnzoMDias/business-agents.git
cd business-agents
```

**2. Abre o Claude Code na pasta**
```powershell
claude
```

O Claude Code lê o `CLAUDE.md` automaticamente e está pronto a usar.

## Utilização

**Iniciar o discovery:**
```
/agent discovery
```
Partilha a tua ideia. O agente conduz o processo e sugere o próximo passo.

**Retomar uma sessão após pausa:**
```
/agent discovery
```
Se existir `discovery/CHECKPOINT.md`, o agente retoma automaticamente de onde parou.

**Fluxo típico de agentes:**
```
/agent discovery     → define o problema
/agent architect     → propõe stack e arquitectura  
/agent challenger    → questiona a proposta
/agent synthesizer   → gera os documentos (após aprovação)
/agent devops        → prepara o ambiente
/agent dba           → cria o schema
/agent backend_dev   → implementa o backend
/agent frontend_dev  → implementa o frontend
/agent qa            → valida e emite parecer
```

## Checkpoint — retomar sessões

O estado do discovery é gravado automaticamente em `discovery/CHECKPOINT.md`.
Quando retomares após dias de pausa, invoca `/agent discovery` — ele lê o
checkpoint e continua de onde parou sem precisares de repetir nada.

## Comparação com a branch main (Docker Agent)

| | Docker Agent (main) | Claude Code (claude-code) |
|---|---|---|
| Orquestração | Automática | Semi-manual (/agent nome) |
| Custo | ~€20-50/mês API | Incluído no Pro (~€18/mês) |
| Próximo agente | Automático | Sugerido, tu invocas |
| Checkpoint | Automático | Automático |
| Acesso ao filesystem | Total | Total |
| Acesso ao terminal | Total | Total |
