import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_api_health():
    """Verify health endpoint returns ok and model status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert "subcontinent_domain" in data

def test_api_scenarios_list():
    """Verify scenarios endpoint lists 5 high-impact weather phenomena."""
    response = client.get("/api/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert "scenarios" in data
    assert len(data["scenarios"]) == 5
    ids = [s["id"] for s in data["scenarios"]]
    assert "monsoon_depression" in ids
    assert "tropical_cyclone" in ids
    assert "heatwave_vidarbha" in ids

def test_api_forecast_grid_with_cyclone_alias():
    """Verify GET /api/forecast/grid?scenario=cyclone_biparjoy&day=4 returns valid georeferenced data."""
    response = client.get("/api/forecast/grid?scenario=cyclone_biparjoy&day=4&resolution=1.0")
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_id"] == "tropical_cyclone"
    assert data["lead_day"] == 4
    assert len(data["grid"]) > 0
    
    first_pt = data["grid"][0]
    assert "lat" in first_pt
    assert "lon" in first_pt
    assert "bust_probability" in first_pt
    assert "confidence_score" in first_pt
    assert "risk_level" in first_pt

def test_api_alerts_endpoint():
    """Verify GET /api/alerts returns flagged high-risk zones."""
    response = client.get("/api/alerts?scenario=monsoon_depression&day=4&threshold=0.50")
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_id"] == "monsoon_depression"
    assert "alerts" in data
    assert isinstance(data["alerts"], list)

def test_api_explain_endpoint():
    """Verify POST /api/explain returns SHAP drivers and meteorological narrative."""
    payload = {
        "scenario_id": "monsoon_depression",
        "lead_day": 4,
        "lat": 20.0,
        "lon": 84.0
    }
    response = client.post("/api/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "top_drivers" in data
    assert len(data["top_drivers"]) > 0
    assert "rationales" in data
    assert len(data["rationales"]) > 0
    assert "actionable_advisory" in data
