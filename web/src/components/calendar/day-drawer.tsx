'use client';

import React, { useState } from 'react';
import { X, Play, Clock, MapPin, Check, Plus, Trash2 } from 'lucide-react';
import { type CalendarEvent, useCampusStore } from '@/lib/campus-store';
import { Button } from '@/components/ui/button';
import { EVENT_META } from './smart-filters';

interface DayDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  events: CalendarEvent[];
  onStartFocus: (minutes?: number) => void;
  onOpenCreate: (dateStr: string) => void;
  onToggleDone: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
}

export function DayDrawer({
  isOpen,
  onClose,
  selectedDate,
  events,
  onStartFocus,
  onOpenCreate,
  onToggleDone,
  onDeleteEvent,
}: DayDrawerProps) {
  const { update } = useCampusStore();
  const [floatingXp, setFloatingXp] = useState<string | null>(null);

  if (!isOpen) return null;

  const [y, m, d] = selectedDate.split('-').map(Number);
  const dateObj = new Date(y!, m! - 1, d!);
  const weekdayName = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(dateObj);

  const handleChecklistToggle = (eventId: string, checkIndex: number) => {
    update((prev) => ({
      events: prev.events.map((ev) => {
        if (ev.id !== eventId || !ev.checklist) return ev;
        const nextChecklist = [...ev.checklist];
        const item = nextChecklist[checkIndex];
        if (item) {
          nextChecklist[checkIndex] = { ...item, done: !item.done };
        }
        return { ...ev, checklist: nextChecklist };
      }),
    }));
  };

  const handleCompleteTicket = (eventId: string) => {
    onToggleDone(eventId);
    setFloatingXp(eventId);
    setTimeout(() => setFloatingXp(null), 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-drawer-title"
        className="relative flex h-full w-full max-w-md flex-col border-l-2 border-white/20 bg-[#10101E] p-6 shadow-2xl animate-slide-left hard-border"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-aurora-lime font-bold">
              CHI TIẾT NGÀY
            </p>
            <h2 id="day-drawer-title" className="font-heading text-2xl font-black capitalize text-foreground mt-0.5">
              {weekdayName}
            </h2>
            <p className="font-mono text-xs text-muted-foreground">
              {d} tháng {m}, {y} · {events.length} sự kiện
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-muted-foreground hover:text-foreground"
            aria-label="Đóng ngăn chi tiết"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Button: Add new event to this day */}
        <div className="py-4 flex gap-2">
          <Button
            size="sm"
            onClick={() => onOpenCreate(selectedDate)}
            className="flex-1 bg-aurora-lime text-black font-bold text-xs shadow-[2px_2px_0px_#000]"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Thêm sự kiện ngày này
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStartFocus(25)}
            className="border-white/20 bg-white/5 text-xs font-bold"
          >
            <Play className="mr-1 h-3 w-3 fill-current" /> Học ngay (25p)
          </Button>
        </div>

        {/* Events Tickets List */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Clock className="h-10 w-10 mb-2 opacity-50" />
              <p className="font-bold text-sm">Chưa có lịch nào hôm nay</p>
              <p className="text-xs mt-1">Bạn có thể thảnh thơi hoặc lên kế hoạch học tập mới.</p>
            </div>
          ) : (
            events.map((item) => {
              const meta = EVENT_META[item.type];
              const isDone = item.done;

              return (
                <div
                  key={item.id}
                  className={`relative rounded-2xl border-2 p-4 transition-all hard-border ${
                    isDone
                      ? 'border-white/10 bg-black/40 opacity-70'
                      : `${meta.border} ${meta.bg} shadow-[4px_4px_0px_#000]`
                  }`}
                >
                  {/* Floating +XP notification */}
                  {floatingXp === item.id && (
                    <div className="absolute right-4 top-2 rounded-full border border-aurora-lime bg-aurora-lime px-2.5 py-0.5 font-mono text-[11px] font-black text-black animate-slide-up">
                      +30 XP 🔥
                    </div>
                  )}

                  {/* Ticket Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-mono font-bold uppercase">
                        {meta.label}
                      </span>
                      <h4
                        className={`font-heading text-base font-extrabold text-foreground mt-1 ${
                          isDone ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCompleteTicket(item.id)}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform active:scale-90 ${
                          isDone
                            ? 'border-emerald-400 bg-emerald-400 text-black'
                            : 'border-white/30 hover:border-aurora-lime'
                        }`}
                      >
                        {isDone && <Check className="h-4 w-4 stroke-[3]" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteEvent(item.id)}
                        className="p-1 text-muted-foreground hover:text-rose-400"
                        title="Xóa sự kiện"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Time & Place */}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" /> {item.start} - {item.end}
                    </span>
                    {item.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {item.location}
                      </span>
                    )}
                  </div>

                  {/* Checklist Sub-items */}
                  {item.checklist && item.checklist.length > 0 && (
                    <div className="mt-3 border-t border-white/10 pt-2 space-y-1">
                      <p className="text-[10px] font-mono uppercase text-muted-foreground font-bold">
                        Checklist con:
                      </p>
                      {item.checklist.map((c, cIdx) => (
                        <label
                          key={c.id || cIdx}
                          className="flex items-center gap-2 text-xs text-foreground/90 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={c.done}
                            onChange={() => handleChecklistToggle(item.id, cIdx)}
                            className="rounded border-white/20 bg-black/40 text-aurora-lime focus:ring-0"
                          />
                          <span className={c.done ? 'line-through text-muted-foreground' : ''}>
                            {c.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Quick Action: Vào học */}
                  <div className="mt-3 pt-2 border-t border-white/10 flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onStartFocus(45)}
                      className="h-8 gap-1.5 text-xs font-bold text-aurora-lime hover:bg-aurora-lime/10"
                    >
                      <Play className="h-3 w-3 fill-current" /> Vào học với Mèo Giám Thị
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}
