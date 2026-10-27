"""
Application Configuration Module
Handles environment variables, storage paths, HDFS, Spark, and model settings.
"""

import os
from pathlib import Path
from pydantic import BaseModel

# Base project root directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "Crime Pattern Analysis and Risk Prediction"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Environment & Host
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Storage Paths
    DATA_DIR: Path = BASE_DIR / "data"
    RAW_DATA_PATH: Path = BASE_DIR / "data" / "raw" / "crime_data_sample.csv"
    KAGGLE_RAW_DATA_PATH: Path = BASE_DIR / "data" / "raw" / "Crime_Data_from_2020_to_Present.csv"
    SAMPLE_DATA_PATH: Path = BASE_DIR / "data" / "sample" / "crime_data_sample.csv"
    PROCESSED_DATA_PARQUET: Path = BASE_DIR / "data" / "processed" / "crime_cleaned.parquet"
    PROCESSED_DATA_CSV: Path = BASE_DIR / "data" / "processed" / "crime_cleaned.csv"
    MODELS_DIR: Path = BASE_DIR / "models"
    
    # Hadoop / HDFS Settings
    HDFS_ENABLED: bool = os.getenv("HDFS_ENABLED", "false").lower() in ("true", "1", "yes")
    HDFS_URL: str = os.getenv("HDFS_URL", "http://localhost:9870")
    HDFS_NAMENODE_RPC: str = os.getenv("HDFS_NAMENODE_RPC", "hdfs://localhost:9000")
    HDFS_USER: str = os.getenv("HDFS_USER", "hadoop")
    HDFS_PROJECT_ROOT: str = "/crime-analysis"
    HDFS_RAW_DIR: str = "/crime-analysis/raw"
    HDFS_PROCESSED_DIR: str = "/crime-analysis/processed"
    HDFS_ANALYTICS_DIR: str = "/crime-analysis/analytics"
    HDFS_MODELS_DIR: str = "/crime-analysis/models"
    
    # Apache Spark Settings
    SPARK_APP_NAME: str = "CrimePatternAnalytics"
    SPARK_MASTER: str = os.getenv("SPARK_MASTER", "local[*]")
    
    # Machine Learning Settings
    KMEANS_N_CLUSTERS: int = 12
    RANDOM_SEED: int = 42
    
    def get_active_raw_data_path(self) -> Path:
        """
        Returns Kaggle raw dataset if present; otherwise returns sample dataset.
        """
        if self.KAGGLE_RAW_DATA_PATH.exists():
            return self.KAGGLE_RAW_DATA_PATH
        if self.RAW_DATA_PATH.exists():
            return self.RAW_DATA_PATH
        if self.SAMPLE_DATA_PATH.exists():
            return self.SAMPLE_DATA_PATH
        return self.RAW_DATA_PATH

settings = Settings()
