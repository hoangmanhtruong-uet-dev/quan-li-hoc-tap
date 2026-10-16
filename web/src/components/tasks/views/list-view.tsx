'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { TaskItem, TaskDateGroupKey } from '@/types/tasks';
import { groupTasksByDate } from '@/lib/tasks-engine';
import { formatIsoDateOnly } from '@/lib/campus-store';
import { TaskCard } from './task-card';
import {
  ChevronDown,
  ChevronRight,
  Flame,
  Zap,
  Calendar,
  Clock,
  CheckCircle2,
  Inbox,
  RotateCcw,
} from 'lucide-react';

export interface ListViewProps {
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
  reducedMotion?: boolean;
  className?: string;
}

interface DateGroupConfig {
  key: TaskDateGroupKey;
  title: string;
  emoji: string;
  badgeColor: string;
  borderColor: string;
  bgGlow: string;
}

const GROUPS_CONFIG: DateGroupConfig[] = [
  {
    key: 'overdue',
    title: 'Quá hạn',
    emoji: '🫠',
    badgeColor: 'bg-[#FF3D6E]/15 text-[#FF3D6E] border-[#FF3D6E]/40',
    borderColor: 'border-[#FF3D6E]/40',
    bgGlow: 'hover:border-[#FF3D6E]/80',
  },
  {
    key: 'today',
    title: 'Hôm nay',
    emoji: '⚡',
    badgeColor: 'bg-aurora-lime/15 text-aurora-lime border-aurora-lime/40',
    borderColor: 'border-aurora-lime/40',
    bgGlow: 'hover:border-aurora-lime',
  },
  {
    key: 'tomorrow',
    title: 'Ngày mai',
    emoji: '📅',
    badgeColor: 'bg-aurora-cyan/15 text-aurora-cyan border-aurora-cyan/40',
    borderColor: 'border-aurora-cyan/40',
    bgGlow: 'hover:border-aurora-cyan',
  },
  {
    key: 'this_week',
    title: 'Tuần này',
    emoji: '🎯',
    badgeColor: 'bg-aurora-violet/15 text-aurora-violet border-aurora-violet/40',
    borderColor: 'border-aurora-violet/40',
    bgGlow: 'hover:border-aurora-violet',
  },
  {
    key: 'later',
    title: 'Sau đó',
    emoji: '⏳',
    badgeColor: 'bg-white/10 text-white/70 border-white/20',
    borderColor: 'border-white/20',
    bgGlow: 'hover:border-white/40',
  },
  {
    key: 'done',
    title: 'Đã xong',
    emoji: '🎉',
    badgeColor: 'bg-[#3DFFB0]/15 text-[#3DFFB0] border-[#3DFFB0]/40',
    borderColor: 'border-[#3DFFB0]/40',
    bgGlow: 'hover:border-[#3DFFB0]',
  },
];

interface ToastState {
  id: number;
  message: string;
  undoAction?: () => void;
}

