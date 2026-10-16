/**
 * CampusOS Supabase Cloud Synchronization Engine (R3 - Offline-First)
 * Provides 0ms local caching, bidirectional TaskItem <-> tasks sync,
 * persistent offline mutation queue with auto-flush on reconnect,
 * Realtime WebSockets with echo loop protection, and safe unconfigured fallback.
 */

import { supabase, isSupabaseConfigured } from './supabase.ts';
import type { CampusOSSharedState, CalendarEvent, DeadlineItem } from './campus-store.ts';
import type { TaskItem, TaskStatus, TaskPriority, EisenhowerQuadrant } from '../types/tasks.ts';

export const DEFAULT_USER_ID = 'default_student';
export const OFFLINE_QUEUE_KEY = 'campusos_sync_queue_v1';

export interface SyncMutation {
  id: string;
  entity: string;
  action: 'UPSERT' | 'DELETE' | 'INSERT' | string;
  payload: any;
  timestamp: number;
  retries?: number;
}

export interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_minutes: number;
  estimate_min: number;
  course: string | null;
  course_id: string | null;
  eisenhower_quadrant: string;
  quadrant: string;
  subtasks: any[];
  attachments: any[];
  activity_log: any[];
  difficulty: number;
  actual_min: number;
  pomodoro_planned: number;
  pomodoro_done: number;
  tags: string[];
  order_index: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/* ==========================================================================
   1. Tasks 2-Way Sync Mapping (TaskItem <-> public.tasks schema)
   ========================================================================== */

/**
 * Maps a TaskItem (or partial task object) to the PostgreSQL `public.tasks` table schema.
 */
export function taskToRow(task: Partial<TaskItem> & Record<string, any>): TaskRow {
  const taskId = task.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `task-${Date.now()}`);
  const nowIso = new Date().toISOString();

  // Normalize quadrant
  const rawQuad = task.quadrant || task.eisenhower_quadrant || 'schedule';
  let normQuadrant: string = 'schedule';
  if (['do_first', 'schedule', 'delegate', 'eliminate'].includes(rawQuad)) {
    normQuadrant = rawQuad;
  } else if (rawQuad === 'Q1') normQuadrant = 'do_first';
  else if (rawQuad === 'Q2') normQuadrant = 'schedule';
  else if (rawQuad === 'Q3') normQuadrant = 'delegate';
  else if (rawQuad === 'Q4') normQuadrant = 'eliminate';

  const eisenhowerQuad = task.eisenhower_quadrant || task.quadrant || normQuadrant;

  // Normalize due date
  const dueDate = task.due_date ?? task.dueDate ?? task.dueAt ?? null;

  // Normalize estimate minutes
  const estMin = task.estimated_minutes ?? task.estimatedMinutes ?? task.estimateMin ?? 30;

  // Normalize subtasks / steps
  const subtasks = Array.isArray(task.subtasks)
    ? task.subtasks
    : Array.isArray(task.steps)
    ? task.steps
    : [];

  return {
    id: taskId,
    user_id: task.user_id || DEFAULT_USER_ID,
    title: task.title || '',
    description: task.description ?? null,
    status: task.status || 'todo',
    priority: task.priority || 'medium',
    due_date: dueDate,
    estimated_minutes: estMin,
    estimate_min: estMin,
    course: task.course ?? task.course_id ?? null,
    course_id: task.course_id ?? task.course ?? null,
    eisenhower_quadrant: eisenhowerQuad,
    quadrant: normQuadrant,
    subtasks: subtasks,
    attachments: Array.isArray(task.attachments) ? task.attachments : [],
    activity_log: Array.isArray(task.activity_log) ? task.activity_log : (Array.isArray(task.activityLog) ? task.activityLog : []),
    difficulty: typeof task.difficulty === 'number' ? task.difficulty : 1,
    actual_min: task.actual_min ?? task.actualMin ?? 0,
    pomodoro_planned: task.pomodoro_planned ?? task.pomodoros?.planned ?? 1,
    pomodoro_done: task.pomodoro_done ?? task.pomodoros?.done ?? 0,
    tags: Array.isArray(task.tags) ? task.tags : [],
    order_index: task.order_index ?? task.order ?? 0,
    completed_at: task.completed_at ?? task.completedAt ?? null,
    created_at: task.created_at ?? task.createdAt ?? nowIso,
    updated_at: task.updated_at ?? task.updatedAt ?? nowIso,
  };
}

