'use client';

import React, { useState } from 'react';
import type { TaskPriority } from '@/types/tasks';
import {
  CheckCircle2,
  Calendar,
  Trash2,
  X,
  Flag,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onCompleteSelected: () => void;
  onChangePriority: (priority: TaskPriority) => void;
  onPostponeSelected: (days: number) => void;
  onDeleteSelected: () => void;
  className?: string;
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onCompleteSelected,
  onChangePriority,
  onPostponeSelected,
  onDeleteSelected,
  className = '',
}: BulkActionBarProps) {
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);
  const [postponeMenuOpen, setPostponeMenuOpen] = useState(false);

  if (selectedCount < 1) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Thao tác hàng loạt"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-2rem)] w-auto min-w-[320px] transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl md:rounded-full bg-[#0D0E17]/95 border-2 border-aurora-lime px-4 py-2.5 shadow-[6px_6px_0px_#000] backdrop-blur-xl text-foreground">
        {/* Selection Count Pill */}
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center rounded-full bg-aurora-lime px-2.5 py-0.5 text-xs font-black text-black shadow-[2px_2px_0px_#000]">
            {selectedCount}
          </span>
          <span className="text-xs sm:text-sm font-bold tracking-tight text-white whitespace-nowrap">
            Đã chọn
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Complete Selected */}
          <button
            type="button"
            onClick={onCompleteSelected}
            className="flex items-center gap-1.5 rounded-full bg-[#3DFFB0]/15 hover:bg-[#3DFFB0]/25 text-[#3DFFB0] border border-[#3DFFB0]/40 px-3 py-1.5 text-xs font-bold transition-transform active:scale-95 shadow-[2px_2px_0px_#000]"
            title="Đánh dấu đã hoàn thành tất cả"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hoàn thành</span>
          </button>

          {/* Change Priority Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setPriorityMenuOpen((v) => !v);
                setPostponeMenuOpen(false);
              }}
              className="flex items-center gap-1 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/15 px-3 py-1.5 text-xs font-semibold transition-transform active:scale-95 shadow-[2px_2px_0px_#000]"
              title="Đổi mức ưu tiên"
            >
              <Flag className="w-3.5 h-3.5 text-aurora-orange" />
              <span className="hidden sm:inline">Ưu tiên</span>
              <ChevronDown className="w-3 h-3 text-white/60" />
            </button>

            {priorityMenuOpen && (
              <div
                className="absolute bottom-full mb-2 left-0 w-36 rounded-xl bg-[#13111E] border-2 border-white/20 p-1.5 shadow-[4px_4px_0px_#000] z-50 flex flex-col gap-1"
                onMouseLeave={() => setPriorityMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    onChangePriority('high');
                    setPriorityMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#FF3D6E] hover:bg-[#FF3D6E]/15 text-left transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-[#FF3D6E]" />
                  Cao (Gấp)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangePriority('medium');
                    setPriorityMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#FFB020] hover:bg-[#FFB020]/15 text-left transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-[#FFB020]" />
                  Vừa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangePriority('low');
                    setPriorityMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#3DE8FF] hover:bg-[#3DE8FF]/15 text-left transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-[#3DE8FF]" />
                  Thấp
                </button>
              </div>
            )}
          </div>

          {/* Postpone Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setPostponeMenuOpen((v) => !v);
                setPriorityMenuOpen(false);
              }}
              className="flex items-center gap-1 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/15 px-3 py-1.5 text-xs font-semibold transition-transform active:scale-95 shadow-[2px_2px_0px_#000]"
              title="Dời hạn"
            >
              <Calendar className="w-3.5 h-3.5 text-aurora-cyan" />
              <span className="hidden sm:inline">Dời hạn</span>
              <ChevronDown className="w-3 h-3 text-white/60" />
            </button>

            {postponeMenuOpen && (
              <div
                className="absolute bottom-full mb-2 left-0 w-36 rounded-xl bg-[#13111E] border-2 border-white/20 p-1.5 shadow-[4px_4px_0px_#000] z-50 flex flex-col gap-1"
                onMouseLeave={() => setPostponeMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    onPostponeSelected(1);
                    setPostponeMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10 text-left transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-aurora-lime" />
                  +1 ngày (Mai)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onPostponeSelected(3);
                    setPostponeMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10 text-left transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-aurora-orange" />
                  +3 ngày
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onPostponeSelected(7);
                    setPostponeMenuOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10 text-left transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-aurora-violet" />
                  +1 tuần
                </button>
              </div>
            )}
          </div>

          {/* Delete Selected with Undo */}
          <button
            type="button"
            onClick={onDeleteSelected}
            className="flex items-center gap-1.5 rounded-full bg-[#FF3D6E]/15 hover:bg-[#FF3D6E]/25 text-[#FF3D6E] border border-[#FF3D6E]/40 px-3 py-1.5 text-xs font-bold transition-transform active:scale-95 shadow-[2px_2px_0px_#000]"
            title="Xoá nhiệm vụ đã chọn"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xoá</span>
          </button>

          {/* Clear Selection */}
          <button
            type="button"
            onClick={onClearSelection}
            className="flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white p-1.5 transition-colors"
            title="Bỏ chọn tất cả"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
