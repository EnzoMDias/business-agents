# Escopo — Agent Office (Interface Pixel Art para Agentes de IA)

## Ideia

Quero uma interface web local com visual de escritório em pixel art onde cada
personagem representa um agente de IA. A interface substitui o terminal como
forma de interagir com os agentes Docker Agent e Claude Code.

## Contexto

Tenho dois sistemas de agentes configurados localmente em Windows:
- Docker Agent com ficheiros `discovery.yml` e `production.yml`
- Claude Code com subagentes em `.claude/agents/`

Hoje interajo com eles exclusivamente via terminal. Quero uma interface gráfica
que faça essa ponte de forma visual e intuitiva.

## Visual

Escritório em pixel art estilo RPG (inspiração: Stardew Valley, RPG Maker).
O escritório tem mesas, computadores, plantas e cadeiras.
Cada agente é representado por uma personagem pixel art sentada na sua mesa:

- **root** — coordinator, mesa central, personagem em destaque
- **discovery** — analista, mesa com post-its
- **architect** — arquitecto, mesa com planta/diagrama
- **challenger** — revisor, mesa com documentos
- **synthesizer** — escritor, mesa com folhas
- **backend_dev** — developer, mesa com ecrãs de código
- **frontend_dev** — designer, mesa com monitor colorido
- **dba** — analista de dados, mesa com servidor
- **devops** — engenheiro, mesa com rack de servidores
- **qa** — testador, mesa com checklist

## Interacção

- Clicar numa personagem selecciona esse agente como activo.
- A personagem activa tem um indicador visual (brilho, seta, balão).
- O chat em baixo comunica com o agente activo.
- O chat mostra sempre: agente activo, modelo, provider, estado (idle / a processar).

## Interface

- **Área principal** — escritório pixel art interactivo (70% do ecrã)
- **Painel de chat** — em baixo ou lateral (30% do ecrã)
  - Campo de input para enviar mensagem
  - Área de resposta com output em tempo real (streaming)
  - Histórico da sessão com separação por agente
  - Indicador de tokens consumidos
  - Botão para gravar checkpoint
- **Painel de estado** — agente activo, modelo, provider, sessão actual

## Backend

- Servidor local em FastAPI (Python)
- Faz a ponte entre a interface web e o Docker Agent / Claude Code
- Executa os comandos via subprocess e devolve o output em tempo real via WebSocket
- Gere sessões e histórico
- Corre em background como serviço local Windows

## Requisitos técnicos

- Corre 100% localmente em Windows — sem deploy, sem cloud
- Abre no browser (localhost)
- Stack: Python (FastAPI) + HTML/CSS/JS vanilla
- Pixel art gerada programaticamente com canvas ou assets SVG simples
- Sem frameworks JS pesados (sem React, sem Vue)
- Arranque simples: um script PowerShell que inicia o backend e abre o browser

## Requisitos não funcionais

- Resposta em tempo real (streaming do output dos agentes)
- Interface responsiva para uso em monitor widescreen
- Sessão persistente — não perde histórico ao actualizar a página
- Arranque em menos de 5 segundos
- Sem autenticação — uso pessoal local

## Critérios de sucesso

- Consigo seleccionar um agente clicando na personagem
- Consigo enviar uma mensagem e ver a resposta em tempo real
- Sei sempre com que agente estou a falar e qual o estado
- O histórico da sessão está visível
- Não preciso de abrir o terminal para interagir com os agentes

## O que está fora de escopo

- Autenticação ou multi-utilizador
- Deploy em servidor remoto
- Mobile
- Suporte a outros sistemas operativos nesta fase
