# Handoff Report — Explorer Survey 3: Three.js 3D FX, Store Synchronization & Gamification

## 1. Observation

### 1.1 Three.js Configuration & Existing 3D Patterns
- **Dependencies**: In `web/package.json`:
  - Line 19: `"@types/three": "^0.186.0"`
  - Line 35: `"three": "^0.186.1"`
  - Three.js is already installed natively. No additional heavy wrappers or packages are required.
- **Reference 3D Components in Codebase**:
  - `src/components/tasks/header/floating-blocks-3d.tsx` (lines 87–364):
    - Uses vanilla Three.js with `THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance', precision: 'mediump', stencil: false, depth: true })`.
    - DPR bounded: `Math.min(window.devicePixelRatio || 1, 1.25)`.
    - Throttling: `if (document.hidden) return;` skips animation frames when browser tab is hidden.
    - Fallback: Checks `window.innerWidth < 768` and `state.reducedMotion`, gracefully falling back to CSS radial aurora gradients without mounting WebGL.
    - Lifecycle cleanup (lines 350–363): calls `cancelAnimationFrame(animId)`, unbinds `mousemove` and `resize` listeners, disposes geometries (`cubeGeo.dispose()`, `burstGeo.dispose()`), materials (`cubeMat.dispose()`, `burstMat.dispose()`), renderer (`renderer.dispose()`), and removes the canvas DOM node.
  - `src/features/pomodoro/talking-tom-3d.tsx` (lines 72–100):
    - Reaffirms the same 120FPS WebGL renderer flags (`powerPreference: 'high-performance'`, bounded DPR, cleanup on unmount).

### 1.2 Store Synchronization in `campus-store.ts`
- **Current State Structure**:
  - `CampusOSSharedState` (lines 150–177) contains:
    - `tasks: TaskItem[]` (lines 472–646, lines 927–975)
    - `deadlines: DeadlineItem[]` (lines 34–44, lines 384–440)
    - `xp: number`, `level: number`, `rankTitle: string` (lines 46–89)
- **Current Disconnection between Tasks & Deadlines**:
  - `addTask()` in `campus-store.ts` (lines 927–975) prepends only to `prev.tasks`. It does NOT add an entry to `prev.deadlines` and does NOT award XP on task creation.
  - In `src/app/(main)/dashboard/page.tsx` (lines 94–110), the previous quick-create handler only appended to `prev.deadlines`, completely ignoring `prev.tasks` and awarding no XP.
  - There is currently no unified `addQuickTask()` or standalone `addDeadline()` helper in `campus-store.ts`.
  - `completeTask()` in `campus-store.ts` (lines 1061–1071) and `updateTask()` (lines 1121–1139) already sync matching deadlines by matching `d.id === id || d.id === task.id.replace(/^task-/, '') || d.title.toLowerCase() === task.title.toLowerCase()`.
  - `deleteTask()` (lines 1149–1163) currently only removes from `prev.tasks`, leaving matching deadlines intact if not explicitly handled.

### 1.3 Deadline Arena in `src/components/dashboard/deadline-arena.tsx`
- **Component Anatomy** (lines 43–59, lines 233–348, lines 350–434):
  - Displays `heroDeadline` in an asymmetric bento cell with a giant `HH:MM:SS` live countdown and panic shake animation (`animate-panic-shake`) when `< 3h`.
  - Displays `secondaryDeadlines` below in ticket-style cards.
  - When a user checks a deadline (lines 148–179), it fires 2D canvas confetti, plays a floating `+50 XP` pill, and updates `state.xp`.
  - Reordering is supported via `moveDeadline(fromIndex, toIndex)` updating `state.deadlines`.
  - **Missing Feature**: Does not currently listen for new deadline creation events, nor does it have a flashing highlight border state for newly added cards.

### 1.4 Vietnamese NLP Engine in `src/lib/tasks-engine.ts`
- `parseVietnameseTaskInput()` (lines 312–570):
  - Pass 1 (Time): Parses `23h`, `14h30`, `8h sáng`, `10:00`.
  - Pass 2 (Duration): Parses `30p`, `45 phút`, `1.5h`, `2 tiếng`.
  - Pass 3 (Priority): Matches `high` (`ưu tiên cao`, `gấp`, `p1`), `medium` (`ưu tiên vừa`, `bình thường`), `low` (`ưu tiên thấp`, `không gấp`).
  - Pass 4 (Date): Matches `hôm nay`, `ngày mai`, `ngày kia`, `mốt`, `thứ 2-7`, `chủ nhật`, `DD/MM`.
  - Pass 5 (Courses): Matches 8 courses in `KNOWN_COURSES`.
