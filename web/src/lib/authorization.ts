import { getSession, getUserFromDb } from './auth.ts';
import type { WorkspaceRole } from './workspace-permissions.ts';
import { supabase, isSupabaseConfigured } from './supabase.ts';

export const PlatformRole = {
  USER: 'USER',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
} as const;

export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];

const workspaceHierarchy: Record<WorkspaceRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  MEMBER: 2,
  VIEWER: 1,
};

async function performRedirect(url: string) {
  try {
    // @ts-ignore
    const nav = await import('next/navigation');
    nav.redirect(url);
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err;
    try {
      // @ts-ignore
      const nav = await import('next/navigation.js');
      nav.redirect(url);
    } catch (e: any) {
      if (e?.digest?.startsWith('NEXT_REDIRECT')) throw e;
      // In non-Next environment or tests, no-op
    }
  }
}

export function hasPlatformRole(userRole: string, requiredRole: PlatformRole): boolean {
  if (userRole === PlatformRole.PLATFORM_ADMIN) return true;
  return userRole === requiredRole;
}

export function hasWorkspaceRole(
  userWsRole: string,
  requiredWsRole: WorkspaceRole,
): boolean {
  const userLevel = workspaceHierarchy[userWsRole as WorkspaceRole] ?? 0;
  const requiredLevel = workspaceHierarchy[requiredWsRole];
  return userLevel >= requiredLevel;
}

export interface SafeUser {
  id: string;
  email: string;
  fullName: string | null;
  displayName: string | null;
  role: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  avatarUrl: string | null;
  school: string | null;
  major: string | null;
  academicYear: string | null;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  display_name: string;
  xp: number;
  level: number;
  rank_title: string;
  streak: number;
  streak_freezes: number;
  vibe_theme: string;
  onboarding_completed: boolean;
  avatar_url?: string | null;
  school?: string | null;
  major?: string | null;
  academic_year?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Auto-initialize or retrieve student profile.
 * When Supabase is offline or profile does not exist, returns deterministic default profile.
 */
export async function ensureDefaultProfile(user: {
  id: string;
  email?: string | null;
  user_metadata?: any;
  fullName?: string | null;
  full_name?: string | null;
  displayName?: string | null;
  display_name?: string | null;
}): Promise<StudentProfile> {
  const userId = user.id || 'default_student_id';
  const email = user.email || 'student@campusos.edu.vn';
  const rawFullName = user.fullName || user.full_name || user.user_metadata?.full_name;
  const fullName = rawFullName || 'Sinh viên CampusOS';
  const emailPrefix = user.email ? user.email.split('@')[0] : 'Sinh viên';
  const displayName = user.displayName || user.display_name || rawFullName || emailPrefix;

  const defaultProfile: StudentProfile = {
    id: userId,
    user_id: userId,
    email,
    full_name: fullName,
    display_name: displayName,
    xp: 0,
    level: 1,
    rank_title: 'Tân sinh viên ngơ ngác',
    streak: 1,
    streak_freezes: 1,
    vibe_theme: 'aurora',
    onboarding_completed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    return defaultProfile;
  }

  try {
    const { data: existing, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existing && !error) {
      return existing as StudentProfile;
    }

    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .upsert(defaultProfile, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (created && !insertError) {
      return created as StudentProfile;
    }
  } catch (err) {
    console.error('ensureDefaultProfile error:', err);
  }

  return defaultProfile;
}

function mapDbUser(user: any): SafeUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name || user.fullName || null,
    displayName: user.display_name || user.displayName || null,
    role: user.role || 'student',
    emailVerified: !!user.email_verified,
    onboardingCompleted: !!user.onboarding_completed,
    avatarUrl: user.avatar_url || user.avatarUrl || null,
    school: user.school || null,
    major: user.major || null,
    academicYear: user.academic_year || user.academicYear || null,
  };
}

/**
 * Get current authenticated user with full profile data.
 * Returns null if not logged in.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await getUserFromDb(session.userId);
  if (!user || user.status === 'banned') return null;
  return mapDbUser(user);
}

/**
 * Require authentication. Redirect to /login if not logged in.
 * If requireOnboarding is true, redirects to /onboarding if onboarding not completed.
 */
export async function requireUser(options?: { redirectTo?: string; requireOnboarding?: boolean }): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    await performRedirect(options?.redirectTo || '/login');
  }
  if (options?.requireOnboarding !== false && !user?.onboardingCompleted) {
    await performRedirect('/onboarding');
  }
  return user as SafeUser;
}

/**
 * Require guest (no session). Redirect to /dashboard if logged in.
 */
export async function requireGuest(redirectTo?: string): Promise<void> {
  // In offline mode, do not force-redirect guests away from login/register pages
  if (!isSupabaseConfigured()) return;

  const user = await getCurrentUser();
  if (user) {
    if (!user.onboardingCompleted) {
      await performRedirect('/onboarding');
    }
    await performRedirect(redirectTo || '/dashboard');
  }
}

/**
 * Require authentication. Redirect to /login if not logged in.
 * If a requiredPlatformRole is given, also check platform role. Redirect to / if insufficient.
 * Returns the session payload.
 * @deprecated Use requireUser() instead.
 */
export async function requireAuth(requiredPlatformRole?: PlatformRole) {
  const session = await getSession();
  if (!session) {
    await performRedirect('/login');
  }

  const user = await getUserFromDb(session?.userId || 'default_student_id');
  if (!user || user.status === 'banned') {
    const { clearSession } = await import('./auth.ts');
    await clearSession();
    await performRedirect('/login?reason=banned');
  }

  const effectiveRole = user.role as string;

  if (requiredPlatformRole && !hasPlatformRole(effectiveRole, requiredPlatformRole)) {
    await performRedirect('/');
  }

  return {
    ...session,
    role: effectiveRole,
    fullName: (user.full_name || user.fullName || null) as string | null,
  };
}

/**
 * For use in API routes - returns session or null, doesn't redirect.
 */
export async function getOptionalSession() {
  return getSession();
}
