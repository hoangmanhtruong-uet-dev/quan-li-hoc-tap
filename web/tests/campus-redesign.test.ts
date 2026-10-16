import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getLevelInfo,
  calculateLevelProgress,
  calculateLevelAndRank,
  calculateStreakOnCheckIn,
  calculateSessionXp,
  LEVELS_TABLE,
  daysDifference,
} from '../src/lib/gamification.ts';

import {
  computeDailyLoadScore,
  detectConflicts,
  findEarliestResolutionSlot,
  timeToMinutes,
  minutesToTime,
  type CalendarEvent,
  type DeadlineItem,
} from '../src/lib/calendar-math.ts';

import { parseVietnameseEventInput } from '../src/lib/nlp-calendar.ts';
import { exportToIcs, parseFromIcs } from '../src/lib/ics-calendar.ts';
import { generateSuggestedStudyBlocks } from '../src/lib/auto-scheduler.ts';
import { createDefaultSharedState, getSharedState } from '../src/lib/campus-store.ts';

// =========================================================================
// 1. Gamification Engine Tests
// =========================================================================

test('Gamification: 10 levels exist and mandatory rank titles match', () => {
  assert.equal(LEVELS_TABLE.length, 10);

  const level7 = LEVELS_TABLE.find((l) => l.level === 7);
  assert.ok(level7);
  assert.equal(level7.rankTitle, 'Sinh viên cày thuê');

  const level10 = LEVELS_TABLE.find((l) => l.level === 10);
  assert.ok(level10);
  assert.equal(level10.rankTitle, 'Chiến thần qua môn');
});

test('Gamification: getLevelInfo resolves correct tiers', () => {
  assert.equal(getLevelInfo(0).level, 1);
  assert.equal(getLevelInfo(150).level, 1);
  assert.equal(getLevelInfo(200).level, 2);
  assert.equal(getLevelInfo(2840).level, 7);
  assert.equal(getLevelInfo(2840).rankTitle, 'Sinh viên cày thuê');
  assert.equal(getLevelInfo(6000).level, 10);
  assert.equal(getLevelInfo(99999).level, 10);
  assert.equal(getLevelInfo(99999).rankTitle, 'Chiến thần qua môn');
});

test('Gamification: calculateLevelProgress handles progression and max level', () => {
  const p1 = calculateLevelProgress(100);
  assert.equal(p1.currentLevel, 1);
  assert.equal(p1.isMaxLevel, false);
  assert.equal(p1.xpToNextLevel, 100); // 200 - 100
  assert.equal(p1.progressPercent, 50);

  const pMax = calculateLevelProgress(7500);
  assert.equal(pMax.currentLevel, 10);
  assert.equal(pMax.isMaxLevel, true);
  assert.equal(pMax.progressPercent, 100);
  assert.equal(pMax.xpToNextLevel, 0);
});

test('Gamification: Streak and freeze shield rules', () => {
  // First check-in
  const r1 = calculateStreakOnCheckIn({ streak: 0, lastStudyDate: '', streakFreezes: 1 }, '2026-10-13');
  assert.equal(r1.streak, 1);
  assert.equal(r1.freezeUsed, false);
  assert.equal(r1.streakBroken, false);

  // Same day check-in
  const r2 = calculateStreakOnCheckIn({ streak: 5, lastStudyDate: '2026-10-13', streakFreezes: 1 }, '2026-10-13');
  assert.equal(r2.streak, 5);

  // Consecutive day check-in (+1 day)
  const r3 = calculateStreakOnCheckIn({ streak: 5, lastStudyDate: '2026-10-12', streakFreezes: 1 }, '2026-10-13');
  assert.equal(r3.streak, 6);
  assert.equal(r3.freezeUsed, false);

  // Skipped 1 day with freeze available (+2 days)
  const r4 = calculateStreakOnCheckIn({ streak: 10, lastStudyDate: '2026-10-11', streakFreezes: 1 }, '2026-10-13');
  assert.equal(r4.streak, 11);
  assert.equal(r4.streakFreezes, 0);
  assert.equal(r4.freezeUsed, true);
  assert.equal(r4.streakBroken, false);

  // Skipped 1 day with 0 freezes available -> streak broken
  const r5 = calculateStreakOnCheckIn({ streak: 10, lastStudyDate: '2026-10-11', streakFreezes: 0 }, '2026-10-13');
  assert.equal(r5.streak, 1);
  assert.equal(r5.streakBroken, true);

  // Skipped 3 days -> streak broken
  const r6 = calculateStreakOnCheckIn({ streak: 10, lastStudyDate: '2026-10-09', streakFreezes: 2 }, '2026-10-13');
  assert.equal(r6.streak, 1);
  assert.equal(r6.streakBroken, true);
});

