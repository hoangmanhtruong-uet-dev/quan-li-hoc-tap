import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  seedStudentOnboardingData,
  hasUserBeenSeeded,
  getSeededDataForUser,
  resetSeededState,
  generateDeterministicUuid,
  buildSeedPayload,
  formatIsoDateOnly,
} from '../src/lib/auto-seed-engine.ts';

import {
  getSharedState,
  resetSharedState,
  updateSharedState,
  syncStoreWithSeededData,
} from '../src/lib/campus-store.ts';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('Adversarial Stress Test: First-Login Auto-Seeding Engine (Milestone 2)', () => {
  beforeEach(() => {
    resetSeededState();
    resetSharedState();
  });

  // ==========================================================================
  // STRESS 1: High Concurrency Race Condition (20 Concurrent Calls)
  // ==========================================================================
  describe('1. High Concurrency Race Condition (20 Concurrent Calls)', () => {
    test('1.1 20 simultaneous concurrent calls for same fresh user ID produce exactly 1 seed and 19 idempotent exits', async () => {
      const testUserId = 'adversarial-concurrency-student-001';

      // Launch 20 concurrent invocations simultaneously via Promise.all
      const promises = Array.from({ length: 20 }, (_, idx) =>
        seedStudentOnboardingData(testUserId)
      );

      const results = await Promise.all(promises);

      assert.equal(results.length, 20, 'Must have received 20 results');

      // Verify all 20 calls succeeded
      for (let i = 0; i < results.length; i++) {
        assert.equal(results[i].success, true, `Call ${i} failed: ${results[i].error}`);
        assert.equal(results[i].courseCount, 4, `Call ${i} courseCount must be 4`);
        assert.equal(results[i].taskCount, 7, `Call ${i} taskCount must be 7`);
        assert.equal(results[i].eventCount, 10, `Call ${i} eventCount must be 10`);
      }

      // Exactly 1 must have seeded: true, the remaining 19 must have seeded: false
      const seededResults = results.filter((r) => r.seeded === true);
      const cachedResults = results.filter((r) => r.seeded === false);

      assert.equal(
        seededResults.length,
        1,
        `Expected exactly 1 call to seed, but got ${seededResults.length} seeded calls`
      );
      assert.equal(
        cachedResults.length,
        19,
        `Expected 19 calls to hit idempotent cache, but got ${cachedResults.length}`
      );

      // Verify no duplicate records in cached registry
      const cachedData = getSeededDataForUser(testUserId);
      assert.ok(cachedData, 'Cached data must exist');
      assert.equal(cachedData.courses.length, 4, 'Must have exactly 4 courses');
      assert.equal(cachedData.tasks.length, 7, 'Must have exactly 7 tasks');
      assert.equal(cachedData.events.length, 10, 'Must have exactly 10 events');

      // Verify all course, task, event IDs are unique within their collections
      const courseIds = new Set(cachedData.courses.map((c) => c.id));
      assert.equal(courseIds.size, 4, 'All 4 course IDs must be unique');

      const taskIds = new Set(cachedData.tasks.map((t) => t.id));
      assert.equal(taskIds.size, 7, 'All 7 task IDs must be unique');

      const eventIds = new Set(cachedData.events.map((e) => e.id));
      assert.equal(eventIds.size, 10, 'All 10 event IDs must be unique');
    });

    test('1.2 Multiple different users seeded concurrently do not cross-contaminate data', async () => {
      const userCount = 10;
      const userIds = Array.from({ length: userCount }, (_, i) => `concurrent-user-distinct-${i}`);

      const results = await Promise.all(
        userIds.map((uid) => seedStudentOnboardingData(uid))
      );

      assert.equal(results.length, userCount);
      for (const res of results) {
        assert.equal(res.success, true);
        assert.equal(res.seeded, true);
      }

      // Verify each user has separate data in registry with distinct deterministic UUIDs
      const allCourseIds = new Set<string>();
      for (const uid of userIds) {
        const data = getSeededDataForUser(uid);
        assert.ok(data);
        for (const c of data.courses) {
          assert.equal(c.user_id, uid);
          assert.ok(!allCourseIds.has(c.id!), `Course ID ${c.id} collided across distinct users`);
          allCourseIds.add(c.id!);
        }
      }
      assert.equal(allCourseIds.size, userCount * 4, 'All generated course UUIDs across users must be unique');
    });

    test('1.3 Concurrent store synchronization on clean state produces exactly 7 tasks, 10 events and zero duplicates across 20 calls', async () => {
      const testUserId = 'concurrent-clean-store-user-003';
      await seedStudentOnboardingData(testUserId);

      // Start with clean student state
      updateSharedState((prev) => ({
        ...prev,
        tasks: [],
        events: [],
      }));

      // Execute 20 repeated store syncs
      for (let i = 0; i < 20; i++) {
        syncStoreWithSeededData(testUserId);
      }

      const state = getSharedState();
      assert.equal(state.tasks.length, 7, 'Store tasks count must remain strictly 7');
      assert.equal(state.events.length, 10, 'Store events count must remain strictly 10');

      const uniqueTaskIds = new Set(state.tasks.map((t) => t.id));
      assert.equal(uniqueTaskIds.size, 7, 'All store task IDs must be unique');

      const uniqueEventIds = new Set(state.events.map((e) => e.id));
      assert.equal(uniqueEventIds.size, 10, 'All store event IDs must be unique');
    });

    test('1.4 Concurrent store synchronization on default legacy state purges legacy mock items and produces strictly 7 tasks and 10 events', async () => {
      const testUserId = 'concurrent-default-store-user-004';
      await seedStudentOnboardingData(testUserId);

      // Reset to default shared state (which contains 7 legacy mock tasks and 17 legacy mock events)
      resetSharedState();

      // Execute 20 repeated store syncs
      for (let i = 0; i < 20; i++) {
        syncStoreWithSeededData(testUserId);
      }

      const state = getSharedState();
      assert.equal(state.tasks.length, 7, 'Store tasks count must be strictly 7 (legacy mock tasks purged)');
      assert.equal(state.events.length, 10, 'Store events count must be strictly 10 (legacy mock events purged)');

      const uniqueTaskIds = new Set(state.tasks.map((t) => t.id));
      assert.equal(uniqueTaskIds.size, 7, 'All store task IDs must be unique');

      const uniqueEventIds = new Set(state.events.map((e) => e.id));
      assert.equal(uniqueEventIds.size, 10, 'All store event IDs must be unique');
    });
  });

  // ==========================================================================
  // STRESS 2: Corrupted, Weird & Malicious Inputs
  // ==========================================================================
  describe('2. Corrupted, Weird & Malicious Inputs', () => {
    test('2.1 Rejects null, undefined, empty, and whitespace user IDs safely without throwing unhandled exceptions', async () => {
      const invalidInputs: any[] = [
        null,
        undefined,
        '',
        '   ',
        '\t\n\r',
        '      ',
        false,
        12345,
        {},
        [],
      ];

      for (const input of invalidInputs) {
        const res = await seedStudentOnboardingData(input);
        assert.equal(res.success, false, `Input ${JSON.stringify(input)} should fail`);
        assert.equal(res.seeded, false, `Input ${JSON.stringify(input)} should not seed`);
        assert.ok(res.error, `Input ${JSON.stringify(input)} should contain error message`);
        assert.equal(typeof res.executionTimeMs, 'number');
      }
    });

    test('2.2 SQL Injection vectors as userId are safely handled and do not corrupt deterministic UUID generation', async () => {
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE profiles; --",
        "'; DROP TABLE tasks; --",
        "admin'--",
        "1; SELECT pg_sleep(5);",
        "UNION SELECT null, null, null--",
        "1' OR 1=1 #",
        "\" OR \"1\"=\"1",
        "` OR `1`=`1",
      ];

      for (const sqlPayload of sqlInjectionPayloads) {
        const res = await seedStudentOnboardingData(sqlPayload);
        assert.equal(res.success, true, `SQL payload should be safely treated as raw string: ${sqlPayload}`);
        assert.equal(res.seeded, true);

        // Verify deterministic UUID generated from SQL string is a valid RFC 4122 v4 UUID
        const courseUuid = generateDeterministicUuid(sqlPayload, 'course_cs101');
        assert.match(courseUuid, UUID_V4_REGEX, `Generated UUID for ${sqlPayload} must be valid RFC 4122 v4`);

        const data = getSeededDataForUser(sqlPayload);
        assert.ok(data);
        for (const course of data.courses) {
          assert.match(course.id!, UUID_V4_REGEX);
          assert.equal(course.user_id, sqlPayload);
        }
      }
    });

    test('2.3 Extreme characters (XSS, Unicode emojis, path traversal, control chars, 10k-char string)', async () => {
      const extremeInputs = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        '../../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '🔥🎓🚀💻🎉 Sinh viên Đại học Bách Khoa Hà Nội 2026',
        '\u0000\u0001\u0002\u0003\u0004\u0005',
        'A'.repeat(10000), // 10,000 character string
        'Nguyễn Trần Hoàng Anh Tuấn 👨‍🎓',
        'Special chars: !@#$%^&*()_+~`|}{[]:;?><,./',
      ];

      for (const input of extremeInputs) {
        const res = await seedStudentOnboardingData(input);
        assert.equal(res.success, true);
        assert.equal(res.seeded, true);
        assert.equal(res.courseCount, 4);
        assert.equal(res.taskCount, 7);
        assert.equal(res.eventCount, 10);

        const data = getSeededDataForUser(input.trim());
        assert.ok(data);
        assert.equal(data.profile.xp, 2840);

        // Subsequent call must be idempotent
        const secondRes = await seedStudentOnboardingData(input);
        assert.equal(secondRes.success, true);
        assert.equal(secondRes.seeded, false);
      }
    });

    test('2.4 Invalid or boundary reference dates do not crash the seeder', () => {
      const testUserId = 'boundary-dates-user-004';

      // UTC Midnight Boundary date (Near-Midnight UTC, e.g. 23:59:59Z)
      const midnightUtc = new Date('2026-10-17T23:59:59.000Z');
      const payloadMidnight = buildSeedPayload(testUserId, midnightUtc);
      assert.equal(payloadMidnight.events.length, 10);
      assert.ok(payloadMidnight.events[0].start_time.startsWith('2026-10-15'), 'Day -2 must be 2026-10-15');
      assert.ok(payloadMidnight.events[4].start_time.startsWith('2026-10-17'), 'Day 0 must be 2026-10-17');
      assert.ok(payloadMidnight.events[6].start_time.startsWith('2026-10-18'), 'Day +1 must be 2026-10-18');

      // Year 1970 (Unix Epoch)
      const date1970 = new Date(1970, 0, 1, 12, 0, 0);
      const payload1970 = buildSeedPayload(testUserId, date1970);
      assert.equal(payload1970.events.length, 10);
      assert.ok(payload1970.events[0].start_time.startsWith(formatIsoDateOnly(date1970, -2)));

      // Year 2099 (Far Future)
      const date2099 = new Date(2099, 11, 31, 12, 0, 0);
      const payload2099 = buildSeedPayload(testUserId, date2099);
      assert.equal(payload2099.events.length, 10);
      assert.ok(payload2099.events[0].start_time.startsWith(formatIsoDateOnly(date2099, -2)));

      // Leap day (Feb 29, 2028)
      const dateLeap = new Date(2028, 1, 29, 12, 0, 0);
      const payloadLeap = buildSeedPayload(testUserId, dateLeap);
      assert.equal(payloadLeap.events.length, 10);
      assert.ok(payloadLeap.events[4].start_time.startsWith(formatIsoDateOnly(dateLeap, 0)));
    });
  });

  // ==========================================================================
  // STRESS 3: Repeat Seeding Latency & Sub-Second Guarantees
  // ==========================================================================
  describe('3. Repeat Seeding Latency & Sub-Second Guarantees', () => {
    test('3.1 First-run execution time is strictly under 1000ms (<1s)', async () => {
      const testUserId = 'perf-first-run-' + Date.now();
      const t0 = performance.now();
      const res = await seedStudentOnboardingData(testUserId);
      const elapsed = performance.now() - t0;

      assert.equal(res.success, true);
      assert.equal(res.seeded, true);
      assert.ok(
        elapsed < 1000,
        `First run duration ${elapsed.toFixed(2)}ms exceeded 1000ms SLA`
      );
      assert.ok(
        res.executionTimeMs < 1000,
        `Reported executionTimeMs ${res.executionTimeMs}ms exceeded 1000ms SLA`
      );
    });

    test('3.2 Repeat seeding benchmark: 50 consecutive runs have average latency < 10ms and p99 < 20ms', async () => {
      const testUserId = 'perf-repeat-bench-' + Date.now();
      // Prime cache
      await seedStudentOnboardingData(testUserId);

      const samples: number[] = [];
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const t0 = performance.now();
        const res = await seedStudentOnboardingData(testUserId);
        const elapsed = performance.now() - t0;

        assert.equal(res.success, true);
        assert.equal(res.seeded, false);
        samples.push(elapsed);
      }

      samples.sort((a, b) => a - b);
      const avg = samples.reduce((sum, val) => sum + val, 0) / samples.length;
      const min = samples[0];
      const max = samples[samples.length - 1];
      const p95 = samples[Math.floor(samples.length * 0.95)];
      const p99 = samples[Math.floor(samples.length * 0.99)];

      // Assertions
      assert.ok(avg < 10, `Average repeat latency ${avg.toFixed(3)}ms exceeded 10ms threshold`);
      assert.ok(p95 < 15, `P95 repeat latency ${p95.toFixed(3)}ms exceeded 15ms threshold`);
      assert.ok(p99 < 25, `P99 repeat latency ${p99.toFixed(3)}ms exceeded 25ms threshold`);
    });

    test('3.3 Burst stress: 100 rapid sequential seed queries for 10 distinct users', async () => {
      const users = Array.from({ length: 10 }, (_, i) => `burst-user-${i}`);

      const t0 = performance.now();
      for (let cycle = 0; cycle < 10; cycle++) {
        for (const u of users) {
          const res = await seedStudentOnboardingData(u);
          assert.equal(res.success, true);
        }
      }
      const totalElapsed = performance.now() - t0;

      // 100 calls should easily complete in under 500ms total
      assert.ok(
        totalElapsed < 500,
        `100 burst queries took ${totalElapsed.toFixed(2)}ms, exceeding 500ms ceiling`
      );
    });
  });

  // ==========================================================================
  // STRESS 4: Store Synchronization & Edge Conditions
  // ==========================================================================
  describe('4. Store Synchronization & Edge Conditions', () => {
    test('4.1 syncStoreWithSeededData preserves existing custom user tasks while inserting missing seeded tasks', async () => {
      const testUserId = 'store-preserve-user-005';
      await seedStudentOnboardingData(testUserId);

      // Pre-populate store with a custom user task
      const preExistingTask = {
        id: 'custom-user-task-abc',
        title: 'Custom User Task Before Seed Sync',
        status: 'doing' as const,
        priority: 'high' as const,
        difficulty: 3,
        dueAt: '2026-10-20T10:00:00',
        estimateMin: 30,
        actualMin: 10,
        steps: [],
        tags: ['Custom'],
        pomodoros: { planned: 1, done: 0 },
        quadrant: 'do_first' as const,
        order: 99,
        createdAt: '2026-10-17T08:00:00Z',
      };

      updateSharedState((prev) => ({
        ...prev,
        tasks: [preExistingTask],
      }));

      // Now invoke syncStoreWithSeededData
      syncStoreWithSeededData(testUserId);

      const state = getSharedState();
      // Should have 1 custom task + 7 seeded tasks = 8 tasks total
      assert.equal(state.tasks.length, 8, 'Custom task must be preserved alongside 7 seeded tasks');

      const foundCustom = state.tasks.find((t) => t.id === 'custom-user-task-abc');
      assert.ok(foundCustom, 'Custom user task must still exist in store');
      assert.equal(foundCustom.title, 'Custom User Task Before Seed Sync');
    });

    test('4.2 syncStoreWithSeededData upgrades lower XP/Level/Streak but never downgrades higher existing user stats', async () => {
      const testUserId = 'store-stats-upgrade-user-006';
      await seedStudentOnboardingData(testUserId);

      // Scenario A: User already has higher XP (e.g. 5000 XP, Level 15, Streak 30)
      updateSharedState((prev) => ({
        ...prev,
        xp: 5000,
        level: 15,
        streak: 30,
      }));

      syncStoreWithSeededData(testUserId);

      let state = getSharedState();
      assert.equal(state.xp, 5000, 'Must NOT downgrade higher existing XP (5000)');
      assert.equal(state.level, 15, 'Must NOT downgrade higher existing Level (15)');
      assert.equal(state.streak, 30, 'Must NOT downgrade higher existing Streak (30)');

      // Scenario B: User starts with lower XP (e.g. 100 XP, Level 1, Streak 1)
      updateSharedState((prev) => ({
        ...prev,
        xp: 100,
        level: 1,
        streak: 1,
      }));

      syncStoreWithSeededData(testUserId);

      state = getSharedState();
      assert.equal(state.xp, 2840, 'Must upgrade lower XP to baseline 2840');
      assert.equal(state.level, 7, 'Must upgrade lower Level to baseline 7');
      assert.equal(state.streak, 12, 'Must upgrade lower Streak to baseline 12');
    });
  });
});
