import { getSession, getUserFromDb } from './auth';
import { redirect } from 'next/navigation';
import type { WorkspaceRole } from './workspace-permissions';

export enum PlatformRole {
  USER = 'USER',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
}

const workspaceHierarchy: Record<WorkspaceRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  MEMBER: 2,
  VIEWER: 1,
};

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

function mapDbUser(user: any): SafeUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    displayName: user.display_name,
    role: user.role,
    emailVerified: !!user.email_verified,
    onboardingCompleted: !!user.onboarding_completed,
    avatarUrl: user.avatar_url,
    school: user.school,
    major: user.major,
    academicYear: user.academic_year,
  };
}

/**
 * Get current authenticated user with full DB data.
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
    redirect(options?.redirectTo || '/login');
  }
  if (options?.requireOnboarding !== false && !user.onboardingCompleted) {
    redirect('/onboarding');
  }
  return user;
}

/**
 * Require guest (no session). Redirect to /dashboard if logged in.
 */
export async function requireGuest(redirectTo?: string): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    if (!user.onboardingCompleted) {
      redirect('/onboarding');
    }
    redirect(redirectTo || '/dashboard');
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
    redirect('/login');
  }

  const user = await getUserFromDb(session.userId);
  if (!user || user.status === 'banned') {
    const { clearSession } = await import('./auth');
    await clearSession();
    redirect('/login?reason=banned');
  }

  const effectiveRole = user.role as string;

  if (requiredPlatformRole && !hasPlatformRole(effectiveRole, requiredPlatformRole)) {
    redirect('/');
  }

  return {
    ...session,
    role: effectiveRole,
    fullName: user.full_name as string | null,
  };
}

/**
 * For use in API routes - returns session or null, doesn't redirect.
 */
export async function getOptionalSession() {
  return getSession();
}
