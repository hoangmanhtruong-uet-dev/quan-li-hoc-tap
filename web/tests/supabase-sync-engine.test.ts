import test from 'node:test';
import assert from 'node:assert/strict';

import {
  taskToRow,
  rowToTask,
  enqueueOfflineMutation,
  getOfflineQueue,
  getOfflineQueueSize,
  clearOfflineQueue,
  flushOfflineQueue,
  initCampusOSRealtimeSync,
  trackLocalMutation,
  isEchoEvent,
  clearTrackedLocalMutations,
  OFFLINE_QUEUE_KEY,
  DEFAULT_USER_ID,
  type TaskRow,
} from '../src/lib/supabase-sync.ts';

test('CampusOS Sync Engine (1/8): taskToRow accurately maps TaskItem fields to PostgreSQL schema', () => {
  const taskInput = {
    id: 'task-lab-01',
    title: 'Báo cáo Lab Mạng Máy Tính',
    description: 'Bắt gói tin TCP/UDP với Wireshark',
    status: 'doing' as const,
    priority: 'high' as const,
    dueDate: '2026-11-20T23:59:00.000Z',
    estimatedMinutes: 90,
    course: 'INT3110',
    quadrant: 'do_first' as const,
    subtasks: [
      { id: 'sub-1', text: 'Chụp hình bắt gói tin', done: true },
      { id: 'sub-2', text: 'Viết kết luận phân tích', done: false },
    ],
    attachments: [
      { id: 'att-1', name: 'wireshark.pcap', url: 'https://cdn.campusos.internal/wireshark.pcap' },
    ],
    completedAt: '2026-11-21T01:00:00.000Z',
    updatedAt: '2026-10-16T12:00:00.000Z',
  };

  const row: TaskRow = taskToRow(taskInput);

  assert.equal(row.id, 'task-lab-01');
  assert.equal(row.user_id, DEFAULT_USER_ID);
  assert.equal(row.title, 'Báo cáo Lab Mạng Máy Tính');
  assert.equal(row.description, 'Bắt gói tin TCP/UDP với Wireshark');
  assert.equal(row.status, 'doing');
  assert.equal(row.priority, 'high');
  assert.equal(row.due_date, '2026-11-20T23:59:00.000Z');
  assert.equal(row.estimated_minutes, 90);
  assert.equal(row.course_id, 'INT3110');
  assert.equal(row.eisenhower_quadrant, 'do_first');
  assert.equal(row.quadrant, 'do_first');
  assert.deepEqual(row.subtasks, taskInput.subtasks);
  assert.deepEqual(row.attachments, taskInput.attachments);
  assert.equal(row.completed_at, '2026-11-21T01:00:00.000Z');
  assert.equal(row.updated_at, '2026-10-16T12:00:00.000Z');
});

test('CampusOS Sync Engine (2/8): taskToRow applies sensible defaults when optional fields are omitted', () => {
  const minimalTask = {
    title: 'Ôn tập Triết học Mác-Lênin',
  };

  const row = taskToRow(minimalTask);

  assert.ok(row.id && row.id.length > 0);
  assert.equal(row.title, 'Ôn tập Triết học Mác-Lênin');
  assert.equal(row.description, null);
  assert.equal(row.status, 'todo');
  assert.equal(row.priority, 'medium');
  assert.equal(row.due_date, null);
  assert.equal(row.estimated_minutes, 30);
  assert.equal(row.course_id, null);
  assert.equal(row.eisenhower_quadrant, 'schedule');
  assert.deepEqual(row.subtasks, []);
  assert.deepEqual(row.attachments, []);
  assert.equal(row.completed_at, null);
  assert.ok(row.created_at);
  assert.ok(row.updated_at);
});

