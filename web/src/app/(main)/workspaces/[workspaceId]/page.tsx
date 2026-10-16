'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  useWorkspace,
  WorkspaceRole,
  hasWorkspacePermission,
} from '@/lib/workspace-engine';
import { WorkspaceKanban } from '@/components/workspaces/workspace-kanban';
import { WorkspaceDocuments } from '@/components/workspaces/workspace-documents';
import { WorkspaceMembersRbac } from '@/components/workspaces/workspace-members-rbac';
import { WorkspaceActivityLog } from '@/components/workspaces/workspace-activity-log';
import {
  ArrowLeft,
  Layers,
  Kanban,
  FileText,
  Users,
  Activity,
  ShieldCheck,
  Calendar,
  Sparkles,
  BookOpen,
  Trash2,
} from 'lucide-react';

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = typeof params.workspaceId === 'string' ? params.workspaceId : '';

  const {
    workspace,
    updateThisWorkspace,
    deleteThisWorkspace,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    toggleSubtask,
    addDocument,
    deleteDocument,
    inviteMember,
    changeMemberRole,
    removeMember,
  } = useWorkspace(workspaceId);

  const [activeTab, setActiveTab] = useState<'kanban' | 'documents' | 'members' | 'activity'>('kanban');

  if (!workspace) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 mb-4">
          <Layers className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Không tìm thấy Không gian làm việc</h2>
        <p className="mt-1 text-sm text-slate-400 max-w-sm">
          Nhóm đồ án này có thể đã bị xóa hoặc bạn không có quyền truy cập.
        </p>
        <Link
          href="/workspaces"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 px-5 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách nhóm</span>
        </Link>
      </div>
    );
  }

  const roleConfig: Record<WorkspaceRole, { badge: string; label: string }> = {
    OWNER: { badge: 'bg-amber-500/15 border-amber-400/30 text-amber-300', label: 'Chủ sở hữu' },
    ADMIN: { badge: 'bg-purple-500/15 border-purple-400/30 text-purple-300', label: 'Quản trị viên' },
    MANAGER: { badge: 'bg-blue-500/15 border-blue-400/30 text-blue-300', label: 'Điều phối viên' },
    MEMBER: { badge: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300', label: 'Thành viên' },
    VIEWER: { badge: 'bg-slate-500/15 border-slate-400/30 text-slate-300', label: 'Người xem' },
  };

  const isOwner = workspace.currentUserRole === 'OWNER';

  const handleDeleteWorkspace = () => {
    if (confirm(`Xác nhận xóa vĩnh viễn không gian làm việc "${workspace.name}"? Hành động này không thể hoàn tác.`)) {
      deleteThisWorkspace();
      router.push('/workspaces');
    }
  };

  return (
    <div className="relative min-h-screen space-y-8 pb-16 overflow-x-hidden min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* 1. Header Navigation & Back Button */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/workspaces"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur-md hover:bg-white/10 hover:text-white transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Danh sách đồ án</span>
        </Link>

        {isOwner && (
          <button
            onClick={handleDeleteWorkspace}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all"
            title="Xóa đồ án này"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Giải tán nhóm</span>
          </button>
        )}
      </div>

      {/* 2. Workspace Hero Banner (Cyber-Glass) */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/20">
        {/* Ambient Aurora Glow */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                <BookOpen className="h-3.5 w-3.5" />
                <span>{workspace.courseCode} · {workspace.courseName}</span>
              </span>

              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{workspace.semester}</span>
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                  roleConfig[workspace.currentUserRole]?.badge
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{roleConfig[workspace.currentUserRole]?.label}</span>
              </span>
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {workspace.name}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              {workspace.description}
            </p>
          </div>

          {/* Progress Circle & Quick Stats */}
          <div className="flex items-center gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 shrink-0">
            {/* SVG Circular Progress */}
            <div className="relative flex items-center justify-center">
              <svg className="h-20 w-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  className="stroke-white/10"
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  className="stroke-cyan-400 transition-all duration-700 ease-out"
                  strokeWidth="7"
                  strokeDasharray={2 * Math.PI * 32}
                  strokeDashoffset={
                    2 * Math.PI * 32 * (1 - Math.min(100, Math.max(0, workspace.progressPercent)) / 100)
                  }
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <span className="font-mono text-base font-bold text-white">
                  {workspace.progressPercent}%
                </span>
              </div>
            </div>

            {/* Stat Counters */}
            <div className="space-y-1.5 text-xs text-slate-400 font-mono">
              <div>
                <span className="text-slate-500">Nhiệm vụ: </span>
                <strong className="text-white">
                  {workspace.tasks.filter((t) => t.status === 'done').length}/{workspace.tasks.length}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Tài liệu: </span>
                <strong className="text-white">{workspace.documents.length}</strong>
              </div>
              <div>
                <span className="text-slate-500">Thành viên: </span>
                <strong className="text-white">{workspace.members.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 4 Cyber-Glass Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'kanban', label: 'Bảng Kanban', icon: Kanban, count: workspace.tasks.length },
          { id: 'documents', label: 'Tài liệu & Tài nguyên', icon: FileText, count: workspace.documents.length },
          { id: 'members', label: 'Thành viên & RBAC', icon: Users, count: workspace.members.length },
          { id: 'activity', label: 'Nhật ký hoạt động', icon: Activity, count: workspace.activities.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-300 shadow-md shadow-cyan-500/15'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                  isActive ? 'bg-cyan-400/20 text-cyan-200' : 'bg-white/10 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Active Tab Content View */}
      <div className="transition-opacity duration-200">
        {activeTab === 'kanban' && (
          <WorkspaceKanban
            workspace={workspace}
            onMoveTask={moveTask}
            onCreateTask={createTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onToggleSubtask={toggleSubtask}
          />
        )}

        {activeTab === 'documents' && (
          <WorkspaceDocuments
            workspace={workspace}
            onAddDocument={addDocument}
            onDeleteDocument={deleteDocument}
          />
        )}

        {activeTab === 'members' && (
          <WorkspaceMembersRbac
            workspace={workspace}
            onChangeMemberRole={changeMemberRole}
            onRemoveMember={removeMember}
            onInviteMember={inviteMember}
          />
        )}

        {activeTab === 'activity' && (
          <WorkspaceActivityLog workspace={workspace} />
        )}
      </div>
    </div>
  );
}
