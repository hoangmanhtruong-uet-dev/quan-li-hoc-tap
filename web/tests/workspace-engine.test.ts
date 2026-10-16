import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getInitialWorkspaces,
  getStoredWorkspaces,
  persistWorkspaces,
  resetWorkspacesToDefault,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  createWorkspaceTask,
  updateWorkspaceTask,
  moveWorkspaceTask,
  deleteWorkspaceTask,
  toggleWorkspaceSubtask,
  addWorkspaceDocument,
  deleteWorkspaceDocument,
  inviteWorkspaceMember,
  changeWorkspaceMemberRole,
  removeWorkspaceMember,
  addWorkspaceActivity,
  calculateWorkspaceProgress,
  getWorkspaceMetrics,
  canManageWorkspaceRole,
  isLastOwnerChangeBlocked,
  hasWorkspacePermission,
  WORKSPACE_ROLES,
  WORKSPACE_PERMISSIONS,
  WORKSPACE_PERMISSION_MATRIX,
  type WorkspaceItem,
  type WorkspaceTask,
  type WorkspaceRole,
} from '../src/lib/workspace-engine.ts';

test('M1 Workspaces - Initial Seed: provides at least 3 realistic Vietnamese academic workspaces', () => {
  const seed = getInitialWorkspaces();
  assert.ok(Array.isArray(seed), 'Seed must be an array');
  assert.ok(seed.length >= 3, `Expected at least 3 workspaces, got ${seed.length}`);

  const aiCapstone = seed.find((w) => w.id === 'ws-ai-capstone');
  assert.ok(aiCapstone, 'Must include AI Capstone workspace');
  assert.equal(aiCapstone.courseCode, 'IT4900');
  assert.equal(aiCapstone.currentUserRole, 'OWNER');
  assert.ok(aiCapstone.members.length >= 3, 'Must have at least 3 members');
  assert.ok(aiCapstone.tasks.length >= 4, 'Must have at least 4 tasks across columns');
  assert.ok(aiCapstone.documents.length >= 3, 'Must have at least 3 documents');
  assert.ok(aiCapstone.activities.length >= 1, 'Must have initial activities');

  const netDesign = seed.find((w) => w.id === 'ws-net-design');
  assert.ok(netDesign, 'Must include Computer Networks workspace');
  assert.equal(netDesign.courseCode, 'IT3080');

  const visionNckh = seed.find((w) => w.id === 'ws-vision-nckh');
  assert.ok(visionNckh, 'Must include Vision NCKH workspace');
  assert.equal(visionNckh.type, 'research');
});

test('M1 Workspaces - Progress Calculation: computes correct percentage based on completed tasks', () => {
  // Empty tasks
  assert.equal(calculateWorkspaceProgress([]), 0);

  // 1 of 4 completed
  const tasks4: WorkspaceTask[] = [
    { id: 't1', workspaceId: 'w', title: 'Task 1', description: '', status: 'done', priority: 'medium', dueDate: '', subtasks: [], createdAt: '' },
    { id: 't2', workspaceId: 'w', title: 'Task 2', description: '', status: 'todo', priority: 'medium', dueDate: '', subtasks: [], createdAt: '' },
    { id: 't3', workspaceId: 'w', title: 'Task 3', description: '', status: 'doing', priority: 'medium', dueDate: '', subtasks: [], createdAt: '' },
    { id: 't4', workspaceId: 'w', title: 'Task 4', description: '', status: 'review', priority: 'medium', dueDate: '', subtasks: [], createdAt: '' },
  ];
  assert.equal(calculateWorkspaceProgress(tasks4), 25);

  // 3 of 4 completed
  tasks4[1]!.status = 'done';
  tasks4[2]!.status = 'done';
  assert.equal(calculateWorkspaceProgress(tasks4), 75);

  // 4 of 4 completed
  tasks4[3]!.status = 'done';
  assert.equal(calculateWorkspaceProgress(tasks4), 100);
});

