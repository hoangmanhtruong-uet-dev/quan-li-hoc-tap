/**
 * CampusOS Quick Task ("Tạo nhiệm vụ nhanh") Opaque-Box E2E Test Suite
 *
 * Requirements Source:
 *   - ORIGINAL_REQUEST.md (## 2026-10-13T12:48:34Z: R1, R2, R4)
 *   - PROJECT.md (§ Architecture, § Feature Inventory F-01..F-08, § Interface Contracts)
 *   - DISPATCH.md (Tiers 1-4 Coverage Requirements)
 *
 * Test Tiers:
 *   - Tier 1: Feature Coverage (>=5 test cases per feature: Date, Time, Course, Duration, Fallback, Priority, Store Dual-Write, XP & Rank, Undo)
 *   - Tier 2: Boundary & Corner Cases (Empty/whitespace, punctuation, late night, offset math, greedy regex prevention, long inputs, date rollovers)
 *   - Tier 3: Cross-Feature Combinations (Pairwise matrix, store multi-item lifecycle and selective rollback)
 *   - Tier 4: Real-World Vietnamese User Scenarios (Canonical user inputs, voice brain-dump, end-to-end parse-store-undo lifecycle)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import type {
  TaskItem,
  TaskPriority as ExistingTaskPriority,
  ParsedTaskResult,
} from '../src/types/tasks.ts';

// Support 4 priority tiers ('low' | 'medium' | 'high' | 'urgent') as per PROJECT.md interface contract
type TaskPriority = ExistingTaskPriority | 'urgent';

import { parseVietnameseTaskInput } from '../src/lib/tasks-engine.ts';

import * as campusStore from '../src/lib/campus-store.ts';
import {
  formatIsoDateOnly,
  getSharedState,
  resetSharedState,
  updateSharedState,
  calculateLevelAndRank,
  type CampusOSSharedState,
  type DeadlineItem,
} from '../src/lib/campus-store.ts';

// =========================================================================
// TEST HARNESS & DETERMINISTIC ANCHORS
// =========================================================================

/**
 * Deterministic Anchor Date:
 * Wednesday, October 14, 2026, 12:00:00 Local
 * Using local date constructor avoids UTC day-shifting on arbitrary timezones.
 *
 * Calendar reference:
 * - 2026-10-14: Wednesday (today)
 * - 2026-10-15: Thursday (tomorrow)
 * - 2026-10-16: Friday (day after tomorrow / thứ 6)
 * - 2026-10-17: Saturday (weekend)
 * - 2026-10-18: Sunday (weekend / chủ nhật)
 * - 2026-10-21: Wednesday (+7 days / tuần sau)
 * - 2026-10-23: Friday (+9 days / thứ 6 tuần sau)
 */
const ANCHOR_DATE = new Date(2026, 9, 14, 12, 0, 0);

type AddQuickTaskFn = (
  taskData: Omit<TaskItem, 'id' | 'createdAt' | 'order'>
) => {
  task: TaskItem;
  deadline: DeadlineItem;
  undo: () => void;
};

/**
 * Safely resolves addQuickTask from campus-store.ts without failing module load.
 */
function getAddQuickTask(): AddQuickTaskFn {
  const fn = (campusStore as any).addQuickTask;
  assert.equal(
    typeof fn,
    'function',
    'addQuickTask must be exported as a function from src/lib/campus-store.ts (F-06)'
  );
  return fn;
}

/**
 * Helper to compute calendar day difference between two YYYY-MM-DD date strings.
 */
function calendarDiffDays(d1: string, d2: string): number {
  const [y1, m1, day1] = d1.slice(0, 10).split('-').map(Number);
  const [y2, m2, day2] = d2.slice(0, 10).split('-').map(Number);
  const utc1 = Date.UTC(y1!, m1! - 1, day1!);
  const utc2 = Date.UTC(y2!, m2! - 1, day2!);
  return Math.round((utc2 - utc1) / 86400000);
}

/**
 * Sample task data payload for store sync tests.
 */
function createSampleTaskPayload(
  overrides: Partial<Omit<TaskItem, 'id' | 'createdAt' | 'order'>> = {}
): Omit<TaskItem, 'id' | 'createdAt' | 'order'> {
  return {
    title: 'Nộp bài tập lớn Mạng máy tính',
    description: 'Lập trình socket mô phỏng UDP',
    course: 'Mạng máy tính',
    status: 'todo',
    priority: 'high' as TaskPriority,
    difficulty: 4,
    dueAt: '2026-10-16T23:00:00',
    estimateMin: 90,
    actualMin: 0,
    steps: [{ id: 'step-1', text: 'Thiết kế header UDP packet', done: false }],
    tags: ['BTL'],
    pomodoros: { planned: 2, done: 0 },
    ...overrides,
  };
}

// =========================================================================
// TIER 1: FEATURE COVERAGE (>=5 PER FEATURE)
// =========================================================================

// --- 1.1 Date Extraction (7 test cases) ---

test('Tier 1 - Date Extraction 1: "hôm nay" resolves to current reference date', () => {
  const res = parseVietnameseTaskInput('Làm bài tập Mạng máy tính hôm nay', ANCHOR_DATE);
  const expectedDate = formatIsoDateOnly(ANCHOR_DATE, 0); // 2026-10-14
  assert.equal(res.dueDate, expectedDate);
});

