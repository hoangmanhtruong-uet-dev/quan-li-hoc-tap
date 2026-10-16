'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { TaskItem, TaskPriority, TaskStatus, TaskStep } from '@/types/tasks';
import { UnselectedHero } from './unselected-hero';
import { SubtaskChecklist } from './subtask-checklist';
import { formatIsoDateOnly } from '@/lib/campus-store';
import {
  X,
  Trash2,
  Calendar,
  Clock,
  Star,
  Play,
  Sparkles,
  BookOpen,
  CheckCircle2,
  FileText,
  History,
  Timer,
  AlertCircle,
  Paperclip,
  Download,
  Eye,
  Loader2,
  Plus,
} from 'lucide-react';
import { uploadAcademicFile, formatBytes, StoredFile } from '@/lib/storage-engine';
import { PdfPreviewModal, PdfPreviewItem } from '@/components/common/pdf-preview-modal';

export interface TaskDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTask: TaskItem | null;
  tasks: TaskItem[];
  onSelectTask: (taskId: string | null) => void;
  onUpdateTask: (taskId: string, patch: Partial<TaskItem>) => void;
  onCompleteTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onFocusTask: (task: TaskItem) => void;
  onOpenCreate?: () => void;
  onAiBreakdown?: () => void;
  reducedMotion?: boolean;
  className?: string;
}

const COURSES_LIST = [
  'Mạng máy tính',
  'Triết học Mác - Lênin',
  'CTDL & GT',
  'Xác suất Thống kê',
  'Dự án Web',
  'Toán rời rạc',
  'Kỹ thuật lập trình',
  'CLB Công nghệ',
];

