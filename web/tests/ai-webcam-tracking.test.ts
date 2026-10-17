/**
 * Comprehensive Automated Test Suite: AI Webcam Face Tracking
 * CampusOS "AI Giám Sát Học Tập Cực Đoan" - Milestone 3
 *
 * Verifies:
 * - Tier 1: Feature Coverage (EAR, Drowsiness, Head Pose, Looking Away, Monitor Lifecycle)
 * - Tier 2: Boundary & Corner Cases (Degenerate geometry, 9999ms vs 10000ms, null/empty)
 * - Tier 3: Cross-Feature Integration (Blink filtering, recovery, multi-violation)
 * - Tier 4: Real-World Student Workflows (Studying, nodding off, turning to phone, toggle off)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateEyeAspectRatio,
  calculateAverageEAR,
  detectDrowsiness,
  estimateHeadPose,
  detectLookingAway,
  WebcamFaceMonitor,
  euclideanDistance,
  DEFAULT_EAR_THRESHOLD,
  DEFAULT_SLEEP_DURATION_MS,
  DEFAULT_AWAY_YAW_THRESHOLD,
  DEFAULT_AWAY_PITCH_DOWN_THRESHOLD,
  DEFAULT_AWAY_PITCH_UP_THRESHOLD,
  DEFAULT_AWAY_DURATION_MS,
  LEFT_EYE_LANDMARKS,
  RIGHT_EYE_LANDMARKS,
  HEAD_POSE_LANDMARKS,
} from '../../extension/ai/webcam-tracker.js';

import { SupervisorArbiter } from '../src/features/pomodoro/supervisor-arbiter.ts';
import { CHARACTERS } from '../src/features/pomodoro/characters-data.ts';

// ============================================================================
// TEST FIXTURES & GEOMETRIC SYNTHESIZERS
// ============================================================================

/**
 * Creates 6 eye points with known mathematical EAR:
 * EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
 *
 * When open:
 * p1 = (0, 0), p4 = (10, 0) => distC = 10
 * p2 = (3, 3), p6 = (3, 0) => distA = 3
 * p3 = (7, 3), p5 = (7, 0) => distB = 3
 * EAR = (3 + 3) / (2 * 10) = 6 / 20 = 0.30
 *
 * When closed:
 * p2 = (3, 1.2), p6 = (3, 0) => distA = 1.2
 * p3 = (7, 1.2), p5 = (7, 0) => distB = 1.2
 * EAR = (1.2 + 1.2) / (2 * 10) = 2.4 / 20 = 0.12
 */
function createSyntheticEyePoints(isOpen = true) {
  const height = isOpen ? 3.0 : 1.2;
  return [
    { x: 0, y: 0, z: 0 },       // p1: outer corner
    { x: 3, y: height, z: 0 },  // p2: upper eyelid 1
    { x: 7, y: height, z: 0 },  // p3: upper eyelid 2
    { x: 10, y: 0, z: 0 },      // p4: inner corner
    { x: 7, y: 0, z: 0 },       // p5: lower eyelid 2
    { x: 3, y: 0, z: 0 },       // p6: lower eyelid 1
  ];
}

/**
 * Generates a full 468-point face mesh with customizable eye opening and head orientation
 */
