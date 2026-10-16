'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Scale,
  CheckCircle2,
  Receipt,
  CheckSquare,
  QrCode,
  ArrowRight,
  Sparkles,
  CircleDollarSign,
  X,
} from 'lucide-react';
import {
  SEED_LIVING_SPACE,
  settleDebtsMinimally,
  DebtTransfer,
} from '@/lib/living-engine';

export default function LivingDebtsPage() {
  const params = useParams();
  const space = SEED_LIVING_SPACE;

  const [transfers, setTransfers] = useState<DebtTransfer[]>(() =>
    settleDebtsMinimally(space.members)
  );
  const [selectedTx, setSelectedTx] = useState<DebtTransfer | null>(null);

  const formatVnd = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + 'đ';

  const markTransferComplete = (index: number) => {
    setTransfers((prev) => prev.filter((_, i) => i !== index));
    setSelectedTx(null);
  };

  const tabs = [
    { label: 'Tổng quan phòng', href: '', icon: null },
    { label: 'Hóa đơn & EVN', href: '/expenses', icon: Receipt },
    { label: 'Quyết toán nợ', href: '/debts', icon: Scale, active: true },
    { label: 'Trực nhật tuần', href: '/chores', icon: CheckSquare },
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
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-cyan-500/10 border border-cyan-400/20 text-cyan-300">
                Min-Cash-Flow Algorithm
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                Quyết toán Nợ & Chuyển tiền Tối thiểu
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Thuật toán tối thiểu hóa số lần chuyển khoản giữa các thành viên. Chỉ cần hoàn tất{' '}
                <strong className="text-cyan-400 font-mono">{transfers.length} giao dịch</strong> là
                toàn bộ nợ phòng được xóa sạch!
              </p>
            </div>

            <div className="flex items-center gap-4 bg-background/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shrink-0">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Giao dịch còn lại</div>
                <div className="text-3xl font-black font-mono text-cyan-400">
                  {transfers.length}
                </div>
                <div className="text-xs text-emerald-400 font-semibold">Tối ưu 100%</div>
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
                  ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(61,232,255,0.2)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* 3. Debt Settlement Transfers */}
      <div className="space-y-4">
        {transfers.length === 0 ? (
          <div className="py-16 text-center rounded-3xl backdrop-blur-2xl bg-card/40 border border-white/10 p-8 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mx-auto text-2xl">
              🎉
            </div>
            <h3 className="text-lg font-bold text-foreground">Toàn bộ nợ phòng đã được quyết toán!</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Tất cả chi phí điện nước và sinh hoạt chung đã cân bằng, không còn thành viên nào nợ nhau.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transfers.map((tx, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl backdrop-blur-2xl bg-card/40 border border-white/10 hover:border-cyan-400/30 transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      Giao dịch #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <span className="text-rose-400">{tx.fromName}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <span className="text-emerald-400">{tx.toName}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Số tiền cần chuyển</div>
                    <div className="text-xl font-black font-mono text-cyan-400">
                      {formatVnd(tx.amount)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={() => setSelectedTx(tx)}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-semibold text-xs hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Mã VietQR
                  </button>

                  <button
                    onClick={() => markTransferComplete(idx)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Xác nhận đã trả
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. VietQR Simulated Modal */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedTx(null);
          }}
        >
          <div className="w-full max-w-sm rounded-3xl backdrop-blur-2xl bg-card border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6 text-center">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400">VietQR Napas 247</span>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-48 h-48 mx-auto rounded-2xl bg-white p-3 flex flex-col items-center justify-center shadow-lg">
              <QrCode className="w-36 h-36 text-slate-950" />
              <span className="text-[10px] font-mono text-slate-600 font-bold mt-1">
                Quét mã để chuyển tiền
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Người nhận: {selectedTx.toName}</div>
              <div className="text-2xl font-black font-mono text-cyan-400">
                {formatVnd(selectedTx.amount)}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                Nội dung: {selectedTx.fromName} chuyen tien phong 402
              </div>
            </div>

            <button
              onClick={() => {
                const idx = transfers.findIndex(
                  (t) => t.fromMemberId === selectedTx.fromMemberId && t.toMemberId === selectedTx.toMemberId
                );
                if (idx !== -1) markTransferComplete(idx);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              Đã chuyển khoản thành công
            </button>
          </div>
        </div>
      )}
    </div>
  );
}