/**
 * Maps a PostgreSQL `public.tasks` row back to a TypeScript TaskItem.
 */
export function rowToTask(row: any): TaskItem & {
  dueDate?: string;
  estimatedMinutes?: number;
  course_id?: string;
  eisenhower_quadrant?: string;
  subtasks?: any[];
  updatedAt?: string;
} {
  const steps = Array.isArray(row.subtasks)
    ? row.subtasks
    : Array.isArray(row.steps)
    ? row.steps
    : [];

  const dueDate = row.due_date ?? row.dueAt ?? '';
  const estMin = row.estimated_minutes ?? row.estimate_min ?? 30;
  const course = row.course_id ?? row.course ?? '';
  const quadrant = (row.quadrant ?? row.eisenhower_quadrant ?? 'schedule') as EisenhowerQuadrant;

  return {
    id: String(row.id),
    title: row.title || '',
    description: row.description || '',
    status: (row.status as TaskStatus) || 'todo',
    priority: (row.priority as TaskPriority) || 'medium',
    dueAt: dueDate,
    dueDate: dueDate || undefined,
    estimateMin: estMin,
    estimatedMinutes: estMin,
    course: course,
    course_id: course || undefined,
    quadrant: quadrant,
    eisenhower_quadrant: row.eisenhower_quadrant ?? quadrant,
    steps: steps,
    subtasks: steps,
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    activityLog: Array.isArray(row.activity_log) ? row.activity_log : [],
    difficulty: typeof row.difficulty === 'number' ? row.difficulty : 1,
    actualMin: row.actual_min ?? 0,
    tags: Array.isArray(row.tags) ? row.tags : [],
    order: row.order_index ?? row.order ?? 0,
    pomodoros: {
      planned: row.pomodoro_planned ?? 1,
      done: row.pomodoro_done ?? 0,
    },
    createdAt: row.created_at || new Date().toISOString(),
    completedAt: row.completed_at || undefined,
    updatedAt: row.updated_at || undefined,
  };
}

/* ==========================================================================
   2. Persistent Offline Mutation Queue
   ========================================================================== */

let memoryQueueFallback: SyncMutation[] = [];

function getSafeStorage(): { getItem(k: string): string | null; setItem(k: string, v: string): void } | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Ignore security errors in restricted iframes
  }
  return null;
}

/**
 * Safely retrieves the offline mutation queue from localStorage or in-memory fallback.
 */
