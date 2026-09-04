@echo off
echo ===================================================
echo   Ocean3D Platform - Starting FastAPI Backend
echo   Mounted NetCDF: backend/data/*.nc
echo ===================================================
cd /d "%~dp0"
call .venv\Scripts\activate.bat
python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
pause
