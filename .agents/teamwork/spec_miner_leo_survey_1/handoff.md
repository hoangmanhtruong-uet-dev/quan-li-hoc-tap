# HANDOFF REPORT — spec_miner_leo_survey_1

- **Role**: `specification_miner`
- **Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_leo_survey_1\`
- **Parent Conversation ID**: `3e427fb4-3e3a-4d2d-ade5-f2f9df64bc18`
- **Timestamp**: 2026-10-13T17:35:00Z
- **Handoff Type**: Hard (Task Complete)

---

## 1. Observation
1. **Authoritative User Request**:
   - In `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md` (lines 289-339, timestamp `## 2026-10-13T17:18:44Z`):
     - R1: Secondary Motion & Squash/Stretch ($S_y \cdot S_x \cdot S_z \approx 1$), damped spring for cheeks, belly, ear tips, whiskers; 6-segment tail multi-frequency wave; micro-saccades & emotional blinks.
     - R2: Studio Toon 3D Lighting (Key, Fill, Rim), soft contact shadow blob adapting to elevation $Y$, 3 VFX particle systems (hearts, anger/sweat, stars), 100% transparent canvas (`alpha: true`), WebGL resource disposal.
     - R3: Interactive controls (3D drag rotation within $[-25^\circ, +25^\circ]$ Y and $[-12^\circ, +12^\circ]$ X with spring return, cursor petting purr vibration, belly poke recoil bounce, idle timeout behaviors).
     - R4: Lip-Sync (Web Audio TTS amplitude/frequency driving jaw and tongue smoothly with attack/decay), emotional blending.
     - Acceptance criteria: `npm run typecheck` passes, `node --test tests/pomodoro-leo.test.ts` passes 100%.

2. **Existing Implementation Analysis**:
   - `src/components/cat/CatRig.ts` (lines 53-56, lines 63-69):
     Defines 6 tail segments `tailSegments: THREE.Group[]`, click targets `{ belly, head, pawL, pawR, tail }`.
   - `src/components/cat/CatAnimator.ts`:
     - Lines 127-175: `updateBlinking(delta)` uses simple `Math.sin(blinkProgress * Math.PI)` with symmetric eyelid angle.
     - Lines 177-189: `updateJaw(delta)` uses symmetric `lerp(currentJawOpen, jawOpenTarget, delta * 20)` without asymmetric attack/decay.
     - Lines 207-260: `updateBreathingAndTail(delta)` modulates `belly.scale.z` without volume preservation; tail uses single-frequency sine wave.
     - Lines 63-78: `triggerPoke` and `triggerHeadPat` lack damped spring recoil, purr micro-vibration, and VFX hooks.
   - `src/components/cat/CatCanvas.tsx`:
     - Lines 123-132: Uses AmbientLight and two DirectionalLights (`keyLight` at 1.3, `rimLight` at 0.85); lacks dedicated Fill Light.
     - Lines 135-157: Static blob shadow mesh at $y = -0.68$, not responsive to cat height.
     - Lines 233-250: Render loop has no particle updates or drag rotation controls.
   - `tests/pomodoro-leo.test.ts`:
     - Lines 10-123: Contains 3 tests covering `DEFAULT_POMODORO_SETTINGS`, `CatStateMachine`, and `CHARACTERS` quotes. No physics, lighting, rotation bounding, or lip-sync tests exist.

3. **Current Execution Baseline**:
   - Command: `node --test tests/pomodoro-leo.test.ts` executed in `web/` exited with code 0:
     `✔ PomodoroSettings: default values are valid and populated (0.5747ms)`
     `✔ CatStateMachine: maps context to correct cat action states (0.1702ms)`
     `✔ CharacterData: all 4 characters exist and have valid quotes (0.1525ms)`
     `ℹ pass 3, fail 0`
   - Command: `npm run typecheck` executed in `web/` exited with code 0 (0 TypeScript errors).

