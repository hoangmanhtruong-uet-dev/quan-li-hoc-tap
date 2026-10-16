/**
 * CampusOS Pure Tasks Engine
 * Deterministic date grouping, Eisenhower quadrant classification,
 * Vietnamese NLP task QuickAdd extraction, and real-time urgency/countdown calculations.
 */

import type {
  TaskItem,
  TaskPriority,
  EisenhowerQuadrant,
  TaskDateGroupKey,
  ParsedTaskResult,
  UrgencyLevel,
} from '../types/tasks.ts';
import { formatIsoDateOnly } from './campus-store.ts';

/**
 * Parses safe timestamp in milliseconds from date or ISO string.
 * Uses local time components for naive ISO strings without timezone offsets.
 */
function parseSafeIsoTime(dueAt: string): number {
  if (!dueAt) return NaN;
  if (dueAt.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(dueAt)) {
    const parts = dueAt.split('-').map(Number);
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];
    if (y === undefined || m === undefined || d === undefined || isNaN(y) || isNaN(m) || isNaN(d)) return NaN;
    return new Date(y, m - 1, d, 23, 59, 59).getTime();
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?$/.test(dueAt)) {
    const parts = dueAt.split('T');
    const datePart = parts[0] || '';
    const timePart = parts[1] || '00:00:00';
    const dateSub = datePart.split('-').map(Number);
    const y = dateSub[0];
    const m = dateSub[1];
    const d = dateSub[2];
    if (y === undefined || m === undefined || d === undefined || isNaN(y) || isNaN(m) || isNaN(d)) return NaN;
    const timeSub = timePart.split(':');
    const h = parseInt(timeSub[0] || '0', 10);
    const min = parseInt(timeSub[1] || '0', 10);
    const s = parseInt(timeSub[2] || '0', 10);
    return new Date(y, m - 1, d, h, min, s).getTime();
  }
  return new Date(dueAt).getTime();
}

/**
 * Calculates calendar day difference between two YYYY-MM-DD date strings.
 * Returns positive if dateStrB is after dateStrA.
 */
export function daysDifference(dateStrA: string, dateStrB: string): number {
  if (!dateStrA || !dateStrB) return 0;
  const [y1, m1, d1] = dateStrA.slice(0, 10).split('-').map(Number);
  const [y2, m2, d2] = dateStrB.slice(0, 10).split('-').map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 0;
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / 86400000);
}

/**
 * Categorizes a task into one of the 6 sticky date groups:
 * 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'later' | 'done'
 */
export function getTaskDateGroup(
  task: TaskItem,
  referenceDate: Date = new Date()
): TaskDateGroupKey {
  if (task.status === 'done') {
    return 'done';
  }

  if (!task.dueAt) {
    return 'later';
  }

  const todayStr = formatIsoDateOnly(referenceDate, 0);
  const taskDueDateOnly = task.dueAt.slice(0, 10);

  if (taskDueDateOnly < todayStr) {
    return 'overdue';
  }
  if (taskDueDateOnly === todayStr) {
    return 'today';
  }

  const tomorrowStr = formatIsoDateOnly(referenceDate, 1);
  if (taskDueDateOnly === tomorrowStr) {
    return 'tomorrow';
  }

  // End of current calendar week (Sunday)
  const currentDayOfWeek = referenceDate.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const daysUntilSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek;
  const sundayStr = formatIsoDateOnly(referenceDate, daysUntilSunday);

  if (taskDueDateOnly <= sundayStr) {
    return 'this_week';
  }

  return 'later';
}

/**
 * Groups an array of tasks into all 6 sticky date groups.
 */
export function groupTasksByDate(
  tasks: TaskItem[],
  referenceDate: Date = new Date()
): Record<TaskDateGroupKey, TaskItem[]> {
  const groups: Record<TaskDateGroupKey, TaskItem[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    this_week: [],
    later: [],
    done: [],
  };

  for (const task of tasks) {
    const key = getTaskDateGroup(task, referenceDate);
    groups[key].push(task);
  }

  return groups;
}

