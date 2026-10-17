import test from 'node:test';
import assert from 'node:assert/strict';

import {
  taskToRow,
  rowToTask,
  eventToRow,
  rowToEvent,
  enqueueOfflineMutation,
  getOfflineQueue,
  clearOfflineQueue,
  flushOfflineQueue,
  trackLocalMutation,
  isEchoEvent,
  clearTrackedLocalMutations,
  setActiveUserId,
  getActiveUserId,
  DEFAULT_USER_ID,
  getCloudSyncStatus,
  setCloudSyncStatus,
  subscribeToSyncStatus,
  pushTaskMutation,
  pushCalendarEventMutation,
  pushProfileMutation,
  type CloudSyncStatus,
} from '../src/lib/supabase-sync.ts';

import {
  getSharedState,
  resetSharedState,
  completeTask,
  addTask,
  updateTask,
  deleteTask,
  addCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  addQuickTask,
} from '../src/lib/campus-store.ts';

// ---------------------------------------------------------------------------
// Suite 1: Task Status Mutation Mapping & Dynamic User ID
// ---------------------------------------------------------------------------

test('Core Trio Persistence (1/12): taskToRow accurately maps task status, pomodoros, and dynamic userId', () => {
  const customUserId = 'user-uuid-1234-5678-abcd';
  const task = {
    id: 'task-test-01',
    title: 'Nộp bài tập lớn Mạng máy tính',
    description: 'Socket UDP Reliable Transfer',
    status: 'doing' as const,
    priority: 'high' as const,
    dueAt: '2026-10-20T23:59:00.000Z',
    course: 'CS101',
    quadrant: 'do_first' as const,
    steps: [
      { id: 's1', text: 'Thiết kế header UDP', done: true },
      { id: 's2', text: 'Lập trình sliding window', done: false },
    ],
    pomodoros: { planned: 4, done: 2 },
  };

  const row = taskToRow(task, customUserId);

  assert.equal(row.id, 'task-test-01');
  assert.equal(row.user_id, customUserId);
  assert.equal(row.title, 'Nộp bài tập lớn Mạng máy tính');
  assert.equal(row.status, 'doing');
  assert.equal(row.priority, 'high');
  assert.equal(row.due_date, '2026-10-20T23:59:00.000Z');
  assert.equal(row.course_id, 'CS101');
  assert.equal(row.pomodoro_planned, 4);
  assert.equal(row.pomodoro_done, 2);
  assert.equal(row.estimated_pomodoros, 4);
  assert.equal(row.completed_pomodoros, 2);
  assert.equal(row.subtasks.length, 2);
});

test('Core Trio Persistence (2/12): setActiveUserId and getActiveUserId maintain dynamic session identity', () => {
  try {
    assert.equal(getActiveUserId(), DEFAULT_USER_ID);

    const authId = 'c63b21fa-71a2-4d56-8576-92f75a7c5148';
    setActiveUserId(authId);
    assert.equal(getActiveUserId(), authId);

    const row = taskToRow({ id: 'task-auth-test', title: 'Task with active user' });
    assert.equal(row.user_id, authId);
  } finally {
    setActiveUserId(null);
    assert.equal(getActiveUserId(), DEFAULT_USER_ID);
  }
});

test('Core Trio Persistence (3/12): rowToTask accurately reconstructs TaskItem with pomodoros and subtasks', () => {
  const dbRow = {
    id: 'db-task-persistence-1',
    user_id: 'user-xyz',
    title: 'Báo cáo Hệ điều hành',
    description: 'Mô phỏng thuật toán lập lịch CPU',
    status: 'done',
    priority: 'urgent',
    due_date: '2026-10-25T17:00:00.000Z',
    course_id: 'CS202',
    pomodoro_planned: 3,
    pomodoro_done: 3,
    estimated_pomodoros: 3,
    completed_pomodoros: 3,
    subtasks: [
      { id: 'sub-1', text: 'Cài đặt Round Robin', done: true },
      { id: 'sub-2', text: 'Vẽ biểu đồ Gantt', done: true },
    ],
    completed_at: '2026-10-24T10:00:00.000Z',
  };

  const task = rowToTask(dbRow);
  assert.equal(task.id, 'db-task-persistence-1');
  assert.equal(task.title, 'Báo cáo Hệ điều hành');
  assert.equal(task.status, 'done');
  assert.equal(task.priority, 'urgent');
  assert.equal(task.dueAt, '2026-10-25T17:00:00.000Z');
  assert.equal(task.course, 'CS202');
  assert.equal(task.pomodoros.planned, 3);
  assert.equal(task.pomodoros.done, 3);
  assert.equal(task.steps.length, 2);
  assert.equal(task.completedAt, '2026-10-24T10:00:00.000Z');
});

