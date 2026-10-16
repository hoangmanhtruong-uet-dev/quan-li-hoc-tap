import assert from 'node:assert/strict';
import test from 'node:test';
import {
  WORKSPACE_PERMISSIONS,
  WORKSPACE_ROLES,
  canManageWorkspaceRole,
  hasWorkspacePermission,
  isLastOwnerChangeBlocked,
} from '../src/lib/workspace-permissions.ts';

test('OWNER has every workspace permission', () => {
  for (const permission of WORKSPACE_PERMISSIONS) {
    assert.equal(hasWorkspacePermission('OWNER', permission), true, permission);
  }
});

test('VIEWER is read-only', () => {
  assert.equal(hasWorkspacePermission('VIEWER', 'workspace.view'), true);
  assert.equal(hasWorkspacePermission('VIEWER', 'member.view'), true);
  assert.equal(hasWorkspacePermission('VIEWER', 'finance.view'), true);
  assert.equal(hasWorkspacePermission('VIEWER', 'task.create'), false);
  assert.equal(hasWorkspacePermission('VIEWER', 'workspace.update'), false);
});

test('MEMBER and MANAGER cannot manage roles', () => {
  for (const role of ['MEMBER', 'MANAGER'] as const) {
    assert.equal(hasWorkspacePermission(role, 'member.updateRole'), false);
    assert.equal(canManageWorkspaceRole(role, 'VIEWER', 'MEMBER'), false);
  }
});

test('ADMIN can manage non-owner roles but cannot change or grant OWNER', () => {
  assert.equal(canManageWorkspaceRole('ADMIN', 'MEMBER', 'MANAGER'), true);
  assert.equal(canManageWorkspaceRole('ADMIN', 'OWNER', 'ADMIN'), false);
  assert.equal(canManageWorkspaceRole('ADMIN', 'MEMBER', 'OWNER'), false);
});

test('only the five approved workspace roles exist', () => {
  assert.deepEqual(WORKSPACE_ROLES, ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']);
});

test('the final OWNER cannot be demoted or removed', () => {
  assert.equal(isLastOwnerChangeBlocked('OWNER', 1), true);
  assert.equal(isLastOwnerChangeBlocked('OWNER', 2), false);
  assert.equal(isLastOwnerChangeBlocked('ADMIN', 1), false);
});
