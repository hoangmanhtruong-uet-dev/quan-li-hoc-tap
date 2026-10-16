'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, CheckCircle2, ChevronDown, Coffee, Headphones, Pause, Play, RotateCcw, ShieldCheck, Sparkles, Volume2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StudySessionModalProps {
  open: boolean;
  onClose: () => void;
  onComplete?: (minutes: number) => void;
  initialMinutes?: number;
}

const sessionGoals = ['Ôn lại công thức chia subnet', 'Làm 5 câu bài tập thực hành', 'Ghi chú phần chưa hiểu'];

export function StudySessionModal({ open, onClose, onComplete, initialMinutes = 45 }: StudySessionModalProps) {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialMinutes * 60);
  const [running, setRunning] = useState(false);
  const [completedGoals, setCompletedGoals] = useState<number[]>([]);
  const [sound, setSound] = useState('Mưa nhẹ');
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMinutes(initialMinutes);
    setSeconds(initialMinutes * 60);
    setRunning(false);
    setCompletedGoals([]);
  }, [initialMinutes, open]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((value) => {
      if (value <= 1) {
        setRunning(false);
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const progress = useMemo(() => 1 - seconds / (minutes * 60), [minutes, seconds]);
  const timerLabel = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const circumference = 2 * Math.PI * 70;

  if (!open) return null;

  function selectDuration(value: number) {
    setMinutes(value);
    setSeconds(value * 60);
    setRunning(false);
  }

  function completeSession() {
    onComplete?.(minutes);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-md sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="study-session-title" className="my-auto w-full max-w-4xl overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-2xl shadow-blue-950/30">
        <div className="grid lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative flex min-h-[34rem] flex-col items-center justify-center overflow-hidden border-b border-border/70 p-6 lg:border-b-0 lg:border-r">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,hsl(217_91%_60%/.14),transparent_44%)]" />
            <div className="relative flex w-full items-center justify-between self-start">
              <Badge className="border border-blue-400/20 bg-blue-500/10 text-blue-300 hover:bg-blue-500/10"><Sparkles className="mr-1.5 h-3 w-3" /> Focus mode</Badge>
              <button onClick={onClose} aria-label="Đóng phiên học" className="rounded-xl border border-border bg-background/40 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"><X className="h-5 w-5" /></button>
            </div>

            <div className="relative mt-4 flex h-64 w-64 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90 drop-shadow-[0_0_20px_hsl(217_91%_60%/.22)]" viewBox="0 0 160 160" aria-hidden="true">
                <circle cx="80" cy="80" r="70" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
                <circle cx="80" cy="80" r="70" fill="none" stroke="hsl(var(--primary))" strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} className="transition-all duration-500" />
              </svg>
              <div className="text-center"><p className="font-mono text-5xl font-bold tracking-[-0.06em]">{timerLabel}</p><p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground"><span className={`h-2 w-2 rounded-full ${running ? 'animate-pulse bg-emerald-400' : 'bg-muted-foreground'}`} /> {running ? 'Đang tập trung' : seconds === 0 ? 'Đã hoàn thành' : 'Sẵn sàng bắt đầu'}</p></div>
            </div>

            <div className="relative flex rounded-xl bg-muted/60 p-1">
              {[25, 45, 60].map((value) => <button key={value} onClick={() => selectDuration(value)} className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${minutes === value ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}>{value} phút</button>)}
            </div>

            <div className="relative mt-5 flex w-full max-w-sm gap-2">
              <Button size="lg" className="h-12 flex-1 rounded-xl" onClick={() => setRunning((value) => !value)}>{running ? <><Pause className="mr-2 h-4 w-4 fill-current" /> Tạm dừng</> : <><Play className="mr-2 h-4 w-4 fill-current" /> {seconds < minutes * 60 ? 'Tiếp tục' : 'Bắt đầu tập trung'}</>}</Button>
              <Button size="icon" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => selectDuration(minutes)} aria-label="Đặt lại bộ đếm"><RotateCcw className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="flex flex-col p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-blue-300">Phiên học hôm nay</p><h2 id="study-session-title" className="mt-2 text-2xl font-bold tracking-tight">Ôn tập Subnetting</h2><p className="mt-1 text-sm text-muted-foreground">Mạng máy tính · Chương 4</p></div>
              <button onClick={onClose} aria-label="Đóng phiên học" className="hidden rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:block"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-6 rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Mục tiêu phiên học</p><span className="text-xs font-medium text-muted-foreground">{completedGoals.length}/{sessionGoals.length}</span></div>
              <div className="space-y-2">
                {sessionGoals.map((goal, index) => {
                  const done = completedGoals.includes(index);
                  return <button key={goal} onClick={() => setCompletedGoals((values) => values.includes(index) ? values.filter((item) => item !== index) : [...values, index])} className="flex w-full items-center gap-3 rounded-xl p-2 text-left text-sm transition-colors hover:bg-muted/50"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${done ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-border bg-background'}`}>{done ? <Check className="h-3.5 w-3.5" /> : null}</span><span className={done ? 'text-muted-foreground line-through' : ''}>{goal}</span></button>;
                })}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={() => setSettingsOpen((value) => !value)} className="rounded-2xl border border-border/70 bg-muted/20 p-3 text-left transition-colors hover:bg-muted/40"><span className="flex items-center gap-2 text-xs text-muted-foreground"><Headphones className="h-4 w-4 text-violet-300" /> Âm thanh nền</span><span className="mt-2 flex items-center justify-between text-sm font-semibold">{sound}<ChevronDown className="h-4 w-4 text-muted-foreground" /></span></button>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3"><span className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Không làm phiền</span><p className="mt-2 text-sm font-semibold text-emerald-300">Đang bật</p></div>
            </div>

            {settingsOpen ? <div className="mt-2 flex gap-2 rounded-xl border border-border bg-background/50 p-2">{['Mưa nhẹ', 'Quán cà phê', 'Im lặng'].map((item) => <button key={item} onClick={() => { setSound(item); setSettingsOpen(false); }} className={`flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold ${sound === item ? 'bg-violet-500/15 text-violet-300' : 'text-muted-foreground hover:bg-muted'}`}>{item === 'Mưa nhẹ' ? <Volume2 className="mx-auto mb-1 h-3.5 w-3.5" /> : item === 'Quán cà phê' ? <Coffee className="mx-auto mb-1 h-3.5 w-3.5" /> : <X className="mx-auto mb-1 h-3.5 w-3.5" />}{item}</button>)}</div> : null}

            <div className="mt-auto pt-5">
              <Button variant="ghost" className="w-full rounded-xl text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300" onClick={completeSession}><CheckCircle2 className="mr-2 h-4 w-4" /> Hoàn thành và ghi nhận phiên học</Button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">Thời gian và tiến độ sẽ được lưu vào mục tiêu tuần.</p>
            </div>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
