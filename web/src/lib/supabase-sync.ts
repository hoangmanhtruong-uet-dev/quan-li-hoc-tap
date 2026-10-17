/**
 * CampusOS Supabase Cloud Synchronization Engine (R3 - Offline-First)
 * Provides 0ms local caching, bidirectional TaskItem <-> tasks sync,
 * CalendarEvent <-> calendar_events sync, profiles sync,
 * persistent offline mutation queue with auto-flush on reconnect,
 * Realtime WebSockets with echo loop protection, and safe unconfigured fallback.
 */

import { useState, useEffect, useSyncExternalStore } from 'react';
import { supabase, isSupabaseConfigured } from './supabase.ts';
import type { CampusOSSharedState, CalendarEvent, DeadlineItem } from './campus-store.ts';
import type { TaskItem, TaskStatus, TaskPriority, EisenhowerQuadrant } from '../types/tasks.ts';

export const DEFAULT_USER_ID = 'default_student';
export const OFFLINE_QUEUE_KEY = 'campusos_sync_queue_v1';

let currentActiveUserId: string | null = null;

/**
 * Dynamically configure or update the authenticated user UUID for cloud sync.
 */
export function setActiveUserId(userId: string | null): void {
  currentActiveUserId = userId;
}

/**
 * Resolves the currently active student UUID.
 * Checks in-memory setting, cached auth session, or falls back to DEFAULT_USER_ID.
 */
export function getActiveUserId(): string {
  if (currentActiveUserId) return currentActiveUserId;
  if (typeof window !== 'undefined') {
    try {
      const cached = window.localStorage.getItem('campusos_auth_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.id) return String(parsed.id);
      }
    } catch {
      // Safe fallback
    }
  }
  return DEFAULT_USER_ID;
}

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

let currentSyncStatus: CloudSyncStatus = 'synced';
const syncStatusListeners = new Set<(status: CloudSyncStatus) => void>();

/**
 * Returns the current cloud synchronization status.
 */
export function getCloudSyncStatus(): CloudSyncStatus {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'offline';
  }
  return currentSyncStatus;
}

/**
 * Updates cloud synchronization status and notifies subscribers and window events.
 */
export function setCloudSyncStatus(status: CloudSyncStatus): void {
  currentSyncStatus = status;
  for (const listener of syncStatusListeners) {
    try {
      listener(status);
    } catch (err) {
      console.warn('[CampusOS Sync] Listener notice:', err);
    }
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    queueMicrotask(() => {
      try {
        window.dispatchEvent(
          new CustomEvent('campusos:sync-status', {
            detail: { status, timestamp: Date.now() },
          })
        );
      } catch {
        // Safe event fallback
      }
    });
  }
}

/**
 * Subscribes to sync status changes.
 */
export function subscribeToSyncStatus(listener: (status: CloudSyncStatus) => void): () => void {
  syncStatusListeners.add(listener);
  try {
    listener(getCloudSyncStatus());
  } catch {
    // Initial call guard
  }
  return () => {
    syncStatusListeners.delete(listener);
  };
}

/**
 * React hook exposing current cloud sync status with automatic online/offline detection.
 */
