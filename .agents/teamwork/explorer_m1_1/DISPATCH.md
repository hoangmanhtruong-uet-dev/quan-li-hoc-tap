# DISPATCH — Explorer M1.1 (NLP Date & Time Engine)

## Mission
Investigate and design the implementation strategy for upgrading the date and time parsing in `web/src/lib/tasks-engine.ts`.

## Context & Constraints
- Read `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md` (section `## 2026-10-13T12:48:34Z`).
- Read `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_10\PROJECT.md`.
- Read existing `web/src/lib/tasks-engine.ts`.

## Scope
1. Time extraction enhancements:
   - Handle "11 giờ đêm", "8 giờ sáng", "giờ" without "h", period "đêm" / "dem" (+12h if < 12).
   - Handle "cuối ngày" / "hết ngày" -> fallback to "23:59".
2. Date extraction enhancements:
   - Handle "cuối tuần" (target upcoming Saturday/Sunday).
   - Handle "tuần sau" modifier (e.g. "thứ 6 tuần sau" -> target weekday in the following week, diff + 7).
3. Ensure no regressions on existing 109 unit tests (specifically `tests/tasks-redesign.test.ts` and `tests/challenger-m1-1-tasks-engine.test.ts`).

## Output
Write your analysis and detailed code patch recommendations to:
`d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_1\handoff.md`.
Report back when complete.

## 2026-10-13T13:01:33Z
You are explorer_m1_1.
Your working directory is d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_1\
Read d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically section ## 2026-10-13T12:48:34Z).
Read d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_10\PROJECT.md.
Read d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_1\DISPATCH.md.
Analyze date & time NLP parsing enhancements in web/src/lib/tasks-engine.ts.
Write handoff report to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_1\handoff.md and notify parent.
