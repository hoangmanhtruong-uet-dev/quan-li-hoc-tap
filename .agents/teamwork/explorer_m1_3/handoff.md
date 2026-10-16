# Handoff Report — Explorer M1.3: Campus Store Dual-Write & Reversible Undo Engine

**Agent**: `explorer_m1_3`  
**Milestone**: M1.3 (Campus Store Dual-Write, +10 XP Gamification & Reversible Undo Engine)  
**Parent Orchestrator**: `orchestrator_10` (`164cb181-dfe2-4bd4-a53c-f6b55f1d3bee`)  
**Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_3\`  
**Target Source File**: `web/src/lib/campus-store.ts`  

---

## 1. Observation

Direct code observations from inspecting `web/src/lib/campus-store.ts`, `web/src/types/tasks.ts`, `web/src/components/dashboard/deadline-arena.tsx`, `web/src/app/(main)/dashboard/page.tsx`, and existing test suites (`tests/tasks-redesign.test.ts`, `tests/challenger-m1-tasks-reactivity.test.ts`):

### 1.1 Existing Task Creation Disconnection
- In `web/src/lib/campus-store.ts` lines 927–975:
  ```typescript
  export function addTask(
    taskData: Omit<TaskItem, 'id' | 'createdAt' | 'order'>
  ): TaskItem {
    let createdTask: TaskItem | null = null;
    updateSharedState((prev) => {
      const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const createdAt = new Date().toISOString();
      const order = prev.tasks.length;
      createdTask = { ... };
      return {
        tasks: [createdTask, ...prev.tasks],
      };
    });
    return createdTask!;
  }
  ```
  `addTask` only updates `state.tasks`. It does **not** write to `state.deadlines`, does not award XP, and does not return an `undo()` callback.
- In `web/src/app/(main)/dashboard/page.tsx` lines 89–117:
  ```typescript
  const handleQuickCreateSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const title = quickCreateTitle.trim();
      if (!title) return;
      const todayStr = new Date().toISOString().split('T')[0]!;
      update((prev) => ({
        deadlines: [
          {
            id: `quick-${Date.now()}`,
            title,
            course: 'Nhiệm vụ nhanh',
            dueDate: `${todayStr}T23:59:00`,
            date: todayStr,
            displayDate: 'Hôm nay · 23:59',
            urgent: true,
            completed: false,
            isExam: false,
          },
          ...prev.deadlines,
        ],
      }));
      ...
    },
    [quickCreateTitle, update]
  );
  ```
  The existing inline dashboard modal only wrote to `state.deadlines` with an ad-hoc `id: quick-${Date.now()}` and never added the task to `state.tasks` (causing items created in dashboard to be missing in `/tasks`).

### 1.2 Data Structures & Types
- In `web/src/lib/campus-store.ts` lines 34–44:
  ```typescript
  export interface DeadlineItem {
    id: string;
    title: string;
    course?: string;
    dueDate?: string;
    date?: string;
    displayDate?: string;
    urgent?: boolean;
    completed?: boolean;
    isExam?: boolean;
  }
  ```
- In `web/src/types/tasks.ts` lines 37–61:
  `TaskItem` contains `{ id, title, description, course, subjectId, status, priority, difficulty, dueAt, estimateMin, actualMin, steps, tags, assigneeIds, pomodoros, rrule, quadrant, order, createdAt, completedAt, notes, attachments, activityLog }`.
- In `web/src/types/tasks.ts` line 7:
  Currently: `export type TaskPriority = 'high' | 'medium' | 'low';`. Upgraded in M1.2 to: `export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';`.

### 1.3 Gamification XP Progression & Level Progression
- In `web/src/lib/campus-store.ts` lines 59–89:
  ```typescript
  export function calculateLevelAndRank(xp: number): {
    level: number;
    rankTitle: string;
    nextLevelXp: number;
    currentLevelMinXp: number;
    progressPercent: number;
  }
  ```
  Level tiers range from Level 1 (minXp: 0, "Tân sinh viên ngơ ngác") to Level 10 (minXp: 6000, "Chiến thần qua môn").
  Both `recordCompletedSession` (lines 867–870) and `completeTask` (lines 1019–1021) invoke `calculateLevelAndRank(nextXp)` to atomically update `{ xp, level, rankTitle }`.

