@echo off
echo ========================================
echo   Digital TA - Setup Script
echo ========================================
echo.

echo Installing backend dependencies...
copy package-backend-new.json package-backend.json
npm install --prefix . express cors jsonwebtoken bcryptjs multer

echo.
echo Installing frontend dependencies...
npm install

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To start the application:
echo 1. Start backend: node backend.js
echo 2. Start frontend: npm run dev
echo.
echo Backend will run on: http://localhost:3001
echo Frontend will run on: http://localhost:3000
echo.
pause