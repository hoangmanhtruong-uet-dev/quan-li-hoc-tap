'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Home,
  Users,
  Zap,
  Droplets,
  Wifi,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  CircleDollarSign,
  Plus,
  AlertTriangle,
  Receipt,
  Scale,
  CalendarCheck,
  RotateCcw,
} from 'lucide-react';
import {
  SEED_LIVING_SPACE,
  LivingSpaceItem,
  settleDebtsMinimally,
  calculateEvnElectricityCost,
} from '@/lib/living-engine';
import { CyberDorm3D } from '@/components/living/cyber-dorm-3d';

export default function LivingPage() {
  const [space, setSpace] = useState<LivingSpaceItem>(SEED_LIVING_SPACE);
  const [fundModal, setFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('50000');

  const formatVnd = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + 'đ';

  const minimalTransfers = settleDebtsMinimally(space.members);

  const totalMonthlyBills = space.bills.reduce((sum, b) => sum + b.amount, 0);
  const pendingBillsCount = space.bills.filter((b) => b.status === 'pending').length;

  const toggleChore = (choreId: string) => {
    setSpace((prev) => ({
      ...prev,
      chores: prev.chores.map((c) =>
        c.id === choreId
          ? {
              ...c,
              status: c.status === 'completed' ? 'pending' : 'completed',
            }
          : c
      ),
    }));
  };

  const handleDepositFund = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(fundAmount, 10);
    if (!isNaN(num) && num > 0) {
      setSpace((prev) => ({
        ...prev,
        commonFundBalance: prev.commonFundBalance + num,
      }));
      setFundModal(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 relative">
      {/* 1. Cyber-Glass Hero & 3D Isometric Dorm Room */}
      <div className="relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-card/40 border border-white/10 shadow-2xl p-6 sm:p-8">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Không gian sống KTX & Trọ sinh viên
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
              {space.name}
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Tự động hóa đối soát hóa đơn điện nước bậc thang EVN, thuật toán tối ưu số lần chuyển khoản nợ,
              và phân chia lịch trực nhật minh bạch giữa các bạn cùng phòng.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={`/living/${space.id}/debts`}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
              >
                <Scale className="w-4 h-4" />
                Quyết toán nợ phòng ({minimalTransfers.length} giao dịch)
              </Link>
              <button
                onClick={() => setFundModal(true)}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                Nạp quỹ phòng
              </button>
            </div>
          </div>

          {/* 3D Isometric Dorm Room */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-white/10 bg-background/50 backdrop-blur-xl overflow-hidden shadow-inner">
              <CyberDorm3D />
            </div>
          </div>
        </div>

        {/* Quick Roommate & Space Metric Strip */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-xs text-muted-foreground">Thành viên phòng</div>
            <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
              {space.members.length} Sinh viên
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-xs text-muted-foreground">Quỹ phòng hiện có</div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {formatVnd(space.commonFundBalance)}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-xs text-muted-foreground">Tổng hóa đơn tháng</div>
            <div className="text-2xl font-black font-mono text-purple-400 mt-1">
              {formatVnd(totalMonthlyBills)}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-xs text-muted-foreground">Hóa đơn chờ đóng</div>
            <div className="text-2xl font-black font-mono text-amber-400 mt-1">
              {pendingBillsCount} Hóa đơn
            </div>
          </div>
        </div>
      </div>

      {/* 2. Roommates & Balance Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Thành viên & Cán cân tài chính
            </h3>
            <p className="text-xs text-muted-foreground">
              Số dư công nợ được tính theo các khoản chi dùng chung đã ứng trước.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {space.members.map((member) => {
            const isCreditor = member.netBalance > 0;
            const isDebtor = member.netBalance < 0;

            return (
              <div
                key={member.id}
                className="p-5 rounded-3xl backdrop-blur-2xl bg-card/40 border border-white/10 hover:border-cyan-400/30 transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-sm">
                      {member.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">{member.nickname}</div>
                      <div className="text-[11px] text-muted-foreground">{member.name}</div>
                    </div>
                  </div>

                  {member.role === 'lead' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      Trưởng phòng
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Trạng thái công nợ</span>
                    <span
                      className={`font-mono font-bold ${
                        isCreditor
                          ? 'text-emerald-400'
                          : isDebtor
                          ? 'text-rose-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {isCreditor
                        ? `+${formatVnd(member.netBalance)}`
                        : isDebtor
                        ? formatVnd(member.netBalance)
                        : 'Đã cân bằng'}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Điểm phạt trực nhật</span>
                    <span
                      className={`font-mono font-bold ${
                        member.penaltyPoints > 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {member.penaltyPoints} Lần
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bills & Chores Dual Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Utility Bills */}
        <div className="rounded-3xl p-6 backdrop-blur-2xl bg-card/40 border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-400" />
                Hóa đơn dịch vụ tháng này
              </h3>
              <p className="text-xs text-muted-foreground">
                Điện EVN bậc thang, nước và internet cáp quang.
              </p>
            </div>
            <Link
              href={`/living/${space.id}/expenses`}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              Chi tiết
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {space.bills.map((bill) => {
              const Icon =
                bill.type === 'electric'
                  ? Zap
                  : bill.type === 'water'
                  ? Droplets
                  : Wifi;

              return (
                <div
                  key={bill.id}
                  className="p-4 rounded-2xl bg-background/40 border border-white/10 hover:border-cyan-400/30 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        bill.type === 'electric'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : bill.type === 'water'
                          ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-400/20'
                          : 'bg-purple-500/10 text-purple-300 border border-purple-400/20'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="font-semibold text-sm text-foreground">{bill.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>Hạn đóng: {bill.dueDate}</span>
                        {bill.usageIndex && (
                          <span className="font-mono text-cyan-400">
                            ({bill.usageIndex.end - bill.usageIndex.start} {bill.usageIndex.unit})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-foreground">
                      {formatVnd(bill.amount)}
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        bill.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {bill.status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Chores Schedule */}
        <div className="rounded-3xl p-6 backdrop-blur-2xl bg-card/40 border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-400" />
                Lịch trực nhật tuần
              </h3>
              <p className="text-xs text-muted-foreground">
                Tích chọn khi hoàn thành. Quá hạn sẽ phạt vào quỹ phòng.
              </p>
            </div>
            <Link
              href={`/living/${space.id}/chores`}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              Lịch cả tháng
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {space.chores.map((chore) => {
              const assignee = space.members.find((m) => m.id === chore.assigneeId);
              const isCompleted = chore.status === 'completed';

              return (
                <div
                  key={chore.id}
                  onClick={() => toggleChore(chore.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCompleted
                      ? 'bg-emerald-500/[0.04] border-emerald-500/20'
                      : 'bg-background/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold'
                          : 'border-white/20 bg-white/5'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                    </div>

                    <div>
                      <div
                        className={`text-sm font-semibold ${
                          isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {chore.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {chore.dayOfWeek} · Phụ trách:{' '}
                        <strong className="text-cyan-400">{assignee?.nickname ?? 'Chưa gán'}</strong>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                    Phạt: {formatVnd(chore.penaltyAmount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Min-Cash-Flow Debt Settlement Card */}
      <div className="rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-card/40 border border-emerald-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              Tối ưu Quyết toán Nợ (Greedy Min-Cash-Flow Solver)
            </h3>
            <p className="text-xs text-muted-foreground">
              Thay vì chuyển tiền chéo phức tạp, hệ thống tự giải phương trình tối thiểu số giao dịch cần thực hiện:
            </p>
          </div>
          <Link
            href={`/living/${space.id}/debts`}
            className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold text-xs hover:bg-emerald-500/30 transition-all flex items-center gap-1.5 shrink-0"
          >
            Mở mã QR Chuyển khoản
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {minimalTransfers.map((tx, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-background/50 border border-white/10 flex items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="text-xs font-semibold text-foreground">
                  <span className="text-rose-400">{tx.fromName}</span>
                  <span className="mx-2 text-muted-foreground font-normal">chuyển cho</span>
                  <span className="text-emerald-400">{tx.toName}</span>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  Giao dịch #{idx + 1}
                </div>
              </div>
              <div className="font-mono font-bold text-sm text-cyan-400">
                {formatVnd(tx.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Deposit Common Fund Modal */}
      {fundModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setFundModal(false);
          }}
        >
          <div className="w-full max-w-md rounded-3xl backdrop-blur-2xl bg-card border border-white/10 shadow-2xl p-6 sm:p-8 space-y-5">
            <h3 className="text-xl font-bold text-foreground">Nạp Quỹ Chung Phòng KTX</h3>
            <p className="text-xs text-muted-foreground">
              Số tiền nạp sẽ được cộng trực tiếp vào số dư quỹ chung dùng cho tiền rác, nước uống và sửa chữa đồ đạc.
            </p>

            <form onSubmit={handleDepositFund} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                  Số tiền nạp (VND)
                </label>
                <input
                  type="number"
                  min="10000"
                  step="10000"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-background/50 border border-white/15 text-foreground font-mono font-bold text-base focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setFundModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg hover:bg-emerald-400 active:scale-95 transition-all"
                >
                  Xác nhận nạp quỹ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