test('Tier 1 - Date Extraction 2: "ngày mai" / "mai" resolves to +1 day offset', () => {
  const res1 = parseVietnameseTaskInput('Ôn thi Giải tích ngày mai 23h', ANCHOR_DATE);
  const res2 = parseVietnameseTaskInput('Ôn thi Giải tích mai 23h', ANCHOR_DATE);
  const expectedDate = formatIsoDateOnly(ANCHOR_DATE, 1); // 2026-10-15
  assert.equal(res1.dueDate, expectedDate);
  assert.equal(res2.dueDate, expectedDate);
});

test('Tier 1 - Date Extraction 3: "ngày mốt" / "mốt" resolves to +2 days offset', () => {
  const res1 = parseVietnameseTaskInput('Nộp slide Triết học ngày mốt', ANCHOR_DATE);
  const res2 = parseVietnameseTaskInput('Nộp slide Triết học mốt', ANCHOR_DATE);
  const expectedDate = formatIsoDateOnly(ANCHOR_DATE, 2); // 2026-10-16
  assert.equal(res1.dueDate, expectedDate);
  assert.equal(res2.dueDate, expectedDate);
});

test('Tier 1 - Date Extraction 4: "thứ 6" resolves to upcoming Friday', () => {
  const res = parseVietnameseTaskInput('Nộp báo cáo Toán rời rạc thứ 6', ANCHOR_DATE);
  // ANCHOR_DATE is Wednesday Oct 14 -> Friday is Oct 16
  assert.equal(res.dueDate, '2026-10-16');
});

test('Tier 1 - Date Extraction 5: "cuối tuần" resolves to weekend date (Saturday or Sunday)', () => {
  const res = parseVietnameseTaskInput('Làm đồ án CTDL cuối tuần', ANCHOR_DATE);
  // ANCHOR_DATE is Wednesday Oct 14 -> weekend is Oct 17 or Oct 18
  assert.ok(
    res.dueDate === '2026-10-17' || res.dueDate === '2026-10-18',
    `Expected weekend date (2026-10-17 or 2026-10-18), got ${res.dueDate}`
  );
});

test('Tier 1 - Date Extraction 6: "tuần sau" shifts date by +7 days', () => {
  const res = parseVietnameseTaskInput('Thi giữa kỳ Mạng máy tính tuần sau', ANCHOR_DATE);
  const diff = calendarDiffDays(formatIsoDateOnly(ANCHOR_DATE, 0), res.dueDate);
  assert.ok(diff >= 7, `Expected at least +7 days offset for "tuần sau", got diff=${diff}`);
});

test('Tier 1 - Date Extraction 7: Explicit "DD/MM" and "DD/MM/YYYY" format', () => {
  const res1 = parseVietnameseTaskInput('Nộp bài tập lớn 25/10', ANCHOR_DATE);
  assert.equal(res1.dueDate, '2026-10-25');

  const res2 = parseVietnameseTaskInput('Bảo vệ đồ án 15/11/2026', ANCHOR_DATE);
  assert.equal(res2.dueDate, '2026-11-15');
});

// --- 1.2 Time Extraction (7 test cases) ---

test('Tier 1 - Time Extraction 1: "23h" resolves to "23:00"', () => {
  const res = parseVietnameseTaskInput('Nộp bài tập 23h ngày mai', ANCHOR_DATE);
  assert.equal(res.dueTime, '23:00');
});

test('Tier 1 - Time Extraction 2: "11 giờ đêm" resolves to "23:00"', () => {
  const res = parseVietnameseTaskInput('Hạn nộp 11 giờ đêm hôm nay', ANCHOR_DATE);
  assert.equal(res.dueTime, '23:00');
});

test('Tier 1 - Time Extraction 3: "14h30" resolves to "14:30"', () => {
  const res = parseVietnameseTaskInput('Họp nhóm 14h30 ngày mai', ANCHOR_DATE);
  assert.equal(res.dueTime, '14:30');
});

test('Tier 1 - Time Extraction 4: "8h sáng" resolves to "08:00"', () => {
  const res = parseVietnameseTaskInput('Thi trắc nghiệm 8h sáng thứ 6', ANCHOR_DATE);
  assert.equal(res.dueTime, '08:00');
});

test('Tier 1 - Time Extraction 5: "cuối ngày" resolves to "23:59"', () => {
  const res = parseVietnameseTaskInput('Nộp bài tập cuối ngày mai', ANCHOR_DATE);
  assert.equal(res.dueTime, '23:59');
});

test('Tier 1 - Time Extraction 6: Standard colon format "17:45" resolves to "17:45"', () => {
  const res = parseVietnameseTaskInput('Nộp bài kiểm tra 17:45 ngày mai', ANCHOR_DATE);
  assert.equal(res.dueTime, '17:45');
});

test('Tier 1 - Time Extraction 7: "12h trưa" resolves to "12:00"', () => {
  const res = parseVietnameseTaskInput('Gặp giảng viên 12h trưa mai', ANCHOR_DATE);
  assert.equal(res.dueTime, '12:00');
});

// --- 1.3 Course Extraction (6 test cases) ---

test('Tier 1 - Course Extraction 1: "Mạng máy tính" catalog course', () => {
  const res = parseVietnameseTaskInput('Nộp bài tập lớn Mạng máy tính lúc 23h', ANCHOR_DATE);
  assert.equal(res.course, 'Mạng máy tính');
});

