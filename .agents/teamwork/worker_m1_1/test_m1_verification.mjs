import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_BLACKLIST_DOMAINS,
  STORAGE_KEYS,
  EXEMPTION_COOLDOWN_SECONDS,
  DEFAULT_EXEMPTION_DURATION_SECONDS,
  normalizeDomain,
  isUrlBlacklisted,
  getMatchedBlacklistDomain,
  SupervisorSessionFSM,
  handleMessageRequest
} from '../../../extension/background.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');

test('Manifest V3: Syntax and Required Fields Compliance', () => {
  const manifestPath = path.join(ROOT_DIR, 'extension', 'manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');

  const raw = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);

  // 1. Manifest version
  assert.equal(manifest.manifest_version, 3, 'Must be Manifest V3');

  // 2. Name & Version
  assert.equal(manifest.name, 'AI Giám Sát Học Tập Cực Đoan (CampusOS)');
  assert.equal(manifest.version, '1.0.0');

  // 3. Permissions
  const expectedPermissions = ['tabs', 'storage', 'activeTab', 'scripting', 'declarativeNetRequest'];
  for (const perm of expectedPermissions) {
    assert.ok(manifest.permissions.includes(perm), `Missing permission: ${perm}`);
  }

  // 4. Host permissions
  assert.deepEqual(manifest.host_permissions, ['<all_urls>']);

  // 5. externally_connectable
  assert.ok(manifest.externally_connectable, 'externally_connectable must be defined');
  const expectedMatches = [
    'http://localhost:3000/*',
    'http://127.0.0.1:3000/*',
    'https://*.campusos.vn/*',
    'https://campusos.vn/*'
  ];
  assert.deepEqual(manifest.externally_connectable.matches, expectedMatches);

  // 6. Background Service Worker
  assert.ok(manifest.background, 'background must be defined');
  assert.equal(manifest.background.service_worker, 'background.js');
  assert.equal(manifest.background.type, 'module');

  // 7. Action popup
  assert.ok(manifest.action, 'action must be defined');
  assert.equal(manifest.action.default_popup, 'popup/popup.html');

  // 8. Content scripts
  assert.ok(Array.isArray(manifest.content_scripts), 'content_scripts must be an array');
  assert.ok(manifest.content_scripts.length > 0, 'content_scripts must not be empty');
  assert.deepEqual(manifest.content_scripts[0].matches, ['<all_urls>']);
  assert.deepEqual(manifest.content_scripts[0].js, ['content.js']);
  assert.equal(manifest.content_scripts[0].run_at, 'document_end');

  // 9. Web accessible resources
  assert.ok(Array.isArray(manifest.web_accessible_resources));
  const war = manifest.web_accessible_resources[0];
  assert.ok(war.resources.includes('assets/*') || war.resources.includes('assets/fat-orange-cat.png'));
  assert.deepEqual(war.matches, ['<all_urls>']);
});

test('Blacklist Domains: Contains all 14 mandatory domains', () => {
  const required14 = [
    'facebook.com',
    'youtube.com',
    'tiktok.com',
    'twitter.com',
    'x.com',
    'instagram.com',
    'netflix.com',
    'bilibili.com',
    'shopee.vn',
    'reddit.com',
    'threads.net',
    'twitch.tv',
    'discord.com',
    'lazada.vn'
  ];

  assert.equal(DEFAULT_BLACKLIST_DOMAINS.length, 14, 'Must have exactly 14 default domains');
  for (const domain of required14) {
    assert.ok(DEFAULT_BLACKLIST_DOMAINS.includes(domain), `Missing default domain: ${domain}`);
  }
});

test('Domain Normalization: normalizeDomain works accurately', () => {
  assert.equal(normalizeDomain('https://m.facebook.com/profile?id=1'), 'm.facebook.com');
  assert.equal(normalizeDomain('http://www.youtube.com:8080/watch?v=xyz'), 'www.youtube.com');
  assert.equal(normalizeDomain('*.tiktok.com/'), 'tiktok.com');
  assert.equal(normalizeDomain('..shopee.vn...'), 'shopee.vn');
  assert.equal(normalizeDomain(''), '');
  assert.equal(normalizeDomain(null), '');
});

