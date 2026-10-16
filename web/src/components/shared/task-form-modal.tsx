'use client';

import { FormEvent } from 'react';
import { CalendarDays, CheckCircle2, Clock3, Flag, Layers3, ListChecks, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type TaskPriority = 'low' | 'medium' | 'high';
export interface TaskDraft { title: string; course: string; dueDate: string; priority: TaskPriority; estimate: number; description: string }

interface TaskFormModalProps {
  open: boolean;
  editing: boolean;
  value: TaskDraft;
  onChange: (value: TaskDraft) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const priorityOptions: Array<{ value: TaskPriority; label: string; color: string }> = [
  { value: 'low', label: 'Thấp', color: 'bg-emerald-400' },
  { value: 'medium', label: 'Trung bình', color: 'bg-amber-400' },
  { value: 'high', label: 'Cao', color: 'bg-rose-400' },
];

export function TaskFormModal({ open, editing, value, onChange, onClose, onSubmit }: TaskFormModalProps) {
  if (!open) return null;
  const titleReady = value.title.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-md sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form onSubmit={onSubmit} role="dialog" aria-modal="true" aria-labelledby="task-form-title" className="my-auto w-full max-w-4xl overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-2xl shadow-blue-950/30">
        <div className="grid lg:grid-cols-[17rem_1fr]">
          <aside className="relative hidden overflow-hidden border-r border-border/70 bg-gradient-to-b from-blue-500/10 via-card to-card p-6 lg:block">
            <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="relative"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"><ListChecks className="h-5 w-5" /></span><p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-blue-300">Workspace</p><h3 className="mt-2 text-xl font-bold">Biến kế hoạch thành hành động.</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Một nhiệm vụ rõ ràng giúp bạn bắt đầu nhanh hơn và không bỏ sót deadline.</p></div>
            <div className="relative mt-8 space-y-3 text-sm">
              <div className="flex gap-3 rounded-xl bg-background/35 p-3"><CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${titleReady ? 'text-emerald-400' : 'text-muted-foreground'}`} /><div><p className="font-semibold">Đặt tên cụ thể</p><p className="mt-0.5 text-xs text-muted-foreground">Bắt đầu bằng một động từ hành động.</p></div></div>
              <div className="flex gap-3 rounded-xl bg-background/35 p-3"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" /><div><p className="font-semibold">Chọn deadline</p><p className="mt-0.5 text-xs text-muted-foreground">Để hệ thống nhắc bạn đúng lúc.</p></div></div>
              <div className="flex gap-3 rounded-xl bg-background/35 p-3"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" /><div><p className="font-semibold">AI có thể chia nhỏ</p><p className="mt-0.5 text-xs text-muted-foreground">Tạo các bước sau khi lưu nhiệm vụ.</p></div></div>
            </div>
          </aside>

          <div className="p-5 sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-blue-300">{editing ? 'Cập nhật kế hoạch' : 'Nhiệm vụ mới'}</p><h2 id="task-form-title" className="mt-2 text-2xl font-bold tracking-tight">{editing ? 'Chỉnh sửa nhiệm vụ' : 'Bạn muốn hoàn thành điều gì?'}</h2><p className="mt-1 text-sm text-muted-foreground">Điền thông tin quan trọng, bạn có thể bổ sung chi tiết sau.</p></div><button type="button" onClick={onClose} aria-label="Đóng biểu mẫu" className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><X className="h-5 w-5" /></button></div>

            <div className="space-y-5">
              <label className="block space-y-2"><span className="flex items-center gap-2 text-sm font-semibold"><ListChecks className="h-4 w-4 text-blue-300" /> Tên nhiệm vụ <span className="text-rose-400">*</span></span><Input autoFocus required value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} placeholder="Ví dụ: Hoàn thiện báo cáo chương 4" className="h-12 rounded-xl bg-background/45 px-4 text-base" /><span className="block text-[11px] text-muted-foreground">Nên ngắn gọn, cụ thể và bắt đầu bằng động từ.</span></label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2"><span className="flex items-center gap-2 text-sm font-semibold"><Layers3 className="h-4 w-4 text-violet-300" /> Môn học / Nhóm</span><Input value={value.course} onChange={(event) => onChange({ ...value, course: event.target.value })} className="h-11 rounded-xl bg-background/45" /></label>
                <label className="block space-y-2"><span className="flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-blue-300" /> Hạn hoàn thành</span><Input type="date" required value={value.dueDate} onChange={(event) => onChange({ ...value, dueDate: event.target.value })} className="h-11 rounded-xl bg-background/45" /></label>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Flag className="h-4 w-4 text-amber-300" /> Mức độ ưu tiên</p>
                <div className="grid grid-cols-3 gap-2">{priorityOptions.map((option) => <button key={option.value} type="button" onClick={() => onChange({ ...value, priority: option.value })} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${value.priority === option.value ? 'border-primary/60 bg-primary/10 text-foreground ring-1 ring-primary/25' : 'border-border bg-background/30 text-muted-foreground hover:bg-muted/40'}`}><span className={`h-2 w-2 rounded-full ${option.color}`} /> {option.label}</button>)}</div>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Clock3 className="h-4 w-4 text-emerald-300" /> Thời gian dự kiến</p>
                <div className="flex flex-wrap gap-2">{[25, 45, 60, 90, 120].map((duration) => <button key={duration} type="button" onClick={() => onChange({ ...value, estimate: duration })} className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${value.estimate === duration ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/35' : 'bg-muted/55 text-muted-foreground hover:text-foreground'}`}>{duration < 60 ? `${duration} phút` : duration === 60 ? '1 giờ' : duration === 90 ? '1.5 giờ' : '2 giờ'}</button>)}</div>
              </div>

              <label className="block space-y-2"><span className="text-sm font-semibold">Ghi chú <span className="font-normal text-muted-foreground">(không bắt buộc)</span></span><textarea value={value.description} onChange={(event) => onChange({ ...value, description: event.target.value })} rows={3} placeholder="Kết quả cần đạt, tài liệu liên quan hoặc lưu ý..." className="w-full resize-none rounded-xl border border-input bg-background/45 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" /></label>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-2 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-[11px] text-muted-foreground">Thông tin được lưu tự động trên thiết bị này.</p><div className="flex gap-2"><Button type="button" variant="ghost" onClick={onClose}>Hủy</Button><Button type="submit" className="min-w-36 rounded-xl" disabled={!titleReady}>{editing ? 'Lưu thay đổi' : 'Tạo nhiệm vụ'}</Button></div></div>
          </div>
        </div>
      </form>
    </div>
  );
}
