import React, { useEffect, useState, useRef } from 'react'

const BasicProctor = ({ isActive, onViolation }) => {
  const [status, setStatus] = useState('Starting...')
  const [violations, setViolations] = useState({ tabs: 0, copy: 0 })
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    if (!isActive) return

    let stream = null

    const startCamera = async () => {
      try {
        setStatus('Requesting camera...')
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setStatus('Camera active')
          setCameraActive(true)
        }
      } catch (error) {
        setStatus('Camera denied')
        setTimeout(() => onViolation?.('CAMERA_DENIED', 'Camera access required'), 0)
      }
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

    startCamera()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', (e) => e.preventDefault())

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop())
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', (e) => e.preventDefault())
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
          border: `3px solid ${cameraActive ? '#00ff00' : '#ff0000'}`,
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
        🛡️ Status: {status}<br/>
        Camera: {cameraActive ? '✅' : '❌'}<br/>
        Violations:<br/>
        • Tabs: {violations.tabs}/3<br/>
        • Copy: {violations.copy}/5
      </div>
    </>
  )
}

export default BasicProctor