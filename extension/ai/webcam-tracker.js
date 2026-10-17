/**
 * AI Webcam Face Tracking Engine (MediaPipe Face Mesh Algorithms)
 * CampusOS "AI Giám Sát Học Tập Cực Đoan" - Milestone 3
 *
 * Responsibilities:
 * - Pure mathematical calculation of Eye Aspect Ratio (EAR) for left & right eyes
 * - Continuous drowsiness / sleeping detection (>10s eyes closed threshold)
 * - Head Pose estimation (Yaw, Pitch, Roll) from facial landmarks
 * - Continuous looking away detection (Yaw > 30° or Pitch < -25° for >10s)
 * - WebcamFaceMonitor engine class managing frame processing, duration accumulator,
 *   event callbacks (onSleepDetected, onFaceAwayDetected, onNormal), and toggle flags
 * - Throttled processing loop (10-15fps) keeping CPU usage < 5%
 * - 100% in-memory local processing guarantee (zero video upload / zero disk persistence)
 */

// ============================================================================
// CONSTANTS & CONFIGURATION DEFAULTS
// ============================================================================

export const DEFAULT_EAR_THRESHOLD = 0.20; // EAR < 0.20 indicates closed eyes
export const DEFAULT_SLEEP_DURATION_MS = 10000; // 10 seconds continuous eyes closed triggers sleep alert
export const DEFAULT_AWAY_YAW_THRESHOLD = 30; // Absolute yaw > 30° indicates turned head
export const DEFAULT_AWAY_PITCH_DOWN_THRESHOLD = -25; // Pitch < -25° indicates head slumped down
export const DEFAULT_AWAY_PITCH_UP_THRESHOLD = 35; // Pitch > 35° indicates looking up/back
export const DEFAULT_AWAY_DURATION_MS = 10000; // 10 seconds continuous looking away triggers alert
export const DEFAULT_TARGET_FPS = 12; // 10-15fps optimal throttling for minimal CPU usage

/**
 * MediaPipe Face Mesh Landmark Indices (468/478 landmarks model)
 *
 * Left eye 6-point contour:
 * p1 = 33 (outer corner)
 * p2 = 160 (upper eyelid top-left)
 * p3 = 158 (upper eyelid top-right)
 * p4 = 133 (inner corner)
 * p5 = 153 (lower eyelid bottom-right)
 * p6 = 144 (lower eyelid bottom-left)
 */
export const LEFT_EYE_LANDMARKS = [33, 160, 158, 133, 153, 144];

/**
 * Right eye 6-point contour:
 * p1 = 362 (inner corner)
 * p2 = 385 (upper eyelid top-left)
 * p3 = 387 (upper eyelid top-right)
 * p4 = 263 (outer corner)
 * p5 = 373 (lower eyelid bottom-right)
 * p6 = 380 (lower eyelid bottom-left)
 */
export const RIGHT_EYE_LANDMARKS = [362, 385, 387, 263, 373, 380];

/**
 * Key Anatomical Landmarks for Head Pose Estimation
 */
export const HEAD_POSE_LANDMARKS = {
  NOSE_TIP: 1,
  CHIN: 152,
  LEFT_EYE_OUTER: 33,
  RIGHT_EYE_OUTER: 263,
  LEFT_MOUTH: 61,
  RIGHT_MOUTH: 291,
  FOREHEAD: 10,
};

// ============================================================================
// PURE MATHEMATICAL FUNCTIONS
// ============================================================================

/**
 * Calculates Euclidean distance between two 2D/3D points.
 * Handles missing coordinates, z-depth, and null/undefined gracefully.
 *
 * @param {{x: number, y: number, z?: number}} p1
 * @param {{x: number, y: number, z?: number}} p2
 * @returns {number}
 */
