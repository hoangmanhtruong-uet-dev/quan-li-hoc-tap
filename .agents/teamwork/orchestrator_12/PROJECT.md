# Project: Pixar-Grade 3D Toon Leo Cat Upgrade (Three.js Pomodoro)

## Architecture

The Leo 3D Character is a high-performance, procedural Three.js cartoon rig integrated into CampusOS's `StrictPomodoroModal`. It renders in 100% transparent canvas (`alpha: true`), zero external asset download (0ms network payload), and 120FPS real-time rendering.

```
+-----------------------------------------------------------------------------------+
|                        StrictPomodoroModal (CampusOS)                             |
|  - Manages Pomodoro Timer, Settings, Voice TTS & Character Dialogues              |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|               CatCanvas.tsx (Three.js Scene, Camera, Lighting & Controls)        |
|  - PerspectiveCamera (40°, aspect ~1.05, pos: [0, 0.52, 4.3])                    |
|  - Studio Toon 3-Point Lighting: Warm Key (1.5), Cool Fill (0.65), Rim (1.25)     |
|  - Dynamic Soft Contact Shadow Blob (Radius & Opacity scale inversely with Y)    |
|  - 3D Drag Rotation Controls (Bounds: ±25° Y, ±12° X) with Elastic Spring Return  |
|  - CatParticles.ts: Zero-GC Particle Pool (Hearts, Sweat/Anger, Completion Stars)  |
|  - WebGL Lifecycle: Clean Geometry/Material/Texture disposal on unmount          |
+-----------------------------------------------------------------------------------+
                         │                                       │
                         ▼                                       ▼
+------------------------------------------+ +--------------------------------------+
| CatProceduralMesh.ts & CatRig.ts         | | CatAnimator.ts                       |
| - Procedural Mesh Hierarchy:             | | - requestAnimationFrame Render Loop  |
|   Head, Body, Ears, Cheeks, Whiskers,    | | - Integrates CatPhysics ODEs:        |
|   Eyes (Pupils, Eyelids, Brows), Mouth   | |   * Volume-Preserving Squash/Stretch |
|   (Jaw, Tongue), Paws, 6-Segment Tail.   | |   * Damped Harmonic Spring Jiggle    |
| - CatMaterials.ts: Toon Palette & 4-step | |   * 6-Segment Wave Tail Kinematics   |
|   Cel-Shading DataTexture Ramp.          | |   * Micro-saccades & Emotive Blinks  |
+------------------------------------------+ |   * Idle Behaviors State Machine     |
                                             |   * Asymmetric Lip-Sync (Attack/Decay)|
                                             +--------------------------------------+
                                                                 │
                                                                 ▼
                                             +--------------------------------------+
                                             | CatPhysics.ts (Mathematical Core)    |
                                             | - Volume preservation formula        |
                                             | - Semi-implicit Euler harmonic ODEs  |
                                             | - Multi-frequency wave equations     |
                                             | - Saccadic jump generators           |
                                             +--------------------------------------+
```

---

## Feature Inventory

Every requirement from `ORIGINAL_REQUEST.md` (R1-R4) and survey findings is inventoried and mapped to an implementation milestone:

