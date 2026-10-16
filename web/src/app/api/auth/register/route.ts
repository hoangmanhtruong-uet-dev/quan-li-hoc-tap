import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, createEmailVerification } from '@/lib/auth';
import { ensurePersonalWorkspace } from '@/lib/personal-workspace';
import { sendVerificationEmail } from '@/lib/email';

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

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const { randomUUID } = await import('crypto');
    const id = randomUUID();
    const passwordHash = await hashPassword(password);

    await pool.execute(
      'INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [id, email, passwordHash, fullName, 'USER']
    );

    await ensurePersonalWorkspace(id);

    // Tạo token và gửi email xác minh qua Resend
    const verifyToken = await createEmailVerification(id);
    await sendVerificationEmail(email, verifyToken);

    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
