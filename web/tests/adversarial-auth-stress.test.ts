/**
 * Adversarial Stress & Empirical Verification Test Suite for CampusOS Auth Redesign
 *
 * Authored by: challenger_1 (Empirical Challenger)
 * Scope:
 *   1. Extreme boundary and malformed inputs to calculatePasswordStrength:
 *      - Empty, whitespace, 1-char, 1000-char string, emoji/unicode, spaces, all-symbols, all-numbers.
 *   2. Adversarial educational email strings to isValidEduVnEmail:
 *      - Valid: mixed case, trimmed, nested subdomains (e.g. student@cntt.uit.edu.vn).
 *      - Invalid / Attack strings: spoofed domains (user@edu.vn.attacker.com, user@attacker-edu.vn),
 *        commercial domains (user@gmail.com), missing .vn (user@campus.edu), missing .edu (user@campus.vn),
 *        multiple @ signs, SQL injection payloads.
 *   3. Cooldown timer calculations in calculateCooldownState:
 *      - Clock skew (future timestamps), negative differences, zero, boundary transitions at 59s and 60s.
 *   4. Demo Student credentials authentication flow verification.
 *
 * Runner:
 *   node --experimental-strip-types --test tests/adversarial-auth-stress.test.ts
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculatePasswordStrength,
  isValidEduVnEmail,
  calculateCooldownState,
  DEMO_STUDENT_CREDENTIALS,
  type PasswordStrengthResult,
  type CooldownState,
} from '../src/lib/auth-validation.ts';

import {
  signInWithEmail,
  getOfflineMockSession,
} from '../src/lib/auth.ts';

// ============================================================================
// ADVERSARIAL SECTION 1: calculatePasswordStrength Boundary & Malformed Inputs
// ============================================================================
describe('Adversarial Stress 1: calculatePasswordStrength Extreme & Malformed Inputs', () => {
  test('1.1 Empty, whitespace-only, and spacing inputs return tier "weak" with score 0 and percent 0', () => {
    const whitespaceInputs = [
      '',
      ' ',
      '   ',
      '\t',
      '\n',
      '\r\n',
      ' \t \n \r  ',
      '      '.repeat(25),
    ];

    for (const input of whitespaceInputs) {
      const res = calculatePasswordStrength(input);
      assert.equal(res.score, 0, `Expected score 0 for whitespace: ${JSON.stringify(input)}`);
      assert.equal(res.percent, 0, `Expected percent 0 for whitespace: ${JSON.stringify(input)}`);
      assert.equal(res.tier, 'weak', `Expected tier 'weak' for whitespace: ${JSON.stringify(input)}`);
      assert.equal(res.label, 'Yếu');
      assert.equal(res.color, '#EF4444');
      assert.equal(res.criteria.minLength, false);
      assert.equal(res.criteria.hasUppercase, false);
      assert.equal(res.criteria.hasLowercase, false);
      assert.equal(res.criteria.hasNumber, false);
      assert.equal(res.criteria.hasSpecial, false);
    }
  });

  test('1.2 1-character strings of every character class return tier "weak" with score 1 and percent 25%', () => {
    const singleCharInputs = [
      { input: 'a', charClass: 'lowercase', expected: { minLength: false, hasUppercase: false, hasLowercase: true, hasNumber: false, hasSpecial: false } },
      { input: 'Z', charClass: 'uppercase', expected: { minLength: false, hasUppercase: true, hasLowercase: false, hasNumber: false, hasSpecial: false } },
      { input: '9', charClass: 'number', expected: { minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: true, hasSpecial: false } },
      { input: '!', charClass: 'symbol', expected: { minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSpecial: true } },
      { input: '#', charClass: 'symbol', expected: { minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSpecial: true } },
      { input: '🔥', charClass: 'emoji', expected: { minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false, hasSpecial: true } },
    ];

    for (const { input, charClass, expected } of singleCharInputs) {
      const res = calculatePasswordStrength(input);
      assert.equal(res.score, 1, `1-char (${charClass}) must have score 1`);
      assert.equal(res.percent, 25, `1-char (${charClass}) must have percent 25`);
      assert.equal(res.tier, 'weak', `1-char (${charClass}) must have tier 'weak'`);
      assert.deepEqual(res.criteria, expected, `Criteria breakdown failed for 1-char (${charClass})`);
    }
  });

  test('1.3 1000-character strings execute with O(n) linear performance, avoiding ReDoS or heap spikes', () => {
    // 1000-character repetitive lowercase
    const t0 = performance.now();
    const longLower = 'a'.repeat(1000);
    const resLower = calculatePasswordStrength(longLower);
    const dtLower = performance.now() - t0;

    assert.ok(dtLower < 50, `1000-char lower took ${dtLower.toFixed(2)}ms, exceeding 50ms ReDoS threshold`);
    assert.equal(resLower.criteria.minLength, true);
    assert.equal(resLower.criteria.hasLowercase, true);
    assert.equal(resLower.criteria.hasUppercase, false);
    assert.equal(resLower.criteria.hasNumber, false);
    assert.equal(resLower.criteria.hasSpecial, false);
    assert.equal(resLower.score, 2);
    assert.equal(resLower.tier, 'medium');
    assert.equal(resLower.percent, 50);

    // 1000-character diverse string (meeting all 5 criteria)
    const t1 = performance.now();
    const longDiverse = 'Aa9$'.repeat(250);
    const resDiverse = calculatePasswordStrength(longDiverse);
    const dtDiverse = performance.now() - t1;

    assert.ok(dtDiverse < 50, `1000-char diverse took ${dtDiverse.toFixed(2)}ms`);
    assert.equal(resDiverse.score, 5);
    assert.equal(resDiverse.percent, 100);
    assert.equal(resDiverse.tier, 'strong');
    assert.equal(resDiverse.label, 'Cực mạnh');
    assert.equal(resDiverse.color, '#22C55E');
  });

  test('1.4 Emojis, Unicode, Vietnamese diacritics, and spaces-separated phrases evaluate properly', () => {
    // Emojis pass special characters criteria
    const emojiPass = '🚀🔥🎉🎓⚡';
    const resEmoji = calculatePasswordStrength(emojiPass);
    assert.equal(resEmoji.criteria.hasSpecial, true);

    // Vietnamese diacritics with mixed classes
    const vnPass = 'SinhViên@ĐạiHọc2026';
    const resVn = calculatePasswordStrength(vnPass);
    assert.equal(resVn.criteria.minLength, true);
    assert.equal(resVn.criteria.hasUppercase, true);
    assert.equal(resVn.criteria.hasLowercase, true);
    assert.equal(resVn.criteria.hasNumber, true);
    assert.equal(resVn.criteria.hasSpecial, true);
    assert.equal(resVn.score, 5);
    assert.equal(resVn.tier, 'strong');

    // Space-separated phrases
    const phrase = 'Campus OS Student Pass 2026 !';
    const resPhrase = calculatePasswordStrength(phrase);
    assert.equal(resPhrase.score, 5);
    assert.equal(resPhrase.tier, 'strong');
  });

  test('1.5 All-symbols and all-numbers strings never falsely elevate to "good" or "strong"', () => {
    // All-symbols (16 chars): minLength + hasSpecial -> score 2 -> medium
    const symRes = calculatePasswordStrength('!@#$%^&*()_+=-{}');
    assert.equal(symRes.score, 2);
    assert.equal(symRes.tier, 'medium');
    assert.equal(symRes.percent, 50);
    assert.equal(symRes.criteria.minLength, true);
    assert.equal(symRes.criteria.hasSpecial, true);
    assert.equal(symRes.criteria.hasUppercase, false);
    assert.equal(symRes.criteria.hasLowercase, false);
    assert.equal(symRes.criteria.hasNumber, false);

    // All-numbers (16 chars): minLength + hasNumber -> score 2 -> medium
    const numRes = calculatePasswordStrength('1234567890123456');
    assert.equal(numRes.score, 2);
    assert.equal(numRes.tier, 'medium');
    assert.equal(numRes.percent, 50);
    assert.equal(numRes.criteria.minLength, true);
    assert.equal(numRes.criteria.hasNumber, true);
    assert.equal(numRes.criteria.hasUppercase, false);
    assert.equal(numRes.criteria.hasLowercase, false);
    assert.equal(numRes.criteria.hasSpecial, false);
  });

  test('1.6 Defensive input typing: non-string and malformed parameters return safe weak default', () => {
    const invalidTypes = [null, undefined, 12345, true, false, {}, [], () => {}];

    for (const bad of invalidTypes) {
      assert.doesNotThrow(() => {
        const res = calculatePasswordStrength(bad as unknown as string);
        assert.equal(res.score, 0);
        assert.equal(res.percent, 0);
        assert.equal(res.tier, 'weak');
      });
    }
  });
});

// ============================================================================
// ADVERSARIAL SECTION 2: isValidEduVnEmail Attack & Boundary Vectors
// ============================================================================
describe('Adversarial Stress 2: isValidEduVnEmail Attack & Boundary Vectors', () => {
  test('2.1 Valid educational emails: mixed case, trimmed spaces, nested subdomains', () => {
    const validEduCases = [
      'student@cntt.uit.edu.vn',
      'k65.clc.fit@hust.edu.vn',
      'phongdaotao@dept.vnu.edu.vn',
      '2012001@clc.fit.hcmus.edu.vn',
      'research.ai@lab.vinuni.edu.vn',
      // Mixed casing
      'STUDENT@CNTT.UIT.EDU.VN',
      'Minh.Nguyen@Campus.Edu.Vn',
      '20020123@Vnu.Edu.Vn',
      'sTuDeNt@CnTt.UiT.eDu.Vn',
      // Leading/trailing whitespace
      '  student@cntt.uit.edu.vn  ',
      '\tminh.nguyen@campus.edu.vn\n',
      '   nguyenvana@hcmut.edu.vn   ',
      // Valid RFC characters in username
      'first.middle.last@fpt.edu.vn',
      'user+testtag@uit.edu.vn',
      'student_2026@neu.edu.vn',
      'it-dept@hust.edu.vn',
    ];

    for (const email of validEduCases) {
      assert.equal(isValidEduVnEmail(email), true, `Legitimate educational email was rejected: ${email}`);
    }
  });

  test('2.2 Spoofed educational domains are strictly rejected', () => {
    const spoofedDomains = [
      'user@edu.vn.attacker.com',
      'user@campus.edu.vn.attacker.com',
      'admin@uit.edu.vn.phishing.net',
      'student@hust.edu.vn.evil-server.org',
      'user@attacker-edu.vn',
      'student@fake-edu.vn',
      'hacker@campus-edu.vn',
      'user@edu.vn@attacker.com',
      'user@victim.edu.vn.co',
      'user@victim.edu.vn.xyz',
    ];

    for (const attack of spoofedDomains) {
      assert.equal(isValidEduVnEmail(attack), false, `Spoofed domain bypassed validation: ${attack}`);
    }
  });

  test('2.3 Commercial domains and missing .vn / missing .edu domains are strictly rejected', () => {
    const nonEduDomains = [
      // Commercial domains
      'user@gmail.com',
      'user@yahoo.vn',
      'user@outlook.com',
      'user@hotmail.com',
      'user@company.com.vn',
      // Missing .vn
      'user@campus.edu',
      'user@harvard.edu',
      'user@mit.edu',
      // Missing .edu
      'user@campus.vn',
      'user@hust.vn',
      'user@uit.vn',
      'user@government.gov.vn',
      'user@ngo.org.vn',
      'user@school.ac.vn',
    ];

    for (const email of nonEduDomains) {
      assert.equal(isValidEduVnEmail(email), false, `Non-edu domain was accepted: ${email}`);
    }
  });

  test('2.4 Multiple @ signs and domain double dots are strictly rejected', () => {
    const malformed = [
      'user@@campus.edu.vn',
      'user@name@campus.edu.vn',
      'user@evil.com@campus.edu.vn',
      'user@campus..edu.vn',
      'user..name@campus.edu.vn',
      'user@.campus.edu.vn',
      'user@campus.edu.vn.',
      '@campus.edu.vn',
      'student@',
    ];

    for (const bad of malformed) {
      assert.equal(isValidEduVnEmail(bad), false, `Malformed email was accepted: ${bad}`);
    }
  });

  test('2.5 SQL Injection payloads and XSS attack strings are strictly rejected', () => {
    const injectionPayloads = [
      "' OR '1'='1'@campus.edu.vn",
      "user@campus.edu.vn' OR '1'='1",
      "'; DROP TABLE users; --@campus.edu.vn",
      "user@' OR 1=1--.edu.vn",
      "<script>alert(1)</script>@campus.edu.vn",
      "user+<script>@campus.edu.vn",
      "user@<script>.edu.vn",
      "user\0@campus.edu.vn",
    ];

    for (const payload of injectionPayloads) {
      assert.equal(isValidEduVnEmail(payload), false, `Injection payload was accepted: ${payload}`);
    }
  });

  test('2.6 RFC 5321 length limits (254 chars max) and non-string types handle safely', () => {
    // 254-character maximum allowed email
    const boundaryEmail = 'a'.repeat(240) + '@campus.edu.vn'; // 240 + 14 = 254 chars
    assert.equal(boundaryEmail.length, 254);
    assert.equal(isValidEduVnEmail(boundaryEmail), true, '254-char email should be valid');

    // 255-character email exceeding RFC length
    const tooLongEmail = 'a'.repeat(241) + '@campus.edu.vn'; // 241 + 14 = 255 chars
    assert.equal(tooLongEmail.length, 255);
    assert.equal(isValidEduVnEmail(tooLongEmail), false, '255-char email must be rejected');

    // Non-string boundary inputs
    assert.equal(isValidEduVnEmail(null as unknown as string), false);
    assert.equal(isValidEduVnEmail(undefined as unknown as string), false);
    assert.equal(isValidEduVnEmail(123456 as unknown as string), false);
    assert.equal(isValidEduVnEmail({} as unknown as string), false);
  });
});

// ============================================================================
// ADVERSARIAL SECTION 3: calculateCooldownState Cooldown Timer Calculations
// ============================================================================
describe('Adversarial Stress 3: calculateCooldownState Cooldown Timer Stress', () => {
  test('3.1 Clock skew: Future timestamps (client time behind server) clamp safely to cooldown duration', () => {
    const baseNow = 1700000000000;
    const futureOffsets = [1, 500, 1000, 15000, 60000, 3600000];

    for (const offset of futureOffsets) {
      const futureSent = baseNow + offset;
      const state = calculateCooldownState(futureSent, 60, baseNow);

      assert.equal(state.remainingSeconds, 60, `Remaining seconds for future offset ${offset}ms must clamp to 60`);
      assert.equal(state.canResend, false);
      assert.match(state.formattedLabel, /60s/);
      assert.ok(!Number.isNaN(state.remainingSeconds));
      assert.ok(state.remainingSeconds >= 0);
    }
  });

  test('3.2 Non-positive, zero, NaN, null, and negative lastSent timestamps allow immediate resend', () => {
    const invalidTimestamps = [0, -1, -50000, null, undefined, NaN];

    for (const ts of invalidTimestamps) {
      const state = calculateCooldownState(ts, 60, 1700000000000);
      assert.equal(state.remainingSeconds, 0, `Remaining seconds should be 0 for timestamp ${ts}`);
      assert.equal(state.canResend, true, `canResend should be true for timestamp ${ts}`);
      assert.equal(state.formattedLabel, 'Gửi lại mã');
    }
  });

  test('3.3 Precision boundary transitions at 59s, 59.9s, 60.0s, and 60.1s', () => {
    const now = 1700000000000;

    // 59.0s elapsed (59000ms) -> 1000ms remaining -> 1s, canResend: false
    const state59 = calculateCooldownState(now - 59000, 60, now);
    assert.equal(state59.remainingSeconds, 1);
    assert.equal(state59.canResend, false);
    assert.match(state59.formattedLabel, /\(1s\)/);

    // 59.9s elapsed (59900ms) -> 100ms remaining -> Math.ceil gives 1s, canResend: false
    const state599 = calculateCooldownState(now - 59900, 60, now);
    assert.equal(state599.remainingSeconds, 1);
    assert.equal(state599.canResend, false);

    // Exact 60.0s boundary (60000ms) -> 0ms remaining -> 0s, canResend: true
    const state60 = calculateCooldownState(now - 60000, 60, now);
    assert.equal(state60.remainingSeconds, 0);
    assert.equal(state60.canResend, true);
    assert.equal(state60.formattedLabel, 'Gửi lại mã');

    // 60.1s elapsed (60100ms) -> post-cooldown -> 0s, canResend: true
    const state601 = calculateCooldownState(now - 60100, 60, now);
    assert.equal(state601.remainingSeconds, 0);
    assert.equal(state601.canResend, true);
    assert.equal(state601.formattedLabel, 'Gửi lại mã');
  });

  test('3.4 Custom cooldown durations (30s, 120s, 0s)', () => {
    const now = 1700000000000;

    // 120s duration, 30s elapsed -> 90s remaining
    const state120 = calculateCooldownState(now - 30000, 120, now);
    assert.equal(state120.remainingSeconds, 90);
    assert.equal(state120.canResend, false);
    assert.match(state120.formattedLabel, /90s/);

    // 30s duration, 29s elapsed -> 1s remaining
    const state30 = calculateCooldownState(now - 29000, 30, now);
    assert.equal(state30.remainingSeconds, 1);
    assert.equal(state30.canResend, false);

    // 30s duration, 30s elapsed -> 0s remaining
    const state30Done = calculateCooldownState(now - 30000, 30, now);
    assert.equal(state30Done.remainingSeconds, 0);
    assert.equal(state30Done.canResend, true);

    // 0s duration -> immediate resend
    const stateZeroDuration = calculateCooldownState(now, 0, now);
    assert.equal(stateZeroDuration.remainingSeconds, 0);
    assert.equal(stateZeroDuration.canResend, true);
  });
});

// ============================================================================
// ADVERSARIAL SECTION 4: Demo Student Credentials Authentication Flow
// ============================================================================
describe('Adversarial Stress 4: Demo Student Credentials Authentication Flow', () => {
  test('4.1 Canonical DEMO_STUDENT_CREDENTIALS integrity and security constraints', () => {
    assert.equal(DEMO_STUDENT_CREDENTIALS.email, 'minh.nguyen@campus.edu.vn');
    assert.equal(DEMO_STUDENT_CREDENTIALS.password, 'Demo@123456');
    assert.equal(DEMO_STUDENT_CREDENTIALS.fullName, 'Nguyễn Nhật Minh');

    // Demo email must pass educational domain validation
    assert.equal(isValidEduVnEmail(DEMO_STUDENT_CREDENTIALS.email), true);

    // Demo password must be top-tier strong
    const strength = calculatePasswordStrength(DEMO_STUDENT_CREDENTIALS.password);
    assert.equal(strength.tier, 'strong');
    assert.equal(strength.score, 5);
    assert.equal(strength.percent, 100);
  });

  test('4.2 Offline mock authentication pipeline completes without errors and returns student role', async () => {
    const { data, error } = await signInWithEmail(
      DEMO_STUDENT_CREDENTIALS.email,
      DEMO_STUDENT_CREDENTIALS.password
    );

    assert.equal(error, null, 'signInWithEmail must not return error in offline mode');
    assert.ok(data?.user, 'User object must be present in response');
    assert.equal(data.user.email, DEMO_STUDENT_CREDENTIALS.email);
    assert.equal(data.user.role, 'student');
    assert.ok(data.session?.access_token, 'Session access token must be generated');

    const session = getOfflineMockSession(DEMO_STUDENT_CREDENTIALS.email);
    assert.equal(session.email, DEMO_STUDENT_CREDENTIALS.email);
    assert.equal(session.role, 'student');
    assert.ok(session.userId);
  });
});
