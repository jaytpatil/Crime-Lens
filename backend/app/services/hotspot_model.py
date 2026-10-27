"""
K-Means Clustering Hotspot Detection Module.
Discovers spatial crime incident clusters using geographical coordinates (Latitude, Longitude),
computes cluster centroids, observed incident density, dominant crime types, and ranks hotspots.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
import joblib
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from app.config import settings
from app.utils.logging_config import logger

class HotspotModel:
    def __init__(self, n_clusters: int = settings.KMEANS_N_CLUSTERS):
        self.n_clusters = n_clusters
        self.model_path = settings.MODELS_DIR / "kmeans_hotspots.joblib"
        self.scaler_path = settings.MODELS_DIR / "kmeans_scaler.joblib"
        self.summary_path = settings.MODELS_DIR / "hotspots_summary.json"
        self.model = None
        self.scaler = None
        self.summary_data = None

    def fit_and_save(self, df: pd.DataFrame, n_clusters: Optional[int] = None) -> Dict[str, Any]:
        """
        Fits K-Means clustering on valid geographical coordinates.
        Computes cluster centroids, incident volume, dominant crime category, and ranks hotspots.
        """
        k = n_clusters or self.n_clusters
        settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)

        # Coordinate subset
        coords = df[["latitude", "longitude"]].dropna()
        if len(coords) < k:
            raise ValueError(f"Insufficient coordinate records ({len(coords)}) to train {k} clusters.")

        logger.info(f"Training K-Means Hotspot Detector with K={k} clusters on {len(coords)} points...")

        # Scale coordinates for numerical stability
        scaler = StandardScaler()
        coords_scaled = scaler.fit_transform(coords)

        kmeans = KMeans(n_clusters=k, random_state=settings.RANDOM_SEED, n_init=10)
        kmeans.fit(coords_scaled)

        # Attach cluster labels to subset
        df_copy = df.loc[coords.index].copy()
        df_copy["cluster_id"] = kmeans.labels_

        # Cluster centers in original coordinate space
        centroids_orig = scaler.inverse_transform(kmeans.cluster_centers_)

        # Summarize each cluster
        hotspots = []
        for cluster_idx in range(k):
            cluster_subset = df_copy[df_copy["cluster_id"] == cluster_idx]
            count = len(cluster_subset)
            center_lat = float(centroids_orig[cluster_idx][0])
            center_lon = float(centroids_orig[cluster_idx][1])

            # Dominant crime category
            dominant_crime = "Unknown"
            if "category" in cluster_subset.columns and not cluster_subset.empty:
                top_cats = cluster_subset["category"].mode()
                if not top_cats.empty:
                    dominant_crime = top_cats.iloc[0]

            # Primary LAPD area in this cluster
            dominant_area = "Mixed Area"
            if "area_name" in cluster_subset.columns and not cluster_subset.empty:
                top_areas = cluster_subset["area_name"].mode()
                if not top_areas.empty:
                    dominant_area = top_areas.iloc[0]

            # Calculate approximate cluster radius in km (using max distance to center)
            if count > 1:
                lat_diff_km = (cluster_subset["latitude"] - center_lat) * 111.0
                lon_diff_km = (cluster_subset["longitude"] - center_lon) * 88.0
                distances_km = np.sqrt(lat_diff_km**2 + lon_diff_km**2)
                radius_km = round(float(np.percentile(distances_km, 85)), 2)
            else:
                radius_km = 0.5

            hotspots.append({
                "cluster_id": cluster_idx,
                "center_latitude": round(center_lat, 5),
                "center_longitude": round(center_lon, 5),
                "incident_count": count,
                "dominant_crime": dominant_crime,
                "dominant_area": dominant_area,
                "radius_km": max(radius_km, 0.4),
                "percentage_of_total": round(count / len(coords) * 100, 2)
            })

        # Rank hotspots by incident volume (Rank 1 = highest observed crime concentration)
        hotspots.sort(key=lambda x: x["incident_count"], reverse=True)
        for rank, h in enumerate(hotspots, start=1):
            h["hotspot_rank"] = rank

        # Inertia (sum of squared distances to closest centroid)
        inertia = float(kmeans.inertia_)

        summary = {
            "n_clusters": k,
            "total_incidents_analyzed": len(coords),
            "inertia": round(inertia, 2),
            "hotspots": hotspots,
            "top_hotspot": hotspots[0] if hotspots else None,
            "disclaimer": "Cluster numbers and rankings reflect historical incident density in observed data. They do not constitute a moral judgment or probabilistic forecast of individual behavior."
        }

        # Save artifacts
        joblib.dump(kmeans, self.model_path)
        joblib.dump(scaler, self.scaler_path)
        with open(self.summary_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)

        self.model = kmeans
        self.scaler = scaler
        self.summary_data = summary

        logger.info(f"K-Means model saved to {self.model_path}. Found {len(hotspots)} hotspots.")
        return summary

    def load_summary(self) -> Dict[str, Any]:
        """Loads cached hotspot summary metadata."""
        if self.summary_data is not None:
            return self.summary_data
        if self.summary_path.exists():
            with open(self.summary_path, "r", encoding="utf-8") as f:
                self.summary_data = json.load(f)
            return self.summary_data
        raise FileNotFoundError("Hotspot model summary not found. Train the hotspot model first.")

hotspot_service = HotspotModel()