test('URL Blacklist Matcher: Exact domains and subdomains', () => {
  // Exact domain matches
  assert.equal(isUrlBlacklisted('https://facebook.com/'), true);
  assert.equal(isUrlBlacklisted('http://youtube.com/watch?v=123'), true);
  assert.equal(isUrlBlacklisted('https://tiktok.com/@user'), true);
  assert.equal(isUrlBlacklisted('https://twitter.com/home'), true);
  assert.equal(isUrlBlacklisted('https://x.com/explore'), true);
  assert.equal(isUrlBlacklisted('https://instagram.com/direct'), true);
  assert.equal(isUrlBlacklisted('https://netflix.com/browse'), true);
  assert.equal(isUrlBlacklisted('https://bilibili.com/video'), true);
  assert.equal(isUrlBlacklisted('https://shopee.vn/flash_sale'), true);
  assert.equal(isUrlBlacklisted('https://reddit.com/r/all'), true);
  assert.equal(isUrlBlacklisted('https://threads.net/'), true);
  assert.equal(isUrlBlacklisted('https://twitch.tv/directory'), true);
  assert.equal(isUrlBlacklisted('https://discord.com/channels'), true);
  assert.equal(isUrlBlacklisted('https://lazada.vn/products'), true);

  // Subdomains
  assert.equal(isUrlBlacklisted('https://m.facebook.com/story.php'), true);
  assert.equal(isUrlBlacklisted('https://touch.facebook.com/'), true);
  assert.equal(isUrlBlacklisted('https://www.youtube.com/feed/trending'), true);
  assert.equal(isUrlBlacklisted('https://gaming.youtube.com/'), true);
  assert.equal(isUrlBlacklisted('https://sub.threads.net/post'), true);
  assert.equal(isUrlBlacklisted('https://vn.shopee.vn/item'), true);

  // Matched domain return
  assert.equal(getMatchedBlacklistDomain('https://m.facebook.com/'), 'facebook.com');
  assert.equal(getMatchedBlacklistDomain('https://gaming.youtube.com/watch'), 'youtube.com');
});

test('URL Blacklist Matcher: Exemptions for CampusOS and system URLs', () => {
  // Localhost & 127.0.0.1
  assert.equal(isUrlBlacklisted('http://localhost:3000/dashboard'), false);
  assert.equal(isUrlBlacklisted('http://localhost:3000/tasks'), false);
  assert.equal(isUrlBlacklisted('http://127.0.0.1:3000/calendar'), false);

  // CampusOS production and subdomains
  assert.equal(isUrlBlacklisted('https://campusos.vn/dashboard'), false);
  assert.equal(isUrlBlacklisted('https://app.campusos.vn/pomodoro'), false);
  assert.equal(isUrlBlacklisted('https://dev.campusos.vn/workspaces'), false);

  // Non-blacklisted study/research websites
  assert.equal(isUrlBlacklisted('https://google.com/search?q=calculus'), false);
  assert.equal(isUrlBlacklisted('https://wikipedia.org/wiki/Algorithm'), false);
  assert.equal(isUrlBlacklisted('https://github.com/torvalds/linux'), false);
  assert.equal(isUrlBlacklisted('https://stackoverflow.com/questions'), false);

  // System & internal URLs
  assert.equal(isUrlBlacklisted('chrome://extensions/'), false);
  assert.equal(isUrlBlacklisted('chrome-extension://abcdef/popup.html'), false);
  assert.equal(isUrlBlacklisted('about:blank'), false);
  assert.equal(isUrlBlacklisted('edge://settings'), false);
  assert.equal(isUrlBlacklisted('file:///C:/Users/test.pdf'), false);
  assert.equal(isUrlBlacklisted('invalid-url-string'), false);
  assert.equal(isUrlBlacklisted(''), false);
  assert.equal(isUrlBlacklisted(null), false);
});

test('SupervisorSessionFSM: Lifecycle and state transitions', () => {
  const fsm = new SupervisorSessionFSM();

  assert.equal(fsm.state, 'idle');
  assert.equal(fsm.isFocusing(), false);
  assert.equal(fsm.violationCount, 0);

  // Start focus
  const started = fsm.startFocus({ durationSeconds: 1500, characterSlug: 'cat', mode: 'extreme' });
  assert.equal(fsm.state, 'focusing');
  assert.equal(fsm.isFocusing(), true);
  assert.equal(fsm.durationSeconds, 1500);
  assert.equal(fsm.characterSlug, 'cat');
  assert.equal(fsm.mode, 'extreme');
  assert.ok(fsm.startedAt > 0);

  // Violations
  assert.equal(fsm.registerViolation(), 1);
  assert.equal(fsm.registerViolation(), 2);
  assert.equal(fsm.violationCount, 2);

  // Pause
  fsm.pauseFocus();
  assert.equal(fsm.state, 'idle');
  assert.equal(fsm.isFocusing(), false);

  // Start break
  fsm.startBreak({ durationSeconds: 300 });
  assert.equal(fsm.state, 'break');
  assert.equal(fsm.durationSeconds, 300);

  // Stop
  fsm.stopFocus();
  assert.equal(fsm.state, 'idle');
});

