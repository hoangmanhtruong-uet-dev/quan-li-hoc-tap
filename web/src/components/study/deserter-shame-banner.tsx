'use client';

import React, { useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { pomodoroAudio } from '@/features/pomodoro/audio-engine';
import type { DeserterViolationEvent } from '@/hooks/use-study-room-realtime';

interface DeserterShameBannerProps {
  notice: DeserterViolationEvent | null;
  onDismiss: () => void;
  isSelf?: boolean;
}

export function DeserterShameBanner({
  notice,
  onDismiss,
  isSelf = false,
}: DeserterShameBannerProps) {
  useEffect(() => {
    if (notice) {
      pomodoroAudio.unlock();
      pomodoroAudio.playAlertSound('penalty');
    }
  }, [notice]);

  if (!notice) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="relative overflow-hidden rounded-3xl border-2 border-rose-500 bg-rose-950/90 p-4 sm:p-5 shadow-2xl shadow-rose-950/70 backdrop-blur-2xl animate-panic-shake transition-all"
    >
      {/* Background Danger Glow */}
      <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-rose-500/25 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -right-12 -bottom-12 h-36 w-36 rounded-full bg-orange-500/20 blur-3xl" />

      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        {/* Left: Icon & Message */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 border-2 border-rose-400 text-rose-300 shadow-lg shadow-rose-500/30">
            <ShieldAlert className="h-6 w-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-[11px] font-black tracking-widest text-rose-400 uppercase">
                🚨 CẢNH BÁO KỶ LUẬT SILENT FOCUS
              </span>
              <span className="rounded-full bg-rose-500/30 border border-rose-400/60 px-2 py-0.5 font-mono text-[11px] font-black text-rose-200 shadow">
                -{notice.penaltyXp} XP
              </span>
            </div>

            <div className="text-sm font-bold text-white mt-1">
              Thành viên{' '}
              <strong className="text-rose-300 font-black underline decoration-rose-500/50 underline-offset-2">
                {notice.userName}
              </strong>{' '}
              đã {notice.reason} và bị phạt trừ{' '}
              <span className="font-mono text-rose-300 font-extrabold">{notice.penaltyXp} XP</span>!
            </div>
          </div>
        </div>

        {/* Right: Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onDismiss}
            className="flex items-center gap-1.5 rounded-2xl border border-rose-400/50 bg-gradient-to-r from-rose-500/30 to-orange-500/30 px-5 py-2.5 text-xs font-bold text-rose-100 hover:from-rose-500/40 hover:to-orange-500/40 hover:border-rose-400 active:scale-95 transition-all shadow-md shadow-rose-950/40"
          >
            <CheckCircle2 className="h-4 w-4 text-rose-300" />
            <span>{isSelf ? 'Tôi đã tập trung trở lại' : 'Đã hiểu'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
