"""
Data Loader and Ingestion Module.
Inspects datasets, maps arbitrary schemas to canonical names, validates data quality,
and computes dataset health metrics.
"""

import os
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np

from app.config import settings
from app.utils.logging_config import logger

CANONICAL_SCHEMA = {
    "dr_no": ["dr_no", "division_record_number", "id", "case_number"],
    "date_reported": ["date rptd", "date_rptd", "date_reported", "reported_date"],
    "date_occurred": ["date occ", "date_occ", "date_occurred", "occurred_date", "incident_date"],
    "time_occurred": ["time occ", "time_occ", "time_occurred", "occurred_time", "incident_time"],
    "area_id": ["area", "area_code", "area_id", "precinct"],
    "area_name": ["area name", "area_name", "areaname", "district_name", "neighborhood"],
    "reporting_district": ["rpt dist no", "rpt_dist_no", "district", "reporting_district"],
    "crime_code": ["crm cd", "crm_cd", "crime_code", "offense_code"],
    "crime_desc": ["crm cd desc", "crm_cd_desc", "crime_description", "crime_type", "offense_desc"],
    "victim_age": ["vict age", "vict_age", "victim_age", "age"],
    "victim_sex": ["vict sex", "vict_sex", "victim_sex", "gender"],
    "victim_descent": ["vict descent", "vict_descent", "ethnicity"],
    "premise_code": ["premis cd", "premis_cd", "premise_code"],
    "premise_desc": ["premis desc", "premis_desc", "premise_description", "location_type"],
    "weapon_code": ["weapon used cd", "weapon_used_cd"],
    "weapon_desc": ["weapon desc", "weapon_desc"],
    "status_code": ["status", "status_code"],
    "status_desc": ["status desc", "status_desc", "disposition"],
    "location": ["location", "address", "street_address"],
    "latitude": ["lat", "latitude", "y_coord", "y"],
    "longitude": ["lon", "longitude", "x_coord", "x"]
}

class DataLoader:
    def __init__(self, file_path: Optional[str] = None):
        self.file_path = Path(file_path) if file_path else settings.get_active_raw_data_path()

    def check_file_exists(self) -> bool:
        return self.file_path.exists() and self.file_path.is_file()

    def detect_column_mapping(self, sample_cols: List[str]) -> Dict[str, str]:
        """
        Maps source dataset columns to canonical column names.
        Returns dict: { canonical_name: actual_source_col }
        """
        mapping = {}
        cols_lower = {col.strip().lower(): col for col in sample_cols}

        for canonical, aliases in CANONICAL_SCHEMA.items():
            for alias in aliases:
                if alias in cols_lower:
                    mapping[canonical] = cols_lower[alias]
                    break

        return mapping

    def inspect_dataset_quality(self, sample_size: int = 50000) -> Dict[str, Any]:
        """
        Analyzes the dataset file without loading everything into memory at once if huge.
        Returns dataset dimensions, column presence, missing values, duplicates, and date range.
        """
        if not self.check_file_exists():
            return {
                "available": False,
                "error": f"Dataset file not found at: {self.file_path}",
                "path": str(self.file_path)
            }

        file_size_mb = round(self.file_path.stat().st_size / (1024 * 1024), 2)
        
        # Read header only
        header_df = pd.read_csv(self.file_path, nrows=5)
        raw_columns = list(header_df.columns)
        col_mapping = self.detect_column_mapping(raw_columns)

        # Fast line count for CSV
        total_rows = 0
        with open(self.file_path, "rb") as f:
            for chunk in iter(lambda: f.read(1024 * 1024), b""):
                total_rows += chunk.count(b"\n")
        # Subtract header row
        total_rows = max(0, total_rows - 1)

        # Read sample for null/duplicate analysis
        sample_df = pd.read_csv(self.file_path, nrows=min(sample_size, total_rows if total_rows > 0 else 10000))
        
        missing_counts = sample_df.isnull().sum().to_dict()
        duplicate_sample_count = int(sample_df.duplicated().sum())

        # Date range inspection if occurred date column found
        min_date_str = "N/A"
        max_date_str = "N/A"
        date_col = col_mapping.get("date_occurred")
        if date_col and date_col in sample_df.columns:
            try:
                dt_series = pd.to_datetime(sample_df[date_col], errors="coerce").dropna()
                if not dt_series.empty:
                    min_date_str = dt_series.min().strftime("%Y-%m-%d")
                    max_date_str = dt_series.max().strftime("%Y-%m-%d")
            except Exception as e:
                logger.warning(f"Date parsing warning: {e}")

        # Coordinates validity check
        valid_coords_pct = 0.0
        lat_col = col_mapping.get("latitude")
        lon_col = col_mapping.get("longitude")
        if lat_col and lon_col and lat_col in sample_df.columns and lon_col in sample_df.columns:
            valid_coords = sample_df[
                (sample_df[lat_col].notnull()) &
                (sample_df[lon_col].notnull()) &
                (sample_df[lat_col] != 0.0) &
                (sample_df[lon_col] != 0.0)
            ]
            valid_coords_pct = round((len(valid_coords) / max(len(sample_df), 1)) * 100, 2)

        return {
            "available": True,
            "path": str(self.file_path),
            "file_size_mb": file_size_mb,
            "total_records": total_rows,
            "sample_inspected_rows": len(sample_df),
            "total_columns": len(raw_columns),
            "raw_columns": raw_columns,
            "canonical_mapping": col_mapping,
            "missing_values_sample": missing_counts,
            "duplicate_rows_sample": duplicate_sample_count,
            "date_range": {
                "start": min_date_str,
                "end": max_date_str
            },
            "valid_coordinates_percentage": valid_coords_pct,
            "dataset_is_sample": "sample" in self.file_path.name.lower()
        }

    def load_canonical_dataframe(self, max_rows: Optional[int] = None) -> pd.DataFrame:
        """
        Loads CSV and returns DataFrame with standardized canonical column names.
        """
        if not self.check_file_exists():
            raise FileNotFoundError(f"Dataset not found: {self.file_path}")

        df = pd.read_csv(self.file_path, nrows=max_rows, low_memory=False)
        col_mapping = self.detect_column_mapping(list(df.columns))

        # Invert mapping: { actual_col: canonical_col }
        rename_map = {actual: canonical for canonical, actual in col_mapping.items()}
        df = df.rename(columns=rename_map)

        return df
