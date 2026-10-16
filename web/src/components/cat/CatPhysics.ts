/**
 * CatPhysics.ts
 * Pixar/Disney-grade mathematical physics engine for Leo 3D Character.
 *
 * Core mathematical models:
 * 1. Volume-Preserving Squash & Stretch (Sx * Sy * Sz = 1.0)
 * 2. 2nd-Order Damped Harmonic Oscillators (Semi-Implicit Euler ODE integration)
 * 3. 6-Segment Tail Multi-Frequency Wave Kinematics
 * 4. Fixational Eye Drift & Bio-Realistic Micro-Saccades
 * 5. Bounded 3D Drag Rotation with Elastic Return Spring
 * 6. Dynamic Contact Shadow Blob Optics
 */

export interface SpringState {
  position: number;
  velocity: number;
  target: number;
}

export interface SpringParams {
  stiffness: number; // k (e.g. 100 - 500)
  damping: number;   // c (e.g. 14 - 30)
  mass?: number;     // m (default 1.0)
}

/**
 * Standard spring parameter presets for Leo's secondary anatomy.
 */
export const SPRING_PRESETS = {
  cheeks: { stiffness: 200, damping: 18, mass: 1.0 },
  belly: { stiffness: 100, damping: 14, mass: 1.0 },
  earTips: { stiffness: 320, damping: 22, mass: 1.0 },
  whiskers: { stiffness: 500, damping: 30, mass: 1.0 },
  dragReturn: { stiffness: 250, damping: 28, mass: 1.0 },
  recoilBounce: { stiffness: 220, damping: 12, mass: 1.0 },
} as const;

/**
 * Step a 2nd-order damped harmonic spring using Semi-Implicit Euler.
 * Clamps dt to prevent numerical instability, guards against NaN.
 *
 * ODE: m * x'' + c * x' + k * (x - target) = 0
 */
export function stepSpring(state: SpringState, params: SpringParams, dt: number): void {
  const safeDt = Math.min(Math.max(0, dt), 0.033);
  if (safeDt <= 0) return;

  const m = Math.max(0.001, params.mass ?? 1.0);
  const k = params.stiffness;
  const c = params.damping;

  const displacement = state.position - state.target;
  const acceleration = (-k * displacement - c * state.velocity) / m;

  state.velocity += acceleration * safeDt;
  state.position += state.velocity * safeDt;

  // Sanity guard against NaN / Infinity
  if (!Number.isFinite(state.position) || !Number.isFinite(state.velocity)) {
    state.position = state.target;
    state.velocity = 0;
  }
}

/**
 * Convenient class wrapper around 1D spring oscillator.
 */
export class SpringOscillator {
  public state: SpringState;
  public params: SpringParams;

  constructor(initial: number = 0, params: SpringParams = SPRING_PRESETS.belly) {
    this.state = { position: initial, velocity: 0, target: initial };
    this.params = { ...params };
  }

  public step(dt: number): number {
    stepSpring(this.state, this.params, dt);
    return this.state.position;
  }

  public impulse(v: number): void {
    if (Number.isFinite(v)) {
      this.state.velocity += v;
    }
  }

  public setTarget(target: number): void {
    if (Number.isFinite(target)) {
      this.state.target = target;
    }
  }

  public reset(value: number = 0): void {
    this.state.position = value;
    this.state.target = value;
    this.state.velocity = 0;
  }
}

/**
 * Calculate volume-preserving Scale_X and Scale_Z from Scale_Y.
 * Scale_X = Scale_Z = 1 / sqrt(Scale_Y)
 * Guarantees V = Sx * Sy * Sz = 1.0.
 * Clamps Scale_Y in safe interval [0.5, 1.8].
 */
export function calculateVolumePreservingScale(scaleY: number): { scaleX: number; scaleY: number; scaleZ: number } {
  const clampedSy = Math.max(0.5, Math.min(1.8, Number.isFinite(scaleY) ? scaleY : 1.0));
  const sxz = 1.0 / Math.sqrt(clampedSy);
  return {
    scaleX: sxz,
    scaleY: clampedSy,
    scaleZ: sxz,
  };
}

