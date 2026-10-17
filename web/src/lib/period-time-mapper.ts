/**
 * CampusOS Vietnamese Academic Period & Schedule Time Mapper
 *
 * Translates Vietnamese university periods (Tiết 1-3, Tiết 4-6, Tiết 7-9, Tiết 10-12, Tiết 13-15),
 * custom blocks (e.g. Tiết 1-2, Tiết 7-10, Tiết 3-5), and Kíp shifts (Kíp 1-6) into standard
 * start/end timestamps (e.g. 07:00 - 09:25).
 *
 * Preserves explicit time ranges when present in timetable text and normalizes Vietnamese & English
 * day-of-week strings into standard numeric (2-8) and ISO (1-7) representations.
 */

// =========================================================================
// TYPES & INTERFACES
// =========================================================================

export type AcademicShift = 'morning' | 'afternoon' | 'evening';

export interface PeriodSlot {
  period: number;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  startMinutes: number; // minutes from 00:00
  endMinutes: number;   // minutes from 00:00
  shift: AcademicShift;
  shiftName: string; // "Ca Sáng" | "Ca Chiều" | "Ca Tối"
}

export interface KipSlot {
  kip: number; // 1..6
  startPeriod: number;
  endPeriod: number;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  name: string; // "Kíp 1"
  description?: string;
}

export interface ExplicitTimeRange {
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  rawMatch: string;
}

export interface ParsedPeriodResult {
  startPeriod: number;
  endPeriod: number;
  periodString: string; // "Tiết 1 - 3", "Kíp 1", "Tiết 4"
  startTime: string;    // "HH:mm"
  endTime: string;      // "HH:mm"
  durationMinutes: number;
  shift: AcademicShift;
  shiftName: string;
  hasExplicitTime: boolean;
  explicitTime?: ExplicitTimeRange;
  isKip: boolean;
  kipNumber?: number;
  isFallback: boolean;
  rawInput: string;
  periods: number[];
}

export interface NormalizedDayOfWeek {
  dayOfWeek: number;    // 2..8 (2=Thứ 2, 3=Thứ 3, ..., 7=Thứ 7, 8=Chủ Nhật)
  isoDay: number;       // 1..7 (1=Monday, ..., 7=Sunday)
  jsDay: number;        // 0..6 (0=Sunday, 1=Monday, ..., 6=Saturday)
  vietnameseName: string; // "Thứ Hai", ..., "Chủ Nhật"
  shortVietnameseName: string; // "T2", ..., "CN"
  englishName: string;  // "Monday", ..., "Sunday"
  shortEnglishName: string; // "Mon", ..., "Sun"
}

export interface ExtractedScheduleCourse {
  id: string;
  courseCode: string;
  courseName: string;
  credits?: number;
  dayOfWeek: number; // 2=Thứ 2 ... 7=Thứ 7, 8=Chủ Nhật
  dayOfWeekName: string;
  startPeriod: number;
  endPeriod: number;
  periodString: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  room: string;
  instructor: string;
  weeks?: string;
  type: 'class' | 'lab';
  color?: string;
  isSelected?: boolean;
}

export interface PeriodMapperOptions {
  preset?: 'standard' | 'hust';
  allowFallback?: boolean;
  defaultStartPeriod?: number;
  defaultEndPeriod?: number;
}

// =========================================================================
// STANDARD CONSTANTS & PERIOD DEFINITIONS
// =========================================================================

/**
 * Standard 15 Vietnamese academic periods (45m lecture, 5m in-block break,
 * 10m inter-block break, 30m lunch & dinner breaks).
 */
