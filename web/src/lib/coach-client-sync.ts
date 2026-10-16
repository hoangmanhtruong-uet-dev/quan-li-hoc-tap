'use client';

/**
 * Coach Client Sync
 * Bridges AI Coach study plans with CampusOS shared store (events, calendar, gamification).
 */

import {
  formatIsoDateOnly,
  updateSharedState,
  calculateLevelAndRank,
  type CalendarEvent,
} from './campus-store.ts';
import type { SuggestedStudyPlan } from './coach-engine.ts';

export function syncStudyPlanToCampusEvents(
  plan: SuggestedStudyPlan,
  targetDate?: string
): { addedEvents: CalendarEvent[]; undo: () => void } {
  const date = targetDate || plan.date || formatIsoDateOnly(new Date(), 0);
  const newEvents: CalendarEvent[] = plan.blocks.map((block, idx) => ({
    id: `event-coach-${Date.now()}-${idx}`,
    title: `[Coach] ${block.title}`,
    date,
    start: block.start,
    end: block.end,
    type: 'study',
    description: `${block.detail} · Môn: ${block.subject}`,
    location: 'Bàn học cá nhân',
    done: false,
    color: '#7C5CFF',
  }));

  updateSharedState((prev) => {
    const nextEvents = [...prev.events, ...newEvents];
    const nextXp = prev.xp + 25; // Reward +25 XP for adopting AI study plan
    const { level, rankTitle } = calculateLevelAndRank(nextXp);
    return {
      events: nextEvents,
      aiCoachAccepted: true,
      xp: nextXp,
      level,
      rankTitle,
    };
  });

  let undone = false;
  const undo = () => {
    if (undone) return;
    undone = true;
    const addedIds = new Set(newEvents.map((e) => e.id));
    updateSharedState((prev) => {
      const filtered = prev.events.filter((e) => !addedIds.has(e.id));
      const nextXp = Math.max(0, prev.xp - 25);
      const { level, rankTitle } = calculateLevelAndRank(nextXp);
      return {
        events: filtered,
        aiCoachAccepted: false,
        xp: nextXp,
        level,
        rankTitle,
      };
    });
  };

  return { addedEvents: newEvents, undo };
}
