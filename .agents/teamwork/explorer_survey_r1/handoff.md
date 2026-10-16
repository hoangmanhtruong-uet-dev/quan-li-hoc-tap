# Handoff Report: R1 Nhóm học tập & Đồ án (`/workspaces`, `/workspaces/[workspaceId]`)

**Executive Summary**: Investigation confirms that the backend permission foundation for Workspaces RBAC (`OWNER`, `ADMIN`, `MANAGER`, `MEMBER`, `VIEWER`) is already solidly established in `web/src/lib/workspace-permissions.ts`, `web/src/lib/workspace-authorization.ts`, and `web/src/lib/workspace-service.ts`, supported by existing passing tests in `web/tests/workspace-permissions.test.ts`. However, the **frontend user interface is entirely unbuilt**: neither `/workspaces` nor `/workspaces/[workspaceId]` routes exist in `web/src/app/(main)/`, no navigation link exists in `src/config/nav.ts`, and no client-side workspace state management or group Kanban/document/audit log components currently exist. This report provides the exact findings and actionable architectural blueprint for full implementation.

---

## 1. Observation

### 1.1 Route & File Inventory

- **Frontend App Router (`web/src/app/(main)/`)**:
  - Found routes: `calendar/`, `clubs/`, `coach/`, `dashboard/`, `living/`, `notifications/`, `onboarding/`, `profile/`, `roadmaps/`, `settings/`, `skills/`, `study/`, `tasks/`.
  - **Result**: No `workspaces` directory exists anywhere inside `web/src/app/(main)/` or `web/src/app/`. The URLs `/workspaces` and `/workspaces/[workspaceId]` currently return 404.

- **Backend API Routes (`web/src/app/api/workspaces/`)**:
  - `src/app/api/workspaces/route.ts` (lines 1–19): Implements `GET` returning `{ workspaces: WorkspaceRow[] }` for the authenticated user using `listCurrentUserWorkspaces(user.id)`. Missing `POST` endpoint to create a workspace.
  - `src/app/api/workspaces/[workspaceId]/route.ts` (lines 1–18): Implements `GET` returning `{ workspace: WorkspaceRow }` using `getCurrentUserWorkspace(params.workspaceId)`.
  - `src/app/api/workspaces/[workspaceId]/memberships/[membershipId]/route.ts` (lines 1–39): Implements `PATCH` (updating membership role via `updateMembershipRole`) and `DELETE` (removing membership via `removeWorkspaceMembership`).

- **Navigation Configuration (`web/src/config/nav.ts`)**:
  - Lines 30–34:
    ```typescript
    {
      label: 'Cộng đồng',
      items: [
        { label: 'Nhóm & CLB', href: '/clubs', icon: 'users', segment: 'clubs' },
      ],
    }
    ```
    Currently only routes to `/clubs`. No navigation entry exists for `/workspaces`.

### 1.2 Permissions & Authorization Layer

- **`web/src/lib/workspace-permissions.ts`**:
  - Lines 1–5:
    ```typescript
    export const WORKSPACE_TYPES = ['PERSONAL', 'CLUB', 'HOUSEHOLD'] as const;
    export type WorkspaceType = (typeof WORKSPACE_TYPES)[number];
    export const WORKSPACE_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'] as const;
    export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];
    ```
  - Lines 7–23: Defines 15 granular permissions (`workspace.view`, `workspace.update`, `workspace.delete`, `member.view`, `member.invite`, `member.updateRole`, `member.remove`, `task.create`, `task.update`, `task.assign`, `task.delete`, `calendar.create`, `calendar.update`, `finance.view`, `finance.manage`).
  - Lines 29–50: `WORKSPACE_PERMISSION_MATRIX` maps each of the 5 roles to their permitted capabilities:
    - `OWNER`: All 15 permissions.
    - `ADMIN`: 13 permissions (cannot `workspace.delete`).
    - `MANAGER`: 9 permissions (cannot manage roles, cannot delete workspace or invite members).
    - `MEMBER`: 5 permissions (`workspace.view`, `member.view`, `task.create`, `task.update`, `calendar.create`).
    - `VIEWER`: Read-only (`workspace.view`, `member.view`, `finance.view`).
  - Lines 56–65: `canManageWorkspaceRole(actorRole, targetCurrentRole, targetNextRole)`:
    - `OWNER` can manage any role.
    - `ADMIN` can manage non-owner roles (`MEMBER`, `MANAGER`, `VIEWER`), but cannot alter or grant `OWNER`.
    - Other roles cannot manage roles.
  - Lines 67–72: `isLastOwnerChangeBlocked(targetRole, ownerCount)`: Protects against demoting or removing the final `OWNER`.

- **`web/src/lib/workspace-authorization.ts`**:
  - Implements `getWorkspaceMembership`, `requireWorkspaceMember`, `requireWorkspaceRole`, `requireWorkspacePermission`, and `assertCanManageWorkspaceRole`.

