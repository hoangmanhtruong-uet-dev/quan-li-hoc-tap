/**
 * ADVERSARIAL STRESS TEST SUITE FOR MILESTONE 1
 * Targets: extension/manifest.json and extension/background.js
 *
 * Test Dimensions:
 * 1. Obscure URL formats (IPv4/IPv6, IDN homoglyphs, ports, query strings, userinfo, trailing slashes, encoded characters)
 * 2. Rapid state switching (1,000+ transitions across sub-millisecond intervals)
 * 3. High volume concurrent message dispatching (1,000+ simultaneous async messages)
 * 4. Tab update event storming & redundant penalty amplification
 * 5. Malformed payloads, prototype pollution, and boundary attacks
 */

import assert from 'node:assert/strict';
import {
  DEFAULT_BLACKLIST_DOMAINS,
  normalizeDomain,
  isUrlBlacklisted,
  getMatchedBlacklistDomain,
  SupervisorSessionFSM,
  handleMessageRequest,
  checkAndHandleTabViolation,
  sessionFsm,
  currentBlacklist
} from '../../../extension/background.js';

let passedTests = 0;
let totalTests = 0;
const findings = [];

function recordTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✔ PASS: ${name}`);
  } catch (err) {
    console.error(`  ✖ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
    findings.push({ test: name, error: err.message, stack: err.stack });
  }
}

async function recordAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✔ PASS: ${name}`);
  } catch (err) {
    console.error(`  ✖ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
    findings.push({ test: name, error: err.message, stack: err.stack });
  }
}

console.log('================================================================');
console.log('STARTING EMPIRICAL ADVERSARIAL STRESS TEST (MILESTONE 1)');
console.log('================================================================\n');

// ============================================================================
// SUITE 1: OBSCURE URL FORMATS & EVASION ATTEMPTS
// ============================================================================
console.log('--- SUITE 1: OBSCURE URL FORMATS & EVASION ATTEMPTS ---');

recordTest('1.1: Userinfo credentials in URL targeting blacklisted domain', () => {
  const url = 'https://admin:secret123@facebook.com/profile';
  assert.equal(isUrlBlacklisted(url), true, 'Should match facebook.com despite userinfo');
  assert.equal(getMatchedBlacklistDomain(url), 'facebook.com');
});

recordTest('1.2: Userinfo credentials containing blacklisted name targeting safe host', () => {
  // Attacker trick: fake userinfo `facebook.com` on safe domain
  const url = 'https://facebook.com:password@stackoverflow.com/questions';
  assert.equal(isUrlBlacklisted(url), false, 'Should evaluate stackoverflow.com and NOT blacklist');
  assert.equal(getMatchedBlacklistDomain(url), null);
});

recordTest('1.3: Obscure ports on blacklisted and safe domains', () => {
  const testCases = [
    { url: 'https://youtube.com:443/watch', expected: true, domain: 'youtube.com' },
    { url: 'https://youtube.com:8443/watch', expected: true, domain: 'youtube.com' },
    { url: 'http://facebook.com:8080/feed', expected: true, domain: 'facebook.com' },
    { url: 'https://tiktok.com:65535/live', expected: true, domain: 'tiktok.com' },
    { url: 'https://github.com:8443/repo', expected: false, domain: null },
    { url: 'http://localhost:3000/dashboard', expected: false, domain: null },
    { url: 'http://127.0.0.1:8080/api', expected: false, domain: null },
  ];

  for (const { url, expected, domain } of testCases) {
    assert.equal(isUrlBlacklisted(url), expected, `Failed for port test on ${url}`);
    assert.equal(getMatchedBlacklistDomain(url), domain);
  }
});

recordTest('1.4: Complex query strings and hash anchors containing blacklist names', () => {
  const deceptiveUrls = [
    'https://campusos.vn/search?redirect=https://facebook.com',
    'https://google.com/search?q=https://youtube.com&hl=vi',
    'https://en.wikipedia.org/wiki/Facebook#Criticism',
    'https://github.com/topics/tiktok-downloader?q=reddit.com',
    'https://developer.mozilla.org/en-US/docs/Web?ref=https://discord.com',
  ];

  for (const url of deceptiveUrls) {
    assert.equal(isUrlBlacklisted(url), false, `URL ${url} should NOT be blacklisted via query/hash`);
    assert.equal(getMatchedBlacklistDomain(url), null);
  }
});

