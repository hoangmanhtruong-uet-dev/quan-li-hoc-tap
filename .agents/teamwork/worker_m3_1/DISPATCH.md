## 2026-10-13T09:53:45Z
You are Worker M3 for Milestone 3 (Smart Controls Bar & 4 Views) of the CampusOS /tasks page rebuild project.

Your assigned working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m3_1\
Your parent conversation ID: d87bbdd2-41e0-4e96-8205-9ea9461c7df0

Input files to read FIRST:
1. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically timestamp ## 2026-10-13T07:48:15Z)
2. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
3. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_survey_1\handoff.md (detailed specifications for Controls & all 4 Views)
4. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_ui_survey_3\handoff.md (design tokens, styling, HTML5 DnD pattern)
5. `web/src/lib/campus-store.ts` (store hook `useCampusStore`, actions, tasks collection, events collection)
6. `web/src/lib/tasks-engine.ts` (`getTaskDateGroup`, `groupTasksByDate`, `computeEisenhowerQuadrant`, `getUrgencyLevel`, `formatCountdown`)

EXCLUSIVE WRITE OWNERSHIP:
You exclusively own and may create/modify:
- `web/src/components/tasks/controls/controls-bar.tsx`
- `web/src/components/tasks/controls/bulk-action-bar.tsx`
- `web/src/components/tasks/views/task-card.tsx`
- `web/src/components/tasks/views/list-view.tsx`
- `web/src/components/tasks/views/kanban-view.tsx`
- `web/src/components/tasks/views/matrix-view.tsx`
- `web/src/components/tasks/views/today-view.tsx`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objective & Requirements:
1. Smart Controls Bar (`controls-bar.tsx` & `bulk-action-bar.tsx`):
   - Sliding segmented pill switcher: `Danh sách · Kanban · Ma trận · Hôm nay`.
   - Full-width search bar with shortcut `/` focus, clear button, and placeholder "Tìm nhiệm vụ, môn học, thẻ…".
   - Status filter chips with live counts: `Tất cả`, `Cần làm`, `Đang làm`, `Hoàn thành`.
   - Priority filter chips: `Cao` (`#FF3D6E`), `Vừa` (`#FFB020`), `Thấp` (`#3DE8FF`).
   - Custom sort dropdown menu: Theo hạn, Ưu tiên, Môn học, Mới tạo, AI đề xuất.
   - Floating bulk action bar (`bulk-action-bar.tsx`): appears when >= 1 tasks selected; actions: Hoàn thành, Đổi ưu tiên, Dời hạn (+1 ngày, +3 ngày), Xoá with Undo callback.
2. Reusable Neo-Brutal Task Ticket Card (`task-card.tsx`):
   - Ticket card: 1.5px border, 20px corners, hover tilt ±0.8°, status border color.
   - Large checkbox: tick -> SVG animated draw ✓, strikethrough, mini confetti burst, `+XP` float-up badge, moves to "Đã xong".
   - Live countdown in `JetBrains Mono`: lime (>24h), orange (3h–24h), red + gentle panic pulse (<3h), overdue red ping with melting emoji `🫠`.
   - Course chip with subject color, subtask progress segment bar (e.g. `2/4 bước`), priority text badge ("CAO", "VỪA", "THẤP").
   - Multi-select checkbox, click to select task for detail drawer, hover quick action buttons (Focus, Reschedule, Edit).
3. View 1: List View (`list-view.tsx`):
   - Sticky grouped headers: `Quá hạn · Hôm nay · Ngày mai · Tuần này · Sau đó · Đã xong` with item counts & collapse toggles.
   - HTML5 native drag-and-drop reordering within and across groups with Undo toast.
4. View 2: Kanban View (`kanban-view.tsx`):
   - 3 columns: `Cần làm` (`#7A8AA8`), `Đang làm` (`#8B6CFF`), `Hoàn thành` (`#3DFFB0`). Tilted sticker column headers.
   - HTML5 DnD cards between columns. Dropping into "Hoàn thành" triggers completion + XP award.
   - Soft WIP limit warning banner/sticker when "Đang làm" column has > 3 items.
5. View 3: Eisenhower Matrix View (`matrix-view.tsx`):
   - 2x2 grid: `Làm ngay` (Q1: pulsing neon pink border), `Lên lịch` (Q2), `Giao/Dời` (Q3), `Bỏ bớt` (Q4).
   - Drag-and-drop cards between quadrants (updates task `quadrant`).
   - AI placement suggestion using `computeEisenhowerQuadrant`.
6. View 4: Today Plan View (`today-view.tsx`):
   - AI-curated top ~5 priority tasks fitting today's free time.
   - Capacity progress bar (total task minutes vs free study time).
   - Button `Chấp nhận kế hoạch` to schedule study blocks into `events` collection of `campus-store.ts`.

Zero Horizontal Overflow Constraint:
- All containers must enforce `min-w-0`, `overflow-x-hidden`, and grid columns must use `minmax(0, 1fr)`.

Verification Requirement:
- Run `npm run typecheck` in `web/` to confirm 0 TypeScript errors.
- Run `npm test` in `web/` to verify all 102 tests pass cleanly.

Deliverable:
Write report to `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m3_1\handoff.md`.
Send completion message to parent (`d87bbdd2-41e0-4e96-8205-9ea9461c7df0`).
