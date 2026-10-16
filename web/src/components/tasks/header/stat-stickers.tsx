'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useCampusStore } from '@/lib/campus-store';
import { getTaskDateGroup } from '@/lib/tasks-engine';
import type { TaskItem } from '@/types/tasks';
import { ProgressRing } from './progress-ring';
import {
  ListTodo,
  Flame,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export interface StatStickersProps {
  tasks?: TaskItem[];
  className?: string;
  onSelectFilter?: (filter: 'all' | 'doing' | 'high' | 'done') => void;
  activeFilter?: string;
}

function useCountUp(target: number, reducedMotion = false, duration = 400): number {
  const [current, setCurrent] = useState<number>(reducedMotion ? target : 0);
  const currentRef = useRef<number>(current);
  currentRef.current = current;

  useEffect(() => {
    if (reducedMotion) {
      setCurrent(target);
      return;
    }

    const startVal = currentRef.current;
    const endVal = target;
    const startTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(startVal + (endVal - startVal) * ease);
      setCurrent(val);

      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        setCurrent(endVal);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [target, reducedMotion, duration]);

  return current;
}

export function StatStickers({
  tasks: propTasks,
  className = '',
  onSelectFilter,
  activeFilter,
}: StatStickersProps) {
  const { state } = useCampusStore();
  const tasks = propTasks ?? state.tasks;
  const reducedMotion = state.reducedMotion;

  // 1. Calculate stats from tasks collection
  const totalCount = tasks.length;
  const doingCount = useMemo(() => tasks.filter((t) => t.status === 'doing').length, [tasks]);
  const highPriorityCount = useMemo(
    () => tasks.filter((t) => t.status !== 'done' && t.priority === 'high').length,
    [tasks]
  );
  const doneCount = useMemo(() => tasks.filter((t) => t.status === 'done').length, [tasks]);

  const hasOverdue = useMemo(() => {
    const now = new Date();
    return tasks.some((t) => t.status !== 'done' && getTaskDateGroup(t, now) === 'overdue');
  }, [tasks]);

  const completionPercentage = useMemo(() => {
    return totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  }, [totalCount, doneCount]);

  // Animated count-up displays
  const animatedTotal = useCountUp(totalCount, reducedMotion);
  const animatedDoing = useCountUp(doingCount, reducedMotion);
  const animatedHigh = useCountUp(highPriorityCount, reducedMotion);
  const animatedDone = useCountUp(doneCount, reducedMotion);

  return (
    <div
      className={`grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 w-full min-w-0 ${className}`}
      role="region"
      aria-label="Thống kê nhanh nhiệm vụ"
    >
      {/* 1. Tổng nhiệm vụ (Tilt: -1.5deg) */}
      <button
        type="button"
        onClick={() => onSelectFilter?.('all')}
        className={`group relative flex flex-col justify-between p-3 sm:p-3.5 rounded-[20px] sm:rounded-[22px] bg-[#11111E]/90 hover:bg-[#16162a] border-2 transition-all duration-200 select-none text-left min-w-0 overflow-hidden ${
          activeFilter === 'all'
            ? 'border-[#C6FF3D] shadow-[6px_6px_0px_#C6FF3D] translate-y-[-2px]'
            : 'border-white/15 shadow-[6px_6px_0px_#000000] hover:shadow-[8px_8px_0px_#000000] hover:-translate-y-1'
        } ${reducedMotion ? '' : 'rotate-[-1.5deg] hover:rotate-0'}`}
        aria-label={`Tổng nhiệm vụ: ${totalCount}`}
      >
        <div className="flex items-center justify-between w-full mb-1">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
            Tổng số
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#C6FF3D] group-hover:scale-110 transition-transform">
            <ListTodo className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
            {animatedTotal}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">việc</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF3D]" />
          <span className="text-[10px] text-slate-400 truncate">Tất cả nhiệm vụ</span>
        </div>
      </button>

      {/* 2. Đang thực hiện (Tilt: +1.2deg) */}
      <button
        type="button"
        onClick={() => onSelectFilter?.('doing')}
        className={`group relative flex flex-col justify-between p-3 sm:p-3.5 rounded-[20px] sm:rounded-[22px] bg-[#11111E]/90 hover:bg-[#16162a] border-2 transition-all duration-200 select-none text-left min-w-0 overflow-hidden ${
          activeFilter === 'doing'
            ? 'border-[#3DE8FF] shadow-[6px_6px_0px_#3DE8FF] translate-y-[-2px]'
            : 'border-white/15 shadow-[6px_6px_0px_#000000] hover:shadow-[8px_8px_0px_#000000] hover:-translate-y-1'
        } ${reducedMotion ? '' : 'rotate-[1.2deg] hover:rotate-0'}`}
        aria-label={`Đang thực hiện: ${doingCount}`}
      >
        <div className="flex items-center justify-between w-full mb-1">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
            Đang làm
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#3DE8FF] group-hover:scale-110 transition-transform">
            <Flame className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
            {animatedDoing}
          </span>
          <span className="text-[11px] text-[#3DE8FF] font-medium">đang chạy</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3DE8FF] animate-pulse" />
          <span className="text-[10px] text-slate-400 truncate">Phiên tập trung</span>
        </div>
      </button>

      {/* 3. Ưu tiên cao (Tilt: -1.2deg with pulsing red dot if overdue) */}
      <button
        type="button"
        onClick={() => onSelectFilter?.('high')}
        className={`group relative flex flex-col justify-between p-3 sm:p-3.5 rounded-[20px] sm:rounded-[22px] bg-[#11111E]/90 hover:bg-[#16162a] border-2 transition-all duration-200 select-none text-left min-w-0 overflow-hidden ${
          activeFilter === 'high'
            ? 'border-[#FF3D6E] shadow-[6px_6px_0px_#FF3D6E] translate-y-[-2px]'
            : hasOverdue
            ? 'border-[#FF3D6E]/60 shadow-[6px_6px_0px_#FF3D6E]/40 hover:shadow-[8px_8px_0px_#FF3D6E]/60 hover:-translate-y-1'
            : 'border-white/15 shadow-[6px_6px_0px_#000000] hover:shadow-[8px_8px_0px_#000000] hover:-translate-y-1'
        } ${reducedMotion ? '' : 'rotate-[-1.2deg] hover:rotate-0'}`}
        aria-label={`Ưu tiên cao: ${highPriorityCount}, ${hasOverdue ? 'Có việc trễ hạn' : 'Đúng hạn'}`}
      >
        <div className="flex items-center justify-between w-full mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
              Ưu tiên cao
            </span>
            {hasOverdue && (
              <span className="relative flex h-2 w-2" title="Có nhiệm vụ quá hạn!">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
            )}
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#FF3D6E] group-hover:scale-110 transition-transform">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
            {animatedHigh}
          </span>
          <span className="text-[11px] text-[#FF3D6E] font-medium">quan trọng</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              hasOverdue ? 'bg-rose-500 animate-ping' : 'bg-[#FF3D6E]'
            }`}
          />
          <span className="text-[10px] text-slate-400 truncate">
            {hasOverdue ? 'Trễ hạn cần xử lý!' : 'Cần giải quyết sớm'}
          </span>
        </div>
      </button>

      {/* 4. Hoàn thành (Tilt: +1.5deg with ProgressRing liquid fill) */}
      <button
        type="button"
        onClick={() => onSelectFilter?.('done')}
        className={`group relative flex flex-col justify-between p-3 sm:p-3.5 rounded-[20px] sm:rounded-[22px] bg-[#11111E]/90 hover:bg-[#16162a] border-2 transition-all duration-200 select-none text-left min-w-0 overflow-hidden ${
          activeFilter === 'done'
            ? 'border-[#3DFFB0] shadow-[6px_6px_0px_#3DFFB0] translate-y-[-2px]'
            : 'border-white/15 shadow-[6px_6px_0px_#000000] hover:shadow-[8px_8px_0px_#000000] hover:-translate-y-1'
        } ${reducedMotion ? '' : 'rotate-[1.5deg] hover:rotate-0'}`}
        aria-label={`Hoàn thành: ${doneCount} trên ${totalCount} (${completionPercentage}%)`}
      >
        <div className="flex items-center justify-between w-full mb-1">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
            Hoàn thành
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#3DFFB0] group-hover:scale-110 transition-transform">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                {animatedDone}
              </span>
              <span className="text-[11px] text-slate-400 font-mono font-medium">
                /{totalCount}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3DFFB0]" />
              <span className="text-[10px] text-slate-400 truncate">
                {completionPercentage >= 100 ? 'Sạch bách bảng 🎉' : `${completionPercentage}% tiến độ`}
              </span>
            </div>
          </div>
          <div className="shrink-0 -my-1">
            <ProgressRing
              percentage={completionPercentage}
              size={46}
              strokeWidth={4.5}
              reducedMotion={reducedMotion}
              showText={true}
            />
          </div>
        </div>
      </button>
    </div>
  );
}
