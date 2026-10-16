import test from 'node:test';
import assert from 'node:assert/strict';

// R1 imports
import {
  canManageWorkspaceRole,
  isLastOwnerChangeBlocked,
  hasWorkspacePermission,
  WORKSPACE_ROLES,
  WORKSPACE_PERMISSIONS,
  type WorkspaceRole,
  type WorkspacePermission,
} from '../src/lib/workspace-permissions.ts';

import {
  getStoredWorkspaces,
  getWorkspaceById,
  createWorkspace,
  createWorkspaceTask,
  updateWorkspaceTask,
  moveWorkspaceTask,
  deleteWorkspaceTask,
  toggleWorkspaceSubtask,
  inviteWorkspaceMember,
  changeWorkspaceMemberRole,
  removeWorkspaceMember,
  calculateWorkspaceProgress,
  resetWorkspacesToDefault,
} from '../src/lib/workspace-engine.ts';

// R2 imports
import {
  getStoredClubs,
  getClubById,
  recordClubTransaction,
  toggleClubEventRsvp,
  createClubEvent,
  generateIcsForEvent,
  resetClubsToDefault,
} from '../src/lib/club-engine.ts';

// R3 imports
import {
  calculateRadarCoordinate,
  calculateOverallIndex,
  calculatePasswordStrength,
  validateTotpCode,
  synthesizeNotificationsFeed,
  filterNotifications,
  getNotificationTabCounts,
  getUnreadCount,
  deleteNoticeWithUndo,
} from '../src/lib/notifications-engine.ts';

import { exportToIcs, parseFromIcs, type CalendarEvent } from '../src/lib/ics-calendar.ts';

// =========================================================================
// SECTION 1: R1 WORKSPACES & RBAC ADVERSARIAL STRESS TESTING
// =========================================================================

test('ADV-R1.1: ADMIN privilege escalation prevention (cannot promote to or demote OWNER)', () => {
  // 1. ADMIN cannot change OWNER's role to anything
  assert.equal(canManageWorkspaceRole('ADMIN', 'OWNER', 'ADMIN'), false);
  assert.equal(canManageWorkspaceRole('ADMIN', 'OWNER', 'VIEWER'), false);
  assert.equal(canManageWorkspaceRole('ADMIN', 'OWNER', 'MEMBER'), false);

  // 2. ADMIN cannot promote any member to OWNER
  assert.equal(canManageWorkspaceRole('ADMIN', 'MEMBER', 'OWNER'), false);
  assert.equal(canManageWorkspaceRole('ADMIN', 'MANAGER', 'OWNER'), false);
  assert.equal(canManageWorkspaceRole('ADMIN', 'ADMIN', 'OWNER'), false);
  assert.equal(canManageWorkspaceRole('ADMIN', 'VIEWER', 'OWNER'), false);

  // 3. ADMIN can only manage MANAGER, MEMBER, VIEWER
  assert.equal(canManageWorkspaceRole('ADMIN', 'MEMBER', 'MANAGER'), true);
  assert.equal(canManageWorkspaceRole('ADMIN', 'MANAGER', 'MEMBER'), true);
  assert.equal(canManageWorkspaceRole('ADMIN', 'VIEWER', 'MEMBER'), true);

  // 4. MANAGER, MEMBER, VIEWER cannot manage anyone
  const nonAdminRoles: WorkspaceRole[] = ['MANAGER', 'MEMBER', 'VIEWER'];
  for (const role of nonAdminRoles) {
    for (const target of WORKSPACE_ROLES) {
      assert.equal(canManageWorkspaceRole(role, target, 'MEMBER'), false);
    }
  }
});

