# Challenger 1 Handoff Report: Empirical Stress-Test of Tasks Engine (`tasks-engine.ts`)

**Milestone**: Milestone 1 (Store, Types & Tasks Engine)  
**Agent**: Challenger 1 (`challenger_m1_1`)  
**Target File**: `web/src/lib/tasks-engine.ts`  
**Test Suite Created**: `web/tests/challenger-m1-1-tasks-engine.test.ts` (14 empirical tests)  
**Explicit Verdict**: **`REQUEST_CHANGES`**

---

## 1. Observation

Direct code inspections, test executions, and runtime evaluations revealed the following facts:

### Observation 1.1: Forced UTC ("Z") Suffix in `parseSafeIsoTime` Induces 7-Hour Timezone Skew
In `web/src/lib/tasks-engine.ts`, lines 21–30:
```typescript
function parseSafeIsoTime(dueAt: string): number {
  if (!dueAt) return NaN;
  if (dueAt.length === 10) {
    return new Date(`${dueAt}T23:59:59Z`).getTime();
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(dueAt)) {
    return new Date(`${dueAt}Z`).getTime();
  }
  return new Date(dueAt).getTime();
}
```
In `web/src/lib/campus-store.ts`, line 948:
```typescript
dueAt: taskData.dueAt || `${formatIsoDateOnly(new Date(), 0)}T23:59:00`,
```
When evaluated in a local timezone environment (e.g. Indochina Time UTC+7 in Vietnam):
- Input: `dueAt = '2026-10-13T23:59:00'` (local time 11:59 PM).
- Reference time: `now = new Date('2026-10-13T22:00:00')` (local time 10:00 PM; actual time remaining = 1 hour 59 minutes).
- Runtime output from `getUrgencyLevel(dueAt, now)`:
  ```json
  {
    "isOverdue": false,
    "hoursRemaining": 8.983333333333333,
    "color": "orange",
    "isPanic": false,
    "displayCountdown": "08:59:00"
  }
  ```
- Runtime output at 31 minutes past the deadline (`now = new Date('2026-10-14T00:30:00')`):
  - `getTaskDateGroup(task, now)` returns `'overdue'`.
  - `getUrgencyLevel(dueAt, now)` returns `{ isOverdue: false, displayCountdown: '06:29:00', color: 'orange' }`.
- Runtime output when milliseconds are attached (`'2026-10-13T23:59:00.000'`):
  - The regex `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/` does not match, falling through to `new Date(dueAt).getTime()`, which parses as local time and yields `01:59:00` (a 7-hour discrepancy compared to the exact same string without `.000`).

### Observation 1.2: ASCII Word Boundary (`\b`) Failure on Non-ASCII Vietnamese Letters in `computeEisenhowerQuadrant`
In `web/src/lib/tasks-engine.ts`, lines 140–144:
```typescript
  const isImportant =
    task.priority === 'high' ||
    task.difficulty >= 4 ||
    /\b(thi|bài tập lớn|btl|khóa luận|báo cáo|đồ án|chuyên đề|giữa kỳ|cuối kỳ)\b/i.test(task.title);
```
Empirical execution in Node.js runtime:
```javascript
const regex = /\b(thi|bài tập lớn|btl|khóa luận|báo cáo|đồ án|chuyên đề|giữa kỳ|cuối kỳ)\b/i;
regex.test('Ôn tập cuối kỳ');       // false
regex.test('Làm đồ án môn học');     // false
regex.test('Kiểm tra giữa kỳ');      // false
regex.test('Nghiên cứu chuyên đề');  // false
```
In JavaScript regex, `\b` requires one adjacent character to belong to `\w` (`[A-Za-z0-9_]`) and the other to `\W`.
- Vietnamese letters with diacritics (`ỳ`, `đ`, `ề`, etc.) are classified as `\W`.
- For `'cuối kỳ'`, the trailing `'ỳ'` is `\W` and the boundary/end-of-string is `\W`. There is no word boundary transition, causing `\b` to fail.
- For `'đồ án'`, the leading `'đ'` is `\W` and any preceding space or punctuation is `\W`. `\b` fails.
- Consequently, academic tasks titled `"Ôn tập cuối kỳ"`, `"Làm đồ án môn học"`, `"Kiểm tra giữa kỳ"` with medium priority evaluate to `isImportant = false` and are demoted to Q3 (`delegate`) or Q4 (`eliminate`) instead of Q1 (`do_first`) or Q2 (`schedule`).

