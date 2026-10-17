## 2026-10-17T07:18:14Z
You are survey_explorer_2.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\survey_explorer_2
Authoritative user request file: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md

You MUST read d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md before starting work (focus on the section 2026-10-17T07:15:36Z).
Your task is to conduct an in-depth survey of all Auth pages, state management, Supabase Auth integrations, and form logic:
1. Inspect all current auth pages in web/src/app/(auth)/: login, register, forgot-password, reset-password, verify-email.
2. Inspect Supabase authentication utilities, auth hooks, stores, and middleware in web/src/ (e.g., supabase client, auth store, campus-store, session management).
3. Investigate detailed technical requirements for:
   - R2: Login page (web/src/app/(auth)/login/page.tsx): Cyber-glass styling, 1-Click Demo Quick Login button (autofill & login with minh.nguyen@campus.edu.vn / Demo@123456), Supabase Google & GitHub OAuth buttons, Cyberpunk neon-focused inputs, show/hide password toggle, Remember Me checkbox, shake animation on error with neon red alert.
   - R3: Register page (web/src/app/(auth)/register/page.tsx): Full name, .edu.vn student email validation, password & confirmation, real-time 4-level Password Strength Meter (Weak, Medium, Good, Very Strong) checking length, uppercase, numbers, special characters, Terms & Academic Code of Conduct checkbox.
   - R4: Forgot Password (web/src/app/(auth)/forgot-password/page.tsx) with 60-second resend cooldown timer; Reset Password (web/src/app/(auth)/reset-password/page.tsx) with password confirmation & strength meter; Verify Email (web/src/app/(auth)/verify-email/page.tsx) with glowing holographic mail icon and resend button.
4. Document the exact state flows, API endpoints/methods, error handling, and mock/offline fallbacks if Supabase cloud is not configured.
Write your complete report to: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\survey_explorer_2\handoff.md
Update your progress.md periodically.
When done, notify orchestrator_17 via send_message.
