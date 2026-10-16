import { getCurrentUser } from './authorization.ts';
import { AuthorizationError } from './authorization-errors.ts';
import {
  canManageWorkspaceRole,
  hasWorkspacePermission,
  type WorkspacePermission,
  type WorkspaceRole,
  type WorkspaceType,
} from './workspace-permissions.ts';
import { supabase, isSupabaseConfigured } from './supabase.ts';

export interface WorkspaceMembership {
  id: string;
  workspaceId: string;
  workspaceType: WorkspaceType;
  workspaceName: string;
  userId: string;
  role: WorkspaceRole;
}

// In-memory fallback memberships store for offline development and testing
export const inMemoryMemberships: Map<string, WorkspaceMembership> = new Map([
  [
    'default_student_id:personal-ws-default_student_id',
    {
      id: 'mem-personal-default',
      workspaceId: 'personal-ws-default_student_id',
      workspaceType: 'PERSONAL',
      workspaceName: 'Không gian cá nhân',
      userId: 'default_student_id',
      role: 'OWNER',
    },
  ],
  [
    'default_student_id:ws-capstone-ai',
    {
      id: 'mem-ws-capstone-ai',
      workspaceId: 'ws-capstone-ai',
      workspaceType: 'PERSONAL',
      workspaceName: 'Đồ án Tốt nghiệp - AI Campus Assistant',
      userId: 'default_student_id',
      role: 'OWNER',
    },
  ],
]);

async function findMembership(workspaceId: string, userId: string): Promise<WorkspaceMembership | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data: member, error } = await supabase
        .from('workspace_members')
        .select('id, workspace_id, user_id, role, workspaces ( id, name, type )')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .maybeSingle();

      if (member && !error) {
        const ws = member.workspaces as any;
        return {
          id: member.id,
          workspaceId: member.workspace_id,
          workspaceType: (ws?.type || 'PERSONAL') as WorkspaceType,
          workspaceName: ws?.name || 'Workspace',
          userId: member.user_id,
          role: member.role as WorkspaceRole,
        };
      }
    } catch (err) {
      console.error('findMembership Supabase error:', err);
    }
  }

  // Resilient memory fallback
  const key = `${userId}:${workspaceId}`;
  const found = inMemoryMemberships.get(key);
  if (found) return found;

  // In offline mode, automatically grant OWNER membership to the user's workspace
  if (!isSupabaseConfigured()) {
    const fallbackMembership: WorkspaceMembership = {
      id: `mem-${workspaceId}-${userId}`,
      workspaceId,
      workspaceType: 'PERSONAL',
      workspaceName: 'Không gian làm việc',
      userId,
      role: 'OWNER',
    };
    inMemoryMemberships.set(key, fallbackMembership);
    return fallbackMembership;
  }

  return null;
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
    if (isSupabaseConfigured()) {
      const { data: ws } = await supabase
        .from('workspaces')
        .select('id')
        .eq('id', workspaceId)
        .maybeSingle();
      throw new AuthorizationError(ws ? 'MEMBERSHIP_NOT_FOUND' : 'WORKSPACE_NOT_FOUND');
    }
    throw new AuthorizationError('WORKSPACE_NOT_FOUND');
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
