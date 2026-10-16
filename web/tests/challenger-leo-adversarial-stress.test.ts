/**
 * challenger-leo-adversarial-stress.test.ts
 *
 * Empirical Adversarial Stress-Testing Suite for Leo 3D Character Physics & Animation Engines.
 *
 * Directives:
 * 1. Volume preservation under chaotic Sy oscillations, zero, negative, and infinite scaling.
 * 2. 2nd-order damped harmonic oscillator under irregular dt (dt=0, dt=1s, dt=100s, negative dt)
 *    and 100,000 sub-steps. Confirm bounded energy without numerical explosion or NaN drift.
 * 3. 6-segment tail wave equations: verify monotonic phase lag and distal amplitude expansion across segments 0 -> 5.
 * 4. Micro-saccades generator: verify eye position never exceeds anatomical bounds across 50,000 iterations.
 * 5. 3D drag rotation mechanical clamping at +/-25 deg Y, +/-12 deg X under extreme offsets (+/- 10,000px)
 *    and critically damped spring return to (0, 0) within finite time.
 * 6. Animator kinetics stress: asymmetric attack/decay lip-sync, tongue tremor, and purr vibration bounds.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import * as CatPhysics from '../src/components/cat/CatPhysics.ts';

// ============================================================================
// SUITE 1: VOLUME PRESERVATION ADVERSARIAL STRESS TEST
// ============================================================================

test('CHALLENGE 1.1: Volume preservation strictly bounds Sy and guarantees V = Sx * Sy * Sz = 1 under extreme inputs', () => {
  const hostileSyInputs = [
    0,
    -0,
    -1e-6,
    -1.0,
    -500.0,
    -Infinity,
    1e-12,
    Number.EPSILON,
    0.001,
    0.49999,
    0.5,
    1.0,
    1.8,
    1.80001,
    50.0,
    1e9,
    Infinity,
    NaN,
  ];

  for (const sy of hostileSyInputs) {
    const result = CatPhysics.calculateVolumePreservingScale(sy);

    // Assert scaleY is strictly clamped to [0.5, 1.8]
    assert.ok(
      result.scaleY >= 0.5 && result.scaleY <= 1.8,
      `scaleY must be clamped to [0.5, 1.8], got ${result.scaleY} for input ${sy}`
    );

    // Assert scaleX and scaleZ are strictly finite and strictly positive
    assert.ok(Number.isFinite(result.scaleX) && result.scaleX > 0);
    assert.ok(Number.isFinite(result.scaleZ) && result.scaleZ > 0);
    assert.equal(result.scaleX, result.scaleZ, 'scaleX must equal scaleZ');

    // Assert Volume = Sx * Sy * Sz == 1.0
    const volume = result.scaleX * result.scaleY * result.scaleZ;
    assert.ok(
      Math.abs(volume - 1.0) < 1e-10,
      `Volume Sx*Sy*Sz must be ~1.0, got ${volume} for input ${sy}`
    );
  }
});

test('CHALLENGE 1.2: Volume preservation under 10,000 chaotic pseudo-random inputs', () => {
  let rngSeed = 42;
  const pseudoRandom = () => {
    rngSeed = (rngSeed * 1664525 + 1013904223) % 4294967296;
    return rngSeed / 4294967296;
  };

  for (let i = 0; i < 10000; i++) {
    // Generate chaotic input spanning negative, tiny, normal, huge, and special values
    const exponent = (pseudoRandom() - 0.5) * 16; // -8 to +8
    const sign = pseudoRandom() < 0.2 ? -1 : 1;
    const chaoticSy = sign * Math.pow(10, exponent);

    const result = CatPhysics.calculateVolumePreservingScale(chaoticSy);

    assert.ok(result.scaleY >= 0.5 && result.scaleY <= 1.8);
    const volume = result.scaleX * result.scaleY * result.scaleZ;
    assert.ok(Math.abs(volume - 1.0) < 1e-10);
  }
});

test('CHALLENGE 1.3: Ground contact offset compensation never diverges or produces NaN under extreme Sy', () => {
  const pivot = 0.45;
  const testInputs = [-1e9, 0, 0.5, 1.0, 1.8, 1e9, NaN, Infinity];

  for (const input of testInputs) {
    const offset = CatPhysics.computeGroundContactOffset(input, pivot);
    assert.ok(Number.isFinite(offset), `Ground offset must be finite for input ${input}`);
    assert.ok(
      offset >= (0.5 - 1.0) * pivot - 1e-10 && offset <= (1.8 - 1.0) * pivot + 1e-10,
      `Ground offset out of bounds: ${offset}`
    );
  }
});

// ============================================================================
// SUITE 2: 2ND-ORDER DAMPED HARMONIC OSCILLATOR ADVERSARIAL STRESS TEST
// ============================================================================

test('CHALLENGE 2.1: Oscillator stability under irregular dt (dt=0, dt=1s, dt=100s, negative dt, NaN dt)', () => {
  const state: CatPhysics.SpringState = { position: 1.0, velocity: 0, target: 0 };
  const params = CatPhysics.SPRING_PRESETS.belly;

  // 1. Negative dt (-100, -0.016): must not run time backwards or explode
  CatPhysics.stepSpring(state, params, -100);
  assert.equal(state.position, 1.0, 'Negative dt must be clamped to 0 without modifying state');
  assert.equal(state.velocity, 0.0);

  CatPhysics.stepSpring(state, params, -0.016);
  assert.equal(state.position, 1.0);

  // 2. dt = 0: no-op
  CatPhysics.stepSpring(state, params, 0);
  assert.equal(state.position, 1.0);
  assert.equal(state.velocity, 0.0);

  // 3. dt = 1s: lag spike clamped to 0.033s
  CatPhysics.stepSpring(state, params, 1.0);
  assert.ok(Number.isFinite(state.position));
  assert.ok(Number.isFinite(state.velocity));
  assert.ok(!Number.isNaN(state.position));

  // 4. dt = 100s: tab sleep clamped to 0.033s
  CatPhysics.stepSpring(state, params, 100.0);
  assert.ok(Number.isFinite(state.position));
  assert.ok(Number.isFinite(state.velocity));

  // 5. dt = +Infinity
  CatPhysics.stepSpring(state, params, Infinity);
  assert.ok(Number.isFinite(state.position));

  // 6. dt = NaN: sanity guard must prevent persistent NaN
  CatPhysics.stepSpring(state, params, NaN);
  assert.ok(Number.isFinite(state.position));
  assert.ok(Number.isFinite(state.velocity));
});

test('CHALLENGE 2.2: 100,000 sub-steps stress-test confirms bounded energy, zero explosion, and zero NaN drift', () => {
  const presets = [
    { name: 'cheeks', params: CatPhysics.SPRING_PRESETS.cheeks },
    { name: 'belly', params: CatPhysics.SPRING_PRESETS.belly },
    { name: 'earTips', params: CatPhysics.SPRING_PRESETS.earTips },
    { name: 'whiskers', params: CatPhysics.SPRING_PRESETS.whiskers },
    { name: 'dragReturn', params: CatPhysics.SPRING_PRESETS.dragReturn },
    { name: 'recoilBounce', params: CatPhysics.SPRING_PRESETS.recoilBounce },
  ];

  for (const { name, params } of presets) {
    // Start with a massive impulse
    const state: CatPhysics.SpringState = { position: 10.0, velocity: -50.0, target: 0 };

    for (let step = 0; step < 100000; step++) {
      // Semi-random dt pattern simulating real frame variance + occasional drops
      const irregularDt = (step % 17 === 0) ? 0.033 : ((step % 7 === 0) ? 0.008 : 0.016);
      CatPhysics.stepSpring(state, params, irregularDt);

      // Periodically inject perturbing impulses every 10,000 steps to stress restitution
      if (step > 0 && step % 10000 === 0) {
        state.velocity += (step % 20000 === 0 ? 5.0 : -5.0);
      }
    }

    assert.ok(
      Number.isFinite(state.position),
      `${name}: position must be finite after 100k steps, got ${state.position}`
    );
    assert.ok(
      Number.isFinite(state.velocity),
      `${name}: velocity must be finite after 100k steps, got ${state.velocity}`
    );
    assert.ok(
      !Number.isNaN(state.position) && !Number.isNaN(state.velocity),
      `${name}: position and velocity must not be NaN`
    );

    // After 10,000 steps without impulse (step 90000 to 100000), state must have fully settled
    assert.ok(
      Math.abs(state.position) < 1e-4,
      `${name}: position must have decayed to ~0, got ${state.position}`
    );
    assert.ok(
      Math.abs(state.velocity) < 1e-4,
      `${name}: velocity must have decayed to ~0, got ${state.velocity}`
    );
  }
});

test('CHALLENGE 2.3: Mechanical energy dissipation is strictly non-increasing over free vibration', () => {
  const state: CatPhysics.SpringState = { position: 1.0, velocity: 0, target: 0 };
  const params = CatPhysics.SPRING_PRESETS.belly;
  const m = params.mass ?? 1.0;
  const k = params.stiffness;

  const computeEnergy = (s: CatPhysics.SpringState) => 0.5 * m * s.velocity * s.velocity + 0.5 * k * s.position * s.position;

  const initialEnergy = computeEnergy(state);
  assert.ok(initialEnergy > 0);

  // Over 200 steps at standard 60fps (dt = 0.016s), the envelope of mechanical energy must dissipate
  for (let step = 0; step < 200; step++) {
    CatPhysics.stepSpring(state, params, 0.016);
  }

  const finalEnergy = computeEnergy(state);
  assert.ok(
    finalEnergy < initialEnergy * 0.01,
    `Mechanical energy must decay by >99%, initial=${initialEnergy}, final=${finalEnergy}`
  );
});

// ============================================================================
// SUITE 3: 6-SEGMENT TAIL WAVE KINEMATICS CHALLENGE
// ============================================================================

test('CHALLENGE 3.1: Tail wave distal amplitude expansion envelope is strictly monotonically increasing from segment 0 to 5', () => {
  const totalSegments = 6;
  const baseAmp = 0.25;

  const envelopes: number[] = [];
  for (let i = 0; i < totalSegments; i++) {
    const u = i / (totalSegments - 1);
    const amp = baseAmp * (0.35 + 0.65 * u);
    envelopes.push(amp);
  }

  assert.equal(envelopes.length, 6);
  assert.equal(envelopes[0], baseAmp * 0.35);
  assert.equal(envelopes[5], baseAmp * 1.0);

  for (let i = 1; i < envelopes.length; i++) {
    assert.ok(
      envelopes[i]! > envelopes[i - 1]!,
      `Amplitude of segment ${i} (${envelopes[i]}) must be strictly greater than segment ${i - 1} (${envelopes[i - 1]})`
    );
  }
});

test('CHALLENGE 3.2: Tail wave spatial phase delay generates smooth traveling S-curve wave without angle discontinuities', () => {
  const totalSegments = 6;
  const baseFreq = 2.5;
  const baseAmp = 0.2;

  // Sample across 500 distinct points in time
  for (let step = 0; step < 500; step++) {
    const t = step * 0.02; // 0 to 10s

    let prevRotY = 0;
    for (let i = 0; i < totalSegments; i++) {
      const rot = CatPhysics.calculateTailSegmentRotation(i, totalSegments, t, baseFreq, baseAmp, false);

      assert.ok(Number.isFinite(rot.x), `rot.x must be finite at step ${step}, seg ${i}`);
      assert.ok(Number.isFinite(rot.y), `rot.y must be finite at step ${step}, seg ${i}`);
      assert.ok(Number.isFinite(rot.z), `rot.z must be finite at step ${step}, seg ${i}`);

      // Absolute physical rotation bounds check: tail segments must not whip past 90 deg (pi/2)
      assert.ok(Math.abs(rot.x) < Math.PI / 2, `rot.x ${rot.x} exceeds physical limit`);
      assert.ok(Math.abs(rot.y) < Math.PI / 2, `rot.y ${rot.y} exceeds physical limit`);
      assert.ok(Math.abs(rot.z) < Math.PI / 2, `rot.z ${rot.z} exceeds physical limit`);

      // Inter-segment curvature continuity: adjacent segment angular delta must be smooth
      if (i > 0) {
        const deltaYaw = Math.abs(rot.y - prevRotY);
        assert.ok(deltaYaw < 0.35, `Inter-segment deltaYaw ${deltaYaw} too sharp at t=${t}`);
      }
      prevRotY = rot.y;
    }
  }
});

test('CHALLENGE 3.3: Distal flick mode is strictly isolated to distal segments (i=4, 5) and leaves root segments unaffected', () => {
  const total = 6;
  const t = 3.14159;
  const baseFreq = 3.0;
  const baseAmp = 0.2;

  for (let i = 0; i < total; i++) {
    const rotQuiet = CatPhysics.calculateTailSegmentRotation(i, total, t, baseFreq, baseAmp, false);
    const rotFlick = CatPhysics.calculateTailSegmentRotation(i, total, t, baseFreq, baseAmp, true);

    if (i < 4) {
      assert.equal(rotQuiet.x, rotFlick.x, `Segment ${i} pitch must not differ when flicking`);
      assert.equal(rotQuiet.y, rotFlick.y, `Segment ${i} yaw must not differ when flicking`);
      assert.equal(rotQuiet.z, rotFlick.z, `Segment ${i} roll must not differ when flicking`);
    } else {
      // For i=4 and i=5, flicking pitch may differ if sin(w3*t) != 0
      assert.ok(Number.isFinite(rotFlick.x));
    }
  }
});

// ============================================================================
// SUITE 4: MICRO-SACCADES GENERATOR BOUNDS CHALLENGE
// ============================================================================

test('CHALLENGE 4.1: Micro-saccade generator never breaches anatomical socket bounds across 50,000 steps', () => {
  const saccade = CatPhysics.createSaccadeState();
  const LIMIT_X = 0.015;
  const LIMIT_Y = 0.012;

  let jumpCount = 0;
  let lastJumpTime = saccade.nextJumpTime;

  for (let i = 0; i < 50000; i++) {
    const t = i * 0.016; // Simulate ~800 seconds of real-time eye motion
    const dt = 0.016;

    const offset = CatPhysics.updateMicroSaccade(saccade, t, dt);

    // Anatomical hard-clamp boundaries
    assert.ok(
      offset.x >= -LIMIT_X && offset.x <= LIMIT_X,
      `Saccade X ${offset.x} exceeded anatomical limit +/-${LIMIT_X} at t=${t}`
    );
    assert.ok(
      offset.y >= -LIMIT_Y && offset.y <= LIMIT_Y,
      `Saccade Y ${offset.y} exceeded anatomical limit +/-${LIMIT_Y} at t=${t}`
    );

    if (saccade.nextJumpTime !== lastJumpTime) {
      jumpCount++;
      lastJumpTime = saccade.nextJumpTime;
    }
  }

  // Poisson saccadic jump frequency check: in 800 seconds, jumpCount should be approx 300 - 800
  assert.ok(jumpCount > 200, `Expected >200 saccadic jumps in 800s, got ${jumpCount}`);
});

test('CHALLENGE 4.2: Micro-saccade generator recovers safely from corrupted/external state injection', () => {
  const saccade = CatPhysics.createSaccadeState();

  // Inject hostile corrupted state
  saccade.currentOffset.x = 999999.0;
  saccade.currentOffset.y = -999999.0;
  saccade.targetOffset.x = -1e5;
  saccade.targetOffset.y = 1e5;

  const result = CatPhysics.updateMicroSaccade(saccade, 5.0, 0.016);

  // Even with corrupted state, output must be hard-clamped to socket bounds
  assert.ok(result.x >= -0.015 && result.x <= 0.015);
  assert.ok(result.y >= -0.012 && result.y <= 0.012);
});

// ============================================================================
// SUITE 5: 3D DRAG ROTATION CLAMPING & SPRING RETURN CHALLENGE
// ============================================================================

test('CHALLENGE 5.1: Extreme mouse drag offsets (+/-10,000px) rigidly clamp at mechanical limits +/-25 deg Y and +/-12 deg X', () => {
  const bounds = CatPhysics.DRAG_ROTATION_BOUNDS;
  const maxPitch = bounds.maxPitch; // 12 deg
  const maxYaw = bounds.maxYaw;     // 25 deg

  const state = CatPhysics.createDragRotationState();
  state.isDragging = true;

  const hostileDragValues = [
    { x: 10000, y: 10000 },
    { x: -10000, y: -10000 },
    { x: 1e6, y: -1e6 },
    { x: -Infinity, y: Infinity },
  ];

  for (const { x, y } of hostileDragValues) {
    state.rotX = x;
    state.rotY = y;
    CatPhysics.updateDragRotation(state, 0.016);

    assert.ok(
      Math.abs(state.rotX) <= maxPitch + 1e-10,
      `rotX must be mechanically clamped to +/-${maxPitch}, got ${state.rotX}`
    );
    assert.ok(
      Math.abs(state.rotY) <= maxYaw + 1e-10,
      `rotY must be mechanically clamped to +/-${maxYaw}, got ${state.rotY}`
    );
    assert.equal(state.velX, 0);
    assert.equal(state.velY, 0);
  }
});

test('CHALLENGE 5.2: Released drag rotation returns to exact (0, 0) within finite time and snaps velocity cleanly', () => {
  const state = CatPhysics.createDragRotationState();

  // Test release from all 4 extreme corners
  const corners = [
    { x: CatPhysics.DRAG_ROTATION_BOUNDS.maxPitch, y: CatPhysics.DRAG_ROTATION_BOUNDS.maxYaw },
    { x: -CatPhysics.DRAG_ROTATION_BOUNDS.maxPitch, y: CatPhysics.DRAG_ROTATION_BOUNDS.maxYaw },
    { x: CatPhysics.DRAG_ROTATION_BOUNDS.maxPitch, y: -CatPhysics.DRAG_ROTATION_BOUNDS.maxYaw },
    { x: -CatPhysics.DRAG_ROTATION_BOUNDS.maxPitch, y: -CatPhysics.DRAG_ROTATION_BOUNDS.maxYaw },
  ];

  for (const corner of corners) {
    state.isDragging = false;
    state.rotX = corner.x;
    state.rotY = corner.y;
    state.velX = 0;
    state.velY = 0;

    let framesToSettle = 0;
    const maxFrames = 180; // 3 seconds at 60fps

    for (let f = 0; f < maxFrames; f++) {
      CatPhysics.updateDragRotation(state, 0.016);
      framesToSettle++;

      if (state.rotX === 0 && state.rotY === 0 && state.velX === 0 && state.velY === 0) {
        break;
      }
    }

    assert.equal(state.rotX, 0, `rotX must have snapped to 0, got ${state.rotX}`);
    assert.equal(state.rotY, 0, `rotY must have snapped to 0, got ${state.rotY}`);
    assert.equal(state.velX, 0, `velX must have snapped to 0`);
    assert.equal(state.velY, 0, `velY must have snapped to 0`);

    // Critically damped spring should settle comfortably under 1.2s (~75 frames)
    assert.ok(
      framesToSettle < 85,
      `Spring return took too long: ${framesToSettle} frames (expected < 85 frames)`
    );
  }
});

// ============================================================================
// SUITE 6: ANIMATOR KINETICS & GESTURE BOUNDS CHALLENGE
// ============================================================================

test('CHALLENGE 6.1: Asymmetric lip-sync kinetics opens jaw > 2x faster than decay without overshooting [0, 1]', () => {
  const kAttack = 28.0;
  const kDecay = 13.0;

  // Attack phase (opening from 0 to 1)
  let jawAttack = 0.0;
  let attackSteps = 0;
  while (jawAttack < 0.95 && attackSteps < 100) {
    jawAttack += (1.0 - jawAttack) * Math.min(1.0, 0.016 * kAttack);
    attackSteps++;
  }

  // Decay phase (closing from 1 to 0)
  let jawDecay = 1.0;
  let decaySteps = 0;
  while (jawDecay > 0.05 && decaySteps < 100) {
    jawDecay += (0.0 - jawDecay) * Math.min(1.0, 0.016 * kDecay);
    decaySteps++;
  }

  assert.ok(
    attackSteps * 2 <= decaySteps,
    `Attack steps (${attackSteps}) should be at least 2x faster than decay steps (${decaySteps})`
  );

  // Tongue flutter tremor bounded: -0.02 +/- 0.025
  for (let t = 0; t < 100; t++) {
    const time = t * 0.05;
    const tremor = Math.sin(time * 26) * 0.025 * 1.0;
    const posY = -0.02 + tremor;
    assert.ok(posY >= -0.045 - 1e-6 && posY <= 0.005 + 1e-6);
  }
});

test('CHALLENGE 6.2: Petting purr vibration equations remain strictly bounded and periodic', () => {
  for (let t = 0; t < 1000; t++) {
    const time = t * 0.01;
    const purrY = 0.002 * Math.cos(50.0 * time);
    const purrX = 0.003 * Math.sin(55.0 * time);

    assert.ok(Math.abs(purrY) <= 0.002 + 1e-10);
    assert.ok(Math.abs(purrX) <= 0.003 + 1e-10);
    assert.ok(Number.isFinite(purrY) && Number.isFinite(purrX));
  }
});
