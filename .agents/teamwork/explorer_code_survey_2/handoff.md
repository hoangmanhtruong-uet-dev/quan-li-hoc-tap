# Codebase & Store Exploration Report: CampusOS /tasks Page Rebuild

## 1. Observation

### 1.1 `web/package.json` Dependencies & Scripts
Direct observation of `web/package.json`:
- **Test command** (Line 11): `"test": "node --experimental-strip-types --test tests/*.test.ts"`.
- **Installed graphics/UI packages**:
  - `three`: `^0.186.1` (Line 35) & `@types/three`: `^0.186.0` (Line 19) — **Present and installed**.
  - `lucide-react`: `^1.24.0` (Line 25) — **Present and installed**.
  - `next`: `14.2.5` (Line 28), `react`: `18.3.1` (Line 29), `react-dom`: `18.3.1` (Line 30).
  - `@radix-ui/react-separator`: `^1.1.15`, `@radix-ui/react-slot`: `^1.3.3`, `@radix-ui/react-tooltip`: `^1.2.16`.
  - `tailwindcss`: `3.4.10`, `tailwindcss-animate`: `^1.0.7`, `clsx`: `^2.1.1`, `tailwind-merge`: `^3.6.0`.
  - `@supabase/supabase-js`: `^2.117.3` (Line 18).
- **Missing / Uninstalled packages**:
  - `canvas-confetti`: **Not in `package.json`**. (In `src/components/dashboard/deadline-arena.tsx:91-145`, confetti is implemented in ~30 lines of zero-dependency Canvas2D).
  - `@dnd-kit/core`, `@dnd-kit/sortable`: **Not in `package.json`**. (In `src/components/calendar/`, drag-and-drop is implemented using native HTML5 drag-and-drop).
  - `framer-motion`: **Not in `package.json`**. (Animations are powered by CSS transitions, GPU-accelerated transforms, and `tailwindcss-animate`).
  - `zustand`: **Not in `package.json`**. (State management uses React 18 `useSyncExternalStore` in `src/lib/campus-store.ts`).
  - `@react-three/fiber` / `@react-three/drei`: **Not in `package.json`**. (Vanilla `three` is used directly in `src/features/pomodoro/talking-tom-3d.tsx:4`).
  - `date-fns`, `zod`: **Not in `package.json`**.

### 1.2 `web/src/lib/campus-store.ts` Architecture & State Model
- **Hook & Sync mechanism** (Lines 7, 738-770):
  - Uses `useSyncExternalStore` with pub/sub `subscribers = new Set<() => void>()`.
  - Backed by `window.localStorage` key `campusos-shared-v2` (Line 177).
  - Dispatches `CustomEvent('campusos-store-update')` for cross-component reactive updates and storage events for cross-tab sync (Lines 638-658).
  - Debounced push to Supabase Cloud via `pushToSupabaseCloudDebounced(next)` (Line 561).
- **Existing `CampusOSSharedState` fields** (Lines 149-175):
  ```typescript
  export interface CampusOSSharedState {
    // Gamification
    xp: number;
    level: number;
    rankTitle: string;
    streak: number;
    streakFreezes: number;
    studyMinutesTotal: number;
    weeklyStudyGoalMinutes: number;
    weeklyStudyMinutesCurrent: number;
    lastStudyDate: string; // YYYY-MM-DD
    badges: string[];

    // Mood
    dailyMood: DailyMood | null;
    moodTimestamp?: string;

    // Vibe & Accessibility
    vibeTheme: VibeTheme;
    reducedMotion: boolean;

    // Collections & AI
    deadlines: DeadlineItem[];
    kanbanTasks: KanbanTask[];
    events: CalendarEvent[];
    aiCoachAccepted: boolean;
  }
  ```
- **Existing Task-related types**:
  - `DeadlineItem` (Lines 33-43): `{ id: string; title: string; course?: string; dueDate?: string; date?: string; displayDate?: string; urgent?: boolean; completed?: boolean; isExam?: boolean; }`
  - `KanbanTask` (Lines 136-144): `{ id: string; title: string; detail: string; column: 'todo' | 'review' | 'done'; status?: string; courseOrClub?: string; assignees?: Array<{ name: string; avatar?: string }>; }`
  - **CRITICAL GAP**: There is **no primary `tasks: TaskItem[]` collection** in `CampusOSSharedState`.

