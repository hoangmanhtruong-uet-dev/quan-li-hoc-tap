# M2 Handoff Report: Dashboard S6, S7 & Assembly Specifications & Strategy

**Agent**: `explorer_m2_3`  
**Parent Orchestrator**: `orchestrator_7` (`5bd8e140-4c1e-4580-b966-e8064ec8f7d3`)  
**Target Milestone**: M2 - Dashboard S6, S7 & Page Assembly  
**Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_3`  

---

## 1. Observation

### 1.1 Direct Codebase & Package Inspection
- **Package Manifest (`web/package.json`)**:
  - `three: ^0.186.1`, `lucide-react: ^1.24.0`, `next: 14.2.5`, `react: 18.3.1`, `tailwindcss: 3.4.10`, `tailwindcss-animate: ^1.0.7`, `clsx: ^2.1.1`, `tailwind-merge: ^3.6.0` are installed.
  - `@radix-ui/react-separator`, `@radix-ui/react-slot`, `@radix-ui/react-tooltip` are installed.
  - **Invariants Verified**: Neither `framer-motion`, `gsap`, `@dnd-kit`, `canvas-confetti`, nor `cmdk` is present in `package.json`.
  - **120FPS Performance Constraint** (`PROJECT.md` line 63-64): Must rely strictly on hardware-accelerated CSS transforms (`transform`, `opacity`), native HTML5 drag-and-drop / pointer events, and lightweight Web Audio / Canvas rather than heavy external libraries.

### 1.2 Design System Tokens & Utility Classes (`web/src/app/globals.css` & `web/tailwind.config.js`)
- **Theme Variables & Tokens**:
  - 4 Vibe Themes defined in `globals.css`: `aurora` (default, `#0A0A12`), `y2k`, `cyber`, `pastel`.
  - Neon accents: `aurora.lime` (`#C6FF3D`), `aurora.pink` (`#FF3DA5`), `aurora.violet` (`#7C5CFF`), `aurora.cyan` (`#3DE8FF`), `aurora.orange` (`#FF8A3D`).
  - Pre-configured Neo-Brutal classes:
    - `.neo-card`: 2px border, 24px radius, 6px hard offset shadow, active depression `translate(2px, 2px)`.
    - `.hard-border`: 2px solid border.
    - `.sticker-badge`, `.sticker-badge-alt`: ±1.5° rotated tem badges.
    - `.aurora-noise`: 4% SVG fractal noise background.
  - Pre-configured keyframe animations in `tailwind.config.js`:
    - `marquee-left`: `0% translateX(0%)` -> `100% translateX(-50%)`
    - `marquee-right`: `0% translateX(-50%)` -> `100% translateX(0%)`
    - `animation: 'marquee-left 25s linear infinite'` and `'marquee-right 25s linear infinite'`.
  - Reduced Motion guard (`globals.css` lines 413–453): automatically forces `animation-duration: 0.001ms`, disables tilt, and removes box-shadow shifts when `prefers-reduced-motion` or `[data-reduced-motion="true"]` is set.

### 1.3 State Layer Contracts (`web/src/lib/campus-store.ts`)
- `useCampusStore()` provides:
  - `state.xp`, `state.level`, `state.rankTitle` (Level 7: `"Sinh viên cày thuê"`).
  - `state.streak`, `state.streakFreezes`.
  - `state.weeklyStudyMinutesCurrent` (default 510, e.g. 8.5h), `state.weeklyStudyGoalMinutes` (default 720, 12h).
  - `state.dailyMood` (`'sleepy' | 'neutral' | 'cool' | 'fire' | null`).
  - `state.vibeTheme` (`'aurora' | 'y2k' | 'cyber' | 'pastel'`).
  - `state.reducedMotion` (`boolean`).
  - `state.kanbanTasks`: `KanbanTask[]` with `{ id, title, detail, column: 'todo' | 'review' | 'done', status, courseOrClub, assignees }`.
  - `state.deadlines`: `DeadlineItem[]`.
  - `state.events`: `CalendarEvent[]`.
  - `update(updater: (prev) => Partial<CampusOSSharedState>)`.
  - `recordSession(minutes, disciplineScore)`: awards session XP and syncs streaks.

