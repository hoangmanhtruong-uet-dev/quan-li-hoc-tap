'use client';

import React, { useState } from 'react';
import { Award, Check, Flame, Lock, ShieldCheck, Sparkles, Star, Target, Trophy, Users, X, Zap } from 'lucide-react';
import type { CampusOSSharedState } from '@/lib/campus-store';

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

/**
 * Pure evaluation function for badge unlock status based on store state
 */
export function evaluateBadgeUnlock(
  badgeId: string,
  state?: Partial<CampusOSSharedState>
): boolean {
  if (!state) return false;
  // If explicitly recorded in unlocked badges list
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

function renderBadgeIcon(iconName: BadgeDefinition['iconName'], className: string) {
  switch (iconName) {
    case 'flame':
      return <Flame className={className} />;
    case 'trophy':
      return <Trophy className={className} />;
    case 'target':
      return <Target className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'shield':
      return <ShieldCheck className={className} />;
    case 'users':
      return <Users className={className} />;
    case 'sparkles':
    default:
      return <Sparkles className={className} />;
  }
}

interface AchievementsShowcaseProps {
  storeState?: Partial<CampusOSSharedState>;
  className?: string;
}

export function AchievementsShowcase({
  storeState,
  className = '',
}: AchievementsShowcaseProps) {
  const [selectedTier, setSelectedTier] = useState<string>('Tất cả');
  const [activeBadgeModal, setActiveBadgeModal] = useState<BadgeDefinition | null>(null);

  const tiers = ['Tất cả', 'Cyber', 'Vàng', 'Bạc', 'Đồng'];

  const filteredBadges = BADGE_CATALOG.filter(
    (b) => selectedTier === 'Tất cả' || b.tier === selectedTier
  );

  const unlockedCount = BADGE_CATALOG.filter((b) => evaluateBadgeUnlock(b.id, storeState)).length;

  return (
    <div
      className={`relative rounded-2xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 shadow-lg overflow-hidden space-y-5 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h4 className="text-base font-bold text-white tracking-tight">
              Kho Báu Danh Hiệu & Huy Hiệu
            </h4>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mở khóa thành tích thông qua học tập, chuỗi ngày và đồ án
          </p>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-300 font-mono text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Đã mở khóa:</span>
            <span className="text-white font-black">{unlockedCount}</span>
            <span className="text-muted-foreground">/{BADGE_CATALOG.length}</span>
          </div>
        </div>
      </div>

      {/* Tier Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {tiers.map((tier) => (
          <button
            key={tier}
            type="button"
            onClick={() => setSelectedTier(tier)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedTier === tier
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(61,232,255,0.2)]'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            {tier}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {filteredBadges.map((badge) => {
          const isUnlocked = evaluateBadgeUnlock(badge.id, storeState);

          return (
            <div
              key={badge.id}
              onClick={() => setActiveBadgeModal(badge)}
              className={`group relative flex flex-col items-center text-center p-3.5 rounded-2xl border transition-all cursor-pointer ${
                isUnlocked
                  ? 'border-white/15 bg-slate-900/40 hover:border-cyan-400/40 hover:scale-[1.02] shadow-md'
                  : 'border-white/5 bg-slate-950/20 opacity-60 hover:opacity-80'
              }`}
            >
              {/* Medal Emblem */}
              <div
                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br border shadow-lg transition-transform group-hover:rotate-3 ${
                  isUnlocked ? badge.color : 'from-slate-800 to-slate-900 border-slate-700 text-slate-500'
                }`}
                style={{
                  boxShadow: isUnlocked ? `0 0 16px ${badge.glowColor}` : 'none',
                }}
              >
                {isUnlocked ? (
                  renderBadgeIcon(badge.iconName, 'h-7 w-7')
                ) : (
                  <Lock className="h-6 w-6 text-slate-500" />
                )}

                {/* Tier mini badge */}
                <span className="absolute -bottom-1 -right-1 text-[9px] font-black px-1.5 py-0.2 rounded border border-white/20 bg-slate-950/90 text-slate-200">
                  {badge.tier}
                </span>
              </div>

              {/* Title & Status */}
              <h5 className="mt-2.5 text-xs font-bold text-white tracking-tight line-clamp-1">
                {badge.title}
              </h5>
              <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">
                {isUnlocked ? 'Đã đạt được' : 'Chưa mở khóa'}
              </p>

              {isUnlocked && (
                <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                  <Check className="h-3 w-3" />
                  <span>Sở hữu</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Badge Detail Modal Dialog */}
      {activeBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/20 bg-slate-950 p-6 shadow-2xl text-center space-y-4">
            <button
              type="button"
              onClick={() => setActiveBadgeModal(null)}
              aria-label="Đóng cửa sổ"
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Glowing Icon */}
            <div className="flex justify-center">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br border shadow-xl ${
                  evaluateBadgeUnlock(activeBadgeModal.id, storeState)
                    ? activeBadgeModal.color
                    : 'from-slate-800 to-slate-900 border-slate-700 text-slate-500'
                }`}
                style={{
                  boxShadow: evaluateBadgeUnlock(activeBadgeModal.id, storeState)
                    ? `0 0 24px ${activeBadgeModal.glowColor}`
                    : 'none',
                }}
              >
                {evaluateBadgeUnlock(activeBadgeModal.id, storeState) ? (
                  renderBadgeIcon(activeBadgeModal.iconName, 'h-10 w-10')
                ) : (
                  <Lock className="h-8 w-8 text-slate-500" />
                )}
              </div>
            </div>

            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border border-white/20 uppercase tracking-widest text-cyan-300 bg-cyan-500/10 mb-2">
                Huy hiệu {activeBadgeModal.tier}
              </div>
              <h3 className="text-lg font-black text-white">{activeBadgeModal.title}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {activeBadgeModal.description}
              </p>
            </div>

            {/* Condition Box */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-left space-y-1">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase">
                Điều kiện đạt:
              </span>
              <p className="text-xs font-semibold text-cyan-300">
                {activeBadgeModal.requirement}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveBadgeModal(null)}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
