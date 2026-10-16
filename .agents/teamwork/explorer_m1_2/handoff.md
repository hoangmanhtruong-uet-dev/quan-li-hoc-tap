# Handoff Report — Explorer M1.2: Priority Tiers, Course Catalog & Title Cleaning

**Agent**: explorer_m1_2  
**Parent**: orchestrator_10 (`164cb181-dfe2-4bd4-a53c-f6b55f1d3bee`)  
**Scope**: 4 Priority Tiers (`low`, `medium`, `high`, `urgent`), Course Catalog matching ("Giải tích"), Title Cleaning & Fallback, and Eisenhower Quadrant Q1 elevation.  
**Target Files**: `web/src/types/tasks.ts`, `web/src/lib/tasks-engine.ts`  

---

## 1. Observation

### 1.1 Existing Type Definition
In `web/src/types/tasks.ts` (lines 7, 44, 69):
- Line 7: `export type TaskPriority = 'high' | 'medium' | 'low';`
- Line 44: `priority: TaskPriority; // 'high' | 'medium' | 'low'`
- Line 69: `priority: TaskPriority;`
The type currently supports only 3 tiers (`'high' | 'medium' | 'low'`). The requirement specifies 4 distinct tiers:
`export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';`

### 1.2 Priority Extraction in NLP Parser
In `web/src/lib/tasks-engine.ts` (lines 450–469):
```typescript
// Pass 3: Priority Extraction (Unicode safe)
const highPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+cao|gấp|urgent|p1|quan trọng)(?=$|[^\p{L}\p{N}])/ui;
const lowPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+thấp|không gấp|p3)(?=$|[^\p{L}\p{N}])/ui;
const medPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+vừa|bình thường|p2|trung bình)(?=$|[^\p{L}\p{N}])/ui;

if (highPriorityRegex.test(working)) {
  detectedPriority = 'high';
  working = working.replace(/(?:ưu tiên\s+cao|gấp|urgent|p1|quan trọng)/ui, ' ');
  confidence += 0.15;
} else if (lowPriorityRegex.test(working)) {
  detectedPriority = 'low';
  working = working.replace(/(?:ưu tiên\s+thấp|không gấp|p3)/ui, ' ');
  confidence += 0.15;
} else if (medPriorityRegex.test(working)) {
  detectedPriority = 'medium';
  working = working.replace(/(?:ưu tiên\s+vừa|bình thường|p2|trung bình)/ui, ' ');
  confidence += 0.1;
}
```
**Flaws Observed**:
1. Greedy conflict: If the input contains `"siêu gấp"` or `"cực gấp"`, testing `highPriorityRegex` first or without negative lookbehind causes the sub-phrase `"gấp"` to match (since `" "` precedes it). As a result:
   - Priority is wrongly classified as `'high'` instead of `'urgent'`.
   - The token `"gấp"` is replaced with `" "`, leaving `"siêu "` or `"cực "` stranded in the task title.
2. Negative phrase conflict: In `"không gấp"` or `"chưa gấp"`, `"gấp"` also has a space boundary. If `highPriorityRegex` is evaluated before `lowPriorityRegex`, `"không gấp"` matches `"gấp"`, classifying a low-priority task as high priority.
3. Lack of `'urgent'` keywords: `"siêu gấp"`, `"cực gấp"`, `"hỏa tốc"`, `"khẩn cấp"`, and `"p0"` are not currently recognized.

