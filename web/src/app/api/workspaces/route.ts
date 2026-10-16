import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/authorization';
import { AuthorizationError } from '@/lib/authorization-errors';
import { apiErrorResponse } from '@/lib/api-errors';
import { listCurrentUserWorkspaces } from '@/lib/workspace-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AuthorizationError('UNAUTHENTICATED');
    const workspaces = await listCurrentUserWorkspaces(user.id);
    return NextResponse.json({ workspaces });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
