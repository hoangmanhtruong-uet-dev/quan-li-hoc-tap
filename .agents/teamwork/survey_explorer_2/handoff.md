# Handoff Report: In-Depth Survey of Auth Pages, State Management, Supabase Auth Integrations, and Form Logic

**Author**: `survey_explorer_2`  
**Date**: 2026-10-17T07:24:30Z  
**Target Milestone**: Comprehensive Auth Flow Redesign (Login, Register, Forgot Password, Reset Password, Verify Email)  
**Parent / Recipient**: `orchestrator_17` (`29257fd0-4cce-43cc-906d-4f5f80b1ce6e`)  

---

## 1. Observation

Direct code observations from inspection of `web/src/app/(auth)/`, `web/src/lib/`, `web/src/middleware.ts`, `web/src/app/api/auth/`, and `web/tests/`:

### 1.1 Existing Auth Pages in `web/src/app/(auth)/`

1. **`web/src/app/(auth)/login/page.tsx` (Lines 1–96)**:
   - Uses plain shadcn `<Card>`, `<Input>`, `<Button>` without glassmorphism or neon accents:
     ```tsx
     <Card className="w-full max-w-sm">
       <CardHeader className="text-center">
         <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">C</div>
         <CardTitle>Sign in</CardTitle>
         <CardDescription>Enter your credentials to continue</CardDescription>
       </CardHeader>
     ```
   - Only has standard `email` and `password` inputs.
   - **Missing features observed**:
     - No **1-Click Demo Quick Login** button (`minh.nguyen@campus.edu.vn` / `Demo@123456`).
     - No **Supabase Google & GitHub OAuth** buttons.
     - No **Cyberpunk neon-focused input classes** (`focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(61,232,255,0.25)]`).
     - No **Show/Hide password toggle** (eye icon).
     - No **"Ghi nhớ đăng nhập" (Remember Me)** checkbox.
     - No **Shake animation** on error (currently static `<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>`).

2. **`web/src/app/(auth)/register/page.tsx` (Lines 1–82)**:
   - Contains only three fields: `Full name`, `Email`, and `Password` (min 6 chars).
   - **Missing features observed**:
     - No **Password Confirmation** field (`confirmPassword`).
     - No **`.edu.vn` student email domain validation** (currently accepts any email format via HTML5 type="email").
     - No **Real-time 4-Level Password Strength Meter** (evaluating Length ≥ 8, Uppercase, Number, Special character).
     - No **Terms & Academic Code of Conduct** checkbox.
     - No **Show/Hide password toggle** or Cyber-glass visual styling.

3. **`web/src/app/(auth)/forgot-password/page.tsx` (Lines 1–82)**:
   - Simple form with email input and generic english copy.
   - **Missing features observed**:
     - No **60-second resend cooldown timer** when email is sent.
     - No Cyber-glass frosted glass styling or neon visual hierarchy.

4. **`web/src/app/(auth)/reset-password/page.tsx` (Lines 1–94)**:
   - Expects `token` query parameter, provides a single `New password` input.
   - **Missing features observed**:
     - No **Password Confirmation** field.
     - No **Password Strength Meter** integration.
     - No **Show/Hide password toggle**.
     - No Cyber-glass styling.

5. **`web/src/app/(auth)/verify-email/page.tsx` (Lines 1–109)**:
   - Basic card with token input and english text.
   - **Missing features observed**:
     - No **Glowing Holographic Mail Icon** (`shadow-[0_0_30px_rgba(61,232,255,0.4)]`).
     - No **"Ghi lại mã xác thực" (Resend verification code)** button with 60-second cooldown timer.
     - No Cyber-glass styling.

---

### 1.2 Supabase Authentication Utilities & Middleware

