/**
 * CampusOS Vietnamese Natural Language Event Parser
 * Deterministic multi-pass parser transforming Vietnamese natural language strings
 * like "ôn xác suất 19h thứ 6 tại thư viện" into structured CalendarEvent data.
 */

export type EventType = 'class' | 'study' | 'exam' | 'club' | 'personal';

export interface ParsedEventResult {
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  location?: string;
  confidence: number;
  rawInput: string;
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

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Parses Vietnamese student inputs into structured event attributes.
 */
export function parseVietnameseEventInput(
  rawInput: string,
  referenceDate: Date = new Date()
): ParsedEventResult | null {
  if (!rawInput || typeof rawInput !== 'string') return null;
  const input = rawInput.trim();
  if (input.length === 0) return null;

  let working = input;
  let detectedLocation: string | undefined = undefined;
  let detectedDate: string | undefined = undefined;
  let detectedStart: string | undefined = undefined;
  let detectedEnd: string | undefined = undefined;
  let detectedType: EventType = 'study';
  let matchedTokensCount = 0;

  // -------------------------------------------------------------
  // Pass 1: Location Extraction ("tại ...", "ở ...", "phòng ...")
  // -------------------------------------------------------------
  const locRegex = /(?:tại|ở)\s+([a-zA-Z0-9\s\u00C0-\u1EF9_-]+?)(?=(?:\s+(?:lúc|vào|ngày|thứ|từ|\d+h|\d+:))|$)/i;
  const roomRegex = /\b(phòng\s+[a-zA-Z0-9]+|giảng đường\s+[a-zA-Z0-9]+|lab\s+\d+)\b/i;

  const locMatch = working.match(locRegex);
  if (locMatch && locMatch[1]) {
    detectedLocation = locMatch[1].trim();
    // Capitalize location
    detectedLocation = detectedLocation.charAt(0).toUpperCase() + detectedLocation.slice(1);
    working = working.replace(locMatch[0], ' ');
    matchedTokensCount += 1;
  } else {
    const roomMatch = working.match(roomRegex);
    if (roomMatch && roomMatch[1]) {
      detectedLocation = roomMatch[1].trim();
      detectedLocation = detectedLocation.charAt(0).toUpperCase() + detectedLocation.slice(1);
      working = working.replace(roomMatch[0], ' ');
      matchedTokensCount += 1;
    }
  }

  // -------------------------------------------------------------
  // Pass 2: Time Extraction ("19h", "14h30", "08:00", "từ 8h đến 10h")
  // -------------------------------------------------------------
  const timeRangeRegex = /(?:từ\s+)?(\d{1,2})(?:h|:|g)(\d{2})?\s*(?:đến|-|tới)\s*(\d{1,2})(?:h|:|g)(\d{2})?/i;
  const singleTimeRegex = /(?:lúc\s+|vào\s+)?(\d{1,2})(?:h|:|g)(\d{2})?(?:\s*(sáng|chiều|tối))?/i;

  const rangeMatch = working.match(timeRangeRegex);
  if (rangeMatch) {
    let startH = parseInt(rangeMatch[1]!, 10);
    const startM = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : 0;
    let endH = parseInt(rangeMatch[3]!, 10);
    const endM = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : 0;

    detectedStart = `${pad2(startH)}:${pad2(startM)}`;
    detectedEnd = `${pad2(endH)}:${pad2(endM)}`;
    working = working.replace(rangeMatch[0], ' ');
    matchedTokensCount += 2;
  } else {
    const singleMatch = working.match(singleTimeRegex);
    if (singleMatch) {
      let h = parseInt(singleMatch[1]!, 10);
      const m = singleMatch[2] ? parseInt(singleMatch[2], 10) : 0;
      const period = singleMatch[3]?.toLowerCase();

      if (period === 'chiều' && h < 12) h += 12;
      if (period === 'tối' && h < 12) h += 12;

      detectedStart = `${pad2(h)}:${pad2(m)}`;
      // Default duration: 1 hour
      const endH = (h + 1) % 24;
      detectedEnd = `${pad2(endH)}:${pad2(m)}`;
      working = working.replace(singleMatch[0], ' ');
      matchedTokensCount += 1;
    }
  }

  // Fallback start/end time if omitted
  if (!detectedStart) {
    detectedStart = '09:00';
    detectedEnd = '10:00';
  }

  // -------------------------------------------------------------
  // Pass 3: Date Extraction (relative, day of week, explicit date)
  // -------------------------------------------------------------
  const lowerWorking = working.toLowerCase();

  if (lowerWorking.includes('hôm nay') || lowerWorking.includes('tối nay') || lowerWorking.includes('chiều nay') || lowerWorking.includes('sáng nay')) {
    detectedDate = formatIso(referenceDate);
    working = working.replace(/(?:hôm nay|tối nay|chiều nay|sáng nay)/gi, ' ');
    matchedTokensCount += 1;
  } else if (lowerWorking.includes('ngày mai') || lowerWorking.includes('sáng mai') || lowerWorking.includes('chiều mai') || lowerWorking.includes('tối mai') || lowerWorking.includes('mai')) {
    detectedDate = formatIso(addDays(referenceDate, 1));
    working = working.replace(/(?:ngày mai|sáng mai|chiều mai|tối mai|mai)/gi, ' ');
    matchedTokensCount += 1;
  } else if (lowerWorking.includes('ngày kia') || lowerWorking.includes('mốt')) {
    detectedDate = formatIso(addDays(referenceDate, 2));
    working = working.replace(/(?:ngày kia|mốt)/gi, ' ');
    matchedTokensCount += 1;
  } else {
    // Check Day of week: "thứ 2" .. "thứ 7", "chủ nhật"
    const dowRegex = /(?:thứ\s*([2-7]|hai|ba|tư|năm|sáu|bảy)|chủ nhật|cn)/i;
    const dowMatch = working.match(dowRegex);
    if (dowMatch) {
      let targetDay = 1;
      const val = dowMatch[1]?.toLowerCase() || dowMatch[0].toLowerCase();
      if (val === '2' || val === 'hai') targetDay = 1;
      else if (val === '3' || val === 'ba') targetDay = 2;
      else if (val === '4' || val === 'tư') targetDay = 3;
      else if (val === '5' || val === 'năm') targetDay = 4;
      else if (val === '6' || val === 'sáu') targetDay = 5;
      else if (val === '7' || val === 'bảy') targetDay = 6;
      else if (val === 'chủ nhật' || val === 'cn') targetDay = 0;

      const currentDay = referenceDate.getDay();
      let diff = (targetDay - currentDay + 7) % 7;
      if (diff === 0) diff = 7; // nearest upcoming in next 7 days

      detectedDate = formatIso(addDays(referenceDate, diff));
      working = working.replace(dowMatch[0], ' ');
      matchedTokensCount += 1;
    } else {
      // Check explicit date: DD/MM or DD-MM
      const explicitDateRegex = /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?/;
      const expMatch = working.match(explicitDateRegex);
      if (expMatch) {
        const d = parseInt(expMatch[1]!, 10);
        const m = parseInt(expMatch[2]!, 10);
        const y = expMatch[3] ? parseInt(expMatch[3], 10) : referenceDate.getFullYear();
        detectedDate = `${y}-${pad2(m)}-${pad2(d)}`;
        working = working.replace(expMatch[0], ' ');
        matchedTokensCount += 1;
      }
    }
  }

  // Fallback date: today
  if (!detectedDate) {
    detectedDate = formatIso(referenceDate);
  }

  // -------------------------------------------------------------
  // Pass 4: Event Type Classification
  // -------------------------------------------------------------
  const normalizedForType = input.toLowerCase();

  if (/\b(thi|kiểm tra|deadline|nộp bài|bài tập lớn|btl|quiz|test|bảo vệ)\b/i.test(normalizedForType)) {
    detectedType = 'exam';
  } else if (/\b(họp nhóm|workshop|clb|câu lạc bộ|sinh hoạt|meeting|lab)\b/i.test(normalizedForType)) {
    detectedType = 'club';
  } else if (/\b(chạy bộ|gym|ăn tối|cafe|cà phê|mua sắm|đi chơi|nghỉ ngơi|xem phim)\b/i.test(normalizedForType)) {
    detectedType = 'personal';
  } else if (/\b(lớp|tiết|giảng đường|thực hành|lý thuyết|môn học)\b/i.test(normalizedForType)) {
    detectedType = 'class';
  } else if (/\b(ôn|ôn tập|tự học|làm bài|cày|đọc sách|luyện đề|học bài)\b/i.test(normalizedForType)) {
    detectedType = 'study';
  } else {
    detectedType = 'study';
  }

  // -------------------------------------------------------------
  // Pass 5: Title Cleansing
  // -------------------------------------------------------------
  let cleanedTitle = working
    .replace(/\b(?:lúc|vào|ngày|tại|ở|trong|từ)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove leading/trailing non-alphanumeric punctuation
  cleanedTitle = cleanedTitle.replace(/^[-–—:,.\s]+|[-–—:,.\s]+$/g, '');

  if (!cleanedTitle || cleanedTitle.length < 2) {
    // Generate fallback title based on type
    const fallbackTitles: Record<EventType, string> = {
      exam: 'Kiểm tra / Thi cử',
      class: 'Buổi học trên lớp',
      club: 'Họp nhóm CLB',
      personal: 'Công việc cá nhân',
      study: 'Phiên tự học',
    };
    cleanedTitle = fallbackTitles[detectedType];
  } else {
    // Capitalize first character
    cleanedTitle = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
  }

  const confidence = Math.min(1.0, 0.4 + matchedTokensCount * 0.15);

  return {
    title: cleanedTitle,
    type: detectedType,
    date: detectedDate || formatIso(referenceDate),
    start: detectedStart || '09:00',
    end: detectedEnd || '10:00',
    location: detectedLocation,
    confidence: Number(confidence.toFixed(2)),
    rawInput: input,
  };
}
