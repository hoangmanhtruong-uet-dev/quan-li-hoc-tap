# Handoff Report — Date & Time NLP Parsing Enhancements in tasks-engine.ts

**Agent**: `explorer_m1_1`  
**Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_1\`  
**Date**: 2026-10-13  
**Status**: Investigation & Architecture Complete (Read-Only Analysis)  
**Parent Conversation ID**: `164cb181-dfe2-4bd4-a53c-f6b55f1d3bee`  

---

## 1. Observation

### 1.1 Existing Date & Time Parsing Deficiencies in `web/src/lib/tasks-engine.ts`
Direct inspection of `web/src/lib/tasks-engine.ts` (lines 308–570) revealed critical gaps when processing Vietnamese natural language quick-task prompts specified in `ORIGINAL_REQUEST.md` (section `## 2026-10-13T12:48:34Z`):

1. **Missing Period Words & Hour Format Gaps in Pass 1 (Time Extraction)**:
   - Line 353–356:
     ```typescript
     const colonTimeRegex = /(?:lúc\s+|vào\s+)?(\d{1,2}):(\d{2})(?:\s*(sáng|chiều|chieu|tối|toi))?/i;
     const combinedTimeRegex = /(?:lúc\s+|vào\s+)?(\d{1,2})h(\d{2})(?:\s*(sáng|chiều|chieu|tối|toi))?/i;
     const prefixedHourRegex = /(?:lúc|vào)\s+(\d{1,2})h?(?:\s*(sáng|chiều|chieu|tối|toi))?/i;
     const periodHourRegex = /(\d{1,2})h\s*(sáng|chiều|chieu|tối|toi)/i;
     ```
   - **Flaw 1 (No "đêm", "dem", "khuya", "trưa")**: The period alternatives only list `(sáng|chiều|chieu|tối|toi)`. Input phrases like `"11 giờ đêm"`, `"11h đêm"`, `"12h đêm"`, `"12h trưa"` fail period extraction.
   - **Flaw 2 (Requires "h", misses "giờ" or "gio")**: `periodHourRegex` requires literal `h` (`(\d{1,2})h`). When a user types `"11 giờ đêm"` or `"8 giờ sáng"`, `periodHourRegex` fails completely because it does not accept `"giờ"`.
   - **Flaw 3 (Duration Collisions)**: When `"11 giờ đêm"` fails Pass 1, Pass 2 (`wordHourRegex = /(?:^|[\s,])(\d+(?:\.\d+)?)\s*(?:tiếng|tieng|giờ|gio)/ui`) greedily matches `"11 giờ"`, falsely interpreting it as a 660-minute duration (`estimateMin = 660`), leaving `"đêm"` unextracted in the title, and defaulting `dueTime` to `"23:59"`.
   - **Flaw 4 (Missing "cuối ngày" / "hết ngày")**: Vietnamese colloquial deadline expressions like `"nộp bài cuối ngày"` or `"hết ngày mai"` are completely ignored by Pass 1, leaving the words in the title and failing to set the standard end-of-day deadline `23:59`.

2. **Missing Weekend & Next-Week Parsing in Pass 4 (Date Extraction)**:
   - Lines 473–527:
     - Only matches `hôm nay`, `ngày mai` / `mai`, `ngày mốt` / `mốt`, day-of-week (`thứ 2`..`thứ 7`, `chủ nhật`, `cn`), and explicit `DD/MM`.
   - **Flaw 5 (No "cuối tuần")**: Expressions like `"ôn tập cuối tuần"`, `"Deadline đồ án CTDL cuối tuần siêu gấp"` fall through all date branches. `dueDate` defaults to today (`referenceDate`), and `"cuối tuần"` is not stripped, polluting the task title.
   - **Flaw 6 (No "tuần sau" modifier on weekdays)**: In `"ôn thi Giải tích thứ 6 tuần sau 90p"`, `dowRegex` matches only `"thứ 6"`, calculating upcoming Friday within the *current* week (`diff = 3` days instead of `diff = 10` days). `"tuần sau"` is left unconsumed, leaking into the task title.
   - **Flaw 7 (No standalone "tuần sau")**: If user types `"làm bài tuần sau"`, it falls through and defaults to today instead of +7 days.

