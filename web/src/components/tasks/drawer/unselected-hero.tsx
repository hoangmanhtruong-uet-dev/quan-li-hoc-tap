'use client';

import React, { useMemo } from 'react';
import type { TaskItem, TaskPriority } from '@/types/tasks';
import { getUrgencyLevel, formatCountdown } from '@/lib/tasks-engine';
import { useCampusStore } from '@/lib/campus-store';
import {
  Flame,
  Play,
  ArrowRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock3,
  Lightbulb,
  Plus,
  BookOpen,
  Zap,
} from 'lucide-react';

export interface UnselectedHeroProps {
  tasks: TaskItem[];
  onSelectTask: (taskId: string) => void;
  onFocusTask: (task: TaskItem) => void;
  onOpenCreate?: () => void;
  reducedMotion?: boolean;
  className?: string;
}

const STUDY_TIPS = [
  {
    icon: Lightbulb,
    title: 'Mẹo Pomodoro',
    content: 'Chia nhỏ nhiệm vụ 90 phút thành 3 phiên 25p + 5p nghỉ ngắn. Sau 4 phiên nghỉ dài 15p.',
    color: '#FFB020',
  },
  {
    icon: Zap,
    title: 'Quy tắc 2 phút',
    content: 'Nếu một việc phụ mất dưới 2 phút để hoàn thành, hãy làm ngay đừng ghi vào backlog.',
    color: '#3DE8FF',
  },
  {
    icon: BookOpen,
    title: 'Phương pháp Feynman',
    content: 'Giải thích lại bài tập này cho một người bạn hiểu để phát hiện ngay lỗ hổng kiến thức.',
    color: '#C6FF3D',
  },
  {
    icon: Flame,
    title: 'Giữ nhịp học sáng',
    content: 'Hoàn thành 1 việc quan trọng trước 12h trưa giúp tăng 40% hiệu suất cả ngày.',
    color: '#FF3D6E',
  },
];

