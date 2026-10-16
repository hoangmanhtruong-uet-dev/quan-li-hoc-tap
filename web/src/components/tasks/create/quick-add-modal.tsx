'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { TaskItem, TaskPriority, TaskAttachment } from '@/types/tasks';
import { parseVietnameseTaskInput } from '@/lib/tasks-engine';
import { useCampusStore } from '@/lib/campus-store';
import { uploadAcademicFile, formatBytes } from '@/lib/storage-engine';
import { QuickTaskBackdrop3D } from './quick-task-backdrop-3d';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  ArrowRight,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronDown,
  Paperclip,
  FileText,
  Loader2,
} from 'lucide-react';

export interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: (task: TaskItem) => void;
  initialTitle?: string;
  className?: string;
}

const PRIORITY_TIERS: {
  id: TaskPriority;
  label: string;
  color: string;
  badgeBg: string;
  borderClass: string;
}[] = [
  {
    id: 'low',
    label: 'Thấp',
    color: '#3DE8FF',
    badgeBg: 'bg-[#3DE8FF]/15 text-[#3DE8FF] border-[#3DE8FF]/40',
    borderClass: 'border-[#3DE8FF]',
  },
  {
    id: 'medium',
    label: 'Vừa',
    color: '#FFB020',
    badgeBg: 'bg-[#FFB020]/15 text-[#FFB020] border-[#FFB020]/40',
    borderClass: 'border-[#FFB020]',
  },
  {
    id: 'high',
    label: 'Gấp',
    color: '#FF8A3D',
    badgeBg: 'bg-[#FF8A3D]/15 text-[#FF8A3D] border-[#FF8A3D]/40',
    borderClass: 'border-[#FF8A3D]',
  },
  {
    id: 'urgent',
    label: 'Siêu gấp',
    color: '#FF3D6E',
    badgeBg: 'bg-[#FF3D6E]/20 text-[#FF3D6E] border-[#FF3D6E] animate-pulse',
    borderClass: 'border-[#FF3D6E]',
  },
];

const QUICK_SUGGESTIONS = [
  { label: 'Hôm nay 23h', append: 'hôm nay 23h' },
  { label: 'Ngày mai', append: 'ngày mai 23h' },
  { label: 'Cuối tuần', append: 'cuối tuần' },
  { label: 'Tuần sau', append: 'thứ 6 tuần sau' },
];

const KNOWN_COURSES = [
  'Mạng máy tính',
  'Triết học Mác - Lênin',
  'CTDL & GT',
  'Xác suất Thống kê',
  'Toán rời rạc',
  'Giải tích',
  'Kỹ thuật lập trình',
  'Dự án Web',
];

