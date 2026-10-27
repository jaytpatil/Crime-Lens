"""
Tests for Risk Classification Model and Inference.
"""

import pytest
from app.services.risk_model import risk_model_service
from app.services.feature_engineering import feature_engineer

def test_risk_thresholds_exist():
    thresholds = feature_engineer.load_thresholds()
    assert "q33_low_cutoff" in thresholds
    assert "q66_med_cutoff" in thresholds
    assert thresholds["q33_low_cutoff"] < thresholds["q66_med_cutoff"]

def test_risk_metrics_load():
    metrics = risk_model_service.load_metrics()
    assert metrics["model_type"] == "Random Forest Classifier"
    assert metrics["accuracy"] > 0.40
    assert metrics["baseline_accuracy"] > 0.40
    assert "confusion_matrix" in metrics
    assert len(metrics["feature_importances"]) > 0

def test_risk_prediction_inference():
    pred = risk_model_service.predict_risk(
        area_name="Central",
        month=6,
        day_of_week=4,
        time_period_code=3
    )
    assert pred["predicted_risk_category"] in ["Low Risk", "Medium Risk", "High Risk"]
    assert 0 <= pred["confidence_percentage"] <= 100
    assert "class_probabilities" in pred
    assert len(pred["class_probabilities"]) == 3
    assert "disclaimer" in pred
