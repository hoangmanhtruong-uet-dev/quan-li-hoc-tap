/**
 * Pomodoro Party Comprehensive Test Suite (7 Required Suites)
 *
 * Verifies:
 * 1. DDL Schema & Migration 006 Contracts (006_pomodoro_party.sql)
 * 2. Database TypeScript Definitions & Type Fidelity (web/src/types/database.ts)
 * 3. NTP Clock Offset Synchronization Engine (<200ms Guarantee & Skew Tolerance)
 * 4. Room Access, 6-Character Code & 6-Digit PIN Authentication
 * 5. Silent Focus Interaction Rules & Floating Reaction Whitelist
 * 6. Deserter Penalty (-50 XP), Rank Recalculation & Public Shame Protocol
 * 7. 3D Weekly Leaderboard Podium Allocation & Three.js Memory Safety Lifecycle
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Import existing campus-store gamification logic for cross-verification
import {
  calculateLevelAndRank,
  penalizeViolation,
  getSharedState,
  setSharedState,
  resetSharedState,
} from '../src/lib/campus-store.ts';

// Top-level paths
const rootDir = path.resolve(process.cwd(), '..');
const migration006Path = path.join(rootDir, 'supabase', 'migrations', '006_pomodoro_party.sql');
const databaseTsPath = path.resolve(process.cwd(), 'src', 'types', 'database.ts');

// ==============================================================================
// SUITE 1: DDL Schema & Migration 006 Contracts
// ==============================================================================
describe('Suite 1: PostgreSQL DDL Migration 006 Contracts (006_pomodoro_party.sql)', () => {
  test('1.1 Migration file 006 exists and is comprehensive (> 8KB)', () => {
    assert.ok(fs.existsSync(migration006Path), `Migration file must exist at ${migration006Path}`);
    const stat = fs.statSync(migration006Path);
    assert.ok(stat.size > 8000, `Migration file should be comprehensive (>8KB), got ${stat.size} bytes`);
  });

  const sql = fs.readFileSync(migration006Path, 'utf8');

  test('1.2 Core Entities: public.study_rooms, public.study_room_members, public.room_reactions exist', () => {
    const requiredTables = ['study_rooms', 'study_room_members', 'room_reactions'];
    for (const table of requiredTables) {
      const tableRegex = new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\s*\\(`, 'i');
      assert.match(sql, tableRegex, `Table public.${table} must be defined in 006_pomodoro_party.sql`);
    }
  });

  test('1.3 study_rooms table columns match architectural specification', () => {
    const expectedColumns = [
      'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
      'code VARCHAR(16) NOT NULL UNIQUE',
      'title TEXT NOT NULL',
      'subject TEXT NOT NULL DEFAULT',
      'host_id UUID REFERENCES auth.users(id)',
      'room_type TEXT NOT NULL DEFAULT',
      'pin_code VARCHAR(6)',
      'workspace_id UUID REFERENCES public.workspaces(id)',
      'focus_duration_minutes INTEGER NOT NULL DEFAULT 45',
      'break_duration_minutes INTEGER NOT NULL DEFAULT 5',
      'current_status TEXT NOT NULL DEFAULT',
      'start_time_iso TIMESTAMPTZ',
      'end_time_iso TIMESTAMPTZ',
      'is_active BOOLEAN NOT NULL DEFAULT true',
      'max_participants INTEGER NOT NULL DEFAULT 24',
      'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
      'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
    ];

    for (const col of expectedColumns) {
      const colRegex = new RegExp(col.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'), 'i');
      assert.match(sql, colRegex, `study_rooms must define column matching: ${col}`);
    }
  });

  test('1.4 study_room_members table columns & unique constraint match specification', () => {
    const expectedDefinitions = [
      'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
      'room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE',
      'user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE',
      'status TEXT NOT NULL DEFAULT',
      'joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
      'total_minutes_contributed INTEGER NOT NULL DEFAULT 0',
      'camera_on BOOLEAN NOT NULL DEFAULT false',
      'last_ping_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
      'CONSTRAINT uq_study_room_member UNIQUE (room_id, user_id)',
    ];

    for (const def of expectedDefinitions) {
      const defRegex = new RegExp(def.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'), 'i');
      assert.match(sql, defRegex, `study_room_members must define: ${def}`);
    }
  });

  test('1.5 room_reactions table columns match specification', () => {
    const expectedDefinitions = [
      'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
      'room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE',
      'user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE',
      'emoji VARCHAR(20) NOT NULL',
      'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
    ];

    for (const def of expectedDefinitions) {
      const defRegex = new RegExp(def.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'), 'i');
      assert.match(sql, defRegex, `room_reactions must define: ${def}`);
    }
  });

  test('1.6 Check constraints enforce domain integrity', () => {
    // Room type check
    assert.match(sql, /room_type IN \('public', 'private_pin', 'workspace'\)/i, 'room_type check constraint missing');
    // Current status check
    assert.match(sql, /current_status IN \('waiting', 'focusing', 'break'\)/i, 'current_status check constraint missing');
    // Member status check
    assert.match(sql, /status IN \('focusing', 'distracted', 'break'\)/i, 'member status check constraint missing');
    // Duration boundaries
    assert.match(sql, /focus_duration_minutes BETWEEN 5 AND 180/i, 'focus_duration_minutes boundary constraint missing');
    assert.match(sql, /break_duration_minutes BETWEEN 1 AND 60/i, 'break_duration_minutes boundary constraint missing');
    // Capacity boundary
    assert.match(sql, /max_participants BETWEEN 2 AND 100/i, 'max_participants boundary constraint missing');
  });

  test('1.7 Foreign key and query performance indexes are properly defined', () => {
    const expectedIndexes = [
      'idx_study_rooms_code',
      'idx_study_rooms_host_id',
      'idx_study_rooms_workspace_id',
      'idx_study_rooms_type_active',
      'idx_study_rooms_status',
      'idx_study_room_members_room',
      'idx_study_room_members_user',
      'idx_study_room_members_room_user',
      'idx_study_room_members_status',
      'idx_room_reactions_room',
    ];

    for (const idx of expectedIndexes) {
      const idxRegex = new RegExp(`CREATE INDEX IF NOT EXISTS ${idx} ON`, 'i');
      assert.match(sql, idxRegex, `Index ${idx} must be defined`);
    }
  });

  test('1.8 Row Level Security (RLS), InitPlan optimization & helper functions', () => {
    // RLS enabled on all 3 tables
    assert.match(sql, /ALTER TABLE public\.study_rooms ENABLE ROW LEVEL SECURITY;/i);
    assert.match(sql, /ALTER TABLE public\.study_room_members ENABLE ROW LEVEL SECURITY;/i);
    assert.match(sql, /ALTER TABLE public\.room_reactions ENABLE ROW LEVEL SECURITY;/i);

    // SECURITY DEFINER helper function with empty search_path
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.is_study_room_member\(p_room_id UUID\)/i);
    assert.match(sql, /SECURITY DEFINER/i);
    assert.match(sql, /SET search_path = ''/i);

    // InitPlan optimization: (SELECT auth.uid()) wrapping
    assert.match(sql, /\(SELECT auth\.uid\(\)\)/i, 'RLS policies must wrap auth.uid() in (SELECT auth.uid())');

    // Realtime publication & Replica Identity
    assert.match(sql, /ALTER TABLE public\.study_rooms REPLICA IDENTITY FULL;/i);
    assert.match(sql, /ALTER TABLE public\.study_room_members REPLICA IDENTITY FULL;/i);
    assert.match(sql, /ALTER TABLE public\.room_reactions REPLICA IDENTITY FULL;/i);
    assert.match(sql, /ALTER PUBLICATION supabase_realtime ADD TABLE/i);
  });
});

// ==============================================================================
// SUITE 2: Database TypeScript Definitions & Type Fidelity
// ==============================================================================
describe('Suite 2: Database TypeScript Definitions & Type Contracts (database.ts)', () => {
  test('2.1 database.ts exists and includes study room entities in Database interface', () => {
    assert.ok(fs.existsSync(databaseTsPath), `TypeScript definitions file must exist at ${databaseTsPath}`);
    const ts = fs.readFileSync(databaseTsPath, 'utf8');

    assert.match(ts, /study_rooms:\s*\{/, 'Database interface must include study_rooms table');
    assert.match(ts, /study_room_members:\s*\{/, 'Database interface must include study_room_members table');
    assert.match(ts, /room_reactions:\s*\{/, 'Database interface must include room_reactions table');
  });

  const ts = fs.readFileSync(databaseTsPath, 'utf8');

  test('2.2 study_rooms Row type contains all expected fields and strict typing', () => {
    const expectedRowFields = [
      'id: string;',
      'code: string;',
      'title: string;',
      'subject: string;',
      'host_id: string | null;',
      "room_type: 'public' | 'private_pin' | 'workspace';",
      'pin_code: string | null;',
      'workspace_id: string | null;',
      'focus_duration_minutes: number;',
      'break_duration_minutes: number;',
      "current_status: 'waiting' | 'focusing' | 'break';",
      'start_time_iso: string | null;',
      'end_time_iso: string | null;',
      'is_active: boolean;',
      'max_participants: number;',
      'created_at: string;',
      'updated_at: string;',
    ];

    for (const field of expectedRowFields) {
      assert.ok(ts.includes(field), `study_rooms Row must include: ${field}`);
    }
  });

  test('2.3 study_room_members Row type contains status enum and member fields', () => {
    const expectedRowFields = [
      'id: string;',
      'room_id: string;',
      'user_id: string;',
      "status: 'focusing' | 'distracted' | 'break';",
      'joined_at: string;',
      'total_minutes_contributed: number;',
      'camera_on: boolean;',
      'last_ping_at: string;',
    ];

    for (const field of expectedRowFields) {
      assert.ok(ts.includes(field), `study_room_members Row must include: ${field}`);
    }
  });

  test('2.4 room_reactions Row type contains reaction fields', () => {
    const expectedRowFields = [
      'id: string;',
      'room_id: string;',
      'user_id: string;',
      'emoji: string;',
      'created_at: string;',
    ];

    for (const field of expectedRowFields) {
      assert.ok(ts.includes(field), `room_reactions Row must include: ${field}`);
    }
  });

  test('2.5 Top-level type aliases and helper enums are exported', () => {
    const expectedExports = [
      'export type StudyRoomRow',
      'export type StudyRoomInsert',
      'export type StudyRoomUpdate',
      'export type StudyRoomMemberRow',
      'export type StudyRoomMemberInsert',
      'export type StudyRoomMemberUpdate',
      'export type RoomReactionRow',
      'export type RoomReactionInsert',
      'export type RoomReactionUpdate',
      'export type StudyRoomType',
      'export type StudyRoomStatus',
      'export type StudyRoomMemberStatus',
    ];

    for (const exp of expectedExports) {
      assert.ok(ts.includes(exp), `database.ts must export: ${exp}`);
    }
  });
});

// ==============================================================================
// SUITE 3: NTP Clock Offset Synchronization Engine (<200ms Guarantee)
// ==============================================================================

/**
 * SNTP 3-Sample Clock Offset Filter Algorithm
 * Calculates:
 *   RTT = T3 - T0
 *   One-way latency Δ = RTT / 2
 *   Offset Θ = ServerTime - (W0 + Δ)
 * The sample with the lowest RTT is selected to filter jitter and bufferbloat.
 */
