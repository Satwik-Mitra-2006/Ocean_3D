@echo off
echo ================================================================
echo   Ocean3D Visualization Platform - SIH 2026
echo   Launching FastAPI Backend + React 19 Frontend
echo ================================================================
cd /d "%~dp0"

echo [1/2] Launching Backend on http://127.0.0.1:8000 ...
start "Ocean3D - FastAPI Backend" cmd /k "%~dp0run_backend.bat"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Frontend on http://127.0.0.1:5173 ...
start "Ocean3D - React Frontend" cmd /k "%~dp0run_frontend.bat"

timeout /t 2 /nobreak >nul

echo.
echo Launching 3D Ocean Dashboard in your default browser...
start http://127.0.0.1:5173

echo.
echo ================================================================
echo   Both servers launched in separate command prompt windows!
echo   - Backend API:  http://127.0.0.1:8000 (Swagger docs: /docs)
echo   - Frontend UI:  http://127.0.0.1:5173
echo ================================================================
echo.
pause
