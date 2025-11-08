// Node.js backend with MongoDB integration
// Run with: node backend-example.cjs

const express = require('express')
const cors = require('cors')
const https = require('https')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const fs = require('fs')
const path = require('path')

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads'
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir)
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({ storage })

const app = express()
app.use(cors())
app.use(express.json())

// MongoDB connection
mongoose.connect('mongodb+srv://knowissues1234_db_user:knowissuses@cluster0.iyh6ukd.mongodb.net/digitalTA', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB Atlas')
})

mongoose.connection.on('error', (err) => {
  console.log('❌ MongoDB connection error:', err)
})

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  department: String,
  experience: String,
  createdAt: { type: Date, default: Date.now },
  approvedAt: Date,
  rejectedAt: Date,
  stats: {
    totalSubmissions: { type: Number, default: 0 },
    successfulSubmissions: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastSubmission: Date
  }
})

const User = mongoose.model('User', userSchema)

// Assignment Schema (Enhanced)
const assignmentSchema = new mongoose.Schema({
  main: {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    description_body: { type: String, required: true },
    like_count: { type: Number, default: 0 },
    dislike_count: { type: Number, default: 0 },
    accept_count: { type: Number, default: 0 },
    submission_count: { type: Number, default: 0 },
    acceptance_rate_count: { type: Number, default: 0 },
    discussion_count: { type: Number, default: 0 },
    related_topics: [String],
    similar_questions: [String],
    solution_count: { type: Number, default: 0 },
    code_default_language: { type: String, default: 'javascript' },
    code_body: {
      javascript: String,
      python: String,
      java: String,
      cpp: String
    },
    supported_languages: [{ type: String, enum: ['javascript', 'python', 'java', 'cpp'] }]
  },
  editorial: {
    editorial_body: String
  },
  test: [mongoose.Schema.Types.Mixed],
  function_name: { type: String, required: true },
  timeLimit: { type: Number, default: 60 }, // minutes
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
  passedTests: { type: Number, required: true },
  totalTests: { type: Number, required: true },
  testResults: [{
    testCase: Number,
    input: mongoose.Schema.Types.Mixed,
    expected: mongoose.Schema.Types.Mixed,
    actual: String,
    passed: Boolean
  }],
  submittedAt: { type: Date, default: Date.now },
  timeTaken: { type: Number }, // seconds
  status: { type: String, enum: ['Passed', 'Failed', 'Partial'], required: true }
})

const Assignment = mongoose.model('Assignment', assignmentSchema)
const Submission = mongoose.model('Submission', submissionSchema)

// JWT Secret
const JWT_SECRET = 'your-secret-key-change-in-production'