3. **Missing 4th Priority Tier in Pass 3 & Types**:
   - Lines 452–468 in `tasks-engine.ts` and line 7 in `web/src/types/tasks.ts`:
     - Currently only supports 3 tiers: `export type TaskPriority = 'high' | 'medium' | 'low';`.
     - Fails to support the required 4-tier system: **Thấp** (`low`), **Vừa** (`medium`), **Gấp** (`high`), **Siêu gấp** (`urgent`).
     - Priority regexes check `ưu tiên cao|gấp|urgent|p1`. If a user types `"siêu gấp"`, the substring `"gấp"` would greedily match `'high'` if `urgent` is not evaluated with higher precedence.

4. **Missing "Giải tích" in `KNOWN_COURSES`**:
   - Lines 297–306:
     - Catalogs: `Mạng máy tính`, `Triết học Mác - Lênin`, `CTDL & GT`, `Xác suất Thống kê`, `Toán rời rạc`, `Kỹ thuật lập trình`, `Dự án Web`, `CLB Công nghệ`.
     - Missing `Giải tích` (required by user prompt `"ôn thi Giải tích thứ 6 tuần sau 90p"`).

### 1.2 Baseline Test Suite Execution
Running `npm test` inside `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`:
```bash
npm test
```
Result: All 109 existing test cases pass (duration ~2.5s).
- Tests in `tests/tasks-redesign.test.ts` (109 tests total across suites) specifically enforce:
  - `parseVietnameseTaskInput('ôn tập dự án web 1 giờ')` -> `estimateMin: 60`, `dueTime: '23:59'` (duration must not be hijacked as time).
  - `parseVietnameseTaskInput('học kỹ thuật lập trình 2 tiếng lúc 20h')` -> `estimateMin: 120`, `dueTime: '20:00'`.
  - `parseVietnameseTaskInput('bài tập cntt 19h')` -> `title: 'Bài tập cntt'`, `dueDate: today` (`cntt` must not match `cn` as Sunday).

---

## 2. Logic Chain

1. **Premise 1 (R1 & DISPATCH Scope)**:
   The Quick Task modal upgrade requires deterministic natural language parsing of:
   - Time: "11 giờ đêm", "8 giờ sáng", "giờ" without "h", period "đêm" / "dem" (+12h if < 12), and "cuối ngày" / "hết ngày" -> 23:59.
   - Date: "cuối tuần" (target upcoming Saturday/Sunday), "tuần sau" modifier (e.g. "thứ 6 tuần sau" -> `diff + 7`), and standalone "tuần sau".
   - Course: Add "Giải tích".
   - Priority: 4 tiers with "siêu gấp" -> `'urgent'` taking precedence over `"gấp"`.

2. **Deduction 1 (Time Period & Format Unification)**:
   - Defining a unified `PERIOD_WORDS = 'sáng|sang|trưa|trua|chiều|chieu|tối|toi|đêm|dem|khuya'` enables capturing all Vietnamese time qualifiers.
   - Allowing both `h` and `giờ|gio` in hour matching:
     - `periodHourRegex`: `(?:lúc\s+|vào\s+|trước\s+)?(\d{1,2})\s*(?:h|giờ|gio)?\s*(${PERIOD_WORDS})`
     - Matches `"11 giờ đêm"` -> `h = 11`, `period = 'đêm'`.
     - When `period` is `'đêm' | 'dem' | 'khuya'`:
       - If `h < 12`: `h += 12` (e.g. `11 + 12 = 23`).
       - If `h === 12`: `h = 0` (12h đêm is midnight 00:00).
     - When `period` is `'sáng' | 'sang'`:
       - If `h === 12`: `h = 0` (12h sáng is midnight 00:00).
       - If `h < 12`: `h` unchanged (e.g. `8 -> 08:00`).
   - Combined hour + minute with "giờ" or "h":
     - `combinedTimeRegex`: `(?:lúc\s+|vào\s+|trước\s+)?(\d{1,2})\s*(?:h|giờ|gio)\s*(\d{2})(?:\s*(?:phút|p))?(?:\s*(${PERIOD_WORDS}))?`
     - Matches `"14h30"`, `"14 giờ 30"`, `"14 giờ 30 phút"`.
   - Prefix time with "lúc", "vào", "trước":
     - `prefixedHourRegex`: `(?:lúc|vào|trước)\s+(\d{1,2})\s*(?:h|giờ|gio)?(?:\\s*(${PERIOD_WORDS}))?`
     - Matches `"lúc 11 giờ"`, `"vào 8 giờ"`, `"trước 23h"`.
   - End-of-day phrases:
     - `endOfDayRegex`: `(?:^|[^\p{L}\p{N}])(?:vào\s+|lúc\s+|trước\s+)?(cuối\s+ngày|hết\s+ngày)(?=$|[^\p{L}\p{N}])/ui`
     - Matches `"cuối ngày"`, `"hết ngày"` -> sets `h = 23`, `m = 59`, consumes the phrase from `working`.