test('M1 Workspaces - CRUD Lifecycle: create, retrieve, update, and delete workspace', () => {
  resetWorkspacesToDefault();

  // 1. Create workspace
  const created = createWorkspace({
    name: 'Đồ án Hệ điều hành nâng cao',
    description: 'Xây dựng Kernel module và lập lịch CPU phân cấp.',
    courseCode: 'IT3070',
    courseName: 'Hệ điều hành',
    semester: 'Học kỳ 1 - 2026',
    type: 'project',
  });

  assert.ok(created.id.startsWith('ws-'));
  assert.equal(created.name, 'Đồ án Hệ điều hành nâng cao');
  assert.equal(created.courseCode, 'IT3070');
  assert.equal(created.currentUserRole, 'OWNER');
  assert.equal(created.members.length, 1);
  assert.equal(created.members[0]?.role, 'OWNER');
  assert.equal(created.progressPercent, 0);

  // 2. Retrieve
  const fetched = getWorkspaceById(created.id);
  assert.ok(fetched, 'Workspace should be retrievable by ID');
  assert.equal(fetched.name, created.name);

  // 3. Update
  const updated = updateWorkspace(created.id, {
    description: 'Mô tả đã được cập nhật sau buổi họp đầu tiên với GVHD.',
  });
  assert.ok(updated);
  assert.equal(updated.description, 'Mô tả đã được cập nhật sau buổi họp đầu tiên với GVHD.');

  // 4. Delete
  const deleted = deleteWorkspace(created.id);
  assert.equal(deleted, true);
  assert.equal(getWorkspaceById(created.id), undefined);
});

test('M1 Workspaces - Kanban Task Management: create, update, move columns, and subtask toggles', () => {
  resetWorkspacesToDefault();

  const ws = getInitialWorkspaces()[0]!;
  assert.ok(ws);

  // 1. Create a new task
  const initialTaskCount = ws.tasks.length;
  const createdTask = createWorkspaceTask(ws.id, {
    title: 'Thiết kế giao diện Cyber-Glass bằng Tailwind v4',
    description: 'Tối ưu hóa kính mờ và màu neon acid lime',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-10-30',
    subtasks: [
      { id: 'sub-ui-1', title: 'Tạo bảng màu neon', completed: false },
      { id: 'sub-ui-2', title: 'Viết component card kính mờ', completed: false },
    ],
  });

  assert.ok(createdTask);
  assert.ok(createdTask.id.startsWith('task-'));
  assert.equal(createdTask.title, 'Thiết kế giao diện Cyber-Glass bằng Tailwind v4');

  const wsAfterCreate = getWorkspaceById(ws.id)!;
  assert.equal(wsAfterCreate.tasks.length, initialTaskCount + 1);

  // 2. Toggle subtask
  const toggled = toggleWorkspaceSubtask(ws.id, createdTask.id, 'sub-ui-1');
  assert.ok(toggled);
  const sub1 = toggled.subtasks.find((s) => s.id === 'sub-ui-1');
  assert.equal(sub1?.completed, true);

  // Toggle back
  const toggledBack = toggleWorkspaceSubtask(ws.id, createdTask.id, 'sub-ui-1');
  assert.ok(toggledBack);
  assert.equal(toggledBack.subtasks.find((s) => s.id === 'sub-ui-1')?.completed, false);

  // 3. Update task
  const updatedTask = updateWorkspaceTask(ws.id, createdTask.id, {
    priority: 'low',
    description: 'Đã đổi độ ưu tiên xuống thấp',
  });
  assert.ok(updatedTask);
  assert.equal(updatedTask.priority, 'low');

  // 4. Move task through Kanban columns
  const movedDoing = moveWorkspaceTask(ws.id, createdTask.id, 'doing');
  assert.ok(movedDoing);
  assert.equal(movedDoing.status, 'doing');

  const movedReview = moveWorkspaceTask(ws.id, createdTask.id, 'review');
  assert.ok(movedReview);
  assert.equal(movedReview.status, 'review');

  const movedDone = moveWorkspaceTask(ws.id, createdTask.id, 'done');
  assert.ok(movedDone);
  assert.equal(movedDone.status, 'done');

  // Verify activity log captured the transition
  const wsAfterDone = getWorkspaceById(ws.id)!;
  assert.ok(
    wsAfterDone.activities.some((a) => a.action.includes('Hoàn thành') || a.target === createdTask.title),
    'Activity log should record the task state change'
  );

  // 5. Delete task
  const deleted = deleteWorkspaceTask(ws.id, createdTask.id);
  assert.equal(deleted, true);
  const wsAfterDelete = getWorkspaceById(ws.id)!;
  assert.equal(wsAfterDelete.tasks.length, initialTaskCount);
});