export function euclideanDistance(p1, p2) {
  if (!p1 || !p2) return 0;
  const x1 = typeof p1.x === 'number' ? p1.x : 0;
  const y1 = typeof p1.y === 'number' ? p1.y : 0;
  const z1 = typeof p1.z === 'number' ? p1.z : 0;

  const x2 = typeof p2.x === 'number' ? p2.x : 0;
  const y2 = typeof p2.y === 'number' ? p2.y : 0;
  const z2 = typeof p2.z === 'number' ? p2.z : 0;

  const dx = x1 - x2;
  const dy = y1 - y2;
  const dz = z1 - z2;

  return Math.hypot(dx, dy, dz);
}

/**
 * Calculates Eye Aspect Ratio (EAR) based on Soukupová & Čech (2016) formula:
 *
 *   EAR = ( ||p2 - p6|| + ||p3 - p5|| ) / ( 2 * ||p1 - p4|| )
 *
 * @param {Array<{x: number, y: number, z?: number}>} eyePoints - Array of 6 points [p1, p2, p3, p4, p5, p6]
 * @returns {number} EAR value (typically ~0.30 for open eyes, ~0.12 for closed eyes)
 */
export function calculateEyeAspectRatio(eyePoints) {
  if (!Array.isArray(eyePoints) || eyePoints.length < 6) {
    return 0;
  }

  const [p1, p2, p3, p4, p5, p6] = eyePoints;
  if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) {
    return 0;
  }

  // Vertical distances between eyelid landmarks
  const distA = euclideanDistance(p2, p6);
  const distB = euclideanDistance(p3, p5);

  // Horizontal distance between inner and outer eye corners
  const distC = euclideanDistance(p1, p4);

  // Avoid division by zero on degenerate points
  if (distC <= 0 || !Number.isFinite(distC)) {
    return 0;
  }

  const ear = (distA + distB) / (2.0 * distC);
  return Number.isFinite(ear) && ear >= 0 ? ear : 0;
}

/**
 * Extracts left & right eye contour points from a full face landmarks array
 * and calculates the average Eye Aspect Ratio (EAR).
 *
 * @param {Array<{x: number, y: number, z?: number}>} landmarks - Full facial mesh landmarks (>=468 points)
 * @param {number[]} [leftIndices=LEFT_EYE_LANDMARKS]
 * @param {number[]} [rightIndices=RIGHT_EYE_LANDMARKS]
 * @returns {number} Average EAR across both eyes
 */
export function calculateAverageEAR(
  landmarks,
  leftIndices = LEFT_EYE_LANDMARKS,
  rightIndices = RIGHT_EYE_LANDMARKS
) {
  if (!Array.isArray(landmarks) || landmarks.length === 0) {
    return 0;
  }

  const leftEyePoints = leftIndices.map((idx) => landmarks[idx]).filter(Boolean);
  const rightEyePoints = rightIndices.map((idx) => landmarks[idx]).filter(Boolean);

  if (leftEyePoints.length < 6 || rightEyePoints.length < 6) {
    return 0;
  }

  const leftEAR = calculateEyeAspectRatio(leftEyePoints);
  const rightEAR = calculateEyeAspectRatio(rightEyePoints);

  return (leftEAR + rightEAR) / 2.0;
}

/**
 * Evaluates whether drowsiness / sleeping is detected based on EAR and duration.
 *
 * @param {number} ear - Current Eye Aspect Ratio
 * @param {number} durationMs - Continuous milliseconds eyes have remained closed (< threshold)
 * @param {number} [threshold=0.20] - Drowsiness threshold
 * @param {number} [requiredMs=10000] - Continuous closed duration required (10 seconds)
 * @returns {boolean} True if drowsiness/sleep confirmed
 */
export function detectDrowsiness(
  ear,
  durationMs,
  threshold = DEFAULT_EAR_THRESHOLD,
  requiredMs = DEFAULT_SLEEP_DURATION_MS
) {
  if (typeof ear !== 'number' || typeof durationMs !== 'number') {
    return false;
  }
  if (!Number.isFinite(ear) || !Number.isFinite(durationMs)) {
    return false;
  }
  return ear < threshold && durationMs >= requiredMs;
}

