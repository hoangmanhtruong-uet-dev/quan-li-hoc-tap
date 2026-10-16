## 2026-10-13T08:13:48Z
You are the E2E Test Writer for the CampusOS /tasks page rebuild project.

Your assigned working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\test_writer_e2e_1\
Your parent conversation ID: d87bbdd2-41e0-4e96-8205-9ea9461c7df0

Input files to read FIRST:
1. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically timestamp ## 2026-10-13T07:48:15Z)
2. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
3. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_survey_1\handoff.md
4. d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\tests\campus-redesign.test.ts (to follow exact test structure, assertions, and runner patterns)

EXCLUSIVE WRITE OWNERSHIP:
You exclusively own and may create/modify:
- web/tests/tasks-redesign.test.ts (create)
- TEST_INFRA.md (at project root)
- TEST_READY.md (at project root)
DO NOT touch any source code files in web/src/.

Objective & Requirements:
Design and write a comprehensive opaque-box test suite in `web/tests/tasks-redesign.test.ts` following Node's native test runner (`node:test`, `node:assert/strict`) and explicit `.ts` relative imports.

The test suite must cover 4 systematic tiers:
Tier 1: Feature Coverage (>=5 test cases per feature for NLP parser, Eisenhower matrix, date grouping, and store tasks).
Tier 2: Boundary & Corner Cases (empty input, extreme durations, midnight/boundary times, 48-hour boundary, leap year/month rollover, special characters).
Tier 3: Cross-Feature Combinations (e.g., NLP parsing output directly fed to Eisenhower quadrant calculator and date group partitioner; store adding parsed task and ticking complete).
Tier 4: Real-World Workload Scenarios (Vietnamese student workload scenarios: "nộp bài tập mạng 23h ngày mai 90p ưu tiên cao", "ôn thi cuối kỳ toán rời rạc 19h thứ 6", subtasks checklist progress, clear the board streak bonus).

Verification & Completion:
- Test runner invocation: `node --experimental-strip-types --test tests/tasks-redesign.test.ts` (or `npm test`).
- Once tests pass or once test suite is ready, publish `TEST_READY.md` and `TEST_INFRA.md` at `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\`.
- Write handoff report to `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\test_writer_e2e_1\handoff.md`.
- Send completion message to parent (`d87bbdd2-41e0-4e96-8205-9ea9461c7df0`).
