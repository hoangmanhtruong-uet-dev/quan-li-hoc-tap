# BRIEFING — 2026-10-16T18:54:00Z

## Mission
Implement the full user-facing and state layer for Milestone M3: Hồ sơ, Thông báo & Cài đặt (`/profile`, `/notifications`, `/settings`) according to PROJECT.md and the Explorer R3 survey findings, with 100% Quality Gates (typecheck 0 errors, npm test pass, npm run build pass).

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_r3_profile\
- Original parent: 2edd309a-1f42-49e0-9c2a-571cbec23f81
- Milestone: M3 (Profile, Notifications & Settings)

## 🔒 Key Constraints
- DO NOT CHEAT: Genuine implementations only, no hardcoded test shortcuts or facade data.
- Strict single-viewport containment: `overflow-x-hidden min-w-0` on all container layouts.
- Cyber-Glass aesthetic: `backdrop-blur-2xl bg-card/40 border border-white/10 hover:border-cyan-400/30`, ambient aurora glows.
- Do NOT touch M1 (`workspaces`) or M2 (`clubs`) files.
- Exclusive write boundaries:
  - `src/lib/notifications-engine.ts`
  - `src/components/profile/*`
  - `src/components/notifications/*`
  - `src/components/settings/*`
  - `src/app/(main)/profile/page.tsx`
  - `src/app/(main)/notifications/page.tsx`
  - `src/app/(main)/settings/page.tsx`
  - `tests/profile-notifications-settings.test.ts`
- Verification: `npm run typecheck`, `npm test`, `npm run build` must pass cleanly.

## Current Parent
- Conversation ID: 2edd309a-1f42-49e0-9c2a-571cbec23f81
- Updated: 2026-10-16T18:54:00Z

## Task Summary
- **What to build**: Rebuild `/profile` (holographic card with 3D tilt & sheen, 6-axis SVG radar chart, graduation credit stats, badges showcase), `/notifications` (4 dedicated tabs, notifications-engine synthesis, delete with 5s undo, live urgency < 12h badge), `/settings` (Cyber Aurora / theme & reduced motion sync, Pomodoro supervisor preserved, change password modal, 2FA setup modal with QR & TOTP, Google Calendar sync card with ICS export), and comprehensive unit tests.
- **Success criteria**: 0 typecheck errors, 100% test pass (324 tests), clean build (34 routes).
- **Interface contracts**: PROJECT.md § Interface Contracts #3.
- **Code layout**: PROJECT.md § Code Layout.

## Key Decisions Made
- Use CSS 3D transforms (`perspective(1100px) rotateX(...) rotateY(...)`) for holographic card for 120FPS performance with zero GPU overhead.
- Pure SVG 6-axis radar chart with mathematical normalization and hover vertex pings.
- Notifications engine synthesizing campus-store deadlines & events with admin notices and <12h urgency detector.
- Settings Google Calendar sync with RFC-5545 `.ics` export and TOTP 2FA simulation.
- All core math and validation functions exported from `src/lib/notifications-engine.ts` so Node.js native test runner (`--experimental-strip-types`) can test them with zero JSX parsing errors.

## Artifact Index
- `src/lib/notifications-engine.ts`
- `src/components/profile/holographic-student-card.tsx`
- `src/components/profile/competence-radar-chart.tsx`
- `src/components/profile/academic-credit-stats.tsx`
- `src/components/profile/achievements-showcase.tsx`
- `src/components/notifications/notifications-manager.tsx`
- `src/components/settings/google-calendar-sync-card.tsx`
- `src/components/settings/security-2fa-modal.tsx`
- `src/components/settings/change-password-modal.tsx`
- `src/app/(main)/profile/page.tsx`
- `src/app/(main)/notifications/page.tsx`
- `src/app/(main)/settings/page.tsx`
- `tests/profile-notifications-settings.test.ts`
- `.agents/teamwork/worker_r3_profile/handoff.md`

## Change Tracker
- **Files created/modified**:
  - `src/lib/notifications-engine.ts`: Core notification synthesis, 4 tabs, undo deletion, radar math, credit math, badge unlock rules, password strength, 2FA validation, GCal sync config.
  - `src/components/profile/holographic-student-card.tsx`: 3D tilt card, golden chip, QR pass, student ID copy, avatar uploader.
  - `src/components/profile/competence-radar-chart.tsx`: 6-axis SVG radar chart, hover tooltips, overall index badge.
  - `src/components/profile/academic-credit-stats.tsx`: 94/135 credits (69.6%), credit breakdown, CPA 3.62, semester GPA history.
  - `src/components/profile/achievements-showcase.tsx`: Tiered badges (Đồng, Bạc, Vàng, Cyber), unlock detail modal.
  - `src/components/notifications/notifications-manager.tsx`: 4 tabs, urgency indicator, bulk actions, 5-second undo toast.
  - `src/components/settings/google-calendar-sync-card.tsx`: connection status, interval selector, category checkboxes, instant sync, RFC 5545 .ics export.
  - `src/components/settings/security-2fa-modal.tsx`: QR code, secret key, 6-digit TOTP input, backup recovery codes.
  - `src/components/settings/change-password-modal.tsx`: password inputs, live strength meter, validation.
  - `src/app/(main)/profile/page.tsx`: Rebuilt Cyber-Glass profile page.
  - `src/app/(main)/notifications/page.tsx`: Rebuilt Cyber-Glass notifications page.
  - `src/app/(main)/settings/page.tsx`: Rebuilt Cyber-Glass settings page with Cyber Aurora, motion sync, and Pomodoro supervisor.
  - `tests/profile-notifications-settings.test.ts`: 17 comprehensive unit tests.
- **Build status**: PASS (Exit code 0, 324/324 tests passing, 34/34 routes built).
- **Pending issues**: None.

## Quality Status
- **Build/test result**: 324 passed across 18 test suites in 2.8s.
- **Lint status**: 0 errors.
- **Tests added/modified**: 17 tests added in `tests/profile-notifications-settings.test.ts`.

## Loaded Skills
- `verification-before-completion`: Evidence before assertions always. Ran typecheck, test, and build before claiming completion.
- `design-taste-frontend`: Cyber-Glass design system, frosted glassmorphism, 1px neon borders, fluid aurora glows, bounded single-viewport.
