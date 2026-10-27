"""
Hotspots Route: Returns K-Means spatial cluster centers, observed incident density,
dominant crime categories, and hotspot rankings for Leaflet map visualization.
"""

from fastapi import APIRouter, HTTPException, Query
from app.services.hotspot_model import hotspot_service

router = APIRouter(tags=["Hotspots"])

@router.get("/hotspots")
def get_crime_hotspots(min_incidents: int = Query(0, description="Minimum incidents filter")):
    try:
        summary = hotspot_service.load_summary()
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Hotspot model has not been trained yet. Trigger pipeline to train K-Means model."
        )

    hotspots = summary.get("hotspots", [])
    if min_incidents > 0:
        hotspots = [h for h in hotspots if h["incident_count"] >= min_incidents]

    return {
        "n_clusters": summary.get("n_clusters", len(hotspots)),
        "total_incidents_analyzed": summary.get("total_incidents_analyzed", 0),
        "inertia": summary.get("inertia", 0.0),
        "hotspots": hotspots,
        "top_hotspot": summary.get("top_hotspot"),
        "disclaimer": summary.get("disclaimer")
    }
