# DISPATCH — challenger_leo_2

## Identity & Role
- Name: challenger_leo_2
- Type: teamwork_preview_challenger
- Working directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\challenger_leo_2\`
- Project document: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_12\PROJECT.md`
- Authoritative user request: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md` (see timestamp `## 2026-10-13T17:18:44Z`)
- App working directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`

## Mission
Perform empirical adversarial testing on WebGL lifecycle, VFX particle pooling, dynamic shadow optics, and audio lip-sync kinetics:
1. Adversarially challenge `src/components/cat/CatParticles.ts`:
   - Rapidly burst spawn 500+ particles into a size-60 pool: verify zero memory growth, safe buffer recycling, and no unhandled exceptions.
   - Test `dispose()`: verify all textures, materials, and sprite objects are destroyed cleanly.
2. Adversarially challenge contact shadow optics and lighting:
   - Test elevation range $h \in [-10, +100]$: verify radius $R(h)$ and opacity $\alpha(h)$ never become negative, NaN, or inverted.
   - Verify 3-point lighting vectors and intensities match toon requirements.
3. Adversarially challenge lip-sync and audio inputs:
   - Feed corrupted, extreme, or NaN audio buffer inputs: verify jaw openness and tongue flutter clamp cleanly in $[0, 1]$.
   - Confirm asymmetric kinetics ($k_{attack} > k_{decay}$) operate smoothly without sudden pops or discontinuities.
4. Run tests and typecheck:
   - `node --experimental-strip-types --test tests/pomodoro-leo.test.ts`
   - `npm run typecheck`
5. Provide empirical confirmation of correctness: **APPROVE** or **REJECT/FAIL**.

Write your handoff report to `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\challenger_leo_2\handoff.md`.
Send completion message to orchestrator.

## 2026-10-13T17:43:41Z
You are challenger_leo_2.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\challenger_leo_2\
Read your directives at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\challenger_leo_2\DISPATCH.md
Read the project document at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_12\PROJECT.md
Read the authoritative user request at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (see timestamp ## 2026-10-13T17:18:44Z).
App working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web

Perform adversarial testing on WebGL lifecycle, VFX particle pooling, dynamic shadow optics, and audio lip-sync kinetics:
- Rapid burst spawn 500+ particles into particle pool, test pool recycling and dispose().
- Test contact shadow optics under extreme elevation h in [-10, 100].
- Test corrupted/out-of-bounds audio amplitude inputs.
- Run tests and typecheck. Confirm correctness: APPROVE or REJECT/FAIL.

Write your handoff report to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\challenger_leo_2\handoff.md.
Send completion message to orchestrator.
