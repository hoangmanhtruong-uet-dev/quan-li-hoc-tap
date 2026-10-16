'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Zap,
  BrainCircuit,
  Code2,
  MessageCircle,
  Search,
  ArrowRight,
  TrendingUp,
  Award,
  Flame,
  CheckCircle2,
  Plus,
  Play,
} from 'lucide-react';
import { SEED_SKILLS, SkillNode, awardSkillXp } from '@/lib/growth-engine';

export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillNode[]>(SEED_SKILLS);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('Tất cả');
  const [practiceXpToast, setPracticeXpToast] = useState<{ visible: boolean; skillName: string }>({
    visible: false,
    skillName: '',
  });

  const categories = ['Tất cả', 'Lập trình', 'Khoa học máy tính', 'Dữ liệu & AI', 'Kỹ năng mềm'];

  const visibleSkills = useMemo(() => {
    const q = search.trim().toLowerCase();
    return skills.filter((s) => {
      const matchCat = category === 'Tất cả' || s.category === category;
      const matchQuery = s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [skills, category, search]);

  // Overall statistics
  const totalSkillXp = useMemo(() => skills.reduce((acc, s) => acc + s.totalXp, 0), [skills]);
  const averageLevel = useMemo(() => {
    const sum = skills.reduce((acc, s) => acc + s.level, 0);
    return (sum / skills.length).toFixed(1);
  }, [skills]);

  // Quick practice workout
  const handleQuickPractice = (skillId: string) => {
    setSkills((prev) =>
      prev.map((s) => {
        if (s.id !== skillId) return s;
        const result = awardSkillXp(s.level, s.currentXp, 75, s.maxLevel);
        return {
          ...s,
          level: result.newLevel,
          currentXp: result.newXp,
          nextLevelXp: result.nextLevelXp,
          totalXp: s.totalXp + 75,
          streakDays: s.streakDays + 1,
          lastPracticed: 'Vừa xong',
        };
      })
    );

    const s = skills.find((item) => item.id === skillId);
    if (s) {
      setPracticeXpToast({ visible: true, skillName: s.name });
      setTimeout(() => {
        setPracticeXpToast({ visible: false, skillName: '' });
      }, 3000);
    }
  };

  return (
    <div className="space-y-8 pb-16 relative">
      {/* Practice Toast Notification */}
      {practiceXpToast.visible && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="px-5 py-3.5 rounded-2xl bg-card/90 backdrop-blur-2xl border border-cyan-400/40 shadow-[0_0_25px_rgba(61,232,255,0.3)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center text-slate-950 font-black text-xs">
              ⚡
            </div>
            <div>
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>Rèn luyện hoàn tất!</span>
                <span className="text-cyan-400 font-mono">+75 XP</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Kỹ năng: {practiceXpToast.skillName} (+1 chuỗi 🔥)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-card/40 border border-white/10 shadow-2xl p-6 sm:p-8">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Skill Matrix & Mastery Levels
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
              Ma trận Kỹ năng & Năng lực Cốt lõi
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Theo dõi và rèn giũa kỹ năng từ cấp độ Cơ bản (Novice) đến Chuyên gia (Grandmaster).
              Tích lũy XP qua bài tập thực hành, đồ án và duy trì chuỗi học mỗi ngày.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[100px]">
              <div className="text-xs text-muted-foreground">Kỹ năng</div>
              <div className="text-2xl font-black font-mono text-cyan-400 mt-1">{skills.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[100px]">
              <div className="text-xs text-muted-foreground">Cấp TB</div>
              <div className="text-2xl font-black font-mono text-purple-400 mt-1">Lv.{averageLevel}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[100px]">
              <div className="text-xs text-muted-foreground">Tổng XP</div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{totalSkillXp}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[100px]">
              <div className="text-xs text-muted-foreground">Chuỗi dài nhất</div>
              <div className="text-2xl font-black font-mono text-amber-400 mt-1">14 Ngày 🔥</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search & Category Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm kỹ năng..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-card/60 backdrop-blur-md border border-white/10 text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:border-cyan-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Skills Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleSkills.map((skill) => {
          const progressPercent = Math.round((skill.currentXp / skill.nextLevelXp) * 100);

          return (
            <div
              key={skill.id}
              className="relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-card/40 border border-white/10 hover:border-cyan-400/30 transition-all duration-300 shadow-xl flex flex-col justify-between group"
            >
              {/* Top Accent Glow Bar */}
              <div
                className="h-1.5 w-full"
                style={{
                  background: `linear-gradient(90deg, ${skill.color}, #3DE8FF)`,
                }}
              />

              <div className="p-6 space-y-4 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      {skill.category}
                    </span>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-cyan-300 transition-colors">
                      {skill.name}
                    </h3>
                  </div>

                  <div
                    className="px-3 py-1 rounded-xl font-mono font-black text-xs border shadow-sm"
                    style={{
                      backgroundColor: `${skill.color}20`,
                      borderColor: `${skill.color}40`,
                      color: skill.color,
                    }}
                  >
                    Lv.{skill.level}/{skill.maxLevel}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {skill.description}
                </p>

                {/* Level Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">
                      {skill.currentXp} / {skill.nextLevelXp} XP ({progressPercent}%)
                    </span>
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      {skill.streakDays} ngày
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: skill.color,
                      }}
                    />
                  </div>
                </div>

                {/* Unlocked Perks Preview */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Đặc quyền mở khóa
                  </div>
                  <div className="space-y-1">
                    {skill.perks.slice(0, 2).map((perk, pIdx) => (
                      <div
                        key={pIdx}
                        className={`text-xs flex items-center gap-2 ${
                          perk.unlocked ? 'text-foreground/90' : 'text-muted-foreground/50'
                        }`}
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            perk.unlocked ? 'text-emerald-400' : 'text-muted-foreground/30'
                          }`}
                        />
                        <span className="truncate">{perk.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="px-6 py-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleQuickPractice(skill.id)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 font-semibold text-xs hover:bg-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Luyện tập (+75 XP)
                </button>

                <Link
                  href={`/skills/${skill.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-cyan-300 transition-colors"
                >
                  Chi tiết
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
