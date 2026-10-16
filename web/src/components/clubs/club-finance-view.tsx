'use client';

import React, { useState } from 'react';
import { ClubDetail, ClubTransaction, calculateClubTreasury, FundType, TransactionType } from '@/lib/club-engine';
import { TransactionModal } from './transaction-modal';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Plus,
  TrendingUp,
  ShieldAlert,
  Wallet,
  Sparkles,
  PieChart,
} from 'lucide-react';

interface ClubFinanceViewProps {
  club: ClubDetail;
  onRecordTransaction: (tx: Omit<ClubTransaction, 'id'>) => { success: boolean; error?: string };
}

export function ClubFinanceView({ club, onRecordTransaction }: ClubFinanceViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [fundFilter, setFundFilter] = useState<'all' | FundType>('all');

  const treasury = calculateClubTreasury(club);

  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(val);

  const filteredTransactions = club.transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.createdByName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesFund = fundFilter === 'all' || (tx.fundType || 'general') === fundFilter;
    return matchesSearch && matchesType && matchesFund;
  });

  const getFundLabel = (fund?: FundType) => {
    switch (fund) {
      case 'event':
        return 'Quỹ sự kiện';
      case 'reserve':
        return 'Quỹ dự phòng';
      case 'general':
      default:
        return 'Quỹ chung';
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Hội phí':
        return 'bg-blue-500/15 text-blue-300 border-blue-400/30';
      case 'Tài trợ':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30';
      case 'Sự kiện':
        return 'bg-purple-500/15 text-purple-300 border-purple-400/30';
      case 'Hậu cần & Thiết bị':
        return 'bg-amber-500/15 text-amber-300 border-amber-400/30';
      case 'Khen thưởng':
      default:
        return 'bg-rose-500/15 text-rose-300 border-rose-400/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* 3 Fund Balance Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* General Fund */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 shadow-lg hover:border-cyan-400/30 transition-all">
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-cyan-500/10 blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Quỹ Hoạt Động Chung
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 font-mono text-2xl font-extrabold text-white">
            {formatVND(club.generalFundBalance)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Hội phí & chi tiêu định kỳ</p>
        </div>

        {/* Event Fund */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 shadow-lg hover:border-purple-400/30 transition-all">
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-purple-500/10 blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Quỹ Sự Kiện &amp; Workshop
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-400/30 text-purple-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 font-mono text-2xl font-extrabold text-white">
            {formatVND(club.eventFundBalance)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Tài trợ & kinh phí giải đấu</p>
        </div>

        {/* Reserve Fund */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 shadow-lg hover:border-amber-400/30 transition-all">
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-amber-500/10 blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Quỹ Dự Phòng Rủi Ro
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-4 font-mono text-2xl font-extrabold text-white">
            {formatVND(club.reserveFundBalance)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Dự phòng thiết bị & khẩn cấp</p>
        </div>
      </div>

      {/* Income vs Expense Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-3xl border border-white/10 bg-card/30 backdrop-blur-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Tổng nguồn thu</p>
            <p className="font-mono text-xl font-extrabold text-emerald-300">
              +{formatVND(treasury.totalIncome)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-400/30 text-rose-400">
            <ArrowUpRight className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Tổng chi tiêu</p>
            <p className="font-mono text-xl font-extrabold text-rose-300">
              -{formatVND(treasury.totalExpense)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Tổng tài sản ròng</p>
            <p className="font-mono text-xl font-extrabold text-cyan-300">
              {formatVND(treasury.totalBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Ledger Header & Search/Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Nhật ký Giao dịch Thu Chi</h3>
            <p className="text-xs text-slate-400">
              {club.transactions.length} giao dịch được ghi nhận minh bạch
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-500 transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Ghi nhận thu chi mới</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo nội dung hoặc người ghi sổ..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">Tất cả loại (Thu/Chi)</option>
              <option value="income">Khoản thu (+)</option>
              <option value="expense">Khoản chi (-)</option>
            </select>

            <select
              value={fundFilter}
              onChange={(e) => setFundFilter(e.target.value as any)}
              className="rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">Tất cả các quỹ</option>
              <option value="general">Quỹ chung</option>
              <option value="event">Quỹ sự kiện</option>
              <option value="reserve">Quỹ dự phòng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl shadow-xl">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Không tìm thấy giao dịch nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                      tx.type === 'income'
                        ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400'
                        : 'bg-rose-500/15 border-rose-400/30 text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${getCategoryBadgeClass(
                          tx.category,
                        )}`}
                      >
                        {tx.category}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                        {getFundLabel(tx.fundType)}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {tx.date.split('-').reverse().join('/')}
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-semibold text-white">{tx.description}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Ghi nhận bởi: <span className="text-slate-300">{tx.createdByName}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right sm:shrink-0 pl-13 sm:pl-0">
                  <p
                    className={`font-mono text-base font-extrabold ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatVND(tx.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onRecordTransaction}
      />
    </div>
  );
}
