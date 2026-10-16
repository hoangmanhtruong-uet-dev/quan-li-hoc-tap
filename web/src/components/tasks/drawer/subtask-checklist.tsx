'use client';

import React, { useState } from 'react';
import type { TaskStep } from '@/types/tasks';
import {
  Check,
  Plus,
  Trash2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ListTodo,
} from 'lucide-react';

export interface SubtaskChecklistProps {
  steps: TaskStep[];
  onToggleStep: (stepId: string) => void;
  onAddStep: (text: string) => void;
  onDeleteStep: (stepId: string) => void;
  onUpdateStep: (stepId: string, text: string) => void;
  onReorderSteps?: (newSteps: TaskStep[]) => void;
  onAiBreakdownMore?: () => void;
  className?: string;
}

export function SubtaskChecklist({
  steps = [],
  onToggleStep,
  onAddStep,
  onDeleteStep,
  onUpdateStep,
  onReorderSteps,
  onAiBreakdownMore,
  className = '',
}: SubtaskChecklistProps) {
  const [newStepText, setNewStepText] = useState('');
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const completedCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStepText.trim();
    if (!trimmed) return;
    onAddStep(trimmed);
    setNewStepText('');
  };

  const startEdit = (step: TaskStep) => {
    setEditingStepId(step.id);
    setEditText(step.text);
  };

  const handleSaveEdit = (stepId: string) => {
    const trimmed = editText.trim();
    if (trimmed) {
      onUpdateStep(stepId, trimmed);
    }
    setEditingStepId(null);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (!onReorderSteps) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;

    const newSteps = [...steps];
    const temp = newSteps[index]!;
    newSteps[index] = newSteps[targetIndex]!;
    newSteps[targetIndex] = temp;
    onReorderSteps(newSteps);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 1. Header with Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-heading font-bold text-white flex items-center gap-1.5">
            <ListTodo className="w-3.5 h-3.5 text-aurora-cyan" />
            Các bước thực hiện
          </span>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-white/60">
              <strong className="text-aurora-lime">{completedCount}</strong>/{totalCount} bước ({progressPercent}%)
            </span>

            {onAiBreakdownMore && (
              <button
                type="button"
                onClick={onAiBreakdownMore}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-aurora-purple/20 text-aurora-purple hover:bg-aurora-purple/30 text-[10px] font-bold border border-aurora-purple/40 transition-colors"
                title="Dùng AI gợi ý thêm các bước nhỏ"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI gợi ý thêm</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Track */}
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-aurora-cyan via-aurora-purple to-aurora-lime transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 2. Step Items List */}
      <div className="space-y-1.5">
        {steps.map((step, idx) => {
          const isEditing = editingStepId === step.id;

          return (
            <div
              key={step.id}
              className={`group flex items-center gap-2.5 p-2 rounded-xl transition-all border ${
                step.done
                  ? 'bg-white/[0.02] border-white/5 text-white/40'
                  : 'bg-white/[0.04] border-white/10 text-white hover:border-white/20'
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => onToggleStep(step.id)}
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                  step.done
                    ? 'bg-aurora-lime border-2 border-aurora-lime text-black'
                    : 'border-2 border-white/30 hover:border-aurora-lime'
                }`}
                title={step.done ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
              >
                {step.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>

              {/* Title / Editor */}
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(step.id);
                        if (e.key === 'Escape') setEditingStepId(null);
                      }}
                      onBlur={() => handleSaveEdit(step.id)}
                      autoFocus
                      className="w-full bg-black/60 border border-aurora-lime/50 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                ) : (
                  <span
                    onClick={() => startEdit(step)}
                    className={`block text-xs truncate cursor-pointer select-none ${
                      step.done ? 'line-through text-white/40' : 'text-white/90'
                    }`}
                    title="Bấm để chỉnh sửa"
                  >
                    {step.text}
                  </span>
                )}
              </div>

              {/* Action Buttons: Reorder & Delete */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {onReorderSteps && (
                  <>
                    <button
                      type="button"
                      onClick={() => moveStep(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded text-white/40 hover:text-white disabled:opacity-20"
                      title="Lên trên"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(idx, 'down')}
                      disabled={idx === steps.length - 1}
                      className="p-1 rounded text-white/40 hover:text-white disabled:opacity-20"
                      title="Xuống dưới"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => onDeleteStep(step.id)}
                  className="p-1 rounded text-white/40 hover:text-aurora-pink transition-colors"
                  title="Xóa bước này"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {steps.length === 0 && (
          <div className="p-3 text-center rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-white/40 text-xs">
            Chưa có bước nhỏ nào. Nhập bên dưới hoặc dùng AI để tạo tự động!
          </div>
        )}
      </div>

      {/* 3. Add New Step Input */}
      <form onSubmit={handleAddSubmit} className="flex items-center gap-1.5 pt-1">
        <input
          type="text"
          value={newStepText}
          onChange={(e) => setNewStepText(e.target.value)}
          placeholder="+ Thêm bước thực hiện mới (nhấn Enter)..."
          className="flex-1 bg-white/[0.05] border border-white/10 focus:border-aurora-lime/60 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!newStepText.trim()}
          className="p-2 rounded-xl bg-aurora-lime text-black hover:bg-white disabled:opacity-30 disabled:hover:bg-aurora-lime transition-all shrink-0"
          title="Thêm bước"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
