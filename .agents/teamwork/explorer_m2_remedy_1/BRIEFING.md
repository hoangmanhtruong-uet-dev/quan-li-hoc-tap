# BRIEFING — 2026-10-13T02:25:00Z

## Mission
Formulate an exact fix strategy for `dashboard-hero.tsx` to eliminate falsy coercion panic defects, calculate genuine urgency/panic state, and clean subtitle fallbacks.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigator, analyzer, synthesizer
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_remedy_1
- Original parent: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3
- Milestone: Milestone 2 Remedy

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT modify source code files
- Write complete blueprint to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_remedy_1\handoff.md
- Send completion message to orchestrator_7

## Current Parent
- Conversation ID: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3
- Updated: 2026-10-13T02:20:45Z

## Investigation State
- **Explored paths**:
  - `web/src/components/dashboard/dashboard-hero.tsx` (all 596 lines inspected)
  - `web/src/lib/campus-store.ts` (state interface, types, seed deadlines and events)
  - `web/src/components/dashboard/deadline-arena.tsx` (panic calculation reference)
  - `web/src/lib/calendar-math.ts` (DeadlineItem and loadScore definitions)
  - `web/tests/campus-redesign.test.ts` (existing node:test suite structure)
  - `.agents/teamwork/orchestrator_7/GATE_STATUS.md`
  - `.agents/teamwork/reviewer_m2_1/handoff.md` and `challenger_m2_1/handoff.md`
- **Key findings**:
  1. `dashboard-hero.tsx` lines 61-67 uses `|| 3` and `|| 1` falsy fallback coercion, forcing `todayClassesCount` to 3 when 0 classes, and `urgentDeadlinesCount` to 1 when 0 urgent deadlines.
  2. Line 111 `hasUrgent = urgentDeadlinesCount > 0` is permanently `true`, locking the Canvas Aurora into red panic pulse and turning calm green aurora into unreachable dead code.
  3. Canvas Aurora draw loop should not trigger red panic simply because an urgent deadline is due 15 hours away tonight; genuine panic mode requires an uncompleted urgent deadline with `< 3h` remaining (`diff > 0 && diff < 3 * 3600 * 1000`).
  4. Formatted subtitle should display genuine counts `0 lớp học` and `0 deadline sống còn` without hardcoded fallback numbers.
  5. Rotated streak sticker on line 380 also contains falsy coercion `state.streak || 12`, which should be replaced by nullish coalescing `state.streak ?? 12`.
- **Unexplored areas**: None for `dashboard-hero.tsx`. Scope is fully mapped.

## Key Decisions Made
- Formulate precise before/after code blocks and line numbers for the worker agent.
- Map out dedicated node:test test suite additions to verify `urgentCount`, `hasPanicDeadline`, and boundary conditions.

## Artifact Index
- DISPATCH.md — incoming dispatch record
- progress.md — liveness heartbeat
- handoff.md — comprehensive blueprint and handoff report
