'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  Clock,
  Clock3,
  Flame,
  RotateCcw,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useCampusStore } from '@/lib/campus-store';
import {
  type CampusNotification,
  type NotificationTab,
  synthesizeNotificationsFeed,
  filterNotifications,
  getNotificationTabCounts,
  getUnreadCount,
  isUrgentNotice,
  loadPersistedNotificationState,
  savePersistedNotificationState,
} from '@/lib/notifications-engine';

export function NotificationsManager() {
  const { state: campusState } = useCampusStore();

  const [activeTab, setActiveTab] = useState<NotificationTab>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<CampusNotification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Undo deletion state
  const [deletedNotice, setDeletedNotice] = useState<CampusNotification | null>(null);
  const [undoSecondsLeft, setUndoSecondsLeft] = useState(5);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const undoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    const { readIds: storedRead, removedIds: storedRemoved } = loadPersistedNotificationState();
    setReadIds(storedRead);
    setRemovedIds(storedRemoved);
    setHydrated(true);
  }, []);

  // Synthesize notifications feed whenever campus store or persisted state changes
  useEffect(() => {
    if (!hydrated) return;
    const feed = synthesizeNotificationsFeed(campusState, { readIds, removedIds });
    setNotifications(feed);
  }, [campusState, readIds, removedIds, hydrated]);

  // Persist read/removed state
  useEffect(() => {
    if (!hydrated) return;
    savePersistedNotificationState({ readIds, removedIds });
  }, [readIds, removedIds, hydrated]);

  // Cleanup undo timers on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    };
  }, []);

  // Filtered notifications based on active tab and search query
  const filteredNotices = useMemo(() => {
    return filterNotifications(notifications, activeTab, searchQuery);
  }, [notifications, activeTab, searchQuery]);

  const tabCounts = useMemo(() => {
    return getNotificationTabCounts(notifications);
  }, [notifications]);

  const totalUnread = useMemo(() => {
    return getUnreadCount(notifications);
  }, [notifications]);

  const urgentCount = useMemo(() => {
    return notifications.filter((n) => isUrgentNotice(n) && !n.isRead).length;
  }, [notifications]);

  // Handlers
  const handleToggleRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setReadIds((prev) => {
      const exists = prev.includes(id);
      return exists ? prev.filter((item) => item !== id) : [...prev, id];
    });
  };

  const handleMarkAllRead = () => {
    const targetIds = activeTab === 'Tất cả'
      ? notifications.map((n) => n.id)
      : notifications.filter((n) => n.tab === activeTab).map((n) => n.id);

    setReadIds((prev) => Array.from(new Set([...prev, ...targetIds])));
  };

  const handleClearAllRead = () => {
    const readItems = notifications.filter((n) => n.isRead).map((n) => n.id);
    if (readItems.length === 0) return;
    setRemovedIds((prev) => Array.from(new Set([...prev, ...readItems])));
  };

  const handleDeleteWithUndo = (notice: CampusNotification, e: React.MouseEvent) => {
    e.stopPropagation();

    // Clear any existing undo timer
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);

    // Optimistically remove from view
    setNotifications((prev) => prev.filter((n) => n.id !== notice.id));
    setDeletedNotice(notice);
    setUndoSecondsLeft(5);

    // Countdown interval
    undoIntervalRef.current = setInterval(() => {
      setUndoSecondsLeft((sec) => Math.max(0, sec - 1));
    }, 1000);

    // Finalize removal after 5 seconds
    undoTimerRef.current = setTimeout(() => {
      setRemovedIds((prev) => Array.from(new Set([...prev, notice.id])));
      setDeletedNotice(null);
      if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (!deletedNotice) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);

    // Restore to notifications list
    setNotifications((prev) => [deletedNotice, ...prev]);
    setDeletedNotice(null);
  };

  const getCategoryIcon = (category?: string, tab?: NotificationTab) => {
    if (tab === 'Deadline' || category === 'deadline') {
      return <Clock className="h-4 w-4 text-rose-400" />;
    }
    if (tab === 'CLB' || category === 'club') {
      return <Users className="h-4 w-4 text-emerald-400" />;
    }
    if (tab === 'Học vụ' || category === 'academic') {
      return <BookOpen className="h-4 w-4 text-cyan-400" />;
    }
    return <Sparkles className="h-4 w-4 text-violet-400" />;
  };

  const tabs: NotificationTab[] = ['Tất cả', 'Deadline', 'CLB', 'Học vụ'];

  return (
    <div className="relative space-y-6">
      {/* Header Hub */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-card/40 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 mb-3">
              <Bell className="h-3.5 w-3.5" />
              Trung tâm thông báo CampusOS
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Thông Báo & Nhắc Nhở
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl leading-relaxed">
              Tổng hợp deadline bài tập, thông báo học vụ, giảng đường và sự kiện các câu lạc bộ trong một giao diện duy nhất.
            </p>
          </div>

          {/* Quick Counter Pills & Bulk Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2.5 flex items-center gap-3">
              <div>
                <p className="font-mono text-xl font-black text-white">{totalUnread}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Chưa đọc</p>
              </div>

              {urgentCount > 0 && (
                <div className="pl-3 border-l border-white/10">
                  <div className="flex items-center gap-1 text-rose-400 font-mono text-xl font-black">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                    </span>
                    {urgentCount}
                  </div>
                  <p className="text-[10px] text-rose-300 uppercase font-bold">Gấp (&lt;12h)</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold transition-colors"
            >
              <CheckCheck className="h-4 w-4 text-cyan-400" />
              Đánh dấu tất cả
            </button>

            {notifications.some((n) => n.isRead) && (
              <button
                type="button"
                onClick={handleClearAllRead}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-rose-500/10 hover:text-rose-300 text-slate-300 text-xs font-semibold transition-colors"
                title="Xóa tất cả các thông báo đã đọc"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Dọn đã đọc
              </button>
            )}

            <Link
              href="/settings#notifications"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
              aria-label="Cài đặt thông báo"
            >
              <Settings2 className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Controls Bar: Search & 4 Dedicated Tabs */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bài tập, môn học, CLB..."
            className="w-full h-11 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl pl-10 pr-4 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-cyan-400/50 shadow-inner"
          />
        </div>

        {/* 4 Dedicated Tabs */}
        <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-1 overflow-x-auto">
          {tabs.map((tab) => {
            const count = tabCounts[tab];
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(61,232,255,0.3)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Notifications List */}
      <section className="space-y-3">
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => {
            const urgent = isUrgentNotice(notice);

            return (
              <div
                key={notice.id}
                className={`group relative rounded-2xl border p-4 sm:p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  notice.isRead
                    ? 'border-white/5 bg-card/25 opacity-80 hover:opacity-100 hover:border-white/15'
                    : urgent
                    ? 'border-rose-500/40 bg-rose-500/[0.04] shadow-[0_0_16px_rgba(244,63,94,0.15)] hover:border-rose-400/60'
                    : 'border-cyan-500/30 bg-cyan-500/[0.03] hover:border-cyan-400/50 shadow-sm'
                }`}
              >
                {/* Left: Icon, Content & Category Tag */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Category Indicator Icon */}
                  <div
                    onClick={(e) => handleToggleRead(notice.id, e)}
                    className="mt-0.5 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 shadow-inner hover:scale-105 transition-transform"
                    title={notice.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                  >
                    {getCategoryIcon(notice.category, notice.tab)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-tight line-clamp-1">
                        {notice.title}
                      </span>

                      {/* Urgency Badge */}
                      {urgent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border border-rose-500/40 bg-rose-500/20 text-rose-300 animate-pulse">
                          <AlertTriangle className="h-3 w-3" />
                          GẤP &lt;12H
                        </span>
                      )}

                      {/* Tab Badge */}
                      <span className="text-[10px] px-2 py-0.5 rounded-md border border-white/10 bg-white/5 text-slate-300 font-medium">
                        {notice.tab}
                      </span>

                      {/* Unread Glowing Dot */}
                      {!notice.isRead && (
                        <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#3DE8FF]" />
                      )}
                    </div>

                    <p className="mt-1 text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {notice.detail}
                    </p>

                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3 w-3 text-slate-400" />
                        {notice.time}
                      </span>

                      {notice.actionHref && (
                        <Link
                          href={notice.actionHref}
                          className="text-cyan-400 hover:text-cyan-300 underline font-semibold transition-colors"
                        >
                          Đi tới mục liên quan &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions: Toggle Read & Delete */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={(e) => handleToggleRead(notice.id, e)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label={notice.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                    title={notice.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                  >
                    <Check className={`h-4 w-4 ${notice.isRead ? 'text-emerald-400' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteWithUndo(notice, e)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    aria-label="Xóa thông báo"
                    title="Xóa thông báo (có thể hoàn tác)"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State */
          <div className="rounded-[2rem] border border-dashed border-white/10 bg-card/20 p-12 text-center">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <h4 className="mt-3 text-base font-bold text-white">Không có thông báo nào</h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `Không tìm thấy thông báo khớp với từ khóa "${searchQuery}".`
                : `Hộp thư tab "${activeTab}" của bạn hiện đang hoàn toàn trống và ngăn nắp.`}
            </p>
          </div>
        )}
      </section>

      {/* Floating 5-Second Reversible Undo Toast */}
      {deletedNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border border-cyan-400/40 bg-slate-950/90 backdrop-blur-2xl px-5 py-3.5 shadow-2xl animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-slate-200">
              Đã xóa: <strong className="text-white truncate max-w-[200px]">{deletedNotice.title}</strong>
            </span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          {/* Undo Action */}
          <button
            type="button"
            onClick={handleUndoDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black hover:bg-cyan-400 transition-colors shadow-md"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Hoàn tác ({undoSecondsLeft}s)
          </button>
        </div>
      )}
    </div>
  );
}
