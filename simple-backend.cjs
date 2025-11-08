const express = require('express')
const cors = require('cors')

const app = express()
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

// Auth routes
app.post('/api/auth/login', (req, res) => {
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
})

// Assignments routes
app.get('/api/assignments', (req, res) => {
  res.json({ success: true, assignments })
})

app.get('/api/assignments/:id', (req, res) => {
  const assignment = assignments.find(a => a._id === req.params.id)
  if (assignment) {
    res.json({ success: true, assignment })
  } else {
    res.status(404).json({ success: false, error: 'Assignment not found' })
  }
})

// Code execution
app.post('/api/execute', (req, res) => {
  const { code, language } = req.body
  res.json({
    success: true,
    output: `Mock output for ${language} code execution`
  })
})

// Test submission
app.post('/api/test', (req, res) => {
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
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server running' })
})

const PORT = 3002
app.listen(PORT, () => {
  console.log(`🚀 Simple backend running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
})