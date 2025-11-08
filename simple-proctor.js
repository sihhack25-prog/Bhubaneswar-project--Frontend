const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

// Simple proctor mock server
let sessions = {}

app.post('/api/proctor/start', (req, res) => {
  const { sessionId = 'default' } = req.body
  
  sessions[sessionId] = {
    enrolled: false,
    violations: { face: 0, gaze: 0, multi_person: 0, unknown_person: 0 },
    status: 'Starting...'
  }
  
  res.json({
    success: true,
    sessionId,
    message: 'Proctor session started'
  })
})

app.post('/api/proctor/analyze', (req, res) => {
  const { sessionId = 'default' } = req.body
  
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      enrolled: false,
      violations: { face: 0, gaze: 0, multi_person: 0, unknown_person: 0 },
      status: 'Starting...'
    }
  }
  
  const session = sessions[sessionId]
  
  // Simulate enrollment after a few calls
  if (!session.enrolled) {
    session.enrolled = Math.random() > 0.3
    session.status = session.enrolled ? 'Enrolled successfully' : 'Enrolling...'
  } else {
    session.status = 'Monitoring active'
  }
  
  res.json({
    success: true,
    analysis: {
      enrolled: session.enrolled,
      faceDetected: true,
      gazeDirection: 'Forward',
      violations: session.violations,
      multiplePersons: false,
      status: session.status
    }
  })
})

app.get('/api/proctor/status/:sessionId', (req, res) => {
  const { sessionId } = req.params
  const session = sessions[sessionId] || {
    enrolled: false,
    violations: { face: 0, gaze: 0, multi_person: 0, unknown_person: 0 },
    status: 'Not started'
  }
  
  res.json({
    success: true,
    status: {
      enrolled: session.enrolled,
      violations: session.violations,
      currentGaze: 'Forward'
    }
  })
})

app.post('/api/proctor/stop/:sessionId', (req, res) => {
  const { sessionId } = req.params
  delete sessions[sessionId]
  
  res.json({
    success: true,
    message: 'Proctor session stopped'
  })
})

const PORT = 5000
app.listen(PORT, () => {
  console.log(`🔍 Simple Proctor Server running on http://localhost:${PORT}`)
})