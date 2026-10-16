## 2026-10-13T11:32:49Z
You are explorer_m4_1 (teamwork_preview_explorer) for Milestone 4 (Detail Drawer, NLP QuickAdd, AI Breakdown, /tasks page assembly) of the CampusOS Tasks redesign.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m4_1\

Read these files first:
1. ORIGINAL_REQUEST.md at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md
2. Master plan at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
3. Design spec at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\docs\CampusOS_Tasks_Redesign_Plan.md
4. Milestone 1 & 2 & 3 deliverables in web/src/components/tasks/

Investigate the following in web/:
1. Legacy tasks page at web/src/app/(main)/tasks/page.tsx: understand what layout it uses, existing state, and how it fits into CampusOS navigation shell.
2. StrictPomodoroModal: locate where it is defined, inspect its exact interface and props, and how it handles focus sessions.
3. tasks-engine.ts & campus-store.ts: verify functions available for NLP quick add, task editing, subtask checklists, and XP streak bonus.
4. Design the detailed implementation blueprint for Milestone 4:
   - web/src/components/tasks/drawer/task-detail-drawer.tsx (Unselected "Việc tiếp theo" state + Selected full edit state + subtask checklist + Pomodoro widget + desktop slide-over >=1024px / mobile bottom sheet <1024px)
   - web/src/components/tasks/create/quick-add-modal.tsx (Vietnamese NLP preview chips, quick chips for courses/dates, Enter to submit)
   - web/src/components/tasks/create/ai-breakdown-modal.tsx (Assignment text prompt -> structured subtasks checklist generation with estimates & difficulty)
   - web/src/app/(main)/tasks/page.tsx (Assembles QuestBoardHeader, ControlsBar, BulkActionBar, 4 Views, Detail Drawer, Modals, Global Shortcuts: N, /, 1-4, J/K, X, E, F, Del, ?, Cmd+K, zero horizontal overflow container)

Write your full exploration report and blueprint to:
d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m4_1\handoff.md
Send a completion message back to the orchestrator.
