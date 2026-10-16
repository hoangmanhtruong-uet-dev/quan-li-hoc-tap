# Handoff Report — Explorer Survey R3: Profile, Notifications, Settings & Quality Gates

**Date**: 2026-10-16T17:50:00Z  
**Author**: Explorer & Synthesizer Subagent  
**Recipient**: Orchestrator (`2edd309a-1f42-49e0-9c2a-571cbec23f81`)  
**Mission**: Investigate existing codebase for R3: Hồ sơ, Thông báo & Cài đặt (`/profile`, `/notifications`, `/settings`) and Quality Gates & tests baseline in `web/`.

---

## 1. Observation

### 1.1 Quality Gates & Test Suites Baseline
1. **Project Scripts & Environment** (`web/package.json:5-13`):
   ```json
   "scripts": {
     "dev": "next dev",
     "build": "next build",
     "start": "next start",
     "lint": "next lint",
     "typecheck": "tsc --noEmit",
     "test": "node --experimental-strip-types --test tests/*.test.ts",
     "migrate:phase5b": "node scripts/migrate-phase-5b.mjs"
   }
   ```
   - Framework: Next.js `14.2.5` (App Router), React `18.3.1`, TypeScript `5.5.4`, Tailwind CSS `3.4.10`.
   - Test Runner: Node.js native test runner (`node --experimental-strip-types --test tests/*.test.ts`) using `node:test` and `node:assert/strict`. No vitest/jest dependencies.
2. **Current Typecheck Run**:
   - Command: `npm run typecheck` in `web/`
   - Result: Exit code 0, 0 TypeScript errors.
3. **Current Test Run**:
   - Command: `npm test` in `web/`
   - Result: Exit code 0, **291 tests passed across 17 test suites** in 2.77s.
   - Test suites found in `web/tests/`:
     - `academic-engine.test.ts`
     - `auditor-m3-forensics.test.ts`
     - `campus-redesign.test.ts`
     - `challenger-leo-2-adversarial.test.ts`
     - `challenger-leo-adversarial-stress.test.ts`
     - `challenger-m1-1-tasks-engine.test.ts`
     - `challenger-m1-2-stress-boundary.test.ts`
     - `challenger-m1-2-stress.test.ts`
     - `challenger-m1-quicktask-stress.test.ts`
     - `challenger-m1-tasks-reactivity.test.ts`
     - `coach-engine.test.ts`
     - `growth-engine.test.ts`
     - `pomodoro-leo.test.ts`
     - `quick-task-nlp-sync.test.ts`
     - `supervisor-arbiter.test.ts`
     - `tasks-redesign.test.ts`
     - `workspace-permissions.test.ts`
   - **Crucial Gap**: Zero tests currently exist for `/profile`, `/notifications`, or `/settings`.
4. **Current Production Build Run**:
   - Command: `npm run build` in `web/`
   - Result: Exit code 0, all 33 static pages compiled without errors, including `/profile`, `/notifications`, `/settings`.

---

### 1.2 Inspection of Route `/profile`
- **Location**: `web/src/app/(main)/profile/page.tsx` (176 lines).
- **Existing Implementation**:
  - Uses standard shadcn/ui cards: `<Card>`, `<CardContent>`, `<CardHeader>`, `<CardTitle>`, `<Avatar>`, `<Badge>`, `<Button>`.
  - Simple gradient banner `bg-gradient-to-r from-blue-600/35 via-violet-600/25 to-cyan-500/20` (`line 104`).
  - Standard Avatar with local FileReader upload saving base64 to `localStorage.getItem('campusos-profile-avatar-v1')` (`line 54, 88-97`).
  - Hardcoded 4 summary stats: GPA `3.6/4.0`, Tín chỉ `18`, Chuỗi `12 ngày`, Giờ tập trung `42.5 giờ` (`lines 117-122`).
  - Personal info form in localStorage (`campusos-profile-v1`), editable fields: `fullName`, `phone`, `major`, `university`, `bio` (`lines 130-136`).
  - Hardcoded 3 achievements (`Chuỗi 12 ngày`, `Deadline Master`, `Deep Focus`) (`lines 32-36`).
  - Fixed semester progress bar (`68%`, `12/18` credits, `28/31` tasks, `42/60h` study hours) (`lines 159-165`).
  - Static 3 recent activities (`lines 38-42`).
