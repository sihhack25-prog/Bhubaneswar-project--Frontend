const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

// In-memory queue system (Redis alternative)
class JobQueue {
  constructor(concurrency = 5) {
    this.jobs = []
    this.active = []
    this.completed = []
    this.failed = []
    this.concurrency = concurrency
    this.processing = false
  }

  add(job) {
    const jobId = Date.now() + Math.random()
    const queueJob = { id: jobId, ...job, status: 'waiting', createdAt: new Date() }
    this.jobs.push(queueJob)
    this.process()
    return jobId
  }

  async process() {
    if (this.processing || this.active.length >= this.concurrency) return
    
    this.processing = true
    while (this.jobs.length > 0 && this.active.length < this.concurrency) {
      const job = this.jobs.shift()
      job.status = 'active'
      job.startedAt = new Date()
      this.active.push(job)
      
      this.executeJob(job)
    }
    this.processing = false
  }

  async executeJob(job) {
    try {
      const result = await this.runJob(job)
      job.status = 'completed'
      job.result = result
      job.completedAt = new Date()
      
      this.active = this.active.filter(j => j.id !== job.id)
      this.completed.push(job)
    } catch (error) {
      job.status = 'failed'
      job.error = error.message
      job.failedAt = new Date()
      
      this.active = this.active.filter(j => j.id !== job.id)
      this.failed.push(job)
    }
    
    this.process() // Process next job
  }

  async runJob(job) {
    // Simulate code execution
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500))
    
    if (Math.random() > 0.9) { // 10% failure rate
      throw new Error('Execution timeout')
    }
    
    return {
      success: true,
      output: `Mock execution result for ${job.language}`,
      executionTime: Math.random() * 1000 + 100
    }
  }

  getStats() {
    return {
      waiting: this.jobs.length,
      active: this.active.length,
      completed: this.completed.length,
      failed: this.failed.length,
      total: this.jobs.length + this.active.length + this.completed.length + this.failed.length
    }
  }
}

// Create queues
const codeQueue = new JobQueue(5)  // 5 concurrent code executions
const submitQueue = new JobQueue(10) // 10 concurrent submissions

// Rate limiting
const rateLimits = new Map()

function checkRateLimit(userId, type, limit) {
  const key = `${userId}:${type}`
  const now = Date.now()
  const windowStart = now - 60000 // 1 minute window
  
  if (!rateLimits.has(key)) {
    rateLimits.set(key, [])
  }
  
  const requests = rateLimits.get(key)
  const recentRequests = requests.filter(time => time > windowStart)
  
  if (recentRequests.length >= limit) {
    return false
  }
  
  recentRequests.push(now)
  rateLimits.set(key, recentRequests)
  return true
}

// Routes
app.post('/api/execute', async (req, res) => {
  const { code, language } = req.body
  const userId = req.headers['user-id'] || 'anonymous'
  
  if (!checkRateLimit(userId, 'execute', 20)) {
    return res.status(429).json({ success: false, error: 'Rate limit exceeded' })
  }
  
  const jobId = codeQueue.add({ code, language, type: 'execute' })
  
  // Wait for job completion (simplified)
  const checkJob = () => {
    const completed = codeQueue.completed.find(j => j.id === jobId)
    const failed = codeQueue.failed.find(j => j.id === jobId)
    
    if (completed) {
      return res.json({ success: true, ...completed.result })
    }
    if (failed) {
      return res.json({ success: false, error: failed.error })
    }
    
    setTimeout(checkJob, 100)
  }
  
  checkJob()
})

app.post('/api/submit', async (req, res) => {
  const { assignmentId, code, language } = req.body
  const userId = req.headers['user-id'] || 'anonymous'
  
  if (!checkRateLimit(userId, 'submit', 10)) {
    return res.status(429).json({ success: false, error: 'Rate limit exceeded' })
  }
  
  const jobId = submitQueue.add({ assignmentId, code, language, type: 'submit' })
  
  const checkJob = () => {
    const completed = submitQueue.completed.find(j => j.id === jobId)
    const failed = submitQueue.failed.find(j => j.id === jobId)
    
    if (completed) {
      return res.json({ 
        success: true, 
        score: Math.floor(Math.random() * 40) + 60,
        message: 'Submission processed successfully'
      })
    }
    if (failed) {
      return res.json({ success: false, error: failed.error })
    }
    
    setTimeout(checkJob, 100)
  }
  
  checkJob()
})

app.get('/api/queue/stats', (req, res) => {
  res.json({
    codeExecution: codeQueue.getStats(),
    submissions: submitQueue.getStats(),
    rateLimits: rateLimits.size
  })
})

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Queue system running',
    queues: {
      code: codeQueue.getStats(),
      submit: submitQueue.getStats()
    }
  })
})

const PORT = 3003
app.listen(PORT, () => {
  console.log(`🚀 Queue backend running on http://localhost:${PORT}`)
  console.log(`📊 Queue stats: http://localhost:${PORT}/api/queue/stats`)
  console.log('✅ No Redis required - using in-memory queues')
})