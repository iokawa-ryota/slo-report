@echo off
setlocal

cd /d "%~dp0"

echo [1/3] Building the app...
call npm run build
if errorlevel 1 (
  echo Build failed.
  exit /b 1
)

echo [2/3] Opening preview URL...
start "" http://127.0.0.1:4173/slo-report/

echo [3/3] Starting local preview server...
call npm run preview -- --host 127.0.0.1 --port 4173