export const STANDARD_PERIODS: Record<number, PeriodSlot> = {
  1:  { period: 1,  startTime: '07:00', endTime: '07:45', startMinutes: 420,  endMinutes: 465,  shift: 'morning',   shiftName: 'Ca Sáng' },
  2:  { period: 2,  startTime: '07:50', endTime: '08:35', startMinutes: 470,  endMinutes: 515,  shift: 'morning',   shiftName: 'Ca Sáng' },
  3:  { period: 3,  startTime: '08:40', endTime: '09:25', startMinutes: 520,  endMinutes: 565,  shift: 'morning',   shiftName: 'Ca Sáng' },
  4:  { period: 4,  startTime: '09:35', endTime: '10:20', startMinutes: 575,  endMinutes: 620,  shift: 'morning',   shiftName: 'Ca Sáng' },
  5:  { period: 5,  startTime: '10:25', endTime: '11:10', startMinutes: 625,  endMinutes: 670,  shift: 'morning',   shiftName: 'Ca Sáng' },
  6:  { period: 6,  startTime: '11:15', endTime: '12:00', startMinutes: 675,  endMinutes: 720,  shift: 'morning',   shiftName: 'Ca Sáng' },
  7:  { period: 7,  startTime: '12:30', endTime: '13:15', startMinutes: 750,  endMinutes: 795,  shift: 'afternoon', shiftName: 'Ca Chiều' },
  8:  { period: 8,  startTime: '13:20', endTime: '14:05', startMinutes: 800,  endMinutes: 845,  shift: 'afternoon', shiftName: 'Ca Chiều' },
  9:  { period: 9,  startTime: '14:10', endTime: '14:55', startMinutes: 850,  endMinutes: 895,  shift: 'afternoon', shiftName: 'Ca Chiều' },
  10: { period: 10, startTime: '15:05', endTime: '15:50', startMinutes: 905,  endMinutes: 950,  shift: 'afternoon', shiftName: 'Ca Chiều' },
  11: { period: 11, startTime: '15:55', endTime: '16:40', startMinutes: 955,  endMinutes: 1000, shift: 'afternoon', shiftName: 'Ca Chiều' },
  12: { period: 12, startTime: '16:45', endTime: '17:30', startMinutes: 1005, endMinutes: 1050, shift: 'afternoon', shiftName: 'Ca Chiều' },
  13: { period: 13, startTime: '18:00', endTime: '18:45', startMinutes: 1080, endMinutes: 1125, shift: 'evening',   shiftName: 'Ca Tối' },
  14: { period: 14, startTime: '18:50', endTime: '19:35', startMinutes: 1130, endMinutes: 1175, shift: 'evening',   shiftName: 'Ca Tối' },
  15: { period: 15, startTime: '19:40', endTime: '20:25', startMinutes: 1180, endMinutes: 1225, shift: 'evening',   shiftName: 'Ca Tối' },
  16: { period: 16, startTime: '20:30', endTime: '21:15', startMinutes: 1230, endMinutes: 1275, shift: 'evening',   shiftName: 'Ca Tối' },
};

/**
 * Standard Kíp (1 to 6) shifts matching standard 3-period block structure.
 */
export const STANDARD_KIP_MAPPING: Record<number, KipSlot> = {
  1: { kip: 1, startPeriod: 1,  endPeriod: 3,  startTime: '07:00', endTime: '09:25', name: 'Kíp 1 (Tiết 1-3)' },
  2: { kip: 2, startPeriod: 4,  endPeriod: 6,  startTime: '09:35', endTime: '12:00', name: 'Kíp 2 (Tiết 4-6)' },
  3: { kip: 3, startPeriod: 7,  endPeriod: 9,  startTime: '12:30', endTime: '14:55', name: 'Kíp 3 (Tiết 7-9)' },
  4: { kip: 4, startPeriod: 10, endPeriod: 12, startTime: '15:05', endTime: '17:30', name: 'Kíp 4 (Tiết 10-12)' },
  5: { kip: 5, startPeriod: 13, endPeriod: 15, startTime: '18:00', endTime: '20:25', name: 'Kíp 5 (Tiết 13-15)' },
  6: { kip: 6, startPeriod: 14, endPeriod: 16, startTime: '19:30', endTime: '21:30', name: 'Kíp 6 (Tối muộn)' },
};

/**
 * HUST / ĐH Bách Khoa Hà Nội Kíp shifts (early 06:45 start).
 */
