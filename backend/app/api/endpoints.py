from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, List
import numpy as np

from ..config import METEOROLOGICAL_SCENARIOS, ALERT_PROBABILITY_THRESHOLD, GRID_STEP
from .schemas import (
    HealthResponse, ScenarioListResponse, ScenarioMeta,
    GridForecastResponse, GridSummary, GridPoint,
    AlertListResponse, AlertItem,
    ExplainRequest, ExplainResponse, ShapDriver, Rationale
)
from ..utils.synth_data import generate_scenario_grid
from ..ml.model import get_bust_model
from ..ml.explainability import get_explainer

router = APIRouter()

SCENARIO_ALIASES = {
    "cyclone_biparjoy": "tropical_cyclone",
    "cyclone": "tropical_cyclone",
    "biparjoy": "tropical_cyclone",
    "heatwave": "heatwave_vidarbha",
    "break_monsoon": "active_break_monsoon"
}

def resolve_scenario_id(scenario: str) -> str:
    s = scenario.lower().strip()
    return SCENARIO_ALIASES.get(s, s)

# Memory cache for instant grid responses
_GRID_CACHE: Dict[str, List[Dict[str, Any]]] = {}

def get_cached_grid(scenario_id: str, day: int, step: float = GRID_STEP) -> List[Dict[str, Any]]:
    cache_key = f"{scenario_id}_d{day}_s{step}"
    if cache_key not in _GRID_CACHE:
        raw_points = generate_scenario_grid(scenario_id=scenario_id, lead_day=day, step=step)
        model = get_bust_model()
        enriched = model.predict_grid(raw_points)
        _GRID_CACHE[cache_key] = enriched
    return _GRID_CACHE[cache_key]

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """System health status and model readiness."""
    model = get_bust_model()
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        model_loaded=model.is_trained,
        model_type=model.metadata.get("model_type", "Calibrated Gradient Boosting"),
        subcontinent_domain="Lat 6°N-38°N, Lon 68°E-98°E",
        lead_time_range="Day 1 to Day 10"
    )

@router.get("/scenarios", response_model=ScenarioListResponse)
async def list_scenarios():
    """List 5 realistic meteorological high-impact phenomena scenarios."""
    scenarios = [ScenarioMeta(**meta) for meta in METEOROLOGICAL_SCENARIOS.values()]
    return ScenarioListResponse(scenarios=scenarios)

@router.get("/forecast/grid", response_model=GridForecastResponse)
async def get_forecast_grid(
    scenario: str = Query("monsoon_depression", description="Operational weather scenario ID"),
    day: int = Query(4, ge=1, le=10, description="NWP Forecast Lead Day (1-10)"),
    resolution: float = Query(0.75, ge=0.5, le=2.0, description="Spatial grid resolution in degrees")
):
    """
    Returns gridded meteorological forecasts, ground truth reanalysis,
    predicted bust probability, and confidence score.
    """
    scenario_id = resolve_scenario_id(scenario)
    if scenario_id not in METEOROLOGICAL_SCENARIOS:
        raise HTTPException(
            status_code=404,
            detail=f"Scenario '{scenario}' not recognized. Available: {list(METEOROLOGICAL_SCENARIOS.keys())}"
        )

    grid_data = get_cached_grid(scenario_id=scenario_id, day=day, step=resolution)
    meta = METEOROLOGICAL_SCENARIOS[scenario_id]

    # Compute domain summary
    bust_probs = [p["bust_probability"] for p in grid_data]
    conf_scores = [p["confidence_score"] for p in grid_data]
    high_bust_count = sum(1 for p in bust_probs if p >= ALERT_PROBABILITY_THRESHOLD)

    summary = GridSummary(
        total_grid_points=len(grid_data),
        high_bust_cells_count=high_bust_count,
        mean_bust_probability=round(float(np.mean(bust_probs)), 3),
        mean_confidence_score=round(float(np.mean(conf_scores)), 1),
        max_bust_probability=round(float(np.max(bust_probs)), 3),
        min_confidence_score=round(float(np.min(conf_scores)), 1),
        dominant_bust_type=meta.get("primary_bust_type", "heavy_rain")
    )

    return GridForecastResponse(
        scenario_id=scenario_id,
        scenario_name=meta["name"],
        lead_day=day,
        grid_resolution_deg=resolution,
        count=len(grid_data),
        summary=summary,
        grid=[GridPoint(**p) for p in grid_data]
    )