test('CampusOS Sync Engine (3/8): rowToTask accurately converts PostgreSQL row back to TaskItem', () => {
  const dbRow = {
    id: 'db-task-99',
    user_id: 'user-xyz',
    title: 'Đồ án tốt nghiệp',
    description: 'Nghiên cứu kiến trúc Microservices & Serverless',
    status: 'doing',
    priority: 'urgent',
    due_date: '2026-12-31T17:00:00.000Z',
    estimated_minutes: 180,
    course_id: 'CS-THESIS',
    course: 'CS-THESIS',
    eisenhower_quadrant: 'do_first',
    quadrant: 'do_first',
    subtasks: [
      { id: 'sub-a', text: 'Benchmark độ trễ gRPC vs REST', done: true },
    ],
    attachments: [
      { id: 'att-a', name: 'architecture_diagram.png', url: 'https://cdn.campusos.internal/arch.png' },
    ],
    completed_at: null,
    created_at: '2026-09-01T08:00:00.000Z',
    updated_at: '2026-10-16T15:30:00.000Z',
  };

  const task = rowToTask(dbRow);

  assert.equal(task.id, 'db-task-99');
  assert.equal(task.title, 'Đồ án tốt nghiệp');
  assert.equal(task.description, 'Nghiên cứu kiến trúc Microservices & Serverless');
  assert.equal(task.status, 'doing');
  assert.equal(task.priority, 'urgent');
  assert.equal(task.dueDate, '2026-12-31T17:00:00.000Z');
  assert.equal(task.dueAt, '2026-12-31T17:00:00.000Z');
  assert.equal(task.estimatedMinutes, 180);
  assert.equal(task.estimateMin, 180);
  assert.equal(task.course, 'CS-THESIS');
  assert.equal(task.course_id, 'CS-THESIS');
  assert.equal(task.quadrant, 'do_first');
  assert.equal(task.eisenhower_quadrant, 'do_first');
  assert.deepEqual(task.subtasks, dbRow.subtasks);
  assert.deepEqual(task.steps, dbRow.subtasks);
  assert.deepEqual(task.attachments, dbRow.attachments);
  assert.equal(task.completedAt, undefined);
  assert.equal(task.updatedAt, '2026-10-16T15:30:00.000Z');
  assert.equal(task.createdAt, '2026-09-01T08:00:00.000Z');
});

test('CampusOS Sync Engine (4/8): bidirectional conversion preserves task integrity across roundtrip', () => {
  const original = {
    id: 'roundtrip-task-1',
    title: 'Kiểm thử hộp đen thuật toán phân loại',
    description: 'Viết test cases cho edge cases',
    status: 'todo' as const,
    priority: 'medium' as const,
    dueDate: '2026-11-15T23:00:00.000Z',
    estimatedMinutes: 60,
    course: 'SE202',
    quadrant: 'schedule' as const,
    subtasks: [{ id: 's1', text: 'Boundary value analysis', done: false }],
    attachments: [{ id: 'a1', name: 'test_spec.pdf', url: 'https://vault/spec.pdf' }],
    completedAt: undefined,
    updatedAt: '2026-10-16T10:00:00.000Z',
  };

  const row = taskToRow(original);
  const reconstructed = rowToTask(row);

  assert.equal(reconstructed.id, original.id);
  assert.equal(reconstructed.title, original.title);
  assert.equal(reconstructed.status, original.status);
  assert.equal(reconstructed.priority, original.priority);
  assert.equal(reconstructed.dueDate, original.dueDate);
  assert.equal(reconstructed.estimatedMinutes, original.estimatedMinutes);
  assert.equal(reconstructed.course, original.course);
  assert.equal(reconstructed.quadrant, original.quadrant);
  assert.deepEqual(reconstructed.subtasks, original.subtasks);
  assert.deepEqual(reconstructed.attachments, original.attachments);
});

test('CampusOS Sync Engine (5/8): persistent offline queue records mutations and tracks queue size', () => {
  clearOfflineQueue();
  assert.equal(getOfflineQueueSize(), 0);
  assert.equal(OFFLINE_QUEUE_KEY, 'campusos_sync_queue_v1');

  const mut1 = enqueueOfflineMutation({
    entity: 'tasks',
    action: 'UPSERT',
    payload: { id: 'task-offline-1', title: 'Task in offline mode' },
  });

  assert.equal(getOfflineQueueSize(), 1);
  assert.equal(mut1.entity, 'tasks');
  assert.equal(mut1.action, 'UPSERT');
  assert.ok(mut1.id);
  assert.ok(mut1.timestamp > 0);

  const mut2 = enqueueOfflineMutation({
    entity: 'tasks',
    action: 'DELETE',
    payload: { id: 'task-offline-2' },
  });

  assert.equal(getOfflineQueueSize(), 2);

  const currentQueue = getOfflineQueue();
  assert.equal(currentQueue.length, 2);
  assert.equal(currentQueue[0]!.payload.id, 'task-offline-1');
  assert.equal(currentQueue[1]!.payload.id, 'task-offline-2');

  // Verify persistence when window.localStorage is present
  const mockStorage = new Map<string, string>();
  const originalWindow = (globalThis as any).window;
  (globalThis as any).window = {
    localStorage: {
      getItem: (k: string) => mockStorage.get(k) ?? null,
      setItem: (k: string, v: string) => mockStorage.set(k, String(v)),
      removeItem: (k: string) => mockStorage.delete(k),
    },
  };

  try {
    enqueueOfflineMutation({
      entity: 'tasks',
      action: 'UPSERT',
      payload: { id: 'task-localstorage-test', title: 'Saved in localStorage' },
    });

    const rawFromStorage = (globalThis as any).window.localStorage.getItem(OFFLINE_QUEUE_KEY);
    assert.ok(rawFromStorage, 'Item should be serialized into localStorage');
    const parsed = JSON.parse(rawFromStorage);
    assert.ok(Array.isArray(parsed));
    const lastItem = parsed[parsed.length - 1];
    assert.equal(lastItem.payload.id, 'task-localstorage-test');
  } finally {
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }
  }

  clearOfflineQueue();
  assert.equal(getOfflineQueueSize(), 0);
});

