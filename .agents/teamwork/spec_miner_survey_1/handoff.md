# Handoff Report: CampusOS /tasks Rebuild Specification Survey

**Author**: Specification Miner (`spec_miner_survey_1`)  
**Parent Conversation ID**: `d87bbdd2-41e0-4e96-8205-9ea9461c7df0`  
**Timestamp**: 2026-10-13T08:00:00Z  
**Target Path**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_survey_1\handoff.md`

---

## 1. Observation

### 1.1 Specification & Codebase Evidence

1. **`ORIGINAL_REQUEST.md` (timestamp `## 2026-10-13T07:48:15Z`, lines 144–225)**:
   - Mandates rebuilding Nhiệm vụ (`/tasks`) following **Neo-Brutal Aurora (Gen Z, 120FPS zero-lag)**.
   - Architectural Decisions from `/grill-me`:
     - *3D Engine*: "Lightweight vanilla Three.js (`three` is already installed) with instanced mesh ~40 drifting cubes/stars; lazy-loaded with Canvas2D/static fallback on mobile and `prefers-reduced-motion`. Do not add heavy external wrapper packages."
     - *Data & State*: "Unified reactive persistence directly in `campus-store.ts`. Sync tasks, deadlines, and completed sessions seamlessly across `/dashboard`, `/calendar`, and `/tasks` with debounced background sync to Supabase Cloud and offline-first fallback."
     - *Scope*: "Full implementation of P0 and P1 (Header Quest Board with Three.js, Smart Controls Bar, 4 Views: List with sticky date grouping, 3-column Kanban, Eisenhower 2x2 Matrix, Today Plan; Intelligent Detail Drawer; NLP Vietnamese QuickAdd; AI Task Breakdown heuristic; Focus Mode integration)."
     - *Layout & Overflow*: "Strict single-viewport containment without horizontal scrollbars (`overflow-x-hidden`, `min-w-0`, `minmax(0,...)` on all grid columns)."
   - Defines R1 (Quest Board Header), R2 (Smart Controls Bar & Multi-View Switcher), R3 (4 Functional Views), R4 (Intelligent Detail Drawer), R5 (NLP QuickAdd & AI Breakdown), and R6 (Focus Mode & Gamification Store Synchronization).

2. **`docs/CampusOS_Tasks_Redesign_Plan.md` (lines 1–200)**:
   - Documents baseline defects:
     - Only 1 list view; lacks Kanban, lacks Eisenhower matrix, lacks "what to do next".
     - Broken placeholder in search bar ("Tìm thec"), default OS `<select>` dropdown for priority.
     - Deadlines formatted dryly ("19-08"), lacking countdown or urgency cues; priority was just an ambiguous dot.
     - Empty right panel wasting 1/3 viewport space when nothing is selected.
     - Checkbox completion is sterile: no XP rewards, no link to Pomodoro, Calendar, or Streak.
     - Mock data anchored in August instead of real system date.
   - Preserves: Dark background `#0A0A12`, aurora blobs, sidebar/header navigation, green accent for task completion, Vietnamese microcopy.
   - Establishes the 10-phase roadmap, complete task data model, exact color hex codes, Gen Z tone, and component folder structure (`components/tasks/{header,controls,list,kanban,matrix,today,detail,create,fx}` and `lib/tasks/{grouping,urgency,xp,recurrence,shortcuts}.ts`).

3. **`web/package.json`**:
   - `three: "^0.186.1"` and `@types/three: "^0.186.0"` are already installed.
   - `@react-three/fiber` and `@dnd-kit/core` are **NOT** installed. Vanilla Three.js and lightweight HTML5 drag-and-drop are required to avoid external dependency bloat and guarantee 120FPS rendering.

4. **`web/src/lib/campus-store.ts` & `web/src/lib/gamification.ts`**:
   - Gamification engine implements 10 tiers (Level 1 `"Tân sinh viên ngơ ngác"` to Level 7 `"Sinh viên cày thuê"` up to Level 10 `"Chiến thần qua môn"`).
   - Session XP calculation: base minutes * 2 + discipline bonus (up to 10) + milestone bonus (15 XP for >= 25m).
   - Streak logic with weekly streak freeze shields and check-in date tracking.
   - Reactive persistence backed by `localStorage` (`CAMPUS_STORAGE_KEY = 'campusos-shared-v2'`) and `useSyncExternalStore`.
   - Debounced sync to Supabase Cloud via `pushToSupabaseCloudDebounced`.

5. **`web/src/features/pomodoro/strict-pomodoro-modal.tsx`**:
   - Existing component supporting dual mode:
     - `extreme_cat`: Mèo Mập Giám Thị Cực Đoan (cutout cat, TTS scolding, audio engine, PiP mode, arbiter tab detection).
     - `chill_breathing`: Calm 4-7-8 breathing orb with procedural Web Audio synthesizer.
   - Accepts `open`, `onClose`, `onSessionComplete: (stats) => void`, and `initialMinutes`.

6. **`web/src/components/common/use-global-shortcuts.ts`**:
   - Global keyboard event handler with input guard (`isInput: INPUT | TEXTAREA | SELECT | isContentEditable`).
   - Dispatches CustomEvents: `campusos:toggle-command-palette`, `campusos:open-shortcuts-modal`, `campusos:trigger-focus`, `campusos:quick-create-task`.

---

## 2. Logic Chain