### 1.3 `web/src/lib/supabase-sync.ts` & Database Schema
- Supabase sync is non-blocking with offline fallback (Lines 22-25, 90-93, 164-167).
- In `supabase/migrations/002_dashboard_calendar_sync.sql`:
  - `student_profiles`: `xp`, `level`, `rank_title`, `streak`, `streak_freezes`, `study_minutes_total`, `weekly_goal_minutes`, `weekly_study_minutes`, `last_study_date`, `daily_mood`, `vibe_theme`, `reduced_motion`.
  - `student_deadlines`: `id`, `user_id`, `title`, `course`, `due_date`, `date`, `display_date`, `urgent`, `completed`, `is_exam`.
  - `student_calendar_events`: `id`, `user_id`, `title`, `date`, `start_time`, `end_time`, `type`, `location`, `description`, `done`, `checklist`.
  - `student_focus_sessions`: `id`, `user_id`, `focus_minutes`, `mode`, `discipline_score`, `shame_count`, `xp_gained`, `completed_at`.

### 1.4 Existing `/tasks` Page (`web/src/app/(main)/tasks/page.tsx`)
- Monolithic 152-line implementation.
- **Isolated Storage** (Lines 41-49): Uses `window.localStorage.getItem('campusos-tasks-v1')` completely separate from `campus-store.ts`. Completing tasks awards no XP, no streak progress, and has no cloud sync.
- **Hardcoded 2026-08 dates** (Lines 16-20): `2026-08-19`, `2026-08-20`, `2026-08-21`, `2026-08-22`. Against current date (October 2026), all tasks appear indefinitely expired.
- **Single List View only**: No Kanban view, no Eisenhower matrix, no Today Plan view.
- **Right drawer empty state waste** (Line 144): Displays a static placeholder ("Chọn một nhiệm vụ") taking up 23rem (1/3 of desktop viewport) when no task is selected.
- **UI defects**: Priority filter is a raw HTML `<select>` (Line 135). Search input has generic placeholder. No drag-and-drop. No bulk actions. No keyboard navigation.
- **Shared Form Modal** (`src/components/shared/task-form-modal.tsx`): 75-line modal with static defaults.

### 1.5 Test Suite Architecture (`web/tests/`)
- Run with Node native test runner (`node:test`) and strict assertions (`node:assert/strict`).
- Requires explicit `.ts` extensions in import paths (e.g. `import { ... } from '../src/lib/gamification.ts';`).
- Current tests count: **33 tests across 4 files**:
  1. `tests/campus-redesign.test.ts` (14 tests): Gamification tiers, Streak/freezes, Calendar load score, Conflict detection, Vietnamese NLP event parsing, RFC 5545 `.ics` export/parse, Auto-scheduler greedy packing, Campus store state anchoring.
  2. `tests/challenger-m1-2-stress.test.ts` (10 tests): Dynamic date anchoring across leap year and new year rollovers, XP calculation boundaries, `recordCompletedSession` store persistence, streak freeze deduction and reset, rank tier boundaries, `daysDifference` UTC calculation, Global shortcuts key handling & input field suppression, accessibility modal role/esc audit.
  3. `tests/supervisor-arbiter.test.ts` (3 tests): Supervisor roast cooldown, document browsing exemption, discipline score calculation.
  4. `tests/workspace-permissions.test.ts` (6 tests): RBAC owner/admin/manager/viewer permissions, role management boundaries, owner immutability.
- Total existing tests: **14 + 10 + 3 + 6 = 33 tests**.

---

## 2. Logic Chain

1. **State Disconnection Chain**:
   - *Observation*: `tasks/page.tsx` reads/writes `'campusos-tasks-v1'`, while `dashboard/page.tsx` reads/writes `campus-store.ts` (`deadlines` collection).
   - *Reasoning*: Because `/tasks` is disconnected from `campus-store.ts`, tasks added in `/tasks` do not show up in `/dashboard` or `/calendar`, and ticking tasks complete awards 0 XP and fails to increment student level or streak.
   - *Implication*: `CampusOSSharedState` in `campus-store.ts` must be extended to include `tasks: TaskItem[]`. Common tasks (like `'network-project'`) should be seeded in both `tasks` and `deadlines` with unified completion synchronization.

