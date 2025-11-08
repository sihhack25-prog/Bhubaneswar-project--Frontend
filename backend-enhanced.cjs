const express = require('express')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const rateLimit = require('express-rate-limit')

// Redis and Bull setup (optional)
let Queue, redis
try {
  Queue = require('bull')
  redis = require('ioredis')
  console.log('✅ Redis dependencies loaded')
} catch (error) {
  console.log('⚠️  Redis not available, using direct execution')
}

const app = express()
app.use(cors())
app.use(express.json())

// Rate limiting
const executeLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: { success: false, error: 'Too many code execution requests' }
})

const submitLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 submissions per minute
  message: { success: false, error: 'Too many submissions' }
})

// In-memory database
let users = []
let assignments = []
let submissions = []

const JWT_SECRET = 'your-secret-key'

// Multer setup
const upload = multer({ dest: 'uploads/' })

// Redis Queue setup
let codeExecutionQueue, submissionQueue
if (Queue && redis) {
  try {
    const redisClient = new redis({
      host: 'localhost',
      port: 6379,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    })
    
    codeExecutionQueue = new Queue('code execution', { redis: { port: 6379, host: 'localhost' } })
    submissionQueue = new Queue('submission processing', { redis: { port: 6379, host: 'localhost' } })
    
    // Process code execution jobs
    codeExecutionQueue.process(5, async (job) => {
      const { code, language } = job.data
      return await executeCodeDirect(code, language)
    })
    
    // Process submission jobs
    submissionQueue.process(10, async (job) => {
      const { code, language, testCases } = job.data
      return await executeCodeWithTestsDirect(code, language, testCases)
    })
    
    console.log('✅ Redis queues initialized')
  } catch (error) {
    console.log('⚠️  Redis connection failed, using direct execution')
    codeExecutionQueue = null
    submissionQueue = null
  }
}

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid token' })
    }
    req.user = user
    next()
  })
}

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password, role } = req.body
  
  let user = users.find(u => u.username === username && u.role === role)
  
  if (!user) {
    const hashedPassword = await bcrypt.hash(password, 10)
    user = {
      id: users.length + 1,
      username,
      password: hashedPassword,
      role,
      createdAt: new Date()
    }
    users.push(user)
  } else {
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET)
  res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } })
})

// Assignment routes
app.get('/api/assignments', (req, res) => {
  const assignmentsWithStats = assignments.map(assignment => {
    const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.id)
    const avgScore = assignmentSubmissions.length > 0 
      ? Math.round(assignmentSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / assignmentSubmissions.length)
      : 0
    
    return {
      ...assignment,
      submissions: assignmentSubmissions.length,
      avgScore
    }
  })
  
  res.json({ success: true, assignments: assignmentsWithStats })
})

app.post('/api/assignments', authenticateToken, upload.single('testFile'), (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ success: false, error: 'Only instructors can create assignments' })
  }

  const assignmentData = JSON.parse(req.body.assignmentData)
  
  const assignment = {
    id: assignments.length + 1,
    ...assignmentData,
    createdBy: req.user.id,
    createdAt: new Date(),
    _id: `assignment_${assignments.length + 1}`
  }

  if (req.file) {
    const testCases = fs.readFileSync(req.file.path, 'utf8')
    assignment.testCases = testCases.split('\n').filter(line => line.trim())
    fs.unlinkSync(req.file.path)
  }

  assignments.push(assignment)
  res.json({ success: true, assignment })
})

app.get('/api/assignments/:id', (req, res) => {
  const assignment = assignments.find(a => a.id == req.params.id || a._id === req.params.id)
  if (!assignment) {
    return res.status(404).json({ success: false, error: 'Assignment not found' })
  }
  res.json({ success: true, assignment })
})

// Submission routes
app.get('/api/assignments/:id/submission-status', authenticateToken, (req, res) => {
  const submission = submissions.find(s => 
    s.assignmentId == req.params.id && s.userId === req.user.id
  )
  
  if (submission) {
    res.json({ success: true, hasSubmitted: true, submission })
  } else {
    res.json({ success: true, hasSubmitted: false })
  }
})