1. **`web/src/lib/supabase.ts` (Lines 1–41)**:
   - Uses `@supabase/supabase-js` `createClient(supabaseUrl, supabaseAnonKey)`.
   - `isSupabaseConfigured(): boolean` (lines 15–18):
     ```ts
     export function isSupabaseConfigured(): boolean {
       const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
       return Boolean(url && url.trim().length > 0 && !url.includes('mock-supabase'));
     }
     ```
   - When offline or mock URL, safe 0ms fallbacks are expected throughout the app.

2. **`web/src/lib/auth.ts` (Lines 1–332)**:
   - Session management uses `jose` JWT (`SignJWT` / `jwtVerify`) signed by `AUTH_SECRET` (defaulting to `'dev-only-auth-secret'`).
   - Session cookie: name `session`, `httpOnly: true`, `sameSite: 'lax'`, `maxAge: 7 * 24 * 60 * 60` (7 days).
   - `signInWithEmail(email, password)`:
     - When `!isSupabaseConfigured()`: returns deterministic mock user (`id: 'default_student_id'`, `email`, `role: 'student'`) with `access_token: 'mock-offline-token'` and `error: null`.
     - When configured: calls `supabase.auth.signInWithPassword({ email, password })`.
   - `signUpWithEmail(email, password, fullName)`:
     - When `!isSupabaseConfigured()`: returns mock user with metadata.
     - When configured: calls `supabase.auth.signUp`.
   - `resetPassword(emailOrToken, newPassword)`:
     - Overloaded: single parameter triggers `supabase.auth.resetPasswordForEmail`, two parameters triggers `supabase.auth.updateUser({ password: newPassword })`.
   - In-memory token storage (`inMemoryTokens` map, lines 254–298) holds email verification and password reset tokens in offline/development mode.
   - **Gap observed**: No OAuth helper function (`signInWithOAuth`) is currently exported in `auth.ts`.

3. **`web/src/lib/auth-context.tsx` (Lines 1–63)**:
   - Exports `AuthProvider` and `useAuth()`.
   - Fetches `/api/auth/me` on mount.
   - **Type discrepancy observed**: `interface User` defines `id: number`, whereas Supabase users use `id: string` (UUID or `'default_student_id'`).

4. **`web/src/middleware.ts` (Lines 1–121)**:
   - `protectedRoutes`: `['/dashboard', '/calendar', '/tasks', '/study', '/roadmaps', '/skills', '/clubs', '/living', '/notifications', '/profile', '/settings', '/onboarding', '/workspaces', '/coach']`.
   - `authRoutes`: `['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']`.
   - Verifies JWT cookie `session` or Supabase cookies (`sb-*-auth-token`, `sb-access-token`, `sb-mock-auth`).
   - In offline mode (`!isSupabaseConfigured()`), redirects authenticated users from `authRoutes` to `/dashboard`, allowing unauthenticated users to access auth routes freely.

---

### 1.3 Auth API Endpoints in `web/src/app/api/auth/`

1. **`POST /api/auth/login`**:
   - Accepts `{ email, password }`.
   - Calls `signInWithEmail(email, password)`.
   - Sets session cookie via `setSession(...)`.
   - Returns `{ user: { id, email, fullName, role }, needsOnboarding: false }`.
2. **`POST /api/auth/register`**:
   - Accepts `{ email, password, fullName }`.
   - Validates `email`, `password >= 6`, and basic email regex.
   - Calls `signUpWithEmail`, `ensureDefaultProfile`, `ensurePersonalWorkspace`, and `setSession`.
   - Returns HTTP 201 with `{ message, user }`.
3. **`POST /api/auth/forgot-password`**:
   - Accepts `{ email }`. Calls `resetPassword(email)`. Returns confirmation message.
4. **`POST /api/auth/reset-password`**:
   - Accepts `{ token, password }`. Validates token against `getPasswordResetToken(token)` and calls `resetPassword(token, password)`.
5. **`POST /api/auth/verify-email` & `GET /api/auth/verify-email?token=...`**:
   - Accepts `{ token }`. Validates via `verifyEmailToken(token)` and establishes session.
