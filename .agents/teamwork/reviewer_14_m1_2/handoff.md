# Adversarial Review & Quality Audit Report: Milestone 1

**Reviewer ID:** reviewer_14_m1_2 (Adversarial Critic & Quality Reviewer)  
**Parent Orchestrator:** orchestrator_14 (`530cc211-532a-4177-8502-4fb34c026648`)  
**Target Work Products:**  
- `supabase/migrations/003_complete_campusos_schema.sql`  
- `web/src/types/database.ts`  
- `worker_14_m1/handoff.md`  
**Timestamp:** 2026-10-16T20:50:00Z  
**Verdict:** `REQUEST_CHANGES`

---

## 1. Observation

### 1.1 Direct File Observations

1. **Privilege Escalation on Membership Tables**:
   In `supabase/migrations/003_complete_campusos_schema.sql`, lines 633-636:
   ```sql
   DROP POLICY IF EXISTS "Workspace members manage" ON public.workspace_members;
   CREATE POLICY "Workspace members manage" ON public.workspace_members FOR ALL
     USING (public.is_workspace_admin(workspace_id) OR user_id = (SELECT auth.uid()))
     WITH CHECK (public.is_workspace_admin(workspace_id) OR user_id = (SELECT auth.uid()));
   ```
   Lines 690-693:
   ```sql
   DROP POLICY IF EXISTS "Club members manage" ON public.club_members;
   CREATE POLICY "Club members manage" ON public.club_members FOR ALL
     USING (public.is_club_admin(club_id) OR user_id = (SELECT auth.uid()))
     WITH CHECK (public.is_club_admin(club_id) OR user_id = (SELECT auth.uid()));
   ```
   Lines 748-751:
   ```sql
   DROP POLICY IF EXISTS "Dorm members manage" ON public.dorm_members;
   CREATE POLICY "Dorm members manage" ON public.dorm_members FOR ALL
     USING (public.is_dorm_member(space_id) OR user_id = (SELECT auth.uid()))
     WITH CHECK (public.is_dorm_member(space_id) OR user_id = (SELECT auth.uid()));
   ```

2. **Read-Only VIEWER Mutation Loopholes on Workspace Documents & Tasks**:
   In `supabase/migrations/003_complete_campusos_schema.sql`, lines 643-646:
   ```sql
   DROP POLICY IF EXISTS "Workspace tasks manage" ON public.workspace_kanban_tasks;
   CREATE POLICY "Workspace tasks manage" ON public.workspace_kanban_tasks FOR ALL
     USING (public.is_workspace_member(workspace_id))
     WITH CHECK (public.is_workspace_member(workspace_id));
   ```
   Lines 653-656:
   ```sql
   DROP POLICY IF EXISTS "Workspace docs manage" ON public.workspace_documents;
   CREATE POLICY "Workspace docs manage" ON public.workspace_documents FOR ALL
     USING (public.is_workspace_member(workspace_id))
     WITH CHECK (public.is_workspace_member(workspace_id));
   ```
   Helper function definition at lines 17-27:
   ```sql
   CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id UUID)
   RETURNS BOOLEAN
   LANGUAGE sql
   SECURITY DEFINER
   SET search_path = ''
   AS $$
     SELECT EXISTS (
       SELECT 1 FROM public.workspace_members
       WHERE workspace_id = p_workspace_id AND user_id = (SELECT auth.uid())
     );
   $$;
   ```
   Note that `is_workspace_member` returns `true` for all membership roles, including `role = 'VIEWER'`.

3. **Insecure Cross-User Storage Access on `task-attachments`**:
   In `supabase/migrations/003_complete_campusos_schema.sql`, lines 802-808:
   ```sql
   DROP POLICY IF EXISTS "Private read task-attachments" ON storage.objects;
   CREATE POLICY "Private read task-attachments" ON storage.objects FOR SELECT
     USING (bucket_id = 'task-attachments' AND (SELECT auth.uid()) IS NOT NULL);

   DROP POLICY IF EXISTS "Authenticated upload task-attachments" ON storage.objects;
   CREATE POLICY "Authenticated upload task-attachments" ON storage.objects FOR INSERT
     WITH CHECK (bucket_id = 'task-attachments' AND (SELECT auth.uid()) IS NOT NULL);
   ```

