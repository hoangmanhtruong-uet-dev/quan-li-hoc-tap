'use client';

import React from 'react';
import { CalendarDays, Clock3, MapPin, Check, Plus, ArrowRight } from 'lucide-react';
import { type CalendarEvent } from '@/lib/campus-store';
import { EVENT_META } from './smart-filters';

interface AgendaViewProps {
  events: CalendarEvent[];
  selectedDate: string;
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectDate: (dateStr: string) => void;
  onToggleDone: (eventId: string) => void;
  onOpenCreate: (dateStr?: string) => void;
}

export function AgendaView({
  events,
  selectedDate,
  onSelectEvent,
  onSelectDate,
  onToggleDone,
  onOpenCreate,
}: AgendaViewProps) {
  // Group events by date
  const groupedEvents = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const sorted = [...events].sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
    for (const e of sorted) {
      const list = map.get(e.date) || [];
      list.push(e);
      map.set(e.date, list);
    }
    return Array.from(map.entries());
  }, [events]);

  if (groupedEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] border-2 border-white/15 bg-[#121222]/80 p-12 text-center hard-border">
        <CalendarDays className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="font-heading text-lg font-bold text-foreground">Chưa có sự kiện nào</h3>
        <p className="mt-1 text-xs text-muted-foreground">Tạo sự kiện hoặc dùng AI xếp lịch để lấp đầy kế hoạch học tập.</p>
        <button
          type="button"
          onClick={() => onOpenCreate()}
          className="mt-4 rounded-xl bg-aurora-lime px-4 py-2 font-mono text-xs font-bold text-black shadow-[3px_3px_0px_#000]"
        >
          + Thêm sự kiện mới
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedEvents.map(([dateStr, dayEvents]) => {
        const isSelected = dateStr === selectedDate;
        const [y, m, d] = dateStr.split('-').map(Number);
        const dateObj = new Date(y!, m! - 1, d!);
        const weekdayName = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(dateObj);

        return (
          <div
            key={dateStr}
            className={`rounded-[22px] border-2 p-5 transition-all hard-border ${
              isSelected
                ? 'border-aurora-lime bg-[#141426] shadow-[6px_6px_0px_#C6FF3D]'
                : 'border-white/15 bg-[#10101E]/80 shadow-[4px_4px_0px_#000]'
            }`}
          >
            {/* Sticky Date Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div
                onClick={() => onSelectDate(dateStr)}
                className="flex items-baseline gap-3 cursor-pointer group"
              >
                <span className="font-heading text-xl font-extrabold capitalize text-foreground group-hover:text-aurora-lime transition-colors">
                  {weekdayName}
                </span>
                <span className="font-mono text-sm font-bold text-muted-foreground">
                  {d} tháng {m}, {y}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onOpenCreate(dateStr)}
                className="flex items-center gap-1 text-xs font-mono font-bold text-aurora-lime hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Thêm
              </button>
            </div>

            {/* Day Events List */}
            <div className="space-y-2.5">
              {dayEvents.map((item) => {
                const meta = EVENT_META[item.type];
                const Icon = meta.icon;
                const isDone = item.done;

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectEvent(item)}
                    className={`flex items-center gap-4 rounded-xl border-2 p-3.5 transition-transform hover:scale-[1.01] cursor-pointer hard-border ${
                      isDone
                        ? 'opacity-60 bg-black/30 border-white/10'
                        : `${meta.border} ${meta.bg} shadow-[2px_2px_0px_#000]`
                    }`}
                  >
                    {/* Completion Check Circle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleDone(item.id);
                      }}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-transform active:scale-90 ${
                        isDone
                          ? 'border-emerald-400 bg-emerald-400 text-black'
                          : 'border-white/30 hover:border-aurora-lime'
                      }`}
                    >
                      {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-heading text-sm font-bold ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {item.title}
                        </span>
                        <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-mono font-bold">
                          {meta.label}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock3 className="h-3 w-3" /> {item.start} - {item.end}
                        </span>
                        {item.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {item.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
