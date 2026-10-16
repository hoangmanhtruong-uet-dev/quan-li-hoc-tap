'use client';

import React from 'react';
import { Flag, GraduationCap, Flame, Calendar, ArrowRight } from 'lucide-react';
import { type CalendarEvent, type DeadlineItem } from '@/lib/campus-store';

interface SemesterTimelineProps {
  events: CalendarEvent[];
  deadlines: DeadlineItem[];
  onSelectDate: (dateStr: string) => void;
}

export function SemesterTimeline({ events, deadlines, onSelectDate }: SemesterTimelineProps) {
  // Collect major milestones: exams, important deadlines, key classes
  const milestones = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      date: string;
      type: 'exam' | 'deadline' | 'event';
      badge: string;
      color: string;
    }> = [];

    // Deadlines
    for (const d of deadlines) {
      if (d.completed) continue;
      const dDate = d.date || (d.dueDate ? d.dueDate.slice(0, 10) : '');
      if (dDate) {
        list.push({
          id: d.id,
          title: d.title,
          date: dDate,
          type: d.isExam ? 'exam' : 'deadline',
          badge: d.isExam ? 'Kỳ thi' : 'Deadline',
          color: d.isExam ? '#FF3D6E' : '#FF8A3D',
        });
      }
    }

    // Exam events
    for (const e of events) {
      if (e.type === 'exam') {
        list.push({
          id: e.id,
          title: e.title,
          date: e.date,
          type: 'exam',
          badge: 'Thi cử',
          color: '#FF3D6E',
        });
      }
    }

    // Sort by date ascending
    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [events, deadlines]);

  return (
    <div className="rounded-[24px] border-2 border-white/20 bg-[#10101E]/90 p-6 shadow-[8px_8px_0px_#000] hard-border space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Flag className="h-6 w-6 text-aurora-lime" />
            Lộ trình Cột mốc Học kỳ (Semester Roadmap)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Xem toàn bộ các kỳ thi và hạn nộp quan trọng trải dài cả kỳ · Bấm để nhảy đến ngày đó
          </p>
        </div>
      </div>

      {/* Horizontal Milestone Track */}
      <div className="relative overflow-x-auto pb-4 pt-6">
        <div className="flex items-center gap-8 min-w-[750px] relative px-4">
          {/* Track Line */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-[#7C5CFF] via-[#FF3DA5] to-[#C6FF3D] rounded-full opacity-60 z-0" />

          {milestones.map((m, index) => {
            const [year, month, day] = m.date.split('-');
            const isExam = m.type === 'exam';

            return (
              <div
                key={m.id + index}
                onClick={() => onSelectDate(m.date)}
                className="relative z-10 flex flex-col items-center group cursor-pointer"
              >
                {/* Milestone Node */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-transform duration-200 group-hover:scale-110 shadow-[3px_3px_0px_#000] ${
                    isExam
                      ? 'border-[#FF3D6E] bg-[#FF3D6E]/20 text-[#FF3D6E]'
                      : 'border-[#FF8A3D] bg-[#FF8A3D]/20 text-[#FF8A3D]'
                  }`}
                >
                  {isExam ? <GraduationCap className="h-6 w-6" /> : <Flame className="h-6 w-6" />}
                </div>

                {/* Milestone Card */}
                <div className="mt-3 w-40 rounded-xl border border-white/15 bg-[#141426] p-3 text-center shadow-[3px_3px_0px_#000] group-hover:border-aurora-lime transition-colors">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-[9px] font-mono font-bold uppercase mb-1"
                    style={{ backgroundColor: `${m.color}25`, color: m.color }}
                  >
                    {m.badge}
                  </span>
                  <p className="font-heading text-xs font-bold text-foreground truncate">
                    {m.title}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                    {day}/{month}/{year}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
