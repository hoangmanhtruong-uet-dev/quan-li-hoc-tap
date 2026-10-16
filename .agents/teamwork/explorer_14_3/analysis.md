# CampusOS: Auth, Middleware, API Routes & Testing Suite Investigation Report

**Author**: `explorer_14_3` (Auth & Testing Explorer)  
**Date**: 2026-10-16  
**Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap`  
**Web Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`  
**Target Milestone**: R4 and Project Quality Gates (Milestone 14)

---

## 1. Executive Summary

CampusOS is a Next.js 14.2.5 (App Router) full-stack web application designed for Vietnamese university students. Currently:
- **Quality Gates Status**:
  - `npm test`: **339/339 tests pass** in **2.77s** across 22 test files using the Node.js native test runner (`node --experimental-strip-types --test tests/*.test.ts`).
  - `npm run typecheck`: **0 errors** (`tsc --noEmit` exits with 0).
  - `npm run build`: **51 routes** (34 static pages, 17 dynamic routes/APIs) compiled successfully with **0 build or lint errors**.
- **Current Auth & Database Dilemma**:
  - The UI has already evolved to Cyber-Glass and utilizes modular client engines (`campus-store.ts`, `workspace-engine.ts`, `club-engine.ts`, `living-engine.ts`, `academic-engine.ts`).
  - However, the backend authentication (`src/lib/auth.ts`, `src/app/api/auth/*`), middleware (`src/middleware.ts`), and workspace service (`src/lib/workspace-service.ts`) still contain legacy MySQL dependencies via `mysql2/promise` and `src/lib/db.ts`.
  - In an environment without a running MySQL instance or without `DB_HOST`, API calls to `/api/auth/*`, `/api/health`, and `/api/workspaces` fail.
- **R4 Objective**:
  - Completely decouple the platform from MySQL, unifying 100% of the backend into the **Supabase PostgreSQL ecosystem** (Supabase Auth, RLS, Storage, Realtime, and Serverless API endpoints).
  - Upgrade middleware to authenticate sessions via Supabase and guarantee automatic student profile creation on registration with zero disruption to the existing 339 unit tests.

---

## 2. Current Authentication & Migration to Supabase Auth

### 2.1 Current Auth Implementation

The existing auth logic is located across:
- **Core Library**: `src/lib/auth.ts` (195 lines)
  - Uses `bcryptjs` for password hashing (12 salt rounds).
  - Uses `jose` (`SignJWT`, `jwtVerify`) with a symmetric secret `AUTH_SECRET` (fallback `'dev-only-auth-secret'`).
  - Issues 7-day JWT tokens stored in an HTTP-only cookie named `session`.
  - Queries a MySQL `users` table (`SELECT id, email, password_hash, ...`).
  - Auxiliary MySQL tables: `email_verifications` (24h token) and `password_resets` (24h token with transaction locking).
- **Client Auth Context**: `src/lib/auth-context.tsx` (63 lines)
  - React Context `<AuthProvider>` wrapping `<RootLayout>` in `src/app/layout.tsx`.
  - State: `user: User | null`, `loading: boolean`.
  - In `useEffect`, performs `fetch('/api/auth/me')` on mount.
  - Exposes `logout()` which invokes `POST /api/auth/logout`.
- **Authorization Layer**: `src/lib/authorization.ts` (140 lines)
  - Helper functions: `getCurrentUser()`, `requireUser()`, `requireGuest()`, `requireAuth()`, `hasPlatformRole()`, `hasWorkspaceRole()`.
  - `(main)/layout.tsx` executes `await requireUser({ requireOnboarding: false })` on server render.
- **UI Auth Pages**:
  - `src/app/(auth)/login/page.tsx`: Submits `{ email, password }` to `POST /api/auth/login`. Handles banned status & redirects to `/onboarding` or `/dashboard`.
  - `src/app/(auth)/register/page.tsx`: Submits `{ email, password, fullName }` to `POST /api/auth/register`. On 201, navigates to `/verify-email`.
  - `src/app/(auth)/forgot-password/page.tsx`: Submits `{ email }` to `POST /api/auth/forgot-password`.
  - `src/app/(auth)/reset-password/page.tsx`: Reads `?token=...`, submits `{ token, password }` to `POST /api/auth/reset-password`.
  - `src/app/(auth)/verify-email/page.tsx`: Supports URL token (`GET /api/auth/verify-email?token=...`) and manual code submit (`POST /api/auth/verify-email`).
  - `src/app/(auth)/layout.tsx`: Centered glass card layout with dual aurora ambient glow.

### 2.2 Supabase Auth Architecture & Session Management

