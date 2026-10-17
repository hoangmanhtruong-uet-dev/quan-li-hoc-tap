/**
 * CampusOS First-Login Auto-Seeding Engine
 * Provisions realistic onboarding courses, tasks across Eisenhower quadrants,
 * dynamic calendar events anchored to current date, and baseline gamification stats.
 *
 * Implements strict idempotency (< 50ms on repetitions) and sub-second execution.
 */

import { supabase, isSupabaseConfigured, isOnline } from './supabase.ts';
import type {
  CourseInsert,
  TaskInsert,
  CalendarEventInsert,
  ProfileUpdate,
} from '../types/database.ts';
import type { TaskItem } from '../types/tasks.ts';
import type { CalendarEvent } from './campus-store.ts';

export interface SeedOptions {
  force?: boolean;
  referenceDate?: Date;
}

export interface SeedResult {
  success: boolean;
  seeded: boolean;
  courseCount: number;
  taskCount: number;
  eventCount: number;
  executionTimeMs: number;
  userId: string;
  error?: string;
}

export interface SeededUserData {
  courses: CourseInsert[];
  tasks: TaskInsert[];
  events: CalendarEventInsert[];
  profile: ProfileUpdate;
  storeTasks: TaskItem[];
  storeEvents: CalendarEvent[];
  seededAt: string;
}

// In-memory cache for fast-path idempotency (< 1ms) and offline testing support
const seededRegistry = new Map<string, SeededUserData>();

// In-flight single-flight mutex to coalesce concurrent calls for the same user ID into a single execution
const inFlightSeeds = new Map<string, Promise<SeedResult>>();

/**
 * Generates an RFC 4122 v4-compliant deterministic UUID derived from (userId + key).
 * Guarantees idempotency and prevents duplicate rows across multiple runs.
 */
