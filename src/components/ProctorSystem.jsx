import React, { useEffect, useRef, useState } from 'react'

const ProctorSystem = ({ onViolation, isActive = false }) => {
  const videoRef = useRef(null)
  const [proctorInstance, setProctorInstance] = useState(null)
  const [violations, setViolations] = useState({
    tabSwitch: 0,
    fullscreenExit: 0,
    copyPaste: 0,
    rightClick: 0
  })

  useEffect(() => {
    if (!isActive) {
      // Cleanup when inactive
      if (proctorInstance?.stop) {
        proctorInstance.stop()
        setProctorInstance(null)
      }
      return
    }

    let proctor = null

    const initProctor = async () => {
      try {
        // Load proctor script
        if (!window.createProctor) {
          const script = document.createElement('script')
          script.src = '/proctor.js'
          document.head.appendChild(script)
          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
            setTimeout(reject, 5000)
          })
        }

        // Initialize proctoring (don't auto-start)
        if (window.createProctor && videoRef.current) {
          proctor = await window.createProctor(videoRef.current, {
            onExit: (reason) => {
              onViolation?.('CAMERA_VIOLATION', reason)
            }
          })
          setProctorInstance(proctor)
        }
      } catch (error) {
        console.warn('Proctor initialization failed:', error)
      }
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isActive) {
        setViolations(prev => {
          const newViolations = { ...prev, fullscreenExit: prev.fullscreenExit + 1 }
          if (newViolations.fullscreenExit >= 2) {
            onViolation?.('FULLSCREEN_EXIT', 'Multiple fullscreen exits detected')
          }
          return newViolations
        })
      }
    }

    // Tab switching detection
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        setViolations(prev => {
          const newViolations = { ...prev, tabSwitch: prev.tabSwitch + 1 }
          if (newViolations.tabSwitch >= 3) {
            onViolation?.('TAB_SWITCH', 'Multiple tab switches detected')
          }
          return newViolations
        })
      }
    }

    // Copy-paste prevention
    const handleKeyDown = (e) => {
      if (!isActive) return
      
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key)) {
        e.preventDefault()
        setViolations(prev => {
          const newViolations = { ...prev, copyPaste: prev.copyPaste + 1 }
          if (newViolations.copyPaste >= 5) {
            onViolation?.('COPY_PASTE', 'Multiple copy/paste attempts')
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
      if (isActive) {
        e.preventDefault()
        setViolations(prev => ({ ...prev, rightClick: prev.rightClick + 1 }))
      }
    }

    // Initialize proctor only
    initProctor()

    // Event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      if (proctor?.stop) {
        proctor.stop()
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [isActive, onViolation])

  // Remove auto-start - only start on user click

  if (!isActive) return null

  return (
    <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 9999 }}>
      <video 
        ref={videoRef} 
        width="200" 
        height="150" 
        style={{ border: '2px solid #00ff00', borderRadius: '8px' }}
        muted
        playsInline
        autoPlay={false}
      />
      <div style={{ 
        background: 'rgba(0,0,0,0.8)', 
        color: 'white', 
        padding: '5px', 
        fontSize: '12px',
        borderRadius: '4px',
        marginTop: '5px'
      }}>
        Tabs: {violations.tabSwitch}/3 | Copy: {violations.copyPaste}/5
      </div>
    </div>
  )
}

export default ProctorSystem