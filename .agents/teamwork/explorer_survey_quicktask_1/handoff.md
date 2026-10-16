# Handoff Report — Survey of Quick Task Modal Implementations, Trigger Points & Architecture

**Agent**: `explorer_survey_quicktask_1`  
**Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_quicktask_1\`  
**Date**: 2026-10-13  
**Status**: Survey Complete (Read-Only Investigation)  

---

## 1. Observation

Direct code inspections of `web/src/` and tests revealed the following findings:

### 1.1 Existing Modal Implementations & Fractured State
1. **`web/src/components/tasks/create/quick-add-modal.tsx`**:
   - Component: `QuickAddModal({ isOpen, onClose, onTaskCreated, className }: QuickAddModalProps)` (Lines 19–59).
   - Props interface:
     ```ts
     export interface QuickAddModalProps {
       isOpen: boolean;
       onClose: () => void;
       onTaskCreated?: (task: TaskItem) => void;
       className?: string;
     }
     ```
   - Current implementation:
     - Line 60: Uses `const { addTask } = useCampusStore();`.
     - Lines 65–67: Real-time Vietnamese NLP extraction via `parseVietnameseTaskInput(input)`.
     - Lines 101–116: On submit, calls `addTask({...})` which only writes to `state.tasks`.
     - **Deficiency 1 (No Deadlines Sync)**: Does **not** insert into `state.deadlines`. Therefore, tasks created here never appear in Deadline Arena on `/dashboard`.
     - **Deficiency 2 (No XP & Undo Toast in Modal)**: Modal does not trigger +10 XP or the 5-second undo toast that reverts both task and deadline.
     - **Deficiency 3 (Read-only Preview Chips)**: Lines 194–278 render parsed attributes as passive read-only cards (`Tiêu đề`, `Môn học`, `Hạn nộp`, `Thời lượng / Ưu tiên`). They cannot be clicked to edit or adjust. Static suggestion buttons (Lines 286–334) only append raw text strings to the input.
     - **Deficiency 4 (3 Priority Tiers Only)**: Lines 265–275 and `src/types/tasks.ts:7` only support `'high' | 'medium' | 'low'`, missing the required 4-tier model (Thấp `#3DE8FF`, Vừa `#FFB020`, Gấp `#FF8A3D`, Siêu gấp `#FF3D6E`).
     - **Deficiency 5 (No 3D Backdrop)**: Uses a standard flat backdrop `bg-black/75 backdrop-blur-md` (Line 138). Zero Three.js canvas or WebGL particle interaction exists.
     - **Deficiency 6 (Ergonomics & Keyboard)**: Auto-focuses on open and closes on `Escape`, but lacks focus trap, does not support `Ctrl+Enter` for continuous rapid entry, and has no `initialTitle` prop for pre-populating text (e.g. from Voice Brain-Dump).

2. **`web/src/app/(main)/dashboard/page.tsx`**:
   - Lines 200–262 render a separate, private inline modal:
     ```tsx
     {quickCreateOpen && (
       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in" ...>
         <form onSubmit={handleQuickCreateSubmit} role="dialog" aria-modal="true" ...>
           <h3 id="quick-create-title">⚡ Tạo nhiệm vụ nhanh</h3>
           ...
     ```
   - Submission handler (Lines 89–117):
     ```ts
     update((prev) => ({
       deadlines: [
         {
           id: `quick-${Date.now()}`,
           title,
           course: 'Nhiệm vụ nhanh',
           dueDate: `${todayStr}T23:59:00`,
           date: todayStr,
           displayDate: 'Hôm nay · 23:59',
           urgent: true,
           completed: false,
           isExam: false,
         },
         ...prev.deadlines,
       ],
     }));
     ```
   - **Critical Architectural Disconnect**: When a user triggers "Tạo nhiệm vụ nhanh" from `/dashboard` (via Hero button, Deadline Arena button, Voice Brain-Dump, or `N`), it opens this barebones inline modal that updates **only** `state.deadlines`. It **does not** create a task in `state.tasks`, performs **no** NLP parsing, has **no** priority selection, and has **no** Three.js effects!

3. **`web/src/components/shared/task-form-modal.tsx`**:
   - Legacy full-form dialog (`TaskFormModal`, Lines 26–74). Not referenced or imported anywhere else in `web/src/`.

4. **`web/src/components/calendar/nlp-quick-create-modal.tsx`**:
   - Modal (`NlpQuickCreateModal`, Lines 18–84) for creating `CalendarEvent` (events with start/end time in `state.events`), not tasks or deadlines.

---

