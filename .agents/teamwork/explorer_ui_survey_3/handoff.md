# UI & Component Survey Handoff Report: CampusOS /tasks Page Rebuild

**Author**: `explorer_ui_survey_3` (UI & Component Explorer)  
**Parent Conversation ID**: `d87bbdd2-41e0-4e96-8205-9ea9461c7df0`  
**Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_ui_survey_3\`  
**Target Page**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\src\app\(main)\tasks\page.tsx`  
**Reference Docs**: `docs/CampusOS_Tasks_Redesign_Plan.md`, `ORIGINAL_REQUEST.md` (timestamp `## 2026-10-13T07:48:15Z`)

---

## 1. Observation

### 1.1 Existing Design Tokens and Global Styles
- **`web/tailwind.config.js`** (lines 72-107, 150-182):
  - **Aurora Palette**:
    - `aurora.obsidian`: `#0A0A12`
    - `aurora.lime`: `#C6FF3D`
    - `aurora.pink`: `#FF3DA5`
    - `aurora.violet`: `#7C5CFF`
    - `aurora.cyan`: `#3DE8FF`
    - `aurora.orange`: `#FF8A3D`
  - **Event Neon Palette**:
    - `event.class`: `#4D7CFF`
    - `event.study`: `#8B6CFF`
    - `event.deadline`: `#FF3D6E`
    - `event.club`: `#FFB020`
    - `event.personal`: `#3DFFB0`
  - **Border Radius**:
    - `'neo'`: `24px`
    - `'neo-lg'`: `32px`
  - **Shadows**:
    - `'neo'`: `6px 6px 0px 0px var(--neo-shadow-color, #000000)`
    - `'neo-sm'`: `3px 3px 0px 0px var(--neo-shadow-color, #000000)`
    - `'neo-lg'`: `10px 10px 0px 0px var(--neo-shadow-color, #000000)`
    - `'neo-accent'`: `6px 6px 0px 0px var(--theme-accent, #C6FF3D)`
  - **Fonts**:
    - `font-display`: `Unbounded`, `Space Grotesk`, `sans-serif`
    - `font-heading`: `Space Grotesk`, `Unbounded`, `sans-serif`
    - `font-sans`: `Be Vietnam Pro`, `Inter`, `sans-serif`
    - `font-mono`: `JetBrains Mono`, `Fira Code`, `monospace`
  - **Keyframes & Animations**:
    - `'panic-shake'`: `0.35s ease-in-out infinite` (shakes and tilts ±0.5° when deadline < 3h)
    - `'pulse-neon'`: `2s cubic-bezier(0.4, 0, 0.6, 1) infinite` (drop shadow pulse on active targets)
    - `'float-badge'`: `4s ease-in-out infinite` (gentle float ±1.5° for badges)

- **`web/src/app/globals.css`** (lines 8-227, 245-322, 410-453):
  - **4 Vibe Themes** controlled via `[data-vibe="..."]`:
    - `aurora` (default): Base `#0A0A12`, accent `#C6FF3D` Acid Lime, secondary `#7C5CFF` Electric Violet.
    - `y2k`: Base `#0D0E15`, accent `#00F0FF` Electric Cyan, secondary `#C0C5D0` Metallic Silver, pink `#FF007F` Cyber Magenta.
    - `cyber`: Base `#050A06`, accent `#C6FF3D` Acid Lime, secondary `#00FF88` Matrix Green, yellow `#FFE600`.
    - `pastel`: Base `#12101F`, accent `#C4B5FD` Dreamy Lilac, secondary `#6EE7B7` Cloud Mint, pink `#FBCFE8`.
  - **Key Utility Classes**:
    - `.hard-border`: `border: 2px solid var(--neo-border-color, rgba(255, 255, 255, 0.18))`
    - `.neo-card`: `background-color: hsl(var(--card)); border: 2px solid var(--neo-border-color, rgba(255, 255, 255, 0.18)); border-radius: 24px; box-shadow: 6px 6px 0px 0px var(--neo-shadow-color, #000000); transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);`
    - `.sticker-badge`: `border: 2px solid var(--neo-border-color, currentColor); border-radius: 9999px; box-shadow: 3px 3px 0px 0px var(--neo-shadow-color, #000000); transform: rotate(-1.5deg);`
    - `.sticker-badge-alt`: `transform: rotate(1.5deg);`
    - `.aurora-noise`: 4% SVG fractal noise overlay.
  - **Reduced Motion Rules**:
    - `@media (prefers-reduced-motion: reduce)` and selectors `.reduced-motion`, `[data-reduced-motion="true"]` nullify all animation/transition durations to `0.001ms !important` and lock transforms on `.neo-card:hover`, `.sticker-badge:hover`, `[data-tilt]`.

