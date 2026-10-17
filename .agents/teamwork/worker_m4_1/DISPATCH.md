## 2026-10-17T01:59:04Z
You are worker_m4_1.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m4_1

MANDATORY FIRST STEP:
Read the authoritative user request at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically header ## 2026-10-17T00:51:59Z).
Also read:
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_survey_3\handoff.md (§ 2.5 & § 2.6)
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_2\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusive Write Ownership:
You exclusively own and may create/modify:
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\supabase\migrations\004_extension_focus_violations.sql
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\src\types\database.ts
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\src\lib\campus-store.ts
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\src\lib\supabase-sync.ts
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\src\features\pomodoro\use-extension-bridge.ts
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\src\app\api\focus\violation\route.ts
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\extension\popup\popup.html
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\extension\popup\popup.js
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\extension\popup\popup.css
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\tests\extension-sync-penalty.test.ts
Do NOT touch or modify any other files.

Mission:
Implement Milestone 4: Web App Bridge, Supabase -50 XP Penalty & Realtime Popup.

1. `supabase/migrations/004_extension_focus_violations.sql`:
   - Valid PostgreSQL DDL adding `violation_count` to `profiles`, `student_profiles`, and `student_focus_sessions`:
     ```sql
     ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS violation_count INTEGER NOT NULL DEFAULT 0;
     ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS violation_count INTEGER NOT NULL DEFAULT 0;
     ALTER TABLE public.student_focus_sessions ADD COLUMN IF NOT EXISTS violation_count INTEGER NOT NULL DEFAULT 0;
     ```
2. `web/src/types/database.ts`:
   - Update TypeScript interfaces for `profiles`, `student_profiles`, and `student_focus_sessions` to include `violation_count?: number`.
3. `web/src/lib/campus-store.ts`:
   - Export `penalizeViolation(amount = 50, reason?: string)`:
     - Deduct XP: `nextXp = Math.max(0, prev.xp - amount)`.
     - Recalculate level and rank: `const { level, rankTitle } = calculateLevelAndRank(nextXp);`.
     - Increment `violationCount` / `totalShameCount`.
     - Call `setSharedState` and dispatch `campusos-store-update` event.
     - Call `pushToSupabaseCloudDebounced()` to update `profiles` and `recordFocusViolationToSupabase(...)` to update session.
     - Return `{ xpDeducted: prev.xp - nextXp, nextXp, level, rankTitle }`.
4. `web/src/lib/supabase-sync.ts`:
   - Export `recordFocusViolationToSupabase(payload: { penaltyXp: number; domain?: string; reason?: string })`:
     - Updates `profiles` / `student_profiles` and logs violation in `student_focus_sessions`.
     - Supports offline mutation queue fallback.
5. `web/src/features/pomodoro/use-extension-bridge.ts`:
   - Hook facilitating bidirectional communication:
     - Sends `START_FOCUS`, `PAUSE_FOCUS`, `STOP_FOCUS`, `REQUEST_EXEMPTION` to extension.
     - Listens for `EXTENSION_VIOLATION` messages and calls `penalizeViolation(50, domain)`.
     - Emits toasts and alerts.
6. `web/src/app/api/focus/violation/route.ts`:
   - API route handling `POST /api/focus/violation`: validates payload `{ domain, reason, penaltyXp }`, updates Supabase or returns mock confirmation in dev.
7. `extension/popup/`:
   - `popup.html`: 360x480 Cyber-Glass card with Pomodoro status and real-time `MM:SS` timer, customizable blacklist manager (add, remove, restore 14 defaults), and AI Webcam toggle.
   - `popup.js`: Communicates with `background.js` via `chrome.runtime.sendMessage`, syncs real-time timer, updates blacklist storage, and toggles camera.
   - `popup.css`: Cyber-Glass styles matching CampusOS (#0A0A12, neon lime #C6FF3D, neon rose #FF3D6E).
8. `web/tests/extension-sync-penalty.test.ts`:
   - Unit tests covering `penalizeViolation` deduction, 0 XP floor clamp, level demotion, Supabase violation recording, migration syntax validation, and popup message contracts.
9. Verification:
   Run in `web/`:
   `node --experimental-strip-types --test tests/extension-sync-penalty.test.ts`
   `npm test`
   `npm run typecheck`
   `npm run build`
   Ensure 100% tests pass with 0 errors.
10. Document all changes and test outputs in `handoff.md` in your working directory. Send completion message when done.
