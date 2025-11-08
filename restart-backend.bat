@echo off
echo Restarting backend with code execution...
taskkill /f /im node.exe 2>nul
timeout /t 2 >nul
echo Starting backend on port 3002...
node complete-backend.cjs
pause