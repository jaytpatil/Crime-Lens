"""
Crime Pattern Analytics Service.
Computes 12 comprehensive exploratory data analysis metrics and insights from cleaned crime data.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from app.config import settings
from app.utils.logging_config import logger

class CrimeAnalyticsService:
    def __init__(self):
        self._cached_df = None
        self._cached_timestamp = 0

    def get_cleaned_dataframe(self) -> pd.DataFrame:
        """Loads cleaned dataset from Parquet or CSV."""
        # Check Parquet first
        if settings.PROCESSED_DATA_PARQUET.exists():
            return pd.read_parquet(settings.PROCESSED_DATA_PARQUET)
        elif settings.PROCESSED_DATA_CSV.exists():
            df = pd.read_csv(settings.PROCESSED_DATA_CSV)
            if "date_occurred" in df.columns:
                df["date_occurred"] = pd.to_datetime(df["date_occurred"], errors="coerce")
            return df
        else:
            raise FileNotFoundError("Processed dataset does not exist. Run the data processing pipeline first.")

    def compute_all_analytics(self, df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """
        Computes the complete suite of analytical insights from processed crime records.
        """
        if df is None:
            df = self.get_cleaned_dataframe()

        total_records = len(df)
        if total_records == 0:
            return {"error": "Processed crime dataset is empty"}

        # 1. Total records
        # 2. Distinct crime categories
        distinct_categories = int(df["category"].nunique()) if "category" in df.columns else 0
        distinct_raw_crimes = int(df["crime_desc"].nunique()) if "crime_desc" in df.columns else 0

        # 3. Represented geographical areas
        distinct_areas = int(df["area_name"].nunique()) if "area_name" in df.columns else 0
        area_list = sorted(df["area_name"].dropna().unique().tolist()) if "area_name" in df.columns else []

        # 4. Crime distribution by year and month
        monthly_series = df.groupby(["year", "month", "month_name"]).size().reset_index(name="incident_count")
        monthly_series["period_label"] = monthly_series.apply(lambda r: f"{r['month_name']} {r['year']}", axis=1)
        monthly_trends = monthly_series.to_dict(orient="records")

        yearly_counts = df.groupby("year").size().reset_index(name="incident_count").to_dict(orient="records")

        # 5. Crime distribution by day of the week
        day_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        dow_df = df.groupby("day_of_week").size().reindex(day_order).fillna(0).reset_index(name="incident_count")
        dow_df["percentage"] = (dow_df["incident_count"] / total_records * 100).round(2)
        day_of_week_distribution = dow_df.to_dict(orient="records")

        # 6. Crime distribution by hour and time period
        hourly_counts = (
            df.groupby("hour").size()
            .reindex(range(24))
            .fillna(0)
            .reset_index(name="incident_count")
        )
        hourly_counts["hour_label"] = hourly_counts["hour"].apply(lambda h: f"{h:02d}:00")
        hourly_distribution = hourly_counts.to_dict(orient="records")

        period_order = [
            "Night (00:00 - 05:59)",
            "Morning (06:00 - 11:59)",
            "Afternoon (12:00 - 17:59)",
            "Evening (18:00 - 23:59)"
        ]
        period_df = df.groupby("time_period").size().reindex(period_order).fillna(0).reset_index(name="incident_count")
        period_df["percentage"] = (period_df["incident_count"] / total_records * 100).round(2)
        time_period_distribution = period_df.to_dict(orient="records")

        # 7. Most frequently reported crime categories
        cat_df = df.groupby("category").size().sort_values(ascending=False).reset_index(name="incident_count")
        cat_df["percentage"] = (cat_df["incident_count"] / total_records * 100).round(2)
        top_categories = cat_df.to_dict(orient="records")

        raw_crime_top = (
            df.groupby("crime_desc").size()
            .sort_values(ascending=False).head(10)
            .reset_index(name="incident_count")
        )
        raw_crime_top["percentage"] = (raw_crime_top["incident_count"] / total_records * 100).round(2)
        top_specific_crimes = raw_crime_top.to_dict(orient="records")

        # 8. Areas with highest historical incident counts
        area_df = df.groupby("area_name").size().sort_values(ascending=False).reset_index(name="incident_count")
        area_df["percentage"] = (area_df["incident_count"] / total_records * 100).round(2)
        top_areas = area_df.to_dict(orient="records")

        # 9. Monthly and yearly changes in incident counts (Growth rate %)
        monthly_series["prev_count"] = monthly_series["incident_count"].shift(1).fillna(0)
        monthly_series["mom_change_pct"] = (
            (monthly_series["incident_count"] - monthly_series["prev_count"]) / monthly_series["prev_count"].replace(0, np.nan) * 100
        ).round(2)
        monthly_series = monthly_series.fillna(0.0).replace([np.inf, -np.inf], 0.0)
        monthly_trends_with_change = monthly_series.to_dict(orient="records")

        # 10. Crime-category distribution across geographical areas (cross-tabulation)
        top_5_areas = area_df.head(5)["area_name"].tolist()
        top_5_cats = cat_df.head(5)["category"].tolist()
        sub_df = df[df["area_name"].isin(top_5_areas) & df["category"].isin(top_5_cats)]
        cross_tab = pd.crosstab(sub_df["area_name"], sub_df["category"]).reset_index()
        cross_tab_data = cross_tab.to_dict(orient="records")

        # 11. Weekday versus weekend patterns
        weekend_count = int(df["is_weekend"].sum())
        weekday_count = total_records - weekend_count
        weekday_vs_weekend = {
            "weekday_count": weekday_count,
            "weekday_pct": round(weekday_count / total_records * 100, 2),
            "weekend_count": weekend_count,
            "weekend_pct": round(weekend_count / total_records * 100, 2),
            "daily_avg_weekday": round(weekday_count / 5, 1),
            "daily_avg_weekend": round(weekend_count / 2, 1)
        }

        # Date range
        min_date = df["date_occurred"].min()
        max_date = df["date_occurred"].max()
        date_range_info = {
            "start": min_date.strftime("%Y-%m-%d") if pd.notnull(min_date) else "N/A",
            "end": max_date.strftime("%Y-%m-%d") if pd.notnull(max_date) else "N/A",
            "total_days": (max_date - min_date).days if pd.notnull(min_date) and pd.notnull(max_date) else 0
        }

        return {
            "total_records": total_records,
            "distinct_categories": distinct_categories,
            "distinct_raw_crimes": distinct_raw_crimes,
            "distinct_areas": distinct_areas,
            "area_list": area_list,
            "date_range": date_range_info,
            "monthly_trends": monthly_trends_with_change,
            "yearly_counts": yearly_counts,
            "day_of_week_distribution": day_of_week_distribution,
            "hourly_distribution": hourly_distribution,
            "time_period_distribution": time_period_distribution,
            "top_categories": top_categories,
            "top_specific_crimes": top_specific_crimes,
            "top_areas": top_areas,
            "cross_tab_area_category": cross_tab_data,
            "weekday_vs_weekend": weekday_vs_weekend
        }

crime_analytics = CrimeAnalyticsService()
