# DISPATCH — Explorer M1.2 (Priority Tiers, Courses & Title Cleaning)

## Mission
Investigate and design the implementation strategy for 4 priority tiers (`low`, `medium`, `high`, `urgent`), course catalog matching ("Giải tích"), and title cleaning in `web/src/types/tasks.ts` and `web/src/lib/tasks-engine.ts`.

## Context & Constraints
- Read `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md` (section `## 2026-10-13T12:48:34Z`).
- Read `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_10\PROJECT.md`.
- Read `web/src/types/tasks.ts` and `web/src/lib/tasks-engine.ts`.

## Scope
1. Update `src/types/tasks.ts`:
   - `export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';`
2. Priority extraction precedence in `parseVietnameseTaskInput`:
   - Match "siêu gấp", "cực gấp", "hỏa tốc", "khẩn cấp", "p0" -> `'urgent'`.
   - Match "ưu tiên cao", "gấp", "urgent", "p1", "quan trọng" -> `'high'`.
   - Match "ưu tiên vừa", "bình thường", "p2", "trung bình" -> `'medium'`.
   - Match "ưu tiên thấp", "không gấp", "p3" -> `'low'`.
   - Ensure "siêu gấp" is evaluated before "gấp" to prevent greedy/partial matching.
3. Add "Giải tích" to `KNOWN_COURSES`.
4. Title cleaning: verify stop words and fallback when title becomes empty.
5. In `computeEisenhowerQuadrant`: ensure `'urgent'` maps to `'do_first'` (Q1) alongside `'high'`.

## Output
Write your analysis and detailed code patch recommendations to:
`d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_2\handoff.md`.
Report back when complete.

## 2026-10-13T13:01:33Z
You are explorer_m1_2.
Your working directory is d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_2\
Read d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically section ## 2026-10-13T12:48:34Z).
Read d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_10\PROJECT.md.
Read d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_2\DISPATCH.md.
Analyze 4 priority tiers, course catalog matching ("Giải tích"), and title cleaning in web/src/types/tasks.ts and web/src/lib/tasks-engine.ts.
Write handoff report to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_2\handoff.md and notify parent.

