const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

// Mock users
const users = [
  { id: 1, email: 'student@test.com', password: 'password', role: 'student', name: 'Test Student', username: 'student1' },
  { id: 2, email: 'instructor@test.com', password: 'password', role: 'instructor', name: 'Test Instructor', username: 'instructor1' }
]

// Mock assignments
const assignments = [
  {
    _id: '1',
    main: {
      id: 1,
      name: 'Two Sum Problem',
      difficulty: 'easy',
      description_body: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      submission_count: 45,
      accept_count: 32,
      code_body: {
        javascript: 'function twoSum(nums, target) {\n  // Your code here\n}',
        python: 'def two_sum(nums, target):\n    # Your code here\n    pass'
      }
    },
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: { username: 'instructor1' }
  }
]

// Auth routes
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body)
  const { email, password } = req.body
  
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' })
  }
  
  const user = users.find(u => u.email === email && u.password === password)
  
  if (user) {
    res.json({
      success: true,
      token: 'mock-token-' + user.id,
      user: { 
        id: user.id, 
        name: user.name, 
        username: user.username,
        email: user.email, 
        role: user.role 
      }
    })
  } else {
    res.status(400).json({ success: false, error: 'Invalid credentials' })
  }
})

app.post('/api/auth/register', (req, res) => {
  console.log('Register request received:', req.body)
  const { name, email, password, role } = req.body
  
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' })
  }
  
  const existingUser = users.find(u => u.email === email)
  if (existingUser) {
    return res.status(400).json({ success: false, error: 'User already exists' })
  }
  
  const newUser = {
    id: users.length + 1,
    email,
    password,
    role: role || 'student',
    name: name || email.split('@')[0],
    username: name || email.split('@')[0]
  }
  
  users.push(newUser)
  
  res.json({
    success: true,
    token: 'mock-token-' + newUser.id,
    user: {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    }
  })
})

// Admin routes
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body
  
  if (email === 'admin@digitalTA.com' && password === 'SecureAdmin2024!') {
    res.json({
      success: true,
      token: 'admin-token',
      user: { id: 'admin', name: 'Administrator', email, role: 'admin' }
    })
  } else {
    res.status(400).json({ success: false, message: 'Invalid admin credentials' })
  }
})

// Assignment routes
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
    output: `Mock execution result for ${language}:\nHello World!`
  })
})

// Test submission
app.post('/api/test', (req, res) => {
  const { assignmentId, code, language } = req.body
  res.json({
    success: true,
    score: 80,
    passedTests: 4,
    totalTests: 5,
    testResults: [
      { testCase: 1, passed: true, actual: 'Expected output', input: 'Test 1', expected: 'Expected output' },
      { testCase: 2, passed: true, actual: 'Expected output', input: 'Test 2', expected: 'Expected output' },
      { testCase: 3, passed: true, actual: 'Expected output', input: 'Test 3', expected: 'Expected output' },
      { testCase: 4, passed: true, actual: 'Expected output', input: 'Test 4', expected: 'Expected output' },
      { testCase: 5, passed: false, actual: 'Wrong output', input: 'Test 5', expected: 'Expected output' }
    ],
    output: 'Passed 4/5 test cases',
    isTest: true
  })
})

// Submit assignment
app.post('/api/submit', (req, res) => {
  const { assignmentId, code, language, timeTaken } = req.body
  res.json({
    success: true,
    score: 85,
    passedTests: 4,
    totalTests: 5,
    testResults: [
      { testCase: 1, passed: true, actual: 'Expected output' },
      { testCase: 2, passed: true, actual: 'Expected output' },
      { testCase: 3, passed: true, actual: 'Expected output' },
      { testCase: 4, passed: true, actual: 'Expected output' },
      { testCase: 5, passed: false, actual: 'Wrong output' }
    ],
    output: 'Passed 4/5 test cases',
    submissionId: 'mock-submission-' + Date.now(),
    message: 'Submission saved successfully'
  })
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server running', timestamp: new Date() })
})

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

const PORT = 3002
app.listen(PORT, () => {
  console.log(`🚀 Complete backend running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log('Available test credentials:')
  console.log('  Student: student@test.com / password')
  console.log('  Instructor: instructor@test.com / password')
  console.log('  Admin: admin@digitalTA.com / SecureAdmin2024!')
  
  // Keep server alive
  setInterval(() => {
    console.log(`[${new Date().toLocaleTimeString()}] Server running...`)
  }, 60000)
})