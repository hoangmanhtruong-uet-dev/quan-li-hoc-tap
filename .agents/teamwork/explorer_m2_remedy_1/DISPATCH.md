## 2026-10-13T02:20:32Z
You are explorer_m2_remedy_1, working in metadata directory d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_remedy_1.
Your parent orchestrator is orchestrator_7 (conversation ID: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3).

MANDATORY FIRST STEP:
Read the authoritative user request at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md.
Also read the project architecture at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_7\PROJECT.md.

Read the gate failure feedback in d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_7\GATE_STATUS.md.
Inspect `web/src/components/dashboard/dashboard-hero.tsx`.

YOUR TASK:
Formulate an exact fix strategy for `dashboard-hero.tsx`:
1. Defect: Falsy coercion `|| 1` on urgent count causes the Aurora canvas blob to enter red panic mode even when 0 urgent deadlines exist.
2. Fix: Derive `urgentCount` genuinely from `state.deadlines.filter(d => !d.completed && d.urgent).length`.
3. Calculate `hasPanicDeadline` genuinely: true only if there is an uncompleted urgent deadline with `< 3h` remaining. Pass this clean boolean to the Canvas Aurora draw loop.
4. Also verify formatted subtitle handles 0 classes and 0 deadlines cleanly without hardcoded fallback numbers.

Do NOT modify source code files. Write complete blueprint to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_remedy_1\handoff.md.
Send completion message to orchestrator_7.
