# Project: CampusOS Auth Flow Rebuild (Split-Screen 50/50, 3D Hologram Stage & Cyber-Glass Experience)

## Architecture
- **Layout Architecture (`web/src/app/(auth)/layout.tsx`)**:
  - Desktop ($\ge 1024$px): Symmetrical 50/50 Split-Screen layout bounded to `lg:h-screen lg:overflow-hidden` preventing outer double scrollbars. Left pane (3D stage + carousel) fixed; right pane (auth form) with internal smooth scrolling (`overflow-y-auto scrollbar-thin`).
  - Mobile & Tablet ($< 1024$px): Auto-collapses to a single fluid center column with lightweight GPU CSS Fluid Ambient Aurora blobs (`#0A0A12` obsidian backdrop), hiding heavy 3D canvas for 120FPS battery/GPU efficiency.
- **Three.js 3D Hologram Stage (`web/src/components/auth/auth-3d-showcase.tsx`)**:
  - Vanilla Three.js (`three@0.186.1`) knowledge sphere/crystal hologram.
  - Geometry: Central faceted Icosahedron core (`IcosahedronGeometry(1.22, 1)` with `flatShading`), outer wireframe cage (`IcosahedronGeometry(1.48, 1)` with Cyan `#38bdf8`), 3 gyroscopic Torus orbital rings (Cyan `#38bdf8`, Violet `#a855f7`, Lime `#c6ff3d`), and 140 quantum stardust point nodes.
  - Studio Lighting: Dual Spotlights in Cyan (`0x38bdf8`) & Violet (`0xa855f7`) with dynamic targets, and ambient base fill.
  - Interaction: Pointer-reactive parallax lerp damping with subtle hover tilt and sine-wave levitation.
  - Memory Safety: 100% strict cleanup array (`geometriesToDispose`, `materialsToDispose`, `renderer.dispose()`, `cancelAnimationFrame`), DPR clamped to $\le 1.5$, `visibilitychange` throttling, and `prefers-reduced-motion` static fallback.
- **Dynamic Feature Carousel (`web/src/components/auth/auth-feature-carousel.tsx`)**:
  - Auto-sliding showcase (5s cycle with hover-pause and manual navigation) highlighting the "Bộ Ba Siêu Năng" (Superpower Trio):
    1. 🐱 *Mèo Cam Giám Sát Cực Đoan* (URL Tab Blacklist & AI Webcam Face Tracking)
    2. 🎴 *AI Study Hub 1M Tokens & Flashcard 3D SM-2* (Phân tích slide PDF bài giảng)
    3. 🏆 *Đấu Trường Pomodoro Party & Bục Vinh Danh 3D* (Học nhóm thời gian thực)
  - Real-time student statistics: "🔥 12,450+ giờ học hôm nay", "👥 4,800+ sinh viên online", "⚡ 99.2% qua môn".
  - Daily inspiring study quotes for Gen Z students.
- **Core Validation & Logic Engine (`web/src/lib/auth-validation.ts`)**:
  - `calculatePasswordStrength(password)`: 4-tier real-time strength evaluation (Yếu/Red, Trung bình/Yellow, Tốt/Cyan, Cực mạnh/Neon Green) checking length $\ge 8$, uppercase, lowercase, numbers, special characters.
  - `isValidEduVnEmail(email)`: Strict regex validation for `.edu.vn` student emails (case-insensitive, trimmed, spoof-resistant).
  - `calculateCooldownState(lastSent, duration, now)`: Anti-spam 60s cooldown timer calculation for email verification and password reset.
  - `DEMO_STUDENT_CREDENTIALS`: Canonical demo student (`minh.nguyen@campus.edu.vn` / `Demo@123456`).
- **Cyber-Glass Form Ecosystem (`web/src/app/(auth)/`)**:
  - `login/page.tsx`: Cyber-Glass card (`backdrop-blur-2xl bg-card/60 border-white/10 shadow-[0_0_50px_rgba(61,232,255,0.15)]`), "⚡ Đăng nhập nhanh Demo 1-Click" button, Google & GitHub Supabase OAuth buttons, cyberpunk neon-focused inputs, password visibility eye toggle, Remember Me checkbox, `animate-panic-shake` micro-interaction with neon red alert on invalid credentials.
  - `register/page.tsx`: Student registration form (Full name, .edu.vn email, password, confirm password), real-time 4-level `PasswordStrengthMeter` component, and Terms of Service & Academic Code of Conduct checkbox.
  - `forgot-password/page.tsx`: Email input, recovery link submission with 60-second countdown timer.
  - `reset-password/page.tsx`: New password & confirmation form with real-time `PasswordStrengthMeter` and token verification.
  - `verify-email/page.tsx`: Student activation notification with Glowing Holographic Mail visual icon, 6-character code input, and 60-second cooldown resend button.