### 1.2 Reusable FX Components in Codebase
- **`InteractiveCursor`** (`web/src/components/common/interactive-cursor.tsx`):
  - Props: `{ reducedMotion?: boolean }`.
  - Implementation: Pure 120FPS `requestAnimationFrame` lerp loop without React re-renders. Sharp central neon dot (`bg-primary`, `translate3d(mouseX, mouseY, 0)`) + trailing expanding ring (`translate3d(ringX, ringY, 0) scale(...)`). Expands and changes color on interactive elements (`a, button, input, select, textarea, [role="button"], [data-interactive="true"], .neo-card, .sticker-badge, kbd`). Auto-disabled on touch or reduced-motion.
- **`MagneticButton`** (Pattern in `web/src/components/dashboard/dashboard-hero.tsx`, lines 249-265):
  - Implementation: Pointer move calculates offset from element center `x = (e.clientX - rect.left - rect.width / 2) * 0.25`, applies `translate3d(x, y, 0)`, resets on mouse leave.
- **`TiltCard`** (Pattern in `web/src/components/dashboard/today-timeline.tsx`, lines 384-396):
  - Implementation: `cardRef.current.style.transform = perspective(800px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) translateY(-3px)`. Respects `reducedMotion`.
- **`Confetti` / Particle Burst** (Canvas 2D patterns in `web/src/components/dashboard/dashboard-hero.tsx` lines 187-247 and `web/src/components/dashboard/deadline-arena.tsx` lines 91-145):
  - Implementation: 1-draw-call Canvas2D animation loop. 30-40 particles with velocity, gravity (`vy += 0.15`), random colors (`#C6FF3D`, `#FF3DA5`, `#7C5CFF`, `#3DE8FF`, `#FF8A3D`), alpha fade over 700ms. No external library needed.
- **`TextReveal`** (Pattern in `web/src/components/dashboard/dashboard-hero.tsx`, lines 404-420):
  - Implementation: Words wrapped in spans with staggered CSS delay `animate-slide-up [animation-delay:40ms]`, `[animation-delay:80ms]`, etc., with `aria-label` on heading and `aria-hidden="true"` on span sequence.
- **`Three.js Instanced Mesh Canvas`** (Pattern in `web/src/features/pomodoro/talking-tom-3d.tsx` + `docs/CampusOS_Tasks_Redesign_Plan.md`):
  - Vanilla Three.js (`three` is installed in `web/package.json` at `^0.186.1`).
  - WebGLRenderer config: `alpha: true`, `powerPreference: 'high-performance'`, `precision: 'mediump'`, restricted pixelRatio `Math.min(window.devicePixelRatio || 1, 1.25)` for 120FPS zero GPU lag.

### 1.3 Focus Mode & `StrictPomodoroModal` Interface
- **File**: `web/src/features/pomodoro/strict-pomodoro-modal.tsx`
- **Component Interface**:
  ```typescript
  interface StrictPomodoroModalProps {
    open: boolean;
    onClose: () => void;
    onSessionComplete?: (stats: {
      focusMinutes: number;
      shameCount: number;
      disciplineScore: number;
    }) => void;
    initialMinutes?: number;
  }
  ```
- **Dual Session Modes inside Modal**:
  1. `extreme_cat`: Fat Orange Cat Supervisor (`MemeCatStage` or `TalkingTom3D`), timer countdown, Northern Vietnamese TTS scolding (`msedge-tts` / Web Speech API), tab-switching violation penalty, PiP document window.
  2. `chill_breathing`: 4-7-8 Breathing orb (4s inhale -> 7s hold -> 8s exhale) with procedural Web Audio lo-fi ambient dual-oscillator synth (no external audio assets).