test('M1 Workspaces - RBAC Role Enforcement: strict permissions, promotion boundaries and last-owner protection', () => {
  resetWorkspacesToDefault();

  // 1. Permission checks
  assert.equal(hasWorkspacePermission('OWNER', 'workspace.delete'), true);
  assert.equal(hasWorkspacePermission('ADMIN', 'workspace.delete'), false);
  assert.equal(hasWorkspacePermission('ADMIN', 'member.invite'), true);
  assert.equal(hasWorkspacePermission('MANAGER', 'member.invite'), false);
  assert.equal(hasWorkspacePermission('MANAGER', 'task.create'), true);
  assert.equal(hasWorkspacePermission('MEMBER', 'task.delete'), false);
  assert.equal(hasWorkspacePermission('VIEWER', 'task.create'), false);

  // 2. Role management permissions
  // OWNER can change anyone to anything
  assert.equal(canManageWorkspaceRole('OWNER', 'ADMIN', 'MANAGER'), true);
  assert.equal(canManageWorkspaceRole('OWNER', 'MEMBER', 'OWNER'), true);

  // ADMIN can change non-owners among non-owner roles
  assert.equal(canManageWorkspaceRole('ADMIN', 'MEMBER', 'MANAGER'), true);
  assert.equal(canManageWorkspaceRole('ADMIN', 'MANAGER', 'VIEWER'), true);

  // ADMIN CANNOT touch OWNER or promote to OWNER
  assert.equal(canManageWorkspaceRole('ADMIN', 'OWNER', 'ADMIN'), false);
  assert.equal(canManageWorkspaceRole('ADMIN', 'MEMBER', 'OWNER'), false);

  // MANAGER, MEMBER, VIEWER cannot manage roles at all
  assert.equal(canManageWorkspaceRole('MANAGER', 'MEMBER', 'VIEWER'), false);
  assert.equal(canManageWorkspaceRole('MEMBER', 'VIEWER', 'MEMBER'), false);
  assert.equal(canManageWorkspaceRole('VIEWER', 'MEMBER', 'VIEWER'), false);

  // 3. Last OWNER Protection
  assert.equal(isLastOwnerChangeBlocked('OWNER', 1), true, 'Sole OWNER must be protected');
  assert.equal(isLastOwnerChangeBlocked('OWNER', 2), false, 'When >=2 owners, demotion allowed');
  assert.equal(isLastOwnerChangeBlocked('ADMIN', 1), false, 'ADMIN is not subject to last-owner lock');

  // 4. Live Workspace Member Role Changing
  const ws = getInitialWorkspaces()[0]!;
  assert.ok(ws);

  // Add a test member
  const newMember = inviteWorkspaceMember(ws.id, {
    name: 'Đoàn Nhật Nam',
    email: 'nam.dn2103@sis.hust.edu.vn',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    role: 'MEMBER',
  });
  assert.ok(newMember);

  // Actor OWNER modifies MEMBER to MANAGER: Allowed
  const res1 = changeWorkspaceMemberRole(ws.id, newMember.id, 'MANAGER', 'OWNER');
  assert.equal(res1.success, true);
  assert.equal(res1.member?.role, 'MANAGER');

  // Actor ADMIN modifies MANAGER to VIEWER: Allowed
  const res2 = changeWorkspaceMemberRole(ws.id, newMember.id, 'VIEWER', 'ADMIN');
  assert.equal(res2.success, true);
  assert.equal(res2.member?.role, 'VIEWER');

  // Actor ADMIN attempts to promote to OWNER: BLOCKED
  const res3 = changeWorkspaceMemberRole(ws.id, newMember.id, 'OWNER', 'ADMIN');
  assert.equal(res3.success, false);
  assert.ok(res3.error?.includes('không có quyền'));

  // Actor MEMBER attempts to change role: BLOCKED
  const res4 = changeWorkspaceMemberRole(ws.id, newMember.id, 'ADMIN', 'MEMBER');
  assert.equal(res4.success, false);

  // Attempt to demote sole OWNER: BLOCKED
  const ownerMem = ws.members.find((m) => m.role === 'OWNER')!;
  assert.ok(ownerMem);
  const resDemoteOwner = changeWorkspaceMemberRole(ws.id, ownerMem.id, 'ADMIN', 'OWNER');
  assert.equal(resDemoteOwner.success, false);
  assert.ok(resDemoteOwner.error?.includes('OWNER duy nhất'));

  // Attempt to remove sole OWNER: BLOCKED
  const resRemoveOwner = removeWorkspaceMember(ws.id, ownerMem.id, 'OWNER');
  assert.equal(resRemoveOwner.success, false);
  assert.ok(resRemoveOwner.error?.includes('OWNER duy nhất'));

  // Removing regular member by OWNER: Allowed
  const resRemove = removeWorkspaceMember(ws.id, newMember.id, 'OWNER');
  assert.equal(resRemove.success, true);
});

