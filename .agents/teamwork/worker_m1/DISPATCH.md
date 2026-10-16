# DISPATCH — Worker M1: Workspaces & Projects (`/workspaces`, `/workspaces/[workspaceId]`)

## Mission
Implement the full user-facing and state layer for Milestone M1 (Nhóm học tập & Đồ án) according to `PROJECT.md` and the Explorer R1 survey findings.

## Authoritative Inputs
- User Request: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md` (timestamp `## 2026-10-16T17:39:47Z`)
- Master Plan: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_13\PROJECT.md`
- Survey Findings & Blueprint: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_r1\handoff.md`
- Working Directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`
- Metadata Directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1\`

## Exclusive Write Boundaries
You own and may modify or create the following files:
- `src/lib/workspace-engine.ts`
- `src/components/workspaces/*` (`workspace-holo-3d.tsx`, `workspace-card.tsx`, `workspace-kanban.tsx`, `workspace-documents.tsx`, `workspace-members-rbac.tsx`, `workspace-activity-log.tsx`, `create-workspace-modal.tsx`)
- `src/app/(main)/workspaces/page.tsx`
- `src/app/(main)/workspaces/[workspaceId]/page.tsx`
- `src/config/nav.ts` (adding 'Nhóm & Đồ án' link `/workspaces` with icon 'layers' or 'users')
- `tests/workspace-engine.test.ts`
DO NOT modify any existing test files or code outside these boundaries.

## Key Requirements & Specifications
1. **Design System**: Strict Cyber-Glass aesthetic:
   - Frosted glassmorphism (`backdrop-blur-2xl bg-card/40 border border-white/10 hover:border-cyan-400/30`).
   - Fluid ambient aurora glows (`blur-3xl bg-cyan-500/15`, `bg-purple-500/15`).
   - 120FPS Three.js canvas in `workspace-holo-3d.tsx` (interconnected project nodes/milestones, pointer parallax, requestAnimationFrame disposal on unmount, DPR capped at 2, fallback for reduced-motion).
   - Strict single-viewport containment: `overflow-x-hidden min-w-0` on all container grids.
2. **Data & State (`src/lib/workspace-engine.ts`)**:
   - Types: `WorkspaceItem`, `WorkspaceMember`, `WorkspaceTask`, `WorkspaceDocument`, `WorkspaceActivityItem`, `WorkspaceRole`.
   - Roles: `OWNER`, `ADMIN`, `MANAGER`, `MEMBER`, `VIEWER`.
   - Seed data: At least 3 realistic Vietnamese university project workspaces (e.g. "Đồ án Tốt nghiệp - AI Campus", "Mạng máy tính - Thiết kế hệ thống mạng", "Nghiên cứu khoa học - Học máy thị giác").
   - LocalStorage persistence (`campusos-workspaces-v2`) with custom hook `useWorkspaces()`.
   - RBAC helper: enforce `canManageWorkspaceRole(actorRole, targetCurrentRole, targetNextRole)` and `isLastOwnerChangeBlocked(targetRole, ownerCount)` from existing `src/lib/workspace-permissions.ts`.
3. **Workspaces Hub Page (`/workspaces`)**:
   - 120FPS 3D Header (`WorkspaceHolo3D`) with dynamic greeting and quick action button (`+ Tạo nhóm mới`).
   - Asymmetric Bento metric cards (Tổng nhóm hoạt động, Nhiệm vụ cần làm, Hạn chót đồ án gần nhất, Thành viên tích cực).
   - Filter & Search bar (By type: Đồ án môn học / Nghiên cứu / Cuộc thi; Search by name / course code).
   - Cyber-Glass workspace cards with progress ring/bar, stacked member avatars, recent activity teaser, and click-through to detail.
   - "Tạo nhóm mới" modal with form validation (Name, Course code, Course name, Semester, Description, Type).
4. **Workspace Detail Page (`/workspaces/[workspaceId]`)**:
   - Header with course tag, progress circle, member count, user role badge, and 4 Cyber-Glass tabs:
     - **Tab 1: Kanban Đồ án**: 4 columns (`Cần làm`, `Đang làm`, `Chờ review`, `Hoàn thành`) with drag-and-drop, task creation modal, assignee selection, priority tags, subtask progress, and undo toast.
     - **Tab 2: Tài liệu & Tài nguyên**: Grouped by category (Báo cáo & Đề cương, Slide thuyết trình, Mã nguồn, Tham khảo), file size, uploader avatar, download simulation, and document upload modal.
     - **Tab 3: Thành viên & Phân quyền**: Member grid/table with avatars, roles, join dates. Role management dropdown strictly enforcing RBAC capabilities (e.g. VIEWER cannot edit, ADMIN cannot demote OWNER). "Mời thành viên" modal.
     - **Tab 4: Nhật ký hoạt động**: Chronological audit feed of task transitions, member changes, and document uploads.
5. **Sidebar Navigation**:
   - Ensure `/workspaces` appears in `src/config/nav.ts` under "Học tập" or "Cộng đồng" with appropriate active highlighting.
6. **Unit Tests (`tests/workspace-engine.test.ts`)**:
   - Comprehensive tests using Node.js native test runner (`node:test`, `node:assert/strict`) verifying:
     - Workspace creation and initial seed retrieval.
     - Kanban task status transitions and subtask toggles.
     - RBAC role change validation (OWNER can update, ADMIN cannot demote OWNER, VIEWER cannot manage).
     - Document upload and category filtering.
     - Activity log recording.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Completion Criteria
1. Run `npm run typecheck` inside `web/` — must pass with 0 errors.
2. Run `npm test` inside `web/` — must pass 100% of tests (all existing 291 + new tests).
3. Run `npm run build` inside `web/` — must compile cleanly with 0 errors.
4. Write `handoff.md` to your metadata directory (`.agents/teamwork/worker_m1/handoff.md`) with verification evidence.
5. Send message back to orchestrator (`2edd309a-1f42-49e0-9c2a-571cbec23f81`).


## 2026-10-16T17:51:35Z
Implement Milestone M1 (Workspaces & Projects - /workspaces, /workspaces/[workspaceId], RBAC, Kanban, Docs, Activity Logs, Three.js 120FPS header, tests).
App working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web.
Your metadata working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1\.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Run verification commands: npm run typecheck, npm test, npm run build in web/.
Document all implementation details and verification test output in handoff.md.
When finished, send message back to orchestrator (ID: 2edd309a-1f42-49e0-9c2a-571cbec23f81) referencing your handoff.md path.
