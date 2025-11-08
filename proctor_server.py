from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import mediapipe as mp
import numpy as np
import time
import json
import base64
from datetime import datetime
import threading
import queue

app = Flask(__name__)
CORS(app)

# Global variables
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Proctoring state
proctor_sessions = {}

class ProctorSession:
    def __init__(self, session_id):
        self.session_id = session_id
        self.enrolled = False
        self.known_encoding = None
        self.stable_frames = 0
        self.violations = {
            'face': 0,
            'gaze': 0,
            'multi_person': 0,
            'unknown_person': 0
        }
        self.current_gaze = 'Forward'
        self.gaze_start_time = time.time()
        
    def classify_direction(self, x_deg, y_deg):
        YAW_THRESH = 15
        PITCH_UP = 15
        PITCH_DOWN = -15
        
        if y_deg < -YAW_THRESH:
            return "Looking Left"
        elif y_deg > YAW_THRESH:
            return "Looking Right"
        elif x_deg > PITCH_UP:
            return "Looking Up"
        elif x_deg < PITCH_DOWN:
            return "Looking Down"
        else:
            return "Forward"

@app.route('/api/proctor/start', methods=['POST'])
def start_proctor():
    data = request.json
    session_id = data.get('sessionId', 'default')
    
    proctor_sessions[session_id] = ProctorSession(session_id)
    
    return jsonify({
        'success': True,
        'sessionId': session_id,
        'message': 'Proctor session started'
    })

@app.route('/api/proctor/analyze', methods=['POST'])
def analyze_frame():
    try:
        data = request.json
        session_id = data.get('sessionId', 'default')
        image_data = data.get('imageData')
        
        if session_id not in proctor_sessions:
            return jsonify({'success': False, 'error': 'Session not found'})
        
        session = proctor_sessions[session_id]
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({'success': False, 'error': 'Invalid image'})
        
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)
        
        analysis_result = {
            'enrolled': session.enrolled,
            'faceDetected': False,
            'gazeDirection': 'Forward',
            'violations': session.violations,
            'multiplePersons': False,
            'status': 'No face detected'
        }
        
        if results.multi_face_landmarks:
            face_count = len(results.multi_face_landmarks)
            
            if face_count > 1:
                analysis_result['multiplePersons'] = True
                session.violations['multi_person'] += 1
                analysis_result['status'] = 'Multiple people detected'
            elif face_count == 1:
                analysis_result['faceDetected'] = True
                
                if not session.enrolled:
                    # Enrollment phase
                    session.stable_frames += 1
                    if session.stable_frames >= 10:
                        session.enrolled = True
                        analysis_result['enrolled'] = True
                        analysis_result['status'] = 'Enrolled successfully'
                    else:
                        analysis_result['status'] = f'Enrolling... {session.stable_frames}/10'
                else:
                    # Monitoring phase
                    landmarks = results.multi_face_landmarks[0]
                    
                    # Head pose estimation
                    gaze_direction = estimate_gaze(landmarks, frame.shape)
                    analysis_result['gazeDirection'] = gaze_direction
                    
                    # Check gaze violations
                    now = time.time()
                    if gaze_direction != session.current_gaze:
                        session.current_gaze = gaze_direction
                        session.gaze_start_time = now
                    
                    elapsed = now - session.gaze_start_time
                    if gaze_direction in ['Looking Left', 'Looking Right', 'Looking Up'] and elapsed > 3:
                        session.violations['gaze'] += 1
                    
                    analysis_result['status'] = 'Monitoring active'
            else:
                session.stable_frames = 0
        else:
            session.violations['face'] += 1
            session.stable_frames = 0
        
        return jsonify({
            'success': True,
            'analysis': analysis_result
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

def estimate_gaze(landmarks, frame_shape):
    """Estimate gaze direction using facial landmarks"""
    try:
        h, w = frame_shape[:2]
        
        # Key facial landmarks for head pose
        nose_tip = landmarks.landmark[1]
        chin = landmarks.landmark[175]
        left_eye = landmarks.landmark[33]
        right_eye = landmarks.landmark[263]
        left_mouth = landmarks.landmark[61]
        right_mouth = landmarks.landmark[291]
        
        # Convert to pixel coordinates
        nose_2d = np.array([nose_tip.x * w, nose_tip.y * h], dtype=np.float64)
        chin_2d = np.array([chin.x * w, chin.y * h], dtype=np.float64)
        left_eye_2d = np.array([left_eye.x * w, left_eye.y * h], dtype=np.float64)
        right_eye_2d = np.array([right_eye.x * w, right_eye.y * h], dtype=np.float64)
        left_mouth_2d = np.array([left_mouth.x * w, left_mouth.y * h], dtype=np.float64)
        right_mouth_2d = np.array([right_mouth.x * w, right_mouth.y * h], dtype=np.float64)
        
        # 3D model points
        model_points = np.array([
            (0.0, 0.0, 0.0),             # Nose tip
            (0.0, -330.0, -65.0),        # Chin
            (-225.0, 170.0, -135.0),     # Left eye left corner
            (225.0, 170.0, -135.0),      # Right eye right corner
            (-150.0, -150.0, -125.0),    # Left mouth corner
            (150.0, -150.0, -125.0)      # Right mouth corner
        ])
        
        # 2D image points
        image_points = np.array([
            nose_2d,
            chin_2d,
            left_eye_2d,
            right_eye_2d,
            left_mouth_2d,
            right_mouth_2d
        ], dtype=np.float64)
        
        # Camera matrix
        focal_length = w
        center = (w/2, h/2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)
        
        # Distortion coefficients
        dist_coeffs = np.zeros((4,1))
        
        # Solve PnP
        success, rotation_vector, translation_vector = cv2.solvePnP(
            model_points, image_points, camera_matrix, dist_coeffs
        )
        
        if success:
            # Convert rotation vector to rotation matrix
            rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
            
            # Extract angles
            angles, _, _, _, _, _ = cv2.RQDecomp3x3(rotation_matrix)
            
            x = angles[0] * 360
            y = angles[1] * 360
            z = angles[2] * 360
            
            # Classify direction
            session = list(proctor_sessions.values())[0]  # Get current session
            return session.classify_direction(x, y)
        
    except Exception as e:
        print(f"Gaze estimation error: {e}")
    
    return "Forward"

@app.route('/api/proctor/status/<session_id>', methods=['GET'])
def get_status(session_id):
    if session_id not in proctor_sessions:
        return jsonify({'success': False, 'error': 'Session not found'})
    
    session = proctor_sessions[session_id]
    return jsonify({
        'success': True,
        'status': {
            'enrolled': session.enrolled,
            'violations': session.violations,
            'currentGaze': session.current_gaze
        }
    })

@app.route('/api/proctor/stop/<session_id>', methods=['POST'])
def stop_proctor(session_id):
    if session_id in proctor_sessions:
        del proctor_sessions[session_id]
    
    return jsonify({
        'success': True,
        'message': 'Proctor session stopped'
    })

if __name__ == '__main__':
    print("Starting Proctor Server on http://localhost:5000")
    app.run(debug=True, port=5000, host='0.0.0.0')