# BRIEFING — 2026-10-13T02:26:00Z

## Mission
Formulate exact remedy blueprint for deadline-arena.tsx and squad-kanban-exam.tsx to address Milestone 2 gate feedback.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigator, synthesizer
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_remedy_3
- Original parent: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3
- Milestone: milestone_2_remedy

## 🔒 Key Constraints
- Read-only investigation — do NOT implement / modify source code files
- Formulate exact blueprint with before/after code snippets in handoff.md
- Verify types and functions in store and gamification

## Current Parent
- Conversation ID: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3
- Updated: 2026-10-13T02:26:00Z

## Investigation State
- **Explored paths**:
  - `web/src/components/dashboard/deadline-arena.tsx` (lines 30, 160-175)
  - `web/src/components/dashboard/squad-kanban-exam.tsx` (lines 240-270, 569-677, 700-715)
  - `web/src/lib/gamification.ts` (`calculateLevelProgress`, `LevelProgress`)
  - `web/src/lib/campus-store.ts` (`useCampusStore`, `CampusOSSharedState`, `DeadlineItem`, `dsa-final`)
  - `reviewer_m2_1/handoff.md` and `challenger_m2_1/handoff.md`
- **Key findings**:
  - `deadline-arena.tsx`: `handleToggleDeadline` directly increments `prev.xp + 50` without recalculating `level` and `rankTitle`. `recordSession(0, 100)` awards 0 XP. Solution: import `calculateLevelProgress` from `@/lib/gamification` and update `xp`, `level`, `rankTitle`.
  - `squad-kanban-exam.tsx`: Hardcodes `days: 8, hours: 14...` and static "Tháng 8, 28, Thứ Năm" date stub and "28/08" in AI modal. Solution: Dynamically find nearest exam (or `dsa-final`) in `state.deadlines`, parse its date, compute real clock delta `diff = examDate.getTime() - now`, and format month, day, weekday, and short date dynamically in Vietnamese.
- **Unexplored areas**: None for this assignment scope.

## Key Decisions Made
- Confirmed exact signatures and type shapes in `gamification.ts` and `campus-store.ts`.
- Structured complete before/after replacement code chunks and logic proofs in `handoff.md`.

## Artifact Index
- handoff.md — Comprehensive blueprint and fix strategy for implementer