test('Tier 1 - Course Extraction 2: "Giải tích" catalog course', () => {
  const res = parseVietnameseTaskInput('Ôn thi Giải tích 2 lúc 8h sáng', ANCHOR_DATE);
  assert.ok(res.course?.includes('Giải tích'), `Expected Giải tích, got ${res.course}`);
});

test('Tier 1 - Course Extraction 3: "Triết học" / "Triết" catalog course', () => {
  const res = parseVietnameseTaskInput('Làm slide Triết ngày mai', ANCHOR_DATE);
  assert.ok(res.course?.includes('Triết'), `Expected course matching Triết, got ${res.course}`);
});

test('Tier 1 - Course Extraction 4: "Toán rời rạc" catalog course', () => {
  const res = parseVietnameseTaskInput('Luyện đề Toán rời rạc 90p', ANCHOR_DATE);
  assert.equal(res.course, 'Toán rời rạc');
});

test('Tier 1 - Course Extraction 5: "CTDL & GT" catalog course', () => {
  const res = parseVietnameseTaskInput('Đồ án CTDL cuối tuần', ANCHOR_DATE);
  assert.equal(res.course, 'CTDL & GT');
});

test('Tier 1 - Course Extraction 6: "Xác suất Thống kê" catalog course', () => {
  const res = parseVietnameseTaskInput('Kiểm tra Xác suất Thống kê ngày mốt', ANCHOR_DATE);
  assert.equal(res.course, 'Xác suất Thống kê');
});

// --- 1.4 Duration Extraction (5 test cases) ---

test('Tier 1 - Duration Extraction 1: "90p" resolves to 90 minutes', () => {
  const res = parseVietnameseTaskInput('Ôn thi Giải tích 90p', ANCHOR_DATE);
  assert.equal(res.estimateMin, 90);
});

test('Tier 1 - Duration Extraction 2: "2 tiếng" resolves to 120 minutes', () => {
  const res = parseVietnameseTaskInput('Học nhóm 2 tiếng hôm nay', ANCHOR_DATE);
  assert.equal(res.estimateMin, 120);
});

test('Tier 1 - Duration Extraction 3: "45 phút" resolves to 45 minutes', () => {
  const res = parseVietnameseTaskInput('Làm quiz 45 phút', ANCHOR_DATE);
  assert.equal(res.estimateMin, 45);
});

test('Tier 1 - Duration Extraction 4: "1.5h" resolves to 90 minutes', () => {
  const res = parseVietnameseTaskInput('Viết báo cáo 1.5h', ANCHOR_DATE);
  assert.equal(res.estimateMin, 90);
});

test('Tier 1 - Duration Extraction 5: "3 giờ" resolves to 180 minutes', () => {
  const res = parseVietnameseTaskInput('Làm đồ án 3 giờ', ANCHOR_DATE);
  assert.equal(res.estimateMin, 180);
});

// --- 1.5 Fallback Behavior (5 test cases) ---

test('Tier 1 - Fallback 1: Input lacking date/time defaults gracefully to today 23:59', () => {
  const res = parseVietnameseTaskInput('Đọc chương 4 sách giáo trình', ANCHOR_DATE);
  assert.equal(res.dueDate, formatIsoDateOnly(ANCHOR_DATE, 0));
  assert.equal(res.dueTime, '23:59');
  assert.ok(res.title.length > 0);
});

test('Tier 1 - Fallback 2: Default estimate duration is 45 minutes when unspecified', () => {
  const res = parseVietnameseTaskInput('Chuẩn bị bài thuyết trình', ANCHOR_DATE);
  assert.equal(res.estimateMin, 45);
});

test('Tier 1 - Fallback 3: Default priority is "medium" when unspecified', () => {
  const res = parseVietnameseTaskInput('Tham khảo tài liệu thư viện', ANCHOR_DATE);
  assert.equal(res.priority, 'medium');
});

test('Tier 1 - Fallback 4: Course-only input extracts course and defaults date to today', () => {
  const res = parseVietnameseTaskInput('Học Mạng máy tính', ANCHOR_DATE);
  assert.equal(res.course, 'Mạng máy tính');
  assert.equal(res.dueDate, formatIsoDateOnly(ANCHOR_DATE, 0));
  assert.equal(res.dueTime, '23:59');
});

test('Tier 1 - Fallback 5: Priority-only input extracts priority and defaults date to today', () => {
  const res = parseVietnameseTaskInput('Gấp hoàn thành form khảo sát', ANCHOR_DATE);
  assert.equal(res.priority, 'high');
  assert.equal(res.dueDate, formatIsoDateOnly(ANCHOR_DATE, 0));
  assert.equal(res.dueTime, '23:59');
});

// --- 1.6 4 Priority Tiers (5 test cases) ---

test('Tier 1 - Priority Tiers 1: "thấp" / "ưu tiên thấp" maps to "low"', () => {
  const res1 = parseVietnameseTaskInput('Dọn dẹp ghi chú thấp', ANCHOR_DATE);
  const res2 = parseVietnameseTaskInput('Dọn dẹp ghi chú ưu tiên thấp', ANCHOR_DATE);
  assert.equal(res1.priority, 'low');
  assert.equal(res2.priority, 'low');
});

