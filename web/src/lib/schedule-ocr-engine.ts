/**
 * CampusOS AI Smart OCR Schedule Importer Engine
 * Zero-dependency direct REST integration with Google Generative Language API (Gemini 1.5 Flash Vision)
 * with robust offline Vietnamese university timetable fallback.
 */

import {
  getPeriodTimeRange,
  normalizeDayOfWeek,
  type ExtractedScheduleCourse,
} from './period-time-mapper.ts';

export { type ExtractedScheduleCourse };

export interface ScheduleScanResponse {
  success: boolean;
  source: 'gemini' | 'fallback' | 'sample';
  courses: ExtractedScheduleCourse[];
  totalExtracted: number;
  metadata?: {
    university?: string;
    semester?: string;
    academicYear?: string;
    studentName?: string;
  };
  processingTimeMs?: number;
  error?: string;
}

export interface ScheduleOcrOptions {
  apiKey?: string;
  customApiKey?: string;
  mimeType?: string;
  timeoutMs?: number;
  universityPreset?: 'standard' | 'hust';
  useSample?: boolean;
}

/**
 * Standard 15 Vietnamese university academic periods table
 */
export const STANDARD_PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1:  { start: '07:00', end: '07:45' },
  2:  { start: '07:50', end: '08:35' },
  3:  { start: '08:40', end: '09:25' },
  4:  { start: '09:35', end: '10:20' },
  5:  { start: '10:25', end: '11:10' },
  6:  { start: '11:15', end: '12:00' },
  7:  { start: '12:30', end: '13:15' },
  8:  { start: '13:20', end: '14:05' },
  9:  { start: '14:10', end: '14:55' },
  10: { start: '15:05', end: '15:50' },
  11: { start: '15:55', end: '16:40' },
  12: { start: '16:45', end: '17:30' },
  13: { start: '18:00', end: '18:45' },
  14: { start: '18:50', end: '19:35' },
  15: { start: '19:40', end: '20:25' },
  16: { start: '20:30', end: '21:15' },
};

/**
 * Common period block mappings
 */
export const STANDARD_BLOCK_TIMES: Record<string, { start: string; end: string }> = {
  '1-3':   { start: '07:00', end: '09:25' },
  '4-6':   { start: '09:35', end: '12:00' },
  '7-9':   { start: '12:30', end: '14:55' },
  '10-12': { start: '15:05', end: '17:30' },
  '7-10':  { start: '12:30', end: '15:50' },
  '13-15': { start: '18:00', end: '20:25' },
};

/**
 * Color palette for UI display
 */
export const COURSE_COLOR_PALETTE = [
  '#3DE8FF', // Cyan
  '#7C5CFF', // Purple
  '#FF3D6E', // Neon Pink/Red
  '#FFB020', // Amber
  '#3DFFB0', // Emerald Green
  '#A78BFA', // Violet
  '#F43F5E', // Rose
];

/**
 * High-fidelity 5 authentic Vietnamese university courses fixture
 */
export const MOCK_VIETNAMESE_TIMETABLE: ExtractedScheduleCourse[] = [
  {
    id: 'sample-1',
    courseCode: 'IT005.O21',
    courseName: 'Mạng máy tính & Truyền thông',
    credits: 3,
    dayOfWeek: 2,
    dayOfWeekName: 'Thứ Hai',
    startPeriod: 1,
    endPeriod: 3,
    periodString: 'Tiết 1 - 3',
    startTime: '07:00',
    endTime: '09:25',
    room: 'B.304 · Tòa B',
    instructor: 'TS. Lê Văn An',
    weeks: 'Tuần 1-15',
    type: 'class',
    color: '#3DE8FF',
    isSelected: true,
  },
  {
    id: 'sample-2',
    courseCode: 'IT003.N12',
    courseName: 'Cấu trúc Dữ liệu & Giải thuật',
    credits: 4,
    dayOfWeek: 3,
    dayOfWeekName: 'Thứ Ba',
    startPeriod: 7,
    endPeriod: 9,
    periodString: 'Tiết 7 - 9',
    startTime: '12:30',
    endTime: '15:00',
    room: 'A2-501 · Tòa A2',
    instructor: 'PGS.TS. Trần Văn Bình',
    weeks: 'Tuần 1-15',
    type: 'class',
    color: '#7C5CFF',
    isSelected: true,
  },
  {
    id: 'sample-3',
    courseCode: 'MA006.O11',
    courseName: 'Giải tích 2 (Toán cao cấp)',
    credits: 4,
    dayOfWeek: 4,
    dayOfWeekName: 'Thứ Tư',
    startPeriod: 4,
    endPeriod: 6,
    periodString: 'Tiết 4 - 6',
    startTime: '09:35',
    endTime: '11:55',
    room: 'C102 · Tòa C',
    instructor: 'TS. Phạm Hoàng Nam',
    weeks: 'Tuần 1-15',
    type: 'class',
    color: '#FF3D6E',
    isSelected: true,
  },
  {
    id: 'sample-4',
    courseCode: 'LLCT01.N05',
    courseName: 'Triết học Mác - Lênin',
    credits: 3,
    dayOfWeek: 5,
    dayOfWeekName: 'Thứ Năm',
    startPeriod: 1,
    endPeriod: 3,
    periodString: 'Tiết 1 - 3',
    startTime: '07:00',
    endTime: '09:25',
    room: 'D301 · Tòa D',
    instructor: 'ThS. Vũ Thị Mai Lan',
    weeks: 'Tuần 1-15',
    type: 'class',
    color: '#FFB020',
    isSelected: true,
  },
  {
    id: 'sample-5',
    courseCode: 'IT005.O21.1',
    courseName: 'Thực hành Mạng máy tính (Lab Cisco)',
    credits: 1,
    dayOfWeek: 6,
    dayOfWeekName: 'Thứ Sáu',
    startPeriod: 7,
    endPeriod: 10,
    periodString: 'Tiết 7 - 10',
    startTime: '12:30',
    endTime: '15:55',
    room: 'Lab Cisco 402 · Tòa E',
    instructor: 'ThS. Đỗ Minh Quân',
    weeks: 'Tuần 3-14',
    type: 'lab',
    color: '#3DFFB0',
    isSelected: true,
  },
];

