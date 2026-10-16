## 2026-10-13T02:20:32Z
You are explorer_m2_remedy_3, working in metadata directory d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_remedy_3.
Your parent orchestrator is orchestrator_7 (conversation ID: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3).

MANDATORY FIRST STEP:
Read the authoritative user request at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md.
Also read the project architecture at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_7\PROJECT.md.

Read the gate failure feedback in d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_7\GATE_STATUS.md.
Inspect `web/src/components/dashboard/deadline-arena.tsx` and `web/src/components/dashboard/squad-kanban-exam.tsx`.

YOUR TASK:
Formulate an exact fix strategy for:
1. `deadline-arena.tsx`: When `handleComplete` awards +50 XP to the user, ensure it recalculates the new level and rank title:
   - Call `calculateLevelProgress(newXp)` from `src/lib/gamification.ts`.
   - Update `state.xp`, `state.level`, and `state.rankTitle` in `useCampusStore()`.
2. `squad-kanban-exam.tsx`: Concert-Ticket Exam card countdown should bind dynamically to the nearest upcoming exam from `state.deadlines` (or a dynamic date relative to today) rather than a static mock date string.

Do NOT modify source code files. Write complete blueprint to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_remedy_3\handoff.md.
Send completion message to orchestrator_7.
