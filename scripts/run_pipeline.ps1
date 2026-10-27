# ==============================================================================
# Complete Big Data Pipeline Runner (Windows PowerShell)
# ==============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

$env:PYTHONPATH = "$ProjectRoot\backend"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "CRIME PATTERN ANALYSIS - BIG DATA PIPELINE" -ForegroundColor Cyan
Write-Host "Project Root: $ProjectRoot" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$PythonExe = "$ProjectRoot\venv\Scripts\python.exe"
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "python"
}

# 1. Generate sample data if missing
$RawData = "$ProjectRoot\data\raw\crime_data_sample.csv"
if (-not (Test-Path $RawData)) {
    Write-Host "[INFO] Generating realistic sample crime dataset..." -ForegroundColor Yellow
    & $PythonExe "$ProjectRoot\scripts\generate_sample_data.py"
}

# 2. Run data processing & model training
Write-Host "[INFO] Running data processing and ML model training..." -ForegroundColor Green
& $PythonExe "$ProjectRoot\scripts\train_models.py"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Pipeline Completed Successfully!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
