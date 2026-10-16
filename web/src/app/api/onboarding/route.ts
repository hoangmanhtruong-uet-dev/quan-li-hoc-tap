import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUserFromDb } from '@/lib/auth';
import { requireUser } from '@/lib/authorization';
import { completeOnboarding } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromDb(session.userId);
    if (!user || user.status === 'banned') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, displayName, school, major, academicYear, careerGoal } = body;

    if (!fullName?.trim() || !displayName?.trim()) {
      return NextResponse.json({ error: 'Full name and display name are required' }, { status: 400 });
    }

    await completeOnboarding(session.userId, {
      fullName: fullName.trim(),
      displayName: displayName.trim(),
      school: school?.trim(),
      major: major?.trim(),
      academicYear: academicYear?.trim(),
      careerGoal: careerGoal?.trim(),
    });

    return NextResponse.json({ message: 'Onboarding completed' });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}