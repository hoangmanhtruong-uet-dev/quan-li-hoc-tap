import { NextResponse } from 'next/server';
import { getCurrentUser, ensureDefaultProfile } from '@/lib/authorization';


export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const profile = await ensureDefaultProfile(user);

    return NextResponse.json({
      user: {
        ...user,
        ...profile,
        profile,
      },
    });
  } catch (error: any) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}