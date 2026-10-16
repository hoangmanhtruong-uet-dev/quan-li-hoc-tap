'use client';

import React, { useState } from 'react';
import {
  WorkspaceItem,
  WorkspaceMember,
  WorkspaceRole,
  WORKSPACE_ROLES,
  canManageWorkspaceRole,
  hasWorkspacePermission,
  isLastOwnerChangeBlocked,
} from '@/lib/workspace-engine';
import {
  Users,
  Shield,
  ShieldCheck,
  UserPlus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Mail,
  Calendar,
  X,
  Sparkles,
  Info,
} from 'lucide-react';

interface WorkspaceMembersRbacProps {
  workspace: WorkspaceItem;
  onChangeMemberRole: (
    memberId: string,
    newRole: WorkspaceRole,
    actorRole: WorkspaceRole
  ) => { success: boolean; error?: string };
  onRemoveMember: (
    memberId: string,
    actorRole: WorkspaceRole
  ) => { success: boolean; error?: string };
  onInviteMember: (member: Omit<WorkspaceMember, 'id' | 'joinedAt'>) => void;
}

const roleDescriptions: Record<
  WorkspaceRole,
  { label: string; badge: string; desc: string; iconColor: string }
> = {
  OWNER: {
    label: 'Chủ sở hữu (OWNER)',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    desc: 'Toàn quyền quản trị nhóm, nhiệm vụ, phân quyền và giải tán đồ án',
    iconColor: 'text-amber-400',
  },
  ADMIN: {
    label: 'Quản trị viên (ADMIN)',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
    desc: 'Quản lý thành viên (trừ Owner), phê duyệt tài liệu và phân chia nhiệm vụ',
    iconColor: 'text-purple-400',
  },
  MANAGER: {
    label: 'Điều phối viên (MANAGER)',
    badge: 'bg-blue-500/15 text-blue-300 border-blue-400/30',
    desc: 'Phụ trách tiến độ Kanban, điều phối các công việc con của đồ án',
    iconColor: 'text-blue-400',
  },
  MEMBER: {
    label: 'Thành viên (MEMBER)',
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
    desc: 'Thực hiện nhiệm vụ được giao, cập nhật subtasks và trao đổi tài liệu',
    iconColor: 'text-cyan-400',
  },
  VIEWER: {
    label: 'Người xem / GVHD (VIEWER)',
    badge: 'bg-slate-500/15 text-slate-300 border-slate-400/30',
    desc: 'Chỉ đọc tiến độ, xem tài liệu báo cáo và nhật ký hoạt động đồ án',
    iconColor: 'text-slate-400',
  },
};