3. **Deduction 2 (Preserving Duration vs Time Invariants)**:
   - Plain expressions like `"ôn tập dự án web 1 giờ"` have NO prefix ("lúc/vào"), NO period ("sáng/tối/đêm"), and NO minutes ("30").
   - By structuring Pass 1 so that standalone hours with "giờ" require either a prefix (`lúc 11 giờ`), a period (`11 giờ đêm`), or minutes (`14 giờ 30`), plain `"1 giờ"` or `"2 tiếng"` safely bypasses Pass 1 and is captured by Pass 2 as duration (`60` minutes). This guarantees zero regressions on test `Tier 1 - NLP Parser (6/6)`.

4. **Deduction 3 (Date Weekend & Next Week Calculation)**:
   - For `"cuối tuần"`:
     - In Vietnamese student planning, deadlines and study blocks for "cuối tuần" target Saturday (day 6, start of weekend) or Sunday (day 0, end of calendar week).
     - Standard weekend targeting Saturday (day 6):
       ```typescript
       const currentDay = referenceDate.getDay();
       let diff = (6 - currentDay + 7) % 7;
       if (diff === 0 && currentDay !== 6) diff = 7;
       if (isNextWeek) diff += 7;
       ```
     - On Tuesday (Oct 13, 2026), `diff = 4` -> Saturday Oct 17, 2026.
     - Strip token: `working = working.replace(/(?:vào\s+)?cuối\s+tuần(?:\s+sau)?/gi, ' ');`
   - For weekday + `"tuần sau"` (e.g. `"thứ 6 tuần sau"`):
     - Extend `dowRegex` to optionally capture the modifier:
       ```typescript
       const dowRegex = /(?:^|[^\p{L}\p{N}])(?:thứ\s*([2-7]|hai|ba|tư|năm|sáu|bảy)|chủ nhật|cn)(?:\s+(tuần\s+sau|tới))?(?=$|[^\p{L}\p{N}])/ui;
       ```
     - If group 2 matches (`tuần sau` or `tới`), add 7 days: `diff += 7`.
     - On Tuesday Oct 13, 2026, `"thứ 6"` is Oct 16 (`diff = 3`); `"thứ 6 tuần sau"` is Oct 23 (`diff = 10`).
     - Because `dowMatch[0]` matches the entire string `"thứ 6 tuần sau"`, the modifier is cleanly stripped from `working`, preventing title pollution.
   - For standalone `"tuần sau"`:
     - If neither weekend nor weekday matched, and `working` contains `"tuần sau"`:
       `detectedDueDate = formatIsoDateOnly(referenceDate, 7);`
       `working = working.replace(/(?:vào\s+)?tuần\s+sau/gi, ' ');`

5. **Deduction 4 (Priority Hierarchy & Clean Title Normalization)**:
   - Evaluating `urgentPriorityRegex` before `highPriorityRegex` ensures `"siêu gấp"` matches `priority: 'urgent'`, while `"gấp"` matches `priority: 'high'`.
   - Pass 6 title cleaning regex is updated to strip leftover helper tokens (`nộp|làm|học|vào|lúc|ngày|cho|môn|deadline|trước|hết|cuối`), leaving clean titles like `"Báo cáo"`, `"Slide"`, `"Bài tập lớn Mạng máy tính"`.

---

