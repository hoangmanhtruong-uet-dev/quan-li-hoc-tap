'use client';

import React, { useState } from 'react';
import { ClubDepartment, ClubEvent } from '@/lib/club-engine';
import { X, Calendar, Clock, MapPin, Users, Sparkles, Plus } from 'lucide-react';

interface EventCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ClubEvent, 'id' | 'attendeeIds'>) => void;
}

export function EventCreateModal({ isOpen, onClose, onSubmit }: EventCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('2026-11-05');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('17:00');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<ClubEvent['category']>('Workshop');
  const [department, setDepartment] = useState<ClubDepartment>('Ban Chuyên môn & Kỹ thuật');
  const [maxAttendees, setMaxAttendees] = useState(60);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      date,
      startTime,
      endTime,
      location: location.trim(),
      category,
      department,
      maxAttendees: Number(maxAttendees) || 50,
      bannerGradient: 'from-blue-600 via-cyan-500 to-teal-400',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-cyan-950/40">
        {/* Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Lên lịch Sự kiện CLB</h2>
              <p className="text-xs text-slate-400">Workshop, Hackathon, hoặc Sinh hoạt nội bộ</p>
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
              Tên sự kiện / Workshop <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Workshop Agentic AI & Next.js App Router"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mô tả nội dung</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tóm tắt mục tiêu, diễn giả hoặc yêu cầu tham gia..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Thể loại</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ClubEvent['category'])}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
              >
                <option value="Workshop">Workshop</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Sinh hoạt">Sinh hoạt</option>
                <option value="Giao lưu">Giao lưu</option>
              </select>
            </div>

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
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ngày tổ chức</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-2.5 py-2.5 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Bắt đầu</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-2.5 py-2.5 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kết thúc</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-2.5 py-2.5 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Địa điểm <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="VD: Hội trường B1 - ĐHBK"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Giới hạn số chỗ</label>
              <input
                type="number"
                min={5}
                max={500}
                value={maxAttendees}
                onChange={(e) => setMaxAttendees(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Lên lịch sự kiện</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
