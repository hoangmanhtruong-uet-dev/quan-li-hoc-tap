import { NextRequest, NextResponse } from 'next/server';
import { generateCoachResponse, type StudentContext } from '@/lib/coach-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = String(body.prompt || '').trim();
    const contextSubject = String(body.contextSubject || 'Mạng máy tính');
    const attachedFileName = body.attachedFileName ? String(body.attachedFileName) : undefined;
    const studentContext: StudentContext = body.studentContext || {
      name: 'Minh',
      level: 1,
      rankTitle: 'Tân sinh viên ngơ ngác',
      xp: 0,
      streak: 1,
      deadlinesCount: 0,
      urgentDeadlines: [],
      incompleteTasks: [],
      energy: 'okay',
      dailyMood: null,
    };

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Check if Gemini API key exists
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (geminiKey) {
      try {
        const systemInstruction = `Bạn là "CampusOS Coach" - trợ lý học tập AI siêu thông minh, đồng hành cùng sinh viên Gen Z.
Ngữ cảnh sinh viên: Tên ${studentContext.name}, Cấp ${studentContext.level} (${studentContext.rankTitle}), Chuỗi học ${studentContext.streak} ngày, Mức năng lượng: ${studentContext.energy}.
Môn học trọng tâm: ${contextSubject}.
Nhiệm vụ: Giải thích súc tích, trực quan, dễ nhớ (dùng markdown, công thức toán LaTeX nếu cần, ví dụ sinh viên gần gũi).
Nếu người dùng hỏi về kế hoạch hoặc bài tập gấp, hãy nhắc nhở các deadline của họ.
Hãy dùng tiếng Việt trẻ trung, tích cực, truyền cảm hứng.`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const aiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\nCâu hỏi sinh viên: ${prompt}` }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            },
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const candidateText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            // Also check if user asked for quiz or plan to attach structured objects
            const localResult = generateCoachResponse(prompt, contextSubject, studentContext, attachedFileName);
            return NextResponse.json({
              markdown: candidateText,
              quiz: localResult.quiz,
              plan: localResult.plan,
              suggestedAction: localResult.suggestedAction,
              source: 'gemini',
            });
          }
        }
      } catch (geminiError) {
        console.warn('[CoachAPI] Gemini call failed, falling back to local engine:', geminiError);
      }
    }

    // High quality local fallback response from knowledge engine
    const result = generateCoachResponse(prompt, contextSubject, studentContext, attachedFileName);
    return NextResponse.json({
      ...result,
      source: 'local-knowledge-engine',
    });
  } catch (error) {
    console.error('[CoachAPI] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing coach response' },
      { status: 500 }
    );
  }
}
