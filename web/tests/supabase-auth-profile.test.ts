import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ensureDefaultProfile,
  PlatformRole,
  hasPlatformRole,
  hasWorkspaceRole,
} from '../src/lib/authorization.ts';

import {
  signUpWithEmail,
  signInWithEmail,
  signOut,
  resetPassword,
  getOfflineMockSession,
  getSession,
  hashPassword,
  verifyPassword,
} from '../src/lib/auth.ts';

import {
  protectedRoutes,
  authRoutes,
  isSupabaseConfigured,
} from '../src/middleware.ts';

import {
  GET as healthGET,
} from '../src/app/api/health/route.ts';

// ----------------------------------------------------------------------------
// 1. Student Profile Auto-Initialization (ensureDefaultProfile)
// ----------------------------------------------------------------------------

test('ensureDefaultProfile (1/3): initializes required gamification stats (XP=0, Level=1, rank_title, streak=1, vibe_theme=aurora)', async () => {
  const profile = await ensureDefaultProfile({
    id: 'student-uuid-001',
    email: 'nam.tran@campusos.edu.vn',
    fullName: 'Trần Hoài Nam',
  });

  assert.equal(profile.id, 'student-uuid-001');
  assert.equal(profile.user_id, 'student-uuid-001');
  assert.equal(profile.email, 'nam.tran@campusos.edu.vn');
  assert.equal(profile.full_name, 'Trần Hoài Nam');
  assert.equal(profile.display_name, 'Trần Hoài Nam');
  assert.equal(profile.xp, 0);
  assert.equal(profile.level, 1);
  assert.equal(profile.rank_title, 'Tân sinh viên ngơ ngác');
  assert.equal(profile.streak, 1);
  assert.equal(profile.streak_freezes, 1);
  assert.equal(profile.vibe_theme, 'aurora');
  assert.equal(profile.onboarding_completed, false);
  assert.ok(profile.created_at);
  assert.ok(profile.updated_at);
});

test('ensureDefaultProfile (2/3): falls back gracefully when optional fields are omitted', async () => {
  const profile = await ensureDefaultProfile({
    id: '',
    email: null,
  });

  assert.equal(profile.id, 'default_student_id');
  assert.equal(profile.email, 'student@campusos.edu.vn');
  assert.equal(profile.xp, 0);
  assert.equal(profile.level, 1);
  assert.equal(profile.rank_title, 'Tân sinh viên ngơ ngác');
  assert.equal(profile.streak, 1);
  assert.equal(profile.vibe_theme, 'aurora');
});

test('ensureDefaultProfile (3/3): derives display name from user_metadata or email prefix', async () => {
  const profileFromMeta = await ensureDefaultProfile({
    id: 'user-meta',
    email: 'minh.le@hust.edu.vn',
    user_metadata: { full_name: 'Lê Nhật Minh' },
  });
  assert.equal(profileFromMeta.display_name, 'Lê Nhật Minh');

  const profileFromEmail = await ensureDefaultProfile({
    id: 'user-email-only',
    email: 'anh.nguyen@vnu.edu.vn',
  });
  assert.equal(profileFromEmail.display_name, 'anh.nguyen');
});

// ----------------------------------------------------------------------------
// 2. Supabase Auth Function Exports & Offline Session Handling
// ----------------------------------------------------------------------------

test('Supabase Auth (1/4): provides deterministic authenticated mock student session', () => {
  const defaultSession = getOfflineMockSession();
  assert.equal(defaultSession.id, 'default_student_id');
  assert.equal(defaultSession.userId, 'default_student_id');
  assert.equal(defaultSession.email, 'student@campusos.edu.vn');
  assert.equal(defaultSession.role, 'student');

  const customSession = getOfflineMockSession('developer@campusos.edu.vn');
  assert.equal(customSession.email, 'developer@campusos.edu.vn');
  assert.equal(customSession.role, 'student');
});

test('Supabase Auth (2/4): signInWithEmail and signUpWithEmail return valid session structures with 0ms delay in offline mode', async () => {
  const signInRes = await signInWithEmail('student@campusos.edu.vn', 'P@ssword123');
  assert.equal(signInRes.error, null);
  assert.ok(signInRes.data?.user);
  assert.equal(signInRes.data.user.id, 'default_student_id');
  assert.equal(signInRes.data.user.role, 'student');
  assert.ok(signInRes.data.session?.access_token);

  const signUpRes = await signUpWithEmail('newbie@campusos.edu.vn', 'P@ssword123', 'Đặng Thùy Trang');
  assert.equal(signUpRes.error, null);
  assert.ok(signUpRes.data?.user);
  assert.equal(signUpRes.data.user.id, 'default_student_id');
  assert.equal(signUpRes.data.user.user_metadata?.full_name, 'Đặng Thùy Trang');
});

