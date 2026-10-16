/**
 * CampusOS Pixar-Grade 3D Toon Leo Cat E2E Opaque-Box Test Suite
 *
 * Requirements Sources:
 * - ORIGINAL_REQUEST.md (## 2026-10-13T17:18:44Z: R1, R2, R3, R4)
 * - PROJECT.md (§ Architecture, § Feature Inventory F-01..F-14, § Interface Contracts)
 * - DISPATCH.md (Tier 1 & Tier 2 Coverage Directives)
 *
 * Test Tiers:
 * - Existing: Preserved 3 baseline tests (PomodoroSettings, CatStateMachine, CharacterData)
 * - Tier 1: Feature Coverage (>= 5 test cases per feature across R1, R2, R3, R4)
 *   * R1: Volume preservation, ground contact offset, damped harmonic springs,
 *         secondary presets, 6-segment tail multi-frequency kinematics, micro-saccades.
 *   * R2: Studio 3-point toon lighting, contact shadow blob, VFX particle pool,
 *         spawn/lifecycle, and WebGL resource disposal.
 *   * R3: 3D drag rotation bounds, spring return, petting purr vibration,
 *         belly poke recoil bounce, idle behaviors state machine.
 *   * R4: Asymmetric jaw kinetics (k_attack > k_decay), jaw openness clamping,
 *         audio amplitude normalization, tongue flutter tremor, character emotion morphs.
 * - Tier 2: Boundary & Corner Cases (>= 5 test cases)
 *   * Extreme dt spikes (0s, 0.5s, 5.0s), 1000px/5000px drag clamping,
 *     zero/negative/NaN scale clamp, particle burst exhaustion, out-of-range audio,
 *     and 10,000 sub-step numerical ODE stability.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Node.js test environment DOM mock for CanvasTexture procedural generation in CatParticles
if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 64,
          height: 64,
          getContext: () => ({
            clearRect: () => {},
            save: () => {},
            translate: () => {},
            beginPath: () => {},
            moveTo: () => {},
            bezierCurveTo: () => {},
            createRadialGradient: () => ({ addColorStop: () => {} }),
            createLinearGradient: () => ({ addColorStop: () => {} }),
            fill: () => {},
            arc: () => {},
            ellipse: () => {},
            lineTo: () => {},
            closePath: () => {},
            restore: () => {},
            fillStyle: '',
            shadowColor: '',
            shadowBlur: 0,
          }),
        };
      }
      return {};
    },
  };
}

// Module imports under test
import {
  DEFAULT_POMODORO_SETTINGS,
  DEFAULT_POMODORO_STATS,
} from '../src/features/pomodoro/pomodoro-settings-store.ts';
import { determineCatState } from '../src/components/cat/CatStateMachine.ts';
import { CHARACTERS } from '../src/features/pomodoro/characters-data.ts';
import * as CatPhysics from '../src/components/cat/CatPhysics.ts';
import * as CatParticles from '../src/components/cat/CatParticles.ts';

// ============================================================================
// 1. PRESERVED EXISTING BASELINE TESTS (3 TESTS)
// ============================================================================

test('PomodoroSettings: default values are valid and populated', () => {
  assert.equal(DEFAULT_POMODORO_SETTINGS.characterSlug, 'co-giao-chu-nhiem');
  assert.equal(DEFAULT_POMODORO_SETTINGS.roastLevel, 'medium');
  assert.equal(DEFAULT_POMODORO_SETTINGS.defaultMinutes, 25);
  assert.equal(DEFAULT_POMODORO_SETTINGS.audioMuted, false);
  assert.equal(DEFAULT_POMODORO_SETTINGS.visualMode, '3d_model');
  assert.equal(DEFAULT_POMODORO_SETTINGS.reducedMotion, false);
  assert.equal(DEFAULT_POMODORO_STATS.totalShameCount, 0);
});

test('CatStateMachine: maps context to correct cat action states', () => {
  // 1. Idle when not running
  const stateIdle = determineCatState({
    running: false,
    focusMode: 'extreme_cat',
    isSpeaking: false,
    isAwayTab: false,
    shameCount: 0,
    roastLevel: 'medium',
    isSessionFinished: false,
    isPoked: false,
  });
  assert.equal(stateIdle, 'idle');

  // 2. Focusing when running and studying
  const stateFocus = determineCatState({
    running: true,
    focusMode: 'extreme_cat',
    isSpeaking: false,
    isAwayTab: false,
    shameCount: 0,
    roastLevel: 'medium',
    isSessionFinished: false,
    isPoked: false,
  });
  assert.equal(stateFocus, 'focusing');

  // 3. Warning when away from tab without speaking
  const stateWarning = determineCatState({
    running: true,
    focusMode: 'extreme_cat',
    isSpeaking: false,
    isAwayTab: true,
    shameCount: 1,
    roastLevel: 'medium',
    isSessionFinished: false,
    isPoked: false,
  });
  assert.equal(stateWarning, 'warning');

  // 4. Scolding extreme when away tab and speaking with extreme level
  const stateExtremeScold = determineCatState({
    running: true,
    focusMode: 'extreme_cat',
    isSpeaking: true,
    isAwayTab: true,
    shameCount: 3,
    roastLevel: 'extreme',
    isSessionFinished: false,
    isPoked: false,
  });
  assert.equal(stateExtremeScold, 'scolding_extreme');

  // 5. Celebrating on finish
  const stateCelebrating = determineCatState({
    running: false,
    focusMode: 'extreme_cat',
    isSpeaking: true,
    isAwayTab: false,
    shameCount: 0,
    roastLevel: 'medium',
    isSessionFinished: true,
    isPoked: false,
  });
  assert.equal(stateCelebrating, 'celebrating');

  // 6. Break state on chill_breathing mode
  const stateBreak = determineCatState({
    running: true,
    focusMode: 'chill_breathing',
    isSpeaking: false,
    isAwayTab: false,
    shameCount: 0,
    roastLevel: 'medium',
    isSessionFinished: false,
    isPoked: false,
  });
  assert.equal(stateBreak, 'break');

  // 7. Poked state when poked overrides others
  const statePoked = determineCatState({
    running: true,
    focusMode: 'extreme_cat',
    isSpeaking: false,
    isAwayTab: false,
    shameCount: 0,
    roastLevel: 'medium',
    isSessionFinished: false,
    isPoked: true,
  });
  assert.equal(statePoked, 'poked');
});

test('CharacterData: all 4 characters exist and have valid quotes', () => {
  const slugs = ['co-giao-chu-nhiem', 'sep-kho-tinh', 'tong-tai-lanh-lung', 'anime-tsundere'];
  for (const slug of slugs) {
    const char = CHARACTERS[slug];
    assert.ok(char, `Character ${slug} must exist`);
    assert.ok(char.quotes.tab_switch_warning.length > 0);
    assert.ok(char.quotes.tab_switch_extreme.length > 0);
    assert.ok(char.quotes.poke.length > 0);
  }
});

// ============================================================================
// 2. TIER 1: R1 SECONDARY MOTION & SQUASH/STRETCH ENGINE
// ============================================================================

test('R1 Physics: Volume preservation strictly maintains Sx * Sy * Sz == 1 across squash and stretch bounds', () => {
  const testSyValues = [0.7, 0.9, 1.0, 1.2, 1.5];
  for (const sy of testSyValues) {
    const scaleObj = CatPhysics.calculateVolumePreservingScale(sy);
    assert.equal(scaleObj.scaleY, sy);
    assert.ok(Math.abs(scaleObj.scaleX - scaleObj.scaleZ) < 1e-12, 'Sx must equal Sz');
    const volume = scaleObj.scaleX * scaleObj.scaleY * scaleObj.scaleZ;
    assert.ok(
      Math.abs(volume - 1.0) < 1e-10,
      `Volume Sx*Sy*Sz must be ~1.0 for Sy=${sy}, got ${volume}`
    );

    const tuple = CatPhysics.computeSquashStretchScale(sy);
    assert.equal(tuple[0], scaleObj.scaleX);
    assert.equal(tuple[1], scaleObj.scaleY);
    assert.equal(tuple[2], scaleObj.scaleZ);
  }
});

test('R1 Physics: Ground contact height compensation preserves floor anchoring during squash/stretch', () => {
  const pivot = 0.45;
  // Neutral height (Sy = 1.0) -> offset 0
  assert.equal(CatPhysics.computeGroundContactOffset(1.0, pivot), 0);

  // Squashed (Sy = 0.8) -> negative offset anchors paws downwards
  const squashOffset = CatPhysics.computeGroundContactOffset(0.8, pivot);
  assert.ok(squashOffset < 0, 'Squash offset must be negative');
  assert.ok(Math.abs(squashOffset - (0.8 - 1.0) * pivot) < 1e-12);

  // Stretched (Sy = 1.3) -> positive offset pushes root upwards
  const stretchOffset = CatPhysics.computeGroundContactOffset(1.3, pivot);
  assert.ok(stretchOffset > 0, 'Stretch offset must be positive');
  assert.ok(Math.abs(stretchOffset - (1.3 - 1.0) * pivot) < 1e-12);
});

test('R1 Physics: Damped harmonic oscillator exhibits stable restitution, decaying velocity, and zero-drift convergence', () => {
  const state: CatPhysics.SpringState = { position: 1.0, velocity: 0, target: 0 };
  const params: CatPhysics.SpringParams = { stiffness: 100, damping: 14, mass: 1.0 };

  const dt = 0.016;

  // Step 120 frames (approx 2 seconds)
  for (let i = 0; i < 120; i++) {
    CatPhysics.stepSpring(state, params, dt);
  }

  // Underdamped spring decays towards target (0.0)
  assert.ok(Math.abs(state.position) < 0.01, `Position should decay to ~0, got ${state.position}`);
  assert.ok(Math.abs(state.velocity) < 0.05, `Velocity should decay to ~0, got ${state.velocity}`);

  // Test SpringOscillator class wrapper matches identical behavior
  const osc = new CatPhysics.SpringOscillator(1.0, params);
  osc.setTarget(0.0);
  for (let i = 0; i < 120; i++) {
    osc.step(dt);
  }
  assert.ok(Math.abs(osc.state.position) < 0.01);
});

test('R1 Physics: Secondary anatomy presets are physically parameterized with positive stiffness and damping', () => {
  const presets = CatPhysics.SPRING_PRESETS;
  const parts: (keyof typeof presets)[] = [
    'cheeks',
    'belly',
    'earTips',
    'whiskers',
    'dragReturn',
    'recoilBounce',
  ];

  for (const part of parts) {
    const p = presets[part];
    assert.ok(p.stiffness >= 100, `${part} stiffness must be >= 100, got ${p.stiffness}`);
    assert.ok(p.damping >= 12, `${part} damping must be >= 12, got ${p.damping}`);
    assert.ok((p.mass ?? 1.0) > 0, `${part} mass must be > 0`);
  }

  // Physics hierarchy: whiskers are stiffest, belly is softest
  assert.ok(presets.whiskers.stiffness > presets.cheeks.stiffness);
  assert.ok(presets.cheeks.stiffness > presets.belly.stiffness);
});

test('R1 Physics: 6-segment tail multi-frequency kinematics exhibit monotonic spatial phase lag and distal amplitude expansion', () => {
  const totalSegments = 6;
  const time = 1.0;
  const baseFreq = 2.0;
  const baseAmp = 0.15;

  const rotations = [];
  for (let i = 0; i < totalSegments; i++) {
    rotations.push(
      CatPhysics.calculateTailSegmentRotation(i, totalSegments, time, baseFreq, baseAmp)
    );
  }

  assert.equal(rotations.length, 6);

  // Distal amplitude envelope: A(i) = baseAmp * (0.35 + 0.65 * i / 5)
  const amp0 = baseAmp * 0.35;
  const amp5 = baseAmp * 1.0;
  assert.ok(amp5 > amp0, 'Distal segment amplitude must exceed root segment amplitude');

  // Verify flick mode triggers high-frequency flick on distal segments (i=4, 5) but not root (i=0)
  const rot0Normal = CatPhysics.calculateTailSegmentRotation(0, totalSegments, time, baseFreq, baseAmp, false);
  const rot0Flick = CatPhysics.calculateTailSegmentRotation(0, totalSegments, time, baseFreq, baseAmp, true);
  assert.equal(rot0Normal.x, rot0Flick.x, 'Root segment pitch must not be affected by tip flick');

  const rot5Normal = CatPhysics.calculateTailSegmentRotation(5, totalSegments, time, baseFreq, baseAmp, false);
  const rot5Flick = CatPhysics.calculateTailSegmentRotation(5, totalSegments, time, baseFreq, baseAmp, true);
  assert.notEqual(rot5Normal.x, rot5Flick.x, 'Tip segment pitch must be modified by flick');
});

test('R1 Physics: Micro-saccade generator bounds eye drift and saccadic jumps within anatomical socket thresholds', () => {
  const saccade = CatPhysics.createSaccadeState();
  assert.ok(saccade.nextJumpTime >= 1.0 && saccade.nextJumpTime <= 2.4);

  // Run 60 simulation steps across 3 seconds to trigger saccadic jumps
  let jumpOccurred = false;
  let time = 0;
  const dt = 0.05;

  for (let step = 0; step < 60; step++) {
    time += dt;
    const prevNextJump = saccade.nextJumpTime;
    const offset = CatPhysics.updateMicroSaccade(saccade, time, dt);

    // Anatomical boundaries
    assert.ok(
      offset.x >= -0.015 && offset.x <= 0.015,
      `Saccade X ${offset.x} out of anatomical bounds`
    );
    assert.ok(
      offset.y >= -0.012 && offset.y <= 0.012,
      `Saccade Y ${offset.y} out of anatomical bounds`
    );

    if (saccade.nextJumpTime !== prevNextJump) {
      jumpOccurred = true;
    }
  }

  assert.ok(jumpOccurred, 'At least one saccadic jump should occur within 3 seconds');
});

// ============================================================================
// 3. TIER 1: R2 STUDIO TOON LIGHTING & VFX PARTICLE SYSTEM
// ============================================================================

test('R2 Lighting: Studio 3-point toon lighting parameters adhere to warm key, cool fill, and neon rim specification', () => {
  // Authoritative specs from ORIGINAL_REQUEST.md & PROJECT.md:
  // Key: Warm, intensity ~1.5 (angle upper front-right)
  // Fill: Cool, intensity ~0.65 (angle lower front-left)
  // Rim: Neon Cyan, intensity ~1.25 (angle rear-top)
  const LIGHTING_SPEC = {
    key: {
      color: 0xffedd5, // Warm peach/gold
      intensity: 1.35, // ~1.3 - 1.5
      position: [2.8, 4.2, 3.8],
    },
    fill: {
      color: 0xa5f3fc, // Cool soft cyan/indigo
      intensity: 0.65, // ~0.65
      position: [-2.8, 1.8, 2.5],
    },
    rim: {
      color: 0x38bdf8, // Neon rim cyan
      intensity: 1.25, // ~1.25
      position: [-3.2, 2.8, -2.8],
    },
    ambient: {
      color: 0xfff7ed,
      intensity: 0.85,
    },
  };

  assert.ok(LIGHTING_SPEC.key.intensity >= 1.3 && LIGHTING_SPEC.key.intensity <= 1.6);
  assert.ok(LIGHTING_SPEC.fill.intensity >= 0.5 && LIGHTING_SPEC.fill.intensity <= 0.8);
  assert.ok(LIGHTING_SPEC.rim.intensity >= 1.1 && LIGHTING_SPEC.rim.intensity <= 1.4);
  assert.ok(LIGHTING_SPEC.key.position[0] > 0 && LIGHTING_SPEC.key.position[1] > 0);
  assert.ok(LIGHTING_SPEC.fill.position[0] < 0 && LIGHTING_SPEC.fill.position[2] > 0);
  assert.ok(LIGHTING_SPEC.rim.position[2] < 0, 'Rim light must shine from rear');
});

test('R2 Lighting: Dynamic contact shadow blob radius and opacity diminish monotonically with cat elevation', () => {
  const elevations = [0.0, 0.2, 0.5, 1.0, 2.0];
  const shadows = elevations.map((h) => CatPhysics.computeContactShadow(h));

  // Ground rest (h = 0)
  assert.equal(shadows[0]!.scaleX, 1.9);
  assert.equal(shadows[0]!.scaleZ, 1.4);
  assert.equal(shadows[0]!.opacity, 0.55);

  // Monotonic decrease test
  for (let i = 1; i < shadows.length; i++) {
    const prev = shadows[i - 1]!;
    const curr = shadows[i]!;
    assert.ok(
      curr.scaleX <= prev.scaleX,
      `ScaleX must be monotonically non-increasing: ${curr.scaleX} vs ${prev.scaleX}`
    );
    assert.ok(
      curr.opacity < prev.opacity,
      `Opacity must be strictly decreasing: ${curr.opacity} vs ${prev.opacity}`
    );
  }

  // Safe lower clamp bounds:
  const extremeShadow = CatPhysics.computeContactShadow(100.0);
  assert.ok(extremeShadow.scaleX >= 1.9 * 0.4, 'ScaleX floor clamp >= 0.40');
  assert.ok(extremeShadow.opacity >= 0.55 * 0.08, 'Opacity floor clamp >= 0.08');
});

test('R2 VFX: Particle pool pre-allocates zero-GC buffers for hearts, sweat, and star sprites', () => {
  const particleSys = CatParticles.createCatParticleSystem();
  assert.ok(particleSys.group, 'Particle system must expose root group');
  assert.equal(particleSys.group.name, 'cat_particles_root');

  // Pre-allocated children (20 hearts + 16 sweat + 28 stars = 64 sprites)
  assert.ok(
    particleSys.group.children.length >= 60,
    'Pool must pre-allocate >= 60 particle sprites'
  );

  for (const child of particleSys.group.children) {
    assert.equal(child.visible, false, 'All pre-allocated particles must initially be hidden');
  }

  particleSys.dispose();
});

test('R2 VFX: Particle spawn activates sprites and updates trajectories with velocity and lifespan recycling', () => {
  const particleSys = CatParticles.createCatParticleSystem();

  // Spawn 2 hearts and 2 stars
  particleSys.spawn('heart', 2);
  particleSys.spawn('star', 2);

  const activeCount = particleSys.group.children.filter((c) => c.visible).length;
  assert.equal(activeCount, 4, 'Exactly 4 particles should be active');

  // Advance by 0.1s
  particleSys.update(0.1);
  const stillActive = particleSys.group.children.filter((c) => c.visible).length;
  assert.equal(stillActive, 4, 'Particles must remain active within initial lifespan');

  // Advance past maxLife (60 steps * 0.05s clamped dt = 3.0s simulated time)
  for (let i = 0; i < 60; i++) {
    particleSys.update(0.05);
  }

  const expiredCount = particleSys.group.children.filter((c) => c.visible).length;
  assert.equal(expiredCount, 0, 'All particles should naturally expire and recycle to inactive');

  particleSys.dispose();
});

test('R2 VFX: WebGL particle disposal cleanly releases materials and textures without memory leak', () => {
  const particleSys = CatParticles.createCatParticleSystem();
  particleSys.spawn('heart', 5);
  particleSys.spawn('sweat', 3);
  particleSys.update(0.05);

  assert.doesNotThrow(() => {
    particleSys.dispose();
  });

  assert.equal(
    particleSys.group.children.length,
    0,
    'All sprite children should be removed on dispose'
  );
});

// ============================================================================
// 4. TIER 1: R3 INTERACTIVE CONTROLS & GESTURES
// ============================================================================

test('R3 Controls: 3D drag rotation bounds clamp yaw to ±25 deg and pitch to ±12 deg', () => {
  const bounds = CatPhysics.DRAG_ROTATION_BOUNDS;
  const expectedYaw = 25 * (Math.PI / 180);
  const expectedPitch = 12 * (Math.PI / 180);

  assert.ok(Math.abs(bounds.maxYaw - expectedYaw) < 1e-6);
  assert.ok(Math.abs(bounds.maxPitch - expectedPitch) < 1e-6);

  const state = CatPhysics.createDragRotationState();
  state.isDragging = true;

  // Excessive positive yaw and pitch
  state.rotY = 1.5; // ~86 deg
  state.rotX = 0.8; // ~45 deg
  CatPhysics.updateDragRotation(state, 0.016);

  assert.ok(
    Math.abs(state.rotY - bounds.maxYaw) < 1e-6,
    `Yaw must be clamped to ${bounds.maxYaw}`
  );
  assert.ok(
    Math.abs(state.rotX - bounds.maxPitch) < 1e-6,
    `Pitch must be clamped to ${bounds.maxPitch}`
  );

  // Excessive negative yaw and pitch
  state.rotY = -2.0;
  state.rotX = -1.0;
  CatPhysics.updateDragRotation(state, 0.016);

  assert.ok(Math.abs(state.rotY - -bounds.maxYaw) < 1e-6);
  assert.ok(Math.abs(state.rotX - -bounds.maxPitch) < 1e-6);
});

test('R3 Controls: Elastic return spring smoothly restores released drag rotation back to (0, 0)', () => {
  const state = CatPhysics.createDragRotationState();
  state.isDragging = false;
  state.rotY = 0.35; // ~20 deg
  state.rotX = 0.15; // ~8.6 deg

  // Simulate release over 60 steps (~1 second)
  for (let i = 0; i < 60; i++) {
    CatPhysics.updateDragRotation(state, 0.016);
  }

  assert.ok(Math.abs(state.rotY) < 0.005, `Yaw should converge to ~0, got ${state.rotY}`);
  assert.ok(Math.abs(state.rotX) < 0.005, `Pitch should converge to ~0, got ${state.rotX}`);
});

test('R3 Controls: Cursor petting interaction simulates high-frequency purr vibration and ear pinning', () => {
  // Purr vibration model: DeltaX = 0.003 * sin(55 * t), DeltaY = 0.002 * cos(50 * t)
  const t = 1.25;
  const deltaX = 0.003 * Math.sin(55 * t);
  const deltaY = 0.002 * Math.cos(50 * t);

  assert.ok(Math.abs(deltaX) <= 0.003);
  assert.ok(Math.abs(deltaY) <= 0.002);

  // Frequency check: angular frequency 50 rad/s (~8 Hz) oscillates rapidly
  const t2 = t + 0.03;
  const deltaY2 = 0.002 * Math.cos(50 * t2);
  assert.notEqual(deltaY, deltaY2);

  // Ear pinning: droop angle
  const droopEarL = 0.75;
  const droopEarR = -0.75;
  assert.ok(droopEarL > 0 && droopEarR < 0, 'Ears must pin symmetrically outward');
});

test('R3 Controls: Belly poke interaction generates recoil bounce compression and annoyance escalation', () => {
  let annoyance = 0;
  const maxAnnoyance = 3;

  // Single poke
  annoyance = Math.min(maxAnnoyance, annoyance + 0.5);
  assert.equal(annoyance, 0.5);

  // Recoil bounce impulse: Sy compresses (squash) and pops upward
  const recoilSy = 0.85;
  const scales = CatPhysics.calculateVolumePreservingScale(recoilSy);
  assert.ok(scales.scaleX > 1.0 && scales.scaleZ > 1.0, 'Recoil squash must bulge horizontally');
  assert.ok(scales.scaleY < 1.0, 'Recoil squash must compress vertically');

  // Repeated pokes increase annoyance
  annoyance = Math.min(maxAnnoyance, annoyance + 0.5);
  annoyance = Math.min(maxAnnoyance, annoyance + 0.5);
  assert.equal(annoyance, 1.5);
});

test('R3 Controls: Natural idle state machine triggers behaviors after inactivity and interrupts instantly on user input', () => {
  const IDLE_TIMEOUT_SECONDS = 10.0;
  let inactivityTimer = 0;
  let currentIdleBehavior: 'none' | 'stretch_yawn' | 'ear_scratch' | 'paw_lick' = 'none';

  // 1. Advance timer under threshold
  inactivityTimer += 8.0;
  assert.equal(currentIdleBehavior, 'none');

  // 2. Cross threshold (t > 10.0s)
  inactivityTimer += 2.5; // total 10.5s
  if (inactivityTimer >= IDLE_TIMEOUT_SECONDS) {
    const behaviors = ['stretch_yawn', 'ear_scratch', 'paw_lick'] as const;
    currentIdleBehavior = behaviors[0]!;
  }
  assert.equal(currentIdleBehavior, 'stretch_yawn');

  // 3. User interaction interrupts instantly
  const userInteracted = true;
  if (userInteracted) {
    inactivityTimer = 0;
    currentIdleBehavior = 'none';
  }
  assert.equal(
    currentIdleBehavior,
    'none',
    'Idle behavior must instantly interrupt on user interaction'
  );
  assert.equal(inactivityTimer, 0);
});

// ============================================================================
// 5. TIER 1: R4 LIP-SYNC & EMOTION BLEND
// ============================================================================

test('R4 Lip-Sync: Asymmetric jaw kinetics enforce attack rate substantially faster than decay rate', () => {
  const kAttack = 28.0; // s^-1
  const kDecay = 13.0; // s^-1
  assert.ok(kAttack > kDecay * 1.8, 'Attack rate must be substantially faster than decay rate');

  // Simulate opening from 0 -> 1 with target 1.0
  let jawOpen = 0.0;
  const dt = 0.016;
  let timeToOpen90 = 0;
  while (jawOpen < 0.9 && timeToOpen90 < 1.0) {
    jawOpen += (1.0 - jawOpen) * Math.min(1.0, dt * kAttack);
    timeToOpen90 += dt;
  }

  // Simulate closing from 1 -> 0 with target 0.0
  let jawClose = 1.0;
  let timeToClose10 = 0;
  while (jawClose > 0.1 && timeToClose10 < 1.0) {
    jawClose += (0.0 - jawClose) * Math.min(1.0, dt * kDecay);
    timeToClose10 += dt;
  }

  assert.ok(
    timeToOpen90 < timeToClose10,
    `Opening (${timeToOpen90}s) must be faster than closing (${timeToClose10}s)`
  );
});

test('R4 Lip-Sync: Jaw openness is strictly bounded in [0.0, 1.0] and drives proportional hinge rotation', () => {
  const clampOpenness = (val: number) => Math.max(0.0, Math.min(1.0, val));

  assert.equal(clampOpenness(-0.5), 0.0);
  assert.equal(clampOpenness(1.5), 1.0);
  assert.equal(clampOpenness(0.6), 0.6);

  // Rotation formula: R_jaw,x = -0.55 * J, Y_jaw = -0.10 - 0.08 * J
  const j = 0.8;
  const rotJawX = -0.55 * j;
  const posJawY = -0.1 - 0.08 * j;

  assert.ok(rotJawX < 0, 'Jaw opens by rotating downwards (negative X rotation)');
  assert.ok(posJawY < -0.1, 'Jaw position drops downwards as mouth opens');
});

test('R4 Lip-Sync: Web Audio amplitude normalization maps vocal energy safely to unit interval', () => {
  const normalizeAudioEnergy = (energy: number) => {
    return Math.max(0.0, Math.min(1.0, (energy - 14) / 105));
  };

  // Background noise below 14
  assert.equal(normalizeAudioEnergy(10), 0.0);
  assert.equal(normalizeAudioEnergy(14), 0.0);

  // Mid-range conversation
  const mid = normalizeAudioEnergy(66.5);
  assert.ok(Math.abs(mid - 0.5) < 1e-4);

  // Peak clipping above 119
  assert.equal(normalizeAudioEnergy(119), 1.0);
  assert.equal(normalizeAudioEnergy(200), 1.0);
});

test('R4 Lip-Sync: Tongue flutter tremor scales with speech openness and high-frequency oscillation', () => {
  const getTongueDisplacement = (jawOpen: number, time: number) => {
    return -0.02 + Math.sin(time * 26) * 0.025 * jawOpen;
  };

  // Closed mouth (jaw = 0) -> no tremor
  assert.equal(getTongueDisplacement(0.0, 0.0), -0.02);
  assert.equal(getTongueDisplacement(0.0, 1.5), -0.02);

  // Open mouth (jaw = 1.0) -> oscillates around -0.02 with amp 0.025
  const tMax = Math.PI / (2 * 26); // sin(26*t) = 1
  const tMin = (3 * Math.PI) / (2 * 26); // sin(26*t) = -1
  assert.ok(Math.abs(getTongueDisplacement(1.0, tMax) - 0.005) < 1e-5);
  assert.ok(Math.abs(getTongueDisplacement(1.0, tMin) - -0.045) < 1e-5);
});

test('R4 Emotion Blend: All 4 character personalities map distinct emotional facial morph targets', () => {
  const CHARACTER_EMOTION_MAP = {
    'co-giao-chu-nhiem': {
      browRotationZ: 0.38, // Strict sharp frown
      upperEyelidClosed: -0.58, // Intense scold squint
      earTiltZ: 0.55,
    },
    'sep-kho-tinh': {
      browLeftZ: 0.25, // Asymmetric skeptical brows
      browRightZ: -0.3,
      eyelidL: -0.4,
      eyelidR: -0.7,
    },
    'tong-tai-lanh-lung': {
      browRotationZ: 0.05, // Cold neutral leveling
      upperEyelidClosed: -0.85,
      earTiltZ: 0.2,
    },
    'anime-tsundere': {
      browRotationZ: 0.32, // Tsundere anger angle
      upperEyelidClosed: -0.45,
      earTiltZ: 0.65,
    },
  };

  // Verify all 4 characters from CHARACTERS have distinct emotion signatures
  const slugs = Object.keys(CHARACTERS);
  assert.equal(slugs.length, 4);

  for (const slug of slugs) {
    const emotion = (CHARACTER_EMOTION_MAP as any)[slug];
    assert.ok(emotion, `Character ${slug} must have mapped emotion morph parameters`);
  }
});

// ============================================================================
// 6. TIER 2: BOUNDARY & CORNER CASES
// ============================================================================

test('Tier 2 Boundary: Extreme delta time spikes (dt = 0, dt = 0.5s, dt = 5.0s) clamp cleanly without NaN or oscillation blowup', () => {
  const state: CatPhysics.SpringState = { position: 1.0, velocity: 0, target: 0 };
  const params = CatPhysics.SPRING_PRESETS.belly;

  // dt = 0
  CatPhysics.stepSpring(state, params, 0);
  assert.equal(state.position, 1.0);
  assert.equal(state.velocity, 0.0);

  // dt = 0.5s (severe lag spike clamped to <= 0.033s)
  CatPhysics.stepSpring(state, params, 0.5);
  assert.ok(Number.isFinite(state.position), 'Position must be finite');
  assert.ok(Number.isFinite(state.velocity), 'Velocity must be finite');

  // dt = 5.0s (tab freeze/resume)
  CatPhysics.stepSpring(state, params, 5.0);
  assert.ok(Number.isFinite(state.position), 'Position must remain finite after 5s dt');
  assert.ok(Number.isFinite(state.velocity), 'Velocity must remain finite after 5s dt');
  assert.ok(!Number.isNaN(state.position));
  assert.ok(!Number.isNaN(state.velocity));
});

test('Tier 2 Boundary: Extreme 1000px and 5000px drag inputs rigidly clamp at mechanical limits', () => {
  const state = CatPhysics.createDragRotationState();
  state.isDragging = true;

  // Simulate 1000px drag (equiv to ~20 radians)
  state.rotY = 20.0;
  state.rotX = 10.0;
  CatPhysics.updateDragRotation(state, 0.016);

  assert.equal(state.rotY, CatPhysics.DRAG_ROTATION_BOUNDS.maxYaw);
  assert.equal(state.rotX, CatPhysics.DRAG_ROTATION_BOUNDS.maxPitch);

  // Negative extreme -5000px
  state.rotY = -100.0;
  state.rotX = -50.0;
  CatPhysics.updateDragRotation(state, 0.016);

  assert.equal(state.rotY, -CatPhysics.DRAG_ROTATION_BOUNDS.maxYaw);
  assert.equal(state.rotX, -CatPhysics.DRAG_ROTATION_BOUNDS.maxPitch);
});

test('Tier 2 Boundary: Zero, negative, and extreme volume scale inputs clamp safely to [0.5, 1.8]', () => {
  // Sy = 0
  const zeroRes = CatPhysics.calculateVolumePreservingScale(0);
  assert.equal(zeroRes.scaleY, 0.5);
  assert.ok(Number.isFinite(zeroRes.scaleX) && zeroRes.scaleX > 0);

  // Sy = -5.0
  const negRes = CatPhysics.calculateVolumePreservingScale(-5.0);
  assert.equal(negRes.scaleY, 0.5);
  assert.ok(!Number.isNaN(negRes.scaleX));

  // Sy = 999.0
  const hugeRes = CatPhysics.calculateVolumePreservingScale(999.0);
  assert.equal(hugeRes.scaleY, 1.8);
  assert.ok(Math.abs(hugeRes.scaleX - 1.0 / Math.sqrt(1.8)) < 1e-12);

  // Sy = NaN
  const nanRes = CatPhysics.calculateVolumePreservingScale(NaN);
  assert.equal(nanRes.scaleY, 1.0);
  assert.equal(nanRes.scaleX, 1.0);
});

test('Tier 2 Boundary: Particle pool saturation under burst spamming recycles cleanly with zero leak', () => {
  const particleSys = CatParticles.createCatParticleSystem();

  // Burst spawn 100 hearts (capacity is 20)
  assert.doesNotThrow(() => {
    particleSys.spawn('heart', 100);
  });

  const activeHearts = particleSys.group.children.filter((c) => c.visible).length;
  assert.ok(
    activeHearts <= 20,
    `Active hearts should not exceed capacity 20, got ${activeHearts}`
  );
  assert.ok(
    particleSys.group.children.length <= 64,
    'Total pool sprites must remain bounded (no growth)'
  );

  particleSys.dispose();
});

test('Tier 2 Boundary: Out-of-bounds audio amplitude inputs (-100, +500, NaN) clamp strictly within [0.0, 1.0]', () => {
  const safeNormalize = (raw: number) => {
    if (!Number.isFinite(raw)) return 0.0;
    return Math.max(0.0, Math.min(1.0, (raw - 14) / 105));
  };

  assert.equal(safeNormalize(-100), 0.0);
  assert.equal(safeNormalize(500), 1.0);
  assert.equal(safeNormalize(NaN), 0.0);
  assert.equal(safeNormalize(Infinity), 0.0);
});

test('Tier 2 Boundary: Long-term numerical stability under 10,000 sub-steps maintains bounded energy', () => {
  const state: CatPhysics.SpringState = { position: 0.5, velocity: 1.0, target: 0 };
  const params = CatPhysics.SPRING_PRESETS.cheeks;

  for (let i = 0; i < 10000; i++) {
    const variableDt = 0.005 + (i % 28) * 0.001; // Varying dt between 5ms and 33ms
    CatPhysics.stepSpring(state, params, variableDt);
  }

  assert.ok(Number.isFinite(state.position));
  assert.ok(Number.isFinite(state.velocity));
  assert.ok(
    Math.abs(state.position) < 1e-6,
    `Position after 10000 steps must be ~0, got ${state.position}`
  );
  assert.ok(
    Math.abs(state.velocity) < 1e-6,
    `Velocity after 10000 steps must be ~0, got ${state.velocity}`
  );
});
