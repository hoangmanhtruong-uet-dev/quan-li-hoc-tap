'use client';

import React from 'react';
import { Search, Eye, EyeOff, Users, BookOpen, Sparkles, GraduationCap, Calendar } from 'lucide-react';
import { type EventType } from '@/lib/campus-store';

export interface FilterState {
  activeTypes: EventType[];
  searchQuery: string;
  hideWeekends: boolean;
  showFreeSlots: boolean;
  squadOverlay: boolean;
}

interface SmartFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  eventCounts: Record<EventType, number>;
}

export const EVENT_META: Record<
  EventType,
  { label: string; dot: string; color: string; border: string; bg: string; icon: typeof BookOpen }
> = {
  class: {
    label: 'Lớp học',
    dot: 'bg-[#4D7CFF]',
    color: '#4D7CFF',
    border: 'border-[#4D7CFF]/50',
    bg: 'bg-[#4D7CFF]/15 text-[#9bb7ff]',
    icon: BookOpen,
  },
  study: {
    label: 'Tự học',
    dot: 'bg-[#8B6CFF]',
    color: '#8B6CFF',
    border: 'border-[#8B6CFF]/50',
    bg: 'bg-[#8B6CFF]/15 text-[#c4b5fd]',
    icon: Sparkles,
  },
  exam: {
    label: 'Thi / Deadline',
    dot: 'bg-[#FF3D6E]',
    color: '#FF3D6E',
    border: 'border-[#FF3D6E]/50',
    bg: 'bg-[#FF3D6E]/15 text-[#ffa1b9]',
    icon: GraduationCap,
  },
  club: {
    label: 'CLB / Nhóm',
    dot: 'bg-[#FFB020]',
    color: '#FFB020',
    border: 'border-[#FFB020]/50',
    bg: 'bg-[#FFB020]/15 text-[#fed7aa]',
    icon: Users,
  },
  personal: {
    label: 'Cá nhân',
    dot: 'bg-[#3DFFB0]',
    color: '#3DFFB0',
    border: 'border-[#3DFFB0]/50',
    bg: 'bg-[#3DFFB0]/15 text-[#86efac]',
    icon: Calendar,
  },
};

export function SmartFilters({ filters, onChange, eventCounts }: SmartFiltersProps) {
  const handleTypeClick = (type: EventType, e: React.MouseEvent) => {
    if (e.altKey) {
      // Solo mode: only keep this type active
      onChange({
        ...filters,
        activeTypes: [type],
      });
      return;
    }

    const isCurrentActive = filters.activeTypes.includes(type);
    let next: EventType[];
    if (isCurrentActive) {
      next = filters.activeTypes.filter((t) => t !== type);
      if (next.length === 0) next = [type]; // Keep at least one
    } else {
      next = [...filters.activeTypes, type];
    }
    onChange({
      ...filters,
      activeTypes: next,
    });
  };

  return (
    <section className="w-full min-w-0 flex flex-col gap-4 rounded-2xl border-2 border-white/15 bg-[#121222]/80 p-4 shadow-[4px_4px_0px_#000] lg:flex-row lg:items-center lg:justify-between hard-border">
      {/* 5 Neon Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono font-bold text-muted-foreground mr-1">
          LỌC:
        </span>
        {(Object.keys(EVENT_META) as EventType[]).map((type) => {
          const meta = EVENT_META[type];
          const isActive = filters.activeTypes.includes(type);
          const count = eventCounts[type] || 0;
          const Icon = meta.icon;

          return (
            <button
              key={type}
              type="button"
              onClick={(e) => handleTypeClick(type, e)}
              title={`${meta.label} (${count}) · Giữ Alt+Click để xem riêng loại này`}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-[2px_2px_0px_#000] ${
                isActive
                  ? `${meta.bg} ${meta.border} border-2 scale-100`
                  : 'border border-white/10 bg-white/5 text-muted-foreground opacity-50 hover:opacity-80'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              <Icon className="h-3.5 w-3.5" />
              <span>{meta.label}</span>
              <span className="ml-1 rounded-full bg-black/40 px-1.5 py-0.2 font-mono text-[10px]">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar + Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Input */}
        <div className="relative min-w-[180px] sm:min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Tìm sự kiện... (/)"
            className="w-full rounded-xl border border-white/20 bg-black/40 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-aurora-lime focus:outline-none"
          />
        </div>

        {/* Hide Weekends Switch */}
        <button
          type="button"
          onClick={() => onChange({ ...filters, hideWeekends: !filters.hideWeekends })}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all shadow-[2px_2px_0px_#000] ${
            filters.hideWeekends
              ? 'border-aurora-lime bg-aurora-lime/15 text-aurora-lime'
              : 'border-white/15 bg-white/5 text-muted-foreground hover:text-foreground'
          }`}
        >
          {filters.hideWeekends ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          <span>Ẩn cuối tuần</span>
        </button>

        {/* Free Slot Toggle */}
        <button
          type="button"
          onClick={() => onChange({ ...filters, showFreeSlots: !filters.showFreeSlots })}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all shadow-[2px_2px_0px_#000] ${
            filters.showFreeSlots
              ? 'border-orange-400 bg-orange-500/15 text-orange-300'
              : 'border-white/15 bg-white/5 text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Giờ trống</span>
        </button>

        {/* Squad Overlay Toggle */}
        <button
          type="button"
          onClick={() => onChange({ ...filters, squadOverlay: !filters.squadOverlay })}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all shadow-[2px_2px_0px_#000] ${
            filters.squadOverlay
              ? 'border-blue-400 bg-blue-500/15 text-blue-300'
              : 'border-white/15 bg-white/5 text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Lịch nhóm</span>
        </button>
      </div>
    </section>
  );
}
