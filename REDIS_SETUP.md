# Redis Setup for Job Queue System

## Why Redis?
Redis is used for job queue management to handle thousands of concurrent code execution requests without server crashes or glitches.

## Installation

### Windows
1. Download Redis from: https://github.com/microsoftarchive/redis/releases
2. Install Redis (default port: 6379)
3. Start Redis server: `redis-server`

### Linux/Mac
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis
```

## Verify Installation
```bash
redis-cli ping
# Should return: PONG
```

## System Features

### Job Queue System
- **Code Execution Queue**: Processes 5 concurrent jobs
- **Submission Queue**: Processes 10 concurrent jobs
- **Automatic Retry**: 3 attempts with exponential backoff
- **Timeout Protection**: 30-second timeout per job

### Rate Limiting
- **Code Execution**: 20 requests per minute per user
- **Submissions**: 10 submissions per minute per user

### Fallback Mode
If Redis is not available, the system automatically falls back to direct execution (not recommended for production with high load).

## Production Recommendations
1. Use Redis Cluster for high availability
2. Configure Redis persistence (AOF + RDB)
3. Set up Redis monitoring
4. Use Redis Sentinel for automatic failover
5. Increase queue concurrency based on server capacity

## Queue Monitoring
```bash
# Check queue status
redis-cli
> KEYS bull:code-execution:*
> LLEN bull:code-execution:waiting
> LLEN bull:code-execution:active
```

Install Redis (see REDIS_SETUP.md)

Run setup: ./setup-enhanced.bat

Start services:

redis-server (Terminal 1)

node backend-enhanced.cjs (Terminal 2)

npm run dev (Terminal 3)

The system now supports thousan