test('Tier 1 - Priority Tiers 2: "vừa" / "bình thường" maps to "medium"', () => {
  const res1 = parseVietnameseTaskInput('Xem video bài giảng vừa', ANCHOR_DATE);
  const res2 = parseVietnameseTaskInput('Xem video bài giảng bình thường', ANCHOR_DATE);
  assert.equal(res1.priority, 'medium');
  assert.equal(res2.priority, 'medium');
});

test('Tier 1 - Priority Tiers 3: "gấp" / "ưu tiên cao" maps to "high"', () => {
  const res1 = parseVietnameseTaskInput('Nộp phiếu học phần gấp', ANCHOR_DATE);
  const res2 = parseVietnameseTaskInput('Nộp phiếu học phần ưu tiên cao', ANCHOR_DATE);
  assert.equal(res1.priority, 'high');
  assert.equal(res2.priority, 'high');
});

test('Tier 1 - Priority Tiers 4: "siêu gấp" / "siêu khẩn cấp" maps to "urgent"', () => {
  const res1 = parseVietnameseTaskInput('Fix bug server siêu gấp', ANCHOR_DATE);
  const res2 = parseVietnameseTaskInput('Fix bug server siêu khẩn cấp', ANCHOR_DATE);
  assert.equal(res1.priority, 'urgent');
  assert.equal(res2.priority, 'urgent');
});

test('Tier 1 - Priority Tiers 5: Priority words are cleaned from the extracted task title', () => {
  const res = parseVietnameseTaskInput('Nộp báo cáo thực tập siêu gấp', ANCHOR_DATE);
  assert.equal(res.priority, 'urgent');
  assert.ok(!res.title.toLowerCase().includes('siêu gấp'), 'Title should not contain "siêu gấp" keyword');
});

// --- 1.7 Store Dual-Write (5 test cases) ---

test('Tier 1 - Store Dual-Write 1: addQuickTask atomically creates TaskItem and DeadlineItem', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();

  const payload = createSampleTaskPayload();
  const result = addQuickTask(payload);

  assert.ok(result.task, 'Must return created task');
  assert.ok(result.deadline, 'Must return created deadline');
  assert.equal(typeof result.undo, 'function', 'Must return undo callback');
  assert.ok(result.task.id, 'Task must have a non-empty id');
  assert.ok(result.deadline.id, 'Deadline must have a non-empty id');
});

test('Tier 1 - Store Dual-Write 2: created task exists in getSharedState().tasks', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();

  const payload = createSampleTaskPayload({ title: 'Task in shared state check' });
  const result = addQuickTask(payload);

  const state = getSharedState();
  const foundTask = state.tasks.find((t) => t.id === result.task.id);
  assert.ok(foundTask, 'Created task must exist in state.tasks');
  assert.equal(foundTask.title, 'Task in shared state check');
});

test('Tier 1 - Store Dual-Write 3: created deadline exists in getSharedState().deadlines', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();

  const payload = createSampleTaskPayload({ title: 'Deadline in shared state check' });
  const result = addQuickTask(payload);

  const state = getSharedState();
  const foundDeadline = state.deadlines.find((d) => d.id === result.deadline.id);
  assert.ok(foundDeadline, 'Created deadline must exist in state.deadlines');
  assert.equal(foundDeadline.title, 'Deadline in shared state check');
});

test('Tier 1 - Store Dual-Write 4: consistent metadata across task and deadline', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();

  const payload = createSampleTaskPayload({
    title: 'Đồ án Hệ điều hành',
    course: 'Hệ điều hành',
    dueAt: '2026-10-18T23:59:00',
  });
  const result = addQuickTask(payload);

  assert.equal(result.deadline.title, result.task.title);
  assert.equal(result.deadline.course, result.task.course);
  assert.equal(
    result.deadline.dueDate?.slice(0, 10),
    result.task.dueAt.slice(0, 10),
    'Deadline date must match task dueAt date prefix'
  );
});

test('Tier 1 - Store Dual-Write 5: priority mapping to deadline.urgent flag', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();

  // Urgent priority sets deadline.urgent = true
  const resUrgent = addQuickTask(createSampleTaskPayload({ priority: 'urgent' as TaskPriority }));
  assert.equal(resUrgent.deadline.urgent, true, 'Urgent priority must set deadline.urgent to true');

  // Low priority sets deadline.urgent = false
  const resLow = addQuickTask(createSampleTaskPayload({ priority: 'low' }));
  assert.equal(resLow.deadline.urgent, false, 'Low priority must set deadline.urgent to false');
});

// --- 1.8 Store XP & Rank (5 test cases) ---

test('Tier 1 - Store XP & Rank 1: addQuickTask awards exactly +10 XP', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();

  const initialXp = getSharedState().xp;
  addQuickTask(createSampleTaskPayload());

  assert.equal(getSharedState().xp, initialXp + 10, 'Must award exactly +10 XP');
});

test('Tier 1 - Store XP & Rank 2: level advancement when XP crosses threshold', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();

  // Set XP to 195 (Level 1: 0-199 XP, Level 2 starts at 200 XP)
  updateSharedState((prev) => ({
    ...prev,
    xp: 195,
    level: 1,
    rankTitle: 'Tân sinh viên ngơ ngác',
  }));

  // Adding task gives +10 XP -> 205 XP -> Level 2
  addQuickTask(createSampleTaskPayload());

  const state = getSharedState();
  assert.equal(state.xp, 205);
  assert.equal(state.level, 2, 'Level must advance from 1 to 2');
  assert.equal(state.rankTitle, 'Cú đêm giảng đường');
});

