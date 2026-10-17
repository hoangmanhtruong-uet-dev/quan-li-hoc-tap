# Original User Request

## 2026-10-12T13:35:15Z

Perform a comprehensive Full-Stack Frontend and Backend audit fix and feature upgrade for the Tarot Couple Next.js 15 application. Upgrade Clarifier and Couple Mode AI generators to use the 5-key `gemini-3.5-flash-lite` chain, add Serverless Supabase read-through fallback and a production `/api/health` diagnostics endpoint, and upgrade `/me/history` and `/admin/funnel` with search, personal reflection notes, accessible modals, and live health status.

Working directory: d:\MyProjects\MyProjectToMoney\TarotCouple
Integrity mode: development

## Requirements

### R1. Backend AI 5-Key Upgrade for Clarifier & Couple Mode
In `src/lib/ai-provider.ts`:
- Upgrade `generateClarifierReading` so that when valid Gemini API keys exist (`getValidGeminiApiKeys().length > 0`) and not running inside offline unit test environment (`!process.env.VITEST`), it calls the 5-key rotation chain (`['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3-flash-preview']`) to generate a personalized JSON response (`interpretation`, `advice`, `savageQuote`) for the 4th Clarifier card, falling back cleanly to the deterministic persona template if all keys fail.
- Upgrade `generateCoupleTarotReading` so that when valid Gemini API keys exist and `!process.env.VITEST`, it calls `generateTarotReading` with the 5-key rotation chain to produce live AI readings for Couple Mode (`solo_couple` and `coop_invite`), while attaching the deterministic `computeCoupleEntertainmentMetrics` (`compatibility_score`, `red_flag_level`, `vibe_tag`, `entertainment_note: 'Chỉ để giải trí'`) and preserving `usedFallback: false` when live AI succeeds.

### R2. Serverless Supabase Read-Through Fallback & Production Health Endpoint
- In `src/lib/supabase-hybrid.ts`: Add `checkSupabaseHealth()` (checking REST connectivity and whether the core tables `profiles`, `readings`, `couple_rooms` exist in the OpenAPI spec at `/rest/v1/`) and `fetchCoupleRoomFromSupabase(roomCode: string)` to retrieve a couple room from `public.couple_rooms` when not found in local memory.
- In `src/app/api/health/route.ts`: Create a `GET /api/health` endpoint returning `{ status: 'ok', timestamp, ai: { configuredKeysCount, primaryModel: 'gemini-3.5-flash-lite', modelChain }, supabase: { mode, connected, tablesReady, missingTables } }` without exposing any raw secret API keys.

### R3. Frontend Journal Upgrade (`/me/history`), Accessibility & Admin Health View
- In `src/lib/journal-store.ts`: Add optional `userNote?: string` and `updatedAt?: string` fields to `JournalEntry` and export `updateJournalNote(id: string, note: string): JournalEntry[]`.
- In `src/app/(app)/me/history/page.tsx`:
  - Replace all native `window.confirm()` calls with an accessible, themed inline confirmation modal matching `#13111E` and `#C9A24A`.
  - Add an instant search input allowing users to filter journal entries by question text, card names (Vietnamese or English), or personal notes.
  - Add a "Ghi chú chiêm nghiệm cá nhân" (`userNote`) editor inside the reading detail modal so users can write and save reflections on past readings.
  - Fix the non-standard `top-18` class to `top-20`, add `aria-label` to all icon-only buttons, and include `<CustomCursorFollower />`.
- In `src/app/(admin)/admin/funnel/page.tsx`: Fetch `/api/health` on mount and render a concise System & AI/Supabase Health status banner showing active Gemini keys count, model priority chain, and Supabase table readiness.

### R4. Verification & Git Hygiene
- Preserve all existing invariants: zero occurrences of `#D9B36A` in `src/app` and `src/components`, no `backdrop-blur` on reading cards, and `[0, 350, 700]` ms stagger in `rut-bai`.
- Add unit tests in `tests/golive_audit_verification.test.ts` verifying `GET /api/health`, `updateJournalNote`, and the absence of `window.confirm` in `src/app/(app)/me/history/page.tsx`.
- Never commit `.env.local`.

## Acceptance Criteria

### Type Safety, Unit Tests & Production Build
- [ ] `npx tsc --noEmit` exits with code 0
- [ ] `npx vitest run` passes all 26+ test suites with 0 failures
- [ ] `npm run build` succeeds across all routes with 0 errors
- [ ] Changes are committed and pushed to `origin/main`


## 2026-10-13T01:10:35Z

Rebuild the Tổng quan (`/dashboard`) and Lịch & kế hoạch (`/calendar`) pages of the CampusOS Next.js web application in the **Neo-Brutal Aurora** Gen Z design direction specified in `docs/CampusOS_Dashboard_Redesign_Plan.md` and `docs/CampusOS_Calendar_Redesign_Plan.md`. Deliver a cohesive, high-energy Vietnamese student companion experience that runs at 60–120FPS with zero GPU lag and integrates directly with the existing **Fat Orange Cat Supervisor (`StrictPomodoroModal`)**.

Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
Integrity mode: development

Reference specifications:
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\docs\CampusOS_Dashboard_Redesign_Plan.md
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\docs\CampusOS_Calendar_Redesign_Plan.md

## Requirements

### R1. "Neo-Brutal Aurora" Visual System, Zero-Lag 120FPS Rendering & Shared Global State
1. Implement the **Neo-Brutal Aurora** visual aesthetic across `/dashboard` and `/calendar` while keeping the existing app shell sidebar/header navigation intact:
   - Base background `#0A0A12` with slow-moving aurora blobs (`#7C5CFF`, `#FF3DA5`, `#3DE8FF`), 4% noise/grain overlay, and high-contrast neon accents (`#C6FF3D` acid lime, `#FF8A3D` sticker orange).
   - Expressive typography pairing display headings (`Unbounded` / `Space Grotesk`), Vietnamese-optimized body text (`Be Vietnam Pro`), and tabular monospace numerals (`JetBrains Mono`).
   - Alternating card treatments: (a) glass-surface with subtle gradient border, and (b) Neo-Brutal card with bright 2px border, 6px hard-offset accent shadow, 24–32px rounded corners, and ±1.5° rotated sticker badges.
   - Support the **Vibe Theme Switcher** (`Aurora`, `Y2K Chrome`, `Cyber Lime`, `Pastel Dreamy`), custom interactive cursor (dot + trailing ring that expands on interactive targets), and an explicit **Giảm hiệu ứng (Reduced Motion)** toggle that also respects `prefers-reduced-motion`.
2. **Zero-Lag 120FPS Performance Constraint**:
   - Use lightweight 1-draw-call Canvas2D/WebGL shaders and GPU-accelerated CSS transforms (`transform`, `opacity`) instead of heavy multi-pass WebGL postprocessing bloom or layout-thrashing full-screen backdrop blurs.
3. **Unified Shared Store & Global Shortcuts**:
   - Create a shared persistent state layer (`localStorage`-backed) synchronizing XP, Level, Vietnamese humorous rank titles (e.g., Level 7 `"Sinh viên cày thuê"`), Streak count + weekly Streak Freeze, daily Mood (`😴 😐 😎 🔥`), Vibe Theme, study minutes, tasks/deadlines, group Kanban tasks, and calendar events between `/dashboard` and `/calendar`.
   - Provide a global Command Palette (`Cmd/Ctrl+K`), keyboard shortcut overlay (`?`), quick task/event trigger (`N`), Focus Mode trigger (`F`), and Easter Eggs (Konami code / clicking logo 5 times).

