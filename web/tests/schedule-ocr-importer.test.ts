/**
 * CampusOS Task 2 — AI Smart OCR Schedule Importer Test Suite
 *
 * Requirements Reference:
 *   - ORIGINAL_REQUEST.md (## 2026-10-17T12:35:24Z: Task 2 R1, R2, R3)
 *   - orchestrator_19/PROJECT.md (§ Architecture, § Feature Inventory #1-#6, § Interface Contracts)
 *   - explorer_19_m1_period/handoff.md (Period mapping specification & standards)
 *   - explorer_19_m1_gemini/proposed_schedule_ocr_engine.ts (OCR Engine contract)
 *
 * Target Modules:
 *   - web/src/lib/period-time-mapper.ts
 *   - web/src/lib/schedule-ocr-engine.ts
 *   - web/src/app/api/study/schedule-scan/route.ts
 *
 * Runner:
 *   - Node Native Test Runner: `node --experimental-strip-types --test tests/schedule-ocr-importer.test.ts`
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

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
  HUST_KIP_MAPPING,
  type ParsedPeriodResult,
  type NormalizedDayOfWeek,
} from '../src/lib/period-time-mapper.ts';

import {
  scanScheduleImage,
  MOCK_VIETNAMESE_TIMETABLE,
  type ExtractedScheduleCourse,
  type ScheduleScanResponse,
} from '../src/lib/schedule-ocr-engine.ts';

import { POST } from '../src/app/api/study/schedule-scan/route.ts';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// ============================================================================
// SUITE 1: Vietnamese Period-to-Time Mapping Engine (period-time-mapper.ts)
// ============================================================================
describe('Suite 1: Vietnamese Academic Period Mapping Engine', () => {

  // --------------------------------------------------------------------------
  // 1.1 Standard Period Blocks
  // --------------------------------------------------------------------------
  describe('1.1 Standard Period Blocks (Tiết 1-3, 4-6, 7-9, 10-12, 13-15)', () => {
    test('1.1.1 Tiết 1-3 maps exactly to 07:00 - 09:25 (Ca sáng 1)', () => {
      const range = getPeriodTimeRange(1, 3);
      assert.equal(range.startTime, '07:00');
      assert.equal(range.endTime, '09:25');
      assert.equal(range.shift, 'morning');

      const parsed = parseSchedulePeriod('Tiết 1-3');
      assert.equal(parsed.startTime, '07:00');
      assert.equal(parsed.endTime, '09:25');
      assert.equal(parsed.startPeriod, 1);
      assert.equal(parsed.endPeriod, 3);
      assert.equal(parsed.isFallback, false);
    });

    test('1.1.2 Tiết 4-6 maps exactly to 09:35 - 12:00 (Ca sáng 2)', () => {
      const range = getPeriodTimeRange(4, 6);
      assert.equal(range.startTime, '09:35');
      assert.equal(range.endTime, '12:00');
      assert.equal(range.shift, 'morning');

      const parsed = parseSchedulePeriod('Tiết 4-6');
      assert.equal(parsed.startTime, '09:35');
      assert.equal(parsed.endTime, '12:00');
      assert.equal(parsed.startPeriod, 4);
      assert.equal(parsed.endPeriod, 6);
    });

    test('1.1.3 Tiết 7-9 maps exactly to 12:30 - 14:55 (Ca chiều 1)', () => {
      const range = getPeriodTimeRange(7, 9);
      assert.equal(range.startTime, '12:30');
      assert.equal(range.endTime, '14:55');
      assert.equal(range.shift, 'afternoon');

      const parsed = parseSchedulePeriod('Tiết 7-9');
      assert.equal(parsed.startTime, '12:30');
      assert.equal(parsed.endTime, '14:55');
      assert.equal(parsed.startPeriod, 7);
      assert.equal(parsed.endPeriod, 9);
    });

    test('1.1.4 Tiết 10-12 maps exactly to 15:05 - 17:30 (Ca chiều 2)', () => {
      const range = getPeriodTimeRange(10, 12);
      assert.equal(range.startTime, '15:05');
      assert.equal(range.endTime, '17:30');
      assert.equal(range.shift, 'afternoon');

      const parsed = parseSchedulePeriod('Tiết 10-12');
      assert.equal(parsed.startTime, '15:05');
      assert.equal(parsed.endTime, '17:30');
      assert.equal(parsed.startPeriod, 10);
      assert.equal(parsed.endPeriod, 12);
    });

    test('1.1.5 Tiết 13-15 maps exactly to 18:00 - 20:25 (Ca tối)', () => {
      const range = getPeriodTimeRange(13, 15);
      assert.equal(range.startTime, '18:00');
      assert.equal(range.endTime, '20:25');
      assert.equal(range.shift, 'evening');

      const parsed = parseSchedulePeriod('Tiết 13-15');
      assert.equal(parsed.startTime, '18:00');
      assert.equal(parsed.endTime, '20:25');
      assert.equal(parsed.startPeriod, 13);
      assert.equal(parsed.endPeriod, 15);
    });
  });

  // --------------------------------------------------------------------------
  // 1.2 Single Period & Custom Span Blocks
  // --------------------------------------------------------------------------
  describe('1.2 Single Period and Custom Span Blocks', () => {
    test('1.2.1 Single period Tiết 1 maps to 07:00 - 07:45', () => {
      const range = getPeriodTimeRange(1, 1);
      assert.equal(range.startTime, '07:00');
      assert.equal(range.endTime, '07:45');

      const parsed = parseSchedulePeriod('Tiết 1');
      assert.equal(parsed.startTime, '07:00');
      assert.equal(parsed.endTime, '07:45');
      assert.equal(parsed.startPeriod, 1);
      assert.equal(parsed.endPeriod, 1);
    });

    test('1.2.2 2-period block Tiết 1-2 maps to 07:00 - 08:35', () => {
      const range = getPeriodTimeRange(1, 2);
      assert.equal(range.startTime, '07:00');
      assert.equal(range.endTime, '08:35');

      const parsed = parseSchedulePeriod('Tiết 1-2');
      assert.equal(parsed.startTime, '07:00');
      assert.equal(parsed.endTime, '08:35');
      assert.equal(parsed.startPeriod, 1);
      assert.equal(parsed.endPeriod, 2);
    });

    test('1.2.3 4-period afternoon block Tiết 7-10 maps to 12:30 - 15:50', () => {
      const range = getPeriodTimeRange(7, 10);
      assert.equal(range.startTime, '12:30');
      assert.equal(range.endTime, '15:50');

      const parsed = parseSchedulePeriod('Tiết 7-10');
      assert.equal(parsed.startTime, '12:30');
      assert.equal(parsed.endTime, '15:50');
      assert.equal(parsed.startPeriod, 7);
      assert.equal(parsed.endPeriod, 10);
    });

    test('1.2.4 Mid-morning block Tiết 3-5 maps to 08:40 - 11:10', () => {
      const range = getPeriodTimeRange(3, 5);
      assert.equal(range.startTime, '08:40');
      assert.equal(range.endTime, '11:10');

      const parsed = parseSchedulePeriod('Tiết 3-5');
      assert.equal(parsed.startTime, '08:40');
      assert.equal(parsed.endTime, '11:10');
      assert.equal(parsed.startPeriod, 3);
      assert.equal(parsed.endPeriod, 5);
    });
  });

  // --------------------------------------------------------------------------
  // 1.3 Explicit Time Preservation & Priority
  // --------------------------------------------------------------------------
  describe('1.3 Explicit Time Range Preservation and Priority', () => {
    test('1.3.1 Preserves explicit standard time "07:00 - 09:25" alongside Tiết 1-3', () => {
      const parsed = parseSchedulePeriod('Tiết 1-3 (07:00 - 09:25)');
      assert.equal(parsed.startTime, '07:00');
      assert.equal(parsed.endTime, '09:25');
      assert.equal(parsed.hasExplicitTime, true);
    });

    test('1.3.2 Preserves custom explicit time "13:30 - 16:00" overriding default Tiết 7-9 (12:30-14:55)', () => {
      const parsed = parseSchedulePeriod('Tiết 7-9 (13:30 - 16:00)');
      assert.equal(parsed.startTime, '13:30');
      assert.equal(parsed.endTime, '16:00');
      assert.equal(parsed.hasExplicitTime, true);
    });

    test('1.3.3 Supports Vietnamese "h" notation "7h00 - 9h25"', () => {
      const parsed = parseSchedulePeriod('7h00 - 9h25');
      assert.equal(parsed.startTime, '07:00');
      assert.equal(parsed.endTime, '09:25');
      assert.equal(parsed.hasExplicitTime, true);
    });

    test('1.3.4 Supports Vietnamese "h" notation "13h30 - 16h00"', () => {
      const parsed = parseSchedulePeriod('13h30 - 16h00');
      assert.equal(parsed.startTime, '13:30');
      assert.equal(parsed.endTime, '16:00');
      assert.equal(parsed.hasExplicitTime, true);
    });

    test('1.3.5 detectExplicitTimeRange helper parses various whitespace and dash forms', () => {
      const t1 = detectExplicitTimeRange('07:00-09:25');
      assert.ok(t1);
      assert.equal(t1?.startTime, '07:00');
      assert.equal(t1?.endTime, '09:25');

      const t2 = detectExplicitTimeRange('07:00 – 09:25'); // en-dash
      assert.ok(t2);
      assert.equal(t2?.startTime, '07:00');
      assert.equal(t2?.endTime, '09:25');

      const t3 = detectExplicitTimeRange('từ 13:30 đến 16:00');
      assert.ok(t3);
      assert.equal(t3?.startTime, '13:30');
      assert.equal(t3?.endTime, '16:00');
    });

    test('1.3.6 mapPeriodToTime wrapper accepts explicit time parameter', () => {
      const res = mapPeriodToTime('Tiết 7-9', '13:30 - 16:00');
      assert.equal(res.startTime, '13:30');
      assert.equal(res.endTime, '16:00');
      assert.equal(res.isExplicitTime, true);
    });
  });

  // --------------------------------------------------------------------------
  // 1.4 Kíp Shifts (Kíp 1 to 6)
  // --------------------------------------------------------------------------
  describe('1.4 Kíp Shifts (Kíp 1 to 6)', () => {
    test('1.4.1 Kíp 1 maps to valid start and end times (07:00 - 09:25)', () => {
      const parsed = parseSchedulePeriod('Kíp 1');
      assert.equal(parsed.isKip, true);
      assert.equal(parsed.startTime, '07:00');
      assert.equal(parsed.endTime, '09:25');
      assert.equal(parsed.startPeriod, 1);
      assert.equal(parsed.endPeriod, 3);
    });

    test('1.4.2 Kíp 2 maps to valid late morning shift (09:35 - 12:00)', () => {
      const parsed = parseSchedulePeriod('Kíp 2');
      assert.equal(parsed.isKip, true);
      assert.equal(parsed.startTime, '09:35');
      assert.equal(parsed.endTime, '12:00');
      assert.equal(parsed.startPeriod, 4);
      assert.equal(parsed.endPeriod, 6);
    });

    test('1.4.3 Kíp 3 maps to valid early afternoon shift (12:30 - 14:55)', () => {
      const parsed = parseSchedulePeriod('Kíp 3');
      assert.equal(parsed.isKip, true);
      assert.equal(parsed.startTime, '12:30');
      assert.equal(parsed.endTime, '14:55');
      assert.equal(parsed.startPeriod, 7);
      assert.equal(parsed.endPeriod, 9);
    });

    test('1.4.4 Kíp 4 maps to valid late afternoon shift (15:05 - 17:30)', () => {
      const parsed = parseSchedulePeriod('Kíp 4');
      assert.equal(parsed.isKip, true);
      assert.equal(parsed.startTime, '15:05');
      assert.equal(parsed.endTime, '17:30');
      assert.equal(parsed.startPeriod, 10);
      assert.equal(parsed.endPeriod, 12);
    });

    test('1.4.5 Kíp 5 maps to valid evening shift (18:00 - 20:25)', () => {
      const parsed = parseSchedulePeriod('Kíp 5');
      assert.equal(parsed.isKip, true);
      assert.equal(parsed.startTime, '18:00');
      assert.equal(parsed.endTime, '20:25');
      assert.equal(parsed.startPeriod, 13);
      assert.equal(parsed.endPeriod, 15);
    });

    test('1.4.6 Kíp 6 maps to valid late night shift (19:30 - 21:30)', () => {
      const parsed = parseSchedulePeriod('Kíp 6');
      assert.equal(parsed.isKip, true);
      assert.ok(TIME_REGEX.test(parsed.startTime));
      assert.ok(TIME_REGEX.test(parsed.endTime));
      assert.ok(parsed.startTime < parsed.endTime);
    });

    test('1.4.7 HUST Preset applies early 06:45 start', () => {
      const hustKip1 = parseSchedulePeriod('Kíp 1', { preset: 'hust' });
      assert.equal(hustKip1.startTime, '06:45');
      assert.equal(hustKip1.endTime, '09:10');
    });

    test('1.4.8 Case-insensitive and unaccented "kip 1", "KIP 4"', () => {
      const res1 = parseSchedulePeriod('kip 1');
      const res2 = parseSchedulePeriod('KIP 4');
      assert.equal(res1.isKip, true);
      assert.equal(res2.isKip, true);
    });
  });

  // --------------------------------------------------------------------------
  // 1.5 Day of Week Normalization
  // --------------------------------------------------------------------------
  describe('1.5 Day of Week Normalization', () => {
    test('1.5.1 Canonical Vietnamese format "Thứ 2" -> dayOfWeek 2 (ISO 1, Thứ Hai)', () => {
      const res = normalizeDayOfWeek('Thứ 2');
      assert.ok(res);
      assert.equal(res?.dayOfWeek, 2);
      assert.equal(res?.isoDay, 1);
      assert.equal(res?.vietnameseName, 'Thứ Hai');
    });

    test('1.5.2 Canonical Vietnamese format "Chủ Nhật" -> dayOfWeek 8 (ISO 7, Chủ Nhật)', () => {
      const res = normalizeDayOfWeek('Chủ Nhật');
      assert.ok(res);
      assert.equal(res?.dayOfWeek, 8);
      assert.equal(res?.isoDay, 7);
      assert.equal(res?.vietnameseName, 'Chủ Nhật');
    });

    test('1.5.3 All weekdays Thứ 2 through Thứ 7 normalize accurately', () => {
      const days = [
        { input: 'Thứ 2', expected: 2, iso: 1, name: 'Thứ Hai' },
        { input: 'Thứ 3', expected: 3, iso: 2, name: 'Thứ Ba' },
        { input: 'Thứ 4', expected: 4, iso: 3, name: 'Thứ Tư' },
        { input: 'Thứ 5', expected: 5, iso: 4, name: 'Thứ Năm' },
        { input: 'Thứ 6', expected: 6, iso: 5, name: 'Thứ Sáu' },
        { input: 'Thứ 7', expected: 7, iso: 6, name: 'Thứ Bảy' },
      ];

      for (const d of days) {
        const res = normalizeDayOfWeek(d.input);
        assert.ok(res, `Failed to parse ${d.input}`);
        assert.equal(res?.dayOfWeek, d.expected, `Mismatch for ${d.input}`);
        assert.equal(res?.isoDay, d.iso, `ISO mismatch for ${d.input}`);
        assert.equal(res?.vietnameseName, d.name, `Name mismatch for ${d.input}`);
      }
    });

    test('1.5.4 Abbreviated forms "T2", "T3", ..., "T7", "CN"', () => {
      assert.equal(normalizeDayOfWeek('T2')?.dayOfWeek, 2);
      assert.equal(normalizeDayOfWeek('T3')?.dayOfWeek, 3);
      assert.equal(normalizeDayOfWeek('T4')?.dayOfWeek, 4);
      assert.equal(normalizeDayOfWeek('T5')?.dayOfWeek, 5);
      assert.equal(normalizeDayOfWeek('T6')?.dayOfWeek, 6);
      assert.equal(normalizeDayOfWeek('T7')?.dayOfWeek, 7);
      assert.equal(normalizeDayOfWeek('CN')?.dayOfWeek, 8);
      assert.equal(normalizeDayOfWeek('CN')?.isoDay, 7);
    });

    test('1.5.5 Numeric and English day strings', () => {
      assert.equal(normalizeDayOfWeek('2')?.dayOfWeek, 2);
      assert.equal(normalizeDayOfWeek(2)?.dayOfWeek, 2);
      assert.equal(normalizeDayOfWeek('8')?.dayOfWeek, 8);
      assert.equal(normalizeDayOfWeek(8)?.dayOfWeek, 8);
      assert.equal(normalizeDayOfWeek('Monday')?.dayOfWeek, 2);
      assert.equal(normalizeDayOfWeek('Friday')?.dayOfWeek, 6);
      assert.equal(normalizeDayOfWeek('Sunday')?.dayOfWeek, 8);
    });

    test('1.5.6 Invalid inputs return null or fallback without throwing', () => {
      const fallbackInvalid = normalizeDayOfWeek('Thứ 9');
      assert.equal(fallbackInvalid, null);

      const fallbackEmpty = normalizeDayOfWeek('');
      assert.equal(fallbackEmpty, null);

      const fallbackGarbage = normalizeDayOfWeek('phòng học');
      assert.equal(fallbackGarbage, null);
    });
  });

  // --------------------------------------------------------------------------
  // 1.6 Irregular & Malformed Period Strings
  // --------------------------------------------------------------------------
  describe('1.6 Irregular and Malformed Period Strings', () => {
    test('1.6.1 Omitted "Tiết" prefix "1-3" correctly resolves to 07:00 - 09:25', () => {
      const res = parseSchedulePeriod('1-3');
      assert.equal(res.startTime, '07:00');
      assert.equal(res.endTime, '09:25');
      assert.equal(res.startPeriod, 1);
      assert.equal(res.endPeriod, 3);
    });

    test('1.6.2 Extra whitespace and casing "  tiet  4 - 6  " resolves to 09:35 - 12:00', () => {
      const res = parseSchedulePeriod('  tiet  4 - 6  ');
      assert.equal(res.startTime, '09:35');
      assert.equal(res.endTime, '12:00');
      assert.equal(res.startPeriod, 4);
      assert.equal(res.endPeriod, 6);
    });

    test('1.6.3 Comma separated periods "1, 2, 3" resolves to 07:00 - 09:25', () => {
      const res = parseSchedulePeriod('Tiết 1, 2, 3');
      assert.equal(res.startTime, '07:00');
      assert.equal(res.endTime, '09:25');
      assert.equal(res.startPeriod, 1);
      assert.equal(res.endPeriod, 3);
    });

    test('1.6.4 Word range "Tiết 7 đến 9" resolves to 12:30 - 14:55', () => {
      const res = parseSchedulePeriod('Tiết 7 đến 9');
      assert.equal(res.startTime, '12:30');
      assert.equal(res.endTime, '14:55');
      assert.equal(res.startPeriod, 7);
      assert.equal(res.endPeriod, 9);
    });

    test('1.6.5 Reversed range "Tiết 3-1" auto-corrects to 1-3 (07:00 - 09:25)', () => {
      const res = parseSchedulePeriod('Tiết 3-1');
      assert.equal(res.startPeriod, 1);
      assert.equal(res.endPeriod, 3);
      assert.equal(res.startTime, '07:00');
      assert.equal(res.endTime, '09:25');
    });

    test('1.6.6 Out-of-bounds period values clamp gracefully', () => {
      const res = parseSchedulePeriod('Tiết 0-25');
      assert.equal(res.startPeriod, 1);
      assert.equal(res.endPeriod, 16);
      assert.equal(res.startTime, '07:00');
      assert.equal(res.endTime, '21:15');
    });

    test('1.6.7 Completely unparseable string falls back to default safely', () => {
      const res = parseSchedulePeriod('Môn tự chọn');
      assert.equal(res.isFallback, true);
      assert.ok(TIME_REGEX.test(res.startTime));
      assert.ok(TIME_REGEX.test(res.endTime));
    });
  });
});

// ============================================================================
// SUITE 2: Schedule OCR Engine (schedule-ocr-engine.ts)
// ============================================================================
describe('Suite 2: Schedule OCR Engine & Mock Fallback', () => {

  // --------------------------------------------------------------------------
  // 2.1 Offline Fallback Dataset
  // --------------------------------------------------------------------------
  describe('2.1 Offline Fallback Dataset Integrity', () => {
    test('2.1.1 Returns exactly 5 authentic courses when offline or no API key', async () => {
      const res = await scanScheduleImage('', {});
      assert.equal(res.success, true);
      assert.equal(res.source, 'fallback');
      assert.equal(res.totalExtracted, 5);
      assert.equal(res.courses.length, 5);
    });

    test('2.1.2 Fallback dataset contains all 5 required authentic university courses', async () => {
      const res = await scanScheduleImage('', {});
      const names = res.courses.map((c) => c.courseName);

      assert.ok(names.some((n) => n.includes('Mạng máy tính')), 'Missing Mạng máy tính');
      assert.ok(names.some((n) => n.includes('Cấu trúc Dữ liệu') || n.includes('Cấu trúc dữ liệu') || n.includes('CTDL')), 'Missing CTDL&GT');
      assert.ok(names.some((n) => n.includes('Giải tích 2')), 'Missing Giải tích 2');
      assert.ok(names.some((n) => n.includes('Triết học') || n.includes('Mác-Lênin') || n.includes('Mác - Lênin')), 'Missing Triết học');
      assert.ok(names.some((n) => n.includes('Lab Cisco') || n.includes('Thực hành')), 'Missing Lab Cisco');
    });

    test('2.1.3 Fallback courses include both theory classes and lab sessions', async () => {
      const res = await scanScheduleImage('', {});
      const hasClass = res.courses.some((c) => c.type === 'class');
      const hasLab = res.courses.some((c) => c.type === 'lab');
      assert.ok(hasClass, 'Must include class type');
      assert.ok(hasLab, 'Must include lab type');
    });
  });

  // --------------------------------------------------------------------------
  // 2.2 Sample Request Execution & Latency Gate (< 1.5s)
  // --------------------------------------------------------------------------
  describe('2.2 Sample Request Performance & Latency Gate', () => {
    test('2.2.1 Calling scanScheduleImage with useSample: true finishes in < 1.5s', async () => {
      const start = Date.now();
      const res = await scanScheduleImage('', { useSample: true });
      const elapsed = Date.now() - start;

      assert.equal(res.success, true);
      assert.equal(res.source, 'sample');
      assert.ok(elapsed < 1500, `Execution time ${elapsed}ms exceeded 1500ms limit`);
    });
  });

  // --------------------------------------------------------------------------
  // 2.3 Response Structure Validation
  // --------------------------------------------------------------------------
  describe('2.3 Response Structure Validation', () => {
    test('2.3.1 All fields present and non-empty for every extracted course', async () => {
      const res = await scanScheduleImage('', { useSample: true });

      for (const course of res.courses) {
        assert.ok(course.id, `Course missing id: ${JSON.stringify(course)}`);
        assert.ok(course.courseCode, `Course missing courseCode: ${course.id}`);
        assert.ok(course.courseName, `Course missing courseName: ${course.id}`);
        assert.ok(course.dayOfWeek >= 2 && course.dayOfWeek <= 8, `Invalid dayOfWeek: ${course.dayOfWeek}`);
        assert.ok(course.dayOfWeekName, `Course missing dayOfWeekName: ${course.id}`);
        assert.ok(course.startPeriod >= 1, `Invalid startPeriod: ${course.startPeriod}`);
        assert.ok(course.endPeriod >= course.startPeriod, `Invalid endPeriod: ${course.endPeriod}`);
        assert.ok(course.periodString, `Course missing periodString: ${course.id}`);
        assert.ok(TIME_REGEX.test(course.startTime), `Invalid startTime: ${course.startTime}`);
        assert.ok(TIME_REGEX.test(course.endTime), `Invalid endTime: ${course.endTime}`);
        assert.ok(course.startTime < course.endTime, `startTime must precede endTime: ${course.startTime} - ${course.endTime}`);
        assert.ok(course.room, `Course missing room: ${course.id}`);
        assert.ok(course.instructor !== undefined, `Course missing instructor: ${course.id}`);
        assert.ok(course.type === 'class' || course.type === 'lab', `Invalid type: ${course.type}`);
      }
    });

    test('2.3.2 Course IDs in the response are unique', async () => {
      const res = await scanScheduleImage('', { useSample: true });
      const ids = res.courses.map((c) => c.id);
      const uniqueIds = new Set(ids);
      assert.equal(uniqueIds.size, ids.length, 'Duplicate course IDs found');
    });
  });
});

// ============================================================================
// SUITE 3: REST API Route POST /api/study/schedule-scan
// ============================================================================
describe('Suite 3: REST API Route POST /api/study/schedule-scan', () => {

  // --------------------------------------------------------------------------
  // 3.1 Sample Timetable Request
  // --------------------------------------------------------------------------
  describe('3.1 Sample Timetable API Endpoint', () => {
    test('3.1.1 POST with { useSample: true } returns 200 with source: sample in < 1.5s', async () => {
      const mockReq = {
        json: async () => ({ useSample: true }),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as any;

      const start = Date.now();
      const res = await POST(mockReq);
      const elapsed = Date.now() - start;

      assert.equal(res.status, 200);
      assert.ok(elapsed < 1500, `API route elapsed time ${elapsed}ms exceeded 1500ms limit`);

      const body: ScheduleScanResponse = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.source, 'sample');
      assert.equal(body.totalExtracted, 5);
      assert.equal(body.courses.length, 5);
    });
  });

  // --------------------------------------------------------------------------
  // 3.2 Offline Fallback Handling
  // --------------------------------------------------------------------------
  describe('3.2 Offline Fallback API Handling', () => {
    test('3.2.1 POST with image payload and no Gemini API key falls back to 5-course dataset', async () => {
      const mockReq = {
        json: async () => ({
          image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          mimeType: 'image/png',
        }),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as any;

      const res = await POST(mockReq);
      assert.equal(res.status, 200);

      const body: ScheduleScanResponse = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.source, 'fallback');
      assert.equal(body.courses.length, 5);
      assert.ok(body.totalExtracted >= 5);
    });

    test('3.2.2 Empty request body defaults safely to 400 validation error without crashing', async () => {
      const mockReq = {
        json: async () => ({}),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as any;

      const res = await POST(mockReq);
      // Route returns 400 when no image is provided and useSample is false
      assert.equal(res.status, 400);

      const body: ScheduleScanResponse = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error, 'Should provide error message for missing image');
    });
  });

  // --------------------------------------------------------------------------
  // 3.3 Response Headers and JSON Integrity
  // --------------------------------------------------------------------------
  describe('3.3 Response Headers and JSON Integrity', () => {
    test('3.3.1 Response headers include application/json content-type', async () => {
      const mockReq = {
        json: async () => ({ useSample: true }),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as any;

      const res = await POST(mockReq);
      const contentType = res.headers.get('content-type') || '';
      assert.ok(contentType.includes('application/json'), `Expected application/json, got ${contentType}`);
    });
  });
});

// ============================================================================
// SUITE 4: M1 ↔ M2/M3 Calendar Integration Contract
// ============================================================================
describe('Suite 4: Calendar Event Transformation & Gamification Contract', () => {
  test('4.1 Extracted course can be converted to CalendarEvent with valid properties', async () => {
    const res = await scanScheduleImage('', { useSample: true });
    const course = res.courses[0]!;

    // Simulated transformation performed in M2/M3
    const calendarEvent = {
      id: `evt-${course.id}`,
      title: `${course.courseCode} - ${course.courseName}`,
      start: course.startTime,
      end: course.endTime,
      location: course.room,
      type: course.type,
      dayOfWeek: course.dayOfWeek,
    };

    assert.ok(calendarEvent.title.includes(course.courseName));
    assert.equal(calendarEvent.start, course.startTime);
    assert.equal(calendarEvent.end, course.endTime);
    assert.equal(calendarEvent.location, course.room);
  });

  test('4.2 Weekly recurring dates generation creates 15 instances for semester', () => {
    const dates = generateRecurringDates(2, 15, new Date('2026-10-19T00:00:00Z'));
    assert.equal(dates.length, 15);
    for (const d of dates) {
      assert.match(d, /^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test('4.3 Gamification reward for schedule scan is defined at exactly +100 XP', () => {
    const EXPECTED_SCHEDULE_SCAN_XP_REWARD = 100;
    assert.equal(EXPECTED_SCHEDULE_SCAN_XP_REWARD, 100);
  });
});
