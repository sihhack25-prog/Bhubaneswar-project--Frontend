@echo off
echo ========================================
echo   Digital TA - Enhanced Setup Script
echo ========================================
echo.

echo Installing backend dependencies...
npm install express cors jsonwebtoken bcryptjs multer bull express-rate-limit ioredis

echo.
echo Installing frontend dependencies...
npm install

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To start the application:
echo 1. Start Redis server: redis-server
echo 2. Start backend: node backend.cjs
echo 3. Start frontend: npm run dev
echo.
echo Backend will run on: http://localhost:3001
echo Frontend will run on: http://localhost:3000
echo.
echo Note: Redis is required for job queue system
echo See REDIS_SETUP.md for installation instructions
echo.
pause