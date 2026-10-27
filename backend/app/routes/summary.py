"""
Summary KPIs and overview endpoints.
"""

from fastapi import APIRouter, HTTPException
from app.services.crime_analytics import crime_analytics
from app.services.hotspot_model import hotspot_service
from app.services.risk_model import risk_model_service
from app.config import settings

router = APIRouter(tags=["Summary"])

@router.get("/summary")
def get_kpi_summary():
    try:
        analytics = crime_analytics.compute_all_analytics()
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Processed data not found. Please trigger the data processing pipeline first."
        )

    hotspot_count = 0
    top_hotspot_name = "N/A"
    try:
        hotspots = hotspot_service.load_summary()
        hotspot_count = hotspots.get("n_clusters", 0)
        if hotspots.get("top_hotspot"):
            top_hotspot_name = hotspots["top_hotspot"].get("dominant_area", "N/A")
    except Exception:
        pass

    model_acc = "N/A"
    try:
        metrics = risk_model_service.load_metrics()
        model_acc = f"{metrics['accuracy']:.1%}"
    except Exception:
        pass

    top_area = analytics["top_areas"][0]["area_name"] if analytics.get("top_areas") else "N/A"
    top_area_count = analytics["top_areas"][0]["incident_count"] if analytics.get("top_areas") else 0

    return {
        "total_incidents": analytics["total_records"],
        "distinct_crime_categories": analytics["distinct_categories"],
        "distinct_specific_offenses": analytics["distinct_raw_crimes"],
        "distinct_areas": analytics["distinct_areas"],
        "top_area": {
            "name": top_area,
            "incident_count": top_area_count
        },
        "hotspots_identified": hotspot_count,
        "highest_density_hotspot_area": top_hotspot_name,
        "risk_model_accuracy": model_acc,
        "date_range": analytics["date_range"],
        "weekday_vs_weekend": analytics["weekday_vs_weekend"],
        "system_status": "Ready",
        "dataset_name": settings.get_active_raw_data_path().name
    }
