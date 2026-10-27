"""
Tests for FastAPI REST Endpoints using TestClient.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "documentation" in response.json()

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "execution_mode" in data
    assert "dataset_status" in data

def test_summary_endpoint():
    response = client.get("/api/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_incidents"] > 0
    assert data["distinct_crime_categories"] > 0
    assert "top_area" in data

def test_crime_trends_endpoint():
    response = client.get("/api/crime-trends")
    assert response.status_code == 200
    data = response.json()
    assert "monthly_trends" in data
    assert len(data["monthly_trends"]) > 0

def test_crime_categories_endpoint():
    response = client.get("/api/crime-categories")
    assert response.status_code == 200
    data = response.json()
    assert "top_categories" in data
    assert len(data["top_categories"]) > 0

def test_time_analysis_endpoint():
    response = client.get("/api/time-analysis")
    assert response.status_code == 200
    data = response.json()
    assert "hourly_distribution" in data
    assert len(data["hourly_distribution"]) == 24
    assert "day_of_week_distribution" in data
    assert len(data["day_of_week_distribution"]) == 7

def test_area_analysis_endpoint():
    response = client.get("/api/area-analysis")
    assert response.status_code == 200
    data = response.json()
    assert "top_areas" in data
    assert len(data["top_areas"]) > 0

def test_hotspots_endpoint():
    response = client.get("/api/hotspots")
    assert response.status_code == 200
    data = response.json()
    assert "hotspots" in data
    assert len(data["hotspots"]) == 12

def test_model_metrics_endpoint():
    response = client.get("/api/model-metrics")
    assert response.status_code == 200
    data = response.json()
    assert "accuracy" in data
    assert "confusion_matrix" in data

def test_predict_risk_endpoint():
    payload = {
        "area_name": "Central",
        "month": 5,
        "day_of_week": 2,
        "time_period_code": 1
    }
    response = client.post("/api/predict-risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_risk_category"] in ["Low Risk", "Medium Risk", "High Risk"]
    assert "confidence_percentage" in data

def test_pipeline_status_endpoint():
    response = client.get("/api/pipeline/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "logs" in data
