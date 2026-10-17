## 2026-10-17T00:54:03Z
From: 051c51ec-d4c0-431c-b685-75179c16a0da
Content:
You are explorer_2.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_2
Read the authoritative user request at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (especially header ## 2026-10-17T00:51:59Z).

Mission:
Survey the Supabase database migrations, sync engine, and test infrastructure.

Specifically investigate:
1. `web/supabase/migrations/`:
   - Inspect table schemas for `profiles` and `student_focus_sessions`.
   - Check columns related to XP, violations (`violation_count`), focus sessions, and penalties.
   - Check Row Level Security (RLS) policies and functions.
2. `web/src/lib/supabase-client.ts`, `web/src/lib/supabase-sync.ts`, and any relevant API routes in `web/src/app/api/`.
   - How XP is deducted and synced to Supabase (e.g., -50 XP penalty on violation).
3. Test infrastructure:
   - Check `web/package.json` scripts (`npm test`, `npm run typecheck`, `npm run build`).
   - Inspect `web/tests/` to see how tests are executed (Node test runner, strip-types, vitest, etc.) and what is currently covered (380+ tests).
   - What new unit tests are needed for the Chrome extension bridge, XP penalty, blacklist matching, and session sync.

Do not write or modify source code files.
Write your comprehensive report and findings to `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_2\handoff.md`.
Update `progress.md` in your working directory.
When finished, send a message to the caller (parent) reporting completion and the path to your handoff.md.
