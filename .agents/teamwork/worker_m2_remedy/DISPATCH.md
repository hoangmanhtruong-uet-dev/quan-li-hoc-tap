## 2026-10-13T02:26:47Z
You are worker_m2_remedy, working in metadata directory d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m2_remedy.
Your parent orchestrator is orchestrator_7 (conversation ID: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3).

MANDATORY FIRST STEP:
Read the authoritative user request at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md.
Also read the project architecture at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_7\PROJECT.md.

Read the detailed implementation blueprints authored by the remedy explorers:
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_remedy_1\handoff.md (Hero Aurora urgency and panic deadline logic)
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_remedy_2\handoff.md (QuickTaskModal & Voice Brain-Dump integration without window.prompt)
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_remedy_3\handoff.md (Level/Rank recalculation in deadline-arena.tsx and dynamic Concert Ticket exam in squad-kanban-exam.tsx)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP (You own ONLY these files in web/):
- web/src/components/dashboard/dashboard-hero.tsx
- web/src/components/dashboard/deadline-arena.tsx
- web/src/components/dashboard/squad-kanban-exam.tsx
- web/src/components/dashboard/quick-task-modal.tsx
- web/src/app/(main)/dashboard/page.tsx

YOUR TASK:
1. Apply the blueprint from explorer_m2_remedy_1 to `web/src/components/dashboard/dashboard-hero.tsx`:
   - Eliminate falsy coercion `|| 1` and `|| 3`.
   - Compute `urgentCount` genuinely from `state.deadlines.filter(d => !d.completed && Boolean(d.urgent)).length`.
   - Compute `hasPanicDeadline` genuinely: true only when an uncompleted urgent deadline has `< 3h` remaining.
   - Render clean subtitle ("0 lớp học", "0 deadline sống còn").
2. Apply the blueprint from explorer_m2_remedy_2:
   - Create `web/src/components/dashboard/quick-task-modal.tsx` (accessible Neo-Brutal inline task modal).
   - In `web/src/app/(main)/dashboard/page.tsx`: replace `window.prompt` with `QuickTaskModal`. Handle Voice Brain-Dump text to open the modal pre-filled with the transcript.
3. Apply the blueprint from explorer_m2_remedy_3:
   - In `web/src/components/dashboard/deadline-arena.tsx`: import `calculateLevelProgress` from `@/lib/gamification` and update `state.xp`, `state.level`, and `state.rankTitle` when completing a deadline.
   - In `web/src/components/dashboard/squad-kanban-exam.tsx`: dynamically bind the Concert-Ticket Exam countdown and dates to the nearest upcoming exam from `state.deadlines` / dynamic reference date.
4. Run verification commands in `web/`:
   - `npm test`
   - `npm run typecheck`
   - `npm run build`
   Ensure ALL 3 commands exit code 0 with 0 errors.

OUTPUT:
Write your full completion handoff report to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m2_remedy\handoff.md.
Send a brief message to orchestrator_7 upon completion.