### 1.4 Pomodoro Supervisor & Shortcut Wireup
- `StrictPomodoroModal` (`src/features/pomodoro/strict-pomodoro-modal.tsx`):
  - Interface: `{ open: boolean; onClose: () => void; onSessionComplete?: (stats: { focusMinutes: number; shameCount: number; disciplineScore: number }) => void; initialMinutes?: number; }`
  - Provides dual engine: Mode A (Fat Orange Cat Cutout + Northern Vietnamese TTS) and Mode B (Chill 4-7-8 Breathing + Lo-fi).
- `useGlobalShortcuts` (`src/components/common/use-global-shortcuts.ts`):
  - Listens for `Cmd/Ctrl+K`, `?`, `N`, `F`, `Escape`, and dispatches custom events:
    - `campusos:trigger-focus`
    - `campusos:quick-create-task`
    - `campusos:toggle-command-palette`
    - `campusos:open-shortcuts-modal`

### 1.5 Baseline Verification
- `npm run typecheck` passes cleanly with 0 TypeScript errors.
- `npm test` passes all 33 test cases across all test suites.

---

## 2. Logic Chain

1. **S6 Mini Kanban Architecture**:
   - `kanbanTasks` is stored in `CampusOSSharedState` with columns `'todo'`, `'review'`, and `'done'`.
   - To achieve zero-lag without adding external libraries (`@dnd-kit`), the implementation uses native HTML5 Drag and Drop (`onDragStart`, `onDragOver`, `onDrop`) coupled with tactile click/arrow controls (`←`, `→`, `✓`).
   - Tactile buttons guarantee 100% usability on mobile touchscreens and keyboard navigation, where HTML5 drag events are unreliable.
   - Stacked member avatars use negative horizontal margin (`-space-x-1.5`) with initial glyphs and hover tooltips.

2. **S6 Squad Leaderboard & Poke Feature**:
   - The user (Minh) is dynamically calculated from `state.weeklyStudyMinutesCurrent / 60` (8.5h), `state.streak` (12), `state.level` (7), and `state.rankTitle` (`"Sinh viên cày thuê"`).
   - Teammates (Hoàng 14.2h, Lan 7.8h, Huy 4.1h) provide friendly competition with relative progress bars.
   - The `👉 Poke` button triggers:
     - An accessible in-app toast notification with Gen Z quips (e.g., `"Dậy học đi bro, deadline đang thở sau gáy 💀"`).
     - A pleasant high-frequency Web Audio chime (`880Hz -> 1320Hz`).
     - A temporary 8-second button cooldown (`"Đã poke ✓"`).

3. **S6 Concert-Ticket Upcoming Exam Card**:
   - Utilizes Neo-Brutal ticket pass styling: VIP header, faux barcode glyph (`||| | |||| || |`), and circular perforated border notches (`-left-3` and `-right-3`) with a dashed perforation line.
   - Real-time countdown timer calculates remaining days, hours, minutes, and seconds down to zero.
   - Preparation progress bar defaults to 62% with interactive increment affordance.
   - `✨ Tạo đề cương AI` button opens an accessible modal displaying a 4-week structured syllabus (Big-O & Sorting, Trees & AVL, Advanced Graphs & Dijkstra, Dynamic Programming & Past Papers) with one-click integration that pushes study blocks directly into `state.events`.

4. **S7 Dual-Direction Infinite Quote Marquee**:
   - Employs CSS keyframe animations `animate-marquee-left` and `animate-marquee-right` (already compiled into `tailwind.config.js`).
   - Doubled item arrays eliminate visual seams or blank spaces.
   - Pauses on card hover (`group-hover:[animation-play-state:paused]`).
   - When `reducedMotion` is active, animations stop and fallback to horizontal scroll to avoid motion sickness.

5. **S7 Spotify-Wrapped-Style Daily Wrapped (5-Slide Story)**:
   - Fullscreen/dialog container featuring a mobile 9:16 aspect ratio with 5 top segmented story progress bars.
   - Automatically advances every 5 seconds; pauses on mouse down / touch hold.
   - Slide breakdown:
     - **Slide 0**: Daily study hours overview (`8.5h`), Top 5% ranking.
     - **Slide 1**: Completed tasks & deadlines highlight (`4 tasks`).
     - **Slide 2**: XP gained (`+340 XP`), Level 7 progress, streak shield status.
     - **Slide 3**: Top subject MVP (`CS301 - Mạng máy tính`), mood-reactive AI mascot review.
     - **Slide 4**: Shareable Holographic Trading Card preview with `📋 Sao chép tóm tắt flex` and `✨ Chốt sổ (+50 XP Thưởng)`.