test('Tier 1 - Store XP & Rank 3: rankTitle updates atomically with level advancement', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();

  // Set XP to 495 (Level 2: 200-499, Level 3 starts at 500)
  updateSharedState((prev) => ({
    ...prev,
    xp: 495,
    level: 2,
    rankTitle: 'Cú đêm giảng đường',
  }));

  addQuickTask(createSampleTaskPayload());

  const state = getSharedState();
  assert.equal(state.xp, 505);
  assert.equal(state.level, 3);
  assert.equal(state.rankTitle, 'Dũng sĩ trốn điểm danh');
});

test('Tier 1 - Store XP & Rank 4: level stays stable within the same XP band', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();

  updateSharedState((prev) => ({
    ...prev,
    xp: 50,
    level: 1,
    rankTitle: 'Tân sinh viên ngơ ngác',
  }));

  addQuickTask(createSampleTaskPayload());

  const state = getSharedState();
  assert.equal(state.xp, 60);
  assert.equal(state.level, 1);
  assert.equal(state.rankTitle, 'Tân sinh viên ngơ ngác');
});

test('Tier 1 - Store XP & Rank 5: multiple rapid task additions accumulate +10 XP each', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();

  const startXp = getSharedState().xp;
  addQuickTask(createSampleTaskPayload({ title: 'Task 1' }));
  addQuickTask(createSampleTaskPayload({ title: 'Task 2' }));
  addQuickTask(createSampleTaskPayload({ title: 'Task 3' }));

  assert.equal(getSharedState().xp, startXp + 30);
});

// --- 1.9 Store Undo (5 test cases) ---

test('Tier 1 - Store Undo 1: calling undo() removes task from state.tasks', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();

  const result = addQuickTask(createSampleTaskPayload());
  assert.ok(getSharedState().tasks.some((t) => t.id === result.task.id));

  result.undo();
  assert.equal(
    getSharedState().tasks.some((t) => t.id === result.task.id),
    false,
    'Task must be removed from state.tasks upon undo'
  );
});

test('Tier 1 - Store Undo 2: calling undo() removes deadline from state.deadlines', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();

  const result = addQuickTask(createSampleTaskPayload());
  assert.ok(getSharedState().deadlines.some((d) => d.id === result.deadline.id));

  result.undo();
  assert.equal(
    getSharedState().deadlines.some((d) => d.id === result.deadline.id),
    false,
    'Deadline must be removed from state.deadlines upon undo'
  );
});

test('Tier 1 - Store Undo 3: calling undo() rolls back awarded +10 XP', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();

  const initialXp = getSharedState().xp;
  const result = addQuickTask(createSampleTaskPayload());
  assert.equal(getSharedState().xp, initialXp + 10);

  result.undo();
  assert.equal(getSharedState().xp, initialXp, 'XP must be deducted back to initial value');
});

test('Tier 1 - Store Undo 4: calling undo() rolls back level and rankTitle if leveled up', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();

  updateSharedState((prev) => ({
    ...prev,
    xp: 195,
    level: 1,
    rankTitle: 'Tân sinh viên ngơ ngác',
  }));

  const result = addQuickTask(createSampleTaskPayload());
  assert.equal(getSharedState().level, 2);

  result.undo();
  const state = getSharedState();
  assert.equal(state.xp, 195);
  assert.equal(state.level, 1, 'Level must revert back to 1');
  assert.equal(state.rankTitle, 'Tân sinh viên ngơ ngác', 'Rank title must revert back to Level 1 rank');
});

test('Tier 1 - Store Undo 5: undo() is idempotent and does not deduct XP repeatedly', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();

  const initialXp = getSharedState().xp;
  const result = addQuickTask(createSampleTaskPayload());
  result.undo();
  assert.equal(getSharedState().xp, initialXp);

  // Calling undo second time must not double-deduct XP
  result.undo();
  assert.equal(getSharedState().xp, initialXp);
});

// =========================================================================
// TIER 2: BOUNDARY & CORNER CASES
// =========================================================================

test('Tier 2 - Boundary 1: Empty string input returns fallback "Nhiệm vụ mới" with today 23:59', () => {
  const res = parseVietnameseTaskInput('', ANCHOR_DATE);
  assert.equal(res.title, 'Nhiệm vụ mới');
  assert.equal(res.dueDate, formatIsoDateOnly(ANCHOR_DATE, 0));
  assert.equal(res.dueTime, '23:59');
  assert.equal(res.priority, 'medium');
});

test('Tier 2 - Boundary 2: Whitespace-only input (spaces, tabs, newlines) safely handled', () => {
  const res = parseVietnameseTaskInput('   \t\n   \n\t  ', ANCHOR_DATE);
  assert.equal(res.title, 'Nhiệm vụ mới');
  assert.equal(res.dueDate, formatIsoDateOnly(ANCHOR_DATE, 0));
  assert.equal(res.dueTime, '23:59');
});

test('Tier 2 - Boundary 3: Special punctuation and symbols-only input safely handled', () => {
  const res1 = parseVietnameseTaskInput('!@#$%^&*()_+', ANCHOR_DATE);
  assert.equal(res1.title, 'Nhiệm vụ mới');

  const res2 = parseVietnameseTaskInput('....????', ANCHOR_DATE);
  assert.equal(res2.title, 'Nhiệm vụ mới');
});

