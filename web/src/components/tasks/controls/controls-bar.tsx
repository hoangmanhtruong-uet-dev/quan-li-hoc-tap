'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { TaskItem, TaskPriority } from '@/types/tasks';
import {
  Search,
  X,
  List,
  Columns3,
  LayoutGrid,
  CalendarDays,
  ArrowUpDown,
  Check,
  ChevronDown,
} from 'lucide-react';

export type TaskViewMode = 'list' | 'kanban' | 'matrix' | 'today';
export type TaskStatusFilter = 'all' | 'todo' | 'doing' | 'done';
export type TaskPriorityFilter = 'all' | 'high' | 'medium' | 'low';
export type TaskSortOption = 'dueAt' | 'priority' | 'course' | 'createdAt' | 'ai';

export interface ControlsBarProps {
  activeView: TaskViewMode;
  onViewChange: (view: TaskViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: TaskStatusFilter;
  onStatusFilterChange: (status: TaskStatusFilter) => void;
  priorityFilter: TaskPriorityFilter;
  onPriorityFilterChange: (priority: TaskPriorityFilter) => void;
  sortOption: TaskSortOption;
  onSortChange: (sort: TaskSortOption) => void;
  tasks?: TaskItem[];
  className?: string;
}

const SORT_LABELS: Record<TaskSortOption, { label: string; desc: string }> = {
  dueAt: { label: 'Theo hạn', desc: 'Hạn gần nhất lên đầu' },
  priority: { label: 'Ưu tiên', desc: 'Cao nhất lên đầu' },
  course: { label: 'Môn học', desc: 'Sắp xếp theo tên môn' },
  createdAt: { label: 'Mới tạo', desc: 'Mới thêm vào gần đây' },
  ai: { label: 'AI đề xuất', desc: 'Điểm khẩn cấp & quan trọng' },
};

export function ControlsBar({
  activeView,
  onViewChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sortOption,
  onSortChange,
  tasks = [],
  className = '',
}: ControlsBarProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);

