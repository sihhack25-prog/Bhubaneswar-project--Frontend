@echo off
echo Fixing Redis startup issue...

REM Kill any existing Redis processes
taskkill /f /im redis-server.exe 2>nul

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start Redis with specific config
echo Starting Redis server...
redis-server --port 6379 --bind 127.0.0.1 --protected-mode no

pause