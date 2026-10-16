# DISPATCH — worker_leo

## Identity & Role
- Name: worker_leo
- Type: teamwork_preview_worker
- Working directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_leo\`
- Project scope document: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_12\PROJECT.md`
- Authoritative user request: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md` (see timestamp `## 2026-10-13T17:18:44Z`)
- Reference reports:
  * `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_leo_survey_1\report.md`
  * `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_leo_survey_2\report.md`
  * `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_leo_survey_1\report.md`
- App working directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`
- Exclusive file ownership:
  * `src/components/cat/CatPhysics.ts` (NEW)
  * `src/components/cat/CatParticles.ts` (NEW)
  * `src/components/cat/CatRig.ts`
  * `src/components/cat/CatProceduralMesh.ts`
  * `src/components/cat/CatCanvas.tsx`
  * `src/components/cat/CatAnimator.ts`
  * `src/components/cat/useCatAudioLipSync.ts`
  (Do NOT touch `tests/pomodoro-leo.test.ts` or other tests).

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Mission (Implementation Track)
Implement the complete Disney/Pixar toon upgrade for the Leo 3D Character in `web/src/components/cat/`:

### R1. Secondary Motion & Squash/Stretch Engine
1. Create `src/components/cat/CatPhysics.ts`:
   - Volume-preserving Squash & Stretch: $S_x = S_z = 1/\sqrt{S_y}$, ground contact height compensation $\Delta Y = (S_y - 1) \cdot H_{pivot}$.
   - 2nd-order damped harmonic oscillators (Semi-Implicit Euler):
     $\ddot{x} + 2\zeta\omega_0\dot{x} + \omega_0^2(x - x_t) = 0$.
     Parameterized for:
     * Cheeks: $k \approx 200, c \approx 18$
     * Belly: $k \approx 100, c \approx 14$
     * Ear tips: $k \approx 320, c \approx 22$
     * Whiskers: $k \approx 500, c \approx 30$
     Clamp $\Delta t \le 0.033$s to guarantee numerical stability.
   - 6-segment tail multi-frequency wave propagation:
     Combine fundamental wave $\omega_1$, harmonic overtone $\omega_2$, tip flick $\omega_3$, and progressive distal amplitude envelope $A(i) = A_0 (0.35 + 0.65 \frac{i}{5})$.
   - Micro-saccades & emotional blinks:
     Poisson/random interval jumps ($[0.8, 2.4]$s) with smooth drift, pupil size modulation, emotional eyelid morphs (enjoyment closed, skeptical squint, angry wide).
2. Update `CatRig.ts` & `CatProceduralMesh.ts`:
   - Expose `cheekL`, `cheekR`, ear tips in `CatRig`.
   - Ensure mesh hierarchy and pivots allow spring displacement without tearing.

### R2. Studio Toon 3-Point Lighting, Soft Blob Shadow & VFX Particles
1. Create `src/components/cat/CatParticles.ts`:
   - Zero-GC pooled WebGL particle system using `THREE.InstancedMesh` or `THREE.Points` or reusable mesh sprites.
   - Types:
     * Floating pink hearts (petting, praise)
     * Cartoon sweat drops / anger mark streaks (poking, strict reprimand)
     * Sparkling stars (focus session completion)
   - Lifecycle management with alpha fade, position update, and `dispose()`.
2. Update `CatCanvas.tsx`:
   - Implement Studio 3-Point Toon Lighting:
     * Warm Key Light (intensity ~1.5, angle from upper front-right)
     * Cool Gentle Fill Light (intensity ~0.65, soft blue tint from lower front-left)
     * Rim / Back Light (intensity ~1.25, cyan/bright toon rim from rear-top)
   - Dynamic Soft Contact Shadow Blob:
     * Radius $R(h) = R_0 (1 - 0.42h)$
     * Opacity $\alpha(h) = \alpha_0 / (1 + 3.2h)$
     Adapts dynamically in real-time as the cat jumps or bounces.
   - Fix WebGL Lifecycle Bug:
     * Remove `state` from the `useEffect` dependency array that initializes Three.js canvas. Manage state changes imperatively without destroying/recreating the canvas!
     * Call `geometry.dispose()`, `material.dispose()`, `texture.dispose()` on unmount.
     * Ensure 100% transparent canvas (`alpha: true`, `clearColor: 0x000000, 0`).

### R3. Interactive Controls & Natural Gestures
1. In `CatCanvas.tsx`:
   - 3D Drag Rotation with Elastic Spring Return:
     * Pointer down, move, up handlers.
     * Rotates Leo smoothly: Y axis bounded strictly to $[-25^\circ, +25^\circ]$ ($[-0.436, +0.436]$ rad), X axis bounded strictly to $[-12^\circ, +12^\circ]$ ($[-0.209, +0.209]$ rad).
     * On pointer release, critically damped spring smoothly returns rotation to $(0, 0)$.
2. In `CatAnimator.ts` & `CatCanvas.tsx`:
   - Cursor Petting Interaction (head rub):
     * Mèo hạ tai (ears pin down), nhắm mắt lim dim hưởng thụ.
     * Thân rung nhẹ purr vibration ($\Delta Y = 0.002\cos(50t)$).
     * Spawns floating hearts VFX.
   - Belly Poke Interaction:
     * Recoil bounce spring impulse ($S_y$ compresses, pops up).
     * Vẫy tai cáu kỉnh, kêu quạo, spawns anger mark VFX.
   - Idle State Machine:
     * Inactivity timer ($t > 10$s) triggers random natural behaviors:
       1. Stretch & yawn (ngáp vươn vai)
       2. Ear scratch (gãi tai)
       3. Paw lick (liếm mu bàn chân)
     * Any user interaction (click, hover, audio, timer event) instantly interrupts idle and transitions back to active.

### R4. Lip-Sync & Synchronized Facial Expressions
1. In `CatAnimator.ts` & `useCatAudioLipSync.ts`:
   - Asymmetric attack/decay kinetics: jaw opens rapidly ($k_{attack} \approx 28\text{ s}^{-1}$) and closes smoothly ($k_{decay} \approx 13\text{ s}^{-1}$).
   - Tongue elevation and subtle tremor during speech.
   - Synchronize eyebrows, eyelids, and ears with character dialogue and emotion.

### Quality & Verification Requirements:
- Run `npm run typecheck` in `web/` — must pass with 0 TypeScript errors.
- Ensure 0 regressions for existing functionality and existing tests.
- Write a 5-component handoff report to `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_leo\handoff.md`.
- Send completion message to orchestrator.


## 2026-10-13T17:31:05Z
You are worker_leo.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_leo\
Read your directives at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_leo\DISPATCH.md
Read the project document at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_12\PROJECT.md
Read the authoritative user request at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (see timestamp ## 2026-10-13T17:18:44Z).
App working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusive file ownership:
- src/components/cat/CatPhysics.ts (NEW)
- src/components/cat/CatParticles.ts (NEW)
- src/components/cat/CatRig.ts
- src/components/cat/CatProceduralMesh.ts
- src/components/cat/CatCanvas.tsx
- src/components/cat/CatAnimator.ts
- src/components/cat/useCatAudioLipSync.ts
(Do NOT modify tests/pomodoro-leo.test.ts).

Implement all features R1, R2, R3, R4:
1. CatPhysics.ts: volume preservation, damped spring ODEs, 6-segment wave propagation, micro-saccades, drag rotation physics.
2. CatRig.ts & CatProceduralMesh.ts: expose cheek joints, ear tips.
3. CatParticles.ts: zero-GC pooled particle VFX (hearts, sweat/anger, stars).
4. CatCanvas.tsx: 3-point toon lighting, dynamic contact shadow blob, 3D drag rotation with spring return, petting/poke dispatch, fix useEffect state dependency bug, full WebGL disposal.
5. CatAnimator.ts: integrate CatPhysics, purr vibration, recoil bounce, idle behaviors state machine, asymmetric lip-sync and tongue tremor.

Verify npm run typecheck passes with 0 errors.
Write your handoff report to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_leo\handoff.md.
Send completion message to orchestrator.