const executeCode = async (code, language) => {
  const languageMap = {
    python: 'python',
    javascript: 'javascript', 
    java: 'java',
    cpp: 'cpp'
  }

  // Fix Java class name for online compiler
  let processedCode = code
  if (language === 'java') {
    // Simple approach: replace any class that has main method with Main
    // Split into sections by class declarations
    const classRegex = /class\s+(\w+)/g
    let match
    const classes = []
    
    while ((match = classRegex.exec(code)) !== null) {
      classes.push({
        name: match[1],
        index: match.index,
        fullMatch: match[0]
      })
    }
    
    // Find which class contains main method
    for (const cls of classes) {
      const classStart = cls.index
      const nextClassStart = classes.find(c => c.index > classStart)?.index || code.length
      const classCode = code.substring(classStart, nextClassStart)
      
      if (classCode.includes('public static void main')) {
        processedCode = code.replace(`class ${cls.name}`, 'class Main')
        console.log(`Renamed class ${cls.name} to Main`)
        break
      }
    }
    
    console.log('Processed Java code:')
    console.log(processedCode)
  }

  return new Promise((resolve) => {
    const data = JSON.stringify({
      language: languageMap[language],
      version: '*',
      files: [{ content: processedCode }]
    })

    const options = {
      hostname: 'emkc.org',
      port: 443,
      path: '/api/v2/piston/execute',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => body += chunk)
      res.on('end', () => {
        try {
          const result = JSON.parse(body)
          console.log('API Response:', JSON.stringify(result, null, 2))
          
          if (result.run) {
            const output = result.run.stdout || result.run.stderr || 'No output'
            console.log('Output:', output)
            resolve({
              success: true,
              output: output
            })
          } else {
            console.log('No run object in response')
            resolve({ success: false, error: 'Execution failed' })
          }
        } catch (error) {
          console.log('Parse error:', error.message)
          console.log('Raw body:', body)
          resolve({ success: false, error: 'Parse error' })
        }
      })
    })

    req.on('error', (error) => {
      resolve({ success: false, error: `Network error: ${error.message}` })
    })

    req.write(data)
    req.end()
  })
}

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, username, email, password, role, department, experience } = req.body
    
    const existingUser = await User.findOne({ $or: [{ email }, { username: username || email }] })
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({ 
      username: username || name || email.split('@')[0], 
      email, 
      password: hashedPassword, 
      role,
      department,
      experience,
      status: role === 'instructor' ? 'pending' : 'approved'
    })
    await user.save()
    
    if (role === 'instructor') {
      return res.json({ success: true, message: 'Registration submitted! Please wait for admin approval.' })
    }
    
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET)
    res.json({ success: true, token, user: { id: user._id, name: user.username, username: user.username, email, role } })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' })
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' })
    }
    
    if (user.role === 'instructor' && user.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'Your application is pending admin approval.' })
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
        role: user.role,
        stats: user.stats
      } 
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (email === 'admin@digitalTA.com' && password === 'SecureAdmin2024!') {
      const token = jwt.sign({ userId: 'admin', role: 'admin' }, JWT_SECRET)
      res.json({ success: true, token, user: { id: 'admin', name: 'Administrator', email, role: 'admin' } })
    } else {
      res.status(400).json({ success: false, message: 'Invalid admin credentials' })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get pending instructors
app.get('/api/admin/pending-instructors', async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor', status: 'pending' }, '-password')
    res.json({ success: true, instructors })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get approved instructors
app.get('/api/admin/approved-instructors', async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor', status: 'approved' }, '-password')
    res.json({ success: true, instructors })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Approve instructor
app.post('/api/admin/approve-instructor/:id', async (req, res) => {
  try {
    const instructor = await User.findByIdAndUpdate(req.params.id, { status: 'approved', approvedAt: new Date() }, { new: true })
    res.json({ success: true, instructor })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Reject instructor
app.post('/api/admin/reject-instructor/:id', async (req, res) => {
  try {
    const instructor = await User.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectedAt: new Date() }, { new: true })
    res.json({ success: true, instructor })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get all users (for instructor evaluation)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password')
    res.json({ success: true, users })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Test endpoint to check database
app.get('/api/test', async (req, res) => {
  try {
    const users = await User.find({}, 'username email role')
    const totalUsers = await User.countDocuments()
    const totalStudents = await User.countDocuments({ role: 'student' })
    const totalInstructors = await User.countDocuments({ role: 'instructor' })
    
    res.json({
      success: true,
      debug: {
        totalUsers,
        totalStudents,
        totalInstructors,
        users
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Analytics endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' })
    const totalInstructors = await User.countDocuments({ role: 'instructor' })
    const totalAssignments = await Assignment.countDocuments()
    const totalSubmissions = await Submission.countDocuments()
    
    res.json({
      success: true,
      analytics: {
        totalStudents,
        totalInstructors,
        totalAssignments,
        totalSubmissions
      }
    })
  } catch (error) {
    console.error('Analytics error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get assignment submissions for instructor
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

// Check if student has submitted assignment
app.get('/api/assignments/:id/submission-status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
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

// Assignment Routes (FireCode format)
app.post('/api/assignments', upload.single('testFile'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    
    const assignmentData = JSON.parse(req.body.assignmentData)
    
    // Parse test cases from uploaded file
    let testCases = []
    if (req.file) {
      const fileContent = fs.readFileSync(req.file.path, 'utf8')
      const lines = fileContent.trim().split('\n')
      
      testCases = lines.map(line => {
        try {
          return JSON.parse(line)
        } catch (error) {
          console.error('Error parsing test case:', line)
          return null
        }
      }).filter(tc => tc !== null)
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path)
    }
    
    const assignment = new Assignment({
      ...assignmentData,
      test: testCases,
      createdBy: decoded.userId
    })
    
    await assignment.save()
    res.json({ success: true, assignment })
  } catch (error) {
    console.error('Assignment creation error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/assignments', async (req, res) => {
  try {
    const assignments = await Assignment.find().populate('createdBy', 'username')
    res.json({ success: true, assignments })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/assignments/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('createdBy', 'username')
    res.json({ success: true, assignment })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Assignment Routes (FireCode format)
app.post('/api/assignments', upload.single('testFile'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    
    const assignmentData = JSON.parse(req.body.assignmentData)
    
    // Parse test cases from uploaded file
    let testCases = []
    if (req.file) {
      const fileContent = fs.readFileSync(req.file.path, 'utf8')
      const lines = fileContent.trim().split('\n')
      
      testCases = lines.map(line => {
        try {
          return JSON.parse(line)
        } catch (error) {
          console.error('Error parsing test case:', line)
          return null
        }
      }).filter(tc => tc !== null)
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path)
    }
    
    const assignment = new Assignment({
      ...assignmentData,
      test: testCases,
      createdBy: decoded.userId
    })
    
    await assignment.save()
    res.json({ success: true, assignment })
  } catch (error) {
    console.error('Assignment creation error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/assignments', async (req, res) => {
  try {
    const assignments = await Assignment.find().populate('createdBy', 'username')
    res.json({ success: true, assignments })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/assignments/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('createdBy', 'username')
    res.json({ success: true, assignment })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Test code without saving to database
app.post('/api/test', async (req, res) => {
  try {
    const { assignmentId, code, language } = req.body
    
    const assignment = await Assignment.findById(assignmentId)
    if (!assignment) {
      return res.json({ success: false, error: 'Assignment not found' })
    }
    
    const testResults = await runTestCases(assignment, code, language)
    
    res.json({
      success: true,
      ...testResults,
      isTest: true
    })
  } catch (error) {
    console.error('Test error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Submit assignment and save to database
app.post('/api/submit', async (req, res) => {
  try {
    const { assignmentId, code, language, timeTaken } = req.body
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    
    const assignment = await Assignment.findById(assignmentId)
    if (!assignment) {
      return res.json({ success: false, error: 'Assignment not found' })
    }
    
    // Check deadline
    if (new Date() > new Date(assignment.deadline)) {
      return res.json({ success: false, error: 'Assignment deadline has passed' })
    }
    
    const testResults = await runTestCases(assignment, code, language)
    
    // Determine status
    let status = 'Failed'
    if (testResults.passedTests === testResults.totalTests) {
      status = 'Passed'
    } else if (testResults.passedTests > 0) {
      status = 'Partial'
    }
    
    // Save submission to database
    const submission = new Submission({
      assignmentId,
      userId: decoded.userId,
      code,
      language,
      score: testResults.score,
      passedTests: testResults.passedTests,
      totalTests: testResults.totalTests,
      testResults: testResults.testResults,
      timeTaken,
      status
    })
    
    await submission.save()
    
    // Update assignment submission count
    await Assignment.findByIdAndUpdate(assignmentId, {
      $inc: { 'main.submission_count': 1 }
    })
    
    res.json({
      success: true,
      ...testResults,
      submissionId: submission._id,
      message: 'Submission saved successfully'
    })
  } catch (error) {
    console.error('Submission error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Helper function to run test cases
async function runTestCases(assignment, code, language) {
  let totalScore = 0
  let passedTests = 0
  const testResults = []
  
  const testCases = assignment.test || []
  if (testCases.length === 0) {
    const result = await executeCode(code, language)
    return {
      score: result.success ? 100 : 0,
      passedTests: result.success ? 1 : 0,
      totalTests: 1,
      testResults: [{
        testCase: 1,
        input: 'No test case',
        expected: 'Code execution',
        actual: result.output || result.error || 'No output',
        passed: result.success
      }],
      output: result.success ? 'Code executed successfully' : 'Code execution failed'
    }
  }
  
  for (let i = 0; i < testCases.length; i++) {
    const result = await executeCode(code, language)
    const actualOutput = result.output?.trim() || ''
    const passed = result.success
    
    if (passed) {
      passedTests++
      totalScore += 10
    }
    
    testResults.push({
      testCase: i + 1,
      input: 'Test input',
      expected: 'Expected output',
      actual: actualOutput,
      passed
    })
  }
  
  const finalScore = testCases.length > 0 ? Math.round((passedTests / testCases.length) * 100) : 0
  
  return {
    score: finalScore,
    passedTests,
    totalTests: testCases.length,
    testResults,
    output: `Passed ${passedTests}/${testCases.length} test cases`
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

// Ultra-fast hybrid plagiarism detection with 3-stage optimization
app.get('/api/plagiarism/:assignmentId', async (req, res) => {
  try {
    const submissions = await Submission.find({ assignmentId: req.params.assignmentId })
      .populate('userId', 'username email')
    
    if (submissions.length < 2) {
      return res.json({ 
        success: true, 
        results: [], 
        totalSubmissions: submissions.length,
        message: 'Need at least 2 submissions for plagiarism detection'
      })
    }
    
    const startTime = Date.now()
    
    // Stage 1: Ultra-fast 64-bit fingerprint generation
    const fingerprints = submissions.map(sub => ({
      id: sub._id,
      userId: sub.userId,
      code: sub.code,
      language: sub.language,
      fp: generateTrigramFingerprint(sub.code),
      submittedAt: sub.submittedAt
    }))
    
    // Stage 2: Parallel candidate filtering with bit operations
    const candidates = []
    const batchSize = Math.min(1000, fingerprints.length)
    
    for (let i = 0; i < fingerprints.length; i += batchSize) {
      const batch = fingerprints.slice(i, Math.min(i + batchSize, fingerprints.length))
      
      for (let j = 0; j < batch.length; j++) {
        for (let k = j + 1; k < fingerprints.length; k++) {
          const hamming = fastHamming(batch[j].fp, fingerprints[k].fp)
          if (hamming <= 6) { // Tighter threshold for speed
            candidates.push([i + j, k, hamming])
          }
        }
      }
    }
    
    // Stage 3: Selective detailed analysis
    const results = []
    let totalSim = 0
    
    for (const [i, j, hamming] of candidates.slice(0, 500)) { // Limit for speed
      const sim = fastSimilarity(fingerprints[i].code, fingerprints[j].code)
      totalSim += sim
      
      if (sim > 0.4) {
        const risk = sim > 0.8 ? 'High' : sim > 0.6 ? 'Medium' : 'Low'
        
        results.push({
          student1: fingerprints[i].userId.username,
          student2: fingerprints[j].userId.username,
          similarity: Math.round(sim * 100),
          riskLevel: risk,
          hammingDistance: hamming,
          timeDiff: Math.abs(new Date(fingerprints[i].submittedAt) - new Date(fingerprints[j].submittedAt)) / 60000
        })
      }
    }
    
    const searchTime = Date.now() - startTime
    
    res.json({
      success: true,
      results: results.sort((a, b) => b.similarity - a.similarity),
      metrics: {
        totalSubmissions: submissions.length,
        candidatePairs: candidates.length,
        searchTime,
        speedup: Math.round((submissions.length ** 2) / Math.max(candidates.length, 1)),
        algorithm: 'Trigram LSH + Fast Hamming'
      }
    })
  } catch (error) {
    console.error('Plagiarism detection error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Advanced plagiarism detection using Winnowing algorithm
function calculateCodeSimilarity(code1, code2) {
  // Step 1: Preprocess code
  const preprocess = (code) => {
    return code
      .replace(/\/\/.*|\/\*[\s\S]*?\*\/|#.*/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\b[a-zA-Z_]\w*\b/g, (match) => {
        // Normalize variable names (keep keywords)
        const keywords = ['if', 'else', 'for', 'while', 'function', 'return', 'var', 'let', 'const', 'class', 'def', 'import', 'from']
        return keywords.includes(match.toLowerCase()) ? match : 'VAR'
      })
      .toLowerCase().trim()
  }
  
  // Step 2: Tokenize
  const tokenize = (code) => {
    return code.match(/[A-Za-z_]\w*|[{}();,+\-/*=<>!&|]/g) || []
  }
  
  // Step 3: Generate k-grams (Winnowing)
  const generateKGrams = (tokens, k = 5) => {
    const kgrams = []
    for (let i = 0; i <= tokens.length - k; i++) {
      kgrams.push(tokens.slice(i, i + k).join(' '))
    }
    return kgrams
  }
  
  // Step 4: Hash k-grams
  const hashKGrams = (kgrams) => {
    return kgrams.map(kgram => {
      let hash = 0
      for (let i = 0; i < kgram.length; i++) {
        const char = kgram.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
      }
      return Math.abs(hash)
    })
  }
  
  // Step 5: Winnowing - select minimum hash in each window
  const winnow = (hashes, w = 4) => {
    const fingerprints = new Set()
    for (let i = 0; i <= hashes.length - w; i++) {
      const window = hashes.slice(i, i + w)
      const minHash = Math.min(...window)
      fingerprints.add(minHash)
    }
    return fingerprints
  }
  
  // Step 6: Calculate Jaccard similarity
  const jaccardSimilarity = (set1, set2) => {
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    return union.size === 0 ? 0 : intersection.size / union.size
  }
  
  // Process both codes
  const processed1 = preprocess(code1)
  const processed2 = preprocess(code2)
  
  if (processed1 === processed2) return 1.0
  
  const tokens1 = tokenize(processed1)
  const tokens2 = tokenize(processed2)
  
  if (tokens1.length < 5 || tokens2.length < 5) {
    // Fallback to simple similarity for short codes
    const words1 = processed1.split(' ')
    const words2 = processed2.split(' ')
    const intersection = words1.filter(word => words2.includes(word))
    const union = [...new Set([...words1, ...words2])]
    return union.length === 0 ? 0 : intersection.length / union.length
  }
  
  const kgrams1 = generateKGrams(tokens1)
  const kgrams2 = generateKGrams(tokens2)
  
  const hashes1 = hashKGrams(kgrams1)
  const hashes2 = hashKGrams(kgrams2)
  
  const fingerprints1 = winnow(hashes1)
  const fingerprints2 = winnow(hashes2)
  
  return jaccardSimilarity(fingerprints1, fingerprints2)
}

// Fast fingerprint generation for candidate filtering (LSH-inspired)
function generateFastFingerprint(code, bits = 64) {
  // Stage 1: Normalize code
  const normalized = code
    .replace(/\/\/.*|\/\*[\s\S]*?\*\/|#.*/g, '') // Remove comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\b[a-zA-Z_]\w*\b/g, (match) => {
      const keywords = ['if', 'else', 'for', 'while', 'function', 'return', 'var', 'let', 'const']
      return keywords.includes(match.toLowerCase()) ? match : 'V'
    })
    .toLowerCase().trim()
  
  // Stage 2: Generate k-grams and hash to bits
  const tokens = normalized.match(/[A-Za-z_]\w*|[{}();,+\-/*=<>!&|]/g) || []
  let fingerprint = 0n // Use BigInt for 64-bit operations
  
  for (let i = 0; i < tokens.length - 2; i++) {
    const trigram = tokens.slice(i, i + 3).join('')
    let hash = 0
    for (let j = 0; j < trigram.length; j++) {
      hash = ((hash << 5) - hash + trigram.charCodeAt(j)) & 0xffffffff
    }
    
    // Set bits based on hash
    const bitPos = Math.abs(hash) % bits
    fingerprint |= (1n << BigInt(bitPos))
  }
  
  return fingerprint
}

// Fast Hamming distance calculation
function fastHamming(fp1, fp2) {
  let xor = fp1 ^ fp2
  let count = 0
  while (xor) {
    count += Number(xor & 1n)
    xor >>= 1n
  }
  return count
}

// Fast similarity calculation
function fastSimilarity(code1, code2) {
  return calculateCodeSimilarity(code1, code2)
}

// Trigram fingerprint generation
function generateTrigramFingerprint(code) {
  return generateFastFingerprint(code)
}

module.exports = { app }stance calculation
function calculateHammingDistance(fp1, fp2) {
  const xor = fp1 ^ fp2
  let count = 0
  let temp = xor
  
  // Count set bits using Brian Kernighan's algorithm
  while (temp > 0n) {
    temp &= temp - 1n
    count++
  }
  
  return count
}

// Get user submissions
app.get('/api/submissions', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    
    const submissions = await Submission.find({ userId: decoded.userId })
      .populate('assignmentId', 'main.name')
      .sort({ submittedAt: -1 })
    
    const enrichedSubmissions = submissions.map(submission => ({
      ...submission.toObject(),
      assignmentTitle: submission.assignmentId?.main?.name || 'Unknown Assignment'
    }))
    
    res.json({ success: true, submissions: enrichedSubmissions })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get leaderboard data
app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }, 'username email stats')
    const submissions = await Submission.find().populate('userId', 'username')
    
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
    
    // Add ranks
    leaderboard.forEach((student, index) => {
      student.rank = index + 1
    })
    
    res.json({ success: true, leaderboard })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Simple test endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend server is running!', timestamp: new Date() })
})

const PORT = 3001
app.listen(PORT, async () => {
  console.log(`\n🚀 Digital TA server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🔧 Test endpoint: http://localhost:${PORT}/api/test`)
  
  // Debug: Check existing users on startup
  try {
    const userCount = await User.countDocuments()
    const studentCount = await User.countDocuments({ role: 'student' })
    const instructorCount = await User.countDocuments({ role: 'instructor' })
    
    console.log('\n=== Database Status ===')
    console.log(`Total Users: ${userCount}`)
    console.log(`Students: ${studentCount}`)
    console.log(`Instructors: ${instructorCount}`)
    console.log('=====================\n')
  } catch (error) {
    console.log('❌ Database connection error:', error.message)
  }
})

// Ultra-fast trigram fingerprinting (64-bit)
function generateTrigramFingerprint(code) {
  const tokens = code.replace(/\s+/g, ' ').toLowerCase().split(' ')
  let fp = 0n
  
  for (let i = 0; i < tokens.length - 2; i++) {
    const trigram = tokens[i] + tokens[i+1] + tokens[i+2]
    const hash = simpleHash(trigram)
    fp |= 1n << BigInt(hash % 64)
  }
  
  return Number(fp & 0xFFFFFFFFFFFFFFFFn)
}

// Brian Kernighan's algorithm for ultra-fast bit counting
function fastHamming(a, b) {
  let xor = a ^ b
  let count = 0
  
  while (xor) {
    count++
    xor &= xor - 1 // Remove rightmost set bit
  }
  
  return count
}

// Lightning-fast similarity using token overlap
function fastSimilarity(code1, code2) {
  const tokens1 = new Set(code1.replace(/\W+/g, ' ').toLowerCase().split(' '))
  const tokens2 = new Set(code2.replace(/\W+/g, ' ').toLowerCase().split(' '))
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)))
  const union = new Set([...tokens1, ...tokens2])
  
  return intersection.size / union.size
}

// Simple hash function for trigrams
function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xFFFFFFFF
  }
  return Math.abs(hash)
}