export function useCloudSyncStatus(): { status: CloudSyncStatus; isOnline: boolean } {
  const status = useSyncExternalStore(
    subscribeToSyncStatus,
    () => getCloudSyncStatus(),
    () => 'synced' as CloudSyncStatus
  );

  useEffect(() => {
    const handleOnline = () => {
      setCloudSyncStatus('syncing');
      void flushOfflineQueue().then((res) => {
        setCloudSyncStatus(res.success ? 'synced' : 'error');
      });
    };

    const handleOffline = () => {
      setCloudSyncStatus('offline');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    return undefined;
  }, []);

  return {
    status,
    isOnline: status !== 'offline',
  };
}

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
  estimated_pomodoros?: number;
  completed_pomodoros?: number;
  tags: string[];
  order_index: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventRow {
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  event_type: 'class' | 'study' | 'exam' | 'personal';
  color: string | null;
  location: string | null;
  is_all_day: boolean;
  created_at: string;
  updated_at: string;
}

/* ==========================================================================
   1. Tasks 2-Way Sync Mapping (TaskItem <-> public.tasks schema)
   ========================================================================== */

/**
 * Maps a TaskItem (or partial task object) to the PostgreSQL `public.tasks` table schema.
 */
export function taskToRow(
  task: Partial<TaskItem> & Record<string, any>,
  customUserId?: string
): TaskRow {
  const taskId =
    task.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `task-${Date.now()}`);
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

  const plannedPoms =
    task.pomodoro_planned ?? task.estimated_pomodoros ?? task.pomodoros?.planned ?? 1;
  const donePoms =
    task.pomodoro_done ?? task.completed_pomodoros ?? task.pomodoros?.done ?? 0;

  const resolvedUserId = customUserId || task.user_id || getActiveUserId();

  return {
    id: taskId,
    user_id: resolvedUserId,
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
    activity_log: Array.isArray(task.activity_log)
      ? task.activity_log
      : Array.isArray(task.activityLog)
      ? task.activityLog
      : [],
    difficulty: typeof task.difficulty === 'number' ? task.difficulty : 1,
    actual_min: task.actual_min ?? task.actualMin ?? 0,
    pomodoro_planned: plannedPoms,
    pomodoro_done: donePoms,
    estimated_pomodoros: plannedPoms,
    completed_pomodoros: donePoms,
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

  const plannedPoms = row.pomodoro_planned ?? row.estimated_pomodoros ?? 1;
  const donePoms = row.pomodoro_done ?? row.completed_pomodoros ?? 0;

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
      planned: plannedPoms,
      done: donePoms,
    },
    createdAt: row.created_at || new Date().toISOString(),
    completedAt: row.completed_at || undefined,
    updatedAt: row.updated_at || undefined,
  };
}

/* ==========================================================================
   2. Calendar Events 2-Way Sync Mapping (CalendarEvent <-> public.calendar_events)
   ========================================================================== */

/**
 * Maps a CalendarEvent to PostgreSQL `public.calendar_events` table schema.
 */
export function eventToRow(
  event: Partial<CalendarEvent> & Record<string, any>,
  customUserId?: string
): CalendarEventRow {
  const eventId =
    event.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `event-${Date.now()}`);
  const nowIso = new Date().toISOString();
  const resolvedUserId = customUserId || event.user_id || getActiveUserId();

  // Normalize event_type to match CHECK (event_type IN ('class', 'study', 'exam', 'personal'))
  let eventType: 'class' | 'study' | 'exam' | 'personal' = 'class';
  const rawType = event.event_type || event.type || 'class';
  if (['class', 'study', 'exam', 'personal'].includes(rawType)) {
    eventType = rawType as 'class' | 'study' | 'exam' | 'personal';
  } else if (rawType === 'club') {
    eventType = 'personal';
  }

  // Format start_time and end_time as ISO timestamps
  let startTime = event.start_time;
  if (!startTime) {
    if (event.date) {
      const s = event.start || '08:00';
      startTime = s.includes('T') ? s : `${event.date}T${s.length === 5 ? `${s}:00` : s}.000Z`;
    } else {
      startTime = nowIso;
    }
  }

  let endTime = event.end_time;
  if (!endTime) {
    if (event.date) {
      const e = event.end || '09:00';
      endTime = e.includes('T') ? e : `${event.date}T${e.length === 5 ? `${e}:00` : e}.000Z`;
    } else {
      endTime = nowIso;
    }
  }

  return {
    id: eventId,
    user_id: resolvedUserId,
    title: event.title || '',
    start_time: startTime,
    end_time: endTime,
    event_type: eventType,
    color: event.color || (eventType === 'class' ? '#38bdf8' : '#a855f7'),
    location: event.location || null,
    is_all_day: Boolean(event.is_all_day ?? event.allDay ?? false),
    created_at: event.created_at || nowIso,
    updated_at: event.updated_at || nowIso,
  };
}

/**
 * Maps a PostgreSQL `public.calendar_events` row back to a TypeScript CalendarEvent.
 */
export function rowToEvent(row: any): CalendarEvent {
  const startTime = row.start_time ? String(row.start_time) : '';
  const endTime = row.end_time ? String(row.end_time) : '';

  const date = startTime ? startTime.slice(0, 10) : '';
  const start = startTime.includes('T') ? startTime.split('T')[1]!.slice(0, 5) : '08:00';
  const end = endTime.includes('T') ? endTime.split('T')[1]!.slice(0, 5) : '09:00';

  const rawType = row.event_type || 'class';
  const eventType = (['class', 'study', 'exam', 'personal'].includes(rawType)
    ? rawType
    : 'class') as 'class' | 'study' | 'exam' | 'personal';

  return {
    id: String(row.id),
    title: row.title || '',
    date: date,
    start: start,
    end: end,
    type: eventType,
    location: row.location || undefined,
    description: row.description || undefined,
    allDay: Boolean(row.is_all_day),
    color: row.color || undefined,
    done: Boolean(row.done),
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
  };
}

