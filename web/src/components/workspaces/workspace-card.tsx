'use client';

import React from 'react';
import Link from 'next/link';
import {
  WorkspaceItem,
  WorkspaceRole,
} from '@/lib/workspace-engine';
import {
  Users,
  CheckCircle2,
  Calendar,
  FileText,
  Activity,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface WorkspaceCardProps {
  workspace: WorkspaceItem;
  onDelete?: (id: string) => void;
}

const roleColors: Record<WorkspaceRole, { badge: string; text: string }> = {
  OWNER: { badge: 'bg-amber-500/15 border-amber-400/30 text-amber-300', text: 'Chủ sở hữu' },
  ADMIN: { badge: 'bg-purple-500/15 border-purple-400/30 text-purple-300', text: 'Quản trị viên' },
  MANAGER: { badge: 'bg-blue-500/15 border-blue-400/30 text-blue-300', text: 'Điều phối viên' },
  MEMBER: { badge: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300', text: 'Thành viên' },
  VIEWER: { badge: 'bg-slate-500/15 border-slate-400/30 text-slate-300', text: 'Người xem' },
};

const typeLabels: Record<WorkspaceItem['type'], { label: string; color: string }> = {
  project: { label: 'Đồ án môn học', color: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-400/30' },
  research: { label: 'Nghiên cứu khoa học', color: 'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-400/30' },
  competition: { label: 'Cuộc thi & Hackathon', color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-400/30' },
};

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const pendingTasks = workspace.tasks.filter((t) => t.status !== 'done').length;
  const completedTasks = workspace.tasks.filter((t) => t.status === 'done').length;
  const totalTasks = workspace.tasks.length;
  const recentActivity = workspace.activities[0];
  const typeConfig = typeLabels[workspace.type] || typeLabels.project;
  const roleConfig = roleColors[workspace.currentUserRole] || roleColors.MEMBER;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-6 transition-all duration-300 hover:border-cyan-400/30 hover:bg-card/60 hover:shadow-xl hover:shadow-cyan-950/20">
      {/* Background Accent Glow on Hover */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-500/10 blur-2xl transition-all duration-300 group-hover:bg-cyan-500/20" />

      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border bg-gradient-to-r px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${typeConfig.color}`}
            >
              <Sparkles className="h-3 w-3" />
              <span>{typeConfig.label}</span>
            </span>

            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-mono text-slate-300">
              {workspace.courseCode}
            </span>
          </div>

          {/* User's Role in this Workspace */}
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${roleConfig.badge}`}
          >
            <ShieldCheck className="h-3 w-3" />
            <span>{roleConfig.text}</span>
          </span>
        </div>

        {/* Title & Description */}
        <Link href={`/workspaces/${workspace.id}`} className="block group/link">
          <h3 className="text-lg font-bold text-white transition-colors group-hover/link:text-cyan-300 line-clamp-1">
            {workspace.name}
          </h3>
          <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {workspace.description}
          </p>
        </Link>

        {/* Progress Bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-400">Tiến độ tổng thể</span>
            <span className="font-mono font-bold text-cyan-300">{workspace.progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, workspace.progressPercent))}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Nhiệm vụ</span>
            </div>
            <p className="mt-0.5 text-sm font-mono font-bold text-white">
              {completedTasks}/{totalTasks}
            </p>
          </div>

          <div className="border-x border-white/10">
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
              <FileText className="h-3 w-3 text-purple-400" />
              <span>Tài liệu</span>
            </div>
            <p className="mt-0.5 text-sm font-mono font-bold text-white">
              {workspace.documents.length}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
              <Users className="h-3 w-3 text-cyan-400" />
              <span>Thành viên</span>
            </div>
            <p className="mt-0.5 text-sm font-mono font-bold text-white">
              {workspace.members.length}
            </p>
          </div>
        </div>

        {/* Recent Activity Snippet */}
        {recentActivity && (
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 line-clamp-1">
            <Activity className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
            <span className="truncate">
              <strong className="text-slate-300 font-medium">{recentActivity.actorName}</strong>{' '}
              {recentActivity.action}: &ldquo;{recentActivity.target}&rdquo;
            </span>
          </div>
        )}
      </div>

      {/* Footer: Member Stack & View Button */}
      <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
        {/* Stacked Member Avatars */}
        <div className="flex items-center -space-x-2 overflow-hidden">
          {workspace.members.slice(0, 4).map((member) => (
            <img
              key={member.id}
              src={member.avatar}
              alt={member.name}
              title={`${member.name} (${member.role})`}
              className="inline-block h-7 w-7 rounded-full border-2 border-slate-900 object-cover ring-1 ring-white/20"
            />
          ))}
          {workspace.members.length > 4 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-900 bg-slate-800 text-[10px] font-bold text-slate-300">
              +{workspace.members.length - 4}
            </div>
          )}
        </div>

        {/* Detail Link */}
        <Link
          href={`/workspaces/${workspace.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 transition-colors hover:text-cyan-300"
        >
          <span>Vào không gian</span>
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
