## 2026-10-13T09:32:28Z
You are Worker M2 for Milestone 2 (Quest Board Header & 3D Blocks) of the CampusOS /tasks page rebuild project.

Your assigned working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m2_1\
Your parent conversation ID: d87bbdd2-41e0-4e96-8205-9ea9461c7df0

Input files to read FIRST:
1. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically timestamp ## 2026-10-13T07:48:15Z)
2. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
3. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_ui_survey_3\handoff.md (detailed UI tokens, Three.js instanced mesh pattern, and StrictPomodoroModal integration)
4. `web/src/features/pomodoro/talking-tom-3d.tsx` (reference for vanilla Three.js setup & cleanup in Next.js)
5. `web/src/lib/campus-store.ts` (store hook `useCampusStore`, state fields, task items)

EXCLUSIVE WRITE OWNERSHIP:
You exclusively own and may create/modify:
- `web/src/components/tasks/header/quest-board-header.tsx`
- `web/src/components/tasks/header/floating-blocks-3d.tsx`
- `web/src/components/tasks/header/stat-stickers.tsx`
- `web/src/components/tasks/header/progress-ring.tsx`
DO NOT modify test files or store files.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objective & Requirements:
1. Header container (`quest-board-header.tsx`):
   - Height strictly bounded (<= 28vh).
   - Large display title `NHIỆM VỤ.` with character reveal animation.
   - Dynamic Vietnamese subtitle adapting to task count:
     - Has overdue: "Trễ rồi bro, làm nhanh còn kịp 🫠"
     - Remaining > 0: "Còn {count} việc, cân được 💪"
     - Remaining === 0: "Sạch bách, đi chơi được rồi 🎉"
   - Magnetic action button group:
     - `+ Thêm nhiệm vụ` (signature green/lime accent `#3DFFB0`)
     - `✨ AI chia nhỏ việc`
     - `▶ Focus ngay` (triggers Focus Mode with most urgent task)
   - Integrates `FloatingBlocks3D` and `StatStickers`.
2. Vanilla Three.js floating cubes canvas (`floating-blocks-3d.tsx`):
   - Use vanilla Three.js (`import * as THREE from 'three'`), NO `@react-three/fiber`.
   - `THREE.InstancedMesh` with ~40 drifting cubes/stars.
   - Pointer reactive: mousemove creates subtle rotational drift and camera parallax.
   - Task completion event listener (or prop trigger): bursts a random cube upward into particles.
   - Performance: DPR capped at 1.25, single draw call, zero GPU lag, 120FPS.
   - Fallback & Accessibility: check `reducedMotion` from store and mobile screen width (< 768px) -> disable 3D WebGL canvas and render static ambient aurora gradient fallback.
   - Proper lifecycle cleanup: cancel `requestAnimationFrame`, dispose geometries, materials, and renderer on unmount.
3. 4 Asymmetric tilted stat stickers (`stat-stickers.tsx` & `progress-ring.tsx`):
   - 1. Tổng nhiệm vụ (Total tasks)
   - 2. Đang thực hiện (In progress)
   - 3. Ưu tiên cao (High priority with pulsing red dot if overdue tasks exist)
   - 4. Hoàn thành (Completed with SVG circular progress ring drawing liquid fill, count-up animation, 100% -> mini confetti burst).
   - Sticker styles: neo-brutal 2px border, 6px offset shadow, -1.5° / +1.2° asymmetric tilt angles.

Verification Requirement:
- Run `npm run typecheck` in `web/` to confirm 0 TypeScript errors.
- Run `npm test` in `web/` to verify all 102 tests continue to pass with 0 failures.
- Document exact verification outputs in your handoff report.

Deliverable:
Write report to `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m2_1\handoff.md`.
Send completion message to parent (`d87bbdd2-41e0-4e96-8205-9ea9461c7df0`).