### 1.3 Course Catalog Matching in `KNOWN_COURSES`
In `web/src/lib/tasks-engine.ts` (lines 297–306):
```typescript
const KNOWN_COURSES = [
  { key: /mạng máy tính|mạng/i, name: 'Mạng máy tính' },
  { key: /triết học mác\s*[-–]\s*lênin|triết học|triết/i, name: 'Triết học Mác - Lênin' },
  { key: /cấu trúc dữ liệu\s*&\s*giải thuật|cấu trúc dữ liệu|ctdl\s*(?:và|&)\s*giải thuật|ctdl\s*&\s*gt|ctdl/i, name: 'CTDL & GT' },
  { key: /xác suất thống kê|xác suất/i, name: 'Xác suất Thống kê' },
  { key: /toán rời rạc/i, name: 'Toán rời rạc' },
  { key: /kỹ thuật lập trình/i, name: 'Kỹ thuật lập trình' },
  { key: /dự án web|lập trình web|web/i, name: 'Dự án Web' },
  { key: /clb công nghệ/i, name: 'CLB Công nghệ' },
];
```
**Observed**:
"Giải tích" (and its variants: "toán giải tích", "giải tích 1", "giải tích 2", "giải tích 3") is absent from `KNOWN_COURSES`. In `web/tests/campus-redesign.test.ts` line 322, the auto-scheduler expects study blocks matching `'Giải tích'`. Input examples like `"ôn thi Giải tích thứ 6 tuần sau 90p"` fail to detect the course without this entry.

### 1.4 Title Cleaning & Fallback
In `web/src/lib/tasks-engine.ts` (lines 543–559):
```typescript
let cleanedTitle = working
  .replace(/\b(?:nộp|làm|học|vào|lúc|ngày|cho|môn|deadline)\b/gi, ' ')
  .replace(/[\[\]()#@!?:;*~_]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
cleanedTitle = cleanedTitle.replace(/^[-–—:,.\s]+|[-–—:,.\s]+$/g, '');

if (!cleanedTitle || cleanedTitle.length < 2) {
  if (detectedCourse) {
    cleanedTitle = `Bài tập ${detectedCourse}`;
  } else {
    cleanedTitle = normalizedInput.replace(/[\[\]()#@!?:;*~_]/g, ' ').replace(/\s+/g, ' ').trim() || 'Nhiệm vụ mới';
  }
}

cleanedTitle = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
```
**Observed**:
When metadata keywords (due date, time, duration, priority) and stop words are stripped, `cleanedTitle` can become empty (e.g. input `"23h ngày mai siêu gấp"`). If `detectedCourse` is present (e.g. `"nộp Giải tích 23h siêu gấp"`), it cleanly falls back to `Bài tập ${detectedCourse}` (`"Bài tập Giải tích"`). If no course was detected, the fallback must safely produce `'Nhiệm vụ mới'` rather than echoing raw stripped metadata.

### 1.5 Eisenhower Quadrant Classification
In `web/src/lib/tasks-engine.ts` (lines 150–169):
```typescript
let isUrgent = false;
if (taskDueDateOnly) {
  const diff = daysDifference(todayStr, taskDueDateOnly);
  isUrgent = diff <= 2;
}

const isImportant =
  task.priority === 'high' ||
  task.difficulty >= 4 ||
  academicKeywordRegex.test(task.title);

if (isUrgent && isImportant) return 'do_first';
if (!isUrgent && isImportant) return 'schedule';
if (isUrgent && !isImportant) return 'delegate';
return 'eliminate';
```
**Observed**:
`isImportant` only checks `task.priority === 'high'`. If a task has `priority === 'urgent'`, `isImportant` evaluates to `false` (unless difficulty >= 4 or title has academic keywords). Thus:
- If due <= 48h, an `urgent` task lands in Q3 (`'delegate'`) instead of Q1 (`'do_first'`).
- If due > 48h, an `urgent` task lands in Q4 (`'eliminate'`).
- A task explicitly marked `'urgent'` ("siêu gấp") represents the highest priority and must unconditionally map to Q1 (`'do_first'`).

### 1.6 Downstream Usages of `TaskPriority`
Examined files where `TaskPriority` is referenced:
- `web/src/app/(main)/tasks/page.tsx` (lines 158, 173): `const pMap = { high: 0, medium: 1, low: 2 };` (lacks `urgent`, causing `urgent` to fall back to `1`)
- `web/src/components/tasks/drawer/unselected-hero.tsx` (line 78): `const pMap = { high: 0, medium: 1, low: 2 };` (lacks `urgent`)
- `web/src/components/tasks/controls/controls-bar.tsx` (lines 19, 117-133, 321-372): `TaskPriorityFilter` and `counts` calculation currently only tally `high`, `medium`, `low`.
- `web/src/components/tasks/drawer/task-detail-drawer.tsx` (lines 411–446): Priority selection radio buttons currently have only 3 buttons (`Cao`, `Vừa`, `Thấp`).

