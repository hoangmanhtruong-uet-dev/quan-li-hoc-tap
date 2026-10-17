/**
 * CampusOS Auth Flow Redesign Comprehensive Test Suite
 *
 * Requirements Source:
 *   - ORIGINAL_REQUEST.md (## 2026-10-17T07:15:36Z: R1, R2, R3, R4)
 *   - PROJECT.md (Architecture, Code Layout, Interface Contracts, Milestones)
 *   - survey_explorer_3/handoff.md (Detailed Test Specifications & Quality Gates)
 *
 * Test Suites:
 *   1. Suite 1: Password Strength Calculation Logic (8 Tests)
 *   2. Suite 2: Demo 1-Click Login Credentials & Auth (6 Tests)
 *   3. Suite 3: Student Email (.edu.vn) Strict Validation (8 Tests)
 *   4. Suite 4: 60-Second Cooldown Timer & Resend Logic (6 Tests)
 *   5. Suite 5: Split-Screen Layout & Three.js 3D Lifecycle Contracts (7 Tests)
 *   6. Suite 6: Feature Carousel & 5 Cyber-Glass Auth Pages Contracts (8 Tests)
 *
 * Runner:
 *   node --experimental-strip-types --test tests/auth-redesign.test.ts
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Import pure TypeScript logic from src/lib/auth-validation.ts and src/lib/auth.ts
import {
  calculatePasswordStrength,
  isValidEduVnEmail,
  calculateCooldownState,
  DEMO_STUDENT_CREDENTIALS,
  PASSWORD_STRENGTH_CONFIG,
  type PasswordStrengthResult,
  type PasswordCriteria,
  type CooldownState,
} from '../src/lib/auth-validation.ts';

import {
  signInWithEmail,
  getOfflineMockSession,
} from '../src/lib/auth.ts';

// Resolved paths for component file contract inspections
const layoutPath = path.resolve(process.cwd(), 'src', 'app', '(auth)', 'layout.tsx');
const showcase3DPath = path.resolve(process.cwd(), 'src', 'components', 'auth', 'auth-3d-showcase.tsx');
const carouselPath = path.resolve(process.cwd(), 'src', 'components', 'auth', 'auth-feature-carousel.tsx');
const loginPagePath = path.resolve(process.cwd(), 'src', 'app', '(auth)', 'login', 'page.tsx');
const registerPagePath = path.resolve(process.cwd(), 'src', 'app', '(auth)', 'register', 'page.tsx');
const forgotPasswordPagePath = path.resolve(process.cwd(), 'src', 'app', '(auth)', 'forgot-password', 'page.tsx');
const resetPasswordPagePath = path.resolve(process.cwd(), 'src', 'app', '(auth)', 'reset-password', 'page.tsx');
const verifyEmailPagePath = path.resolve(process.cwd(), 'src', 'app', '(auth)', 'verify-email', 'page.tsx');

// ============================================================================
// SUITE 1: Password Strength Calculation Logic (8 Tests)
// ============================================================================
describe('Suite 1: Password Strength Calculation Logic', () => {
  test('1.1 Empty or whitespace password returns score 0, tier "weak", percent 0, and all criteria false', () => {
    const emptyResult = calculatePasswordStrength('');
    assert.equal(emptyResult.score, 0);
    assert.equal(emptyResult.percent, 0);
    assert.equal(emptyResult.tier, 'weak');
    assert.equal(emptyResult.label, 'Yếu');
    assert.equal(emptyResult.color, '#EF4444');
    assert.deepEqual(emptyResult.criteria, {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecial: false,
    });

    const spacesResult = calculatePasswordStrength('     ');
    assert.equal(spacesResult.score, 0);
    assert.equal(spacesResult.percent, 0);
    assert.equal(spacesResult.tier, 'weak');

    const tabResult = calculatePasswordStrength('\t\n');
    assert.equal(tabResult.score, 0);
    assert.equal(tabResult.tier, 'weak');
  });

  test('1.2 Short passwords (< 6 chars) are classified as "weak" even if diverse', () => {
    // "Ab1!" meets 4 criteria (upper, lower, num, special) but length is only 4 (< 6)
    const shortDiverse = calculatePasswordStrength('Ab1!');
    assert.equal(shortDiverse.tier, 'weak');
    assert.equal(shortDiverse.label, 'Yếu');
    assert.equal(shortDiverse.color, '#EF4444');
    assert.equal(shortDiverse.criteria.minLength, false);
    assert.equal(shortDiverse.criteria.hasUppercase, true);
    assert.equal(shortDiverse.criteria.hasLowercase, true);
    assert.equal(shortDiverse.criteria.hasNumber, true);
    assert.equal(shortDiverse.criteria.hasSpecial, true);

    const len5Diverse = calculatePasswordStrength('Xy9$k');
    assert.equal(len5Diverse.tier, 'weak');
    assert.equal(len5Diverse.criteria.minLength, false);

    const len3Simple = calculatePasswordStrength('abc');
    assert.equal(len3Simple.tier, 'weak');
  });

  test('1.3 Passwords meeting 2 criteria map to tier "medium" with 50% score', () => {
    // "abcde1": length 6 (>= 6), lowercase + number -> score 2, minLength false
    const mediumPass1 = calculatePasswordStrength('abcde1');
    assert.equal(mediumPass1.tier, 'medium');
    assert.equal(mediumPass1.percent, 50);
    assert.equal(mediumPass1.label, 'Trung bình');
    assert.equal(mediumPass1.color, '#F59E0B');

    // "abcdefgh": length 8 (minLength true) + lowercase -> score 2
    const mediumPass2 = calculatePasswordStrength('abcdefgh');
    assert.equal(mediumPass2.score, 2);
    assert.equal(mediumPass2.tier, 'medium');
    assert.equal(mediumPass2.percent, 50);
    assert.equal(mediumPass2.criteria.minLength, true);
    assert.equal(mediumPass2.criteria.hasLowercase, true);
    assert.equal(mediumPass2.criteria.hasUppercase, false);
  });

  test('1.4 Passwords meeting 3-4 criteria with length >= 8 map to tier "good" with 75% score', () => {
    // "CampusOS2026": length 12 (minLength), uppercase, lowercase, number -> score 4, special false
    const goodPass1 = calculatePasswordStrength('CampusOS2026');
    assert.equal(goodPass1.score, 4);
    assert.equal(goodPass1.percent, 75);
    assert.equal(goodPass1.tier, 'good');
    assert.equal(goodPass1.label, 'Tốt');
    assert.equal(goodPass1.color, '#06B6D4');
    assert.equal(goodPass1.criteria.minLength, true);
    assert.equal(goodPass1.criteria.hasUppercase, true);
    assert.equal(goodPass1.criteria.hasLowercase, true);
    assert.equal(goodPass1.criteria.hasNumber, true);
    assert.equal(goodPass1.criteria.hasSpecial, false);

    // "campus123!": length 10 (minLength), lowercase, number, special -> score 4, uppercase false
    const goodPass2 = calculatePasswordStrength('campus123!');
    assert.equal(goodPass2.score, 4);
    assert.equal(goodPass2.tier, 'good');
    assert.equal(goodPass2.percent, 75);

    // "vietnam2026": length 11 (minLength), lowercase, number -> score 3
    const goodPass3 = calculatePasswordStrength('vietnam2026');
    assert.equal(goodPass3.score, 3);
    assert.equal(goodPass3.tier, 'good');
    assert.equal(goodPass3.percent, 75);
  });

  test('1.5 Passwords meeting all 5 criteria with length >= 8 map to tier "strong" with 100% score (e.g. "Demo@123456")', () => {
    const demoPass = calculatePasswordStrength('Demo@123456');
    assert.equal(demoPass.score, 5);
    assert.equal(demoPass.percent, 100);
    assert.equal(demoPass.tier, 'strong');
    assert.equal(demoPass.label, 'Cực mạnh');
    assert.equal(demoPass.color, '#22C55E');
    assert.equal(demoPass.criteria.minLength, true);
    assert.equal(demoPass.criteria.hasUppercase, true);
    assert.equal(demoPass.criteria.hasLowercase, true);
    assert.equal(demoPass.criteria.hasNumber, true);
    assert.equal(demoPass.criteria.hasSpecial, true);

    const campusSecure = calculatePasswordStrength('Campus#Secure2026');
    assert.equal(campusSecure.score, 5);
    assert.equal(campusSecure.tier, 'strong');
    assert.equal(campusSecure.percent, 100);
  });

  test('1.6 Edge cases: Unicode characters ("HọcTập@2026!"), extreme length (100+ chars), space-separated phrases', () => {
    // Unicode Vietnamese accents with uppercase, lowercase, numbers, specials
    const unicodeResult = calculatePasswordStrength('HọcTập@2026!');
    assert.equal(unicodeResult.criteria.minLength, true);
    assert.equal(unicodeResult.criteria.hasUppercase, true);
    assert.equal(unicodeResult.criteria.hasLowercase, true);
    assert.equal(unicodeResult.criteria.hasNumber, true);
    assert.equal(unicodeResult.criteria.hasSpecial, true);
    assert.equal(unicodeResult.tier, 'strong');
    assert.equal(unicodeResult.score, 5);

    // Extreme length 120+ characters meeting all criteria
    const extremeLong = calculatePasswordStrength('A'.repeat(120) + 'a1!');
    assert.equal(extremeLong.criteria.minLength, true);
    assert.equal(extremeLong.score, 5);
    assert.equal(extremeLong.tier, 'strong');

    // Space-separated passphrase with special character
    const spacePhrase = calculatePasswordStrength('Campus OS Student 2026 !');
    assert.equal(spacePhrase.criteria.minLength, true);
    assert.equal(spacePhrase.criteria.hasUppercase, true);
    assert.equal(spacePhrase.criteria.hasLowercase, true);
    assert.equal(spacePhrase.criteria.hasNumber, true);
    assert.equal(spacePhrase.criteria.hasSpecial, true);
    assert.equal(spacePhrase.tier, 'strong');
  });

  test('1.7 Color and label mapping contracts match specification', () => {
    assert.equal(PASSWORD_STRENGTH_CONFIG.weak.label, 'Yếu');
    assert.equal(PASSWORD_STRENGTH_CONFIG.weak.color, '#EF4444');
    assert.equal(PASSWORD_STRENGTH_CONFIG.weak.percent, 25);

    assert.equal(PASSWORD_STRENGTH_CONFIG.medium.label, 'Trung bình');
    assert.equal(PASSWORD_STRENGTH_CONFIG.medium.color, '#F59E0B');
    assert.equal(PASSWORD_STRENGTH_CONFIG.medium.percent, 50);

    assert.equal(PASSWORD_STRENGTH_CONFIG.good.label, 'Tốt');
    assert.equal(PASSWORD_STRENGTH_CONFIG.good.color, '#06B6D4');
    assert.equal(PASSWORD_STRENGTH_CONFIG.good.percent, 75);

    assert.equal(PASSWORD_STRENGTH_CONFIG.strong.label, 'Cực mạnh');
    assert.equal(PASSWORD_STRENGTH_CONFIG.strong.color, '#22C55E');
    assert.equal(PASSWORD_STRENGTH_CONFIG.strong.percent, 100);
  });

  test('1.8 Criteria breakdown flags (minLength, hasUppercase, hasLowercase, hasNumber, hasSpecial) return exact booleans', () => {
    // Isolated uppercase only (8 chars)
    const upperOnly = calculatePasswordStrength('ABCDEFGH');
    assert.equal(upperOnly.criteria.minLength, true);
    assert.equal(upperOnly.criteria.hasUppercase, true);
    assert.equal(upperOnly.criteria.hasLowercase, false);
    assert.equal(upperOnly.criteria.hasNumber, false);
    assert.equal(upperOnly.criteria.hasSpecial, false);

    // Isolated numbers only (8 chars)
    const numOnly = calculatePasswordStrength('12345678');
    assert.equal(numOnly.criteria.minLength, true);
    assert.equal(numOnly.criteria.hasUppercase, false);
    assert.equal(numOnly.criteria.hasLowercase, false);
    assert.equal(numOnly.criteria.hasNumber, true);
    assert.equal(numOnly.criteria.hasSpecial, false);

    // Isolated special only (8 chars)
    const specialOnly = calculatePasswordStrength('!@#$%^&*');
    assert.equal(specialOnly.criteria.minLength, true);
    assert.equal(specialOnly.criteria.hasUppercase, false);
    assert.equal(specialOnly.criteria.hasLowercase, false);
    assert.equal(specialOnly.criteria.hasNumber, false);
    assert.equal(specialOnly.criteria.hasSpecial, true);

    // Short password diverse
    const shortDiverse = calculatePasswordStrength('Ab1#');
    assert.equal(shortDiverse.criteria.minLength, false);
    assert.equal(shortDiverse.criteria.hasUppercase, true);
    assert.equal(shortDiverse.criteria.hasLowercase, true);
    assert.equal(shortDiverse.criteria.hasNumber, true);
    assert.equal(shortDiverse.criteria.hasSpecial, true);
  });
});

// ============================================================================
// SUITE 2: Demo 1-Click Login Credentials & Auth (6 Tests)
// ============================================================================
describe('Suite 2: Demo 1-Click Login Credentials & Auth', () => {
  test('2.1 DEMO_STUDENT_CREDENTIALS matches authoritative spec: minh.nguyen@campus.edu.vn / Demo@123456', () => {
    assert.equal(DEMO_STUDENT_CREDENTIALS.email, 'minh.nguyen@campus.edu.vn');
    assert.equal(DEMO_STUDENT_CREDENTIALS.password, 'Demo@123456');
    assert.equal(DEMO_STUDENT_CREDENTIALS.fullName, 'Nguyễn Nhật Minh');
  });

  test('2.2 Demo email satisfies .edu.vn validation', () => {
    const valid = isValidEduVnEmail(DEMO_STUDENT_CREDENTIALS.email);
    assert.equal(valid, true, 'Demo email must pass isValidEduVnEmail validation');
  });

  test('2.3 Demo password satisfies tier "strong" (score 5/5, length 11)', () => {
    const strength = calculatePasswordStrength(DEMO_STUDENT_CREDENTIALS.password);
    assert.equal(strength.score, 5);
    assert.equal(strength.tier, 'strong');
    assert.equal(strength.percent, 100);
    assert.equal(strength.label, 'Cực mạnh');
    assert.equal(strength.criteria.minLength, true);
    assert.equal(strength.criteria.hasUppercase, true);
    assert.equal(strength.criteria.hasLowercase, true);
    assert.equal(strength.criteria.hasNumber, true);
    assert.equal(strength.criteria.hasSpecial, true);
  });

  test('2.4 signInWithEmail with demo credentials resolves successfully without error in offline/mock mode', async () => {
    const { data, error } = await signInWithEmail(
      DEMO_STUDENT_CREDENTIALS.email,
      DEMO_STUDENT_CREDENTIALS.password
    );
    assert.equal(error, null, 'Offline signInWithEmail must not return an error');
    assert.ok(data?.user, 'Must return a user object');
    assert.equal(data.user.email, DEMO_STUDENT_CREDENTIALS.email);
  });

  test('2.5 Offline mock session returns valid student role and matching email', () => {
    const session = getOfflineMockSession(DEMO_STUDENT_CREDENTIALS.email);
    assert.equal(session.email, 'minh.nguyen@campus.edu.vn');
    assert.equal(session.role, 'student');
    assert.ok(session.id, 'Session must include an identifier');
  });

  test('2.6 LoginPage source contract contains Demo 1-Click button with ⚡ icon, pre-fill handler, and direct submit', () => {
    assert.ok(fs.existsSync(loginPagePath), 'Login page must exist');
    const content = fs.readFileSync(loginPagePath, 'utf8');

    // Button presence and label
    assert.match(content, /Đăng nhập nhanh Demo 1-Click/, 'Must contain Demo 1-Click button text');
    assert.match(content, /⚡/, 'Must contain ⚡ lightning icon');

    // Demo credentials integration
    assert.match(content, /DEMO_STUDENT_CREDENTIALS/, 'Must reference DEMO_STUDENT_CREDENTIALS');
    assert.match(content, /handleDemoLogin/, 'Must contain handleDemoLogin handler');

    // Cyberpunk form micro-interactions
    assert.match(content, /animate-panic-shake|panic-shake/, 'Must include shake animation for errors');
    assert.match(content, /Eye|EyeOff/, 'Must include show/hide password toggle icons');
    assert.match(content, /rememberMe|campusos_remember_email/, 'Must include remember me handling');
  });
});

// ============================================================================
// SUITE 3: Student Email (.edu.vn) Strict Validation (8 Tests)
// ============================================================================
describe('Suite 3: Student Email (.edu.vn) Strict Validation', () => {
  test('3.1 Validates standard university emails (.edu.vn): minh.nguyen@campus.edu.vn, student@hust.edu.vn, 20020123@vnu.edu.vn, cntt@uit.edu.vn', () => {
    const validEmails = [
      'minh.nguyen@campus.edu.vn',
      'student@hust.edu.vn',
      '20020123@vnu.edu.vn',
      'cntt@uit.edu.vn',
      'le.thi.b@fpt.edu.vn',
      'sinhvien@neu.edu.vn',
      'nguyenvana@hcmut.edu.vn',
    ];

    for (const email of validEmails) {
      assert.equal(isValidEduVnEmail(email), true, `Expected valid: ${email}`);
    }
  });

  test('3.2 Case-insensitivity: converts MINH.NGUYEN@CAMPUS.EDU.VN to valid', () => {
    assert.equal(isValidEduVnEmail('MINH.NGUYEN@CAMPUS.EDU.VN'), true);
    assert.equal(isValidEduVnEmail('Student@HUST.Edu.Vn'), true);
    assert.equal(isValidEduVnEmail('20020123@VNU.EDU.VN'), true);
    assert.equal(isValidEduVnEmail('CNTT@UIT.Edu.VN'), true);
  });

  test('3.3 Leading/trailing whitespace handling: trims and validates "  sv@bku.edu.vn  "', () => {
    assert.equal(isValidEduVnEmail('  sv@bku.edu.vn  '), true);
    assert.equal(isValidEduVnEmail('\tstudent@neu.edu.vn\n'), true);
    assert.equal(isValidEduVnEmail('   minh.nguyen@campus.edu.vn   '), true);
  });

  test('3.4 Rejects commercial and non-edu domains: student@gmail.com, student@yahoo.vn, student@outlook.com', () => {
    const invalidDomains = [
      'student@gmail.com',
      'student@yahoo.vn',
      'student@outlook.com',
      'user@campusos.com',
      'admin@hotline.vn',
      'student@tech.io',
    ];

    for (const email of invalidDomains) {
      assert.equal(isValidEduVnEmail(email), false, `Expected rejected: ${email}`);
    }
  });

  test('3.5 Rejects missing .vn or missing .edu: student@campus.edu, student@campus.vn', () => {
    assert.equal(isValidEduVnEmail('student@campus.edu'), false, 'Missing .vn must be rejected');
    assert.equal(isValidEduVnEmail('student@campus.vn'), false, 'Missing .edu must be rejected');
    assert.equal(isValidEduVnEmail('student@harvard.edu'), false, 'US .edu without .vn must be rejected');
    assert.equal(isValidEduVnEmail('user@government.gov.vn'), false, 'gov.vn must be rejected');
  });

  test('3.6 Rejects domain spoofing attacks: admin@campus.edu.vn.attacker.com, user@evil-edu.vn', () => {
    const spoofAttempts = [
      'admin@campus.edu.vn.attacker.com',
      'user@evil-edu.vn',
      'hacker@campus.edu.vn.phishing.net',
      'test@edu.vn.evil.com',
      'fake@sub.edu.vn.attacker.org',
    ];

    for (const email of spoofAttempts) {
      assert.equal(isValidEduVnEmail(email), false, `Expected spoof rejected: ${email}`);
    }
  });

  test('3.7 Rejects malformed email syntax: @hust.edu.vn, student@, student@.edu.vn, student@@hust.edu.vn', () => {
    const malformed = [
      '@hust.edu.vn',
      'student@',
      'student@.edu.vn',
      'student@@hust.edu.vn',
      'student..name@hust.edu.vn',
      'student@hust..edu.vn',
      'student@.edu.vn.',
    ];

    for (const email of malformed) {
      assert.equal(isValidEduVnEmail(email), false, `Expected malformed rejected: ${email}`);
    }
  });

  test('3.8 Boundary inputs: handles empty string, null, undefined, extreme length safely returning false', () => {
    assert.equal(isValidEduVnEmail(''), false);
    assert.equal(isValidEduVnEmail('   '), false);
    assert.equal(isValidEduVnEmail(null as unknown as string), false);
    assert.equal(isValidEduVnEmail(undefined as unknown as string), false);
    assert.equal(isValidEduVnEmail(123456 as unknown as string), false);

    // Extreme length exceeding 254 RFC limits
    const extremeEmail = 'a'.repeat(260) + '@campus.edu.vn';
    assert.equal(isValidEduVnEmail(extremeEmail), false);
  });
});

// ============================================================================
// SUITE 4: 60-Second Cooldown Timer & Resend Logic (6 Tests)
// ============================================================================
describe('Suite 4: 60-Second Cooldown Timer & Resend Logic', () => {
  test('4.1 Initial state (lastSent = null or 0): remaining = 0s, canResend = true, label = "Gửi lại mã"', () => {
    const stateNull = calculateCooldownState(null);
    assert.equal(stateNull.remainingSeconds, 0);
    assert.equal(stateNull.canResend, true);
    assert.equal(stateNull.formattedLabel, 'Gửi lại mã');

    const stateZero = calculateCooldownState(0);
    assert.equal(stateZero.remainingSeconds, 0);
    assert.equal(stateZero.canResend, true);
    assert.equal(stateZero.formattedLabel, 'Gửi lại mã');

    const stateUndefined = calculateCooldownState(undefined);
    assert.equal(stateUndefined.remainingSeconds, 0);
    assert.equal(stateUndefined.canResend, true);
  });

  test('4.2 Immediate post-send (elapsed 0s): remaining = 60s, canResend = false, label contains "60s"', () => {
    const baseTime = 1700000000000;
    const state = calculateCooldownState(baseTime, 60, baseTime);

    assert.equal(state.remainingSeconds, 60);
    assert.equal(state.canResend, false);
    assert.match(state.formattedLabel, /60s/);
  });

  test('4.3 Mid-cooldown (elapsed 25s): remaining = 35s, canResend = false, label contains "35s"', () => {
    const baseTime = 1700000000000;
    const lastSent = baseTime - 25000; // 25s ago
    const state = calculateCooldownState(lastSent, 60, baseTime);

    assert.equal(state.remainingSeconds, 35);
    assert.equal(state.canResend, false);
    assert.match(state.formattedLabel, /35s/);
  });

  test('4.4 Boundary expiration: elapsed 59s -> remaining = 1s, canResend = false; elapsed 60s -> remaining = 0s, canResend = true', () => {
    const baseTime = 1700000000000;

    // 59 seconds elapsed
    const state59 = calculateCooldownState(baseTime - 59000, 60, baseTime);
    assert.equal(state59.remainingSeconds, 1);
    assert.equal(state59.canResend, false);
    assert.match(state59.formattedLabel, /1s/);

    // 60 seconds elapsed (exact boundary)
    const state60 = calculateCooldownState(baseTime - 60000, 60, baseTime);
    assert.equal(state60.remainingSeconds, 0);
    assert.equal(state60.canResend, true);
    assert.equal(state60.formattedLabel, 'Gửi lại mã');
  });

  test('4.5 Post-cooldown (elapsed > 60s): remaining = 0s, canResend = true', () => {
    const baseTime = 1700000000000;
    const lastSent = baseTime - 120000; // 2 minutes ago
    const state = calculateCooldownState(lastSent, 60, baseTime);

    assert.equal(state.remainingSeconds, 0);
    assert.equal(state.canResend, true);
    assert.equal(state.formattedLabel, 'Gửi lại mã');
  });

  test('4.6 Clock skew resilience: future lastSent timestamp clamped gracefully without NaN or negative values', () => {
    const baseTime = 1700000000000;
    const futureLastSent = baseTime + 15000; // Clock moved backwards by 15s
    const state = calculateCooldownState(futureLastSent, 60, baseTime);

    assert.equal(state.remainingSeconds, 60);
    assert.equal(state.canResend, false);
    assert.ok(!Number.isNaN(state.remainingSeconds));
    assert.ok(state.remainingSeconds >= 0);
  });
});

// ============================================================================
// SUITE 5: Split-Screen Layout & Three.js 3D Lifecycle Contracts (7 Tests)
// ============================================================================
describe('Suite 5: Split-Screen Layout & Three.js 3D Lifecycle Contracts', () => {
  test('5.1 (auth)/layout.tsx file exists and implements 50/50 split-screen on desktop (lg:w-1/2) and 100vh viewport', () => {
    assert.ok(fs.existsSync(layoutPath), 'Auth layout must exist at (auth)/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf8');

    // Desktop 50/50 split structure
    assert.match(content, /lg:flex-row|lg:grid-cols-2/, 'Layout must implement desktop split container');
    assert.match(content, /lg:w-1\/2|lg:col-span-1/, 'Left and right panes must occupy 50% width on desktop');

    // 100vh viewport containment preventing outer double scrollbars
    assert.match(content, /lg:h-screen/, 'Must enforce lg:h-screen viewport height');
    assert.match(content, /lg:overflow-hidden/, 'Must prevent outer page double scrollbars on desktop');

    // Responsive single-column mobile support
    assert.match(content, /flex-col/, 'Must collapse to single column on mobile');
  });

  test('5.2 layout.tsx mounts Auth3DShowcase and AuthFeatureCarousel on desktop side, children on form side', () => {
    const content = fs.readFileSync(layoutPath, 'utf8');

    // Left pane showcase components
    assert.match(content, /Auth3DShowcase/, 'Must mount Auth3DShowcase in left pane');
    assert.match(content, /AuthFeatureCarousel/, 'Must mount AuthFeatureCarousel in left pane');

    // Right pane form container
    assert.match(content, /\{children\}/, 'Must render children inside form container');
    assert.match(content, /overflow-y-auto/, 'Form pane must support internal scrolling');
  });

  test('5.3 auth-3d-showcase.tsx imports vanilla Three.js and constructs knowledge sphere/crystal hologram geometry', () => {
    assert.ok(fs.existsSync(showcase3DPath), 'auth-3d-showcase.tsx must exist');
    const content = fs.readFileSync(showcase3DPath, 'utf8');

    // Vanilla Three.js import
    assert.match(content, /import \* as THREE from 'three'/, 'Must import vanilla Three.js');

    // Faceted core and wireframe cage
    assert.match(content, /IcosahedronGeometry/, 'Must construct Icosahedron crystal core');
    assert.match(content, /wireframe:\s*true/, 'Must include wireframe cage geometry');

    // Gyroscopic orbital rings
    assert.match(content, /TorusGeometry/, 'Must construct Torus orbital rings');

    // Quantum stardust points
    assert.match(content, /BufferGeometry/, 'Must construct BufferGeometry for particles');
    assert.match(content, /PARTICLE_COUNT|140/, 'Must include stardust particle nodes');

    // Exports
    assert.match(content, /export function Auth3DShowcase/, 'Must export Auth3DShowcase component');
    assert.match(content, /export default Auth3DShowcase/, 'Must default export Auth3DShowcase');
  });

  test('5.4 auth-3d-showcase.tsx configures dual neon spotlights (Cyan 0x38bdf8 and Violet 0xa855f7)', () => {
    const content = fs.readFileSync(showcase3DPath, 'utf8');

    assert.match(content, /THREE\.SpotLight/, 'Must instantiate Three.js SpotLight');
    assert.match(content, /0x38bdf8|#38bdf8/, 'Must configure Cyan spotlight (#38bdf8)');
    assert.match(content, /0xa855f7|#a855f7/, 'Must configure Violet spotlight (#a855f7)');
  });

  test('5.5 auth-3d-showcase.tsx implements pointermove/mousemove reactive rotation/tilt with event listener removal on unmount', () => {
    const content = fs.readFileSync(showcase3DPath, 'utf8');

    // Pointer event listeners
    assert.match(content, /addEventListener\('(mousemove|pointermove)'/, 'Must attach mouse/pointer listener');
    assert.match(content, /rotation\.y\s*\+=|rotation\.x\s*\+=/, 'Must apply parallax rotation damping');

    // Cleanup removal
    assert.match(content, /removeEventListener\('(mousemove|pointermove)'/, 'Must clean up pointer event listener');
  });

  test('5.6 auth-3d-showcase.tsx implements strict memory cleanup: cancelAnimationFrame, renderer.dispose(), geometry.dispose(), material.dispose(), and DPR <= 1.5', () => {
    const content = fs.readFileSync(showcase3DPath, 'utf8');

    assert.match(content, /cancelAnimationFrame\(animId\)/, 'Must cancel animation frame on unmount');
    assert.match(content, /renderer\.dispose\(\)/, 'Must dispose WebGL renderer');
    assert.match(content, /geo\.dispose\(\)|geometriesToDispose/, 'Must track and dispose geometries');
    assert.match(content, /mat\.dispose\(\)|materialsToDispose/, 'Must track and dispose materials');
    assert.match(content, /container\.removeChild\(renderer\.domElement\)/, 'Must remove canvas domElement');

    // DPR clamped to <= 1.5 for 120FPS battery efficiency
    assert.match(content, /Math\.min\(.*1\.5\)/, 'Must clamp DPR to <= 1.5');
  });

  test('5.7 auth-3d-showcase.tsx respects prefers-reduced-motion media query and WebGL capability fallback', () => {
    const content = fs.readFileSync(showcase3DPath, 'utf8');

    assert.match(content, /prefers-reduced-motion/, 'Must query prefers-reduced-motion');
    assert.match(content, /WebGLRenderingContext|webgl/, 'Must verify WebGL context availability');
    assert.match(content, /isReducedMotion|hasWebGL/, 'Must render fallback card when reduced-motion or no WebGL');
  });
});

// ============================================================================
// SUITE 6: Feature Carousel & 5 Cyber-Glass Auth Pages Contracts (8 Tests)
// ============================================================================
describe('Suite 6: Feature Carousel & 5 Cyber-Glass Auth Pages Contracts', () => {
  test('6.1 auth-feature-carousel.tsx showcases "Bộ Ba Siêu Năng": Mèo Cam Giám Sát, AI Study Hub 1M Tokens, Pomodoro Party 3D', () => {
    assert.ok(fs.existsSync(carouselPath), 'auth-feature-carousel.tsx must exist');
    const content = fs.readFileSync(carouselPath, 'utf8');

    // Superpower Trio Slides
    assert.match(content, /Mèo Cam Giám Sát Cực Đoan/, 'Must feature Superpower 1: Mèo Cam Giám Sát');
    assert.match(content, /AI Study Hub/, 'Must feature Superpower 2: AI Study Hub');
    assert.match(content, /Pomodoro Party/, 'Must feature Superpower 3: Pomodoro Party');

    // Feature details
    assert.match(content, /URL Tab Blacklist|URL Blacklist/, 'Must describe URL Blacklist');
    assert.match(content, /Flashcard 3D SM-2/, 'Must describe Flashcard 3D SM-2');
    assert.match(content, /Bục Vinh Danh 3D/, 'Must describe Bục Vinh Danh 3D');
  });

  test('6.2 auth-feature-carousel.tsx includes student statistics ("12,450+ giờ học") and auto-play timer with clearInterval cleanup', () => {
    const content = fs.readFileSync(carouselPath, 'utf8');

    // Student statistics
    assert.match(content, /12,450\+/, 'Must include 12,450+ study hours metric');
    assert.match(content, /giờ học hôm nay/, 'Must include Vietnamese label for study hours');

    // Auto-advance timer and cleanup
    assert.match(content, /setInterval\(/, 'Must set interval for auto-sliding carousel');
    assert.match(content, /clearInterval\(/, 'Must clean up interval on unmount');
    assert.match(content, /onMouseEnter|onMouseLeave/, 'Must pause auto-sliding on hover');
  });

  test('6.3 LoginPage contract: Cyber-Glass container, Demo 1-Click button, Google/GitHub social login, password toggle Eye/EyeOff, Remember Me checkbox, panic-shake animation', () => {
    assert.ok(fs.existsSync(loginPagePath), 'Login page must exist');
    const content = fs.readFileSync(loginPagePath, 'utf8');

    // Cyber-Glass container
    assert.match(content, /backdrop-blur-2xl/, 'Login card must apply backdrop-blur-2xl');
    assert.match(content, /bg-card\/60/, 'Login card must apply bg-card/60');
    assert.match(content, /border-white\/10/, 'Login card must apply border-white/10');

    // Demo 1-Click login
    assert.match(content, /Đăng nhập nhanh Demo 1-Click/, 'Must contain Demo 1-Click CTA');

    // Social OAuth
    assert.match(content, /Google/, 'Must include Google OAuth button');
    assert.match(content, /GitHub/, 'Must include GitHub OAuth button');

    // Micro-interactions
    assert.match(content, /showPassword/, 'Must control showPassword state');
    assert.match(content, /Eye/, 'Must include password visibility toggle');
    assert.match(content, /rememberMe/, 'Must control rememberMe state');
    assert.match(content, /shake|panic-shake/, 'Must trigger shake animation on error');
  });

  test('6.4 RegisterPage contract: export default, handles full name, student email, password, and links to login', () => {
    assert.ok(fs.existsSync(registerPagePath), 'Register page must exist');
    const content = fs.readFileSync(registerPagePath, 'utf8');

    assert.match(content, /export default function RegisterPage|export default/, 'Must default export RegisterPage');
    assert.match(content, /name="name"|name="fullName"|fullName/i, 'Must have full name input');
    assert.match(content, /name="email"|type="email"/, 'Must have email input');
    assert.match(content, /name="password"|type="password"/, 'Must have password input');
    assert.match(content, /href="\/login"/, 'Must have link back to /login');
  });

  test('6.5 ForgotPasswordPage contract: export default, handles student email, submit form, and link to login', () => {
    assert.ok(fs.existsSync(forgotPasswordPagePath), 'Forgot password page must exist');
    const content = fs.readFileSync(forgotPasswordPagePath, 'utf8');

    assert.match(content, /export default function ForgotPasswordPage|export default/, 'Must default export ForgotPasswordPage');
    assert.match(content, /name="email"|type="email"/, 'Must have email input');
    assert.match(content, /handleSubmit|onSubmit/, 'Must handle form submission');
    assert.match(content, /href="\/login"/, 'Must have link back to /login');
  });

  test('6.6 ResetPasswordPage contract: export default, token query parameter handling, new password input, and redirect to login', () => {
    assert.ok(fs.existsSync(resetPasswordPagePath), 'Reset password page must exist');
    const content = fs.readFileSync(resetPasswordPagePath, 'utf8');

    assert.match(content, /export default function ResetPasswordPage|export default/, 'Must default export ResetPasswordPage');
    assert.match(content, /token/, 'Must handle token query parameter');
    assert.match(content, /name="password"|type="password"/, 'Must have new password input');
    assert.match(content, /\/login/, 'Must include redirect or link to /login');
  });

  test('6.7 VerifyEmailPage contract: export default, verification code/token input, submission handling, and link to login', () => {
    assert.ok(fs.existsSync(verifyEmailPagePath), 'Verify email page must exist');
    const content = fs.readFileSync(verifyEmailPagePath, 'utf8');

    assert.match(content, /export default function VerifyEmailPage|export default/, 'Must default export VerifyEmailPage');
    assert.match(content, /token|tokenInput|code/i, 'Must have code/token input');
    assert.match(content, /handleSubmit|onSubmit/, 'Must handle verification submission');
    assert.match(content, /\/login/, 'Must include navigation or link to /login');
  });

  test('6.8 All 5 auth route files exist and adhere to Next.js App Router conventions with Cyber-Glass styling', () => {
    const authPages = [
      loginPagePath,
      registerPagePath,
      forgotPasswordPagePath,
      resetPasswordPagePath,
      verifyEmailPagePath,
    ];

    for (const pagePath of authPages) {
      assert.ok(fs.existsSync(pagePath), `Auth route must exist: ${pagePath}`);
      const fileContent = fs.readFileSync(pagePath, 'utf8');
      assert.match(fileContent, /'use client'/, `Page must declare 'use client': ${pagePath}`);
      assert.match(fileContent, /export default/, `Page must default export component: ${pagePath}`);
    }

    // Verify Auth Layout provides the master Cyber-Glass obsidian background
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    assert.match(layoutContent, /#080d19|#0A0A12/, 'Layout must set obsidian dark foundation background');
    assert.match(layoutContent, /cyan|violet/i, 'Layout must include ambient aurora lighting accents');
  });
});
