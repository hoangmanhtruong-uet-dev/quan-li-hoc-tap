import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/authorization';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { chatWithPdfDocument, type ChatMessage } from '@/lib/ai-study-engine';

export const dynamic = 'force-dynamic';

interface ChatRequestBody {
  courseId: string;
  courseName: string;
  chapterId: string;
  chapterTitle: string;
  query: string;
  chatHistory?: ChatMessage[];
  customApiKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    let body: ChatRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { courseId, courseName, chapterId, chapterTitle, query, chatHistory = [], customApiKey } = body;

    if (!courseId || !chapterId || !query?.trim()) {
      return NextResponse.json(
        { error: 'courseId, chapterId, and query are required' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser().catch(() => null);
    const userId = user?.id || 'default_student';

    // Get response from AI Coach
    const assistantMessage = await chatWithPdfDocument({
      courseName: courseName || 'Môn học đại học',
      chapterTitle: chapterTitle || 'Bài giảng',
      query: query.trim(),
      chatHistory,
      customApiKey,
    });

    // Save Q&A to Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('pdf_qa_messages').insert([
          {
            course_id: courseId,
            chapter_id: chapterId,
            user_id: userId,
            sender_role: 'user',
            content: query.trim(),
          },
          {
            course_id: courseId,
            chapter_id: chapterId,
            user_id: userId,
            sender_role: 'assistant',
            content: assistantMessage.content,
            citation_page: assistantMessage.citation || null,
          },
        ]);
      } catch (dbErr) {
        console.warn('[API /api/study/ai-chat] Supabase save note:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: assistantMessage,
    });
  } catch (error: any) {
    console.error('[API /api/study/ai-chat] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error while processing chat message' },
      { status: 500 }
    );
  }
}
