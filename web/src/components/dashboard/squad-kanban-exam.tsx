'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Sparkles,
  Trophy,
  ArrowRight,
  ArrowLeft,
  Plus,
  BellRing,
  Check,
  X,
  Copy,
  ChevronRight,
} from 'lucide-react';
import { useCampusStore, type KanbanTask, type CalendarEvent, formatIsoDateOnly } from '@/lib/campus-store';

interface SquadMember {
  id: string;
  name: string;
  nickname: string;
  hours: number;
  streak: number;
  level: number;
  rankTitle: string;
  avatarBg: string;
  isCurrentUser?: boolean;
}

interface ToastMessage {
  id: number;
  title: string;
  description: string;
}

export function SquadKanbanExam() {
  const { state, update } = useCampusStore();

  // ---------------------------------------------------------------------------
  // 1. Toast Alert System (for Poke button & actions)
  // ---------------------------------------------------------------------------
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [pokedMembers, setPokedMembers] = useState<Record<string, boolean>>({});

  const showToast = useCallback((title: string, description: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);

    // Audio chime notification via Web Audio API (zero external assets)
    if (typeof window !== 'undefined' && !state.reducedMotion) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        }
      } catch {}
    }
  }, [state.reducedMotion]);

  // ---------------------------------------------------------------------------
  // 2. Mini Kanban State & Logic
  // ---------------------------------------------------------------------------
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<'todo' | 'review' | 'done' | null>(null);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const tasks = state.kanbanTasks || [];

  const columns = useMemo(() => [
    {
      id: 'todo' as const,
      title: 'Đang làm',
      dotColor: 'bg-aurora-cyan',
      borderColor: 'border-aurora-cyan/40',
      badgeColor: 'bg-aurora-cyan/15 text-aurora-cyan',
    },
    {
      id: 'review' as const,
      title: 'Chờ review',
      dotColor: 'bg-aurora-orange',
      borderColor: 'border-aurora-orange/40',
      badgeColor: 'bg-aurora-orange/15 text-aurora-orange',
    },
    {
      id: 'done' as const,
      title: 'Đã xong',
      dotColor: 'bg-emerald-400',
      borderColor: 'border-emerald-500/40',
      badgeColor: 'bg-emerald-500/15 text-emerald-400',
    },
  ], []);

  const moveTask = useCallback((taskId: string, targetCol: 'todo' | 'review' | 'done') => {
    update((prev) => {
      const nextTasks = prev.kanbanTasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            column: targetCol,
            status: targetCol === 'todo' ? 'Đang làm' : targetCol === 'review' ? 'Chờ review' : 'Đã xong',
          };
        }
        return t;
      });
      return { kanbanTasks: nextTasks };
    });
  }, [update]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggingTaskId(id);
  };

  const handleDrop = (e: React.DragEvent, targetCol: 'todo' | 'review' | 'done') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (taskId) {
      moveTask(taskId, targetCol);
    }
    setDraggingTaskId(null);
    setOverCol(null);
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;

    const newTask: KanbanTask = {
      id: `task-${Date.now()}`,
      title: newTaskInput.trim(),
      detail: 'Dự án nhóm · Mới tạo',
      column: 'todo',
      status: 'Đang làm',
      courseOrClub: 'Đồ án & Nhóm',
      assignees: [{ name: 'Minh' }],
    };

    update((prev) => ({
      kanbanTasks: [newTask, ...prev.kanbanTasks],
    }));

    setNewTaskInput('');
    setIsAddingTask(false);
    showToast('Đã thêm task nhóm', `"${newTask.title}" đã được ghim vào cột Đang làm!`);
  };

  // ---------------------------------------------------------------------------
  // 3. Squad Leaderboard & Poke Feature
  // ---------------------------------------------------------------------------
  const userHours = Math.round(((state.weeklyStudyMinutesCurrent || 510) / 60) * 10) / 10;

  const squadMembers: SquadMember[] = useMemo(() => [
    {
      id: 'hoang',
      name: 'Hoàng',
      nickname: 'Hoàng "Tryhard"',
      hours: 14.2,
      streak: 18,
      level: 8,
      rankTitle: 'Trùm phao cứu sinh',
      avatarBg: 'bg-amber-500/30 border-amber-400 text-amber-300',
    },
    {
      id: 'minh-you',
      name: 'Bạn (Minh)',
      nickname: 'Bạn',
      hours: userHours,
      streak: state.streak,
      level: state.level,
      rankTitle: state.rankTitle,
      avatarBg: 'bg-aurora-lime/30 border-aurora-lime text-aurora-lime',
      isCurrentUser: true,
    },
    {
      id: 'lan',
      name: 'Lan',
      nickname: 'Lan "Code dạo"',
      hours: 7.8,
      streak: 9,
      level: 6,
      rankTitle: 'Chiến thần thuyết trình',
      avatarBg: 'bg-aurora-pink/30 border-aurora-pink text-aurora-pink',
    },
    {
      id: 'huy',
      name: 'Huy',
      nickname: 'Huy "Ngủ ngày"',
      hours: 4.1,
      streak: 3,
      level: 4,
      rankTitle: 'Bậc thầy nước đến chân',
      avatarBg: 'bg-aurora-violet/30 border-aurora-violet text-aurora-violet',
    },
  ].sort((a, b) => b.hours - a.hours), [userHours, state.streak, state.level, state.rankTitle]);

  const maxHours = Math.max(...squadMembers.map((m) => m.hours), 1);

  const handlePoke = (member: SquadMember) => {
    if (member.isCurrentUser || pokedMembers[member.id]) return;

    setPokedMembers((prev) => ({ ...prev, [member.id]: true }));

    const savageQuotes = [
      'Dậy học đi bro, deadline đang thở sau gáy 💀',
      'Đừng để streak chết uổng bro ơi!',
      'Người khác đang cày điểm A, còn bạn đang lướt TikTok à?',
      'Mèo Mập đang canh chừng đó, mở lap lên!',
    ];
    const quote = savageQuotes[Math.floor(Math.random() * savageQuotes.length)]!;

    showToast(
      `👉 Đã poke ${member.name}!`,
      `Đã gửi tín hiệu: "${quote}"`
    );

    setTimeout(() => {
      setPokedMembers((prev) => ({ ...prev, [member.id]: false }));
    }, 8000);
  };

  // ---------------------------------------------------------------------------
  // 4. Concert-Ticket Upcoming Exam Card & Live Countdown
  // ---------------------------------------------------------------------------
  const [examCountdown, setExamCountdown] = useState({
    days: 8,
    hours: 14,
    minutes: 22,
    seconds: 45,
  });
  const [prepProgress, setPrepProgress] = useState(62);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setExamCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full space-y-6" aria-label="S6 Squad & Upcoming Exams">
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto p-4 bg-[#121220]/95 border-2 border-aurora-lime/80 rounded-2xl shadow-[6px_6px_0px_#000] text-foreground flex items-start gap-3 animate-fade-in hard-border"
          >
            <BellRing className="w-5 h-5 text-aurora-lime shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-heading font-bold text-sm text-aurora-lime">{toast.title}</h4>
              <p className="font-sans text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {toast.description}
              </p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Grid container: Left 1.45fr (Kanban), Right 1fr (Leaderboard & Exam Ticket) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] w-full min-w-0">
        {/* ===================================================================
            COLUMN A: 3-COLUMN INTERACTIVE MINI KANBAN
            =================================================================== */}
        <div className="rounded-[24px] border-2 border-white/20 bg-[#11111E]/95 p-5 sm:p-6 shadow-[6px_6px_0px_#000] backdrop-blur-md flex flex-col justify-between hard-border min-w-0">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-aurora-violet/20 border border-aurora-violet/40 text-aurora-violet shadow-[2px_2px_0px_#000]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-foreground tracking-tight">
                    CÔNG VIỆC NHÓM SQUAD
                  </h3>
                  <p className="font-sans text-xs text-muted-foreground">
                    Kéo thả hoặc nhấn nút để điều chuyển trạng thái
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddingTask(!isAddingTask)}
                  className="px-3 py-1.5 rounded-xl text-xs font-heading font-bold bg-white/5 border border-white/20 hover:border-aurora-lime hover:text-aurora-lime transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_#000]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm task</span>
                </button>
              </div>
            </div>

            {/* Quick Add Task Form */}
            {isAddingTask && (
              <form onSubmit={handleAddNewTask} className="mt-4 p-3 bg-white/5 border border-white/15 rounded-xl flex gap-2 animate-fade-in font-sans">
                <input
                  type="text"
                  placeholder="Tiêu đề công việc nhóm..."
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  autoFocus
                  className="flex-1 bg-black/40 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-aurora-lime"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-aurora-lime text-black font-heading font-bold text-xs rounded-lg shadow-[2px_2px_0px_#000] hover:bg-aurora-lime/90"
                >
                  Ghim
                </button>
              </form>
            )}

            {/* 3 Columns Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5">
              {columns.map((col) => {
                const colTasks = tasks.filter((t) => t.column === col.id);
                const isOver = overCol === col.id;

                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setOverCol(col.id);
                    }}
                    onDragLeave={() => setOverCol(null)}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className={`flex flex-col rounded-2xl p-3 border-2 transition-all min-h-[300px] ${
                      isOver
                        ? 'border-aurora-lime bg-aurora-lime/5'
                        : 'border-white/10 bg-black/25'
                    }`}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                        <span className="font-heading font-bold text-xs uppercase tracking-wide">
                          {col.title}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${col.badgeColor}`}>
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Task Cards Stack */}
                    <div className="space-y-2.5 flex-1 overflow-y-auto scrollbar-thin">
                      {colTasks.length === 0 ? (
                        <div className="h-28 flex flex-col items-center justify-center text-center text-muted-foreground/50 border border-dashed border-white/10 rounded-xl text-xs font-sans">
                          Kéo thả vào đây
                        </div>
                      ) : (
                        colTasks.map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            className={`p-3 rounded-xl border bg-[#141424] border-white/15 shadow-[3px_3px_0px_#000] cursor-grab active:cursor-grabbing transition-transform hover:-translate-y-0.5 hover:border-white/30 flex flex-col gap-2 ${
                              col.id === 'done' ? 'opacity-65' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4
                                className={`font-heading font-semibold text-xs leading-snug text-foreground ${
                                  col.id === 'done' ? 'line-through text-muted-foreground' : ''
                                }`}
                              >
                                {task.title}
                              </h4>
                              {task.courseOrClub && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-white/5 border border-white/10 rounded shrink-0 text-muted-foreground">
                                  {task.courseOrClub}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-muted-foreground font-sans line-clamp-2">
                              {task.detail}
                            </p>

                            {/* Footer: Avatars + Quick Move Buttons */}
                            <div className="flex items-center justify-between pt-1 border-t border-white/5 mt-1">
                              {/* Stacked Member Avatars */}
                              <div className="flex items-center -space-x-1.5">
                                {(task.assignees || [{ name: 'Minh' }]).map((member, i) => (
                                  <div
                                    key={i}
                                    title={member.name}
                                    className="w-5 h-5 rounded-full border border-white/30 bg-gradient-to-tr from-aurora-violet to-aurora-pink flex items-center justify-center text-[9px] font-bold text-white shadow-[1px_1px_0px_#000]"
                                  >
                                    {member.name.charAt(0)}
                                  </div>
                                ))}
                              </div>

                              {/* Arrow Controls for fast non-drag movement */}
                              <div className="flex items-center gap-1">
                                {col.id !== 'todo' && (
                                  <button
                                    onClick={() => moveTask(task.id, col.id === 'done' ? 'review' : 'todo')}
                                    title="Chuyển sang cột trước"
                                    className="p-1 rounded bg-white/5 hover:bg-white/15 text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <ArrowLeft className="w-3 h-3" />
                                  </button>
                                )}
                                {col.id !== 'done' && (
                                  <button
                                    onClick={() => moveTask(task.id, col.id === 'todo' ? 'review' : 'done')}
                                    title="Chuyển sang cột tiếp theo"
                                    className="p-1 rounded bg-white/5 hover:bg-white/15 text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ===================================================================
            COLUMN B: SQUAD LEADERBOARD & CONCERT-TICKET EXAM CARD
            =================================================================== */}
        <div className="space-y-6 flex flex-col justify-between min-w-0">
          {/* SQUAD LEADERBOARD */}
          <div className="rounded-[24px] border-2 border-white/20 bg-[#11111E]/95 p-5 shadow-[6px_6px_0px_#000] backdrop-blur-md hard-border font-sans">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[2px_2px_0px_#000]">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-foreground">
                    BẢNG VÀNG TUẦN NÀY
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Cạnh tranh giờ học cùng squad
                  </p>
                </div>
              </div>

              <span className="sticker-badge text-[10px] bg-amber-400 text-black border-black font-black">
                Tuần 34
              </span>
            </div>

            {/* Members Rank List */}
            <div className="divide-y divide-white/5 mt-2">
              {squadMembers.map((member, index) => {
                const isFirst = index === 0;
                const isPoked = pokedMembers[member.id];
                const pct = Math.min(100, Math.round((member.hours / maxHours) * 100));

                return (
                  <div key={member.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-display font-black text-xs w-4 text-muted-foreground">
                        {isFirst ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>

                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-xs ${member.avatarBg}`}>
                        {member.name.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`font-heading font-bold text-xs truncate ${member.isCurrentUser ? 'text-aurora-lime' : 'text-foreground'}`}>
                            {member.name}
                          </span>
                          {member.isCurrentUser && (
                            <span className="px-1 py-0.2 text-[9px] font-bold bg-aurora-lime/20 text-aurora-lime rounded">
                              Bạn
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                          <span>{member.hours}h học</span>
                          <span>·</span>
                          <span className="text-amber-300">🔥{member.streak}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Poke Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-16 hidden sm:block">
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isFirst ? 'bg-amber-400' : member.isCurrentUser ? 'bg-aurora-lime' : 'bg-aurora-violet'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {!member.isCurrentUser ? (
                        <button
                          onClick={() => handlePoke(member)}
                          disabled={isPoked}
                          className={`px-2 py-1 rounded-lg text-[10px] font-heading font-bold border transition-all ${
                            isPoked
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 cursor-default'
                              : 'bg-white/5 border-white/15 text-muted-foreground hover:text-aurora-lime hover:border-aurora-lime shadow-[1px_1px_0px_#000]'
                          }`}
                        >
                          {isPoked ? 'Đã poke ✓' : '👉 Poke'}
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-muted-foreground px-2">
                          Lvl {member.level}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CONCERT-TICKET UPCOMING EXAM CARD */}
          <div className="relative bg-[#111120] border-2 border-white/20 rounded-[24px] shadow-[6px_6px_0px_#000] overflow-hidden flex flex-col justify-between hard-border">
            {/* Top Barcode Header */}
            <div className="px-5 py-3 bg-[#18182C] border-b-2 border-white/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-aurora-pink animate-ping" />
                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-aurora-pink">
                  CAMPUSOS PASS · VIP EXAM TICKET
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                ||| | |||| || |
              </span>
            </div>

            {/* Ticket Body with Notches */}
            <div className="relative p-5 space-y-4">
              {/* Left & Right Perforated Notches */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0A0A12] border-r-2 border-white/20 z-10" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0A0A12] border-l-2 border-white/20 z-10" />

              <div className="flex items-start gap-4">
                {/* Date Stub */}
                <div className="p-3 rounded-2xl bg-gradient-to-b from-aurora-violet/30 to-aurora-pink/20 border-2 border-aurora-violet/50 text-center shrink-0 shadow-[3px_3px_0px_#000]">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-aurora-cyan">
                    Tháng 8
                  </span>
                  <span className="block font-display font-black text-2xl text-foreground">
                    28
                  </span>
                  <span className="block text-[9px] font-mono text-muted-foreground">
                    Thứ Năm
                  </span>
                </div>

                {/* Exam Title & Location */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-aurora-pink/20 text-aurora-pink border border-aurora-pink/40">
                      Thi cuối kỳ
                    </span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-foreground leading-snug">
                    CS201 · Cấu trúc dữ liệu & Giải thuật
                  </h4>
                  <p className="text-xs text-muted-foreground font-sans mt-1">
                    09:00 - 11:00 (120 phút) · Phòng 302 · Tự luận
                  </p>
                </div>
              </div>

              {/* Perforation Line */}
              <div className="border-t-2 border-dashed border-white/15 my-2" />

              {/* Live Countdown Grid */}
              <div suppressHydrationWarning className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center justify-between text-center font-mono">
                <div>
                  <span suppressHydrationWarning className="block text-lg font-bold text-aurora-lime">{examCountdown.days}</span>
                  <span className="text-[9px] text-muted-foreground uppercase">Ngày</span>
                </div>
                <span className="text-muted-foreground">:</span>
                <div>
                  <span suppressHydrationWarning className="block text-lg font-bold text-foreground">{String(examCountdown.hours).padStart(2, '0')}</span>
                  <span className="text-[9px] text-muted-foreground uppercase">Giờ</span>
                </div>
                <span className="text-muted-foreground">:</span>
                <div>
                  <span suppressHydrationWarning className="block text-lg font-bold text-foreground">{String(examCountdown.minutes).padStart(2, '0')}</span>
                  <span className="text-[9px] text-muted-foreground uppercase">Phút</span>
                </div>
                <span className="text-muted-foreground">:</span>
                <div>
                  <span suppressHydrationWarning className="block text-lg font-bold text-aurora-pink">{String(examCountdown.seconds).padStart(2, '0')}</span>
                  <span className="text-[9px] text-muted-foreground uppercase">Giây</span>
                </div>
              </div>

              {/* Prep Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-sans">
                  <span className="text-muted-foreground text-[11px]">Tiến độ ôn tập (5/8 chương)</span>
                  <span className="font-mono font-bold text-aurora-lime">{prepProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-aurora-cyan via-aurora-violet to-aurora-pink transition-all duration-300"
                    style={{ width: `${prepProgress}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 font-sans">
                <button
                  onClick={() => setAiModalOpen(true)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-aurora-lime text-black font-heading font-bold text-xs shadow-[3px_3px_0px_#000] hover:bg-aurora-lime/90 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>Tạo đề cương AI</span>
                </button>
                <Link
                  href="/calendar"
                  className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/20 text-foreground font-heading font-semibold text-xs hover:bg-white/10 shadow-[2px_2px_0px_#000] flex items-center gap-1"
                >
                  <span>Chi tiết</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          AI EXAM SYLLABUS MODAL
          ===================================================================== */}
      {aiModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setAiModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-xl bg-[#0F0F1D] border-2 border-white/25 rounded-[28px] shadow-[10px_10px_0px_#000] overflow-hidden flex flex-col hard-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-[#151528] border-b-2 border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-aurora-lime text-black font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-foreground">
                    ĐỀ CƯƠNG ÔN TẬP CS201 (AI COPILOT)
                  </h3>
                  <p className="text-xs text-muted-foreground font-sans">
                    Lộ trình 4 tuần nước rút trước kỳ thi 28/08
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAiModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Syllabus Modules */}
            <div className="p-6 space-y-3.5 max-h-[60vh] overflow-y-auto scrollbar-thin font-sans text-xs">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-aurora-cyan">Tuần 1: Độ phức tạp & Sắp xếp</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400">Đã xong ✓</span>
                </div>
                <p className="text-muted-foreground">
                  Phân tích Big-O (O(1), O(n), O(n log n)), HeapSort, MergeSort, QuickSort và partition logic.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-aurora-lime">Tuần 2: Cây nhị phân & AVL</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-aurora-lime/20 text-aurora-lime">Đang ôn</span>
                </div>
                <p className="text-muted-foreground">
                  Cây nhị phân tìm kiếm (BST), các phép xoay cây AVL (LL, RR, LR, RL) và Priority Queue / Heap.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-aurora-orange">Tuần 3: Đồ thị nâng cao</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-muted-foreground">Sắp tới</span>
                </div>
                <p className="text-muted-foreground">
                  Biểu diễn đồ thị, BFS/DFS duyệt đỉnh, Dijkstra tìm đường đi ngắn nhất, thuật toán Kruskal/Prim.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-aurora-pink">Tuần 4: Quy hoạch động (DP) & Luyện đề</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-muted-foreground">Nước rút</span>
                </div>
                <p className="text-muted-foreground">
                  Bài toán Knapsack 0/1, Dãy con tăng dài nhất (LIS), Chuỗi con chung dài nhất (LCS) & giải 3 đề thi năm ngoái.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-[#121222] border-t border-white/10 flex items-center justify-between gap-3 font-sans">
              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined') {
                    navigator.clipboard.writeText(
                      'Đề cương ôn thi CS201: Tuần 1: Big-O & Sorting; Tuần 2: BST & AVL; Tuần 3: Graphs & Dijkstra; Tuần 4: Dynamic Programming & Past Papers.'
                    );
                    showToast('Đã sao chép!', 'Đề cương ôn thi CS201 đã được sao chép vào bộ nhớ đệm.');
                  }
                }}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-muted-foreground hover:text-foreground text-xs font-heading font-bold flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép Markdown</span>
              </button>

              <button
                onClick={() => {
                  setPrepProgress((prev) => Math.min(100, prev + 10));
                  // Push study blocks into calendar store
                  const studyEvents: CalendarEvent[] = [
                    {
                      id: `cs201-ai-1-${Date.now()}`,
                      title: 'Ôn tập CS201: Cây AVL & Heap',
                      date: formatIsoDateOnly(new Date(), 1),
                      start: '19:00',
                      end: '21:00',
                      type: 'study',
                      location: 'Thư viện tầng 3',
                      description: 'Ôn luyện thuật toán xoay cây AVL theo đề cương AI',
                    },
                    {
                      id: `cs201-ai-2-${Date.now()}`,
                      title: 'Ôn tập CS201: Dijkstra & Đồ thị',
                      date: formatIsoDateOnly(new Date(), 3),
                      start: '19:00',
                      end: '21:00',
                      type: 'study',
                      location: 'Phòng học nhóm',
                      description: 'Giải các bài tập tìm đường đi ngắn nhất',
                    },
                  ];
                  update((prev) => ({
                    events: [...prev.events, ...studyEvents],
                  }));
                  setAiModalOpen(false);
                  showToast('Đã tích hợp vào Lịch!', 'Các buổi ôn tập CS201 đã được thêm vào lịch trình của bạn.');
                }}
                className="px-4 py-2 rounded-xl bg-aurora-lime text-black font-heading font-bold text-xs shadow-[3px_3px_0px_#000] hover:bg-aurora-lime/90 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Thêm buổi học vào Lịch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
