import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  seedStudentOnboardingData,
  hasUserBeenSeeded,
  getSeededDataForUser,
  resetSeededState,
  generateDeterministicUuid,
  buildSeedPayload,
} from '../src/lib/auto-seed-engine.ts';

import {
  getSharedState,
  resetSharedState,
  syncStoreWithSeededData,
} from '../src/lib/campus-store.ts';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('First-Login Auto-Seeding Engine (R2)', () => {
  beforeEach(() => {
    resetSeededState();
    resetSharedState();
  });

  // ==========================================================================
  // SUITE 1: Fresh Student Account Provisioning
  // ==========================================================================
  describe('Suite 1: Fresh Student Account Provisioning', () => {
    test('1.1 Fresh student seeding provisions exactly 4 courses, 7 tasks, 10 events, and baseline stats', async () => {
      const testUserId = 'test-student-fresh-001';
      const refDate = new Date('2026-10-17T09:00:00Z');

      const res = await seedStudentOnboardingData(testUserId, { referenceDate: refDate });

      assert.equal(res.success, true);
      assert.equal(res.seeded, true);
      assert.equal(res.courseCount, 4);
      assert.equal(res.taskCount, 7);
      assert.equal(res.eventCount, 10);
      assert.ok(res.executionTimeMs < 1000, `Execution time ${res.executionTimeMs}ms exceeds 1000ms`);

      const seededData = getSeededDataForUser(testUserId);
      assert.ok(seededData, 'Seeded user data should be available in registry');

      // Verify Baseline Profile Stats
      assert.equal(seededData.profile.xp, 2840);
      assert.equal(seededData.profile.level, 7);
      assert.equal(seededData.profile.streak, 12);
      assert.equal(seededData.profile.rank_title, 'Sinh viên cày thuê');
      assert.equal(seededData.profile.onboarding_completed, true);
      assert.equal(seededData.profile.streak_freezes, 1);
      assert.equal(seededData.profile.study_minutes_total, 3120);
      assert.equal(seededData.profile.weekly_goal_minutes, 720);
      assert.equal(seededData.profile.weekly_study_minutes, 510);
      assert.equal(seededData.profile.vibe_theme, 'aurora');
    });

    test('1.2 Provisions exactly 4 realistic courses matching specifications', () => {
      const testUserId = 'test-student-courses-002';
      const payload = buildSeedPayload(testUserId);

      assert.equal(payload.courses.length, 4);

      const codes = payload.courses.map((c) => c.code);
      assert.ok(codes.includes('CS101'));
      assert.ok(codes.includes('CS201'));
      assert.ok(codes.includes('MATH101'));
      assert.ok(codes.includes('CS302'));

      const cs101 = payload.courses.find((c) => c.code === 'CS101')!;
      assert.match(cs101.name, /Mạng máy tính/i);
      assert.equal(cs101.credits, 4);
      assert.equal(cs101.instructor, 'TS. Lê Văn An');
      assert.equal(cs101.room, 'D201 · Tòa D');
      assert.equal(cs101.color, '#3DE8FF');
      assert.equal(cs101.status, 'ongoing');
      assert.match(cs101.id!, UUID_V4_REGEX);

      const cs201 = payload.courses.find((c) => c.code === 'CS201')!;
      assert.match(cs201.name, /Cấu trúc Dữ liệu & Giải thuật/i);
      assert.equal(cs201.credits, 4);
      assert.equal(cs201.instructor, 'TS. Trần Văn Bình');
      assert.equal(cs201.room, 'B305 · Tòa B');
      assert.equal(cs201.color, '#7C5CFF');

      const math101 = payload.courses.find((c) => c.code === 'MATH101')!;
      assert.match(math101.name, /Xác suất Thống kê/i);
      assert.equal(math101.credits, 3);
      assert.equal(math101.instructor, 'PGS. Nguyễn Thu Hà');
      assert.equal(math101.room, 'C101 · Tòa C');
      assert.equal(math101.color, '#FFB800');

      const cs302 = payload.courses.find((c) => c.code === 'CS302')!;
      assert.match(cs302.name, /Phát triển Ứng dụng Web/i);
      assert.equal(cs302.credits, 3);
      assert.equal(cs302.instructor, 'ThS. Hoàng Minh Đức');
      assert.equal(cs302.room, 'Lab 304 · Tòa A');
      assert.equal(cs302.color, '#C6FF3D');
    });

    test('1.3 Provisions exactly 7 tasks covering all 4 Eisenhower quadrants (Q1-Q4) with subtasks and Pomodoros', () => {
      const testUserId = 'test-student-tasks-003';
      const payload = buildSeedPayload(testUserId);

      assert.equal(payload.tasks.length, 7);

      const quadrants = new Set(payload.tasks.map((t) => t.quadrant));
      assert.ok(quadrants.has('do_first'), 'Must contain Q1 (do_first)');
      assert.ok(quadrants.has('schedule'), 'Must contain Q2 (schedule)');
      assert.ok(quadrants.has('delegate'), 'Must contain Q3 (delegate)');
      assert.ok(quadrants.has('eliminate'), 'Must contain Q4 (eliminate)');

      for (const t of payload.tasks) {
        assert.ok(t.title && t.title.length > 5, 'Task must have valid title');
        assert.ok(t.description && t.description.length > 10, 'Task must have Vietnamese description');
        assert.match(t.id!, UUID_V4_REGEX, 'Task id must be valid UUID');
        assert.ok(Array.isArray(t.subtasks), 'Task must have subtasks checklist');
        assert.ok((t.subtasks as any[]).length >= 2, 'Task must have at least 2 subtask steps');
        assert.ok(t.pomodoro_planned! >= 1, 'Task must have Pomodoro planned >= 1');
      }
    });

    test('1.4 Provisions exactly 10 calendar events dynamically anchored around reference date', () => {
      const testUserId = 'test-student-events-004';
      const refDate = new Date('2026-10-17T09:00:00Z');
      const payload = buildSeedPayload(testUserId, refDate);

      assert.equal(payload.events.length, 10);

      const eventTypes = new Set(payload.events.map((e) => e.event_type));
      assert.ok(eventTypes.has('class'), 'Must have class events');
      assert.ok(eventTypes.has('study'), 'Must have study events');
      assert.ok(eventTypes.has('exam'), 'Must have exam events');
      assert.ok(eventTypes.has('personal'), 'Must have personal events');

      for (const e of payload.events) {
        assert.ok(e.title && e.title.length > 0, 'Event must have title');
        assert.match(e.id!, UUID_V4_REGEX, 'Event id must be valid UUID');
        assert.ok(e.start_time, 'Event must have start_time');
        assert.ok(e.end_time, 'Event must have end_time');
        assert.ok(new Date(e.end_time).getTime() >= new Date(e.start_time).getTime(), 'end_time must be >= start_time');
      }
    });
  });

  // ==========================================================================
  // SUITE 2: Strict Idempotency & Zero Duplication
  // ==========================================================================
  describe('Suite 2: Strict Idempotency & Zero Duplication', () => {
    test('2.1 Running seedStudentOnboardingData 5 times consecutively produces zero duplicates and instant (<50ms) exit on calls 2..5', async () => {
      const testUserId = 'test-student-idempotency-005';
      const callDurations: number[] = [];

      // Call 1: Initial Provisioning
      const res1 = await seedStudentOnboardingData(testUserId);
      assert.equal(res1.success, true);
      assert.equal(res1.seeded, true);
      assert.equal(res1.courseCount, 4);
      assert.equal(res1.taskCount, 7);
      assert.equal(res1.eventCount, 10);
      callDurations.push(res1.executionTimeMs);

      // Calls 2 to 5: Idempotent Early Exits
      for (let i = 2; i <= 5; i++) {
        const resN = await seedStudentOnboardingData(testUserId);
        assert.equal(resN.success, true, `Call ${i} must succeed`);
        assert.equal(resN.seeded, false, `Call ${i} must NOT re-seed`);
        assert.equal(resN.courseCount, 4, `Call ${i} course count must remain 4`);
        assert.equal(resN.taskCount, 7, `Call ${i} task count must remain 7`);
        assert.equal(resN.eventCount, 10, `Call ${i} event count must remain 10`);
        assert.ok(
          resN.executionTimeMs < 50,
          `Call ${i} execution time ${resN.executionTimeMs}ms exceeds 50ms requirement`
        );
        callDurations.push(resN.executionTimeMs);
      }

      // Verify row counts in registry remain strictly 4, 7, 10
      const data = getSeededDataForUser(testUserId);
      assert.ok(data);
      assert.equal(data.courses.length, 4);
      assert.equal(data.tasks.length, 7);
      assert.equal(data.events.length, 10);

      // Confirm hasUserBeenSeeded returns true
      const hasSeeded = await hasUserBeenSeeded(testUserId);
      assert.equal(hasSeeded, true);
    });

    test('2.2 force option bypasses idempotency check when explicitly requested', async () => {
      const testUserId = 'test-student-force-006';

      const res1 = await seedStudentOnboardingData(testUserId);
      assert.equal(res1.seeded, true);

      // Subsequent call with force: true
      const resForced = await seedStudentOnboardingData(testUserId, { force: true });
      assert.equal(resForced.success, true);
      assert.equal(resForced.seeded, true);
      assert.equal(resForced.courseCount, 4);
    });
  });

  // ==========================================================================
  // SUITE 3: Sub-Second Performance Benchmark
  // ==========================================================================
  describe('Suite 3: Sub-Second Performance Benchmark', () => {
    test('3.1 Fresh account seeding benchmark runs in sub-second (< 1000ms)', async () => {
      const start = Date.now();
      const res = await seedStudentOnboardingData('test-bench-fresh-007');
      const totalElapsed = Date.now() - start;

      assert.equal(res.success, true);
      assert.ok(totalElapsed < 1000, `Total benchmark elapsed ${totalElapsed}ms exceeds 1000ms`);
      assert.ok(res.executionTimeMs < 1000, `Reported duration ${res.executionTimeMs}ms exceeds 1000ms`);
    });

    test('3.2 Average latency for 20 repeated checks is under 10ms', async () => {
      const testUserId = 'test-bench-latency-008';
      await seedStudentOnboardingData(testUserId);

      const latencies: number[] = [];
      for (let i = 0; i < 20; i++) {
        const t0 = performance.now();
        await seedStudentOnboardingData(testUserId);
        latencies.push(performance.now() - t0);
      }

      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      assert.ok(avg < 10, `Average latency ${avg}ms exceeds 10ms`);
    });
  });

  // ==========================================================================
  // SUITE 4: Deterministic UUID & Edge Cases
  // ==========================================================================
  describe('Suite 4: Deterministic UUID & Edge Cases', () => {
    test('4.1 generateDeterministicUuid produces valid v4 UUID and is strictly deterministic', () => {
      const u1 = 'user-uuid-alpha';
      const key = 'course_cs101';

      const uuid1 = generateDeterministicUuid(u1, key);
      const uuid2 = generateDeterministicUuid(u1, key);

      assert.equal(uuid1, uuid2, 'Deterministic UUID must be identical for same input');
      assert.match(uuid1, UUID_V4_REGEX, 'Must match RFC 4122 v4 format');

      const uuidDiffKey = generateDeterministicUuid(u1, 'course_cs201');
      assert.notEqual(uuid1, uuidDiffKey, 'Different keys must produce different UUIDs');

      const uuidDiffUser = generateDeterministicUuid('user-uuid-beta', key);
      assert.notEqual(uuid1, uuidDiffUser, 'Different users must produce different UUIDs');
    });

    test('4.2 Rejects empty or whitespace user IDs gracefully with error', async () => {
      const resEmpty = await seedStudentOnboardingData('');
      assert.equal(resEmpty.success, false);
      assert.equal(resEmpty.seeded, false);
      assert.ok(resEmpty.error);

      const resSpaces = await seedStudentOnboardingData('   ');
      assert.equal(resSpaces.success, false);
      assert.equal(resSpaces.seeded, false);
    });
  });

  // ==========================================================================
  // SUITE 5: Client Store Hydration Synchronization
  // ==========================================================================
  describe('Suite 5: Client Store Hydration Synchronization', () => {
    test('5.1 syncStoreWithSeededData synchronizes seeded data into campus-store state', async () => {
      const testUserId = 'test-student-store-sync-009';
      await seedStudentOnboardingData(testUserId);

      // Invoke syncStoreWithSeededData
      syncStoreWithSeededData(testUserId);

      const storeState = getSharedState();

      // Check gamification stats synchronized
      assert.equal(storeState.xp, 2840, 'Store XP must be strictly 2840');
      assert.equal(storeState.level, 7, 'Store Level must be strictly 7');
      assert.equal(storeState.streak, 12, 'Store Streak must be strictly 12');
      assert.equal(storeState.rankTitle, 'Sinh viên cày thuê');

      // Check tasks synchronized
      assert.equal(storeState.tasks.length, 7, 'Store tasks count must be strictly 7');

      // Check events synchronized
      assert.equal(storeState.events.length, 10, 'Store events count must be strictly 10');
    });

    test('5.2 Calling syncStoreWithSeededData multiple times does not duplicate tasks or events', async () => {
      const testUserId = 'test-student-store-idempotent-010';
      await seedStudentOnboardingData(testUserId);

      syncStoreWithSeededData(testUserId);
      const tasksCount1 = getSharedState().tasks.length;
      const eventsCount1 = getSharedState().events.length;

      assert.equal(tasksCount1, 7, 'Initial sync must yield strictly 7 tasks');
      assert.equal(eventsCount1, 10, 'Initial sync must yield strictly 10 events');

      syncStoreWithSeededData(testUserId);
      const tasksCount2 = getSharedState().tasks.length;
      const eventsCount2 = getSharedState().events.length;

      assert.equal(tasksCount1, tasksCount2, 'Task count must remain constant after multiple syncs');
      assert.equal(eventsCount1, eventsCount2, 'Event count must remain constant after multiple syncs');
    });
  });

  // ==========================================================================
  // SUITE 6: Auth Endpoints Wiring Verification
  // ==========================================================================
  describe('Suite 6: Auth Endpoints Wiring Verification', () => {
    test('6.1 login route imports and invokes seedStudentOnboardingData', () => {
      const loginRoutePath = path.resolve(process.cwd(), 'src', 'app', 'api', 'auth', 'login', 'route.ts');
      const content = fs.readFileSync(loginRoutePath, 'utf8');

      assert.ok(
        content.includes("from '@/lib/auto-seed-engine'"),
        'login/route.ts must import auto-seed-engine'
      );
      assert.ok(
        content.includes('seedStudentOnboardingData(user.id)'),
        'login/route.ts must call seedStudentOnboardingData with user.id'
      );
    });

    test('6.2 register route imports and invokes seedStudentOnboardingData', () => {
      const registerRoutePath = path.resolve(process.cwd(), 'src', 'app', 'api', 'auth', 'register', 'route.ts');
      const content = fs.readFileSync(registerRoutePath, 'utf8');

      assert.ok(
        content.includes("from '@/lib/auto-seed-engine'"),
        'register/route.ts must import auto-seed-engine'
      );
      assert.ok(
        content.includes('seedStudentOnboardingData(userId)'),
        'register/route.ts must call seedStudentOnboardingData with userId'
      );
    });

    test('6.3 me route imports and invokes seedStudentOnboardingData if onboarding is incomplete', () => {
      const meRoutePath = path.resolve(process.cwd(), 'src', 'app', 'api', 'auth', 'me', 'route.ts');
      const content = fs.readFileSync(meRoutePath, 'utf8');

      assert.ok(
        content.includes("from '@/lib/auto-seed-engine'"),
        'me/route.ts must import auto-seed-engine'
      );
      assert.ok(
        content.includes('seedStudentOnboardingData(user.id)'),
        'me/route.ts must call seedStudentOnboardingData if onboarding incomplete'
      );
      assert.ok(
        content.includes('onboarding_completed: true'),
        'me/route.ts payload must reflect accurate onboarding_completed state'
      );
    });
  });
});