test('ADV-R1.2: Sole OWNER demotion & deletion protection in live workspace engine', () => {
  resetWorkspacesToDefault();
  const ws = getWorkspaceById('ws-ai-capstone');
  assert.ok(ws, 'Workspace ws-ai-capstone must exist');

  // Verify there is currently 1 OWNER (mem-1)
  const owners = ws.members.filter((m) => m.role === 'OWNER');
  assert.equal(owners.length, 1);
  const soleOwnerId = owners[0]!.id;

  // Attempt 1: Demote sole OWNER to ADMIN
  const demoteRes = changeWorkspaceMemberRole('ws-ai-capstone', soleOwnerId, 'ADMIN', 'OWNER');
  assert.equal(demoteRes.success, false, 'Demoting sole OWNER must be blocked');
  assert.match(demoteRes.error || '', /Không thể hạ cấp OWNER duy nhất/);

  // Attempt 2: Remove sole OWNER from workspace
  const removeRes = removeWorkspaceMember('ws-ai-capstone', soleOwnerId, 'OWNER');
  assert.equal(removeRes.success, false, 'Removing sole OWNER must be blocked');
  assert.match(removeRes.error || '', /Không thể xóa OWNER duy nhất/);

  // Add a second OWNER and verify demotion of one OWNER is now permitted
  const newOwner = inviteWorkspaceMember('ws-ai-capstone', {
    name: 'Co-Owner',
    email: 'coowner@hust.edu.vn',
    avatar: 'https://avatar.url',
    role: 'OWNER',
  });
  assert.ok(newOwner);

  const demoteWithTwoOwners = changeWorkspaceMemberRole('ws-ai-capstone', soleOwnerId, 'ADMIN', 'OWNER');
  assert.equal(demoteWithTwoOwners.success, true, 'Demotion should succeed when > 1 OWNER exists');
});

test('ADV-R1.3: VIEWER permission matrix strictly forbids all mutating actions', () => {
  const mutatingPermissions: WorkspacePermission[] = [
    'workspace.update',
    'workspace.delete',
    'member.invite',
    'member.updateRole',
    'member.remove',
    'task.create',
    'task.update',
    'task.assign',
    'task.delete',
    'calendar.create',
    'calendar.update',
    'finance.manage',
  ];

  for (const perm of mutatingPermissions) {
    assert.equal(
      hasWorkspacePermission('VIEWER', perm),
      false,
      `VIEWER must not have permission ${perm}`
    );
  }

  // VIEWER must only have view permissions
  assert.equal(hasWorkspacePermission('VIEWER', 'workspace.view'), true);
  assert.equal(hasWorkspacePermission('VIEWER', 'member.view'), true);
  assert.equal(hasWorkspacePermission('VIEWER', 'finance.view'), true);
});

test('ADV-R1.4: Progress calculation boundary handling (empty, 100%, 0%, large task lists)', () => {
  assert.equal(calculateWorkspaceProgress([]), 0);

  const allDone = [
    { id: '1', status: 'done' },
    { id: '2', status: 'done' },
  ] as any;
  assert.equal(calculateWorkspaceProgress(allDone), 100);

  const halfDone = [
    { id: '1', status: 'done' },
    { id: '2', status: 'todo' },
    { id: '3', status: 'doing' },
    { id: '4', status: 'review' },
  ] as any;
  assert.equal(calculateWorkspaceProgress(halfDone), 25);

  // 1 out of 3 = 33%
  const oneOfThree = [
    { id: '1', status: 'done' },
    { id: '2', status: 'todo' },
    { id: '3', status: 'todo' },
  ] as any;
  assert.equal(calculateWorkspaceProgress(oneOfThree), 33);
});

// =========================================================================
// SECTION 2: R2 CLUBS & TREASURY ADVERSARIAL STRESS TESTING
// =========================================================================

test('ADV-R2.1: Club c4 exists and resolves under fresh/reseeded state', () => {
  resetClubsToDefault();
  const c4 = getClubById('c4');
  assert.ok(c4, 'Club c4 (CSC) must resolve without returning undefined');
  assert.equal(c4.id, 'c4');
  assert.equal(c4.name, 'CLB Cờ vua & Chiến thuật');
  assert.ok(c4.generalFundBalance > 0);
  assert.ok(c4.events.length > 0);
  assert.ok(c4.members.length > 0);
});

