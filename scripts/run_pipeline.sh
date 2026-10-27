#!/usr/bin/env bash
# ==============================================================================
# Complete Big Data Pipeline Runner (Linux / WSL / Docker)
# Ingestion -> PySpark Processing -> K-Means Hotspots -> Random Forest Training
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "${SCRIPT_DIR}")"

export PYTHONPATH="${PROJECT_ROOT}/backend"

echo "=================================================="
echo "Starting Crime Pattern Analysis Big Data Pipeline"
echo "Project Root: ${PROJECT_ROOT}"
echo "=================================================="

# Check if sample data exists; if not, generate it
if [ ! -f "${PROJECT_ROOT}/data/raw/crime_data_sample.csv" ]; then
    echo "[INFO] Raw dataset not found. Generating sample dataset..."
    python3 "${PROJECT_ROOT}/scripts/generate_sample_data.py"
fi

# Execute training and analytics pipeline
echo "[INFO] Executing PySpark processing and ML training..."
python3 "${PROJECT_ROOT}/scripts/train_models.py"

echo "=================================================="
echo "Pipeline Execution Completed Successfully!"
echo "=================================================="
