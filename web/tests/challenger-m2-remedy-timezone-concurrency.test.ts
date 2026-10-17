/**
 * Milestone 2 Remedy Adversarial Challenger #2:
 * Timezone Resilience & In-Flight Mutex Concurrency Stress Test Suite
 *
 * Specific Verification Objectives:
 * 1. Test near-midnight UTC dates (23:59:59.000Z) across simulated UTC-5, UTC+0, UTC+7, UTC+9 timezones.
 * 2. Test 25 parallel concurrent calls to seedStudentOnboardingData for the same user ID to ensure
 *    inFlightSeeds coalesces them into a single execution (1 leader, 24 coalesced followers).
 * 3. Verify calendar anchoring, date boundaries, and zero data cross-contamination under extreme concurrency.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

import {
  seedStudentOnboardingData,
  hasUserBeenSeeded,
  getSeededDataForUser,
  resetSeededState,
  buildSeedPayload,
  formatIsoDateOnly,
  generateDeterministicUuid,
} from '../src/lib/auto-seed-engine.ts';

import {
  getSharedState,
  resetSharedState,
  syncStoreWithSeededData,
  updateSharedState,
} from '../src/lib/campus-store.ts';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('CHALLENGER REMEDY #2: Timezone Resilience & In-Flight Mutex Concurrency', () => {
  const originalTz = process.env.TZ;

  beforeEach(() => {
    resetSeededState();
    resetSharedState();
  });

  afterEach(() => {
    process.env.TZ = originalTz;
  });

  // ==========================================================================
  // OBJECTIVE 1: Timezone Resilience Across Near-Midnight UTC Dates
  // ==========================================================================
  describe('1. Timezone Resilience: Near-Midnight UTC Across UTC-5, UTC+0, UTC+7, UTC+9', () => {
    const timezones = [
      { label: 'UTC-5', tz: 'America/Bogota', localOffsetHours: -5 },
      { label: 'UTC+0', tz: 'UTC', localOffsetHours: 0 },
      { label: 'UTC+7', tz: 'Asia/Ho_Chi_Minh', localOffsetHours: 7 },
      { label: 'UTC+9', tz: 'Asia/Tokyo', localOffsetHours: 9 },
    ];

    test('1.1 formatIsoDateOnly on 2026-10-17T23:59:59.000Z returns strict UTC 2026-10-17 in all 4 timezones', () => {
      const nearMidnightUtc = new Date('2026-10-17T23:59:59.000Z');

      for (const { label, tz } of timezones) {
        process.env.TZ = tz;

        const dateStr = formatIsoDateOnly(nearMidnightUtc, 0);
        assert.equal(
          dateStr,
          '2026-10-17',
          `[${label} / ${tz}] formatIsoDateOnly failed: expected 2026-10-17 but got ${dateStr}`
        );

        // Verify day offsets relative to near-midnight UTC
        assert.equal(formatIsoDateOnly(nearMidnightUtc, -2), '2026-10-15', `[${label}] -2 days failed`);
        assert.equal(formatIsoDateOnly(nearMidnightUtc, -1), '2026-10-16', `[${label}] -1 day failed`);
        assert.equal(formatIsoDateOnly(nearMidnightUtc, 1), '2026-10-18', `[${label}] +1 day failed`);
        assert.equal(formatIsoDateOnly(nearMidnightUtc, 2), '2026-10-19', `[${label}] +2 days failed`);
        assert.equal(formatIsoDateOnly(nearMidnightUtc, 3), '2026-10-20', `[${label}] +3 days failed`);
        assert.equal(formatIsoDateOnly(nearMidnightUtc, 5), '2026-10-22', `[${label}] +5 days failed`);
        assert.equal(formatIsoDateOnly(nearMidnightUtc, 8), '2026-10-25', `[${label}] +8 days failed`);
        assert.equal(formatIsoDateOnly(nearMidnightUtc, 10), '2026-10-27', `[${label}] +10 days failed`);
      }
    });

    test('1.2 buildSeedPayload anchors calendar events & tasks strictly to UTC dates across all 4 timezones', () => {
      const nearMidnightUtc = new Date('2026-10-17T23:59:59.000Z');

      for (const { label, tz } of timezones) {
        process.env.TZ = tz;
        const studentId = `tz-student-${label.replace(/[^a-zA-Z0-9]/g, '')}`;
        const payload = buildSeedPayload(studentId, nearMidnightUtc);

        assert.equal(payload.courses.length, 4, `[${label}] Course count must be 4`);
        assert.equal(payload.tasks.length, 7, `[${label}] Task count must be 7`);
        assert.equal(payload.events.length, 10, `[${label}] Event count must be 10`);

        // Check profile last_study_date
        assert.equal(
          payload.profile.last_study_date,
          '2026-10-17',
          `[${label}] Profile last_study_date must be 2026-10-17`
        );

        // Check Calendar Events timestamps: must start with exact UTC dates
        const expectedEventDates = [
          { idx: 0, expectedDate: '2026-10-15', expectedTime: '08:00:00Z', title: 'Kỹ thuật lập trình (Buổi 1)' },
          { idx: 1, expectedDate: '2026-10-15', expectedTime: '14:00:00Z', title: 'Học nhóm CTDL & GT' },
          { idx: 2, expectedDate: '2026-10-16', expectedTime: '10:00:00Z', title: 'Toán rời rạc' },
          { idx: 3, expectedDate: '2026-10-16', expectedTime: '17:30:00Z', title: 'Chạy bộ rèn thể lực' },
          { idx: 4, expectedDate: '2026-10-17', expectedTime: '08:00:00Z', title: 'Kỹ thuật lập trình' },
          { idx: 5, expectedDate: '2026-10-17', expectedTime: '14:00:00Z', title: 'Thực hành Mạng máy tính' },
          { idx: 6, expectedDate: '2026-10-18', expectedTime: '19:30:00Z', title: 'Ôn tập Subnetting & Định tuyến' },
          { idx: 7, expectedDate: '2026-10-19', expectedTime: '14:30:00Z', title: 'Workshop CLB Công nghệ (GenAI & Web)' },
          { idx: 8, expectedDate: '2026-10-20', expectedTime: '08:00:00Z', title: 'Kiểm tra Xác suất Thống kê' },
          { idx: 9, expectedDate: '2026-10-25', expectedTime: '09:00:00Z', title: 'Thi Cấu trúc dữ liệu & Giải thuật' },
        ];

        for (const exp of expectedEventDates) {
          const ev = payload.events[exp.idx];
          assert.ok(ev, `[${label}] Event ${exp.idx} must exist`);
          assert.equal(
            ev.start_time,
            `${exp.expectedDate}T${exp.expectedTime}`,
            `[${label}] Event ${exp.idx} (${ev.title}) start_time date shifted! Got ${ev.start_time}`
          );
        }

        // Check Tasks due dates
        const expectedTaskDues = [
          { idx: 0, expectedPrefix: '2026-10-15', desc: 'Overdue task (day -2)' },
          { idx: 1, expectedPrefix: '2026-10-17', desc: 'Urgent today task 1' },
          { idx: 2, expectedPrefix: '2026-10-17', desc: 'Urgent today task 2' },
          { idx: 3, expectedPrefix: '2026-10-18', desc: 'Tomorrow task (day +1)' },
          { idx: 4, expectedPrefix: '2026-10-20', desc: 'Exam prep task (day +3)' },
          { idx: 5, expectedPrefix: '2026-10-25', desc: 'Final exam task (day +8)' },
          { idx: 6, expectedPrefix: '2026-10-16', desc: 'Completed task (day -1)' },
        ];

        for (const exp of expectedTaskDues) {
          const task = payload.tasks[exp.idx];
          assert.ok(task, `[${label}] Task ${exp.idx} must exist`);
          assert.ok(
            task.due_date?.startsWith(exp.expectedPrefix),
            `[${label}] Task ${exp.idx} (${exp.desc}) due_date must start with ${exp.expectedPrefix}, got ${task.due_date}`
          );
        }
      }
    });

    test('1.3 Isolated child processes with distinct TZ environment variables produce identical UTC payloads', () => {
      const nearMidnightUtcIso = '2026-10-17T23:59:59.000Z';

      const resultsPerTz: Record<string, { d0: string; dm2: string; dp1: string; ev0: string; ev4: string }> = {};

      for (const { label, tz } of timezones) {
        const script = `
          import { formatIsoDateOnly, buildSeedPayload } from './src/lib/auto-seed-engine.ts';
          const refDate = new Date('${nearMidnightUtcIso}');
          const d0 = formatIsoDateOnly(refDate, 0);
          const dm2 = formatIsoDateOnly(refDate, -2);
          const dp1 = formatIsoDateOnly(refDate, 1);
          const payload = buildSeedPayload('proc-tz-${label}', refDate);
          console.log(JSON.stringify({
            d0,
            dm2,
            dp1,
            ev0: payload.events[0].start_time,
            ev4: payload.events[4].start_time,
          }));
        `;

        const proc = spawnSync('node', ['--experimental-strip-types', '--input-type=module', '-e', script], {
          cwd: process.cwd(),
          env: { ...process.env, TZ: tz },
          encoding: 'utf-8',
        });

        assert.equal(proc.status, 0, `Subprocess for ${label} failed: ${proc.stderr}`);

        const stdoutLines = proc.stdout.trim().split('\n');
        const jsonLine = stdoutLines[stdoutLines.length - 1];
        const parsed = JSON.parse(jsonLine);

        resultsPerTz[label] = parsed;
      }

      // Assert that all child processes regardless of TZ produced the exact identical strings
      const expected = {
        d0: '2026-10-17',
        dm2: '2026-10-15',
        dp1: '2026-10-18',
        ev0: '2026-10-15T08:00:00Z',
        ev4: '2026-10-17T08:00:00Z',
      };

      for (const { label } of timezones) {
        assert.deepEqual(
          resultsPerTz[label],
          expected,
          `Mismatch in child process timezone execution for ${label}`
        );
      }
    });

    test('1.4 Boundary edge dates (month transition, year transition, leap year) maintain UTC precision', () => {
      // 1. Month end transition: 2026-10-31T23:59:59.000Z
      const monthEnd = new Date('2026-10-31T23:59:59.000Z');
      assert.equal(formatIsoDateOnly(monthEnd, 0), '2026-10-31');
      assert.equal(formatIsoDateOnly(monthEnd, 1), '2026-11-01');

      // 2. Year end transition: 2026-12-31T23:59:59.999Z
      const yearEnd = new Date('2026-12-31T23:59:59.999Z');
      assert.equal(formatIsoDateOnly(yearEnd, 0), '2026-12-31');
      assert.equal(formatIsoDateOnly(yearEnd, 1), '2027-01-01');

      // 3. Leap day: 2028-02-28T23:59:59.000Z (Leap year 2028)
      const leapEve = new Date('2028-02-28T23:59:59.000Z');
      assert.equal(formatIsoDateOnly(leapEve, 0), '2028-02-28');
      assert.equal(formatIsoDateOnly(leapEve, 1), '2028-02-29');

      // 4. Leap day end: 2028-02-29T23:59:59.000Z
      const leapEnd = new Date('2028-02-29T23:59:59.000Z');
      assert.equal(formatIsoDateOnly(leapEnd, 0), '2028-02-29');
      assert.equal(formatIsoDateOnly(leapEnd, 1), '2028-03-01');
    });

    test('1.5 storeEvents done status and storeTasks dueAt are resilient across all 4 timezones', () => {
      const nearMidnightUtc = new Date('2026-10-17T23:59:59.000Z');

      for (const { label, tz } of timezones) {
        process.env.TZ = tz;
        const payload = buildSeedPayload(`tz-store-${label}`, nearMidnightUtc);

        assert.equal(payload.storeEvents.length, 10);
        // Past events (days -2 and -1) must be marked done: true
        assert.equal(payload.storeEvents[0].done, true, `[${label}] Event 0 (day -2) must be done`);
        assert.equal(payload.storeEvents[1].done, true, `[${label}] Event 1 (day -2) must be done`);
        assert.equal(payload.storeEvents[2].done, true, `[${label}] Event 2 (day -1) must be done`);
        assert.equal(payload.storeEvents[3].done, true, `[${label}] Event 3 (day -1) must be done`);

        // Today events (day 0) must be done: false
        assert.equal(payload.storeEvents[4].done, false, `[${label}] Event 4 (today) must NOT be done`);
        assert.equal(payload.storeEvents[5].done, false, `[${label}] Event 5 (today) must NOT be done`);

        // Future events must be done: false
        assert.equal(payload.storeEvents[6].done, false, `[${label}] Event 6 (day +1) must NOT be done`);
        assert.equal(payload.storeEvents[7].done, false, `[${label}] Event 7 (day +2) must NOT be done`);
        assert.equal(payload.storeEvents[8].done, false, `[${label}] Event 8 (day +3) must NOT be done`);
        assert.equal(payload.storeEvents[9].done, false, `[${label}] Event 9 (day +8) must NOT be done`);

        // All storeTasks dueAt must match UTC dates
        assert.ok(payload.storeTasks[0].dueAt.startsWith('2026-10-15'));
        assert.ok(payload.storeTasks[1].dueAt.startsWith('2026-10-17'));
        assert.ok(payload.storeTasks[2].dueAt.startsWith('2026-10-17'));
        assert.ok(payload.storeTasks[3].dueAt.startsWith('2026-10-18'));
        assert.ok(payload.storeTasks[4].dueAt.startsWith('2026-10-20'));
        assert.ok(payload.storeTasks[5].dueAt.startsWith('2026-10-25'));
        assert.ok(payload.storeTasks[6].dueAt.startsWith('2026-10-16'));
      }
    });
  });

  // ==========================================================================
  // OBJECTIVE 2: 25 Parallel Concurrent Calls & In-Flight Mutex Coalescing
  // ==========================================================================
  describe('2. In-Flight Mutex Coalescing: 25 Parallel Concurrent Calls', () => {
    test('2.1 Exactly 25 simultaneous calls coalesce into 1 leader execution and 24 idempotent exits', async () => {
      const studentId = 'challenger-coalesce-25-student';
      resetSeededState(studentId);

      // Launch exactly 25 concurrent calls simultaneously via Promise.all
      const parallelPromises = Array.from({ length: 25 }, (_, idx) =>
        seedStudentOnboardingData(studentId)
      );

      const results = await Promise.all(parallelPromises);

      // Verify all 25 invocations completed
      assert.equal(results.length, 25, 'Must have received exactly 25 results');

      // Verify all 25 returned success with complete payloads
      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        assert.equal(res.success, true, `Call ${i} failed: ${res.error}`);
        assert.equal(res.userId, studentId, `Call ${i} user_id mismatch`);
        assert.equal(res.courseCount, 4, `Call ${i} courseCount must be 4`);
        assert.equal(res.taskCount, 7, `Call ${i} taskCount must be 7`);
        assert.equal(res.eventCount, 10, `Call ${i} eventCount must be 10`);
        assert.ok(res.executionTimeMs < 1000, `Call ${i} execution time exceeded 1000ms SLA`);
      }

      // Mutex coalescing check: exactly 1 leader seeded, exactly 24 joined followers
      const leaderExecutions = results.filter((r) => r.seeded === true);
      const joinedFollowers = results.filter((r) => r.seeded === false);

      assert.equal(
        leaderExecutions.length,
        1,
        `FATAL CONCURRENCY BREACH: Expected strictly 1 leader execution, but found ${leaderExecutions.length}`
      );
      assert.equal(
        joinedFollowers.length,
        24,
        `FATAL CONCURRENCY BREACH: Expected strictly 24 joined follower exits, but found ${joinedFollowers.length}`
      );

      // Verify cached registry contains zero duplicates
      const cached = getSeededDataForUser(studentId);
      assert.ok(cached, 'Cached data must exist in registry');
      assert.equal(cached.courses.length, 4, 'Cached courses must be strictly 4');
      assert.equal(cached.tasks.length, 7, 'Cached tasks must be strictly 7');
      assert.equal(cached.events.length, 10, 'Cached events must be strictly 10');

      // Verify all generated IDs are strictly unique valid RFC 4122 v4 UUIDs
      const courseIds = new Set(cached.courses.map((c) => c.id));
      assert.equal(courseIds.size, 4, 'All 4 course UUIDs must be unique');
      for (const id of courseIds) {
        assert.match(id!, UUID_V4_REGEX, `Course ID ${id} is not valid UUID v4`);
      }

      const taskIds = new Set(cached.tasks.map((t) => t.id));
      assert.equal(taskIds.size, 7, 'All 7 task UUIDs must be unique');
      for (const id of taskIds) {
        assert.match(id!, UUID_V4_REGEX, `Task ID ${id} is not valid UUID v4`);
      }

      const eventIds = new Set(cached.events.map((e) => e.id));
      assert.equal(eventIds.size, 10, 'All 10 event UUIDs must be unique');
      for (const id of eventIds) {
        assert.match(id!, UUID_V4_REGEX, `Event ID ${id} is not valid UUID v4`);
      }

      // 26th sequential call must hit the fast-path in-memory cache in < 10ms
      const t0 = performance.now();
      const call26 = await seedStudentOnboardingData(studentId);
      const call26Elapsed = performance.now() - t0;

      assert.equal(call26.success, true);
      assert.equal(call26.seeded, false, 'Call 26 must hit cache');
      assert.ok(call26Elapsed < 15, `Call 26 took ${call26Elapsed}ms, expected fast-path < 15ms`);
    });

    test('2.2 Interleaved / jittered 25 concurrent calls with microtask & macrotask delays coalesce cleanly', async () => {
      const studentId = 'challenger-jittered-25-student';
      resetSeededState(studentId);

      // Launch 25 calls with varied dispatch times:
      // - 10 immediate
      // - 10 queued via queueMicrotask
      // - 5 queued via setTimeout(0)
      const promises: Promise<any>[] = [];

      // 10 immediate
      for (let i = 0; i < 10; i++) {
        promises.push(seedStudentOnboardingData(studentId));
      }

      // 10 microtasks
      for (let i = 0; i < 10; i++) {
        promises.push(
          new Promise((resolve) => {
            queueMicrotask(async () => {
              const res = await seedStudentOnboardingData(studentId);
              resolve(res);
            });
          })
        );
      }

      // 5 timers
      for (let i = 0; i < 5; i++) {
        promises.push(
          new Promise((resolve) => {
            setTimeout(async () => {
              const res = await seedStudentOnboardingData(studentId);
              resolve(res);
            }, i % 3);
          })
        );
      }

      const results = await Promise.all(promises);

      assert.equal(results.length, 25);
      const seededCount = results.filter((r) => r.seeded === true).length;
      const cachedCount = results.filter((r) => r.seeded === false).length;

      assert.equal(
        seededCount,
        1,
        `Expected strictly 1 seeded leader under jittered arrival, got ${seededCount}`
      );
      assert.equal(
        cachedCount,
        24,
        `Expected strictly 24 coalesced followers under jittered arrival, got ${cachedCount}`
      );
    });

    test('2.3 25 concurrent calls across 5 distinct students (5 calls each) coalesce per student without cross-contamination', async () => {
      const studentIds = Array.from({ length: 5 }, (_, i) => `multi-student-batch-${i}`);

      for (const id of studentIds) {
        resetSeededState(id);
      }

      // Build 25 calls: 5 calls for each student ID, interleaved
      const allCalls: Promise<any>[] = [];
      for (let round = 0; round < 5; round++) {
        for (const id of studentIds) {
          allCalls.push(seedStudentOnboardingData(id));
        }
      }

      assert.equal(allCalls.length, 25, 'Total concurrent calls must be 25');

      const results = await Promise.all(allCalls);

      assert.equal(results.length, 25);
      for (const r of results) {
        assert.equal(r.success, true);
        assert.equal(r.courseCount, 4);
        assert.equal(r.taskCount, 7);
        assert.equal(r.eventCount, 10);
      }

      // Across 5 students, exactly 5 must be seeded: true (1 per student)
      const totalSeeded = results.filter((r) => r.seeded === true).length;
      const totalCoalesced = results.filter((r) => r.seeded === false).length;

      assert.equal(totalSeeded, 5, `Expected exactly 5 seeded leaders (1 per user), got ${totalSeeded}`);
      assert.equal(totalCoalesced, 20, `Expected exactly 20 coalesced followers, got ${totalCoalesced}`);

      // Verify no cross contamination: check that each user has isolated unique IDs
      const allCourseIds = new Set<string>();
      const allTaskIds = new Set<string>();
      const allEventIds = new Set<string>();

      for (const id of studentIds) {
        const data = getSeededDataForUser(id);
        assert.ok(data);
        for (const c of data.courses) {
          assert.equal(c.user_id, id);
          assert.ok(!allCourseIds.has(c.id!), `Course ID collided across users: ${c.id}`);
          allCourseIds.add(c.id!);
        }
        for (const t of data.tasks) {
          assert.equal(t.user_id, id);
          assert.ok(!allTaskIds.has(t.id!), `Task ID collided across users: ${t.id}`);
          allTaskIds.add(t.id!);
        }
        for (const e of data.events) {
          assert.equal(e.user_id, id);
          assert.ok(!allEventIds.has(e.id!), `Event ID collided across users: ${e.id}`);
          allEventIds.add(e.id!);
        }
      }

      assert.equal(allCourseIds.size, 5 * 4, 'All 20 course IDs must be unique');
      assert.equal(allTaskIds.size, 5 * 7, 'All 35 task IDs must be unique');
      assert.equal(allEventIds.size, 5 * 10, 'All 50 event IDs must be unique');
    });

    test('2.4 Concurrently executing 25 store sync calls after 25 concurrent seeds preserves strict 7 tasks and 10 events', async () => {
      const studentId = 'challenger-25-seed-and-sync-store';
      resetSeededState(studentId);

      // Phase 1: 25 concurrent seeds
      await Promise.all(
        Array.from({ length: 25 }, () => seedStudentOnboardingData(studentId))
      );

      // Reset store to default legacy mock items
      resetSharedState();

      // Phase 2: 25 concurrent store syncs
      const syncCalls = Array.from({ length: 25 }, () => {
        return new Promise<void>((resolve) => {
          queueMicrotask(() => {
            syncStoreWithSeededData(studentId);
            resolve();
          });
        });
      });

      await Promise.all(syncCalls);

      // Check final state
      const state = getSharedState();
      assert.equal(
        state.tasks.length,
        7,
        `Expected strictly 7 tasks after 25 concurrent store syncs, got ${state.tasks.length}`
      );
      assert.equal(
        state.events.length,
        10,
        `Expected strictly 10 events after 25 concurrent store syncs, got ${state.events.length}`
      );

      // Verify no duplicate IDs
      const uniqueTaskIds = new Set(state.tasks.map((t) => t.id));
      assert.equal(uniqueTaskIds.size, 7);

      const uniqueEventIds = new Set(state.events.map((e) => e.id));
      assert.equal(uniqueEventIds.size, 10);
    });

    test('2.5 hasUserBeenSeeded awaits active in-flight operation and accurately reflects completion', async () => {
      const studentId = 'challenger-inflight-has-user-seeded';
      resetSeededState(studentId);

      // Start 25 concurrent seeds
      const seedPromises = Array.from({ length: 25 }, () =>
        seedStudentOnboardingData(studentId)
      );

      // Concurrently query hasUserBeenSeeded while seeding is still in flight
      const hasSeededPromise = hasUserBeenSeeded(studentId);

      const [hasSeededResult, seedResults] = await Promise.all([
        hasSeededPromise,
        Promise.all(seedPromises),
      ]);

      assert.equal(hasSeededResult, true, 'hasUserBeenSeeded must resolve to true after joining in-flight promise');
      assert.equal(seedResults.length, 25);
      assert.equal(seedResults.filter((r) => r.seeded).length, 1);
    });

    test('2.6 In-flight mutex cleans up cleanly and does not lock out subsequent requests on error or invalid inputs', async () => {
      // 1. Invalid input: null / empty
      const badRes = await seedStudentOnboardingData('');
      assert.equal(badRes.success, false);
      assert.equal(badRes.seeded, false);

      // 2. Normal student should succeed immediately afterwards without any deadlock
      const validRes = await seedStudentOnboardingData('student-after-bad-input');
      assert.equal(validRes.success, true);
      assert.equal(validRes.seeded, true);

      // 3. Repeated call for the same student hits fast path
      const repeatRes = await seedStudentOnboardingData('student-after-bad-input');
      assert.equal(repeatRes.success, true);
      assert.equal(repeatRes.seeded, false);
    });
  });
});
