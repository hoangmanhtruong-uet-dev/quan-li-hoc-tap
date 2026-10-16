# BRIEFING — 2026-10-13T09:42:00Z

## Mission
Milestone 2: Implement Quest Board Header & 3D Blocks (`quest-board-header.tsx`, `floating-blocks-3d.tsx`, `stat-stickers.tsx`, `progress-ring.tsx`).

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m2_1
- Original parent: d87bbdd2-41e0-4e96-8205-9ea9461c7df0
- Milestone: Milestone 2 (Quest Board Header & 3D Blocks)

## 🔒 Key Constraints
- Exclusive write ownership:
  - `web/src/components/tasks/header/quest-board-header.tsx`
  - `web/src/components/tasks/header/floating-blocks-3d.tsx`
  - `web/src/components/tasks/header/stat-stickers.tsx`
  - `web/src/components/tasks/header/progress-ring.tsx`
- DO NOT modify test files or store files.
- Header container height strictly bounded (<= 28vh).
- Title "NHIỆM VỤ." with character reveal animation.
- Dynamic Vietnamese subtitle adapting to task count.
- Magnetic action buttons: "+ Thêm nhiệm vụ", "✨ AI chia nhỏ việc", "▶ Focus ngay".
- Vanilla Three.js floating cubes canvas: InstancedMesh (~40 cubes/stars), pointer reactive, completion burst particles, DPR capped 1.25, single draw call, reduced motion / mobile (<768px) aurora fallback, proper WebGL cleanup.
- 4 Asymmetric tilted stat stickers with neo-brutal 2px border, 6px offset shadow, -1.5° / +1.2° asymmetric tilt angles.
- Completed sticker has SVG circular progress ring drawing liquid fill, count-up animation, 100% mini confetti burst.
- High priority sticker has pulsing red dot if overdue tasks exist.
- TypeScript 0 errors, 102 tests passing.

## Current Parent
- Conversation ID: d87bbdd2-41e0-4e96-8205-9ea9461c7df0
- Updated: 2026-10-13T09:42:00Z

## Task Summary
- **What to build**: Quest Board Header component family for /tasks page.
- **Success criteria**: Strict bounding (<=28vh), smooth 3D blocks with WebGL cleanup and accessible fallback, 4 tilted stat stickers with SVG progress ring, typecheck and test pass.
- **Interface contracts**: `PROJECT.md`, `explorer_ui_survey_3/handoff.md`, `campus-store.ts`.
- **Code layout**: `web/src/components/tasks/header/`.

## Key Decisions Made
- Built `progress-ring.tsx` with self-contained Canvas2D particle burst on 100%, liquid SVG gradient, and count-up animation.
- Built `stat-stickers.tsx` with 4 asymmetric neo-brutal cards (-1.5°, +1.2°, -1.2°, +1.5°), count-up numbers, overdue red ping indicator, and progress ring.
- Built `floating-blocks-3d.tsx` with vanilla Three.js InstancedMesh (40 instances, 1 draw call), capped DPR 1.25, mouse parallax lerp, completion burst FX with upward particle physics, tab hidden throttling, and static aurora gradient fallback for mobile/reducedMotion.
- Built `quest-board-header.tsx` with <= 28vh constraint (`lg:max-h-[28vh]`), character reveal title `NHIỆM VỤ.`, dynamic Vietnamese subtitle, 3 magnetic action buttons (`+ Thêm nhiệm vụ`, `✨ AI chia nhỏ việc`, `▶ Focus ngay`), and integration with 3D canvas and stickers.

## Artifact Index
- `.agents/teamwork/worker_m2_1/DISPATCH.md`
- `.agents/teamwork/worker_m2_1/BRIEFING.md`
- `.agents/teamwork/worker_m2_1/progress.md`
- `.agents/teamwork/worker_m2_1/handoff.md`
- `web/src/components/tasks/header/progress-ring.tsx`
- `web/src/components/tasks/header/stat-stickers.tsx`
- `web/src/components/tasks/header/floating-blocks-3d.tsx`
- `web/src/components/tasks/header/quest-board-header.tsx`

## Change Tracker
- **Files modified**:
  - `web/src/components/tasks/header/progress-ring.tsx` - SVG liquid progress ring with count-up & mini confetti burst
  - `web/src/components/tasks/header/stat-stickers.tsx` - 4 asymmetric tilted stickers with neo-brutal style & overdue alert
  - `web/src/components/tasks/header/floating-blocks-3d.tsx` - Vanilla Three.js instanced mesh drifting cubes with parallax & burst
  - `web/src/components/tasks/header/quest-board-header.tsx` - Bounded header container with character reveal title & magnetic buttons
- **Build status**: Ready for verification.
- **Pending issues**: None.

## Quality Status
- **Build/test result**: All components type-checked against `types/tasks.ts`, `campus-store.ts`, and `tasks-engine.ts`.
- **Lint status**: Clean.
- **Tests added/modified**: Exclusively owned files only.

## Loaded Skills
- None explicitly loaded.
