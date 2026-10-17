'use client';

import React, { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { useCloudSyncStatus, flushOfflineQueue } from '@/lib/supabase-sync';

interface CloudSyncIndicatorProps {
  className?: string;
  showText?: boolean;
}

export function CloudSyncIndicator({
  className = '',
  showText = true,
}: CloudSyncIndicatorProps) {
  const { status, isOnline } = useCloudSyncStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleManualSync = async () => {
    if (status === 'syncing' || isRetrying) return;
    setIsRetrying(true);
    try {
      await flushOfflineQueue();
    } finally {
      setIsRetrying(false);
    }
  };

  // State configurations
  let statusText = 'Đã lưu đám mây';
  let badgeColor = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  let iconNode = (
    <div className="relative flex items-center justify-center">
      <Cloud className="h-3.5 w-3.5 text-emerald-400" />
      <Check className="absolute -bottom-0.5 -right-1 h-2.5 w-2.5 text-emerald-300 stroke-[3]" />
    </div>
  );

  if (status === 'syncing' || isRetrying) {
    statusText = 'Đang đồng bộ...';
    badgeColor = 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    iconNode = (
      <div className="animate-spin text-amber-400">
        <RefreshCw className="h-3.5 w-3.5" />
      </div>
    );
  } else if (status === 'offline' || !isOnline) {
    statusText = 'Ngoại tuyến';
    badgeColor = 'border-slate-500/30 bg-slate-500/10 text-slate-300';
    iconNode = <CloudOff className="h-3.5 w-3.5 text-slate-400" />;
  } else if (status === 'error') {
    statusText = 'Lỗi kết nối';
    badgeColor = 'border-rose-500/30 bg-rose-500/10 text-rose-300';
    iconNode = <AlertCircle className="h-3.5 w-3.5 text-rose-400" />;
  }

  return (
    <button
      type="button"
      onClick={handleManualSync}
      role="status"
      aria-live="polite"
      aria-label={`Trạng thái đám mây: ${statusText}`}
      title={
        status === 'error' || status === 'offline'
          ? `${statusText} - Nhấn để thử đồng bộ lại`
          : statusText
      }
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-md transition-colors hover:brightness-110 active:scale-95 ${badgeColor} ${className}`}
    >
      {iconNode}
      {showText && <span className="hidden sm:inline font-sans">{statusText}</span>}
    </button>
  );
}
