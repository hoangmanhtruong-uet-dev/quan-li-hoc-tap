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
} from '../../../extension/background.js';

describe('FORENSIC AUDITOR ADVERSARIAL STRESS TEST SUITE', () => {
  describe('Adversarial Test 1: URL Matching, Spoofing & Lookalike Attacks', () => {
    test('Lookalike domain attacks (e.g. evil.com with target as subdomain or path)', () => {
      // Attacker hosts on evil.com with facebook.com as subdomain
      assert.equal(isUrlBlacklisted('https://facebook.com.evil.com'), false);
      assert.equal(getMatchedBlacklistDomain('https://facebook.com.evil.com'), null);

      // Attacker has target in path
      assert.equal(isUrlBlacklisted('https://clean-site.org/facebook.com/login'), false);
      assert.equal(getMatchedBlacklistDomain('https://clean-site.org/facebook.com/login'), null);

      // Prefix lookalike
      assert.equal(isUrlBlacklisted('https://notfacebook.com'), false);
      assert.equal(isUrlBlacklisted('https://myoutube.com'), false);
      assert.equal(isUrlBlacklisted('https://fake-tiktok.com'), false);
    });

    test('Decoy URL in query parameters', () => {
      // Safe educational site redirecting to or mentioning facebook in query
      const safeWithQuery = 'https://github.com/login?redirect=https://facebook.com';
      assert.equal(isUrlBlacklisted(safeWithQuery), false);
      assert.equal(getMatchedBlacklistDomain(safeWithQuery), null);

      // Distraction site mentioning safe site in query
      const distractedWithQuery = 'https://facebook.com/sharer.php?u=https://campusos.vn';
      assert.equal(isUrlBlacklisted(distractedWithQuery), true);
      assert.equal(getMatchedBlacklistDomain(distractedWithQuery), 'facebook.com');
    });

    test('Case sensitivity and uppercase schemes/hosts', () => {
      assert.equal(isUrlBlacklisted('HTTPS://WWW.TIKTOK.COM/EXPLORE'), true);
      assert.equal(getMatchedBlacklistDomain('HTTPS://WWW.TIKTOK.COM/EXPLORE'), 'tiktok.com');
      assert.equal(isUrlBlacklisted('HTTP://M.YOUTUBE.COM:8080/WATCH?V=123'), true);
    });

    test('CampusOS domain exemption spoofing resistance', () => {
      // Legit exemptions
      assert.equal(isUrlBlacklisted('http://localhost:3000/dashboard'), false);
      assert.equal(isUrlBlacklisted('http://127.0.0.1:3000/calendar'), false);
      assert.equal(isUrlBlacklisted('https://campusos.vn/tasks'), false);
      assert.equal(isUrlBlacklisted('https://app.campusos.vn/focus'), false);
      assert.equal(isUrlBlacklisted('https://sub.domain.campusos.vn/'), false);

      // Spoofed campusos host
      assert.equal(getMatchedBlacklistDomain('https://campusos.vn.attacker.com'), null); // not in blacklist anyway
    });

    test('Extreme malformed input robustness', () => {
      const edgeInputs = [
        null,
        undefined,
        '',
        '   ',
        12345,
        {},
        [],
        'http://',
        'https://',
        'htt ps://spaces',
        'http://[::1]:3000',
        'javascript:alert(1)',
        'data:text/html,<div>Test</div>',
        'file:///C:/autoexec.bat',
        'about:blank',
        'blob:http://localhost:3000/uuid',
      ];

      for (const input of edgeInputs) {
        assert.doesNotThrow(() => isUrlBlacklisted(input));
        assert.equal(isUrlBlacklisted(input), false);
        assert.doesNotThrow(() => getMatchedBlacklistDomain(input));
        assert.equal(getMatchedBlacklistDomain(input), null);
      }
    });

    test('normalizeDomain handles all edge cases without throwing', () => {
      assert.equal(normalizeDomain(null), '');
      assert.equal(normalizeDomain(undefined), '');
      assert.equal(normalizeDomain(''), '');
      assert.equal(normalizeDomain('   '), '');
      assert.equal(normalizeDomain('HTTPS://WWW.TIKTOK.COM/PATH?FOO=BAR#HASH'), 'www.tiktok.com');
      assert.equal(normalizeDomain('*.example.com'), 'example.com');
      assert.equal(normalizeDomain('...example.com...'), 'example.com');
      assert.equal(normalizeDomain('localhost:3000'), 'localhost');
    });
  });

  describe('Adversarial Test 2: FSM Timing, Overflow & Countdown Math', () => {
    test('getRemainingSeconds() never returns negative numbers even on extreme elapsed time', () => {
      const fsm = new SupervisorSessionFSM();
      fsm.startFocus({ durationSeconds: 60 });
      // Simulate 10 days elapsed
      fsm.startedAt = Date.now() - 864000 * 1000;
      const rem = fsm.getRemainingSeconds();
      assert.equal(rem, 0);
      assert.ok(rem >= 0, 'Remaining seconds must be clamped at 0');
    });

    test('pauseFocus() called when already idle does not corrupt remainingSeconds', () => {
      const fsm = new SupervisorSessionFSM();
      assert.equal(fsm.state, 'idle');
      fsm.remainingSeconds = 1200;
      fsm.pauseFocus();
      assert.equal(fsm.state, 'idle');
      assert.equal(fsm.remainingSeconds, 1200);
    });

    test('stopFocus() resets duration to initial configured duration', () => {
      const fsm = new SupervisorSessionFSM();
      fsm.startFocus({ durationSeconds: 1800 });
      fsm.startedAt = Date.now() - 500 * 1000;
      fsm.stopFocus();
      assert.equal(fsm.state, 'idle');
      assert.equal(fsm.startedAt, null);
      assert.equal(fsm.remainingSeconds, 1800);
    });

    test('registerViolation increments monotonically without upper cap issue', () => {
      const fsm = new SupervisorSessionFSM();
      for (let i = 1; i <= 25; i++) {
        const v = fsm.registerViolation();
        assert.equal(v, i);
      }
      assert.equal(fsm.violationCount, 25);
    });
  });

  describe('Adversarial Test 3: Exemption Cooldown Sub-Millisecond & Boundary Enforcement', () => {
    test('Cooldown exact millisecond evaluation', () => {
      const fsm = new SupervisorSessionFSM();
      const t0 = 1000000;
      const first = fsm.requestExemption(180, t0);
      assert.equal(first.success, true);
      assert.equal(first.status, 'EXEMPTION_GRANTED');
      assert.equal(first.exemptUntil, t0 + 180000);

      // t0 + 179,999 ms: 1 millisecond before cooldown expiry -> MUST BE DENIED
      const edgeDenied = fsm.requestExemption(180, t0 + 179999);
      assert.equal(edgeDenied.success, false);
      assert.equal(edgeDenied.status, 'EXEMPTION_DENIED');
      assert.equal(edgeDenied.waitSeconds, 1);

      // t0 + 180,000 ms: exactly at cooldown expiry -> MUST BE GRANTED
      const edgeGranted = fsm.requestExemption(180, t0 + 180000);
      assert.equal(edgeGranted.success, true);
      assert.equal(edgeGranted.status, 'EXEMPTION_GRANTED');
    });

    test('isExempt boundary evaluation', () => {
      const fsm = new SupervisorSessionFSM();
      const t0 = 5000000;
      fsm.requestExemption(60, t0); // 60s exemption
      assert.equal(fsm.exemptUntil, t0 + 60000);

      assert.equal(fsm.isExempt(t0 + 59999), true);
      assert.equal(fsm.isExempt(t0 + 60000), false);
      assert.equal(fsm.isExempt(t0 + 60001), false);
    });
  });

  describe('Adversarial Test 4: Message Router Boundary & Malformed Payloads', () => {
    test('handleMessageRequest rejects non-object or invalid payloads', async () => {
      const resNull = await handleMessageRequest(null);
      assert.equal(resNull.status, 'ERROR');

      const resStr = await handleMessageRequest('INVALID_STRING');
      assert.equal(resStr.status, 'ERROR');

      const resUnknown = await handleMessageRequest({ action: 'NON_EXISTENT_ACTION' });
      assert.equal(resUnknown.status, 'UNKNOWN_ACTION');
    });

    test('handleMessageRequest UPDATE_BLACKLIST ignores invalid items and preserves valid', async () => {
      const res = await handleMessageRequest({
        action: 'UPDATE_BLACKLIST',
        blacklist: ['https://bilibili.com/anime', '   ', null, 'twitch.tv:443']
      });
      assert.equal(res.status, 'OK');
      assert.ok(res.blacklist.includes('bilibili.com'));
      assert.ok(res.blacklist.includes('twitch.tv'));
      assert.ok(!res.blacklist.includes(''));
    });
  });
});
