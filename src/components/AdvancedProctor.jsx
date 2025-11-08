import React, { useEffect, useState, useRef } from 'react'

const AdvancedProctor = ({ isActive, onViolation }) => {
  const [violations, setViolations] = useState({ 
    tabs: 0, copy: 0, face: 0, gaze: 0, phone: 0 
  })
  const [enrolled, setEnrolled] = useState(false)
  const [gazeState, setGazeState] = useState('Forward')
  const [gazeStartTime, setGazeStartTime] = useState(Date.now())
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const knownFaceRef = useRef(null)

  useEffect(() => {
    if (!isActive) return

    let stream = null
    let detectionInterval = null

    const startAdvancedProctoring = async () => {
      try {
        // Get camera stream
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          
          // Load MediaPipe and face-api
          await loadDetectionLibraries()
          startEnrollment()
        }
      } catch (error) {
        onViolation?.('CAMERA_DENIED', 'Camera access required')
      }
    }

    const loadDetectionLibraries = async () => {
      // Load face-api.js
      if (!window.faceapi) {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js'
        document.head.appendChild(script)
        await new Promise(resolve => script.onload = resolve)
        
        // Load models
        const modelUrl = 'https://justadudewhohacks.github.io/face-api.js/models'
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl)
        ])
      }
    }

    const startEnrollment = () => {
      let stableFrames = 0
      const enrollmentCheck = setInterval(async () => {
        if (!videoRef.current || enrolled) {
          clearInterval(enrollmentCheck)
          if (enrolled) startMonitoring()
          return
        }

        try {
          const detections = await faceapi.detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          ).withFaceLandmarks().withFaceDescriptors()

          if (detections.length === 1) {
            stableFrames++
            if (stableFrames >= 10) {
              knownFaceRef.current = detections[0].descriptor
              setEnrolled(true)
              clearInterval(enrollmentCheck)
              startMonitoring()
            }
          } else {
            stableFrames = 0
          }
        } catch (error) {
          console.warn('Enrollment error:', error)
        }
      }, 500)
    }

    const startMonitoring = () => {
      detectionInterval = setInterval(async () => {
        if (!videoRef.current || !enrolled) return

        try {
          await performFaceDetection()
          await performGazeDetection()
          await performPhoneDetection()
        } catch (error) {
          console.warn('Detection error:', error)
        }
      }, 2000) // Check every 2 seconds
    }

    const performFaceDetection = async () => {
      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceDescriptors()

      const faceCount = detections.length
      
      if (faceCount === 0) {
        setViolations(prev => {
          const newViolations = { ...prev, face: prev.face + 1 }
          if (newViolations.face > 5) {
            onViolation?.('NO_FACE', 'No face detected')
          }
          return newViolations
        })
      } else if (faceCount > 1) {
        onViolation?.('MULTIPLE_FACES', 'Multiple people detected')
      } else {
        // Check if it's the same person
        const distance = faceapi.euclideanDistance(
          knownFaceRef.current, 
          detections[0].descriptor
        )
        
        if (distance > 0.6) {
          onViolation?.('UNKNOWN_PERSON', 'Different person detected')
        } else {
          setViolations(prev => ({ ...prev, face: 0 }))
        }
      }
    }

    const performGazeDetection = async () => {
      try {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks()

        if (detections.length === 1) {
          const landmarks = detections[0].landmarks
          const gaze = calculateGazeDirection(landmarks)
          
          const now = Date.now()
          if (gaze !== gazeState) {
            setGazeState(gaze)
            setGazeStartTime(now)
          }
          
          // Check if looking away for too long
          const elapsed = (now - gazeStartTime) / 1000
          if (['Looking Left', 'Looking Right', 'Looking Up'].includes(gaze) && elapsed > 5) {
            setViolations(prev => {
              const newViolations = { ...prev, gaze: prev.gaze + 1 }
              if (newViolations.gaze > 3) {
                onViolation?.('GAZE_AWAY', `Looking away: ${gaze}`)
              }
              return newViolations
            })
          }
        }
      } catch (error) {
        console.warn('Gaze detection error:', error)
      }
    }

    const calculateGazeDirection = (landmarks) => {
      // Simple gaze estimation using nose and eye positions
      const nose = landmarks.getNose()[3] // Nose tip
      const leftEye = landmarks.getLeftEye()[0]
      const rightEye = landmarks.getRightEye()[3]
      
      const eyeCenter = {
        x: (leftEye.x + rightEye.x) / 2,
        y: (leftEye.y + rightEye.y) / 2
      }
      
      const deltaX = nose.x - eyeCenter.x
      const deltaY = nose.y - eyeCenter.y
      
      if (Math.abs(deltaX) > 15) {
        return deltaX > 0 ? 'Looking Right' : 'Looking Left'
      }
      if (deltaY < -10) {
        return 'Looking Up'
      }
      if (deltaY > 10) {
        return 'Looking Down'
      }
      
      return 'Forward'
    }

    const performPhoneDetection = async () => {
      // Simple object detection using canvas analysis
      if (!canvasRef.current || !videoRef.current) return
      
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      
      ctx.drawImage(videoRef.current, 0, 0)
      
      // Basic phone detection using color/shape analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const phoneDetected = analyzeForPhone(imageData)
      
      if (phoneDetected) {
        onViolation?.('PHONE_DETECTED', 'Mobile device detected')
      }
    }

    const analyzeForPhone = (imageData) => {
      // Simple heuristic: look for rectangular dark objects
      // This is a basic implementation - in production, use proper ML models
      const data = imageData.data
      let darkRectangles = 0
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const brightness = (r + g + b) / 3
        
        if (brightness < 50) { // Dark pixel
          darkRectangles++
        }
      }
      
      // If more than 20% of pixels are dark, might be a phone
      return (darkRectangles / (data.length / 4)) > 0.2
    }

    // Tab switching and copy-paste detection
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        setViolations(prev => {
          const newViolations = { ...prev, tabs: prev.tabs + 1 }
          if (newViolations.tabs >= 3) {
            onViolation?.('TAB_SWITCH', 'Multiple tab switches')
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
            onViolation?.('COPY_PASTE', 'Multiple copy attempts')
          }
          return newViolations
        })
      }
    }

    // Start everything
    startAdvancedProctoring()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop())
      if (detectionInterval) clearInterval(detectionInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, enrolled, gazeState, gazeStartTime, onViolation])

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
          border: `3px solid ${enrolled ? '#00ff00' : '#ffaa00'}`,
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
        fontSize: '12px',
        zIndex: 9999,
        minWidth: '200px'
      }}>
        🛡️ Advanced Proctor<br/>
        Status: {enrolled ? 'Enrolled ✅' : 'Enrolling...'}<br/>
        Gaze: {gazeState}<br/>
        Face: {violations.face}/5 | Gaze: {violations.gaze}/3<br/>
        Tabs: {violations.tabs}/3 | Copy: {violations.copy}/5
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  )
}

export default AdvancedProctor