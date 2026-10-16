# TEST_READY — CampusOS Quick Task ("Tạo nhiệm vụ nhanh") Upgrade

## Test Suite Overview

- **Target File**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\tests\quick-task-nlp-sync.test.ts`
- **Execution Command**: `node --experimental-strip-types --test tests/quick-task-nlp-sync.test.ts` (run from `web/`)
- **Full Suite Command**: `npm test` (in `web/`)
- **Test Framework**: Native Node.js test runner (`node:test`, `node:assert/strict`) with TypeScript strip-types
- **Total Test Cases**: 78 tests across 4 comprehensive tiers

---

## 4-Tier Test Architecture Breakdown

### 1. Tier 1 — Feature Coverage (50 Tests, >=5 Per Feature)
- **Date Extraction (7 tests)**:
  - `"hôm nay"` -> resolves to reference date
  - `"ngày mai"` / `"mai"` -> resolves to +1 day offset
  - `"ngày mốt"` / `"mốt"` -> resolves to +2 days offset
  - `"thứ 6"` -> resolves to upcoming Friday
  - `"cuối tuần"` -> resolves to upcoming Saturday/Sunday
  - `"tuần sau"` -> shifts date forward by +7 days
  - Explicit `"DD/MM"` and `"DD/MM/YYYY"` parsing
- **Time Extraction (7 tests)**:
  - `"23h"` -> `"23:00"`
  - `"11 giờ đêm"` -> `"23:00"`
  - `"14h30"` -> `"14:30"`
  - `"8h sáng"` -> `"08:00"`
  - `"cuối ngày"` -> `"23:59"`
  - Colon notation `"17:45"` -> `"17:45"`
  - `"12h trưa"` -> `"12:00"`
- **Course Extraction (6 tests)**:
  - `"Mạng máy tính"`
  - `"Giải tích"`
  - `"Triết học"` / `"Triết"`
  - `"Toán rời rạc"`
  - `"CTDL & GT"`
  - `"Xác suất Thống kê"`
- **Duration Extraction (5 tests)**:
  - `"90p"` -> 90 min
  - `"2 tiếng"` -> 120 min
  - `"45 phút"` -> 45 min
  - `"1.5h"` -> 90 min
  - `"3 giờ"` -> 180 min
- **Fallback Behavior (5 tests)**:
  - Lacking date/time defaults gracefully to today `"23:59"` without throwing
  - Default duration: 45 minutes
  - Default priority: `'medium'`
  - Course-only input preserves course and defaults date
  - Priority-only input extracts priority and defaults date
- **4 Priority Tiers (5 tests)**:
  - `"thấp"` / `"ưu tiên thấp"` -> `'low'`
  - `"vừa"` / `"bình thường"` -> `'medium'`
  - `"gấp"` / `"ưu tiên cao"` -> `'high'`
  - `"siêu gấp"` / `"siêu khẩn cấp"` -> `'urgent'`
  - Cleans priority keywords from task title
- **Store Dual-Write (5 tests)**:
  - `addQuickTask` atomically returns `{ task, deadline, undo }`
  - Created task exists in `state.tasks`
  - Created deadline exists in `state.deadlines`
  - Title, course, and due date consistency between task and deadline
  - Priority maps to `deadline.urgent` (`true` for `'urgent'` / `'high'`, `false` for `'low'` / `'medium'`)
- **Store XP & Rank (5 tests)**:
  - Immediate award of `+10 XP`
  - Level advancement upon crossing threshold (e.g., 195 XP -> 205 XP = Level 2)
  - Rank title recalculation upon level up (`'Cú đêm giảng đường'`)
  - Level stability within same XP band
  - Sequential additions accumulate `+10 XP` per task
- **Store Undo (5 tests)**:
  - Calling `undo()` removes task from `state.tasks`
  - Calling `undo()` removes deadline from `state.deadlines`
  - Calling `undo()` deducts 10 XP
  - Calling `undo()` rolls back level and rankTitle
  - Idempotent: repeated `undo()` calls do not double-deduct XP or corrupt store

---

### 2. Tier 2 — Boundary & Corner Cases (13 Tests)
- Empty string input -> `'Nhiệm vụ mới'`, today 23:59
- Whitespace input (spaces, tabs, newlines) -> `'Nhiệm vụ mới'`
- Symbols / punctuation only (`!@#$%^&*()_+`, `....????`) -> `'Nhiệm vụ mới'`
- Late night times: `"23:59"`, `"00:00"`, `"0h"`, `"24h"`
- Relative week distinction: `"thứ 6 tuần sau"` vs `"thứ 6"` enforces exactly 7-day offset
- Relative week distinction: `"thứ 2 tuần sau"` vs `"thứ 2"`
- Anti-greediness regex: `"siêu gấp"` matches `'urgent'`, NOT `'high'`
- Anti-greediness regex: `"không gấp"` matches `'low'`, NOT `'high'`
- Anti-greediness regex: `"ưu tiên siêu gấp"` matches `'urgent'`
- Long multi-token input (>200 chars) with nested punctuation
- Stripping leading and trailing hyphens/punctuation from title
- Calendar leap-year rollover (Feb 28 to Feb 29 in leap year 2028)
- Calendar year-end rollover (Dec 31, 2026 to Jan 01, 2027)

