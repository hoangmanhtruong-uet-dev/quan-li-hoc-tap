'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useCampusStore, type DailyMood } from '@/lib/campus-store';
import {
  Flame,
  ShieldCheck,
  Mic,
  MicOff,
  Plus,
  Play,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  rotation: number;
  vRot: number;
}

interface DashboardHeroProps {
  onStartFocus?: () => void;
  onAddTask?: () => void;
}

export function DashboardHero({ onStartFocus, onAddTask }: DashboardHeroProps = {}) {
  const { state, update } = useCampusStore();
  const [mounted, setMounted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceFallbackOpen, setVoiceFallbackOpen] = useState(false);
  const [fallbackText, setFallbackText] = useState('');
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streakCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const magneticBtnRef = useRef<HTMLButtonElement | null>(null);
  const magneticPosRef = useRef({ x: 0, y: 0 });
  const mousePosRef = useRef({ x: 0.5, y: 0.5 });
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // 1. Client mount flag
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. Compute dynamic stats from store
  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const todayClassesCount = useMemo(() => {
    return state.events.filter((e) => e.date === todayIso && e.type === 'class').length || 3;
  }, [state.events, todayIso]);

  const urgentDeadlinesCount = useMemo(() => {
    return state.deadlines.filter((d) => !d.completed && (d.urgent || d.date === todayIso)).length || 1;
  }, [state.deadlines, todayIso]);

  const formattedDate = useMemo(() => {
    if (!mounted) return 'Thứ Năm, 20 tháng 8';
    try {
      const now = new Date();
      const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      return `${dayNames[now.getDay()]}, ${now.getDate()} tháng ${now.getMonth() + 1}`;
    } catch {
      return 'Hôm nay';
    }
  }, [mounted]);

  // 3. Pointer-reactive 1-draw-call Aurora Canvas Blob
  useEffect(() => {
    if (!mounted || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePosRef.current = {
        x: (e.clientX - rect.left) / (rect.width || 1),
        y: (e.clientY - rect.top) / (rect.height || 1),
      };
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    let t = 0;
    let currentX = width * 0.5;
    let currentY = height * 0.5;

    const streakBoost = Math.min(2.5, 1 + (state.streak || 0) * 0.05);
    const hasUrgent = urgentDeadlinesCount > 0;

    const render = () => {
      if (state.reducedMotion) {
        // Reduced motion: static subtle gradient
        ctx.clearRect(0, 0, width, height);
        const grad = ctx.createRadialGradient(width * 0.5, height * 0.5, 10, width * 0.5, height * 0.5, width * 0.45);
        grad.addColorStop(0, 'rgba(124, 92, 255, 0.35)');
        grad.addColorStop(0.5, 'rgba(61, 232, 255, 0.15)');
        grad.addColorStop(1, 'rgba(10, 10, 18, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        return;
      }

      t += 0.015 * streakBoost;
      ctx.clearRect(0, 0, width, height);

      // Smooth lerp to mouse target
      const targetX = width * 0.2 + mousePosRef.current.x * (width * 0.6);
      const targetY = height * 0.2 + mousePosRef.current.y * (height * 0.6);
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      // Single composite draw call with layered radial gradient
      const baseRadius = Math.min(width, height) * 0.35;
      const pulse = Math.sin(t * 1.5) * 16 + Math.cos(t * 0.8) * 10;
      const radius = baseRadius + pulse;

      const grad = ctx.createRadialGradient(currentX, currentY, 10, currentX, currentY, radius);

      if (hasUrgent) {
        // Red harmonic warning pulse
        grad.addColorStop(0, 'rgba(255, 61, 165, 0.45)');
        grad.addColorStop(0.35, 'rgba(124, 92, 255, 0.35)');
        grad.addColorStop(0.7, 'rgba(255, 61, 110, 0.2)');
        grad.addColorStop(1, 'rgba(10, 10, 18, 0)');
      } else {
        grad.addColorStop(0, 'rgba(198, 255, 61, 0.4)');
        grad.addColorStop(0.3, 'rgba(61, 232, 255, 0.3)');
        grad.addColorStop(0.65, 'rgba(124, 92, 255, 0.22)');
        grad.addColorStop(1, 'rgba(10, 10, 18, 0)');
      }

      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(currentX, currentY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Ambient 1-draw-call floating micro particles
      ctx.fillStyle = hasUrgent ? 'rgba(255, 138, 61, 0.6)' : 'rgba(198, 255, 61, 0.6)';
      for (let i = 0; i < 18; i++) {
        const pAngle = t * 0.5 + i * 0.35;
        const pDist = radius * 0.75 + Math.sin(t + i) * 35;
        const px = currentX + Math.cos(pAngle) * pDist;
        const py = currentY + Math.sin(pAngle) * pDist;
        ctx.beginPath();
        ctx.arc(px, py, (i % 3) + 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mounted, state.reducedMotion, state.streak, urgentDeadlinesCount]);

  // 4. Streak Particle Burst on Click
  const handleStreakClick = useCallback(() => {
    const canvas = streakCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.clientWidth || 300;
    canvas.height = canvas.clientHeight || 200;

    const colors = ['#FF8A3D', '#C6FF3D', '#FF3DA5', '#3DE8FF', '#FFFFFF'];
    const newParticles: Particle[] = [];
    const count = 28;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = 2.5 + Math.random() * 4.5;
      newParticles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        size: 3 + Math.random() * 5,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.2,
      });
    }

    particlesRef.current = newParticles;

    const startTime = performance.now();
    const animateBurst = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // Gravity
        p.rotation += p.vRot;
        p.alpha = Math.max(0, 1 - elapsed / 700);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (elapsed < 700) {
        requestAnimationFrame(animateBurst);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    requestAnimationFrame(animateBurst);
  }, []);

  // 5. Magnetic CTA Button tracking
  const handleMagneticMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (state.reducedMotion) return;
    const btn = magneticBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    magneticPosRef.current = { x: x * 0.25, y: y * 0.25 };
    btn.style.transform = `translate3d(${magneticPosRef.current.x}px, ${magneticPosRef.current.y}px, 0)`;
  }, [state.reducedMotion]);

  const handleMagneticLeave = useCallback(() => {
    const btn = magneticBtnRef.current;
    if (!btn) return;
    btn.style.transform = 'translate3d(0px, 0px, 0px)';
  }, []);

  // 6. Mood Check-in Handler
  const handleMoodSelect = (mood: DailyMood) => {
    update(() => ({
      dailyMood: mood,
      moodTimestamp: new Date().toISOString(),
    }));
  };

  const moodConfig: Record<DailyMood, { emoji: string; label: string; tip: string }> = {
    sleepy: {
      emoji: '😴',
      label: 'Oải chưởng',
      tip: 'Hơi oải? AI Coach sẽ cắt nhỏ task và bật Pomodoro 25p nhẹ nhàng.',
    },
    neutral: {
      emoji: '😐',
      label: 'Bình thường',
      tip: 'Ổn áp! Giữ nhịp độ ổn định để dọn dẹp các môn học hôm nay.',
    },
    cool: {
      emoji: '😎',
      label: 'Tỉnh táo',
      tip: 'Phong độ cực bén! Sẵn sàng xử lý các bài tập khó nhất.',
    },
    fire: {
      emoji: '🔥',
      label: 'Chiến đét',
      tip: 'Chiến đét! Năng lượng chạm đỉnh, deadline hôm nay không có cửa!',
    },
  };

  // 7. Voice Brain-Dump Handlers
  const handleStartVoice = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceFallbackOpen(true);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsListening(true);
      setVoiceNotice('Đang nghe tiếng Việt... Hãy nói to nhiệm vụ của bạn!');

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setVoiceNotice(`Đã nhận diện: "${transcript}"`);
          // Dispatch quick task create
          window.dispatchEvent(
            new CustomEvent('campusos:quick-create-task', {
              detail: { initialTitle: transcript },
            })
          );
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceFallbackOpen(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceFallbackOpen(true);
    }
  };

  const handleFallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fallbackText.trim()) return;
    window.dispatchEvent(
      new CustomEvent('campusos:quick-create-task', {
        detail: { initialTitle: fallbackText.trim() },
      })
    );
    setFallbackText('');
    setVoiceFallbackOpen(false);
  };

  return (
    <section className="relative overflow-hidden rounded-[24px] border-2 border-white/20 bg-[#11111E]/80 p-5 sm:p-6 md:p-8 shadow-[8px_8px_0px_#000] backdrop-blur-md hard-border w-full min-w-0">
      {/* 1-Draw-Call Aurora Canvas Background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-85">
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>

      <div className="relative z-10 grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        {/* Left Column: Heading, Subtitle, Mood & CTAs */}
        <div className="space-y-5 min-w-0">
          {/* Streak Sticker + Streak Freeze Shield */}
          <div className="relative flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={handleStreakClick}
              type="button"
              className="sticker-badge relative bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-orange-400 border-orange-500/40 hover:scale-105 active:scale-95 transition-transform text-xs"
              title="Nhấn để nổ hạt streak!"
            >
              <Flame className="h-4 w-4 fill-orange-400 text-orange-500 animate-pulse" />
              <span>Chuỗi {state.streak || 12} ngày 🔥</span>
            </button>

            {/* Streak Particle Canvas */}
            <canvas
              ref={streakCanvasRef}
              className="pointer-events-none absolute -top-12 -left-8 h-32 w-64 z-20"
            />

            {/* Streak Freeze Shield Tag */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-300">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>{state.streakFreezes > 0 ? `${state.streakFreezes} Khiên Freeze bảo vệ` : 'Đã dùng khiên'}</span>
            </div>

            {/* Level & Rank Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-aurora-lime/30 bg-aurora-lime/10 px-2.5 py-1 text-xs font-semibold text-aurora-lime">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Cấp {state.level}: {state.rankTitle}</span>
            </div>
          </div>

          {/* Stagger Heading Reveal */}
          <div className="min-w-0">
            <h1
              className="font-display text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-extrabold tracking-tight text-foreground break-words"
              aria-label="Chào buổi sáng, Minh."
            >
              <span aria-hidden="true" className="inline-block overflow-hidden">
                <span className="inline-block animate-slide-up [animation-delay:40ms]">CHÀO </span>
                <span className="inline-block animate-slide-up [animation-delay:80ms]">BUỔI </span>
                <span className="inline-block animate-slide-up [animation-delay:120ms]">SÁNG, </span>
              </span>
              <span
                aria-hidden="true"
                className="inline-block bg-gradient-to-r from-[#C6FF3D] via-[#3DE8FF] to-[#FF3DA5] bg-clip-text text-transparent font-black tracking-wide animate-slide-up [animation-delay:180ms] hover:brightness-125 transition-all"
              >
                MINH.
              </span>
            </h1>

            {/* Dynamic Live Date Subtitle */}
            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm md:text-base text-muted-foreground font-medium">
              <span className="text-foreground/90 font-semibold">{formattedDate}</span>
              <span className="text-muted-foreground/50">·</span>
              <span className="text-blue-400 font-semibold">{todayClassesCount} lớp học</span>
              <span className="text-muted-foreground/50">·</span>
              <span className="text-rose-400 font-semibold">{urgentDeadlinesCount} deadline sống còn</span>
            </p>
          </div>

          {/* Mood Check-in Bar */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 backdrop-blur-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Tâm trạng hôm nay của bạn:</span>
              <span className="text-[11px] text-aurora-lime">
                {state.dailyMood ? moodConfig[state.dailyMood].label : 'Chưa chọn'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {(['sleepy', 'neutral', 'cool', 'fire'] as DailyMood[]).map((m) => {
                const isSelected = state.dailyMood === m;
                return (
                  <button
                    key={m}
                    onClick={() => handleMoodSelect(m)}
                    type="button"
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-center transition-all ${
                      isSelected
                        ? 'border-2 border-aurora-lime bg-aurora-lime/15 text-aurora-lime shadow-[2px_2px_0px_#C6FF3D] scale-[1.03]'
                        : 'border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                    }`}
                  >
                    <span className="text-xl">{moodConfig[m].emoji}</span>
                    <span className="text-[11px] font-bold truncate max-w-full">
                      {moodConfig[m].label}
                    </span>
                  </button>
                );
              })}
            </div>

            {state.dailyMood && (
              <p className="text-xs text-muted-foreground/90 italic pt-1">
                💬 {moodConfig[state.dailyMood].tip}
              </p>
            )}
          </div>

          {/* Magnetic CTAs + Voice Brain-Dump */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* CTA 1: Thêm nhiệm vụ */}
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                if (onAddTask) {
                  onAddTask();
                } else {
                  window.dispatchEvent(new CustomEvent('campusos:quick-create-task'));
                }
              }}
              className="h-12 rounded-xl border-2 border-white/20 bg-[#161626] font-bold text-foreground hover:bg-white/10 shadow-[3px_3px_0px_#000] transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm nhiệm vụ
            </Button>

            {/* CTA 2: Magnetic Bắt đầu phiên học */}
            <button
              ref={magneticBtnRef}
              onMouseMove={handleMagneticMove}
              onMouseLeave={handleMagneticLeave}
              onClick={() => {
                if (onStartFocus) {
                  onStartFocus();
                } else {
                  window.dispatchEvent(new CustomEvent('campusos:trigger-focus'));
                }
              }}
              type="button"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-aurora-lime px-6 text-sm font-black text-black shadow-[4px_4px_0px_#000] transition-transform duration-100 hover:brightness-110 active:scale-95"
            >
              <Play className="mr-2 h-4 w-4 fill-current" />
              Bắt đầu phiên học (F)
            </button>

            {/* Voice Brain-Dump Mic Button */}
            <button
              onClick={handleStartVoice}
              type="button"
              title="Voice Brain-Dump: Nói nhanh để tạo task bằng tiếng Việt"
              className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all ${
                isListening
                  ? 'border-rose-500 bg-rose-500/20 text-rose-400 animate-pulse shadow-[3px_3px_0px_#FF3D6E]'
                  : 'border-white/20 bg-[#161626] text-muted-foreground hover:border-aurora-lime hover:text-aurora-lime shadow-[3px_3px_0px_#000]'
              }`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          </div>

          {voiceNotice && (
            <p className="text-xs font-medium text-aurora-lime animate-fade-in">{voiceNotice}</p>
          )}
        </div>

        {/* Right Column: Hero Visual Hologram Frame */}
        <div className="relative hidden lg:flex items-center justify-center shrink-0">
          <div className="relative w-64 h-64 xl:w-72 xl:h-72 rounded-[24px] border-2 border-white/20 bg-gradient-to-br from-[#161628]/90 to-[#0A0A14]/95 p-4 sm:p-5 shadow-[6px_6px_0px_#000] flex flex-col justify-between hard-border">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                SYS.VIBE // {state.vibeTheme.toUpperCase()}
              </span>
              <div className="h-2 w-2 rounded-full bg-aurora-lime animate-ping" />
            </div>

            <div className="space-y-3 text-center my-auto">
              <div className="text-4xl">🚀</div>
              <p className="font-heading text-lg font-bold text-foreground">
                Không gian học tập 120FPS
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nền tảng tập trung tối đa · Nhấn <kbd className="rounded border border-white/20 bg-black/40 px-1 font-mono text-[11px] text-aurora-lime">F</kbd> để bật Giám thị Mèo Mập
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-muted-foreground">
              <span>XP Tuần: {state.xp}</span>
              <span className="font-mono text-aurora-lime font-bold">Lvl {state.level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Fallback Dialog Modal */}
      {voiceFallbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border-2 border-white/25 bg-[#121220] p-6 shadow-[8px_8px_0px_#000] space-y-4 hard-border">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-foreground">Xả não nhanh (Brain-Dump)</h3>
              <button
                onClick={() => setVoiceFallbackOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Trình duyệt chưa cấp quyền micro. Bạn có thể nhập nhanh suy nghĩ hoặc nhiệm vụ bằng văn bản:
            </p>
            <form onSubmit={handleFallbackSubmit} className="space-y-4">
              <textarea
                value={fallbackText}
                onChange={(e) => setFallbackText(e.target.value)}
                placeholder="VD: Nộp bài tập mạng máy tính lúc 23h hôm nay, đọc trước chương 3..."
                rows={3}
                className="w-full rounded-xl border border-white/20 bg-black/40 p-3 text-sm text-foreground focus:border-aurora-lime focus:outline-none placeholder:text-muted-foreground"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setVoiceFallbackOpen(false)}>
                  Đóng
                </Button>
                <Button type="submit" className="bg-aurora-lime text-black font-bold hover:bg-aurora-lime/90 shadow-[2px_2px_0px_#000]">
                  Tạo nhiệm vụ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