### R2. Rebuild `/dashboard` (All 7 Sections + P0/P1/P2 Features)
Rebuild `src/app/(main)/dashboard/page.tsx` and modular dashboard components covering all 7 sections and P0/P1/P2 features from `docs/CampusOS_Dashboard_Redesign_Plan.md`:
1. **S1 – Hero "Vũ trụ học tập"**:
   - Staggered character/word reveal (`CHÀO BUỔI SÁNG, MINH.`) with animated gradient/glitch highlight, live date + summary subtitle, interactive zero-lag Aurora/3D blob reactive to pointer, streak, and deadline urgency, rotated `🔥 12` Streak sticker (bursts particles on click + Streak Freeze shield), **Mood Check-in** (`😴 😐 😎 🔥`) that dynamically adapts AI Coach tone/plan, **Voice Brain-Dump** mic button (Web Speech API / fallback prompt to parse spoken input into tasks), and magnetic CTAs (`+ Thêm nhiệm vụ`, `▶ Bắt đầu phiên học`).
2. **S2 – "Hôm nay" Horizontal Interactive Timeline**:
   - Drag/scroll horizontal class timeline with real-time "now" clock indicator, neon pulsing border + live progress bar on the currently active class, countdown on upcoming classes, and 3D tilt hover cards with quick actions (`Vào lớp`, `Mở tài liệu`, `Ghi chú nhanh`).
3. **S3 – Deadline Arena (Asymmetric Bento)**:
   - Highlight the most urgent deadline in a hero bento cell with a giant live `HH:MM:SS` countdown that shifts color (`lime → orange → red`) and enters panic shake mode when `< 3h`.
   - Support reordering deadlines, adding new deadlines, and clicking the completion circle to animate an SVG checkmark draw, trigger confetti, and float `+XP` upward.
