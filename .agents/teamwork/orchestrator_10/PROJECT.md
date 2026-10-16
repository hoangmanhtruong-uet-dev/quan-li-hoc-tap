# Project: CampusOS Quick Task ("Tạo nhiệm vụ nhanh") Upgrade (Gen Z, 120FPS, NLP & Three.js)

## Architecture

The Quick Task ("Tạo nhiệm vụ nhanh") modal is upgraded from a rudimentary input form into a high-energy, Gen Z, 120FPS experience featuring natural language Vietnamese parsing, dynamic interactive chips, 4 priority tiers, Three.js 3D particle background, and seamless dual-write synchronization with Deadline Arena and Tasks.

```
+-----------------------------------------------------------------------------------+
|                           CampusOS Quick Task Modal                               |
+-----------------------------------------------------------------------------------+
|  [ Three.js 3D WebGL Canvas Layer (120FPS, Z-Index Behind Card) ]                |
|  - Drifting particles (neon lime / purple / cyan) + pointer parallax               |
|  - Interactive rotating wireframe icosahedron with pointer tilt                   |
|  - Reactive typing intensity pulse (brightness increases with typing cadence)     |
|  - Priority color theme reaction (Siêu gấp -> red/amber particles + jitter)       |
|  - Submit confetti burst stream toward Deadline Arena                             |
|  - Strict WebGL context disposal & reduced-motion / mobile fallback               |
+-----------------------------------------------------------------------------------+
|  [ Neo-Brutal Modal Card (Border Glow reactive to Priority) ]                    |
|  - Header: Title "⚡ TẠO NHIỆM VỤ NHANH", Esc badge, Close button                 |
|  - Main NLP Input: Multi-pass extraction, auto-focus, focus trap                  |
|  - Live Interactive Chips: [📅 Date] [⏰ Time] [📚 Course] [⏱ Duration]          |
|    * Click chip to open quick inline selector / editor                            |
|    * Fallback to "Hôm nay 23:59" when omitted                                     |
|  - 1-Click Suggestion Chips: "Hôm nay 23h", "Ngày mai", "Cuối tuần", "Tuần sau"    |
|  - 4 Priority Tiers: Thấp (#3DE8FF), Vừa (#FFB020), Gấp (#FF8A3D), Siêu gấp(#FF3D6E)|
|  - Bottom Controls: Keyboard hint [Enter], [Ctrl+Enter], Neon Lime Submit CTA     |
|  - Floating +10 XP Pill on create                                                 |
|  - 5-Second Neo-Brutal Undo Toast ("Đã thêm vào Deadline Arena · Hoàn tác")       |
+-----------------------------------------------------------------------------------+
|  [ Reactive Store Synchronization & Event Bus ]                                   |
|  - campus-store.ts: addQuickTask() atomically adds to both state.tasks &          |
|    state.deadlines, awards +10 XP, recalculates rank, returns undo() callback     |
|  - Event 'campusos:deadline-created' triggers 3s flashing border in Deadline Arena|
|  - Unified modal mounted in /dashboard and /tasks                                 |
+-----------------------------------------------------------------------------------+
```

---

## Feature Inventory

Every requirement from `ORIGINAL_REQUEST.md` (section `## 2026-10-13T12:48:34Z`) is mapped to an implementation milestone.

