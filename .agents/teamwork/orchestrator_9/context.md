# Orchestrator 9 Dispatch Context (Successor from Orchestrator 8)

## Objective
Continue and complete rebuilding the Nhiệm vụ (`/tasks`) page of CampusOS Next.js web application following the **Neo-Brutal Aurora (Gen Z, 120FPS zero-lag)** art direction specified in `docs/CampusOS_Tasks_Redesign_Plan.md`. Synchronize with `campus-store.ts`, `StrictPomodoroModal`, Calendar, and Dashboard gamification. Complete P0 and P1 scope.

## Locations & Specs
- App working directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`
- Metadata directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_9`
- Predecessor handoff: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_8\handoff.md`
- Master plan: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md`
- Original Request: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md` (see timestamp `## 2026-10-13T07:48:15Z`)
- Tasks Redesign Spec: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\docs\CampusOS_Tasks_Redesign_Plan.md`

## Current Status Handed Off from Orchestrator 8
1. **E2E Test Suite**: DONE. `web/tests/tasks-redesign.test.ts` (102/102 tests passing).
2. **Milestone 1 (Store, Types & Engine)**: DONE & CERTIFIED CLEAN. `src/types/tasks.ts`, `src/lib/tasks-engine.ts`, `src/lib/campus-store.ts`.
3. **Milestone 2 (Quest Board Header & 3D Blocks)**: DONE & CERTIFIED CLEAN. `src/components/tasks/header/` (quest-board-header, floating-blocks-3d, stat-stickers, progress-ring).
4. **Milestone 3 (Controls Bar & 4 Views)**: WORKER DELIVERED. All 7 components implemented in `src/components/tasks/controls/` and `src/components/tasks/views/`. 0 TS errors, 102/102 tests pass. Run gate review/audit or proceed to Milestone 4.
5. **Milestone 4 (Detail Drawer, NLP QuickAdd, AI Breakdown, Page Assembly)**: PENDING.
   - Intelligent Detail Drawer: unselected state ("Việc tiếp theo nên làm" with countdown + focus CTA, mini-heatmap, study tips), selected state (in-place edit, subtasks checklist with drag-reorder & progress, Pomodoro integration with `StrictPomodoroModal`, notes, attachments).
   - Natural Language Task Creation (NLP QuickAdd modal) using `tasks-engine.ts`.
   - AI Task Breakdown modal: paste assignment description -> generate checklist subtasks and estimated minutes.
   - Assembly of `src/app/(main)/tasks/page.tsx` integrating Header, Controls Bar, 4 Views, Drawer, Modals, and global keyboard shortcuts.
6. **Milestone 5 (Final Verification & Acceptance)**:
   - `npm run typecheck` (0 errors)
   - `npm test` (all tests pass)
   - `npm run build` (exit code 0)
   - Zero horizontal overflow (`overflow-x-hidden`, `min-w-0`)
   - Report victory claim to sentinel.
