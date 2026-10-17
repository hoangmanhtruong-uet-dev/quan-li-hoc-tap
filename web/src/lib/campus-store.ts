/**
 * CampusOS Reactive Shared Store (v2)
 * Synchronizes Gamification, Mood, Themes, Deadlines, Events, and Kanban
 * across /dashboard, /calendar, and Focus Mode using React 18 useSyncExternalStore.
 */

import { useSyncExternalStore, useCallback } from 'react';
import type { TaskItem } from '../types/tasks.ts';
import {
  pullFromSupabaseCloud,
  pushToSupabaseCloudDebounced,
  logFocusSessionToSupabase,
  recordFocusViolationToSupabase,
} from './supabase-sync.ts';
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
  dueDate?: string;
  date?: string;
  displayDate?: string;
  urgent?: boolean;
  completed?: boolean;
  isExam?: boolean;
}

const STORE_LEVELS = [
  { level: 1, minXp: 0, rankTitle: 'Tân sinh viên ngơ ngác' },
  { level: 2, minXp: 200, rankTitle: 'Cú đêm giảng đường' },
  { level: 3, minXp: 500, rankTitle: 'Dũng sĩ trốn điểm danh' },
  { level: 4, minXp: 900, rankTitle: 'Bậc thầy nước đến chân' },
  { level: 5, minXp: 1400, rankTitle: 'Thợ săn deadline' },
  { level: 6, minXp: 2000, rankTitle: 'Chiến thần thuyết trình' },
  { level: 7, minXp: 2700, rankTitle: 'Sinh viên cày thuê' },
  { level: 8, minXp: 3600, rankTitle: 'Trùm phao cứu sinh' },
  { level: 9, minXp: 4700, rankTitle: 'Giáo sư tự phong' },
  { level: 10, minXp: 6000, rankTitle: 'Chiến thần qua môn' },
];

export function calculateLevelAndRank(xp: number): {
  level: number;
  rankTitle: string;
  nextLevelXp: number;
  currentLevelMinXp: number;
  progressPercent: number;
} {
  const safeXp = Math.max(0, Math.floor(xp));
  let matched = STORE_LEVELS[0]!;
  for (let i = STORE_LEVELS.length - 1; i >= 0; i--) {
    if (safeXp >= STORE_LEVELS[i]!.minXp) {
      matched = STORE_LEVELS[i]!;
      break;
    }
  }

  const nextTier = STORE_LEVELS.find((t) => t.level === matched.level + 1);
  const nextLevelXp = nextTier ? nextTier.minXp : matched.minXp + 2000;
  const currentLevelMinXp = matched.minXp;
  const range = nextLevelXp - currentLevelMinXp;
  const progressPercent =
    range > 0 ? Math.min(100, Math.max(0, Math.round(((safeXp - currentLevelMinXp) / range) * 100))) : 100;

  return {
    level: matched.level,
    rankTitle: matched.rankTitle,
    nextLevelXp,
    currentLevelMinXp,
    progressPercent,
  };
}

function daysDiff(dateStrA: string, dateStrB: string): number {
  if (!dateStrA || !dateStrB) return 0;
  const [y1, m1, d1] = dateStrA.split('-').map(Number);
  const [y2, m2, d2] = dateStrB.split('-').map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 0;
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / 86400000);
}

function calculateStreakOnCheckIn(
  state: { streak: number; lastStudyDate: string; streakFreezes: number },
  todayDateStr: string
): { streak: number; streakFreezes: number; freezeUsed: boolean; streakBroken: boolean } {
  const currentStreak = Math.max(0, state.streak);
  let availableFreezes = Math.max(0, state.streakFreezes);

  if (!state.lastStudyDate) {
    return { streak: 1, streakFreezes: availableFreezes, freezeUsed: false, streakBroken: false };
  }

  const diff = daysDiff(state.lastStudyDate, todayDateStr);
  if (diff <= 0) {
    return { streak: currentStreak > 0 ? currentStreak : 1, streakFreezes: availableFreezes, freezeUsed: false, streakBroken: false };
  }
  if (diff === 1) {
    return { streak: currentStreak + 1, streakFreezes: availableFreezes, freezeUsed: false, streakBroken: false };
  }
  if (diff === 2) {
    if (availableFreezes > 0) {
      return { streak: currentStreak + 1, streakFreezes: availableFreezes - 1, freezeUsed: true, streakBroken: false };
    }
    return { streak: 1, streakFreezes: 0, freezeUsed: false, streakBroken: true };
  }
  return { streak: 1, streakFreezes: availableFreezes, freezeUsed: false, streakBroken: true };
}

function calculateSessionXp(minutes: number, disciplineScore = 100): { totalXp: number } {
  const safeMin = Math.max(0, Math.floor(minutes));
  const baseMinutesXp = safeMin > 0 ? Math.round(safeMin * 2) : 0;
  const normalizedScore = Math.max(0, Math.min(100, disciplineScore));
  const disciplineBonus = safeMin > 0 ? Math.round((normalizedScore / 100) * 10) : 0;
  const milestoneBonus = safeMin >= 25 ? 15 : 0;
  return { totalXp: baseMinutesXp + disciplineBonus + milestoneBonus };
}

export interface KanbanTask {
  id: string;
  title: string;
  detail: string;
  column: 'todo' | 'review' | 'done';
  status?: string;
  courseOrClub?: string;
  assignees?: Array<{ name: string; avatar?: string }>;
}

export type DailyMood = 'sleepy' | 'neutral' | 'cool' | 'fire';
export type VibeTheme = 'aurora' | 'y2k' | 'cyber' | 'pastel';

export interface CampusOSSharedState {
  // Gamification
  xp: number;
  level: number;
  rankTitle: string;
  streak: number;
  streakFreezes: number;
  studyMinutesTotal: number;
  weeklyStudyGoalMinutes: number;
  weeklyStudyMinutesCurrent: number;
  lastStudyDate: string; // YYYY-MM-DD
  badges: string[];
  violationCount?: number;
  totalShameCount?: number;

