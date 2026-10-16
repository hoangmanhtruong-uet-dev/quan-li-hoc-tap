# Project: CampusOS Dashboard & Calendar Neo-Brutal Aurora Redesign

## Architecture
- **Framework**: Next.js 14.2.5 (App Router), React 18.3.1, TypeScript 5.5.4, Tailwind CSS 3.4.10, Three.js 0.186.1, Lucide React.
- **Visual Aesthetic**: "Neo-Brutal Aurora" Gen Z design direction:
  - Base obsidian `#0A0A12`, moving aurora blobs (`#7C5CFF`, `#FF3DA5`, `#3DE8FF`), 4% noise overlay, neon accents (`#C6FF3D`, `#FF8A3D`).
  - 4 Vibe Themes: `Aurora` (default), `Y2K Chrome`, `Cyber Lime`, `Pastel Dreamy`.
  - Expressive typography: `Unbounded` / `Space Grotesk` headings, `Be Vietnam Pro` body, `JetBrains Mono` tabular clocks & numbers.
  - Neo-Brutal cards with 2px borders, 6px hard-offset shadows, 24–32px rounded corners, ±1.5° rotated stickers.
- **120FPS Performance Engine**:
  - Single draw call (1-draw-call) Canvas2D / WebGL shaders for ambient auroras and interactive dot-grid.
  - Zero-overhead CSS transforms (`transform`, `opacity`) for animations. No layout thrashing or heavy multi-pass WebGL post-processing.
  - Full support for `prefers-reduced-motion` and user-controlled "Giảm hiệu ứng" toggle.
- **Unified Reactive Persistent Store**:
  - `src/lib/campus-store.ts` backed by `localStorage` (`campusos-shared-v2`) and cross-tab/cross-component `CustomEvent` synchronization.
  - Manages XP, Level, Vietnamese humorous rank titles (Level 7 "Sinh viên cày thuê"), Streak + Streak Freeze, daily Mood (`😴 😐 😎 🔥`), Vibe Theme, study minutes, tasks/deadlines, Kanban columns, and calendar events.
