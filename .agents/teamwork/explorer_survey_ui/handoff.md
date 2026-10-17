# Handoff Report: Frontend UI, Cyber-Glass Design System, Routing, Modals & Audio Survey

**Agent**: `explorer_survey_ui`  
**Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_ui`  
**Milestone**: Pomodoro Party Realtime Study Rooms Architecture Survey  
**Target Date**: 2026-10-17  

---

## 1. Observation

### 1.1 App Router Layout & Routing Hierarchy
- **Root Layout (`web/src/app/layout.tsx:1-21`)**:
  - Provides root HTML setup (`<html lang="vi" suppressHydrationWarning>`), global styles (`import './globals.css'`), and `<AuthProvider>{children}</AuthProvider>`.
  - Body container: `<body className="min-h-screen bg-background font-sans antialiased">`.
- **Main Layout (`web/src/app/(main)/layout.tsx:1-10`)**:
  - Server Component enforcing authentication:
    ```tsx
    export default async function MainLayout({ children }: { children: React.ReactNode }) {
      await requireUser({ requireOnboarding: false });
      return <AppLayout>{children}</AppLayout>;
    }
    ```
- **App Shell (`web/src/components/layout/app-layout.tsx:13-34`)**:
  - Renders `<Sidebar />` on desktop (`hidden md:flex sticky top-0 h-screen w-[17rem] shrink-0 border-r border-sidebar-border bg-sidebar/95 backdrop-blur-xl`).
  - Mobile backdrop drawer overlay: `fixed inset-0 z-40 bg-black/50 md:hidden animate-fade-in`.
  - Main view container:
    ```tsx
    <div className="flex flex-1 flex-col md:ml-0 min-w-0 overflow-x-hidden">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 w-full min-w-0 px-4 py-6 pb-24 md:px-6 md:py-8 lg:px-8 lg:py-8 overflow-x-hidden">
        {children}
      </main>
    </div>
    <BottomNav />
    ```
- **Sidebar Navigation Configuration (`web/src/config/nav.ts:13-21` & `web/src/components/layout/sidebar.tsx:66-78`)**:
  - Sidebar checks active route via `item.segment === 'study' ? pathname.startsWith('/study') : ...`.
  - Under `'Học tập'` category (`nav.ts:13-21`):
    - Academic Hub: `/study` (`segment: 'study'`)
    - AI Study Coach: `/coach` (`segment: 'coach'`)
    - Học kỳ: `/study/semesters` (`segment: 'semesters'`)
    - Môn học: `/study/courses` (`segment: 'courses'`)
    - Điểm số: `/study/grades` (`segment: 'grades'`)
- **Root Page Redirect (`web/src/app/page.tsx:1-5`)**:
  - Root `/` performs `redirect('/dashboard')`.

---

### 1.2 Workspace Detail Implementation & Embedded Room Integration
- **Route Path (`web/src/app/(main)/workspaces/[workspaceId]/page.tsx:29-50`)**:
  - Route uses dynamic slug `[workspaceId]` (e.g. `/workspaces/ws-capstone-2026`).
  - Accesses hook `useWorkspace(workspaceId)` from `@/lib/workspace-engine`.
- **Existing Tab System (`web/src/app/(main)/workspaces/[workspaceId]/page.tsx:50, 208-241`)**:
  - State: `const [activeTab, setActiveTab] = useState<'kanban' | 'documents' | 'members' | 'activity'>('kanban');`
  - 4 tabs rendered with badges:
    1. `kanban`: 'Bảng Kanban' (Tasks count)
    2. `documents`: 'Tài liệu & Tài nguyên' (Documents count)
    3. `members`: 'Thành viên & RBAC' (Members count)
    4. `activity`: 'Nhật ký hoạt động' (Activities count)
  - Tab button styling:
    ```tsx
    className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition-all ${
      isActive
        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-300 shadow-md shadow-cyan-500/15'
        : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
    }`}
    ```
- **Workspace Hero Banner (`web/src/app/(main)/workspaces/[workspaceId]/page.tsx:115-206`)**:
  - Styled with: `rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/20`.
  - Ambient glows:
    - `-left-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl`
    - `-right-20 -bottom-20 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl`
  - SVG circular progress meter (`stroke-cyan-400`, radius 32, circumference `2 * Math.PI * 32`).

---

