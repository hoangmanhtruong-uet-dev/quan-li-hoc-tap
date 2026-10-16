/**
 * CampusOS Notifications & M3 Domain Engine
 * Unified logic layer for Milestone M3:
 * 1. Notifications synthesis, tab filtering, and reversible undo actions.
 * 2. Profile radar chart coordinate geometry, graduation roadmap progress, and badge unlocks.
 * 3. Settings Google Calendar sync configuration, password strength rules, and 2FA TOTP verification.
 */

import type { CampusOSSharedState, DeadlineItem, CalendarEvent } from './campus-store.ts';

// =========================================================================
// 1. NOTIFICATIONS ENGINE & FEEDS
// =========================================================================

export type NotificationTab = 'Tất cả' | 'Deadline' | 'CLB' | 'Học vụ';

export interface CampusNotification {
  id: string;
  title: string;
  detail: string;
  tab: NotificationTab;
  time: string;
  isRead: boolean;
  isUrgent?: boolean;
  actionHref?: string;
  category?: 'academic' | 'deadline' | 'club' | 'system';
  timestamp?: number;
  dueTimeRemainingMs?: number;
}

export const SEED_ADMIN_NOTICES: CampusNotification[] = [
  {
    id: 'admin-grade-cs201',
    title: 'Cập nhật điểm kiểm tra CS201',
    detail: 'Giảng viên đã công bố điểm đồ án giữa kỳ Cấu trúc dữ liệu & Giải thuật: 8.5/10.',
    tab: 'Học vụ',
    time: '1 giờ trước',
    isRead: false,
    isUrgent: false,
    actionHref: '/profile',
    category: 'academic',
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'admin-room-math',
    title: 'Thay đổi giảng đường môn Xác suất Thống kê',
    detail: 'Phòng học buổi thứ Tư tuần này chuyển từ C101 sang Giảng đường B2 (Tòa B).',
    tab: 'Học vụ',
    time: '3 giờ trước',
    isRead: false,
    isUrgent: true,
    actionHref: '/calendar',
    category: 'academic',
    timestamp: Date.now() - 3 * 3600000,
  },
  {
    id: 'admin-exam-schedule',
    title: 'Công bố lịch thi kết thúc học phần Kỳ I',
    detail: 'Phòng Đào tạo đã cập nhật danh sách phòng thi và số báo danh chính thức trên cổng thông tin.',
    tab: 'Học vụ',
    time: 'Hôm qua',
    isRead: true,
    isUrgent: false,
    actionHref: '/calendar',
    category: 'academic',
    timestamp: Date.now() - 86400000,
  },
  {
    id: 'club-hack-night',
    title: 'Hack Night: Cyber Security Demo 2026',
    detail: 'CLB An toàn thông tin mở 50 vé mời giao lưu CTF & demo bảo mật web lúc 19:30 thứ Sáu.',
    tab: 'CLB',
    time: '5 giờ trước',
    isRead: false,
    isUrgent: false,
    actionHref: '/clubs',
    category: 'club',
    timestamp: Date.now() - 5 * 3600000,
  },
  {
    id: 'club-gdsc-recruit',
    title: 'GDSC Campus mở đơn tuyển thành viên Core Team',
    detail: 'Tuyển dụng các vị trí Frontend, AI/ML, Media & Logistics. Hạn đóng đơn: Chủ nhật tuần này.',
    tab: 'CLB',
    time: '2 ngày trước',
    isRead: true,
    isUrgent: false,
    actionHref: '/clubs',
    category: 'club',
    timestamp: Date.now() - 2 * 86400000,
  },
];

export function isUrgentNotice(notice: CampusNotification): boolean {
  if (notice.isUrgent) return true;
  if (typeof notice.dueTimeRemainingMs === 'number') {
    return notice.dueTimeRemainingMs > 0 && notice.dueTimeRemainingMs <= 12 * 3600 * 1000;
  }
  return false;
}