export function QuickAddModal({
  isOpen,
  onClose,
  onTaskCreated,
  initialTitle = '',
  className = '',
}: QuickAddModalProps) {
  const { addQuickTask } = useCampusStore();
  const [input, setInput] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Manual chip override states
  const [manualPriority, setManualPriority] = useState<TaskPriority | null>(null);
  const [manualDate, setManualDate] = useState<string | null>(null);
  const [manualTime, setManualTime] = useState<string | null>(null);
  const [manualCourse, setManualCourse] = useState<string | null>(null);

  // Active popover selector dropdown
  const [activePopover, setActivePopover] = useState<'date' | 'time' | 'course' | null>(null);

  // File Attachments state
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingAttachment(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        const stored = await uploadAcademicFile(file, 'tasks');
        setAttachments((prev) => [
          ...prev,
          {
            id: stored.id,
            name: stored.name,
            url: stored.url,
            type: stored.type,
            sizeBytes: stored.sizeBytes,
          },
        ]);
      }
    } catch (err) {
      console.error('Lỗi tải tệp đính kèm:', err);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // 3D FX & Gamification states
  const [typingIntensity, setTypingIntensity] = useState(0);
  const [isSuccessBurst, setIsSuccessBurst] = useState(false);
  const [showXpAnim, setShowXpAnim] = useState(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 5-second Undo Toast state (kept outside modal close)
  const [undoToast, setUndoToast] = useState<{
    taskTitle: string;
    undo: () => void;
  } | null>(null);

  // Real-time Vietnamese NLP extraction
  const parsed = useMemo(() => {
    return parseVietnameseTaskInput(input);
  }, [input]);

  // Combined resolved values (manual overrides take precedence if set)
  const resolvedPriority = manualPriority || parsed.priority;
  const resolvedDate = manualDate || parsed.dueDate;
  const resolvedTime = manualTime || parsed.dueTime;
  const resolvedCourse = manualCourse !== null ? manualCourse : (parsed.course || '');

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setInput(initialTitle);
      setManualPriority(null);
      setManualDate(null);
      setManualTime(null);
      setManualCourse(null);
      setActivePopover(null);
      setIsSuccessBurst(false);
      setShowXpAnim(false);

      const focusTimer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 60);
      return () => clearTimeout(focusTimer);
    }
  }, [isOpen, initialTitle]);

  // Handle typing intensity for 3D reactive pulse
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    // Compute typing intensity (0.0 to 1.0)
    const intensity = Math.min(1.0, val.length / 40 + 0.3);
    setTypingIntensity(intensity);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setTypingIntensity(0);
    }, 450);
  };

  // Create Task Execution Logic
  const handleExecuteCreate = useCallback(
    (continuousMode = false) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      const plannedPomodoros = Math.max(1, Math.ceil(parsed.estimateMin / 25));
      const dueAt = `${resolvedDate}T${resolvedTime}:00`;

      // Dual-write to tasks & deadlines, award +10 XP, and obtain undo closure
      const { task, undo } = addQuickTask({
        title: parsed.title,
        course: resolvedCourse || undefined,
        status: 'todo',
        priority: resolvedPriority,
        difficulty: 3,
        dueAt,
        estimateMin: parsed.estimateMin,
        actualMin: 0,
        steps: [],
        tags: resolvedCourse ? [resolvedCourse] : [],
        pomodoros: {
          planned: plannedPomodoros,
          done: 0,
        },
        attachments,
      });

      // Visual celebrations
      setIsSuccessBurst(true);
      setShowXpAnim(true);

      // Trigger 5-second undo toast
      setUndoToast({
        taskTitle: task.title,
        undo,
      });

      onTaskCreated?.(task);

      if (continuousMode) {
        // Continuous mode: clear input for next task and keep open
        setInput('');
        setManualPriority(null);
        setManualDate(null);
        setManualTime(null);
        setManualCourse(null);
        setAttachments([]);
        inputRef.current?.focus();
      } else {
        // Close modal after brief success cue (220ms)
        setTimeout(() => {
          onClose();
        }, 220);
      }
    },
    [input, parsed, resolvedDate, resolvedTime, resolvedPriority, resolvedCourse, attachments, addQuickTask, onTaskCreated, onClose]
  );

  // Keyboard shortcut listener: Enter, Ctrl+Enter, Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleExecuteCreate(true); // Continuous rapid entry mode
      } else if (e.key === 'Enter' && !e.shiftKey) {
        // Prevent default submit when inside popover or input
        if (e.target instanceof HTMLInputElement) {
          e.preventDefault();
          handleExecuteCreate(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleExecuteCreate]);

  // Auto-dismiss undo toast after 5 seconds
  useEffect(() => {
    if (!undoToast) return;
    const timer = setTimeout(() => {
      setUndoToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [undoToast]);

  const appendSuggestion = (text: string) => {
    setInput((prev) => {
      const clean = prev.trim();
      return clean ? `${clean} ${text}` : text;
    });
    inputRef.current?.focus();
  };

  if (!isOpen && !undoToast) return null;

  return (
    <>
      {/* 5-Second Neo-Brutal Undo Toast (Persists independently across modal state) */}
      {undoToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#121220] border-2 border-aurora-lime text-white shadow-[6px_6px_0px_#C6FF3D] animate-slide-up"
        >
          <div className="p-1 rounded-lg bg-aurora-lime text-black">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-xs">
            <span className="font-heading font-bold text-white">Đã thêm vào Deadline Arena</span>
            <span className="text-white/60 truncate max-w-[200px]">{undoToast.taskTitle}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              undoToast.undo();
              setUndoToast(null);
            }}
            className="ml-2 px-3 py-1.5 rounded-xl bg-aurora-lime text-black font-heading font-black text-xs hover:bg-white transition-all shadow-[2px_2px_0px_#000] flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Hoàn tác</span>
          </button>
          <button
            type="button"
            onClick={() => setUndoToast(null)}
            className="text-white/40 hover:text-white p-1 rounded-lg"
            aria-label="Đóng thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {isOpen && (
        <>
          {/* Backdrop with 60% opacity & blur */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            aria-hidden="true"
          />

          {/* Three.js 3D WebGL Background Canvas Layer */}
          <div className="fixed inset-0 z-50 pointer-events-none">
            <QuickTaskBackdrop3D
              priority={resolvedPriority}
              typingIntensity={typingIntensity}
              isSuccessBurst={isSuccessBurst}
            />
          </div>

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none max-sm:p-0 max-sm:items-end">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="quick-task-modal-title"
              className={`pointer-events-auto relative w-full max-w-xl rounded-3xl bg-[#0E0E1A]/95 backdrop-blur-xl border-2 ${
                resolvedPriority === 'urgent'
                  ? 'border-[#FF3D6E] shadow-[0_0_30px_rgba(255,61,110,0.4)] animate-shake-subtle'
                  : 'border-aurora-lime/60 shadow-[8px_8px_0px_#000]'
              } p-6 sm:p-7 space-y-5 transition-all text-white max-sm:rounded-b-none max-sm:max-w-full ${className}`}
            >
              {/* Floating +10 XP Gamification Badge Animation */}
              {showXpAnim && (
                <div className="absolute -top-3 right-8 pointer-events-none font-heading font-black text-sm text-black bg-aurora-lime px-3 py-1 rounded-full shadow-[3px_3px_0px_#000] animate-bounce flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  +10 XP
                </div>
              )}

              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-aurora-lime text-black font-black shadow-[2px_2px_0px_#000]">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h2
                      id="quick-task-modal-title"
                      className="font-heading font-black text-lg text-white flex items-center gap-2"
                    >
                      Tạo nhiệm vụ nhanh
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-aurora-lime font-bold">
                        NLP Gen Z
                      </span>
                    </h2>
                    <p className="text-xs text-white/70">
                      Gõ tự nhiên bằng tiếng Việt, AI tự bóc tách deadline, môn học và ưu tiên.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Đóng cửa sổ"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* NLP Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExecuteCreate(false);
                }}
                className="space-y-4"
              >
                <div className="relative">
                  <div className="absolute left-3.5 top-3.5 text-aurora-lime pointer-events-none">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="VD: Nộp bài tập lớn Mạng máy tính lúc 23h thứ 6 siêu gấp"
                    className="w-full bg-black/60 border-2 border-white/20 focus:border-aurora-lime rounded-2xl pl-11 pr-24 py-3.5 text-sm sm:text-base text-white placeholder-white/40 focus:outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(198,255,61,0.2)]"
                  />
                  <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="px-3.5 py-2 rounded-xl bg-aurora-lime text-black font-heading font-black text-xs hover:bg-white disabled:opacity-20 disabled:hover:bg-aurora-lime transition-all shadow-[2px_2px_0px_#000] flex items-center gap-1.5"
                    >
                      <span>Tạo</span>
                      <span className="hidden sm:inline font-mono text-[10px] opacity-70 bg-black/20 px-1 py-0.5 rounded">
                        ↵
                      </span>
                    </button>
                  </div>
                </div>

                {/* Real-time Parsed Interactive Chips Row */}
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-heading font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-aurora-lime" />
                      Nhận diện tự động (Bấm chip để sửa tay)
                    </span>
                    <span className="text-[10px] text-white/50 font-mono">
                      {parsed.confidence ? `${Math.round(parsed.confidence * 100)}% match` : ''}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {/* Date Chip */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActivePopover(activePopover === 'date' ? null : 'date')
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-aurora-cyan/15 hover:bg-aurora-cyan/25 text-aurora-cyan border border-aurora-cyan/40 font-bold transition-all shadow-sm"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>📅 {resolvedDate}</span>
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>

                      {activePopover === 'date' && (
                        <div className="absolute left-0 top-full mt-1.5 z-20 w-48 p-2 rounded-xl bg-[#141424] border border-white/20 shadow-xl space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setManualDate(parsed.dueDate);
                              setActivePopover(null);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/10 flex items-center justify-between"
                          >
                            <span>Tự động: {parsed.dueDate}</span>
                            {resolvedDate === parsed.dueDate && (
                              <Check className="w-3 h-3 text-aurora-lime" />
                            )}
                          </button>
                          <input
                            type="date"
                            value={resolvedDate}
                            onChange={(e) => {
                              setManualDate(e.target.value);
                              setActivePopover(null);
                            }}
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* Time Chip */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActivePopover(activePopover === 'time' ? null : 'time')
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-aurora-purple/15 hover:bg-aurora-purple/25 text-aurora-purple border border-aurora-purple/40 font-mono font-bold transition-all shadow-sm"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>⏰ {resolvedTime}</span>
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>

                      {activePopover === 'time' && (
                        <div className="absolute left-0 top-full mt-1.5 z-20 w-44 p-2 rounded-xl bg-[#141424] border border-white/20 shadow-xl space-y-1">
                          {['23:59', '23:00', '19:00', '14:30', '12:00', '08:00'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setManualTime(t);
                                setActivePopover(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono hover:bg-white/10 flex items-center justify-between"
                            >
                              <span>{t}</span>
                              {resolvedTime === t && (
                                <Check className="w-3 h-3 text-aurora-lime" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Course Chip */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActivePopover(activePopover === 'course' ? null : 'course')
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 border border-white/20 font-bold transition-all shadow-sm"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-aurora-lime" />
                        <span>📚 {resolvedCourse || 'Chưa gắn môn'}</span>
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>

                      {activePopover === 'course' && (
                        <div className="absolute left-0 top-full mt-1.5 z-20 w-56 max-h-48 overflow-y-auto p-2 rounded-xl bg-[#141424] border border-white/20 shadow-xl space-y-1">
                          {KNOWN_COURSES.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setManualCourse(c);
                                setActivePopover(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/10 flex items-center justify-between"
                            >
                              <span className="truncate">{c}</span>
                              {resolvedCourse === c && (
                                <Check className="w-3 h-3 text-aurora-lime shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4 Priority Tiers Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-heading font-bold text-white/60 uppercase tracking-wider text-[11px]">
                      Mức độ ưu tiên:
                    </span>
                    {resolvedPriority === 'urgent' && (
                      <span className="text-[11px] text-[#FF3D6E] font-bold flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        Đang kích hoạt chế độ siêu gấp!
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {PRIORITY_TIERS.map((tier) => {
                      const isSelected = resolvedPriority === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setManualPriority(tier.id)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-heading font-black transition-all border flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? `${tier.badgeBg} shadow-[2px_2px_0px_#000] scale-[1.02]`
                              : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: tier.color }}
                          />
                          <span>{tier.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PDF Attachments Section */}
                <div className="space-y-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-heading font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                      Đính kèm tài liệu (PDF / Slide)
                    </span>
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold cursor-pointer transition-all">
                      {isUploadingAttachment ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                          <span>Đang tải lên...</span>
                        </>
                      ) : (
                        <>
                          <span>+ Chọn file PDF</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.ppt,.pptx,.doc,.docx"
                        multiple
                        className="hidden"
                        disabled={isUploadingAttachment}
                        onChange={(e) => {
                          handleFileUpload(e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/40 border border-cyan-400/30 text-xs text-white"
                        >
                          <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate max-w-[150px] font-medium">{att.name}</span>
                          {att.sizeBytes ? (
                            <span className="text-[10px] text-white/50 font-mono">
                              ({formatBytes(att.sizeBytes)})
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="p-0.5 rounded text-white/40 hover:text-rose-400 transition-colors"
                            title="Xóa tệp"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Suggestion Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-heading font-bold text-white/50 uppercase tracking-wider block">
                    Gợi ý nhanh (Click để điền sẵn):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_SUGGESTIONS.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => appendSuggestion(item.append)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white text-xs font-mono transition-colors border border-white/10"
                      >
                        +{item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons & Shortcut Hints */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center gap-3 text-xs text-white/50 font-mono">
                    <span className="hidden sm:inline">
                      <strong>Enter</strong>: tạo & đóng
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline">
                      <strong>Ctrl+Enter</strong>: tạo liên tục
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 text-xs font-heading font-bold transition-colors"
                    >
                      Hủy (Esc)
                    </button>
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="px-5 py-2.5 rounded-xl bg-aurora-lime text-black font-heading font-black text-xs hover:bg-white disabled:opacity-20 disabled:hover:bg-aurora-lime transition-all shadow-[3px_3px_0px_#000] flex items-center gap-2"
                    >
                      <span>Tạo nhiệm vụ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        </>
      )}
    </>
  );
}