recordTest('1.5: Trailing slashes, dots, path traversals and multi-slashes', () => {
  const variations = [
    { url: 'https://facebook.com/', expected: true },
    { url: 'https://facebook.com///', expected: true },
    { url: 'https://facebook.com/././', expected: true },
    { url: 'https://facebook.com/../', expected: true },
    { url: 'https://facebook.com./', expected: true }, // FQDN with trailing dot
    { url: 'https://m.facebook.com./watch', expected: true },
  ];

  for (const { url, expected } of variations) {
    assert.equal(isUrlBlacklisted(url), expected, `Failed for trailing/path variation ${url}`);
  }
});

recordTest('1.6: Substring lookalikes and malicious sibling domains (Evasion resistance)', () => {
  const siblings = [
    'https://notfacebook.com',
    'https://facebook.com.attacker.com',
    'https://myyoutube.com',
    'https://youtube.community',
    'https://faketiktok.com',
    'https://discord.gg.evil.com',
    'https://shopee.vn.phishing.org',
  ];

  for (const url of siblings) {
    assert.equal(isUrlBlacklisted(url), false, `Sibling/lookalike domain ${url} must NOT be false-positived`);
    assert.equal(getMatchedBlacklistDomain(url), null);
  }
});

recordTest('1.7: Deep multi-tier subdomains on blacklisted services', () => {
  const deepSubdomains = [
    'https://sub.m.touch.facebook.com/messages',
    'https://staging.gaming.youtube.com/live',
    'https://sg.v.tiktok.com/tag',
    'https://mod.old.reddit.com/r/all',
  ];

  for (const url of deepSubdomains) {
    assert.equal(isUrlBlacklisted(url), true, `Deep subdomain ${url} must match blacklist`);
    assert.ok(getMatchedBlacklistDomain(url) !== null);
  }
});

recordTest('1.8: Percent-encoded ASCII characters in hostname and path', () => {
  // WHATWG URL decodes percent-encoded host characters
  const encodedUrl = 'https://%66%61%63%65%62%6f%6f%6b%2e%63%6f%6d/feed';
  assert.equal(isUrlBlacklisted(encodedUrl), true, 'Percent-encoded hostname should be resolved and matched');
  assert.equal(getMatchedBlacklistDomain(encodedUrl), 'facebook.com');

  const encodedPath = 'https://facebook.com/%2e%2e/%2f/watch';
  assert.equal(isUrlBlacklisted(encodedPath), true);
});

recordTest('1.9: IPv4 dotted, IPv4 integer, and IPv6 address parsing', () => {
  assert.equal(isUrlBlacklisted('http://127.0.0.1:3000/'), false, '127.0.0.1 must be exempt');
  assert.equal(isUrlBlacklisted('http://localhost:3000/'), false, 'localhost must be exempt');

  // IPv6 localhost
  const ipv6Local = 'http://[::1]:3000/dashboard';
  // Default blacklist contains no IPv6, so it shouldn't match blacklist
  assert.equal(isUrlBlacklisted(ipv6Local), false);

  // IPv6 public address
  const ipv6Public = 'http://[2001:db8::1]/index.html';
  assert.equal(isUrlBlacklisted(ipv6Public), false);
});

recordTest('1.10: normalizeDomain robustness against exotic inputs', () => {
  // Test userinfo in raw domain input
  assert.equal(normalizeDomain('https://user:pass@facebook.com:8080/path?q=1'), 'user'); 
  // NOTE: normalizeDomain splits on ':' which strips credentials before host.

  assert.equal(normalizeDomain('*.YOUTUBE.COM:443'), 'youtube.com');
  assert.equal(normalizeDomain('...TIKTOK.COM...'), 'tiktok.com');
  assert.equal(normalizeDomain('  \t\n  reddit.com  \r\n '), 'reddit.com');
  // Document IPv6 bracketed format behavior:
  const ipv6Normalized = normalizeDomain('http://[::1]:8080/');
  assert.equal(ipv6Normalized, '[', 'Empirical finding: normalizeDomain truncates IPv6 address on colons');
});

recordTest('1.11: IDN / Punycode domain matching behavior', () => {
  // WHATWG URL parser converts Unicode domain to Punycode in hostname:
  // 'https://tiếngviệt.vn' -> hostname 'xn--tingvit-5t4cyc.vn'
  
  // Directly checking with Punycode in blacklist
  assert.equal(
    isUrlBlacklisted('https://tiếngviệt.vn/bai-viet', ['xn--tingvit-5t4cyc.vn']),
    true,
    'Punycode in blacklist matches Unicode URL'
  );

  // If user adds unencoded Unicode domain 'tiếngviệt.vn':
  const matchedWithUnicode = getMatchedBlacklistDomain('https://tiếngviệt.vn/', ['tiếngviệt.vn']);
  // In getMatchedBlacklistDomain, parsed.hostname is 'xn--tingvit-5t4cyc.vn', but targetDomain is 'tiếngviệt.vn'
  // Unless domain is punycode-converted, they won't match.
  assert.equal(matchedWithUnicode, null, 'Empirical finding: Unicode IDN in blacklist does not match parsed punycode hostname without Punycode normalization');
});