- **Focus Mode Dual Engine**:
  - Integrated in `src/features/pomodoro/strict-pomodoro-modal.tsx`:
    - Mode A: Mèo Mập Giám Thị Cực Đoan (cutout cat, 0:52 grey countdown, Northern Vietnamese TTS, PiP, tab detection).
    - Mode B: Chill Breathing 4-7-8 + Lo-fi Mode (19s breathing cycle orb + procedural Web Audio ambient synth pad).
  - Rewards sync directly into the shared store (`+focusMinutes`, `+XP`, streak progression).

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Neo-Brutal Aurora Design Tokens & CSS Variables | Obsidian base, aurora blobs, neon accents, card styles, and typography | M1 | Survey |
| 2 | Vibe Theme Switcher | 4 Themes: Aurora, Y2K Chrome, Cyber Lime, Pastel Dreamy | M1 | Survey |
| 3 | Reduced Motion ("Giảm hiệu ứng") & 120FPS Guard | Toggle disabling 3D deformation, tilt, and particles; respect OS motion prefs | M1 | Survey |
| 4 | Unified Persistent Store (`campus-store.ts`) | Reactive localStorage store for XP, Streak, Mood, Deadlines, Events, Kanban | M1 | Survey |
| 5 | Gamification Engine (`gamification.ts`) | 10 XP levels (Lvl 7 "Sinh viên cày thuê"), streak freezes, humorous rank titles | M1 | Survey |
| 6 | Calendar Math & Load Score (`calendar-math.ts`) | Calculate daily `loadScore` (green/orange/red) and detect schedule conflicts | M1 | Survey |
| 7 | Vietnamese NLP Parser (`nlp-calendar.ts`) | Parses strings like `"ôn xác suất 19h thứ 6 tại thư viện"` into structured events | M1 | Survey |
| 8 | RFC 5545 .ics Serializer & Parser (`ics-calendar.ts`) | Export schedule to `.ics` and parse imported `.ics` timetable files | M1 | Survey |
| 9 | AI Auto-Scheduler Engine (`auto-scheduler.ts`) | Greedy slot-packing algorithm for "Xếp lịch giúp tao" | M1 | Survey |
| 10 | Global Command Palette & Shortcuts (`Cmd+K`, `?`, `N`, `F`) | Fast task/event capture, keyboard cheat sheet, Focus Mode launch | M1 | Survey |
| 11 | Interactive Custom Cursor & Easter Eggs | Dot + trailing ring expanding on interactive targets; Konami code & logo click | M1 | Survey |
| 12 | Dashboard S1: Hero Reveal & Glitch | Staggered character reveal ("CHÀO BUỔI SÁNG, MINH.") with gradient glitch | M2 | Survey |
| 13 | Dashboard S1: Zero-Lag Aurora/3D Blob | Pointer-reactive 1-draw-call canvas blob responding to urgency/streak | M2 | Survey |
| 14 | Dashboard S1: Streak Sticker & Freeze | Rotated ±1.5° `🔥 12` sticker with particle burst on click + weekly freeze shield | M2 | Survey |
| 15 | Dashboard S1: Mood Check-in (`😴 😐 😎 🔥`) | Mood selector syncing to store and adapting AI Coach tone | M2 | Survey |
| 16 | Dashboard S1: Voice Brain-Dump | Web Speech API speech-to-task dictation with fallback text modal | M2 | Survey |
| 17 | Dashboard S1: Magnetic CTAs | Magnetic tracking buttons (`+ Thêm nhiệm vụ`, `▶ Bắt đầu phiên học`) | M2 | Survey |
| 18 | Dashboard S2: Horizontal Class Timeline | Draggable/scrollable timeline with real-time "now" line and active class progress | M2 | Survey |
| 19 | Dashboard S2: 3D Tilt Cards & Quick Actions | Perspective tilt hover effect with `Vào lớp`, `Mở tài liệu`, `Ghi chú nhanh` | M2 | Survey |
| 20 | Dashboard S3: Deadline Arena Asymmetric Bento | Bento grid featuring hero cell with live countdown and dynamic color shift | M2 | Survey |
| 21 | Dashboard S3: Panic Shake Mode | Red pulsing and subtle CSS panic shake when deadline is under 3 hours | M2 | Survey |
| 22 | Dashboard S3: SVG Checkmark Draw, Confetti & +XP | Animated SVG path completion checkmark, confetti burst, and floating +XP | M2 | Survey |
| 23 | Dashboard S4: AI Coach Mascot | Animated mascot with cursor-tracking eyes, blinking, and mood expressions | M2 | Survey |
| 24 | Dashboard S4: Typewriter Study Plan & Commit | Typewriter proposal with quick chips and one-click commit to Today & Calendar | M2 | Survey |
| 25 | Dashboard S5: Weekly Goal Ring | Radial study goal ring (e.g. 8.5/12h) with count-up animation & liquid fill | M2 | Survey |
| 26 | Dashboard S5: Game HUD & 12-Week Heatmap | Level progression bar, badges, and 12-week GitHub-style study heatmap | M2 | Survey |
| 27 | Dashboard S5: Warning Sticker & Grade Sparkline | Neo-brutal alert card with animated SVG path grade trend sparkline | M2 | Survey |
| 28 | Dashboard S6: 3-Column Mini Kanban | `Đang làm`, `Chờ review`, `Xong` mini board with task movement | M2 | Survey |
| 29 | Dashboard S6: Squad Leaderboard & Poke Button | Teammate weekly study hours ranking with `Nhắc bạn (Poke)` toast alert | M2 | Survey |
| 30 | Dashboard S6: Concert-Ticket Exam Card | Perforated pass card with countdown, prep progress, and AI outline modal | M2 | Survey |
| 31 | Dashboard S7: Dual Marquee Footer | Infinite dual scrolling Gen Z study quote tickers in opposing directions | M2 | Survey |
| 32 | Dashboard S7: Daily Wrapped Story Modal | Spotify-style 5-slide modal summarizing study hours, tasks, XP, and share card | M2 | Survey |
| 33 | Calendar Real System Date Seeding | Anchors `todayKey` to `new Date()` and generates relative events around current date | M3 | Survey |
| 34 | Calendar S1: Month Poster Header | Giant poster typography with split-flap airport flip transition on month change | M3 | Survey |
| 35 | Calendar S1: 1-Draw-Call Interactive Dot-Grid | Canvas wave background reactive to pointer and cluster load | M3 | Survey |
| 36 | Calendar S1: Sliding-Pill View Switcher | Segmented switcher for Month, Week, Day, Agenda, and Timeline views | M3 | Survey |
| 37 | Calendar S2: 5 Neon Filter Chips & Solo Mode | 5 category filters with live event counts and `Alt+click` solo mode | M3 | Survey |
| 38 | Calendar S2: Smart Search & Toggles | Instant search input (`/`), weekend hide toggle, and free-slot toggle | M3 | Survey |
| 39 | Calendar S2: Squad View Overlay | Teammates busy/free schedule overlay with avatar tags | M3 | Survey |
| 40 | Calendar S3: Month Grid with Load Heat-Bar | 7-day grid with daily `loadScore` heat-bar, flame ping on deadlines, Today neon pulse | M3 | Survey |
| 41 | Calendar S3: Truncation-Free Hover Tooltips & +N Fan | Tooltips preserving full details and `+N` fan-out popover for overflow | M3 | Survey |
| 42 | Calendar S3: Drag-and-Drop Reschedule & Undo Toast | Drag events between days with bounce animation and 5s Undo toast | M3 | Survey |
| 43 | Calendar S3: NLP Quick-Create Popover | Double-click day cell or `N` trigger opening Vietnamese NLP event parser | M3 | Survey |
| 44 | Calendar S4: Week & Day Time-Grid (06:00–23:00) | 15-minute snap drag-to-move and edge resize duration with real-time "now" line | M3 | Survey |
| 45 | Calendar S4: Free-Slot Finder (`+ Học ở đây`) | Hatched study intervals with one-click Focus Mode launch | M3 | Survey |
| 46 | Calendar S4: Conflict Detection & Auto-Resolution | Red pulsing border on concurrent events with one-click shift to open slot | M3 | Survey |
| 47 | Calendar S5: Agenda & Semester Timeline Views | Chronological list view with sticky dates; horizontal milestone roadmap | M3 | Survey |
| 48 | Calendar S5: AI Auto-Scheduler Modal ("Xếp lịch giúp tao") | Proposes study blocks in open slots before exams/deadlines with accept/reject | M3 | Survey |
| 49 | Calendar S5: .ics Import & Export | Standard RFC 5545 export and file drag-and-drop import | M3 | Survey |
| 50 | Calendar S6: Slide-Over Day Drawer & Upcoming Rail | Slide-over drawer with tickets, checklist, SVG checkmark XP; upcoming 5-event rail | M3 | Survey |
| 51 | Focus Mode Mode Switcher in `StrictPomodoroModal` | In-modal toggle: Mèo Mập Giám Thị Cực Đoan vs Chill Breathing 4-7-8 + Lo-fi | M4 | Survey |
| 52 | Chill Breathing 4-7-8 Engine & Visual Orb | Guided 19s breathing cycle visual orb (4s inhale, 7s hold, 8s exhale) | M4 | Survey |
| 53 | Procedural Lo-fi Synthesizer (`lofi-synth.ts`) | Zero-asset Web Audio ambient lo-fi synth with lowpass filter & warm detune | M4 | Survey |
| 54 | Focus Mode Reward Synchronization | Session completion increments minutes, awards XP, updates streak & weekly goal | M4 | Survey |
| 55 | Dual-Track Unit Test Suite (`tests/campus-redesign.test.ts`) | Unit tests for loadScore, conflicts, nlpParse, ics, XP/Streak | M5 | Survey |
| 56 | Full Verification Gate (`typecheck`, `build`, `test`) | Pass `npm run typecheck`, `npm run build`, and `npm test` with 0 errors | M5 | Survey |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Visual Core, Algorithmic Engines & Shared Persistent Store | Design tokens, Vibe themes, reduced motion, `src/lib/*` engines, unified store, global shortcuts | none | DONE (33 tests pass, build pass) |
| M2 | Dashboard S1–S7 Complete Rebuild | Hero Aurora, Today Timeline, Deadline Arena, AI Mascot, Game HUD, Squad Kanban, Marquee & Daily Wrapped | M1 | IN_PROGRESS |
| M3 | Calendar S1–S6 Complete Rebuild & Engine | Real system date, Month Poster Header, Smart Filters, Month Grid with Heat-Bar & DnD, Time-Grid 06:00-23:00, Agenda & Timeline, NLP & AI Scheduler, Day Drawer | M1 | PLANNED |
| M4 | Focus Mode Dual Engine & Store Integration | `StrictPomodoroModal` enhancement (Mèo Mập vs 4-7-8 Breathing + Lo-fi), store reward sync | M1, M2, M3 | PLANNED |
| M5 | Dual-Track Test Suite & Final Quality Gates | Unit tests in `tests/campus-redesign.test.ts`, Reviewers, Challengers, Forensic Auditor verification | M1, M2, M3, M4 | PLANNED |

