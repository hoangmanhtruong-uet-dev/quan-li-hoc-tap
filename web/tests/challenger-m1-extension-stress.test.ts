/**
 * CampusOS Milestone 1 Empirical Stress & Adversarial Verification Test Suite
 * Created by Empirical Challenger (challenger_m1_2)
 *
 * Scenarios Tested:
 * 1. handleCloseTabAndFocusCampus:
 *    - Existing CampusOS tab detection and activation
 *    - Window focus restoration
 *    - Fallback tab creation when no CampusOS tab exists
 *    - Violating tab closure resilience and error suppression
 *    - URL pattern deduplication in queryCampusOsTabs
 *    - End-to-end CLOSE_TAB_AND_FOCUS_CAMPUS message routing
 *
 * 2. Exemption Cooldown Boundary Math:
 *    - Sub-millisecond boundary precision: 179,999ms (denied) vs 180,000ms (granted)
 *    - Exact remaining waitSeconds calculation across the timeline (1ms -> 180s, 179,999ms -> 1s)
 *    - Strict isExempt boundary verification (exemptUntil - 1ms vs exemptUntil)
 *    - Rapid burst exemption spam resilience
 *
 * 3. Violation Counter Monotonicity & Tab Event Stress:
 *    - Monotonic increment under 100 rapid concurrent registerViolation calls
 *    - Concurrent LOCKOUT_VIOLATION message routing integrity
 *    - Tab filtering discrimination: blacklisted vs whitelisted vs internal vs idle vs break vs exempt
 *    - Invariant preservation across lifecycle state transitions (pause, stop, resume)
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_BLACKLIST_DOMAINS,
  EXEMPTION_COOLDOWN_SECONDS,
  DEFAULT_EXEMPTION_DURATION_SECONDS,
  SupervisorSessionFSM,
  sessionFsm,
  handleCloseTabAndFocusCampus,
  queryCampusOsTabs,
  checkAndHandleTabViolation,
  handleMessageRequest,
} from '../../extension/background.js';

describe('Milestone 1 Empirical Challenger Stress Suite (challenger-m1-extension-stress.test.ts)', () => {
  // Helper to manage mock chrome global object
  let originalChrome: any;

  beforeEach(() => {
    originalChrome = (globalThis as any).chrome;
  });

  afterEach(() => {
    if (originalChrome === undefined) {
      delete (globalThis as any).chrome;
    } else {
      (globalThis as any).chrome = originalChrome;
    }
  });

  // =========================================================================
  // SECTION 1: handleCloseTabAndFocusCampus & Tab Closure Redirection
  // =========================================================================

  describe('Section 1: handleCloseTabAndFocusCampus Stress & Resilience', () => {
    test('S1.1: Activates existing CampusOS tab, focuses window, and closes violating tab', async () => {
      const updatedTabs: Array<{ id: number; update: any }> = [];
      const updatedWindows: Array<{ id: number; update: any }> = [];
      const removedTabs: number[] = [];

      (globalThis as any).chrome = {
        tabs: {
          query: async (queryInfo: { url: string }) => {
            // Return existing CampusOS tab when localhost:3000 is queried
            if (queryInfo.url.includes('localhost:3000')) {
              return [{ id: 101, windowId: 50, url: 'http://localhost:3000/dashboard' }];
            }
            return [];
          },
          update: async (tabId: number, updateProperties: any) => {
            updatedTabs.push({ id: tabId, update: updateProperties });
            return { id: tabId, ...updateProperties };
          },
          remove: async (tabId: number) => {
            removedTabs.push(tabId);
          },
          create: async () => {
            assert.fail('chrome.tabs.create should NOT be called when existing tab is present');
          },
        },
        windows: {
          update: async (windowId: number, updateProperties: any) => {
            updatedWindows.push({ id: windowId, update: updateProperties });
            return { id: windowId, ...updateProperties };
          },
        },
      };

      const violatingTabId = 999;
      await handleCloseTabAndFocusCampus(violatingTabId);

      // Verify existing CampusOS tab was activated
      assert.equal(updatedTabs.length, 1, 'Should update exactly 1 tab');
      assert.equal(updatedTabs[0].id, 101, 'Target tab ID must be 101');
      assert.equal(updatedTabs[0].update.active, true, 'Target tab must be activated');

      // Verify window was focused
      assert.equal(updatedWindows.length, 1, 'Should update exactly 1 window');
      assert.equal(updatedWindows[0].id, 50, 'Window ID must be 50');
      assert.equal(updatedWindows[0].update.focused, true, 'Window must be focused');

      // Verify violating tab was removed
      assert.equal(removedTabs.length, 1, 'Should remove exactly 1 violating tab');
      assert.equal(removedTabs[0], 999, 'Removed tab ID must be 999');
    });

    test('S1.2: Creates new CampusOS tab at /dashboard when none exists, and closes violating tab', async () => {
      const createdTabs: any[] = [];
      const removedTabs: number[] = [];

      (globalThis as any).chrome = {
        tabs: {
          query: async () => [], // No open CampusOS tabs
          create: async (createProperties: any) => {
            createdTabs.push(createProperties);
            return { id: 202, ...createProperties };
          },
          update: async () => {
            assert.fail('chrome.tabs.update should NOT be called when no existing tab is found');
          },
          remove: async (tabId: number) => {
            removedTabs.push(tabId);
          },
        },
        windows: {
          update: async () => {},
        },
      };

      const violatingTabId = 888;
      await handleCloseTabAndFocusCampus(violatingTabId);

      // Verify new tab was created with default CampusOS dashboard URL
      assert.equal(createdTabs.length, 1, 'Should create exactly 1 new tab');
      assert.equal(createdTabs[0].url, 'http://localhost:3000/dashboard', 'Should target http://localhost:3000/dashboard');
      assert.equal(createdTabs[0].active, true, 'Created tab must be active');

      // Verify violating tab was removed
      assert.equal(removedTabs.length, 1, 'Should remove violating tab');
      assert.equal(removedTabs[0], 888);
    });

    test('S1.3: Handles null/undefined senderTabId safely without calling tabs.remove or throwing', async () => {
      let removeCalled = false;

      (globalThis as any).chrome = {
        tabs: {
          query: async () => [{ id: 101, windowId: 50, url: 'http://localhost:3000/dashboard' }],
          update: async () => {},
          remove: async () => {
            removeCalled = true;
          },
        },
        windows: {
          update: async () => {},
        },
      };

      // Call with null and undefined
      await assert.doesNotReject(async () => {
        await handleCloseTabAndFocusCampus(undefined as any);
        await handleCloseTabAndFocusCampus(null as any);
        await handleCloseTabAndFocusCampus(0 as any);
      });

      assert.equal(removeCalled, false, 'chrome.tabs.remove must NOT be called for falsy tab IDs');
    });

    test('S1.4: Suppresses errors if chrome.tabs.remove throws (e.g. tab already closed)', async () => {
      (globalThis as any).chrome = {
        tabs: {
          query: async () => [],
          create: async () => ({ id: 202 }),
          remove: async () => {
            throw new Error('Tab with id 777 was closed by user');
          },
        },
      };

      // Should not throw or reject
      await assert.doesNotReject(async () => {
        await handleCloseTabAndFocusCampus(777);
      });
    });

    test('S1.5: queryCampusOsTabs deduplicates tabs when identical tab matches multiple patterns', async () => {
      const duplicateTab = { id: 303, url: 'http://localhost:3000/dashboard' };

      (globalThis as any).chrome = {
        tabs: {
          query: async () => [duplicateTab], // Returns same tab for all 4 patterns
        },
      };

      const result = await queryCampusOsTabs();
      assert.equal(result.length, 1, 'queryCampusOsTabs must deduplicate by tab ID');
      assert.equal(result[0].id, 303);
    });

    test('S1.6: queryCampusOsTabs tolerates individual pattern query failures gracefully', async () => {
      let callCount = 0;
      (globalThis as any).chrome = {
        tabs: {
          query: async (queryInfo: { url: string }) => {
            callCount++;
            if (queryInfo.url.includes('campusos.vn')) {
              throw new Error('Pattern query permission denied');
            }
            return [{ id: 400 + callCount, url: queryInfo.url }];
          },
        },
      };

      const tabs = await queryCampusOsTabs();
      assert.ok(callCount >= 2, 'Should have queried multiple patterns');
      assert.equal(tabs.length, 2, 'Should successfully collect results from surviving pattern queries with distinct IDs');
      assert.equal(tabs[0].id, 401);
      assert.equal(tabs[1].id, 402);
    });

    test('S1.7: End-to-end CLOSE_TAB_AND_FOCUS_CAMPUS message dispatch with tabId and sender.tab.id', async () => {
      const removedTabs: number[] = [];

      (globalThis as any).chrome = {
        tabs: {
          query: async () => [],
          create: async () => ({ id: 505 }),
          remove: async (id: number) => {
            removedTabs.push(id);
          },
        },
      };

      // Case A: tabId explicitly provided in message payload
      const res1 = await handleMessageRequest({
        action: 'CLOSE_TAB_AND_FOCUS_CAMPUS',
        tabId: 606,
      });
      assert.equal(res1.status, 'OK');
      assert.equal(removedTabs.includes(606), true);

      // Case B: tabId inferred from sender.tab.id
      const res2 = await handleMessageRequest(
        { action: 'CLOSE_TAB_AND_FOCUS_CAMPUS' },
        { tab: { id: 707 } }
      );
      assert.equal(res2.status, 'OK');
      assert.equal(removedTabs.includes(707), true);
    });
  });

  // =========================================================================
  // SECTION 2: Exemption Cooldown Boundary Precision
  // =========================================================================

  describe('Section 2: Exemption Cooldown Boundary Math', () => {
    test('S2.1: First exemption request is unconditionally granted at any base timestamp', () => {
      const fsm = new SupervisorSessionFSM();
      const baseTime = 1700000000000;

      const res = fsm.requestExemption(180, baseTime);
      assert.equal(res.status, 'EXEMPTION_GRANTED');
      assert.equal(res.success, true);
      assert.equal(res.exemptUntil, baseTime + 180 * 1000);
      assert.equal(fsm.lastExemptionAt, baseTime);
    });

    test('S2.2: Exact boundary test: 179,999ms (denied, waitSeconds: 1) vs 180,000ms (granted)', () => {
      const fsm = new SupervisorSessionFSM();
      const baseTime = 5000000;

      // 1. Initial exemption granted
      const first = fsm.requestExemption(180, baseTime);
      assert.equal(first.success, true);

      // 2. Exactly 179,999ms later: Cooldown is 180,000ms -> Must be DENIED
      const denied = fsm.requestExemption(180, baseTime + 179999);
      assert.equal(denied.status, 'EXEMPTION_DENIED');
      assert.equal(denied.success, false);
      assert.equal(denied.waitSeconds, 1, 'Remaining wait time at 179,999ms must be exactly 1 second');
      assert.match(denied.error, /1 giây/);

      // 3. Exactly 180,000ms later: Cooldown elapsed -> Must be GRANTED
      const granted = fsm.requestExemption(180, baseTime + 180000);
      assert.equal(granted.status, 'EXEMPTION_GRANTED');
      assert.equal(granted.success, true);
      assert.equal(granted.exemptUntil, baseTime + 180000 + 180000);
      assert.equal(fsm.lastExemptionAt, baseTime + 180000);
    });

    test('S2.3: 1ms past boundary (180,001ms) is cleanly granted', () => {
      const fsm = new SupervisorSessionFSM();
      const baseTime = 6000000;
      fsm.requestExemption(180, baseTime);

      const granted = fsm.requestExemption(180, baseTime + 180001);
      assert.equal(granted.status, 'EXEMPTION_GRANTED');
      assert.equal(granted.success, true);
    });

    test('S2.4: Timeline waitSeconds interpolation matches Math.ceil((180000 - elapsed) / 1000)', () => {
      const fsm = new SupervisorSessionFSM();
      const baseTime = 10000000;
      fsm.requestExemption(180, baseTime);

      const checkPoints = [
        { elapsedMs: 1, expectedWaitSec: 180 },
        { elapsedMs: 1000, expectedWaitSec: 179 },
        { elapsedMs: 30000, expectedWaitSec: 150 },
        { elapsedMs: 60000, expectedWaitSec: 120 },
        { elapsedMs: 90000, expectedWaitSec: 90 },
        { elapsedMs: 120000, expectedWaitSec: 60 },
        { elapsedMs: 175000, expectedWaitSec: 5 },
        { elapsedMs: 179000, expectedWaitSec: 1 },
        { elapsedMs: 179500, expectedWaitSec: 1 },
        { elapsedMs: 179999, expectedWaitSec: 1 },
      ];

      for (const { elapsedMs, expectedWaitSec } of checkPoints) {
        const res = fsm.requestExemption(180, baseTime + elapsedMs);
        assert.equal(res.status, 'EXEMPTION_DENIED');
        assert.equal(
          res.waitSeconds,
          expectedWaitSec,
          `At elapsed ${elapsedMs}ms, expected waitSeconds ${expectedWaitSec}, got ${res.waitSeconds}`
        );
      }
    });

    test('S2.5: isExempt strict millisecond boundary comparison (exemptUntil - 1ms vs exemptUntil)', () => {
      const fsm = new SupervisorSessionFSM();
      const baseTime = 20000000;
      fsm.requestExemption(180, baseTime);
      const expiry = baseTime + 180 * 1000;

      // 1ms before expiry: still exempt
      assert.equal(fsm.isExempt(expiry - 1), true, '1ms before exemptUntil must be exempt');

      // Exactly at expiry: currentTime < exemptUntil is FALSE -> NOT exempt
      assert.equal(fsm.isExempt(expiry), false, 'At exemptUntil exactly, must NOT be exempt');

      // 1ms after expiry: NOT exempt
      assert.equal(fsm.isExempt(expiry + 1), false, '1ms after exemptUntil must NOT be exempt');
    });

    test('S2.6: Rapid spam burst (50 requests at same millisecond) results in exactly 1 grant and 49 denials', () => {
      const fsm = new SupervisorSessionFSM();
      const baseTime = 30000000;

      const results = Array.from({ length: 50 }, () => fsm.requestExemption(180, baseTime));

      const grants = results.filter((r) => r.status === 'EXEMPTION_GRANTED');
      const denials = results.filter((r) => r.status === 'EXEMPTION_DENIED');

      assert.equal(grants.length, 1, 'Exactly 1 grant allowed during rapid burst');
      assert.equal(denials.length, 49, 'Exactly 49 denials returned during rapid burst');
      assert.equal(denials[0].waitSeconds, 180);
    });
  });

  // =========================================================================
  // SECTION 3: Monotonic Violation Counter & Rapid Tab Event Stress
  // =========================================================================

  describe('Section 3: Violation Counter Monotonicity & Tab Stress', () => {
    test('S3.1: 100 rapid sequential registerViolation calls strictly increment counter', () => {
      const fsm = new SupervisorSessionFSM();
      assert.equal(fsm.violationCount, 0);

      for (let i = 1; i <= 100; i++) {
        const count = fsm.registerViolation();
        assert.equal(count, i, `Violation count at iteration ${i} must equal ${i}`);
        assert.equal(fsm.violationCount, i);
      }
    });

    test('S3.2: 100 concurrent asynchronous registerViolation invocations preserve count integrity', async () => {
      const fsm = new SupervisorSessionFSM();

      await Promise.all(
        Array.from({ length: 100 }, async () => {
          fsm.registerViolation();
        })
      );

      assert.equal(fsm.violationCount, 100, 'All 100 concurrent violations must be recorded');
    });

    test('S3.3: 50 concurrent LOCKOUT_VIOLATION messages increment monotonically via handleMessageRequest', async () => {
      // Record starting count
      const startState = await handleMessageRequest({ action: 'GET_STATE' });
      const baseViolations = startState.violationCount;

      const responses = await Promise.all(
        Array.from({ length: 50 }, (_, idx) =>
          handleMessageRequest({
            action: 'LOCKOUT_VIOLATION',
            domain: `distraction-${idx}.com`,
            reason: 'blacklist_url',
          })
        )
      );

      for (const res of responses) {
        assert.equal(res.status, 'OK');
        assert.ok(res.violationCount > baseViolations);
      }

      const finalState = await handleMessageRequest({ action: 'GET_STATE' });
      assert.equal(finalState.violationCount, baseViolations + 50);
    });

    test('S3.4: checkAndHandleTabViolation discriminates state, exemption, and blacklist', async () => {
      let sentViolationMessages: any[] = [];
      let sentHudMessages: any[] = [];

      (globalThis as any).chrome = {
        tabs: {
          query: async () => [{ id: 101, url: 'http://localhost:3000/dashboard' }],
          sendMessage: async (tabId: number, msg: any) => {
            if (msg.action === 'EXTENSION_VIOLATION') {
              sentViolationMessages.push({ tabId, msg });
            } else if (msg.action === 'SHOW_LOCKOUT_HUD') {
              sentHudMessages.push({ tabId, msg });
            }
          },
        },
      };

      // Ensure FSM is in known state
      await handleMessageRequest({ action: 'STOP_FOCUS' });
      const initialSnapshot = await handleMessageRequest({ action: 'GET_STATE' });
      const initialViolations = initialSnapshot.violationCount;

      // Scenario A: While in 'idle', visiting blacklisted URL -> NO VIOLATION
      await checkAndHandleTabViolation({ id: 801, url: 'https://facebook.com' });
      let state = await handleMessageRequest({ action: 'GET_STATE' });
      assert.equal(state.violationCount, initialViolations, 'Idle mode must not increment violations');

      // Scenario B: While in 'break', visiting blacklisted URL -> NO VIOLATION
      await handleMessageRequest({ action: 'START_BREAK', durationSeconds: 300 });
      await checkAndHandleTabViolation({ id: 802, url: 'https://youtube.com' });
      state = await handleMessageRequest({ action: 'GET_STATE' });
      assert.equal(state.violationCount, initialViolations, 'Break mode must not increment violations');

      // Scenario C: While 'focusing', visiting whitelisted / safe URL -> NO VIOLATION
      await handleMessageRequest({ action: 'START_FOCUS', durationSeconds: 1500 });
      await checkAndHandleTabViolation({ id: 803, url: 'https://github.com/nodejs/node' });
      await checkAndHandleTabViolation({ id: 804, url: 'http://localhost:3000/tasks' });
      await checkAndHandleTabViolation({ id: 805, url: 'https://campusos.vn/calendar' });
      state = await handleMessageRequest({ action: 'GET_STATE' });
      assert.equal(state.violationCount, 0, 'Safe URLs must not trigger violations');

      // Scenario D: While 'focusing', visiting blacklisted URL -> VIOLATION REGISTERED
      await checkAndHandleTabViolation({ id: 806, url: 'https://facebook.com/watch' });
      state = await handleMessageRequest({ action: 'GET_STATE' });
      assert.equal(state.violationCount, 1, 'Blacklisted URL must increment violation count to 1');
      assert.equal(sentHudMessages.length, 1);
      assert.equal(sentHudMessages[0].msg.domain, 'facebook.com');

      // Scenario E: While 'focusing' with active exemption -> NO VIOLATION
      await handleMessageRequest({ action: 'REQUEST_EXEMPTION', durationSeconds: 180 });
      await checkAndHandleTabViolation({ id: 807, url: 'https://youtube.com/watch' });
      state = await handleMessageRequest({ action: 'GET_STATE' });
      assert.equal(state.violationCount, 1, 'Exempted session must not trigger violation on blacklisted site');

      // Reset focus
      await handleMessageRequest({ action: 'STOP_FOCUS' });
    });

    test('S3.5: State Lifecycle Reset Invariants: startFocus resets counter, pause preserves it', () => {
      const fsm = new SupervisorSessionFSM();

      // Start focus -> violations = 0
      fsm.startFocus({ durationSeconds: 1500 });
      assert.equal(fsm.violationCount, 0);

      // Register 3 violations
      fsm.registerViolation();
      fsm.registerViolation();
      fsm.registerViolation();
      assert.equal(fsm.violationCount, 3);

      // Pause focus -> state becomes idle, but violationCount is preserved
      fsm.pauseFocus();
      assert.equal(fsm.state, 'idle');
      assert.equal(fsm.violationCount, 3);

      // Start focus again (new session) -> resets violations to 0
      fsm.startFocus({ durationSeconds: 1500 });
      assert.equal(fsm.state, 'focusing');
      assert.equal(fsm.violationCount, 0, 'New session must reset violation counter to 0');
    });
  });
});