test('ADV-R2.2: Treasury overdraft attack vectors (exact balance + 1, negative amounts, NaN)', () => {
  resetClubsToDefault();
  const c1 = getClubById('c1')!;
  const currentGeneral = c1.generalFundBalance;

  // Vector 1: Attempt to spend exactly currentGeneral + 1 VND
  const overdraftRes = recordClubTransaction('c1', {
    type: 'expense',
    category: 'Hậu cần & Thiết bị',
    fundType: 'general',
    amount: currentGeneral + 1,
    description: 'Overdraft attack 1 VND above limit',
    date: '2026-10-18',
    createdByName: 'Attacker',
  });
  assert.equal(overdraftRes.success, false, 'Overdraft must be rejected');
  assert.match(overdraftRes.error || '', /không đủ/);

  // Vector 2: Negative amount transaction
  const negativeRes = recordClubTransaction('c1', {
    type: 'income',
    category: 'Hội phí',
    fundType: 'general',
    amount: -500000,
    description: 'Negative income exploit',
    date: '2026-10-18',
    createdByName: 'Attacker',
  });
  assert.equal(negativeRes.success, false, 'Negative transaction must be rejected');

  // Vector 3: Zero amount transaction
  const zeroRes = recordClubTransaction('c1', {
    type: 'expense',
    category: 'Sự kiện',
    fundType: 'general',
    amount: 0,
    description: 'Zero transaction',
    date: '2026-10-18',
    createdByName: 'Attacker',
  });
  assert.equal(zeroRes.success, false, 'Zero amount transaction must be rejected');

  // Vector 4: NaN amount transaction
  const nanRes = recordClubTransaction('c1', {
    type: 'expense',
    category: 'Sự kiện',
    fundType: 'general',
    amount: Number.NaN,
    description: 'NaN attack',
    date: '2026-10-18',
    createdByName: 'Attacker',
  });
  assert.equal(nanRes.success, false, 'NaN amount transaction must be rejected');
});

test('ADV-R2.3: Event RSVP capacity saturation stress harness', () => {
  resetClubsToDefault();

  // Create an event with tight capacity = 3
  const event = createClubEvent('c1', {
    title: 'Adversarial Capacity Test',
    description: 'Maximum 3 attendees',
    date: '2026-11-15',
    startTime: '14:00',
    endTime: '16:00',
    location: 'Lab 401',
    category: 'Workshop',
    department: 'Ban Chuyên môn & Kỹ thuật',
    maxAttendees: 3,
    bannerGradient: 'from-blue-500 to-indigo-500',
  });
  assert.ok(event);

  // Creator is attendee 1. Now simulate 10 concurrent student RSVPs
  const rsvpResults: boolean[] = [];
  for (let i = 2; i <= 10; i++) {
    const res = toggleClubEventRsvp('c1', event.id, `student-bot-${i}`);
    rsvpResults.push(res.success);
  }

  // Exactly attendees 2 and 3 should succeed (total = 3). Attendees 4 through 10 must fail!
  assert.equal(rsvpResults[0], true, 'Student 2 must succeed');
  assert.equal(rsvpResults[1], true, 'Student 3 must succeed (capacity reached)');
  assert.equal(rsvpResults[2], false, 'Student 4 must fail (exceeds capacity)');
  assert.equal(rsvpResults[3], false, 'Student 5 must fail');

  // Verify total attendees count in club store is exactly 3
  const finalClub = getClubById('c1')!;
  const finalEvent = finalClub.events.find((e) => e.id === event.id)!;
  assert.equal(finalEvent.attendeeIds.length, 3);
});

// =========================================================================
// SECTION 3: R3 PROFILE, NOTIFICATIONS & SETTINGS ADVERSARIAL STRESS TESTING
// =========================================================================

