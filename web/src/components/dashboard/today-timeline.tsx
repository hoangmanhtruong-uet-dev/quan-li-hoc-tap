'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useCampusStore, type CalendarEvent } from '@/lib/campus-store';
import {
  CalendarDays,
  Clock3,
  MapPin,
  ExternalLink,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  Play,
  X,
  Check,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TodayTimelineProps {
  onStartFocus?: (minutes?: number) => void;
  onOpenScanner?: () => void;
}

export function TodayTimeline({ onStartFocus, onOpenScanner }: TodayTimelineProps = {}) {
  const { state } = useCampusStore();
  const [nowTime, setNowTime] = useState({ hours: 10, minutes: 15, seconds: 0 });
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Quick Action Modal states
  const [activeModal, setActiveModal] = useState<{
    type: 'enter' | 'doc' | 'note';
    item: CalendarEvent;
  } | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [toastNote, setToastNote] = useState<string | null>(null);

  // 1. Tick clock every second
  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const d = new Date();
      setNowTime({
        hours: d.getHours(),
        minutes: d.getMinutes(),
        seconds: d.getSeconds(),
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentMinutesTotal = nowTime.hours * 60 + nowTime.minutes;

  // 2. Filter today's classes and events
  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const todayClasses = useMemo(() => {
    const fromStore = state.events.filter(
      (e) => e.date === todayIso && (e.type === 'class' || e.type === 'study')
    );
    return [...fromStore].sort((a, b) => a.start.localeCompare(b.start));
  }, [state.events, todayIso]);

  // 3. Mouse Drag-to-Scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const scrollStep = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const offset = direction === 'left' ? -320 : 320;
    containerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // 4. Time conversion helper
  const parseTimeToMin = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  return (
    <section className="w-full min-w-0 space-y-4" aria-label="S2 Today Timeline">
      {/* Toast Alert */}
      {toastNote && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-[#121220]/95 border-2 border-aurora-lime text-foreground rounded-2xl shadow-[6px_6px_0px_#000] font-sans text-xs max-w-sm animate-fade-in hard-border">
          {toastNote}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-xl md:text-2xl font-bold tracking-tight text-foreground">
            <CalendarDays className="h-6 w-6 text-blue-400" />
            Lịch trình hôm nay
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-sans">
            {todayClasses.length > 0
              ? `${todayClasses.length} tiết học được lên lịch hôm nay`
              : 'Không có lịch học nào hôm nay'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Real-time Clock Bead */}
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-aurora-lime/30 bg-aurora-lime/10 px-3 py-1 font-mono text-xs font-bold text-aurora-lime">
            <span className="h-2 w-2 rounded-full bg-aurora-lime animate-ping" />
            <span suppressHydrationWarning>
              {String(nowTime.hours).padStart(2, '0')}:{String(nowTime.minutes).padStart(2, '0')}:
              {String(nowTime.seconds).padStart(2, '0')}
            </span>
          </div>

          {/* AI Schedule Scanner Quick Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenScanner}
            className="h-9 rounded-xl border border-cyan-400/30 bg-cyan-500/10 font-bold text-xs text-cyan-300 hover:bg-cyan-500/20 shadow-sm transition-all"
          >
            <Zap className="mr-1.5 h-3.5 w-3.5 text-cyan-400" />
            Quét TKB bằng AI
          </Button>

          <button
            onClick={() => scrollStep('left')}
            aria-label="Cuộn sang trái"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollStep('right')}
            aria-label="Cuộn sang phải"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <Link
            href="/calendar"
            className="ml-2 hidden text-xs font-semibold text-aurora-lime hover:underline md:inline-block font-heading"
          >
            Mở lịch đầy đủ →
          </Link>
        </div>
      </div>

      {/* Horizontal Draggable Timeline Container */}
      {todayClasses.length > 0 ? (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`relative flex gap-5 overflow-x-auto pb-4 pt-2 select-none scrollbar-thin ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {todayClasses.map((item, index) => {
            const startMin = parseTimeToMin(item.start);
            const endMin = parseTimeToMin(item.end);
            const isActive = currentMinutesTotal >= startMin && currentMinutesTotal <= endMin;
            const isPast = currentMinutesTotal > endMin;
            const isUpcoming = currentMinutesTotal < startMin;

            // Progress calculation for active class
            const progressPercent = isActive
              ? Math.min(100, Math.max(0, Math.round(((currentMinutesTotal - startMin) / (endMin - startMin)) * 100)))
              : isPast
              ? 100
              : 0;

            // Countdown calculation for upcoming class
            const minutesToStart = isUpcoming ? startMin - currentMinutesTotal : 0;
            const countdownText =
              minutesToStart > 60
                ? `Bắt đầu sau ${Math.floor(minutesToStart / 60)}h ${minutesToStart % 60}p`
                : `Bắt đầu sau ${minutesToStart} phút`;

            return (
              <TimelineCard
                key={item.id || index}
                item={item}
                isActive={isActive}
                isPast={isPast}
                isUpcoming={isUpcoming}
                progressPercent={progressPercent}
                countdownText={countdownText}
                reducedMotion={state.reducedMotion}
                onOpenAction={(type) => setActiveModal({ type, item })}
                onStartFocus={onStartFocus}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
          <CalendarDays className="h-8 w-8 text-cyan-400/70 mb-2" />
          <p className="font-heading text-sm font-bold text-foreground">
            Hôm nay bạn không có lịch học nào
          </p>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            Thêm lịch học hoặc quét ảnh thời khóa biểu bằng AI để tự động xếp lịch học theo tuần.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {onOpenScanner && (
              <Button
                onClick={onOpenScanner}
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-xs"
              >
                <Zap className="h-3.5 w-3.5" /> Quét TKB bằng AI
              </Button>
            )}
            <Link
              href="/calendar"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-white/10"
            >
              Mở Lịch trình →
            </Link>
          </div>
        </div>
      )}

      {/* Quick Action Interactive Modals */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setActiveModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-card border border-white/20 rounded-2xl shadow-2xl p-6 space-y-4 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-foreground">
                {activeModal.type === 'enter' && `Thông tin lớp: ${activeModal.item.title}`}
                {activeModal.type === 'doc' && `Tài liệu môn: ${activeModal.item.title}`}
                {activeModal.type === 'note' && `Ghi chú nhanh: ${activeModal.item.title}`}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {activeModal.type === 'enter' && (
              <div className="space-y-3 text-xs text-muted-foreground font-sans">
                <p>
                  Thời gian: <strong className="text-foreground font-mono">{activeModal.item.start} - {activeModal.item.end}</strong>
                </p>
                <p>
                  Địa điểm: <strong className="text-foreground">{activeModal.item.location || 'Giảng đường'}</strong>
                </p>
                <p>
                  Hình thức: <span className="text-aurora-cyan">Học trực tiếp trên lớp</span>
                </p>
                <div className="pt-2 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setActiveModal(null)}>Đóng</Button>
                  <Button
                    className="bg-aurora-lime text-black font-bold hover:bg-aurora-lime/90"
                    onClick={() => {
                      setActiveModal(null);
                      if (onStartFocus) onStartFocus(45);
                    }}
                  >
                    Bắt đầu phiên học ngay
                  </Button>
                </div>
              </div>
            )}

            {activeModal.type === 'doc' && (
              <div className="space-y-3 text-xs font-sans">
                <p className="text-muted-foreground">Tài liệu học tập & Slide bài giảng:</p>
                <ul className="space-y-2 text-foreground font-medium">
                  <li className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <span>📄 Slide Chương 4: Giao thức mạng</span>
                    <button
                      onClick={() => {
                        setToastNote('Đang tải Slide Chương 4...');
                        setTimeout(() => setToastNote(null), 3000);
                      }}
                      className="text-aurora-lime hover:underline font-bold"
                    >
                      Tải về
                    </button>
                  </li>
                  <li className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <span>📑 Bài tập chia Subnet IP & CIDR</span>
                    <button
                      onClick={() => {
                        setToastNote('Đang mở bài tập Subnetting...');
                        setTimeout(() => setToastNote(null), 3000);
                      }}
                      className="text-aurora-lime hover:underline font-bold"
                    >
                      Mở
                    </button>
                  </li>
                </ul>
                <div className="pt-2 flex justify-end">
                  <Button variant="outline" onClick={() => setActiveModal(null)}>Đóng</Button>
                </div>
              </div>
            )}

            {activeModal.type === 'note' && (
              <div className="space-y-3 text-xs font-sans">
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Ghi chú nhanh lời giảng viên, bài tập về nhà..."
                  className="w-full rounded-xl border border-white/20 bg-black/40 p-3 text-sm text-foreground focus:border-aurora-lime focus:outline-none placeholder:text-muted-foreground"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setActiveModal(null)}>Hủy</Button>
                  <Button
                    className="bg-aurora-lime text-black font-bold hover:bg-aurora-lime/90"
                    onClick={() => {
                      setToastNote(`Đã lưu ghi chú cho ${activeModal.item.title}!`);
                      setTimeout(() => setToastNote(null), 3000);
                      setActiveModal(null);
                      setNoteContent('');
                    }}
                  >
                    Lưu ghi chú
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// Subcomponent: 3D Tilt Card for Class Item
interface TimelineCardProps {
  item: CalendarEvent;
  isActive: boolean;
  isPast: boolean;
  isUpcoming: boolean;
  progressPercent: number;
  countdownText: string;
  reducedMotion: boolean;
  onOpenAction: (type: 'enter' | 'doc' | 'note') => void;
  onStartFocus?: (minutes?: number) => void;
}

function TimelineCard({
  item,
  isActive,
  isPast,
  isUpcoming,
  progressPercent,
  countdownText,
  reducedMotion,
  onOpenAction,
  onStartFocus,
}: TimelineCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    cardRef.current.style.transform = `perspective(800px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) translateY(-3px)`;
  };

  const handlePointerLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative min-w-[290px] max-w-[320px] shrink-0 rounded-2xl border p-5 transition-all duration-150 flex flex-col justify-between ${
        isActive
          ? 'border-aurora-lime/60 bg-card shadow-[0_0_24px_rgba(198,255,61,0.15)] ring-1 ring-aurora-lime/40'
          : isPast
          ? 'border-white/5 bg-card/30 opacity-60'
          : 'border-white/10 bg-card/70 hover:border-white/25 shadow-sm'
      }`}
    >
      <div>
        {/* Header: Time & Status Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-sm font-black text-foreground">
            {item.start} - {item.end}
          </div>

          {isActive && (
            <Badge className="bg-aurora-lime/20 text-aurora-lime border-aurora-lime/40 font-bold">
              ● Đang diễn ra
            </Badge>
          )}
          {isPast && (
            <Badge variant="outline" className="text-muted-foreground border-white/10">
              Đã xong
            </Badge>
          )}
          {isUpcoming && (
            <Badge variant="secondary" suppressHydrationWarning className="text-[11px] font-semibold bg-white/10 text-slate-300">
              <Clock3 className="mr-1 h-3 w-3" />
              {countdownText}
            </Badge>
          )}
        </div>

        {/* Title & Location */}
        <h3 className="font-heading text-lg font-bold text-foreground leading-snug line-clamp-1">
          {item.title}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
          <span className="truncate">{item.location || 'Chưa có phòng'}</span>
        </p>

        {/* Active Class Progress Bar */}
        {isActive && (
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-aurora-lime">
              <span>Tiến độ ca học</span>
              <span suppressHydrationWarning>{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-aurora-cyan via-aurora-violet to-aurora-lime transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Footer */}
      <div className="mt-5 border-t border-white/10 pt-3 flex items-center justify-between gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2.5 text-xs font-semibold hover:border-aurora-lime hover:text-aurora-lime border-white/15 bg-white/5"
          onClick={() => onOpenAction('enter')}
        >
          <ExternalLink className="mr-1 h-3 w-3" /> Vào lớp
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onOpenAction('doc')}
        >
          <BookOpen className="mr-1 h-3 w-3" /> Tài liệu
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onOpenAction('note')}
          title="Ghi chú nhanh"
        >
          <FileText className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