app.post('/api/assignments/:id/submit', authenticateToken, submitLimit, async (req, res) => {
  const { code, language } = req.body
  const assignmentId = req.params.id
  
  const assignment = assignments.find(a => a.id == assignmentId || a._id === assignmentId)
  if (!assignment) {
    return res.status(404).json({ success: false, error: 'Assignment not found' })
  }

  try {
    let result
    if (submissionQueue) {
      // Use Redis queue
      const job = await submissionQueue.add('process-submission', {
        code,
        language,
        testCases: assignment.testCases || []
      }, {
        attempts: 3,
        backoff: 'exponential',
        removeOnComplete: 10,
        removeOnFail: 5
      })
      
      result = await job.finished()
    } else {
      // Direct execution
      result = await executeCodeWithTestsDirect(code, language, assignment.testCases || [])
    }
    
    const submission = {
      id: submissions.length + 1,
      assignmentId,
      userId: req.user.id,
      code,
      language,
      score: result.score,
      status: 'graded',
      testResults: result.testResults,
      submittedAt: new Date()
    }
    
    submissions = submissions.filter(s => !(s.assignmentId == assignmentId && s.userId === req.user.id))
    submissions.push(submission)
    
    res.json({ success: true, submission })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/submissions', authenticateToken, (req, res) => {
  const userSubmissions = submissions.filter(s => s.userId === req.user.id)
  const enrichedSubmissions = userSubmissions.map(submission => {
    const assignment = assignments.find(a => a.id == submission.assignmentId || a._id === submission.assignmentId)
    return {
      ...submission,
      assignmentTitle: assignment?.main?.name || assignment?.title || 'Unknown Assignment'
    }
  })
  
  res.json({ success: true, submissions: enrichedSubmissions })
})

// Analytics routes
app.get('/api/analytics', authenticateToken, (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ success: false, error: 'Only instructors can view analytics' })
  }

  const userStats = {}
  submissions.forEach(submission => {
    const user = users.find(u => u.id === submission.userId)
    if (!user || user.role !== 'student') return
    
    if (!userStats[user.username]) {
      userStats[user.username] = {
        studentId: user.username,
        totalScore: 0,
        submissions: 0,
        avgScore: 0
      }
    }
    
    userStats[user.username].totalScore += submission.score || 0
    userStats[user.username].submissions += 1
  })

  const leaderboard = Object.values(userStats)
    .map(stat => ({
      ...stat,
      avgScore: Math.round(stat.totalScore / stat.submissions) || 0
    }))
    .sort((a, b) => b.avgScore - a.avgScore)

  const totalSubmissions = submissions.length
  const avgScore = submissions.length > 0 
    ? Math.round(submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length)
    : 0

  res.json({
    success: true,
    leaderboard,
    metrics: {
      totalSubmissions,
      avgScore,
      totalStudents: users.filter(u => u.role === 'student').length,
      totalAssignments: assignments.length
    }
  })
})

// Code execution with queue support
app.post('/api/execute', executeLimit, async (req, res) => {
  const { code, language } = req.body
  
  if (!code || !language) {
    return res.json({ success: false, error: 'Code and language are required' })
  }

  try {
    let result
    if (codeExecutionQueue) {
      // Use Redis queue
      const job = await codeExecutionQueue.add('execute-code', { code, language }, {
        attempts: 3,
        backoff: 'exponential',
        removeOnComplete: 10,
        removeOnFail: 5,
        timeout: 30000
      })
      
      result = await job.finished()
    } else {
      // Direct execution
      result = await executeCodeDirect(code, language)
    }
    
    res.json(result)
  } catch (error) {
    res.json({ success: false, error: error.message })
  }
})

// Direct code execution function
const executeCodeDirect = (code, language) => {
  return new Promise((resolve) => {
    const tempDir = path.join(__dirname, 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir)
    }

    const timestamp = Date.now()
    let filename, command

    switch (language) {
      case 'python':
        filename = `temp_${timestamp}.py`
        command = `python "${path.join(tempDir, filename)}"`
        break
      case 'javascript':
        filename = `temp_${timestamp}.js`
        command = `node "${path.join(tempDir, filename)}"`
        break
      case 'java':
        filename = `Main.java`
        command = `cd "${tempDir}" && javac ${filename} && java Main`
        break
      case 'cpp':
        filename = `temp_${timestamp}.cpp`
        command = `cd "${tempDir}" && g++ ${filename} -o temp_${timestamp} && ./temp_${timestamp}`
        break
      default:
        resolve({ success: false, error: 'Unsupported language' })
        return
    }

    const filePath = path.join(tempDir, filename)
    fs.writeFileSync(filePath, code)

    const startTime = Date.now()
    exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
      const executionTime = Date.now() - startTime

      // Cleanup
      try {
        fs.unlinkSync(filePath)
        if (language === 'java') {
          const classFile = path.join(tempDir, 'Main.class')
          if (fs.existsSync(classFile)) fs.unlinkSync(classFile)
        }
        if (language === 'cpp') {
          const execFile = path.join(tempDir, `temp_${timestamp}`)
          if (fs.existsSync(execFile)) fs.unlinkSync(execFile)
        }
      } catch (cleanupError) {
        console.log('Cleanup error:', cleanupError.message)
      }

      if (error) {
        resolve({
          success: false,
          error: stderr || error.message,
          executionTime: `${executionTime}ms`
        })
      } else {
        resolve({
          success: true,
          output: stdout,
          executionTime: `${executionTime}ms`
        })
      }
    })
  })
}