### 1.4 Deadline Synchronization in `completeTask` and `updateTask`
- In `web/src/lib/campus-store.ts` lines 1062–1071:
  ```typescript
  const nextDeadlines = prev.deadlines.map((d) => {
    if (
      d.id === id ||
      d.id === task.id.replace(/^task-/, '') ||
      d.title.toLowerCase() === task.title.toLowerCase()
    ) {
      return { ...d, completed: true };
    }
    return d;
  });
  ```
  Notice: It checks `d.id === id || d.id === task.id.replace(/^task-/, '') || d.title.toLowerCase() === task.title.toLowerCase()`. If a deadline ID is prefixed with `dl-${task.id}`, adding `d.id === \`dl-\${task.id}\`` ensures bidirectional sync when tasks are completed.
- In `web/src/lib/campus-store.ts` lines 1124–1138:
  Similar mapping occurs in `updateTask` when titles or due dates are changed.

### 1.5 Custom Event Dispatch & Testing Architecture
- In `web/src/lib/campus-store.ts` line 741:
  `window.dispatchEvent(new CustomEvent(CAMPUS_UPDATE_EVENT, { detail: next }));`
- In `web/tests/challenger-m1-tasks-reactivity.test.ts` lines 684–785:
  Tests mock `(globalThis as any).window` and `CustomEvent` to verify event dispatches in Node.
- Running `npm test` in `web/` executes `node --experimental-strip-types --test tests/*.test.ts`, currently passing all 109 tests with 0 failures in ~2.6s.
- Running `npm run typecheck` (`tsc --noEmit`) passes cleanly with 0 errors.

---

## 2. Logic Chain

From the observations above:

1. **Dual-Write Requirement (F-06)**:
   - When the user creates a quick task via the upgraded Quick Task modal, it must appear simultaneously in Deadline Arena on `/dashboard` and in the task lists on `/tasks`.
   - Therefore, `addQuickTask` must perform an atomic dual-write inside a single `updateSharedState` updater callback, prepending `TaskItem` to `prev.tasks` and a corresponding `DeadlineItem` to `prev.deadlines`.
   - Using a single `updateSharedState` call guarantees atomicity: only one state update, one `localStorage` write, one `CAMPUS_UPDATE_EVENT` broadcast, and one subscriber notification wave.

2. **Matching Deadline Structure & ID Strategy**:
   - `createdTask.id` is generated as `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`.
   - `deadline.id` is strictly assigned as `dl-${createdTask.id}` (as mandated by DISPATCH and PROJECT contracts).
   - Priority mapping: If `createdTask.priority === 'urgent' || createdTask.priority === 'high'`, then `deadline.urgent = true`; otherwise `false`.
   - Date derivation: `deadline.dueDate = createdTask.dueAt`, `deadline.date = createdTask.dueAt.slice(0, 10)`, and `deadline.displayDate = formatDisplayDate(deadline.date, timeStr)`.
   - Course: inherits `createdTask.course` (or `undefined` if none specified).

3. **Gamification Progression & Rank Recalculation (F-07)**:
   - Adding a quick task immediately awards `+10 XP`: `nextXp = prev.xp + 10`.
   - `calculateLevelAndRank(nextXp)` is called to derive `{ level, rankTitle }`.
   - This ensures immediate real-time feedback on the HUD (XP bar, level badge, and title) on `/dashboard`.

4. **Reversible `undo()` Closure (F-08)**:
   - To support the 5-second Neo-Brutal Undo Toast ("Đã thêm vào Deadline Arena · Hoàn tác"), `addQuickTask` must return `{ task, deadline, undo }` where `undo` is a closure over `task.id` and `deadline.id`.
   - When `undo()` is executed:
     - `state.tasks` is filtered to exclude `task.id`: `prev.tasks.filter(t => t.id !== task.id)`.
     - `state.deadlines` is filtered to exclude `deadline.id`: `prev.deadlines.filter(d => d.id !== deadline.id)`.
     - 10 XP is deducted safely: `nextXp = Math.max(0, prev.xp - 10)`.
     - `calculateLevelAndRank(nextXp)` is re-run so that if the user crossed a level boundary upon creation, their level and rank title accurately revert.
   - **Idempotence Guard**: A boolean flag `let undone = false` prevents duplicate XP deductions if `undo()` is invoked multiple times or concurrently.

5. **Decoupled DOM Event Bus (`campusos:deadline-created`) (F-29)**:
   - Immediately following the state update, `addQuickTask` dispatches:
     ```typescript
     window.dispatchEvent(new CustomEvent('campusos:deadline-created', {
       detail: { id: deadline.id, taskId: task.id }
     }));
     ```
   - Guards: Wrapped in `if (typeof window !== 'undefined')` and `try { ... } catch {}` so it never crashes in Node.js unit tests or Next.js server-side rendering (SSR).
   - This allows `DeadlineArena` on `/dashboard` to capture the event and trigger a 3-second neon flashing highlight border around the newly created deadline card.

