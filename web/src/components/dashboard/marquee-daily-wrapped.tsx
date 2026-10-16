'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  Trophy,
  Moon,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Zap,
  Check,
} from 'lucide-react';
import { useCampusStore } from '@/lib/campus-store';

const QUOTES_ROW_1 = [
  'ĐỪNG ĐỂ DEADLINE DÍ 🫠',
  'KHÔNG HỌC THÌ CẠP ĐẤT MÀ ĂN 🦴',
  'TIẾNG KHÓC CỦA ĐỒ ÁN LÀ TIẾNG HÁT CỦA QUA MÔN 🎶',
  'HỌC HỌC NỮA HỌC MÃI KHÔNG THÌ HỌC LẠI 💀',
  'MÈO MẬP ĐANG CANH CHỪNG BẠN 😼',
  'CÒN THỞ LÀ CÒN CÀY 💪',
  'NGƯỜI LƯỚT TIKTOK LÀ NGƯỜI ĐÓI, NGƯỜI ÔN BÀI LÀ NGƯỜI ĐỖ 🏆',
];

const QUOTES_ROW_2 = [
  'TRƯỢT MÔN KHÔNG ĐAU BẰNG ĐÓI KÉM 💸',
  'NGỦ 4 TIẾNG MỖI NGÀY ĐỂ GIÀU TRƯỚC TUỔI 30 ⏰',
  'STREAK 12 NGÀY ĐỪNG ĐỂ CHẾT UỔNG 🔥',
  'CHẠY DEADLINE LÀ BẢN NĂNG, VƯỢT DEADLINE LÀ BẢN LĨNH ⚡',
  'HỌC KHÔNG CHƠI ĐÁNH RƠI TUỔI TRẺ · CHƠI KHÔNG HỌC MẤT MẸ TƯƠNG LAI 📚',
  'BẬC THẦY NƯỚC ĐẾN CHÂN MỚI NHẢY 🏃‍♂️',
];

