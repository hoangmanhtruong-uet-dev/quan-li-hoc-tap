## 2026-10-17T07:33:45Z
You are worker_m3_m4.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m3_m4
Project Root: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap
Authoritative user request file: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md
Scope document: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
Validation utilities: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\src\lib\auth-validation.ts
Login reference: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\src\app\(auth)\login\page.tsx

You MUST read ORIGINAL_REQUEST.md and PROJECT.md before starting work.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP (You may only create/modify these 5 files):
- web/src/components/auth/password-strength-meter.tsx
- web/src/app/(auth)/register/page.tsx
- web/src/app/(auth)/forgot-password/page.tsx
- web/src/app/(auth)/reset-password/page.tsx
- web/src/app/(auth)/verify-email/page.tsx

TASKS FOR MILESTONES M3 & M4:
1. Create web/src/components/auth/password-strength-meter.tsx:
   - Evaluates password strength using `calculatePasswordStrength(password)` from `@/lib/auth-validation`.
   - Renders 4-tier segmented progress bar with dynamic glow color:
     * Weak: Red (#EF4444)
     * Medium: Amber (#F59E0B)
     * Good: Cyan (#06B6D4)
     * Strong: Neon Green (#22C55E)
   - Displays label ('Yếu', 'Trung bình', 'Tốt', 'Cực mạnh') and percent.
   - Displays 4 criteria badges (>=8 chars, uppercase, number, special char) with live check/cross icons.
2. Rebuild web/src/app/(auth)/register/page.tsx:
   - Cyber-Glass container (`backdrop-blur-2xl bg-card/60 border border-white/10 shadow-[0_0_50px_rgba(61,232,255,0.15)] rounded-3xl p-6 sm:p-8`).
   - Fields: Full name, .edu.vn student email with real-time `isValidEduVnEmail(email)` badge, password, confirm password.
   - Embeds `<PasswordStrengthMeter password={password} />`.
   - Real-time password confirmation match indicator.
   - Checkbox: "Tôi đồng ý với Điều khoản Dịch vụ & Quy chuẩn Học thuật CampusOS" (required to submit).
   - Password eye toggles, panic-shake on error with neon red alert banner.
   - Submits to `/api/auth/register`, sets session, navigates to `/dashboard`.
3. Rebuild web/src/app/(auth)/forgot-password/page.tsx:
   - Cyber-Glass styling.
   - Email input, submit sends request to `/api/auth/forgot-password`.
   - Interactive 60-second cooldown timer for resend action with live countdown.
4. Rebuild web/src/app/(auth)/reset-password/page.tsx:
   - Cyber-Glass styling.
   - Wrapped in `<Suspense>`.
   - Extracts token from `useSearchParams()`.
   - New password and confirm password inputs, embeds `<PasswordStrengthMeter>`.
   - Submits to `/api/auth/reset-password`.
5. Rebuild web/src/app/(auth)/verify-email/page.tsx:
   - Cyber-Glass styling.
   - Wrapped in `<Suspense>`.
   - Central Glowing Holographic Mail Icon (cyan/violet glow, `shadow-[0_0_35px_rgba(61,232,255,0.4)]`).
   - 6-character code input and resend button with 60-second cooldown timer.
6. Verify quality gates:
   - Run `npm run typecheck` in web/ (must be 0 errors).
   - Run `npm test` in web/ (must pass 100%).
   - Run `npm run build` in web/ (must compile 35/35 routes cleanly).
7. Write your complete handoff report to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m3_m4\handoff.md and message orchestrator_17 when finished.
