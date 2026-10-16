import assert from 'node:assert/strict';

function formatIsoDateOnly(d, offsetDays = 0) {
  const target = new Date(d);
  target.setDate(target.getDate() + offsetDays);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const KNOWN_COURSES = [
  { key: /mạng máy tính|mạng/i, name: 'Mạng máy tính' },
  { key: /triết học mác\s*[-–]\s*lênin|triết học|triết/i, name: 'Triết học Mác - Lênin' },
  { key: /cấu trúc dữ liệu\s*&\s*giải thuật|cấu trúc dữ liệu|ctdl\s*(?:và|&)\s*giải thuật|ctdl\s*&\s*gt|ctdl/i, name: 'CTDL & GT' },
  { key: /xác suất thống kê|xác suất/i, name: 'Xác suất Thống kê' },
  { key: /toán rời rạc/i, name: 'Toán rời rạc' },
  { key: /kỹ thuật lập trình/i, name: 'Kỹ thuật lập trình' },
  { key: /dự án web|lập trình web|web/i, name: 'Dự án Web' },
  { key: /clb công nghệ/i, name: 'CLB Công nghệ' },
  { key: /giải tích/i, name: 'Giải tích' },
];

function parseVietnameseTaskInput(rawInput, referenceDate = new Date()) {
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
  let detectedPriority = 'medium';
  let detectedDueDate = formatIsoDateOnly(referenceDate, 0);
  let detectedDueTime = '23:59';
  let detectedCourse = undefined;
  let confidence = 0.4;

  // -----------------------------------------------------------------
  // Pass 1: Time Extraction
  // -----------------------------------------------------------------
  const PERIOD_WORDS = 'sáng|sang|trưa|trua|chiều|chieu|tối|toi|đêm|dem|khuya';
  const endOfDayRegex = /(?:^|[^\p{L}\p{N}])(?:vào\s+|lúc\s+|trước\s+)?(cuối\s+ngày|hết\s+ngày)(?=$|[^\p{L}\p{N}])/ui;

  const colonTimeRegex = new RegExp(
    `(?:lúc\\s+|vào\\s+|trước\\s+)?(\\d{1,2}):(\\d{2})(?:\\s*(${PERIOD_WORDS}))?`,
    'i'
  );
  const combinedTimeRegex = new RegExp(
    `(?:lúc\\s+|vào\\s+|trước\\s+)?(\\d{1,2})\\s*(?:h|giờ|gio)\\s*(\\d{2})(?:\\s*(?:phút|p))?(?:\\s*(${PERIOD_WORDS}))?`,
    'i'
  );
  const periodHourRegex = new RegExp(
    `(?:lúc\\s+|vào\\s+|trước\\s+)?(\\d{1,2})\\s*(?:h|giờ|gio)?\\s*(${PERIOD_WORDS})`,
    'i'
  );
  const prefixedHourRegex = new RegExp(
    `(?:lúc|vào|trước)\\s+(\\d{1,2})\\s*(?:h|giờ|gio)?(?:\\s*(${PERIOD_WORDS}))?`,
    'i'
  );
  const hourNearDateRegex = /(\d{1,2})\s*(?:h|giờ|gio)(?:\s*(?:ngày|hôm|mai|mốt|thứ|chủ nhật|cn|cuối tuần|tuần sau))/i;
  const standaloneHourRegex = /(?:^|[^\p{L}\p{N}])(\d{1,2})\s*h(?=$|[^\p{L}\p{N}])/ui;

  let timeMatch = working.match(colonTimeRegex);
  let timeMatchStr = '';
  let h = -1;
  let m = 0;
  let period = undefined;

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
  } else if ((timeMatch = working.match(periodHourRegex)) && timeMatch[1]) {
    timeMatchStr = timeMatch[0];
    h = parseInt(timeMatch[1], 10);
    m = 0;
    period = timeMatch[2]?.toLowerCase();
  } else if ((timeMatch = working.match(prefixedHourRegex)) && timeMatch[1]) {
    timeMatchStr = timeMatch[0];
    h = parseInt(timeMatch[1], 10);
    m = 0;
    period = timeMatch[2]?.toLowerCase();
  } else if ((timeMatch = working.match(hourNearDateRegex)) && timeMatch[1]) {
    timeMatchStr = timeMatch[0].match(/(\d{1,2})\s*(?:h|giờ|gio)/i)[0];
    h = parseInt(timeMatch[1], 10);
    m = 0;
  } else {
    const endOfDayMatch = working.match(endOfDayRegex);
    if (endOfDayMatch) {
      timeMatchStr = endOfDayMatch[0];
      h = 23;
      m = 59;
    } else {
      const hasExplicitMinuteDur = /(?:^|[^\p{L}\p{N}])\d+(?:\.\d+)?\s*(?:p|phút|phut|min|m)(?=$|[^\p{L}\p{N}])/ui.test(working);
      const hasDeadlineOrAction = /(?:deadline|hạn|nộp|gửi|trước|thi|kiểm tra|họp|báo cáo)/ui.test(working);
      const matchStandalone = working.match(standaloneHourRegex);
      if (matchStandalone && matchStandalone[1]) {
        const val = parseInt(matchStandalone[1], 10);
        if (hasExplicitMinuteDur || hasDeadlineOrAction || (val >= 13 && val <= 23)) {
          timeMatchStr = matchStandalone[0].match(/(\d{1,2})\s*h/i)[0];
          h = val;
          m = 0;
        }
      }
    }
  }

  if (h >= 0 && h <= 24) {
    const p = period?.toLowerCase();
    if ((p === 'chiều' || p === 'chieu' || p === 'tối' || p === 'toi') && h < 12) {
      h += 12;
    } else if ((p === 'đêm' || p === 'dem' || p === 'khuya') && h < 12) {
      h += 12;
    } else if ((p === 'đêm' || p === 'dem' || p === 'khuya') && h === 12) {
      h = 0;
    } else if ((p === 'sáng' || p === 'sang') && h === 12) {
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
  } else if ((durMatch = working.match(wordHourRegex)) && durMatch[1]) {
    const val = parseFloat(durMatch[1]);
    detectedEstimateMin = Math.round(val * 60);
    working = working.replace(durMatch[0], ' ');
    confidence += 0.15;
  } else if ((durMatch = working.match(floatHourRegex)) && durMatch[1]) {
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
  // Pass 3: Priority Extraction (Unicode safe, 4 tiers)
  // -----------------------------------------------------------------
  const urgentPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:siêu\s+gấp|khẩn\s+cấp|cực\s+gấp|siêu\s+ưu\s+tiên|urgent|p0)(?=$|[^\p{L}\p{N}])/ui;
  const highPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu\s+tiên\s+cao|gấp|p1|quan\s+trọng|cao)(?=$|[^\p{L}\p{N}])/ui;
  const lowPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu\s+tiên\s+thấp|không\s+gấp|p3|thấp)(?=$|[^\p{L}\p{N}])/ui;
  const medPriorityRegex = /(?:^|[^\p{L}\p{N}])(?:ưu\s+tiên\s+vừa|bình\s+thường|p2|trung\s+bình|vừa)(?=$|[^\p{L}\p{N}])/ui;

  if (urgentPriorityRegex.test(working)) {
    detectedPriority = 'urgent';
    working = working.replace(/(?:siêu\s+gấp|khẩn\s+cấp|cực\s+gấp|siêu\s+ưu\s+tiên|urgent|p0)/ui, ' ');
    confidence += 0.15;
  } else if (highPriorityRegex.test(working)) {
    detectedPriority = 'high';
    working = working.replace(/(?:ưu\s+tiên\s+cao|gấp|p1|quan\s+trọng|cao)/ui, ' ');
    confidence += 0.15;
  } else if (lowPriorityRegex.test(working)) {
    detectedPriority = 'low';
    working = working.replace(/(?:ưu\s+tiên\s+thấp|không\s+gấp|p3|thấp)/ui, ' ');
    confidence += 0.15;
  } else if (medPriorityRegex.test(working)) {
    detectedPriority = 'medium';
    working = working.replace(/(?:ưu\s+tiên\s+vừa|bình\s+thường|p2|trung\s+bình|vừa)/ui, ' ');
    confidence += 0.1;
  }

  // -----------------------------------------------------------------
  // Pass 4: Date Extraction
  // -----------------------------------------------------------------
  const lowerWorking = working.toLowerCase();

  if (lowerWorking.includes('hôm nay') || lowerWorking.includes('tối nay') || lowerWorking.includes('chiều nay') || lowerWorking.includes('sáng nay')) {
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
  } else if (lowerWorking.includes('cuối tuần')) {
    const isNextWeek = /(?:cuối\s+tuần\s+sau|tuần\s+sau)/i.test(working);
    const currentDay = referenceDate.getDay();
    let diff = (6 - currentDay + 7) % 7;
    if (diff === 0 && currentDay !== 6) diff = 7;
    if (isNextWeek) diff += 7;
    detectedDueDate = formatIsoDateOnly(referenceDate, diff);
    working = working.replace(/(?:vào\s+)?cuối\s+tuần(?:\s+sau)?/gi, ' ');
    confidence += 0.15;
  } else {
    const dowRegex = /(?:^|[^\p{L}\p{N}])(?:thứ\s*([2-7]|hai|ba|tư|năm|sáu|bảy)|chủ nhật|cn)(?:\s+(tuần\s+sau|tới))?(?=$|[^\p{L}\p{N}])/ui;
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
      if (dowMatch[2]) {
        diff += 7;
      }
      detectedDueDate = formatIsoDateOnly(referenceDate, diff);
      working = working.replace(dowMatch[0], ' ');
      confidence += 0.15;
    } else if (lowerWorking.includes('tuần sau')) {
      detectedDueDate = formatIsoDateOnly(referenceDate, 7);
      working = working.replace(/(?:vào\s+)?tuần\s+sau/gi, ' ');
      confidence += 0.15;
    } else {
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
    .replace(/\b(?:nộp|làm|học|vào|lúc|ngày|cho|môn|deadline|trước|hết|cuối)\b/gi, ' ')
    .replace(/[\[\]()#@!?:;*~_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  cleanedTitle = cleanedTitle.replace(/^[-–—:,.\s]+|[-–—:,.\s]+$/g, '');

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

// =========================================================================
// RUN VERIFICATION SUITE
// =========================================================================
const REF_DATE = new Date('2026-10-13T09:00:00'); // Tuesday

console.log('--- TESTING NEW REQUIREMENTS ---');

// 1. "11 giờ đêm"
const p11dem = parseVietnameseTaskInput('nộp bài 11 giờ đêm', REF_DATE);
console.log('11 giờ đêm:', p11dem);
assert.equal(p11dem.dueTime, '23:00');
assert.ok(!p11dem.title.includes('11'));
assert.ok(!p11dem.title.includes('đêm'));

// 2. "8 giờ sáng"
const p8sang = parseVietnameseTaskInput('học bài 8 giờ sáng', REF_DATE);
console.log('8 giờ sáng:', p8sang);
assert.equal(p8sang.dueTime, '08:00');
assert.ok(!p8sang.title.includes('8'));
assert.ok(!p8sang.title.includes('sáng'));

// 3. "lúc 11 giờ"
const p11h = parseVietnameseTaskInput('họp lab lúc 11 giờ', REF_DATE);
console.log('lúc 11 giờ:', p11h);
assert.equal(p11h.dueTime, '11:00');

// 4. "cuối ngày"
const pCuoiNgay = parseVietnameseTaskInput('làm bài tập cuối ngày', REF_DATE);
console.log('cuối ngày:', pCuoiNgay);
assert.equal(pCuoiNgay.dueTime, '23:59');
assert.equal(pCuoiNgay.dueDate, '2026-10-13');
assert.ok(!pCuoiNgay.title.includes('cuối ngày'));

// 5. "hết ngày mai"
const pHetNgayMai = parseVietnameseTaskInput('nộp slide hết ngày mai', REF_DATE);
console.log('hết ngày mai:', pHetNgayMai);
assert.equal(pHetNgayMai.dueTime, '23:59');
assert.equal(pHetNgayMai.dueDate, '2026-10-14');
assert.ok(!pHetNgayMai.title.includes('hết'));

// 6. "cuối tuần" (Saturday 2026-10-17)
const pCuoiTuan = parseVietnameseTaskInput('ôn tập cuối tuần', REF_DATE);
console.log('cuối tuần:', pCuoiTuan);
assert.equal(pCuoiTuan.dueDate, '2026-10-17');
assert.ok(!pCuoiTuan.title.includes('cuối tuần'));

// 7. "thứ 6 tuần sau" (2026-10-23)
const pThu6TuanSau = parseVietnameseTaskInput('ôn thi Giải tích thứ 6 tuần sau 90p', REF_DATE);
console.log('thứ 6 tuần sau:', pThu6TuanSau);
assert.equal(pThu6TuanSau.dueDate, '2026-10-23');
assert.equal(pThu6TuanSau.estimateMin, 90);
assert.equal(pThu6TuanSau.course, 'Giải tích');
assert.ok(!pThu6TuanSau.title.includes('tuần sau'));

// 8. "Deadline đồ án CTDL cuối tuần siêu gấp"
const pCtdlCuoiTuan = parseVietnameseTaskInput('Deadline đồ án CTDL cuối tuần siêu gấp', REF_DATE);
console.log('CTDL cuối tuần siêu gấp:', pCtdlCuoiTuan);
assert.equal(pCtdlCuoiTuan.course, 'CTDL & GT');
assert.equal(pCtdlCuoiTuan.priority, 'urgent');
assert.equal(pCtdlCuoiTuan.dueDate, '2026-10-17');

// 9. "siêu gấp" priority vs "gấp"
const pSieuGap = parseVietnameseTaskInput('bài tập siêu gấp', REF_DATE);
assert.equal(pSieuGap.priority, 'urgent');
const pGap = parseVietnameseTaskInput('bài tập gấp', REF_DATE);
assert.equal(pGap.priority, 'high');

// 10. Fallback when no date/time: "Nhiệm vụ đồ án"
const pFallback = parseVietnameseTaskInput('Nhiệm vụ đồ án', REF_DATE);
assert.equal(pFallback.dueDate, '2026-10-13');
assert.equal(pFallback.dueTime, '23:59');

console.log('--- TESTING EXISTING BASELINE TESTS ---');

// Existing test 1
const ex1 = parseVietnameseTaskInput('nộp bài tập mạng 23h ngày mai 90p ưu tiên cao', REF_DATE);
assert.equal(ex1.dueDate, '2026-10-14');
assert.equal(ex1.dueTime, '23:00');
assert.equal(ex1.estimateMin, 90);
assert.equal(ex1.priority, 'high');
assert.equal(ex1.course, 'Mạng máy tính');

// Existing test 2
const ex2 = parseVietnameseTaskInput('ôn thi cuối kỳ toán rời rạc 19h thứ 6', REF_DATE);
assert.equal(ex2.dueDate, '2026-10-16');
assert.equal(ex2.dueTime, '19:00');
assert.equal(ex2.course, 'Toán rời rạc');

// Existing test 3
const ex3 = parseVietnameseTaskInput('làm slide thuyết trình triết 14h30 45m ưu tiên vừa', REF_DATE);
assert.equal(ex3.dueDate, '2026-10-13');
assert.equal(ex3.dueTime, '14:30');
assert.equal(ex3.estimateMin, 45);
assert.equal(ex3.priority, 'medium');
assert.equal(ex3.course, 'Triết học Mác - Lênin');

// Existing test 6: "ôn tập dự án web 1 giờ" -> duration 60m!
const ex6 = parseVietnameseTaskInput('ôn tập dự án web 1 giờ', REF_DATE);
assert.equal(ex6.estimateMin, 60);
assert.equal(ex6.dueTime, '23:59');

// Existing challenger: "bài tập cntt 19h" -> today, 19:00, title preserves "cntt"
const exChallenger = parseVietnameseTaskInput('bài tập cntt 19h', REF_DATE);
assert.equal(exChallenger.dueDate, '2026-10-13');
assert.equal(exChallenger.dueTime, '19:00');
assert.ok(exChallenger.title.includes('cntt'));

console.log('ALL VERIFICATION ASSERTIONS PASSED PERFECTLY!');