### 1.3 Cyber-Glass Design System & Styling Tokens
- **Tailwind Config (`web/tailwind.config.js:72-107`)**:
  - Aurora palette tokens:
    - `aurora.obsidian`: `#0A0A12`
    - `aurora.lime`: `#C6FF3D`
    - `aurora.pink`: `#FF3DA5`
    - `aurora.violet`: `#7C5CFF`
    - `aurora.cyan`: `#3DE8FF`
    - `aurora.orange`: `#FF8A3D`
  - Custom border radius: `neo: '24px'`, `neo-lg: '32px'`.
  - Custom shadows: `neo`, `neo-accent`, `neo-lime`, `neo-cyan`, etc.
  - Fonts: `font-display` (Unbounded, Space Grotesk), `font-heading` (Space Grotesk), `font-sans` (Be Vietnam Pro), `font-mono` (JetBrains Mono).
- **Global CSS (`web/src/app/globals.css:11-85, 245-318`)**:
  - Base background `#0A0A12` with 3 ambient radial gradient blobs (`--aurora-blob-1` violet 0.28, `--aurora-blob-2` pink 0.24, `--aurora-blob-3` cyan 0.20) attached fixed.
  - Utility classes:
    - `.hard-border`: `border: 2px solid var(--neo-border-color, rgba(255, 255, 255, 0.18));`
    - `.sticker-badge`: rotated pill `-1.5deg`, 2px border, hard shadow 3px 3px.
    - `.aurora-noise`: 4% fractal noise SVG overlay.
  - Reduced Motion Accessibility (`globals.css:413-454`):
    - `@media (prefers-reduced-motion: reduce)` and `[data-reduced-motion="true"]` force `animation-duration: 0.001ms !important`, zero transforms, static shadows.
- **Glassmorphism Conventions in Components (`web/src/app/(main)/settings/page.tsx:256`, `web/src/app/(main)/coach/page.tsx:429`, `web/src/components/workspaces/workspace-holo-3d.tsx:243`)**:
  - Glass cards: `rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl shadow-2xl`.
  - Neon Cyan highlights: `border-cyan-400/30`, `text-cyan-300`, `bg-cyan-500/10`.
  - Neon Red/Rose danger/penalty: `border-rose-500/30`, `text-rose-300`, `bg-rose-500/10`, `animate-pulse`, `animate-panic-shake`.
  - Neon Lime: `text-aurora-lime`, `border-aurora-lime`.
  - Form inputs: `rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40`.

---

### 1.4 Modals, PIN Entry, Tab Filters & Audio Engine
- **Modal Dialog Pattern (`web/src/components/workspaces/create-workspace-modal.tsx:81-98, 259-275`)**:
  - Fixed portal container: `fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto`.
  - Backdrop: `fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity` with `onClick={onClose}`.
  - Modal card: `relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/40`.
  - Accessibility: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `Escape` key listener on `window`.
  - Actions footer: Cancel button (`rounded-2xl border border-white/10 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10`) + Submit button (`bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.02] active:scale-[0.98]`).
- **6-Digit PIN Entry Modal Pattern (`web/src/components/settings/security-2fa-modal.tsx:28-32, 240-256`)**:
  - Regex validation: `/^\d{6}$/.test(clean)`.
  - Input formatting:
    ```tsx
    <input
      type="text"
      maxLength={6}
      value={totpInput}
      onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, ''))}
      placeholder="Ví dụ: 123456"
      className="w-full h-11 rounded-xl border border-white/15 bg-slate-900/60 px-4 text-center font-mono text-lg font-black tracking-widest text-cyan-300 focus:outline-none focus:border-cyan-400 shadow-inner"
      autoFocus
    />
    ```
- **Web Audio Engine (`web/src/features/pomodoro/audio-engine.ts:11-187, 192-245`)**:
  - Class `PomodoroAudioEngine` (`export const pomodoroAudio = new PomodoroAudioEngine();`):
    - `unlock()`: Resumes `AudioContext` and plays silent 0.05s buffer to bypass browser autoplay policy.
    - `playAlertSound(type)`: Zero-dependency procedural synthesis using `ctx.createOscillator()` and `ctx.createGain()`:
      - `'warning'`: Sawtooth pitch drop 320Hz -> 260Hz (0.25s).
      - `'penalty'`: Triangle pitch drop 640Hz -> 300Hz (0.35s).
      - `'success'`: Sine arpeggio chord C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) (0.6s).
      - `'poke'`: Sawtooth bend 520Hz -> 880Hz -> 340Hz.
      - `'start'`: Sine rise 440Hz -> 880Hz.
      - `'tap'`: Low sine tap 180Hz -> 90Hz.
    - `speak(text, onEnd, options)`: Invokes `/api/tts` (Neural Vietnamese voice with tone options `'sarcastic' | 'angry' | 'praise' | 'normal'`) with automatic fallback to Web Speech API `SpeechSynthesisUtterance` (`vi-VN`).
    - `analyser`: Real-time FFT `AnalyserNode` (`fftSize = 256`) with `getMouthOpenness()` returning `0.0 -> 1.0` for 3D character lip-sync.