1. **Alignment with Shared Store & Gamification**:
   - `/dashboard` and `/calendar` already synchronize `xp`, `streak`, `deadlines`, and `events` via `campus-store.ts`.
   - The redesigned `/tasks` page must share the same persistence layer. Extending the store with a comprehensive `tasks: TaskItem[]` collection (while synchronizing bidirectional mutations with `deadlines` where applicable) ensures seamless state flow across the entire application without fragmented local storage keys.

2. **Zero-Lag & Bounded Viewport Constraint**:
   - The header must not exceed `28vh`.
   - Instanced mesh Three.js canvas must run with a single draw call, pointer event throttling, and an immediate check for `prefers-reduced-motion` or mobile screen width (< 768px) to disable the canvas and render a lightweight Canvas2D or CSS gradient fallback.
   - The main content area must use CSS Grid with `min-w-0` and `overflow-x-hidden` so horizontal scrollbars never appear under any desktop or tablet viewport.

3. **Deterministic Multi-Pass Vietnamese NLP**:
   - Following the battle-tested pattern in `src/lib/nlp-calendar.ts`, task QuickAdd must use a multi-pass regex extractor:
     - Pass 1: Duration extraction (`90p`, `90 phút`, `1.5h`, `45m`).
     - Pass 2: Priority extraction (`ưu tiên cao` -> `high`, `ưu tiên vừa` -> `medium`, `ưu tiên thấp` -> `low`).
     - Pass 3: Time extraction (`23h`, `23:59`, `14h30`).
     - Pass 4: Date extraction (`hôm nay`, `ngày mai`, `thứ 6`, `22/10`).
     - Pass 5: Course/Subject extraction (`mạng`, `triết`, `ctdl`, `xác suất`, `toán`, `lập trình`).
     - Pass 6: Title cleaning and capitalization.
   - This provides offline-first, instant (< 5ms) deterministic parsing that works in tests and production without external API dependencies, with an optional AI prompt breakdown modal for rich syllabus descriptions.

4. **Empty State Elimination in Detail Drawer**:
   - The original specification explicitly notes that an empty right panel is a waste of screen space.
   - When `selectedTaskId === null`, the drawer displays the "Việc tiếp theo nên làm" Hero card (choosing the most urgent deadline task), an immediate `▶ Bắt đầu` Focus CTA, a 7-day mini activity heatmap, and actionable Gen Z study tips.

---

## 3. Caveats

1. **No External Drag-and-Drop Packages**:
   - `@dnd-kit/core` is not in `package.json`. HTML5 Native Drag and Drop (`onDragStart`, `onDragOver`, `onDrop`) must be used for card reordering, Kanban column transitions, and Eisenhower quadrant placement to keep the bundle lean and avoid build breakage.
2. **Vanilla Three.js Integration**:
   - `@react-three/fiber` is not in `package.json`. The header 3D canvas must use vanilla `three` (`WebGLRenderer`, `Scene`, `PerspectiveCamera`, `InstancedMesh`) attached to an HTML `<canvas>` ref inside a React `useEffect`, properly cleaned up on unmount.
3. **Database Schema Fallback**:
   - Supabase sync must remain optimistic and debounced. If offline or if custom columns do not exist in the remote Postgres table, all state safely persists in `localStorage` (`campusos-shared-v2`).

---

## 4. Conclusion & Complete Specification Inventory

### 4.1 Feature Inventory Table (All P0, P1, and Discovered Features)

