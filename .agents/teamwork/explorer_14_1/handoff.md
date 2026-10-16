# Handoff Report — explorer_14_1 (Schema & MySQL Explorer)

**Recipient:** orchestrator_14  
**Date:** 2026-10-16T20:38:00Z  
**Type:** Hard Handoff  
**Working Directory:** `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_14_1`  

---

## 1. Observation

1. **Existing Migrations:**
   - `supabase/migrations/001_pomodoro_schema.sql` (lines 1–143): Contains 8 tables (`characters`, `voice_packs`, `voice_lines`, `entitlements`, `orders`, `study_sessions`, `distraction_events`, `daily_stats`) with UUID PKs, `auth.users(id)` FKs, and user-isolated RLS.
   - `supabase/migrations/002_dashboard_calendar_sync.sql` (lines 1–90): Defines `student_profiles`, `student_deadlines`, `student_calendar_events`, and `student_focus_sessions` with `user_id TEXT DEFAULT 'default_student'` and open RLS `USING (true)`.
   - No migration currently defines tables for `tasks`, `courses`, `course_syllabus`, `workspaces`, `workspace_members`, `workspace_kanban_tasks`, `workspace_documents`, `clubs`, `club_events`, `club_finances`, `dorm_spaces`, `dorm_chores`, `dorm_expenses`, or `student_notifications`.

2. **Legacy MySQL Footprint:**
   - Package dependency: `web/package.json` line 27: `"mysql2": "^3.22.6"`.
   - Core DB connector: `web/src/lib/db.ts` lines 9–20: initializes `mysql.createPool` requiring `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
   - Auth & API files:
     - `web/src/lib/auth.ts` lines 76–83: queries MySQL `users` table via `pool.execute`.
     - `web/src/lib/personal-workspace.ts` lines 24–47: executes raw MySQL `INSERT INTO team_workspaces`.
     - `web/src/lib/workspace-service.ts` lines 23–34: queries MySQL `team_workspaces` and `team_memberships`.
     - `web/src/app/api/health/route.ts` line 6: calls `pool.query('SELECT 1 AS ok')`.
     - `web/src/app/api/auth/login/route.ts` line 13: queries `users` via MySQL pool.
     - `web/src/app/api/auth/register/route.ts` line 31: inserts into `users` via MySQL pool.
     - `web/src/app/api/auth/verify-email/route.ts`, `web/src/app/api/auth/forgot-password/route.ts`, `web/src/app/api/auth/reset-password/route.ts`, `web/src/app/api/onboarding/route.ts`.
   - Legacy scripts in `web/scripts/`: `check-tables.mjs`, `migrate-phase-5b.mjs`, `migrate-auth.sql`, `migrate-roles.sql`, `migrate-add-status.sql`.

3. **Test Suite Independence:**
   - Command `npm test` in `web/` executed 339 tests across 1 suite, passing 339/339 with 0 failures (`ℹ tests 339, ℹ pass 339, ℹ fail 0`).
   - Ripgrep search for `mysql` across `web/tests/` yielded 0 matches. Existing tests test store reducers, algorithms (EVN electricity tiers, Eisenhower matrix, NLP Vietnamese parsers, Pomodoro arbiter, etc.) and do not touch MySQL.

4. **Production Build & Type Safety:**
   - Command `npm run typecheck` in `web/` exited with code 0 (0 TypeScript errors).
   - Command `npm run build` in `web/` compiled all 34 routes cleanly (`34/34 static & dynamic pages generated`).

5. **Storage Engine Configuration:**
   - `web/src/lib/storage-engine.ts` line 13: `export const STORAGE_BUCKET = 'academic-vault';`.
   - Requirement R2 mandates 3 buckets: `academic-materials`, `task-attachments`, and `student-avatars`.

---

## 2. Logic Chain

1. **Schema Completeness Requirement:**
   - Observation 1 demonstrates that all major academic and collaboration features (`tasks`, `courses`, `workspaces`, `clubs`, `dorm_spaces`, `notifications`) are currently stored only in client memory (`localStorage` stores: `campus-store.ts`, `workspace-engine.ts`, `club-engine.ts`, `living-engine.ts`, `notifications-engine.ts`).
   - To fulfill R1, a comprehensive migration `003_complete_campusos_schema.sql` must create all 19 relational tables with explicit types, foreign keys to `auth.users(id)`, and matching indexes.

2. **RLS Performance & Recursion Safety:**
   - Per `security-rls-performance.md` in `supabase-postgres-best-practices`, recursive joins in table RLS policies (e.g. querying `workspace_members` inside a `workspace_members` policy) trigger infinite recursion or catastrophic table scans.
   - Helper security definer functions (`is_workspace_member`, `is_workspace_admin`, `is_club_member`, `is_club_admin`, `is_dorm_member`) with `SET search_path = ''` and cached `(SELECT auth.uid())` provide fast (InitPlan cached) and recursion-free RBAC policy evaluation.

3. **MySQL Removal Feasibility:**
   - Observation 3 shows that 100% of unit tests pass without MySQL.
   - Observation 2 outlines exactly which 14 files interact with `mysql2`.
   - Observation 4 confirms clean TypeScript build and typecheck.
   - Therefore, replacing `mysql2` and MySQL routes with Supabase Postgres and Supabase Auth (R4) is clean and will not break test suites.

---

## 3. Caveats

1. **Storage Bucket Provisioning in Mock / Local Environments:**
   In offline or mock Supabase setups, `supabase.storage.from(...).upload` may throw. The existing fallback mechanism in `storage-engine.ts` (`fileToDataUrl`) must remain active to prevent runtime crashes during offline demos or tests.
2. **Realtime WebSockets Subscriptions:**
   When connecting to Supabase Realtime channels in SSR/Node environments, checks for `typeof window !== 'undefined'` must guard channel listeners to prevent hydration mismatches or node-fetch socket drops.
3. **Database Types Regeneration:**
   A TypeScript definition file `web/src/types/database.ts` should be added to guarantee strict compile-time types for Supabase queries across workers.

---

## 4. Conclusion

- The database architecture for CampusOS is fully mapped and ready for execution.
- Detailed migration blueprint `003_complete_campusos_schema.sql` has been drafted with 19 tables, 25+ foreign key & filter indexes, 5 security definer RBAC helper functions, 3 storage buckets, and complete Row Level Security policies.
- A concrete 14-file inventory of legacy MySQL dependencies has been established with replacement instructions for R4.
- All technical specifications and code artifacts are documented in `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_14_1\analysis.md`.

---

## 5. Verification Method

To verify the findings independently:

1. **Verify Migrations Audit:**
   ```powershell
   Get-ChildItem -Path "d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\supabase\migrations"
   ```
2. **Verify MySQL References:**
   ```powershell
   git grep -n "mysql" "d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web"
   ```
3. **Verify Tests & Typecheck:**
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm test
   npm run typecheck
   ```
4. **Inspect Analysis Report:**
   Read `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_14_1\analysis.md`.
