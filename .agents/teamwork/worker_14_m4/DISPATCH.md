## 2026-10-16T21:24:36Z
You are worker_14_m4 (Supabase Auth & MySQL Deprecation Worker) for Milestone 4.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_14_m4
Project root: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap
Web app directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
Authoritative request log: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md
Project plan: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
Auth & Testing Analysis: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_14_3\analysis.md
Schema & MySQL Analysis: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_14_1\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your write ownership:
You own:
- `web/src/lib/auth.ts`
- `web/src/lib/authorization.ts`
- `web/src/lib/db.ts`
- `web/src/lib/workspace-service.ts`
- `web/src/lib/personal-workspace.ts`
- `web/src/lib/workspace-authorization.ts`
- `web/src/middleware.ts`
- `web/src/app/api/auth/*`
- `web/src/app/api/health/route.ts`
- `web/package.json`
- `web/tests/supabase-auth-profile.test.ts`

Your mission:
Hợp nhất Supabase Auth & loại bỏ phụ thuộc MySQL cũ (R4):
1. **Refactor `web/src/lib/auth.ts`**:
   - Replace legacy MySQL `users`, `email_verifications`, and `password_resets` queries with Supabase Auth:
     - `signUpWithEmail(email, password, fullName)` -> calls `supabase.auth.signUp(...)`.
     - `signInWithEmail(email, password)` -> calls `supabase.auth.signInWithPassword(...)`.
     - `signOut()` -> calls `supabase.auth.signOut()`.
     - `resetPassword(email)` -> calls `supabase.auth.resetPasswordForEmail(...)`.
     - Provide offline fallback: if `!isSupabaseConfigured()`, provide a deterministic authenticated mock student session (`id: 'default_student_id'`, `email: email || 'student@campusos.edu.vn'`, `role: 'student'`) so dev mode, unit tests, and SSR work with 0ms delay and never crash.
2. **Auto-Initialize Student Profile (`ensureDefaultProfile`)**:
   - In `web/src/lib/authorization.ts` and `web/src/app/api/auth/me/route.ts`:
     - Implement `ensureDefaultProfile(user)`: queries `profiles` in Supabase; if not found or in offline mode, returns default profile:
       - `xp: 0`
       - `level: 1`
       - `rank_title: 'Tân sinh viên ngơ ngác'`
       - `streak: 1`
       - `vibe_theme: 'aurora'`
3. **Route Protection in `web/src/middleware.ts`**:
   - Add `/workspaces`, `/workspaces/[workspaceId]`, and `/coach` to `protectedRoutes`.
   - Update token verification to support Supabase session cookies alongside existing session token, with offline bypass if `!isSupabaseConfigured()`.
4. **API Routes (`web/src/app/api/auth/*` & `web/src/app/api/health/route.ts`)**:
   - `src/app/api/auth/login/route.ts`: authenticate via Supabase Auth (with offline fallback).
   - `src/app/api/auth/register/route.ts`: sign up via Supabase Auth and initialize profile.
   - `src/app/api/auth/forgot-password/route.ts`: trigger password reset via Supabase.
   - `src/app/api/auth/verify-email/route.ts`: handle verification via Supabase.
   - `src/app/api/auth/reset-password/route.ts`: handle password update via Supabase.
   - `src/app/api/health/route.ts`:
     - Remove `import pool from '@/lib/db'`.
     - Return `{ status: 'ok', timestamp: new Date().toISOString(), supabase: { configured: isSupabaseConfigured(), mode: isSupabaseConfigured() ? 'cloud' : 'offline_mock' } }`.
5. **Eliminate MySQL Legacy Usage**:
   - `web/src/lib/db.ts`: Deprecate without importing `mysql2`. Export safe stubs so no runtime errors occur.
   - `web/src/lib/workspace-service.ts`, `personal-workspace.ts`, `workspace-authorization.ts`: remove `import pool from './db'`, query Supabase PostgreSQL `workspaces` / `workspace_members` table or fall back cleanly to memory.
   - In `web/package.json`: remove `"mysql2": "^3.22.6"`.
6. **Testing (`web/tests/supabase-auth-profile.test.ts`)**:
   - Add unit tests verifying:
     - `ensureDefaultProfile` returns required default values (XP=0, Level=1, rank_title, streak=1, vibe_theme='aurora').
     - Supabase Auth function exports and offline session handling.
     - Protected routes list in middleware includes `/workspaces` and `/coach`.
     - Health API route reports Supabase health without MySQL.
7. **Verification**:
   - Run `npm run typecheck` in `web/` (0 errors).
   - Run `npm test` in `web/` (100% tests pass, now 375+ tests).
   - Run `npm run build` in `web/` (34/34 routes pass).
8. Deliver `handoff.md` with complete verification command outputs.
