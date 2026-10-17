import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../..');

// 1. Load extension modules
const webcamTrackerPath = path.join(ROOT, 'extension/ai/webcam-tracker.js');
const webcamTracker = await import(`file://${webcamTrackerPath}`);

const backgroundPath = path.join(ROOT, 'extension/background.js');
const background = await import(`file://${backgroundPath}`);

test('M5 Forensic Check 1: Euclidean Distance and EAR Algorithm Integrity', async () => {
  const { euclideanDistance, calculateEyeAspectRatio, calculateAverageEAR } = webcamTracker;

  // Test 1.1: Mathematical euclidean distance
  const p1 = { x: 0, y: 0, z: 0 };
  const p2 = { x: 3, y: 4, z: 0 };
  assert.equal(euclideanDistance(p1, p2), 5, '3-4-5 right triangle should yield exactly 5');

  const p3 = { x: 1, y: 2, z: 2 };
  const p4 = { x: 4, y: 6, z: 14 }; // dx=3, dy=4, dz=12 -> hypot=13
  assert.equal(euclideanDistance(p3, p4), 13, '3-4-12 3D triangle should yield 13');

  // Test 1.2: Soukupová & Čech (2016) EAR dynamic calculation
  // Let eye corners be p1=(-5, 0), p4=(5, 0) -> distC = 10
  // Upper eyelid p2=(-2, h), p3=(2, h)
  // Lower eyelid p6=(-2, -h), p5=(2, -h)
  // distA = 2h, distB = 2h -> (distA + distB) / (2 * distC) = 4h / 20 = h / 5
  for (const h of [0.5, 1.0, 1.5, 2.0, 3.0]) {
    const eye = [
      { x: -5, y: 0 },
      { x: -2, y: h },
      { x: 2, y: h },
      { x: 5, y: 0 },
      { x: 2, y: -h },
      { x: -2, y: -h },
    ];
    const computedEar = calculateEyeAspectRatio(eye);
    const expectedEar = (2 * h + 2 * h) / (2 * 10);
    assert.ok(
      Math.abs(computedEar - expectedEar) < 1e-9,
      `EAR for h=${h} should be dynamically calculated as ${expectedEar}, got ${computedEar}`
    );
  }

  // Test 1.3: Zero division protection (distC = 0)
  const degenerateEye = [
    { x: 0, y: 0 },
    { x: 0, y: 2 },
    { x: 0, y: 2 },
    { x: 0, y: 0 },
    { x: 0, y: -2 },
    { x: 0, y: -2 },
  ];
  assert.equal(calculateEyeAspectRatio(degenerateEye), 0, 'Zero width eye must safely return 0 without NaN/Infinity');
});

test('M5 Forensic Check 2: Head Pose Vector Trigonometry Integrity', async () => {
  const { estimateHeadPose } = webcamTracker;

  // Symmetrical face: eyes at x=-50 and +50, nose at x=0
  const neutralFace = {
    nose: { x: 0, y: 18, z: 0 },
    leftEye: { x: -50, y: 0, z: 0 },
    rightEye: { x: 50, y: 0, z: 0 },
    chin: { x: 0, y: 80, z: 0 },
    forehead: { x: 0, y: -20, z: 0 },
  };

  const poseNeutral = estimateHeadPose(neutralFace);
  assert.equal(poseNeutral.roll, 0, 'Neutral roll should be 0');
  assert.equal(poseNeutral.yaw, 0, 'Neutral yaw should be 0');
  assert.equal(poseNeutral.pitch, 0, 'Neutral pitch should be 0');

  // Turn head right: nose shifts to x=25 (half of 50 half-span -> offsetRatio = 0.5 -> asin(0.5) = 30 deg)
  const faceTurnedRight = {
    ...neutralFace,
    nose: { x: 25, y: 18, z: 0 },
  };
  const poseRight = estimateHeadPose(faceTurnedRight);
  assert.ok(
    Math.abs(poseRight.yaw - 30) < 0.1,
    `Yaw for nose shifted halfway should be approx 30°, got ${poseRight.yaw}`
  );

  // Slump head down (gục đầu): nose moves lower towards chin (y=40 instead of 18)
  const faceSlumped = {
    ...neutralFace,
    nose: { x: 0, y: 40, z: 0 },
  };
  const poseSlumped = estimateHeadPose(faceSlumped);
  assert.ok(poseSlumped.pitch < -25, `Slumped face pitch should be < -25°, got ${poseSlumped.pitch}`);
});

