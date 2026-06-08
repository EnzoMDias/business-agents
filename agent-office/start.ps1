# Agent Office — arranque local
# Verifica Python, cria venv se necessário, instala deps, inicia servidor

$ErrorActionPreference = "Stop"

# --- 1. Verificar Python 3.11+ ---
$pythonCmd = $null
foreach ($cmd in @("python", "python3")) {
    try {
        $ver = & $cmd --version 2>&1
        if ($ver -match "Python (\d+)\.(\d+)") {
            $major = [int]$Matches[1]
            $minor = [int]$Matches[2]
            if ($major -gt 3 -or ($major -eq 3 -and $minor -ge 11)) {
                $pythonCmd = $cmd
                Write-Host "Python encontrado: $ver" -ForegroundColor Green
                break
            } else {
                Write-Host "AVISO: Python $ver encontrado mas e necessario 3.11+." -ForegroundColor Yellow
            }
        }
    } catch { }
}

if (-not $pythonCmd) {
    Write-Host "ERRO: Python 3.11+ nao encontrado no PATH." -ForegroundColor Red
    Write-Host "Instala em: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# --- 2. Carregar .env se existir ---
$envFile = Join-Path $PSScriptRoot ".env"
$envExample = Join-Path $PSScriptRoot ".env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host ".env criado a partir de .env.example" -ForegroundColor Cyan
    }
}

$PORT = 8000
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    foreach ($line in $envContent) {
        if ($line -match "^PORT=(\d+)") {
            $PORT = [int]$Matches[1]
        }
    }
}

# --- 3. Verificar se o port esta livre ---
$portInUse = $null
try {
    $portInUse = Get-NetTCPConnection -LocalPort $PORT -ErrorAction SilentlyContinue
} catch { }

if ($portInUse) {
    Write-Host "ERRO: Port $PORT ja esta em uso." -ForegroundColor Red
    Write-Host "Altera PORT no ficheiro .env ou liberta o port antes de arrancar." -ForegroundColor Yellow
    exit 1
}

# --- 4. Informar sobre Windows Firewall ---
Write-Host ""
Write-Host "INFO: Esta aplicacao corre exclusivamente em 127.0.0.1 (localhost)." -ForegroundColor Cyan
Write-Host "      Nao e necessario abrir o Windows Firewall para uso local." -ForegroundColor Cyan
Write-Host ""

# --- 5. Criar venv se nao existir ---
$venvDir = Join-Path $PSScriptRoot "venv"
if (-not (Test-Path $venvDir)) {
    Write-Host "A criar ambiente virtual..." -ForegroundColor Cyan
    & $pythonCmd -m venv $venvDir
    Write-Host "Venv criado em: $venvDir" -ForegroundColor Green
}

# --- 6. Activar venv e instalar/actualizar dependencias ---
$activateScript = Join-Path $venvDir "Scripts\Activate.ps1"
if (-not (Test-Path $activateScript)) {
    Write-Host "ERRO: Script de activacao do venv nao encontrado: $activateScript" -ForegroundColor Red
    exit 1
}

. $activateScript
Write-Host "Venv activado." -ForegroundColor Green

$requirementsFile = Join-Path $PSScriptRoot "requirements.txt"
Write-Host "A instalar dependencias..." -ForegroundColor Cyan
pip install -r $requirementsFile --quiet
Write-Host "Dependencias instaladas." -ForegroundColor Green

# --- 7. Arrancar servidor ---
Write-Host ""
Write-Host "A arrancar Agent Office em http://localhost:$PORT ..." -ForegroundColor Green
Write-Host "Pressiona Ctrl+C para parar." -ForegroundColor Yellow
Write-Host ""

# Abrir browser apos 2 segundos em background
$browserJob = Start-Job -ScriptBlock {
    param($url)
    Start-Sleep 2
    Start-Process $url
} -ArgumentList "http://localhost:$PORT"

# Iniciar uvicorn
$uvicornArgs = @(
    "backend.main:app",
    "--host", "127.0.0.1",
    "--port", "$PORT",
    "--reload"
)

try {
    Set-Location $PSScriptRoot
    uvicorn @uvicornArgs
} finally {
    Remove-Job -Job $browserJob -Force -ErrorAction SilentlyContinue
}
