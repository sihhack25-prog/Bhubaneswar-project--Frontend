import cv2
import mediapipe as mp
import numpy as np
import time
import sys
import os
import json
from datetime import datetime
import face_recognition
from ultralytics import YOLO

# ---------- Beep (best-effort cross-platform) ----------
try:
    import winsound
    def beep():
        try:
            winsound.Beep(1000, 400)
        except Exception:
            sys.stdout.write('\a'); sys.stdout.flush()
except Exception:
    def beep():
        sys.stdout.write('\a'); sys.stdout.flush()

# ---------- Logging ----------
LOG_DIR = "proctor_logs"
CSV_PATH = os.path.join(LOG_DIR, "afk_events.csv")
JSONL_PATH = os.path.join(LOG_DIR, "afk_events.jsonl")
os.makedirs(LOG_DIR, exist_ok=True)

def append_csv_row(path, headers, row_dict):
    write_header = not os.path.exists(path)
    with open(path, "a", encoding="utf-8") as f:
        if write_header:
            f.write(",".join(headers) + "\n")
        vals = []
        for h in headers:
            v = row_dict.get(h, "")
            if isinstance(v, str):
                v = v.replace(",", " ")
            vals.append(str(v))
        f.write(",".join(vals) + "\n")

def append_jsonl(path, record):
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

def write_afk_log(reason, summary):
    ts = datetime.now().isoformat(timespec="seconds")
    record = {"timestamp": ts, "reason": reason, **summary}
    csv_headers = [
        "timestamp", "reason",
        "face_violation_count", "no_face", "multi_human", "unknown_present",
        "gaze_left", "gaze_right", "gaze_up", "gaze_total",
        "iris_total", "phone_present", "last_gaze_state",
        "elapsed_gaze_sec", "fps"
    ]
    csv_row = {
        "timestamp": ts,
        "reason": reason,
        "face_violation_count": summary.get("face_violation_count", 0),
        "no_face": int(summary.get("no_face", False)),
        "multi_human": int(summary.get("multi_human", False)),
        "unknown_present": int(summary.get("unknown_present", False)),
        "gaze_left": summary.get("gaze_counts", {}).get("Looking Left", 0),
        "gaze_right": summary.get("gaze_counts", {}).get("Looking Right", 0),
        "gaze_up": summary.get("gaze_counts", {}).get("Looking Up", 0),
        "gaze_total": summary.get("gaze_total", 0),
        "iris_total": summary.get("iris_total", 0),
        "phone_present": int(summary.get("phone_present", False)),
        "last_gaze_state": summary.get("last_gaze_state", ""),
        "elapsed_gaze_sec": round(summary.get("elapsed_gaze_sec", 0.0), 2),
        "fps": int(summary.get("fps", 0)),
    }
    append_csv_row(CSV_PATH, csv_headers, csv_row)
    append_jsonl(JSONL_PATH, record)
    print(f"[LOG] Wrote AFK record to:\n- {CSV_PATH}\n- {JSONL_PATH}")

# ---------- Your exact params ----------
PHONE_LABELS = {"cell phone"}
DETECT_EVERY_N_FRAMES = 3
YOLO_CONF = 0.4

YAW_THRESH = 10
PITCH_UP = 10
PITCH_DOWN = -10
AFK_SECONDS = 5.0
NOSE_VECTOR_SCALE = 5

# ---------- Models ----------
yolo = YOLO("yolov8n.pt")

mp_face_mesh = mp.solutions.face_mesh
# For head pose (unchanged)
face_mesh = mp_face_mesh.FaceMesh(min_detection_confidence=0.5,
                                  min_tracking_confidence=0.5)
# For iris tracking
face_mesh_iris = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# ---------- Camera ----------
cap = cv2.VideoCapture(0)

# ---------- Enrollment ----------
enrolled = False
known_encoding = None
stable_single_face_frames = 0
STABLE_N = 10

# ---------- AFK & counters ----------
current_gaze_state = "Forward"
state_start_time = time.time()

phone_episode = False
frame_idx = 0
last_fps = 0

# Face proctoring (3 chances total)
face_violation_count = 0
face_violation_active = False

# Head-pose gaze chances (unchanged)
gaze_counts = {"Looking Left": 0, "Looking Right": 0, "Looking Up": 0}
gaze_episode_active = {"Looking Left": False, "Looking Right": False, "Looking Up": False}

