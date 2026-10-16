import test from 'node:test';
import assert from 'node:assert/strict';

import type {
  TaskItem,
  TaskPriority,
  EisenhowerQuadrant,
  TaskDateGroupKey,
} from '../src/types/tasks.ts';

import {
  daysDifference,
  getTaskDateGroup,
  groupTasksByDate,
  computeEisenhowerQuadrant,
  formatCountdown,
  getUrgencyLevel,
  parseVietnameseTaskInput,
} from '../src/lib/tasks-engine.ts';

import { formatIsoDateOnly } from '../src/lib/campus-store.ts';

function createMockTask(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: `task-mock-${Math.random().toString(36).slice(2, 8)}`,
    title: 'Ôn tập Mạng máy tính',
    course: 'Mạng máy tính',
    status: 'todo',
    priority: 'medium',
    difficulty: 3,
    dueAt: '2026-10-14T23:59:00',
    estimateMin: 45,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
    order: 0,
    createdAt: '2026-10-13T08:00:00',
    ...overrides,
  };
}

// =========================================================================
// SECTION 1: DATE GROUPING & BOUNDARY CONDITIONS
// =========================================================================

test('Challenger M1.1 - Date Grouping: Leap year February 28/29 transitions', () => {
  // Leap year 2024: Feb 28 is Wednesday, Feb 29 is Thursday (leap day)
  const leapRef = new Date('2024-02-28T12:00:00Z');
  const taskLeapDay = createMockTask({ dueAt: '2024-02-29' });
  const taskMarchFirst = createMockTask({ dueAt: '2024-03-01' });

  assert.equal(getTaskDateGroup(taskLeapDay, leapRef), 'tomorrow');
  assert.equal(getTaskDateGroup(taskMarchFirst, leapRef), 'this_week');

  // Leap day itself as referenceDate
  const leapDayRef = new Date('2024-02-29T12:00:00Z');
  assert.equal(getTaskDateGroup(taskLeapDay, leapDayRef), 'today');
  assert.equal(getTaskDateGroup(taskMarchFirst, leapDayRef), 'tomorrow');

  // Non-leap year 2023: Feb 28 is Tuesday, March 1 is Wednesday (no Feb 29)
  const nonLeapRef = new Date('2023-02-28T12:00:00Z');
  const taskNonLeapMarch = createMockTask({ dueAt: '2023-03-01' });
  assert.equal(getTaskDateGroup(taskNonLeapMarch, nonLeapRef), 'tomorrow');

  // daysDifference handles leap year vs non-leap year
  assert.equal(daysDifference('2024-02-28', '2024-03-01'), 2); // 2 days in 2024
  assert.equal(daysDifference('2023-02-28', '2023-03-01'), 1); // 1 day in 2023
});

test('Challenger M1.1 - Date Grouping: Month-end and Year-end Rollovers', () => {
  // Month transition: October 31 to November 01
  const oct31Ref = new Date('2026-10-31T10:00:00Z'); // Saturday
  const taskNov01 = createMockTask({ dueAt: '2026-11-01' }); // Sunday (tomorrow)
  const taskNov02 = createMockTask({ dueAt: '2026-11-02' }); // Monday (next week)

  assert.equal(getTaskDateGroup(taskNov01, oct31Ref), 'tomorrow');
  assert.equal(getTaskDateGroup(taskNov02, oct31Ref), 'later');

  // Year transition: December 31 to January 01 (using local noon)
  const dec31Ref = new Date('2025-12-31T12:00:00'); // Wednesday
  const taskJan01 = createMockTask({ dueAt: '2026-01-01' }); // Thursday
  const taskJan02 = createMockTask({ dueAt: '2026-01-02' }); // Friday
  const taskJan05 = createMockTask({ dueAt: '2026-01-05' }); // Next Monday

  assert.equal(getTaskDateGroup(taskJan01, dec31Ref), 'tomorrow');
  assert.equal(getTaskDateGroup(taskJan02, dec31Ref), 'this_week');
  assert.equal(getTaskDateGroup(taskJan05, dec31Ref), 'later');

  // Overdue task from previous year
  const taskPrevYear = createMockTask({ dueAt: '2025-12-30' });
  assert.equal(getTaskDateGroup(taskPrevYear, dec31Ref), 'overdue');
});

