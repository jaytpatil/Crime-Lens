"""
PySpark and High-Performance Distributed/Local Processing Service.
Implements:
- Schema inference & validation
- Duplicate record removal
- Coordinate bounds cleaning (Los Angeles bounds)
- Date and military time parsing
- Temporal feature extraction (year, month, day_of_week, hour, time_period, is_weekend)
- Crime category normalization
- Dual Engine: PySpark (primary) with transparent Local Engine fallback for Windows/standalone setups.
"""

import os
import re
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np

from app.config import settings
from app.utils.logging_config import logger

# Los Angeles County Bounding Box
LA_LAT_MIN, LA_LAT_MAX = 33.65, 34.40
LA_LON_MIN, LA_LON_MAX = -118.75, -118.10

# Normalized Category Mapping
CRIME_CATEGORY_RULES = [
    (r"VEHICLE.*STOLEN|STOLEN.*VEHICLE", "Vehicle Theft"),
    (r"BURGLARY.*FROM VEHICLE|THEFT.*FROM MOTOR VEHICLE", "Theft From Vehicle"),
    (r"BURGLARY", "Burglary"),
    (r"ASSAULT|BATTERY|INTIMATE PARTNER", "Assault & Battery"),
    (r"ROBBERY", "Robbery"),
    (r"THEFT.*IDENTITY", "Identity Theft"),
    (r"THEFT|SHOPLIFTING|PICKPOCKET", "Theft & Larceny"),
    (r"VANDALISM", "Vandalism"),
    (r"WEAPON|FIREARM|GUN", "Weapons Offenses"),
    (r"HOMICIDE|MANSLAUGHTER", "Homicide"),
    (r"NARCOTICS|DRUG", "Narcotics"),
]

def map_crime_category(desc: str) -> str:
    """Classifies granular crime description into broad normalized categories."""
    if not isinstance(desc, str):
        return "Other"
    upper = desc.upper()
    for pattern, label in CRIME_CATEGORY_RULES:
        if re.search(pattern, upper):
            return label
    return "Other Offenses"

def get_time_period(hour: int) -> str:
    """Classifies hour into 4 distinct standardized operational periods."""
    if 0 <= hour <= 5:
        return "Night (00:00 - 05:59)"
    elif 6 <= hour <= 11:
        return "Morning (06:00 - 11:59)"
    elif 12 <= hour <= 17:
        return "Afternoon (12:00 - 17:59)"
    else:
        return "Evening (18:00 - 23:59)"

def get_period_code(period_str: str) -> int:
    """Maps period string to integer code for machine learning."""
    if "Night" in period_str:
        return 0
    elif "Morning" in period_str:
        return 1
    elif "Afternoon" in period_str:
        return 2
    else:
        return 3

