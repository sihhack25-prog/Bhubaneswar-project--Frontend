import React, { useEffect, useState, useRef } from 'react'

const SimpleProctorFixed = ({ isActive, onViolation }) => {
  const [status, setStatus] = useState('Starting...')
  const [violations, setViolations] = useState({ face: 0, tabs: 0, copy: 0, gaze: 0, unknown: 0 })
  const [faceDetected, setFaceDetected] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const [gazeDirection, setGazeDirection] = useState('Forward')
  const [multiplePersons, setMultiplePersons] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const knownFaceRef = useRef(null)
  const stableFramesRef = useRef(0)

  useEffect(() => {
    if (!isActive) return

    let stream = null

    const startCamera = async () => {
      try {
        setStatus('Requesting camera...')
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setStatus('Loading face detection...')
          
          // Load MediaPipe Face Detection
          await loadFaceDetection()
        }
      } catch (error) {
        setStatus('Camera denied')
        setTimeout(() => onViolation?.('CAMERA_DENIED', 'Camera access required'), 0)
      }
    }

    const loadFaceDetection = async () => {
      try {
        // Load MediaPipe Face Detection
        if (!window.FaceDetection) {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/face_detection.js'
          document.head.appendChild(script)
          await new Promise(resolve => script.onload = resolve)
        }
        
        // Initialize face detection
        const faceDetection = new window.FaceDetection({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/${file}`
        })
        
        faceDetection.setOptions({
          model: 'short',
          minDetectionConfidence: 0.5
        })
        
        faceDetection.onResults(handleFaceResults)
        
        // Start detection loop
        startFaceDetection(faceDetection)
        
      } catch (error) {
        console.warn('MediaPipe failed, using basic detection')
        setStatus('Basic monitoring active')
        setFaceDetected(true)
        setEnrolled(true)
      }
    }

    const handleFaceResults = (results) => {
      const detections = results.detections || []
      const faceCount = detections.length
      
      if (!enrolled) {
        // Enrollment phase - need exactly 1 face for 10 frames
        if (faceCount === 1) {
          stableFramesRef.current++
          setStatus(`Enrolling... ${stableFramesRef.current}/10`)
          
          if (stableFramesRef.current >= 10) {
            // Store face landmarks for recognition
            knownFaceRef.current = detections[0]
            setEnrolled(true)
            setStatus('Enrolled - Monitoring active')
          }
        } else {
          stableFramesRef.current = 0
          setStatus('Enrollment: Face camera alone')
        }
        return
      }
      
      // Monitoring phase
      if (faceCount === 0) {
        setFaceDetected(false)
        setViolations(prev => {
          const newViolations = { ...prev, face: prev.face + 1 }
          if (newViolations.face > 10) {
            setTimeout(() => onViolation?.('NO_FACE', 'No face detected for too long'), 0)
          }
          return newViolations
        })
      } else if (faceCount > 1) {
        setMultiplePersons(true)
        setTimeout(() => onViolation?.('MULTIPLE_FACES', 'Multiple people detected'), 0)
      } else {
        setFaceDetected(true)
        setMultiplePersons(false)
        setViolations(prev => ({ ...prev, face: 0 })) // Reset face violations
        
        // Check gaze direction using face landmarks
        checkGazeDirection(detections[0])
      }
    }
    
    const checkGazeDirection = (detection) => {
      // Simple gaze estimation using face bounding box position
      const bbox = detection.boundingBox
      const centerX = bbox.xCenter
      const centerY = bbox.yCenter
      
      let direction = 'Forward'
      
      // Estimate gaze based on face position (simplified)
      if (centerX < 0.3) {
        direction = 'Looking Right' // Face moved left, looking right
      } else if (centerX > 0.7) {
        direction = 'Looking Left' // Face moved right, looking left  
      } else if (centerY < 0.3) {
        direction = 'Looking Up'
      }
      
      setGazeDirection(direction)
      
      // Count gaze violations
      if (['Looking Left', 'Looking Right', 'Looking Up'].includes(direction)) {
        setViolations(prev => {
          const newViolations = { ...prev, gaze: prev.gaze + 1 }
          if (newViolations.gaze > 15) {
            setTimeout(() => onViolation?.('GAZE_AWAY', `Looking away: ${direction}`), 0)
          }
          return newViolations
        })
      }
    }
    
    const startFaceDetection = (faceDetection) => {
      const detect = async () => {
        if (!videoRef.current || !isActive) return
        
        try {
          await faceDetection.send({ image: videoRef.current })
        } catch (error) {
          console.warn('Detection error:', error)
        }
        
        if (isActive) {
          setTimeout(detect, 200) // 5 FPS for performance
        }
      }
      
      detect()
    }

    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        setViolations(prev => {
          const newViolations = { ...prev, tabs: prev.tabs + 1 }
          if (newViolations.tabs >= 3) {
            setTimeout(() => onViolation?.('TAB_SWITCH', 'Multiple tab switches'), 0)
          }
          return newViolations
        })
      }
    }

    const handleKeyDown = (e) => {
      if (!isActive) return
      
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key)) {
        e.preventDefault()
        setViolations(prev => {
          const newViolations = { ...prev, copy: prev.copy + 1 }
          if (newViolations.copy >= 5) {
            setTimeout(() => onViolation?.('COPY_PASTE', 'Multiple copy attempts'), 0)
          }
          return newViolations
        })
      }
      
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault()
      }
    }

    const handleContextMenu = (e) => {
      if (isActive) e.preventDefault()
    }

    startCamera()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop())
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [isActive, onViolation])

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
          border: `3px solid ${faceDetected ? '#00ff00' : '#ff0000'}`,
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
        🛡️ Status: {status}<br/>
        Enrolled: {enrolled ? '✅' : '❌'}<br/>
        Face: {faceDetected ? '✅' : '❌'}<br/>
        {multiplePersons && <span style={{color: '#ff6b6b'}}>⚠️ Multiple people!</span>}<br/>
        Gaze: {gazeDirection}<br/>
        Violations:<br/>
        • Face: {violations.face}/10<br/>
        • Gaze: {violations.gaze}/15<br/>
        • Tabs: {violations.tabs}/3<br/>
        • Copy: {violations.copy}/5
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  )
}

export default SimpleProctorFixed