---

### 1.5 Floating Reactions, Confetti & Three.js 3D Components
- **Canvas2D Confetti (`web/src/components/dashboard/deadline-arena.tsx:15-23, 106-160`)**:
  - Full-screen overlay `<canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50 h-full w-full" />`.
  - 35 colored particles (`#C6FF3D`, `#FF3DA5`, `#7C5CFF`, `#3DE8FF`, `#FF8A3D`) animated with gravity `dot.vy += 0.15` and linear alpha fade over 750ms.
- **Three.js Particle Systems (`web/src/components/coach/quantum-orb-3d.tsx:220-272, 365-390`)**:
  - `THREE.BufferGeometry` with `Float32Array` for positions and vertex colors.
  - `THREE.PointsMaterial` with `transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending`.
- **Three.js Architecture & Lifecycle (`web/src/components/workspaces/workspace-holo-3d.tsx:20-66, 212-238`)**:
  - Checks `matchMedia('(prefers-reduced-motion: reduce)')` and WebGL context support.
  - Renderer config: `alpha: true, antialias: true, powerPreference: 'high-performance'`, bounded `setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))`.
  - Strict resource disposal on unmount:
    ```tsx
    meshes.forEach((mesh) => mesh.material.dispose());
    geometries.forEach((geo) => geo.dispose());
    renderer.dispose();
    if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    cancelAnimationFrame(animId);
    ```
  - SSR Dynamic Loading (`web/src/app/(main)/study/page.tsx:37-49`):
    - Uses `dynamic(() => import(...), { ssr: false, loading: () => <Skeleton /> })` to avoid Next.js SSR WebGL compilation crashes.

---

### 1.6 Current Verification Status
- Running `npm test` in `web/`: **513 passing tests**, 0 failing (duration: 2.9s).
- Running `npm run typecheck` in `web/`: **0 TypeScript errors** (`tsc --noEmit` exit code 0).

---

## 2. Logic Chain

1. **Routing Location for `/study/rooms`**:
   - Observation 1.1 shows that `web/src/app/(main)/layout.tsx` wraps all authenticated pages in `<AppLayout>`, which provides the global navigation shell and enforces `requireUser`.
   - Observation 1.1 shows that `web/src/components/layout/sidebar.tsx:68` checks `item.segment === 'study' ? pathname.startsWith('/study') : ...`.
   - Therefore, placing `/study/rooms`, `/study/rooms/[code]`, and `/study/rooms/leaderboard` under `web/src/app/(main)/study/rooms/`:
     - Guarantees the "Academic Hub" (`/study`) menu item stays highlighted.
     - Automatically protects routes with authentication.
     - Keeps header search, AI coach link, notification center, and user avatar available.
     - Avoids duplication of the app shell while allowing `/study/rooms/[code]` to offer a "Zen Fullscreen" mode toggle if users desire maximum viewport focus.

2. **Seamless Integration of Embedded Study Room in Workspace**:
   - Observation 1.2 shows that `web/src/app/(main)/workspaces/[workspaceId]/page.tsx` uses a 4-tab system (`kanban`, `documents`, `members`, `activity`) with `activeTab` state and a hero banner.
   - Therefore, to integrate the workspace study room seamlessly:
     - Add a 5th tab `{ id: 'study_room', label: 'Phòng học nhóm', icon: Timer, count: activeMemberCount }`.
     - In the hero banner or stats bar, add a direct CTA: `"Vào phòng học nhóm"` with a live green indicator when a session is active.
     - When the `study_room` tab is selected, render `<WorkspaceStudyRoomPanel workspaceId={workspaceId} />` displaying the synchronized countdown timer, live member presence grid, and a `"Mở Đấu Trường Toàn Màn Hình"` button linking to `/study/rooms/[code]`.
     - Ensure URL consistency: Since Next.js uses `[workspaceId]` while the prompt references `/workspaces/[id]`, creating a rewrite or alias route `web/src/app/(main)/workspaces/[id]/` or keeping `[workspaceId]` ensures full compatibility.

