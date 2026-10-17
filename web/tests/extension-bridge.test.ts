import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_BLACKLIST_DOMAINS,
  EXEMPTION_COOLDOWN_SECONDS,
  DEFAULT_EXEMPTION_DURATION_SECONDS,
  normalizeDomain,
  isUrlBlacklisted,
  getMatchedBlacklistDomain,
  SupervisorSessionFSM,
  handleMessageRequest,
} from '../../extension/background.js';

import {
  calculateLevelAndRank,
  calculateLevelProgress,
} from '../src/lib/gamification.ts';

// Helper function implementing the -50 XP deduction contract with 0 floor
export function applyXpPenalty(currentXp: number, penalty: number = 50): {
  newXp: number;
  level: number;
  rankTitle: string;
  demoted: boolean;
} {
  const previousLevel = calculateLevelAndRank(currentXp).level;
  const newXp = Math.max(0, Math.floor(currentXp - penalty));
  const newProgression = calculateLevelAndRank(newXp);
  return {
    newXp,
    level: newProgression.level,
    rankTitle: newProgression.rankTitle,
    demoted: newProgression.level < previousLevel,
  };
}

describe('Extension Bridge & Supervisor Arbitration Suite (extension-bridge.test.ts)', () => {
  // ==========================================================================
  // TIER 1: FEATURE COVERAGE
  // ==========================================================================

  describe('Tier 1: Blacklist Domain Matching Algorithm', () => {
    test('T1.1: Matches all 14 standard blacklist domains exactly', () => {
      assert.equal(DEFAULT_BLACKLIST_DOMAINS.length, 14, 'Should contain exactly 14 default domains');

      for (const domain of DEFAULT_BLACKLIST_DOMAINS) {
        const testUrl = `https://${domain}/feed`;
        assert.equal(
          isUrlBlacklisted(testUrl),
          true,
          `Expected ${domain} to be recognized as blacklisted`
        );
        assert.equal(
          getMatchedBlacklistDomain(testUrl),
          domain,
          `Expected matched domain to be ${domain}`
        );
      }
    });

    test('T1.2: Matches multi-level subdomains for all blacklisted services', () => {
      const subdomainCases = [
        { url: 'https://m.facebook.com/messages', expected: 'facebook.com' },
        { url: 'https://touch.facebook.com/', expected: 'facebook.com' },
        { url: 'https://music.youtube.com/explore', expected: 'youtube.com' },
        { url: 'https://studio.youtube.com/channel', expected: 'youtube.com' },
        { url: 'https://v.tiktok.com/ZGJ/', expected: 'tiktok.com' },
        { url: 'https://old.reddit.com/r/programming', expected: 'reddit.com' },
        { url: 'https://np.reddit.com/r/all', expected: 'reddit.com' },
        { url: 'https://api.twitter.com/v1', expected: 'twitter.com' },
        { url: 'https://sub.discord.com/channels', expected: 'discord.com' },
      ];

      for (const { url, expected } of subdomainCases) {
        assert.equal(
          getMatchedBlacklistDomain(url),
          expected,
          `Subdomain in ${url} should match root blacklist domain ${expected}`
        );
        assert.equal(isUrlBlacklisted(url), true);
      }
    });

    test('T1.3: Educational and productivity platforms are safe and non-blacklisted', () => {
      const safeUrls = [
        'https://github.com/microsoft/vscode',
        'https://stackoverflow.com/questions/12345',
        'https://en.wikipedia.org/wiki/Computer_science',
        'https://google.com/search?q=algorithms',
        'https://notion.so/my-workspace',
        'https://coursera.org/learn/machine-learning',
        'https://developer.mozilla.org/en-US/docs/Web',
        'https://chatgpt.com/',
      ];

      for (const url of safeUrls) {
        assert.equal(
          isUrlBlacklisted(url),
          false,
          `Safe URL ${url} must NOT be blacklisted`
        );
        assert.equal(getMatchedBlacklistDomain(url), null);
      }
    });

    test('T1.4: normalizeDomain utility handles prefixes, suffixes, ports, and queries', () => {
      assert.equal(normalizeDomain('https://www.facebook.com/path?foo=bar'), 'www.facebook.com');
      assert.equal(normalizeDomain('http://m.youtube.com:8080/watch'), 'm.youtube.com');
      assert.equal(normalizeDomain('*.reddit.com'), 'reddit.com');
      assert.equal(normalizeDomain('..tiktok.com..'), 'tiktok.com');
      assert.equal(normalizeDomain('  SHOPEE.VN  '), 'shopee.vn');
      assert.equal(normalizeDomain(''), '');
      assert.equal(normalizeDomain(null), '');
    });

    test('T1.5: Custom blacklist dynamic mutation (add, remove, reset)', async () => {
      const customList = ['vnexpress.net', 'kenh14.vn'];
      assert.equal(isUrlBlacklisted('https://vnexpress.net/thoi-su', customList), true);
      assert.equal(isUrlBlacklisted('https://kenh14.vn/star.chn', customList), true);
      assert.equal(isUrlBlacklisted('https://facebook.com', customList), false);

      const addResponse = await handleMessageRequest({
        action: 'ADD_BLACKLIST_DOMAIN',
        domain: 'custom-distraction.com',
      });
      assert.equal(addResponse.status, 'OK');
      assert.ok(addResponse.blacklist.includes('custom-distraction.com'));

      const removeResponse = await handleMessageRequest({
        action: 'REMOVE_BLACKLIST_DOMAIN',
        domain: 'custom-distraction.com',
      });
      assert.equal(removeResponse.status, 'OK');
      assert.ok(!removeResponse.blacklist.includes('custom-distraction.com'));

      const resetResponse = await handleMessageRequest({ action: 'RESET_BLACKLIST' });
      assert.equal(resetResponse.status, 'OK');
      assert.equal(resetResponse.blacklist.length, 14);
    });
  });

  describe('Tier 1: Internal Exemptions & System URLs', () => {
    test('T1.6: Localhost and local IP development origins are strictly exempt', () => {
      const localUrls = [
        'http://localhost:3000/dashboard',
        'http://localhost:3000/calendar',
        'http://localhost:8080/api',
        'http://127.0.0.1:3000/tasks',
        'http://127.0.0.1:54321/storage',
      ];

      for (const url of localUrls) {
        assert.equal(
          isUrlBlacklisted(url),
          false,
          `Localhost URL ${url} must be exempted from blacklist`
        );
      }
    });

    test('T1.7: CampusOS production and staging domains are strictly exempt', () => {
      const campusUrls = [
        'https://campusos.vn',
        'https://campusos.vn/dashboard',
        'https://app.campusos.vn/focus',
        'https://staging.campusos.vn/profile',
      ];

      for (const url of campusUrls) {
        assert.equal(
          isUrlBlacklisted(url),
          false,
          `CampusOS URL ${url} must be exempted from blacklist`
        );
      }
    });

    test('T1.8: Browser internal schemes return safe null', () => {
      const systemUrls = [
        'chrome://extensions',
        'chrome://settings',
        'chrome-extension://abcdefghijklmnopqrstuvwxyz/popup.html',
        'about:blank',
        'about:config',
        'edge://extensions',
      ];

      for (const url of systemUrls) {
        assert.equal(getMatchedBlacklistDomain(url), null);
        assert.equal(isUrlBlacklisted(url), false);
      }
    });

    test('T1.9: Non-web protocols return safe null without throwing', () => {
      const nonWebUrls = [
        'file:///C:/Users/Student/Documents/assignment.pdf',
        'data:text/html,<h1>Hello</h1>',
        'javascript:void(0)',
        'blob:https://campusos.vn/1234-5678',
      ];

      for (const url of nonWebUrls) {
        assert.equal(isUrlBlacklisted(url), false);
        assert.equal(getMatchedBlacklistDomain(url), null);
      }
    });

    test('T1.10: Trailing dot FQDN notation is normalized correctly', () => {
      const fqdnUrl = 'https://youtube.com./watch?v=dQw4w9WgXcQ';
      assert.equal(isUrlBlacklisted(fqdnUrl), true);
      assert.equal(getMatchedBlacklistDomain(fqdnUrl), 'youtube.com');
    });
  });

  describe('Tier 1: Background FSM Session Lifecycle', () => {
    test('T1.11: Initial FSM state defaults to idle with 0 violations', () => {
      const fsm = new SupervisorSessionFSM();
      assert.equal(fsm.state, 'idle');
      assert.equal(fsm.isFocusing(), false);
      assert.equal(fsm.violationCount, 0);
      assert.equal(fsm.durationSeconds, 1500);
      assert.equal(fsm.remainingSeconds, 1500);
      assert.equal(fsm.startedAt, null);
    });

    test('T1.12: startFocus transitions to focusing and records start timestamp', () => {
      const fsm = new SupervisorSessionFSM();
      const session = fsm.startFocus({ durationSeconds: 1800, characterSlug: 'cat', mode: 'extreme' });

      assert.equal(fsm.state, 'focusing');
      assert.equal(fsm.isFocusing(), true);
      assert.equal(fsm.durationSeconds, 1800);
      assert.equal(fsm.characterSlug, 'cat');
      assert.equal(fsm.mode, 'extreme');
      assert.ok(fsm.startedAt !== null && fsm.startedAt > 0);
      assert.equal(fsm.violationCount, 0);
      assert.equal(session.state, 'focusing');
    });

    test('T1.13: pauseFocus preserves elapsed progress and reverts to idle', () => {
      const fsm = new SupervisorSessionFSM();
      fsm.startFocus({ durationSeconds: 1500 });

      // Simulate 500s elapsed
      fsm.startedAt = Date.now() - 500 * 1000;
      const paused = fsm.pauseFocus();

      assert.equal(fsm.state, 'idle');
      assert.equal(fsm.isFocusing(), false);
      assert.equal(fsm.startedAt, null);
      assert.ok(paused.remainingSeconds <= 1000 && paused.remainingSeconds >= 998);
    });

    test('T1.14: stopFocus resets session and restores initial duration', () => {
      const fsm = new SupervisorSessionFSM();
      fsm.startFocus({ durationSeconds: 1200 });
      fsm.registerViolation();
      assert.equal(fsm.violationCount, 1);

      const stopped = fsm.stopFocus();
      assert.equal(fsm.state, 'idle');
      assert.equal(stopped.state, 'idle');
      assert.equal(stopped.remainingSeconds, 1200);
    });

    test('T1.15: startBreak transitions to break mode and does not monitor focus', () => {
      const fsm = new SupervisorSessionFSM();
      fsm.startBreak({ durationSeconds: 300 });

      assert.equal(fsm.state, 'break');
      assert.equal(fsm.isFocusing(), false);
      assert.equal(fsm.durationSeconds, 300);
      assert.ok(fsm.startedAt !== null);
    });
  });

  describe('Tier 1: Lockout Trigger & Two-Way Message Routing', () => {
    test('T1.16: PING request returns PONG with installed version and state', async () => {
      const res = await handleMessageRequest({ action: 'PING' });
      assert.equal(res.status, 'PONG');
      assert.equal(res.installed, true);
      assert.equal(res.version, '1.0.0');
      assert.ok(typeof res.state === 'string');
    });

    test('T1.17: CHECK_URL evaluates real-time tab distraction status', async () => {
      const res1 = await handleMessageRequest({
        action: 'CHECK_URL',
        url: 'https://www.tiktok.com/@student',
      });
      assert.equal(res1.status, 'OK');
      assert.equal(res1.isBlacklisted, true);
      assert.equal(res1.domain, 'tiktok.com');

      const res2 = await handleMessageRequest({
        action: 'CHECK_URL',
        url: 'https://stackoverflow.com/questions',
      });
      assert.equal(res2.isBlacklisted, false);
      assert.equal(res2.domain, null);
    });

    test('T1.18: LOCKOUT_VIOLATION increments violation counter monotonically', async () => {
      const initial = await handleMessageRequest({ action: 'GET_POPUP_DATA' });
      const currentViolations = initial.violationCount;

      const res = await handleMessageRequest({
        action: 'LOCKOUT_VIOLATION',
        domain: 'facebook.com',
        reason: 'blacklist_url',
      });

      assert.equal(res.status, 'OK');
      assert.equal(res.violationCount, currentViolations + 1);
    });

    test('T1.19: TOGGLE_WEBCAM updates facial tracking flag in session', async () => {
      const resOff = await handleMessageRequest({ action: 'TOGGLE_WEBCAM', enabled: false });
      assert.equal(resOff.status, 'OK');
      assert.equal(resOff.webcamEnabled, false);

      const resOn = await handleMessageRequest({ action: 'TOGGLE_WEBCAM', enabled: true });
      assert.equal(resOn.status, 'OK');
      assert.equal(resOn.webcamEnabled, true);
    });

    test('T1.20: GET_POPUP_DATA returns complete snapshot for popup view', async () => {
      const data = await handleMessageRequest({ action: 'GET_POPUP_DATA' });
      assert.equal(data.status, 'OK');
      assert.ok(['idle', 'focusing', 'break'].includes(data.state));
      assert.ok(Array.isArray(data.blacklist));
      assert.ok(typeof data.violationCount === 'number');
      assert.ok(typeof data.webcamEnabled === 'boolean');
      assert.ok(data.session && typeof data.session === 'object');
    });
  });

  describe('Tier 1: Exemption 180s Cooldown & Grace Period', () => {
    test('T1.21: First exemption request grants 180s grace period', () => {
      const fsm = new SupervisorSessionFSM();
      const baseTime = 1000000;
      const res = fsm.requestExemption(DEFAULT_EXEMPTION_DURATION_SECONDS, baseTime);

      assert.equal(res.status, 'EXEMPTION_GRANTED');
      assert.equal(res.success, true);
      assert.equal(res.exemptUntil, baseTime + 180 * 1000);
      assert.equal(res.remainingSec, 180);
      assert.equal(fsm.lastExemptionAt, baseTime);
    });

    test('T1.22: isExempt accurately reflects grace period validity', () => {
      const fsm = new SupervisorSessionFSM();
      const baseTime = 1000000;
      fsm.requestExemption(180, baseTime);

      // Within grace period (+60s)
      assert.equal(fsm.isExempt(baseTime + 60 * 1000), true);
      // At boundary (+179s)
      assert.equal(fsm.isExempt(baseTime + 179 * 1000), true);
      // Expired (+181s)
      assert.equal(fsm.isExempt(baseTime + 181 * 1000), false);
    });

    test('T1.23: Consecutive exemption request within 180s cooldown is denied', () => {
      const fsm = new SupervisorSessionFSM();
      const baseTime = 2000000;
      fsm.requestExemption(180, baseTime);

      // Request again after 50 seconds (cooldown is 180s)
      const denied = fsm.requestExemption(180, baseTime + 50 * 1000);
      assert.equal(denied.status, 'EXEMPTION_DENIED');
      assert.equal(denied.success, false);
      assert.ok(denied.waitSeconds > 0);
    });

    test('T1.24: EXEMPTION_DENIED calculates exact remaining cooldown waitSeconds', () => {
      const fsm = new SupervisorSessionFSM();
      const baseTime = 5000000;
      fsm.requestExemption(180, baseTime);

      // Try 70 seconds later -> remaining should be 180 - 70 = 110 seconds
      const denied = fsm.requestExemption(180, baseTime + 70 * 1000);
      assert.equal(denied.waitSeconds, 110);
      assert.match(denied.error, /110 giây/);
    });

    test('T1.25: Exemption succeeds again after 180s cooldown elapses', () => {
      const fsm = new SupervisorSessionFSM();
      const baseTime = 10000000;
      fsm.requestExemption(180, baseTime);

      // Request after 181 seconds
      const res = fsm.requestExemption(180, baseTime + 181 * 1000);
      assert.equal(res.status, 'EXEMPTION_GRANTED');
      assert.equal(res.success, true);
    });
  });

  describe('Tier 1: -50 XP Penalty & Gamification Calculation', () => {
    test('T1.26: Standard deduction: 100 XP - 50 = 50 XP', () => {
      const result = applyXpPenalty(100, 50);
      assert.equal(result.newXp, 50);
      assert.equal(result.demoted, false);
    });

    test('T1.27: Zero XP floor clamp: 30 XP - 50 = 0 XP (never negative)', () => {
      const result = applyXpPenalty(30, 50);
      assert.equal(result.newXp, 0);
      assert.ok(result.newXp >= 0, 'XP must never drop below 0');
      assert.equal(result.level, 1);
      assert.equal(result.rankTitle, 'Tân sinh viên ngơ ngác');
    });

    test('T1.28: Exact 0 XP input: 0 XP - 50 = 0 XP', () => {
      const result = applyXpPenalty(0, 50);
      assert.equal(result.newXp, 0);
    });

    test('T1.29: Level demotion: 220 XP (Level 2) - 50 XP = 170 XP (demoted to Level 1)', () => {
      // Level 2 minXp is 200 ('Cú đêm giảng đường'). At 220 XP, user is Level 2.
      const initial = calculateLevelAndRank(220);
      assert.equal(initial.level, 2);
      assert.equal(initial.rankTitle, 'Cú đêm giảng đường');

      const penalized = applyXpPenalty(220, 50);
      assert.equal(penalized.newXp, 170);
      assert.equal(penalized.level, 1);
      assert.equal(penalized.rankTitle, 'Tân sinh viên ngơ ngác');
      assert.equal(penalized.demoted, true);
    });

    test('T1.30: Multi-violation escalation: 3 successive violations on 120 XP floor at 0', () => {
      let xp = 120;

      // Violation 1: 120 -> 70
      let res = applyXpPenalty(xp, 50);
      xp = res.newXp;
      assert.equal(xp, 70);

      // Violation 2: 70 -> 20
      res = applyXpPenalty(xp, 50);
      xp = res.newXp;
      assert.equal(xp, 20);

      // Violation 3: 20 -> 0 (clamped)
      res = applyXpPenalty(xp, 50);
      xp = res.newXp;
      assert.equal(xp, 0);
    });
  });

  // ==========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // ==========================================================================

  describe('Tier 2: Boundary & Corner Cases', () => {
    test('T2.1: Empty string, null, undefined, and non-string inputs handle cleanly', () => {
      assert.equal(isUrlBlacklisted(''), false);
      assert.equal(isUrlBlacklisted(null as any), false);
      assert.equal(isUrlBlacklisted(undefined as any), false);
      assert.equal(isUrlBlacklisted(12345 as any), false);
      assert.equal(isUrlBlacklisted({} as any), false);

      assert.equal(getMatchedBlacklistDomain(''), null);
      assert.equal(getMatchedBlacklistDomain(null as any), null);
      assert.equal(getMatchedBlacklistDomain(undefined as any), null);
    });

    test('T2.2: Malformed and whitespace URLs do not throw exceptions', () => {
      const malformedUrls = [
        '   ',
        'http://',
        'https://',
        'http:///bad_url',
        'htt ps://spaces in url',
        'http://??query_only',
        'ftp://not-supported.com',
      ];

      for (const badUrl of malformedUrls) {
        assert.doesNotThrow(() => isUrlBlacklisted(badUrl));
        assert.equal(isUrlBlacklisted(badUrl), false);
      }
    });

    test('T2.3: Complex multi-segmented subdomains resolve accurately', () => {
      const complexUrl = 'https://alpha.beta.gamma.delta.m.facebook.com/watch?v=1';
      assert.equal(isUrlBlacklisted(complexUrl), true);
      assert.equal(getMatchedBlacklistDomain(complexUrl), 'facebook.com');

      // False positive defense: A domain that ends with "facebook.com" but isn't a subdomain (e.g. notfacebook.com)
      const fakeUrl = 'https://notfacebook.com';
      assert.equal(isUrlBlacklisted(fakeUrl), false);
      assert.equal(getMatchedBlacklistDomain(fakeUrl), null);
    });

    test('T2.4: URLs with HTTP authentication credentials match correctly', () => {
      const authUrl = 'https://user:password@reddit.com/r/technology';
      assert.equal(isUrlBlacklisted(authUrl), true);
      assert.equal(getMatchedBlacklistDomain(authUrl), 'reddit.com');
    });

    test('T2.5: Rapid consecutive exemption spam handles gracefully', () => {
      const fsm = new SupervisorSessionFSM();
      const baseTime = Date.now();

      // Rapidly call 10 times in the same millisecond
      const first = fsm.requestExemption(180, baseTime);
      assert.equal(first.success, true);

      for (let i = 0; i < 9; i++) {
        const rapid = fsm.requestExemption(180, baseTime);
        assert.equal(rapid.success, false);
        assert.equal(rapid.status, 'EXEMPTION_DENIED');
      }
    });

    test('T2.6: Exact millisecond boundary for exemption cooldown expiry', () => {
      const fsm = new SupervisorSessionFSM();
      const baseTime = 1000000;
      fsm.requestExemption(180, baseTime);

      // Exactly 1ms before cooldown ends (179,999ms): Denied
      const denied = fsm.requestExemption(180, baseTime + 179999);
      assert.equal(denied.success, false);

      // Exactly at cooldown boundary (180,000ms): Granted
      const granted = fsm.requestExemption(180, baseTime + 180000);
      assert.equal(granted.success, true);
    });

    test('T2.7: Huge penalty on boundary values clamps cleanly to 0', () => {
      const res = applyXpPenalty(1, 1000);
      assert.equal(res.newXp, 0);
      assert.equal(res.level, 1);
    });
  });

  // ==========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // ==========================================================================

  describe('Tier 3: Cross-Feature Combinations', () => {
    test('T3.1: Full Lifecycle Pipeline: Focus -> Distraction -> Exemption -> Expiry -> Tab Close & Penalty', async () => {
      const fsm = new SupervisorSessionFSM();
      let studentXp = 250; // Level 2
      let simTime = 1000000;

      // 1. Web App triggers Pomodoro start
      fsm.startFocus({ durationSeconds: 1500 });
      assert.equal(fsm.isFocusing(), true);
      assert.equal(fsm.violationCount, 0);

      // 2. Student opens Facebook during focus
      const visit1 = 'https://facebook.com/feed';
      assert.equal(isUrlBlacklisted(visit1), true);
      assert.equal(fsm.isExempt(simTime), false);

      // Lockout triggered: violation incremented
      fsm.registerViolation();
      assert.equal(fsm.violationCount, 1);

      // 3. Student clicks "Tôi đang tra tài liệu"
      const exemptRes = fsm.requestExemption(180, simTime);
      assert.equal(exemptRes.success, true);
      assert.equal(fsm.isExempt(simTime), true);

      // 4. During exemption, student visits YouTube (permitted)
      const visit2 = 'https://youtube.com/watch?v=tutorial';
      assert.equal(isUrlBlacklisted(visit2), true);
      assert.equal(fsm.isExempt(simTime + 60 * 1000), true); // Still exempt

      // 5. Exemption expires after 180s
      simTime += 200 * 1000;
      assert.equal(fsm.isExempt(simTime), false);

      // 6. Student opens TikTok after exemption expired
      const visit3 = 'https://tiktok.com/@distraction';
      assert.equal(isUrlBlacklisted(visit3), true);
      assert.equal(fsm.isExempt(simTime), false);

      // Violation registered & -50 XP penalty applied
      fsm.registerViolation();
      assert.equal(fsm.violationCount, 2);

      const penaltyRes = applyXpPenalty(studentXp, 50);
      studentXp = penaltyRes.newXp;
      assert.equal(studentXp, 200);

      // 7. Session ends
      fsm.stopFocus();
      assert.equal(fsm.state, 'idle');
    });

    test('T3.2: State Interruption: Pause and Resume suppresses and restores enforcement', () => {
      const fsm = new SupervisorSessionFSM();

      // Start focus
      fsm.startFocus({ durationSeconds: 1500 });
      assert.equal(fsm.isFocusing(), true);

      // User pauses focus
      fsm.pauseFocus();
      assert.equal(fsm.isFocusing(), false);

      // Visiting blacklisted site while paused does NOT violate focus
      const url = 'https://youtube.com';
      const shouldEnforceWhilePaused = fsm.isFocusing() && !fsm.isExempt() && isUrlBlacklisted(url);
      assert.equal(shouldEnforceWhilePaused, false);

      // User resumes focus
      fsm.startFocus({ durationSeconds: fsm.remainingSeconds });
      assert.equal(fsm.isFocusing(), true);

      const shouldEnforceAfterResume = fsm.isFocusing() && !fsm.isExempt() && isUrlBlacklisted(url);
      assert.equal(shouldEnforceAfterResume, true);
    });

    test('T3.3: Break Mode Interruption: Break allows leisure without violation', () => {
      const fsm = new SupervisorSessionFSM();
      fsm.startBreak({ durationSeconds: 300 });

      assert.equal(fsm.state, 'break');
      assert.equal(fsm.isFocusing(), false);

      // During break, student watches YouTube
      const url = 'https://youtube.com/watch?v=music';
      const violates = fsm.isFocusing() && !fsm.isExempt() && isUrlBlacklisted(url);
      assert.equal(violates, false, 'Break mode must not trigger lockout violation');
    });

    test('T3.4: Dynamic Blacklist Customization during live session', () => {
      let customBlacklist = [...DEFAULT_BLACKLIST_DOMAINS];

      // Student temporarily removes reddit for homework research
      customBlacklist = customBlacklist.filter((d) => d !== 'reddit.com');
      assert.equal(isUrlBlacklisted('https://reddit.com/r/learnprogramming', customBlacklist), false);

      // Student re-adds reddit after finishing homework
      customBlacklist.push('reddit.com');
      assert.equal(isUrlBlacklisted('https://reddit.com/r/funny', customBlacklist), true);
    });
  });

  // ==========================================================================
  // TIER 4: REAL-WORLD STUDENT WORKFLOWS
  // ==========================================================================

  describe('Tier 4: Real-World Student Workflows', () => {
    test('T4.1: Study Session with permitted research and sudden distraction', () => {
      const fsm = new SupervisorSessionFSM();
      fsm.startFocus({ durationSeconds: 1500 });

      // Student workflow:
      // Step A: CampusOS Task View (Safe)
      assert.equal(isUrlBlacklisted('http://localhost:3000/tasks'), false);

      // Step B: GitHub Repository (Safe)
      assert.equal(isUrlBlacklisted('https://github.com/nodejs/node'), false);

      // Step C: StackOverflow Documentation (Safe)
      assert.equal(isUrlBlacklisted('https://stackoverflow.com/questions/54321'), false);

      // Step D: Moment of weakness: Opens Facebook
      const distractedUrl = 'https://facebook.com';
      assert.equal(isUrlBlacklisted(distractedUrl), true);
      assert.equal(fsm.isFocusing(), true);

      // Caught!
      fsm.registerViolation();
      assert.equal(fsm.violationCount, 1);
    });

    test('T4.2: Research Grace Period Workflow: Student legitimately watches video tutorial', () => {
      const fsm = new SupervisorSessionFSM();
      const startTime = 1600000000000;
      fsm.startFocus({ durationSeconds: 1500 });

      // Opens YouTube for database tutorial
      const ytUrl = 'https://www.youtube.com/watch?v=postgres-tutorial';
      assert.equal(isUrlBlacklisted(ytUrl), true);

      // Clicks "Tôi đang tra tài liệu"
      const exemption = fsm.requestExemption(180, startTime);
      assert.equal(exemption.success, true);

      // 2 minutes into tutorial (120s): Still exempt
      assert.equal(fsm.isExempt(startTime + 120 * 1000), true);

      // Finishes tutorial within 2.5 minutes (150s), returns to CampusOS
      assert.equal(isUrlBlacklisted('http://localhost:3000/dashboard'), false);

      // Zero violations occurred
      assert.equal(fsm.violationCount, 0);
    });

    test('T4.3: Gamification Penalty and Recovery Cycle', () => {
      let xp = 85;

      // Violation occurs: -50 XP
      const penalized = applyXpPenalty(xp, 50);
      xp = penalized.newXp;
      assert.equal(xp, 35);
      assert.equal(penalized.level, 1);

      // Student completes 25m focused Pomodoro (+100 XP)
      xp += 100;
      assert.equal(xp, 135);

      const progression = calculateLevelProgress(xp);
      assert.equal(progression.currentLevel, 1);
      assert.equal(progression.totalXp, 135);
      assert.ok(progression.progressPercent > 50);
    });
  });
});
