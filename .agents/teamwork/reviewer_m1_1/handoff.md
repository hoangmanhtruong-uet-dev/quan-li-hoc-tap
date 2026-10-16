# Review & Adversarial Challenge Report: Milestone 1 (Store, Types & Tasks Engine)

**Author**: Reviewer 1 (`reviewer_m1_1`)  
**Roles**: Reviewer, Adversarial Critic  
**Parent Conversation ID**: `d87bbdd2-41e0-4e96-8205-9ea9461c7df0`  
**Timestamp**: 2026-10-13T08:43:00Z  
**Target Path**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\reviewer_m1_1\handoff.md`

---

## Review Summary

**Verdict**: **APPROVE**  
**Overall Risk Assessment**: **LOW**

Milestone 1 successfully delivers the foundation for the CampusOS `/tasks` page redesign. All TypeScript contracts in `web/src/types/tasks.ts`, pure algorithmic calculations in `web/src/lib/tasks-engine.ts`, and state management extensions in `web/src/lib/campus-store.ts` are cleanly implemented, fully typed (0 `any`), and verified by independent test execution (73 passing tests, 0 failures, 0 TypeScript errors, clean production build).

---

## 1. Observation

### 1.1 Direct File Inspection
1. **`web/src/types/tasks.ts` (81 lines)**:
   - Exports all contract types: `TaskStatus`, `TaskPriority`, `EisenhowerQuadrant`, `TaskDateGroupKey`, `TaskStep`, `TaskPomodoroInfo`, `TaskAttachment`, `TaskActivityLog`, `TaskItem`, `ParsedTaskResult`, `UrgencyLevel`.
   - Matches and extends `PROJECT.md` interface specifications.
   - Grep search for `\bany\b` returned **0 matches** (100% strict type safety).

2. **`web/src/lib/tasks-engine.ts` (549 lines)**:
   - Contains pure helper functions accepting optional `referenceDate: Date = new Date()`:
     - `daysDifference(dateStrA, dateStrB)`: Calendar day difference utilizing `Date.UTC` to prevent daylight saving / timezone drift.
     - `getTaskDateGroup(task, referenceDate)`: Maps to `overdue | today | tomorrow | this_week | later | done` with Sunday week-end partition.
     - `groupTasksByDate(tasks, referenceDate)`: Partitions array of tasks into record groups.
     - `computeEisenhowerQuadrant(task, referenceDate)`: Preserves manual user overrides; evaluates 48h urgency and importance heuristics (priority `'high'`, difficulty `>= 4`, or academic keywords regex).
     - `formatCountdown(dueAt, referenceDate)`: Outputs `"Quá hạn X ngày"`, `"Còn X ngày"`, or live `"HH:MM:SS"` countdown.
     - `getUrgencyLevel(dueAt, referenceDate)`: Evaluates color tiers (`'lime' | 'orange' | 'red'`), `isPanic` (< 3h), and overdue flags.
     - `parseVietnameseTaskInput(rawInput, referenceDate)`: Deterministic 6-pass parser handling colons/combos, duration variants (`90p`, `1.5h`, `2 tiếng`), priorities (`ưu tiên cao`, `gấp`, `thấp`), dates (`hôm nay`, `ngày mai`, `thứ 6`, `25/11`), known courses, and title cleanup.
   - Grep search for `\bany\b` returned **0 matches**.

3. **`web/src/lib/campus-store.ts` (lines 172, 472–648, 924–1280)**:
   - `CampusOSSharedState`: Extended with `tasks: TaskItem[]`.
   - `createDefaultSharedState(referenceDate)`: Seeds 7 realistic tasks dynamically offset from `referenceDate` covering all date groups.
   - Immutable state transitions and reactive actions:
     - `addTask(taskData)`: Prepends task with unique id and ISO timestamp; notifies storage listeners.
     - `completeTask(id, xpAward)`: Transitions status to `'done'`, checks "Clear the Board" (+50 XP bonus), triggers streak progression, marks checklist steps `done`, logs activity.
     - `updateTask(id, patch)`: Applies partial patch, records reschedule log on due date shift, syncs matching deadline.
     - `deleteTask(id)`: Removes task and returns deleted object for Undo toast.
     - `bulkUpdateTasks(ids, patch)`: Batch applies updates.
     - `toggleTaskStep(taskId, stepId)`: Flips subtask checklist item `done`.
     - `reorderTasks(taskId, targetQuadrantOrGroup, newOrder)`: Updates sort order and quadrant.
     - `useCampusStore()`: Hook exposing all task dispatchers.
   - Grep search for `:\s*any\b` returned **0 matches**.

### 1.2 Independent Tool Execution & Output Verification

1. **TypeScript Typecheck (`npm run typecheck` in `web/`)**:
   ```
   > campusos-web@0.1.0 typecheck
   > tsc --noEmit
   ```
   - **Exit code**: `0`
   - **Errors**: `0`

2. **Unit & Integration Test Suite (`npm test` in `web/`)**:
   ```
   > campusos-web@0.1.0 test
   > node --experimental-strip-types --test tests/*.test.ts
   ```
   - **Exit code**: `0`
   - **Total tests**: `73`
   - **Passed**: `73`
   - **Failed**: `0`
   - **Duration**: `362.18ms`
   - All 40 new tests in `tests/tasks-redesign.test.ts` (covering Tier 1 feature coverage, Tier 2 boundary cases, Tier 3 cross-feature lifecycle, and Tier 4 real-world student prompts) passed without regression to the 33 existing tests.

3. **Production Build (`npm run build` in `web/`)**:
   ```
   > campusos-web@0.1.0 build
   > next build
   ✓ Compiled successfully
   ✓ Generating static pages (34/34)
   ✓ Finalizing page optimization
   ```
   - **Exit code**: `0`
   - **Routes built**: All 34 Next.js routes built cleanly including `/tasks` (9.79 kB) and API routes.

---

## 2. Logic Chain

1. **Contract Adherence**:
   - `web/src/types/tasks.ts` directly matches every property defined in `PROJECT.md#Interface Contracts`. Downstream milestones (M2 Header, M3 Controls & 4 Views, M4 Drawer & Page) have a stable, type-safe interface contract.

2. **Purity & Testability**:
   - Every algorithmic function in `web/src/lib/tasks-engine.ts` accepts an optional `referenceDate: Date = new Date()`.
   - By anchoring relative calculations (today, tomorrow, Sunday week boundary, countdowns) to this parameter, test suites run completely deterministically without flakiness across runs, time zones, or CI servers.

3. **Store Safety & Immutability**:
   - `campus-store.ts` actions strictly use immutable array operations (`[...prev.tasks]`, `.map()`, `.filter()`).
   - `completeTask` guards against double-completion: if `task.status === 'done'`, it early-returns without awarding duplicate XP.
   - `deleteTask` returns the removed item, enabling straightforward implementation of the Undo toast in M3/M4.

4. **Integrity & Authenticity**:
   - Code inspection confirmed that the NLP parser in `tasks-engine.ts` uses real Unicode-aware regexes and modular state machines, not hardcoded if-statements matching test inputs.
   - The test suite `tests/tasks-redesign.test.ts` was authored independently and contains 40 genuine opaque-box test cases spanning edge cases, boundary values, and complex real-world student prompts.

---

## 3. Adversarial Challenges & Stress-Testing

| # | Assumption / Scenario | Attack Scenario | Actual Behavior / Blast Radius | Status |
|---|------------------------|-----------------|---------------------------------|--------|
| **C-01** | **Empty or Punctuation-Only NLP Input** | User types `""`, `"   "`, or `"!@#$%^&*"` into QuickAdd | `parseVietnameseTaskInput` detects pattern, returns clean fallback draft title `"Nhiệm vụ mới"`, confidence `0.2`, today date, without throwing any runtime error. | **PASS** |
| **C-02** | **Extreme & Fractional Durations** | User enters `"0.5h"`, `"12 tiếng"`, `"180p"`, or `"0 phút"` | Multi-pass parser parses float hours (`0.5h -> 30m`), word hours (`12 tiếng -> 720m`), minutes (`180p -> 180m`), gracefully preserving estimates. | **PASS** |
| **C-03** | **Timezone Discrepancy** | `dueAt` strings in ISO format without explicit timezone offset | `parseSafeIsoTime` appends `Z` or evaluates UTC anchors via `Date.UTC`, ensuring consistent millisecond diff across machines. | **PASS** (See Advisory) |
| **C-04** | **Manual Eisenhower Override** | User manually assigns quadrant (e.g. `quadrant: 'delegate'`) to an urgent high-priority task | `computeEisenhowerQuadrant` checks `if (task.quadrant) return task.quadrant;` first, ensuring user intent is never overwritten by heuristics. | **PASS** |
| **C-05** | **Double Task Completion** | User repeatedly clicks or dispatches complete on an already done task | `completeTask` checks `if (task.status === 'done') return {};`, preventing duplicated XP or streak inflation. | **PASS** |
| **C-06** | **"Clear the Board" Bonus Boundary** | Only non-today tasks exist, or today has 0 tasks | Bonus is strictly conditional on `isTodayTask && otherIncompleteTodayTasks.length === 0 && todayTasks.length > 0`. Completing a tomorrow task never triggers the bonus. | **PASS** |
| **C-07** | **Date Grouping on Sunday** | `referenceDate` falls on Sunday (`getDay() === 0`) | `daysUntilSunday` evaluates to `0`, correctly treating Sunday as end-of-week, next days as `later`. | **PASS** |

### Integrity Check Results
- [x] **No hardcoded test outputs**: All regex patterns and mathematical calculations are generalized.
- [x] **No facade implementations**: Complete logic implemented for all declared functions and actions.
- [x] **No shortcuts bypassing task**: All P0/P1 store and engine requirements implemented.
- [x] **No fabricated outputs**: Build, typecheck, and test outputs independently verified via direct command executions.

---

## 4. Caveats & Advisory Notes for Downstream Milestones

1. **Advisory for M4 (UI QuickAdd & Drawer Timezone Serialization)**:
   - When generating new tasks from the UI, ensure dates and times are formatted as standard ISO strings (e.g. `${date}T${time}:00` or full UTC `.toISOString()`). `parseSafeIsoTime` in `tasks-engine.ts` handles both standard ISO with offset and date-only strings safely.
2. **Advisory for M3 (Controls & Bulk Actions)**:
   - `bulkUpdateTasks(ids, patch)` and `deleteTask(id)` are ready for the Floating Bulk Action Bar and List View drag-and-drop. For Undo functionality, `deleteTask` returns the deleted item, so M3 can simply pass it to an Undo toast handler that calls `addTask`.
3. **Advisory for M2 (Header & Three.js Canvas)**:
   - `campus-store.ts` seeded data provides 7 diverse tasks across all date groups and statuses, allowing immediate visual testing of the 4 tilted stat stickers and circular progress ring.

---

## 5. Conclusion

**Verdict: APPROVE**

Milestone 1 satisfies all functional, architectural, and verification requirements:
- `web/src/types/tasks.ts` provides strict, exhaustive TypeScript interfaces.
- `web/src/lib/tasks-engine.ts` provides pure, robust, and deterministic task grouping, Eisenhower classification, Vietnamese NLP parsing, and countdown calculations.
- `web/src/lib/campus-store.ts` seamlessly extends the reactive store with tasks, seeded data, Clear the Board bonuses, streak calculations, and dispatch actions.
- 0 TypeScript errors, 73/73 tests passing cleanly, and Next.js production build succeeds with code 0.

---

## 6. Verification Method

To independently reproduce this verification:

1. **Run TypeScript Check**:
   ```bash
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run typecheck
   ```
   *Expected*: Exit code 0, 0 errors.

2. **Run Full Test Suite**:
   ```bash
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm test
   ```
   *Expected*: Exit code 0, 73 passed, 0 failed.

3. **Run Production Build**:
   ```bash
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run build
   ```
   *Expected*: Exit code 0, all 34 routes compiled.