/**
 * Returns a cloned sample schedule with unique IDs
 */
export function getSampleScheduleCourses(): ExtractedScheduleCourse[] {
  const timestamp = Date.now();
  return MOCK_VIETNAMESE_TIMETABLE.map((c, idx) => ({
    ...c,
    id: `sample-${timestamp}-${idx + 1}`,
  }));
}

/**
 * Period to time range mapper with explicit time preservation
 */
export function mapPeriodsToTime(
  startPeriod: number,
  endPeriod: number,
  options?: { explicitStartTime?: string; explicitEndTime?: string; preset?: 'standard' | 'hust' }
): { startTime: string; endTime: string; isExplicit: boolean } {
  // If explicit valid time format "HH:mm" is provided, preserve it
  const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
  if (
    options?.explicitStartTime &&
    options?.explicitEndTime &&
    timeRegex.test(options.explicitStartTime.trim()) &&
    timeRegex.test(options.explicitEndTime.trim())
  ) {
    return {
      startTime: options.explicitStartTime.trim(),
      endTime: options.explicitEndTime.trim(),
      isExplicit: true,
    };
  }

  // Use getPeriodTimeRange
  const range = getPeriodTimeRange(startPeriod, endPeriod, options);
  return {
    startTime: range.startTime,
    endTime: range.endTime,
    isExplicit: false,
  };
}

/**
 * Vision OCR prompt tailored to Vietnamese university timetable portal screenshots
 */
export const VIETNAMESE_TIMETABLE_OCR_PROMPT = `Bạn là hệ thống AI Vision OCR chuyên trích xuất Thời khóa biểu (TKB) của các trường đại học tại Việt Nam từ ảnh chụp màn hình (portal đào tạo ĐHQG, Bách Khoa, Sư phạm Kỹ thuật, UET, PTIT, NEU, Kinh tế...).

Hãy phân tích toàn bộ ảnh chụp thời khóa biểu và trích xuất danh sách tất cả các môn học/lớp học phần thành định dạng JSON chuẩn.

Yêu cầu chi tiết:
1. Giữ nguyên tiếng Việt có dấu chuẩn xác cho Tên môn học (courseName), ví dụ: "Cấu trúc Dữ liệu & Giải thuật", "Mạng máy tính & Truyền thông", "Giải tích 2", "Triết học Mác - Lênin".
2. Trích xuất mã học phần (courseCode) nếu có (ví dụ: IT005, MI1111, CS101...).
3. Thứ trong tuần (dayOfWeek):
   - Thứ 2 = 2, Thứ 3 = 3, Thứ 4 = 4, Thứ 5 = 5, Thứ 6 = 6, Thứ 7 = 7, Chủ Nhật = 8.
   - dayOfWeekName: "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật".
4. Tiết học (startPeriod, endPeriod, periodString):
   - startPeriod: số tiết bắt đầu (ví dụ: 1, 4, 7, 10, 13).
   - endPeriod: số tiết kết thúc (ví dụ: 3, 6, 9, 12, 15).
   - periodString: chuỗi tiết nguyên bản (ví dụ: "Tiết 1 - 3", "Tiết 7 - 9").
5. Giờ học cụ thể (startTime, endTime):
   - Nếu trong ảnh có ghi giờ rõ ràng (ví dụ: "07:00 - 09:25", "12:30 - 15:00"), trích xuất chuẩn định dạng "HH:mm".
   - Nếu không có giờ, để null hoặc tính theo tiết chuẩn.
6. Phòng học (room): ví dụ "B.304 · Tòa B", "A2-501", "Lab Cisco 402". Nếu không rõ ghi "Chưa xếp phòng".
7. Giảng viên (instructor): ví dụ "TS. Lê Văn An", "PGS.TS. Trần Văn Bình". Nếu không rõ ghi "Đang cập nhật".
8. Tuần học (weeks): ví dụ "Tuần 1-15", "1-16".
9. Loại lớp (type):
   - "lab" nếu là thực hành, thí nghiệm, lab.
   - "class" nếu là lý thuyết hoặc lớp thông thường.
10. Số tín chỉ (credits): số nguyên từ 1 đến 5 nếu có.

Định dạng JSON trả về bắt buộc:
{
  "courses": [
    {
      "courseCode": "IT005.O21",
      "courseName": "Mạng máy tính & Truyền thông",
      "credits": 3,
      "dayOfWeek": 2,
      "dayOfWeekName": "Thứ Hai",
      "startPeriod": 1,
      "endPeriod": 3,
      "periodString": "Tiết 1 - 3",
      "startTime": "07:00",
      "endTime": "09:25",
      "room": "B.304 · Tòa B",
      "instructor": "TS. Lê Văn An",
      "weeks": "Tuần 1-15",
      "type": "class"
    }
  ],
  "metadata": {
    "university": "ĐHQG TP.HCM",
    "semester": "Học kỳ 1",
    "academicYear": "2024-2025"
  }
}`;

