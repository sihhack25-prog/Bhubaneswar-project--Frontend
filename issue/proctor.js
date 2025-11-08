// proctor.js

// ---------- tiny loader helpers ----------
function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function loadLibs() {
  // tfjs, coco-ssd, face-api, mediapipe face_mesh, opencv
  if (!window.tf) await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js');
  if (!window.cocoSsd) await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2');
  if (!window.faceapi) await loadScript('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js');
  if (!window.FaceMesh) await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js');
  if (!window.cv) await loadScript('https://docs.opencv.org/4.x/opencv.js');

  // face-api model weights
  const FA_MODELS = 'https://justadudewhohacks.github.io/face-api.js/models';
  await faceapi.nets.tinyFaceDetector.loadFromUri(FA_MODELS);
  await faceapi.nets.faceLandmark68Net.loadFromUri(FA_MODELS);
  await faceapi.nets.faceRecognitionNet.loadFromUri(FA_MODELS);
}

// ---------- math / utils ----------
function ema(prev, x, a) { return prev == null ? x : (1 - a) * prev + a * x; }
function headPoseFromLandmarks(cvPts2D, W, H) {
  // 3D model points (approx) and 2D image points (x,y pairs)
  const obj = cv.matFromArray(6, 3, cv.CV_64F, [
    0,0,0,
    0,-63,-12,
    -43,32,-30,
    43,32,-30,
    -28,-28,-24,
    28,-28,-24,
  ]);
  const img = cv.matFromArray(6, 2, cv.CV_64F, cvPts2D);
  const cam = cv.matFromArray(3,3,cv.CV_64F, [W,0,W/2, 0,W,H/2, 0,0,1]);
  const dist = cv.Mat.zeros(4,1,cv.CV_64F);
  const rvec = new cv.Mat(), tvec = new cv.Mat();
  const ok = cv.solvePnP(obj, img, cam, dist, rvec, tvec, false, cv.SOLVEPNP_ITERATIVE);
  let pitch=0, yaw=0, roll=0;
  if (ok) {
    const rmat = new cv.Mat();
    cv.Rodrigues(rvec, rmat);
    const m = rmat.data64F;
    yaw   = Math.asin(Math.min(1, Math.max(-1, m[2])))*180/Math.PI;
    pitch = Math.atan2(-m[5], m[8])*180/Math.PI;
    roll  = Math.atan2(-m[1], m[0])*180/Math.PI;
    rmat.delete();
  }
  obj.delete(); img.delete(); cam.delete(); dist.delete(); rvec.delete(); tvec.delete();
  return {pitch, yaw, roll};
}

function irisMetrics(lms, W, H, side='right') {
  const xy = (i) => [lms[i].x * W, lms[i].y * H];
  let i_l, i_r, i_up, i_dn, iris_ids;
  if (side === 'right') {
    i_l=33; i_r=133; i_up=159; i_dn=145; iris_ids=[474,475,476,477];
  } else {
    i_l=362; i_r=263; i_up=386; i_dn=374; iris_ids=[469,470,471,472];
  }
  const L = xy(i_l), R = xy(i_r), U = xy(i_up), D = xy(i_dn);
  const iris = iris_ids.map(xy).reduce((a,b)=>[a[0]+b[0],a[1]+b[1]],[0,0]).map(v=>v/iris_ids.length);
  const eye_w = Math.max(1, Math.hypot(R[0]-L[0], R[1]-L[1]));
  const eye_h = Math.max(1, Math.hypot(D[0]-U[0], D[1]-U[1]));
  let gH = (iris[0]-L[0])/eye_w;    // 0..1 (left..right)
  let gV = (iris[1]-U[1])/eye_h;    // 0..1 (up..down)
  const EAR = eye_h / eye_w;
  gH = Math.min(1, Math.max(0, gH));
  gV = Math.min(1, Math.max(0, gV));
  return {gH, gV, EAR};
}