// ---------------------------------------------------------------------------
// Suite 2: Calendar Events Mapping & Lifecycle Persistence
// ---------------------------------------------------------------------------

test('Core Trio Persistence (4/12): eventToRow maps CalendarEvent fields to public.calendar_events schema', () => {
  const event = {
    id: 'event-lab-01',
    title: 'Thực hành Mạng máy tính Lab 304',
    date: '2026-10-18',
    start: '14:00',
    end: '16:30',
    type: 'class' as const,
    location: 'Lab 304',
    color: '#3DE8FF',
    allDay: false,
  };

  const row = eventToRow(event, 'user-cal-999');
  assert.equal(row.id, 'event-lab-01');
  assert.equal(row.user_id, 'user-cal-999');
  assert.equal(row.title, 'Thực hành Mạng máy tính Lab 304');
  assert.equal(row.start_time, '2026-10-18T14:00:00.000Z');
  assert.equal(row.end_time, '2026-10-18T16:30:00.000Z');
  assert.equal(row.event_type, 'class');
  assert.equal(row.location, 'Lab 304');
  assert.equal(row.color, '#3DE8FF');
  assert.equal(row.is_all_day, false);
});

test('Core Trio Persistence (5/12): eventToRow normalizes club type and rowToEvent round-trips cleanly', () => {
  const clubEvent = {
    id: 'event-club-workshop',
    title: 'Workshop CLB GenAI',
    date: '2026-10-19',
    start: '18:00',
    end: '20:00',
    type: 'club' as any,
    location: 'Hội trường B',
  };

  const row = eventToRow(clubEvent);
  // 'club' is mapped to 'personal' to comply with CHECK (event_type IN ('class', 'study', 'exam', 'personal'))
  assert.equal(row.event_type, 'personal');

  const reconstructed = rowToEvent(row);
  assert.equal(reconstructed.id, 'event-club-workshop');
  assert.equal(reconstructed.title, 'Workshop CLB GenAI');
  assert.equal(reconstructed.date, '2026-10-19');
  assert.equal(reconstructed.start, '18:00');
  assert.equal(reconstructed.end, '20:00');
  assert.equal(reconstructed.location, 'Hội trường B');
});

