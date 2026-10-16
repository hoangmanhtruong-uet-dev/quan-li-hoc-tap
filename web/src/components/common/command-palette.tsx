'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Calendar,
  Flame,
  PlusCircle,
  Sparkles,
  Palette,
  EyeOff,
  HelpCircle,
  X,
  Clock,
  ArrowRight,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  category: 'navigation' | 'action' | 'theme' | 'settings';
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeChange?: (theme: 'aurora' | 'y2k' | 'cyber' | 'pastel') => void;
  onToggleReducedMotion?: () => void;
  isReducedMotion?: boolean;
}

export function CommandPalette({
  isOpen,
  onClose,
  onThemeChange,
  onToggleReducedMotion,
  isReducedMotion = false,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Command registry
  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Đến trang Tổng quan',
      description: 'Xem timeline, deadline arena, squad và mục tiêu tuần',
      category: 'navigation',
      icon: LayoutDashboard,
      shortcut: 'G D',
      onSelect: () => {
        router.push('/dashboard');
        onClose();
      },
    },
    {
      id: 'nav-calendar',
      title: 'Đến trang Lịch & Kế hoạch',
      description: 'Lưới tháng, time-grid 06:00-23:00, xếp lịch thông minh',
      category: 'navigation',
      icon: Calendar,
      shortcut: 'G C',
      onSelect: () => {
        router.push('/calendar');
        onClose();
      },
    },
    // Actions
    {
      id: 'action-focus',
      title: 'Bắt đầu Focus Mode (Pomodoro)',
      description: 'Khởi động giám thị Mèo Mập hoặc Chill Lo-fi 4-7-8',
      category: 'action',
      icon: Flame,
      shortcut: 'F',
      onSelect: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('campusos:trigger-focus'));
        }
        onClose();
      },
    },
    {
      id: 'action-new-task',
      title: 'Thêm nhiệm vụ mới',
      description: 'Tạo deadline hoặc công việc nhanh',
      category: 'action',
      icon: PlusCircle,
      shortcut: 'N',
      onSelect: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('campusos:quick-create-task'));
        }
        onClose();
      },
    },
    {
      id: 'action-new-event',
      title: 'Tạo sự kiện lịch nhanh (NLP)',
      description: 'Nhập tiếng Việt tự nhiên: "ôn xác suất 19h thứ 6"',
      category: 'action',
      icon: Clock,
      shortcut: 'Shift+N',
      onSelect: () => {
        router.push('/calendar');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('campusos:quick-create-event'));
        }
        onClose();
      },
    },
    {
      id: 'action-ai-schedule',
      title: 'Hỏi AI xếp lịch giúp tao',
      description: 'Tự động lấp giờ trống trước các kỳ thi và deadline lớn',
      category: 'action',
      icon: Sparkles,
      onSelect: () => {
        router.push('/calendar');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('campusos:open-ai-scheduler'));
        }
        onClose();
      },
    },
    {
      id: 'action-shortcuts',
      title: 'Bảng phím tắt học bá',
      description: 'Xem tất cả các phím tắt và thao tác bí mật',
      category: 'action',
      icon: HelpCircle,
      shortcut: '?',
      onSelect: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('campusos:open-shortcuts-modal'));
        }
        onClose();
      },
    },
    // Themes
    {
      id: 'theme-aurora',
      title: 'Đổi Theme: Aurora (Mặc định)',
      description: 'Obsidian tối, tím rực rỡ và acid lime',
      category: 'theme',
      icon: Palette,
      onSelect: () => {
        onThemeChange?.('aurora');
        onClose();
      },
    },
    {
      id: 'theme-y2k',
      title: 'Đổi Theme: Y2K Chrome',
      description: 'Kim loại tương lai, cyan điện và hot magenta',
      category: 'theme',
      icon: Palette,
      onSelect: () => {
        onThemeChange?.('y2k');
        onClose();
      },
    },
    {
      id: 'theme-cyber',
      title: 'Đổi Theme: Cyber Lime',
      description: 'Ma trận cyberpunk, acid lime và hazard yellow',
      category: 'theme',
      icon: Palette,
      onSelect: () => {
        onThemeChange?.('cyber');
        onClose();
      },
    },
    {
      id: 'theme-pastel',
      title: 'Đổi Theme: Pastel Dreamy',
      description: 'Tím hoa oải hương mộng mơ và mây bạc hà',
      category: 'theme',
      icon: Palette,
      onSelect: () => {
        onThemeChange?.('pastel');
        onClose();
      },
    },
    // Accessibility
    {
      id: 'settings-reduced-motion',
      title: isReducedMotion ? 'Tắt Giảm hiệu ứng (Bật Motion)' : 'Bật Giảm hiệu ứng (Reduced Motion)',
      description: 'Tắt 3D tilt, keyframe loop và hạt bay cho máy mượt hơn',
      category: 'settings',
      icon: EyeOff,
      onSelect: () => {
        onToggleReducedMotion?.();
        onClose();
      },
    },
  ], [router, onClose, onThemeChange, onToggleReducedMotion, isReducedMotion]);

  // Filter commands by query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [commands, query]);

  // Autofocus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden';
      }
    } else {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].onSelect();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  // Keep selected item in view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="CampusOS Command Palette"
    >
      <div
        className="w-full max-w-2xl bg-[#0D0D17] border-2 border-white/20 rounded-[24px] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col hard-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-white/10 bg-[#121220]">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Gõ lệnh hoặc tìm kiếm... (vd: Lịch, Pomodoro, Theme, AI)"
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground font-sans text-base"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-bold bg-[#1B1B2A] border border-white/20 rounded text-muted-foreground shadow-[1px_1px_0px_#000]">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 divide-y divide-white/5 scrollbar-thin"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm font-sans">
              Không tìm thấy thao tác nào khớp với &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => item.onSelect()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/15 text-primary border border-primary/40 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]'
                      : 'text-foreground hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected ? 'bg-primary text-black' : 'bg-white/5 text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="font-heading font-semibold text-sm truncate">
                        {item.title}
                      </div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.shortcut && (
                      <kbd
                        className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded border ${
                          isSelected
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-white/5 border-white/10 text-muted-foreground'
                        }`}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && <ArrowRight className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-[#0B0B13] border-t border-white/10 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ di chuyển</span>
            <span>↵ chọn</span>
            <span>esc đóng</span>
          </div>
          <span className="text-primary font-bold">CampusOS Command Bar</span>
        </div>
      </div>
    </div>
  );
}
