/**
 * Adversarial Challenger Test Suite for Milestone 1
 * Targets:
 * 1. PostgreSQL 15/16 DDL Migration Syntax & Index Redundancy (006_pomodoro_party.sql)
 * 2. Realtime Publication Exception Skipping Hazard
 * 3. Row-Level Security (RLS) Leakage & Attack Vectors
 * 4. TypeScript Schema & Database Type Synchronization
 * 5. Study Rooms Service Resiliency & Empirical Edge-Case Stress Testing
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Import service layer to test real methods
import {
  listStudyRooms,
  getStudyRoomByCode,
  getStudyRoomById,
  createStudyRoom,
  updateStudyRoom,
  verifyRoomPin,
  joinStudyRoom,
  leaveStudyRoom,
  getStudyRoomMembers,
  updateMemberStatus,
  pingStudyRoomMember,
  postRoomReaction,
  getRecentReactions,
  getWeeklyStudyLeaderboard,
  generateRoomCode,
  calculateRemainingSeconds,
  filterRoomsByTab,
} from '../src/lib/study-rooms-service.ts';

const rootDir = path.resolve(process.cwd(), '..');
const migration006Path = path.join(rootDir, 'supabase', 'migrations', '006_pomodoro_party.sql');
const databaseTsPath = path.resolve(process.cwd(), 'src', 'types', 'database.ts');

describe('Adversarial M1 Suite 1: PostgreSQL 15/16 DDL Grammar & Schema Analysis', () => {
  const sql = fs.readFileSync(migration006Path, 'utf8');

  test('1.1 DDL does not use deprecated PostgreSQL syntax', () => {
    // In PG 15/16, WITH OIDS is removed, CREATE TABLE ... WITHOUT OIDS is deprecated
    assert.doesNotMatch(sql, /WITH\s+OIDS/i, 'DDL should not use deprecated OIDS');
    // Ensure all tables use public schema
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.study_rooms/i);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.study_room_members/i);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.room_reactions/i);
  });

  test('1.2 UUID default function is gen_random_uuid() (standard for PG 13+)', () => {
    assert.match(sql, /id UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)/i);
  });

  test('1.3 Empirical Check: Redundant B-Tree index on unique column "code"', () => {
    // Column 'code' is defined as VARCHAR(16) NOT NULL UNIQUE
    // PostgreSQL automatically creates a unique index for UNIQUE constraints.
    // Creating idx_study_rooms_code on (code) creates a redundant duplicate index.
    const hasUniqueConstraintOnCode = /code\s+VARCHAR\(16\)\s+NOT\s+NULL\s+UNIQUE/i.test(sql);
    const hasSeparateIndexOnCode = /CREATE INDEX IF NOT EXISTS idx_study_rooms_code ON public\.study_rooms\(code\)/i.test(sql);

    assert.ok(hasUniqueConstraintOnCode, 'code has UNIQUE constraint');
    assert.ok(hasSeparateIndexOnCode, 'idx_study_rooms_code is defined');
  });

  test('1.4 Empirical Check: Redundant index on unique constraint (room_id, user_id)', () => {
    const hasUniqueConstraint = /CONSTRAINT uq_study_room_member UNIQUE \(room_id, user_id\)/i.test(sql);
    const hasCompositeIndex = /CREATE INDEX IF NOT EXISTS idx_study_room_members_room_user ON public\.study_room_members\(room_id, user_id\)/i.test(sql);

    assert.ok(hasUniqueConstraint, 'study_room_members has UNIQUE (room_id, user_id)');
    assert.ok(hasCompositeIndex, 'idx_study_room_members_room_user is defined');
  });
});

describe('Adversarial M1 Suite 2: Realtime Publication Fault Hazard', () => {
  const sql = fs.readFileSync(migration006Path, 'utf8');

  test('2.1 Analyze PL/pgSQL DO block for publication registration', () => {
    const publicationBlockMatch = sql.match(/DO \$\$[\s\S]*?END \$\$;/i);
    assert.ok(publicationBlockMatch, 'Publication DO block must exist');

    const block = publicationBlockMatch[0];
    assert.match(block, /ALTER PUBLICATION supabase_realtime ADD TABLE public\.study_rooms;/i);
    assert.match(block, /ALTER PUBLICATION supabase_realtime ADD TABLE public\.study_room_members;/i);
    assert.match(block, /ALTER PUBLICATION supabase_realtime ADD TABLE public\.room_reactions;/i);

    // Hazard Verification:
    // If all 3 statements are in a single BEGIN...EXCEPTION block,
    // when study_rooms is already in the publication, line 1 throws duplicate_object,
    // jumping to EXCEPTION and skipping study_room_members and room_reactions.
    const subBeginBlocks = block.match(/BEGIN/gi);
    assert.equal(subBeginBlocks?.length, 1, 'Only 1 BEGIN block exists; all 3 statements share single exception handler');
  });

  test('2.2 Replica Identity is set to FULL for all 3 tables', () => {
    assert.match(sql, /ALTER TABLE public\.study_rooms REPLICA IDENTITY FULL;/i);
    assert.match(sql, /ALTER TABLE public\.study_room_members REPLICA IDENTITY FULL;/i);
    assert.match(sql, /ALTER TABLE public\.room_reactions REPLICA IDENTITY FULL;/i);
  });
});

describe('Adversarial M1 Suite 3: Row Level Security (RLS) Leakage & Policy Attack Vectors', () => {
  const sql = fs.readFileSync(migration006Path, 'utf8');

  test('3.1 RLS is enabled on all tables', () => {
    assert.match(sql, /ALTER TABLE public\.study_rooms ENABLE ROW LEVEL SECURITY;/i);
    assert.match(sql, /ALTER TABLE public\.study_room_members ENABLE ROW LEVEL SECURITY;/i);
    assert.match(sql, /ALTER TABLE public\.room_reactions ENABLE ROW LEVEL SECURITY;/i);
  });

  test('3.2 InitPlan optimization: all RLS checks wrap (SELECT auth.uid())', () => {
    const policyLines = sql.split('\n').filter(line =>
      /USING|WITH CHECK/i.test(line) && line.includes('auth.uid()')
    );
    for (const line of policyLines) {
      assert.match(
        line,
        /\(SELECT auth\.uid\(\)\)/,
        `Line should wrap auth.uid() in (SELECT auth.uid()): ${line}`
      );
    }
  });

  test('3.3 Security Definier helper functions specify search_path = \'\'', () => {
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.is_study_room_member[\s\S]*?SECURITY DEFINER\s+SET search_path = ''/i);
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.is_study_room_host[\s\S]*?SECURITY DEFINER\s+SET search_path = ''/i);
  });

  test('3.4 Adversarial Audit: Private PIN room security in SELECT policy', () => {
    const selectPolicy = sql.match(/CREATE POLICY "Study rooms viewable by all active"[\s\S]*?;/i);
    assert.ok(selectPolicy, 'Study rooms SELECT policy exists');
    const policyStr = selectPolicy[0];
    assert.ok(policyStr.includes('is_active = true'), 'SELECT policy allows all active rooms without column filtering');
  });

  test('3.5 Adversarial Audit: Host ID Spoofing in study_rooms INSERT policy', () => {
    const insertPolicy = sql.match(/CREATE POLICY "Study rooms insert authenticated"[\s\S]*?;/i);
    assert.ok(insertPolicy, 'Study rooms INSERT policy exists');
    const policyStr = insertPolicy[0];
    assert.ok(policyStr.includes('OR (SELECT auth.uid()) IS NOT NULL'), 'Contains redundant/spoofable authenticated bypass');
  });
});

describe('Adversarial M1 Suite 4: TypeScript Schema & Database Type Synchronization', () => {
  const ts = fs.readFileSync(databaseTsPath, 'utf8');

  test('4.1 All 3 tables exist in Database["public"]["Tables"]', () => {
    assert.match(ts, /study_rooms:\s*\{/);
    assert.match(ts, /study_room_members:\s*\{/);
    assert.match(ts, /room_reactions:\s*\{/);
  });

  test('4.2 Helper functions exist in Database["public"]["Functions"]', () => {
    assert.match(ts, /is_study_room_member:\s*\{/);
    assert.match(ts, /is_study_room_host:\s*\{/);
  });

  test('4.3 Enums in TypeScript match PostgreSQL check constraints exactly', () => {
    assert.match(ts, /'public'\s*\|\s*'private_pin'\s*\|\s*'workspace'/);
    assert.match(ts, /'waiting'\s*\|\s*'focusing'\s*\|\s*'break'/);
    assert.match(ts, /'focusing'\s*\|\s*'distracted'\s*\|\s*'break'/);
  });

  test('4.4 Exported type aliases exist', () => {
    assert.match(ts, /export type StudyRoomRow =/);
    assert.match(ts, /export type StudyRoomMemberRow =/);
    assert.match(ts, /export type RoomReactionRow =/);
    assert.match(ts, /export type StudyRoomType =/);
    assert.match(ts, /export type StudyRoomStatus =/);
    assert.match(ts, /export type StudyRoomMemberStatus =/);
  });
});

describe('Adversarial M1 Suite 5: Study Rooms Service Empirical Stress Tests', () => {
  test('5.1 listStudyRooms returns seeded rooms and exposes keyword filter overlap anomaly', async () => {
    const allRooms = await listStudyRooms();
    assert.ok(allRooms.length >= 5, `Expected >= 5 rooms, got ${allRooms.length}`);

    const generalRooms = filterRoomsByTab(allRooms, 'general');
    const majorRooms = filterRoomsByTab(allRooms, 'major');

    // Empirical check: VIP-77 ('Thuật toán chuyên sâu') matches both 'general' and 'major'
    const overlapCodes = generalRooms
      .filter(r => majorRooms.some(m => m.code === r.code))
      .map(r => r.code);

    assert.ok(overlapCodes.includes('VIP-77'), 'Empirical finding: "Thuật toán" matches "toán" in general filter');
  });

  test('5.2 Room PIN verification: valid pin returns true, wrong pin returns false, public room returns true', async () => {
    // VIP-77 is a private room with pin 888888
    const vipOk = await verifyRoomPin('VIP-77', '888888');
    assert.equal(vipOk, true, 'Valid PIN should succeed');

    const vipBad = await verifyRoomPin('VIP-77', '000000');
    assert.equal(vipBad, false, 'Invalid PIN should fail');

    // GT1-01 is a public room
    const publicOk = await verifyRoomPin('GT1-01', 'whatever');
    assert.equal(publicOk, true, 'Public room should always pass PIN check');

    // Non-existent room
    const nonExistent = await verifyRoomPin('NO-ROOM', '123456');
    assert.equal(nonExistent, false, 'Non-existent room should return false');
  });

  test('5.3 Room creation stress: auto-generates 6-character code if omitted', async () => {
    const created = await createStudyRoom({
      title: 'Phòng học giải thuật đồ thị',
      subject: 'Khoa học máy tính',
      room_type: 'public',
      focus_duration_minutes: 50,
      break_duration_minutes: 10,
    });

    assert.ok(created.id, 'Should generate UUID id');
    assert.ok(created.code.length >= 6, `Code should be at least 6 chars: ${created.code}`);
    assert.equal(created.current_status, 'waiting');
    assert.equal(created.is_active, true);

    const retrieved = await getStudyRoomByCode(created.code);
    assert.ok(retrieved, 'Should retrieve created room by code');
    assert.equal(retrieved?.id, created.id);
  });

  test('5.4 Room member operations: join, ping, update status, and leave', async () => {
    const roomId = 'room-gt1-01';
    const testUserId = 'test-student-adversary-99';

    // Correct join signature: (roomId, userId, initialStatus, userName, avatarUrl)
    const joined = await joinStudyRoom(
      roomId,
      testUserId,
      'focusing',
      'Adversary Tester',
      '/avatars/test.png'
    );
    assert.equal(joined.room_id, roomId);
    assert.equal(joined.user_id, testUserId);
    assert.equal(joined.status, 'focusing');
    assert.equal(joined.name, 'Adversary Tester');

    // Update status to distracted
    const updated = await updateMemberStatus(roomId, testUserId, 'distracted');
    assert.equal(updated.status, 'distracted');

    // Ping
    const pinged = await pingStudyRoomMember(roomId, testUserId);
    assert.ok(pinged, 'Ping should succeed');

    // Verify member in list
    const members = await getStudyRoomMembers(roomId);
    assert.ok(members.some(m => m.user_id === testUserId));

    // Leave
    const left = await leaveStudyRoom(roomId, testUserId);
    assert.equal(left, true, 'Leave should succeed');

    // Verify no longer in list
    const afterMembers = await getStudyRoomMembers(roomId);
    assert.ok(!afterMembers.some(m => m.user_id === testUserId));
  });

  test('5.5 Reaction posting and retrieval with bounded buffer', async () => {
    const roomId = 'room-gt1-01';
    const reaction = await postRoomReaction(roomId, 'user-tester-1', '⚡');
    assert.equal(reaction.emoji, '⚡');
    assert.equal(reaction.room_id, roomId);

    const recent = await getRecentReactions(roomId, 10);
    assert.ok(recent.length > 0);
    assert.ok(recent.some(r => r.emoji === '⚡'));
  });

  test('5.6 Weekly Leaderboard returns sorted students with ranks 1..N', async () => {
    const leaderboard = await getWeeklyStudyLeaderboard();
    assert.ok(leaderboard.length >= 3, 'Should have at least top 3 students');
    for (let i = 0; i < leaderboard.length; i++) {
      assert.equal(leaderboard[i].rank, i + 1, `Rank should match index + 1: ${leaderboard[i].rank}`);
      if (i > 0) {
        assert.ok(
          leaderboard[i - 1].totalFocusHours >= leaderboard[i].totalFocusHours,
          'Leaderboard should be sorted descending by totalFocusHours'
        );
      }
    }
  });

  test('5.7 Timer calculation utility handles ongoing, expired, and waiting states', () => {
    // Waiting room: no start time
    assert.equal(calculateRemainingSeconds(null, 45), 45 * 60);

    // 10 minutes elapsed of 50 minutes -> 40 minutes remaining = 2400s
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const remaining = calculateRemainingSeconds(tenMinAgo, 50);
    assert.ok(remaining >= 2398 && remaining <= 2402, `Expected ~2400s, got ${remaining}`);

    // Expired room: 60 minutes elapsed of 50 minutes -> 0 remaining
    const sixtyMinAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    assert.equal(calculateRemainingSeconds(sixtyMinAgo, 50), 0);

    // Vulnerability check: invalid date produces NaN
    assert.ok(Number.isNaN(calculateRemainingSeconds('invalid-date', 45)), 'Invalid date produces NaN');
  });
});