6. **`POST /api/auth/logout`**:
   - Calls `clearSession()` and returns `{ ok: true }`.

---

### 1.4 Test Suite Baseline

- Executed `npm test` in `web/`: **643 passed out of 643 tests across 63 suites** in 3.17s.
- Executed `npm run typecheck` in `web/`: **0 errors**.
- Existing test file `web/tests/supabase-auth-profile.test.ts` (227 lines) tests profile auto-initialization, offline mock session, signIn/signUp 0ms latency, middleware route protection, and health endpoint.
- File `web/tests/auth-redesign.test.ts` does **not yet exist** and must be created to satisfy acceptance criteria.

---

## 2. Logic Chain

### 2.1 Design Alignment: Cyber-Glass Visual System for Auth

From Section 2026-10-17T07:15:36Z in `ORIGINAL_REQUEST.md` and `web/tailwind.config.js`:
1. **Container Styling**:
   - Class tokens: `backdrop-blur-2xl bg-card/60 border border-white/10 shadow-[0_0_50px_rgba(61,232,255,0.15)] rounded-3xl`.
   - Subtitle & headers: Vietnamese typography (`Be Vietnam Pro` for text, `Space Grotesk` / `Unbounded` for headings).
2. **Input Fields**:
   - Class tokens: `bg-slate-900/60 border border-white/10 text-white placeholder:text-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(61,232,255,0.25)] transition-all`.
   - With password toggles: relative container with absolute right-aligned eye toggle button.
3. **Shake Micro-Interaction & Error Banner**:
   - Tailwind animation `animate-panic-shake` is already defined in `tailwind.config.js` (lines 150–154, 177).
   - Pattern already used in `pin-entry-modal.tsx`:
     ```tsx
     className={`... ${shake ? 'animate-panic-shake border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.4)]' : ''}`}
     ```
   - Red alert banner: `flex items-center gap-2 rounded-xl border border-rose-500/50 bg-rose-950/40 p-3 text-sm text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.2)]`.

---

### 2.2 Technical Logic for R2: Login Page (`(auth)/login/page.tsx`)

1. **1-Click Demo Quick Login**:
   - Credentials: `minh.nguyen@campus.edu.vn` / `Demo@123456`.
   - Flow:
     1. User clicks "⚡ Đăng nhập nhanh Demo 1-Click".
     2. Sets state `email = 'minh.nguyen@campus.edu.vn'`, `password = 'Demo@123456'`.
     3. Automatically submits to `/api/auth/login`.
     4. On success (`res.ok`), navigates directly to `/dashboard`.
   - Evaluator experience: 0 typing required, instant 1-click test flow.

2. **Supabase OAuth Buttons (Google & GitHub)**:
   - Dedicated OAuth handler:
     ```ts
     async function handleOAuth(provider: 'google' | 'github') {
       if (isSupabaseConfigured()) {
         await supabase.auth.signInWithOAuth({
           provider,
           options: { redirectTo: `${window.location.origin}/dashboard` }
         });
       } else {
         // Offline / mock fallback: log in as demo OAuth student
         await fetch('/api/auth/login', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ email: `${provider}.demo@campus.edu.vn`, password: 'Demo@123456' }),
         });
         router.push('/dashboard');
       }
     }
     ```
   - Includes authentic SVG icons for Google and GitHub.

3. **Remember Me Checkbox**:
   - Checkbox state persisted to `localStorage` (for email autofill) and sent to `/api/auth/login` (to optionally configure cookie duration).

---

### 2.3 Technical Logic for R3: Register Page (`(auth)/register/page.tsx`)

1. **Student Email Validation (`.edu.vn`)**:
   - Pure validation utility:
     ```ts
     export function isValidStudentEmail(email: string): boolean {
       if (!email || typeof email !== 'string') return false;
       return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu\.vn$/i.test(email.trim());
     }
     ```
   - UI Feedback: Real-time badge shows "Email sinh viên hợp lệ (.edu.vn)" with green check when valid, or warning "Yêu cầu email kết thúc bằng .edu.vn" when invalid.