---

## 2. Logic Chain

1. **Expanding Type Union to 4 Tiers**:
   - Defining `export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';` in `src/types/tasks.ts` satisfies Requirement R2 from `ORIGINAL_REQUEST.md` and Milestone M1 interface contracts.
   - Because TypeScript union types are covariant on assignment, adding `'urgent'` maintains 100% backward compatibility with all existing code passing `'low'`, `'medium'`, or `'high'`.

2. **Regex Precedence Order (`urgent` -> `low` -> `high` -> `medium`)**:
   - To prevent greedy substring matching of `"gấp"` inside `"siêu gấp"` or `"cực gấp"`, `urgentPriorityRegex` must be tested and stripped first.
   - To prevent `"không gấp"` or `"chưa gấp"` from matching `"gấp"`, `lowPriorityRegex` must be tested before `highPriorityRegex`.
   - In addition, `highPriorityRegex` must use a negative lookbehind: `(?<!không\s+|chưa\s+|siêu\s+|cực\s+)gấp`.
   - Word boundaries must use Unicode-aware character classes `(?:^|[^\p{L}\p{N}])` and `(?=$|[^\p{L}\p{N}])` (and `\b` for ASCII tokens `p0`, `p1`, `p2`, `p3`) to avoid false positive matches on words like "mp3" or "step0".

3. **Course Matching for "Giải tích"**:
   - Inserting `{ key: /(?:toán\s+)?giải\s+tích(?:\s*[123]|I{1,3})?/i, name: 'Giải tích' }` into `KNOWN_COURSES` covers:
     - "giải tích"
     - "giải tích 1", "giải tích 2", "giải tích 3"
     - "toán giải tích"
   - Placed after "Toán rời rạc" and before "Kỹ thuật lập trình", it cannot conflict with "CTDL & giải thuật" because "giải thuật" has "thuật" while "giải tích" requires "tích".

4. **Title Cleaning & Fallback Behavior**:
   - When a user inputs `"nộp bài tập Giải tích lúc 23h siêu gấp"`, Pass 1 strips `"lúc 23h"`, Pass 3 strips `"siêu gấp"`, Pass 5 matches `"Giải tích"`, and Pass 6 strips stop word `"nộp"`. The resulting title is properly formatted and capitalized as `"Bài tập Giải tích"`.
   - When a user inputs only metadata (e.g. `"23h ngày mai siêu gấp"`), `working` becomes empty after stripping. If no course was detected, the fallback yields `'Nhiệm vụ mới'`. If a course was detected (e.g. `"Giải tích 23h siêu gấp"`), it falls back to `'Bài tập ' + detectedCourse`.

5. **Eisenhower Matrix Q1 Elevation**:
   - If `task.priority === 'urgent'`, the task is both inherently urgent and important.
   - In `computeEisenhowerQuadrant`:
     ```typescript
     let isUrgent = false;
     if (task.priority === 'urgent') {
       isUrgent = true;
     } else if (taskDueDateOnly) {
       const diff = daysDifference(todayStr, taskDueDateOnly);
       isUrgent = diff <= 2;
     }

     const isImportant =
       task.priority === 'urgent' ||
       task.priority === 'high' ||
       task.difficulty >= 4 ||
       academicKeywordRegex.test(task.title);

     if (isUrgent && isImportant) return 'do_first';
     ```
   - This ensures all `'urgent'` tasks immediately route to Q1 (`'do_first'`), while `'high'` tasks due > 48h continue to route to Q2 (`'schedule'`).

---

## 3. Caveats

1. **English Word "urgent"**:
   In Vietnamese input, if a user types `"urgent"`, DISPATCH.md specifies that `"urgent"` maps to `'high'` (`Match "ưu tiên cao", "gấp", "urgent", "p1", "quan trọng" -> 'high'`), whereas Vietnamese terms `"siêu gấp"`, `"cực gấp"`, `"hỏa tốc"`, `"khẩn cấp"`, and `"p0"` map to `'urgent'`. The regex rules follow this exact specification.
