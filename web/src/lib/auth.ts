import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from './supabase.ts';
import { ensurePersonalWorkspace } from './personal-workspace.ts';

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
  role: 'USER' | 'PLATFORM_ADMIN' | 'student';
}

async function getCookieStore() {
  try {
    // @ts-ignore
    const nextHeaders = await import('next/headers');
    return nextHeaders.cookies ? await nextHeaders.cookies() : null;
  } catch {
    try {
      // @ts-ignore
      const nextHeaders = await import('next/headers.js');
      return nextHeaders.cookies ? await nextHeaders.cookies() : null;
    } catch {
      return null;
    }
  }
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

/**
 * Returns deterministic authenticated mock student session when offline.
 */
export function getOfflineMockSession(email?: string) {
  return {
    id: 'default_student_id',
    userId: 'default_student_id',
    email: email || 'student@campusos.edu.vn',
    role: 'student' as const,
  };
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await getCookieStore();
    if (cookieStore) {
      const token = cookieStore.get(COOKIE_NAME)?.value || cookieStore.get('sb-mock-auth')?.value;
      if (token) {
        const verified = await verifyToken(token);
        if (verified) return verified;
      }
    }
  } catch {
    // Graceful handling outside Next.js request scope
  }

  // If Supabase is unconfigured, provide deterministic authenticated mock student session
  if (!isSupabaseConfigured()) {
    return {
      userId: 'default_student_id',
      email: 'student@campusos.edu.vn',
      role: 'student',
    };
  }

  return null;
}

export async function setSession(payload: SessionPayload): Promise<string> {
  const token = await createToken(payload);
  try {
    const cookieStore = await getCookieStore();
    if (cookieStore) {
      cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
    }
  } catch {
    // Outside request context
  }
  return token;
}

export async function clearSession(): Promise<void> {
  try {
    const cookieStore = await getCookieStore();
    if (cookieStore) {
      cookieStore.delete(COOKIE_NAME);
    }
  } catch {
    // Outside request context
  }
}

// ----------------------------------------------------------------------------
// Supabase Auth Functions with 0ms Offline Resiliency
// ----------------------------------------------------------------------------

export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  if (!isSupabaseConfigured()) {
    const mockUser = {
      id: 'default_student_id',
      email: email || 'student@campusos.edu.vn',
      role: 'student',
      user_metadata: { full_name: fullName || 'Sinh viên CampusOS' },
    };
    const mockSession = {
      access_token: 'mock-offline-token',
      user: mockUser,
    };
    return { data: { user: mockUser, session: mockSession }, error: null };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || '',
      },
    },
  });

  return { data, error };
}

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    const mockUser = {
      id: 'default_student_id',
      email: email || 'student@campusos.edu.vn',
      role: 'student',
      user_metadata: { full_name: 'Sinh viên CampusOS' },
    };
    const mockSession = {
      access_token: 'mock-offline-token',
      user: mockUser,
    };
    return { data: { user: mockUser, session: mockSession }, error: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

export async function signOut() {
  await clearSession();

  if (isSupabaseConfigured()) {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  return { error: null };
}

export async function resetPassword(emailOrToken: string, newPassword?: string) {
  // Overloaded: resetPassword(email) for password reset request
  if (newPassword === undefined) {
    if (!isSupabaseConfigured()) {
      return { data: {}, error: null };
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(emailOrToken);
    return { data, error };
  }

  // Overloaded: resetPassword(token, newPassword) for password update
  if (!isSupabaseConfigured()) {
    return true;
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return !error;
}

// ----------------------------------------------------------------------------
// User & Profile Query with Supabase / In-Memory Fallback
// ----------------------------------------------------------------------------

export async function getUserFromDb(userId: string) {
  if (isSupabaseConfigured()) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (profile) return profile;
    } catch (err) {
      console.error('getUserFromDb Supabase error:', err);
    }
  }

  // Offline deterministic fallback student
  return {
    id: userId || 'default_student_id',
    email: 'student@campusos.edu.vn',
    full_name: 'Sinh viên CampusOS',
    display_name: 'Sinh viên',
    role: 'student',
    status: 'active',
    email_verified: true,
    onboarding_completed: true,
    avatar_url: null,
    school: 'Đại học Quốc gia',
    major: 'Công nghệ Thông tin',
    academic_year: '2024-2028',
    created_at: new Date().toISOString(),
  };
}

// In-memory tokens for legacy email verification and password reset flows
const inMemoryTokens = new Map<string, { userId: string; expiresAt: number; used?: boolean }>();

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createEmailVerification(userId: string): Promise<string> {
  const token = generateToken();
  inMemoryTokens.set(`email:${token}`, { userId, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
  return token;
}

export async function verifyEmailToken(token: string): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return 'default_student_id';
  }
  const item = inMemoryTokens.get(`email:${token}`);
  if (!item || item.expiresAt < Date.now()) return null;
  inMemoryTokens.delete(`email:${token}`);
  return item.userId;
}

export async function createPasswordReset(userId: string): Promise<string> {
  const token = generateToken();
  inMemoryTokens.set(`pwd:${token}`, { userId, expiresAt: Date.now() + 24 * 60 * 60 * 1000, used: false });
  return token;
}

export async function getPasswordResetToken(token: string): Promise<{ userId: string; used: boolean; expired: boolean } | null> {
  if (!isSupabaseConfigured()) {
    return { userId: 'default_student_id', used: false, expired: false };
  }
  const item = inMemoryTokens.get(`pwd:${token}`);
  if (!item) return null;
  return {
    userId: item.userId,
    used: !!item.used,
    expired: item.expiresAt < Date.now(),
  };
}

export async function markPasswordResetUsed(token: string): Promise<void> {
  const item = inMemoryTokens.get(`pwd:${token}`);
  if (item) item.used = true;
}

export async function completeOnboarding(
  userId: string,
  data: {
    fullName: string;
    displayName: string;
    school?: string;
    major?: string;
    academicYear?: string;
    careerGoal?: string;
  }
): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          display_name: data.displayName,
          school: data.school || null,
          major: data.major || null,
          academic_year: data.academicYear || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch (err) {
      console.error('completeOnboarding Supabase error:', err);
    }
  }

  await ensurePersonalWorkspace(userId);
}
