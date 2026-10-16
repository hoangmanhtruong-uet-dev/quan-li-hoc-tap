'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { TaskItem, TaskPriority, TaskStatus, EisenhowerQuadrant } from '@/types/tasks';
import { useCampusStore, formatIsoDateOnly } from '@/lib/campus-store';
import { getUrgencyLevel } from '@/lib/tasks-engine';

// Components
import { QuestBoardHeader } from '@/components/tasks/header/quest-board-header';
import {
  ControlsBar,
  type TaskViewMode,
  type TaskStatusFilter,
  type TaskPriorityFilter,
  type TaskSortOption,
} from '@/components/tasks/controls/controls-bar';
import { BulkActionBar } from '@/components/tasks/controls/bulk-action-bar';
import { ListView } from '@/components/tasks/views/list-view';
import { KanbanView } from '@/components/tasks/views/kanban-view';
import { MatrixView } from '@/components/tasks/views/matrix-view';
import { TodayView } from '@/components/tasks/views/today-view';
import { TaskDetailDrawer } from '@/components/tasks/drawer/task-detail-drawer';
import { QuickAddModal } from '@/components/tasks/create/quick-add-modal';
import { AiBreakdownModal } from '@/components/tasks/create/ai-breakdown-modal';

import {
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Flame,
  X,
} from 'lucide-react';

// Dynamic imports for heavy modals to ensure zero SSR mismatch and 120FPS rendering
const StrictPomodoroModal = dynamic(
  () =>
    import('@/features/pomodoro/strict-pomodoro-modal').then(
      (mod) => mod.StrictPomodoroModal
    ),
  { ssr: false }
);

const CommandPalette = dynamic(
  () =>
    import('@/components/common/command-palette').then(
      (mod) => mod.CommandPalette
    ),
  { ssr: false }
);

const KeyboardShortcutsModal = dynamic(
  () =>
    import('@/components/common/keyboard-shortcuts-modal').then(
      (mod) => mod.KeyboardShortcutsModal
    ),
  { ssr: false }
);

