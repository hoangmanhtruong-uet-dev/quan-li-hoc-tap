'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { TaskItem, TaskStatus } from '@/types/tasks';
import { TaskCard } from './task-card';
import {
  AlertTriangle,
  RotateCcw,
  Plus,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface KanbanViewProps {
  tasks: TaskItem[];
  selectedTaskId?: string | null;
  onSelectTask?: (taskId: string) => void;
  selectedTaskIds?: string[];
  onToggleMultiSelect?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onUpdateTask?: (taskId: string, patch: Partial<TaskItem>) => void;
  onFocusTask?: (task: TaskItem) => void;
  onRescheduleTask?: (taskId: string, daysToAdd: number) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddTask?: (status: TaskStatus) => void;
  reducedMotion?: boolean;
  className?: string;
}

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  emoji: string;
  colorHex: string;
  badgeStyle: string;
  headerBorder: string;
  tiltClass: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'todo',
    title: 'Cần làm',
    emoji: '📝',
    colorHex: '#7A8AA8',
    badgeStyle: 'bg-[#7A8AA8]/15 text-[#7A8AA8] border-[#7A8AA8]/40',
    headerBorder: 'border-[#7A8AA8]/40',
    tiltClass: '-rotate-1',
  },
  {
    id: 'doing',
    title: 'Đang làm',
    emoji: '⚡',
    colorHex: '#8B6CFF',
    badgeStyle: 'bg-[#8B6CFF]/15 text-[#8B6CFF] border-[#8B6CFF]/40 shadow-[0_0_10px_rgba(139,108,255,0.3)]',
    headerBorder: 'border-[#8B6CFF]/50',
    tiltClass: 'rotate-1',
  },
  {
    id: 'done',
    title: 'Hoàn thành',
    emoji: '🎯',
    colorHex: '#3DFFB0',
    badgeStyle: 'bg-[#3DFFB0]/15 text-[#3DFFB0] border-[#3DFFB0]/40 shadow-[0_0_10px_rgba(61,255,176,0.3)]',
    headerBorder: 'border-[#3DFFB0]/40',
    tiltClass: '-rotate-1',
  },
];

interface ToastState {
  id: number;
  message: string;
  undoAction?: () => void;
}

export function KanbanView({
  tasks,
  selectedTaskId,
  onSelectTask,
  selectedTaskIds = [],
  onToggleMultiSelect,
  onCompleteTask,
  onUpdateTask,
  onFocusTask,
  onRescheduleTask,
  onDeleteTask,
  onAddTask,
  reducedMotion = false,
  className = '',
}: KanbanViewProps) {
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showUndoToast = useCallback((message: string, undoAction?: () => void) => {
    const id = Date.now();
    setToast({ id, message, undoAction });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 5500);
  }, []);

  // Filter tasks into columns
  const columnsData = useMemo(() => {
    return {
      todo: tasks.filter((t) => t.status === 'todo'),
      doing: tasks.filter((t) => t.status === 'doing'),
      done: tasks.filter((t) => t.status === 'done'),
    };
  }, [tasks]);

  const doingCount = columnsData.doing.length;
  const isWipExceeded = doingCount > 3;

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, task: TaskItem) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(task.id);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumn: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDragOverColumn(null);
    setDraggingTaskId(null);

    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetColumn) return;

    const previousStatus = task.status;

    if (targetColumn === 'done') {
      if (onCompleteTask) {
        onCompleteTask(taskId);
      } else if (onUpdateTask) {
        onUpdateTask(taskId, { status: 'done', completedAt: new Date().toISOString() });
      }
      showUndoToast(`Đã hoàn thành "${task.title}" (+20 XP)! 🎉`, () => {
        onUpdateTask?.(taskId, { status: previousStatus, completedAt: undefined });
      });
      return;
    }

    if (onUpdateTask) {
      onUpdateTask(taskId, { status: targetColumn, completedAt: undefined });
      const targetColName = COLUMNS.find((c) => c.id === targetColumn)?.title || targetColumn;
      showUndoToast(`Đã chuyển "${task.title}" sang ${targetColName}`, () => {
        onUpdateTask(taskId, { status: previousStatus });
      });
    }
  };

  return (
    <div
      role="region"
      aria-label="Bảng Kanban nhiệm vụ"
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

      {/* 3-Column Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full min-w-0 max-w-full">
        {COLUMNS.map((col) => {
          const colItems = columnsData[col.id] || [];
          const isDragOver = dragOverColumn === col.id;
          const showWipWarning = col.id === 'doing' && isWipExceeded;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverColumn !== col.id) {
                  setDragOverColumn(col.id);
                }
              }}
              onDragLeave={() => {
                if (dragOverColumn === col.id) {
                  setDragOverColumn(null);
                }
              }}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-[24px] bg-[#0D0E17]/85 border-2 ${col.headerBorder} p-3.5 sm:p-4 shadow-[4px_4px_0px_#000] transition-all duration-200 min-w-0 max-w-full ${
                isDragOver ? 'ring-2 ring-aurora-lime border-aurora-lime bg-aurora-lime/5' : ''
              }`}
            >
              {/* Tilted Sticker Column Header */}
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/5">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 ${col.badgeStyle} shadow-[2px_2px_0px_#000] transition-transform ${
                    reducedMotion ? '' : col.tiltClass
                  }`}
                >
                  <span className="text-sm select-none">{col.emoji}</span>
                  <span className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider">
                    {col.title}
                  </span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/40 text-[11px] font-mono font-bold">
                    {colItems.length}
                  </span>
                </div>

                {onAddTask && col.id !== 'done' && (
                  <button
                    type="button"
                    onClick={() => onAddTask(col.id)}
                    className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    title={`Thêm nhiệm vụ vào ${col.title}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Soft WIP Limit Warning Sticker */}
              {showWipWarning && (
                <div
                  role="alert"
                  className="mb-3 p-2.5 rounded-xl bg-[#FFB020]/15 border-2 border-[#FFB020] text-[#FFB020] text-xs font-bold shadow-[3px_3px_0px_#000] flex items-start gap-2 animate-pulse"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    ⚠️ Đang ôm quá nhiều việc ({doingCount} &gt; 3)! Tập trung giải quyết bớt đi bro.
                  </span>
                </div>
              )}

              {/* Column Cards Container */}
              <div className="flex flex-col gap-3 min-h-[220px] flex-1">
                {colItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-white/10 text-white/40 text-xs text-center flex-1">
                    <span>Kéo thẻ nhiệm vụ vào đây để chuyển sang {col.title}</span>
                  </div>
                ) : (
                  colItems.map((task) => (
                    <TaskCard
                      key={task.id}
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