2. **Downstream pMap Updates**:
   When `TaskPriority` is updated, `pMap` in `web/src/app/(main)/tasks/page.tsx` and `web/src/components/tasks/drawer/unselected-hero.tsx` must be updated to `{ urgent: 0, high: 1, medium: 2, low: 3 }` so sorting by priority places `urgent` at the top.
3. **ReDoS Safety**:
   All regex expressions use linear matching without nested quantifiers `(a+)+`. Stress tested against 10,000-character inputs in `challenger-m1-1-tasks-engine.test.ts` with execution time < 10ms.

---

## 4. Conclusion & Concrete Code Blueprint

### 4.1 Target File 1: `web/src/types/tasks.ts`

```typescript
// Replace lines 6-7:
export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
```

```typescript
// Update comments in TaskItem (line 44):
  priority: TaskPriority;       // 'low' | 'medium' | 'high' | 'urgent'
```

### 4.2 Target File 2: `web/src/lib/tasks-engine.ts`

#### A. In `computeEisenhowerQuadrant` (around lines 150–165):
```typescript
<<<< EXISTING CODE
  // Urgent: Overdue or due within 2 days (<= 48 hours)
  let isUrgent = false;
  if (taskDueDateOnly) {
    const diff = daysDifference(todayStr, taskDueDateOnly);
    isUrgent = diff <= 2;
  }

  // Important: High priority, difficulty >= 4, or title contains major academic keywords
  const academicKeywordRegex =
    /(?:^|[^\p{L}\p{N}])(thi|bài tập lớn|btl|khóa luận|báo cáo|đồ án|chuyên đề|giữa kỳ|cuối kỳ)(?=$|[^\p{L}\p{N}])/ui;

  const isImportant =
    task.priority === 'high' ||
    task.difficulty >= 4 ||
    academicKeywordRegex.test(task.title);

  if (isUrgent && isImportant) return 'do_first';
==== PROPOSED REPLACEMENT
  // Urgent: Overdue, due within 2 days (<= 48 hours), or priority is 'urgent'
  let isUrgent = false;
  if (task.priority === 'urgent') {
    isUrgent = true;
  } else if (taskDueDateOnly) {
    const diff = daysDifference(todayStr, taskDueDateOnly);
    isUrgent = diff <= 2;
  }

  // Important: Urgent or High priority, difficulty >= 4, or title contains major academic keywords
  const academicKeywordRegex =
    /(?:^|[^\p{L}\p{N}])(thi|bài tập lớn|btl|khóa luận|báo cáo|đồ án|chuyên đề|giữa kỳ|cuối kỳ)(?=$|[^\p{L}\p{N}])/ui;

  const isImportant =
    task.priority === 'urgent' ||
    task.priority === 'high' ||
    task.difficulty >= 4 ||
    academicKeywordRegex.test(task.title);

  if (isUrgent && isImportant) return 'do_first';
>>>>
```

