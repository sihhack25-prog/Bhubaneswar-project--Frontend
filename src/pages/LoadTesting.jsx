import { useState, useEffect } from 'react'
import { Play, Users, Server, Activity, AlertTriangle } from 'lucide-react'

const LoadTesting = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [metrics, setMetrics] = useState({
    activeUsers: 0,
    requestsPerSecond: 0,
    responseTime: 0,
    successRate: 100,
    serverLoad: 0
  })
  const [testConfig, setTestConfig] = useState({
    users: 100,
    duration: 60,
    scenario: 'submission'
  })
  const [backendStatus, setBackendStatus] = useState(null)

  useEffect(() => {
    checkBackendHealth()
  }, [])

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/health')
      const data = await response.json()
      setBackendStatus(data)
    } catch (error) {
      setBackendStatus({ server: 'offline', redis: 'unavailable' })
    }
  }

  const runLoadTest = async () => {
    setIsRunning(true)
    let successCount = 0
    let totalRequests = 0
    const responseTimes = []
    
    const startTime = Date.now()
    const testEndpoints = {
      submission: 'http://localhost:3001/api/assignments',
      exam: 'https://emkc.org/api/v2/piston/execute',
      grading: 'http://localhost:3001/api/assignments'
    }
    
    const interval = setInterval(async () => {
      const batchSize = Math.min(5, Math.ceil(testConfig.users / 10))
      const promises = []
      
      for (let i = 0; i < batchSize; i++) {
        const requestStart = Date.now()
        let promise
        
        if (testConfig.scenario === 'exam') {
          // Test Piston API for code execution load
          promise = fetch(testEndpoints[testConfig.scenario], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language: 'python',
              version: '*',
              files: [{ content: 'print("Load test")' }]
            })
          })
        } else {
          // Test backend API endpoints
          promise = fetch(testEndpoints[testConfig.scenario], {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          })
        }
        
        promise = promise.then(res => {
          const responseTime = Date.now() - requestStart
          responseTimes.push(responseTime)
          totalRequests++
          if (res.ok) successCount++
          return res
        }).catch(() => {
          const responseTime = Date.now() - requestStart
          responseTimes.push(responseTime)
          totalRequests++
        })
        
        promises.push(promise)
      }
      
      await Promise.allSettled(promises)
      
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0
      
      const elapsedSeconds = (Date.now() - startTime) / 1000
      
      setMetrics({
        activeUsers: Math.min(totalRequests, testConfig.users),
        requestsPerSecond: elapsedSeconds > 0 ? Math.round(totalRequests / elapsedSeconds) : 0,
        responseTime: Math.round(avgResponseTime),
        successRate: totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 100,
        serverLoad: Math.min(95, Math.round((totalRequests / testConfig.users) * 100))
      })
    }, 1000)

    setTimeout(() => {
      clearInterval(interval)
      setIsRunning(false)
    }, testConfig.duration * 1000)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>
         Load Testing Dashboard
      </h1>

      {/* Test Configuration */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Test Configuration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label>Concurrent Users</label>
            <input 
              type="number" 
              value={testConfig.users}
              onChange={(e) => setTestConfig({...testConfig, users: parseInt(e.target.value)})}
              className="form-input"
            />
          </div>
          <div>
            <label>Duration (seconds)</label>
            <input 
              type="number" 
              value={testConfig.duration}
              onChange={(e) => setTestConfig({...testConfig, duration: parseInt(e.target.value)})}
              className="form-input"
            />
          </div>
          <div>
            <label>Scenario</label>
            <select 
              value={testConfig.scenario}
              onChange={(e) => setTestConfig({...testConfig, scenario: e.target.value})}
              className="form-input"
            >
              <option value="submission">Mass Submission</option>
              <option value="exam">Exam Peak Hours</option>
              <option value="grading">Bulk Grading</option>
            </select>
          </div>
        </div>
        <button 
          onClick={runLoadTest}
          disabled={isRunning}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Play size={16} />
          {isRunning ? 'Running Test...' : 'Start Load Test'}
        </button>
      </div>

      {/* Real-time Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
        <div className="card">
          <h3>Performance Metrics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <Users size={24} style={{ color: '#667eea', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{Math.round(metrics.activeUsers)}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Active Users</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <Activity size={24} style={{ color: '#28a745', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{Math.round(metrics.requestsPerSecond)}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Requests/sec</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <Server size={24} style={{ color: '#ffc107', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{Math.round(metrics.responseTime)}ms</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Response Time</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <AlertTriangle size={24} style={{ color: metrics.successRate > 95 ? '#28a745' : '#dc3545', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{Math.round(metrics.successRate)}%</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Success Rate</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Server Status</h3>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>CPU Usage</span>
              <span>{Math.round(metrics.serverLoad)}%</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '20px', 
              background: '#e9ecef', 
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${metrics.serverLoad}%`, 
                height: '100%', 
                background: metrics.serverLoad > 70 ? '#dc3545' : '#28a745',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
          
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <h4>Backend Status</h4>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <strong>Server:</strong> <span style={{ color: backendStatus?.server === 'running' ? '#28a745' : '#dc3545' }}>
                {backendStatus?.server || 'Unknown'}
              </span>
            </div>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <strong>Redis:</strong> <span style={{ color: backendStatus?.redis === 'connected' ? '#28a745' : '#ffc107' }}>
                {backendStatus?.redis || 'Unknown'}
              </span>
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              <strong>Queue:</strong> <span style={{ color: backendStatus?.queues?.codeExecution === 'active' ? '#28a745' : '#ffc107' }}>
                {backendStatus?.queues?.codeExecution || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {isRunning && (
        <div className="card" style={{ marginTop: '2rem', background: '#d4edda', border: '1px solid #c3e6cb' }}>
          <h4 style={{ color: '#155724' }}>Load Test in Progress</h4>
          <p style={{ color: '#155724', margin: 0 }}>
            Simulating {testConfig.scenario} scenario with {testConfig.users} concurrent users...
          </p>
        </div>
      )}
    </div>
  )
}

export default LoadTesting