3. **Adherence to Cyber-Glass Design System**:
   - Observation 1.3 shows that all major pages (`workspaces`, `coach`, `settings`, `profile`) use the exact container recipe: `rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl shadow-2xl` with corner radial glows (`bg-cyan-500/15 blur-3xl`).
   - Neon accent tokens are strictly semantically mapped:
     - Cyan (`#3DE8FF` / `border-cyan-400/30`, `text-cyan-300`): Default cyber accent for room cards, active tabs, and primary actions.
     - Acid Lime (`#C6FF3D` / `border-aurora-lime`, `text-aurora-lime`): XP rewards, completed streaks, active timers.
     - Rose/Neon Red (`#FF3D6E` / `border-rose-500`, `text-rose-300`, `bg-rose-500/10`): Distracted state, penalty alert, shame banner.
     - Amber (`#FFB020` / `border-amber-400/30`): Private PIN rooms, warnings, trophy elements.
     - Emerald (`#34D399` / `text-emerald-300`): Silent focus state, verified members.
   - All rooms and modals must maintain `overflow-x-hidden min-w-0` to avoid viewport breaking.

4. **Modal Architecture & PIN Entry**:
   - Observation 1.4 reveals consistent modal implementation across `CreateWorkspaceModal` and `Security2faModal` with portal rendering, `bg-slate-950/80 backdrop-blur-md`, `Escape` listener, and `role="dialog"`.
   - The PIN entry modal for private rooms can directly adopt the 6-digit input pattern from `Security2faModal:248-256` (`maxLength={6}`, numeric sanitization `replace(/\D/g, '')`, centered monospace font with `tracking-[0.5em]`).
   - The Create Room modal can adopt the tabbed/card selector from `CreateWorkspaceModal:131-157` allowing users to choose room type:
     - 1. `Công khai (Public)` - Open to all students.
     - 2. `Mã PIN bảo mật (Private PIN)` - Requires 6-digit numeric PIN.
     - 3. `Gắn với Workspace (Workspace)` - Restricted to workspace project members.

5. **Audio Engine Extension for Còi Báo Động (Alarm Siren)**:
   - Observation 1.4 confirms that `pomodoroAudio` (`web/src/features/pomodoro/audio-engine.ts`) is the project's centralized audio synthesizer, using zero-dependency Web Audio oscillators and Vietnamese TTS.
   - Requirement R3 requires: *"Avatar chuyển sang viền đỏ nhấp nháy cảnh báo (Danger Flash), âm thanh còi báo động Mèo Cam vang lên, và banner bêu tên công khai: Thành viên [Tên] đã phân tâm/bỏ cuộc và bị phạt -50 XP!"*.
   - By extending `playAlertSound(type: ... | 'siren')` with an LFO frequency-modulated dual-tone alarm (600Hz <-> 950Hz) or invoking `speak()` with the angry sarcastic TTS voice, the shaming mechanism can trigger with 0ms network latency.

6. **Floating Particle Reactions & 3D Leaderboard Arena**:
   - Requirement R3 states that during Silent Focus (45-50 min), text chat is disabled and only floating reactions (🔥, 👏, ❤️, 💪, ⚡) are permitted.
   - Using CSS 3D transforms (`translate3d`) inside a `<FloatingReactionsOverlay />` positioned over the virtual room grid ensures zero GPU memory leakage and 120FPS smooth ascent with auto-removal after 2.5s.
   - For `/study/rooms/leaderboard`, Observation 1.5 proves that Three.js is already installed and components must be wrapped in `dynamic(() => import(...), { ssr: false })` with full scene/geometry/material/renderer disposal on unmount to satisfy Quality Gates.

---

## 3. Caveats

- **Next.js Dynamic Route Parameter**:
  - The existing workspace route directory is `web/src/app/(main)/workspaces/[workspaceId]/page.tsx` (using `params.workspaceId`). The user request references `/workspaces/[id]`. To prevent any routing breakage, the embedded room should be added to `[workspaceId]/page.tsx` and, if needed, a lightweight wrapper or redirect can be placed at `[id]/page.tsx`.
