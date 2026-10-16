'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Scale,
  CheckSquare,
  Users,
} from 'lucide-react';
import { SEED_LIVING_SPACE, ChoreTask } from '@/lib/living-engine';

export default function LivingChoresPage() {
  const params = useParams();
  const space = SEED_LIVING_SPACE;
  const [chores, setChores] = useState<ChoreTask[]>(space.chores);

  const formatVnd = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + 'đ';

  const toggleChore = (choreId: string) => {
    setChores((prev) =>
      prev.map((c) =>
        c.id === choreId
          ? {
              ...c,
              status: c.status === 'completed' ? 'pending' : 'completed',
            }
          : c
      )
    );
  };

  const tabs = [
    { label: 'Tổng quan phòng', href: '', icon: null },
    { label: 'Hóa đơn & EVN', href: '/expenses', icon: Receipt },
    { label: 'Quyết toán nợ', href: '/debts', icon: Scale },
    { label: 'Trực nhật tuần', href: '/chores', icon: CheckSquare, active: true },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header & Navigation */}
      <div>
        <Link
          href={`/living/${space.id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-cyan-400 transition-colors mb-3 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Trở về Chi tiết phòng {space.roomNumber}
        </Link>

        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-card/40 border border-white/10 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/10 border border-emerald-400/20 text-emerald-300">
                Phân công Vệ sinh Phòng
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                Lịch Trực nhật & Vệ sinh Phòng KTX
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Duy trì không gian sống sạch sẽ, văn minh. Quá hạn trực nhật sẽ tính tiền phạt vào quỹ phòng.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-background/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shrink-0">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Đã hoàn thành</div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {chores.filter((c) => c.status === 'completed').length} / {chores.length}
                </div>
                <div className="text-xs text-muted-foreground">Tuần này</div>
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

      {/* 3. Chores Schedule List */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chores.map((chore) => {
            const assignee = space.members.find((m) => m.id === chore.assigneeId);
            const isCompleted = chore.status === 'completed';

            return (
              <div
                key={chore.id}
                onClick={() => toggleChore(chore.id)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-4 backdrop-blur-2xl ${
                  isCompleted
                    ? 'bg-emerald-500/[0.04] border-emerald-500/20'
                    : 'bg-card/40 border-white/10 hover:border-cyan-400/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold'
                          : 'border-white/20 bg-white/5 text-muted-foreground'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="text-xs font-mono font-bold text-cyan-400">
                        {chore.dayOfWeek}
                      </div>
                      <h4
                        className={`text-base font-bold ${
                          isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {chore.title}
                      </h4>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {isCompleted ? 'Đã xong' : 'Chưa xong'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                  <div className="text-muted-foreground flex items-center gap-2">
                    <span>Phụ trách:</span>
                    <strong className="text-foreground">{assignee?.name ?? 'Chưa gán'}</strong>
                  </div>

                  <span className="font-mono text-rose-400">
                    Phạt trễ: {formatVnd(chore.penaltyAmount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}