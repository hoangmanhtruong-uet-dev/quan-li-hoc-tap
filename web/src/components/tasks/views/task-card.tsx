'use client';

import React, { useRef, useState, useCallback, useMemo } from 'react';
import type { TaskItem } from '@/types/tasks';
import { getUrgencyLevel } from '@/lib/tasks-engine';
import {
  Clock,
  Play,
  CalendarPlus,
  Edit3,
  Check,
  CheckSquare,
  Square,
  Flame,
  Star,
  Layers,
} from 'lucide-react';

export interface TaskCardProps {
  task: TaskItem;
  isSelected?: boolean;
  isMultiSelected?: boolean;
  onSelect?: (taskId: string) => void;
  onToggleMultiSelect?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  onFocus?: (task: TaskItem) => void;
  onReschedule?: (taskId: string, daysToAdd: number) => void;
  onDelete?: (taskId: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, task: TaskItem) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  reducedMotion?: boolean;
  className?: string;
}

export function TaskCard({
  task,
  isSelected = false,
  isMultiSelected = false,
  onSelect,
  onToggleMultiSelect,
  onComplete,
  onFocus,
  onReschedule,
  draggable = true,
  onDragStart,
  onDragEnd,
  reducedMotion = false,
  className = '',
}: TaskCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [xpAnimation, setXpAnimation] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // 1. Calculate live urgency metrics
  const urgency = useMemo(() => {
    return getUrgencyLevel(task.dueAt);
  }, [task.dueAt]);

  const isDone = task.status === 'done';

  // 2. Confetti Particle Burst
  const triggerConfetti = useCallback((originX: number, originY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 160;
    canvas.height = 160;

    const colors = ['#C6FF3D', '#FF3DA5', '#7C5CFF', '#3DE8FF', '#FF8A3D', '#3DFFB0'];
    const dots: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
    }> = [];

    const count = 28;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4.5;
      dots.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 2.5 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        alpha: 1,
      });
    }

    const startTime = performance.now();
    const frame = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dots.forEach((dot) => {
        dot.x += dot.vx;
        dot.y += dot.vy;
        dot.vy += 0.15; // Gravity
        dot.alpha = Math.max(0, 1 - elapsed / 700);

        ctx.save();
        ctx.globalAlpha = dot.alpha;
        ctx.fillStyle = dot.color;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (elapsed < 700) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    requestAnimationFrame(frame);
  }, [reducedMotion]);

  // 3. Audio Chime
  const playAudioChime = useCallback(() => {
    if (typeof window !== 'undefined' && !reducedMotion) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5
          gain.gain.setValueAtTime(0.09, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.22);
        }
      } catch {}
    }
  }, [reducedMotion]);

  // 4. Handle Completion Click
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDone || isChecking) return;

    setIsChecking(true);
    setXpAnimation('+20 XP');
    triggerConfetti(24, 24);
    playAudioChime();

    setTimeout(() => {
      onComplete?.(task.id);
      setIsChecking(false);
      setTimeout(() => setXpAnimation(null), 1200);
    }, 400);
  };

  // 5. Card Hover Tilt (±0.8°)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const tiltX = -y * 1.6; // max ~0.8 deg
    const tiltY = x * 1.6;
    cardRef.current.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-2px)`;
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    }
  };

  // Subtask progress
  const totalSteps = task.steps?.length || 0;
  const doneSteps = task.steps?.filter((s) => s.done).length || 0;
  const stepRatio = totalSteps > 0 ? `${doneSteps}/${totalSteps} bước` : null;

  // Status border styles
  const statusBorderClass = useMemo(() => {
    if (isDone) {
      return 'border-[#3DFFB0]/40 bg-[#121B18]/70 hover:border-[#3DFFB0]';
    }
    if (task.status === 'doing') {
      return 'border-[#8B6CFF]/60 bg-[#151226]/80 hover:border-[#8B6CFF] shadow-[0_0_15px_rgba(139,108,255,0.18)]';
    }
    return 'border-[#7A8AA8]/30 bg-[#11111E]/80 hover:border-[#7A8AA8]/70';
  }, [task.status, isDone]);

  return (
    <div
      ref={cardRef}
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onSelect?.(task.id)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex flex-col justify-between rounded-[20px] p-4 transition-all duration-200 cursor-pointer select-none border-2 shadow-[4px_4px_0px_#000] w-full min-w-0 max-w-full overflow-hidden ${statusBorderClass} ${
        isSelected ? 'ring-2 ring-aurora-lime border-aurora-lime' : ''
      } ${isMultiSelected ? 'bg-white/10 ring-2 ring-aurora-cyan' : ''} ${className}`}
    >
      {/* Particle Canvas Overlay for mini confetti burst */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute -top-4 -left-4 z-30 w-40 h-40"
      />

      {/* Floating XP Badge */}
      {xpAnimation && (
        <div
          className="absolute top-2 left-10 z-40 px-2 py-0.5 rounded-full bg-aurora-lime text-black font-black text-xs shadow-[2px_2px_0px_#000] animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300"
          style={{ animationDuration: '600ms' }}
        >
          {xpAnimation}
        </div>
      )}

      {/* Top Header Row: Multi-select, Status/Checkmark, Course Chip, Priority Badge */}
      <div className="flex items-start justify-between gap-2.5 w-full min-w-0">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {/* Multi-select Square Checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMultiSelect?.(task.id);
            }}
            className="mt-0.5 text-white/40 hover:text-white transition-colors"
            title={isMultiSelected ? 'Bỏ chọn' : 'Chọn thao tác hàng loạt'}
          >
            {isMultiSelected ? (
              <CheckSquare className="w-4 h-4 text-aurora-cyan" />
            ) : (
              <Square className="w-4 h-4 opacity-60 group-hover:opacity-100" />
            )}
          </button>

          {/* Large Animated Checkbox */}
          <button
            type="button"
            onClick={handleCheckboxClick}
            disabled={isDone}
            aria-label={isDone ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
            className={`relative flex items-center justify-center w-6 h-6 rounded-lg border-2 transition-all duration-200 shrink-0 ${
              isDone || isChecking
                ? 'bg-[#3DFFB0] border-[#3DFFB0] text-black shadow-[0_0_10px_rgba(61,255,176,0.5)]'
                : 'border-white/30 hover:border-aurora-lime hover:bg-aurora-lime/10'
            }`}
          >
            {(isDone || isChecking) && (
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 stroke-black stroke-[3.5] fill-none"
              >
                <path
                  d="M4 12l5 5L20 6"
                  strokeDasharray="24"
                  strokeDashoffset={isChecking ? '0' : '0'}
                  className="transition-all duration-300"
                />
              </svg>
            )}
          </button>

          {/* Title & Description */}
          <div className="flex-1 min-w-0">
            <h4
              className={`font-heading font-bold text-sm sm:text-base leading-snug break-words transition-all duration-200 ${
                isDone
                  ? 'line-through text-white/40'
                  : 'text-white group-hover:text-aurora-lime'
              }`}
            >
              {task.title}
            </h4>

            {task.description && (
              <p
                className={`text-xs mt-1 line-clamp-2 break-words leading-relaxed ${
                  isDone ? 'text-white/30' : 'text-white/60'
                }`}
              >
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Priority Badge */}
        <div className="shrink-0">
          {task.priority === 'high' && (
            <span className="flex items-center gap-1 rounded-md bg-[#FF3D6E]/15 border border-[#FF3D6E]/50 px-2 py-0.5 text-[10px] font-black tracking-wider text-[#FF3D6E] shadow-[1px_1px_0px_#000]">
              <Flame className="w-2.5 h-2.5 animate-pulse" />
              CAO
            </span>
          )}
          {task.priority === 'medium' && (
            <span className="rounded-md bg-[#FFB020]/15 border border-[#FFB020]/50 px-2 py-0.5 text-[10px] font-black tracking-wider text-[#FFB020] shadow-[1px_1px_0px_#000]">
              VỪA
            </span>
          )}
          {task.priority === 'low' && (
            <span className="rounded-md bg-[#3DE8FF]/15 border border-[#3DE8FF]/50 px-2 py-0.5 text-[10px] font-black tracking-wider text-[#3DE8FF] shadow-[1px_1px_0px_#000]">
              THẤP
            </span>
          )}
        </div>
      </div>

      {/* Middle Meta Row: Course Chip, Subtask Segments, Tags */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-white/5 text-xs">
        {/* Course Chip */}
        {task.course && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/80 truncate max-w-[170px]">
            <span className="w-1.5 h-1.5 rounded-full bg-aurora-violet shrink-0" />
            <span className="truncate">{task.course}</span>
          </span>
        )}

        {/* Subtask Progress Segment Bar */}
        {totalSteps > 0 && (
          <div
            className="flex items-center gap-1.5 bg-white/5 rounded-full px-2 py-0.5 border border-white/10"
            title={`${doneSteps}/${totalSteps} bước đã hoàn thành`}
          >
            <Layers className="w-3 h-3 text-white/50" />
            <span className="text-[11px] font-mono text-white/70">
              {stepRatio}
            </span>
            <div className="flex items-center gap-0.5 ml-0.5">
              {task.steps.map((st, i) => (
                <div
                  key={st.id || i}
                  className={`w-1.5 h-2 rounded-[1px] transition-colors ${
                    st.done ? 'bg-[#3DFFB0]' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Stars */}
        {task.difficulty && task.difficulty > 0 && (
          <div
            className="flex items-center gap-0.5 text-aurora-orange"
            title={`Độ khó: ${task.difficulty}/5 sao`}
          >
            <Star className="w-3 h-3 fill-current" />
            <span className="text-[10px] font-mono font-bold">
              x{task.difficulty}
            </span>
          </div>
        )}

        {/* Pomodoros */}
        {task.pomodoros && task.pomodoros.planned > 0 && (
          <span className="text-[11px] font-mono text-white/60">
            🍅 {task.pomodoros.done}/{task.pomodoros.planned}
          </span>
        )}
      </div>

      {/* Bottom Footer Row: Countdown / Overdue Indicator & Quick Action Hover Buttons */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-white/5 w-full min-w-0">
        {/* Urgency / Countdown Tag */}
        <div className="min-w-0">
          {isDone ? (
            <span className="flex items-center gap-1 text-[11px] font-mono font-semibold text-[#3DFFB0]">
              <Check className="w-3 h-3" />
              Đã xử đẹp 🎉
            </span>
          ) : urgency.isOverdue ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#FF3D6E]/15 border border-[#FF3D6E] px-2 py-0.5 text-[11px] font-mono font-bold text-[#FF3D6E] shadow-[1.5px_1.5px_0px_#000]">
              <span className="text-xs">🫠</span>
              <span>{urgency.displayCountdown}</span>
            </span>
          ) : urgency.isPanic ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#FF3D6E]/15 border border-[#FF3D6E] px-2 py-0.5 text-[11px] font-mono font-bold text-[#FF3D6E] animate-panic-shake shadow-[1.5px_1.5px_0px_#000]">
              <Clock className="w-3 h-3 animate-pulse" />
              <span>{urgency.displayCountdown}</span>
            </span>
          ) : urgency.color === 'orange' ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#FFB020]/15 border border-[#FFB020]/40 px-2 py-0.5 text-[11px] font-mono font-bold text-[#FFB020]">
              <Clock className="w-3 h-3" />
              <span>{urgency.displayCountdown}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#3DFFB0]">
              <Clock className="w-3 h-3" />
              <span>{urgency.displayCountdown}</span>
            </span>
          )}
        </div>

        {/* Hover Quick Action Buttons */}
        <div
          className={`flex items-center gap-1 transition-opacity duration-150 ${
            isHovered ? 'opacity-100' : 'opacity-80 sm:opacity-0 group-hover:opacity-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Focus Button */}
          {!isDone && (
            <button
              type="button"
              onClick={() => onFocus?.(task)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-aurora-lime/15 hover:bg-aurora-lime/25 text-aurora-lime border border-aurora-lime/40 text-[11px] font-bold transition-all active:scale-95"
              title="Vào phiên Focus ngay"
            >
              <Play className="w-3 h-3 fill-current" />
              <span className="hidden sm:inline">Focus</span>
            </button>
          )}

          {/* Quick Reschedule +1d */}
          {!isDone && (
            <button
              type="button"
              onClick={() => onReschedule?.(task.id, 1)}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-[11px] transition-all"
              title="Dời hạn sang ngày mai (+1d)"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Edit */}
          <button
            type="button"
            onClick={() => onSelect?.(task.id)}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-[11px] transition-all"
            title="Mở chi tiết nhiệm vụ"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