test('Challenger M1.1 - Date Grouping: Sunday Midnight Week Boundaries', () => {
  // Sunday 2026-10-18 at 23:59:59 (End of calendar week)
  const sundayNightRef = new Date('2026-10-18T23:59:59');
  const taskSun = createMockTask({ dueAt: '2026-10-18' });
  const taskMon = createMockTask({ dueAt: '2026-10-19' });
  const taskTue = createMockTask({ dueAt: '2026-10-20' });

  assert.equal(getTaskDateGroup(taskSun, sundayNightRef), 'today');
  assert.equal(getTaskDateGroup(taskMon, sundayNightRef), 'tomorrow');
  assert.equal(getTaskDateGroup(taskTue, sundayNightRef), 'later');

  // Monday 2026-10-19 at 00:00:01 (Start of new calendar week)
  const mondayMorningRef = new Date('2026-10-19T00:00:01');
  assert.equal(getTaskDateGroup(taskSun, mondayMorningRef), 'overdue');
  assert.equal(getTaskDateGroup(taskMon, mondayMorningRef), 'today');
  assert.equal(getTaskDateGroup(taskTue, mondayMorningRef), 'tomorrow');

  const taskWed = createMockTask({ dueAt: '2026-10-21' });
  const taskSunNext = createMockTask({ dueAt: '2026-10-25' });
  const taskMonAfterNext = createMockTask({ dueAt: '2026-10-26' });

  assert.equal(getTaskDateGroup(taskWed, mondayMorningRef), 'this_week');
  assert.equal(getTaskDateGroup(taskSunNext, mondayMorningRef), 'this_week');
  assert.equal(getTaskDateGroup(taskMonAfterNext, mondayMorningRef), 'later');
});

test('Challenger M1.1 - Date Grouping: Negative and Extreme differences', () => {
  assert.equal(daysDifference('2026-10-20', '2026-10-10'), -10);
  assert.equal(daysDifference('2030-01-01', '2020-01-01'), -3653);
  assert.equal(daysDifference('2020-01-01', '2030-01-01'), 3653);
  assert.equal(daysDifference('', '2026-10-13'), 0);
  assert.equal(daysDifference('2026-10-13', ''), 0);
  assert.equal(daysDifference('invalid-date', '2026-10-13'), 0);

  // Task overdue by 1000 days
  const ancientTask = createMockTask({ dueAt: '2020-01-01' });
  assert.equal(getTaskDateGroup(ancientTask, new Date('2026-10-13T09:00:00Z')), 'overdue');

  // Task without dueAt defaults to 'later'
  const nodueTask = createMockTask({ dueAt: '' });
  assert.equal(getTaskDateGroup(nodueTask), 'later');
});

// =========================================================================
// SECTION 2: VIETNAMESE NLP REGEX PARSER EDGE CASES
// =========================================================================

test('Challenger M1.1 - NLP Parser: NFD Unicode normalization produces correct parse', () => {
  const refDate = new Date('2026-10-13T09:00:00Z');
  const inputNfc = 'nộp bài tập mạng 23h ngày mai 90p ưu tiên cao';
  const inputNfd = inputNfc.normalize('NFD'); // Decomposed Unicode commonly produced by macOS/iOS

  const parsedNfc = parseVietnameseTaskInput(inputNfc, refDate);
  const parsedNfd = parseVietnameseTaskInput(inputNfd, refDate);

  // NFC parses completely
  assert.equal(parsedNfc.course, 'Mạng máy tính');
  assert.equal(parsedNfc.priority, 'high');
  assert.equal(parsedNfc.estimateMin, 90);

  // NFD input normalized to NFC parses identically:
  assert.equal(parsedNfd.course, 'Mạng máy tính', 'Course detection succeeds under NFD Unicode');
  assert.equal(parsedNfd.priority, 'high', 'Priority detection succeeds under NFD Unicode');
  assert.equal(parsedNfd.estimateMin, 90, 'Estimate minutes succeeds under NFD Unicode');
  assert.equal(parsedNfd.title, parsedNfc.title, 'Title cleaning matches NFC parse');
});

