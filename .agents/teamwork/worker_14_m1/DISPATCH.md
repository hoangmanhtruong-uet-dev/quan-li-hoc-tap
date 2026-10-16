## 2026-10-16T20:38:51Z

You are worker_14_m1 (Database Schema & Types Worker) for Milestone 1.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_14_m1
Project root: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap
Web app directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
Authoritative request log: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md
Project plan: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
Explorer Blueprint: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_14_1\analysis.md
Skill instructions: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agent\skills\supabase-postgres-best-practices\SKILL.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your write ownership:
You exclusively own:
- `supabase/migrations/003_complete_campusos_schema.sql`
- `web/src/types/database.ts`

Your mission:
1. Read ORIGINAL_REQUEST.md, PROJECT.md, and explorer_14_1's analysis.md.
2. Follow Supabase Postgres best practices:
   - Indexes on foreign keys and filter columns.
   - Avoid RLS recursion by using SECURITY DEFINER functions (`is_workspace_member`, `is_workspace_admin`, `is_club_member`, `is_club_admin`, `is_dorm_member`) with `SET search_path = ''`.
   - Wrap `(SELECT auth.uid())` in policies so PostgreSQL can cache execution plans (InitPlan).
   - Use UUID primary keys with `gen_random_uuid()`.
3. Create `supabase/migrations/003_complete_campusos_schema.sql` covering:
   - `profiles`: `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`, `full_name`, `display_name`, `avatar_url`, `student_id`, `school`, `major`, `xp INTEGER DEFAULT 0`, `level INTEGER DEFAULT 1`, `rank_title TEXT DEFAULT 'Tân sinh viên ngơ ngác'`, `streak INTEGER DEFAULT 1`, `vibe_theme TEXT DEFAULT 'aurora'`, `bio`, `created_at`, `updated_at`.
   - `tasks`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`, `title TEXT NOT NULL`, `description TEXT`, `status TEXT NOT NULL DEFAULT 'todo'`, `priority TEXT NOT NULL DEFAULT 'medium'`, `due_date TIMESTAMPTZ`, `estimated_minutes INTEGER`, `course_id TEXT`, `eisenhower_quadrant TEXT DEFAULT 'Q2'`, `subtasks JSONB DEFAULT '[]'::jsonb`, `attachments JSONB DEFAULT '[]'::jsonb`, `completed_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`.
   - `courses` & `course_syllabus`:
     - `courses`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`, `code TEXT NOT NULL`, `name TEXT NOT NULL`, `lecturer TEXT`, `room TEXT`, `credits INTEGER DEFAULT 3`, `color TEXT DEFAULT '#4D7CFF'`, `grade_components JSONB DEFAULT '[]'::jsonb`, `created_at`, `updated_at`.
     - `course_syllabus`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE`, `week_number INTEGER NOT NULL`, `topic TEXT NOT NULL`, `description TEXT`, `slides_url TEXT`, `materials JSONB DEFAULT '[]'::jsonb`, `created_at`.
   - `workspaces`, `workspace_members`, `workspace_kanban_tasks`, `workspace_documents`:
     - `workspaces`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`, `name TEXT NOT NULL`, `slug TEXT NOT NULL`, `description TEXT`, `avatar_url TEXT`, `created_at`, `updated_at`.
     - `workspace_members`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE`, `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`, `role TEXT NOT NULL DEFAULT 'MEMBER'`, `joined_at TIMESTAMPTZ DEFAULT now()`, `UNIQUE(workspace_id, user_id)`.
     - `workspace_kanban_tasks`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE`, `title TEXT NOT NULL`, `description TEXT`, `status TEXT NOT NULL DEFAULT 'todo'`, `priority TEXT NOT NULL DEFAULT 'medium'`, `assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL`, `due_date TIMESTAMPTZ`, `created_at`, `updated_at`.
     - `workspace_documents`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE`, `title TEXT NOT NULL`, `file_url TEXT NOT NULL`, `file_type TEXT`, `file_size BIGINT`, `uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`, `created_at`.
   - `clubs`, `club_events`, `club_finances`:
     - `clubs`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `name TEXT NOT NULL`, `category TEXT NOT NULL`, `description TEXT`, `avatar_url TEXT`, `president_id UUID NOT NULL REFERENCES auth.users(id)`, `created_at`, `updated_at`.
     - `club_members`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE`, `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`, `role TEXT NOT NULL DEFAULT 'member'`, `joined_at TIMESTAMPTZ DEFAULT now()`, `UNIQUE(club_id, user_id)`.
     - `club_events`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE`, `title TEXT NOT NULL`, `start_time TIMESTAMPTZ NOT NULL`, `end_time TIMESTAMPTZ`, `location TEXT`, `budget NUMERIC(12,2) DEFAULT 0`, `created_at`.
     - `club_finances`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE`, `type TEXT NOT NULL`, `amount NUMERIC(12,2) NOT NULL`, `category TEXT NOT NULL`, `description TEXT`, `recorded_by UUID NOT NULL REFERENCES auth.users(id)`, `transaction_date TIMESTAMPTZ NOT NULL DEFAULT now()`.
   - `dorm_spaces`, `dorm_chores`, `dorm_expenses`:
     - `dorm_spaces`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `name TEXT NOT NULL`, `room_number TEXT NOT NULL`, `building TEXT`, `created_by UUID NOT NULL REFERENCES auth.users(id)`, `created_at`.
     - `dorm_members`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `space_id UUID NOT NULL REFERENCES dorm_spaces(id) ON DELETE CASCADE`, `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`, `joined_at TIMESTAMPTZ DEFAULT now()`, `UNIQUE(space_id, user_id)`.
     - `dorm_chores`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `space_id UUID NOT NULL REFERENCES dorm_spaces(id) ON DELETE CASCADE`, `title TEXT NOT NULL`, `assigned_to UUID REFERENCES auth.users(id)`, `due_date TIMESTAMPTZ`, `status TEXT NOT NULL DEFAULT 'pending'`, `created_at`.
     - `dorm_expenses`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `space_id UUID NOT NULL REFERENCES dorm_spaces(id) ON DELETE CASCADE`, `title TEXT NOT NULL`, `total_amount NUMERIC(12,2) NOT NULL`, `paid_by UUID NOT NULL REFERENCES auth.users(id)`, `split_type TEXT NOT NULL DEFAULT 'equal'`, `created_at`.
   - `student_notifications`: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`, `title TEXT NOT NULL`, `message TEXT NOT NULL`, `type TEXT NOT NULL DEFAULT 'system'`, `is_read BOOLEAN NOT NULL DEFAULT false`, `action_url TEXT`, `created_at TIMESTAMPTZ DEFAULT now()`.
   - `on_auth_user_created` trigger executing `handle_new_user()` to populate `profiles`.
   - Storage buckets insertion into `storage.buckets`: `academic-materials`, `task-attachments`, `student-avatars` with RLS on `storage.objects`.
4. Create `web/src/types/database.ts` with comprehensive TypeScript types (`Database`, `Json`, table rows, inserts, updates) for Supabase client typing.
5. Verification:
   - Run `npm run typecheck` in `web/` to make sure 0 errors.
   - Run `npm test` in `web/` to make sure all 339 tests remain 100% passing.
6. Deliver:
   - Write `handoff.md` in your working directory with all commands and verification results.
   - Send completion message to orchestrator_14.