test('Gamification: calculateSessionXp formula', () => {
  const s1 = calculateSessionXp(25, 100);
  // baseXp = 50, disciplineBonus = 10, milestoneBonus = 15 => total 75
  assert.equal(s1.baseXp, 50);
  assert.equal(s1.disciplineBonus, 10);
  assert.equal(s1.milestoneBonus, 15);
  assert.equal(s1.totalXp, 75);

  const s2 = calculateSessionXp(10, 50);
  // baseXp = 20, disciplineBonus = 5, milestoneBonus = 0 => total 25
  assert.equal(s2.baseXp, 20);
  assert.equal(s2.disciplineBonus, 5);
  assert.equal(s2.totalXp, 25);
});

// =========================================================================
// 2. Calendar Math & Conflicts Tests
// =========================================================================

test('Calendar Math: time to minutes conversion', () => {
  assert.equal(timeToMinutes('00:00'), 0);
  assert.equal(timeToMinutes('08:30'), 510);
  assert.equal(timeToMinutes('14:45'), 885);
  assert.equal(minutesToTime(510), '08:30');
  assert.equal(minutesToTime(885), '14:45');
});

test('Calendar Math: computeDailyLoadScore thresholds and levels', () => {
  const targetDate = '2026-10-13';

  // 1. Relaxed day (< 30)
  const lightEvents: CalendarEvent[] = [
    { id: '1', title: 'Tự học', date: targetDate, start: '08:00', end: '09:00', type: 'study' },
  ];
  const loadLight = computeDailyLoadScore(lightEvents, [], targetDate);
  assert.ok(loadLight.score < 30);
  assert.equal(loadLight.level, 'relaxed');
  assert.equal(loadLight.color, '#C6FF3D');

  // 2. Moderate day (30 - 59)
  // 3.5 hours of classes (3.5 * 10 = 35 score)
  const modEvents: CalendarEvent[] = [
    { id: '1', title: 'Lớp 1', date: targetDate, start: '08:00', end: '10:00', type: 'class' },
    { id: '2', title: 'Lớp 2', date: targetDate, start: '10:30', end: '12:00', type: 'class' },
  ];
  const loadMod = computeDailyLoadScore(modEvents, [], targetDate);
  assert.ok(loadMod.score >= 30 && loadMod.score < 60);
  assert.equal(loadMod.level, 'moderate');
  assert.equal(loadMod.color, '#FF8A3D');

  // 3. Overloaded day (>= 60)
  // 2 exam events or 1 exam + 1 deadline
  const heavyEvents: CalendarEvent[] = [
    { id: '1', title: 'Thi giữa kỳ', date: targetDate, start: '08:00', end: '10:00', type: 'exam' },
  ];
  const heavyDeadlines: DeadlineItem[] = [
    { id: 'd1', title: 'Báo cáo lớn', date: targetDate, urgent: true, completed: false },
  ];
  // Exam (2h * 20 = 40) + examCount (1 * 50 = 50) + deadline (1 * 30 = 30) = 120
  const loadHeavy = computeDailyLoadScore(heavyEvents, heavyDeadlines, targetDate);
  assert.ok(loadHeavy.score >= 60);
  assert.equal(loadHeavy.level, 'overloaded');
  assert.equal(loadHeavy.color, '#FF3D6E');
});

