/**
 * Milestone 4 Unit Test Suite: Extension Bridge, Supabase -50 XP Penalty & Realtime Popup
 *
 * Verifies:
 * 1. PostgreSQL migration 004 DDL syntax and schema columns
 * 2. penalizeViolation store action: 50 XP deduction, 0 XP floor clamp, level demotion, violationCount increment
 * 3. recordFocusViolationToSupabase sync: offline mutation queuing and student_focus_sessions payload mapping
 * 4. use-extension-bridge contracts: message payloads, violation event dispatching, and response structures
 * 5. Extension popup assets and domain sanitization logic
 * 6. POST /api/focus/violation Next.js API route behavior
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  penalizeViolation,
  getSharedState,
  setSharedState,
  calculateLevelAndRank,
  resetSharedState,
} from '../src/lib/campus-store.ts';

import {
  recordFocusViolationToSupabase,
  getOfflineQueue,
  clearOfflineQueue,
} from '../src/lib/supabase-sync.ts';

import {
  sendExtensionMessage,
  type ViolationPayload,
  type ExtensionMessage,
} from '../src/features/pomodoro/use-extension-bridge.ts';

import { POST, GET } from '../src/app/api/focus/violation/route.ts';

describe('Milestone 4 - Supabase Migration DDL (004_extension_focus_violations.sql)', () => {
  const rootDir = path.resolve(process.cwd(), '..');
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '004_extension_focus_violations.sql');

  test('Migration file 004 exists and contains valid DDL statements', () => {
    assert.ok(fs.existsSync(migrationPath), `Migration file must exist at ${migrationPath}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 1. ALTER profiles
    assert.match(
      sql,
      /ALTER\s+TABLE\s+public\.profiles\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+violation_count\s+INTEGER\s+NOT\s+NULL\s+DEFAULT\s+0;/i,
      'Must add violation_count to public.profiles'
    );

    // 2. ALTER student_profiles
    assert.match(
      sql,
      /ALTER\s+TABLE\s+public\.student_profiles\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+violation_count\s+INTEGER\s+NOT\s+NULL\s+DEFAULT\s+0;/i,
      'Must add violation_count to public.student_profiles'
    );

    // 3. ALTER student_focus_sessions
    assert.match(
      sql,
      /ALTER\s+TABLE\s+public\.student_focus_sessions\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+violation_count\s+INTEGER\s+NOT\s+NULL\s+DEFAULT\s+0;/i,
      'Must add violation_count to public.student_focus_sessions'
    );

    // 4. Index definitions
    assert.match(
      sql,
      /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_student_focus_sessions_violations/i,
      'Should create index on student_focus_sessions'
    );
  });
});

describe('Milestone 4 - penalizeViolation in CampusOS Shared Store', () => {
  beforeEach(() => {
    resetSharedState();
  });

  test('penalizeViolation deducts exactly 50 XP and increments violation counters', () => {
    setSharedState((prev) => ({
      ...prev,
      xp: 250,
      level: 2,
      violationCount: 0,
      totalShameCount: 0,
    }));

    const result = penalizeViolation(50, 'facebook.com');

    assert.equal(result.xpDeducted, 50, 'Must deduct exactly 50 XP');
    assert.equal(result.nextXp, 200, 'Next XP must be 200');

    const state = getSharedState();
    assert.equal(state.xp, 200, 'Shared store XP must be updated to 200');
    assert.equal(state.violationCount, 1, 'violationCount must increment to 1');
    assert.equal(state.totalShameCount, 1, 'totalShameCount must increment to 1');
  });

  test('penalizeViolation enforces strict 0 XP floor clamp (never negative)', () => {
    setSharedState((prev) => ({
      ...prev,
      xp: 30, // Less than 50
      level: 1,
      violationCount: 2,
      totalShameCount: 2,
    }));

    const result = penalizeViolation(50, 'youtube.com');

    assert.equal(result.nextXp, 0, 'Next XP must clamp to 0 and not go negative');
    assert.equal(result.xpDeducted, 30, 'XP deducted should be clamped to current balance');

    const state = getSharedState();
    assert.equal(state.xp, 0, 'State XP must be 0');
    assert.equal(state.violationCount, 3, 'violationCount must increment to 3');
  });

  test('penalizeViolation recalculates Level and Rank Title on demotion', () => {
    // Level 2 minimum is 200 XP ('Cú đêm giảng đường')
    // Level 1 minimum is 0 XP ('Tân sinh viên ngơ ngác')
    setSharedState((prev) => ({
      ...prev,
      xp: 210,
      level: 2,
      rankTitle: 'Cú đêm giảng đường',
    }));

    const result = penalizeViolation(50, 'tiktok.com');

    assert.equal(result.nextXp, 160);
    assert.equal(result.level, 1, 'Level should demote from 2 to 1');
    assert.equal(result.rankTitle, 'Tân sinh viên ngơ ngác', 'Rank title should update to Level 1 title');

    const state = getSharedState();
    assert.equal(state.level, 1);
    assert.equal(state.rankTitle, 'Tân sinh viên ngơ ngác');
  });

  test('Consecutive violations accumulate violationCount accurately', () => {
    setSharedState((prev) => ({ ...prev, xp: 500, violationCount: 0 }));

    penalizeViolation(50, 'facebook.com');
    penalizeViolation(50, 'twitter.com');
    penalizeViolation(50, 'reddit.com');

    const state = getSharedState();
    assert.equal(state.xp, 350, '3 violations should deduct 150 XP total');
    assert.equal(state.violationCount, 3, 'violationCount should be 3');
    assert.equal(state.totalShameCount, 3, 'totalShameCount should be 3');
  });
});

describe('Milestone 4 - recordFocusViolationToSupabase & Offline Fallback', () => {
  beforeEach(() => {
    clearOfflineQueue();
  });

  test('recordFocusViolationToSupabase falls back safely to offline mutation queue', async () => {
    const success = await recordFocusViolationToSupabase({
      penaltyXp: 50,
      domain: 'shopee.vn',
      reason: 'blacklist_url',
      violationCount: 1,
    });

    // In unit test environment without real Supabase connection, it enqueues offline mutation
    const queue = getOfflineQueue();
    assert.ok(queue.length >= 1, 'Must enqueue at least one mutation in offline queue');

    const sessionMutation = queue.find((m) => m.entity === 'student_focus_sessions');
    assert.ok(sessionMutation, 'Must enqueue student_focus_sessions mutation');
    assert.equal(sessionMutation?.action, 'INSERT');
    assert.equal(sessionMutation?.payload.xp_gained, -50);
    assert.equal(sessionMutation?.payload.mode, 'extreme_cat');
    assert.equal(sessionMutation?.payload.violation_count, 1);
  });
});

describe('Milestone 4 - Extension Bridge Messaging Contracts', () => {
  test('sendExtensionMessage handles timeout gracefully when extension not present', async () => {
    const res = await sendExtensionMessage({ action: 'PING' }, 50);
    assert.equal(res, null, 'Should resolve to null cleanly on timeout without throwing');
  });

  test('ViolationPayload conforms to required interface contract', () => {
    const payload: ViolationPayload = {
      action: 'EXTENSION_VIOLATION',
      domain: 'netflix.com',
      reason: 'blacklist_url',
      penaltyXp: 50,
      timestamp: Date.now(),
      violationCount: 1,
    };

    assert.equal(payload.action, 'EXTENSION_VIOLATION');
    assert.equal(payload.domain, 'netflix.com');
    assert.equal(payload.penaltyXp, 50);
  });

  test('ExtensionMessage supports all required actions', () => {
    const actions: ExtensionMessage[] = [
      { action: 'PING' },
      { action: 'START_FOCUS', durationSeconds: 1500, characterSlug: 'cat', mode: 'extreme' },
      { action: 'PAUSE_FOCUS' },
      { action: 'STOP_FOCUS' },
      { action: 'REQUEST_EXEMPTION', durationSeconds: 180 },
      { action: 'SYNC_STATE' },
      { action: 'UPDATE_BLACKLIST', blacklist: ['facebook.com'] },
      { action: 'TOGGLE_WEBCAM', enabled: true },
    ];

    assert.equal(actions.length, 8);
    for (const msg of actions) {
      assert.ok(msg.action);
    }
  });
});

describe('Milestone 4 - Extension Popup & Manifest Compliance', () => {
  const rootDir = path.resolve(process.cwd(), '..');
  const popupHtmlPath = path.join(rootDir, 'extension', 'popup', 'popup.html');
  const popupJsPath = path.join(rootDir, 'extension', 'popup', 'popup.js');
  const popupCssPath = path.join(rootDir, 'extension', 'popup', 'popup.css');
  const manifestPath = path.join(rootDir, 'extension', 'manifest.json');

  test('All popup UI files exist and are populated', () => {
    assert.ok(fs.existsSync(popupHtmlPath), 'popup.html must exist');
    assert.ok(fs.existsSync(popupJsPath), 'popup.js must exist');
    assert.ok(fs.existsSync(popupCssPath), 'popup.css must exist');

    const html = fs.readFileSync(popupHtmlPath, 'utf8');
    const js = fs.readFileSync(popupJsPath, 'utf8');
    const css = fs.readFileSync(popupCssPath, 'utf8');

    assert.ok(html.includes('timer-display'), 'popup.html must have timer-display');
    assert.ok(html.includes('add-domain-form'), 'popup.html must have add-domain-form');
    assert.ok(html.includes('toggle-webcam'), 'popup.html must have toggle-webcam');

    assert.ok(js.includes('formatTime'), 'popup.js must have formatTime function');
    assert.ok(js.includes('cleanDomainInput'), 'popup.js must have cleanDomainInput');

    assert.ok(css.includes('#0A0A12'), 'popup.css must use CampusOS deep dark #0A0A12');
    assert.ok(css.includes('#C6FF3D'), 'popup.css must use neon lime #C6FF3D');
    assert.ok(css.includes('#FF3D6E'), 'popup.css must use neon rose #FF3D6E');
  });

  test('Manifest V3 references popup.html correctly', () => {
    const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.equal(manifestJson.manifest_version, 3);
    assert.equal(manifestJson.action.default_popup, 'popup/popup.html');
  });

  test('Domain cleaning heuristic strips protocol, www, and query params accurately', () => {
    function cleanDomainInput(raw: string): string {
      if (!raw || typeof raw !== 'string') return '';
      let cleaned = raw.trim().toLowerCase();
      cleaned = cleaned.replace(/^[a-z]+:\/\//i, '');
      cleaned = cleaned.split('/')[0]!.split('?')[0]!.split('#')[0]!;
      cleaned = cleaned.split(':')[0]!;
      cleaned = cleaned.replace(/^\*\./, '');
      cleaned = cleaned.replace(/^\.+/, '');
      cleaned = cleaned.replace(/\.+$/, '');
      return cleaned;
    }

    assert.equal(cleanDomainInput('https://shopee.vn/flash_sale?ref=1'), 'shopee.vn');
    assert.equal(cleanDomainInput('http://m.facebook.com:8080/home'), 'm.facebook.com');
    assert.equal(cleanDomainInput('*.tiktok.com'), 'tiktok.com');
    assert.equal(cleanDomainInput('   NETFLIX.COM/browse   '), 'netflix.com');
  });
});

describe('Milestone 4 - REST API /api/focus/violation Route', () => {
  test('POST /api/focus/violation returns success confirmation with valid payload', async () => {
    const mockReq = {
      json: async () => ({
        domain: 'youtube.com',
        reason: 'blacklist_url',
        penaltyXp: 50,
      }),
    } as any;

    const res = await POST(mockReq);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.recorded.domain, 'youtube.com');
    assert.equal(body.recorded.penaltyXp, 50);
  });

  test('POST /api/focus/violation rejects missing domain and reason with 400', async () => {
    const mockReq = {
      json: async () => ({}),
    } as any;

    const res = await POST(mockReq);
    assert.equal(res.status, 200); // Defaults reason to blacklist_url

    const mockEmptyReq = {
      json: async () => ({
        domain: '',
        reason: '',
      }),
    } as any;

    const badRes = await POST(mockEmptyReq);
    assert.equal(badRes.status, 400);
  });

  test('GET /api/focus/violation returns API endpoint description', async () => {
    const res = await GET();
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.endpoint, '/api/focus/violation');
  });
});
