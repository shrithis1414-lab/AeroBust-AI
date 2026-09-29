# ==============================================================================
# AeroBust-AI: Windows PowerShell Startup Script
# Indian Weather Forecast Bust & Confidence Prediction System (Days 1–10)
# ==============================================================================

$ProjectRoot = $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "          Starting AeroBust-AI Operational Weather System             " -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Check Python
$pythonCmd = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $pythonCmd) {
    Write-Host "[!] Error: Python not found on PATH." -ForegroundColor Red
    exit 1
}
Write-Host "[*] Python interpreter: $(python --version)" -ForegroundColor Gray

# 2. Check / Train ML Model
$modelFile = Join-Path $BackendDir "saved_models\bust_model.joblib"
if (-not (Test-Path $modelFile)) {
    Write-Host "[*] Model weights not found. Training AeroBust-AI model..." -ForegroundColor Yellow
    Set-Location $ProjectRoot
    python -m backend.app.ml.train
} else {
    Write-Host "[✓] Model weights verified: $modelFile" -ForegroundColor Green
}

# 3. Start Backend
Write-Host "[*] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Cyan
Set-Location $ProjectRoot
$backendJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location $root
    python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
} -ArgumentList $ProjectRoot

# 4. Start Frontend
Write-Host "[*] Starting Vite Frontend on http://localhost:5173..." -ForegroundColor Cyan
Set-Location $FrontendDir
if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
    Write-Host "[*] Installing frontend npm dependencies..." -ForegroundColor Gray
    npm install
}

$frontendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev
} -ArgumentList $FrontendDir

Start-Sleep -Seconds 4

Write-Host "======================================================================" -ForegroundColor Green
Write-Host "          AeroBust-AI Operational Dashboard is Live!                  " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  [Web Dashboard] : http://localhost:5173" -ForegroundColor Yellow
Write-Host "  [REST API Docs] : http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "  [Health Probe]  : http://127.0.0.1:8000/api/health" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "Press Ctrl+C to terminate background jobs." -ForegroundColor Gray

try {
    while ($true) {
        Start-Sleep -Seconds 2
    }
} finally {
    Write-Host "`n[*] Terminating AeroBust-AI servers..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue | Out-Null
    Remove-Job $backendJob -ErrorAction SilentlyContinue | Out-Null
    Stop-Job $frontendJob -ErrorAction SilentlyContinue | Out-Null
    Remove-Job $frontendJob -ErrorAction SilentlyContinue | Out-Null
    Write-Host "[✓] Stopped." -ForegroundColor Green
}