  // Mood
  dailyMood: DailyMood | null;
  moodTimestamp?: string;

  // Vibe & Accessibility
  vibeTheme: VibeTheme;
  reducedMotion: boolean;

  // Collections & AI
  tasks: TaskItem[];
  deadlines: DeadlineItem[];
  kanbanTasks: KanbanTask[];
  events: CalendarEvent[];
  aiCoachAccepted: boolean;
}

export const CAMPUS_STORAGE_KEY = 'campusos-shared-v2';
export const CAMPUS_UPDATE_EVENT = 'campusos-store-update';

export function formatIsoDateOnly(date: Date, offsetDays = 0): string {
  const d = new Date(date);
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Generates realistic seed data dynamically anchored around referenceDate.
 */
export function createDefaultSharedState(referenceDate: Date = new Date()): CampusOSSharedState {
  const today = formatIsoDateOnly(referenceDate, 0);
  const dayMinus2 = formatIsoDateOnly(referenceDate, -2);
  const dayMinus1 = formatIsoDateOnly(referenceDate, -1);
  const dayPlus1 = formatIsoDateOnly(referenceDate, 1);
  const dayPlus2 = formatIsoDateOnly(referenceDate, 2);
  const dayPlus3 = formatIsoDateOnly(referenceDate, 3);
  const dayPlus5 = formatIsoDateOnly(referenceDate, 5);
  const dayPlus8 = formatIsoDateOnly(referenceDate, 8);
  const dayPlus10 = formatIsoDateOnly(referenceDate, 10);

  const events: CalendarEvent[] = [
    // Past events (-2, -1 days)
    {
      id: 'e-past-1',
      title: 'Kỹ thuật lập trình (Buổi 1)',
      date: dayMinus2,
      start: '08:00',
      end: '09:30',
      type: 'class',
      location: 'Phòng D201',
      done: true,
    },
    {
      id: 'e-past-2',
      title: 'Học nhóm CTDL & GT',
      date: dayMinus2,
      start: '14:00',
      end: '16:00',
      type: 'study',
      location: 'Thư viện tầng 3',
      done: true,
    },
    {
      id: 'e-past-3',
      title: 'Toán rời rạc',
      date: dayMinus1,
      start: '10:00',
      end: '11:30',
      type: 'class',
      location: 'Giảng đường B',
      done: true,
    },
    {
      id: 'e-past-4',
      title: 'Chạy bộ rèn thể lực',
      date: dayMinus1,
      start: '17:30',
      end: '18:30',
      type: 'personal',
      location: 'Sân vận động',
      done: true,
    },

    // Today (0 days)
    {
      id: 'e-today-1',
      title: 'Kỹ thuật lập trình',
      date: today,
      start: '08:00',
      end: '09:30',
      type: 'class',
      location: 'Phòng D201',
      done: false,
    },
    {
      id: 'e-today-2',
      title: 'Triết học Mác - Lênin',
      date: today,
      start: '10:00',
      end: '11:30',
      type: 'class',
      location: 'Giảng đường A',
      done: false,
    },
    {
      id: 'e-today-3',
      title: 'Thực hành Mạng máy tính',
      date: today,
      start: '14:00',
      end: '16:30',
      type: 'class',
      location: 'Lab 304',
      done: false,
    },
    {
      id: 'e-today-4',
      title: 'Nộp bài tập lớn Mạng máy tính',
      date: today,
      start: '23:59',
      end: '23:59',
      type: 'exam',
      location: 'Campus LMS',
      done: false,
    },

    // Future (+1, +2, +3, +5, +8, +10 days)
    {
      id: 'e-next-1',
      title: 'Ôn tập Subnetting & Định tuyến',
      date: dayPlus1,
      start: '19:30',
      end: '20:30',
      type: 'study',
      location: 'Focus room',
      done: false,
    },
    {
      id: 'e-next-2',
      title: 'Slide thuyết trình nhóm Triết học',
      date: dayPlus1,
      start: '23:59',
      end: '23:59',
      type: 'exam',
      location: 'Google Classroom',
      done: false,
    },
    {
      id: 'e-next-3',
      title: 'Workshop CLB Công nghệ (GenAI & Web)',
      date: dayPlus2,
      start: '14:30',
      end: '17:00',
      type: 'club',
      location: 'Hội trường B',
      done: false,
    },
    {
      id: 'e-next-4',
      title: 'Kiểm tra Xác suất Thống kê',
      date: dayPlus3,
      start: '08:00',
      end: '09:00',
      type: 'exam',
      location: 'Phòng C302',
      done: false,
    },
    {
      id: 'e-next-5',
      title: 'Học nhóm CTDL & GT',
      date: dayPlus3,
      start: '09:30',
      end: '11:30',
      type: 'study',
      location: 'Thư viện tầng 3',
      done: false,
    },
    {
      id: 'e-next-6',
      title: 'Luyện đề thi thử CTDL',
      date: dayPlus5,
      start: '20:00',
      end: '21:30',
      type: 'study',
      location: 'Thư viện số',
      done: false,
    },
    {
      id: 'e-next-7',
      title: 'Thi Cấu trúc dữ liệu & Giải thuật',
      date: dayPlus8,
      start: '09:00',
      end: '11:00',
      type: 'exam',
      location: 'Phòng 302',
      description: 'Hình thức: Tự luận',
      done: false,
    },
    {
      id: 'e-next-8',
      title: 'Họp nhóm dự án Web (Sprint Review)',
      date: dayPlus10,
      start: '18:00',
      end: '19:30',
      type: 'club',
      location: 'Google Meet',
      done: false,
    },
    {
      id: 'e-next-9',
      title: 'Chạy bộ cuối tuần',
      date: dayPlus10,
      start: '06:00',
      end: '07:00',
      type: 'personal',
      location: 'Sân vận động',
      done: false,
    },
  ];

  const deadlines: DeadlineItem[] = [
    {
      id: 'network-project',
      title: 'Bài tập lớn Mạng máy tính',
      course: 'CS301 - Mạng máy tính',
      dueDate: `${today}T23:59:00`,
      date: today,
      displayDate: 'Hôm nay · 23:59',
      urgent: true,
      completed: false,
      isExam: false,
    },
    {
      id: 'philosophy-slides',
      title: 'Slide thuyết trình nhóm',
      course: 'Triết học Mác - Lênin',
      dueDate: `${dayPlus1}T23:59:00`,
      date: dayPlus1,
      displayDate: 'Ngày mai · 23:59',
      urgent: false,
      completed: false,
      isExam: false,
    },
    {
      id: 'dsa-quiz',
      title: 'Quiz chương 4 Cây & Đồ thị',
      course: 'CTDL & GT',
      dueDate: `${dayPlus3}T18:00:00`,
      date: dayPlus3,
      displayDate: 'Còn 3 ngày',
      urgent: false,
      completed: false,
      isExam: false,
    },
    {
      id: 'prob-exam',
      title: 'Kiểm tra Xác suất giữa kỳ',
      course: 'Xác suất Thống kê',
      dueDate: `${dayPlus3}T08:00:00`,
      date: dayPlus3,
      displayDate: 'Còn 3 ngày',
      urgent: true,
      completed: false,
      isExam: true,
    },
    {
      id: 'dsa-final',
      title: 'Thi cuối kỳ Cấu trúc dữ liệu',
      course: 'CS201 - CTDL & GT',
      dueDate: `${dayPlus8}T09:00:00`,
      date: dayPlus8,
      displayDate: 'Còn 8 ngày',
      urgent: false,
      completed: false,
      isExam: true,
    },
  ];

  const kanbanTasks: KanbanTask[] = [
    {
      id: 'api-report',
      title: 'Hoàn thiện API báo cáo',
      detail: 'Dự án Web · Cùng Lan và Huy',
      column: 'todo',
      status: 'Đang làm',
      courseOrClub: 'Dự án Web',
      assignees: [{ name: 'Minh' }, { name: 'Lan' }, { name: 'Huy' }],
    },
    {
      id: 'review-slides',
      title: 'Review slide thuyết trình',
      detail: 'CLB Công nghệ · hạn ngày mai',
      column: 'review',
      status: 'Chờ review',
      courseOrClub: 'CLB Công nghệ',
      assignees: [{ name: 'Minh' }, { name: 'Hải' }],
    },
    {
      id: 'setup-db',
      title: 'Thiết kế CSDL đồ án Web',
      detail: 'CS301 · Hoàn thành tuần trước',
      column: 'done',
      status: 'Đã xong',
      courseOrClub: 'Dự án Web',
      assignees: [{ name: 'Minh' }, { name: 'Lan' }],
    },
  ];

  const tasks: TaskItem[] = [
    // 1. Overdue task (2 days ago)
    {
      id: 'task-overdue-report',
      title: 'Nộp báo cáo Thí nghiệm Mạng máy tính',
      description: 'Báo cáo bài thực hành Lab 3 Wireshark và phân tích gói tin TCP handshake.',
      course: 'CS301 - Mạng máy tính',
      subjectId: 'cs301',
      status: 'todo',
      priority: 'high',
      difficulty: 4,
      dueAt: `${dayMinus2}T23:59:00`,
      estimateMin: 60,
      actualMin: 25,
      steps: [
        { id: 's-ov-1', text: 'Chụp màn hình Wireshark', done: true },
        { id: 's-ov-2', text: 'Trả lời 5 câu hỏi phân tích', done: false },
        { id: 's-ov-3', text: 'Xuất file PDF nộp LMS', done: false },
      ],
      tags: ['Lab', 'Báo cáo'],
      pomodoros: { planned: 2, done: 1 },
      quadrant: 'do_first',
      order: 0,
      createdAt: `${dayMinus2}T08:00:00`,
    },

    // 2. Urgent task due today (P0 Hero task)
    {
      id: 'task-network-project',
      title: 'Bài tập lớn Mạng máy tính',
      description: 'Lập trình socket mô phỏng giao thức truyền file tin cậy qua UDP (Go-Back-N).',
      course: 'CS301 - Mạng máy tính',
      subjectId: 'cs301',
      status: 'todo',
      priority: 'high',
      difficulty: 5,
      dueAt: `${today}T23:59:00`,
      estimateMin: 120,
      actualMin: 60,
      steps: [
        { id: 's-net-1', text: 'Thiết kế header packet UDP', done: true },
        { id: 's-net-2', text: 'Viết sliding window sender/receiver', done: true },
        { id: 's-net-3', text: 'Kiểm thử loss packet với Clumsy', done: false },
        { id: 's-net-4', text: 'Viết tài liệu thuyết minh', done: false },
      ],
      tags: ['BTL', 'Quan trọng'],
      pomodoros: { planned: 4, done: 2 },
      quadrant: 'do_first',
      order: 1,
      createdAt: `${dayMinus1}T09:00:00`,
    },

    // 3. Today task (currently doing)
    {
      id: 'task-today-philosophy',
      title: 'Ôn tập trắc nghiệm Triết học Mác - Lênin',
      description: 'Ôn 80 câu hỏi chương 2 Quy luật mâu thuẫn và phủ định của phủ định.',
      course: 'Triết học Mác - Lênin',
      subjectId: 'ml01',
      status: 'doing',
      priority: 'medium',
      difficulty: 3,
      dueAt: `${today}T17:00:00`,
      estimateMin: 45,
      actualMin: 20,
      steps: [
        { id: 's-ph-1', text: 'Làm đề ôn tập Quizlet', done: true },
        { id: 's-ph-2', text: 'Ghi chú các câu hay sai', done: false },
      ],
      tags: ['Ôn tập', 'Lý thuyết'],
      pomodoros: { planned: 2, done: 1 },
      quadrant: 'delegate',
      order: 2,
      createdAt: `${today}T07:30:00`,
    },

    // 4. Tomorrow task
    {
      id: 'task-philosophy-slides',
      title: 'Slide thuyết trình nhóm Triết học',
      description: 'Hoàn thiện 15 slide chủ đề Hình thái kinh tế - xã hội cùng Lan và Nam.',
      course: 'Triết học Mác - Lênin',
      subjectId: 'ml01',
      status: 'todo',
      priority: 'medium',
      difficulty: 3,
      dueAt: `${dayPlus1}T23:59:00`,
      estimateMin: 90,
      actualMin: 30,
      steps: [
        { id: 's-sl-1', text: 'Tổng hợp nội dung từ Word', done: true },
        { id: 's-sl-2', text: 'Thiết kế template Canva', done: false },
        { id: 's-sl-3', text: 'Gửi nhóm duyệt slide', done: false },
      ],
      tags: ['Thuyết trình', 'Nhóm'],
      pomodoros: { planned: 3, done: 1 },
      quadrant: 'schedule',
      order: 3,
      createdAt: `${dayMinus1}T10:00:00`,
    },

    // 5. This week task (+3 days)
    {
      id: 'task-prob-exam',
      title: 'Kiểm tra Xác suất Thống kê giữa kỳ',
      description: 'Luyện 3 đề thi các năm trước về biến ngẫu nhiên liên tục và phân phối chuẩn.',
      course: 'Xác suất Thống kê',
      subjectId: 'ma202',
      status: 'todo',
      priority: 'high',
      difficulty: 4,
      dueAt: `${dayPlus3}T08:00:00`,
      estimateMin: 90,
      actualMin: 0,
      steps: [
        { id: 's-pr-1', text: 'Ôn công thức Bayes', done: true },
        { id: 's-pr-2', text: 'Làm đề năm 2024', done: false },
        { id: 's-pr-3', text: 'Làm đề năm 2025', done: false },
      ],
      tags: ['Kiểm tra', 'Toán'],
      pomodoros: { planned: 3, done: 0 },
      quadrant: 'schedule',
      order: 4,
      createdAt: `${today}T08:00:00`,
    },

    // 6. Later task (+8 days)
    {
      id: 'task-dsa-final',
      title: 'Luyện đề thi cuối kỳ Cấu trúc dữ liệu',
      description: 'Cài đặt thuật toán Dijkstra, Floyd-Warshall và Cây AVL.',
      course: 'CS201 - CTDL & GT',
      subjectId: 'cs201',
      status: 'todo',
      priority: 'medium',
      difficulty: 5,
      dueAt: `${dayPlus8}T09:00:00`,
      estimateMin: 120,
      actualMin: 0,
      steps: [
        { id: 's-ds-1', text: 'Cài đặt Heap và AVL Tree', done: false },
        { id: 's-ds-2', text: 'Luyện 5 bài LeetCode Medium', done: false },
      ],
      tags: ['Ôn thi', 'Code'],
      pomodoros: { planned: 4, done: 0 },
      quadrant: 'schedule',
      order: 5,
      createdAt: `${today}T08:00:00`,
    },

    // 7. Completed task (-1 day)
    {
      id: 'task-done-setup',
      title: 'Cài đặt môi trường Docker và CSDL',
      description: 'Khởi chạy container PostgreSQL và cấu hình migration cho dự án Web.',
      course: 'Dự án Web',
      subjectId: 'cs302',
      status: 'done',
      priority: 'low',
      difficulty: 2,
      dueAt: `${dayMinus1}T20:00:00`,
      completedAt: `${dayMinus1}T19:40:00`,
      estimateMin: 45,
      actualMin: 40,
      steps: [
        { id: 's-dn-1', text: 'Viết docker-compose.yml', done: true },
        { id: 's-dn-2', text: 'Test kết nối từ Next.js', done: true },
      ],
      tags: ['Setup', 'DevOps'],
      pomodoros: { planned: 1, done: 1 },
      quadrant: 'eliminate',
      order: 6,
      createdAt: `${dayMinus2}T14:00:00`,
    },
  ];

  return {
    xp: 2840,
    level: 7,
    rankTitle: 'Sinh viên cày thuê',
    streak: 12,
    streakFreezes: 1,
    studyMinutesTotal: 3120,
    weeklyStudyGoalMinutes: 720, // 12 giờ
    weeklyStudyMinutesCurrent: 510, // 8.5 giờ (71%)
    lastStudyDate: today,
    badges: ['streak-7', 'early-bird', 'night-owl', 'focus-master'],
    violationCount: 0,
    totalShameCount: 0,

    dailyMood: 'cool',
    moodTimestamp: new Date().toISOString(),

    vibeTheme: 'aurora',
    reducedMotion: false,

    tasks,
    deadlines,
    kanbanTasks,
    events,
    aiCoachAccepted: false,
  };
}

let memoryState: CampusOSSharedState | null = null;
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((callback) => {
    try {
      callback();
    } catch (e) {
      console.error('[CampusStore] Subscriber notification error:', e);
    }
  });
}