recordTest('1.12: Prototype pollution resistance in blacklist mutation', async () => {
  const hostileBlacklist = ['__proto__', 'constructor', 'prototype', 'toString', 'valueOf'];
  const res = await handleMessageRequest({
    action: 'UPDATE_BLACKLIST',
    blacklist: hostileBlacklist
  });

  assert.equal(res.status, 'OK');
  // Object prototype should remain unpolluted
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal({}.polluted, undefined);

  // Reset back to default
  await handleMessageRequest({ action: 'RESET_BLACKLIST' });
});

// ============================================================================
// SUITE 2: RAPID STATE SWITCHING (1,000+ SUB-MILLISECOND CYCLES)
// ============================================================================
console.log('\n--- SUITE 2: RAPID STATE SWITCHING STRESS TEST ---');

recordTest('2.1: 1,000 rapid sequential FSM state transitions preserve invariants', () => {
  const fsm = new SupervisorSessionFSM();
  const validStates = new Set(['idle', 'focusing', 'break']);

  for (let i = 0; i < 1000; i++) {
    const cycle = i % 4;
    let snapshot;
    if (cycle === 0) {
      snapshot = fsm.startFocus({ durationSeconds: 1500 + i });
    } else if (cycle === 1) {
      snapshot = fsm.pauseFocus();
    } else if (cycle === 2) {
      snapshot = fsm.startBreak({ durationSeconds: 300 });
    } else {
      snapshot = fsm.stopFocus();
    }

    assert.ok(validStates.has(fsm.state), `Invalid state at step ${i}: ${fsm.state}`);
    assert.ok(fsm.remainingSeconds >= 0, `Remaining seconds negative at step ${i}`);
    assert.ok(!Number.isNaN(fsm.remainingSeconds), `Remaining seconds NaN at step ${i}`);
    assert.ok(typeof snapshot === 'object');
  }

  assert.equal(fsm.state, 'idle');
});

recordTest('2.2: Extreme duration edge cases (0, negative, float, huge, NaN, Infinity)', () => {
  const fsm = new SupervisorSessionFSM();

  // Zero duration
  fsm.startFocus({ durationSeconds: 0 });
  assert.equal(fsm.getRemainingSeconds(), 0);

  // Negative duration: should clamp to 0 in getRemainingSeconds
  fsm.startFocus({ durationSeconds: -100 });
  assert.equal(fsm.getRemainingSeconds(), 0);

  // Huge duration
  fsm.startFocus({ durationSeconds: 999999999 });
  assert.ok(fsm.getRemainingSeconds() > 999990000);

  // Stop resets cleanly
  fsm.stopFocus();
  assert.equal(fsm.state, 'idle');
});

recordTest('2.3: Exemption spam: 1,000 sub-millisecond requests maintain single grant', () => {
  const fsm = new SupervisorSessionFSM();
  const testTime = 5000000000;

  // First request must succeed
  const initial = fsm.requestExemption(180, testTime);
  assert.equal(initial.success, true);
  assert.equal(initial.status, 'EXEMPTION_GRANTED');

  let deniedCount = 0;
  for (let i = 0; i < 999; i++) {
    const res = fsm.requestExemption(180, testTime + (i % 100)); // Within first 100ms
    if (!res.success && res.status === 'EXEMPTION_DENIED') {
      deniedCount++;
    }
  }

  assert.equal(deniedCount, 999, 'All 999 subsequent requests within cooldown must be denied');
  assert.equal(fsm.isExempt(testTime + 50 * 1000), true);
  assert.equal(fsm.isExempt(testTime + 181 * 1000), false);
});

