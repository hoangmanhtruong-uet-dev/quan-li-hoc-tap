# DISPATCH — test_writer_leo

## Identity & Role
- Name: test_writer_leo
- Type: teamwork_preview_test_writer
- Working directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\test_writer_leo\`
- Project scope document: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_12\PROJECT.md`
- Authoritative user request: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md` (see timestamp `## 2026-10-13T17:18:44Z`)
- App working directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`
- File ownership: Exclusively owns `tests/pomodoro-leo.test.ts`. Must NOT edit application source code in `src/`.

## Mission (E2E Testing Track)
Design and implement a comprehensive, opaque-box, requirement-driven test suite in `tests/pomodoro-leo.test.ts` using Node.js native test runner (`node --test` or `node --experimental-strip-types --test`).
Derive tests directly from `ORIGINAL_REQUEST.md` (R1-R4) and `PROJECT.md`:

### Test Coverage Requirements:
1. **Tier 1: Feature Coverage (>= 5 per feature)**:
   - **R1 Secondary Motion & Squash/Stretch**:
     * Volume preservation: $S_x \cdot S_y \cdot S_z \approx 1$ across various $S_y$ values ($0.7, 0.9, 1.0, 1.2, 1.5$).
     * Damped harmonic oscillator springs: verify restitution towards target, decaying velocity, numerical stability under varying $\Delta t$.
     * 6-segment tail multi-frequency kinematics: phase lag increases monotonically along segments $0 \to 5$, amplitude scales with distal index.
     * Micro-saccades & eye blinks: Poisson timing interval bounds, target jumping within eye socket limits, eyelid angles for emotional states.
   - **R2 Studio Toon Lighting & VFX**:
     * 3-point lighting configuration validation: Key (warm, intensity ~1.5), Fill (cool, ~0.65), Rim (~1.25).
     * Contact shadow blob: radius $R(h)$ and opacity $\alpha(h)$ decrease monotonically with cat height $h \ge 0$.
     * VFX particle pooling: pool allocation, spawn of hearts, sweat/anger, stars, recycling and zero-GC bounds.
   - **R3 Interactive Controls & Gestures**:
     * 3D drag rotation bounds: clamped strictly within $Y \in [-25^\circ, +25^\circ]$ and $X \in [-12^\circ, +12^\circ]$.
     * Spring return: released rotation smoothly converges back to $(0, 0)$.
     * Petting & poke states: purr vibration parameters, poke recoil impulse.
     * Idle state machine: transitions after inactivity timeout ($>10$s), instant interruption on input.
   - **R4 Lip-Sync & Emotion Blend**:
     * Asymmetric attack vs decay kinetics ($k_{attack} > k_{decay}$).
     * Jaw openness clamped to $[0, 1]$, tongue elevation responds smoothly to audio amplitude.
     * Emotional eyebrow and ear morph targets mapped per character.
2. **Tier 2: Boundary & Corner Cases (>= 5 per feature)**:
   - Extreme delta time spikes ($\Delta t = 0$, $\Delta t = 0.5$s, $\Delta t = 5$s) - must clamp cleanly, no NaN or Infinity.
   - Extreme drag offsets ($1000$px swipe) - rotation clamps rigidly at $\pm 25^\circ$ / $\pm 12^\circ$.
   - Zero or negative volume scale inputs - must gracefully clamp to safe bounds $[0.5, 1.8]$.
   - Max particle pool exhaustion - graceful recycling, no memory leak.
   - Audio amplitude out-of-range ($< 0$ or $> 1$) - safely clamped.
3. **Preserve Existing Tests**:
   - Maintain passing status for existing 3 tests (`DEFAULT_POMODORO_SETTINGS`, `CatStateMachine`, and `CHARACTERS` quotes).

### Deliverables:
- Implement the test suite in `tests/pomodoro-leo.test.ts`.
- Run the test suite: `node --experimental-strip-types --test tests/pomodoro-leo.test.ts`.
- Publish `TEST_READY.md` at `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_12\TEST_READY.md`.
- Write your handoff to `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\test_writer_leo\handoff.md`.
- Send completion message to orchestrator.

## 2026-10-13T17:31:05Z
You are test_writer_leo.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\test_writer_leo\
Read your directives at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\test_writer_leo\DISPATCH.md
Read the project document at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_12\PROJECT.md
Read the authoritative user request at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (see timestamp ## 2026-10-13T17:18:44Z).
App working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
Exclusive file ownership: tests/pomodoro-leo.test.ts. Do NOT touch files in src/.

Implement comprehensive opaque-box tests for the Leo 3D Character covering R1-R4 in tests/pomodoro-leo.test.ts:
- Tier 1: Volume preservation, damped harmonic springs, 6-segment tail wave, micro-saccades, 3-point lighting params, contact shadow scaling, particle pooling, drag rotation bounds, spring return, lip-sync asymmetric kinetics.
- Tier 2: Boundary & corner cases (clamped dt spikes, 1000px drag, negative/zero scale clamp, audio amplitude limits).
- Preserve existing 3 tests.

Publish TEST_READY.md at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_12\TEST_READY.md.
Write your handoff report to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\test_writer_leo\handoff.md.
Send completion message to orchestrator.
