## 2026-10-17T01:15:37Z
You are worker_m1_2.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1_2

MANDATORY FIRST STEP:
Read the authoritative user request at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically header ## 2026-10-17T00:51:59Z).
Also read:
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\reviewer_m1_2\handoff.md (CRITICAL: review findings from Reviewer 2)
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\reviewer_m1_1\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusive Write Ownership:
You exclusively own and may modify:
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\extension\background.js
Do NOT touch or modify any other files.

Mission:
Remediate the two issues identified by Reviewer 2 in `extension/background.js`:
1. Fix Service Worker Dormancy Rehydration:
   In Chrome Manifest V3, background service workers terminate after ~30s idle. When woken up by an incoming event (e.g. `tabs.onActivated`), in-memory state starts anew.
   Implement top-level automatic rehydration (`initializeExtension().catch(console.error);` and/or an `ensureInitialized()` promise check) before processing `tabs.onActivated`, `tabs.onUpdated`, and message routers, so that active sessions and blacklist domains saved in `chrome.storage.local` are restored before evaluating URLs.
2. Fix Multi-penalty on `tabs.onUpdated`:
   In `chrome.tabs.onUpdated(tabId, changeInfo, tab)`:
   - Check `if (!changeInfo.url) return;` so that title, status, and favicon changes do not trigger duplicate violation checks.
   - Maintain a per-tab violation timestamp map to debounce / prevent duplicate penalties on the same tab within 2 seconds.

Verification:
Run in `web/`:
`node --experimental-strip-types --test tests/extension-manifest.test.ts tests/extension-bridge.test.ts`
`npm test`
`npm run typecheck`
Ensure all tests pass 100% with 0 errors.

Document changes and test outputs in `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1_2\handoff.md`.
Send a completion message to the parent orchestrator when finished.
