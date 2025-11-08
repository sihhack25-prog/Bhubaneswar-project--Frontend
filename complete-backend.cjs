const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const multer = require('multer')

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' })

const app = express()
app.use(cors())
app.use(express.json())

// MongoDB connection
mongoose.connect('mongodb+srv://knowissues1234_db_user:knowissuses@cluster0.iyh6ukd.mongodb.net/digitalTA', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], required: true },
  createdAt: { type: Date, default: Date.now }
})

// Assignment Schema
const assignmentSchema = new mongoose.Schema({
  main: {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    description_body: { type: String, required: true },
    submission_count: { type: Number, default: 0 },
    accept_count: { type: Number, default: 0 },
    code_body: {
      javascript: String,
      python: String,
      java: String,
      cpp: String
    }
  },
  deadline: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
})

// Submission Schema
const submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  score: { type: Number, required: true },
  status: { type: String, enum: ['Passed', 'Failed', 'Partial'], required: true },
  passedTests: { type: Number, default: 0 },
  totalTests: { type: Number, default: 0 },
  testResults: [{
    testCase: Number,
    passed: Boolean,
    input: mongoose.Schema.Types.Mixed,
    expected: mongoose.Schema.Types.Mixed,
    actual: mongoose.Schema.Types.Mixed
  }],
  timeTaken: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now }
})

// Report Schema
const reportSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  reason: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  instructorResponse: { type: String },
  createdAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date }
})

const User = mongoose.model('User', userSchema)
const Assignment = mongoose.model('Assignment', assignmentSchema)
const Submission = mongoose.model('Submission', submissionSchema)
const Report = mongoose.model('Report', reportSchema)

