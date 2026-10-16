'use client';

import React, { useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  Calculator,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GpaPrism3D } from '@/components/study/gpa-prism-3d';
import {
  SEED_COURSES,
  convertScale10To4,
  solveRequiredFinalGrade,
  getAcademicWarningStatus,
  type CourseItem,
  type LetterGrade,
} from '@/lib/academic-engine';

const GPA_HISTORY = [
  { label: 'HK1 24–25', gpa: 3.55, credits: 15 },
  { label: 'HK2 24–25', gpa: 3.70, credits: 16 },
  { label: 'HK1 25–26', gpa: 3.65, credits: 15 },
  { label: 'HK2 25–26', gpa: 3.80, credits: 16 },
];

export default function GradesPage() {
  const [courses, setCourses] = useState<CourseItem[]>(SEED_COURSES);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>('cs101');

  // Grade Target Solver State
  const [selectedCourseForSolver, setSelectedCourseForSolver] = useState<string>('cs101');
  const [solverTargetLetter, setSolverTargetLetter] = useState<LetterGrade>('A');

  // Current calculations
  const totalCredits = useMemo(
    () => courses.reduce((sum, c) => sum + c.credits, 0),
    [courses]
  );

  // Compute solver result
  const solverCourse = courses.find((c) => c.id === selectedCourseForSolver) || courses[0];
  const solverResult = useMemo(() => {
    if (!solverCourse) return null;
    return solveRequiredFinalGrade(solverCourse.components, solverTargetLetter);
  }, [solverCourse, solverTargetLetter]);

  // Overall CPA
  const currentCpa = 3.72;
  const warningStatus = getAcademicWarningStatus(currentCpa, 0);

  return (
    <div className="mx-auto w-full max-w-[1550px] overflow-x-hidden space-y-6">
      {/* Ambient Aurora Glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-600/12 blur-[140px]" />
        <div className="absolute top-[30%] right-[-10%] h-[450px] w-[450px] rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      {/* Hero Section with 3D GPA Prism */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 font-mono text-xs font-bold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> Academic Performance Lab
            </span>

            <h1 className="font-heading text-3xl font-black tracking-tight sm:text-4xl">
              Bảng Điểm & Dự Báo GPA
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Theo dõi kết quả học tập thời gian thực, phân tích phổ điểm và chạy thuật toán dự báo điểm thi cuối kỳ cần thiết.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-background/50 px-4 py-2.5">
                <p className="text-[11px] text-muted-foreground">GPA Tích Lũy (Hệ 4)</p>
                <p className="font-mono text-2xl font-black text-emerald-400">3.72</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-background/50 px-4 py-2.5">
                <p className="text-[11px] text-muted-foreground">Điểm TB Hệ 10</p>
                <p className="font-mono text-2xl font-black text-cyan-300">8.45</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-background/50 px-4 py-2.5">
                <p className="text-[11px] text-muted-foreground">Tín Chỉ Tích Lũy</p>
                <p className="font-mono text-2xl font-black text-violet-300">45 / 130</p>
              </div>
            </div>
          </div>

          {/* 3D Prism Centerpiece */}
          <div className="flex w-full flex-col items-center justify-center lg:w-[320px]">
            <GpaPrism3D gpa={currentCpa} className="h-[220px]" />
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-bold text-emerald-300">
              💎 Xếp loại: Xuất sắc (Dean&apos;s List)
            </span>
          </div>
        </div>
      </section>

      {/* Main Grid: Gradebook (Left) + Solver & Predictor (Right) */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        {/* Left Column */}
        <div className="min-w-0 space-y-6">
          {/* GPA Trend Chart */}
          <div className="rounded-3xl border border-white/10 bg-card/40 p-5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-heading flex items-center gap-2 text-base font-bold">
                  <BarChart3 className="h-4 w-4 text-cyan-400" /> Biểu Đồ Xu Hướng GPA
                </h3>
                <p className="text-xs text-muted-foreground">4 học kỳ tích lũy gần nhất</p>
              </div>
              <span className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" /> +0.25 so với năm nhất
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div className="flex h-48 items-end gap-5 border-b border-white/10 px-4 pt-6">
              {GPA_HISTORY.map((item, idx) => (
                <div key={item.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="font-mono text-xs font-bold text-foreground">
                    {item.gpa.toFixed(2)}
                  </span>
                  <div
                    className={`w-full max-w-[64px] rounded-t-xl transition-all duration-300 group-hover:brightness-125 ${
                      idx === GPA_HISTORY.length - 1
                        ? 'bg-gradient-to-t from-violet-600 via-cyan-500 to-emerald-400 shadow-[0_0_20px_rgba(0,245,160,0.3)]'
                        : 'bg-white/10'
                    }`}
                    style={{ height: `${(item.gpa / 4.0) * 85}%` }}
                  />
                  <span className="pb-2 font-mono text-[10px] text-muted-foreground">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Semester Courses Gradebook */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold">Kết Quả Học Kỳ Này</h3>
                <p className="text-xs text-muted-foreground">Học kỳ I · 2026–2027 ({totalCredits} tín chỉ)</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs text-muted-foreground">
                Thang 10 & Thang 4
              </span>
            </div>

            <div className="space-y-3">
              {courses.map((course) => {
                const isExpanded = expandedCourseId === course.id;

                return (
                  <div
                    key={course.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl transition-colors hover:border-white/20"
                  >
                    {/* Header bar */}
                    <button
                      onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                      className="flex w-full items-center gap-3.5 p-4 text-left transition-colors"
                    >
                      <span
                        className="h-10 w-1 rounded-full"
                        style={{ backgroundColor: course.color }}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-muted-foreground">
                            {course.code}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            · {course.credits} tín chỉ
                          </span>
                        </div>
                        <p className="font-heading text-sm font-bold text-foreground truncate">
                          {course.name}
                        </p>
                      </div>

                      {/* Score Preview */}
                      <div className="text-right">
                        <p className="font-mono text-lg font-black text-cyan-300">
                          {course.finalScore !== null ? course.finalScore : 'Đang học'}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground">
                          {course.letterGrade !== '—' ? course.letterGrade : 'Chờ thi'}
                        </p>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {/* Expandable Grade Breakdown */}
                    {isExpanded && (
                      <div className="border-t border-white/5 bg-background/50 p-4 space-y-3">
                        <p className="text-xs font-bold text-muted-foreground">
                          Thành phần điểm chi tiết:
                        </p>

                        <div className="grid grid-cols-3 gap-2.5">
                          {course.components.map((comp) => (
                            <div
                              key={comp.id}
                              className="rounded-xl border border-white/5 bg-card/50 p-3 text-center"
                            >
                              <p className="font-mono text-base font-bold text-foreground">
                                {comp.score !== null ? comp.score : '—'}
                              </p>
                              <p className="mt-0.5 text-[10px] text-muted-foreground">
                                {comp.name} ({comp.weightPercent}%)
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Quick Insight */}
                        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Info className="h-3.5 w-3.5 text-cyan-400" />
                            Giảng viên: {course.instructor} · {course.room}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedCourseForSolver(course.id);
                            }}
                            className="h-7 text-xs font-bold text-violet-300 hover:text-white"
                          >
                            Dự báo điểm thi môn này →
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Grade Target Solver & Simulator */}
        <aside className="min-w-0 space-y-5">
          {/* Grade Target Solver */}
          <div className="rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/[0.08] via-card/40 to-card/40 p-5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                Grade Target Solver
              </span>
              <Calculator className="h-4 w-4 text-cyan-400" />
            </div>

            <h3 className="font-heading text-base font-bold text-foreground">
              Bộ Dự Báo Điểm Thi Cuối Kỳ
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Chọn môn và điểm chữ mục tiêu, hệ thống tự động giải phương trình tính điểm thi tối thiểu bạn cần đạt.
            </p>

            {/* Select Course */}
            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Chọn môn học:</label>
              <select
                value={selectedCourseForSolver}
                onChange={(e) => setSelectedCourseForSolver(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-background/80 p-2 font-mono text-xs font-bold text-foreground outline-none focus:border-cyan-400"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} · {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Target Grade */}
            <div className="mt-3 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Mục tiêu điểm tổng kết:</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['A+', 'A', 'B+', 'B'] as LetterGrade[]).map((ltr) => (
                  <button
                    key={ltr}
                    onClick={() => setSolverTargetLetter(ltr)}
                    className={`rounded-xl border py-1.5 font-mono text-xs font-bold transition-all ${
                      solverTargetLetter === ltr
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(61,232,255,0.3)]'
                        : 'border-white/5 text-muted-foreground hover:bg-white/5'
                    }`}
                  >
                    {ltr}
                  </button>
                ))}
              </div>
            </div>

            {/* Solver Result Display */}
            {solverResult && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-background/70 p-4 text-center">
                <p className="text-[11px] text-muted-foreground">Điểm thi cuối kỳ cần đạt tối thiểu</p>
                <p
                  className={`mt-1 font-mono text-3xl font-black ${
                    solverResult.isAchievable ? 'text-cyan-300' : 'text-rose-400'
                  }`}
                >
                  {solverResult.requiredScore} / 10
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {solverResult.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Academic Standing & Safety */}
          <div className="rounded-3xl border border-white/10 bg-card/40 p-4.5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
            <h4 className="font-heading mb-2 flex items-center gap-2 text-sm font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {warningStatus.title}
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {warningStatus.message}
            </p>
          </div>

          {/* Grade Conversion Scale Reference */}
          <div className="rounded-3xl border border-white/10 bg-card/40 p-4.5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
            <h4 className="font-heading mb-2.5 flex items-center gap-2 text-sm font-bold">
              <BookOpen className="h-4 w-4 text-violet-400" /> Bảng Quy Đổi Điểm Chuẩn
            </h4>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="font-bold text-emerald-400">A+ / A (8.5 – 10.0)</span>
                <span className="font-mono">4.0 / 3.7</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="font-bold text-cyan-400">B+ / B (7.0 – 8.4)</span>
                <span className="font-mono">3.5 / 3.0</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="font-bold text-amber-400">C+ / C (5.5 – 6.9)</span>
                <span className="font-mono">2.5 / 2.0</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-orange-400">D+ / D (4.0 – 5.4)</span>
                <span className="font-mono">1.5 / 1.0</span>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