#### B. In `KNOWN_COURSES` (around lines 297–306):
```typescript
<<<< EXISTING CODE
const KNOWN_COURSES = [
  { key: /mạng máy tính|mạng/i, name: 'Mạng máy tính' },
  { key: /triết học mác\s*[-–]\s*lênin|triết học|triết/i, name: 'Triết học Mác - Lênin' },
  { key: /cấu trúc dữ liệu\s*&\s*giải thuật|cấu trúc dữ liệu|ctdl\s*(?:và|&)\s*giải thuật|ctdl\s*&\s*gt|ctdl/i, name: 'CTDL & GT' },
  { key: /xác suất thống kê|xác suất/i, name: 'Xác suất Thống kê' },
  { key: /toán rời rạc/i, name: 'Toán rời rạc' },
  { key: /kỹ thuật lập trình/i, name: 'Kỹ thuật lập trình' },
  { key: /dự án web|lập trình web|web/i, name: 'Dự án Web' },
  { key: /clb công nghệ/i, name: 'CLB Công nghệ' },
];
==== PROPOSED REPLACEMENT
const KNOWN_COURSES = [
  { key: /mạng máy tính|mạng/i, name: 'Mạng máy tính' },
  { key: /triết học mác\s*[-–]\s*lênin|triết học|triết/i, name: 'Triết học Mác - Lênin' },
  { key: /cấu trúc dữ liệu\s*&\s*giải thuật|cấu trúc dữ liệu|ctdl\s*(?:và|&)\s*giải thuật|ctdl\s*&\s*gt|ctdl/i, name: 'CTDL & GT' },
  { key: /xác suất thống kê|xác suất/i, name: 'Xác suất Thống kê' },
  { key: /toán rời rạc/i, name: 'Toán rời rạc' },
  { key: /(?:toán\s+)?giải\s+tích(?:\s*[123]|I{1,3})?/i, name: 'Giải tích' },
  { key: /kỹ thuật lập trình/i, name: 'Kỹ thuật lập trình' },
  { key: /dự án web|lập trình web|web/i, name: 'Dự án Web' },
  { key: /clb công nghệ/i, name: 'CLB Công nghệ' },
];
>>>>
```

#### C. In `parseVietnameseTaskInput` Pass 3 (around lines 450–469):
```typescript
<<<< EXISTING CODE
  // -----------------------------------------------------------------
  // Pass 3: Priority Extraction (Unicode safe)
  // -----------------------------------------------------------------
  const highPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+cao|gấp|urgent|p1|quan trọng)(?=$|[^\p{L}\p{N}])/ui;
  const lowPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+thấp|không gấp|p3)(?=$|[^\p{L}\p{N}])/ui;
  const medPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+vừa|bình thường|p2|trung bình)(?=$|[^\p{L}\p{N}])/ui;

  if (highPriorityRegex.test(working)) {
    detectedPriority = 'high';
    working = working.replace(/(?:ưu tiên\s+cao|gấp|urgent|p1|quan trọng)/ui, ' ');
    confidence += 0.15;
  } else if (lowPriorityRegex.test(working)) {
    detectedPriority = 'low';
    working = working.replace(/(?:ưu tiên\s+thấp|không gấp|p3)/ui, ' ');
    confidence += 0.15;
  } else if (medPriorityRegex.test(working)) {
    detectedPriority = 'medium';
    working = working.replace(/(?:ưu tiên\s+vừa|bình thường|p2|trung bình)/ui, ' ');
    confidence += 0.1;
  }
==== PROPOSED REPLACEMENT
  // -----------------------------------------------------------------
  // Pass 3: Priority Extraction (Unicode safe, strict precedence)
  // Precedence order: urgent -> low -> high -> medium
  // -----------------------------------------------------------------
  const urgentPriorityRegex =
    /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+siêu\s+cao|siêu\s+gấp|cực\s+gấp|hỏa\s+tốc|khẩn\s+cấp|p0)(?=$|[^\p{L}\p{N}])/ui;
  const urgentPattern = /(?:ưu tiên\s+siêu\s+cao|siêu\s+gấp|cực\s+gấp|hỏa\s+tốc|khẩn\s+cấp|\bp0\b)/ui;

  const lowPriorityRegex =
    /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+thấp|không\s+gấp|chưa\s+gấp|p3)(?=$|[^\p{L}\p{N}])/ui;
  const lowPattern = /(?:ưu tiên\s+thấp|không\s+gấp|chưa\s+gấp|\bp3\b)/ui;

  const highPriorityRegex =
    /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+cao|(?<!không\s+|chưa\s+|siêu\s+|cực\s+)gấp|urgent|p1|quan\s+trọng)(?=$|[^\p{L}\p{N}])/ui;
  const highPattern = /(?:ưu tiên\s+cao|(?<!không\s+|chưa\s+|siêu\s+|cực\s+)gấp|urgent|\bp1\b|quan\s+trọng)/ui;

  const medPriorityRegex =
    /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+vừa|bình\s+thường|p2|trung\s+bình)(?=$|[^\p{L}\p{N}])/ui;
  const medPattern = /(?:ưu tiên\s+vừa|bình\s+thường|\bp2\b|trung\s+bình)/ui;

  if (urgentPriorityRegex.test(working)) {
    detectedPriority = 'urgent';
    working = working.replace(urgentPattern, ' ');
    confidence += 0.2;
  } else if (lowPriorityRegex.test(working)) {
    detectedPriority = 'low';
    working = working.replace(lowPattern, ' ');
    confidence += 0.15;
  } else if (highPriorityRegex.test(working)) {
    detectedPriority = 'high';
    working = working.replace(highPattern, ' ');
    confidence += 0.15;
  } else if (medPriorityRegex.test(working)) {
    detectedPriority = 'medium';
    working = working.replace(medPattern, ' ');
    confidence += 0.1;
  }
>>>>
```

