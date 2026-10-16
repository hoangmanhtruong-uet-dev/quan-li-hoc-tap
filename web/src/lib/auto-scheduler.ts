/**
 * CampusOS AI Auto-Scheduler Engine ("Xếp lịch giúp tao")
 * Greedy slot-packing algorithm proposing study sessions before upcoming exams and deadlines.
 */

export type EventType = 'class' | 'study' | 'exam' | 'club' | 'personal';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string;   // HH:mm
  type: EventType;
  location?: string;
  description?: string;
  allDay?: boolean;
  done?: boolean;
}

export interface DeadlineItem {
  id: string;
  title: string;
  course?: string;
  dueDate?: string;
  date?: string;
  urgent?: boolean;
  completed?: boolean;
  isExam?: boolean;
}

export interface AutoSchedulerOptions {
  windowDays?: number; // Search window in days (default 7)
  studyBlockDurationMinutes?: number; // Default 60
  dailyMaxLoadScore?: number; // Skip days with loadScore >= threshold (default 60)
  maxBlocksPerDeadline?: number; // Default 2 for exams, 1 for regular
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
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

function computeDayScore(
  events: CalendarEvent[],
  deadlines: DeadlineItem[],
  targetDate: string
): number {
  const targetEvents = events.filter((e) => e.date === targetDate);
  const targetDeadlines = deadlines.filter((d) => {
    const dDate = d.date || (d.dueDate ? d.dueDate.slice(0, 10) : '');
    return dDate === targetDate && !d.completed;
  });

  let eventScore = 0;
  let examCount = 0;

  for (const ev of targetEvents) {
    const startM = timeToMinutes(ev.start);
    const endM = timeToMinutes(ev.end);
    let durationM = endM - startM;
    if (durationM <= 0 || ev.allDay) durationM = 90;
    const hours = durationM / 60;
    eventScore += hours * (TYPE_WEIGHTS[ev.type] || 8);
    if (ev.type === 'exam') examCount += 1;
  }

  let regularDeadlines = 0;
  for (const dl of targetDeadlines) {
    if (dl.isExam) examCount += 1;
    else regularDeadlines += 1;
  }

  return Math.round(eventScore + 30 * regularDeadlines + 50 * examCount);
}

function findFreeSlotOnDate(
  dateStr: string,
  durationMinutes: number,
  allEvents: CalendarEvent[],
  windowStartMin = 480,
  windowEndMin = 1260
): { start: string; end: string } | null {
  const dayEvents = allEvents.filter((e) => e.date === dateStr);

  const intervals: Array<{ start: number; end: number }> = [];
  for (const ev of dayEvents) {
    const s = Math.max(windowStartMin, timeToMinutes(ev.start));
    const e = Math.min(windowEndMin, timeToMinutes(ev.end));
    if (e > s) {
      intervals.push({ start: s, end: e });
    }
  }

  intervals.sort((a, b) => a.start - b.start);

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

  let cursor = windowStartMin;
  for (const busy of merged) {
    if (busy.start - cursor >= durationMinutes) {
      return {
        start: minutesToTime(cursor),
        end: minutesToTime(cursor + durationMinutes),
      };
    }
    cursor = Math.max(cursor, busy.end);
  }

  if (windowEndMin - cursor >= durationMinutes) {
    return {
      start: minutesToTime(cursor),
      end: minutesToTime(cursor + durationMinutes),
    };
  }

  return null;
}

function formatIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Greedily generates suggested study blocks in free calendar windows before upcoming deadlines.
 */
export function generateSuggestedStudyBlocks(
  deadlines: DeadlineItem[],
  existingEvents: CalendarEvent[],
  referenceDate: Date = new Date(),
  options: AutoSchedulerOptions = {}
): CalendarEvent[] {
  const windowDays = options.windowDays ?? 7;
  const blockDuration = options.studyBlockDurationMinutes ?? 60;
  const maxLoadScore = options.dailyMaxLoadScore ?? 60;

  // Working copy of all events to track newly allocated blocks
  const workingEvents: CalendarEvent[] = [...existingEvents];
  const proposedBlocks: CalendarEvent[] = [];

  // Filter and sort active, non-completed deadlines
  const activeDeadlines = deadlines.filter((d) => !d.completed);

  // Sort deadlines: exams first, then earliest due date
  activeDeadlines.sort((a, b) => {
    const dateA = a.date || (a.dueDate ? a.dueDate.slice(0, 10) : '9999-99-99');
    const dateB = b.date || (b.dueDate ? b.dueDate.slice(0, 10) : '9999-99-99');
    if (a.isExam && !b.isExam) return -1;
    if (!a.isExam && b.isExam) return 1;
    return dateA.localeCompare(dateB);
  });

  const refDateStr = formatIso(referenceDate);

  for (const deadline of activeDeadlines) {
    const dlDateStr = deadline.date || (deadline.dueDate ? deadline.dueDate.slice(0, 10) : '');
    if (!dlDateStr) continue;

    // Only schedule for deadlines within the window or not already past
    if (dlDateStr < refDateStr) continue;

    const neededBlocks = deadline.isExam
      ? (options.maxBlocksPerDeadline ?? 2)
      : (options.maxBlocksPerDeadline ? Math.min(1, options.maxBlocksPerDeadline) : 1);

    let blocksAllocated = 0;

    // Search eligible days in reverse (from day before deadline down to referenceDate)
    for (let dayOffset = Math.min(windowDays, 6); dayOffset >= 0 && blocksAllocated < neededBlocks; dayOffset--) {
      const candidateDate = formatIso(addDays(referenceDate, dayOffset));

      // Don't schedule after deadline
      if (candidateDate > dlDateStr) continue;

      // Check current load score on candidate date
      const load = computeDayScore(workingEvents, activeDeadlines, candidateDate);
      if (load >= maxLoadScore) {
        continue; // Day overloaded, skip to prevent burnout
      }

      // Find free slot
      const freeSlot = findFreeSlotOnDate(candidateDate, blockDuration, workingEvents, 480, 1260);

      if (freeSlot) {
        const newBlock: CalendarEvent = {
          id: `auto-study-${deadline.id}-${blocksAllocated + 1}-${candidateDate}`,
          title: `Ôn tập: ${deadline.title}`,
          date: candidateDate,
          start: freeSlot.start,
          end: freeSlot.end,
          type: 'study',
          location: 'Focus Room',
          description: `Phiên ôn tập gợi ý bởi AI cho ${deadline.course || deadline.title}`,
        };

        workingEvents.push(newBlock);
        proposedBlocks.push(newBlock);
        blocksAllocated += 1;
      }
    }
  }

  return proposedBlocks;
}