recordTest('2.4: Exemption during idle followed by startFocus interaction', () => {
  const fsm = new SupervisorSessionFSM();
  const baseTime = 10000000;

  // Idle state
  assert.equal(fsm.state, 'idle');

  // Request exemption while idle
  const exemptRes = fsm.requestExemption(180, baseTime);
  assert.equal(exemptRes.success, true);
  assert.equal(fsm.isExempt(baseTime + 1000), true);

  // Now user starts focus 5 seconds later
  fsm.startFocus({ durationSeconds: 1500 });
  // Notice: startFocus() resets exemptUntil = 0
  assert.equal(fsm.exemptUntil, 0);
  assert.equal(fsm.isExempt(baseTime + 6000), false, 'startFocus resets active grace period');

  // If user tries to request exemption immediately, cooldown from idle request applies!
  const secondExempt = fsm.requestExemption(180, baseTime + 7000);
  assert.equal(secondExempt.status, 'EXEMPTION_DENIED');
  assert.ok(secondExempt.waitSeconds > 170);
});

// ============================================================================
// SUITE 3: HIGH VOLUME CONCURRENT MESSAGE DISPATCHING (1,000 ASYNC MESSAGES)
// ============================================================================
console.log('\n--- SUITE 3: HIGH VOLUME CONCURRENT MESSAGE DISPATCHING ---');

await recordAsyncTest('3.1: 1,000 concurrent heterogeneous messages to handleMessageRequest', async () => {
  const actions = [
    { action: 'PING' },
    { action: 'CHECK_URL', url: 'https://youtube.com/watch' },
    { action: 'CHECK_URL', url: 'https://github.com' },
    { action: 'SYNC_STATE' },
    { action: 'GET_STATE' },
    { action: 'GET_POPUP_DATA' },
    { action: 'TOGGLE_WEBCAM', enabled: true },
    { action: 'TOGGLE_WEBCAM', enabled: false },
    { action: 'UNKNOWN_OP', foo: 'bar' },
  ];

  const promises = [];
  for (let i = 0; i < 1000; i++) {
    const msg = actions[i % actions.length];
    promises.push(handleMessageRequest(msg));
  }

  const results = await Promise.all(promises);
  assert.equal(results.length, 1000);

  // Verify all responses have a valid status
  for (const res of results) {
    assert.ok(typeof res === 'object');
    assert.ok(['PONG', 'OK', 'UNKNOWN_ACTION'].includes(res.status), `Unexpected status: ${res.status}`);
  }
});

await recordAsyncTest('3.2: Concurrent mutation stress (start/pause/stop/break interleaved)', async () => {
  const mutationActions = [
    { action: 'START_FOCUS', durationSeconds: 1500 },
    { action: 'PAUSE_FOCUS' },
    { action: 'START_BREAK', durationSeconds: 300 },
    { action: 'STOP_FOCUS' },
  ];

  const promises = [];
  for (let i = 0; i < 200; i++) {
    const msg = mutationActions[i % mutationActions.length];
    promises.push(handleMessageRequest(msg));
  }

  const results = await Promise.all(promises);
  assert.equal(results.length, 200);

  // Final check: state must still be valid
  const finalState = await handleMessageRequest({ action: 'GET_STATE' });
  assert.ok(['idle', 'focusing', 'break'].includes(finalState.state));
});

await recordAsyncTest('3.3: Malformed & adversarial message payloads resilience', async () => {
  const hostilePayloads = [
    null,
    undefined,
    12345,
    'a plain string',
    [],
    true,
    false,
    {},
    { action: '' },
    { action: null },
    { action: undefined },
    { action: 99999 },
    { action: '__proto__' },
    { action: 'constructor' },
    { action: 'START_FOCUS', durationSeconds: 'invalid' },
    { action: 'UPDATE_BLACKLIST', blacklist: 'not-an-array' },
    { action: 'UPDATE_BLACKLIST', blacklist: [null, undefined, 123, {}, 'youtube.com'] },
    { action: 'ADD_BLACKLIST_DOMAIN', domain: null },
    { action: 'ADD_BLACKLIST_DOMAIN', domain: {} },
    { action: 'REMOVE_BLACKLIST_DOMAIN', domain: undefined },
  ];

  for (const payload of hostilePayloads) {
    const res = await handleMessageRequest(payload);
    assert.ok(typeof res === 'object', `Response must be an object for payload ${JSON.stringify(payload)}`);
    assert.ok(
      res.status === 'ERROR' || res.status === 'UNKNOWN_ACTION' || res.status === 'OK',
      `Unexpected response status ${res.status} for payload`
    );
  }
});

// ============================================================================
// SUITE 4: TAB EVENT LISTENER AUDIT & REDUNDANT VIOLATION ANALYSIS
// ============================================================================
console.log('\n--- SUITE 4: TAB EVENT LISTENER AUDIT & REDUNDANT VIOLATION ANALYSIS ---');