- **Invocation & Sync Pattern** (from `web/src/app/(main)/dashboard/page.tsx` lines 11-17, 63-79 and `web/src/app/(main)/calendar/page.tsx` lines 9-15, 255-266):
  1. Dynamic import: `const StrictPomodoroModal = dynamic(() => import('@/features/pomodoro/strict-pomodoro-modal').then((m) => m.StrictPomodoroModal), { ssr: false });`
  2. Completion handler calls `recordSession(stats.focusMinutes, stats.disciplineScore)` from `useCampusStore()`.
  3. `recordSession` automatically:
     - Calculates session XP (`calculateSessionXp`: base 2 XP/min + discipline score bonus + 15 XP milestone if >= 25m).
     - Updates streak via `calculateStreakOnCheckIn` (with streak freeze support).
     - Advances Level and rank title (e.g. Level 7 "Sinh viên cày thuê" -> Level 8 "Trùm phao cứu sinh").
     - Appends unlockable badges (`deep-focus`, `streak-14`, `study-scholar`).
     - Logs session to Supabase Cloud via `logFocusSessionToSupabase`.
     - Dispatches `campusos-store-update` event across browser tabs.

### 1.4 Current Legacy `/tasks` Implementation
- **File**: `web/src/app/(main)/tasks/page.tsx` (152 lines).
- Directly uses local `useState<Task[]>(initialTasks)` saved only to localStorage `campusos-tasks-v1`.
- Completely decoupled from `campus-store.ts` (XP, streaks, deadlines, and Focus Mode are missing).
- Hardcoded mock dates in August 2026 (`2026-08-20`), whereas system date is October 13, 2026.
- Uses standard shadcn Card/Input styles instead of Neo-Brutal Aurora cards, stickers, and animations.
- Only has a single list view (no Kanban, no Eisenhower Matrix, no Today Plan).
- Right panel is empty and wasted when no task is selected ("Chọn một nhiệm vụ").
- Uses standard native `<select>` dropdown for priority.

---

## 2. Logic Chain

1. **Alignment with Shared Store & Gamification Architecture**:
   - *Observation*: `campus-store.ts` already stores `deadlines`, `events`, `kanbanTasks`, `xp`, `level`, `streak`, `vibeTheme`, and `reducedMotion`.
   - *Inference*: Tasks on `/tasks` must synchronize directly with `campus-store.ts`. Completing a task must award XP (`+50 XP`), trigger confetti, and update the circular progress ring in the Quest Board header.
2. **Three.js Performance & Package Constraint**:
   - *Observation*: `package.json` contains `three: "^0.186.1"`, but neither `@react-three/fiber` nor `@react-three/drei` is installed. Architectural decision 1 from `/grill-me` explicitly specifies vanilla Three.js instanced mesh.
   - *Inference*: The 3D floating blocks header must be implemented in vanilla Three.js using `THREE.InstancedMesh(geometry, material, 40)` wrapped in `dynamic(() => ..., { ssr: false })`, falling back to static Canvas2D/gradient when `reducedMotion` is true or on touch/mobile devices.
3. **Zero-Lag 120FPS & Strict Overflow Containment**:
   - *Observation*: `app-layout.tsx` wraps the app in `min-w-0 overflow-x-hidden`.
   - *Inference*: Any unconstrained grid (`grid-cols-[1fr_300px]`), flex child without `min-w-0`, or un-truncated text string will blow out container width and cause horizontal scrollbars. Every grid track must use `minmax(0, ...)` and dynamic text must have `truncate` or `break-words`.
4. **Drag & Drop Strategy**:
   - *Observation*: `@dnd-kit/core` is not installed in `package.json`, but native HTML5 drag-and-drop is successfully implemented with high performance and zero dependencies in `squad-kanban-exam.tsx`.
   - *Inference*: Using native HTML5 drag-and-drop (`draggable`, `onDragStart`, `onDragOver`, `onDrop`) keeps the bundle lightweight, avoids third-party version conflicts, and ensures 120FPS drag fluidity.
5. **Detail Drawer Non-Empty Invariant**:
   - *Observation*: Current `/tasks` displays a useless empty state placeholder when no task is selected.
   - *Inference*: When `selectedTask === null`, the drawer must render "Việc tiếp theo nên làm" (most urgent task with live countdown + `▶ Bắt đầu` button), weekly mini-heatmap, and AI study tips.

---

## 3. Caveats

