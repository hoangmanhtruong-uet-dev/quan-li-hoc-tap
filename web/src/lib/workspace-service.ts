import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import pool from './db';
import { AuthorizationError } from './authorization-errors';
import { assertCanManageWorkspaceRole, requireWorkspacePermission } from './workspace-authorization';
import { hasWorkspacePermission, isLastOwnerChangeBlocked, type WorkspacePermission, type WorkspaceRole } from './workspace-permissions';

interface WorkspaceRow extends RowDataPacket {
  id: string;
  owner_user_id: string;
  name: string;
  description: string | null;
  type: 'PERSONAL' | 'CLUB' | 'HOUSEHOLD';
  role: WorkspaceRole;
  created_at: Date;
  updated_at: Date;
}

interface MembershipRoleRow extends RowDataPacket {
  id: string;
  role: WorkspaceRole;
}

export async function listCurrentUserWorkspaces(userId: string): Promise<WorkspaceRow[]> {
  const [rows] = await pool.execute<WorkspaceRow[]>(
    `SELECT w.id, w.owner_user_id, w.name, w.description, w.type,
            m.role, w.created_at, w.updated_at
       FROM team_workspaces w
       JOIN team_memberships m ON m.team_workspace_id = w.id
      WHERE m.user_id = ?
      ORDER BY w.type, w.name`,
    [userId],
  );
  return rows;
}

export async function getCurrentUserWorkspace(workspaceId: string): Promise<WorkspaceRow> {
  const membership = await requireWorkspacePermission(workspaceId, 'workspace.view');
  const [rows] = await pool.execute<WorkspaceRow[]>(
    `SELECT w.id, w.owner_user_id, w.name, w.description, w.type,
            m.role, w.created_at, w.updated_at
       FROM team_workspaces w
       JOIN team_memberships m
         ON m.team_workspace_id = w.id AND m.user_id = ?
      WHERE w.id = ? LIMIT 1`,
    [membership.userId, workspaceId],
  );
  if (!rows[0]) throw new AuthorizationError('WORKSPACE_NOT_FOUND');
  return rows[0];
}

async function lockMembership(
  connection: PoolConnection,
  workspaceId: string,
  membershipId: string,
): Promise<MembershipRoleRow> {
  const [rows] = await connection.execute<MembershipRoleRow[]>(
    `SELECT id, role FROM team_memberships
      WHERE id = ? AND team_workspace_id = ?
      LIMIT 1 FOR UPDATE`,
    [membershipId, workspaceId],
  );
  if (!rows[0]) throw new AuthorizationError('MEMBERSHIP_NOT_FOUND');
  return rows[0];
}

async function lockActorMembership(
  connection: PoolConnection,
  workspaceId: string,
  membershipId: string,
  permission: WorkspacePermission,
): Promise<MembershipRoleRow> {
  const actor = await lockMembership(connection, workspaceId, membershipId);
  if (!hasWorkspacePermission(actor.role, permission)) {
    throw new AuthorizationError('INSUFFICIENT_PERMISSION');
  }
  return actor;
}

async function assertNotLastOwner(
  connection: PoolConnection,
  workspaceId: string,
  targetRole: WorkspaceRole,
): Promise<void> {
  if (targetRole !== 'OWNER') return;
  const [owners] = await connection.execute<RowDataPacket[]>(
    `SELECT id FROM team_memberships
      WHERE team_workspace_id = ? AND role = 'OWNER'
      FOR UPDATE`,
    [workspaceId],
  );
  if (isLastOwnerChangeBlocked(targetRole, owners.length)) {
    throw new AuthorizationError('LAST_OWNER_CANNOT_LEAVE');
  }
}

export async function updateMembershipRole(
  workspaceId: string,
  membershipId: string,
  nextRole: WorkspaceRole,
): Promise<void> {
  const actor = await requireWorkspacePermission(workspaceId, 'member.updateRole');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const lockedActor = await lockActorMembership(connection, workspaceId, actor.id, 'member.updateRole');
    const target = await lockMembership(connection, workspaceId, membershipId);
    assertCanManageWorkspaceRole(lockedActor.role, target.role, nextRole);
    if (target.role === 'OWNER' && nextRole !== 'OWNER') {
      await assertNotLastOwner(connection, workspaceId, target.role);
    }
    await connection.execute(
      'UPDATE team_memberships SET role = ? WHERE id = ? AND team_workspace_id = ?',
      [nextRole, membershipId, workspaceId],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function removeWorkspaceMembership(
  workspaceId: string,
  membershipId: string,
): Promise<void> {
  const actor = await requireWorkspacePermission(workspaceId, 'member.remove');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const lockedActor = await lockActorMembership(connection, workspaceId, actor.id, 'member.remove');
    const target = await lockMembership(connection, workspaceId, membershipId);
    assertCanManageWorkspaceRole(lockedActor.role, target.role);
    await assertNotLastOwner(connection, workspaceId, target.role);
    await connection.execute(
      'DELETE FROM team_memberships WHERE id = ? AND team_workspace_id = ?',
      [membershipId, workspaceId],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