/**
 * Computes the recommended Eisenhower 2x2 matrix quadrant:
 * - 'do_first'   (Q1: Urgent & Important, Làm ngay)
 * - 'schedule'   (Q2: Not Urgent & Important, Lên lịch)
 * - 'delegate'   (Q3: Urgent & Not Important, Giao / Dời)
 * - 'eliminate'  (Q4: Not Urgent & Not Important, Bỏ bớt)
 */
export function computeEisenhowerQuadrant(
  task: TaskItem,
  referenceDate: Date = new Date()
): EisenhowerQuadrant {
  // If user explicitly configured a quadrant, respect manual placement
  if (task.quadrant) {
    return task.quadrant;
  }

  const todayStr = formatIsoDateOnly(referenceDate, 0);
  const taskDueDateOnly = task.dueAt ? task.dueAt.slice(0, 10) : '';

  // Urgent: Overdue, due within 2 days (<= 48 hours), or priority is 'urgent'
  let isUrgent = false;
  if (task.priority === 'urgent') {
    isUrgent = true;
  } else if (taskDueDateOnly) {
    const diff = daysDifference(todayStr, taskDueDateOnly);
    isUrgent = diff <= 2;
  }

  // Important: Urgent or High priority, difficulty >= 4, or title contains major academic keywords
  const academicKeywordRegex =
    /(?:^|[^\p{L}\p{N}])(thi|bài tập lớn|btl|khóa luận|báo cáo|đồ án|chuyên đề|giữa kỳ|cuối kỳ)(?=$|[^\p{L}\p{N}])/ui;

  const isImportant =
    task.priority === 'urgent' ||
    task.priority === 'high' ||
    task.difficulty >= 4 ||
    academicKeywordRegex.test(task.title);

  if (isUrgent && isImportant) return 'do_first';
  if (!isUrgent && isImportant) return 'schedule';
  if (isUrgent && !isImportant) return 'delegate';
  return 'eliminate';
}

/**
 * Formats countdown string:
 * - Overdue: "Quá hạn X ngày" or "Quá hạn Xh"
 * - >= 2 days: "Còn X ngày"
 * - 1 day: "Còn 1 ngày"
 * - < 24h: "HH:MM:SS"
 */
export function formatCountdown(
  dueAt: string,
  referenceDate: Date = new Date()
): string {
  if (!dueAt) return 'Không có hạn';

  const now = referenceDate.getTime();
  const dueTime = parseSafeIsoTime(dueAt);

  if (isNaN(dueTime)) return 'Ngày không hợp lệ';

  const diffMs = dueTime - now;

  if (diffMs < 0) {
    const absMs = Math.abs(diffMs);
    const absHours = Math.floor(absMs / (1000 * 60 * 60));
    const absDays = Math.floor(absHours / 24);
    if (absDays >= 1) {
      return `Quá hạn ${absDays} ngày`;
    }
    return `Quá hạn ${Math.max(1, absHours)}h`;
  }

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays >= 2) {
    return `Còn ${totalDays} ngày`;
  }
  if (totalDays === 1) {
    return `Còn 1 ngày`;
  }

  // Under 24 hours: Live HH:MM:SS format
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Computes urgency metrics and visual feedback color for a task due date.
 * - < 0h: red, overdue
 * - < 3h: red, panic shake
 * - <= 24h: orange
 * - > 24h: lime
 */