---

## 2. Logic Chain
1. *From Observation 1 & 2*: The existing code establishes a strong foundation (`CatRig`, procedural meshes, basic state machine), but the animation, physics, lighting, and interaction models are simplified approximations rather than the Disney/Pixar-grade toon standard required by the user.
2. *From Observation 2*:
   - To achieve volume preservation in R1 without performance overhead, the mathematical solution is $S_x = S_z = 1 / \sqrt{S_y}$ with bounding clamps $S_y \in [0.5, 1.8]$.
   - To achieve organic soft body motion for cheeks, belly, ear tips, and whiskers, a second-order damped harmonic oscillator ($\ddot{x} + 2\zeta\omega_0\dot{x} + \omega_0^2(x - x_t) = 0$) integrated via Semi-Implicit Euler provides guaranteed numerical stability when clamped to $\Delta t \le 0.05$s.
   - For 6-segment tail motion, propagating two wave frequencies with a linear phase delay $\phi_i = i \cdot \phi_0$ and distal amplitude scaling generates natural sinusoidal swaying.
3. *From Observation 2 & 3*:
   - In R2, studio toon 3-point lighting requires a warm Key (1.5), cool gentle Fill (0.65), and high-contrast Rim (1.25) combined with the 4-step cel-shading `DataTexture`. The contact shadow must scale inversely with cat vertical displacement: $R(h) = R_0 (1 - 0.42h)$, $\alpha(h) = \alpha_0 / (1 + 3.2h)$.
   - VFX particles must use pre-allocated pools (16 hearts, 24 stars, 2 anger marks) to ensure zero memory allocations per frame at 120FPS.
4. *From Observation 2 & 3*:
   - In R3, user drag rotation must clamp strictly to $\theta_y \in [-25^\circ, +25^\circ]$ and $\theta_x \in [-12^\circ, +12^\circ]$, with a critically damped spring return to $(0, 0)$ upon pointer release. Idle behavior must trigger after 12s of inactivity with instant interruption on user input.
5. *From Observation 2 & 3*:
   - In R4, natural lip-sync requires asymmetric attack ($k_{attack} = 28.0\text{ s}^{-1}$) vs decay ($k_{decay} = 13.0\text{ s}^{-1}$), driving both jaw hinge angle and tongue tremor.
6. *From Observation 2 & 3*:
   - Pure mathematical functions can and should be isolated into a standalone helper (e.g. `CatPhysics.ts`) so they can be unit-tested cleanly in `tests/pomodoro-leo.test.ts` without requiring WebGL headless canvas emulation.

---

## 3. Caveats
1. No application source files in `web/src` or `web/tests` were modified during this turn in accordance with the `specification_miner` role (strictly read-only).
2. The Web Audio analysis implementation relies on browser Web Audio API `AudioContext` and `AnalyserNode`. For unit testing in Node.js, tests will assert pure numerical functions and state logic rather than hardware audio decoders.
3. Reduced motion preferences (`reducedMotion = true` or `prefers-reduced-motion`) must always bypass high-frequency shaking and large scale bursts.

---

## 4. Conclusion
The comprehensive formal specification has been completed and documented in:
`d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_leo_survey_1\report.md`

All requirements R1, R2, R3, R4, acceptance criteria, mathematical equations, parameter tables, edge cases, and test specifications have been rigorously formalized. The implementation team has an exact, unambiguous blueprint to execute.

---

## 5. Verification Method
To independently verify the findings and baseline status:

1. **Verify Baseline Tests**:
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   node --test tests/pomodoro-leo.test.ts
   ```
   *Expected result*: 3 tests pass, 0 failures.

2. **Verify Baseline TypeScript Typecheck**:
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run typecheck
   ```
   *Expected result*: Exits with code 0.

3. **Verify Specification Document**:
   Inspect `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_leo_survey_1\report.md` to confirm all sections, equations, and tables are present and complete.
