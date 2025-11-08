// Simple Node.js backend for code execution
// Run with: node backend-example.js

const express = require('express')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

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
  console.log(`Code execution server running on http://localhost:${PORT}`)
})

// Package.json for backend:
/*
{
  "name": "code-executor",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
*/