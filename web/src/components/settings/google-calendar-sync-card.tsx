'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  Layers,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useCampusStore } from '@/lib/campus-store';
import { exportToIcs, type CalendarEvent } from '@/lib/ics-calendar';

export type SyncInterval = '15m' | '1h' | '6h' | 'manual';

export interface GCalSyncConfig {
  connected: boolean;
  accountEmail: string;
  autoSync: boolean;
  interval: SyncInterval;
  syncClasses: boolean;
  syncDeadlines: boolean;
  syncClubs: boolean;
  lastSyncedAt: string | null;
}

export const DEFAULT_GCAL_CONFIG: GCalSyncConfig = {
  connected: true,
  accountEmail: 'minh.nguyen@campus.edu.vn',
  autoSync: true,
  interval: '1h',
  syncClasses: true,
  syncDeadlines: true,
  syncClubs: true,
  lastSyncedAt: 'Vừa xong',
};

export const GCAL_STORAGE_KEY = 'campusos-gcal-sync-v1';

export function validateGCalConfig(config: Partial<GCalSyncConfig>): boolean {
  if (config.connected && !config.accountEmail) return false;
  if (config.interval && !['15m', '1h', '6h', 'manual'].includes(config.interval)) return false;
  return true;
}

export function formatGCalSummary(config: GCalSyncConfig, totalEventsCount: number): string {
  const activeCategories: string[] = [];
  if (config.syncClasses) activeCategories.push('Lớp học');
  if (config.syncDeadlines) activeCategories.push('Deadline');
  if (config.syncClubs) activeCategories.push('CLB');

  return `Đang đồng bộ ${totalEventsCount} sự kiện (${activeCategories.join(', ') || 'Không chọn mục nào'})`;
}

interface GoogleCalendarSyncCardProps {
  className?: string;
}