export function synthesizeNotificationsFeed(
  sharedState?: Partial<CampusOSSharedState>,
  persisted?: { readIds?: string[]; removedIds?: string[] }
): CampusNotification[] {
  const readIds = new Set(persisted?.readIds || []);
  const removedIds = new Set(persisted?.removedIds || []);

  const items: CampusNotification[] = [];

  for (const notice of SEED_ADMIN_NOTICES) {
    if (removedIds.has(notice.id)) continue;
    items.push({
      ...notice,
      isRead: readIds.has(notice.id) ? true : notice.isRead,
    });
  }

  const deadlines = sharedState?.deadlines || [];
  const now = Date.now();

  for (const d of deadlines) {
    if (d.completed) continue;
    const notifId = `deadline-${d.id}`;
    if (removedIds.has(notifId)) continue;

    let dueMs = 24 * 3600 * 1000;
    if (d.dueDate) {
      const parsedDue = new Date(d.dueDate).getTime();
      if (!isNaN(parsedDue)) {
        dueMs = parsedDue - now;
      }
    } else if (d.urgent) {
      dueMs = 4 * 3600 * 1000;
    }

    const isUrgent = d.urgent || (dueMs > 0 && dueMs <= 12 * 3600 * 1000);
    const hoursLeft = Math.max(1, Math.round(dueMs / (3600 * 1000)));

    items.push({
      id: notifId,
      title: d.isExam ? `Lịch thi sắp tới: ${d.title}` : `Hạn nộp bài tập: ${d.title}`,
      detail: `${d.course ? `Môn ${d.course} · ` : ''}Còn khoảng ${hoursLeft} giờ nữa đến hạn. Hoàn thành sớm để tránh trễ hạn!`,
      tab: 'Deadline',
      time: hoursLeft < 12 ? `Gấp: ${hoursLeft}h nữa` : `${hoursLeft} giờ nữa`,
      isRead: readIds.has(notifId),
      isUrgent,
      actionHref: '/tasks',
      category: 'deadline',
      timestamp: now - 1800000,
      dueTimeRemainingMs: dueMs,
    });
  }

  const events = sharedState?.events || [];
  for (const ev of events) {
    if (ev.done) continue;
    const notifId = `event-${ev.id}`;
    if (removedIds.has(notifId)) continue;

    if (ev.type === 'club') {
      items.push({
        id: notifId,
        title: `Sự kiện CLB: ${ev.title}`,
        detail: `Thời gian: ${ev.start} - ${ev.end} (${ev.date}). Địa điểm: ${ev.location || 'Trực tuyến'}.`,
        tab: 'CLB',
        time: ev.date,
        isRead: readIds.has(notifId),
        isUrgent: false,
        actionHref: '/calendar',
        category: 'club',
        timestamp: now - 7200000,
      });
    } else if (ev.type === 'class' && ev.reminders && ev.reminders.length > 0) {
      items.push({
        id: notifId,
        title: `Nhắc lịch học: ${ev.title}`,
        detail: `Lớp bắt đầu lúc ${ev.start} ngày ${ev.date} tại phòng ${ev.location || 'Giảng đường'}.`,
        tab: 'Học vụ',
        time: `${ev.start} hôm nay`,
        isRead: readIds.has(notifId),
        isUrgent: false,
        actionHref: '/calendar',
        category: 'academic',
        timestamp: now - 3600000,
      });
    }
  }

  return items.sort((a, b) => {
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    if (!a.isRead && b.isRead) return -1;
    if (a.isRead && !b.isRead) return 1;
    return (b.timestamp || 0) - (a.timestamp || 0);
  });
}

export function filterNotifications(
  notices: CampusNotification[],
  tab: NotificationTab,
  query: string = ''
): CampusNotification[] {
  const q = query.trim().toLowerCase();

  return notices.filter((n) => {
    const matchesTab = tab === 'Tất cả' || n.tab === tab;
    if (!matchesTab) return false;

    if (!q) return true;
    const searchTarget = `${n.title} ${n.detail} ${n.tab} ${n.category || ''}`.toLowerCase();
    return searchTarget.includes(q);
  });
}

export function getNotificationTabCounts(notices: CampusNotification[]): Record<NotificationTab, number> {
  return {
    'Tất cả': notices.length,
    'Deadline': notices.filter((n) => n.tab === 'Deadline').length,
    'CLB': notices.filter((n) => n.tab === 'CLB').length,
    'Học vụ': notices.filter((n) => n.tab === 'Học vụ').length,
  };
}

