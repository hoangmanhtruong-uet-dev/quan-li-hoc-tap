import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getInitialClubs,
  getStoredClubs,
  persistClubs,
  getClubById,
  calculateClubTreasury,
  recordClubTransaction,
  toggleClubEventRsvp,
  generateIcsForEvent,
  createClubEvent,
  createClubTask,
  updateClubTaskStatus,
  deleteClubTask,
  addClubMember,
  updateClubMemberRole,
  removeClubMember,
  getClubMetrics,
  resetClubsToDefault,
  type ClubDetail,
} from '../src/lib/club-engine.ts';

describe('Milestone M2: Club Engine & Business Logic', () => {
  beforeEach(() => {
    resetClubsToDefault();
  });

  test('1. Initial Seed Retrieval: all 4 clubs c1..c4 exist and are well-formed', () => {
    const clubs = getStoredClubs();
    assert.equal(clubs.length, 4, 'Must seed exactly 4 clubs');

    const expectedIds = ['c1', 'c2', 'c3', 'c4'];
    expectedIds.forEach((id) => {
      const club = getClubById(id);
      assert.ok(club, `Club ${id} must exist in seed data`);
      assert.ok(club.name.length > 0, `Club ${id} must have a name`);
      assert.ok(club.shortName.length > 0, `Club ${id} must have a shortName`);
      assert.ok(club.members.length > 0, `Club ${id} must have members`);
      assert.ok(club.events.length > 0, `Club ${id} must have events`);
      assert.ok(club.transactions.length > 0, `Club ${id} must have transactions`);
      assert.ok(club.tasks.length > 0, `Club ${id} must have committee tasks`);
    });

    const c1 = getClubById('c1')!;
    assert.equal(c1.shortName, 'CTC');
    assert.equal(c1.category, 'Công nghệ');
    assert.equal(c1.generalFundBalance, 14500000);

    const c4 = getClubById('c4')!;
    assert.equal(c4.shortName, 'CSC');
    assert.equal(c4.category, 'Thể thao');
    assert.equal(c4.generalFundBalance, 3100000);
  });

  test('2. Financial Calculations: treasury math, income, expense, and fund updates', () => {
    const c1 = getClubById('c1')!;
    const treasury = calculateClubTreasury(c1);

    assert.equal(treasury.generalFund, 14500000);
    assert.equal(treasury.eventFund, 8200000);
    assert.equal(treasury.reserveFund, 5000000);
    assert.equal(treasury.totalBalance, 14500000 + 8200000 + 5000000);

    // Record new income into event fund
    const incomeRes = recordClubTransaction('c1', {
      type: 'income',
      category: 'Tài trợ',
      fundType: 'event',
      amount: 2000000,
      description: 'Tài trợ thêm từ cựu sinh viên',
      date: '2026-10-18',
      createdByName: 'Nguyễn Văn Minh',
    });
    assert.ok(incomeRes.success, 'Income transaction should succeed');

    const updatedC1 = getClubById('c1')!;
    assert.equal(updatedC1.eventFundBalance, 8200000 + 2000000);
    assert.equal(updatedC1.transactions[0].amount, 2000000);

    // Record expense from general fund
    const expenseRes = recordClubTransaction('c1', {
      type: 'expense',
      category: 'Hậu cần & Thiết bị',
      fundType: 'general',
      amount: 1500000,
      description: 'Mua văn phòng phẩm và dây mạng',
      date: '2026-10-19',
      createdByName: 'Phạm Minh Anh',
    });
    assert.ok(expenseRes.success, 'Expense transaction should succeed');

    const updatedC1AfterExpense = getClubById('c1')!;
    assert.equal(updatedC1AfterExpense.generalFundBalance, 14500000 - 1500000);

    // Insufficient fund test: try to spend more than available balance
    const overspendRes = recordClubTransaction('c1', {
      type: 'expense',
      category: 'Hậu cần & Thiết bị',
      fundType: 'reserve',
      amount: 999999999,
      description: 'Chi vượt quá số dư dự phòng',
      date: '2026-10-20',
      createdByName: 'Nguyễn Văn Minh',
    });
    assert.equal(overspendRes.success, false, 'Overspend transaction must fail');
    assert.match(overspendRes.error || '', /không đủ/);
  });

  test('3. Event RSVP & Capacity Limits: join, leave, and capacity enforcement', () => {
    const c1 = getClubById('c1')!;
    const event = c1.events[0];
    const testUserId = 'test-guest-student-999';

    // Ensure user is not currently in attendee list
    assert.ok(!event.attendeeIds.includes(testUserId));
    const initialAttendeeCount = event.attendeeIds.length;

    // Join event (RSVP)
    const joinRes = toggleClubEventRsvp('c1', event.id, testUserId);
    assert.ok(joinRes.success);
    assert.equal(joinRes.isAttending, true);

    const c1AfterJoin = getClubById('c1')!;
    const eventAfterJoin = c1AfterJoin.events.find((e) => e.id === event.id)!;
    assert.equal(eventAfterJoin.attendeeIds.length, initialAttendeeCount + 1);
    assert.ok(eventAfterJoin.attendeeIds.includes(testUserId));

    // Leave event (Cancel RSVP)
    const leaveRes = toggleClubEventRsvp('c1', event.id, testUserId);
    assert.ok(leaveRes.success);
    assert.equal(leaveRes.isAttending, false);

    const c1AfterLeave = getClubById('c1')!;
    const eventAfterLeave = c1AfterLeave.events.find((e) => e.id === event.id)!;
    assert.equal(eventAfterLeave.attendeeIds.length, initialAttendeeCount);
    assert.ok(!eventAfterLeave.attendeeIds.includes(testUserId));

    // Capacity check: create full event
    const smallEvent = createClubEvent('c1', {
      title: 'Small Round Table',
      description: 'Giới hạn 2 người',
      date: '2026-11-01',
      startTime: '10:00',
      endTime: '11:00',
      location: 'Room 101',
      category: 'Sinh hoạt',
      department: 'Ban Chủ nhiệm',
      maxAttendees: 2,
      bannerGradient: 'from-blue-500 to-indigo-500',
    });
    assert.ok(smallEvent);

    // Initial creator is 1 attendee. Add second attendee:
    const rsvp2 = toggleClubEventRsvp('c1', smallEvent.id, 'user-2');
    assert.ok(rsvp2.success);

    // Attempt 3rd attendee when maxAttendees is 2
    const rsvp3 = toggleClubEventRsvp('c1', smallEvent.id, 'user-3');
    assert.equal(rsvp3.success, false);
    assert.match(rsvp3.error || '', /đủ số lượng/);
  });

  test('4. iCalendar (.ics) export formatting (RFC 5545 compliance)', () => {
    const c1 = getClubById('c1')!;
    const event = c1.events[0];
    const icsContent = generateIcsForEvent(event, c1.name);

    assert.ok(icsContent.includes('BEGIN:VCALENDAR'));
    assert.ok(icsContent.includes('END:VCALENDAR'));
    assert.ok(icsContent.includes('BEGIN:VEVENT'));
    assert.ok(icsContent.includes('END:VEVENT'));
    assert.ok(icsContent.includes(`SUMMARY:[Campus Tech Club] ${event.title}`));
    assert.ok(icsContent.includes(`LOCATION:${event.location}`));
  });

  test('5. Committee Task Kanban: lifecycle transitions, creation and deletion', () => {
    const c1 = getClubById('c1')!;
    const initialTasksCount = c1.tasks.length;

    // Create a new task
    const newTask = createClubTask('c1', {
      title: 'Chuẩn bị phòng thi đấu & projector',
      description: 'Liên hệ văn phòng viện mượn phòng D9-501',
      department: 'Ban Chuyên môn & Kỹ thuật',
      assigneeIds: ['ctc-m2'],
      dueDate: '2026-10-23',
      priority: 'high',
      status: 'todo',
    });
    assert.ok(newTask);
    assert.ok(newTask.id.startsWith('ctsk-'));

    let club = getClubById('c1')!;
    assert.equal(club.tasks.length, initialTasksCount + 1);

    // Transition status: todo -> in_progress -> review -> done
    const updated1 = updateClubTaskStatus('c1', newTask.id, 'in_progress');
    assert.equal(updated1?.status, 'in_progress');

    const updated2 = updateClubTaskStatus('c1', newTask.id, 'review');
    assert.equal(updated2?.status, 'review');

    const updated3 = updateClubTaskStatus('c1', newTask.id, 'done');
    assert.equal(updated3?.status, 'done');

    // Delete task
    const deleted = deleteClubTask('c1', newTask.id);
    assert.ok(deleted);

    club = getClubById('c1')!;
    assert.equal(club.tasks.length, initialTasksCount);
    assert.ok(!club.tasks.some((t) => t.id === newTask.id));
  });

  test('6. Member Management: add, update role/department, and remove member', () => {
    const c1 = getClubById('c1')!;
    const initialMembers = c1.members.length;

    // Add new member
    const newMember = addClubMember('c1', {
      name: 'Đặng Quốc Anh',
      studentId: '20231999',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
      role: 'MEMBER',
      department: 'Ban Chuyên môn & Kỹ thuật',
    });
    assert.ok(newMember);
    assert.equal(newMember.activeScore, 70);

    let club = getClubById('c1')!;
    assert.equal(club.members.length, initialMembers + 1);

    // Update role & department
    const roleUpdated = updateClubMemberRole('c1', newMember.id, 'MANAGER', 'Ban Đối ngoại & Tài chính');
    assert.ok(roleUpdated);

    club = getClubById('c1')!;
    const foundMem = club.members.find((m) => m.id === newMember.id)!;
    assert.equal(foundMem.role, 'MANAGER');
    assert.equal(foundMem.department, 'Ban Đối ngoại & Tài chính');

    // Remove member
    const removed = removeClubMember('c1', newMember.id);
    assert.ok(removed);

    club = getClubById('c1')!;
    assert.equal(club.members.length, initialMembers);
    assert.ok(!club.members.some((m) => m.id === newMember.id));
  });

  test('7. Overall Hub Metrics: aggregates members, events, and total funds correctly', () => {
    const clubs = getStoredClubs();
    const metrics = getClubMetrics(clubs);

    assert.equal(metrics.totalClubs, 4);
    assert.ok(metrics.totalMembers > 10, 'Total members across 4 clubs should be > 10');
    assert.ok(metrics.totalEvents >= 4, 'Total events across 4 clubs should be >= 4');
    assert.ok(metrics.totalTreasury > 30000000, 'Total treasury should exceed 30M VND');
    assert.ok(metrics.pendingTasks >= 0);
  });

  test('8. Snapshot Referential Invalidation: persistClubs produces fresh references for useSyncExternalStore', () => {
    const clubs1 = getStoredClubs();
    const originalRef = clubs1[0];

    // Trigger state mutation
    recordClubTransaction('c1', {
      type: 'income',
      category: 'Hội phí',
      fundType: 'general',
      amount: 100000,
      description: 'Kiểm tra tham chiếu referential equality',
      date: '2026-10-18',
      createdByName: 'Test Runner',
    });

    const clubs2 = getStoredClubs();
    const newRef = clubs2[0];

    // CRITICAL: Object.is must be false so React triggers re-render
    assert.notEqual(clubs1, clubs2, 'Clubs array reference must change after persistClubs');
    assert.notEqual(originalRef, newRef, 'Club detail object reference must change after persistClubs');
    assert.notEqual(originalRef.transactions, newRef.transactions, 'Transactions array reference must change');
  });
});
