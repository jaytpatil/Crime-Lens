"""
Data Pipeline Management Endpoints.
Monitors execution status, triggers data processing & ML model training in the background,
and reports dataset quality and storage mode.
"""

import threading
import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.config import settings
from app.services.data_loader import DataLoader
from app.services.hdfs_service import hdfs_service
from app.services.spark_processor import spark_processor
from app.services.hotspot_model import hotspot_service
from app.services.risk_model import risk_model_service
from app.services.crime_analytics import crime_analytics
from app.utils.logging_config import logger
from app.utils.validation import PipelineRunRequest

router = APIRouter(prefix="/pipeline", tags=["Pipeline"])

# Global state tracker for background pipeline execution
PIPELINE_STATE = {
    "status": "idle",  # "idle", "running", "completed", "failed"
    "current_stage": "None",
    "progress_percent": 100 if settings.PROCESSED_DATA_CSV.exists() else 0,
    "last_run_time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") if settings.PROCESSED_DATA_CSV.exists() else None,
    "error_message": None,
    "logs": [
        "System initialized.",
        "Datasets and models ready." if settings.PROCESSED_DATA_CSV.exists() else "Awaiting pipeline trigger."
    ]
}

STATE_LOCK = threading.Lock()

def execute_pipeline_task(n_clusters: int = 12):
    """Background worker function executing the full pipeline safely."""
    global PIPELINE_STATE
    try:
        with STATE_LOCK:
            PIPELINE_STATE["status"] = "running"
            PIPELINE_STATE["error_message"] = None
            PIPELINE_STATE["progress_percent"] = 10
            PIPELINE_STATE["current_stage"] = "1/4: Ingesting & Validating Raw Dataset"
            PIPELINE_STATE["logs"].append(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Ingesting raw dataset...")

        loader = DataLoader()
        quality_info = loader.inspect_dataset_quality()
        if not quality_info.get("available"):
            raise FileNotFoundError(f"Raw dataset file missing: {quality_info.get('error')}")

        with STATE_LOCK:
            PIPELINE_STATE["progress_percent"] = 35
            PIPELINE_STATE["current_stage"] = "2/4: PySpark Distributed Data Cleaning"
            PIPELINE_STATE["logs"].append(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Executing PySpark cleaning and coordinate filtering...")

        process_res = spark_processor.process()
        with STATE_LOCK:
            PIPELINE_STATE["logs"].append(
                f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Processing complete ({process_res['engine']}). "
                f"Cleaned {process_res['cleaned_records']}/{process_res['raw_records']} records."
            )

        with STATE_LOCK:
            PIPELINE_STATE["progress_percent"] = 65
            PIPELINE_STATE["current_stage"] = "3/4: Spatial K-Means Hotspot Clustering"
            PIPELINE_STATE["logs"].append(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Fitting K-Means (K={n_clusters}) on coordinates...")

        df = crime_analytics.get_cleaned_dataframe()
        hotspot_res = hotspot_service.fit_and_save(df, n_clusters=n_clusters)
        with STATE_LOCK:
            PIPELINE_STATE["logs"].append(
                f"[{datetime.datetime.now().strftime('%H:%M:%S')}] K-Means complete: {hotspot_res['n_clusters']} hotspots identified."
            )

        with STATE_LOCK:
            PIPELINE_STATE["progress_percent"] = 85
            PIPELINE_STATE["current_stage"] = "4/4: Random Forest Risk Model Training"
            PIPELINE_STATE["logs"].append(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Training Random Forest Classifier on spatio-temporal cells...")

        risk_res = risk_model_service.train_and_evaluate(df)
        with STATE_LOCK:
            PIPELINE_STATE["logs"].append(
                f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Model trained. Test Accuracy: {risk_res['accuracy']:.1%}, F1: {risk_res['f1_macro']:.4f}"
            )

        with STATE_LOCK:
            PIPELINE_STATE["status"] = "completed"
            PIPELINE_STATE["progress_percent"] = 100
            PIPELINE_STATE["current_stage"] = "Completed"
            PIPELINE_STATE["last_run_time"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            PIPELINE_STATE["logs"].append(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Pipeline executed successfully.")

    except Exception as e:
        logger.error(f"Pipeline execution failure: {e}", exc_info=True)
        with STATE_LOCK:
            PIPELINE_STATE["status"] = "failed"
            PIPELINE_STATE["error_message"] = str(e)
            PIPELINE_STATE["current_stage"] = "Failed"
            PIPELINE_STATE["logs"].append(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] ERROR: {str(e)}")

@router.get("/status")
def get_pipeline_status():
    with STATE_LOCK:
        # Keep latest 30 log lines
        recent_logs = PIPELINE_STATE["logs"][-30:]
        return {
            "status": PIPELINE_STATE["status"],
            "current_stage": PIPELINE_STATE["current_stage"],
            "progress_percent": PIPELINE_STATE["progress_percent"],
            "last_run_time": PIPELINE_STATE["last_run_time"],
            "error_message": PIPELINE_STATE["error_message"],
            "logs": recent_logs,
            "storage_mode": hdfs_service.get_storage_overview()["mode"]
        }

@router.post("/run")
def trigger_pipeline_run(request: PipelineRunRequest, background_tasks: BackgroundTasks):
    with STATE_LOCK:
        if PIPELINE_STATE["status"] == "running":
            raise HTTPException(status_code=409, detail="A pipeline job is already currently running. Please wait.")

    # Launch background thread
    background_tasks.add_task(execute_pipeline_task, request.n_clusters or 12)
    return {
        "message": "Data processing and ML model training pipeline started in background.",
        "status": "running"
    }

@router.get("/dataset-info")
def get_dataset_info():
    loader = DataLoader()
    raw_info = loader.inspect_dataset_quality()
    
    cleaned_count = 0
    cleaned_cols = []
    if settings.PROCESSED_DATA_CSV.exists():
        try:
            cdf = pd.read_csv(settings.PROCESSED_DATA_CSV, nrows=5)
            cleaned_cols = list(cdf.columns)
            # count lines
            with open(settings.PROCESSED_DATA_CSV, "rb") as f:
                cleaned_count = sum(1 for _ in f) - 1
        except Exception:
            pass

    return {
        "raw_dataset": raw_info,
        "processed_dataset": {
            "exists": settings.PROCESSED_DATA_CSV.exists(),
            "record_count": cleaned_count,
            "columns": cleaned_cols,
            "parquet_available": settings.PROCESSED_DATA_PARQUET.exists()
        },
        "storage": hdfs_service.get_storage_overview()
    }
