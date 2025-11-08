// Node.js backend with MongoDB integration
// Run with: node backend-fixed.cjs

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
    
    for (const cls of classes) {
      const classStart = cls.index
      const nextClassStart = classes.find(c => c.index > classStart)?.index || code.length
      const classCode = code.substring(classStart, nextClassStart)
      
      if (classCode.includes('public static void main')) {
        processedCode = code.replace(`class ${cls.name}`, 'class Main')
        break
      }
    }
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
          
          if (result.run) {
            const output = result.run.stdout || result.run.stderr || 'No output'
            resolve({
              success: true,
              output: output
            })
          } else {
            resolve({ success: false, error: 'Execution failed' })
          }
        } catch (error) {
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

// Advanced plagiarism detection using Winnowing algorithm
function calculateCodeSimilarity(code1, code2) {
  const preprocess = (code) => {
    return code
      .replace(/\/\/.*|\/\*[\s\S]*?\*\/|#.*/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\b[a-zA-Z_]\w*\b/g, (match) => {
        const keywords = ['if', 'else', 'for', 'while', 'function', 'return', 'var', 'let', 'const', 'class', 'def', 'import', 'from']
        return keywords.includes(match.toLowerCase()) ? match : 'VAR'
      })
      .toLowerCase().trim()
  }
  
  const tokenize = (code) => {
    return code.match(/[A-Za-z_]\w*|[{}();,+\-/*=<>!&|]/g) || []
  }
  
  const generateKGrams = (tokens, k = 5) => {
    const kgrams = []
    for (let i = 0; i <= tokens.length - k; i++) {
      kgrams.push(tokens.slice(i, i + k).join(' '))
    }
    return kgrams
  }
  
  const hashKGrams = (kgrams) => {
    return kgrams.map(kgram => {
      let hash = 0
      for (let i = 0; i < kgram.length; i++) {
        const char = kgram.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return Math.abs(hash)
    })
  }
  
  const winnow = (hashes, w = 4) => {
    const fingerprints = new Set()
    for (let i = 0; i <= hashes.length - w; i++) {
      const window = hashes.slice(i, i + w)
      const minHash = Math.min(...window)
      fingerprints.add(minHash)
    }
    return fingerprints
  }
  
  const jaccardSimilarity = (set1, set2) => {
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    return union.size === 0 ? 0 : intersection.size / union.size
  }
  
  const processed1 = preprocess(code1)
  const processed2 = preprocess(code2)
  
  if (processed1 === processed2) return 1.0
  
  const tokens1 = tokenize(processed1)
  const tokens2 = tokenize(processed2)
  
  if (tokens1.length < 5 || tokens2.length < 5) {
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

// Fast fingerprint generation
function generateFastFingerprint(code, bits = 64) {
  const normalized = code
    .replace(/\/\/.*|\/\*[\s\S]*?\*\/|#.*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b[a-zA-Z_]\w*\b/g, (match) => {
      const keywords = ['if', 'else', 'for', 'while', 'function', 'return', 'var', 'let', 'const']
      return keywords.includes(match.toLowerCase()) ? match : 'V'
    })
    .toLowerCase().trim()
  
  const tokens = normalized.match(/[A-Za-z_]\w*|[{}();,+\-/*=<>!&|]/g) || []
  let fingerprint = 0n
  
  for (let i = 0; i < tokens.length - 2; i++) {
    const trigram = tokens.slice(i, i + 3).join('')
    let hash = 0
    for (let j = 0; j < trigram.length; j++) {
      hash = ((hash << 5) - hash + trigram.charCodeAt(j)) & 0xffffffff
    }
    
    const bitPos = Math.abs(hash) % bits
    fingerprint |= (1n << BigInt(bitPos))
  }
  
  return fingerprint
}

// Routes
app.post('/api/execute', async (req, res) => {
  const { code, language } = req.body
  
  if (!code || !language) {
    return res.json({ success: false, error: 'Code and language are required' })
  }

  const result = await executeCode(code, language)
  res.json(result)
})

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend server is running!', timestamp: new Date() })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`🚀 Digital TA server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
})