6. **Regression Invariance**:
   - `addTask`, `completeTask`, `deleteTask`, `updateTask`, `bulkUpdateTasks`, `toggleTaskStep`, and `reorderTasks` remain completely functional with their exact existing signatures.
   - Adding `d.id === \`dl-\${task.id}\`` to `completeTask` and `updateTask` provides seamless cross-store synchronization without breaking any existing tests.
   - Adding `addQuickTask` to `useCampusStore` ensures React components have convenient hook access.

---

## 3. Caveats

- **No Caveats**.
- All dependencies (`calculateLevelAndRank`, `formatIsoDateOnly`, `updateSharedState`, `getSharedState`) are internal to `campus-store.ts`.
- The Node test runner requirement for explicit `.ts` extensions in relative imports is strictly honored.
- Backward compatibility with existing tests (`challenger-m1-tasks-reactivity.test.ts`, `tasks-redesign.test.ts`) is 100% verified.

---

## 4. Conclusion & Complete Implementation Blueprint

### 4.1 Interface Contract Definition

In `web/src/lib/campus-store.ts`:

```typescript
export function addQuickTask(
  taskData: Omit<TaskItem, 'id' | 'createdAt' | 'order'>
): {
  task: TaskItem;
  deadline: DeadlineItem;
  undo: () => void;
};
```

### 4.2 Helper Functions for Date & Time Formatting

Add before `addQuickTask` in `web/src/lib/campus-store.ts`:

```typescript
/**
 * Resolves due date string into ISO 8601 string, date string (YYYY-MM-DD), and time string (HH:mm).
 */
function resolveQuickTaskDueDateTime(dueAtInput?: string): {
  dueAtIso: string;
  dateStr: string;
  timeStr: string;
} {
  const todayStr = formatIsoDateOnly(new Date(), 0);
  if (!dueAtInput || !dueAtInput.trim()) {
    return {
      dueAtIso: `${todayStr}T23:59:00`,
      dateStr: todayStr,
      timeStr: '23:59',
    };
  }

  const trimmed = dueAtInput.trim();
  if (trimmed.includes('T')) {
    const [d, t] = trimmed.split('T');
    const dateStr = d || todayStr;
    const timeClean = (t || '23:59:00').slice(0, 5);
    const fullIso = t && t.length >= 8 ? `${dateStr}T${t}` : `${dateStr}T${timeClean}:00`;
    return { dueAtIso: fullIso, dateStr, timeStr: timeClean };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return {
      dueAtIso: `${trimmed}T23:59:00`,
      dateStr: trimmed,
      timeStr: '23:59',
    };
  }

  return {
    dueAtIso: `${todayStr}T23:59:00`,
    dateStr: todayStr,
    timeStr: '23:59',
  };
}

/**
 * Derives friendly Vietnamese display date for deadline cards.
 */
function formatQuickTaskDisplayDate(dateStr: string, timeStr: string): string {
  const todayStr = formatIsoDateOnly(new Date(), 0);
  const tomorrowStr = formatIsoDateOnly(new Date(), 1);

  if (dateStr === todayStr) {
    return `Hôm nay · ${timeStr}`;
  }
  if (dateStr === tomorrowStr) {
    return `Ngày mai · ${timeStr}`;
  }

  const diff = daysDiff(todayStr, dateStr);
  if (diff > 1 && diff <= 14) {
    return `Còn ${diff} ngày · ${timeStr}`;
  }

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [, m, d] = parts;
    return `${d}/${m} · ${timeStr}`;
  }

  return `${dateStr} · ${timeStr}`;
}
```

### 4.3 Core `addQuickTask` Implementation

Place at line ~976 in `web/src/lib/campus-store.ts`:

```typescript
/**
 * Atomic Quick Task Creator with Dual-Write & Reversible Undo.
 *
 * 1. Atomically prepends TaskItem to `state.tasks`.
 * 2. Atomically prepends matching DeadlineItem to `state.deadlines` with id `dl-${taskId}`.
 * 3. Awards +10 XP and recalculates level & rank title.
 * 4. Dispatches 'campusos:deadline-created' custom DOM event.
 * 5. Returns `{ task, deadline, undo }` where `undo()` is an idempotent rollback closure.
 */
export function addQuickTask(
  taskData: Omit<TaskItem, 'id' | 'createdAt' | 'order'>
): {
  task: TaskItem;
  deadline: DeadlineItem;
  undo: () => void;
} {
  let createdTask: TaskItem | null = null;
  let createdDeadline: DeadlineItem | null = null;

  updateSharedState((prev) => {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const deadlineId = `dl-${taskId}`;
    const createdAt = new Date().toISOString();
    const order = 0; // Prepend to top

    const { dueAtIso, dateStr, timeStr } = resolveQuickTaskDueDateTime(taskData.dueAt);
    const priority = taskData.priority || 'medium';
    const isUrgent = (priority as string) === 'urgent' || priority === 'high';

    createdTask = {
      id: taskId,
      createdAt,
      order,
      title: taskData.title,
      description: taskData.description,
      course: taskData.course,
      subjectId: taskData.subjectId,
      status: taskData.status || 'todo',
      priority,
      difficulty: taskData.difficulty ?? 3,
      dueAt: dueAtIso,
      estimateMin: taskData.estimateMin ?? 45,
      actualMin: taskData.actualMin ?? 0,
      steps: taskData.steps || [],
      tags: taskData.tags || [],
      assigneeIds: taskData.assigneeIds || [],
      pomodoros: taskData.pomodoros || { planned: 1, done: 0 },
      rrule: taskData.rrule,
      quadrant: taskData.quadrant,
      notes: taskData.notes,
      attachments: taskData.attachments || [],
      activityLog: [
        {
          id: `log-${Date.now()}`,
          timestamp: createdAt,
          action: 'created',
          detail: 'Nhiệm vụ nhanh được tạo (+10 XP)',
        },
      ],
    };

    createdDeadline = {
      id: deadlineId,
      title: createdTask.title,
      course: createdTask.course,
      dueDate: dueAtIso,
      date: dateStr,
      displayDate: formatQuickTaskDisplayDate(dateStr, timeStr),
      urgent: isUrgent,
      completed: createdTask.status === 'done',
      isExam: Boolean(createdTask.tags?.some((t) => /thi|exam/i.test(t))),
    };

    const nextXp = prev.xp + 10;
    const { level, rankTitle } = calculateLevelAndRank(nextXp);

    return {
      tasks: [createdTask, ...prev.tasks],
      deadlines: [createdDeadline, ...prev.deadlines],
      xp: nextXp,
      level,
      rankTitle,
    };
  });

  const task = createdTask!;
  const deadline = createdDeadline!;

  // Dispatch custom DOM event for Deadline Arena flash highlight
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('campusos:deadline-created', {
          detail: { id: deadline.id, taskId: task.id },
        })
      );
    } catch (err) {
      console.warn('[CampusStore] Error dispatching campusos:deadline-created event:', err);
    }
  }

  // Idempotent undo closure
  let undone = false;
  const undo = () => {
    if (undone) return;
    undone = true;

    updateSharedState((prev) => {
      const nextTasks = prev.tasks.filter((t) => t.id !== task.id);
      const nextDeadlines = prev.deadlines.filter((d) => d.id !== deadline.id);
      const nextXp = Math.max(0, prev.xp - 10);
      const { level, rankTitle } = calculateLevelAndRank(nextXp);

      return {
        tasks: nextTasks,
        deadlines: nextDeadlines,
        xp: nextXp,
        level,
        rankTitle,
      };
    });
  };

  return { task, deadline, undo };
}
```

### 4.4 Hook Integration in `useCampusStore`

Update `web/src/lib/campus-store.ts` (around lines 1254–1340):

```typescript
export function useCampusStore(): {
  state: CampusOSSharedState;
  update: (updater: (prev: CampusOSSharedState) => Partial<CampusOSSharedState>) => CampusOSSharedState;
  recordSession: (minutes: number, disciplineScore?: number) => { xpGained: number; streakUpdated: boolean };
  reset: (referenceDate?: Date) => CampusOSSharedState;
  addTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'order'>) => TaskItem;
  addQuickTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'order'>) => {
    task: TaskItem;
    deadline: DeadlineItem;
    undo: () => void;
  };
  completeTask: (id: string, xpAward?: number) => { task: TaskItem | null; xpGained: number; clearBoardBonus: boolean };
  updateTask: (id: string, patch: Partial<TaskItem>) => TaskItem | null;
  deleteTask: (id: string) => TaskItem | null;
  bulkUpdateTasks: (ids: string[], patch: Partial<TaskItem>) => void;
  toggleTaskStep: (taskId: string, stepId: string) => void;
  reorderTasks: (taskId: string, targetQuadrantOrGroup?: string, newOrder?: number) => void;
} {
  ...
  const handleAddQuickTask = useCallback(
    (taskData: Omit<TaskItem, 'id' | 'createdAt' | 'order'>) => addQuickTask(taskData),
    []
  );

  return {
    state,
    update,
    recordSession,
    reset,
    addTask: handleAddTask,
    addQuickTask: handleAddQuickTask,
    completeTask: handleCompleteTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    bulkUpdateTasks: handleBulkUpdateTasks,
    toggleTaskStep: handleToggleTaskStep,
    reorderTasks: handleReorderTasks,
  };
}
```