/**
 * Robust JSON extraction helper
 */
export function parseGeminiJsonResponse(rawText: string): { courses: unknown[]; metadata?: Record<string, unknown> } {
  let cleaned = rawText.trim();

  // Strip code fences if present (```json ... ``` or ``` ... ```)
  const fenceMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1]!.trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Relaxed cleanup for trailing commas and smart quotes
    const sanitized = cleaned
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\u201C\u201D]/g, '"');
    parsed = JSON.parse(sanitized);
  }

  if (Array.isArray(parsed)) {
    return { courses: parsed };
  }

  if (parsed && typeof parsed === 'object') {
    const list = Array.isArray(parsed.courses)
      ? parsed.courses
      : Array.isArray(parsed.data)
      ? parsed.data
      : Array.isArray(parsed.schedule)
      ? parsed.schedule
      : Array.isArray(parsed.danhSachMonHoc)
      ? parsed.danhSachMonHoc
      : [];
    return { courses: list, metadata: parsed.metadata };
  }

  return { courses: [] };
}

/**
 * Normalizes and enriches a raw course item extracted by Gemini Vision
 */
export function sanitizeExtractedCourse(raw: any, index: number): ExtractedScheduleCourse {
  const normDay = normalizeDayOfWeek(raw.dayOfWeek || raw.dayOfWeekName || raw.day || raw.thu || 2);
  const dayOfWeek = normDay ? normDay.dayOfWeek : 2;
  const dayOfWeekName = normDay ? normDay.vietnameseName : 'Thứ Hai';

  const courseCode = String(raw.courseCode || raw.code || raw.maMon || raw.maLop || '').trim() || `HP${String(index + 1).padStart(2, '0')}`;
  const courseName = String(raw.courseName || raw.name || raw.tenMon || raw.tenMonHoc || 'Môn học mới').trim();

  const startPeriod = Math.max(1, Number(raw.startPeriod || raw.tietBatDau || 1));
  const endPeriod = Math.max(startPeriod, Number(raw.endPeriod || raw.tietKetThuc || (startPeriod + 2)));
  const periodString = raw.periodString || raw.tiet || `Tiết ${startPeriod} - ${endPeriod}`;

  const timeInfo = mapPeriodsToTime(startPeriod, endPeriod, {
    explicitStartTime: raw.startTime || raw.gioBatDau,
    explicitEndTime: raw.endTime || raw.gioKetThuc,
  });

  const room = String(raw.room || raw.phong || raw.phongHoc || 'Chưa xếp phòng').trim();
  const instructor = String(raw.instructor || raw.giangVien || raw.gv || 'Đang cập nhật').trim();
  const weeks = String(raw.weeks || raw.tuan || raw.tuanHoc || 'Tuần 1-15').trim();

  const lowerName = courseName.toLowerCase();
  const lowerRoom = room.toLowerCase();
  const isLab =
    String(raw.type || '').toLowerCase().includes('lab') ||
    lowerName.includes('thực hành') ||
    lowerName.includes('thí nghiệm') ||
    lowerName.includes('lab') ||
    lowerRoom.includes('lab') ||
    lowerRoom.includes('thực hành');
  const type: 'class' | 'lab' = isLab ? 'lab' : 'class';

  const color = raw.color || COURSE_COLOR_PALETTE[index % COURSE_COLOR_PALETTE.length];

  return {
    id: raw.id || `ocr-${index + 1}-${Math.random().toString(36).substring(2, 7)}`,
    courseCode,
    courseName,
    credits: typeof raw.credits === 'number' ? raw.credits : 3,
    dayOfWeek,
    dayOfWeekName,
    startPeriod,
    endPeriod,
    periodString,
    startTime: timeInfo.startTime,
    endTime: timeInfo.endTime,
    room,
    instructor,
    weeks,
    type,
    color,
    isSelected: raw.isSelected !== false,
  };
}

