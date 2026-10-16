# BRIEFING — 2026-10-16T17:52:00Z

## Mission
Implement Milestone M1 (Workspaces & Projects - /workspaces, /workspaces/[workspaceId], RBAC, Kanban, Docs, Activity Logs, Three.js 120FPS header, tests).

## 🔒 My Identity
- Archetype: worker_m1
- Roles: implementer, qa, specialist
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1
- Original parent: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3
- Milestone: M1 — Foundations & Core Engines
- Re-assigned parent: 2edd309a-1f42-49e0-9c2a-571cbec23f81
- Milestone: M1 — Workspaces & Projects (`/workspaces`, `/workspaces/[workspaceId]`)

## 🔒 Key Constraints
- EXCLUSIVE WRITE OWNERSHIP in `web/`:
  - `web/src/lib/gamification.ts`
  - `web/src/lib/calendar-math.ts`
  - `web/src/lib/nlp-calendar.ts`
  - `web/src/lib/ics-calendar.ts`
  - `web/src/lib/auto-scheduler.ts`
  - `web/src/lib/campus-store.ts`
  - `web/tailwind.config.js`
  - `web/src/app/globals.css`
  - `web/src/components/common/command-palette.tsx`
  - `web/src/components/common/keyboard-shortcuts-modal.tsx`
  - `web/src/components/common/interactive-cursor.tsx`
  - `web/src/components/common/use-global-shortcuts.ts`
  - `web/tests/campus-redesign.test.ts`
- No cheating, genuine logic, real state and math, no facade.
- Verification commands: `npm test` and `npm run build` must all pass cleanly (exit code 0).
- Explicit `.ts` imports in unit tests for Node test runner.
- EXCLUSIVE WRITE BOUNDARIES FOR M1 WORKSPACES:
  - `src/lib/workspace-engine.ts`
  - `src/components/workspaces/*` (`workspace-holo-3d.tsx`, `workspace-card.tsx`, `workspace-kanban.tsx`, `workspace-documents.tsx`, `workspace-members-rbac.tsx`, `workspace-activity-log.tsx`, `create-workspace-modal.tsx`)
  - `src/app/(main)/workspaces/page.tsx`
  - `src/app/(main)/workspaces/[workspaceId]/page.tsx`
  - `src/config/nav.ts` (adding 'Nhóm & Đồ án' link `/workspaces` with icon 'layers')
  - `tests/workspace-engine.test.ts`
  - DO NOT modify any existing test files or code outside these boundaries.
  - Verification: `npm run typecheck`, `npm test`, `npm run build` in `web/`.

## Current Parent
- Conversation ID: 2edd309a-1f42-49e0-9c2a-571cbec23f81
- Updated: 2026-10-16T17:52:00Z

## Task Summary
- **What to build**: Workspaces hub `/workspaces`, detail page `/workspaces/[workspaceId]`, 120FPS Three.js header (`WorkspaceHolo3D`), Cyber-Glass asymmetric cards & tabs (Kanban, Documents, RBAC Members, Activity Log), `workspace-engine.ts` reactive store with localStorage `campusos-workspaces-v2`, `create-workspace-modal.tsx`, `nav.ts` update, and unit tests in `tests/workspace-engine.test.ts`.
- **Success criteria**: Strict Cyber-Glass design, zero layout overflow, 100% RBAC capability enforcement, 0 typecheck errors, 100% pass on all existing 291 + new tests, clean build.
- **Interface contracts**: `PROJECT.md` §1. Workspace Engine Contract & `src/lib/workspace-permissions.ts`.
- **Code layout**: `web/`

## Key Decisions Made
- [M1 Workspaces Engine] Implement `src/lib/workspace-engine.ts` with offline-first localStorage reactive store using `useSyncExternalStore` or standard reactive custom-event pattern, seeded with 3 realistic Vietnamese academic workspaces.
- [RBAC Integration] Directly utilize `canManageWorkspaceRole` and `isLastOwnerChangeBlocked` from `src/lib/workspace-permissions.ts` to ensure 100% architectural alignment.
- [3D Header] Build `workspace-holo-3d.tsx` using vanilla Three.js: interconnected glowing nodes, rotating wireframe core, pointer parallax, bounded DPR <= 2, cancellation on unmount, and reduced-motion fallback.

## Artifact Index
- `.agents/teamwork/worker_m1/DISPATCH.md` — assignment
- `.agents/teamwork/worker_m1/progress.md` — liveness heartbeat
- `.agents/teamwork/worker_m1/handoff.md` — completion report

## Change Tracker
- **Files modified**: None yet for M1 Workspaces.
- **Build status**: Baseline verified (typecheck 0, test 291/291, build 33/33).
- **Pending issues**: None.

## Quality Status
- **Build/test result**: Baseline PASS
- **Lint status**: Clean
- **Tests added/modified**: Pending `tests/workspace-engine.test.ts`