test('ADV-R3.1: 2FA TOTP validator robustness against malicious inputs', () => {
  // Valid TOTP
  assert.equal(validateTotpCode('123456'), true);
  assert.equal(validateTotpCode('000000'), true);
  assert.equal(validateTotpCode('999999'), true);

  // Invalid: whitespace within digits
  assert.equal(validateTotpCode('12 345'), false);
  assert.equal(validateTotpCode('123 456'), false);

  // Invalid: length != 6
  assert.equal(validateTotpCode('12345'), false);
  assert.equal(validateTotpCode('1234567'), false);
  assert.equal(validateTotpCode(''), false);

  // Invalid: non-digits
  assert.equal(validateTotpCode('12345a'), false);
  assert.equal(validateTotpCode('abcdef'), false);
  assert.equal(validateTotpCode('12.345'), false);
  assert.equal(validateTotpCode('-12345'), false);
  assert.equal(validateTotpCode('12345!'), false);
  assert.equal(validateTotpCode('🔥12345'), false);
});

test('ADV-R3.2: Password strength evaluation boundaries', () => {
  // Empty
  assert.equal(calculatePasswordStrength('').score, 0);

  // 7 chars (even with all charsets, fails length requirement)
  const len7 = calculatePasswordStrength('Aa1!bcd');
  assert.ok(len7.score <= 3);
  assert.ok(len7.feedback.includes('Tối thiểu 8 ký tự'));

  // 8 chars with only lowercase
  const lower8 = calculatePasswordStrength('abcdefgh');
  assert.equal(lower8.score, 1);
  assert.equal(lower8.label, 'Yếu');

  // 8 chars with lower + upper + number + special
  const fullPass = calculatePasswordStrength('Abc1234!');
  assert.equal(fullPass.score, 4);
  assert.equal(fullPass.label, 'Rất mạnh');
});

test('ADV-R3.3: iCalendar RFC 5545 export & import lossless roundtrip with special characters', () => {
  const specialEvents: CalendarEvent[] = [
    {
      id: 'adv-ev-1',
      title: 'Học nhóm: C++, Python & AI (Phòng 301, Tòa B; Kèm tài liệu)',
      date: '2026-10-25',
      start: '09:00',
      end: '11:30',
      type: 'study',
      location: 'Phòng 301, Tòa B; Đại học Công nghệ',
      description: 'Dòng 1: Ôn tập\nDòng 2: Làm bài tập lớn\nDòng 3: Báo cáo',
    },
  ];

  const icsString = exportToIcs(specialEvents);

  // Verify CRLF compliance
  assert.ok(icsString.includes('\r\n'), 'RFC 5545 requires CRLF line endings');
  assert.ok(icsString.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(icsString.endsWith('END:VCALENDAR\r\n'));

  // Roundtrip parse
  const parsed = parseFromIcs(icsString);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0]!.title, specialEvents[0]!.title);
  assert.equal(parsed[0]!.date, specialEvents[0]!.date);
  assert.equal(parsed[0]!.start, specialEvents[0]!.start);
  assert.equal(parsed[0]!.end, specialEvents[0]!.end);
  assert.equal(parsed[0]!.location, specialEvents[0]!.location);
  assert.equal(parsed[0]!.description, specialEvents[0]!.description);
});

test('ADV-R3.4: Notification deletion and undo restoration mechanics', () => {
  const initialNotices = [
    { id: 'notif-1', title: 'Deadline 1', detail: '', tab: 'Deadline' as const, time: '1h', isRead: false },
    { id: 'notif-2', title: 'Deadline 2', detail: '', tab: 'Deadline' as const, time: '2h', isRead: false },
  ];

  // Delete notice 1
  const { updated, deleted, restore } = deleteNoticeWithUndo(initialNotices, 'notif-1');
  assert.equal(updated.length, 1);
  assert.equal(deleted?.id, 'notif-1');
  assert.equal(updated[0]!.id, 'notif-2');

  // Trigger restore before expiration
  const restored = restore();
  assert.equal(restored.length, 2);
  assert.equal(restored[0]!.id, 'notif-1');
});