function createSyntheticFaceMesh(options = {}) {
  const {
    isOpen = true,
    yawOffset = 0, // >0 turns head right, <0 turns head left
    pitchOffset = 0, // <0 tilts head down, >0 tilts head up
    rollAngleDeg = 0,
  } = options;

  const landmarks = Array.from({ length: 478 }, () => ({ x: 200, y: 200, z: 0 }));

  // Eyes base positions
  const leftEyeOpenPoints = createSyntheticEyePoints(isOpen);
  const rightEyeOpenPoints = createSyntheticEyePoints(isOpen);

  // Map to left eye indices: [33, 160, 158, 133, 153, 144]
  LEFT_EYE_LANDMARKS.forEach((idx, i) => {
    landmarks[idx] = {
      x: 140 + leftEyeOpenPoints[i].x,
      y: 160 + leftEyeOpenPoints[i].y,
      z: 0,
    };
  });

  // Map to right eye indices: [362, 385, 387, 263, 373, 380]
  RIGHT_EYE_LANDMARKS.forEach((idx, i) => {
    landmarks[idx] = {
      x: 240 + rightEyeOpenPoints[i].x,
      y: 160 + rightEyeOpenPoints[i].y,
      z: 0,
    };
  });

  // Key Head Pose Landmarks
  landmarks[HEAD_POSE_LANDMARKS.FOREHEAD] = { x: 200, y: 100, z: 0 };
  landmarks[HEAD_POSE_LANDMARKS.LEFT_EYE_OUTER] = { x: 140, y: 160, z: 0 };
  landmarks[HEAD_POSE_LANDMARKS.RIGHT_EYE_OUTER] = { x: 250, y: 160, z: 0 };
  landmarks[HEAD_POSE_LANDMARKS.CHIN] = { x: 200, y: 260, z: 0 };
  landmarks[HEAD_POSE_LANDMARKS.LEFT_MOUTH] = { x: 170, y: 220, z: 0 };
  landmarks[HEAD_POSE_LANDMARKS.RIGHT_MOUTH] = { x: 230, y: 220, z: 0 };

  // Nose tip controls yaw and pitch:
  // Base neutral nose is at x = 195 (centered between 140 and 250), y = 190
  const eyeMidX = (140 + 250) / 2.0; // 195
  landmarks[HEAD_POSE_LANDMARKS.NOSE_TIP] = {
    x: eyeMidX + yawOffset,
    y: 188 - pitchOffset,
    z: 0,
  };

  return landmarks;
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('AI Webcam Face Tracking Suite (ai-webcam-tracking.test.ts)', () => {

  // ==========================================================================
  // TIER 1: CORE FEATURE COVERAGE
  // ==========================================================================

  describe('Tier 1: Eye Aspect Ratio (EAR) Algorithm', () => {
    test('T1.1: Calculates EAR on open eyes producing approximately ~0.30', () => {
      const openEye = createSyntheticEyePoints(true);
      const ear = calculateEyeAspectRatio(openEye);

      assert.equal(typeof ear, 'number');
      assert.ok(Math.abs(ear - 0.30) < 0.01, `Expected EAR ~0.30 for open eyes, got ${ear}`);
      assert.ok(ear >= DEFAULT_EAR_THRESHOLD, `Open eye EAR ${ear} should be >= threshold ${DEFAULT_EAR_THRESHOLD}`);
    });

    test('T1.2: Calculates EAR on closed eyes producing approximately ~0.12', () => {
      const closedEye = createSyntheticEyePoints(false);
      const ear = calculateEyeAspectRatio(closedEye);

      assert.equal(typeof ear, 'number');
      assert.ok(Math.abs(ear - 0.12) < 0.01, `Expected EAR ~0.12 for closed eyes, got ${ear}`);
      assert.ok(ear < DEFAULT_EAR_THRESHOLD, `Closed eye EAR ${ear} should be < threshold ${DEFAULT_EAR_THRESHOLD}`);
    });

    test('T1.3: calculateAverageEAR computes mean across left and right eye contours', () => {
      const fullMeshOpen = createSyntheticFaceMesh({ isOpen: true });
      const avgEarOpen = calculateAverageEAR(fullMeshOpen);
      assert.ok(Math.abs(avgEarOpen - 0.30) < 0.01, `Expected average open EAR ~0.30, got ${avgEarOpen}`);

      const fullMeshClosed = createSyntheticFaceMesh({ isOpen: false });
      const avgEarClosed = calculateAverageEAR(fullMeshClosed);
      assert.ok(Math.abs(avgEarClosed - 0.12) < 0.01, `Expected average closed EAR ~0.12, got ${avgEarClosed}`);
    });
  });

  describe('Tier 1: Sleeping / Drowsiness Detection Logic', () => {
    test('T1.4: Normal state when EAR >= 0.20 regardless of duration', () => {
      assert.equal(detectDrowsiness(0.32, 0), false);
      assert.equal(detectDrowsiness(0.28, 5000), false);
      assert.equal(detectDrowsiness(0.25, 10000), false);
      assert.equal(detectDrowsiness(0.21, 20000), false);
    });

    test('T1.5: Eyes closed (< 0.20) for less than 10 seconds is normal (natural blinking)', () => {
      assert.equal(detectDrowsiness(0.12, 0), false);
      assert.equal(detectDrowsiness(0.12, 500), false, '500ms blink is safe');
      assert.equal(detectDrowsiness(0.10, 3000), false, '3s closure not yet sleep');
      assert.equal(detectDrowsiness(0.08, 9999), false, '9999ms boundary must not trigger alert');
    });

    test('T1.6: Eyes closed (< 0.20) continuously for >= 10 seconds triggers sleep alert', () => {
      assert.equal(detectDrowsiness(0.12, 10000), true, 'Exact 10000ms triggers sleep');
      assert.equal(detectDrowsiness(0.09, 12000), true, '12s triggers sleep');
      assert.equal(detectDrowsiness(0.05, 30000), true, '30s deep sleep triggers alert');
    });
  });

  describe('Tier 1: Head Pose Estimation Algorithm (Yaw, Pitch, Roll)', () => {
    test('T1.7: Neutral forward-facing posture yields ~0° Yaw, Pitch, and Roll', () => {
      const neutralFace = createSyntheticFaceMesh({ yawOffset: 0, pitchOffset: 0 });
      const pose = estimateHeadPose(neutralFace);

      assert.ok(Math.abs(pose.yaw) < 5.0, `Expected neutral yaw ~0°, got ${pose.yaw}`);
      assert.ok(Math.abs(pose.pitch) < 8.0, `Expected neutral pitch ~0°, got ${pose.pitch}`);
      assert.ok(Math.abs(pose.roll) < 5.0, `Expected neutral roll ~0°, got ${pose.roll}`);
    });

    test('T1.8: Turning head right produces positive Yaw > 30°', () => {
      // 140 (left eye) to 250 (right eye), half-span is 55. Shift nose right by 35px
      const turnedRightFace = createSyntheticFaceMesh({ yawOffset: 35 });
      const pose = estimateHeadPose(turnedRightFace);

      assert.ok(pose.yaw > 30.0, `Expected yaw > 30°, got ${pose.yaw}`);
    });

    test('T1.9: Turning head left produces negative Yaw < -30°', () => {
      const turnedLeftFace = createSyntheticFaceMesh({ yawOffset: -35 });
      const pose = estimateHeadPose(turnedLeftFace);

      assert.ok(pose.yaw < -30.0, `Expected yaw < -30°, got ${pose.yaw}`);
    });

    test('T1.10: Nodding head down (gục đầu) produces Pitch < -25°', () => {
      // Shifting pitch offset downward by 40px
      const slumpedFace = createSyntheticFaceMesh({ pitchOffset: -40 });
      const pose = estimateHeadPose(slumpedFace);

      assert.ok(pose.pitch < -25.0, `Expected pitch < -25°, got ${pose.pitch}`);
    });
  });

  describe('Tier 1: Looking Away Detection Logic', () => {
    test('T1.11: Looking straight ahead (< 30° yaw, > -25° pitch) never triggers alert', () => {
      assert.equal(detectLookingAway({ yaw: 5, pitch: -2 }, 15000), false);
      assert.equal(detectLookingAway({ yaw: -10, pitch: 5 }, 20000), false);
      assert.equal(detectLookingAway({ yaw: 25, pitch: -10 }, 30000), false);
    });

    test('T1.12: Turning away for less than 10 seconds does not trigger alert', () => {
      assert.equal(detectLookingAway({ yaw: 45, pitch: 0 }, 5000), false);
      assert.equal(detectLookingAway({ yaw: -40, pitch: 0 }, 8000), false);
      assert.equal(detectLookingAway({ yaw: 0, pitch: -30 }, 9999), false);
    });

    test('T1.13: Turning head (Yaw > 30° or Yaw < -30°) for >= 10s triggers look-away alert', () => {
      assert.equal(detectLookingAway({ yaw: 35, pitch: 0 }, 10000), true);
      assert.equal(detectLookingAway({ yaw: -38, pitch: 0 }, 12000), true);
      assert.equal(detectLookingAway([40, 0, 0], 10000), true, 'Supports array input format');
    });

    test('T1.14: Slumping down (Pitch < -25°) for >= 10s triggers look-away alert', () => {
      assert.equal(detectLookingAway({ yaw: 0, pitch: -30 }, 10000), true);
      assert.equal(detectLookingAway({ yaw: 5, pitch: -28 }, 15000), true);
      assert.equal(detectLookingAway([0, -32, 0], 11000), true, 'Supports array input format');
    });
  });

  describe('Tier 1: WebcamFaceMonitor Engine Lifecycle', () => {
    test('T1.15: Monitor starts, stops, pauses, and resumes correctly', () => {
      const monitor = new WebcamFaceMonitor();
      assert.equal(monitor.isRunning, false);
      assert.equal(monitor.currentStatus, 'idle');

      monitor.start();
      assert.equal(monitor.isRunning, true);
      assert.equal(monitor.isPaused, false);
      assert.equal(monitor.currentStatus, 'normal');

      monitor.pause();
      assert.equal(monitor.isPaused, true);

      monitor.resume();
      assert.equal(monitor.isPaused, false);

      monitor.stop();
      assert.equal(monitor.isRunning, false);
      assert.equal(monitor.currentStatus, 'idle');
    });

    test('T1.16: Monitor toggle enables and disables tracking', () => {
      const monitor = new WebcamFaceMonitor({ enabled: true });
      assert.equal(monitor.isEnabled, true);

      const toggledOff = monitor.toggle();
      assert.equal(toggledOff, false);
      assert.equal(monitor.isEnabled, false);

      const toggledOn = monitor.toggle();
      assert.equal(toggledOn, true);
      assert.equal(monitor.isEnabled, true);

      monitor.setEnabled(false);
      assert.equal(monitor.isEnabled, false);
    });
  });

  // ==========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // ==========================================================================

  describe('Tier 2: Boundary & Corner Cases', () => {
    test('T2.1: Degenerate eye points with 0 distance return 0 without NaN or throwing', () => {
      const degeneratePoints = [
        { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 },
        { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }
      ];
      const ear = calculateEyeAspectRatio(degeneratePoints);
      assert.equal(ear, 0);
      assert.ok(!Number.isNaN(ear));
    });

    test('T2.2: Null, undefined, empty array, or truncated landmarks return safe defaults', () => {
      assert.equal(calculateEyeAspectRatio(null), 0);
      assert.equal(calculateEyeAspectRatio([]), 0);
      assert.equal(calculateEyeAspectRatio([{ x: 1, y: 1 }]), 0);

      assert.equal(calculateAverageEAR(null), 0);
      assert.equal(calculateAverageEAR([]), 0);

      const defaultPose = estimateHeadPose(null);
      assert.deepEqual(defaultPose, { yaw: 0, pitch: 0, roll: 0 });

      assert.equal(detectDrowsiness(NaN, 10000), false);
      assert.equal(detectDrowsiness(0.15, NaN), false);
      assert.equal(detectLookingAway(null, 10000), false);
    });

    test('T2.3: Exact millisecond boundaries for duration threshold (9999ms vs 10000ms)', () => {
      // 9999ms is safe
      assert.equal(detectDrowsiness(0.10, 9999, 0.20, 10000), false);
      // 10000ms is violation
      assert.equal(detectDrowsiness(0.10, 10000, 0.20, 10000), true);

      // 9999ms looking away is safe
      assert.equal(detectLookingAway({ yaw: 45, pitch: 0 }, 9999, 10000), false);
      // 10000ms looking away is violation
      assert.equal(detectLookingAway({ yaw: 45, pitch: 0 }, 10000, 10000), true);
    });

    test('T2.4: Extreme head pose angles (e.g. ±90° or beyond) clamp gracefully', () => {
      // Extreme right
      const extremeRightFace = createSyntheticFaceMesh({ yawOffset: 120 });
      const poseRight = estimateHeadPose(extremeRightFace);
      assert.ok(poseRight.yaw > 30.0);
      assert.ok(poseRight.yaw <= 90.0);

      // Extreme left
      const extremeLeftFace = createSyntheticFaceMesh({ yawOffset: -120 });
      const poseLeft = estimateHeadPose(extremeLeftFace);
      assert.ok(poseLeft.yaw < -30.0);
      assert.ok(poseLeft.yaw >= -90.0);
    });

    test('T2.5: Custom thresholds can be configured in evaluation functions', () => {
      // Custom EAR threshold 0.25 and 5s duration
      assert.equal(detectDrowsiness(0.22, 5000, 0.25, 5000), true);
      assert.equal(detectDrowsiness(0.22, 4999, 0.25, 5000), false);

      // Custom Yaw threshold 20° and 3s duration
      assert.equal(
        detectLookingAway({ yaw: 22, pitch: 0 }, 3000, 3000, { yawThreshold: 20 }),
        true
      );
    });

    test('T2.6: euclideanDistance handles 2D, 3D, and missing coordinate fields', () => {
      assert.equal(euclideanDistance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
      assert.equal(euclideanDistance({ x: 0, y: 0, z: 0 }, { x: 1, y: 2, z: 2 }), 3);
      assert.equal(euclideanDistance(null, { x: 5, y: 5 }), 0);
      assert.equal(euclideanDistance({ x: 5, y: 5 }, undefined), 0);
    });
  });

  // ==========================================================================
  // TIER 3: CROSS-FEATURE INTEGRATION
  // ==========================================================================

  describe('Tier 3: Duration Accumulator & Frame Processing Pipeline', () => {
    test('T3.1: Drowsy duration accumulates on closed frames and triggers onSleepDetected', () => {
      let sleepTriggered = false;
      let detectedDuration = 0;

      const monitor = new WebcamFaceMonitor({
        sleepDurationMs: 10000,
        onSleepDetected: (e) => {
          sleepTriggered = true;
          detectedDuration = e.durationMs;
        },
      });

      monitor.start();

      const closedMesh = createSyntheticFaceMesh({ isOpen: false });

      // Frame 1: 3000ms closed
      monitor.processFrame(closedMesh, 3000);
      assert.equal(sleepTriggered, false);
      assert.equal(monitor.drowsyDurationMs, 3000);

      // Frame 2: another 4000ms closed (total 7000ms)
      monitor.processFrame(closedMesh, 4000);
      assert.equal(sleepTriggered, false);
      assert.equal(monitor.drowsyDurationMs, 7000);

      // Frame 3: another 3500ms closed (total 10500ms -> exceeds 10000ms threshold)
      monitor.processFrame(closedMesh, 3500);
      assert.equal(sleepTriggered, true);
      assert.equal(detectedDuration, 10500);
      assert.equal(monitor.currentStatus, 'drowsy');
    });

    test('T3.2: Opening eyes immediately resets drowsy duration to 0 (blink recovery)', () => {
      const monitor = new WebcamFaceMonitor();
      monitor.start();

      const closedMesh = createSyntheticFaceMesh({ isOpen: false });
      const openMesh = createSyntheticFaceMesh({ isOpen: true });

      // Eyes closed for 8000ms
      monitor.processFrame(closedMesh, 8000);
      assert.equal(monitor.drowsyDurationMs, 8000);

      // Student opens eyes (normal frame)
      monitor.processFrame(openMesh, 500);
      assert.equal(monitor.drowsyDurationMs, 0, 'Drowsy counter must reset immediately on eye open');
      assert.equal(monitor.currentStatus, 'normal');
    });

    test('T3.3: Looking away duration accumulates and triggers onFaceAwayDetected', () => {
      let faceAwayTriggered = false;
      const monitor = new WebcamFaceMonitor({
        awayDurationMs: 10000,
        onFaceAwayDetected: () => {
          faceAwayTriggered = true;
        },
      });

      monitor.start();
      const turnedMesh = createSyntheticFaceMesh({ yawOffset: 35, isOpen: true });

      // Frame 1: 5000ms turned away
      monitor.processFrame(turnedMesh, 5000);
      assert.equal(faceAwayTriggered, false);
      assert.equal(monitor.awayDurationMs, 5000);

      // Frame 2: another 5500ms turned away (total 10500ms)
      monitor.processFrame(turnedMesh, 5500);
      assert.equal(faceAwayTriggered, true);
      assert.equal(monitor.currentStatus, 'looking_away');
    });

    test('T3.4: Returning to look straight ahead resets away duration to 0', () => {
      const monitor = new WebcamFaceMonitor();
      monitor.start();

      const turnedMesh = createSyntheticFaceMesh({ yawOffset: 35 });
      const neutralMesh = createSyntheticFaceMesh({ yawOffset: 0 });

      monitor.processFrame(turnedMesh, 7000);
      assert.equal(monitor.awayDurationMs, 7000);

      // Student turns back to face screen
      monitor.processFrame(neutralMesh, 200);
      assert.equal(monitor.awayDurationMs, 0);
      assert.equal(monitor.currentStatus, 'normal');
    });

    test('T3.5: Disabled or paused monitor ignores frames and suppresses callbacks', () => {
      let callbackCount = 0;
      const monitor = new WebcamFaceMonitor({
        enabled: false,
        onSleepDetected: () => { callbackCount++; },
      });

      monitor.start();
      const closedMesh = createSyntheticFaceMesh({ isOpen: false });

      const res = monitor.processFrame(closedMesh, 15000);
      assert.equal(res.ignored, true);
      assert.equal(callbackCount, 0);
      assert.equal(monitor.drowsyDurationMs, 0);
    });
  });

  // ==========================================================================
  // TIER 4: REAL-WORLD STUDENT WORKFLOWS & SUPERVISOR INTEGRATION
  // ==========================================================================

  describe('Tier 4: Real-World Student Workflows & Supervisor Integration', () => {
    test('T4.1: Natural student blink cycle (200ms close every 3s) never triggers sleep alert', () => {
      let sleepTriggered = false;
      const monitor = new WebcamFaceMonitor({
        sleepDurationMs: 10000,
        onSleepDetected: () => { sleepTriggered = true; },
      });
      monitor.start();

      const openMesh = createSyntheticFaceMesh({ isOpen: true });
      const blinkMesh = createSyntheticFaceMesh({ isOpen: false });

      // Simulate 60 seconds of focused study with regular natural blinks
      for (let i = 0; i < 20; i++) {
        monitor.processFrame(openMesh, 2800); // 2.8s focused reading
        monitor.processFrame(blinkMesh, 200); // 200ms natural blink
      }

      assert.equal(sleepTriggered, false, 'Natural blinking must never trigger false sleep alert');
      assert.equal(monitor.currentStatus, 'normal');
    });

    test('T4.2: Student glance (looking away for 4s to write notes, then looking back) never alerts', () => {
      let alertTriggered = false;
      const monitor = new WebcamFaceMonitor({
        awayDurationMs: 10000,
        onFaceAwayDetected: () => { alertTriggered = true; },
      });
      monitor.start();

      const neutralMesh = createSyntheticFaceMesh({ yawOffset: 0 });
      const noteTakingMesh = createSyntheticFaceMesh({ pitchOffset: -35 }); // slumping down to write notes

      // Look at screen 10s
      monitor.processFrame(neutralMesh, 10000);
      // Look down at notebook for 4s
      monitor.processFrame(noteTakingMesh, 4000);
      // Look back up at screen
      monitor.processFrame(neutralMesh, 500);

      assert.equal(alertTriggered, false, 'Brief note-taking under 10s must not alert');
    });

    test('T4.3: Sleep detection triggers SupervisorArbiter roast & Vietnamese TTS quote', () => {
      const arbiter = new SupervisorArbiter(20);
      const character = CHARACTERS['co-giao-chu-nhiem'];
      assert.ok(character, 'Character co-giao-chu-nhiem must exist');

      let speechTriggered = '';
      let violationRegistered = false;

      const monitor = new WebcamFaceMonitor({
        sleepDurationMs: 10000,
        onSleepDetected: () => {
          if (arbiter.canRoast()) {
            arbiter.registerRoast();
            violationRegistered = true;
            const quotes = character.quotes.sleep;
            speechTriggered = quotes[0] || 'Dậy học bài ngay!';
          }
        },
      });

      monitor.start();
      const sleepingMesh = createSyntheticFaceMesh({ isOpen: false });

      // Student falls asleep for 11 seconds
      monitor.processFrame(sleepingMesh, 11000);

      assert.equal(violationRegistered, true);
      assert.ok(speechTriggered.length > 0);
      assert.ok(
        speechTriggered.includes('ngáp') || speechTriggered.includes('ngủ') || speechTriggered.includes('Tỉnh dậy'),
        `Expected Vietnamese scolding quote, got: ${speechTriggered}`
      );
    });

    test('T4.4: Face away detection triggers SupervisorArbiter roast & Vietnamese TTS quote', () => {
      const arbiter = new SupervisorArbiter(20);
      const character = CHARACTERS['sep-kho-tinh'] || CHARACTERS['co-giao-chu-nhiem'];

      let speechTriggered = '';
      let violationRegistered = false;

      const monitor = new WebcamFaceMonitor({
        awayDurationMs: 10000,
        onFaceAwayDetected: () => {
          if (arbiter.canRoast()) {
            arbiter.registerRoast();
            violationRegistered = true;
            const quotes = character.quotes.face_away;
            speechTriggered = quotes[0] || 'Nhìn thẳng vào màn hình!';
          }
        },
      });

      monitor.start();
      const lookingAwayMesh = createSyntheticFaceMesh({ yawOffset: 45 });

      // Student turns head away to chat or look at phone for 12 seconds
      monitor.processFrame(lookingAwayMesh, 12000);

      assert.equal(violationRegistered, true);
      assert.ok(speechTriggered.length > 0);
      const isVietnameseFaceAwayQuote =
        speechTriggered.includes('nghếch') ||
        speechTriggered.includes('Ngó nghiêng') ||
        speechTriggered.includes('màn hình') ||
        speechTriggered.includes('Tập trung') ||
        speechTriggered.includes('thẳng');
      assert.ok(
        isVietnameseFaceAwayQuote,
        `Expected Vietnamese face_away quote, got: ${speechTriggered}`
      );
    });

    test('T4.5: SupervisorArbiter 20s cooldown prevents duplicate rapid scolding', () => {
      const arbiter = new SupervisorArbiter(20);
      let roastCount = 0;

      const monitor = new WebcamFaceMonitor({
        sleepDurationMs: 10000,
        onSleepDetected: () => {
          if (arbiter.canRoast()) {
            arbiter.registerRoast();
            roastCount++;
          }
        },
      });

      monitor.start();
      const sleepMesh = createSyntheticFaceMesh({ isOpen: false });

      // First sleep alert at 10s -> roasts
      monitor.processFrame(sleepMesh, 10000);
      assert.equal(roastCount, 1);

      // Continuous sleep for next 5s -> cooldown active (20s required) -> no double roast
      monitor.processFrame(sleepMesh, 5000);
      assert.equal(roastCount, 1, 'Cooldown must suppress consecutive roast within 20s');
    });

    test('T4.6: Exemption status (requestExemption) suppresses roast even when sleeping', () => {
      const arbiter = new SupervisorArbiter(20);
      arbiter.requestExemption(120); // 2 minutes grace period (e.g. reading textbook)
      assert.equal(arbiter.isExempt(), true);

      let roastCount = 0;
      const monitor = new WebcamFaceMonitor({
        sleepDurationMs: 10000,
        onSleepDetected: () => {
          if (arbiter.canRoast()) {
            arbiter.registerRoast();
            roastCount++;
          }
        },
      });

      monitor.start();
      const sleepMesh = createSyntheticFaceMesh({ isOpen: false });

      // Student looks down at textbook for 15s during active exemption
      monitor.processFrame(sleepMesh, 15000);
      assert.equal(roastCount, 0, 'Active exemption must suppress webcam scolding');
    });

    test('T4.7: Discipline score degrades by 5 points per registered webcam roast', () => {
      const arbiter = new SupervisorArbiter(20);
      // Initial score at 100% completion with 0 roasts is 100
      assert.equal(arbiter.calculateDisciplineScore(25, 25), 100);

      // 1 sleep roast
      arbiter.registerRoast();
      assert.equal(arbiter.calculateDisciplineScore(25, 25), 95);

      // 1 face away roast
      arbiter.registerRoast();
      assert.equal(arbiter.calculateDisciplineScore(25, 25), 90);
    });

    test('T4.8: All 4 supervisor characters possess valid Vietnamese sleep & face_away quotes', () => {
      const characterSlugs = ['co-giao-chu-nhiem', 'sep-kho-tinh', 'tong-tai-lanh-lung', 'anime-tsundere'];
      for (const slug of characterSlugs) {
        const char = CHARACTERS[slug];
        assert.ok(char, `Character ${slug} must be registered`);
        assert.ok(char.quotes.sleep.length > 0, `${slug} must have sleep quotes`);
        assert.ok(char.quotes.face_away.length > 0, `${slug} must have face_away quotes`);

        for (const q of [...char.quotes.sleep, ...char.quotes.face_away]) {
          assert.equal(typeof q, 'string');
          assert.ok(q.length >= 10, 'Quotes must be full descriptive Vietnamese sentences');
        }
      }
    });

    test('T4.9: In-memory local processing guarantee and targetFps frame throttling verification', () => {
      const monitor = new WebcamFaceMonitor({ targetFps: 12 });
      assert.equal(monitor.localProcessingOnly, true, 'Must guarantee 100% local processing');
      assert.equal(monitor.frameIntervalMs, 83, '12fps corresponds to ~83ms interval');

      const telemetry = monitor.getTelemetry();
      assert.equal(typeof telemetry.ear, 'number');
      assert.equal(typeof telemetry.angles.yaw, 'number');
      assert.equal(typeof telemetry.angles.pitch, 'number');
      assert.equal(typeof telemetry.angles.roll, 'number');
      assert.equal(telemetry.status, 'idle');
    });

    test('T4.10: No face detected transitions status to no_face and resets accumulators', () => {
      const monitor = new WebcamFaceMonitor();
      monitor.start();

      const sleepMesh = createSyntheticFaceMesh({ isOpen: false });
      monitor.processFrame(sleepMesh, 5000);
      assert.equal(monitor.drowsyDurationMs, 5000);

      // Face steps away completely (e.g. empty camera frame)
      const noFaceRes = monitor.processFrame(null, 1000);
      assert.equal(noFaceRes.status, 'no_face');
      assert.equal(monitor.drowsyDurationMs, 0, 'Drowsy counter resets when face is not detected');
      assert.equal(monitor.awayDurationMs, 0, 'Away counter resets when face is not detected');
    });
  });
});

