# Project: CampusOS Tasks (/tasks) Redesign (Neo-Brutal Aurora)

## Architecture

The Nhiệm vụ (`/tasks`) page is rebuilt into a modular, high-performance (zero-lag 120FPS) application synchronized with CampusOS's shared reactive store (`campus-store.ts`), Focus Mode (`StrictPomodoroModal`), Calendar (`/calendar`), and Dashboard (`/dashboard`).

```
+---------------------------------------------------------------------------------+
|                                App Shell / Sidebar                               |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  [ Quest Board Header (<= 28vh) ]                                               |
|  - Title "NHIỆM VỤ." (Character Reveal) & Dynamic Subtitle                      |
|  - Vanilla Three.js Instanced Mesh Canvas (~40 floating drifting cubes/stars)   |
|  - Magnetic Action Buttons: [+ Thêm nhiệm vụ] [✨ AI chia nhỏ việc] [▶ Focus]   |
|  - 4 Tilted Stat Stickers: Tổng, Đang làm, Ưu tiên cao, Hoàn thành (SVG Ring)   |
|                                                                                 |
|  [ Smart Controls Bar ]                                                         |
|  - Sliding Segmented Pill Switcher: Danh sách · Kanban · Ma trận · Hôm nay     |
|  - Full-width Search Bar (shortcut "/") & Filter Chips (Status, Priority, Sort) |
|  - Floating Bulk Action Bar (Multi-select: Complete, Priority, Postpone, Delete) |
|                                                                                 |
|  +---------------------------------------------------+------------------------+ |
|  | Multi-View Canvas (min-w-0, overflow-x-hidden)    | Intelligent Drawer     | |
|  | - View 1: List (Sticky Date Groups, Countdowns)   | - Unselected: Next-Up  | |
|  | - View 2: Kanban (3 Columns, HTML5 DnD, WIP Alert)|   Hero + Tips + Heatmap| |
|  | - View 3: Eisenhower Matrix (2x2, Neon Q1 Border) | - Selected: Full Edit  | |
|  | - View 4: Today Plan (AI Curate, Capacity Bar)    |   + Subtasks + Pomodoro| |
|  +---------------------------------------------------+------------------------+ |
|                                                                                 |
|  [ Modals & Overlays ]                                                          |
|  - QuickAdd NLP Popover (Vietnamese multi-pass regex extraction)                |
|  - AI Task Breakdown Modal (Assignment description -> Checklist subtasks)      |
|  - StrictPomodoroModal (Fat Orange Cat Supervisor & 4-7-8 Breathing Mode)       |
|  - Global Shortcuts Listener (N, /, 1-4, J/K, X, E, F, Del, ?, Cmd/Ctrl+K)       |
+---------------------------------------------------------------------------------+
```

### Data Flow & Reactive Store
- `campus-store.ts` (`useSyncExternalStore` + `localStorage` key `'campusos-shared-v2'`):
  - Primary collection: `tasks: TaskItem[]`.
  - Bidirectional sync with `deadlines` for top-level urgent tasks.
  - Ticking task complete: awards `+20 XP`, triggers streak check, updates `lastStudyDate`, bursts 3D cube, and debounces sync to Supabase Cloud (`pushToSupabaseCloudDebounced`).
  - Completing all today's tasks: awards `+50 XP` ("Clear the board" streak reward).
  - Launching Focus Mode: invokes `StrictPomodoroModal`, records session via `recordSession(minutes, disciplineScore)`, awards study XP & minutes.

---

## Feature Inventory

Every feature surveyed from the specification is mapped to an implementation milestone.

