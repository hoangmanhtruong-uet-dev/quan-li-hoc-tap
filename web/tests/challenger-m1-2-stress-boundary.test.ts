/**
 * CampusOS Milestone 1 Empirical Stress & Boundary Verification Test Suite
 * Created by Empirical Challenger (challenger_quicktask_m1_2)
 *
 * Scenarios Tested:
 * 1. tasks-engine.ts NLP against Ambiguous Inputs, Special Characters, Uppercase/Lowercase, Diacritics, and Boundary Conditions
 * 2. campus-store.ts addQuickTask: Dual-Write Matching IDs, Urgency Flag, Valid Dates, Level Recalculation, and Undo Rollback Integrity
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import type { TaskItem, TaskPriority } from '../src/types/tasks.ts';
import { parseVietnameseTaskInput, formatCountdown, getUrgencyLevel } from '../src/lib/tasks-engine.ts';
import {
  addQuickTask,
  resetSharedState,
  getSharedState,
  updateSharedState,
  calculateLevelAndRank,
  formatIsoDateOnly,
  type DeadlineItem,
} from '../src/lib/campus-store.ts';

// Anchor: Wednesday, Oct 14, 2026, 12:00:00 Local
const ANCHOR = new Date(2026, 9, 14, 12, 0, 0);

function createMockPayload(
  overrides: Partial<Omit<TaskItem, 'id' | 'createdAt' | 'order'>> = {}
): Omit<TaskItem, 'id' | 'createdAt' | 'order'> {
  return {
    title: 'Nộp bài tập kiểm thử ứng dụng',
    description: 'Chạy stress test bộ gõ và đồng bộ store',
    course: 'Kiểm thử phần mềm',
    status: 'todo',
    priority: 'high',
    difficulty: 3,
    dueAt: '2026-10-16T23:59:00',
    estimateMin: 45,
    actualMin: 0,
    steps: [],
    tags: ['QA', 'Challenger'],
    pomodoros: { planned: 1, done: 0 },
    ...overrides,
  };
}

// =========================================================================
// SECTION 1: NLP AMBIGUITY, SPECIAL CHARACTERS, DIACRITICS & CASE STRESS
// =========================================================================

test('NLP Stress 1: Uppercase & Mixed-case strings across all attributes', () => {
  const upper = parseVietnameseTaskInput(
    'NỘP BÀI TẬP LỚN MẠNG MÁY TÍNH LÚC 23H NGÀY MAI SIÊU GẤP',
    ANCHOR
  );
  assert.equal(upper.dueTime, '23:00');
  assert.equal(upper.dueDate, '2026-10-15');
  assert.equal(upper.priority, 'urgent');
  assert.equal(upper.course, 'Mạng máy tính');
  assert.ok(upper.title.length > 0);

  const mixed = parseVietnameseTaskInput(
    'Ôn ThI gIảI TíCh 2 Thứ 6 tUầN sAu 90P gẤp',
    ANCHOR
  );
  assert.equal(mixed.dueDate, '2026-10-23');
  assert.equal(mixed.estimateMin, 90);
  assert.equal(mixed.priority, 'high');
  assert.ok(mixed.course?.includes('Giải tích'));
});

test('NLP Stress 2: Unicode NFD Decomposed Diacritics normalized to NFC', () => {
  // "Mạng máy tính" in NFD decomposed form (combining diacritical marks)
  const nfdCourse = 'Mạng máy tính'.normalize('NFD');
  const nfdInput = `Nộp bài tập ${nfdCourse} lúc 23h ngày mai`;
  
  const res = parseVietnameseTaskInput(nfdInput, ANCHOR);
  assert.equal(res.course, 'Mạng máy tính');
  assert.equal(res.dueTime, '23:00');
  assert.equal(res.dueDate, '2026-10-15');
});

test('NLP Stress 3: Dense punctuation, brackets, code-like tokens and quotes', () => {
  const noisy = parseVietnameseTaskInput(
    '[[CS301]] "Nộp bài lab UDP/TCP": mạng máy tính; lúc 14h30 (thứ 6)! #BTL @urgent',
    ANCHOR
  );
  assert.equal(resOr(noisy.course), 'Mạng máy tính');
  assert.equal(noisy.dueTime, '14:30');
  assert.equal(noisy.dueDate, '2026-10-16');
  assert.ok(!noisy.title.includes('[['), 'Title should not retain brackets');
  assert.ok(!noisy.title.endsWith(';'), 'Title should not end with semicolon');
});

function resOr(val: string | undefined): string {
  return val || '';
}

test('NLP Stress 4: Vietnamese Homonyms & Verb/Keyword Ambiguity', () => {
  // "gấp" as verb "fold" vs priority "urgent"
  // The heuristic parser flags "gấp" as high priority
  const foldingTask = parseVietnameseTaskInput('Gấp quần áo lúc 20h hôm nay', ANCHOR);
  assert.equal(foldingTask.dueTime, '20:00');
  assert.equal(foldingTask.dueDate, '2026-10-14');
  assert.equal(foldingTask.priority, 'high'); // Heuristic recognizes "gấp"

  // "thấp" in academic title vs low priority
  const lowVoltage = parseVietnameseTaskInput('Tìm hiểu mạch điện áp thấp', ANCHOR);
  assert.equal(lowVoltage.priority, 'low');
  assert.ok(lowVoltage.title.length > 0);

  // "vừa" as adverb vs medium priority
  const recently = parseVietnameseTaskInput('Ôn tập kiến thức vừa học', ANCHOR);
  assert.equal(recently.priority, 'medium');
  assert.ok(recently.title.length > 0);
});

test('NLP Stress 5: Punctuation-only, Emojis, Symbols and Extreme Length', () => {
  // Punctuation-only
  const punc = parseVietnameseTaskInput('!@#$%^&*()_+{}[]:;"\'<>?,./', ANCHOR);
  assert.equal(punc.title, 'Nhiệm vụ mới');
  assert.equal(punc.dueTime, '23:59');

  // Emojis only
  const emoji = parseVietnameseTaskInput('🔥🚀📚🎯', ANCHOR);
  assert.ok(emoji.title.length > 0);
  assert.equal(emoji.dueTime, '23:59');

  // Single character
  const single = parseVietnameseTaskInput('X', ANCHOR);
  assert.equal(single.title, 'X');

  // Very long input (>1500 chars)
  const longPrefix = 'Nộp bài tập lớn Mạng máy tính lúc 23h ngày mai 90p siêu gấp: ';
  const extremeText = longPrefix + 'A'.repeat(1500);
  const extremeRes = parseVietnameseTaskInput(extremeText, ANCHOR);
  assert.equal(extremeRes.dueTime, '23:00');
  assert.equal(extremeRes.dueDate, '2026-10-15');
  assert.equal(extremeRes.priority, 'urgent');
  assert.equal(extremeRes.estimateMin, 90);
  assert.equal(extremeRes.course, 'Mạng máy tính');
});

test('NLP Stress 6: Extreme calendar transitions and date boundaries', () => {
  // Leap day in leap year 2028: Feb 28 to Feb 29
  const leapRef = new Date(2028, 1, 28, 10, 0, 0); // 2028-02-28
  const leapRes = parseVietnameseTaskInput('Nộp bài ngày mai', leapRef);
  assert.equal(leapRes.dueDate, '2028-02-29');

  // Non-leap year 2025: Feb 28 to Mar 01
  const nonLeapRef = new Date(2025, 1, 28, 10, 0, 0); // 2025-02-28
  const nonLeapRes = parseVietnameseTaskInput('Nộp bài ngày mai', nonLeapRef);
  assert.equal(nonLeapRes.dueDate, '2025-03-01');

  // Year-end transition: Dec 31 to Jan 01
  const yearEndRef = new Date(2026, 11, 31, 23, 0, 0); // 2026-12-31
  const yearEndRes = parseVietnameseTaskInput('Nộp kế hoạch ngày mai', yearEndRef);
  assert.equal(yearEndRes.dueDate, '2027-01-01');
});

test('NLP Stress 7: Ambiguous hour vs duration heuristics ("10h" vs "nộp 10h")', () => {
  // "Học 10h": without deadline verb, treated as 10 hours (600m) duration
  const studyHours = parseVietnameseTaskInput('Học 10h hôm nay', ANCHOR);
  assert.equal(studyHours.estimateMin, 600);
  assert.equal(studyHours.dueTime, '23:59');

  // "Nộp bài 10h": with deadline verb "nộp", treated as 10:00 due time
  const submitHours = parseVietnameseTaskInput('Nộp bài 10h hôm nay', ANCHOR);
  assert.equal(submitHours.dueTime, '10:00');
});

// =========================================================================
// SECTION 2: CAMPUS-STORE ADDQUICKTASK DUAL-WRITE & INTEGRITY
// =========================================================================

test('Store Stress 1: Dual-Write generates matching IDs and correct prefixes', () => {
  resetSharedState(ANCHOR);
  const payload = createMockPayload();
  const { task, deadline } = addQuickTask(payload);

  assert.ok(task.id.startsWith('task-'), `Task ID must start with task-, got ${task.id}`);
  assert.equal(deadline.id, `dl-${task.id}`, 'Deadline ID must strictly equal dl-${task.id}');
  
  const state = getSharedState();
  assert.ok(state.tasks.some((t) => t.id === task.id), 'Task must exist in state.tasks');
  assert.ok(state.deadlines.some((d) => d.id === deadline.id), 'Deadline must exist in state.deadlines');
});

test('Store Stress 2: Priority correctly derives deadline.urgent flag', () => {
  resetSharedState(ANCHOR);

  // Tier 1: urgent -> true
  const r1 = addQuickTask(createMockPayload({ priority: 'urgent' }));
  assert.equal(r1.deadline.urgent, true, 'urgent priority must have urgent: true');

  // Tier 2: high -> true
  const r2 = addQuickTask(createMockPayload({ priority: 'high' }));
  assert.equal(r2.deadline.urgent, true, 'high priority must have urgent: true');

  // Tier 3: medium -> false
  const r3 = addQuickTask(createMockPayload({ priority: 'medium' }));
  assert.equal(r3.deadline.urgent, false, 'medium priority must have urgent: false');

  // Tier 4: low -> false
  const r4 = addQuickTask(createMockPayload({ priority: 'low' }));
  assert.equal(r4.deadline.urgent, false, 'low priority must have urgent: false');
});

test('Store Stress 3: Valid date formatting on all DeadlineItem date fields', () => {
  resetSharedState(ANCHOR);
  const payload = createMockPayload({ dueAt: '2026-11-20T18:30:00' });
  const { deadline, task } = addQuickTask(payload);

  assert.equal(deadline.dueDate, '2026-11-20');
  assert.equal(deadline.date, '2026-11-20');
  assert.equal(deadline.displayDate, '2026-11-20');
  assert.equal(task.dueAt, '2026-11-20T18:30:00');

  // Verify YYYY-MM-DD format
  assert.match(deadline.dueDate!, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(deadline.date!, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(deadline.displayDate!, /^\d{4}-\d{2}-\d{2}$/);
});

test('Store Stress 4: Level and Rank recalculation across all tier boundaries', () => {
  resetSharedState(ANCHOR);

  // Test every transition boundary in calculateLevelAndRank:
  // L1: 0..199, L2: 200..499, L3: 500..899, L4: 900..1399, L5: 1400..1999
  const thresholds = [
    { targetXp: 195, expectedLevelBefore: 1, expectedLevelAfter: 2, newRank: 'Cú đêm giảng đường' },
    { targetXp: 495, expectedLevelBefore: 2, expectedLevelAfter: 3, newRank: 'Dũng sĩ trốn điểm danh' },
    { targetXp: 895, expectedLevelBefore: 3, expectedLevelAfter: 4, newRank: 'Bậc thầy nước đến chân' },
    { targetXp: 1395, expectedLevelBefore: 4, expectedLevelAfter: 5, newRank: 'Thợ săn deadline' },
    { targetXp: 1995, expectedLevelBefore: 5, expectedLevelAfter: 6, newRank: 'Chiến thần thuyết trình' },
  ];

  for (const t of thresholds) {
    updateSharedState((prev) => ({
      ...prev,
      xp: t.targetXp,
      ...calculateLevelAndRank(t.targetXp),
    }));

    assert.equal(getSharedState().level, t.expectedLevelBefore);

    const { undo } = addQuickTask(createMockPayload({ title: `Level-up test at ${t.targetXp}` }));

    const afterAdd = getSharedState();
    assert.equal(afterAdd.xp, t.targetXp + 10);
    assert.equal(afterAdd.level, t.expectedLevelAfter);
    assert.equal(afterAdd.rankTitle, t.newRank);

    // Rollback test
    undo();
    const afterUndo = getSharedState();
    assert.equal(afterUndo.xp, t.targetXp);
    assert.equal(afterUndo.level, t.expectedLevelBefore);
  }
});

test('Store Stress 5: Undo rollback integrity, idempotence and interleaved lifecycle', () => {
  resetSharedState(ANCHOR);
  const baselineState = getSharedState();
  const baselineXp = baselineState.xp;

  // Add 3 tasks
  const itemA = addQuickTask(createMockPayload({ title: 'Task Alpha' }));
  const itemB = addQuickTask(createMockPayload({ title: 'Task Beta' }));
  const itemC = addQuickTask(createMockPayload({ title: 'Task Gamma' }));

  assert.equal(getSharedState().xp, baselineXp + 30);
  assert.equal(getSharedState().tasks.length, baselineState.tasks.length + 3);

  // Undo itemB (middle item)
  itemB.undo();

  const stateAfterB = getSharedState();
  assert.equal(stateAfterB.xp, baselineXp + 20);
  assert.ok(stateAfterB.tasks.some((t) => t.id === itemA.task.id), 'Task A must be intact');
  assert.ok(stateAfterB.deadlines.some((d) => d.id === itemA.deadline.id), 'Deadline A must be intact');
  assert.ok(!stateAfterB.tasks.some((t) => t.id === itemB.task.id), 'Task B must be removed');
  assert.ok(!stateAfterB.deadlines.some((d) => d.id === itemB.deadline.id), 'Deadline B must be removed');
  assert.ok(stateAfterB.tasks.some((t) => t.id === itemC.task.id), 'Task C must be intact');
  assert.ok(stateAfterB.deadlines.some((d) => d.id === itemC.deadline.id), 'Deadline C must be intact');

  // Idempotence: Call itemB.undo() again -> nothing changes
  itemB.undo();
  assert.equal(getSharedState().xp, baselineXp + 20);

  // Undo itemA and itemC
  itemA.undo();
  itemC.undo();

  const finalState = getSharedState();
  assert.equal(finalState.xp, baselineXp);
  assert.equal(finalState.tasks.length, baselineState.tasks.length);
  assert.equal(finalState.deadlines.length, baselineState.deadlines.length);
});

test('Store Stress 6: Edge Case - XP Clamping on undo when XP is already 0', () => {
  resetSharedState(ANCHOR);
  updateSharedState((prev) => ({ ...prev, xp: 5 }));

  const item = addQuickTask(createMockPayload());
  assert.equal(getSharedState().xp, 15);

  // Manual reset of XP to 3 before undo
  updateSharedState((prev) => ({ ...prev, xp: 3 }));

  // Undo attempts 3 - 10 = -7, must clamp to 0
  item.undo();
  assert.equal(getSharedState().xp, 0, 'XP must never become negative on undo');
});