export function generateDeterministicUuid(userId: string, entityKey: string): string {
  const combined = `${userId}:${entityKey}`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  let h3 = 0x9e3779b9;
  let h4 = 0x85ebca6b;

  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 1597334677);
  h4 = Math.imul(h4 ^ (h4 >>> 15), 2654435761);

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const hex4 = (h4 >>> 0).toString(16).padStart(8, '0');

  const full = hex1 + hex2 + hex3 + hex4;

  const p1 = full.slice(0, 8);
  const p2 = full.slice(8, 12);
  const p3 = '4' + full.slice(13, 16); // Version 4
  const p4 = ((parseInt(full.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + full.slice(18, 20); // Variant 1
  const p5 = full.slice(20, 32);

  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

/**
 * Formats a Date object as a strict UTC 'YYYY-MM-DD' string with optional day offset.
 * Operates purely in UTC to prevent timezone shifts across global client machines.
 */
export function formatIsoDateOnly(date: Date, offsetDays = 0): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '1970-01-01';
  }
  if (offsetDays !== 0) {
    d.setUTCDate(d.getUTCDate() + offsetDays);
  }
  const y = String(d.getUTCFullYear()).padStart(4, '0');
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Builds the complete seed payload for a student dynamically anchored around referenceDate.
 */
export function buildSeedPayload(userId: string, refDate: Date = new Date()): SeededUserData {
  const today = formatIsoDateOnly(refDate, 0);
  const dayMinus2 = formatIsoDateOnly(refDate, -2);
  const dayMinus1 = formatIsoDateOnly(refDate, -1);
  const dayPlus1 = formatIsoDateOnly(refDate, 1);
  const dayPlus2 = formatIsoDateOnly(refDate, 2);
  const dayPlus3 = formatIsoDateOnly(refDate, 3);
  const dayPlus5 = formatIsoDateOnly(refDate, 5);
  const dayPlus8 = formatIsoDateOnly(refDate, 8);
  const dayPlus10 = formatIsoDateOnly(refDate, 10);

  // 1. 4 Realistic Academic Courses
  const courses: CourseInsert[] = [
    {
      id: generateDeterministicUuid(userId, 'course_cs101'),
      user_id: userId,
      code: 'CS101',
      name: 'Mạng máy tính & Truyền thông',
      credits: 4,
      instructor: 'TS. Lê Văn An',
      lecturer: 'TS. Lê Văn An',
      room: 'D201 · Tòa D',
      color: '#3DE8FF',
      semester: '2026.1',
      schedule: 'Thứ Hai (08:00 - 11:30)',
      syllabus_url: '#',
      status: 'ongoing',
      letter_grade: '—',
      grade_components: [
        { id: 'c1', name: 'Chuyên cần & Lab', weight: 20, score: 9.0 },
        { id: 'c2', name: 'Kiểm tra giữa kỳ', weight: 30, score: 8.5 },
        { id: 'c3', name: 'Thi cuối kỳ', weight: 50, score: null },
      ],
    },
    {
      id: generateDeterministicUuid(userId, 'course_cs201'),
      user_id: userId,
      code: 'CS201',
      name: 'Cấu trúc Dữ liệu & Giải thuật',
      credits: 4,
      instructor: 'TS. Trần Văn Bình',
      lecturer: 'TS. Trần Văn Bình',
      room: 'B305 · Tòa B',
      color: '#7C5CFF',
      semester: '2026.1',
      schedule: 'Thứ Ba (13:30 - 17:00)',
      syllabus_url: '#',
      status: 'ongoing',
      letter_grade: '—',
      grade_components: [
        { id: 'c1', name: 'Bài tập tuần', weight: 20, score: 8.5 },
        { id: 'c2', name: 'Đồ án giữa kỳ', weight: 30, score: 8.0 },
        { id: 'c3', name: 'Thi cuối kỳ', weight: 50, score: null },
      ],
    },
    {
      id: generateDeterministicUuid(userId, 'course_math101'),
      user_id: userId,
      code: 'MATH101',
      name: 'Xác suất Thống kê',
      credits: 3,
      instructor: 'PGS. Nguyễn Thu Hà',
      lecturer: 'PGS. Nguyễn Thu Hà',
      room: 'C101 · Tòa C',
      color: '#FFB800',
      semester: '2026.1',
      schedule: 'Thứ Tư (14:00 - 16:30)',
      syllabus_url: '#',
      status: 'warning',
      letter_grade: '—',
      grade_components: [
        { id: 'c1', name: 'Chuyên cần', weight: 20, score: 8.0 },
        { id: 'c2', name: 'Giữa kỳ', weight: 30, score: 6.5 },
        { id: 'c3', name: 'Thi cuối kỳ', weight: 50, score: null },
      ],
    },
    {
      id: generateDeterministicUuid(userId, 'course_cs302'),
      user_id: userId,
      code: 'CS302',
      name: 'Phát triển Ứng dụng Web',
      credits: 3,
      instructor: 'ThS. Hoàng Minh Đức',
      lecturer: 'ThS. Hoàng Minh Đức',
      room: 'Lab 304 · Tòa A',
      color: '#C6FF3D',
      semester: '2026.1',
      schedule: 'Thứ Năm (09:00 - 11:30)',
      syllabus_url: '#',
      status: 'ongoing',
      letter_grade: '—',
      grade_components: [
        { id: 'c1', name: 'Thuyết trình nhóm', weight: 30, score: 8.8 },
        { id: 'c2', name: 'Kiểm tra trắc nghiệm', weight: 20, score: 8.0 },
        { id: 'c3', name: 'Thi cuối kỳ', weight: 50, score: null },
      ],
    },
  ];

  // 2. 7 Tasks across Eisenhower Quadrants Q1-Q4 with Vietnamese descriptions and subtasks
  const tasks: TaskInsert[] = [
    // Task 1: Overdue task (Q1 - do_first)
    {
      id: generateDeterministicUuid(userId, 'task_overdue_report'),
      user_id: userId,
      title: 'Nộp báo cáo Thí nghiệm Mạng máy tính',
      description: 'Báo cáo bài thực hành Lab 3 Wireshark và phân tích gói tin TCP handshake.',
      course: 'CS101 - Mạng máy tính',
      course_id: 'CS101',
      status: 'todo',
      priority: 'high',
      difficulty: 4,
      due_date: `${dayMinus2}T23:59:00Z`,
      estimated_minutes: 60,
      estimate_min: 60,
      actual_min: 25,
      quadrant: 'do_first',
      eisenhower_quadrant: 'Q1',
      pomodoro_planned: 2,
      pomodoro_done: 1,
      tags: ['Lab', 'Báo cáo'],
      subtasks: [
        { id: 's-ov-1', text: 'Chụp màn hình Wireshark', done: true },
        { id: 's-ov-2', text: 'Trả lời 5 câu hỏi phân tích', done: false },
        { id: 's-ov-3', text: 'Xuất file PDF nộp LMS', done: false },
      ],
      order_index: 0,
    },
    // Task 2: Urgent task due today (Q1 - do_first)
    {
      id: generateDeterministicUuid(userId, 'task_network_project'),
      user_id: userId,
      title: 'Bài tập lớn Mạng máy tính',
      description: 'Lập trình socket mô phỏng giao thức truyền file tin cậy qua UDP (Go-Back-N).',
      course: 'CS101 - Mạng máy tính',
      course_id: 'CS101',
      status: 'todo',
      priority: 'urgent',
      difficulty: 5,
      due_date: `${today}T23:59:00Z`,
      estimated_minutes: 120,
      estimate_min: 120,
      actual_min: 60,
      quadrant: 'do_first',
      eisenhower_quadrant: 'Q1',
      pomodoro_planned: 4,
      pomodoro_done: 2,
      tags: ['BTL', 'Quan trọng'],
      subtasks: [
        { id: 's-net-1', text: 'Thiết kế header packet UDP', done: true },
        { id: 's-net-2', text: 'Viết sliding window sender/receiver', done: true },
        { id: 's-net-3', text: 'Kiểm thử loss packet với Clumsy', done: false },
        { id: 's-net-4', text: 'Viết tài liệu thuyết minh', done: false },
      ],
      order_index: 1,
    },
    // Task 3: In-progress today task (Q3 - delegate)
    {
      id: generateDeterministicUuid(userId, 'task_today_philosophy'),
      user_id: userId,
      title: 'Ôn tập trắc nghiệm Triết học Mác - Lênin',
      description: 'Ôn 80 câu hỏi chương 2 Quy luật mâu thuẫn và phủ định của phủ định.',
      course: 'Triết học Mác - Lênin',
      course_id: 'ML01',
      status: 'doing',
      priority: 'medium',
      difficulty: 3,
      due_date: `${today}T17:00:00Z`,
      estimated_minutes: 45,
      estimate_min: 45,
      actual_min: 20,
      quadrant: 'delegate',
      eisenhower_quadrant: 'Q3',
      pomodoro_planned: 2,
      pomodoro_done: 1,
      tags: ['Ôn tập', 'Lý thuyết'],
      subtasks: [
        { id: 's-ph-1', text: 'Làm đề ôn tập Quizlet', done: true },
        { id: 's-ph-2', text: 'Ghi chú các câu hay sai', done: false },
      ],
      order_index: 2,
    },
    // Task 4: Tomorrow task (Q2 - schedule)
    {
      id: generateDeterministicUuid(userId, 'task_philosophy_slides'),
      user_id: userId,
      title: 'Slide thuyết trình nhóm Triết học',
      description: 'Hoàn thiện 15 slide chủ đề Hình thái kinh tế - xã hội cùng Lan và Nam.',
      course: 'Triết học Mác - Lênin',
      course_id: 'ML01',
      status: 'todo',
      priority: 'medium',
      difficulty: 3,
      due_date: `${dayPlus1}T23:59:00Z`,
      estimated_minutes: 90,
      estimate_min: 90,
      actual_min: 30,
      quadrant: 'schedule',
      eisenhower_quadrant: 'Q2',
      pomodoro_planned: 3,
      pomodoro_done: 1,
      tags: ['Thuyết trình', 'Nhóm'],
      subtasks: [
        { id: 's-sl-1', text: 'Tổng hợp nội dung từ Word', done: true },
        { id: 's-sl-2', text: 'Thiết kế template Canva', done: false },
        { id: 's-sl-3', text: 'Gửi nhóm duyệt slide', done: false },
      ],
      order_index: 3,
    },
    // Task 5: Exam prep task (+3 days, Q2 - schedule)
    {
      id: generateDeterministicUuid(userId, 'task_prob_exam'),
      user_id: userId,
      title: 'Kiểm tra Xác suất Thống kê giữa kỳ',
      description: 'Luyện 3 đề thi các năm trước về biến ngẫu nhiên liên tục và phân phối chuẩn.',
      course: 'MATH101 - Xác suất Thống kê',
      course_id: 'MATH101',
      status: 'todo',
      priority: 'high',
      difficulty: 4,
      due_date: `${dayPlus3}T08:00:00Z`,
      estimated_minutes: 90,
      estimate_min: 90,
      actual_min: 0,
      quadrant: 'schedule',
      eisenhower_quadrant: 'Q2',
      pomodoro_planned: 3,
      pomodoro_done: 0,
      tags: ['Kiểm tra', 'Toán'],
      subtasks: [
        { id: 's-pr-1', text: 'Ôn công thức Bayes', done: true },
        { id: 's-pr-2', text: 'Làm đề năm 2024', done: false },
        { id: 's-pr-3', text: 'Làm đề năm 2025', done: false },
      ],
      order_index: 4,
    },
    // Task 6: Final exam prep (+8 days, Q2 - schedule)
    {
      id: generateDeterministicUuid(userId, 'task_dsa_final'),
      user_id: userId,
      title: 'Luyện đề thi cuối kỳ Cấu trúc dữ liệu',
      description: 'Cài đặt thuật toán Dijkstra, Floyd-Warshall và Cây AVL.',
      course: 'CS201 - Cấu trúc Dữ liệu & Giải thuật',
      course_id: 'CS201',
      status: 'todo',
      priority: 'medium',
      difficulty: 5,
      due_date: `${dayPlus8}T09:00:00Z`,
      estimated_minutes: 120,
      estimate_min: 120,
      actual_min: 0,
      quadrant: 'schedule',
      eisenhower_quadrant: 'Q2',
      pomodoro_planned: 4,
      pomodoro_done: 0,
      tags: ['Ôn thi', 'Code'],
      subtasks: [
        { id: 's-ds-1', text: 'Cài đặt Heap và AVL Tree', done: false },
        { id: 's-ds-2', text: 'Luyện 5 bài LeetCode Medium', done: false },
      ],
      order_index: 5,
    },
    // Task 7: Completed task (-1 day, Q4 - eliminate)
    {
      id: generateDeterministicUuid(userId, 'task_done_setup'),
      user_id: userId,
      title: 'Cài đặt môi trường Docker và CSDL',
      description: 'Khởi chạy container PostgreSQL và cấu hình migration cho dự án Web.',
      course: 'CS302 - Phát triển Ứng dụng Web',
      course_id: 'CS302',
      status: 'done',
      priority: 'low',
      difficulty: 2,
      due_date: `${dayMinus1}T20:00:00Z`,
      completed_at: `${dayMinus1}T19:40:00Z`,
      estimated_minutes: 45,
      estimate_min: 45,
      actual_min: 40,
      quadrant: 'eliminate',
      eisenhower_quadrant: 'Q4',
      pomodoro_planned: 1,
      pomodoro_done: 1,
      tags: ['Setup', 'DevOps'],
      subtasks: [
        { id: 's-dn-1', text: 'Viết docker-compose.yml', done: true },
        { id: 's-dn-2', text: 'Test kết nối từ Next.js', done: true },
      ],
      order_index: 6,
    },
  ];

  // 3. 10 Calendar Events dynamically anchored around current date
  const events: CalendarEventInsert[] = [
    {
      id: generateDeterministicUuid(userId, 'event_past_1'),
      user_id: userId,
      title: 'Kỹ thuật lập trình (Buổi 1)',
      start_time: `${dayMinus2}T08:00:00Z`,
      end_time: `${dayMinus2}T09:30:00Z`,
      event_type: 'class',
      location: 'Phòng D201',
      color: '#38bdf8',
      is_all_day: false,
    },
    {
      id: generateDeterministicUuid(userId, 'event_past_2'),
      user_id: userId,
      title: 'Học nhóm CTDL & GT',
      start_time: `${dayMinus2}T14:00:00Z`,
      end_time: `${dayMinus2}T16:00:00Z`,
      event_type: 'study',
      location: 'Thư viện tầng 3',
      color: '#a855f7',
      is_all_day: false,
    },
    {
      id: generateDeterministicUuid(userId, 'event_past_3'),
      user_id: userId,
      title: 'Toán rời rạc',
      start_time: `${dayMinus1}T10:00:00Z`,
      end_time: `${dayMinus1}T11:30:00Z`,
      event_type: 'class',
      location: 'Giảng đường B',
      color: '#38bdf8',
      is_all_day: false,
    },
    {
      id: generateDeterministicUuid(userId, 'event_past_4'),
      user_id: userId,
      title: 'Chạy bộ rèn thể lực',
      start_time: `${dayMinus1}T17:30:00Z`,
      end_time: `${dayMinus1}T18:30:00Z`,
      event_type: 'personal',
      location: 'Sân vận động',
      color: '#34d399',
      is_all_day: false,
    },
    {
      id: generateDeterministicUuid(userId, 'event_today_1'),
      user_id: userId,
      title: 'Kỹ thuật lập trình',
      start_time: `${today}T08:00:00Z`,
      end_time: `${today}T09:30:00Z`,
      event_type: 'class',
      location: 'Phòng D201',
      color: '#38bdf8',
      is_all_day: false,
    },
    {
      id: generateDeterministicUuid(userId, 'event_today_2'),
      user_id: userId,
      title: 'Thực hành Mạng máy tính',
      start_time: `${today}T14:00:00Z`,
      end_time: `${today}T16:30:00Z`,
      event_type: 'class',
      location: 'Lab 304',
      color: '#38bdf8',
      is_all_day: false,
    },
    {
      id: generateDeterministicUuid(userId, 'event_future_1'),
      user_id: userId,
      title: 'Ôn tập Subnetting & Định tuyến',
      start_time: `${dayPlus1}T19:30:00Z`,
      end_time: `${dayPlus1}T20:30:00Z`,
      event_type: 'study',
      location: 'Focus room',
      color: '#a855f7',
      is_all_day: false,
    },
    {
      id: generateDeterministicUuid(userId, 'event_future_2'),
      user_id: userId,
      title: 'Workshop CLB Công nghệ (GenAI & Web)',
      start_time: `${dayPlus2}T14:30:00Z`,
      end_time: `${dayPlus2}T17:00:00Z`,
      event_type: 'personal',
      location: 'Hội trường B',
      color: '#f59e0b',
      is_all_day: false,
    },
    {
      id: generateDeterministicUuid(userId, 'event_future_3'),
      user_id: userId,
      title: 'Kiểm tra Xác suất Thống kê',
      start_time: `${dayPlus3}T08:00:00Z`,
      end_time: `${dayPlus3}T09:00:00Z`,
      event_type: 'exam',
      location: 'Phòng C302',
      color: '#ef4444',
      is_all_day: false,
    },
    {
      id: generateDeterministicUuid(userId, 'event_future_4'),
      user_id: userId,
      title: 'Thi Cấu trúc dữ liệu & Giải thuật',
      start_time: `${dayPlus8}T09:00:00Z`,
      end_time: `${dayPlus8}T11:00:00Z`,
      event_type: 'exam',
      location: 'Phòng 302',
      color: '#ef4444',
      is_all_day: false,
    },
  ];

  // 4. Baseline Profile Gamification Stats
  const profile: ProfileUpdate = {
    xp: 2840,
    level: 7,
    streak: 12,
    rank_title: 'Sinh viên cày thuê',
    onboarding_completed: true,
    streak_freezes: 1,
    study_minutes_total: 3120,
    weekly_goal_minutes: 720,
    weekly_study_minutes: 510,
    vibe_theme: 'aurora',
    last_study_date: today,
  };

  // 5. Store UI Representations for instantaneous hydration
  const storeTasks: TaskItem[] = tasks.map((t) => ({
    id: t.id!,
    title: t.title,
    description: t.description || undefined,
    course: t.course || undefined,
    subjectId: t.course_id || undefined,
    status: (t.status === 'in_progress' ? 'doing' : t.status) as any,
    priority: t.priority as any,
    difficulty: t.difficulty || 3,
    dueAt: t.due_date || `${today}T23:59:00`,
    estimateMin: t.estimated_minutes || 45,
    actualMin: t.actual_min || 0,
    steps: Array.isArray(t.subtasks) ? (t.subtasks as any) : [],
    tags: t.tags || [],
    pomodoros: {
      planned: t.pomodoro_planned || 1,
      done: t.pomodoro_done || 0,
    },
    quadrant: t.quadrant as any,
    order: t.order_index || 0,
    createdAt: `${today}T08:00:00Z`,
    completedAt: t.completed_at || undefined,
  }));

  const storeEvents: CalendarEvent[] = events.map((e) => {
    const startIso = e.start_time;
    const endIso = e.end_time;
    const dateStr = startIso.slice(0, 10);
    const startHour = startIso.slice(11, 16);
    const endHour = endIso.slice(11, 16);

    return {
      id: e.id!,
      title: e.title,
      date: dateStr,
      start: startHour,
      end: endHour,
      type: e.event_type as any,
      location: e.location || undefined,
      color: e.color || '#38bdf8',
      done: new Date(startIso).getTime() < new Date(today).getTime(),
    };
  });

  return {
    courses,
    tasks,
    events,
    profile,
    storeTasks,
    storeEvents,
    seededAt: new Date().toISOString(),
  };
}

/**
 * Checks if the student user has already completed onboarding or has existing courses.
 */
export async function hasUserBeenSeeded(userId: string): Promise<boolean> {
  if (!userId) return false;
  const cleanUserId = userId.trim();

  // 1. In-memory check
  if (seededRegistry.has(cleanUserId)) {
    return true;
  }

  // 1b. In-flight check: if currently seeding, await execution
  if (inFlightSeeds.has(cleanUserId)) {
    try {
      const inFlightResult = await inFlightSeeds.get(cleanUserId)!;
      return inFlightResult.success;
    } catch {
      return false;
    }
  }

  // 2. Supabase check
  if (isSupabaseConfigured() && isOnline()) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', cleanUserId)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        return true;
      }

      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('user_id', cleanUserId)
        .limit(1);

      if (courses && courses.length > 0) {
        return true;
      }
    } catch {
      // Safe fallback
    }
  }

  return false;
}