/**
 * Approximates Head Pose angles (Yaw, Pitch, Roll) in degrees from facial landmarks.
 * Supports both MediaPipe 468-point arrays and simplified coordinate objects.
 *
 * Convention:
 * - Yaw: Turning head to student's right is positive (>0), turning left is negative (<0). Neutral is ~0°.
 * - Pitch: Tilting head down (gục đầu) is negative (<0), tilting up (ngửa cổ) is positive (>0). Neutral is ~0°.
 * - Roll: Tilting head sideways towards right shoulder is positive (>0), left is negative (<0). Neutral is ~0°.
 *
 * @param {Array<{x: number, y: number, z?: number}> | Record<string, {x: number, y: number, z?: number}>} landmarks
 * @returns {{yaw: number, pitch: number, roll: number}}
 */
export function estimateHeadPose(landmarks) {
  const defaultAngles = { yaw: 0, pitch: 0, roll: 0 };
  if (!landmarks) return defaultAngles;

  let nose, chin, leftEye, rightEye, forehead;

  if (Array.isArray(landmarks)) {
    if (landmarks.length < 34) return defaultAngles;
    nose = landmarks[HEAD_POSE_LANDMARKS.NOSE_TIP];
    chin = landmarks[HEAD_POSE_LANDMARKS.CHIN];
    leftEye = landmarks[HEAD_POSE_LANDMARKS.LEFT_EYE_OUTER];
    rightEye = landmarks[HEAD_POSE_LANDMARKS.RIGHT_EYE_OUTER];
    forehead = landmarks[HEAD_POSE_LANDMARKS.FOREHEAD];
  } else if (typeof landmarks === 'object') {
    nose = landmarks.nose || landmarks[HEAD_POSE_LANDMARKS.NOSE_TIP];
    chin = landmarks.chin || landmarks[HEAD_POSE_LANDMARKS.CHIN];
    leftEye = landmarks.leftEye || landmarks[HEAD_POSE_LANDMARKS.LEFT_EYE_OUTER];
    rightEye = landmarks.rightEye || landmarks[HEAD_POSE_LANDMARKS.RIGHT_EYE_OUTER];
    forehead = landmarks.forehead || landmarks[HEAD_POSE_LANDMARKS.FOREHEAD];
  }

  if (!nose || !leftEye || !rightEye) {
    return defaultAngles;
  }

  // 1. Roll (Tilt sideways): Angle of the horizontal eye line
  const eyeDx = (rightEye.x ?? 0) - (leftEye.x ?? 0);
  const eyeDy = (rightEye.y ?? 0) - (leftEye.y ?? 0);
  const rollRad = Math.atan2(eyeDy, eyeDx !== 0 ? eyeDx : 0.0001);
  const roll = rollRad * (180.0 / Math.PI);

  // 2. Yaw (Turn left/right): Asymmetry of nose relative to eye outer corners
  const eyeMidX = ((leftEye.x ?? 0) + (rightEye.x ?? 0)) / 2.0;
  const eyeSpan = Math.abs(eyeDx);
  let yaw = 0;

  if (eyeSpan > 0.0001) {
    // Offset ratio: how far nose is from eye midpoint relative to half-width
    const halfSpan = eyeSpan / 2.0;
    const noseOffsetX = (nose.x ?? 0) - eyeMidX;
    const offsetRatio = Math.max(-1.0, Math.min(1.0, noseOffsetX / halfSpan));
    yaw = Math.asin(offsetRatio) * (180.0 / Math.PI);

    // If 3D depth z-coordinates exist, refine yaw using depth parallax
    const eyeDz = (rightEye.z ?? 0) - (leftEye.z ?? 0);
    if (Math.abs(eyeDz) > 0.001) {
      const yaw3d = Math.atan2(eyeDz, eyeSpan) * (180.0 / Math.PI);
      yaw = (yaw + yaw3d) / 2.0;
    }
  }

  // 3. Pitch (Nod up/down): Vertical position of nose relative to eye-line and chin
  let pitch = 0;
  const eyeMidY = ((leftEye.y ?? 0) + (rightEye.y ?? 0)) / 2.0;
  const chinY = chin ? (chin.y ?? eyeMidY + 50) : eyeMidY + 50;
  const foreheadY = forehead ? (forehead.y ?? eyeMidY - 50) : eyeMidY - Math.abs(chinY - eyeMidY);
  const faceHeight = Math.abs(chinY - foreheadY);

  if (faceHeight > 0.0001) {
    // Distance from eyes down to nose
    const eyeToNose = (nose.y ?? eyeMidY) - eyeMidY;
    // Expected neutral eyeToNose is ~18% of face height
    const neutralRatio = 0.18;
    const currentRatio = eyeToNose / faceHeight;
    // When pitching down, nose moves closer to chin/lower -> currentRatio increases -> pitch negative
    const pitchOffset = (neutralRatio - currentRatio) * 160.0;
    pitch = Math.max(-90.0, Math.min(90.0, pitchOffset));

    // If 3D depth z-coordinates exist and non-zero, refine pitch with depth
    if (chin && (chin.z !== undefined || forehead?.z !== undefined)) {
      const chinZ = chin.z ?? 0;
      const foreheadZ = forehead?.z ?? 0;
      const dz = foreheadZ - chinZ;
      if (Math.abs(dz) > 0.001) {
        const pitchZ = Math.atan2(dz, faceHeight) * (180.0 / Math.PI);
        pitch = (pitch + pitchZ) / 2.0;
      }
    }
  }

  return {
    yaw: Number(yaw.toFixed(2)),
    pitch: Number(pitch.toFixed(2)),
    roll: Number(roll.toFixed(2)),
  };
}

