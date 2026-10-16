import test from 'node:test';
import assert from 'node:assert/strict';

import {
  // Notifications
  type NotificationTab,
  type CampusNotification,
  SEED_ADMIN_NOTICES,
  synthesizeNotificationsFeed,
  filterNotifications,
  getNotificationTabCounts,
  getUnreadCount,
  isUrgentNotice,
  toggleNoticeRead,
  markAllNoticesAsRead,
  deleteNoticeWithUndo,

  // Profile Math & Badges
  calculateRadarCoordinate,
  calculateOverallIndex,
  calculateGraduationProgress,
  calculateCreditBreakdown,
  BADGE_CATALOG,
  evaluateBadgeUnlock,

  // Settings Security & GCal
  calculatePasswordStrength,
  validateTotpCode,
  generateBackupCodes,
  validateGCalConfig,
  formatGCalSummary,
  DEFAULT_GCAL_CONFIG,
  SIMULATED_2FA_SECRET,
} from '../src/lib/notifications-engine.ts';

import { exportToIcs, type CalendarEvent } from '../src/lib/ics-calendar.ts';
import type { CampusOSSharedState } from '../src/lib/campus-store.ts';

// =========================================================================
// SUITE 1: ACADEMIC CREDIT STATS & GRADUATION PROGRESS MATH
// =========================================================================

test('M3 Profile - Academic Credits (1/3): calculateGraduationProgress accurately computes percentage and remaining credits', () => {
  // Standard campus target: 94 / 135 credits = 69.6%
  const result = calculateGraduationProgress(94, 135);
  assert.equal(result.percentage, 69.6);
  assert.equal(result.remaining, 41);

  // Completed graduation
  const full = calculateGraduationProgress(135, 135);
  assert.equal(full.percentage, 100);
  assert.equal(full.remaining, 0);

  // Fresh student
  const fresh = calculateGraduationProgress(0, 135);
  assert.equal(fresh.percentage, 0);
  assert.equal(fresh.remaining, 135);

  // Boundary: overcompleted credits clamp remaining to 0
  const over = calculateGraduationProgress(140, 135);
  assert.equal(over.percentage, 103.7);
  assert.equal(over.remaining, 0);

  // Zero total credits edge case
  const zeroTotal = calculateGraduationProgress(10, 0);
  assert.equal(zeroTotal.percentage, 0);
  assert.equal(zeroTotal.remaining, 0);
});

test('M3 Profile - Academic Credits (2/3): calculateCreditBreakdown partitions core, elective, and capstone credits', () => {
  const categories = [
    { name: 'Khối kiến thức bắt buộc', earned: 68, required: 85, color: '#3DE8FF' },
    { name: 'Chuyên ngành tự chọn', earned: 22, required: 38, color: '#7C5CFF' },
    { name: 'Khóa luận tốt nghiệp', earned: 4, required: 12, color: '#C6FF3D' },
  ];

  const breakdown = calculateCreditBreakdown(categories);
  assert.equal(breakdown.length, 3);

  // Core: 68 / 85 = 80.0%, 17 remaining
  assert.equal(breakdown[0]!.percentage, 80.0);
  assert.equal(breakdown[0]!.remaining, 17);

  // Elective: 22 / 38 = 57.9%, 16 remaining
  assert.equal(breakdown[1]!.percentage, 57.9);
  assert.equal(breakdown[1]!.remaining, 16);

  // Capstone: 4 / 12 = 33.3%, 8 remaining
  assert.equal(breakdown[2]!.percentage, 33.3);
  assert.equal(breakdown[2]!.remaining, 8);
});

test('M3 Profile - Academic Credits (3/3): credit categories preserve metadata and styling tokens', () => {
  const categories = [
    { name: 'Ngoại ngữ', earned: 10, required: 10, color: '#FFB800' },
  ];
  const breakdown = calculateCreditBreakdown(categories);
  assert.equal(breakdown[0]!.name, 'Ngoại ngữ');
  assert.equal(breakdown[0]!.color, '#FFB800');
  assert.equal(breakdown[0]!.percentage, 100);
  assert.equal(breakdown[0]!.remaining, 0);
});

// =========================================================================
// SUITE 2: 6-AXIS RADAR CHART GEOMETRY & INDEX SCORE
// =========================================================================