test('Calendar Math: detectConflicts finds overlaps and suggestions', () => {
  const targetDate = '2026-10-13';

  // Non-overlapping back-to-back events (08:00-09:30 and 09:30-11:00)
  const noConflictsEvents: CalendarEvent[] = [
    { id: 'ev-1', title: 'Lớp A', date: targetDate, start: '08:00', end: '09:30', type: 'class' },
    { id: 'ev-2', title: 'Lớp B', date: targetDate, start: '09:30', end: '11:00', type: 'class' },
  ];
  assert.equal(detectConflicts(noConflictsEvents).length, 0);

  // Overlapping events (08:00-10:00 and 09:00-10:30)
  const overlapEvents: CalendarEvent[] = [
    { id: 'ev-1', title: 'Lớp A', date: targetDate, start: '08:00', end: '10:00', type: 'class' },
    { id: 'ev-2', title: 'Họp nhóm', date: targetDate, start: '09:00', end: '10:30', type: 'club' },
  ];
  const conflicts = detectConflicts(overlapEvents);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0]!.overlapMinutes, 60);
  assert.ok(conflicts[0]!.suggestedSlot);
  // Should suggest after 10:00, e.g. 10:00 - 11:30
  assert.equal(conflicts[0]!.suggestedSlot!.start, '10:00');
  assert.equal(conflicts[0]!.suggestedSlot!.end, '11:30');
});

// =========================================================================
// 3. NLP Vietnamese Event Parser Tests
// =========================================================================

test('NLP: parses "ôn xác suất 19h thứ 6 tại thư viện"', () => {
  const ref = new Date('2026-10-13T09:00:00Z'); // Tuesday (day 2)
  // Friday is day 5, diff = 3 days => 2026-10-16
  const parsed = parseVietnameseEventInput('ôn xác suất 19h thứ 6 tại thư viện', ref);
  assert.ok(parsed);
  assert.equal(parsed.title, 'Ôn xác suất');
  assert.equal(parsed.type, 'study');
  assert.equal(parsed.start, '19:00');
  assert.equal(parsed.end, '20:00');
  assert.equal(parsed.location, 'Thư viện');
  assert.equal(parsed.date, '2026-10-16');
  assert.ok(parsed.confidence >= 0.7);
});

test('NLP: parses "họp nhóm lab 14h30 ngày mai"', () => {
  const ref = new Date('2026-10-13T09:00:00Z');
  const parsed = parseVietnameseEventInput('họp nhóm lab 14h30 ngày mai', ref);
  assert.ok(parsed);
  assert.equal(parsed.title, 'Họp nhóm lab');
  assert.equal(parsed.type, 'club');
  assert.equal(parsed.start, '14:30');
  assert.equal(parsed.end, '15:30');
  assert.equal(parsed.date, '2026-10-14');
});

test('NLP: parses explicit date and exam keyword "thi cuối kỳ toán rời rạc 08:00 ngày 25/11"', () => {
  const ref = new Date('2026-10-13T09:00:00Z');
  const parsed = parseVietnameseEventInput('thi cuối kỳ toán rời rạc 08:00 ngày 25/11', ref);
  assert.ok(parsed);
  assert.equal(parsed.type, 'exam');
  assert.equal(parsed.start, '08:00');
  assert.equal(parsed.date, '2026-11-25');
  assert.ok(parsed.title.toLowerCase().includes('toán rời rạc'));
});

// =========================================================================
// 4. RFC 5545 .ics Export & Import Roundtrip Tests
// =========================================================================

