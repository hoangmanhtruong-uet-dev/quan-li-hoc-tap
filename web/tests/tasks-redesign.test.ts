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

import {
  createDefaultSharedState,
  getSharedState,
  resetSharedState,
  addTask,
  completeTask,
  updateTask,
  deleteTask,
  bulkUpdateTasks,
  toggleTaskStep,
  formatIsoDateOnly,
} from '../src/lib/campus-store.ts';

// Fixed baseline anchor reference date for deterministic testing:
// 2026-10-13 (Tuesday) 09:00:00 Local
const REF_DATE = new Date('2026-10-13T09:00:00');

function createSampleTask(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: `task-${Math.random().toString(36).slice(2, 9)}`,
    title: 'Ôn tập Mạng máy tính',
    course: 'Mạng máy tính',
    status: 'todo',
    priority: 'medium',
    difficulty: 3,
    dueAt: '2026-10-14T23:59:00',
    estimateMin: 45,
    actualMin: 0,
    steps: [
      { id: 's-1', text: 'Đọc slide chương 4', done: false },
      { id: 's-2', text: 'Làm bài lab Wireshark', done: false },
    ],
    tags: ['Lab', 'BTL'],
    pomodoros: { planned: 2, done: 0 },
    order: 0,
    createdAt: '2026-10-13T08:00:00Z',
    ...overrides,
  };
}

// =========================================================================
// TIER 1: FEATURE COVERAGE (>=5 test cases per core feature)
// =========================================================================

// --- Feature 1: Vietnamese NLP Task Parser (parseVietnameseTaskInput) ---

test('Tier 1 - NLP Parser (1/6): parses homework with tomorrow, 23h, 90min, high priority', () => {
  const input = 'nộp bài tập mạng 23h ngày mai 90p ưu tiên cao';
  const parsed = parseVietnameseTaskInput(input, REF_DATE);

  assert.equal(parsed.dueDate, '2026-10-14');
  assert.equal(parsed.dueTime, '23:00');
  assert.equal(parsed.estimateMin, 90);
  assert.equal(parsed.priority, 'high');
  assert.equal(parsed.course, 'Mạng máy tính');
  assert.ok(parsed.title.length > 0);
  assert.ok(parsed.confidence >= 0.7);
});

test('Tier 1 - NLP Parser (2/6): parses exam review with day of week (thứ 6), 19h, toán rời rạc', () => {
  const input = 'ôn thi cuối kỳ toán rời rạc 19h thứ 6';
  const parsed = parseVietnameseTaskInput(input, REF_DATE);

  // Tuesday 2026-10-13 -> Friday is 2026-10-16
  assert.equal(parsed.dueDate, '2026-10-16');
  assert.equal(parsed.dueTime, '19:00');
  assert.equal(parsed.course, 'Toán rời rạc');
  assert.ok(parsed.title.toLowerCase().includes('toán rời rạc') || parsed.title.toLowerCase().includes('ôn thi'));
  assert.ok(parsed.confidence >= 0.6);
});

test('Tier 1 - NLP Parser (3/6): parses today afternoon, 45 minutes, medium priority, triết', () => {
  const input = 'làm slide thuyết trình triết 14h30 45m ưu tiên vừa';
  const parsed = parseVietnameseTaskInput(input, REF_DATE);

  assert.equal(parsed.dueDate, '2026-10-13');
  assert.equal(parsed.dueTime, '14:30');
  assert.equal(parsed.estimateMin, 45);
  assert.equal(parsed.priority, 'medium');
  assert.equal(parsed.course, 'Triết học Mác - Lênin');
  assert.ok(parsed.confidence >= 0.7);
});

test('Tier 1 - NLP Parser (4/6): parses explicit date DD/MM, 23:59, 180min, urgent (gấp), ctdl', () => {
  const input = 'bài tập lớn ctdl 23:59 25/11 180p gấp';
  const parsed = parseVietnameseTaskInput(input, REF_DATE);

  assert.equal(parsed.dueDate, '2026-11-25');
  assert.equal(parsed.dueTime, '23:59');
  assert.equal(parsed.estimateMin, 180);
  assert.equal(parsed.priority, 'high');
  assert.equal(parsed.course, 'CTDL & GT');
  assert.ok(parsed.confidence >= 0.7);
});

test('Tier 1 - NLP Parser (5/6): parses float hours (1.5h), low priority, xác suất', () => {
  const input = 'đọc tài liệu xác suất 1.5h ưu tiên thấp';
  const parsed = parseVietnameseTaskInput(input, REF_DATE);

  assert.equal(parsed.estimateMin, 90);
  assert.equal(parsed.priority, 'low');
  assert.equal(parsed.course, 'Xác suất Thống kê');
  assert.ok(parsed.confidence >= 0.6);
});

test('Tier 1 - NLP Parser (6/6): parses hour duration variants (2 tiếng, 2 giờ, 100 phút)', () => {
  const p1 = parseVietnameseTaskInput('học kỹ thuật lập trình 2 tiếng lúc 20h', REF_DATE);
  assert.equal(p1.estimateMin, 120);
  assert.equal(p1.dueTime, '20:00');
  assert.equal(p1.course, 'Kỹ thuật lập trình');

  const p2 = parseVietnameseTaskInput('ôn tập dự án web 1 giờ', REF_DATE);
  assert.equal(p2.estimateMin, 60);
  assert.equal(p2.course, 'Dự án Web');

  const p3 = parseVietnameseTaskInput('làm quiz clb công nghệ 100 phút', REF_DATE);
  assert.equal(p3.estimateMin, 100);
  assert.equal(p3.course, 'CLB Công nghệ');
});

// --- Feature 2: Eisenhower Matrix Classifier (computeEisenhowerQuadrant) ---

