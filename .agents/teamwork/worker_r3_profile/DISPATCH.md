# DISPATCH — Worker R3 Profile, Notifications & Settings (Milestone M3)

## Mission
Implement the full user-facing and state layer for Milestone M3: Hồ sơ, Thông báo & Cài đặt (`/profile`, `/notifications`, `/settings`) according to `PROJECT.md` and the Explorer R3 survey findings.

## Authoritative Inputs
- User Request: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md` (timestamp `## 2026-10-16T17:39:47Z`)
- Master Plan: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_13\PROJECT.md`
- Survey Findings & Blueprint: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_r3\handoff.md`
- Working Directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`
- Your Metadata Directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_r3_profile\`

## Exclusive Write Boundaries
You own and may create or modify the following files:
- `src/lib/notifications-engine.ts`
- `src/components/profile/*` (`holographic-student-card.tsx`, `competence-radar-chart.tsx`, `academic-credit-stats.tsx`, `achievements-showcase.tsx`)
- `src/components/notifications/*` (`notifications-manager.tsx`)
- `src/components/settings/*` (`google-calendar-sync-card.tsx`, `security-2fa-modal.tsx`, `change-password-modal.tsx`)
- `src/app/(main)/profile/page.tsx`
- `src/app/(main)/notifications/page.tsx`
- `src/app/(main)/settings/page.tsx`
- `tests/profile-notifications-settings.test.ts`
DO NOT modify any files belonging to M1 or M2.

## Detailed Requirements & Specifications
1. **Design System**: Strict Cyber-Glass aesthetic:
   - Frosted glassmorphism (`backdrop-blur-2xl bg-card/40 border border-white/10 hover:border-cyan-400/30`).
   - Fluid ambient aurora glows (`blur-3xl bg-cyan-500/15`, `bg-purple-500/15`, `bg-emerald-500/15`).
   - Strict single-viewport containment: `overflow-x-hidden min-w-0` on all container layouts.
2. **Rebuild `/profile`**:
   - **Holographic Student Card (`holographic-student-card.tsx`)**:
     - 3D perspective tilt effect (`perspective(1000px) rotateX(...) rotateY(...)`) reactive to pointer.
     - Iridescent holographic rainbow sheen overlay with dynamic angle.
     - CampusOS golden authentication microchip, QR pass code, copyable student ID (`21020485`), and avatar uploader.
   - **Competence / Skills Radar Chart (`competence-radar-chart.tsx`)**:
     - Pure SVG 6-axis radar chart (Lập trình, Thuật toán, Đồ án & Nhóm, Quản lý thời gian, Kỷ luật, Hoạt động CLB) with polygon coordinate math, score tooltips, and overall index score badge.
   - **Academic Credit & GPA Stats (`academic-credit-stats.tsx`)**:
     - Graduation roadmap progress bar (94/135 credits, 69.6%), required vs elective credits breakdown, CPA (3.62/4.0), and semester comparison chart.
   - **Achievements Showcase (`achievements-showcase.tsx`)**:
     - Tiered badges (Đồng, Bạc, Vàng, Cyber) dynamically tied to `campus-store.ts` (`state.badges`, `state.xp`, `state.streak`, `state.level`), with unlock detail dialog.
3. **Rebuild `/notifications`**:
   - **4 Dedicated Tabs**: `Tất cả`, `Deadline`, `CLB`, `Học vụ`.
   - **`src/lib/notifications-engine.ts`**:
     - Synthesizes notification feed by combining administrative notices with active deadlines and upcoming events from `campus-store.ts`.
     - Live urgency indicator: red ping for deadlines `< 12h`.
   - **Interactive Actions**:
     - Mark as read / mark as unread.
     - Bulk "Đánh dấu tất cả đã đọc".
     - Single delete with 5-second reversible Undo toast.
     - "Xóa tất cả đã đọc" action.
4. **Rebuild `/settings`**:
   - **Giao diện & Chủ đề**: Cyber Aurora, Dark OLED, Light Clean, System, plus `reducedMotion` toggle synced to `campus-store.ts`.
   - **Giám sát Cực Đoan**: Preserve `<PomodoroSupervisorSettings />` for Mèo Leo supervisor integration.
   - **Bảo mật & Tài khoản**:
     - Change password modal with current password, new password, confirm password, and strength meter.
     - 2FA setup modal with simulated QR code, secret key copy, 6-digit TOTP input, and backup recovery codes.
   - **Đồng bộ Lịch Google Calendar**:
     - Connection status card (Google Workspace / cá nhân).
     - Auto-sync toggle & sync interval (15 phút, 1 giờ, 6 giờ, thủ công).
     - Category selectors (Lớp học, Deadline, CLB).
     - "Đồng bộ ngay" action with animated spinning state and last sync timestamp.
     - "Xuất file .ics" action triggering standard RFC 5545 export.
5. **Unit Tests (`tests/profile-notifications-settings.test.ts`)**:
   - Comprehensive unit tests using Node.js native test runner (`node:test`, `node:assert/strict`) verifying:
     - Credit percentage and remaining credit calculations.
     - Radar chart 6-axis polygon coordinate normalization.
     - Notification tab filtering, read/unread states, and delete-with-restore logic.
     - Settings theme and reduced motion synchronization.
     - Password strength validation rules.
     - Google Calendar sync configuration and payload simulation.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A forensic auditor will independently verify your work.

## Completion Criteria
1. Run `npm run typecheck` inside `web/` — must pass with 0 errors.
2. Run `npm test` inside `web/` — must pass 100% of tests (all existing 307 + new tests).
3. Run `npm run build` inside `web/` — must compile cleanly with 0 errors.
4. Write `handoff.md` to `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_r3_profile\handoff.md`.
5. Send message back to orchestrator (`2edd309a-1f42-49e0-9c2a-571cbec23f81`).


## 2026-10-16T18:40:34Z
[Message] sender=2edd309a-1f42-49e0-9c2a-571cbec23f81 priority=MESSAGE_PRIORITY_HIGH
Read ORIGINAL_REQUEST.md at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (timestamp ## 2026-10-16T17:39:47Z).
Read PROJECT.md at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_13\PROJECT.md.
Read Explorer R3 findings at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_r3\handoff.md.
Read your DISPATCH.md at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_r3_profile\DISPATCH.md.

Implement Milestone M3 (Profile, Notifications & Settings - /profile with holographic card & radar, /notifications with 4 tabs & undo, /settings with Google Calendar sync & 2FA, tests).
App working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web.
Your metadata working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_r3_profile\.