export const HUST_KIP_MAPPING: Record<number, KipSlot> = {
  1: { kip: 1, startPeriod: 1,  endPeriod: 3,  startTime: '06:45', endTime: '09:10', name: 'Kíp 1 (HUST)' },
  2: { kip: 2, startPeriod: 4,  endPeriod: 6,  startTime: '09:20', endTime: '11:45', name: 'Kíp 2 (HUST)' },
  3: { kip: 3, startPeriod: 7,  endPeriod: 9,  startTime: '12:30', endTime: '14:55', name: 'Kíp 3 (HUST)' },
  4: { kip: 4, startPeriod: 10, endPeriod: 12, startTime: '15:05', endTime: '17:30', name: 'Kíp 4 (HUST)' },
  5: { kip: 5, startPeriod: 13, endPeriod: 14, startTime: '17:45', endTime: '19:15', name: 'Kíp 5 (HUST)' },
  6: { kip: 6, startPeriod: 15, endPeriod: 16, startTime: '19:30', endTime: '21:00', name: 'Kíp 6 (HUST)' },
};

// =========================================================================
// TIME HELPER FUNCTIONS
// =========================================================================

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const safeM = Math.max(0, Math.min(1439, Math.floor(minutes)));
  const h = Math.floor(safeM / 60);
  const m = safeM % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

// =========================================================================
// EXPLICIT TIME DETECTION
// =========================================================================

/**
 * Detects explicit time ranges in Vietnamese timetable text, e.g.:
 * - "07:00 - 09:25"
 * - "7h00 - 9h25"
 * - "7h - 9h25"
 * - "13:30 – 16:00"
 * - "từ 07:00 đến 09:25"
 * - "7.00 - 9.25"
 */
export function detectExplicitTimeRange(text: string): ExplicitTimeRange | null {
  if (!text || typeof text !== 'string') return null;

  const rangeRegex = /(?:từ\s+)?(\d{1,2})(?:h|:|g|\.)(\d{2})?\s*(?:đến|-|–|—|->|tới)\s*(\d{1,2})(?:h|:|g|\.)(\d{2})?/i;
  const match = text.match(rangeRegex);
  if (!match) return null;

  const startH = parseInt(match[1]!, 10);
  const startM = match[2] ? parseInt(match[2], 10) : 0;
  const endH = parseInt(match[3]!, 10);
  const endM = match[4] ? parseInt(match[4], 10) : 0;

  if (startH < 0 || startH > 23 || startM < 0 || startM > 59) return null;
  if (endH < 0 || endH > 23 || endM < 0 || endM > 59) return null;

  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  // Handle accidental inversion
  if (startMinutes > endMinutes) {
    const tmp = startMinutes;
    startMinutes = endMinutes;
    endMinutes = tmp;
  }

  const startTime = minutesToTime(startMinutes);
  const endTime = minutesToTime(endMinutes);

  return {
    startTime,
    endTime,
    startMinutes,
    endMinutes,
    durationMinutes: endMinutes - startMinutes,
    rawMatch: match[0],
  };
}

// =========================================================================
// PERIOD RANGE TO TIME
// =========================================================================

/**
 * Translates startPeriod and endPeriod (1..16) into standard start and end timestamps.
 */
export function getPeriodTimeRange(
  startPeriod: number,
  endPeriod: number,
  options?: { preset?: 'standard' | 'hust' }
): { startTime: string; endTime: string; durationMinutes: number; shift: AcademicShift; shiftName: string } {
  let s = Math.max(1, Math.min(16, Math.floor(startPeriod || 1)));
  let e = Math.max(1, Math.min(16, Math.floor(endPeriod || s)));

  if (s > e) {
    const tmp = s;
    s = e;
    e = tmp;
  }

  if (options?.preset === 'hust') {
    // HUST shifted morning by -15m (starts 06:45)
    const stdStart = STANDARD_PERIODS[s]!;
    const stdEnd = STANDARD_PERIODS[e]!;
    let sMin = stdStart.startMinutes;
    let eMin = stdEnd.endMinutes;
    if (s <= 6) sMin = Math.max(405, sMin - 15); // 06:45
    if (e <= 6) eMin = Math.max(405, eMin - 15);
    return {
      startTime: minutesToTime(sMin),
      endTime: minutesToTime(eMin),
      durationMinutes: eMin - sMin,
      shift: stdStart.shift,
      shiftName: stdStart.shiftName,
    };
  }

  const startSlot = STANDARD_PERIODS[s]!;
  const endSlot = STANDARD_PERIODS[e]!;
  const durationMinutes = endSlot.endMinutes - startSlot.startMinutes;

  return {
    startTime: startSlot.startTime,
    endTime: endSlot.endTime,
    durationMinutes,
    shift: startSlot.shift,
    shiftName: startSlot.shiftName,
  };
}

