'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { TaskItem, EisenhowerQuadrant } from '@/types/tasks';
import { computeEisenhowerQuadrant } from '@/lib/tasks-engine';
import { TaskCard } from './task-card';
import {
  Flame,
  Calendar,
  Zap,
  Trash2,
  Sparkles,
  RotateCcw,
  Info,
} from 'lucide-react';

export interface MatrixViewProps {
  tasks: TaskItem[];
  selectedTaskId?: string | null;
  onSelectTask?: (taskId: string) => void;
  selectedTaskIds?: string[];
  onToggleMultiSelect?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onUpdateTask?: (taskId: string, patch: Partial<TaskItem>) => void;
  onReorderTasks?: (taskId: string, targetQuadrant: EisenhowerQuadrant) => void;
  onFocusTask?: (task: TaskItem) => void;
  onRescheduleTask?: (taskId: string, daysToAdd: number) => void;
  onDeleteTask?: (taskId: string) => void;
  reducedMotion?: boolean;
  className?: string;
}

interface QuadrantConfig {
  id: EisenhowerQuadrant;
  number: string;
  title: string;
  subtitle: string;
  colorHex: string;
  badgeStyle: string;
  containerClass: string;
  icon: React.ElementType;
}

const QUADRANTS: QuadrantConfig[] = [
  {
    id: 'do_first',
    number: 'Q1',
    title: 'LÀM NGAY',
    subtitle: 'Khẩn cấp & Quan trọng · Làm ngay kẻo toang!',
    colorHex: '#FF3D6E',
    badgeStyle: 'bg-[#FF3D6E]/20 text-[#FF3D6E] border-[#FF3D6E]',
    containerClass:
      'border-2 border-[#FF3D6E] shadow-[0_0_20px_rgba(255,61,110,0.22)] bg-[#170E14]/80',
    icon: Flame,
  },
  {
    id: 'schedule',
    number: 'Q2',
    title: 'LÊN LỊCH',
    subtitle: 'Quan trọng, Chưa gấp · Đầu tư để bứt phá!',
    colorHex: '#8B6CFF',
    badgeStyle: 'bg-[#8B6CFF]/20 text-[#8B6CFF] border-[#8B6CFF]',
    containerClass:
      'border-2 border-[#8B6CFF]/60 shadow-[0_0_15px_rgba(139,108,255,0.15)] bg-[#12101F]/80',
    icon: Calendar,
  },
  {
    id: 'delegate',
    number: 'Q3',
    title: 'GIAO / DỜI',
    subtitle: 'Gấp, Ít quan trọng · Giải quyết lẹ hoặc dời lại!',
    colorHex: '#FFB020',
    badgeStyle: 'bg-[#FFB020]/20 text-[#FFB020] border-[#FFB020]',
    containerClass:
      'border-2 border-[#FFB020]/60 shadow-[0_0_15px_rgba(255,176,32,0.12)] bg-[#18130B]/80',
    icon: Zap,
  },
  {
    id: 'eliminate',
    number: 'Q4',
    title: 'BỎ BỚT',
    subtitle: 'Không gấp & Không quan trọng · Lược bớt nếu quá tải!',
    colorHex: '#7A8AA8',
    badgeStyle: 'bg-[#7A8AA8]/20 text-[#7A8AA8] border-[#7A8AA8]',
    containerClass:
      'border-2 border-[#7A8AA8]/40 shadow-[2px_2px_0px_#000] bg-[#0E1118]/80',
    icon: Trash2,
  },
];

interface ToastState {
  id: number;
  message: string;
  undoAction?: () => void;
}

