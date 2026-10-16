'use client';

import React from 'react';
import { BookOpen, CheckCircle2, ChevronRight, GraduationCap, TrendingUp } from 'lucide-react';

export interface CreditCategory {
  name: string;
  earned: number;
  required: number;
  color: string;
}

export interface SemesterGpaRecord {
  semester: string;
  gpa: number;
  credits: number;
}

export function calculateGraduationProgress(
  completed: number,
  total: number
): { percentage: number; remaining: number } {
  if (total <= 0) return { percentage: 0, remaining: 0 };
  const safeCompleted = Math.max(0, completed);
  const remaining = Math.max(0, total - safeCompleted);
  const percentage = Number(((safeCompleted / total) * 100).toFixed(1));
  return { percentage, remaining };
}

export function calculateCreditBreakdown(
  categories: CreditCategory[]
): Array<CreditCategory & { percentage: number; remaining: number }> {
  return categories.map((cat) => {
    const { percentage, remaining } = calculateGraduationProgress(cat.earned, cat.required);
    return {
      ...cat,
      percentage,
      remaining,
    };
  });
}

const DEFAULT_CATEGORIES: CreditCategory[] = [
  { name: 'Khối kiến thức bắt buộc', earned: 68, required: 85, color: '#3DE8FF' },
  { name: 'Chuyên ngành tự chọn', earned: 22, required: 38, color: '#7C5CFF' },
  { name: 'Khóa luận & Đồ án TN', earned: 4, required: 12, color: '#C6FF3D' },
];

const DEFAULT_SEMESTER_HISTORY: SemesterGpaRecord[] = [
  { semester: 'HK1 24-25', gpa: 3.50, credits: 16 },
  { semester: 'HK2 24-25', gpa: 3.58, credits: 17 },
  { semester: 'HK1 25-26', gpa: 3.65, credits: 15 },
  { semester: 'HK2 25-26', gpa: 3.80, credits: 16 },
];

interface AcademicCreditStatsProps {
  completedCredits?: number;
  totalCredits?: number;
  cpa?: number;
  categories?: CreditCategory[];
  semesterHistory?: SemesterGpaRecord[];
  className?: string;
}

export function AcademicCreditStats({
  completedCredits = 94,
  totalCredits = 135,
  cpa = 3.62,
  categories = DEFAULT_CATEGORIES,
  semesterHistory = DEFAULT_SEMESTER_HISTORY,
  className = '',
}: AcademicCreditStatsProps) {
  const { percentage, remaining } = calculateGraduationProgress(completedCredits, totalCredits);
  const breakdown = calculateCreditBreakdown(categories);

  return (
    <div
      className={`relative rounded-2xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 shadow-lg overflow-hidden space-y-5 ${className}`}
    >
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -top-14 -left-14 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-14 -right-14 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Header & Main Metric */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-400" />
            <h4 className="text-base font-bold text-white tracking-tight">
              Lộ Trình Tốt Nghiệp & Tín Chỉ
            </h4>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mục tiêu 135 tín chỉ chuẩn đầu ra Khoa học Máy tính
          </p>
        </div>

        {/* CPA Highlight Pill */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-right">
            <span className="block text-[10px] uppercase font-bold text-emerald-300">
              CPA Tích Lũy
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-lg font-black text-white">{cpa.toFixed(2)}</span>
              <span className="text-[10px] text-muted-foreground">/ 4.0</span>
              <span className="ml-1 text-[10px] font-semibold text-emerald-400">(Giỏi)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Graduation Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-end justify-between text-xs">
          <div>
            <span className="font-bold text-white">Tiến độ tích lũy:</span>{' '}
            <span className="font-mono font-black text-emerald-400 text-sm">
              {completedCredits} / {totalCredits}
            </span>{' '}
            <span className="text-muted-foreground text-[11px]">tín chỉ</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Còn lại: {remaining} TC</span>
            <span className="font-mono font-black text-cyan-300 text-sm">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Fluid Multi-Segment Progress Bar */}
        <div className="relative h-3 w-full rounded-full bg-slate-900/80 p-0.5 border border-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-lime-400 shadow-[0_0_12px_rgba(61,232,255,0.4)] transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>
            Bạn đã hoàn thành gần 70% chương trình. Dự kiến tốt nghiệp đúng hạn vào tháng 06/2027.
          </span>
        </p>
      </div>

      {/* Credit Category Breakdown */}
      <div className="space-y-3">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
          Phân bố tín chỉ theo nhóm học phần
        </h5>

        <div className="grid gap-2.5">
          {breakdown.map((item) => (
            <div
              key={item.name}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-200">{item.name}</span>
                <span className="font-mono font-bold text-slate-300">
                  {item.earned}/{item.required} TC ({item.percentage}%)
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Semester GPA Comparison (Visual Bar Chart) */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
            Lịch sử GPA theo từng học kỳ
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center">
            Xu hướng tăng trưởng <ChevronRight className="h-3 w-3" />
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-2">
          {semesterHistory.map((item) => {
            const heightPercent = Math.min(100, Math.max(20, ((item.gpa - 2.5) / 1.5) * 100));
            return (
              <div
                key={item.semester}
                className="flex flex-col items-center justify-end h-24 rounded-xl border border-white/5 bg-slate-900/40 p-2 hover:border-cyan-400/30 transition-colors"
              >
                <span className="font-mono text-xs font-black text-cyan-300">
                  {item.gpa.toFixed(2)}
                </span>
                <div className="w-full my-1.5 flex items-end justify-center h-10">
                  <div
                    className="w-4 rounded-t-sm bg-gradient-to-t from-violet-600 to-cyan-400 shadow-[0_0_8px_rgba(61,232,255,0.2)]"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium truncate w-full text-center">
                  {item.semester}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
