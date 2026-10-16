'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useCampusStore } from '@/lib/campus-store';
import { getTaskDateGroup } from '@/lib/tasks-engine';
import type { TaskItem } from '@/types/tasks';
import { FloatingBlocks3D } from './floating-blocks-3d';
import { StatStickers } from './stat-stickers';
import { Plus, Sparkles, Play } from 'lucide-react';

export interface QuestBoardHeaderProps {
  onAddTask?: () => void;
  onAiBreakdown?: () => void;
  onFocusNow?: (mostUrgentTask?: TaskItem) => void;
  onSelectFilter?: (filter: 'all' | 'doing' | 'high' | 'done') => void;
  activeFilter?: string;
  className?: string;
}

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number;
  reducedMotion?: boolean;
}

function MagneticButton({
  children,
  className = '',
  strength = 0.22,
  reducedMotion = false,
  onMouseMove,
  onMouseLeave,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!reducedMotion && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const y = (e.clientY - rect.top - rect.height / 2) * strength;
      ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    onMouseMove?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ref.current) {
      ref.current.style.transform = 'translate3d(0px, 0px, 0px)';
    }
    onMouseLeave?.(e);
  };

  return (
    <button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-100 ease-out will-change-transform ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function QuestBoardHeader({
  onAddTask,
  onAiBreakdown,
  onFocusNow,
  onSelectFilter,
  activeFilter,
  className = '',
}: QuestBoardHeaderProps) {
  const { state } = useCampusStore();
  const tasks = state.tasks;
  const reducedMotion = state.reducedMotion;

  // 1. Completion particle burst counter
  const doneCount = useMemo(
    () => tasks.filter((t) => t.status === 'done').length,
    [tasks]
  );
  const prevDoneCountRef = useRef(doneCount);
  const [burstCount, setBurstCount] = useState(0);

  useEffect(() => {
    if (doneCount > prevDoneCountRef.current) {
      setBurstCount((c) => c + 1);
    }
    prevDoneCountRef.current = doneCount;
  }, [doneCount]);

  // 2. Uncompleted tasks and overdue detection
  const uncompletedTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'done'),
    [tasks]
  );

  const hasOverdue = useMemo(() => {
    const now = new Date();
    return uncompletedTasks.some((t) => getTaskDateGroup(t, now) === 'overdue');
  }, [uncompletedTasks]);

  const remainingCount = uncompletedTasks.length;

  // 3. Dynamic Vietnamese Subtitle
  const subtitleText = useMemo(() => {
    if (hasOverdue) {
      return 'Trễ rồi bro, làm nhanh còn kịp 🫠';
    }
    if (remainingCount > 0) {
      return `Còn ${remainingCount} việc, cân được 💪`;
    }
    return 'Sạch bách, đi chơi được rồi 🎉';
  }, [hasOverdue, remainingCount]);

  // 4. Find most urgent task for "Focus ngay"
  const mostUrgentTask = useMemo(() => {
    if (uncompletedTasks.length === 0) return undefined;

    const sorted = [...uncompletedTasks].sort((a, b) => {
      // Priority weighting
      const pWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
      const weightA = pWeight[a.priority] ?? 2;
      const weightB = pWeight[b.priority] ?? 2;

      // Due date sorting
      const dueA = a.dueAt || '9999-99-99';
      const dueB = b.dueAt || '9999-99-99';

      if (weightA !== weightB) {
        return weightB - weightA;
      }
      return dueA.localeCompare(dueB);
    });

    return sorted[0];
  }, [uncompletedTasks]);

  const handleFocusClick = useCallback(() => {
    if (onFocusNow) {
      onFocusNow(mostUrgentTask);
    } else {
      // Fallback: dispatch global shortcut event
      window.dispatchEvent(new CustomEvent('campusos-focus-mode-trigger', { detail: mostUrgentTask }));
    }
  }, [onFocusNow, mostUrgentTask]);

  return (
    <header
      className={`relative w-full min-w-0 overflow-hidden rounded-[24px] sm:rounded-[26px] border-2 border-white/15 bg-[#10101E]/90 p-4 sm:p-5 lg:p-6 shadow-[8px_8px_0px_#000000] backdrop-blur-md hard-border lg:max-h-[28vh] flex flex-col justify-between ${className}`}
      role="banner"
      aria-label="Bảng nhiệm vụ Quest Board"
    >
      {/* Vanilla Three.js floating cubes canvas background */}
      <FloatingBlocks3D burstTrigger={burstCount} />

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col gap-3.5 sm:gap-4 lg:gap-5 w-full min-w-0 justify-between h-full">
        {/* Top Section: Title, Subtitle & Magnetic Action CTAs */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 w-full min-w-0">
          {/* Header Title with Staggered Character Reveal */}
          <div className="space-y-1 sm:space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <h1
                className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center select-none"
                aria-label="NHIỆM VỤ."
              >
                {'NHIỆM VỤ.'.split('').map((char, index) => (
                  <span
                    key={index}
                    aria-hidden="true"
                    className="inline-block animate-slide-up"
                    style={{
                      animationDelay: `${index * 35}ms`,
                      animationFillMode: 'both',
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </h1>
              <span className="hidden sm:inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-mono font-bold text-slate-300">
                QUEST BOARD
              </span>
            </div>

            {/* Dynamic Adaptable Subtitle */}
            <p className="font-sans text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5 truncate">
              {subtitleText}
            </p>
          </div>

          {/* Magnetic Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            {/* + Thêm nhiệm vụ */}
            <MagneticButton
              type="button"
              onClick={onAddTask}
              reducedMotion={reducedMotion}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-black/40 bg-[#3DFFB0] px-3.5 py-2 text-xs sm:text-sm font-black text-black shadow-[4px_4px_0px_#000000] hover:bg-[#52ffbe] hover:shadow-[6px_6px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000000]"
              aria-label="Thêm nhiệm vụ mới"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Thêm nhiệm vụ</span>
              <kbd className="ml-1 hidden sm:inline-block rounded border border-black/30 bg-black/10 px-1 py-0.5 text-[9px] font-mono font-bold">
                N
              </kbd>
            </MagneticButton>

            {/* ✨ AI chia nhỏ việc */}
            <MagneticButton
              type="button"
              onClick={onAiBreakdown}
              reducedMotion={reducedMotion}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#7C5CFF]/60 bg-[#151528] px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-[4px_4px_0px_#000000] hover:border-[#7C5CFF] hover:shadow-[6px_6px_0px_#7C5CFF] active:translate-x-[2px] active:translate-y-[2px]"
              aria-label="AI chia nhỏ việc"
            >
              <Sparkles className="h-4 w-4 text-[#C6FF3D]" />
              <span>AI chia nhỏ việc</span>
            </MagneticButton>

            {/* ▶ Focus ngay */}
            <MagneticButton
              type="button"
              onClick={handleFocusClick}
              reducedMotion={reducedMotion}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-black/40 bg-[#FF8A3D] px-3.5 py-2 text-xs sm:text-sm font-black text-black shadow-[4px_4px_0px_#000000] hover:bg-[#ff9c5a] hover:shadow-[6px_6px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px]"
              aria-label={`Bắt đầu phiên Focus ngay${mostUrgentTask ? `: ${mostUrgentTask.title}` : ''}`}
            >
              <Play className="h-3.5 w-3.5 fill-black stroke-black" />
              <span>Focus ngay</span>
              <kbd className="ml-1 hidden sm:inline-block rounded border border-black/30 bg-black/10 px-1 py-0.5 text-[9px] font-mono font-bold">
                F
              </kbd>
            </MagneticButton>
          </div>
        </div>

        {/* Bottom Section: 4 Asymmetric Tilted Stat Stickers */}
        <div className="w-full min-w-0 pt-0.5 sm:pt-1">
          <StatStickers
            tasks={tasks}
            activeFilter={activeFilter}
            onSelectFilter={onSelectFilter}
          />
        </div>
      </div>
    </header>
  );
}
