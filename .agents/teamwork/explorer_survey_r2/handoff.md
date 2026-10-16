# Handoff Report: Explorer Survey R2 (Student Clubs)

**Date**: 2026-10-16T17:49:00Z  
**Author**: Explorer Survey Agent (Survey R2)  
**Recipient**: Orchestrator (`2edd309a-1f42-49e0-9c2a-571cbec23f81`)  
**Scope**: Codebase Investigation & Architecture Recommendation for R2: Câu lạc bộ sinh viên (`/clubs`, `/clubs/[id]`, `/clubs/[id]/events`, `/clubs/[id]/finance`, `/clubs/[id]/members`, `/clubs/[id]/tasks`).

---

## 1. Observation

### 1.1 Existing Routes and Files Hierarchy
Direct filesystem search revealed two distinct route trees related to `clubs`:
1. **Active App Router Route Group** (`web/src/app/(main)/clubs`):
   - `web/src/app/(main)/clubs/page.tsx` (41 lines, 10,477 bytes): Main listing page for student clubs.
   - `web/src/app/(main)/clubs/[id]/page.tsx` (51 lines, 2,048 bytes): Club detail overview.
   - `web/src/app/(main)/clubs/[id]/events/page.tsx` (36 lines, 1,453 bytes): Club events page.
   - `web/src/app/(main)/clubs/[id]/finance/page.tsx` (51 lines, 2,296 bytes): Club treasury / finance page.
   - `web/src/app/(main)/clubs/[id]/members/page.tsx` (36 lines, 1,446 bytes): Club member roster page.
   - `web/src/app/(main)/clubs/[id]/tasks/page.tsx` (30 lines, 1,121 bytes): Club committee tasks board.

2. **Rogue Empty Directory Tree** (`web/src/app/clubs`):
   - Directories: `web/src/app/clubs/[id]/events`, `finance`, `members`, `tasks`.
   - All subdirectories are completely empty (0 files).
   - In Next.js App Router, having parallel folders `web/src/app/clubs` and `web/src/app/(main)/clubs` introduces route resolution confusion or potential collision.

3. **No Existing Dedicated Club Components**:
   - `web/src/components/` has directories for `tasks`, `calendar`, `dashboard`, `living`, `roadmaps`, `study`, but **0 club components** (`find_by_name: *club*` in `web/src/components` returned 0 results).
   - All club pages currently rely on generic UI components (`@/components/ui/card`, `@/components/ui/badge`, `@/components/ui/button`) and `@/components/shared/page-placeholder`.

### 1.2 Data Dissonance & Mock Models
Direct inspection of code reveals fragmented and conflicting data models:

1. **`web/src/types/index.ts`** (Lines 25–32):
   ```typescript
   export interface Club {
     id: string;
     name: string;
     description: string;
     memberCount: number;
     coverImage: string;
     role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
   }
   ```
2. **`web/src/app/(main)/clubs/page.tsx`** (Lines 11–17):
   ```typescript
   type Club = { id: string; name: string; description: string; category: string; members: number; role?: string; icon: 'code' | 'camera' | 'trophy'; gradient: string; nextEvent: string };
   const clubs: Club[] = [
     { id: 'c1', name: 'Campus Tech Club', description: 'Cộng đồng lập trình, sản phẩm số và đổi mới sáng tạo trong trường.', category: 'Công nghệ', members: 145, role: 'Quản trị viên', icon: 'code', gradient: 'from-blue-500 to-cyan-400', nextEvent: 'Hack Night · 22/08' },
     { id: 'c2', name: 'English Speaking Club', description: 'Luyện phản xạ, thuyết trình và kết nối qua những chủ đề thú vị.', category: 'Ngoại ngữ', members: 96, role: 'Thành viên', icon: 'trophy', gradient: 'from-violet-500 to-fuchsia-400', nextEvent: 'Debate Night · 24/08' },
     { id: 'c3', name: 'Photography Society', description: 'Kể câu chuyện đời sống sinh viên qua nhiếp ảnh và video.', category: 'Nghệ thuật', members: 72, icon: 'camera', gradient: 'from-amber-500 to-rose-400', nextEvent: 'Photo Walk · 27/08' },
     { id: 'c4', name: 'Chess & Strategy', description: 'Rèn tư duy chiến thuật qua giải đấu và các buổi phân tích ván cờ.', category: 'Thể thao', members: 48, role: 'Thành viên', icon: 'trophy', gradient: 'from-emerald-500 to-teal-400', nextEvent: 'Blitz Cup · 30/08' },
   ];
   ```
