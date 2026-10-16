'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { TaskItem } from '@/types/tasks';
import { useCampusStore, formatIsoDateOnly } from '@/lib/campus-store';
import type { CalendarEvent } from '@/lib/campus-store';
import { TaskCard } from './task-card';
import {
  Sparkles,
  CalendarCheck,
  Play,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  ArrowRight,
  Flame,
} from 'lucide-react';

export interface TodayViewProps {
  tasks: TaskItem[];
  selectedTaskId?: string | null;
  onSelectTask?: (taskId: string) => void;
  selectedTaskIds?: string[];
  onToggleMultiSelect?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onFocusTask?: (task: TaskItem) => void;
  onRescheduleTask?: (taskId: string, daysToAdd: number) => void;
  onDeleteTask?: (taskId: string) => void;
  reducedMotion?: boolean;
  className?: string;
}

export function TodayView({
  tasks,
  selectedTaskId,
  onSelectTask,
  selectedTaskIds = [],
  onToggleMultiSelect,
  onCompleteTask,
  onFocusTask,
  onRescheduleTask,
  onDeleteTask,
  reducedMotion = false,
  className = '',
}: TodayViewProps) {
  const { state, update } = useCampusStore();
  const [isPlanAccepted, setIsPlanAccepted] = useState(false);
  const [planToast, setPlanToast] = useState<string | null>(null);

  const todayStr = useMemo(() => formatIsoDateOnly(new Date(), 0), []);

  // 1. AI-Curated Top ~5 Priority Tasks for Today
  const curatedTasks = useMemo(() => {
    // Only uncompleted tasks
    const activeTasks = tasks.filter((t) => t.status !== 'done');

    const scoreTask = (task: TaskItem): number => {
      let score = 0;
      const due = task.dueAt ? task.dueAt.slice(0, 10) : '';

      // Overdue tasks have highest priority
      if (due && due < todayStr) score += 1000;
      // Due today has high priority
      else if (due === todayStr) score += 500;
      // In progress gives boost
      if (task.status === 'doing') score += 200;
      // Priority weighting
      if (task.priority === 'high') score += 150;
      else if (task.priority === 'medium') score += 50;
      // Difficulty weighting
      score += (task.difficulty || 1) * 10;

      return score;
    };

    return [...activeTasks]
      .sort((a, b) => scoreTask(b) - scoreTask(a))
      .slice(0, 5);
  }, [tasks, todayStr]);

  // 2. Capacity calculation: total task minutes vs free study time
  const totalTaskMinutes = useMemo(() => {
    return curatedTasks.reduce((acc, t) => acc + (t.estimateMin || 45), 0);
  }, [curatedTasks]);

  // Calculate free minutes based on existing calendar events today (assume 480 total day study/activity window, minus existing events)
  const availableFreeMinutes = useMemo(() => {
    const todayEvents = state.events.filter((e) => e.date === todayStr);
    let busyMinutes = 0;
    for (const e of todayEvents) {
      if (e.start && e.end) {
        const [sh, sm] = e.start.split(':').map(Number);
        const [eh, em] = e.end.split(':').map(Number);
        if (!isNaN(sh!) && !isNaN(sm!) && !isNaN(eh!) && !isNaN(em!)) {
          const dur = (eh! * 60 + em!) - (sh! * 60 + sm!);
          if (dur > 0) busyMinutes += dur;
        }
      }
    }
    // Baseline study budget 270 minutes (~4.5h), minus busy events, clamped at min 120m
    return Math.max(120, 360 - busyMinutes);
  }, [state.events, todayStr]);

  const capacityRatio = availableFreeMinutes > 0 ? (totalTaskMinutes / availableFreeMinutes) * 100 : 0;
  const isOverloaded = capacityRatio > 100;

  // Capacity color
  const capacityBarColor = useMemo(() => {
    if (isOverloaded) return 'bg-[#FF3D6E] shadow-[0_0_10px_#FF3D6E]';
    if (capacityRatio > 80) return 'bg-[#FFB020] shadow-[0_0_8px_#FFB020]';
    return 'bg-aurora-lime shadow-[0_0_8px_#C6FF3D]';
  }, [capacityRatio, isOverloaded]);

  // 3. Schedule Study Blocks into campus-store Events
  const handleAcceptPlan = useCallback(() => {
    if (curatedTasks.length === 0) return;

    let currentStartHour = 14;
    let currentStartMin = 0;

    const newStudyEvents: CalendarEvent[] = curatedTasks.map((task, index) => {
      const durMin = task.estimateMin || 45;
      const startHStr = String(currentStartHour).padStart(2, '0');
      const startMStr = String(currentStartMin).padStart(2, '0');

      const endTotalMin = currentStartHour * 60 + currentStartMin + durMin;
      const endHStr = String(Math.floor(endTotalMin / 60)).padStart(2, '0');
      const endMStr = String(endTotalMin % 60).padStart(2, '0');

      // Next block starts 15 min after
      const nextTotalMin = endTotalMin + 15;
      currentStartHour = Math.floor(nextTotalMin / 60);
      currentStartMin = nextTotalMin % 60;

      return {
        id: `study-${Date.now()}-${index}`,
        title: `Học: ${task.title}`,
        date: todayStr,
        start: `${startHStr}:${startMStr}`,
        end: `${endHStr}:${endMStr}`,
        type: 'study',
        description: task.description || `Phiên học tự động sắp xếp cho ${task.title}`,
        subjectId: task.subjectId,
        color: '#8B6CFF',
        done: false,
      };
    });

    update((prev) => ({
      events: [...prev.events, ...newStudyEvents],
    }));

    setIsPlanAccepted(true);
    setPlanToast(`Đã xếp ${newStudyEvents.length} phiên học vào Lịch & kế hoạch! 🚀`);
    setTimeout(() => setPlanToast(null), 5000);
  }, [curatedTasks, todayStr, update]);

  const topTask = curatedTasks[0];

  return (
    <div
      role="region"
      aria-label="Kế hoạch hôm nay"
      className={`w-full min-w-0 max-w-full flex flex-col gap-5 overflow-x-hidden ${className}`}
    >
      {/* Toast Notification */}
      {planToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-20 right-6 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#141423] border-2 border-aurora-lime text-white text-xs sm:text-sm font-semibold shadow-[6px_6px_0px_#000] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3"
        >
          <Sparkles className="w-4 h-4 text-aurora-lime" />
          <span>{planToast}</span>
        </aside>
      )}

      {/* Hero AI Plan Header Card */}
      <div className="flex flex-col gap-4 rounded-[24px] bg-[#0E0F1A]/95 border-2 border-aurora-lime/50 p-4 sm:p-6 shadow-[6px_6px_0px_#000] backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-aurora-lime/15 border border-aurora-lime/30 text-aurora-lime">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-heading font-black text-base sm:text-lg text-white">
                Kế Hoạch Học Tập Hôm Nay (AI Curated)
              </h3>
              <p className="text-xs text-white/60">
                Top {curatedTasks.length} nhiệm vụ quan trọng nhất được chọn lọc dựa trên deadline và độ khó.
              </p>
            </div>
          </div>

          {/* Accept Plan Button */}
          <button
            type="button"
            onClick={handleAcceptPlan}
            disabled={isPlanAccepted || curatedTasks.length === 0}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-black text-xs sm:text-sm transition-all shadow-[3px_3px_0px_#000] active:scale-95 whitespace-nowrap ${
              isPlanAccepted
                ? 'bg-[#3DFFB0]/20 text-[#3DFFB0] border border-[#3DFFB0]/40 cursor-default'
                : 'bg-aurora-lime text-black hover:bg-white border-2 border-black'
            }`}
          >
            {isPlanAccepted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã chốt kế hoạch</span>
              </>
            ) : (
              <>
                <CalendarCheck className="w-4 h-4" />
                <span>Chấp nhận kế hoạch</span>
              </>
            )}
          </button>
        </div>

        {/* Capacity Progress Bar */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-white/70">
              Công suất: <strong className="text-white">{totalTaskMinutes}p</strong> / {availableFreeMinutes}p rảnh hôm nay
            </span>
            <span
              className={`font-bold ${
                isOverloaded ? 'text-[#FF3D6E]' : 'text-aurora-lime'
              }`}
            >
              {Math.round(capacityRatio)}%
            </span>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${capacityBarColor}`}
              style={{ width: `${Math.min(100, Math.round(capacityRatio))}%` }}
            />
          </div>

          {/* Overload Warning Banner */}
          {isOverloaded && (
            <div
              role="alert"
              className="flex items-start gap-2 p-2.5 mt-1 rounded-xl bg-[#FF3D6E]/15 border border-[#FF3D6E]/50 text-[#FF3D6E] text-xs font-bold shadow-[2px_2px_0px_#000]"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                ⚠️ Tổng thời gian ({totalTaskMinutes}p) vượt quá quỹ thời gian ({availableFreeMinutes}p) khả dụng hôm nay! Nên dời bớt việc sang ngày mai để tránh burnout bro.
              </span>
            </div>
          )}
        </div>

        {/* Top Priority Task Quick Launch CTA */}
        {topTask && onFocusTask && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <Flame className="w-4 h-4 text-aurora-orange shrink-0" />
              <div className="min-w-0 truncate">
                <div className="text-[11px] uppercase font-bold text-white/50 tracking-wider">
                  Việc ưu tiên số 1
                </div>
                <div className="text-xs font-bold text-white truncate">
                  {topTask.title}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onFocusTask(topTask)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aurora-lime text-black font-black text-xs hover:bg-white transition-all shadow-[2px_2px_0px_#000] shrink-0"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Focus ngay</span>
            </button>
          </div>
        )}
      </div>

      {/* Task Cards List */}
      <div className="flex flex-col gap-3 min-w-0 max-w-full">
        {curatedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-[24px] bg-[#0D0E17]/60 border border-white/10 w-full min-w-0">
            <Inbox className="w-12 h-12 text-white/30 mb-3" />
            <h3 className="font-heading font-bold text-lg text-white">
              Hôm nay sạch bách việc! 🎉
            </h3>
            <p className="text-xs sm:text-sm text-white/50 max-w-sm mt-1">
              Bạn không còn nhiệm vụ nào cần giải quyết hôm nay. Nghỉ ngơi hoặc thư giãn đi bro!
            </p>
          </div>
        ) : (
          curatedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              isMultiSelected={selectedTaskIds.includes(task.id)}
              onSelect={onSelectTask}
              onToggleMultiSelect={onToggleMultiSelect}
              onComplete={onCompleteTask}
              onFocus={onFocusTask}
              onReschedule={onRescheduleTask}
              onDelete={onDeleteTask}
              draggable={false}
              reducedMotion={reducedMotion}
            />
          ))
        )}
      </div>
    </div>
  );
}
