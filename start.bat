@echo off
title AeroBust-AI Launcher
echo ======================================================================
echo           Starting AeroBust-AI Meteorological System...
echo ======================================================================

cd /d "%~dp0"

REM 1. Start FastAPI backend in a background window
start "AeroBust-AI Backend (Port 8000)" cmd /k "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

REM 2. Start Vite frontend in a background window
cd frontend
start "AeroBust-AI Frontend (Port 5173)" cmd /k "npm run dev"

REM 3. Wait a few seconds for services to spin up
timeout /t 3 /nobreak >nul

REM 4. Open browser automatically
start http://localhost:5173

echo ======================================================================
echo   AeroBust-AI is running!
echo   Dashboard: http://localhost:5173
echo   API Docs:  http://127.0.0.1:8000/docs
echo ======================================================================
pause