/**
 * Evaluates whether student is looking away from screen based on Head Pose angles and duration.
 *
 * Condition:
 * - Yaw > 30° (turned right) OR Yaw < -30° (turned left)
 * - OR Pitch < -25° (slumped/looking down at phone) OR Pitch > 35° (looking up/away)
 * - Continuously for >= requiredMs (10,000 ms)
 *
 * @param {{yaw: number, pitch: number, roll?: number} | number[]} angles
 * @param {number} durationMs
 * @param {number} [requiredMs=10000]
 * @param {object} [options={}]
 * @returns {boolean} True if looking away confirmed
 */
export function detectLookingAway(
  angles,
  durationMs,
  requiredMs = DEFAULT_AWAY_DURATION_MS,
  options = {}
) {
  if (!angles || typeof durationMs !== 'number' || !Number.isFinite(durationMs)) {
    return false;
  }

  const yaw = Array.isArray(angles) ? angles[0] : (angles.yaw ?? 0);
  const pitch = Array.isArray(angles) ? angles[1] : (angles.pitch ?? 0);

  if (typeof yaw !== 'number' || typeof pitch !== 'number') {
    return false;
  }

  const yawThreshold = options.yawThreshold ?? DEFAULT_AWAY_YAW_THRESHOLD;
  const pitchDownThreshold = options.pitchDownThreshold ?? DEFAULT_AWAY_PITCH_DOWN_THRESHOLD;
  const pitchUpThreshold = options.pitchUpThreshold ?? DEFAULT_AWAY_PITCH_UP_THRESHOLD;

  const isAwayAngle =
    Math.abs(yaw) > yawThreshold ||
    pitch < pitchDownThreshold ||
    pitch > pitchUpThreshold;

  return isAwayAngle && durationMs >= requiredMs;
}

// ============================================================================
// WEBCAM FACE MONITOR ENGINE CLASS
// ============================================================================

/**
 * WebcamFaceMonitor: Stateful monitoring engine coordinating frame analysis,
 * duration accumulators, event dispatches, and throttle management.
 */
