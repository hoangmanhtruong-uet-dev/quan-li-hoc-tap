'use client';

import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Compass,
  Plus,
  Search,
  ArrowRight,
  Code2,
  Database,
  Map,
  CheckCircle2,
  Lock,
  BookOpen,
  Star,
  Target,
  Trophy,
  X,
  Layers,
  Clock,
  Award,
} from 'lucide-react';
import { SEED_ROADMAPS, RoadmapItem, calculateRoadmapProgress } from '@/lib/growth-engine';
import { SkillConstellation3D } from '@/components/roadmaps/skill-constellation-3d';

export default function RoadmapsPage() {
  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'Tất cả' | 'Chuyên ngành' | 'Kỹ năng' | 'Nghề nghiệp'>('Tất cả');
  const [savedIds, setSavedIds] = useState<string[]>(['r1']);
  const [customRoadmaps, setCustomRoadmaps] = useState<RoadmapItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load saved roadmaps from localStorage
  useEffect(() => {
    const raw = localStorage.getItem('campusos-roadmaps-v2');
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.savedIds) setSavedIds(data.savedIds);
        if (data.customRoadmaps) setCustomRoadmaps(data.customRoadmaps);
      } catch {
        localStorage.removeItem('campusos-roadmaps-v2');
      }
    }
    setHydrated(true);
  }, []);

  // Persist saved state
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(
        'campusos-roadmaps-v2',
        JSON.stringify({ savedIds, customRoadmaps })
      );
    }
  }, [savedIds, customRoadmaps, hydrated]);

  const allRoadmaps = useMemo(() => [...SEED_ROADMAPS, ...customRoadmaps], [customRoadmaps]);

  const visibleRoadmaps = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRoadmaps.filter((item) => {
      const matchCat = filterCategory === 'Tất cả' || item.category === filterCategory;
      const matchQuery =
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [allRoadmaps, filterCategory, query]);

  // Featured active roadmap (first saved or first item)
  const activeRoadmap = useMemo(() => {
    return allRoadmaps.find((r) => savedIds.includes(r.id)) || allRoadmaps[0]!;
  }, [allRoadmaps, savedIds]);

  const activeProgress = useMemo(() => {
    return calculateRoadmapProgress(activeRoadmap.nodes);
  }, [activeRoadmap]);

  const toggleBookmark = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateCustom = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get('title') || '').trim();
    if (!title) return;

    const newRoadmap: RoadmapItem = {
      id: `custom-${Date.now()}`,
      slug: `custom-${Date.now()}`,
      title,
      description: String(fd.get('description') || 'Lộ trình phát triển năng lực tự thiết kế.'),
      category: 'Kỹ năng',
      level: 'Trung cấp',
      duration: 'Tùy chỉnh',
      gradient: 'from-fuchsia-500 via-purple-500 to-indigo-600',
      accentColor: '#FF3DA5',
      nodes: [
        {
          id: `c-n1-${Date.now()}`,
          title: 'Khởi đầu & Khảo sát kiến thức',
          description: 'Nghiên cứu tài liệu cơ bản và chuẩn bị môi trường thực hành.',
          estimatedHours: 10,
          xpReward: 100,
          status: 'completed',
          prerequisites: [],
          category: 'Khởi động',
          resources: [],
        },
        {
          id: `c-n2-${Date.now()}`,
          title: 'Thực hành chuyên sâu cấp độ 1',
          description: 'Áp dụng các kỹ thuật cốt lõi vào bài tập thực tế.',
          estimatedHours: 20,
          xpReward: 150,
          status: 'in_progress',
          prerequisites: [`c-n1-${Date.now()}`],
          category: 'Thực hành',
          resources: [],
        },
        {
          id: `c-n3-${Date.now()}`,
          title: 'Dự án Mini Capstone & Báo cáo',
          description: 'Hoàn thiện sản phẩm demo hoàn chỉnh.',
          estimatedHours: 30,
          xpReward: 300,
          status: 'available',
          prerequisites: [`c-n2-${Date.now()}`],
          category: 'Đồ án',
          resources: [],
        },
      ],
    };

    setCustomRoadmaps((prev) => [newRoadmap, ...prev]);
    setSavedIds((prev) => [...prev, newRoadmap.id]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Hero & 3D Skill Constellation */}
      <div className="relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-card/40 border border-white/10 shadow-2xl p-6 sm:p-8">
        {/* Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Growth & Skills Matrix · Bản đồ Năng lực
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
              Lộ trình Phát triển & Chòm sao Kỹ năng
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Biến các mục tiêu kỹ sư, đồ án tốt nghiệp và phỏng vấn việc làm thành chuỗi cột mốc từng bước rõ ràng,
              có phần thưởng XP và theo dõi tiến độ thời gian thực.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(61,232,255,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Tạo lộ trình cá nhân
              </button>
              <Link
                href="/skills"
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-purple-400" />
                Khám phá Ma trận Kỹ năng
              </Link>
            </div>
          </div>

          {/* 3D Interactive Constellation Scene */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-white/10 bg-background/50 backdrop-blur-xl overflow-hidden shadow-inner">
              <SkillConstellation3D />
            </div>
          </div>
        </div>

        {/* Global Growth Metrics Strip */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-xs text-muted-foreground">Lộ trình đang học</div>
            <div className="text-2xl font-black font-mono text-cyan-400 mt-1">{savedIds.length} Lộ trình</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-xs text-muted-foreground">Cột mốc đã hoàn thành</div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">14 Cột mốc</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-xs text-muted-foreground">Tổng XP tích lũy</div>
            <div className="text-2xl font-black font-mono text-purple-400 mt-1">+3,450 XP</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-xs text-muted-foreground">Chuỗi học liên tục</div>
            <div className="text-2xl font-black font-mono text-amber-400 mt-1">12 Ngày 🔥</div>
          </div>
        </div>
      </div>

      {/* 2. Spotlight: Active Roadmap Timeline */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-card/40 border border-cyan-400/20 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                Lộ trình đang kích hoạt
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {activeRoadmap.duration} · {activeRoadmap.level}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">{activeRoadmap.title}</h2>
            <p className="text-xs text-muted-foreground max-w-xl">{activeRoadmap.description}</p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Tiến độ tổng thể</div>
              <div className="text-2xl font-black font-mono text-cyan-400">
                {activeProgress.percent}%
              </div>
              <div className="text-[11px] text-muted-foreground">
                {activeProgress.completedCount}/{activeProgress.totalCount} Cột mốc ({activeProgress.earnedXp}/{activeProgress.totalXp} XP)
              </div>
            </div>
            <Link
              href={`/roadmaps/${activeRoadmap.id}`}
              className="px-5 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 font-semibold text-xs hover:bg-cyan-500/30 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(61,232,255,0.15)]"
            >
              Tiếp tục học ngay
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Milestone Steps Timeline Ribbon */}
        <div className="mt-6 flex items-start overflow-x-auto pb-4 gap-2 scrollbar-none">
          {activeRoadmap.nodes.map((node, index) => {
            const isCompleted = node.status === 'completed';
            const isInProgress = node.status === 'in_progress';
            const isAvailable = node.status === 'available';

            return (
              <div key={node.id} className="flex min-w-[170px] sm:min-w-[190px] flex-1 items-start">
                <div className="flex flex-col items-center text-center w-full">
                  <div
                    className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : isInProgress
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-4 ring-cyan-500/20 animate-pulse shadow-[0_0_15px_rgba(61,232,255,0.4)]'
                        : isAvailable
                        ? 'bg-purple-500/10 border-purple-400/30 text-purple-300 hover:border-purple-400'
                        : 'bg-white/5 border-white/10 text-muted-foreground/50 opacity-60'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isInProgress ? (
                      <BookOpen className="w-5 h-5" />
                    ) : isAvailable ? (
                      <Compass className="w-5 h-5" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-bold mt-2 text-cyan-400/80">
                    Mốc #{index + 1}
                  </span>
                  <p className="text-xs font-semibold text-foreground line-clamp-1 max-w-[150px] mt-0.5">
                    {node.title}
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                    +{node.xpReward} XP
                  </span>
                </div>

                {index < activeRoadmap.nodes.length - 1 && (
                  <div
                    className={`mt-5 h-0.5 min-w-[20px] sm:min-w-[40px] flex-1 ${
                      isCompleted ? 'bg-emerald-400' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Search & Category Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm lộ trình, kỹ năng hoặc công nghệ..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-card/60 backdrop-blur-md border border-white/10 text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:border-cyan-400 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto w-full sm:w-auto">
          {(['Tất cả', 'Chuyên ngành', 'Kỹ năng', 'Nghề nghiệp'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Roadmaps Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleRoadmaps.map((item) => {
          const progress = calculateRoadmapProgress(item.nodes);
          const isSaved = savedIds.includes(item.id);

          return (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-card/40 border border-white/10 hover:border-cyan-400/30 transition-all duration-300 shadow-xl flex flex-col justify-between"
            >
              {/* Top Accent Gradient Bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${item.gradient}`} />

              <div className="p-6 space-y-4 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-white/5 border border-white/10 text-cyan-300">
                      {item.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-muted-foreground">
                      {item.level}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleBookmark(item.id)}
                    aria-label="Lưu lộ trình"
                    className={`p-2 rounded-xl transition-all ${
                      isSaved
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">{progress.percent}% hoàn thành</span>
                    <span className="text-cyan-400 font-bold">{progress.completedCount}/{progress.totalCount} Cột mốc</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${item.gradient} transition-all duration-500`}
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom footer */}
              <div className="px-6 py-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    {item.duration}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    {progress.totalXp} XP
                  </span>
                </div>

                <Link
                  href={`/roadmaps/${item.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Chi tiết
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Custom Roadmap Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-3xl backdrop-blur-2xl bg-card border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground">Tạo Lộ trình Cá nhân hóa</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Xây dựng mục tiêu riêng, chia nhỏ thành các chặng bài tập và chinh phục từng bước.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                  Tên lộ trình
                </label>
                <input
                  required
                  name="title"
                  placeholder="VD: Luyện thi Google Summer of Code / AWS Certified"
                  className="w-full h-11 px-4 rounded-xl bg-background/50 border border-white/15 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                  Mô tả mục tiêu
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Bạn kỳ vọng đạt được kiến thức hoặc sản phẩm gì sau lộ trình này?"
                  className="w-full p-4 rounded-xl bg-background/50 border border-white/15 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-cyan-400 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  Tạo lộ trình ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