@router.get("/alerts", response_model=AlertListResponse)
async def get_high_risk_alerts(
    scenario: str = Query("monsoon_depression"),
    day: int = Query(4, ge=1, le=10),
    threshold: float = Query(ALERT_PROBABILITY_THRESHOLD, ge=0.4, le=0.95)
):
    """
    Returns top regional sub-zones flagged with P(Bust) >= threshold
    for operational disaster mitigation and forecaster intervention.
    """
    scenario_id = resolve_scenario_id(scenario)
    if scenario_id not in METEOROLOGICAL_SCENARIOS:
        raise HTTPException(status_code=404, detail="Scenario not found")

    grid_data = get_cached_grid(scenario_id=scenario_id, day=day, step=0.75)
    high_risk_points = [p for p in grid_data if p["bust_probability"] >= threshold]

    # Aggregate by region to find representative hot spots
    regional_alerts: Dict[str, Dict[str, Any]] = {}
    for p in high_risk_points:
        region = p["region"]
        if region not in regional_alerts or p["bust_probability"] > regional_alerts[region]["bust_probability"]:
            regional_alerts[region] = p

    # Sort descending by bust probability
    sorted_alerts = sorted(regional_alerts.values(), key=lambda x: x["bust_probability"], reverse=True)

    alert_items = []
    for p in sorted_alerts:
        prob = p["bust_probability"]
        diff_rain = p["rain_error_abs"]
        diff_temp = p["temp_error_abs"]

        if diff_rain > 45.0:
            risk_factor = f"Extreme Precipitation Error ({diff_rain:.0f} mm/day)"
            adv = "Model misses deep tropospheric jet convergence. Issue flash flood warnings."
        elif diff_temp >= 3.5:
            risk_factor = f"Extreme Thermodynamic Cold Bias ({diff_temp:.1f}°C)"
            adv = "Model suffers land-surface heat under-prediction. Maintain red heatwave alert."
        else:
            risk_factor = f"Rapid Dynamic Vortex Dispersion (P={prob:.2f})"
            adv = "Forecast track divergence. Consult multi-model super-ensemble."

        alert_items.append(AlertItem(
            region=p["region"],
            lat=p["lat"],
            lon=p["lon"],
            lead_day=day,
            bust_probability=prob,
            confidence_score=p["confidence_score"],
            risk_level=p["risk_level"],
            primary_risk_factor=risk_factor,
            precipitation_forecast=p["precipitation_forecast"],
            precipitation_truth=p["precipitation_truth"],
            temp_2m_forecast=p["temp_2m_forecast"],
            temp_2m_truth=p["temp_2m_truth"],
            advisory=adv
        ))

    return AlertListResponse(
        scenario_id=scenario_id,
        lead_day=day,
        total_alerts=len(alert_items),
        threshold=threshold,
        alerts=alert_items
    )

@router.post("/explain", response_model=ExplainResponse)
async def explain_grid_cell(request: ExplainRequest):
    """
    Returns SHAP feature importance attributions and intuitive meteorological
    rationale explaining why the NWP model is predicted to bust at this grid coordinate.
    """
    scenario_id = resolve_scenario_id(request.scenario_id)
    grid_data = get_cached_grid(scenario_id=scenario_id, day=request.lead_day, step=0.75)
    
    # Find closest grid point
    closest_point = min(
        grid_data,
        key=lambda p: (p["lat"] - request.lat)**2 + (p["lon"] - request.lon)**2
    )

    explainer = get_explainer()
    explanation = explainer.explain_point(closest_point)

    return ExplainResponse(
        lat=explanation["lat"],
        lon=explanation["lon"],
        region=explanation["region"],
        lead_day=explanation["lead_day"],
        bust_probability=explanation["bust_probability"],
        confidence_score=explanation["confidence_score"],
        top_drivers=[ShapDriver(**d) for d in explanation["top_drivers"]],
        rationales=[Rationale(**r) for r in explanation["rationales"]],
        actionable_advisory=explanation["actionable_advisory"]
    )
