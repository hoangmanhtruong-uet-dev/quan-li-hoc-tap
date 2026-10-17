'use client';

import React, { useState, useEffect } from 'react';
import {
  createStudyRoom,
  generateRoomCode,
  type CreateStudyRoomInput,
  type StudyRoomRow,
  type StudyRoomType,
} from '@/lib/study-rooms-service';
import {
  X,
  Sparkles,
  Users,
  Lock,
  Globe,
  Layers,
  Clock,
  Coffee,
  Dice5,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (room: StudyRoomRow) => void;
  initialWorkspaceId?: string;
  initialWorkspaceName?: string;
}

export function CreateRoomModal({
  isOpen,
  onClose,
  onSuccess,
  initialWorkspaceId,
  initialWorkspaceName,
}: CreateRoomModalProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [roomType, setRoomType] = useState<StudyRoomType>(
    initialWorkspaceId ? 'workspace' : 'public'
  );
  const [pinCode, setPinCode] = useState('');
  const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId || '');
  const [focusDuration, setFocusDuration] = useState<number>(45);
  const [breakDuration, setBreakDuration] = useState<number>(5);
  const [maxParticipants, setMaxParticipants] = useState<number>(24);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or initialize state on modal open
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setSubject('');
      setCustomCode('');
      setRoomType(initialWorkspaceId ? 'workspace' : 'public');
      setPinCode('');
      setWorkspaceId(initialWorkspaceId || '');
      setFocusDuration(45);
      setBreakDuration(5);
      setMaxParticipants(24);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, initialWorkspaceId]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) return null;

  const handleGenerateRandomPin = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setPinCode(randomPin);
    if (errors.pinCode) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.pinCode;
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Vui lòng nhập tên phòng học';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Tên phòng phải có ít nhất 3 ký tự';
    }

    if (!subject.trim()) {
      newErrors.subject = 'Vui lòng nhập môn học hoặc chủ đề';
    }

    if (customCode.trim() && !/^[A-Za-z0-9_-]{3,10}$/.test(customCode.trim())) {
      newErrors.customCode = 'Mã phòng phải gồm 3-10 ký tự chữ hoặc số';
    }

    if (roomType === 'private_pin') {
      if (!pinCode.trim()) {
        newErrors.pinCode = 'Vui lòng nhập mã PIN bảo mật 6 số';
      } else if (!/^\d{6}$/.test(pinCode.trim())) {
        newErrors.pinCode = 'Mã PIN phải gồm đúng 6 chữ số';
      }
    }

    if (roomType === 'workspace' && !workspaceId.trim()) {
      newErrors.workspaceId = 'Vui lòng nhập mã hoặc ID không gian làm việc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const input: CreateStudyRoomInput = {
        code: customCode.trim() || undefined,
        title: title.trim(),
        subject: subject.trim(),
        room_type: roomType,
        pin_code: roomType === 'private_pin' ? pinCode.trim() : null,
        workspace_id: roomType === 'workspace' ? (workspaceId.trim() || null) : null,
        focus_duration_minutes: focusDuration,
        break_duration_minutes: breakDuration,
        max_participants: maxParticipants,
      };

      const created = await createStudyRoom(input);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrors({ form: err?.message || 'Có lỗi xảy ra khi tạo phòng học' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-room-title"
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/40 text-left transition-all z-10"
      >
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />

        {/* Modal Header */}
        <div className="relative flex items-start justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-lg shadow-cyan-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 id="create-room-title" className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Tạo Phòng Học Pomodoro Mới
                <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-400/30">
                  REALTIME
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Đồng bộ đồng hồ đa người chơi, kỷ luật Silent Focus và bục vinh danh 3D
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative mt-6 space-y-5">
          {errors.form && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* 1. Room Title & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="room-title" className="block text-xs font-bold text-slate-200 mb-1.5">
                Tên phòng học <span className="text-cyan-400">*</span>
              </label>
              <input
                id="room-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Ôn thi Giải Tích 1 - Cày bài tập"
                disabled={isSubmitting}
                className={`w-full rounded-2xl border bg-black/40 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
                  errors.title
                    ? 'border-rose-500/60 focus:ring-rose-400/40'
                    : 'border-white/10 focus:border-cyan-400/50 focus:ring-cyan-400/30'
                }`}
                autoFocus
              />
              {errors.title && <p className="text-[11px] text-rose-400 mt-1 font-semibold">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="room-subject" className="block text-xs font-bold text-slate-200 mb-1.5">
                Môn học / Chủ đề <span className="text-cyan-400">*</span>
              </label>
              <input
                id="room-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ví dụ: Toán đại cương, Hệ điều hành, AI..."
                disabled={isSubmitting}
                className={`w-full rounded-2xl border bg-black/40 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
                  errors.subject
                    ? 'border-rose-500/60 focus:ring-rose-400/40'
                    : 'border-white/10 focus:border-cyan-400/50 focus:ring-cyan-400/30'
                }`}
              />
              {errors.subject && <p className="text-[11px] text-rose-400 mt-1 font-semibold">{errors.subject}</p>}
            </div>
          </div>

          {/* 2. Room Type Selector (3 Types) */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2">
              Hình thức phòng học <span className="text-cyan-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Type: Public */}
              <button
                type="button"
                onClick={() => setRoomType('public')}
                disabled={isSubmitting}
                className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                  roomType === 'public'
                    ? 'border-cyan-400/60 bg-cyan-500/15 shadow-lg shadow-cyan-500/15'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className={`p-2 rounded-xl ${roomType === 'public' ? 'bg-cyan-500/30 text-cyan-200' : 'bg-white/10 text-slate-300'}`}>
                    <Globe className="h-4 w-4" />
                  </div>
                  {roomType === 'public' && <Check className="h-4 w-4 text-cyan-300" />}
                </div>
                <div className="text-xs font-bold text-white">Công khai (Public)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Mọi sinh viên đều có thể tự do tham gia và học cùng
                </div>
              </button>

              {/* Type: Private PIN */}
              <button
                type="button"
                onClick={() => setRoomType('private_pin')}
                disabled={isSubmitting}
                className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                  roomType === 'private_pin'
                    ? 'border-amber-400/60 bg-amber-500/15 shadow-lg shadow-amber-500/15'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className={`p-2 rounded-xl ${roomType === 'private_pin' ? 'bg-amber-500/30 text-amber-200' : 'bg-white/10 text-slate-300'}`}>
                    <Lock className="h-4 w-4" />
                  </div>
                  {roomType === 'private_pin' && <Check className="h-4 w-4 text-amber-300" />}
                </div>
                <div className="text-xs font-bold text-white">Mã PIN bảo mật</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Chỉ người có mã PIN 6 số mới được phép vào phòng
                </div>
              </button>

              {/* Type: Workspace */}
              <button
                type="button"
                onClick={() => setRoomType('workspace')}
                disabled={isSubmitting}
                className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                  roomType === 'workspace'
                    ? 'border-purple-400/60 bg-purple-500/15 shadow-lg shadow-purple-500/15'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className={`p-2 rounded-xl ${roomType === 'workspace' ? 'bg-purple-500/30 text-purple-200' : 'bg-white/10 text-slate-300'}`}>
                    <Layers className="h-4 w-4" />
                  </div>
                  {roomType === 'workspace' && <Check className="h-4 w-4 text-purple-300" />}
                </div>
                <div className="text-xs font-bold text-white">Gắn với Workspace</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Dành riêng cho nhóm đồ án và hiển thị trong Workspace
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Input: 6-Digit PIN */}
          {roomType === 'private_pin' && (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="pin-input" className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Mã PIN 6 chữ số
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRandomPin}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-100 hover:underline transition-all"
                >
                  <Dice5 className="h-3 w-3" />
                  <span>Tạo mã ngẫu nhiên</span>
                </button>
              </div>
              <input
                id="pin-input"
                type="text"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Ví dụ: 888888"
                className={`w-full rounded-xl border bg-black/60 px-4 py-2 text-center font-mono text-lg font-black tracking-widest text-amber-300 placeholder-amber-500/40 focus:outline-none focus:ring-2 ${
                  errors.pinCode
                    ? 'border-rose-500 focus:ring-rose-400/40'
                    : 'border-amber-400/40 focus:border-amber-400 focus:ring-amber-400/30'
                }`}
              />
              {errors.pinCode && <p className="text-[11px] text-rose-400 font-semibold">{errors.pinCode}</p>}
            </div>
          )}

          {/* Conditional Input: Workspace Binding */}
          {roomType === 'workspace' && (
            <div className="rounded-2xl border border-purple-400/30 bg-purple-500/10 p-4 space-y-2">
              <label htmlFor="workspace-id-input" className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                Mã Không gian làm việc (Workspace ID)
              </label>
              {initialWorkspaceName ? (
                <div className="flex items-center justify-between rounded-xl border border-purple-400/40 bg-black/40 px-3.5 py-2">
                  <span className="text-xs font-bold text-white">{initialWorkspaceName}</span>
                  <span className="font-mono text-[10px] text-purple-300">ID: {initialWorkspaceId}</span>
                </div>
              ) : (
                <input
                  id="workspace-id-input"
                  type="text"
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                  placeholder="Ví dụ: ws-capstone-2026 hoặc capstone-ai"
                  className={`w-full rounded-xl border bg-black/60 px-4 py-2 text-xs font-mono text-purple-200 placeholder-purple-500/40 focus:outline-none focus:ring-2 ${
                    errors.workspaceId
                      ? 'border-rose-500 focus:ring-rose-400/40'
                      : 'border-purple-400/40 focus:border-purple-400 focus:ring-purple-400/30'
                  }`}
                />
              )}
              {errors.workspaceId && <p className="text-[11px] text-rose-400 font-semibold">{errors.workspaceId}</p>}
            </div>
          )}

          {/* 3. Focus & Break Timers + Max Participants */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Focus Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                <span>Thời gian học</span>
              </label>
              <select
                value={focusDuration}
                onChange={(e) => setFocusDuration(Number(e.target.value))}
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
              >
                <option value={25} className="bg-slate-900 text-white">25 phút (Pomodoro chuẩn)</option>
                <option value={45} className="bg-slate-900 text-white">45 phút (Đại học chuẩn)</option>
                <option value={50} className="bg-slate-900 text-white">50 phút (Tập trung sâu)</option>
                <option value={60} className="bg-slate-900 text-white">60 phút (Cày đồ án)</option>
                <option value={90} className="bg-slate-900 text-white">90 phút (Hardcore)</option>
              </select>
            </div>

            {/* Break Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1">
                <Coffee className="h-3.5 w-3.5 text-amber-400" />
                <span>Thời gian nghỉ</span>
              </label>
              <select
                value={breakDuration}
                onChange={(e) => setBreakDuration(Number(e.target.value))}
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400/30"
              >
                <option value={5} className="bg-slate-900 text-white">5 phút (Nghỉ ngắn)</option>
                <option value={10} className="bg-slate-900 text-white">10 phút (Thư giãn / Lo-fi)</option>
                <option value={15} className="bg-slate-900 text-white">15 phút (Nghỉ dài)</option>
              </select>
            </div>

            {/* Max Participants */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-purple-400" />
                <span>Sĩ số tối đa</span>
              </label>
              <select
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-400/30"
              >
                <option value={8} className="bg-slate-900 text-white">8 sinh viên (Nhóm nhỏ)</option>
                <option value={12} className="bg-slate-900 text-white">12 sinh viên</option>
                <option value={24} className="bg-slate-900 text-white">24 sinh viên (Tiêu chuẩn)</option>
                <option value={30} className="bg-slate-900 text-white">30 sinh viên</option>
                <option value={50} className="bg-slate-900 text-white">50 sinh viên (Hội trường)</option>
              </select>
            </div>
          </div>

          {/* Optional Custom Room Code */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="custom-code" className="text-xs font-semibold text-slate-300">
                Mã phòng tùy chọn (để trống sẽ tạo tự động 6 ký tự)
              </label>
              <button
                type="button"
                onClick={() => setCustomCode(generateRoomCode())}
                className="text-[10px] font-mono text-cyan-300 hover:underline"
              >
                Tạo mã tự động
              </button>
            </div>
            <input
              id="custom-code"
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              placeholder="Ví dụ: GT1-01 hoặc để trống"
              maxLength={10}
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            />
            {errors.customCode && <p className="text-[11px] text-rose-400 mt-1 font-semibold">{errors.customCode}</p>}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang khởi tạo phòng...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Tạo phòng học ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
