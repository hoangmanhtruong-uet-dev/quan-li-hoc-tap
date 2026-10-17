-- ============================================================================
-- 005_ai_study_hub.sql
-- CampusOS: Phân hệ 2 - AI Study Hub & Trợ lý Phân tích Slide Bài Giảng PDF
-- Lưu trữ bài trắc nghiệm tự động (Quizzes), Flashcards 3D (SM-2), và Tóm tắt bài giảng
-- ============================================================================

-- 1. Bảng tóm tắt bài giảng 5 phút (Cached Syllabus Summaries)
CREATE TABLE IF NOT EXISTS public.ai_syllabus_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  source_file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  summary_markdown TEXT NOT NULL,
  key_formulas JSONB NOT NULL DEFAULT '[]'::jsonb,
  core_concepts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, chapter_id, source_file_url)
);

-- 2. Bảng bài tập trắc nghiệm tự động sinh từ PDF (AI Generated Quizzes)
CREATE TABLE IF NOT EXISTS public.ai_generated_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  title TEXT NOT NULL,
  source_file_url TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{question, options, correct_index, explanation, hint, xp_reward, slide_page_ref}]
  total_questions INT NOT NULL DEFAULT 0,
  max_xp_reward INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Bảng Flashcards môn học kèm thuật toán lặp lại ngắt quãng (SM-2 Spaced Repetition)
CREATE TABLE IF NOT EXISTS public.course_flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  front_term TEXT NOT NULL,
  back_definition TEXT NOT NULL,
  category TEXT DEFAULT 'Thuật ngữ cốt lõi',
  example TEXT,
  difficulty INT NOT NULL DEFAULT 1, -- 1: Easy, 2: Medium, 3: Hard
  interval_days INT NOT NULL DEFAULT 1,
  repetitions INT NOT NULL DEFAULT 0,
  ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50,
  last_quality INT NOT NULL DEFAULT 0, -- 0-5 grade in SM-2
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Bảng nhật ký hỏi đáp trực tiếp trên Slide (PDF Q&A Messages)
CREATE TABLE IF NOT EXISTS public.pdf_qa_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  source_file_url TEXT NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'user' | 'assistant'
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb, -- [{page: 3, text_snippet: '...'}]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. Chỉ mục Tối ưu hóa Truy vấn
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_ai_syllabus_summaries_lookup
  ON public.ai_syllabus_summaries (user_id, course_id, chapter_id);

CREATE INDEX IF NOT EXISTS idx_ai_generated_quizzes_lookup
  ON public.ai_generated_quizzes (user_id, course_id, chapter_id);

CREATE INDEX IF NOT EXISTS idx_course_flashcards_review
  ON public.course_flashcards (user_id, course_id, next_review_at);

CREATE INDEX IF NOT EXISTS idx_pdf_qa_messages_history
  ON public.pdf_qa_messages (user_id, chapter_id, created_at);

-- ============================================================================
-- 6. Row Level Security (RLS) Policies
-- ============================================================================
ALTER TABLE public.ai_syllabus_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generated_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_qa_messages ENABLE ROW LEVEL SECURITY;

-- 6.1 ai_syllabus_summaries RLS
DROP POLICY IF EXISTS "Users can read own syllabus summaries" ON public.ai_syllabus_summaries;
CREATE POLICY "Users can read own syllabus summaries" ON public.ai_syllabus_summaries
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own syllabus summaries" ON public.ai_syllabus_summaries;
CREATE POLICY "Users can insert own syllabus summaries" ON public.ai_syllabus_summaries
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own syllabus summaries" ON public.ai_syllabus_summaries;
CREATE POLICY "Users can update own syllabus summaries" ON public.ai_syllabus_summaries
  FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own syllabus summaries" ON public.ai_syllabus_summaries;
CREATE POLICY "Users can delete own syllabus summaries" ON public.ai_syllabus_summaries
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- 6.2 ai_generated_quizzes RLS
DROP POLICY IF EXISTS "Users can read own quizzes" ON public.ai_generated_quizzes;
CREATE POLICY "Users can read own quizzes" ON public.ai_generated_quizzes
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own quizzes" ON public.ai_generated_quizzes;
CREATE POLICY "Users can insert own quizzes" ON public.ai_generated_quizzes
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own quizzes" ON public.ai_generated_quizzes;
CREATE POLICY "Users can delete own quizzes" ON public.ai_generated_quizzes
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- 6.3 course_flashcards RLS
DROP POLICY IF EXISTS "Users can read own flashcards" ON public.course_flashcards;
CREATE POLICY "Users can read own flashcards" ON public.course_flashcards
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own flashcards" ON public.course_flashcards;
CREATE POLICY "Users can insert own flashcards" ON public.course_flashcards
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own flashcards" ON public.course_flashcards;
CREATE POLICY "Users can update own flashcards" ON public.course_flashcards
  FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own flashcards" ON public.course_flashcards;
CREATE POLICY "Users can delete own flashcards" ON public.course_flashcards
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- 6.4 pdf_qa_messages RLS
DROP POLICY IF EXISTS "Users can read own pdf qa messages" ON public.pdf_qa_messages;
CREATE POLICY "Users can read own pdf qa messages" ON public.pdf_qa_messages
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own pdf qa messages" ON public.pdf_qa_messages;
CREATE POLICY "Users can insert own pdf qa messages" ON public.pdf_qa_messages
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own pdf qa messages" ON public.pdf_qa_messages;
CREATE POLICY "Users can delete own pdf qa messages" ON public.pdf_qa_messages
  FOR DELETE USING (user_id = (SELECT auth.uid()));
