# Handoff Report: Reviewer 2 — Milestone 1 (Store, Types & Tasks Engine)

**Author**: Reviewer 2 (`reviewer_m1_2`)  
**Roles**: Reviewer, Adversarial Critic  
**Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\reviewer_m1_2\`  
**Parent Conversation ID**: `d87bbdd2-41e0-4e96-8205-9ea9461c7df0`  
**Timestamp**: 2026-10-13T08:48:00Z  

---

## 1. Observation

### 1.1 Source Files Directly Inspected
1. **`web/src/types/tasks.ts` (81 lines)**:
   - Defines strict union types: `TaskStatus` (`'todo' | 'doing' | 'done'`), `TaskPriority` (`'high' | 'medium' | 'low'`), `EisenhowerQuadrant` (`'do_first' | 'schedule' | 'delegate' | 'eliminate'`), `TaskDateGroupKey` (`'overdue' | 'today' | 'tomorrow' | 'this_week' | 'later' | 'done'`).
   - Defines comprehensive data interfaces: `TaskStep`, `TaskPomodoroInfo`, `TaskAttachment`, `TaskActivityLog`, `TaskItem`, `ParsedTaskResult`, `UrgencyLevel`.
   - All fields from `PROJECT.md` interface contract are present and strictly typed.

2. **`web/src/lib/tasks-engine.ts` (549 lines)**:
   - Implements pure deterministic calculation engine:
     - `daysDifference(dateStrA, dateStrB)`: Computes UTC calendar day difference without daylight savings bugs.
     - `getTaskDateGroup(task, referenceDate)`: Maps tasks to `'done'`, `'overdue'`, `'today'`, `'tomorrow'`, `'this_week'` (Sunday-bounded), or `'later'`.
     - `groupTasksByDate(tasks, referenceDate)`: Partitions task lists into dictionary record of all 6 sticky date groups.
     - `computeEisenhowerQuadrant(task, referenceDate)`: Preserves user manual overrides (`task.quadrant`), categorizes tasks by urgency (<=48h) and importance (high priority, difficulty >= 4, or academic keywords `thi|bài tập lớn|btl|khóa luận|báo cáo|đồ án`).
     - `formatCountdown(dueAt, referenceDate)`: Returns relative overdue strings, day countdowns, or live `HH:MM:SS` when < 24h.
     - `getUrgencyLevel(dueAt, referenceDate)`: Computes color tokens (`lime`, `orange`, `red`), `isPanic` (< 3h), and `isOverdue`.
     - `parseVietnameseTaskInput(rawInput, referenceDate)`: Deterministic multi-pass Vietnamese NLP parser with Unicode regex (`\p{L}`), time extraction (`23h`, `14h30`), duration extraction (`90p`, `1.5h`, `2 tiếng`), priority matching, date extraction (`hôm nay`, `ngày mai`, `thứ 6`, `25/11`), known course matching, and stop-word title cleaning.

3. **`web/src/lib/campus-store.ts` (1341 lines)**:
   - State interface extended with `tasks: TaskItem[]`.
   - `createDefaultSharedState(referenceDate: Date = new Date())`: Seeded 7 tasks with relative offsets (`dayMinus2`, `dayMinus1`, `today`, `dayPlus1`, `dayPlus3`, `dayPlus8`). Zero hardcoded calendar dates.
   - Reactive dispatch actions: `addTask`, `completeTask`, `updateTask`, `deleteTask`, `bulkUpdateTasks`, `toggleTaskStep`, `reorderTasks`.
   - Gamification integration: `completeTask` awards base XP (+20), validates "Clear the Board" (+50 XP bonus when all today's tasks completed), updates level, rank title, streak progression, and synchronizes matching deadlines.
   - React 18 hook: `useCampusStore()` utilizes `useSyncExternalStore` with stable module-level subscriber set and cached snapshot references.

### 1.2 Independent Verification Execution & Results
1. **`npm test` in `web/`**:
   - Command: `node --experimental-strip-types --test tests/*.test.ts`
   - Results: **73 passed, 0 failed, 0 skipped** across all test suites (~376ms).
   - Includes 33 existing tests + 40 tests in `web/tests/tasks-redesign.test.ts`.

2. **`npm run typecheck` in `web/`**:
   - Command: `tsc --noEmit`
   - Results: **Exit code 0, exactly 0 TypeScript errors**.

3. **Integrity Check Scan**:
   - Verified that `parseVietnameseTaskInput` and `computeEisenhowerQuadrant` contain real algorithmic logic rather than hardcoded test string lookups.
   - Verified that `worker_m1_1` made zero modifications to test suites (`git status` confirms tests were written exclusively by `test_writer_e2e_1`).
   - Verified that no facade or mock implementations exist.

---

## 2. Logic Chain

1. **Reactivity & Subscription Architecture**:
   - `useCampusStore` subscribes to the store via `useSyncExternalStore(subscribe, getSharedState, () => createDefaultSharedState())`.
   - `getSharedState()` returns the cached `memoryState` singleton when present. Because reference equality is preserved between non-mutating calls, React 18 concurrent renderers will not encounter tear or infinite render cycles.
   - Every mutation route passes through `updateSharedState()`, which updates `memoryState = next;`, saves to `localStorage`, dispatches `CustomEvent(CAMPUS_UPDATE_EVENT)`, schedules debounced cloud synchronization (`pushToSupabaseCloudDebounced`), and notifies all subscribers via `notifySubscribers()`.
   - Cross-tab changes trigger `window.addEventListener('storage')`, which unpacks new state, updates `memoryState`, and triggers subscribers in all open tabs.

2. **Real System Date Anchoring**:
   - Default parameter `referenceDate: Date = new Date()` in `createDefaultSharedState` anchors all relative dates (`dayMinus2`, `dayMinus1`, `today`, `dayPlus1`, `dayPlus3`, `dayPlus8`) to the current system date.
   - Empirical node execution confirmed:
     - Real run: Seeded tasks produce `dueAt: 2026-10-13T23:59:00` (today).
     - Offset run with `new Date('2027-05-20T10:00:00Z')`: Seeded tasks produce `2027-05-18` (-2), `2027-05-20` (today), `2027-05-21` (+1), `2027-05-23` (+3), `2027-05-28` (+8).
     - Date grouping on seeded tasks yields: `{ overdue: 1, today: 2, tomorrow: 1, this_week: 1, later: 1, done: 1 }`.
     - Eisenhower quadrant calculation on seeded tasks yields: `{ do_first: 2, delegate: 1, schedule: 3, eliminate: 1 }`.
   - Zero hardcoded static dates exist in the task seed generator.

3. **Gamification & Supabase Synchronization**:
   - `completeTask`:
     - Checks whether today's incomplete tasks reach 0. If so, flags `clearBoardBonus: true`, awards `+50 XP` bonus, and adds the `'clear-the-board'` badge.
     - Updates player XP, recalculates level & rank title via `calculateLevelAndRank`, evaluates streak via `calculateStreakOnCheckIn`.
     - Matches and marks corresponding deadlines as `completed: true`.
     - Invokes `pushToSupabaseCloudDebounced(next)` which updates `student_profiles` (XP, level, streak, study minutes) and `student_deadlines`.
     - Prevents double-completion: re-completing an already done task returns early without duplicating XP or bonuses.

---

## 3. Caveats

1. **Supabase Schema Alignment**:
   - Currently, Supabase migrations (`002_dashboard_calendar_sync.sql`) provide tables for `student_profiles`, `student_deadlines`, `student_calendar_events`, and `student_focus_sessions`.
   - Tasks synchronize their completion status and due dates with `student_deadlines` and their gamification progress with `student_profiles`. A standalone `student_tasks` table is not yet present in Supabase migrations; if full multi-device synchronization of task sub-steps and attachments is desired in future milestones, a `003_tasks_schema.sql` migration can be added. This does not block M1.

---

## 4. Conclusion & Verdict

**Verdict**: **APPROVE**

Milestone 1 satisfies all functional, architectural, and quality standards:
- Type safety: 100% compliant with `PROJECT.md` contracts, 0 TypeScript errors.
- Test integrity: All 73 tests pass cleanly without shortcuts or facades.
- State reactivity: Tear-free React 18 `useSyncExternalStore` architecture with full cross-tab and intra-tab synchronization.
- Date dynamism: `createDefaultSharedState` anchors tasks directly to real system time with realistic diversity.
- Gamification sync: Base XP (+20), Clear the Board bonus (+50 XP), badges, streak, level, rank title, and Supabase cloud debounce function cleanly.

---

## 5. Verification Method

To independently reproduce the verification results:

```bash
# 1. Run all unit and integration tests
cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
npm test

# Expected:
# ℹ tests 73
# ℹ pass 73
# ℹ fail 0

# 2. Run TypeScript typecheck
npm run typecheck

# Expected:
# Exit code 0 (no errors)

# 3. Verify dynamic date anchoring in node
node -e "const { createDefaultSharedState } = require('./src/lib/campus-store.ts'); const s = createDefaultSharedState(); console.log('Tasks count:', s.tasks.length, 'Today task:', s.tasks[1].dueAt);"
```

---

## 6. Adversarial Challenge Report

### Challenge Summary
**Overall Risk Assessment**: **LOW**

### Challenges Evaluated & Stress Test Results
1. **Challenge 1: Re-render Loop / Tear-free Concurrency under React 18**:
   - *Attack scenario*: `getSharedState` returns a new object reference on every invocation, triggering an infinite render loop in `useSyncExternalStore`.
   - *Result*: **PASS**. `getSharedState()` returns `memoryState` reference; new object references are only instantiated upon state mutations inside `updateSharedState()`.
2. **Challenge 2: Stale Hardcoded Seed Dates**:
   - *Attack scenario*: `createDefaultSharedState` embeds static dates (e.g. August 2026), causing tasks to be permanently overdue in production.
   - *Result*: **PASS**. All 7 tasks calculate their dates dynamically via `formatIsoDateOnly(referenceDate, offset)`.
3. **Challenge 3: Multi-Pass NLP Parser Input Exploitation**:
   - *Attack scenario*: User enters empty strings, whitespace, non-standard diacritics, or punctuation-only strings (`!@#$%^`), causing regex runtime exceptions.
   - *Result*: **PASS**. Handled gracefully with fallback draft (`'Nhiệm vụ mới'`, confidence: 0.2) without throwing.
4. **Challenge 4: Double-award Exploit on `completeTask`**:
   - *Attack scenario*: Calling `completeTask` repeatedly on an already completed task accumulates infinite XP and streak bonuses.
   - *Result*: **PASS**. Lines 997–1000 check `if (task.status === 'done') return {};`, preventing duplicate rewards.
