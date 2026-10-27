"""
Tests for Data Cleaning, Normalization, and PySpark/Local Processing.
"""

import pytest
import pandas as pd
from app.services.spark_processor import (
    map_crime_category, get_time_period, get_period_code,
    LA_LAT_MIN, LA_LAT_MAX, LA_LON_MIN, LA_LON_MAX
)
from app.services.crime_analytics import crime_analytics

def test_map_crime_category():
    assert map_crime_category("VEHICLE - STOLEN") == "Vehicle Theft"
    assert map_crime_category("BATTERY - SIMPLE ASSAULT") == "Assault & Battery"
    assert map_crime_category("BURGLARY FROM VEHICLE") == "Theft From Vehicle"
    assert map_crime_category("THEFT OF IDENTITY") == "Identity Theft"
    assert map_crime_category("UNKNOWN OFFENSE XYZ") == "Other Offenses"

def test_time_period_classification():
    assert "Night" in get_time_period(2)
    assert "Morning" in get_time_period(9)
    assert "Afternoon" in get_time_period(14)
    assert "Evening" in get_time_period(21)
    
    assert get_period_code("Night (00:00 - 05:59)") == 0
    assert get_period_code("Morning (06:00 - 11:59)") == 1
    assert get_period_code("Afternoon (12:00 - 17:59)") == 2
    assert get_period_code("Evening (18:00 - 23:59)") == 3

def test_cleaned_dataset_validity():
    df = crime_analytics.get_cleaned_dataframe()
    assert len(df) > 0
    # Coordinates must all be within valid bounds
    assert (df["latitude"] >= LA_LAT_MIN).all()
    assert (df["latitude"] <= LA_LAT_MAX).all()
    assert (df["longitude"] >= LA_LON_MIN).all()
    assert (df["longitude"] <= LA_LON_MAX).all()
    # No nulls in primary columns
    assert df["area_name"].isnull().sum() == 0
    assert df["category"].isnull().sum() == 0
    assert df["hour"].between(0, 23).all()