// =========================================================================
// DAY OF WEEK NORMALIZATION
// =========================================================================

/**
 * Maps Vietnamese and English day-of-week strings or numbers to standard
 * numeric dayOfWeek (2-8), ISO day (1-7), and JS getDay (0-6).
 */
export function normalizeDayOfWeek(input: unknown): NormalizedDayOfWeek | null {
  if (input === null || input === undefined) return null;

  if (typeof input === 'number') {
    const n = Math.floor(input);
    if (n >= 2 && n <= 7) {
      return buildDayResult(n);
    }
    if (n === 8 || n === 0) {
      return buildDayResult(8);
    }
    if (n === 1) {
      // 1 in ISO is Monday (Thứ 2)
      return buildDayResult(2);
    }
    return null;
  }

  const str = String(input).trim().toLowerCase();
  if (!str) return null;

  // Direct numeric string
  if (/^[2-7]$/.test(str)) {
    return buildDayResult(parseInt(str, 10));
  }
  if (str === '8' || str === '0') {
    return buildDayResult(8);
  }
  if (str === '1') {
    return buildDayResult(2);
  }

  // Vietnamese patterns
  if (/(?:thứ\s*2|thứ\s*hai|thu\s*2|thu\s*hai|\bt2\b|^hai$|\bt\.2\b|\bt02\b)/i.test(str)) {
    return buildDayResult(2);
  }
  if (/(?:thứ\s*3|thứ\s*ba|thu\s*3|thu\s*ba|\bt3\b|^ba$|\bt\.3\b|\bt03\b)/i.test(str)) {
    return buildDayResult(3);
  }
  if (/(?:thứ\s*4|thứ\s*tư|thứ\s*bốn|thu\s*4|thu\s*tu|thu\s*bon|\bt4\b|^tư$|^tu$|^bốn$|\bt\.4\b)/i.test(str)) {
    return buildDayResult(4);
  }
  if (/(?:thứ\s*5|thứ\s*năm|thu\s*5|thu\s*nam|\bt5\b|^năm$|^nam$|\bt\.5\b)/i.test(str)) {
    return buildDayResult(5);
  }
  if (/(?:thứ\s*6|thứ\s*sáu|thu\s*6|thu\s*sau|\bt6\b|^sáu$|^sau$|\bt\.6\b)/i.test(str)) {
    return buildDayResult(6);
  }
  if (/(?:thứ\s*7|thứ\s*bảy|thứ\s*bẩy|thu\s*7|thu\s*bay|\bt7\b|^bảy$|^bay$|^bẩy$|\bt\.7\b)/i.test(str)) {
    return buildDayResult(7);
  }
  if (/(?:chủ\s*nhật|chu\s*nhat|\bcn\b|\bc\.n\b|chunhat|thứ\s*8|thu\s*8|\bt8\b)/i.test(str)) {
    return buildDayResult(8);
  }

  // English patterns
  if (/^mon(day)?$/i.test(str)) return buildDayResult(2);
  if (/^tue(s|sday)?$/i.test(str)) return buildDayResult(3);
  if (/^wed(nesday)?$/i.test(str)) return buildDayResult(4);
  if (/^thu(r|rs|rsday)?$/i.test(str)) return buildDayResult(5);
  if (/^fri(day)?$/i.test(str)) return buildDayResult(6);
  if (/^sat(urday)?$/i.test(str)) return buildDayResult(7);
  if (/^sun(day)?$/i.test(str)) return buildDayResult(8);

  return null;
}