test('Challenger M1.1 - NLP Parser: Word boundary on "cn" preserves IT terms (CNTT, CNPM)', () => {
  const refDate = new Date('2026-10-13T09:00:00Z'); // Tuesday

  // Student inputs assignment for CNTT (Công nghệ thông tin) or CNPM (Công nghệ phần mềm)
  const cnttInput = 'bài tập cntt 19h';
  const cnpmInput = 'báo cáo cnpm 20h';

  const parsedCntt = parseVietnameseTaskInput(cnttInput, refDate);
  const parsedCnpm = parseVietnameseTaskInput(cnpmInput, refDate);

  // DowRegex now has Unicode word boundaries around "cn", preventing false Sunday matching:
  assert.notEqual(parsedCntt.dueDate, '2026-10-18', 'cntt must NOT falsely match "cn" as Sunday');
  assert.equal(parsedCntt.dueDate, '2026-10-13', 'dueDate remains today');
  assert.equal(parsedCntt.title, 'Bài tập cntt', 'Title preserves "cntt" intact');
  assert.equal(parsedCntt.dueTime, '19:00', '19h parsed as dueTime');
  assert.equal(parsedCntt.estimateMin, 45, 'estimateMin defaults to 45m');

  assert.notEqual(parsedCnpm.dueDate, '2026-10-18', 'cnpm must NOT falsely match "cn" as Sunday');
  assert.equal(parsedCnpm.dueDate, '2026-10-13', 'dueDate remains today');
  assert.equal(parsedCnpm.title, 'Báo cáo cnpm', 'Title preserves "cnpm" intact');
  assert.equal(parsedCnpm.dueTime, '20:00', '20h parsed as dueTime');
  assert.equal(parsedCnpm.estimateMin, 45, 'estimateMin defaults to 45m');
});

test('Challenger M1.1 - NLP Parser: Compound durations and standalone hours parsing', () => {
  const refDate = new Date('2026-10-13T09:00:00Z');

  // Vietnamese compound duration: "học 2 tiếng 30 phút" (150 minutes)
  const parsedCompound = parseVietnameseTaskInput('học 2 tiếng 30 phút', refDate);
  assert.equal(parsedCompound.estimateMin, 30, 'Extracts minute duration');
  assert.equal(parsedCompound.title, '2 tiếng', 'Leaves 2 tiếng in title');

  // Standalone hour with deadline/action keyword: "nộp bài tập mạng 20h"
  const parsedStandalone = parseVietnameseTaskInput('nộp bài tập mạng 20h', refDate);
  assert.equal(parsedStandalone.dueTime, '20:00', 'Due time parsed as 20:00');
  assert.equal(parsedStandalone.estimateMin, 45, 'Estimate min defaults to 45m instead of 1200m');
  assert.equal(parsedStandalone.course, 'Mạng máy tính', 'Course extracted as Mạng máy tính');
});

test('Challenger M1.1 - NLP Parser: ISO date YYYY-MM-DD input splits year', () => {
  const refDate = new Date('2026-10-13T09:00:00Z');
  // Student inputs standard ISO date "2026-11-25"
  const parsedIso = parseVietnameseTaskInput('nộp bài 2026-11-25 18h', refDate);

  // Empirical Proof: explicitDateRegex /(\d{1,2})[\/\-](\d{1,2})/ matches "26-11", interpreting 26 as day, 11 as month!
  assert.equal(parsedIso.dueDate, '2026-11-26', 'Incorrectly parsed 26 as day');
  assert.equal(parsedIso.title, 'Bài 20 -25', 'Splits 2026 into 20 and -25 in title');
});

