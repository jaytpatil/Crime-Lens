"""
Feature Engineering and Target Label Generation Module.
Aggregates crime records across spatio-temporal units (Area, Month, Day of Week, Time Period)
and computes quantile-based historical incident frequency thresholds (Low, Medium, High).
"""

import json
from pathlib import Path
from typing import Dict, Any, Tuple
import pandas as pd
import numpy as np

from app.config import settings
from app.utils.logging_config import logger

class FeatureEngineer:
    def __init__(self):
        self.thresholds_path = settings.MODELS_DIR / "risk_thresholds.json"

    def build_spatio_temporal_aggregations(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Groups cleaned incident records into spatio-temporal cells:
        (area_name, month, day_of_week_num, period_code, is_weekend)
        Computes incident frequency per cell.
        """
        group_cols = ["area_name", "month", "day_of_week_num", "period_code", "is_weekend"]
        agg_df = (
            df.groupby(group_cols)
            .size()
            .reset_index(name="incident_count")
        )
        return agg_df

    def compute_risk_thresholds(self, train_counts: pd.Series) -> Dict[str, float]:
        """
        Computes tertile/quantile thresholds strictly on the training partition
        to prevent data leakage.
        Low Risk: count <= Q_33
        Medium Risk: Q_33 < count <= Q_66
        High Risk: count > Q_66
        """
        q33 = float(np.percentile(train_counts, 33.33))
        q66 = float(np.percentile(train_counts, 66.67))
        
        # Ensure distinct cutoffs even if data is tightly clustered
        if q33 == q66:
            q66 = q33 + 1.0

        thresholds = {
            "q33_low_cutoff": round(q33, 2),
            "q66_med_cutoff": round(q66, 2),
            "min_count": int(train_counts.min()),
            "max_count": int(train_counts.max()),
            "median_count": float(train_counts.median())
        }
        return thresholds

    def assign_risk_labels(self, counts: pd.Series, thresholds: Dict[str, float]) -> pd.Series:
        """
        Maps incident counts to 3 discrete risk categories based on pre-fit thresholds.
        0: Low Risk
        1: Medium Risk
        2: High Risk
        """
        q33 = thresholds["q33_low_cutoff"]
        q66 = thresholds["q66_med_cutoff"]

        def categorize(val):
            if val <= q33:
                return "Low Risk"
            elif val <= q66:
                return "Medium Risk"
            else:
                return "High Risk"

        return counts.apply(categorize)

    def save_thresholds(self, thresholds: Dict[str, Any]):
        settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
        with open(self.thresholds_path, "w", encoding="utf-8") as f:
            json.dump(thresholds, f, indent=2)

    def load_thresholds(self) -> Dict[str, Any]:
        if self.thresholds_path.exists():
            with open(self.thresholds_path, "r", encoding="utf-8") as f:
                return json.load(f)
        raise FileNotFoundError("Risk thresholds not found. Train the risk model first.")

feature_engineer = FeatureEngineer()