- **Missing Features vs R3 Specifications**:
  1. **Holographic Student Card**: Missing 3D tilt interaction (`perspective` + `rotateX`/`rotateY`), missing iridescent holographic foil sheen, missing CampusOS microchip / QR code authentication badge, and card flip/inspect ergonomics.
  2. **Competence / Skills Radar Chart**: Missing comprehensive multi-axis radar chart (neither SVG nor canvas radar chart is present on the page).
  3. **Credit & Academic Statistics**: Lacks graduation roadmap progress (e.g. 94/135 credits, 69.6%), missing credit breakdown (bắt buộc, tự chọn, đồ án tốt nghiệp), and GPA semester comparison.
  4. **Earned Badges Showcase**: Only 3 hardcoded static items; not linked to `campus-store.ts` (`state.badges`, `state.xp`, `state.level`, `state.rankTitle`, `state.streak`), missing tier levels (Đồng, Bạc, Vàng, Cyber/Bạch Kim) and detail modals.
  5. **Cyber-Glass Design Tokens**: Currently uses standard opaque shadcn border/card styles rather than `backdrop-blur-2xl bg-card/40 border border-white/10 hover:border-cyan-400/30`.

---

### 1.3 Inspection of Route `/notifications`
- **Location**: `web/src/app/(main)/notifications/page.tsx` (39 lines).
- **Existing Implementation**:
  - Filter state: `['Tất cả', 'Chưa đọc', 'Học tập', 'Lịch', 'Cộng đồng', 'Hệ thống']` (`line 35`).
  - Static array of 7 notifications (`lines 13-21`).
  - LocalStorage tracking for read IDs and removed IDs (`campusos-notifications-v1`) (`lines 28-29`).
  - Basic search input filtering title/detail (`line 30`).
  - Secondary component: `web/src/components/shared/notification-center.tsx` in Header (`web/src/components/layout/header.tsx:42`), which uses an independent storage key `campusos-notification-read-v1` (`line 21, 38`).
- **Missing Features vs R3 Specifications**:
  1. **Tab Structure**: Does NOT have the explicitly required 4 tabs: `Tất cả`, `Deadline`, `CLB`, `Học vụ`. Current tabs are generic categories.
  2. **Live Store Integration**: Notifications are static mock items; not generated from active deadlines or upcoming events in `campus-store.ts`.
  3. **Urgency Indicators**: No live countdown timers or neon red urgency badges for deadlines `< 12h`.
  4. **Bulk Management & Undo**: Delete action simply appends ID to `removed` array without a 5-second reversible Undo toast. No "Xóa tất cả đã đọc" option.
  5. **Cyber-Glass Design System**: Missing frosted glass cards (`backdrop-blur-2xl bg-card/40 border border-white/10 hover:border-cyan-400/30`) with neon category accents.

---

### 1.4 Inspection of Route `/settings`
- **Location**: `web/src/app/(main)/settings/page.tsx` (56 lines).
- **Existing Implementation**:
  - Vertical sidebar pills: `Giao diện`, `Giám sát Cực Đoan`, `Thông báo`, `Bảo mật`, `Dữ liệu` (`lines 15-21`).
  - Integrated with `<PomodoroSupervisorSettings />` (`web/src/features/pomodoro/pomodoro-supervisor-settings.tsx:45`) for Mèo Leo character/voice configuration (`lines 47`).
  - Theme choices: `light`, `dark`, `system` in `campusos-settings-v2` (`line 46`).
  - Compact view & Reduced motion toggles (`line 46`).
  - Push, deadlines, clubs, weekly email notification toggles (`line 48`).
  - Password and 2FA rows are dummy buttons without functional forms or modals (`lines 49`).
  - Data export button exports minimal JSON blob (`line 40`).
- **Missing Features vs R3 Specifications**:
  1. **Google Calendar Sync**: Completely missing! No Google Calendar card, connection status, OAuth mock connect button, auto-sync frequency selector, "Đồng bộ ngay" trigger, or ICS export trigger in `/settings`.
  2. **Account Security (Bảo mật tài khoản)**:
     - Missing change password modal/form with validation (current password, new password, confirm password, strength meter).
     - Missing Two-Factor Authentication (2FA) setup drawer/modal with QR code mockup, secret key copy, 6-digit TOTP verification input, and backup recovery codes.
     - Missing active login sessions / devices inspection.
  3. **Visual / Dark Mode Theme System**:
     - Missing the signature **Cyber Aurora** Gen Z theme preset (`data-vibe="aurora"` with cyan & violet ambient glow).
     - Reduced motion toggle in settings does not synchronize with `campus-store.ts.reducedMotion`.
  4. **Multi-Channel Notification Settings**:
     - Missing deadline alert threshold selection (30m, 2h, 1d, 2d).
     - Missing real browser push permission request integration (`Notification.requestPermission()`).
     - Missing Do Not Disturb during Focus Mode toggle.
  5. **Cyber-Glass Aesthetics**: Standard shadcn card borders instead of `backdrop-blur-2xl bg-card/40 border border-white/10`.

