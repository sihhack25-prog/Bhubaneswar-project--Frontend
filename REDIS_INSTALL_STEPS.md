# Redis Installation Steps for Windows

## Step 1: Download Redis
1. Go to: https://github.com/microsoftarchive/redis/releases
2. Download `Redis-x64-3.0.504.msi` (latest stable)
3. Run the installer as Administrator

## Step 2: Install Redis
1. Choose installation directory (default: `C:\Program Files\Redis`)
2. Check "Add Redis to PATH"
3. Complete installation

## Step 3: Fix Windows Service Issue
Open Command Prompt as Administrator and run:
```cmd
sc delete Redis
```

## Step 4: Start Redis Manually
```cmd
cd "C:\Program Files\Redis"
redis-server.exe redis.windows.conf
```

## Step 5: Alternative - Use Docker (Recommended)
If Redis installation fails, use Docker:
```cmd
docker run -d -p 6379:6379 --name redis redis:alpine
```

## Step 6: Test Redis
Open new terminal:
```cmd
redis-cli ping
```
Should return: `PONG`

## Step 7: If Still Failing - Use WSL
1. Install WSL2: `wsl --install`
2. In WSL terminal:
```bash
sudo apt update
sudo apt install redis-server
redis-server --daemonize yes
```

## Step 8: Verify Installation
```cmd
redis-cli
127.0.0.1:6379> set test "hello"
127.0.0.1:6379> get test
127.0.0.1:6379> exit
```

## Common Issues & Fixes

### Issue: "bind: No such file or directory"
**Fix:** Port 6379 is already in use
```cmd
netstat -ano | findstr :6379
taskkill /PID <PID_NUMBER> /F
```

### Issue: "Creating Server TCP listening socket"
**Fix:** Run as Administrator or use different port
```cmd
redis-server --port 6380
```

### Issue: Redis service won't start
**Fix:** Disable Windows service and run manually
```cmd
sc stop Redis
sc config Redis start= disabled
```

## Final Command to Start Redis
```cmd
redis-server --port 6379 --bind 127.0.0.1 --protected-mode no --save ""
```