3. **`web/src/data/mock.ts`** (Lines 48–52):
   ```typescript
   export const mockClubs: Club[] = [
     { id: 'c1', name: 'Tech Club', description: 'Programming and technology enthusiasts', memberCount: 45, coverImage: '', role: 'OWNER' },
     { id: 'c2', name: 'English Speaking Club', description: 'Practice English communication skills', memberCount: 32, coverImage: '', role: 'MEMBER' },
     { id: 'c3', name: 'Chess Club', description: 'Chess strategies and tournaments', memberCount: 18, coverImage: '', role: 'MEMBER' },
   ];
   ```
4. **Broken Dynamic Routing Between Pages**:
   - In `web/src/app/(main)/clubs/page.tsx` line 35, the card links to `/clubs/${club.id}` (supporting `c1`, `c2`, `c3`, `c4`).
   - In `web/src/app/(main)/clubs/[id]/page.tsx` line 21:
     `const club = mockClubs.find((c) => c.id === params.id);`
     `if (!club) return <PagePlaceholder title="Club not found" />;`
   - **Bug / Breakage**: Clicking `c4` ("Chess & Strategy") in the listing page results in **"Club not found"** because `c4` does not exist in `mockClubs`! Furthermore, `c1` in `mockClubs` is named "Tech Club" with 45 members, whereas in the listing page it is "Campus Tech Club" with 145 members.

### 1.3 Detailed Subpage Deficiencies
1. **Club Detail Overview (`/clubs/[id]`)**:
   - Uses `PagePlaceholder`. Only renders a 2-card grid (`Members: club.memberCount`, `Role: club.role`).
   - Lacks cover banner, club bio, department breakdown, leadership contacts, upcoming highlights, and quick action bar.
2. **Club Events (`/clubs/[id]/events`)**:
   - Uses `PagePlaceholder`. Renders a hardcoded local array of 2 English events (`Weekly Coding Workshop` on `Jul 13` and `Hackathon Planning` on `Jul 20`).
   - No RSVP action, no check-in QR, no event creation, no calendar sync (`campus-store.ts` / `.ics`).
3. **Club Finance (`/clubs/[id]/finance`)**:
   - Uses `PagePlaceholder`. Renders a static balance card and 3 hardcoded transactions in VND (`mockFinance`: 500,000đ dues, 150,000đ supplies, 200,000đ decorations).
   - No fund categories (Quỹ chung, Quỹ sự kiện, Quỹ dự phòng), no transaction creation modal, no receipt simulation, no balance forecasting.
4. **Club Members (`/clubs/[id]/members`)**:
   - Uses `PagePlaceholder`. Renders 4 static members (`Minh Nguyen`, `Anh Tran`, `Binh Le`, `Chi Pham`).
   - No division into committees/departments (Ban Chủ nhiệm, Ban Kỹ thuật, Ban Truyền thông, Ban Sự kiện, Ban Tài chính).
   - No role promotion/demotion, no member invite modal, no attendance/activity scores.
5. **Club Tasks (`/clubs/[id]/tasks`)**:
   - Filters `mockTasks.filter((t) => t.clubId === params.id)`. In `mockTasks`, only task `t3` ("Club meeting prep") has `clubId: 'c1'`. For clubs `c2`, `c3`, `c4`, it outputs `"No tasks yet."`.
   - No Kanban board, no committee allocation, no task creation modal, no priority badges, no sync to personal task board.

### 1.4 Visual Style vs Cyber-Glass Design System
- Current club pages are styled in basic shadcn/tailwind card boxes (`bg-card`, `border-border`).
- Missing Cyber-Glass design tokens:
  - Frosted glassmorphism (`backdrop-blur-2xl bg-card/40` or `bg-slate-900/40`).
  - 1px neon borders (`border-white/10`, `border-cyan-400/30`, `border-purple-400/20`).
  - Fluid ambient aurora blobs (`bg-cyan-500/15 blur-3xl`, `bg-purple-500/15 blur-3xl`, `bg-emerald-500/15 blur-3xl`).
  - Interactive 3D Canvas (Three.js 120FPS zero-lag, e.g. holographic club community emblem/mascot, matching `CyberDorm3D` in living or `QuestBoardHeader` in tasks).
  - Single-viewport bounded layout with `overflow-x-hidden`.

### 1.5 Quality Gates Baseline
- `npm run typecheck`: Exited with code 0 (clean).
- `npm test`: Runs `node --experimental-strip-types --test tests/*.test.ts`. Passed all 291 tests in 2.94s with 0 failures.
- No unit tests currently exist for student clubs (`tests/` contains `tasks`, `pomodoro`, `living`, `growth`, `academic`, `workspace-permissions`, but no `club-engine.test.ts`).