- **Caveat 1 (Task Data Model Scope)**: Currently `campus-store.ts` defines `DeadlineItem` and `KanbanTask`. The new `/tasks` model requires richer attributes (`subtasks/steps`, `priority: 'high' | 'medium' | 'low'`, `estimateMin`, `actualMin`, `pomodoros: { planned, done }`, `quadrant: 'urgent_important' | ...`, `tags`, `course`). A dedicated `TaskItem` interface and extended storage adapter in `campus-store.ts` or `tasks-store.ts` (bridging with `campus-store.ts`) is required.
- **Caveat 2 (NLP & AI Endpoints)**: Natural language task parsing and assignment breakdown must have deterministic fallback algorithms (regex and heuristics in `nlp-tasks.ts` similar to `nlp-calendar.ts`) so they work 100% offline without requiring external AI LLM API keys.

---

## 4. Conclusion & Specifications

### 4.1 Component Inventory & Reusability Matrix

| Component / Utility | File Path | Props / Signature | Behavior & Reusability |
|---|---|---|---|
| `<InteractiveCursor />` | `web/src/components/common/interactive-cursor.tsx` | `{ reducedMotion?: boolean }` | 120FPS RAF trailing ring + dot; expands on `.neo-card`, `.sticker-badge`, buttons. |
| `<CommandPalette />` | `web/src/components/common/command-palette.tsx` | `{ isOpen, onClose, onThemeChange, onToggleReducedMotion, isReducedMotion }` | Global quick search, theme switching, and actions. |
| `<KeyboardShortcutsModal />` | `web/src/components/common/keyboard-shortcuts-modal.tsx` | `{ isOpen, onClose }` | Displays keybinds (`N`, `/`, `1-4`, `J/K`, `X`, `E`, `F`, `Del`, `?`). |
| `useGlobalShortcuts()` | `web/src/components/common/use-global-shortcuts.ts` | `UseGlobalShortcutsOptions` | Global shortcut listener with input field typing guard. |
| `<StrictPomodoroModal />` | `web/src/features/pomodoro/strict-pomodoro-modal.tsx` | `StrictPomodoroModalProps` | Full Focus Mode overlay (Mèo Mập Giám Thị + 4-7-8 Chill Breathing). |
| `<MagneticButton />` | Pattern in `dashboard-hero.tsx:249-265` | `(e: MouseEvent) => void` | Magnetic pull on mouse hover; resets on leave. |
| `<TiltCard />` | Pattern in `today-timeline.tsx:384-396` | `(e: PointerEvent) => void` | 3D perspective tilt (`perspective(800px) rotateX(...) rotateY(...)`). |
| `triggerConfetti()` | Pattern in `deadline-arena.tsx:91-145` | `(x: number, y: number) => void` | 1-draw-call 2D Canvas confetti burst with gravity and rotation. |
| `<TextReveal />` | Pattern in `dashboard-hero.tsx:404-420` | `staggered animate-slide-up` | Character/word staggered reveal with `aria-label` accessibility. |

### 4.2 `StrictPomodoroModal` Integration Specification for `/tasks`
1. **Import**:
   ```tsx
   const StrictPomodoroModal = dynamic(
     () => import('@/features/pomodoro/strict-pomodoro-modal').then((m) => m.StrictPomodoroModal),
     { ssr: false }
   );
   ```
2. **Triggers on `/tasks`**:
   - Header CTA: `▶ Focus ngay` (launches modal with the most urgent unfinished task, default 25 min).
   - Global Shortcut: `F` key (via `useGlobalShortcuts`).
   - Detail Drawer: `▶ Focus` button in "Việc tiếp theo" or inside the selected task's Pomodoro section.
   - Task Card Quick Action: Hover action button `▶ Focus`.
3. **Completion Callback**:
   ```tsx
   const handleFocusComplete = (stats: { focusMinutes: number; shameCount: number; disciplineScore: number }) => {
     const result = recordSession(stats.focusMinutes, stats.disciplineScore);
     // Update task pomodoros in store
     if (activeFocusTaskId) {
       updateTaskPomodoros(activeFocusTaskId, stats.focusMinutes);
     }
     showToast(`🎉 Hoàn thành phiên ${stats.focusMinutes}p! Nhận +${result.xpGained} XP. 🔥`);
   };
   ```

### 4.3 Design System Tokens, CSS Classes & Color Coding