2. **Task Schema Extension Chain**:
   - *Observation*: P0 and P1 requirements mandate:
     - Eisenhower 2x2 matrix (`quadrant: 'do' | 'schedule' | 'delegate' | 'delete'`).
     - Subtasks checklist with drag-to-reorder and progress (`steps: Array<{ id: string; text: string; done: boolean }>`).
     - Pomodoro mini integration (`pomodoros: { planned: number; done: number }`).
     - Estimate vs actual minutes (`estimateMin: number; actualMin?: number`).
     - Difficulty ratings (1-5 stars) and tags (`difficulty?: number; tags?: string[]`).
     - Kanban column mapping (`status: 'todo' | 'in_progress' | 'done'`).
   - *Reasoning*: The existing `DeadlineItem` cannot support these fields without breaking existing dashboard and calendar consumers, unless `TaskItem` is defined with these fields and `DeadlineItem` is kept compatible.

3. **Vanilla Three.js vs External Bundles Chain**:
   - *Observation*: `package.json` contains `three: ^0.186.1` but does NOT contain `@react-three/fiber` or `@react-three/drei`. `talking-tom-3d.tsx` proves vanilla `three` works smoothly with clean lifecycle cleanup on unmount.
   - *Reasoning*: The `/grill-me` architectural decision explicitly instructed: "Lightweight vanilla Three.js (`three` is already installed) with instanced mesh ~40 drifting cubes/stars; lazy-loaded with Canvas2D/static fallback on mobile and `prefers-reduced-motion`. Do not add heavy external wrapper packages."
   - *Implication*: Header 3D floating blocks (`FloatingBlocks3D`) must be written in vanilla Three.js using `THREE.InstancedMesh(geometry, material, 40)` inside a `useRef<HTMLDivElement>` container, lazy-loaded with `next/dynamic({ ssr: false })`, and gracefully bypassed when `state.reducedMotion` or mobile width is detected.

4. **Zero-Dependency 120FPS Implementation Chain**:
   - *Observation*: `canvas-confetti` and `@dnd-kit` are not installed. `deadline-arena.tsx` implements a 45-particle Canvas2D confetti in ~30 lines. `calendar/` implements drag-and-drop with HTML5 native drag events (`onDragStart`, `onDragOver`, `onDrop`).
   - *Reasoning*: Adding heavy third-party drag-and-drop and animation packages would bloat the bundle, conflict with existing Next.js 14 App Router setup, and risk frame drops. Native HTML5 drag-and-drop and lightweight Canvas2D particle burst guarantee zero extra dependencies and 120FPS performance.

5. **Test Suite Extension Chain**:
   - *Observation*: The runner `node --experimental-strip-types --test tests/*.test.ts` executes all files matching `tests/*.test.ts`. All 33 existing tests rely on pure helper functions in `src/lib/*.ts` with `.ts` extensions in import paths.
   - *Reasoning*: Pure computational logic for tasks (NLP Vietnamese parsing, Eisenhower quadrant calculation, and task date grouping) can be implemented in modular libraries (`src/lib/tasks-engine.ts` or `src/lib/tasks/*.ts`) and tested directly in a new test file `tests/tasks-redesign.test.ts`.
   - *Implication*: The new tests will be executed alongside the 33 existing tests by `npm test` without any configuration changes.

---

## 3. Caveats

1. **Supabase Schema Invariant**: `student_tasks` table is not currently defined in `supabase/migrations/002_dashboard_calendar_sync.sql`. The existing table is `student_deadlines`. All Supabase push/pull routines in `supabase-sync.ts` must maintain try/catch blocks and map task records to `student_deadlines` or safely degrade to local storage if a remote `student_tasks` table does not exist.
2. **Date Anchoring Dependency**: Unit tests must NEVER hardcode fixed calendar dates (such as August 2026) without passing a mock `referenceDate`. Tests must pass `new Date('2026-10-13T09:00:00Z')` as `referenceDate` so tests remain deterministic across all runs.
3. **No Build/Test Execution Constraint**: Per explorer role constraints, no build or test commands were executed during this investigation. All analysis is verified by static inspection of source files, dependencies, and test assertions.

---

## 4. Conclusion

1. **CampusStore Architecture**:
   - Add `TaskItem` interface and `tasks: TaskItem[]` to `CampusOSSharedState`.
   - Seed `tasks` dynamically in `createDefaultSharedState(referenceDate)` anchored around real reference date (today, day+1, day+2, day+3, day+5).
   - Add store actions: `completeTask(id, xp = 20)`, `addTask(task)`, `updateTask(id, patch)`, `deleteTask(id)`, and `bulkUpdateTasks(ids, patch)`.
   - Ensure `completeTask` awards XP, triggers streak progression, checks badges, and updates `lastStudyDate`.
   - Update `supabase-sync.ts` to sync `tasks` safely with offline-first fallback.