  // 1. Keyboard shortcuts listener:
  // - '/' focuses search bar (prevent default to avoid typing '/')
  // - '1', '2', '3', '4' switches view (guarded against active typing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        (activeEl as HTMLElement | null)?.isContentEditable;

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === '1') onViewChange('list');
        else if (e.key === '2') onViewChange('kanban');
        else if (e.key === '3') onViewChange('matrix');
        else if (e.key === '4') onViewChange('today');
      }

      if (e.key === 'Escape') {
        setSortDropdownOpen(false);
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onViewChange]);

  // Click outside to close sort dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 2. Compute live counts
  const counts = useMemo(() => {
    const total = tasks.length;
    let todo = 0;
    let doing = 0;
    let done = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    for (const t of tasks) {
      if (t.status === 'todo') todo++;
      else if (t.status === 'doing') doing++;
      else if (t.status === 'done') done++;

      if (t.status !== 'done') {
        if (t.priority === 'high') high++;
        else if (t.priority === 'medium') medium++;
        else if (t.priority === 'low') low++;
      }
    }

    return { total, todo, doing, done, high, medium, low };
  }, [tasks]);

  return (
    <div
      className={`w-full min-w-0 max-w-full flex flex-col gap-3.5 bg-[#0D0E17]/90 border border-white/10 rounded-[24px] p-3.5 sm:p-4.5 shadow-[4px_4px_0px_#000] backdrop-blur-md overflow-x-hidden ${className}`}
    >
      {/* Top Row: Segmented Pill Switcher & Full-Width Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 w-full min-w-0">
        {/* Sliding Segmented Pill Switcher */}
        <div
          role="tablist"
          aria-label="Chế độ hiển thị"
          className="relative flex items-center p-1 rounded-2xl bg-[#141423] border border-white/10 shadow-[2px_2px_0px_#000] self-start sm:self-auto overflow-x-auto max-w-full scrollbar-none"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'list'}
            onClick={() => onViewChange('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeView === 'list'
                ? 'bg-aurora-lime text-black shadow-[2px_2px_0px_#000] -translate-y-0.5'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Danh sách</span>
            <kbd className="hidden sm:inline-block ml-0.5 px-1 py-0.2 rounded text-[10px] font-mono opacity-60 bg-black/20">
              1
            </kbd>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'kanban'}
            onClick={() => onViewChange('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeView === 'kanban'
                ? 'bg-aurora-lime text-black shadow-[2px_2px_0px_#000] -translate-y-0.5'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>Kanban</span>
            <kbd className="hidden sm:inline-block ml-0.5 px-1 py-0.2 rounded text-[10px] font-mono opacity-60 bg-black/20">
              2
            </kbd>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'matrix'}
            onClick={() => onViewChange('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeView === 'matrix'
                ? 'bg-aurora-lime text-black shadow-[2px_2px_0px_#000] -translate-y-0.5'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Ma trận</span>
            <kbd className="hidden sm:inline-block ml-0.5 px-1 py-0.2 rounded text-[10px] font-mono opacity-60 bg-black/20">
              3
            </kbd>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'today'}
            onClick={() => onViewChange('today')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeView === 'today'
                ? 'bg-aurora-lime text-black shadow-[2px_2px_0px_#000] -translate-y-0.5'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Hôm nay</span>
            <kbd className="hidden sm:inline-block ml-0.5 px-1 py-0.2 rounded text-[10px] font-mono opacity-60 bg-black/20">
              4
            </kbd>
          </button>
        </div>

        {/* Full-width Search Input with "/" shortcut */}
        <div className="relative flex-1 min-w-0">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm nhiệm vụ, môn học, thẻ… (Nhấn /)"
              className="w-full pl-10 pr-16 py-2 rounded-xl bg-[#141423] border border-white/10 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-aurora-lime focus:ring-1 focus:ring-aurora-lime transition-all shadow-[2px_2px_0px_#000]"
            />
            <div className="absolute right-2.5 flex items-center gap-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    searchInputRef.current?.focus();
                  }}
                  className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  title="Xoá tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[11px] font-mono text-white/40 bg-white/5 border border-white/10 pointer-events-none">
                  /
                </kbd>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Status Filter Chips, Priority Filter Chips, Sort Menu */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-white/5">
        {/* Left: Status Filter Chips & Priority Chips */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => onStatusFilterChange('all')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-[1.5px_1.5px_0px_#000] ${
                statusFilter === 'all'
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              <span>Tất cả</span>
              <span className="opacity-70 text-[11px]">({counts.total})</span>
            </button>

            <button
              type="button"
              onClick={() => onStatusFilterChange('todo')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-[1.5px_1.5px_0px_#000] ${
                statusFilter === 'todo'
                  ? 'bg-[#7A8AA8] text-white'
                  : 'bg-[#7A8AA8]/10 text-[#7A8AA8] hover:bg-[#7A8AA8]/20 border border-[#7A8AA8]/30'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#7A8AA8]" />
              <span>Cần làm</span>
              <span className="opacity-80 text-[11px]">({counts.todo})</span>
            </button>

            <button
              type="button"
              onClick={() => onStatusFilterChange('doing')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-[1.5px_1.5px_0px_#000] ${
                statusFilter === 'doing'
                  ? 'bg-[#8B6CFF] text-white shadow-[0_0_10px_rgba(139,108,255,0.4)]'
                  : 'bg-[#8B6CFF]/10 text-[#8B6CFF] hover:bg-[#8B6CFF]/20 border border-[#8B6CFF]/30'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B6CFF]" />
              <span>Đang làm</span>
              <span className="opacity-80 text-[11px]">({counts.doing})</span>
            </button>

            <button
              type="button"
              onClick={() => onStatusFilterChange('done')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-[1.5px_1.5px_0px_#000] ${
                statusFilter === 'done'
                  ? 'bg-[#3DFFB0] text-black'
                  : 'bg-[#3DFFB0]/10 text-[#3DFFB0] hover:bg-[#3DFFB0]/20 border border-[#3DFFB0]/30'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#3DFFB0]" />
              <span>Hoàn thành</span>
              <span className="opacity-80 text-[11px]">({counts.done})</span>
            </button>
          </div>

          <div className="hidden sm:block w-[1px] h-4 bg-white/10" />

          {/* Priority Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() =>
                onPriorityFilterChange(priorityFilter === 'high' ? 'all' : 'high')
              }
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-[1.5px_1.5px_0px_#000] ${
                priorityFilter === 'high'
                  ? 'bg-[#FF3D6E] text-white ring-2 ring-[#FF3D6E]/50'
                  : 'bg-[#FF3D6E]/10 text-[#FF3D6E] hover:bg-[#FF3D6E]/20 border border-[#FF3D6E]/30'
              }`}
              title="Ưu tiên cao"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF3D6E]" />
              <span>CAO</span>
              <span className="opacity-80 text-[11px]">({counts.high})</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onPriorityFilterChange(priorityFilter === 'medium' ? 'all' : 'medium')
              }
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-[1.5px_1.5px_0px_#000] ${
                priorityFilter === 'medium'
                  ? 'bg-[#FFB020] text-black ring-2 ring-[#FFB020]/50'
                  : 'bg-[#FFB020]/10 text-[#FFB020] hover:bg-[#FFB020]/20 border border-[#FFB020]/30'
              }`}
              title="Ưu tiên vừa"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB020]" />
              <span>VỪA</span>
              <span className="opacity-80 text-[11px]">({counts.medium})</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onPriorityFilterChange(priorityFilter === 'low' ? 'all' : 'low')
              }
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-[1.5px_1.5px_0px_#000] ${
                priorityFilter === 'low'
                  ? 'bg-[#3DE8FF] text-black ring-2 ring-[#3DE8FF]/50'
                  : 'bg-[#3DE8FF]/10 text-[#3DE8FF] hover:bg-[#3DE8FF]/20 border border-[#3DE8FF]/30'
              }`}
              title="Ưu tiên thấp"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#3DE8FF]" />
              <span>THẤP</span>
              <span className="opacity-80 text-[11px]">({counts.low})</span>
            </button>
          </div>
        </div>

        {/* Right: Custom Neo-Brutal Sort Dropdown Menu */}
        <div ref={sortRef} className="relative self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setSortDropdownOpen((prev) => !prev)}
            aria-expanded={sortDropdownOpen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141423] hover:bg-white/10 border border-white/15 text-xs font-bold text-white transition-all shadow-[2px_2px_0px_#000] active:scale-95"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-aurora-lime" />
            <span className="text-white/60">Sắp xếp:</span>
            <span className="text-white">{SORT_LABELS[sortOption]?.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {sortDropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#13111E] border-2 border-white/20 p-2 shadow-[6px_6px_0px_#000] z-50 flex flex-col gap-1 backdrop-blur-xl animate-in fade-in zoom-in-95"
            >
              <div className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white/40">
                Tiêu chí sắp xếp
              </div>
              {(Object.keys(SORT_LABELS) as TaskSortOption[]).map((key) => {
                const opt = SORT_LABELS[key];
                const isSelected = sortOption === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onSortChange(key);
                      setSortDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs text-left transition-all ${
                      isSelected
                        ? 'bg-aurora-lime/15 text-aurora-lime font-bold border border-aurora-lime/30'
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{opt.label}</div>
                      <div className="text-[10px] text-white/50">{opt.desc}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-aurora-lime" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
