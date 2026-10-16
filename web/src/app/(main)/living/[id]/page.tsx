'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Home,
  Users,
  Receipt,
  CheckSquare,
  Scale,
  Sparkles,
  Phone,
  ShieldCheck,
  CircleDollarSign,
  Droplets,
  Zap,
} from 'lucide-react';
import { SEED_LIVING_SPACE, LivingSpaceItem } from '@/lib/living-engine';

export default function LivingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = (params.id as string) || '';

  const space = SEED_LIVING_SPACE;
  const formatVnd = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + 'đ';

  const tabs = [
    { label: 'Tổng quan phòng', href: '', active: true },
    { label: 'Hóa đơn & EVN', href: '/expenses', icon: Receipt },
    { label: 'Quyết toán nợ', href: '/debts', icon: Scale },
    { label: 'Trực nhật tuần', href: '/chores', icon: CheckSquare },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header & Navigation */}
      <div>
        <Link
          href="/living"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-cyan-400 transition-colors mb-3 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Trở về Tổng quan Không gian sống
        </Link>

        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-card/40 border border-white/10 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/10 border border-emerald-400/20 text-emerald-300">
                  Phòng {space.roomNumber}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-foreground/80">
                  {space.members.length} Bạn cùng phòng
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-400/20 text-cyan-300">
                  Ký túc xá Khu B ĐHQG
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                {space.name}
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                {space.address}
              </p>
            </div>

            <div className="flex items-center gap-4 bg-background/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shrink-0">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Quỹ chung phòng</div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {formatVnd(space.commonFundBalance)}
                </div>
                <div className="text-xs text-muted-foreground">Đã đóng đủ tháng này</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-tabs Selector */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const href = `/living/${space.id}${tab.href}`;
          const isCurrent = tab.active;

          return (
            <Link
              key={tab.href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                isCurrent
                  ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* 3. Detailed Roommates Roster */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          Danh sách Thành viên phòng {space.roomNumber}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {space.members.map((member) => (
            <div
              key={member.id}
              className="p-5 rounded-3xl backdrop-blur-2xl bg-card/40 border border-white/10 hover:border-emerald-400/30 transition-all flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-sm">
                  {member.avatar}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{member.name}</span>
                    {member.role === 'lead' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                        Trưởng phòng
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    {member.phone}
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="text-xs text-muted-foreground">Cán cân nợ</div>
                <div
                  className={`font-mono font-bold text-sm ${
                    member.netBalance > 0
                      ? 'text-emerald-400'
                      : member.netBalance < 0
                      ? 'text-rose-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  {member.netBalance > 0
                    ? `+${formatVnd(member.netBalance)}`
                    : member.netBalance < 0
                    ? formatVnd(member.netBalance)
                    : 'Cân bằng'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}