export function MarqueeDailyWrapped() {
  const { state, update } = useCampusStore();
  const [wrappedOpen, setWrappedOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [claimedReward, setClaimedReward] = useState(false);

  const totalSlides = 5;
  const slideDurationMs = 5000;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------------------------
  // Story Auto-Advance & Controls
  // ---------------------------------------------------------------------------
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => {
      if (prev < totalSlides - 1) return prev + 1;
      return prev;
    });
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    if (!wrappedOpen || isPaused) return;

    timerRef.current = setTimeout(() => {
      if (currentSlide < totalSlides - 1) {
        nextSlide();
      }
    }, slideDurationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [wrappedOpen, isPaused, currentSlide, totalSlides, nextSlide]);

  // Keyboard navigation for Wrapped
  useEffect(() => {
    if (!wrappedOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setWrappedOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [wrappedOpen, nextSlide, prevSlide]);

  // Stats derived from store
  const studyHours = Math.round(((state.weeklyStudyMinutesCurrent || 510) / 60) * 10) / 10;
  const completedTasksCount = state.kanbanTasks.filter((t) => t.column === 'done').length + 3;

  const handleCopyFlex = () => {
    if (typeof navigator !== 'undefined') {
      const text = `🔥 CampusOS Daily Wrapped: Hôm nay tui đã cày ${studyHours} giờ học · Hoàn thành ${completedTasksCount} nhiệm vụ · Giữ vững Streak ${state.streak} ngày · Đạt ${state.rankTitle} (Level ${state.level})! Anh em được bao nhiêu giờ rồi? 💪`;
      navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    }
  };

  const handleClaimBonusXp = () => {
    if (!claimedReward) {
      setClaimedReward(true);
      update((prev) => ({ xp: prev.xp + 50 }));
    }
    setWrappedOpen(false);
  };

  return (
    <footer className="w-full pt-6 pb-12 space-y-8" aria-label="S7 Marquee Footer & Daily Wrapped">
      {/* ===================================================================
          "CHỐT NGÀY HÔM NAY" (END-OF-DAY RECAP) CTA BUTTON
          =================================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-[24px] bg-gradient-to-r from-aurora-violet/20 via-aurora-pink/15 to-aurora-cyan/20 border-2 border-white/20 shadow-[6px_6px_0px_#000] hard-border">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-[#0E0E1A] border-2 border-aurora-cyan text-aurora-cyan shadow-[3px_3px_0px_#000]">
            <Moon className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="font-heading font-black text-base text-foreground tracking-tight">
              TỔNG KẾT NGÀY HÔM NAY (DAILY WRAPPED)
            </h3>
            <p className="font-sans text-xs text-muted-foreground">
              Xem lại giờ học, XP kiếm được và nhận huy hiệu chốt sổ cuối ngày
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setCurrentSlide(0);
            setWrappedOpen(true);
          }}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-aurora-lime text-black font-heading font-bold text-sm shadow-[4px_4px_0px_#000] hover:bg-aurora-lime/90 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 fill-black" />
          <span>Chốt ngày hôm nay</span>
          <span className="px-2 py-0.5 bg-black/20 rounded-full text-xs font-mono font-bold">
            {studyHours}h · +120 XP
          </span>
        </button>
      </div>

      {/* ===================================================================
          DUAL-DIRECTION INFINITE GEN Z QUOTE MARQUEE
          =================================================================== */}
      <div className="relative w-full overflow-hidden py-3 space-y-3 pointer-events-auto">
        {/* Row 1: Left-moving Marquee */}
        <div className="relative flex overflow-x-hidden group">
          <div
            className={`flex shrink-0 items-center gap-6 whitespace-nowrap ${
              state.reducedMotion
                ? 'overflow-x-auto py-1'
                : 'animate-marquee-left group-hover:[animation-play-state:paused]'
            }`}
          >
            {[...QUOTES_ROW_1, ...QUOTES_ROW_1].map((quote, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-4 font-display font-black text-sm sm:text-base tracking-wider uppercase text-foreground/80 px-4 py-2 rounded-xl bg-white/5 border border-white/10 shadow-[2px_2px_0px_#000]"
              >
                <span>{quote}</span>
                <span className="text-aurora-lime font-bold">✦</span>
              </span>
            ))}
          </div>
        </div>

        {/* Row 2: Right-moving Marquee */}
        <div className="relative flex overflow-x-hidden group">
          <div
            className={`flex shrink-0 items-center gap-6 whitespace-nowrap ${
              state.reducedMotion
                ? 'overflow-x-auto py-1'
                : 'animate-marquee-right group-hover:[animation-play-state:paused]'
            }`}
          >
            {[...QUOTES_ROW_2, ...QUOTES_ROW_2].map((quote, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-4 font-display font-black text-sm sm:text-base tracking-wider uppercase text-foreground/80 px-4 py-2 rounded-xl bg-black/40 border border-white/10 shadow-[2px_2px_0px_#000]"
              >
                <span>{quote}</span>
                <span className="text-aurora-pink font-bold">★</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-footer Brand Note */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground font-mono pt-4 border-t border-white/10 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>CampusOS v2.4 · Neo-Brutal Aurora Edition · 120FPS Engine</span>
        </div>
        <span className="font-sans">Thiết kế cho sinh viên Việt Nam không sợ rớt môn</span>
      </div>

      {/* ===================================================================
          SPOTIFY-WRAPPED-STYLE DAILY WRAPPED 5-SLIDE MODAL
          =================================================================== */}
      {wrappedOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          {/* Card Container (Mobile/Story proportioned) */}
          <div
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            className="relative w-full max-w-md aspect-[9/16] min-h-[580px] max-h-[85vh] bg-[#0E0E18] border-2 border-white/30 rounded-[32px] shadow-[12px_12px_0px_#000] overflow-hidden flex flex-col justify-between p-6 select-none hard-border"
          >
            {/* Top 5 Segmented Story Progress Bars */}
            <div className="flex items-center gap-1.5 z-20">
              {Array.from({ length: totalSlides }).map((_, index) => {
                const isCompleted = index < currentSlide;
                const isActive = index === currentSlide;

                return (
                  <div key={index} className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className={`h-full bg-aurora-lime transition-all ease-linear ${
                        isCompleted
                          ? 'w-full'
                          : isActive
                          ? 'w-full'
                          : 'w-0'
                      }`}
                      style={{
                        transitionDuration: isActive ? '5000ms' : isCompleted ? '0ms' : '0ms',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Top Header Controls */}
            <div className="flex items-center justify-between pt-3 z-20">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-aurora-lime bg-aurora-lime/20 border border-aurora-lime/40 px-2 py-0.5 rounded-full">
                  DAILY WRAPPED 2026
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {currentSlide + 1}/{totalSlides}
                </span>
              </div>
              <button
                onClick={() => setWrappedOpen(false)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Left & Right Touch/Click zones for easy flipping */}
            <div
              onClick={prevSlide}
              className="absolute left-0 top-16 bottom-20 w-1/4 z-10 cursor-w-resize"
              title="Slide trước"
            />
            <div
              onClick={nextSlide}
              className="absolute right-0 top-16 bottom-20 w-1/4 z-10 cursor-e-resize"
              title="Slide kế tiếp"
            />

            {/* SLIDE CONTENT CONTAINER */}
            <div className="relative z-15 my-auto py-6 px-2 text-center flex flex-col items-center justify-center">
              {/* SLIDE 0: STUDY HOURS OVERVIEW */}
              {currentSlide === 0 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-aurora-violet to-aurora-cyan p-0.5 shadow-[4px_4px_0px_#000]">
                    <div className="w-full h-full bg-[#101020] rounded-[22px] flex items-center justify-center text-3xl">
                      ⚡
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-aurora-cyan block mb-1">
                      Tổng thời gian tập trung
                    </span>
                    <h3 className="font-display font-black text-5xl sm:text-6xl text-aurora-lime tracking-tight">
                      {studyHours} Giờ
                    </h3>
                  </div>
                  <p className="font-sans text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
                    Bạn nằm trong <strong className="text-aurora-lime">Top 5% sinh viên chăm chỉ nhất</strong> hôm nay. Năng suất vượt 85% bạn bè cùng khoá!
                  </p>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl inline-flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <Clock className="w-4 h-4 text-aurora-cyan" />
                    <span>510 phút · 4 phiên Pomodoro</span>
                  </div>
                </div>
              )}

              {/* SLIDE 1: COMPLETED TASKS & DEADLINES */}
              {currentSlide === 1 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-aurora-lime p-0.5 shadow-[4px_4px_0px_#000]">
                    <div className="w-full h-full bg-[#101020] rounded-[22px] flex items-center justify-center text-3xl">
                      🎯
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                      Nhiệm vụ đã giải quyết
                    </span>
                    <h3 className="font-display font-black text-5xl sm:text-6xl text-white tracking-tight">
                      {completedTasksCount} Tasks
                    </h3>
                  </div>
                  <p className="font-sans text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
                    Dọn sạch 1 deadline nguy hiểm và 3 bài tập lớn. Không một bài nộp trễ nào xảy ra hôm nay!
                  </p>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl inline-flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tỷ lệ hoàn thành: 100% mục tiêu ngày</span>
                  </div>
                </div>
              )}

              {/* SLIDE 2: XP & LEVEL PROGRESSION */}
              {currentSlide === 2 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-aurora-pink to-amber-400 p-0.5 shadow-[4px_4px_0px_#000]">
                    <div className="w-full h-full bg-[#101020] rounded-[22px] flex items-center justify-center text-3xl">
                      🏆
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-aurora-pink block mb-1">
                      Kinh nghiệm tích luỹ
                    </span>
                    <h3 className="font-display font-black text-5xl sm:text-6xl text-amber-300 tracking-tight">
                      +{studyHours > 5 ? '340' : '220'} XP
                    </h3>
                  </div>
                  <p className="font-sans text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
                    Giữ vững Cấp độ <strong className="text-aurora-lime">{state.level}: {state.rankTitle}</strong>. Chuỗi ngọn lửa <Flame className="w-4 h-4 inline text-orange-400 fill-orange-400" /> {state.streak} ngày rực cháy!
                  </p>
                  <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-2xl inline-flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Còn 760 XP nữa để lên Level 8: Trùm phao cứu sinh</span>
                  </div>
                </div>
              )}

              {/* SLIDE 3: TOP SUBJECT MVP & MOOD REVIEW */}
              {currentSlide === 3 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-aurora-cyan to-aurora-violet p-0.5 shadow-[4px_4px_0px_#000]">
                    <div className="w-full h-full bg-[#101020] rounded-[22px] flex items-center justify-center text-3xl">
                      📚
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-aurora-cyan block mb-1">
                      Môn học gánh team (MVP)
                    </span>
                    <h3 className="font-heading font-black text-2xl sm:text-3xl text-foreground tracking-tight leading-snug">
                      CS301 · Mạng máy tính
                    </h3>
                  </div>
                  <p className="font-sans text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
                    Dành 3.5h chia subnet và định tuyến. AI Mascot Kubi nhận xét:{' '}
                    <em className="text-aurora-lime">&quot;Bro học như này thì lab chiều nay trùm trường rồi!&quot;</em>
                  </p>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl inline-flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <span>Tâm trạng hôm nay: {state.dailyMood ? state.dailyMood.toUpperCase() : 'FIRE 🔥'}</span>
                  </div>
                </div>
              )}

              {/* SLIDE 4: SHAREABLE TRADING CARD PREVIEW */}
              {currentSlide === 4 && (
                <div className="space-y-4 animate-fade-in w-full">
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-[#18182E] to-[#0A0A16] border-2 border-aurora-lime/60 shadow-[6px_6px_0px_#000] text-left space-y-3 hard-border">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="font-mono text-[10px] font-black text-aurora-lime">
                        CAMPUSOS // CARD CERTIFICATE
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        2026.08.20
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-heading font-black text-lg text-foreground">
                        MINH · SINH VIÊN CÀY THUÊ
                      </h4>
                      <p className="text-xs text-muted-foreground font-sans">
                        Chứng nhận đã vượt qua ngày học tập với phong độ đỉnh cao
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-muted-foreground block">GIỜ HỌC</span>
                        <span className="font-bold text-sm text-aurora-cyan">{studyHours}h</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-muted-foreground block">TASKS</span>
                        <span className="font-bold text-sm text-aurora-lime">{completedTasksCount}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-muted-foreground block">STREAK</span>
                        <span className="font-bold text-sm text-orange-400">🔥{state.streak}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={handleCopyFlex}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/10 border border-white/20 text-foreground font-heading font-bold text-xs hover:bg-white/20 flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000] transition-all"
                    >
                      {copiedToast ? <Check className="w-4 h-4 text-aurora-lime" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedToast ? 'Đã sao chép để flex!' : 'Sao chép tóm tắt flex'}</span>
                    </button>

                    <button
                      onClick={handleClaimBonusXp}
                      disabled={claimedReward}
                      className="w-full py-2.5 px-4 rounded-xl bg-aurora-lime text-black font-heading font-black text-xs hover:bg-aurora-lime/90 flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#000] transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 fill-black" />
                      <span>{claimedReward ? 'Đã chốt ngày ✓ (+50 XP)' : 'Chốt sổ hôm nay (+50 XP Thưởng)'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Story Navigation Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10 z-20 font-sans">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-white disabled:opacity-20 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Trước</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalSlides }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentSlide ? 'w-4 bg-aurora-lime' : 'bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                disabled={currentSlide === totalSlides - 1}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-white disabled:opacity-20 flex items-center gap-1"
              >
                <span>Tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
