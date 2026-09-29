import time
from .model import AeroBustModel
from ..utils.synth_data import generate_training_dataset
from ..config import MODEL_FILE

def run_training_pipeline():
    """Reproducible training and evaluation script for AeroBust-AI."""
    print("=" * 70)
    print("      AeroBust-AI: Training Weather Forecast Bust Prediction System     ")
    print("=" * 70)

    start_t = time.time()
    print("[1/3] Generating synthetic NWP vs Reanalysis dataset across India grid...")
    df_train = generate_training_dataset(sample_step=1.0)
    print(f"      Generated {len(df_train):,} spatiotemporal grid slices.")
    print(f"      Class balance (Bust=1): {df_train['is_bust_ground_truth'].mean() * 100:.1f}%")

    print("\n[2/3] Training Calibrated Gradient Boosting Classifier & Confidence Model...")
    model = AeroBustModel()
    metrics = model.train(df_train)

    elapsed = time.time() - start_t
    print("\n[3/3] Training Complete & Artifacts Persisted!")
    print(f"      Model File: {MODEL_FILE}")
    print(f"      Model Type: {metrics.get('model_type')}")
    print(f"      Training AUC: {metrics.get('train_auc'):.4f}")
    print(f"      Brier Score Loss: {metrics.get('train_brier_score'):.4f}")
    print(f"      Total Training Time: {elapsed:.2f} seconds")
    print("=" * 70)
    return metrics

if __name__ == "__main__":
    run_training_pipeline()
