'use client';

import React from 'react';
import { WorkspaceItem, WorkspaceActivityItem } from '@/lib/workspace-engine';
import {
  Activity,
  Clock,
  CheckCircle2,
  FileText,
  UserPlus,
  ShieldAlert,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface WorkspaceActivityLogProps {
  workspace: WorkspaceItem;
}

export function WorkspaceActivityLog({ workspace }: WorkspaceActivityLogProps) {
  const activities = workspace.activities || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white">Nhật ký Hoạt động Thời gian thực</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Dòng thời gian ghi nhận các thay đổi trạng thái nhiệm vụ, tài liệu và phân quyền đồ án
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-card/20 p-12 text-center">
          <Activity className="h-10 w-10 text-slate-600 mb-3" />
          <h4 className="text-sm font-bold text-white">Chưa có nhật ký hoạt động nào</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Mọi thao tác thay đổi nhiệm vụ, tải tài liệu hoặc phân quyền sẽ tự động được ghi lại tại đây.
          </p>
        </div>
      ) : (
        <div className="relative rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-6">
          {/* Vertical Timeline Guide Line */}
          <div className="absolute left-10 top-8 bottom-8 w-px bg-gradient-to-b from-cyan-400/40 via-purple-400/20 to-transparent" />

          <div className="space-y-6">
            {activities.map((act) => {
              const timeFormatted = new Date(act.timestamp).toLocaleString('vi-VN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              });

              return (
                <div key={act.id} className="relative flex items-start gap-4 pl-4 group">
                  {/* Avatar Icon */}
                  <div className="relative z-10 shrink-0">
                    <img
                      src={act.actorAvatar}
                      alt={act.actorName}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-cyan-400/40 bg-slate-800"
                    />
                  </div>

                  {/* Activity Details Card */}
                  <div className="flex-1 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-200 group-hover:border-cyan-400/20 group-hover:bg-white/[0.04]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div>
                        <strong className="text-white font-bold">{act.actorName}</strong>{' '}
                        <span className="text-slate-400">{act.action}:</span>{' '}
                        <span className="font-semibold text-cyan-300">&ldquo;{act.target}&rdquo;</span>
                      </div>

                      <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500 shrink-0">
                        <Clock className="h-3 w-3" />
                        <span>{timeFormatted}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
