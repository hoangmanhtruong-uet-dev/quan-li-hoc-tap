'use client';

import React, { useState } from 'react';
import { useWorkspaces, WorkspaceItem } from '@/lib/workspace-engine';
import { WorkspaceHolo3D } from '@/components/workspaces/workspace-holo-3d';
import { WorkspaceCard } from '@/components/workspaces/workspace-card';
import { CreateWorkspaceModal } from '@/components/workspaces/create-workspace-modal';
import {
  Layers,
  CheckCircle2,
  Calendar,
  Users,
  Search,
  Filter,
  Sparkles,
  Plus,
  BarChart3,
} from 'lucide-react';

export default function WorkspacesPage() {
  const { workspaces, metrics, createWorkspace } = useWorkspaces();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredWorkspaces = workspaces.filter((ws) => {
    const matchType = selectedType === 'all' || ws.type === selectedType;
    const q = searchQuery.toLowerCase();
    const matchQuery =
      searchQuery === '' ||
      ws.name.toLowerCase().includes(q) ||
      ws.courseCode.toLowerCase().includes(q) ||
      ws.courseName.toLowerCase().includes(q) ||
      ws.description.toLowerCase().includes(q);
    return matchType && matchQuery;
  });

  return (
    <div className="relative min-h-screen space-y-8 pb-16 overflow-x-hidden min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* 1. 120FPS Three.js Holo 3D Header */}
      <WorkspaceHolo3D
        onCreateClick={() => setIsCreateModalOpen(true)}
        workspaceCount={metrics.totalWorkspaces}
        activeTasksCount={metrics.pendingTasks}
      />

      {/* 2. Asymmetric Bento Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Workspaces */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 transition-all duration-300 hover:border-cyan-400/30 hover:bg-card/60">
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-cyan-500/10 blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Nhóm hoạt động
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {metrics.totalWorkspaces}
            </span>
            <span className="text-xs text-slate-400 font-medium">không gian</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Đang hoạt động trong học kỳ này</p>
        </div>

        {/* Card 2: Pending Tasks */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 transition-all duration-300 hover:border-purple-400/30 hover:bg-card/60">
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-purple-500/10 blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Nhiệm vụ cần làm
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-400/30 text-purple-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {metrics.pendingTasks}
            </span>
            <span className="text-xs text-slate-400 font-medium">task chờ xử lý</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {metrics.completedTasks} nhiệm vụ đã hoàn tất
          </p>
        </div>

        {/* Card 3: Nearest Deadline */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 transition-all duration-300 hover:border-amber-400/30 hover:bg-card/60">
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-amber-500/10 blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hạn chót gần nhất
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-300 tracking-tight">
              {metrics.nearestDeadline ? metrics.nearestDeadline : 'Không có hạn'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Mốc quan trọng đồ án sắp tới</p>
        </div>

        {/* Card 4: Completion Rate */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 transition-all duration-300 hover:border-emerald-400/30 hover:bg-card/60">
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tiến độ chung
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-300 tracking-tight">
              {metrics.completionRate}%
            </span>
            <span className="text-xs text-slate-400 font-medium">hoàn thành</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">{metrics.totalMembers} thành viên đang tham gia</p>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-card/30 backdrop-blur-xl p-4">
        {/* Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'Tất cả nhóm' },
            { id: 'project', label: 'Đồ án môn học' },
            { id: 'research', label: 'Nghiên cứu khoa học' },
            { id: 'competition', label: 'Cuộc thi & Hackathon' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`rounded-2xl px-4 py-2 text-xs font-semibold transition-all ${
                selectedType === tab.id
                  ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 border border-cyan-400/40 text-cyan-300 shadow-sm shadow-cyan-500/20'
                  : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên đồ án, mã môn..."
            className="w-full rounded-2xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
          />
        </div>
      </div>

      {/* 4. Workspaces Grid */}
      {filteredWorkspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-card/20 p-16 text-center">
          <Layers className="h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-base font-bold text-white">Không tìm thấy nhóm đồ án phù hợp</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Thử thay đổi từ khóa tìm kiếm hoặc bấm &ldquo;Tạo nhóm mới&rdquo; để khởi tạo không gian làm việc.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo nhóm ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkspaces.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} />
          ))}
        </div>
      )}

      {/* 5. Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createWorkspace}
      />
    </div>
  );
}
