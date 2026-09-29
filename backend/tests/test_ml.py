import pytest
import time
import numpy as np
from backend.app.utils.synth_data import generate_scenario_grid, generate_training_dataset
from backend.app.ml.feature_pipeline import extract_features, FEATURE_NAMES
from backend.app.ml.model import AeroBustModel, get_bust_model
from backend.app.ml.explainability import get_explainer

def test_synthetic_data_generation():
    """Verify synthetic grid generation covers subcontinent domain correctly."""
    grid = generate_scenario_grid(scenario_id="monsoon_depression", lead_day=4, step=1.0)
    assert len(grid) > 0, "Grid points should not be empty"
    
    first = grid[0]
    expected_keys = [
        "lat", "lon", "region", "is_land", "lead_day", "scenario",
        "precipitation_forecast", "precipitation_truth", "temp_2m_forecast",
        "temp_2m_truth", "mslp_forecast", "wind_shear_850_200", "cape",
        "precipitable_water", "ensemble_spread_proxy", "is_bust_ground_truth"
    ]
    for key in expected_keys:
        assert key in first, f"Missing key {key} in grid item"

    assert 6.0 <= first["lat"] <= 38.0
    assert 68.0 <= first["lon"] <= 98.0
    assert 1 <= first["lead_day"] <= 10

def test_feature_pipeline_dimensions():
    """Verify feature matrix matches expected feature names count."""
    grid = generate_scenario_grid(scenario_id="western_disturbance", lead_day=3, step=1.5)
    X = extract_features(grid)
    assert X.shape[0] == len(grid)
    assert X.shape[1] == len(FEATURE_NAMES)
    assert not np.isnan(X).any(), "Features should not contain NaNs"

def test_model_training_and_inference():
    """Verify model fits cleanly and produces valid probabilities [0, 1]."""
    model = get_bust_model()
    assert model.is_trained, "Model should be trained"
    
    grid = generate_scenario_grid(scenario_id="tropical_cyclone", lead_day=5, step=1.0)
    
    # Measure inference latency (< 100ms per grid slice)
    start_time = time.time()
    enriched = model.predict_grid(grid)
    inference_time_ms = (time.time() - start_time) * 1000.0
    
    print(f"\nInference time for {len(grid)} grid cells: {inference_time_ms:.2f} ms")
    assert inference_time_ms < 100.0, f"Inference latency exceeded 100ms: {inference_time_ms:.2f}ms"
    
    for item in enriched:
        assert 0.0 <= item["bust_probability"] <= 1.0, "Probability must be in [0, 1]"
        assert 0.0 <= item["confidence_score"] <= 100.0, "Confidence must be in [0, 100]"
        assert item["risk_level"] in [
            "CRITICAL BUST RISK", "ELEVATED BUST RISK", "MODERATE RISK", "NOMINAL (HIGH CONFIDENCE)"
        ]

def test_explainability_attribution():
    """Verify SHAP and rule-based meteorological explanation generation."""
    grid = generate_scenario_grid(scenario_id="monsoon_depression", lead_day=4, step=1.0)
    model = get_bust_model()
    enriched = model.predict_grid(grid)
    
    # Pick a high-risk point
    high_risk_pt = max(enriched, key=lambda x: x["bust_probability"])
    
    explainer = get_explainer()
    explanation = explainer.explain_point(high_risk_pt)
    
    assert "top_drivers" in explanation
    assert len(explanation["top_drivers"]) > 0
    assert "rationales" in explanation
    assert len(explanation["rationales"]) > 0
    assert "actionable_advisory" in explanation
    assert len(explanation["actionable_advisory"]) > 20