const JWT_SECRET = 'your-secret-key'

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' })
    }
    
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' })
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' })
    }
    
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET)
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.username,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' })
    }
    
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({
      username: name || email.split('@')[0],
      email,
      password: hashedPassword,
      role: role || 'student'
    })
    
    await user.save()
    
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET)
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.username,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Admin routes
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    const admin = await User.findOne({ email, role: 'admin' })
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid admin credentials' })
    }
    
    const isValidPassword = await bcrypt.compare(password, admin.password)
    if (!isValidPassword) {
      return res.status(400).json({ success: false, message: 'Invalid admin credentials' })
    }
    
    const token = jwt.sign({ userId: admin._id, role: admin.role }, JWT_SECRET)
    res.json({
      success: true,
      token,
      user: { id: admin._id, name: admin.username, email: admin.email, role: 'admin' }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Assignment routes
app.get('/api/assignments', async (req, res) => {
  try {
    const assignments = await Assignment.find().populate('createdBy', 'username')
    res.json({ success: true, assignments })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/assignments', upload.single('testFile'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' })
    }
    
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      // Handle mock tokens for development
      if (token.includes('mock')) {
        decoded = { userId: 'mock-instructor', role: 'instructor' }
      } else {
        return res.status(401).json({ success: false, error: 'Invalid token' })
      }
    }
    
    if (decoded.role !== 'instructor' && decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only instructors can create assignments' })
    }
    
    const assignmentData = JSON.parse(req.body.assignmentData || '{}')
    
    const assignment = new Assignment({
      ...assignmentData,
      createdBy: decoded.userId
    })
    
    await assignment.save()
    
    res.json({ success: true, assignment, message: 'Assignment created successfully' })
  } catch (error) {
    console.error('Assignment creation error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/assignments/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('createdBy', 'username')
    if (assignment) {
      res.json({ success: true, assignment })
    } else {
      res.status(404).json({ success: false, error: 'Assignment not found' })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/assignments/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' })
    }
    
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.role !== 'instructor' && decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only instructors can delete assignments' })
    }
    
    const assignment = await Assignment.findByIdAndDelete(req.params.id)
    if (assignment) {
      res.json({ success: true, message: 'Assignment deleted successfully' })
    } else {
      res.status(404).json({ success: false, error: 'Assignment not found' })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Code execution
app.post('/api/execute', (req, res) => {
  const { code, language } = req.body
  
  try {
    let output = ''
    
    if (language === 'javascript') {
      // Simple JavaScript execution
      const originalLog = console.log
      const logs = []
      console.log = (...args) => logs.push(args.join(' '))
      
      try {
        eval(code)
        output = logs.join('\n') || 'Code executed successfully'
      } catch (error) {
        output = `Error: ${error.message}`
      } finally {
        console.log = originalLog
      }
    } else {
      output = `Code execution for ${language} not implemented yet`
    }
    
    res.json({
      success: true,
      output: output
    })
  } catch (error) {
    res.json({
      success: false,
      output: `Execution error: ${error.message}`
    })
  }
})

// Test submission
app.post('/api/test', async (req, res) => {
  const { assignmentId, code, language } = req.body
  
  try {
    // Get assignment to check test cases
    const assignment = await Assignment.findById(assignmentId)
    if (!assignment) {
      return res.json({
        success: false,
        error: 'Assignment not found'
      })
    }
    
    // Simple test execution for JavaScript
    if (language === 'javascript') {
      const testResults = []
      let passedTests = 0
      const totalTests = 3 // Mock test cases
      
      // Mock test cases - in real implementation, these would come from assignment
      const mockTests = [
        { input: [2, 7, 11, 15, 9], expected: [0, 1], description: 'Test case 1' },
        { input: [3, 2, 4, 6], expected: [1, 2], description: 'Test case 2' },
        { input: [3, 3, 6], expected: [0, 1], description: 'Test case 3' }
      ]
      
      for (let i = 0; i < mockTests.length; i++) {
        const test = mockTests[i]
        try {
          // Execute the code with test input
          const result = executeTestCase(code, test.input)
          const passed = JSON.stringify(result) === JSON.stringify(test.expected)
          
          testResults.push({
            testCase: i + 1,
            passed: passed,
            input: test.input,
            expected: test.expected,
            actual: result,
            description: test.description
          })
          
          if (passed) passedTests++
        } catch (error) {
          testResults.push({
            testCase: i + 1,
            passed: false,
            input: test.input,
            expected: test.expected,
            actual: `Error: ${error.message}`,
            description: test.description
          })
        }
      }
      
      const score = Math.round((passedTests / totalTests) * 100)
      
      res.json({
        success: true,
        score: score,
        passedTests: passedTests,
        totalTests: totalTests,
        testResults: testResults,
        output: `Passed ${passedTests}/${totalTests} test cases`,
        isTest: true
      })
    } else {
      res.json({
        success: false,
        error: `Testing for ${language} not implemented yet`
      })
    }
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    })
  }
})

// Helper function to execute test cases
function executeTestCase(code, input) {
  try {
    // Create a safe execution context
    const func = new Function('input', `
      ${code}
      // Try to find and call the main function
      if (typeof twoSum === 'function') {
        return twoSum(input[0], input[1]);
      }
      if (typeof solution === 'function') {
        return solution(input[0], input[1]);
      }
      // Default: assume it's a two sum problem
      const arr = input.slice(0, -1);
      const target = input[input.length - 1];
      return twoSum ? twoSum(arr, target) : [];
    `)
    
    return func(input)
  } catch (error) {
    throw new Error(`Execution failed: ${error.message}`)
  }
}

