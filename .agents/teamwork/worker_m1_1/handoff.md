# Handoff Report: Milestone 1 — Store, Types & Tasks Engine

**Author**: Worker M1 (`worker_m1_1`)  
**Parent Conversation ID**: `d87bbdd2-41e0-4e96-8205-9ea9461c7df0`  
**Timestamp**: 2026-10-13T08:34:00Z  
**Target Path**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1_1\handoff.md`

---

## 1. Observation

### 1.1 Direct File Changes & Additions (Exclusive Ownership Adherence)
1. **`web/src/types/tasks.ts` (created, 68 lines)**:
   - Exported union types:
     - `TaskStatus`: `'todo' | 'doing' | 'done'`
     - `TaskPriority`: `'high' | 'medium' | 'low'`
     - `EisenhowerQuadrant`: `'do_first' | 'schedule' | 'delegate' | 'eliminate'`
     - `TaskDateGroupKey`: `'overdue' | 'today' | 'tomorrow' | 'this_week' | 'later' | 'done'`
   - Exported data structures:
     - `TaskStep`: `{ id: string; text: string; done: boolean; }`
     - `TaskPomodoroInfo`: `{ planned: number; done: number; }`
     - `TaskAttachment`: `{ id: string; name: string; url: string; type?: string; sizeBytes?: number; }`
     - `TaskActivityLog`: `{ id: string; timestamp: string; action: ...; detail?: string; }`
     - `TaskItem`: Full interface matching PROJECT.md interface contract including `quadrant?`, `difficulty`, `estimateMin`, `actualMin`, `pomodoros`, `steps`, `tags`, `activityLog`.
     - `ParsedTaskResult`: Interface for Vietnamese NLP quick-add draft extraction.
     - `UrgencyLevel`: Interface for countdown calculations and color tier tokens.

2. **`web/src/lib/tasks-engine.ts` (created, 458 lines)**:
   - Deterministic pure helper functions accepting optional `referenceDate: Date = new Date()`:
     - `daysDifference(dateStrA: string, dateStrB: string): number`: Calendar day difference.
     - `getTaskDateGroup(task: TaskItem, referenceDate?: Date): TaskDateGroupKey`: Categorizes tasks into `overdue`, `today`, `tomorrow`, `this_week`, `later`, `done` with Sunday week-end boundary.
     - `groupTasksByDate(tasks: TaskItem[], referenceDate?: Date)`: Dictionary map of tasks grouped by date.
     - `computeEisenhowerQuadrant(task: TaskItem, referenceDate?: Date): EisenhowerQuadrant`: Preserves manual overrides; applies urgency (<=48h) and importance heuristic (high priority, difficulty >= 4, or exam/btl/thesis keywords).
     - `formatCountdown(dueAt: string, referenceDate?: Date): string`: Formats overdue text ("Quá hạn X ngày" / "Quá hạn Xh"), day count ("Còn X ngày"), or live "HH:MM:SS" when < 24h.
     - `getUrgencyLevel(dueAt: string, referenceDate?: Date): UrgencyLevel`: Returns `color` ('lime' | 'orange' | 'red'), `isPanic`, `isOverdue`, `hoursRemaining`, `displayCountdown`.
     - `parseVietnameseTaskInput(rawInput: string, referenceDate?: Date): ParsedTaskResult`: Multi-pass regex parser with Unicode safety (`\p{L}`), time-of-day recognition (`23h`, `19h`, `lúc 0h`, `14h30`), duration extraction (`90p`, `1.5h`, `2 tiếng`), priority matching (`ưu tiên cao`, `gấp`, `ưu tiên vừa`, `ưu tiên thấp`), date extraction (`hôm nay`, `ngày mai`, `thứ 6`, `25/11`), known course detection (`Mạng máy tính`, `CTDL & GT`, `Triết học`, `Xác suất`, `Toán rời rạc`), and title cleanup.

3. **`web/src/lib/campus-store.ts` (extended, lines 172, 472–648, 703–708, 826–831, 924–1280)**:
   - `CampusOSSharedState`: Added `tasks: TaskItem[]`.
   - `createDefaultSharedState(referenceDate)`: Seeded 7 default tasks dynamically anchored around `referenceDate` covering all date groups (1 overdue, 1 urgent today, 1 doing today, 1 tomorrow, 1 this week, 1 later, 1 done).
   - `getSharedState()` & storage listener: Safely merged stored tasks with defaults if missing or empty.
   - Reactive Actions:
     - `addTask(taskData)`: Generates unique ID and ISO timestamp, prepends task, updates localStorage, triggers reactive listeners and debounced Supabase sync.
     - `completeTask(id, xpAward = 20)`: Transitions task to `status: 'done'`, sets `completedAt`, checks "Clear the Board" condition (+50 XP bonus if all today's tasks completed), awards badge `'clear-the-board'`, updates level, rank title, streak progression via `calculateStreakOnCheckIn`, synchronizes matching deadlines.
     - `updateTask(id, patch)`: Applies partial updates, records reschedule log if due date changes, syncs matching deadline title/date.
     - `deleteTask(id)`: Removes task and returns deleted object for Undo toast.
     - `bulkUpdateTasks(ids, patch)`: Batch applies updates across multiple tasks.
     - `toggleTaskStep(taskId, stepId)`: Flips checklist step `done` state.
     - `reorderTasks(taskId, targetQuadrantOrGroup?, newOrder?)`: Updates task order and/or quadrant.
   - `useCampusStore()`: Hook updated to expose all 7 task actions wrapped in stable `useCallback` references.

### 1.2 Verification Tool Execution & Outputs
1. **`npm test` in `web/`**:
   ```
   > node --experimental-strip-types --test tests/*.test.ts
   ...
   ✔ Gamification: 10 levels exist and mandatory rank titles match
   ✔ Gamification: Streak and freeze shield rules
   ...
   ✔ Empirical Stress: createDefaultSharedState anchors relative dates dynamically across edge cases
   ✔ Empirical Stress: recordCompletedSession updates XP, Level, and Badges in shared store
   ...
   ✔ Tier 1 - NLP Parser (1/6): parses homework with tomorrow, 23h, 90min, high priority
   ✔ Tier 1 - NLP Parser (2/6): parses exam review with day of week (thứ 6), 19h, toán rời rạc
   ✔ Tier 1 - Eisenhower (2/6): assigns Q1 (do_first) for Urgent (<=48h) & Important (high priority)
   ✔ Tier 1 - Date Grouping (5/6): partitions this_week vs later based on current Sunday
   ✔ Tier 1 - Store Tasks (7/7): completeTask transitions task to done, sets completedAt, and awards XP
   ✔ Tier 4 - Real-World (5/6): "Clear the Board" streak bonus (+50 XP) awarded when all today tasks are completed
   ...
   ℹ tests 73
   ℹ suites 0
   ℹ pass 73
   ℹ fail 0
   ℹ cancelled 0
   ℹ skipped 0
   ℹ todo 0
   ℹ duration_ms 344.8198
   ```
   Command exited with code 0. Zero regressions across all 33 existing tests, plus all 40 tests in `tests/tasks-redesign.test.ts` pass cleanly.

2. **`npm run typecheck` in `web/`**:
   ```
   > tsc --noEmit
   ```
   Command exited with code 0. Exactly 0 TypeScript errors across the entire application.

3. **`git status -s`**:
   Confirmed zero modifications to any test files or UI component files. Only `web/src/types/tasks.ts`, `web/src/lib/tasks-engine.ts`, and `web/src/lib/campus-store.ts` were touched in `web/src`.

---

## 2. Logic Chain

1. **State Persistence & Multi-Page Sync**:
   - `/dashboard` and `/calendar` rely on `campus-store.ts` backed by `localStorage` key `'campusos-shared-v2'`.
   - Extending `CampusOSSharedState` with `tasks: TaskItem[]` and adding reactive dispatch actions ensures that task mutations immediately update all store subscribers, trigger cross-tab storage sync, and trigger debounced sync to Supabase Cloud via `pushToSupabaseCloudDebounced`.
   - Seed data in `createDefaultSharedState(referenceDate)` dynamically calculates offsets relative to `referenceDate` using `formatIsoDateOnly(referenceDate, offset)`. This prevents date staleness while ensuring test repeatability.

2. **NLP Parser Determinism & Regex Disambiguation**:
   - In Vietnamese student expressions, strings like `"23h ngày mai"`, `"lúc 0h"`, `"19h thứ 6"` represent times of day (23:00, 00:00, 19:00), whereas `"90p"`, `"1.5h"`, `"2 tiếng"` represent durations.
   - Parsing time-of-day before generic integer duration matching prevents numbers like `23h` from falsely consuming duration, enabling accurate parsing of compound inputs like `"nộp bài tập mạng 23h ngày mai 90p ưu tiên cao"`.
   - Utilizing Unicode property escapes `\p{L}` and `\p{N}` ensures Vietnamese accented characters (e.g. `ưu`, `thấp`, `tiếng`) match correctly without word-boundary `\b` failures.

3. **Timezone Uniformity**:
   - `dueAt` strings in ISO format without explicit timezone offset (e.g. `2026-10-13T11:00:00`) are parsed using UTC consistency (`Z` anchor) matching test reference anchors (`REF_DATE`), ensuring deterministic urgency calculations across any local host timezone.

---

## 3. Caveats

- **No Caveats**: All requirements from ORIGINAL_REQUEST, PROJECT.md, and DISPATCH.md are fully satisfied. All test suites pass.

---

## 4. Conclusion

Milestone 1 is complete:
- Core types and models are defined in `web/src/types/tasks.ts`.
- Pure deterministic calculation, grouping, urgency, and Vietnamese NLP parsing engine is implemented in `web/src/lib/tasks-engine.ts`.
- Central state store in `web/src/lib/campus-store.ts` is extended with reactive task actions, dynamic relative seed data, Clear the Board bonus, streak progression, and hook exposure.
- Zero TypeScript errors and 100% test pass rate (73/73 passing tests).

Downstream milestones (M2 Quest Board Header, M3 Smart Controls Bar & 4 Views, M4 Detail Drawer & Modals) can directly import these types, engine functions, and store actions.

---

## 5. Verification Method

To independently verify the implementation:
1. Run `npm test` in `web/`:
   ```bash
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm test
   ```
   Confirm output prints `pass 73, fail 0` with exit code 0.

2. Run `npm run typecheck` in `web/`:
   ```bash
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run typecheck
   ```
   Confirm output exits with code 0.

3. Inspect files:
   - `web/src/types/tasks.ts`
   - `web/src/lib/tasks-engine.ts`
   - `web/src/lib/campus-store.ts`
