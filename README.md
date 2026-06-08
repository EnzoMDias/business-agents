# business-agents

Time multi-agent completo para desenvolvimento de software, organizado em dois
departamentos: **Descoberta** e **Produção**.

## Como funciona

```
Ideia inicial
     ↓
discovery.yml  →  debate  →  briefing aprovado por ti
                                      ↓
                             production.yml  →  implementação  →  review  →  aprovação tua
```

O departamento de descoberta define tudo. O departamento de produção implementa
com base no que foi aprovado. A transição entre os dois é sempre manual e explícita.

## Estrutura

```
business-agents/
├── discovery.yml          # Departamento de Descoberta
├── production.yml         # Departamento de Produção
├── start_discovery.ps1    # Arranque do discovery (não commitado)
├── start_production.ps1   # Arranque da produção (não commitado)
├── .gitignore             # Ignora os scripts com a chave
└── discovery/             # Documentos gerados pelo discovery (criados automaticamente)
    ├── BRIEF.md
    ├── ARCHITECTURE.md
    ├── DECISIONS.md
    ├── STACK.md
    └── TASKS.md
```

## Departamento de Descoberta

**Ficheiro:** `discovery.yml`

| Agente | Papel |
|---|---|
| `root` | Coordinator — conduz o processo, garante que nada é fechado sem aprovação |
| `discovery` | Extrai o problema real, identifica lacunas, formula perguntas certas |
| `architect` | Propõe stack e arquitectura com alternativas e trade-offs |
| `challenger` | Questiona a proposta do architect, aponta riscos e pontos cegos |
| `synthesizer` | Consolida o debate e gera os documentos finais aprovados |

**Documentos gerados na pasta `discovery/`:**
- `BRIEF.md` — resumo executivo do projecto
- `ARCHITECTURE.md` — arquitectura aprovada
- `DECISIONS.md` — registo de decisões (ADRs)
- `STACK.md` — stack técnica completa com justificação
- `TASKS.md` — primeiras tarefas para produção

## Departamento de Produção

**Ficheiro:** `production.yml`

| Agente | Papel |
|---|---|
| `root` | Coordinator — orquestra o time, valida entregas |
| `architect` | Detalha a estrutura técnica e os contratos |
| `backend_dev` | Implementa o backend completo |
| `frontend_dev` | Implementa o frontend completo |
| `dba` | Schema, migrations, índices, optimizações de BD |
| `devops` | Ambiente, instalações, dependências, configurações |
| `qa` | Testes, validação, parecer de entrega |

Os agentes de produção têm acesso total ao sistema via shell — instalam dependências,
escrevem ficheiros e correm comandos directamente no projecto.

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado
- Docker Agent instalado:
  ```powershell
  winget install Docker.Agent
  ```
- Chave da API Anthropic — obtém em [console.anthropic.com](https://console.anthropic.com)

## Configuração inicial

**1. Clona o repositório**
```powershell
git clone https://github.com/EnzoMDias/business-agents.git
cd business-agents
```

**2. Cria os scripts de arranque** (não são commitados — ficam só na tua máquina)

`start_discovery.ps1`:
```powershell
$env:ANTHROPIC_API_KEY = "a-tua-chave-aqui"
$env:DISCOVERY_PATH    = "$PSScriptRoot\discovery"
$env:AGENTS_PATH       = $PSScriptRoot

if (!(Test-Path $env:DISCOVERY_PATH)) {
    New-Item -ItemType Directory -Path $env:DISCOVERY_PATH | Out-Null
}

docker agent run discovery.yml
```

`start_production.ps1`:
```powershell
$env:ANTHROPIC_API_KEY = "a-tua-chave-aqui"
$env:PROJECT_PATH      = "C:\caminho\para\o\projecto"
$env:DISCOVERY_PATH    = "$PSScriptRoot\discovery"
$env:AGENTS_PATH       = $PSScriptRoot

docker agent run production.yml
```

## Utilização

**Fase 1 — Descoberta:**
```powershell
.\start_discovery.ps1
# Partilha a tua ideia com o coordinator
# Responde às perguntas
# Aprova o briefing final
```

**Fase 2 — Produção** (só após briefing aprovado):
```powershell
.\start_production.ps1
# O coordinator lê o briefing e começa a implementar
# Validas cada entrega antes de avançar
```

**Comandos disponíveis:**
```powershell
# Discovery
docker agent run discovery.yml "status"

# Produção
docker agent run production.yml "status"
docker agent run production.yml "review"
docker agent run production.yml "validate_docs"
```

## Segurança

- Os scripts `start_*.ps1` estão no `.gitignore` — a chave da API nunca vai para o Git.
- O discovery só escreve na pasta `discovery/`.
- A produção só escreve em `PROJECT_PATH` e `DISCOVERY_PATH`.