2. **Real-time 4-Level Password Strength Meter**:
   - Evaluates 4 criteria:
     1. Length: `password.length >= 8`
     2. Uppercase: `/[A-Z]/.test(password)`
     3. Number: `/[0-9]/.test(password)`
     4. Special: `/[^A-Za-z0-9]/.test(password)`
   - Strength Tiers:
     - 0–1 criteria met: **Yếu (Weak)** — Color `#FF3D6E` (Rose/Red)
     - 2 criteria met: **Trung bình (Medium)** — Color `#FFB020` (Amber/Yellow)
     - 3 criteria met: **Tốt (Good)** — Color `#3DE8FF` (Cyan)
     - 4 criteria met: **Cực mạnh (Very Strong)** — Color `#C6FF3D` (Acid Lime / Neon Green)
   - Visual: 4-segment segmented progress bar with dynamic glow color, followed by 4 pill check badges showing the status of each requirement.

3. **Password Confirmation & Terms**:
   - Real-time indicator confirming passwords match.
   - Checkbox: "Tôi đồng ý với Điều khoản Dịch vụ & Quy chuẩn Học thuật CampusOS" (must be checked to enable submission).

---

### 2.4 Technical Logic for R4: Forgot Password, Reset Password, Verify Email

1. **`forgot-password/page.tsx` with 60s Resend Cooldown**:
   - Once submitted, transitions to "Kiểm tra hòm thư của bạn" screen.
   - Launches 60-second countdown timer (`setInterval`).
   - "Gửi lại liên kết" button displays `Gửi lại sau ${countdown}s` and is disabled while `countdown > 0`.
   - When `countdown === 0`, button is re-enabled.

2. **`reset-password/page.tsx` with Strength Meter & Confirmation**:
   - Extracts `token` from `useSearchParams()`.
   - Renders New Password input with real-time 4-level Password Strength Meter.
   - Renders Confirm New Password input with match validation.
   - Submits `{ token, password }` to `/api/auth/reset-password`.
   - On success, shows green confirmation card and redirects to `/login`.

3. **`verify-email/page.tsx` with Holographic Mail Icon**:
   - Renders central Glowing Holographic Mail Icon:
     - Outer animated pulse ring: `animate-pulse-neon` or gradient border with `shadow-[0_0_35px_rgba(61,232,255,0.4)]`.
     - Inner `Mail` icon with cyan-to-violet gradient lighting.
   - Allows manual 6-character verification code submission.
   - Provides "Gửi lại email xác thực" button with 60-second cooldown timer.
   - Displays clear success/error banners for URL query params `?status=success` and `?error=invalid_verification`.

---

### 2.5 Testing Architecture (`web/tests/auth-redesign.test.ts`)

A dedicated unit test suite should test:
1. `evaluatePasswordStrength`: All 4 tiers (weak, medium, good, very strong), edge cases (empty, long, unicode, only numbers, only symbols).
2. `isValidStudentEmail`: Valid `.edu.vn` universities (e.g. `minh.nguyen@campus.edu.vn`, `nam.tran@hust.edu.vn`, `linh.hoang@vnu.edu.vn`), invalid domains (`gmail.com`, `outlook.com`, `campus.edu`, malformed).
3. Demo login credentials validation: `minh.nguyen@campus.edu.vn` / `Demo@123456` verifies both email validation and 4/4 password strength criteria.
4. Resend cooldown timer math: 60s decrement step and expiration logic.
5. Offline Auth integrations: `signInWithEmail`, `signUpWithEmail`, `resetPassword`, `verifyEmailToken` under unconfigured Supabase environment.

---

## 3. Caveats

1. **`auth-3d-showcase.tsx` & `auth-feature-carousel.tsx` Ownership**:
   - Split-screen 50/50 layout in `(auth)/layout.tsx`, 3D showcase canvas, and feature carousel are part of R1 (assigned to `survey_explorer_1` or implementer). The page forms surveyed here (R2, R3, R4) will render directly inside `children` of that layout.
