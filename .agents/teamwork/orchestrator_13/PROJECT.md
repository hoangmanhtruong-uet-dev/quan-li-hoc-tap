# Project: CampusOS Rebuild (R1 Workspaces, R2 Clubs, R3 Profile/Notifications/Settings)

## Architecture
- **Framework & Runtime**: Next.js 14.2.5 (App Router), React 18.3.1, TypeScript 5.5.4, Tailwind CSS 3.4.10, Node.js Native Test Runner (`node:test`, `node:assert/strict`).
- **Visual Aesthetic**: **Cyber-Glass** Gen Z high-tech aesthetic:
  - Frosted glassmorphism (`backdrop-blur-2xl bg-card/40` or `bg-slate-900/40`, `border border-white/10 hover:border-cyan-400/30`).
  - Fluid ambient aurora blobs (`bg-cyan-500/15`, `bg-purple-500/15`, `bg-emerald-500/15` with `blur-3xl`).
  - 120FPS GPU-accelerated interactive 3D canvases (Three.js with proper disposal, bounded DPR <= 2, and clean reduced-motion bypass).
  - Single-viewport bounded layout with `overflow-x-hidden min-w-0`.
- **Data Architecture & State Layer**:
  - Offline-first resilient reactive stores backed by `localStorage` with unified typed engines:
    - Workspaces: `src/lib/workspace-engine.ts` with RBAC matrix (`OWNER`, `ADMIN`, `MANAGER`, `MEMBER`, `VIEWER`).
    - Clubs: `src/lib/club-engine.ts` with committee departments, fund ledger, event registration, and task allocation.
    - Profile/Notif/Settings: `src/lib/campus-store.ts`, `src/lib/academic-engine.ts`, `src/lib/notifications-engine.ts`.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Workspaces Directory Page | Cyber-Glass list view of workspaces, filter by course/semester/type, 120FPS Three.js header, asymmetric bento stats, creation modal | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Workspace Detail Overview & Header | Course badge, progress ring, stacked avatars, role indicator, tab navigation | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Workspace RBAC System | Granular permission matrix for OWNER, ADMIN, MANAGER, MEMBER, VIEWER with role management and last-owner protection | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Workspace Group Kanban Board | 4-column drag-and-drop board (Cần làm, Đang làm, Chờ review, Hoàn thành), priority tags, subtask checklist, undo toast | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Workspace Shared Documents | Category grouping (Báo cáo, Slide, Mã nguồn, Tham khảo), metadata, upload modal, download simulation | M1 | ORIGINAL_REQUEST §R1 |
| 6 | Workspace Activity Log | Real-time audit stream of task transitions, member changes, document uploads | M1 | ORIGINAL_REQUEST §R1 |
| 7 | Club Discovery & Listing Hub | Rebuilt `/clubs` with Cyber-Glass cards, 4 unified clubs, category filters, 3D emblem | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Club Detail Overview Page | Rebuilt `/clubs/[id]` with cover banner, leadership info, committee breakdown, stats | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Club Events Subpage | `/clubs/[id]/events` with upcoming/past events, RSVP toggle, capacity check, calendar export | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Club Finance & Treasury Subpage | `/clubs/[id]/finance` with 3 funds (General, Event, Reserve), transaction ledger, category breakdown | M2 | ORIGINAL_REQUEST §R2 |
| 11 | Club Members & Committees Subpage | `/clubs/[id]/members` with 4 departments, role badges, member roster, role management | M2 | ORIGINAL_REQUEST §R2 |
| 12 | Club Committee Tasks Subpage | `/clubs/[id]/tasks` with committee-filtered Kanban board, priority badges, task modal | M2 | ORIGINAL_REQUEST §R2 |
| 13 | Holographic 3D Student Card | `/profile` 3D perspective tilt card with holographic shimmer, QR code, copyable student ID | M3 | ORIGINAL_REQUEST §R3 |
| 14 | 6-Axis Competence Radar Chart | `/profile` SVG radar chart covering 6 skill axes with score tooltips and index score | M3 | ORIGINAL_REQUEST §R3 |
| 15 | Academic Credit & GPA Progress | `/profile` graduation roadmap progress (94/135 credits), required vs elective, CPA | M3 | ORIGINAL_REQUEST §R3 |
| 16 | Tiered Achievements Showcase | `/profile` unlockable badges tied dynamically to `campus-store.ts` with tier medals | M3 | ORIGINAL_REQUEST §R3 |
| 17 | 4-Tab Notifications Center | `/notifications` tabs (`Tất cả`, `Deadline`, `CLB`, `Học vụ`), live deadline alerts, urgency indicator | M3 | ORIGINAL_REQUEST §R3 |
| 18 | Notification Actions & Undo | Mark read/unread, bulk mark all read, single delete with 5-second undo toast | M3 | ORIGINAL_REQUEST §R3 |
| 19 | Google Calendar Sync in Settings | `/settings` connection status, OAuth mock, auto-sync frequency, sync now, ICS export | M3 | ORIGINAL_REQUEST §R3 |
| 20 | Account Security & 2FA in Settings | `/settings` password change form with validation, 2FA setup modal with QR code & TOTP | M3 | ORIGINAL_REQUEST §R3 |
| 21 | Theme & Notification Preferences | `/settings` Cyber Aurora theme, push permissions, deadline threshold dropdown, Pomodoro settings integration | M3 | ORIGINAL_REQUEST §R3 |
| 22 | Quality Gates & Verification | npm run typecheck (0 errors), npm test (100% pass across 300+ tests), npm run build (clean 33+ pages) | M4 | ORIGINAL_REQUEST §Acceptance Criteria |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Workspaces & Projects (R1) | `/workspaces`, `/workspaces/[workspaceId]`, RBAC, Kanban, Docs, Activity Logs, `workspace-engine.ts`, tests | none | DONE |
| M2 | Student Clubs & Subpages (R2) | `/clubs`, `/clubs/[id]/*` (overview, events, finance, members, tasks), `club-engine.ts`, tests | none | DONE |
| M3 | Profile, Notifications & Settings (R3) | Holographic card, radar, credit stats, badges, 4-tab notifications, settings with GCal sync & 2FA, tests | none | DONE |
| M4 | Quality Gates & Forensic Audit | Typecheck 0 errors, npm test 100% pass, npm run build clean, adversarial stress testing & forensic audit | M1, M2, M3 | DONE |