- **Test Infrastructure (`web/tests/auth-redesign.test.ts`)**:
  - Node 22 native runner (`node --experimental-strip-types --test tests/*.test.ts`) with 6 test suites (~40 tests) verifying password strength math, demo credentials, `.edu.vn` rules, cooldown timers, Three.js lifecycle contracts, and Cyber-Glass component structures.

## Code Layout
- `web/src/lib/auth-validation.ts` — Pure TypeScript validation utilities (Password strength, .edu.vn regex, 60s cooldown math, demo credentials)
- `web/src/components/auth/auth-3d-showcase.tsx` — Vanilla Three.js 3D Hologram stage with dual spotlights & WebGL cleanup
- `web/src/components/auth/auth-feature-carousel.tsx` — "Bộ Ba Siêu Năng" carousel with live stats & inspiring quotes
- `web/src/components/auth/password-strength-meter.tsx` — 4-tier real-time neon password strength gauge with checklist badges
- `web/src/app/(auth)/layout.tsx` — 50/50 Split-Screen desktop & fluid mobile responsive layout
- `web/src/app/(auth)/login/page.tsx` — Cyber-Glass login page with 1-Click Demo, social OAuth, cyberpunk inputs & shake animation
- `web/src/app/(auth)/register/page.tsx` — Registration page with .edu.vn check, password meter & terms checkbox
- `web/src/app/(auth)/forgot-password/page.tsx` — Forgot password page with 60s cooldown resend timer
- `web/src/app/(auth)/reset-password/page.tsx` — Reset password page with token verification & strength check
- `web/src/app/(auth)/verify-email/page.tsx` — Verify email page with holographic mail icon & 60s resend button
- `web/tests/auth-redesign.test.ts` — Comprehensive unit and contract test suite for auth redesign

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | Split-Screen 50/50 Desktop Layout | Symmetrical 50/50 desktop layout, fixed 100vh, zero outer double scrollbars | M1 | ORIGINAL_REQUEST § R1 |
| F02 | Mobile/Tablet Fluid Aurora Layout | Single center column on `< 1024px` with GPU CSS Fluid Ambient Aurora blobs | M1 | ORIGINAL_REQUEST § R1 |
| F03 | Three.js 3D Hologram Knowledge Stage | Faceted Icosahedron crystal, wireframe cage, 3 gyroscopic orbital rings, 140 particles | M1 | ORIGINAL_REQUEST § R1 |
| F04 | Dual Neon Spotlights | Cyan (`#38bdf8`) & Violet (`#a855f7`) spotlights with pointer parallax tracking | M1 | ORIGINAL_REQUEST § R1 |
| F05 | WebGL Memory Safety & Cleanup | Strict disposal of geometries, materials, renderer, event listeners, and RAF | M1 | ORIGINAL_REQUEST § R1 |
| F06 | Dynamic Feature Carousel | Auto-sliding carousel (5s cycle, hover pause) of "Bộ Ba Siêu Năng" | M1 | ORIGINAL_REQUEST § R1 |
| F07 | Student Live Stats & Quotes | 12,450+ study hours statistic, active students metric, daily inspiring quotes | M1 | ORIGINAL_REQUEST § R1 |
| F08 | Auth Validation Logic Engine | Pure TS functions for password strength, .edu.vn regex, and 60s cooldown math | M2 | ORIGINAL_REQUEST § R2, R3, R4 |
| F09 | 1-Click Demo Quick Login Button | Instant autofill and login with `minh.nguyen@campus.edu.vn` / `Demo@123456` | M2 | ORIGINAL_REQUEST § R2 |
| F10 | Supabase Social OAuth Login | Google & GitHub OAuth buttons with graceful offline mock fallback | M2 | ORIGINAL_REQUEST § R2 |
| F11 | Cyberpunk Input Styling | Neon cyan glow on focus (`focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(61,232,255,0.25)]`) | M2 | ORIGINAL_REQUEST § R2 |
| F12 | Password Visibility Toggle | Intuitive show/hide password toggle button with Eye/EyeOff icons | M2 | ORIGINAL_REQUEST § R2 |
| F13 | Remember Me Checkbox | "Ghi nhớ đăng nhập" checkbox with state handling | M2 | ORIGINAL_REQUEST § R2 |
| F14 | Shake Micro-Interaction | `animate-panic-shake` animation and neon red alert banner on failed login | M2 | ORIGINAL_REQUEST § R2 |
| F15 | Student Registration Form | Full name, .edu.vn email, password, and password confirmation | M3 | ORIGINAL_REQUEST § R3 |
| F16 | 4-Tier Password Strength Meter | Real-time gauge: Weak (Red), Medium (Yellow), Good (Cyan), Strong (Neon Green) | M3 | ORIGINAL_REQUEST § R3 |
| F17 | Password Criteria Checklist | Live badges for length $\ge 8$, uppercase, numbers, and special characters | M3 | ORIGINAL_REQUEST § R3 |
| F18 | Terms of Service Checkbox | Mandatory agreement to CampusOS Academic Code of Conduct & Terms | M3 | ORIGINAL_REQUEST § R3 |
| F19 | Forgot Password Flow with 60s Cooldown | Password reset request with interactive 60-second countdown cooldown timer | M4 | ORIGINAL_REQUEST § R4 |
| F20 | Reset Password Form | Token parameter handling, password confirmation, and password strength meter | M4 | ORIGINAL_REQUEST § R4 |
| F21 | Verify Email Screen with Holographic Mail | Glowing holographic mail icon (`shadow-[0_0_35px_rgba(61,232,255,0.4)]`) & 60s resend | M4 | ORIGINAL_REQUEST § R4 |
| F22 | Auth Redesign Test Suite | `web/tests/auth-redesign.test.ts` covering all 6 test suites (~40 tests) | M5 | ORIGINAL_REQUEST § Quality Gates |
| F23 | Quality Gates Verification | 100% test pass (680+ tests), 0 typecheck errors, 100% clean production build | M5 | ORIGINAL_REQUEST § Quality Gates |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Split-Screen Layout, 3D Hologram & Feature Carousel | `(auth)/layout.tsx`, `auth-3d-showcase.tsx`, `auth-feature-carousel.tsx` | none | DONE |
| M2 | Validation Engine, Cyber-Glass Login & 1-Click Demo | `auth-validation.ts`, `(auth)/login/page.tsx` (Demo button, OAuth, shake) | none | DONE |
| M3 | Registration & 4-Level Password Strength Meter | `(auth)/register/page.tsx`, `password-strength-meter.tsx` | M2 | DONE |
| M4 | Forgot Password, Reset Password & Verify Email | `forgot-password/page.tsx`, `reset-password/page.tsx`, `verify-email/page.tsx` | M2, M3 | DONE |
| M5 | E2E & Unit Test Suite + Quality Gates Verification | `web/tests/auth-redesign.test.ts`, npm test, typecheck, build verification | M1, M2, M3, M4 | DONE |

