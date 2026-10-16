## 2026-10-13T16:18:59Z
You are explorer_m1_remedy_2.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_remedy_2\

Read these files first:
1. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md
2. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_10\PROJECT.md
3. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\challenger_quicktask_m1_1\handoff.md

Your task is to analyze and design the exact fix strategy for:
1. KNOWN_COURSES in web/src/lib/tasks-engine.ts: Add Unicode word boundary guards (?:^|[^\p{L}\p{N}]) and (?=$|[^\p{L}\p{N}]) around course keywords so that "website" does not match "web", and "mạng xã hội" does not match "mạng".
2. Also check if any priority regexes need refinement (e.g. "không quá gấp").

Do NOT implement changes yourself. Formulate exact diff / lines to change.
Document your complete findings and patch proposal in:
d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_remedy_2\handoff.md
Send a message back to parent when done.
