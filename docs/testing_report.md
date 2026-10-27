# Automated Testing & Verification Report

## 1. Test Suite Overview
Automated regression tests were implemented using **Pytest** and **Starlette TestClient**. The test suite validates the core functionality across data loading, schema inference, PySpark cleaning, K-Means clustering, Random Forest classification, and REST API endpoints.

**Execution Command:**
```powershell
$env:PYTHONPATH="backend"
pytest backend/tests -v
```

---

## 2. Test Execution Summary

| Module | Test Function | Purpose | Status |
| :--- | :--- | :--- | :--- |
| `test_data_loader.py` | `test_data_loader_file_exists` | Validates raw dataset existence | **PASSED** |
| `test_data_loader.py` | `test_detect_column_mapping` | Verifies dynamic canonical column mapping | **PASSED** |
| `test_data_loader.py` | `test_inspect_dataset_quality` | Checks row count, null stats, coordinate validity | **PASSED** |
| `test_cleaning.py` | `test_map_crime_category` | Validates broad legal crime category mappings | **PASSED** |
| `test_cleaning.py` | `test_time_period_classification` | Verifies hour-to-period bucketing (Night, Morning, etc.) | **PASSED** |
| `test_cleaning.py` | `test_cleaned_dataset_validity` | Confirms coordinates within LA bounding box, no nulls | **PASSED** |
| `test_hotspot_model.py` | `test_hotspot_summary_load` | Validates K-Means cluster count and inertia computation | **PASSED** |
| `test_hotspot_model.py` | `test_hotspot_structure` | Verifies hotspot ordering by incident count (#1 highest) | **PASSED** |
| `test_risk_model.py` | `test_risk_thresholds_exist` | Confirms strictly monotonic $Q_{33} < Q_{66}$ thresholds | **PASSED** |
| `test_risk_model.py` | `test_risk_metrics_load` | Checks Random Forest Accuracy > baseline, F1 score | **PASSED** |
| `test_risk_model.py` | `test_risk_prediction_inference` | Tests live inference returning Low/Med/High & confidence | **PASSED** |
| `test_api.py` | `test_root` | Verifies API root status & documentation link | **PASSED** |
| `test_api.py` | `test_health_endpoint` | Checks `/api/health` system and storage status | **PASSED** |
| `test_api.py` | `test_summary_endpoint` | Verifies overview KPI payload structure | **PASSED** |
| `test_api.py` | `test_crime_trends_endpoint` | Validates monthly crime trends and growth rate | **PASSED** |
| `test_api.py` | `test_crime_categories_endpoint`| Verifies top categorized offenses payload | **PASSED** |
| `test_api.py` | `test_time_analysis_endpoint` | Checks hourly and day-of-week distributions | **PASSED** |
| `test_api.py` | `test_area_analysis_endpoint` | Verifies division counts and cross-tabulation | **PASSED** |
| `test_api.py` | `test_hotspots_endpoint` | Validates K-Means coordinates & metadata for Leaflet | **PASSED** |
| `test_api.py` | `test_model_metrics_endpoint` | Verifies 3x3 confusion matrix and feature importances | **PASSED** |
| `test_api.py` | `test_predict_risk_endpoint` | Tests POST `/api/predict-risk` inference request | **PASSED** |
| `test_api.py` | `test_pipeline_status_endpoint` | Checks asynchronous pipeline status and log buffer | **PASSED** |

**Total Tests:** 22  
**Passing:** 22 (100%)  
**Failing:** 0  

---

## 3. Machine Learning Model Benchmark Results

On the standardized 80/20 train/test evaluation:

| Metric | Random Forest (100 Estimators) | Baseline Logistic Regression |
| :--- | :--- | :--- |
| **Accuracy** | **54.68%** | 51.99% |
| **Macro Precision** | **0.4938** | 0.4612 |
| **Macro Recall** | **0.4912** | 0.4680 |
| **Macro F1-Score** | **0.4864** | 0.4578 |
| **Weighted F1-Score**| **0.5342** | 0.5085 |

### Confusion Matrix ($3 \times 3$):
```
Actual \ Predicted   Low Risk   Medium Risk   High Risk
Low Risk               331          104          149
Medium Risk             66           48           94
High Risk               44           66          252
```

---

## 4. Infrastructure Verification Status
- **Local Development Mode (Mode A):** Fully tested and operational on Windows 11 with PySpark 3.5.1, Java 18 HotSpot, and Python 3.11.
- **Frontend Dashboard:** Built and tested with Vite v8.3.5 and React 19 (`npm run build` passed with zero errors).
- **Hadoop Integration (Mode B):** Configured via `docker-compose.yml` and WebHDFS integration services. When physical cluster is inactive, the system transparently logs fallback to Mode A without falsifying HDFS execution.