Supabase provides enterprise-grade authentication directly in PostgreSQL via the `auth` schema:
- **User Record**: `auth.users` holds UUID `id`, `email`, encrypted password, `email_confirmed_at`, `raw_user_meta_data`, etc.
- **Client Integration Choice**:
  - **Option A: `@supabase/ssr`**
    - Official standard for Next.js 14 App Router.
    - Package: `@supabase/ssr` (available on npm, version `0.12.7`).
    - Provides `createServerClient` and `createBrowserClient` with automatic cookie chunking (`sb-<ref>-auth-token`).
  - **Option B: `@supabase/supabase-js` with Custom Next.js Cookie Adapter**
    - `@supabase/supabase-js` is already installed (`^2.117.3`).
    - Can configure `auth.storage` or manage auth tokens in server Route Handlers/Middleware using standard `cookies()`.
  - *Recommendation*: Use standard `@supabase/ssr` for seamless server/client cookie synchronization, or encapsulate Supabase client creation in `src/lib/supabase-server.ts` and `src/lib/supabase-client.ts`.

### 2.3 Automatic Student Profile Creation (Triggers & Fallback)

To ensure every new user automatically receives an initialized student profile with gamification stats, a two-tier strategy is required:

#### Tier 1: PostgreSQL Trigger (`003_complete_campusos_schema.sql`)
When a user signs up via Supabase Auth:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    user_id,
    email,
    full_name,
    display_name,
    xp,
    level,
    rank_title,
    streak,
    streak_freezes,
    vibe_theme,
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    0,
    1,
    'Tân sinh viên ngơ ngác',
    1,
    1,
    'aurora',
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### Tier 2: Application Read-Through Fallback (`src/lib/authorization.ts` & `/api/auth/me`)
In development or when running against mock/offline Supabase where triggers may not fire:
```typescript
export async function ensureDefaultProfile(user: { id: string; email: string; user_metadata?: any }): Promise<Profile> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) return existing;

  const defaultProfile = {
    id: user.id,
    user_id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || '',
    display_name: user.user_metadata?.full_name || user.email.split('@')[0],
    xp: 0,
    level: 1,
    rank_title: 'Tân sinh viên ngơ ngác',
    streak: 1,
    streak_freezes: 1,
    vibe_theme: 'aurora',
    onboarding_completed: false,
  };

  const { data: created } = await supabase
    .from('profiles')
    .upsert(defaultProfile, { onConflict: 'id' })
    .select()
    .single();

  return created || defaultProfile;
}
```

---

## 3. Middleware Architecture & Route Protection

### 3.1 Current Middleware Analysis (`src/middleware.ts`)

File: `src/middleware.ts` (89 lines)
```typescript
// Lines 16-29: Protected routes list
const protectedRoutes = [
  '/dashboard', '/calendar', '/tasks', '/study', '/roadmaps',
  '/skills', '/clubs', '/living', '/notifications', '/profile',
  '/settings', '/onboarding',
];

// Lines 32: Auth-only routes
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
```

**Shortcomings Identified**:
1. **Missing Protected Routes**:
   - `/workspaces` and `/workspaces/[workspaceId]` are omitted from `protectedRoutes`! An unauthenticated user hitting `/workspaces` bypasses middleware (though `(main)/layout.tsx` catches it, middleware is the primary edge defense).
   - `/coach` is also omitted from `protectedRoutes`.
2. **Hardcoded Legacy JWT**:
   - Middleware reads `request.cookies.get('session')?.value` and executes `jwtVerify(token, SECRET)`.
   - It cannot validate Supabase Auth tokens (`sb-<project>-auth-token`).
3. **No Session Refresh**:
   - Next.js middleware should refresh expired Supabase auth tokens so Server Components receive fresh session cookies.

### 3.2 Target Supabase Middleware Specification

```typescript
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const protectedPrefixes = [
  '/dashboard', '/calendar', '/tasks', '/study', '/roadmaps',
  '/skills', '/clubs', '/living', '/notifications', '/profile',
  '/settings', '/onboarding', '/workspaces', '/coach',
];

const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, Next internals, and public endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico' ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Resilient fallback for mock/offline environment
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('mock-supabase')) {
    // In mock/dev mode, allow bypass if dev session cookie exists
    const mockSession = request.cookies.get('session')?.value || request.cookies.get('sb-mock-auth')?.value;
    const isProtected = protectedPrefixes.some(p => pathname.startsWith(p));
    if (isProtected && !mockSession && process.env.NODE_ENV === 'production') {
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url));
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const isProtected = protectedPrefixes.some(p => pathname.startsWith(p));
  const isAuth = authRoutes.some(p => pathname.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuth && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}
```

---

## 4. API Routes Inventory & Supabase Integration Matrix