2. **Tasks Page Modular Refactoring Plan**:
   - Replace monolithic `tasks/page.tsx` with a clean page importing modular components:
     - `src/components/tasks/header/quest-board-header.tsx`: Header title, subtitle, stat stickers, circular SVG progress ring, and vanilla Three.js instanced mesh background (`floating-blocks-3d.tsx`).
     - `src/components/tasks/controls/smart-controls-bar.tsx`: Segmented view switcher (`Danh sách · Kanban · Ma trận · Hôm nay`), search bar with `/` shortcut, count-badged status chips, custom priority chips, sort dropdown, and floating bulk action bar.
     - `src/components/tasks/list/task-list-view.tsx`: Sticky grouped headers (`Quá hạn · Hôm nay · Ngày mai · Tuần này · Sau đó · Đã xong`), interactive ticket cards with countdown badges, SVG checkmark draw, and confetti + `+XP` animation.
     - `src/components/tasks/kanban/task-kanban-view.tsx`: 3 columns (`Cần làm · Đang làm · Hoàn thành`), HTML5 drag-and-drop, WIP warning for > 3 active tasks.
     - `src/components/tasks/matrix/task-matrix-view.tsx`: 2x2 Eisenhower matrix (`Làm ngay`, `Lên lịch`, `Giao/Dời`, `Bỏ bớt`) with neon pulsing border on Urgent & Important quadrant.
     - `src/components/tasks/today/task-today-view.tsx`: Top ~5 AI-curated tasks, capacity hours vs available time bar, "Chấp nhận kế hoạch" button to push study blocks to `events`.
     - `src/components/tasks/detail/task-detail-drawer.tsx`: When unselected, shows "Việc tiếp theo nên làm" hero ticket + mini weekly heatmap + AI study tips. When selected, displays in-place title editing, priority, difficulty stars, drag-reorderable subtasks checklist, notes, and Pomodoro focus launch button.
     - `src/components/tasks/create/task-quick-add-modal.tsx`: Vietnamese NLP input + AI Task Breakdown modal.

3. **Test Suite Plan**:
   - Create `web/tests/tasks-redesign.test.ts` testing:
     - `parseVietnameseTaskInput(rawInput, referenceDate)`: Title, due date, duration, priority, course extraction.
     - `computeEisenhowerQuadrant(task, referenceDate)`: Deterministic quadrant classification.
     - `groupTasksByDueDate(tasks, referenceDate)`: 6 sticky date groups (`overdue`, `today`, `tomorrow`, `this_week`, `later`, `done`).
     - Task completion XP & level progression in store.
   - All imports must use explicit `.ts` paths to satisfy `node --experimental-strip-types`.

4. **Dependencies Strategy**:
   - Use vanilla `three` already installed (`three@^0.186.1`).
   - Use native Canvas2D for confetti and particles (zero external dependency).
   - Use native HTML5 drag-and-drop for Kanban and matrix interactions.
   - Use CSS/Tailwind transitions for zero-lag 120FPS layout animations.

---

## 5. Verification Method

1. **Verify Dependencies**:
   Inspect `web/package.json` lines 14-49. Confirm `three` and `@types/three` are present. Confirm no external bloat packages (`canvas-confetti`, `@dnd-kit`, `framer-motion`) are required.
2. **Verify Existing Tests**:
   Inspect `web/tests/`:
   - `campus-redesign.test.ts` (Lines 1-356)
   - `challenger-m1-2-stress.test.ts` (Lines 1-368)
   - `supervisor-arbiter.test.ts` (Lines 1-34)
   - `workspace-permissions.test.ts` (Lines 1-47)
   Verify the total count of tests equals 33 tests.
3. **Verify Store & Page Isolation**:
   Inspect `web/src/app/(main)/tasks/page.tsx` line 41 (`campusos-tasks-v1` vs `campusos-shared-v2` in `campus-store.ts`).
4. **Invalidation Conditions**:
   - If `npm test` in `web/` fails to parse `.ts` files, check whether local relative import paths include the required `.ts` extensions.
   - If Three.js instanced mesh causes high GPU load, check if DPR is clamped (`Math.min(window.devicePixelRatio, 1.25)`) and `reducedMotion` check is active.
