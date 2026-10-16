/**
 * CampusOS RFC 5545 iCalendar (.ics) Serializer & Parser
 * Provides lossless export and import for student schedules.
 */

export type EventType = 'class' | 'study' | 'exam' | 'club' | 'personal';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  type: EventType;
  location?: string;
  description?: string;
}

function escapeIcsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function unescapeIcsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function formatUtcTimestamp(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

function formatIcsDateTime(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.replace(/-/g, '');
  const cleanTime = (timeStr || '09:00').replace(/:/g, '').padEnd(4, '0') + '00';
  return `${cleanDate}T${cleanTime}`;
}

/**
 * Serialize an array of CalendarEvent items into RFC 5545 .ics string.
 */
export function exportToIcs(events: CalendarEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusOS//Student Calendar//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const nowStamp = formatUtcTimestamp();

  for (const ev of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${ev.id || 'ev-' + Math.random().toString(36).substring(2, 9)}@campusos.app`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART:${formatIcsDateTime(ev.date, ev.start)}`);
    lines.push(`DTEND:${formatIcsDateTime(ev.date, ev.end || ev.start)}`);
    lines.push(`SUMMARY:${escapeIcsText(ev.title)}`);

    if (ev.location) {
      lines.push(`LOCATION:${escapeIcsText(ev.location)}`);
    }

    if (ev.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
    }

    lines.push(`CATEGORIES:${(ev.type || 'study').toUpperCase()}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

/**
 * Parse an RFC 5545 .ics formatted string into an array of CalendarEvent items.
 */
export function parseFromIcs(icsContent: string): CalendarEvent[] {
  if (!icsContent || typeof icsContent !== 'string') return [];

  // Step 1: Unfold lines (lines beginning with space or tab belong to previous line)
  const rawLines = icsContent.split(/\r?\n/);
  const unfolded: string[] = [];

  for (const line of rawLines) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (unfolded.length > 0) {
        unfolded[unfolded.length - 1] += line.slice(1);
      }
    } else if (line.trim().length > 0) {
      unfolded.push(line.trim());
    }
  }

  // Step 2: Extract VEVENT blocks
  const events: CalendarEvent[] = [];
  let inVevent = false;
  let currentProps: Record<string, string> = {};

  for (const line of unfolded) {
    if (line === 'BEGIN:VEVENT') {
      inVevent = true;
      currentProps = {};
      continue;
    }

    if (line === 'END:VEVENT') {
      inVevent = false;
      const parsedEvent = mapPropsToCalendarEvent(currentProps);
      if (parsedEvent) {
        events.push(parsedEvent);
      }
      continue;
    }

    if (inVevent) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const fullKey = line.substring(0, colonIndex);
        const val = line.substring(colonIndex + 1);
        const mainKey = fullKey.split(';')[0]!.toUpperCase().trim();
        currentProps[mainKey] = val;
      }
    }
  }

  return events;
}

function parseIcsDateAndTime(val: string): { date: string; time: string } | null {
  if (!val) return null;
  // Patterns: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ or YYYYMMDD
  const clean = val.replace(/Z$/, '');
  const tIndex = clean.indexOf('T');

  if (tIndex >= 8) {
    const dPart = clean.substring(0, tIndex);
    const tPart = clean.substring(tIndex + 1);
    const y = dPart.substring(0, 4);
    const m = dPart.substring(4, 6);
    const d = dPart.substring(6, 8);
    const hh = tPart.substring(0, 2) || '08';
    const mm = tPart.substring(2, 4) || '00';
    return {
      date: `${y}-${m}-${d}`,
      time: `${hh}:${mm}`,
    };
  }

  if (clean.length >= 8) {
    const y = clean.substring(0, 4);
    const m = clean.substring(4, 6);
    const d = clean.substring(6, 8);
    return {
      date: `${y}-${m}-${d}`,
      time: '08:00',
    };
  }

  return null;
}

function mapPropsToCalendarEvent(props: Record<string, string>): CalendarEvent | null {
  const summary = props['SUMMARY'] ? unescapeIcsText(props['SUMMARY']) : 'Sự kiện không tiêu đề';
  const startRaw = props['DTSTART'] || '';
  const endRaw = props['DTEND'] || '';

  const startParsed = parseIcsDateAndTime(startRaw);
  if (!startParsed) return null;

  let endParsed = parseIcsDateAndTime(endRaw);
  if (!endParsed) {
    // Default 1 hour later
    const [h, m] = startParsed.time.split(':').map(Number);
    const endH = ((h || 8) + 1) % 24;
    endParsed = {
      date: startParsed.date,
      time: `${String(endH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`,
    };
  }

  let eventType: EventType = 'study';
  const cat = (props['CATEGORIES'] || '').toLowerCase();
  if (cat.includes('class')) eventType = 'class';
  else if (cat.includes('exam')) eventType = 'exam';
  else if (cat.includes('club')) eventType = 'club';
  else if (cat.includes('personal')) eventType = 'personal';
  else if (cat.includes('study')) eventType = 'study';

  const uid = props['UID'] ? props['UID'].replace(/@campusos\.app$/, '') : 'ics-' + Math.random().toString(36).substring(2, 9);

  return {
    id: uid,
    title: summary,
    date: startParsed.date,
    start: startParsed.time,
    end: endParsed.time,
    type: eventType,
    location: props['LOCATION'] ? unescapeIcsText(props['LOCATION']) : undefined,
    description: props['DESCRIPTION'] ? unescapeIcsText(props['DESCRIPTION']) : undefined,
  };
}

export const parseIcs = parseFromIcs;