test('SupervisorSessionFSM: Exemption management and 180s cooldown enforcement', () => {
  const fsm = new SupervisorSessionFSM();
  const baseTime = 1700000000000;

  // First exemption request: should be GRANTED
  const res1 = fsm.requestExemption(180, baseTime);
  assert.equal(res1.status, 'EXEMPTION_GRANTED');
  assert.equal(res1.success, true);
  assert.equal(res1.exemptUntil, baseTime + 180000);
  assert.equal(fsm.isExempt(baseTime + 50000), true);

  // Second exemption request after 60s (within 180s cooldown): should be DENIED
  const res2 = fsm.requestExemption(180, baseTime + 60000);
  assert.equal(res2.status, 'EXEMPTION_DENIED');
  assert.equal(res2.success, false);
  assert.equal(res2.waitSeconds, 120);

  // Third exemption request after 181s (cooldown expired): should be GRANTED
  const res3 = fsm.requestExemption(180, baseTime + 181000);
  assert.equal(res3.status, 'EXEMPTION_GRANTED');
  assert.equal(res3.success, true);
  assert.equal(res3.exemptUntil, baseTime + 181000 + 180000);
});

test('handleMessageRequest: External & Internal Message Protocol', async () => {
  // PING
  const pingRes = await handleMessageRequest({ action: 'PING' });
  assert.equal(pingRes.status, 'PONG');
  assert.equal(pingRes.installed, true);
  assert.equal(pingRes.version, '1.0.0');

  // START_FOCUS
  const startRes = await handleMessageRequest({
    action: 'START_FOCUS',
    durationSeconds: 1200,
    characterSlug: 'tom',
    mode: 'extreme'
  });
  assert.equal(startRes.status, 'OK');
  assert.equal(startRes.state, 'focusing');
  assert.equal(startRes.session.durationSeconds, 1200);

  // CHECK_URL
  const checkRes1 = await handleMessageRequest({ action: 'CHECK_URL', url: 'https://youtube.com/watch' });
  assert.equal(checkRes1.isBlacklisted, true);
  assert.equal(checkRes1.domain, 'youtube.com');
  assert.equal(checkRes1.isFocusing, true);

  const checkRes2 = await handleMessageRequest({ action: 'CHECK_URL', url: 'http://localhost:3000/dashboard' });
  assert.equal(checkRes2.isBlacklisted, false);

  // SYNC_STATE
  const syncRes = await handleMessageRequest({ action: 'SYNC_STATE' });
  assert.equal(syncRes.status, 'OK');
  assert.equal(syncRes.state, 'focusing');
  assert.ok(Array.isArray(syncRes.blacklist));

  // LOCKOUT_VIOLATION
  const vioRes = await handleMessageRequest({ action: 'LOCKOUT_VIOLATION', domain: 'youtube.com' });
  assert.equal(vioRes.status, 'OK');
  assert.ok(vioRes.violationCount >= 1);

  // PAUSE_FOCUS
  const pauseRes = await handleMessageRequest({ action: 'PAUSE_FOCUS' });
  assert.equal(pauseRes.status, 'OK');
  assert.equal(pauseRes.state, 'idle');

  // STOP_FOCUS
  const stopRes = await handleMessageRequest({ action: 'STOP_FOCUS' });
  assert.equal(stopRes.status, 'OK');
  assert.equal(stopRes.state, 'idle');

  // BLACKLIST OPERATIONS
  await handleMessageRequest({ action: 'ADD_BLACKLIST_DOMAIN', domain: 'game.com' });
  const checkCustom = await handleMessageRequest({ action: 'CHECK_URL', url: 'https://sub.game.com/play' });
  assert.equal(checkCustom.isBlacklisted, true);

  await handleMessageRequest({ action: 'REMOVE_BLACKLIST_DOMAIN', domain: 'game.com' });
  const checkRemoved = await handleMessageRequest({ action: 'CHECK_URL', url: 'https://sub.game.com/play' });
  assert.equal(checkRemoved.isBlacklisted, false);

  // RESET_BLACKLIST
  const resetRes = await handleMessageRequest({ action: 'RESET_BLACKLIST' });
  assert.equal(resetRes.blacklist.length, 14);

  // TOGGLE_WEBCAM
  const toggleRes = await handleMessageRequest({ action: 'TOGGLE_WEBCAM', enabled: false });
  assert.equal(toggleRes.webcamEnabled, false);

  // UNKNOWN ACTION
  const unknownRes = await handleMessageRequest({ action: 'NON_EXISTENT_ACTION' });
  assert.equal(unknownRes.status, 'UNKNOWN_ACTION');
});
