-- ============================================================================
-- 004_extension_focus_violations.sql
-- CampusOS: Chrome Extension AI Giám Sát Học Tập Cực Đoan
-- Cập nhật violation_count và theo dõi vi phạm tập trung
-- ============================================================================

-- 1. Bổ sung cột violation_count cho public.profiles (Hồ sơ chính của sinh viên)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS violation_count INTEGER NOT NULL DEFAULT 0;

-- 2. Bổ sung cột violation_count cho public.student_profiles (Bảng tương thích sync engine)
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS violation_count INTEGER NOT NULL DEFAULT 0;

-- 3. Bổ sung cột violation_count cho public.student_focus_sessions (Nhật ký phiên tập trung)
ALTER TABLE public.student_focus_sessions ADD COLUMN IF NOT EXISTS violation_count INTEGER NOT NULL DEFAULT 0;

-- 4. Tạo chỉ mục để truy vấn thống kê vi phạm nhanh hơn
CREATE INDEX IF NOT EXISTS idx_student_focus_sessions_violations
  ON public.student_focus_sessions (user_id, violation_count);

CREATE INDEX IF NOT EXISTS idx_profiles_violation_count
  ON public.profiles (violation_count);

-- 5. Chú thích tài liệu cho các cột mới
COMMENT ON COLUMN public.profiles.violation_count IS 'Tổng số lần vi phạm kỷ luật học tập do Chrome Extension ghi nhận';
COMMENT ON COLUMN public.student_profiles.violation_count IS 'Tổng số lần vi phạm kỷ luật học tập (Sync Engine compatibility)';
COMMENT ON COLUMN public.student_focus_sessions.violation_count IS 'Số lần vi phạm kỷ luật phát sinh trong phiên tập trung cụ thể';