export function getUrgencyLevel(
  dueAt: string,
  referenceDate: Date = new Date()
): UrgencyLevel {
  if (!dueAt) {
    return {
      isOverdue: false,
      hoursRemaining: 999,
      color: 'lime',
      isPanic: false,
      displayCountdown: 'Không có hạn',
    };
  }

  const now = referenceDate.getTime();
  const dueTime = parseSafeIsoTime(dueAt);

  if (isNaN(dueTime)) {
    return {
      isOverdue: false,
      hoursRemaining: 999,
      color: 'lime',
      isPanic: false,
      displayCountdown: 'Ngày không hợp lệ',
    };
  }

  const diffMs = dueTime - now;
  const hoursRemaining = diffMs / (1000 * 60 * 60);
  const displayCountdown = formatCountdown(dueAt, referenceDate);

  if (diffMs < 0) {
    return {
      isOverdue: true,
      hoursRemaining,
      color: 'red',
      isPanic: true,
      displayCountdown,
    };
  }

  if (hoursRemaining < 3) {
    return {
      isOverdue: false,
      hoursRemaining,
      color: 'red',
      isPanic: true,
      displayCountdown,
    };
  }

  if (hoursRemaining <= 24) {
    return {
      isOverdue: false,
      hoursRemaining,
      color: 'orange',
      isPanic: false,
      displayCountdown,
    };
  }

  return {
    isOverdue: false,
    hoursRemaining,
    color: 'lime',
    isPanic: false,
    displayCountdown,
  };
}

const KNOWN_COURSES = [
  { key: /mạng máy tính|mạng/i, name: 'Mạng máy tính' },
  { key: /triết học mác\s*[-–]\s*lênin|triết học|triết/i, name: 'Triết học Mác - Lênin' },
  { key: /cấu trúc dữ liệu\s*&\s*giải thuật|cấu trúc dữ liệu|ctdl\s*(?:và|&)\s*giải thuật|ctdl\s*&\s*gt|ctdl/i, name: 'CTDL & GT' },
  { key: /xác suất thống kê|xác suất/i, name: 'Xác suất Thống kê' },
  { key: /toán rời rạc/i, name: 'Toán rời rạc' },
  { key: /(?:toán\s+)?giải\s+tích(?:\s*[123]|I{1,3})?/i, name: 'Giải tích' },
  { key: /kỹ thuật lập trình/i, name: 'Kỹ thuật lập trình' },
  { key: /dự án web|lập trình web|web/i, name: 'Dự án Web' },
  { key: /clb công nghệ/i, name: 'CLB Công nghệ' },
];

/**
 * Deterministic multi-pass Vietnamese Natural Language Task Parser.
 * Transforms strings like "nộp bài tập mạng 23h ngày mai 90p ưu tiên cao" into structured draft attributes.
 */