test('Tier 2 - Boundary 4: Late night times: "23:59", "00:00", "0h", "24h"', () => {
  const res2359 = parseVietnameseTaskInput('Nộp bài lúc 23:59 hôm nay', ANCHOR_DATE);
  assert.equal(res2359.dueTime, '23:59');

  const res0000 = parseVietnameseTaskInput('Chốt danh sách lúc 00:00 mai', ANCHOR_DATE);
  assert.equal(res0000.dueTime, '00:00');

  const res0h = parseVietnameseTaskInput('Reset server 0h hôm nay', ANCHOR_DATE);
  assert.equal(res0h.dueTime, '00:00');

  const res24h = parseVietnameseTaskInput('Hạn chót 24h ngày mai', ANCHOR_DATE);
  assert.ok(
    res24h.dueTime === '00:00' || res24h.dueTime === '23:59',
    `Expected 00:00 or 23:59 for 24h, got ${res24h.dueTime}`
  );
});

test('Tier 2 - Boundary 5: "thứ 6 tuần sau" vs "thứ 6" enforces exactly 7-day relative difference', () => {
  const thisFriday = parseVietnameseTaskInput('Nộp bài tập thứ 6', ANCHOR_DATE);
  const nextFriday = parseVietnameseTaskInput('Nộp bài tập thứ 6 tuần sau', ANCHOR_DATE);

  // ANCHOR_DATE is Wednesday Oct 14:
  // "thứ 6" is Oct 16
  // "thứ 6 tuần sau" must be Oct 23 (+7 days after thisFriday)
  assert.equal(thisFriday.dueDate, '2026-10-16');
  assert.equal(nextFriday.dueDate, '2026-10-23');

  const diff = calendarDiffDays(thisFriday.dueDate, nextFriday.dueDate);
  assert.equal(diff, 7, `"thứ 6 tuần sau" must be exactly 7 days after "thứ 6"`);
});

test('Tier 2 - Boundary 6: "thứ 2 tuần sau" vs "thứ 2" maintains week offset distinction', () => {
  const thisMon = parseVietnameseTaskInput('Nộp bài thứ 2', ANCHOR_DATE);
  const nextMon = parseVietnameseTaskInput('Nộp bài thứ 2 tuần sau', ANCHOR_DATE);

  // Wednesday Oct 14 -> upcoming Monday is Oct 19
  // "thứ 2 tuần sau" is Oct 26
  assert.equal(thisMon.dueDate, '2026-10-19');
  assert.equal(nextMon.dueDate, '2026-10-26');

  const diff = calendarDiffDays(thisMon.dueDate, nextMon.dueDate);
  assert.equal(diff, 7);
});

test('Tier 2 - Boundary 7: Anti-greediness: "siêu gấp" matches "urgent", NOT "high"', () => {
  const res = parseVietnameseTaskInput('Nộp đồ án tốt nghiệp siêu gấp', ANCHOR_DATE);
  assert.equal(
    res.priority,
    'urgent',
    '"siêu gấp" contains substring "gấp" but must resolve to "urgent", not "high"'
  );
});

test('Tier 2 - Boundary 8: Anti-greediness: "không gấp" matches "low", NOT "high"', () => {
  const res = parseVietnameseTaskInput('Đọc tài liệu tham khảo không gấp', ANCHOR_DATE);
  assert.equal(
    res.priority,
    'low',
    '"không gấp" contains "gấp" but must resolve to "low", not "high"'
  );
});

test('Tier 2 - Boundary 9: Anti-greediness: "ưu tiên siêu gấp" matches "urgent"', () => {
  const res = parseVietnameseTaskInput('Nộp đề tài ưu tiên siêu gấp', ANCHOR_DATE);
  assert.equal(res.priority, 'urgent');
});

test('Tier 2 - Boundary 10: Long input (>200 chars) with nested punctuation and course names', () => {
  const longInput =
    '[QUAN TRONG] Nộp bài tập lớn Mạng máy tính và slide Triết học lúc 23h ngày mai 90p siêu gấp!!! Ghi chú: Cần nộp qua cả Google Classroom và portal trường, đính kèm file pdf báo cáo 20 trang.';
  const res = parseVietnameseTaskInput(longInput, ANCHOR_DATE);

  assert.equal(res.dueTime, '23:00');
  assert.equal(res.dueDate, formatIsoDateOnly(ANCHOR_DATE, 1));
  assert.equal(res.priority, 'urgent');
  assert.equal(res.estimateMin, 90);
  assert.ok(res.title.length > 5, 'Title should be extracted and non-empty');
});

test('Tier 2 - Boundary 11: Leading and trailing punctuation cleanly stripped from title', () => {
  const res = parseVietnameseTaskInput('--- Ôn thi Giải tích 2 lúc 8h sáng! ---', ANCHOR_DATE);
  assert.ok(!res.title.startsWith('-'), 'Title should not start with hyphen');
  assert.ok(!res.title.endsWith('-'), 'Title should not end with hyphen');
  assert.ok(res.title.includes('Ôn thi Giải tích'));
});

test('Tier 2 - Boundary 12: Calendar leap-year transition: Feb 28 to Feb 29 (leap day)', () => {
  // 2028 is a leap year. Feb 28 is Monday, Feb 29 is Tuesday.
  const leapAnchor = new Date(2028, 1, 28, 12, 0, 0); // 2028-02-28
  const res = parseVietnameseTaskInput('Nộp báo cáo ngày mai', leapAnchor);
  assert.equal(res.dueDate, '2028-02-29');
});

