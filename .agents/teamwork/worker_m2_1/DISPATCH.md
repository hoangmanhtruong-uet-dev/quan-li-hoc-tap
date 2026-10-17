## 2026-10-17T01:27:30Z
You are worker_m2_1.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m2_1

MANDATORY FIRST STEP:
Read the authoritative user request at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically header ## 2026-10-17T00:51:59Z).
Also read:
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_survey_3\handoff.md (§ 2.3 & § 3 for HUD details)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusive Write Ownership:
You exclusively own and may create/modify:
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\extension\content.js
Do NOT touch or modify any other files.

Mission:
Implement Milestone 2: Cyber-Glass Lockout HUD & Vietnamese TTS in `extension/content.js`.
1. Shadow DOM Injection:
   - Inject host container into `document.documentElement` with Shadow DOM (`mode: "open"`), preventing duplicate injection.
   - Complete CSS isolation from host web pages.
2. Cyber-Glass Visual Styling:
   - Full viewport overlay with `background: rgba(10, 10, 18, 0.88); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); z-index: 2147483647;`.
   - Cyber-Glass modal card with 1px neon pink/red border (`border: 1px solid rgba(255, 61, 110, 0.4)`), frosted background, glowing shadow, and tilted sticker badge "PHÁT HIỆN VI PHẠM KỶ LUẬT".
3. Screen Shake CSS Animation:
   - `@keyframes screen-shake` causing multi-directional jitter (0.65s) on activation.
4. Supervisor Character & Vietnamese TTS:
   - Mascot cutout image using `chrome.runtime.getURL('assets/fat-orange-cat.png')`.
   - Vietnamese TTS scolding phrases (e.g. "Lại lướt web giải trí đấy à? Đang trong giờ Pomodoro mà dám mở web này! Tắt ngay!", "Trừ ngay 50 XP!").
   - Voice audio playback: Attempts `/api/tts` audio or Web Speech API (`SpeechSynthesisUtterance`, lang `vi-VN`).
   - High-contrast visual speech bubble with text so warning is visible even if browser blocks autoplay.
5. 5-Second Countdown & Tab Closure:
   - Live 5-second countdown progress bar.
   - When reaching 0: dispatches `chrome.runtime.sendMessage({ action: 'CLOSE_TAB_AND_FOCUS_CAMPUS' })` to close tab and focus CampusOS.
6. Exemption ("Tôi đang tra tài liệu") Button:
   - Sends `chrome.runtime.sendMessage({ action: 'REQUEST_EXEMPTION', durationSeconds: 180 })`.
   - If granted: removes lockout HUD and allows browsing.
   - If denied (cooldown active): displays remaining wait seconds and scolding warning.
7. Background Message Listener & Web Relay:
   - Listens for `SHOW_LOCKOUT_HUD` message from `background.js` and activates immediately (< 200ms).
   - On `localhost:3000` / `campusos.vn`: acts as window postMessage relay for Web App (`window.addEventListener('message')`).

Verification:
Run in `web/`:
`npm test`
`npm run typecheck`
All tests must pass cleanly.

Document changes and results in `handoff.md` in your working directory. Send completion message when done.