/* ==========================================================================
   3. Persistent Offline Mutation Queue
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
    setCloudSyncStatus('offline');
    return { flushedCount: 0, success: false };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    setCloudSyncStatus('synced');
    return { flushedCount: 0, success: true };
  }

  setCloudSyncStatus('syncing');
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
        } else if (
          mutation.entity === 'calendar_events' ||
          mutation.entity === 'events' ||
          mutation.entity === 'student_calendar_events'
        ) {
          if (mutation.action === 'DELETE') {
            const { error } = await supabase
              .from('calendar_events')
              .delete()
              .eq('id', mutation.payload?.id);
            success = !error;
          } else {
            const { error } = await supabase
              .from('calendar_events')
              .upsert(mutation.payload, { onConflict: 'id' });
            success = !error;
          }
        } else if (
          mutation.entity === 'profiles' ||
          mutation.entity === 'student_profiles'
        ) {
          const { error } = await supabase
            .from('profiles')
            .upsert(mutation.payload, { onConflict: 'id' });
          success = !error;
        } else if (mutation.entity === 'deadlines' || mutation.entity === 'student_deadlines') {
          const { error } = await supabase
            .from('student_deadlines')
            .upsert(mutation.payload, { onConflict: 'id' });
          success = !error;
        } else if (mutation.entity === 'student_focus_sessions') {
          const { error } = await supabase
            .from('student_focus_sessions')
            .insert(mutation.payload);
          success = !error;
        } else if (mutation.entity === 'lab_transactions') {
          const { error } = await supabase
            .from('lab_transactions')
            .upsert(mutation.payload, { onConflict: 'id' });
          success = !error;
        } else {
          const { error } = await supabase.from(mutation.entity).upsert(mutation.payload);
          success = !error;
        }
      } else {
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
  const isAllFlushed = remainingQueue.length === 0;
  setCloudSyncStatus(isAllFlushed ? 'synced' : 'error');

  return {
    flushedCount,
    success: isAllFlushed,
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
   4. Realtime WebSockets & Echo Loop Guard
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
 * Initializes Supabase Realtime subscriptions for tasks, calendar_events, notifications, and workspaces.
 * Safely returns a no-op cleanup function if Supabase is unconfigured or in SSR mode.
 */
