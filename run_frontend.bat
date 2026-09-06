@echo off
echo ===================================================
echo   Ocean3D Platform - Starting React 19 Frontend
echo   URL: http://127.0.0.1:5173
echo ===================================================
cd /d "%~dp0frontend"
if not exist "node_modules\" (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
)
call npm run dev
pause
