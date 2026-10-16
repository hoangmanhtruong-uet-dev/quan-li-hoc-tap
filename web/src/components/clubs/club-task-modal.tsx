'use client';

import React, { useState } from 'react';
import { ClubDepartment, ClubTask } from '@/lib/club-engine';
import { X, Kanban, Plus } from 'lucide-react';

interface ClubTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ClubTask, 'id'>) => void;
}

export function ClubTaskModal({ isOpen, onClose, onSubmit }: ClubTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState<ClubDepartment>('Ban Chuyên môn & Kỹ thuật');
  const [priority, setPriority] = useState<ClubTask['priority']>('medium');
  const [dueDate, setDueDate] = useState('2026-10-25');
  const [status, setStatus] = useState<ClubTask['status']>('todo');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      department,
      priority,
      dueDate,
      status,
      assigneeIds: ['ctc-m1'],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-cyan-950/40">
        {/* Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-400">
              <Kanban className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Giao Nhiệm vụ Ban CLB</h2>
              <p className="text-xs text-slate-400">Điều phối công việc theo tiến độ Kanban</p>
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
              Tiêu đề nhiệm vụ <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Kiểm tra âm thanh & máy chiếu hội trường B1"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Chi tiết yêu cầu</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nội dung cần thực hiện, tiêu chí nghiệm thu..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ban phụ trách</label>
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mức độ ưu tiên</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ClubTask['priority'])}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
              >
                <option value="high">Cao (High)</option>
                <option value="medium">Trung bình (Medium)</option>
                <option value="low">Thấp (Low)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Hạn hoàn thành</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Cột trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ClubTask['status'])}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
              >
                <option value="todo">Cần làm (Todo)</option>
                <option value="in_progress">Đang làm (Doing)</option>
                <option value="review">Chờ review (Review)</option>
                <option value="done">Hoàn thành (Done)</option>
              </select>
            </div>
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:from-purple-400 hover:to-indigo-500 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Giao nhiệm vụ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
