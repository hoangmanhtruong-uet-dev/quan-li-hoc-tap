## 2026-10-13T08:55:33Z

You are Worker M1-2 (Iteration 2) for Milestone 1 of the CampusOS /tasks page rebuild project.

Your assigned working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1_2\
Your parent conversation ID: d87bbdd2-41e0-4e96-8205-9ea9461c7df0

Input files to read FIRST:
1. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically timestamp ## 2026-10-13T07:48:15Z)
2. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\challenger_m1_1\handoff.md (CRITICAL: contains exact bug descriptions, failing test cases, and remediation code)
3. Target file: `web/src/lib/tasks-engine.ts`

EXCLUSIVE WRITE OWNERSHIP:
You exclusively own and may modify:
- `web/src/lib/tasks-engine.ts`
Do NOT modify other files.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objective & Actionable Fixes in `web/src/lib/tasks-engine.ts`:
1. Fix Timezone Skew in `parseSafeIsoTime`:
   - Do NOT append `'Z'` to naive ISO timestamps without timezone offsets.
   - For strings matching `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?$/`, parse using local components:
     ```typescript
     const [datePart, timePart] = dueAt.split('T');
     const [y, m, d] = datePart.split('-').map(Number);
     const [h, min, s] = (timePart || '00:00:00').split(':').map(val => parseInt(val, 10));
     return new Date(y, m - 1, d, h || 0, min || 0, s || 0).getTime();
     ```
   - For date-only strings (`dueAt.length === 10`), return local end of day `new Date(y, m - 1, d, 23, 59, 59).getTime()`.
   - For ISO strings with explicit offset (`Z`, `+`, `-`), use `new Date(dueAt).getTime()`.
2. Fix ASCII `\b` Word Boundary in `computeEisenhowerQuadrant`:
   - Replace naive ASCII `\b` with Unicode-aware boundary:
     ```typescript
     /(?:^|[^\p{L}\p{N}])(thi|bài tập lớn|btl|khóa luận|báo cáo|đồ án|chuyên đề|giữa kỳ|cuối kỳ)(?=$|[^\p{L}\p{N}])/ui
     ```
   - Verify that `"Ôn tập cuối kỳ"`, `"Làm đồ án môn học"`, `"Kiểm tra giữa kỳ"` evaluate to `isImportant = true`.
3. Fix Vietnamese NLP Parser Defects in `parseVietnameseTaskInput`:
   - At entry: `let working = rawInput.normalize('NFC').trim();`
   - In `dowRegex`: Ensure `"cn"` is bounded by non-alphanumeric boundaries so that `"cntt"` and `"cnpm"` do NOT match as Sunday (`cn`). Use `(?:^|[^\p{L}\p{N}])(?:thứ\s*([2-7]|hai|ba|tư|năm|sáu|bảy)|chủ nhật|cn)(?=$|[^\p{L}\p{N}])/ui`.
   - Standalone hours: When user types e.g. `"nộp bài tập mạng 20h"`, parse `20h` as time (`20:00`) rather than a 20-hour duration.

Verification Requirement:
- Run `npm test` in `web/` to verify that all test suites pass (including `tests/challenger-m1-1-tasks-engine.test.ts`, `tests/challenger-m1-tasks-reactivity.test.ts`, and `tests/tasks-redesign.test.ts`).
- Run `npm run typecheck` in `web/` to confirm 0 TypeScript errors.
- Document exact commands and results in your handoff report.

Deliverable:
Write report to `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1_2\handoff.md`.
Send completion message to parent (`d87bbdd2-41e0-4e96-8205-9ea9461c7df0`).