---

## Code Layout
```
web/
├── src/
│   ├── app/
│   │   └── (main)/
│   │       ├── workspaces/
│   │       │   ├── page.tsx                             # [M1] Workspaces listing & hub
│   │       │   └── [workspaceId]/
│   │       │       └── page.tsx                         # [M1] Workspace detail with 4 Cyber-Glass tabs
│   │       ├── clubs/
│   │       │   ├── page.tsx                             # [M2] Rebuilt clubs discovery hub
│   │       │   └── [id]/
│   │       │       ├── page.tsx                         # [M2] Club overview
│   │       │       ├── events/page.tsx                  # [M2] Club events & RSVP
│   │       │       ├── finance/page.tsx                 # [M2] Club treasury & ledger
│   │       │       ├── members/page.tsx                 # [M2] Club members & committees
│   │       │       └── tasks/page.tsx                   # [M2] Club committee tasks
│   │       ├── profile/
│   │       │   └── page.tsx                             # [M3] Holographic card, radar, credit stats, badges
│   │       ├── notifications/
│   │       │   └── page.tsx                             # [M3] 4-tab notifications center with undo
│   │       └── settings/
│   │           └── page.tsx                             # [M3] Settings with GCal sync, 2FA, Cyber Aurora
│   ├── components/
│   │   ├── workspaces/                                  # [M1] Modular workspace components
│   │   │   ├── workspace-holo-3d.tsx
│   │   │   ├── workspace-card.tsx
│   │   │   ├── workspace-kanban.tsx
│   │   │   ├── workspace-documents.tsx
│   │   │   ├── workspace-members-rbac.tsx
│   │   │   ├── workspace-activity-log.tsx
│   │   │   └── create-workspace-modal.tsx
│   │   ├── clubs/                                       # [M2] Modular club components
│   │   │   ├── cyber-club-3d.tsx
│   │   │   ├── club-card.tsx
│   │   │   ├── club-hero.tsx
│   │   │   ├── club-nav-tabs.tsx
│   │   │   ├── club-events-view.tsx
│   │   │   ├── club-finance-view.tsx
│   │   │   ├── club-members-view.tsx
│   │   │   └── club-tasks-view.tsx
│   │   ├── profile/                                     # [M3] Modular profile components
│   │   │   ├── holographic-student-card.tsx
│   │   │   ├── competence-radar-chart.tsx
│   │   │   ├── academic-credit-stats.tsx
│   │   │   └── achievements-showcase.tsx
│   │   ├── notifications/                               # [M3] Modular notification components
│   │   │   └── notifications-manager.tsx
│   │   └── settings/                                    # [M3] Modular settings components
│   │       ├── google-calendar-sync-card.tsx
│   │       ├── security-2fa-modal.tsx
│   │       └── change-password-modal.tsx
│   ├── lib/
│   │   ├── workspace-engine.ts                          # [M1] Workspace models, seed data, reactive store
│   │   ├── club-engine.ts                               # [M2] Club models, seed data, treasury math, store
│   │   └── notifications-engine.ts                      # [M3] Notification synthesis & feeds
│   └── config/
│       └── nav.ts                                       # [M1] Sidebar navigation entry for workspaces
tests/
├── workspace-engine.test.ts                             # [M1] Unit tests for workspaces & RBAC
├── club-engine.test.ts                                  # [M2] Unit tests for clubs, finance & committees
└── profile-notifications-settings.test.ts               # [M3] Unit tests for profile, notifs, & settings
```

---

## Interface Contracts

### 1. Workspace Engine Contract (`src/lib/workspace-engine.ts`)
```typescript
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface WorkspaceTask {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  assigneeId?: string;
  status: 'todo' | 'doing' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  subtasks: { id: string; title: string; completed: boolean }[];
  createdAt: string;
}

export interface WorkspaceDocument {
  id: string;
  workspaceId: string;
  name: string;
  category: 'report' | 'slides' | 'source' | 'reference';
  fileSize: string;
  uploaderName: string;
  updatedAt: string;
  url?: string;
}

export interface WorkspaceActivityItem {
  id: string;
  workspaceId: string;
  actorName: string;
  actorAvatar: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface WorkspaceItem {
  id: string;
  name: string;
  description: string;
  courseCode: string;
  courseName: string;
  semester: string;
  type: 'project' | 'research' | 'competition';
  progressPercent: number;
  members: WorkspaceMember[];
  tasks: WorkspaceTask[];
  documents: WorkspaceDocument[];
  activities: WorkspaceActivityItem[];
  currentUserRole: WorkspaceRole;
}
```

### 2. Club Engine Contract (`src/lib/club-engine.ts`)
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
  createdByName: string;
}

export interface ClubEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
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

### 3. Profile & Notification Engine Contract (`src/lib/notifications-engine.ts`)
```typescript
export type NotificationTab = 'Tất cả' | 'Deadline' | 'CLB' | 'Học vụ';

export interface CampusNotification {
  id: string;
  title: string;
  detail: string;
  tab: NotificationTab;
  time: string;
  isRead: boolean;
  isUrgent?: boolean;
  actionHref?: string;
}
```