- **Browser Autoplay Restrictions**:
  - Web Audio requires a user interaction gesture (click/tap) before `AudioContext` can transition from `'suspended'` to `'running'`. Calling `pomodoroAudio.unlock()` on room join or modal interaction ensures the alarm siren and sound effects will play smoothly.
- **Three.js SSR Handling**:
  - WebGL cannot be rendered on Node.js server during `next build`. Any Three.js canvas for the Weekly Leaderboard Arena must use `dynamic(..., { ssr: false })` or `typeof window !== 'undefined'` guard.
- **Scope Discipline**:
  - This survey is strictly read-only analysis. No code changes have been made in `web/src/` or `supabase/`.

---

## 4. Conclusion

1. **Routing Recommendation**:
   - Lobby page: `web/src/app/(main)/study/rooms/page.tsx`
   - Realtime Study Room page: `web/src/app/(main)/study/rooms/[code]/page.tsx`
   - 3D Weekly Leaderboard Arena: `web/src/app/(main)/study/rooms/leaderboard/page.tsx`
   - Navigation Link: Add to `web/src/config/nav.ts` under `'Học tập'` as `{ label: 'Đấu trường Pomodoro', href: '/study/rooms', icon: 'zap', segment: 'study-rooms' }`.

2. **Workspace Integration**:
   - Add tab `'study_room'` to `web/src/app/(main)/workspaces/[workspaceId]/page.tsx` with a `<WorkspaceStudyRoomPanel />` component that synchronizes with the workspace's dedicated room (`workspace_id`), displays active member presence, and links to the full arena.

3. **Design System & Visual Consistency**:
   - Use standard Cyber-Glass card recipe: `rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20` with ambient glows.
   - Use semantically mapped neon borders: Cyan for normal/active, Lime for XP/focus, Rose for distracted/penalty, Amber for PIN/trophy.
   - Preserve responsive container rules: `overflow-x-hidden min-w-0`.

4. **Modals & Sound**:
   - Create Room Modal: Modal with 3 room types (Public, PIN, Workspace) following `CreateWorkspaceModal` design.
   - PIN Entry Modal: 6-digit numeric input following `Security2faModal` design.
   - Audio: Extend `pomodoroAudio.playAlertSound('siren')` in `web/src/features/pomodoro/audio-engine.ts` for instant procedural siren alarm + TTS call.

5. **Floating Reactions & 3D Leaderboard**:
   - Floating reactions: Lightweight DOM overlay with CSS `translate3d` keyframe animation (2.5s duration, auto-cleanup, reduced-motion fallback).
   - 3D Leaderboard: Dynamic client-only Three.js component (`leaderboard-podium-3d.tsx`) with 3 podium cylinders (Gold, Silver, Bronze), rotating spotlight, cyberpunk trophy, neon confetti fireworks, and full WebGL memory disposal on unmount.

---

## 5. Verification Method

To independently verify all claims made in this report:

1. **Verify Existing Route Structure & Layout**:
   - Inspect `web/src/app/(main)/layout.tsx` and `web/src/components/layout/app-layout.tsx`.
   - Confirm `web/src/app/(main)/study/page.tsx` exists and renders inside `AppLayout`.

2. **Verify Workspace Tabs**:
   - Inspect `web/src/app/(main)/workspaces/[workspaceId]/page.tsx:50` and lines `208-241`.

3. **Verify Cyber-Glass Tokens & Utilities**:
   - Inspect `web/tailwind.config.js:72-107` for `aurora` color tokens.
   - Inspect `web/src/app/globals.css:11-85` for CSS theme variables and `.hard-border` utility.

4. **Verify Modal & PIN Pattern**:
   - Inspect `web/src/components/settings/security-2fa-modal.tsx:28-32, 248-256`.
   - Inspect `web/src/components/workspaces/create-workspace-modal.tsx:81-98`.

5. **Verify Audio Engine**:
   - Inspect `web/src/features/pomodoro/audio-engine.ts:119-184` for `playAlertSound`.

6. **Verify Three.js Lifecycle & Disposal**:
   - Inspect `web/src/components/workspaces/workspace-holo-3d.tsx:212-238`.

7. **Verify Build & Test Integrity**:
   - In `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`:
     - `npm test` -> confirms 513/513 passing tests.
     - `npm run typecheck` -> confirms 0 TypeScript errors.
