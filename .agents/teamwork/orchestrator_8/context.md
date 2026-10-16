# Orchestrator Dispatch Context

## Objective
Rebuild the Nhiệm vụ (`/tasks`) page of the CampusOS Next.js web application following the **Neo-Brutal Aurora (Gen Z, 120FPS zero-lag)** art direction specified in `docs/CampusOS_Tasks_Redesign_Plan.md`. Synchronize with the existing shared store (`campus-store.ts`), Focus Mode (`StrictPomodoroModal`), Calendar, and Dashboard gamification. Implement full P0 and P1 scope.

## Locations & Specs
- App working directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`
- Metadata directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_8`
- Original Request: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md` (see timestamp `## 2026-10-13T07:48:15Z`)
- Tasks Redesign Spec: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\docs\CampusOS_Tasks_Redesign_Plan.md`

## Architectural Decisions from /grill-me
1. **3D Engine**: Lightweight vanilla Three.js (`three` is already installed) with instanced mesh ~40 drifting cubes/stars; lazy-loaded with Canvas2D/static fallback on mobile and `prefers-reduced-motion`. Do not add heavy external wrapper packages.
2. **Data & State**: Unified reactive persistence directly in `campus-store.ts`. Sync tasks, deadlines, and completed sessions seamlessly across `/dashboard`, `/calendar`, and `/tasks` with debounced background sync to Supabase Cloud and offline-first fallback.
3. **Scope**: Full implementation of P0 and P1 (Header Quest Board with Three.js, Smart Controls Bar, 4 Views: List with sticky date grouping, 3-column Kanban, Eisenhower 2x2 Matrix, Today Plan; Intelligent Detail Drawer; NLP Vietnamese QuickAdd; AI Task Breakdown heuristic; Focus Mode integration).
4. **Layout & Overflow**: Strict single-viewport containment without horizontal scrollbars (`overflow-x-hidden`, `min-w-0`, `minmax(0,...)` on all grid columns).
5. **Human-in-the-loop Directive**: If any unforeseen design or technical roadblock occurs, do not guess — ask the user directly.

## Requirements Breakdown
- **R1. "Quest Board" Header with Vanilla Three.js Floating Blocks**:
  - Header height bounded (<= 28vh), large title `NHIỆM VỤ.` with character reveal, dynamic subtitle reactive to remaining task count.
  - Lightweight Three.js instanced mesh canvas (~40 floating cubes/stars drifting slowly, pointer-reactive; completing a task bursts a cube upward into particles; disabled on mobile and `prefers-reduced-motion`).
  - Magnetic buttons: `+ Thêm nhiệm vụ` (signature green/lime accent), `✨ AI chia nhỏ việc`, `▶ Focus ngay` (launches Focus Mode with most urgent deadline task).
  - 4 asymmetric tilted stat sticker badges: Tổng nhiệm vụ, Đang thực hiện, Ưu tiên cao (pulsing red dot if overdue tasks exist), Hoàn thành (SVG circular progress ring with liquid fill, 100% -> mini confetti burst).
- **R2. Smart Controls Bar & Multi-View Switcher**:
  - Sliding pill view switcher: `Danh sách · Kanban · Ma trận · Hôm nay`.
  - Full-width search input with shortcut `/`, status filter chips with live counts, priority filter chips (`Cao #FF3D6E`, `Vừa #FFB020`, `Thấp #3DE8FF`), custom sort menu.
  - Floating Bulk Action Bar when multiple tasks selected (Complete, Change Priority, Postpone, Delete with Undo toast).
- **R3. 4 Functional Views (List, Kanban, Eisenhower Matrix, Today Plan)**:
  - List View (Default): Sticky grouped headers (`Quá hạn · Hôm nay · Ngày mai · Tuần này · Sau đó · Đã xong`), task ticket stickers with SVG draw checkmark, strikethrough, mini confetti, `+XP` float-up, dynamic countdown timer (`lime -> orange -> red`, panic pulse < 3h), course badge, step progress bar, HTML5 / dnd reordering with Undo toast.
  - Kanban View: 3 columns (`Cần làm · Đang làm · Hoàn thành`), drag-and-drop between columns, completion + XP on drop to "Hoàn thành", WIP warning when "Đang làm" > 3 items, tilted sticker headers.
  - Eisenhower Matrix View: 2x2 grid (`Làm ngay` [Urgent & Important - pulsing neon border], `Lên lịch` [Not Urgent & Important], `Giao/Dời` [Urgent & Not Important], `Bỏ bớt` [Not Urgent & Not Important]), drag-drop between quadrants, AI placement suggestion.
  - Today Plan View: AI curated ~5 top priority tasks fitting free time today, capacity bar, button `Chấp nhận kế hoạch` to schedule into calendar.
- **R4. Intelligent Detail Drawer (Right Slide-over / Mobile Bottom Sheet)**:
  - When unselected: Show "Việc tiếp theo nên làm" (most urgent task with giant countdown + `▶ Bắt đầu` button), weekly mini-heatmap, AI study tips.
  - When selected: In-place title/description editing, subject tag, date picker, priority chips, difficulty rating (1-5 stars), subtasks checklist with drag-to-reorder, step completion toggling, progress bar, mini Pomodoro integration (`▶ Focus` button triggering `StrictPomodoroModal`), notes, attachments, activity log.
- **R5. Natural Language Task Creation (NLP QuickAdd) & AI Task Breakdown**:
  - Vietnamese NLP parser for quick input ("nộp bài tập mạng 23h ngày mai 90p ưu tiên cao" -> title, due date, estimate minutes, priority, course).
  - AI Task Breakdown modal: paste assignment description -> generates checklist subtasks and estimated minutes.
- **R6. Focus Mode & Gamification Store Synchronization**:
  - Task completion / focus session awards `+XP`, updates streak, level, rank title in `campus-store.ts`, debounced sync to Supabase Cloud.
  - Global keyboard shortcuts: `N`, `/`, `1/2/3/4`, `J/K`, `X`, `E`, `F`, `Del`, `?`, `Cmd/Ctrl+K`.
  - 120FPS zero-lag, no horizontal overflow (`overflow-x-hidden`, `min-w-0`), reduced-motion support.

## Acceptance Criteria
- [ ] `npm run typecheck` in `web/` passes with 0 TypeScript errors.
- [ ] `npm test` in `web/` passes all existing 33 tests + new tests covering tasks NLP parsing, Eisenhower quadrant calculation, and task date grouping logic.
- [ ] `npm run build` in `web/` compiles cleanly with exit code 0.
- [ ] Functional & Visual Completeness as specified in `ORIGINAL_REQUEST.md`.
