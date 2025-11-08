@echo off
echo Setting up Digital TA with MongoDB...

echo Installing backend dependencies...
npm install express cors mongoose bcryptjs jsonwebtoken nodemon

echo.
echo Setup complete!
echo.
echo To start the application:
echo 1. Start MongoDB: mongod
echo 2. Start backend: node backend-example.cjs
echo 3. Start frontend: npm run dev
echo.
echo Backend will run on: http://localhost:3001
echo Frontend will run on: http://localhost:3000

pause