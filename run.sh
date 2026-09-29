#!/usr/bin/env bash
set -e

# ==============================================================================
# AeroBust-AI: Unified Local Startup Script
# Indian Weather Forecast Bust & Confidence Prediction System (Days 1–10)
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "======================================================================"
echo "          Starting AeroBust-AI Operational Weather System             "
echo "======================================================================"

# 1. Python Environment Setup
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo "[!] Error: Python not found on PATH."
    exit 1
fi

echo "[*] Python interpreter: $($PYTHON_CMD --version)"

# Check or create venv
VENV_DIR="$PROJECT_ROOT/.venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "[*] Creating Python virtual environment in $VENV_DIR..."
    $PYTHON_CMD -m venv "$VENV_DIR"
fi

# Activate virtual environment
if [ -f "$VENV_DIR/bin/activate" ]; then
    source "$VENV_DIR/bin/activate"
elif [ -f "$VENV_DIR/Scripts/activate" ]; then
    source "$VENV_DIR/Scripts/activate"
fi

echo "[*] Installing backend dependencies..."
python -m pip install -q -r "$BACKEND_DIR/requirements.txt"

# 2. Check / Train ML Model if not present
MODEL_FILE="$BACKEND_DIR/saved_models/bust_model.joblib"
if [ ! -f "$MODEL_FILE" ]; then
    echo "[*] No pre-saved model found. Training AeroBust-AI Calibrated Gradient Booster..."
    cd "$PROJECT_ROOT"
    python -m backend.app.ml.train
else
    echo "[✓] Model weights verified: $MODEL_FILE"
fi

# 3. Launch FastAPI Backend
echo "[*] Starting FastAPI Backend on http://127.0.0.1:8000..."
cd "$PROJECT_ROOT"
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --log-level info &
BACKEND_PID=$!

# 4. Frontend Setup & Launch
echo "[*] Preparing Frontend dependencies..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "[*] Launching Vite Frontend on http://localhost:5173..."
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

# Trap Ctrl+C to terminate both servers
cleanup() {
    echo ""
    echo "[*] Shutting down AeroBust-AI servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 5. Verification & Health Check
echo "[*] Waiting for services to initialize..."
sleep 4

echo "======================================================================"
echo "          AeroBust-AI Operational Dashboard is Ready!                "
echo "======================================================================"
echo "  [Web Dashboard] : http://localhost:5173"
echo "  [REST API Docs] : http://localhost:8000/docs"
echo "  [Health Probe]  : http://localhost:8000/api/health"
echo "======================================================================"
echo "Press Ctrl+C to terminate both servers."

wait
