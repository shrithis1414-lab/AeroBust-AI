import numpy as np
import pandas as pd
from typing import List, Dict, Any, Union

FEATURE_NAMES = [
    "lead_time",
    "lead_time_squared",
    "precip_forecast",
    "temp_forecast",
    "mslp_anomaly",
    "wind_shear",
    "cape",
    "precipitable_water",
    "ensemble_spread",
    "spread_to_precip_ratio",
    "instability_index",
    "vortex_intensity_proxy",
    "convective_severity_index",
    "thermal_stress_index",
    "rapid_intensification_flag",
    "orographic_proxy"
]

def extract_feature_vector(row: Dict[str, Any]) -> List[float]:
    """Extract derived synoptic, dynamic, and instability features for a single cell."""
    lead_time = float(row.get("lead_day", 1))
    p_fcst = float(row.get("precipitation_forecast", 0.0))
    t_fcst = float(row.get("temp_2m_forecast", 28.0))
    mslp_fcst = float(row.get("mslp_forecast", 1008.0))
    shear = float(row.get("wind_shear_850_200", 10.0))
    cape = float(row.get("cape", 1000.0))
    pw = float(row.get("precipitable_water", 40.0))
    spread = float(row.get("ensemble_spread_proxy", 3.0))
    lat = float(row.get("lat", 20.0))
    lon = float(row.get("lon", 80.0))

    lead_time_squared = lead_time ** 2
    mslp_anomaly = mslp_fcst - 1008.0
    spread_to_precip_ratio = spread / (p_fcst + 5.0)
    instability_index = (cape * pw) / 10000.0
    vortex_intensity_proxy = max(0.0, 1008.0 - mslp_fcst) * (shear / 10.0)
    convective_severity_index = (cape / 1000.0) * (shear / 15.0)
    thermal_stress_index = max(0.0, t_fcst - 38.0) * (1.0 / (pw / 30.0 + 0.1))
    
    # Rapid intensification proxy: high CAPE + low/moderate shear + deep low pressure
    rapid_intensification_flag = 1.0 if (cape > 2200.0 and shear < 15.0 and mslp_fcst < 1000.0) else 0.0
    
    # Orographic flag: Western Ghats or Himalayan foothills
    is_ghats = (8.0 <= lat <= 20.0 and 72.5 <= lon <= 75.8)
    is_himalaya = (29.0 <= lat <= 36.0 and 74.0 <= lon <= 88.0)
    orographic_proxy = 1.0 if (is_ghats or is_himalaya) else 0.0

    return [
        lead_time,
        lead_time_squared,
        p_fcst,
        t_fcst,
        mslp_anomaly,
        shear,
        cape,
        pw,
        spread,
        spread_to_precip_ratio,
        instability_index,
        vortex_intensity_proxy,
        convective_severity_index,
        thermal_stress_index,
        rapid_intensification_flag,
        orographic_proxy
    ]

def extract_features(data: Union[pd.DataFrame, List[Dict[str, Any]]]) -> np.ndarray:
    """Extract full feature matrix for a batch of grid points."""
    if isinstance(data, pd.DataFrame):
        records = data.to_dict(orient="records")
    else:
        records = data

    vectors = [extract_feature_vector(r) for r in records]
    return np.array(vectors, dtype=np.float32)
