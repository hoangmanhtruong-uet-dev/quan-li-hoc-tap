'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Plus, Flame, Clock3, CalendarDays, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCampusStore } from '@/lib/campus-store';

export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda' | 'timeline';

interface MonthPosterHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onOpenCreate: () => void;
  onOpenAiScheduler: () => void;
  onOpenIcsDialog: () => void;
  onOpenScheduleScan?: () => void;
}

export function MonthPosterHeader({
  currentDate,
  viewMode,
  onViewModeChange,
  onPrevMonth,
  onNextMonth,
  onToday,
  onOpenCreate,
  onOpenAiScheduler,
  onOpenIcsDialog,
  onOpenScheduleScan,
}: MonthPosterHeaderProps) {
  const { state } = useCampusStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format month name and year (Vietnamese)
  const monthName = useMemo(() => {
    const m = currentDate.getMonth() + 1;
    return `THÁNG ${m}`;
  }, [currentDate]);

  const yearStr = useMemo(() => {
    return currentDate.getFullYear().toString();
  }, [currentDate]);

  // Counts for stat stickers
  const monthEventsCount = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const prefix = `${y}-${m}`;
    return state.events.filter((e) => e.date.startsWith(prefix)).length;
  }, [currentDate, state.events]);

  const nearDeadlinesCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]!;
    return state.deadlines.filter((d) => !d.completed && (d.urgent || d.date === todayStr)).length;
  }, [state.deadlines]);

  // 1-Draw-Call Interactive Dot-Grid Canvas Background
  useEffect(() => {
    if (!mounted || !canvasRef.current || state.reducedMotion) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 220);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / (rect.width || 1),
        y: (e.clientY - rect.top) / (rect.height || 1),
      };
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    let t = 0;
    let animId: number;

    const render = () => {
      t += 0.02;
      ctx.clearRect(0, 0, width, height);

      const spacing = 28;
      const cols = Math.floor(width / spacing);
      const rows = Math.floor(height / spacing);

      const mouseX = mouseRef.current.x * width;
      const mouseY = mouseRef.current.y * height;

      ctx.fillStyle = '#7C5CFF';

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * spacing + spacing / 2;
          const y = r * spacing + spacing / 2;

          const dx = x - mouseX;
          const dy = y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Wave equation
          const wave = Math.sin(t * 1.5 + (x + y) * 0.015);
          const influence = Math.max(0, 1 - dist / 180);
          const radius = Math.max(1, 1.4 + wave * 0.8 + influence * 2.2);

          const alpha = 0.15 + influence * 0.45;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = influence > 0.3 ? `rgba(198, 255, 61, ${alpha})` : `rgba(124, 92, 255, ${alpha})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(animId);
    };
  }, [mounted, state.reducedMotion]);

  const viewModes: Array<{ id: CalendarViewMode; label: string }> = [
    { id: 'month', label: 'Tháng' },
    { id: 'week', label: 'Tuần' },
    { id: 'day', label: 'Ngày' },
    { id: 'agenda', label: 'Agenda' },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <header className="relative w-full min-w-0 overflow-hidden rounded-[26px] border-2 border-white/20 bg-[#10101E]/85 p-6 shadow-[8px_8px_0px_#000] backdrop-blur-md hard-border">
      {/* 1-Draw-Call Canvas Dot Grid */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-80" aria-hidden="true">
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Giant Poster Month + Flip Effect + Controls */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Prev/Next Month Arrow Buttons */}
            <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-black/40 p-1 shadow-[2px_2px_0px_#000]">
              <button
                type="button"
                onClick={onPrevMonth}
                aria-label="Tháng trước (←)"
                className="rounded-lg p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onNextMonth}
                aria-label="Tháng sau (→)"
                className="rounded-lg p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Giant Month Title with Airport Flip/Slide Feel */}
            <div className="flex items-baseline gap-3">
              <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl md:text-5xl text-foreground">
                <span className="inline-block transition-transform duration-300">
                  {monthName}
                </span>
              </h1>
              <span className="font-mono text-lg font-bold text-muted-foreground">
                {yearStr}
              </span>
            </div>

            {/* Today Button */}
            <button
              type="button"
              onClick={onToday}
              className="rounded-xl border border-white/20 bg-white/5 px-3 py-1.5 font-mono text-xs font-bold text-aurora-lime hover:bg-white/10 shadow-[2px_2px_0px_#000] transition-all"
            >
              Hôm nay (T)
            </button>
          </div>

          {/* 3 Tilted Stat Stickers */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="sticker-badge bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-[2px_2px_0px_#000]">
              <CalendarDays className="h-3.5 w-3.5 text-blue-400" />
              <span>{monthEventsCount} Sự kiện tháng</span>
            </div>

            <div className="sticker-badge bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-[2px_2px_0px_#000]">
              <Clock3 className="h-3.5 w-3.5 text-rose-400" />
              <span className="flex items-center gap-1.5">
                {nearDeadlinesCount} Deadline gấp
                {nearDeadlinesCount > 0 && (
                  <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
                )}
              </span>
            </div>

            <div className="sticker-badge bg-orange-500/15 border-orange-500/40 text-orange-400 shadow-[2px_2px_0px_#000]">
              <Flame className="h-3.5 w-3.5 fill-orange-400 text-orange-500 animate-pulse" />
              <span>Streak {state.streak} ngày</span>
            </div>
          </div>
        </div>

        {/* Right: View Mode Sliding Pill + Action CTAs */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
          {/* Segmented Sliding-Pill View Switcher */}
          <div className="inline-flex rounded-xl border-2 border-white/20 bg-black/50 p-1 shadow-[3px_3px_0px_#000]">
            {viewModes.map((v) => {
              const active = viewMode === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onViewModeChange(v.id)}
                  className={`relative rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? 'bg-aurora-lime text-black shadow-[2px_2px_0px_#000] scale-100'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* AI Schedule Scanner CTA */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenScheduleScan}
              className="h-10 rounded-xl border border-cyan-400/40 bg-cyan-500/15 font-bold text-xs text-cyan-300 hover:bg-cyan-500/25 shadow-[2px_2px_0px_#000]"
            >
              <Zap className="mr-1.5 h-3.5 w-3.5 text-cyan-400" />
              ⚡ Quét TKB bằng AI
            </Button>

            {/* AI Auto-Scheduler CTA */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAiScheduler}
              className="h-10 rounded-xl border border-violet-500/40 bg-violet-500/15 font-bold text-xs text-violet-300 hover:bg-violet-500/25 shadow-[2px_2px_0px_#000]"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-violet-400" />
              ✨ Hỏi AI xếp lịch
            </Button>

            {/* ICS Import/Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenIcsDialog}
              className="h-10 rounded-xl border border-white/20 bg-white/5 font-bold text-xs text-muted-foreground hover:text-foreground shadow-[2px_2px_0px_#000]"
            >
              .ICS
            </Button>

            {/* Add Event CTA */}
            <Button
              size="sm"
              onClick={onOpenCreate}
              className="h-10 rounded-xl bg-aurora-lime text-black font-extrabold text-xs shadow-[3px_3px_0px_#000] hover:brightness-110 active:scale-95"
            >
              <Plus className="mr-1 h-3.5 w-3.5 stroke-[3]" />
              Thêm sự kiện (N)
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
