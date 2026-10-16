-- ============================================================================
-- 002_dashboard_calendar_sync.sql
-- CampusOS: Đồng bộ Dashboard, Lịch và Phiên học Tập trung lên Supabase Cloud
-- ============================================================================

-- 1. Bảng hồ sơ học tập, gamification và mood
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE DEFAULT 'default_student',
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  rank_title TEXT NOT NULL DEFAULT 'Tân sinh viên ngơ ngác',
  streak INT NOT NULL DEFAULT 12,
  streak_freezes INT NOT NULL DEFAULT 1,
  study_minutes_total INT NOT NULL DEFAULT 0,
  weekly_goal_minutes INT NOT NULL DEFAULT 720,
  weekly_study_minutes INT NOT NULL DEFAULT 510,
  last_study_date TEXT,
  daily_mood TEXT,
  vibe_theme TEXT NOT NULL DEFAULT 'aurora',
  reduced_motion BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Bảng danh sách deadline và bài tập
CREATE TABLE IF NOT EXISTS public.student_deadlines (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_student',
  title TEXT NOT NULL,
  course TEXT,
  due_date TEXT,
  date TEXT,
  display_date TEXT,
  urgent BOOLEAN NOT NULL DEFAULT false,
  completed BOOLEAN NOT NULL DEFAULT false,
  is_exam BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Bảng sự kiện lịch học tập
CREATE TABLE IF NOT EXISTS public.student_calendar_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_student',
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT,
  description TEXT,
  done BOOLEAN NOT NULL DEFAULT false,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Bảng nhật ký phiên học Pomodoro / Focus
CREATE TABLE IF NOT EXISTS public.student_focus_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL DEFAULT 'default_student',
  focus_minutes INT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'extreme_cat',
  discipline_score INT NOT NULL DEFAULT 100,
  shame_count INT NOT NULL DEFAULT 0,
  xp_gained INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Row Level Security (RLS) & Quyền truy cập
-- ============================================================================
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_focus_sessions ENABLE ROW LEVEL SECURITY;

-- Cho phép anon và authenticated đọc và ghi dữ liệu học tập
CREATE POLICY "Cho phép đọc profiles" ON public.student_profiles FOR SELECT USING (true);
CREATE POLICY "Cho phép ghi profiles" ON public.student_profiles FOR ALL USING (true);

CREATE POLICY "Cho phép đọc deadlines" ON public.student_deadlines FOR SELECT USING (true);
CREATE POLICY "Cho phép ghi deadlines" ON public.student_deadlines FOR ALL USING (true);

CREATE POLICY "Cho phép đọc calendar_events" ON public.student_calendar_events FOR SELECT USING (true);
CREATE POLICY "Cho phép ghi calendar_events" ON public.student_calendar_events FOR ALL USING (true);

CREATE POLICY "Cho phép đọc focus_sessions" ON public.student_focus_sessions FOR SELECT USING (true);
CREATE POLICY "Cho phép ghi focus_sessions" ON public.student_focus_sessions FOR ALL USING (true);
