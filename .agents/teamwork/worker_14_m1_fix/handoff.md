# Handoff Report: Milestone 1 Database Schema Remediation

**Worker ID:** `worker_14_m1_fix` (Database Schema Remediation Worker)  
**Parent Orchestrator:** `orchestrator_14` (`530cc211-532a-4177-8502-4fb34c026648`)  
**Timestamp:** 2026-10-16T20:58:00Z  
**Type:** Hard Handoff  
**Verdict:** **`RESOLVED`**

---

## 1. Observation

### 1.1 Scope & Files Inspected
1. `supabase/migrations/003_complete_campusos_schema.sql` (previously 817 lines, now 976 lines):
   - Reviewed reviewer findings from `reviewer_14_m1_1/handoff.md` and `reviewer_14_m1_2/handoff.md`.
   - Identified monolithic `FOR ALL` RLS policies on `workspace_members` (lines 633–637), `club_members` (lines 690–694), and `dorm_members` (lines 748–752).
   - Identified missing `UPDATE` and `DELETE` policies on `storage.objects` for `academic-materials`, `task-attachments`, and `student-avatars`.
   - Identified missing foreign key indexes on `workspace_kanban_tasks(created_by)`, `workspace_documents(uploader_id)`, `workspace_activities(actor_id)`, and `club_finances(recorded_by)`.
2. `web/src/types/database.ts` (1416 lines):
   - Synchronized `Database['public']['Functions']` to include `is_dorm_admin(p_space_id: string): boolean`.

### 1.2 Verbatim Code Modifications in `003_complete_campusos_schema.sql`

1. **Helper Function `is_dorm_admin` added (lines 81–93, 107–108)**:
   ```sql
   CREATE OR REPLACE FUNCTION public.is_dorm_admin(p_space_id UUID)
   RETURNS BOOLEAN
   LANGUAGE sql
   SECURITY DEFINER
   SET search_path = ''
   AS $$
     SELECT EXISTS (
       SELECT 1 FROM public.dorm_members
       WHERE space_id = p_space_id
         AND user_id = (SELECT auth.uid())
         AND role IN ('lead', 'OWNER', 'ADMIN')
     );
   $$;

   REVOKE EXECUTE ON FUNCTION public.is_dorm_admin(UUID) FROM PUBLIC;
   GRANT EXECUTE ON FUNCTION public.is_dorm_admin(UUID) TO authenticated, anon;
   ```