function updateEyeState(prev, gH, gV, H_ON, H_OFF, GAZE_V_UP_TH) {
  const left_on  = gH < (0.5 - H_ON);
  const left_off = gH > (0.5 - H_OFF);
  const right_on = gH > (0.5 + H_ON);
  const right_off= gH < (0.5 + H_OFF);
  const up_on    = gV < GAZE_V_UP_TH;
  let state = prev;
  if (prev === 'Up') {
    if (!up_on) state = 'Center';
  } else if (prev === 'Left') {
    if (left_off) state = 'Center';
    if (up_on) state = 'Up';
  } else if (prev === 'Right') {
    if (right_off) state = 'Center';
    if (up_on) state = 'Up';
  } else {
    if (up_on) state = 'Up';
    else if (left_on) state = 'Left';
    else if (right_on) state = 'Right';
  }
  return state;
}

// ---------- exported factory ----------
async function createProctor(videoEl, { onExit } = {}) {
  await loadLibs();

  // ---------- constants (match your Python thresholds) ----------
  const PHONE_LABEL = 'cell phone';
  const DETECT_EVERY_N_FRAMES = 3;
  const YOLO_CONF = 0.4;

  const YAW_THRESH = 10;
  const PITCH_UP = 10;
  const PITCH_DOWN = -10;
  const AFK_SECONDS = 5.0;

  const EAR_BLINK_TH = 0.17;
  const DWELL_IRIS_MS = 1500;
  const H_ON = 0.019, H_OFF = 0.024;
  const GAZE_V_UP_TH = 0.42;
  const EMA_ALPHA_GAZE = 0.40;
  const IRIS_LIMIT = 15;

  const STABLE_N = 10; // enrollment

  // ---------- models ----------
  const coco = await cocoSsd.load();

  const faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`
  });
  faceMesh.setOptions({
    maxNumFaces: 1, refineLandmarks: true,
    minDetectionConfidence: 0.5, minTrackingConfidence: 0.5
  });

  // face-api enrollment/verification
  const faceOpts = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });

  // ---------- state ----------
  let running = false;
  let stream = null;

  // enrollment
  let enrolled = false;
  let knownDescriptor = null;
  let stableSingleFaceFrames = 0;

  // face violations
  let faceViolationCount = 0;
  let faceViolationActive = false;

  // head gaze counts
  let currentGazeState = 'Forward';
  let stateStartAt = performance.now();
  const gazeCounts = { 'Looking Left': 0, 'Looking Right': 0, 'Looking Up': 0 };
  const gazeEpisodeActive = { 'Looking Left': false, 'Looking Right': false, 'Looking Up': false };

  // iris
  let gH_s = null, gV_s = null;
  let eyeState = 'Center';
  let lastIrisState = 'OK';
  let irisStateStart = performance.now();
  let irisEpisodeActive = false;
  let irisFaults = 0;

  // phone
  let frameIdx = 0;

  // ---------- internals ----------
  function stop(reason) {
    if (!running) return;
    running = false;
    try { if (stream) stream.getTracks().forEach(t => t.stop()); } catch {}
    if (onExit) onExit(reason || 'Stopped');
  }

  async function start() {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
    videoEl.srcObject = stream;
    await videoEl.play();

    running = true;

    async function loop() {
      if (!running) return;

      // --- Enrollment: capture stable single face and save descriptor
      const dets = await faceapi.detectAllFaces(videoEl, faceOpts).withFaceLandmarks().withFaceDescriptors();

      if (!enrolled) {
        if (dets.length === 1) stableSingleFaceFrames++;
        else stableSingleFaceFrames = 0;

        if (stableSingleFaceFrames >= STABLE_N) {
          knownDescriptor = dets[0].descriptor;
          enrolled = true;
        }
        if (running) requestAnimationFrame(loop);
        return;
      }

      // --- Face verification / counting
      let no_face = dets.length === 0;
      let multi_human = dets.length > 1;
      let any_match = false;
      for (const d of dets) {
        const dist = faceapi.euclideanDistance(knownDescriptor, d.descriptor);
        if (dist < 0.45) { any_match = true; break; }
      }
      const unknown_present = dets.length >= 1 && !any_match;

      const face_violation_now = (no_face || multi_human || unknown_present);
      if (face_violation_now && !faceViolationActive) {
        faceViolationCount++; faceViolationActive = true;
      }
      if (!face_violation_now && faceViolationActive) faceViolationActive = false;

      if (faceViolationCount > 3) {
        stop("AFK detected with face proctoring — test finished");
        return;
      }

      // --- Phone detection (every N frames)
      frameIdx++;
      if (frameIdx % DETECT_EVERY_N_FRAMES === 0) {
        const preds = await coco.detect(videoEl);
        for (const p of preds) {
          if (p.class === PHONE_LABEL && p.score >= YOLO_CONF) {
            stop("AFK use of mobile — test finished");
            return;
          }
        }
      }

      // --- MediaPipe FaceMesh for head pose + iris
      await new Promise(resolve => {
        faceMesh.onResults((res) => {
          const W = videoEl.videoWidth, H = videoEl.videoHeight;
          // ----- Head pose -----
          let text = "No face", havePose = false;
          if (res.multiFaceLandmarks && res.multiFaceLandmarks.length) {
            const lm = res.multiFaceLandmarks[0];
            const idxs = [1,199,33,263,61,291];
            const pts2 = [];
            for (const i of idxs) {
              const p = lm[i];
              pts2.push(p.x*W, p.y*H);
            }
            if (window.cv && cv.Mat) {
              const {pitch, yaw} = headPoseFromLandmarks(pts2, W, H);
              if (yaw < -YAW_THRESH) text = "Looking Left";
              else if (yaw > YAW_THRESH) text = "Looking Right";
              else if (pitch > PITCH_UP) text = "Looking Up";
              else if (pitch < PITCH_DOWN) text = "Looking Down";
              else text = "Forward";
              havePose = true;
            }
          }

          const now = performance.now();
          const disallowed = (text === "Looking Left" || text === "Looking Right" || text === "Looking Up");

          if (havePose && text !== currentGazeState) {
            currentGazeState = text;
            stateStartAt = now;
            for (const k of Object.keys(gazeEpisodeActive)) if (k !== text) gazeEpisodeActive[k] = false;
          }
          const elapsed = (now - stateStartAt) / 1000.0;
          if (disallowed && elapsed >= AFK_SECONDS) {
            if (!gazeEpisodeActive[currentGazeState]) {
              gazeCounts[currentGazeState] += 1;
              gazeEpisodeActive[currentGazeState] = true;
            }
          }

          const gazeTotal = gazeCounts["Looking Left"] + gazeCounts["Looking Right"] + gazeCounts["Looking Up"];
          if (gazeCounts["Looking Left"] > 5 || gazeCounts["Looking Right"] > 5 || gazeCounts["Looking Up"] > 5 || gazeTotal > 8) {
            stop("AFK detected with away looking — test finished");
            resolve();
            return;
          }

          // ----- Iris faults (Left/Right/Up combined), dwell 1.5s -----
          if (res.multiFaceLandmarks && res.multiFaceLandmarks.length) {
            const lm = res.multiFaceLandmarks[0];
            const R = irisMetrics(lm, W, H, 'right');
            const L = irisMetrics(lm, W, H, 'left');
            const EAR = (R.EAR + L.EAR)/2;

            if (EAR >= EAR_BLINK_TH) {
              const gH = (R.gH + L.gH)/2;
              const gV = (R.gV + L.gV)/2;
              gH_s = ema(gH_s, gH, EMA_ALPHA_GAZE);
              gV_s = ema(gV_s, gV, EMA_ALPHA_GAZE);

              const newState = updateEyeState(eyeState, gH_s, gV_s, H_ON, H_OFF, GAZE_V_UP_TH);
              const irisFlag = (newState === 'Left' || newState === 'Right' || newState === 'Up');

              const now2 = performance.now();
              const irisState = irisFlag ? 'AFK_IRIS' : 'OK';
              if (irisState !== lastIrisState) {
                lastIrisState = irisState;
                irisStateStart = now2;
                irisEpisodeActive = false;
              }
              const irisElapsed = now2 - irisStateStart;
              if (irisState === 'AFK_IRIS' && irisElapsed >= DWELL_IRIS_MS && !irisEpisodeActive) {
                irisFaults += 1;
                irisEpisodeActive = true;
              }
              eyeState = newState;

              if (irisFaults > IRIS_LIMIT) {
                stop("AFK detected (iris) — test finished");
                resolve();
                return;
              }
            }
          }

          resolve();
        });
        faceMesh.send({ image: videoEl });
      });

      if (running) requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }

  // expose a tiny controller
  return {
    start,
    stop
  };
}

// expose globally
window.createProctor = createProctor;
