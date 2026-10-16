'use client';

import React, { useState } from 'react';
import { ClubDepartment, ClubRole, ClubMember } from '@/lib/club-engine';
import { X, UserPlus, Users } from 'lucide-react';

interface MemberInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ClubMember, 'id' | 'joinedDate' | 'activeScore'>) => void;
}

export function MemberInviteModal({ isOpen, onClose, onSubmit }: MemberInviteModalProps) {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState<ClubRole>('MEMBER');
  const [department, setDepartment] = useState<ClubDepartment>('Ban Chuyên môn & Kỹ thuật');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !studentId.trim()) return;

    // Pick realistic avatar
    const randomAvatar = `https://images.unsplash.com/photo-${
      [
        '1534528741775-53994a69daeb',
        '1507003211169-0a1dd7228f2d',
        '1494790108377-be9c29b29330',
        '1517841905240-472988babdf9',
        '1500648767791-00dcc994a43e',
      ][Math.floor(Math.random() * 5)]
    }?w=120&auto=format&fit=crop&q=80`;

    onSubmit({
      name: name.trim(),
      studentId: studentId.trim(),
      avatar: randomAvatar,
      role,
      department,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-cyan-950/40">
        {/* Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Kết nạp Thành viên CLB</h2>
              <p className="text-xs text-slate-400">Phân công ban chuyên môn & chức danh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Họ và tên thành viên <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Hoàng Minh Nhật"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mã số sinh viên (MSSV) <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="VD: 20234567"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:border-cyan-400/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Ban chuyên môn</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as ClubDepartment)}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
            >
              <option value="Ban Chủ nhiệm">Ban Chủ nhiệm</option>
              <option value="Ban Chuyên môn & Kỹ thuật">Ban Chuyên môn & Kỹ thuật</option>
              <option value="Ban Truyền thông & Sự kiện">Ban Truyền thông & Sự kiện</option>
              <option value="Ban Đối ngoại & Tài chính">Ban Đối ngoại & Tài chính</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Vai trò / Quyền hạn</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ClubRole)}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
            >
              <option value="MEMBER">Thành viên (MEMBER)</option>
              <option value="MANAGER">Điều phối viên (MANAGER)</option>
              <option value="ADMIN">Ban Quản trị (ADMIN)</option>
              <option value="OWNER">Chủ nhiệm (OWNER)</option>
              <option value="VIEWER">Quan sát viên (VIEWER)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              <UserPlus className="h-4 w-4" />
              <span>Xác nhận kết nạp</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
