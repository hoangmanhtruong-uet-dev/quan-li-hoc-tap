# Codebase Survey Handoff Report — CampusOS Web

**Metadata Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_1`  
**Target Project**: CampusOS Web (`d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`)  
**Investigator**: `explorer_survey_1`  
**Recipient**: `orchestrator_7` (`5bd8e140-4c1e-4580-b966-e8064ec8f7d3`)  

---

## 1. Observation

### 1.1 Package Dependencies and Scripts (`web/package.json`)
- **Next.js**: `14.2.5` (App Router)
- **React & React DOM**: `18.3.1`
- **TypeScript**: `5.5.4`
- **Tailwind Ecosystem**: `tailwindcss: 3.4.10`, `tailwindcss-animate: ^1.0.7`, `postcss: 8.4.47`, `autoprefixer: 10.4.20`, `tailwind-merge: ^3.6.0`, `clsx: ^2.1.1`, `class-variance-authority: ^0.7.1`
- **Graphics & 3D**: `three: ^0.186.1` and `@types/three: ^0.186.0` are already installed.
- **Icons**: `lucide-react: ^1.24.0`
- **Radix Primitives**: `@radix-ui/react-separator: ^1.1.15`, `@radix-ui/react-slot: ^1.3.3`, `@radix-ui/react-tooltip: ^1.2.16`
- **Audio / TTS**: `msedge-tts: ^2.0.9` (backend neural voice route `/api/tts`), plus procedural Web Audio API in frontend (`src/features/pomodoro/audio-engine.ts`)
- **Missing / Not Installed**:
  - `framer-motion` is **not** installed.
  - `zustand` is **not** installed.
  - `@dnd-kit/*` is **not** installed.
  - `vitest` / `jest` are **not** installed.
- **Scripts**:
  - `"dev": "next dev"`
  - `"build": "next build"`
  - `"typecheck": "tsc --noEmit"`
  - `"test": "node --experimental-strip-types --test tests/*.test.ts"`

### 1.2 Build, Typecheck, and Test Execution Status
- **`npm test`**: Ran `node --experimental-strip-types --test tests/*.test.ts`. Exited code 0 with 9 tests passing (duration: 132ms).
- **`npm run typecheck`**: Ran `tsc --noEmit`. Exited code 0 with 0 errors.
- **`npm run build`**: Ran `next build`. Exited code 0. Generated 34 static and dynamic routes successfully. First load JS shared chunk is 87.1 kB.

### 1.3 Tailwind Configuration & Styling Tokens
- **`tailwind.config.js` content array** (lines 4–8):
  ```js
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/streamdown/dist/*.js',
  ]
  ```
  **CRITICAL FINDING**: `./src/features/**/*.{js,ts,jsx,tsx,mdx}` is **missing** from `content`! Any Tailwind utility classes placed strictly inside `src/features/` without existing elsewhere in `src/app` or `src/components` will be purged during production build unless added to `content` or placed under `src/components/`.
- **Theme Variables** (`src/app/globals.css` lines 6–61):
  - Uses CSS HSL variables (`--background`, `--foreground`, `--card`, `--primary`, `--border`, etc.).
  - Default root is dark mode (`--background: 222 38% 6%`).
  - Supports light mode via `@media (prefers-color-scheme: light)` and `html[data-theme='light']`.
  - Custom utility classes: `.surface-glow`, `.ai-surface`, `.scrollbar-thin`.
  - Animations defined: `accordion-down`, `accordion-up`, `fade-in`, `slide-up`.
- **Typography**:
  - `tailwind.config.js` (lines 76–94): `font-sans` maps to `Inter`, system fallback fonts. `font-mono` maps to `JetBrains Mono`, `Fira Code`, `Consolas`.
  - Neither `Unbounded` nor `Be Vietnam Pro` are currently imported in `globals.css` or `layout.tsx`.

### 1.4 App Shell & Navigation Structure
- **`src/app/layout.tsx`**: Sets `lang="vi"`, wraps `<AuthProvider>{children}</AuthProvider>`.
- **`src/app/(main)/layout.tsx`**: Server component. Executes `await requireUser({ requireOnboarding: false })` and returns `<AppLayout>{children}</AppLayout>`.
- **`src/components/layout/app-layout.tsx`**: Client component.
  - Left desktop sidebar: `<Sidebar />` (`w-[17rem]`, sticky, `z-30`).
  - Top header: `<Header onMenuClick={...} />` (`h-[4.5rem]`, sticky).
  - Main area: `<main className="flex-1 px-4 py-6 pb-24 md:px-7 md:py-8 lg:px-10 lg:py-10">{children}</main>`.
  - Mobile bottom navigation: `<BottomNav />` (`fixed bottom-0 md:hidden`).
- **`src/components/layout/sidebar.tsx`**: Renders items grouped by sections from `src/config/nav.ts`. Highlights active route using `pathname.startsWith(...)`.
- **Theme handling**: No dedicated `ThemeProvider` or Context exists. `src/app/(main)/settings/page.tsx` directly modifies `document.documentElement.dataset.theme`.

### 1.5 Existing `/dashboard` and `/calendar` Implementations
- **`src/app/(main)/dashboard/page.tsx`** (143 lines):
  - Primitive SaaS card grid.
  - Static header: `"Thứ Năm, 20 tháng 8 · Hôm nay có 3 lớp và 1 deadline quan trọng."`.
  - Local state stored only in `localStorage.getItem('campusos-dashboard-v1')`.
  - Opens legacy generic `StudySessionModal` instead of `StrictPomodoroModal`.
  - None of the 7 Neo-Brutal Aurora sections (Hero 3D/Aurora blob, Horizontal timeline, Asymmetric Bento Deadline Arena, AI Mascot, Game HUD, 3-column Squad Kanban, Marquee footer + Daily Wrapped) are implemented.
- **`src/app/(main)/calendar/page.tsx`** (213 lines):
  - Hardcoded to August 2026 (`todayKey = '2026-08-20'`, `new Date(2026, 7, 1)`).
  - 11 hardcoded static mock events from August/September 2026.
  - Stored in `localStorage.getItem('campusos-calendar-v1')`.
  - Only has Month grid (42 static cells) and simple List/Agenda view.
  - Missing real system date anchoring, Week/Day time grid (06:00–23:00), conflict detection, drag-and-drop rescheduling, NLP quick-create ("ôn xác suất 19h thứ 6"), Load heat-score bar, AI auto-scheduler modal ("Xếp lịch giúp tao"), and `.ics` import/export.

### 1.6 Pomodoro & Fat Orange Cat Supervisor Integration Point
- **`src/features/pomodoro/strict-pomodoro-modal.tsx`** (566 lines):
  - Already implemented with `MemeCatStage`, `TalkingTom3D`, `SupervisorArbiter`, `PomodoroAudioEngine`, and `useTabDetection`.
  - Real cutout image asset exists at `public/images/fat-orange-cat.png` (405 kB).
  - Callback signature: `onSessionComplete?: (stats: { focusMinutes: number; shameCount: number; disciplineScore: number }) => void`.
  - Currently supports `visualMode: 'meme_photo' | '3d_model'`.
  - Ready to be extended with the second required mode: `chill_breathing` (4-7-8 breathing orb + procedural Web Audio lo-fi ambient synth).

### 1.7 Existing State Management & Storage
- No Zustand or global Context store for student progress.
- Pages currently use fragmented `localStorage` keys:
  - `campusos-dashboard-v1`
  - `campusos-calendar-v1`
  - `campusos-tasks-v1`
  - `campusos-settings-v2`
- Need a unified shared store module (`src/lib/campus-store.ts`) with custom React hook (`useCampusStore`) synchronizing XP, Level, Rank title, Streak, Streak Freeze, Mood, Vibe Theme, study minutes, deadlines, Kanban tasks, and calendar events across `/dashboard` and `/calendar` using `localStorage` and `window` event dispatching.

---

## 2. Logic Chain

1. **Observation**: `package.json` does not include `framer-motion` or `@dnd-kit/*`, but includes `three`, `@types/three`, and `tailwindcss-animate`. Next.js is version `14.2.5`.
   **Inference**: All animations must be implemented using zero-overhead GPU-accelerated CSS transforms/keyframes, native HTML5 drag-and-drop/pointer events, and lightweight 1-draw-call Canvas2D / WebGL / Three.js shaders. This directly aligns with the requirement constraint: **Zero-Lag 120FPS Performance**.
2. **Observation**: `tailwind.config.js` only scans `./src/app/**` and `./src/components/**`.
   **Inference**: New modular dashboard and calendar components must either be placed in `src/components/dashboard/` and `src/components/calendar/`, or `tailwind.config.js` content array must be updated to include `./src/features/**/*.{js,ts,jsx,tsx,mdx}`. Placing modular components in `src/components/` is clean and guarantees full Tailwind class retention.
3. **Observation**: `npm test` runs with `node --experimental-strip-types --test tests/*.test.ts`. Node requires explicit `.ts` extension in module specifiers when running with `--experimental-strip-types`.
   **Inference**: All newly authored tests in `tests/*.test.ts` (e.g. testing `loadScore`, `conflicts`, `nlpParse`, `ics`, and XP calculation) must use explicit `.ts` extensions in their relative imports from `../src/...`.
4. **Observation**: The current `/calendar` page hardcodes `todayKey = '2026-08-20'` and August 2026 dates, disconnecting it from the real current date.
   **Inference**: Anchor `todayKey` to `new Date()` (formatted as `YYYY-MM-DD`). Seed generator must generate events dynamically relative to the current date (`today - 2 days`, `today`, `today + 3 days`, etc.) so the user always sees their real current month/week populated.
5. **Observation**: `StrictPomodoroModal` already implements the Fat Orange Cat supervisor, tab detection, and Northern Vietnamese TTS, but does not yet feature the 4-7-8 Breathing + Lo-fi synthesizer mode requested in R4.
   **Inference**: Enhance `StrictPomodoroModal` by adding an in-modal mode switch between `extreme_cat` and `chill_breathing` (with Web Audio synth), and hook its completion directly to the unified campus store to update study minutes and XP.

---

## 3. Caveats

- **No Caveats**: The entire frontend source tree, build pipeline, styles, dependencies, and test harnesses were directly observed, executed, and verified.

---

## 4. Conclusion

1. **Architecture & File Placement**:
   - Create shared state layer in `src/lib/campus-store.ts` (XP, Level, Streak, Mood, Vibe Theme, Calendar events, Kanban tasks, study minutes).
   - Create algorithmic helper libraries with zero external dependencies in `src/lib/`:
     - `src/lib/calendar-math.ts` (load heat-score calculation, conflict detection).
     - `src/lib/nlp-calendar.ts` (Vietnamese natural language event parsing).
     - `src/lib/ics-calendar.ts` (.ics export and import parsing).
     - `src/lib/gamification.ts` (XP levels, humorous Vietnamese ranks, streak freezes).
   - Place modular UI components in `src/components/dashboard/` and `src/components/calendar/` to adhere to existing Tailwind content boundaries.
2. **Design Tokens & Fonts**:
   - Inject `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Unbounded:wght@700;800;900&family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;600;700&display=swap');` in `src/app/globals.css` with local font-family fallbacks.
   - Configure Neo-Brutal Aurora theme classes (`theme-aurora`, `theme-y2k`, `theme-cyberlime`, `theme-pastel`).
3. **Focus Mode**:
   - Wire `StrictPomodoroModal` into `/dashboard` and `/calendar`, adding the 4-7-8 Breathing + Lo-fi Mode alongside the existing Fat Orange Cat Supervisor.
4. **Testing**:
   - Write comprehensive unit tests in `tests/campus-redesign.test.ts` importing TS helper files with explicit `.ts` extensions, and verify with `npm test`.

---

## 5. Verification Method

- **Typecheck Verification**:
  ```bash
  npm run typecheck
  ```
  Expected: Exits with code 0.
- **Unit Test Verification**:
  ```bash
  npm test
  ```
  Expected: Exits with code 0, executing all existing and new test suites under `tests/`.
- **Production Build Verification**:
  ```bash
  npm run build
  ```
  Expected: Exits with code 0, generating all 34 routes cleanly without syntax or ESLint errors.
- **File Inspection**:
  - `web/package.json`
  - `web/tailwind.config.js`
  - `web/src/app/globals.css`
  - `web/src/app/(main)/dashboard/page.tsx`
  - `web/src/app/(main)/calendar/page.tsx`
  - `web/src/features/pomodoro/strict-pomodoro-modal.tsx`
