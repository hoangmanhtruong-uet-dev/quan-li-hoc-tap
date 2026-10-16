# BRIEFING — 2026-10-13T02:27:00Z

## Mission
Implement the Milestone 2 Dashboard remedies: eliminate falsy coercion & compute genuine urgency/panic in dashboard-hero.tsx, create QuickTaskModal & integrate Voice Brain-Dump in page.tsx, recalculate Level/RankTitle on deadline completion in deadline-arena.tsx, and dynamically bind Concert-Ticket exam countdown/dates in squad-kanban-exam.tsx.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m2_remedy
- Original parent: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3 (orchestrator_7)
- Milestone: M2 Remedy

## 🔒 Key Constraints
- EXCLUSIVE WRITE OWNERSHIP (Only modify these files in web/):
  - web/src/components/dashboard/dashboard-hero.tsx
  - web/src/components/dashboard/deadline-arena.tsx
  - web/src/components/dashboard/squad-kanban-exam.tsx
  - web/src/components/dashboard/quick-task-modal.tsx
  - web/src/app/(main)/dashboard/page.tsx
- In web/tests/, can enhance unit tests if needed (e.g. tests/campus-redesign.test.ts)
- DO NOT CHEAT: All implementations genuine, maintain real state, no hardcoded values.
- Verify npm test, npm run typecheck, npm run build exit code 0 with 0 errors.

## Current Parent
- Conversation ID: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3
- Updated: 2026-10-13T02:27:00Z

## Task Summary
- **What to build**:
  1. Fix `dashboard-hero.tsx`: Remove `|| 1` and `|| 3`, compute genuine `urgentCount` and `hasPanicDeadline` (< 3h remaining for uncompleted urgent deadlines), clean subtitle.
  2. Create `quick-task-modal.tsx`: Accessible Neo-Brutal inline task modal.
  3. Wire `quick-task-modal.tsx` into `dashboard/page.tsx`: Replace `window.prompt`, handle `campusos:quick-create-task` detail.initialTitle from Voice Brain-Dump.
  4. Fix `deadline-arena.tsx`: Import `calculateLevelProgress` from `@/lib/gamification` and update `xp`, `level`, `rankTitle` when completing a deadline.
  5. Fix `squad-kanban-exam.tsx`: Dynamically compute countdown and format date stub for nearest upcoming exam.
- **Success criteria**:
  - `npm test`, `npm run typecheck`, `npm run build` all pass with exit code 0.
- **Interface contracts**: `PROJECT.md` § Interface Contracts
- **Code layout**: `PROJECT.md` § Code Layout

## Key Decisions Made
- Follow the exact blueprints from explorer_m2_remedy_1, explorer_m2_remedy_2, explorer_m2_remedy_3.

## Artifact Index
- `.agents/teamwork/worker_m2_remedy/DISPATCH.md` — assignment
- `.agents/teamwork/worker_m2_remedy/BRIEFING.md` — persistent memory
- `.agents/teamwork/worker_m2_remedy/progress.md` — liveness heartbeat
- `.agents/teamwork/worker_m2_remedy/handoff.md` — final completion report

## Change Tracker
- **Files modified**: pending implementation
- **Build status**: pending
- **Pending issues**: none

## Quality Status
- **Build/test result**: pending
- **Lint status**: pending
- **Tests added/modified**: pending