await recordAsyncTest('4.1: Simulated navigation event storming on checkAndHandleTabViolation', async () => {
  // Reset FSM to focusing state
  sessionFsm.startFocus({ durationSeconds: 1500 });
  const startViolationCount = sessionFsm.violationCount; // 0

  // Simulate what Chromium does when user opens a tab or types a URL in omnibox:
  // 1. chrome.tabs.onActivated (tab becomes active)
  // 2. chrome.tabs.onUpdated with { status: 'loading' }
  // 3. chrome.tabs.onUpdated with { title: 'YouTube' }
  // 4. chrome.tabs.onUpdated with { favIconUrl: '...' }
  // 5. chrome.tabs.onUpdated with { status: 'complete' }

  const tabMock = {
    id: 9999,
    url: 'https://www.youtube.com/watch?v=distraction',
    windowId: 1
  };

  // Event 1: onActivated
  await checkAndHandleTabViolation(tabMock);
  const countAfterActivate = sessionFsm.violationCount;

  // Event 2: onUpdated status loading
  await checkAndHandleTabViolation(tabMock);
  const countAfterLoading = sessionFsm.violationCount;

  // Event 3: onUpdated title change
  await checkAndHandleTabViolation(tabMock);
  const countAfterTitle = sessionFsm.violationCount;

  // Event 4: onUpdated favIconUrl
  await checkAndHandleTabViolation(tabMock);
  const countAfterFavicon = sessionFsm.violationCount;

  // Event 5: onUpdated status complete
  await checkAndHandleTabViolation(tabMock);
  const countAfterComplete = sessionFsm.violationCount;

  console.log(`    [Empirical Observation]: A single page visit firing 5 Chromium tab events produced:`);
  console.log(`      - Initial count: ${startViolationCount}`);
  console.log(`      - After onActivated: ${countAfterActivate}`);
  console.log(`      - After status: loading: ${countAfterLoading}`);
  console.log(`      - After title update: ${countAfterTitle}`);
  console.log(`      - After favicon update: ${countAfterFavicon}`);
  console.log(`      - After status: complete: ${countAfterComplete}`);
  console.log(`      - Total violations registered: ${countAfterComplete - startViolationCount}`);
  console.log(`      - Resulting XP penalty: ${(countAfterComplete - startViolationCount) * 50} XP`);

  assert.ok(countAfterComplete > startViolationCount);
});

// ============================================================================
// SUITE 5: MANIFEST V3 SPECIFICATION & PERMISSION ATTACK SURFACE
// ============================================================================
console.log('\n--- SUITE 5: MANIFEST V3 SPECIFICATION INTEGRITY ---');

import fs from 'node:fs';
import path from 'node:path';

recordTest('5.1: manifest.json MV3 schema & security restrictions', () => {
  const manifestPath = path.resolve(import.meta.dirname, '../../../extension/manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist physically');

  const raw = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);

  assert.equal(manifest.manifest_version, 3, 'Must be MV3');
  assert.ok(Array.isArray(manifest.permissions), 'Permissions must be an array');
  
  // Must NOT include dangerous permissions that trigger store rejection
  assert.ok(!manifest.permissions.includes('debugger'), 'Must not have debugger permission');
  assert.ok(!manifest.permissions.includes('webRequestBlocking'), 'Must not use MV2 blocking API');
  
  // Check externally_connectable security: must NOT match *://*/*
  const matches = manifest.externally_connectable?.matches || [];
  assert.ok(!matches.includes('*://*/*'), 'externally_connectable must not allow arbitrary websites');
  assert.ok(!matches.includes('<all_urls>'), 'externally_connectable must not allow all urls');
  assert.ok(matches.some((m) => m.includes('localhost:3000')), 'Must include localhost:3000');
  assert.ok(matches.some((m) => m.includes('campusos.vn')), 'Must include campusos.vn');

  // Verify background worker config
  assert.equal(manifest.background?.service_worker, 'background.js');
  assert.equal(manifest.background?.type, 'module');
});

// Clean up FSM back to idle
sessionFsm.stopFocus();

console.log('\n================================================================');
console.log(`STRESS TEST EXECUTION COMPLETED: ${passedTests}/${totalTests} TESTS PASSED`);
if (findings.length > 0) {
  console.log(`TOTAL FAILURES / ISSUES: ${findings.length}`);
} else {
  console.log('ALL EMPIRICAL ADVERSARIAL STRESS TEST CASES EXECUTED WITH 0 EXCEPTIONS');
}
console.log('================================================================\n');
