'use client';

import React, { useState, useEffect } from 'react';
import type { TaskItem, TaskStep, TaskPriority } from '@/types/tasks';
import { useCampusStore, formatIsoDateOnly } from '@/lib/campus-store';
import {
  X,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Calendar,
  Clock,
  BookOpen,
  ArrowRight,
  Layers,
  Wand2,
  AlertCircle,
} from 'lucide-react';

export interface AiBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: (task: TaskItem) => void;
  className?: string;
}

interface GeneratedStepDraft {
  id: string;
  text: string;
  estimateMin: number;
  enabled: boolean;
}

const TEMPLATES = [
  {
    title: 'Bài tập lớn Socket UDP',
    prompt:
      'Bài tập lớn Mạng máy tính: Lập trình socket truyền file tin cậy qua UDP, viết tài liệu kiểm thử và nộp báo cáo PDF trước ngày 20/10.',
  },
  {
    title: 'Tiểu luận Triết học Mác - Lênin',
    prompt:
      'Tiểu luận Triết học Mác - Lênin: Phân tích quy luật mâu thuẫn và vận dụng vào phát triển kinh tế thị trường định hướng XHCN ở Việt Nam.',
  },
  {
    title: 'Thực hành CTDL & GT',
    prompt:
      'Bài thực hành Cấu trúc dữ liệu & Giải thuật: Cài đặt cây AVL, kiểm tra cân bằng và đo thời gian tìm kiếm so sánh với cây nhị phân thông thường.',
  },
];

const KNOWN_COURSES = [
  'Mạng máy tính',
  'Triết học Mác - Lênin',
  'CTDL & GT',
  'Xác suất Thống kê',
  'Dự án Web',
  'Toán rời rạc',
];