export function parseVietnameseTaskInput(
  rawInput: string,
  referenceDate: Date = new Date()
): ParsedTaskResult {
  if (!rawInput || !rawInput.trim()) {
    return {
      title: 'Nhiệm vụ mới',
      dueDate: formatIsoDateOnly(referenceDate, 0),
      dueTime: '23:59',
      estimateMin: 45,
      priority: 'medium',
      confidence: 0.2,
      rawInput: rawInput || '',
    };
  }

  // Punctuation only check
  if (/^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\s]+$/.test(rawInput)) {
    return {
      title: 'Nhiệm vụ mới',
      dueDate: formatIsoDateOnly(referenceDate, 0),
      dueTime: '23:59',
      estimateMin: 45,
      priority: 'medium',
      confidence: 0.2,
      rawInput,
    };
  }

  const normalizedInput = rawInput.normalize('NFC');
  let working = normalizedInput.trim();
  let detectedEstimateMin = 45;
  let detectedPriority: TaskPriority = 'medium';
  let detectedDueDate = formatIsoDateOnly(referenceDate, 0);
  let detectedDueTime = '23:59';
  let detectedCourse: string | undefined = undefined;
  let confidence = 0.4;

  // -----------------------------------------------------------------
  // Pass 1: Time Extraction
  // -----------------------------------------------------------------
  if (/(?:^|[^\p{L}\p{N}])(?:cuối\s+ngày|hết\s+ngày|cuoi\s+ngay|het\s+ngay)(?=$|[^\p{L}\p{N}])/ui.test(working)) {
    detectedDueTime = '23:59';
    working = working.replace(/(?:cuối\s+ngày|hết\s+ngày|cuoi\s+ngay|het\s+ngay)/ui, ' ');
    confidence += 0.15;
  }

  const colonTimeRegex = /(?:lúc\s+|vào\s+)?(\d{1,2}):(\d{2})(?:\s*(sáng|chiều|chieu|tối|toi|đêm|dem|khuya|trưa|trua))?/i;
  const combinedTimeRegex = /(?:lúc\s+|vào\s+)?(\d{1,2})h(\d{2})(?:\s*(sáng|chiều|chieu|tối|toi|đêm|dem|khuya|trưa|trua))?/i;
  const wordHourRegexWithPeriod = /(?:lúc\s+|vào\s+)?(\d{1,2})\s*(?:giờ|gio)\s*(\d{1,2})?(?:\s*(?:phút|phut))?\s*(sáng|chiều|chieu|tối|toi|đêm|dem|khuya|trưa|trua)?/i;
  const prefixedHourRegex = /(?:lúc|vào)\s+(\d{1,2})h?(?:\s*(sáng|chiều|chieu|tối|toi|đêm|dem|khuya|trưa|trua))?/i;
  const periodHourRegex = /(\d{1,2})\s*h\s*(sáng|chiều|chieu|tối|toi|đêm|dem|khuya|trưa|trua)/i;
  const hourNearDateRegex = /(\d{1,2})h(?:\s*(?:ngày|hôm|mai|mốt|thứ|chủ nhật|cn))/i;
  const standaloneHourRegex = /(?:^|[^\p{L}\p{N}.])(\d{1,2})\s*h(?=$|[^\p{L}\p{N}])/ui;

  const isStudyDurationPattern =
    /^(?:học|ôn|luyện|đọc)\s+\d+h/i.test(working) &&
    !/(?:lúc|vào|nộp|deadline|hạn|gửi|trước|thi|kiểm tra|họp|báo cáo)/i.test(working);

  let timeMatch = working.match(colonTimeRegex);
  let timeMatchStr = '';
  let h = -1;
  let m = 0;
  let period: string | undefined = undefined;

  if (timeMatch && timeMatch[1] && timeMatch[2]) {
    timeMatchStr = timeMatch[0];
    h = parseInt(timeMatch[1], 10);
    m = parseInt(timeMatch[2], 10);
    period = timeMatch[3]?.toLowerCase();
  } else if ((timeMatch = working.match(combinedTimeRegex)) && timeMatch[1] && timeMatch[2]) {
    timeMatchStr = timeMatch[0];
    h = parseInt(timeMatch[1], 10);
    m = parseInt(timeMatch[2], 10);
    period = timeMatch[3]?.toLowerCase();
  } else if ((timeMatch = working.match(wordHourRegexWithPeriod)) && timeMatch[1] && (timeMatch[3] || /lúc|vào|hạn/i.test(timeMatch[0]))) {
    timeMatchStr = timeMatch[0];
    h = parseInt(timeMatch[1], 10);
    m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    period = timeMatch[3]?.toLowerCase();
  } else if ((timeMatch = working.match(prefixedHourRegex)) && timeMatch[1]) {
    timeMatchStr = timeMatch[0];
    h = parseInt(timeMatch[1], 10);
    m = 0;
    period = timeMatch[2]?.toLowerCase();
  } else if ((timeMatch = working.match(periodHourRegex)) && timeMatch[1]) {
    timeMatchStr = timeMatch[0];
    h = parseInt(timeMatch[1], 10);
    m = 0;
    period = timeMatch[2]?.toLowerCase();
  } else if (!isStudyDurationPattern && (timeMatch = working.match(hourNearDateRegex)) && timeMatch[1]) {
    timeMatchStr = timeMatch[0].match(/(\d{1,2})h/)![0];
    h = parseInt(timeMatch[1], 10);
    m = 0;
  } else {
    const hasExplicitMinuteDur = /(?:^|[^\p{L}\p{N}])\d+(?:\.\d+)?\s*(?:p|phút|phut|min|m)(?=$|[^\p{L}\p{N}])/ui.test(working);
    const hasDeadlineOrAction = /(?:deadline|hạn|nộp|gửi|trước|thi|kiểm tra|họp|báo cáo)/ui.test(working);
    const matchStandalone = working.match(standaloneHourRegex);
    if (matchStandalone && matchStandalone[1]) {
      const val = parseInt(matchStandalone[1], 10);
      if (hasExplicitMinuteDur || hasDeadlineOrAction || val === 0 || (val >= 13 && val <= 24)) {
        timeMatchStr = matchStandalone[0].match(/(\d{1,2})\s*h/i)![0];
        h = val;
        m = 0;
      }
    }
  }

  if (h >= 0 && h <= 24) {
    if ((period === 'chiều' || period === 'chieu' || period === 'tối' || period === 'toi' || period === 'đêm' || period === 'dem' || period === 'khuya') && h < 12) {
      h += 12;
    }
    if ((period === 'sáng' || period === 'sang') && h === 12) {
      h = 0;
    }
    if (h === 24) {
      h = 0;
    }
    detectedDueTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    working = working.replace(timeMatchStr, ' ');
    confidence += 0.15;
  }

  // -----------------------------------------------------------------
  // Pass 2: Duration Extraction
  // -----------------------------------------------------------------
  const minuteDurRegex = /(?:^|[\s,])(\d+)\s*(?:phút|phut|min|p|m)(?=[\s,.:;!?-]|$)/ui;
  const wordHourRegex = /(?:^|[\s,])(\d+(?:\.\d+)?)\s*(?:tiếng|tieng|giờ|gio)(?=[\s,.:;!?-]|$)/ui;
  const floatHourRegex = /(?:^|[\s,])(\d+\.\d+)\s*h(?=[\s,.:;!?-]|$)/ui;
  const intHourRegex = /(?:^|[\s,])(\d+)\s*h(?=[\s,.:;!?-]|$)/ui;

  let durMatch = working.match(minuteDurRegex);
  if (durMatch && durMatch[1]) {
    detectedEstimateMin = parseInt(durMatch[1], 10);
    working = working.replace(durMatch[0], ' ');
    confidence += 0.15;
  } else if ((durMatch = working.match(floatHourRegex)) && durMatch[1]) {
    const val = parseFloat(durMatch[1]);
    detectedEstimateMin = Math.round(val * 60);
    working = working.replace(durMatch[0], ' ');
    confidence += 0.15;
  } else if ((durMatch = working.match(wordHourRegex)) && durMatch[1]) {
    const val = parseFloat(durMatch[1]);
    detectedEstimateMin = Math.round(val * 60);
    working = working.replace(durMatch[0], ' ');
    confidence += 0.15;
  } else if ((durMatch = working.match(intHourRegex)) && durMatch[1]) {
    const val = parseInt(durMatch[1], 10);
    detectedEstimateMin = val * 60;
    working = working.replace(durMatch[0], ' ');
    confidence += 0.15;
  }

  // -----------------------------------------------------------------
  // Pass 3: Priority Extraction (Unicode safe, anti-greedy order)
  // -----------------------------------------------------------------
  const urgentPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+(?:siêu\s+gấp|cực\s+gấp|hỏa\s+tốc|khẩn\s+cấp)|siêu\s+gấp|cực\s+gấp|hỏa\s+tốc|siêu\s+khẩn\s+cấp|khẩn\s+cấp|p0)(?=$|[^\p{L}\p{N}])/ui;
  const lowPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+thấp|không\s+gấp|thấp|p3)(?=$|[^\p{L}\p{N}])/ui;
  const highPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+cao|gấp|urgent|p1|quan\s+trọng)(?=$|[^\p{L}\p{N}])/ui;
  const medPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu tiên\s+vừa|bình\s+thường|trung\s+bình|vừa|p2)(?=$|[^\p{L}\p{N}])/ui;

  if (urgentPriorityRegex.test(working)) {
    detectedPriority = 'urgent';
    working = working.replace(/(?:ưu tiên\s+(?:siêu\s+gấp|cực\s+gấp|hỏa\s+tốc|khẩn\s+cấp)|siêu\s+gấp|cực\s+gấp|hỏa\s+tốc|siêu\s+khẩn\s+cấp|khẩn\s+cấp|p0)/ui, ' ');
    confidence += 0.15;
  } else if (lowPriorityRegex.test(working)) {
    detectedPriority = 'low';
    working = working.replace(/(?:ưu tiên\s+thấp|không\s+gấp|thấp|p3)/ui, ' ');
    confidence += 0.15;
  } else if (highPriorityRegex.test(working)) {
    detectedPriority = 'high';
    working = working.replace(/(?:ưu tiên\s+cao|gấp|urgent|p1|quan\s+trọng)/ui, ' ');
    confidence += 0.15;
  } else if (medPriorityRegex.test(working)) {
    detectedPriority = 'medium';
    working = working.replace(/(?:ưu tiên\s+vừa|bình\s+thường|trung\s+bình|vừa|p2)/ui, ' ');
    confidence += 0.1;
  }

  // -----------------------------------------------------------------
  // Pass 4: Date Extraction
  // -----------------------------------------------------------------
  const lowerWorking = working.toLowerCase();

  // Next week with specific weekday (e.g. "thứ 6 tuần sau", "chủ nhật tuần sau")
  const nextWeekDowRegex = /(?:^|[^\p{L}\p{N}])(?:thứ\s*([2-7]|hai|ba|tư|năm|sáu|bảy)|chủ nhật|cn)\s+(?:tuần\s+sau|tới)(?=$|[^\p{L}\p{N}])/ui;
  const nextWeekDowMatch = working.match(nextWeekDowRegex);

  if (nextWeekDowMatch) {
    const val = nextWeekDowMatch[1]?.toLowerCase() || nextWeekDowMatch[0].trim().toLowerCase();
    let targetDay = 1;
    if (val === '2' || val === 'hai') targetDay = 1;
    else if (val === '3' || val === 'ba') targetDay = 2;
    else if (val === '4' || val === 'tư') targetDay = 3;
    else if (val === '5' || val === 'năm') targetDay = 4;
    else if (val === '6' || val === 'sáu') targetDay = 5;
    else if (val === '7' || val === 'bảy') targetDay = 6;
    else if (val.includes('chủ nhật') || val.includes('cn')) targetDay = 0;

    const currentDay = referenceDate.getDay();
    let diff = (targetDay - currentDay + 7) % 7;
    if (diff === 0) diff = 7;
    diff += 7; // Add full week offset for "tuần sau"
    detectedDueDate = formatIsoDateOnly(referenceDate, diff);
    working = working.replace(nextWeekDowMatch[0], ' ');
    confidence += 0.15;
  } else if (lowerWorking.includes('cuối tuần') || lowerWorking.includes('cuoi tuan')) {
    const currentDay = referenceDate.getDay();
    let diff = (6 - currentDay + 7) % 7;
    if (diff === 0 && currentDay !== 6) diff = 7;
    detectedDueDate = formatIsoDateOnly(referenceDate, diff);
    working = working.replace(/(?:cuối tuần|cuoi tuan)/gi, ' ');
    confidence += 0.15;
  } else if (lowerWorking.includes('tuần sau') || lowerWorking.includes('tuan sau')) {
    detectedDueDate = formatIsoDateOnly(referenceDate, 7);
    working = working.replace(/(?:tuần sau|tuan sau)/gi, ' ');
    confidence += 0.15;
  } else if (lowerWorking.includes('hôm nay') || lowerWorking.includes('tối nay') || lowerWorking.includes('chiều nay') || lowerWorking.includes('sáng nay')) {
    detectedDueDate = formatIsoDateOnly(referenceDate, 0);
    working = working.replace(/(?:hôm nay|tối nay|chiều nay|sáng nay)/gi, ' ');
    confidence += 0.15;
  } else if (
    lowerWorking.includes('ngày mai') ||
    lowerWorking.includes('sáng mai') ||
    lowerWorking.includes('chiều mai') ||
    lowerWorking.includes('tối mai') ||
    /\bmai\b/i.test(working)
  ) {
    detectedDueDate = formatIsoDateOnly(referenceDate, 1);
    working = working.replace(/(?:ngày mai|sáng mai|chiều mai|tối mai|\bmai\b)/gi, ' ');
    confidence += 0.15;
  } else if (lowerWorking.includes('ngày kia') || lowerWorking.includes('ngày mốt') || /\bmốt\b/i.test(working)) {
    detectedDueDate = formatIsoDateOnly(referenceDate, 2);
    working = working.replace(/(?:ngày kia|ngày mốt|\bmốt\b)/gi, ' ');
    confidence += 0.15;
  } else {
    // Day of week matching
    const dowRegex = /(?:^|[^\p{L}\p{N}])(?:thứ\s*([2-7]|hai|ba|tư|năm|sáu|bảy)|chủ nhật|cn)(?=$|[^\p{L}\p{N}])/ui;
    const dowMatch = working.match(dowRegex);
    if (dowMatch) {
      const val = dowMatch[1]?.toLowerCase() || dowMatch[0].trim().toLowerCase();
      let targetDay = 1;
      if (val === '2' || val === 'hai') targetDay = 1;
      else if (val === '3' || val === 'ba') targetDay = 2;
      else if (val === '4' || val === 'tư') targetDay = 3;
      else if (val === '5' || val === 'năm') targetDay = 4;
      else if (val === '6' || val === 'sáu') targetDay = 5;
      else if (val === '7' || val === 'bảy') targetDay = 6;
      else if (val === 'chủ nhật' || val === 'cn') targetDay = 0;

      const currentDay = referenceDate.getDay();
      let diff = (targetDay - currentDay + 7) % 7;
      if (diff === 0) diff = 7;
      detectedDueDate = formatIsoDateOnly(referenceDate, diff);
      working = working.replace(dowMatch[0], ' ');
      confidence += 0.15;
    } else {
      // Explicit date DD/MM or DD-MM with optional year
      const explicitDateRegex = /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?/;
      const expMatch = working.match(explicitDateRegex);
      if (expMatch && expMatch[1] && expMatch[2]) {
        const d = parseInt(expMatch[1], 10);
        const m = parseInt(expMatch[2], 10);
        const y = expMatch[3] ? parseInt(expMatch[3], 10) : referenceDate.getFullYear();
        detectedDueDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        working = working.replace(expMatch[0], ' ');
        confidence += 0.15;
      }
    }
  }

  // -----------------------------------------------------------------
  // Pass 5: Known Course / Subject Extraction
  // -----------------------------------------------------------------
  for (const item of KNOWN_COURSES) {
    if (item.key.test(normalizedInput)) {
      detectedCourse = item.name;
      confidence += 0.15;
      break;
    }
  }

  // -----------------------------------------------------------------
  // Pass 6: Title cleaning and normalization
  // -----------------------------------------------------------------
  let cleanedTitle = working
    .replace(/\b(?:nộp|làm|học|vào|lúc|ngày|cho|môn|deadline)\b/gi, ' ')
    .replace(/[\[\]()#@!?:;*~_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  cleanedTitle = cleanedTitle.replace(/^[-–—:,.\s]+|[-–—:,.\s]+$/g, '');
  cleanedTitle = cleanedTitle.replace(/^vừa\s+/i, '');

  if (!cleanedTitle || cleanedTitle.length < 2) {
    if (detectedCourse) {
      cleanedTitle = `Bài tập ${detectedCourse}`;
    } else {
      cleanedTitle = normalizedInput.replace(/[\[\]()#@!?:;*~_]/g, ' ').replace(/\s+/g, ' ').trim() || 'Nhiệm vụ mới';
    }
  }

  cleanedTitle = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);

  return {
    title: cleanedTitle,
    course: detectedCourse,
    dueDate: detectedDueDate,
    dueTime: detectedDueTime,
    estimateMin: detectedEstimateMin,
    priority: detectedPriority,
    confidence: Math.min(1.0, Math.max(0.2, Math.round(confidence * 100) / 100)),
    rawInput,
  };
}
