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
  Share2,
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-[24px] bg-gradient-to-r from-aurora-violet/20 via-aurora-pink/15 to-aurora-cyan/20 border-2 border-white/20 shadow-[6px_6px_0px_#000]">
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
        <span>Thiết kế cho sinh viên Việt Nam không sợ rớt môn</span>
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
                      className={`h-full bg-aurora-lime transition-all ${
                        isCompleted
                          ? 'w-full'
                          : isActive
                          ? 'w-full duration-[5000ms] ease-linear'
                          : 'w-0'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Top Close Button & Slide Counter */}
            <div className="flex items-center justify-between z-20 pt-2">
              <span className="font-mono text-[11px] font-bold text-aurora-lime bg-black/60 px-2.5 py-1 rounded-full border border-white/20">
                {currentSlide + 1} / {totalSlides}
              </span>
              <button
                onClick={() => setWrappedOpen(false)}
                className="p-1.5 rounded-full bg-black/60 border border-white/20 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ambient Background Gradient Glow based on slide */}
            <div
              className={`absolute inset-0 pointer-events-none opacity-25 blur-3xl transition-all duration-700 ${
                currentSlide === 0
                  ? 'bg-gradient-to-br from-aurora-violet to-aurora-pink'
                  : currentSlide === 1
                  ? 'bg-gradient-to-br from-emerald-500 to-aurora-cyan'
                  : currentSlide === 2
                  ? 'bg-gradient-to-br from-aurora-lime to-aurora-orange'
                  : currentSlide === 3
                  ? 'bg-gradient-to-br from-aurora-cyan to-aurora-violet'
                  : 'bg-gradient-to-br from-aurora-pink via-aurora-lime to-aurora-cyan'
              }`}
            />

            {/* Left & Right Tap Zones for Navigation */}
            <div
              onClick={prevSlide}
              className="absolute left-0 top-16 bottom-20 w-1/4 z-10 cursor-pointer"
              title="Slide trước"
            />
            <div
              onClick={nextSlide}
              className="absolute right-0 top-16 bottom-20 w-1/4 z-10 cursor-pointer"
              title="Slide kế tiếp"
            />

            {/* ===============================================================
                SLIDE 0: TỔNG QUAN GIỜ HỌC
                =============================================================== */}
            {currentSlide === 0 && (
              <div className="my-auto z-10 space-y-4 animate-fade-in text-center">
                <span className="sticker-badge bg-aurora-lime text-black border-black text-xs">
                  DAILY WRAPPED 2026
                </span>

                <h2 className="font-display font-black text-3xl sm:text-4xl text-foreground leading-tight">
                  CHÀO CHIẾN THẦN MINH!
                </h2>

                <div className="py-6 px-4 rounded-2xl bg-black/40 border border-white/15 shadow-[4px_4px_0px_#000]">
                  <span className="font-display font-black text-6xl text-aurora-lime block tracking-tighter">
                    {studyHours}h
                  </span>
                  <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-1 block">
                    Giờ tập trung cao độ hôm nay
                  </span>
                </div>

                <p className="font-sans text-sm text-foreground/90 leading-relaxed px-2">
                  Bạn thuộc <strong className="text-aurora-lime">Top 5% sinh viên chăm chỉ nhất</strong> toàn trường ngày hôm nay!
                </p>
              </div>
            )}

            {/* ===============================================================
                SLIDE 1: CHIẾN TÍCH NHIỆM VỤ
                =============================================================== */}
            {currentSlide === 1 && (
              <div className="my-auto z-10 space-y-4 animate-fade-in text-center">
                <span className="sticker-badge bg-emerald-400 text-black border-black text-xs">
                  CHIẾN TÍCH HÔM NAY
                </span>

                <h2 className="font-display font-black text-3xl text-foreground leading-tight">
                  HẠ GỤC DEADLINE
                </h2>

                <div className="py-5 px-4 rounded-2xl bg-black/40 border border-white/15 space-y-2">
                  <span className="font-display font-black text-5xl text-emerald-400 block">
                    {completedTasksCount} TASK
                  </span>
                  <span className="text-xs text-muted-foreground font-sans">
                    Đã hoàn thành xuất sắc
                  </span>
                </div>

                {/* Highlighted task card */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/15 text-left flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-heading font-bold text-xs text-foreground">
                      Bài tập lớn Mạng máy tính
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-sans">
                      CS301 · Nộp trước hạn chót 23:59 hôm nay!
                    </p>
                  </div>
                </div>

                <p className="font-sans text-xs text-muted-foreground italic">
                  &ldquo;Deadline đang thở sau gáy nhưng bạn thở vào mặt deadline! 🔥&rdquo;
                </p>
              </div>
            )}

            {/* ===============================================================
                SLIDE 2: XP & THĂNG HẠNG
                =============================================================== */}
            {currentSlide === 2 && (
              <div className="my-auto z-10 space-y-4 animate-fade-in text-center">
                <span className="sticker-badge bg-aurora-pink text-black border-black text-xs">
                  GAME HUD LEVEL UP
                </span>

                <h2 className="font-display font-black text-3xl text-foreground leading-tight">
                  TĂNG TRƯỞNG XP
                </h2>

                <div className="py-5 px-4 rounded-2xl bg-black/40 border border-white/15 space-y-1">
                  <span className="font-display font-black text-5xl text-aurora-pink block">
                    +340 XP
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    Kiếm được trong các phiên học
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/15 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-heading font-bold text-foreground">
                      Level {state.level}: {state.rankTitle}
                    </span>
                    <span className="text-aurora-lime font-mono font-bold">
                      {state.xp} XP
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-aurora-lime to-aurora-orange w-3/4 rounded-full" />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-sans">
                    Còn 760 XP nữa để mở khóa danh hiệu: &ldquo;Trùm phao cứu sinh&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-300">
                  <Flame className="w-4 h-4 fill-amber-300" />
                  <span>Streak {state.streak} ngày · Đang được bảo vệ!</span>
                </div>
              </div>
            )}

            {/* ===============================================================
                SLIDE 3: MÔN CÀY NHIỀU NHẤT
                =============================================================== */}
            {currentSlide === 3 && (
              <div className="my-auto z-10 space-y-4 animate-fade-in text-center">
                <span className="sticker-badge bg-aurora-cyan text-black border-black text-xs">
                  MVP SUBJECT
                </span>

                <h2 className="font-display font-black text-3xl text-foreground leading-tight">
                  MÔN CÀY NHIỀU NHẤT
                </h2>

                <div className="py-6 px-4 rounded-2xl bg-black/40 border-2 border-aurora-cyan/50 space-y-2 shadow-[4px_4px_0px_#000]">
                  <span className="font-mono text-xs font-bold text-aurora-cyan uppercase tracking-wider block">
                    CS301
                  </span>
                  <h3 className="font-heading font-black text-xl text-foreground">
                    Mạng máy tính & Subnetting
                  </h3>
                  <span className="text-sm font-mono text-aurora-lime font-bold block">
                    4.5 Giờ hôm nay
                  </span>
                </div>

                <p className="font-sans text-xs text-foreground/80 leading-relaxed px-4">
                  {state.dailyMood === 'fire'
                    ? 'Hôm nay cháy quá bro! Gánh toàn bộ team qua môn ngọt ngào.'
                    : state.dailyMood === 'sleepy'
                    ? 'Vừa ngáp vừa code mà vẫn nộp bài đúng hạn, đỉnh của chóp!'
                    : 'Phong thái điềm tĩnh, điểm số chuẩn chỉ học bá.'}
                </p>
              </div>
            )}

            {/* ===============================================================
                SLIDE 4: THẺ FLEX SHAREABLE TRADING CARD
                =============================================================== */}
            {currentSlide === 4 && (
              <div className="my-auto z-10 space-y-4 animate-fade-in text-center">
                <span className="sticker-badge bg-aurora-lime text-black border-black text-xs">
                  CERTIFIED STUDENT
                </span>

                {/* Holographic Trading Card */}
                <div className="p-4 rounded-2xl bg-[#141424] border-2 border-aurora-lime/60 shadow-[6px_6px_0px_#000] text-left space-y-3 font-sans relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-mono text-[10px] font-bold text-aurora-lime">
                      CAMPUSOS DAILY REPORT
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      2026-10-13
                    </span>
                  </div>

                  <div>
                    <h4 className="font-display font-black text-lg text-foreground">
                      MINH (YOU)
                    </h4>
                    <p className="text-xs font-heading font-bold text-aurora-pink">
                      Level {state.level} · {state.rankTitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div className="p-2 rounded bg-black/40 border border-white/10">
                      <span className="text-muted-foreground text-[10px] block">TỔNG GIỜ</span>
                      <strong className="text-aurora-lime">{studyHours} Giờ</strong>
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-white/10">
                      <span className="text-muted-foreground text-[10px] block">NHIỆM VỤ</span>
                      <strong className="text-emerald-400">{completedTasksCount} Xong</strong>
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-white/10">
                      <span className="text-muted-foreground text-[10px] block">STREAK</span>
                      <strong className="text-amber-300">🔥 {state.streak} Ngày</strong>
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-white/10">
                      <span className="text-muted-foreground text-[10px] block">XP KIẾM</span>
                      <strong className="text-aurora-cyan">+340 XP</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between font-mono text-[9px] text-muted-foreground">
                    <span>||| |||| | ||||</span>
                    <span className="text-aurora-lime font-bold">VERIFIED STUDY BADGE</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleCopyFlex}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-foreground font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[2px_2px_0px_#000]"
                  >
                    {copiedToast ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedToast ? 'Đã sao chép vào bộ nhớ đệm!' : 'Sao chép tóm tắt flex lên mạng'}</span>
                  </button>

                  <button
                    onClick={handleClaimBonusXp}
                    className="w-full py-2.5 rounded-xl bg-aurora-lime text-black font-heading font-black text-xs flex items-center justify-center gap-1.5 shadow-[4px_4px_0px_#000] hover:bg-aurora-lime/90"
                  >
                    <Zap className="w-4 h-4 fill-black" />
                    <span>Chốt sổ & Nhận +50 XP Thưởng</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Navigation Indicators */}
            <div className="flex items-center justify-between z-20 pt-2 border-t border-white/10">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="font-mono text-xs text-muted-foreground">
                Chạm để chuyển slide
              </span>

              <button
                onClick={nextSlide}
                disabled={currentSlide === totalSlides - 1}
                className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
