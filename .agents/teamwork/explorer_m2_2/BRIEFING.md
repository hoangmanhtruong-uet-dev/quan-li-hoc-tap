# BRIEFING — 2026-10-13T01:53:45Z

## Mission
Design drop-in ready implementation blueprints for Dashboard S4 (AI Mascot Coach) and S5 (Stats & Goal Game HUD).

## 🔒 My Identity
- Archetype: explorer
- Roles: explorer, investigator, analyst
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_2
- Original parent: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3
- Milestone: M2 - Dashboard S4, S5 Specifications & Strategy

## 🔒 Key Constraints
- Read-only investigation — do NOT implement / modify source code directly
- Follow CampusOS neo-brutalist / vibrant design guidelines & store architecture
- Output complete structured blueprints in handoff.md

## Current Parent
- Conversation ID: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3
- Updated: 2026-10-13T01:53:45Z

## Investigation State
- **Explored paths**:
  - `web/src/lib/campus-store.ts` (state contracts, event structure, useCampusStore hook, updateSharedState)
  - `web/src/lib/gamification.ts` (LEVELS_TABLE, calculateLevelProgress, Level 7 'Sinh viên cày thuê')
  - `web/src/app/globals.css` (design tokens, neo-card, sticker-badge, theme accents)
  - `web/src/app/(main)/dashboard/page.tsx` (current mock dashboard, state fields)
  - `web/src/features/pomodoro/` (StrictPomodoroModal, StrictAvatar facial SVG, TalkingTom3D)
  - `web/tests/campus-redesign.test.ts` (baseline tests, 33 tests passing)
- **Key findings**:
  - Procedural SVG + 120FPS CSS transforms is optimal for Mascot character (no GPU bloat, instant Retina rendering).
  - Quick chips dynamically mutate study block payload before committing to `state.events`.
  - Accepting plan inserts a `CalendarEvent` of type `'study'` with today's date, updating `state.events` and `state.aiCoachAccepted = true`.
  - HUD integrates with `calculateLevelProgress(state.xp)` and `state.weeklyStudyMinutesCurrent / state.weeklyStudyGoalMinutes`.
  - Heatmap is an 84-day (12 weeks x 7 days) matrix with hourly hover tooltips.
  - Warning sticker features animated SVG path cubic bezier grade sparkline with danger threshold.
- **Unexplored areas**: Implementation of components (assigned to worker_m2).

## Key Decisions Made
- Deliver complete, drop-in ready TSX code blueprints with full types, state hooks, animations, and tests in `handoff.md`.

## Artifact Index
- DISPATCH.md — incoming dispatch records
- BRIEFING.md — persistent state and identity
- progress.md — liveness heartbeat
- handoff.md — final 5-component handoff report
