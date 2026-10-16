# Handoff Report — Explorer Survey 2: Vietnamese NLP Parser, Priority Tiers, and Test Architecture

**Author**: `explorer_survey_quicktask_2`  
**Date**: 2026-10-13T12:59:30Z  
**Target Milestone**: Quick Task (Tạo nhiệm vụ nhanh) Redesign (2026-10-13T12:48:34Z)  
**Scope**: Vietnamese NLP parsing logic, date/time/subject extraction, priority tiers, store synchronization, and test infrastructure in `web/src/lib/` and `web/tests/`.

---

## 1. Observation

### 1.1 Existing NLP Engine Implementation (`web/src/lib/tasks-engine.ts`)
- **Location**: `web/src/lib/tasks-engine.ts:312-570` exports `parseVietnameseTaskInput(rawInput: string, referenceDate: Date = new Date()): ParsedTaskResult`.
- **Pass 1: Time Extraction** (`tasks-engine.ts:351-417`):
  - Uses regexes:
    - `colonTimeRegex = /(?:lúc\s+|vào\s+)?(\d{1,2}):(\d{2})(?:\s*(sáng|chiều|chieu|tối|toi))?/i` (Line 353)
    - `combinedTimeRegex = /(?:lúc\s+|vào\s+)?(\d{1,2})h(\d{2})(?:\s*(sáng|chiều|chieu|tối|toi))?/i` (Line 354)
    - `prefixedHourRegex = /(?:lúc|vào)\s+(\d{1,2})h?(?:\s*(sáng|chiều|chieu|tối|toi))?/i` (Line 355)
    - `periodHourRegex = /(\d{1,2})h\s*(sáng|chiều|chieu|tối|toi)/i` (Line 356)
    - `hourNearDateRegex = /(\d{1,2})h(?:\s*(?:ngày|hôm|mai|mốt|thứ|chủ nhật|cn))/i` (Line 357)
    - `standaloneHourRegex = /(?:^|[^\p{L}\p{N}])(\d{1,2})\s*h(?=$|[^\p{L}\p{N}])/ui` (Line 358)
  - Period adjustments only account for `sáng`, `chiều`, `tối` (Lines 405-410). Word "giờ" without "h" (e.g. `11 giờ đêm`, `8 giờ sáng`) and period `đêm` / `dem` are not matched.
  - No handler exists for `cuối ngày` / `hết ngày` to map to `23:59`.
- **Pass 2: Duration Extraction** (`tasks-engine.ts:420-448`):
  - Handles minutes (`phút`, `phut`, `min`, `p`, `m`), word hours (`tiếng`, `tieng`, `giờ`, `gio`), float hours (`1.5h`), and int hours (`2h`). Defaults to 45 min if unspecified (Line 343).
- **Pass 3: Priority Extraction** (`tasks-engine.ts:450-469`):
  - Only extracts 3 priorities (`high`, `medium`, `low`):
    - `highPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+cao|gấp|urgent|p1|quan trọng)(?=$|[^\p{L}\p{N}])/ui` (Line 452)
    - `lowPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+thấp|không gấp|p3)(?=$|[^\p{L}\p{N}])/ui` (Line 453)
    - `medPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+vừa|bình thường|p2|trung bình)(?=$|[^\p{L}\p{N}])/ui` (Line 454)
  - Does NOT recognize "siêu gấp", "cực gấp", "hỏa tốc", "khẩn cấp", "p0", or 4th priority tier.