export function AiBreakdownModal({
  isOpen,
  onClose,
  onTaskCreated,
  className = '',
}: AiBreakdownModalProps) {
  const { addTask } = useCampusStore();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Review stage states
  const [stepStage, setStepStage] = useState<'input' | 'review'>('input');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCourse, setTaskCourse] = useState('Mạng máy tính');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('high');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [steps, setSteps] = useState<GeneratedStepDraft[]>([]);
  const [newStepText, setNewStepText] = useState('');

  // Reset or setup dates on open
  useEffect(() => {
    if (isOpen) {
      setStepStage('input');
      setPrompt('');
      const defaultDue = formatIsoDateOnly(new Date(), 3);
      setTaskDueDate(defaultDue);
    }
  }, [isOpen]);

  // Escape shortcut
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

  // Breakdown generation heuristic
  const handleGenerate = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setIsGenerating(true);

    setTimeout(() => {
      const lower = trimmed.toLowerCase();

      // Detect course
      let detectedCourse = 'Mạng máy tính';
      if (lower.includes('triết')) detectedCourse = 'Triết học Mác - Lênin';
      else if (lower.includes('ctdl') || lower.includes('cấu trúc dữ liệu') || lower.includes('giải thuật'))
        detectedCourse = 'CTDL & GT';
      else if (lower.includes('xác suất') || lower.includes('thống kê'))
        detectedCourse = 'Xác suất Thống kê';
      else if (lower.includes('web') || lower.includes('frontend') || lower.includes('backend'))
        detectedCourse = 'Dự án Web';
      else if (lower.includes('toán')) detectedCourse = 'Toán rời rạc';
      setTaskCourse(detectedCourse);

      // Title heuristic
      let extractedTitle = 'Bài tập lớn: ' + detectedCourse;
      const firstSentence = trimmed.split(/[\n.:]/)[0]?.trim();
      if (firstSentence && firstSentence.length > 5 && firstSentence.length < 60) {
        extractedTitle = firstSentence;
      }
      setTaskTitle(extractedTitle);

      // Generated stages heuristic
      let generatedSteps: GeneratedStepDraft[] = [];

      if (lower.includes('socket') || lower.includes('mã nguồn') || lower.includes('lập trình') || lower.includes('code') || lower.includes('cây')) {
        generatedSteps = [
          {
            id: 's-1',
            text: 'Nghiên cứu đề bài & vẽ sơ đồ kiến trúc hệ thống',
            estimateMin: 25,
            enabled: true,
          },
          {
            id: 's-2',
            text: 'Thiết kế cấu trúc dữ liệu & giao thức truyền tải gói tin',
            estimateMin: 35,
            enabled: true,
          },
          {
            id: 's-3',
            text: 'Cài đặt mã nguồn cốt lõi (Core Implementation)',
            estimateMin: 60,
            enabled: true,
          },
          {
            id: 's-4',
            text: 'Kiểm thử bắt lỗi ngoại lệ & đo lường hiệu năng',
            estimateMin: 30,
            enabled: true,
          },
          {
            id: 's-5',
            text: 'Soạn thảo tài liệu báo cáo PDF & đóng gói mã nguồn',
            estimateMin: 30,
            enabled: true,
          },
        ];
      } else if (lower.includes('tiểu luận') || lower.includes('báo cáo') || lower.includes('triết')) {
        generatedSteps = [
          {
            id: 's-1',
            text: 'Đọc tài liệu giáo trình & lập đề cương chi tiết các chương',
            estimateMin: 30,
            enabled: true,
          },
          {
            id: 's-2',
            text: 'Tổng hợp tài liệu tham khảo & số liệu thực tiễn',
            estimateMin: 45,
            enabled: true,
          },
          {
            id: 's-3',
            text: 'Viết nội dung phân tích cốt lõi (Phần thân bài)',
            estimateMin: 60,
            enabled: true,
          },
          {
            id: 's-4',
            text: 'Viết phần kết luận, liên hệ thực tiễn & định dạng trích dẫn APA',
            estimateMin: 30,
            enabled: true,
          },
          {
            id: 's-5',
            text: 'Soát lỗi chính tả & xuất file PDF nộp lên cổng trường',
            estimateMin: 20,
            enabled: true,
          },
        ];
      } else {
        generatedSteps = [
          {
            id: 's-1',
            text: 'Đọc kỹ yêu cầu đề bài & ghi chú các mốc tiêu chí chấm điểm',
            estimateMin: 20,
            enabled: true,
          },
          {
            id: 's-2',
            text: 'Lập dàn ý giải quyết từng câu hỏi trong đề bài',
            estimateMin: 30,
            enabled: true,
          },
          {
            id: 's-3',
            text: 'Triển khai chi tiết lời giải và các nội dung chính',
            estimateMin: 60,
            enabled: true,
          },
          {
            id: 's-4',
            text: 'Đối chiếu kết quả, kiểm tra lại toàn bộ bài làm',
            estimateMin: 30,
            enabled: true,
          },
          {
            id: 's-5',
            text: 'Hoàn thiện bản cuối cùng và nộp bài trước deadline',
            estimateMin: 20,
            enabled: true,
          },
        ];
      }

      setSteps(generatedSteps);
      setIsGenerating(false);
      setStepStage('review');
    }, 450);
  };

  const toggleStep = (id: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const deleteStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStepText = (id: string, text: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, text } : s))
    );
  };

  const addCustomStep = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStepText.trim();
    if (!trimmed) return;
    setSteps((prev) => [
      ...prev,
      {
        id: `s-${Date.now()}`,
        text: trimmed,
        estimateMin: 25,
        enabled: true,
      },
    ]);
    setNewStepText('');
  };

  const handleCreateTask = () => {
    const activeSteps: TaskStep[] = steps
      .filter((s) => s.enabled)
      .map((s) => ({
        id: s.id,
        text: s.text,
        done: false,
      }));

    const totalEstimateMin = steps
      .filter((s) => s.enabled)
      .reduce((sum, s) => sum + s.estimateMin, 0);

    const plannedPomodoros = Math.max(1, Math.ceil(totalEstimateMin / 25));

    const created = addTask({
      title: taskTitle.trim() || 'Nhiệm vụ mới',
      description: prompt.trim() || undefined,
      course: taskCourse,
      status: 'todo',
      priority: taskPriority,
      difficulty: 4,
      dueAt: `${taskDueDate}T23:59:00`,
      estimateMin: totalEstimateMin || 90,
      actualMin: 0,
      steps: activeSteps,
      tags: [taskCourse, 'AI Breakdown'],
      pomodoros: {
        planned: plannedPomodoros,
        done: 0,
      },
    });

    onTaskCreated?.(created);
    onClose();
  };

  const enabledSteps = steps.filter((s) => s.enabled);
  const totalMinutes = enabledSteps.reduce((acc, s) => acc + s.estimateMin, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          className={`pointer-events-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#10101E] border-2 border-aurora-purple/60 p-6 shadow-[8px_8px_0px_#7C5CFF] space-y-5 transition-all text-white ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-aurora-purple text-white font-black shadow-[2px_2px_0px_#000]">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-lg text-white">
                  {stepStage === 'input'
                    ? 'AI Chia nhỏ nhiệm vụ lớn'
                    : 'Xem trước lộ trình nhiệm vụ'}
                </h3>
                <p className="text-xs text-white/50">
                  {stepStage === 'input'
                    ? 'Dán đề bài hoặc yêu cầu bài tập của giảng viên để tự động sinh các bước nhỏ'
                    : 'Tùy chỉnh các bước thực hiện và thời gian ước tính trước khi tạo'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {stepStage === 'input' ? (
            /* Stage 1: Input Prompt */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-heading font-bold text-white/80 block">
                  Đề bài / Yêu cầu bài tập:
                </label>
                <textarea
                  rows={5}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Dán đề bài hoặc yêu cầu bài tập của giáo viên vào đây... Ví dụ: Bài tập lớn Mạng máy tính: Lập trình socket truyền file tin cậy qua UDP, viết tài liệu kiểm thử và nộp báo cáo PDF trước ngày 20/10."
                  className="w-full bg-black/50 border-2 border-white/20 focus:border-aurora-purple rounded-2xl p-4 text-sm text-white placeholder-white/30 focus:outline-none transition-all shadow-inner resize-none"
                />
              </div>

              {/* Sample Templates */}
              <div className="space-y-2">
                <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-white/50 block">
                  Hoặc chọn mẫu thử nghiệm nhanh:
                </span>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.title}
                      type="button"
                      onClick={() => setPrompt(tmpl.prompt)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-aurora-purple/20 hover:border-aurora-purple text-xs text-white/80 font-medium border border-white/10 transition-all text-left"
                    >
                      {tmpl.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-heading font-bold text-white/60 hover:text-white transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!prompt.trim() || isGenerating}
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aurora-purple text-white font-heading font-black text-xs hover:bg-white hover:text-black disabled:opacity-30 transition-all shadow-[2px_2px_0px_#000]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGenerating ? 'Đang phân tích...' : 'Phân tích & Chia nhỏ ngay'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Stage 2: Review & Customization */
            <div className="space-y-4">
              {/* Task Details Header */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-white/40 block">
                    Tiêu đề nhiệm vụ:
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-aurora-purple"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {/* Course Selector */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">
                      Môn học:
                    </label>
                    <select
                      value={taskCourse}
                      onChange={(e) => setTaskCourse(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      {KNOWN_COURSES.map((c) => (
                        <option key={c} value={c} className="bg-[#10101E]">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">
                      Hạn nộp:
                    </label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/40 block mb-1">
                      Mức ưu tiên:
                    </label>
                    <div className="flex gap-1">
                      {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTaskPriority(p)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                            taskPriority === p
                              ? p === 'high'
                                ? 'bg-aurora-pink text-white'
                                : p === 'medium'
                                ? 'bg-aurora-orange text-black'
                                : 'bg-aurora-cyan text-black'
                              : 'bg-white/5 text-white/40 hover:text-white'
                          }`}
                        >
                          {p === 'high' ? 'Cao' : p === 'medium' ? 'Vừa' : 'Thấp'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary Metrics */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono">
                  <span className="text-white/60">
                    Gồm <strong className="text-aurora-lime">{enabledSteps.length}</strong> bước
                  </span>
                  <span className="text-white/60">
                    Tổng thời gian: <strong className="text-aurora-cyan">{totalMinutes}p</strong> (~{Math.ceil(totalMinutes / 25)} phiên Pomodoro)
                  </span>
                </div>
              </div>

              {/* Editable Checklist */}
              <div className="space-y-2">
                <span className="text-xs font-heading font-bold text-white/80 block">
                  Các bước thực hiện đề xuất:
                </span>

                <div className="space-y-1.5">
                  {steps.map((s, idx) => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                        s.enabled
                          ? 'bg-white/[0.04] border-white/10 text-white'
                          : 'bg-white/[0.01] border-white/5 text-white/30'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleStep(s.id)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                          s.enabled
                            ? 'bg-aurora-purple border-aurora-purple text-white'
                            : 'border-white/20'
                        }`}
                      >
                        {s.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <span className="font-mono text-[10px] text-white/40 w-4">
                        #{idx + 1}
                      </span>

                      <input
                        type="text"
                        value={s.text}
                        onChange={(e) => updateStepText(s.id, e.target.value)}
                        className="flex-1 bg-transparent text-xs text-white focus:outline-none focus:border-b focus:border-aurora-purple"
                      />

                      <span className="font-mono text-[11px] text-white/40 shrink-0">
                        {s.estimateMin}p
                      </span>

                      <button
                        type="button"
                        onClick={() => deleteStep(s.id)}
                        className="p-1 rounded text-white/30 hover:text-aurora-pink transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Custom Step */}
                <form onSubmit={addCustomStep} className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newStepText}
                    onChange={(e) => setNewStepText(e.target.value)}
                    placeholder="+ Thêm bước thực hiện tùy chỉnh..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-aurora-purple"
                  />
                  <button
                    type="submit"
                    disabled={!newStepText.trim()}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 text-xs font-bold"
                  >
                    Thêm
                  </button>
                </form>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStepStage('input')}
                  className="px-4 py-2.5 rounded-xl text-xs font-heading font-bold text-white/60 hover:text-white transition-colors"
                >
                  ← Nhập lại đề bài
                </button>

                <button
                  type="button"
                  onClick={handleCreateTask}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aurora-purple text-white font-heading font-black text-xs hover:bg-white hover:text-black transition-all shadow-[2px_2px_0px_#000]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo nhiệm vụ với các bước này</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