/**
 * Returns current shared state. Safe for SSR and Node environments.
 */
export function getSharedState(): CampusOSSharedState {
  if (typeof window === 'undefined') {
    return memoryState || createDefaultSharedState();
  }

  if (memoryState) {
    return memoryState;
  }

  try {
    const raw = window.localStorage.getItem(CAMPUS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const def = createDefaultSharedState();
      memoryState = {
        ...def,
        ...parsed,
        tasks: Array.isArray(parsed.tasks) && parsed.tasks.length > 0 ? parsed.tasks : def.tasks,
      };
      return memoryState!;
    }
  } catch (err) {
    console.warn('[CampusStore] Error reading localStorage:', err);
  }

  memoryState = createDefaultSharedState();
  try {
    window.localStorage.setItem(CAMPUS_STORAGE_KEY, JSON.stringify(memoryState));
  } catch {}
  return memoryState;
}

/**
 * Sets or updates shared state, writes to localStorage, dispatches campusos-store-update, and notifies subscribers.
 */
export function setSharedState(
  nextOrUpdater: CampusOSSharedState | ((prev: CampusOSSharedState) => Partial<CampusOSSharedState>)
): CampusOSSharedState {
  const current = getSharedState();
  const patch = typeof nextOrUpdater === 'function' ? nextOrUpdater(current) : nextOrUpdater;
  const next: CampusOSSharedState = { ...current, ...patch };
  memoryState = next;

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CAMPUS_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn('[CampusStore] Error saving to localStorage:', err);
    }

    try {
      window.dispatchEvent(new CustomEvent(CAMPUS_UPDATE_EVENT, { detail: next }));
    } catch {}

    // Non-blocking optimistic cloud push (debounced)
    pushToSupabaseCloudDebounced(next);
  }

  notifySubscribers();
  return next;
}