export function MatrixView({
  tasks,
  selectedTaskId,
  onSelectTask,
  selectedTaskIds = [],
  onToggleMultiSelect,
  onCompleteTask,
  onUpdateTask,
  onReorderTasks,
  onFocusTask,
  onRescheduleTask,
  onDeleteTask,
  reducedMotion = false,
  className = '',
}: MatrixViewProps) {
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverQuadrant, setDragOverQuadrant] = useState<EisenhowerQuadrant | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showUndoToast = useCallback((message: string, undoAction?: () => void) => {
    const id = Date.now();
    setToast({ id, message, undoAction });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 5500);
  }, []);

  // Classify each task into quadrant (using explicit task.quadrant or AI heuristic)
  const quadrantMap = useMemo(() => {
    const map: Record<EisenhowerQuadrant, TaskItem[]> = {
      do_first: [],
      schedule: [],
      delegate: [],
      eliminate: [],
    };

    const refDate = new Date();
    for (const task of tasks) {
      if (task.status === 'done') continue; // Only uncompleted tasks in active matrix
      const quad = task.quadrant || computeEisenhowerQuadrant(task, refDate);
      if (map[quad]) {
        map[quad].push(task);
      } else {
        map.do_first.push(task);
      }
    }

    return map;
  }, [tasks]);

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, task: TaskItem) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(task.id);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverQuadrant(null);
  };

  const handleDropToQuadrant = (e: React.DragEvent, targetQuadrant: EisenhowerQuadrant) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDragOverQuadrant(null);
    setDraggingTaskId(null);

    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const previousQuadrant = task.quadrant || computeEisenhowerQuadrant(task);
    if (previousQuadrant === targetQuadrant) return;

    if (onReorderTasks) {
      onReorderTasks(taskId, targetQuadrant);
    } else if (onUpdateTask) {
      onUpdateTask(taskId, { quadrant: targetQuadrant });
    }

    const targetConfig = QUADRANTS.find((q) => q.id === targetQuadrant);
    showUndoToast(`Đã chuyển "${task.title}" sang ${targetConfig?.title || targetQuadrant}`, () => {
      if (onReorderTasks) {
        onReorderTasks(taskId, previousQuadrant);
      } else if (onUpdateTask) {
        onUpdateTask(taskId, { quadrant: previousQuadrant });
      }
    });
  };

  return (
    <div
      role="region"
      aria-label="Ma trận Eisenhower 2x2"
      className={`w-full min-w-0 max-w-full flex flex-col gap-4 overflow-x-hidden ${className}`}
    >
      {/* Toast Notification */}
      {toast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-20 right-6 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#141423] border-2 border-aurora-lime text-white text-xs sm:text-sm font-semibold shadow-[6px_6px_0px_#000] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3"
        >
          <span>{toast.message}</span>
          {toast.undoAction && (
            <button
              type="button"
              onClick={() => {
                toast.undoAction?.();
                setToast(null);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-aurora-lime text-black font-black text-xs hover:bg-white transition-colors shadow-[2px_2px_0px_#000]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Hoàn tác</span>
            </button>
          )}
        </aside>
      )}

      {/* Eisenhower 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0 max-w-full">
        {QUADRANTS.map((quad) => {
          const quadTasks = quadrantMap[quad.id] || [];
          const isDragOver = dragOverQuadrant === quad.id;
          const Icon = quad.icon;

          return (
            <div
              key={quad.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverQuadrant !== quad.id) {
                  setDragOverQuadrant(quad.id);
                }
              }}
              onDragLeave={() => {
                if (dragOverQuadrant === quad.id) {
                  setDragOverQuadrant(null);
                }
              }}
              onDrop={(e) => handleDropToQuadrant(e, quad.id)}
              className={`flex flex-col rounded-[24px] p-4 transition-all duration-200 min-w-0 max-w-full min-h-[300px] ${
                quad.containerClass
              } ${isDragOver ? 'ring-2 ring-aurora-lime border-aurora-lime bg-aurora-lime/5' : ''}`}
            >
              {/* Quadrant Header Banner */}
              <div className="flex items-start justify-between gap-2 mb-3 pb-3 border-b border-white/10">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border-2 font-heading font-black text-xs sm:text-sm uppercase tracking-wider shadow-[2px_2px_0px_#000] ${quad.badgeStyle}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>
                      {quad.number}: {quad.title}
                    </span>
                  </div>
                  <span className="self-center px-2 py-0.5 rounded-full bg-black/40 text-[11px] font-mono font-bold text-white/80 border border-white/10">
                    {quadTasks.length} việc
                  </span>
                </div>

                <div
                  className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-white/40"
                  title="Kéo thả thẻ nhiệm vụ để đổi ô phân loại"
                >
                  <Sparkles className="w-3 h-3 text-aurora-lime" />
                  <span>AI xếp</span>
                </div>
              </div>

              {/* Subtitle / Gen Z Tip */}
              <p className="text-xs text-white/50 mb-3.5 line-clamp-1">
                {quad.subtitle}
              </p>

              {/* Cards in Quadrant */}
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                {quadTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-white/10 text-white/40 text-xs text-center flex-1">
                    <span>Không có nhiệm vụ nào trong ô {quad.title}</span>
                  </div>
                ) : (
                  quadTasks.map((task) => (
                    <div key={task.id} className="relative group/quadcard">
                      <TaskCard
                        task={task}
                        isSelected={selectedTaskId === task.id}
                        isMultiSelected={selectedTaskIds.includes(task.id)}
                        onSelect={onSelectTask}
                        onToggleMultiSelect={onToggleMultiSelect}
                        onComplete={onCompleteTask}
                        onFocus={onFocusTask}
                        onReschedule={onRescheduleTask}
                        onDelete={onDeleteTask}
                        draggable={true}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        reducedMotion={reducedMotion}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
