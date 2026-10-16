'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ClubDetail, ClubMember, ClubDepartment, ClubRole } from '@/lib/club-engine';
import { MemberInviteModal } from './member-invite-modal';
import {
  Users,
  Search,
  UserPlus,
  Shield,
  Award,
  Sparkles,
  Trash2,
  CheckCircle,
} from 'lucide-react';

interface ClubMembersViewProps {
  club: ClubDetail;
  onAddMember: (member: Omit<ClubMember, 'id' | 'joinedDate' | 'activeScore'>) => void;
  onUpdateMemberRole: (memberId: string, role: ClubRole, dept?: ClubDepartment) => void;
  onRemoveMember: (memberId: string) => void;
}

export function ClubMembersView({
  club,
  onAddMember,
  onUpdateMemberRole,
  onRemoveMember,
}: ClubMembersViewProps) {
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const departments: { label: string; value: string }[] = [
    { label: 'Tất cả ban', value: 'all' },
    { label: 'Ban Chủ nhiệm', value: 'Ban Chủ nhiệm' },
    { label: 'Ban Kỹ thuật', value: 'Ban Chuyên môn & Kỹ thuật' },
    { label: 'Ban Sự kiện & Media', value: 'Ban Truyền thông & Sự kiện' },
    { label: 'Ban Đối ngoại & Quỹ', value: 'Ban Đối ngoại & Tài chính' },
  ];

  const filteredMembers = club.members.filter((m) => {
    const matchesDept = selectedDept === 'all' || m.department === selectedDept;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      m.name.toLowerCase().includes(q) ||
      m.studentId.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q);
    return matchesDept && matchesSearch;
  });

  const getRoleBadge = (role: ClubRole) => {
    switch (role) {
      case 'OWNER':
        return { label: 'Ban Chủ nhiệm', className: 'bg-amber-500/15 text-amber-300 border-amber-400/30' };
      case 'ADMIN':
        return { label: 'Ban Quản trị', className: 'bg-purple-500/15 text-purple-300 border-purple-400/30' };
      case 'MANAGER':
        return { label: 'Điều phối viên', className: 'bg-blue-500/15 text-blue-300 border-blue-400/30' };
      case 'MEMBER':
        return { label: 'Thành viên', className: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30' };
      case 'VIEWER':
      default:
        return { label: 'Quan sát viên', className: 'bg-slate-500/15 text-slate-300 border-slate-400/30' };
    }
  };

  const handleRoleChange = (memberId: string, newRole: ClubRole) => {
    onUpdateMemberRole(memberId, newRole);
  };

  const handleRemove = (member: ClubMember) => {
    if (confirm(`Xác nhận xóa thành viên "${member.name}" khỏi câu lạc bộ?`)) {
      onRemoveMember(member.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Invite CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Danh sách Thành viên &amp; Ban Chuyên Môn</h3>
          <p className="text-xs text-slate-400">
            Tổng số {club.members.length} nhân sự thuộc 4 ban điều hành
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Kết nạp thành viên</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên thành viên, MSSV hoặc ban..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {departments.map((dept) => (
            <button
              key={dept.value}
              onClick={() => setSelectedDept(dept.value)}
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedDept === dept.value
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-card/30 p-12 text-center text-xs text-slate-400">
          Không tìm thấy thành viên nào phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const roleInfo = getRoleBadge(member.role);
            return (
              <div
                key={member.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 shadow-lg transition-all duration-300 hover:border-cyan-400/30 hover:bg-card/60"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <Image
                        src={member.avatar}
                        alt={member.name}
                        width={48}
                        height={48}
                        unoptimized
                        className="h-12 w-12 rounded-2xl object-cover border border-white/10 shadow-md"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {member.name}
                        </h4>
                        <p className="font-mono text-xs text-slate-400">MSSV: {member.studentId}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(member)}
                      title="Xóa thành viên"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-400 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Ban phụ trách:</span>
                      <span className="font-medium text-slate-200">{member.department}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Ngày tham gia:</span>
                      <span className="font-mono text-slate-300">{member.joinedDate}</span>
                    </div>

                    {/* Active Score Gauge */}
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Award className="h-3 w-3 text-cyan-400" /> Điểm cống hiến
                        </span>
                        <span className="font-mono font-bold text-cyan-300">
                          {member.activeScore}/100
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                          style={{ width: `${member.activeScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role Selector Footer */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${roleInfo.className}`}
                  >
                    {roleInfo.label}
                  </span>

                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value as ClubRole)}
                    className="rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-[11px] text-slate-300 focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="OWNER">Chủ nhiệm (OWNER)</option>
                    <option value="ADMIN">Ban Quản trị (ADMIN)</option>
                    <option value="MANAGER">Điều phối viên (MANAGER)</option>
                    <option value="MEMBER">Thành viên (MEMBER)</option>
                    <option value="VIEWER">Quan sát (VIEWER)</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <MemberInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSubmit={onAddMember}
      />
    </div>
  );
}
