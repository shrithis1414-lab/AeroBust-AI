import math
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from ..config import (
    LAT_MIN, LAT_MAX, LON_MIN, LON_MAX, GRID_STEP,
    RAIN_BUST_ABS_DIFF, RAIN_BUST_REL_ERR, RAIN_BUST_MIN_TRUTH,
    TEMP_BUST_ABS_DIFF, METEOROLOGICAL_SCENARIOS
)
from .geo_utils import get_grid_coordinates, classify_region, is_land_point

def evaluate_bust_label(
    p_fcst: float,
    p_truth: float,
    t_fcst: float,
    t_truth: float,
    region: str,
    scenario_id: str
) -> Tuple[int, str, float, float]:
    """Evaluate whether a grid cell exhibits a meteorological forecast bust."""
    rain_diff = abs(p_fcst - p_truth)
    rain_bust = False
    
    if rain_diff > RAIN_BUST_ABS_DIFF:
        rain_bust = True
    elif p_truth >= RAIN_BUST_MIN_TRUTH and (rain_diff / max(1.0, p_truth)) > RAIN_BUST_REL_ERR:
        rain_bust = True
        
    temp_diff = abs(t_fcst - t_truth)
    is_thermal_zone = ("Vidarbha" in region or "Gangetic" in region or "Northwest" in region) or (scenario_id == "heatwave_vidarbha")
    temp_bust = (temp_diff >= TEMP_BUST_ABS_DIFF) and is_thermal_zone
    
    # Compound or singular bust flag
    is_bust = 1 if (rain_bust or temp_bust) else 0
    
    bust_type = "nominal"
    if rain_bust and temp_bust:
        bust_type = "compound_precip_temp"
    elif rain_bust:
        bust_type = "heavy_rain_bust"
    elif temp_bust:
        bust_type = "temperature_heatwave_bust"
        
    return is_bust, bust_type, rain_diff, temp_diff


