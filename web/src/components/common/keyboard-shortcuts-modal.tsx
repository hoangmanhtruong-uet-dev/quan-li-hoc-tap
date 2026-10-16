'use client';

import React, { useEffect } from 'react';
import { X, Command, Calendar, Sparkles } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Bảng phím tắt học bá"
    >
      <div
        className="w-full max-w-xl bg-[#0D0D17] border-2 border-white/20 rounded-[28px] shadow-[10px_10px_0px_0px_#000000] overflow-hidden flex flex-col hard-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-white/10 bg-[#121220]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-primary text-black font-display font-black text-sm">
              ⚡
            </span>
            <div>
              <h2 className="font-display font-bold text-lg text-foreground">
                BẢNG PHÍM TẮT HỌC BÁ
              </h2>
              <p className="text-xs text-muted-foreground font-sans">
                Thao tác thần tốc không cần rời tay khỏi bàn phím
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            aria-label="Đóng bảng phím tắt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin font-sans">
          {/* Group 1: Toàn cục */}
          <div>
            <div className="flex items-center gap-2 text-xs font-heading font-bold text-primary uppercase tracking-wider mb-3">
              <Command className="w-4 h-4" />
              <span>Toàn cục (Global)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <ShortcutRow shortcut="⌘ / Ctrl + K" label="Mở Command Palette" />
              <ShortcutRow shortcut="?" label="Mở bảng phím tắt này" />
              <ShortcutRow shortcut="F" label="Bắt đầu Focus Mode" />
              <ShortcutRow shortcut="N" label="Tạo nhanh nhiệm vụ" />
              <ShortcutRow shortcut="Esc" label="Đóng cửa sổ / modal" />
            </div>
          </div>

          {/* Group 2: Lịch & Kế hoạch */}
          <div>
            <div className="flex items-center gap-2 text-xs font-heading font-bold text-event-class uppercase tracking-wider mb-3">
              <Calendar className="w-4 h-4" />
              <span>Lịch & Kế hoạch (Calendar)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <ShortcutRow shortcut="T" label="Nhảy về Hôm nay" />
              <ShortcutRow shortcut="← / →" label="Tháng trước / sau" />
              <ShortcutRow shortcut="M" label="Chế độ Tháng (Month)" />
              <ShortcutRow shortcut="W" label="Chế độ Tuần (Week)" />
              <ShortcutRow shortcut="D" label="Chế độ Ngày (Day)" />
              <ShortcutRow shortcut="A" label="Chế độ Agenda" />
              <ShortcutRow shortcut="/" label="Tìm kiếm sự kiện" />
              <ShortcutRow shortcut="Alt + Click" label="Solo filter loại sự kiện" />
            </div>
          </div>

          {/* Group 3: Easter Eggs */}
          <div>
            <div className="flex items-center gap-2 text-xs font-heading font-bold text-event-deadline uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Trứng phục sinh (Easter Eggs)</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs text-muted-foreground font-medium">Konami Code (Pháo hoa + Badge bí mật)</span>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <kbd className="px-1.5 py-0.5 bg-black/60 border border-white/20 rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-black/60 border border-white/20 rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-black/60 border border-white/20 rounded">↓</kbd>
                  <kbd className="px-1.5 py-0.5 bg-black/60 border border-white/20 rounded">↓</kbd>
                  <kbd className="px-1.5 py-0.5 bg-black/60 border border-white/20 rounded">←</kbd>
                  <kbd className="px-1.5 py-0.5 bg-black/60 border border-white/20 rounded">→</kbd>
                  <kbd className="px-1.5 py-0.5 bg-black/60 border border-white/20 rounded">B</kbd>
                  <kbd className="px-1.5 py-0.5 bg-black/60 border border-white/20 rounded">A</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs text-muted-foreground font-medium">Triệu hồi Mèo Mập</span>
                <span className="text-[11px] font-mono text-primary font-bold">Click Logo CampusOS 5 lần</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#0B0B13] border-t border-white/10 text-center">
          <p className="text-xs text-muted-foreground font-sans">
            Mẹo: Nhấn bất kỳ phím nào ở trên để kích hoạt ngay lập tức!
          </p>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ shortcut, label }: { shortcut: string; label: string }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-[#1B1B2A] border border-white/20 rounded shadow-[2px_2px_0px_#000] text-primary">
        {shortcut}
      </kbd>
    </div>
  );
}
