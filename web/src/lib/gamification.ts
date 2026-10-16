/**
 * CampusOS Gamification Engine
 * Handles XP calculation, 10 student level tiers, humorous Vietnamese titles,
 * streaks, and streak freeze shields.
 */

export interface LevelInfo {
  level: number;
  rankTitle: string;
  minXp: number;
  maxXp: number | null; // null for Level 10
  badgeCode: string;
}

export interface LevelProgress {
  currentLevel: number;
  rankTitle: string;
  badgeCode: string;
  totalXp: number;
  currentLevelMinXp: number;
  nextLevelMinXp: number;
  xpInCurrentLevel: number;
  xpRequiredForLevel: number;
  progressPercent: number; // 0 - 100
  xpToNextLevel: number;
  isMaxLevel: boolean;
}

export interface StreakState {
  streak: number;
  lastStudyDate: string; // YYYY-MM-DD
  streakFreezes: number;
  maxFreezes?: number;
}

export interface CheckInResult {
  streak: number;
  streakFreezes: number;
  freezeUsed: boolean;
  streakBroken: boolean;
  message: string;
}

export interface SessionReward {
  baseXp: number;
  disciplineBonus: number;
  milestoneBonus: number;
  totalXp: number;
  xp: number;
}

export const LEVELS_TABLE: LevelInfo[] = [
  { level: 1, minXp: 0, maxXp: 199, rankTitle: 'Tân sinh viên ngơ ngác', badgeCode: 'freshman_lost' },
  { level: 2, minXp: 200, maxXp: 499, rankTitle: 'Cú đêm giảng đường', badgeCode: 'night_owl' },
  { level: 3, minXp: 500, maxXp: 899, rankTitle: 'Dũng sĩ trốn điểm danh', badgeCode: 'rollcall_ninja' },
  { level: 4, minXp: 900, maxXp: 1399, rankTitle: 'Bậc thầy nước đến chân', badgeCode: 'last_minute_guru' },
  { level: 5, minXp: 1400, maxXp: 1999, rankTitle: 'Thợ săn deadline', badgeCode: 'deadline_hunter' },
  { level: 6, minXp: 2000, maxXp: 2699, rankTitle: 'Chiến thần thuyết trình', badgeCode: 'slide_gladiator' },
  { level: 7, minXp: 2700, maxXp: 3599, rankTitle: 'Sinh viên cày thuê', badgeCode: 'code_grinder' },
  { level: 8, minXp: 3600, maxXp: 4699, rankTitle: 'Trùm phao cứu sinh', badgeCode: 'lifesaver_boss' },
  { level: 9, minXp: 4700, maxXp: 5999, rankTitle: 'Giáo sư tự phong', badgeCode: 'peer_professor' },
  { level: 10, minXp: 6000, maxXp: null, rankTitle: 'Chiến thần qua môn', badgeCode: 'exam_conqueror' },
];

/**
 * Return LevelInfo for given XP. Clamped between Level 1 and 10.
 */
export function getLevelInfo(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(xp));
  for (let i = LEVELS_TABLE.length - 1; i >= 0; i--) {
    const tier = LEVELS_TABLE[i]!;
    if (safeXp >= tier.minXp) {
      return tier;
    }
  }
  return LEVELS_TABLE[0]!;
}

/**
 * Calculate detailed level progression metrics and percentage.
 */
export function calculateLevelProgress(xp: number): LevelProgress {
  const safeXp = Math.max(0, Math.floor(xp));
  const current = getLevelInfo(safeXp);
  const nextTier = LEVELS_TABLE.find((t) => t.level === current.level + 1);

  if (!nextTier) {
    // Level 10 (Max Level)
    return {
      currentLevel: current.level,
      rankTitle: current.rankTitle,
      badgeCode: current.badgeCode,
      totalXp: safeXp,
      currentLevelMinXp: current.minXp,
      nextLevelMinXp: current.minXp,
      xpInCurrentLevel: safeXp - current.minXp,
      xpRequiredForLevel: 0,
      progressPercent: 100,
      xpToNextLevel: 0,
      isMaxLevel: true,
    };
  }

  const currentLevelMinXp = current.minXp;
  const nextLevelMinXp = nextTier.minXp;
  const xpRequiredForLevel = nextLevelMinXp - currentLevelMinXp;
  const xpInCurrentLevel = safeXp - currentLevelMinXp;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((xpInCurrentLevel / xpRequiredForLevel) * 100))
  );
  const xpToNextLevel = Math.max(0, nextLevelMinXp - safeXp);

  return {
    currentLevel: current.level,
    rankTitle: current.rankTitle,
    badgeCode: current.badgeCode,
    totalXp: safeXp,
    currentLevelMinXp,
    nextLevelMinXp,
    xpInCurrentLevel,
    xpRequiredForLevel,
    progressPercent,
    xpToNextLevel,
    isMaxLevel: false,
  };
}