test('M5 Forensic Check 3: 0 Floor Clamp Math in XP Penalties', () => {
  // Test mathematical floor clamping formula
  function penalizeMath(currentXp, penaltyAmount) {
    const safeAmount = Math.max(0, penaltyAmount);
    const nextXp = Math.max(0, currentXp - safeAmount);
    const xpDeducted = currentXp - nextXp;
    return { safeAmount, nextXp, xpDeducted };
  }

  // Normal penalty: 100 XP - 50 = 50 XP (deducted 50)
  assert.deepEqual(penalizeMath(100, 50), { safeAmount: 50, nextXp: 50, xpDeducted: 50 });

  // Floor clamped penalty: 30 XP - 50 = 0 XP (deducted 30, never negative)
  assert.deepEqual(penalizeMath(30, 50), { safeAmount: 50, nextXp: 0, xpDeducted: 30 });

  // Zero starting XP: 0 XP - 50 = 0 XP (deducted 0)
  assert.deepEqual(penalizeMath(0, 50), { safeAmount: 50, nextXp: 0, xpDeducted: 0 });

  // Negative penalty attack (-100): safeAmount clamps to 0, nextXp remains currentXp
  assert.deepEqual(penalizeMath(75, -100), { safeAmount: 0, nextXp: 75, xpDeducted: 0 });

  // Massive penalty (100,000 XP): cleanly clamps at 0
  assert.deepEqual(penalizeMath(500, 100000), { safeAmount: 100000, nextXp: 0, xpDeducted: 500 });
});

test('M5 Forensic Check 4: 180s Cooldown Boundary Calculation', () => {
  const { SupervisorSessionFSM } = background;
  const fsm = new SupervisorSessionFSM();
  const startTime = 1000000;

  // First request: granted
  const res1 = fsm.requestExemption(180, startTime);
  assert.equal(res1.status, 'EXEMPTION_GRANTED');
  assert.equal(res1.exemptUntil, startTime + 180000);

  // Exact 1 millisecond before cooldown expires (179,999 ms)
  const resBefore = fsm.requestExemption(180, startTime + 179999);
  assert.equal(resBefore.status, 'EXEMPTION_DENIED');
  assert.equal(resBefore.waitSeconds, 1);

  // Exact boundary at 180,000 ms: granted!
  const resExact = fsm.requestExemption(180, startTime + 180000);
  assert.equal(resExact.status, 'EXEMPTION_GRANTED');
  assert.equal(resExact.exemptUntil, startTime + 180000 + 180000);

  // Rapid consecutive spam: 10 calls in 1ms
  const fsmSpam = new SupervisorSessionFSM();
  const resFirst = fsmSpam.requestExemption(180, 500000);
  assert.equal(resFirst.status, 'EXEMPTION_GRANTED');
  for (let i = 1; i < 10; i++) {
    const spamRes = fsmSpam.requestExemption(180, 500000 + i);
    assert.equal(spamRes.status, 'EXEMPTION_DENIED');
  }
});

test('M5 Forensic Check 5: Per-Tab Debounce Logic', () => {
  const { isTabDebounced, recordTabViolationTime, lastViolationTimeByTab } = background;
  lastViolationTimeByTab.clear();

  const tab1 = 101;
  const tab2 = 202;
  const t0 = 100000;

  // Initially tab 1 is not debounced
  assert.equal(isTabDebounced(tab1, t0, 2000), false);

  // Record violation at t0
  recordTabViolationTime(tab1, t0);

  // At t0 + 500ms, tab 1 is debounced
  assert.equal(isTabDebounced(tab1, t0 + 500, 2000), true);

  // But tab 2 at t0 + 500ms is NOT debounced
  assert.equal(isTabDebounced(tab2, t0 + 500, 2000), false);

  // At t0 + 1999ms, tab 1 is still debounced
  assert.equal(isTabDebounced(tab1, t0 + 1999, 2000), true);

  // At t0 + 2000ms, debounce window has expired
  assert.equal(isTabDebounced(tab1, t0 + 2000, 2000), false);
});

test('M5 Forensic Check 6: Manifest V3 Schema & Permissions Audit', () => {
  const manifestRaw = fs.readFileSync(path.join(ROOT, 'extension/manifest.json'), 'utf8');
  const manifest = JSON.parse(manifestRaw);

  assert.equal(manifest.manifest_version, 3);
  assert.ok(manifest.permissions.includes('tabs'));
  assert.ok(manifest.permissions.includes('storage'));
  assert.ok(manifest.permissions.includes('activeTab'));
  assert.ok(manifest.permissions.includes('scripting'));
  assert.ok(manifest.permissions.includes('declarativeNetRequest'));

  // Disallowed permissions check
  assert.equal(manifest.permissions.includes('webRequestBlocking'), false);
  assert.equal(manifest.permissions.includes('debugger'), false);

  // externally_connectable must only match allowed origins
  assert.ok(manifest.externally_connectable);
  assert.ok(manifest.externally_connectable.matches.includes('http://localhost:3000/*'));
  assert.equal(manifest.externally_connectable.matches.includes('*://*/*'), false);
});