export function getOfflineQueue(): SyncMutation[] {
  const storage = getSafeStorage();
  if (storage) {
    try {
      const raw = storage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return memoryQueueFallback;
}

/**
 * Persists the offline mutation queue to localStorage and in-memory fallback.
 */
export function saveOfflineQueue(queue: SyncMutation[]): void {
  memoryQueueFallback = [...queue];
  const storage = getSafeStorage();
  if (storage) {
    try {
      storage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.warn('[CampusOS Sync] Failed to persist offline queue:', err);
    }
  }
}

/**
 * Returns current size of the offline mutation queue.
 */
export function getOfflineQueueSize(): number {
  return getOfflineQueue().length;
}

/**
 * Clears all mutations from the offline queue.
 */
export function clearOfflineQueue(): void {
  saveOfflineQueue([]);
}

/**
 * Enqueues a mutation into the persistent offline queue.
 */
export function enqueueOfflineMutation(mutation: {
  id?: string;
  entity: string;
  action: 'UPSERT' | 'DELETE' | 'INSERT' | string;
  payload: any;
  timestamp?: number;
}): SyncMutation {
  const item: SyncMutation = {
    id:
      mutation.id ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `mut-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    entity: mutation.entity,
    action: mutation.action,
    payload: mutation.payload,
    timestamp: mutation.timestamp || Date.now(),
    retries: 0,
  };

  const queue = getOfflineQueue();
  queue.push(item);
  saveOfflineQueue(queue);
  return item;
}

/**
 * Flushes queued offline mutations when online.
 * Accepts an optional custom executor function for tests or custom retry strategies.
 */
export async function flushOfflineQueue(
  executor?: (mutation: SyncMutation) => Promise<boolean>
): Promise<{ flushedCount: number; success: boolean }> {
  // If the browser reports offline, cannot flush to cloud
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { flushedCount: 0, success: false };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { flushedCount: 0, success: true };
  }

  let flushedCount = 0;
  const remainingQueue: SyncMutation[] = [];

  for (const mutation of queue) {
    let success = false;
    try {
      if (executor) {
        success = await executor(mutation);
      } else if (isSupabaseConfigured()) {
        if (mutation.entity === 'tasks') {
          if (mutation.action === 'DELETE') {
            const { error } = await supabase
              .from('tasks')
              .delete()
              .eq('id', mutation.payload?.id);
            success = !error;
          } else {
            const { error } = await supabase
              .from('tasks')
              .upsert(mutation.payload, { onConflict: 'id' });
            success = !error;
          }
        } else if (mutation.entity === 'deadlines' || mutation.entity === 'student_deadlines') {
          const { error } = await supabase
            .from('student_deadlines')
            .upsert(mutation.payload, { onConflict: 'id' });
          success = !error;
        } else if (mutation.entity === 'events' || mutation.entity === 'student_calendar_events') {
          const { error } = await supabase
            .from('student_calendar_events')
            .upsert(mutation.payload, { onConflict: 'id' });
          success = !error;
        } else if (mutation.entity === 'profiles' || mutation.entity === 'student_profiles') {
          const { error } = await supabase
            .from('student_profiles')
            .upsert(mutation.payload, { onConflict: 'user_id' });
          success = !error;
        } else {
          const { error } = await supabase.from(mutation.entity).upsert(mutation.payload);
          success = !error;
        }
      } else {
        // Supabase is unconfigured and no executor passed
        success = false;
      }
    } catch {
      success = false;
    }

    if (success) {
      flushedCount++;
    } else {
      mutation.retries = (mutation.retries || 0) + 1;
      remainingQueue.push(mutation);
    }
  }

  saveOfflineQueue(remainingQueue);
  return {
    flushedCount,
    success: remainingQueue.length === 0,
  };
}

// Auto-register online event listener in browser
let onlineListenerRegistered = false;
export function registerOnlineSyncListener(): void {
  if (onlineListenerRegistered) return;
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('online', () => {
      void flushOfflineQueue();
    });
    onlineListenerRegistered = true;
  }
}
registerOnlineSyncListener();

/* ==========================================================================
   3. Realtime WebSockets & Echo Loop Guard
   ========================================================================== */

const localMutationTimestamps = new Map<string, number>();

/**
 * Tracks a local mutation to avoid echo loops when realtime events arrive from Supabase.
 */
export function trackLocalMutation(entityId: string, timestamp = Date.now()): void {
  if (!entityId) return;
  localMutationTimestamps.set(entityId, timestamp);
  if (localMutationTimestamps.size > 500) {
    const oldestKeys = Array.from(localMutationTimestamps.keys()).slice(0, 100);
    for (const key of oldestKeys) {
      localMutationTimestamps.delete(key);
    }
  }
}

/**
 * Checks whether an incoming realtime change event is an echo of a recent local mutation.
 */
export function isEchoEvent(payload: any, windowMs = 2500): boolean {
  if (!payload) return false;
  const id = payload.new?.id || payload.old?.id || payload.id;
  if (!id) return false;
  const lastLocal = localMutationTimestamps.get(String(id));
  if (!lastLocal) return false;
  return Date.now() - lastLocal <= windowMs;
}

/**
 * Clears local mutation tracking memory (primarily for unit testing).
 */
export function clearTrackedLocalMutations(): void {
  localMutationTimestamps.clear();
}

/**
 * Initializes Supabase Realtime subscriptions for tasks, notifications, and workspaces.
 * Safely returns a no-op cleanup function if Supabase is unconfigured or in SSR mode.
 */
export function initCampusOSRealtimeSync(callbacks?: {
  onTaskChange?: (payload: any) => void;
  onNotification?: (payload: any) => void;
  onWorkspaceChange?: (payload: any) => void;
}): () => void {
  if (typeof window === 'undefined' || !isSupabaseConfigured()) {
    return () => {};
  }

  try {
    const channel = supabase.channel('campusos-realtime');

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload: any) => {
          if (isEchoEvent(payload)) {
            return;
          }
          callbacks?.onTaskChange?.(payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_notifications' },
        (payload: any) => {
          if (isEchoEvent(payload)) {
            return;
          }
          callbacks?.onNotification?.(payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workspaces' },
        (payload: any) => {
          if (isEchoEvent(payload)) {
            return;
          }
          callbacks?.onWorkspaceChange?.(payload);
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // Safe cleanup
      }
    };
  } catch (err) {
    console.warn('[CampusOS Realtime] Subscription initialization skipped:', err);
    return () => {};
  }
}

/* ==========================================================================
   4. Cloud Synchronization (Push & Pull)
   ========================================================================== */

/**
 * Fetches latest profiles, deadlines, events, and tasks from Supabase Cloud.
 */
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

    // 4. Fetch Tasks (2-Way Sync)
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID);

    if (
      !profile &&
      (!deadlinesData || deadlinesData.length === 0) &&
      (!eventsData || eventsData.length === 0) &&
      (!tasksData || tasksData.length === 0)
    ) {
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

    if (tasksData && tasksData.length > 0) {
      partialState.tasks = tasksData.map(rowToTask);
    }

    return partialState;
  } catch (err) {
    console.warn('[Supabase Sync] Pull skipped (offline or table not yet created):', err);
    return null;
  }
}

/**
 * Direct push to Supabase Cloud with offline queue fallback.
 */
export async function pushToSupabaseCloud(state: CampusOSSharedState): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const isOnline = typeof navigator === 'undefined' || navigator.onLine;

  if (!isOnline || !isSupabaseConfigured()) {
    if (state.tasks && state.tasks.length > 0) {
      enqueueOfflineMutation({
        entity: 'tasks',
        action: 'UPSERT',
        payload: state.tasks.map(taskToRow),
      });
    }
    return false;
  }

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
    if (state.deadlines && state.deadlines.length > 0) {
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
    if (state.events && state.events.length > 0) {
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

    // 4. Upsert Tasks
    if (state.tasks && state.tasks.length > 0) {
      const taskRows = state.tasks.map((t) => {
        trackLocalMutation(t.id);
        return taskToRow(t);
      });
      const { error: taskErr } = await supabase.from('tasks').upsert(taskRows, { onConflict: 'id' });
      if (taskErr) {
        throw taskErr;
      }
    }

    // Flush any pending queue items
    await flushOfflineQueue();
    return true;
  } catch (err) {
    console.warn('[Supabase Sync] Push failed, queuing offline mutation:', err);
    if (state.tasks && state.tasks.length > 0) {
      enqueueOfflineMutation({
        entity: 'tasks',
        action: 'UPSERT',
        payload: state.tasks.map(taskToRow),
      });
    }
    return false;
  }
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounced background push to Supabase Cloud.
 */
export function pushToSupabaseCloudDebounced(state: CampusOSSharedState, delayMs = 2000): void {
  if (typeof window === 'undefined') return;

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    void pushToSupabaseCloud(state);
  }, delayMs);
}

/**
 * Records a completed Pomodoro/Deep Work focus session into student_focus_sessions.
 */
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