- **Gaps against R1 & R2**:
  - `KNOWN_COURSES` does NOT include `"Giải tích"` (specifically requested in R1: `"ôn thi Giải tích thứ 6 tuần sau 90p"`).
  - Date parsing lacks `"cuối tuần"` (weekend) and `"tuần sau"` / `"thứ X tuần sau"` (+7 days offset).
  - Time parsing lacks `"11 giờ đêm"` (23:00) and `"cuối ngày"` (23:59).
  - Priority currently only supports 3 levels (`high`, `medium`, `low`); lacks 4th tier `"urgent"` / `"Siêu gấp"`.

### 1.5 Existing Modals & Undo Toast Mechanics
- **Modal Locations**:
  - `/tasks` uses `src/components/tasks/create/quick-add-modal.tsx` (lines 1–356), which only features a basic form with static preview boxes, no Three.js canvas, and no undo toast.
  - `/dashboard` uses an inline modal in `src/app/(main)/dashboard/page.tsx` (lines 200–262) with a basic HTML input.
- **Undo Toast Patterns**:
  - `src/app/(main)/tasks/page.tsx` (lines 663–685) and `src/app/(main)/calendar/page.tsx` (lines 339–354) use bottom floating cards:
    `fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#161626] border-2 border-aurora-lime/60 shadow-[4px_4px_0px_#C6FF3D]`.
  - Action button triggers undo callback; dismisses after 5–6 seconds.

---

## 2. Logic Chain

1. **Why create a dedicated `addQuickTask` in `campus-store.ts`?**
   - R4 mandates: "Syncs to both `state.deadlines` (appearing immediately in Deadline Arena on `/dashboard`) and `state.tasks` (appearing in `/tasks`). Awards `+10 XP` with floating animation. Triggers 5-second undo toast: 'Đã thêm vào Deadline Arena · Hoàn tác'. Clicking undo reverts both deadline and task."
   - Currently, `addTask` only touches `tasks`, and `/dashboard` previously only touched `deadlines`.
   - Creating an atomic `addQuickTask(input)` action guarantees:
     1. A `TaskItem` is prepended to `state.tasks`.
     2. A corresponding `DeadlineItem` is prepended to `state.deadlines`.
     3. 10 XP is awarded, recomputing level and rank title via `calculateLevelAndRank(prev.xp + 10)`.
     4. A reversible `undo()` closure is returned that deletes both task and deadline and deducts 10 XP (`Math.max(0, prev.xp - 10)`).
     5. A browser event `campusos:deadline-created` is dispatched with `{ id: deadline.id, taskId: task.id }`.
   - This ensures zero desynchronization between `/dashboard` and `/tasks`.

2. **Why modularize Three.js into `src/components/tasks/create/quick-task-backdrop-3d.tsx`?**
   - R3 requires: 120FPS Canvas WebGL layer between backdrop blur and modal card, drifting particles, rotating wireframe icosahedron, typing pulse brightness reaction, and submit burst confetti.
   - Extracting this into a dedicated component (`quick-task-backdrop-3d.tsx`) cleanly encapsulates WebGL context creation, shader/material definitions, resize listeners, tab visibility throttling (`document.hidden`), and full disposal logic (`cancelAnimationFrame`, `geometry.dispose`, `material.dispose`, `renderer.dispose`).
   - Enables clean conditional rendering: on mobile (`width < 768`) or `reducedMotion`, it renders a zero-overhead CSS Aurora gradient, completely avoiding WebGL instantiation.

3. **How does "Siêu gấp" trigger visual and 3D reaction?**
   - R2 defines 4 tiers:
     - Thấp: `#3DE8FF` (Cyan)
     - Vừa: `#FFB020` (Amber)
     - Gấp: `#FF8A3D` (Orange)
     - Siêu gấp: `#FF3D6E` (Neon Red/Pink)
   - When priority is "Siêu gấp":
     - The modal container applies `border-2 border-rose-500 shadow-[0_0_25px_#FF3D6E] animate-panic-shake`.
     - In the Three.js loop, particle colors shift to red/amber (`0xff3d6e` / `0xff8a3d`), and the wireframe icosahedron adds a high-frequency positional jitter (`Math.sin(elapsed * 30) * 0.03`).

4. **How does Deadline Arena flash with a highlight border?**
   - When `addQuickTask` runs, it dispatches `window.dispatchEvent(new CustomEvent('campusos:deadline-created', { detail: { id: deadlineId } }))`.
   - In `DeadlineArena`, a listener catches this event, sets `highlightedId = event.detail.id`, and clears it after 3000ms.
   - The matching card renders `ring-4 ring-aurora-lime ring-offset-2 ring-offset-black animate-pulse shadow-[0_0_30px_#C6FF3D]`.
   - Because the new deadline is prepended, it surfaces immediately in the hero bento cell or at the top of the list, producing the required "flash highlight border" effect.