## Interface Contracts

### Auth Validation Types (`web/src/lib/auth-validation.ts`)
```typescript
export type PasswordStrengthTier = 'weak' | 'medium' | 'good' | 'strong';

export interface PasswordCriteria {
  minLength: boolean;    // >= 8 chars
  hasUppercase: boolean; // [A-Z]
  hasLowercase: boolean; // [a-z]
  hasNumber: boolean;    // [0-9]
  hasSpecial: boolean;   // [!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]
}

export interface PasswordStrengthResult {
  score: number;         // 0 to 5
  percent: number;       // 0, 25, 50, 75, 100
  tier: PasswordStrengthTier;
  label: string;         // 'Yếu' | 'Trung bình' | 'Tốt' | 'Cực mạnh'
  color: string;         // Hex code
  criteria: PasswordCriteria;
}

export interface CooldownState {
  remainingSeconds: number; // 0 to 60
  canResend: boolean;       // true if remainingSeconds === 0
  formattedLabel: string;   // e.g. "Gửi lại mã sau (45s)" or "Gửi lại mã"
}

export const DEMO_STUDENT_CREDENTIALS = {
  email: 'minh.nguyen@campus.edu.vn',
  password: 'Demo@123456',
  fullName: 'Nguyễn Nhật Minh',
} as const;

export function calculatePasswordStrength(password: string): PasswordStrengthResult;
export function isValidEduVnEmail(email: string): boolean;
export function calculateCooldownState(
  lastSentTimestamp: number | null | undefined,
  cooldownDurationSeconds?: number,
  currentTimestamp?: number
): CooldownState;
```

### Component Props Contracts
```typescript
// web/src/components/auth/auth-3d-showcase.tsx
export interface Auth3DShowcaseProps {
  className?: string;
  intensity?: number;
  interactive?: boolean;
}

// web/src/components/auth/password-strength-meter.tsx
export interface PasswordStrengthMeterProps {
  password: string;
  showCriteria?: boolean;
  className?: string;
}

// web/src/components/auth/auth-feature-carousel.tsx
export interface FeatureSlide {
  id: string;
  superpowerTag: string;
  badge: string;
  iconType: 'cat' | 'ai' | 'party';
  title: string;
  subtitle: string;
  description: string;
  metricBadge: string;
  accentGradient: string;
  borderColor: string;
}
```
