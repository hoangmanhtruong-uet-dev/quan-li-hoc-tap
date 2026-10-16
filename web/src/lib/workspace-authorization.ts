import type { RowDataPacket } from 'mysql2';
import pool from './db';
import { getCurrentUser } from './authorization';
import { AuthorizationError } from './authorization-errors';
import {
  canManageWorkspaceRole,
  hasWorkspacePermission,
  type WorkspacePermission,
  type WorkspaceRole,
  type WorkspaceType,
} from './workspace-permissions';

export interface WorkspaceMembership {
  id: string;
  workspaceId: string;
  workspaceType: WorkspaceType;
  workspaceName: string;
  userId: string;
  role: WorkspaceRole;
}

interface MembershipRow extends RowDataPacket {
  id: string;
  team_workspace_id: string;
  workspace_type: WorkspaceType;
  workspace_name: string;
  user_id: string;
  role: WorkspaceRole;
}

function mapMembership(row: MembershipRow): WorkspaceMembership {
  return {
    id: row.id,
    workspaceId: row.team_workspace_id,
    workspaceType: row.workspace_type,
    workspaceName: row.workspace_name,
    userId: row.user_id,
    role: row.role,
  };
}

async function findMembership(workspaceId: string, userId: string): Promise<WorkspaceMembership | null> {
  const [rows] = await pool.execute<MembershipRow[]>(
    `SELECT m.id, m.team_workspace_id, w.type AS workspace_type,
            w.name AS workspace_name, m.user_id, m.role
       FROM team_memberships m
       JOIN team_workspaces w ON w.id = m.team_workspace_id
      WHERE m.team_workspace_id = ? AND m.user_id = ?
      LIMIT 1`,
    [workspaceId, userId],
  );
  return rows[0] ? mapMembership(rows[0]) : null;
}

export async function getWorkspaceMembership(workspaceId: string): Promise<WorkspaceMembership | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return findMembership(workspaceId, user.id);
}

export async function requireWorkspaceMember(workspaceId: string): Promise<WorkspaceMembership> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError('UNAUTHENTICATED');

  const membership = await findMembership(workspaceId, user.id);
  if (!membership) {
    const [workspaces] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM team_workspaces WHERE id = ? LIMIT 1',
      [workspaceId],
    );
    throw new AuthorizationError(workspaces[0] ? 'MEMBERSHIP_NOT_FOUND' : 'WORKSPACE_NOT_FOUND');
  }
  return membership;
}

export async function requireWorkspaceRole(
  workspaceId: string,
  roles: readonly WorkspaceRole[],
): Promise<WorkspaceMembership> {
  const membership = await requireWorkspaceMember(workspaceId);
  if (!roles.includes(membership.role)) throw new AuthorizationError('FORBIDDEN');
  return membership;
}

export async function requireWorkspacePermission(
  workspaceId: string,
  permission: WorkspacePermission,
): Promise<WorkspaceMembership> {
  const membership = await requireWorkspaceMember(workspaceId);
  if (!hasWorkspacePermission(membership.role, permission)) {
    throw new AuthorizationError('INSUFFICIENT_PERMISSION');
  }
  return membership;
}

export function assertCanManageWorkspaceRole(
  actorRole: WorkspaceRole,
  targetCurrentRole: WorkspaceRole,
  targetNextRole?: WorkspaceRole,
): void {
  if (!canManageWorkspaceRole(actorRole, targetCurrentRole, targetNextRole)) {
    throw new AuthorizationError('INSUFFICIENT_PERMISSION');
  }
}

