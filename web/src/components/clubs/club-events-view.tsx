'use client';

import React, { useState } from 'react';
import { ClubDetail, ClubEvent, generateIcsForEvent } from '@/lib/club-engine';
import { EventCreateModal } from './event-create-modal';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Download,
  Plus,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface ClubEventsViewProps {
  club: ClubDetail;
  onToggleRsvp: (eventId: string, userId?: string) => { success: boolean; isAttending: boolean; error?: string };
  onCreateEvent: (ev: Omit<ClubEvent, 'id' | 'attendeeIds'>) => void;
}

export function ClubEventsView({ club, onToggleRsvp, onCreateEvent }: ClubEventsViewProps) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const currentUserId = 'ctc-m1'; // Standard authenticated student ID

  const todayStr = '2026-10-16';

  const filteredEvents = club.events.filter((ev) => {
    if (filter === 'upcoming') return ev.date >= todayStr;
    if (filter === 'past') return ev.date < todayStr;
    return true;
  });

  const handleRsvpClick = (eventId: string) => {
    const res = onToggleRsvp(eventId, currentUserId);
    if (!res.success && res.error) {
      setStatusMessage(res.error);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleDownloadIcs = (event: ClubEvent) => {
    const icsContent = generateIcsForEvent(event, club.name);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${club.shortName}-${event.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Alert toast if any */}
      {statusMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-300 backdrop-blur-md">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Action Bar & Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-card/40 p-1 backdrop-blur-md">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tất cả ({club.events.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === 'upcoming'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sắp diễn ra ({club.events.filter((e) => e.date >= todayStr).length})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === 'past'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Đã kết thúc ({club.events.filter((e) => e.date < todayStr).length})
          </button>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Lên lịch sự kiện mới</span>
        </button>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-card/30 p-12 text-center backdrop-blur-2xl">
          <Calendar className="h-10 w-10 text-slate-500 mb-3" />
          <h3 className="text-base font-bold text-white">Chưa có sự kiện nào</h3>
          <p className="mt-1 text-xs text-slate-400">
            Hiện tại không có sự kiện nào trong danh mục này. Hãy bấm tạo sự kiện mới!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredEvents.map((event) => {
            const isAttending = event.attendeeIds.includes(currentUserId);
            const isPast = event.date < todayStr;
            const attendeePercentage = Math.min(
              100,
              Math.round((event.attendeeIds.length / event.maxAttendees) * 100),
            );

            return (
              <div
                key={event.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400/30 hover:bg-card/60 shadow-xl shadow-cyan-950/10"
              >
                {/* Event Cover Banner */}
                <div
                  className={`relative h-24 w-full bg-gradient-to-r ${event.bannerGradient} p-4 overflow-hidden`}
                >
                  <div className="pointer-events-none absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-white/10 blur-xl" />
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="rounded-full bg-black/40 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/20">
                      {event.category}
                    </span>
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                      {event.department}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  {/* Metadata pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
                      <Calendar className="h-4 w-4 text-cyan-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400">Thời gian</p>
                        <p className="font-mono font-semibold">
                          {event.date.split('-').reverse().join('/')} ({event.startTime} - {event.endTime})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/5 p-2.5">
                      <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-[10px] text-slate-400">Địa điểm</p>
                        <p className="font-semibold truncate">{event.location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Attendees Progress Bar */}
                  <div className="space-y-1.5 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Users className="h-3.5 w-3.5 text-purple-400" /> Đăng ký tham gia
                      </span>
                      <span className="font-mono font-bold text-white">
                        {event.attendeeIds.length} / {event.maxAttendees} chỗ
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500"
                        style={{ width: `${attendeePercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
                    <button
                      onClick={() => handleDownloadIcs(event)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                      title="Tải file lịch .ics tương thích Google Calendar, Apple Calendar"
                    >
                      <Download className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Xuất .ics</span>
                    </button>

                    <button
                      onClick={() => handleRsvpClick(event.id)}
                      disabled={isPast || (!isAttending && event.attendeeIds.length >= event.maxAttendees)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md ${
                        isPast
                          ? 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                          : isAttending
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-400/40'
                          : event.attendeeIds.length >= event.maxAttendees
                          ? 'bg-slate-800 text-slate-400 border border-white/5 cursor-not-allowed'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20'
                      }`}
                    >
                      {isPast ? (
                        <span>Đã kết thúc</span>
                      ) : isAttending ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Đã đăng ký (Hủy)</span>
                        </>
                      ) : event.attendeeIds.length >= event.maxAttendees ? (
                        <span>Đã hết chỗ</span>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Đăng ký tham gia</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <EventCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={onCreateEvent}
      />
    </div>
  );
}