| ID | Feature | Category | Priority | Description | Inputs | Outputs | Acceptance Criteria |
|---|---|---|---|---|---|---|---|
| **F-01** | Quest Board Header | Header | **P0** | Bounded height header (<= 28vh) with large title `NHIỆM VỤ.`, character-reveal animation, dynamic subtitle reactive to task counts ("Còn 3 việc, cân được 💪"). | Task counts (total, overdue, completed) | Rendered header with dynamic copy and status | Height <= 28vh; text reveals smoothly; subtitle adapts when task count changes. |
| **F-02** | Vanilla Three.js Floating Blocks | Header | **P0** | Instanced mesh canvas with ~40 drifting cubes/stars; pointer reactive; bursting cube upon task completion; disabled on mobile & reduced motion. | Pointer coordinates, task completion event | Interactive 3D WebGL canvas with particle bursts | 60–120FPS; zero GPU lag; disabled when `prefers-reduced-motion` is active. |
| **F-03** | Magnetic Header Actions | Header | **P0** | Magnetic button group: `+ Thêm nhiệm vụ` (signature green/lime accent), `✨ AI chia nhỏ việc`, `▶ Focus ngay` (launches Pomodoro with most urgent task). | User click / pointer move | Opens QuickAdd modal, AI breakdown modal, or Focus modal | Magnetic hover attraction; launches correct target modals. |
| **F-04** | 4 Asymmetric Stat Stickers | Header | **P0** | Tilted cards with count-up: (1) Tổng nhiệm vụ, (2) Đang thực hiện, (3) Ưu tiên cao (pulsing red dot if overdue tasks exist), (4) Hoàn thành circular SVG ring with confetti at 100%. | Task list state | Rendered stat cards with count-up and liquid ring fill | Values calculate accurately; pulsing red dot if overdue > 0; confetti burst on 100%. |
| **F-05** | Multi-View Sliding Switcher | Controls | **P0** | Segmented sliding pill switcher supporting 4 views: `Danh sách · Kanban · Ma trận · Hôm nay`. | Click or keys `1/2/3/4` | Active view state change with smooth pill slide | Seamless layout transition; shortcuts 1/2/3/4 switch views instantly. |
| **F-06** | Full-Width Search & Filter Bar | Controls | **P0** | Search input with shortcut `/`, placeholder "Tìm nhiệm vụ, môn học, thẻ…", search term highlighting, and clear button. | Keyboard `/`, text query | Filtered task list | Instant filter across title, course, tags; shortcut `/` focuses input without typing `/`. |
| **F-07** | Live Count Status Filter Chips | Controls | **P0** | Status chips (`Tất cả`, `Cần làm`, `Đang làm`, `Hoàn thành`) displaying live item counts with smooth layout animation. | Filter click | Filtered task list | Accurately reflects count per status; active chip highlighted. |
| **F-08** | Visual Priority Filter Chips | Controls | **P0** | Replaces default `<select>` dropdown with 3 styled chips: `Cao` (`#FF3D6E`), `Vừa` (`#FFB020`), `Thấp` (`#3DE8FF`). | Chip toggle click | Filtered task list by priority | Displays explicit text labels "CAO", "VỪA", "THẤP"; filters correctly. |
| **F-09** | Custom Sort Menu | Controls | **P0** | Dropdown menu: Theo hạn (Due date), Ưu tiên (Priority), Môn học (Course), Mới tạo (Created at), AI đề xuất (Urgency score). | Selected sort option | Sorted task list | Stable sort; correctly sorts by selected criterion. |
| **F-10** | Floating Bulk Action Bar | Controls | **P0** | Bottom floating action bar appearing when multiple tasks are selected: Hoàn thành, Đổi ưu tiên, Dời hạn (+1 ngày, +3 ngày), Xoá (với Undo toast). | Multi-select checkboxes | Bulk action execution + notification | Slides in when selection count >= 1; batch updates state; offers Undo toast on delete. |
| **F-11** | List View Date Grouping | Views (List) | **P0** | Sticky headers grouping tasks by real system date: `Quá hạn · Hôm nay · Ngày mai · Tuần này · Sau đó · Đã xong` with counts & collapse toggles. | Real system date + task due dates | 6 organized task groups | Sticky positioning on scroll; correct date partition; collapse/expand persists in session. |
| **F-12** | Task Ticket Sticker & Checkmark | Views (List) | **P0** | Neo-brutal ticket card with 1.5px border, 20px corners, hover tilt ±0.8°. Large checkbox with animated SVG checkmark draw, strikethrough, mini confetti, `+XP` float-up. | Click on checkbox | Completed task moved to "Đã xong", awards +20 XP | SVG ✓ draws smoothly; strikethrough animation; XP floats upward; triggers 3D cube burst. |
| **F-13** | Dynamic Countdown Urgency Badge | Views (List) | **P0** | Live countdown in `JetBrains Mono`: lime (>24h), orange (3h–24h), red + gentle panic pulse (<3h), red badge + melting emoji `🫠` if overdue. | Task due date + current system clock | Color-coded countdown tag | Real-time countdown calculation; panic shake when < 3h; overdue warning copy. |
| **F-14** | Subtask Progress Segment Bar | Views (List) | **P0** | Segmented visual progress bar showing step completion ratio (e.g., `2/4 bước`). | Task `steps` array | Rendered step progress bar | Accurately calculates completed vs total steps; updates reactively. |
| **F-15** | HTML5 Drag-and-Drop Reordering | Views (List) | **P0** | Drag-and-drop to reorder tasks within groups or drag across date groups to reschedule. | Drag and drop events | Updated task order / due date + Undo toast | Reordering reflects instantly; shows toast with `Hoàn tác` option. |
| **F-16** | 3-Column Kanban Board | Views (Kanban) | **P0** | 3 columns: `Cần làm` (`#7A8AA8`), `Đang làm` (`#8B6CFF`), `Hoàn thành` (`#3DFFB0`). Tilted sticker column headers. | Drag cards between columns | Updated task status; awards XP on drop to "Hoàn thành" | Smooth card dragging; dropping into "Hoàn thành" awards XP and triggers confetti. |
| **F-17** | Kanban WIP Limit Warning | Views (Kanban) | **P0** | Soft warning notification/badge when "Đang làm" column exceeds 3 tasks. | Count of items with status `'doing'` | Warning sticker: "Đang ôm quá nhiều việc (> 3)!" | Appears only when doingCount > 3; disappears when <= 3. |
| **F-18** | Eisenhower 2x2 Matrix View | Views (Matrix) | **P1** | 2x2 grid: `Làm ngay` (Q1: Urgent & Important, pulsing neon border), `Lên lịch` (Q2), `Giao/Dời` (Q3), `Bỏ bớt` (Q4). Drag cards between quadrants. | Drag & drop between quadrants | Quadrant reassignment | Q1 has pulsing neon glow; cards draggable across all 4 quadrants. |
| **F-19** | AI Quadrant Placement Heuristic | Views (Matrix) | **P1** | Automatic quadrant suggestion based on due date proximity (<48h = urgent), priority ('high' = important), and difficulty. | Task due date, priority, difficulty | Suggested quadrant assignment | Accurately assigns initial quadrant if unspecified; manual drag overrides AI. |
| **F-20** | AI-Curated "Hôm nay" Plan | Views (Today) | **P1** | Curates up to ~5 top priority tasks fitting available free time today; displays capacity bar (total task minutes vs free study time). | Tasks list + Calendar events for today | Curated task list + capacity progress bar | Filters top tasks; computes capacity bar ratio; warns if overloaded. |
| **F-21** | Schedule Plan to Calendar CTA | Views (Today) | **P1** | Button `Chấp nhận kế hoạch` to automatically create scheduled study blocks in `events` collection of `campus-store.ts`. | User click on `Chấp nhận kế hoạch` | Calendar study events created + success toast | Creates non-conflicting study events in store; syncs with Calendar page. |
| **F-22** | "Việc tiếp theo nên làm" Hero Drawer | Drawer | **P0** | When no task is selected: displays the most urgent task with giant countdown, `▶ Bắt đầu` button, weekly mini-heatmap, and AI study tips. | Selected task ID === null | Rich unselected drawer view | Never shows blank space; provides immediate one-click Focus action. |
| **F-23** | In-Place Task Detail Editing | Drawer | **P0** | When task is selected: in-place editable title, description, subject selector, date picker, priority chips, 1–5 star difficulty rating. | Task selection + user input | Updated task fields in store | Edits persist immediately to store; date picker formats clean ISO string. |
| **F-24** | Subtask Checklist Manager | Drawer | **P0** | Subtasks checklist: toggle step completion, add step, delete step, drag reorder, overall progress percentage bar. | Step check / text input / delete | Updated `steps` array on task | Toggling step updates progress bar; updates list segment bar reactively. |
| **F-25** | Task-Linked Pomodoro Mini Widget | Drawer | **P1** | Tracks planned vs completed sessions (`pomodoros: { planned, done }`), estimated vs actual minutes, and `▶ Focus` CTA. | Task pomodoro counters | Rendered Pomodoro tracker + launch CTA | Displays session dots; clicking `▶ Focus` opens `StrictPomodoroModal`. |
| **F-26** | Vietnamese NLP Task QuickAdd | NLP / AI | **P0** | Natural language parser extracting title, due date, duration, priority, and course from strings like "nộp bài tập mạng 23h ngày mai 90p ưu tiên cao". | Vietnamese string input | Structured `Task` draft object | Deterministic multi-pass extraction; parses duration, date, time, priority, course. |
| **F-27** | AI Task Breakdown Modal | NLP / AI | **P1** | Modal where user pastes assignment description -> generates 3–5 concrete subtasks and estimated minutes using heuristic / LLM. | Assignment text prompt | Array of generated subtask items | Decomposes prompt into logical steps; user can accept or edit before saving. |
| **F-28** | StrictPomodoroModal Focus Integration | Gamification | **P0** | Clicking `▶ Focus` launches `StrictPomodoroModal` (with Cat Supervisor & 4-7-8 Breathing modes), syncing completed session stats. | Session completion stats (minutes, discipline) | XP awarded to store; Pomodoro count incremented | Syncs with `campus-store.ts` via `recordCompletedSession`; updates Streak & Level. |
| **F-29** | "Clear the Board" Streak Bonus | Gamification | **P1** | Completing all tasks scheduled for today triggers celebration: confetti shower + `+50 XP` bonus + congratulatory toast. | Today task list completion check | Confetti + XP bonus + celebratory toast | Fires once when the last task for today transitions to done. |
| **F-30** | Global Keyboard Shortcuts | Shortcuts | **P0** | `N` (new task), `/` (search), `1/2/3/4` (switch views), `J/K` (navigate), `X` (tick complete), `E` (edit), `F` (focus), `Del` (delete with undo), `?` (shortcuts modal), `Cmd/Ctrl+K` (palette). | Keyboard events (with input field guard) | Triggered action / navigation | Disabled when typing inside input/textarea/select; executes immediately otherwise. |
| **F-31** | Responsive Drawer (Mobile Bottom Sheet) | Responsive | **P0** | Drawer renders as side panel on desktop (>= 1024px) and draggable bottom sheet on mobile (< 1024px). | Viewport width | Adaptive drawer layout | Usable on 360px mobile viewports; no horizontal scrollbar. |
| **F-32** | Reduced Motion Mode | Accessibility | **P0** | Respects `prefers-reduced-motion` and user setting; disables 3D canvas, tilt effects, panic shake; falls back to clean opacity fades. | System query & store setting | Accessible animations | Zero motion discomfort; accessible WCAG compliant. |
| **F-33** | Undo / Redo Toast Notification | Quality | **P1** | Destructive actions (delete task, tick complete, reschedule) display an interactive toast with a 5-second `Hoàn tác` (Undo) button. | Delete or status change event | Reversible state change | Clicking `Hoàn tác` restores prior task state cleanly. |

