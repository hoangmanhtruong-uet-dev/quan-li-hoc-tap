## 2026-10-13T11:43:12Z
You are worker_m4_1 (teamwork_preview_worker) for Milestone 4 (Detail Drawer, NLP QuickAdd, AI Breakdown, /tasks Page Assembly) of the CampusOS Tasks redesign.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m4_1\

Read these files first:
1. ORIGINAL_REQUEST.md at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md
2. Master plan at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
3. Design spec at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\docs\CampusOS_Tasks_Redesign_Plan.md
4. Explorer M4 blueprint at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m4_1\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You have EXCLUSIVE WRITE OWNERSHIP of:
- web/src/components/tasks/drawer/task-detail-drawer.tsx
- web/src/components/tasks/drawer/unselected-hero.tsx (if split into subcomponent)
- web/src/components/tasks/drawer/subtask-checklist.tsx (if split into subcomponent)
- web/src/components/tasks/create/quick-add-modal.tsx
- web/src/components/tasks/create/ai-breakdown-modal.tsx
- web/src/app/(main)/tasks/page.tsx

Implementation Scope:
1. `task-detail-drawer.tsx` (and subcomponents):
   - Dual-state intelligent drawer:
     - Unselected state (`selectedTask === null`): "Việc tiếp theo nên làm" Hero card with urgent task countdown, focus CTA, 7-day mini heatmap, and academic study tips. Gen Z empty state when 0 tasks pending.
     - Selected state (`selectedTask !== null`): Full in-place editing (title, description, course selector, date/time picker, priority radio chips #FF3D6E / #FFB020 / #3DE8FF, 1-5 difficulty stars, subtasks checklist manager with toggle/add/delete/reorder, Pomodoro mini widget with planned/done sessions & focus CTA, notes, delete task with confirmation).
   - Responsive mechanics: slide-over panel on desktop (>=1024px), bottom sheet with drag handle on mobile (<1024px).
2. `quick-add-modal.tsx`:
   - Vietnamese NLP task creation powered by `parseVietnameseTaskInput` from `web/src/lib/tasks-engine.ts`.
   - Real-time preview chips (title, course, date/time, duration, priority, confidence %).
   - Quick chips for courses, dates, duration, priorities.
   - Enter to submit via `addTask` in `campus-store.ts`.
3. `ai-breakdown-modal.tsx`:
   - Assignment / Syllabus prompt input textarea.
   - Generates 4-5 progressive stages with time estimates and difficulty.
   - Review checklist (editable titles, toggle steps, add/remove).
   - Button to create task with subtasks via `addTask`.
4. `src/app/(main)/tasks/page.tsx`:
   - Fully assembles `QuestBoardHeader`, `ControlsBar`, `BulkActionBar`, all 4 views (`ListView`, `KanbanView`, `MatrixView`, `TodayView`), `TaskDetailDrawer`, `QuickAddModal`, `AiBreakdownModal`, and `StrictPomodoroModal` (imported dynamically with { ssr: false }).
   - Wires global keyboard shortcuts: `N` (new task), `/` (search), `1-4` (switch views), `J/K` (card navigation), `X` (toggle complete), `E` (open drawer), `F` (focus mode), `Del` (delete), `?` (shortcuts cheatsheet modal), `Cmd/Ctrl+K` (command palette), `Escape` (close drawer/modals).
   - Enforces strict zero-overflow container: `min-h-screen w-full min-w-0 max-w-full overflow-x-hidden`.
