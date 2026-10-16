'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Flame, Clock, MapPin, X, Plus } from 'lucide-react';
import { type CalendarEvent, type EventType } from '@/lib/campus-store';
import { computeDailyLoadScore } from '@/lib/calendar-math';
import { EVENT_META } from './smart-filters';

interface MonthGridProps {
  currentDate: Date;
  selectedDate: string; // YYYY-MM-DD
  events: CalendarEvent[];
  hideWeekends: boolean;
  onSelectDate: (dateStr: string) => void;
  onEventMove: (eventId: string, targetDateStr: string) => void;
  onQuickCreate: (dateStr: string) => void;
}

export function MonthGrid({
  currentDate,
  selectedDate,
  events,
  hideWeekends,
  onSelectDate,
  onEventMove,
  onQuickCreate,
}: MonthGridProps) {
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [fanPopoverDate, setFanPopoverDate] = useState<string | null>(null);

  // Today ISO key
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Compute 42 grid cells (Monday-aligned)
  const monthCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const dayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
    const start = new Date(firstDay);
    start.setDate(start.getDate() - dayOfWeek);

    const cells: Array<{ date: Date; dateStr: string; inMonth: boolean; isWeekend: boolean }> = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;
      const dayIndex = (d.getDay() + 6) % 7;
      const isWeekend = dayIndex >= 5;

      if (!hideWeekends || !isWeekend) {
        cells.push({
          date: d,
          dateStr,
          inMonth: d.getMonth() === month,
          isWeekend,
        });
      }
    }
    return cells;
  }, [currentDate, hideWeekends]);

  const weekdays = useMemo(() => {
    if (hideWeekends) return ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
    return ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  }, [hideWeekends]);

  // Group events by dateStr
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) || [];
      list.push(e);
      map.set(e.date, list);
    }
    // Sort each day's events by start time
    map.forEach((list) => {
      list.sort((a, b) => a.start.localeCompare(b.start));
    });
    return map;
  }, [events]);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.stopPropagation();
    setDraggedEventId(eventId);
    e.dataTransfer.setData('text/plain', eventId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, dateStr: string) => {
    if (dragOverDate === dateStr) {
      setDragOverDate(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain') || draggedEventId;
    if (eventId) {
      onEventMove(eventId, dateStr);
    }
    setDraggedEventId(null);
    setDragOverDate(null);
  };

  return (
    <div className="relative w-full min-w-0 overflow-hidden rounded-[24px] border-2 border-white/20 bg-[#10101E]/90 p-4 shadow-[8px_8px_0px_#000] hard-border">
      {/* Weekday Table Header */}
      <div
        className={`grid border-b-2 border-white/10 pb-3 text-center text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground ${
          hideWeekends ? 'grid-cols-5' : 'grid-cols-7'
        }`}
      >
        {weekdays.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div
        className={`grid gap-2 pt-3 ${
          hideWeekends ? 'grid-cols-5' : 'grid-cols-7'
        }`}
      >
        {monthCells.map((cell) => {
          const dayEvents = eventsByDate.get(cell.dateStr) || [];
          const loadInfo = computeDailyLoadScore(dayEvents, [], cell.dateStr);
          const hasExam = dayEvents.some((e) => e.type === 'exam');
          const isToday = cell.dateStr === todayStr;
          const isSelected = cell.dateStr === selectedDate;
          const isDragOver = cell.dateStr === dragOverDate;

          const visibleEvents = dayEvents.slice(0, 3);
          const moreCount = dayEvents.length - 3;

          return (
            <div
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              onDoubleClick={() => onQuickCreate(cell.dateStr)}
              onDragOver={(e) => handleDragOver(e, cell.dateStr)}
              onDragLeave={(e) => handleDragLeave(e, cell.dateStr)}
              onDrop={(e) => handleDrop(e, cell.dateStr)}
              className={`group relative flex flex-col justify-between min-h-[110px] sm:min-h-[125px] rounded-[18px] border p-2 transition-all cursor-pointer hard-border ${
                !cell.inMonth ? 'opacity-35 bg-black/20 border-white/5' : 'bg-[#141424] border-white/10'
              } ${
                isSelected
                  ? 'border-2 border-aurora-lime bg-aurora-lime/10 shadow-[3px_3px_0px_#C6FF3D] scale-[1.01] z-10'
                  : 'hover:border-white/30 hover:bg-[#18182b]'
              } ${
                isToday ? 'ring-2 ring-aurora-lime ring-offset-2 ring-offset-[#10101E]' : ''
              } ${
                isDragOver ? 'border-2 border-dashed border-[#3DE8FF] bg-[#3DE8FF]/15 scale-[1.02]' : ''
              }`}
            >
              {/* Day Header: Date Number + Badges */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-mono font-bold ${
                    isToday
                      ? 'bg-aurora-lime text-black shadow-[1px_1px_0px_#000]'
                      : isSelected
                      ? 'text-aurora-lime font-extrabold'
                      : 'text-foreground'
                  }`}
                >
                  {cell.date.getDate()}
                </span>

                <div className="flex items-center gap-1">
                  {/* Exam Flame Ping */}
                  {hasExam && (
                    <span
                      title="Có bài thi / Deadline quan trọng!"
                      className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500/20 text-rose-400"
                    >
                      <Flame className="h-2.5 w-2.5 fill-rose-400 animate-pulse" />
                    </span>
                  )}
                  {/* Load Score Indicator Dot */}
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: loadInfo.color }}
                    title={`Mức tải: ${loadInfo.label} (${loadInfo.score} điểm)`}
                  />
                </div>
              </div>

              {/* Event Sticker Pills (Up to 3) */}
              <div className="my-1.5 space-y-1 overflow-hidden">
                {visibleEvents.map((ev) => {
                  const meta = EVENT_META[ev.type];
                  return (
                    <div
                      key={ev.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ev.id)}
                      title={`${ev.title}\n⏰ ${ev.start} - ${ev.end}\n📍 ${ev.location || 'Chưa có địa điểm'}`}
                      className={`group/pill relative flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-all border ${meta.border} ${meta.bg} hover:brightness-125 cursor-grab active:cursor-grabbing`}
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
                      <span className="shrink-0 font-mono text-[9px] opacity-80">{ev.start}</span>
                      <span className="truncate">{ev.title}</span>
                    </div>
                  );
                })}

                {/* +N More Fan Popover Trigger */}
                {moreCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFanPopoverDate(fanPopoverDate === cell.dateStr ? null : cell.dateStr);
                    }}
                    className="block w-full rounded bg-white/10 px-1 py-0.5 text-center font-mono text-[9px] font-bold text-muted-foreground hover:bg-white/20 hover:text-foreground"
                  >
                    +{moreCount} sự kiện khác
                  </button>
                )}
              </div>

              {/* Bottom Load Heat-Bar (Green -> Orange -> Red) */}
              <div className="mt-auto pt-1">
                <div
                  className="h-1 w-full rounded-full overflow-hidden bg-black/40"
                  title={`Độ bận rộn: ${loadInfo.label}`}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(15, (loadInfo.score / 80) * 100))}%`,
                      backgroundColor: loadInfo.color,
                    }}
                  />
                </div>
              </div>

              {/* Fan Popover for +N overflow items */}
              {fanPopoverDate === cell.dateStr && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-1/2 bottom-2 z-30 w-56 -translate-x-1/2 rounded-2xl border-2 border-aurora-lime/60 bg-[#121222] p-3 shadow-[6px_6px_0px_#000] hard-border animate-fade-in"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
                    <span className="font-mono text-[11px] font-bold text-aurora-lime">
                      Ngày {cell.date.getDate()}/{cell.date.getMonth() + 1} ({dayEvents.length} việc)
                    </span>
                    <button
                      type="button"
                      onClick={() => setFanPopoverDate(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {dayEvents.map((ev) => {
                      const meta = EVENT_META[ev.type];
                      return (
                        <div
                          key={ev.id}
                          className={`rounded-lg border p-1.5 text-xs ${meta.border} ${meta.bg}`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="truncate">{ev.title}</span>
                            <span className="font-mono text-[10px]">{ev.start}</span>
                          </div>
                          {ev.location && (
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-2.5 w-2.5" /> {ev.location}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFanPopoverDate(null);
                      onQuickCreate(cell.dateStr);
                    }}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-aurora-lime py-1 font-mono text-[11px] font-bold text-black"
                  >
                    <Plus className="h-3 w-3" /> Thêm sự kiện
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