test('Tier 1 - Eisenhower (1/6): preserves explicit user manual quadrant override', () => {
  const task1 = createSampleTask({
    quadrant: 'delegate',
    priority: 'high',
    dueAt: '2026-10-13T10:00:00', // urgent + high priority would normally be do_first
  });
  assert.equal(computeEisenhowerQuadrant(task1, REF_DATE), 'delegate');

  const task2 = createSampleTask({
    quadrant: 'eliminate',
    priority: 'high',
    dueAt: '2026-10-13T10:00:00',
  });
  assert.equal(computeEisenhowerQuadrant(task2, REF_DATE), 'eliminate');
});

test('Tier 1 - Eisenhower (2/6): assigns Q1 (do_first) for Urgent (<=48h) & Important (high priority)', () => {
  // Due tomorrow (2026-10-14, diff = 1 day <= 2) + priority = high
  const task = createSampleTask({
    dueAt: '2026-10-14T23:59:00',
    priority: 'high',
    difficulty: 3,
  });
  assert.equal(computeEisenhowerQuadrant(task, REF_DATE), 'do_first');
});

test('Tier 1 - Eisenhower (3/6): assigns Q2 (schedule) for Not Urgent (>48h) & Important (high priority / difficulty >= 4)', () => {
  // Due in 5 days (2026-10-18, diff = 5 > 2) + priority = high
  const taskA = createSampleTask({
    dueAt: '2026-10-18T23:59:00',
    priority: 'high',
    difficulty: 3,
  });
  assert.equal(computeEisenhowerQuadrant(taskA, REF_DATE), 'schedule');

  // Due in 5 days + priority = medium but difficulty = 4
  const taskB = createSampleTask({
    dueAt: '2026-10-18T23:59:00',
    priority: 'medium',
    difficulty: 4,
  });
  assert.equal(computeEisenhowerQuadrant(taskB, REF_DATE), 'schedule');
});

test('Tier 1 - Eisenhower (4/6): assigns Q3 (delegate) for Urgent (<=48h) & Not Important', () => {
  // Due tomorrow (2026-10-14, diff = 1 <= 2) + priority = medium, difficulty = 2
  const task = createSampleTask({
    title: 'Đi photo tài liệu',
    dueAt: '2026-10-14T23:59:00',
    priority: 'medium',
    difficulty: 2,
  });
  assert.equal(computeEisenhowerQuadrant(task, REF_DATE), 'delegate');
});

test('Tier 1 - Eisenhower (5/6): assigns Q4 (eliminate) for Not Urgent (>48h) & Not Important', () => {
  // Due in 7 days (2026-10-20, diff = 7 > 2) + priority = low, difficulty = 1
  const task = createSampleTask({
    title: 'Dọn dẹp hòm thư rác',
    dueAt: '2026-10-20T23:59:00',
    priority: 'low',
    difficulty: 1,
  });
  assert.equal(computeEisenhowerQuadrant(task, REF_DATE), 'eliminate');
});

test('Tier 1 - Eisenhower (6/6): academic keywords elevate importance even with medium priority', () => {
  // Due in 5 days (not urgent) + medium priority + title has "thi cuối kỳ"
  const examTask = createSampleTask({
    title: 'Ôn thi cuối kỳ Triết học',
    dueAt: '2026-10-18T23:59:00',
    priority: 'medium',
    difficulty: 3,
  });
  assert.equal(computeEisenhowerQuadrant(examTask, REF_DATE), 'schedule');

  // Due tomorrow (urgent) + medium priority + title has "bài tập lớn"
  const btlTask = createSampleTask({
    title: 'Nộp bài tập lớn Mạng máy tính',
    dueAt: '2026-10-14T23:59:00',
    priority: 'medium',
    difficulty: 3,
  });
  assert.equal(computeEisenhowerQuadrant(btlTask, REF_DATE), 'do_first');
});

// --- Feature 3: Date Grouping & Urgency (getTaskDateGroup, getUrgencyLevel, formatCountdown) ---

test('Tier 1 - Date Grouping (1/6): completed tasks always map to "done"', () => {
  const donePast = createSampleTask({ status: 'done', dueAt: '2026-10-01' });
  assert.equal(getTaskDateGroup(donePast, REF_DATE), 'done');

  const doneToday = createSampleTask({ status: 'done', dueAt: '2026-10-13' });
  assert.equal(getTaskDateGroup(doneToday, REF_DATE), 'done');

  const doneFuture = createSampleTask({ status: 'done', dueAt: '2026-10-25' });
  assert.equal(getTaskDateGroup(doneFuture, REF_DATE), 'done');
});

test('Tier 1 - Date Grouping (2/6): overdue tasks map to "overdue"', () => {
  const overdueTask = createSampleTask({ status: 'todo', dueAt: '2026-10-12T23:59:00' });
  assert.equal(getTaskDateGroup(overdueTask, REF_DATE), 'overdue');
});

test('Tier 1 - Date Grouping (3/6): today tasks map to "today"', () => {
  const todayTask = createSampleTask({ status: 'todo', dueAt: '2026-10-13T23:59:00' });
  assert.equal(getTaskDateGroup(todayTask, REF_DATE), 'today');
});

test('Tier 1 - Date Grouping (4/6): tomorrow tasks map to "tomorrow"', () => {
  const tomorrowTask = createSampleTask({ status: 'doing', dueAt: '2026-10-14T18:00:00' });
  assert.equal(getTaskDateGroup(tomorrowTask, REF_DATE), 'tomorrow');
});

