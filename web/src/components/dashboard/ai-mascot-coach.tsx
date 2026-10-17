'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  Clock,
  BookOpen,
  Zap,
  CheckCircle2,
  Moon,
  Timer,
} from 'lucide-react';
import { useCampusStore, type CalendarEvent, type DailyMood, formatIsoDateOnly } from '@/lib/campus-store';

interface StudyPlanOption {
  id: string;
  chipLabel: string;
  title: string;
  durationMinutes: number;
  start: string;
  end: string;
  methodTag: string;
  description: string;
  rationale: string;
}

const PLAN_OPTIONS: StudyPlanOption[] = [
  {
    id: 'default',
    chipLabel: 'Mặc định (45p)',
    title: 'Ôn tập Subnetting & Định tuyến',
    durationMinutes: 45,
    start: '11:45',
    end: '12:30',
    methodTag: 'Lý thuyết & Bài tập mẫu',
    description: 'Dành 45 phút ôn Subnetting & Định tuyến trước buổi thực hành Lab 304 chiều nay.',
    rationale: 'Dựa trên điểm quiz gần nhất: 6.5/10 và buổi thực hành lúc 14:00.',
  },
  {
    id: 'evening',
    chipLabel: 'Dời xuống tối',
    title: 'Cày đêm Subnetting & Packet Tracer',
    durationMinutes: 45,
    start: '20:00',
    end: '20:45',
    methodTag: 'Thực hành mô phỏng',
    description: 'Đã dời sang 20:00 tối nay. Sau giờ cơm tối đầu óc tỉnh táo nhất để cấu hình router!',
    rationale: 'Phù hợp khi chiều nay bận lịch đột xuất hoặc cần nghỉ trưa sâu.',
  },
  {
    id: 'short',
    chipLabel: 'Ngắn hơn 25p',
    title: 'Pomodoro Tốc biến Subnetting',
    durationMinutes: 25,
    start: '12:00',
    end: '12:25',
    methodTag: 'Pomodoro Sprint',
    description: 'Chốt 25 phút Pomodoro tốc biến! Tập trung cao độ 100%, không lướt TikTok, xử lý 5 dạng bài chia IP.',
    rationale: 'Rút ngắn thời gian, tối ưu hóa sự tập trung trước giờ ăn trưa.',
  },
  {
    id: 'flashcard',
    chipLabel: 'Ôn kiểu flashcard',
    title: 'Flashcard Anki: 25 thẻ CIDR & VLSM',
    durationMinutes: 20,
    start: '12:00',
    end: '12:20',
    methodTag: 'Spaced Repetition',
    description: 'Lướt 25 thẻ Flashcard công thức chia subnet & subnet mask, nhớ dai không cần cày trâu.',
    rationale: 'Phương pháp ghi nhớ phản xạ nhanh cho kỳ thi trắc nghiệm.',
  },
];

interface AiMascotCoachProps {
  onStartFocus?: (minutes: number) => void;
  className?: string;
}

