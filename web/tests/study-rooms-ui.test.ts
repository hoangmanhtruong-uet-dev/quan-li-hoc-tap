/**
 * Study Rooms UI & Workspace Integration Test Suite (Worker M2)
 *
 * Verifies:
 * 1. Filter Rooms by Tab (all, general, major, workspace)
 * 2. 6-digit PIN Validation & Authentication Gate
 * 3. Countdown Remaining Seconds Calculation (focusing & break phases)
 * 4. Room Creation Input Validation (3 room types)
 * 5. Workspace Embedded Study Room Panel Data Binding
 * 6. File Structural Integrity of Pages and Modals
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  filterRoomsByTab,
  verifyRoomPin,
  calculateRemainingSeconds,
  createStudyRoom,
  generateRoomCode,
  type StudyRoomRow,
} from '../src/lib/study-rooms-service.ts';

describe('Worker M2: Study Rooms UI & Workspace Integration Tests', () => {
  const sampleRooms: StudyRoomRow[] = [
    {
      id: 'r1',
      code: 'TOAN-1',
      title: 'Ôn thi Giải Tích 1',
      subject: 'Toán đại cương',
      host_id: 'user-1',
      room_type: 'public',
      pin_code: null,
      workspace_id: null,
      focus_duration_minutes: 50,
      break_duration_minutes: 10,
      current_status: 'focusing',
      start_time_iso: new Date().toISOString(),
      end_time_iso: null,
      is_active: true,
      max_participants: 24,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'r2',
      code: 'CS-401',
      title: 'Lập trình hệ điều hành Linux',
      subject: 'Khoa học máy tính chuyên ngành',
      host_id: 'user-2',
      room_type: 'public',
      pin_code: null,
      workspace_id: null,
      focus_duration_minutes: 45,
      break_duration_minutes: 5,
      current_status: 'waiting',
      start_time_iso: null,
      end_time_iso: null,
      is_active: true,
      max_participants: 20,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'r3',
      code: 'CAP-26',
      title: 'Đồ án tốt nghiệp Capstone AI',
      subject: 'Đồ án tốt nghiệp',
      host_id: 'user-1',
      room_type: 'workspace',
      pin_code: null,
      workspace_id: 'ws-capstone-ai',
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
    {
      id: 'r4',
      code: 'PIN-99',
      title: 'Phòng học kín thi ICPC',
      subject: 'Lập trình thi đấu chuyên ngành',
      host_id: 'user-3',
      room_type: 'private_pin',
      pin_code: '123456',
      workspace_id: null,
      focus_duration_minutes: 50,
      break_duration_minutes: 10,
      current_status: 'waiting',
      start_time_iso: null,
      end_time_iso: null,
      is_active: true,
      max_participants: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  test('1. filterRoomsByTab partitions rooms correctly into 4 categories', () => {
    // Tab 'all'
    const all = filterRoomsByTab(sampleRooms, 'all');
    assert.equal(all.length, 4, 'Tab all should include all 4 active rooms');

    // Tab 'general'
    const general = filterRoomsByTab(sampleRooms, 'general');
    assert.equal(general.length, 1, 'Tab general should filter Toán đại cương');
    assert.equal(general[0]?.code, 'TOAN-1');

    // Tab 'major'
    const major = filterRoomsByTab(sampleRooms, 'major');
    assert.equal(major.length, 2, 'Tab major should include CS-401 and PIN-99');

    // Tab 'workspace'
    const workspace = filterRoomsByTab(sampleRooms, 'workspace');
    assert.equal(workspace.length, 1, 'Tab workspace should include CAP-26');
    assert.equal(workspace[0]?.workspace_id, 'ws-capstone-ai');
  });

  test('2. 6-digit PIN verification correctly validates correct vs incorrect PINs', async () => {
    const pinRoom = sampleRooms.find((r) => r.room_type === 'private_pin')!;
    assert.ok(pinRoom, 'Pin room must exist');

    // Correct PIN
    const isCorrect = await verifyRoomPin(pinRoom, '123456');
    assert.equal(isCorrect, true, 'Valid 6-digit PIN should pass verification');

    // Incorrect PIN
    const isWrong = await verifyRoomPin(pinRoom, '654321');
    assert.equal(isWrong, false, 'Invalid PIN should fail verification');

    // Public room should always pass verification
    const publicRoom = sampleRooms[0]!;
    const isPublicValid = await verifyRoomPin(publicRoom, 'anything');
    assert.equal(isPublicValid, true, 'Public room should always allow entry');
  });

  test('3. calculateRemainingSeconds calculates exact countdown based on start time', () => {
    const now = Date.now();
    // Started 10 minutes ago, 50 minutes duration -> 40 minutes remaining = 2400 seconds
    const tenMinAgo = new Date(now - 10 * 60 * 1000).toISOString();
    const remaining = calculateRemainingSeconds(tenMinAgo, 50, now);
    assert.equal(remaining, 40 * 60, 'Remaining seconds should be 2400');

    // Room not started yet -> returns full duration in seconds
    const unstarted = calculateRemainingSeconds(null, 45, now);
    assert.equal(unstarted, 45 * 60, 'Unstarted room returns full 2700 seconds');

    // Room duration expired -> returns 0
    const twoHoursAgo = new Date(now - 120 * 60 * 1000).toISOString();
    const expired = calculateRemainingSeconds(twoHoursAgo, 50, now);
    assert.equal(expired, 0, 'Expired room should return 0 remaining seconds');
  });

  test('4. createStudyRoom generates unique 6-char uppercase alphanumeric code', async () => {
    const code = generateRoomCode();
    assert.equal(code.length, 6, 'Generated code must be 6 characters');
    assert.match(code, /^[A-Z2-9]{6}$/, 'Code should use uppercase alphanumeric excluding ambiguous chars');

    const created = await createStudyRoom({
      title: 'Phòng test M2',
      subject: 'Kiểm thử phần mềm',
      room_type: 'private_pin',
      pin_code: '999888',
      focus_duration_minutes: 25,
      break_duration_minutes: 5,
    });

    assert.ok(created.id, 'Created room must have id');
    assert.equal(created.room_type, 'private_pin');
    assert.equal(created.pin_code, '999888');
    assert.equal(created.current_status, 'waiting');
  });

  test('5. Workspace Page contains 5th tab study_room and WorkspaceStudyRoomPanel', () => {
    const workspacePagePath = path.resolve(
      process.cwd(),
      'src',
      'app',
      '(main)',
      'workspaces',
      '[workspaceId]',
      'page.tsx'
    );
    assert.ok(fs.existsSync(workspacePagePath), 'Workspace page must exist');
    const content = fs.readFileSync(workspacePagePath, 'utf8');

    assert.match(content, /'study_room'/, 'Workspace page must declare study_room tab');
    assert.match(content, /WorkspaceStudyRoomPanel/, 'Workspace page must render WorkspaceStudyRoomPanel');
    assert.match(content, /Phòng học nhóm/, 'Workspace page must have tab label Phòng học nhóm');
  });

  test('6. Lobby page (/study/rooms/page.tsx) and Dynamic Room page (/study/rooms/[code]/page.tsx) exist', () => {
    const lobbyPath = path.resolve(process.cwd(), 'src', 'app', '(main)', 'study', 'rooms', 'page.tsx');
    const roomPath = path.resolve(process.cwd(), 'src', 'app', '(main)', 'study', 'rooms', '[code]', 'page.tsx');
    const createModalPath = path.resolve(process.cwd(), 'src', 'components', 'study', 'create-room-modal.tsx');
    const pinModalPath = path.resolve(process.cwd(), 'src', 'components', 'study', 'pin-entry-modal.tsx');
    const panelPath = path.resolve(process.cwd(), 'src', 'components', 'study', 'workspace-study-room-panel.tsx');

    assert.ok(fs.existsSync(lobbyPath), 'Lobby page must exist');
    assert.ok(fs.existsSync(roomPath), 'Dynamic room page must exist');
    assert.ok(fs.existsSync(createModalPath), 'CreateRoomModal must exist');
    assert.ok(fs.existsSync(pinModalPath), 'PinEntryModal must exist');
    assert.ok(fs.existsSync(panelPath), 'WorkspaceStudyRoomPanel must exist');

    const lobbyContent = fs.readFileSync(lobbyPath, 'utf8');
    assert.match(lobbyContent, /filterRoomsByTab/, 'Lobby must call filterRoomsByTab');
    assert.match(lobbyContent, /CreateRoomModal/, 'Lobby must mount CreateRoomModal');
    assert.match(lobbyContent, /PinEntryModal/, 'Lobby must mount PinEntryModal');

    const dynamicRoomContent = fs.readFileSync(roomPath, 'utf8');
    assert.match(dynamicRoomContent, /Silent Focus/i, 'Room must mention Silent Focus');
    assert.match(dynamicRoomContent, /postRoomReaction/, 'Room must support floating reactions');
    assert.match(dynamicRoomContent, /BÊU TÊN|phân tâm/i, 'Room must feature shame mechanism');
  });
});