- **Pass 4: Date Extraction** (`tasks-engine.ts:471-528`):
  - Handles:
    - `hôm nay`, `tối nay`, `chiều nay`, `sáng nay` -> today (`offset = 0`)
    - `ngày mai`, `sáng mai`, `chiều mai`, `tối mai`, `mai` -> tomorrow (`offset = 1`)
    - `ngày kia`, `ngày mốt`, `mốt` -> day after tomorrow (`offset = 2`)
    - `thứ 2` .. `thứ 7`, `chủ nhật`, `cn` -> next upcoming weekday in next 7 days (`diff = (targetDay - currentDay + 7) % 7; if (diff === 0) diff = 7;`)
    - `DD/MM` or `DD-MM` with optional `YYYY` -> explicit date
  - Missing:
    - `cuối tuần` (not recognized)
    - `tuần sau` (not recognized)
    - `thứ X tuần sau` / `thứ X tuần tới` (falsely matches this week's weekday instead of adding 7 days)
- **Pass 5: Course Extraction** (`tasks-engine.ts:297-306`, `530-538`):
  - Catalog list `KNOWN_COURSES` contains 8 regexes:
    - Mạng máy tính, Triết học Mác - Lênin, CTDL & GT, Xác suất Thống kê, Toán rời rạc, Kỹ thuật lập trình, Dự án Web, CLB Công nghệ.
  - "Giải tích" (explicitly mentioned in requirement example `"ôn thi Giải tích thứ 6 tuần sau 90p"`) is NOT present.
- **Pass 6: Title Cleaning** (`tasks-engine.ts:541-559`):
  - Strips stop words `\b(?:nộp|làm|học|vào|lúc|ngày|cho|môn|deadline)\b`. If string becomes empty, falls back to `Bài tập ${detectedCourse}` or `Nhiệm vụ mới`.

### 1.2 Type Definitions (`web/src/types/tasks.ts`)
- `web/src/types/tasks.ts:7`:
  ```typescript
  export type TaskPriority = 'high' | 'medium' | 'low';
  ```
- `ParsedTaskResult` (`tasks.ts:63-72`):
  ```typescript
  export interface ParsedTaskResult {
    title: string;
    course?: string;
    dueDate: string;      // YYYY-MM-DD
    dueTime: string;      // HH:mm
    estimateMin: number;
    priority: TaskPriority;
    confidence: number;
    rawInput: string;
  }
  ```
- Requirement R2 specifies 4 distinct priority tiers:
  - Thấp (`#3DE8FF` Cyan)
  - Vừa (`#FFB020` Amber)
  - Gấp (`#FF8A3D` Orange)
  - Siêu gấp (`#FF3D6E` Neon Red/Pink)

### 1.3 State Synchronization Gap (`campus-store.ts` vs `dashboard/page.tsx`)
- In `web/src/lib/campus-store.ts:927-975`, `addTask`:
  - Inserts into `prev.tasks` only.
  - Does NOT insert into `prev.deadlines`.
  - Does NOT award `+10 XP` on task creation (XP was only awarded in `completeTask` or `recordCompletedSession`).
- In `web/src/app/(main)/dashboard/page.tsx:90-117` and `200-262`:
  - Dashboard previously used an inline rudimentary form (`quickCreateTitle`) that prepended to `prev.deadlines` directly and never called `addTask` or `parseVietnameseTaskInput`.
  - In `web/src/app/(main)/tasks/page.tsx:623`, the page opened `QuickAddModal` which only called `addTask` (updating `prev.tasks`, leaving `prev.deadlines` untouched).

### 1.4 Test Infrastructure (`web/tests/`)
- Command: `npm test` runs `node --experimental-strip-types --test tests/*.test.ts`.
- Command Execution Result:
  - **109 tests passed**, 0 failures, duration ~2.47s.
  - Typecheck: `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.
- Existing suites:
  1. `tasks-redesign.test.ts` (45 tests) — Covers basic NLP (6 tests), Eisenhower (6 tests), Date grouping (6 tests), Urgency (6 tests), Store operations (7 tests), Boundary (6 tests), Cross-feature (3 tests), Real-world (6 tests), Drawer (6 tests).
  2. `challenger-m1-1-tasks-engine.test.ts` (14 tests) — Adversarial boundary checks (Leap year, NFD Unicode, CNTT/CNPM vs "cn", standalone hours, ReDoS 10k chars).
  3. `challenger-m1-2-stress.test.ts` (13 tests) — Shared store date anchoring, level progression, session XP.
  4. `challenger-m1-tasks-reactivity.test.ts` (10 tests) — Reactivity and store deep-freeze immutability.
  5. `campus-redesign.test.ts` (18 tests) — Calendar loadScore, conflicts, NLP event parser, ICS.
  6. `supervisor-arbiter.test.ts` (3 tests).
  7. `auditor-m3-forensics.test.ts` (0 tests).
  8. `workspace-permissions.test.ts` (6 tests).

---

## 2. Logic Chain

1. **Premise 1**: The user request (R1) specifies extracting title, date (`hôm nay`, `mai`, `mốt`, `thứ X`, `cuối tuần`, `tuần sau`, explicit `DD/MM`), time (`23h`, `11 giờ đêm`, `14h30`, `8h sáng`, `cuối ngày`), course (`Mạng máy tính`, `Toán rời rạc`, `Triết học`, `CTDL & GT`, `Giải tích`), and estimated duration (`90p`, `2 tiếng`).
2. **Step 1 (Time Gaps)**: Observation 1.1 reveals `periodHourRegex` and period matching only look for `h` and `sáng|chiều|tối`. When input contains `11 giờ đêm`, `giờ` is skipped because `h` is missing, and `đêm` is not an accepted period keyword. Similarly, `cuối ngày` is completely unhandled. Therefore, regex extensions for `giờ`, `đêm`, and `cuối ngày` are required in `tasks-engine.ts`.
3. **Step 2 (Date Gaps)**: Observation 1.1 reveals `parseVietnameseTaskInput` has no rules for `cuối tuần`, `tuần sau`, or `thứ X tuần sau`. When `thứ 6 tuần sau` is provided, `dowMatch` only matches `thứ 6` for the current week. Therefore, date extraction must parse `tuần sau` modifiers (adding +7 days to the target weekday) and map `cuối tuần` to the upcoming Saturday/Sunday.
4. **Step 3 (Course Catalog Gap)**: Observation 1.1 shows `KNOWN_COURSES` lacks `Giải tích`. Adding `/(?:ôn\s+thi\s+)?giải tích|vi tích phân|calculus/i` -> `'Giải tích'` and supporting an optional `catalog?: string[]` parameter ensures prompt examples parse with 100% precision.
5. **Step 4 (Priority Tiers Gap)**: Observation 1.2 shows `TaskPriority` is currently typed as `'high' | 'medium' | 'low'`, whereas R2 mandates 4 distinct tiers: Thấp (`#3DE8FF`), Vừa (`#FFB020`), Gấp (`#FF8A3D`), Siêu gấp (`#FF3D6E`).
   - By upgrading the union to `export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';`:
     - `'low'` = Thấp (#3DE8FF)
     - `'medium'` = Vừa (#FFB020)
     - `'high'` = Gấp (#FF8A3D)
     - `'urgent'` = Siêu gấp (#FF3D6E)
   - This maintains 100% backward compatibility with all existing code referencing `'low'`, `'medium'`, and `'high'` while adding `'urgent'` as the 4th tier.
   - In `tasks-engine.ts`, checking `siêu gấp|cực gấp|hỏa tốc|khẩn cấp|p0|asap` BEFORE `gấp` prevents greedy/partial matching.
6. **Step 5 (Store Synchronization Gap)**: Observation 1.3 shows that `/dashboard` Deadline Arena reads from `state.deadlines`, but `addTask` only populated `state.tasks`.
   - Creating a unified store helper (e.g. `addQuickTask` or updating `addTask` to add a matching `DeadlineItem` and `+10 XP`) satisfies R4 and ensures tasks created in the Quick Task modal appear immediately in Deadline Arena on `/dashboard` and in `/tasks`, with atomic undo reversing both.
7. **Step 6 (Test Infrastructure & Coverage)**: Observation 1.4 confirms that native `node:test` runs all `tests/*.test.ts`. Adding `web/tests/quick-task-nlp-sync.test.ts` will instantly be executed by `npm test` without any test runner configuration changes.

---

## 3. Caveats

1. **Adversarial Test Invariant in `challenger-m1-1-tasks-engine.test.ts`**:
   - Line 189 tests `học 2 tiếng 30 phút` and asserts `assert.equal(parsedCompound.estimateMin, 30)` and `assert.equal(parsedCompound.title, '2 tiếng')`. If modifying compound duration parsing to sum hours + minutes (e.g. 150m), this specific challenger test will fail unless updated or preserved.
   - Line 204 tests `nộp bài 2026-11-25 18h` and asserts `assert.equal(parsedIso.dueDate, '2026-11-26')` (documenting an explicit date parser quirk). Any change to `explicitDateRegex` must not alter this behavior without coordinating with that test.
2. **Mobile and Reduced Motion Constraints**:
   - The Quick Task modal requires a Vanilla Three.js particle canvas (R3). As observed in `floating-blocks-3d.tsx`, Three.js canvas must gracefully unmount and dispose geometries, materials, and renderer on unmount, and be disabled when `prefers-reduced-motion` or `state.reducedMotion` is true.

---

## 4. Conclusion

The Vietnamese NLP engine in `web/src/lib/tasks-engine.ts` has a strong multi-pass foundation, but requires targeted pattern upgrades for:
1. `cuối tuần`, `tuần sau`, and `thứ X tuần sau` in Pass 4.
2. `11 giờ đêm`, `8 giờ sáng`, `giờ`, `đêm`, and `cuối ngày` in Pass 1.
3. Adding `Giải tích` to `KNOWN_COURSES` in Pass 5.
4. Expanding `TaskPriority` in `src/types/tasks.ts` to include `'urgent'` (Siêu gấp), with priority detection precedence in Pass 3.
5. Implementing dual-write store synchronization so that creating a task via Quick Task inserts both `TaskItem` into `state.tasks` and `DeadlineItem` into `state.deadlines`, awards `+10 XP`, and provides a 5-second undo toast.

### Proposed Code Adjustments

#### A. Type Definition Upgrade (`web/src/types/tasks.ts:7`)
```typescript
// Before:
export type TaskPriority = 'high' | 'medium' | 'low';

// Proposed:
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
```

#### B. NLP Engine Upgrades (`web/src/lib/tasks-engine.ts`)
```typescript
// 1. KNOWN_COURSES addition:
const KNOWN_COURSES = [
  { key: /mạng máy tính|mạng/i, name: 'Mạng máy tính' },
  { key: /triết học mác\s*[-–]\s*lênin|triết học|triết/i, name: 'Triết học Mác - Lênin' },
  { key: /cấu trúc dữ liệu\s*&\s*giải thuật|cấu trúc dữ liệu|ctdl\s*(?:và|&)\s*giải thuật|ctdl\s*&\s*gt|ctdl/i, name: 'CTDL & GT' },
  { key: /xác suất thống kê|xác suất/i, name: 'Xác suất Thống kê' },
  { key: /toán rời rạc/i, name: 'Toán rời rạc' },
  { key: /giải tích|vi tích phân|calculus/i, name: 'Giải tích' },
  { key: /kỹ thuật lập trình/i, name: 'Kỹ thuật lập trình' },
  { key: /dự án web|lập trình web|web/i, name: 'Dự án Web' },
  { key: /clb công nghệ/i, name: 'CLB Công nghệ' },
];

// 2. Pass 1 Time Extraction regex enhancements:
const endOfDayRegex = /\b(?:cuối ngày|hết ngày)\b/i;
const wordHourMinuteRegex = /(?:lúc\s+|vào\s+)?(\d{1,2})\s*(?:giờ|h)\s*(\d{2})?(?:\s*(sáng|chiều|chieu|tối|toi|đêm|dem))?/i;
// If endOfDayRegex matches -> detectedDueTime = '23:59'
// If period is 'đêm' or 'dem' and h < 12 -> h += 12

// 3. Pass 3 Priority Extraction 4-tier check (Siêu gấp check first):
const urgentPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:siêu\s*gấp|cực\s*gấp|hỏa\s*tốc|khẩn\s*cấp|p0|asap)(?=$|[^\p{L}\p{N}])/ui;
const highPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+cao|gấp|urgent|p1|quan trọng)(?=$|[^\p{L}\p{N}])/ui;
const lowPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+thấp|không gấp|p3)(?=$|[^\p{L}\p{N}])/ui;
const medPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+vừa|bình thường|p2|trung bình)(?=$|[^\p{L}\p{N}])/ui;

// 4. Pass 4 Date Extraction "tuần sau" and "cuối tuần":
const nextWeekModifier = /\b(?:tuần sau|tuần tới)\b/i.test(working);
// If day of week matches and nextWeekModifier is true: diff += 7
// If "cuối tuần" matches: diff to next Saturday/Sunday
```

#### C. Store Sync Function (`web/src/lib/campus-store.ts`)
```typescript
export function addQuickTask(
  taskData: Omit<TaskItem, 'id' | 'createdAt' | 'order'>
): { task: TaskItem; deadline: DeadlineItem; undo: () => void } {
  let createdTask: TaskItem;
  let createdDeadline: DeadlineItem;

  updateSharedState((prev) => {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const deadlineId = `dl-${id}`;
    const createdAt = new Date().toISOString();
    const order = prev.tasks.length;
    const dueAt = taskData.dueAt || `${formatIsoDateOnly(new Date(), 0)}T23:59:00`;
    const dueDateOnly = dueAt.slice(0, 10);

    createdTask = {
      id,
      createdAt,
      order,
      title: taskData.title,
      course: taskData.course,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      difficulty: taskData.difficulty ?? 3,
      dueAt,
      estimateMin: taskData.estimateMin ?? 45,
      actualMin: 0,
      steps: taskData.steps || [],
      tags: taskData.tags || [],
      pomodoros: taskData.pomodoros || { planned: 1, done: 0 },
      activityLog: [{ id: `log-${Date.now()}`, timestamp: createdAt, action: 'created', detail: 'Tạo nhanh nhiệm vụ' }],
    };

    createdDeadline = {
      id: deadlineId,
      title: taskData.title,
      course: taskData.course || 'Nhiệm vụ nhanh',
      dueDate: dueAt,
      date: dueDateOnly,
      displayDate: dueAt.includes('T') ? `${dueDateOnly} · ${dueAt.split('T')[1]?.slice(0, 5)}` : dueDateOnly,
      urgent: taskData.priority === 'urgent' || taskData.priority === 'high',
      completed: false,
      isExam: false,
    };

    return {
      tasks: [createdTask, ...prev.tasks],
      deadlines: [createdDeadline, ...prev.deadlines],
      xp: prev.xp + 10,
    };
  });

  const undo = () => {
    updateSharedState((prev) => ({
      tasks: prev.tasks.filter((t) => t.id !== createdTask.id),
      deadlines: prev.deadlines.filter((d) => d.id !== createdDeadline.id),
      xp: Math.max(0, prev.xp - 10),
    }));
  };

  return { task: createdTask!, deadline: createdDeadline!, undo };
}
```

---

## 5. Verification Method

1. **Type Safety Verification**:
   - Command: `npm run typecheck` in `web/`
   - Expected Output: `tsc --noEmit` exits with code 0.
2. **Unit Test Verification**:
   - Command: `npm test` in `web/`
   - Invalidation Conditions:
     - Any test failure in existing 109 tests.
     - Failure to parse `"ôn thi Giải tích thứ 6 tuần sau 90p"`, `"11 giờ đêm"`, `"cuối ngày"`, or `"siêu gấp"`.
     - Incomplete store synchronization where creating a quick task does not append to both `state.tasks` and `state.deadlines`.
3. **New Test Suite File to Add**:
   - File path: `web/tests/quick-task-nlp-sync.test.ts`
   - Test cases to include:
     - `NLP: parses "Nộp bài tập lớn Mạng máy tính lúc 23h thứ 6"`
     - `NLP: parses "ôn thi Giải tích thứ 6 tuần sau 90p"`
     - `NLP: parses "làm slide Triết ngày mai"`
     - `NLP: parses "cuối ngày" and "11 giờ đêm"`
     - `NLP: parses 4 priority tiers (thấp, vừa, gấp, siêu gấp)`
     - `NLP: fallback to today 23:59 when no date/time given`
     - `Store: addQuickTask syncs to state.tasks and state.deadlines, awards +10 XP, and undo reverts cleanly`
