## 2026-10-17T01:09:24Z
You are reviewer_m1_1.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\reviewer_m1_1

MANDATORY FIRST STEP:
Read the authoritative user request at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically header ## 2026-10-17T00:51:59Z).
Also read:
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\TEST_READY.md
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1_1\handoff.md

Mission:
Objectively review and verify Milestone 1: Manifest V3 Configuration & Background Service Worker.
1. Inspect `extension/manifest.json`:
   - Valid Manifest V3 standard.
   - Permissions: `tabs`, `storage`, `activeTab`, `scripting`, `declarativeNetRequest`.
   - `externally_connectable` rules for `localhost:3000` & `campusos.vn`.
   - Service worker declared as ES module (`background.js`).
2. Inspect `extension/background.js`:
   - FSM session state (`idle`, `focusing`, `break`).
   - 14 default blacklist domains and storage sync.
   - URL matching algorithm, subdomains, internal CampusOS and localhost exemptions.
   - `chrome.tabs.onActivated` and `chrome.tabs.onUpdated` tab listeners.
   - `CLOSE_TAB_AND_FOCUS_CAMPUS` handler.
   - Exemption 180s cooldown enforcement.
   - Two-way message routing between Web App and extension.
3. Verification:
   Run verification commands in `web/`:
   `node --experimental-strip-types --test tests/extension-manifest.test.ts tests/extension-bridge.test.ts`
   `npm test`
   `npm run typecheck`
4. Formulate an objective review report in `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\reviewer_m1_1\handoff.md`.
   State your explicit verdict: `APPROVE` or `REQUEST_CHANGES`.
5. Send completion message to parent orchestrator.