/**
 * Updates shared state, writes to localStorage, and dispatches CustomEvent + notify subscribers.
 */
export function updateSharedState(
  updater: (prev: CampusOSSharedState) => Partial<CampusOSSharedState>
): CampusOSSharedState {
  return setSharedState(updater);
}

export interface PenaltyResult {
  xpDeducted: number;
  nextXp: number;
  level: number;
  rankTitle: string;
}

/**
 * Deducts XP and increments violationCount / totalShameCount when Chrome Extension
 * detects a study discipline violation. Recalculates level/rank, updates store,
 * dispatches campusos-store-update event, pushes debounced to Supabase profiles
 * and logs focus violation into student_focus_sessions.
 */
export function penalizeViolation(
  amount = 50,
  reason?: string
): PenaltyResult {
  const prev = getSharedState();
  const safeAmount = Math.max(0, amount);
  const nextXp = Math.max(0, prev.xp - safeAmount);
  const xpDeducted = prev.xp - nextXp;
  const { level, rankTitle } = calculateLevelAndRank(nextXp);

  const nextViolationCount = (prev.violationCount || 0) + 1;
  const nextTotalShameCount = (prev.totalShameCount || 0) + 1;

  setSharedState((current) => ({
    ...current,
    xp: nextXp,
    level,
    rankTitle,
    violationCount: nextViolationCount,
    totalShameCount: nextTotalShameCount,
  }));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('campusos:violation-penalized', {
        detail: {
          penaltyAmount: amount,
          xpDeducted,
          nextXp,
          level,
          rankTitle,
          violationCount: nextViolationCount,
          reason,
        },
      })
    );
  }

  const updatedState = getSharedState();
  pushToSupabaseCloudDebounced(updatedState);
  void recordFocusViolationToSupabase({
    penaltyXp: safeAmount,
    domain: reason,
    reason: reason || 'blacklist_url',
    violationCount: nextViolationCount,
  });

  return {
    xpDeducted,
    nextXp,
    level,
    rankTitle,
  };
}