---

### 3. Tier 3 — Cross-Feature Combinations & Pairwise (7 Tests)
- **Pairwise 1**: Date (`ngày mai`) + Time (`23h`) + Course (`Mạng máy tính`) + Priority (`siêu gấp`)
- **Pairwise 2**: Date (`thứ 6`) + Time (`8h sáng`) + Duration (`90p`) + Priority (`gấp`)
- **Pairwise 3**: Date (`cuối tuần`) + Time (`14h30`) + Course (`Triết học`) + Priority (`thấp`)
- **Pairwise 4**: Date (`tuần sau`) + Duration (`2 tiếng`) + Course (`Toán rời rạc`) + Priority (`vừa`)
- **Pairwise 5**: Explicit Date (`25/10`) + Time (`cuối ngày`) + Duration (`45 phút`) + Course (`CTDL & GT`)
- **Store Lifecycle 1**: Interleaved creation of Task 1 & Task 2, selective undo of Task 1 preserves Task 2 & Deadline 2
- **Store Lifecycle 2**: Creation, undo all, and subsequent recreation

---

### 4. Tier 4 — Real-World Vietnamese User Scenarios (8 Tests)
- **Scenario 1**: `"Nộp bài tập lớn Mạng máy tính lúc 23h thứ 6"`
- **Scenario 2**: `"ôn thi Giải tích thứ 6 tuần sau 90p"`
- **Scenario 3**: `"làm slide Triết ngày mai"`
- **Scenario 4**: `"Deadline đồ án CTDL cuối tuần siêu gấp"`
- **Scenario 5**: `"Luyện đề Toán rời rạc 14h30 chủ nhật 2 tiếng vừa"`
- **Scenario 6**: `"Báo cáo thực tập Dự án Web 17:00 ngày 25/10 2 tiếng"`
- **Scenario 7**: Voice Brain-Dump raw input: `"mai nộp bài tập xác suất thống kê gấp"`
- **Scenario 8**: Full End-to-End Pipeline: Parse Natural Language -> Dual-Write Store -> Undo Rollback

---

## Interface Contracts Verified

1. `src/types/tasks.ts`:
   - `TaskPriority = 'low' | 'medium' | 'high' | 'urgent'`
   - `ParsedTaskResult`
2. `src/lib/tasks-engine.ts`:
   - `parseVietnameseTaskInput(rawInput: string, referenceDate?: Date): ParsedTaskResult`
3. `src/lib/campus-store.ts`:
   - `addQuickTask(taskData: Omit<TaskItem, 'id' | 'createdAt' | 'order'>): { task: TaskItem; deadline: DeadlineItem; undo: () => void }`
   - `resetSharedState(referenceDate?: Date): CampusOSSharedState`
   - `getSharedState(): CampusOSSharedState`
   - `updateSharedState(updater: (prev: CampusOSSharedState) => Partial<CampusOSSharedState>): CampusOSSharedState`
   - `formatIsoDateOnly(date: Date, offsetDays?: number): string`

---

## Status for Orchestrator & M1 Worker

- The test suite is completely self-contained, deterministic (anchored to `ANCHOR_DATE`), and isolated.
- It is ready to guide M1 Worker in Red-Green implementation of:
  1. `TaskPriority` type extension (`'urgent'`) in `src/types/tasks.ts`
  2. NLP enhancements (`'urgent'`, `"cuối ngày"`, `"thứ X tuần sau"`, course keywords) in `src/lib/tasks-engine.ts`
  3. `addQuickTask` atomic dual-write, `+10 XP`, level/rank recomputation, and `undo()` closure in `src/lib/campus-store.ts`