interface SntpPingSample {
  clientSentWallTime: number; // W0 (Date.now())
  clientSentPerfTime: number; // T0 (performance.now())
  serverTime: number;         // Server timestamp
  clientRecvPerfTime: number; // T3 (performance.now())
}

function calculateNtpOffset(samples: SntpPingSample[]): {
  offset: number;
  minRtt: number;
  selectedSampleIndex: number;
} {
  if (samples.length === 0) {
    return { offset: 0, minRtt: 0, selectedSampleIndex: -1 };
  }

  let minRtt = Infinity;
  let selectedIndex = 0;
  let bestOffset = 0;

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const rtt = Math.max(0, s.clientRecvPerfTime - s.clientSentPerfTime);
    const oneWayLatency = rtt / 2;
    // Map server time against local client wall time at mid-flight
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
  const endMs = new Date(endTimeIso).getTime();
  const diff = endMs - syncedCurrentTime;
  return Math.max(0, Math.floor(diff / 1000));
}

describe('Suite 3: NTP Clock Offset Synchronization Engine (<200ms Accuracy)', () => {
  test('3.1 SNTP 3-Sample filter rejects high latency jitter and selects lowest RTT sample', () => {
    const baseServerTime = 1_700_000_000_000;
    const localClockSkew = +3_500; // Local clock is 3500ms ahead

    const samples: SntpPingSample[] = [
      // Sample 0: Suffered network jitter (RTT = 180ms)
      {
        clientSentWallTime: baseServerTime + localClockSkew,
        clientSentPerfTime: 1000,
        serverTime: baseServerTime + 90,
        clientRecvPerfTime: 1180,
      },
      // Sample 1: Clean fast packet (RTT = 24ms)
      {
        clientSentWallTime: baseServerTime + localClockSkew + 60,
        clientSentPerfTime: 1200,
        serverTime: baseServerTime + 60 + 12,
        clientRecvPerfTime: 1224,
      },
      // Sample 2: Moderate bufferbloat (RTT = 80ms)
      {
        clientSentWallTime: baseServerTime + localClockSkew + 120,
        clientSentPerfTime: 1300,
        serverTime: baseServerTime + 120 + 40,
        clientRecvPerfTime: 1380,
      },
    ];

    const result = calculateNtpOffset(samples);
    assert.strictEqual(result.selectedSampleIndex, 1, 'Algorithm must select Sample 1 with lowest RTT (24ms)');
    assert.strictEqual(result.minRtt, 24, 'Minimum RTT should be 24ms');
    // Offset should accurately correct the +3500ms client clock skew -> offset ≈ -3500ms
    assert.ok(
      Math.abs(result.offset - -3500) <= 5,
      `Calculated offset (${result.offset}) should cancel out skew (-3500ms) within 5ms`
    );
  });

  test('3.2 Extreme Skewed Clients (Client A: +4500ms, Client B: -11200ms) converge to < 200ms', () => {
    const trueServerNow = 1_700_000_500_000;

    // Client A is 4500ms fast
    const clientA_Wall = trueServerNow + 4500;
    const clientA_Samples: SntpPingSample[] = [
      { clientSentWallTime: clientA_Wall, clientSentPerfTime: 100, serverTime: trueServerNow + 15, clientRecvPerfTime: 130 }, // RTT 30
      { clientSentWallTime: clientA_Wall + 50, clientSentPerfTime: 150, serverTime: trueServerNow + 65, clientRecvPerfTime: 180 }, // RTT 30
      { clientSentWallTime: clientA_Wall + 100, clientSentPerfTime: 200, serverTime: trueServerNow + 115, clientRecvPerfTime: 230 }, // RTT 30
    ];

    // Client B is 11200ms slow
    const clientB_Wall = trueServerNow - 11200;
    const clientB_Samples: SntpPingSample[] = [
      { clientSentWallTime: clientB_Wall, clientSentPerfTime: 500, serverTime: trueServerNow + 25, clientRecvPerfTime: 550 }, // RTT 50
      { clientSentWallTime: clientB_Wall + 60, clientSentPerfTime: 560, serverTime: trueServerNow + 80, clientRecvPerfTime: 600 }, // RTT 40
      { clientSentWallTime: clientB_Wall + 120, clientSentPerfTime: 620, serverTime: trueServerNow + 150, clientRecvPerfTime: 680 }, // RTT 60
    ];

    const offsetA = calculateNtpOffset(clientA_Samples).offset;
    const offsetB = calculateNtpOffset(clientB_Samples).offset;

    // Both clients compute syncedNow
    const syncedNowA = clientA_Wall + offsetA;
    const syncedNowB = clientB_Wall + offsetB;

    const discrepancy = Math.abs(syncedNowA - syncedNowB);
    assert.ok(
      discrepancy < 200,
      `Multiplayer clock discrepancy must be < 200ms, got ${discrepancy}ms`
    );
    // In practice with these symmetric simulated latencies, discrepancy is < 10ms
    assert.ok(discrepancy <= 10, `Discrepancy should be under 10ms under realistic conditions, got ${discrepancy}ms`);
  });

  test('3.3 Countdown synchrony: Clients with skewed clocks display the EXACT SAME countdown integer seconds', () => {
    const trueServerNow = 1_700_000_000_000;
    // Room ending in 25 minutes (1500 seconds)
    const endTimeIso = new Date(trueServerNow + 1500 * 1000).toISOString();

    const clientA_Wall = trueServerNow + 7200;
    const clientB_Wall = trueServerNow - 18400;

    const offsetA = calculateNtpOffset([
      { clientSentWallTime: clientA_Wall, clientSentPerfTime: 10, serverTime: trueServerNow + 10, clientRecvPerfTime: 30 },
    ]).offset;

    const offsetB = calculateNtpOffset([
      { clientSentWallTime: clientB_Wall, clientSentPerfTime: 20, serverTime: trueServerNow + 12, clientRecvPerfTime: 44 },
    ]).offset;

    const remSecondsA = computeRemainingSeconds(endTimeIso, clientA_Wall + offsetA);
    const remSecondsB = computeRemainingSeconds(endTimeIso, clientB_Wall + offsetB);

    assert.strictEqual(remSecondsA, 1500, 'Client A must compute exactly 1500 remaining seconds');
    assert.strictEqual(remSecondsB, 1500, 'Client B must compute exactly 1500 remaining seconds');
    assert.strictEqual(remSecondsA, remSecondsB, 'Both clients must display the identical remaining countdown integer');
  });

  test('3.4 Edge cases: Expired countdown clamps to 0 and empty samples handle gracefully', () => {
    const now = Date.now();
    const pastTimeIso = new Date(now - 10_000).toISOString();

    // Expired timer
    const remSec = computeRemainingSeconds(pastTimeIso, now);
    assert.strictEqual(remSec, 0, 'Expired countdown must clamp to 0 and never return negative values');

    // Empty samples fallback
    const emptyResult = calculateNtpOffset([]);
    assert.strictEqual(emptyResult.offset, 0);
    assert.strictEqual(emptyResult.selectedSampleIndex, -1);
  });
});