/**
 * Reset shared state to default.
 */
export function resetSharedState(referenceDate: Date = new Date()): CampusOSSharedState {
  const defaultState = createDefaultSharedState(referenceDate);
  memoryState = defaultState;

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CAMPUS_STORAGE_KEY, JSON.stringify(defaultState));
      window.dispatchEvent(new CustomEvent(CAMPUS_UPDATE_EVENT, { detail: defaultState }));
    } catch {}

    pushToSupabaseCloudDebounced(defaultState);
  }

  notifySubscribers();
  return defaultState;
}

let cloudHydrationAttempted = false;

export function hydrateFromCloudIfAvailable(): void {
  if (typeof window === 'undefined' || cloudHydrationAttempted) return;
  cloudHydrationAttempted = true;

  pullFromSupabaseCloud()
    .then((cloudData) => {
      if (cloudData && Object.keys(cloudData).length > 0) {
        updateSharedState((prev) => {
          const mergedDeadlines = [...prev.deadlines];
          if (cloudData.deadlines && cloudData.deadlines.length > 0) {
            for (const cDeadline of cloudData.deadlines) {
              const idx = mergedDeadlines.findIndex((d) => d.id === cDeadline.id);
              if (idx === -1) {
                mergedDeadlines.push(cDeadline);
              }
            }
          }

          const mergedEvents = [...prev.events];
          if (cloudData.events && cloudData.events.length > 0) {
            for (const cEvent of cloudData.events) {
              const idx = mergedEvents.findIndex((e) => e.id === cEvent.id);
              if (idx === -1) {
                mergedEvents.push(cEvent);
              }
            }
          }

          return {
            ...cloudData,
            xp: Math.max(cloudData.xp ?? 0, prev.xp),
            streak: Math.max(cloudData.streak ?? 0, prev.streak),
            studyMinutesTotal: Math.max(cloudData.studyMinutesTotal ?? 0, prev.studyMinutesTotal),
            deadlines: mergedDeadlines,
            events: mergedEvents,
          };
        });
      }
    })
    .catch((err) => {
      console.warn('[CampusStore] Cloud sync hydration skipped:', err);
    });
}

// Attach window listeners only once in browser environment
if (typeof window !== 'undefined') {
  hydrateFromCloudIfAvailable();

  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key === CAMPUS_STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        const def = createDefaultSharedState();
        memoryState = {
          ...def,
          ...parsed,
          tasks: Array.isArray(parsed.tasks) && parsed.tasks.length > 0 ? parsed.tasks : def.tasks,
        };
        notifySubscribers();
        window.dispatchEvent(new CustomEvent(CAMPUS_UPDATE_EVENT, { detail: memoryState }));
      } catch (err) {
        console.warn('[CampusStore] Error parsing cross-tab storage:', err);
      }
    }
  });

  window.addEventListener(CAMPUS_UPDATE_EVENT, (event: Event) => {
    const custom = event as CustomEvent<CampusOSSharedState>;
    if (custom.detail && custom.detail !== memoryState) {
      memoryState = custom.detail;
      notifySubscribers();
    }
  });
}

