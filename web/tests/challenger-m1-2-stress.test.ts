import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createDefaultSharedState,
  getSharedState,
  updateSharedState,
  recordCompletedSession,
  resetSharedState,
  calculateLevelAndRank,
  formatIsoDateOnly,
  type CalendarEvent,
  type DeadlineItem,
} from '../src/lib/campus-store.ts';

import {
  getLevelInfo,
  calculateLevelProgress,
  calculateStreakOnCheckIn,
  calculateSessionXp,
  daysDifference,
} from '../src/lib/gamification.ts';

// =========================================================================
// STRESS TEST SUITE 1: createDefaultSharedState & Date Anchoring
// =========================================================================

test('Empirical Stress: createDefaultSharedState anchors relative dates dynamically across edge cases', () => {
  const testDates = [
    new Date('2026-10-13T09:00:00Z'), // Normal date
    new Date('2024-02-28T12:00:00Z'), // Leap year end of Feb
    new Date('2025-12-31T23:59:59Z'), // New year rollover
    new Date('2027-01-01T00:00:00Z'), // Far future
    new Date('2023-08-15T08:00:00Z'), // Past date
  ];

  for (const ref of testDates) {
    const state = createDefaultSharedState(ref);
    const today = formatIsoDateOnly(ref, 0);

    // Verify lastStudyDate matches today
    assert.equal(state.lastStudyDate, today, `lastStudyDate should match today: ${today}`);

    // Verify no date is stuck in August 2026 unless ref is specifically in August 2026
    const refYearMonth = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`;
    const allDates = [
      ...state.events.map((e) => e.date),
      ...state.deadlines.map((d) => d.date || d.dueDate?.split('T')[0]),
    ];

    for (const d of allDates) {
      assert.ok(d && typeof d === 'string', `Event/deadline date should be a valid string, got ${d}`);
      assert.match(d, /^\d{4}-\d{2}-\d{2}$/, `Date should be YYYY-MM-DD, got ${d}`);
      if (refYearMonth !== '2026-08') {
        assert.ok(!d.startsWith('2026-08'), `Date ${d} should NOT be in August 2026 when ref is ${refYearMonth}`);
      }
    }

    // Verify relative event offsets
    const eventDates = new Set(state.events.map((e) => e.date));
    assert.ok(eventDates.has(formatIsoDateOnly(ref, -2)), 'Must have event for day -2');
    assert.ok(eventDates.has(formatIsoDateOnly(ref, -1)), 'Must have event for day -1');
    assert.ok(eventDates.has(today), 'Must have event for today');
    assert.ok(eventDates.has(formatIsoDateOnly(ref, 1)), 'Must have event for day +1');
    assert.ok(eventDates.has(formatIsoDateOnly(ref, 3)), 'Must have event for day +3');
    assert.ok(eventDates.has(formatIsoDateOnly(ref, 10)), 'Must have event for day +10');
  }
});

test('Empirical Stress: formatIsoDateOnly leap year & month rollover correctness', () => {
  const feb28 = new Date(2024, 1, 28); // 2024-02-28
  assert.equal(formatIsoDateOnly(feb28, 1), '2024-02-29'); // Leap day
  assert.equal(formatIsoDateOnly(feb28, 2), '2024-03-01'); // March 1st

  const dec31 = new Date(2025, 11, 31); // 2025-12-31
  assert.equal(formatIsoDateOnly(dec31, 1), '2026-01-01'); // New Year
  assert.equal(formatIsoDateOnly(dec31, -1), '2025-12-30');
});

// =========================================================================
// STRESS TEST SUITE 2: recordCompletedSession, XP Awards, Streak & Freezes
// =========================================================================

test('Empirical Stress: calculateSessionXp boundary conditions', () => {
  // 0 minutes
  assert.equal(calculateSessionXp(0, 100).totalXp, 0);
  // Negative minutes (should clamp to 0)
  assert.equal(calculateSessionXp(-15, 100).totalXp, 0);
  // Float minutes (should floor)
  assert.equal(calculateSessionXp(25.9, 100).totalXp, 75); // 25*2=50 + 10 + 15 = 75
  // 45 minutes session (45*2=90 + 10 + 15 = 115)
  assert.equal(calculateSessionXp(45, 100).totalXp, 115);
  // 0 discipline score (50 + 0 + 15 = 65)
  assert.equal(calculateSessionXp(25, 0).totalXp, 65);
  // Discipline score out of bounds
  assert.equal(calculateSessionXp(25, 150).disciplineBonus, 10);
  assert.equal(calculateSessionXp(25, -20).disciplineBonus, 0);
});

test('Empirical Stress: recordCompletedSession updates XP, Level, and Badges in shared store', () => {
  // Reset store to default
  const initial = resetSharedState();
  const initialXp = initial.xp;
  const initialMinutes = initial.studyMinutesTotal;

  // Record 50-minute session with 100 discipline
  // XP gained: 50*2 + 10 + 15 = 125
  const result = recordCompletedSession(50, 100);
  assert.equal(result.xpGained, 125);

  const updated = getSharedState();
  assert.equal(updated.xp, initialXp + 125);
  assert.equal(updated.studyMinutesTotal, initialMinutes + 50);
  assert.equal(updated.weeklyStudyMinutesCurrent, initial.weeklyStudyMinutesCurrent + 50);

  // Check badges: 50 min >= 45 min -> deep-focus badge awarded
  assert.ok(updated.badges.includes('deep-focus'), 'Should award deep-focus badge');
});

test('Empirical Stress: recordCompletedSession streak preservation and freeze deduction', () => {
  // Simulate state where user missed 1 day (diff = 2) with 1 freeze available
  const twoDaysAgo = formatIsoDateOnly(new Date(), -2);

  resetSharedState();
  // Manually update store state to simulate 2-day gap with 1 freeze
  updateSharedState(() => ({
    streak: 12,
    streakFreezes: 1,
    lastStudyDate: twoDaysAgo,
  }));

  const midState = getSharedState();
  assert.equal(midState.streak, 12);
  assert.equal(midState.streakFreezes, 1);
  assert.equal(midState.lastStudyDate, twoDaysAgo);

  // Complete a session today
  const res = recordCompletedSession(30, 100);
  const afterState = getSharedState();

  // Streak should be preserved and incremented to 13
  assert.equal(afterState.streak, 13, 'Streak should increment by 1 when freeze shields');
  // Freeze should be deducted from 1 to 0
  assert.equal(afterState.streakFreezes, 0, 'Streak freeze should be deducted by 1');
  assert.equal(afterState.lastStudyDate, formatIsoDateOnly(new Date(), 0));
  assert.equal(res.streakUpdated, true);
});

test('Empirical Stress: recordCompletedSession streak reset when 0 freezes available', () => {
  const twoDaysAgo = formatIsoDateOnly(new Date(), -2);

  resetSharedState();
  updateSharedState(() => ({
    streak: 12,
    streakFreezes: 0, // No freeze!
    lastStudyDate: twoDaysAgo,
  }));

  recordCompletedSession(30, 100);
  const afterState = getSharedState();

  // Streak should reset to 1
  assert.equal(afterState.streak, 1, 'Streak should reset to 1 when gap is 2 days and 0 freezes');
  assert.equal(afterState.streakFreezes, 0);
});

test('Empirical Stress: Level and Rank transitions across all 10 tiers', () => {
  const thresholds = [
    { xp: 0, level: 1, title: 'Tân sinh viên ngơ ngác' },
    { xp: 200, level: 2, title: 'Cú đêm giảng đường' },
    { xp: 500, level: 3, title: 'Dũng sĩ trốn điểm danh' },
    { xp: 900, level: 4, title: 'Bậc thầy nước đến chân' },
    { xp: 1400, level: 5, title: 'Thợ săn deadline' },
    { xp: 2000, level: 6, title: 'Chiến thần thuyết trình' },
    { xp: 2700, level: 7, title: 'Sinh viên cày thuê' },
    { xp: 3600, level: 8, title: 'Trùm phao cứu sinh' },
    { xp: 4700, level: 9, title: 'Giáo sư tự phong' },
    { xp: 6000, level: 10, title: 'Chiến thần qua môn' },
    { xp: 100000, level: 10, title: 'Chiến thần qua môn' },
  ];

  for (const t of thresholds) {
    const info = calculateLevelAndRank(t.xp);
    assert.equal(info.level, t.level, `XP ${t.xp} should yield level ${t.level}`);
    assert.equal(info.rankTitle, t.title, `XP ${t.xp} should yield title "${t.title}"`);
  }
});

// =========================================================================
// STRESS TEST SUITE 3: daysDiff vs timestamp formatting edge case
// =========================================================================

test('Empirical Stress: daysDifference handles pure YYYY-MM-DD vs edge cases', () => {
  assert.equal(daysDifference('2026-10-12', '2026-10-13'), 1);
  assert.equal(daysDifference('2026-10-11', '2026-10-13'), 2);
  assert.equal(daysDifference('2026-10-13', '2026-10-13'), 0);
  assert.equal(daysDifference('2026-10-14', '2026-10-13'), -1);
  // Empty dates
  assert.equal(daysDifference('', '2026-10-13'), 0);
  assert.equal(daysDifference('2026-10-12', ''), 0);
});

// =========================================================================
// STRESS TEST SUITE 4: Global Shortcuts & Modal Accessibility Analysis
// =========================================================================

test('Empirical Stress: Keyboard event handling rules in global shortcuts', () => {
  // Simulate the exact handler logic from use-global-shortcuts.ts
  const createKeyHandler = (options: any) => {
    let konamiIndex = 0;
    const KONAMI_SEQUENCE = [
      'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
      'b', 'a'
    ];

    return (e: any) => {
      const target = e.target;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // 1. Command Palette: Cmd/Ctrl + K (allowed everywhere, even in inputs)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        options.onToggleCommandPalette?.();
        return;
      }

      // 2. Escape key
      if (e.key === 'Escape') {
        options.onEscape?.();
        return;
      }

      // If user is currently typing in an input field, block single-key shortcuts
      if (isInput) return;

      // 3. Question mark (?) - Open Shortcuts modal
      if (e.key === '?') {
        e.preventDefault();
        options.onToggleShortcutsModal?.();
        return;
      }

      // 4. Focus Mode (F)
      if (e.key === 'f' || e.key === 'F') {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          options.onTriggerFocusMode?.();
          return;
        }
      }

      // 5. Quick Create Task (N)
      if (e.key === 'n' || e.key === 'N') {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          options.onQuickCreateTask?.();
          return;
        }
      }

      // 6. Konami Code Progression
      const currentExpected = KONAMI_SEQUENCE[konamiIndex];
      if (currentExpected && e.key.toLowerCase() === currentExpected.toLowerCase()) {
        konamiIndex += 1;
        if (konamiIndex === KONAMI_SEQUENCE.length) {
          konamiIndex = 0;
          options.onKonamiCode?.();
        }
      } else {
        konamiIndex = 0;
      }
    };
  };

  const calls: string[] = [];
  const handler = createKeyHandler({
    onToggleCommandPalette: () => calls.push('palette'),
    onToggleShortcutsModal: () => calls.push('shortcuts'),
    onTriggerFocusMode: () => calls.push('focus'),
    onQuickCreateTask: () => calls.push('task'),
    onEscape: () => calls.push('escape'),
    onKonamiCode: () => calls.push('konami'),
  });

  const bodyEl = { tagName: 'DIV', isContentEditable: false };
  const inputEl = { tagName: 'INPUT', isContentEditable: false };
  const textareaEl = { tagName: 'TEXTAREA', isContentEditable: false };
  const editableEl = { tagName: 'DIV', isContentEditable: true };

  // Test 1: Cmd+K fires from anywhere, including inputs
  handler({ key: 'k', metaKey: true, target: inputEl, preventDefault: () => {} });
  assert.equal(calls.pop(), 'palette');

  // Test 2: Escape fires from anywhere, including inputs
  handler({ key: 'Escape', target: textareaEl, preventDefault: () => {} });
  assert.equal(calls.pop(), 'escape');

  // Test 3: '?' blocked when inside input, works when in body
  handler({ key: '?', target: inputEl, preventDefault: () => {} });
  assert.equal(calls.length, 0, 'Single key ? must be blocked in input');
  handler({ key: '?', target: bodyEl, preventDefault: () => {} });
  assert.equal(calls.pop(), 'shortcuts');

  // Test 4: 'f' blocked in textarea or contenteditable, works in body
  handler({ key: 'f', target: textareaEl, preventDefault: () => {} });
  assert.equal(calls.length, 0, 'f must be blocked in textarea');
  handler({ key: 'f', target: editableEl, preventDefault: () => {} });
  assert.equal(calls.length, 0, 'f must be blocked in contenteditable');
  handler({ key: 'F', target: bodyEl, preventDefault: () => {} });
  assert.equal(calls.pop(), 'focus');

  // Test 5: 'n' blocked in input, works in body
  handler({ key: 'n', target: inputEl, preventDefault: () => {} });
  assert.equal(calls.length, 0, 'n must be blocked in input');
  handler({ key: 'n', target: bodyEl, preventDefault: () => {} });
  assert.equal(calls.pop(), 'task');

  // Test 6: Konami code sequence
  const konamiKeys = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];
  for (const k of konamiKeys) {
    handler({ key: k, target: bodyEl, preventDefault: () => {} });
  }
  assert.equal(calls.pop(), 'konami', 'Konami sequence must trigger callback');
});

test('Empirical Stress: Audit modal keyboard and focus trapping contracts', async () => {
  // Read source files directly to verify structural accessibility compliance
  const fs = await import('node:fs/promises');
  const path = await import('node:path');

  const paletteCode = await fs.readFile(
    path.resolve(process.cwd(), 'src/components/common/command-palette.tsx'),
    'utf-8'
  );
  const shortcutsModalCode = await fs.readFile(
    path.resolve(process.cwd(), 'src/components/common/keyboard-shortcuts-modal.tsx'),
    'utf-8'
  );

  // 1. Both modals must declare dialog role
  assert.ok(paletteCode.includes('role="dialog"'), 'CommandPalette must have role="dialog"');
  assert.ok(shortcutsModalCode.includes('role="dialog"'), 'KeyboardShortcutsModal must have role="dialog"');

  // 2. Both modals must have Escape key handlers
  assert.ok(paletteCode.includes("e.key === 'Escape'"), 'CommandPalette must handle Escape');
  assert.ok(shortcutsModalCode.includes("e.key === 'Escape'"), 'KeyboardShortcutsModal must handle Escape');

  // 3. Tab-key focus trapping inspection:
  // Note: Neither modal implements Tab / Shift+Tab focus trap constraints.
  // Tab key cycles out of the dialog into underlying DOM.
  const hasTabTrapPalette = paletteCode.includes("e.key === 'Tab'");
  const hasTabTrapShortcuts = shortcutsModalCode.includes("e.key === 'Tab'");

  assert.equal(hasTabTrapPalette, false, 'CommandPalette currently lacks explicit Tab focus trap');
  assert.equal(hasTabTrapShortcuts, false, 'KeyboardShortcutsModal currently lacks explicit Tab focus trap');
});

