'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  BookOpen,
  Compass,
  Clock,
  Award,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  SEED_ROADMAPS,
  RoadmapItem,
  RoadmapNode,
  resolveRoadmapNodeStatuses,
  calculateRoadmapProgress,
} from '@/lib/growth-engine';

export default function RoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = (params.id as string) || '';

  // Match roadmap
  const initialRoadmap = useMemo(() => {
    // Check seed roadmaps
    const found = SEED_ROADMAPS.find(
      (r) => r.id === rawId || r.slug === rawId || rawId.toLowerCase().includes(r.id)
    );
    if (found) return found;

    // Check localStorage custom roadmaps
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('campusos-roadmaps-v2');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const custom = parsed.customRoadmaps?.find(
            (r: RoadmapItem) => r.id === rawId || r.slug === rawId
          );
          if (custom) return custom;
        } catch {
          // ignore
        }
      }
    }

    return null;
  }, [rawId]);

  // Completed node IDs stored in localStorage
  const [completedNodeIds, setCompletedNodeIds] = useState<Set<string>>(() => {
    if (!initialRoadmap) return new Set();
    // Default initial completed nodes
    const initialCompleted = initialRoadmap.nodes
      .filter((n: RoadmapNode) => n.status === 'completed')
      .map((n: RoadmapNode) => n.id);
    return new Set(initialCompleted);
  });

  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const [xpToast, setXpToast] = useState<{ visible: boolean; amount: number; title: string }>({
    visible: false,
    amount: 0,
    title: '',
  });

  // Load user progress
  useEffect(() => {
    const raw = localStorage.getItem(`campusos-roadmap-${rawId}-progress`);
    if (raw) {
      try {
        const ids = JSON.parse(raw);
        if (Array.isArray(ids)) {
          setCompletedNodeIds(new Set(ids));
        }
      } catch {
        // ignore
      }
    }
  }, [rawId]);

  // Persist user progress
  const saveCompletedNodes = (newSet: Set<string>) => {
    setCompletedNodeIds(newSet);
    localStorage.setItem(
      `campusos-roadmap-${rawId}-progress`,
      JSON.stringify(Array.from(newSet))
    );
  };

  if (!initialRoadmap) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Không tìm thấy lộ trình</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Lộ trình mã &quot;{rawId}&quot; không tồn tại hoặc đã bị xóa.
        </p>
        <button
          onClick={() => router.push('/roadmaps')}
          className="px-5 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 font-medium hover:bg-cyan-500/30 transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh mục Lộ trình
        </button>
      </div>
    );
  }

  // Dynamically resolve node unlock statuses
  const dynamicNodes = resolveRoadmapNodeStatuses(initialRoadmap.nodes, completedNodeIds);
  const progressMetrics = calculateRoadmapProgress(dynamicNodes);

  const toggleNodeCompletion = (node: RoadmapNode) => {
    if (node.status === 'locked') return;

    const nextSet = new Set(completedNodeIds);
    if (nextSet.has(node.id)) {
      nextSet.delete(node.id);
    } else {
      nextSet.add(node.id);
      // Trigger XP popup toast
      setXpToast({ visible: true, amount: node.xpReward, title: node.title });
      setTimeout(() => {
        setXpToast((prev) => ({ ...prev, visible: false }));
      }, 3500);
    }
    saveCompletedNodes(nextSet);
  };

  const resetProgress = () => {
    if (confirm('Bạn có chắc muốn đặt lại toàn bộ tiến độ của lộ trình này?')) {
      saveCompletedNodes(new Set());
    }
  };

  return (
    <div className="space-y-8 pb-16 relative">
      {/* XP Toast Notification */}
      {xpToast.visible && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="px-5 py-3.5 rounded-2xl bg-card/90 backdrop-blur-2xl border border-cyan-400/40 shadow-[0_0_25px_rgba(61,232,255,0.3)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center text-slate-950 font-black text-xs">
              XP
            </div>
            <div>
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>Hoàn thành cột mốc!</span>
                <span className="text-cyan-400 font-mono">+{xpToast.amount} XP</span>
              </div>
              <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                {xpToast.title}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header & Navigation */}
      <div>
        <Link
          href="/roadmaps"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-cyan-400 transition-colors mb-3 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Trở về Danh mục Lộ trình
        </Link>

        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-card/40 border border-white/10 shadow-2xl">
          {/* Ambient Glow */}
          <div
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: initialRoadmap.accentColor }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-cyan-500/10 border border-cyan-400/20 text-cyan-300">
                  {initialRoadmap.category}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-foreground/80">
                  {initialRoadmap.level}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-400/20 text-purple-300">
                  {initialRoadmap.duration}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                {initialRoadmap.title}
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                {initialRoadmap.description}
              </p>
            </div>

            {/* Overall Progress Widget */}
            <div className="flex items-center gap-4 bg-background/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shrink-0">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Tiến độ chinh phục</div>
                <div className="text-3xl font-black font-mono text-cyan-400">
                  {progressMetrics.percent}%
                </div>
                <div className="text-xs text-emerald-400 font-mono font-semibold">
                  {progressMetrics.completedCount} / {progressMetrics.totalCount} Cột mốc ({progressMetrics.earnedXp}/{progressMetrics.totalXp} XP)
                </div>
              </div>

              <button
                onClick={resetProgress}
                title="Đặt lại tiến độ"
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Milestone Timeline / DAG */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Danh sách Cột mốc & Điều kiện mở khóa
            </h3>
            <p className="text-xs text-muted-foreground">
              Hoàn thành các cột mốc tiền đề để tự động mở khóa chặng tiếp theo trong lộ trình.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {dynamicNodes.map((node, index) => {
            const isCompleted = node.status === 'completed';
            const isInProgress = node.status === 'in_progress';
            const isAvailable = node.status === 'available';
            const isLocked = node.status === 'locked';
            const isExpanded = expandedNodeId === node.id;

            return (
              <div
                key={node.id}
                className={`rounded-3xl border transition-all duration-300 overflow-hidden backdrop-blur-2xl ${
                  isCompleted
                    ? 'bg-emerald-500/[0.04] border-emerald-500/20'
                    : isInProgress
                    ? 'bg-cyan-500/[0.06] border-cyan-400/40 shadow-[0_0_20px_rgba(61,232,255,0.1)]'
                    : isAvailable
                    ? 'bg-card/40 border-white/10 hover:border-cyan-400/30'
                    : 'bg-background/20 border-white/5 opacity-60'
                }`}
              >
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Status Icon Indicator */}
                    <div
                      className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-all ${
                        isCompleted
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                          : isInProgress
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-4 ring-cyan-500/20'
                          : isAvailable
                          ? 'bg-purple-500/10 border-purple-400/30 text-purple-300'
                          : 'bg-white/5 border-white/10 text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : isInProgress ? (
                        <BookOpen className="w-6 h-6" />
                      ) : isAvailable ? (
                        <Compass className="w-6 h-6" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          Chặng {index + 1}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-muted-foreground">
                          {node.category}
                        </span>
                        <span className="text-xs font-mono text-purple-400 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          +{node.xpReward} XP
                        </span>
                        <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ~{node.estimatedHours} giờ
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-foreground">{node.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                        {node.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setExpandedNodeId(isExpanded ? null : node.id)}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all flex items-center gap-1"
                    >
                      Tài liệu
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      disabled={isLocked}
                      onClick={() => toggleNodeCompletion(node)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isCompleted
                          ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30'
                          : isInProgress || isAvailable
                          ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 shadow-md hover:brightness-110 active:scale-95'
                          : 'bg-white/5 border border-white/10 text-muted-foreground cursor-not-allowed opacity-50'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Đã hoàn thành
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Xác nhận xong
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Resources & Exercises */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 bg-white/[0.02] border-t border-white/10 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Tài liệu học tập & Bài tập đề xuất
                    </h5>

                    {node.resources.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Chưa có liên kết tài nguyên đính kèm cho cột mốc này. Bạn có thể tự học theo đề cương.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {node.resources.map((res, rIdx) => (
                          <a
                            key={rIdx}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-xl bg-card/60 border border-white/10 hover:border-cyan-400/40 hover:bg-white/5 transition-all flex items-center justify-between gap-3 text-xs"
                          >
                            <span className="font-medium text-foreground truncate">{res.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}