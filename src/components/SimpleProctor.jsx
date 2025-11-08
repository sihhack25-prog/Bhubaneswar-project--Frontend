import React, { useEffect, useState, useRef } from 'react'

const SimpleProctor = ({ isActive, onViolation }) => {
  const [violations, setViolations] = useState({ tabs: 0, copy: 0, rightClick: 0, face: 0 })
  const [cameraActive, setCameraActive] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!isActive) return

    // Tab switching detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolations(prev => {
          const newViolations = { ...prev, tabs: prev.tabs + 1 }
          if (newViolations.tabs >= 3) {
            onViolation?.('TAB_SWITCH', 'Too many tab switches')
          }
          return newViolations
        })
      }
    }

    // Copy-paste prevention
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key)) {
        e.preventDefault()
        setViolations(prev => {
          const newViolations = { ...prev, copy: prev.copy + 1 }
          if (newViolations.copy >= 5) {
            onViolation?.('COPY_PASTE', 'Too many copy attempts')
          }
          return newViolations
        })
      }
      
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault()
      }
    }

    // Right-click prevention
    const handleContextMenu = (e) => {
      e.preventDefault()
      setViolations(prev => ({ ...prev, rightClick: prev.rightClick + 1 }))
    }

    // Start camera with face detection
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          setCameraActive(true)
          
          // Load face detection
          loadFaceDetection()
        }
      } catch (error) {
        console.warn('Camera access denied')
        onViolation?.('CAMERA_DENIED', 'Camera access required')
      }
    }

    // Simple face detection using canvas
    const loadFaceDetection = async () => {
      try {
        // Load face-api.js
        if (!window.faceapi) {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js'
          document.head.appendChild(script)
          await new Promise(resolve => script.onload = resolve)
          
          // Load models
          await faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models')
        }
        
        startFaceDetection()
      } catch (error) {
        console.warn('Face detection failed, using basic monitoring')
        setFaceDetected(true) // Assume face present if detection fails
      }
    }

    const startFaceDetection = () => {
      const detectFaces = async () => {
        if (!videoRef.current || !window.faceapi) return
        
        try {
          const detections = await faceapi.detectAllFaces(
            videoRef.current, 
            new faceapi.TinyFaceDetectorOptions()
          )
          
          const faceCount = detections.length
          
          if (faceCount === 0) {
            setFaceDetected(false)
            setViolations(prev => {
              const newViolations = { ...prev, face: prev.face + 1 }
              if (newViolations.face > 10) {
                onViolation?.('NO_FACE', 'No face detected for too long')
              }
              return newViolations
            })
          } else if (faceCount > 1) {
            onViolation?.('MULTIPLE_FACES', 'Multiple people detected')
          } else {
            setFaceDetected(true)
            setViolations(prev => ({ ...prev, face: 0 })) // Reset face violations
          }
        } catch (error) {
          console.warn('Face detection error:', error)
        }
        
        if (isActive) {
          setTimeout(detectFaces, 2000) // Check every 2 seconds
        }
      }
      
      setTimeout(detectFaces, 1000) // Start after 1 second
    }

    startCamera()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [isActive, onViolation])

  if (!isActive) return null

  return (
    <>
      {/* Camera feed */}
      <video 
        ref={videoRef}
        style={{ 
          position: 'fixed', 
          top: 10, 
          right: 10, 
          width: '200px', 
          height: '150px',
          border: `2px solid ${faceDetected ? '#00ff00' : '#ff0000'}`,
          borderRadius: '8px',
          zIndex: 9999
        }}
        muted
        playsInline
      />
      
      {/* Status overlay */}
      <div style={{ 
        position: 'fixed', 
        top: 170, 
        right: 10, 
        background: 'rgba(0,0,0,0.9)', 
        color: 'white', 
        padding: '8px', 
        borderRadius: '6px',
        fontSize: '11px',
        zIndex: 9999,
        minWidth: '200px'
      }}>
        🛡️ Proctor Active<br/>
        Camera: {cameraActive ? '✅' : '❌'}<br/>
        Face: {faceDetected ? '✅' : '❌'}<br/>
        Tabs: {violations.tabs}/3 | Copy: {violations.copy}/5
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  )
}

export default SimpleProctor