"""
Tests for K-Means Hotspot Clustering Model.
"""

import pytest
from app.services.hotspot_model import hotspot_service

def test_hotspot_summary_load():
    summary = hotspot_service.load_summary()
    assert summary["n_clusters"] == 12
    assert summary["total_incidents_analyzed"] > 1000
    assert summary["inertia"] > 0
    assert len(summary["hotspots"]) == 12

def test_hotspot_structure():
    summary = hotspot_service.load_summary()
    top = summary["top_hotspot"]
    assert top is not None
    assert "center_latitude" in top
    assert "center_longitude" in top
    assert "incident_count" in top
    assert "dominant_crime" in top
    assert "dominant_area" in top
    assert top["hotspot_rank"] == 1
    # Check ranking order
    hotspots = summary["hotspots"]
    for i in range(len(hotspots) - 1):
        assert hotspots[i]["incident_count"] >= hotspots[i+1]["incident_count"]
