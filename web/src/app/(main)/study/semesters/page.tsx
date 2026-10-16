'use client';

import React, { useEffect, useState } from 'react';
import {
  Award,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Flag,
  GraduationCap,
  Sparkles,
  Target,
  TrendingUp,
  Plus,
  BookOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SEED_SEMESTERS, type SemesterItem } from '@/lib/academic-engine';

const INITIAL_GOALS = [
  { id: 'g1', label: 'Duy trì GPA học kỳ từ 3.7', detail: 'Mục tiêu danh hiệu Sinh viên Giỏi', done: true },
  { id: 'g2', label: 'Hoàn thành Đồ án CTDL đúng hạn', detail: 'Báo cáo tuần 10', done: false },
  { id: 'g3', label: 'Tối thiểu 15 giờ tự học/tuần', detail: 'Đã hoàn thành 12.5h tuần này', done: false },
];

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<SemesterItem[]>(SEED_SEMESTERS);
  const [selectedSemId, setSelectedSemId] = useState<string>('sem-fall-26');
  const [goals, setGoals] = useState(INITIAL_GOALS);

  // Hydrate goals from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('campusos-semester-goals-v2');
      if (saved) {
        setGoals(JSON.parse(saved));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('campusos-semester-goals-v2', JSON.stringify(goals));
    } catch {}
  }, [goals]);

  const toggleGoal = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, done: !g.done } : g))
    );
  };

  const selectedSemester = semesters.find((s) => s.id === selectedSemId) || semesters[0];

  return (
    <div className="mx-auto w-full max-w-[1550px] overflow-x-hidden space-y-6">
      {/* Ambient Aurora */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/12 blur-[140px]" />
        <div className="absolute top-[25%] right-[-10%] h-[450px] w-[450px] rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 font-mono text-xs font-bold text-violet-300">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> Academic Roadmap Timeline
            </span>

            <h1 className="font-heading text-3xl font-black tracking-tight sm:text-4xl">
              Học Kỳ & Tiến Độ Đào Tạo
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Theo dõi lộ trình các kỳ học, kiểm soát khối lượng tín chỉ và đảm bảo kế hoạch tốt nghiệp đúng hạn.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-background/50 p-4">
              <GraduationCap className="h-4 w-4 text-violet-300" />
              <p className="mt-2 font-mono text-2xl font-bold text-foreground">45</p>
              <p className="text-[10px] text-muted-foreground">Tín chỉ tích lũy</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-background/50 p-4">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <p className="mt-2 font-mono text-2xl font-bold text-foreground">3.72</p>
              <p className="text-[10px] text-muted-foreground">GPA tích lũy</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-background/50 p-4">
              <Flag className="h-4 w-4 text-cyan-400" />
              <p className="mt-2 font-mono text-2xl font-bold text-foreground">35%</p>
              <p className="text-[10px] text-muted-foreground">Tiến độ cử nhân</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Active Semester & Timeline (Left) + Goals (Right) */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23.5rem]">
        {/* Left Column */}
        <div className="min-w-0 space-y-6">
          {/* Active Semester Spotlight Card */}
          <div className="overflow-hidden rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.08] via-card/40 to-card/40 p-6 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              {/* Progress Ring */}
              <div
                className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: 'conic-gradient(#3DE8FF 0% 35%, #1E1E2E 35% 100%)',
                }}
              >
                <div className="flex h-22 w-22 items-center justify-center rounded-full bg-card">
                  <div className="text-center">
                    <p className="font-heading text-lg font-black text-cyan-300">Tuần 5</p>
                    <p className="font-mono text-[10px] text-muted-foreground">/ 16 tuần</p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                  Học kỳ đang diễn ra
                </span>

                <h2 className="font-heading mt-2 text-xl font-bold text-foreground">
                  Học kỳ I · Năm học 2026–2027
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  4 môn học · 14 tín chỉ · Thời gian: 17/08/2026 — 20/12/2026
                </p>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/5 bg-background/50 p-2.5">
                    <p className="font-mono text-base font-bold text-foreground">12.5h</p>
                    <p className="text-[10px] text-muted-foreground">Tự học tuần này</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-background/50 p-2.5">
                    <p className="font-mono text-base font-bold text-emerald-400">95%</p>
                    <p className="text-[10px] text-muted-foreground">Chuyên cần</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-background/50 p-2.5">
                    <p className="font-mono text-base font-bold text-amber-400">3</p>
                    <p className="text-[10px] text-muted-foreground">Deadline tuần tới</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Semesters History Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold">Lịch Sử Học Kỳ</h3>
                <p className="text-xs text-muted-foreground">Nhấp vào từng học kỳ để xem thông tin chi tiết</p>
              </div>
            </div>

            <div className="space-y-3">
              {semesters.map((sem) => {
                const isSelected = selectedSemId === sem.id;

                return (
                  <div
                    key={sem.id}
                    onClick={() => setSelectedSemId(sem.id)}
                    className={`cursor-pointer overflow-hidden rounded-2xl border p-4.5 transition-all backdrop-blur-xl ${
                      isSelected
                        ? 'border-violet-500/50 bg-violet-500/[0.08] shadow-[0_0_20px_rgba(124,92,255,0.15)]'
                        : 'border-white/10 bg-card/40 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                          sem.status === 'ongoing'
                            ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300'
                            : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                        }`}
                      >
                        {sem.status === 'ongoing' ? <Clock3 className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-heading text-sm font-bold text-foreground">
                            {sem.name}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                              sem.status === 'ongoing'
                                ? 'bg-cyan-500/15 text-cyan-300'
                                : 'bg-emerald-500/15 text-emerald-300'
                            }`}
                          >
                            {sem.status === 'ongoing' ? 'Đang học' : 'Đã hoàn thành'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{sem.dates}</p>
                      </div>

                      <div className="hidden gap-6 sm:flex text-right">
                        <div>
                          <p className="font-mono text-base font-bold text-foreground">{sem.credits}</p>
                          <p className="text-[10px] text-muted-foreground">Tín chỉ</p>
                        </div>
                        <div>
                          <p className="font-mono text-base font-bold text-cyan-300">
                            {sem.gpa ? sem.gpa.toFixed(2) : '—'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">GPA kỳ</p>
                        </div>
                      </div>

                      <ChevronRight
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          isSelected ? 'rotate-90' : ''
                        }`}
                      />
                    </div>

                    {isSelected && (
                      <div className="mt-4 border-t border-white/5 pt-3 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{sem.coursesCount} môn học đăng ký</span>
                          <span className="font-mono font-bold text-cyan-300">{sem.progressPercent}% hoàn thành</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                            style={{ width: `${sem.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="min-w-0 space-y-5">
          {/* Goals Card */}
          <div className="rounded-3xl border border-white/10 bg-card/40 p-5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
            <h3 className="font-heading mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <Target className="h-4 w-4 text-violet-400" /> Mục Tiêu Học Kỳ Này
            </h3>

            <div className="space-y-2.5">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                    goal.done
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-white/5 bg-background/50 hover:border-white/20'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
                      goal.done
                        ? 'border-emerald-400 bg-emerald-400 text-black'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {goal.done && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-bold ${
                        goal.done ? 'text-muted-foreground line-through' : 'text-foreground'
                      }`}
                    >
                      {goal.label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{goal.detail}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Academic Milestone */}
          <div className="rounded-3xl border border-white/10 bg-card/40 p-5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
            <div className="mb-2 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" />
              <h4 className="font-heading text-sm font-bold text-foreground">
                Cột Mốc Tiếp Theo
              </h4>
            </div>

            <p className="text-xs font-bold text-foreground">Tích lũy 60 Tín Chỉ</p>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              Còn 15 tín chỉ nữa để mở khóa huy hiệu “Nửa Chặng Đường Cử Nhân”.
            </p>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-amber-400 to-rose-400" />
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-amber-400" />
              <span>Dự kiến đạt vào tháng 01/2027</span>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
