'use client';

import React, { useState } from 'react';
import { ClubDetail, ClubTask, ClubDepartment } from '@/lib/club-engine';
import { ClubTaskModal } from './club-task-modal';
import {
  Kanban,
  Plus,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface ClubTasksViewProps {
  club: ClubDetail;
  onCreateTask: (task: Omit<ClubTask, 'id'>) => void;
  onUpdateTaskStatus: (taskId: string, status: ClubTask['status']) => void;
  onDeleteTask: (taskId: string) => void;
}

export function ClubTasksView({
  club,
  onCreateTask,
  onUpdateTaskStatus,
  onDeleteTask,
}: ClubTasksViewProps) {
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const departments: { label: string; value: string }[] = [
    { label: 'Tất cả ban', value: 'all' },
    { label: 'Ban Chủ nhiệm', value: 'Ban Chủ nhiệm' },
    { label: 'Ban Kỹ thuật', value: 'Ban Chuyên môn & Kỹ thuật' },
    { label: 'Ban Sự kiện & Media', value: 'Ban Truyền thông & Sự kiện' },
    { label: 'Ban Đối ngoại & Quỹ', value: 'Ban Đối ngoại & Tài chính' },
  ];

  const columns: {
    id: ClubTask['status'];
    title: string;
    color: string;
    badgeBg: string;
  }[] = [
    { id: 'todo', title: 'Cần làm', color: 'text-slate-300', badgeBg: 'bg-slate-500/15 border-slate-400/30 text-slate-300' },
    { id: 'in_progress', title: 'Đang làm', color: 'text-cyan-300', badgeBg: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300' },
    { id: 'review', title: 'Chờ review', color: 'text-amber-300', badgeBg: 'bg-amber-500/15 border-amber-400/30 text-amber-300' },
    { id: 'done', title: 'Hoàn thành', color: 'text-emerald-300', badgeBg: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300' },
  ];

  const filteredTasks = club.tasks.filter((t) => {
    return selectedDept === 'all' || t.department === selectedDept;
  });

  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t) => t.status === 'done').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const getPriorityBadge = (priority: ClubTask['priority']) => {
    switch (priority) {
      case 'high':
        return { label: 'Ưu tiên cao', className: 'bg-rose-500/15 text-rose-300 border-rose-400/30' };
      case 'medium':
        return { label: 'Trung bình', className: 'bg-amber-500/15 text-amber-300 border-amber-400/30' };
      case 'low':
      default:
        return { label: 'Tiêu chuẩn', className: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30' };
    }
  };

  const getNextStatus = (current: ClubTask['status']): ClubTask['status'] | null => {
    if (current === 'todo') return 'in_progress';
    if (current === 'in_progress') return 'review';
    if (current === 'review') return 'done';
    return null;
  };

  const getPrevStatus = (current: ClubTask['status']): ClubTask['status'] | null => {
    if (current === 'done') return 'review';
    if (current === 'review') return 'in_progress';
    if (current === 'in_progress') return 'todo';
    return null;
  };

  const handleDelete = (task: ClubTask) => {
    if (confirm(`Xác nhận xóa nhiệm vụ "${task.title}"?`)) {
      onDeleteTask(task.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Progress Bar */}
      <div className="rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Kanban className="h-5 w-5 text-cyan-400" />
              <span>Tiến độ Nhiệm vụ Ban Điều Hành</span>
            </h3>
            <p className="text-xs text-slate-400">
              {completedTasks}/{totalTasks} nhiệm vụ đã hoàn thành ({progressPercent}%)
            </p>
          </div>

          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:from-purple-400 hover:to-indigo-500 transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo nhiệm vụ ban</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Department Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {departments.map((dept) => (
          <button
            key={dept.value}
            onClick={() => setSelectedDept(dept.value)}
            className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedDept === dept.value
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {dept.label}
          </button>
        ))}
      </div>

      {/* 4-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className="flex flex-col rounded-3xl border border-white/10 bg-card/30 backdrop-blur-2xl p-4 shadow-xl"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                  {col.title}
                </span>
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full border px-1.5 text-[10px] font-mono font-bold ${col.badgeBg}`}
                >
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Column Body */}
              <div className="mt-3 space-y-3 min-h-[220px]">
                {colTasks.length === 0 ? (
                  <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-white/5 p-4 text-center text-xs text-slate-500">
                    Không có nhiệm vụ
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const priorityInfo = getPriorityBadge(task.priority);
                    const prevStatus = getPrevStatus(task.status);
                    const nextStatus = getNextStatus(task.status);

                    return (
                      <div
                        key={task.id}
                        className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md shadow-md transition-all duration-200 hover:border-cyan-400/40 hover:bg-slate-900/90 hover:-translate-y-0.5"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityInfo.className}`}
                            >
                              {priorityInfo.label}
                            </span>

                            <button
                              onClick={() => handleDelete(task)}
                              title="Xóa nhiệm vụ"
                              className="text-slate-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-opacity"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-white/5 space-y-2">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="truncate max-w-[120px] font-medium text-slate-300">
                              {task.department}
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar className="h-3 w-3 text-cyan-400" />
                              {task.dueDate.split('-').reverse().slice(0, 2).join('/')}
                            </span>
                          </div>

                          {/* Move Column Controls */}
                          <div className="flex items-center justify-between gap-1 pt-1">
                            <button
                              disabled={!prevStatus}
                              onClick={() => prevStatus && onUpdateTaskStatus(task.id, prevStatus)}
                              className={`flex items-center gap-0.5 rounded-lg border border-white/5 px-2 py-1 text-[10px] font-semibold transition-all ${
                                prevStatus
                                  ? 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                                  : 'opacity-20 cursor-not-allowed text-slate-600'
                              }`}
                              title="Chuyển sang cột trước"
                            >
                              <ChevronLeft className="h-3 w-3" />
                              <span>Trước</span>
                            </button>

                            <button
                              disabled={!nextStatus}
                              onClick={() => nextStatus && onUpdateTaskStatus(task.id, nextStatus)}
                              className={`flex items-center gap-0.5 rounded-lg border border-white/5 px-2 py-1 text-[10px] font-semibold transition-all ${
                                nextStatus
                                  ? 'bg-cyan-500/20 border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30'
                                  : 'opacity-20 cursor-not-allowed text-slate-600'
                              }`}
                              title="Chuyển sang cột sau"
                            >
                              <span>Tiếp</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <ClubTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={onCreateTask}
      />
    </div>
  );
}
