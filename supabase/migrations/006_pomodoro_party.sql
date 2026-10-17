-- ==============================================================================
-- 006_pomodoro_party.sql
-- CampusOS: Phân hệ 3 - Đấu Trường Học Nhóm Realtime (Pomodoro Party)
-- Quản lý phòng học nhóm, đồng bộ đồng hồ đa người chơi, kỷ luật Silent Focus,
-- hiệu ứng hạt reaction thời gian thực, và Row Level Security (RLS)
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Table Definitions
-- ==============================================================================

-- 2.1 Bảng Study Rooms (Phòng học nhóm trực tuyến)
CREATE TABLE IF NOT EXISTS public.study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(16) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'Học tự do',
  host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  room_type TEXT NOT NULL DEFAULT 'public' CHECK (room_type IN ('public', 'private_pin', 'workspace')),
  pin_code VARCHAR(6),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  focus_duration_minutes INTEGER NOT NULL DEFAULT 45 CHECK (focus_duration_minutes BETWEEN 5 AND 180),
  break_duration_minutes INTEGER NOT NULL DEFAULT 5 CHECK (break_duration_minutes BETWEEN 1 AND 60),
  current_status TEXT NOT NULL DEFAULT 'waiting' CHECK (current_status IN ('waiting', 'focusing', 'break')),
  start_time_iso TIMESTAMPTZ,
  end_time_iso TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_participants INTEGER NOT NULL DEFAULT 24 CHECK (max_participants BETWEEN 2 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Bảng Study Room Members (Thành viên đang tham gia phòng học)
CREATE TABLE IF NOT EXISTS public.study_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'focusing' CHECK (status IN ('focusing', 'distracted', 'break')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_minutes_contributed INTEGER NOT NULL DEFAULT 0 CHECK (total_minutes_contributed >= 0),
  camera_on BOOLEAN NOT NULL DEFAULT false,
  last_ping_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_study_room_member UNIQUE (room_id, user_id)
);

-- 2.3 Bảng Room Reactions (Kênh broadcast hiệu ứng hạt reaction bay)
CREATE TABLE IF NOT EXISTS public.room_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Set Replica Identity for Realtime tracking of full record mutations
ALTER TABLE public.study_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.study_room_members REPLICA IDENTITY FULL;
ALTER TABLE public.room_reactions REPLICA IDENTITY FULL;

-- ==============================================================================
-- 3. Foreign Key & Query Performance Indexes (Supabase Postgres Best Practices)
-- ==============================================================================

-- 3.1 Indexes on study_rooms
CREATE INDEX IF NOT EXISTS idx_study_rooms_code ON public.study_rooms(code);
CREATE INDEX IF NOT EXISTS idx_study_rooms_host_id ON public.study_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_study_rooms_workspace_id ON public.study_rooms(workspace_id);
CREATE INDEX IF NOT EXISTS idx_study_rooms_type_active ON public.study_rooms(room_type, is_active);
CREATE INDEX IF NOT EXISTS idx_study_rooms_status ON public.study_rooms(current_status);
CREATE INDEX IF NOT EXISTS idx_study_rooms_created_at ON public.study_rooms(created_at DESC);

-- 3.2 Indexes on study_room_members
CREATE INDEX IF NOT EXISTS idx_study_room_members_room ON public.study_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_study_room_members_user ON public.study_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_study_room_members_room_user ON public.study_room_members(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_study_room_members_status ON public.study_room_members(room_id, status);
CREATE INDEX IF NOT EXISTS idx_study_room_members_last_ping ON public.study_room_members(last_ping_at);

-- 3.3 Indexes on room_reactions
CREATE INDEX IF NOT EXISTS idx_room_reactions_room ON public.room_reactions(room_id);
CREATE INDEX IF NOT EXISTS idx_room_reactions_user ON public.room_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_room_reactions_created_at ON public.room_reactions(room_id, created_at DESC);

-- ==============================================================================
-- 4. Helper Functions (SECURITY DEFINER with empty search_path)
-- Prevents infinite RLS recursion & ensures fast InitPlan execution
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_study_room_member(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.study_room_members
    WHERE room_id = p_room_id AND user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_study_room_host(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.study_rooms
    WHERE id = p_room_id AND host_id = (SELECT auth.uid())
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_study_room_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_study_room_member(UUID) TO authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.is_study_room_host(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_study_room_host(UUID) TO authenticated, anon;

-- ==============================================================================
-- 5. Row Level Security (RLS) Policies
-- All queries wrap (SELECT auth.uid()) to leverage cached InitPlan execution
-- ==============================================================================

ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_reactions ENABLE ROW LEVEL SECURITY;

-- 5.1 study_rooms Policies
DROP POLICY IF EXISTS "Study rooms viewable by all active" ON public.study_rooms;
CREATE POLICY "Study rooms viewable by all active" ON public.study_rooms FOR SELECT
  USING (
    is_active = true
    OR host_id = (SELECT auth.uid())
    OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id))
  );

DROP POLICY IF EXISTS "Study rooms insert authenticated" ON public.study_rooms;
CREATE POLICY "Study rooms insert authenticated" ON public.study_rooms FOR INSERT
  WITH CHECK (
    host_id = (SELECT auth.uid())
    OR (SELECT auth.uid()) IS NOT NULL
  );

DROP POLICY IF EXISTS "Study rooms update by host" ON public.study_rooms;
CREATE POLICY "Study rooms update by host" ON public.study_rooms FOR UPDATE
  USING (
    host_id = (SELECT auth.uid())
    OR (workspace_id IS NOT NULL AND public.is_workspace_admin(workspace_id))
  )
  WITH CHECK (
    host_id = (SELECT auth.uid())
    OR (workspace_id IS NOT NULL AND public.is_workspace_admin(workspace_id))
  );

DROP POLICY IF EXISTS "Study rooms delete by host" ON public.study_rooms;
CREATE POLICY "Study rooms delete by host" ON public.study_rooms FOR DELETE
  USING (
    host_id = (SELECT auth.uid())
    OR (workspace_id IS NOT NULL AND public.is_workspace_admin(workspace_id))
  );

-- 5.2 study_room_members Policies
DROP POLICY IF EXISTS "Room members viewable by participants" ON public.study_room_members;
CREATE POLICY "Room members viewable by participants" ON public.study_room_members FOR SELECT
  USING (
    public.is_study_room_member(room_id)
    OR EXISTS (
      SELECT 1 FROM public.study_rooms
      WHERE study_rooms.id = study_room_members.room_id AND study_rooms.is_active = true
    )
  );

DROP POLICY IF EXISTS "Room members self insert" ON public.study_room_members;
CREATE POLICY "Room members self insert" ON public.study_room_members FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "Room members self or host update" ON public.study_room_members;
CREATE POLICY "Room members self or host update" ON public.study_room_members FOR UPDATE
  USING (
    user_id = (SELECT auth.uid())
    OR public.is_study_room_host(room_id)
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR public.is_study_room_host(room_id)
  );

DROP POLICY IF EXISTS "Room members self or host delete" ON public.study_room_members;
CREATE POLICY "Room members self or host delete" ON public.study_room_members FOR DELETE
  USING (
    user_id = (SELECT auth.uid())
    OR public.is_study_room_host(room_id)
  );

-- 5.3 room_reactions Policies
DROP POLICY IF EXISTS "Reactions viewable by room members" ON public.room_reactions;
CREATE POLICY "Reactions viewable by room members" ON public.room_reactions FOR SELECT
  USING (
    public.is_study_room_member(room_id)
    OR EXISTS (
      SELECT 1 FROM public.study_rooms
      WHERE study_rooms.id = room_reactions.room_id AND study_rooms.is_active = true
    )
  );

DROP POLICY IF EXISTS "Reactions insert by self" ON public.room_reactions;
CREATE POLICY "Reactions insert by self" ON public.room_reactions FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_study_room_member(room_id)
  );

-- ==============================================================================
-- 6. Supabase Realtime Publication
-- Enables live WebSocket broadcasts on Postgres row mutations
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.study_rooms;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_members;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_reactions;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