export function AiMascotCoach({ onStartFocus, className = '' }: AiMascotCoachProps) {
  const { state, update } = useCampusStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('default');
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [isPoked, setIsPoked] = useState<boolean>(false);
  const [pokeQuote, setPokeQuote] = useState<string | null>(null);

  // Eye tracking offsets (clamped between -6 and +6)
  const [eyeOffset, setEyeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mascotCardRef = useRef<HTMLDivElement | null>(null);

  const activePlan = useMemo(() => {
    return PLAN_OPTIONS.find((p) => p.id === selectedPlanId) || PLAN_OPTIONS[0]!;
  }, [selectedPlanId]);

  const dailyMood: DailyMood | null = state.dailyMood;
  const isAccepted = state.aiCoachAccepted;

  // Typewriter effect
  useEffect(() => {
    if (state.reducedMotion) {
      setDisplayedText(activePlan.description);
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    let currentIndex = 0;
    const fullText = activePlan.description;

    const interval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 22);

    return () => clearInterval(interval);
  }, [activePlan.description, state.reducedMotion]);

  // Natural Blinking Loop
  useEffect(() => {
    if (state.reducedMotion) return;

    let blinkTimeout: NodeJS.Timeout;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 140);

      const nextInterval = 3200 + Math.random() * 2400;
      blinkTimeout = setTimeout(triggerBlink, nextInterval);
    };

    blinkTimeout = setTimeout(triggerBlink, 3000);
    return () => clearTimeout(blinkTimeout);
  }, [state.reducedMotion]);

  // Pointer tracking for Mascot pupils
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (state.reducedMotion || !mascotCardRef.current) return;
    const rect = mascotCardRef.current.getBoundingClientRect();
    const centerX = rect.left + 80;
    const centerY = rect.top + 80;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const angle = Math.atan2(dy, dx);
    const distance = Math.min(6, Math.hypot(dx, dy) / 25);

    setEyeOffset({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    });
  }, [state.reducedMotion]);

  const handlePointerLeave = useCallback(() => {
    setEyeOffset({ x: 0, y: 0 });
  }, []);

  // Mascot Poke Easter Egg
  const handleMascotPoke = () => {
    setIsPoked(true);
    const quips = [
      'Đừng chọc bro, lo học Subnetting kìa! 😼',
      'Học xong 45p rồi tớ cho chọc tiếp! 🚀',
      'Streak 12 ngày rồi, giữ phong độ đi bro! 🔥',
      'Kubi luôn quan sát cậu đấy! 👀',
    ];
    setPokeQuote(quips[Math.floor(Math.random() * quips.length)]!);

    setTimeout(() => {
      setIsPoked(false);
    }, 800);

    setTimeout(() => {
      setPokeQuote(null);
    }, 3200);
  };

  // Commit plan to Today's Timeline and Calendar Store
  const handleAcceptPlan = () => {
    const todayStr = formatIsoDateOnly(new Date(), 0);
    const newEvent: CalendarEvent = {
      id: `study-ai-${Date.now()}`,
      title: activePlan.title,
      date: todayStr,
      start: activePlan.start,
      end: activePlan.end,
      type: 'study',
      location: 'Phòng tự học / Bàn học',
      description: activePlan.description,
      done: false,
      color: '#8B6CFF',
    };

    update((prev) => ({
      events: [...prev.events.filter((e) => !e.id.startsWith('study-ai-')), newEvent],
      aiCoachAccepted: true,
    }));
  };

  // Revert/Dismiss plan
  const handleRevertPlan = () => {
    update((prev) => ({
      events: prev.events.filter((e) => !e.id.startsWith('study-ai-')),
      aiCoachAccepted: false,
    }));
  };

  return (
    <div
      ref={mascotCardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`w-full min-w-0 rounded-2xl border bg-card/60 p-6 backdrop-blur-xl transition-all duration-300 shadow-sm ${className}`}
      style={{
        borderColor: isAccepted ? 'rgba(198, 255, 61, 0.4)' : 'rgba(124, 92, 255, 0.25)',
      }}
      aria-label="S4 AI Mascot Coach"
    >
      {/* Background Ambient Glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl opacity-20 transition-all duration-700"
        style={{
          backgroundColor: dailyMood === 'fire' ? '#FF8A3D' : dailyMood === 'cool' ? '#3DE8FF' : '#7C5CFF',
        }}
      />

      {/* Top Header Badge Strip */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="sticker-badge bg-aurora-violet/20 text-violet-300 border-aurora-violet/40 text-[11px] shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-aurora-lime" />
            AI COACH SQUAD
          </div>
          {dailyMood && (
            <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-slate-300 font-sans">
              {dailyMood === 'sleepy' && '😴 Chế độ bù sức'}
              {dailyMood === 'neutral' && '😐 Nhịp độ ổn định'}
              {dailyMood === 'cool' && '😎 Phong độ đỉnh'}
              {dailyMood === 'fire' && '🔥 Cực kỳ sung sức'}
            </span>
          )}
        </div>
        <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-violet-400" /> {activePlan.start} - {activePlan.end}
        </span>
      </div>

      {/* Main Grid: Mascot Avatar & Chat Bubble */}
      <div className="grid gap-4 sm:grid-cols-[110px_minmax(0,1fr)] items-start min-w-0">
        {/* Animated Mascot Character */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleMascotPoke}
            title="Bấm vào tớ đi bro!"
            className={`group relative flex h-24 w-24 items-center justify-center rounded-3xl border-2 border-white/15 bg-gradient-to-b from-[#1C1C30] to-[#0E0E1A] p-2 shadow-inner transition-transform duration-200 active:scale-95 ${
              isPoked ? 'scale-110 rotate-3' : 'hover:scale-105'
            }`}
          >
            {/* Mascot SVG Character */}
            <svg viewBox="0 0 100 100" className="h-20 w-20 select-none">
              <defs>
                <linearGradient id="mascotBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7C5CFF" />
                  <stop offset="50%" stopColor="#9E7CFF" />
                  <stop offset="100%" stopColor="#3DE8FF" />
                </linearGradient>
                <filter id="mascotGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#7C5CFF" floodOpacity="0.4" />
                </filter>
              </defs>

              {/* Antenna / Ears */}
              <path d="M 30,22 Q 22,8 14,14" stroke="#7C5CFF" strokeWidth="4" strokeLinecap="round" fill="none" />
              <circle cx="14" cy="14" r="4" fill="#C6FF3D" className="animate-pulse" />
              <path d="M 70,22 Q 78,8 86,14" stroke="#7C5CFF" strokeWidth="4" strokeLinecap="round" fill="none" />
              <circle cx="86" cy="14" r="4" fill="#3DE8FF" className="animate-pulse" />

              {/* Body */}
              <rect
                x="15"
                y="20"
                width="70"
                height="65"
                rx="28"
                fill="url(#mascotBodyGradient)"
                filter="url(#mascotGlow)"
              />

              {/* Dark Visor Screen */}
              <rect x="22" y="30" width="56" height="42" rx="16" fill="#0A0A14" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

              {/* Sleeping Zzz particles */}
              {dailyMood === 'sleepy' && (
                <text x="74" y="28" fill="#C4B5FD" fontSize="11" fontWeight="bold" className="animate-bounce">
                  zZ
                </text>
              )}

              {/* Eyes Expression Logic */}
              {isBlinking ? (
                // Blinking closed eye lines
                <>
                  <line x1="33" y1="50" x2="45" y2="50" stroke="#C6FF3D" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="55" y1="50" x2="67" y2="50" stroke="#C6FF3D" strokeWidth="3.5" strokeLinecap="round" />
                </>
              ) : isPoked ? (
                // Happy crescent squinch eyes
                <>
                  <path d="M 33,52 Q 39,44 45,52" stroke="#C6FF3D" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  <path d="M 55,52 Q 61,44 67,52" stroke="#C6FF3D" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                </>
              ) : dailyMood === 'cool' ? (
                // Cool Sunglasses Accessory
                <>
                  <rect x="30" y="44" width="18" height="11" rx="4" fill="#000" stroke="#3DE8FF" strokeWidth="2" />
                  <rect x="52" y="44" width="18" height="11" rx="4" fill="#000" stroke="#3DE8FF" strokeWidth="2" />
                  <line x1="48" y1="49" x2="52" y2="49" stroke="#3DE8FF" strokeWidth="2" />
                </>
              ) : (
                // Regular Tracking Pupils
                <>
                  {/* Left Eye */}
                  <circle cx="39" cy="50" r="7.5" fill="#1C1C30" />
                  <circle
                    cx={39 + eyeOffset.x}
                    cy={50 + eyeOffset.y}
                    r={dailyMood === 'fire' ? '5.5' : '4.5'}
                    fill={dailyMood === 'fire' ? '#FF8A3D' : '#C6FF3D'}
                    className="transition-transform duration-75"
                  />
                  {/* Right Eye */}
                  <circle cx="61" cy="50" r="7.5" fill="#1C1C30" />
                  <circle
                    cx={61 + eyeOffset.x}
                    cy={50 + eyeOffset.y}
                    r={dailyMood === 'fire' ? '5.5' : '4.5'}
                    fill={dailyMood === 'fire' ? '#FF8A3D' : '#C6FF3D'}
                    className="transition-transform duration-75"
                  />
                </>
              )}

              {/* Mouth */}
              {isPoked || dailyMood === 'fire' ? (
                <path d="M 44,62 Q 50,68 56,62" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              ) : dailyMood === 'sleepy' ? (
                <ellipse cx="50" cy="62" rx="3" ry="2" fill="#94A3B8" />
              ) : (
                <line x1="46" y1="62" x2="54" y2="62" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>

            {/* Tap indicator badge */}
            <span className="absolute -bottom-2 rounded-full bg-slate-900 border border-white/20 px-2 py-0.2 text-[9px] font-mono font-bold text-violet-300">
              KUBI
            </span>
          </button>

          {/* Poke Toast Balloon */}
          {pokeQuote && (
            <div className="mt-2 animate-in fade-in zoom-in-95 rounded-lg border border-amber-400/40 bg-amber-950/90 px-2 py-1 text-center text-[10px] font-semibold text-amber-200 shadow-md">
              {pokeQuote}
            </div>
          )}
        </div>

        {/* Chat Bubble & Study Plan Payload */}
        <div className="space-y-3">
          {/* Proposal Bubble with Typewriter */}
          <div
            onClick={() => {
              // Click bubble to skip typewriter
              setDisplayedText(activePlan.description);
              setIsTyping(false);
            }}
            className="cursor-pointer rounded-2xl border border-white/10 bg-black/40 p-4 transition-colors hover:border-violet-500/30"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-base text-foreground tracking-tight flex items-center gap-1.5 font-heading">
                <BookOpen className="h-4 w-4 text-aurora-violet" />
                {activePlan.title}
              </h4>
              <span className="rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold">
                {activePlan.durationMinutes}p
              </span>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-sans">
              {displayedText}
              {isTyping && <span className="inline-block animate-pulse text-aurora-lime font-bold">|</span>}
            </p>

            <p className="mt-2 text-[11px] text-muted-foreground/80 italic flex items-center gap-1 font-sans">
              <Zap className="h-3 w-3 text-amber-400 shrink-0" /> {activePlan.rationale}
            </p>
          </div>

          {/* Quick Adjustment Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] font-medium text-muted-foreground mr-1 font-sans">Điều chỉnh:</span>
            {PLAN_OPTIONS.map((opt) => {
              const active = selectedPlanId === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedPlanId(opt.id)}
                  disabled={isAccepted}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-semibold transition-all ${
                    active
                      ? 'border-violet-500 bg-violet-500/20 text-violet-200 shadow-sm'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white'
                  } disabled:opacity-50`}
                >
                  {opt.id === 'default' && <BookOpen className="h-3 w-3 text-violet-300" />}
                  {opt.id === 'evening' && <Moon className="h-3 w-3 text-indigo-300" />}
                  {opt.id === 'short' && <Timer className="h-3 w-3 text-amber-300" />}
                  {opt.id === 'flashcard' && <Sparkles className="h-3 w-3 text-cyan-300" />}
                  <span>{opt.chipLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!isAccepted ? (
              <>
                <button
                  onClick={handleAcceptPlan}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 text-sm font-bold shadow-md shadow-violet-900/30 transition-all active:scale-95"
                >
                  <CheckCircle2 className="h-4 w-4 text-aurora-lime" />
                  Chấp nhận kế hoạch
                </button>
                <button
                  onClick={() => {
                    setSelectedPlanId((prev) => (prev === 'default' ? 'evening' : 'default'));
                  }}
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-transparent hover:bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Gợi ý khác
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 font-sans">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Đã thêm vào lịch hôm nay ({activePlan.start} - {activePlan.end})
                  </span>
                  {onStartFocus && (
                    <button
                      onClick={() => onStartFocus(activePlan.durationMinutes)}
                      className="inline-flex items-center gap-1 rounded-lg bg-aurora-lime px-2.5 py-1 text-xs font-bold text-black hover:bg-aurora-lime/90 transition-colors shadow-sm"
                    >
                      <Play className="h-3 w-3 fill-current" /> Bắt đầu học
                    </button>
                  )}
                </div>
                <button
                  onClick={handleRevertPlan}
                  title="Xóa khỏi lịch trình"
                  className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-transparent px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Hoàn tác
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
