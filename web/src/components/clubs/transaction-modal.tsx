'use client';

import React, { useState } from 'react';
import { ClubTransaction, TransactionCategory, FundType, TransactionType } from '@/lib/club-engine';
import { X, DollarSign, Plus, Coins, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ClubTransaction, 'id'>) => { success: boolean; error?: string };
}

export function TransactionModal({ isOpen, onClose, onSubmit }: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('income');
  const [fundType, setFundType] = useState<FundType>('general');
  const [category, setCategory] = useState<TransactionCategory>('Hội phí');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('2026-10-16');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg('Vui lòng nhập số tiền hợp lệ (> 0đ)');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Vui lòng nhập nội dung diễn giải thu chi');
      return;
    }

    const res = onSubmit({
      type,
      fundType,
      category,
      amount: numAmount,
      description: description.trim(),
      date,
      createdByName: 'Nguyễn Văn Minh (Bạn)',
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Giao dịch không thành công');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-cyan-950/40">
        {/* Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-amber-500/15 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-400">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Ghi nhận Giao dịch Ngân sách</h2>
              <p className="text-xs text-slate-400">Sổ cái tài chính minh bạch cho câu lạc bộ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="relative z-10 mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 mt-5 space-y-4">
          {/* Type Toggle: Thu vs Chi */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('Hội phí');
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm'
                  : 'bg-white/5 text-slate-400 border border-white/5 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
              <span>Khoản Thu (+)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('Hậu cần & Thiết bị');
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40 shadow-sm'
                  : 'bg-white/5 text-slate-400 border border-white/5 hover:text-white'
              }`}
            >
              <ArrowUpRight className="h-4 w-4 text-rose-400" />
              <span>Khoản Chi (-)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Quỹ tác động</label>
              <select
                value={fundType}
                onChange={(e) => setFundType(e.target.value as FundType)}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
              >
                <option value="general">Quỹ chung CLB</option>
                <option value="event">Quỹ sự kiện</option>
                <option value="reserve">Quỹ dự phòng</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Danh mục thu chi</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
              >
                <option value="Hội phí">Hội phí</option>
                <option value="Tài trợ">Tài trợ</option>
                <option value="Sự kiện">Sự kiện</option>
                <option value="Hậu cần & Thiết bị">Hậu cần & Thiết bị</option>
                <option value="Khen thưởng">Khen thưởng</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Số tiền giao dịch (VND) <span className="text-cyan-400">*</span>
            </label>
            <input
              type="number"
              required
              min={1000}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="VD: 500000"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 font-mono text-sm text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nội dung diễn giải <span className="text-cyan-400">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Diễn giải chi tiết lý do thu/chi, số hóa đơn chứng từ..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Ngày ghi nhận</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-500 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Ghi sổ giao dịch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
