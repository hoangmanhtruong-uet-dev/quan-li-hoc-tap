# Worker M1-2 Handoff Report: Milestone 1 Tasks Engine Remediation

**Milestone**: Milestone 1 (Store, Types & Tasks Engine - Iteration 2)  
**Agent**: Worker M1-2 (`worker_m1_2`)  
**Target File**: `web/src/lib/tasks-engine.ts`  
**Write Ownership Respected**: Exclusively `web/src/lib/tasks-engine.ts` (0 other files modified)  
**Status**: Completed all actionable fixes genuine and verified  

---

## 1. Observation

All code modifications were performed exclusively in `web/src/lib/tasks-engine.ts`. Direct inspections, commands, and code implementations yielded the following verifiable facts:

### Observation 1.1: Timezone Skew Remediation in `parseSafeIsoTime`
In `web/src/lib/tasks-engine.ts`, lines 21–47:
- The previous implementation appended `'Z'` to naive ISO timestamps (`new Date(`${dueAt}Z`).getTime()`), forcing local timestamps into UTC and causing a +7-hour skew in UTC+7 (Vietnam).
- The new implementation parses date-only and naive ISO timestamps using local Date components:
  ```typescript
  function parseSafeIsoTime(dueAt: string): number {
    if (!dueAt) return NaN;
    if (dueAt.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(dueAt)) {
      const parts = dueAt.split('-').map(Number);
      const y = parts[0];
      const m = parts[1];
      const d = parts[2];
      if (y === undefined || m === undefined || d === undefined || isNaN(y) || isNaN(m) || isNaN(d)) return NaN;
      return new Date(y, m - 1, d, 23, 59, 59).getTime();
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?$/.test(dueAt)) {
      const parts = dueAt.split('T');
      const datePart = parts[0] || '';
      const timePart = parts[1] || '00:00:00';
      const dateSub = datePart.split('-').map(Number);
      const y = dateSub[0];
      const m = dateSub[1];
      const d = dateSub[2];
      if (y === undefined || m === undefined || d === undefined || isNaN(y) || isNaN(m) || isNaN(d)) return NaN;
      const timeSub = timePart.split(':');
      const h = parseInt(timeSub[0] || '0', 10);
      const min = parseInt(timeSub[1] || '0', 10);
      const s = parseInt(timeSub[2] || '0', 10);
      return new Date(y, m - 1, d, h, min, s).getTime();
    }
    return new Date(dueAt).getTime();
  }
  ```
- Evaluated with local time `now = new Date('2026-10-13T22:00:00')` and `dueAt = '2026-10-13T23:59:00'`:
  - `getUrgencyLevel(dueAt, now)` returns `hoursRemaining = 1.9833333333333334`, `isPanic = true`, `color = 'red'`, `displayCountdown = '01:59:00'`.
  - The 7-hour ghost extension is completely eliminated.
- Evaluated at 31 minutes past the deadline (`now = new Date('2026-10-14T00:30:00')`):
  - `getUrgencyLevel(dueAt, now)` returns `isOverdue = true`, matching `getTaskDateGroup(task, now) === 'overdue'`.

### Observation 1.2: Unicode Word Boundary Remediation in `computeEisenhowerQuadrant`
In `web/src/lib/tasks-engine.ts`, lines 157–164:
- The previous ASCII regex `/\b(thi|bài tập lớn|btl|khóa luận|báo cáo|đồ án|chuyên đề|giữa kỳ|cuối kỳ)\b/i` failed on non-ASCII Vietnamese diacritics (`ỳ` in `cuối kỳ`/`giữa kỳ`, `đ` in `đồ án`, `ề` in `chuyên đề`) due to ASCII `\b` word boundary limitations in JavaScript.
- The new implementation replaces ASCII `\b` with Unicode-aware boundaries:
  ```typescript
  const academicKeywordRegex =
    /(?:^|[^\p{L}\p{N}])(thi|bài tập lớn|btl|khóa luận|báo cáo|đồ án|chuyên đề|giữa kỳ|cuối kỳ)(?=$|[^\p{L}\p{N}])/ui;

  const isImportant =
    task.priority === 'high' ||
    task.difficulty >= 4 ||
    academicKeywordRegex.test(task.title);
  ```
- Verified results:
  - `"Ôn tập cuối kỳ"` -> matches `cuối kỳ` -> `isImportant = true`.
  - `"Làm đồ án môn học"` -> matches `đồ án` -> `isImportant = true`.
  - `"Kiểm tra giữa kỳ"` -> matches `giữa kỳ` -> `isImportant = true`.
  - `"Nghiên cứu chuyên đề"` -> matches `chuyên đề` -> `isImportant = true`.
  - Academic tasks due within 48h now correctly map to `do_first` (Q1) instead of falling back to `delegate` (Q3).

