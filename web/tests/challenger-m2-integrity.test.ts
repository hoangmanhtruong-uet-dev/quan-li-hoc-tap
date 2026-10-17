/**
 * Milestone 2 Adversarial Challenge Test Suite
 * Independent empirical verification of data integrity, Eisenhower coverage,
 * dynamic calendar anchoring, profile baseline stats, and store synchronization non-clobbering.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  seedStudentOnboardingData,
  buildSeedPayload,
  getSeededDataForUser,
  resetSeededState,
  generateDeterministicUuid,
} from '../src/lib/auto-seed-engine.ts';

import {
  getSharedState,
  resetSharedState,
  syncStoreWithSeededData,
  updateSharedState,
  type CampusOSSharedState,
} from '../src/lib/campus-store.ts';

import type { TaskItem } from '../src/types/tasks.ts';
import type { CalendarEvent } from '../src/lib/campus-store.ts';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('CHALLENGER M2: Data Integrity & Store Synchronization', () => {
  beforeEach(() => {
    resetSeededState();
    resetSharedState();
  });

  // =========================================================================
  // 1. Course Specification & Integrity
  // =========================================================================
  describe('1. Course Specifications & Data Integrity', () => {
    test('1.1 Exactly 4 courses with correct codes, titles, instructors, and colors', () => {
      const userId = 'challenger-test-student-courses';
      const payload = buildSeedPayload(userId);

      assert.equal(payload.courses.length, 4, 'Must have exactly 4 courses');

      const expectedCourses = [
        {
          code: 'CS101',
          nameIncludes: 'Mạng máy tính & Truyền thông',
          instructor: 'TS. Lê Văn An',
          color: '#3DE8FF',
          credits: 4,
          room: 'D201 · Tòa D',
        },
        {
          code: 'CS201',
          nameIncludes: 'Cấu trúc Dữ liệu & Giải thuật',
          instructor: 'TS. Trần Văn Bình',
          color: '#7C5CFF',
          credits: 4,
          room: 'B305 · Tòa B',
        },
        {
          code: 'MATH101',
          nameIncludes: 'Xác suất Thống kê',
          instructor: 'PGS. Nguyễn Thu Hà',
          color: '#FFB800',
          credits: 3,
          room: 'C101 · Tòa C',
        },
        {
          code: 'CS302',
          nameIncludes: 'Phát triển Ứng dụng Web',
          instructor: 'ThS. Hoàng Minh Đức',
          color: '#C6FF3D',
          credits: 3,
          room: 'Lab 304 · Tòa A',
        },
      ];

      for (const expected of expectedCourses) {
        const found = payload.courses.find((c) => c.code === expected.code);
        assert.ok(found, `Course ${expected.code} must exist`);
        assert.ok(
          found.name.includes(expected.nameIncludes),
          `Course ${expected.code} title "${found.name}" must contain "${expected.nameIncludes}"`
        );
        assert.equal(found.instructor, expected.instructor, `Course ${expected.code} instructor mismatch`);
        assert.equal(found.color, expected.color, `Course ${expected.code} color mismatch`);
        assert.equal(found.credits, expected.credits, `Course ${expected.code} credits mismatch`);
        assert.equal(found.room, expected.room, `Course ${expected.code} room mismatch`);
        assert.match(found.id!, UUID_V4_REGEX, `Course ${expected.code} id must be valid v4 UUID`);
        assert.equal(found.user_id, userId, `Course ${expected.code} user_id must match userId`);
        assert.ok(Array.isArray(found.grade_components), `Course ${expected.code} must have grade components`);
        assert.ok(found.grade_components.length >= 3, `Course ${expected.code} must have >= 3 grade components`);
      }
    });
  });

  // =========================================================================
  // 2. Task Specifications & Eisenhower Coverage
  // =========================================================================
  describe('2. Tasks & Eisenhower Quadrant Coverage', () => {
    test('2.1 Exactly 7 tasks covering all 4 quadrants (do_first, schedule, delegate, eliminate)', () => {
      const userId = 'challenger-test-student-tasks';
      const payload = buildSeedPayload(userId);

      assert.equal(payload.tasks.length, 7, 'Must provision exactly 7 tasks');

      const quadrantCounts: Record<string, number> = {
        do_first: 0,
        schedule: 0,
        delegate: 0,
        eliminate: 0,
      };

      for (const t of payload.tasks) {
        assert.ok(t.quadrant && t.quadrant in quadrantCounts, `Invalid quadrant ${t.quadrant}`);
        quadrantCounts[t.quadrant]++;

        // Validation of individual task attributes
        assert.match(t.id!, UUID_V4_REGEX, `Task "${t.title}" ID must be valid v4 UUID`);
        assert.ok(t.title && t.title.trim().length > 0, 'Task must have non-empty title');
        assert.ok(t.description && t.description.trim().length > 0, 'Task must have non-empty description');
        assert.ok(t.course, `Task "${t.title}" must specify course`);
        assert.ok(t.due_date, `Task "${t.title}" must specify due_date`);
        assert.ok(t.estimated_minutes && t.estimated_minutes > 0, `Task "${t.title}" must have estimated_minutes > 0`);

        // Subtask validation
        assert.ok(Array.isArray(t.subtasks), `Task "${t.title}" subtasks must be an array`);
        const subtasks = t.subtasks as Array<{ id: string; text: string; done: boolean }>;
        assert.ok(subtasks.length >= 2, `Task "${t.title}" must have at least 2 subtasks`);
        for (const st of subtasks) {
          assert.ok(st.id, 'Subtask must have id');
          assert.ok(st.text, 'Subtask must have text');
          assert.equal(typeof st.done, 'boolean', 'Subtask done must be boolean');
        }

        // Pomodoro validation
        assert.ok(typeof t.pomodoro_planned === 'number' && t.pomodoro_planned >= 1, `Task "${t.title}" must have pomodoro_planned >= 1`);
        assert.ok(typeof t.pomodoro_done === 'number' && t.pomodoro_done >= 0, `Task "${t.title}" must have pomodoro_done >= 0`);
      }

      // Check all 4 quadrants have >= 1 task
      assert.ok(quadrantCounts.do_first >= 1, `do_first quadrant must have >= 1 task, got ${quadrantCounts.do_first}`);
      assert.ok(quadrantCounts.schedule >= 1, `schedule quadrant must have >= 1 task, got ${quadrantCounts.schedule}`);
      assert.ok(quadrantCounts.delegate >= 1, `delegate quadrant must have >= 1 task, got ${quadrantCounts.delegate}`);
      assert.ok(quadrantCounts.eliminate >= 1, `eliminate quadrant must have >= 1 task, got ${quadrantCounts.eliminate}`);

      assert.equal(
        quadrantCounts.do_first + quadrantCounts.schedule + quadrantCounts.delegate + quadrantCounts.eliminate,
        7,
        'Sum of quadrant tasks must equal 7'
      );
    });
  });

  // =========================================================================
  // 3. Calendar Events & Dynamic Temporal Anchoring
  // =========================================================================
  describe('3. Calendar Events Dynamic Temporal Anchoring', () => {
    test('3.1 Exactly 10 events spanning past and future relative to today', () => {
      const userId = 'challenger-test-student-events';
      const refDate = new Date('2026-10-17T09:00:00Z');
      const payload = buildSeedPayload(userId, refDate);

      assert.equal(payload.events.length, 10, 'Must provision exactly 10 calendar events');

      const refDayTime = new Date('2026-10-17T00:00:00Z').getTime();
      const nextDayTime = new Date('2026-10-18T00:00:00Z').getTime();

      let pastCount = 0;
      let todayCount = 0;
      let futureCount = 0;

      const eventTypes = new Set<string>();

      for (const e of payload.events) {
        assert.match(e.id!, UUID_V4_REGEX, `Event "${e.title}" must have valid v4 UUID`);
        assert.ok(e.title && e.title.length > 0, 'Event title required');
        assert.ok(e.start_time, 'Event start_time required');
        assert.ok(e.end_time, 'Event end_time required');
        assert.ok(e.color, 'Event color required');

        const startTime = new Date(e.start_time).getTime();
        const endTime = new Date(e.end_time).getTime();
        assert.ok(endTime > startTime, `Event "${e.title}" end_time must be strictly after start_time`);

        if (startTime < refDayTime) {
          pastCount++;
        } else if (startTime >= refDayTime && startTime < nextDayTime) {
          todayCount++;
        } else {
          futureCount++;
        }

        eventTypes.add(e.event_type);
      }

      assert.ok(pastCount >= 2, `Must have at least 2 past events relative to ref date (found ${pastCount})`);
      assert.ok(todayCount >= 1, `Must have at least 1 today event (found ${todayCount})`);
      assert.ok(futureCount >= 2, `Must have at least 2 future events relative to ref date (found ${futureCount})`);

      assert.ok(eventTypes.has('class'), 'Events must include "class"');
      assert.ok(eventTypes.has('study'), 'Events must include "study"');
      assert.ok(eventTypes.has('exam'), 'Events must include "exam"');
      assert.ok(eventTypes.has('personal'), 'Events must include "personal"');
    });
  });

  // =========================================================================
  // 4. Baseline Profile Gamification Stats
  // =========================================================================
  describe('4. Baseline Profile Gamification Stats', () => {
    test('4.1 Profile contains exact required baseline stats: XP 2840, level 7, streak 12, rank "Sinh viên cày thuê"', () => {
      const userId = 'challenger-test-student-profile';
      const payload = buildSeedPayload(userId);

      assert.equal(payload.profile.xp, 2840, 'Baseline XP must be 2840');
      assert.equal(payload.profile.level, 7, 'Baseline Level must be 7');
      assert.equal(payload.profile.streak, 12, 'Baseline Streak must be 12');
      assert.equal(payload.profile.rank_title, 'Sinh viên cày thuê', 'Baseline rank title mismatch');
      assert.equal(payload.profile.onboarding_completed, true, 'onboarding_completed must be true');
      assert.equal(payload.profile.streak_freezes, 1, 'streak_freezes must be 1');
      assert.equal(payload.profile.vibe_theme, 'aurora', 'Default vibe theme must be aurora');
    });
  });

  // =========================================================================
  // 5. Store Synchronization & Non-Clobbering Verification
  // =========================================================================
  describe('5. Store Synchronization & Existing User Data Protection', () => {
    test('5.1 Fresh store gets all 7 seeded tasks, 10 events, and baseline stats', async () => {
      const userId = 'challenger-sync-fresh-001';
      await seedStudentOnboardingData(userId);

      syncStoreWithSeededData(userId);

      const state = getSharedState();
      assert.equal(state.tasks.length, 7, 'Fresh store should contain all 7 seeded tasks');
      assert.equal(state.events.length, 10, 'Fresh store should contain all 10 seeded events');
      assert.equal(state.xp, 2840, 'Fresh store XP should be 2840');
      assert.equal(state.level, 7, 'Fresh store Level should be 7');
      assert.equal(state.streak, 12, 'Fresh store Streak should be 12');
      assert.equal(state.rankTitle, 'Sinh viên cày thuê');
    });

    test('5.2 Non-clobbering: existing user tasks and events are strictly preserved when syncing seeded data', async () => {
      const userId = 'challenger-sync-existing-002';
      await seedStudentOnboardingData(userId);

      // Create pre-existing user items in store
      const customTask1: TaskItem = {
        id: 'custom-user-task-1',
        title: 'Nhiệm vụ cá nhân của người dùng A',
        description: 'Mô tả nhiệm vụ riêng',
        course: 'Môn tự chọn',
        status: 'doing',
        priority: 'high',
        difficulty: 4,
        dueAt: '2026-10-25T12:00:00Z',
        estimateMin: 50,
        actualMin: 15,
        steps: [{ id: 'cust-s1', text: 'Bước 1', done: true }],
        tags: ['Custom'],
        pomodoros: { planned: 2, done: 1 },
        quadrant: 'do_first',
        order: 99,
        createdAt: '2026-10-15T00:00:00Z',
      };

      const customTask2: TaskItem = {
        id: 'custom-user-task-2',
        title: 'Nhiệm vụ cá nhân của người dùng B',
        status: 'todo',
        priority: 'low',
        difficulty: 1,
        dueAt: '2026-10-30T12:00:00Z',
        estimateMin: 30,
        actualMin: 0,
        steps: [],
        tags: [],
        pomodoros: { planned: 1, done: 0 },
        quadrant: 'eliminate',
        order: 100,
        createdAt: '2026-10-15T00:00:00Z',
      };

      const customEvent: CalendarEvent = {
        id: 'custom-user-event-1',
        title: 'Đi gặp cố vấn học tập',
        date: '2026-10-20',
        start: '15:00',
        end: '16:00',
        type: 'personal',
        location: 'Văn phòng khoa',
        color: '#10b981',
        done: false,
      };

      // Set pre-existing store state with higher gamification stats
      updateSharedState((prev) => ({
        ...prev,
        tasks: [customTask1, customTask2],
        events: [customEvent],
        xp: 4500, // Higher than seeded 2840
        level: 11, // Higher than seeded 7
        streak: 25, // Higher than seeded 12
        rankTitle: 'Chiến thần đồ án', // Custom rank
      }));

      // Now invoke syncStoreWithSeededData
      syncStoreWithSeededData(userId);

      const postSyncState = getSharedState();

      // Assert pre-existing custom tasks are preserved
      const foundCustom1 = postSyncState.tasks.find((t) => t.id === 'custom-user-task-1');
      const foundCustom2 = postSyncState.tasks.find((t) => t.id === 'custom-user-task-2');
      assert.ok(foundCustom1, 'Custom user task 1 must NOT be clobbered');
      assert.equal(foundCustom1.title, 'Nhiệm vụ cá nhân của người dùng A');
      assert.ok(foundCustom2, 'Custom user task 2 must NOT be clobbered');
      assert.equal(foundCustom2.title, 'Nhiệm vụ cá nhân của người dùng B');

      // Assert pre-existing custom event is preserved
      const foundCustomEvent = postSyncState.events.find((e) => e.id === 'custom-user-event-1');
      assert.ok(foundCustomEvent, 'Custom user event must NOT be clobbered');
      assert.equal(foundCustomEvent.title, 'Đi gặp cố vấn học tập');

      // Assert all 7 seeded tasks were also added
      assert.equal(
        postSyncState.tasks.length,
        2 + 7,
        'Total tasks must be 2 existing + 7 seeded = 9'
      );

      // Assert all 10 seeded events were also added
      assert.equal(
        postSyncState.events.length,
        1 + 10,
        'Total events must be 1 existing + 10 seeded = 11'
      );

      // Assert higher user stats were NOT downgraded
      assert.equal(postSyncState.xp, 4500, 'User higher XP (4500) must NOT be downgraded to 2840');
      assert.equal(postSyncState.level, 11, 'User higher level (11) must NOT be downgraded to 7');
      assert.equal(postSyncState.streak, 25, 'User higher streak (25) must NOT be downgraded to 12');
      assert.equal(postSyncState.rankTitle, 'Chiến thần đồ án', 'User existing rankTitle must NOT be overwritten');
    });

    test('5.3 Overlapping seeded items: does not create duplicate entries when synced repeatedly', async () => {
      const userId = 'challenger-sync-idempotent-003';
      await seedStudentOnboardingData(userId);

      syncStoreWithSeededData(userId);
      const firstRunTasks = getSharedState().tasks.length;
      const firstRunEvents = getSharedState().events.length;

      // Sync 3 more times
      syncStoreWithSeededData(userId);
      syncStoreWithSeededData(userId);
      syncStoreWithSeededData(userId);

      const finalState = getSharedState();
      assert.equal(finalState.tasks.length, firstRunTasks, 'Tasks length must remain invariant');
      assert.equal(finalState.events.length, firstRunEvents, 'Events length must remain invariant');

      // Verify task IDs are distinct
      const taskIds = finalState.tasks.map((t) => t.id);
      const uniqueTaskIds = new Set(taskIds);
      assert.equal(uniqueTaskIds.size, taskIds.length, 'No duplicate task IDs allowed');

      // Verify event IDs are distinct
      const eventIds = finalState.events.map((e) => e.id);
      const uniqueEventIds = new Set(eventIds);
      assert.equal(uniqueEventIds.size, eventIds.length, 'No duplicate event IDs allowed');
    });
  });
});