| # | Feature | Category | Priority | Milestone | Source |
|---|---------|----------|----------|-----------|--------|
| F-01 | Quest Board Header with dynamic subtitle | Header | P0 | M2 | Survey / Spec |
| F-02 | Vanilla Three.js floating cubes instanced mesh | Header | P0 | M2 | Survey / Spec |
| F-03 | Magnetic Header Actions (+Task, AI Breakdown, Focus) | Header | P0 | M2 | Survey / Spec |
| F-04 | 4 Asymmetric Stat Stickers with liquid SVG progress ring | Header | P0 | M2 | Survey / Spec |
| F-05 | Multi-View Sliding Segmented Pill Switcher (1/2/3/4) | Controls | P0 | M3 | Survey / Spec |
| F-06 | Full-width Search & Filter Bar (shortcut "/") | Controls | P0 | M3 | Survey / Spec |
| F-07 | Status Filter Chips with live item counts | Controls | P0 | M3 | Survey / Spec |
| F-08 | Visual Priority Filter Chips (Cao #FF3D6E, Vừa #FFB020, Thấp #3DE8FF) | Controls | P0 | M3 | Survey / Spec |
| F-09 | Custom Sort Menu (Due date, Priority, Course, Created, AI) | Controls | P0 | M3 | Survey / Spec |
| F-10 | Floating Bulk Action Bar (Complete, Priority, Postpone, Delete + Undo) | Controls | P0 | M3 | Survey / Spec |
| F-11 | List View Date Grouping (Sticky headers, collapse toggles) | List View | P0 | M3 | Survey / Spec |
| F-12 | Task Ticket Sticker & SVG checkmark draw with +XP float | List View | P0 | M3 | Survey / Spec |
| F-13 | Dynamic Countdown Urgency Badge (Lime -> Orange -> Red panic shake) | List View | P0 | M3 | M1 / M3 | Survey / Spec |
| F-14 | Subtask Progress Segment Bar | List View | P0 | M3 | Survey / Spec |
| F-15 | HTML5 Drag-and-Drop Reordering with Undo toast | List View | P0 | M3 | Survey / Spec |
| F-16 | 3-Column Kanban Board (Cần làm, Đang làm, Hoàn thành) | Kanban View | P0 | M3 | Survey / Spec |
| F-17 | Kanban WIP Limit Warning Sticker (>3 in Đang làm) | Kanban View | P0 | M3 | Survey / Spec |
| F-18 | Eisenhower 2x2 Matrix View (Làm ngay neon border, Lên lịch, Giao/Dời, Bỏ bớt) | Matrix View | P1 | M3 | Survey / Spec |
| F-19 | AI Quadrant Placement Heuristic | Matrix View | P1 | M1 / M3 | Survey / Spec |
| F-20 | AI-Curated "Hôm nay" Plan (Top ~5 tasks, capacity bar) | Today View | P1 | M3 | Survey / Spec |
| F-21 | Schedule Plan to Calendar CTA (Sync study events) | Today View | P1 | M3 | Survey / Spec |
| F-22 | "Việc tiếp theo nên làm" Hero Drawer (Unselected state) | Drawer | P0 | M4 | Survey / Spec |
| F-23 | In-Place Task Detail Editing (Title, desc, date picker, priority, stars) | Drawer | P0 | M4 | Survey / Spec |
| F-24 | Subtask Checklist Manager (Toggle, add, delete, drag reorder) | Drawer | P0 | M4 | Survey / Spec |
| F-25 | Task-Linked Pomodoro Mini Widget (Planned/done sessions, Focus CTA) | Drawer | P1 | M4 | Survey / Spec |
| F-26 | Vietnamese NLP Task QuickAdd (Deterministic multi-pass parser) | NLP / AI | P0 | M1 / M4 | Survey / Spec |
| F-27 | AI Task Breakdown Modal (Assignment prompt -> checklist subtasks) | NLP / AI | P1 | M4 | Survey / Spec |
| F-28 | StrictPomodoroModal Focus Integration (Cat & Breathing modes) | Gamification | P0 | M4 | Survey / Spec |
| F-29 | "Clear the Board" Streak Bonus (+50 XP when all today done) | Gamification | P1 | M1 / M4 | Survey / Spec |
| F-30 | Global Keyboard Shortcuts (N, /, 1-4, J/K, X, E, F, Del, ?, Cmd+K) | Shortcuts | P0 | M4 | Survey / Spec |
| F-31 | Responsive Drawer (Mobile bottom sheet < 1024px) | Responsive | P0 | M4 | Survey / Spec |
| F-32 | Reduced Motion Mode (Accessible fallback for 3D/tilt/shake) | Accessibility | P0 | M2 / M3 / M4 | Survey / Spec |
| F-33 | Undo / Redo Toast Notification (Reversible destructive actions) | Quality | P1 | M3 / M4 | Survey / Spec |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| **TEST** | E2E Testing Track | Design & write test suite (`tests/tasks-redesign.test.ts`) covering NLP parser, Eisenhower quadrants, date grouping, store state logic. Publish `TEST_READY.md`. | none | DONE |
| **M1** | Store, Types & Tasks Engine | Add `TaskItem` types to `src/types/tasks.ts`. Extend `campus-store.ts` with `tasks` collection, seeded default tasks anchored around real system date, actions (`addTask`, `completeTask`, `updateTask`, `deleteTask`, `bulkUpdateTasks`, `toggleTaskStep`). Create `src/lib/tasks-engine.ts` (grouping, Eisenhower, NLP parsing, urgency). | none | DONE |
| **M2** | Quest Board Header & 3D Blocks | Header component (`quest-board-header.tsx`), vanilla Three.js instanced mesh drifting cubes canvas (`floating-blocks-3d.tsx`), 4 tilted stat stickers with count-up and liquid SVG completion ring, magnetic action buttons (`+Thêm`, `AI chia nhỏ`, `Focus`). | M1 | DONE |
| **M3** | Smart Controls Bar & 4 Views | Controls bar (`controls-bar.tsx`) with sliding pill switcher, search, status chips, priority chips, sort menu, bulk bar. 4 Views: List (`list-view.tsx` with date grouping, countdowns, SVG checkmark, DnD), Kanban (`kanban-view.tsx` with 3 columns, WIP alert), Eisenhower Matrix (`matrix-view.tsx` with 2x2 grid, neon Q1), Today Plan (`today-view.tsx` with AI curate, capacity bar, calendar sync). | M1 | DONE |
| **M4** | Detail Drawer, NLP/AI, Focus Sync & Page Integration | Detail drawer (`task-detail-drawer.tsx` with unselected "Việc tiếp theo" + selected full editing + subtask checklist + Pomodoro widget). NLP QuickAdd modal (`quick-add-modal.tsx`), AI Breakdown modal (`ai-breakdown-modal.tsx`), Focus Mode integration (`StrictPomodoroModal`), shortcuts, zero-overflow integration in `src/app/(main)/tasks/page.tsx`. | M1, M2, M3 | DONE |
| **M5** | Final Verification & Hardening | Run `npm run typecheck`, `npm test` (passing 33 existing + new tasks tests), `npm run build`. Verify zero horizontal scrollbars, 120FPS, and full P0/P1 scope. | M1, M2, M3, M4, TEST | DONE |

---

## Interface Contracts

### `src/types/tasks.ts`
```typescript
export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';
export type EisenhowerQuadrant = 'do_first' | 'schedule' | 'delegate' | 'eliminate';
export type TaskDateGroupKey = 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'later' | 'done';

export interface TaskStep {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskPomodoroInfo {
  planned: number;
  done: number;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  course?: string;
  subjectId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  difficulty: number; // 1-5
  dueAt: string;      // YYYY-MM-DD or ISO
  estimateMin: number;
  actualMin: number;
  steps: TaskStep[];
  tags: string[];
  pomodoros: TaskPomodoroInfo;
  quadrant?: EisenhowerQuadrant;
  order: number;
  createdAt: string;
  completedAt?: string;
  notes?: string;
}
```

### `src/lib/tasks-engine.ts`
```typescript
export function getTaskDateGroup(task: TaskItem, referenceDate?: Date): TaskDateGroupKey;
export function computeEisenhowerQuadrant(task: TaskItem, referenceDate?: Date): EisenhowerQuadrant;
export function parseVietnameseTaskInput(rawInput: string, referenceDate?: Date): {
  title: string;
  course?: string;
  dueDate: string;
  dueTime: string;
  estimateMin: number;
  priority: TaskPriority;
  confidence: number;
  rawInput: string;
};
export function getUrgencyLevel(dueAt: string, referenceDate?: Date): {
  isOverdue: boolean;
  hoursRemaining: number;
  color: 'lime' | 'orange' | 'red';
  isPanic: boolean;
  displayCountdown: string;
};
```

### `src/lib/campus-store.ts` Extension
```typescript
// Added to CampusOSSharedState:
tasks: TaskItem[];

// Actions:
export function addTask(task: Omit<TaskItem, 'id' | 'createdAt' | 'order'>): TaskItem;
export function completeTask(id: string, xpAward?: number): { task: TaskItem | null; xpGained: number; clearBoardBonus: boolean };
export function updateTask(id: string, patch: Partial<TaskItem>): TaskItem | null;
export function deleteTask(id: string): TaskItem | null;
export function bulkUpdateTasks(ids: string[], patch: Partial<TaskItem>): void;
export function toggleTaskStep(taskId: string, stepId: string): void;
```

---

## Code Layout

```
web/
├── src/
│   ├── types/
│   │   └── tasks.ts                               # Unified Task interfaces and types
│   ├── lib/
│   │   ├── campus-store.ts                        # Extended with tasks collection & reactive actions
│   │   └── tasks-engine.ts                        # Pure algorithmic logic (grouping, Eisenhower, NLP, urgency)
│   ├── components/
│   │   └── tasks/
│   │       ├── header/
│   │       │   ├── quest-board-header.tsx         # Header section, dynamic subtitle, magnetic CTAs
│   │       │   ├── floating-blocks-3d.tsx         # Vanilla Three.js instanced mesh canvas
│   │       │   └── stat-stickers.tsx              # 4 tilted stickers with SVG liquid progress ring
│   │       ├── controls/
│   │       │   ├── controls-bar.tsx               # View switcher, search, filters, sort, bulk actions
│   │       │   └── bulk-action-bar.tsx            # Floating multi-select action bar
│   │       ├── views/
│   │       │   ├── list-view.tsx                  # Sticky date groups, tickets, countdowns, DnD
│   │       │   ├── kanban-view.tsx                # 3 columns, HTML5 DnD, WIP limit warning
│   │       │   ├── matrix-view.tsx                # Eisenhower 2x2 grid, neon Q1 border, AI placement
│   │       │   ├── today-view.tsx                 # AI curated top 5 tasks, capacity bar, calendar sync
│   │       │   └── task-card.tsx                  # Reusable Neo-Brutal task ticket card
│   │       ├── drawer/
│   │       │   ├── task-detail-drawer.tsx         # Slide-over desktop / mobile bottom sheet
│   │       │   ├── unselected-hero.tsx            # "Việc tiếp theo nên làm" + heatmap + study tips
│   │       │   └── subtask-checklist.tsx          # Step manager with progress bar
│   │       └── create/
│   │           ├── quick-add-modal.tsx            # Vietnamese NLP quick task creation
│   │           └── ai-breakdown-modal.tsx         # Paste syllabus prompt -> auto subtasks
│   └── app/
│       └── (main)/
│           └── tasks/
│               └── page.tsx                       # Main page orchestration, keyboard shortcuts, zero-overflow
└── tests/
    └── tasks-redesign.test.ts                     # Opaque-box unit & integration tests
```
