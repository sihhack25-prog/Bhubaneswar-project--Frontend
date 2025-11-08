# MongoDB Backend Setup Guide

## Overview
The login page is now connected to a MongoDB backend that provides:
- User authentication (login/register)
- Assignment management
- Submission tracking
- Real-time analytics

## Quick Start

### 1. Test MongoDB Connection
```bash
node test-mongodb-connection.cjs
```

### 2. Start MongoDB Backend
```bash
# Windows
start-mongodb-backend.bat

# Or manually
node complete-backend.cjs
```

### 3. Start Frontend
```bash
npm run dev
```

## Backend Details

### Server Information
- **Port**: 3002
- **Health Check**: http://localhost:3002/api/health
- **Database**: MongoDB Atlas (digitalTA)

### Test Credentials
- **Student**: student@test.com / password
- **Instructor**: instructor@test.com / password  
- **Admin**: admin@digitalTA.com / SecureAdmin2024!

### API Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/assignments` - Get all assignments
- `GET /api/dashboard/stats` - Get user statistics
- `GET /api/leaderboard` - Get leaderboard data

## Features Connected

### ✅ Working Features
- User login/registration with MongoDB
- Assignment fetching from database
- Dashboard statistics
- User role management
- JWT token authentication

### 🔄 In Progress
- Assignment submission to database
- Real-time code execution
- Plagiarism detection

## Database Schema

### User Schema
```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (student/instructor/admin),
  createdAt: Date
}
```

### Assignment Schema
```javascript
{
  main: {
    id: Number,
    name: String,
    difficulty: String (easy/medium/hard),
    description_body: String,
    code_body: Object (language templates)
  },
  deadline: Date,
  createdBy: ObjectId (User reference),
  createdAt: Date
}
```

## Troubleshooting

### Connection Issues
1. Check if MongoDB backend is running on port 3002
2. Verify MongoDB Atlas connection string
3. Ensure all dependencies are installed: `npm install`

### Authentication Issues
1. Clear browser localStorage
2. Check if JWT token is valid
3. Verify user credentials in database

### Port Conflicts
- Frontend: http://localhost:3000 (Vite)
- Backend: http://localhost:3002 (MongoDB)
- Make sure no other services are using these ports

## Next Steps
1. Add assignment creation functionality
2. Implement real-time code execution
3. Add submission history
4. Enhance analytics dashboard