### Observation 1.3: Absence of Unicode NFC Normalization in `parseVietnameseTaskInput`
In `web/src/lib/tasks-engine.ts`, line 321:
```typescript
let working = rawInput.trim();
```
There is no call to `rawInput.normalize('NFC')`.
When evaluated with NFD (decomposed Unicode standard on macOS and iOS keyboards):
- Input: `'nộp bài tập mạng 23h ngày mai 90p ưu tiên cao'.normalize('NFD')`.
- Runtime Output:
  ```json
  {
    "title": "Nộp bài tập mạng ngày ưu tiên cao",
    "course": undefined,
    "dueDate": "2026-10-14",
    "dueTime": "23:00",
    "estimateMin": 90,
    "priority": "medium",
    "confidence": 0.85
  }
  ```
- Course regex `/mạng/i` and priority regex `/ưu tiên cao/i` fail to match, causing `course = undefined`, `priority = 'medium'`, and leaving unstripped keyword tokens in `title`.

### Observation 1.4: Missing Word Boundary on Day-of-Week Abbreviation `"cn"`
In `web/src/lib/tasks-engine.ts`, line 473:
```typescript
const dowRegex = /(?:thứ\s*([2-7]|hai|ba|tư|năm|sáu|bảy)|chủ nhật|cn)/i;
```
When evaluated with standard Vietnamese IT major prompts:
- Input: `'bài tập cntt 19h'` (CNTT: Công nghệ thông tin)
  - `dowRegex` matches the substring `"cn"` in `"cntt"`.
  - Result: `dueDate = '2026-10-18'` (Sunday), `title = 'Bài tập tt'` (truncated), and `estimateMin = 1140` (19 hours).
- Input: `'báo cáo cnpm 20h'` (CNPM: Công nghệ phần mềm)
  - Result: `dueDate = '2026-10-18'` (Sunday), `title = 'Báo cáo pm'`, and `estimateMin = 1200` (20 hours).

### Observation 1.5: Standalone Hour Expressions Treated as Multi-Hour Durations
In `web/src/lib/tasks-engine.ts`, lines 370–379 & 420–425:
- Input: `'nộp bài tập mạng 20h'`
  - Pass 1 fails to match time because there is no explicit minute duration (`p`, `phút`) and no `deadline` keyword.
  - Pass 2 matches `20h` via `intHourRegex = /(?:^|[\s,])(\d+)\s*h(?=[\s,.:;!?-]|$)/ui`.
  - Result: `estimateMin = 1200` (20 hours duration) and `dueTime = '23:59'`.

---

## 2. Logic Chain

1. **Premise 1 (Timezone)**:
   - Observation 1.1 proves that `parseSafeIsoTime` appends `Z` to naive ISO timestamp strings, converting a local time string into UTC.
   - For users in Vietnam (UTC+7), this shifts the internal deadline by +7 hours into the future.
   - At 22:00 for a 23:59 deadline, the system reports 8h59m remaining instead of 1h59m, completely bypassing the `< 3h` panic urgency threshold (`isPanic = false`, `color = 'orange'`).
   - At 00:30 on the following morning, `getTaskDateGroup` marks the task as `'overdue'` via date string comparison (`'2026-10-13' < '2026-10-14'`), but `getUrgencyLevel` asserts `isOverdue = false` and displays `06:29:00` remaining.
   - Therefore, a student viewing the List view will see an overdue task header containing a card with an active 6-hour countdown, creating a direct visual and algorithmic contradiction.

2. **Premise 2 (Eisenhower Word Boundary)**:
   - Observation 1.2 proves that standard JavaScript ASCII word boundary `\b` fails when adjacent to Vietnamese characters with diacritics.
   - Because `cuối kỳ`, `giữa kỳ`, `chuyên đề` end with non-ASCII characters (`ỳ`, `ề`), and `đồ án` begins with `đ`, `\b` fails to match when these phrases occur adjacent to spaces, punctuation, or string ends.
   - Only phrases with ASCII start/end boundaries (`bài tập lớn`, `btl`, `báo cáo`, `khóa luận`, `thi`) succeed.
   - The original unit test suite only tested `"Ôn thi cuối kỳ Triết học"`, which matched solely due to the substring `"thi"`, masking the failure of `"cuối kỳ"`.
   - Therefore, tasks relying on `"cuối kỳ"`, `"giữa kỳ"`, or `"đồ án"` fail keyword elevation and are misclassified into Q3 or Q4.