---

### 4.2 Data Model: Comprehensive TypeScript Interface Definition

```typescript
/**
 * CampusOS Task Management Interface Definition
 * Located in src/types/tasks.ts or src/lib/campus-store.ts
 */

export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';
export type EisenhowerQuadrant = 'do_first' | 'schedule' | 'delegate' | 'eliminate';

export interface TaskStep {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskPomodoroInfo {
  planned: number; // e.g., 3 sessions
  done: number;    // e.g., 1 session completed
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type?: string; // 'pdf' | 'link' | 'image' | 'doc'
  sizeBytes?: number;
}

export interface TaskActivityLog {
  id: string;
  timestamp: string; // ISO string
  action: 'created' | 'status_changed' | 'pomodoro_completed' | 'rescheduled' | 'subtask_toggled';
  detail?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  course?: string;         // e.g., "Mạng máy tính", "CS301"
  subjectId?: string;      // ID matching course list
  status: TaskStatus;      // 'todo' | 'doing' | 'done'
  priority: TaskPriority;  // 'high' | 'medium' | 'low'
  difficulty: number;      // 1 to 5 stars
  dueAt: string;           // ISO 8601 (YYYY-MM-DDTHH:mm:ss) or date string (YYYY-MM-DD)
  estimateMin: number;     // Estimated duration in minutes (e.g. 45, 90)
  actualMin: number;       // Accumulated focus time in minutes
  steps: TaskStep[];       // Subtasks checklist
  tags: string[];          // e.g. ['Lab', 'BTL', 'Ôn thi']
  assigneeIds?: string[];  // For squad/group tasks
  pomodoros: TaskPomodoroInfo; // { planned, done }
  rrule?: string;          // Recurrence rule (e.g. 'FREQ=WEEKLY;BYDAY=MO')
  quadrant?: EisenhowerQuadrant; // 'do_first' | 'schedule' | 'delegate' | 'eliminate'
  order: number;           // Reorder index within group / column
  createdAt: string;       // ISO 8601
  completedAt?: string;    // ISO 8601 when status transitioned to 'done'
  notes?: string;          // Extended personal notes / markdown
  attachments?: TaskAttachment[];
  activityLog?: TaskActivityLog[];
}

/**
 * Shared Store Extension in src/lib/campus-store.ts
 */
export interface CampusOSSharedStateWithTasks extends CampusOSSharedState {
  tasks: TaskItem[];
}
```

