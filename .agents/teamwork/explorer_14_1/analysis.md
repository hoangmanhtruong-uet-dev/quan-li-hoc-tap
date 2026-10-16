# CampusOS Database Architecture, Schema Migration & MySQL Elimination Analysis

**Author:** explorer_14_1 (Schema & MySQL Explorer)  
**Date:** 2026-10-16T20:36:00Z  
**Status:** Complete Investigation & Blueprint  
**Target:** R1 (Schema Migrations & RLS) and R4 (MySQL Cleanup)  

---

## 1. Executive Summary

This investigation provides a comprehensive database and architectural blueprint for migrating CampusOS from a hybrid/legacy MySQL setup to a 100% unified, production-grade **Supabase PostgreSQL** architecture with Row-Level Security (RLS), Supabase Auth, and Storage Buckets.

### Key Discoveries:
1. **Existing Migrations:**
   - `001_pomodoro_schema.sql` (143 lines): Contains 8 tables for Pomodoro characters, voice packs, orders, entitlements, study sessions, distraction events, and daily stats. Uses `UUID` and references `auth.users(id)`.
   - `002_dashboard_calendar_sync.sql` (90 lines): Contains 4 tables (`student_profiles`, `student_deadlines`, `student_calendar_events`, `student_focus_sessions`). Currently uses a placeholder `user_id TEXT DEFAULT 'default_student'` and open RLS `USING (true)` as an interim offline sync target.
2. **Missing Schema for Milestone Goals:**
   The entire relational domain for `tasks` (Eisenhower matrix, subtasks, attachments), `courses` & `course_syllabus`, `workspaces` (with RBAC `OWNER`, `ADMIN`, `MANAGER`, `MEMBER`, `VIEWER`, Kanban tasks, shared documents), `clubs` (members, events, finances, tasks), `dorm_spaces` (members, chores, expenses), and `student_notifications` needs to be defined in `003_complete_campusos_schema.sql` with robust RLS policies and performance indexing.
3. **Legacy MySQL Footprint:**
   14 distinct files across `web/src/lib/`, `web/src/app/api/`, and `web/scripts/` still import `mysql2` and query a MySQL pool. All existing 339 unit tests in `web/tests/` are 100% in-memory / unit-mocked and do **not** depend on MySQL. Hence, eliminating MySQL will not break test suites.
4. **Storage Architecture:**
   The app previously referenced a single bucket `academic-vault`. Requirement R2 requires 3 dedicated buckets (`academic-materials`, `task-attachments`, `student-avatars`).

---

## 2. Current Database Architecture & Migrations Audit

### 2.1 File: `supabase/migrations/001_pomodoro_schema.sql`
- **Extensions:** `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- **Tables:**
  - `characters`: Pomodoro supervisor personas (Mèo Leo, Thầy giáo hắc ám, etc.)
  - `voice_packs`: Audio add-ons
  - `voice_lines`: Contextual voice roast audio clips
  - `entitlements`: User ownership of characters/packs (`user_id UUID REFERENCES auth.users(id)`)
  - `orders`: PayOS / VietQR transactions
  - `study_sessions`: Completed Pomodoro focus sessions
  - `distraction_events`: Tab switches, idle events, sleep detection logs
  - `daily_stats`: Daily discipline and focus aggregation
- **RLS Status:** RLS is enabled on all 8 tables. Policies properly verify `auth.uid() = user_id`.

### 2.2 File: `supabase/migrations/002_dashboard_calendar_sync.sql`
- **Tables:**
  - `public.student_profiles`: XP, level, rank title, streak, streak freezes, study minutes, daily mood, vibe theme, reduced motion.
  - `public.student_deadlines`: Deadlines with title, course, dates, urgent flag, completed flag.
  - `public.student_calendar_events`: Events with checklist JSONB, time slots, location.
  - `public.student_focus_sessions`: Focus session logs.
- **RLS Status:** Open policies `CREATE POLICY "Cho phép đọc profiles" ON public.student_profiles FOR SELECT USING (true);`.
- **Architectural Debt:**
  - Column `user_id` is `TEXT NOT NULL DEFAULT 'default_student'`.
  - Open RLS policies allow any caller to read/write all student profiles.
  - Needs migration to formal `auth.users(id)` foreign key relationship and authentic per-user RLS.

---

## 3. Schema Blueprint for `003_complete_campusos_schema.sql`

To satisfy **R1** and ensure strict compliance with **Supabase Postgres Best Practices** (especially `security-rls-performance.md`, `schema-foreign-key-indexes.md`, and `advanced-jsonb-indexing.md`), the `003_complete_campusos_schema.sql` migration is organized into modular sections:

### 3.1 Extensions & Security Definer RBAC Helper Functions

> **RLS Recursion & Performance Guard:**  
> Direct subqueries on tables like `workspace_members` or `club_members` inside their own RLS policy cause infinite recursion in Postgres (`infinite recursion detected in policy for relation ...`).  
> Furthermore, per `security-rls-performance.md`, functions evaluating membership must be `SECURITY DEFINER` with `SET search_path = ''` and wrap `(SELECT auth.uid())` to be cached as an InitPlan.

```sql
-- ============================================================================
-- 003_complete_campusos_schema.sql
-- CampusOS: Complete Supabase PostgreSQL Schema & RBAC Row Level Security
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- RBAC Helper Functions (Security Definer to prevent policy recursion)
-- ----------------------------------------------------------------------------

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

