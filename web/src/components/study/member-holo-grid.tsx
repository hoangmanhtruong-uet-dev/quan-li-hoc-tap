'use client';

import React, { useState, useMemo } from 'react';
import type { StudyRoomMemberWithProfile, StudyRoomMemberStatus } from '@/lib/study-rooms-service';
import {
  Users,
  Flame,
  Sparkles,
  ShieldAlert,
  Coffee,
  Clock,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Search,
  Zap,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';

export interface MemberHoloItem {
  id?: string;
  user_id?: string;
  name: string;
  avatar_url?: string;
  status: StudyRoomMemberStatus | 'waiting';
  total_minutes_contributed?: number;
  total_minutes?: number;
  camera_on?: boolean;
  mic_on?: boolean;
  last_ping_at?: string;
  rank_title?: string;
  is_self?: boolean;
}

export interface MemberHoloGridProps {
  members: Array<MemberHoloItem | StudyRoomMemberWithProfile>;
  currentUserId?: string;
  onPokeMember?: (member: MemberHoloItem) => void;
  onSelectMember?: (member: MemberHoloItem) => void;
  className?: string;
  compact?: boolean;
  showControls?: boolean;
  title?: string;
}

export function MemberHoloGrid({
  members = [],
  currentUserId = 'default_student_id',
  onPokeMember,
  onSelectMember,
  className = '',
  compact = false,
  showControls = true,
  title,
}: MemberHoloGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'focusing' | 'distracted' | 'break'>('all');
  const [pokedId, setPokedId] = useState<string | null>(null);

  // Normalize members into standard MemberHoloItem format
  const normalizedMembers: MemberHoloItem[] = useMemo(() => {
    return members.map((m) => {
      const isProfile = 'total_minutes_contributed' in m;
      const minutes = isProfile ? m.total_minutes_contributed : (m.total_minutes || 0);
      const isSelf = m.user_id === currentUserId || ('is_self' in m && Boolean(m.is_self));

      return {
        id: m.id || m.user_id || `mem-${Math.random()}`,
        user_id: m.user_id,
        name: m.name || 'Sinh viên CampusOS',
        avatar_url: m.avatar_url,
        status: m.status as StudyRoomMemberStatus | 'waiting',
        total_minutes_contributed: minutes,
        camera_on: Boolean(m.camera_on),
        mic_on: 'mic_on' in m ? Boolean(m.mic_on) : false,
        last_ping_at: m.last_ping_at,
        rank_title: 'rank_title' in m ? m.rank_title : undefined,
        is_self: isSelf,
      };
    });
  }, [members, currentUserId]);

  // Counts by status
  const counts = useMemo(() => {
    const focusing = normalizedMembers.filter((m) => m.status === 'focusing').length;
    const distracted = normalizedMembers.filter((m) => m.status === 'distracted').length;
    const breakCount = normalizedMembers.filter((m) => m.status === 'break' || m.status === 'waiting').length;
    return { all: normalizedMembers.length, focusing, distracted, break: breakCount };
  }, [normalizedMembers]);

  // Filtered members list
  const filteredList = useMemo(() => {
    let list = normalizedMembers;

    if (selectedFilter !== 'all') {
      if (selectedFilter === 'break') {
        list = list.filter((m) => m.status === 'break' || m.status === 'waiting');
      } else {
        list = list.filter((m) => m.status === selectedFilter);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((m) => m.name.toLowerCase().includes(q));
    }

    return list;
  }, [normalizedMembers, selectedFilter, searchQuery]);

  const handlePoke = (member: MemberHoloItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (member.id) {
      setPokedId(member.id);
      setTimeout(() => setPokedId(null), 1200);
    }
    onPokeMember?.(member);
  };

  const formatMinutes = (minutes?: number) => {
    const m = minutes || 0;
    if (m >= 60) {
      const hours = Math.floor(m / 60);
      const rem = m % 60;
      return rem > 0 ? `${hours}h ${rem}p` : `${hours}h`;
    }
    return `${m}p`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header and Controls */}
      {showControls && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-black text-white tracking-wide">
              {title || `SÂN KHẤU THÀNH VIÊN HOLOGRAPHIC (${normalizedMembers.length})`}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm thành viên..."
                className="h-8 w-36 sm:w-44 rounded-xl border border-white/10 bg-black/40 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
              />
            </div>

            {/* Filter chips */}
            <div className="flex items-center rounded-xl border border-white/10 bg-black/30 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                  selectedFilter === 'all'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất cả ({counts.all})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('focusing')}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 font-semibold transition-all ${
                  selectedFilter === 'focusing'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
                title="Tập trung cao độ"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Học ({counts.focusing})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('distracted')}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 font-semibold transition-all ${
                  selectedFilter === 'distracted'
                    ? 'bg-rose-500/20 text-rose-300 font-bold'
                    : 'text-slate-400 hover:text-rose-300'
                }`}
                title="Bị phạt / Phân tâm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                <span>Phạt ({counts.distracted})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('break')}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 font-semibold transition-all ${
                  selectedFilter === 'break'
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
                title="Nghỉ giải lao"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>Nghỉ ({counts.break})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Holographic Cards */}
      {filteredList.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-card/30 p-8 text-center backdrop-blur-xl">
          <Users className="mx-auto h-8 w-8 text-slate-500 mb-2" />
          <p className="text-xs font-semibold text-slate-400">Không tìm thấy thành viên nào phù hợp bộ lọc.</p>
        </div>
      ) : (
        <div
          className={`grid gap-3 ${
            compact
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}
        >
          {filteredList.map((member) => {
            const isFocusing = member.status === 'focusing';
            const isDistracted = member.status === 'distracted';
            const isBreak = member.status === 'break' || member.status === 'waiting';
            const isPoked = pokedId === member.id;

            // Status Styling Tokens: Green, Red, Yellow
            const statusConfig = isDistracted
              ? {
                  border: 'border-rose-500/80 hover:border-rose-400',
                  glow: 'shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/40 animate-pulse',
                  avatarBorder: 'border-rose-400 bg-rose-500/25 text-rose-200',
                  badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
                  dotBg: 'bg-rose-400 animate-ping',
                  label: 'Bị phạt / Phân tâm',
                  lightColor: 'text-rose-400',
                }
              : isFocusing
              ? {
                  border: 'border-emerald-400/40 hover:border-emerald-300',
                  glow: 'shadow-lg shadow-emerald-950/30',
                  avatarBorder: 'border-emerald-400 bg-emerald-500/20 text-emerald-200',
                  badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
                  dotBg: 'bg-emerald-400 animate-pulse',
                  label: 'Tập trung cao độ',
                  lightColor: 'text-emerald-400',
                }
              : {
                  border: 'border-amber-400/40 hover:border-amber-300',
                  glow: 'shadow-lg shadow-amber-950/20',
                  avatarBorder: 'border-amber-400 bg-amber-500/20 text-amber-200',
                  badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
                  dotBg: 'bg-amber-400',
                  label: 'Nghỉ giải lao',
                  lightColor: 'text-amber-400',
                };

            const initials = member.name
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'SV';

            return (
              <div
                key={member.id}
                onClick={() => onSelectMember?.(member)}
                className={`group relative overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-xl p-3.5 transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                  statusConfig.border
                } ${statusConfig.glow}`}
              >
                {/* Holographic Scanline Overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/20 opacity-80" />
                <div className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-cyan-400/[0.05] to-transparent rotate-45 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />

                <div className="relative flex items-center justify-between gap-3">
                  {/* Left: Avatar with Status Light */}
                  <div className="relative shrink-0">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl border font-bold text-sm tracking-wider shadow-inner transition-transform group-hover:scale-105 ${statusConfig.avatarBorder}`}
                    >
                      {member.avatar_url && !member.avatar_url.includes('default') ? (
                        <img
                          src={member.avatar_url}
                          alt={member.name}
                          className="h-full w-full rounded-2xl object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>

                    {/* Neon Status Light Indicator (Green / Red / Yellow) */}
                    <div
                      className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-900"
                      title={statusConfig.label}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${statusConfig.dotBg}`} />
                    </div>
                  </div>

                  {/* Middle: Name & Contribution */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-cyan-200 transition-colors">
                        {member.name}
                      </span>
                      {member.is_self && (
                        <span className="shrink-0 rounded-full bg-cyan-500/20 border border-cyan-400/40 px-1.5 py-0.2 text-[9px] font-black text-cyan-300">
                          BẠN
                        </span>
                      )}
                    </div>

                    {/* Rank title or Subtext */}
                    <p className="text-[11px] text-slate-400 truncate">
                      {member.rank_title || statusConfig.label}
                    </p>

                    {/* Metrics row */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span className="inline-flex items-center gap-1 text-cyan-300">
                        <Clock className="h-3 w-3 text-cyan-400" />
                        {formatMinutes(member.total_minutes_contributed)}
                      </span>
                      {member.camera_on ? (
                        <span className="inline-flex items-center text-emerald-400" title="Camera bật">
                          <Camera className="h-3 w-3" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-slate-500" title="Camera tắt">
                          <CameraOff className="h-3 w-3" />
                        </span>
                      )}
                      {member.mic_on ? (
                        <span className="inline-flex items-center text-cyan-400" title="Mic bật">
                          <Mic className="h-3 w-3" />
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Right: Status Pill & Poke Action */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-xl border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusConfig.badgeBg}`}
                    >
                      {isDistracted ? (
                        <ShieldAlert className="h-3 w-3 text-rose-400" />
                      ) : isFocusing ? (
                        <Flame className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Coffee className="h-3 w-3 text-amber-400" />
                      )}
                      <span className="hidden sm:inline">
                        {isDistracted ? 'PHẠT' : isFocusing ? 'FOCUS' : 'NGHỈ'}
                      </span>
                    </span>

                    {/* Poke / Cheer button */}
                    {!member.is_self && onPokeMember && (
                      <button
                        type="button"
                        onClick={(e) => handlePoke(member, e)}
                        className={`rounded-xl border border-white/10 px-2 py-0.5 text-[10px] font-semibold transition-all ${
                          isPoked
                            ? 'bg-cyan-500 text-white scale-110'
                            : 'bg-white/5 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-200 hover:border-cyan-400/30'
                        }`}
                        title="Nhắc nhở hoặc cổ vũ bạn học"
                      >
                        {isPoked ? 'Đã nhắc!' : 'Nhắc bạn'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
