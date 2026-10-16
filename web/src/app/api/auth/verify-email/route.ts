import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken, setSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const userId = await verifyEmailToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid or expired verification link' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Email verified successfully' });
  } catch (error: any) {
    console.error('Verify email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Missing verification token' }, { status: 400 });
    }

    const userId = await verifyEmailToken(token);
    if (!userId) {
      return NextResponse.redirect(new URL('/login?error=invalid_verification', req.url));
    }

    await setSession({
      userId,
      email: 'student@campusos.edu.vn',
      role: 'USER',
    });

    return NextResponse.redirect(new URL('/onboarding', req.url));
  } catch (error: any) {
    console.error('Verify email error:', error);
    return NextResponse.redirect(new URL('/login?error=verification_failed', req.url));
  }
}