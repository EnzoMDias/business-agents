# start_discovery.ps1 — Departamento de Descoberta
# Edita as variáveis abaixo para cada máquina onde usares o time.

$env:ANTHROPIC_API_KEY = "a-tua-chave-aqui"
$env:DISCOVERY_PATH    = "$PSScriptRoot\discovery"   # pasta onde os docs do discovery são gerados
$env:AGENTS_PATH       = $PSScriptRoot

# Cria a pasta de discovery se não existir
if (!(Test-Path $env:DISCOVERY_PATH)) {
    New-Item -ItemType Directory -Path $env:DISCOVERY_PATH | Out-Null
}

docker agent run discovery.yml