- **`web/src/lib/workspace-service.ts`**:
  - Implements MySQL transaction-guarded queries with `FOR UPDATE` pessimistic locking (`lockMembership`, `lockActorMembership`, `assertNotLastOwner`).

- **`web/tests/workspace-permissions.test.ts`**:
  - 6 unit tests verifying RBAC hierarchy, VIEWER read-only enforcement, ADMIN boundary constraints, and final OWNER protection. All pass.

### 1.3 Database Schema Reference (`DATABASE_SCHEMA.md`)

- Lines 120–154 describe the relational schema:
  - `team_workspaces`: `id`, `owner_user_id`, `name`, `description`, `progress_percent`, `created_at`, `updated_at`.
  - `team_memberships`: `id`, `team_workspace_id`, `user_id`, `role` (`OWNER`, `ADMIN`, `MANAGER`, `MEMBER`, `VIEWER`), `joined_at`.
  - `team_tasks`: `id`, `team_workspace_id`, `title`, `description`, `assignee_user_id`, `status` (`todo`, `doing`, `done`), `priority` (`low`, `medium`, `high`), `due_date`, `created_by_user_id`, `created_at`, `updated_at`.
  - `team_task_comments`: `id`, `team_task_id`, `user_id`, `comment_text`, `created_at`.
  - `uploaded_documents`: `id`, `user_id`, `filename`, `storage_path`, `content_type`, `access_scope` (`private`, `team`), `created_at`.

### 1.4 Baseline Test & Build Verification

- Command `npm run typecheck`: Exited with code 0 (TypeScript 5.5, 0 errors).
- Command `npm test`: Exited with code 0 (291 tests passed across 17 test suites, 0 failures).
- Command `npm run build`: Exited with code 0 (Next.js 14.2.5 generated 33/33 static pages successfully).

---

## 2. Logic Chain

1. **Requirement Premise**: R1 mandates rebuilding the "Nhóm học tập & Đồ án" module at `/workspaces` and `/workspaces/[workspaceId]`, featuring Cyber-Glass design, strict RBAC (`OWNER`, `ADMIN`, `MANAGER`, `MEMBER`, `VIEWER`), group project Kanban board, shared documents/resources, and real-time activity log.
2. **Current State Gap**:
   - Although the backend permissions and MySQL data structures exist in `web/src/lib/workspace-permissions.ts` and `web/src/lib/workspace-service.ts`, there are zero React components, zero pages, and zero client state stores for workspaces in `web/src/app/(main)/`.
   - Accessing `/workspaces` currently yields a 404 error.
3. **Architectural Pattern in CampusOS**:
   - Other complex modules follow a proven 3-tier architecture:
     - **Engine & Store** (`tasks-engine.ts`, `living-engine.ts`, `growth-engine.ts`) with comprehensive TypeScript types, realistic Vietnamese seed data, and localStorage reactive persistence.
     - **Cyber-Glass UI Layout** with frosted glass cards (`backdrop-blur-2xl bg-card/40 border border-white/10 hover:border-cyan-400/30`), fluid ambient aurora gradients, responsive layout (`overflow-x-hidden min-w-0`), and Three.js 120FPS graphics.
     - **Interactive Modals & Action Bars** for quick item creation, editing, undo toasts, and real-time activity tracking.