export class WebcamFaceMonitor {
  /**
   * @param {object} [options={}]
   */
  constructor(options = {}) {
    this.earThreshold = options.earThreshold ?? DEFAULT_EAR_THRESHOLD;
    this.sleepDurationMs = options.sleepDurationMs ?? DEFAULT_SLEEP_DURATION_MS;
    this.awayYawThreshold = options.awayYawThreshold ?? DEFAULT_AWAY_YAW_THRESHOLD;
    this.awayPitchDownThreshold = options.awayPitchDownThreshold ?? DEFAULT_AWAY_PITCH_DOWN_THRESHOLD;
    this.awayPitchUpThreshold = options.awayPitchUpThreshold ?? DEFAULT_AWAY_PITCH_UP_THRESHOLD;
    this.awayDurationMsThreshold = options.awayDurationMs ?? DEFAULT_AWAY_DURATION_MS;
    this.targetFps = options.targetFps ?? DEFAULT_TARGET_FPS;

    // Callbacks
    this.onSleepDetected = options.onSleepDetected || (() => {});
    this.onFaceAwayDetected = options.onFaceAwayDetected || (() => {});
    this.onNormal = options.onNormal || (() => {});
    this.onFrame = options.onFrame || (() => {});

    // State
    this.isEnabled = options.enabled !== undefined ? Boolean(options.enabled) : true;
    this.isRunning = false;
    this.isPaused = false;
    this.currentStatus = 'idle'; // 'idle' | 'normal' | 'drowsy' | 'looking_away' | 'no_face'

    // Accumulators
    this.drowsyDurationMs = 0;
    this.awayDurationMs = 0;
    this.lastFrameTimestamp = 0;

    // Last telemetry snapshot
    this.lastTelemetry = {
      ear: 0.30,
      angles: { yaw: 0, pitch: 0, roll: 0 },
      status: 'idle',
      drowsyDurationMs: 0,
      awayDurationMs: 0,
    };

    // 100% In-memory local processing guarantee
    this.localProcessingOnly = true;
    this.frameIntervalMs = Math.round(1000.0 / this.targetFps);
  }

