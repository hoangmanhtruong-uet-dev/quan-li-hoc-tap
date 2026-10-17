# BRIEFING — 2026-10-17T02:12:00Z

## Mission
Implement Milestone 4: Web App Bridge, Supabase -50 XP Penalty & Realtime Popup for CampusOS.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m4_1
- Original parent: 051c51ec-d4c0-431c-b685-75179c16a0da
- Milestone: M4 (Web App Bridge, Supabase -50 XP & Realtime Popup)

## 🔒 Key Constraints
- Exclusive write ownership:
  - supabase/migrations/004_extension_focus_violations.sql
  - web/src/types/database.ts
  - web/src/lib/campus-store.ts
  - web/src/lib/supabase-sync.ts
  - web/src/features/pomodoro/use-extension-bridge.ts
  - web/src/app/api/focus/violation/route.ts
  - extension/popup/popup.html
  - extension/popup/popup.js
  - extension/popup/popup.css
  - web/tests/extension-sync-penalty.test.ts
- Do NOT touch or modify any other files.
- DO NOT CHEAT: Genuine implementations only, maintain real state, no hardcoded results.
- 100% test pass (npm test), 0 typecheck errors, successful build.

## Current Parent
- Conversation ID: 051c51ec-d4c0-431c-b685-75179c16a0da
- Updated: 2026-10-17T02:12:00Z

## Task Summary
- **What to build**:
  1. Migration `004_extension_focus_violations.sql`: DDL adding `violation_count` column to `profiles`, `student_profiles`, and `student_focus_sessions`, with performance index and documentation comments.
  2. Database types `database.ts`: updated `profiles`, `student_profiles`, and `student_focus_sessions` Row, Insert, and Update contracts with `violation_count`.
  3. Shared store `campus-store.ts`: exported `penalizeViolation(amount = 50, reason)` enforcing 0 XP floor clamp, level demotion/rank recalculation, incrementing `violationCount` and `totalShameCount`, and debounced sync.
  4. Sync engine `supabase-sync.ts`: exported `recordFocusViolationToSupabase(...)` with offline mutation queue fallback and optimistic profile/session updates.
  5. Extension bridge hook `use-extension-bridge.ts`: 2-way communication via window.postMessage relay and runtime messaging, sending focus lifecycle events and catching `EXTENSION_VIOLATION` to penalize XP.
  6. API route `/api/focus/violation/route.ts`: POST endpoint validating payload, updating Supabase when online, and returning mock confirmation in dev/offline.
  7. Extension Popup (`popup.html`, `popup.js`, `popup.css`): Cyber-Glass 360x480 card, real-time synced `MM:SS` Pomodoro timer, blacklist manager (add/remove/reset 14 defaults), and AI webcam toggle.
  8. Comprehensive unit test suite `extension-sync-penalty.test.ts`: 15 unit tests covering all functional requirements.
- **Success criteria**: 100% test pass (505/505 tests), 0 typecheck errors, successful build (33/33 static pages + API routes).
- **Interface contracts**: PROJECT.md § Interface Contracts
- **Code layout**: PROJECT.md § Code Layout

## Key Decisions Made
- Used `(window as any).chrome` in `use-extension-bridge.ts` to prevent missing global type errors in standard TypeScript configuration while maintaining browser runtime compatibility.
- Used `import { NextRequest, NextResponse } from 'next/server.js'` in `route.ts` to support both Next.js App Router and Node `--experimental-strip-types` direct test runner.
- Enforced strict 0 XP floor clamping (`Math.max(0, prev.xp - safeAmount)`) to prevent negative XP balances.

## Artifact Index
- `.agents/teamwork/worker_m4_1/DISPATCH.md` — Assigned dispatch instructions
- `.agents/teamwork/worker_m4_1/BRIEFING.md` — Persistent working memory
- `.agents/teamwork/worker_m4_1/progress.md` — Heartbeat and step tracking
- `.agents/teamwork/worker_m4_1/handoff.md` — Final 5-component handoff report

## Change Tracker
- `supabase/migrations/004_extension_focus_violations.sql`: DDL adding `violation_count` to `profiles`, `student_profiles`, `student_focus_sessions`.
- `web/src/types/database.ts`: Added `violation_count` to Row/Insert/Update types and exported convenience aliases.
- `web/src/lib/campus-store.ts`: Added `penalizeViolation`, `setSharedState`, and `violationCount`/`totalShameCount` to shared state.
- `web/src/lib/supabase-sync.ts`: Exported `recordFocusViolationToSupabase`, handled `student_focus_sessions` in offline queue.
- `web/src/features/pomodoro/use-extension-bridge.ts`: Created bidirectional hook & helper functions for Web App ↔ Extension.
- `web/src/app/api/focus/violation/route.ts`: Created POST route for logging focus discipline violations.
- `extension/popup/popup.html`: Built 360x480 Cyber-Glass popup structure.
- `extension/popup/popup.js`: Built real-time Pomodoro countdown sync, blacklist manager, and webcam toggle.
- `extension/popup/popup.css`: Built Cyber-Glass styling with neon lime and neon rose tokens.
- `web/tests/extension-sync-penalty.test.ts`: Created 15 comprehensive unit tests.

## Quality Status
- **Build/test result**: PASS (505 passed across 33 test suites; Next.js 33/33 pages built successfully)
- **Lint status**: 0 errors
- **Tests added/modified**: 15 tests in `extension-sync-penalty.test.ts`

## Loaded Skills
- **Source**: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agent\skills\verification-before-completion\SKILL.md
- **Core methodology**: Verify and confirm test output before making completion claims.
- **Source**: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agent\skills\supabase-postgres-best-practices\SKILL.md
- **Core methodology**: Safe Postgres schema migrations, idempotent DDL, and performant indexing/querying.