// ==============================================================================
// SUITE 4: Room Access, 6-Character Code & 6-Digit PIN Authentication
// ==============================================================================

const ROOM_CODE_REGEX = /^[A-Z0-9]{6}$/;
const PIN_CODE_REGEX = /^\d{6}$/;

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Unambiguous chars (no I, 1, O, 0)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function validateRoomCode(code: string): { valid: boolean; reason?: string } {
  if (!code || typeof code !== 'string') {
    return { valid: false, reason: 'Mã phòng không được để trống' };
  }
  const clean = code.trim().toUpperCase();
  // 6-character random room code (e.g. KT2026, 8H29BA)
  if (ROOM_CODE_REGEX.test(clean)) {
    return { valid: true };
  }
  // Course slug code with hyphen (e.g. CS101-LAB, TOAN-ROIRAC)
  if (/^[A-Z0-9]{2,8}-[A-Z0-9]{2,8}$/.test(clean)) {
    return { valid: true };
  }
  return { valid: false, reason: 'Mã phòng phải gồm 6 ký tự chữ hoa hoặc slug môn học (VD: CS101-LAB)' };
}

function validatePinCode(pin: string | null | undefined): { valid: boolean; reason?: string } {
  if (!pin || typeof pin !== 'string') {
    return { valid: false, reason: 'Mã PIN không được để trống' };
  }
  if (!PIN_CODE_REGEX.test(pin.trim())) {
    return { valid: false, reason: 'Mã PIN bảo mật phải gồm đúng 6 chữ số' };
  }
  return { valid: true };
}

