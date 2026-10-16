## 2026-10-13T08:13:48Z
You are the Worker for Milestone 1 (Store, Types & Tasks Engine) of the CampusOS /tasks page rebuild project.

Your assigned working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1_1\
Your parent conversation ID: d87bbdd2-41e0-4e96-8205-9ea9461c7df0

Input files to read FIRST:
1. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically timestamp ## 2026-10-13T07:48:15Z)
2. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
3. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_survey_1\handoff.md
4. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_code_survey_2\handoff.md
5. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\src\lib\campus-store.ts

EXCLUSIVE WRITE OWNERSHIP:
You exclusively own and may modify:
- web/src/types/tasks.ts (create)
- web/src/lib/tasks-engine.ts (create)
- web/src/lib/campus-store.ts (extend)
DO NOT touch any test files or other UI components in this milestone.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objective & Implementation Details:
1. `web/src/types/tasks.ts`:
   - Define and export `TaskStatus` ('todo' | 'doing' | 'done'), `TaskPriority` ('high' | 'medium' | 'low'), `EisenhowerQuadrant` ('do_first' | 'schedule' | 'delegate' | 'eliminate'), `TaskDateGroupKey` ('overdue' | 'today' | 'tomorrow' | 'this_week' | 'later' | 'done').
   - Define and export `TaskStep`, `TaskPomodoroInfo`, `TaskAttachment`, `TaskActivityLog`, and full `TaskItem` interface matching specifications in PROJECT.md and spec miner handoff.
2. `web/src/lib/tasks-engine.ts`:
   - Implement deterministic, pure helper functions with optional `referenceDate: Date = new Date()` parameter:
     - `getTaskDateGroup(task: TaskItem, referenceDate?: Date): TaskDateGroupKey`
     - `computeEisenhowerQuadrant(task: TaskItem, referenceDate?: Date): EisenhowerQuadrant`
     - `parseVietnameseTaskInput(rawInput: string, referenceDate?: Date): ParsedTaskResult`
     - `getUrgencyLevel(dueAt: string, referenceDate?: Date): { isOverdue: boolean; hoursRemaining: number; color: 'lime' | 'orange' | 'red'; isPanic: boolean; displayCountdown: string }`
     - `formatCountdown(dueAt: string, referenceDate?: Date): string`
   - Use deterministic multi-pass regex for Vietnamese NLP (duration: 90p/1.5h/45m, priority: cao/vừa/thấp, dates: hôm nay/ngày mai/thứ X/DD-MM, time: 23h/14h30, course detection, title cleanup).
3. `web/src/lib/campus-store.ts`:
   - Extend `CampusOSSharedState` with `tasks: TaskItem[]`.
   - Seed default tasks dynamically anchored to the current system date (due today, tomorrow, this week, overdue, done) so that `/tasks` always starts with realistic, active tasks.
   - Implement exported reactive store actions:
     - `addTask(taskData)`
     - `completeTask(id, xp = 20)`: marks task done, awards XP, triggers streak progression, checks badges, checks "Clear the Board" bonus (+50 XP if all today's tasks completed), debounces sync to Supabase.
     - `updateTask(id, patch)`
     - `deleteTask(id)`
     - `bulkUpdateTasks(ids, patch)`
     - `toggleTaskStep(taskId, stepId)`
     - `reorderTasks(taskId, targetQuadrantOrGroup, newOrder)`

Verification Requirement:
- Run `npm test` in `web/` to verify all existing 33 tests still pass without regressions.
- Run `npm run typecheck` in `web/` to verify 0 TypeScript errors.
- Document exact verification commands and outputs in your handoff report.

Deliverable:
Write report to `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1_1\handoff.md`.
Send completion message to parent (`d87bbdd2-41e0-4e96-8205-9ea9461c7df0`).
