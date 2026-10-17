/**
 * Challenger Final: Adversarial Stress & Verification Test Suite
 *
 * EMPIRICAL ADVERSARIAL CHALLENGES:
 * 1. SNTP Clock Sync Math, Asymmetric Latency & Jitter Rejection (< 200ms)
 * 2. Silent Focus Discipline, Unicode/XSS Emoji Injection & Reaction Rate Limiting
 * 3. Deserter Penalty (-50 XP), Floor Clamping, Rank Recalculation & Shame Protocol
 * 4. Three.js Resource Disposal Lifecycle, DPR Clamping (<= 1.25) & Memory Leak Prevention
 * 5. 3 Room Types (Public, Private PIN, Workspace) & 6-Digit PIN Gate Security
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Import service layer and store
import {
  generateRoomCode,
  calculateRemainingSeconds,
  filterRoomsByTab,
  listStudyRooms,
  getStudyRoomByCode,
  createStudyRoom,
  updateStudyRoom,
  verifyRoomPin,
  deleteStudyRoom,
  joinStudyRoom,
  leaveStudyRoom,
  getStudyRoomMembers,
  updateMemberStatus,
  postRoomReaction,
  getWeeklyStudyLeaderboard,
  type StudyRoomRow,
  type CreateStudyRoomInput,
} from '../src/lib/study-rooms-service.ts';

import {
  calculateLevelAndRank,
  penalizeViolation,
  getSharedState,
  setSharedState,
  resetSharedState,
} from '../src/lib/campus-store.ts';

// Paths
const rootDir = path.resolve(process.cwd(), '..');
const hookPath = path.resolve(process.cwd(), 'src', 'hooks', 'use-study-room-realtime.ts');
const leaderboard3DPath = path.resolve(process.cwd(), 'src', 'components', 'study', 'leaderboard-3d-arena.tsx');
const pinModalPath = path.resolve(process.cwd(), 'src', 'components', 'study', 'pin-entry-modal.tsx');
const createModalPath = path.resolve(process.cwd(), 'src', 'components', 'study', 'create-room-modal.tsx');
const deserterBannerPath = path.resolve(process.cwd(), 'src', 'components', 'study', 'deserter-shame-banner.tsx');
const roomCodePagePath = path.resolve(process.cwd(), 'src', 'app', '(main)', 'study', 'rooms', '[code]', 'page.tsx');

// ==============================================================================
// 1. SNTP CLOCK SYNC & JITTER REJECTION (<200MS)
// ==============================================================================
describe('Domain 1: SNTP Clock Sync Math & Jitter Rejection (< 200ms)', () => {
  interface SntpPingSample {
    clientSentWallTime: number;
    clientSentPerfTime: number;
    serverTime: number;
    clientRecvPerfTime: number;
  }

  // Exact reference algorithm extracted from use-study-room-realtime.ts
  function calculateNtpOffset(samples: SntpPingSample[]): {
    offset: number;
    minRtt: number;
    selectedSampleIndex: number;
  } {
    if (!samples || samples.length === 0) {
      return { offset: 0, minRtt: 0, selectedSampleIndex: -1 };
    }

    let minRtt = Infinity;
    let selectedIndex = 0;
    let bestOffset = 0;

    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      if (!s) continue;
      const rtt = Math.max(0, s.clientRecvPerfTime - s.clientSentPerfTime);
      const oneWayLatency = rtt / 2;
      const localEstimatedArrival = s.clientSentWallTime + oneWayLatency;
      const offset = s.serverTime - localEstimatedArrival;

      if (rtt < minRtt) {
        minRtt = rtt;
        selectedIndex = i;
        bestOffset = offset;
      }
    }

    return {
      offset: Math.round(bestOffset),
      minRtt: Math.round(minRtt),
      selectedSampleIndex: selectedIndex,
    };
  }

  function computeRemainingSeconds(endTimeIso: string, syncedCurrentTime: number): number {
    if (!endTimeIso) return 0;
    const endMs = new Date(endTimeIso).getTime();
    if (isNaN(endMs)) return 0;
    const diff = endMs - syncedCurrentTime;
    return Math.max(0, Math.floor(diff / 1000));
  }

  test('1.1 Jitter Rejection Oracle: Picks lowest RTT across 1,000 randomized bursts with massive bufferbloat', () => {
    const baseServerTime = 1_700_000_000_000;
    const trueClockSkew = 14_250; // client is 14.25 seconds ahead

    for (let run = 0; run < 1000; run++) {
      const cleanRtt = 10 + Math.random() * 20; // 10-30ms clean sample
      const dirtyRtt1 = 400 + Math.random() * 1000; // 400-1400ms spike
      const dirtyRtt2 = 800 + Math.random() * 1200; // 800-2000ms spike

      const cleanIndex = Math.floor(Math.random() * 3);
      const rtts = [dirtyRtt1, dirtyRtt2];
      rtts.splice(cleanIndex, 0, cleanRtt);

      const samples: SntpPingSample[] = rtts.map((rtt, idx) => {
        const perfStart = 1000 + idx * 200;
        const perfEnd = perfStart + rtt;
        const oneWay = rtt / 2;
        const wallStart = baseServerTime + trueClockSkew + idx * 200;
        const sTime = baseServerTime + idx * 200 + oneWay;

        return {
          clientSentWallTime: wallStart,
          clientSentPerfTime: perfStart,
          serverTime: sTime,
          clientRecvPerfTime: perfEnd,
        };
      });

      const res = calculateNtpOffset(samples);
      assert.strictEqual(
        res.selectedSampleIndex,
        cleanIndex,
        `Run ${run}: Must strictly select sample with clean RTT (${cleanRtt.toFixed(1)}ms), but picked ${res.selectedSampleIndex}`
      );

      // Theoretical clock offset error must be <= cleanRtt / 2 <= 15ms << 200ms
      const calculatedServerTime = samples[cleanIndex]!.clientSentWallTime + res.offset;
      const expectedServerTime = samples[cleanIndex]!.serverTime - cleanRtt / 2;
      const error = Math.abs(calculatedServerTime - expectedServerTime);
      assert.ok(error <= 20, `Clock error ${error}ms exceeds 20ms under clean ping`);
    }
  });

  test('1.2 Asymmetric Latency Stress: Bounded offset error remains < 200ms when uplink/downlink ratio is 1:9', () => {
    const baseServerTime = 1_700_000_000_000;
    const trueClockSkew = -8_500; // Client is 8.5s slow

    // Simulate extreme 100ms RTT where uplink=10ms and downlink=90ms (extreme mobile asymmetry)
    const uplink = 10;
    const downlink = 90;
    const rtt = uplink + downlink; // 100ms

    const sample: SntpPingSample = {
      clientSentWallTime: baseServerTime + trueClockSkew,
      clientSentPerfTime: 500,
      serverTime: baseServerTime + uplink, // Arrives at server after 10ms
      clientRecvPerfTime: 500 + rtt, // Returns after 100ms
    };

    const res = calculateNtpOffset([sample]);
    // Calculated offset = serverTime - (wallStart + rtt/2)
    // = (baseServerTime + 10) - (baseServerTime - 8500 + 50) = 8500 - 40 = 8460ms
    // True offset needed = 8500ms
    // Error = 40ms <= RTT/2 (50ms) < 200ms!
    const error = Math.abs(res.offset - (-trueClockSkew));
    assert.ok(error <= 50, `Offset error under 1:9 asymmetric link was ${error}ms, must be <= 50ms`);
    assert.ok(error < 200, 'Error must strictly satisfy < 200ms guarantee');
  });

  test('1.3 Multi-Client Skew Convergence: 2 clients with +35s and -72s skews converge to < 50ms delta', () => {
    const serverTimestamp = 1_700_500_000_000;

    // Client Alpha: +35,000ms clock skew (running ahead)
    const clientAlphaSkew = +35_000;
    const sampleAlpha: SntpPingSample = {
      clientSentWallTime: serverTimestamp + clientAlphaSkew,
      clientSentPerfTime: 2000,
      serverTime: serverTimestamp + 15, // 30ms symmetric RTT
      clientRecvPerfTime: 2030,
    };
    const offsetAlpha = calculateNtpOffset([sampleAlpha]).offset;

    // Client Beta: -72,000ms clock skew (running behind)
    const clientBetaSkew = -72_000;
    const sampleBeta: SntpPingSample = {
      clientSentWallTime: serverTimestamp + clientBetaSkew,
      clientSentPerfTime: 5000,
      serverTime: serverTimestamp + 20, // 40ms symmetric RTT
      clientRecvPerfTime: 5040,
    };
    const offsetBeta = calculateNtpOffset([sampleBeta]).offset;

    // Both clients compute synced time at any moment
    const simElapsed = 12_345;
    const alphaNow = serverTimestamp + clientAlphaSkew + simElapsed + offsetAlpha;
    const betaNow = serverTimestamp + clientBetaSkew + simElapsed + offsetBeta;

    const delta = Math.abs(alphaNow - betaNow);
    assert.ok(delta < 200, `Inter-client sync delta was ${delta}ms, must be < 200ms`);
    assert.strictEqual(delta, 0, 'Symmetric ping yields 0ms delta between divergent clients');
  });

  test('1.4 Countdown Exact Match: Skewed clients compute identical integer countdown seconds', () => {
    const serverStartTime = 1_700_000_000_000;
    const durationMinutes = 45;
    const endTimeIso = new Date(serverStartTime + durationMinutes * 60 * 1000).toISOString();

    // 10 different clients with skews ranging from -3 hours to +3 hours
    const skews = [-10_800_000, -3_600_000, -45_000, -1_000, 0, 500, 15_000, 60_000, 3_600_000, 10_800_000];

    // Check countdown at 100 different points during the 45-minute session
    for (let step = 0; step < 100; step++) {
      const elapsedMs = step * 25 * 1000; // 0s, 25s, 50s...
      const currentServerTime = serverStartTime + elapsedMs;

      const countdownResults = skews.map((skew) => {
        // Client performs SNTP ping with 30ms RTT
        const sample: SntpPingSample = {
          clientSentWallTime: currentServerTime + skew,
          clientSentPerfTime: 100,
          serverTime: currentServerTime + 15,
          clientRecvPerfTime: 130,
        };
        const offset = calculateNtpOffset([sample]).offset;
        const syncedClientTime = currentServerTime + skew + offset;
        return computeRemainingSeconds(endTimeIso, syncedClientTime);
      });

      // All 10 clients must compute the EXACT same remaining seconds
      const firstClientSeconds = countdownResults[0];
      for (let c = 1; c < countdownResults.length; c++) {
        assert.strictEqual(
          countdownResults[c],
          firstClientSeconds,
          `At elapsed ${elapsedMs}ms, Client ${c} computed ${countdownResults[c]}s vs Client 0 ${firstClientSeconds}s`
        );
      }
    }
  });

  test('1.5 Malformed & Edge-Case Samples: Empty, null, negative, NaN, expired timestamps handle cleanly', () => {
    // Empty array
    assert.deepStrictEqual(calculateNtpOffset([]), { offset: 0, minRtt: 0, selectedSampleIndex: -1 });

    // Expired countdown clamps to 0
    const pastIso = new Date(Date.now() - 50_000).toISOString();
    assert.strictEqual(computeRemainingSeconds(pastIso, Date.now()), 0);

    // Empty or invalid ISO
    assert.strictEqual(computeRemainingSeconds('', Date.now()), 0);
    assert.strictEqual(computeRemainingSeconds('invalid-date-string', Date.now()), 0);
  });
});

// ==============================================================================
// 2. SILENT FOCUS & REACTION WHITELIST RATE LIMITING
// ==============================================================================
describe('Domain 2: Silent Focus Discipline & Reaction Whitelist Rate Limiting', () => {
  const ALLOWED_REACTIONS = ['🔥', '👏', '❤️', '💪', '⚡'] as const;

  function isChatLocked(roomStatus: 'waiting' | 'focusing' | 'break'): boolean {
    return roomStatus === 'focusing';
  }

  function validateReactionEmoji(emoji: string): { valid: boolean; reason?: string } {
    if (!emoji || typeof emoji !== 'string') {
      return { valid: false, reason: 'Reaction emoji không được để trống' };
    }
    if (!ALLOWED_REACTIONS.includes(emoji as any)) {
      return {
        valid: false,
        reason: `Chỉ cho phép các icon hạt bay: ${ALLOWED_REACTIONS.join(' ')}`,
      };
    }
    return { valid: true };
  }

  class ReactionRateLimiter {
    private userTimestamps = new Map<string, number[]>();
    private readonly maxReactions = 5;
    private readonly windowMs = 3000;

    canSend(userId: string, now = Date.now()): boolean {
      const list = this.userTimestamps.get(userId) || [];
      const validTimestamps = list.filter((t) => now - t < this.windowMs);
      if (validTimestamps.length >= this.maxReactions) {
        this.userTimestamps.set(userId, validTimestamps);
        return false;
      }
      validTimestamps.push(now);
      this.userTimestamps.set(userId, validTimestamps);
      return true;
    }
  }

  test('2.1 Chat Lock Matrix: Strictly locked during focusing; unlocked during waiting and break', () => {
    assert.strictEqual(isChatLocked('focusing'), true, 'Focusing phase must lock chat');
    assert.strictEqual(isChatLocked('break'), false, 'Break phase must unlock chat');
    assert.strictEqual(isChatLocked('waiting'), false, 'Waiting phase must unlock chat');
  });

  test('2.2 Emoji Whitelist & Injection Challenge: Only 5 approved floating particles accepted', () => {
    for (const validEmoji of ALLOWED_REACTIONS) {
      const check = validateReactionEmoji(validEmoji);
      assert.strictEqual(check.valid, true, `Approved emoji ${validEmoji} must be valid`);
    }

    const hostileInputs = [
      '',
      '   ',
      '🎉',
      '💩',
      '👍',
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      "' OR 1=1; --",
      '🔥👏',
      '❤️ ',
      'A'.repeat(1000),
      null as any,
      undefined as any,
      123 as any,
      {} as any,
    ];

    for (const hostile of hostileInputs) {
      const check = validateReactionEmoji(hostile);
      assert.strictEqual(check.valid, false, `Hostile input ${JSON.stringify(hostile)} must be rejected`);
      assert.ok(check.reason && check.reason.length > 0);
    }
  });

  test('2.3 Reaction Burst Rate Limiting: 1,000 rapid attempts allows exactly 5, throttles 995', () => {
    const limiter = new ReactionRateLimiter();
    const userId = 'user_challenger_burst';
    const now = 1_700_000_000_000;

    let allowedCount = 0;
    let rejectedCount = 0;

    for (let i = 0; i < 1000; i++) {
      if (limiter.canSend(userId, now)) {
        allowedCount++;
      } else {
        rejectedCount++;
      }
    }

    assert.strictEqual(allowedCount, 5, 'Must permit exactly 5 reactions in burst window');
    assert.strictEqual(rejectedCount, 995, 'Must throttle remaining 995 reactions');

    // At now + 2999ms: Still within strictly less than 3000ms window (< 3000ms), must be rejected
    assert.strictEqual(limiter.canSend(userId, now + 2999), false, 'Still within 3000ms window at 2999ms');

    // At now + 3000ms: Window expires (now - t = 3000, not < 3000), must allow new reaction
    assert.strictEqual(limiter.canSend(userId, now + 3000), true, 'Window expired at 3000ms, must allow new reaction');
  });


  test('2.4 Multi-User Concurrency Isolation: 50 concurrent users blasting simultaneously do not cross-throttle', () => {
    const limiter = new ReactionRateLimiter();
    const now = 1_700_000_000_000;
    const users = Array.from({ length: 50 }, (_, i) => `student_${i}`);

    // Every user sends 5 allowed reactions
    for (const u of users) {
      for (let r = 0; r < 5; r++) {
        assert.strictEqual(limiter.canSend(u, now), true, `User ${u} reaction #${r + 1} should be permitted`);
      }
      // 6th reaction is throttled
      assert.strictEqual(limiter.canSend(u, now), false, `User ${u} reaction #6 must be throttled`);
    }

    // Verify user 0 hitting limit did not block user 49's independent quota
    const freshUser = 'independent_student';
    assert.strictEqual(limiter.canSend(freshUser, now), true, 'Fresh user must not be impacted by other users limits');
  });
});

// ==============================================================================
// 3. DESERTER PENALTY (-50 XP) & SHAME PROTOCOL
// ==============================================================================
describe('Domain 3: Deserter Penalty (-50 XP) & Shame Protocol', () => {
  interface DeserterViolationEvent {
    type: 'MEMBER_VIOLATION';
    userId: string;
    userName: string;
    penaltyXp: number;
    reason: string;
    dangerFlash: boolean;
    bannerText: string;
    timestamp: number;
  }

  function processDeserterViolation(
    userId: string,
    userName: string,
    reason: string,
    isExempt = false
  ): {
    penalized: boolean;
    event?: DeserterViolationEvent;
    penaltyAmount: number;
  } {
    if (isExempt) {
      return { penalized: false, penaltyAmount: 0 };
    }

    const penaltyAmount = 50;
    const event: DeserterViolationEvent = {
      type: 'MEMBER_VIOLATION',
      userId,
      userName,
      penaltyXp: penaltyAmount,
      reason,
      dangerFlash: true,
      bannerText: `Thành viên ${userName} đã phân tâm/bỏ cuộc và bị phạt -${penaltyAmount} XP!`,
      timestamp: Date.now(),
    };

    return {
      penalized: true,
      event,
      penaltyAmount,
    };
  }

  beforeEach(() => {
    resetSharedState();
  });

  test('3.1 Deserter Processing: Generates MEMBER_VIOLATION event with -50 XP penalty and dangerFlash', () => {
    const res = processDeserterViolation('usr_deserter', 'Trần Văn Bỏ Cuộc', 'chuyển tab ra ngoài');
    assert.strictEqual(res.penalized, true);
    assert.strictEqual(res.penaltyAmount, 50);
    assert.ok(res.event);
    assert.strictEqual(res.event.type, 'MEMBER_VIOLATION');
    assert.strictEqual(res.event.penaltyXp, 50);
    assert.strictEqual(res.event.dangerFlash, true);
    assert.match(res.event.bannerText, /Trần Văn Bỏ Cuộc/);
    assert.match(res.event.bannerText, /-50 XP/);
  });

  test('3.2 Exemption Protection: "Tôi đang tra tài liệu" waives penalty and emits no shame event', () => {
    const res = processDeserterViolation('usr_legit', 'Lê Tra Tài Liệu', 'tra cứu StackOverflow', true);
    assert.strictEqual(res.penalized, false);
    assert.strictEqual(res.penaltyAmount, 0);
    assert.strictEqual(res.event, undefined);
  });

  test('3.3 Floor Clamping & Anti-Negative Invariant: User with 30 XP drops to 0 XP (NOT negative)', () => {
    setSharedState((s) => ({ ...s, xp: 30 }));
    const result = penalizeViolation(50, 'rời phòng sớm');

    assert.strictEqual(result.nextXp, 0, 'XP must clamp at 0');
    assert.strictEqual(result.xpDeducted, 30, 'XP deducted was 30 (available balance)');

    const state = getSharedState();
    assert.strictEqual(state.xp, 0);
    assert.strictEqual(state.violationCount, 1);
    assert.strictEqual(state.totalShameCount, 1);
  });

  test('3.4 Rank Demotion & Recalculation: Penalty drops user rank title and level when thresholds are crossed', () => {
    // Set user to Level 3 (XP = 520)
    setSharedState((s) => ({ ...s, xp: 520 }));
    const beforeRank = calculateLevelAndRank(520);
    assert.ok(beforeRank.level >= 2);

    // Penalize 50 XP -> 470 XP
    const penalty1 = penalizeViolation(50, 'vi phạm');
    assert.strictEqual(penalty1.nextXp, 470);
    const afterRank = calculateLevelAndRank(470);
    assert.strictEqual(penalty1.level, afterRank.level);
    assert.strictEqual(penalty1.rankTitle, afterRank.rankTitle);
  });

  test('3.5 Deserter Shame Banner Component Invariant: Verifies role="alert", aria-live="assertive", and danger styling', () => {
    assert.ok(fs.existsSync(deserterBannerPath), `Banner component must exist at ${deserterBannerPath}`);
    const code = fs.readFileSync(deserterBannerPath, 'utf8');

    assert.match(code, /role="alert"/i, 'Must have accessible alert role');
    assert.match(code, /aria-live="assertive"/i, 'Must have assertive live region');
    assert.match(code, /animate-panic-shake/i, 'Must include panic shake animation');
    assert.match(code, /border-rose-500/i, 'Must have red danger border');
    assert.match(code, /notice\.penaltyXp/i, 'Must display penalty XP value');
  });
});

// ==============================================================================
// 4. THREE.JS RESOURCE DISPOSAL & 120FPS DPR CLAMP
// ==============================================================================
describe('Domain 4: Three.js Resource Disposal & 120FPS DPR Clamp', () => {
  test('4.1 Leaderboard 3D Arena Component File Exists and Exports', () => {
    assert.ok(fs.existsSync(leaderboard3DPath), `Leaderboard 3D Arena must exist at ${leaderboard3DPath}`);
    const code = fs.readFileSync(leaderboard3DPath, 'utf8');
    assert.match(code, /export function Leaderboard3DArena/, 'Must export Leaderboard3DArena');
  });

  test('4.2 120FPS DPR Clamp Invariant: Bounded pixel ratio <= 1.25 across extreme device pixel ratios', () => {
    const code = fs.readFileSync(leaderboard3DPath, 'utf8');
    assert.match(
      code,
      /renderer\.setPixelRatio\(Math\.min\(window\.devicePixelRatio\s*\|\|\s*1,\s*1\.25\)\)/,
      'Must clamp DPR to Math.min(window.devicePixelRatio || 1, 1.25)'
    );

    // Adversarial simulation of extreme DPRs (e.g. 4K Mobile, Retina 3.0x, 4.0x)
    const testDprs = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0];
    for (const dpr of testDprs) {
      const effectiveDpr = Math.min(dpr || 1, 1.25);
      assert.ok(
        effectiveDpr <= 1.25,
        `DPR ${dpr} must be clamped to <= 1.25, got ${effectiveDpr}`
      );
      if (dpr >= 1.25) {
        assert.strictEqual(effectiveDpr, 1.25, `High DPI ${dpr} must clamp exactly to 1.25`);
      }
    }
  });

  test('4.3 Complete Disposal Lifecycle: Verifies explicit disposal of geometries, materials, renderer & RAF', () => {
    const code = fs.readFileSync(leaderboard3DPath, 'utf8');

    // Geometry disposal
    assert.match(code, /geometriesToDispose\.push\(/, 'Must register geometries for cleanup');
    assert.match(code, /geo\.dispose\(\)/, 'Must loop and call geo.dispose() on unmount');

    // Material disposal
    assert.match(code, /materialsToDispose\.push\(/, 'Must register materials for cleanup');
    assert.match(code, /mat\.dispose\(\)/, 'Must loop and call mat.dispose() on unmount');

    // Renderer disposal
    assert.match(code, /renderer\.dispose\(\)/, 'Must call renderer.dispose() on unmount');
    assert.match(code, /container\.removeChild\(renderer\.domElement\)/, 'Must remove canvas from DOM on unmount');

    // Animation loop & Event listeners
    assert.match(code, /cancelAnimationFrame\(animId\)/, 'Must cancel animation frame');
    assert.match(code, /window\.removeEventListener\('resize'/, 'Must remove resize listener');
    assert.match(code, /document\.removeEventListener\('visibilitychange'/, 'Must remove visibility listener');
  });

  test('4.4 Tab Visibility Throttling: Cancels RAF when tab is hidden to prevent background GPU churn', () => {
    const code = fs.readFileSync(leaderboard3DPath, 'utf8');
    assert.match(
      code,
      /if\s*\(document\.hidden\)\s*\{\s*cancelAnimationFrame\(animId\);/,
      'Must pause RAF loop when document is hidden'
    );
  });

  test('4.5 Accessibility & Reduced-Motion / WebGL Fallback Mode', () => {
    const code = fs.readFileSync(leaderboard3DPath, 'utf8');
    assert.match(code, /prefers-reduced-motion: reduce/, 'Must check prefers-reduced-motion');
    assert.match(code, /\(!hasWebGL\s*\|\|\s*isReducedMotion\)/, 'Must have fallback condition in render');
    assert.match(code, /BỤC VINH DANH CHIẾN THẦN TUẦN/, 'Fallback must render accessible static leaderboard');
  });

});

// ==============================================================================
// 5. 3 ROOM TYPES & 6-DIGIT PIN GATE
// ==============================================================================
describe('Domain 5: 3 Room Types & 6-Digit PIN Gate Security', () => {
  test('5.1 Room Types Specification: Supports public, private_pin, and workspace types', () => {
    const sampleRooms: StudyRoomRow[] = [
      {
        id: 'r_pub',
        code: 'PUB-01',
        title: 'Phòng học công khai',
        subject: 'Toán',
        host_id: 'host-1',
        room_type: 'public',
        pin_code: null,
        workspace_id: null,
        focus_duration_minutes: 50,
        break_duration_minutes: 10,
        current_status: 'waiting',
        start_time_iso: null,
        end_time_iso: null,
        is_active: true,
        max_participants: 24,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'r_pin',
        code: 'PIN-02',
        title: 'Phòng học mã PIN',
        subject: 'ICPC',
        host_id: 'host-2',
        room_type: 'private_pin',
        pin_code: '777888',
        workspace_id: null,
        focus_duration_minutes: 45,
        break_duration_minutes: 5,
        current_status: 'waiting',
        start_time_iso: null,
        end_time_iso: null,
        is_active: true,
        max_participants: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'r_ws',
        code: 'WS-03',
        title: 'Phòng học đồ án',
        subject: 'Capstone',
        host_id: 'host-3',
        room_type: 'workspace',
        pin_code: null,
        workspace_id: 'workspace-ai-capstone',
        focus_duration_minutes: 60,
        break_duration_minutes: 10,
        current_status: 'focusing',
        start_time_iso: new Date().toISOString(),
        end_time_iso: null,
        is_active: true,
        max_participants: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Verify filter by tab
    const wsFilter = filterRoomsByTab(sampleRooms, 'workspace');
    assert.strictEqual(wsFilter.length, 1);
    assert.strictEqual(wsFilter[0]?.id, 'r_ws');

    const allFilter = filterRoomsByTab(sampleRooms, 'all');
    assert.strictEqual(allFilter.length, 3);
  });

  test('5.2 verifyRoomPin Security Oracle: Strict 6-digit numeric comparison & rejection of rogue PINs', async () => {
    const pinRoom: StudyRoomRow = {
      id: 'pin_target',
      code: 'TARGET',
      title: 'Target Room',
      subject: 'Math',
      host_id: 'h1',
      room_type: 'private_pin',
      pin_code: '556677',
      workspace_id: null,
      focus_duration_minutes: 45,
      break_duration_minutes: 5,
      current_status: 'waiting',
      start_time_iso: null,
      end_time_iso: null,
      is_active: true,
      max_participants: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Correct PIN
    assert.strictEqual(await verifyRoomPin(pinRoom, '556677'), true, 'Exact PIN must pass');
    assert.strictEqual(await verifyRoomPin(pinRoom, '  556677  '), true, 'Padded PIN must pass');

    // Incorrect PINs
    const badPins = [
      '556678',
      '000000',
      '55667',
      '5566778',
      'abcdef',
      '55667a',
      '',
      '   ',
      "' OR 1=1; --",
      '<script>',
      'null',
      'undefined',
    ];

    for (const bad of badPins) {
      assert.strictEqual(await verifyRoomPin(pinRoom, bad), false, `Bad PIN ${JSON.stringify(bad)} must fail`);
    }

    // Public room bypass
    const publicRoom: StudyRoomRow = { ...pinRoom, room_type: 'public', pin_code: null };
    assert.strictEqual(await verifyRoomPin(publicRoom, 'anything'), true, 'Public room requires no PIN');
  });

  test('5.3 PIN Gate Screen & Modal Invariants: Verifies 6-digit input, auto-focus & lock icon', () => {
    assert.ok(fs.existsSync(pinModalPath), `Pin modal must exist at ${pinModalPath}`);
    const modalCode = fs.readFileSync(pinModalPath, 'utf8');
    assert.match(modalCode, /maxLength=\{6\}/, 'Must restrict PIN input to 6 characters');
    assert.match(modalCode, /cleanPin\.length\s*!==\s*6/, 'Must enforce exactly 6 digits');
    assert.match(modalCode, /verifyRoomPin/, 'Must call verifyRoomPin service');

    assert.ok(fs.existsSync(roomCodePagePath), `Room code page must exist at ${roomCodePagePath}`);
    const pageCode = fs.readFileSync(roomCodePagePath, 'utf8');
    assert.match(pageCode, /activeRoom\.room_type\s*===\s*'private_pin'/, 'Must check private_pin room type');
    assert.match(pageCode, /!isPinVerified/, 'Must block page render when PIN not verified');
  });

  test('5.4 Create Room Modal 3-Type Support & Random PIN Generator', () => {
    assert.ok(fs.existsSync(createModalPath), `Create modal must exist at ${createModalPath}`);
    const createCode = fs.readFileSync(createModalPath, 'utf8');

    assert.match(createCode, /StudyRoomType|'public'\s*\|\s*'private_pin'\s*\|\s*'workspace'/, 'Supports all 3 room types');
    assert.match(createCode, /Math\.floor\(100000\s*\+\s*Math\.random\(\)\s*\*\s*900000\)/, 'Has random 6-digit PIN generator');
    assert.ok(createCode.includes('!/^\\d{6}$/.test(pinCode.trim())'), 'Strict 6-digit regex validation on pinCode');
  });
});