4. **Public Exposure of Student PII in Profiles Table**:
   In `supabase/migrations/003_complete_campusos_schema.sql`, lines 567-569:
   ```sql
   DROP POLICY IF EXISTS "Public profile view" ON public.profiles;
   CREATE POLICY "Public profile view" ON public.profiles FOR SELECT
     USING (true);
   ```
   The `profiles` table (lines 101-133) contains sensitive student PII: `email`, `student_id`, `gpa`, `daily_mood`, `last_study_date`, and `status`.

5. **Missing Foreign Key Indexes**:
   In `supabase/migrations/003_complete_campusos_schema.sql`:
   - `workspace_kanban_tasks.created_by REFERENCES auth.users(id) ON DELETE SET NULL` (line 292): No index exists on `created_by`.
   - `workspace_documents.uploader_id REFERENCES auth.users(id) ON DELETE SET NULL` (line 308): No index exists on `uploader_id`.
   - `workspace_activities.actor_id REFERENCES auth.users(id) ON DELETE SET NULL` (line 317): No index exists on `actor_id`.
   - `club_finances.recorded_by REFERENCES auth.users(id)` (line 385): No index exists on `recorded_by`.

6. **Independent Quality Gate Verification**:
   - `npm run typecheck` in `web/`:
     ```
     > campusos-web@0.1.0 typecheck
     > tsc --noEmit
     Exited with code 0.
     ```
   - `npm test` in `web/`:
     ```
     ℹ tests 339
     ℹ suites 1
     ℹ pass 339
     ℹ fail 0
     ℹ cancelled 0
     ℹ skipped 0
     ℹ todo 0
     ℹ duration_ms 2956.7655
     Exited with code 0.
     ```
   - Integrity check: No hardcoded test stubs, no fake facades, and no evidence of cheating. Worker wrote real DDL and TypeScript definitions.

---

## 2. Logic Chain

1. **Privilege Escalation Logic Chain**:
   - In PostgreSQL RLS, a policy defined `FOR ALL` applies to `INSERT`, `UPDATE`, and `DELETE`.
   - The policy `Workspace members manage` defines `WITH CHECK (public.is_workspace_admin(workspace_id) OR user_id = (SELECT auth.uid()))`.
   - When an arbitrary authenticated user `U_attacker` sends `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ('<victim_workspace>', 'U_attacker', 'OWNER')`, Postgres evaluates `WITH CHECK`.
   - Because `user_id` matches `(SELECT auth.uid())`, the clause evaluates to `TRUE`.
   - The row is inserted with `role = 'OWNER'`.
   - Now `is_workspace_admin` returns `TRUE` for `U_attacker` on `<victim_workspace>`.
   - `U_attacker` gains full read, update, and delete access over all workspace documents, kanban tasks, and member lists.
   - Furthermore, existing members with `role = 'VIEWER'` can execute `UPDATE workspace_members SET role = 'OWNER' WHERE user_id = (SELECT auth.uid())`, which also evaluates to `TRUE` under both `USING` and `WITH CHECK`.
   - Identical logic applies to `club_members` and `dorm_members`.

2. **VIEWER Mutation Logic Chain**:
   - `tests/workspace-permissions.test.ts` specifies `✔ VIEWER is read-only`.
   - `is_workspace_member(p_workspace_id)` checks `WHERE workspace_id = p_workspace_id AND user_id = (SELECT auth.uid())` without filtering out the `VIEWER` role.
   - Policies `Workspace docs manage` and `Workspace tasks manage` grant `FOR ALL` (including `INSERT`, `UPDATE`, `DELETE`) to any user for whom `is_workspace_member(workspace_id)` is true.
   - Therefore, a `VIEWER` can delete or overwrite documents and Kanban tasks created by owners and managers.

3. **Storage Isolation Logic Chain**:
   - `task-attachments` is designed for personal task and assignment files.
   - The RLS policy for `task-attachments` checks only `(SELECT auth.uid()) IS NOT NULL`.
   - Any authenticated student `Student_B` can issue a GET request for an attachment uploaded by `Student_A` because `(SELECT auth.uid()) IS NOT NULL` is true for all logged-in users.
   - There is no tenant or user folder boundary (e.g. checking `(storage.foldername(name))[1] = (SELECT auth.uid())::text`).