| # | Feature | Category | Priority | Milestone | Source |
|---|---------|----------|----------|-----------|--------|
| F-01 | Volume-Preserving Squash & Stretch ($S_x = S_z = 1/\sqrt{S_y}$, pivot offset) | R1 Physics | P0 | M1 | ORIGINAL_REQUEST §R1 |
| F-02 | Damped Harmonic Spring Jiggle Physics (cheeks, belly, ear tips, whiskers) | R1 Physics | P0 | M1 | ORIGINAL_REQUEST §R1 |
| F-03 | 6-Segment Multi-Harmonic Tail Wave (fundamental $\omega_1$, overtone $\omega_2$, tip flick $\omega_3$) | R1 Kinematics | P0 | M1 | ORIGINAL_REQUEST §R1 |
| F-04 | Eye Micro-Saccades & Emotional Eyelids (Poisson jitter, fixational drift, pupil dilation, emotional blinks) | R1 Eyes | P0 | M1 | ORIGINAL_REQUEST §R1 |
| F-05 | Studio Toon 3-Point Lighting (Warm Key 1.5, Cool Fill 0.65, Cyan/Toon Rim 1.25) | R2 Lighting | P0 | M2 | ORIGINAL_REQUEST §R2 |
| F-06 | Dynamic Soft Contact Shadow Blob (Radius $R(h)$ & Alpha $\alpha(h)$ inversely scaling with cat height) | R2 Shadow | P0 | M2 | ORIGINAL_REQUEST §R2 |
| F-07 | Zero-GC WebGL Particle VFX System (floating hearts, cartoon sweat/anger streaks, sparkling stars) | R2 VFX | P0 | M2 | ORIGINAL_REQUEST §R2 |
| F-08 | WebGL Lifecycle & Context Fix (fix useEffect deps recreating context, dispose all geometries & materials) | R2 Stability | P0 | M2 | ORIGINAL_REQUEST §R2 & Survey |
| F-09 | 3D Drag Rotation with Elastic Spring Return ($\theta_y \in [-25^\circ, +25^\circ]$, $\theta_x \in [-12^\circ, +12^\circ]$) | R3 Controls | P0 | M3 | ORIGINAL_REQUEST §R3 |
| F-10 | Cursor Petting Interaction (purr vibration $\Delta Y = 0.002\cos(50t)$, pinned ears, squinting eyes, hearts VFX) | R3 Gestures | P0 | M3 | ORIGINAL_REQUEST §R3 |
| F-11 | Belly Poke Recoil Bounce & Grumpy Reaction (elastic recoil impulse, ear twitch, grumpy expression) | R3 Gestures | P0 | M3 | ORIGINAL_REQUEST §R3 |
| F-12 | Natural Idle Behavior State Machine (stretch yawn, ear scratch, paw lick after $t > 10$s with instant interrupt) | R3 Idle | P0 | M3 | ORIGINAL_REQUEST §R3 |
| F-13 | Smooth Lip-Sync & Facial Morphing (asymmetric attack $28\text{ s}^{-1}$ vs decay $13\text{ s}^{-1}$, tongue tremor, brows/ears sync) | R4 Lip-Sync | P0 | M3 | ORIGINAL_REQUEST §R4 |
| F-14 | Comprehensive Test Suite & Integrity Audit (`tests/pomodoro-leo.test.ts`, `npm run typecheck`, Forensic Audit CLEAN) | Verification | P0 | M4 | ORIGINAL_REQUEST §AC |

---

## Milestones

| # | Name | Scope | Dependencies | Status | Key Outputs |
|---|------|-------|-------------|--------|-------------|
| **M1** | Core Physics, Rig Anatomy & Secondary Motion Engine | Create `src/components/cat/CatPhysics.ts` (pure math for volume preservation, damped harmonic oscillators, multi-harmonic tail wave, micro-saccades). Update `CatRig.ts` (expose `cheekL`, `cheekR`, ear tips, whisker joints) and `CatProceduralMesh.ts`. | none | **DONE** | `CatPhysics.ts`, `CatRig.ts`, `CatProceduralMesh.ts` (Euler ODEs, volume preservation, tail kinematics, micro-saccades) |
| **M2** | Studio 3-Point Lighting, Contact Shadow Blob, VFX Particles & Lifecycle | Create `src/components/cat/CatParticles.ts` (zero-GC pooled particles for hearts, anger/sweat, stars). Update `CatCanvas.tsx` (add 3-point lighting, dynamic soft contact shadow, particle system tick, fix useEffect context re-creation bug, dispose all geometries/materials). | M1 | **DONE** | `CatParticles.ts`, `CatCanvas.tsx` (Warm Key 1.5, Cool Fill 0.65, Rim 1.25, dynamic blob shadow, 64-sprite pool, full dispose) |
| **M3** | Interactive Controls, Gestures, Idle Behaviors & Smooth Lip-Sync | Update `CatAnimator.ts` (integrate CatPhysics ODEs, idle state machine, petting purr, belly poke bounce, asymmetric attack/decay lip-sync with tongue tremor, emotion morphs). Update `CatCanvas.tsx` (pointer drag rotation with bounds and elastic return spring, petting and poke raycast dispatch). | M1, M2 | **DONE** | `CatAnimator.ts`, `useCatAudioLipSync.ts` (±25° Y / ±12° X drag rotation with spring return, purr vibration, recoil bounce, idle state machine, asymmetric lip-sync) |
| **M4** | E2E Verification, Test Suite & Forensic Audit | Expand `tests/pomodoro-leo.test.ts` with comprehensive unit and algorithmic tests for physics, volume preservation, harmonic springs, tail wave, drag bounds, lip-sync kinetics, particle lifecycle. Verify `npm run typecheck` (0 errors), run all tests, pass independent forensic audit. | M1, M2, M3 | **DONE** | 30/30 baseline tests pass, 15/15 adversarial stress tests pass, 9/9 lifecycle tests pass (54/54 total pass), typecheck 0 errors, Forensic Audit CLEAN |