test('M3 Profile - Radar Chart (1/3): calculateRadarCoordinate positions 6 axes symmetrically around center', () => {
  const center = 130;
  const radius = 90;

  // Axis 0: Top (-PI / 2) -> (center, center - radius) = (130, 40)
  const p0 = calculateRadarCoordinate(100, 0, 6, radius, center);
  assert.equal(p0.x, 130);
  assert.equal(p0.y, 40);

  // Axis 3: Bottom (+PI / 2) -> (center, center + radius) = (130, 220)
  const p3 = calculateRadarCoordinate(100, 3, 6, radius, center);
  assert.equal(p3.x, 130);
  assert.equal(p3.y, 220);

  // Zero value collapses to center (130, 130)
  const zeroP = calculateRadarCoordinate(0, 0, 6, radius, center);
  assert.equal(zeroP.x, 130);
  assert.equal(zeroP.y, 130);

  // 50% value is halfway between center and perimeter
  const halfP = calculateRadarCoordinate(50, 0, 6, radius, center);
  assert.equal(halfP.x, 130);
  assert.equal(halfP.y, 85);
});

test('M3 Profile - Radar Chart (2/3): all 6 radar coordinates remain bounded within the maximum radius', () => {
  const center = 130;
  const radius = 90;

  for (let axis = 0; axis < 6; axis++) {
    for (let val = 0; val <= 100; val += 20) {
      const { x, y } = calculateRadarCoordinate(val, axis, 6, radius, center);
      const distFromCenter = Math.hypot(x - center, y - center);
      // Distance should never exceed radius + float rounding tolerance
      assert.ok(distFromCenter <= radius + 0.01, `Axis ${axis} with val ${val} exceeded radius: ${distFromCenter}`);
    }
  }
});

test('M3 Profile - Radar Chart (3/3): calculateOverallIndex computes arithmetic average across skill axes', () => {
  const skills = [
    { value: 88 },
    { value: 82 },
    { value: 85 },
    { value: 78 },
    { value: 92 },
    { value: 74 },
  ];
  // Sum = 499 / 6 = 83.1666... -> 83.2
  const indexScore = calculateOverallIndex(skills);
  assert.equal(indexScore, 83.2);

  // Empty skill list returns 0
  assert.equal(calculateOverallIndex([]), 0);
});

// =========================================================================
// SUITE 3: BADGE CATALOG & TIERED UNLOCK RULES
// =========================================================================

test('M3 Profile - Badges (1/3): catalog covers all 4 tiers (Đồng, Bạc, Vàng, Cyber)', () => {
  assert.ok(BADGE_CATALOG.length >= 8);

  const tiers = new Set(BADGE_CATALOG.map((b) => b.tier));
  assert.ok(tiers.has('Đồng'));
  assert.ok(tiers.has('Bạc'));
  assert.ok(tiers.has('Vàng'));
  assert.ok(tiers.has('Cyber'));
});

test('M3 Profile - Badges (2/3): evaluateBadgeUnlock recognizes milestone conditions correctly', () => {
  // 1. early_bird unlocked at XP >= 200
  assert.equal(evaluateBadgeUnlock('early_bird', { xp: 150 }), false);
  assert.equal(evaluateBadgeUnlock('early_bird', { xp: 250 }), true);

  // 2. consistency_pro unlocked at streak >= 7
  assert.equal(evaluateBadgeUnlock('consistency_pro', { streak: 5 }), false);
  assert.equal(evaluateBadgeUnlock('consistency_pro', { streak: 7 }), true);

  // 3. deep_focus unlocked at studyMinutesTotal >= 600
  assert.equal(evaluateBadgeUnlock('deep_focus', { studyMinutesTotal: 450 }), false);
  assert.equal(evaluateBadgeUnlock('deep_focus', { studyMinutesTotal: 620 }), true);

  // 4. deadline_hunter unlocked at level >= 5
  assert.equal(evaluateBadgeUnlock('deadline_hunter', { level: 3 }), false);
  assert.equal(evaluateBadgeUnlock('deadline_hunter', { level: 5 }), true);

  // 5. cyber_master unlocked at level >= 7 or xp >= 2700
  assert.equal(evaluateBadgeUnlock('cyber_master', { level: 6, xp: 2100 }), false);
  assert.equal(evaluateBadgeUnlock('cyber_master', { level: 7, xp: 2800 }), true);

  // 6. campus_legend unlocked at level >= 10
  assert.equal(evaluateBadgeUnlock('campus_legend', { level: 9, xp: 5500 }), false);
  assert.equal(evaluateBadgeUnlock('campus_legend', { level: 10, xp: 6200 }), true);
});

test('M3 Profile - Badges (3/3): explicit inclusion in state.badges overrides calculated criteria', () => {
  // Even if XP is 0, if badge id is recorded in badges array, it is unlocked
  assert.equal(evaluateBadgeUnlock('cyber_master', { xp: 0, level: 1, badges: ['cyber_master'] }), true);
});

// =========================================================================
// SUITE 4: NOTIFICATION ENGINE & FEED SYNTHESIS
// =========================================================================