### 1.2 Trigger Points, Global Hotkeys & Event Wiring
| Trigger Source | Location in Code | Current Action / Dispatch | Target Handler |
| :--- | :--- | :--- | :--- |
| **Global Shortcut `N`** | `src/components/common/use-global-shortcuts.ts:91-101` | If `options.onQuickCreateTask` provided -> calls callback; else `window.dispatchEvent(new CustomEvent('campusos:quick-create-task'))` | On `/dashboard`: calls `handleQuickCreateTask()` (opens inline modal). On `/calendar`: calls `setCreateModalOpen(true)` (opens calendar event modal). |
| **Command Palette (`Cmd/Ctrl+K`)** | `src/components/common/command-palette.tsx:94-105` | Action `action-new-task` (shortcut `N`): `window.dispatchEvent(new CustomEvent('campusos:quick-create-task'))` | Listened by `/dashboard` (`window.addEventListener`). **NOT listened by `/tasks`!** |
| **Dashboard Hero CTA 1** | `src/components/dashboard/dashboard-hero.tsx:472-487` | Button "+ Thêm nhiệm vụ" calls `onAddTask()` or dispatches `campusos:quick-create-task` | Caught by `dashboard/page.tsx:269` -> opens inline modal. |
| **Dashboard Voice Brain-Dump** | `src/components/dashboard/dashboard-hero.tsx:324-356` | Web Speech API or fallback modal dispatches `campusos:quick-create-task` with `detail: { initialTitle }` | Caught by `dashboard/page.tsx:143-146` -> opens inline modal with `initialTitle`. |
| **Deadline Arena CTA** | `src/components/dashboard/deadline-arena.tsx:224` | Button "+ Thêm deadline" dispatches `campusos:quick-create-task` | Caught by `dashboard/page.tsx` -> opens inline modal. |
| **Tasks Quest Board Header** | `src/components/tasks/header/quest-board-header.tsx:197-210` | Magnetic Button "+ Thêm nhiệm vụ" (badge `N`) calls `onAddTask` | Caught by `tasks/page.tsx:489` -> calls `setQuickAddOpen(true)`. |
| **Tasks Keyboard `N`** | `src/app/(main)/tasks/page.tsx:395-399` | Local keydown listener for `e.key === 'n'` calls `setQuickAddOpen(true)` | Opens `QuickAddModal`. |
| **Tasks Drawer / Unselected Hero** | `src/components/tasks/drawer/task-detail-drawer.tsx:618` and `unselected-hero.tsx:243` | Calls `onOpenCreate` | Caught by `tasks/page.tsx` -> calls `setQuickAddOpen(true)`. |

---

### 1.3 Existing Three.js Architecture & Performance Baseline
1. **Reference 3D Implementations**:
   - `web/src/components/tasks/header/floating-blocks-3d.tsx` (Lines 1–400):
     - Uses `three` (v0.186.1, installed in `package.json`).
     - Features `THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance', precision: 'mediump' })`.
     - Bounded DPR: `Math.min(window.devicePixelRatio || 1, 1.25)`.
     - Clean disposal on unmount: `cancelAnimationFrame(animId)`, `cubeGeo.dispose()`, `cubeMat.dispose()`, `renderer.dispose()`.
     - Mobile (< 768px) and `state.reducedMotion` cleanly fall back to static CSS gradient without WebGL overhead.
2. **Package & Animation Environment**:
   - `framer-motion` is **NOT** installed. All animations use GPU CSS transforms, Tailwind utilities, `tailwindcss-animate`, and Canvas/Three.js.
   - Build & test verification baseline:
     - `npm run typecheck` passes with 0 TypeScript errors.
     - `npm test` passes all 109 test cases in 2.5s.

---

### 1.4 State Synchronization & Data Schema
1. **`src/types/tasks.ts`**:
   - `TaskPriority`: Currently defined as `'high' | 'medium' | 'low'` (Line 7).
   - Needs seamless alignment with R2's 4 distinct priority tiers:
     - **Thấp** (`#3DE8FF` Cyan)
     - **Vừa** (`#FFB020` Amber)
     - **Gấp** (`#FF8A3D` Orange)
     - **Siêu gấp** (`#FF3D6E` Neon Red/Pink)
2. **`src/lib/campus-store.ts`**:
   - `state.tasks`: List of `TaskItem`. Managed via `addTask`, `updateTask`, `deleteTask`, `completeTask`.
   - `state.deadlines`: List of `DeadlineItem`.
   - In `completeTask(id)` (Lines 1062–1071), matching deadlines are automatically marked `completed: true` if `d.id === id`, `d.id === task.id.replace(/^task-/, '')`, or title matches.
   - In `addTask(taskData)` (Lines 927–975), it **only** prepends to `prev.tasks`, **never** to `prev.deadlines`.
   - To fulfill R4, creating a quick task must atomically create both the `TaskItem` and a corresponding `DeadlineItem`, award `+10 XP`, and provide a reversible 5-second undo toast.

---

## 2. Logic Chain

1. **Premise 1**: Section `## 2026-10-13T12:48:34Z` of `ORIGINAL_REQUEST.md` requires rebuilding the "Tạo nhiệm vụ nhanh" modal into a single, high-energy experience featuring real-time Vietnamese NLP interactive chips, 4 priority tiers with Three.js reactions, a 120FPS Three.js particle backdrop, and seamless two-way synchronization with both Deadline Arena (`state.deadlines`) and Tasks (`state.tasks`).
2. **Premise 2 (Observation 1.1 & 1.2)**: Currently, `/dashboard` and `/tasks` use two completely different implementations:
   - `/dashboard` uses an inline form that writes only to `state.deadlines`, ignoring `state.tasks`, NLP, 3D, and XP.
   - `/tasks` uses `QuickAddModal` which writes only to `state.tasks`, ignoring `state.deadlines`, XP, and 3D.
   - `/tasks` does not listen to `campusos:quick-create-task`, meaning opening Command Palette (`Cmd+K`) on `/tasks` fails to trigger `QuickAddModal`.
