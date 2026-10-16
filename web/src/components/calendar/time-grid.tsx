'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle, Sparkles, Plus, Play } from 'lucide-react';
import { type CalendarEvent } from '@/lib/campus-store';
import { timeToMinutes, detectConflicts, findEarliestResolutionSlot } from '@/lib/calendar-math';
import { EVENT_META } from './smart-filters';

interface TimeGridProps {
  currentDate: Date;
  selectedDate: string;
  isWeekView: boolean;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onSlotClick: (dateStr: string, timeStr: string) => void;
  onStartFocus: (minutes?: number) => void;
  onResolveConflict: (eventToMove: CalendarEvent, newSlot: { start: string; end: string }) => void;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 to 23:00

export function TimeGrid({
  currentDate,
  selectedDate,
  isWeekView,
  events,
  onSelectEvent,
  onSlotClick,
  onStartFocus,
  onResolveConflict,
}: TimeGridProps) {
  const [nowMinute, setNowMinute] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  // Keep now line live every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setNowMinute(d.getHours() * 60 + d.getMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Compute days to display (7 days for week, 1 day for day)
  const columns = useMemo(() => {
    if (!isWeekView) {
      const parts = selectedDate.split('-').map(Number);
      const d = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
      const dayName = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(d);
      return [{ date: d, dateStr: selectedDate, label: `${dayName}, ${d.getDate()}/${d.getMonth() + 1}` }];
    }

    // Week view: calculate Monday of current week
    const d = new Date(currentDate);
    const dayOfWeek = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(monday.getDate() - dayOfWeek);

    const result = [];
    const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const y = day.getFullYear();
      const m = String(day.getMonth() + 1).padStart(2, '0');
      const dayNum = String(day.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;
      result.push({
        date: day,
        dateStr,
        label: `${weekdays[i]} ${day.getDate()}/${day.getMonth() + 1}`,
      });
    }
    return result;
  }, [currentDate, isWeekView, selectedDate]);

  // Find schedule conflicts across columns
  const conflicts = useMemo(() => {
    return detectConflicts(events);
  }, [events]);

  const conflictingEventIds = useMemo(() => {
    const set = new Set<string>();
    for (const c of conflicts) {
      set.add(c.eventA.id);
      set.add(c.eventB.id);
    }
    return set;
  }, [conflicts]);

  return (
    <div className="relative overflow-x-auto rounded-[24px] border-2 border-white/20 bg-[#10101E]/95 p-4 shadow-[8px_8px_0px_#000] hard-border">
      {/* Conflicts Alert Bar */}
      {conflicts.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-500/50 bg-rose-500/10 p-3 text-xs text-rose-300">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>Phát hiện {conflicts.length} xung đột trùng giờ!</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {conflicts.slice(0, 2).map((c, idx) => {
              const res = findEarliestResolutionSlot(c.eventB, events);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (res) onResolveConflict(c.eventB, res);
                  }}
                  className="rounded-lg bg-rose-500/20 px-2 py-1 font-mono font-bold hover:bg-rose-500/30"
                >
                  Dời &quot;{c.eventB.title}&quot; {res ? `sang ${res.start}` : 'giờ khác'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="min-w-[700px]">
        {/* Sticky Headers */}
        <div className="grid grid-cols-[60px_1fr] border-b-2 border-white/10 pb-2">
          <div className="text-right pr-3 text-[11px] font-mono text-muted-foreground">GIỜ</div>
          <div
            className="grid gap-2 text-center"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {columns.map((col) => {
              const isToday = col.dateStr === todayStr;
              return (
                <div
                  key={col.dateStr}
                  className={`py-1 rounded-xl text-xs font-mono font-bold ${
                    isToday
                      ? 'bg-aurora-lime text-black shadow-[2px_2px_0px_#000]'
                      : 'text-foreground bg-white/5'
                  }`}
                >
                  {col.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Grid Matrix */}
        <div className="relative mt-2">
          {/* Real-time Now Line */}
          {nowMinute >= 360 && nowMinute <= 1380 && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-30 flex items-center"
              style={{
                top: `${((nowMinute - 360) / 1020) * 100}%`,
              }}
            >
              <div className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping -ml-1" />
              <div className="h-0.5 flex-1 bg-rose-500 shadow-[0_0_8px_#FF3D6E]" />
            </div>
          )}

          {/* Hour Rows */}
          {HOURS.map((hour) => {
            const timeStr = `${String(hour).padStart(2, '0')}:00`;
            return (
              <div key={hour} className="grid grid-cols-[60px_1fr] min-h-[56px] border-b border-white/5">
                {/* Hour Label */}
                <div className="text-right pr-3 pt-1 text-xs font-mono text-muted-foreground/70">
                  {timeStr}
                </div>

                {/* Day Columns for this hour */}
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
                >
                  {columns.map((col) => {
                    // Events starting or active in this hour slot
                    const dayEvents = events.filter((e) => e.date === col.dateStr);
                    const matchingEvent = dayEvents.find((e) => {
                      const startM = timeToMinutes(e.start);
                      const currentSlotM = hour * 60;
                      return startM >= currentSlotM && startM < currentSlotM + 60;
                    });

                    if (matchingEvent) {
                      const meta = EVENT_META[matchingEvent.type];
                      const isConflicted = conflictingEventIds.has(matchingEvent.id);

                      return (
                        <div
                          key={matchingEvent.id}
                          onClick={() => onSelectEvent(matchingEvent)}
                          className={`relative m-0.5 rounded-xl border p-2 shadow-[2px_2px_0px_#000] cursor-pointer transition-transform hover:scale-[1.02] ${
                            isConflicted
                              ? 'border-2 border-rose-500 bg-rose-950/40 text-rose-300 animate-pulse'
                              : `${meta.border} ${meta.bg}`
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-xs">
                            <span className="truncate">{matchingEvent.title}</span>
                            <span className="font-mono text-[10px]">
                              {matchingEvent.start} - {matchingEvent.end}
                            </span>
                          </div>
                          {matchingEvent.location && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
                              📍 {matchingEvent.location}
                            </p>
                          )}
                        </div>
                      );
                    }

                    // Empty slot: free slot pattern
                    return (
                      <div
                        key={col.dateStr}
                        onClick={() => onSlotClick(col.dateStr, timeStr)}
                        className="group relative flex items-center justify-center rounded-lg border border-dashed border-white/5 bg-white/[0.02] hover:border-aurora-lime/50 hover:bg-aurora-lime/5 transition-colors cursor-pointer"
                      >
                        <div className="hidden group-hover:flex items-center gap-1 text-[11px] font-mono text-aurora-lime font-bold">
                          <Plus className="h-3 w-3" />
                          <span>Học</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
