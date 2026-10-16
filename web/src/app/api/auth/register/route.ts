import { NextRequest, NextResponse } from 'next/server';
import { signUpWithEmail, setSession } from '@/lib/auth';
import { ensureDefaultProfile } from '@/lib/authorization';
import { ensurePersonalWorkspace } from '@/lib/personal-workspace';

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const { data, error } = await signUpWithEmail(email, password, fullName);

    if (error || !data?.user) {
      return NextResponse.json({ error: error?.message || 'Registration failed' }, { status: 400 });
    }

    const userId = data.user.id;

    // Auto-initialize student profile with required defaults
    await ensureDefaultProfile({
      id: userId,
      email,
      fullName,
    });

    // Initialize personal workspace for new student
    await ensurePersonalWorkspace(userId);

    await setSession({
      userId,
      email,
      role: 'USER',
    });

    return NextResponse.json({
      message: 'Registration successful. Welcome to CampusOS!',
      user: {
        id: userId,
        email,
        fullName,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