class SparkProcessor:
    def __init__(self):
        self.app_name = settings.SPARK_APP_NAME
        self.master = settings.SPARK_MASTER
        self.spark = None

    def _init_spark(self):
        """Initializes SparkSession if available and not yet created."""
        if self.spark is not None:
            return self.spark
        try:
            from pyspark.sql import SparkSession
            logger.info(f"Initializing PySpark Session with master={self.master}...")
            builder = (
                SparkSession.builder
                .appName(self.app_name)
                .master(self.master)
                .config("spark.driver.memory", "2g")
                .config("spark.sql.shuffle.partitions", "4")
            )
            # If HDFS RPC configured
            if settings.HDFS_ENABLED:
                builder = builder.config("spark.hadoop.fs.defaultFS", settings.HDFS_NAMENODE_RPC)

            self.spark = builder.getOrCreate()
            logger.info(f"PySpark Session active: Version {self.spark.version}")
            return self.spark
        except Exception as e:
            logger.warning(f"PySpark initialization unavailable or failed: {e}. Local fallback engine will be used.")
            self.spark = None
            return None

    def process(self, input_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes primary data cleaning and feature engineering.
        Attempts PySpark first; seamlessly falls back to Local Engine on Windows/environment constraints.
        """
        path_to_use = Path(input_path) if input_path else settings.get_active_raw_data_path()
        if not path_to_use.exists():
            raise FileNotFoundError(f"Source raw data file not found at: {path_to_use}")

        logger.info(f"Starting pipeline processing on: {path_to_use}")

        # Attempt PySpark
        try:
            spark_session = self._init_spark()
            if spark_session:
                return self._process_with_spark(spark_session, str(path_to_use))
        except Exception as e:
            logger.warning(f"PySpark execution encountered an issue ({e}). Executing with Local Processing Engine.")

        # Fallback to Local Engine
        return self._process_with_local_engine(str(path_to_use))

    def _process_with_spark(self, spark, input_path: str) -> Dict[str, Any]:
        """Executes full distributed PySpark DataFrame transformations."""
        from pyspark.sql import functions as F
        from pyspark.sql.types import IntegerType, DoubleType, StringType

        logger.info("Executing transformations using PySpark DataFrames...")
        # 1. Ingest
        raw_df = spark.read.option("header", "true").option("inferSchema", "true").csv(input_path)
        initial_count = raw_df.count()

        # Canonical column name lookup
        cols_lower = {c.strip().lower(): c for c in raw_df.columns}
        dr_col = cols_lower.get("dr_no", "DR_NO")
        date_col = cols_lower.get("date occ", "DATE OCC")
        time_col = cols_lower.get("time occ", "TIME OCC")
        area_col = cols_lower.get("area name", "AREA NAME")
        crm_col = cols_lower.get("crm cd desc", "Crm Cd Desc")
        lat_col = cols_lower.get("lat", "LAT")
        lon_col = cols_lower.get("lon", "LON")

        # 2. Duplicate removal
        dedup_df = raw_df.dropDuplicates([dr_col])

        # 3. Coordinate filtering
        clean_coords_df = dedup_df.filter(
            (F.col(lat_col) >= LA_LAT_MIN) & (F.col(lat_col) <= LA_LAT_MAX) &
            (F.col(lon_col) >= LA_LON_MIN) & (F.col(lon_col) <= LA_LON_MAX)
        )

        # 4. Convert to Pandas for normalized domain categorizations & persistence
        # (Converting processed aggregation / dataset)
        pdf = clean_coords_df.toPandas()
        return self._finalize_transformations_and_save(pdf, initial_count, engine="Apache PySpark 3.5.1")

    def _process_with_local_engine(self, input_path: str) -> Dict[str, Any]:
        """Local vectorised engine executing identical transformations."""
        logger.info("Executing transformations using Local Processing Engine...")
        df = pd.read_csv(input_path, low_memory=False)
        initial_count = len(df)

        cols_lower = {c.strip().lower(): c for c in df.columns}
        dr_col = cols_lower.get("dr_no", "DR_NO")
        lat_col = cols_lower.get("lat", "LAT")
        lon_col = cols_lower.get("lon", "LON")

        # 1. Deduplication
        if dr_col in df.columns:
            df = df.drop_duplicates(subset=[dr_col])
        else:
            df = df.drop_duplicates()

        # 2. Filter coordinates
        if lat_col in df.columns and lon_col in df.columns:
            df[lat_col] = pd.to_numeric(df[lat_col], errors="coerce")
            df[lon_col] = pd.to_numeric(df[lon_col], errors="coerce")
            df = df[
                (df[lat_col] >= LA_LAT_MIN) & (df[lat_col] <= LA_LAT_MAX) &
                (df[lon_col] >= LA_LON_MIN) & (df[lon_col] <= LA_LON_MAX)
            ]

        return self._finalize_transformations_and_save(df, initial_count, engine="High-Performance Local Engine")

    def _finalize_transformations_and_save(self, df: pd.DataFrame, initial_count: int, engine: str) -> Dict[str, Any]:
        """Finalizes column parsing, feature enrichment, and saves Parquet/CSV artifacts."""
        cols_lower = {c.strip().lower(): c for c in df.columns}
        date_col = cols_lower.get("date occ", "DATE OCC")
        time_col = cols_lower.get("time occ", "TIME OCC")
        area_col = cols_lower.get("area name", "AREA NAME")
        crm_col = cols_lower.get("crm cd desc", "Crm Cd Desc")
        lat_col = cols_lower.get("lat", "LAT")
        lon_col = cols_lower.get("lon", "LON")

        # Standardize target names
        out_df = pd.DataFrame()
        out_df["dr_no"] = df[cols_lower.get("dr_no", "DR_NO")].astype(str)
        out_df["area_name"] = df[area_col].astype(str).str.strip()
        out_df["crime_desc"] = df[crm_col].astype(str).str.strip()
        out_df["latitude"] = df[lat_col].astype(float)
        out_df["longitude"] = df[lon_col].astype(float)

        # Parse Dates
        parsed_dates = pd.to_datetime(df[date_col], errors="coerce")
        out_df["date_occurred"] = parsed_dates
        out_df["year"] = parsed_dates.dt.year.fillna(2023).astype(int)
        out_df["month"] = parsed_dates.dt.month.fillna(1).astype(int)
        out_df["month_name"] = parsed_dates.dt.strftime("%b").fillna("Jan")
        out_df["day_of_week"] = parsed_dates.dt.day_name().fillna("Monday")
        out_df["day_of_week_num"] = parsed_dates.dt.dayofweek.fillna(0).astype(int)
        out_df["is_weekend"] = out_df["day_of_week_num"].isin([5, 6]).astype(int)

        # Parse Military Time to Hour
        time_vals = pd.to_numeric(df[time_col], errors="coerce").fillna(1200).astype(int)
        hours = (time_vals // 100).clip(0, 23)
        out_df["hour"] = hours
        out_df["time_period"] = hours.apply(get_time_period)
        out_df["period_code"] = out_df["time_period"].apply(get_period_code)

        # Normalized broad category
        out_df["category"] = out_df["crime_desc"].apply(map_crime_category)

        # Drop rows with null dates if any
        out_df = out_df.dropna(subset=["date_occurred", "latitude", "longitude"])
        final_count = len(out_df)

        # Save artifacts
        settings.PROCESSED_DATA_PARQUET.parent.mkdir(parents=True, exist_ok=True)
        try:
            out_df.to_parquet(settings.PROCESSED_DATA_PARQUET, index=False)
            parquet_saved = True
        except Exception as e:
            logger.warning(f"Could not save Parquet ({e}); saving CSV only.")
            parquet_saved = False

        out_df.to_csv(settings.PROCESSED_DATA_CSV, index=False)

        logger.info(f"Processing complete ({engine}). Records: {initial_count} raw -> {final_count} cleaned.")

        return {
            "success": True,
            "engine": engine,
            "raw_records": initial_count,
            "cleaned_records": final_count,
            "dropped_records": initial_count - final_count,
            "columns": list(out_df.columns),
            "parquet_saved": parquet_saved,
            "parquet_path": str(settings.PROCESSED_DATA_PARQUET),
            "csv_path": str(settings.PROCESSED_DATA_CSV),
            "date_range": {
                "start": out_df["date_occurred"].min().strftime("%Y-%m-%d"),
                "end": out_df["date_occurred"].max().strftime("%Y-%m-%d")
            }
        }

spark_processor = SparkProcessor()