/**
 * Resets in-memory seeding state for test repeatability.
 */
export function resetSeededState(userId?: string): void {
  if (userId) {
    const clean = userId.trim();
    seededRegistry.delete(clean);
    inFlightSeeds.delete(clean);
  } else {
    seededRegistry.clear();
    inFlightSeeds.clear();
  }
}

/**
 * Retrieves the cached seeded data for a student, if seeded.
 */
export function getSeededDataForUser(userId: string): SeededUserData | null {
  return seededRegistry.get(userId) || null;
}

/**
 * Internal execution unit for onboarding auto-seeding.
 * Handles cloud idempotency checks, payload assembly, and Supabase batch upserts.
 */
async function executeSeedOperation(
  cleanUserId: string,
  options: SeedOptions | undefined,
  startTime: number
): Promise<SeedResult> {
  const force = options?.force === true;

  // Cloud Database Idempotency Check (< 50ms)
  if (!force && isSupabaseConfigured() && isOnline()) {
    try {
      const [profileCheck, coursesCheck] = await Promise.all([
        supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', cleanUserId)
          .maybeSingle(),
        supabase
          .from('courses')
          .select('id')
          .eq('user_id', cleanUserId)
          .limit(1),
      ]);

      const profileCompleted = profileCheck.data?.onboarding_completed === true;
      const coursesExist = (coursesCheck.data?.length ?? 0) > 0;

      if (profileCompleted || coursesExist) {
        // Record in local registry to bypass future network checks
        const payload = buildSeedPayload(cleanUserId, options?.referenceDate);
        seededRegistry.set(cleanUserId, payload);

        return {
          success: true,
          seeded: false,
          courseCount: payload.courses.length,
          taskCount: payload.tasks.length,
          eventCount: payload.events.length,
          executionTimeMs: Date.now() - startTime,
          userId: cleanUserId,
        };
      }
    } catch {
      // Non-blocking fallback to provision
    }
  }

  // Build Realistic Initial Data Provisioning
  const payload = buildSeedPayload(cleanUserId, options?.referenceDate);

  // Batch Push to Supabase Cloud (High-Performance Parallel Execution)
  if (isSupabaseConfigured() && isOnline()) {
    try {
      await Promise.allSettled([
        // Batch insert/upsert courses (4 items)
        supabase.from('courses').upsert(payload.courses, { onConflict: 'id' }),

        // Batch insert/upsert tasks (7 items)
        supabase.from('tasks').upsert(payload.tasks, { onConflict: 'id' }),

        // Batch insert/upsert calendar events (10 items)
        supabase.from('calendar_events').upsert(payload.events, { onConflict: 'id' }),

        // Update profile baseline gamification stats
        supabase
          .from('profiles')
          .update(payload.profile)
          .eq('id', cleanUserId),
      ]);
    } catch (cloudErr) {
      console.warn('[Auto-Seed] Cloud push warning (continuing with offline state):', cloudErr);
    }
  }

  // Save in local registry for immediate client hydration and idempotency
  seededRegistry.set(cleanUserId, payload);

  const durationMs = Date.now() - startTime;

  return {
    success: true,
    seeded: true,
    courseCount: payload.courses.length,
    taskCount: payload.tasks.length,
    eventCount: payload.events.length,
    executionTimeMs: durationMs,
    userId: cleanUserId,
  };
}

