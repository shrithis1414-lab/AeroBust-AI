import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import roc_auc_score, brier_score_loss, log_loss

try:
    from lightgbm import LGBMClassifier
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False

from ..config import MODEL_FILE, METADATA_FILE
from .feature_pipeline import extract_features, FEATURE_NAMES
from ..utils.synth_data import generate_training_dataset

class AeroBustModel:
    """Production-grade Bust Probability Classifier & Confidence Estimator."""

    def __init__(self):
        self.classifier = None
        self.is_trained = False
        self.metadata = {}

    def train(self, df_train: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """Train calibrated Gradient Boosting classifier on synthetic meteorological data."""
        if df_train is None:
            df_train = generate_training_dataset(sample_step=1.0)

        X = extract_features(df_train)
        y = df_train["is_bust_ground_truth"].values.astype(int)

        # Baseline classifier: LightGBM with scikit-learn fallback
        if HAS_LIGHTGBM:
            base_estimator = LGBMClassifier(
                n_estimators=120,
                learning_rate=0.08,
                max_depth=5,
                num_leaves=31,
                random_state=42,
                verbose=-1
            )
        else:
            base_estimator = HistGradientBoostingClassifier(
                max_iter=120,
                learning_rate=0.08,
                max_depth=5,
                random_state=42
            )

        # Calibrate with Isotonic Regression for true posterior probabilities P(Bust | X)
        calibrated_clf = CalibratedClassifierCV(
            estimator=base_estimator,
            method="isotonic",
            cv=3
        )
        calibrated_clf.fit(X, y)

        # Evaluate metrics
        y_prob = calibrated_clf.predict_proba(X)[:, 1]
        auc = float(roc_auc_score(y, y_prob))
        brier = float(brier_score_loss(y, y_prob))

        self.classifier = calibrated_clf
        self.is_trained = True
        self.metadata = {
            "model_type": "Calibrated LGBMClassifier" if HAS_LIGHTGBM else "Calibrated HistGradientBoosting",
            "calibration_method": "isotonic",
            "num_features": len(FEATURE_NAMES),
            "features": FEATURE_NAMES,
            "train_samples": int(len(y)),
            "train_auc": round(auc, 4),
            "train_brier_score": round(brier, 4)
        }

        # Save model and metadata
        self.save()
        return self.metadata

    def save(self, filepath=MODEL_FILE):
        """Persist model and metadata to disk."""
        joblib.dump(self.classifier, filepath)
        joblib.dump(self.metadata, METADATA_FILE)

    def load(self, filepath=MODEL_FILE) -> bool:
        """Load trained model weights from disk if available."""
        if os.path.exists(filepath):
            try:
                self.classifier = joblib.load(filepath)
                if os.path.exists(METADATA_FILE):
                    self.metadata = joblib.load(METADATA_FILE)
                self.is_trained = True
                return True
            except Exception as e:
                print(f"Warning: Failed loading saved model: {e}")
                self.is_trained = False
        return False

    def predict_probabilities(self, X: np.ndarray) -> np.ndarray:
        """Predict calibrated bust probabilities for feature matrix."""
        if not self.is_trained:
            raise RuntimeError("Model is not trained or loaded.")
        probs = self.classifier.predict_proba(X)[:, 1]
        return probs

    @staticmethod
    def compute_confidence_index(
        bust_prob: float,
        ensemble_spread: float,
        lead_day: int
    ) -> float:
        """
        Compute operational Forecast Confidence Index (0–100%):
        Confidence = max(0, 100 * (1 - (Normalized Spread + Historical Error Cluster) / 2))
        """
        # Normalized spread (spread typically 2-20 mm)
        normalized_spread = min(1.0, max(0.0, (ensemble_spread - 1.5) / 16.0))
        
        # Historical error cluster proxy based on predicted bust probability & lead time
        lead_time_drift = min(1.0, (lead_day - 1) / 9.0)
        error_cluster = min(1.0, max(0.0, (bust_prob * 0.75) + (lead_time_drift * 0.25)))
        
        penalty = (normalized_spread + error_cluster) / 2.0
        confidence = max(0.0, min(100.0, 100.0 * (1.0 - penalty)))
        return round(float(confidence), 1)

    def predict_grid(self, grid_points: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Enrich a grid slice with predicted bust probabilities, confidence scores,
        and operational risk tags.
        """
        if not self.is_trained:
            if not self.load():
                self.train()

        X = extract_features(grid_points)
        probs = self.predict_probabilities(X)

        enriched = []
        for i, point in enumerate(grid_points):
            prob = float(probs[i])
            lead_day = point.get("lead_day", 1)
            spread = point.get("ensemble_spread_proxy", 3.0)
            
            conf = self.compute_confidence_index(
                bust_prob=prob,
                ensemble_spread=spread,
                lead_day=lead_day
            )

            # Operational risk category
            if prob >= 0.75:
                risk_level = "CRITICAL BUST RISK"
            elif prob >= 0.50:
                risk_level = "ELEVATED BUST RISK"
            elif prob >= 0.25:
                risk_level = "MODERATE RISK"
            else:
                risk_level = "NOMINAL (HIGH CONFIDENCE)"

            item = dict(point)
            item["bust_probability"] = round(prob, 4)
            item["confidence_score"] = conf
            item["risk_level"] = risk_level
            enriched.append(item)

        return enriched

# Global singleton instance with auto-training
_model_instance: Optional[AeroBustModel] = None

def get_bust_model() -> AeroBustModel:
    """Retrieve or initialize singleton model with automatic weights verification."""
    global _model_instance
    if _model_instance is None:
        model = AeroBustModel()
        if not model.load():
            print("No saved weights found. Auto-training AeroBust-AI model...")
            model.train()
        _model_instance = model
    return _model_instance