test('Supabase Auth (3/4): signOut and resetPassword execute smoothly without error', async () => {
  const signOutRes = await signOut();
  assert.equal(signOutRes.error, null);

  const resetEmailRes = await resetPassword('student@campusos.edu.vn');
  assert.ok(resetEmailRes);

  const resetTokenRes = await resetPassword('fake-reset-token', 'NewPassword123');
  assert.equal(resetTokenRes, true);
});

test('Supabase Auth (4/4): getSession returns offline mock session outside request scope, password hashing works genuine', async () => {
  const session = await getSession();
  assert.ok(session);
  assert.equal(session.userId, 'default_student_id');
  assert.equal(session.role, 'student');

  const hash = await hashPassword('Secret123!');
  assert.ok(hash.startsWith('$2'));
  const isValid = await verifyPassword('Secret123!', hash);
  assert.equal(isValid, true);
  const isInvalid = await verifyPassword('WrongPassword', hash);
  assert.equal(isInvalid, false);
});

// ----------------------------------------------------------------------------
// 3. Route Protection in Middleware
// ----------------------------------------------------------------------------

test('Middleware Route Protection (1/2): includes /workspaces and /coach in protectedRoutes', () => {
  assert.ok(protectedRoutes.includes('/workspaces'), 'protectedRoutes must include /workspaces');
  assert.ok(protectedRoutes.includes('/coach'), 'protectedRoutes must include /coach');

  const expectedCoreRoutes = [
    '/dashboard',
    '/calendar',
    '/tasks',
    '/study',
    '/roadmaps',
    '/skills',
    '/clubs',
    '/living',
    '/notifications',
    '/profile',
    '/settings',
    '/onboarding',
  ];

  for (const route of expectedCoreRoutes) {
    assert.ok(protectedRoutes.includes(route), `protectedRoutes must include ${route}`);
  }
});

test('Middleware Route Protection (2/2): configures authRoutes and checks Supabase config helper', () => {
  assert.deepEqual(authRoutes, [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ]);

  const configured = isSupabaseConfigured();
  assert.equal(typeof configured, 'boolean');
});

// ----------------------------------------------------------------------------
// 4. Health API Route Diagnostics (Supabase Health without MySQL)
// ----------------------------------------------------------------------------

test('Health Route (1/2): reports ok status and Supabase mode without MySQL', async () => {
  const response = await healthGET();
  assert.equal(response.status, 200);

  const json = await response.json();
  assert.equal(json.status, 'ok');
  assert.ok(json.timestamp);
  assert.ok(typeof json.supabase.configured === 'boolean');
  assert.ok(['cloud', 'offline_mock'].includes(json.supabase.mode));
  assert.equal(json.db, undefined, 'Health check must not expose legacy MySQL db field');
});

test('Health Route (2/2): GET handler matches exact health schema specification', async () => {
  const response = await healthGET();
  const json = await response.json();

  assert.equal(json.status, 'ok');
  assert.ok(Date.parse(json.timestamp) > 0, 'timestamp must be valid ISO date string');
  assert.equal(json.supabase.configured, isSupabaseConfigured());
  assert.equal(json.supabase.mode, isSupabaseConfigured() ? 'cloud' : 'offline_mock');
});

// ----------------------------------------------------------------------------
// 5. Platform & Workspace Role Hierarchy
// ----------------------------------------------------------------------------

test('Authorization Hierarchy: PLATFORM_ADMIN has universal access and workspace levels are strictly ordered', () => {
  assert.equal(hasPlatformRole('PLATFORM_ADMIN', PlatformRole.USER), true);
  assert.equal(hasPlatformRole('USER', PlatformRole.USER), true);
  assert.equal(hasPlatformRole('student', PlatformRole.USER), false);

  assert.equal(hasWorkspaceRole('OWNER', 'ADMIN'), true);
  assert.equal(hasWorkspaceRole('ADMIN', 'MANAGER'), true);
  assert.equal(hasWorkspaceRole('MANAGER', 'MEMBER'), true);
  assert.equal(hasWorkspaceRole('MEMBER', 'VIEWER'), true);
  assert.equal(hasWorkspaceRole('VIEWER', 'MEMBER'), false);
});