---

## 2. Logic Chain

1. **Premise 1 (Data Flow Inconsistency)**:
   - Observation 1.2 shows that `src/app/(main)/clubs/page.tsx` defines its own 4 hardcoded clubs (`c1`..`c4`) while `src/app/(main)/clubs/[id]/page.tsx` imports `mockClubs` from `@/data/mock.ts` which only has 3 items (`c1`..`c3`) with divergent properties.
   - Therefore, navigating to `/clubs/c4` leads to a 404/not-found state, and navigating to `c1` presents conflicting member counts and names.
   - **Conclusion**: A single source of truth (`src/lib/club-engine.ts`) is mandatory.

2. **Premise 2 (Placeholder Implementation Across All Subpages)**:
   - Observation 1.1 and 1.3 show that `[id]/page.tsx`, `[id]/events/page.tsx`, `[id]/finance/page.tsx`, `[id]/members/page.tsx`, and `[id]/tasks/page.tsx` all render minimal `<PagePlaceholder>` wrappers around 1-3 static mockup rows.
   - The user requirements explicitly mandate:
     - Quản lý sự kiện CLB (event registration, calendar export, schedule).
     - Thu chi quỹ câu lạc bộ (balance tracking, categories, revenue/expense management).
     - Phân bổ nhiệm vụ ban sự kiện (committee tasks, status, deadlines, assignees).
   - Therefore, all 5 pages under `/clubs/[id]/*` must be completely rebuilt with specialized, production-grade interactive views.

3. **Premise 3 (Cyber-Glass & 3D Visual System Alignment)**:
   - Observation 1.4 confirms that existing club pages lack all Cyber-Glass tokens and 3D graphics that are present in `/living` (`CyberDorm3D`), `/tasks` (`QuestBoardHeader`), and `/dashboard`.
   - Therefore, a modular Cyber-Glass component suite under `src/components/clubs/` with a lightweight Three.js 3D club canvas (`cyber-club-3d.tsx`) is required to achieve aesthetic parity.

4. **Premise 4 (Directory Hygiene)**:
   - Observation 1.1 shows empty directories in `web/src/app/clubs`.
   - In Next.js App Router, duplicate route segments between `app/clubs` and `app/(main)/clubs` risk hydration or routing conflicts.
   - Therefore, the empty `web/src/app/clubs` directory should be purged.

5. **Premise 5 (Verification & Test Coverage)**:
   - Observation 1.5 shows 291 unit tests with 0 tests for clubs.
   - To maintain quality gates and prevent regression, a comprehensive unit test suite (`tests/club-engine.test.ts`) must be created to verify club fund calculations, event registration constraints, committee task progress, and role permissions.

---

## 3. Caveats

1. **Read-Only Scope**:
   - As an explorer agent, no source code modifications were committed during this survey. Proposed implementations are structural designs to be executed by the builder/implementer.
2. **Backend Persistence Scope**:
   - The project currently uses a hybrid setup: local persistent reactive state (like `campus-store.ts` backed by `localStorage`), MySQL for workspace tables (`team_workspaces`), and Supabase Cloud for pomodoro/calendar/dashboard.
   - For clubs, since there is currently no MySQL or Supabase schema for clubs in the database migrations, the primary state layer should follow the pattern established by `living-engine.ts` (localStorage persistence `campusos-clubs-v2` with rich Vietnamese mock seed data) with ready hook-points for future backend syncing.
3. **Route Group Invariant**:
   - All rebuilds must strictly remain within `src/app/(main)/clubs` so they inherit `AppLayout`, `Sidebar`, `Header`, and authentication gates.

---

## 4. Conclusion & Implementation Architecture

### 4.1 Recommended File Architecture