export function initCampusOSRealtimeSync(callbacks?: {
  onTaskChange?: (payload: any) => void;
  onCalendarChange?: (payload: any) => void;
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
        { event: '*', schema: 'public', table: 'calendar_events' },
        (payload: any) => {
          if (isEchoEvent(payload)) {
            return;
          }
          callbacks?.onCalendarChange?.(payload);
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
   5. Cloud Synchronization (Push & Pull)
   ========================================================================== */

/**
 * Fetches latest profiles, calendar_events, tasks, and deadlines from Supabase Cloud.
 */
export async function pullFromSupabaseCloud(
  customUserId?: string
): Promise<Partial<CampusOSSharedState> | null> {
  if (typeof window === 'undefined') return null;

  const targetUserId = customUserId || getActiveUserId();

  try {
    // 1. Fetch Profile from 'profiles' (fallback to 'student_profiles')
    let profileData: any = null;
    try {
      const { data: pData, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${targetUserId},user_id.eq.${targetUserId}`)
        .maybeSingle();

      if (!pErr) profileData = pData;
    } catch {
      // Fallback check
    }

    if (!profileData) {
      try {
        const { data: legacyProfile } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', targetUserId)
          .maybeSingle();
        if (legacyProfile) profileData = legacyProfile;
      } catch {}
    }

    // 2. Fetch Tasks (2-Way Sync) from public.tasks
    let tasksData: any[] | null = null;
    try {
      const { data: tData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', targetUserId);
      tasksData = tData;
    } catch {}

    // 3. Fetch Calendar Events from public.calendar_events (fallback to student_calendar_events)
    let eventsData: any[] | null = null;
    try {
      const { data: cData } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', targetUserId);
      eventsData = cData;
    } catch {}

    if (!eventsData || eventsData.length === 0) {
      try {
        const { data: legacyEvents } = await supabase
          .from('student_calendar_events')
          .select('*')
          .eq('user_id', targetUserId);
        if (legacyEvents && legacyEvents.length > 0) {
          eventsData = legacyEvents;
        }
      } catch {}
    }

    // 4. Fetch Deadlines (legacy support)
    let deadlinesData: any[] | null = null;
    try {
      const { data: dData } = await supabase
        .from('student_deadlines')
        .select('*')
        .eq('user_id', targetUserId);
      deadlinesData = dData;
    } catch {}

    if (
      !profileData &&
      (!deadlinesData || deadlinesData.length === 0) &&
      (!eventsData || eventsData.length === 0) &&
      (!tasksData || tasksData.length === 0)
    ) {
      return null;
    }

    const partialState: Partial<CampusOSSharedState> = {};

    if (profileData) {
      partialState.xp = profileData.xp;
      partialState.level = profileData.level;
      partialState.rankTitle = profileData.rank_title;
      partialState.streak = profileData.streak;
      partialState.streakFreezes = profileData.streak_freezes;
      partialState.studyMinutesTotal = profileData.study_minutes_total;
      partialState.weeklyStudyGoalMinutes = profileData.weekly_goal_minutes;
      partialState.weeklyStudyMinutesCurrent = profileData.weekly_study_minutes;
      partialState.lastStudyDate = profileData.last_study_date || '';
      partialState.dailyMood = profileData.daily_mood || null;
      partialState.vibeTheme = profileData.vibe_theme || 'aurora';
      partialState.reducedMotion = profileData.reduced_motion || false;
      if (typeof profileData.violation_count === 'number') {
        partialState.violationCount = profileData.violation_count;
      }
      if (typeof (profileData as any).is_lab_vip === 'boolean') {
        partialState.isLabVip = (profileData as any).is_lab_vip;
      }
      if (typeof (profileData as any).tier === 'string') {
        partialState.tier = (profileData as any).tier;
      }
      if ((profileData as any).byok_keys && typeof (profileData as any).byok_keys === 'object') {
        partialState.byokKeys = (profileData as any).byok_keys;
      }
    }

    if (tasksData && tasksData.length > 0) {
      partialState.tasks = tasksData.map(rowToTask);
    }

    if (eventsData && eventsData.length > 0) {
      partialState.events = eventsData.map(rowToEvent);
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

    setCloudSyncStatus('synced');
    return partialState;
  } catch (err) {
    console.warn('[CampusOS Sync] Pull skipped (offline or tables not ready):', err);
    return null;
  }
}

/**
 * Direct push to Supabase Cloud with optimistic updates and offline queue fallback.
 */
export async function pushToSupabaseCloud(
  state: CampusOSSharedState,
  customUserId?: string
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const targetUserId = customUserId || getActiveUserId();
  const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;

  if (!isOnline || !isSupabaseConfigured()) {
    setCloudSyncStatus('offline');
    if (state.tasks && state.tasks.length > 0) {
      enqueueOfflineMutation({
        entity: 'tasks',
        action: 'UPSERT',
        payload: state.tasks.map((t) => taskToRow(t, targetUserId)),
      });
    }
    if (state.events && state.events.length > 0) {
      enqueueOfflineMutation({
        entity: 'calendar_events',
        action: 'UPSERT',
        payload: state.events.map((e) => eventToRow(e, targetUserId)),
      });
    }
    return false;
  }

  setCloudSyncStatus('syncing');

  try {
    const nowIso = new Date().toISOString();

    // 1. Upsert Profile to 'public.profiles'
    const profilePayload = {
      id: targetUserId,
      user_id: targetUserId,
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
      violation_count: state.violationCount ?? 0,
      is_lab_vip: state.isLabVip ?? false,
      tier: state.tier ?? 'free',
      byok_keys: state.byokKeys ?? {},
      onboarding_completed: true,
      updated_at: nowIso,
    };

    try {
      await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' });
    } catch {
      // Fallback attempt against student_profiles if migration differs
      try {
        await supabase
          .from('student_profiles')
          .upsert(profilePayload, { onConflict: 'user_id' });
      } catch {}
    }

    // 2. Upsert Tasks to 'public.tasks'
    if (state.tasks && state.tasks.length > 0) {
      const taskRows = state.tasks.map((t) => {
        trackLocalMutation(t.id);
        return taskToRow(t, targetUserId);
      });
      const { error: taskErr } = await supabase
        .from('tasks')
        .upsert(taskRows, { onConflict: 'id' });
      if (taskErr) {
        throw taskErr;
      }
    }

    // 3. Upsert Calendar Events to 'public.calendar_events'
    if (state.events && state.events.length > 0) {
      const eventRows = state.events.map((e) => {
        trackLocalMutation(e.id);
        return eventToRow(e, targetUserId);
      });
      const { error: evErr } = await supabase
        .from('calendar_events')
        .upsert(eventRows, { onConflict: 'id' });
      if (evErr) {
        // Fallback attempt against student_calendar_events if present
        try {
          await supabase
            .from('student_calendar_events')
            .upsert(eventRows, { onConflict: 'id' });
        } catch {
          throw evErr;
        }
      }
    }

    // 4. Upsert Deadlines (if student_deadlines table is active)
    if (state.deadlines && state.deadlines.length > 0) {
      try {
        const payload = state.deadlines.map((d) => ({
          id: d.id,
          user_id: targetUserId,
          title: d.title,
          course: d.course || null,
          due_date: d.dueDate || null,
          date: d.date || null,
          display_date: d.displayDate || null,
          urgent: d.urgent ?? false,
          completed: d.completed ?? false,
          is_exam: d.isExam ?? false,
          updated_at: nowIso,
        }));
        await supabase.from('student_deadlines').upsert(payload, { onConflict: 'id' });
      } catch {}
    }

    // Flush any pending queue items
    await flushOfflineQueue();
    setCloudSyncStatus('synced');
    return true;
  } catch (err) {
    console.warn('[CampusOS Sync] Push failed, queuing offline mutation:', err);
    setCloudSyncStatus('error');
    if (state.tasks && state.tasks.length > 0) {
      enqueueOfflineMutation({
        entity: 'tasks',
        action: 'UPSERT',
        payload: state.tasks.map((t) => taskToRow(t, targetUserId)),
      });
    }
    if (state.events && state.events.length > 0) {
      enqueueOfflineMutation({
        entity: 'calendar_events',
        action: 'UPSERT',
        payload: state.events.map((e) => eventToRow(e, targetUserId)),
      });
    }
    return false;
  }
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounced background push to Supabase Cloud.
 */
export function pushToSupabaseCloudDebounced(
  state: CampusOSSharedState,
  delayMs = 2000,
  customUserId?: string
): void {
  if (typeof window === 'undefined') return;

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    void pushToSupabaseCloud(state, customUserId);
  }, delayMs);
}

/* ==========================================================================
   6. Atomic Optimistic Mutation Helpers
   ========================================================================== */

/**
 * Atomically pushes a single Task mutation (UPSERT or DELETE) to Supabase Cloud.
 */
export async function pushTaskMutation(
  task: TaskItem,
  action: 'UPSERT' | 'DELETE',
  customUserId?: string
): Promise<boolean> {
  const targetUserId = customUserId || getActiveUserId();
  trackLocalMutation(task.id);

  const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;
  if (!isOnline || !isSupabaseConfigured()) {
    enqueueOfflineMutation({
      entity: 'tasks',
      action,
      payload: action === 'DELETE' ? { id: task.id } : taskToRow(task, targetUserId),
    });
    setCloudSyncStatus('offline');
    return false;
  }

  setCloudSyncStatus('syncing');
  try {
    if (action === 'DELETE') {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      if (error) throw error;
    } else {
      const row = taskToRow(task, targetUserId);
      const { error } = await supabase.from('tasks').upsert(row, { onConflict: 'id' });
      if (error) throw error;
    }
    setCloudSyncStatus('synced');
    return true;
  } catch (err) {
    console.warn('[CampusOS Sync] pushTaskMutation failed, enqueuing offline:', err);
    enqueueOfflineMutation({
      entity: 'tasks',
      action,
      payload: action === 'DELETE' ? { id: task.id } : taskToRow(task, targetUserId),
    });
    setCloudSyncStatus('error');
    return false;
  }
}

/**
 * Atomically pushes a single CalendarEvent mutation (UPSERT or DELETE) to Supabase Cloud.
 */
export async function pushCalendarEventMutation(
  event: CalendarEvent,
  action: 'UPSERT' | 'DELETE',
  customUserId?: string
): Promise<boolean> {
  const targetUserId = customUserId || getActiveUserId();
  trackLocalMutation(event.id);

  const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;
  if (!isOnline || !isSupabaseConfigured()) {
    enqueueOfflineMutation({
      entity: 'calendar_events',
      action,
      payload: action === 'DELETE' ? { id: event.id } : eventToRow(event, targetUserId),
    });
    setCloudSyncStatus('offline');
    return false;
  }

  setCloudSyncStatus('syncing');
  try {
    if (action === 'DELETE') {
      const { error } = await supabase.from('calendar_events').delete().eq('id', event.id);
      if (error) throw error;
    } else {
      const row = eventToRow(event, targetUserId);
      const { error } = await supabase.from('calendar_events').upsert(row, { onConflict: 'id' });
      if (error) throw error;
    }
    setCloudSyncStatus('synced');
    return true;
  } catch (err) {
    console.warn('[CampusOS Sync] pushCalendarEventMutation failed, enqueuing offline:', err);
    enqueueOfflineMutation({
      entity: 'calendar_events',
      action,
      payload: action === 'DELETE' ? { id: event.id } : eventToRow(event, targetUserId),
    });
    setCloudSyncStatus('error');
    return false;
  }
}

/**
 * Atomically pushes a student profile update to Supabase Cloud profiles table.
 */
export async function pushProfileMutation(
  profilePatch: Partial<CampusOSSharedState>,
  customUserId?: string
): Promise<boolean> {
  const targetUserId = customUserId || getActiveUserId();
  const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;

  const payload: Record<string, any> = {
    id: targetUserId,
    user_id: targetUserId,
    updated_at: new Date().toISOString(),
  };

  if (profilePatch.xp !== undefined) payload.xp = profilePatch.xp;
  if (profilePatch.level !== undefined) payload.level = profilePatch.level;
  if (profilePatch.rankTitle !== undefined) payload.rank_title = profilePatch.rankTitle;
  if (profilePatch.streak !== undefined) payload.streak = profilePatch.streak;
  if (profilePatch.dailyMood !== undefined) payload.daily_mood = profilePatch.dailyMood;
  if (profilePatch.vibeTheme !== undefined) payload.vibe_theme = profilePatch.vibeTheme;
  if (profilePatch.isLabVip !== undefined) payload.is_lab_vip = profilePatch.isLabVip;
  if ((profilePatch as any).is_lab_vip !== undefined) payload.is_lab_vip = (profilePatch as any).is_lab_vip;
  if (profilePatch.tier !== undefined) payload.tier = profilePatch.tier;
  if (profilePatch.byokKeys !== undefined) payload.byok_keys = profilePatch.byokKeys;
  if ((profilePatch as any).byok_keys !== undefined) payload.byok_keys = (profilePatch as any).byok_keys;
  payload.onboarding_completed = true;

  if (!isOnline || !isSupabaseConfigured()) {
    enqueueOfflineMutation({
      entity: 'profiles',
      action: 'UPSERT',
      payload,
    });
    setCloudSyncStatus('offline');
    return false;
  }

  setCloudSyncStatus('syncing');
  try {
    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    setCloudSyncStatus('synced');
    return true;
  } catch (err) {
    console.warn('[CampusOS Sync] pushProfileMutation failed, enqueuing offline:', err);
    enqueueOfflineMutation({
      entity: 'profiles',
      action: 'UPSERT',
      payload,
    });
    setCloudSyncStatus('error');
    return false;
  }
}

/**
 * Records a completed Pomodoro/Deep Work focus session into student_focus_sessions.
 */
export async function logFocusSessionToSupabase(
  session: {
    focusMinutes: number;
    mode: string;
    disciplineScore: number;
    shameCount: number;
    xpGained: number;
  },
  customUserId?: string
): Promise<void> {
  if (typeof window === 'undefined') return;
  const targetUserId = customUserId || getActiveUserId();

  try {
    await supabase.from('student_focus_sessions').insert({
      user_id: targetUserId,
      focus_minutes: session.focusMinutes,
      mode: session.mode,
      discipline_score: session.disciplineScore,
      shame_count: session.shameCount,
      xp_gained: session.xpGained,
      completed_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[CampusOS Sync] Log focus session skipped:', err);
  }
}

/**
 * Records a Chrome Extension focus violation into student_focus_sessions and updates profiles.
 * Supports optimistic sync with fallback to persistent offline mutation queue.
 */
export async function recordFocusViolationToSupabase(
  payload: {
    penaltyXp: number;
    domain?: string;
    reason?: string;
    violationCount?: number;
  },
  customUserId?: string
): Promise<boolean> {
  const targetUserId = customUserId || getActiveUserId();
  const penalty = typeof payload.penaltyXp === 'number' ? Math.max(0, payload.penaltyXp) : 50;
  const nowIso = new Date().toISOString();

  const violationRecord = {
    user_id: targetUserId,
    focus_minutes: 0,
    mode: 'extreme_cat',
    discipline_score: Math.max(0, 100 - penalty),
    shame_count: 1,
    violation_count: payload.violationCount ?? 1,
    xp_gained: -penalty,
    completed_at: nowIso,
  };

  const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;

  if (!isOnline || !isSupabaseConfigured()) {
    enqueueOfflineMutation({
      entity: 'student_focus_sessions',
      action: 'INSERT',
      payload: violationRecord,
    });
    enqueueOfflineMutation({
      entity: 'profiles',
      action: 'UPSERT',
      payload: {
        id: targetUserId,
        user_id: targetUserId,
        violation_count: payload.violationCount ?? 1,
        updated_at: nowIso,
      },
    });
    setCloudSyncStatus('offline');
    return false;
  }

  setCloudSyncStatus('syncing');
  try {
    // 1. Insert violation entry in student_focus_sessions
    const { error: sessionErr } = await supabase
      .from('student_focus_sessions')
      .insert(violationRecord);

    if (sessionErr) {
      throw sessionErr;
    }

    // 2. Also attempt updating violation_count on profiles
    try {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('violation_count, xp')
        .or(`id.eq.${targetUserId},user_id.eq.${targetUserId}`)
        .maybeSingle();

      if (currentProfile) {
        const nextCount = (currentProfile.violation_count || 0) + 1;
        const nextXp = Math.max(0, (currentProfile.xp || 0) - penalty);
        await supabase
          .from('profiles')
          .update({
            violation_count: nextCount,
            xp: nextXp,
            updated_at: nowIso,
          })
          .eq('id', targetUserId);
      }
    } catch {
      // Non-fatal if profiles table or row not yet populated
    }

    setCloudSyncStatus('synced');
    return true;
  } catch (err) {
    console.warn('[CampusOS Sync] Record focus violation failed, queuing offline:', err);
    enqueueOfflineMutation({
      entity: 'student_focus_sessions',
      action: 'INSERT',
      payload: violationRecord,
    });
    setCloudSyncStatus('error');
    return false;
  }
}

/**
 * Records a Campus LAB VIP transaction (VietQR or Dev Mode simulation) with offline fallback.
 */
export async function recordLabTransactionToSupabase(
  tx: {
    id?: string;
    tier: 'free' | 'plus' | 'pro' | 'ultra';
    amount: number;
    currency?: string;
    status?: 'pending' | 'completed' | 'failed' | 'refunded';
    payment_method?: 'vietqr' | 'dev_simulation' | 'stripe' | 'momo';
    transaction_code?: string;
    metadata?: Record<string, any>;
  },
  customUserId?: string
): Promise<{ success: boolean; data?: any; error?: any }> {
  const targetUserId = customUserId || getActiveUserId();
  const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;

  const payload = {
    id: tx.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}`),
    user_id: targetUserId,
    tier: tx.tier,
    amount: tx.amount,
    currency: tx.currency || 'VND',
    status: tx.status || 'completed',
    payment_method: tx.payment_method || 'vietqr',
    transaction_code: tx.transaction_code || `CAMPUSLAB_${targetUserId.slice(0, 8)}_${Date.now()}`,
    metadata: tx.metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: (tx.status || 'completed') === 'completed' ? new Date().toISOString() : null,
  };

  if (!isOnline || !isSupabaseConfigured()) {
    enqueueOfflineMutation({
      entity: 'lab_transactions',
      action: 'UPSERT',
      payload,
    });
    return { success: true, data: payload };
  }

  try {
    const { data, error } = await supabase
      .from('lab_transactions')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.warn('[CampusOS Sync] recordLabTransactionToSupabase fallback offline:', err);
    enqueueOfflineMutation({
      entity: 'lab_transactions',
      action: 'UPSERT',
      payload,
    });
    return { success: true, data: payload, error: err };
  }
}