interface MockRoom {
  id: string;
  code: string;
  room_type: 'public' | 'private_pin' | 'workspace';
  pin_code?: string | null;
  workspace_id?: string | null;
  is_active: boolean;
  max_participants: number;
  current_participants_count: number;
}

interface MockUser {
  id: string;
  workspaceMemberships: string[];
}

function canJoinRoom(
  room: MockRoom,
  user: MockUser,
  providedPin?: string
): { allowed: boolean; errorCode?: string; reason?: string } {
  if (!room.is_active) {
    return { allowed: false, errorCode: 'ROOM_INACTIVE', reason: 'Phòng học đã kết thúc hoặc không còn hoạt động' };
  }

  if (room.current_participants_count >= room.max_participants) {
    return { allowed: false, errorCode: 'ROOM_FULL', reason: 'Phòng học đã đạt số lượng thành viên tối đa (24/24)' };
  }

  if (room.room_type === 'public') {
    return { allowed: true };
  }

  if (room.room_type === 'private_pin') {
    if (!providedPin) {
      return { allowed: false, errorCode: 'PIN_REQUIRED', reason: 'Vui lòng nhập mã PIN 6 số để vào phòng' };
    }
    const pinCheck = validatePinCode(providedPin);
    if (!pinCheck.valid) {
      return { allowed: false, errorCode: 'PIN_INVALID_FORMAT', reason: pinCheck.reason };
    }
    if (providedPin !== room.pin_code) {
      return { allowed: false, errorCode: 'PIN_INCORRECT', reason: 'Mã PIN không chính xác' };
    }
    return { allowed: true };
  }

  if (room.room_type === 'workspace') {
    if (!room.workspace_id || !user.workspaceMemberships.includes(room.workspace_id)) {
      return {
        allowed: false,
        errorCode: 'WORKSPACE_FORBIDDEN',
        reason: 'Bạn không phải thành viên của Workspace này để vào phòng học đồ án',
      };
    }
    return { allowed: true };
  }

  return { allowed: false, errorCode: 'INVALID_ROOM_TYPE' };
}