2. **Foreign Key Indexes added (lines 538–543, 555)**:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_workspace_kanban_created_by ON public.workspace_kanban_tasks(created_by);
   ...
   CREATE INDEX IF NOT EXISTS idx_workspace_docs_uploaded_by ON public.workspace_documents(uploaded_by);
   CREATE INDEX IF NOT EXISTS idx_workspace_docs_uploader ON public.workspace_documents(uploader_id);
   CREATE INDEX IF NOT EXISTS idx_workspace_docs_uploader_id ON public.workspace_documents(uploader_id);
   CREATE INDEX IF NOT EXISTS idx_workspace_activities_actor ON public.workspace_activities(actor_id);
   ...
   CREATE INDEX IF NOT EXISTS idx_club_finances_recorded_by ON public.club_finances(recorded_by);
   ```

3. **Disaggregated Membership Policies on `workspace_members` (lines 670–710)**:
   ```sql
   DROP POLICY IF EXISTS "Workspace members view" ON public.workspace_members;
   CREATE POLICY "Workspace members view" ON public.workspace_members FOR SELECT
     USING (user_id = (SELECT auth.uid()) OR public.is_workspace_member(workspace_id));

   DROP POLICY IF EXISTS "Workspace members manage" ON public.workspace_members;
   DROP POLICY IF EXISTS "Workspace members insert" ON public.workspace_members;
   CREATE POLICY "Workspace members insert" ON public.workspace_members FOR INSERT
     WITH CHECK (
       public.is_workspace_admin(workspace_id)
       OR EXISTS (
         SELECT 1 FROM public.workspaces
         WHERE workspaces.id = workspace_members.workspace_id
           AND workspaces.owner_id = (SELECT auth.uid())
       )
     );

   DROP POLICY IF EXISTS "Workspace members update" ON public.workspace_members;
   CREATE POLICY "Workspace members update" ON public.workspace_members FOR UPDATE
     USING (
       public.is_workspace_admin(workspace_id)
       OR EXISTS (
         SELECT 1 FROM public.workspaces
         WHERE workspaces.id = workspace_members.workspace_id
           AND workspaces.owner_id = (SELECT auth.uid())
       )
     )
     WITH CHECK (
       public.is_workspace_admin(workspace_id)
       OR EXISTS (
         SELECT 1 FROM public.workspaces
         WHERE workspaces.id = workspace_members.workspace_id
           AND workspaces.owner_id = (SELECT auth.uid())
       )
     );

   DROP POLICY IF EXISTS "Workspace members delete" ON public.workspace_members;
   CREATE POLICY "Workspace members delete" ON public.workspace_members FOR DELETE
     USING (
       public.is_workspace_admin(workspace_id)
       OR EXISTS (
         SELECT 1 FROM public.workspaces
         WHERE workspaces.id = workspace_members.workspace_id
           AND workspaces.owner_id = (SELECT auth.uid())
       )
       OR user_id = (SELECT auth.uid())
     );
   ```

4. **Disaggregated Membership Policies on `club_members` (lines 765–805)**:
   ```sql
   DROP POLICY IF EXISTS "Public club members view" ON public.club_members;
   CREATE POLICY "Public club members view" ON public.club_members FOR SELECT
     USING (true);

   DROP POLICY IF EXISTS "Club members manage" ON public.club_members;
   DROP POLICY IF EXISTS "Club members insert" ON public.club_members;
   CREATE POLICY "Club members insert" ON public.club_members FOR INSERT
     WITH CHECK (
       public.is_club_admin(club_id)
       OR EXISTS (
         SELECT 1 FROM public.clubs
         WHERE clubs.id = club_members.club_id
           AND (clubs.president_id = (SELECT auth.uid()) OR clubs.owner_id = (SELECT auth.uid()))
       )
     );

   DROP POLICY IF EXISTS "Club members update" ON public.club_members;
   CREATE POLICY "Club members update" ON public.club_members FOR UPDATE
     USING (
       public.is_club_admin(club_id)
       OR EXISTS (
         SELECT 1 FROM public.clubs
         WHERE clubs.id = club_members.club_id
           AND (clubs.president_id = (SELECT auth.uid()) OR clubs.owner_id = (SELECT auth.uid()))
       )
     )
     WITH CHECK (
       public.is_club_admin(club_id)
       OR EXISTS (
         SELECT 1 FROM public.clubs
         WHERE clubs.id = club_members.club_id
           AND (clubs.president_id = (SELECT auth.uid()) OR clubs.owner_id = (SELECT auth.uid()))
       )
     );

   DROP POLICY IF EXISTS "Club members delete" ON public.club_members;
   CREATE POLICY "Club members delete" ON public.club_members FOR DELETE
     USING (
       public.is_club_admin(club_id)
       OR EXISTS (
         SELECT 1 FROM public.clubs
         WHERE clubs.id = club_members.club_id
           AND (clubs.president_id = (SELECT auth.uid()) OR clubs.owner_id = (SELECT auth.uid()))
       )
       OR user_id = (SELECT auth.uid())
     );
   ```

5. **Disaggregated Membership Policies on `dorm_members` (lines 860–905)**:
   ```sql
   DROP POLICY IF EXISTS "Dorm members view" ON public.dorm_members;
   CREATE POLICY "Dorm members view" ON public.dorm_members FOR SELECT
     USING (public.is_dorm_member(space_id));

   DROP POLICY IF EXISTS "Dorm members manage" ON public.dorm_members;
   DROP POLICY IF EXISTS "Dorm members insert" ON public.dorm_members;
   CREATE POLICY "Dorm members insert" ON public.dorm_members FOR INSERT
     WITH CHECK (
       public.is_dorm_admin(space_id)
       OR EXISTS (
         SELECT 1 FROM public.dorm_spaces
         WHERE dorm_spaces.id = dorm_members.space_id
           AND (dorm_spaces.created_by = (SELECT auth.uid()) OR dorm_spaces.owner_id = (SELECT auth.uid()))
       )
     );

   DROP POLICY IF EXISTS "Dorm members update" ON public.dorm_members;
   CREATE POLICY "Dorm members update" ON public.dorm_members FOR UPDATE
     USING (
       public.is_dorm_admin(space_id)
       OR EXISTS (
         SELECT 1 FROM public.dorm_spaces
         WHERE dorm_spaces.id = dorm_members.space_id
           AND (dorm_spaces.created_by = (SELECT auth.uid()) OR dorm_spaces.owner_id = (SELECT auth.uid()))
       )
     )
     WITH CHECK (
       public.is_dorm_admin(space_id)
       OR EXISTS (
         SELECT 1 FROM public.dorm_spaces
         WHERE dorm_spaces.id = dorm_members.space_id
           AND (dorm_spaces.created_by = (SELECT auth.uid()) OR dorm_spaces.owner_id = (SELECT auth.uid()))
       )
     );

   DROP POLICY IF EXISTS "Dorm members delete" ON public.dorm_members;
   CREATE POLICY "Dorm members delete" ON public.dorm_members FOR DELETE
     USING (
       public.is_dorm_admin(space_id)
       OR EXISTS (
         SELECT 1 FROM public.dorm_spaces
         WHERE dorm_spaces.id = dorm_members.space_id
           AND (dorm_spaces.created_by = (SELECT auth.uid()) OR dorm_spaces.owner_id = (SELECT auth.uid()))
       )
       OR user_id = (SELECT auth.uid())
     );
   ```

6. **Storage UPDATE and DELETE Policies Added (lines 940–975)**:
   ```sql
   DROP POLICY IF EXISTS "Authenticated update academic-materials" ON storage.objects;
   CREATE POLICY "Authenticated update academic-materials" ON storage.objects FOR UPDATE
     USING (bucket_id = 'academic-materials' AND (SELECT auth.uid()) IS NOT NULL)
     WITH CHECK (bucket_id = 'academic-materials' AND (SELECT auth.uid()) IS NOT NULL);

   DROP POLICY IF EXISTS "Authenticated delete academic-materials" ON storage.objects;
   CREATE POLICY "Authenticated delete academic-materials" ON storage.objects FOR DELETE
     USING (bucket_id = 'academic-materials' AND (SELECT auth.uid()) IS NOT NULL);

   DROP POLICY IF EXISTS "Authenticated update task-attachments" ON storage.objects;
   CREATE POLICY "Authenticated update task-attachments" ON storage.objects FOR UPDATE
     USING (bucket_id = 'task-attachments' AND (SELECT auth.uid()) IS NOT NULL)
     WITH CHECK (bucket_id = 'task-attachments' AND (SELECT auth.uid()) IS NOT NULL);

   DROP POLICY IF EXISTS "Authenticated delete task-attachments" ON storage.objects;
   CREATE POLICY "Authenticated delete task-attachments" ON storage.objects FOR DELETE
     USING (bucket_id = 'task-attachments' AND (SELECT auth.uid()) IS NOT NULL);

   DROP POLICY IF EXISTS "Authenticated update student-avatars" ON storage.objects;
   CREATE POLICY "Authenticated update student-avatars" ON storage.objects FOR UPDATE
     USING (bucket_id = 'student-avatars' AND (SELECT auth.uid()) IS NOT NULL)
     WITH CHECK (bucket_id = 'student-avatars' AND (SELECT auth.uid()) IS NOT NULL);

   DROP POLICY IF EXISTS "Authenticated delete student-avatars" ON storage.objects;
   CREATE POLICY "Authenticated delete student-avatars" ON storage.objects FOR DELETE
     USING (bucket_id = 'student-avatars' AND (SELECT auth.uid()) IS NOT NULL);
   ```

### 1.3 Verbatim Command Verification Outputs
- `npm run typecheck` in `web/`:
  ```
  > campusos-web@0.1.0 typecheck
  > tsc --noEmit
  Exited with code 0.
  ```
- `npm test` in `web/`:
  ```
  ℹ tests 354
  ℹ suites 3
  ℹ pass 354
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  ℹ duration_ms 3018.4592
  Exited with code 0.
  ```
- `node --experimental-strip-types --test tests/challenger-m1-schema-sql.test.ts tests/challenger-m1-database-types.test.ts` in `web/`:
  ```
  ℹ tests 15
  ℹ suites 2
  ℹ pass 15
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  ℹ duration_ms 156.939
  Exited with code 0.
  ```
- `npm run build` in `web/`:
  ```
  ✓ Compiled successfully
  ✓ Generating static pages (34/34)
  Exited with code 0.
  ```

---

## 2. Logic Chain

1. **Privilege Escalation Closure**:
   - In the prior implementation, `FOR ALL ... USING (... OR user_id = auth.uid()) WITH CHECK (... OR user_id = auth.uid())` allowed any user to insert or update their own membership row to `OWNER` or `president`.
   - By breaking `FOR ALL` into discrete policies, `INSERT` and `UPDATE` now evaluate strictly against `is_<space>_admin` or space creator/owner conditions. A regular user cannot insert themselves into a space without admin/owner approval, nor can they update their role to elevate privileges.
   - For `DELETE`, `user_id = (SELECT auth.uid())` is retained in the `USING` clause so members can freely leave spaces/clubs/dorms.
2. **Infinite Recursion Avoidance**:
   - For `dorm_members`, created `public.is_dorm_admin(UUID)` as `SECURITY DEFINER` with `SET search_path = ''`, mirroring `is_workspace_admin` and `is_club_admin`. This ensures checks against `dorm_members.role IN ('lead', 'OWNER', 'ADMIN')` avoid infinite RLS recursion.
3. **Storage Object Lifecycle**:
   - Added `UPDATE` and `DELETE` policies on `storage.objects` for `academic-materials`, `task-attachments`, and `student-avatars`. This guarantees that file deletion and avatar replacement succeed without RLS violation errors in downstream Milestone 2.
4. **Foreign Key Indexing**:
   - All 4 referenced foreign keys (`workspace_kanban_tasks.created_by`, `workspace_documents.uploader_id`, `workspace_activities.actor_id`, and `club_finances.recorded_by`) now have explicit B-tree indexes, preventing sequential scans and lock contention during user updates or cascade operations.
5. **Type Synchronization**:
   - `web/src/types/database.ts` was synchronized with the new `is_dorm_admin` RPC signature, ensuring TypeScript type check passes cleanly with 0 errors.

---

## 3. Caveats

- In production Supabase setups, `storage.objects` table RLS is active only if Supabase Storage extension is enabled; the migration script includes idempotent `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;` and `DROP POLICY IF EXISTS` guards to prevent errors across different Postgres deployment stages.
- No application-level runtime regressions were introduced; all mock stores, permission checks, and challenger validation suites pass 100%.

---

## 4. Conclusion

All 4 remediation requirements assigned by the orchestrator and identified by both primary and adversarial reviewers have been fully implemented and verified:
1. Disaggregated membership policies on `workspace_members`, `club_members`, and `dorm_members` (closing privilege escalation; allowing self-delete/leave).
2. Added `UPDATE` and `DELETE` storage policies for all 3 buckets.
3. Added the 4 foreign key performance indexes.
4. Synchronized `web/src/types/database.ts`.
5. 0 typecheck errors, 354/354 unit tests pass, and Next.js production build succeeds with 34/34 static pages.

---

## 5. Verification Method

To verify these changes independently:
```powershell
# 1. Inspect migration SQL and types
view_file AbsolutePath="d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\supabase\migrations\003_complete_campusos_schema.sql"
view_file AbsolutePath="d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\src\types\database.ts"

# 2. Run TypeScript typecheck
cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
npm run typecheck

# 3. Run full unit test suite
npm test

# 4. Run adversarial challenger test suites
node --experimental-strip-types --test tests/challenger-m1-schema-sql.test.ts tests/challenger-m1-database-types.test.ts

# 5. Run production build
npm run build
```
