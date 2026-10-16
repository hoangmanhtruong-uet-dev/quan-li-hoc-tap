export const WORKSPACE_TYPES = ['PERSONAL', 'CLUB', 'HOUSEHOLD'] as const;
export type WorkspaceType = (typeof WORKSPACE_TYPES)[number];

export const WORKSPACE_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const WORKSPACE_PERMISSIONS = [
  'workspace.view',
  'workspace.update',
  'workspace.delete',
  'member.view',
  'member.invite',
  'member.updateRole',
  'member.remove',
  'task.create',
  'task.update',
  'task.assign',
  'task.delete',
  'calendar.create',
  'calendar.update',
  'finance.view',
  'finance.manage',
] as const;

export type WorkspacePermission = (typeof WORKSPACE_PERMISSIONS)[number];

const ALL_PERMISSIONS = new Set<WorkspacePermission>(WORKSPACE_PERMISSIONS);

export const WORKSPACE_PERMISSION_MATRIX: Record<WorkspaceRole, ReadonlySet<WorkspacePermission>> = {
  OWNER: ALL_PERMISSIONS,
  ADMIN: new Set([
    'workspace.view', 'workspace.update',
    'member.view', 'member.invite', 'member.updateRole', 'member.remove',
    'task.create', 'task.update', 'task.assign', 'task.delete',
    'calendar.create', 'calendar.update',
    'finance.view', 'finance.manage',
  ]),
  MANAGER: new Set([
    'workspace.view', 'member.view',
    'task.create', 'task.update', 'task.assign', 'task.delete',
    'calendar.create', 'calendar.update',
    'finance.view',
  ]),
  MEMBER: new Set([
    'workspace.view', 'member.view',
    'task.create', 'task.update',
    'calendar.create',
  ]),
  VIEWER: new Set(['workspace.view', 'member.view', 'finance.view']),
};

export function hasWorkspacePermission(role: WorkspaceRole, permission: WorkspacePermission): boolean {
  return WORKSPACE_PERMISSION_MATRIX[role].has(permission);
}

export function canManageWorkspaceRole(
  actorRole: WorkspaceRole,
  targetCurrentRole: WorkspaceRole,
  targetNextRole?: WorkspaceRole,
): boolean {
  if (actorRole === 'OWNER') return true;
  if (actorRole !== 'ADMIN') return false;
  if (targetCurrentRole === 'OWNER' || targetNextRole === 'OWNER') return false;
  return true;
}

export function isLastOwnerChangeBlocked(
  targetRole: WorkspaceRole,
  ownerCount: number,
): boolean {
  return targetRole === 'OWNER' && ownerCount <= 1;
}