/**
 * Core Onboarding Auto-Seeding Engine
 *
 * Implements:
 * 1. Fast-path in-memory idempotency (< 1ms).
 * 2. In-flight single-flight mutex: simultaneous concurrent calls for the same user ID
 *    share a single execution rather than making redundant network calls.
 * 3. Sub-second (< 1000ms) execution time.
 */
export async function seedStudentOnboardingData(
  userId: string,
  options?: SeedOptions
): Promise<SeedResult> {
  const startTime = Date.now();

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return {
      success: false,
      seeded: false,
      courseCount: 0,
      taskCount: 0,
      eventCount: 0,
      executionTimeMs: Date.now() - startTime,
      userId: userId || '',
      error: 'Invalid userId provided to seedStudentOnboardingData',
    };
  }

  const cleanUserId = userId.trim();
  const force = options?.force === true;

  // 1. Fast-Path In-Memory Idempotency Check (< 1ms)
  if (!force && seededRegistry.has(cleanUserId)) {
    const existing = seededRegistry.get(cleanUserId)!;
    return {
      success: true,
      seeded: false,
      courseCount: existing.courses.length,
      taskCount: existing.tasks.length,
      eventCount: existing.events.length,
      executionTimeMs: Date.now() - startTime,
      userId: cleanUserId,
    };
  }

  // 2. In-Flight Single-Flight Mutex Check
  // If an active seeding operation for this user is already in flight, join it.
  // Followers await the leader and return seeded: false (idempotent exit).
  if (!force && inFlightSeeds.has(cleanUserId)) {
    try {
      const leaderResult = await inFlightSeeds.get(cleanUserId)!;
      return {
        ...leaderResult,
        seeded: false,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false,
        seeded: false,
        courseCount: 0,
        taskCount: 0,
        eventCount: 0,
        executionTimeMs: Date.now() - startTime,
        userId: cleanUserId,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // 3. Initiate Leader Execution under Single-Flight Mutex
  const seedPromise = executeSeedOperation(cleanUserId, options, startTime);
  if (!force) {
    inFlightSeeds.set(cleanUserId, seedPromise);
  }

  try {
    return await seedPromise;
  } catch (err) {
    return {
      success: false,
      seeded: false,
      courseCount: 0,
      taskCount: 0,
      eventCount: 0,
      executionTimeMs: Date.now() - startTime,
      userId: cleanUserId,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    if (!force) {
      inFlightSeeds.delete(cleanUserId);
    }
  }
}
