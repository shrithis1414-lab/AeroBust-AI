from pathlib import Path

# Base Paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
APP_DIR = BACKEND_DIR / "app"
MODELS_DIR = BACKEND_DIR / "saved_models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_FILE = MODELS_DIR / "bust_model.joblib"
METADATA_FILE = MODELS_DIR / "model_meta.json"

# Geospatial Bounding Box (India Subcontinent)
LAT_MIN = 6.0
LAT_MAX = 38.0
LON_MIN = 68.0
LON_MAX = 98.0
GRID_STEP = 0.5

# Lead time continuum
LEAD_DAYS_MIN = 1
LEAD_DAYS_MAX = 10

# Forecast Bust Mathematical Thresholds
RAIN_BUST_ABS_DIFF = 50.0       # mm/day error
RAIN_BUST_REL_ERR = 1.0         # >100% relative error
RAIN_BUST_MIN_TRUTH = 35.0      # truth threshold for relative error
TEMP_BUST_ABS_DIFF = 3.5        # °C error over heatwave / thermal zones

# Operational Alert Criteria
ALERT_PROBABILITY_THRESHOLD = 0.65

# Meteorological Scenarios Definition
METEOROLOGICAL_SCENARIOS = {
    "monsoon_depression": {
        "id": "monsoon_depression",
        "name": "Monsoon Depression (Bay of Bengal to Central India)",
        "category": "Monsoon System",
        "season": "Southwest Monsoon (JJAS)",
        "synoptic_narrative": (
            "Deep monsoon depression tracking West-Northwestward from North Bay of Bengal "
            "across Odisha, Chhattisgarh, and Madhya Pradesh. NWP exhibits massive rainfall "
            "underestimation on Days 3–6 due to delayed low-level jet moisture convergence."
        ),
        "primary_regions": ["Odisha Coast", "Central India", "Chhattisgarh", "Vidarbha"],
        "critical_lead_days": [3, 4, 5, 6],
        "primary_bust_type": "heavy_rain"
    },
    "western_disturbance": {
        "id": "western_disturbance",
        "name": "Western Disturbance (North & Northwest India)",
        "category": "Extra-Tropical Trough",
        "season": "Winter / Pre-Monsoon (DJF/MAM)",
        "synoptic_narrative": (
            "Fast-moving mid-tropospheric baroclinic wave entering Jammu & Kashmir, Punjab, "
            "and Himachal Pradesh. NWP models overestimate trough eastward propagation speed, "
            "causing phase displacement in precipitation and severe temperature drop busts on Days 2–5."
        ),
        "primary_regions": ["Jammu & Kashmir", "Himachal Pradesh", "Punjab", "Uttarakhand"],
        "critical_lead_days": [2, 3, 4, 5],
        "primary_bust_type": "temperature_and_precip"
    },
    "tropical_cyclone": {
        "id": "tropical_cyclone",
        "name": "Tropical Cyclone (Arabian Sea / Bay of Bengal)",
        "category": "Tropical Cyclone",
        "season": "Post-Monsoon / Pre-Monsoon Cyclonic Season",
        "synoptic_narrative": (
            "Very Severe Cyclonic Storm (VSCS) with rapid intensification over warm oceanic SST. "
            "Beyond Day 4, ensemble spread explodes with acute recurvature track divergence "
            "and severe central pressure / maximum sustained wind speed underestimation."
        ),
        "primary_regions": ["Gujarat Coast", "Saurashtra & Kutch", "North Arabian Sea", "Konkan"],
        "critical_lead_days": [4, 5, 6, 7, 8],
        "primary_bust_type": "wind_and_pressure"
    },
    "heatwave_vidarbha": {
        "id": "heatwave_vidarbha",
        "name": "Severe Heatwave (Gangetic Plains & Vidarbha)",
        "category": "Thermodynamic Extreme",
        "season": "Pre-Monsoon Summer (April–June)",
        "synoptic_narrative": (
            "Persistent anticyclonic subsidence and advection of dry continental thermal plumes from "
            "Thar desert into Vidarbha and Gangetic plains. Numerical models suffer persistent cold biases "
            "on Days 5–10 (>3.5°C) from deficient land-surface soil moisture coupling."
        ),
        "primary_regions": ["Vidarbha", "Marathwada", "Gangetic Plains", "West Rajasthan"],
        "critical_lead_days": [5, 6, 7, 8, 9, 10],
        "primary_bust_type": "heatwave"
    },
    "active_break_monsoon": {
        "id": "active_break_monsoon",
        "name": "Active-to-Break Monsoon Transition",
        "category": "Intraseasonal Oscillation",
        "season": "Peak Monsoon (July–August)",
        "synoptic_narrative": (
            "Monsoon trough shifts abruptly northward to Himalayan foothills while convective activity "
            "along Western Ghats collapses. Global NWP convective parameterization fails to capture "
            "the sudden dry intrusion and boundary layer wind shear decoupling."
        ),
        "primary_regions": ["Western Ghats", "Kerala Coast", "Konkan-Goa", "Himalayan Foothills"],
        "critical_lead_days": [3, 4, 5, 6, 7],
        "primary_bust_type": "convective_breakdown"
    }
}