---

### 4.3 Microcopy & Visual Specs

#### Color Tokens
- **Background Base**: `#0A0A12` with 4% SVG grain overlay and moving radial aurora blobs (`#7C5CFF`, `#FF3DA5`, `#3DE8FF`).
- **Signature Tasks Accent**: `#3DFFB0` (Mint / Acid Lime – primary action and completed state).
- **Status Colors**:
  - `Cần làm` (Todo): `#7A8AA8` (slate/blue-grey border and badge).
  - `Đang làm` (Doing): `#8B6CFF` (neon violet border and glowing pill).
  - `Hoàn thành` (Done): `#3DFFB0` (acid mint / emerald glow).
- **Priority Colors & Text Badges**:
  - `Cao`: `#FF3D6E` (hot pink / coral red with label `"CAO"`).
  - `Vừa`: `#FFB020` (sticker orange with label `"VỪA"`).
  - `Thấp`: `#3DE8FF` (cyan / electric blue with label `"THẤP"`).
- **Countdown Urgency Gradients**:
  - Safe (`> 24h`): Text `#3DFFB0` (Mint).
  - Approaching (`3h – 24h`): Text `#FFB020` (Orange).
  - Panic Zone (`< 3h`): Text `#FF3D6E` + gentle CSS panic shake (`@keyframes shake`).
  - Overdue: Background `#FF3D6E/15`, Text `#FF3D6E`, Melting face emoji `🫠`.
- **Eisenhower Quadrant Colors**:
  - Q1 `Làm ngay`: Border `#FF3D6E` + pulsing neon ring (`box-shadow: 0 0 15px rgba(255, 61, 110, 0.4)`).
  - Q2 `Lên lịch`: Border `#8B6CFF`.
  - Q3 `Giao/Dời`: Border `#FFB020`.
  - Q4 `Bỏ bớt`: Border `#7A8AA8`.

#### Vietnamese Gen Z Microcopy Inventory

| Location / Trigger | Vietnamese String | Intent & Tone |
|---|---|---|
| Header Subtitle (Remaining tasks > 0) | `"Còn {count} việc, cân được 💪"` | Motivating, energetic student tone |
| Header Subtitle (Has overdue tasks) | `"Trễ rồi bro, làm nhanh còn kịp 🫠"` | Playful urgent wake-up call |
| Header Subtitle (All clear / 0 tasks) | `"Sạch bách, đi chơi được rồi 🎉"` | Rewarding, stress-free celebration |
| Checkbox Complete Badge Float | `"+20 XP"` | Immediate gamification feedback |
| Checkbox Complete Toast | `"GG +20 XP! Đã xử đẹp nhiệm vụ 🎯"` | Gaming Gen Z celebration |
| "Clear the Board" (All today done) | `"Bảng sạch bóng! Quá đỉnh bro 🔥 +50 XP"` | High-tier milestone reward |
| Kanban WIP Limit Warning (>3 doing) | `"⚠️ Đang ôm quá nhiều việc (> 3)! Tập trung giải quyết bớt đi bro."` | Anti-burnout focus advice |
| Unselected Drawer Next-Up Title | `"Việc tiếp theo nên làm"` | Action orientation |
| Unselected Drawer AI Study Tip 1 | `"Chia nhỏ việc 120 phút thành 3 khối 25p nhé bro 🧠"` | Practical Pomodoro guidance |
| Unselected Drawer AI Study Tip 2 | `"Uống miếng nước rồi cày tiếp, deadline dí sát đít rồi 💧"` | Humorous student reminder |
| Unselected Drawer AI Study Tip 3 | `"Bật Pomodoro, cất điện thoại qua một bên đi bạn ơi 📵"` | Anti-distraction prompt |
| Search Empty State | `"Không tìm thấy việc nào! Thử từ khoá khác hoặc tạo mới nhé."` | Helpful guidance |
| Group Empty State | `"Không có nhiệm vụ nào trong mục này."` | Clean neutral feedback |
| Delete Task Toast | `"Đã xoá nhiệm vụ."` with button `"Hoàn tác"` | Reversible confidence |

