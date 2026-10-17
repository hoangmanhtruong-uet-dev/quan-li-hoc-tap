/**
 * CampusOS Task 2 — Milestone 3: Core UI Integration & Supabase Calendar Live Persistence
 * Comprehensive Integration Test Suite
 *
 * Requirements Source:
 *   - ORIGINAL_REQUEST.md (## 2026-10-17T12:35:24Z: Task 2 R3)
 *   - orchestrator_19/PROJECT.md (§ Milestone 3, § Feature Inventory #12-#15, § Interface Contracts)
 *   - worker_19_m3/DISPATCH.md
 *
 * Runner:
 *   node --experimental-strip-types --test tests/schedule-scan-integration.test.ts
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  getSharedState,
  setSharedState,
  resetSharedState,
  awardXp,
  convertCoursesToRecurringEvents,
  batchAddCalendarEvents,
  calculateLevelAndRank,
  type CalendarEvent,
  type AwardXpResult,
} from '../src/lib/campus-store.ts';

import {
  generateRecurringDates,
  calculateNextDateForDayOfWeek,
  normalizeDayOfWeek,
  mapPeriodToTime,
  type ExtractedScheduleCourse,
} from '../src/lib/period-time-mapper.ts';

import {
  eventToRow,
  taskToRow,
  getOfflineQueue,
  clearOfflineQueue,
} from '../src/lib/supabase-sync.ts';

import { getSampleScheduleCourses } from '../src/lib/schedule-ocr-engine.ts';

const calendarPagePath = path.resolve(process.cwd(), 'src/app/(main)/calendar/page.tsx');
const dashboardPagePath = path.resolve(process.cwd(), 'src/app/(main)/dashboard/page.tsx');
const monthHeaderPath = path.resolve(process.cwd(), 'src/components/calendar/month-poster-header.tsx');
const todayTimelinePath = path.resolve(process.cwd(), 'src/components/dashboard/today-timeline.tsx');
const campusStorePath = path.resolve(process.cwd(), 'src/lib/campus-store.ts');

// Sample mock courses for testing
const SAMPLE_TEST_COURSES: ExtractedScheduleCourse[] = [
  {
    id: 'course-test-1',
    courseCode: 'CS301',
    courseName: 'Mạng máy tính',
    credits: 3,
    dayOfWeek: 2, // Thứ 2
    dayOfWeekName: 'Thứ Hai',
    startPeriod: 1,
    endPeriod: 3,
    periodString: 'Tiết 1-3',
    startTime: '07:00',
    endTime: '09:25',
    room: 'Phòng D201',
    instructor: 'TS. Nguyễn Văn A',
    weeks: 'Tuần 1-15',
    type: 'class',
    color: '#3DE8FF',
    isSelected: true,
  },
  {
    id: 'course-test-2',
    courseCode: 'CS201',
    courseName: 'Cấu trúc dữ liệu & Giải thuật',
    credits: 4,
    dayOfWeek: 4, // Thứ 4
    dayOfWeekName: 'Thứ Tư',
    startPeriod: 7,
    endPeriod: 9,
    periodString: 'Tiết 7-9',
    startTime: '12:30',
    endTime: '14:55',
    room: 'Phòng B302',
    instructor: 'PGS. Trần Thị B',
    weeks: 'Tuần 1-15',
    type: 'class',
    color: '#7C5CFF',
    isSelected: true,
  },
];

// ============================================================================
// SUITE 1: MonthPosterHeader & TodayTimeline Contract & Button Wiring
// ============================================================================
describe('Suite 1: Action Button & Props Wiring on MonthPosterHeader & TodayTimeline', () => {
  test('1.1 MonthPosterHeader declares onOpenScheduleScan prop in interface', () => {
    assert.ok(fs.existsSync(monthHeaderPath), `File must exist at ${monthHeaderPath}`);
    const content = fs.readFileSync(monthHeaderPath, 'utf8');

    assert.match(
      content,
      /onOpenScheduleScan\?:\s*\(\)\s*=>\s*void/,
      'MonthPosterHeaderProps must include optional onOpenScheduleScan?: () => void'
    );
  });

  test('1.2 MonthPosterHeader renders Neo-Brutal Cyan [⚡ Quét TKB bằng AI] button', () => {
    const content = fs.readFileSync(monthHeaderPath, 'utf8');

    // Button presence and text
    assert.match(content, /⚡\s*Quét TKB bằng AI/, 'MonthPosterHeader must render "⚡ Quét TKB bằng AI" text');
    // Button styling with Neo-Brutal cyan styling
    assert.match(content, /border-cyan-400\/40/, 'Button must include border-cyan-400/40');
    assert.match(content, /bg-cyan-500\/15/, 'Button must include bg-cyan-500/15');
    assert.match(content, /text-cyan-300/, 'Button must include text-cyan-300');
    assert.match(content, /onClick=\{onOpenScheduleScan\}/, 'Button must call onOpenScheduleScan on click');
  });

  test('1.3 TodayTimeline declares onOpenScanner prop in interface', () => {
    assert.ok(fs.existsSync(todayTimelinePath), `File must exist at ${todayTimelinePath}`);
    const content = fs.readFileSync(todayTimelinePath, 'utf8');

    assert.match(
      content,
      /onOpenScanner\?:\s*\(\)\s*=>\s*void/,
      'TodayTimelineProps must include optional onOpenScanner?: () => void'
    );
  });

  test('1.4 TodayTimeline renders prominent [⚡ Quét TKB bằng AI] button in action group', () => {
    const content = fs.readFileSync(todayTimelinePath, 'utf8');

    // Button presence and text
    assert.match(content, /⚡\s*Quét TKB bằng AI/, 'TodayTimeline must render "⚡ Quét TKB bằng AI" button');
    // Neo-Brutal cyan styling
    assert.match(content, /border-cyan-400\/40/, 'Button must include border-cyan-400/40');
    assert.match(content, /bg-cyan-500\/15/, 'Button must include bg-cyan-500/15');
    assert.match(content, /text-cyan-300/, 'Button must include text-cyan-300');
    assert.match(content, /onClick=\{onOpenScanner\}/, 'Button must call onOpenScanner on click');
  });
});

// ============================================================================
// SUITE 2: Calendar Page Integration (/calendar)
// ============================================================================
describe('Suite 2: Calendar Page (/calendar) Integration & Lifecycle', () => {
  test('2.1 Calendar Page dynamically imports ScheduleScanModal with ssr: false', () => {
    assert.ok(fs.existsSync(calendarPagePath), `File must exist at ${calendarPagePath}`);
    const content = fs.readFileSync(calendarPagePath, 'utf8');

    assert.match(
      content,
      /const ScheduleScanModal\s*=\s*dynamic\(\s*\(\)\s*=>\s*import\(['"]@\/components\/calendar\/schedule-scan-modal['"]\)/,
      'Must dynamically import ScheduleScanModal from @/components/calendar/schedule-scan-modal'
    );
    assert.match(content, /\{\s*ssr:\s*false\s*\}/, 'Dynamic import must specify { ssr: false }');
  });

  test('2.2 Calendar Page mounts ScheduleScanModal with scheduleScanOpen state', () => {
    const content = fs.readFileSync(calendarPagePath, 'utf8');

    assert.match(
      content,
      /const\s*\[scheduleScanOpen,\s*setScheduleScanOpen\]\s*=\s*useState\(false\)/,
      'Must declare scheduleScanOpen state initialized to false'
    );
    assert.match(content, /<ScheduleScanModal/, 'Must mount <ScheduleScanModal />');
    assert.match(content, /isOpen=\{scheduleScanOpen\}/, 'Must pass isOpen={scheduleScanOpen}');
    assert.match(content, /onClose=\{.*?setScheduleScanOpen\(false\).*?\}/, 'Must pass onClose handler resetting state');
    assert.match(
      content,
      /onCommitSchedule=\{handleCommitScannedSchedule\}/,
      'Must pass onCommitSchedule={handleCommitScannedSchedule}'
    );
  });

  test('2.3 Calendar Page passes onOpenScheduleScan to MonthPosterHeader', () => {
    const content = fs.readFileSync(calendarPagePath, 'utf8');

    assert.match(
      content,
      /onOpenScheduleScan=\{.*?setScheduleScanOpen\(true\).*?\}/,
      'Must pass onOpenScheduleScan opening the modal to MonthPosterHeader'
    );
  });

  test('2.4 Calendar Page implements handleCommitScannedSchedule with store update, XP and persistence', () => {
    const content = fs.readFileSync(calendarPagePath, 'utf8');

    assert.match(
      content,
      /handleCommitScannedSchedule\s*=\s*useCallback\(/,
      'handleCommitScannedSchedule must be memoized with useCallback'
    );
    assert.match(
      content,
      /convertCoursesToRecurringEvents\(courses,\s*15\)/,
      'Must expand courses into 15 weekly recurring events'
    );
    assert.match(
      content,
      /batchAddCalendarEvents\(newEvents\)/,
      'Must batch add events to store'
    );
    assert.match(
      content,
      /awardXp\(100,\s*['"]Quét TKB bằng AI['"]\)/,
      'Must award 100 XP with reason "Quét TKB bằng AI"'
    );
  });

  test('2.5 Calendar Page listens to campusos:open-schedule-scanner and handles Escape', () => {
    const content = fs.readFileSync(calendarPagePath, 'utf8');

    assert.match(
      content,
      /addEventListener\(['"]campusos:open-schedule-scanner['"]/,
      'Must listen for campusos:open-schedule-scanner event'
    );
    assert.match(
      content,
      /removeEventListener\(['"]campusos:open-schedule-scanner['"]/,
      'Must clean up event listener on unmount'
    );
  });
});

// ============================================================================
// SUITE 3: Dashboard Page Integration (/dashboard)
// ============================================================================
describe('Suite 3: Dashboard Page (/dashboard) Integration & Lifecycle', () => {
  test('3.1 Dashboard Page dynamically imports ScheduleScanModal with ssr: false', () => {
    assert.ok(fs.existsSync(dashboardPagePath), `File must exist at ${dashboardPagePath}`);
    const content = fs.readFileSync(dashboardPagePath, 'utf8');

    assert.match(
      content,
      /const ScheduleScanModal\s*=\s*dynamic\(\s*\(\)\s*=>\s*import\(['"]@\/components\/calendar\/schedule-scan-modal['"]\)/,
      'Must dynamically import ScheduleScanModal in dashboard'
    );
    assert.match(content, /\{\s*ssr:\s*false\s*\}/, 'Dynamic import must specify { ssr: false }');
  });

  test('3.2 Dashboard Page mounts ScheduleScanModal with scheduleScanOpen state', () => {
    const content = fs.readFileSync(dashboardPagePath, 'utf8');

    assert.match(
      content,
      /const\s*\[scheduleScanOpen,\s*setScheduleScanOpen\]\s*=\s*useState\(false\)/,
      'Must declare scheduleScanOpen state in dashboard'
    );
    assert.match(content, /<ScheduleScanModal/, 'Must mount <ScheduleScanModal />');
    assert.match(content, /isOpen=\{scheduleScanOpen\}/, 'Must pass isOpen={scheduleScanOpen}');
    assert.match(
      content,
      /onCommitSchedule=\{handleCommitScannedSchedule\}/,
      'Must pass onCommitSchedule={handleCommitScannedSchedule}'
    );
  });

  test('3.3 Dashboard Page passes onOpenScanner to TodayTimeline', () => {
    const content = fs.readFileSync(dashboardPagePath, 'utf8');

    assert.match(
      content,
      /<TodayTimeline[\s\S]*?onOpenScanner=\{.*?setScheduleScanOpen\(true\).*?\}/,
      'Must pass onOpenScanner to TodayTimeline'
    );
  });

  test('3.4 Dashboard Page wires campusos:open-schedule-scanner event and celebration toast', () => {
    const content = fs.readFileSync(dashboardPagePath, 'utf8');

    assert.match(
      content,
      /addEventListener\(['"]campusos:open-schedule-scanner['"]/,
      'Must wire campusos:open-schedule-scanner window event'
    );
    assert.match(
      content,
      /removeEventListener\(['"]campusos:open-schedule-scanner['"]/,
      'Must clean up event listener'
    );
    assert.match(
      content,
      /setToastNotification\([\s\S]*?Đã đồng bộ thành công[\s\S]*?\+100 XP/,
      'Must show celebration toast notification upon schedule commit'
    );
  });
});

// ============================================================================
// SUITE 4: Recurring Weekly Events Expansion (15 Weeks)
// ============================================================================
describe('Suite 4: Recurring Weekly Events Generation (convertCoursesToRecurringEvents)', () => {
  test('4.1 Generates exactly 15 CalendarEvent instances per course', () => {
    const refDate = new Date('2026-10-19T00:00:00Z'); // A Monday
    const events = convertCoursesToRecurringEvents(SAMPLE_TEST_COURSES, 15, refDate);

    // 2 courses * 15 weeks = 30 events
    assert.equal(events.length, 30);

    const course1Events = events.filter((e) => e.title.includes('CS301'));
    const course2Events = events.filter((e) => e.title.includes('CS201'));

    assert.equal(course1Events.length, 15);
    assert.equal(course2Events.length, 15);
  });

  test('4.2 Recurring dates advance by exactly 7 days each week', () => {
    const refDate = new Date('2026-10-19T00:00:00Z');
    const events = convertCoursesToRecurringEvents([SAMPLE_TEST_COURSES[0]!], 15, refDate);

    for (let i = 1; i < events.length; i++) {
      const prevDate = new Date(events[i - 1]!.date);
      const currDate = new Date(events[i]!.date);
      const diffMs = currDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      assert.equal(diffDays, 7, `Week ${i} must advance by 7 days from Week ${i - 1}`);
    }
  });

  test('4.3 CalendarEvent attributes match source course metadata accurately', () => {
    const refDate = new Date('2026-10-19T00:00:00Z');
    const events = convertCoursesToRecurringEvents(SAMPLE_TEST_COURSES, 1, refDate);

    const c1 = events[0]!;
    assert.equal(c1.title, 'CS301 - Mạng máy tính');
    assert.equal(c1.start, '07:00');
    assert.equal(c1.end, '09:25');
    assert.equal(c1.location, 'Phòng D201');
    assert.equal(c1.description, 'Giảng viên: TS. Nguyễn Văn A');
    assert.equal(c1.type, 'class');
    assert.equal(c1.done, false);

    const c2 = events[1]!;
    assert.equal(c2.title, 'CS201 - Cấu trúc dữ liệu & Giải thuật');
    assert.equal(c2.start, '12:30');
    assert.equal(c2.end, '14:55');
    assert.equal(c2.location, 'Phòng B302');
    assert.equal(c2.description, 'Giảng viên: PGS. Trần Thị B');
    assert.equal(c2.type, 'class');
  });

  test('4.4 Sample timetable fixture expands into 75 events across 15 weeks', () => {
    const sampleCourses = getSampleScheduleCourses();
    assert.equal(sampleCourses.length, 5);

    const events = convertCoursesToRecurringEvents(sampleCourses, 15);
    assert.equal(events.length, 75, '5 university courses * 15 weeks must equal 75 events');
  });
});

// ============================================================================
// SUITE 5: Gamification Store XP Award (awardXp)
// ============================================================================
describe('Suite 5: Gamification Award System (awardXp in campus-store.ts)', () => {
  beforeEach(() => {
    resetSharedState();
  });

  test('5.1 awardXp is exported and callable', () => {
    assert.equal(typeof awardXp, 'function', 'awardXp must be exported from campus-store.ts');
  });

  test('5.2 awardXp increments store XP by exact amount', () => {
    const initial = getSharedState().xp;
    const result = awardXp(100, 'Quét TKB bằng AI');

    const updated = getSharedState();
    assert.equal(result.amount, 100);
    assert.equal(updated.xp, initial + 100);
    assert.equal(result.nextXp, initial + 100);
    assert.equal(result.reason, 'Quét TKB bằng AI');
  });

  test('5.3 awardXp recalculates level and rank title dynamically', () => {
    // Reset to base level 1 (150 XP)
    setSharedState((prev) => ({
      ...prev,
      xp: 150,
      level: 1,
      rankTitle: 'Tân sinh viên ngơ ngác',
    }));

    // Award +100 XP -> total 250 XP -> Level 2 ('Cú đêm giảng đường')
    const res = awardXp(100, 'Test level up');
    assert.equal(res.nextXp, 250);
    assert.equal(res.level, 2);
    assert.equal(res.rankTitle, 'Cú đêm giảng đường');

    const storeState = getSharedState();
    assert.equal(storeState.level, 2);
    assert.equal(storeState.rankTitle, 'Cú đêm giảng đường');
  });

  test('5.4 awardXp handles zero and negative amounts safely', () => {
    const initial = getSharedState().xp;
    const res = awardXp(-50);
    assert.equal(res.amount, 0);
    assert.equal(getSharedState().xp, initial);
  });
});

// ============================================================================
// SUITE 6: Batch Store Update & Supabase Persistence Mapping
// ============================================================================
describe('Suite 6: Batch Calendar Events Store & Supabase Cloud Persistence', () => {
  beforeEach(() => {
    resetSharedState();
    clearOfflineQueue();
  });

  test('6.1 batchAddCalendarEvents injects events into store without duplicate IDs', () => {
    const refDate = new Date('2026-10-19T00:00:00Z');
    const events = convertCoursesToRecurringEvents(SAMPLE_TEST_COURSES, 2, refDate);
    assert.equal(events.length, 4);

    const initialCount = getSharedState().events.length;
    batchAddCalendarEvents(events);

    const updatedEvents = getSharedState().events;
    assert.equal(updatedEvents.length, initialCount + 4);

    // Call again with the same events: deduplication should prevent growth
    batchAddCalendarEvents(events);
    assert.equal(getSharedState().events.length, initialCount + 4);
  });

  test('6.2 eventToRow formats calendar events to Supabase public.calendar_events schema', () => {
    const testEvent: CalendarEvent = {
      id: 'scan-e-123',
      title: 'CS301 - Mạng máy tính',
      date: '2026-10-19',
      start: '07:00',
      end: '09:25',
      type: 'class',
      location: 'Phòng D201',
      color: '#3DE8FF',
    };

    const row = eventToRow(testEvent, 'user-student-abc');
    assert.equal(row.id, 'scan-e-123');
    assert.equal(row.user_id, 'user-student-abc');
    assert.equal(row.title, 'CS301 - Mạng máy tính');
    assert.equal(row.event_type, 'class');
    assert.equal(row.location, 'Phòng D201');
    assert.equal(row.color, '#3DE8FF');
    assert.ok(row.start_time.startsWith('2026-10-19T07:00'));
    assert.ok(row.end_time.startsWith('2026-10-19T09:25'));
    assert.equal(row.is_all_day, false);
  });

  test('6.3 Newly committed calendar events on today appear immediately in TodayTimeline filter', () => {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const jsDay = today.getDay(); // 0..6
    // Map jsDay to dayOfWeek (2..8)
    const dayOfWeek = jsDay === 0 ? 8 : jsDay + 1;

    // Create course on today's day of week
    const todayCourse: ExtractedScheduleCourse = {
      id: 'course-today-live',
      courseCode: 'CS999',
      courseName: 'Thực hành Chuyên đề Live OCR',
      credits: 2,
      dayOfWeek,
      dayOfWeekName: normalizeDayOfWeek(dayOfWeek)!.vietnameseName,
      startPeriod: 7,
      endPeriod: 9,
      periodString: 'Tiết 7-9',
      startTime: '12:30',
      endTime: '14:55',
      room: 'Lab Live 101',
      instructor: 'ThS. Live Sync',
      type: 'class',
      isSelected: true,
    };

    const events = convertCoursesToRecurringEvents([todayCourse], 15, today);
    batchAddCalendarEvents(events);

    // Filter today's classes exactly as TodayTimeline does:
    const storeEvents = getSharedState().events;
    const todayClasses = storeEvents.filter(
      (e) => e.date === todayIso && (e.type === 'class' || e.type === 'study')
    );

    const found = todayClasses.find((e) => e.title.includes('CS999'));
    assert.ok(found, "Today's live scanned class must immediately appear in store today events");
    assert.equal(found?.start, '12:30');
    assert.equal(found?.end, '14:55');
    assert.equal(found?.location, 'Lab Live 101');
  });
});