test('M3 Notifications (1/4): synthesizeNotificationsFeed merges admin notices with active deadlines and events', () => {
  const mockSharedState: Partial<CampusOSSharedState> = {
    deadlines: [
      { id: 'd-test-1', title: 'Bài tập Mạng máy tính', course: 'CS101', urgent: true, completed: false },
      { id: 'd-test-2', title: 'Đồ án xong', completed: true }, // completed should be excluded
    ],
    events: [
      { id: 'e-test-1', title: 'Hackathon CLB', type: 'club', date: '2026-10-25', start: '08:00', end: '17:00' },
    ],
  };

  const feed = synthesizeNotificationsFeed(mockSharedState);
  assert.ok(feed.length >= 6); // 5 seed notices + 1 active deadline + 1 club event

  // Verify deadline was synthesized
  const deadlineNotice = feed.find((n) => n.id === 'deadline-d-test-1');
  assert.ok(deadlineNotice);
  assert.equal(deadlineNotice?.tab, 'Deadline');
  assert.equal(deadlineNotice?.isUrgent, true);

  // Verify completed deadline is omitted
  assert.ok(!feed.some((n) => n.id === 'deadline-d-test-2'));

  // Verify club event was synthesized
  const clubNotice = feed.find((n) => n.id === 'event-e-test-1');
  assert.ok(clubNotice);
  assert.equal(clubNotice?.tab, 'CLB');
});

test('M3 Notifications (2/4): filterNotifications partitions into 4 tabs and filters by search query', () => {
  const notices: CampusNotification[] = [
    { id: '1', title: 'Bài tập Giải tích', detail: 'Hạn nộp 23h', tab: 'Deadline', time: '1h', isRead: false },
    { id: '2', title: 'Workshop AI', detail: 'Tổ chức bởi CLB AI', tab: 'CLB', time: '2h', isRead: false },
    { id: '3', title: 'Điểm thi CS101', detail: 'Đã có điểm thi', tab: 'Học vụ', time: '3h', isRead: true },
  ];

  // Tab filtering
  assert.equal(filterNotifications(notices, 'Tất cả').length, 3);
  assert.equal(filterNotifications(notices, 'Deadline').length, 1);
  assert.equal(filterNotifications(notices, 'CLB').length, 1);
  assert.equal(filterNotifications(notices, 'Học vụ').length, 1);

  // Search filtering
  const searchResults = filterNotifications(notices, 'Tất cả', 'giải tích');
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0]!.id, '1');

  // Tab counts
  const counts = getNotificationTabCounts(notices);
  assert.equal(counts['Tất cả'], 3);
  assert.equal(counts['Deadline'], 1);
  assert.equal(counts['CLB'], 1);
  assert.equal(counts['Học vụ'], 1);

  // Unread count
  assert.equal(getUnreadCount(notices), 2);
  assert.equal(getUnreadCount(notices, 'Học vụ'), 0);
});

test('M3 Notifications (3/4): isUrgentNotice detects deadlines with less than 12 hours remaining', () => {
  const urgentNotice: CampusNotification = {
    id: 'u1',
    title: 'Nộp bài tập gấp',
    detail: 'Sắp hết giờ',
    tab: 'Deadline',
    time: '2h',
    isRead: false,
    dueTimeRemainingMs: 3 * 3600 * 1000, // 3 hours < 12h
  };
  assert.equal(isUrgentNotice(urgentNotice), true);

  const regularNotice: CampusNotification = {
    id: 'r1',
    title: 'Bài tập tuần sau',
    detail: 'Còn 3 ngày',
    tab: 'Deadline',
    time: '3d',
    isRead: false,
    dueTimeRemainingMs: 72 * 3600 * 1000, // 72 hours > 12h
  };
  assert.equal(isUrgentNotice(regularNotice), false);
});

test('M3 Notifications (4/4): toggleNoticeRead, markAllNoticesAsRead, and deleteNoticeWithUndo logic', () => {
  const notices: CampusNotification[] = [
    { id: '1', title: 'A', detail: '', tab: 'Deadline', time: '', isRead: false },
    { id: '2', title: 'B', detail: '', tab: 'CLB', time: '', isRead: false },
  ];

  // Toggle read
  const toggled = toggleNoticeRead(notices, '1');
  assert.equal(toggled.find((n) => n.id === '1')?.isRead, true);
  assert.equal(toggled.find((n) => n.id === '2')?.isRead, false);

  // Mark all read
  const allRead = markAllNoticesAsRead(notices);
  assert.ok(allRead.every((n) => n.isRead));

  // Delete with undo
  const { updated, deleted, restore } = deleteNoticeWithUndo(notices, '1');
  assert.equal(updated.length, 1);
  assert.equal(deleted?.id, '1');

  // Restore notice
  const restored = restore();
  assert.equal(restored.length, 2);
  assert.ok(restored.some((n) => n.id === '1'));
});

