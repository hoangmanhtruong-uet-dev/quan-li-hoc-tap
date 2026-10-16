'use client';

import React from 'react';
import Link from 'next/link';
import { ClubDetail } from '@/lib/club-engine';
import {
  ArrowLeft,
  Users,
  Calendar,
  Coins,
  CheckCircle2,
  Code2,
  Languages,
  Camera,
  Trophy,
  Shield,
  Sparkles,
} from 'lucide-react';

interface ClubHeroProps {
  club: ClubDetail;
  className?: string;
}

export function ClubHero({ club, className = '' }: ClubHeroProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code2':
        return <Code2 className="h-7 w-7 text-white" />;
      case 'Languages':
        return <Languages className="h-7 w-7 text-white" />;
      case 'Camera':
        return <Camera className="h-7 w-7 text-white" />;
      case 'Trophy':
      default:
        return <Trophy className="h-7 w-7 text-white" />;
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'OWNER':
        return { label: 'Ban Chủ nhiệm', className: 'bg-amber-500/20 text-amber-300 border-amber-400/40' };
      case 'ADMIN':
        return { label: 'Ban Quản trị', className: 'bg-purple-500/20 text-purple-300 border-purple-400/40' };
      case 'MANAGER':
        return { label: 'Điều phối viên', className: 'bg-blue-500/20 text-blue-300 border-blue-400/40' };
      case 'MEMBER':
        return { label: 'Thành viên', className: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40' };
      case 'VIEWER':
      default:
        return { label: 'Khách tham quan', className: 'bg-slate-500/20 text-slate-300 border-slate-400/40' };
    }
  };

  const totalFunds = club.generalFundBalance + club.eventFundBalance + club.reserveFundBalance;
  const formattedFunds = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(totalFunds);

  const pendingTasks = club.tasks.filter((t) => t.status !== 'done').length;
  const roleInfo = getRoleBadge(club.currentUserRole);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Back button */}
      <div>
        <Link
          href="/clubs"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur-md hover:bg-white/10 hover:text-white transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Danh sách câu lạc bộ</span>
        </Link>
      </div>

      {/* Cyber-Glass Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/20">
        {/* Dynamic Background Aurora Gradients */}
        <div
          className={`pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gradient-to-br ${club.coverGradient} opacity-20 blur-3xl`}
        />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          {/* Left Info Column */}
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-black tracking-widest text-cyan-400 uppercase px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-400/30">
                {club.shortName}
              </span>
              <span className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
                Lĩnh vực {club.category}
              </span>
              <span className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-400 font-mono">
                Est. {club.establishedYear}
              </span>
              <span
                className={`rounded-xl border px-2.5 py-1 text-xs font-bold backdrop-blur-md ${roleInfo.className}`}
              >
                {roleInfo.label}
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 shadow-lg backdrop-blur-md">
                {getIcon(club.iconName)}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                  {club.name}
                </h1>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-2xl">
                  {club.description}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {club.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right Metrics Bento */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 shrink-0">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Users className="h-4 w-4 text-cyan-400" /> Thành viên
              </div>
              <p className="mt-2 font-mono text-2xl font-extrabold text-white">
                {club.members.length}
              </p>
              <p className="text-[11px] text-slate-400">4 ban chuyên môn</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Calendar className="h-4 w-4 text-emerald-400" /> Sự kiện
              </div>
              <p className="mt-2 font-mono text-2xl font-extrabold text-white">
                {club.events.length}
              </p>
              <p className="text-[11px] text-slate-400">Hoạt động trong kỳ</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-purple-400" /> Nhiệm vụ ban
              </div>
              <p className="mt-2 font-mono text-2xl font-extrabold text-white">
                {pendingTasks}
              </p>
              <p className="text-[11px] text-slate-400">Đang thực hiện</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Coins className="h-4 w-4 text-amber-400" /> Tổng quỹ CLB
              </div>
              <p className="mt-2 font-mono text-lg font-extrabold text-amber-300">
                {formattedFunds}
              </p>
              <p className="text-[11px] text-slate-400">3 quỹ tài chính</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
