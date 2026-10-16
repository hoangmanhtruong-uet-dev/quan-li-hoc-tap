# DISPATCH — Worker R2 Clubs (Milestone M2)

## Mission
Implement the full user-facing and state layer for Milestone M2: Câu lạc bộ sinh viên (`/clubs`, `/clubs/[id]`, and subpages `/events`, `/finance`, `/members`, `/tasks`) according to `PROJECT.md` and the Explorer R2 survey findings.

## Authoritative Inputs
- User Request: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md` (timestamp `## 2026-10-16T17:39:47Z`)
- Master Plan: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_13\PROJECT.md`
- Survey Findings & Blueprint: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_r2\handoff.md`
- Working Directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`
- Your Metadata Directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_r2_clubs\`

## Exclusive Write Boundaries
You own and may create or modify the following files:
- `src/lib/club-engine.ts`
- `src/components/clubs/*` (`cyber-club-3d.tsx`, `club-card.tsx`, `club-hero.tsx`, `club-nav-tabs.tsx`, `club-events-view.tsx`, `club-finance-view.tsx`, `club-members-view.tsx`, `club-tasks-view.tsx`, etc.)
- `src/app/(main)/clubs/page.tsx`
- `src/app/(main)/clubs/[id]/page.tsx`
- `src/app/(main)/clubs/[id]/events/page.tsx`
- `src/app/(main)/clubs/[id]/finance/page.tsx`
- `src/app/(main)/clubs/[id]/members/page.tsx`
- `src/app/(main)/clubs/[id]/tasks/page.tsx`
- `tests/club-engine.test.ts`
- (Purge empty rogue folder `src/app/clubs/` if present)
DO NOT touch any files belonging to M1 or M3.

## Architectural Requirements & Specifications
1. **Design System**: Strict Cyber-Glass aesthetic:
   - Frosted glassmorphism (`backdrop-blur-2xl bg-card/40 border border-white/10 hover:border-cyan-400/30`).
   - Fluid ambient aurora glows (`blur-3xl bg-cyan-500/15`, `bg-purple-500/15`, `bg-emerald-500/15`).
   - 120FPS Three.js canvas in `cyber-club-3d.tsx` (holographic university club emblem/shield, pointer reaction, DPR <= 2, WebGL resource disposal on unmount, reduced-motion bypass).
   - Strict single-viewport containment: `overflow-x-hidden min-w-0` on all grids and panels.
2. **Data & State (`src/lib/club-engine.ts`)**:
   - Models: `ClubDetail`, `ClubMember`, `ClubTransaction`, `ClubEvent`, `ClubTask`, `ClubDepartment`, `ClubRole`.
   - Seed data: 4 distinct university clubs:
     - `c1` Campus Tech Club (CTC) - 145 members, Hack Night, General fund 14.5M VND.
     - `c2` English Speaking Club (ESC) - 96 members, Debate Championship, General fund 8.2M VND.
     - `c3` CLB Nhiếp ảnh & Media (CPS) - 72 members, Photo Walk, General fund 5.4M VND.
     - `c4` CLB Cờ vua & Chiến thuật (CSC) - 48 members, Blitz Cup 2026, General fund 3.1M VND.
   - Reactive store: `useSyncExternalStore` with `localStorage` key `campusos-clubs-v2` and `CustomEvent('campusos-clubs-change')`.
   - **CRITICAL LESSON FROM M1**: Ensure `persistClubs` clones arrays and nested items so `Object.is(prev, next) === false` triggers React re-renders!
3. **Subpages Implementation**:
   - `/clubs`: Rebuild listing hub with 3D emblem header, category filter pills (Tất cả, Công nghệ, Ngoại ngữ, Nghệ thuật, Thể thao), search bar, bento metrics, and Cyber-Glass club cards.
   - `/clubs/[id]`: Rebuild overview with hero banner, leadership committee, department breakdown, upcoming event teaser, fund preview, and `club-nav-tabs.tsx`.
   - `/clubs/[id]/events`: Rebuild events subpage with upcoming/past event tabs, RSVP join/leave button with attendee counter, event detail modal, and `.ics` download or calendar sync.
   - `/clubs/[id]/finance`: Rebuild finance subpage with 3 fund balance cards (Quỹ chung, Quỹ sự kiện, Quỹ dự phòng), revenue/expense transaction ledger, category badges, and transaction recording modal.
   - `/clubs/[id]/members`: Rebuild members subpage with department filters (Ban Chủ nhiệm, Kỹ thuật, Media & Sự kiện, Đối ngoại & Tài chính), role badges, active score, and member invite modal.
   - `/clubs/[id]/tasks`: Rebuild tasks subpage with 4-column Kanban board (`Cần làm`, `Đang làm`, `Chờ review`, `Hoàn thành`), department tag filter, priority badges, and task modal.
4. **Unit Tests (`tests/club-engine.test.ts`)**:
   - Comprehensive tests covering:
     - Initial seed retrieval for all 4 clubs (verifying `c1` to `c4` are all retrievable without 404).
     - Financial calculations (income, expense, fund balance updates).
     - Event RSVP registration and capacity limit checks.
     - Committee task status transitions and progress calculation.
     - Member role assignment and department filtering.
     - Snapshot referential invalidation for `useSyncExternalStore`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A forensic auditor will independently verify your work.

## Completion Criteria
1. Run `npm run typecheck` inside `web/` — must pass with 0 errors.
2. Run `npm test` inside `web/` — must pass 100% of tests.
3. Run `npm run build` inside `web/` — must compile cleanly with 0 errors.
4. Write `handoff.md` to `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_r2_clubs\handoff.md`.
5. Send message back to orchestrator (`2edd309a-1f42-49e0-9c2a-571cbec23f81`).

## 2026-10-16T18:21:24Z
Read ORIGINAL_REQUEST.md at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (timestamp ## 2026-10-16T17:39:47Z).
Read PROJECT.md at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_13\PROJECT.md.
Read Explorer R2 findings at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_r2\handoff.md.
Read your DISPATCH.md at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_r2_clubs\DISPATCH.md.

Implement Milestone M2 (Student Clubs & Subpages - /clubs, /clubs/[id], /events, /finance, /members, /tasks, club-engine.ts, 120FPS 3D emblem, tests).
App working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web.
Your metadata working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_r2_clubs\.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A forensic auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Run verification commands: npm run typecheck, npm test, npm run build in web/.
Document all implementation details and verification test output in handoff.md.
When finished, send message back to orchestrator (ID: 2edd309a-1f42-49e0-9c2a-571cbec23f81) referencing your handoff.md path.