test('Tier 2 - Boundary 13: Calendar year-end transition: Dec 31 to Jan 01 next year', () => {
  const yearEndAnchor = new Date(2026, 11, 31, 12, 0, 0); // 2026-12-31
  const res = parseVietnameseTaskInput('Nộp kế hoạch năm mới ngày mai', yearEndAnchor);
  assert.equal(res.dueDate, '2027-01-01');
});

// =========================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS (PAIRWISE MATRIX)
// =========================================================================

test('Tier 3 - Pairwise 1: Date (ngày mai) + Time (23h) + Course (Mạng máy tính) + Priority (siêu gấp)', () => {
  const res = parseVietnameseTaskInput(
    'Nộp bài lab Mạng máy tính lúc 23h ngày mai siêu gấp',
    ANCHOR_DATE
  );
  assert.equal(res.dueDate, '2026-10-15');
  assert.equal(res.dueTime, '23:00');
  assert.equal(res.course, 'Mạng máy tính');
  assert.equal(res.priority, 'urgent');
});

test('Tier 3 - Pairwise 2: Date (thứ 6) + Time (8h sáng) + Duration (90p) + Priority (gấp)', () => {
  const res = parseVietnameseTaskInput(
    'Thi trắc nghiệm thứ 6 8h sáng 90p gấp',
    ANCHOR_DATE
  );
  assert.equal(res.dueDate, '2026-10-16');
  assert.equal(res.dueTime, '08:00');
  assert.equal(res.estimateMin, 90);
  assert.equal(res.priority, 'high');
});

test('Tier 3 - Pairwise 3: Date (cuối tuần) + Time (14h30) + Course (Triết học) + Priority (thấp)', () => {
  const res = parseVietnameseTaskInput(
    'Làm slide Triết học cuối tuần 14h30 ưu tiên thấp',
    ANCHOR_DATE
  );
  assert.ok(res.dueDate === '2026-10-17' || res.dueDate === '2026-10-18');
  assert.equal(res.dueTime, '14:30');
  assert.ok(res.course?.includes('Triết'));
  assert.equal(res.priority, 'low');
});

test('Tier 3 - Pairwise 4: Date (tuần sau) + Duration (2 tiếng) + Course (Toán rời rạc) + Priority (vừa)', () => {
  const res = parseVietnameseTaskInput(
    'Ôn tập Toán rời rạc tuần sau 2 tiếng vừa',
    ANCHOR_DATE
  );
  const diff = calendarDiffDays(formatIsoDateOnly(ANCHOR_DATE, 0), res.dueDate);
  assert.ok(diff >= 7);
  assert.equal(res.estimateMin, 120);
  assert.equal(res.course, 'Toán rời rạc');
  assert.equal(res.priority, 'medium');
});

test('Tier 3 - Pairwise 5: Explicit Date (25/10) + Time (cuối ngày) + Duration (45 phút) + Course (CTDL & GT)', () => {
  const res = parseVietnameseTaskInput(
    'Thực hành CTDL 25/10 cuối ngày 45 phút',
    ANCHOR_DATE
  );
  assert.equal(res.dueDate, '2026-10-25');
  assert.equal(res.dueTime, '23:59');
  assert.equal(res.estimateMin, 45);
  assert.equal(res.course, 'CTDL & GT');
});

test('Tier 3 - Store Lifecycle 1: Interleaved creation and selective undo preserves sibling tasks', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();

  const task1 = addQuickTask(createSampleTaskPayload({ title: 'Task Alpha' }));
  const task2 = addQuickTask(createSampleTaskPayload({ title: 'Task Beta' }));

  assert.equal(getSharedState().tasks.filter((t) => t.id === task1.task.id || t.id === task2.task.id).length, 2);

  // Undo task1 only
  task1.undo();

  const stateAfterUndo = getSharedState();
  assert.equal(stateAfterUndo.tasks.some((t) => t.id === task1.task.id), false, 'Task Alpha must be removed');
  assert.equal(stateAfterUndo.deadlines.some((d) => d.id === task1.deadline.id), false, 'Deadline Alpha must be removed');
  assert.equal(stateAfterUndo.tasks.some((t) => t.id === task2.task.id), true, 'Task Beta must still exist');
  assert.equal(stateAfterUndo.deadlines.some((d) => d.id === task2.deadline.id), true, 'Deadline Beta must still exist');
});

test('Tier 3 - Store Lifecycle 2: Creation, undo all, and subsequent recreation', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();

  const baselineXp = getSharedState().xp;

  const t1 = addQuickTask(createSampleTaskPayload({ title: 'Item 1' }));
  const t2 = addQuickTask(createSampleTaskPayload({ title: 'Item 2' }));
  assert.equal(getSharedState().xp, baselineXp + 20);

  t2.undo();
  t1.undo();
  assert.equal(getSharedState().xp, baselineXp);

  const t3 = addQuickTask(createSampleTaskPayload({ title: 'Item 3' }));
  assert.equal(getSharedState().xp, baselineXp + 10);
  assert.ok(getSharedState().tasks.some((t) => t.id === t3.task.id));
});

// =========================================================================
// TIER 4: REAL-WORLD VIETNAMESE USER SCENARIOS
// =========================================================================