---

### 1.5 Shared Assets & Architectural Building Blocks
1. **`campus-store.ts` (`web/src/lib/campus-store.ts`)**:
   - Contains: `xp`, `level`, `rankTitle`, `streak`, `streakFreezes`, `studyMinutesTotal`, `weeklyStudyGoalMinutes`, `weeklyStudyMinutesCurrent`, `lastStudyDate`, `badges`, `vibeTheme`, `reducedMotion`, `tasks`, `deadlines`, `events`.
   - React hook: `useCampusStore()` (`lines 1368-1465`).
2. **`academic-engine.ts` (`web/src/lib/academic-engine.ts`)**:
   - Contains: `convertScale10To4`, `calculateSemesterGpa`, `calculateCumulativeCpa`, `SEED_SEMESTERS`, `SEED_COURSES`. Ideal for `/profile` credit & GPA calculations.
3. **`growth-engine.ts` (`web/src/lib/growth-engine.ts`)**:
   - Contains: `SEED_SKILLS`, `awardSkillXp`, skill category modeling.
4. **`knowledge-radar-chart.tsx` (`web/src/components/coach/knowledge-radar-chart.tsx`)**:
   - SVG radar chart implementation using concentric polygon rings and axis lines. Can be reused or adapted into a dedicated `CompetenceRadarChart` for `/profile`.
5. **`today-timeline.tsx` & `task-card.tsx`**:
   - Established 3D tilt pattern: `perspective(800px) rotateX(...) rotateY(...)` with smooth pointer interpolation and zero lag.

---

## 2. Logic Chain

1. **Premise 1**: The project requires rebuilding `/profile`, `/notifications`, and `/settings` under the Cyber-Glass design system (`backdrop-blur-2xl bg-card/40`, 1px neon borders `border-white/10`, `border-cyan-400/30`, fluid ambient aurora, `overflow-x-hidden`) and meeting 100% Quality Gates (0 TypeScript errors, 100% tests passing, clean build).
2. **Premise 2**: Current implementations of `/profile`, `/notifications`, and `/settings` are legacy minimal implementations using standard shadcn cards with hardcoded values and missing core functional requirements (holographic student card, competence radar, 4-tab notifications, Google Calendar sync, 2FA security).
3. **Premise 3**: Existing tests (291 passing) cover tasks, calendar, pomodoro, workspaces, academic engine, and coach engine, but contain **0 tests** for `/profile`, `/notifications`, or `/settings`.
4. **Deduction 4 (Profile Architecture)**:
   - `/profile` must be modularized into:
     - `holographic-student-card.tsx`: Interactive 3D tilt, holographic rainbow shimmer, QR pass, copyable student ID, avatar uploader.
     - `competence-radar-chart.tsx`: Pure SVG 6-axis radar (Lập trình, Thuật toán, Đồ án & Nhóm, Quản lý thời gian, Kỷ luật, Hoạt động CLB) with score tooltips and overall index score.
     - `credit-stats-card.tsx`: Degree progress (94/135 credits), required vs elective breakdown, GPA (3.62 CPA) and semester comparisons.
     - `achievements-showcase.tsx`: Tiered badges (Đồng, Bạc, Vàng, Cyber) dynamically tied to `campus-store.ts` (`state.badges`, `state.xp`, `state.streak`, `state.level`), with unlock detail dialog.
5. **Deduction 5 (Notifications Architecture)**:
   - `/notifications` must be rebuilt with:
     - 4 Dedicated Tabs: `Tất cả`, `Deadline`, `CLB`, `Học vụ`.
     - `notifications-engine.ts` helper in `src/lib/` to generate rich notification feeds by synthesizing static announcements with active deadlines and events from `campus-store.ts`.
     - Rich interactions: Mark read/unread, bulk mark all read, single delete with 5-second Undo toast, clear all read, urgency badge (< 12h red pulse).
     - Unification with Header's `NotificationCenter` popover.
