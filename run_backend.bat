@echo off
echo ===================================================
echo   Ocean3D Platform - Starting FastAPI Backend
echo   Mounted NetCDF: backend/data/*.nc
echo ===================================================
cd /d "%~dp0"
if not exist ".venv\Scripts\activate.bat" (
    echo [INFO] Virtual environment .venv not found. Creating it...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    echo [INFO] Installing backend dependencies from requirements.txt...
    pip install -r backend\requirements.txt
) else (
    call .venv\Scripts\activate.bat
)
python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
pause
