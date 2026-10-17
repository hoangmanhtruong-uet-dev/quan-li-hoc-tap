## 2026-10-17T00:54:03Z
You are spec_miner_3.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_survey_3
Read the authoritative user request at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (especially header ## 2026-10-17T00:51:59Z).

Mission:
Inspect the project root for existing extension files and produce a rigorous specification for the Chrome Extension Manifest V3 "AI Giám Sát Học Tập Cực Đoan".

Specifically investigate:
1. Check if `extension/` directory exists or if any files currently exist in `extension/`.
2. Detail the exact specification for Manifest V3:
   - `manifest.json`: permissions (`tabs`, `storage`, `activeTab`, `scripting`, `declarativeNetRequest`), `externally_connectable` (`http://localhost:3000/*`, production domains), background service worker, content scripts, popup action.
3. Detail the specification for `background.js`:
   - Session states (`idle`, `focusing`, `break`).
   - Default blacklist domains (facebook.com, youtube.com, tiktok.com, twitter.com, x.com, instagram.com, netflix.com, bilibili.com, shopee.vn, reddit.com, etc.) with customizable storage sync.
   - Tab listener events (`chrome.tabs.onActivated`, `chrome.tabs.onUpdated`).
   - Message routing between Web App, popup, and content script.
4. Detail the specification for `content.js`:
   - Cyber-Glass Lockout HUD modal DOM injection, 25px blur backdrop, screen shake CSS animation, supervisor visual character, Vietnamese TTS scolding phrases, 5-second countdown with auto tab close & focus switch to CampusOS, ân hạn button (max 1 time per 3 minutes).
5. Detail the specification for AI Webcam Face Tracking:
   - MediaPipe Face Mesh / Web Worker, Eye Aspect Ratio (EAR), Head Pose (pitch/yaw), >10s looking away or sleeping detection, warning trigger, toggle in settings/popup.
6. Detail the specification for Extension Popup (`popup/`):
   - Real-time countdown synced with web app Pomodoro, blacklist domain management (add/remove), webcam tracking toggle.

Do not write or modify source code files.
Write your comprehensive report and findings to `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_survey_3\handoff.md`.
Update `progress.md` in your working directory.
When finished, send a message to the caller (parent) reporting completion and the path to your handoff.md.
