// Optimized proctor.js for assignment typing
function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      res(); return
    }
    const s = document.createElement('script')
    s.src = src; s.async = true
    s.onload = res; s.onerror = rej
    document.head.appendChild(s)
    setTimeout(rej, 10000) // 10s timeout
  })
}

async function loadLibs() {
  try {
    // Load core libraries with timeout
    const loadPromises = []
    
    if (!window.tf) {
      loadPromises.push(loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js'))
    }
    
    if (!window.faceapi) {
      loadPromises.push(loadScript('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js'))
    }
    
    await Promise.all(loadPromises)
    
    // Load face-api models if available
    if (window.faceapi && window.faceapi.nets) {
      const FA_MODELS = 'https://justadudewhohacks.github.io/face-api.js/models'
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(FA_MODELS),
          faceapi.nets.faceLandmark68Net.loadFromUri(FA_MODELS),
          faceapi.nets.faceRecognitionNet.loadFromUri(FA_MODELS)
        ])
      } catch (modelError) {
        console.warn('Face-api models failed to load:', modelError)
      }
    }
  } catch (error) {
    console.warn('Failed to load libraries:', error)
  }
}

async function createProctor(videoEl, { onExit } = {}) {
  if (!videoEl) {
    console.error('Video element required')
    return { start: () => {}, stop: () => {} }
  }

  await loadLibs()

  let coco = null, faceOpts = null
  try {
    if (window.cocoSsd) coco = await cocoSsd.load()
    if (window.faceapi) faceOpts = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 })
  } catch (error) {
    console.warn('Model loading failed:', error)
  }

  let running = false, stream = null
  let enrolled = false, knownDescriptor = null, stableFaces = 0
  let violations = { face: 0, phone: 0, away: 0 }
  let frameCount = 0

  function stop(reason) {
    if (!running) return
    running = false
    try { 
      if (stream) stream.getTracks().forEach(t => t.stop()) 
    } catch (e) {
      console.warn('Stream stop error:', e)
    }
    if (onExit && typeof onExit === 'function') onExit(reason)
  }

  async function start() {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }
      
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, audio: false 
      })
      
      videoEl.srcObject = stream
      videoEl.muted = true
      videoEl.playsInline = true
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        videoEl.onloadedmetadata = resolve
        videoEl.onerror = reject
        setTimeout(reject, 5000)
      })
      
      await videoEl.play()
      running = true

      async function loop() {
        if (!running) return
        frameCount++

        try {
          if (!window.faceapi || !faceOpts || !window.faceapi.nets) {
            if (running) setTimeout(loop, 500)
            return
          }

          let dets = []
          try {
            dets = await faceapi.detectAllFaces(videoEl, faceOpts)
              .withFaceLandmarks().withFaceDescriptors()
          } catch (detectionError) {
            console.warn('Face detection error:', detectionError)
            if (running) setTimeout(loop, 500)
            return
          }

          // Enrollment
          if (!enrolled) {
            if (dets.length === 1) stableFaces++
            else stableFaces = 0
            
            if (stableFaces >= 5) {
              knownDescriptor = dets[0].descriptor
              enrolled = true
            }
            if (running) setTimeout(loop, 200)
            return
          }

          // Face verification
          const noFace = dets.length === 0
          const multiFace = dets.length > 1
          let knownPresent = false
          
          if (knownDescriptor) {
            for (const d of dets) {
              const dist = faceapi.euclideanDistance(knownDescriptor, d.descriptor)
              if (dist < 0.5) { knownPresent = true; break }
            }
          }

          if (noFace || multiFace || !knownPresent) {
            violations.face++
            if (violations.face > 5) {
              stop('Face verification failed')
              return
            }
          }

          // Phone detection (every 5 frames)
          if (coco && frameCount % 5 === 0) {
            try {
              const preds = await coco.detect(videoEl)
              for (const p of preds) {
                if (p.class === 'cell phone' && p.score > 0.4) {
                  stop('Mobile device detected')
                  return
                }
              }
            } catch (e) {
              console.warn('Phone detection error:', e)
            }
          }
        } catch (error) {
          console.warn('Loop error:', error)
        }

        if (running) setTimeout(loop, 300) // Slower for stability
      }

      loop()
    } catch (error) {
      console.error('Camera access failed:', error)
      stop('Camera access denied')
    }
  }

  return { start, stop }
}

// Ensure global availability
if (typeof window !== 'undefined') {
  window.createProctor = createProctor
}