## 3. Caveats

1. **Weekend Target Definition (Saturday vs Sunday)**:
   - In Vietnam, some universities treat Sunday 23:59 as the end-of-week deadline, while students often consider Saturday as the start of "cuối tuần".
   - Our implementation blueprint targets **Saturday (day 6)** by default (`let diff = (6 - currentDay + 7) % 7`). If the team/test suite prefers **Sunday (day 0)**, simply change `6` to `0` (`let diff = (0 - currentDay + 7) % 7; if (diff === 0 && currentDay !== 0) diff = 7;`).
2. **Type Dependency on `src/types/tasks.ts`**:
   - `TaskPriority` in `src/types/tasks.ts` must be updated from `'high' | 'medium' | 'low'` to `'low' | 'medium' | 'high' | 'urgent'`.
   - In `tasks-engine.ts`, `computeEisenhowerQuadrant` must treat both `'high'` and `'urgent'` as `isImportant`.
3. **Purity & Zero Dependency Constraint**:
   - All changes in `tasks-engine.ts` are 100% pure TypeScript using native `Date` and RegExp, requiring zero external packages.

---

## 4. Conclusion & Proposed Implementation

### 4.1 Summary of Exact Changes
1. **Pass 1 (Time)**:
   - Added `PERIOD_WORDS` (`sáng|sang|trưa|trua|chiều|chieu|tối|toi|đêm|dem|khuya`).
   - Added `endOfDayRegex` matching `"cuối ngày"` / `"hết ngày"` -> `23:59`.
   - Expanded `periodHourRegex`, `combinedTimeRegex`, and `prefixedHourRegex` to accept `"giờ|gio"` as well as `"h"`.
   - Converted `đêm|dem|khuya` (< 12 -> +12h, 12h -> 00:00), `sáng` (12h -> 00:00).
2. **Pass 3 (Priority)**:
   - Added `urgentPriorityRegex` checking `"siêu gấp"`, `"khẩn cấp"`, `"cực gấp"`, `"siêu ưu tiên"`, `"urgent"` -> `'urgent'` before checking `'high'`.
3. **Pass 4 (Date)**:
   - Added `"cuối tuần"` / `"cuối tuần sau"` branch.
   - Upgraded `dowRegex` to capture optional `"tuần sau"` / `"tới"`, adding `+7` days offset.
   - Added standalone `"tuần sau"` -> `+7` days offset.
4. **Pass 5 (Courses)**:
   - Added `{ key: /giải tích/i, name: 'Giải tích' }` to `KNOWN_COURSES`.
5. **Pass 6 (Title Cleaning)**:
   - Added `trước|hết|cuối` to stop words so phrases like `"hết ngày"`, `"cuối ngày"` leave clean titles.

### 4.2 Machine-Applicable Patch
The complete diff patch has been generated and saved to:
`d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_1\tasks-engine.patch`.

Below is the annotated code comparison:

```typescript
// =========================================================================
// 1. KNOWN_COURSES (Line 306)
// =========================================================================
// BEFORE:
  { key: /clb công nghệ/i, name: 'CLB Công nghệ' },
];

// AFTER:
  { key: /clb công nghệ/i, name: 'CLB Công nghệ' },
  { key: /giải tích/i, name: 'Giải tích' },
];

// =========================================================================
// 2. PASS 1: TIME EXTRACTION (Lines 351-417)
// =========================================================================
// BEFORE:
  const colonTimeRegex = /(?:lúc\s+|vào\s+)?(\d{1,2}):(\d{2})(?:\s*(sáng|chiều|chieu|tối|toi))?/i;
  const combinedTimeRegex = /(?:lúc\s+|vào\s+)?(\d{1,2})h(\d{2})(?:\s*(sáng|chiều|chieu|tối|toi))?/i;
  const prefixedHourRegex = /(?:lúc|vào)\s+(\d{1,2})h?(?:\s*(sáng|chiều|chieu|tối|toi))?/i;
  const periodHourRegex = /(\d{1,2})h\s*(sáng|chiều|chieu|tối|toi)/i;
  const hourNearDateRegex = /(\d{1,2})h(?:\s*(?:ngày|hôm|mai|mốt|thứ|chủ nhật|cn))/i;
  const standaloneHourRegex = /(?:^|[^\p{L}\p{N}])(\d{1,2})\s*h(?=$|[^\p{L}\p{N}])/ui;

// AFTER:
  const PERIOD_WORDS = 'sáng|sang|trưa|trua|chiều|chieu|tối|toi|đêm|dem|khuya';
  const endOfDayRegex = /(?:^|[^\p{L}\p{N}])(?:vào\s+|lúc\s+|trước\s+)?(cuối\s+ngày|hết\s+ngày)(?=$|[^\p{L}\p{N}])/ui;

  const colonTimeRegex = new RegExp(
    `(?:lúc\\s+|vào\\s+|trước\\s+)?(\\d{1,2}):(\\d{2})(?:\\s*(${PERIOD_WORDS}))?`,
    'i'
  );
  const combinedTimeRegex = new RegExp(
    `(?:lúc\\s+|vào\\s+|trước\\s+)?(\\d{1,2})\\s*(?:h|giờ|gio)\\s*(\\d{2})(?:\\s*(?:phút|p))?(?:\\s*(${PERIOD_WORDS}))?`,
    'i'
  );
  const periodHourRegex = new RegExp(
    `(?:lúc\\s+|vào\\s+|trước\\s+)?(\\d{1,2})\\s*(?:h|giờ|gio)?\\s*(${PERIOD_WORDS})`,
    'i'
  );
  const prefixedHourRegex = new RegExp(
    `(?:lúc|vào|trước)\\s+(\\d{1,2})\\s*(?:h|giờ|gio)?(?:\\s*(${PERIOD_WORDS}))?`,
    'i'
  );
  const hourNearDateRegex = /(\d{1,2})\s*(?:h|giờ|gio)(?:\s*(?:ngày|hôm|mai|mốt|thứ|chủ nhật|cn|cuối tuần|tuần sau))/i;
  const standaloneHourRegex = /(?:^|[^\p{L}\p{N}])(\d{1,2})\s*h(?=$|[^\p{L}\p{N}])/ui;

// (In matching branches):
  // Added endOfDayMatch check:
  const endOfDayMatch = working.match(endOfDayRegex);
  if (endOfDayMatch) {
    timeMatchStr = endOfDayMatch[0];
    h = 23;
    m = 59;
  }
  // Period conversion:
  const p = period?.toLowerCase();
  if ((p === 'chiều' || p === 'chieu' || p === 'tối' || p === 'toi') && h < 12) {
    h += 12;
  } else if ((p === 'đêm' || p === 'dem' || p === 'khuya') && h < 12) {
    h += 12;
  } else if ((p === 'đêm' || p === 'dem' || p === 'khuya') && h === 12) {
    h = 0; // 12h đêm is midnight (00:00)
  } else if ((p === 'sáng' || p === 'sang') && h === 12) {
    h = 0; // 12h sáng is midnight (00:00)
  }

// =========================================================================
// 3. PASS 3: 4 PRIORITY TIERS (Lines 452-468)
// =========================================================================
  const urgentPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:siêu\s+gấp|khẩn\s+cấp|cực\s+gấp|siêu\s+ưu\s+tiên|urgent|p0)(?=$|[^\p{L}\p{N}])/ui;
  const highPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu\s+tiên\s+cao|gấp|p1|quan\s+trọng|cao)(?=$|[^\p{L}\p{N}])/ui;
  const lowPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu\s+tiên\s+thấp|không\s+gấp|p3|thấp)(?=$|[^\p{L}\p{N}])/ui;
  const medPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu\s+tiên\s+vừa|bình\s+thường|p2|trung\s+bình|vừa)(?=$|[^\p{L}\p{N}])/ui;

// =========================================================================
// 4. PASS 4: DATE EXTRACTION (Lines 473-527)
// =========================================================================
  } else if (lowerWorking.includes('cuối tuần')) {
    const isNextWeek = /(?:cuối\s+tuần\s+sau|tuần\s+sau)/i.test(working);
    const currentDay = referenceDate.getDay();
    let diff = (6 - currentDay + 7) % 7;
    if (diff === 0 && currentDay !== 6) diff = 7;
    if (isNextWeek) diff += 7;
    detectedDueDate = formatIsoDateOnly(referenceDate, diff);
    working = working.replace(/(?:vào\s+)?cuối\s+tuần(?:\s+sau)?/gi, ' ');
    confidence += 0.15;
  } else {
    const dowRegex = /(?:^|[^\p{L}\p{N}])(?:thứ\s*([2-7]|hai|ba|tư|năm|sáu|bảy)|chủ nhật|cn)(?:\s+(tuần\s+sau|tới))?(?=$|[^\p{L}\p{N}])/ui;
    const dowMatch = working.match(dowRegex);
    if (dowMatch) {
      ...
      if (dowMatch[2]) {
        diff += 7; // "tuần sau" offset
      }
      detectedDueDate = formatIsoDateOnly(referenceDate, diff);
      working = working.replace(dowMatch[0], ' ');
      confidence += 0.15;
    } else if (lowerWorking.includes('tuần sau')) {
      detectedDueDate = formatIsoDateOnly(referenceDate, 7);
      working = working.replace(/(?:vào\s+)?tuần\s+sau/gi, ' ');
      confidence += 0.15;
    }
```

