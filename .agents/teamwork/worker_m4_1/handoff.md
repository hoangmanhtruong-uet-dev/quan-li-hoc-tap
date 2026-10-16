# Milestone 4 Handoff Report
**CampusOS Tasks Redesign (Neo-Brutal Aurora)**
**Agent**: `worker_m4_1` (`teamwork_preview_worker`)
**Target Milestone**: Milestone 4 (Detail Drawer, NLP QuickAdd, AI Breakdown, `/tasks` Page Assembly)

---

## 1. Observation

### 1.1 Legacy Codebase & Pre-existing Work
- Prior to Milestone 4, `web/src/app/(main)/tasks/page.tsx` was a legacy implementation (lines 1–152) utilizing an isolated local state `useState<Task[]>(initialTasks)` backed by `'campusos-tasks-v1'`, using hardcoded August 2026 mock data (`'2026-08-20'`), lacking multi-view support, and rendering a static placeholder `"Chọn một nhiệm vụ"` when unselected.
- Milestone 1–3 components were fully ready: `QuestBoardHeader` (`web/src/components/tasks/header/quest-board-header.tsx`), `ControlsBar` (`web/src/components/tasks/controls/controls-bar.tsx`), `BulkActionBar` (`web/src/components/tasks/controls/bulk-action-bar.tsx`), `ListView` (`web/src/components/tasks/views/list-view.tsx`), `KanbanView` (`web/src/components/tasks/views/kanban-view.tsx`), `MatrixView` (`web/src/components/tasks/views/matrix-view.tsx`), and `TodayView` (`web/src/components/tasks/views/today-view.tsx`).
- `web/src/lib/tasks-engine.ts` provided pure algorithmic utilities: `parseVietnameseTaskInput`, `getUrgencyLevel`, `computeEisenhowerQuadrant`, `groupTasksByDate`.
- `web/src/lib/campus-store.ts` exported the reactive hook `useCampusStore` and mutation functions: `addTask`, `completeTask`, `updateTask`, `deleteTask`, `bulkUpdateTasks`, `toggleTaskStep`, `reorderTasks`, `recordSession`.

### 1.2 Implemented Files & Locations
Under exclusive write ownership, the following files were created and updated:
1. `web/src/components/tasks/drawer/unselected-hero.tsx` (new):
   - Hero card "Việc tiếp theo nên làm" targeting the earliest incomplete task sorted by `dueAt` ascending and priority descending.
   - Live urgency badge via `getUrgencyLevel` with color tokens (`lime`, `orange`, `red`) and countdown string.
   - Action buttons: `▶ Bắt đầu ngay` (calls `onFocusTask(mostUrgentTask)`) and `Chi tiết` (calls `onSelectTask(mostUrgentTask.id)`).
   - Gen Z celebratory empty state when 0 tasks are incomplete (`"Sạch bách, đi chơi được rồi 🎉"`).
   - 7-day mini heatmap visualizing study consistency with weekly study minutes indicator.
   - Curated academic wisdom cards (Pomodoro, 2-minute rule, Feynman method, morning momentum).
2. `web/src/components/tasks/drawer/subtask-checklist.tsx` (new):
   - Progress bar with `{completedCount}/{totalCount} bước ({progressPercent}%)`.
   - Step items with SVG checkmark draw toggle, in-place title editor, up/down reorder buttons, and delete button.
   - Inline add-step input with `Enter` submission.
   - `onAiBreakdownMore` callback integration.
3. `web/src/components/tasks/drawer/task-detail-drawer.tsx` (new):
   - Dual-state intelligent container rendering `UnselectedHero` when `selectedTask === null` and the full editor when `selectedTask !== null`.
   - Responsive mechanics: slide-over panel on desktop (`lg:w-[460px]`, `fixed inset-y-0 right-0 z-50`), bottom sheet on mobile (`<1024px`, `fixed inset-x-0 bottom-0 z-50 max-h-[90vh] rounded-t-[28px]`) with pull drag handle.
   - Full in-place editing: `title`, `description`, course selection chips, native date/time picker with quick chips (`Hôm nay 23:59`, `Ngày mai 23:59`, `Thứ 6 tuần này`, `+2 ngày`), priority chips (`#FF3D6E` / `#FFB020` / `#3DE8FF`), difficulty 1–5 stars.
   - Pomodoro mini widget with planned/done counters, time comparison (`actualMin` vs `estimateMin`), and `▶ Bắt đầu Focus (25p)` CTA.
   - Personal notes textarea, notes auto-save, and inline delete confirmation.