4. **Necessary Implementation Components for R1**:
   - **Data Layer (`src/lib/workspace-engine.ts`)**: Unified types (`WorkspaceItem`, `WorkspaceMember`, `WorkspaceTask`, `WorkspaceDocument`, `WorkspaceActivityItem`), realistic seed workspaces, and reactive hook `useWorkspaces()` with local storage persistence and hybrid sync fallback.
   - **RBAC Client Hook (`useWorkspacePermissions`)**: Client-side evaluation of allowed UI actions according to the existing `WORKSPACE_PERMISSION_MATRIX` to conditionally show/disable buttons (e.g. member role changes, task deletion, document management).
   - **Workspaces Overview Page (`src/app/(main)/workspaces/page.tsx`)**:
     - Three.js 120FPS Interactive Header (`WorkspaceHolo3D`: floating interconnected project nodes/milestones with parallax and particle effects).
     - Asymmetric Bento Metric Cards (Total active workspaces, Pending team tasks, Upcoming project deadlines, High-priority milestones).
     - Filter & Search Bar (Filter by Semester/Course, Type: Đồ án môn học / Nhóm nghiên cứu / Cuộc thi).
     - Cyber-Glass Workspace Cards with progress bars, stacked member avatars with role badges, recent activity snippets, and quick action links.
     - "Tạo nhóm đồ án mới" Modal with course selection, semester, name, and description.
   - **Workspace Detail Page (`src/app/(main)/workspaces/[workspaceId]/page.tsx`)**:
     - Header banner with course tag, progress circle, member count, and user's own role badge.
     - 4 Cyber-Glass Tabs:
       1. **Tab Kanban Đồ án**: 4 columns (`Cần làm` #7A8AA8, `Đang làm` #8B6CFF, `Chờ review` #FF8A3D, `Hoàn thành` #3DFFB0) with HTML5 drag-and-drop, task creation modal, assignee avatars, priority badges (`Gấp`, `Vừa`, `Thấp`), subtasks checklist progress, and undo toast.
       2. **Tab Tài liệu & Tài nguyên**: Category grouping (Báo cáo & Đề cương, Slide thuyết trình, Mã nguồn & Git repo, Dữ liệu & Tài liệu tham khảo), file size, uploader avatar/name, download/external link action, and document upload modal.
       3. **Tab Thành viên & Phân quyền RBAC**: Member table/grid displaying avatars, student names, emails, join dates, and current roles (`OWNER`, `ADMIN`, `MANAGER`, `MEMBER`, `VIEWER`). Role management dropdown enforcing `canManageWorkspaceRole` and `isLastOwnerChangeBlocked`. "Mời thành viên" modal with email and role selector.
       4. **Tab Nhật ký hoạt động (Audit Trail)**: Chronological event stream of task status changes, member promotions, and document uploads with live relative timestamps.
   - **Navigation & App Shell Integration**:
     - Update `src/config/nav.ts` to include `Nhóm & Đồ án` under `Học tập` or `Cộng đồng`.
     - Update `src/components/layout/sidebar.tsx` with appropriate icon (`layers` or `users`) and route active highlighting for `/workspaces`.
   - **API Enhancement**:
     - Add `POST /api/workspaces` to support creating new workspaces.
   - **Test Suite**:
     - Add comprehensive test suite in `tests/workspace-engine.test.ts` covering workspace creation, task Kanban status transitions, member role change validations under RBAC, and document addition.

---

## 3. Caveats

- **MySQL Database Connection in Dev vs Mock Mode**:
  - In local offline environments or static test runs without a live MySQL database, pages must not crash. `workspace-engine.ts` must implement an offline-first resilient architecture (reading from `localStorage` seeded with realistic data and safely attempting API sync when available), identical to the approach used by `campus-store.ts` and `living-engine.ts`.
- **Three.js Performance & SSR Safety**:
  - The 3D canvas must be rendered client-only (`use client` + `useEffect` or dynamic import `{ ssr: false }`) with explicit resource disposal on unmount (`geometry.dispose()`, `material.dispose()`, `renderer.dispose()`, `cancelAnimationFrame`), DPR capped at 2, and clean bypass for `prefers-reduced-motion`.
- **No Scope Creep into R2/R3**:
  - The scope for R1 is strictly bounded to Workspaces & Projects (`/workspaces`, `/workspaces/[workspaceId]`). Existing features in `/clubs`, `/profile`, `/settings`, etc., must be preserved without breaking existing tests.

---

## 4. Conclusion

The investigation is complete. The foundation for RBAC is solid and well-tested, but the entire user-facing surface for `/workspaces` is currently absent. 

An implementer agent can immediately proceed to build R1 following the proposed architectural blueprint:
1. Create `web/src/lib/workspace-engine.ts` with complete types, seed workspaces, and reactive store helpers.
2. Create `web/src/components/workspaces/` (3D Holo header, Kanban board, Documents tab, Members RBAC manager, Activity Log, Creation modals).
3. Build pages `web/src/app/(main)/workspaces/page.tsx` and `web/src/app/(main)/workspaces/[workspaceId]/page.tsx` using the Cyber-Glass design system (`backdrop-blur-2xl bg-card/40 border border-white/10`).
4. Update `web/src/config/nav.ts` and `web/src/components/layout/sidebar.tsx` for sidebar integration.
5. Create `web/tests/workspace-engine.test.ts` to verify full functionality.
6. Verify via `npm run typecheck`, `npm test`, and `npm run build`.

---

## 5. Verification Method

To independently verify this survey and future implementations:

1. **Type Safety Verification**:
   ```bash
   cd web
   npm run typecheck
   ```
   *Expected*: Exit code 0, 0 TypeScript errors.

2. **Unit Test Suite Execution**:
   ```bash
   cd web
   npm test
   ```
   *Expected*: All 291 existing tests plus new workspace tests pass with 0 failures.

3. **Production Static Page Compilation**:
   ```bash
   cd web
   npm run build
   ```
   *Expected*: Exit code 0; `/workspaces` and `/workspaces/[workspaceId]` compile cleanly as valid Next.js App Router routes without hydration or SSR errors.

4. **Visual & Layout Inspection**:
   - Inspect `/workspaces`: verify Cyber-Glass cards, Three.js 3D canvas, metric bentos, and creation modal.
   - Inspect `/workspaces/[workspaceId]`: verify Kanban drag-and-drop, Shared Documents list, Member RBAC management table, and Activity Log.
   - Confirm strict viewport containment (`overflow-x-hidden`, no horizontal scrollbar at any screen width).
