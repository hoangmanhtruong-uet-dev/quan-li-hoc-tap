## 2026-10-17T07:18:14Z
You are survey_explorer_3.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\survey_explorer_3
Authoritative user request file: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md

You MUST read d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md before starting work (focus on the section 2026-10-17T07:15:36Z).
Your task is to conduct an in-depth survey of the test infrastructure, quality gates, and test requirements for the Auth redesign:
1. Examine web/package.json, tsconfig.json, next.config.js, and web/tests/.
2. Check how the current test suite is run (e.g. node --test, npm test, etc.), how many tests currently exist (reported 643+ tests), and how existing tests are structured (unit, schema, components, logic).
3. Check typecheck and build command scripts and how they are executed in web/.
4. Map out the test design for the new test suite web/tests/auth-redesign.test.ts:
   - Password strength calculation logic tests (4 tiers, regex validation, score thresholds).
   - Demo 1-Click login credentials and validation.
   - Email .edu.vn validation rules.
   - 60s cooldown timer logic.
   - Layout & Three.js lifecycle contracts (cleanup, event listeners, canvas presence).
   - Component export/interface contracts across all 5 auth pages.
5. Provide a detailed verification plan for all Quality Gates (npm test passing 100%, npm run typecheck with 0 errors, npm run build with 100% clean compilation).
Write your complete report to: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\survey_explorer_3\handoff.md
Update your progress.md periodically.
When done, notify orchestrator_17 via send_message.
