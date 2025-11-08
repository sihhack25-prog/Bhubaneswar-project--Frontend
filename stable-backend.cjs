const express = require('express')
const cors = require('cors')

const app = express()

// Error handling middleware
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

app.use(cors())
app.use(express.json())

// Mock data
const users = [
  { id: 1, email: 'student@test.com', password: 'password', role: 'student', name: 'Test Student' },
  { id: 2, email: 'instructor@test.com', password: 'password', role: 'instructor', name: 'Test Instructor' }
]

const assignments = [
  {
    _id: '1',
    main: {
      id: 1,
      name: 'Two Sum Problem',
      difficulty: 'easy',
      description_body: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      submission_count: 45,
      accept_count: 32
    },
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }
]

// Routes
app.post('/api/auth/login', (req, res) => {
  try {
    console.log('Login request:', req.body)
    const { email, password } = req.body
    const user = users.find(u => u.email === email && u.password === password)
    
    if (user) {
      res.json({
        success: true,
        token: 'mock-token',
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      })
    } else {
      res.status(400).json({ success: false, error: 'Invalid credentials' })
    }
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

app.get('/api/assignments', (req, res) => {
  try {
    res.json({ success: true, assignments })
  } catch (error) {
    console.error('Assignments error:', error)
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

app.get('/api/assignments/:id', (req, res) => {
  try {
    const assignment = assignments.find(a => a._id === req.params.id)
    if (assignment) {
      res.json({ success: true, assignment })
    } else {
      res.status(404).json({ success: false, error: 'Assignment not found' })
    }
  } catch (error) {
    console.error('Assignment detail error:', error)
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

app.post('/api/execute', (req, res) => {
  try {
    const { code, language } = req.body
    res.json({
      success: true,
      output: `Mock output for ${language} code execution`
    })
  } catch (error) {
    console.error('Execute error:', error)
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

app.post('/api/test', (req, res) => {
  try {
    res.json({
      success: true,
      score: 80,
      passedTests: 4,
      totalTests: 5,
      testResults: [
        { testCase: 1, passed: true, actual: 'Expected output' },
        { testCase: 2, passed: true, actual: 'Expected output' },
        { testCase: 3, passed: true, actual: 'Expected output' },
        { testCase: 4, passed: true, actual: 'Expected output' },
        { testCase: 5, passed: false, actual: 'Wrong output' }
      ],
      output: 'Passed 4/5 test cases'
    })
  } catch (error) {
    console.error('Test error:', error)
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

app.get('/api/health', (req, res) => {
  try {
    res.json({ success: true, message: 'Server running', timestamp: new Date() })
  } catch (error) {
    console.error('Health check error:', error)
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

const PORT = 3002

const server = app.listen(PORT, () => {
  console.log(`🚀 Stable backend running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log('Server is stable and waiting for requests...')
})

server.on('error', (err) => {
  console.error('Server error:', err)
})

// Keep the process alive
setInterval(() => {
  console.log(`Server alive at ${new Date().toLocaleTimeString()}`)
}, 30000)