@echo off
echo Starting Redis Server...

REM Check if Redis is installed
where redis-server >nul 2>nul
if %errorlevel% neq 0 (
    echo Redis not found in PATH. Trying common locations...
    if exist "C:\Program Files\Redis\redis-server.exe" (
        cd "C:\Program Files\Redis"
        redis-server.exe --port 6379 --bind 127.0.0.1 --protected-mode no --save ""
    ) else (
        echo Redis not installed. Please install Redis first.
        echo Download from: https://github.com/microsoftarchive/redis/releases
        pause
        exit /b 1
    )
) else (
    redis-server --port 6379 --bind 127.0.0.1 --protected-mode no --save ""
)

pause