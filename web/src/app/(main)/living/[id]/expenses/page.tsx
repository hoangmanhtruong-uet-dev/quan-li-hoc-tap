'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Zap,
  Droplets,
  Wifi,
  Receipt,
  Scale,
  CheckSquare,
  Sparkles,
  Calculator,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  SEED_LIVING_SPACE,
  calculateEvnElectricityCost,
  UtilityBill,
} from '@/lib/living-engine';

export default function LivingExpensesPage() {
  const params = useParams();
  const rawId = (params.id as string) || '';
  const space = SEED_LIVING_SPACE;

  const [bills, setBills] = useState<UtilityBill[]>(space.bills);
  const [electricStartIndex, setElectricStartIndex] = useState(2450);
  const [electricEndIndex, setElectricEndIndex] = useState(2680);

  const formatVnd = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + 'đ';

  // Live EVN calculation
  const kwhUsed = Math.max(0, electricEndIndex - electricStartIndex);
  const evnCost = calculateEvnElectricityCost(kwhUsed);
  const costPerPerson = Math.round(evnCost.totalAmount / space.members.length);

  const toggleBillStatus = (billId: string) => {
    setBills((prev) =>
      prev.map((b) =>
        b.id === billId
          ? { ...b, status: b.status === 'paid' ? 'pending' : 'paid' }
          : b
      )
    );
  };

  const tabs = [
    { label: 'Tổng quan phòng', href: '', icon: null },
    { label: 'Hóa đơn & EVN', href: '/expenses', icon: Receipt, active: true },
    { label: 'Quyết toán nợ', href: '/debts', icon: Scale },
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
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-500/10 border border-amber-400/20 text-amber-300">
                Đối soát Bậc thang EVN & Hóa đơn
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                Quản lý Hóa đơn & Bậc thang Điện Nước
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Tự động chia đều cho {space.members.length} người theo chỉ số đồng hồ điện nước thực tế.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-background/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shrink-0">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Mỗi bạn cần đóng</div>
                <div className="text-2xl font-black font-mono text-cyan-400">
                  {formatVnd(costPerPerson)}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {kwhUsed} kWh tháng này
                </div>
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
                  ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* 3. EVN Tiered Calculator & Active Bills Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive EVN Meter Reader */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl p-6 backdrop-blur-2xl bg-card/40 border border-white/10 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Máy tính tiền điện theo 6 Bậc EVN
                </h3>
                <p className="text-xs text-muted-foreground">
                  Nhập số công tơ điện đầu kỳ và cuối kỳ để xem chi tiết từng bậc giá:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1">
                  Chỉ số đầu kỳ (kWh)
                </label>
                <input
                  type="number"
                  value={electricStartIndex}
                  onChange={(e) => setElectricStartIndex(parseInt(e.target.value, 10) || 0)}
                  className="w-full h-11 px-4 rounded-xl bg-background/50 border border-white/15 text-foreground font-mono font-bold text-base focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1">
                  Chỉ số cuối kỳ (kWh)
                </label>
                <input
                  type="number"
                  value={electricEndIndex}
                  onChange={(e) => setElectricEndIndex(parseInt(e.target.value, 10) || 0)}
                  className="w-full h-11 px-4 rounded-xl bg-background/50 border border-white/15 text-foreground font-mono font-bold text-base focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>
            </div>

            {/* EVN Tier Breakdown Table */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Chi tiết tính tiền theo bậc thang sinh hoạt
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                {evnCost.breakdown.map((tier) => (
                  <div
                    key={tier.tierIndex}
                    className="p-3 rounded-xl bg-background/40 border border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-cyan-400">Bậc {tier.tierIndex}</span>
                      <span className="text-muted-foreground ml-2">
                        {tier.kwhInTier} kWh × {tier.price.toLocaleString()}đ
                      </span>
                    </div>
                    <span className="font-bold text-foreground">
                      {formatVnd(tier.amount)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/20 space-y-1 mt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tiền điện chưa thuế:</span>
                  <span className="font-mono font-semibold">{formatVnd(evnCost.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Thuế GTGT (8% VAT):</span>
                  <span className="font-mono font-semibold">{formatVnd(evnCost.vat)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-amber-400/20 text-amber-300">
                  <span>Tổng tiền điện thanh toán:</span>
                  <span className="font-mono">{formatVnd(evnCost.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Other Bills (Water, Internet) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl p-6 backdrop-blur-2xl bg-card/40 border border-white/10 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Receipt className="w-4 h-4 text-cyan-400" />
              Tất cả Hóa đơn tháng này
            </h3>

            <div className="space-y-3">
              {bills.map((bill) => {
                const payer = space.members.find((m) => m.id === bill.paidById);
                const share = Math.round(bill.amount / space.members.length);

                return (
                  <div
                    key={bill.id}
                    className="p-4 rounded-2xl bg-background/40 border border-white/10 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-sm text-foreground">{bill.title}</div>
                        <div className="text-xs text-muted-foreground">
                          Người ứng trước:{' '}
                          <strong className="text-cyan-400">{payer?.nickname ?? 'Quỹ chung'}</strong>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-foreground">
                          {formatVnd(bill.amount)}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          Mỗi người: {formatVnd(share)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[11px] text-muted-foreground">
                        Hạn đóng: {bill.dueDate}
                      </span>

                      <button
                        onClick={() => toggleBillStatus(bill.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                          bill.status === 'paid'
                            ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-300'
                            : 'bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30'
                        }`}
                      >
                        {bill.status === 'paid' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã thanh toán
                          </>
                        ) : (
                          'Chờ đóng tiền'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}