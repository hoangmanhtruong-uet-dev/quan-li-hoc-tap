'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Clock3, ArrowRight, Flame } from 'lucide-react';
import { type CalendarEvent } from '@/lib/campus-store';
import { EVENT_META } from './smart-filters';

interface UpcomingRailProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

export function UpcomingRail({ events, onSelectEvent }: UpcomingRailProps) {
  const [, setTick] = useState(0);

  // Live countdown update every second
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Next 5 upcoming events from now
  const upcomingEvents = useMemo(() => {
    const active = events.filter((e) => !e.done && e.date >= todayStr);
    active.sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
    return active.slice(0, 5);
  }, [events, todayStr]);

  const getTimeRemaining = (dateStr: string, timeStr: string) => {
    const target = new Date(`${dateStr}T${timeStr || '09:00'}:00`).getTime();
    const diff = target - Date.now();
    if (diff <= 0) return 'Đang diễn ra';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `Còn ${days} ngày`;
    }
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  if (upcomingEvents.length === 0) return null;

  return (
    <section className="rounded-[22px] border-2 border-white/15 bg-[#10101E]/80 p-5 shadow-[6px_6px_0px_#000] hard-border">
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
        <h3 className="font-heading text-base font-extrabold text-foreground flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-aurora-lime" />
          Sự kiện Kế tiếp (Sắp diễn ra)
        </h3>
        <span className="font-mono text-xs text-muted-foreground font-bold">5 việc gần nhất</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {upcomingEvents.map((ev, index) => {
          const meta = EVENT_META[ev.type];
          const remaining = getTimeRemaining(ev.date, ev.start);
          const isNearest = index === 0;

          return (
            <div
              key={ev.id}
              onClick={() => onSelectEvent(ev)}
              className={`relative flex flex-col justify-between rounded-xl border-2 p-3 transition-transform hover:scale-[1.02] cursor-pointer hard-border ${
                isNearest
                  ? 'border-aurora-lime bg-aurora-lime/10 shadow-[3px_3px_0px_#C6FF3D]'
                  : `${meta.border} bg-[#141426] shadow-[2px_2px_0px_#000]`
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="font-mono text-[9px] uppercase font-bold text-muted-foreground">
                    {ev.date}
                  </span>
                  {isNearest && (
                    <span className="flex items-center gap-1 rounded-full bg-aurora-lime/20 px-1.5 py-0.2 font-mono text-[9px] font-black text-aurora-lime">
                      <Flame className="h-2.5 w-2.5" /> TIẾP THEO
                    </span>
                  )}
                </div>

                <h4 className="font-heading text-xs font-bold text-foreground line-clamp-2">
                  {ev.title}
                </h4>
              </div>

              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">{ev.start}</span>
                <span className="font-mono text-[10px] font-extrabold text-orange-400">
                  {remaining}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
