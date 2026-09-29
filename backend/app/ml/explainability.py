import numpy as np
from typing import Dict, Any, List, Optional
import shap
from .feature_pipeline import extract_feature_vector, FEATURE_NAMES
from .model import get_bust_model

class MeteorologicalExplainer:
    """SHAP-based Meteorological Rationale and Operational Forecaster Attribution Engine."""

    def __init__(self):
        self.explainer = None
        self._init_explainer()

    def _init_explainer(self):
        """Initialize SHAP TreeExplainer from the underlying tree model."""
        bust_model = get_bust_model()
        if not bust_model.is_trained:
            bust_model.train()

        # Extract base tree estimator from CalibratedClassifierCV
        try:
            if hasattr(bust_model.classifier, "calibrated_classifiers_"):
                base_est = bust_model.classifier.calibrated_classifiers_[0].estimator
            else:
                base_est = bust_model.classifier
            self.explainer = shap.TreeExplainer(base_est)
        except Exception as e:
            print(f"Warning: TreeExplainer fallback: {e}")
            self.explainer = None

    def explain_point(self, point_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate operational meteorological explanation and SHAP attributions
        for a specific coordinate forecast.
        """
        if self.explainer is None:
            self._init_explainer()

        f_vec = extract_feature_vector(point_data)
        X_sample = np.array([f_vec], dtype=np.float32)

        lead_day = int(point_data.get("lead_day", 1))
        cape = float(point_data.get("cape", 1200.0))
        shear = float(point_data.get("wind_shear_850_200", 12.0))
        spread = float(point_data.get("ensemble_spread_proxy", 4.0))
        t_fcst = float(point_data.get("temp_2m_forecast", 32.0))
        p_fcst = float(point_data.get("precipitation_forecast", 10.0))
        mslp_fcst = float(point_data.get("mslp_forecast", 1008.0))
        region = point_data.get("region", "Central India")

        # Compute SHAP values
        shap_values_dict = {}
        if self.explainer is not None:
            try:
                raw_shap = self.explainer.shap_values(X_sample)
                # If binary classification returns list of [neg_class, pos_class] or 2D array
                if isinstance(raw_shap, list):
                    pos_shap = raw_shap[1][0]
                elif hasattr(raw_shap, "values"):
                    # Newer shap.Explanation object
                    pos_shap = raw_shap.values[0]
                    if pos_shap.ndim > 1:
                        pos_shap = pos_shap[:, 1]
                elif raw_shap.ndim == 3:
                    pos_shap = raw_shap[0, :, 1]
                else:
                    pos_shap = raw_shap[0]

                for name, val in zip(FEATURE_NAMES, pos_shap):
                    shap_values_dict[name] = float(val)
            except Exception as e:
                print(f"SHAP compute error, using feature heuristics: {e}")

        # Fallback heuristic attributions if SHAP computation failed
        if not shap_values_dict:
            shap_values_dict = {
                "lead_time": (lead_day / 10.0) * 0.45,
                "ensemble_spread": min(0.6, spread / 20.0),
                "cape": (cape / 3500.0) * 0.4,
                "wind_shear": (shear / 35.0) * 0.35,
                "instability_index": (cape * float(point_data.get("precipitable_water", 40.0))) / 150000.0,
                "precip_forecast": min(0.5, p_fcst / 150.0),
                "mslp_anomaly": max(0.0, (1008.0 - mslp_fcst) / 30.0),
                "thermal_stress_index": max(0.0, (t_fcst - 38.0) / 10.0),
                "orographic_proxy": 0.25 if "Ghats" in region or "Himalayas" in region else 0.05
            }

        # Rank top drivers by magnitude of positive contribution to Bust
        sorted_factors = sorted(
            shap_values_dict.items(),
            key=lambda x: x[1],
            reverse=True
        )

        top_drivers = []
        for name, impact in sorted_factors[:4]:
            top_drivers.append({
                "feature": name,
                "impact": round(impact, 4),
                "display_name": name.replace("_", " ").title(),
                "relative_weight": round(max(0.0, min(1.0, impact * 1.5)), 2)
            })

        # Synthesize Meteorological Rationales
        rationales = []
        if (shap_values_dict.get("cape", 0) > 0.05 or shap_values_dict.get("instability_index", 0) > 0.05) and cape > 1500.0:
            rationales.append({
                "category": "Convective Parameterization Breakdown",
                "severity": "HIGH",
                "explanation": (
                    f"Sub-grid scale moist convection is inadequately resolved by hydrostatic NWP assumptions "
                    f"under extreme thermodynamic instability (CAPE: {cape:.0f} J/kg). Global parameterization "
                    f"schemes (e.g. Tiedtke / Kain-Fritsch) under-represent localized updraft cores."
                )
            })

        if (shap_values_dict.get("wind_shear", 0) > 0.05 or shap_values_dict.get("vortex_intensity_proxy", 0) > 0.05) and shear > 16.0:
            rationales.append({
                "category": "Vortex Track & Speed Dispersion in NWP Core",
                "severity": "HIGH",
                "explanation": (
                    f"Strong 850–200 hPa vertical wind shear ({shear:.1f} m/s) induces asymmetric barotropic "
                    f"vortex tilt. The dynamical core over-disperses storm translational speed, triggering "
                    f"significant track and precipitation envelope divergence."
                )
            })

        if (shap_values_dict.get("lead_time", 0) > 0.05 or shap_values_dict.get("ensemble_spread", 0) > 0.05) and lead_day >= 4:
            rationales.append({
                "category": "Nonlinear Error Growth via Chaotic Drift",
                "severity": "MEDIUM" if lead_day < 7 else "CRITICAL",
                "explanation": (
                    f"At Lead Day {lead_day}, initial-condition perturbations have cascaded into the synoptic scale. "
                    f"Elevated ensemble spread proxy ({spread:.1f} mm) signifies crossing the deterministic "
                    f"predictability threshold over the tropical Indian domain."
                )
            })

        if shap_values_dict.get("thermal_stress_index", 0) > 0.05 or (t_fcst >= 40.0):
            rationales.append({
                "category": "Land-Surface Soil Moisture Coupling Deficit",
                "severity": "HIGH",
                "explanation": (
                    f"Extreme 2m temperature forecast ({t_fcst:.1f}°C) over {region} indicates persistent "
                    f"evaporative fraction overestimation in NWP Noah-MP land surface scheme, suppressing sensible heat flux."
                )
            })

        if shap_values_dict.get("orographic_proxy", 0) > 0.05 and ("Ghats" in region or "Himalayas" in region):
            rationales.append({
                "category": "Complex Orographic Boundary Layer Error",
                "severity": "MEDIUM",
                "explanation": (
                    f"Steep topographical gradients in {region} lead to smoothed grid-cell representation, "
                    f"failing to accurately capture low-level blocking and windward orographic precipitation dumping."
                )
            })

        if not rationales:
            rationales.append({
                "category": "Synoptic Stability & Model Convergence",
                "severity": "LOW",
                "explanation": (
                    f"Atmospheric flow over {region} exhibits strong synoptic geostrophic balance and modest "
                    f"ensemble spread ({spread:.1f} mm). Model guidance aligns closely with climatological attractors."
                )
            })

        # Operational Actionable Advisory for IMD Forecaster
        if point_data.get("bust_probability", 0.0) >= 0.65:
            advisory = (
                f"ACTIONABLE ADVISORY (ORANGE/RED ALERT): High bust probability detected at Day {lead_day}. "
                f"Suppress deterministic single-model rainfall peaks. Transition to multi-model ensemble consensus "
                f"(NCUM-G + GFS + ECMWF-IFS) and apply analog-based statistical downscaling for district disaster mitigation."
            )
        elif point_data.get("bust_probability", 0.0) >= 0.40:
            advisory = (
                f"ADVISORY (YELLOW WATCH): Moderate bust risk. Monitor high-resolution meso-scale models (NCUM-R 4km / WRF) "
                f"as lead time approaches 48 hours. Watch for sudden convective triggering over {region}."
            )
        else:
            advisory = (
                f"ADVISORY (GREEN / HIGH CONFIDENCE): Numerical guidance demonstrates high stability. "
                f"Standard operational forecasts and public advisories can be issued with standard margins."
            )

        return {
            "lat": point_data.get("lat"),
            "lon": point_data.get("lon"),
            "region": region,
            "lead_day": lead_day,
            "bust_probability": point_data.get("bust_probability", 0.0),
            "confidence_score": point_data.get("confidence_score", 100.0),
            "top_drivers": top_drivers,
            "rationales": rationales,
            "actionable_advisory": advisory
        }

# Global singleton
_explainer_instance: Optional[MeteorologicalExplainer] = None

def get_explainer() -> MeteorologicalExplainer:
    global _explainer_instance
    if _explainer_instance is None:
        _explainer_instance = MeteorologicalExplainer()
    return _explainer_instance