function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Record completed study session from Focus Mode or Pomodoro.
 * Awards XP, increments study minutes, updates streak, checks level up and badges.
 */
export function recordCompletedSession(
  minutes: number,
  disciplineScore = 100
): { xpGained: number; streakUpdated: boolean } {
  const sessionReward = calculateSessionXp(minutes, disciplineScore);
  const xpGained = sessionReward.totalXp;

  const prev = getSharedState();
  const nextXp = prev.xp + xpGained;

  const { level, rankTitle } = calculateLevelAndRank(nextXp);

  const studyMinutesTotal = prev.studyMinutesTotal + minutes;
  const weeklyStudyMinutesCurrent = prev.weeklyStudyMinutesCurrent + minutes;

  const today = formatIsoDateOnly(new Date(), 0);
  const streakResult = calculateStreakOnCheckIn(
    {
      streak: prev.streak,
      lastStudyDate: prev.lastStudyDate,
      streakFreezes: prev.streakFreezes,
    },
    today
  );

  const badges = [...prev.badges];
  if (minutes >= 45 && !badges.includes('deep-focus')) {
    badges.push('deep-focus');
  }
  if (streakResult.streak >= 14 && !badges.includes('streak-14')) {
    badges.push('streak-14');
  }
  if (studyMinutesTotal >= 3600 && !badges.includes('study-scholar')) {
    badges.push('study-scholar');
  }

  updateSharedState(() => ({
    xp: nextXp,
    level,
    rankTitle,
    streak: streakResult.streak,
    streakFreezes: streakResult.streakFreezes,
    studyMinutesTotal,
    weeklyStudyMinutesCurrent,
    lastStudyDate: today,
    badges,
  }));

  if (typeof window !== 'undefined') {
    logFocusSessionToSupabase({
      focusMinutes: minutes,
      mode: 'focus',
      disciplineScore,
      shameCount: 0,
      xpGained,
    });
  }

  return {
    xpGained,
    streakUpdated: streakResult.streak !== prev.streak,
  };
}

/**
 * Add a new task to shared state.
 */
export function addTask(
  taskData: Omit<TaskItem, 'id' | 'createdAt' | 'order'>
): TaskItem {
  let createdTask: TaskItem | null = null;

  updateSharedState((prev) => {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const createdAt = new Date().toISOString();
    const order = prev.tasks.length;

    createdTask = {
      id,
      createdAt,
      order,
      title: taskData.title,
      description: taskData.description,
      course: taskData.course,
      subjectId: taskData.subjectId,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      difficulty: taskData.difficulty ?? 3,
      dueAt: taskData.dueAt || `${formatIsoDateOnly(new Date(), 0)}T23:59:00`,
      estimateMin: taskData.estimateMin ?? 45,
      actualMin: taskData.actualMin ?? 0,
      steps: taskData.steps || [],
      tags: taskData.tags || [],
      assigneeIds: taskData.assigneeIds || [],
      pomodoros: taskData.pomodoros || { planned: 1, done: 0 },
      rrule: taskData.rrule,
      quadrant: taskData.quadrant,
      notes: taskData.notes,
      attachments: taskData.attachments || [],
      activityLog: [
        {
          id: `log-${Date.now()}`,
          timestamp: createdAt,
          action: 'created',
          detail: 'Nhiệm vụ được tạo',
        },
      ],
    };

    return {
      tasks: [createdTask, ...prev.tasks],
    };
  });

  return createdTask!;
}

/**
 * Add a quick task with atomic dual-write to both tasks and deadlines,
 * +10 XP gamification award, and an idempotent undo closure.
 */
export function addQuickTask(
  taskData: Omit<TaskItem, 'id' | 'createdAt' | 'order'>
): {
  task: TaskItem;
  deadline: DeadlineItem;
  undo: () => void;
} {
  let createdTask: TaskItem;
  let createdDeadline: DeadlineItem;

  updateSharedState((prev) => {
    const createdAt = new Date().toISOString();
    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const deadlineId = `dl-${taskId}`;

    const maxOrder = prev.tasks.reduce((max, t) => Math.max(max, t.order ?? 0), 0);
    const order = maxOrder + 1;

    createdTask = {
      id: taskId,
      createdAt,
      order,
      title: taskData.title,
      description: taskData.description || '',
      course: taskData.course,
      subjectId: taskData.subjectId,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      difficulty: taskData.difficulty ?? 3,
      dueAt: taskData.dueAt || `${formatIsoDateOnly(new Date(), 0)}T23:59:00`,
      estimateMin: taskData.estimateMin ?? 45,
      actualMin: taskData.actualMin ?? 0,
      steps: taskData.steps || [],
      tags: taskData.tags || [],
      assigneeIds: taskData.assigneeIds || [],
      pomodoros: taskData.pomodoros || { planned: 1, done: 0 },
      rrule: taskData.rrule,
      quadrant: taskData.quadrant,
      notes: taskData.notes,
      attachments: taskData.attachments || [],
      activityLog: [
        {
          id: `log-${Date.now()}`,
          timestamp: createdAt,
          action: 'created',
          detail: 'Nhiệm vụ được tạo nhanh qua QuickTask',
        },
      ],
    };

    const dueDateStr = createdTask.dueAt ? createdTask.dueAt.slice(0, 10) : formatIsoDateOnly(new Date(), 0);
    const isUrgent = createdTask.priority === 'urgent' || createdTask.priority === 'high';

    createdDeadline = {
      id: deadlineId,
      title: createdTask.title,
      course: createdTask.course,
      dueDate: dueDateStr,
      date: dueDateStr,
      displayDate: dueDateStr,
      urgent: isUrgent,
      completed: false,
      isExam: false,
    };

    const nextXp = prev.xp + 10;
    const { level, rankTitle } = calculateLevelAndRank(nextXp);

    return {
      tasks: [createdTask, ...prev.tasks],
      deadlines: [createdDeadline, ...prev.deadlines],
      xp: nextXp,
      level,
      rankTitle,
    };
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('campusos:deadline-created', {
        detail: { deadline: createdDeadline!, task: createdTask! },
      })
    );
  }

  let isUndone = false;
  const undo = () => {
    if (isUndone) return;
    isUndone = true;

    updateSharedState((prev) => {
      const nextXp = Math.max(0, prev.xp - 10);
      const { level, rankTitle } = calculateLevelAndRank(nextXp);
      return {
        tasks: prev.tasks.filter((t) => t.id !== createdTask.id),
        deadlines: prev.deadlines.filter((d) => d.id !== createdDeadline.id),
        xp: nextXp,
        level,
        rankTitle,
      };
    });
  };

  return {
    task: createdTask!,
    deadline: createdDeadline!,
    undo,
  };
}

