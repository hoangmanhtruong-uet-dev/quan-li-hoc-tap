## 2026-10-16T20:51:47Z
You are worker_14_m1_fix (Database Schema Remediation Worker).
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_14_m1_fix
Project root: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap
Web app directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
Authoritative request log: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md
Project plan: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
Primary Reviewer Feedback: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\reviewer_14_m1_1\handoff.md
Adversarial Reviewer Feedback: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\reviewer_14_m1_2\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your write ownership:
You exclusively own:
- `supabase/migrations/003_complete_campusos_schema.sql`
- `web/src/types/database.ts`

Your mission:
Apply the exact security and policy fixes identified by the reviewers to `supabase/migrations/003_complete_campusos_schema.sql`:
1. Disaggregate membership policies on `public.workspace_members`, `public.club_members`, and `public.dorm_members`:
   - Replace the permissive `FOR ALL` policy with discrete `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies.
   - Ensure `INSERT` and `UPDATE` require space admin or owner permission (preventing any unauthorized self-insertion or self-promotion to OWNER / president).
   - Allow members to `DELETE` their own record (leaving the space/group).
2. Add missing `UPDATE` and `DELETE` policies on `storage.objects` for all 3 buckets (`academic-materials`, `task-attachments`, `student-avatars`).
3. Add the 4 missing foreign key performance indexes:
   - `idx_workspace_kanban_created_by` on `workspace_kanban_tasks(created_by)`
   - `idx_workspace_docs_uploader` on `workspace_documents(uploader_id)`
   - `idx_workspace_activities_actor` on `workspace_activities(actor_id)`
   - `idx_club_finances_recorded_by` on `club_finances(recorded_by)`
4. Keep `web/src/types/database.ts` synchronized if any column or type changes.
5. Run `npm run typecheck` in `web/` (must pass with 0 errors).
6. Run `npm test` in `web/` (must pass 100% of tests, now 354+ tests).
7. Deliver `handoff.md` with verification results.
