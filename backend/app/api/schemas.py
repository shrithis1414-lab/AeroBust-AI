from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    model_loaded: bool
    model_type: Optional[str] = None
    subcontinent_domain: str = "Lat 6°N-38°N, Lon 68°E-98°E"
    lead_time_range: str = "Day 1 to Day 10"

class ScenarioMeta(BaseModel):
    id: str
    name: str
    category: str
    season: str
    synoptic_narrative: str
    primary_regions: List[str]
    critical_lead_days: List[int]
    primary_bust_type: str

class ScenarioListResponse(BaseModel):
    scenarios: List[ScenarioMeta]

class GridPoint(BaseModel):
    lat: float
    lon: float
    region: str
    is_land: bool
    lead_day: int
    scenario: str
    precipitation_forecast: float
    precipitation_truth: float
    temp_2m_forecast: float
    temp_2m_truth: float
    mslp_forecast: float
    wind_shear_850_200: float
    cape: float
    precipitable_water: float
    ensemble_spread_proxy: float
    rain_error_abs: float
    temp_error_abs: float
    is_bust_ground_truth: int
    bust_type: str
    bust_probability: float
    confidence_score: float
    risk_level: str

class GridSummary(BaseModel):
    total_grid_points: int
    high_bust_cells_count: int
    mean_bust_probability: float
    mean_confidence_score: float
    max_bust_probability: float
    min_confidence_score: float
    dominant_bust_type: str

class GridForecastResponse(BaseModel):
    scenario_id: str
    scenario_name: str
    lead_day: int
    grid_resolution_deg: float
    count: int
    summary: GridSummary
    grid: List[GridPoint]

class AlertItem(BaseModel):
    region: str
    lat: float
    lon: float
    lead_day: int
    bust_probability: float
    confidence_score: float
    risk_level: str
    primary_risk_factor: str
    precipitation_forecast: float
    precipitation_truth: float
    temp_2m_forecast: float
    temp_2m_truth: float
    advisory: str

class AlertListResponse(BaseModel):
    scenario_id: str
    lead_day: int
    total_alerts: int
    threshold: float
    alerts: List[AlertItem]

class ExplainRequest(BaseModel):
    scenario_id: str
    lead_day: int
    lat: float
    lon: float

class ShapDriver(BaseModel):
    feature: str
    impact: float
    display_name: str
    relative_weight: float

class Rationale(BaseModel):
    category: str
    severity: str
    explanation: str

class ExplainResponse(BaseModel):
    lat: float
    lon: float
    region: str
    lead_day: int
    bust_probability: float
    confidence_score: float
    top_drivers: List[ShapDriver]
    rationales: List[Rationale]
    actionable_advisory: str
