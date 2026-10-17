## 2026-10-17T04:44:36Z
You are worker_m1.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1
Project Root: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap
Authoritative user request file: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically 2026-10-17T04:34:11Z). Read this file first!
Project Plan: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
Domain Skill: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agent\skills\supabase-postgres-best-practices\SKILL.md
Survey Specification: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_db\handoff.md

Write Ownership:
- supabase/migrations/006_pomodoro_party.sql
- web/src/types/database.ts
- web/src/lib/study-rooms-service.ts

Tasks:
1. Implement `supabase/migrations/006_pomodoro_party.sql` following Postgres & Supabase best practices.
2. Update `web/src/types/database.ts` with complete types for `study_rooms`, `study_room_members`, and `room_reactions`.
3. Implement `web/src/lib/study-rooms-service.ts` with real Supabase queries and offline/mock fallback for unconfigured environments.
4. Run `npm run typecheck` and `npm test` in `web/` to confirm 0 type errors and 100% test pass.
5. Document all commands, file diffs, and verification in `handoff.md` and notify with `send_message`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
