'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useCampusStore } from '@/lib/campus-store';
import {
  Clock,
  AlertTriangle,
  Check,
  Plus,
  Flame,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ConfettiDot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

interface DeadlineArenaProps {
  onStartFocus?: (minutes?: number) => void;
}

export function DeadlineArena({ onStartFocus }: DeadlineArenaProps = {}) {
  const { state, update, recordSession } = useCampusStore();
  const [mounted, setMounted] = useState(false);
  const [floatingXp, setFloatingXp] = useState<{ id: string; x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Mounted check & 1s countdown tick
  const [, setTick] = useState(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for deadline-created event to trigger 3s neon flash highlight
  useEffect(() => {
    const handleDeadlineCreated = (e: Event) => {
      const custom = e as CustomEvent<{ deadline?: { id: string } }>;
      if (custom.detail?.deadline?.id) {
        setHighlightedId(custom.detail.deadline.id);
        setTimeout(() => setHighlightedId(null), 3000);
      }
    };
    window.addEventListener('campusos:deadline-created', handleDeadlineCreated);
    return () => window.removeEventListener('campusos:deadline-created', handleDeadlineCreated);
  }, []);

  // 2. Deadlines list sorted with incomplete first, urgent top
  const deadlines = useMemo(() => {
    return [...state.deadlines];
  }, [state.deadlines]);

  const activeDeadlines = useMemo(() => {
    return deadlines.filter((d) => !d.completed);
  }, [deadlines]);

  const heroDeadline = useMemo(() => {
    return activeDeadlines[0] || deadlines[0] || null;
  }, [activeDeadlines, deadlines]);

  const secondaryDeadlines = useMemo(() => {
    if (!heroDeadline) return [];
    return deadlines.filter((d) => d.id !== heroDeadline.id);
  }, [deadlines, heroDeadline]);

  // 3. Time calculations for countdown
  const getRemainingTime = useCallback((dueDateStr?: string) => {
    if (!dueDateStr) return { totalMs: 0, hours: 0, minutes: 0, seconds: 0, isPanic: false };
    const dueTime = new Date(dueDateStr).getTime();
    const now = Date.now();
    const diff = dueTime - now;

    if (diff <= 0) return { totalMs: 0, hours: 0, minutes: 0, seconds: 0, isPanic: true };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    const isPanic = diff < 3 * 3600 * 1000; // Under 3 hours

    return { totalMs: diff, hours, minutes, seconds, isPanic };
  }, []);

  const heroRemaining = useMemo(() => {
    return getRemainingTime(heroDeadline?.dueDate);
  }, [heroDeadline?.dueDate, getRemainingTime]);

  // Color shifting tier
  const colorTier = useMemo(() => {
    if (heroRemaining.totalMs <= 0) return 'red';
    if (heroRemaining.totalMs < 3 * 3600 * 1000) return 'red';
    if (heroRemaining.totalMs < 24 * 3600 * 1000) return 'orange';
    return 'lime';
  }, [heroRemaining.totalMs]);

  // 4. Confetti trigger on task completion
  const triggerConfetti = useCallback((originX: number, originY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#C6FF3D', '#FF3DA5', '#7C5CFF', '#3DE8FF', '#FF8A3D'];
    const dots: ConfettiDot[] = [];
    const count = 35;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      dots.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 3 + Math.random() * 4,
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
        dot.alpha = Math.max(0, 1 - elapsed / 750);

        ctx.save();
        ctx.globalAlpha = dot.alpha;
        ctx.fillStyle = dot.color;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (elapsed < 750) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    requestAnimationFrame(frame);
  }, []);

  // 5. Completion Toggle Handler
  const handleToggleDeadline = (deadlineId: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = rect.left + rect.width / 2;
    const clickY = rect.top + rect.height / 2;

    const target = deadlines.find((d) => d.id === deadlineId);
    if (!target) return;

    const nextCompleted = !target.completed;

    if (nextCompleted) {
      // Trigger confetti & floating +50 XP
      triggerConfetti(clickX, clickY);
      setFloatingXp({ id: deadlineId, x: clickX, y: clickY });
      setTimeout(() => setFloatingXp(null), 900);

      // Award XP in store
      recordSession(0, 100);
      update((prev) => ({
        xp: prev.xp + 50,
        deadlines: prev.deadlines.map((d) =>
          d.id === deadlineId ? { ...d, completed: true } : d
        ),
      }));
    } else {
      update((prev) => ({
        deadlines: prev.deadlines.map((d) =>
          d.id === deadlineId ? { ...d, completed: false } : d
        ),
      }));
    }
  };

  // 6. Reordering handler
  const moveDeadline = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= deadlines.length) return;
    const reordered = [...deadlines];
    const [moved] = reordered.splice(fromIndex, 1);
    if (!moved) return;
    reordered.splice(toIndex, 0, moved);
    update(() => ({ deadlines: reordered }));
  };

  return (
    <section className="w-full min-w-0 space-y-4" aria-label="S3 Deadline Arena">
      {/* Full-screen Confetti Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      />

      {/* Floating +XP notification */}
      {floatingXp && (
        <div
          className="pointer-events-none fixed z-50 animate-slide-up rounded-full border border-aurora-lime bg-aurora-lime px-3 py-1 font-mono text-xs font-black text-black shadow-lg"
          style={{ left: floatingXp.x - 25, top: floatingXp.y - 40 }}
        >
          +50 XP 🔥
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-xl md:text-2xl font-bold tracking-tight text-foreground">
            <Clock className="h-6 w-6 text-rose-400" />
            Deadline Arena (Khẩn cấp)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-sans">
            Bento bất đối xứng · Đồng hồ đếm ngược số khổng lồ · Tick xong nhận +50 XP
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => window.dispatchEvent(new CustomEvent('campusos:quick-create-task'))}
          className="h-9 gap-1.5 rounded-xl border border-white/15 bg-white/5 text-xs font-bold text-foreground hover:bg-white/10 shadow-[2px_2px_0px_#000]"
        >
          <Plus className="h-3.5 w-3.5" /> Thêm deadline
        </Button>
      </div>

      {/* Asymmetric Bento Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {/* HERO BENTO CELL: Most urgent deadline */}
        {heroDeadline && (
          <div
            className={`relative md:col-span-2 rounded-[24px] p-6 md:p-8 flex flex-col justify-between transition-all duration-200 hard-border ${
              highlightedId === heroDeadline.id
                ? 'ring-4 ring-aurora-lime shadow-[0_0_35px_#C6FF3D] animate-pulse '
                : ''
            }${
              colorTier === 'red'
                ? 'border-2 border-rose-500 bg-rose-950/20 shadow-[6px_6px_0px_0px_#FF3D6E]'
                : colorTier === 'orange'
                ? 'border-2 border-orange-400/80 bg-orange-950/20 shadow-[6px_6px_0px_0px_#FF8A3D]'
                : 'border-2 border-aurora-lime/70 bg-lime-950/20 shadow-[6px_6px_0px_0px_#C6FF3D]'
            } ${
              heroRemaining.isPanic && !heroDeadline.completed && !state.reducedMotion
                ? 'animate-panic-shake'
                : ''
            }`}
          >
            {/* Top Bar: Course & Panic Mode Indicator */}
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                {heroDeadline.course || 'CS301 - Mạng máy tính'}
              </span>

              {heroRemaining.isPanic && !heroDeadline.completed ? (
                <Badge className="bg-rose-500/20 text-rose-300 border-rose-500 font-bold animate-pulse">
                  <AlertTriangle className="mr-1 h-3.5 w-3.5 text-rose-400" />
                  BÁO ĐỘNG ĐỎ &lt; 3H!
                </Badge>
              ) : (
                <Badge
                  className={
                    colorTier === 'orange'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-400'
                      : 'bg-aurora-lime/20 text-aurora-lime border-aurora-lime'
                  }
                >
                  {heroDeadline.displayDate || 'Hôm nay · 23:59'}
                </Badge>
              )}
            </div>

            {/* Middle: Title & Giant Live Countdown */}
            <div className="my-6 space-y-3">
              <h3
                className={`font-heading text-2xl md:text-3xl font-extrabold text-foreground ${
                  heroDeadline.completed ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {heroDeadline.title}
              </h3>

              {/* Giant Live HH:MM:SS Countdown */}
              {!heroDeadline.completed ? (
                <div className="flex items-baseline gap-2 font-mono tabular-nums font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight">
                  <span
                    className={
                      colorTier === 'red'
                        ? 'text-rose-400'
                        : colorTier === 'orange'
                        ? 'text-orange-400'
                        : 'text-aurora-lime'
                    }
                  >
                    {String(heroRemaining.hours).padStart(2, '0')}:
                    {String(heroRemaining.minutes).padStart(2, '0')}:
                    {String(heroRemaining.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-xs uppercase font-sans text-muted-foreground tracking-widest">
                    còn lại
                  </span>
                </div>
              ) : (
                <div className="font-heading text-2xl font-bold text-emerald-400 flex items-center gap-2">
                  <Check className="h-6 w-6" /> Đã hoàn thành xuất sắc!
                </div>
              )}
            </div>

            {/* Bottom Bar: Completion Circle Button & XP Callout */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleToggleDeadline(heroDeadline.id, e)}
                  type="button"
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 font-bold transition-all shadow-[2px_2px_0px_#000] ${
                    heroDeadline.completed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-foreground text-background hover:scale-105 active:scale-95'
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      heroDeadline.completed ? 'border-emerald-400 bg-emerald-400 text-black' : 'border-background'
                    }`}
                  >
                    {heroDeadline.completed && <Check className="h-4 w-4" />}
                  </div>
                  <span>{heroDeadline.completed ? 'Đã xong (+50 XP)' : 'Tick hoàn thành'}</span>
                </button>

                {onStartFocus && !heroDeadline.completed && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStartFocus(45)}
                    className="h-10 border-white/20 bg-white/5 font-semibold text-xs hover:border-aurora-lime"
                  >
                    Chiến ngay (45p)
                  </Button>
                )}
              </div>

              <span className="text-xs font-semibold text-muted-foreground">
                Thưởng: <strong className="text-aurora-lime font-mono">+50 XP</strong>
              </span>
            </div>
          </div>
        )}

        {/* SECONDARY BENTO CELLS: Remaining deadlines */}
        {secondaryDeadlines.map((item, index) => {
          const itemRemaining = getRemainingTime(item.dueDate);
          const isDone = item.completed;

          return (
            <div
              key={item.id}
              className={`rounded-[20px] border-2 border-white/15 bg-[#121222] p-5 shadow-[4px_4px_0px_#000] flex flex-col justify-between transition-all hard-border ${
                highlightedId === item.id
                  ? 'ring-4 ring-aurora-lime shadow-[0_0_25px_#C6FF3D] animate-pulse '
                  : ''
              }${
                isDone ? 'opacity-60 bg-[#0E0E18]' : 'hover:translate-x-0.5 hover:-translate-y-0.5'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[120px]">
                    {item.course || 'Môn học'}
                  </span>
                  <Badge variant={item.urgent ? 'destructive' : 'secondary'} className="text-[10px]">
                    {item.displayDate || 'Sắp tới'}
                  </Badge>
                </div>

                <h4
                  className={`font-heading text-base font-bold text-foreground leading-snug line-clamp-2 ${
                    isDone ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {item.title}
                </h4>

                {!isDone && (
                  <p className="mt-2 font-mono text-xs font-semibold text-orange-400">
                    Còn {itemRemaining.hours}h {itemRemaining.minutes}m
                  </p>
                )}
              </div>

              {/* Action: SVG Checkmark Draw Circle & Reorder Controls */}
              <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between">
                <button
                  onClick={(e) => handleToggleDeadline(item.id, e)}
                  type="button"
                  aria-label={`Hoàn thành ${item.title}`}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform active:scale-90 ${
                    isDone
                      ? 'border-emerald-400 bg-emerald-400 text-black'
                      : 'border-muted-foreground/40 hover:border-aurora-lime'
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    <path
                      d="M5 13l4 4L19 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="24"
                      strokeDashoffset={isDone ? 0 : 24}
                      className="transition-all duration-300 ease-out"
                    />
                  </svg>
                </button>

                {/* Reorder Up/Down */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveDeadline(index + 1, index)}
                    title="Đẩy lên trước"
                    className="p-1 text-muted-foreground hover:text-foreground text-xs"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveDeadline(index + 1, index + 2)}
                    title="Đẩy xuống sau"
                    className="p-1 text-muted-foreground hover:text-foreground text-xs"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