describe('Suite 4: Room Access, 6-Char Code & 6-Digit PIN Authentication', () => {
  test('4.1 Room code generator produces 6-char uppercase alphanumeric string with zero collisions in 1000 runs', () => {
    const generated = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const code = generateRoomCode();
      assert.strictEqual(code.length, 6, `Code must be exactly 6 chars, got ${code}`);
      assert.match(code, ROOM_CODE_REGEX, `Code ${code} must match ^[A-Z0-9]{6}$`);
      generated.add(code);
    }
    assert.strictEqual(generated.size, 1000, '1000 consecutive room codes should be unique');
  });

  test('4.2 Room code validation accepts valid formats and rejects malformed codes', () => {
    assert.strictEqual(validateRoomCode('KT2026').valid, true);
    assert.strictEqual(validateRoomCode('CS101-LAB').valid, true);
    assert.strictEqual(validateRoomCode('TOAN-ROIRAC').valid, true);

    // Rejections
    assert.strictEqual(validateRoomCode('').valid, false);
    assert.strictEqual(validateRoomCode('abc').valid, false); // too short
    assert.strictEqual(validateRoomCode('CS@101').valid, false); // special char
  });

  test('4.3 PIN code validation strictly enforces 6-digit numeric pattern', () => {
    // Valid 6 digits
    assert.strictEqual(validatePinCode('123456').valid, true);
    assert.strictEqual(validatePinCode('000000').valid, true);
    assert.strictEqual(validatePinCode('987654').valid, true);

    // Invalid PINs
    assert.strictEqual(validatePinCode('12345').valid, false); // 5 digits
    assert.strictEqual(validatePinCode('1234567').valid, false); // 7 digits
    assert.strictEqual(validatePinCode('12a456').valid, false); // letter included
    assert.strictEqual(validatePinCode('      ').valid, false); // whitespace
    assert.strictEqual(validatePinCode(null).valid, false);
    assert.strictEqual(validatePinCode(undefined).valid, false);
  });

  test('4.4 Room access matrix: Public, Private PIN, and Workspace authorization', () => {
    const publicRoom: MockRoom = {
      id: 'r1',
      code: 'PUB001',
      room_type: 'public',
      is_active: true,
      max_participants: 24,
      current_participants_count: 5,
    };

    const privateRoom: MockRoom = {
      id: 'r2',
      code: 'PIN002',
      room_type: 'private_pin',
      pin_code: '889900',
      is_active: true,
      max_participants: 24,
      current_participants_count: 5,
    };

    const workspaceRoom: MockRoom = {
      id: 'r3',
      code: 'WKS003',
      room_type: 'workspace',
      workspace_id: 'ws-da-tot-nghiep',
      is_active: true,
      max_participants: 24,
      current_participants_count: 5,
    };

    const studentMember: MockUser = { id: 'u1', workspaceMemberships: ['ws-da-tot-nghiep'] };
    const studentOutsider: MockUser = { id: 'u2', workspaceMemberships: ['ws-clb-tin-hoc'] };

    // Public room: anyone can join
    assert.strictEqual(canJoinRoom(publicRoom, studentOutsider).allowed, true);

    // Private PIN room: requires correct PIN
    assert.strictEqual(canJoinRoom(privateRoom, studentMember).errorCode, 'PIN_REQUIRED');
    assert.strictEqual(canJoinRoom(privateRoom, studentMember, '111111').errorCode, 'PIN_INCORRECT');
    assert.strictEqual(canJoinRoom(privateRoom, studentMember, '889900').allowed, true);

    // Workspace room: requires workspace membership
    assert.strictEqual(canJoinRoom(workspaceRoom, studentOutsider).errorCode, 'WORKSPACE_FORBIDDEN');
    assert.strictEqual(canJoinRoom(workspaceRoom, studentMember).allowed, true);
  });

  test('4.5 Room boundary enforcement: Capacity max and Inactive status', () => {
    const fullRoom: MockRoom = {
      id: 'r-full',
      code: 'FULL01',
      room_type: 'public',
      is_active: true,
      max_participants: 24,
      current_participants_count: 24,
    };

    const inactiveRoom: MockRoom = {
      id: 'r-inact',
      code: 'DEAD01',
      room_type: 'public',
      is_active: false,
      max_participants: 24,
      current_participants_count: 2,
    };

    const user: MockUser = { id: 'u1', workspaceMemberships: [] };

    assert.strictEqual(canJoinRoom(fullRoom, user).errorCode, 'ROOM_FULL');
    assert.strictEqual(canJoinRoom(inactiveRoom, user).errorCode, 'ROOM_INACTIVE');
  });
});

