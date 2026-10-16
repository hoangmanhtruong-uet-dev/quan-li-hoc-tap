# DISPATCH — Explorer M1.3 (Campus Store Dual-Write & Undo Engine)

## Mission
Investigate and design the implementation strategy for `addQuickTask` in `web/src/lib/campus-store.ts`.

## Context & Constraints
- Read `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md` (section `## 2026-10-13T12:48:34Z`).
- Read `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_10\PROJECT.md`.
- Read `web/src/lib/campus-store.ts`.

## Scope
1. Implement `addQuickTask(taskData: Omit<TaskItem, 'id' | 'createdAt' | 'order'>)` in `campus-store.ts`:
   - Prepend `TaskItem` to `state.tasks`.
   - Prepend matching `DeadlineItem` to `state.deadlines` (with `id: dl-${taskId}`, `urgent: priority === 'urgent' || priority === 'high'`, `course`, `dueDate`, `displayDate`).
   - Award `+10 XP` and recalculate level/rank title via existing `calculateLevelAndRank`.
   - Return `{ task, deadline, undo }` where `undo()` cleanly removes the task from `state.tasks`, removes the deadline from `state.deadlines`, and deducts 10 XP (`Math.max(0, prev.xp - 10)`).
   - Dispatch custom DOM event `campusos:deadline-created` with `{ detail: { id: deadline.id, taskId: task.id } }`.
2. Inspect existing `addTask`, `deleteTask`, `completeTask` to guarantee zero regressions.

## Output
Write your analysis and detailed code patch recommendations to:
`d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_3\handoff.md`.
Report back when complete.


## 2026-10-13T13:01:33Z
You are explorer_m1_3.
Your working directory is d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_3\
Read d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically section ## 2026-10-13T12:48:34Z).
Read d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_10\PROJECT.md.
Read d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_3\DISPATCH.md.
Analyze addQuickTask dual-write, +10 XP, level/rank calculation, and reversible undo() in web/src/lib/campus-store.ts.
Write handoff report to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_3\handoff.md and notify parent.
