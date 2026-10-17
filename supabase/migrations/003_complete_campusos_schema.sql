-- ==============================================================================
-- 003_complete_campusos_schema.sql
-- CampusOS: Complete Supabase PostgreSQL Schema, RBAC Row-Level Security,
-- Performance Indexes, Auto-User Profiles, and Storage Buckets
-- ==============================================================================

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Table Definitions
-- ==============================================================================

-- 3.1 Student Profiles (Replaces legacy MySQL users & extends gamification)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  student_id TEXT,
  school TEXT DEFAULT 'Đại học Quốc gia TP.HCM',
  major TEXT DEFAULT 'Khoa học Máy tính',
  academic_year TEXT DEFAULT 'K2023',
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'PLATFORM_ADMIN')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned')),
  email_verified BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  rank_title TEXT NOT NULL DEFAULT 'Tân sinh viên ngơ ngác',
  streak INTEGER NOT NULL DEFAULT 1,
  streak_freezes INTEGER NOT NULL DEFAULT 1,
  study_minutes_total INTEGER NOT NULL DEFAULT 0,
  weekly_goal_minutes INTEGER NOT NULL DEFAULT 720,
  weekly_study_minutes INTEGER NOT NULL DEFAULT 0,
  last_study_date TEXT,
  daily_mood TEXT,
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
  INSERT INTO public.profiles (
    id,
    user_id,
    email,
    full_name,
    display_name,
    avatar_url,
    student_id,
    school,
    major,
    xp,
    level,
    rank_title,
    streak,
    vibe_theme,
    bio
  )
  VALUES (
    new.id,
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Sinh viên mới'),
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(new.raw_user_meta_data->>'student_id', ''),
    COALESCE(new.raw_user_meta_data->>'school', 'Đại học Quốc gia TP.HCM'),
    COALESCE(new.raw_user_meta_data->>'major', 'Khoa học Máy tính'),
    0,
    1,
    'Tân sinh viên ngơ ngác',
    1,
    'aurora',
    COALESCE(new.raw_user_meta_data->>'bio', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3.2 Courses & Course Syllabus
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  lecturer TEXT,
  instructor TEXT,
  room TEXT,
  credits INTEGER NOT NULL DEFAULT 3,
  color TEXT NOT NULL DEFAULT '#4D7CFF',
  semester TEXT NOT NULL DEFAULT '2026.1',
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
  week_number INTEGER NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  slides_url TEXT,
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  slides_attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 Tasks (Eisenhower Matrix, subtasks, Pomodoro tracking)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  course TEXT,
  course_id TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done', 'in_progress')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  due_date TIMESTAMPTZ,
  estimated_minutes INTEGER DEFAULT 30,
  estimate_min INTEGER DEFAULT 30,
  actual_min INTEGER NOT NULL DEFAULT 0,
  eisenhower_quadrant TEXT DEFAULT 'Q2',
  quadrant TEXT NOT NULL DEFAULT 'schedule' CHECK (quadrant IN ('do_first', 'schedule', 'delegate', 'eliminate')),
  subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  activity_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  pomodoro_planned INTEGER NOT NULL DEFAULT 1,
  pomodoro_done INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  order_index INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 Workspaces, Members, Kanban Tasks, Documents & Activities
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  course_code TEXT,
  course_name TEXT,
  semester TEXT DEFAULT '2026.1',
  type TEXT NOT NULL DEFAULT 'project' CHECK (type IN ('project', 'research', 'competition', 'PERSONAL', 'CLUB', 'HOUSEHOLD')),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
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
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
  title TEXT NOT NULL,
  name TEXT,
  file_url TEXT NOT NULL,
  url TEXT,
  file_type TEXT,
  category TEXT NOT NULL DEFAULT 'report' CHECK (category IN ('report', 'slides', 'source', 'reference')),
  file_size BIGINT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploader_name TEXT,
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

-- 3.5 Student Clubs, Members, Events, Finances & Tasks
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  category TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  president_id UUID NOT NULL REFERENCES auth.users(id),
  owner_id UUID REFERENCES auth.users(id),
  established_year INTEGER DEFAULT 2024,
  cover_gradient TEXT,
  icon_name TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  general_fund_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  event_fund_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  reserve_fund_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER', 'president', 'officer', 'member')),
  department TEXT NOT NULL DEFAULT 'Ban Chuyên môn & Kỹ thuật',
  student_id TEXT,
  active_score INTEGER NOT NULL DEFAULT 50,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_club_member UNIQUE (club_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.club_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location TEXT,
  budget NUMERIC(12,2) DEFAULT 0,
  budget_vnd NUMERIC(15,2) DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Workshop',
  department TEXT,
  max_attendees INTEGER NOT NULL DEFAULT 100,
  attendee_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  banner_gradient TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_finances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12,2) NOT NULL,
  category TEXT NOT NULL,
  fund_type TEXT NOT NULL DEFAULT 'general' CHECK (fund_type IN ('general', 'event', 'reserve')),
  description TEXT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  receipt_url TEXT,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
  due_date TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.6 Dorm Spaces (Living spaces, roommates, chores, shared expenses)
CREATE TABLE IF NOT EXISTS public.dorm_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  building TEXT,
  address TEXT,
  type TEXT NOT NULL DEFAULT 'dorm' CHECK (type IN ('dorm', 'apartment', 'house')),
  common_fund_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dorm_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.dorm_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'member')),
  net_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  penalty_points INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dorm_member UNIQUE (space_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.dorm_chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.dorm_spaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  day_of_week TEXT,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed', 'done')),
  penalty_amount NUMERIC(15,2) NOT NULL DEFAULT 20000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dorm_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.dorm_spaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  amount NUMERIC(15,2),
  type TEXT NOT NULL DEFAULT 'electric' CHECK (type IN ('electric', 'water', 'internet', 'rent', 'trash', 'food', 'other')),
  month TEXT,
  paid_by UUID NOT NULL REFERENCES auth.users(id),
  split_type TEXT NOT NULL DEFAULT 'equal',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  split_member_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  due_date TIMESTAMPTZ,
  usage_start_index NUMERIC(10,2),
  usage_end_index NUMERIC(10,2),
  usage_unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.7 Student Notifications
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

-- ==============================================================================
-- 3. Foreign Key & Query Performance Indexes (Supabase Postgres Best Practices)
-- ==============================================================================

-- 4.1 Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 4.2 Courses & Syllabus Indexes
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON public.courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_code ON public.courses(code);
CREATE INDEX IF NOT EXISTS idx_course_syllabus_course_id ON public.course_syllabus(course_id);
CREATE INDEX IF NOT EXISTS idx_course_syllabus_course_week ON public.course_syllabus(course_id, week_number);

-- 4.3 Tasks Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_course_id ON public.tasks(course_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON public.tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_quadrant ON public.tasks(user_id, quadrant);
CREATE INDEX IF NOT EXISTS idx_tasks_user_eisenhower ON public.tasks(user_id, eisenhower_quadrant);

-- 4.4 Workspaces Indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON public.workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws_user ON public.workspace_members(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_kanban_ws ON public.workspace_kanban_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_kanban_assignee ON public.workspace_kanban_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_workspace_kanban_created_by ON public.workspace_kanban_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_workspace_kanban_status ON public.workspace_kanban_tasks(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_workspace_docs_ws ON public.workspace_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_docs_uploaded_by ON public.workspace_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_workspace_docs_uploader ON public.workspace_documents(uploader_id);
CREATE INDEX IF NOT EXISTS idx_workspace_docs_uploader_id ON public.workspace_documents(uploader_id);
CREATE INDEX IF NOT EXISTS idx_workspace_activities_ws ON public.workspace_activities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_activities_actor ON public.workspace_activities(actor_id);

-- 4.5 Clubs Indexes
CREATE INDEX IF NOT EXISTS idx_clubs_president ON public.clubs(president_id);
CREATE INDEX IF NOT EXISTS idx_clubs_owner ON public.clubs(owner_id);
CREATE INDEX IF NOT EXISTS idx_clubs_category ON public.clubs(category);
CREATE INDEX IF NOT EXISTS idx_club_members_user ON public.club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club_user ON public.club_members(club_id, user_id);
CREATE INDEX IF NOT EXISTS idx_club_events_club ON public.club_events(club_id);
CREATE INDEX IF NOT EXISTS idx_club_events_start ON public.club_events(club_id, start_time);
CREATE INDEX IF NOT EXISTS idx_club_finances_club ON public.club_finances(club_id);
CREATE INDEX IF NOT EXISTS idx_club_finances_date ON public.club_finances(club_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_club_finances_recorded_by ON public.club_finances(recorded_by);
CREATE INDEX IF NOT EXISTS idx_club_tasks_club ON public.club_tasks(club_id);
CREATE INDEX IF NOT EXISTS idx_club_tasks_event ON public.club_tasks(event_id);

-- 4.6 Dorm Spaces Indexes
CREATE INDEX IF NOT EXISTS idx_dorm_spaces_created_by ON public.dorm_spaces(created_by);
CREATE INDEX IF NOT EXISTS idx_dorm_spaces_owner ON public.dorm_spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_dorm_members_user ON public.dorm_members(user_id);
CREATE INDEX IF NOT EXISTS idx_dorm_members_space_user ON public.dorm_members(space_id, user_id);
CREATE INDEX IF NOT EXISTS idx_dorm_chores_space ON public.dorm_chores(space_id);
CREATE INDEX IF NOT EXISTS idx_dorm_chores_assigned ON public.dorm_chores(assigned_to);
CREATE INDEX IF NOT EXISTS idx_dorm_expenses_space ON public.dorm_expenses(space_id);
CREATE INDEX IF NOT EXISTS idx_dorm_expenses_paid_by ON public.dorm_expenses(paid_by);

-- 4.7 Student Notifications Indexes
CREATE INDEX IF NOT EXISTS idx_student_notifications_user_unread ON public.student_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_student_notifications_user_created ON public.student_notifications(user_id, created_at DESC);

-- ==============================================================================
-- 4. RBAC & Membership Helper Functions (SECURITY DEFINER with empty search_path)
-- NOTE: Using SECURITY DEFINER prevents infinite RLS recursion on membership tables
-- and wrapping (SELECT auth.uid()) allows PostgreSQL to evaluate as InitPlan.
-- ==============================================================================

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
      AND role IN ('OWNER', 'ADMIN', 'MANAGER', 'president', 'officer')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_dorm_member(p_space_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dorm_members
    WHERE space_id = p_space_id AND user_id = (SELECT auth.uid())
  );
$$;

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

REVOKE EXECUTE ON FUNCTION public.is_dorm_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_dorm_admin(UUID) TO authenticated, anon;

-- ==============================================================================
-- 5. Row-Level Security (RLS) Policies
-- All queries wrap (SELECT auth.uid()) so Postgres caches the result (InitPlan).
-- ==============================================================================

-- 5.1 Enable RLS on all tables
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

-- 5.2 Profiles Policies
DROP POLICY IF EXISTS "Public profile view" ON public.profiles;
CREATE POLICY "Public profile view" ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "User update own profile" ON public.profiles;
CREATE POLICY "User update own profile" ON public.profiles FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "User insert own profile" ON public.profiles;
CREATE POLICY "User insert own profile" ON public.profiles FOR INSERT
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "User delete own profile" ON public.profiles;
CREATE POLICY "User delete own profile" ON public.profiles FOR DELETE
  USING (id = (SELECT auth.uid()));

-- 5.3 Courses Policies
DROP POLICY IF EXISTS "User manage courses" ON public.courses;
CREATE POLICY "User manage courses" ON public.courses FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 5.4 Course Syllabus Policies
DROP POLICY IF EXISTS "User manage syllabus" ON public.course_syllabus;
CREATE POLICY "User manage syllabus" ON public.course_syllabus FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = course_syllabus.course_id
      AND courses.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = course_syllabus.course_id
      AND courses.user_id = (SELECT auth.uid())
  ));

-- 5.5 Tasks Policies
DROP POLICY IF EXISTS "User manage tasks" ON public.tasks;
CREATE POLICY "User manage tasks" ON public.tasks FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 5.6 Workspaces Policies
DROP POLICY IF EXISTS "Workspace view for members" ON public.workspaces;
CREATE POLICY "Workspace view for members" ON public.workspaces FOR SELECT
  USING (owner_id = (SELECT auth.uid()) OR public.is_workspace_member(id));

DROP POLICY IF EXISTS "Workspace insert" ON public.workspaces;
CREATE POLICY "Workspace insert" ON public.workspaces FOR INSERT
  WITH CHECK (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Workspace update for admin" ON public.workspaces;
CREATE POLICY "Workspace update for admin" ON public.workspaces FOR UPDATE
  USING (owner_id = (SELECT auth.uid()) OR public.is_workspace_admin(id))
  WITH CHECK (owner_id = (SELECT auth.uid()) OR public.is_workspace_admin(id));

DROP POLICY IF EXISTS "Workspace delete for owner" ON public.workspaces;
CREATE POLICY "Workspace delete for owner" ON public.workspaces FOR DELETE
  USING (owner_id = (SELECT auth.uid()));

-- 5.7 Workspace Members Policies
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

-- 5.8 Workspace Kanban Tasks Policies
DROP POLICY IF EXISTS "Workspace tasks view" ON public.workspace_kanban_tasks;
CREATE POLICY "Workspace tasks view" ON public.workspace_kanban_tasks FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Workspace tasks manage" ON public.workspace_kanban_tasks;
CREATE POLICY "Workspace tasks manage" ON public.workspace_kanban_tasks FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

-- 5.9 Workspace Documents Policies
DROP POLICY IF EXISTS "Workspace docs view" ON public.workspace_documents;
CREATE POLICY "Workspace docs view" ON public.workspace_documents FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Workspace docs manage" ON public.workspace_documents;
CREATE POLICY "Workspace docs manage" ON public.workspace_documents FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

-- 5.10 Workspace Activities Policies
DROP POLICY IF EXISTS "Workspace activities view" ON public.workspace_activities;
CREATE POLICY "Workspace activities view" ON public.workspace_activities FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Workspace activities insert" ON public.workspace_activities;
CREATE POLICY "Workspace activities insert" ON public.workspace_activities FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

-- 5.11 Clubs Policies
DROP POLICY IF EXISTS "Public clubs view" ON public.clubs;
CREATE POLICY "Public clubs view" ON public.clubs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Club insert authenticated" ON public.clubs;
CREATE POLICY "Club insert authenticated" ON public.clubs FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Club update for admin" ON public.clubs;
CREATE POLICY "Club update for admin" ON public.clubs FOR UPDATE
  USING (president_id = (SELECT auth.uid()) OR owner_id = (SELECT auth.uid()) OR public.is_club_admin(id))
  WITH CHECK (president_id = (SELECT auth.uid()) OR owner_id = (SELECT auth.uid()) OR public.is_club_admin(id));

DROP POLICY IF EXISTS "Club delete for owner" ON public.clubs;
CREATE POLICY "Club delete for owner" ON public.clubs FOR DELETE
  USING (president_id = (SELECT auth.uid()) OR owner_id = (SELECT auth.uid()));

-- 5.12 Club Members Policies
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

-- 5.13 Club Events Policies
DROP POLICY IF EXISTS "Public club events view" ON public.club_events;
CREATE POLICY "Public club events view" ON public.club_events FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Club events manage" ON public.club_events;
CREATE POLICY "Club events manage" ON public.club_events FOR ALL
  USING (public.is_club_admin(club_id))
  WITH CHECK (public.is_club_admin(club_id));

-- 5.14 Club Finances Policies
DROP POLICY IF EXISTS "Club finances view for members" ON public.club_finances;
CREATE POLICY "Club finances view for members" ON public.club_finances FOR SELECT
  USING (public.is_club_member(club_id));

DROP POLICY IF EXISTS "Club finances manage for admin" ON public.club_finances;
CREATE POLICY "Club finances manage for admin" ON public.club_finances FOR ALL
  USING (public.is_club_admin(club_id))
  WITH CHECK (public.is_club_admin(club_id));

-- 5.15 Club Tasks Policies
DROP POLICY IF EXISTS "Club tasks view for members" ON public.club_tasks;
CREATE POLICY "Club tasks view for members" ON public.club_tasks FOR SELECT
  USING (public.is_club_member(club_id));

DROP POLICY IF EXISTS "Club tasks manage for members" ON public.club_tasks;
CREATE POLICY "Club tasks manage for members" ON public.club_tasks FOR ALL
  USING (public.is_club_member(club_id))
  WITH CHECK (public.is_club_member(club_id));

-- 5.16 Dorm Spaces Policies
DROP POLICY IF EXISTS "Dorm view for members" ON public.dorm_spaces;
CREATE POLICY "Dorm view for members" ON public.dorm_spaces FOR SELECT
  USING (created_by = (SELECT auth.uid()) OR owner_id = (SELECT auth.uid()) OR public.is_dorm_member(id));

DROP POLICY IF EXISTS "Dorm spaces insert" ON public.dorm_spaces;
CREATE POLICY "Dorm spaces insert" ON public.dorm_spaces FOR INSERT
  WITH CHECK (created_by = (SELECT auth.uid()) OR owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Dorm spaces update" ON public.dorm_spaces;
CREATE POLICY "Dorm spaces update" ON public.dorm_spaces FOR UPDATE
  USING (created_by = (SELECT auth.uid()) OR owner_id = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()) OR owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Dorm spaces delete" ON public.dorm_spaces;
CREATE POLICY "Dorm spaces delete" ON public.dorm_spaces FOR DELETE
  USING (created_by = (SELECT auth.uid()) OR owner_id = (SELECT auth.uid()));

-- 5.17 Dorm Members Policies
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

-- 5.18 Dorm Chores Policies
DROP POLICY IF EXISTS "Dorm chores view" ON public.dorm_chores;
CREATE POLICY "Dorm chores view" ON public.dorm_chores FOR SELECT
  USING (public.is_dorm_member(space_id));

DROP POLICY IF EXISTS "Dorm chores manage" ON public.dorm_chores;
CREATE POLICY "Dorm chores manage" ON public.dorm_chores FOR ALL
  USING (public.is_dorm_member(space_id))
  WITH CHECK (public.is_dorm_member(space_id));

-- 5.19 Dorm Expenses Policies
DROP POLICY IF EXISTS "Dorm expenses view" ON public.dorm_expenses;
CREATE POLICY "Dorm expenses view" ON public.dorm_expenses FOR SELECT
  USING (public.is_dorm_member(space_id));

DROP POLICY IF EXISTS "Dorm expenses manage" ON public.dorm_expenses;
CREATE POLICY "Dorm expenses manage" ON public.dorm_expenses FOR ALL
  USING (public.is_dorm_member(space_id))
  WITH CHECK (public.is_dorm_member(space_id));

-- 5.20 Student Notifications Policies
DROP POLICY IF EXISTS "User manage notifications" ON public.student_notifications;
CREATE POLICY "User manage notifications" ON public.student_notifications FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ==============================================================================
-- 6. Storage Buckets (Requirement R2)
-- Buckets: academic-materials, task-attachments, student-avatars
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('academic-materials', 'academic-materials', true),
  ('task-attachments', 'task-attachments', false),
  ('student-avatars', 'student-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

