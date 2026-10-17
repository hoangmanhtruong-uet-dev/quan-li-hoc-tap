# Survey & Test Infrastructure Architecture Report: Auth Redesign Flow

**Agent**: `survey_explorer_3`  
**Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\survey_explorer_3`  
**Target Project**: CampusOS Next.js 14 App Router (`web/`)  
**Mission**: In-depth survey of test infrastructure, quality gates, and test requirements for the Auth Redesign (Split-Screen 50/50, Three.js 3D Hologram, Feature Carousel, Demo 1-Click Login, Real-Time Password Strength Meter, Email `.edu.vn` validation, 60s cooldown timer, and 5 Cyber-Glass auth pages).

---

## 1. Observation

### 1.1 Project Test Infrastructure & Configuration
From direct file inspection:
- **`web/package.json`**:
  - Script `"test"`: `"node --experimental-strip-types --test tests/*.test.ts"` (Line 11)
  - Script `"typecheck"`: `"tsc --noEmit"` (Line 10)
  - Script `"build"`: `"next build"` (Line 7)
  - Script `"lint"`: `"next lint"` (Line 9)
  - Key Dependencies:
    - `"next"`: `"14.2.5"`, `"react"`: `"18.3.1"`, `"react-dom"`: `"18.3.1"`
    - `"three"`: `"^0.186.1"`, `"@types/three"`: `"^0.186.0"`
    - `"@supabase/supabase-js"`: `"^2.117.3"`, `"bcryptjs"`: `"^3.0.3"`, `"jose"`: `"^6.2.3"`
    - `"lucide-react"`: `"^1.24.0"`, `"tailwind-merge"`: `"^3.6.0"`, `"tailwindcss-animate"`: `"^1.0.7"`
    - `"typescript"`: `"5.5.4"`

- **`web/tsconfig.json`**:
  - Target: `"ES2022"`, Module: `"esnext"`, ModuleResolution: `"bundler"`.
  - `"allowImportingTsExtensions": true` is explicitly enabled.
  - Path mapping: `"baseUrl": "./src"`, `"paths": { "@/*": ["*"] }`.
  - Included paths: `["src/**/*.ts", "src/**/*.tsx", "next-env.d.ts", ".next/types/**/*.ts"]`.
  - Note: `tests/` is not in the compilation bundle of `next build`, but test files use explicit `.ts` relative extensions when importing (e.g. `import ... from '../src/lib/auth.ts'`).

- **`web/next.config.mjs`**:
  - `reactStrictMode: true`, `experimental: { serverComponentsExternalPackages: ['msedge-tts', 'ws'] }`.

### 1.2 Current Test Suite Execution & Inventory
- Command executed: `npm test` in `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`
- Output summary:
  ```
  ℹ tests 643
  ℹ suites 63
  ℹ pass 643
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  ℹ duration_ms 3269.966
  ```
- **Total Test Files**: Exactly 39 test files in `web/tests/`.
- **Total Passing Tests**: Exactly 643 tests across 63 test suites, passing 100% with zero failures in ~3.27 seconds.
- **Test Taxonomy**:
  1. *Unit & Business Logic* (e.g., `academic-engine.test.ts`, `growth-engine.test.ts`, `quick-task-nlp-sync.test.ts`, `workspace-permissions.test.ts`): imports pure `.ts` modules and tests deterministic logic, calculations, date grouping, priority mapping.
  2. *Schema & Database Integration* (e.g., `supabase-auth-profile.test.ts`, `supabase-storage-buckets.test.ts`, `supabase-sync-engine.test.ts`, `pomodoro-party.test.ts`): tests RLS contracts, SQL migrations, profile auto-initialization defaults, mock sessions, and role matrices.
  3. *UI & 3D Lifecycle Contracts* (e.g., `study-rooms-m4-leaderboard.test.ts`, `study-rooms-ui.test.ts`, `tasks-redesign.test.ts`, `pomodoro-leo.test.ts`): uses `fs.readFileSync` to inspect component files (`.tsx`) for Three.js lifecycles (`renderer.dispose()`, `cancelAnimationFrame()`, geometry/material cleanup, pointer listeners, DPR clamping, `prefers-reduced-motion` fallbacks), component exports, and Cyber-Glass styling tokens.
  4. *Adversarial & Stress Tests* (e.g., `adversarial-challenger-m4.test.ts`, `challenger-final-adversarial.test.ts`): tests edge cases, malformed payloads, rapid succession actions, and memory leak defense.

### 1.3 Quality Gates Baseline
- **`npm run typecheck`**:
  - Command: `tsc --noEmit`
  - Output: Exit code 0, 0 TypeScript errors.
- **`npm run build`**:
  - Command: `next build`
  - Output: Exit code 0, 35 static/dynamic routes compiled cleanly (including all 5 existing static auth routes: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`).
