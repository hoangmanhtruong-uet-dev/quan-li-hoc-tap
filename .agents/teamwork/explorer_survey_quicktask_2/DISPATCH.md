# DISPATCH — Explorer Survey 2 (NLP Parser Engine & Test Architecture)

## Mission
Survey the Vietnamese Natural Language Processing (NLP) parsing logic, date/time/subject extraction, priority tiers, and test infrastructure.

## Target & Scope
1. Inspect existing NLP parsing in `web/src/lib/tasks-engine.ts` (e.g. `parseVietnameseTaskInput`), `calendar-nlp.ts` (if any), or other NLP utilities.
2. Check how date expressions ("hôm nay", "mai", "mốt", "thứ X", "cuối tuần", "tuần sau", explicit DD/MM), time expressions ("23h", "11 giờ đêm", "14h30", "8h sáng", "cuối ngày"), course/subject catalog matching, and estimated duration ("90p", "2 tiếng") are currently handled.
3. Review 4 priority tiers (`Thấp #3DE8FF`, `Vừa #FFB020`, `Gấp #FF8A3D`, `Siêu gấp #FF3D6E`), priority types in `src/types/tasks.ts`, and fallback defaults ("Hôm nay 23:59").
4. Inspect existing test suites in `web/tests/` (109 existing tests), test runner configuration, and identify test gaps for R1 (NLP parsing) and R2 (priority tiers).

## Instructions
- Read `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md` (section `## 2026-10-13T12:48:34Z`).
- Write your findings to `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_quicktask_2\handoff.md`.
- Send message back to parent when complete.


## 2026-10-13T12:51:31Z
You are explorer_survey_quicktask_2.
Your working directory is d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_quicktask_2\
Read d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically section ## 2026-10-13T12:48:34Z).
Read d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_quicktask_2\DISPATCH.md.
Survey the Vietnamese NLP parsing logic, date/time/subject extraction, priority tiers, and test infrastructure in web/src/lib/ and web/tests/.
Write your findings to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_quicktask_2\handoff.md.
When finished, send a message to parent (me) with a summary and the handoff file path.
