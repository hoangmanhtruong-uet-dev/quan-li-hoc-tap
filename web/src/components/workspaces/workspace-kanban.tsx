'use client';

import React, { useState } from 'react';
import {
  WorkspaceItem,
  WorkspaceTask,
  WorkspaceMember,
  hasWorkspacePermission,
} from '@/lib/workspace-engine';
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  CheckSquare,
  Square,
  Calendar,
  User,
  Trash2,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Sparkles,
  X,
  Paperclip,
  FileText,
  Loader2,
} from 'lucide-react';
import { WorkspaceTaskAttachment } from '@/lib/workspace-engine';
import { uploadAcademicFile, formatBytes } from '@/lib/storage-engine';
import { PdfPreviewModal, PdfPreviewItem } from '@/components/common/pdf-preview-modal';

interface WorkspaceKanbanProps {
  workspace: WorkspaceItem;
  onMoveTask: (taskId: string, newStatus: WorkspaceTask['status']) => void;
  onCreateTask: (task: Omit<WorkspaceTask, 'id' | 'workspaceId' | 'createdAt'>) => void;
  onUpdateTask: (taskId: string, updates: Partial<WorkspaceTask>) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
}

const COLUMNS: {
  id: WorkspaceTask['status'];
  title: string;
  badgeClass: string;
  dotColor: string;
}[] = [
  { id: 'todo', title: 'Cần làm', badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-400/20', dotColor: 'bg-slate-400' },
  { id: 'doing', title: 'Đang làm', badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-400/30', dotColor: 'bg-purple-400' },
  { id: 'review', title: 'Chờ review', badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-400/30', dotColor: 'bg-amber-400' },
  { id: 'done', title: 'Hoàn thành', badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30', dotColor: 'bg-emerald-400' },
];

const priorityStyles: Record<WorkspaceTask['priority'], { label: string; badge: string }> = {
  high: { label: 'Gấp', badge: 'bg-rose-500/15 text-rose-300 border-rose-400/30' },
  medium: { label: 'Vừa', badge: 'bg-amber-500/15 text-amber-300 border-amber-400/30' },
  low: { label: 'Thấp', badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30' },
};

export function WorkspaceKanban({
  workspace,
  onMoveTask,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onToggleSubtask,
}: WorkspaceKanbanProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalColumn, setModalColumn] = useState<WorkspaceTask['status']>('todo');
  const [undoToast, setUndoToast] = useState<{
    message: string;
    action: () => void;
  } | null>(null);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignee, setNewAssignee] = useState(workspace.members[0]?.id || '');
  const [newPriority, setNewPriority] = useState<WorkspaceTask['priority']>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [subtaskInputs, setSubtaskInputs] = useState<string[]>(['']);
  const [newAttachments, setNewAttachments] = useState<WorkspaceTaskAttachment[]>([]);
  const [isUploadingTaskFile, setIsUploadingTaskFile] = useState(false);
  const [previewFile, setPreviewFile] = useState<PdfPreviewItem | null>(null);

  const handleUploadTaskFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingTaskFile(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        const stored = await uploadAcademicFile(file, 'tasks');
        setNewAttachments((prev) => [
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
      console.error('Lỗi tải tệp đính kèm nhiệm vụ đồ án:', err);
    } finally {
      setIsUploadingTaskFile(false);
    }
  };

  const handleRemoveNewAttachment = (id: string) => {
    setNewAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const canCreate = hasWorkspacePermission(workspace.currentUserRole, 'task.create');
  const canUpdate = hasWorkspacePermission(workspace.currentUserRole, 'task.update');
  const canDelete = hasWorkspacePermission(workspace.currentUserRole, 'task.delete');

  const showToast = (message: string, action: () => void) => {
    setUndoToast({ message, action });
    setTimeout(() => {
      setUndoToast((curr) => (curr?.message === message ? null : curr));
    }, 6000);
  };

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: WorkspaceTask['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;
    const task = workspace.tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    const previousStatus = task.status;
    onMoveTask(taskId, targetStatus);

    showToast(`Đã chuyển sang "${COLUMNS.find((c) => c.id === targetStatus)?.title}"`, () => {
      onMoveTask(taskId, previousStatus);
    });
  };

  const openCreateModal = (status: WorkspaceTask['status'] = 'todo') => {
    setModalColumn(status);
    setNewTitle('');
    setNewDesc('');
    setNewAssignee(workspace.members[0]?.id || '');
    setNewPriority('medium');
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 7);
    setNewDueDate(defaultDue.toISOString().split('T')[0] ?? '');
    setSubtaskInputs(['']);
    setNewAttachments([]);
    setIsModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const subtasks = subtaskInputs
      .filter((s) => s.trim().length > 0)
      .map((text, i) => ({
        id: `sub-${Date.now()}-${i}`,
        title: text.trim(),
        completed: false,
      }));

    onCreateTask({
      title: newTitle.trim(),
      description: newDesc.trim(),
      assigneeId: newAssignee || undefined,
      status: modalColumn,
      priority: newPriority,
      dueDate: newDueDate || (new Date().toISOString().split('T')[0] ?? ''),
      subtasks,
      attachments: newAttachments,
    });

    setNewAttachments([]);
    setIsModalOpen(false);
  };

  const addSubtaskInput = () => {
    setSubtaskInputs([...subtaskInputs, '']);
  };

  const updateSubtaskInput = (idx: number, val: string) => {
    const next = [...subtaskInputs];
    next[idx] = val;
    setSubtaskInputs(next);
  };

  const removeSubtaskInput = (idx: number) => {
    setSubtaskInputs(subtaskInputs.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Bảng Kanban Đồ án</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kéo thả nhiệm vụ giữa 4 cột để cập nhật tiến độ đồ án tức thì
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => openCreateModal('todo')}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 hover:border-cyan-400/50 transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm nhiệm vụ</span>
          </button>
        )}
      </div>

      {/* 4 Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = workspace.tasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="flex flex-col rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-4 min-h-[520px] transition-colors"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                  <span className="text-sm font-bold text-white">{col.title}</span>
                  <span className={`rounded-full border px-2 py-0.2 text-[11px] font-mono font-bold ${col.badgeClass}`}>
                    {colTasks.length}
                  </span>
                </div>

                {canCreate && (
                  <button
                    onClick={() => openCreateModal(col.id)}
                    title={`Thêm vào ${col.title}`}
                    className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Tasks List */}
              <div className="flex-1 space-y-3 pt-3">
                {colTasks.length === 0 ? (
                  <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center p-4">
                    <p className="text-xs text-slate-500">Chưa có nhiệm vụ</p>
                    {canCreate && (
                      <button
                        onClick={() => openCreateModal(col.id)}
                        className="mt-2 text-[11px] text-cyan-400 hover:underline"
                      >
                        + Tạo ngay
                      </button>
                    )}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const assignee = workspace.members.find((m) => m.id === task.assigneeId);
                    const prio = priorityStyles[task.priority] || priorityStyles.medium;
                    const doneSubtasks = task.subtasks.filter((s) => s.completed).length;

                    return (
                      <div
                        key={task.id}
                        draggable={canUpdate}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={`group relative rounded-2xl border border-white/10 bg-card/60 backdrop-blur-md p-4 transition-all duration-200 hover:border-cyan-400/40 hover:bg-card/90 hover:shadow-lg hover:shadow-cyan-950/20 ${
                          canUpdate ? 'cursor-grab active:cursor-grabbing' : ''
                        }`}
                      >
                        {/* Priority & Move Quick Controls */}
                        <div className="flex items-center justify-between gap-2 pb-2">
                          <span
                            className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${prio.badge}`}
                          >
                            {prio.label}
                          </span>

                          {/* Quick move dropdown for touch/keyboard */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canUpdate && (
                              <select
                                value={task.status}
                                onChange={(e) =>
                                  onMoveTask(task.id, e.target.value as WorkspaceTask['status'])
                                }
                                className="rounded-md border border-white/10 bg-slate-900 px-1 py-0.5 text-[10px] text-slate-300 focus:outline-none"
                              >
                                {COLUMNS.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.title}
                                  </option>
                                ))}
                              </select>
                            )}

                            {canDelete && (
                              <button
                                onClick={() => {
                                  if (confirm(`Xóa nhiệm vụ "${task.title}"?`)) {
                                    onDeleteTask(task.id);
                                  }
                                }}
                                className="rounded p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                title="Xóa nhiệm vụ"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Subtasks Checklist */}
                        {task.subtasks.length > 0 && (
                          <div className="mt-3 space-y-1.5 border-t border-white/5 pt-2">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                              <span>Checklist</span>
                              <span>
                                {doneSubtasks}/{task.subtasks.length}
                              </span>
                            </div>

                            <div className="space-y-1">
                              {task.subtasks.map((st) => (
                                <button
                                  key={st.id}
                                  type="button"
                                  disabled={!canUpdate}
                                  onClick={() => canUpdate && onToggleSubtask(task.id, st.id)}
                                  className={`flex w-full items-center gap-2 text-left text-xs transition-colors ${
                                    canUpdate
                                      ? 'text-slate-300 hover:text-white cursor-pointer'
                                      : 'text-slate-500 cursor-not-allowed opacity-70'
                                  }`}
                                >
                                  {st.completed ? (
                                    <CheckSquare className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                                  ) : (
                                    <Square className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                  )}
                                  <span
                                    className={`truncate ${
                                      st.completed ? 'line-through text-slate-500' : ''
                                    }`}
                                  >
                                    {st.title}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Task Attachments Badge */}
                        {task.attachments && task.attachments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {task.attachments.map((att) => (
                              <button
                                key={att.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewFile(att);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 hover:bg-cyan-500/20 text-[10px] font-mono transition-colors"
                              >
                                <Paperclip className="w-2.5 h-2.5" />
                                <span className="truncate max-w-[110px]">{att.name}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Footer: Due date & Assignee */}
                        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-slate-400 font-mono">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-500" />
                            <span>{task.dueDate}</span>
                          </div>

                          {assignee ? (
                            <div className="flex items-center gap-1.5" title={assignee.name}>
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                className="h-5 w-5 rounded-full object-cover ring-1 ring-white/20"
                              />
                              <span className="truncate max-w-[80px] text-slate-300">
                                {assignee.name.split(' ').slice(-1)[0]}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-600">Chưa giao</span>
                          )}
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

      {/* Undo Toast Notification */}
      {undoToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-cyan-400/40 bg-slate-900/95 backdrop-blur-xl px-4 py-3 text-xs text-white shadow-2xl shadow-cyan-950/40">
          <Sparkles className="h-4 w-4 text-cyan-400 animate-spin" />
          <span>{undoToast.message}</span>
          <button
            onClick={() => {
              undoToast.action();
              setUndoToast(null);
            }}
            className="inline-flex items-center gap-1 font-bold text-cyan-300 hover:text-cyan-200 underline ml-2"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Hoàn tác</span>
          </button>
        </div>
      )}

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl z-10 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Thêm nhiệm vụ đồ án</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tiêu đề nhiệm vụ <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Thiết kế cơ sở dữ liệu & quan hệ bảng"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mô tả</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Chi tiết công việc và yêu cầu..."
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Người phụ trách</label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {workspace.members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Độ ưu tiên</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as WorkspaceTask['priority'])}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="high">Gấp (High)</option>
                    <option value="medium">Vừa (Medium)</option>
                    <option value="low">Thấp (Low)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cột trạng thái</label>
                  <select
                    value={modalColumn}
                    onChange={(e) => setModalColumn(e.target.value as WorkspaceTask['status'])}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hạn chót</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Subtasks input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Checklist công việc con
                </label>
                <div className="space-y-2">
                  {subtaskInputs.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => updateSubtaskInput(idx, e.target.value)}
                        placeholder={`Bước ${idx + 1}...`}
                        className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                      {subtaskInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubtaskInput(idx)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSubtaskInput}
                    className="text-[11px] font-semibold text-cyan-400 hover:underline"
                  >
                    + Thêm bước
                  </button>
                </div>
              </div>

              {/* Attachments Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                    Tài liệu đính kèm (PDF / Slide)
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold cursor-pointer transition-all">
                    {isUploadingTaskFile ? (
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
                      disabled={isUploadingTaskFile}
                      onChange={(e) => {
                        handleUploadTaskFile(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>

                {newAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {newAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/40 border border-cyan-400/30 text-xs text-white"
                      >
                        <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate max-w-[150px] font-medium">{att.name}</span>
                        {att.sizeBytes ? (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({formatBytes(att.sizeBytes)})
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleRemoveNewAttachment(att.id)}
                          className="p-0.5 rounded text-slate-400 hover:text-rose-400 transition-colors"
                          title="Xóa tệp"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/20"
                >
                  Tạo nhiệm vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cyber-Glass PDF Viewer Modal */}
      <PdfPreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
}