#### Color Codes
- **Base**: `#0A0A12` (`bg-background`), `#11111E` (`bg-card`), `#131322` (`bg-popover`).
- **Neons**: `#C6FF3D` (Acid Lime), `#7C5CFF` (Electric Violet), `#FF3DA5` (Pink), `#3DE8FF` (Cyan), `#FF8A3D` (Orange).
- **Task Status Colors**:
  - `todo` (Cần làm): `#7A8AA8` (Border/badge), bg `rgba(122, 138, 168, 0.12)`
  - `in_progress` (Đang làm): `#8B6CFF` (Border/badge), bg `rgba(139, 108, 255, 0.12)`, neon glow
  - `done` (Hoàn thành): `#3DFFB0` (Border/badge), bg `rgba(61, 255, 176, 0.12)`
- **Task Priority Colors**:
  - `high` (Cao): `#FF3D6E` (Hot pink/red), text label `"CAO"`, ping animation if overdue
  - `medium` (Vừa): `#FFB020` (Amber/Orange), text label `"VỪA"`
  - `low` (Thấp): `#3DE8FF` (Cyan), text label `"THẤP"`

#### Standard CSS Classes
- **Cards**: `.neo-card` or `hard-border rounded-[24px] bg-[#11111E]/85 shadow-[6px_6px_0px_#000] backdrop-blur-md`
- **Badges**: `.sticker-badge` (`transform: rotate(-1.5deg)`), `.sticker-badge-alt` (`transform: rotate(1.5deg)`)
- **Urgent Alarm**: `animate-panic-shake border-rose-500 shadow-[6px_6px_0px_#FF3D6E]`
- **Background**: `.aurora-noise` + fixed ambient blurred blobs (`blur-[140px] opacity-25`)

### 4.4 Layout & Zero-Horizontal-Scrollbar Guarantee
To eliminate any risk of horizontal scrollbar across all screen widths (360px to 4K):
1. **Root Page Shell**:
   ```tsx
   <div
     data-vibe={state.vibeTheme}
     data-reduced-motion={state.reducedMotion ? 'true' : 'false'}
     className="relative min-h-screen w-full max-w-full overflow-x-hidden text-foreground antialiased"
   >
   ```
2. **Grid Columns**:
   Always use `minmax(0, 1fr)` or `minmax(0, ...)`:
   - Header Stats: `grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0`
   - Main View + Right Drawer: `grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] w-full min-w-0`
   - Eisenhower Matrix: `grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0`
   - Kanban Board: `grid grid-cols-1 md:grid-cols-3 gap-4 w-full min-w-0` (or horizontal scroll on mobile with `overflow-x-auto scrollbar-thin max-w-full`)
3. **Text & Content**:
   Add `truncate` or `break-words` on all task titles and descriptions. Never allow unbreakable strings to push card widths.
4. **Modal & Drawer Overlays**:
   Ensure fixed overlays have `fixed inset-0 overflow-hidden` and inner dialogs have `max-w-[calc(100vw-2rem)]`.

---

## 5. Verification Method

To independently verify all findings and specifications:

1. **Verify Tokens and Theme Styles**:
   - Inspect `web/tailwind.config.js` lines 72-107 and `web/src/app/globals.css` lines 245-322.
   - Confirm `.neo-card`, `.sticker-badge`, `.hard-border`, `.aurora-noise`, and theme variables exist and match.
2. **Verify Focus Mode Interface & Integration**:
   - Inspect `web/src/features/pomodoro/strict-pomodoro-modal.tsx` lines 32-41 for `StrictPomodoroModalProps`.
   - Inspect `web/src/app/(main)/dashboard/page.tsx` lines 63-79 to confirm `recordSession` integration.
3. **Verify Reusable FX Implementations**:
   - Inspect `web/src/components/common/interactive-cursor.tsx` lines 1-137.
   - Inspect `web/src/components/dashboard/dashboard-hero.tsx` lines 249-265 (`handleMagneticMove`) and lines 404-420 (`animate-slide-up` text reveal).
   - Inspect `web/src/components/dashboard/deadline-arena.tsx` lines 91-145 (`triggerConfetti`).
   - Inspect `web/src/components/dashboard/today-timeline.tsx` lines 384-396 (`handlePointerMove` 3D tilt).
4. **Invalidation Conditions**:
   - If `@react-three/fiber` is required by an implementer without checking `package.json`, this is an invalidation — vanilla Three.js must be used instead.
   - If horizontal scrollbars appear on `/tasks`, verify whether any grid column used raw `1fr` without `minmax(0, ...)`.
