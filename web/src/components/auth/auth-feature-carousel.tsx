'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  BrainCircuit,
  Trophy,
  Flame,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export interface FeatureSlide {
  id: string;
  superpowerTag: string;
  badge: string;
  iconType: 'cat' | 'ai' | 'party';
  title: string;
  subtitle: string;
  description: string;
  metricBadge: string;
  accentGradient: string;
  borderColor: string;
}

export const SUPERPOWER_SLIDES: FeatureSlide[] = [
  {
    id: 'meme-cat',
    superpowerTag: 'SIÊU NĂNG 01',
    badge: 'KỶ LUẬT THÉP',
    iconType: 'cat',
    title: 'Mèo Cam Giám Sát Cực Đoan',
    subtitle: 'URL Tab Blacklist & AI Webcam Face Tracking',
    description:
      'Cảnh báo tức thì khi chuyển tab lướt mạng xã hội, mắng chửi bằng giọng đọc TTS tiếng Việt hài hước và trừ -50 XP nếu bỏ cuộc.',
    metricBadge: '⚡ 5s khóa tab · -50 XP vi phạm',
    accentGradient: 'from-amber-400 to-orange-500',
    borderColor: 'border-orange-500/40 shadow-orange-500/10',
  },
  {
    id: 'ai-study-hub',
    superpowerTag: 'SIÊU NĂNG 02',
    badge: 'TRỢ LÝ 1M TOKENS',
    iconType: 'ai',
    title: 'AI Study Hub & Flashcard 3D SM-2',
    subtitle: 'Phân tích Slide PDF & Thuật toán SM-2',
    description:
      'Tự động phân tích toàn bộ giáo trình PDF cả kỳ, trích xuất câu hỏi trắc nghiệm và ôn tập lặp lại ngắt quãng với thẻ 3D không gian.',
    metricBadge: '🧠 Tóm tắt 100+ trang PDF trong 3s',
    accentGradient: 'from-cyan-400 to-blue-500',
    borderColor: 'border-cyan-400/40 shadow-cyan-400/10',
  },
  {
    id: 'pomodoro-party',
    superpowerTag: 'SIÊU NĂNG 03',
    badge: 'ĐẤU TRƯỜNG REALTIME',
    iconType: 'party',
    title: 'Pomodoro Party & Bục Vinh Danh 3D',
    subtitle: 'Đồng bộ Realtime <200ms & Kỷ luật nhóm',
    description:
      'Học nhóm đa người chơi với Supabase Realtime Channels, chế độ Silent Focus thả reaction hạt bay và vinh danh chiến thần tuần trên bục 3D.',
    metricBadge: '👑 Bục vàng Cyberpunk · Cúp 3D',
    accentGradient: 'from-violet-400 to-purple-500',
    borderColor: 'border-violet-500/40 shadow-violet-500/10',
  },
];

export const INSPIRING_QUOTES = [
  '“Kỷ luật là cầu nối giữa ước mơ và bảng điểm A+ của bạn.”',
  '“Học không bao giờ là muộn, chỉ có nộp deadline mới sợ muộn thôi.”',
  '“Tập trung 45 phút hôm nay để mai sau không phải ngồi cày lại môn.”',
  '“Đừng để deadline dí. Hãy để CampusOS cùng bạn thống trị học kỳ này!”',
];

export const STUDENT_STATS = [
  {
    icon: Flame,
    value: '12,450+',
    label: 'giờ học hôm nay',
    color: 'text-orange-400',
  },
  {
    icon: Users,
    value: '4,800+',
    label: 'sinh viên online',
    color: 'text-cyan-400',
  },
  {
    icon: CheckCircle2,
    value: '99.2%',
    label: 'qua môn',
    color: 'text-emerald-400',
  },
];

export function AuthFeatureCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SUPERPOWER_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + SUPERPOWER_SLIDES.length) % SUPERPOWER_SLIDES.length);
  }, []);

  // 5s auto-sliding with pause on hover
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const activeSlide = SUPERPOWER_SLIDES[currentIndex] || SUPERPOWER_SLIDES[0]!;
  const activeQuote = INSPIRING_QUOTES[currentIndex % INSPIRING_QUOTES.length];

  const renderIcon = (type: string) => {
    switch (type) {
      case 'cat':
        return <ShieldAlert className="h-5 w-5 text-orange-400" />;
      case 'ai':
        return <BrainCircuit className="h-5 w-5 text-cyan-400" />;
      case 'party':
        return <Trophy className="h-5 w-5 text-amber-400" />;
      default:
        return <Sparkles className="h-5 w-5 text-cyan-400" />;
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="w-full flex flex-col gap-3"
      aria-label="CampusOS Superpower Carousel"
    >
      {/* 1. Live Student Statistics Pill Strip */}
      <div className="grid grid-cols-3 gap-2 py-1">
        {STUDENT_STATS.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-md text-center"
            >
              <div className="flex items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
                <span className="font-mono text-xs font-black text-white tracking-tight">
                  {stat.value}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium truncate max-w-full">
                {stat.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 2. Feature Carousel Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border bg-slate-900/60 backdrop-blur-2xl p-4 sm:p-5 transition-all duration-500 ${activeSlide.borderColor}`}
      >
        {/* Top Header of Card */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md">
              {renderIcon(activeSlide.iconType)}
            </div>
            <span className="font-mono text-[11px] font-bold text-slate-400 tracking-wider">
              {activeSlide.superpowerTag}
            </span>
          </div>

          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
            {activeSlide.badge}
          </span>
        </div>

        {/* Title & Subtitle */}
        <h4 className="text-base sm:text-lg font-black text-white tracking-tight font-display">
          {activeSlide.title}
        </h4>
        <p className="text-xs font-semibold text-cyan-300/90 mt-0.5">
          {activeSlide.subtitle}
        </p>

        {/* Description */}
        <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed">
          {activeSlide.description}
        </p>

        {/* Bottom Metric & Navigation */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-mono font-semibold text-slate-300">
            {activeSlide.metricBadge}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Indicators */}
            <div className="flex gap-1 mr-2">
              {SUPERPOWER_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-5 bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                      : 'w-1.5 bg-slate-600 hover:bg-slate-500'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              aria-label="Previous superpower"
              className="h-7 w-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next superpower"
              className="h-7 w-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Inspiring Student Quotes Box */}
      <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950/40 px-3.5 py-2 text-[11px] text-slate-400 italic">
        <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0 not-italic" />
        <span className="line-clamp-1">{activeQuote}</span>
      </div>
    </div>
  );
}

export default AuthFeatureCarousel;