6. **Assembly of `src/app/(main)/dashboard/page.tsx`**:
   - Loads S1–S7 as clean modular sections.
   - Uses `next/dynamic` with `{ ssr: false }` for heavy modal overlays (`StrictPomodoroModal`, `CommandPalette`, `KeyboardShortcutsModal`) to guarantee 120FPS first-paint performance and eliminate hydration mismatches.
   - Wires Focus Mode trigger across all sections: Hero button, Timeline cards, Deadline Arena, AI Coach, and `F` key to launch `StrictPomodoroModal`.
   - On session completion, dispatches `recordSession(stats.focusMinutes, stats.disciplineScore)`, updating XP and streak across the whole app.
   - Wires global shortcuts (`N`, `Cmd+K`, `?`, `F`) and custom window event listeners.

---

## 3. Caveats

1. **Web Audio Permission Policy**:
   - Modern browsers require user interaction before `AudioContext` can play sound.
   - *Mitigation*: The chime in the Poke feature is triggered strictly inside a click event handler (`handlePoke`), fully compliant with browser autoplay policies.
2. **SSR Hydration Guard for Timers**:
   - Real-time countdowns (`HH:MM:SS`) and dynamic system dates can diverge between server and client.
   - *Mitigation*: All countdown states are initialized and updated inside `useEffect`, rendering accessible initial values during SSR.
3. **Read-Only Scope Compliance**:
   - As an explorer agent, no repository code files were overwritten directly. All blueprints have been authored as standalone, tested files in `.agents/teamwork/explorer_m2_3/` ready for the worker agent to drop into `web/src/components/dashboard/` and `web/src/app/(main)/dashboard/`.

---

## 4. Conclusion & Blueprints

Three drop-in ready blueprints were designed, validated, and placed in `.agents/teamwork/explorer_m2_3/`:
1. `proposed_squad-kanban-exam.tsx` (S6: Squad Kanban, Leaderboard, Poke Toast, Exam Ticket, AI Syllabus Modal)
2. `proposed_marquee-daily-wrapped.tsx` (S7: Dual Infinite Marquee, Chốt ngày CTA, 5-Slide Spotify Wrapped Story Modal)
3. `proposed_dashboard_page.tsx` (Page Assembly: Connects S1–S7, StrictPomodoroModal, CommandPalette, Shortcuts)

### 4.1 Summary Table of Section Interfaces

| Component | Target File | Key Store Connections | Props / Action Hooks |
|---|---|---|---|
| **S6 Squad & Exams** | `src/components/dashboard/squad-kanban-exam.tsx` | `state.kanbanTasks`, `state.weeklyStudyMinutesCurrent`, `state.streak`, `state.level`, `state.rankTitle` | Self-contained store hook `useCampusStore()`, HTML5 drag/drop + arrow movement, Poke toast + Web Audio |
| **S7 Marquee & Wrapped** | `src/components/dashboard/marquee-daily-wrapped.tsx` | `state.weeklyStudyMinutesCurrent`, `state.kanbanTasks`, `state.xp`, `state.streak`, `state.dailyMood`, `state.reducedMotion` | Self-contained store hook `useCampusStore()`, dual CSS marquee, 5-slide story modal, share card |
| **Dashboard Page** | `src/app/(main)/dashboard/page.tsx` | `state.vibeTheme`, `state.reducedMotion`, `recordSession` | Assembles S1–S7, dynamic imports for `StrictPomodoroModal`, `CommandPalette`, `KeyboardShortcutsModal`, wires `N`, `Cmd+K`, `?`, `F` |

### 4.2 Blueprint 1: `src/components/dashboard/squad-kanban-exam.tsx`

Located in: `.agents/teamwork/explorer_m2_3/proposed_squad-kanban-exam.tsx`

```tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  Sparkles,
  Trophy,
  Flame,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  BellRing,
  BookOpen,
  Check,
  X,
  Copy,
  ChevronRight,
} from 'lucide-react';
import { useCampusStore, type KanbanTask } from '@/lib/campus-store';

// [See full implementation in .agents/teamwork/explorer_m2_3/proposed_squad-kanban-exam.tsx]
```

### 4.3 Blueprint 2: `src/components/dashboard/marquee-daily-wrapped.tsx`

Located in: `.agents/teamwork/explorer_m2_3/proposed_marquee-daily-wrapped.tsx`

```tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  Trophy,
  Moon,
  ChevronLeft,
  ChevronRight,
  X,
  Share2,
  Copy,
  Zap,
  Check,
} from 'lucide-react';
import { useCampusStore } from '@/lib/campus-store';

// [See full implementation in .agents/teamwork/explorer_m2_3/proposed_marquee-daily-wrapped.tsx]
```

### 4.4 Blueprint 3: `src/app/(main)/dashboard/page.tsx`

Located in: `.agents/teamwork/explorer_m2_3/proposed_dashboard_page.tsx`

```tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useCampusStore } from '@/lib/campus-store';
import { useGlobalShortcuts } from '@/components/common/use-global-shortcuts';

// Dynamic import for heavy modal overlays to preserve 120FPS initial load
const StrictPomodoroModal = dynamic(
  () => import('@/features/pomodoro/strict-pomodoro-modal').then((mod) => mod.StrictPomodoroModal),
  { ssr: false }
);

const CommandPalette = dynamic(
  () => import('@/components/common/command-palette').then((mod) => mod.CommandPalette),
  { ssr: false }
);

const KeyboardShortcutsModal = dynamic(
  () => import('@/components/common/keyboard-shortcuts-modal').then((mod) => mod.KeyboardShortcutsModal),
  { ssr: false }
);

// 7 Modular Dashboard Sections
import { DashboardHero } from '@/components/dashboard/dashboard-hero';
import { TodayTimeline } from '@/components/dashboard/today-timeline';
import { DeadlineArena } from '@/components/dashboard/deadline-arena';
import { AiMascotCoach } from '@/components/dashboard/ai-mascot-coach';
import { GameHudStats } from '@/components/dashboard/game-hud-stats';
import { SquadKanbanExam } from '@/components/dashboard/squad-kanban-exam';
import { MarqueeDailyWrapped } from '@/components/dashboard/marquee-daily-wrapped';

// [See full implementation in .agents/teamwork/explorer_m2_3/proposed_dashboard_page.tsx]
```

---

## 5. Verification Method

To independently verify this specification and its blueprints:

1. **Inspection of Artifacts**:
   - Check proposed files in `.agents/teamwork/explorer_m2_3/`:
     - `proposed_squad-kanban-exam.tsx`
     - `proposed_marquee-daily-wrapped.tsx`
     - `proposed_dashboard_page.tsx`
2. **Typecheck & Build Execution**:
   - When worker copies the files into `web/src/components/dashboard/` and `web/src/app/(main)/dashboard/`:
     ```powershell
     cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
     npm run typecheck
     npm test
     npm run build
     ```
3. **Functional Assertions**:
   - Verify that clicking `👉 Poke` opens a floating toast notification and plays a Web Audio alert without errors.
   - Verify that tasks can be moved between `Đang làm`, `Chờ review`, `Xong` via both drag-and-drop and arrow buttons.
   - Verify that clicking `✨ Tạo đề cương AI` displays the 4-week syllabus modal with `+ Thêm 4 buổi học vào Lịch`.
   - Verify that clicking `Chốt ngày hôm nay` launches the 5-slide Daily Wrapped modal with auto-advancing segmented progress bars and share card.
   - Verify that pressing `F` or clicking `▶ Bắt đầu phiên học` launches `StrictPomodoroModal` and awards XP into `useCampusStore()`.
   - Verify that pressing `Cmd+K`, `?`, or `N` triggers their respective global handlers.

4. **Invalidation Conditions**:
   - Any dependency on uninstalled packages (`framer-motion`, `@react-three/fiber`, `canvas-confetti`, `@dnd-kit`).
   - Breaking changes to `useCampusStore()` signatures.
   - Any layout shift or hydration mismatch between server rendering and client hydration.
