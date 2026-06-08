# start_production.ps1 — Departamento de Produção
# Edita as variáveis abaixo para cada máquina onde usares o time.

$env:ANTHROPIC_API_KEY = "a-tua-chave-aqui"
$env:PROJECT_PATH      = "C:\caminho\para\o\projecto"   # pasta do projecto a desenvolver
$env:DISCOVERY_PATH    = "$PSScriptRoot\discovery"       # mesma pasta do discovery
$env:AGENTS_PATH       = $PSScriptRoot

docker agent run production.yml
