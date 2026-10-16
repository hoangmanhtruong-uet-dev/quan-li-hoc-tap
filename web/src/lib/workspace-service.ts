import { AuthorizationError } from './authorization-errors.ts';
import {
  assertCanManageWorkspaceRole,
  requireWorkspacePermission,
  inMemoryMemberships,
} from './workspace-authorization.ts';
import {
  isLastOwnerChangeBlocked,
  type WorkspaceRole,
} from './workspace-permissions.ts';
import { supabase, isSupabaseConfigured } from './supabase.ts';

export interface WorkspaceRow {
  id: string;
  owner_user_id: string;
  name: string;
  description: string | null;
  type: 'PERSONAL' | 'CLUB' | 'HOUSEHOLD';
  role: WorkspaceRole;
  created_at: Date;
  updated_at: Date;
}

// In-memory workspaces store for offline fallback
const inMemoryWorkspaces: Map<string, WorkspaceRow> = new Map([
  [
    'personal-ws-default_student_id',
    {
      id: 'personal-ws-default_student_id',
      owner_user_id: 'default_student_id',
      name: 'Không gian cá nhân',
      description: 'Workspace cá nhân cho việc học và quản lý mục tiêu',
      type: 'PERSONAL',
      role: 'OWNER',
      created_at: new Date('2026-01-01'),
      updated_at: new Date('2026-01-01'),
    },
  ],
  [
    'ws-capstone-ai',
    {
      id: 'ws-capstone-ai',
      owner_user_id: 'default_student_id',
      name: 'Đồ án Tốt nghiệp - AI Campus Assistant',
      description: 'Nghiên cứu & triển khai trợ lý học tập đa phương thức',
      type: 'PERSONAL',
      role: 'OWNER',
      created_at: new Date('2026-01-15'),
      updated_at: new Date('2026-01-15'),
    },
  ],
]);

export async function listCurrentUserWorkspaces(userId: string): Promise<WorkspaceRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data: members, error } = await supabase
        .from('workspace_members')
        .select('role, workspaces ( id, owner_id, name, description, type, created_at, updated_at )')
        .eq('user_id', userId);

      if (members && !error) {
        return members
          .map((m: any) => {
            const ws = m.workspaces;
            if (!ws) return null;
            return {
              id: ws.id,
              owner_user_id: ws.owner_id,
              name: ws.name,
              description: ws.description,
              type: ws.type as 'PERSONAL' | 'CLUB' | 'HOUSEHOLD',
              role: m.role as WorkspaceRole,
              created_at: new Date(ws.created_at),
              updated_at: new Date(ws.updated_at),
            };
          })
          .filter(Boolean) as WorkspaceRow[];
      }
    } catch (err) {
      console.error('listCurrentUserWorkspaces Supabase error:', err);
    }
  }

  // Memory fallback
  const result: WorkspaceRow[] = [];
  for (const ws of inMemoryWorkspaces.values()) {
    if (ws.owner_user_id === userId) {
      result.push(ws);
    }
  }
  return result;
}

export async function getCurrentUserWorkspace(workspaceId: string): Promise<WorkspaceRow> {
  const membership = await requireWorkspacePermission(workspaceId, 'workspace.view');

  if (isSupabaseConfigured()) {
    try {
      const { data: ws, error } = await supabase
        .from('workspaces')
        .select('id, owner_id, name, description, type, created_at, updated_at')
        .eq('id', workspaceId)
        .maybeSingle();

      if (ws && !error) {
        return {
          id: ws.id,
          owner_user_id: ws.owner_id,
          name: ws.name,
          description: ws.description,
          type: ws.type as 'PERSONAL' | 'CLUB' | 'HOUSEHOLD',
          role: membership.role,
          created_at: new Date(ws.created_at),
          updated_at: new Date(ws.updated_at),
        };
      }
    } catch (err) {
      console.error('getCurrentUserWorkspace Supabase error:', err);
    }
  }

  // Memory fallback
  const memWs = inMemoryWorkspaces.get(workspaceId);
  if (memWs) {
    return { ...memWs, role: membership.role };
  }

  // If in offline mode, construct a default workspace
  if (!isSupabaseConfigured()) {
    const fallbackWs: WorkspaceRow = {
      id: workspaceId,
      owner_user_id: membership.userId,
      name: membership.workspaceName || 'Không gian làm việc',
      description: 'Không gian học tập nhóm CampusOS',
      type: membership.workspaceType || 'PERSONAL',
      role: membership.role,
      created_at: new Date(),
      updated_at: new Date(),
    };
    inMemoryWorkspaces.set(workspaceId, fallbackWs);
    return fallbackWs;
  }

  throw new AuthorizationError('WORKSPACE_NOT_FOUND');
}