export function getUnreadCount(notices: CampusNotification[], tab?: NotificationTab): number {
  return notices.filter((n) => !n.isRead && (!tab || tab === 'Tất cả' || n.tab === tab)).length;
}

export function toggleNoticeRead(notices: CampusNotification[], id: string): CampusNotification[] {
  return notices.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n));
}

export function markAllNoticesAsRead(
  notices: CampusNotification[],
  tab?: NotificationTab
): CampusNotification[] {
  return notices.map((n) => {
    if (!tab || tab === 'Tất cả' || n.tab === tab) {
      return { ...n, isRead: true };
    }
    return n;
  });
}

export function deleteNoticeWithUndo(
  notices: CampusNotification[],
  id: string
): {
  updated: CampusNotification[];
  deleted: CampusNotification | null;
  restore: () => CampusNotification[];
} {
  const target = notices.find((n) => n.id === id) || null;
  const updated = notices.filter((n) => n.id !== id);

  return {
    updated,
    deleted: target,
    restore: () => {
      if (!target) return updated;
      return [target, ...updated];
    },
  };
}

export const NOTIFICATIONS_STORAGE_KEY = 'campusos-notifications-v2';

export function loadPersistedNotificationState(): { readIds: string[]; removedIds: string[] } {
  if (typeof window === 'undefined') return { readIds: [], removedIds: [] };
  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return { readIds: [], removedIds: [] };
    const parsed = JSON.parse(raw);
    return {
      readIds: Array.isArray(parsed.readIds) ? parsed.readIds : [],
      removedIds: Array.isArray(parsed.removedIds) ? parsed.removedIds : [],
    };
  } catch {
    return { readIds: [], removedIds: [] };
  }
}

export function savePersistedNotificationState(state: { readIds: string[]; removedIds: string[] }): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota
  }
}

// =========================================================================
// 2. PROFILE RADAR GEOMETRY, CREDITS & BADGES
// =========================================================================

export function calculateRadarCoordinate(
  value: number,
  index: number,
  totalAxes: number = 6,
  radius: number = 90,
  center: number = 130
): { x: number; y: number } {
  const safeAxes = Math.max(3, totalAxes);
  const angleStep = (Math.PI * 2) / safeAxes;
  const angle = index * angleStep - Math.PI / 2;
  const clampedValue = Math.max(0, Math.min(100, value));
  const r = (clampedValue / 100) * radius;

  return {
    x: Number((center + r * Math.cos(angle)).toFixed(3)),
    y: Number((center + r * Math.sin(angle)).toFixed(3)),
  };
}

export function calculateOverallIndex(skills: Array<{ value: number }>): number {
  if (!skills || skills.length === 0) return 0;
  const sum = skills.reduce((acc, s) => acc + (s.value || 0), 0);
  return Number((sum / skills.length).toFixed(1));
}

export function calculateGraduationProgress(
  completed: number,
  total: number
): { percentage: number; remaining: number } {
  if (total <= 0) return { percentage: 0, remaining: 0 };
  const safeCompleted = Math.max(0, completed);
  const remaining = Math.max(0, total - safeCompleted);
  const percentage = Number(((safeCompleted / total) * 100).toFixed(1));
  return { percentage, remaining };
}

export function calculateCreditBreakdown(
  categories: Array<{ name: string; earned: number; required: number; color?: string }>
): Array<{ name: string; earned: number; required: number; color?: string; percentage: number; remaining: number }> {
  return categories.map((cat) => {
    const { percentage, remaining } = calculateGraduationProgress(cat.earned, cat.required);
    return {
      ...cat,
      percentage,
      remaining,
    };
  });
}

