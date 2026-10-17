# BRIEFING — 2026-10-17T07:23:00Z

## Mission
Survey Layout, Three.js 3D components, and visual styling for Auth redesign (Split-screen 50/50, 3D Hologram stage, Feature Carousel, mobile aurora, responsive design).

## 🔒 My Identity
- Archetype: explorer
- Roles: survey, layout/3D analysis, technical design synthesis
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\survey_explorer_1
- Original parent: 29257fd0-4cce-43cc-906d-4f5f80b1ce6e
- Milestone: Auth Redesign Layout & 3D Survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement production source code
- Adhere strictly to ORIGINAL_REQUEST.md requirements
- Report written to handoff.md in working directory
- Keep progress.md updated as heartbeat

## Current Parent
- Conversation ID: 29257fd0-4cce-43cc-906d-4f5f80b1ce6e
- Updated: 2026-10-17T07:18:30Z

## Investigation State
- **Explored paths**:
  - `web/src/app/(auth)/layout.tsx` (current minimalist 1-column layout)
  - `web/src/app/(auth)/login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx`, `verify-email/page.tsx`
  - `web/src/components/study/leaderboard-3d-arena.tsx` (Three.js 3D patterns, disposal, pointer tracking)
  - `web/src/components/coach/quantum-orb-3d.tsx` (faceted icosahedron crystal, wireframe cage, gyroscopic rings)
  - `web/src/components/tasks/create/quick-task-backdrop-3d.tsx` (particles, pointer parallax, disposal)
  - `web/package.json` (vanilla three 0.186.1, tailwindcss-animate, no R3F, lucide-react)
  - `web/tailwind.config.js` (aurora palette, neo-brutal tokens, animate-panic-shake, font families)
  - `web/src/app/globals.css` (cyber-glass, neo-card, aurora blobs)
  - `web/src/lib/auth.ts`, `web/src/lib/auth-context.tsx`, `web/src/app/api/auth/login/route.ts`
  - `web/tests/study-rooms-m4-leaderboard.test.ts` (test structure for Three.js components)
- **Key findings**:
  - Vanilla Three.js is established standard across CampusOS without `@react-three/fiber`. Strict disposal array (`geometriesToDispose`, `materialsToDispose`, `renderer.dispose()`, `cancelAnimationFrame`) is mandatory.
  - Split-screen layout requires `lg:h-screen lg:overflow-hidden` on desktop with `overflow-y-auto scrollbar-thin` on the right form panel to prevent double scrollbars.
  - Mobile/tablet (<1024px) collapses to single column with fluid ambient aurora background.
  - Dynamic Feature Carousel showcases "Bộ Ba Siêu Năng" (Mèo Cam Giám Sát, AI Study Hub, Pomodoro Party) with 5s auto-slide, hover pause, live stats, and daily quote.
  - Tailwind already has `animate-panic-shake` configured for login failure shake micro-interaction.
  - Baseline `npm test` passes 643/643 tests; `npm run typecheck` has 0 errors.
- **Unexplored areas**: None for layout/3D survey scope. Ready for report synthesis.

## Key Decisions Made
- Architected Split-Screen 50/50 container with stationary visual stage on left and internally scrollable form container on right.
- Synthesized `Auth3DShowcase` based on `quantum-orb-3d.tsx` faceted crystal + wireframe cage + gyroscopic rings + cyan/violet spotlights.
- Designed `AuthFeatureCarousel` with data array for "Bộ Ba Siêu Năng", live stats, and student quotes.
- Formulated `web/tests/auth-redesign.test.ts` suite to verify layout, Three.js contracts, and feature carousel data.

## Artifact Index
- DISPATCH.md — record of orchestrator instructions
- BRIEFING.md — working memory and identity
- progress.md — liveness heartbeat
- handoff.md — final comprehensive report
