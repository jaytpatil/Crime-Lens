"""
Standalone Model Training Script.
Trains:
1. K-Means Hotspot Clustering Model (Spatial)
2. Random Forest Crime Risk Classification Model (Spatio-Temporal)
"""

import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.config import settings
from app.services.spark_processor import spark_processor
from app.services.crime_analytics import crime_analytics
from app.services.hotspot_model import hotspot_service
from app.services.risk_model import risk_model_service
from app.utils.logging_config import logger

def run_training_pipeline():
    logger.info("==================================================")
    logger.info("CRIME PATTERN ANALYSIS - MODEL TRAINING PIPELINE")
    logger.info("==================================================")

    # 1. Check or run data processing
    if not settings.PROCESSED_DATA_CSV.exists() and not settings.PROCESSED_DATA_PARQUET.exists():
        logger.info("Processed data not found. Running PySpark processing first...")
        spark_processor.process()

    df = crime_analytics.get_cleaned_dataframe()
    logger.info(f"Loaded {len(df)} cleaned records for machine learning training.")

    # 2. Train K-Means Hotspot Model
    logger.info("\n--- STEP 1: K-Means Hotspot Clustering ---")
    hotspot_results = hotspot_service.fit_and_save(df)
    logger.info(f"K-Means training completed: {hotspot_results['n_clusters']} clusters, Inertia={hotspot_results['inertia']}")
    for h in hotspot_results["hotspots"][:3]:
        logger.info(f"  Hotspot #{h['hotspot_rank']}: Area={h['dominant_area']}, Incidents={h['incident_count']}, Dominant Crime={h['dominant_crime']}")

    # 3. Train Random Forest Risk Classification Model
    logger.info("\n--- STEP 2: Random Forest Crime Risk Classification ---")
    risk_results = risk_model_service.train_and_evaluate(df)
    logger.info(f"Classification Model: {risk_results['model_type']}")
    logger.info(f"Accuracy: {risk_results['accuracy']:.2%} | F1 Score: {risk_results['f1_macro']:.4f}")
    logger.info(f"Baseline (Logistic Regression) Accuracy: {risk_results['baseline_accuracy']:.2%}")
    logger.info(f"Confusion Matrix:\n  Labels: {risk_results['confusion_matrix']['labels']}\n  Matrix: {risk_results['confusion_matrix']['matrix']}")

    # 4. Sample inference test
    logger.info("\n--- STEP 3: Sample Inference Test ---")
    test_pred = risk_model_service.predict_risk(
        area_name="Central",
        month=7,
        day_of_week=5,
        time_period_code=3
    )
    logger.info(f"Sample Prediction for Central (Saturday Night): {test_pred['predicted_risk_category']} (Confidence: {test_pred['confidence_percentage']}%)")

    logger.info("\n==================================================")
    logger.info("MODEL TRAINING SUCCESSFUL! Artifacts saved to models/")
    logger.info("==================================================")

if __name__ == "__main__":
    run_training_pipeline()
