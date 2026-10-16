'use client';

import React from 'react';
import Link from 'next/link';
import { ClubDetail } from '@/lib/club-engine';
import {
  Code2,
  Languages,
  Camera,
  Trophy,
  Users,
  Calendar,
  Coins,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ClubCardProps {
  club: ClubDetail;
}

export function ClubCard({ club }: ClubCardProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code2':
        return <Code2 className="h-6 w-6 text-white" />;
      case 'Languages':
        return <Languages className="h-6 w-6 text-white" />;
      case 'Camera':
        return <Camera className="h-6 w-6 text-white" />;
      case 'Trophy':
      default:
        return <Trophy className="h-6 w-6 text-white" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Công nghệ':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30';
      case 'Ngoại ngữ':
        return 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/30';
      case 'Nghệ thuật':
        return 'bg-amber-500/15 text-amber-300 border-amber-400/30';
      case 'Thể thao':
      default:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30';
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'OWNER':
        return { label: 'Ban Chủ nhiệm', className: 'bg-amber-500/15 text-amber-300 border-amber-400/30' };
      case 'ADMIN':
        return { label: 'Ban Quản trị', className: 'bg-purple-500/15 text-purple-300 border-purple-400/30' };
      case 'MANAGER':
        return { label: 'Điều phối viên', className: 'bg-blue-500/15 text-blue-300 border-blue-400/30' };
      case 'MEMBER':
        return { label: 'Thành viên', className: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30' };
      case 'VIEWER':
      default:
        return { label: 'Đang theo dõi', className: 'bg-slate-500/15 text-slate-300 border-slate-400/30' };
    }
  };

  const roleInfo = getRoleBadge(club.currentUserRole);
  const totalFunds = club.generalFundBalance + club.eventFundBalance + club.reserveFundBalance;
  const formattedFunds = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(totalFunds);

  const nextEvent = club.events[0];

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400/40 hover:bg-card/60 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/20">
      {/* Top Banner Gradient */}
      <div className={`relative h-28 w-full bg-gradient-to-r ${club.coverGradient} p-4 overflow-hidden`}>
        <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 shadow-md">
              {getIcon(club.iconName)}
            </div>
            <div>
              <span className="font-mono text-xs font-black tracking-widest text-white/90 uppercase px-2 py-0.5 rounded-md bg-black/25">
                {club.shortName}
              </span>
              <p className="text-[11px] text-white/75 font-medium mt-0.5">
                Thành lập {club.establishedYear}
              </p>
            </div>
          </div>

          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md ${roleInfo.className}`}
          >
            {roleInfo.label}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getCategoryBadgeClass(
                club.category,
              )}`}
            >
              {club.category}
            </span>
            {club.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/5 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300"
              >
                #{tag}
              </span>
            ))}
          </div>

          <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
            {club.name}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[2.5rem]">
            {club.description}
          </p>
        </div>

        {/* Info Grid */}
        <div className="space-y-2.5 rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Users className="h-3.5 w-3.5 text-cyan-400" /> Thành viên
            </span>
            <span className="font-mono font-bold text-white">{club.members.length} người</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Coins className="h-3.5 w-3.5 text-amber-400" /> Ngân sách quỹ
            </span>
            <span className="font-mono font-bold text-amber-300">{formattedFunds}</span>
          </div>

          {nextEvent && (
            <div className="flex items-center justify-between border-t border-white/5 pt-2">
              <span className="flex items-center gap-1.5 text-slate-400 truncate max-w-[140px]">
                <Calendar className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{nextEvent.title}</span>
              </span>
              <span className="font-mono text-[11px] text-emerald-300 shrink-0 font-medium">
                {nextEvent.date.split('-').reverse().slice(0, 2).join('/')}
              </span>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="pt-1">
          <Link
            href={`/clubs/${club.id}`}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-cyan-300 backdrop-blur-md transition-all group-hover:bg-cyan-500/20 group-hover:border-cyan-400/40 group-hover:text-cyan-200"
          >
            <span>Chi tiết câu lạc bộ</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