export function TaskDetailDrawer({
  isOpen,
  onClose,
  selectedTask,
  tasks,
  onSelectTask,
  onUpdateTask,
  onCompleteTask,
  onDeleteTask,
  onFocusTask,
  onOpenCreate,
  onAiBreakdown,
  reducedMotion = false,
  className = '',
}: TaskDetailDrawerProps) {
  // Local editable draft state for instant responsive typing
  const [localTitle, setLocalTitle] = useState('');
  const [localDesc, setLocalDesc] = useState('');
  const [localNotes, setLocalNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hoverStar, setHoverStar] = useState<number | null>(null);

  const [previewFile, setPreviewFile] = useState<PdfPreviewItem | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const handleUploadTaskFile = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedTask) return;
    setIsUploadingAttachment(true);
    try {
      const currentAttachments = [...(selectedTask.attachments || [])];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        const stored = await uploadAcademicFile(file, 'tasks');
        currentAttachments.push({
          id: stored.id,
          name: stored.name,
          url: stored.url,
          type: stored.type,
          sizeBytes: stored.sizeBytes,
        });
      }
      onUpdateTask(selectedTask.id, { attachments: currentAttachments });
    } catch (err) {
      console.error('Lỗi khi đính kèm file vào nhiệm vụ:', err);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleRemoveTaskAttachment = (attachmentId: string) => {
    if (!selectedTask) return;
    const updated = (selectedTask.attachments || []).filter((a) => a.id !== attachmentId);
    onUpdateTask(selectedTask.id, { attachments: updated });
  };

  const handleDownloadTaskAttachment = (att: { name: string; url: string }) => {
    const a = document.createElement('a');
    a.href = att.url;
    a.download = att.name || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Sync draft state with incoming selectedTask
  useEffect(() => {
    if (selectedTask) {
      setLocalTitle(selectedTask.title || '');
      setLocalDesc(selectedTask.description || '');
      setLocalNotes(selectedTask.notes || '');
      setShowDeleteConfirm(false);
    }
  }, [selectedTask]);

  if (!isOpen) return null;

  // Handlers for in-place editing
  const handleTitleBlur = () => {
    if (!selectedTask) return;
    const trimmed = localTitle.trim();
    if (trimmed && trimmed !== selectedTask.title) {
      onUpdateTask(selectedTask.id, { title: trimmed });
    }
  };

  const handleDescBlur = () => {
    if (!selectedTask) return;
    if (localDesc !== (selectedTask.description || '')) {
      onUpdateTask(selectedTask.id, { description: localDesc });
    }
  };

  const handleNotesBlur = () => {
    if (!selectedTask) return;
    if (localNotes !== (selectedTask.notes || '')) {
      onUpdateTask(selectedTask.id, { notes: localNotes });
    }
  };

  const handleStatusChange = (status: TaskStatus) => {
    if (!selectedTask) return;
    if (status === 'done') {
      onCompleteTask(selectedTask.id);
    } else {
      onUpdateTask(selectedTask.id, { status });
    }
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    if (!selectedTask) return;
    onUpdateTask(selectedTask.id, { priority });
  };

  const handleDifficultyChange = (difficulty: number) => {
    if (!selectedTask) return;
    onUpdateTask(selectedTask.id, { difficulty });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTask) return;
    const newDate = e.target.value;
    const existingTime = selectedTask.dueAt?.slice(11, 16) || '23:59';
    onUpdateTask(selectedTask.id, { dueAt: `${newDate}T${existingTime}:00` });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTask) return;
    const newTime = e.target.value;
    const existingDate = selectedTask.dueAt?.slice(0, 10) || formatIsoDateOnly(new Date(), 0);
    onUpdateTask(selectedTask.id, { dueAt: `${existingDate}T${newTime}:00` });
  };

  const setPresetDate = (daysFromNow: number, timeStr = '23:59') => {
    if (!selectedTask) return;
    const targetDate = formatIsoDateOnly(new Date(), daysFromNow);
    onUpdateTask(selectedTask.id, { dueAt: `${targetDate}T${timeStr}:00` });
  };

  const setFridayThisWeek = () => {
    if (!selectedTask) return;
    const today = new Date();
    const day = today.getDay(); // 0 is Sun, 5 is Fri
    const diff = (5 - day + 7) % 7;
    const targetDate = formatIsoDateOnly(today, diff === 0 ? 7 : diff);
    onUpdateTask(selectedTask.id, { dueAt: `${targetDate}T23:59:00` });
  };

  // Subtask handlers
  const handleToggleSubtask = (stepId: string) => {
    if (!selectedTask) return;
    const newSteps = selectedTask.steps.map((s) =>
      s.id === stepId ? { ...s, done: !s.done } : s
    );
    onUpdateTask(selectedTask.id, { steps: newSteps });
  };

  const handleAddSubtask = (text: string) => {
    if (!selectedTask) return;
    const newStep: TaskStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      done: false,
    };
    onUpdateTask(selectedTask.id, { steps: [...selectedTask.steps, newStep] });
  };

  const handleDeleteSubtask = (stepId: string) => {
    if (!selectedTask) return;
    onUpdateTask(selectedTask.id, {
      steps: selectedTask.steps.filter((s) => s.id !== stepId),
    });
  };

  const handleUpdateSubtask = (stepId: string, text: string) => {
    if (!selectedTask) return;
    onUpdateTask(selectedTask.id, {
      steps: selectedTask.steps.map((s) => (s.id === stepId ? { ...s, text } : s)),
    });
  };

  const handleReorderSubtasks = (newSteps: TaskStep[]) => {
    if (!selectedTask) return;
    onUpdateTask(selectedTask.id, { steps: newSteps });
  };

  const handleAdjustPomodoroPlanned = (delta: number) => {
    if (!selectedTask) return;
    const current = selectedTask.pomodoros?.planned || 1;
    const next = Math.max(1, current + delta);
    onUpdateTask(selectedTask.id, {
      pomodoros: {
        planned: next,
        done: selectedTask.pomodoros?.done || 0,
      },
      estimateMin: next * 25,
    });
  };

  const handleDeleteConfirm = () => {
    if (!selectedTask) return;
    onDeleteTask(selectedTask.id);
    onSelectTask(null);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      {/* Backdrop for click outside / mobile overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
      />

      {/* Drawer Container: Responsive Slide-over on Desktop, Bottom Sheet on Mobile */}
      <aside
        className={`fixed z-50 bg-[#10101E] text-white flex flex-col shadow-2xl transition-all duration-300 ease-out border-white/20
          /* Mobile bottom sheet (< 1024px) */
          inset-x-0 bottom-0 max-h-[90vh] rounded-t-[28px] border-t-2
          /* Desktop right slide-over (>= 1024px) */
          lg:inset-y-0 lg:right-0 lg:max-h-full lg:w-[460px] lg:rounded-none lg:border-t-0 lg:border-l-2
          ${className}`}
      >
        {/* Mobile Pull Drag Handle */}
        <div className="lg:hidden w-12 h-1.5 rounded-full bg-white/20 mx-auto my-3 shrink-0" />

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {selectedTask ? (
            /* Selected State: Full Task Editor */
            <div className="space-y-6">
              {/* Top Navigation Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                {/* Status Switcher */}
                <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
                  {(['todo', 'doing', 'done'] as TaskStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-heading font-bold transition-all ${
                        selectedTask.status === st
                          ? st === 'done'
                            ? 'bg-aurora-lime text-black shadow-[2px_2px_0px_#000]'
                            : st === 'doing'
                            ? 'bg-aurora-purple text-white shadow-[2px_2px_0px_#000]'
                            : 'bg-white/20 text-white'
                          : 'text-white/40 hover:text-white'
                      }`}
                    >
                      {st === 'todo' ? 'Cần làm' : st === 'doing' ? 'Đang làm' : 'Hoàn thành'}
                    </button>
                  ))}
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 rounded-xl text-white/40 hover:text-aurora-pink hover:bg-aurora-pink/10 transition-colors"
                    title="Xóa nhiệm vụ này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    title="Đóng chi tiết"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Inline Delete Confirmation */}
              {showDeleteConfirm && (
                <div className="p-3.5 rounded-xl bg-aurora-pink/10 border-2 border-aurora-pink/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-aurora-pink">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Bạn có chắc chắn muốn xóa nhiệm vụ này?</span>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1 rounded-lg bg-white/10 text-white hover:bg-white/20 text-xs font-bold transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteConfirm}
                      className="px-3 py-1 rounded-lg bg-aurora-pink text-white hover:bg-white hover:text-black text-xs font-bold transition-colors shadow-[2px_2px_0px_#000]"
                    >
                      Xóa ngay
                    </button>
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  placeholder="Tiêu đề nhiệm vụ..."
                  className="w-full bg-transparent font-heading font-black text-xl text-white placeholder-white/20 border-b border-transparent focus:border-aurora-lime/50 pb-1 focus:outline-none transition-colors"
                />
              </div>

              {/* Course & Subject Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-aurora-purple" />
                  Môn học / Dự án
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COURSES_LIST.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onUpdateTask(selectedTask.id, { course: c })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedTask.course === c
                          ? 'bg-aurora-purple text-white border border-aurora-purple shadow-[2px_2px_0px_#000]'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time Picker */}
              <div className="space-y-2">
                <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-aurora-cyan" />
                  Hạn hoàn thành
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="date"
                      value={selectedTask.dueAt ? selectedTask.dueAt.slice(0, 10) : ''}
                      onChange={handleDateChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-aurora-cyan focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="time"
                      value={selectedTask.dueAt ? selectedTask.dueAt.slice(11, 16) : '23:59'}
                      onChange={handleTimeChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-aurora-cyan focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Quick Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setPresetDate(0)}
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 text-[10px] text-white/70 font-mono transition-colors"
                  >
                    Hôm nay 23:59
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetDate(1)}
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 text-[10px] text-white/70 font-mono transition-colors"
                  >
                    Ngày mai 23:59
                  </button>
                  <button
                    type="button"
                    onClick={setFridayThisWeek}
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 text-[10px] text-white/70 font-mono transition-colors"
                  >
                    Thứ 6 tuần này
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetDate(2)}
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 text-[10px] text-white/70 font-mono transition-colors"
                  >
                    +2 ngày
                  </button>
                </div>
              </div>

              {/* Priority Radio Chips */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-white/50">
                  Mức độ ưu tiên
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePriorityChange('high')}
                    className={`py-2 px-3 rounded-xl text-xs font-heading font-black transition-all border ${
                      selectedTask.priority === 'high'
                        ? 'bg-[#FF3D6E]/20 text-[#FF3D6E] border-[#FF3D6E] shadow-[2px_2px_0px_#FF3D6E]'
                        : 'bg-white/5 text-white/50 border-white/5 hover:border-white/20'
                    }`}
                  >
                    🔴 Cao (#FF3D6E)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePriorityChange('medium')}
                    className={`py-2 px-3 rounded-xl text-xs font-heading font-black transition-all border ${
                      selectedTask.priority === 'medium'
                        ? 'bg-[#FFB020]/20 text-[#FFB020] border-[#FFB020] shadow-[2px_2px_0px_#FFB020]'
                        : 'bg-white/5 text-white/50 border-white/5 hover:border-white/20'
                    }`}
                  >
                    🟡 Vừa (#FFB020)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePriorityChange('low')}
                    className={`py-2 px-3 rounded-xl text-xs font-heading font-black transition-all border ${
                      selectedTask.priority === 'low'
                        ? 'bg-[#3DE8FF]/20 text-[#3DE8FF] border-[#3DE8FF] shadow-[2px_2px_0px_#3DE8FF]'
                        : 'bg-white/5 text-white/50 border-white/5 hover:border-white/20'
                    }`}
                  >
                    🔵 Thấp (#3DE8FF)
                  </button>
                </div>
              </div>

              {/* Difficulty 1-5 Stars */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-xs font-heading font-bold text-white/80">
                  Độ khó (1–5 sao)
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverStar ?? selectedTask.difficulty ?? 3) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverStar(star)}
                        onMouseLeave={() => setHoverStar(null)}
                        onClick={() => handleDifficultyChange(star)}
                        className="p-1 transition-transform hover:scale-125"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            active
                              ? 'text-aurora-orange fill-aurora-orange'
                              : 'text-white/20'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subtasks Checklist */}
              <div className="pt-2 border-t border-white/10">
                <SubtaskChecklist
                  steps={selectedTask.steps || []}
                  onToggleStep={handleToggleSubtask}
                  onAddStep={handleAddSubtask}
                  onDeleteStep={handleDeleteSubtask}
                  onUpdateStep={handleUpdateSubtask}
                  onReorderSteps={handleReorderSubtasks}
                  onAiBreakdownMore={onAiBreakdown}
                />
              </div>

              {/* Pomodoro Mini Widget */}
              <div className="rounded-2xl bg-gradient-to-br from-[#161626] to-[#0E0F1A] border-2 border-aurora-lime/40 p-4 space-y-3 shadow-[4px_4px_0px_#C6FF3D]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-heading font-black text-aurora-lime flex items-center gap-1.5 uppercase tracking-wider">
                    <Timer className="w-4 h-4" />
                    Phiên Pomodoro
                  </span>
                  <span className="font-mono text-[11px] text-white/60">
                    Thực tế: <strong className="text-white">{selectedTask.actualMin || 0}p</strong> / {selectedTask.estimateMin || 45}p
                  </span>
                </div>

                <div className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/10">
                  <span className="text-xs text-white/80">Số phiên dự kiến (25p/phiên):</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdjustPomodoroPlanned(-1)}
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-base text-aurora-lime w-6 text-center">
                      {selectedTask.pomodoros?.planned || 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustPomodoroPlanned(1)}
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-white/50 px-1">
                  <span>Đã hoàn thành:</span>
                  <span className="font-mono font-bold text-white">
                    {selectedTask.pomodoros?.done || 0} phiên
                  </span>
                </div>

                {/* Focus CTA */}
                <button
                  type="button"
                  onClick={() => onFocusTask(selectedTask)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-aurora-lime text-black font-heading font-black text-xs hover:bg-white transition-all shadow-[2px_2px_0px_#000]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Bắt đầu Focus phiên này (25p)</span>
                </button>
              </div>

              {/* Description & Personal Notes */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="space-y-1">
                  <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-aurora-lime" />
                    Mô tả bài tập
                  </label>
                  <textarea
                    rows={3}
                    value={localDesc}
                    onChange={(e) => setLocalDesc(e.target.value)}
                    onBlur={handleDescBlur}
                    placeholder="Nhập ghi chú yêu cầu bài tập từ giáo viên..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/20 focus:border-aurora-lime/50 focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-aurora-orange" />
                    Ghi chú chiêm nghiệm / Tài liệu
                  </label>
                  <textarea
                    rows={2}
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                    placeholder="Link tài liệu, Git repo hoặc lưu ý cá nhân..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/20 focus:border-aurora-orange/50 focus:outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Task PDF Attachments Section */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                    Tệp đính kèm (PDF / Tài liệu)
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold cursor-pointer transition-all">
                    {isUploadingAttachment ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                        <span>Đang tải lên...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 text-cyan-400" />
                        <span>+ Đính kèm file</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.ppt,.pptx,.doc,.docx"
                      multiple
                      className="hidden"
                      disabled={isUploadingAttachment}
                      onChange={(e) => {
                        handleUploadTaskFile(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>

                {selectedTask.attachments && selectedTask.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTask.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-400/30 transition-all text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate max-w-[180px]">{att.name}</p>
                            {att.sizeBytes && (
                              <p className="text-[10px] text-white/40 font-mono">
                                {formatBytes(att.sizeBytes)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewFile(att)}
                            className="px-2 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/20 text-cyan-300 hover:bg-cyan-500/25 transition-all flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Xem</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadTaskAttachment(att)}
                            title="Tải về"
                            className="p-1 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTaskAttachment(att.id)}
                            title="Xóa tệp đính kèm"
                            className="p-1 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/40 italic">Chưa có tệp PDF nào được đính kèm vào nhiệm vụ này.</p>
                )}
              </div>
            </div>
          ) : (
            /* Unselected State: Intelligent Next-Up Hero */
            <UnselectedHero
              tasks={tasks}
              onSelectTask={onSelectTask}
              onFocusTask={onFocusTask}
              onOpenCreate={onOpenCreate}
              reducedMotion={reducedMotion}
            />
          )}
        </div>
      </aside>

      {/* Cyber-Glass PDF Viewer Modal */}
      <PdfPreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </>
  );
}
