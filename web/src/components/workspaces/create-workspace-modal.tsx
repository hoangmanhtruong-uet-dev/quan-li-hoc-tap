'use client';

import React, { useState, useEffect } from 'react';
import { CreateWorkspaceInput } from '@/lib/workspace-engine';
import { X, Sparkles, Layers, BookOpen, Calendar, AlignLeft, Check } from 'lucide-react';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateWorkspaceInput) => void;
}

export function CreateWorkspaceModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [semester, setSemester] = useState('Học kỳ 1 - 2026');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CreateWorkspaceInput['type']>('project');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setName('');
      setCourseCode('');
      setCourseName('');
      setSemester('Học kỳ 1 - 2026');
      setDescription('');
      setType('project');
      setErrors({});
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Vui lòng nhập tên nhóm / đề tài';
    if (!courseCode.trim()) newErrors.courseCode = 'Vui lòng nhập mã học phần (ví dụ: IT4900)';
    if (!courseName.trim()) newErrors.courseName = 'Vui lòng nhập tên học phần';
    if (!description.trim()) newErrors.description = 'Vui lòng nhập mô tả ngắn về đồ án';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      courseCode: courseCode.trim().toUpperCase(),
      courseName: courseName.trim(),
      semester: semester.trim(),
      description: description.trim(),
      type,
      initialRole: 'OWNER',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/40 text-left transition-all z-10"
      >
        {/* Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-purple-500/15 blur-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 id="modal-title" className="text-lg font-bold text-white">
                Khởi tạo Nhóm &amp; Đồ án mới
              </h3>
              <p className="text-xs text-slate-400">
                Tạo không gian làm việc chuyên biệt cho bài tập lớn, NCKH hoặc thi đấu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Workspace Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Phân loại Không gian
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'project', label: 'Đồ án môn học', desc: 'BTL & Đồ án tốt nghiệp' },
                { id: 'research', label: 'Nghiên cứu KH', desc: 'Lab & Bài báo khoa học' },
                { id: 'competition', label: 'Cuộc thi / Hackathon', desc: 'Đội tuyển thi đấu' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setType(item.id as CreateWorkspaceInput['type'])}
                  className={`flex flex-col items-start rounded-2xl border p-3 text-left transition-all ${
                    type === item.id
                      ? 'border-cyan-400/50 bg-cyan-500/15 shadow-sm shadow-cyan-500/20'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      type === item.id ? 'text-cyan-300' : 'text-slate-200'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Tên đề tài / Tên nhóm <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Đồ án Tốt nghiệp - AI Campus Companion"
              className={`w-full rounded-2xl border bg-black/30 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 ${
                errors.name ? 'border-rose-500/60' : 'border-white/10'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name}</p>}
          </div>

          {/* Course Code & Name Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Mã học phần <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <BookOpen className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="IT4900"
                  className={`w-full rounded-2xl border bg-black/30 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400/40 ${
                    errors.courseCode ? 'border-rose-500/60' : 'border-white/10'
                  }`}
                />
              </div>
              {errors.courseCode && (
                <p className="mt-1 text-xs text-rose-400">{errors.courseCode}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tên môn học <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Đồ án Tốt nghiệp CNTT"
                className={`w-full rounded-2xl border bg-black/30 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 ${
                  errors.courseName ? 'border-rose-500/60' : 'border-white/10'
                }`}
              />
              {errors.courseName && (
                <p className="mt-1 text-xs text-rose-400">{errors.courseName}</p>
              )}
            </div>
          </div>

          {/* Semester Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Học kỳ thực hiện
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
              >
                <option value="Học kỳ 1 - 2026">Học kỳ 1 - 2026 (Hiện tại)</option>
                <option value="Học kỳ 2 - 2026">Học kỳ 2 - 2026</option>
                <option value="Học kỳ Hè - 2026">Học kỳ Hè - 2026</option>
                <option value="Năm học 2026-2027">Năm học 2026-2027</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Mô tả mục tiêu &amp; phạm vi <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả tóm tắt mục tiêu đồ án, công nghệ sử dụng, và tiêu chí hoàn thành..."
              className={`w-full rounded-2xl border bg-black/30 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 resize-none ${
                errors.description ? 'border-rose-500/60' : 'border-white/10'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-400">{errors.description}</p>
            )}
          </div>

          {/* Footer CTAs */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Check className="h-4 w-4" />
              <span>Tạo không gian</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