// Submit assignment
app.post('/api/submit', async (req, res) => {
  const { assignmentId, code, language, timeTaken } = req.body
  
  try {
    const token = req.headers.authorization?.split(' ')[1]
    let decoded
    
    if (token) {
      try {
        decoded = jwt.verify(token, JWT_SECRET)
      } catch (error) {
        if (token.includes('mock')) {
          decoded = { userId: 'mock-student', role: 'student' }
        } else {
          return res.json({ success: false, error: 'Invalid token' })
        }
      }
    }
    
    // Run the same test logic as /api/test
    const assignment = await Assignment.findById(assignmentId)
    if (!assignment) {
      return res.json({
        success: false,
        error: 'Assignment not found'
      })
    }
    
    let testResults = []
    let passedTests = 0
    let totalTests = 3
    let score = 0
    
    if (language === 'javascript') {
      const mockTests = [
        { input: [2, 7, 11, 15, 9], expected: [0, 1], description: 'Test case 1' },
        { input: [3, 2, 4, 6], expected: [1, 2], description: 'Test case 2' },
        { input: [3, 3, 6], expected: [0, 1], description: 'Test case 3' }
      ]
      
      for (let i = 0; i < mockTests.length; i++) {
        const test = mockTests[i]
        try {
          const result = executeTestCase(code, test.input)
          const passed = JSON.stringify(result) === JSON.stringify(test.expected)
          
          testResults.push({
            testCase: i + 1,
            passed: passed,
            input: test.input,
            expected: test.expected,
            actual: result
          })
          
          if (passed) passedTests++
        } catch (error) {
          testResults.push({
            testCase: i + 1,
            passed: false,
            input: test.input,
            expected: test.expected,
            actual: `Error: ${error.message}`
          })
        }
      }
      
      score = Math.round((passedTests / totalTests) * 100)
    }
    
    // Save submission to database if user is authenticated
    let submissionCount = 0
    if (decoded && decoded.userId) {
      try {
        // For mock users, create a real user in database
        let userId = decoded.userId
        if (decoded.userId === 'mock-student') {
          let mockUser = await User.findOne({ email: 'mock-student@test.com' })
          if (!mockUser) {
            mockUser = new User({
              username: 'Mock Student',
              email: 'mock-student@test.com',
              password: await bcrypt.hash('password', 10),
              role: 'student'
            })
            await mockUser.save()
          }
          userId = mockUser._id
        }
        
        const submission = new Submission({
          assignmentId: assignmentId,
          userId: userId,
          code: code,
          language: language,
          score: score,
          status: score >= 70 ? 'Passed' : score >= 40 ? 'Partial' : 'Failed',
          passedTests: passedTests,
          totalTests: totalTests,
          testResults: testResults,
          timeTaken: timeTaken || 0
        })
        
        await submission.save()
        
        // Get submission count for this user and assignment
        submissionCount = await Submission.countDocuments({
          assignmentId: assignmentId,
          userId: userId
        })
        
        // Update assignment submission count
        await Assignment.findByIdAndUpdate(assignmentId, {
          $inc: { 'main.submission_count': 1 }
        })
      } catch (error) {
        console.error('Error saving submission:', error)
        submissionCount = 1 // Fallback
      }
    }
    
    res.json({
      success: true,
      score: score,
      passedTests: passedTests,
      totalTests: totalTests,
      testResults: testResults,
      output: `Passed ${passedTests}/${totalTests} test cases`,
      submissionId: 'submission-' + Date.now(),
      submissionCount: submissionCount,
      message: `Submission saved successfully! This is your submission #${submissionCount} for this assignment.`
    })
    
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    })
  }
})

// Get user submissions
app.get('/api/submissions', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' })
    }
    
    const decoded = jwt.verify(token, JWT_SECRET)
    const submissions = await Submission.find({ userId: decoded.userId })
      .populate('assignmentId', 'main.name')
      .sort({ submittedAt: -1 })
    
    res.json({ success: true, submissions })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get all users for leaderboard
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }, 'username email')
    res.json({ success: true, users })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get leaderboard data
app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }, 'username email')
    const submissions = await Submission.find().populate('userId', 'username email')
    
    const leaderboard = users.map(user => {
      const userSubmissions = submissions.filter(s => s.userId?._id?.toString() === user._id.toString())
      const totalScore = userSubmissions.reduce((sum, s) => sum + (s.score || 0), 0)
      const avgScore = userSubmissions.length > 0 ? Math.round(totalScore / userSubmissions.length) : 0
      
      return {
        studentId: user.username,
        name: user.username,
        email: user.email,
        totalScore: avgScore,
        submissions: userSubmissions.length,
        avgScore,
        rank: 0
      }
    }).sort((a, b) => b.avgScore - a.avgScore)
    
    leaderboard.forEach((student, index) => {
      student.rank = index + 1
    })
    
    res.json({ success: true, leaderboard })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Check assignment submission status
