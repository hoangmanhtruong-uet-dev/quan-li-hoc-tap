'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Sparkles,
  Award,
  Flame,
  CheckCircle2,
  Lock,
  Play,
  Clock,
  Zap,
  BookOpen,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { SEED_SKILLS, SkillNode, awardSkillXp } from '@/lib/growth-engine';

export default function SkillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = (params.id as string) || '';

  const initialSkill = useMemo(() => {
    return (
      SEED_SKILLS.find((s) => s.id === rawId || s.name.toLowerCase().includes(rawId.toLowerCase())) ||
      SEED_SKILLS[0]!
    );
  }, [rawId]);

  const [skill, setSkill] = useState<SkillNode>(initialSkill);
  const [selectedWorkout, setSelectedWorkout] = useState<number>(100);
  const [levelUpPopup, setLevelUpPopup] = useState<boolean>(false);

  const progressPercent = Math.round((skill.currentXp / skill.nextLevelXp) * 100);

  const handleWorkoutSubmit = () => {
    const res = awardSkillXp(skill.level, skill.currentXp, selectedWorkout, skill.maxLevel);
    setSkill((prev) => ({
      ...prev,
      level: res.newLevel,
      currentXp: res.newXp,
      nextLevelXp: res.nextLevelXp,
      totalXp: prev.totalXp + selectedWorkout,
      streakDays: prev.streakDays + 1,
      lastPracticed: 'Vừa xong',
    }));

    if (res.didLevelUp) {
      setLevelUpPopup(true);
      setTimeout(() => setLevelUpPopup(false), 4000);
    }
  };

  return (
    <div className="space-y-8 pb-16 relative">
      {/* Level Up Celebration Toast */}
      {levelUpPopup && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 backdrop-blur-2xl border border-amber-400/50 shadow-[0_0_30px_rgba(245,158,11,0.3)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-lg">
              🎉
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">
                Chúc mừng! Thăng cấp kỹ năng!
              </div>
              <div className="text-xs text-amber-300 font-mono">
                Đã đạt Cấp độ {skill.level} / {skill.maxLevel}!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header & Navigation */}
      <div>
        <Link
          href="/skills"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-cyan-400 transition-colors mb-3 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Trở về Ma trận Kỹ năng
        </Link>

        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-card/40 border border-white/10 shadow-2xl">
          <div
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: skill.color }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-white/5 border border-white/10 text-cyan-300">
                  {skill.category}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-400/20 text-amber-300 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  Chuỗi {skill.streakDays} ngày
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                {skill.name}
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {skill.description}
              </p>
            </div>

            {/* Current Level Ring Card */}
            <div className="flex items-center gap-4 bg-background/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shrink-0">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Cấp độ hiện tại</div>
                <div className="text-3xl font-black font-mono" style={{ color: skill.color }}>
                  Lv.{skill.level}
                  <span className="text-xs text-muted-foreground font-normal"> / {skill.maxLevel}</span>
                </div>
                <div className="text-xs text-cyan-400 font-mono font-semibold">
                  {skill.currentXp} / {skill.nextLevelXp} XP ({progressPercent}%)
                </div>
              </div>

              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl border shadow-lg"
                style={{
                  backgroundColor: `${skill.color}25`,
                  borderColor: `${skill.color}60`,
                  color: skill.color,
                }}
              >
                {skill.level}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Practice Workout Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl p-6 backdrop-blur-2xl bg-card/40 border border-white/10 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Phòng Rèn luyện Năng lực (Daily Workout)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Chọn cường độ luyện tập hôm nay để tích lũy XP và duy trì chuỗi học tập:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { amount: 50, duration: '15 phút', title: 'Flashcards & Lý thuyết', icon: BookOpen },
                { amount: 100, duration: '30 phút', title: 'Luyện 2 bài LeetCode / Lab', icon: Zap },
                { amount: 250, duration: '60 phút', title: 'Code tính năng Mini Project', icon: Award },
              ].map((w) => {
                const isSelected = selectedWorkout === w.amount;
                const Icon = w.icon;
                return (
                  <div
                    key={w.amount}
                    onClick={() => setSelectedWorkout(w.amount)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-400/50 shadow-[0_0_15px_rgba(61,232,255,0.2)]'
                        : 'bg-background/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {w.duration}
                      </span>
                      <span className="text-xs font-bold font-mono text-cyan-400">
                        +{w.amount} XP
                      </span>
                    </div>

                    <div className="font-semibold text-sm text-foreground">{w.title}</div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleWorkoutSubmit}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(61,232,255,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Xác nhận đã rèn luyện (+{selectedWorkout} XP)
            </button>
          </div>
        </div>

        {/* Right Column: Perks Tree */}
        <div className="space-y-4">
          <div className="rounded-3xl p-6 backdrop-blur-2xl bg-card/40 border border-white/10 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              Cây Đặc quyền Cấp độ
            </h3>

            <div className="space-y-3">
              {skill.perks.map((perk, pIdx) => {
                const isUnlocked = perk.unlocked || skill.level >= perk.level;
                return (
                  <div
                    key={pIdx}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      isUnlocked
                        ? 'bg-emerald-500/5 border-emerald-400/20 text-foreground'
                        : 'bg-background/40 border-white/5 text-muted-foreground/60'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                        isUnlocked
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-muted-foreground'
                      }`}
                    >
                      {isUnlocked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">
                          Cấp {perk.level}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {isUnlocked ? 'Đã kích hoạt' : 'Chưa mở khóa'}
                        </span>
                      </div>
                      <div className="text-xs font-semibold mt-0.5">{perk.title}</div>
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