- **`npm test`**:
  - Command: `node --experimental-strip-types --test tests/*.test.ts`
  - Output: Exit code 0, 643/643 tests passing.

### 1.4 Existing Auth Implementation Findings
- **`src/app/(auth)/layout.tsx`**: Currently a single-column container with blurred background blobs (`h-[32rem] w-[32rem] bg-blue-600/15`). Does not yet have Split-Screen 50/50, Three.js 3D canvas, or Feature Carousel.
- **`src/app/(auth)/login/page.tsx`**: Standard card form using `@/components/ui/card`. Does not have 1-Click Demo button, Cyber-Glass neon styling, password visibility toggle, or shake animation.
- **`src/app/(auth)/register/page.tsx`**: Basic form with Full name, Email, Password. Lacks Password Strength Meter, `.edu.vn` validation feedback, and academic agreement checkbox.
- **`src/app/(auth)/forgot-password/page.tsx`**: Basic email input. Lacks 60s cooldown timer and Cyber-Glass styling.
- **`src/app/(auth)/reset-password/page.tsx`**: Basic token check and password reset. Lacks password strength meter and Cyber-Glass styling.
- **`src/app/(auth)/verify-email/page.tsx`**: Basic token input. Lacks holographic mail visual, 60s cooldown resend button, and Cyber-Glass styling.
- **`src/lib/auth.ts`**: Contains `signInWithEmail`, `signUpWithEmail`, `signOut`, `resetPassword`, `getSession`, `setSession`, `getOfflineMockSession`, `hashPassword`, `verifyPassword`. Offline mock student returns `{ id: 'default_student_id', email: 'student@campusos.edu.vn', role: 'student' }`.
- **`src/app/api/auth/login/route.ts`**: Accepts `{ email, password }`, calls `signInWithEmail(email, password)`, sets session cookie, returns `{ user, needsOnboarding }`.
- **`src/app/api/auth/register/route.ts`**: Requires `{ email, password, fullName }`, validates `password.length >= 6` and general email regex.
- **Canonical Student Data**: Across `settings/page.tsx`, `profile/page.tsx`, and `mock.ts`, the canonical student email is `minh.nguyen@campus.edu.vn` (Nguyen Nhat Minh). The prompt specifies demo credentials as `minh.nguyen@campus.edu.vn` / `Demo@123456`.
- **`tailwind.config.js`**: Already contains the keyframes and animation utility `panic-shake`, `pulse-neon`, `fade-in`, `slide-up`, `float-badge`, and aurora color tokens (`obsidian #0A0A12`, `lime #C6FF3D`, `pink #FF3DA5`, `violet #7C5CFF`, `cyan #3DE8FF`, `orange #FF8A3D`).

---

## 2. Logic Chain