2. **Supabase Cloud vs Offline Mode**:
   - In offline/mock mode (`!isSupabaseConfigured()`), Supabase network calls are bypassed and mocked with 0ms delay. Live OAuth with Google and GitHub requires genuine Supabase client IDs configured in Supabase Cloud console. In development without cloud keys, OAuth clicks should fall back gracefully to a mock authenticated session rather than throwing uncaught browser errors.
3. **Legacy `User.id` Type in `auth-context.tsx`**:
   - In `web/src/lib/auth-context.tsx` (line 6), `interface User` has `id: number`. Changing it to `id: string | number` will prevent TypeScript errors when Supabase UUID strings are passed from `/api/auth/me`.

---

## 4. Conclusion

1. **All 5 Auth Pages Require Replacement**:
   - The current pages in `web/src/app/(auth)/` are minimal shadcn scaffolds and do not meet the Cyber-Glass design standards, Gen Z styling, or functional requirements specified in the authoritative request.
2. **Modular Architecture Recommendation**:
   - Create reusable auth components in `web/src/components/auth/`:
     - `auth-card.tsx`: Cyber-glass container with backdrop blur, neon borders, and optional shake animation.
     - `password-strength-meter.tsx`: 4-level real-time password meter with criteria checklist.
     - `auth-input.tsx`: Cyberpunk neon-focused input with show/hide password toggle.
     - `demo-login-button.tsx`: 1-Click quick login button for `minh.nguyen@campus.edu.vn`.
     - `social-auth-buttons.tsx`: Google & GitHub Supabase OAuth buttons with offline fallback.
     - `auth-utils.ts`: Pure functions for `evaluatePasswordStrength`, `isValidStudentEmail`, and cooldown helpers.
3. **Backend & Middleware are Fully Compatible**:
   - The existing endpoints `/api/auth/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` and `middleware.ts` already have the necessary handlers and offline resilience. Only minor client-side payload alignments are needed.
4. **Acceptance Criteria Feasibility**:
   - All R2, R3, and R4 requirements can be implemented with 0 regressions, maintaining 100% pass rate on `npm test` and 0 TypeScript errors on `npm run typecheck`.

---

## 5. Verification Method

To independently verify the survey findings and subsequent implementation:

1. **Unit Tests Verification**:
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm test
   ```
   *Expected*: Passes all 643+ existing tests across 39 test files plus the new `tests/auth-redesign.test.ts`.

2. **TypeScript Compilation Verification**:
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run typecheck
   ```
   *Expected*: Exits with code 0 and 0 errors.

3. **Production Build Verification**:
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run build
   ```
   *Expected*: Compiles all static and dynamic routes cleanly.

4. **Manual & Browser Functional Verification**:
   - Navigate to `/login`:
     - Confirm Cyber-glass card styling and neon glow.
     - Click "⚡ Đăng nhập nhanh Demo 1-Click": fields autofill with `minh.nguyen@campus.edu.vn` / `Demo@123456` and user is logged in to `/dashboard`.
     - Type wrong credentials: card shakes (`animate-panic-shake`) and displays neon red alert.
     - Toggle password visibility with eye icon.
   - Navigate to `/register`:
     - Type email without `.edu.vn`: warning appears.
     - Type password: 4-level meter updates in real-time (Weak → Medium → Good → Very Strong).
     - Check Terms checkbox: submit button enables.
   - Navigate to `/forgot-password`:
     - Submit email: 60-second countdown activates and button disables until timer completes.
   - Navigate to `/reset-password?token=mock-token`:
     - Enter new password: strength meter displays and confirmation check validates.
   - Navigate to `/verify-email`:
     - Holographic mail icon renders with cyan/violet ambient glow.
     - Resend button triggers 60-second cooldown timer.