export function GoogleCalendarSyncCard({ className = '' }: GoogleCalendarSyncCardProps) {
  const { state: campusState } = useCampusStore();
  const [config, setConfig] = useState<GCalSyncConfig>(DEFAULT_GCAL_CONFIG);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState(false);
  const [icsExportToast, setIcsExportToast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(GCAL_STORAGE_KEY);
      if (raw) {
        setConfig((prev) => ({ ...prev, ...JSON.parse(raw) }));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const saveConfig = (newConfig: GCalSyncConfig) => {
    setConfig(newConfig);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(GCAL_STORAGE_KEY, JSON.stringify(newConfig));
      } catch {
        // Ignore storage errors
      }
    }
  };

  const handleToggleConnection = () => {
    const updated = {
      ...config,
      connected: !config.connected,
      accountEmail: !config.connected ? 'minh.nguyen@campus.edu.vn' : '',
    };
    saveConfig(updated);
  };

  const handleSyncNow = () => {
    if (isSyncing) return;
    setIsSyncing(true);

    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const updated = {
        ...config,
        lastSyncedAt: `${timeStr} hôm nay`,
      };
      saveConfig(updated);
      setSyncSuccessToast(true);
      setTimeout(() => setSyncSuccessToast(false), 2500);
    }, 900);
  };

  const handleExportIcs = () => {
    const eventsToExport: CalendarEvent[] = (campusState.events || []).map((ev) => ({
      id: ev.id,
      title: ev.title,
      date: ev.date,
      start: ev.start,
      end: ev.end,
      type: ev.type,
      location: ev.location,
      description: ev.description,
    }));

    // If no events in store, fallback to default seed events
    const icsContent = exportToIcs(
      eventsToExport.length > 0
        ? eventsToExport
        : [
            {
              id: 'ev-1',
              title: 'Mạng máy tính & Truyền thông',
              date: '2026-10-19',
              start: '08:00',
              end: '11:30',
              type: 'class',
              location: 'D201 · Tòa D',
            },
            {
              id: 'ev-2',
              title: 'Cấu trúc dữ liệu & Giải thuật',
              date: '2026-10-20',
              start: '13:30',
              end: '17:00',
              type: 'class',
              location: 'B305 · Tòa B',
            },
          ]
    );

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'campusos-schedule.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIcsExportToast(true);
    setTimeout(() => setIcsExportToast(false), 2500);
  };

  const totalEvents = campusState.events?.length || 8;

  return (
    <div
      className={`relative rounded-2xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 sm:p-6 shadow-lg overflow-hidden space-y-5 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cyan-400" />
            <h4 className="text-base font-bold text-white tracking-tight">
              Đồng Bộ Google Calendar & Lịch Biểu
            </h4>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tự động hai chiều giữa thời khóa biểu CampusOS và Google Calendar của bạn
          </p>
        </div>

        {/* Connection Status Button */}
        <button
          type="button"
          onClick={handleToggleConnection}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
            config.connected
              ? 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
              : 'border border-cyan-400/40 bg-cyan-500 text-slate-950 hover:bg-cyan-400'
          }`}
        >
          {config.connected ? (
            <>
              <ShieldCheck className="h-4 w-4" /> Đã kết nối Google Workspace
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4" /> Kết nối Google Calendar
            </>
          )}
        </button>
      </div>

      {/* Account Info Box (When Connected) */}
      {config.connected && (
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white font-bold text-sm">
              G
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-white truncate">
                {config.accountEmail}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Tài khoản trường đại học · Google Calendar API v3
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 text-xs font-bold transition-all shadow-sm disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportIcs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold transition-colors"
              title="Xuất file RFC 5545 .ics để nhập vào Apple Calendar hoặc Outlook"
            >
              <Download className="h-3.5 w-3.5 text-violet-400" />
              <span>Xuất .ics</span>
            </button>
          </div>
        </div>
      )}

      {/* Sync Preferences & Toggles */}
      <div className="grid gap-4 sm:grid-cols-2 pt-1">
        {/* Frequency & Auto Sync */}
        <div className="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Tự động đồng bộ</span>
              <span className="text-[10px] text-muted-foreground">
                Đẩy sự kiện mới lên lịch định kỳ
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={config.autoSync}
              onClick={() => saveConfig({ ...config, autoSync: !config.autoSync })}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                config.autoSync ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-slate-950 transition-transform ${
                  config.autoSync ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Chu kỳ đồng bộ
            </label>
            <div className="relative">
              <select
                value={config.interval}
                onChange={(e) =>
                  saveConfig({ ...config, interval: e.target.value as SyncInterval })
                }
                className="w-full h-9 rounded-xl border border-white/15 bg-slate-950/70 px-3 text-xs text-white focus:outline-none focus:border-cyan-400 appearance-none"
              >
                <option value="15m">Mỗi 15 phút</option>
                <option value="1h">Mỗi 1 giờ (Khuyên dùng)</option>
                <option value="6h">Mỗi 6 giờ</option>
                <option value="manual">Chỉ thủ công khi nhấn nút</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Sync Categories Checkboxes */}
        <div className="space-y-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <span className="text-xs font-bold text-white block">Danh mục đồng bộ</span>

          <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={config.syncClasses}
              onChange={(e) => saveConfig({ ...config, syncClasses: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-500 focus:ring-0"
            />
            <span>Thời khóa biểu lớp học chính khóa</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={config.syncDeadlines}
              onChange={(e) => saveConfig({ ...config, syncDeadlines: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-500 focus:ring-0"
            />
            <span>Deadline bài tập & Lịch thi</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={config.syncClubs}
              onChange={(e) => saveConfig({ ...config, syncClubs: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-500 focus:ring-0"
            />
            <span>Sự kiện & Workshop câu lạc bộ</span>
          </label>
        </div>
      </div>

      {/* Sync Footer & Timestamps */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-white/10 text-[11px] text-muted-foreground">
        <span>{formatGCalSummary(config, totalEvents)}</span>
        <span>Lần đồng bộ gần nhất: {config.lastSyncedAt || 'Chưa đồng bộ'}</span>
      </div>

      {/* Success Toasts */}
      {syncSuccessToast && (
        <div className="p-2.5 rounded-xl border border-cyan-400/40 bg-cyan-500/10 text-cyan-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="h-4 w-4" />
          Đã đồng bộ {totalEvents} sự kiện sang Google Calendar thành công!
        </div>
      )}

      {icsExportToast && (
        <div className="p-2.5 rounded-xl border border-violet-400/40 bg-violet-500/10 text-violet-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Download className="h-4 w-4" />
          Đã tạo và tải xuống file lịch chuẩn RFC 5545 (campusos-schedule.ics).
        </div>
      )}
    </div>
  );
}