def generate_scenario_grid(
    scenario_id: str,
    lead_day: int,
    step: float = GRID_STEP,
    random_seed: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Generate high-fidelity gridded weather forecast and ground truth observations
    for a given meteorological scenario and lead time (Days 1-10).
    """
    if scenario_id not in METEOROLOGICAL_SCENARIOS:
        scenario_id = "monsoon_depression"
        
    lead_day = max(1, min(10, int(lead_day)))
    seed = (hash(scenario_id) + lead_day * 137) % (2**31 - 1) if random_seed is None else random_seed
    rng = np.random.RandomState(seed)
    
    coords = get_grid_coordinates(step=step)
    grid_points = []
    
    # Base background climatology according to scenario
    if scenario_id == "monsoon_depression":
        base_temp_mean = 28.5
        base_mslp = 1002.0
        # Storm center trajectory: starts in N Bay, tracks WNW into Central India
        # Day 1: (19.5, 89.0), Day 4: (21.5, 82.5), Day 8: (23.5, 76.0)
        track_progress = (lead_day - 1) / 9.0
        true_center_lat = 19.0 + track_progress * 5.0
        true_center_lon = 89.5 - track_progress * 14.5
        
        # NWP forecast tracks slightly slower and deviates southward on days 3-6
        fcst_lag = 0.0 if lead_day <= 2 else (lead_day - 2) * 0.4
        fcst_center_lat = true_center_lat - fcst_lag * 0.6
        fcst_center_lon = true_center_lon + fcst_lag * 1.2
        
    elif scenario_id == "western_disturbance":
        base_temp_mean = 16.0
        base_mslp = 1014.0
        # Trough enters from West (Afghanistan/Pakistan) into J&K and Western Himalayas
        track_progress = (lead_day - 1) / 9.0
        true_center_lat = 33.5 - track_progress * 1.5
        true_center_lon = 71.0 + track_progress * 12.0
        
        # NWP runs too fast (phase advance) on days 2-6
        fcst_lead_err = 0.0 if lead_day <= 1 else (lead_day - 1) * 0.7
        fcst_center_lat = true_center_lat
        fcst_center_lon = true_center_lon + fcst_lead_err * 2.0
        
    elif scenario_id == "tropical_cyclone":
        base_temp_mean = 29.5
        base_mslp = 1008.0
        # Cyclone in Arabian Sea moving toward Gujarat coast
        # Days 1-3 moves NNW, Days 4-7 recurves sharply NE toward Saurashtra
        track_progress = (lead_day - 1) / 9.0
        if lead_day <= 3:
            true_center_lat = 14.0 + (lead_day - 1) * 2.0
            true_center_lon = 69.5 + (lead_day - 1) * 0.3
            fcst_center_lat = true_center_lat + rng.normal(0, 0.1)
            fcst_center_lon = true_center_lon + rng.normal(0, 0.1)
        else:
            # Recurvature to NE in truth
            true_center_lat = 18.0 + (lead_day - 3) * 1.6
            true_center_lon = 70.1 + (lead_day - 3) * 1.1
            # NWP fails to recurve, keeps going NW toward Oman/Pakistan
            fcst_center_lat = 18.0 + (lead_day - 3) * 1.8
            fcst_center_lon = 70.1 - (lead_day - 3) * 1.3
            
    elif scenario_id == "heatwave_vidarbha":
        base_temp_mean = 41.0
        base_mslp = 1004.0
        # Stationary heat core over Vidarbha & East Rajasthan
        true_center_lat = 21.5
        true_center_lon = 78.5
        fcst_center_lat = 21.5
        fcst_center_lon = 78.5
        
    else:  # active_break_monsoon
        base_temp_mean = 27.0
        base_mslp = 1005.0
        # Break monsoon shifts active zone from Western Ghats to Himalayan Foothills
        track_progress = (lead_day - 1) / 9.0
        true_center_lat = 14.0 + track_progress * 13.0  # Moves to foothills (27°N)
        true_center_lon = 75.0 + track_progress * 8.0
        fcst_center_lat = 14.0 + (track_progress * 0.3) * 13.0  # NWP stuck at Ghats
        fcst_center_lon = 74.5

    for lat, lon in coords:
        region = classify_region(lat, lon)
        land = is_land_point(lat, lon)
        
        # Distance to true and forecast storm/anomaly centers
        dist_true = math.hypot(lat - true_center_lat, lon - true_center_lon)
        dist_fcst = math.hypot(lat - fcst_center_lat, lon - fcst_center_lon)
        
        # Base Orographic enhancement along Western Ghats and Himalayas
        is_orographic = ("Western Ghats" in region) or ("Himalayas" in region)
        oro_precip_factor = 28.0 if is_orographic else 2.0
        
        # Climatological temperature lapse rate with latitude
        lat_temp_lapse = (lat - 20.0) * 0.45
        
        # Generate variables based on scenario physics
        if scenario_id == "monsoon_depression":
            # Ground truth: intense rainfall vortex
            true_rain_core = max(0.0, 160.0 * math.exp(-(dist_true**2) / 6.0))
            true_rain_band = max(0.0, 45.0 * math.exp(-(dist_true**2) / 24.0))
            p_truth = true_rain_core + true_rain_band + (oro_precip_factor if "Ghats" in region else 0.0) + rng.uniform(0, 5)
            
            # Forecast: On days 3-6, severe underestimation of low-level jet moisture
            if lead_day in [3, 4, 5, 6] and dist_true < 4.0:
                fcst_underestimate_factor = 0.28 + (lead_day * 0.05)
                p_fcst = (true_rain_core * fcst_underestimate_factor) + (true_rain_band * 0.4) + rng.uniform(2, 12)
            else:
                fcst_rain_core = max(0.0, 135.0 * math.exp(-(dist_fcst**2) / 7.0))
                p_fcst = fcst_rain_core + (oro_precip_factor if "Ghats" in region else 0.0) + rng.uniform(0, 6)
                
            t_truth = base_temp_mean - lat_temp_lapse - (p_truth * 0.04) + rng.normal(0, 0.4)
            t_fcst = base_temp_mean - lat_temp_lapse - (p_fcst * 0.04) + rng.normal(0, 0.5)
            
            mslp_fcst = base_mslp - max(0.0, 14.0 * math.exp(-(dist_fcst**2) / 8.0)) + rng.normal(0, 0.5)
            shear = 12.0 + max(0.0, 16.0 * math.exp(-(dist_true**2) / 12.0)) + rng.uniform(-1, 2)
            cape = 1800.0 + max(0.0, 1800.0 * math.exp(-(dist_true**2) / 10.0)) + rng.uniform(-100, 200)
            pw = 52.0 + max(0.0, 20.0 * math.exp(-(dist_true**2) / 15.0)) + rng.uniform(-2, 3)

        elif scenario_id == "western_disturbance":
            # WD brings precipitation to Northwest India & Himalayas
            in_wd_domain = ("Himalayas" in region) or ("Northwest" in region) or (lat >= 28.0 and 70.0 <= lon <= 80.0)
            
            true_wd_precip = max(0.0, 85.0 * math.exp(-(dist_true**2) / 5.0)) if in_wd_domain else 0.0
            fcst_wd_precip = max(0.0, 75.0 * math.exp(-(dist_fcst**2) / 5.0)) if in_wd_domain else 0.0
            
            p_truth = true_wd_precip + (8.0 if "Himalayas" in region else 0.0) + rng.uniform(0, 2)
            p_fcst = fcst_wd_precip + (6.0 if "Himalayas" in region else 0.0) + rng.uniform(0, 2)
            
            # Phase displacement causes severe cold anomaly mismatch
            t_cold_drop_true = max(0.0, 8.5 * math.exp(-(dist_true**2) / 8.0))
            t_cold_drop_fcst = max(0.0, 8.0 * math.exp(-(dist_fcst**2) / 8.0))
            
            t_truth = base_temp_mean - lat_temp_lapse - t_cold_drop_true + rng.normal(0, 0.4)
            t_fcst = base_temp_mean - lat_temp_lapse - t_cold_drop_fcst + rng.normal(0, 0.5)
            
            mslp_fcst = base_mslp - max(0.0, 10.0 * math.exp(-(dist_fcst**2) / 10.0)) + rng.normal(0, 0.4)
            shear = 22.0 + max(0.0, 18.0 * math.exp(-(dist_true**2) / 8.0)) + rng.uniform(-1, 2)
            cape = 650.0 + max(0.0, 600.0 * math.exp(-(dist_true**2) / 10.0)) + rng.uniform(-50, 50)
            pw = 28.0 + max(0.0, 14.0 * math.exp(-(dist_true**2) / 12.0)) + rng.uniform(-1, 2)

        elif scenario_id == "tropical_cyclone":
            # Cyclone eye and eyewall structure
            true_eye_rain = max(0.0, 240.0 * math.exp(-(dist_true**2) / 3.0))
            fcst_eye_rain = max(0.0, 190.0 * math.exp(-(dist_fcst**2) / 3.5))
            
            p_truth = true_eye_rain + rng.uniform(0, 3)
            p_fcst = fcst_eye_rain + rng.uniform(0, 3)
            
            t_truth = base_temp_mean - lat_temp_lapse + rng.normal(0, 0.3)
            t_fcst = base_temp_mean - lat_temp_lapse + rng.normal(0, 0.3)
            
            # Deep central pressure drop
            true_pres_drop = max(0.0, 48.0 * math.exp(-(dist_true**2) / 4.0))
            fcst_pres_drop = max(0.0, 24.0 * math.exp(-(dist_fcst**2) / 5.0))  # Under-deepened in forecast
            mslp_fcst = base_mslp - fcst_pres_drop + rng.normal(0, 0.5)
            
            shear = 8.0 + max(0.0, 28.0 * math.exp(-(dist_fcst**2) / 8.0)) + rng.uniform(-1, 2)
            cape = 2400.0 + max(0.0, 1500.0 * math.exp(-(dist_true**2) / 6.0)) + rng.uniform(-100, 100)
            pw = 58.0 + max(0.0, 18.0 * math.exp(-(dist_true**2) / 8.0)) + rng.uniform(-1, 2)

        elif scenario_id == "heatwave_vidarbha":
            # Heatwave over Central & Northwest India
            heat_core = max(0.0, 6.5 * math.exp(-(dist_true**2) / 18.0))
            p_truth = rng.uniform(0, 0.8)
            p_fcst = rng.uniform(0, 1.2)
            
            # NWP exhibits strong persistent cold bias on Days 5-10
            if lead_day >= 5:
                nwp_cold_bias = 4.2 + (lead_day - 5) * 0.4
            else:
                nwp_cold_bias = 1.0 + lead_day * 0.4
                
            t_truth = base_temp_mean + heat_core - (lat_temp_lapse * 0.5) + rng.normal(0, 0.4)
            t_fcst = t_truth - (nwp_cold_bias if dist_true < 5.0 else 0.8) + rng.normal(0, 0.3)
            
            mslp_fcst = base_mslp + max(0.0, 4.0 * math.exp(-(dist_fcst**2) / 15.0)) + rng.normal(0, 0.3)
            shear = 9.0 + rng.uniform(-1, 2)
            cape = 1200.0 + rng.uniform(-100, 150)
            pw = 22.0 + rng.uniform(-2, 3)

        else:  # active_break_monsoon
            # True rainfall concentrated along foothills of Himalayas during break
            true_foot_rain = max(0.0, 140.0 * math.exp(-(dist_true**2) / 6.0)) if "Himalayas" in region or "Northeast" in region else 0.0
            
            # Forecast erroneously retains heavy convective rainfall at Western Ghats
            fcst_ghats_rain = max(0.0, 95.0 * math.exp(-(dist_fcst**2) / 6.0)) if "Western Ghats" in region else 0.0
            
            p_truth = true_foot_rain + (4.0 if "Ghats" in region and lead_day >= 4 else 25.0) + rng.uniform(0, 4)
            p_fcst = fcst_ghats_rain + (12.0 if "Himalayas" in region else 4.0) + rng.uniform(0, 4)
            
            t_truth = base_temp_mean - lat_temp_lapse + rng.normal(0, 0.4)
            t_fcst = base_temp_mean - lat_temp_lapse + rng.normal(0, 0.4)
            
            mslp_fcst = base_mslp + rng.normal(0, 0.5)
            shear = 16.0 + max(0.0, 14.0 * math.exp(-(dist_fcst**2) / 10.0)) + rng.uniform(-1, 2)
            cape = 2100.0 + max(0.0, 1200.0 * math.exp(-(dist_fcst**2) / 8.0)) + rng.uniform(-100, 100)
            pw = 48.0 + rng.uniform(-2, 3)

        # Ensure realistic physical non-negative bounds
        p_fcst = max(0.0, round(float(p_fcst), 1))
        p_truth = max(0.0, round(float(p_truth), 1))
        t_fcst = round(float(t_fcst), 1)
        t_truth = round(float(t_truth), 1)
        mslp_fcst = round(float(mslp_fcst), 1)
        shear = max(1.0, round(float(shear), 1))
        cape = max(50.0, round(float(cape), 0))
        pw = max(5.0, round(float(pw), 1))
        
        # Ensemble spread proxy (grows nonlinearly with lead time and instability)
        base_spread = 2.0 + (lead_day ** 1.35) * 1.45
        local_spread_boost = (p_fcst * 0.18) + (shear * 0.35) + (cape / 800.0)
        ensemble_spread = round(float(base_spread + local_spread_boost + rng.uniform(-0.8, 1.2)), 2)
        ensemble_spread = max(1.5, ensemble_spread)
        
        # Evaluate ground-truth bust criterion
        is_bust, bust_type, rain_diff, temp_diff = evaluate_bust_label(
            p_fcst=p_fcst,
            p_truth=p_truth,
            t_fcst=t_fcst,
            t_truth=t_truth,
            region=region,
            scenario_id=scenario_id
        )
        
        grid_points.append({
            "lat": lat,
            "lon": lon,
            "region": region,
            "is_land": land,
            "lead_day": lead_day,
            "scenario": scenario_id,
            "precipitation_forecast": p_fcst,
            "precipitation_truth": p_truth,
            "temp_2m_forecast": t_fcst,
            "temp_2m_truth": t_truth,
            "mslp_forecast": mslp_fcst,
            "wind_shear_850_200": shear,
            "cape": cape,
            "precipitable_water": pw,
            "ensemble_spread_proxy": ensemble_spread,
            "rain_error_abs": round(rain_diff, 1),
            "temp_error_abs": round(temp_diff, 1),
            "is_bust_ground_truth": is_bust,
            "bust_type": bust_type
        })
        
    return grid_points


def generate_training_dataset(sample_step: float = 1.0) -> pd.DataFrame:
    """
    Generate a balanced multi-scenario training dataset across lead times 1-10
    covering the full Indian subcontinent.
    """
    all_rows = []
    scenarios = list(METEOROLOGICAL_SCENARIOS.keys())
    
    for sc in scenarios:
        for day in range(1, 11):
            slice_data = generate_scenario_grid(scenario_id=sc, lead_day=day, step=sample_step)
            all_rows.extend(slice_data)
            
    df = pd.DataFrame(all_rows)
    return df
