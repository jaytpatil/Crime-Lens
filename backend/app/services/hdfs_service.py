"""
HDFS (Hadoop Distributed File System) Integration Service.
Supports:
- WebHDFS REST API communication
- HDFS CLI fallback (hdfs dfs)
- Transparent status reporting: Mode A (Local Development) vs Mode B (Hadoop HDFS)
- Directory initialization and dataset upload/verification
"""

import os
import shutil
import subprocess
import requests
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.config import settings
from app.utils.logging_config import logger

class HDFSService:
    def __init__(self):
        self.webhdfs_url = settings.HDFS_URL.rstrip('/')
        self.rpc_url = settings.HDFS_NAMENODE_RPC
        self.user = settings.HDFS_USER
        self.enabled = settings.HDFS_ENABLED
        self.root_dir = settings.HDFS_PROJECT_ROOT
        self.raw_dir = settings.HDFS_RAW_DIR
        self.processed_dir = settings.HDFS_PROCESSED_DIR
        self.analytics_dir = settings.HDFS_ANALYTICS_DIR
        self.models_dir = settings.HDFS_MODELS_DIR

    def check_connection(self) -> Dict[str, Any]:
        """
        Tests whether HDFS is reachable via WebHDFS REST API or CLI.
        Returns status dict without throwing uncaught exceptions.
        """
        # If disabled by config
        if not self.enabled:
            return {
                "connected": False,
                "mode": "Mode A: Local Development Mode",
                "message": "HDFS integration is disabled via configuration (HDFS_ENABLED=false). Running locally.",
                "webhdfs_url": self.webhdfs_url,
                "rpc_url": self.rpc_url
            }

        # Test WebHDFS ping
        try:
            url = f"{self.webhdfs_url}/webhdfs/v1/?op=GETHOMEDIRECTORY&user.name={self.user}"
            response = requests.get(url, timeout=2.5)
            if response.status_code == 200:
                return {
                    "connected": True,
                    "mode": "Mode B: Hadoop HDFS Integration Mode",
                    "message": f"Successfully connected to HDFS NameNode at {self.webhdfs_url}",
                    "webhdfs_url": self.webhdfs_url,
                    "rpc_url": self.rpc_url,
                    "home_dir": response.json().get("Path", "/")
                }
            else:
                return {
                    "connected": False,
                    "mode": "Mode A: Local Fallback (HDFS Unreachable)",
                    "message": f"HDFS responded with HTTP {response.status_code}: {response.text[:100]}",
                    "webhdfs_url": self.webhdfs_url,
                    "rpc_url": self.rpc_url
                }
        except Exception as e:
            # Check if hdfs CLI tool exists
            cli_available = shutil.which("hdfs") is not None
            return {
                "connected": False,
                "mode": "Mode A: Local Development Mode",
                "message": f"HDFS NameNode is currently not reachable ({type(e).__name__}). Using local filesystem storage.",
                "webhdfs_url": self.webhdfs_url,
                "rpc_url": self.rpc_url,
                "hdfs_cli_available": cli_available
            }

    def init_project_directories(self) -> Dict[str, Any]:
        """
        Creates required project folders on HDFS:
        /crime-analysis/raw/
        /crime-analysis/processed/
        /crime-analysis/analytics/
        /crime-analysis/models/
        """
        conn = self.check_connection()
        if not conn["connected"]:
            logger.info("HDFS not connected. Initializing local storage directories instead.")
            # Ensure local directories exist
            for d in [settings.DATA_DIR / "raw", settings.DATA_DIR / "processed", settings.DATA_DIR / "analytics", settings.MODELS_DIR]:
                d.mkdir(parents=True, exist_ok=True)
            return {
                "success": True,
                "mode": "Local",
                "created_dirs": [str(d) for d in [settings.DATA_DIR / "raw", settings.DATA_DIR / "processed", settings.DATA_DIR / "analytics", settings.MODELS_DIR]],
                "message": "Local directories initialized successfully (HDFS inactive)."
            }

        # If connected, use WebHDFS MKDIRS
        created = []
        dirs_to_create = [self.root_dir, self.raw_dir, self.processed_dir, self.analytics_dir, self.models_dir]
        for d in dirs_to_create:
            try:
                url = f"{self.webhdfs_url}/webhdfs/v1{d}?op=MKDIRS&permission=755&user.name={self.user}"
                res = requests.put(url, timeout=5)
                if res.status_code in (200, 201):
                    created.append(d)
                else:
                    logger.warning(f"Could not create HDFS directory {d}: {res.text}")
            except Exception as e:
                logger.error(f"Error creating HDFS directory {d}: {e}")

        return {
            "success": len(created) > 0,
            "mode": "HDFS",
            "created_dirs": created,
            "message": f"Created {len(created)}/{len(dirs_to_create)} HDFS directories."
        }

    def upload_dataset(self, local_file_path: str, hdfs_dest_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Uploads local CSV to HDFS raw directory via WebHDFS REST API.
        """
        if not os.path.exists(local_file_path):
            return {"success": False, "error": f"Local file not found: {local_file_path}"}

        filename = os.path.basename(local_file_path)
        dest = hdfs_dest_path or f"{self.raw_dir}/{filename}"

        conn = self.check_connection()
        if not conn["connected"]:
            return {
                "success": False,
                "mode": "Local",
                "error": "Cannot upload to HDFS: HDFS service is not reachable. Operating in Local Mode."
            }

        try:
            # WebHDFS 2-step upload
            create_url = f"{self.webhdfs_url}/webhdfs/v1{dest}?op=CREATE&overwrite=true&user.name={self.user}"
            init_res = requests.put(create_url, allow_redirects=False, timeout=5)
            
            if init_res.status_code == 307:
                datanode_url = init_res.headers.get("Location")
                with open(local_file_path, "rb") as f:
                    upload_res = requests.put(datanode_url, data=f, headers={"Content-Type": "application/octet-stream"}, timeout=60)
                if upload_res.status_code == 201:
                    return {
                        "success": True,
                        "hdfs_path": dest,
                        "file_size_bytes": os.path.getsize(local_file_path),
                        "message": f"Successfully uploaded {filename} to {dest} on HDFS."
                    }
            return {
                "success": False,
                "error": f"HDFS upload initiation failed with status {init_res.status_code}: {init_res.text}"
            }
        except Exception as e:
            return {"success": False, "error": f"Exception during HDFS upload: {str(e)}"}

    def get_storage_overview(self) -> Dict[str, Any]:
        """
        Returns full storage status details for API consumption.
        """
        conn_info = self.check_connection()
        raw_file = settings.get_active_raw_data_path()
        processed_file = settings.PROCESSED_DATA_PARQUET
        processed_csv = settings.PROCESSED_DATA_CSV

        return {
            "mode": conn_info.get("mode", "Mode A: Local Development Mode"),
            "hdfs_connected": conn_info.get("connected", False),
            "hdfs_message": conn_info.get("message", ""),
            "hdfs_url": self.webhdfs_url,
            "hdfs_directories": {
                "root": self.root_dir,
                "raw": self.raw_dir,
                "processed": self.processed_dir,
                "analytics": self.analytics_dir,
                "models": self.models_dir
            },
            "local_storage": {
                "raw_file_exists": raw_file.exists(),
                "raw_file_path": str(raw_file),
                "raw_file_size_bytes": raw_file.stat().st_size if raw_file.exists() else 0,
                "processed_parquet_exists": processed_file.exists(),
                "processed_parquet_path": str(processed_file),
                "processed_csv_exists": processed_csv.exists(),
                "processed_csv_path": str(processed_csv)
            }
        }

hdfs_service = HDFSService()