export async function updateMembershipRole(
  workspaceId: string,
  membershipId: string,
  nextRole: WorkspaceRole,
): Promise<void> {
  const actor = await requireWorkspacePermission(workspaceId, 'member.updateRole');

  if (isSupabaseConfigured()) {
    const { data: target, error: targetError } = await supabase
      .from('workspace_members')
      .select('id, role, workspace_id')
      .eq('id', membershipId)
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (!target || targetError) throw new AuthorizationError('MEMBERSHIP_NOT_FOUND');

    assertCanManageWorkspaceRole(actor.role, target.role as WorkspaceRole, nextRole);

    if (target.role === 'OWNER' && nextRole !== 'OWNER') {
      const { count } = await supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('role', 'OWNER');

      if (isLastOwnerChangeBlocked(target.role, count || 1)) {
        throw new AuthorizationError('LAST_OWNER_CANNOT_LEAVE');
      }
    }

    await supabase
      .from('workspace_members')
      .update({ role: nextRole, updated_at: new Date().toISOString() })
      .eq('id', membershipId)
      .eq('workspace_id', workspaceId);
    return;
  }

  // Memory fallback
  let targetMembership: any = null;
  for (const m of inMemoryMemberships.values()) {
    if (m.id === membershipId || m.workspaceId === workspaceId) {
      targetMembership = m;
      break;
    }
  }

  if (!targetMembership) {
    targetMembership = { id: membershipId, role: 'MEMBER' as WorkspaceRole, workspaceId };
  }

  assertCanManageWorkspaceRole(actor.role, targetMembership.role, nextRole);

  if (targetMembership.role === 'OWNER' && nextRole !== 'OWNER') {
    let ownerCount = 0;
    for (const m of inMemoryMemberships.values()) {
      if (m.workspaceId === workspaceId && m.role === 'OWNER') ownerCount++;
    }
    if (isLastOwnerChangeBlocked(targetMembership.role, ownerCount)) {
      throw new AuthorizationError('LAST_OWNER_CANNOT_LEAVE');
    }
  }

  targetMembership.role = nextRole;
}

export async function removeWorkspaceMembership(
  workspaceId: string,
  membershipId: string,
): Promise<void> {
  const actor = await requireWorkspacePermission(workspaceId, 'member.remove');

  if (isSupabaseConfigured()) {
    const { data: target, error: targetError } = await supabase
      .from('workspace_members')
      .select('id, role, workspace_id')
      .eq('id', membershipId)
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (!target || targetError) throw new AuthorizationError('MEMBERSHIP_NOT_FOUND');

    assertCanManageWorkspaceRole(actor.role, target.role as WorkspaceRole);

    if (target.role === 'OWNER') {
      const { count } = await supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('role', 'OWNER');

      if (isLastOwnerChangeBlocked(target.role, count || 1)) {
        throw new AuthorizationError('LAST_OWNER_CANNOT_LEAVE');
      }
    }

    await supabase
      .from('workspace_members')
      .delete()
      .eq('id', membershipId)
      .eq('workspace_id', workspaceId);
    return;
  }

  // Memory fallback
  let targetMembership: any = null;
  for (const [key, m] of inMemoryMemberships.entries()) {
    if (m.id === membershipId) {
      targetMembership = m;
      break;
    }
  }

  if (!targetMembership) {
    targetMembership = { id: membershipId, role: 'MEMBER' as WorkspaceRole, workspaceId };
  }

  assertCanManageWorkspaceRole(actor.role, targetMembership.role);

  if (targetMembership.role === 'OWNER') {
    let ownerCount = 0;
    for (const m of inMemoryMemberships.values()) {
      if (m.workspaceId === workspaceId && m.role === 'OWNER') ownerCount++;
    }
    if (isLastOwnerChangeBlocked(targetMembership.role, ownerCount)) {
      throw new AuthorizationError('LAST_OWNER_CANNOT_LEAVE');
    }
  }

  for (const [key, m] of inMemoryMemberships.entries()) {
    if (m.id === membershipId) {
      inMemoryMemberships.delete(key);
      break;
    }
  }
}