/**
 * Backward-compatible alias for calculateVolumePreservingScale returning tuple.
 */
export function computeSquashStretchScale(syFactor: number): [number, number, number] {
  const res = calculateVolumePreservingScale(syFactor);
  return [res.scaleX, res.scaleY, res.scaleZ];
}

/**
 * Calculate ground contact height compensation to keep paws anchored to floor
 * during squash and stretch: Delta Y = (Sy - 1.0) * H_pivot.
 */
export function computeGroundContactOffset(scaleY: number, pivotHeight: number = 0.45): number {
  const clampedSy = Math.max(0.5, Math.min(1.8, Number.isFinite(scaleY) ? scaleY : 1.0));
  return (clampedSy - 1.0) * pivotHeight;
}

/**
 * Calculate tail segment rotation based on multi-frequency wave propagation.
 * Combines fundamental wave w1, harmonic overtone w2, tip flick w3,
 * and progressive distal amplitude envelope A(i) = A0 * (0.35 + 0.65 * i / 5).
 */
export function calculateTailSegmentRotation(
  segmentIndex: number,
  totalSegments: number,
  time: number,
  baseFrequency: number,
  baseAmplitude: number,
  isFlicking: boolean = false
): { x: number; y: number; z: number } {
  const total = Math.max(1, totalSegments);
  const idx = Math.max(0, Math.min(total - 1, segmentIndex));
  const u = idx / Math.max(1, total - 1);

  // Distal amplitude envelope: distal segments whip with larger amplitude
  const amplitude = baseAmplitude * (0.35 + 0.65 * u);

  const w1 = baseFrequency;
  const w2 = 2.2 * w1;
  const w3 = 5.0 * w1;

  const k1 = 0.42; // Fundamental spatial phase delay
  const k2 = 0.85; // Harmonic overtone phase delay

  // Horizontal S-curve wave (Yaw / Y axis)
  const rotY = amplitude * (
    0.70 * Math.sin(w1 * time - k1 * idx) +
    0.30 * Math.sin(w2 * time - k2 * idx + 0.5)
  );

  // Vertical hook curve (Pitch / X axis)
  const restPitch = -0.06 - 0.04 * idx;
  const wavePitch = amplitude * 0.30 * Math.cos(0.5 * w1 * time - k1 * idx);
  const flick = (idx >= total - 2 && isFlicking) ? 0.08 * Math.sin(w3 * time) : 0;
  const rotX = restPitch + wavePitch + flick;

  // Gentle lateral curl (Roll / Z axis)
  const rotZ = amplitude * 0.12 * Math.sin(w1 * time - k1 * idx + Math.PI / 4);

  return { x: rotX, y: rotY, z: rotZ };
}

/**
 * Micro-saccade state machine generator producing bio-realistic eye drift and saccadic jumps.
 */
export interface SaccadeState {
  currentOffset: { x: number; y: number };
  targetOffset: { x: number; y: number };
  nextJumpTime: number;
}

export function createSaccadeState(): SaccadeState {
  return {
    currentOffset: { x: 0, y: 0 },
    targetOffset: { x: 0, y: 0 },
    nextJumpTime: 1.0 + Math.random() * 1.4,
  };
}

export function updateMicroSaccade(saccade: SaccadeState, time: number, dt: number): { x: number; y: number } {
  const safeDt = Math.min(Math.max(0, dt), 0.05);

  // Check if it's time for a new saccadic jump (Poisson-like random interval 0.8s - 2.4s)
  if (time >= saccade.nextJumpTime) {
    saccade.targetOffset.x = (Math.random() * 2 - 1) * 0.012;
    saccade.targetOffset.y = (Math.random() * 2 - 1) * 0.008;
    saccade.nextJumpTime = time + 0.8 + Math.random() * 1.6;
  }

  // Fast saccade trajectory (~25ms step)
  const saccadeSpeed = 26.0;
  saccade.currentOffset.x += (saccade.targetOffset.x - saccade.currentOffset.x) * Math.min(1.0, safeDt * saccadeSpeed);
  saccade.currentOffset.y += (saccade.targetOffset.y - saccade.currentOffset.y) * Math.min(1.0, safeDt * saccadeSpeed);

  // Smooth bio-fixational drift
  const driftX = 0.004 * Math.sin(1.7 * time);
  const driftY = 0.003 * Math.cos(2.3 * time);

  const finalX = Math.max(-0.015, Math.min(0.015, saccade.currentOffset.x + driftX));
  const finalY = Math.max(-0.012, Math.min(0.012, saccade.currentOffset.y + driftY));

  return { x: finalX, y: finalY };
}