test('Core Trio Persistence (6/12): addCalendarEvent, updateCalendarEvent, deleteCalendarEvent update store & emit event', () => {
  let eventUpdateCount = 0;
  const mockWindow = (globalThis as any).window;
  (globalThis as any).window = {
    dispatchEvent: (ev: any) => {
      if (ev.type === 'campusos-store-update') {
        eventUpdateCount++;
      }
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  try {
    resetSharedState(new Date('2026-10-18T10:00:00Z'));
    const initialEventCount = getSharedState().events.length;

    // 1. Add event
    const newEvent = addCalendarEvent({
      id: 'custom-event-test-1',
      title: 'Học bù Giải tích',
      date: '2026-10-21',
      start: '07:30',
      end: '09:00',
      type: 'class',
      location: 'P.101',
    });

    assert.equal(newEvent.id, 'custom-event-test-1');
    const stateAfterAdd = getSharedState();
    assert.equal(stateAfterAdd.events.length, initialEventCount + 1);
    assert.ok(stateAfterAdd.events.some((e) => e.id === 'custom-event-test-1'));

    // 2. Update event (e.g. reschedule / move)
    const updated = updateCalendarEvent('custom-event-test-1', {
      date: '2026-10-22',
      start: '08:00',
      end: '09:30',
    });
    assert.ok(updated);
    assert.equal(updated.date, '2026-10-22');
    assert.equal(updated.start, '08:00');

    const stateAfterUpdate = getSharedState();
    const found = stateAfterUpdate.events.find((e) => e.id === 'custom-event-test-1');
    assert.equal(found?.date, '2026-10-22');

    // 3. Delete event
    const deleted = deleteCalendarEvent('custom-event-test-1');
    assert.equal(deleted?.id, 'custom-event-test-1');

    const stateAfterDelete = getSharedState();
    assert.equal(stateAfterDelete.events.length, initialEventCount);
    assert.ok(!stateAfterDelete.events.some((e) => e.id === 'custom-event-test-1'));

    assert.ok(eventUpdateCount >= 3, 'campusos-store-update should fire on add, update, delete');
  } finally {
    if (mockWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = mockWindow;
    }
  }
});

// ---------------------------------------------------------------------------
// Suite 3: Dashboard Deadline Completion Bridge
// ---------------------------------------------------------------------------

test('Core Trio Persistence (7/12): completeTask bridges deadline completion to tasks and awards XP', () => {
  resetSharedState(new Date('2026-10-18T10:00:00Z'));
  const initialState = getSharedState();

  // Find a deadline from the initial state
  const testDeadline = initialState.deadlines.find((d) => !d.completed);
  assert.ok(testDeadline, 'A pending deadline should exist in test state');

  const initialXp = initialState.xp;
  const deadlineId = testDeadline.id;

  // Complete task via completeTask(deadlineId, 50)
  const result = completeTask(deadlineId, 50);

  assert.ok(result.xpGained >= 50, 'Completing deadline should award at least 50 XP');

  const nextState = getSharedState();
  assert.equal(nextState.xp, initialXp + result.xpGained);

  // Verify deadline is marked completed
  const updatedDeadline = nextState.deadlines.find((d) => d.id === deadlineId);
  assert.equal(updatedDeadline?.completed, true, 'Matching deadline must be marked completed');

  // Verify corresponding task in state.tasks is marked done
  const matchingTask = nextState.tasks.find(
    (t) =>
      t.id === deadlineId ||
      t.id === `task-${deadlineId}` ||
      (t.id.startsWith('task-') && t.id.slice(5) === deadlineId) ||
      t.title.trim().toLowerCase() === testDeadline.title.trim().toLowerCase()
  );
  if (matchingTask) {
    assert.equal(matchingTask.status, 'done', 'Matching task status must be transitioned to done');
    assert.ok(matchingTask.completedAt, 'Matching task must record completedAt timestamp');
  }
});

test('Core Trio Persistence (8/12): completeTask is idempotent and does not duplicate rewards', () => {
  resetSharedState(new Date('2026-10-18T10:00:00Z'));
  const initialState = getSharedState();
  const testDeadline = initialState.deadlines.find((d) => !d.completed)!;

  // First completion
  const res1 = completeTask(testDeadline.id, 50);
  assert.ok(res1.xpGained >= 50);

  const xpAfterFirst = getSharedState().xp;

  // Second completion on already completed task/deadline
  const res2 = completeTask(testDeadline.id, 50);
  assert.equal(res2.xpGained, 0, 'Subsequent completion should award 0 XP');

  const xpAfterSecond = getSharedState().xp;
  assert.equal(xpAfterSecond, xpAfterFirst, 'XP must remain invariant on duplicate completion');
});

// ---------------------------------------------------------------------------
// Suite 4: Topbar Cloud Sync Indicator State Transitions
// ---------------------------------------------------------------------------

test('Core Trio Persistence (9/12): setCloudSyncStatus notifies subscribers and updates getCloudSyncStatus', () => {
  const recordedStatuses: CloudSyncStatus[] = [];
  const unsubscribe = subscribeToSyncStatus((st) => {
    recordedStatuses.push(st);
  });

  try {
    setCloudSyncStatus('syncing');
    assert.equal(getCloudSyncStatus(), 'syncing');

    setCloudSyncStatus('synced');
    assert.equal(getCloudSyncStatus(), 'synced');

    setCloudSyncStatus('offline');
    assert.equal(getCloudSyncStatus(), 'offline');

    setCloudSyncStatus('error');
    assert.equal(getCloudSyncStatus(), 'error');

    // Reset to synced
    setCloudSyncStatus('synced');
    assert.equal(getCloudSyncStatus(), 'synced');

    assert.ok(recordedStatuses.includes('syncing'));
    assert.ok(recordedStatuses.includes('offline'));
    assert.ok(recordedStatuses.includes('error'));
    assert.ok(recordedStatuses.includes('synced'));
  } finally {
    unsubscribe();
  }
});

test('Core Trio Persistence (10/12): campusos:sync-status window event dispatches on status transitions', async () => {
  let eventDispatched = false;
  let receivedStatus: CloudSyncStatus | null = null;

  const mockWindow = (globalThis as any).window;
  (globalThis as any).window = {
    dispatchEvent: (ev: any) => {
      if (ev.type === 'campusos:sync-status') {
        eventDispatched = true;
        receivedStatus = ev.detail.status;
      }
    },
  };

  try {
    setCloudSyncStatus('syncing');
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(eventDispatched, true);
    assert.equal(receivedStatus, 'syncing');
  } finally {
    if (mockWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = mockWindow;
    }
  }
});

// ---------------------------------------------------------------------------
// Suite 5: Offline Queue, Echo Guard & Atomic Mutations
// ---------------------------------------------------------------------------

test('Core Trio Persistence (11/12): pushTaskMutation and pushCalendarEventMutation fallback to offline queue', async () => {
  clearOfflineQueue();

  const task: any = {
    id: 'offline-task-xyz',
    title: 'Nhiệm vụ khi mất mạng',
    status: 'todo',
    priority: 'medium',
    dueAt: '2026-10-22T23:59:00',
    course: 'INT1000',
    steps: [],
    pomodoros: { planned: 1, done: 0 },
  };

  const calEvent: any = {
    id: 'offline-event-xyz',
    title: 'Sự kiện khi mất mạng',
    date: '2026-10-22',
    start: '10:00',
    end: '11:00',
    type: 'study',
  };

  // Mock offline environment via defineProperty
  const hadOnLine = typeof globalThis.navigator !== 'undefined' && 'onLine' in globalThis.navigator;
  const originalOnLine = (globalThis.navigator as any)?.onLine;
  Object.defineProperty(globalThis.navigator, 'onLine', {
    value: false,
    configurable: true,
    writable: true,
  });

  try {
    const taskResult = await pushTaskMutation(task, 'UPSERT');
    assert.equal(taskResult, false);

    const eventResult = await pushCalendarEventMutation(calEvent, 'UPSERT');
    assert.equal(eventResult, false);

    const queue = getOfflineQueue();
    assert.equal(queue.length, 2);
    assert.equal(queue[0]!.entity, 'tasks');
    assert.equal(queue[0]!.payload.id, 'offline-task-xyz');
    assert.equal(queue[1]!.entity, 'calendar_events');
    assert.equal(queue[1]!.payload.id, 'offline-event-xyz');

    // Flush simulation
    Object.defineProperty(globalThis.navigator, 'onLine', {
      value: true,
      configurable: true,
      writable: true,
    });
    const flushRes = await flushOfflineQueue(async () => true);
    assert.equal(flushRes.flushedCount, 2);
    assert.equal(flushRes.success, true);
    assert.equal(getOfflineQueue().length, 0);
  } finally {
    clearOfflineQueue();
    if (hadOnLine) {
      Object.defineProperty(globalThis.navigator, 'onLine', {
        value: originalOnLine,
        configurable: true,
        writable: true,
      });
    } else {
      delete (globalThis.navigator as any).onLine;
    }
  }
});

test('Core Trio Persistence (12/12): echo loop guard suppresses echoes for calendar and task mutations', () => {
  clearTrackedLocalMutations();

  const taskId = 'task-local-111';
  const eventId = 'event-local-222';

  trackLocalMutation(taskId);
  trackLocalMutation(eventId);

  // Echo events from local client
  assert.equal(isEchoEvent({ new: { id: taskId } }), true);
  assert.equal(isEchoEvent({ new: { id: eventId } }), true);

  // Remote change from another peer/server
  assert.equal(isEchoEvent({ new: { id: 'other-user-333' } }), false);

  clearTrackedLocalMutations();
  assert.equal(isEchoEvent({ new: { id: taskId } }), false);
});