#### Keyboard Shortcuts Map

| Shortcut Key | Action | Guard Condition |
|---|---|---|
| `N` or `n` | Opens QuickAdd Task popover | Blocked if active target is `INPUT`, `TEXTAREA`, `SELECT` |
| `/` | Focuses Search Input | Blocked if already inside text input |
| `1` | Switches to View: `Danh sách` (List) | Blocked in input |
| `2` | Switches to View: `Kanban` | Blocked in input |
| `3` | Switches to View: `Ma trận` (Eisenhower) | Blocked in input |
| `4` | Switches to View: `Hôm nay` (Today Plan) | Blocked in input |
| `J` / `j` | Navigates down to next task item | Blocked in input |
| `K` / `k` | Navigates up to previous task item | Blocked in input |
| `X` / `x` | Toggles complete status of selected task | Blocked in input; requires selected task |
| `E` / `e` | Opens detail drawer to edit selected task | Blocked in input; requires selected task |
| `F` / `f` | Launches Focus Mode (`StrictPomodoroModal`) | Blocked in input |
| `Delete` / `Backspace` | Deletes selected task with Undo toast | Blocked in input |
| `?` | Opens Keyboard Shortcuts modal | Blocked in input |
| `Cmd+K` / `Ctrl+K` | Opens global Command Palette | Allowed everywhere (even in inputs) |
| `Escape` | Closes active modals, drawers, or clears search | Allowed everywhere |

---

### 4.4 Key Algorithmic Logic

#### 1. Grouping Logic (`getTaskDateGroup(task, referenceDate)`)
```typescript
export type TaskDateGroupKey = 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'later' | 'done';

export function getTaskDateGroup(task: TaskItem, referenceDate: Date = new Date()): TaskDateGroupKey {
  if (task.status === 'done') {
    return 'done';
  }

  const todayStr = formatIsoDateOnly(referenceDate, 0); // e.g. "2026-10-13"
  const taskDueDateOnly = task.dueAt.slice(0, 10);      // extracts "YYYY-MM-DD"

  if (taskDueDateOnly < todayStr) {
    return 'overdue';
  }
  if (taskDueDateOnly === todayStr) {
    return 'today';
  }

  const tomorrowStr = formatIsoDateOnly(referenceDate, 1);
  if (taskDueDateOnly === tomorrowStr) {
    return 'tomorrow';
  }

  // End of current week (Sunday)
  const currentDayOfWeek = referenceDate.getDay(); // 0 is Sunday, 1 is Monday
  const daysUntilSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek;
  const sundayStr = formatIsoDateOnly(referenceDate, daysUntilSunday);

  if (taskDueDateOnly <= sundayStr) {
    return 'this_week';
  }

  return 'later';
}
```

#### 2. Eisenhower 2x2 Matrix Classification Heuristic
```typescript
export function computeEisenhowerQuadrant(
  task: TaskItem,
  referenceDate: Date = new Date()
): EisenhowerQuadrant {
  // If user has explicitly overridden the quadrant, preserve their manual placement
  if (task.quadrant) {
    return task.quadrant;
  }

  const todayStr = formatIsoDateOnly(referenceDate, 0);
  const taskDueDateOnly = task.dueAt.slice(0, 10);
  const diffDays = daysDifference(todayStr, taskDueDateOnly);

  // Urgent: Overdue or due within 2 days (<= 48 hours)
  const isUrgent = diffDays <= 2;

  // Important: High priority, difficulty >= 4, or title contains major exam/thesis keywords
  const isImportant =
    task.priority === 'high' ||
    task.difficulty >= 4 ||
    /\b(thi|bài tập lớn|btl|khóa luận|báo cáo|đồ án)\b/i.test(task.title);

  if (isUrgent && isImportant) return 'do_first';   // Làm ngay (Q1)
  if (!isUrgent && isImportant) return 'schedule';  // Lên lịch (Q2)
  if (isUrgent && !isImportant) return 'delegate';  // Giao / Dời (Q3)
  return 'eliminate';                              // Bỏ bớt (Q4)
}
```

#### 3. Deterministic Vietnamese Task NLP Regex Extractor
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