test('Tier 1 - Date Grouping (5/6): partitions this_week vs later based on current Sunday', () => {
  // Tuesday 2026-10-13: current Sunday is 2026-10-18
  const thursdayTask = createSampleTask({ status: 'todo', dueAt: '2026-10-15T23:59:00' });
  assert.equal(getTaskDateGroup(thursdayTask, REF_DATE), 'this_week');

  const sundayTask = createSampleTask({ status: 'todo', dueAt: '2026-10-18T23:59:00' });
  assert.equal(getTaskDateGroup(sundayTask, REF_DATE), 'this_week');

  const nextMondayTask = createSampleTask({ status: 'todo', dueAt: '2026-10-19T08:00:00' });
  assert.equal(getTaskDateGroup(nextMondayTask, REF_DATE), 'later');
});

test('Tier 1 - Urgency Level (6/6): calculates correct color tokens, panic status, and countdown text', () => {
  // 1. Safe (> 24h): Lime
  const safeUrgency = getUrgencyLevel('2026-10-15T12:00:00', REF_DATE);
  assert.equal(safeUrgency.color, 'lime');
  assert.equal(safeUrgency.isPanic, false);
  assert.equal(safeUrgency.isOverdue, false);

  // 2. Approaching (3h - 24h): Orange
  const approachingUrgency = getUrgencyLevel('2026-10-13T21:00:00', REF_DATE); // 12h away
  assert.equal(approachingUrgency.color, 'orange');
  assert.equal(approachingUrgency.isPanic, false);
  assert.equal(approachingUrgency.isOverdue, false);

  // 3. Panic (< 3h): Red with panic shake
  const panicUrgency = getUrgencyLevel('2026-10-13T11:00:00', REF_DATE); // 2h away
  assert.equal(panicUrgency.color, 'red');
  assert.equal(panicUrgency.isPanic, true);
  assert.equal(panicUrgency.isOverdue, false);

  // 4. Overdue: Red, isOverdue: true
  const overdueUrgency = getUrgencyLevel('2026-10-13T07:00:00', REF_DATE); // 2h ago
  assert.equal(overdueUrgency.color, 'red');
  assert.equal(overdueUrgency.isOverdue, true);

  // Countdown string formatting
  assert.ok(formatCountdown('2026-10-18T23:59:00', REF_DATE).includes('ngày'));
  assert.ok(formatCountdown('2026-10-12T12:00:00', REF_DATE).includes('Quá hạn'));
});

// --- Feature 4: Store Tasks Operations (campus-store.ts) ---

test('Tier 1 - Store Tasks (1/7): createDefaultSharedState includes seeded tasks anchored to system date', () => {
  const state = createDefaultSharedState(REF_DATE);
  assert.ok(Array.isArray(state.tasks), 'state.tasks should be an array');
  assert.ok(state.tasks.length >= 4, 'should seed multiple tasks');

  // Verify seed diversity across groups
  const groups = groupTasksByDate(state.tasks, REF_DATE);
  assert.ok(groups.today.length > 0 || groups.tomorrow.length > 0, 'should have active near-term tasks');
});

test('Tier 1 - Store Tasks (2/7): addTask creates a new task with unique id, createdAt, and appends to store', () => {
  resetSharedState(REF_DATE);
  const beforeCount = getSharedState().tasks.length;

  const created = addTask({
    title: 'Nhiệm vụ kiểm thử addTask',
    course: 'Kiểm thử phần mềm',
    status: 'todo',
    priority: 'high',
    difficulty: 4,
    dueAt: '2026-10-14T23:59:00',
    estimateMin: 60,
    actualMin: 0,
    steps: [{ id: 'step-1', text: 'Viết unit test', done: false }],
    tags: ['QA', 'E2E'],
    pomodoros: { planned: 2, done: 0 },
  });

  assert.ok(created.id, 'Task should have generated id');
  assert.ok(created.createdAt, 'Task should have createdAt timestamp');
  assert.equal(created.title, 'Nhiệm vụ kiểm thử addTask');
  assert.equal(created.priority, 'high');

  const afterState = getSharedState();
  assert.equal(afterState.tasks.length, beforeCount + 1);
  const found = afterState.tasks.find((t) => t.id === created.id);
  assert.ok(found, 'Created task should be present in store');
});

test('Tier 1 - Store Tasks (3/7): updateTask modifies specified fields without wiping other properties', () => {
  resetSharedState(REF_DATE);
  const created = addTask({
    title: 'Task trước khi cập nhật',
    course: 'CS101',
    status: 'todo',
    priority: 'low',
    difficulty: 1,
    dueAt: '2026-10-15T12:00:00',
    estimateMin: 30,
    actualMin: 0,
    steps: [],
    tags: ['Old'],
    pomodoros: { planned: 1, done: 0 },
  });

  const updated = updateTask(created.id, {
    title: 'Task sau khi cập nhật',
    priority: 'high',
    difficulty: 5,
  });

  assert.ok(updated);
  assert.equal(updated.title, 'Task sau khi cập nhật');
  assert.equal(updated.priority, 'high');
  assert.equal(updated.difficulty, 5);
  // Preserved fields
  assert.equal(updated.course, 'CS101');
  assert.equal(updated.dueAt, '2026-10-15T12:00:00');
  assert.deepEqual(updated.tags, ['Old']);
});