export function UnselectedHero({
  tasks,
  onSelectTask,
  onFocusTask,
  onOpenCreate,
  reducedMotion = false,
  className = '',
}: UnselectedHeroProps) {
  const { state } = useCampusStore();

  // Find the most urgent incomplete task
  const mostUrgentTask = useMemo(() => {
    const incomplete = tasks.filter((t) => t.status !== 'done');
    if (incomplete.length === 0) return null;

    return [...incomplete].sort((a, b) => {
      // Sort by dueAt ascending (earliest first)
      const timeA = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
      const timeB = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
      if (timeA !== timeB) return timeA - timeB;
      // High priority first
      const pMap: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (pMap[a.priority] ?? 2) - (pMap[b.priority] ?? 2);
    })[0] || null;
  }, [tasks]);

  const urgency = useMemo(() => {
    if (!mostUrgentTask || !mostUrgentTask.dueAt) return null;
    return getUrgencyLevel(mostUrgentTask.dueAt);
  }, [mostUrgentTask]);

  // Mini 7-day study activity heatmap data
  const weeklyDays = useMemo(() => {
    const days: { label: string; date: string; isToday: boolean; active: boolean; minutes: number }[] = [];
    const today = new Date();
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const isoDate = d.toISOString().slice(0, 10);
      const isToday = i === 0;

      // Check if any task was completed on this date or if it matches study date
      const hasCompleted = tasks.some(
        (t) => t.completedAt && t.completedAt.slice(0, 10) === isoDate
      ) || (isToday && state.weeklyStudyMinutesCurrent > 0);

      days.push({
        label: dayNames[d.getDay()] || '',
        date: isoDate,
        isToday,
        active: hasCompleted,
        minutes: isToday ? Math.round(state.weeklyStudyMinutesCurrent / 7) : hasCompleted ? 45 : 0,
      });
    }
    return days;
  }, [tasks, state.weeklyStudyMinutesCurrent]);

  return (
    <div className={`space-y-6 text-foreground ${className}`}>
      {/* 1. Header Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-aurora-lime/20 border border-aurora-lime/40 text-aurora-lime">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-black text-xs uppercase tracking-wider text-aurora-lime">
              Trợ lý thông minh
            </h3>
            <p className="text-[11px] text-white/50">Gợi ý việc tiếp theo & phương pháp học</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
          <Flame className="w-3.5 h-3.5 text-aurora-orange animate-pulse" />
          <span className="font-mono font-bold text-white">{state.streak}</span>
          <span className="text-[10px] text-white/40">ngày</span>
        </div>
      </div>

      {/* 2. Hero Card: "Việc tiếp theo nên làm" */}
      {mostUrgentTask ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#161626] to-[#0E0F1A] border-2 border-aurora-lime/40 p-5 shadow-[4px_4px_0px_#C6FF3D] transition-all">
          {/* Neon Glow Corner */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-aurora-lime/15 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-aurora-lime text-black">
              <Zap className="w-3 h-3 fill-current" />
              Việc tiếp theo nên làm
            </span>

            {urgency && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold ${
                  urgency.color === 'red'
                    ? 'bg-aurora-pink/20 text-aurora-pink border border-aurora-pink/40 animate-pulse'
                    : urgency.color === 'orange'
                    ? 'bg-aurora-orange/20 text-aurora-orange border border-aurora-orange/40'
                    : 'bg-aurora-lime/20 text-aurora-lime border border-aurora-lime/40'
                }`}
              >
                <Clock3 className="w-3 h-3" />
                {urgency.displayCountdown}
              </span>
            )}
          </div>

          <h4 className="font-heading font-black text-base text-white line-clamp-2 mb-2 leading-snug">
            {mostUrgentTask.title}
          </h4>

          {mostUrgentTask.description && (
            <p className="text-xs text-white/60 line-clamp-2 mb-4 leading-relaxed">
              {mostUrgentTask.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px]">
            {mostUrgentTask.course && (
              <span className="px-2 py-0.5 rounded bg-white/10 text-white/80 font-medium">
                {mostUrgentTask.course}
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                mostUrgentTask.priority === 'high'
                  ? 'bg-aurora-pink/20 text-aurora-pink'
                  : mostUrgentTask.priority === 'medium'
                  ? 'bg-aurora-orange/20 text-aurora-orange'
                  : 'bg-aurora-cyan/20 text-aurora-cyan'
              }`}
            >
              {mostUrgentTask.priority === 'high'
                ? 'Ưu tiên cao'
                : mostUrgentTask.priority === 'medium'
                ? 'Ưu tiên vừa'
                : 'Ưu tiên thấp'}
            </span>
            {mostUrgentTask.estimateMin > 0 && (
              <span className="text-white/40">~{mostUrgentTask.estimateMin} phút</span>
            )}
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => onFocusTask(mostUrgentTask)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-aurora-lime text-black font-heading font-black text-xs hover:bg-white transition-all shadow-[2px_2px_0px_#000]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Bắt đầu ngay</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTask(mostUrgentTask.id)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs border border-white/15 transition-all"
            >
              <span>Chi tiết</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Gen Z All Done Empty State */
        <div className="rounded-2xl bg-gradient-to-br from-[#161626] to-[#0E0F1A] border-2 border-aurora-lime/40 p-6 text-center space-y-3 shadow-[4px_4px_0px_#C6FF3D]">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-aurora-lime/20 border border-aurora-lime/40 flex items-center justify-center text-aurora-lime">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="font-heading font-black text-base text-white">
            Sạch bách, đi chơi được rồi 🎉
          </h4>
          <p className="text-xs text-white/60 max-w-xs mx-auto leading-relaxed">
            Bạn đã hoàn thành tất cả nhiệm vụ hôm nay! Không còn việc tồn đọng nào cần giải quyết.
          </p>
          {onOpenCreate && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-aurora-lime text-black font-heading font-bold text-xs hover:bg-white transition-all shadow-[2px_2px_0px_#000] mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo nhiệm vụ mới</span>
            </button>
          )}
        </div>
      )}

      {/* 3. 7-Day Mini Heatmap */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-heading font-bold text-white flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-aurora-purple" />
            Nhịp học 7 ngày qua
          </span>
          <span className="text-[11px] font-mono text-white/50">
            Tuần này: <strong className="text-white">{state.weeklyStudyMinutesCurrent}p</strong>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weeklyDays.map((day) => (
            <div
              key={day.date}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/5 text-center group transition-colors hover:border-white/20"
              title={`${day.date}: ${day.minutes} phút`}
            >
              <span
                className={`text-[10px] font-bold ${
                  day.isToday ? 'text-aurora-lime font-black' : 'text-white/40'
                }`}
              >
                {day.label}
              </span>

              <div
                className={`w-6 h-6 rounded-lg transition-all flex items-center justify-center ${
                  day.active
                    ? 'bg-aurora-lime/25 border-2 border-aurora-lime text-aurora-lime shadow-[0_0_8px_rgba(198,255,61,0.3)]'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                {day.active && <div className="w-2 h-2 rounded-full bg-aurora-lime" />}
              </div>

              <span className="text-[9px] font-mono text-white/30 group-hover:text-white/70">
                {day.minutes > 0 ? `${day.minutes}p` : '-'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Academic Study Tips */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-white/80">
          <Sparkles className="w-3.5 h-3.5 text-aurora-cyan" />
          <span>Bí kíp học tập hôm nay</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {STUDY_TIPS.map((tip, idx) => {
            const Icon = tip.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex items-start gap-3"
              >
                <div
                  className="p-2 rounded-lg shrink-0 mt-0.5"
                  style={{
                    backgroundColor: `${tip.color}15`,
                    color: tip.color,
                    border: `1px solid ${tip.color}40`,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white mb-0.5">{tip.title}</div>
                  <div className="text-[11px] text-white/60 leading-relaxed">{tip.content}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
