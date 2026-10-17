import { NextRequest, NextResponse } from 'next/server.js';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabase.ts';

export const dynamic = 'force-dynamic';

interface ViolationRequestBody {
  domain?: string;
  reason?: string;
  penaltyXp?: number;
  userId?: string;
}

export async function POST(req: NextRequest) {
  try {
    let body: ViolationRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    const { domain, reason = 'blacklist_url', penaltyXp = 50, userId = 'default_student' } = body;

    if (!domain && !reason) {
      return NextResponse.json(
        { error: 'Either domain or reason must be specified' },
        { status: 400 }
      );
    }

    const safePenalty = typeof penaltyXp === 'number' && !isNaN(penaltyXp) ? Math.max(0, penaltyXp) : 50;
    const nowIso = new Date().toISOString();

    const violationData = {
      user_id: userId,
      focus_minutes: 0,
      mode: 'extreme_cat',
      discipline_score: Math.max(0, 100 - safePenalty),
      shame_count: 1,
      violation_count: 1,
      xp_gained: -safePenalty,
      completed_at: nowIso,
    };

    if (isSupabaseConfigured()) {
      try {
        const { error: insertErr } = await supabase
          .from('student_focus_sessions')
          .insert(violationData);

        if (insertErr) {
          console.warn('[API /api/focus/violation] Supabase insert warning:', insertErr.message);
        }

        // Increment violation_count in student_profiles
        try {
          const { data: profile } = await supabase
            .from('student_profiles')
            .select('violation_count, xp')
            .eq('user_id', userId)
            .maybeSingle();

          if (profile) {
            const nextXp = Math.max(0, (profile.xp || 0) - safePenalty);
            const nextCount = (profile.violation_count || 0) + 1;
            await supabase
              .from('student_profiles')
              .update({
                violation_count: nextCount,
                xp: nextXp,
                updated_at: nowIso,
              })
              .eq('user_id', userId);
          }
        } catch {}

        return NextResponse.json({
          success: true,
          mode: 'supabase_cloud',
          recorded: {
            domain: domain || 'unknown',
            reason,
            penaltyXp: safePenalty,
            timestamp: Date.now(),
          },
        });
      } catch (err: any) {
        console.warn('[API /api/focus/violation] Supabase query failed, falling back to mock confirmation:', err?.message);
      }
    }

    // In dev / unconfigured mode or when offline: return mock confirmation
    return NextResponse.json({
      success: true,
      mode: 'mock_confirmation',
      recorded: {
        domain: domain || 'unknown',
        reason,
        penaltyXp: safePenalty,
        timestamp: Date.now(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/focus/violation',
    methods: ['POST'],
    description: 'Chrome Extension Pomodoro Discipline Violation Logging API',
  });
}
