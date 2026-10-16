import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from './db';
import { ensurePersonalWorkspace } from './personal-workspace';

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is required in production');
  }
  return new TextEncoder().encode(secret || 'dev-only-auth-secret');
}

const SECRET = getAuthSecret();
const COOKIE_NAME = 'session';

export interface SessionPayload {
  userId: string;
  email: string;
  role: 'USER' | 'PLATFORM_ADMIN';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSession(payload: SessionPayload): Promise<string> {
  const token = await createToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
  return token;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getUserFromDb(userId: string) {
  const [rows] = await pool.execute(
    'SELECT id, email, full_name, display_name, role, status, email_verified, onboarding_completed, avatar_url, school, major, academic_year, created_at FROM users WHERE id = ?',
    [userId]
  );
  const users = rows as any[];
  return users[0] || null;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

const TOKEN_EXPIRY_HOURS = 24;

export async function createEmailVerification(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  await pool.execute(
    'INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
  return token;
}

export async function verifyEmailToken(token: string): Promise<string | null> {
  const [rows] = await pool.execute(
    'SELECT user_id, expires_at FROM email_verifications WHERE token = ?',
    [token]
  );
  const items = rows as any[];
  if (!items[0]) return null;
  if (new Date(items[0].expires_at) < new Date()) return null;
  const userId = items[0].user_id;
  await pool.execute('UPDATE users SET email_verified = 1 WHERE id = ?', [userId]);
  await pool.execute('DELETE FROM email_verifications WHERE token = ?', [token]);
  return userId;
}

export async function createPasswordReset(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  await pool.execute(
    'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
  return token;
}

export async function getPasswordResetToken(token: string): Promise<{ userId: string; used: boolean; expired: boolean } | null> {
  const [rows] = await pool.execute(
    'SELECT user_id, used, expires_at FROM password_resets WHERE token = ?',
    [token]
  );
  const items = rows as any[];
  if (!items[0]) return null;
  return {
    userId: items[0].user_id,
    used: items[0].used === 1,
    expired: new Date(items[0].expires_at) < new Date(),
  };
}

export async function markPasswordResetUsed(token: string): Promise<void> {
  await pool.execute('UPDATE password_resets SET used = 1 WHERE token = ?', [token]);
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const hashed = await hashPassword(newPassword);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT id, user_id, expires_at
         FROM password_resets
        WHERE token = ? AND used = 0
        LIMIT 1 FOR UPDATE`,
      [token],
    );
    const reset = rows[0];
    if (!reset || new Date(reset.expires_at) < new Date()) {
      await connection.rollback();
      return false;
    }

    const [userUpdate] = await connection.execute<ResultSetHeader>(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashed, reset.user_id],
    );
    if (userUpdate.affectedRows !== 1) {
      await connection.rollback();
      return false;
    }

    await connection.execute('UPDATE password_resets SET used = 1 WHERE id = ?', [reset.id]);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function completeOnboarding(userId: string, data: {
  fullName: string;
  displayName: string;
  school?: string;
  major?: string;
  academicYear?: string;
  careerGoal?: string;
}): Promise<void> {
  await pool.execute(
    `UPDATE users SET full_name = ?, display_name = ?, school = ?, major = ?, academic_year = ?, career_goal = ?, onboarding_completed = 1 WHERE id = ?`,
    [data.fullName, data.displayName, data.school || null, data.major || null, data.academicYear || null, data.careerGoal || null, userId]
  );
  await ensurePersonalWorkspace(userId);
}