/**
 * Clamped 3D Drag Rotation with elastic return spring.
 * Yaw bounded to [-25 deg, +25 deg] = [-0.4363, +0.4363] rad
 * Pitch bounded to [-12 deg, +12 deg] = [-0.2094, +0.2094] rad
 */
export interface DragRotationState {
  rotX: number; // Pitch in radians
  rotY: number; // Yaw in radians
  velX: number;
  velY: number;
  isDragging: boolean;
}

export const DRAG_ROTATION_BOUNDS = {
  maxYaw: 25 * (Math.PI / 180),   // ~0.43633 rad
  maxPitch: 12 * (Math.PI / 180), // ~0.20944 rad
} as const;

export function createDragRotationState(): DragRotationState {
  return {
    rotX: 0,
    rotY: 0,
    velX: 0,
    velY: 0,
    isDragging: false,
  };
}

export function updateDragRotation(state: DragRotationState, dt: number): void {
  const safeDt = Math.min(Math.max(0, dt), 0.033);
  if (safeDt <= 0) return;

  if (state.isDragging) {
    // When dragging, velocity tracks user input; clamp bounds
    state.rotX = Math.max(-DRAG_ROTATION_BOUNDS.maxPitch, Math.min(DRAG_ROTATION_BOUNDS.maxPitch, state.rotX));
    state.rotY = Math.max(-DRAG_ROTATION_BOUNDS.maxYaw, Math.min(DRAG_ROTATION_BOUNDS.maxYaw, state.rotY));
    state.velX = 0;
    state.velY = 0;
    return;
  }

  // Released: critically/under-damped spring return to (0, 0)
  const springX: SpringState = { position: state.rotX, velocity: state.velX, target: 0 };
  const springY: SpringState = { position: state.rotY, velocity: state.velY, target: 0 };

  stepSpring(springX, SPRING_PRESETS.dragReturn, safeDt);
  stepSpring(springY, SPRING_PRESETS.dragReturn, safeDt);

  state.rotX = Math.max(-DRAG_ROTATION_BOUNDS.maxPitch, Math.min(DRAG_ROTATION_BOUNDS.maxPitch, springX.position));
  state.rotY = Math.max(-DRAG_ROTATION_BOUNDS.maxYaw, Math.min(DRAG_ROTATION_BOUNDS.maxYaw, springY.position));
  state.velX = springX.velocity;
  state.velY = springY.velocity;

  // Snap to zero if settled
  if (Math.abs(state.rotX) < 0.0001 && Math.abs(state.velX) < 0.001) {
    state.rotX = 0;
    state.velX = 0;
  }
  if (Math.abs(state.rotY) < 0.0001 && Math.abs(state.velY) < 0.001) {
    state.rotY = 0;
    state.velY = 0;
  }
}

/**
 * Dynamic Soft Contact Shadow Blob calculation.
 * Radius R(h) = R0 * max(0.40, 1.0 - 0.42 * h)
 * Opacity alpha(h) = alpha0 * max(0.08, 1.0 / (1.0 + 3.2 * h))
 */
export function computeContactShadow(
  elevation: number,
  baseRadius: [number, number] = [1.9, 1.4],
  baseOpacity: number = 0.55
): { scaleX: number; scaleZ: number; opacity: number } {
  const h = Math.max(0, Number.isFinite(elevation) ? elevation : 0);
  const radiusFactor = Math.max(0.40, 1.0 - 0.42 * h);
  const opacityFactor = Math.max(0.08, 1.0 / (1.0 + 3.2 * h));

  return {
    scaleX: baseRadius[0] * radiusFactor,
    scaleZ: baseRadius[1] * radiusFactor,
    opacity: baseOpacity * opacityFactor,
  };
}
