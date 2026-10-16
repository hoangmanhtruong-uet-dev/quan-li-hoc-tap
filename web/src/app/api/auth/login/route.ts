import { NextRequest, NextResponse } from 'next/server';
import { signInWithEmail, setSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const { data, error } = await signInWithEmail(email, password);

    if (error || !data?.user) {
      return NextResponse.json(
        { error: error?.message || 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = data.user;
    const role = (user as any).role || 'USER';

    await setSession({
      userId: user.id,
      email: user.email || email,
      role: role as any,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email || email,
        fullName: user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'Sinh viên'),
        role,
      },
      needsOnboarding: false,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}