---

## Interface Contracts

### 1. Unified Shared Store (`src/lib/campus-store.ts`)
```typescript
export interface CampusOSSharedState {
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
  dailyMood: 'sleepy' | 'neutral' | 'cool' | 'fire' | null;
  moodTimestamp?: string;
  vibeTheme: 'aurora' | 'y2k' | 'cyber' | 'pastel';
  reducedMotion: boolean;
  deadlines: DeadlineItem[];
  kanbanTasks: KanbanTask[];
  events: CalendarEvent[];
  aiCoachAccepted: boolean;
}

export function getSharedState(): CampusOSSharedState;
export function updateSharedState(updater: (prev: CampusOSSharedState) => Partial<CampusOSSharedState>): CampusOSSharedState;
export function useCampusStore(): { state: CampusOSSharedState; update: (updater: (prev: CampusOSSharedState) => Partial<CampusOSSharedState>) => void };
export function recordCompletedSession(minutes: number, disciplineScore: number): { xpGained: number; streakUpdated: boolean };
```

### 2. Calendar Mathematical & Algorithmic Engines
```typescript
// src/lib/calendar-math.ts
export function computeDailyLoadScore(events: CalendarEvent[], deadlines: DeadlineItem[]): { score: number; level: 'relaxed' | 'moderate' | 'overloaded'; color: string };
export function detectConflicts(events: CalendarEvent[]): Array<{ eventA: CalendarEvent; eventB: CalendarEvent; suggestedSlot?: { start: string; end: string } }>;

// src/lib/nlp-calendar.ts
export function parseVietnameseEventInput(input: string, referenceDate?: Date): { title: string; type: EventType; date: string; start: string; end: string; location?: string } | null;

// src/lib/ics-calendar.ts
export function exportToIcs(events: CalendarEvent[]): string;
export function parseFromIcs(icsContent: string): CalendarEvent[];

// src/lib/auto-scheduler.ts
export function generateSuggestedStudyBlocks(deadlines: DeadlineItem[], events: CalendarEvent[], referenceDate?: Date): CalendarEvent[];
```