test('Tier 4 - Real World 1: "Nộp bài tập lớn Mạng máy tính lúc 23h thứ 6"', () => {
  const res = parseVietnameseTaskInput(
    'Nộp bài tập lớn Mạng máy tính lúc 23h thứ 6',
    ANCHOR_DATE
  );
  assert.equal(res.course, 'Mạng máy tính');
  assert.equal(res.dueTime, '23:00');
  assert.equal(res.dueDate, '2026-10-16');
  assert.ok(res.title.includes('Bài tập lớn') || res.title.includes('Mạng'));
});

test('Tier 4 - Real World 2: "ôn thi Giải tích thứ 6 tuần sau 90p"', () => {
  const res = parseVietnameseTaskInput(
    'ôn thi Giải tích thứ 6 tuần sau 90p',
    ANCHOR_DATE
  );
  assert.ok(res.course?.includes('Giải tích'));
  assert.equal(res.dueDate, '2026-10-23');
  assert.equal(res.estimateMin, 90);
  assert.ok(res.title.toLowerCase().includes('ôn thi'));
});

test('Tier 4 - Real World 3: "làm slide Triết ngày mai"', () => {
  const res = parseVietnameseTaskInput('làm slide Triết ngày mai', ANCHOR_DATE);
  assert.ok(res.course?.includes('Triết'));
  assert.equal(res.dueDate, '2026-10-15');
  assert.ok(res.title.toLowerCase().includes('slide'));
});

test('Tier 4 - Real World 4: "Deadline đồ án CTDL cuối tuần siêu gấp"', () => {
  const res = parseVietnameseTaskInput(
    'Deadline đồ án CTDL cuối tuần siêu gấp',
    ANCHOR_DATE
  );
  assert.equal(res.course, 'CTDL & GT');
  assert.ok(res.dueDate === '2026-10-17' || res.dueDate === '2026-10-18');
  assert.equal(res.priority, 'urgent');
  assert.ok(res.title.toLowerCase().includes('đồ án'));
});

test('Tier 4 - Real World 5: "Luyện đề Toán rời rạc 14h30 chủ nhật 2 tiếng vừa"', () => {
  const res = parseVietnameseTaskInput(
    'Luyện đề Toán rời rạc 14h30 chủ nhật 2 tiếng vừa',
    ANCHOR_DATE
  );
  assert.equal(res.course, 'Toán rời rạc');
  assert.equal(res.dueTime, '14:30');
  assert.equal(res.dueDate, '2026-10-18'); // Sunday
  assert.equal(res.estimateMin, 120);
  assert.equal(res.priority, 'medium');
});

test('Tier 4 - Real World 6: "Báo cáo thực tập Dự án Web 17:00 ngày 25/10 2 tiếng"', () => {
  const res = parseVietnameseTaskInput(
    'Báo cáo thực tập Dự án Web 17:00 ngày 25/10 2 tiếng',
    ANCHOR_DATE
  );
  assert.ok(res.course?.includes('Dự án Web') || res.course?.includes('Web'));
  assert.equal(res.dueDate, '2026-10-25');
  assert.equal(res.dueTime, '17:00');
  assert.equal(res.estimateMin, 120);
});

test('Tier 4 - Real World 7: Voice Brain-Dump style: "mai nộp bài tập xác suất thống kê gấp"', () => {
  const res = parseVietnameseTaskInput(
    'mai nộp bài tập xác suất thống kê gấp',
    ANCHOR_DATE
  );
  assert.equal(res.course, 'Xác suất Thống kê');
  assert.equal(res.dueDate, '2026-10-15');
  assert.equal(res.priority, 'high');
});

test('Tier 4 - Real World 8: End-to-End Pipeline: Parse Natural Language -> Dual-Write Store -> Undo Rollback', () => {
  resetSharedState(ANCHOR_DATE);
  const addQuickTask = getAddQuickTask();
  const initialXp = getSharedState().xp;

  // Step 1: User types natural language prompt
  const rawInput = 'Nộp bài tập lớn Mạng máy tính lúc 23h thứ 6 siêu gấp';
  const parsed = parseVietnameseTaskInput(rawInput, ANCHOR_DATE);

  // Step 2: Modal converts parsed output to task creation payload
  const taskPayload = createSampleTaskPayload({
    title: parsed.title,
    course: parsed.course,
    dueAt: `${parsed.dueDate}T${parsed.dueTime}:00`,
    estimateMin: parsed.estimateMin,
    priority: parsed.priority,
  });

  // Step 3: Dispatch addQuickTask to store
  const { task, deadline, undo } = addQuickTask(taskPayload);

  // Step 4: Verify dual-write state and gamification
  const stateAfterAdd = getSharedState();
  assert.ok(stateAfterAdd.tasks.some((t) => t.id === task.id));
  assert.ok(stateAfterAdd.deadlines.some((d) => d.id === deadline.id));
  assert.equal(stateAfterAdd.xp, initialXp + 10);
  assert.equal(deadline.urgent, true);

  // Step 5: User clicks Undo in 5-second toast
  undo();

  // Step 6: Verify total rollback
  const stateAfterUndo = getSharedState();
  assert.equal(stateAfterUndo.tasks.some((t) => t.id === task.id), false);
  assert.equal(stateAfterUndo.deadlines.some((d) => d.id === deadline.id), false);
  assert.equal(stateAfterUndo.xp, initialXp);
});