4. `web/src/components/tasks/create/quick-add-modal.tsx` (new):
   - Vietnamese NLP task creation powered by `parseVietnameseTaskInput(rawInput)`.
   - Real-time preview chips: Title, Course, Due Date/Time, Duration, Priority, Confidence % meter.
   - Quick chips for courses (`Mạng máy tính`, `Triết học`, `CTDL & GT`, `Xác suất`, `Dự án Web`), dates, durations, and priorities.
   - `Enter` key submission creating task via `addTask` and selecting it.
5. `web/src/components/tasks/create/ai-breakdown-modal.tsx` (new):
   - Syllabus/Assignment description input with template prompt chips.
   - Heuristic stage generator detecting deliverables (code/socket/web, essays/philosophy, math/probability) producing 4–5 progressive stages with time estimates.
   - Review checklist permitting inline editing, step toggling, addition/deletion, before final dispatch via `addTask`.
6. `web/src/app/(main)/tasks/page.tsx` (rebuilt):
   - Full assembly of `QuestBoardHeader`, `ControlsBar`, 4 views (`ListView`, `KanbanView`, `MatrixView`, `TodayView`), `BulkActionBar`, `TaskDetailDrawer`, `QuickAddModal`, `AiBreakdownModal`, and `StrictPomodoroModal` (dynamic import with `{ ssr: false }`).
   - Wires global keyboard shortcuts: `N` (new task), `/` (search), `1-4` (switch views), `J/K` (card navigation), `X` (toggle complete), `E` (open drawer), `F` (focus mode), `Del` (delete), `?` (shortcuts cheatsheet), `Cmd/Ctrl+K` (command palette), `Escape` (close drawer/modals).
   - Enforces strict zero-overflow container: `min-h-screen w-full min-w-0 max-w-full overflow-x-hidden`.
   - Reversible Undo toast for deleted or completed tasks.
   - Clear the Board celebration (+50 XP bonus) toast.

### 1.3 Verification Tool Invocations
- `npm run typecheck`:
  ```
  > campusos-web@0.1.0 typecheck
  > tsc --noEmit
  Exited with code 0.
  ```
- `npm test`:
  ```
  ✔ Tier 5 - M4 Drawer (1/6): Unselected Hero selects the most urgent incomplete task (0.2805ms)
  ✔ Tier 5 - M4 Drawer (2/6): In-place task updates modify store state without mutating unmodified properties (0.1937ms)
  ✔ Tier 5 - M4 Drawer (3/6): Subtask checklist manager handles add, toggle, and reorder (0.1872ms)
  ✔ Tier 5 - M4 NLP QuickAdd (4/6): End-to-end NLP parse to store addTask pipeline (0.1664ms)
  ✔ Tier 5 - M4 AI Breakdown (5/6): Progressive breakdown produces multi-stage task with pomodoros (0.2005ms)
  ✔ Tier 5 - M4 Pomodoro & Undo (6/6): Pomodoro progress updates and reversible task deletion (0.1854ms)
  ℹ tests 109
  ℹ suites 0
  ℹ pass 109
  ℹ fail 0
  Exited with code 0.
  ```
- `npm run build`:
  ```
  ✓ Compiled successfully
  ✓ Generating static pages (34/34)
  ├ ƒ /tasks 37 kB 348 kB
  Exited with code 0.
  ```

---

## 2. Logic Chain

1. **Dual-State Drawer Requirement**:
   - Observations 1.1 and 1.2 demonstrate that legacy static drawers waste space when unselected.
   - By creating `unselected-hero.tsx` and dynamically rendering it when `selectedTask === null`, students immediately see their highest urgency deadline countdown, weekly study momentum, and study tips, eliminating empty voids.
   - When `selectedTask !== null`, `task-detail-drawer.tsx` provides full in-place editing directly bound to store actions (`updateTask`, `completeTask`, `deleteTask`).
