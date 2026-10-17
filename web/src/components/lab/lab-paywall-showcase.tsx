'use client';

import React from 'react';
import { Sparkles, Shield, Rocket, Check, ArrowRight, BookOpen, Cpu, FileText, Users } from 'lucide-react';
import { TIER_CONFIGS, formatVnd } from '@/lib/monetization-matrix';

interface LabPaywallShowcaseProps {
  onOpenCheckout: (tier: 'plus' | 'pro' | 'ultra') => void;
}

export function LabPaywallShowcase({ onOpenCheckout }: LabPaywallShowcaseProps) {
  const plusConfig = TIER_CONFIGS.plus;
  const proConfig = TIER_CONFIGS.pro;
  const ultraConfig = TIER_CONFIGS.ultra;

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden rounded-3xl bg-[#0A0A14] p-6 lg:p-10 border border-white/10">
      {/* Background Aurora Glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-500/15 blur-[120px]" />

      {/* Header Banner */}
      <div className="relative mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-300 mb-6 backdrop-blur-xl">
          <Sparkles className="h-4 w-4" />
          <span>PHÒNG THÍ NGHIỆM HỌC THUẬT CAO CẤP — CAMPUS LAB VIP</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Hội Đồng Nghiên Cứu <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">Đa AI</span> Hạng Nhất
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Tự động hóa hoàn toàn quy trình làm đồ án tốt nghiệp và tiểu luận đại học. Phối hợp nhịp nhàng giữa{' '}
          <strong className="text-cyan-400">Perplexity</strong> (quét web),{' '}
          <strong className="text-purple-400">Gemini</strong> (đọc PDF) và{' '}
          <strong className="text-pink-400">Claude 3.5 Sonnet</strong> (chấp bút học thuật).
        </p>
      </div>

      {/* 3 Pillar Features Cards */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-6 backdrop-blur-xl">
          <div className="h-12 w-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-4">
            <Cpu className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Multi-AI Pipeline</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Phân công công việc tự động: Perplexity quét 10+ bài báo, Gemini bóc tách công thức, Claude viết bài hoàn chỉnh chuẩn APA/IEEE.
          </p>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-purple-950/20 p-6 backdrop-blur-xl">
          <div className="h-12 w-12 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 mb-4">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Slide PPTX 1-Chạm</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Tự động xuất bộ slide PowerPoint 12-15 trang chuẩn chỉnh cho buổi bảo vệ đồ án tốt nghiệp không mất thời gian căn chỉnh.
          </p>
        </div>

        <div className="rounded-2xl border border-pink-500/20 bg-pink-950/20 p-6 backdrop-blur-xl">
          <div className="h-12 w-12 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 mb-4">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Hội Đồng Ảo & Turnitin-Safe</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            3 Giám khảo AI hỏi xoáy đáp xoay chấm điểm bảo vệ thử và công cụ Paraphrase học thuật đưa trùng lặp về dưới 10%.
          </p>
        </div>
      </div>

      {/* Pricing Matrix Showcase */}
      <div className="mt-16 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Bảng Giá Nâng Cấp Bản Quyền</h2>
          <p className="text-slate-400 text-sm mt-2">Mở khóa tức thì qua chuyển khoản VietQR tự động Napas 247</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plus Tier */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col justify-between hover:border-cyan-500/40 transition">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Gói Khởi Động</span>
              <h3 className="text-xl font-bold text-white mt-1">{plusConfig.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">{formatVnd(plusConfig.priceVnd)}</span>
                <span className="text-xs text-slate-400">/ trọn đời</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400 shrink-0" /> Quét TKB bằng AI không giới hạn</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400 shrink-0" /> Trắc nghiệm AI từ slide PDF</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400 shrink-0" /> 3 bình bảo hiểm Streak mỗi tháng</li>
              </ul>
            </div>
            <button
              onClick={() => onOpenCheckout('plus')}
              className="mt-8 w-full rounded-xl border border-cyan-400/30 bg-cyan-500/10 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition flex items-center justify-center gap-2"
            >
              Nâng Cấp Gói Plus <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Pro Tier */}
          <div className="rounded-2xl border border-purple-500/40 bg-purple-950/20 p-6 flex flex-col justify-between hover:border-purple-400 transition relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-3 py-0.5 text-[10px] font-bold uppercase text-white shadow-lg">
              Phổ Biến Nhất
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Nghiên Cứu Lab</span>
              <h3 className="text-xl font-bold text-white mt-1">{proConfig.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">{formatVnd(proConfig.priceVnd)}</span>
                <span className="text-xs text-slate-400">/ trọn đời</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-purple-400 shrink-0" /> Toàn quyền truy cập Campus LAB</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-purple-400 shrink-0" /> 35 Lượt Multi-AI Research Orchestrator</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-purple-400 shrink-0" /> Kho Paper Vault & Trích dẫn BibTeX</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-purple-400 shrink-0" /> Lộ trình 6 mốc khóa luận tốt nghiệp</li>
              </ul>
            </div>
            <button
              onClick={() => onOpenCheckout('pro')}
              className="mt-8 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-indigo-500 transition flex items-center justify-center gap-2"
            >
              Mở Khóa Pro Lab ($7) <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Ultra Tier */}
          <div className="rounded-2xl border-2 border-amber-400/40 bg-amber-950/20 p-6 flex flex-col justify-between hover:border-amber-400 transition relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-0.5 text-[10px] font-bold uppercase text-white shadow-lg flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Tốt Nghiệp Loại Giỏi
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Đặc Quyền Tối Thượng</span>
              <h3 className="text-xl font-bold text-white mt-1">{ultraConfig.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">{formatVnd(ultraConfig.priceVnd)}</span>
                <span className="text-xs text-slate-400">/ nhóm 5 người</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400 shrink-0" /> <strong>Hội đồng phản biện ảo (AI Mock Defense)</strong></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400 shrink-0" /> <strong>Xuất slide thuyết trình .pptx 1-chạm</strong></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400 shrink-0" /> <strong>Quét & Paraphrase Turnitin-Safe &lt; 10%</strong></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400 shrink-0" /> Chia sẻ nhóm đồ án 5 thành viên</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400 shrink-0" /> 150 Lượt AI & Hỗ trợ BYOK Key riêng</li>
              </ul>
            </div>
            <button
              onClick={() => onOpenCheckout('ultra')}
              className="mt-8 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 hover:from-amber-400 hover:to-orange-400 transition flex items-center justify-center gap-2"
            >
              Mở Khóa Ultra Suite ($20) <Rocket className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
