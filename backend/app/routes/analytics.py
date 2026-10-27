"""
Analytics Routes: Trends, Categories, Time Analysis, Area Analysis, and Risk Distribution.
Supports query parameter filtering (area, category, date range).
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
import pandas as pd
import numpy as np

from app.services.crime_analytics import crime_analytics
from app.services.feature_engineering import feature_engineer
from app.services.risk_model import risk_model_service

router = APIRouter(tags=["Analytics"])

@router.get("/crime-trends")
def get_crime_trends(
    area: Optional[str] = Query(None, description="Filter by area name"),
    category: Optional[str] = Query(None, description="Filter by crime category"),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD")
):
    try:
        df = crime_analytics.get_cleaned_dataframe()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Processed dataset not found.")

    # Apply filters
    if area and area.strip() and area.lower() != "all":
        df = df[df["area_name"].str.lower() == area.strip().lower()]
    if category and category.strip() and category.lower() != "all":
        df = df[df["category"].str.lower() == category.strip().lower()]
    if start_date:
        df = df[df["date_occurred"] >= pd.to_datetime(start_date)]
    if end_date:
        df = df[df["date_occurred"] <= pd.to_datetime(end_date)]

    if df.empty:
        return {"trends": [], "message": "No incidents match the given filters."}

    monthly_series = (
        df.groupby(["year", "month", "month_name"])
        .size()
        .reset_index(name="incident_count")
    )
    monthly_series["period_label"] = monthly_series.apply(lambda r: f"{r['month_name']} {r['year']}", axis=1)
    
    monthly_series["prev_count"] = monthly_series["incident_count"].shift(1).fillna(0)
    monthly_series["mom_change_pct"] = (
        (monthly_series["incident_count"] - monthly_series["prev_count"]) / monthly_series["prev_count"].replace(0, np.nan) * 100
    ).round(2)
    monthly_series = monthly_series.fillna(0.0).replace([np.inf, -np.inf], 0.0)

    yearly_series = df.groupby("year").size().reset_index(name="incident_count").to_dict(orient="records")

    return {
        "filtered_total": len(df),
        "monthly_trends": monthly_series.to_dict(orient="records"),
        "yearly_counts": yearly_series
    }

@router.get("/crime-categories")
def get_crime_categories(limit: int = 15):
    try:
        analytics = crime_analytics.compute_all_analytics()
        return {
            "top_categories": analytics["top_categories"][:limit],
            "top_specific_crimes": analytics["top_specific_crimes"][:limit],
            "total_crimes": analytics["total_records"]
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Processed dataset not found.")

@router.get("/time-analysis")
def get_time_analysis():
    try:
        analytics = crime_analytics.compute_all_analytics()
        return {
            "hourly_distribution": analytics["hourly_distribution"],
            "day_of_week_distribution": analytics["day_of_week_distribution"],
            "time_period_distribution": analytics["time_period_distribution"],
            "weekday_vs_weekend": analytics["weekday_vs_weekend"]
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Processed dataset not found.")

@router.get("/area-analysis")
def get_area_analysis(limit: int = 25):
    try:
        analytics = crime_analytics.compute_all_analytics()
        return {
            "top_areas": analytics["top_areas"][:limit],
            "distinct_areas_count": analytics["distinct_areas"],
            "cross_tab_area_category": analytics["cross_tab_area_category"],
            "all_areas": analytics["area_list"]
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Processed dataset not found.")

@router.get("/risk-distribution")
def get_risk_distribution():
    try:
        metrics = risk_model_service.load_metrics()
        thresholds = metrics.get("thresholds", {})
        train_dist = metrics.get("class_distribution_train", {})
        test_dist = metrics.get("class_distribution_test", {})

        # Combined counts
        combined = []
        for cls in ["Low Risk", "Medium Risk", "High Risk"]:
            count = train_dist.get(cls, 0) + test_dist.get(cls, 0)
            combined.append({
                "category": cls,
                "incident_cells_count": count,
                "description": (
                    f"Aggregate cells with incident frequency <= {thresholds.get('q33_low_cutoff')}" if cls == "Low Risk"
                    else f"Aggregate cells with {thresholds.get('q33_low_cutoff')} < count <= {thresholds.get('q66_med_cutoff')}" if cls == "Medium Risk"
                    else f"Aggregate cells with incident frequency > {thresholds.get('q66_med_cutoff')}"
                )
            })

        return {
            "thresholds": thresholds,
            "risk_categories": combined,
            "train_distribution": train_dist,
            "test_distribution": test_dist
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Risk model has not been trained yet.")
