import { NextRequest, NextResponse } from 'next/server';
import { resetPassword, getPasswordResetToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const data = await getPasswordResetToken(token);
    if (!data) {
      return NextResponse.json({ error: 'Invalid reset link' }, { status: 400 });
    }
    if (data.used) {
      return NextResponse.json({ error: 'This reset link has already been used' }, { status: 400 });
    }
    if (data.expired) {
      return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 });
    }

    const success = await resetPassword(token, password);
    if (!success) {
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Password has been reset successfully.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}