export function WorkspaceMembersRbac({
  workspace,
  onChangeMemberRole,
  onRemoveMember,
  onInviteMember,
}: WorkspaceMembersRbacProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Invite Form State
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('MEMBER');

  const actorRole = workspace.currentUserRole;
  const canInvite = hasWorkspacePermission(actorRole, 'member.invite');
  const ownerCount = workspace.members.filter((m) => m.role === 'OWNER').length;

  const handleRoleChange = (memberId: string, newRole: WorkspaceRole) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = onChangeMemberRole(memberId, newRole, actorRole);
    if (!result.success) {
      setErrorMessage(result.error || 'Thao tác phân quyền không hợp lệ.');
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      setSuccessMessage('Cập nhật vai trò thành công!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleRemove = (member: WorkspaceMember) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!confirm(`Xác nhận xóa thành viên "${member.name}" khỏi nhóm đồ án?`)) {
      return;
    }

    const result = onRemoveMember(member.id, actorRole);
    if (!result.success) {
      setErrorMessage(result.error || 'Không thể xóa thành viên.');
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      setSuccessMessage(`Đã xóa "${member.name}" khỏi đồ án.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    onInviteMember({
      name: inviteName.trim(),
      email: inviteEmail.trim().toLowerCase(),
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 500)}?w=120&auto=format&fit=crop&q=80`,
      role: inviteRole,
    });

    setInviteName('');
    setInviteEmail('');
    setInviteRole('MEMBER');
    setIsInviteOpen(false);
    setSuccessMessage('Đã thêm thành viên mới vào đồ án.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Thành viên &amp; Phân quyền RBAC</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mô hình bảo mật 5 bậc phân cấp quyền hạn chặt chẽ (OWNER &gt; ADMIN &gt; MANAGER &gt; MEMBER &gt; VIEWER)
          </p>
        </div>

        {canInvite && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4" />
            <span>Mời thành viên</span>
          </button>
        )}
      </div>

      {/* Status Messages */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 backdrop-blur-md">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 backdrop-blur-md">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* RBAC Guide Card */}
      <div className="rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider mb-3">
          <Shield className="h-4 w-4" />
          <span>Vai trò của bạn: {roleDescriptions[actorRole]?.label}</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {actorRole === 'OWNER' && 'Bạn là Chủ sở hữu của nhóm đồ án này. Bạn có toàn quyền bổ nhiệm, hạ cấp bất kỳ thành viên nào hoặc phân quyền quản trị.'}
          {actorRole === 'ADMIN' && 'Bạn là Quản trị viên. Bạn có thể thay đổi vai trò giữa MANAGER, MEMBER và VIEWER. Bạn không thể thay đổi vai trò của Chủ sở hữu (OWNER) hoặc tự bổ nhiệm bản thân thành OWNER.'}
          {actorRole === 'MANAGER' && 'Bạn là Điều phối viên. Bạn có quyền phân công nhiệm vụ đồ án nhưng không thể chỉnh sửa phân quyền thành viên.'}
          {actorRole === 'MEMBER' && 'Bạn là Thành viên thực thi. Bạn có thể tạo và thực hiện các nhiệm vụ được giao.'}
          {actorRole === 'VIEWER' && 'Bạn đang ở chế độ Chỉ xem (dành cho GVHD hoặc người giám sát phản biện).'}
        </p>
      </div>

      {/* Members Table */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/10 bg-white/[0.02] text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Thành viên</th>
                <th className="px-6 py-4 font-semibold">Vai trò hiện tại</th>
                <th className="px-6 py-4 font-semibold">Ngày gia nhập</th>
                <th className="px-6 py-4 font-semibold text-right">Hành động</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {workspace.members.map((member) => {
                const config = roleDescriptions[member.role] || roleDescriptions.MEMBER;
                const canManageThisMember = canManageWorkspaceRole(actorRole, member.role);
                const isFinalOwner = member.role === 'OWNER' && ownerCount <= 1;

                return (
                  <tr
                    key={member.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    {/* Member Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="h-10 w-10 rounded-2xl object-cover ring-1 ring-white/20"
                        />
                        <div>
                          <p className="font-bold text-white leading-tight">
                            {member.name}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role Dropdown / Badge */}
                    <td className="px-6 py-4">
                      {canManageThisMember ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.id, e.target.value as WorkspaceRole)
                            }
                            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400/40 bg-slate-900 ${config.badge}`}
                          >
                            {WORKSPACE_ROLES.map((r) => {
                              // ADMIN cannot grant OWNER
                              const disabled =
                                actorRole === 'ADMIN' && r === 'OWNER';
                              return (
                                <option
                                  key={r}
                                  value={r}
                                  disabled={disabled}
                                  className="bg-slate-900 text-white"
                                >
                                  {roleDescriptions[r]?.label}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.badge}`}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>{config.label}</span>
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      {member.joinedAt.slice(0, 10)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      {canManageThisMember && !isFinalOwner ? (
                        <button
                          onClick={() => handleRemove(member)}
                          className="rounded-xl p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                          title="Xóa thành viên"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-600 font-mono">
                          {isFinalOwner ? 'OWNER duy nhất' : 'Không có quyền'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setIsInviteOpen(false)}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-2xl p-6 shadow-2xl z-10 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Mời thành viên vào đồ án</h3>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Họ và tên <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Ví dụ: Hoàng Văn Tuấn"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email trường đại học <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="tuan.hv2102@sis.hust.edu.vn"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Vai trò phân bổ</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:outline-none"
                >
                  {WORKSPACE_ROLES.filter((r) => actorRole === 'OWNER' || r !== 'OWNER').map((r) => (
                    <option key={r} value={r}>
                      {roleDescriptions[r]?.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/20"
                >
                  Xác nhận mời
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