export function ListView({
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
  reducedMotion = false,
  className = '',
}: ListViewProps) {
  // Collapsed state map
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    done: true, // Default collapsed for done items
  });

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Drag-and-drop state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<TaskDateGroupKey | null>(null);

  // Undo Toast state
  const [toast, setToast] = useState<ToastState | null>(null);

  const showUndoToast = useCallback((message: string, undoAction?: () => void) => {
    const id = Date.now();
    setToast({ id, message, undoAction });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 5500);
  }, []);

  // Partition tasks into sticky date groups
  const groupedTasks = useMemo(() => {
    return groupTasksByDate(tasks);
  }, [tasks]);

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, task: TaskItem) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(task.id);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverGroup(null);
  };

  // Handle Drop into Date Group
  const handleDropToGroup = (e: React.DragEvent, targetGroup: TaskDateGroupKey) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDragOverGroup(null);
    setDraggingTaskId(null);

    if (!taskId || !onUpdateTask) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const previousDueAt = task.dueAt;
    const previousStatus = task.status;

    const now = new Date();
    let newDueAt = previousDueAt;
    let newStatus = previousStatus;

    if (targetGroup === 'done') {
      if (onCompleteTask) {
        onCompleteTask(taskId);
      } else {
        onUpdateTask(taskId, { status: 'done', completedAt: new Date().toISOString() });
      }
      showUndoToast(`Đã chuyển "${task.title}" sang Đã xong 🎉`, () => {
        onUpdateTask(taskId, { status: previousStatus, completedAt: undefined });
      });
      return;
    }

    if (targetGroup === 'today') {
      newDueAt = `${formatIsoDateOnly(now, 0)}T23:59:00`;
      newStatus = 'todo';
    } else if (targetGroup === 'tomorrow') {
      newDueAt = `${formatIsoDateOnly(now, 1)}T23:59:00`;
      newStatus = 'todo';
    } else if (targetGroup === 'this_week') {
      const dayOfWeek = now.getDay();
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      newDueAt = `${formatIsoDateOnly(now, daysUntilSunday)}T23:59:00`;
      newStatus = 'todo';
    } else if (targetGroup === 'later') {
      newDueAt = `${formatIsoDateOnly(now, 14)}T23:59:00`;
      newStatus = 'todo';
    } else if (targetGroup === 'overdue') {
      newDueAt = `${formatIsoDateOnly(now, -1)}T23:59:00`;
      newStatus = 'todo';
    }

    if (newDueAt !== previousDueAt || newStatus !== previousStatus) {
      onUpdateTask(taskId, { dueAt: newDueAt, status: newStatus });
      const groupName = GROUPS_CONFIG.find((g) => g.key === targetGroup)?.title || targetGroup;
      showUndoToast(`Đã chuyển "${task.title}" sang ${groupName}`, () => {
        onUpdateTask(taskId, { dueAt: previousDueAt, status: previousStatus });
      });
    }
  };

  const hasAnyTasks = tasks.length > 0;

  if (!hasAnyTasks) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-[24px] bg-[#0D0E17]/60 border border-white/10 w-full min-w-0">
        <Inbox className="w-12 h-12 text-white/30 mb-3" />
        <h3 className="font-heading font-bold text-lg text-white">
          Không tìm thấy nhiệm vụ nào!
        </h3>
        <p className="text-xs sm:text-sm text-white/50 max-w-sm mt-1">
          Thử tìm từ khoá khác, bỏ bộ lọc, hoặc bấm nút tạo nhiệm vụ mới nhé bro.
        </p>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Danh sách nhiệm vụ theo ngày"
      className={`w-full min-w-0 max-w-full flex flex-col gap-6 overflow-x-hidden ${className}`}
    >
      {/* Toast Notification Container */}
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

      {/* Render 6 Sticky Date Groups */}
      {GROUPS_CONFIG.map((group) => {
        const groupItems = groupedTasks[group.key] || [];
        const isCollapsed = Boolean(collapsedGroups[group.key]);
        const isDragOver = dragOverGroup === group.key;

        // Skip overdue and done groups if they have 0 items to reduce clutter
        if ((group.key === 'overdue' || group.key === 'done') && groupItems.length === 0) {
          return null;
        }

        return (
          <section
            key={group.key}
            aria-label={`Nhóm ${group.title}`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverGroup !== group.key) {
                setDragOverGroup(group.key);
              }
            }}
            onDragLeave={() => {
              if (dragOverGroup === group.key) {
                setDragOverGroup(null);
              }
            }}
            onDrop={(e) => handleDropToGroup(e, group.key)}
            className={`w-full min-w-0 max-w-full flex flex-col rounded-[22px] transition-all duration-200 ${
              isDragOver
                ? 'ring-2 ring-aurora-lime border-2 border-dashed border-aurora-lime bg-aurora-lime/5 p-2'
                : ''
            }`}
          >
            {/* Sticky Group Header */}
            <header
              onClick={() => toggleGroupCollapse(group.key)}
              className={`sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#0A0A12]/92 border border-white/10 backdrop-blur-md shadow-[3px_3px_0px_#000] cursor-pointer hover:border-white/20 select-none transition-colors mb-3`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base sm:text-lg select-none">{group.emoji}</span>
                <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-white truncate">
                  {group.title}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-mono font-bold border shadow-[1px_1px_0px_#000] ${group.badgeColor}`}
                >
                  {groupItems.length}
                </span>
              </div>

              <button
                type="button"
                className="p-1 rounded-lg text-white/50 hover:text-white transition-colors"
                title={isCollapsed ? 'Mở rộng nhóm' : 'Thu gọn nhóm'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </header>

            {/* Group Cards Container */}
            {!isCollapsed && (
              <div className="w-full min-w-0 max-w-full flex flex-col gap-3">
                {groupItems.length === 0 ? (
                  <div className="flex items-center justify-center p-6 rounded-2xl border border-dashed border-white/10 text-white/40 text-xs text-center">
                    Kéo thả nhiệm vụ vào đây để chuyển sang {group.title.toLowerCase()}
                  </div>
                ) : (
                  groupItems.map((task) => (
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
            )}
          </section>
        );
      })}
    </div>
  );
}