4. **Foreign Key Indexing Logic Chain**:
   - Supabase Postgres Best Practice (`schema-foreign-key-indexes.md`) requires indexing all foreign key columns.
   - When a user in `auth.users` is deleted or anonymized, columns configured with `ON DELETE SET NULL` (`workspace_kanban_tasks.created_by`, `workspace_documents.uploader_id`, `workspace_activities.actor_id`) require Postgres to scan the child tables to find matching records.
   - Without indexes on these four columns, Postgres executes table-locking sequential full table scans, degrading database performance and causing lock contention.

---

## 3. Caveats

- **Existing Mock Stores**: Current unit tests (`tests/workspace-permissions.test.ts`, `tests/tasks-redesign.test.ts`) test in-memory TypeScript store implementations, which is why unit tests pass (339/339) despite the SQL RLS loopholes.
- **Supabase Storage Engine M2 Dependency**: Milestone 2 will connect `src/lib/storage-engine.ts` to Supabase Storage; fixing the RLS policies in `003_complete_campusos_schema.sql` now will prevent downstream regressions and security leaks in Milestone 2.

---

## 4. Conclusion

**Verdict: `REQUEST_CHANGES`**

While the schema is comprehensive (19 tables, 1412 lines of TypeScript definitions) and unit tests pass, the SQL migration contains critical security vulnerabilities and performance oversights that must be addressed before proceeding to downstream milestones:

### Summary of Required Changes:

1. **[Critical] Fix Membership Tables RLS Policies (`workspace_members`, `club_members`, `dorm_members`)**:
   Split `FOR ALL` into distinct operations:
   - `INSERT`: Only allowed if caller is admin (`public.is_workspace_admin(workspace_id)`) OR if the caller is the workspace owner inserting their initial OWNER record (`EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = (SELECT auth.uid()))`).
   - `UPDATE`: Only allowed if caller is admin (`public.is_workspace_admin(workspace_id)`), preventing self-promotion.
   - `DELETE`: Allowed if caller is admin OR `user_id = (SELECT auth.uid())` (allowing a member to leave).
   Apply identical pattern to `club_members` and `dorm_members`.

2. **[Major] Restrict Mutation of Documents & Kanban Tasks for VIEWER Role**:
   Create a helper function `is_workspace_editor(p_workspace_id UUID)` checking `role IN ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')`, or enforce this in `WITH CHECK` on `workspace_documents` and `workspace_kanban_tasks` so `VIEWER` remains strictly read-only.

3. **[Major] Enforce User Isolation on `task-attachments` Storage Bucket**:
   Update `storage.objects` policy to ensure users can only read and upload files in their own folder:
   `USING (bucket_id = 'task-attachments' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text)`
   Add `DELETE` and `UPDATE` policies for bucket owners.

4. **[Major] Protect Student PII on `profiles`**:
   Change `profiles` SELECT policy from unrestricted `USING (true)` to require authentication: `USING ((SELECT auth.uid()) IS NOT NULL)`. Expose public leaderboard/avatar fields via a view or separate public profile projection.

5. **[Minor] Add Missing Foreign Key Indexes**:
   Add indexes for:
   - `idx_workspace_kanban_created_by ON public.workspace_kanban_tasks(created_by)`
   - `idx_workspace_docs_uploader_id ON public.workspace_documents(uploader_id)`
   - `idx_workspace_activities_actor ON public.workspace_activities(actor_id)`
   - `idx_club_finances_recorded_by ON public.club_finances(recorded_by)`

---

## 5. Verification Method

To verify the findings and any future fixes:

1. **Verify Self-Insertion & Self-Promotion Attack Vector**:
   Inspect lines 633-636 of `supabase/migrations/003_complete_campusos_schema.sql`.
   Confirm whether `user_id = (SELECT auth.uid())` is present in `WITH CHECK` for `INSERT` or `UPDATE` on `workspace_members`.
2. **Verify VIEWER Mutation Vulnerability**:
   Inspect lines 643-656 of `supabase/migrations/003_complete_campusos_schema.sql`.
   Confirm whether `Workspace docs manage` or `Workspace tasks manage` permit `VIEWER` users to execute `INSERT`/`UPDATE`/`DELETE`.
3. **Verify Foreign Key Indexes**:
   Inspect index definitions in Section 4 of `supabase/migrations/003_complete_campusos_schema.sql` to verify presence of indexes on `workspace_kanban_tasks(created_by)`, `workspace_documents(uploader_id)`, `workspace_activities(actor_id)`, and `club_finances(recorded_by)`.
4. **Run TypeScript Check & Test Suite**:
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run typecheck
   npm test
   ```