// =========================================================================
// SUITE 5: SETTINGS SECURITY (PASSWORD & 2FA TOTP)
// =========================================================================

test('M3 Settings - Password Strength (1/2): evaluates password criteria and score buckets correctly', () => {
  // Empty
  const empty = calculatePasswordStrength('');
  assert.equal(empty.score, 0);

  // Weak (< 8 chars or single charset)
  const weak = calculatePasswordStrength('abcdef');
  assert.equal(weak.score, 1);
  assert.equal(weak.label, 'Yếu');

  // Medium (>= 8 chars + mixed case)
  const med = calculatePasswordStrength('CampusOSWeb');
  assert.equal(med.score, 2);
  assert.equal(med.label, 'Trung bình');

  // Strong (>= 8 chars + mixed case + number)
  const strong = calculatePasswordStrength('CampusOS2026');
  assert.equal(strong.score, 3);
  assert.equal(strong.label, 'Khá mạnh');

  // Very strong (>= 8 chars + mixed case + number + symbol)
  const veryStrong = calculatePasswordStrength('CampusOS@2026!');
  assert.equal(veryStrong.score, 4);
  assert.equal(veryStrong.label, 'Rất mạnh');
});

test('M3 Settings - 2FA & TOTP (2/2): validateTotpCode and backup recovery codes format', () => {
  // Valid 6-digit numeric TOTP
  assert.equal(validateTotpCode('123456'), true);
  assert.equal(validateTotpCode(' 987654 '), true); // trims whitespace

  // Invalid formats
  assert.equal(validateTotpCode('12345'), false); // 5 digits
  assert.equal(validateTotpCode('1234567'), false); // 7 digits
  assert.equal(validateTotpCode('12345a'), false); // letters
  assert.equal(validateTotpCode(''), false); // empty

  // Backup codes
  const backupCodes = generateBackupCodes();
  assert.equal(backupCodes.length, 8);
  for (const code of backupCodes) {
    assert.match(code, /^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  }

  // Simulated secret key
  assert.equal(SIMULATED_2FA_SECRET, 'JBSWY3DPEHPK3PXP');
});

// =========================================================================
// SUITE 6: GOOGLE CALENDAR SYNC & RFC 5545 EXPORT
// =========================================================================

test('M3 Settings - Google Calendar Sync (1/2): validateGCalConfig validates intervals and account requirements', () => {
  assert.equal(validateGCalConfig(DEFAULT_GCAL_CONFIG), true);

  // Connected without email is invalid
  assert.equal(validateGCalConfig({ connected: true, accountEmail: '' }), false);

  // Invalid interval
  // @ts-expect-error Testing invalid runtime value
  assert.equal(validateGCalConfig({ connected: true, accountEmail: 'test@campus.edu.vn', interval: 'invalid' }), false);

  // Summary formatter
  const summary = formatGCalSummary(DEFAULT_GCAL_CONFIG, 14);
  assert.match(summary, /14 sự kiện/);
  assert.match(summary, /Lớp học/);
  assert.match(summary, /Deadline/);
  assert.match(summary, /CLB/);
});

test('M3 Settings - Google Calendar Sync (2/2): RFC 5545 .ics generation produces valid iCalendar format', () => {
  const events: CalendarEvent[] = [
    {
      id: 'gcal-ev-1',
      title: 'Mạng máy tính & Truyền thông',
      date: '2026-10-19',
      start: '08:00',
      end: '11:30',
      type: 'class',
      location: 'D201 · Tòa D',
      description: 'Lớp lý thuyết tuần 7',
    },
    {
      id: 'gcal-ev-2',
      title: 'Nộp bài tập lớn CS201',
      date: '2026-10-23',
      start: '23:00',
      end: '23:59',
      type: 'exam',
      location: 'CampusOS Portal',
    },
  ];

  const ics = exportToIcs(events);

  // Valid RFC 5545 headers
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('VERSION:2.0'));
  assert.ok(ics.includes('PRODID:-//CampusOS//Student Calendar//VI'));

  // Valid VEVENT entries
  assert.ok(ics.includes('BEGIN:VEVENT'));
  assert.ok(ics.includes('SUMMARY:Mạng máy tính & Truyền thông'));
  assert.ok(ics.includes('LOCATION:D201 · Tòa D'));
  assert.ok(ics.includes('SUMMARY:Nộp bài tập lớn CS201'));
  assert.ok(ics.includes('END:VEVENT'));
  assert.ok(ics.includes('END:VCALENDAR'));
});