2. **Vietnamese NLP QuickAdd**:
   - `parseVietnameseTaskInput` extracts structured metadata deterministically.
   - Binding this pure function to input changes in `quick-add-modal.tsx` gives instant visual feedback chips (title, course, date, estimate, priority, confidence %).
   - Submitting via `Enter` constructs the complete `TaskItem` and persists it to `campus-store.ts`, updating `/tasks`, `/dashboard`, and `/calendar` simultaneously.
3. **AI Task Breakdown**:
   - Complex coursework (e.g. Socket UDP, philosophy essays) overwhelms students when stored as single un-chunked tasks.
   - `ai-breakdown-modal.tsx` analyzes user prompts, splits them into 4–5 progressive stages with duration estimates, and permits user review before saving.
4. **Assembly and Zero Horizontal Overflow**:
   - All 4 views (`ListView`, `KanbanView`, `MatrixView`, `TodayView`), controls, drawer, and modals are unified in `src/app/(main)/tasks/page.tsx`.
   - Single-viewport boundary constraint is enforced with `min-h-screen w-full min-w-0 max-w-full overflow-x-hidden`.
   - Modals containing heavy browser-only APIs (`StrictPomodoroModal`, `CommandPalette`, `KeyboardShortcutsModal`) use `next/dynamic` with `{ ssr: false }`, ensuring zero hydration mismatch.
5. **Gamification & Undo Protocol**:
   - Completing tasks dispatches `completeTask`, awarding `+20 XP` (or `+70 XP` when triggering "Clear the Board").
   - Destructive deletions display a 6-second floating toast with `Hoàn tác`, allowing accidental deletions to be cleanly restored.

---

## 3. Caveats

1. **Screen Reader Drag and Drop**: HTML5 drag-and-drop handles for subtask ordering are complemented by accessible Up/Down buttons (`ChevronUp` / `ChevronDown`) so users on touch or screen-reader devices can reorder without drag interactions.
2. **No External Heavy Bundles**: No third-party drag-and-drop or NLP packages were added; all functionality leverages existing project packages (`lucide-react`, pure TypeScript regex engines, and native React state).
3. **Audio Context in StrictPomodoroModal**: `StrictPomodoroModal` runs exclusively client-side; keeping `{ ssr: false }` dynamic import is mandatory to avoid SSR crashes.

---

## 4. Conclusion

Milestone 4 is fully implemented, verified, and complete:
- `task-detail-drawer.tsx`, `unselected-hero.tsx`, and `subtask-checklist.tsx` deliver the intelligent dual-state detail drawer with desktop slide-over and mobile bottom sheet responsive mechanics.
- `quick-add-modal.tsx` enables Vietnamese natural language task creation with real-time preview chips.
- `ai-breakdown-modal.tsx` provides heuristic progressive breakdown of syllabus prompts.
- `src/app/(main)/tasks/page.tsx` unifies all header, controls, 4 views, drawer, modals, shortcuts, gamification, and zero-overflow requirements.
- Full typecheck, test suite (109 passing tests), and Next.js production build pass cleanly with 0 errors.

---

## 5. Verification Method

To independently verify the implementation:
1. Run TypeScript check:
   ```bash
   cd web && npm run typecheck
   ```
   *Expected output: Exit code 0, 0 TypeScript errors.*
2. Run automated test suite:
   ```bash
   cd web && npm test
   ```
   *Expected output: Exit code 0, 109 tests passed (including 6 Tier 5 M4 integration tests).*
3. Run production Next.js build:
   ```bash
   cd web && npm run build
   ```
   *Expected output: Exit code 0, 34 static/dynamic routes compiled cleanly including `/tasks`.*
4. Inspect source files:
   - `web/src/components/tasks/drawer/task-detail-drawer.tsx`
   - `web/src/components/tasks/drawer/unselected-hero.tsx`
   - `web/src/components/tasks/drawer/subtask-checklist.tsx`
   - `web/src/components/tasks/create/quick-add-modal.tsx`
   - `web/src/components/tasks/create/ai-breakdown-modal.tsx`
   - `web/src/app/(main)/tasks/page.tsx`
   - `web/tests/tasks-redesign.test.ts` (Tier 5 tests)
