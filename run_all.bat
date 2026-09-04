@echo off
echo ================================================================
echo   Ocean3D Visualization Platform - SIH 2026
echo   Launching FastAPI Backend + React 19 Frontend
echo ================================================================
cd /d "%~dp0"

echo [1/2] Launching Backend on http://127.0.0.1:8000 ...
start "Ocean3D - FastAPI Backend" cmd /c "%~dp0run_backend.bat"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Frontend on http://127.0.0.1:5173 ...
start "Ocean3D - React Frontend" cmd /c "%~dp0run_frontend.bat"

echo.
echo Both servers launched in background windows!
echo Access the 3D Ocean Dashboard at: http://127.0.0.1:5173
echo.
pause
