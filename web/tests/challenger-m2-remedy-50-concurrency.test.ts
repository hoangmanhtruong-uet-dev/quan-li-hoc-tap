/**
 * Milestone 2 Remedy Adversarial Challenger: 50 Concurrent Store Sync Calls & Hydration Stress Test
 *
 * Requirements:
 * 1. Verify 14 !== 7 bug is completely resolved: initial hydration yields strictly 7 tasks and 10 events.
 * 2. Execute 50 concurrent store sync calls on default initial state: verify zero item duplication (strictly 7 tasks, 10 events).
 * 3. Execute 50 concurrent store sync calls on state with custom user items: verify custom items are untouched and total is strictly custom + 7.
 * 4. Execute 50 concurrent store sync calls across multiple asynchronous ticks/promises simultaneously.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  seedStudentOnboardingData,
  resetSeededState,
  getSeededDataForUser,
} from '../src/lib/auto-seed-engine.ts';

import {
  getSharedState,
  resetSharedState,
  syncStoreWithSeededData,
  updateSharedState,
  type CampusOSSharedState,
  type CalendarEvent,
} from '../src/lib/campus-store.ts';

import type { TaskItem } from '../src/types/tasks.ts';

describe('CHALLENGER REMEDY VERIFICATION: 50 Concurrent Store Sync & Hydration', () => {
  beforeEach(() => {
    resetSeededState();
    resetSharedState();
  });

  test('C1. Initial hydration and single syncStoreWithSeededData produces strictly 7 tasks and 10 events (no 14 !== 7)', async () => {
    const studentId = 'challenger-remedy-verify-initial';
    await seedStudentOnboardingData(studentId);

    // Initial default shared state before sync contains legacy mock tasks (7) and legacy mock events (17)
    const initialState = getSharedState();
    assert.equal(initialState.tasks.length, 7, 'Default state initially has 7 legacy mock tasks');

    // Run syncStoreWithSeededData
    syncStoreWithSeededData(studentId);

    const postSyncState = getSharedState();

    // Adversarially assert STRICT equality
    assert.equal(
      postSyncState.tasks.length,
      7,
      `FATAL: Duplication detected! Expected strictly 7 tasks, found ${postSyncState.tasks.length}`
    );

    assert.equal(
      postSyncState.events.length,
      10,
      `FATAL: Duplication detected! Expected strictly 10 events, found ${postSyncState.events.length}`
    );

    // Verify all 7 tasks have unique UUIDs
    const taskIds = postSyncState.tasks.map((t) => t.id);
    const uniqueTaskIds = new Set(taskIds);
    assert.equal(uniqueTaskIds.size, 7, 'All 7 task IDs must be strictly unique');

    // Verify all 10 events have unique UUIDs
    const eventIds = postSyncState.events.map((e) => e.id);
    const uniqueEventIds = new Set(eventIds);
    assert.equal(uniqueEventIds.size, 10, 'All 10 event IDs must be strictly unique');

    // Verify baseline stats
    assert.equal(postSyncState.xp, 2840, 'Baseline XP must be 2840');
    assert.equal(postSyncState.level, 7, 'Baseline Level must be 7');
    assert.equal(postSyncState.streak, 12, 'Baseline Streak must be 12');
    assert.equal(postSyncState.rankTitle, 'Sinh viên cày thuê');
  });

  test('C2. 50 concurrent store sync calls on default initial store state yield zero item duplication', async () => {
    const studentId = 'challenger-50-concurrent-default';
    await seedStudentOnboardingData(studentId);

    // Reset store to fresh default legacy mock state
    resetSharedState();

    // Fire 50 concurrent store sync calls simultaneously via Promise.all
    const syncOperations = Array.from({ length: 50 }, (_, idx) => {
      return new Promise<void>((resolve) => {
        // Introduce micro-task jitter to test interleaved race conditions
        queueMicrotask(() => {
          syncStoreWithSeededData(studentId);
          resolve();
        });
      });
    });

    await Promise.all(syncOperations);

    const finalState = getSharedState();

    // Verify exactly 7 tasks and 10 events
    assert.equal(
      finalState.tasks.length,
      7,
      `Expected strictly 7 tasks after 50 concurrent syncs, but got ${finalState.tasks.length}`
    );

    assert.equal(
      finalState.events.length,
      10,
      `Expected strictly 10 events after 50 concurrent syncs, but got ${finalState.events.length}`
    );

    // Verify no duplicated task IDs
    const taskIds = finalState.tasks.map((t) => t.id);
    const uniqueTaskIds = new Set(taskIds);
    assert.equal(uniqueTaskIds.size, 7, 'Task IDs must all be unique');

    // Verify no duplicated event IDs
    const eventIds = finalState.events.map((e) => e.id);
    const uniqueEventIds = new Set(eventIds);
    assert.equal(uniqueEventIds.size, 10, 'Event IDs must all be unique');

    // Verify no duplicate deadline titles
    const deadlineTitles = finalState.deadlines.map((d) => d.title.trim().toLowerCase());
    const uniqueDeadlineTitles = new Set(deadlineTitles);
    assert.equal(
      uniqueDeadlineTitles.size,
      deadlineTitles.length,
      'Deadlines must not contain duplicated titles'
    );
  });

  test('C3. 50 concurrent store sync calls on clean empty store yield strictly 7 tasks and 10 events', async () => {
    const studentId = 'challenger-50-concurrent-empty';
    await seedStudentOnboardingData(studentId);

    // Clean out all tasks and events
    updateSharedState((prev) => ({
      ...prev,
      tasks: [],
      events: [],
      deadlines: [],
    }));

    // Fire 50 concurrent sync calls in parallel
    await Promise.all(
      Array.from({ length: 50 }, () =>
        Promise.resolve().then(() => syncStoreWithSeededData(studentId))
      )
    );

    const finalState = getSharedState();
    assert.equal(finalState.tasks.length, 7, 'Must have strictly 7 tasks');
    assert.equal(finalState.events.length, 10, 'Must have strictly 10 events');

    const uniqueTaskIds = new Set(finalState.tasks.map((t) => t.id));
    assert.equal(uniqueTaskIds.size, 7);

    const uniqueEventIds = new Set(finalState.events.map((e) => e.id));
    assert.equal(uniqueEventIds.size, 10);
  });

  test('C4. 50 concurrent store sync calls with pre-existing user items preserve all user items and add exactly 7 tasks, 10 events', async () => {
    const studentId = 'challenger-50-concurrent-preserve-user';
    await seedStudentOnboardingData(studentId);

    // Pre-populate store with 3 custom user tasks and 2 custom user events
    const customTasks: TaskItem[] = [
      {
        id: 'user-custom-task-alpha',
        title: 'Nhiệm vụ riêng của tôi 1',
        status: 'todo',
        priority: 'high',
        difficulty: 2,
        dueAt: '2026-10-25T12:00:00Z',
        estimateMin: 45,
        actualMin: 0,
        steps: [],
        tags: ['Important'],
        pomodoros: { planned: 2, done: 0 },
        quadrant: 'do_first',
        order: 1,
        createdAt: '2026-10-17T00:00:00Z',
      },
      {
        id: 'user-custom-task-beta',
        title: 'Nhiệm vụ riêng của tôi 2',
        status: 'doing',
        priority: 'medium',
        difficulty: 3,
        dueAt: '2026-10-26T12:00:00Z',
        estimateMin: 60,
        actualMin: 20,
        steps: [],
        tags: [],
        pomodoros: { planned: 3, done: 1 },
        quadrant: 'schedule',
        order: 2,
        createdAt: '2026-10-17T00:00:00Z',
      },
      {
        id: 'user-custom-task-gamma',
        title: 'Nhiệm vụ riêng của tôi 3',
        status: 'done',
        priority: 'low',
        difficulty: 1,
        dueAt: '2026-10-20T12:00:00Z',
        estimateMin: 15,
        actualMin: 15,
        steps: [],
        tags: [],
        pomodoros: { planned: 1, done: 1 },
        quadrant: 'eliminate',
        order: 3,
        createdAt: '2026-10-17T00:00:00Z',
      },
    ];

    const customEvents: CalendarEvent[] = [
      {
        id: 'user-custom-event-1',
        title: 'Gặp gỡ nhóm đồ án',
        date: '2026-10-22',
        start: '14:00',
        end: '16:00',
        type: 'study',
        location: 'Thư viện Tầng 3',
        color: '#6366f1',
        done: false,
      },
      {
        id: 'user-custom-event-2',
        title: 'Sinh hoạt chi đoàn',
        date: '2026-10-24',
        start: '19:00',
        end: '20:30',
        type: 'personal',
        location: 'Online Zoom',
        color: '#ec4899',
        done: false,
      },
    ];

    updateSharedState((prev) => ({
      ...prev,
      tasks: customTasks,
      events: customEvents,
      xp: 3200, // Higher than seeded 2840
      level: 9,
      streak: 18,
    }));

    // Fire 50 concurrent sync calls
    await Promise.all(
      Array.from({ length: 50 }, (_, i) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            syncStoreWithSeededData(studentId);
            resolve();
          }, (i % 5));
        });
      })
    );

    const finalState = getSharedState();

    // Verify 3 custom tasks + 7 seeded tasks = exactly 10 tasks
    assert.equal(
      finalState.tasks.length,
      3 + 7,
      `Expected strictly 10 tasks (3 custom + 7 seeded), got ${finalState.tasks.length}`
    );

    // Verify 2 custom events + 10 seeded events = exactly 12 events
    assert.equal(
      finalState.events.length,
      2 + 10,
      `Expected strictly 12 events (2 custom + 10 seeded), got ${finalState.events.length}`
    );

    // Verify each custom task is present and uncorrupted
    for (const ct of customTasks) {
      const found = finalState.tasks.find((t) => t.id === ct.id);
      assert.ok(found, `Custom task ${ct.id} must be preserved`);
      assert.equal(found.title, ct.title);
      assert.equal(found.status, ct.status);
    }

    // Verify each custom event is present and uncorrupted
    for (const ce of customEvents) {
      const found = finalState.events.find((e) => e.id === ce.id);
      assert.ok(found, `Custom event ${ce.id} must be preserved`);
      assert.equal(found.title, ce.title);
    }

    // Verify stats were not downgraded
    assert.equal(finalState.xp, 3200, 'User higher XP must remain 3200');
    assert.equal(finalState.level, 9, 'User higher Level must remain 9');
    assert.equal(finalState.streak, 18, 'User higher Streak must remain 18');
  });

  test('C5. 50 concurrent calls to seedStudentOnboardingData for the same user ID produce exactly 1 seeded execution and 49 idempotent cached returns', async () => {
    const studentId = 'challenger-50-concurrent-seed-engine';

    const t0 = performance.now();
    const results = await Promise.all(
      Array.from({ length: 50 }, () => seedStudentOnboardingData(studentId))
    );
    const totalElapsed = performance.now() - t0;

    assert.equal(results.length, 50);

    const seededList = results.filter((r) => r.seeded === true);
    const unseededList = results.filter((r) => r.seeded === false);

    assert.equal(
      seededList.length,
      1,
      `Expected exactly 1 leader seeded execution, got ${seededList.length}`
    );
    assert.equal(
      unseededList.length,
      49,
      `Expected 49 idempotent returns, got ${unseededList.length}`
    );

    for (const r of results) {
      assert.equal(r.success, true);
      assert.equal(r.courseCount, 4);
      assert.equal(r.taskCount, 7);
      assert.equal(r.eventCount, 10);
    }

    // Verify total time is well under 1000ms SLA
    assert.ok(
      totalElapsed < 1000,
      `50 concurrent seed queries took ${totalElapsed.toFixed(2)}ms, exceeding 1000ms SLA`
    );
  });
});
