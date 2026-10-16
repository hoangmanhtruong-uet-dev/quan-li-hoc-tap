import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-errors';
import { getCurrentUserWorkspace } from '@/lib/workspace-service';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { workspaceId: string } },
) {
  try {
    const workspace = await getCurrentUserWorkspace(params.workspaceId);
    return NextResponse.json({ workspace });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