---

## Interface Contracts

### `src/components/cat/CatPhysics.ts`
```typescript
export interface SpringState {
  position: number;
  velocity: number;
  target: number;
}

export interface SpringParams {
  stiffness: number; // k (e.g. 100 - 350)
  damping: number;   // c (e.g. 12 - 25)
  mass?: number;     // m (default 1.0)
}

/**
 * Step a 2nd-order damped harmonic spring using Semi-Implicit Euler.
 * Clamps dt to prevent numerical instability.
 */
export function stepSpring(state: SpringState, params: SpringParams, dt: number): void;

/**
 * Calculate volume-preserving Scale_X and Scale_Z from Scale_Y.
 * Scale_X = Scale_Z = 1 / sqrt(Scale_Y)
 * Clamps Scale_Y in safe interval [0.5, 1.8].
 */
export function calculateVolumePreservingScale(scaleY: number): { scaleX: number; scaleY: number; scaleZ: number };

/**
 * Calculate tail segment rotation based on multi-harmonic wave propagation.
 */
export function calculateTailSegmentRotation(
  segmentIndex: number,
  totalSegments: number,
  time: number,
  baseFrequency: number,
  baseAmplitude: number
): { x: number; y: number; z: number };

/**
 * Micro-saccade state machine generator producing bio-realistic eye drift and saccadic jumps.
 */
export interface SaccadeState {
  currentOffset: { x: number; y: number };
  targetOffset: { x: number; y: number };
  nextJumpTime: number;
}
export function updateMicroSaccade(saccade: SaccadeState, time: number, dt: number): { x: number; y: number };

/**
 * Clamped 3D Drag Rotation with elastic return spring.
 */
export interface DragRotationState {
  rotX: number; // radians, clamped to [-12deg, +12deg]
  rotY: number; // radians, clamped to [-25deg, +25deg]
  velX: number;
  velY: number;
  isDragging: boolean;
}
export function updateDragRotation(state: DragRotationState, dt: number): void;
```

### `src/components/cat/CatParticles.ts`
```typescript
import * as THREE from 'three';

export type ParticleType = 'heart' | 'sweat' | 'star';

export interface CatParticleSystem {
  group: THREE.Group;
  spawn(type: ParticleType, count?: number, origin?: THREE.Vector3): void;
  update(delta: number): void;
  dispose(): void;
}

export function createCatParticleSystem(): CatParticleSystem;
```

---

## Code Layout

```
web/
├── src/
│   └── components/
│       └── cat/
│           ├── CatPhysics.ts            # Mathematical physics core (springs, volume preservation, tail, saccades) [NEW]
│           ├── CatParticles.ts          # Zero-GC WebGL particle system (hearts, sweat/anger, stars) [NEW]
│           ├── CatRig.ts                # Updated rig definition (exposes cheeks, ear tips, tail segments)
│           ├── CatProceduralMesh.ts     # Procedural mesh hierarchy & click targets
│           ├── CatMaterials.ts          # Toon cel-shading ramps, materials, color palettes
│           ├── CatAnimator.ts           # Animation loop integrating physics, idle state machine, gestures, lip-sync
│           ├── CatCanvas.tsx            # Three.js canvas, 3-point lighting, dynamic shadow blob, drag controls, lifecycle
│           ├── CatStateMachine.ts       # Action state classifier from Pomodoro context
│           └── useCatAudioLipSync.ts    # TTS Web Audio analysis hook
└── tests/
    └── pomodoro-leo.test.ts             # Comprehensive pure-function and integration test suite
```
