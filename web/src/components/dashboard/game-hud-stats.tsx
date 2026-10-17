'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Target, Flame, AlertTriangle, ArrowUpRight, TrendingDown, Zap } from 'lucide-react';
import { useCampusStore } from '@/lib/campus-store';
import { calculateLevelProgress, LEVELS_TABLE } from '@/lib/gamification';

interface GameHudStatsProps {
  className?: string;
  onOpenStudyModal?: () => void;
}

export function GameHudStats({ className = '', onOpenStudyModal }: GameHudStatsProps) {
  const { state } = useCampusStore();

  // Weekly Goal Ring Metrics
  const weeklyGoalMin = state.weeklyStudyGoalMinutes || 720; // 12h
  const weeklyCurrentMin = state.weeklyStudyMinutesCurrent || 510; // 8.5h
  const targetPercent = Math.min(100, Math.round((weeklyCurrentMin / weeklyGoalMin) * 100));
  const currentHours = weeklyCurrentMin / 60;
  const goalHours = weeklyGoalMin / 60;

  // Count-up animated numbers
  const [animatedPercent, setAnimatedPercent] = useState<number>(state.reducedMotion ? targetPercent : 0);
  const [animatedHours, setAnimatedHours] = useState<number>(state.reducedMotion ? currentHours : 0);

  useEffect(() => {
    if (state.reducedMotion) {
      setAnimatedPercent(targetPercent);
      setAnimatedHours(currentHours);
      return;
    }

    const duration = 1200;
    const startTime = performance.now();

    const animateLoop = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic: 1 - pow(1 - progress, 3)
      const ease = 1 - Math.pow(1 - progress, 3);

      setAnimatedPercent(Math.round(ease * targetPercent));
      setAnimatedHours(Number((ease * currentHours).toFixed(1)));

      if (progress < 1) {
        requestAnimationFrame(animateLoop);
      }
    };

    const handle = requestAnimationFrame(animateLoop);
    return () => cancelAnimationFrame(handle);
  }, [targetPercent, currentHours, state.reducedMotion]);

  // SVG Radial Math
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.292
  const strokeDashoffset = circumference * (1 - animatedPercent / 100);

  // Gamification Metrics
  const levelInfo = useMemo(() => {
    return calculateLevelProgress(state.xp || 2840);
  }, [state.xp]);

  // 12-Week Heatmap Matrix Generation (84 days)
  const heatmapCells = useMemo(() => {
    const cells = [];
    const seedHourPattern = [
      0, 2.5, 3.0, 1.5, 4.0, 0, 5.0, 1.0, 2.0, 3.5, 0, 4.5,
      2.0, 1.5, 0, 3.0, 4.0, 2.5, 0, 3.5, 4.5, 5.5, 2.0, 1.0,
      0, 2.5, 3.0, 4.0, 1.5, 0, 3.5, 2.0, 4.5, 0, 3.0, 5.0,
      1.5, 2.5, 0, 4.0, 3.5, 1.0, 2.0, 3.0, 0, 4.5, 5.0, 2.5,
      3.0, 1.5, 0, 2.0, 4.0, 3.5, 0, 5.0, 4.5, 3.0, 1.5, 2.0,
      0, 3.5, 4.0, 2.5, 1.0, 0, 3.0, 4.5, 5.0, 2.0, 0, 3.5,
      4.0, 1.5, 2.5, 3.0, 0, 4.5, 3.5, 2.0, 5.0, 1.5, 0, 3.5,
    ];

    for (let i = 0; i < 84; i++) {
      const hours = seedHourPattern[i % seedHourPattern.length]!;
      const isToday = i === 83; // Last cell is Today
      cells.push({
        dayIndex: i,
        hours: isToday ? 3.5 : hours,
        isToday,
      });
    }
    return cells;
  }, []);
  const todayDayName = useMemo(() => {
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return dayNames[new Date().getDay()];
  }, []);

  const completedTasksCount = useMemo(() => {
    return state.tasks.filter((t) => t.status === 'done').length;
  }, [state.tasks]);

  const [hoveredCell, setHoveredCell] = useState<{ dayIndex: number; hours: number } | null>(null);

  // Animated Sparkline SVG Grade Points for "Môn cần chú ý"
  // Grade: W1: 8.2 -> W2: 7.8 -> W3: 7.5 -> W4: 6.8 -> W5: 6.2 -> W6: 6.0
  const sparklineGrades = useMemo(() => [8.2, 7.8, 7.5, 6.8, 6.2, 6.0], []);
  const sparklinePoints = useMemo(() => {
    // Width 240, Height 70. Grade range 4.0 -> 10.0
    return sparklineGrades.map((g, idx) => {
      const x = 15 + idx * 42;
      const y = 65 - ((g - 4.0) / 6.0) * 55;
      return { x, y, grade: g };
    });
  }, [sparklineGrades]);

  const sparklineSvgPath = useMemo(() => {
    return sparklinePoints.reduce((acc, pt, idx) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      return `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  }, [sparklinePoints]);

  return (
    <div className={`space-y-5 w-full min-w-0 ${className}`} aria-label="S5 Game HUD Stats">
      {/* Top HUD Row: Goal Ring & XP Bar */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] w-full min-w-0">
        {/* Module A: Weekly Study Goal Ring */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3">
            <h3 className="flex items-center gap-2 font-bold text-base text-foreground font-heading">
              <Target className="h-5 w-5 text-aurora-lime" />
              Mục tiêu tuần
            </h3>
            <span className="sticker-badge bg-aurora-lime/15 text-aurora-lime border-aurora-lime/30 text-[10px]">
              {animatedPercent}% ĐẠT
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
            {/* SVG Circular Radial Progress Ring */}
            <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 130 130">
                <defs>
                  <linearGradient id="goalRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C6FF3D" />
                    <stop offset="60%" stopColor="#3DE8FF" />
                    <stop offset="100%" stopColor="#7C5CFF" />
                  </linearGradient>
                </defs>

                {/* Track circle */}
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="11"
                  fill="none"
                />

                {/* Progress circle with Liquid Gradient */}
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke="url(#goalRingGradient)"
                  strokeWidth="11"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-[stroke-dashoffset] duration-700 ease-out"
                />
              </svg>

              {/* Center Counter */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="font-mono text-2xl font-extrabold text-aurora-lime leading-none">
                  {animatedHours.toFixed(1)}
                </span>
                <span className="font-mono text-xs text-muted-foreground mt-0.5">
                  / {goalHours} giờ
                </span>
              </div>
            </div>

            {/* Goal Ring Details */}
            <div className="space-y-3 flex-1 text-center sm:text-left font-sans">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Còn {(Math.max(0, goalHours - currentHours)).toFixed(1)} giờ để cán đích
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Đã hoàn thành {animatedPercent}% khối lượng học tập kỳ này.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <span className="text-[10px] text-muted-foreground block">Đã học tuần này</span>
                  <span className="font-mono font-bold text-violet-300">{currentHours.toFixed(1)} giờ</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <span className="text-[10px] text-muted-foreground block">Nhiệm vụ xong</span>
                  <span className="font-mono font-bold text-aurora-lime">{completedTasksCount} tasks</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Module B: XP Bar & Level Progression HUD */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 shadow-sm backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="sticker-badge bg-aurora-violet/20 text-violet-300 border-aurora-violet/40 text-xs font-bold">
                  LEVEL {String(levelInfo.currentLevel).padStart(2, '0')}
                </div>
                <span className="font-sans font-extrabold text-base text-foreground tracking-tight">
                  &quot;{levelInfo.rankTitle}&quot;
                </span>
              </div>
              <span className="font-mono text-xs text-aurora-lime font-bold">
                {levelInfo.totalXp.toLocaleString()} XP
              </span>
            </div>

            {/* Level XP Progress Bar */}
            <div className="mt-4 space-y-1.5 font-sans">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tiến độ cấp độ {levelInfo.currentLevel}</span>
                <span className="font-mono">
                  {levelInfo.xpInCurrentLevel} / {levelInfo.xpRequiredForLevel} XP ({levelInfo.progressPercent}%)
                </span>
              </div>
              <div className="relative h-4 w-full overflow-hidden rounded-full border-2 border-white/15 bg-slate-900 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-aurora-violet via-aurora-pink to-aurora-lime transition-all duration-700 ease-out shadow-sm"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground pt-0.5">
                ⚡ Cần thêm <span className="font-mono font-bold text-violet-300">{levelInfo.xpToNextLevel} XP</span> để lên Level {levelInfo.currentLevel + 1}: &quot;{LEVELS_TABLE.find(l => l.level === levelInfo.currentLevel + 1)?.rankTitle || 'Bậc thầy'}&quot;
              </p>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="mt-4 pt-4 border-t border-white/10 font-sans">
            <span className="text-xs font-semibold text-muted-foreground block mb-2">Huy hiệu mở khóa:</span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { title: 'Tân sinh viên', icon: '🐣', level: 'Lvl 1', unlocked: true },
                { title: 'Cú đêm', icon: '🦉', level: 'Lvl 2', unlocked: true },
                { title: 'Dũng sĩ trốn', icon: '🥷', level: 'Lvl 3', unlocked: true },
                { title: 'Cày thuê', icon: '💻', level: 'Lvl 7', current: true, unlocked: true },
              ].map((badge, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-transform hover:scale-105 ${
                    badge.current
                      ? 'border-aurora-lime bg-aurora-lime/10 shadow-[0_0_12px_rgba(198,255,61,0.25)]'
                      : badge.unlocked
                      ? 'border-white/10 bg-white/5'
                      : 'border-white/5 bg-white/[0.02] opacity-40'
                  }`}
                >
                  <span className="text-xl mb-0.5">{badge.icon}</span>
                  <span className="text-[10px] font-bold truncate max-w-full text-foreground">{badge.title}</span>
                  <span className="text-[9px] font-mono text-muted-foreground">{badge.level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom HUD Row: 12-Week Streak Heatmap & Warning Card */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Module C: 12-Week GitHub-style Study Streak Heatmap */}
        <div className="rounded-2xl border border-white/10 bg-card/60 p-6 shadow-sm backdrop-blur-xl font-sans">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
            <div>
              <h3 className="flex items-center gap-2 font-bold text-base text-foreground font-heading">
                <Flame className="h-5 w-5 text-aurora-orange" />
                Chuỗi học tập 12 tuần (Heatmap)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                84 ngày gần nhất · Duy trì chuỗi để nhận thưởng x2 XP.
              </p>
            </div>
            {hoveredCell ? (
              <span className="font-mono text-xs rounded-md bg-aurora-violet/20 border border-aurora-violet/40 px-2 py-1 text-violet-200">
                Ngày {hoveredCell.dayIndex + 1}: {hoveredCell.hours} giờ học
              </span>
            ) : (
              <span className="font-mono text-xs text-muted-foreground">
                Hover để xem chi tiết
              </span>
            )}
          </div>

          {/* 12-Week Heatmap Grid (7 rows x 12 cols) */}
          <div className="overflow-x-auto py-2">
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-max">
              {heatmapCells.map((cell) => {
                // Tier colors
                let bgClass = 'bg-[#181828] border-white/5';
                if (cell.hours >= 4.5) bgClass = 'bg-[#C6FF3D] border-[#C6FF3D] shadow-[0_0_8px_rgba(198,255,61,0.4)]';
                else if (cell.hours >= 3.0) bgClass = 'bg-[#7C5CFF] border-[#7C5CFF]';
                else if (cell.hours >= 1.5) bgClass = 'bg-[#563EB0] border-[#563EB0]';
                else if (cell.hours > 0) bgClass = 'bg-[#2E2A52] border-[#2E2A52]';

                return (
                  <button
                    key={cell.dayIndex}
                    onMouseEnter={() => setHoveredCell({ dayIndex: cell.dayIndex, hours: cell.hours })}
                    onMouseLeave={() => setHoveredCell(null)}
                    aria-label={`Ngày ${cell.dayIndex + 1}: ${cell.hours} giờ học`}
                    className={`h-3.5 w-3.5 rounded-sm border transition-transform hover:scale-125 focus:outline-none ${bgClass} ${
                      cell.isToday ? 'ring-2 ring-aurora-cyan ring-offset-1 ring-offset-[#0A0A12]' : ''
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center justify-between pt-3 text-[11px] text-muted-foreground border-t border-white/10 mt-2 font-mono">
            <span className="flex items-center gap-1.5 font-sans">
              <span className="h-2 w-2 rounded-full bg-aurora-cyan" /> Hôm nay ({todayDayName})
            </span>
            <div className="flex items-center gap-1.5 font-sans">
              <span>Ít</span>
              <span className="h-2.5 w-2.5 rounded-sm bg-[#181828] border border-white/10" />
              <span className="h-2.5 w-2.5 rounded-sm bg-[#2E2A52]" />
              <span className="h-2.5 w-2.5 rounded-sm bg-[#563EB0]" />
              <span className="h-2.5 w-2.5 rounded-sm bg-[#7C5CFF]" />
              <span className="h-2.5 w-2.5 rounded-sm bg-[#C6FF3D]" />
              <span>Nhiều</span>
            </div>
          </div>
        </div>

        {/* Module D: Warning Bento Card "Môn cần chú ý" */}
        <div className="relative rounded-2xl bg-amber-950/15 border border-amber-500/30 p-5 backdrop-blur-xl shadow-sm">
          {/* Header Warning Sticker */}
          <div className="flex items-center justify-between pb-2">
            <span className="sticker-badge bg-aurora-orange text-black border-aurora-orange text-[10px] font-black tracking-wider">
              <AlertTriangle className="h-3 w-3 stroke-[3]" />
              MÔN CẦN CHÚ Ý
            </span>
            <span className="text-[11px] font-bold text-aurora-orange flex items-center gap-1 font-mono">
              <TrendingDown className="h-3.5 w-3.5" /> -1.8 điểm
            </span>
          </div>

          <div>
            <h4 className="font-extrabold text-base text-foreground tracking-tight font-heading">
              Xác suất Thống kê (MAT202)
            </h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-sans">
              Điểm chuyên cần (6.2/10) và quiz Tuần 4 rơi xuống ngưỡng cảnh báo. Đang kéo tụt GPA kỳ này.
            </p>
          </div>

          {/* Animated SVG Grade Trend Sparkline */}
          <div className="py-3">
            <div className="relative h-20 w-full">
              <svg viewBox="0 0 240 85" className="h-full w-full overflow-visible">
                <defs>
                  <linearGradient id="sparklineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFB020" />
                    <stop offset="70%" stopColor="#FF8A3D" />
                    <stop offset="100%" stopColor="#FF3D6E" />
                  </linearGradient>
                </defs>

                {/* Target B Grade dashed line (7.0) */}
                <line
                  x1="10"
                  y1="34"
                  x2="230"
                  y2="34"
                  stroke="rgba(255,255,255,0.2)"
                  strokeDasharray="4,4"
                  strokeWidth="1.5"
                />
                <text x="165" y="24" fill="#94A3B8" fontSize="9" fontFamily="monospace">
                  Mục tiêu B (7.0)
                </text>

                {/* Grade trajectory polyline */}
                <path
                  d={sparklineSvgPath}
                  fill="none"
                  stroke="url(#sparklineGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Milestone grade dots */}
                {sparklinePoints.map((pt, i) => (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={i === sparklinePoints.length - 1 ? 5 : 3.5}
                      fill={i === sparklinePoints.length - 1 ? '#FF3D6E' : '#FFB020'}
                      stroke="#0A0A12"
                      strokeWidth="2"
                    />
                    {i === sparklinePoints.length - 1 && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="8"
                        fill="none"
                        stroke="#FF3D6E"
                        strokeWidth="1.5"
                        className="animate-ping opacity-75"
                      />
                    )}
                  </g>
                ))}
              </svg>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground pt-1">
              <span>Tuần 1: 8.2</span>
              <span>Tuần 3: 7.5</span>
              <span className="text-[#FF3D6E] font-bold">Tuần 6: 6.0 (Nguy cơ)</span>
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex items-center gap-2 pt-1 font-sans">
            <Link
              href="/calendar"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-aurora-orange hover:bg-orange-600 text-black font-bold px-3 py-2 text-xs transition-transform active:scale-95 shadow-md hard-border"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              Luyện đề bù ngay
            </Link>
            <Link
              href="/study/grades"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors"
            >
              Chi tiết <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
