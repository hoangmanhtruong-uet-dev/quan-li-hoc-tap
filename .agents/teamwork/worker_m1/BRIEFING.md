# BRIEFING — 2026-10-17T07:29:30Z

## Mission
Implement Milestone M1: Symmetrical 50/50 Split-Screen layout `(auth)/layout.tsx`, Vanilla Three.js 3D Hologram stage `auth-3d-showcase.tsx`, and Dynamic Feature Carousel "Bộ Ba Siêu Năng" `auth-feature-carousel.tsx`.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1
- Original parent: 29257fd0-4cce-43cc-906d-4f5f80b1ce6e
- Milestone: M1

## 🔒 Key Constraints
- EXCLUSIVE WRITE OWNERSHIP:
  - web/src/app/(auth)/layout.tsx
  - web/src/components/auth/auth-3d-showcase.tsx
  - web/src/components/auth/auth-feature-carousel.tsx
  (Do NOT touch files outside exclusive ownership)
- Mandatory Integrity: No cheating, no fake mocks/stubs, genuine implementation.
- Quality Gates: npm run typecheck 0 errors, npm test 100% pass (0 regressions).
- Vanilla Three.js: No `@react-three/fiber` or `@react-three/drei`. Strict WebGL disposal of all geometries, materials, renderer, event listeners, and animation frames.
- Desktop 50/50 split with `lg:h-screen lg:overflow-hidden` preventing outer double scrollbars. Internal scroll on right form pane (`overflow-y-auto scrollbar-thin`).
- Mobile/Tablet `< 1024px` single fluid column with GPU CSS Fluid Ambient Aurora blobs, hiding heavy 3D canvas for 120FPS performance.

## Current Parent
- Conversation ID: 29257fd0-4cce-43cc-906d-4f5f80b1ce6e
- Updated: 2026-10-17T07:29:30Z

## Task Summary
- **What to build**:
  1. `web/src/components/auth/auth-3d-showcase.tsx`: Hologram Knowledge Sphere / Cyber-Glass crystal with faceted Icosahedron core, wireframe cage, 3 gyroscopic Torus orbital rings, 140 particles, dual Cyan/Violet spotlights, pointer tracking with lerp damping, reduced motion fallback, strict disposal.
  2. `web/src/components/auth/auth-feature-carousel.tsx`: 5s auto-sliding carousel of "Bộ Ba Siêu Năng", pause on hover, navigation buttons, slide indicators, live student stats ("12,450+ giờ học hôm nay", "4,800+ sinh viên online", "99.2% qua môn"), inspiring quotes.
  3. `web/src/app/(auth)/layout.tsx`: Desktop 50/50 split screen with fixed viewport height, right panel internal scroll, mobile single-column with ambient aurora.
- **Success criteria**:
  - Full adherence to specifications in `ORIGINAL_REQUEST.md`, `PROJECT.md`, and `survey_explorer_1/handoff.md`.
  - Typecheck passes 100% (Verified 0 errors).
  - `npm test` passes 100% (Verified 643/643 passed).
- **Interface contracts**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md`
- **Code layout**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md § Code Layout`

## Change Tracker
- **Files modified**:
  - `web/src/components/auth/auth-3d-showcase.tsx` — Created Vanilla Three.js Hologram Knowledge Sphere stage
  - `web/src/components/auth/auth-feature-carousel.tsx` — Created dynamic "Bộ Ba Siêu Năng" carousel with live stats & quotes
  - `web/src/app/(auth)/layout.tsx` — Rebuilt Split-Screen 50/50 Desktop & Fluid Aurora Mobile layout
- **Build status**: `npm run typecheck` passed (0 errors), `npm test` passed (643/643 passed)
- **Pending issues**: None

## Quality Status
- **Build/test result**: Passing (643 passed, 0 failed, 0 typecheck errors)
- **Lint status**: Clean
- **Tests added/modified**: Milestone M1 files verified against contract

## Loaded Skills
- Source: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agent\skills\verification-before-completion\SKILL.md
- Source: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agent\skills\vercel-react-best-practices\SKILL.md
- Source: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agent\skills\design-taste-frontend\SKILL.md

## Key Decisions Made
- Dynamic import of `Auth3DShowcase` in `layout.tsx` with `ssr: false` to ensure seamless SSR hydration while Three.js renders purely client-side.
- Clamping device pixel ratio to `Math.min(window.devicePixelRatio || 1, 1.5)` for optimal 120FPS rendering without GPU throttling.
- Bounded 50/50 desktop split with `lg:h-screen lg:overflow-hidden` preventing outer double scrollbars.
- Strict cleanup array pattern (`geometriesToDispose`, `materialsToDispose`) disposing all WebGL resources on unmount.

## Artifact Index
- `handoff.md` — Final 5-component handoff report
