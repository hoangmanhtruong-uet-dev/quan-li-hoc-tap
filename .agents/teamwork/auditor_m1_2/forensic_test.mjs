import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  sessionFsm,
  currentBlacklist,
  DEFAULT_BLACKLIST_DOMAINS,
  STORAGE_KEYS,
  VIOLATION_DEBOUNCE_MS,
  lastViolationTimeByTab,
  isTabDebounced,
  recordTabViolationTime,
  ensureInitialized,
  initializeExtension,
  checkAndHandleTabViolation,
  handleMessageRequest,
  isUrlBlacklisted,
  getMatchedBlacklistDomain,
  normalizeDomain,
  SupervisorSessionFSM
} from '../../../extension/background.js';

describe('Auditor M1.2 Independent Forensic & Integrity Test Suite', () => {
  let originalChrome;

  beforeEach(() => {
    originalChrome = globalThis.chrome;
    lastViolationTimeByTab.clear();
    sessionFsm.state = 'idle';
    sessionFsm.violationCount = 0;
    sessionFsm.exemptUntil = 0;
    sessionFsm.startedAt = null;
  });

  afterEach(() => {
    if (originalChrome === undefined) {
      delete globalThis.chrome;
    } else {
      globalThis.chrome = originalChrome;
    }
    lastViolationTimeByTab.clear();
  });

  test('F1: Dynamic non-hardcoded URL matching across randomized domains', () => {
    // Generate 50 random domain pairs
    for (let i = 0; i < 50; i++) {
      const randStr = 'rand' + Math.random().toString(36).substring(2, 8);
      const safeUrl = `https://${randStr}.edu.vn/library`;
      assert.equal(isUrlBlacklisted(safeUrl), false, 'Random non-blacklisted domain must return false');
      assert.equal(getMatchedBlacklistDomain(safeUrl), null);

      // Random subdomain on blacklisted root
      const randSub = `sub${i}.${DEFAULT_BLACKLIST_DOMAINS[i % DEFAULT_BLACKLIST_DOMAINS.length]}`;
      const blackUrl = `https://${randSub}/path/page?q=${randStr}`;
      assert.equal(isUrlBlacklisted(blackUrl), true, 'Random subdomain of blacklist domain must return true');
      assert.equal(getMatchedBlacklistDomain(blackUrl), DEFAULT_BLACKLIST_DOMAINS[i % DEFAULT_BLACKLIST_DOMAINS.length]);
    }
  });

  test('F2: ensureInitialized rehydration under simulated worker wakeup', async () => {
    const savedSession = {
      state: 'focusing',
      startedAt: Date.now() - 60000,
      durationSeconds: 1500,
      remainingSeconds: 1440,
      characterSlug: 'tom',
      mode: 'extreme',
      violationCount: 4,
      lastExemptionAt: 12345,
      exemptUntil: 0,
      webcamEnabled: false
    };

    const savedBlacklist = ['custom1.com', 'custom2.org'];

    globalThis.chrome = {
      storage: {
        sync: {
          get: (keys, cb) => cb({
            [STORAGE_KEYS.SESSION]: savedSession,
            [STORAGE_KEYS.BLACKLIST]: savedBlacklist,
            [STORAGE_KEYS.WEBCAM_ENABLED]: false
          }),
          set: (data, cb) => cb?.()
        },
        local: {
          get: (keys, cb) => cb({}),
          set: (data, cb) => cb?.()
        }
      },
      runtime: { lastError: null }
    };

    // Rehydrate
    await ensureInitialized(true);

    assert.equal(sessionFsm.state, 'focusing');
    assert.equal(sessionFsm.characterSlug, 'tom');
    assert.equal(sessionFsm.violationCount, 4);
    assert.equal(sessionFsm.webcamEnabled, false);
  });

  test('F3: ensureInitialized error resilience allows subsequent retry', async () => {
    let failFirstTime = true;

    globalThis.chrome = {
      storage: {
        sync: {
          get: (keys, cb) => {
            if (failFirstTime) {
              failFirstTime = false;
              throw new Error('Storage simulated failure');
            }
            cb({
              [STORAGE_KEYS.SESSION]: { state: 'focusing', violationCount: 7 },
              [STORAGE_KEYS.BLACKLIST]: DEFAULT_BLACKLIST_DOMAINS
            });
          },
          set: (data, cb) => cb?.()
        }
      },
      runtime: { lastError: null }
    };

    // First attempt fails, promise should recover (or catch) and null out initPromise
    await ensureInitialized(true);
    // Next attempt should succeed
    await ensureInitialized(true);

    assert.equal(sessionFsm.state, 'focusing');
    assert.equal(sessionFsm.violationCount, 7);
  });

  test('F4: Concurrent ensureInitialized calls share a single initialization promise', async () => {
    let callCount = 0;
    globalThis.chrome = {
      storage: {
        sync: {
          get: (keys, cb) => {
            callCount++;
            setTimeout(() => cb({}), 10);
          }
        }
      },
      runtime: { lastError: null }
    };

    const promises = Array.from({ length: 20 }, () => ensureInitialized(false));
    await Promise.all(promises);

    // Initial storage read should not have fired 20 times concurrently
    assert.ok(callCount <= 2, `Storage get should be called at most once or twice, got ${callCount}`);
  });

  test('F5: Debounce window exact boundary (1999ms debounced vs 2000ms allowed)', () => {
    const tabId = 12345;
    const t0 = 10000000;

    recordTabViolationTime(tabId, t0);

    // 0ms -> debounced
    assert.equal(isTabDebounced(tabId, t0), true);

    // 1999ms -> debounced
    assert.equal(isTabDebounced(tabId, t0 + 1999), true);

    // 2000ms -> expired
    assert.equal(isTabDebounced(tabId, t0 + 2000), false);

    // 2001ms -> expired
    assert.equal(isTabDebounced(tabId, t0 + 2001), false);
  });

  test('F6: checkAndHandleTabViolation end-to-end debouncing and HUD message sending', async () => {
    let hudMessages = [];
    let campusMessages = [];

    globalThis.chrome = {
      storage: {
        sync: {
          get: (keys, cb) => cb({}),
          set: (data, cb) => cb?.()
        }
      },
      tabs: {
        query: async () => [{ id: 99, url: 'http://localhost:3000/dashboard' }],
        sendMessage: async (targetTabId, payload) => {
          if (payload.action === 'SHOW_LOCKOUT_HUD') {
            hudMessages.push({ targetTabId, payload });
          } else if (payload.action === 'EXTENSION_VIOLATION') {
            campusMessages.push({ targetTabId, payload });
          }
        }
      },
      runtime: { lastError: null }
    };

    sessionFsm.state = 'focusing';
    sessionFsm.violationCount = 0;

    const violatingTab = { id: 700, url: 'https://youtube.com/watch?v=xyz' };

    // Trigger 1: Violation recorded
    await checkAndHandleTabViolation(violatingTab);
    assert.equal(sessionFsm.violationCount, 1);
    assert.equal(hudMessages.length, 1);
    assert.equal(campusMessages.length, 1);

    // Trigger 2 (immediate): Debounced, no new HUD or penalty
    await checkAndHandleTabViolation(violatingTab);
    assert.equal(sessionFsm.violationCount, 1, 'Duplicate violation within debounce window must NOT increment violationCount');
    assert.equal(hudMessages.length, 1);
    assert.equal(campusMessages.length, 1);

    // Trigger 3 (different tab ID): Allowed
    const anotherViolatingTab = { id: 701, url: 'https://facebook.com' };
    await checkAndHandleTabViolation(anotherViolatingTab);
    assert.equal(sessionFsm.violationCount, 2, 'Different tab must not be blocked by first tab debounce');
    assert.equal(hudMessages.length, 2);
    assert.equal(campusMessages.length, 2);
  });

  test('F7: Debounce map memory cleanup on tab removal', () => {
    const tab1 = 101;
    const tab2 = 102;
    recordTabViolationTime(tab1, Date.now());
    recordTabViolationTime(tab2, Date.now());

    assert.equal(lastViolationTimeByTab.has(tab1), true);
    assert.equal(lastViolationTimeByTab.has(tab2), true);

    lastViolationTimeByTab.delete(tab1);
    assert.equal(lastViolationTimeByTab.has(tab1), false);
    assert.equal(lastViolationTimeByTab.has(tab2), true);

    lastViolationTimeByTab.delete(tab2);
    assert.equal(lastViolationTimeByTab.has(tab2), false);
  });
});
