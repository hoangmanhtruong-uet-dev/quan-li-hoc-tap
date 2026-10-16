'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell, BookOpen, Check, CheckCheck, Clock3, GraduationCap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const notifications = [
  { id: 'deadline', title: 'Deadline sắp đến', description: 'Bài tập lớn Mạng máy tính còn 6 giờ.', time: '10 phút trước', icon: Clock3, tone: 'bg-rose-500/10 text-rose-300' },
  { id: 'material', title: 'Tài liệu mới', description: 'Slide tuần 4 môn Kỹ thuật lập trình đã được đăng.', time: '2 giờ trước', icon: BookOpen, tone: 'bg-blue-500/10 text-blue-300' },
  { id: 'grade', title: 'Đã cập nhật điểm', description: 'Điểm Quiz chương 3 hiện đã có trên hệ thống.', time: 'Hôm qua', icon: GraduationCap, tone: 'bg-emerald-500/10 text-emerald-300' },
];

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.length - readIds.length;

  useEffect(() => {
    const saved = window.localStorage.getItem('campusos-notification-read-v1');
    if (saved) {
      try { setReadIds(JSON.parse(saved) as string[]); } catch { window.localStorage.removeItem('campusos-notification-read-v1'); }
    }
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  function markRead(id: string) {
    setReadIds((current) => {
      const next = current.includes(id) ? current : [...current, id];
      window.localStorage.setItem('campusos-notification-read-v1', JSON.stringify(next));
      return next;
    });
  }

  function markAllRead() {
    const allIds = notifications.map((item) => item.id);
    setReadIds(allIds);
    window.localStorage.setItem('campusos-notification-read-v1', JSON.stringify(allIds));
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={`relative ${open ? 'bg-accent text-foreground' : ''}`}
        aria-label={`Thông báo, ${unreadCount} chưa đọc`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{unreadCount}</span> : null}
      </Button>

      {open ? (
        <section role="dialog" aria-label="Thông báo" className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3.5">
            <div>
              <h2 className="font-bold">Thông báo</h2>
              <p className="text-xs text-muted-foreground">{unreadCount ? `${unreadCount} cập nhật chưa đọc` : 'Bạn đã xem tất cả cập nhật'}</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Đóng thông báo" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>

          <div className="p-2">
            {notifications.map((item) => {
              const Icon = item.icon;
              const isRead = readIds.includes(item.id);
              return (
                <button key={item.id} onClick={() => markRead(item.id)} className="group flex w-full gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted/60">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.tone}`}><Icon className="h-4.5 w-4.5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2"><span className={`text-sm ${isRead ? 'font-medium text-muted-foreground' : 'font-semibold'}`}>{item.title}</span>{isRead ? <Check className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" /> : <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.description}</span>
                    <span className="mt-1.5 block text-[11px] text-muted-foreground/75">{item.time}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-border/70 bg-muted/15 px-3 py-2.5">
            <button onClick={markAllRead} disabled={unreadCount === 0} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"><CheckCheck className="h-3.5 w-3.5" /> Đánh dấu đã đọc</button>
            <Link href="/notifications" onClick={() => setOpen(false)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">Xem tất cả</Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
