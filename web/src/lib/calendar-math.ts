/**
 * CampusOS Calendar Mathematical & Algorithmic Engine
 * Handles daily load score calculations, schedule conflict detection,
 * and contiguous free slot finding for auto-rescheduling.
 */

export const EVENT_TYPES = ['class', 'study', 'exam', 'club', 'personal'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm (e.g. '08:00')
  end: string;   // HH:mm (e.g. '09:30')
  type: EventType;
  location?: string;
  description?: string;
  allDay?: boolean;
  subjectId?: string;
  rrule?: string;
  reminders?: number[];
  checklist?: Array<{ id: string; text: string; done: boolean }>;
  done?: boolean;
  color?: string;
}

export interface DeadlineItem {
  id: string;
  title: string;
  course?: string;
  dueDate?: string; // ISO 8601 string: YYYY-MM-DDTHH:mm:ss
  date?: string;    // YYYY-MM-DD
  displayDate?: string;
  urgent?: boolean;
  completed?: boolean;
  isExam?: boolean;
}

export interface DailyLoadScore {
  score: number;
  level: 'relaxed' | 'moderate' | 'overloaded';
  color: string;
  label: string;
  totalHours: number;
  eventCount: number;
  deadlineCount: number;
  examCount: number;
}

export interface ScheduleConflict {
  eventA: CalendarEvent;
  eventB: CalendarEvent;
  overlapMinutes: number;
  suggestedSlot?: { start: string; end: string } | null;
}

/**
 * Convert "HH:mm" to total minutes from midnight (0..1439).
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  return h * 60 + m;
}

/**
 * Convert minutes from midnight to "HH:mm".
 */
export function minutesToTime(minutes: number): string {
  const safeM = Math.max(0, Math.min(1439, Math.floor(minutes)));
  const h = Math.floor(safeM / 60);
  const m = safeM % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const TYPE_WEIGHTS: Record<EventType, number> = {
  exam: 20,
  class: 10,
  study: 8,
  club: 6,
  personal: 4,
};

/**
 * Compute daily load score for a given set of events and deadlines.
 * Formula: sum(hours * weight) + 30 * deadlineCount + 50 * examCount
 * Thresholds:
 *   score < 30: Relaxed (#C6FF3D)
 *   30 <= score < 60: Moderate (#FF8A3D)
 *   score >= 60: Overloaded (#FF3D6E)
 */
export function computeDailyLoadScore(
  events: CalendarEvent[],
  deadlines: DeadlineItem[] = [],
  targetDate?: string
): DailyLoadScore {
  const targetEvents = targetDate ? events.filter((e) => e.date === targetDate) : events;
  const targetDeadlines = targetDate
    ? deadlines.filter((d) => {
        const dDate = d.date || (d.dueDate ? d.dueDate.slice(0, 10) : '');
        return dDate === targetDate && !d.completed;
      })
    : deadlines.filter((d) => !d.completed);

  let totalHours = 0;
  let eventScore = 0;
  let examCount = 0;

  for (const ev of targetEvents) {
    const startM = timeToMinutes(ev.start);
    const endM = timeToMinutes(ev.end);
    let durationM = endM - startM;
    if (durationM <= 0 || ev.allDay) {
      durationM = 90; // Default 1.5h
    }
    const hours = durationM / 60;
    totalHours += hours;

    const weight = TYPE_WEIGHTS[ev.type] || 8;
    eventScore += hours * weight;

    if (ev.type === 'exam') {
      examCount += 1;
    }
  }

  let regularDeadlines = 0;
  for (const dl of targetDeadlines) {
    if (dl.isExam) {
      examCount += 1;
    } else {
      regularDeadlines += 1;
    }
  }

  const rawScore = eventScore + 30 * regularDeadlines + 50 * examCount;
  const score = Math.round(rawScore);

  let level: 'relaxed' | 'moderate' | 'overloaded' = 'relaxed';
  let color = '#C6FF3D'; // Acid lime
  let label = 'Thong thả';

  if (score >= 60) {
    level = 'overloaded';
    color = '#FF3D6E'; // Neon Pink/Red
    label = 'Quá tải';
  } else if (score >= 30) {
    level = 'moderate';
    color = '#FF8A3D'; // Sticker Orange
    label = 'Cân bằng';
  }

  return {
    score,
    level,
    color,
    label,
    totalHours: Number(totalHours.toFixed(1)),
    eventCount: targetEvents.length,
    deadlineCount: regularDeadlines,
    examCount,
  };
}

/**
 * Find the earliest contiguous free slot on the same date between windowStart (default 08:00)
 * and windowEnd (default 21:00).
 */
export function findEarliestResolutionSlot(
  eventToReschedule: CalendarEvent,
  allEvents: CalendarEvent[],
  windowStartMin = 480, // 08:00
  windowEndMin = 1260   // 21:00
): { start: string; end: string } | null {
  const dur = timeToMinutes(eventToReschedule.end) - timeToMinutes(eventToReschedule.start);
  const duration = dur > 0 ? dur : 60;

  // Filter other events on the same date
  const others = allEvents.filter(
    (e) => e.date === eventToReschedule.date && e.id !== eventToReschedule.id
  );

  // Convert other events into clamped busy intervals
  const intervals: Array<{ start: number; end: number }> = [];
  for (const ev of others) {
    const s = Math.max(windowStartMin, timeToMinutes(ev.start));
    const e = Math.min(windowEndMin, timeToMinutes(ev.end));
    if (e > s) {
      intervals.push({ start: s, end: e });
    }
  }

  // Sort intervals by start ascending
  intervals.sort((a, b) => a.start - b.start);

  // Merge overlapping or consecutive busy intervals
  const merged: Array<{ start: number; end: number }> = [];
  for (const inv of intervals) {
    if (merged.length === 0) {
      merged.push({ ...inv });
    } else {
      const last = merged[merged.length - 1]!;
      if (inv.start <= last.end) {
        last.end = Math.max(last.end, inv.end);
      } else {
        merged.push({ ...inv });
      }
    }
  }

  // Search free gaps for duration
  let cursor = windowStartMin;
  for (const busy of merged) {
    if (busy.start - cursor >= duration) {
      return {
        start: minutesToTime(cursor),
        end: minutesToTime(cursor + duration),
      };
    }
    cursor = Math.max(cursor, busy.end);
  }

  if (windowEndMin - cursor >= duration) {
    return {
      start: minutesToTime(cursor),
      end: minutesToTime(cursor + duration),
    };
  }

  return null;
}

/**
 * Detect schedule conflicts where two events on the same date overlap in time.
 * Condition: startA < endB && startB < endA
 */
export function detectConflicts(events: CalendarEvent[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  for (let i = 0; i < events.length; i++) {
    const a = events[i]!;
    const startA = timeToMinutes(a.start);
    const endA = timeToMinutes(a.end);

    for (let j = i + 1; j < events.length; j++) {
      const b = events[j]!;
      if (a.date !== b.date) continue;

      const startB = timeToMinutes(b.start);
      const endB = timeToMinutes(b.end);

      // Overlap condition
      if (startA < endB && startB < endA) {
        const overlapStart = Math.max(startA, startB);
        const overlapEnd = Math.min(endA, endB);
        const overlapMinutes = Math.max(0, overlapEnd - overlapStart);

        const suggestedSlot = findEarliestResolutionSlot(b, events);

        conflicts.push({
          eventA: a,
          eventB: b,
          overlapMinutes,
          suggestedSlot,
        });
      }
    }
  }

  return conflicts;
}