/**
 * Direct native REST call to Google Generative Language API (Gemini 1.5 Flash Vision)
 */
export async function callGeminiVisionSchedule(
  imageBase64: string,
  apiKey: string,
  mimeType: string = 'image/jpeg',
  timeoutMs: number = 25000
): Promise<ExtractedScheduleCourse[]> {
  // Strip data URL header if present
  let cleanBase64 = imageBase64.trim();
  let detectedMime = mimeType;
  const match = cleanBase64.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    detectedMime = match[1]!;
    cleanBase64 = match[2]!;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: VIETNAMESE_TIMETABLE_OCR_PROMPT,
          },
          {
            inlineData: {
              mimeType: detectedMime || 'image/jpeg',
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.95,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Gemini Vision API status ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini Vision returned empty candidate text');
    }

    const { courses: rawCourses } = parseGeminiJsonResponse(candidateText);
    if (!Array.isArray(rawCourses) || rawCourses.length === 0) {
      throw new Error('No courses could be parsed from Gemini output');
    }

    return rawCourses.map((c, idx) => sanitizeExtractedCourse(c, idx));
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Top-level Schedule Scanner entrypoint with resilient fallback.
 * Supports polymorphic calling signatures:
 *   scanScheduleImage(imageBase64, options)
 *   scanScheduleImage(options)
 */
export async function scanScheduleImage(
  imageOrOptions: string | ScheduleOcrOptions,
  maybeOptions?: ScheduleOcrOptions
): Promise<ScheduleScanResponse> {
  const startTime = Date.now();

  let imageBase64 = '';
  let options: ScheduleOcrOptions | undefined;

  if (typeof imageOrOptions === 'string') {
    imageBase64 = imageOrOptions;
    options = maybeOptions;
  } else if (imageOrOptions && typeof imageOrOptions === 'object') {
    options = imageOrOptions;
    imageBase64 = '';
  }

  // If user requested sample timetable directly
  if (options?.useSample) {
    const courses = getSampleScheduleCourses();
    return {
      success: true,
      source: 'sample',
      courses,
      totalExtracted: courses.length,
      metadata: {
        university: 'Trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM (TKB Mẫu)',
        semester: 'Học kỳ 1',
        academicYear: '2024-2025',
      },
      processingTimeMs: Date.now() - startTime,
    };
  }

  // Resolve API key
  const apiKey =
    options?.customApiKey ||
    options?.apiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_AI_API_KEY;

  // If no Gemini key is provided or offline environment
  if (!apiKey || apiKey.trim() === '') {
    const courses = getSampleScheduleCourses();
    return {
      success: true,
      source: 'fallback',
      courses,
      totalExtracted: courses.length,
      metadata: {
        university: 'Đại học Quốc gia (Dữ liệu mẫu dự phòng - Chưa cấu hình API Key)',
        semester: 'Học kỳ 1',
      },
      processingTimeMs: Date.now() - startTime,
    };
  }

  // Attempt live Gemini OCR
  try {
    const courses = await callGeminiVisionSchedule(
      imageBase64,
      apiKey,
      options?.mimeType || 'image/jpeg',
      options?.timeoutMs || 25000
    );

    return {
      success: true,
      source: 'gemini',
      courses,
      totalExtracted: courses.length,
      metadata: {
        university: 'Đại học Quốc gia',
        semester: 'Học kỳ 1',
      },
      processingTimeMs: Date.now() - startTime,
    };
  } catch (geminiError: any) {
    console.warn('[ScheduleOCR] Gemini Vision call failed, switching to high-fidelity mock fallback:', geminiError?.message);
    const courses = getSampleScheduleCourses();
    return {
      success: true,
      source: 'fallback',
      courses,
      totalExtracted: courses.length,
      metadata: {
        university: 'Đại học Quốc gia (Mẫu dự phòng do mạng/quota)',
        semester: 'Học kỳ 1',
      },
      processingTimeMs: Date.now() - startTime,
    };
  }
}