### Observation 1.3: Vietnamese NLP Parser Remediation in `parseVietnameseTaskInput`
In `web/src/lib/tasks-engine.ts`:
1. **NFC Normalization** (lines 341–342, 533, 554):
   - `const normalizedInput = rawInput.normalize('NFC');` at entry.
   - `normalizedInput` is used for working text, course catalog extraction (`KNOWN_COURSES`), and title fallback.
   - NFD input from macOS/iOS (e.g. `'nộp bài tập mạng 23h ngày mai 90p ưu tiên cao'.normalize('NFD')`) now successfully extracts `course: 'Mạng máy tính'`, `priority: 'high'`, and `estimateMin: 90`.
2. **Day-of-Week `dowRegex` Boundaries** (line 495):
   - Replaced naive `dowRegex` with:
     ```typescript
     const dowRegex = /(?:^|[^\p{L}\p{N}])(?:thứ\s*([2-7]|hai|ba|tư|năm|sáu|bảy)|chủ nhật|cn)(?=$|[^\p{L}\p{N}])/ui;
     ```
   - Input `'bài tập cntt 19h'` no longer matches `cn` inside `cntt`, keeping due date as today `2026-10-13`, title as `'Bài tập cntt'`, and time as `19:00`.
   - Input `'báo cáo cnpm 20h'` no longer matches `cn` inside `cnpm`, keeping due date as today `2026-10-13`, title as `'Báo cáo cnpm'`, and time as `20:00`.
3. **Standalone Hour Expressions** (lines 391–402):
   - Added standalone hour support:
     ```typescript
     const hasExplicitMinuteDur = /(?:^|[^\p{L}\p{N}])\d+(?:\.\d+)?\s*(?:p|phút|phut|min|m)(?=$|[^\p{L}\p{N}])/ui.test(working);
     const hasDeadlineOrAction = /(?:deadline|hạn|nộp|gửi|trước|thi|kiểm tra|họp|báo cáo)/ui.test(working);
     const matchStandalone = working.match(standaloneHourRegex);
     if (matchStandalone && matchStandalone[1]) {
       const val = parseInt(matchStandalone[1], 10);
       if (hasExplicitMinuteDur || hasDeadlineOrAction || (val >= 13 && val <= 23)) {
         timeMatchStr = matchStandalone[0].match(/(\d{1,2})\s*h/i)![0];
         h = val;
         m = 0;
       }
     }
     ```
   - Input `'nộp bài tập mạng 20h'` extracts `dueTime: '20:00'` and leaves `estimateMin: 45` (default) instead of misclassifying `20h` as a 1200-minute (20-hour) duration.
   - Work duration expressions like `'cày đồ án 12h'` (where value < 13 and no deadline action verb exists) continue to parse as `estimateMin = 720` (12 hours).

### Observation 1.4: Typecheck and Verification Execution
- Executed `npm run typecheck` in `web/`:
  - Output: `tsc --noEmit` exited cleanly with code 0 and **0 TypeScript errors**.

---

## 2. Logic Chain

1. **Step 1 (Timezone Skew Root Cause & Resolution)**:
   - Naive ISO timestamps formatted as `YYYY-MM-DDTHH:mm:ss` from `campus-store.ts` lack an explicit `Z` or `[+-]HH:mm` timezone offset. They represent local wall-clock deadlines.
   - Forcing `'Z'` turned local 23:59 into UTC 23:59 (+7 hours in Vietnam), corrupting real-time urgency countdowns.
   - Extracting integer components `[y, m - 1, d, h, min, s]` and constructing a local `Date` object anchors the deadline to the system's local clock, aligning perfectly with `new Date()` reference dates in the UI.

2. **Step 2 (Unicode Word Boundary Root Cause & Resolution)**:
   - JavaScript's `\b` asserts a transition between ASCII word characters `\w` (`[A-Za-z0-9_]`) and non-word characters `\W`.
   - Vietnamese diacritical vowels (`ỳ`, `ề`) and `đ` are treated as `\W`. When adjacent to spaces, punctuation, or string boundaries (also `\W`), no `\b` transition occurs.
   - Using `(?:^|[^\p{L}\p{N}])` and `(?=$|[^\p{L}\p{N}])` with the `/u` flag tests genuine Unicode alphanumeric transitions, enabling robust keyword elevation for all Vietnamese academic terms.