function buildDayResult(dayOfWeek: number): NormalizedDayOfWeek {
  const table: Record<number, { vn: string; vnShort: string; en: string; enShort: string; iso: number; js: number }> = {
    2: { vn: 'Thứ Hai', vnShort: 'T2', en: 'Monday',    enShort: 'Mon', iso: 1, js: 1 },
    3: { vn: 'Thứ Ba',  vnShort: 'T3', en: 'Tuesday',   enShort: 'Tue', iso: 2, js: 2 },
    4: { vn: 'Thứ Tư',  vnShort: 'T4', en: 'Wednesday', enShort: 'Wed', iso: 3, js: 3 },
    5: { vn: 'Thứ Năm', vnShort: 'T5', en: 'Thursday',  enShort: 'Thu', iso: 4, js: 4 },
    6: { vn: 'Thứ Sáu', vnShort: 'T6', en: 'Friday',    enShort: 'Fri', iso: 5, js: 5 },
    7: { vn: 'Thứ Bảy', vnShort: 'T7', en: 'Saturday',  enShort: 'Sat', iso: 6, js: 6 },
    8: { vn: 'Chủ Nhật',vnShort: 'CN', en: 'Sunday',    enShort: 'Sun', iso: 7, js: 0 },
  };

  const item = table[dayOfWeek] || table[2]!;
  return {
    dayOfWeek,
    isoDay: item.iso,
    jsDay: item.js,
    vietnameseName: item.vn,
    shortVietnameseName: item.vnShort,
    englishName: item.en,
    shortEnglishName: item.enShort,
  };
}

// =========================================================================
// SCHEDULE PERIOD PARSER
// =========================================================================

/**
 * Parses any schedule period string into structured time and period info.
 * Prioritizes explicit time ranges when present.
 */
