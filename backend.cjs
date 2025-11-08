const express = require('express')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const multer = require('multer')

const app = express()
app.use(cors())
app.use(express.json())

// In-memory database (replace with MongoDB/PostgreSQL in production)
let users = []
let assignments = []
let submissions = []

const JWT_SECRET = 'your-secret-key'

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' })

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
    // Create user if doesn't exist (for demo purposes)
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
    fs.unlinkSync(req.file.path) // Clean up uploaded file
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

app.post('/api/assignments/:id/submit', authenticateToken, (req, res) => {
  const { code, language } = req.body
  const assignmentId = req.params.id
  
  const assignment = assignments.find(a => a.id == assignmentId || a._id === assignmentId)
  if (!assignment) {
    return res.status(404).json({ success: false, error: 'Assignment not found' })
  }

  // Execute code and calculate score
  executeCodeWithTests(code, language, assignment.testCases || [])
    .then(result => {
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
      
      // Remove previous submission for same assignment/user
      submissions = submissions.filter(s => !(s.assignmentId == assignmentId && s.userId === req.user.id))
      submissions.push(submission)
      
      res.json({ success: true, submission })
    })
    .catch(error => {
      res.status(500).json({ success: false, error: error.message })
    })
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

  // Calculate leaderboard
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

  // Calculate overall metrics
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

// Code execution
const executeCode = (code, language) => {
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

const executeCodeWithTests = async (code, language, testCases) => {
  const results = []
  let passedTests = 0

  for (const testCase of testCases) {
    const result = await executeCode(code, language)
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

app.post('/api/execute', async (req, res) => {
  const { code, language } = req.body
  
  if (!code || !language) {
    return res.json({ success: false, error: 'Code and language are required' })
  }

  const result = await executeCode(code, language)
  res.json(result)
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`)
})