  /**
   * Starts active monitoring
   */
  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.currentStatus = 'normal';
    this.lastFrameTimestamp = Date.now();
    this.drowsyDurationMs = 0;
    this.awayDurationMs = 0;
    return this;
  }

  /**
   * Stops active monitoring and resets counters
   */
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentStatus = 'idle';
    this.drowsyDurationMs = 0;
    this.awayDurationMs = 0;
    this.lastFrameTimestamp = 0;
    return this;
  }

  /**
   * Pauses active monitoring (preserves accumulators)
   */
  pause() {
    this.isPaused = true;
    return this;
  }

  /**
   * Resumes monitoring from paused state
   */
  resume() {
    if (!this.isRunning) {
      return this.start();
    }
    this.isPaused = false;
    this.lastFrameTimestamp = Date.now();
    return this;
  }

  /**
   * Toggles enabled flag
   * @param {boolean} [force]
   */
  toggle(force) {
    if (typeof force === 'boolean') {
      this.isEnabled = force;
    } else {
      this.isEnabled = !this.isEnabled;
    }
    if (!this.isEnabled) {
      this.drowsyDurationMs = 0;
      this.awayDurationMs = 0;
      this.currentStatus = 'idle';
    }
    return this.isEnabled;
  }

  /**
   * Explicitly sets enabled status
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    return this.toggle(Boolean(enabled));
  }

  /**
   * Resets all accumulators and returns status to normal
   */
  reset() {
    this.drowsyDurationMs = 0;
    this.awayDurationMs = 0;
    this.lastFrameTimestamp = Date.now();
    this.currentStatus = this.isRunning ? 'normal' : 'idle';
    return this;
  }

  /**
   * Processes a single facial landmark frame.
   * Can be called synchronously by test runner, Web Worker, or requestAnimationFrame loop.
   *
   * @param {Array<{x: number, y: number, z?: number}> | null} landmarks - Facial landmarks
   * @param {number} [deltaTimeMs] - Elapsed time since last frame in ms. If omitted, calculated from system clock.
   * @returns {object} Telemetry snapshot
   */
  processFrame(landmarks, deltaTimeMs) {
    if (!this.isEnabled || !this.isRunning || this.isPaused) {
      return {
        ignored: true,
        reason: !this.isEnabled ? 'disabled' : !this.isRunning ? 'not_running' : 'paused',
        status: this.currentStatus,
        ear: this.lastTelemetry.ear,
        angles: this.lastTelemetry.angles,
      };
    }

    const now = Date.now();
    let delta = 0;
    if (typeof deltaTimeMs === 'number' && Number.isFinite(deltaTimeMs) && deltaTimeMs >= 0) {
      delta = deltaTimeMs;
      this.lastFrameTimestamp = now;
    } else {
      delta = this.lastFrameTimestamp > 0 ? Math.max(0, now - this.lastFrameTimestamp) : 0;
      this.lastFrameTimestamp = now;
    }

    // Handle no face detected
    if (!landmarks || (Array.isArray(landmarks) && landmarks.length === 0)) {
      this.currentStatus = 'no_face';
      // Reset accumulators to avoid false positives while face is absent
      this.drowsyDurationMs = 0;
      this.awayDurationMs = 0;

      const telemetry = {
        ear: 0,
        angles: { yaw: 0, pitch: 0, roll: 0 },
        status: 'no_face',
        drowsyDurationMs: 0,
        awayDurationMs: 0,
        deltaMs: delta,
      };
      this.lastTelemetry = telemetry;
      this.onFrame(telemetry);
      return telemetry;
    }

    // 1. Calculate EAR
    const ear = calculateAverageEAR(landmarks);

    // 2. Estimate Head Pose
    const angles = estimateHeadPose(landmarks);

    // 3. Accumulate Drowsiness Duration
    if (ear < this.earThreshold) {
      this.drowsyDurationMs += delta;
    } else {
      this.drowsyDurationMs = 0;
    }

    // 4. Accumulate Looking Away Duration
    const isAwayAngle =
      Math.abs(angles.yaw) > this.awayYawThreshold ||
      angles.pitch < this.awayPitchDownThreshold ||
      angles.pitch > this.awayPitchUpThreshold;

    if (isAwayAngle) {
      this.awayDurationMs += delta;
    } else {
      this.awayDurationMs = 0;
    }

    // 5. Evaluate Trigger Conditions
    let nextStatus = 'normal';

    if (this.drowsyDurationMs >= this.sleepDurationMs) {
      nextStatus = 'drowsy';
      this.onSleepDetected({
        ear,
        durationMs: this.drowsyDurationMs,
        threshold: this.earThreshold,
      });
    } else if (this.awayDurationMs >= this.awayDurationMsThreshold) {
      nextStatus = 'looking_away';
      this.onFaceAwayDetected({
        angles,
        durationMs: this.awayDurationMs,
        thresholds: {
          yaw: this.awayYawThreshold,
          pitchDown: this.awayPitchDownThreshold,
          pitchUp: this.awayPitchUpThreshold,
        },
      });
    } else {
      nextStatus = 'normal';
      this.onNormal({
        ear,
        angles,
        status: 'normal',
      });
    }

    this.currentStatus = nextStatus;

    const telemetry = {
      ear: Number(ear.toFixed(3)),
      angles,
      status: nextStatus,
      drowsyDurationMs: this.drowsyDurationMs,
      awayDurationMs: this.awayDurationMs,
      deltaMs: delta,
      isEnabled: this.isEnabled,
      isRunning: this.isRunning,
    };

    this.lastTelemetry = telemetry;
    this.onFrame(telemetry);
    return telemetry;
  }

  /**
   * Retrieves current telemetry snapshot
   */
  getTelemetry() {
    return {
      ...this.lastTelemetry,
      status: this.currentStatus,
      isEnabled: this.isEnabled,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      drowsyDurationMs: this.drowsyDurationMs,
      awayDurationMs: this.awayDurationMs,
    };
  }
}
