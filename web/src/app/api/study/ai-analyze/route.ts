import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/authorization';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { generateAiStudyArtifacts } from '@/lib/ai-study-engine';

export const dynamic = 'force-dynamic';

interface AnalyzeRequestBody {
  courseId: string;
  courseName: string;
  chapterId: string;
  chapterTitle: string;
  pdfUrl?: string;
  customApiKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    let body: AnalyzeRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { courseId, courseName, chapterId, chapterTitle, pdfUrl, customApiKey } = body;

    if (!courseId || !chapterId || !chapterTitle) {
      return NextResponse.json(
        { error: 'courseId, chapterId, and chapterTitle are required' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser().catch(() => null);
    const userId = user?.id || 'default_student';

    // Generate artifacts (Summary, Quizzes, Flashcards)
    const artifacts = await generateAiStudyArtifacts({
      courseName: courseName || 'Môn học đại học',
      chapterTitle,
      pdfUrl,
      customApiKey,
    });

    // If Supabase is configured, persist to database tables
    if (isSupabaseConfigured()) {
      try {
        // 1. Save or update summary
        await supabase
          .from('ai_syllabus_summaries')
          .upsert(
            {
              course_id: courseId,
              chapter_id: chapterId,
              user_id: userId,
              title: artifacts.summary.title,
              reading_time_minutes: artifacts.summary.readingTimeMinutes,
              key_takeaways: artifacts.summary.keyTakeaways,
              core_concepts: artifacts.summary.coreConcepts,
              common_pitfalls: artifacts.summary.commonPitfalls,
              pdf_source_url: pdfUrl || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'course_id,chapter_id,user_id' }
          );

        // 2. Save quizzes
        if (artifacts.quizzes.length > 0) {
          await supabase.from('ai_generated_quizzes').insert({
            course_id: courseId,
            chapter_id: chapterId,
            user_id: userId,
            quiz_title: `Đề ôn tập: ${chapterTitle}`,
            questions: artifacts.quizzes,
            total_questions: artifacts.quizzes.length,
          });
        }

        // 3. Save flashcards (batch insert)
        if (artifacts.flashcards.length > 0) {
          const flashcardRows = artifacts.flashcards.map((fc) => ({
            course_id: courseId,
            chapter_id: chapterId,
            user_id: userId,
            front_text: fc.front,
            back_text: fc.back,
            category: fc.category,
            difficulty: fc.difficulty,
            repetitions: fc.repetitions,
            interval_days: fc.intervalDays,
            ease_factor: fc.easeFactor,
            next_review_at: fc.nextReviewAt,
          }));

          await supabase.from('course_flashcards').insert(flashcardRows);
        }
      } catch (dbErr) {
        console.warn('[API /api/study/ai-analyze] Supabase persistence note:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      courseId,
      chapterId,
      artifacts,
    });
  } catch (error: any) {
    console.error('[API /api/study/ai-analyze] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error while analyzing syllabus' },
      { status: 500 }
    );
  }
}