4. **S4 – AI Coach "Squad" Mascot & Interactive Study Block**:
   - Animated mascot with cursor-tracking eyes, blinking, and mood-based expressions.
   - Typewriter chat suggestion for study blocks (e.g., 45-minute Subnetting review) with quick adjustment chips (`Dời xuống tối`, `Ngắn hơn 25p`, `Ôn kiểu flashcard`) and `Chấp nhận kế hoạch` (which inserts the study block directly into Today's timeline and Calendar) or `Bỏ qua`.
5. **S5 – Stats & Goal "Game HUD"**:
   - Weekly study goal ring (`8.5 / 12 giờ`, count-up animation, animated liquid/gradient ring), XP bar + Level progression + unlockable badges, 12-week GitHub-style study streak heatmap with hour tooltips on hover, and a neo-brutal warning sticker for "Môn cần chú ý" with an animated SVG grade sparkline.
6. **S6 – Squad & Upcoming Exams**:
   - 3-column interactive mini Kanban (`Đang làm`, `Chờ review`, `Xong`) with drag/move support, stacked member avatars, Squad Leaderboard (weekly study hours), and a `Nhắc bạn (Poke)` button with toast notification.
   - Concert-ticket style Upcoming Exam card with live countdown, 62% preparation progress bar, and an interactive `Tạo đề cương AI` modal/drawer.
7. **S7 – Marquee Footer & Daily Wrapped**:
   - Dual-direction infinite Gen Z quote marquee (`ĐỪNG ĐỂ DEADLINE DÍ ·`) and a `Chốt ngày hôm nay` button that opens a Spotify-Wrapped-style **Daily Wrapped** multi-slide story modal summarizing study hours, completed tasks, XP gained, and a shareable card preview.

### R3. Rebuild `/calendar` (Month Poster, Multi-View Time-Grid, NLP Quick-Create, AI Scheduler & Drawer)
Rebuild `src/app/(main)/calendar/page.tsx` and modular calendar components/utilities covering all sections and P0/P1/P2 features from `docs/CampusOS_Calendar_Redesign_Plan.md`:
1. **Real System Date & Seed Alignment**:
   - Anchor "Hôm nay" (`todayKey`) to the actual current system date so the current month and week always open on the user's real date, automatically generating realistic relative dates for default classes, study blocks, club workshops, and exams around the current week/month.
2. **S1 – "Month Poster" Header & S2 – Smart Filters**:
   - Giant poster month heading with airport-board flip/slide transition on month change, lightweight 1-draw-call interactive dot-grid background reactive to cursor, `‹ ›` navigation (`←/→`), `Hôm nay` (`T`), sliding-pill view switcher (`Tháng · Tuần · Ngày · Agenda · Timeline`), magnetic `+ Thêm sự kiện` (`N`), and `✨ Hỏi AI xếp lịch`.
   - 3 tilted stat stickers (`Sự kiện trong tháng`, `Deadline & bài thi` with `<48h` red ping, `Streak 🔥`).
   - 5 neon event-type filter chips (`Lớp học #4D7CFF`, `Tự học #8B6CFF`, `Thi/Deadline #FF3D6E`, `CLB/Nhóm #FFB020`, `Cá nhân #3DFFB0`) with live counts, smooth layout filtering, `Alt+click` solo mode, search input (`/`), `Ẩn cuối tuần`, `Hiện giờ trống`, and **Squad View (Lịch nhóm)** toggle to overlay teammates' busy/free slots.
3. **S3 – Month Grid**:
   - Day cards with hover lift + dominant-type glow, bottom **Load Heat-Bar** (`green → orange → red` computed from total hours + deadlines), flame ping on deadline days, and neon pulse on Today.
   - Up to 3 event sticker pills per day with **full-details hover tooltip** (never losing title/time/location to truncation) and a `+N` button that fans out remaining event stickers in a popover.
   - Drag-and-drop rescheduling of events across days with target highlight, bounce animation, and an **Undo (`Hoàn tác`) toast**.
   - Double-click on any day cell (or click Quick-Create) to open a **Natural Language Quick-Create** popover (e.g., `"ôn xác suất 19h thứ 6 tại thư viện"` -> automatically parses title, type, date, start/end time, and location, with full form fallback).
4. **S4 – Week & Day Time-Grid View (06:00–23:00)**:
   - Sticky day headers, real-time pulsing "now" line, 15-minute snap drag-to-move and edge-resize to change duration, and click/drag on empty slots to create events.
   - **Free-Slot Finder**: Hatched empty study windows with a `+ Học ở đây` button (opens Focus Mode / schedules a study block) and AI-recommended golden slots.
   - **Conflict Detection**: Automatically highlight overlapping events with a pulsing red warning border and a one-click `Tự động dời giờ trống` suggestion.
5. **S5 – Agenda, Semester Timeline & AI Auto-Scheduler ("Xếp lịch giúp tao")**:
   - **Agenda View**: Grouped by day with sticky headers and staggered reveal.
   - **Semester Timeline View**: Horizontal milestone roadmap highlighting major exams and project deadlines by importance; clicking a milestone zooms into that week.
   - **AI "Xếp lịch giúp tao" Modal**: Generates proposed study blocks in free slots before upcoming exams/deadlines, allowing the user to accept/reject individual blocks or accept all.
   - **Import / Export `.ics` & Recurrence**: Support exporting the schedule to `.ics`, importing `.ics` files, and weekly recurring events.
6. **S6 – Slide-Over Selected Day Drawer & Upcoming Rail**:
   - Slide-over drawer (right panel on desktop, bottom sheet on mobile) showing ticket-style events for the selected day, sub-checklists, SVG checkmark completion with confetti + `+XP`, and quick actions (`Vào học`, `Mở tài liệu`, `Ghi chú`).
   - Persistent `Sắp tới` rail showing the next 5 upcoming events with live mini countdowns.

### R4. Focus Mode Integration with Fat Orange Cat Supervisor (`StrictPomodoroModal`)
- Clicking `▶ Bắt đầu phiên học` on `/dashboard`, pressing `F`, or clicking `+ Học ở đây` / `Vào học` on `/calendar` must open the Focus experience powered by our **Fat Orange Cat Supervisor (`StrictPomodoroModal`)**, enhanced with an in-modal mode switch so the user can choose between:
  1. **Mèo Mập Giám Thị Cực Đoan** (the cutout Fat Orange Cat + `0:52` grey countdown + Northern Vietnamese TTS scolding + PiP window), and
  2. **Chill Breathing 4-7-8 + Lo-fi Mode** (calm breathing orb guiding 4s inhale – 7s hold – 8s exhale with procedural Web Audio lo-fi ambient synth).
- Completing a session automatically awards study minutes, `+XP`, and updates the Streak & Weekly Goal Ring across both `/dashboard` and `/calendar`.

## Verification Resources

- Existing test runner: `npm test` in `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web` (uses `node --experimental-strip-types --test tests/*.test.ts`).
- Existing Pomodoro supervisor modal: `src/features/pomodoro/strict-pomodoro-modal.tsx` and `src/features/pomodoro/meme-cat-stage.tsx`.

## Acceptance Criteria

### Programmatic Build & Type Safety
- [ ] `npm run typecheck` in `web/` passes with 0 TypeScript errors.
- [ ] `npm run build` in `web/` succeeds cleanly with 0 build or lint errors.
- [ ] `npm test` in `web/` passes all existing tests plus new unit tests covering:
  - Calendar load heat-score calculation (`loadScore`).
  - Schedule conflict detection & resolution suggestion (`conflicts`).
  - Natural language Vietnamese event parsing (`nlpParse`, e.g., `"ôn xác suất 19h thứ 6"`).
  - `.ics` calendar serialization/parsing (`ics`).
  - Shared XP/Level/Streak calculation logic.

### Functional & Visual Completeness
- [ ] `/dashboard` renders all 7 Neo-Brutal Aurora sections (Hero with Aurora/3D blob & Mood check-in, Horizontal Today Timeline, Asymmetric Deadline Arena with live `HH:MM:SS` countdown & SVG check + XP, AI Coach Mascot with typewriter & plan insertion, Game HUD with Goal Ring + XP bar + 12-week Heatmap + Sparkline warning sticker, 3-column Squad Kanban + Concert-Ticket Exam card, and Dual Marquee Footer + Daily Wrapped modal).
- [ ] `/calendar` defaults "Hôm nay" to the real system date and renders the Month Poster Header with 1-draw-call interactive dot-grid, 5-view switcher (`Tháng · Tuần · Ngày · Agenda · Timeline`), 5 filter chips with `Alt+click` solo mode, Month Grid with Load Heat-Bar + full tooltips + `+N` fan popover + drag-and-drop with Undo toast, Week/Day Time-Grid (`06:00–23:00`) with real-time "now" line + conflict detection + Free-Slot `+ Học ở đây`, NLP Quick-Create, AI Auto-Scheduler (`Xếp lịch giúp tao`), `.ics` import/export, and Slide-Over Day Drawer.
- [ ] Focus Mode on both `/dashboard` and `/calendar` launches `StrictPomodoroModal` (with both Fat Orange Cat Supervisor mode and 4-7-8 Breathing + Lo-fi mode) and syncs completed minutes & XP to the shared store.


## 2026-10-13T07:48:15Z

Rebuild the Nhiệm vụ (`/tasks`) page of the CampusOS Next.js web application following the **Neo-Brutal Aurora (Gen Z, 120FPS zero-lag)** art direction specified in `docs/CampusOS_Tasks_Redesign_Plan.md`. Synchronize with the existing shared store (`campus-store.ts`), Focus Mode (`StrictPomodoroModal`), Calendar, and Dashboard gamification. Implement full P0 and P1 scope.

Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
Integrity mode: development

Reference specification:
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\docs\CampusOS_Tasks_Redesign_Plan.md

## Architectural Decisions from /grill-me
1. **3D Engine**: Lightweight vanilla Three.js (`three` is already installed) with instanced mesh ~40 drifting cubes/stars; lazy-loaded with Canvas2D/static fallback on mobile and `prefers-reduced-motion`. Do not add heavy external wrapper packages.
2. **Data & State**: Unified reactive persistence directly in `campus-store.ts`. Sync tasks, deadlines, and completed sessions seamlessly across `/dashboard`, `/calendar`, and `/tasks` with debounced background sync to Supabase Cloud and offline-first fallback.
3. **Scope**: Full implementation of P0 and P1 (Header Quest Board with Three.js, Smart Controls Bar, 4 Views: List with sticky date grouping, 3-column Kanban, Eisenhower 2x2 Matrix, Today Plan; Intelligent Detail Drawer; NLP Vietnamese QuickAdd; AI Task Breakdown heuristic; Focus Mode integration).
4. **Layout & Overflow**: Strict single-viewport containment without horizontal scrollbars (`overflow-x-hidden`, `min-w-0`, `minmax(0,...)` on all grid columns).
5. **Human-in-the-loop Directive**: If any unforeseen design or technical roadblock occurs, do not guess — ask the user directly.

## Requirements

### R1. "Quest Board" Header with Vanilla Three.js Floating Blocks
1. Header height bounded (<= 28vh), large title `NHIỆM VỤ.` with character reveal, dynamic subtitle reactive to remaining task count (e.g. "Còn 3 việc, cân được 💪").
2. Lightweight Three.js instanced mesh canvas (~40 floating cubes/stars drifting slowly, pointer-reactive; completing a task bursts a cube upward into particles; disabled on mobile and `prefers-reduced-motion`).
3. Magnetic buttons: `+ Thêm nhiệm vụ` (signature green/lime accent), `✨ AI chia nhỏ việc`, `▶ Focus ngay` (launches Focus Mode with the most urgent deadline task).
4. 4 asymmetric tilted stat sticker badges:
   - Tổng nhiệm vụ
   - Đang thực hiện
   - Ưu tiên cao (pulsing red dot if overdue tasks exist)
   - Hoàn thành: SVG circular progress ring drawing liquid fill (reaches 100% -> mini confetti burst).

### R2. Smart Controls Bar & Multi-View Switcher
1. Sliding pill view switcher: `Danh sách · Kanban · Ma trận · Hôm nay`.
2. Full-width search input with shortcut `/`, status filter chips with live counts, priority filter chips (`Cao #FF3D6E`, `Vừa #FFB020`, `Thấp #3DE8FF`), custom sort menu (By due date, priority, course, newly created, AI suggested).
3. Floating Bulk Action Bar appearing when multiple tasks are selected (Complete, Change Priority, Postpone, Delete with Undo toast).

### R3. 4 Functional Views (List, Kanban, Eisenhower Matrix, Today Plan)
1. **List View (Default)**:
   - Sticky grouped headers: `Quá hạn · Hôm nay · Ngày mai · Tuần này · Sau đó · Đã xong` with counts and collapse toggles.
   - Task ticket stickers with prominent SVG draw checkmark, strikethrough, mini confetti, `+XP` float-up, move to completed group.
   - Dynamic countdown timer changing color (`lime -> orange -> red`, gentle panic pulse when < 3h), course badge, step progress segment bar.
   - HTML5 / dnd drag-and-drop reordering with Undo toast.
2. **Kanban View**:
   - 3 columns: `Cần làm · Đang làm · Hoàn thành`. Drag-and-drop between columns. Dropping into "Hoàn thành" triggers completion + XP award.
   - WIP warning when "Đang làm" > 3 items. Tilted sticker column headers.
3. **Eisenhower Matrix View**:
   - 2x2 grid: `Làm ngay` (Urgent & Important - pulsing neon border), `Lên lịch` (Not Urgent & Important), `Giao/Dời` (Urgent & Not Important), `Bỏ bớt` (Not Urgent & Not Important).
   - Drag-and-drop between quadrants, AI placement suggestion based on due date + priority.
4. **Today Plan View**:
   - AI curated list of up to ~5 top priority tasks fitting available free time today, capacity bar (total task minutes vs free study time).
   - Button `Chấp nhận kế hoạch` to schedule blocks into calendar.

### R4. Intelligent Detail Drawer (Right Slide-over / Mobile Bottom Sheet)
1. When no task is selected: Never show empty void — display "Việc tiếp theo nên làm" (most urgent task with giant countdown + `▶ Bắt đầu` button), weekly mini-heatmap, and AI study tips.
2. When task is selected:
   - In-place title & description editing, subject tag, date picker, priority chips, difficulty rating (1-5 stars).
   - Subtasks checklist with drag-to-reorder, step completion toggling, progress bar.
   - Mini Pomodoro integration: session target counter, `▶ Focus` button triggering `StrictPomodoroModal`.
   - Notes, attachments, activity log.

### R5. Natural Language Task Creation (NLP QuickAdd) & AI Task Breakdown
1. Natural language Vietnamese parsing for quick input (e.g. "nộp bài tập mạng 23h ngày mai 90p ưu tiên cao" -> extracts title, due date, estimate minutes, priority, course).
2. AI Task Breakdown modal: paste assignment description -> generates checklist subtasks and estimated minutes.

### R6. Focus Mode & Gamification Store Synchronization
1. Ticking tasks complete or completing focus sessions immediately awards `+XP`, updates streak, level, rank title in `campus-store.ts`, and syncs debounced to Supabase Cloud.
2. Global keyboard shortcuts: `N` (new task), `/` (search), `1/2/3/4` (switch views), `J/K` (navigate), `X` (tick complete), `E` (edit), `F` (focus mode), `Del` (delete with undo), `?` (shortcuts modal), `Cmd/Ctrl+K` (command palette).
3. 120FPS zero-lag, no horizontal overflow (bounded viewport, `overflow-x-hidden`, `min-w-0`), reduced-motion support.

## Acceptance Criteria

### Programmatic Build & Verification
- [ ] `npm run typecheck` in `web/` passes with 0 TypeScript errors.
- [ ] `npm test` in `web/` passes all existing 33 tests + new tests covering tasks NLP parsing, Eisenhower quadrant calculation, and task date grouping logic.
- [ ] `npm run build` in `web/` compiles cleanly with exit code 0.

### Functional & Visual Completeness
- [ ] `/tasks` renders Quest Board Header with Three.js floating cubes, live countdown stats, and animated circular completion ring.
- [ ] 4 Views functional: List (sticky date groups, countdowns, SVG checkmark), Kanban (3 columns, drag-drop, WIP alert), Eisenhower Matrix (2x2 grid, neon urgent quadrant), Today Plan (curated ~5 tasks, capacity bar).
- [ ] Right detail drawer displays "Việc tiếp theo" when unselected, and full editing + subtask checklist + Pomodoro button when selected.
- [ ] QuickAdd NLP parses Vietnamese strings into tasks.
- [ ] Completing tasks awards XP to `campus-store.ts` and syncs with Supabase.
- [ ] Zero horizontal scrollbar across viewport resolutions.


## 2026-10-13T12:48:34Z

Rebuild and upgrade the "Tạo nhiệm vụ nhanh" (Quick Task) modal of CampusOS from a basic input form into a high-energy, Gen Z, 120FPS "wow" experience with natural language Vietnamese parsing, dynamic interactive chips, 4 priority tiers, Three.js 3D particle background, and seamless synchronization with Deadline Arena and Tasks.

Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
Integrity mode: development

## Requirements

### R1. Natural Language Vietnamese Parsing & Interactive Chips
- As the user types in the quick task input (e.g. "Nộp bài tập lớn Mạng máy tính lúc 23h thứ 6", "ôn thi Giải tích thứ 6 tuần sau 90p", "làm slide Triết ngày mai"), automatically extract:
  - Task title (stripped of date/time/course keywords)
  - Date (e.g. "hôm nay", "mai", "mốt", "thứ X", "cuối tuần", "tuần sau", explicit DD/MM)
  - Time (e.g. "23h", "11 giờ đêm", "14h30", "8h sáng", "cuối ngày")
  - Course / Subject matching user's courses or CampusOS catalog (e.g. "Mạng máy tính", "Toán rời rạc", "Triết học", "CTDL & GT")
  - Estimated duration (if mentioned, e.g. "90p", "2 tiếng")
- Render recognized attributes as live, interactive chips below the input (`📅 Thứ 6, 17/10`, `⏰ 23:00`, `📚 Mạng máy tính`). Clicking a chip opens a lightweight quick editor / selector to adjust manually.
- Fallback gracefully when input has no date/time: does not block task creation; defaults to "Hôm nay 23:59".
- Quick suggestion chips: "Hôm nay 23h", "Ngày mai", "Cuối tuần", "Tuần sau" for 1-click date autofill.

### R2. 4 Priority Tiers with Visual & Three.js Reaction
- Support 4 distinct priority levels:
  - **Thấp** (`#3DE8FF` Cyan - calm)
  - **Vừa** (`#FFB020` Amber - warm)
  - **Gấp** (`#FF8A3D` Orange - energetic)
  - **Siêu gấp** (`#FF3D6E` Neon Red/Pink - pulsing glow + subtle shake)
- Selecting a priority changes the modal border glow, caret/accent color, and alters the 3D particle color theme. "Siêu gấp" triggers amber/red particles and mild geometric jitter.

### R3. 120FPS Vanilla Three.js 3D Backdrop & Particle FX
- Lightweight Canvas WebGL layer placed between the backdrop blur and the modal card:
  - Drifting particles (neon lime / purple / cyan) with subtle pointer parallax reaction.
  - Interactive 3D decorative geometry (e.g. wireframe icosahedron / 3D lightning bolt) slowly rotating in the corner, tilting with mouse position.
  - Reactive typing effect: typing causes particles to pulse with brightness proportional to input activity.
  - Success creation effect: on task submit, 3D object bursts into particles/confetti that stream toward the Deadline Arena container, modal scales down smoothly, and the newly created card in Deadline Arena flashes with a highlight border.
  - Resource cleanup: `requestAnimationFrame` cancellation, geometry/material/renderer disposal on modal close, bounded DPR <= 2, tab visibility throttling.
  - Reduced-motion & mobile fallback: hides WebGL canvas cleanly, keeps CSS fade/scale only.

### R4. Ergonomics, Keyboard Mastery & State Synchronization
- Global hotkeys: `N` or `Ctrl/Cmd+K` opens modal. `Enter` submits task. `Escape` closes modal. `Ctrl+Enter` submits task and keeps modal open for continuous rapid entry.
- Visual button states: disabled when input is empty, neon lime glowing button when input is ready with keyboard badge hint `[Enter]`.
- Gamification & Store Sync:
  - Syncs to both `state.deadlines` (appearing immediately in Deadline Arena on `/dashboard`) and `state.tasks` (appearing in `/tasks`).
  - Awards `+10 XP` with floating animation.
  - Triggers 5-second undo toast: "Đã thêm vào Deadline Arena · Hoàn tác". Clicking undo reverts both deadline and task.
- Accessibility: `role="dialog"`, `aria-modal="true"`, focus trap, auto-focus input on open, return focus on close.

## Acceptance Criteria

### Programmatic Build & Verification
- [ ] `npm run typecheck` in `web/` passes with 0 TypeScript errors.
- [ ] `npm test` in `web/` passes all existing 109 tests + new unit tests for the quick task modal NLP enhancements and store sync.
- [ ] `npm run build` compiles cleanly with exit code 0.

### Functional & Visual Completeness
- [ ] Typing natural Vietnamese text extracts date, time, and subject into interactive chips below the input in real-time.
- [ ] 4 priority tiers selectable with distinct visual styles and 3D reaction on "Siêu gấp".
- [ ] Vanilla Three.js canvas renders smooth 3D particles & geometry, disposes all WebGL resources on unmount, and disables on `prefers-reduced-motion`.
- [ ] Keyboard navigation (`Enter`, `Ctrl+Enter`, `Esc`, `N`) operates smoothly without mouse requirement.
- [ ] Created task immediately appears in Deadline Arena on `/dashboard` and awards +10 XP with undo toast support.
- [ ] Responsive design: centered modal on desktop, swipeable bottom sheet on mobile, zero horizontal overflow.


## 2026-10-13T17:18:44Z

Nâng cấp nhân vật Mèo Leo (Three.js) trên màn hình Pomodoro CampusOS đạt chuẩn hoạt hình 3D toon cao cấp phong cách Disney/Pixar: Tích hợp nguyên lý hoạt họa Squash & Stretch, vật lý thứ cấp lò xo (jiggle spring) cho tai/má/bụng, hệ thống ánh sáng studio 3-point toon lighting kèm viền sáng rim-light và bóng tiếp xúc mềm (soft contact shadow), hiệu ứng hạt VFX (thả tim, tia cáu, sao lấp lánh), và cơ chế tương tác đa dạng (kéo xoay nhẹ 3D có độ đàn hồi hồi vị, xoa đầu lim dim purr, chọc bụng nảy lò xo, các động tác tự nhiên ngẫu nhiên khi rảnh).

Working directory: d:/MyProjects/MyProjectToMoney/Web-quan-li-hoc-tap/web
Integrity mode: development

## Requirements

### R1. Hoạt ảnh Sinh động & Vật lý Thứ cấp (Secondary Motion & Squash/Stretch)
- Áp dụng nguyên lý Squash & Stretch bảo toàn thể tích (Scale_Y * Scale_X * Scale_Z ≈ 1) cho nhịp thở, cú giật mình khi click và khi tiếp đất.
- Tích hợp dao động lò xo suy giảm (damped spring / harmonic oscillator) cho má, bụng, chóp tai và râu để tạo độ nảy mềm mại tự nhiên khi chuyển động.
- Nâng cấp cử động đuôi 6 đốt với độ trễ quán tính hình sin nhiều bậc (multi-frequency wave propagation), vẫy đuôi mượt mà không cứng đơ.
- Mắt đảo tự nhiên với cử động giật vi mô (micro-saccades), chớp mắt phong phú theo cảm xúc (nhắm tịt hưởng thụ, nheo mắt hoài nghi, trợn to cáu kỉnh).

### R2. Ánh sáng Studio Toon 3D & Hệ thống Hiệu ứng Thị giác (VFX)
- Bổ sung hệ thống chiếu sáng 3 điểm (Key light ấm, Fill light mát dịu, Backlight / Rim light) tạo đường viền sáng nổi bật tách biệt khỏi nền tối.
- Thiết lập bóng tiếp xúc nền (soft contact shadow blob) co giãn đường kính và độ mờ tương ứng theo độ cao Y của mèo khi nảy người.
- Hệ thống hạt VFX nhẹ nhàng trên nền WebGL (Three.js Points / Sprites):
  - Hạt tim hồng bay lơ lửng khi xoa đầu hoặc được khen.
  - Tia cáu / mồ hôi hoạt hình khi bị chọc tức hoặc mắng nghiêm khắc.
  - Sao lấp lánh khi hoàn thành phiên tập trung.
- Bảo đảm 100% nền trong suốt (alpha: true), không viền răng cưa, tối ưu dispose tài nguyên.

### R3. Tương tác Phản hồi Chuột (Interactive Physics & Controls)
- Cho phép người dùng kéo nhẹ chuột để xoay góc nhìn mèo 3D (giới hạn góc quay ±25° trục Y, ±12° trục X) với cơ chế tự đàn hồi mượt mà về vị trí ban đầu khi buông chuột.
- Tương tác xoa đầu (cursor petting): Mèo hạ tai, nhắm mắt lim dim, thân rung nhẹ mô phỏng tiếng grừ grừ (purr vibration) và phát ra hạt tim VFX.
- Tương tác chọc bụng: Thân mèo nảy bật lò xo (recoil bounce), vẫy tai cáu kỉnh và kêu quạo.
- Trạng thái rảnh rỗi tự nhiên (Idle behaviors): Khi người dùng không tương tác lâu, mèo thực hiện ngẫu nhiên cử động phụ (ngáp vươn vai, gãi tai, liếm mu bàn chân).

### R4. Khẩu hình & Biểu cảm Đồng bộ (Lip-Sync & Emotion Blend)
- Khẩu hình mở cằm (jaw) và rung lưỡi mượt mà theo biên độ giọng nói Web Audio TTS, có độ trễ mở/đóng tự nhiên (không giật cục nhị phân 0-1).
- Biểu cảm lông mày, mí mắt và tai biến đổi nhịp nhàng đồng bộ với lời thoại và tính cách được chọn.

## Acceptance Criteria

### 1. Build & Compilation
- [ ] Lệnh npm run typecheck thành công không có lỗi TypeScript.
- [ ] Không gây lỗi biên dịch Webpack hay hydration mismatch trên Next.js App Router.

### 2. Animation & Visual Quality
- [ ] Chuyển động thở và nảy người của mèo có hiệu ứng Squash & Stretch rõ ràng và mềm mại.
- [ ] Tai, má và bụng có độ rung lò xo (jiggle dynamics) rõ nét khi di chuyển hoặc tương tác.
- [ ] Ánh sáng và bóng đổ tiếp xúc co giãn mượt mà theo chuyển động nảy của thân mèo.
- [ ] Hiệu ứng hạt VFX (thả tim, cáu, sao) kích hoạt đúng tương tác và tự giải phóng bộ nhớ.

### 3. Interaction & Reliability
- [ ] Kéo chuột xoay nhẹ mèo 3D mượt mà và tự hồi vị êm ái khi thả tay.
- [ ] Click chọc bụng và rê chuột xoa đầu phản hồi tức thì với biểu cảm tương ứng.
- [ ] Giữ nguyên tính năng Pomodoro, nền trong suốt 100%, và bộ test node --test tests/pomodoro-leo.test.ts pass 100%.


## 2026-10-16T17:39:47Z

Tiếp tục triển khai rebuild toàn diện các phân hệ còn lại của nền tảng CampusOS theo chuẩn thiết kế Cyber-Glass cao cấp (Frosted Glassmorphism, 1px Neon Border, Fluid Ambient Aurora), đồ họa 3D Three.js 120FPS, logic nghiệp vụ chuyên sâu và đáp ứng 100% Quality Gates (npm run typecheck 0 lỗi, npm test pass 100%, npm run build pass).

Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
Integrity mode: development

## Requirements

### R1. Nhóm học tập & Đồ án (`/workspaces`, `/workspaces/[workspaceId]`)
- Rebuild giao diện Cyber-Glass cho trang danh sách Workspace và chi tiết Workspace.
- Hỗ trợ phân quyền thành viên chặt chẽ (OWNER, ADMIN, MANAGER, MEMBER, VIEWER).
- Bảng Kanban nhiệm vụ nhóm đồ án, tài liệu chia sẻ, và nhật ký hoạt động thời gian thực.

### R2. Câu lạc bộ sinh viên (`/clubs`, `/clubs/[id]`, và các trang con)
- Rebuild `/clubs`, `/clubs/[id]`, `/clubs/[id]/events`, `/clubs/[id]/finance`, `/clubs/[id]/members`, `/clubs/[id]/tasks`.
- Quản lý sự kiện CLB, thu chi quỹ câu lạc bộ, phân bổ nhiệm vụ ban sự kiện.

### R3. Hồ sơ, Thông báo & Cài đặt (`/profile`, `/notifications`, `/settings`)
- Rebuild `/profile`: Thẻ sinh viên Cyber-Glass holographic, radar năng lực tổng hợp, thống kê tín chỉ và danh hiệu đạt được.
- Rebuild `/notifications`: Trung tâm thông báo chia tab (Tất cả, Deadline, CLB, Học vụ), đánh dấu đã đọc và xóa thông báo.
- Rebuild `/settings`: Trung tâm cài đặt hệ thống (Giao diện dark mode, thông báo đẩy, bảo mật tài khoản, đồng bộ lịch Google Calendar).

## Acceptance Criteria

### Code Quality & Quality Gates
- [ ] npm run typecheck hoàn thành với 0 lỗi (TypeScript 5.5).
- [ ] npm test vượt qua 100% các bài unit test hiện có.
- [ ] npm run build biên dịch thành công toàn bộ static pages mà không có bất kỳ lỗi SSR hay ESLint unescaped entities nào.
- [ ] Thiết kế Cyber-Glass đồng bộ với toàn hệ thống: viền neon 1px (border-white/10, border-cyan-400/30), nền mờ thủy tinh (backdrop-blur-2xl bg-card/40), không vỡ layout, không tràn chiều ngang (overflow-x-hidden).


## 2026-10-16T20:25:22Z

Hợp nhất toàn bộ Backend của CampusOS sang hệ sinh thái Supabase (PostgreSQL, Supabase Auth, Row Level Security, Realtime WebSockets, Supabase Storage) theo mô hình Offline-First with Optimistic Sync.

Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
Integrity mode: development

## Requirements

### R1. Schema Migrations & Row Level Security (`supabase/migrations/`)
- Tạo migration PostgreSQL hoàn chỉnh (`003_complete_campusos_schema.sql`) bao gồm các thực thể:
  - `profiles`: Hồ sơ sinh viên liên kết `auth.users(id)`, điểm XP, level, rank title, streak, vibe theme.
  - `tasks`: Nhiệm vụ học tập, ma trận Eisenhower (Q1-Q4), subtasks JSONB, attachments JSONB.
  - `courses` & `course_syllabus`: Môn học, giảng viên, tín chỉ, thành phần điểm số, giáo trình từng tuần và tài liệu PDF.
  - `workspaces`, `workspace_members`, `workspace_kanban_tasks`, `workspace_documents`: Quản lý nhóm đồ án phân quyền RBAC.
  - `clubs`, `club_events`, `club_finances`: Phân hệ CLB sinh viên.
  - `dorm_spaces`, `dorm_chores`, `dorm_expenses`: Không gian sống KTX và chia tiền quỹ.
  - `student_notifications`: Trung tâm thông báo học vụ & deadline.
- Thiết lập đầy đủ RLS Policies cho tất cả các bảng: người dùng chỉ đọc/ghi dữ liệu của chính mình (`auth.uid() = user_id`), các bảng nhóm (`workspaces`, `clubs`, `dorm_spaces`) tuân thủ quan hệ thành viên/phân quyền.

### R2. Storage Buckets cho Tài liệu & Slide Bài giảng PDF
- Thiết lập 3 Supabase Storage Buckets với policies công khai/riêng tư phù hợp:
  - `academic-materials`: Lưu slide bài giảng PDF từng tuần của môn học.
  - `task-attachments`: Lưu tệp đính kèm nhiệm vụ học tập.
  - `student-avatars`: Lưu ảnh thẻ sinh viên holographic.
- Nâng cấp `storage-engine.ts` để upload file thật lên Supabase Storage với fallback offline.

### R3. Offline-First Optimistic Sync Engine & Realtime WebSockets
- Mở rộng `src/lib/supabase-sync.ts` thành **CampusOS Sync Engine**:
  - Tải nhanh 0ms từ cache/localStorage khi mở trang.
  - Tự động đồng bộ ngầm 2 chiều khi có mạng (Optimistic updates).
  - Lắng nghe realtime qua kênh `supabase.channel('campusos-realtime')` cho `tasks`, `notifications`, `workspaces`.
  - Fallback an toàn khi chưa cấu hình Supabase Cloud hoặc đang offline (không gây gián đoạn hay crash).

### R4. Hợp nhất Supabase Auth & Cập nhật API / Middleware
- Chuyển đổi xác thực đăng nhập, đăng ký, đăng xuất, quên mật khẩu sang Supabase Auth.
- Cập nhật middleware bảo vệ route và tự động khởi tạo hồ sơ sinh viên mới.
- Loại bỏ sự phụ thuộc MySQL cũ, đảm bảo thống nhất 100% stack Supabase Postgres.

## Acceptance Criteria

### Code Quality & Quality Gates
- [ ] `npm run typecheck` hoàn thành với 0 lỗi TypeScript trên toàn bộ codebase.
- [ ] `npm test` vượt qua 100% các bài test (339+ tests) và các test case mới cho Sync Engine.
- [ ] `npm run build` biên dịch thành công 100% các route (34+ static & dynamic routes).
- [ ] Tích hợp mượt mà với UI Cyber-Glass hiện tại, không gây vỡ giao diện hay lỗi SSR hydration.


## 2026-10-17T00:51:59Z

Xây dựng và kết nối hoàn chỉnh Chrome Extension Manifest V3 "AI Giám Sát Học Tập Cực Đoan" với Web App CampusOS và Supabase Cloud theo cơ chế phát hiện kép (URL Tab Blacklist & AI Webcam Face Tracking).

Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap
Integrity mode: development

## Requirements

### R1. Cấu hình Manifest V3 & Kiến trúc Service Worker (`extension/`)
- Hoàn thiện `extension/manifest.json` chuẩn Manifest V3:
  - Permissions: `tabs`, `storage`, `activeTab`, `scripting`, `declarativeNetRequest`.
  - Cấu hình `externally_connectable` cho phép trao đổi message hai chiều an toàn với Web App (`http://localhost:3000/*` và domain production).
  - Background Service Worker (`extension/background.js`): Quản lý trạng thái phiên học (`idle`, `focusing`, `break`), danh sách Blacklist domains, lắng nghe sự kiện `tabs.onActivated` và `tabs.onUpdated`.

### R2. Giao diện Cyber-Glass Lockout HUD & Âm thanh Mắng Chửi (`extension/content.js`)
- Xây dựng Content Script chèn DOM Modal phong cách Cyber-Glass trên các trang vi phạm:
  - Làm mờ đen trang web vi phạm (`backdrop-filter: blur(25px)`, `pointer-events: none`).
  - Hiển thị nhân vật giám sát (Mèo Cam Cutout / Tom 3D) phóng to toàn màn hình với hiệu ứng rung lắc (screen shake).
  - Tích hợp giọng đọc mắng chửi bằng giọng Neural TTS tiếng Việt.
  - Hiển thị thanh đếm ngược 5 giây cưỡng chế đóng tab vi phạm và chuyển tiêu điểm về tab CampusOS.
  - Cơ chế ân hạn: Cung cấp nút *"Tôi đang tra tài liệu"* (tối đa 1 lần / 3 phút mỗi phiên Pomodoro).

### R3. Tùy chọn AI Webcam Face Tracking (Phát hiện quay mặt / ngủ gục)
- Tích hợp module theo dõi khuôn mặt nhẹ bằng Web Worker / MediaPipe Face Mesh:
  - Người dùng có thể bật/tắt trong cài đặt Pomodoro Web App hoặc Extension Popup.
  - Phân tích góc quay đầu (Head Pose) và tỷ lệ mở mắt (Eye Aspect Ratio): Nếu quay mặt đi quá 10 giây hoặc gục xuống bàn ngủ -> phát cảnh báo và kích hoạt Mèo Cam nhắc nhở.

### R4. Cầu nối Đồng bộ Trạng thái & Phạt XP với Web App & Supabase
- Kết nối hai chiều giữa Web App và Extension:
  - Khi bấm "Bắt đầu Focus" trên Web: Gửi tín hiệu kích hoạt giám sát sang Extension.
  - Khi Extension phát hiện vi phạm: Trừ ngay **-50 XP**, tăng số lần vi phạm `violation_count`, và ghi nhận trực tiếp vào bảng `student_focus_sessions` và `profiles` trên Supabase Cloud.
- Phát triển giao diện Extension Popup (`extension/popup/`):
  - Đồng hồ đếm ngược Pomodoro thời gian thực đồng bộ với Web App.
  - Danh sách Blacklist domains có thể tùy chỉnh thêm/bớt.

## Acceptance Criteria

### Verification & Quality Gates
- [ ] Thư mục `extension/` tải thành công trên Chrome/Edge (`chrome://extensions` ở Developer Mode) mà không phát sinh bất kỳ lỗi cú pháp Manifest nào.
- [ ] Mở tab giải trí (Facebook, YouTube, TikTok...) trong lúc Pomodoro đang chạy: Lockout HUD kích hoạt trong vòng dưới 200ms, phát âm thanh và đếm ngược đóng tab.
- [ ] Sự kiện vi phạm gửi thành công về Web App và trừ -50 XP trên Supabase Database.
- [ ] Bộ kiểm thử dự án `npm test` tiếp tục PASS 100% (380+ tests) và `npm run typecheck` 0 lỗi.
- [ ] Next.js Web App biên dịch thành công (`npm run build`).


## 2026-10-17T04:34:11Z

Xây dựng hệ thống Đấu Trường Học Nhóm Realtime (Pomodoro Party) kết nối Supabase Realtime Channels, đồng bộ đồng hồ Pomodoro đa người chơi (<200ms), cơ chế kỷ luật Silent Focus & bêu tên kẻ bỏ cuộc, và Bục Vinh Danh 3D Three.js.

Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap
Integrity mode: development

## Requirements

### R1. Cơ sở dữ liệu Supabase Realtime & Schema (`supabase/migrations/006_pomodoro_party.sql`)
- Tạo các bảng CSDL với Row Level Security (RLS) và kích hoạt Supabase Realtime:
  - `public.study_rooms`: Lưu trữ phòng học (`code` 6 ký tự ngẫu nhiên hoặc slug môn học, `title`, `subject`, `host_id`, `room_type` ['public', 'private_pin', 'workspace'], `pin_code`, `workspace_id`, `focus_duration_minutes`, `break_duration_minutes`, `current_status` ['waiting', 'focusing', 'break'], `start_time_iso`, `end_time_iso`, `is_active`).
  - `public.study_room_members`: Quản lý thành viên đang online (`room_id`, `user_id`, `status` ['focusing', 'distracted', 'break'], `joined_at`, `total_minutes_contributed`, `camera_on`, `last_ping_at`).
  - `public.room_reactions`: Kênh broadcast hiệu ứng hạt reaction bay thời gian thực (`room_id`, `user_id`, `emoji`, `created_at`).
- Cập nhật định nghĩa TypeScript vào `web/src/types/database.ts`.

### R2. Sảnh chờ & 3 Hình thức Phòng học (`/study/rooms`, `/study/rooms/[code]`, `/workspaces/[id]`)
- Giao diện Sảnh Danh Sách Phòng Học (`/study/rooms`) phong cách Cyber-Glass cao cấp:
  - Tab lọc: Tất cả, Môn học đại cương, Môn chuyên ngành, Nhóm Đồ Án.
  - Nút "Tạo Phòng Mới": Modal chọn loại phòng (Công khai, Mã PIN bảo mật 6 số, hoặc gắn với Workspace).
  - Modal "Nhập PIN" khi bấm vào phòng riêng tư.
- Tích hợp 1 phòng học riêng trực tiếp vào trang chi tiết Workspace (`/workspaces/[id]`).

### R3. Phòng Học Realtime: Silent Focus, Đồng Bộ Đồng Hồ & Hiệu Ứng Bay
- Đồng hồ đếm ngược đồng bộ hoàn hảo:
  - Dùng Supabase Realtime Channel Broadcast/Presence kết hợp chênh lệch thời gian máy chủ (NTP offset) để đảm bảo toàn bộ thành viên trong phòng có cùng một mốc giây đếm ngược (độ lệch < 200ms).
- Kỷ luật tương tác "Silent Focus":
  - **Trong giờ học (45-50 phút)**: Tắt khung chat văn bản tránh buôn chuyện; chỉ cho phép thả các Reaction hạt bay lơ lửng (Floating Particles: 🔥, 👏, ❤️, 💪, ⚡) bay từ avatar người gửi lên đỉnh màn hình.
  - **Trong giờ giải lao (5-10 phút)**: Tự động mở khung chat giải lao, nhạc lofi thư giãn và chia sẻ tài liệu.
- Cơ chế Bêu Tên Kẻ Bỏ Cuộc:
  - Khi Extension hoặc hệ thống phát hiện 1 thành viên đổi tab sang trang đen hoặc bấm rời phòng sớm: Avatar của thành viên đó trên sân khấu ảo chuyển sang **viền đỏ nhấp nháy cảnh báo (Danger Flash)**, âm thanh còi báo động Mèo Cam vang lên, và banner bêu tên công khai: *"Thành viên [Tên] đã phân tâm/bỏ cuộc và bị phạt -50 XP!"*.

### R4. Sân Khấu Thành Viên & Bục Vinh Danh 3D Three.js (Weekly Leaderboard Arena)
- Sân khấu thành viên Cyber-Glass:
  - Lưới Grid hiển thị Avatar 3D Holographic của các thành viên đang cùng ngồi học với đèn trạng thái neon (Xanh: Tập trung cao độ, Đỏ: Bị phạt, Vàng: Nghỉ giải lao).
- Bục Vinh Danh 3D hàng tuần (`/study/rooms/leaderboard`):
  - Canvas Three.js hiển thị bục 3 cấp độ (Vàng, Bạc, Đồng) với ánh sáng Spotlight xoay, cúp vàng Cyberpunk, hiển thị top 3 sinh viên có tổng số giờ focus cao nhất tuần kèm hiệu ứng pháo hoa neon.

## Acceptance Criteria

### Verification & Quality Gates
- [ ] File migration `supabase/migrations/006_pomodoro_party.sql` hợp lệ và TypeScript types trong `web/src/types/database.ts` khớp 100%.
- [ ] Tạo phòng mới thành công với cả 3 chế độ (Công khai, Mã PIN 6 số, Workspace) và tham gia phòng qua URL `/study/rooms/[code]`.
- [ ] Đồng hồ đếm ngược giữa các client đồng bộ chính xác theo Server Timestamp.
- [ ] Trong pha 'focusing': Input chat bị khóa, người dùng click reaction thì các icon hạt bay (Particles) xuất hiện trên màn hình phòng học.
- [ ] Giả lập vi phạm: Trạng thái thành viên đổi sang 'distracted' với viền đỏ cảnh báo và phạt trừ XP.
- [ ] Sân khấu Bục Vinh Danh 3D render mượt mà bằng Three.js mà không gây giật lag hay rò rỉ bộ nhớ (dispose scene khi unmount).
- [ ] Bộ kiểm thử dự án: `npm test` tiếp tục PASS 100% (513+ tests) và bổ sung test suite `web/tests/pomodoro-party.test.ts`.
- [ ] `npm run typecheck` đạt **0 lỗi** TypeScript.
- [ ] `npm run build` biên dịch thành công 100% các static/dynamic routes.


## 2026-10-17T07:15:36Z

Rebuild toàn diện toàn bộ phân hệ Xác thực (Auth Flow) của CampusOS gồm 5 trang (Login, Register, Forgot Password, Reset Password, Verify Email) sang kiến trúc Split-Screen 50/50 cao cấp, tích hợp Sân khấu 3D Three.js Hologram, Feature Carousel giới thiệu "Bộ 3 Siêu Năng", Nút Đăng nhập nhanh Demo 1-Click, Thanh đo độ mạnh mật khẩu neon và hiệu ứng rung lắc (Shake) micro-interactions.

Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap
Integrity mode: development

## Requirements

### R1. Khung Bố Cục Split-Screen 50/50 & Sân Khấu 3D Three.js (`(auth)/layout.tsx`)
- Tái cấu trúc `web/src/app/(auth)/layout.tsx`:
  - **Desktop (≥ 1024px)**: Chia đôi màn hình 50/50 đối xứng hoàn hảo, chiều cao 100vh cố định không bị tràn cuộn trang kép.
  - **Mobile & Tablet (< 1024px)**: Tự động co về 1 cột trung tâm sang trọng với nền Fluid Ambient Aurora.
- Sân khấu 3D Three.js (`web/src/components/auth/auth-3d-showcase.tsx`):
  - Canvas Three.js hiển thị quả cầu tri thức năng lượng số / khối pha lê Cyber-Glass Hologram xoay nhẹ và phản ứng theo con trỏ chuột.
  - Đèn Spotlight neon (Cyan `#38bdf8` & Violet `#a855f7`).
  - Dọn dẹp bộ nhớ WebGL an toàn (`cancelAnimationFrame`, `dispose` geometry/material/renderer) khi unmount.
- Dynamic Feature Carousel (`web/src/components/auth/auth-feature-carousel.tsx`):
  - Tự động trượt giới thiệu "Bộ Ba Siêu Năng" của CampusOS:
    1. 🐱 *Mèo Cam Giám Sát Cực Đoan* (URL Blacklist & AI Webcam Face Tracking)
    2. 🎴 *AI Study Hub 1M Tokens & Flashcard 3D SM-2* (Phân tích slide PDF bài giảng)
    3. 🏆 *Đấu Trường Pomodoro Party & Bục Vinh Danh 3D* (Học nhóm thời gian thực)
  - Số liệu thống kê sinh viên: "12,450+ giờ học hôm nay", câu danh ngôn truyền cảm hứng học tập mỗi ngày.

### R2. Trang Đăng Nhập Cyber-Glass & Tiện Ích Đột Phá (`(auth)/login/page.tsx`)
- Form Cyber-Glass với hiệu ứng kính mờ `backdrop-blur-2xl bg-card/60 border border-white/10 shadow-[0_0_50px_rgba(61,232,255,0.15)]`.
- Nút **"⚡ Đăng nhập nhanh Demo 1-Click"**:
  - Tự động điền và đăng nhập ngay bằng tài khoản sinh viên mẫu (`minh.nguyen@campus.edu.vn` / `Demo@123456`) để giảng viên, khách chấm bài thử nghiệm tức thì mà không cần gõ phím.
- Nút Social Login qua Google & GitHub tích hợp Supabase Auth.
- Ô Input thiết kế Cyberpunk: viền phát sáng neon khi focus (`focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(61,232,255,0.25)]`).
- Nút mắt ẩn/hiện mật khẩu trực quan.
- Checkbox "Ghi nhớ đăng nhập" (Remember Me).
- Hiệu ứng rung lắc (Shake animation) khi đăng nhập sai thông tin kèm alert cảnh báo đỏ neon.

### R3. Trang Đăng Ký & Thanh Đo Độ Mạnh Mật Khẩu (`(auth)/register/page.tsx`)
- Form đăng ký sinh viên: Họ và tên, Email sinh viên (`.edu.vn`), Mật khẩu, Xác nhận mật khẩu.
- **Thanh đo độ mạnh mật khẩu (Password Strength Meter)** 4 cấp độ thời gian thực:
  - Yếu (Đỏ), Trung bình (Vàng), Tốt (Xanh ngọc), Cực mạnh (Xanh lục neon).
  - Phân tích trực quan các tiêu chí: ≥8 ký tự, chữ hoa, số và ký tự đặc biệt.
- Checkbox đồng ý Điều khoản Dịch vụ & Quy chuẩn Học thuật CampusOS.

### R4. Đồng Bộ Trang Quên Mật Khẩu, Đặt Lại Mật Khẩu & Xác Thực Email
- `(auth)/forgot-password/page.tsx`: Gửi link khôi phục mật khẩu qua Email kèm đồng hồ đếm ngược 60 giây gửi lại mã.
- `(auth)/reset-password/page.tsx`: Form đặt lại mật khẩu mới với xác nhận mật khẩu và kiểm tra độ mạnh.
- `(auth)/verify-email/page.tsx`: Giao diện thông báo kích hoạt tài khoản sinh viên với icon thư Holographic phát sáng và nút gửi lại mã.

## Acceptance Criteria

### Verification & Quality Gates
- [ ] Bố cục Split-Screen 50/50 hiển thị mượt mà trên Desktop và co gọn thông minh trên Mobile/Tablet.
- [ ] Sân khấu Three.js 3D Hologram hoạt động 60/120fps, không rò rỉ bộ nhớ khi chuyển trang.
- [ ] Nút "Đăng nhập nhanh Demo 1-Click" kích hoạt đăng nhập thành công vào thẳng Dashboard.
- [ ] Nút ẩn/hiện mật khẩu, hiệu ứng rung lắc (Shake) khi nhập sai và thanh đo độ mạnh mật khẩu hoạt động chuẩn xác.
- [ ] Cả 5 trang Login, Register, Forgot Password, Reset Password, Verify Email đồng bộ phong cách Cyber-Glass.
- [ ] Bộ kiểm thử: `npm test` tiếp tục PASS 100% (643+ tests) và bổ sung test suite `web/tests/auth-redesign.test.ts`.
- [ ] `npm run typecheck` đạt **0 lỗi** TypeScript.
- [ ] `npm run build` biên dịch thành công 100% các static/dynamic routes.