export function parseSchedulePeriod(input: string, options?: PeriodMapperOptions): ParsedPeriodResult {
  const rawInput = input || '';
  const trimmed = rawInput.trim();
  const explicit = detectExplicitTimeRange(trimmed);

  // Fallback defaults
  const defStart = options?.defaultStartPeriod || 1;
  const defEnd = options?.defaultEndPeriod || 3;

  if (!trimmed) {
    const range = getPeriodTimeRange(defStart, defEnd, options);
    return {
      startPeriod: defStart,
      endPeriod: defEnd,
      periodString: `Tiết ${defStart}-${defEnd}`,
      startTime: range.startTime,
      endTime: range.endTime,
      durationMinutes: range.durationMinutes,
      shift: range.shift,
      shiftName: range.shiftName,
      hasExplicitTime: false,
      isKip: false,
      isFallback: true,
      rawInput,
      periods: Array.from({ length: defEnd - defStart + 1 }, (_, i) => defStart + i),
    };
  }

  // 1. Check for Kíp pattern: "Kíp 1", "Kip 2", "Ca 3"
  const kipMatch = trimmed.match(/(?:k[íi]p|k1p|ca)\s*(\d{1,2})(?:\s*(?:-|đến|tới)\s*(\d{1,2}))?/i);
  if (kipMatch) {
    const kipNum = parseInt(kipMatch[1]!, 10);
    const kipTable = options?.preset === 'hust' ? HUST_KIP_MAPPING : STANDARD_KIP_MAPPING;
    const kipSlot = kipTable[kipNum] || STANDARD_KIP_MAPPING[1]!;

    let startP = kipSlot.startPeriod;
    let endP = kipSlot.endPeriod;
    let defaultStart = kipSlot.startTime;
    let defaultEnd = kipSlot.endTime;

    if (kipMatch[2]) {
      const endKipNum = parseInt(kipMatch[2], 10);
      const endKipSlot = kipTable[endKipNum];
      if (endKipSlot) {
        endP = endKipSlot.endPeriod;
        defaultEnd = endKipSlot.endTime;
      }
    }

    const finalStart = explicit ? explicit.startTime : defaultStart;
    const finalEnd = explicit ? explicit.endTime : defaultEnd;
    const duration = timeToMinutes(finalEnd) - timeToMinutes(finalStart);
    const shift = startP <= 6 ? 'morning' : startP <= 12 ? 'afternoon' : 'evening';
    const shiftName = shift === 'morning' ? 'Ca Sáng' : shift === 'afternoon' ? 'Ca Chiều' : 'Ca Tối';

    return {
      startPeriod: startP,
      endPeriod: endP,
      periodString: `Kíp ${kipNum}`,
      startTime: finalStart,
      endTime: finalEnd,
      durationMinutes: duration,
      shift,
      shiftName,
      hasExplicitTime: !!explicit,
      explicitTime: explicit || undefined,
      isKip: true,
      kipNumber: kipNum,
      isFallback: false,
      rawInput,
      periods: Array.from({ length: endP - startP + 1 }, (_, i) => startP + i),
    };
  }

  // 2. Check for Range or Comma Periods: "Tiết 1-3", "1 - 3", "Tiết 1, 2, 3", "T1-T3"
  const rangePattern = /(?:ti[ếeê]t|t1[eê]t|t)?\s*(\d{1,2})\s*(?:-|–|—|->|:|đến|tới)\s*(?:ti[ếeê]t|t1[eê]t|t)?\s*(\d{1,2})/i;
  const rangeMatch = trimmed.match(rangePattern);

  if (rangeMatch) {
    let s = parseInt(rangeMatch[1]!, 10);
    let e = parseInt(rangeMatch[2]!, 10);
    if (s > e) { const tmp = s; s = e; e = tmp; }
    s = Math.max(1, Math.min(16, s));
    e = Math.max(1, Math.min(16, e));

    const range = getPeriodTimeRange(s, e, options);
    const finalStart = explicit ? explicit.startTime : range.startTime;
    const finalEnd = explicit ? explicit.endTime : range.endTime;
    const duration = timeToMinutes(finalEnd) - timeToMinutes(finalStart);

    return {
      startPeriod: s,
      endPeriod: e,
      periodString: `Tiết ${s}-${e}`,
      startTime: finalStart,
      endTime: finalEnd,
      durationMinutes: duration,
      shift: range.shift,
      shiftName: range.shiftName,
      hasExplicitTime: !!explicit,
      explicitTime: explicit || undefined,
      isKip: false,
      isFallback: false,
      rawInput,
      periods: Array.from({ length: e - s + 1 }, (_, i) => s + i),
    };
  }

  // 3. Comma-separated list: "Tiết 1, 2, 3"
  const commaMatches = trimmed.match(/\b\d{1,2}\b/g);
  if (commaMatches && commaMatches.length > 1 && !explicit) {
    const nums = commaMatches.map(Number).filter((n) => n >= 1 && n <= 16);
    if (nums.length > 0) {
      const minP = Math.min(...nums);
      const maxP = Math.max(...nums);
      const range = getPeriodTimeRange(minP, maxP, options);
      return {
        startPeriod: minP,
        endPeriod: maxP,
        periodString: `Tiết ${minP}-${maxP}`,
        startTime: range.startTime,
        endTime: range.endTime,
        durationMinutes: range.durationMinutes,
        shift: range.shift,
        shiftName: range.shiftName,
        hasExplicitTime: false,
        isKip: false,
        isFallback: false,
        rawInput,
        periods: nums,
      };
    }
  }

  // 4. Single period: "Tiết 4", "tiet 7"
  const singleMatch = trimmed.match(/(?:ti[ếeê]t|t1[eê]t|t)\s*(\d{1,2})\b/i);
  if (singleMatch) {
    const p = Math.max(1, Math.min(16, parseInt(singleMatch[1]!, 10)));
    const range = getPeriodTimeRange(p, p, options);
    const finalStart = explicit ? explicit.startTime : range.startTime;
    const finalEnd = explicit ? explicit.endTime : range.endTime;
    return {
      startPeriod: p,
      endPeriod: p,
      periodString: `Tiết ${p}`,
      startTime: finalStart,
      endTime: finalEnd,
      durationMinutes: timeToMinutes(finalEnd) - timeToMinutes(finalStart),
      shift: range.shift,
      shiftName: range.shiftName,
      hasExplicitTime: !!explicit,
      explicitTime: explicit || undefined,
      isKip: false,
      isFallback: false,
      rawInput,
      periods: [p],
    };
  }

  // 5. Explicit time only: "07:00 - 09:25"
  if (explicit) {
    // Infer closest periods
    const sMin = explicit.startMinutes;
    let closestP = 1;
    for (let p = 1; p <= 16; p++) {
      if (Math.abs(STANDARD_PERIODS[p]!.startMinutes - sMin) < Math.abs(STANDARD_PERIODS[closestP]!.startMinutes - sMin)) {
        closestP = p;
      }
    }
    const shift = sMin < 720 ? 'morning' : sMin < 1080 ? 'afternoon' : 'evening';
    const shiftName = shift === 'morning' ? 'Ca Sáng' : shift === 'afternoon' ? 'Ca Chiều' : 'Ca Tối';

    return {
      startPeriod: closestP,
      endPeriod: closestP,
      periodString: `${explicit.startTime} - ${explicit.endTime}`,
      startTime: explicit.startTime,
      endTime: explicit.endTime,
      durationMinutes: explicit.durationMinutes,
      shift,
      shiftName,
      hasExplicitTime: true,
      explicitTime: explicit,
      isKip: false,
      isFallback: false,
      rawInput,
      periods: [closestP],
    };
  }

  // 6. Unknown / Malformed -> Fallback
  const range = getPeriodTimeRange(defStart, defEnd, options);
  return {
    startPeriod: defStart,
    endPeriod: defEnd,
    periodString: `Tiết ${defStart}-${defEnd}`,
    startTime: range.startTime,
    endTime: range.endTime,
    durationMinutes: range.durationMinutes,
    shift: range.shift,
    shiftName: range.shiftName,
    hasExplicitTime: false,
    isKip: false,
    isFallback: true,
    rawInput,
    periods: Array.from({ length: defEnd - defStart + 1 }, (_, i) => defStart + i),
  };
}