5. **How are keyboard ergonomics and modal unification achieved?**
   - Global shortcuts: `N` or `Cmd/Ctrl+K` opens the modal.
   - Form handling:
     - `Enter`: Submits task, triggers particle burst, awards +10 XP, triggers 5s undo toast, and closes modal.
     - `Ctrl+Enter`: Submits task, awards +10 XP, triggers 5s undo toast, clears input field, and keeps modal open for continuous rapid entry.
     - `Escape`: Closes modal.
   - Replace the rudimentary inline form in `src/app/(main)/dashboard/page.tsx` with `<QuickAddModal isOpen={quickCreateOpen} onClose={() => setQuickCreateOpen(false)} />`. Both `/dashboard` and `/tasks` now share the identical high-energy experience.

---

## 3. Caveats

1. **TaskPriority Type Compatibility**:
   - `TaskPriority` in `src/types/tasks.ts` is currently `'high' | 'medium' | 'low'`.
   - Extending it to `'urgent' | 'high' | 'medium' | 'low'` must maintain full backward compatibility:
     - `'urgent'` corresponds to "Siêu gấp" (`#FF3D6E`).
     - `'high'` corresponds to "Gấp" (`#FF8A3D`).
     - In `computeEisenhowerQuadrant()`, both `'urgent'` and `'high'` map to `do_first` (Q1).
     - In NLP parsing, the keyword `"gấp"` continues to map to `'high'` (preserving existing test assertions in `tests/tasks-redesign.test.ts`), while `"siêu gấp"` / `"cực gấp"` maps to `'urgent'`.
2. **WebGL Context Limits**:
   - Browsers enforce a limit of 8–16 simultaneous WebGL contexts. If `FloatingBlocks3D` is active on `/tasks` and `QuickTaskBackdrop3D` opens, there are 2 concurrent WebGL canvases.
   - When the modal closes, `renderer.dispose()` and `renderer.forceContextLoss()` MUST be called immediately so GPU contexts are not leaked.
3. **No Caveats Beyond These**: Existing 109 unit tests pass and will not be broken.

---

## 4. Conclusion

- **Three.js Canvas**: Vanilla `three@^0.186.1` is optimal. A dedicated `quick-task-backdrop-3d.tsx` component should handle the drifting particles, pointer parallax, typing pulse reaction, priority color shift, submit burst stream, bounded DPR (<= 2), tab visibility throttling, and strict disposal.
- **Store Synchronization**: Add `addQuickTask` to `campus-store.ts` that atomically adds to both `state.tasks` and `state.deadlines`, awards `+10 XP`, recalculates level/rank, returns an `undo()` callback, and dispatches `campusos:deadline-created`.
- **Deadline Arena**: Wire a listener for `campusos:deadline-created` in `deadline-arena.tsx` to apply a 3-second flashing neon lime highlight border (`ring-4 ring-aurora-lime animate-pulse`).
- **Gamification & Toast**: Render a 5-second Neo-Brutal Undo Toast ("Đã thêm vào Deadline Arena · Hoàn tác") and floating `+10 XP` animation upon creation. Clicking undo rolls back tasks, deadlines, and XP.
- **NLP Enhancements**: In `tasks-engine.ts`, add `"Giải tích"` to `KNOWN_COURSES`, support `"cuối tuần"`, `"tuần sau"`, `"11 giờ đêm"`, `"cuối ngày"`, and 4 priority tiers (`Thấp`, `Vừa`, `Gấp`, `Siêu gấp`).
- **Modal Unification**: Upgrade `quick-add-modal.tsx` with interactive chips, 4 priority chips, 3D backdrop, and keyboard shortcuts (`Enter`, `Ctrl+Enter`, `Escape`), and mount it in both `/dashboard` and `/tasks`.

---

## 5. Verification Method

To independently verify after implementation:

1. **Type Safety & Build**:
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run typecheck
   npm run build
   ```
   Must pass with 0 errors.

2. **Unit Tests**:
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm test
   ```
   Must pass all 109 existing tests plus new unit tests covering:
   - `addQuickTask` store synchronization across `state.tasks` and `state.deadlines`.
   - `undo()` rollback reverting both task, deadline, and XP.
   - 4-tier priority parsing (`urgent`, `high`, `medium`, `low`).
   - Extended date/time keywords (`cuối tuần`, `tuần sau`, `11 giờ đêm`, `cuối ngày`).
   - Course extraction for `"Giải tích"`.

3. **Inspection of Key Files**:
   - `web/src/components/tasks/create/quick-task-backdrop-3d.tsx`: check WebGL setup, typing pulse, priority shift, burst effect, disposal.
   - `web/src/components/tasks/create/quick-add-modal.tsx`: check interactive chips, 4 priority tiers, hotkeys (`Enter`, `Ctrl+Enter`, `Escape`), floating +10 XP, 5s undo toast.
   - `web/src/lib/campus-store.ts`: check `addQuickTask`, `state.tasks` & `state.deadlines` sync, XP award and undo logic.
   - `web/src/components/dashboard/deadline-arena.tsx`: check `campusos:deadline-created` listener and flash highlight border.
   - `web/src/app/(main)/dashboard/page.tsx`: check replacement of rudimentary inline form with `QuickAddModal`.