3. **Inference 1**: To satisfy the requirements and eliminate duplication, `QuickAddModal` in `web/src/components/tasks/create/quick-add-modal.tsx` must be upgraded to serve as the single, canonical Quick Task modal for the entire application.
4. **Inference 2**: `/dashboard/page.tsx` must drop its private inline form (Lines 200–262) and mount the upgraded `QuickAddModal`.
5. **Inference 3**: `QuickAddModalProps` must accept `initialTitle?: string` so that voice brain-dump speech input on `/dashboard` is automatically injected into the input when the modal opens.
6. **Inference 4**: The NLP parser (`parseVietnameseTaskInput` in `src/lib/tasks-engine.ts`) must support the 4 priority tiers ("thấp", "vừa", "gấp", "siêu gấp"), weekend ("cuối tuần"), next week ("tuần sau"), and CampusOS course keywords. In `QuickAddModal`, recognized attributes must be rendered as interactive, clickable chips with inline mini-popovers/editors to adjust values without typing.
7. **Inference 5**: A dedicated Three.js canvas layer must be created (following the clean disposal and mobile fallback patterns of `floating-blocks-3d.tsx`) providing floating particles, rotating 3D geometry, typing intensity brightness pulsation, and particle burst upon submission.
8. **Inference 6**: Store operations must atomically add and revert both `state.deadlines` and `state.tasks`, grant `+10 XP`, and display an undo toast with a 5-second window.

---

## 3. Caveats

1. **Existing Unit Tests Invariance**: `web/tests/tasks-redesign.test.ts` and `challenger-m1-1-tasks-engine.test.ts` contain existing assertions expecting `parsed.priority` to be `'high'`, `'medium'`, or `'low'`. When supporting the 4 tiers (`low`, `medium`, `high`, `urgent`), ensure backwards compatibility so existing test assertions continue passing without regression.
2. **Framer Motion Absence**: `package.json` does not include `framer-motion`. Modal animations, bottom sheet transitions, and floating XP must utilize CSS keyframes (`@keyframes`, Tailwind transitions) and Canvas/Three.js.
3. **Accessibility**: Modern modal accessibility requires focus trap (cycling focus through Tab / Shift+Tab) and returning focus to the trigger button when the modal closes.

---

## 4. Conclusion

The quick task creation flow is currently split between a primitive inline form on `/dashboard` and an incomplete `QuickAddModal` on `/tasks`.

To fulfill the requirements:
1. **Centralize**: Upgrade `web/src/components/tasks/create/quick-add-modal.tsx` into the shared modal and mount it in both `/dashboard/page.tsx` and `/tasks/page.tsx`.
2. **Real-time NLP & Interactive Chips (R1)**: Extract title, date, time, course, and duration into live chips below the input. Clicking any chip opens an inline adjustment selector. Provide 1-click date shortcut chips and a fallback of "Hôm nay 23:59".
3. **4 Priority Tiers (R2)**: Support Thấp (`#3DE8FF`), Vừa (`#FFB020`), Gấp (`#FF8A3D`), and Siêu gấp (`#FF3D6E`), altering modal border glow and triggering particle reactions/jitter on "Siêu gấp".
4. **120FPS Three.js Backdrop (R3)**: Implement WebGL particle field and interactive rotating 3D geometry with typing pulsation, submission particle burst, and strict lifecycle disposal / mobile fallback.
5. **Store Synchronization & Hotkeys (R4)**: Atomically synchronize created items to both `state.deadlines` and `state.tasks`, award `+10 XP`, provide 5-second undo toast, handle hotkeys (`N`, `Cmd+K`, `Enter`, `Ctrl+Enter`, `Esc`), and implement desktop modal / mobile bottom sheet responsiveness.

---

## 5. Verification Method

To verify these survey findings and test subsequent implementations:

1. **TypeScript Type Safety**:
   ```bash
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run typecheck
   ```
   Must exit with code 0 and zero TypeScript errors.

2. **Unit Test Suite**:
   ```bash
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm test
   ```
   Must pass all 109 existing test cases plus new unit tests covering 4 priority tiers and store synchronization.

3. **Production Build**:
   ```bash
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run build
   ```
   Must compile cleanly with code 0 across all routes.

4. **Code Inspection**:
   - Verify `web/src/components/tasks/create/quick-add-modal.tsx` contains interactive chips, 4 priority tiers, and WebGL Three.js canvas.
   - Verify `web/src/app/(main)/dashboard/page.tsx` imports `QuickAddModal` and removes the old inline modal (Lines 200–262).
   - Verify `web/src/app/(main)/tasks/page.tsx` listens to `campusos:quick-create-task`.