// =========================================================================
// CONVENIENCE WRAPPER: mapPeriodToTime
// =========================================================================

export function mapPeriodToTime(
  period: string | number,
  explicitTime?: string,
  options?: PeriodMapperOptions
): {
  startTime: string;
  endTime: string;
  isExplicitTime: boolean;
  periodString: string;
  startPeriod: number;
  endPeriod: number;
  durationMinutes: number;
  shift: AcademicShift;
  shiftName: string;
} {
  let explicit: ExplicitTimeRange | null = null;
  if (explicitTime) {
    explicit = detectExplicitTimeRange(explicitTime);
  }

  const periodStr = typeof period === 'number' ? `Tiết ${period}` : String(period || '');
  const parsed = parseSchedulePeriod(periodStr, options);

  if (explicit) {
    return {
      startTime: explicit.startTime,
      endTime: explicit.endTime,
      isExplicitTime: true,
      periodString: parsed.periodString,
      startPeriod: parsed.startPeriod,
      endPeriod: parsed.endPeriod,
      durationMinutes: explicit.durationMinutes,
      shift: parsed.shift,
      shiftName: parsed.shiftName,
    };
  }

  return {
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    isExplicitTime: parsed.hasExplicitTime,
    periodString: parsed.periodString,
    startPeriod: parsed.startPeriod,
    endPeriod: parsed.endPeriod,
    durationMinutes: parsed.durationMinutes,
    shift: parsed.shift,
    shiftName: parsed.shiftName,
  };
}

// =========================================================================
// RECURRING EVENT GENERATION UTILITIES
// =========================================================================

/**
 * Calculates upcoming YYYY-MM-DD date for a given dayOfWeek (2-8),
 * anchored around a reference date.
 */
export function calculateNextDateForDayOfWeek(dayOfWeek: number, refDate: Date = new Date()): string {
  const norm = normalizeDayOfWeek(dayOfWeek);
  const targetJsDay = norm ? norm.jsDay : 1; // default Monday
  const currentJsDay = refDate.getDay();

  let diff = (targetJsDay - currentJsDay + 7) % 7;
  const d = new Date(refDate);
  d.setDate(d.getDate() + diff);

  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

/**
 * Generates N weekly recurring ISO date strings (YYYY-MM-DD) for a given day of week.
 */
export function generateRecurringDates(
  dayOfWeek: number,
  totalWeeks = 15,
  refDate: Date = new Date()
): string[] {
  const dates: string[] = [];
  const firstDateStr = calculateNextDateForDayOfWeek(dayOfWeek, refDate);
  const [y, m, d] = firstDateStr.split('-').map(Number);
  const cursor = new Date(y!, m! - 1, d!);

  for (let w = 0; w < totalWeeks; w++) {
    const cy = cursor.getFullYear();
    const cm = pad2(cursor.getMonth() + 1);
    const cd = pad2(cursor.getDate());
    dates.push(`${cy}-${cm}-${cd}`);
    cursor.setDate(cursor.getDate() + 7);
  }

  return dates;
}