/**
 * Helper to calculate level and rank title for campus store.
 */
export function calculateLevelAndRank(xp: number): {
  level: number;
  rankTitle: string;
  nextLevelXp: number;
  currentLevelMinXp: number;
  progressPercent: number;
} {
  const progress = calculateLevelProgress(xp);
  return {
    level: progress.currentLevel,
    rankTitle: progress.rankTitle,
    nextLevelXp: progress.nextLevelMinXp,
    currentLevelMinXp: progress.currentLevelMinXp,
    progressPercent: progress.progressPercent,
  };
}

/**
 * Difference in calendar days between date A and date B (B - A).
 * Uses UTC date calculations to avoid daylight saving or timezone issues.
 */
export function daysDifference(dateStrA: string, dateStrB: string): number {
  if (!dateStrA || !dateStrB) return 0;
  const [y1, m1, d1] = dateStrA.split('-').map(Number);
  const [y2, m2, d2] = dateStrB.split('-').map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 0;
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / 86400000);
}

/**
 * Calculate streak status and freeze shield consumption on check-in.
 */
export function calculateStreakOnCheckIn(
  state: StreakState,
  todayDateStr: string
): CheckInResult {
  const currentStreak = Math.max(0, state.streak);
  let availableFreezes = Math.max(0, state.streakFreezes);

  if (!state.lastStudyDate) {
    return {
      streak: 1,
      streakFreezes: availableFreezes,
      freezeUsed: false,
      streakBroken: false,
      message: 'Khởi động chuỗi học tập mới!',
    };
  }

  const diff = daysDifference(state.lastStudyDate, todayDateStr);

  if (diff <= 0) {
    return {
      streak: currentStreak > 0 ? currentStreak : 1,
      streakFreezes: availableFreezes,
      freezeUsed: false,
      streakBroken: false,
      message: 'Đã điểm danh hôm nay.',
    };
  }

  if (diff === 1) {
    return {
      streak: currentStreak + 1,
      streakFreezes: availableFreezes,
      freezeUsed: false,
      streakBroken: false,
      message: `Giữ vững phong độ! Chuỗi ${currentStreak + 1} ngày 🔥`,
    };
  }

  if (diff === 2) {
    if (availableFreezes > 0) {
      availableFreezes -= 1;
      return {
        streak: currentStreak + 1,
        streakFreezes: availableFreezes,
        freezeUsed: true,
        streakBroken: false,
        message: 'Khiên bảo vệ đã cứu chuỗi học tập của bạn! 🛡️',
      };
    }
    return {
      streak: 1,
      streakFreezes: 0,
      freezeUsed: false,
      streakBroken: true,
      message: 'Chuỗi học tập đã bị đứt. Bắt đầu lại nào! 💪',
    };
  }

  // diff > 2
  return {
    streak: 1,
    streakFreezes: availableFreezes,
    freezeUsed: false,
    streakBroken: true,
    message: 'Chuỗi học tập đã bị đứt do nghỉ nhiều ngày.',
  };
}

/**
 * Calculate session rewards based on focused minutes and discipline score.
 * Formula: base XP (minutes * 2) + discipline bonus (up to 10 XP) + milestone bonus (15 XP for >= 25 mins).
 */
export function calculateSessionXp(
  minutes: number,
  disciplineScore: number = 100
): SessionReward {
  const safeMin = Math.max(0, Math.floor(minutes));
  const baseMinutesXp = safeMin > 0 ? Math.round(safeMin * 2) : 0;
  const normalizedScore = Math.max(0, Math.min(100, disciplineScore));
  const disciplineBonus = safeMin > 0 ? Math.round((normalizedScore / 100) * 10) : 0;
  const milestoneBonus = safeMin >= 25 ? 15 : 0;
  const totalXp = baseMinutesXp + disciplineBonus + milestoneBonus;

  return {
    baseXp: baseMinutesXp,
    disciplineBonus,
    milestoneBonus,
    totalXp,
    xp: totalXp,
  };
}
