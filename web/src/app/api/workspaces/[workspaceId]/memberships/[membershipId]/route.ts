import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-errors';
import { removeWorkspaceMembership, updateMembershipRole } from '@/lib/workspace-service';
import { WORKSPACE_ROLES, type WorkspaceRole } from '@/lib/workspace-permissions';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { workspaceId: string; membershipId: string };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const body: unknown = await request.json();
    const role = typeof body === 'object' && body !== null && 'role' in body
      ? (body as { role?: unknown }).role
      : undefined;
    if (typeof role !== 'string' || !WORKSPACE_ROLES.includes(role as WorkspaceRole)) {
      return NextResponse.json(
        { error: { code: 'INVALID_ROLE', message: 'Invalid workspace role' } },
        { status: 400 },
      );
    }
    await updateMembershipRole(params.workspaceId, params.membershipId, role as WorkspaceRole);
    return NextResponse.json({ message: 'Membership role updated' });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await removeWorkspaceMembership(params.workspaceId, params.membershipId);
    return NextResponse.json({ message: 'Membership removed' });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
