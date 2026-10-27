"""
Health check and system status endpoint.
"""

from fastapi import APIRouter
from app.config import settings
from app.services.hdfs_service import hdfs_service
from app.services.data_loader import DataLoader

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health_status():
    loader = DataLoader()
    raw_exists = loader.check_file_exists()
    processed_exists = settings.PROCESSED_DATA_CSV.exists() or settings.PROCESSED_DATA_PARQUET.exists()
    models_exist = (
        (settings.MODELS_DIR / "kmeans_hotspots.joblib").exists() and
        (settings.MODELS_DIR / "risk_classifier.joblib").exists()
    )
    storage_info = hdfs_service.get_storage_overview()

    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "execution_mode": storage_info["mode"],
        "hdfs_connected": storage_info["hdfs_connected"],
        "dataset_status": {
            "raw_dataset_available": raw_exists,
            "processed_dataset_available": processed_exists,
            "models_trained": models_exist
        },
        "storage": storage_info
    }