3. **Premise 3 (NLP Parser Vulnerabilities)**:
   - Observations 1.3, 1.4, and 1.5 demonstrate three deterministic parser flaws:
     - Decomposed Unicode input (NFD) bypasses regex matching.
     - Unbounded `"cn"` matches inside common student terms like `cntt` and `cnpm`.
     - Standalone hour expressions default to multi-hour task durations.

---

## 3. Caveats

1. **Date Grouping Functionality**: Leap year transitions (Feb 28/29), month-end rollovers (Oct 31/Nov 01), year-end rollovers (Dec 31/Jan 01), and Sunday midnight week partitioning in `getTaskDateGroup` are mathematically correct and robust when reference dates are consistently evaluated.
2. **ReDoS Safety**: Stress-testing with 10,000-character inputs verified that none of the regex passes in `parseVietnameseTaskInput` suffer from catastrophic backtracking.
3. **Immutability and Store Operations**: Store actions (`addTask`, `completeTask`, `updateTask`, `deleteTask`) maintain referential integrity and immutability as verified by baseline tests.
4. **Scope Constraint**: As an empirical challenger operating under review-only constraints, no modifications were made to `web/src/lib/tasks-engine.ts`. All proof has been codified in `web/tests/challenger-m1-1-tasks-engine.test.ts`.

---

## 4. Conclusion

**VERDICT: REQUEST_CHANGES**

The tasks engine in `web/src/lib/tasks-engine.ts` cannot be approved in its current state due to two critical algorithmic bugs that directly impact production behavior in CampusOS:
1. **Critical Bug 1**: Appending `'Z'` in `parseSafeIsoTime` causes a 7-hour timezone distortion in Vietnam (UTC+7), breaking real-time urgency/panic alerts and producing conflicting status indicators between List view headers and task countdown badges.
2. **Critical Bug 2**: Naive ASCII word boundaries (`\b`) in `computeEisenhowerQuadrant` break keyword detection for Vietnamese academic phrases (`cuối kỳ`, `giữa kỳ`, `đồ án`, `chuyên đề`), incorrectly demoting high-priority academic tasks to Q3/Q4.

### Actionable Remediation Requirements for Developer Agent:
1. **Fix `parseSafeIsoTime`**:
   - Do NOT append `'Z'` to naive ISO strings without timezone offsets. Allow `new Date(dueAt).getTime()` or construct local Date objects using `[y, m, d, h, min, s]` components.
   - For date-only strings (`YYYY-MM-DD`), construct `new Date(y, m - 1, d, 23, 59, 59).getTime()` in local time.
2. **Fix `computeEisenhowerQuadrant`**:
   - Replace ASCII `\b` with Unicode-aware boundaries:
     ```typescript
     /(?:^|[^\p{L}\p{N}])(thi|bài tập lớn|btl|khóa luận|báo cáo|đồ án|chuyên đề|giữa kỳ|cuối kỳ)(?=$|[^\p{L}\p{N}])/ui
     ```
3. **Fix `parseVietnameseTaskInput`**:
   - Add `working = rawInput.normalize('NFC').trim()` at entry.
   - Ensure `"cn"` in `dowRegex` is bounded by word/non-alphanumeric boundaries (e.g. `(?:\bcn\b)` or `(?:^|[^\p{L}\p{N}])cn(?=[^\p{L}\p{N}]|$)`).
   - Support standalone hours (e.g. `"20h"`) as time when value is between 0 and 23 and followed by end-of-string or preceded by action verbs.

---

## 5. Verification Method

To verify these findings independently:

1. **Execute Empirical Challenger Test Suite**:
   ```bash
   cd web
   node --experimental-strip-types --test tests/challenger-m1-1-tasks-engine.test.ts
   ```
   **Expected Result**: All 14 tests pass, proving the presence of each documented behavior.

2. **Run Full Project Test Suite**:
   ```bash
   cd web
   npm test
   ```
   **Expected Result**: 102 tests pass across all test suites with 0 unhandled rejections.

3. **Run TypeScript Verification**:
   ```bash
   cd web
   npm run typecheck
   ```
   **Expected Result**: Exit code 0, 0 errors.

4. **Invalidation Conditions**:
   - If `parseSafeIsoTime('2026-10-13T23:59:00')` evaluated at `2026-10-13 22:00:00` in UTC+7 outputs `01:59:00` with `isPanic: true` instead of `08:59:00`, Bug 1 is invalidated.
   - If `/\b(cuối kỳ)\b/i.test('Ôn tập cuối kỳ')` returns `true`, Bug 2 is invalidated.
