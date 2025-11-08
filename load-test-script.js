// Load Testing Script for Digital TA Platform
// Run with: node load-test-script.js

const https = require('https')
const http = require('http')

class LoadTester {
  constructor(config) {
    this.config = {
      baseUrl: 'http://localhost:3002',
      users: 100,
      duration: 60,
      rampUp: 10,
      ...config
    }
    this.metrics = {
      requests: 0,
      responses: 0,
      errors: 0,
      responseTimes: [],
      startTime: null
    }
  }

  async simulateUser(userId) {
    const scenarios = [
      () => this.submitCode(userId),
      () => this.runCode(userId),
      () => this.getAssignments(userId),
      () => this.testCode(userId)
    ]

    while (this.isRunning) {
      try {
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
        await scenario()
        await this.delay(Math.random() * 2000 + 500) // 0.5-2.5s between requests
      } catch (error) {
        this.metrics.errors++
      }
    }
  }

  async submitCode(userId) {
    const code = `function twoSum(nums, target) {
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          if (nums[i] + nums[j] === target) {
            return [i, j];
          }
        }
      }
      return [];
    }`

    return this.makeRequest('/api/submit', 'POST', {
      assignmentId: '1',
      code,
      language: 'javascript',
      timeTaken: Math.floor(Math.random() * 300) + 60
    })
  }

  async runCode(userId) {
    return this.makeRequest('/api/execute', 'POST', {
      code: 'console.log("Hello World");',
      language: 'javascript'
    })
  }

  async getAssignments(userId) {
    return this.makeRequest('/api/assignments', 'GET')
  }

  async testCode(userId) {
    return this.makeRequest('/api/test', 'POST', {
      assignmentId: '1',
      code: 'function test() { return true; }',
      language: 'javascript'
    })
  }

  async makeRequest(path, method, data = null) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      const options = {
        hostname: 'localhost',
        port: 3002,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        }
      }

      const req = http.request(options, (res) => {
        let body = ''
        res.on('data', chunk => body += chunk)
        res.on('end', () => {
          const responseTime = Date.now() - startTime
          this.metrics.responses++
          this.metrics.responseTimes.push(responseTime)
          resolve({ status: res.statusCode, body })
        })
      })

      req.on('error', (error) => {
        this.metrics.errors++
        reject(error)
      })

      if (data) {
        req.write(JSON.stringify(data))
      }
      req.end()
      this.metrics.requests++
    })
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async start() {
    console.log(`🚀 Starting load test with ${this.config.users} users for ${this.config.duration}s`)
    
    this.isRunning = true
    this.metrics.startTime = Date.now()

    // Ramp up users gradually
    const userPromises = []
    for (let i = 0; i < this.config.users; i++) {
      setTimeout(() => {
        if (this.isRunning) {
          userPromises.push(this.simulateUser(i))
        }
      }, (i / this.config.users) * this.config.rampUp * 1000)
    }

    // Stop test after duration
    setTimeout(() => {
      this.isRunning = false
      this.printResults()
    }, this.config.duration * 1000)

    // Print metrics every 5 seconds
    const metricsInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(metricsInterval)
        return
      }
      this.printLiveMetrics()
    }, 5000)

    await Promise.all(userPromises)
  }

  printLiveMetrics() {
    const elapsed = (Date.now() - this.metrics.startTime) / 1000
    const rps = Math.round(this.metrics.responses / elapsed)
    const avgResponseTime = this.metrics.responseTimes.length > 0 
      ? Math.round(this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length)
      : 0
    const errorRate = Math.round((this.metrics.errors / this.metrics.requests) * 100) || 0

    console.log(`📊 [${Math.round(elapsed)}s] RPS: ${rps} | Avg Response: ${avgResponseTime}ms | Errors: ${errorRate}%`)
  }

  printResults() {
    const elapsed = (Date.now() - this.metrics.startTime) / 1000
    const rps = Math.round(this.metrics.responses / elapsed)
    const avgResponseTime = this.metrics.responseTimes.length > 0 
      ? Math.round(this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length)
      : 0
    const errorRate = Math.round((this.metrics.errors / this.metrics.requests) * 100) || 0

    console.log('\n🎯 Load Test Results:')
    console.log(`Duration: ${elapsed}s`)
    console.log(`Total Requests: ${this.metrics.requests}`)
    console.log(`Successful Responses: ${this.metrics.responses}`)
    console.log(`Errors: ${this.metrics.errors}`)
    console.log(`Requests/Second: ${rps}`)
    console.log(`Average Response Time: ${avgResponseTime}ms`)
    console.log(`Error Rate: ${errorRate}%`)
    console.log(`Success Rate: ${100 - errorRate}%`)
  }
}

// Run the load test
const tester = new LoadTester({
  users: process.argv[2] || 50,
  duration: process.argv[3] || 30,
  rampUp: 5
})

tester.start().catch(console.error)