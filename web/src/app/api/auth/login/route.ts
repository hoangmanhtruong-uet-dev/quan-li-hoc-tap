import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword, setSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const [rows] = await pool.execute(
      'SELECT id, email, password_hash, full_name, role, status, email_verified, onboarding_completed FROM users WHERE email = ?',
      [email]
    );
    const users = rows as any[];
    const user = users[0];

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.status === 'banned') {
      return NextResponse.json({ error: 'Account has been suspended' }, { status: 403 });
    }

    if (!user.email_verified) {
      return NextResponse.json({ error: 'Please verify your email before logging in' }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await setSession({ userId: user.id.toString(), email: user.email, role: user.role });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      needsOnboarding: !user.onboarding_completed,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}