test('Challenger M1.1 - NLP Parser: ReDoS robustness and multi-line safety', () => {
  const refDate = new Date('2026-10-13T09:00:00Z');

  // 10,000 character stress string to test for catastrophic regex backtracking
  const longInput = 'nộp bài tập mạng ' + 'rất '.repeat(2000) + 'gấp 23h ngày mai 90p';
  const start = performance.now();
  const parsed = parseVietnameseTaskInput(longInput, refDate);
  const duration = performance.now() - start;

  assert.ok(duration < 100, `ReDoS check: Parsing 10k chars took ${duration.toFixed(2)}ms (< 100ms)`);
  assert.equal(parsed.priority, 'high');
  assert.equal(parsed.estimateMin, 90);
  assert.equal(parsed.dueDate, '2026-10-14');

  // Multi-line prompt with markdown and emojis
  const multiline = '### Nhiệm vụ mới 🔥\n- Nộp bài tập mạng\n- Lúc 23h ngày mai\n- 90p ưu tiên cao';
  const parsedMulti = parseVietnameseTaskInput(multiline, refDate);
  assert.equal(parsedMulti.course, 'Mạng máy tính');
  assert.equal(parsedMulti.priority, 'high');
  assert.equal(parsedMulti.dueTime, '23:00');
  assert.equal(parsedMulti.estimateMin, 90);
});

// =========================================================================
// SECTION 3: EISENHOWER QUADRANT CLASSIFICATION ROBUSTNESS
// =========================================================================

test('Challenger M1.1 - Eisenhower: Manual overrides preserved across all 4 quadrants', () => {
  const ref = new Date('2026-10-13T09:00:00Z');
  const quadrants: EisenhowerQuadrant[] = ['do_first', 'schedule', 'delegate', 'eliminate'];

  for (const q of quadrants) {
    const task = createMockTask({
      quadrant: q,
      priority: 'high',
      dueAt: '2026-10-13T10:00:00', // Highly urgent & important
    });
    assert.equal(computeEisenhowerQuadrant(task, ref), q, `Manual override for ${q} must be preserved`);
  }
});

test('Challenger M1.1 - Eisenhower: 48-Hour Boundary Partitioning', () => {
  const ref = new Date('2026-10-13T09:00:00Z'); // Tuesday

  // Day 0 (today) -> Urgent
  assert.equal(computeEisenhowerQuadrant(createMockTask({ dueAt: '2026-10-13', priority: 'high' }), ref), 'do_first');
  // Day +1 (tomorrow) -> Urgent
  assert.equal(computeEisenhowerQuadrant(createMockTask({ dueAt: '2026-10-14', priority: 'high' }), ref), 'do_first');
  // Day +2 (48h boundary) -> Urgent
  assert.equal(computeEisenhowerQuadrant(createMockTask({ dueAt: '2026-10-15', priority: 'high' }), ref), 'do_first');
  // Day +3 (72h) -> Not Urgent -> schedule
  assert.equal(computeEisenhowerQuadrant(createMockTask({ dueAt: '2026-10-16', priority: 'high' }), ref), 'schedule');

  // Low priority variants
  assert.equal(computeEisenhowerQuadrant(createMockTask({ dueAt: '2026-10-15', priority: 'low', difficulty: 2 }), ref), 'delegate');
  assert.equal(computeEisenhowerQuadrant(createMockTask({ dueAt: '2026-10-16', priority: 'low', difficulty: 2 }), ref), 'eliminate');
});