```
web/src/
├── lib/
│   └── club-engine.ts                   # Central typed engine (models, seed data, math, localStorage sync)
├── components/
│   └── clubs/
│       ├── cyber-club-3d.tsx            # Three.js 120FPS interactive holographic club emblem/shield
│       ├── club-card.tsx                # Cyber-Glass club card for listing page
│       ├── club-hero.tsx                # Cyber-Glass hero banner with quick action CTAs & stats
│       ├── club-nav-tabs.tsx            # Subpage navigation tab bar with neon active pills
│       ├── events/
│       │   ├── club-events-view.tsx     # Upcoming/Past events, RSVP toggle, Calendar export
│       │   └── event-create-modal.tsx   # Modal to schedule new club workshop/event
│       ├── finance/
│       │   ├── club-finance-view.tsx    # Treasury HUD, fund breakdown, transaction ledger
│       │   └── transaction-modal.tsx    # Modal to record revenue/expense with category
│       ├── members/
│       │   ├── club-members-view.tsx    # Committee filter (Ban Chủ nhiệm, Kỹ thuật, Media...), roles
│       │   └── member-invite-modal.tsx  # Add/invite member & role assignment modal
│       └── tasks/
│           ├── club-tasks-view.tsx      # 4-column Kanban board (Todo, Doing, Review, Done)
│           └── club-task-modal.tsx      # Task creation modal with committee & assignee selector
├── app/
│   └── (main)/
│       └── clubs/
│           ├── page.tsx                 # Rebuilt Cyber-Glass club discovery & community hub
│           └── [id]/
│               ├── page.tsx             # Rebuilt club overview (HUD, committee stats, activity feed)
│               ├── events/page.tsx      # Rebuilt club events & registration
│               ├── finance/page.tsx     # Rebuilt club treasury & financial transparency
│               ├── members/page.tsx     # Rebuilt member roster & committee management
│               └── tasks/page.tsx       # Rebuilt committee task allocation & Kanban board
tests/
└── club-engine.test.ts                  # Comprehensive unit tests for financial math, RSVP, & committee logic
```

### 4.2 Data Model Specification (`club-engine.ts`)

```typescript
export type ClubRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
export type ClubDepartment = 'Ban Chủ nhiệm' | 'Ban Chuyên môn & Kỹ thuật' | 'Ban Truyền thông & Sự kiện' | 'Ban Đối ngoại & Tài chính';
export type TransactionType = 'income' | 'expense';
export type TransactionCategory = 'Hội phí' | 'Tài trợ' | 'Sự kiện' | 'Hậu cần & Thiết bị' | 'Khen thưởng';

export interface ClubMember {
  id: string;
  name: string;
  studentId: string;
  avatar: string;
  role: ClubRole;
  department: ClubDepartment;
  joinedDate: string;
  activeScore: number;
}

export interface ClubTransaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  date: string;
  createdById: string;
  createdByName: string;
}

export interface ClubEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;
  location: string;
  category: 'Workshop' | 'Hackathon' | 'Sinh hoạt' | 'Giao lưu';
  department: ClubDepartment;
  maxAttendees: number;
  attendeeIds: string[];
  bannerGradient: string;
}

export interface ClubTask {
  id: string;
  title: string;
  description: string;
  department: ClubDepartment;
  assigneeIds: string[];
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  eventId?: string;
}

export interface ClubDetail {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: 'Công nghệ' | 'Ngoại ngữ' | 'Nghệ thuật' | 'Thể thao';
  establishedYear: number;
  members: ClubMember[];
  events: ClubEvent[];
  transactions: ClubTransaction[];
  tasks: ClubTask[];
  generalFundBalance: number;
  eventFundBalance: number;
  reserveFundBalance: number;
  coverGradient: string;
  iconName: string;
  tags: string[];
}
```

### 4.3 Concrete Seed Data Recommendations
Anchor 4 realistic university clubs:
1. `c1` — **Campus Tech Club (CTC)**: 145 members, Hack Night, Google Cloud workshop, high balance (14.5M VND), 4 committees.
2. `c2` — **English Speaking Club (ESC)**: 96 members, Debate Championship, English Coffee Talk.
3. `c3` — **CLB Nhiếp ảnh & Media (CPS)**: 72 members, Photo Walk mùa thu, Thiết kế triển lãm.
4. `c4` — **CLB Cờ vua & Chiến thuật (CSC)**: 48 members, Blitz Cup 2026, Phân tích ván cờ thế giới.

---

## 5. Verification Method

To independently verify all findings and validate future implementations:

1. **Verify Existing Files and Inconsistencies**:
   ```bash
   # Confirm file locations in web directory
   fd "clubs" web/src/app
   # Verify data mismatch between mock.ts and clubs/page.tsx
   rg "mockClubs" web/src
   ```
2. **Verify Typecheck and Quality Gates**:
   ```bash
   cd web
   npm run typecheck
   npm test
   npm run build
   ```
   *Expectation*: 0 TypeScript errors, 291/291 tests pass, clean build.
3. **Invalidation Conditions**:
   - If `src/app/clubs/` contains untracked working files, it must be reconciled with `src/app/(main)/clubs/`.
   - If any club page breaks AppLayout or introduces horizontal overflow (`overflow-x-hidden` violation), layout compliance fails.
   - If test count regresses below 291 or any existing test fails.