export function parseVietnameseTaskInput(
  rawInput: string,
  referenceDate: Date = new Date()
): ParsedTaskResult {
  if (!rawInput || !rawInput.trim()) {
    return {
      title: 'Nhiệm vụ mới',
      dueDate: formatIsoDateOnly(referenceDate, 0),
      dueTime: '23:59',
      estimateMin: 45,
      priority: 'medium',
      confidence: 0.2,
      rawInput,
    };
  }

  let working = rawInput.trim();
  let detectedEstimateMin = 45;
  let detectedPriority: TaskPriority = 'medium';
  let detectedDueDate = formatIsoDateOnly(referenceDate, 0);
  let detectedDueTime = '23:59';
  let detectedCourse: string | undefined = undefined;

  // Pass 1: Duration extraction ("90p", "90 phút", "1.5h", "2 tiếng", "45m")
  const durationRegex = /\b(\d+(?:\.\d+)?)\s*(?:p|phút|min|m|h|tiếng|giờ)\b/i;
  const durMatch = working.match(durationRegex);
  if (durMatch) {
    const val = parseFloat(durMatch[1]!);
    const rawUnit = durMatch[0].toLowerCase();
    if (rawUnit.includes('h') || rawUnit.includes('tiếng') || rawUnit.includes('giờ')) {
      detectedEstimateMin = Math.round(val * 60);
    } else {
      detectedEstimateMin = Math.round(val);
    }
    working = working.replace(durMatch[0], ' ');
  }

  // Pass 2: Priority extraction ("ưu tiên cao", "gấp", "ưu tiên vừa", "ưu tiên thấp")
  if (/\b(?:ưu tiên\s+cao|gấp|urgent|p1)\b/i.test(working)) {
    detectedPriority = 'high';
    working = working.replace(/\b(?:ưu tiên\s+cao|gấp|urgent|p1)\b/gi, ' ');
  } else if (/\b(?:ưu tiên\s+thấp|không gấp|p3)\b/i.test(working)) {
    detectedPriority = 'low';
    working = working.replace(/\b(?:ưu tiên\s+thấp|không gấp|p3)\b/gi, ' ');
  } else if (/\b(?:ưu tiên\s+vừa|bình thường|p2)\b/i.test(working)) {
    detectedPriority = 'medium';
    working = working.replace(/\b(?:ưu tiên\s+vừa|bình thường|p2)\b/gi, ' ');
  }

  // Pass 3: Time extraction ("23h", "23:59", "14h30", "08:00")
  const timeRegex = /(?:lúc\s+|vào\s+)?(\d{1,2})(?:h|:|g)(\d{2})?(?:\s*(sáng|chiều|tối))?/i;
  const timeMatch = working.match(timeRegex);
  if (timeMatch) {
    let h = parseInt(timeMatch[1]!, 10);
    const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const period = timeMatch[3]?.toLowerCase();
    if (period === 'chiều' && h < 12) h += 12;
    if (period === 'tối' && h < 12) h += 12;
    detectedDueTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    working = working.replace(timeMatch[0], ' ');
  }

  // Pass 4: Date extraction (relative, day of week, explicit DD/MM)
  const lowerWorking = working.toLowerCase();
  if (lowerWorking.includes('hôm nay') || lowerWorking.includes('tối nay')) {
    detectedDueDate = formatIsoDateOnly(referenceDate, 0);
    working = working.replace(/(?:hôm nay|tối nay)/gi, ' ');
  } else if (lowerWorking.includes('ngày mai') || lowerWorking.includes('sáng mai') || lowerWorking.includes('tối mai') || lowerWorking.includes('mai')) {
    detectedDueDate = formatIsoDateOnly(referenceDate, 1);
    working = working.replace(/(?:ngày mai|sáng mai|tối mai|mai)/gi, ' ');
  } else if (lowerWorking.includes('ngày kia') || lowerWorking.includes('mốt')) {
    detectedDueDate = formatIsoDateOnly(referenceDate, 2);
    working = working.replace(/(?:ngày kia|mốt)/gi, ' ');
  } else {
    // Day of week or explicit date matching
    const dowRegex = /(?:thứ\s*([2-7]|hai|ba|tư|năm|sáu|bảy)|chủ nhật|cn)/i;
    const dowMatch = working.match(dowRegex);
    if (dowMatch) {
      // Offset calculation to nearest upcoming day
      const val = dowMatch[1]?.toLowerCase() || dowMatch[0].toLowerCase();
      let targetDay = 1;
      if (val === '2' || val === 'hai') targetDay = 1;
      else if (val === '3' || val === 'ba') targetDay = 2;
      else if (val === '4' || val === 'tư') targetDay = 3;
      else if (val === '5' || val === 'năm') targetDay = 4;
      else if (val === '6' || val === 'sáu') targetDay = 5;
      else if (val === '7' || val === 'bảy') targetDay = 6;
      else if (val === 'chủ nhật' || val === 'cn') targetDay = 0;
      const currentDay = referenceDate.getDay();
      let diff = (targetDay - currentDay + 7) % 7;
      if (diff === 0) diff = 7;
      detectedDueDate = formatIsoDateOnly(referenceDate, diff);
      working = working.replace(dowMatch[0], ' ');
    } else {
      const explicitDateRegex = /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?/;
      const expMatch = working.match(explicitDateRegex);
      if (expMatch) {
        const d = parseInt(expMatch[1]!, 10);
        const m = parseInt(expMatch[2]!, 10);
        const y = expMatch[3] ? parseInt(expMatch[3], 10) : referenceDate.getFullYear();
        detectedDueDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        working = working.replace(expMatch[0], ' ');
      }
    }
  }

  // Pass 5: Known Course / Subject Extraction
  const coursesMap = [
    { key: /mạng máy tính|mạng/i, name: 'Mạng máy tính' },
    { key: /triết học|triết/i, name: 'Triết học Mác - Lênin' },
    { key: /ctdl|cấu trúc dữ liệu/i, name: 'CTDL & GT' },
    { key: /xác suất|xác suất thống kê/i, name: 'Xác suất Thống kê' },
    { key: /toán rời rạc/i, name: 'Toán rời rạc' },
    { key: /kỹ thuật lập trình/i, name: 'Kỹ thuật lập trình' },
    { key: /dự án web|web/i, name: 'Dự án Web' },
    { key: /clb công nghệ/i, name: 'CLB Công nghệ' },
  ];
  for (const item of coursesMap) {
    if (item.key.test(working)) {
      detectedCourse = item.name;
      break;
    }
  }

  // Pass 6: Title cleaning
  let cleanedTitle = working
    .replace(/\b(?:nộp|làm|học|vào|lúc|ngày|cho|môn)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  cleanedTitle = cleanedTitle.replace(/^[-–—:,.\s]+|[-–—:,.\s]+$/g, '');

  if (!cleanedTitle || cleanedTitle.length < 2) {
    cleanedTitle = rawInput.trim();
  }
  cleanedTitle = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);

  return {
    title: cleanedTitle,
    course: detectedCourse,
    dueDate: detectedDueDate,
    dueTime: detectedDueTime,
    estimateMin: detectedEstimateMin,
    priority: detectedPriority,
    confidence: 0.85,
    rawInput,
  };
}
```

---

### 4.5 Edge Cases Table

| # | Feature | Input / Condition | Observed / Required Behavior |
|---|---|---|---|
| **E-01** | NLP QuickAdd | Empty string, whitespace only, or single symbol (e.g. `""`, `"   "`, `"?"`) | Returns fallback draft `{ title: 'Nhiệm vụ mới', priority: 'medium', estimateMin: 45 }` without throwing error; confidence score = 0.2. |
| **E-02** | NLP QuickAdd | Input contains only course name (e.g. `"mạng máy tính"`) | Extracts course `"Mạng máy tính"`, sets fallback title `"Bài tập Mạng máy tính"`, defaults due date to today. |
| **E-03** | Date Grouping | Task has past due date and `status !== 'done'` | Grouped strictly into `Quá hạn` (Overdue); ticket glows red with melting face emoji `🫠`; header high priority counter pulses red dot. |
| **E-04** | Date Grouping | Task has past due date and `status === 'done'` | Grouped strictly into `Đã xong` (Completed); does NOT appear in `Quá hạn`; strikethrough applied; no urgent alert. |
| **E-05** | Detail Drawer | No task currently selected (`selectedTaskId === null`) | Panel does NOT render empty; renders "Việc tiếp theo nên làm" Hero with live countdown, `▶ Bắt đầu` button, weekly mini-heatmap, and AI tips. |
| **E-06** | Kanban View | "Đang làm" column count exceeds 3 tasks (`doingCount > 3`) | Renders soft WIP alert banner: "⚠️ Đang ôm quá nhiều việc (> 3)! Tập trung giải quyết bớt đi bro." |
| **E-07** | Kanban View | Dragging card and dropping into "Hoàn thành" | Automatically transitions card `status` to `'done'`, sets `completedAt`, awards `+20 XP`, triggers confetti burst and 3D cube explosion. |
| **E-08** | Keyboard Shortcuts | User pressing `N`, `/`, `1/2/3/4`, `J`, `K` while typing in `<input>` or `<textarea>` | Shortcut action is strictly blocked; keystrokes are passed to the text input normally without triggering page view switches or modal toggles. |
| **E-09** | Three.js Canvas | User enables `prefers-reduced-motion` or mobile viewport (< 768px) | Vanilla Three.js animation loop is cancelled, WebGL canvas unmounts cleanly, and renders a lightweight CSS/Canvas2D gradient fallback. Zero lag. |
| **E-10** | Bulk Actions | Selecting 3 tasks and clicking "Xoá" | Deletes all 3 tasks, updates counts, and immediately displays a floating toast: "Đã xoá 3 nhiệm vụ" with a 5-second `Hoàn tác` button to restore them. |
| **E-11** | "Hôm nay" Plan | All tasks scheduled for today are completed | Renders empty state card: "Bảng sạch bóng! Quá đỉnh bro 🎉" and awards the one-time `+50 XP` "Clear the board" streak bonus. |
| **E-12** | Viewport Layout | Viewport resized to 360px mobile width | No horizontal overflow scrollbars appear; grid wraps gracefully; detail drawer becomes a bottom sheet modal. |
| **E-13** | Rapid Checkbox Toggling | User clicks complete checkbox multiple times within 200ms | Debounces completion action to prevent duplicate XP addition or multiple conflicting state writes. |
| **E-14** | Focus Mode Link | User clicks `▶ Focus ngay` in Header when no tasks exist | Defaults to a standard 25-minute Pomodoro session with `StrictPomodoroModal`. |

---

## 5. Verification Method

To independently verify the completeness and accuracy of this specification survey:
1. **Inspection of Reference Specifications**:
   - Verify all requirements R1–R6 against `ORIGINAL_REQUEST.md` (lines 144–225) and `docs/CampusOS_Tasks_Redesign_Plan.md`.
2. **Data Model Compatibility**:
   - Verify `TaskItem` fields against `src/lib/campus-store.ts` (`DeadlineItem`, `CalendarEvent`, `CampusOSSharedState`) to ensure zero collision and full interoperability.
3. **NLP Logic Verification**:
   - Verify that test cases for `"nộp bài tập mạng 23h ngày mai 90p ưu tiên cao"` match the test patterns established in `tests/campus-redesign.test.ts`.
4. **Invalidation Conditions**:
   - If `@react-three/fiber` or `@dnd-kit/core` were added without permission, that would invalidate the zero external wrapper constraint.
   - If the header exceeds `28vh` or horizontal scrollbars occur on 360px–1440px viewports, that invalidates the layout containment specification.
