import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createPasswordReset } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Always return success to prevent email enumeration
    const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    const users = rows as any[];
    if (users[0]) {
      const token = await createPasswordReset(users[0].id);
      await sendPasswordResetEmail(email, token);
    }

    return NextResponse.json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}