---

## Code Layout
- `web/src/lib/`:
  - `campus-store.ts` (Unified reactive store & hook)
  - `gamification.ts` (XP, Level formulas, humorous rank titles, streak freezes)
  - `calendar-math.ts` (loadScore, conflict detection & auto-reschedule)
  - `nlp-calendar.ts` (Vietnamese natural language event parser)
  - `ics-calendar.ts` (.ics export and import parser)
  - `auto-scheduler.ts` (AI Auto-Scheduler greedy slot packing)
- `web/src/components/common/`:
  - `command-palette.tsx` (Global Cmd+K command bar)
  - `keyboard-shortcuts-modal.tsx` (Global ? cheat sheet)
  - `interactive-cursor.tsx` (Custom dot + expanding trailing ring)
- `web/src/components/dashboard/`:
  - `dashboard-hero.tsx` (S1)
  - `today-timeline.tsx` (S2)
  - `deadline-arena.tsx` (S3)
  - `ai-mascot-coach.tsx` (S4)
  - `game-hud-stats.tsx` (S5)
  - `squad-kanban-exam.tsx` (S6)
  - `marquee-daily-wrapped.tsx` (S7)
- `web/src/components/calendar/`:
  - `calendar-header.tsx` (S1)
  - `smart-filters.tsx` (S2)
  - `month-grid-view.tsx` (S3)
  - `time-grid-view.tsx` (S4)
  - `agenda-timeline-views.tsx` (S5)
  - `day-drawer-rail.tsx` (S6)
  - `nlp-quick-create-modal.tsx`
  - `ai-scheduler-modal.tsx`
- `web/src/features/pomodoro/`:
  - `strict-pomodoro-modal.tsx` (Mode A Mèo Mập vs Mode B Chill 4-7-8 Breathing)
  - `chill-breathing-stage.tsx` (Visual 4-7-8 breathing orb)
  - `lofi-synth.ts` (Procedural Web Audio lo-fi ambient pad)
- `web/tests/`:
  - `campus-redesign.test.ts` (Unit tests for loadScore, conflicts, nlpParse, ics, XP/Streak)
