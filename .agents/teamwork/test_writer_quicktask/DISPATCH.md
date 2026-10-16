# DISPATCH — E2E Test Writer (Quick Task Suite)

## Mission
Design and implement an opaque-box E2E test suite in `web/tests/quick-task-nlp-sync.test.ts` according to the 4-tier methodology (Category-Partition, Boundary Value Analysis, Pairwise Combinations, Real-World Workloads) based on the user requirements in `ORIGINAL_REQUEST.md` and contracts in `PROJECT.md`.

## Target Test Suite
File: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\tests\quick-task-nlp-sync.test.ts`
Runner: `node --experimental-strip-types --test tests/quick-task-nlp-sync.test.ts` (run from `web/`)

## Test Coverage Requirements (4 Tiers)
1. **Tier 1 — Feature Coverage (>=5 per feature)**:
   - Date extraction: "hôm nay", "ngày mai", "ngày mốt", "thứ 6", "cuối tuần", "tuần sau", explicit "DD/MM".
   - Time extraction: "23h", "11 giờ đêm", "14h30", "8h sáng", "cuối ngày" (-> 23:59).
   - Course extraction: "Mạng máy tính", "Giải tích", "Triết học", "Toán rời rạc", "CTDL & GT".
   - Duration extraction: "90p", "2 tiếng", "45 phút", "1.5h".
   - Fallback: string with no date/time falls back to today 23:59 without error.
   - 4 Priority tiers: "thấp" -> 'low', "vừa" -> 'medium', "gấp" -> 'high', "siêu gấp" -> 'urgent'.
   - Store dual-write: `addQuickTask` atomically creates both `TaskItem` in `state.tasks` and `DeadlineItem` in `state.deadlines`.
   - Store XP & Rank: `addQuickTask` awards +10 XP and recalculates level and rank.
   - Store Undo: calling returned `undo()` removes task from `state.tasks`, removes deadline from `state.deadlines`, and deducts 10 XP.
2. **Tier 2 — Boundary & Corner Cases**:
   - Empty/whitespace input handling.
   - Late night times (e.g. 23:59, 00:00).
   - "thứ 6 tuần sau" vs "thứ 6" (must add 7 days offset).
   - "siêu gấp" containing "gấp" (must not greedily match 'high' instead of 'urgent').
   - Long input with multiple courses or punctuation.
3. **Tier 3 — Cross-Feature Combinations (Pairwise)**:
   - Date + Time + Priority + Course combined.
   - Store creation + undo + re-creation.
4. **Tier 4 — Real-World Vietnamese User Scenarios**:
   - "Nộp bài tập lớn Mạng máy tính lúc 23h thứ 6"
   - "ôn thi Giải tích thứ 6 tuần sau 90p"
   - "làm slide Triết ngày mai"
   - "Deadline đồ án CTDL cuối tuần siêu gấp"

## Completion Criteria
1. Write `web/tests/quick-task-nlp-sync.test.ts`.
2. Write `TEST_READY.md` at `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\test_writer_quicktask\TEST_READY.md`.
3. Report back when test suite is ready.


## 2026-10-13T13:01:33Z
You are test_writer_quicktask.
Your working directory is d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\test_writer_quicktask\
Read d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically section ## 2026-10-13T12:48:34Z).
Read d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_10\PROJECT.md.
Read d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\test_writer_quicktask\DISPATCH.md.
Design and implement the opaque-box test suite in web/tests/quick-task-nlp-sync.test.ts covering Tiers 1-4.
When tests are written, write TEST_READY.md in your working directory and notify parent.