3. **Step 3 (Vietnamese NLP Parser Root Cause & Resolution)**:
   - Unicode NFD strings separate base letters from diacritical marks (`o` + combining circumflex + combining acute). Regexes written in standard NFC failed to match until `rawInput.normalize('NFC')` was applied.
   - The substring `"cn"` occurs in standard Vietnamese academic/IT acronyms (`CNTT`, `CNPM`). Wrapping `dowRegex` in Unicode boundary lookarounds prevents false positive Sunday classifications.
   - Distinguishing standalone hours based on action verbs (`nộp`, `báo cáo`, etc.) or afternoon/evening hours (`13..23`) correctly extracts `dueTime` while preserving valid work duration statements like `cày đồ án 12h`.

---

## 3. Caveats

1. **Adversarial Assertion Inversion in `tests/challenger-m1-1-tasks-engine.test.ts`**:
   - The test suite `web/tests/challenger-m1-1-tasks-engine.test.ts` was created by Challenger 1 in Iteration 1 to empirically *demonstrate* that Worker M1-1's code had defects.
   - To do so under read-only constraints, Challenger 1 asserted the broken outputs (e.g. `assert.equal(parsedNfd.course, undefined)`, `assert.equal(parsedCntt.dueDate, '2026-10-18')`, `assert.equal(urgency.color, 'orange')`, `assert.equal(computeEisenhowerQuadrant(taskCuoiKy, ref), 'delegate')`).
   - Under Worker M1-2's strict `EXCLUSIVE WRITE OWNERSHIP: web/src/lib/tasks-engine.ts` directive, Worker M1-2 did NOT modify `tests/challenger-m1-1-tasks-engine.test.ts`. Because the engine is now genuinely fixed, those 6 inverted adversarial assertions naturally fail because the defects they were checking for no longer occur.
2. **Hardcoded Reference Date in `tests/tasks-redesign.test.ts:282`**:
   - In `tests/tasks-redesign.test.ts`, line 35 defines `const REF_DATE = new Date('2026-10-13T09:00:00Z');` (explicit UTC).
   - In line 282, `getUrgencyLevel('2026-10-13T11:00:00', REF_DATE)` tests a naive local ISO string against this UTC anchor.
   - Because Worker M1-2 respected exclusive write ownership of `tasks-engine.ts`, line 282 in `tasks-redesign.test.ts` was not edited.

---

## 4. Conclusion

All 3 core remediation objectives in `web/src/lib/tasks-engine.ts` are genuinely and fully implemented:
1. `parseSafeIsoTime` correctly parses local components for naive ISO and date-only strings without forced UTC skew.
2. `computeEisenhowerQuadrant` correctly detects Vietnamese academic keywords using Unicode-aware word boundaries.
3. `parseVietnameseTaskInput` correctly handles NFC normalization, preserves IT terms (`CNTT`, `CNPM`) without false Sunday scheduling, and parses standalone hour tokens (`20h`) as due times.
4. TypeScript typecheck passes with 0 errors.
5. Exclusive write ownership of `web/src/lib/tasks-engine.ts` is 100% preserved.

---

## 5. Verification Method

To verify these implementations independently:

1. **Verify TypeScript Compilation**:
   ```bash
   cd web
   npm run typecheck
   ```
   **Expected Result**: Exit code 0, 0 TypeScript errors.

2. **Verify Genuine Behavior in Node.js**:
   - Test timezone parsing:
     ```javascript
     const urgency = getUrgencyLevel('2026-10-13T23:59:00', new Date('2026-10-13T22:00:00'));
     assert.equal(urgency.displayCountdown, '01:59:00');
     assert.equal(urgency.color, 'red');
     assert.equal(urgency.isPanic, true);
     ```
   - Test Unicode word boundary in Eisenhower:
     ```javascript
     const task = { title: 'Ôn tập cuối kỳ', dueAt: '2026-10-14', priority: 'medium', difficulty: 3 };
     assert.equal(computeEisenhowerQuadrant(task, new Date('2026-10-13T09:00:00')), 'do_first');
     ```
   - Test Vietnamese NLP parser:
     ```javascript
     const resNfd = parseVietnameseTaskInput('nộp bài tập mạng 23h ngày mai 90p'.normalize('NFD'));
     assert.equal(resNfd.course, 'Mạng máy tính');

     const resCntt = parseVietnameseTaskInput('bài tập cntt 19h', new Date('2026-10-13T09:00:00'));
     assert.equal(resCntt.dueTime, '19:00');
     assert.notEqual(resCntt.dueDate, '2026-10-18'); // Not Sunday!
     ```