### 2.1 Test Execution Architecture Logic
1. **Observation**: `npm test` runs Node 22 native runner with `--experimental-strip-types` loading `tests/*.test.ts`. Node's type stripper parses TypeScript syntax on the fly without Jest/Vitest, but does **not** transpile JSX/TSX syntax.
2. **Inference**: If a test file attempts to `import ... from '../src/components/auth/auth-3d-showcase.tsx'`, Node will throw a syntax error (`Unexpected token '<'`) unless JSX is avoided or mocked.
3. **Established Project Convention**: In `study-rooms-m4-leaderboard.test.ts`, `study-rooms-ui.test.ts`, and `challenger-m1-tasks-reactivity.test.ts`, UI component verification is accomplished using `fs.readFileSync` to verify source contracts (exports, hooks, cleanup routines, JSX attributes, Three.js calls, Tailwind classes). Logic utilities (math, parsers, validators) are placed in `.ts` files (e.g. `src/lib/*.ts`) and imported directly.
4. **Actionable Rule for Auth Redesign**:
   - All deterministic auth logic (Password strength calculator, Email `.edu.vn` regex validator, 60s cooldown calculator, Demo student credentials constant) must be located in a pure TypeScript file: `web/src/lib/auth-validation.ts` (and/or exported via `src/lib/auth.ts`).
   - The test file `web/tests/auth-redesign.test.ts` will directly import these functions from `../src/lib/auth-validation.ts` for comprehensive unit tests.
   - For React components (`Auth3DShowcase`, `AuthFeatureCarousel`, `PasswordStrengthMeter`, `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `VerifyEmailPage`, `AuthLayout`), `auth-redesign.test.ts` will use `fs.readFileSync` to verify exports, component interfaces, Three.js lifecycle (`renderer.dispose()`, `cancelAnimationFrame`, `removeEventListener`), CSS classes (`backdrop-blur-2xl`, `panic-shake`), and accessibility attributes (`aria-label`, `role="button"`, etc.).

### 2.2 Password Strength Meter Logic Design
1. **Observation**: R3 requires a 4-tier real-time Password Strength Meter:
   - Tier 1: Yếu (Weak - Red `#EF4444`)
   - Tier 2: Trung bình (Medium - Amber/Yellow `#F59E0B`)
   - Tier 3: Tốt (Good - Cyan/Emerald `#06B6D4` / `#10B981`)
   - Tier 4: Cực mạnh (Strong - Neon Green `#22C55E` / `#C6FF3D`)
   - Criteria: $\ge 8$ characters, uppercase (`[A-Z]`), lowercase (`[a-z]`), digit (`[0-9]`), special character (`[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]`).
2. **Logic Specification**:
   - Scoring algorithm:
     - Base score = count of satisfied criteria (0 to 5: min length, uppercase, lowercase, number, special).
     - Tier mapping:
       - Score 0–1 or length < 6: `'weak'` (Score percentage: 25%, color: `'#EF4444'`, label: `'Yếu'`)
       - Score 2–3 (or length 6-7 with multiple criteria): `'medium'` (Score percentage: 50%, color: `'#F59E0B'`, label: `'Trung bình'`)
       - Score 4 (length $\ge 8$ and 3 additional criteria): `'good'` (Score percentage: 75%, color: `'#06B6D4'`, label: `'Tốt'`)
       - Score 5 (all 5 criteria met, length $\ge 8$): `'strong'` (Score percentage: 100%, color: `'#22C55E'`, label: `'Cực mạnh'`)
   - Type signature:
     ```ts
     export type PasswordStrengthTier = 'weak' | 'medium' | 'good' | 'strong';

     export interface PasswordStrengthResult {
       score: number; // 0 to 5
       percent: number; // 0, 25, 50, 75, 100
       tier: PasswordStrengthTier;
       label: string; // 'Yếu' | 'Trung bình' | 'Tốt' | 'Cực mạnh'
       color: string; // Hex color token
       criteria: {
         minLength: boolean; // >= 8 chars
         hasUppercase: boolean; // [A-Z]
         hasLowercase: boolean; // [a-z]
         hasNumber: boolean; // [0-9]
         hasSpecial: boolean; // [^A-Za-z0-9]
       };
     }
     export function calculatePasswordStrength(password: string): PasswordStrengthResult;
     ```

### 2.3 Demo 1-Click Login Logic Design
1. **Observation**: R2 requires a 1-Click Demo Login button that fills and logs in with `minh.nguyen@campus.edu.vn` / `Demo@123456`.
2. **Logic Specification**:
   - Constant export:
     ```ts
     export const DEMO_STUDENT_CREDENTIALS = {
       email: 'minh.nguyen@campus.edu.vn',
       password: 'Demo@123456',
       fullName: 'Nguyễn Nhật Minh',
     } as const;
     ```
   - Validation verification:
     - `isValidEduVnEmail(DEMO_STUDENT_CREDENTIALS.email)` must return `true`.
     - `calculatePasswordStrength(DEMO_STUDENT_CREDENTIALS.password).tier` must return `'strong'` (length 11, upper 'D', lower 'emo', special '@', numbers '123456').
     - Calling `signInWithEmail(DEMO_STUDENT_CREDENTIALS.email, DEMO_STUDENT_CREDENTIALS.password)` must resolve successfully with offline mock session or Supabase session.

### 2.4 Email `.edu.vn` Validation Rules Design
1. **Observation**: Registration requires Vietnamese educational institution email (`.edu.vn`).
2. **Logic Specification**:
   - Strict regex rule:
     ```ts
     export const EDU_VN_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.edu\.vn$/i;
     export function isValidEduVnEmail(email: string): boolean;
     ```
   - Must accept:
     - `minh.nguyen@campus.edu.vn`
     - `sinhvien@hust.edu.vn`
     - `20020123@vnu.edu.vn`
     - `student.cntt@uit.edu.vn`
     - Mixed case: `NguyenVanA@HCMUT.EDU.VN`
     - Padded strings: `"  sv@bku.edu.vn  "` (with trim)
   - Must reject:
     - `student@gmail.com`
     - `user@yahoo.vn`
     - `attacker@campus.edu` (missing `.vn`)
     - `user@campus.vn` (missing `.edu`)
     - `user@edu.vn.evil.com` (spoofed domain)
     - Empty, null, undefined, malformed strings.

### 2.5 60s Cooldown Timer Logic Design
1. **Observation**: Forgot Password and Verify Email require a 60-second cooldown timer on resend actions to prevent spamming and rate-limit abuse.
2. **Logic Specification**:
   - Pure function calculating cooldown state based on timestamp differences (avoiding timer flakiness in unit tests):
     ```ts
     export interface CooldownState {
       remainingSeconds: number; // 0 to cooldownDuration
       canResend: boolean; // true if remainingSeconds === 0
       formattedLabel: string; // e.g. "Gửi lại mã sau (45s)" or "Gửi lại mã"
     }
     export function calculateCooldownState(
       lastSentTimestamp: number | null | undefined,
       cooldownDurationSeconds: number = 60,
       currentTimestamp: number = Date.now()
     ): CooldownState;
     ```
   - Rules:
     - `lastSentTimestamp === 0` or `null` $\to$ `remainingSeconds = 0`, `canResend = true`, `formattedLabel = "Gửi lại mã"`.
     - `current - lastSent < cooldownDuration * 1000` $\to$ `remainingSeconds = Math.ceil((cooldown - elapsed) / 1000)`, `canResend = false`, `formattedLabel = "Gửi lại mã sau (${remainingSeconds}s)"`.
     - Clock skew protection: if `lastSent > current` (system clock adjusted backwards), clamp to `cooldownDurationSeconds` or reset safely without negative or NaN values.

### 2.6 Three.js 3D Showcase & Layout Contracts
1. **Observation**: R1 requires `Auth3DShowcase` (`web/src/components/auth/auth-3d-showcase.tsx`) with Three.js canvas, rotating knowledge sphere/crystal, dual neon spotlights (Cyan `#38bdf8` and Violet `#a855f7`), pointer reactive movement, and leak-free unmount lifecycle.
2. **Logic Specification**:
   - `auth-redesign.test.ts` will verify:
     - Vanilla Three.js import (`import * as THREE from 'three'`).
     - WebGLRenderer initialization with `alpha: true`, `antialias: true`.
     - Scene geometry (e.g. `SphereGeometry`, `IcosahedronGeometry`, `BufferGeometry`).
     - Spotlight / PointLight with Cyan (`0x38bdf8` / `#38bdf8`) and Violet (`0xa855f7` / `#a855f7`).
     - Pointer interaction listeners (`pointermove` or `mousemove`).
     - DPR clamping: `Math.min(window.devicePixelRatio, 1.5)` or `<= 2`.
     - Strict unmount disposal:
       - `cancelAnimationFrame(animationFrameId)`
       - `renderer.dispose()`
       - `geometry.dispose()`
       - `material.dispose()`
       - `removeEventListener`
       - Canvas element removal.
     - Reduced motion support: checks `prefers-reduced-motion` media query and provides fallback.

### 2.7 Feature Carousel & 5 Auth Pages Contracts
1. **Observation**: Carousel R1 and 5 Auth Pages R2–R4 specify exact features, micro-interactions, and visual tokens.
2. **Logic Specification**:
   - `AuthFeatureCarousel` (`web/src/components/auth/auth-feature-carousel.tsx`):
     - Renders the "Bộ Ba Siêu Năng" (Superpower Trio):
       1. Mèo Cam Giám Sát Cực Đoan (URL Blacklist & AI Webcam Face Tracking)
       2. AI Study Hub 1M Tokens & Flashcard 3D SM-2
       3. Đấu Trường Pomodoro Party & Bục Vinh Danh 3D
     - Renders student statistics ("12,450+ giờ học hôm nay").
     - Auto-advance carousel timer with `clearInterval` cleanup on unmount.
   - `(auth)/layout.tsx`:
     - Split-Screen 50/50 container (`lg:grid lg:grid-cols-2` or `lg:flex lg:w-1/2`, `h-screen` / `min-h-screen`).
     - Single column responsive fallback on `< 1024px`.
     - Mounts `Auth3DShowcase` and `AuthFeatureCarousel` in desktop showcase pane.
     - Renders children in form pane.
   - 5 Auth Pages:
     - `LoginPage`: default export, 1-Click Demo button (`minh.nguyen@campus.edu.vn`), social buttons (Google, GitHub), password visibility toggle (Eye/EyeOff), remember me checkbox, shake animation trigger (`panic-shake`), links to `/forgot-password` and `/register`.
     - `RegisterPage`: default export, full name, `.edu.vn` email input, password, confirm password, `PasswordStrengthMeter`, academic honor code checkbox, link to `/login`.
     - `ForgotPasswordPage`: default export, `.edu.vn` email, 60s cooldown timer, link to `/login`.
     - `ResetPasswordPage`: default export, token handling, new password, confirm password, `PasswordStrengthMeter`, link to `/login`.
     - `VerifyEmailPage`: default export, holographic mail icon, verification code input, 60s cooldown resend, link to `/login`.
     - All cards apply Cyber-Glass tokens: `backdrop-blur-2xl`, `bg-card/60` or `bg-card/40`, `border-white/10`.

---

## 3. Detailed Test Design for `web/tests/auth-redesign.test.ts`

The new test suite `web/tests/auth-redesign.test.ts` should contain **6 comprehensive test suites** (with 35–45 individual tests) structured as follows:

```ts
/**
 * CampusOS Auth Flow Redesign Comprehensive Test Suite
 *
 * Requirements Source:
 *   - ORIGINAL_REQUEST.md (## 2026-10-17T07:15:36Z: R1, R2, R3, R4)
 *   - Quality Gates: npm test 100% pass, npm run typecheck 0 errors, npm run build clean
 *
 * Suite Overview:
 *   1. Suite 1: Password Strength Meter & Real-Time Calculation Logic (4 Tiers, Criteria, Scoring)
 *   2. Suite 2: Demo 1-Click Login Credentials & Auth Route Verification
 *   3. Suite 3: Student Email (.edu.vn) Strict Validation Rules & Edge Cases
 *   4. Suite 4: 60-Second Cooldown Timer & Anti-Spam Resend Logic
 *   5. Suite 5: Split-Screen Layout, 3D Hologram Showcase & Three.js Lifecycle Contracts
 *   6. Suite 6: Feature Carousel & 5 Cyber-Glass Auth Pages Structural Contracts
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Import pure logic from src/lib/auth-validation.ts and src/lib/auth.ts
import {
  calculatePasswordStrength,
  isValidEduVnEmail,
  calculateCooldownState,
  DEMO_STUDENT_CREDENTIALS,
  type PasswordStrengthResult,
} from '../src/lib/auth-validation.ts';

import {
  signInWithEmail,
  getOfflineMockSession,
} from '../src/lib/auth.ts';
```

### 3.1 Suite 1: Password Strength Calculation Logic (8 Tests)
- `1.1 Empty or whitespace password returns score 0, tier 'weak', percent 0, and all criteria false`
- `1.2 Short passwords (< 6 chars) are classified as 'weak' even if diverse`
- `1.3 Passwords meeting 2 criteria (e.g. lowercase + numbers) map to tier 'medium' with 50% score`
- `1.4 Passwords meeting 3-4 criteria with length >= 8 map to tier 'good' with 75% score`
- `1.5 Passwords meeting all 5 criteria with length >= 8 map to tier 'strong' with 100% score (e.g. 'Demo@123456')`
- `1.6 Edge cases: Unicode characters ('HọcTập@2026!'), extreme length (100+ chars), space-separated phrases`
- `1.7 Color and label mapping contracts match specification (weak: #EF4444 'Yếu', medium: #F59E0B 'Trung bình', good: #06B6D4 'Tốt', strong: #22C55E 'Cực mạnh')`
- `1.8 Criteria breakdown flags (minLength, hasUppercase, hasLowercase, hasNumber, hasSpecial) return exact booleans`

### 3.2 Suite 2: Demo 1-Click Login Credentials & Authentication (6 Tests)
- `2.1 DEMO_STUDENT_CREDENTIALS matches authoritative spec: minh.nguyen@campus.edu.vn / Demo@123456`
- `2.2 Demo email satisfies .edu.vn validation`
- `2.3 Demo password satisfies tier 'strong' (score 5/5, length 11)`
- `2.4 signInWithEmail with demo credentials resolves successfully without error in offline/mock mode`
- `2.5 Offline mock session returns valid student role and matching email`
- `2.6 LoginPage source contract contains Demo 1-Click button with ⚡ icon, pre-fill handler, and direct submit`

### 3.3 Suite 3: Student Email (`.edu.vn`) Validation Rules (8 Tests)
- `3.1 Validates standard university emails (.edu.vn): minh.nguyen@campus.edu.vn, student@hust.edu.vn, 20020123@vnu.edu.vn, cntt@uit.edu.vn`
- `3.2 Case-insensitivity: converts MINH.NGUYEN@CAMPUS.EDU.VN to valid`
- `3.3 Leading/trailing whitespace handling: trims and validates '  sv@bku.edu.vn  '`
- `3.4 Rejects commercial and non-edu domains: student@gmail.com, student@yahoo.vn, student@outlook.com`
- `3.5 Rejects missing .vn or missing .edu: student@campus.edu, student@campus.vn`
- `3.6 Rejects domain spoofing attacks: admin@campus.edu.vn.attacker.com, user@evil-edu.vn`
- `3.7 Rejects malformed email syntax: @hust.edu.vn, student@, student@.edu.vn, student@@hust.edu.vn`
- `3.8 Boundary inputs: handles empty string, null, undefined, extreme length safely returning false`

### 3.4 Suite 4: 60-Second Cooldown Timer & Resend Logic (6 Tests)
- `4.1 Initial state (lastSent = null or 0): remaining = 0s, canResend = true, label = 'Gửi lại mã'`
- `4.2 Immediate post-send (elapsed 0s): remaining = 60s, canResend = false, label contains '60s'`
- `4.3 Mid-cooldown (elapsed 25s): remaining = 35s, canResend = false, label contains '35s'`
- `4.4 Boundary expiration (elapsed 59s): remaining = 1s, canResend = false; elapsed 60s: remaining = 0s, canResend = true`
- `4.5 Post-cooldown (elapsed > 60s): remaining = 0s, canResend = true`
- `4.6 Clock skew resilience: future lastSent timestamp clamped gracefully without NaN or negative values`

### 3.5 Suite 5: Split-Screen Layout & Three.js 3D Lifecycle Contracts (6 Tests)
- `5.1 (auth)/layout.tsx file exists and implements 50/50 split-screen on desktop (lg:grid-cols-2 or lg:w-1/2) and 100vh viewport`
- `5.2 layout.tsx mounts Auth3DShowcase and AuthFeatureCarousel on desktop side, children on form side`
- `5.3 auth-3d-showcase.tsx imports vanilla Three.js and constructs knowledge sphere/crystal hologram geometry`
- `5.4 auth-3d-showcase.tsx configures dual neon spotlights (Cyan 0x38bdf8 and Violet 0xa855f7)`
- `5.5 auth-3d-showcase.tsx implements pointermove/mousemove reactive rotation/tilt with event listener removal on unmount`
- `5.6 auth-3d-showcase.tsx implements strict memory cleanup: cancelAnimationFrame, renderer.dispose(), geometry.dispose(), material.dispose(), and DPR <= 1.5`
- `5.7 auth-3d-showcase.tsx respects prefers-reduced-motion media query and WebGL capability fallback`

### 3.6 Suite 6: Feature Carousel & 5 Cyber-Glass Auth Pages Contracts (8 Tests)
- `6.1 auth-feature-carousel.tsx showcases 'Bộ Ba Siêu Năng': Mèo Cam Giám Sát, AI Study Hub 1M Tokens, Pomodoro Party 3D`
- `6.2 auth-feature-carousel.tsx includes student statistics ('12,450+ giờ học') and auto-play timer with clearInterval cleanup`
- `6.3 LoginPage contract: Cyber-Glass container, Demo 1-Click button, Google/GitHub social login, password toggle Eye/EyeOff, Remember Me checkbox, panic-shake animation`
- `6.4 RegisterPage contract: Full name, .edu.vn email, password, confirm password, PasswordStrengthMeter, academic terms checkbox`
- `6.5 ForgotPasswordPage contract: .edu.vn email, 60s cooldown resend button, link to /login`
- `6.6 ResetPasswordPage contract: token parameter handling, new password, confirm password, PasswordStrengthMeter`
- `6.7 VerifyEmailPage contract: holographic mail icon, verification code input, 60s cooldown resend button`
- `6.8 All 5 auth pages enforce Cyber-Glass tokens: backdrop-blur-2xl, bg-card/60, border-white/10, neon focus rings`

---

## 4. Quality Gates Verification Plan

To guarantee zero regression and 100% compliance with CampusOS standards, the following 4-step Quality Gate pipeline must be executed in order:

```
+-------------------------------------------------------------------------------+
|                        AUTH REDESIGN QUALITY GATES                            |
+-------------------------------------------------------------------------------+
|  Gate 1: Node Native Test Suite                                               |
|  Command: npm test                                                            |
|  Target: 680+ tests passing 100% (643 existing + ~40 new auth tests), 0 fails |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|  Gate 2: TypeScript Strict Compilation                                        |
|  Command: npm run typecheck                                                   |
|  Target: 0 TypeScript errors across web/src and web/tests                     |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|  Gate 3: Next.js Production Build                                             |
|  Command: npm run build                                                       |
|  Target: Exit code 0, all 35+ routes static & dynamic compiled cleanly        |
|  Special check: 5 static auth routes (/login, /register, etc.) compile 0 err  |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|  Gate 4: Pre-Completion Verification & Clean State                             |
|  Verification: git status clean, no untracked temp files, 100% verified claims|
+-------------------------------------------------------------------------------+
```

### Detailed Verification Steps

| Gate | Command | Working Directory | Success Criteria | Failure Triage Playbook |
|---|---|---|---|---|
| **Gate 1: Unit Tests** | `npm test` | `web/` | 100% Pass (0 fails, 0 skipped, $\ge 680$ tests). Execution time $< 6$s. | 1. If import error: check relative path and explicit `.ts` extension.<br>2. If JSX error: ensure `.tsx` components are not directly evaluated in Node test runner; use `fs.readFileSync` for component contract tests. |
| **Gate 2: Typecheck** | `npm run typecheck` | `web/` | `tsc --noEmit` exits with 0 errors. | 1. Check strict null checks (`strict: true`, `noUncheckedIndexedAccess: true`).<br>2. Check prop types for new components in `src/components/auth/`. |
| **Gate 3: Build** | `npm run build` | `web/` | `next build` exits with code 0. 35/35 routes prerendered. | 1. Check for unescaped characters in JSX (e.g. `'` must be `&apos;` or `{"'"}`).<br>2. Check for `'use client'` directive at top of interactive components.<br>3. Check dynamic imports for Three.js (`ssr: false` if needed). |
| **Gate 4: Visual & Responsive** | Browser inspection / static checks | `web/` | Split-Screen 50/50 on $\ge 1024$px, single column on $< 1024$px, zero horizontal overflow (`overflow-x-hidden`). | 1. Check Tailwind responsive prefixes (`lg:grid-cols-2`, `w-full`).<br>2. Check Three.js canvas container bounds. |

---

## 5. Caveats
- **Node Test Runner JSX Limitation**: Node's `--experimental-strip-types` cannot evaluate JSX/TSX syntax. Therefore, pure logic must remain in `.ts` files, and component verification must use file contract / AST testing via `fs.readFileSync`.
- **Three.js in Server Components**: Three.js relies on browser globals (`window`, `HTMLCanvasElement`, `WebGLRenderingContext`). Components rendering Three.js canvases must use `'use client'` and be safely mounted via dynamic import or inside `useEffect` to prevent SSR hydration crashes during `next build`.
- **Existing Auth Test Invariant**: Existing tests in `web/tests/supabase-auth-profile.test.ts` (12 tests) test `authRoutes` array matching `['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']` and `isSupabaseConfigured()`. Any updates to routes or middleware must preserve these exact route paths.
- **No Source Code Changes**: As an explorer agent, this investigation is strictly read-only. No files outside `.agents/teamwork/survey_explorer_3/` were modified.

---

## 6. Conclusion
1. **Infrastructure Readiness**: The testing infrastructure in `web/` is robust, lightweight, and blazingly fast (~3.27s for 643 tests across 39 files). It is fully prepared to absorb the Auth Redesign test suite without introducing any new runner dependencies or build overhead.
2. **Modular Architecture Recommendation**:
   - Create `web/src/lib/auth-validation.ts` exporting:
     - `calculatePasswordStrength(password: string): PasswordStrengthResult`
     - `isValidEduVnEmail(email: string): boolean`
     - `calculateCooldownState(lastSent: number | null, duration?: number, now?: number): CooldownState`
     - `DEMO_STUDENT_CREDENTIALS` (`minh.nguyen@campus.edu.vn` / `Demo@123456`)
   - Create `web/src/components/auth/`:
     - `auth-3d-showcase.tsx` (Three.js Hologram Knowledge Sphere)
     - `auth-feature-carousel.tsx` ("Bộ Ba Siêu Năng" Feature Carousel)
     - `password-strength-meter.tsx` (Real-Time 4-Tier Neon Gauge)
   - Rebuild `web/src/app/(auth)/`:
     - `layout.tsx` (Split-Screen 50/50 container)
     - `login/page.tsx` (Demo 1-Click button, shake animation, cyberpunk inputs)
     - `register/page.tsx` (.edu.vn email, password strength meter, terms checkbox)
     - `forgot-password/page.tsx` (60s cooldown resend)
     - `reset-password/page.tsx` (token verification, password meter)
     - `verify-email/page.tsx` (holographic mail visual, 60s cooldown resend)
   - Create `web/tests/auth-redesign.test.ts` with 6 test suites (~35–45 tests) testing the exact contracts defined above.
3. **Execution Confidence**: With this architectural separation, all Quality Gates (`npm test` 100% pass, `npm run typecheck` 0 errors, `npm run build` 100% clean) will pass reliably.

---

## 7. Verification Method
To independently verify this report:
1. Verify test runner and current test count:
   ```bash
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm test
   ```
   *Expected output*: `ℹ tests 643`, `ℹ pass 643`, `ℹ fail 0`, `duration_ms ~3300`.
2. Verify TypeScript type safety:
   ```bash
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run typecheck
   ```
   *Expected output*: Exit code 0, 0 errors.
3. Verify Next.js production build:
   ```bash
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run build
   ```
   *Expected output*: Exit code 0, 35/35 routes generated.
4. Verify file locations and exports referenced in this report:
   - Check `package.json` line 11 for test runner script.
   - Check `src/app/(auth)/` for the 5 existing auth routes.
   - Check `src/lib/auth.ts` for existing Supabase auth methods.
