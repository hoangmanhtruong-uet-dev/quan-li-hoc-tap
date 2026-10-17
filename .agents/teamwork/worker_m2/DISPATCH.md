## 2026-10-17T07:26:31Z
You are worker_m2.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m2
Project Root: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap
Authoritative user request file: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md
Scope document: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
Survey blueprint: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\survey_explorer_2\handoff.md and survey_explorer_3\handoff.md

You MUST read ORIGINAL_REQUEST.md, PROJECT.md, and survey_explorer_2's handoff.md before starting work.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP (You may only create/modify these 2 files):
- web/src/lib/auth-validation.ts
- web/src/app/(auth)/login/page.tsx

TASKS FOR MILESTONE M2:
1. Create web/src/lib/auth-validation.ts:
   - `calculatePasswordStrength(password: string): PasswordStrengthResult`:
     * Returns score (0-5), percent (0, 25, 50, 75, 100), tier ('weak' | 'medium' | 'good' | 'strong'), label ('Yếu' | 'Trung bình' | 'Tốt' | 'Cực mạnh'), color token, and criteria breakdown flags (minLength >= 8, hasUppercase, hasLowercase, hasNumber, hasSpecial).
   - `isValidEduVnEmail(email: string): boolean`:
     * Strict regex validating `.edu.vn` student emails (case-insensitive, trims whitespace, rejects non-edu domains like gmail.com or spoofed domains like user@edu.vn.evil.com).
   - `calculateCooldownState(lastSentTimestamp, cooldownDurationSeconds = 60, currentTimestamp = Date.now()): CooldownState`:
     * Anti-spam 60s cooldown calculation returning remainingSeconds, canResend boolean, formattedLabel.
   - `DEMO_STUDENT_CREDENTIALS`:
     * `{ email: 'minh.nguyen@campus.edu.vn', password: 'Demo@123456', fullName: 'Nguyễn Nhật Minh' }`.
2. Rebuild web/src/app/(auth)/login/page.tsx:
   - Cyber-Glass container: `backdrop-blur-2xl bg-card/60 border border-white/10 shadow-[0_0_50px_rgba(61,232,255,0.15)] rounded-3xl p-6 sm:p-8`.
   - "⚡ Đăng nhập nhanh Demo 1-Click" button:
     * Prominent high-energy neon button. When clicked, autofills `minh.nguyen@campus.edu.vn` and `Demo@123456` and immediately logs in to `/dashboard`.
   - Supabase Social OAuth buttons (Google & GitHub) with SVG icons and graceful offline fallback.
   - Cyberpunk inputs: `focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(61,232,255,0.25)] transition-all`.
   - Show/Hide password toggle button with Eye / EyeOff icons.
   - Remember Me ("Ghi nhớ đăng nhập") checkbox with local state.
   - Micro-interaction: Error state triggers `animate-panic-shake` on the card and displays a neon red alert banner.
   - Navigation links to `/forgot-password` and `/register`.
3. Run `npm run typecheck` and `npm test` in web/ to verify 0 errors and 0 regressions.
4. Write your complete handoff report to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m2\handoff.md and message orchestrator_17 when finished.
