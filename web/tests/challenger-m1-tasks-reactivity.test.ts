import test from 'node:test';
import assert from 'node:assert/strict';

import type {
  TaskItem,
  TaskPriority,
  EisenhowerQuadrant,
} from '../src/types/tasks.ts';

import {
  createDefaultSharedState,
  getSharedState,
  updateSharedState,
  resetSharedState,
  addTask,
  completeTask,
  updateTask,
  deleteTask,
  bulkUpdateTasks,
  toggleTaskStep,
  reorderTasks,
  formatIsoDateOnly,
  CAMPUS_UPDATE_EVENT,
  CAMPUS_STORAGE_KEY,
  type CampusOSSharedState,
} from '../src/lib/campus-store.ts';

// Deep-freeze utility to aggressively detect in-place mutations
function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}

// Clean slate helper
function setupCleanStore(): CampusOSSharedState {
  const state = resetSharedState();
  // Clear all seeded tasks for controlled test isolation
  const currentTasks = [...getSharedState().tasks];
  for (const t of currentTasks) {
    deleteTask(t.id);
  }
  return getSharedState();
}

// =========================================================================
// SECTION 1: TASK COMPLETION XP & "CLEAR THE BOARD" BONUS
// =========================================================================

test('Milestone 1 Stress: completeTask awards base +20 XP and reflects level/rank progression', () => {
  setupCleanStore();
  const todayStr = formatIsoDateOnly(new Date(), 0);

  // Set predictable starting XP
  updateSharedState(() => ({
    xp: 150,
    level: 1,
    rankTitle: 'Tân sinh viên ngơ ngác',
  }));

  const task = addTask({
    title: 'Học bài kiểm thử base XP',
    dueAt: `${todayStr}T23:59:00`,
    status: 'todo',
    priority: 'high',
    difficulty: 3,
    estimateMin: 30,
    actualMin: 0,
    steps: [{ id: 's1', text: 'Bước 1', done: false }],
    tags: ['Test'],
    pomodoros: { planned: 1, done: 0 },
  });

  // Also add another task due today so clearBoardBonus does NOT fire
  const task2 = addTask({
    title: 'Học bài thứ hai để giữ bảng chưa clear',
    dueAt: `${todayStr}T23:59:00`,
    status: 'todo',
    priority: 'medium',
    difficulty: 2,
    estimateMin: 30,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  const xpBefore = getSharedState().xp;
  const result = completeTask(task.id);

  assert.ok(result.task);
  assert.equal(result.task.status, 'done');
  assert.equal(result.clearBoardBonus, false, 'Clear board bonus should NOT fire when task2 is still todo');
  assert.equal(result.xpGained, 20, 'Default base XP award must be exactly +20');

  const afterState = getSharedState();
  assert.equal(afterState.xp, xpBefore + 20);
  // 150 + 20 = 170 (still level 1)
  assert.equal(afterState.level, 1);

  // Now complete with custom xpAward
  const customTask = addTask({
    title: 'Học bài với custom XP award',
    dueAt: `${todayStr}T23:59:00`,
    status: 'todo',
    priority: 'high',
    difficulty: 4,
    estimateMin: 45,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  const customResult = completeTask(customTask.id, 40);
  assert.equal(customResult.clearBoardBonus, false);
  assert.equal(customResult.xpGained, 40);
  assert.equal(getSharedState().xp, 170 + 40); // 210 -> Level 2
  assert.equal(getSharedState().level, 2);
  assert.equal(getSharedState().rankTitle, 'Cú đêm giảng đường');
});

test('Milestone 1 Stress: completeTask on invalid ID or already done task awards 0 XP', () => {
  setupCleanStore();

  const xpBefore = getSharedState().xp;

  // 1. Non-existent task
  const invalidResult = completeTask('non-existent-task-id-999');
  assert.equal(invalidResult.task, null);
  assert.equal(invalidResult.xpGained, 0);
  assert.equal(invalidResult.clearBoardBonus, false);
  assert.equal(getSharedState().xp, xpBefore, 'Store XP must not change on invalid task ID');

  // 2. Already completed task
  const task = addTask({
    title: 'Task đã hoàn thành',
    dueAt: '2026-10-14T10:00:00',
    status: 'todo',
    priority: 'low',
    difficulty: 1,
    estimateMin: 15,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  const res1 = completeTask(task.id, 20);
  assert.equal(res1.xpGained, 20);
  const xpAfterFirst = getSharedState().xp;

  // Complete again
  const res2 = completeTask(task.id, 20);
  assert.equal(res2.xpGained, 0, 'Re-completing done task must award 0 XP');
  assert.equal(res2.clearBoardBonus, false);
  assert.equal(getSharedState().xp, xpAfterFirst, 'Store XP must not increment on re-completion');
});

test('Milestone 1 Stress: "Clear the Board" bonus (+50 XP) fires ONLY on last today task and not repeatedly', () => {
  setupCleanStore();
  const todayStr = formatIsoDateOnly(new Date(), 0);
  const tomorrowStr = formatIsoDateOnly(new Date(), 1);

  // Create 3 tasks due today: T1, T2, T3
  const t1 = addTask({
    title: 'Việc hôm nay 1',
    dueAt: `${todayStr}T10:00:00`,
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
    dueAt: `${todayStr}T14:00:00`,
    status: 'todo',
    priority: 'medium',
    difficulty: 2,
    estimateMin: 40,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });
  const t3 = addTask({
    title: 'Việc hôm nay 3',
    dueAt: `${todayStr}T20:00:00`,
    status: 'todo',
    priority: 'high',
    difficulty: 4,
    estimateMin: 50,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  // Also create a task due tomorrow (should never trigger today's clear board)
  const tTomorrow = addTask({
    title: 'Việc ngày mai',
    dueAt: `${tomorrowStr}T10:00:00`,
    status: 'todo',
    priority: 'medium',
    difficulty: 2,
    estimateMin: 30,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  const xpBaseline = getSharedState().xp;

  // Step 1: Complete T1 (2 incomplete tasks remaining today)
  const res1 = completeTask(t1.id, 20);
  assert.equal(res1.clearBoardBonus, false, 'T1: not the last task today');
  assert.equal(res1.xpGained, 20);
  assert.equal(getSharedState().xp, xpBaseline + 20);

  // Step 2: Complete T2 (1 incomplete task remaining today)
  const res2 = completeTask(t2.id, 20);
  assert.equal(res2.clearBoardBonus, false, 'T2: not the last task today');
  assert.equal(res2.xpGained, 20);
  assert.equal(getSharedState().xp, xpBaseline + 40);

  // Step 3: Complete T3 (the LAST incomplete task due today)
  const res3 = completeTask(t3.id, 20);
  assert.equal(res3.clearBoardBonus, true, 'T3: last task due today, MUST trigger Clear the Board bonus');
  assert.equal(res3.xpGained, 70, 'Must award 20 base + 50 bonus = 70 XP');
  assert.equal(getSharedState().xp, xpBaseline + 110, 'Total XP must be +110');
  assert.ok(getSharedState().badges.includes('clear-the-board'), 'Must unlock clear-the-board badge');

  // Step 4: Complete tomorrow task -> verify Clear the Board does NOT fire again
  const resTomorrow = completeTask(tTomorrow.id, 20);
  assert.equal(resTomorrow.clearBoardBonus, false, 'Tomorrow task must NOT trigger Clear the Board bonus');
  assert.equal(resTomorrow.xpGained, 20);
  assert.equal(getSharedState().xp, xpBaseline + 130);

  // Step 5: Re-complete T3 -> verify no repeated bonus
  const resReComplete = completeTask(t3.id, 20);
  assert.equal(resReComplete.clearBoardBonus, false);
  assert.equal(resReComplete.xpGained, 0);
  assert.equal(getSharedState().xp, xpBaseline + 130);
});

test('Milestone 1 Stress: Single task due today awards Clear the Board immediately', () => {
  setupCleanStore();
  const todayStr = formatIsoDateOnly(new Date(), 0);

  const singleTask = addTask({
    title: 'Việc duy nhất hôm nay',
    dueAt: `${todayStr}T18:00:00`,
    status: 'todo',
    priority: 'high',
    difficulty: 3,
    estimateMin: 25,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  const xpBefore = getSharedState().xp;
  const res = completeTask(singleTask.id, 20);
  assert.equal(res.clearBoardBonus, true, 'Single task due today must clear the board immediately');
  assert.equal(res.xpGained, 70);
  assert.equal(getSharedState().xp, xpBefore + 70);
});

test('Milestone 1 Adversarial Challenge: Adding another task today after clearing board triggers repeated bonus (Exploit Check)', () => {
  setupCleanStore();
  const todayStr = formatIsoDateOnly(new Date(), 0);

  // 1. Initial task clears board
  const task1 = addTask({
    title: 'Task 1 hôm nay',
    dueAt: `${todayStr}T12:00:00`,
    status: 'todo',
    priority: 'low',
    difficulty: 1,
    estimateMin: 10,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  const res1 = completeTask(task1.id, 20);
  assert.equal(res1.clearBoardBonus, true, 'First clearance awards bonus');
  assert.equal(res1.xpGained, 70);

  // 2. User adds another task due today AFTER clearing board
  const task2 = addTask({
    title: 'Task 2 bổ sung hôm nay',
    dueAt: `${todayStr}T15:00:00`,
    status: 'todo',
    priority: 'low',
    difficulty: 1,
    estimateMin: 10,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  // 3. User completes task2
  const res2 = completeTask(task2.id, 20);

  // Check if store allows multiple clearBoardBonus on the same calendar day:
  // In the current implementation, because there is no `clearedBoardDate` guard,
  // `clearBoardBonus` evaluates true again because all current today's tasks are done.
  // We document this empirical reality:
  assert.equal(
    res2.clearBoardBonus,
    true,
    'EMPIRICAL FINDING: completeTask fires clearBoardBonus again if a new today task is added and completed'
  );
  assert.equal(res2.xpGained, 70);
});

test('Milestone 1 Stress: completeTask synchronizes matching deadlines and marks subtask steps done', () => {
  setupCleanStore();
  const todayStr = formatIsoDateOnly(new Date(), 0);

  // Seed a matching deadline
  updateSharedState(() => ({
    deadlines: [
      {
        id: 'dl-project',
        title: 'Báo cáo đồ án mạng',
        dueDate: `${todayStr}T23:59:00`,
        completed: false,
      },
      {
        id: 'dl-other',
        title: 'Đề tài khác không khớp',
        dueDate: `${todayStr}T23:59:00`,
        completed: false,
      },
    ],
  }));

  const task = addTask({
    title: 'Báo cáo đồ án mạng', // Title matches dl-project
    dueAt: `${todayStr}T23:59:00`,
    status: 'todo',
    priority: 'high',
    difficulty: 4,
    estimateMin: 60,
    actualMin: 0,
    steps: [
      { id: 's1', text: 'Step 1', done: false },
      { id: 's2', text: 'Step 2', done: true },
      { id: 's3', text: 'Step 3', done: false },
    ],
    tags: [],
    pomodoros: { planned: 2, done: 0 },
  });

  const res = completeTask(task.id);
  assert.ok(res.task);
  assert.equal(res.task.status, 'done');
  assert.ok(res.task.completedAt, 'completedAt timestamp must be set');
  // All steps must be done
  assert.ok(res.task.steps.every((s) => s.done), 'All subtask steps must be marked done: true');

  // Deadlines check
  const deadlines = getSharedState().deadlines;
  const matched = deadlines.find((d) => d.id === 'dl-project')!;
  const unmatched = deadlines.find((d) => d.id === 'dl-other')!;
  assert.equal(matched.completed, true, 'Matching deadline must be marked completed');
  assert.equal(unmatched.completed, false, 'Unmatched deadline must remain incomplete');
});

// =========================================================================
// SECTION 2: STREAK CALCULATION UNDER TASK COMPLETIONS
// =========================================================================

test('Milestone 1 Stress: Streak remains invariant when completing multiple tasks on the same day', () => {
  setupCleanStore();
  const todayStr = formatIsoDateOnly(new Date(), 0);

  // User has already studied today (streak = 15, lastStudyDate = today)
  updateSharedState(() => ({
    streak: 15,
    lastStudyDate: todayStr,
    streakFreezes: 2,
  }));

  const t1 = addTask({ title: 'Task 1', dueAt: `${todayStr}T10:00:00`, status: 'todo', priority: 'medium', difficulty: 2, estimateMin: 20, actualMin: 0, steps: [], tags: [], pomodoros: { planned: 1, done: 0 } });
  const t2 = addTask({ title: 'Task 2', dueAt: `${todayStr}T11:00:00`, status: 'todo', priority: 'medium', difficulty: 2, estimateMin: 20, actualMin: 0, steps: [], tags: [], pomodoros: { planned: 1, done: 0 } });
  const t3 = addTask({ title: 'Task 3', dueAt: `${todayStr}T12:00:00`, status: 'todo', priority: 'medium', difficulty: 2, estimateMin: 20, actualMin: 0, steps: [], tags: [], pomodoros: { planned: 1, done: 0 } });

  completeTask(t1.id);
  assert.equal(getSharedState().streak, 15, 'Streak must stay 15 after task 1 on same day');

  completeTask(t2.id);
  assert.equal(getSharedState().streak, 15, 'Streak must stay 15 after task 2 on same day');

  completeTask(t3.id);
  assert.equal(getSharedState().streak, 15, 'Streak must stay 15 after task 3 on same day');
  assert.equal(getSharedState().lastStudyDate, todayStr);
  assert.equal(getSharedState().streakFreezes, 2);
});

test('Milestone 1 Stress: Consecutive day task completion increments streak by 1 and freezes stay intact', () => {
  setupCleanStore();
  const todayStr = formatIsoDateOnly(new Date(), 0);
  const yesterdayStr = formatIsoDateOnly(new Date(), -1);

  updateSharedState(() => ({
    streak: 15,
    lastStudyDate: yesterdayStr,
    streakFreezes: 2,
  }));

  const task = addTask({
    title: 'Task sang ngày mới',
    dueAt: `${todayStr}T10:00:00`,
    status: 'todo',
    priority: 'high',
    difficulty: 3,
    estimateMin: 30,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  completeTask(task.id);
  const state = getSharedState();
  assert.equal(state.streak, 16, 'Streak must increment from 15 to 16 on next day completion');
  assert.equal(state.streakFreezes, 2, 'Streak freezes must remain intact');
  assert.equal(state.lastStudyDate, todayStr, 'lastStudyDate must update to today');
});

test('Milestone 1 Stress: 2-day gap with freeze available preserves streak and consumes freeze', () => {
  setupCleanStore();
  const todayStr = formatIsoDateOnly(new Date(), 0);
  const twoDaysAgoStr = formatIsoDateOnly(new Date(), -2);

  updateSharedState(() => ({
    streak: 10,
    lastStudyDate: twoDaysAgoStr,
    streakFreezes: 1,
  }));

  const task = addTask({
    title: 'Task sau 1 ngày vắng mặt',
    dueAt: `${todayStr}T10:00:00`,
    status: 'todo',
    priority: 'medium',
    difficulty: 2,
    estimateMin: 20,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  completeTask(task.id);
  const state = getSharedState();
  assert.equal(state.streak, 11, 'Streak increments with freeze shield');
  assert.equal(state.streakFreezes, 0, '1 freeze consumed (1 -> 0)');
  assert.equal(state.lastStudyDate, todayStr);
});

test('Milestone 1 Stress: 2-day gap without freeze breaks streak and resets to 1', () => {
  setupCleanStore();
  const todayStr = formatIsoDateOnly(new Date(), 0);
  const twoDaysAgoStr = formatIsoDateOnly(new Date(), -2);

  updateSharedState(() => ({
    streak: 20,
    lastStudyDate: twoDaysAgoStr,
    streakFreezes: 0, // No freezes!
  }));

  const task = addTask({
    title: 'Task sau khi mất streak',
    dueAt: `${todayStr}T10:00:00`,
    status: 'todo',
    priority: 'medium',
    difficulty: 2,
    estimateMin: 20,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  completeTask(task.id);
  const state = getSharedState();
  assert.equal(state.streak, 1, 'Streak must reset to 1 when gap is 2 days and 0 freezes');
  assert.equal(state.lastStudyDate, todayStr);
});

test('Milestone 1 Stress: Streak reaching 14 unlocks streak-14 badge', () => {
  setupCleanStore();
  const todayStr = formatIsoDateOnly(new Date(), 0);
  const yesterdayStr = formatIsoDateOnly(new Date(), -1);

  updateSharedState(() => ({
    streak: 13,
    lastStudyDate: yesterdayStr,
    streakFreezes: 1,
    badges: ['streak-7'],
  }));

  const task = addTask({
    title: 'Task cán mốc 14 ngày',
    dueAt: `${todayStr}T10:00:00`,
    status: 'todo',
    priority: 'high',
    difficulty: 3,
    estimateMin: 20,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  completeTask(task.id);
  const state = getSharedState();
  assert.equal(state.streak, 14);
  assert.ok(state.badges.includes('streak-14'), 'Must award streak-14 badge');
});

// =========================================================================
// SECTION 3: STORE IMMUTABILITY & DEEP-FREEZE VERIFICATION
// =========================================================================

test('Milestone 1 Stress: Deep-freeze immutability across addTask, updateTask, toggleTaskStep, reorderTasks, bulkUpdateTasks, completeTask, deleteTask', () => {
  setupCleanStore();

  // 1. addTask on frozen state
  deepFreeze(getSharedState());
  let addedTask: TaskItem | null = null;
  assert.doesNotThrow(() => {
    addedTask = addTask({
      title: 'Task Immutability Check',
      dueAt: '2026-10-15T10:00:00',
      status: 'todo',
      priority: 'high',
      difficulty: 3,
      estimateMin: 45,
      actualMin: 0,
      steps: [
        { id: 'step-1', text: 'Step One', done: false },
        { id: 'step-2', text: 'Step Two', done: false },
      ],
      tags: ['Test'],
      pomodoros: { planned: 2, done: 0 },
      quadrant: 'do_first',
    });
  }, 'addTask must not mutate frozen state');

  assert.ok(addedTask);
  const stateAfterAdd = getSharedState();

  // 2. updateTask on frozen state
  deepFreeze(stateAfterAdd);
  let updatedTask: TaskItem | null = null;
  assert.doesNotThrow(() => {
    updatedTask = updateTask(addedTask!.id, {
      title: 'Task Immutability Check (Updated)',
      priority: 'low',
    });
  }, 'updateTask must not mutate frozen state');

  assert.ok(updatedTask);
  assert.equal(updatedTask!.title, 'Task Immutability Check (Updated)');
  assert.equal(updatedTask!.priority, 'low');
  // Check that old task object reference was NOT mutated
  assert.equal(addedTask!.title, 'Task Immutability Check', 'Original task object must remain untouched');

  // 3. toggleTaskStep on frozen state
  const stateAfterUpdate = getSharedState();
  deepFreeze(stateAfterUpdate);
  assert.doesNotThrow(() => {
    toggleTaskStep(addedTask!.id, 'step-1');
  }, 'toggleTaskStep must not mutate frozen state');

  const stateAfterStep = getSharedState();
  const toggledTask = stateAfterStep.tasks.find((t) => t.id === addedTask!.id)!;
  assert.equal(toggledTask.steps[0]!.done, true);
  // Verify previous step object is still done: false
  assert.equal(updatedTask!.steps[0]!.done, false, 'Previous task steps must not be mutated in-place');

  // 4. reorderTasks on frozen state
  deepFreeze(stateAfterStep);
  assert.doesNotThrow(() => {
    reorderTasks(addedTask!.id, 'schedule', 5);
  }, 'reorderTasks must not mutate frozen state');

  const stateAfterReorder = getSharedState();
  const reorderedTask = stateAfterReorder.tasks.find((t) => t.id === addedTask!.id)!;
  assert.equal(reorderedTask.quadrant, 'schedule');
  assert.equal(reorderedTask.order, 5);

  // 5. bulkUpdateTasks on frozen state
  deepFreeze(stateAfterReorder);
  assert.doesNotThrow(() => {
    bulkUpdateTasks([addedTask!.id], { difficulty: 5 });
  }, 'bulkUpdateTasks must not mutate frozen state');

  const stateAfterBulk = getSharedState();
  const bulkTask = stateAfterBulk.tasks.find((t) => t.id === addedTask!.id)!;
  assert.equal(bulkTask.difficulty, 5);

  // 6. completeTask on frozen state
  deepFreeze(stateAfterBulk);
  let completeResult: any = null;
  assert.doesNotThrow(() => {
    completeResult = completeTask(addedTask!.id);
  }, 'completeTask must not mutate frozen state');

  assert.ok(completeResult.task);
  assert.equal(completeResult.task.status, 'done');

  // 7. deleteTask on frozen state
  const stateAfterComplete = getSharedState();
  deepFreeze(stateAfterComplete);
  let deleted: TaskItem | null = null;
  assert.doesNotThrow(() => {
    deleted = deleteTask(addedTask!.id);
  }, 'deleteTask must not mutate frozen state');

  assert.ok(deleted);
  assert.equal(deleted!.id, addedTask!.id);
  const stateAfterDelete = getSharedState();
  assert.equal(stateAfterDelete.tasks.some((t) => t.id === addedTask!.id), false);
});

test('Milestone 1 Stress: Reference integrity - state and collections clone on mutation', () => {
  setupCleanStore();

  const state0 = getSharedState();
  const tasks0 = state0.tasks;

  const t = addTask({
    title: 'Ref Task',
    dueAt: '2026-10-15T10:00:00',
    status: 'todo',
    priority: 'medium',
    difficulty: 3,
    estimateMin: 30,
    actualMin: 0,
    steps: [],
    tags: [],
    pomodoros: { planned: 1, done: 0 },
  });

  const state1 = getSharedState();
  assert.notEqual(state0, state1, 'Shared state object must be a new reference');
  assert.notEqual(tasks0, state1.tasks, 'tasks array must be a new reference');

  const tasks1 = state1.tasks;
  updateTask(t.id, { title: 'Ref Task Modified' });

  const state2 = getSharedState();
  assert.notEqual(state1, state2);
  assert.notEqual(tasks1, state2.tasks);
  assert.notEqual(tasks1[0], state2.tasks[0], 'Updated task element must be a new object reference');
});

// =========================================================================
// SECTION 4: SUBSCRIBER DISPATCH & EVENT NOTIFICATION
// =========================================================================

test('Milestone 1 Stress: Browser window CustomEvent dispatches on all store actions', () => {
  setupCleanStore();

  const dispatchedEvents: Array<{ type: string; detail: CampusOSSharedState }> = [];

  // Mock browser environment
  const originalWindow = (globalThis as any).window;
  const originalCustomEvent = (globalThis as any).CustomEvent;

  (globalThis as any).CustomEvent = class MockCustomEvent {
    type: string;
    detail: any;
    constructor(type: string, init?: { detail?: any }) {
      this.type = type;
      this.detail = init?.detail;
    }
  };

  (globalThis as any).window = {
    localStorage: {
      getItem: () => null,
      setItem: () => {},
    },
    dispatchEvent: (event: any) => {
      dispatchedEvents.push({ type: event.type, detail: event.detail });
      return true;
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  try {
    // 1. addTask
    const t = addTask({
      title: 'Event test task',
      dueAt: '2026-10-15',
      status: 'todo',
      priority: 'low',
      difficulty: 1,
      estimateMin: 15,
      actualMin: 0,
      steps: [{ id: 's1', text: 'Step 1', done: false }],
      tags: [],
      pomodoros: { planned: 1, done: 0 },
    });
    assert.ok(dispatchedEvents.some((e) => e.type === CAMPUS_UPDATE_EVENT), 'addTask must dispatch CAMPUS_UPDATE_EVENT');
    dispatchedEvents.length = 0;

    // 2. updateTask
    updateTask(t.id, { title: 'Event test task updated' });
    assert.equal(dispatchedEvents.length, 1);
    assert.equal(dispatchedEvents[0]!.type, CAMPUS_UPDATE_EVENT);
    dispatchedEvents.length = 0;

    // 3. toggleTaskStep
    toggleTaskStep(t.id, 's1');
    assert.equal(dispatchedEvents.length, 1);
    assert.equal(dispatchedEvents[0]!.type, CAMPUS_UPDATE_EVENT);
    dispatchedEvents.length = 0;

    // 4. reorderTasks
    reorderTasks(t.id, 'do_first', 2);
    assert.equal(dispatchedEvents.length, 1);
    assert.equal(dispatchedEvents[0]!.type, CAMPUS_UPDATE_EVENT);
    dispatchedEvents.length = 0;

    // 5. bulkUpdateTasks
    bulkUpdateTasks([t.id], { priority: 'high' });
    assert.equal(dispatchedEvents.length, 1);
    assert.equal(dispatchedEvents[0]!.type, CAMPUS_UPDATE_EVENT);
    dispatchedEvents.length = 0;

    // 6. completeTask
    completeTask(t.id);
    assert.equal(dispatchedEvents.length, 1);
    assert.equal(dispatchedEvents[0]!.type, CAMPUS_UPDATE_EVENT);
    dispatchedEvents.length = 0;

    // 7. deleteTask
    deleteTask(t.id);
    assert.equal(dispatchedEvents.length, 1);
    assert.equal(dispatchedEvents[0]!.type, CAMPUS_UPDATE_EVENT);
    dispatchedEvents.length = 0;

    // 8. resetSharedState
    resetSharedState();
    assert.equal(dispatchedEvents.length, 1);
    assert.equal(dispatchedEvents[0]!.type, CAMPUS_UPDATE_EVENT);
  } finally {
    // Restore environment
    if (originalWindow !== undefined) {
      (globalThis as any).window = originalWindow;
    } else {
      delete (globalThis as any).window;
    }
    if (originalCustomEvent !== undefined) {
      (globalThis as any).CustomEvent = originalCustomEvent;
    } else {
      delete (globalThis as any).CustomEvent;
    }
  }
});

test('Milestone 1 Architectural Audit: Non-React subscriber limitation documented', async () => {
  // Dynamically inspect campus-store module exports
  const campusStoreModule = await import('../src/lib/campus-store.ts');
  const exportedSymbols = Object.keys(campusStoreModule);

  // Assert expected exports exist
  assert.ok(exportedSymbols.includes('addTask'));
  assert.ok(exportedSymbols.includes('completeTask'));
  assert.ok(exportedSymbols.includes('updateTask'));
  assert.ok(exportedSymbols.includes('deleteTask'));
  assert.ok(exportedSymbols.includes('bulkUpdateTasks'));
  assert.ok(exportedSymbols.includes('toggleTaskStep'));
  assert.ok(exportedSymbols.includes('reorderTasks'));
  assert.ok(exportedSymbols.includes('useCampusStore'));
  assert.ok(exportedSymbols.includes('getSharedState'));
  assert.ok(exportedSymbols.includes('updateSharedState'));

  // CRITICAL ARCHITECTURAL FINDING:
  // The internal `subscribe` function (line 849) passed to `useSyncExternalStore` is NOT exported!
  // This means external non-React services (workers, test harnesses, analytics) cannot subscribe
  // to store changes in a pure Node.js / non-browser environment without mounting a React component
  // or mocking the global `window` object.
  assert.equal(
    exportedSymbols.includes('subscribe'),
    false,
    'ARCHITECTURAL AUDIT: `subscribe` is private to useCampusStore and not exported from campus-store.ts'
  );
});