| # | Feature | Category | Priority | Milestone | Source |
|---|---------|----------|----------|-----------|--------|
| F-01 | Vietnamese NLP Date Extraction (hôm nay, mai, mốt, thứ X, cuối tuần, tuần sau, DD/MM) | NLP | P0 | M1 | Request R1 |
| F-02 | Vietnamese NLP Time Extraction (23h, 11 giờ đêm, 14h30, 8h sáng, cuối ngày -> 23:59) | NLP | P0 | M1 | Request R1 |
| F-03 | Vietnamese NLP Course Extraction (Mạng máy tính, Giải tích, Triết học, CTDL, etc.) | NLP | P0 | M1 | Request R1 |
| F-04 | Vietnamese NLP Duration Extraction (90p, 2 tiếng, 45 phút) | NLP | P0 | M1 | Request R1 |
| F-05 | 4 Priority Tiers in types (Thấp #3DE8FF, Vừa #FFB020, Gấp #FF8A3D, Siêu gấp #FF3D6E) | Data | P0 | M1 | Request R2 |
| F-06 | Unified Store Sync `addQuickTask` (dual-write to state.tasks & state.deadlines) | Store | P0 | M1 | Request R4 |
| F-07 | Atomic +10 XP award and level/rank recomputation | Store | P0 | M1 | Request R4 |
| F-08 | Reversible `undo()` callback restoring tasks, deadlines, and XP | Store | P0 | M1 | Request R4 |
| F-09 | Three.js 120FPS WebGL canvas layer with drifting particles & pointer parallax | 3D FX | P0 | M2 | Request R3 |
| F-10 | Rotating wireframe icosahedron with pointer tilt in modal corner | 3D FX | P0 | M2 | Request R3 |
| F-11 | Reactive typing intensity brightness pulse on particles | 3D FX | P0 | M2 | Request R3 |
| F-12 | 3D Particle color theme reaction & geometric jitter for "Siêu gấp" | 3D FX | P0 | M2 | Request R2, R3 |
| F-13 | Success creation confetti burst streaming toward Deadline Arena | 3D FX | P0 | M2 | Request R3 |
| F-14 | Resource cleanup (cancelAnimationFrame, geometry/material/renderer dispose, tab throttling)| 3D FX | P0 | M2 | Request R3 |
| F-15 | Reduced motion & mobile fallback (CSS aurora gradient, zero WebGL) | 3D FX | P0 | M2 | Request R3 |
| F-16 | Interactive chips below input with click-to-edit inline selectors | UI | P0 | M3 | Request R1 |
| F-17 | Fallback to "Hôm nay 23:59" when input lacks date/time | UI | P0 | M3 | Request R1 |
| F-18 | Quick suggestion chips ("Hôm nay 23h", "Ngày mai", "Cuối tuần", "Tuần sau") | UI | P0 | M3 | Request R1 |
| F-19 | 4 Priority tier selector buttons with distinct colors & glowing border | UI | P0 | M3 | Request R2 |
| F-20 | Keyboard hotkeys: Enter (submit), Ctrl+Enter (rapid entry), Escape (close), N, Cmd+K | Shortcuts | P0 | M3 | Request R4 |
| F-21 | Glowing neon lime submit button with [Enter] keyboard hint | UI | P0 | M3 | Request R4 |
| F-22 | Floating +10 XP badge animation on creation | Gamification | P0 | M3 | Request R4 |
| F-23 | 5-Second Neo-Brutal Undo Toast ("Đã thêm vào Deadline Arena · Hoàn tác") | UI | P0 | M3 | Request R4 |
| F-24 | Accessibility: role="dialog", aria-modal="true", focus trap, auto-focus | A11y | P0 | M3 | Request R4 |
| F-25 | Responsive layout: centered desktop modal & mobile swipeable bottom sheet | UI | P0 | M3 | Request R4 |
| F-26 | Mount upgraded QuickAddModal in /dashboard/page.tsx (remove inline modal) | Integration | P0 | M4 | Request R4 |
| F-27 | Pre-populate input from Voice Brain-Dump (initialTitle prop) | Integration | P0 | M4 | Survey / Spec |
| F-28 | Wire global trigger 'campusos:quick-create-task' in /tasks/page.tsx | Integration | P0 | M4 | Survey / Spec |
| F-29 | Event-driven flash highlight border on newly created card in Deadline Arena | Integration | P0 | M4 | Request R3, R4 |
| F-30 | Opaque-box E2E test suite covering NLP, Priority, Store Sync, Undo, XP (Tiers 1-4) | Testing | P0 | TEST | Acceptance |
| F-31 | Typecheck (tsc --noEmit) and production build (npm run build) cleanly passing | Quality | P0 | M5 | Acceptance |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| **TEST** | E2E Testing Track | Design & write opaque-box test suite (`tests/quick-task-nlp-sync.test.ts`) covering Tiers 1-4: NLP parsing, 4 priority tiers, store dual-write, +10 XP, undo rollback. Publish `TEST_READY.md`. | none | PLANNED |
| **M1** | Engine, Types & Store Sync | Upgrade `TaskPriority` in `src/types/tasks.ts`. Extend NLP parser in `src/lib/tasks-engine.ts` (time, date, courses, 4 priorities). Implement `addQuickTask` in `src/lib/campus-store.ts` with dual-write, +10 XP, and `undo()` closure. | none | PLANNED |
| **M2** | Vanilla Three.js 3D Backdrop | Build `src/components/tasks/create/quick-task-backdrop-3d.tsx`: 120FPS particle canvas, wireframe icosahedron, mouse parallax, typing pulse, priority shift/jitter, confetti burst, mobile/reduced-motion fallback, and strict WebGL disposal. | M1 | PLANNED |
| **M3** | Upgraded QuickAddModal & Chips | Rebuild `src/components/tasks/create/quick-add-modal.tsx`: interactive clickable chips with selectors, 1-click suggestion chips, 4 priority buttons, Enter & Ctrl+Enter rapid entry, focus trap, floating +10 XP, and 5s undo toast. | M1, M2 | PLANNED |
| **M4** | App Shell & Deadline Arena Sync | Mount modal in `src/app/(main)/dashboard/page.tsx` (supporting `initialTitle` from voice brain-dump). Wire `campusos:quick-create-task` in `tasks/page.tsx`. Add 3s flashing neon highlight border in `src/components/dashboard/deadline-arena.tsx`. | M1, M3 | PLANNED |
| **M5** | Final Verification & Hardening | Run `npm run typecheck`, all 109+ unit tests, `npm run build`, and forensic audit verification. | M1, M2, M3, M4, TEST | PLANNED |

---

## Interface Contracts

### 1. `src/types/tasks.ts`
```typescript
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
```

### 2. `src/lib/tasks-engine.ts`
```typescript
export function parseVietnameseTaskInput(rawInput: string, referenceDate?: Date): {
  title: string;
  course?: string;
  dueDate: string;      // YYYY-MM-DD
  dueTime: string;      // HH:mm
  estimateMin: number;
  priority: TaskPriority;
  confidence: number;
  rawInput: string;
};
```

### 3. `src/lib/campus-store.ts`
```typescript
export function addQuickTask(
  taskData: Omit<TaskItem, 'id' | 'createdAt' | 'order'>
): {
  task: TaskItem;
  deadline: DeadlineItem;
  undo: () => void;
};
```

### 4. Custom Events
```typescript
// Dispatched on quick task creation:
window.dispatchEvent(new CustomEvent('campusos:deadline-created', {
  detail: { id: deadline.id, taskId: task.id }
}));

// Dispatched to open modal globally:
window.dispatchEvent(new CustomEvent('campusos:quick-create-task', {
  detail: { initialTitle?: string }
}));
```

---

## Code Layout

```
web/
├── src/
│   ├── types/
│   │   └── tasks.ts                               # Updated TaskPriority ('low'|'medium'|'high'|'urgent')
│   ├── lib/
│   │   ├── tasks-engine.ts                        # Enhanced Vietnamese NLP extraction (date/time/course/priority)
│   │   └── campus-store.ts                        # Atomic addQuickTask dual-write, +10 XP, undo()
│   ├── components/
│   │   ├── tasks/
│   │   │   └── create/
│   │   │       ├── quick-task-backdrop-3d.tsx     # Vanilla Three.js 120FPS particle canvas & icosahedron
│   │   │       └── quick-add-modal.tsx            # Rebuilt Gen Z Quick Task modal with interactive chips
│   │   ├── dashboard/
│   │   │   └── deadline-arena.tsx                 # Flashing neon lime highlight on 'campusos:deadline-created'
│   │   └── common/
│   │       └── command-palette.tsx                # Global shortcut trigger 'campusos:quick-create-task'
│   └── app/
│       └── (main)/
│           ├── dashboard/page.tsx                 # Mounts QuickAddModal, removes inline form
│           └── tasks/page.tsx                     # Listens for campusos:quick-create-task
└── tests/
    └── quick-task-nlp-sync.test.ts                # Opaque-box E2E unit tests (Tiers 1-4)
```
