const express = require('express')
const cors = require('cors')
const Bull = require('bull')
const redis = require('redis')

const app = express()
app.use(cors())
app.use(express.json())

// Redis connection
const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379
})

// Create job queues
const codeExecutionQueue = new Bull('code execution', {
  redis: { port: 6379, host: 'localhost' }
})

const submissionQueue = new Bull('submissions', {
  redis: { port: 6379, host: 'localhost' }
})

// Configure queue processing
codeExecutionQueue.process(5, async (job) => {
  const { code, language } = job.data
  
  // Simulate code execution
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500))
  
  if (Math.random() > 0.95) { // 5% failure rate
    throw new Error('Execution timeout')
  }
  
  return {
    success: true,
    output: `Executed ${language} code successfully`,
    executionTime: Math.random() * 1000 + 100
  }
})

submissionQueue.process(10, async (job) => {
  const { assignmentId, code, language } = job.data
  
  // Simulate submission processing
  await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000))
  
  const score = Math.floor(Math.random() * 40) + 60
  const passed = Math.floor(Math.random() * 5) + 3
  
  return {
    success: true,
    score,
    passedTests: passed,
    totalTests: 5,
    message: 'Submission processed successfully'
  }
})

// Rate limiting with Redis
async function checkRateLimit(userId, type, limit) {
  const key = `rate_limit:${userId}:${type}`
  const current = await redisClient.incr(key)
  
  if (current === 1) {
    await redisClient.expire(key, 60) // 1 minute window
  }
  
  return current <= limit
}

// Routes
app.post('/api/execute', async (req, res) => {
  const { code, language } = req.body
  const userId = req.headers['user-id'] || 'anonymous'
  
  try {
    const allowed = await checkRateLimit(userId, 'execute', 20)
    if (!allowed) {
      return res.status(429).json({ success: false, error: 'Rate limit exceeded: 20 requests per minute' })
    }
    
    const job = await codeExecutionQueue.add({ code, language, userId }, {
      attempts: 3,
      backoff: 'exponential',
      removeOnComplete: 100,
      removeOnFail: 50
    })
    
    const result = await job.finished()
    res.json(result)
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/submit', async (req, res) => {
  const { assignmentId, code, language } = req.body
  const userId = req.headers['user-id'] || 'anonymous'
  
  try {
    const allowed = await checkRateLimit(userId, 'submit', 10)
    if (!allowed) {
      return res.status(429).json({ success: false, error: 'Rate limit exceeded: 10 submissions per minute' })
    }
    
    const job = await submissionQueue.add({ assignmentId, code, language, userId }, {
      attempts: 3,
      backoff: 'exponential',
      removeOnComplete: 100,
      removeOnFail: 50
    })
    
    const result = await job.finished()
    res.json(result)
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/queue/stats', async (req, res) => {
  try {
    const codeStats = await codeExecutionQueue.getJobCounts()
    const submitStats = await submissionQueue.getJobCounts()
    
    res.json({
      codeExecution: codeStats,
      submissions: submitStats,
      redis: 'connected'
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Redis backend running',
    redis: redisClient.connected ? 'connected' : 'disconnected'
  })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  await codeExecutionQueue.close()
  await submissionQueue.close()
  await redisClient.quit()
  process.exit(0)
})

const PORT = 3004
app.listen(PORT, () => {
  console.log(`🚀 Redis backend running on http://localhost:${PORT}`)
  console.log(`📊 Queue stats: http://localhost:${PORT}/api/queue/stats`)
  console.log('✅ Redis connected - High performance queues active')
})