test('CampusOS Sync Engine (6/8): flushOfflineQueue successfully processes mutations and handles retries', async () => {
  clearOfflineQueue();

  enqueueOfflineMutation({
    entity: 'tasks',
    action: 'UPSERT',
    payload: { id: 'm-1' },
  });
  enqueueOfflineMutation({
    entity: 'tasks',
    action: 'UPSERT',
    payload: { id: 'm-2' },
  });
  assert.equal(getOfflineQueueSize(), 2);

  // Successful flush simulation
  const resultSuccess = await flushOfflineQueue(async () => true);
  assert.equal(resultSuccess.flushedCount, 2);
  assert.equal(resultSuccess.success, true);
  assert.equal(getOfflineQueueSize(), 0);

  // Partial flush simulation (1 succeeds, 1 fails)
  enqueueOfflineMutation({
    entity: 'tasks',
    action: 'UPSERT',
    payload: { id: 'm-pass' },
  });
  enqueueOfflineMutation({
    entity: 'tasks',
    action: 'UPSERT',
    payload: { id: 'm-fail' },
  });
  assert.equal(getOfflineQueueSize(), 2);

  const resultPartial = await flushOfflineQueue(async (mutation) => {
    return mutation.payload.id === 'm-pass';
  });

  assert.equal(resultPartial.flushedCount, 1);
  assert.equal(resultPartial.success, false);
  assert.equal(getOfflineQueueSize(), 1);

  const remaining = getOfflineQueue();
  assert.equal(remaining[0]!.payload.id, 'm-fail');
  assert.equal(remaining[0]!.retries, 1);

  clearOfflineQueue();
});

test('CampusOS Sync Engine (7/8): initCampusOSRealtimeSync in unconfigured/SSR environment returns teardown function cleanly', () => {
  let taskChanged = false;
  let notifChanged = false;
  let wsChanged = false;

  const teardown = initCampusOSRealtimeSync({
    onTaskChange: () => {
      taskChanged = true;
    },
    onNotification: () => {
      notifChanged = true;
    },
    onWorkspaceChange: () => {
      wsChanged = true;
    },
  });

  assert.equal(typeof teardown, 'function');
  // Invoking teardown should execute cleanly without error
  assert.doesNotThrow(() => {
    teardown();
  });
  assert.equal(taskChanged, false);
  assert.equal(notifChanged, false);
  assert.equal(wsChanged, false);
});

test('CampusOS Sync Engine (8/8): echo loop guard suppresses echo events from local client mutations', () => {
  clearTrackedLocalMutations();

  const testEntityId = 'task-local-mutation-abc';
  trackLocalMutation(testEntityId);

  // Echo payload from recent local mutation is detected
  const isEcho = isEchoEvent({
    new: { id: testEntityId, updated_at: new Date().toISOString() },
  });
  assert.equal(isEcho, true);

  // Remote mutation for a different entity is not an echo
  const isRemote = isEchoEvent({
    new: { id: 'other-user-task-xyz', updated_at: new Date().toISOString() },
  });
  assert.equal(isRemote, false);

  // After clearing, former local mutation is no longer flagged
  clearTrackedLocalMutations();
  const isEchoAfterClear = isEchoEvent({
    new: { id: testEntityId, updated_at: new Date().toISOString() },
  });
  assert.equal(isEchoAfterClear, false);
});