export type BadgeTier = 'Đồng' | 'Bạc' | 'Vàng' | 'Cyber';

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  tier: BadgeTier;
  iconName: 'flame' | 'trophy' | 'target' | 'zap' | 'star' | 'shield' | 'users' | 'sparkles';
  requirement: string;
  color: string;
  glowColor: string;
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    id: 'early_bird',
    title: 'Khởi Đầu Vững Chắc',
    description: 'Đạt 200 XP học tập đầu tiên trong hệ thống CampusOS.',
    tier: 'Đồng',
    iconName: 'star',
    requirement: 'Tích lũy tối thiểu 200 XP',
    color: 'from-amber-700 to-amber-900 border-amber-600/50 text-amber-200',
    glowColor: 'rgba(217, 119, 6, 0.25)',
  },
  {
    id: 'consistency_pro',
    title: 'Cú Đêm Bền Bỉ',
    description: 'Duy trì chuỗi học tập liên tục từ 7 ngày trở lên.',
    tier: 'Bạc',
    iconName: 'flame',
    requirement: 'Duy trì Streak >= 7 ngày',
    color: 'from-slate-400 to-slate-600 border-slate-300/50 text-slate-100',
    glowColor: 'rgba(203, 213, 225, 0.3)',
  },
  {
    id: 'speed_runner',
    title: 'Bậc Thầy Nước Đến Chân',
    description: 'Hoàn thành 10 nhiệm vụ hoặc bài tập trước deadline.',
    tier: 'Bạc',
    iconName: 'zap',
    requirement: 'Hoàn thành >= 10 nhiệm vụ',
    color: 'from-cyan-600 to-blue-700 border-cyan-400/50 text-cyan-100',
    glowColor: 'rgba(6, 182, 212, 0.3)',
  },
  {
    id: 'deep_focus',
    title: 'Chiến Thần Tập Trung',
    description: 'Tích lũy hơn 600 phút (10 giờ) học tập trong phiên Pomodoro.',
    tier: 'Vàng',
    iconName: 'target',
    requirement: 'Tổng giờ học >= 600 phút',
    color: 'from-amber-400 to-yellow-600 border-yellow-300/60 text-amber-950',
    glowColor: 'rgba(250, 204, 21, 0.35)',
  },
  {
    id: 'deadline_hunter',
    title: 'Thợ Săn Deadline',
    description: 'Vươn tới Cấp độ 5 (Level 5) trong hành trình sinh viên.',
    tier: 'Vàng',
    iconName: 'trophy',
    requirement: 'Đạt Level >= 5',
    color: 'from-violet-500 to-purple-700 border-violet-400/60 text-violet-100',
    glowColor: 'rgba(168, 85, 247, 0.35)',
  },
  {
    id: 'squad_leader',
    title: 'Đội Trưởng Gương Mẫu',
    description: 'Tích cực tham gia quản lý đồ án hoặc ban chuyên môn CLB.',
    tier: 'Vàng',
    iconName: 'users',
    requirement: 'Hoạt động trong ít nhất 1 CLB hoặc Workspace',
    color: 'from-emerald-500 to-teal-700 border-emerald-400/60 text-emerald-100',
    glowColor: 'rgba(16, 185, 129, 0.35)',
  },
  {
    id: 'cyber_master',
    title: 'Cyber Overlord',
    description: 'Đạt danh hiệu Sinh viên cày thuê (Level 7) với hơn 2700 XP.',
    tier: 'Cyber',
    iconName: 'sparkles',
    requirement: 'Level >= 7 hoặc XP >= 2700',
    color: 'from-cyan-400 via-violet-500 to-pink-500 border-cyan-300 text-white',
    glowColor: 'rgba(61, 232, 255, 0.45)',
  },
  {
    id: 'campus_legend',
    title: 'Huyền Thoại Giảng Đường',
    description: 'Đạt cấp độ tối thượng Level 10 - Chiến thần qua môn.',
    tier: 'Cyber',
    iconName: 'shield',
    requirement: 'Level 10 (XP >= 6000)',
    color: 'from-pink-500 via-rose-500 to-amber-400 border-pink-300 text-white',
    glowColor: 'rgba(244, 63, 94, 0.45)',
  },
];

