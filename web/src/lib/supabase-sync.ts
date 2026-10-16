/**
 * CampusOS Supabase Cloud Synchronization Service (Offline-First)
 * Background non-blocking sync for Student Profiles, Deadlines, Calendar Events, and Focus Sessions.
 */

import { supabase } from './supabase.ts';
import type { CampusOSSharedState, CalendarEvent, DeadlineItem } from './campus-store.ts';

const DEFAULT_USER_ID = 'default_student';

export async function pullFromSupabaseCloud(): Promise<Partial<CampusOSSharedState> | null> {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Fetch Profile
    const { data: profile, error: profileErr } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID)
      .maybeSingle();

    if (profileErr && profileErr.code !== 'PGRST116') {
      console.warn('[Supabase Sync] Profile query notice:', profileErr.message);
      return null;
    }

    // 2. Fetch Deadlines
    const { data: deadlinesData } = await supabase
      .from('student_deadlines')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID);

    // 3. Fetch Calendar Events
    const { data: eventsData } = await supabase
      .from('student_calendar_events')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID);

    if (!profile && (!deadlinesData || deadlinesData.length === 0) && (!eventsData || eventsData.length === 0)) {
      return null;
    }

    const partialState: Partial<CampusOSSharedState> = {};

    if (profile) {
      partialState.xp = profile.xp;
      partialState.level = profile.level;
      partialState.rankTitle = profile.rank_title;
      partialState.streak = profile.streak;
      partialState.streakFreezes = profile.streak_freezes;
      partialState.studyMinutesTotal = profile.study_minutes_total;
      partialState.weeklyStudyGoalMinutes = profile.weekly_goal_minutes;
      partialState.weeklyStudyMinutesCurrent = profile.weekly_study_minutes;
      partialState.lastStudyDate = profile.last_study_date || '';
      partialState.dailyMood = profile.daily_mood || null;
      partialState.vibeTheme = profile.vibe_theme || 'aurora';
      partialState.reducedMotion = profile.reduced_motion || false;
    }

    if (deadlinesData && deadlinesData.length > 0) {
      partialState.deadlines = deadlinesData.map((d) => ({
        id: d.id,
        title: d.title,
        course: d.course || undefined,
        dueDate: d.due_date || undefined,
        date: d.date || undefined,
        displayDate: d.display_date || undefined,
        urgent: d.urgent,
        completed: d.completed,
        isExam: d.is_exam,
      }));
    }

    if (eventsData && eventsData.length > 0) {
      partialState.events = eventsData.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        start: e.start_time,
        end: e.end_time,
        type: e.type,
        location: e.location || undefined,
        description: e.description || undefined,
        done: e.done,
        checklist: e.checklist || [],
      }));
    }

    return partialState;
  } catch (err) {
    console.warn('[Supabase Sync] Pull skipped (offline or table not yet created):', err);
    return null;
  }
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export function pushToSupabaseCloudDebounced(state: CampusOSSharedState, delayMs = 2000): void {
  if (typeof window === 'undefined') return;

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(async () => {
    try {
      // 1. Upsert Profile
      await supabase.from('student_profiles').upsert(
        {
          user_id: DEFAULT_USER_ID,
          xp: state.xp,
          level: state.level,
          rank_title: state.rankTitle,
          streak: state.streak,
          streak_freezes: state.streakFreezes,
          study_minutes_total: state.studyMinutesTotal,
          weekly_goal_minutes: state.weeklyStudyGoalMinutes,
          weekly_study_minutes: state.weeklyStudyMinutesCurrent,
          last_study_date: state.lastStudyDate,
          daily_mood: state.dailyMood,
          vibe_theme: state.vibeTheme,
          reduced_motion: state.reducedMotion,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      // 2. Upsert Deadlines
      if (state.deadlines.length > 0) {
        const payload = state.deadlines.map((d) => ({
          id: d.id,
          user_id: DEFAULT_USER_ID,
          title: d.title,
          course: d.course || null,
          due_date: d.dueDate || null,
          date: d.date || null,
          display_date: d.displayDate || null,
          urgent: d.urgent ?? false,
          completed: d.completed ?? false,
          is_exam: d.isExam ?? false,
          updated_at: new Date().toISOString(),
        }));
        await supabase.from('student_deadlines').upsert(payload, { onConflict: 'id' });
      }

      // 3. Upsert Calendar Events
      if (state.events.length > 0) {
        const payload = state.events.map((e) => ({
          id: e.id,
          user_id: DEFAULT_USER_ID,
          title: e.title,
          date: e.date,
          start_time: e.start,
          end_time: e.end,
          type: e.type,
          location: e.location || null,
          description: e.description || null,
          done: e.done ?? false,
          checklist: e.checklist || [],
          updated_at: new Date().toISOString(),
        }));
        await supabase.from('student_calendar_events').upsert(payload, { onConflict: 'id' });
      }
    } catch (err) {
      // Silently catch network or schema missing errors
      console.warn('[Supabase Sync] Push skipped (offline or table not yet created):', err);
    }
  }, delayMs);
}

export async function logFocusSessionToSupabase(session: {
  focusMinutes: number;
  mode: string;
  disciplineScore: number;
  shameCount: number;
  xpGained: number;
}): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    await supabase.from('student_focus_sessions').insert({
      user_id: DEFAULT_USER_ID,
      focus_minutes: session.focusMinutes,
      mode: session.mode,
      discipline_score: session.disciplineScore,
      shame_count: session.shameCount,
      xp_gained: session.xpGained,
      completed_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase Sync] Log focus session skipped:', err);
  }
}
