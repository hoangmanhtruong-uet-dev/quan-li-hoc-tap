# DISPATCH — spec_miner_leo_survey_1

## Identity & Role
- Name: spec_miner_leo_survey_1
- Type: teamwork_preview_spec_miner
- Working directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_leo_survey_1\`
- Authoritative user request: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md` (see timestamp `## 2026-10-13T17:18:44Z`)
- App working directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`

## Mission
Extract and formalize the complete, rigorous specification of requirements for the Disney/Pixar-grade Leo 3D character upgrade:
1. Formalize R1: Secondary Motion & Squash/Stretch:
   - Volume preservation equation: `Scale_Y * Scale_X * Scale_Z ≈ 1` (e.g. if Scale_Y = 1 + s, Scale_X = Scale_Z = 1 / sqrt(1 + s) or similar approximation).
   - Damped spring equation: `f = -k * x - c * v` or standard 2nd-order damped harmonic oscillator for cheeks, belly, ear tips, whiskers.
   - 6-segment tail kinematics: multi-frequency sinusoidal wave delay per segment.
   - Micro-saccades & emotional blinks (enjoyment closed, skeptical squint, angry wide).
2. Formalize R2: Studio Toon 3D Lighting & VFX:
   - 3-point lighting setup: Key light (warm), Fill light (cool gentle), Rim/Back light (highlight edge separating from dark background).
   - Soft contact shadow blob: circular/oval mesh or shader with radius and opacity scaling inversely with cat elevation Y.
   - 3 VFX particle systems: floating pink hearts, cartoon sweat/anger streaks, sparkling stars. Lifecycle, alpha, pooling, cleanup.
   - 100% transparent canvas (`alpha: true`), antialias, WebGL dispose safety.
3. Formalize R3: Interactive Controls & Natural Gestures:
   - 3D drag rotation bounds: Y axis within [-25°, +25°], X axis within [-12°, +12°], smooth spring return on release.
   - Petting interaction (cursor over head): ears pin down, eyes squint, purr vibration shake, floating hearts VFX.
   - Belly poke interaction (click/tap belly): recoil bounce spring, ear twitch, grumpy reaction.
   - Idle behaviors: stretch yawn, ear scratch, paw lick.
4. Formalize R4: Lip-Sync & Synchronized Emotions:
   - Jaw opening and tongue motion responding smoothly to Web Audio TTS amplitude/frequency with natural attack/decay.
   - Eyebrows, eyelids, and ears morphing in sync with dialogue and personality.
5. Formalize Acceptance Criteria and map exact test specifications needed for `node --test tests/pomodoro-leo.test.ts` and `npm run typecheck`.

## Deliverables
- Write your comprehensive specification report to:
  `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_leo_survey_1\report.md`
- Write a standard handoff report to:
  `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_leo_survey_1\handoff.md`
- Send a message back to the orchestrator upon completion.


## 2026-10-13T17:22:00Z
You are spec_miner_leo_survey_1.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_leo_survey_1\
Read your directives at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_leo_survey_1\DISPATCH.md
Read the authoritative user request at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (see timestamp ## 2026-10-13T17:18:44Z).
App working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web

Extract and formalize the complete, rigorous specification of requirements:
1. Formalize R1: Secondary Motion & Squash/Stretch equations, volume preservation, damped spring formulas, 6-segment tail kinematics, micro-saccades & eye blinks.
2. Formalize R2: Studio Toon 3D Lighting (Key, Fill, Rim) & VFX (blob shadow, hearts, sweat/anger, stars), transparency, cleanup.
3. Formalize R3: Interactive Controls (3D drag rotation [-25°, +25°] Y, [-12°, +12°] X with spring return, cursor petting purr vibration, belly poke recoil bounce, idle timeout behaviors).
4. Formalize R4: Lip-Sync (Web Audio amplitude/frequency driving jaw opening and tongue motion smoothly) and synchronized emotions.
5. Formalize Acceptance Criteria and test specification for tests/pomodoro-leo.test.ts and npm run typecheck.