/**
 * Mark task as completed.
 * Awards XP (+20 base), checks Clear the Board (+50 XP bonus),
 * updates streak & badges, and synchronizes matching deadlines.
 */
export function completeTask(
  id: string,
  xpAward = 20
): { task: TaskItem | null; xpGained: number; clearBoardBonus: boolean } {
  let updatedTask: TaskItem | null = null;
  let xpGained = 0;
  let clearBoardBonus = false;

  updateSharedState((prev) => {
    const existingIndex = prev.tasks.findIndex((t) => t.id === id);
    if (existingIndex === -1) {
      return {};
    }

    const task = prev.tasks[existingIndex]!;
    if (task.status === 'done') {
      updatedTask = task;
      return {};
    }

    const todayStr = formatIsoDateOnly(new Date(), 0);
    const nowIso = new Date().toISOString();

    // Check Clear the Board bonus:
    // Are all tasks for today completed with this one?
    const todayTasks = prev.tasks.filter((t) => t.dueAt && t.dueAt.slice(0, 10) === todayStr);
    const otherIncompleteTodayTasks = todayTasks.filter((t) => t.id !== id && t.status !== 'done');
    const isTodayTask = Boolean(task.dueAt && task.dueAt.slice(0, 10) === todayStr);

    if (isTodayTask && otherIncompleteTodayTasks.length === 0 && todayTasks.length > 0) {
      clearBoardBonus = true;
      xpGained = xpAward + 50;
    } else {
      clearBoardBonus = false;
      xpGained = xpAward;
    }

    const nextXp = prev.xp + xpGained;
    const { level, rankTitle } = calculateLevelAndRank(nextXp);

    const streakResult = calculateStreakOnCheckIn(
      {
        streak: prev.streak,
        lastStudyDate: prev.lastStudyDate,
        streakFreezes: prev.streakFreezes,
      },
      todayStr
    );

    const badges = [...prev.badges];
    if (clearBoardBonus && !badges.includes('clear-the-board')) {
      badges.push('clear-the-board');
    }
    if (streakResult.streak >= 14 && !badges.includes('streak-14')) {
      badges.push('streak-14');
    }

    const completedSteps = task.steps.map((s) => ({ ...s, done: true }));
    const activityLog = [
      ...(task.activityLog || []),
      {
        id: `log-${Date.now()}`,
        timestamp: nowIso,
        action: 'status_changed' as const,
        detail: 'Đã hoàn thành nhiệm vụ (+XP)',
      },
    ];

    updatedTask = {
      ...task,
      status: 'done',
      completedAt: nowIso,
      steps: completedSteps,
      activityLog,
    };

    const nextTasks = [...prev.tasks];
    nextTasks[existingIndex] = updatedTask;

    // Synchronize matching deadline if applicable
    const nextDeadlines = prev.deadlines.map((d) => {
      if (
        d.id === id ||
        d.id === task.id.replace(/^task-/, '') ||
        d.title.toLowerCase() === task.title.toLowerCase()
      ) {
        return { ...d, completed: true };
      }
      return d;
    });

    return {
      tasks: nextTasks,
      deadlines: nextDeadlines,
      xp: nextXp,
      level,
      rankTitle,
      streak: streakResult.streak,
      streakFreezes: streakResult.streakFreezes,
      lastStudyDate: todayStr,
      badges,
    };
  });

  return { task: updatedTask, xpGained, clearBoardBonus };
}

/**
 * Update task with partial patch.
 */
export function updateTask(id: string, patch: Partial<TaskItem>): TaskItem | null {
  let updatedTask: TaskItem | null = null;

  updateSharedState((prev) => {
    const idx = prev.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return {};

    const current = prev.tasks[idx]!;
    const nowIso = new Date().toISOString();
    const activityLog = [...(current.activityLog || [])];

    if (patch.dueAt && patch.dueAt !== current.dueAt) {
      activityLog.push({
        id: `log-${Date.now()}`,
        timestamp: nowIso,
        action: 'rescheduled',
        detail: `Dời hạn tới ${patch.dueAt}`,
      });
    }

    updatedTask = {
      ...current,
      ...patch,
      activityLog,
    };

    const nextTasks = [...prev.tasks];
    nextTasks[idx] = updatedTask;

    // Synchronize matching deadline title or dueDate if applicable
    let nextDeadlines = prev.deadlines;
    if (patch.title || patch.dueAt) {
      nextDeadlines = prev.deadlines.map((d) => {
        if (
          d.id === id ||
          d.id === current.id.replace(/^task-/, '') ||
          d.title.toLowerCase() === current.title.toLowerCase()
        ) {
          return {
            ...d,
            ...(patch.title ? { title: patch.title } : {}),
            ...(patch.dueAt ? { dueDate: patch.dueAt, date: patch.dueAt.slice(0, 10) } : {}),
          };
        }
        return d;
      });
    }

    return { tasks: nextTasks, deadlines: nextDeadlines };
  });

  return updatedTask;
}