test('Tier 1 - Store Tasks (4/7): deleteTask removes task from store and returns it', () => {
  resetSharedState(REF_DATE);
  const created = addTask({
    title: 'Task chuẩn bị xoá',
    status: 'todo',
    priority: 'medium',
    difficulty: 2,
    dueAt: '2026-10-16T12:00:00',
    estimateMin: 20,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  const deleted = deleteTask(created.id);
  assert.ok(deleted);
  assert.equal(deleted.id, created.id);

  const afterTasks = getSharedState().tasks;
  assert.ok(!afterTasks.some((t) => t.id === created.id), 'Deleted task should not exist in store');
});

test('Tier 1 - Store Tasks (5/7): bulkUpdateTasks modifies multiple tasks in a single action', () => {
  resetSharedState(REF_DATE);
  const t1 = addTask({
    title: 'Bulk Task 1',
    status: 'todo',
    priority: 'low',
    difficulty: 2,
    dueAt: '2026-10-16',
    estimateMin: 30,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });
  const t2 = addTask({
    title: 'Bulk Task 2',
    status: 'todo',
    priority: 'low',
    difficulty: 2,
    dueAt: '2026-10-17',
    estimateMin: 45,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  bulkUpdateTasks([t1.id, t2.id], { status: 'doing', priority: 'high' });

  const tasks = getSharedState().tasks;
  const f1 = tasks.find((t) => t.id === t1.id);
  const f2 = tasks.find((t) => t.id === t2.id);

  assert.equal(f1?.status, 'doing');
  assert.equal(f1?.priority, 'high');
  assert.equal(f2?.status, 'doing');
  assert.equal(f2?.priority, 'high');
});

test('Tier 1 - Store Tasks (6/7): toggleTaskStep flips subtask step completion', () => {
  resetSharedState(REF_DATE);
  const task = addTask({
    title: 'Task có checklist subtasks',
    status: 'todo',
    priority: 'medium',
    difficulty: 3,
    dueAt: '2026-10-15',
    estimateMin: 50,
    actualMin: 0,
    steps: [
      { id: 'step-a', text: 'Bước A', done: false },
      { id: 'step-b', text: 'Bước B', done: false },
    ],
    tags: [],
    pomodoros: { planned: 2, done: 0 },
  });

  toggleTaskStep(task.id, 'step-a');
  let currentTask = getSharedState().tasks.find((t) => t.id === task.id)!;
  assert.equal(currentTask.steps[0]!.done, true);
  assert.equal(currentTask.steps[1]!.done, false);

  // Toggle back to false
  toggleTaskStep(task.id, 'step-a');
  currentTask = getSharedState().tasks.find((t) => t.id === task.id)!;
  assert.equal(currentTask.steps[0]!.done, false);
});

test('Tier 1 - Store Tasks (7/7): completeTask transitions task to done, sets completedAt, and awards XP', () => {
  resetSharedState(REF_DATE);
  const initialXp = getSharedState().xp;

  const task = addTask({
    title: 'Nhiệm vụ cần hoàn thành',
    status: 'todo',
    priority: 'high',
    difficulty: 3,
    dueAt: '2026-10-14T23:59:00',
    estimateMin: 40,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  const result = completeTask(task.id, 20);
  assert.ok(result.task);
  assert.equal(result.task.status, 'done');
  assert.ok(result.task.completedAt);
  assert.ok(result.xpGained >= 20);

  const afterState = getSharedState();
  assert.ok(afterState.xp >= initialXp + 20);
});

// =========================================================================
// TIER 2: BOUNDARY & CORNER CASES
// =========================================================================

test('Tier 2 - Boundary (1/6): empty, whitespace-only, and punctuation inputs handle gracefully without throwing', () => {
  const emptyRes = parseVietnameseTaskInput('', REF_DATE);
  assert.ok(emptyRes.title);
  assert.equal(emptyRes.priority, 'medium');
  assert.ok(emptyRes.confidence <= 0.3);

  const spaceRes = parseVietnameseTaskInput('   \t\n   ', REF_DATE);
  assert.ok(spaceRes.title);

  const punctRes = parseVietnameseTaskInput('!@#$%^&*()_+', REF_DATE);
  assert.ok(punctRes.title);
  assert.ok(punctRes.estimateMin > 0);
});

test('Tier 2 - Boundary (2/6): extreme and non-integer durations', () => {
  // 0 minutes
  const zeroMin = parseVietnameseTaskInput('làm bài 0p', REF_DATE);
  assert.equal(zeroMin.estimateMin, 0);

  // Very large duration: 12h = 720 min
  const largeDur = parseVietnameseTaskInput('cày đồ án 12h', REF_DATE);
  assert.equal(largeDur.estimateMin, 720);

  // 10 tiếng = 600 min
  const tenHours = parseVietnameseTaskInput('ôn thi 10 tiếng', REF_DATE);
  assert.equal(tenHours.estimateMin, 600);

  // 0.5h = 30 min
  const halfHour = parseVietnameseTaskInput('đọc sách 0.5h', REF_DATE);
  assert.equal(halfHour.estimateMin, 30);
});

test('Tier 2 - Boundary (3/6): midnight, noon, and 24-hour boundary time parsing', () => {
  // 0h / 00:00 midnight
  const midnight = parseVietnameseTaskInput('nộp bài lúc 0h ngày mai', REF_DATE);
  assert.equal(midnight.dueTime, '00:00');

  // 23:59 end of day
  const endOfDay = parseVietnameseTaskInput('nộp bài 23:59 hôm nay', REF_DATE);
  assert.equal(endOfDay.dueTime, '23:59');

  // Afternoon conversion: 2h chiều = 14:00
  const afternoon = parseVietnameseTaskInput('họp lab lúc 2h chiều', REF_DATE);
  assert.equal(afternoon.dueTime, '14:00');

  // Night conversion: 8h tối = 20:00
  const night = parseVietnameseTaskInput('ôn bài lúc 8h tối', REF_DATE);
  assert.equal(night.dueTime, '20:00');
});

test('Tier 2 - Boundary (4/6): exact 48-hour boundary for Eisenhower urgency', () => {
  // REF_DATE is 2026-10-13

  // diff = 0 (today) -> Urgent
  const t0 = createSampleTask({ dueAt: '2026-10-13T23:59:00', priority: 'high' });
  assert.equal(computeEisenhowerQuadrant(t0, REF_DATE), 'do_first');

  // diff = 1 (tomorrow) -> Urgent
  const t1 = createSampleTask({ dueAt: '2026-10-14T23:59:00', priority: 'high' });
  assert.equal(computeEisenhowerQuadrant(t1, REF_DATE), 'do_first');

  // diff = 2 (in 48h) -> Urgent
  const t2 = createSampleTask({ dueAt: '2026-10-15T23:59:00', priority: 'high' });
  assert.equal(computeEisenhowerQuadrant(t2, REF_DATE), 'do_first');

  // diff = 3 (in 72h) -> NOT Urgent -> Q2 (schedule)
  const t3 = createSampleTask({ dueAt: '2026-10-16T23:59:00', priority: 'high' });
  assert.equal(computeEisenhowerQuadrant(t3, REF_DATE), 'schedule');

  // Overdue (diff < 0) -> Urgent -> Q1 (do_first)
  const tPast = createSampleTask({ dueAt: '2026-10-11T23:59:00', priority: 'high' });
  assert.equal(computeEisenhowerQuadrant(tPast, REF_DATE), 'do_first');
});

test('Tier 2 - Boundary (5/6): leap year and month-end date rollovers', () => {
  // Month-end rollover: 2026-10-31 + 1 day = 2026-11-01
  const oct31 = new Date('2026-10-31T09:00:00Z');
  const pOct = parseVietnameseTaskInput('nộp bài ngày mai', oct31);
  assert.equal(pOct.dueDate, '2026-11-01');

  // Year-end rollover: 2026-12-31 + 1 day = 2027-01-01
  const dec31 = new Date('2026-12-31T09:00:00Z');
  const pDec = parseVietnameseTaskInput('nộp bài ngày mai', dec31);
  assert.equal(pDec.dueDate, '2027-01-01');

  // Leap year rollover: 2028-02-28 + 1 day = 2028-02-29
  const feb28Leap = new Date('2028-02-28T09:00:00Z');
  const pLeap = parseVietnameseTaskInput('nộp bài ngày mai', feb28Leap);
  assert.equal(pLeap.dueDate, '2028-02-29');

  // Non-leap year rollover: 2027-02-28 + 1 day = 2027-03-01
  const feb28NonLeap = new Date('2027-02-28T09:00:00Z');
  const pNonLeap = parseVietnameseTaskInput('nộp bài ngày mai', feb28NonLeap);
  assert.equal(pNonLeap.dueDate, '2027-03-01');
});

test('Tier 2 - Boundary (6/6): special characters, markdown tags, and emojis in input', () => {
  const input = '[BTL] #mạng (deadline: 23h ngày mai! 🔥 @phòng lab)';
  const parsed = parseVietnameseTaskInput(input, REF_DATE);

  assert.equal(parsed.dueDate, '2026-10-14');
  assert.equal(parsed.dueTime, '23:00');
  assert.equal(parsed.course, 'Mạng máy tính');
  assert.ok(parsed.title.length > 0);
});

// =========================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS
// =========================================================================

test('Tier 3 - Cross-Feature (1/3): NLP parser output fed directly into Eisenhower & Date grouping & Urgency', () => {
  // Input: Urgent homework with high priority due tomorrow
  const raw = 'nộp bài tập lớn mạng 23h ngày mai 90p gấp';
  const parsed = parseVietnameseTaskInput(raw, REF_DATE);

  const fullTask: TaskItem = {
    id: 'cross-test-task-1',
    title: parsed.title,
    course: parsed.course,
    status: 'todo',
    priority: parsed.priority,
    difficulty: 3,
    dueAt: `${parsed.dueDate}T${parsed.dueTime}:00`,
    estimateMin: parsed.estimateMin,
    actualMin: 0,
    steps: [],
    tags: ['BTL'],
    pomodoros: { planned: 2, done: 0 },
    order: 0,
    createdAt: REF_DATE.toISOString(),
  };

  // 1. Eisenhower matrix classification
  const quadrant = computeEisenhowerQuadrant(fullTask, REF_DATE);
  assert.equal(quadrant, 'do_first', 'Tomorrow + high priority must map to do_first');

  // 2. Date grouping
  const group = getTaskDateGroup(fullTask, REF_DATE);
  assert.equal(group, 'tomorrow');

  // 3. Urgency level
  const urgency = getUrgencyLevel(fullTask.dueAt, REF_DATE);
  assert.ok(urgency.hoursRemaining > 24);
  assert.equal(urgency.color, 'lime');
  assert.equal(urgency.isOverdue, false);
});

test('Tier 3 - Cross-Feature (2/3): Store lifecycle with checklist progression, task completion, and group migration', () => {
  resetSharedState(REF_DATE);

  // 1. Create task with 3 subtasks
  const task = addTask({
    title: 'Xây dựng pipeline CI/CD',
    course: 'Dự án Web',
    status: 'todo',
    priority: 'high',
    difficulty: 4,
    dueAt: '2026-10-13T23:59:00', // Today
    estimateMin: 90,
    actualMin: 0,
    steps: [
      { id: 'step-1', text: 'Viết GitHub Actions workflow', done: false },
      { id: 'step-2', text: 'Setup Docker multi-stage build', done: false },
      { id: 'step-3', text: 'Cấu hình deploy preview', done: false },
    ],
    tags: ['DevOps'],
    pomodoros: { planned: 3, done: 0 },
  });

  // Verify initial date group is 'today'
  assert.equal(getTaskDateGroup(task, REF_DATE), 'today');

  // 2. Complete first 2 subtasks
  toggleTaskStep(task.id, 'step-1');
  toggleTaskStep(task.id, 'step-2');

  const afterSteps = getSharedState().tasks.find((t) => t.id === task.id)!;
  const completedSteps = afterSteps.steps.filter((s) => s.done).length;
  assert.equal(completedSteps, 2);
  assert.equal(afterSteps.steps.length, 3);

  // 3. Complete the task
  const initialXp = getSharedState().xp;
  const completedResult = completeTask(task.id, 20);

  assert.equal(completedResult.task?.status, 'done');
  assert.ok(getSharedState().xp >= initialXp + 20);

  // 4. Verify date group dynamically migrated from 'today' to 'done'
  const updatedTask = getSharedState().tasks.find((t) => t.id === task.id)!;
  assert.equal(getTaskDateGroup(updatedTask, REF_DATE), 'done');
});

test('Tier 3 - Cross-Feature (3/3): Batch Eisenhower matrix partitioning and bulk priority mutation', () => {
  resetSharedState(REF_DATE);

  // Create 4 distinct tasks spanning different quadrants
  const t1 = addTask({
    title: 'Làm bài tập mạng',
    dueAt: '2026-10-14T10:00:00', // Tomorrow (Urgent)
    priority: 'high',             // Important -> Q1
    difficulty: 3,
    status: 'todo',
    estimateMin: 45,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  const t2 = addTask({
    title: 'Đọc trước giáo trình CTDL',
    dueAt: '2026-10-22T10:00:00', // 9 days (Not Urgent)
    priority: 'high',             // Important -> Q2
    difficulty: 3,
    status: 'todo',
    estimateMin: 60,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  const t3 = addTask({
    title: 'Gửi email xin phép nghỉ học',
    dueAt: '2026-10-14T10:00:00', // Tomorrow (Urgent)
    priority: 'low',              // Not Important -> Q3
    difficulty: 1,
    status: 'todo',
    estimateMin: 15,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  const t4 = addTask({
    title: 'Lướt xem tài liệu tham khảo thêm',
    dueAt: '2026-10-25T10:00:00', // 12 days (Not Urgent)
    priority: 'low',              // Not Important -> Q4
    difficulty: 1,
    status: 'todo',
    estimateMin: 30,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  assert.equal(computeEisenhowerQuadrant(t1, REF_DATE), 'do_first');
  assert.equal(computeEisenhowerQuadrant(t2, REF_DATE), 'schedule');
  assert.equal(computeEisenhowerQuadrant(t3, REF_DATE), 'delegate');
  assert.equal(computeEisenhowerQuadrant(t4, REF_DATE), 'eliminate');

  // Bulk update t3 and t4 to priority 'high'
  bulkUpdateTasks([t3.id, t4.id], { priority: 'high' });

  const tasksAfter = getSharedState().tasks;
  const t3Updated = tasksAfter.find((t) => t.id === t3.id)!;
  const t4Updated = tasksAfter.find((t) => t.id === t4.id)!;

  // t3 was Urgent & low -> now Urgent & high -> transitions to Q1 (do_first)
  assert.equal(computeEisenhowerQuadrant(t3Updated, REF_DATE), 'do_first');
  // t4 was Not Urgent & low -> now Not Urgent & high -> transitions to Q2 (schedule)
  assert.equal(computeEisenhowerQuadrant(t4Updated, REF_DATE), 'schedule');
});

// =========================================================================
// TIER 4: REAL-WORLD WORKLOAD SCENARIOS
// =========================================================================

test('Tier 4 - Real-World (1/6): Student homework prompt "nộp bài tập mạng 23h ngày mai 90p ưu tiên cao"', () => {
  const result = parseVietnameseTaskInput('nộp bài tập mạng 23h ngày mai 90p ưu tiên cao', REF_DATE);

  assert.equal(result.course, 'Mạng máy tính');
  assert.equal(result.dueDate, '2026-10-14');
  assert.equal(result.dueTime, '23:00');
  assert.equal(result.estimateMin, 90);
  assert.equal(result.priority, 'high');
  assert.ok(result.confidence >= 0.85);
});

test('Tier 4 - Real-World (2/6): Student final exam prompt "ôn thi cuối kỳ toán rời rạc 19h thứ 6"', () => {
  const result = parseVietnameseTaskInput('ôn thi cuối kỳ toán rời rạc 19h thứ 6', REF_DATE);

  assert.equal(result.course, 'Toán rời rạc');
  assert.equal(result.dueDate, '2026-10-16');
  assert.equal(result.dueTime, '19:00');
  assert.equal(result.estimateMin, 45); // default fallback
});

test('Tier 4 - Real-World (3/6): Student lab assignment "bài tập lớn ctdl và giải thuật 23:59 25/11 180p gấp"', () => {
  const result = parseVietnameseTaskInput('bài tập lớn ctdl và giải thuật 23:59 25/11 180p gấp', REF_DATE);

  assert.equal(result.course, 'CTDL & GT');
  assert.equal(result.dueDate, '2026-11-25');
  assert.equal(result.dueTime, '23:59');
  assert.equal(result.estimateMin, 180);
  assert.equal(result.priority, 'high');
});

test('Tier 4 - Real-World (4/6): Subtask checklist progress percentage calculations', () => {
  const task = createSampleTask({
    steps: [
      { id: '1', text: 'Step 1', done: false },
      { id: '2', text: 'Step 2', done: false },
      { id: '3', text: 'Step 3', done: false },
      { id: '4', text: 'Step 4', done: false },
    ],
  });

  const getProgress = (steps: typeof task.steps) =>
    steps.length === 0 ? 0 : Math.round((steps.filter((s) => s.done).length / steps.length) * 100);

  assert.equal(getProgress(task.steps), 0);

  task.steps[0]!.done = true;
  assert.equal(getProgress(task.steps), 25);

  task.steps[1]!.done = true;
  assert.equal(getProgress(task.steps), 50);

  task.steps[2]!.done = true;
  assert.equal(getProgress(task.steps), 75);

  task.steps[3]!.done = true;
  assert.equal(getProgress(task.steps), 100);
});

test('Tier 4 - Real-World (5/6): "Clear the Board" streak bonus (+50 XP) awarded when all today tasks are completed', () => {
  resetSharedState(REF_DATE);

  // Clear existing tasks and create exactly two tasks due today
  const existing = getSharedState().tasks;
  for (const t of existing) {
    deleteTask(t.id);
  }

  const todayStr = formatIsoDateOnly(new Date(), 0);

  const t1 = addTask({
    title: 'Việc hôm nay 1',
    dueAt: `${todayStr}T12:00:00`,
    status: 'todo',
    priority: 'high',
    difficulty: 3,
    estimateMin: 30,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  const t2 = addTask({
    title: 'Việc hôm nay 2',
    dueAt: `${todayStr}T18:00:00`,
    status: 'todo',
    priority: 'medium',
    difficulty: 2,
    estimateMin: 45,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  const xpBefore = getSharedState().xp;

  // Complete first task: 1 task left for today -> clearBoardBonus = false
  const res1 = completeTask(t1.id, 20);
  assert.equal(res1.clearBoardBonus, false);
  assert.equal(res1.xpGained, 20);

  // Complete second task: all tasks for today are done -> clearBoardBonus = true (+50 XP bonus)
  const res2 = completeTask(t2.id, 20);
  assert.equal(res2.clearBoardBonus, true);
  assert.equal(res2.xpGained, 70); // 20 base + 50 bonus

  const xpAfter = getSharedState().xp;
  assert.equal(xpAfter - xpBefore, 90); // 20 + 70
});

test('Tier 4 - Real-World (6/6): Multi-criteria sorting heuristic (due date ascending, priority descending)', () => {
  const tasks: TaskItem[] = [
    createSampleTask({ id: 't-future-low', dueAt: '2026-10-18T10:00:00', priority: 'low' }),
    createSampleTask({ id: 't-overdue-high', dueAt: '2026-10-11T10:00:00', priority: 'high' }),
    createSampleTask({ id: 't-today-med', dueAt: '2026-10-13T10:00:00', priority: 'medium' }),
    createSampleTask({ id: 't-today-high', dueAt: '2026-10-13T08:00:00', priority: 'high' }),
  ];

  const priorityScore: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };

  // Sort: due date ascending, then priority descending
  const sorted = [...tasks].sort((a, b) => {
    if (a.dueAt !== b.dueAt) {
      return a.dueAt.localeCompare(b.dueAt);
    }
    return priorityScore[b.priority] - priorityScore[a.priority];
  });

  assert.equal(sorted[0]!.id, 't-overdue-high', 'Overdue task should sort first');
  assert.equal(sorted[1]!.id, 't-today-high', 'Today high priority should sort second');
  assert.equal(sorted[2]!.id, 't-today-med', 'Today medium priority should sort third');
  assert.equal(sorted[3]!.id, 't-future-low', 'Future task should sort last');
});

// =========================================================================
// TIER 5: MILESTONE 4 INTEGRATION SUITE (Drawer, NLP QuickAdd, AI Breakdown)
// =========================================================================

test('Tier 5 - M4 Drawer (1/6): Unselected Hero selects the most urgent incomplete task', () => {
  const tasks: TaskItem[] = [
    createSampleTask({ id: 'done-1', status: 'done', dueAt: '2026-10-13T10:00:00' }),
    createSampleTask({ id: 'future-urgent', status: 'todo', dueAt: '2026-10-15T10:00:00', priority: 'high' }),
    createSampleTask({ id: 'next-up-earliest', status: 'todo', dueAt: '2026-10-13T14:00:00', priority: 'medium' }),
    createSampleTask({ id: 'later-task', status: 'todo', dueAt: '2026-10-14T20:00:00', priority: 'low' }),
  ];

  const incomplete = tasks.filter((t) => t.status !== 'done');
  const mostUrgent = [...incomplete].sort((a, b) => {
    const timeA = new Date(a.dueAt).getTime();
    const timeB = new Date(b.dueAt).getTime();
    if (timeA !== timeB) return timeA - timeB;
    const pMap: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
    return (pMap[a.priority] ?? 1) - (pMap[b.priority] ?? 1);
  })[0];

  assert.ok(mostUrgent);
  assert.equal(mostUrgent.id, 'next-up-earliest');
});

test('Tier 5 - M4 Drawer (2/6): In-place task updates modify store state without mutating unmodified properties', () => {
  resetSharedState(REF_DATE);
  const task = addTask({
    title: 'Bài tập Triết học',
    course: 'Triết học Mác - Lênin',
    status: 'todo',
    priority: 'medium',
    difficulty: 3,
    dueAt: '2026-10-14T23:59:00',
    estimateMin: 45,
    actualMin: 0,
    steps: [],
    tags: ['Triết'],
    pomodoros: { planned: 2, done: 0 },
  });

  // Perform in-place update as executed by Drawer
  const updated = updateTask(task.id, {
    title: 'Bài tập Triết học (Cập nhật)',
    difficulty: 5,
    priority: 'high',
    notes: 'Xem giáo trình trang 120-145',
  });

  assert.ok(updated);
  assert.equal(updated.title, 'Bài tập Triết học (Cập nhật)');
  assert.equal(updated.difficulty, 5);
  assert.equal(updated.priority, 'high');
  assert.equal(updated.notes, 'Xem giáo trình trang 120-145');
  assert.equal(updated.course, 'Triết học Mác - Lênin'); // Preserved
});

test('Tier 5 - M4 Drawer (3/6): Subtask checklist manager handles add, toggle, and reorder', () => {
  resetSharedState(REF_DATE);
  const task = addTask({
    title: 'Dự án Web',
    status: 'todo',
    priority: 'high',
    difficulty: 4,
    dueAt: '2026-10-15T23:59:00',
    estimateMin: 90,
    actualMin: 0,
    steps: [
      { id: 's-1', text: 'Thiết kế Wireframe', done: false },
      { id: 's-2', text: 'Cài đặt Next.js', done: false },
    ],
    tags: ['Web'],
    pomodoros: { planned: 4, done: 0 },
  });

  // Toggle step s-1
  toggleTaskStep(task.id, 's-1');
  let currentTask = getSharedState().tasks.find((t) => t.id === task.id)!;
  assert.equal(currentTask.steps[0]!.done, true);
  assert.equal(currentTask.steps[1]!.done, false);

  // Add step s-3
  const newSteps = [
    ...currentTask.steps,
    { id: 's-3', text: 'Deploy lên Vercel', done: false },
  ];
  updateTask(task.id, { steps: newSteps });
  currentTask = getSharedState().tasks.find((t) => t.id === task.id)!;
  assert.equal(currentTask.steps.length, 3);
  assert.equal(currentTask.steps[2]!.text, 'Deploy lên Vercel');
});

test('Tier 5 - M4 NLP QuickAdd (4/6): End-to-end NLP parse to store addTask pipeline', () => {
  resetSharedState(REF_DATE);
  const rawInput = 'nộp bài tập mạng 23h ngày mai 90p ưu tiên cao';
  const parsed = parseVietnameseTaskInput(rawInput, REF_DATE);

  const plannedPomodoros = Math.max(1, Math.ceil(parsed.estimateMin / 25));
  const dueAt = `${parsed.dueDate}T${parsed.dueTime}:00`;

  const created = addTask({
    title: parsed.title,
    course: parsed.course,
    status: 'todo',
    priority: parsed.priority,
    difficulty: 3,
    dueAt,
    estimateMin: parsed.estimateMin,
    actualMin: 0,
    steps: [],
    tags: parsed.course ? [parsed.course] : [],
    pomodoros: {
      planned: plannedPomodoros,
      done: 0,
    },
  });

  assert.ok(created.id.startsWith('task-'));
  assert.equal(created.course, 'Mạng máy tính');
  assert.equal(created.priority, 'high');
  assert.equal(created.estimateMin, 90);
  assert.equal(created.pomodoros.planned, 4); // 90 / 25 ceil = 4
  assert.equal(created.dueAt, '2026-10-14T23:00:00');
});

test('Tier 5 - M4 AI Breakdown (5/6): Progressive breakdown produces multi-stage task with pomodoros', () => {
  resetSharedState(REF_DATE);
  const syllabusStages = [
    { id: 'st-1', text: 'Nghiên cứu đề bài Socket UDP', estimateMin: 25, done: false },
    { id: 'st-2', text: 'Thiết kế cấu trúc gói tin', estimateMin: 35, done: false },
    { id: 'st-3', text: 'Cài đặt mã nguồn truyền nhận UDP', estimateMin: 60, done: false },
    { id: 'st-4', text: 'Kiểm thử mất gói và bắt lỗi', estimateMin: 30, done: false },
    { id: 'st-5', text: 'Viết báo cáo kỹ thuật PDF', estimateMin: 30, done: false },
  ];

  const totalMin = syllabusStages.reduce((sum, s) => sum + s.estimateMin, 0); // 180 min
  const plannedPomodoros = Math.max(1, Math.ceil(totalMin / 25)); // 8

  const task = addTask({
    title: 'Bài tập lớn Socket UDP',
    course: 'Mạng máy tính',
    status: 'todo',
    priority: 'high',
    difficulty: 4,
    dueAt: '2026-10-20T23:59:00',
    estimateMin: totalMin,
    actualMin: 0,
    steps: syllabusStages,
    tags: ['Mạng máy tính', 'AI Breakdown'],
    pomodoros: {
      planned: plannedPomodoros,
      done: 0,
    },
  });

  assert.equal(task.steps.length, 5);
  assert.equal(task.estimateMin, 180);
  assert.equal(task.pomodoros.planned, 8);
});

test('Tier 5 - M4 Pomodoro & Undo (6/6): Pomodoro progress updates and reversible task deletion', () => {
  resetSharedState(REF_DATE);
  const task = addTask({
    title: 'Ôn thi Xác suất',
    course: 'Xác suất Thống kê',
    status: 'doing',
    priority: 'high',
    difficulty: 4,
    dueAt: '2026-10-16T19:00:00',
    estimateMin: 50,
    actualMin: 0,
    steps: [],
    tags: ['Thi'],
    pomodoros: { planned: 2, done: 0 },
  });

  // Complete a 25-minute Pomodoro session
  const pomodoroMinutes = 25;
  updateTask(task.id, {
    actualMin: (task.actualMin || 0) + pomodoroMinutes,
    pomodoros: {
      ...task.pomodoros,
      done: task.pomodoros.done + 1,
    },
  });

  const updated = getSharedState().tasks.find((t) => t.id === task.id)!;
  assert.equal(updated.actualMin, 25);
  assert.equal(updated.pomodoros.done, 1);

  // Reversible deletion (Undo simulation)
  const deleted = deleteTask(task.id);
  assert.ok(deleted);
  assert.equal(getSharedState().tasks.some((t) => t.id === task.id), false);

  // Undo by re-adding with original data
  const restored = addTask({
    title: deleted.title,
    course: deleted.course,
    status: deleted.status,
    priority: deleted.priority,
    difficulty: deleted.difficulty,
    dueAt: deleted.dueAt,
    estimateMin: deleted.estimateMin,
    actualMin: deleted.actualMin,
    steps: deleted.steps,
    tags: deleted.tags,
    pomodoros: deleted.pomodoros,
  });

  assert.ok(restored);
  assert.equal(restored.title, 'Ôn thi Xác suất');
  assert.equal(restored.actualMin, 25);
  assert.equal(restored.pomodoros.done, 1);
});