export function evaluateBadgeUnlock(
  badgeId: string,
  state?: Partial<CampusOSSharedState>
): boolean {
  if (!state) return false;
  if (state.badges && state.badges.includes(badgeId)) return true;

  const xp = state.xp ?? 0;
  const streak = state.streak ?? 0;
  const level = state.level ?? 1;
  const studyMinutes = state.studyMinutesTotal ?? 0;
  const tasksCompleted = state.tasks?.filter((t) => t.status === 'done').length ?? 0;

  switch (badgeId) {
    case 'early_bird':
      return xp >= 200;
    case 'consistency_pro':
      return streak >= 7;
    case 'speed_runner':
      return tasksCompleted >= 10;
    case 'deep_focus':
      return studyMinutes >= 600;
    case 'deadline_hunter':
      return level >= 5;
    case 'squad_leader':
      return Boolean(state.kanbanTasks && state.kanbanTasks.length > 0);
    case 'cyber_master':
      return level >= 7 || xp >= 2700;
    case 'campus_legend':
      return level >= 10 || xp >= 6000;
    default:
      return false;
  }
}

// =========================================================================
// 3. SETTINGS SECURITY, 2FA & GCAL VALIDATION
// =========================================================================

export interface PasswordStrengthResult {
  score: number;
  label: string;
  color: string;
  barWidth: string;
  feedback: string[];
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      label: 'Chưa nhập',
      color: 'bg-slate-700',
      barWidth: '0%',
      feedback: ['Vui lòng nhập mật khẩu mới'],
    };
  }

  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Tối thiểu 8 ký tự');
  }

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Bao gồm chữ hoa và chữ thường');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Bao gồm ít nhất một chữ số (0-9)');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Bao gồm ít nhất một ký tự đặc biệt (!@#$...)');
  }

  if (score <= 1) {
    return {
      score: 1,
      label: 'Yếu',
      color: 'bg-rose-500',
      barWidth: '25%',
      feedback,
    };
  }

  if (score === 2) {
    return {
      score: 2,
      label: 'Trung bình',
      color: 'bg-amber-500',
      barWidth: '50%',
      feedback,
    };
  }

  if (score === 3) {
    return {
      score: 3,
      label: 'Khá mạnh',
      color: 'bg-cyan-500',
      barWidth: '75%',
      feedback,
    };
  }

  return {
    score: 4,
    label: 'Rất mạnh',
    color: 'bg-emerald-400',
    barWidth: '100%',
    feedback: ['Mật khẩu đạt độ bảo mật tối ưu'],
  };
}

export const SIMULATED_2FA_SECRET = 'JBSWY3DPEHPK3PXP';

export const DEFAULT_BACKUP_CODES = [
  'A93B-4421',
  '7C92-E810',
  'B14F-9023',
  '4E81-A655',
  'D329-8711',
  '91CF-3304',
  '55B2-7109',
  '88A1-4920',
];

export function validateTotpCode(code: string): boolean {
  const clean = code ? code.trim() : '';
  return /^\d{6}$/.test(clean);
}

export function generateBackupCodes(): string[] {
  return [...DEFAULT_BACKUP_CODES];
}

export type SyncInterval = '15m' | '1h' | '6h' | 'manual';

export interface GCalSyncConfig {
  connected: boolean;
  accountEmail: string;
  autoSync: boolean;
  interval: SyncInterval;
  syncClasses: boolean;
  syncDeadlines: boolean;
  syncClubs: boolean;
  lastSyncedAt: string | null;
}

export const DEFAULT_GCAL_CONFIG: GCalSyncConfig = {
  connected: true,
  accountEmail: 'minh.nguyen@campus.edu.vn',
  autoSync: true,
  interval: '1h',
  syncClasses: true,
  syncDeadlines: true,
  syncClubs: true,
  lastSyncedAt: 'Vừa xong',
};

export function validateGCalConfig(config: Partial<GCalSyncConfig>): boolean {
  if (config.connected && !config.accountEmail) return false;
  if (config.interval && !['15m', '1h', '6h', 'manual'].includes(config.interval)) return false;
  return true;
}

export function formatGCalSummary(config: GCalSyncConfig, totalEventsCount: number): string {
  const activeCategories: string[] = [];
  if (config.syncClasses) activeCategories.push('Lớp học');
  if (config.syncDeadlines) activeCategories.push('Deadline');
  if (config.syncClubs) activeCategories.push('CLB');

  return `Đang đồng bộ ${totalEventsCount} sự kiện (${activeCategories.join(', ') || 'Không chọn mục nào'})`;
}