6. **Deduction 6 (Settings Architecture)**:
   - `/settings` must be restructured into clear Cyber-Glass sections:
     - **Giao diện & Chủ đề**: Cyber Aurora, Dark OLED, Light Clean, System, plus `reducedMotion` (synced to store) and compact mode.
     - **Giám sát Cực Đoan**: Seamless preservation of `<PomodoroSupervisorSettings />`.
     - **Thông báo & Nhắc nhở**: Push permissions (`Notification.requestPermission()`), deadline threshold dropdown (30m, 2h, 1d, 2d), club alerts, email digest, DND mode.
     - **Bảo mật & Tài khoản**: Change password modal with validation & strength meter, 2FA setup modal with QR code & OTP verification, active device sessions.
     - **Đồng bộ Lịch Google Calendar**: Connection status, OAuth simulation, auto-sync toggle, sync frequency, category selectors, "Đồng bộ ngay" action with loading spin, and ICS export.
     - **Dữ liệu & Quyền riêng tư**: Full JSON export and danger zone.
7. **Deduction 7 (Quality Gates Architecture)**:
   - Implementers must create `web/tests/profile-notifications-settings.test.ts` covering:
     - Credit progress & percentage math.
     - Radar chart coordinate and normalization math.
     - Badge unlock conditions against store state.
     - Notification tab filtering, read/unread states, deletion & restore.
     - Settings theme & reduced motion sync, password validation, and Google Calendar sync config validation.

---

## 3. Caveats

1. **Real External OAuth / Google API**:
   - Google Calendar sync cannot make live external OAuth network calls in this offline/mock environment without external client secrets. The UI and store must implement full stateful simulation (connection state, sync interval, simulated last sync timestamp, payload generation, and real RFC-5545 `.ics` export fallback via `ics-calendar.ts`).
2. **Browser Push Notification Permissions**:
   - In automated test environments (Node.js test runner), `window.Notification` is undefined. Code must safely check `typeof window !== 'undefined' && 'Notification' in window`.
3. **Three.js vs SVG for Holographic Card & Radar**:
   - An instanced Three.js canvas for the card could be heavy and might cause layout jitter. CSS 3D transforms (`perspective(1000px) rotateX(...) rotateY(...)`) paired with radial-gradient sheen overlay and SVG microchip/QR vector graphics achieve genuine 120FPS performance with zero GPU memory overhead.
4. **LocalStorage Hydration**:
   - All components accessing `localStorage` must guard against SSR hydration mismatch using `useEffect` or `useSyncExternalStore`.

---

## 4. Conclusion

1. The current codebase is **100% build and type-safe** (`npm run typecheck` 0 errors, `npm test` 291/291 pass, `npm run build` 0 errors).
2. Existing `/profile`, `/notifications`, and `/settings` are functional placeholders lacking the required Cyber-Glass aesthetic and specific functional features (Holographic student card, Competence radar, 4-tab notifications, Google Calendar sync, 2FA security).
3. All necessary underlying engines (`campus-store.ts`, `academic-engine.ts`, `growth-engine.ts`, `gamification.ts`, `ics-calendar.ts`) already exist and provide solid foundational data models.
4. A clean, modular implementation roadmap is defined with dedicated sub-components and a new comprehensive test suite in `web/tests/profile-notifications-settings.test.ts`.

---

## 5. Verification Method

To independently verify the survey observations and baseline:

1. **Verify TypeScript Compilation**:
   ```bash
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run typecheck
   ```
   *Expected*: Code 0, 0 errors.

2. **Verify Existing Test Suites**:
   ```bash
   npm test
   ```
   *Expected*: Code 0, 291 tests pass across 17 test files.

3. **Verify Production Build**:
   ```bash
   npm run build
   ```
   *Expected*: Code 0, generates all 33 routes including `/profile`, `/notifications`, `/settings`.

4. **Inspect Route Files**:
   - View `web/src/app/(main)/profile/page.tsx`
   - View `web/src/app/(main)/notifications/page.tsx`
   - View `web/src/app/(main)/settings/page.tsx`
   - Verify that holographic card, competence radar, 4-tab notifications, and Google Calendar sync are currently absent in those files.

5. **Invalidation Conditions**:
   - If `npm run typecheck` or `npm test` fails, the baseline is compromised.
   - If Next.js App Router route structure `(main)` is altered, layouts could break.
