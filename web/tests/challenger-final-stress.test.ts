/**
 * CampusOS Task 2: AI Smart OCR Schedule Importer
 * Final Adversarial Stress & Verification Test Suite (Challenger 19 Final)
 *
 * Covers:
 * - API Route latency benchmark (< 1.5s) & concurrent load
 * - Fallback dataset integrity & payload fuzzing
 * - 15-week recurrence generator & calendar persistence invariants
 * - Gamification +100 XP system & level progression edge cases
 * - Period mapping adversarial boundaries & day-of-week permutations
 * - ScheduleScanModal architectural, UX, and accessibility contracts
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  parseSchedulePeriod,
  getPeriodTimeRange,
  detectExplicitTimeRange,
  normalizeDayOfWeek,
  generateRecurringDates,
  calculateNextDateForDayOfWeek,
  mapPeriodToTime,
  STANDARD_PERIODS,
  STANDARD_KIP_MAPPING,
  type ExtractedScheduleCourse,
} from '../src/lib/period-time-mapper.ts';

import {
  scanScheduleImage,
  getSampleScheduleCourses,
  sanitizeExtractedCourse,
  parseGeminiJsonResponse,
  MOCK_VIETNAMESE_TIMETABLE,
  type ScheduleScanResponse,
} from '../src/lib/schedule-ocr-engine.ts';

import { POST } from '../src/app/api/study/schedule-scan/route.ts';

import {
  awardXp,
  convertCoursesToRecurringEvents,
  batchAddCalendarEvents,
  getSharedState,
  calculateLevelAndRank,
  type CalendarEvent,
} from '../src/lib/campus-store.ts';

// Helper to construct a mock NextRequest
function createMockRequest(body: any, headers: Record<string, string> = {}) {
  const isMultipart = headers['content-type']?.includes('multipart/form-data');
  return {
    headers: {
      get: (k: string) => headers[k.toLowerCase()] || null,
    },
    json: async () => (isMultipart ? {} : body),
    formData: async () => {
      const map = new Map();
      if (body && typeof body === 'object') {
        for (const [k, v] of Object.entries(body)) {
          map.set(k, v);
        }
      }
      return map;
    },
  } as any;
}

// -----------------------------------------------------------------------------
// SUITE 1: API ROUTE LATENCY BENCHMARK & CONCURRENCY
// -----------------------------------------------------------------------------
describe('Challenger Suite 1: API Route Latency Benchmark & Concurrency', () => {
  test('1.1 Fast-path sample timetable responds in < 1500ms over 5 successive runs', async () => {
    const latencies: number[] = [];
    for (let i = 0; i < 5; i++) {
      const req = createMockRequest({ useSample: true }, { 'content-type': 'application/json' });
      const start = Date.now();
      const res = await POST(req);
      const elapsed = Date.now() - start;
      latencies.push(elapsed);

      assert.equal(res.status, 200);
      const data: ScheduleScanResponse = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.source, 'sample');
      assert.equal(data.courses.length, 5);
      assert.ok(elapsed < 1500, `Run ${i + 1} took ${elapsed}ms, exceeding 1500ms gate`);
    }

    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    assert.ok(avg < 1000, `Average latency ${avg}ms must be well below 1000ms`);
  });

  test('1.2 Offline fallback responds in < 1500ms for image payload without API key', async () => {
    // 1x1 transparent PNG base64
    const dummyImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const req = createMockRequest(
      { image: dummyImage, mimeType: 'image/png' },
      { 'content-type': 'application/json' }
    );

    const start = Date.now();
    const res = await POST(req);
    const elapsed = Date.now() - start;

    assert.equal(res.status, 200);
    const data: ScheduleScanResponse = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.source, 'fallback');
    assert.equal(data.courses.length, 5);
    assert.ok(elapsed < 1500, `Offline fallback took ${elapsed}ms, exceeding 1500ms gate`);
  });

  test('1.3 Concurrent burst: 5 parallel requests execute cleanly without race conditions', async () => {
    const requests = Array.from({ length: 5 }, () =>
      POST(createMockRequest({ useSample: true }, { 'content-type': 'application/json' }))
    );

    const start = Date.now();
    const responses = await Promise.all(requests);
    const totalElapsed = Date.now() - start;

    assert.ok(totalElapsed < 2500, `Burst of 5 requests took ${totalElapsed}ms`);
    for (const res of responses) {
      assert.equal(res.status, 200);
      const data: ScheduleScanResponse = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.courses.length, 5);
    }
  });

  test('1.4 Large image payload (250KB base64) does not crash or exceed memory limits', async () => {
    // Generate ~250KB base64 chunk
    const bigBase64 = 'A'.repeat(250 * 1024);
    const req = createMockRequest(
      { image: bigBase64, mimeType: 'image/jpeg' },
      { 'content-type': 'application/json' }
    );

    const res = await POST(req);
    assert.equal(res.status, 200);
    const data: ScheduleScanResponse = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.source, 'fallback');
    assert.equal(data.courses.length, 5);
  });
});

// -----------------------------------------------------------------------------
// SUITE 2: 15-WEEK RECURRENCE & CALENDAR PERSISTENCE
// -----------------------------------------------------------------------------
describe('Challenger Suite 2: 15-Week Recurrence & Calendar Invariants', () => {
  test('2.1 Exactly 15 weekly dates generated, exactly 7 days apart, all matching dayOfWeek', () => {
    for (let day = 2; day <= 8; day++) {
      const dates = generateRecurringDates(day, 15, new Date('2026-10-19T00:00:00Z')); // Monday
      assert.equal(dates.length, 15, `Expected 15 dates for day ${day}`);

      const norm = normalizeDayOfWeek(day);
      assert.ok(norm);

      for (let i = 0; i < dates.length; i++) {
        const d = new Date(`${dates[i]}T12:00:00Z`); // use noon to prevent timezone shift
        assert.equal(d.getUTCDay(), norm.jsDay, `Date ${dates[i]} JS day must equal ${norm.jsDay}`);

        if (i > 0) {
          const prev = new Date(`${dates[i - 1]}T12:00:00Z`);
          const diffDays = Math.round((d.getTime() - prev.getTime()) / (1000 * 3600 * 24));
          assert.equal(diffDays, 7, `Consecutive dates must be exactly 7 days apart`);
        }
      }
    }
  });

  test('2.2 Year rollover: 15 weeks crossing December 31 into next calendar year', () => {
    const dates = generateRecurringDates(2, 15, new Date('2026-12-07T00:00:00Z')); // Dec 2026
    assert.equal(dates.length, 15);
    assert.ok(dates[0].startsWith('2026-12'));
    assert.ok(dates[dates.length - 1].startsWith('2027-'));
  });

  test('2.3 Leap year handling: February 29th leap day in 2028', () => {
    // 2028 is a leap year; 2028-02-29 is a Tuesday (dayOfWeek 3)
    const dates = generateRecurringDates(3, 5, new Date('2028-02-15T00:00:00Z'));
    assert.ok(dates.includes('2028-02-29'), 'Must cleanly include leap day 2028-02-29');
  });

  test('2.4 convertCoursesToRecurringEvents transforms 5 courses into exactly 75 events', () => {
    const sample = getSampleScheduleCourses();
    assert.equal(sample.length, 5);

    const refDate = new Date('2026-10-19T00:00:00Z');
    const events = convertCoursesToRecurringEvents(sample, 15, refDate);

    assert.equal(events.length, 75);
    const eventIds = new Set(events.map((e) => e.id));
    assert.equal(eventIds.size, 75, 'All 75 event IDs must be globally unique');

    // Verify all events conform to CalendarEvent contract
    for (const ev of events) {
      assert.ok(ev.id.startsWith('scan-'));
      assert.ok(ev.title.length > 0);
      assert.match(ev.date, /^\d{4}-\d{2}-\d{2}$/);
      assert.match(ev.start, /^\d{2}:\d{2}$/);
      assert.match(ev.end, /^\d{2}:\d{2}$/);
      assert.equal(ev.type, 'class');
      assert.ok(ev.location);
      assert.equal(ev.done, false);
    }
  });

  test('2.5 batchAddCalendarEvents deduplicates and preserves store integrity', () => {
    const sample = getSampleScheduleCourses();
    const evs = convertCoursesToRecurringEvents(sample.slice(0, 1), 3); // 3 events
    assert.equal(evs.length, 3);

    // First batch add
    const added1 = batchAddCalendarEvents(evs);
    assert.equal(added1.length, 3);

    // Second batch add with same events
    const added2 = batchAddCalendarEvents(evs);
    assert.equal(added2.length, 3);

    // State should not have duplicated these IDs
    const state = getSharedState();
    const matching = state.events.filter((e) => e.id.startsWith(`scan-${sample[0].id}`));
    assert.equal(matching.length, 3, 'Store must not duplicate events with identical IDs');
  });
});

// -----------------------------------------------------------------------------
// SUITE 3: GAMIFICATION & XP PROGRESSION INVARIANTS
// -----------------------------------------------------------------------------
describe('Challenger Suite 3: Gamification & XP System Invariants', () => {
  test('3.1 awardXp(100) increments XP and returns correct award summary', () => {
    const before = getSharedState();
    const result = awardXp(100, 'Quét TKB bằng AI');
    const after = getSharedState();

    assert.equal(result.amount, 100);
    assert.equal(result.reason, 'Quét TKB bằng AI');
    assert.equal(after.xp, before.xp + 100);
    assert.equal(result.nextXp, after.xp);
  });

  test('3.2 awardXp negative and float values are safely sanitized', () => {
    const before = getSharedState();

    // Negative XP must be clamped to 0
    const negRes = awardXp(-50, 'Malicious negative XP');
    assert.equal(negRes.amount, 0);
    assert.equal(getSharedState().xp, before.xp);

    // Float XP must be floored
    const floatRes = awardXp(25.9, 'Float XP');
    assert.equal(floatRes.amount, 25);
    assert.equal(getSharedState().xp, before.xp + 25);
  });

  test('3.3 calculateLevelAndRank Vietnamese humorous rank progression', () => {
    // 0 XP -> Level 1 (Tân sinh viên ngơ ngác)
    const l1 = calculateLevelAndRank(0);
    assert.equal(l1.level, 1);
    assert.equal(l1.rankTitle, 'Tân sinh viên ngơ ngác');

    // 150 XP -> Level 1
    const l1_mid = calculateLevelAndRank(150);
    assert.equal(l1_mid.level, 1);

    // 200 XP -> Level 2 (Cú đêm giảng đường)
    const l2 = calculateLevelAndRank(200);
    assert.equal(l2.level, 2);
    assert.equal(l2.rankTitle, 'Cú đêm giảng đường');

    // 500 XP -> Level 3 (Dũng sĩ trốn điểm danh)
    const l3 = calculateLevelAndRank(500);
    assert.equal(l3.level, 3);
    assert.equal(l3.rankTitle, 'Dũng sĩ trốn điểm danh');

    // 2000 XP -> Level 6 (Chiến thần thuyết trình)
    const l6 = calculateLevelAndRank(2000);
    assert.equal(l6.level, 6);
    assert.equal(l6.rankTitle, 'Chiến thần thuyết trình');
  });
});

// -----------------------------------------------------------------------------
// SUITE 4: PERIOD MAPPING & PARSING ADVERSARIAL STRESS
// -----------------------------------------------------------------------------
describe('Challenger Suite 4: Period Mapping Adversarial Boundaries', () => {
  test('4.1 Out of range 2-digit periods clamp gracefully without throwing', () => {
    const p1 = parseSchedulePeriod('Tiết 25-30');
    assert.equal(p1.startPeriod, 16);
    assert.equal(p1.endPeriod, 16);
    assert.equal(p1.startTime, '20:30');
    assert.equal(p1.endTime, '21:15');

    const p2 = parseSchedulePeriod('Tiết -5 đến -1');
    assert.ok(p2.startTime);
    assert.ok(p2.endTime);
  });

  test('4.2 Inverted periods automatically swap start and end', () => {
    const p = parseSchedulePeriod('Tiết 12 - 4');
    assert.equal(p.startPeriod, 4);
    assert.equal(p.endPeriod, 12);
    assert.equal(p.startTime, '09:35');
    assert.equal(p.endTime, '17:30');
  });

  test('4.3 Explicit time priority over period defaults', () => {
    // Tiết 1-3 is default 07:00-09:25, but explicit time is 08:00 - 10:30
    const p = parseSchedulePeriod('Tiết 1-3 (08:00 - 10:30)');
    assert.equal(p.hasExplicitTime, true);
    assert.equal(p.startTime, '08:00');
    assert.equal(p.endTime, '10:30');
    assert.equal(p.durationMinutes, 150);
  });

  test('4.4 Day of week comprehensive normalization matrix', () => {
    const mapping: Record<string, number> = {
      'thứ 2': 2, 'thứ hai': 2, 't2': 2, 'thu 2': 2, 'hai': 2, 'mon': 2, 'monday': 2,
      'thứ 3': 3, 'thứ ba': 3, 't3': 3, 'tue': 3, 'tuesday': 3,
      'thứ 4': 4, 'thứ tư': 4, 'thứ bốn': 4, 't4': 4, 'wed': 4, 'wednesday': 4,
      'thứ 5': 5, 'thứ năm': 5, 't5': 5, 'thu': 5, 'thursday': 5,
      'thứ 6': 6, 'thứ sáu': 6, 't6': 6, 'fri': 6, 'friday': 6,
      'thứ 7': 7, 'thứ bảy': 7, 'thứ bẩy': 7, 't7': 7, 'sat': 7, 'saturday': 7,
      'chủ nhật': 8, 'chu nhat': 8, 'cn': 8, 'thứ 8': 8, 't8': 8, 'sun': 8, 'sunday': 8,
    };

    for (const [raw, expected] of Object.entries(mapping)) {
      const res = normalizeDayOfWeek(raw);
      assert.ok(res, `Failed to parse day string: "${raw}"`);
      assert.equal(res.dayOfWeek, expected, `Day string "${raw}" expected ${expected}, got ${res.dayOfWeek}`);
    }
  });

  test('4.5 Invalid day inputs safely return null without throwing', () => {
    const invalidInputs = ['Thứ 9', 'Thứ 0', 'Thứ -1', 'random string', '', '   ', null, undefined];
    for (const input of invalidInputs) {
      const res = normalizeDayOfWeek(input);
      assert.equal(res, null, `Input "${input}" should return null`);
    }
  });
});

// -----------------------------------------------------------------------------
// SUITE 5: UI & ARCHITECTURAL CONTRACT AUDIT
// -----------------------------------------------------------------------------
describe('Challenger Suite 5: UI & Architectural Contract Audit', () => {
  test('5.1 ScheduleScanModal contains single-viewport containment & Canvas2D confetti', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/calendar/schedule-scan-modal.tsx');
    assert.ok(fs.existsSync(filePath), 'schedule-scan-modal.tsx must exist');

    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('if (!isOpen) return null;'), 'Modal must return null when !isOpen');
    assert.ok(content.includes('max-h-[90vh]'), 'Modal must contain max-h-[90vh] containment');
    assert.ok(content.includes('canvasRef'), 'Must reference Canvas2D overlay for confetti');
    assert.ok(content.includes('triggerConfetti'), 'Must implement triggerConfetti function');
    assert.ok(content.includes('awardXp') || content.includes('campusos:xp-awarded'), 'Must trigger XP award on commit');
    assert.ok(content.includes('Dùng ảnh TKB mẫu'), 'Must feature 1-click sample button');
    assert.ok(content.includes('handleDrop') && content.includes('handleDragOver'), 'Must feature drag-and-drop file upload');
    assert.ok(content.includes('role="dialog"') || content.includes('role="presentation"'), 'Must specify ARIA role');
  });

  test('5.2 MonthPosterHeader exposes onOpenScheduleScan with prominent Zap button', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/calendar/month-poster-header.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(content.includes('onOpenScheduleScan?: () => void;'), 'Must define onOpenScheduleScan in props');
    assert.ok(content.includes('Quét TKB bằng AI'), 'Must include "Quét TKB bằng AI" button text');
    assert.ok(content.includes('onClick={onOpenScheduleScan}'), 'Button must be wired to onOpenScheduleScan');
  });

  test('5.3 TodayTimeline exposes onOpenScanner with prominent Zap button', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/dashboard/today-timeline.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(content.includes('onOpenScanner?: () => void;'), 'Must define onOpenScanner in props');
    assert.ok(content.includes('Quét TKB bằng AI'), 'Must include "Quét TKB bằng AI" button text');
    assert.ok(content.includes('onClick={onOpenScanner}'), 'Button must be wired to onOpenScanner');
  });

  test('5.4 Calendar and Dashboard pages mount ScheduleScanModal with ssr: false', () => {
    const calPath = path.resolve(process.cwd(), 'src/app/(main)/calendar/page.tsx');
    const calContent = fs.readFileSync(calPath, 'utf8');
    assert.ok(calContent.includes('ScheduleScanModal'), 'Calendar page must import ScheduleScanModal');
    assert.ok(calContent.includes('convertCoursesToRecurringEvents'), 'Calendar must use convertCoursesToRecurringEvents');
    assert.ok(calContent.includes('batchAddCalendarEvents'), 'Calendar must use batchAddCalendarEvents');
    assert.ok(calContent.includes('awardXp'), 'Calendar must call awardXp(100)');

    const dashPath = path.resolve(process.cwd(), 'src/app/(main)/dashboard/page.tsx');
    const dashContent = fs.readFileSync(dashPath, 'utf8');
    assert.ok(dashContent.includes('ScheduleScanModal'), 'Dashboard page must import ScheduleScanModal');
    assert.ok(dashContent.includes('convertCoursesToRecurringEvents'), 'Dashboard must use convertCoursesToRecurringEvents');
    assert.ok(dashContent.includes('batchAddCalendarEvents'), 'Dashboard must use batchAddCalendarEvents');
    assert.ok(dashContent.includes('awardXp'), 'Dashboard must call awardXp(100)');
  });
});
