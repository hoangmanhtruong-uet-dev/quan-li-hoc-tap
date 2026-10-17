# BRIEFING — 2026-10-17T01:38:00Z

## Mission
Implement Milestone 2: Cyber-Glass Lockout HUD & Vietnamese TTS in `extension/content.js`.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m2_1
- Original parent: 051c51ec-d4c0-431c-b685-75179c16a0da
- Milestone: Milestone 2: Cyber-Glass Lockout HUD & Vietnamese TTS

## 🔒 Key Constraints
- Exclusive write ownership: `extension/content.js`. Do NOT touch or modify any other files outside working directory.
- Shadow DOM injection with `mode: "open"` into `document.documentElement`, preventing duplicate injection.
- Complete CSS isolation from host web pages.
- Cyber-Glass visual styling (RGBA overlay, backdrop-filter blur 25px, 1px neon pink/red border, frosted modal, glowing shadow, sticker badge "PHÁT HIỆN VI PHẠM KỶ LUẬT").
- Screen shake CSS animation (@keyframes screen-shake 0.65s).
- Mascot cutout (`chrome.runtime.getURL('assets/fat-orange-cat.png')`).
- Scolding phrases + TTS (`/api/tts` audio or Web Speech API `vi-VN`) + high contrast speech bubble.
- 5s live countdown progress bar -> auto `CLOSE_TAB_AND_FOCUS_CAMPUS`.
- Exemption button (`REQUEST_EXEMPTION`, 180s) -> if granted remove HUD, if denied show scolding / wait time.
- Relay for `localhost:3000` / `campusos.vn` postMessage to background.
- Pass `npm test` and `npm run typecheck` in `web/`.

## Current Parent
- Conversation ID: 051c51ec-d4c0-431c-b685-75179c16a0da
- Updated: 2026-10-17T01:38:00Z

## Task Summary
- **What to build**: Full-featured Cyber-Glass Lockout HUD & Vietnamese TTS in `extension/content.js`.
- **Success criteria**: Verified styling, shadow DOM isolation, countdown & actions, TTS fallback, exemption logic, web relay, all web tests & typechecks pass.
- **Interface contracts**: PROJECT.md, spec_miner_survey_3 handoff report (§ 2.3 & § 3).
- **Code layout**: `extension/content.js`.

## Key Decisions Made
- Implemented `safeSendMessage` helper to gracefully handle both Promise-based (MV3) and callback-based invocation of `chrome.runtime.sendMessage` without throwing `Cannot read properties of undefined (reading 'catch')`.
- Embedded all CSS styles within the Shadow DOM's `<style>` node attached to `#campusos-lockout-hud-root`, guaranteeing 100% CSS isolation from distracting external sites.
- Speech audio implements a two-tier pipeline: attempts `/api/tts` (Neural TTS) with timeout, smoothly falling back to Web Speech API `SpeechSynthesisUtterance` (`vi-VN`).
- Autoplay policy mitigation: Speech bubble is rendered with bold typography on a high-contrast white card with `#ff3d6e` border; click on the mascot or HUD card re-triggers speech synthesis under user gesture.
- Cooldown feedback on exemption denial: Button is locked in disabled state showing remaining wait seconds (`🚫 Đang hồi phục (Xs)`) and the mascot scolds the user.

## Artifact Index
- `extension/content.js` — Cyber-Glass HUD & Content Script Implementation
- `.agents/teamwork/worker_m2_1/verify_hud.test.js` — Verification test suite for Milestone 2
- `.agents/teamwork/worker_m2_1/handoff.md` — Handoff report

## Change Tracker
- **Files modified**: `extension/content.js` (Created comprehensive Cyber-Glass Lockout HUD, TTS, 5s countdown, exemption handler, and web relay)
- **Build status**: PASS (`npm test` 453/453 pass, `npm run typecheck` 0 errors, `verify_hud.test.js` 4/4 pass)
- **Pending issues**: None

## Quality Status
- **Build/test result**: All 453 web test suites pass cleanly + 4/4 verification suites pass
- **Lint status**: 0 errors
- **Tests added/modified**: `.agents/teamwork/worker_m2_1/verify_hud.test.js`

## Loaded Skills
- None explicitly loaded