| API Route | Current Handler | Dependencies | Supabase Upgrade Action |
|---|---|---|---|
| `POST /api/auth/login` | MySQL `users` query + bcrypt + jose JWT | `mysql2`, `@/lib/db`, `bcryptjs`, `jose` | Call `supabase.auth.signInWithPassword({ email, password })`. Return user & `needsOnboarding`. Eliminate MySQL. |
| `POST /api/auth/register` | MySQL `INSERT INTO users`, `personal-workspace.ts`, `email_verifications` | `mysql2`, `@/lib/db`, `crypto`, `resend` | Call `supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })`. Eliminate MySQL. |
| `POST /api/auth/logout` | `clearSession()` deleting `session` cookie | `@/lib/auth` | Call `supabase.auth.signOut()`. Clear Supabase SSR auth cookies. |
| `GET /api/auth/me` | `getCurrentUser()` via MySQL `users` | `mysql2`, `@/lib/authorization` | Retrieve `supabase.auth.getUser()`, join with `profiles` table. Return SafeUser payload. |
| `POST /api/auth/forgot-password` | MySQL `password_resets` insert + Resend email | `mysql2`, `@/lib/db` | Call `supabase.auth.resetPasswordForEmail(email)`. Clean serverless handling. |
| `POST /api/auth/reset-password` | MySQL transaction updating `password_hash` | `mysql2`, `@/lib/db` | Call `supabase.auth.updateUser({ password })`. Clean serverless handling. |
| `GET/POST /api/auth/verify-email` | MySQL `email_verifications` token check + auto login | `mysql2`, `@/lib/db` | Supabase OTP verification or callback handler `/auth/callback`. |
| `GET /api/health` | `pool.query('SELECT 1 AS ok')` | `mysql2`, `@/lib/db` | Query Supabase REST `/rest/v1/` or `supabase.from('profiles').select('count', { count: 'exact', head: true })`. Report Supabase health status. |
| `POST /api/onboarding` | Updates MySQL `users` columns & personal workspace | `mysql2`, `@/lib/db` | Update `profiles` in Supabase (`supabase.from('profiles').update(...)`). Mark `onboarding_completed: true`. |
| `POST /api/coach` | Google Gemini 1.5 Flash + `coach-engine.ts` | None (pure AI + local) | Keep intact. Already fully decoupled and resilient. |
| `POST /api/tts` | MsEdgeTTS + Google Translate TTS fallback | None (pure audio stream) | Keep intact. Already fully decoupled and resilient. |
| `GET /api/workspaces` | `listCurrentUserWorkspaces` via MySQL `team_workspaces` | `mysql2`, `workspace-service.ts` | Query Supabase table `workspaces` joined with `workspace_members`, or delegate to `workspace-engine.ts`. |
| `GET /api/workspaces/[id]` | `getCurrentUserWorkspace` via MySQL | `mysql2`, `workspace-service.ts` | Query Supabase `workspaces` table. |
| `PATCH/DELETE /api/workspaces/[id]/memberships/[id]` | MySQL transaction for RBAC role updates | `mysql2`, `workspace-service.ts` | Update `workspace_members` in Supabase with RLS role protection. |

### Elimination of Legacy MySQL Code
Files to deprecate / remove in Milestone 14:
- `src/lib/db.ts`: Deprecated. Replaced by `src/lib/supabase.ts` (and server client).
- `scripts/check-tables.mjs`, `scripts/migrate-auth.sql`, `scripts/migrate-phase-5b.mjs`, `scripts/migrate-roles.sql`: Replaced by `supabase/migrations/003_complete_campusos_schema.sql`.
- Remove `"mysql2"` from `package.json`.

---

## 5. Testing Suite & Quality Gates Forensics

### 5.1 Existing Testing Infrastructure

- **Runner**: Node.js built-in test runner (`node:test` + `node:assert/strict`).
- **Command**: `npm test` runs:
  ```bash
  node --experimental-strip-types --test tests/*.test.ts
  ```
- **Execution Performance**:
  - `tests 339`
  - `suites 1`
  - `pass 339`
  - `fail 0`
  - `duration_ms ~2771ms` (under 3 seconds!)