test('Challenger M1.1 - Eisenhower: Unicode word boundaries elevate Vietnamese academic keywords', () => {
  const ref = new Date('2026-10-13T09:00:00Z');

  // Academic keyword regex uses Unicode-aware boundaries:
  // /(?:^|[^\p{L}\p{N}])(thi|bài tập lớn|btl|khóa luận|báo cáo|đồ án|chuyên đề|giữa kỳ|cuối kỳ)(?=$|[^\p{L}\p{N}])/ui

  // 1. "Ôn tập cuối kỳ" (due tomorrow <= 48h, urgent & important -> Q1 do_first)
  const taskCuoiKy = createMockTask({
    title: 'Ôn tập cuối kỳ',
    dueAt: '2026-10-14',
    priority: 'medium',
    difficulty: 3,
  });
  assert.equal(
    computeEisenhowerQuadrant(taskCuoiKy, ref),
    'do_first',
    'Keyword "cuối kỳ" matches via Unicode boundaries, elevating to Q1 do_first'
  );

  // 2. "Làm đồ án môn học" (due tomorrow <= 48h, urgent & important -> Q1 do_first)
  const taskDoAn = createMockTask({
    title: 'Làm đồ án môn học',
    dueAt: '2026-10-14',
    priority: 'medium',
    difficulty: 3,
  });
  assert.equal(
    computeEisenhowerQuadrant(taskDoAn, ref),
    'do_first',
    'Keyword "đồ án" matches via Unicode boundaries, elevating to Q1 do_first'
  );

  // 3. "Ôn tập giữa kỳ" (due in 5 days > 48h, not urgent & important -> Q2 schedule)
  const taskGiuaKy = createMockTask({
    title: 'Ôn tập giữa kỳ',
    dueAt: '2026-10-18',
    priority: 'medium',
    difficulty: 3,
  });
  assert.equal(
    computeEisenhowerQuadrant(taskGiuaKy, ref),
    'schedule',
    'Keyword "giữa kỳ" matches via Unicode boundaries, elevating to Q2 schedule'
  );

  // 4. "Nghiên cứu chuyên đề" (due in 5 days > 48h, not urgent & important -> Q2 schedule)
  const taskChuyenDe = createMockTask({
    title: 'Nghiên cứu chuyên đề',
    dueAt: '2026-10-18',
    priority: 'medium',
    difficulty: 3,
  });
  assert.equal(
    computeEisenhowerQuadrant(taskChuyenDe, ref),
    'schedule',
    'Keyword "chuyên đề" matches via Unicode boundaries, elevating to Q2 schedule'
  );
});

// =========================================================================
// SECTION 4: TIMEZONE PARSING & COUNTDOWN SKEW DEFECT
// =========================================================================

test('Challenger M1.1 - Timezone: parseSafeIsoTime parses local naive ISO without UTC skew', () => {
  // When a local task is created with dueAt = '2026-10-13T23:59:00',
  // and referenceDate is local 22:00:00 (1 hour 59 minutes remaining):
  const localNow = new Date('2026-10-13T22:00:00');
  const dueAtLocal = '2026-10-13T23:59:00';

  const urgency = getUrgencyLevel(dueAtLocal, localNow);
  const countdown = formatCountdown(dueAtLocal, localNow);

  // Timezone skew eliminated: local naive ISO evaluated against local reference clock
  assert.equal(countdown, '01:59:00', 'Countdown shows true remaining time (< 2h)');
  assert.equal(urgency.color, 'red', 'Color is red panic status (< 3h)');
  assert.equal(urgency.isPanic, true, 'isPanic is true because remaining time is < 3h');
  assert.equal(urgency.isOverdue, false, 'Task is approaching, not overdue');
  assert.ok(Math.abs(urgency.hoursRemaining - 1.9833) < 0.01, 'hoursRemaining is ~1.98h');
});

test('Challenger M1.1 - Timezone: Date Group and Urgency Countdown are fully synchronized', () => {
  // Current time: 2026-10-14 00:30:00 (31 minutes overdue past midnight!)
  const localNow = new Date('2026-10-14T00:30:00');
  const dueAt = '2026-10-13T23:59:00';

  const task = createMockTask({ dueAt });
  const group = getTaskDateGroup(task, localNow);
  const urgency = getUrgencyLevel(dueAt, localNow);

  // Both date group and urgency countdown correctly identify overdue status
  assert.equal(group, 'overdue', 'Task date group correctly reports overdue');
  assert.equal(urgency.isOverdue, true, 'Urgency correctly reports overdue');
  assert.equal(urgency.color, 'red', 'Overdue tasks get red color');
  assert.equal(urgency.isPanic, true, 'Overdue tasks have isPanic true');
  assert.ok(urgency.displayCountdown.includes('Quá hạn'), 'Countdown displays overdue text');

  // Verify consistency between date group and urgency: no contradiction
  const isConsistent = group === 'overdue' && urgency.isOverdue;
  assert.equal(isConsistent, true, 'Date group and urgency countdown are fully consistent');
});