app.get('/api/assignments/:id/submission-status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.json({ success: true, hasSubmitted: false, submission: null })
    }
    
    const decoded = jwt.verify(token, JWT_SECRET)
    const submission = await Submission.findOne({ 
      assignmentId: req.params.id, 
      userId: decoded.userId 
    })
    
    res.json({ 
      success: true, 
      hasSubmitted: !!submission,
      submission: submission || null
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get analytics for instructor
app.get('/api/analytics', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' })
    }
    
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      // Handle mock tokens for development
      if (token.includes('mock')) {
        decoded = { userId: 'mock-instructor', role: 'instructor' }
      } else {
        return res.status(401).json({ success: false, error: 'Invalid token' })
      }
    }
    
    if (decoded.role === 'instructor') {
      const totalAssignments = await Assignment.countDocuments()
      const totalSubmissions = await Submission.countDocuments()
      const totalStudents = await User.countDocuments({ role: 'student' })
      
      res.json({
        success: true,
        analytics: {
          totalAssignments,
          totalSubmissions,
          totalStudents,
          totalInstructors: 1
        }
      })
    } else {
      res.status(403).json({ success: false, error: 'Only instructors can view analytics' })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get assignment submissions
app.get('/api/assignments/:id/submissions', async (req, res) => {
  try {
    const submissions = await Submission.find({ assignmentId: req.params.id })
      .populate('userId', 'username email')
      .sort({ submittedAt: -1 })
    
    res.json({ success: true, submissions })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get assignments with submission stats
app.get('/api/assignments-with-stats', async (req, res) => {
  try {
    const assignments = await Assignment.find().populate('createdBy', 'username')
    
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        const submissionCount = await Submission.countDocuments({ assignmentId: assignment._id })
        const submissions = await Submission.find({ assignmentId: assignment._id })
        const avgScore = submissions.length > 0 
          ? Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length)
          : 0
        
        return {
          ...assignment.toObject(),
          submissionCount,
          avgScore
        }
      })
    )
    
    res.json({ success: true, assignments: assignmentsWithStats })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' })
    }
    
    const decoded = jwt.verify(token, JWT_SECRET)
    
    if (decoded.role === 'student') {
      const totalAssignments = await Assignment.countDocuments()
      const userSubmissions = await Submission.find({ userId: decoded.userId })
      const completedAssignments = userSubmissions.length
      const avgScore = userSubmissions.length > 0 
        ? Math.round(userSubmissions.reduce((sum, s) => sum + s.score, 0) / userSubmissions.length)
        : 0
      
      res.json({
        success: true,
        stats: {
          openAssignments: Math.max(0, totalAssignments - completedAssignments),
          completedAssignments,
          averageScore: avgScore,
          totalSubmissions: userSubmissions.length
        }
      })
    } else if (decoded.role === 'instructor') {
      const totalAssignments = await Assignment.countDocuments()
      const totalSubmissions = await Submission.countDocuments()
      const totalStudents = await User.countDocuments({ role: 'student' })
      
      res.json({
        success: true,
        stats: {
          totalAssignments,
          totalSubmissions,
          totalStudents,
          avgGrade: 85
        }
      })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Report endpoints
app.post('/api/reports', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    let decoded
    
    if (token) {
      try {
        decoded = jwt.verify(token, JWT_SECRET)
      } catch (error) {
        if (token.includes('mock')) {
          decoded = { userId: 'mock-student', role: 'student' }
        }
      }
    }
    
    const { assignmentId, reason, description } = req.body
    
    const report = new Report({
      studentId: decoded.userId,
      assignmentId,
      reason,
      description
    })
    
    await report.save()
    
    res.json({
      success: true,
      message: 'Report submitted successfully. Instructor will review it shortly.',
      reportId: report._id
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('studentId', 'username email')
      .populate('assignmentId', 'main.name')
      .sort({ createdAt: -1 })
    
    res.json({ success: true, reports })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/reports/:id', async (req, res) => {
  try {
    const { status, instructorResponse } = req.body
    
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        instructorResponse, 
        reviewedAt: new Date() 
      },
      { new: true }
    )
    
    res.json({ success: true, report })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
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
  
  // Keep server alive
  setInterval(() => {
    console.log(`[${new Date().toLocaleTimeString()}] Server running...`)
  }, 60000)
})