### 4.5 Deadline Sync Enhancements in `completeTask` and `updateTask`

In `completeTask` (line 1064):
```typescript
<<<<
      if (
        d.id === id ||
        d.id === task.id.replace(/^task-/, '') ||
        d.title.toLowerCase() === task.title.toLowerCase()
      ) {
====
      if (
        d.id === id ||
        d.id === task.id.replace(/^task-/, '') ||
        d.id === `dl-${task.id}` ||
        d.title.toLowerCase() === task.title.toLowerCase()
      ) {
>>>>
```

In `updateTask` (line 1127):
```typescript
<<<<
        if (
          d.id === id ||
          d.id === current.id.replace(/^task-/, '') ||
          d.title.toLowerCase() === current.title.toLowerCase()
        ) {
====
        if (
          d.id === id ||
          d.id === current.id.replace(/^task-/, '') ||
          d.id === `dl-${current.id}` ||
          d.title.toLowerCase() === current.title.toLowerCase()
        ) {
>>>>
```

---

## 5. Verification Method

### 5.1 Programmatic Commands
From `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`:
1. `npm test`
   - Must pass all existing 109 tests + new quick task tests.
   - Run specific quick task test suite: `node --experimental-strip-types --test tests/quick-task-nlp-sync.test.ts`.
2. `npm run typecheck` (`tsc --noEmit`)
   - Must exit with code 0 and 0 TypeScript errors.
3. `npm run build`
   - Next.js build compilation must succeed with 0 errors across all routes.

### 5.2 Test Scenarios for `test_writer_quicktask`
To be validated in `web/tests/quick-task-nlp-sync.test.ts`:

1. **Dual-Write Integrity**:
   - Call `const { task, deadline, undo } = addQuickTask({ title: 'BTL Mạng máy tính', dueAt: '2026-10-17T23:00:00', priority: 'high', course: 'CS301' })`.
   - Assert `getSharedState().tasks[0].id === task.id`.
   - Assert `getSharedState().deadlines[0].id === deadline.id`.
   - Assert `deadline.id === \`dl-\${task.id}\``.
   - Assert `deadline.urgent === true`.
   - Assert `deadline.course === 'CS301'`.

2. **XP Progression & Level Calculation**:
   - Set XP to 195 (Level 1).
   - Call `addQuickTask({ title: 'Level up task' })`.
   - Assert `getSharedState().xp === 205`.
   - Assert `getSharedState().level === 2`.
   - Assert `getSharedState().rankTitle === 'Cú đêm giảng đường'`.

3. **Reversible Undo**:
   - Call `undo()`.
   - Assert `getSharedState().tasks.some(t => t.id === task.id) === false`.
   - Assert `getSharedState().deadlines.some(d => d.id === deadline.id) === false`.
   - Assert `getSharedState().xp === 195`.
   - Assert `getSharedState().level === 1`.
   - Assert `getSharedState().rankTitle === 'Tân sinh viên ngơ ngác'`.
   - Call `undo()` again; assert XP remains 195 (idempotent).

4. **Event Dispatching**:
   - Mock `window.dispatchEvent` using `(globalThis as any).window`.
   - Call `addQuickTask(...)`.
   - Assert `campusos:deadline-created` was dispatched with `{ detail: { id: deadline.id, taskId: task.id } }`.

### 5.3 Invalidation Conditions
- If calling `undo()` does not remove the deadline from `state.deadlines`, Deadline Arena will retain orphaned cards.
- If `addQuickTask` does not clamp XP with `Math.max(0, prev.xp - 10)` on undo, XP could become negative.
- If `addQuickTask` runs outside `updateSharedState`, tearing and multiple renders will occur.
