# AeroBust-AI: Indian Weather Forecast Bust & Confidence Prediction System

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-green.svg)](https://leafletjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**AeroBust-AI** is a production-grade, locally executable AI supervisory decision-support system designed to **detect, quantify, and explain "Forecast Busts"** (severe numerical forecast errors in medium-range Numerical Weather Prediction, Days 1–10) across the **Indian subcontinent (Lat 6°N–38°N, Lon 68°E–98°E)**.

The system specifically targets rapidly evolving tropical weather phenomena:
- **Monsoon Depressions** (Bay of Bengal to Central India)
- **Western Disturbances** (North & Northwest India)
- **Tropical Cyclones** (Arabian Sea / Bay of Bengal)
- **Heatwaves** (Gangetic Plains & Vidarbha)
- **Active-to-Break Monsoon Transitions** (Western Ghats & Himalayan Foothills)

---

## 🏛️ System Architecture

```text
aerobust-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI entry point & CORS configuration
│   │   ├── config.py              # Geospatial bounding box & threshold configs
│   │   ├── api/
│   │   │   ├── endpoints.py       # REST routes for grid slices, confidence, XAI, alerts
│   │   │   └── schemas.py         # Pydantic v2 schemas
│   │   ├── ml/
│   │   │   ├── feature_pipeline.py# Synoptic, dynamic & instability feature extraction
│   │   │   ├── model.py           # Calibrated Gradient Boosting + Confidence Regressor
│   │   │   ├── explainability.py  # SHAP TreeExplainer & meteorological rationale mapper
│   │   │   └── train.py           # Reproducible training & evaluation script
│   │   └── utils/
│   │       ├── geo_utils.py       # Geospatial coordinate generator & region classifier
│   │       └── synth_data.py      # High-fidelity mock GFS/NCMRWF & IMD/ERA5 generator
│   ├── saved_models/              # Serialized model weights & metadata
│   ├── requirements.txt
│   └── tests/
│       ├── test_ml.py             # Feature pipeline & inference latency tests
│       └── test_api.py            # API endpoint integration tests
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── App.jsx                # Main operational workstation layout
│   │   ├── main.jsx
│   │   ├── index.css              # Dark workstation styling & pulse animations
│   │   └── components/
│   │       ├── MapViewer.jsx      # Leaflet interactive map with D1-D10 raster layer
│   │       ├── LeadTimeSlider.jsx # Day 1 to Day 10 scrubber with auto-play
│   │       ├── BustRiskGauge.jsx  # Semi-circular SVG bust probability gauge
│   │       ├── XaiDrawer.jsx      # SHAP attribution bars & meteorological diagnostics
│   │       ├── EventTagger.jsx    # Active synoptic phenomena selector
│   │       └── AlertTable.jsx     # High-risk operational alert list for IMD forecasters
├── run.sh                         # Unified startup script (Linux/macOS/Git Bash)
├── run.ps1                        # Native Windows PowerShell startup script
└── README.md                      # Operational handbook & jury guide
```

---

## 📐 Mathematical Formulation of a "Forecast Bust"

A **Forecast Bust** occurs when the numerical prediction deviates drastically from reanalysis truth:

1. **Heavy Rain Bust**:
   $$\left|P_{\text{forecast}} - P_{\text{truth}}\right| > 50\text{ mm/day} \quad \lor \quad \left(\frac{\left|P_{\text{forecast}} - P_{\text{truth}}\right|}{P_{\text{truth}}} > 1.0 \quad \text{where } P_{\text{truth}} \ge 35\text{ mm/day}\right)$$

2. **Temperature Bust**:
   $$\left|T_{\text{forecast}} - T_{\text{truth}}\right| \ge 3.5^\circ\text{C} \quad \text{over heatwave-vulnerable zones}$$

3. **Forecast Confidence Index ($0–100\%$)**:
   $$\text{Confidence} = \max\left(0, 100 \times \left(1 - \frac{\text{Normalized Forecast Spread} + \text{Historical Error Cluster}}{2}\right)\right)$$

---

## 🚀 Quickstart & Installation

### Option A: Unified Startup Script (Linux / macOS / Git Bash)
```bash
cd aerobust-ai
chmod +x run.sh
./run.sh
```

### Option B: Windows PowerShell
```powershell
cd aerobust-ai
.\run.ps1
```

### Option C: Manual Launch

1. **Backend:**
```bash
cd aerobust-ai
python -m pip install -r backend/requirements.txt
# Train model (takes ~10 seconds)
python -m backend.app.ml.train
# Run FastAPI server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

2. **Frontend:**
```bash
cd aerobust-ai/frontend
npm install
npm run dev
```

Open your browser at:
- **Interactive Forecaster Dashboard**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Verification Endpoint**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## 🧪 Automated Test Suite

To verify synthetic data generation, ML feature dimensions, inference latency ($<100\text{ms}$), and REST API endpoints:

```bash
cd aerobust-ai
python -m pytest backend/tests -v
```

Output:
```text
backend/tests/test_api.py::test_api_health PASSED
backend/tests/test_api.py::test_api_scenarios_list PASSED
backend/tests/test_api.py::test_api_forecast_grid_with_cyclone_alias PASSED
backend/tests/test_api.py::test_api_alerts_endpoint PASSED
backend/tests/test_api.py::test_api_explain_endpoint PASSED
backend/tests/test_ml.py::test_synthetic_data_generation PASSED
backend/tests/test_ml.py::test_feature_pipeline_dimensions PASSED
backend/tests/test_ml.py::test_model_training_and_inference PASSED
backend/tests/test_ml.py::test_explainability_attribution PASSED
======================= 9 passed in 12.50s =======================
```

---

## 🌟 Key Technical Talking Points for the SIH Jury

When presenting AeroBust-AI to evaluators and hackathon judges, emphasize these three pillars:

### 1. Hybrid Physics-AI Error Formulation
* Rather than trying to naively replace complex dynamical models (e.g., NCMRWF Unified Model or IMD GFS), AeroBust-AI functions as an **AI Supervisory Residual Layer**.
* It trains on historical forecast residuals ($\left|Forecast - Reanalysis\right|$) conditioned on synoptic thermodynamic instability (CAPE, 850–200 hPa vertical shear, PW, orographic boundaries, and lead-time dispersion).

### 2. Operational Actionability (Confidence Score)
* Operational forecasters cannot act on raw scalar probabilities alone. AeroBust-AI computes a normalized **Forecast Confidence Index (0–100%)**.
* When confidence drops below $40\%$, the system alerts the forecaster to transition from single-model deterministic runs to multi-model super-ensembles (NCUM-G + ECMWF-IFS + GFS) and apply statistical downscaling.

### 3. Explainable AI (XAI) for Meteorologists
* Black-box machine learning is unacceptable in mission-critical disaster management.
* AeroBust-AI integrates **SHAP TreeExplainer** and maps raw mathematical SHAP values into meteorologically grounded diagnostic narratives:
  - *High CAPE + moisture divergence* $\to$ **"Convective Parameterization Breakdown"**
  - *High shear + anomalous MSLP* $\to$ **"Vortex Track & Speed Dispersion in NWP Core"**
  - *High lead time + large ensemble spread* $\to$ **"Nonlinear Error Growth via Chaotic Drift"**
  - *Land-atmosphere coupling deficit* $\to$ **"Soil Moisture Evaporation Feedback Failure"**

---

## 📄 License
MIT License. Built for meteorological research, early disaster warning, and numerical weather prediction verification.