CREATE OR REPLACE FUNCTION public.is_workspace_admin(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = (SELECT auth.uid())
      AND role IN ('OWNER', 'ADMIN')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_club_member(p_club_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = p_club_id AND user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_club_admin(p_club_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = p_club_id
      AND user_id = (SELECT auth.uid())
      AND role IN ('OWNER', 'ADMIN', 'MANAGER')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_dorm_member(p_dorm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dorm_members
    WHERE dorm_id = p_dorm_id AND user_id = (SELECT auth.uid())
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_workspace_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID) TO authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.is_workspace_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(UUID) TO authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.is_club_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_club_member(UUID) TO authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.is_club_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_club_admin(UUID) TO authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.is_dorm_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_dorm_member(UUID) TO authenticated, anon;
```

---

### 3.2 Table Definitions

#### 1. `profiles`
Replaces the legacy MySQL `users` table and merges with `student_profiles`:
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  school TEXT,
  major TEXT,
  academic_year TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'PLATFORM_ADMIN')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned')),
  email_verified BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  rank_title TEXT NOT NULL DEFAULT 'Tân sinh viên ngơ ngác',
  streak INT NOT NULL DEFAULT 1,
  streak_freezes INT NOT NULL DEFAULT 1,
  study_minutes_total INT NOT NULL DEFAULT 0,
  weekly_goal_minutes INT NOT NULL DEFAULT 720,
  weekly_study_minutes INT NOT NULL DEFAULT 0,
  last_study_date DATE,
  daily_mood TEXT CHECK (daily_mood IS NULL OR daily_mood IN ('sleepy', 'neutral', 'cool', 'fire')),
  vibe_theme TEXT NOT NULL DEFAULT 'aurora' CHECK (vibe_theme IN ('aurora', 'y2k', 'cyber', 'pastel')),
  reduced_motion BOOLEAN NOT NULL DEFAULT false,
  gpa NUMERIC(3,2) DEFAULT 0.0,
  badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-create profile on Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, full_name, display_name, avatar_url)
  VALUES (
    new.id,
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Sinh viên mới'),
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

#### 2. `courses` & `course_syllabus`
```sql
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  instructor TEXT,
  credits INT NOT NULL DEFAULT 3,
  color TEXT NOT NULL DEFAULT '#4D7CFF',
  semester TEXT NOT NULL DEFAULT '2026.1',
  room TEXT,
  schedule TEXT,
  syllabus_url TEXT,
  grade_components JSONB NOT NULL DEFAULT '[]'::jsonb,
  final_score NUMERIC(4,2),
  letter_grade TEXT NOT NULL DEFAULT '—',
  status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'passed', 'warning', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_syllabus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  topic TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  slides_attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 3. `tasks`
Complete mapping of `TaskItem` from `web/src/types/tasks.ts`:
```sql
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  course TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  difficulty INT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  due_date TIMESTAMPTZ,
  estimate_min INT NOT NULL DEFAULT 30,
  actual_min INT NOT NULL DEFAULT 0,
  quadrant TEXT NOT NULL DEFAULT 'do_first' CHECK (quadrant IN ('do_first', 'schedule', 'delegate', 'eliminate')),
  subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  activity_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  pomodoro_planned INT NOT NULL DEFAULT 1,
  pomodoro_done INT NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  order_index INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 4. `workspaces`, `workspace_members`, `workspace_kanban_tasks`, `workspace_documents`, `workspace_activities`
```sql
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  course_code TEXT,
  course_name TEXT,
  semester TEXT,
  type TEXT NOT NULL DEFAULT 'project' CHECK (type IN ('project', 'research', 'competition', 'PERSONAL', 'CLUB', 'HOUSEHOLD')),
  progress_percent INT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_workspace_member UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.workspace_kanban_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMPTZ,
  subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workspace_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'report' CHECK (category IN ('report', 'slides', 'source', 'reference')),
  file_size TEXT,
  uploader_name TEXT,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workspace_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  actor_avatar TEXT,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 5. `clubs`, `club_members`, `club_events`, `club_finances`, `club_tasks`
```sql
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Công nghệ',
  established_year INT DEFAULT 2024,
  cover_gradient TEXT,
  icon_name TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  general_fund_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  event_fund_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  reserve_fund_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER')),
  department TEXT NOT NULL DEFAULT 'Ban Chuyên môn & Kỹ thuật',
  student_id TEXT,
  active_score INT NOT NULL DEFAULT 50,
  joined_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_club_member UNIQUE (club_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.club_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Workshop',
  department TEXT,
  max_attendees INT NOT NULL DEFAULT 100,
  attendee_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  banner_gradient TEXT,
  budget_vnd NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_finances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  fund_type TEXT NOT NULL DEFAULT 'general' CHECK (fund_type IN ('general', 'event', 'reserve')),
  amount NUMERIC(15,2) NOT NULL,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.club_events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  department TEXT,
  assignee_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 6. `dorm_spaces`, `dorm_members`, `dorm_chores`, `dorm_expenses`
```sql
CREATE TABLE IF NOT EXISTS public.dorm_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'dorm' CHECK (type IN ('dorm', 'apartment', 'house')),
  room_number TEXT,
  address TEXT,
  common_fund_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dorm_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dorm_id UUID NOT NULL REFERENCES public.dorm_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'member')),
  net_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  penalty_points INT NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dorm_member UNIQUE (dorm_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.dorm_chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dorm_id UUID NOT NULL REFERENCES public.dorm_spaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  day_of_week TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
  penalty_amount NUMERIC(15,2) NOT NULL DEFAULT 20000,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dorm_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dorm_id UUID NOT NULL REFERENCES public.dorm_spaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'electric' CHECK (type IN ('electric', 'water', 'internet', 'rent', 'trash', 'food', 'other')),
  month TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  paid_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  split_member_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  usage_start_index NUMERIC(10,2),
  usage_end_index NUMERIC(10,2),
  usage_unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 7. `student_notifications`
```sql
CREATE TABLE IF NOT EXISTS public.student_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('academic', 'deadline', 'club', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 3.3 Indexes & Performance Optimization (Supabase Best Practices)

Per `schema-foreign-key-indexes.md`, Postgres does **not** automatically index foreign keys. Without explicit indexes, cascaded deletes and joins perform full table sequential scans:

```sql
-- Foreign Key & Query Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_courses_user_id ON public.courses(user_id);
CREATE INDEX IF NOT EXISTS idx_course_syllabus_course_id ON public.course_syllabus(course_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_course_id ON public.tasks(course_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_quadrant ON public.tasks(user_id, quadrant);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws_user ON public.workspace_members(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_kanban_ws ON public.workspace_kanban_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_docs_ws ON public.workspace_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_activities_ws ON public.workspace_activities(workspace_id);

CREATE INDEX IF NOT EXISTS idx_clubs_owner ON public.clubs(owner_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user ON public.club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club_user ON public.club_members(club_id, user_id);
CREATE INDEX IF NOT EXISTS idx_club_events_club ON public.club_events(club_id);
CREATE INDEX IF NOT EXISTS idx_club_finances_club ON public.club_finances(club_id);
CREATE INDEX IF NOT EXISTS idx_club_tasks_club ON public.club_tasks(club_id);

CREATE INDEX IF NOT EXISTS idx_dorm_spaces_owner ON public.dorm_spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_dorm_members_user ON public.dorm_members(user_id);
CREATE INDEX IF NOT EXISTS idx_dorm_members_dorm_user ON public.dorm_members(dorm_id, user_id);
CREATE INDEX IF NOT EXISTS idx_dorm_chores_dorm ON public.dorm_chores(dorm_id);
CREATE INDEX IF NOT EXISTS idx_dorm_expenses_dorm ON public.dorm_expenses(dorm_id);

CREATE INDEX IF NOT EXISTS idx_student_notifications_user_unread ON public.student_notifications(user_id, is_read);
```

---

### 3.4 Row Level Security (RLS) Policies

All tables have RLS enabled. Using cached `(SELECT auth.uid())` prevents per-row re-evaluation:

```sql
-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_kanban_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dorm_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dorm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dorm_chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dorm_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies
CREATE POLICY "Public profile view" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "User update own profile" ON public.profiles FOR UPDATE USING (id = (SELECT auth.uid()));
CREATE POLICY "User insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = (SELECT auth.uid()));

-- 3. Courses Policies
CREATE POLICY "User manage courses" ON public.courses FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 4. Course Syllabus Policies
CREATE POLICY "User manage syllabus" ON public.course_syllabus FOR ALL
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_syllabus.course_id AND courses.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_syllabus.course_id AND courses.user_id = (SELECT auth.uid())));

-- 5. Tasks Policies
CREATE POLICY "User manage tasks" ON public.tasks FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 6. Workspaces Policies
CREATE POLICY "Workspace view for members" ON public.workspaces FOR SELECT
  USING (owner_id = (SELECT auth.uid()) OR public.is_workspace_member(id));
CREATE POLICY "Workspace insert" ON public.workspaces FOR INSERT
  WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY "Workspace update for admin" ON public.workspaces FOR UPDATE
  USING (owner_id = (SELECT auth.uid()) OR public.is_workspace_admin(id));
CREATE POLICY "Workspace delete for owner" ON public.workspaces FOR DELETE
  USING (owner_id = (SELECT auth.uid()));

-- 7. Workspace Members Policies
CREATE POLICY "Workspace members view" ON public.workspace_members FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR public.is_workspace_member(workspace_id));
CREATE POLICY "Workspace members manage" ON public.workspace_members FOR ALL
  USING (public.is_workspace_admin(workspace_id) OR user_id = (SELECT auth.uid()))
  WITH CHECK (public.is_workspace_admin(workspace_id) OR user_id = (SELECT auth.uid()));

-- 8. Workspace Kanban Tasks Policies
CREATE POLICY "Workspace tasks view" ON public.workspace_kanban_tasks FOR SELECT
  USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Workspace tasks manage" ON public.workspace_kanban_tasks FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

-- 9. Workspace Documents Policies
CREATE POLICY "Workspace docs view" ON public.workspace_documents FOR SELECT
  USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Workspace docs manage" ON public.workspace_documents FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

-- 10. Workspace Activities Policies
CREATE POLICY "Workspace activities view" ON public.workspace_activities FOR SELECT
  USING (public.is_workspace_member(workspace_id));
CREATE POLICY "Workspace activities insert" ON public.workspace_activities FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

-- 11. Clubs Policies
CREATE POLICY "Public clubs view" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Club update for admin" ON public.clubs FOR UPDATE
  USING (owner_id = (SELECT auth.uid()) OR public.is_club_admin(id));
CREATE POLICY "Club insert authenticated" ON public.clubs FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- 12. Club Members Policies
CREATE POLICY "Public club members view" ON public.club_members FOR SELECT USING (true);
CREATE POLICY "Club members manage" ON public.club_members FOR ALL
  USING (public.is_club_admin(club_id) OR user_id = (SELECT auth.uid()))
  WITH CHECK (public.is_club_admin(club_id) OR user_id = (SELECT auth.uid()));

-- 13. Club Events Policies
CREATE POLICY "Public club events view" ON public.club_events FOR SELECT USING (true);
CREATE POLICY "Club events manage" ON public.club_events FOR ALL
  USING (public.is_club_admin(club_id))
  WITH CHECK (public.is_club_admin(club_id));

-- 14. Club Finances Policies
CREATE POLICY "Club finances view for members" ON public.club_finances FOR SELECT
  USING (public.is_club_member(club_id));
CREATE POLICY "Club finances manage for admin" ON public.club_finances FOR ALL
  USING (public.is_club_admin(club_id))
  WITH CHECK (public.is_club_admin(club_id));

-- 15. Club Tasks Policies
CREATE POLICY "Club tasks view for members" ON public.club_tasks FOR SELECT
  USING (public.is_club_member(club_id));
CREATE POLICY "Club tasks manage for members" ON public.club_tasks FOR ALL
  USING (public.is_club_member(club_id))
  WITH CHECK (public.is_club_member(club_id));

-- 16. Dorm Spaces Policies
CREATE POLICY "Dorm view for members" ON public.dorm_spaces FOR SELECT
  USING (owner_id = (SELECT auth.uid()) OR public.is_dorm_member(id));
CREATE POLICY "Dorm manage" ON public.dorm_spaces FOR ALL
  USING (owner_id = (SELECT auth.uid()) OR public.is_dorm_member(id))
  WITH CHECK (owner_id = (SELECT auth.uid()) OR public.is_dorm_member(id));

-- 17. Dorm Members Policies
CREATE POLICY "Dorm members view" ON public.dorm_members FOR SELECT
  USING (public.is_dorm_member(dorm_id));
CREATE POLICY "Dorm members manage" ON public.dorm_members FOR ALL
  USING (public.is_dorm_member(dorm_id) OR user_id = (SELECT auth.uid()))
  WITH CHECK (public.is_dorm_member(dorm_id) OR user_id = (SELECT auth.uid()));

-- 18. Dorm Chores Policies
CREATE POLICY "Dorm chores view" ON public.dorm_chores FOR SELECT
  USING (public.is_dorm_member(dorm_id));
CREATE POLICY "Dorm chores manage" ON public.dorm_chores FOR ALL
  USING (public.is_dorm_member(dorm_id))
  WITH CHECK (public.is_dorm_member(dorm_id));

-- 19. Dorm Expenses Policies
CREATE POLICY "Dorm expenses view" ON public.dorm_expenses FOR SELECT
  USING (public.is_dorm_member(dorm_id));
CREATE POLICY "Dorm expenses manage" ON public.dorm_expenses FOR ALL
  USING (public.is_dorm_member(dorm_id))
  WITH CHECK (public.is_dorm_member(dorm_id));

-- 20. Student Notifications Policies
CREATE POLICY "User manage notifications" ON public.student_notifications FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
```

---

### 3.5 Storage Buckets Setup (Requirement R2)

```sql
-- Storage buckets for academic PDFs, task attachments, and student avatar images
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('academic-materials', 'academic-materials', true),
  ('task-attachments', 'task-attachments', false),
  ('student-avatars', 'student-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Storage RLS Policies
CREATE POLICY "Public read academic-materials" ON storage.objects FOR SELECT
  USING (bucket_id = 'academic-materials');
CREATE POLICY "Authenticated upload academic-materials" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'academic-materials' AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Private read task-attachments" ON storage.objects FOR SELECT
  USING (bucket_id = 'task-attachments' AND (SELECT auth.uid()) IS NOT NULL);
CREATE POLICY "Authenticated upload task-attachments" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'task-attachments' AND (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Public read student-avatars" ON storage.objects FOR SELECT
  USING (bucket_id = 'student-avatars');
CREATE POLICY "Authenticated upload student-avatars" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'student-avatars' AND (SELECT auth.uid()) IS NOT NULL);
```

---

## 4. Legacy MySQL & Connectors Cleanup Audit (Preparation for R4)

### 4.1 Exhaustive Catalog of MySQL Artifacts in Codebase

| File Path | Nature of Dependency | Remediation for R4 |
|---|---|---|
| `web/package.json` | `"mysql2": "^3.22.6"` | Uninstall `mysql2` via `npm uninstall mysql2` |
| `web/src/lib/db.ts` | Creates `mysql.createPool` using `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Replaced by `@supabase/supabase-js` client / Supabase Postgres |
| `web/src/lib/auth.ts` | Executes raw SQL against `users`, `email_verifications`, `password_resets` | Replaced by standard `supabase.auth` methods (`signInWithPassword`, `signUp`, `resetPasswordForEmail`, etc.) |
| `web/src/lib/personal-workspace.ts` | Executes `SELECT/INSERT INTO team_workspaces` via MySQL | Replaced by Supabase query or trigger on `profiles` |
| `web/src/lib/workspace-authorization.ts` | Executes `SELECT role FROM team_memberships` via MySQL | Replaced by Supabase queries / RLS enforcement |
| `web/src/lib/workspace-service.ts` | Executes queries and `FOR UPDATE` transaction locks via `mysql2/promise` | Replaced by Supabase client querying `workspaces` and `workspace_members` |
| `web/src/app/api/health/route.ts` | Calls `pool.query('SELECT 1 AS ok')` | Replaced with Supabase ping: `supabase.from('profiles').select('count', { count: 'exact', head: true })` |
| `web/src/app/api/auth/login/route.ts` | Queries MySQL `users` table directly | Call `supabase.auth.signInWithPassword({ email, password })` |
| `web/src/app/api/auth/register/route.ts` | Inserts into MySQL `users` | Call `supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })` |
| `web/src/app/api/auth/logout/route.ts` | Clears custom session cookie | Call `supabase.auth.signOut()` |
| `web/src/app/api/auth/me/route.ts` | Reads session payload & MySQL `users` | Call `supabase.auth.getUser()` & fetch `profiles` |
| `web/src/app/api/auth/forgot-password/route.ts` | Inserts into MySQL `password_resets` | Call `supabase.auth.resetPasswordForEmail()` |
| `web/src/app/api/auth/reset-password/route.ts` | Updates MySQL `users.password_hash` | Call `supabase.auth.updateUser({ password })` |
| `web/src/app/api/auth/verify-email/route.ts` | Queries MySQL `email_verifications` | Handled natively by Supabase Auth email confirmation |
| `web/src/app/api/onboarding/route.ts` | Updates MySQL `users.onboarding_completed` | Update `profiles` table via Supabase: `.from('profiles').update({ onboarding_completed: true })` |
| `web/src/middleware.ts` | Verifies custom JWT cookie `session` using `jose` | Update to verify Supabase Auth session token (or `@supabase/ssr`) |
| `web/scripts/*.mjs`, `web/scripts/*.sql` | MySQL migration scripts (`migrate-phase-5b.mjs`, `check-tables.mjs`, `migrate-auth.sql`, etc.) | Archive or remove, replaced by `supabase/migrations/` |

### 4.2 Impact Assessment on Existing Tests
- All 339 tests in `web/tests/` passed 100%.
- Search for `mysql` or `mysql2` in `web/tests/` yielded **0 occurrences**.
- All domain logic tests (`workspace-engine.test.ts`, `club-engine.test.ts`, `tasks-redesign.test.ts`, `academic-engine.test.ts`, etc.) test external stores (`useSyncExternalStore`) and in-memory pure calculation algorithms.
- Therefore, removing `mysql2` and switching to Supabase will **not break any existing tests**.

---

## 5. TypeScript Types Mapping & Database Definitions Blueprint

A new file `web/src/types/database.ts` should be created to define the exact TypeScript representations for Supabase client queries.

### Entity Mapping Matrix:
| Postgres Table | Database Column | TypeScript Interface | Frontend Engine / Type |
|---|---|---|---|
| `profiles` | `id`, `xp`, `level`, `streak`, `vibe_theme`, `daily_mood` | `ProfileRow` | `CampusOSSharedState` (`campus-store.ts`), `User` (`types/index.ts`) |
| `courses` | `id`, `code`, `name`, `credits`, `grade_components`, `final_score` | `CourseRow` | `CourseItem` (`academic-engine.ts`) |
| `course_syllabus` | `id`, `course_id`, `week_number`, `topic`, `slides_attachments` | `CourseSyllabusRow` | `SyllabusChapter` (`study/courses/[id]`) |
| `tasks` | `id`, `user_id`, `status`, `priority`, `quadrant`, `subtasks`, `attachments` | `TaskRow` | `TaskItem` (`types/tasks.ts`) |
| `workspaces` | `id`, `owner_id`, `name`, `course_code`, `progress_percent` | `WorkspaceRow` | `WorkspaceItem` (`workspace-engine.ts`) |
| `workspace_members` | `id`, `workspace_id`, `user_id`, `role` | `WorkspaceMemberRow` | `WorkspaceMember` (`workspace-engine.ts`) |
| `workspace_kanban_tasks` | `id`, `workspace_id`, `status`, `subtasks`, `attachments` | `WorkspaceKanbanTaskRow` | `WorkspaceTask` (`workspace-engine.ts`) |
| `workspace_documents` | `id`, `workspace_id`, `name`, `category`, `url` | `WorkspaceDocumentRow` | `WorkspaceDocument` (`workspace-engine.ts`) |
| `clubs` | `id`, `name`, `category`, `general_fund_balance`, `tags` | `ClubRow` | `ClubDetail` (`club-engine.ts`) |
| `club_events` | `id`, `club_id`, `title`, `date`, `start_time`, `end_time` | `ClubEventRow` | `ClubEvent` (`club-engine.ts`) |
| `club_finances` | `id`, `club_id`, `type`, `amount`, `category`, `fund_type` | `ClubFinanceRow` | `ClubTransaction` (`club-engine.ts`) |
| `dorm_spaces` | `id`, `name`, `type`, `room_number`, `common_fund_balance` | `DormSpaceRow` | `LivingSpaceItem` (`living-engine.ts`) |
| `dorm_chores` | `id`, `dorm_id`, `title`, `assignee_id`, `day_of_week`, `penalty_amount` | `DormChoreRow` | `ChoreTask` (`living-engine.ts`) |
| `dorm_expenses` | `id`, `dorm_id`, `title`, `type`, `month`, `amount`, `status` | `DormExpenseRow` | `UtilityBill` (`living-engine.ts`) |
| `student_notifications` | `id`, `user_id`, `title`, `message`, `type`, `is_read`, `action_url` | `StudentNotificationRow` | `CampusNotification` (`notifications-engine.ts`) |

---

## 6. Recommendations & Implementation Sequence

1. **Phase R1 (Schema & Storage):**
   - Create `supabase/migrations/003_complete_campusos_schema.sql` containing all 19 tables, indexes, security definer functions, RLS policies, and storage bucket definitions.
   - Run typecheck and ensure migration syntax is strictly valid PostgreSQL.
2. **Phase R2 (Storage Engine):**
   - Update `web/src/lib/storage-engine.ts` to support the three designated buckets (`academic-materials`, `task-attachments`, `student-avatars`) while maintaining client data URL fallback.
3. **Phase R3 (CampusOS Sync Engine):**
   - Upgrade `web/src/lib/supabase-sync.ts` with Realtime WebSockets (`supabase.channel('campusos-realtime')`) on `tasks`, `notifications`, and `workspaces`.
4. **Phase R4 (Supabase Auth & MySQL Elimination):**
   - Replace MySQL in `api/auth/*` routes with Supabase Auth.
   - Update `api/health` to ping Supabase Postgres.
   - Rewrite `workspace-service.ts` and `authorization.ts` using Supabase.
   - Remove `mysql2` from `package.json`.
   - Update `middleware.ts` for Supabase Auth.
   - Verify with `npm test`, `npm run typecheck`, and `npm run build`.