/**
 * Delete a task and return it (supports Undo).
 */
export function deleteTask(id: string): TaskItem | null {
  let deleted: TaskItem | null = null;

  updateSharedState((prev) => {
    const existing = prev.tasks.find((t) => t.id === id);
    if (!existing) return {};
    deleted = existing;

    return {
      tasks: prev.tasks.filter((t) => t.id !== id),
    };
  });

  return deleted;
}

/**
 * Bulk update multiple tasks.
 */
export function bulkUpdateTasks(ids: string[], patch: Partial<TaskItem>): void {
  if (!ids || ids.length === 0) return;
  const idSet = new Set(ids);

  updateSharedState((prev) => {
    const nextTasks = prev.tasks.map((task) => {
      if (idSet.has(task.id)) {
        return {
          ...task,
          ...patch,
        };
      }
      return task;
    });

    return { tasks: nextTasks };
  });
}

/**
 * Toggle completion status of a subtask step.
 */
export function toggleTaskStep(taskId: string, stepId: string): void {
  updateSharedState((prev) => {
    const idx = prev.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return {};

    const task = prev.tasks[idx]!;
    const updatedSteps = task.steps.map((s) => {
      if (s.id === stepId) {
        return { ...s, done: !s.done };
      }
      return s;
    });

    const nextTasks = [...prev.tasks];
    nextTasks[idx] = {
      ...task,
      steps: updatedSteps,
    };

    return { tasks: nextTasks };
  });
}

/**
 * Reorder task or change its Eisenhower quadrant.
 */
export function reorderTasks(
  taskId: string,
  targetQuadrantOrGroup?: string,
  newOrder?: number
): void {
  updateSharedState((prev) => {
    const idx = prev.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return {};

    const task = prev.tasks[idx]!;
    const patch: Partial<TaskItem> = {};

    if (newOrder !== undefined) {
      patch.order = newOrder;
    }

    if (
      targetQuadrantOrGroup === 'do_first' ||
      targetQuadrantOrGroup === 'schedule' ||
      targetQuadrantOrGroup === 'delegate' ||
      targetQuadrantOrGroup === 'eliminate'
    ) {
      patch.quadrant = targetQuadrantOrGroup;
    }

    const nextTasks = [...prev.tasks];
    nextTasks[idx] = {
      ...task,
      ...patch,
    };

    return { tasks: nextTasks };
  });
}

/**
 * React 18 hook to subscribe to campus store with zero overhead and tear-free external store syncing.
 */
export function useCampusStore(): {
  state: CampusOSSharedState;
  update: (updater: (prev: CampusOSSharedState) => Partial<CampusOSSharedState>) => CampusOSSharedState;
  recordSession: (minutes: number, disciplineScore?: number) => { xpGained: number; streakUpdated: boolean };
  reset: (referenceDate?: Date) => CampusOSSharedState;
  addTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'order'>) => TaskItem;
  addQuickTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'order'>) => {
    task: TaskItem;
    deadline: DeadlineItem;
    undo: () => void;
  };
  completeTask: (id: string, xpAward?: number) => { task: TaskItem | null; xpGained: number; clearBoardBonus: boolean };
  updateTask: (id: string, patch: Partial<TaskItem>) => TaskItem | null;
  deleteTask: (id: string) => TaskItem | null;
  bulkUpdateTasks: (ids: string[], patch: Partial<TaskItem>) => void;
  toggleTaskStep: (taskId: string, stepId: string) => void;
  reorderTasks: (taskId: string, targetQuadrantOrGroup?: string, newOrder?: number) => void;
} {
  const state = useSyncExternalStore(
    subscribe,
    getSharedState,
    () => createDefaultSharedState()
  );

  const update = useCallback(
    (updater: (prev: CampusOSSharedState) => Partial<CampusOSSharedState>) => {
      return updateSharedState(updater);
    },
    []
  );

  const recordSession = useCallback(
    (minutes: number, disciplineScore = 100) => {
      return recordCompletedSession(minutes, disciplineScore);
    },
    []
  );

  const reset = useCallback((refDate?: Date) => {
    return resetSharedState(refDate);
  }, []);

  const handleAddTask = useCallback(
    (taskData: Omit<TaskItem, 'id' | 'createdAt' | 'order'>) => addTask(taskData),
    []
  );

  const handleCompleteTask = useCallback(
    (id: string, xpAward = 20) => completeTask(id, xpAward),
    []
  );

  const handleUpdateTask = useCallback(
    (id: string, patch: Partial<TaskItem>) => updateTask(id, patch),
    []
  );

  const handleDeleteTask = useCallback(
    (id: string) => deleteTask(id),
    []
  );

  const handleBulkUpdateTasks = useCallback(
    (ids: string[], patch: Partial<TaskItem>) => bulkUpdateTasks(ids, patch),
    []
  );

  const handleToggleTaskStep = useCallback(
    (taskId: string, stepId: string) => toggleTaskStep(taskId, stepId),
    []
  );

  const handleReorderTasks = useCallback(
    (taskId: string, targetQuadrantOrGroup?: string, newOrder?: number) =>
      reorderTasks(taskId, targetQuadrantOrGroup, newOrder),
    []
  );

  const handleAddQuickTask = useCallback(
    (taskData: Omit<TaskItem, 'id' | 'createdAt' | 'order'>) => addQuickTask(taskData),
    []
  );

  return {
    state,
    update,
    recordSession,
    reset,
    addTask: handleAddTask,
    addQuickTask: handleAddQuickTask,
    completeTask: handleCompleteTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    bulkUpdateTasks: handleBulkUpdateTasks,
    toggleTaskStep: handleToggleTaskStep,
    reorderTasks: handleReorderTasks,
  };
}
