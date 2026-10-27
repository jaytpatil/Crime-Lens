"""
Tests for Data Loader, Schema Mapping, and Quality Inspection.
"""

import pytest
from pathlib import Path
from app.services.data_loader import DataLoader
from app.config import settings

def test_data_loader_file_exists():
    loader = DataLoader()
    assert loader.check_file_exists() is True

def test_detect_column_mapping():
    loader = DataLoader()
    sample_cols = ["DR_NO", "Date Rptd", "DATE OCC", "TIME OCC", "AREA NAME", "Crm Cd Desc", "LAT", "LON"]
    mapping = loader.detect_column_mapping(sample_cols)
    assert "dr_no" in mapping
    assert "date_occurred" in mapping
    assert "area_name" in mapping
    assert "crime_desc" in mapping
    assert "latitude" in mapping
    assert "longitude" in mapping

def test_inspect_dataset_quality():
    loader = DataLoader()
    info = loader.inspect_dataset_quality(sample_size=1000)
    assert info["available"] is True
    assert info["total_records"] > 0
    assert info["total_columns"] >= 15
    assert "canonical_mapping" in info
    assert info["valid_coordinates_percentage"] > 90.0