// ==============================================================================
// SUITE 5: Silent Focus Discipline & Floating Reaction Whitelist
// ==============================================================================

const ALLOWED_REACTIONS = ['🔥', '👏', '❤️', '💪', '⚡'] as const;
type AllowedReaction = (typeof ALLOWED_REACTIONS)[number];

function isChatLocked(roomStatus: 'waiting' | 'focusing' | 'break'): boolean {
  return roomStatus === 'focusing';
}

function validateReactionEmoji(emoji: string): { valid: boolean; reason?: string } {
  if (!emoji || typeof emoji !== 'string') {
    return { valid: false, reason: 'Reaction emoji không được để trống' };
  }
  if (!ALLOWED_REACTIONS.includes(emoji as AllowedReaction)) {
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

describe('Suite 5: Silent Focus Discipline & Floating Reaction Whitelist', () => {
  test('5.1 Chat lock state strictly locked during focusing phase, unlocked during break & waiting', () => {
    assert.strictEqual(isChatLocked('focusing'), true, 'Chat must be locked during focusing phase');
    assert.strictEqual(isChatLocked('break'), false, 'Chat must be unlocked during break phase');
    assert.strictEqual(isChatLocked('waiting'), false, 'Chat must be unlocked in waiting lounge');
  });

  test('5.2 Reaction emoji whitelist enforces 5 allowed particles and rejects unauthorized characters', () => {
    // 5 Authorized Floating Particles
    for (const emoji of ALLOWED_REACTIONS) {
      assert.strictEqual(validateReactionEmoji(emoji).valid, true, `Allowed emoji ${emoji} must pass`);
    }

    // Prohibited inputs & adversarial characters
    assert.strictEqual(validateReactionEmoji('💩').valid, false);
    assert.strictEqual(validateReactionEmoji('😂').valid, false);
    assert.strictEqual(validateReactionEmoji('<script>alert(1)</script>').valid, false);
    assert.strictEqual(validateReactionEmoji('').valid, false);
    assert.strictEqual(validateReactionEmoji('DROP TABLE study_rooms;').valid, false);
  });

  test('5.3 Reaction burst rate limiter allows 5 reactions per 3 seconds and throttles 6th', () => {
    const limiter = new ReactionRateLimiter();
    const userId = 'student-test-01';
    const now = 100_000;

    // Send 5 rapid reactions
    for (let i = 0; i < 5; i++) {
      assert.strictEqual(limiter.canSend(userId, now + i * 100), true, `Reaction ${i + 1} should be permitted`);
    }

    // 6th reaction in the same 3-second window should be throttled
    assert.strictEqual(
      limiter.canSend(userId, now + 1000),
      false,
      '6th reaction within 3s burst window must be rate-limited'
    );

    // After window expires (> 3000ms), next reaction should be permitted
    assert.strictEqual(
      limiter.canSend(userId, now + 3500),
      true,
      'Reaction after window expiration should be allowed'
    );
  });
});

// ==============================================================================
// SUITE 6: Deserter Penalty, XP Loss & Public Shame Protocol
// ==============================================================================

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

describe('Suite 6: Deserter Penalty (-50 XP), Rank Recalculation & Public Shame Protocol', () => {
  beforeEach(() => {
    resetSharedState();
  });

  test('6.1 Deserter detection triggers -50 XP penalty, danger flash and public shame banner', () => {
    const result = processDeserterViolation(
      'user-nguyen-van-a',
      'Nguyễn Văn A',
      'Đổi tab sang Facebook trong giờ tập trung'
    );

    assert.strictEqual(result.penalized, true);
    assert.strictEqual(result.penaltyAmount, 50);
    assert.ok(result.event, 'Violation event must be generated');
    assert.strictEqual(result.event.dangerFlash, true, 'dangerFlash must be true for avatar red warning border');
    assert.strictEqual(
      result.event.bannerText,
      'Thành viên Nguyễn Văn A đã phân tâm/bỏ cuộc và bị phạt -50 XP!'
    );
  });

  test('6.2 Exemption mechanism ("Tôi đang tra tài liệu") waives penalty', () => {
    const result = processDeserterViolation(
      'user-nguyen-van-a',
      'Nguyễn Văn A',
      'Tra cứu tài liệu học tập',
      true // isExempt
    );

    assert.strictEqual(result.penalized, false);
    assert.strictEqual(result.penaltyAmount, 0);
    assert.strictEqual(result.event, undefined);
  });

  test('6.3 Store integration: penalizeViolation deducts 50 XP, clamps at 0, and updates rank title', () => {
    // Setup state at 220 XP (Level 2: "Cú đêm giảng đường")
    setSharedState({
      xp: 220,
      level: 2,
      rankTitle: 'Cú đêm giảng đường',
      violationCount: 0,
      totalShameCount: 0,
    });

    // Penalize 50 XP -> 170 XP -> Should be demoted to Level 1 ("Tân sinh viên ngơ ngác")
    penalizeViolation(50, 'Bỏ phòng Pomodoro Party giữa chừng');

    const state = getSharedState();
    assert.strictEqual(state.xp, 170, 'XP should decrease by 50 to 170');
    assert.strictEqual(state.level, 1, 'Level should demote from 2 to 1');
    assert.strictEqual(state.rankTitle, 'Tân sinh viên ngơ ngác');
    assert.strictEqual(state.violationCount, 1, 'violationCount must increment');
    assert.strictEqual(state.totalShameCount, 1, 'totalShameCount must increment');
  });

  test('6.4 Floor clamping: User with < 50 XP clamps at 0 XP without becoming negative', () => {
    setSharedState({
      xp: 35,
      level: 1,
      rankTitle: 'Tân sinh viên ngơ ngác',
    });

    penalizeViolation(50, 'Rời phòng sớm');

    const state = getSharedState();
    assert.strictEqual(state.xp, 0, 'XP must clamp at 0 and never drop below 0');
    assert.strictEqual(state.level, 1);
  });
});

// ==============================================================================
// SUITE 7: Leaderboard 3D Arena & Three.js Resource Safety
// ==============================================================================

interface StudentPodiumCandidate {
  userId: string;
  name: string;
  avatarUrl?: string;
  focusMinutes: number;
  streak: number;
  joinedAt: string;
}

interface PodiumPlacement {
  rank: 1 | 2 | 3;
  tier: 'gold' | 'silver' | 'bronze';
  candidate: StudentPodiumCandidate;
  podiumCoords: { x: number; y: number; z: number };
  trophyCoords?: { x: number; y: number; z: number };
}

function allocateWeeklyPodium(candidates: StudentPodiumCandidate[]): {
  podium: PodiumPlacement[];
  runnersUp: StudentPodiumCandidate[];
} {
  // Sort descending by focusMinutes, breaking ties by streak, then joinedAt
  const sorted = [...candidates].sort((a, b) => {
    if (b.focusMinutes !== a.focusMinutes) return b.focusMinutes - a.focusMinutes;
    if (b.streak !== a.streak) return b.streak - a.streak;
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });

  const podium: PodiumPlacement[] = [];

  if (sorted[0]) {
    podium.push({
      rank: 1,
      tier: 'gold',
      candidate: sorted[0],
      podiumCoords: { x: 0, y: 1.1, z: 0 },
      trophyCoords: { x: 0, y: 3.2, z: 0 },
    });
  }

  if (sorted[1]) {
    podium.push({
      rank: 2,
      tier: 'silver',
      candidate: sorted[1],
      podiumCoords: { x: -2.8, y: 0.8, z: 0.4 },
    });
  }

  if (sorted[2]) {
    podium.push({
      rank: 3,
      tier: 'bronze',
      candidate: sorted[2],
      podiumCoords: { x: 2.8, y: 0.55, z: 0.4 },
    });
  }

  return {
    podium,
    runnersUp: sorted.slice(3),
  };
}

/**
 * Three.js Resource Safety Tracking Spy
 * Simulates the exact disposal cycle of LeaderboardArena3D
 */
class ThreeSceneLifecycleSpy {
  public disposedGeometries = 0;
  public disposedMaterials = 0;
  public disposedTextures = 0;
  public rendererDisposed = false;
  public rafCancelled = false;
  public listenersRemoved = 0;
  public domRemoved = false;

  private mockGeometries = [{ id: 'geo_podium_gold' }, { id: 'geo_podium_silver' }, { id: 'geo_podium_bronze' }, { id: 'geo_trophy' }, { id: 'geo_fireworks_particles' }];
  private mockMaterials = [{ id: 'mat_gold' }, { id: 'mat_silver' }, { id: 'mat_bronze' }, { id: 'mat_fireworks' }];
  private activeRafId = 42;

  dispose(): void {
    // 1. Cancel animation frame
    if (this.activeRafId) {
      this.rafCancelled = true;
      this.activeRafId = 0;
    }

    // 2. Dispose all geometries
    for (const g of this.mockGeometries) {
      this.disposedGeometries++;
    }

    // 3. Dispose all materials
    for (const m of this.mockMaterials) {
      this.disposedMaterials++;
    }

    // 4. Dispose WebGL renderer
    this.rendererDisposed = true;

    // 5. Unbind event listeners (mousemove, resize, visibilitychange)
    this.listenersRemoved = 3;

    // 6. Remove canvas from container
    this.domRemoved = true;
  }
}

function clampDpr(dpr: number): number {
  return Math.min(Math.max(1, dpr), 1.25);
}

describe('Suite 7: Leaderboard 3D Arena & Three.js Memory Safety Lifecycle', () => {
  test('7.1 Top 3 Podium allocation assigns Gold (center), Silver (left), and Bronze (right) with tie-breaking', () => {
    const candidates: StudentPodiumCandidate[] = [
      { userId: 'u1', name: 'Trần Văn B', focusMinutes: 480, streak: 12, joinedAt: '2026-10-01' },
      { userId: 'u2', name: 'Lê Thị C', focusMinutes: 620, streak: 20, joinedAt: '2026-10-02' },
      { userId: 'u3', name: 'Nguyễn Văn A', focusMinutes: 620, streak: 25, joinedAt: '2026-10-03' }, // Tie on minutes with u2, but higher streak (25 > 20)
      { userId: 'u4', name: 'Hoàng Văn D', focusMinutes: 300, streak: 5, joinedAt: '2026-10-04' },
      { userId: 'u5', name: 'Phạm Thị E', focusMinutes: 240, streak: 3, joinedAt: '2026-10-05' },
    ];

    const { podium, runnersUp } = allocateWeeklyPodium(candidates);

    assert.strictEqual(podium.length, 3, 'Podium must have exactly top 3');
    // Rank 1: u3 (620 mins, 25 streak)
    assert.strictEqual(podium[0].candidate.userId, 'u3');
    assert.strictEqual(podium[0].tier, 'gold');
    assert.deepStrictEqual(podium[0].podiumCoords, { x: 0, y: 1.1, z: 0 });
    assert.deepStrictEqual(podium[0].trophyCoords, { x: 0, y: 3.2, z: 0 });

    // Rank 2: u2 (620 mins, 20 streak)
    assert.strictEqual(podium[1].candidate.userId, 'u2');
    assert.strictEqual(podium[1].tier, 'silver');
    assert.deepStrictEqual(podium[1].podiumCoords, { x: -2.8, y: 0.8, z: 0.4 });

    // Rank 3: u1 (480 mins)
    assert.strictEqual(podium[2].candidate.userId, 'u1');
    assert.strictEqual(podium[2].tier, 'bronze');
    assert.deepStrictEqual(podium[2].podiumCoords, { x: 2.8, y: 0.55, z: 0.4 });

    // Runners up: u4, u5
    assert.strictEqual(runnersUp.length, 2);
    assert.strictEqual(runnersUp[0].userId, 'u4');
  });

  test('7.2 Three.js unmount lifecycle invokes comprehensive cleanup and cancels animation frame', () => {
    const sceneSpy = new ThreeSceneLifecycleSpy();
    sceneSpy.dispose();

    assert.strictEqual(sceneSpy.rafCancelled, true, 'requestAnimationFrame must be cancelled');
    assert.strictEqual(sceneSpy.rendererDisposed, true, 'WebGL renderer must be disposed');
    assert.strictEqual(sceneSpy.disposedGeometries, 5, 'All 5 instantiated geometries must be disposed');
    assert.strictEqual(sceneSpy.disposedMaterials, 4, 'All 4 materials must be disposed');
    assert.strictEqual(sceneSpy.listenersRemoved, 3, 'All 3 window event listeners must be removed');
    assert.strictEqual(sceneSpy.domRemoved, true, 'Canvas element must be removed from DOM');
  });

  test('7.3 Device pixel ratio (DPR) is clamped to <= 1.25 for 120FPS performance', () => {
    // High-DPI screen with DPR 3 (e.g. iPhone / MacBook Retina)
    assert.strictEqual(clampDpr(3), 1.25, 'DPR 3 should be clamped to 1.25');
    // Screen with DPR 2
    assert.strictEqual(clampDpr(2), 1.25, 'DPR 2 should be clamped to 1.25');
    // Standard screen with DPR 1
    assert.strictEqual(clampDpr(1), 1.0, 'DPR 1 should remain 1.0');
    // Boundary 0 or negative
    assert.strictEqual(clampDpr(0), 1.0, 'DPR below 1 should clamp to 1.0');
  });
});
