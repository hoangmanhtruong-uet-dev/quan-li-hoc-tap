# BRIEFING — 2026-10-13T17:50:00Z

## Mission
Adversarial empirical testing on WebGL lifecycle, VFX particle pooling, dynamic shadow optics, and audio lip-sync kinetics.

## 🔒 My Identity
- Archetype: empirical challenger
- Roles: critic, specialist
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\challenger_leo_2
- Original parent: 3e427fb4-3e3a-4d2d-ade5-f2f9df64bc18
- Milestone: M2/M3/M4 adversarial verification
- Instance: 2 of 2

## 🔒 Key Constraints
- Review-only — do NOT modify implementation code
- Run verification code directly — empirical proof required
- If cannot reproduce a bug empirically, it does not count

## Current Parent
- Conversation ID: 3e427fb4-3e3a-4d2d-ade5-f2f9df64bc18
- Updated: 2026-10-13T17:50:00Z

## Review Scope
- **Files to review**: `web/src/components/cat/CatParticles.ts`, `web/src/components/cat/CatCanvas.tsx`, `web/src/components/cat/CatAnimator.ts`, `web/src/components/cat/useCatAudioLipSync.ts`, `web/tests/pomodoro-leo.test.ts`
- **Interface contracts**: `PROJECT.md` CatParticles, 3-point lighting, contact shadow optics, lip-sync kinetics
- **Review criteria**: correctness, memory stability (zero-GC, pool recycling, dispose), boundary safety, numerical stability

## Attack Surface
- **Hypotheses tested**:
  1. Particle pool burst spawning (500+ items) into 64-capacity pool will cause memory growth, leak sprites, or throw unhandled exceptions. [REFUTED: Pool strictly clamps active count and preserves 64 sprites without growth].
  2. Calling `dispose()` leaves textures/materials dangling or throws on subsequent calls. [REFUTED: Scene group cleared to 0 children, textures/materials destroyed, double-call is idempotent].
  3. Contact shadow optics under $h \in [-10, 100]$, NaN, Infinity produces negative, inverted, or NaN shadow scale/opacity. [REFUTED: $h$ is strictly clamped to $\ge 0$, radius factor has floor 0.40, opacity factor has floor 0.08, output strictly bounded in $(0, 1.9]$ and $(0, 0.55]$].
  4. 3-point lighting does not conform to Pixar/toon lighting ratio and orientation. [REFUTED: Key 1.5 front-right, Fill 0.65 front-left, Rim 1.25 rear-top, Key/Fill ratio = 2.31, Rim/Fill ratio = 1.92].
  5. Audio amplitude inputs with negative, extreme, or NaN values cause lip-sync pops, NaN rotations, or unhandled exceptions. [REFUTED: Mapped jaw openness clamps strictly to $[0, 1]$, asymmetric kinetics $k_{attack} = 28\text{ s}^{-1} > k_{decay} = 13\text{ s}^{-1}$ smooths transitions with bounded maximum delta per frame $< 0.5$, tongue tremor zero when mouth is closed].
- **Vulnerabilities found**:
  - IEEE 754 zero artifact: `Math.sin(t) * 0.025 * 0` produces `-0` when `Math.sin < 0`, which in strict `Object.is` checking distinguishes from `+0`. In actual Three.js runtime, `-0` converts to `+0` in WebGL uniform floats.
- **Untested angles**: Hardware-specific WebGL context loss handling on low-end mobile GPU (emulated via `renderer.forceContextLoss()`).

## Loaded Skills
- **Source**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agent\skills\verification-before-completion\SKILL.md`
  - **Local copy**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\challenger_leo_2\skills\verification-before-completion.md`
  - **Core methodology**: Evidence before assertions always. Run fresh verification commands, read full output.
- **Source**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agent\skills\systematic-debugging\SKILL.md`
  - **Local copy**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\challenger_leo_2\skills\systematic-debugging.md`
  - **Core methodology**: Find root cause before proposing fixes; observe actual error, verify hypotheses, trace data flow.

## Key Decisions Made
- Wrote independent adversarial stress test harness `web/tests/challenger-leo-2-adversarial.test.ts`.
- Verified all 54 tests pass across `pomodoro-leo.test.ts`, `challenger-leo-2-adversarial.test.ts`, and `challenger-leo-adversarial-stress.test.ts`.
- Confirmed zero errors in `npm run typecheck`.
- Final verdict: **APPROVE**.

## Artifact Index
- handoff.md — Final 5-component handoff report
- progress.md — Liveness heartbeat
- web/tests/challenger-leo-2-adversarial.test.ts — Adversarial stress test harness