def classify_direction(x_deg, y_deg):
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

def draw_banner(image, text, color=(0,0,255)):
    h, w = image.shape[:2]
    overlay = image.copy()
    cv2.rectangle(overlay, (0, 0), (w, 110), color, -1)
    out = cv2.addWeighted(overlay, 0.4, image, 0.6, 0)
    cv2.putText(out, text, (20, 75), cv2.FONT_HERSHEY_SIMPLEX, 2, (255,255,255), 4)
    return out

def get_face_encodings_safe(img_bgr):
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    rgb = np.ascontiguousarray(rgb)
    locs = face_recognition.face_locations(rgb, model="hog")
    try:
        encs = face_recognition.face_encodings(rgb, locs, num_jitters=0)
        encs = encs or []
    except Exception:
        encs = []
    return locs, encs

def exit_with_message(frame, msg, reason_key, summary):
    frame = draw_banner(frame, msg)
    cv2.imshow('Proctor', frame)
    cv2.waitKey(1200)
    write_afk_log(reason_key, summary)
    cap.release()
    cv2.destroyAllWindows()
    print(msg)
    sys.exit(0)

while cap.isOpened():
    ok, frame = cap.read()
    if not ok:
        break

    t0 = time.time()
    H, W = frame.shape[:2]

    # ----------------- Enrollment -----------------
    if not enrolled:
        locs, encs = get_face_encodings_safe(frame)

        for (top, right, bottom, left) in locs:
            cv2.rectangle(frame, (left, top), (right, bottom), (0,255,255), 2)

        if len(encs) == 1:
            stable_single_face_frames += 1
        else:
            stable_single_face_frames = 0

        cv2.putText(frame, "Enrollment: Face the camera ALONE", (20, 45),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,255), 2)
        cv2.putText(frame, f"Stable frames: {stable_single_face_frames}/{STABLE_N}", (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,255), 2)

        if stable_single_face_frames >= STABLE_N:
            known_encoding = encs[0]
            enrolled = True
            beep()

        cv2.imshow('Proctor', frame)
        if cv2.waitKey(1) & 0xFF == 27:
            break
        continue

    # ----------------- Monitoring -----------------
    # 1) Identity / multi-human
    locs, encs = get_face_encodings_safe(frame)
    multi_human = len(encs) > 1
    no_face = len(encs) == 0

    any_match = False
    for fe in encs:
        if face_recognition.compare_faces([known_encoding], fe, tolerance=0.45)[0]:
            any_match = True
            break
    unknown_present = (len(encs) >= 1) and (not any_match)

    for (top, right, bottom, left), fe in zip(locs, encs):
        ok_match = face_recognition.compare_faces([known_encoding], fe, tolerance=0.45)[0]
        color = (0,255,0) if ok_match else (0,0,255)
        cv2.rectangle(frame, (left, top), (right, bottom), color, 2)

    face_violation_now = (no_face or multi_human or unknown_present)
    if face_violation_now and not face_violation_active:
        face_violation_count += 1
        face_violation_active = True
        beep()
    if not face_violation_now and face_violation_active:
        face_violation_active = False

    if face_violation_count > 3:
        summary = {
            "face_violation_count": face_violation_count,
            "no_face": no_face, "multi_human": multi_human, "unknown_present": unknown_present,
            "gaze_counts": gaze_counts, "gaze_total": sum(gaze_counts.values()),
            "iris_total": 0,  # filled later if iris tracked this loop
            "phone_present": False,
            "last_gaze_state": current_gaze_state,
            "elapsed_gaze_sec": time.time() - state_start_time,
            "fps": last_fps,
        }
        exit_with_message(frame, "AFK detected with face proctoring — test finished",
                          "face_proctoring", summary)

    # 2) Device detection (phone)
    frame_idx += 1
    phone_present = False
    if frame_idx % DETECT_EVERY_N_FRAMES == 0:
        rgb_for_yolo = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = yolo.predict(source=rgb_for_yolo, conf=YOLO_CONF, verbose=False)[0]
        for box, cls_idx, conf in zip(res.boxes.xyxy.cpu().numpy(),
                                      res.boxes.cls.cpu().numpy(),
                                      res.boxes.conf.cpu().numpy()):
            cls_name = yolo.model.names[int(cls_idx)]
            if cls_name in PHONE_LABELS:
                phone_present = True
                x1, y1, x2, y2 = box.astype(int)
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0,0,255), 2)
                cv2.putText(frame, f"{cls_name} {conf:.2f}", (x1, max(20, y1-8)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,0,255), 2)

    if phone_present:
        summary = {
            "face_violation_count": face_violation_count,
            "no_face": no_face, "multi_human": multi_human, "unknown_present": unknown_present,
            "gaze_counts": gaze_counts, "gaze_total": sum(gaze_counts.values()),
            "iris_total": 0,
            "phone_present": True,
            "last_gaze_state": current_gaze_state,
            "elapsed_gaze_sec": time.time() - state_start_time,
            "fps": last_fps,
        }
        exit_with_message(frame, "AFK use of mobile — test finished",
                          "device_mobile", summary)

    # 3) Head pose (unchanged)
    pose_img = cv2.cvtColor(cv2.flip(frame, 1), cv2.COLOR_BGR2RGB)
    pose_img.flags.writeable = False
    results_pose = face_mesh.process(pose_img)
    pose_img.flags.writeable = True
    pose_img = cv2.cvtColor(pose_img, cv2.COLOR_RGB2BGR)

    text = "No face"
    x = y = z = 0.0
    have_pose = False
    face_2d, face_3d = [], []
    img_h, img_w = pose_img.shape[:2]

    if results_pose.multi_face_landmarks:
        for face_landmarks in results_pose.multi_face_landmarks:
            nose_2d = (0, 0); nose_3d = (0, 0, 0)
            for idx, lm in enumerate(face_landmarks.landmark):
                if idx in (33, 263, 1, 61, 291, 199):
                    if idx == 1:
                        nose_2d = (lm.x * img_w, lm.y * img_h)
                        nose_3d = (lm.x * img_w, lm.y * img_h, lm.z * 3000)
                    xi, yi = int(lm.x * img_w), int(lm.y * img_h)
                    face_2d.append([xi, yi])
                    face_3d.append([xi, yi, lm.z])

            if len(face_2d) >= 6:
                face_2d = np.array(face_2d, dtype=np.float64)
                face_3d = np.array(face_3d, dtype=np.float64)
                focal_length = 1 * img_w
                cam_matrix = np.array([[focal_length, 0, img_h / 2],
                                       [0, focal_length, img_w / 2],
                                       [0, 0, 1]])
                dist_matrix = np.zeros((4, 1), dtype=np.float64)
                ok_pnp, rot_vec, trans_vec = cv2.solvePnP(
                    face_3d, face_2d, cam_matrix, dist_matrix, flags=cv2.SOLVEPNP_ITERATIVE
                )
                if ok_pnp:
                    rmat, _ = cv2.Rodrigues(rot_vec)
                    angles, *_ = cv2.RQDecomp3x3(rmat)
                    x = angles[0] * 360  # pitch
                    y = angles[1] * 360  # yaw
                    z = angles[2] * 360  # roll
                    text = classify_direction(x, y)
                    have_pose = True
                    p1 = (int(nose_2d[0]), int(nose_2d[1]))
                    p2 = (int(nose_2d[0] + y * NOSE_VECTOR_SCALE),
                          int(nose_2d[1] - x * NOSE_VECTOR_SCALE))
                    cv2.line(pose_img, p1, p2, (255, 0, 0), 3)
                    break

    now = time.time()
    disallowed_gaze = text in ("Looking Left", "Looking Right", "Looking Up")
    if have_pose and text != current_gaze_state:
        current_gaze_state = text
        state_start_time = now
        for k in gaze_episode_active:
            if k != text:
                gaze_episode_active[k] = False

    elapsed = now - state_start_time
    if disallowed_gaze and elapsed >= AFK_SECONDS:
        if not gaze_episode_active[current_gaze_state]:
            gaze_counts[current_gaze_state] += 1
            gaze_episode_active[current_gaze_state] = True
            beep()

    total_gaze = sum(gaze_counts.values())
    if (gaze_counts["Looking Left"] > 5 or
        gaze_counts["Looking Right"] > 5 or
        gaze_counts["Looking Up"] > 5 or
        total_gaze > 8):
        summary = {
            "face_violation_count": face_violation_count,
            "no_face": no_face, "multi_human": multi_human, "unknown_present": unknown_present,
            "gaze_counts": gaze_counts, "gaze_total": total_gaze,
            "iris_total": 0,
            "phone_present": False,
            "last_gaze_state": current_gaze_state,
            "elapsed_gaze_sec": elapsed,
            "fps": int(1.0 / max(1e-6, (time.time() - t0)))
        }
        exit_with_message(pose_img, "AFK detected with away looking — test finished",
                          "gaze_away", summary)

    # ----------------- IRIS TRACKING (fault = L/R/Up combined) -----------------
    # Balanced settings (unchanged from your last code)
    HEAD_GATE       = False
    EAR_BLINK_TH    = 0.17
    DWELL_SECONDS_IRIS = 1.5
    H_ON   = 0.019
    H_OFF  = 0.024
    GAZE_V_UP_TH = 0.42
    EMA_ALPHA_GAZE = 0.40

    # persistent iris state
    if 'gH_s' not in globals(): gH_s = None
    if 'gV_s' not in globals(): gV_s = None
    if 'eye_state' not in globals(): eye_state = "Center"
    if 'last_iris_state' not in globals(): last_iris_state = "OK"
    if 'iris_state_start' not in globals(): iris_state_start = time.time()
    if 'iris_episode_active' not in globals(): iris_episode_active = False
    if 'iris_faults' not in globals(): iris_faults = 0
    IRIS_TOTAL_LIMIT = 15  # allow up to 15

    def _pt(lms, idx, W, H):
        lm = lms[idx]; return np.array([lm.x * W, lm.y * H], dtype=np.float32)

    def eye_metrics(lms, W, H, side="right"):
        if side == "right":
            i_l, i_r, i_up, i_dn, iris_ids = 33,133,159,145,[474,475,476,477]
        else:
            i_l, i_r, i_up, i_dn, iris_ids = 362,263,386,374,[469,470,471,472]
        L=_pt(lms,i_l,img_w,img_h); R=_pt(lms,i_r,img_w,img_h)
        U=_pt(lms,i_up,img_w,img_h); D=_pt(lms,i_dn,img_w,img_h)
        iris = np.stack([_pt(lms,i,img_w,img_h) for i in iris_ids],0).mean(0)
        eye_w = max(1.0, np.linalg.norm(R-L)); eye_h = max(1.0, np.linalg.norm(D-U))
        gH = (iris[0]-L[0])/eye_w
        gV = (iris[1]-U[1])/eye_h
        EAR = eye_h/eye_w
        return float(np.clip(gH,0,1)), float(np.clip(gV,0,1)), EAR, iris, (L,R,U,D)

    def ema(prev,x,a): return (1-a)*prev + a*x if prev is not None else x

    def update_eye_state(prev_state, gH, gV):
        left_on  = gH < (0.5 - H_ON);   left_off  = gH > (0.5 - H_OFF)
        right_on = gH > (0.5 + H_ON);   right_off = gH < (0.5 + H_OFF)
        up_on_abs = gV < GAZE_V_UP_TH
        state = prev_state
        if prev_state == "Up":
            if not up_on_abs: state = "Center"
        elif prev_state == "Left":
            if left_off: state = "Center"
            if up_on_abs: state = "Up"
        elif prev_state == "Right":
            if right_off: state = "Center"
            if up_on_abs: state = "Up"
        else:
            if up_on_abs: state = "Up"
            elif left_on: state = "Left"
            elif right_on: state = "Right"
        return state

    iris_rgb = cv2.cvtColor(cv2.flip(frame, 1), cv2.COLOR_BGR2RGB)
    iris_rgb.flags.writeable = False
    res_iris = face_mesh_iris.process(iris_rgb)
    iris_rgb.flags.writeable = True

    if res_iris.multi_face_landmarks:
        lms = res_iris.multi_face_landmarks[0].landmark
        gh_r, gv_r, ear_r, iris_r, box_r = eye_metrics(lms, img_w, img_h, "right")
        gh_l, gv_l, ear_l, iris_l, box_l = eye_metrics(lms, img_w, img_h, "left")
        ear = (ear_r + ear_l) * 0.5

        if ear >= EAR_BLINK_TH:
            gH = (gh_r + gh_l) * 0.5
            gV = (gv_r + gv_l) * 0.5
            gH_s = ema(gH_s, gH, EMA_ALPHA_GAZE)
            gV_s = ema(gV_s, gV, EMA_ALPHA_GAZE)

            # iris state (Left/Right/Up/Center), but we won't display the direction
            eye_state = update_eye_state(eye_state, gH_s, gV_s)
            iris_flag = (eye_state in ("Left","Right","Up"))

            # dwell-based increment
            now2 = time.time()
            iris_state = "AFK_IRIS" if iris_flag else "OK"
            if iris_state != last_iris_state:
                last_iris_state = iris_state
                iris_state_start = now2
                iris_episode_active = False
            iris_elapsed = now2 - iris_state_start
            if iris_state == "AFK_IRIS" and iris_elapsed >= DWELL_SECONDS_IRIS and not iris_episode_active:
                iris_faults += 1
                iris_episode_active = True
                beep()

            # draw minimal viz w/o naming directions
            for iris in (iris_r, iris_l):
                cv2.circle(pose_img, (int(iris[0]), int(iris[1])), 2, (0,255,255), -1)
            for (L,R,U,D) in (box_r, box_l):
                cv2.rectangle(pose_img, (int(L[0]),int(U[1])), (int(R[0]),int(D[1])), (255,0,0), 1)
            dx = (gH_s - 0.5) * 2.0; dy = (gV_s - 0.5) * 2.0
            for iris in (iris_r, iris_l):
                p1=(int(iris[0]),int(iris[1])); p2=(int(iris[0]+dx*25),int(iris[1]+dy*25))
                cv2.arrowedLine(pose_img,p1,p2,(0,255,255),2,tipLength=0.35)

            # show only totals (no Left/Right/Up words)
            cv2.putText(pose_img, f"Iris faults: {iris_faults}/15", (20, 235),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,165,255), 2)
        else:
            cv2.putText(pose_img, "Iris: blink/closed — skipping", (20, 235),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,165,255), 2)

    # Iris exit condition (exceeds 15)
    if 'iris_faults' in globals():
        if iris_faults/2 > 15:
            summary = {
                "face_violation_count": face_violation_count,
                "no_face": no_face, "multi_human": multi_human, "unknown_present": unknown_present,
                "gaze_counts": gaze_counts, "gaze_total": total_gaze,
                "iris_total": iris_faults,
                "phone_present": False,
                "last_gaze_state": current_gaze_state,
                "elapsed_gaze_sec": elapsed,
                "fps": int(1.0 / max(1e-6, (time.time() - t0)))
            }
            exit_with_message(pose_img, "AFK detected (iris) — test finished",
                              "iris_mismatch", summary)

    # ---------- Overlays ----------
    base_color = (0,255,0) if (text in ("Forward", "Looking Down")) else (0,165,255)
    if text == "No face":
        base_color = (0,0,255)

    cv2.putText(pose_img, text, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 2, base_color, 2)
    cv2.putText(pose_img, f"x:{x:.1f}  y:{y:.1f}  z:{z:.1f}", (20, 90),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,0,255), 2)

    cv2.putText(pose_img, f"Face violations: {face_violation_count}/3", (20, 130),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,0,255) if face_violation_count>=3 else (0,255,0), 2)
    cv2.putText(pose_img, f"Faces: {len(encs)}  KnownOK: {int(not (unknown_present or no_face))}", (20, 165),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0) if not (no_face or unknown_present or multi_human) else (0,0,255), 2)

    total_gaze = sum(gaze_counts.values())
    cv2.putText(pose_img, f"Left:{gaze_counts['Looking Left']}/5  Right:{gaze_counts['Looking Right']}/5  Up:{gaze_counts['Looking Up']}/5  Total:{total_gaze}/8",
                (20, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,165,255), 2)

    fps = 20.0 / max(1e-6, time.time() - t0)
    last_fps = int(fps)
    cv2.putText(pose_img, f'FPS: {last_fps}', (20, H - 20),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0,255,0), 2)

    cv2.imshow('Proctor', pose_img)
    if cv2.waitKey(1) & 0xFF == 27:
        break

# graceful end (no AFK)
cap.release()
cv2.destroyAllWindows()