const executeCodeWithTestsDirect = async (code, language, testCases) => {
  const results = []
  let passedTests = 0

  for (const testCase of testCases) {
    const result = await executeCodeDirect(code, language)
    const passed = result.success && result.output.trim() === testCase.trim()
    
    results.push({
      input: testCase,
      expected: testCase,
      actual: result.output?.trim() || '',
      passed
    })
    
    if (passed) passedTests++
  }

  const score = testCases.length > 0 ? Math.round((passedTests / testCases.length) * 100) : 0

  return {
    score,
    testResults: results,
    passedTests,
    totalTests: testCases.length
  }
}

// Advanced Plagiarism Detection System
class PlagiarismDetector {
  static generateTrigrams(code) {
    const normalized = code.replace(/\s+/g, ' ').toLowerCase()
    const trigrams = []
    for (let i = 0; i < normalized.length - 2; i++) {
      trigrams.push(normalized.slice(i, i + 3))
    }
    return trigrams
  }

  static createFingerprint(trigrams) {
    let fingerprint = 0n
    for (const trigram of trigrams) {
      let hash = 0
      for (let i = 0; i < trigram.length; i++) {
        hash = ((hash << 5) - hash + trigram.charCodeAt(i)) & 0xffffffff
      }
      fingerprint |= 1n << BigInt(Math.abs(hash) % 64)
    }
    return fingerprint
  }

  static hammingDistance(fp1, fp2) {
    let xor = fp1 ^ fp2
    let count = 0
    while (xor > 0n) {
      count += Number(xor & 1n)
      xor >>= 1n
    }
    return count
  }

  static jaccardSimilarity(set1, set2) {
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    return intersection.size / union.size
  }

  static detectPlagiarism(submissions) {
    const startTime = Date.now()
    const results = []
    
    // Stage 1: Generate fingerprints
    const fingerprints = submissions.map(sub => ({
      ...sub,
      trigrams: this.generateTrigrams(sub.code),
      fingerprint: this.createFingerprint(this.generateTrigrams(sub.code))
    }))

    // Stage 2: Fast filtering with Hamming distance
    const candidates = []
    for (let i = 0; i < fingerprints.length; i++) {
      for (let j = i + 1; j < fingerprints.length; j++) {
        const hamming = this.hammingDistance(fingerprints[i].fingerprint, fingerprints[j].fingerprint)
        if (hamming <= 6) { // Aggressive threshold
          candidates.push([i, j, hamming])
        }
      }
    }

    // Stage 3: Token-based similarity for candidates
    for (const [i, j] of candidates.slice(0, 500)) { // Limit to 500 pairs
      const set1 = new Set(fingerprints[i].trigrams)
      const set2 = new Set(fingerprints[j].trigrams)
      const similarity = this.jaccardSimilarity(set1, set2)
      
      if (similarity > 0.7) {
        results.push({
          submission1: fingerprints[i].id,
          submission2: fingerprints[j].id,
          similarity: Math.round(similarity * 100),
          student1: fingerprints[i].userId,
          student2: fingerprints[j].userId
        })
      }
    }

    const processingTime = Date.now() - startTime
    return {
      matches: results.sort((a, b) => b.similarity - a.similarity),
      stats: {
        totalSubmissions: submissions.length,
        candidatePairs: candidates.length,
        processingTime: `${processingTime}ms`,
        matchesFound: results.length
      }
    }
  }
}

// Plagiarism detection endpoint
app.get('/api/plagiarism/:assignmentId?', authenticateToken, (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ success: false, error: 'Only instructors can check plagiarism' })
  }

  const { assignmentId } = req.params
  let targetSubmissions = submissions
  
  if (assignmentId) {
    targetSubmissions = submissions.filter(s => s.assignmentId == assignmentId)
  }

  if (targetSubmissions.length < 2) {
    return res.json({ 
      success: true, 
      matches: [], 
      stats: { totalSubmissions: targetSubmissions.length, message: 'Need at least 2 submissions' }
    })
  }

  const result = PlagiarismDetector.detectPlagiarism(targetSubmissions)
  res.json({ success: true, ...result })
})

// Health check
app.get('/api/health', (req, res) => {
  const status = {
    server: 'running',
    redis: codeExecutionQueue ? 'connected' : 'not available',
    queues: {
      codeExecution: codeExecutionQueue ? 'active' : 'disabled',
      submission: submissionQueue ? 'active' : 'disabled'
    },
    plagiarismDetection: 'active'
  }
  res.json(status)
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`🚀 Enhanced backend server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  if (codeExecutionQueue) {
    console.log('🔄 Redis queues enabled for high-performance execution')
  } else {
    console.log('⚡ Direct execution mode (install Redis for queue support)')
  }
})