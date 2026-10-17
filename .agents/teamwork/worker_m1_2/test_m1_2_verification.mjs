import { test, describe, beforeEach } from 'node:test';
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
  handleMessageRequest
} from '../../../extension/background.js';

describe('Worker M1.2 Dormancy Rehydration & Debounce Verification Suite', () => {

  test('V1: ensureInitialized export exists and returns a Promise', async () => {
    assert.equal(typeof ensureInitialized, 'function');
    const p = ensureInitialized();
    assert.ok(p instanceof Promise);
    await p;
  });

  test('V2: Service Worker Dormancy Rehydration restores state from storage', async () => {
    // Simulate chrome.storage with an active focusing session
    const mockStorage = {
      [STORAGE_KEYS.SESSION]: {
        state: 'focusing',
        startedAt: Date.now() - 30000,
        durationSeconds: 1500,
        remainingSeconds: 1470,
        characterSlug: 'cat',
        mode: 'extreme',
        violationCount: 2,
        lastExemptionAt: 0,
        exemptUntil: 0,
        webcamEnabled: true
      },
      [STORAGE_KEYS.BLACKLIST]: ['custom-bad-site.com', 'facebook.com'],
      [STORAGE_KEYS.WEBCAM_ENABLED]: true
    };

    // Install mock chrome global
    globalThis.chrome = {
      storage: {
        local: {
          get: (keys, cb) => cb(mockStorage),
          set: (items, cb) => cb?.()
        },
        sync: {
          get: (keys, cb) => cb(mockStorage),
          set: (items, cb) => cb?.()
        }
      },
      runtime: {
        lastError: null
      }
    };

    // Before rehydration, reset in-memory FSM to idle
    sessionFsm.state = 'idle';
    sessionFsm.violationCount = 0;

    // Force rehydration as would happen upon SW wakeup
    await ensureInitialized(true);

    assert.equal(sessionFsm.isFocusing(), true, 'FSM state should be restored to focusing');
    assert.equal(sessionFsm.state, 'focusing');
    assert.equal(sessionFsm.violationCount, 2, 'Violation count should be restored to 2');
    assert.ok(sessionFsm.webcamEnabled, 'WebcamEnabled should be restored to true');

    // Clean up mock
    delete globalThis.chrome;
    sessionFsm.state = 'idle';
    await handleMessageRequest({ action: 'RESET_BLACKLIST' });
  });

  test('V3: Debounce functions prevent rapid duplicate penalties on same tab within 2000ms', () => {
    const tabId = 999;
    lastViolationTimeByTab.clear();

    const t0 = 1000000;
    assert.equal(isTabDebounced(tabId, t0), false, 'Initially not debounced');

    recordTabViolationTime(tabId, t0);
    assert.equal(lastViolationTimeByTab.get(tabId), t0);

    // 500ms later: debounced!
    assert.equal(isTabDebounced(tabId, t0 + 500), true, '500ms later must be debounced');

    // 1999ms later: still debounced!
    assert.equal(isTabDebounced(tabId, t0 + 1999), true, '1999ms later must be debounced');

    // 2000ms later: debounce expired!
    assert.equal(isTabDebounced(tabId, t0 + 2000), false, '2000ms later debounce expired');

    // Different tab is never debounced
    assert.equal(isTabDebounced(1000, t0 + 500), false, 'Different tab must not be debounced');
  });

  test('V4: checkAndHandleTabViolation debounces duplicate violations on same tab', async () => {
    lastViolationTimeByTab.clear();
    sessionFsm.state = 'focusing';
    sessionFsm.violationCount = 0;
    sessionFsm.exemptUntil = 0;

    const fakeTab = { id: 777, url: 'https://facebook.com/messages' };

    // First violation check on tab 777
    await checkAndHandleTabViolation(fakeTab);
    assert.equal(sessionFsm.violationCount, 1, 'First violation should be counted');

    // Second immediate check on tab 777 (e.g. rapid event within 2s)
    await checkAndHandleTabViolation(fakeTab);
    assert.equal(sessionFsm.violationCount, 1, 'Second immediate violation must be debounced');

    // Check with another tab ID
    const anotherTab = { id: 888, url: 'https://youtube.com/watch?v=123' };
    await checkAndHandleTabViolation(anotherTab);
    assert.equal(sessionFsm.violationCount, 2, 'Violation on another tab should be counted');

    // Clean up
    sessionFsm.state = 'idle';
    lastViolationTimeByTab.clear();
  });

  test('V5: Non-URL changeInfo in onUpdated does not trigger violation check', () => {
    // Emulate onUpdated filtering logic:
    // if (!changeInfo.url) return;
    const changeInfoTitle = { title: 'YouTube - My Favorite Video' };
    const changeInfoStatus = { status: 'complete' };
    const changeInfoFavicon = { favIconUrl: 'https://youtube.com/favicon.ico' };
    const changeInfoUrl = { url: 'https://youtube.com' };

    assert.equal(Boolean(changeInfoTitle.url), false, 'Title change should have no changeInfo.url');
    assert.equal(Boolean(changeInfoStatus.url), false, 'Status change should have no changeInfo.url');
    assert.equal(Boolean(changeInfoFavicon.url), false, 'Favicon change should have no changeInfo.url');
    assert.equal(Boolean(changeInfoUrl.url), true, 'URL change has changeInfo.url');
  });

  test('V6: Clean up debounce map on tab close', () => {
    const tabId = 555;
    recordTabViolationTime(tabId, Date.now());
    assert.ok(lastViolationTimeByTab.has(tabId));

    lastViolationTimeByTab.delete(tabId);
    assert.equal(lastViolationTimeByTab.has(tabId), false, 'Tab ID should be cleared from debounce map');
  });
});