test('M1 Workspaces - Document Management: add, categorize, and delete shared project files', () => {
  resetWorkspacesToDefault();
  const ws = getInitialWorkspaces()[0]!;

  const initialDocCount = ws.documents.length;

  // Add document
  const added = addWorkspaceDocument(ws.id, {
    name: 'Bao-cao-Kien-truc-Microservices.pdf',
    category: 'report',
    fileSize: '5.6 MB',
    uploaderName: 'Nguyễn Văn Minh',
    url: '#',
  });

  assert.ok(added);
  assert.ok(added.id.startsWith('doc-'));
  assert.equal(added.category, 'report');

  const wsAfterAdd = getWorkspaceById(ws.id)!;
  assert.equal(wsAfterAdd.documents.length, initialDocCount + 1);

  // Delete document
  const deleted = deleteWorkspaceDocument(ws.id, added.id);
  assert.equal(deleted, true);

  const wsAfterDelete = getWorkspaceById(ws.id)!;
  assert.equal(wsAfterDelete.documents.length, initialDocCount);
});

test('M1 Workspaces - Activity Log & Metrics: records audit trail and computes hub metrics accurately', () => {
  resetWorkspacesToDefault();
  const seed = getInitialWorkspaces();

  // Test add activity
  const ws = seed[0]!;
  const act = addWorkspaceActivity(ws.id, {
    actorName: 'Nguyễn Văn Minh',
    actorAvatar: 'https://images.unsplash.com/photo-1534528741775',
    action: 'đã tải lên phiên bản mã nguồn mới',
    target: 'commit-f89a2b',
  });

  assert.ok(act);
  assert.equal(act.workspaceId, ws.id);
  assert.equal(act.target, 'commit-f89a2b');

  // Test metrics computation
  const metrics = getWorkspaceMetrics(seed);
  assert.equal(metrics.totalWorkspaces, seed.length);
  assert.ok(metrics.pendingTasks >= 0);
  assert.ok(metrics.completedTasks >= 0);
  assert.ok(metrics.totalMembers >= 3);
  assert.ok(metrics.completionRate >= 0 && metrics.completionRate <= 100);
});

test('M1 Workspaces - Snapshot Referential Invalidation: ensures useSyncExternalStore detects state mutations', () => {
  resetWorkspacesToDefault();

  // 1. Invalidation on createWorkspaceTask
  const snap1 = getStoredWorkspaces();
  const wsId = snap1[0]!.id;
  const createdTask = createWorkspaceTask(wsId, {
    title: 'Nhiệm vụ kiểm tra tính bất biến snapshot',
    description: 'Đảm bảo React 18 useSyncExternalStore re-render đúng khi thêm task',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-10-25',
    subtasks: [
      { id: 'sub-test-1', title: 'Subtask 1', completed: false },
    ],
  });
  assert.ok(createdTask);
  const snap2 = getStoredWorkspaces();
  assert.equal(Object.is(snap1, snap2), false, 'Snapshot reference must change after createWorkspaceTask');
  assert.equal(Object.is(snap1[0], snap2[0]), false, 'Workspace item reference must change after task creation');

  // 2. Invalidation on moveWorkspaceTask
  const snap3 = getStoredWorkspaces();
  const movedTask = moveWorkspaceTask(wsId, createdTask.id, 'doing');
  assert.ok(movedTask);
  const snap4 = getStoredWorkspaces();
  assert.equal(Object.is(snap3, snap4), false, 'Snapshot reference must change after moveWorkspaceTask');

  // 3. Invalidation on toggleWorkspaceSubtask
  const snap5 = getStoredWorkspaces();
  const toggledTask = toggleWorkspaceSubtask(wsId, createdTask.id, 'sub-test-1');
  assert.ok(toggledTask);
  const snap6 = getStoredWorkspaces();
  assert.equal(Object.is(snap5, snap6), false, 'Snapshot reference must change after toggleWorkspaceSubtask');

  // 4. Invalidation on updateWorkspace
  const snap7 = getStoredWorkspaces();
  const updatedWs = updateWorkspace(wsId, { description: 'Mô tả mới kiểm tra tính bất biến' });
  assert.ok(updatedWs);
  const snap8 = getStoredWorkspaces();
  assert.equal(Object.is(snap7, snap8), false, 'Snapshot reference must change after updateWorkspace');

  // 5. Invalidation on deleteWorkspaceTask
  const snap9 = getStoredWorkspaces();
  const deletedTask = deleteWorkspaceTask(wsId, createdTask.id);
  assert.equal(deletedTask, true);
  const snap10 = getStoredWorkspaces();
  assert.equal(Object.is(snap9, snap10), false, 'Snapshot reference must change after deleteWorkspaceTask');
});