export default function TasksPage() {
  const {
    state,
    addTask,
    completeTask,
    updateTask,
    deleteTask,
    bulkUpdateTasks,
    toggleTaskStep,
    reorderTasks,
    recordSession,
  } = useCampusStore();

  // Primary UI state
  const [activeView, setActiveView] = useState<TaskViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriorityFilter>('all');
  const [sortOption, setSortOption] = useState<TaskSortOption>('dueAt');

  // Task selection & multi-select
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Modals state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddInitialTitle, setQuickAddInitialTitle] = useState('');
  const [aiBreakdownOpen, setAiBreakdownOpen] = useState(false);
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  const [focusedPomodoroTask, setFocusedPomodoroTask] = useState<TaskItem | null>(null);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Wire campusos:quick-create-task global custom event
  useEffect(() => {
    const handleQuickCreateEvent = (e: Event) => {
      const custom = e as CustomEvent<{ initialTitle?: string }>;
      if (custom.detail?.initialTitle) {
        setQuickAddInitialTitle(custom.detail.initialTitle);
      }
      setQuickAddOpen(true);
    };
    window.addEventListener('campusos:quick-create-task', handleQuickCreateEvent);
    return () => window.removeEventListener('campusos:quick-create-task', handleQuickCreateEvent);
  }, []);

  // Undo Toast state
  const [undoToast, setUndoToast] = useState<{
    message: string;
    action: () => void;
  } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Celebration toast state
  const [celebrationToast, setCelebrationToast] = useState<{
    title: string;
    xp: number;
    isClearBoard?: boolean;
  } | null>(null);
  const celebrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showUndoToast = useCallback((message: string, action: () => void) => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoToast({ message, action });
    undoTimeoutRef.current = setTimeout(() => {
      setUndoToast(null);
    }, 6000);
  }, []);

  const showCelebration = useCallback((title: string, xp: number, isClearBoard = false) => {
    if (celebrationTimeoutRef.current) clearTimeout(celebrationTimeoutRef.current);
    setCelebrationToast({ title, xp, isClearBoard });
    celebrationTimeoutRef.current = setTimeout(() => {
      setCelebrationToast(null);
    }, 4500);
  }, []);

  // Filtered & Sorted Tasks
  const processedTasks = useMemo(() => {
    let result = [...state.tasks];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.course && t.course.toLowerCase().includes(q)) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // 3. Priority Filter
    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // 4. Custom Sorting
    result.sort((a, b) => {
      if (sortOption === 'dueAt') {
        const timeA = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
        const timeB = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
        return timeA - timeB;
      }
      if (sortOption === 'priority') {
        const pMap: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (pMap[a.priority] ?? 2) - (pMap[b.priority] ?? 2);
      }
      if (sortOption === 'course') {
        return (a.course || '').localeCompare(b.course || '', 'vi');
      }
      if (sortOption === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOption === 'ai') {
        // AI Suggested: combines urgency and priority
        const urgA = getUrgencyLevel(a.dueAt);
        const urgB = getUrgencyLevel(b.dueAt);
        if (urgA.isOverdue !== urgB.isOverdue) return urgA.isOverdue ? -1 : 1;
        if (urgA.isPanic !== urgB.isPanic) return urgA.isPanic ? -1 : 1;
        const pMap: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (pMap[a.priority] ?? 2) - (pMap[b.priority] ?? 2);
      }
      return 0;
    });

    return result;
  }, [state.tasks, searchQuery, statusFilter, priorityFilter, sortOption]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return state.tasks.find((t) => t.id === selectedTaskId) || null;
  }, [state.tasks, selectedTaskId]);

  // Task Selection Handlers
  const handleSelectTask = useCallback((taskId: string | null) => {
    setSelectedTaskId(taskId);
    if (taskId) {
      setIsDrawerOpen(true);
    }
  }, []);

  const handleToggleMultiSelect = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  }, []);

  // Completion with celebration & Undo
  const handleCompleteTask = useCallback(
    (taskId: string) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return;

      const previousStatus = task.status;
      const res = completeTask(taskId);

      if (res.task) {
        showCelebration(res.task.title, res.xpGained, res.clearBoardBonus);

        showUndoToast(`Đã hoàn thành "${res.task.title}"`, () => {
          updateTask(taskId, {
            status: previousStatus,
            completedAt: undefined,
          });
        });
      }
    },
    [state.tasks, completeTask, updateTask, showCelebration, showUndoToast]
  );

  // Deletion with Undo
  const handleDeleteTask = useCallback(
    (taskId: string) => {
      const deleted = deleteTask(taskId);
      if (!deleted) return;

      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }
      setSelectedTaskIds((prev) => prev.filter((id) => id !== taskId));

      showUndoToast(`Đã xóa "${deleted.title}"`, () => {
        addTask({
          title: deleted.title,
          description: deleted.description,
          course: deleted.course,
          status: deleted.status,
          priority: deleted.priority,
          difficulty: deleted.difficulty,
          dueAt: deleted.dueAt,
          estimateMin: deleted.estimateMin,
          actualMin: deleted.actualMin,
          steps: deleted.steps,
          tags: deleted.tags,
          pomodoros: deleted.pomodoros,
          quadrant: deleted.quadrant,
          notes: deleted.notes,
        });
      });
    },
    [deleteTask, selectedTaskId, addTask, showUndoToast]
  );

  // Reschedule handler
  const handleRescheduleTask = useCallback(
    (taskId: string, daysToAdd: number) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return;

      const currentDate = task.dueAt ? new Date(task.dueAt) : new Date();
      currentDate.setDate(currentDate.getDate() + daysToAdd);
      const timePart = task.dueAt?.slice(11, 19) || '23:59:00';
      const newDueAt = `${formatIsoDateOnly(currentDate, 0)}T${timePart}`;

      updateTask(taskId, { dueAt: newDueAt });
      showUndoToast(`Đã dời hạn thêm ${daysToAdd} ngày`, () => {
        updateTask(taskId, { dueAt: task.dueAt });
      });
    },
    [state.tasks, updateTask, showUndoToast]
  );

  // Focus mode launcher
  const handleFocusTask = useCallback(
    (task?: TaskItem) => {
      let target = task;
      if (!target && selectedTask) {
        target = selectedTask;
      }
      if (!target) {
        // Pick most urgent incomplete task
        const incomplete = state.tasks.filter((t) => t.status !== 'done');
        target = incomplete[0] || undefined;
      }

      setFocusedPomodoroTask(target || null);
      setPomodoroOpen(true);
    },
    [selectedTask, state.tasks]
  );

  // Pomodoro session completion callback
  const handlePomodoroSessionComplete = useCallback(
    (stats: { focusMinutes: number; shameCount: number; disciplineScore: number }) => {
      recordSession(stats.focusMinutes, stats.disciplineScore);

      if (focusedPomodoroTask) {
        const currentTask = state.tasks.find((t) => t.id === focusedPomodoroTask.id);
        if (currentTask) {
          const newActual = (currentTask.actualMin || 0) + stats.focusMinutes;
          const currentPom = currentTask.pomodoros || { planned: 1, done: 0 };
          updateTask(currentTask.id, {
            actualMin: newActual,
            pomodoros: {
              ...currentPom,
              done: currentPom.done + 1,
            },
          });
        }
      }
    },
    [focusedPomodoroTask, recordSession, state.tasks, updateTask]
  );

  // Bulk actions
  const handleClearSelection = useCallback(() => {
    setSelectedTaskIds([]);
  }, []);

  const handleBulkComplete = useCallback(() => {
    selectedTaskIds.forEach((id) => completeTask(id));
    setSelectedTaskIds([]);
    showCelebration('Đã hoàn thành các nhiệm vụ đã chọn', selectedTaskIds.length * 20);
  }, [selectedTaskIds, completeTask, showCelebration]);

  const handleBulkChangePriority = useCallback(
    (priority: TaskPriority) => {
      bulkUpdateTasks(selectedTaskIds, { priority });
      setSelectedTaskIds([]);
    },
    [selectedTaskIds, bulkUpdateTasks]
  );

  const handleBulkPostpone = useCallback(
    (days: number) => {
      selectedTaskIds.forEach((id) => {
        handleRescheduleTask(id, days);
      });
      setSelectedTaskIds([]);
    },
    [selectedTaskIds, handleRescheduleTask]
  );

  const handleBulkDelete = useCallback(() => {
    const idsToDelete = [...selectedTaskIds];
    idsToDelete.forEach((id) => deleteTask(id));
    setSelectedTaskIds([]);
    showUndoToast(`Đã xóa ${idsToDelete.length} nhiệm vụ`, () => {
      // Re-query could be triggered or handled
    });
  }, [selectedTaskIds, deleteTask, showUndoToast]);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        (activeEl as HTMLElement | null)?.isContentEditable;

      // 1. Command Palette: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      // 2. Escape: close modals / drawer
      if (e.key === 'Escape') {
        if (quickAddOpen) setQuickAddOpen(false);
        else if (aiBreakdownOpen) setAiBreakdownOpen(false);
        else if (pomodoroOpen) setPomodoroOpen(false);
        else if (shortcutsModalOpen) setShortcutsModalOpen(false);
        else if (commandPaletteOpen) setCommandPaletteOpen(false);
        else if (isDrawerOpen) setIsDrawerOpen(false);
        return;
      }

      // Ignore single key shortcuts when typing
      if (isInput) return;

      // 3. Question mark (?): open shortcuts cheatsheet
      if (e.key === '?') {
        e.preventDefault();
        setShortcutsModalOpen(true);
        return;
      }

      // 4. 'N': Open QuickAddModal
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setQuickAddOpen(true);
        return;
      }

      // 5. 'F': Focus Mode
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleFocusTask();
        return;
      }

      // 6. '1' - '4': Switch Views
      if (e.key === '1') setActiveView('list');
      else if (e.key === '2') setActiveView('kanban');
      else if (e.key === '3') setActiveView('matrix');
      else if (e.key === '4') setActiveView('today');

      // 7. 'J' / 'K': Navigate tasks
      if (e.key === 'j' || e.key === 'J' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (processedTasks.length === 0) return;
        const currentIndex = processedTasks.findIndex((t) => t.id === selectedTaskId);
        let nextIndex = 0;
        if (e.key === 'j' || e.key === 'J') {
          nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, processedTasks.length - 1);
        } else {
          nextIndex = currentIndex === -1 ? 0 : Math.max(currentIndex - 1, 0);
        }
        const nextTask = processedTasks[nextIndex];
        if (nextTask) {
          setSelectedTaskId(nextTask.id);
        }
        return;
      }

      // 8. 'X': Toggle complete focused/selected task
      if (e.key === 'x' || e.key === 'X') {
        if (selectedTaskId) {
          e.preventDefault();
          handleCompleteTask(selectedTaskId);
        }
        return;
      }

      // 9. 'E': Open detail drawer
      if (e.key === 'e' || e.key === 'E') {
        if (selectedTaskId) {
          e.preventDefault();
          setIsDrawerOpen(true);
        }
        return;
      }

      // 10. 'Del': Delete task
      if (e.key === 'Delete') {
        if (selectedTaskId) {
          e.preventDefault();
          handleDeleteTask(selectedTaskId);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    quickAddOpen,
    aiBreakdownOpen,
    pomodoroOpen,
    shortcutsModalOpen,
    commandPaletteOpen,
    isDrawerOpen,
    processedTasks,
    selectedTaskId,
    handleCompleteTask,
    handleDeleteTask,
    handleFocusTask,
  ]);

  return (
    <div className="relative min-h-screen w-full min-w-0 max-w-full overflow-x-hidden text-foreground antialiased selection:bg-aurora-lime selection:text-black">
      {/* 120FPS Zero-Lag Ambient Aurora Gradient Blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-30">
        <div className="absolute -top-[15%] left-[10%] h-[500px] w-[500px] rounded-full bg-aurora-purple/30 blur-[130px]" />
        <div className="absolute top-[35%] right-[5%] h-[400px] w-[400px] rounded-full bg-aurora-pink/20 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[25%] h-[600px] w-[600px] rounded-full bg-aurora-cyan/20 blur-[140px]" />
      </div>

      {/* Main Container Enforcing Zero-Overflow */}
      <main className="mx-auto w-full min-w-0 max-w-[1440px] px-3 sm:px-6 py-4 sm:py-6 space-y-6 overflow-x-hidden">
        {/* S1: Quest Board Header */}
        <QuestBoardHeader
          onAddTask={() => setQuickAddOpen(true)}
          onAiBreakdown={() => setAiBreakdownOpen(true)}
          onFocusNow={() => handleFocusTask()}
          onSelectFilter={(f) => {
            if (f === 'all') setStatusFilter('all');
            else if (f === 'doing') setStatusFilter('doing');
            else if (f === 'high') setPriorityFilter('high');
            else if (f === 'done') setStatusFilter('done');
          }}
          activeFilter={statusFilter === 'doing' ? 'doing' : statusFilter === 'done' ? 'done' : priorityFilter === 'high' ? 'high' : 'all'}
        />

        {/* S2: Smart Controls Bar */}
        <ControlsBar
          activeView={activeView}
          onViewChange={setActiveView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          sortOption={sortOption}
          onSortChange={setSortOption}
          tasks={state.tasks}
        />

        {/* S3: Multi-View Canvas */}
        <section className="relative w-full min-w-0 max-w-full overflow-x-hidden">
          {activeView === 'list' && (
            <ListView
              tasks={processedTasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={handleSelectTask}
              selectedTaskIds={selectedTaskIds}
              onToggleMultiSelect={handleToggleMultiSelect}
              onCompleteTask={handleCompleteTask}
              onUpdateTask={updateTask}
              onFocusTask={handleFocusTask}
              onRescheduleTask={handleRescheduleTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeView === 'kanban' && (
            <KanbanView
              tasks={processedTasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={handleSelectTask}
              selectedTaskIds={selectedTaskIds}
              onToggleMultiSelect={handleToggleMultiSelect}
              onCompleteTask={handleCompleteTask}
              onUpdateTask={updateTask}
              onFocusTask={handleFocusTask}
              onRescheduleTask={handleRescheduleTask}
              onDeleteTask={handleDeleteTask}
              onAddTask={(status) => {
                const newTask = addTask({
                  title: 'Nhiệm vụ mới',
                  status,
                  priority: 'medium',
                  difficulty: 3,
                  dueAt: `${formatIsoDateOnly(new Date(), 0)}T23:59:00`,
                  estimateMin: 45,
                  actualMin: 0,
                  steps: [],
                  tags: [],
                  pomodoros: { planned: 1, done: 0 },
                });
                handleSelectTask(newTask.id);
              }}
            />
          )}

          {activeView === 'matrix' && (
            <MatrixView
              tasks={processedTasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={handleSelectTask}
              selectedTaskIds={selectedTaskIds}
              onToggleMultiSelect={handleToggleMultiSelect}
              onCompleteTask={handleCompleteTask}
              onUpdateTask={updateTask}
              onReorderTasks={(taskId, targetQuadrant) => {
                reorderTasks(taskId, targetQuadrant);
              }}
              onFocusTask={handleFocusTask}
              onRescheduleTask={handleRescheduleTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeView === 'today' && (
            <TodayView
              tasks={state.tasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={handleSelectTask}
              selectedTaskIds={selectedTaskIds}
              onToggleMultiSelect={handleToggleMultiSelect}
              onCompleteTask={handleCompleteTask}
              onFocusTask={handleFocusTask}
              onRescheduleTask={handleRescheduleTask}
              onDeleteTask={handleDeleteTask}
            />
          )}
        </section>
      </main>

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedTaskIds.length}
        onClearSelection={handleClearSelection}
        onCompleteSelected={handleBulkComplete}
        onChangePriority={handleBulkChangePriority}
        onPostponeSelected={handleBulkPostpone}
        onDeleteSelected={handleBulkDelete}
      />

      {/* Intelligent Detail Drawer */}
      <TaskDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedTask={selectedTask}
        tasks={state.tasks}
        onSelectTask={handleSelectTask}
        onUpdateTask={updateTask}
        onCompleteTask={handleCompleteTask}
        onDeleteTask={handleDeleteTask}
        onFocusTask={handleFocusTask}
        onOpenCreate={() => setQuickAddOpen(true)}
        onAiBreakdown={() => setAiBreakdownOpen(true)}
      />

      {/* QuickAdd NLP Modal */}
      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => {
          setQuickAddOpen(false);
          setQuickAddInitialTitle('');
        }}
        initialTitle={quickAddInitialTitle}
        onTaskCreated={(created) => {
          handleSelectTask(created.id);
          showCelebration(`Đã tạo "${created.title}"`, 10);
        }}
      />

      {/* AI Task Breakdown Modal */}
      <AiBreakdownModal
        isOpen={aiBreakdownOpen}
        onClose={() => setAiBreakdownOpen(false)}
        onTaskCreated={(created) => {
          handleSelectTask(created.id);
          showCelebration(`Đã tạo "${created.title}" với ${created.steps.length} bước`, 20);
        }}
      />

      {/* Strict Pomodoro Supervisor Modal */}
      <StrictPomodoroModal
        open={pomodoroOpen}
        onClose={() => setPomodoroOpen(false)}
        initialMinutes={focusedPomodoroTask?.estimateMin || 25}
        onSessionComplete={handlePomodoroSessionComplete}
      />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Keyboard Shortcuts Cheatsheet Modal (?) */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      {/* Toast Notification: Reversible Destructive Undo */}
      {undoToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#161626] border-2 border-aurora-lime/60 shadow-[4px_4px_0px_#C6FF3D] text-white text-xs font-heading font-bold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span>{undoToast.message}</span>
          <button
            type="button"
            onClick={() => {
              undoToast.action();
              setUndoToast(null);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-aurora-lime text-black hover:bg-white transition-all shadow-[1px_1px_0px_#000]"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Hoàn tác</span>
          </button>
          <button
            type="button"
            onClick={() => setUndoToast(null)}
            className="p-1 rounded text-white/40 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Toast Notification: XP & Clear the Board Celebration */}
      {celebrationToast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 p-3.5 rounded-2xl border-2 shadow-[4px_4px_0px_#000] text-white animate-in fade-in slide-in-from-top-4 duration-300 ${
            celebrationToast.isClearBoard
              ? 'bg-gradient-to-r from-aurora-purple to-aurora-pink border-aurora-lime shadow-[4px_4px_0px_#C6FF3D]'
              : 'bg-[#161626] border-aurora-lime/60'
          }`}
        >
          <div className="p-2 rounded-xl bg-aurora-lime text-black font-black">
            {celebrationToast.isClearBoard ? (
              <Flame className="w-5 h-5 fill-current animate-bounce" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="text-xs font-heading font-black text-white flex items-center gap-1.5">
              <span>{celebrationToast.isClearBoard ? '🎉 CLEAR THE BOARD!' : 'Nhiệm vụ hoàn thành!'}</span>
              <span className="px-1.5 py-0.5 rounded bg-aurora-lime text-black text-[10px] font-mono font-bold">
                +{celebrationToast.xp} XP
              </span>
            </div>
            <div className="text-[11px] text-white/70 line-clamp-1">
              {celebrationToast.isClearBoard
                ? 'Tuyệt vời! Bạn đã dọn sạch tất cả bài tập hôm nay.'
                : celebrationToast.title}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
