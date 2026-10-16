# BRIEFING — 2026-10-13T08:33:00Z

## Mission
Implement Milestone 1 (Store, Types & Tasks Engine) for the CampusOS /tasks page rebuild project.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1_1\
- Original parent: d87bbdd2-41e0-4e96-8205-9ea9461c7df0
- Milestone: Milestone 1 - Store, Types & Tasks Engine

## 🔒 Key Constraints
- EXCLUSIVE WRITE OWNERSHIP: Only modify web/src/types/tasks.ts, web/src/lib/tasks-engine.ts, web/src/lib/campus-store.ts
- DO NOT touch any test files or other UI components in this milestone
- Zero regression: All 33 existing tests must pass, 0 typecheck errors
- Honest implementation: Real logic, pure deterministic functions, no hardcoding or dummy facades

## Current Parent
- Conversation ID: d87bbdd2-41e0-4e96-8205-9ea9461c7df0
- Updated: 2026-10-13T08:33:00Z

## Task Summary
- **What to build**: Task data model (`tasks.ts`), Pure calculation and NLP parsing engine (`tasks-engine.ts`), Extended CampusOS state store with task actions, XP/streak/gamification integration (`campus-store.ts`).
- **Success criteria**: Strict TypeScript typing, complete engine functions with referenceDate support, reactive store actions with state persistence and gamification bonuses, `npm test` (73/73 pass) and `npm run typecheck` (0 errors) passing.
- **Interface contracts**: PROJECT.md, spec_miner handoff, explorer handoff.
- **Code layout**: web/src/types/tasks.ts, web/src/lib/tasks-engine.ts, web/src/lib/campus-store.ts

## Key Decisions Made
- `web/src/types/tasks.ts`: Fully defined `TaskStatus`, `TaskPriority`, `EisenhowerQuadrant`, `TaskDateGroupKey`, `TaskStep`, `TaskPomodoroInfo`, `TaskAttachment`, `TaskActivityLog`, `TaskItem`, `ParsedTaskResult`, `UrgencyLevel`.
- `web/src/lib/tasks-engine.ts`: Pure functions implemented with deterministic referenceDate parameter. Time-parsing handles explicit hours (e.g. 23h -> 23:00, 19h -> 19:00, 0h -> 00:00, 2h chiều -> 14:00) before duration matching, avoiding false duration collisions. Timezone consistency ensured by parsing timestamps with UTC anchor.
- `web/src/lib/campus-store.ts`: Extended `CampusOSSharedState` with `tasks: TaskItem[]`. Default seed tasks anchored around `referenceDate`. Actions `addTask`, `completeTask` (+20 XP, Clear the Board +50 XP bonus, streak check, badge awards), `updateTask`, `deleteTask`, `bulkUpdateTasks`, `toggleTaskStep`, `reorderTasks` implemented and exposed in `useCampusStore` hook.

## Change Tracker
- **Files modified**:
  - `web/src/types/tasks.ts` (created): Task data types and interfaces.
  - `web/src/lib/tasks-engine.ts` (created): Pure date grouping, Eisenhower quadrant heuristic, urgency/countdown metrics, Vietnamese NLP parser.
  - `web/src/lib/campus-store.ts` (extended): tasks collection, dynamic seed data, reactive store actions, useCampusStore hook methods.
- **Build status**: Pass (`npm run typecheck` exits 0, `npm test` passes 73/73 tests).
- **Pending issues**: None.

## Quality Status
- **Build/test result**: Pass (73/73 tests pass in 344ms).
- **Lint status**: 0 TypeScript errors.
- **Tests added/modified**: None touched by M1 (tests/tasks-redesign.test.ts created by TEST worker passed 40/40 tests).

## Loaded Skills
- **verification-before-completion**: Verified tests and typecheck before handoff report.
- **systematic-debugging**: Diagnosed time vs duration NLP regex precedence and UTC timezone normalization.

## Artifact Index
- DISPATCH.md — Task dispatch from orchestrator
- BRIEFING.md — Situational awareness
- progress.md — Liveness & progress tracking
- handoff.md — Milestone 1 handoff report