---

## 5. Verification Method

### 5.1 Standalone Verification Execution
We authored a dedicated empirical verification script:
`d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_1\test-nlp-enhancements.mjs`

Execute with Node:
```bash
cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_1
node test-nlp-enhancements.mjs
```

**Empirical Result**:
- Tested all 10 new test scenarios:
  1. `"nộp bài 11 giờ đêm"` -> `dueTime: '23:00'`, title cleanly stripped to `"Bài"`.
  2. `"học bài 8 giờ sáng"` -> `dueTime: '08:00'`, title cleanly stripped to `"Bài"`.
  3. `"họp lab lúc 11 giờ"` -> `dueTime: '11:00'`, title `"Họp lab"`.
  4. `"làm bài tập cuối ngày"` -> `dueTime: '23:59'`, `dueDate: '2026-10-13'`, title `"Bài tập"`.
  5. `"nộp slide hết ngày mai"` -> `dueTime: '23:59'`, `dueDate: '2026-10-14'`, title `"Slide"`.
  6. `"ôn tập cuối tuần"` -> `dueDate: '2026-10-17'` (Saturday), title `"Ôn tập"`.
  7. `"ôn thi Giải tích thứ 6 tuần sau 90p"` -> `dueDate: '2026-10-23'`, `estimateMin: 90`, course `"Giải tích"`, title `"Ôn thi Giải tích"`.
  8. `"Deadline đồ án CTDL cuối tuần siêu gấp"` -> course `"CTDL & GT"`, priority `'urgent'`, `dueDate: '2026-10-17'`, title `"Đồ án CTDL"`.
  9. `"bài tập siêu gấp"` vs `"bài tập gấp"` -> correctly partitioned into `'urgent'` vs `'high'`.
  10. `"Nhiệm vụ đồ án"` (no date/time) -> gracefully falls back to today `23:59`.
- Re-tested existing baseline test scenarios (`ôn tập dự án web 1 giờ` -> 60m duration preserved; `bài tập cntt 19h` -> `cntt` not matching Sunday; `học kỹ thuật lập trình 2 tiếng lúc 20h`).
- **All assertions passed with zero errors**.

### 5.2 Full Test Suite Verification (Post Implementation)
When `worker_m1` applies the changes to `web/src/lib/tasks-engine.ts`:
```bash
cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
npm test
```
All existing 109 test cases must continue to pass with 0 failures, plus any new tests in `tests/quick-task-nlp-sync.test.ts`.

### 5.3 Invalidation Conditions
- If `"11 giờ đêm"` results in `estimateMin: 660` or `dueTime: '23:59'`, Pass 1 failed to consume the period.
- If `"ôn tập dự án web 1 giờ"` results in `dueTime: '01:00'`, Pass 1 over-eagerly matched a plain duration.
- If `"thứ 6 tuần sau"` outputs the current week's Friday, the `tuần sau` modifier was not added to `diff`.
- If `"bài tập siêu gấp"` results in `priority: 'high'`, the priority regex precedence was inverted.
