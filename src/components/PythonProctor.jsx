import React, { useEffect, useState, useRef } from 'react'

const PythonProctor = ({ isActive, onViolation }) => {
  const [status, setStatus] = useState('Starting...')
  const [analysis, setAnalysis] = useState({
    enrolled: false,
    faceDetected: false,
    gazeDirection: 'Forward',
    violations: { face: 0, gaze: 0, multi_person: 0, unknown_person: 0 },
    multiplePersons: false,
    status: 'Initializing...'
  })
  const [sessionId] = useState(`session_${Date.now()}`)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!isActive) {
      stopProctoring()
      return
    }

    startProctoring()
    return () => stopProctoring()
  }, [isActive])

  const startProctoring = async () => {
    try {
      // Start Python server session
      const response = await fetch('http://localhost:5000/api/proctor/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      if (!response.ok) {
        throw new Error('Python server not available')
      }

      // Start camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setStatus('Camera active - Python analysis')
        
        // Start frame analysis
        startFrameAnalysis()
      }
    } catch (error) {
      setStatus('Error: ' + error.message)
      setTimeout(() => onViolation?.('PYTHON_SERVER_ERROR', error.message), 0)
    }
  }

  const startFrameAnalysis = () => {
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return

      try {
        // Capture frame from video
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        
        ctx.drawImage(videoRef.current, 0, 0)
        
        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        
        // Send to Python server for analysis
        const response = await fetch('http://localhost:5000/api/proctor/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            imageData
          })
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setAnalysis(result.analysis)
            setStatus(result.analysis.status)
            
            // Check for violations
            checkViolations(result.analysis)
          }
        }
      } catch (error) {
        console.warn('Frame analysis error:', error)
      }
    }, 1000) // Analyze every 1 second
  }

  const checkViolations = (analysisData) => {
    const { violations, multiplePersons, gazeDirection } = analysisData
    
    // Face violations
    if (violations.face > 10) {
      setTimeout(() => onViolation?.('NO_FACE', 'No face detected for too long'), 0)
    }
    
    // Multiple persons
    if (multiplePersons) {
      setTimeout(() => onViolation?.('MULTIPLE_FACES', 'Multiple people detected'), 0)
    }
    
    // Gaze violations
    if (violations.gaze > 15) {
      setTimeout(() => onViolation?.('GAZE_AWAY', `Looking away: ${gazeDirection}`), 0)
    }
    
    // Unknown person
    if (violations.unknown_person > 5) {
      setTimeout(() => onViolation?.('UNKNOWN_PERSON', 'Unknown person detected'), 0)
    }
  }

  const stopProctoring = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Stop camera
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
    }

    // Stop Python session
    try {
      await fetch(`http://localhost:5000/api/proctor/stop/${sessionId}`, {
        method: 'POST'
      })
    } catch (error) {
      console.warn('Error stopping Python session:', error)
    }
  }

  if (!isActive) return null

  return (
    <>
      <video 
        ref={videoRef}
        style={{ 
          position: 'fixed', 
          top: 10, 
          right: 10, 
          width: '200px', 
          height: '150px',
          border: `3px solid ${analysis.faceDetected ? '#00ff00' : '#ff0000'}`,
          borderRadius: '8px',
          zIndex: 9999
        }}
        muted
        playsInline
      />
      
      <div style={{ 
        position: 'fixed', 
        top: 170, 
        right: 10, 
        background: 'rgba(0,0,0,0.9)', 
        color: 'white', 
        padding: '10px', 
        borderRadius: '8px',
        fontSize: '11px',
        zIndex: 9999,
        minWidth: '200px'
      }}>
        🐍 Python Proctor<br/>
        Status: {status}<br/>
        Enrolled: {analysis.enrolled ? '✅' : '❌'}<br/>
        Face: {analysis.faceDetected ? '✅' : '❌'}<br/>
        {analysis.multiplePersons && <span style={{color: '#ff6b6b'}}>⚠️ Multiple people!</span>}<br/>
        Gaze: {analysis.gazeDirection}<br/>
        Violations:<br/>
        • Face: {analysis.violations.face}/10<br/>
        • Gaze: {analysis.violations.gaze}/15<br/>
        • Multi: {analysis.violations.multi_person}<br/>
        • Unknown: {analysis.violations.unknown_person}/5
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  )
}

export default PythonProctor