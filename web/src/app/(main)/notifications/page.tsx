'use client';

import React from 'react';
import { NotificationsManager } from '@/components/notifications/notifications-manager';

export default function NotificationsPage() {
  return (
    <div className="relative mx-auto w-full max-w-[1300px] overflow-x-hidden min-w-0 pb-12">
      {/* Background Ambient Aurora Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="absolute top-1/2 -left-40 h-[460px] w-[460px] rounded-full bg-violet-500/15 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/3 h-[450px] w-[450px] rounded-full bg-rose-500/10 blur-[130px]" />
      </div>

      <NotificationsManager />
    </div>
  );
}
