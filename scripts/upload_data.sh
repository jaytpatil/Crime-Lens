#!/usr/bin/env bash
# ==============================================================================
# HDFS Data Upload Script
# Ingests raw Kaggle LAPD dataset into HDFS /crime-analysis/raw/
# ==============================================================================

set -e

LOCAL_CSV=${1:-"data/raw/crime_data_sample.csv"}
HDFS_RAW_DIR="/crime-analysis/raw"

echo "=================================================="
echo "Uploading Dataset to HDFS"
echo "Source: ${LOCAL_CSV}"
echo "Destination: ${HDFS_RAW_DIR}"
echo "=================================================="

if [ ! -f "${LOCAL_CSV}" ]; then
    echo "[ERROR] Local file not found: ${LOCAL_CSV}"
    exit 1
fi

if ! command -v hdfs &> /dev/null; then
    echo "[ERROR] 'hdfs' command not found. Ensure Hadoop is in PATH."
    exit 1
fi

echo "[INFO] Uploading file to HDFS..."
hdfs dfs -put -f "${LOCAL_CSV}" "${HDFS_RAW_DIR}/"

echo "[INFO] Verifying uploaded file on HDFS..."
hdfs dfs -ls -h "${HDFS_RAW_DIR}"

echo "=================================================="
echo "Dataset Upload Verified on HDFS!"
echo "=================================================="
