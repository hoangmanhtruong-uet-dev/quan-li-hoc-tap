## 2026-10-17T01:01:39Z
You are worker_m1_1.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1_1

MANDATORY FIRST STEP:
Read the authoritative user request at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically header ## 2026-10-17T00:51:59Z).
Also read:
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_survey_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusive Write Ownership:
You exclusively own and may create/modify:
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\extension\manifest.json
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\extension\background.js
Do NOT touch or modify any other files.

Mission:
Implement Milestone 1: Manifest V3 Configuration & Background Service Worker architecture.
1. `extension/manifest.json`:
   - Valid Manifest V3 standard.
   - Name: "AI Giám Sát Học Tập Cực Đoan (CampusOS)"
   - Permissions: `["tabs", "storage", "activeTab", "scripting", "declarativeNetRequest"]`
   - `host_permissions: ["<all_urls>"]`
   - `externally_connectable: { "matches": ["http://localhost:3000/*", "http://127.0.0.1:3000/*", "https://*.campusos.vn/*", "https://campusos.vn/*"] }`
   - Background service worker: `{"service_worker": "background.js", "type": "module"}`
   - Action popup: `{"default_popup": "popup/popup.html"}`
   - Content scripts: `[{"matches": ["<all_urls>"], "js": ["content.js"], "run_at": "document_end"}]`
   - Web accessible resources for `assets/*`.
2. `extension/background.js`:
   - Session state FSM: `'idle' | 'focusing' | 'break'`.
   - 14 default blacklist domains: `facebook.com`, `youtube.com`, `tiktok.com`, `twitter.com`, `x.com`, `instagram.com`, `netflix.com`, `bilibili.com`, `shopee.vn`, `reddit.com`, `threads.net`, `twitch.tv`, `discord.com`, `lazada.vn`.
   - Storage sync with `chrome.storage.sync` / `chrome.storage.local` (`campusos_blacklist_domains`, `campusos_session_state`).
   - Clean, robust URL blacklist matcher `isUrlBlacklisted(url, blacklist)` supporting exact domain and subdomains (e.g. `m.facebook.com`), while exempting localhost/127.0.0.1/campusos.vn and system URLs.
   - `chrome.tabs.onActivated` and `chrome.tabs.onUpdated` listeners detecting visits to blacklisted URLs when `sessionState === 'focusing'` and not exempt.
   - Tab closure and focus switching: `CLOSE_TAB_AND_FOCUS_CAMPUS` handler that searches for or opens CampusOS tab, then closes the distracting tab via `chrome.tabs.remove`.
   - Exemption management: Cooldown enforcement (1 use per 3 minutes: 180 seconds).
   - Message routers for `chrome.runtime.onMessageExternal` (Web App communication: `PING`, `START_FOCUS`, `PAUSE_FOCUS`, `STOP_FOCUS`, `REQUEST_EXEMPTION`, `SYNC_STATE`) and `chrome.runtime.onMessage` (internal communication with content script and popup).
3. Verification:
   - Validate JSON syntax of `manifest.json`.
   - Ensure `background.js` has no syntax errors and exports/functions work cleanly.
4. Document all changes, verification commands, and results in `handoff.md` in your working directory. Update `progress.md`. Send completion message to parent orchestrator.
