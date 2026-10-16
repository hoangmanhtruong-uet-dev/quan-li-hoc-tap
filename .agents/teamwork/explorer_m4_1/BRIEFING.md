# BRIEFING — 2026-10-13T11:42:00Z

## Mission
Explore and design the blueprint for Milestone 4 of CampusOS Tasks Redesign (Detail Drawer, NLP QuickAdd, AI Breakdown, /tasks page assembly).

## 🔒 My Identity
- Archetype: explorer
- Roles: teamwork_preview_explorer
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m4_1\
- Original parent: 36a9e4bd-9a99-49d5-9abb-fdf329e0082d
- Milestone: Milestone 4 (Detail Drawer, NLP QuickAdd, AI Breakdown, /tasks page assembly)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT directly modify source code (except writing reports in own folder)
- Produce comprehensive blueprint and handoff report for Milestone 4

## Current Parent
- Conversation ID: 36a9e4bd-9a99-49d5-9abb-fdf329e0082d
- Updated: 2026-10-13T11:42:00Z

## Investigation State
- **Explored paths**:
  - Legacy tasks page (`web/src/app/(main)/tasks/page.tsx`): isolated useState, static right aside, no multi-view, outdated mock data.
  - StrictPomodoroModal (`web/src/features/pomodoro/strict-pomodoro-modal.tsx`): supports `open`, `onClose`, `onSessionComplete({ focusMinutes, shameCount, disciplineScore })`, `initialMinutes`. Integrates with `recordSession(minutes, score)`.
  - Pure tasks engine (`web/src/lib/tasks-engine.ts`): provides `getTaskDateGroup`, `groupTasksByDate`, `computeEisenhowerQuadrant`, `formatCountdown`, `getUrgencyLevel`, `parseVietnameseTaskInput`.
  - Reactive store (`web/src/lib/campus-store.ts`): provides full suite of task mutating functions (`addTask`, `completeTask`, `updateTask`, `deleteTask`, `bulkUpdateTasks`, `toggleTaskStep`, `reorderTasks`, `recordSession`), with XP bonuses and "Clear the board" streak detection.
  - M1-M3 deliverables: `QuestBoardHeader`, `ControlsBar`, `BulkActionBar`, `ListView`, `KanbanView`, `MatrixView`, `TodayView`, `TaskCard` verified and ready for assembly.
- **Key findings**:
  - All primitives, algorithmic engines, and store actions are already implemented, tested, and type-safe.
  - Milestone 4 needs 4 key deliverables:
    1. `web/src/components/tasks/drawer/task-detail-drawer.tsx` (Unselected "Việc tiếp theo" state + Selected full edit state + subtask checklist + Pomodoro widget + desktop slide-over >=1024px / mobile bottom sheet <1024px).
    2. `web/src/components/tasks/create/quick-add-modal.tsx` (Vietnamese NLP live preview chips, quick suggestion chips, Enter to submit, Undo toast).
    3. `web/src/components/tasks/create/ai-breakdown-modal.tsx` (Assignment prompt -> structured subtasks checklist generation with estimates & difficulty).
    4. `web/src/app/(main)/tasks/page.tsx` (Assembly of Header, Controls, Views, Drawer, Modals, Global Shortcuts: N, /, 1-4, J/K, X, E, F, Del, ?, Cmd+K, zero horizontal overflow container).
- **Unexplored areas**: None. Complete blueprint ready for implementation.

## Key Decisions Made
- Detail drawer structured with both states: when task is null, render Hero "Việc tiếp theo nên làm" + weekly mini-heatmap + AI study tips; when task is selected, render full in-place editor + subtask manager + Pomodoro widget.
- Responsive layout: `>= 1024px` renders desktop slide-over right panel; `< 1024px` renders mobile slide-up bottom sheet with touch backdrop.
- NLP QuickAdd utilizes `parseVietnameseTaskInput` directly from `tasks-engine.ts` with real-time reactive chips and confidence score.
- AI Breakdown provides heuristic academic workflow generator with 4-5 stages, editable subtasks, and instant creation into `campus-store`.
- Page orchestration integrates global shortcuts: `N`, `/`, `1-4`, `J/K`, `X`, `E`, `F`, `Del`, `?`, `Cmd+K` and full Undo toast notifications.

## Artifact Index
- DISPATCH.md — dispatch message
- BRIEFING.md — persistent working memory
- progress.md — liveness heartbeat
- handoff.md — final exploration report & blueprint
