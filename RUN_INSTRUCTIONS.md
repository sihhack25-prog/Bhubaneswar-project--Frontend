# 🚀 Files Required to Run Digital TA Platform

## Essential Files Checklist

### ✅ Backend Files
- `complete-backend.cjs` - Main backend server (port 3002)
- `redis-backend.cjs` - Redis queue backend (port 3004) 
- `package.json` - Dependencies

### ✅ Frontend Files  
- `src/App.jsx` - Main React app with routing
- `src/pages/LoadTesting.jsx` - Load testing dashboard
- `src/pages/LandingPage.jsx` - Homepage
- `src/pages/EnhancedLogin.jsx` - Login system
- All other existing React components

### ✅ Load Testing Files
- `load-test-script.js` - Node.js load testing script
- `queue-backend.cjs` - Alternative queue system (if Redis fails)

### ✅ Redis Files
- `redis.conf` - Redis configuration
- `start-redis.bat` - Redis startup script

## 🎯 Step-by-Step Run Instructions

### Step 1: Install Dependencies
```bash
npm install
npm install bull redis@3.1.2 express cors
```

### Step 2: Start Redis Server
```bash
# Option A: Use batch file
start-redis.bat

# Option B: Manual command
redis-server --port 6379 --bind 127.0.0.1 --protected-mode no

# Option C: Docker (if installation fails)
docker run -d -p 6379:6379 redis:alpine
```

### Step 3: Verify Redis is Running
```bash
redis-cli ping
# Should return: PONG
```

### Step 4: Start Backend Servers
```bash
# Terminal 1: Main backend (required)
node complete-backend.cjs

# Terminal 2: Redis backend (optional - for advanced queuing)
node redis-backend.cjs
```

### Step 5: Start Frontend
```bash
# Terminal 3: React frontend
npm run dev
```

### Step 6: Access the Application
- **Main App**: http://localhost:3001
- **Load Testing**: http://localhost:3001/load-testing
- **Backend Health**: http://localhost:3002/api/health
- **Redis Backend**: http://localhost:3004/api/health

## 🧪 Test the Load Testing

### Option 1: Use the Web Dashboard
1. Go to http://localhost:3001/load-testing
2. Configure users, duration, scenario
3. Click "Start Load Test"
4. Watch real-time metrics

### Option 2: Run Command Line Test
```bash
# Basic test: 50 users for 30 seconds
node load-test-script.js

# Heavy test: 200 users for 60 seconds  
node load-test-script.js 200 60
```

## 📊 Monitor Performance

### Check Queue Status
```bash
# Redis queue stats
curl http://localhost:3004/api/queue/stats

# Backend health
curl http://localhost:3002/api/health
```

### Redis Monitoring
```bash
redis-cli
127.0.0.1:6379> KEYS bull:*
127.0.0.1:6379> LLEN bull:code-execution:waiting
127.0.0.1:6379> exit
```

## 🔧 Minimum Required Files

If you want to run with minimal setup:

### Core Files Only:
1. `complete-backend.cjs` 
2. `src/App.jsx`
3. `src/pages/LoadTesting.jsx`
4. `load-test-script.js`
5. `package.json`

### Commands:
```bash
npm install
node complete-backend.cjs  # Terminal 1
npm run dev               # Terminal 2
```

## 🚨 Troubleshooting

### Redis Won't Start
- Use Docker: `docker run -d -p 6379:6379 redis:alpine`
- Use queue-backend.cjs instead: `node queue-backend.cjs`

### Backend Errors
- Check port conflicts (3001, 3002, 3004)
- Verify all dependencies installed
- Check Redis connection

### Frontend Issues
- Clear browser cache
- Check console for errors
- Verify backend is running

## 🎯 Demo Scenario

For Phase 2 demonstration:

1. **Start all services** (Redis + backends + frontend)
2. **Open load testing page**: http://localhost:3001/load-testing
3. **Configure test**: 100+ users, 60+ seconds, "Mass Submission" scenario
4. **Start load test** and show real-time metrics
5. **Run CLI test** simultaneously: `node load-test-script.js 150 90`
6. **Monitor Redis queues** and server performance
7. **Show scalability** under academic pressure

This demonstrates enterprise-level scalability handling thousands of concurrent submissions!