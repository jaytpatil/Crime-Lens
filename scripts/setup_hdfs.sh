#!/usr/bin/env bash
# ==============================================================================
# HDFS Setup Script
# Initializes the required project directories on Hadoop HDFS
# ==============================================================================

set -e

HDFS_NAMENODE=${HDFS_NAMENODE:-"hdfs://localhost:9000"}
PROJECT_ROOT="/crime-analysis"

echo "=================================================="
echo "Initializing Hadoop HDFS Project Structure"
echo "Target NameNode: ${HDFS_NAMENODE}"
echo "=================================================="

# Check if hdfs CLI is present
if ! command -v hdfs &> /dev/null; then
    echo "[ERROR] 'hdfs' command not found. Ensure HADOOP_HOME is set and in PATH."
    exit 1
fi

echo "[INFO] Creating HDFS directories..."
hdfs dfs -mkdir -p ${PROJECT_ROOT}/raw
hdfs dfs -mkdir -p ${PROJECT_ROOT}/processed
hdfs dfs -mkdir -p ${PROJECT_ROOT}/analytics
hdfs dfs -mkdir -p ${PROJECT_ROOT}/models

echo "[INFO] Setting permissions..."
hdfs dfs -chmod -R 775 ${PROJECT_ROOT}

echo "[INFO] Verifying directory tree..."
hdfs dfs -ls -R ${PROJECT_ROOT}

echo "=================================================="
echo "HDFS Directories Successfully Initialized!"
echo "=================================================="
