## 2026-10-17T07:26:31Z
You are worker_m1.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1
Project Root: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap
Authoritative user request file: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md
Scope document: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
Survey blueprint: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\survey_explorer_1\handoff.md

You MUST read ORIGINAL_REQUEST.md, PROJECT.md, and survey_explorer_1's handoff.md before starting work.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP (You may only create/modify these 3 files):
- web/src/app/(auth)/layout.tsx
- web/src/components/auth/auth-3d-showcase.tsx
- web/src/components/auth/auth-feature-carousel.tsx

TASKS FOR MILESTONE M1:
1. Create web/src/components/auth/auth-3d-showcase.tsx:
   - Vanilla Three.js Hologram Knowledge Sphere / Cyber-Glass crystal.
   - Geometry: Faceted Icosahedron core (flatShading: true), outer wireframe cage (Cyan #38bdf8), 3 gyroscopic Torus orbital rings (Cyan #38bdf8, Violet #a855f7, Lime #c6ff3d), and 140 quantum stardust point nodes.
   - Lighting: Dual Spotlights in Cyan (#38bdf8) & Violet (#a855f7) with dynamic targets, and ambient light.
   - Pointer interaction: pointermove/mousemove parallax tracking with smooth lerp damping and subtle sine levitation.
   - Strict WebGL memory cleanup: cancelAnimationFrame, dispose all geometries, dispose all materials, renderer.dispose(), remove event listeners, DPR <= 1.5, tab visibility throttling, and prefers-reduced-motion fallback card.
2. Create web/src/components/auth/auth-feature-carousel.tsx:
   - Feature carousel highlighting "Bộ Ba Siêu Năng":
     1. Mèo Cam Giám Sát Cực Đoan (URL Blacklist & AI Webcam Face Tracking)
     2. AI Study Hub 1M Tokens & Flashcard 3D SM-2 (Slide PDF analysis)
     3. Đấu Trường Pomodoro Party & Bục Vinh Danh 3D (Realtime group study)
   - 5s auto-sliding with pause on hover, slide indicators, navigation buttons.
   - Live student statistics: "12,450+ giờ học hôm nay", "4,800+ sinh viên online", "99.2% qua môn".
   - Inspiring quotes box for students.
3. Rebuild web/src/app/(auth)/layout.tsx:
   - Desktop (>= 1024px): Symmetrical 50/50 Split-Screen layout, lg:h-screen lg:overflow-hidden preventing double scrollbars. Left pane mounts Auth3DShowcase and AuthFeatureCarousel; right pane has internal scrolling (overflow-y-auto scrollbar-thin) for auth forms.
   - Mobile/Tablet (< 1024px): Auto-collapses to a single fluid center column with GPU CSS Fluid Ambient Aurora, brand header, and form container.
4. Run `npm run typecheck` and `npm test` in web/ to verify 0 errors and 0 regressions.
5. Write your complete handoff report to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1\handoff.md and message orchestrator_17 when finished.