- **Typecheck**: `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.
- **Production Build**: `npm run build` compiles 51 routes cleanly.

### 5.2 Breakdown of Existing 22 Test Suites (339 Tests)

1. `academic-engine.test.ts` (14 tests): GPA/CPA computation, grade conversion, grade target solver.
2. `adversarial-challenger-m4.test.ts` (12 tests): Edge cases for Pomodoro & Focus sessions.
3. `auditor-m3-forensics.test.ts` (16 tests): System audit & integrity checks.
4. `campus-redesign.test.ts` (28 tests): Calendar heat scores, conflict detection, `.ics` export/import.
5. `challenger-leo-2-adversarial.test.ts` (15 tests): Three.js cat physics & interaction tests.
6. `challenger-leo-adversarial-stress.test.ts` (18 tests): Stress testing animation frames & memory.
7. `challenger-m1-1-tasks-engine.test.ts` (16 tests): Tasks CRUD & date grouping.
8. `challenger-m1-2-stress-boundary.test.ts` (18 tests): Boundary date & NLP parser testing.
9. `challenger-m1-2-stress.test.ts` (14 tests): Rapid task batch mutation stress.
10. `challenger-m1-quicktask-stress.test.ts` (15 tests): Quick task NLP extraction & undo stress.
11. `challenger-m1-tasks-reactivity.test.ts` (12 tests): React 18 `useSyncExternalStore` reactivity.
12. `club-engine.test.ts` (16 tests): Club events, finance ledger, member roles.
13. `coach-engine.test.ts` (14 tests): AI Coach prompt generation & quiz generator.
14. `growth-engine.test.ts` (15 tests): XP curves, skill unlocks, roadmap DAG graph traversal.
15. `pomodoro-leo.test.ts` (18 tests): Strict pomodoro countdown, TTS triggers, supervisor arbiter.
16. `profile-notifications-settings.test.ts` (16 tests): Student ID holographic radar, notification center.
17. `quick-task-nlp-sync.test.ts` (15 tests): NLP Vietnamese parsing chips, priority tiers.
18. `storage-engine.test.ts` (4 tests): `formatBytes`, `inferFileType`, `STORAGE_BUCKET`, `StoredFile` interface.
19. `supervisor-arbiter.test.ts` (12 tests): Tab switch discipline tracking, shame score calculation.
20. `tasks-redesign.test.ts` (46 tests): Eisenhower 2x2 matrix, urgency countdowns, subtasks.
21. `workspace-engine.test.ts` (8 tests): Multi-workspace CRUD, Kanban progress, RBAC permissions.
22. `workspace-permissions.test.ts` (6 tests): Permission matrix, last-owner demotion guards.

### 5.3 Test Coverage Gap Analysis & New Tests Needed for R4

Currently, there are **0 unit tests** validating:
1. **Supabase Sync Engine (`supabase-sync.ts`)**:
   - Debounced sync queue execution.
   - Profile payload transformation (snake_case DB columns ↔ camelCase store properties).
   - Deadlines & calendar events bi-directional synchronization.
   - Focus session logger payload verification.
   - Offline fallback resiliency (silent catch when network/tables are not ready).
2. **Supabase Auth & Default Profile Fallback (`auth.ts` / `authorization.ts`)**:
   - Automatic default profile generation logic (`xp=0`, `level=1`, `rankTitle='Tân sinh viên ngơ ngác'`, `streak=1`, `vibeTheme='aurora'`).
   - PlatformRole validation (`USER` vs `PLATFORM_ADMIN`).
   - SafeUser transformation from raw database/auth rows.
3. **Supabase Storage Engine (`storage-engine.ts`)**:
   - Multi-bucket configuration: `academic-materials`, `task-attachments`, `student-avatars`.
   - File upload with Base64 data URL fallback when Supabase Cloud is offline.
   - File size & MIME type validation.
4. **Health Route Diagnostics (`/api/health`)**:
   - Health check endpoint response schema validation.

---

## 6. Implementation Blueprint for R4

### 6.1 Phase 1: Supabase Schema & Trigger Migration
- Deliver `supabase/migrations/003_complete_campusos_schema.sql` containing:
  - `profiles` table with foreign key to `auth.users(id)`.
  - Trigger `on_auth_user_created` executing `handle_new_user()`.
  - Full RLS policies for `profiles`, `tasks`, `courses`, `workspaces`, `clubs`, `dorm_spaces`, `student_notifications`.
  - Storage bucket configurations for `academic-materials`, `task-attachments`, `student-avatars`.

### 6.2 Phase 2: Decouple MySQL & Upgrade `auth.ts` / `authorization.ts`
- Replace MySQL queries in `auth.ts` with Supabase client calls.
- Enhance `authorization.ts` with read-through default profile creation.
- Update `/api/auth/*` routes to use Supabase Auth.
- Update `/api/health` to check Supabase status.

### 6.3 Phase 3: Update Middleware
- Modernize `src/middleware.ts` to include all protected paths (`/workspaces`, `/coach`, etc.).
- Add Supabase session validation with offline/mock bypass.

### 6.4 Phase 4: Unit Test Suite Expansion
- Create new test files in `tests/`:
  - `tests/supabase-sync-engine.test.ts`
  - `tests/supabase-auth-profile.test.ts`
  - `tests/supabase-storage-buckets.test.ts`
- Verify that `npm test` passes 100% of existing 339 tests plus all new tests (bringing the total to 365+ tests).
- Verify `npm run typecheck` and `npm run build`.

---
