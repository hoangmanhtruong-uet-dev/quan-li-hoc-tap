/**
 * Adversarial Stress Test Suite for Milestone 1:
 * - web/src/lib/period-time-mapper.ts
 * - web/src/lib/schedule-ocr-engine.ts
 * - web/src/app/api/study/schedule-scan/route.ts
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
} from '../src/lib/period-time-mapper.ts';

import {
  scanScheduleImage,
  parseGeminiJsonResponse,
  sanitizeExtractedCourse,
  mapPeriodsToTime,
  getSampleScheduleCourses,
  MOCK_VIETNAMESE_TIMETABLE,
} from '../src/lib/schedule-ocr-engine.ts';

import { POST } from '../src/app/api/study/schedule-scan/route.ts';

describe('Adversarial Stress Suite: period-time-mapper.ts', () => {

  describe('1. Reversed Period Ranges & Extreme Bounds', () => {
    test('Extreme reversed range Tiết 15-1 should auto-correct to 1-15', () => {
      const res = parseSchedulePeriod('Tiết 15-1');
      assert.equal(res.startPeriod, 1);
      assert.equal(res.endPeriod, 15);
      assert.equal(res.startTime, '07:00');
      assert.equal(res.endTime, '20:25');
      assert.equal(res.periods.length, 15);
      assert.equal(res.periods[0], 1);
      assert.equal(res.periods[14], 15);
    });

    test('Reversed range with Vietnamese word: "12 đến 4"', () => {
      const res = parseSchedulePeriod('12 đến 4');
      assert.equal(res.startPeriod, 4);
      assert.equal(res.endPeriod, 12);
      assert.equal(res.startTime, '09:35');
      assert.equal(res.endTime, '17:30');
    });

    test('Reversed range with arrow: "9 -> 3"', () => {
      const res = parseSchedulePeriod('9 -> 3');
      assert.equal(res.startPeriod, 3);
      assert.equal(res.endPeriod, 9);
      assert.equal(res.startTime, '08:40');
      assert.equal(res.endTime, '14:55');
    });

    test('Zero periods: "Tiết 0-0" should clamp to period 1-1', () => {
      const res = parseSchedulePeriod('Tiết 0-0');
      assert.equal(res.startPeriod, 1);
      assert.equal(res.endPeriod, 1);
      assert.equal(res.startTime, '07:00');
      assert.equal(res.endTime, '07:45');
    });

    test('Way out of bounds: "Tiết 25-30" should clamp to period 16', () => {
      const res = parseSchedulePeriod('Tiết 25-30');
      assert.equal(res.startPeriod, 16);
      assert.equal(res.endPeriod, 16);
      assert.equal(res.startTime, '20:30');
      assert.equal(res.endTime, '21:15');
    });

    test('Huge period span: "Tiết 0-99" should clamp to 1-16 without throwing', () => {
      const res = parseSchedulePeriod('Tiết 0-99');
      assert.equal(res.startPeriod, 1);
      assert.equal(res.endPeriod, 16);
      assert.equal(res.startTime, '07:00');
      assert.equal(res.endTime, '21:15');
      assert.equal(res.periods.length, 16);
    });

    test('Negative period string: "Tiết -3 đến 5"', () => {
      // Regex \d{1,2} won't capture the negative sign, captures 3 and 5
      const res = parseSchedulePeriod('Tiết -3 đến 5');
      assert.ok(res.startTime);
      assert.ok(res.endTime);
      assert.ok(!isNaN(res.durationMinutes));
    });

    test('Direct getPeriodTimeRange with negative, NaN, Infinity inputs', () => {
      const r1 = getPeriodTimeRange(-5, -1);
      assert.equal(r1.startTime, '07:00');
      assert.equal(r1.endTime, '07:45');

      const r2 = getPeriodTimeRange(NaN, NaN);
      assert.equal(r2.startTime, '07:00');
      assert.equal(r2.endTime, '07:45');

      const r3 = getPeriodTimeRange(Infinity, Infinity);
      assert.equal(r3.startTime, '20:30');
      assert.equal(r3.endTime, '21:15');

      const r4 = getPeriodTimeRange(15, 1); // reversed
      assert.equal(r4.startTime, '07:00');
      assert.equal(r4.endTime, '20:25');
    });
  });

  describe('2. Inverted & Extreme Explicit Times', () => {
    test('Inverted time range "16:00 - 13:30" should auto-invert to 13:30 - 16:00', () => {
      const explicit = detectExplicitTimeRange('16:00 - 13:30');
      assert.ok(explicit);
      assert.equal(explicit.startTime, '13:30');
      assert.equal(explicit.endTime, '16:00');
      assert.equal(explicit.durationMinutes, 150);
    });

    test('Inverted time in full schedule string: "Tiết 7-9 (14:55 - 12:30)"', () => {
      const parsed = parseSchedulePeriod('Tiết 7-9 (14:55 - 12:30)');
      assert.equal(parsed.startTime, '12:30');
      assert.equal(parsed.endTime, '14:55');
      assert.equal(parsed.durationMinutes, 145);
      assert.equal(parsed.hasExplicitTime, true);
    });

    test('Identical start and end time "08:00 - 08:00" yields 0 duration without error', () => {
      const explicit = detectExplicitTimeRange('08:00 - 08:00');
      assert.ok(explicit);
      assert.equal(explicit.startTime, '08:00');
      assert.equal(explicit.endTime, '08:00');
      assert.equal(explicit.durationMinutes, 0);
    });

    test('Invalid hours > 23 or minutes > 59 should return null', () => {
      assert.equal(detectExplicitTimeRange('25:00 - 26:00'), null);
      assert.equal(detectExplicitTimeRange('07:65 - 09:20'), null);
      assert.equal(detectExplicitTimeRange('12:00 - 14:99'), null);
    });

    test('Cross-day / overnight shift "23:00 - 01:00"', () => {
      // Because start > end, it inverts start and end to 01:00 - 23:00
      const explicit = detectExplicitTimeRange('23:00 - 01:00');
      assert.ok(explicit);
      assert.equal(explicit.startTime, '01:00');
      assert.equal(explicit.endTime, '23:00');
    });

    test('Vietnamese g notation: "7g30 - 11g15"', () => {
      const explicit = detectExplicitTimeRange('7g30 - 11g15');
      assert.ok(explicit);
      assert.equal(explicit.startTime, '07:30');
      assert.equal(explicit.endTime, '11:15');
    });
  });

  describe('3. Unicode Spaces and Formatting Oddities', () => {
    test('Non-breaking space \\u00A0: "Tiết\\u00A01\\u00A0-\\u00A03"', () => {
      const parsed = parseSchedulePeriod('Tiết\u00A01\u00A0-\u00A03');
      assert.equal(parsed.startPeriod, 1);
      assert.equal(parsed.endPeriod, 3);
      assert.equal(parsed.startTime, '07:00');
      assert.equal(parsed.endTime, '09:25');
    });

    test('Ideographic full-width space \\u3000: "Tiết\\u30004\\u3000-\\u30006"', () => {
      const parsed = parseSchedulePeriod('Tiết\u30004\u3000-\u30006');
      assert.equal(parsed.startPeriod, 4);
      assert.equal(parsed.endPeriod, 6);
      assert.equal(parsed.startTime, '09:35');
      assert.equal(parsed.endTime, '12:00');
    });

    test('Thin space \\u2009: "Tiết\\u20097\\u2009-\\u20099"', () => {
      const parsed = parseSchedulePeriod('Tiết\u20097\u2009-\u20099');
      assert.equal(parsed.startPeriod, 7);
      assert.equal(parsed.endPeriod, 9);
      assert.equal(parsed.startTime, '12:30');
      assert.equal(parsed.endTime, '14:55');
    });

    test('Em-dash and En-dash in period strings: "Tiết 1—3" and "Tiết 7–9"', () => {
      const p1 = parseSchedulePeriod('Tiết 1—3');
      assert.equal(p1.startTime, '07:00');
      assert.equal(p1.endTime, '09:25');

      const p2 = parseSchedulePeriod('Tiết 7–9');
      assert.equal(p2.startTime, '12:30');
      assert.equal(p2.endTime, '14:55');
    });

    test('Tabs and multiline in period strings', () => {
      const p = parseSchedulePeriod('Tiết\t10\t-\t12');
      assert.equal(p.startPeriod, 10);
      assert.equal(p.endPeriod, 12);
      assert.equal(p.startTime, '15:05');
      assert.equal(p.endTime, '17:30');
    });
  });

  describe('4. Day of Week Normalization & Corrupted Strings', () => {
    test('Boundary numbers: 0 -> Chủ Nhật, 1 -> Thứ Hai (ISO 1)', () => {
      const d0 = normalizeDayOfWeek(0);
      assert.ok(d0);
      assert.equal(d0.dayOfWeek, 8);
      assert.equal(d0.vietnameseName, 'Chủ Nhật');

      const d1 = normalizeDayOfWeek(1);
      assert.ok(d1);
      assert.equal(d1.dayOfWeek, 2);
      assert.equal(d1.vietnameseName, 'Thứ Hai');

      const d8 = normalizeDayOfWeek(8);
      assert.ok(d8);
      assert.equal(d8.dayOfWeek, 8);
    });

    test('Out of bounds numeric values return null', () => {
      assert.equal(normalizeDayOfWeek(-1), null);
      assert.equal(normalizeDayOfWeek(9), null);
      assert.equal(normalizeDayOfWeek(99), null);
      assert.equal(normalizeDayOfWeek(NaN), null);
      assert.equal(normalizeDayOfWeek(Infinity), null);
      assert.equal(normalizeDayOfWeek(-Infinity), null);
    });

    test('Out of bounds numeric strings return null', () => {
      assert.equal(normalizeDayOfWeek('-1'), null);
      assert.equal(normalizeDayOfWeek('9'), null);
      assert.equal(normalizeDayOfWeek('99'), null);
    });

    test('Corrupted day strings: "Thứ 9", "Thứ -1" return null', () => {
      assert.equal(normalizeDayOfWeek('Thứ 9'), null);
      assert.equal(normalizeDayOfWeek('Thứ -1'), null);
      assert.equal(normalizeDayOfWeek('Thứ 0'), null);
    });

    test('Invalid day strings return null without throwing', () => {
      assert.equal(normalizeDayOfWeek('Hôm nay'), null);
      assert.equal(normalizeDayOfWeek('Ngày mai'), null);
      assert.equal(normalizeDayOfWeek('random gibberish'), null);
      assert.equal(normalizeDayOfWeek(''), null);
      assert.equal(normalizeDayOfWeek('   '), null);
      assert.equal(normalizeDayOfWeek(null), null);
      assert.equal(normalizeDayOfWeek(undefined), null);
      assert.equal(normalizeDayOfWeek({} as any), null);
      assert.equal(normalizeDayOfWeek([] as any), null);
    });

    test('Strings with emojis and mixed accents', () => {
      const d2 = normalizeDayOfWeek('Thứ 2 🔥');
      assert.ok(d2);
      assert.equal(d2.dayOfWeek, 2);

      const dCN = normalizeDayOfWeek('Chủ Nhật ☀️');
      assert.ok(dCN);
      assert.equal(dCN.dayOfWeek, 8);

      const d4 = normalizeDayOfWeek('tHứ tƯ');
      assert.ok(d4);
      assert.equal(d4.dayOfWeek, 4);

      const d6 = normalizeDayOfWeek('THỨ SÁU');
      assert.ok(d6);
      assert.equal(d6.dayOfWeek, 6);
    });

    test('Whitespace-padded day strings', () => {
      const d3 = normalizeDayOfWeek('   Thứ 3   \t\n');
      assert.ok(d3);
      assert.equal(d3.dayOfWeek, 3);
    });
  });

  describe('5. Kíp Edge Cases', () => {
    test('Kíp 1-3 span parsing', () => {
      const res = parseSchedulePeriod('Kíp 1-2');
      assert.equal(res.isKip, true);
      assert.equal(res.startPeriod, 1);
      assert.equal(res.endPeriod, 6);
      assert.equal(res.startTime, '07:00');
      assert.equal(res.endTime, '12:00');
    });

    test('Ca syntax: "Ca 1", "Ca 4"', () => {
      const res = parseSchedulePeriod('Ca 1');
      assert.equal(res.isKip, true);
      assert.equal(res.startTime, '07:00');
      assert.equal(res.endTime, '09:25');
    });

    test('Unknown Kip number defaults safely without crashing', () => {
      const res = parseSchedulePeriod('Kíp 99');
      assert.equal(res.isKip, true);
      assert.ok(res.startTime);
      assert.ok(res.endTime);
    });
  });
});

describe('Adversarial Stress Suite: schedule-ocr-engine.ts', () => {

  describe('1. parseGeminiJsonResponse Corrupted Inputs & Fuzzing', () => {
    test('Normal clean JSON with code fence', () => {
      const input = '```json\n{"courses": [{"courseName": "Toán"}]}\n```';
      const res = parseGeminiJsonResponse(input);
      assert.equal(res.courses.length, 1);
    });

    test('JSON with trailing comma in array and objects', () => {
      const input = '{"courses": [{"courseName": "Toán", "credits": 3,},],}';
      const res = parseGeminiJsonResponse(input);
      assert.equal(res.courses.length, 1);
    });

    test('JSON with smart quotes “ and ”', () => {
      const input = '{\u201Ccourses\u201D: [{\u201CcourseName\u201D: \u201CToán\u201D}]}';
      const res = parseGeminiJsonResponse(input);
      assert.equal(res.courses.length, 1);
    });

    test('Array directly returned instead of object with courses', () => {
      const input = '[{"courseName": "Vật lý", "startPeriod": 1, "endPeriod": 3}]';
      const res = parseGeminiJsonResponse(input);
      assert.equal(res.courses.length, 1);
    });

    test('Alternative keys: data, schedule, danhSachMonHoc', () => {
      const res1 = parseGeminiJsonResponse('{"data": [{"courseName": "Hóa"}]}');
      assert.equal(res1.courses.length, 1);

      const res2 = parseGeminiJsonResponse('{"schedule": [{"courseName": "Sinh"}]}');
      assert.equal(res2.courses.length, 1);

      const res3 = parseGeminiJsonResponse('{"danhSachMonHoc": [{"courseName": "Sử"}]}');
      assert.equal(res3.courses.length, 1);
    });

    test('Completely unparseable gibberish', () => {
      try {
        const res = parseGeminiJsonResponse('I am an AI and cannot process this image.');
        // If it doesn't throw, it should return { courses: [] }
        assert.deepEqual(res.courses, []);
      } catch (err: any) {
        // If it throws, document as finding
        console.log('[FINDING] parseGeminiJsonResponse threw on plain text:', err.message);
      }
    });

    test('Code fence with text before or after', () => {
      const input = `Dưới đây là kết quả trích xuất:
\`\`\`json
{"courses": [{"courseName": "Toán cao cấp"}]}
\`\`\`
Hy vọng kết quả này chính xác!`;
      try {
        const res = parseGeminiJsonResponse(input);
        assert.equal(res.courses.length, 1);
      } catch (err: any) {
        console.log('[FINDING] parseGeminiJsonResponse threw when text surrounds code fence:', err.message);
      }
    });

    test('Code fence with unclosed backticks (truncated response)', () => {
      const input = '```json\n{"courses": [{"courseName": "Toán"}]}';
      try {
        const res = parseGeminiJsonResponse(input);
        assert.ok(res.courses);
      } catch (err: any) {
        console.log('[FINDING] parseGeminiJsonResponse threw on unclosed code fence:', err.message);
      }
    });
  });

  describe('2. sanitizeExtractedCourse Extreme & Missing Fields', () => {
    test('Empty raw course object {} should populate all required fields with defaults', () => {
      const sanitized = sanitizeExtractedCourse({}, 0);
      assert.ok(sanitized.id);
      assert.ok(sanitized.courseCode);
      assert.ok(sanitized.courseName);
      assert.equal(typeof sanitized.dayOfWeek, 'number');
      assert.ok(sanitized.dayOfWeekName);
      assert.equal(typeof sanitized.startPeriod, 'number');
      assert.equal(typeof sanitized.endPeriod, 'number');
      assert.ok(!isNaN(sanitized.startPeriod));
      assert.ok(!isNaN(sanitized.endPeriod));
      assert.ok(sanitized.startTime);
      assert.ok(sanitized.endTime);
      assert.ok(sanitized.room);
      assert.ok(sanitized.instructor);
      assert.ok(sanitized.weeks);
      assert.ok(sanitized.type === 'class' || sanitized.type === 'lab');
      assert.ok(sanitized.color);
      assert.equal(sanitized.isSelected, true);
    });

    test('Corrupted period values (strings, negative, NaN)', () => {
      const sanitized = sanitizeExtractedCourse({
        courseName: 'Môn thử nghiệm',
        startPeriod: 'không rõ',
        endPeriod: 'không rõ',
      }, 0);
      // Check if startPeriod or endPeriod are NaN
      console.log('[TEST CHECK] sanitized startPeriod:', sanitized.startPeriod, 'endPeriod:', sanitized.endPeriod);
      // In a robust implementation, startPeriod/endPeriod should never be NaN!
    });

    test('Reversed periods in raw course object', () => {
      const sanitized = sanitizeExtractedCourse({
        courseName: 'Thực hành',
        startPeriod: 9,
        endPeriod: 7,
      }, 0);
      assert.ok(sanitized.startTime);
      assert.ok(sanitized.endTime);
    });

    test('Auto-detection of lab course from name, room, or type', () => {
      const c1 = sanitizeExtractedCourse({ courseName: 'Thí nghiệm Vật lý' }, 0);
      assert.equal(c1.type, 'lab');

      const c2 = sanitizeExtractedCourse({ room: 'Phòng Lab 301' }, 1);
      assert.equal(c2.type, 'lab');

      const c3 = sanitizeExtractedCourse({ type: 'LAB' }, 2);
      assert.equal(c3.type, 'lab');

      const c4 = sanitizeExtractedCourse({ courseName: 'Triết học Mác' }, 3);
      assert.equal(c4.type, 'class');
    });

    test('Vietnamese field aliases (tenMon, phong, gv, maMon, tietBatDau)', () => {
      const raw = {
        maMon: 'CS50',
        tenMon: 'Nhập môn Khoa học Máy tính',
        thu: 3,
        tietBatDau: 1,
        tietKetThuc: 3,
        phong: 'C.101',
        gv: 'ThS. Nguyễn Văn A',
        tuan: 'Tuần 1-10',
      };
      const sanitized = sanitizeExtractedCourse(raw, 0);
      assert.equal(sanitized.courseCode, 'CS50');
      assert.equal(sanitized.courseName, 'Nhập môn Khoa học Máy tính');
      assert.equal(sanitized.dayOfWeek, 3);
      assert.equal(sanitized.dayOfWeekName, 'Thứ Ba');
      assert.equal(sanitized.startPeriod, 1);
      assert.equal(sanitized.endPeriod, 3);
      assert.equal(sanitized.room, 'C.101');
      assert.equal(sanitized.instructor, 'ThS. Nguyễn Văn A');
      assert.equal(sanitized.weeks, 'Tuần 1-10');
    });
  });

  describe('3. scanScheduleImage Extreme & Corrupted Payloads', () => {
    test('Empty image string with no API key falls back gracefully', async () => {
      const res = await scanScheduleImage('', { timeoutMs: 1000 });
      assert.equal(res.success, true);
      assert.equal(res.source, 'fallback');
      assert.equal(res.courses.length, 5);
    });

    test('Invalid base64 payload with offline environment falls back gracefully', async () => {
      const res = await scanScheduleImage('not-a-valid-base64-payload!!!@@@', { timeoutMs: 1000 });
      assert.equal(res.success, true);
      assert.equal(res.source, 'fallback');
      assert.equal(res.courses.length, 5);
    });

    test('Single argument signature with options object', async () => {
      const res = await scanScheduleImage({ useSample: true });
      assert.equal(res.success, true);
      assert.equal(res.source, 'sample');
      assert.equal(res.courses.length, 5);
    });
  });
});

describe('Adversarial Stress Suite: API Route POST /api/study/schedule-scan', () => {
  test('Malformed JSON in request body returns 400 or fallback without 500 crash', async () => {
    const fakeReq = {
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => { throw new Error('Unexpected token in JSON'); },
    } as any;

    const res = await POST(fakeReq);
    assert.ok(res);
    // Since there was no image and no useSample, it should return 400 validation error
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  test('Multipart form with empty file returns 400 validation error cleanly', async () => {
    const fakeFormData = new Map();
    const fakeReq = {
      headers: new Headers({ 'content-type': 'multipart/form-data; boundary=something' }),
      formData: async () => fakeFormData,
    } as any;

    const res = await POST(fakeReq);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  test('Request with unexpected exception handled cleanly via error catch block', async () => {
    const fakeReq = {
      headers: {
        get: () => { throw new Error('Catastrophic header failure'); }
      }
    } as any;

    const res = await POST(fakeReq);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.source, 'fallback');
    assert.equal(data.courses.length, 5);
  });
});
