# Installation & Setup Guide

This guide provides step-by-step instructions to set up, configure, and execute the Big Data Crime Pattern Analytics application on a Windows workstation or Linux/WSL environment.

---

## Prerequisites

| Software | Supported Version | Purpose |
| :--- | :--- | :--- |
| **Python** | 3.10 or 3.11 (64-bit) | Backend, PySpark, Scikit-learn |
| **Node.js & npm** | Node v18+ & npm v9+ | React Vite Frontend Dashboard |
| **Java (JDK)** | OpenJDK 11, 17, or 18 | Required by Apache Spark & Hadoop |
| **Docker (Optional)** | Docker Desktop 20+ | For Mode B Hadoop/HDFS Containers |

---

## Mode A: Local Development Setup (Recommended)

Mode A runs the entire project locally without requiring an active multi-node Hadoop cluster.

### 1. Clone & Open Workspace
```powershell
cd "c:\Users\Hitashri Patil\OneDrive\Desktop\BDA p"
```

### 2. Set Up Python Virtual Environment
```powershell
# Create virtual environment using Python 3.11
py -3.11 -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend\requirements.txt
```

### 3. Generate or Place Dataset
The repository includes an automatic realistic sample generator matching the Kaggle LAPD schema.
```powershell
# Generate 16,000+ realistic records strictly matching LAPD schema
python scripts\generate_sample_data.py
```
*Note: If you have downloaded the full ~800,000-row Kaggle dataset (`Crime_Data_from_2020_to_Present.csv`), place it directly in `data/raw/`.*

### 4. Execute the Data Processing & ML Pipeline
```powershell
# Windows PowerShell
$env:PYTHONPATH="backend"
python scripts\train_models.py
```

### 5. Start the FastAPI Backend Server
```powershell
# In Terminal 1: Start backend on http://localhost:8000
$env:PYTHONPATH="backend"
python backend\app\main.py
```
*Verify backend health in your browser:* [http://localhost:8000/api/health](http://localhost:8000/api/health)  
*Swagger API Docs:* [http://localhost:8000/docs](http://localhost:8000/docs)

### 6. Install Frontend Dependencies & Start Dashboard
```powershell
# In Terminal 2:
cd frontend
npm install
npm run dev
```
*Open Dashboard:* [http://localhost:5173](http://localhost:5173)

---

## Mode B: Hadoop & HDFS Integration Mode

Mode B activates live HDFS storage and verifies read/write operations against an active Hadoop NameNode.

### 1. Launch Hadoop Cluster via Docker
```powershell
docker-compose up -d
```
Verify NameNode web UI: [http://localhost:9870](http://localhost:9870)  
Verify Spark Master UI: [http://localhost:8080](http://localhost:8080)

### 2. Initialize HDFS Directories
```bash
# In WSL or Git Bash
bash scripts/setup_hdfs.sh
```

### 3. Upload Dataset to HDFS
```bash
bash scripts/upload_data.sh data/raw/crime_data_sample.csv
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and set:
```env
HDFS_ENABLED=true
HDFS_URL=http://localhost:9870
HDFS_NAMENODE_RPC=hdfs://localhost:9000
```

---

## Running Automated Tests

Run the comprehensive pytest suite verifying data ingestion, cleaning, K-Means clustering, risk classification, and API routes:
```powershell
$env:PYTHONPATH="backend"
.\venv\Scripts\pytest.exe backend\tests -v
```

---

## Troubleshooting

1. **Winutils Warning on Windows:**
   - *Message:* `Did not find winutils.exe...`
   - *Resolution:* This is a standard non-fatal Hadoop warning on Windows when running standalone Spark. The application automatically handles builtin-Java classes and includes an optimized local vectorised engine.
2. **Port 8000 Already in Use:**
   - Change port in `backend/app/config.py` or run `python -m uvicorn app.main:app --port 8080`.
3. **CORS Rejection in Frontend:**
   - Ensure the backend has `CORSMiddleware` active (enabled by default for `localhost:5173` and `localhost:3000`).