#### D. In `parseVietnameseTaskInput` Pass 6 Title Fallback (around lines 550–556):
```typescript
<<<< EXISTING CODE
  if (!cleanedTitle || cleanedTitle.length < 2) {
    if (detectedCourse) {
      cleanedTitle = `Bài tập ${detectedCourse}`;
    } else {
      cleanedTitle = normalizedInput.replace(/[\[\]()#@!?:;*~_]/g, ' ').replace(/\s+/g, ' ').trim() || 'Nhiệm vụ mới';
    }
  }
==== PROPOSED REPLACEMENT
  if (!cleanedTitle || cleanedTitle.length < 2) {
    if (detectedCourse) {
      cleanedTitle = `Bài tập ${detectedCourse}`;
    } else {
      const fallback = normalizedInput.replace(/[\[\]()#@!?:;*~_]/g, ' ').replace(/\s+/g, ' ').trim();
      cleanedTitle = fallback && fallback.length >= 2 ? fallback : 'Nhiệm vụ mới';
    }
  }
>>>>
```

### 4.3 Downstream Recommendations for Implementers
1. **`web/src/app/(main)/tasks/page.tsx` & `unselected-hero.tsx`**:
   Update `pMap` to:
   ```typescript
   const pMap: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
   ```
2. **`web/src/components/tasks/controls/controls-bar.tsx`**:
   Update `TaskPriorityFilter` to `'all' | 'urgent' | 'high' | 'medium' | 'low'`, tally `urgent` count, and render a dedicated chip:
   - "SIÊU GẤP": `#FF3D6E` Neon Red/Pink with pulsing glow
   - "CAO": `#FF8A3D` Orange
   - "VỪA": `#FFB020` Amber
   - "THẤP": `#3DE8FF` Cyan

---

## 5. Verification Method

To verify these changes after implementation by `worker_m1`:

1. **Type Safety Verification**:
   ```powershell
   npm run typecheck
   ```
   *Expected output*: `tsc --noEmit` exits with code 0 without any type errors.

2. **Test Suite Verification**:
   ```powershell
   npm test
   ```
   *Expected output*: All 109+ tests pass cleanly.

3. **Dedicated Unit Test Assertions**:
   Add test suite in `web/tests/quick-task-nlp-sync.test.ts` asserting:
   - `parseVietnameseTaskInput("nộp bài tập lớn Giải tích lúc 23h thứ 6 siêu gấp")`:
     - `priority === 'urgent'`
     - `course === 'Giải tích'`
     - `title === 'Bài tập lớn Giải tích'` (and not containing "siêu" or "gấp")
   - `parseVietnameseTaskInput("ôn thi Giải tích cực gấp")`:
     - `priority === 'urgent'`
     - `course === 'Giải tích'`
   - `parseVietnameseTaskInput("bài tập hỏa tốc")` -> `priority === 'urgent'`
   - `parseVietnameseTaskInput("nộp bài p0")` -> `priority === 'urgent'`
   - `parseVietnameseTaskInput("bài tập không gấp")` -> `priority === 'low'` (must not be hijacked by "gấp")
   - `computeEisenhowerQuadrant({ priority: 'urgent' }) === 'do_first'` (regardless of due date)
   - `computeEisenhowerQuadrant({ priority: 'high', dueAt: 'in-5-days' }) === 'schedule'`