test('ICS: serializes and parses back with roundtrip fidelity', () => {
  const sampleEvents: CalendarEvent[] = [
    {
      id: 'event-ics-1',
      title: 'Kỹ thuật lập trình',
      date: '2026-10-15',
      start: '08:00',
      end: '09:30',
      type: 'class',
      location: 'Phòng D201',
      description: 'Slide chương 3',
    },
    {
      id: 'event-ics-2',
      title: 'Họp CLB Công nghệ, Web Dev',
      date: '2026-10-16',
      start: '14:00',
      end: '16:00',
      type: 'club',
      location: 'Hội trường B',
    },
  ];

  const icsText = exportToIcs(sampleEvents);
  assert.ok(icsText.includes('BEGIN:VCALENDAR'));
  assert.ok(icsText.includes('BEGIN:VEVENT'));
  assert.ok(icsText.includes('SUMMARY:Kỹ thuật lập trình'));
  assert.ok(icsText.includes('LOCATION:Phòng D201'));
  assert.ok(icsText.includes('CATEGORIES:CLASS'));
  assert.ok(icsText.includes('END:VCALENDAR'));

  const parsedEvents = parseFromIcs(icsText);
  assert.equal(parsedEvents.length, 2);

  const ev1 = parsedEvents[0]!;
  assert.equal(ev1.title, 'Kỹ thuật lập trình');
  assert.equal(ev1.date, '2026-10-15');
  assert.equal(ev1.start, '08:00');
  assert.equal(ev1.end, '09:30');
  assert.equal(ev1.type, 'class');
  assert.equal(ev1.location, 'Phòng D201');

  const ev2 = parsedEvents[1]!;
  assert.equal(ev2.title, 'Họp CLB Công nghệ, Web Dev');
  assert.equal(ev2.date, '2026-10-16');
  assert.equal(ev2.start, '14:00');
  assert.equal(ev2.end, '16:00');
  assert.equal(ev2.type, 'club');
});

// =========================================================================
// 5. AI Auto-Scheduler Greedy Slot-Packing Tests
// =========================================================================

test('Auto-Scheduler: proposes valid study blocks before deadlines without overloading', () => {
  const ref = new Date('2026-10-13T09:00:00Z');
  const deadlines: DeadlineItem[] = [
    {
      id: 'dl-final-math',
      title: 'Thi cuối kỳ Giải tích',
      course: 'Toán cao cấp',
      date: '2026-10-18',
      isExam: true,
      completed: false,
    },
  ];

  const existingEvents: CalendarEvent[] = [
    {
      id: 'class-1',
      title: 'Lớp buổi sáng',
      date: '2026-10-16',
      start: '08:00',
      end: '11:00',
      type: 'class',
    },
  ];

  const proposed = generateSuggestedStudyBlocks(deadlines, existingEvents, ref, {
    windowDays: 7,
    dailyMaxLoadScore: 60,
  });

  assert.ok(proposed.length > 0);
  for (const block of proposed) {
    assert.equal(block.type, 'study');
    assert.ok(block.title.includes('Giải tích'));
    assert.ok(block.date <= '2026-10-18');
    assert.ok(block.date >= '2026-10-13');
  }
});

// =========================================================================
// 6. Reactive Campus Store Tests
// =========================================================================

test('Campus Store: createDefaultSharedState anchors to reference date correctly', () => {
  const ref = new Date('2026-10-13T09:00:00Z');
  const state = createDefaultSharedState(ref);

  assert.equal(state.level, 7);
  assert.equal(state.rankTitle, 'Sinh viên cày thuê');
  assert.equal(state.streak, 12);
  assert.equal(state.weeklyStudyMinutesCurrent, 510);
  assert.equal(state.weeklyStudyGoalMinutes, 720);

  // Check relative dates exist in event collection
  const hasToday = state.events.some((e) => e.date === '2026-10-13');
  const hasMinus2 = state.events.some((e) => e.date === '2026-10-11');
  const hasPlus3 = state.events.some((e) => e.date === '2026-10-16');

  assert.ok(hasToday, 'Should contain events for today');
  assert.ok(hasMinus2, 'Should contain past events');
  assert.ok(hasPlus3, 'Should contain future events');

  // Node environment SSR snapshot safe
  const current = getSharedState();
  assert.ok(current);
  assert.ok(current.events.length > 0);
});
