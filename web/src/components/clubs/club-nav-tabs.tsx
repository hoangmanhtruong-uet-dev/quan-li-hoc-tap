'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Coins,
  Users,
  Kanban,
  Sparkles,
} from 'lucide-react';

interface ClubNavTabsProps {
  clubId: string;
  eventCount?: number;
  memberCount?: number;
  pendingTaskCount?: number;
}

export function ClubNavTabs({
  clubId,
  eventCount = 0,
  memberCount = 0,
  pendingTaskCount = 0,
}: ClubNavTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      id: 'overview',
      label: 'Tổng quan',
      href: `/clubs/${clubId}`,
      icon: LayoutDashboard,
      isActive: pathname === `/clubs/${clubId}`,
    },
    {
      id: 'events',
      label: 'Sự kiện & Workshop',
      href: `/clubs/${clubId}/events`,
      icon: Calendar,
      badge: eventCount > 0 ? eventCount : undefined,
      isActive: pathname === `/clubs/${clubId}/events`,
    },
    {
      id: 'finance',
      label: 'Quản lý Ngân sách & Quỹ',
      href: `/clubs/${clubId}/finance`,
      icon: Coins,
      isActive: pathname === `/clubs/${clubId}/finance`,
    },
    {
      id: 'members',
      label: 'Ban & Thành viên',
      href: `/clubs/${clubId}/members`,
      icon: Users,
      badge: memberCount > 0 ? memberCount : undefined,
      isActive: pathname === `/clubs/${clubId}/members`,
    },
    {
      id: 'tasks',
      label: 'Nhiệm vụ Ban',
      href: `/clubs/${clubId}/tasks`,
      icon: Kanban,
      badge: pendingTaskCount > 0 ? pendingTaskCount : undefined,
      isActive: pathname === `/clubs/${clubId}/tasks`,
    },
  ];

  return (
    <div className="relative w-full overflow-x-auto pb-2 scrollbar-none">
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-card/30 backdrop-blur-2xl p-1.5 min-w-max shadow-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
                tab.isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 text-cyan-200 shadow-md shadow-cyan-950/40'
                  : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon
                className={`h-4 w-4 transition-colors ${
                  tab.isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
              <span>{tab.label}</span>

              {tab.badge !== undefined && (
                <span
                  className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-mono font-bold ${
                    tab.isActive
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-white/10 text-slate-300 group-hover:bg-white/20'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
