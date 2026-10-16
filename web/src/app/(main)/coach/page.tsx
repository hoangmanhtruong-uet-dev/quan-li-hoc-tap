'use client';

import React, { FormEvent, useEffect, useRef, useState, useCallback } from 'react';
import {
  BrainCircuit,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileText,
  Flame,
  Frown,
  GraduationCap,
  Lightbulb,
  Meh,
  Paperclip,
  Play,
  RotateCcw,
  Send,
  Smile,
  Sparkles,
  StopCircle,
  ThumbsUp,
  TrendingUp,
  Volume2,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuantumOrb3D, type OrbEmotion } from '@/components/coach/quantum-orb-3d';
import { InteractiveQuizCard } from '@/components/coach/interactive-quiz-card';
import { KnowledgeRadarChart } from '@/components/coach/knowledge-radar-chart';
import { StudyPlanCard } from '@/components/coach/study-plan-card';
import { CoachMarkdownRenderer } from '@/components/coach/coach-markdown-renderer';
import { StrictPomodoroModal } from '@/features/pomodoro/strict-pomodoro-modal';
import { useCampusStore } from '@/lib/campus-store';
import {
  generateCoachResponse,
  extractStudentContext,
  generateSuggestedPlan,
  type QuizQuestion,
  type SuggestedStudyPlan,
  type CoachSubject,
} from '@/lib/coach-engine';
import { syncStudyPlanToCampusEvents } from '@/lib/coach-client-sync';

export type Energy = 'low' | 'okay' | 'great';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  quiz?: QuizQuestion[];
  plan?: SuggestedStudyPlan;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: `Chào Minh! Mình là **CampusOS Coach** 🔮 — trợ lý lượng tử AI đồng hành cùng bạn.
Mình đã kết nối trực tiếp với dữ liệu học tập tuần này của bạn:

- 🚨 **Deadline Mạng máy tính:** lúc **23:59 hôm nay**
- 📚 **Chủ đề cần gia cố:** *Subnetting* và *Cây nhị phân AVL*
- ⚡ **Khung giờ tập trung tối ưu:** **19:00 – 21:30**

Bạn muốn mình lên kế hoạch tối nay, giải thích khái niệm hay tạo quiz thử sức ngay?`,
    timestamp: 'Vừa xong',
  },
];

const QUICK_PROMPTS = [
  {
    label: 'Lập kế hoạch tối nay',
    icon: ClipboardList,
    color: 'text-cyan-300 bg-cyan-500/10 border-cyan-400/20 hover:border-cyan-400/50',
  },
  {
    label: 'Giải thích Subnetting',
    icon: Lightbulb,
    color: 'text-amber-300 bg-amber-500/10 border-amber-400/20 hover:border-amber-400/50',
  },
  {
    label: 'Tạo 3 câu quiz',
    icon: GraduationCap,
    color: 'text-violet-300 bg-violet-500/10 border-violet-400/20 hover:border-violet-400/50',
  },
  {
    label: 'Phân tích tiến độ tuần',
    icon: TrendingUp,
    color: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20 hover:border-emerald-400/50',
  },
  {
    label: 'Ôn Cây nhị phân AVL',
    icon: Sparkles,
    color: 'text-pink-300 bg-pink-500/10 border-pink-400/20 hover:border-pink-400/50',
  },
];

export default function CoachPage() {
  const { state } = useCampusStore();

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [contextSubject, setContextSubject] = useState<CoachSubject>('Mạng máy tính');
  const [energy, setEnergy] = useState<Energy>('okay');
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [attachedFile, setAttachedFile] = useState('');
  const [likedMessages, setLikedMessages] = useState<string[]>([]);
  const [orbEmotion, setOrbEmotion] = useState<OrbEmotion>('idle');
  const [celebrateCount, setCelebrateCount] = useState(0);

  // Focus Pomodoro Modal State
  const [focusOpen, setFocusOpen] = useState(false);
  const [focusInitialMin, setFocusInitialMin] = useState(45);

  // Audio / TTS State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Suggested Plan state in sidebar
  const [sidebarPlan, setSidebarPlan] = useState<SuggestedStudyPlan>(() =>
    generateSuggestedPlan('okay', 'Mạng máy tính', [])
  );
  const [planAccepted, setPlanAccepted] = useState(false);
  const [planUndoFn, setPlanUndoFn] = useState<(() => void) | null>(null);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Hydrate conversation
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('campusos-coach-quantum');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.messages && parsed.messages.length > 0) {
          setMessages(parsed.messages);
        }
        if (parsed.energy) setEnergy(parsed.energy);
        if (parsed.planAccepted) setPlanAccepted(parsed.planAccepted);
      }
    } catch {}
  }, []);

  // Persist conversation
  useEffect(() => {
    try {
      window.localStorage.setItem(
        'campusos-coach-quantum',
        JSON.stringify({ messages, energy, planAccepted })
      );
    } catch {}
  }, [messages, energy, planAccepted]);

  // Keep sidebar plan synced
  useEffect(() => {
    const studentCtx = extractStudentContext(state, energy);
    const newPlan = generateSuggestedPlan(energy, contextSubject, studentCtx.urgentDeadlines);
    setSidebarPlan(newPlan);
  }, [energy, contextSubject, state]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, scrollToBottom]);

  // Celebration trigger
  const triggerCelebration = useCallback(() => {
    setOrbEmotion('celebrate');
    setCelebrateCount((c) => c + 1);
    setTimeout(() => {
      setOrbEmotion('idle');
    }, 2500);
  }, []);

  // Send Prompt Handler
  const sendPrompt = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || isThinking || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: 'Vừa xong',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);
    setOrbEmotion('thinking');

    const currentAttached = attachedFile;
    setAttachedFile('');

    const studentCtx = extractStudentContext(state, energy);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          contextSubject,
          attachedFileName: currentAttached || undefined,
          studentContext: studentCtx,
        }),
      });

      let data;
      if (res.ok) {
        data = await res.json();
      } else {
        data = generateCoachResponse(prompt, contextSubject, studentCtx, currentAttached);
      }

      setIsThinking(false);
      setIsStreaming(true);

      const fullText: string = data.markdown || '';
      const coachMsgId = `coach-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: coachMsgId,
          role: 'assistant',
          content: '',
          quiz: data.quiz,
          plan: data.plan,
          timestamp: 'Vừa xong',
        },
      ]);

      const chunkSize = 14;
      let charIndex = 0;

      const interval = setInterval(() => {
        charIndex += chunkSize;
        const currentSlice = fullText.slice(0, charIndex);

        setMessages((prev) =>
          prev.map((m) => (m.id === coachMsgId ? { ...m, content: currentSlice } : m))
        );

        if (charIndex >= fullText.length) {
          clearInterval(interval);
          setIsStreaming(false);
          setOrbEmotion(data.quiz ? 'happy' : 'idle');
        }
      }, 20);
    } catch {
      const localData = generateCoachResponse(prompt, contextSubject, studentCtx, currentAttached);
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `coach-${Date.now()}`,
          role: 'assistant',
          content: localData.markdown,
          quiz: localData.quiz,
          plan: localData.plan,
          timestamp: 'Vừa xong',
        },
      ]);
      setOrbEmotion('idle');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendPrompt(input);
  };

  // Audio / TTS Player
  const playSpeech = async (msgId: string, text: string) => {
    if (playingAudioId === msgId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingAudioId(null);
      return;
    }

    setPlayingAudioId(msgId);

    const plainText = text
      .replace(/[#*`_~>[\]()$-]/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 300);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: plainText,
          tone: 'normal',
          gender: 'female',
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          setPlayingAudioId(null);
          audioRef.current = null;
        };
        audio.onerror = () => {
          fallbackWebSpeech(plainText);
        };
        await audio.play();
        return;
      }
    } catch {}

    fallbackWebSpeech(plainText);
  };

  const fallbackWebSpeech = (plainText: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.05;
      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingAudioId(null);
    }
  };

  // Sidebar plan actions
  const handleAcceptSidebarPlan = () => {
    const { undo } = syncStudyPlanToCampusEvents(sidebarPlan);
    setPlanUndoFn(() => undo);
    setPlanAccepted(true);
    triggerCelebration();
  };

  const handleUndoSidebarPlan = () => {
    if (planUndoFn) {
      planUndoFn();
      setPlanUndoFn(null);
    }
    setPlanAccepted(false);
  };

  const startFocusSession = (subject: string, minutes: number) => {
    setFocusInitialMin(minutes);
    setFocusOpen(true);
  };

  const readinessScore = energy === 'great' ? 94 : energy === 'okay' ? 82 : 65;

  return (
    <div className="mx-auto flex h-[calc(100vh-6.75rem)] w-full max-w-[1600px] flex-col overflow-hidden gap-3 pb-1">
      {/* Ambient Multi-layer Aurora Glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[550px] w-[550px] rounded-full bg-violet-600/15 blur-[140px]" />
        <div className="absolute top-[25%] right-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/12 blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[25%] h-[450px] w-[450px] rounded-full bg-pink-500/10 blur-[160px]" />
      </div>

      {/* Hero Header */}
      <section className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-0.5 font-mono text-xs font-bold text-violet-300 shadow-[0_0_15px_rgba(124,92,255,0.2)]">
              <Sparkles className="h-3 w-3 text-cyan-400" /> Hologram Quantum AI Coach
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              Level {state.level || 1} · {state.rankTitle || 'Tân sinh viên'}
            </span>
          </div>

          <h1 className="font-heading text-2xl font-black tracking-tight sm:text-3xl">
            AI Study Coach
          </h1>

          <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm line-clamp-1">
            Người bạn đồng hành giải mã kiến thức, thiết kế lộ trình học cá nhân hóa và duy trì kỷ luật học tập.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl border border-white/10 bg-card/40 font-bold backdrop-blur-xl transition-all hover:border-white/20 hover:bg-card/70 text-xs"
            onClick={() => {
              setMessages(INITIAL_MESSAGES);
              setOrbEmotion('idle');
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Đoạn chat mới
          </Button>

          <Button
            size="sm"
            className="gap-2 rounded-xl border border-violet-400/40 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 font-bold text-white shadow-[0_0_20px_rgba(124,92,255,0.35)] transition-all hover:opacity-95 hover:shadow-[0_0_25px_rgba(61,232,255,0.45)] text-xs"
            onClick={() => startFocusSession(contextSubject, 45)}
          >
            <Play className="h-3.5 w-3.5 fill-current" /> Focus cùng Coach
          </Button>
        </div>
      </section>

      {/* Main Grid: Cyber-Glass Chat Canvas + Quantum Orb Sidebar */}
      <section className="flex-1 min-h-0 grid gap-5 xl:grid-cols-[minmax(0,1fr)_23.5rem] overflow-hidden">
        {/* Left: Cyber-Glass Chat Panel */}
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-card/40 shadow-[0_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-2xl">
          {/* Top Bar */}
          <div className="shrink-0 flex flex-col gap-2.5 border-b border-white/5 bg-white/[0.02] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(61,232,255,0.25)]">
                <BrainCircuit className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-400" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-heading text-sm font-bold text-foreground">CampusOS Coach</p>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                    Sẵn sàng
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Phản hồi tức thì 0ms · Đồng bộ Lịch & Dashboard
                </p>
              </div>
            </div>

            {/* Subject Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Trọng tâm:</span>
              <select
                value={contextSubject}
                onChange={(e) => setContextSubject(e.target.value as CoachSubject)}
                aria-label="Chọn môn học trọng tâm"
                className="rounded-xl border border-white/10 bg-background/80 px-3 py-1.5 font-mono text-xs font-bold text-foreground outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
              >
                <option value="Mạng máy tính">Mạng máy tính</option>
                <option value="CTDL & Giải thuật">CTDL & Giải thuật</option>
                <option value="Triết học Mác - Lênin">Triết học Mác - Lênin</option>
                <option value="Xác suất Thống kê">Xác suất Thống kê</option>
                <option value="Toán rời rạc">Toán rời rạc</option>
                <option value="Lập trình Web">Lập trình Web</option>
                <option value="Tất cả môn học">Tất cả môn học</option>
              </select>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 space-y-4 scrollbar-thin">
            {messages.map((message) => {
              const isAssistant = message.role === 'assistant';

              return (
                <div
                  key={message.id}
                  className={`group flex flex-col gap-2 ${
                    isAssistant ? 'items-start' : 'items-end ml-auto max-w-[85%]'
                  }`}
                >
                  {isAssistant && (
                    <div className="flex items-center gap-2 text-[11px] font-bold text-violet-300">
                      <span className="flex h-5 w-5 items-center justify-center rounded-lg border border-violet-400/30 bg-violet-500/15">
                        <Sparkles className="h-3 w-3 text-cyan-400" />
                      </span>
                      <span>Coach AI</span>
                      <span className="text-[10px] text-muted-foreground">· {message.timestamp}</span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`rounded-2xl p-4 text-sm leading-relaxed transition-all ${
                      isAssistant
                        ? 'max-w-2xl border border-white/[0.08] border-l-2 border-l-cyan-400 bg-white/[0.03] text-foreground shadow-lg backdrop-blur-md rounded-tl-sm'
                        : 'border border-violet-400/30 bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 text-white shadow-[0_4px_20px_rgba(124,92,255,0.25)] rounded-tr-sm'
                    }`}
                  >
                    {isAssistant ? (
                      <CoachMarkdownRenderer content={message.content} />
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}

                    {message.quiz && message.quiz.length > 0 && (
                      <InteractiveQuizCard
                        quiz={message.quiz}
                        onAnswerCorrect={triggerCelebration}
                      />
                    )}

                    {message.plan && (
                      <StudyPlanCard
                        plan={message.plan}
                        onAccepted={triggerCelebration}
                        onStartFocus={(subj, min) => startFocusSession(subj, min)}
                      />
                    )}
                  </div>

                  {/* Assistant Actions */}
                  {isAssistant && (
                    <div className="flex items-center gap-1.5 opacity-40 transition-opacity duration-200 group-hover:opacity-100">
                      <button
                        onClick={() => navigator.clipboard.writeText(message.content)}
                        className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-white/[0.08] hover:text-foreground hover:border-white/20 transition-colors"
                        aria-label="Sao chép nội dung"
                      >
                        <Copy className="h-3 w-3" /> Sao chép
                      </button>

                      <button
                        onClick={() => playSpeech(message.id, message.content)}
                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          playingAudioId === message.id
                            ? 'border-cyan-400/40 bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(61,232,255,0.2)]'
                            : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground hover:border-white/20'
                        }`}
                        aria-label="Đọc lời khuyên"
                      >
                        {playingAudioId === message.id ? (
                          <>
                            <StopCircle className="h-3 w-3 animate-pulse text-cyan-400" /> Đang đọc...
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3 w-3" /> Nghe giọng
                          </>
                        )}
                      </button>

                      <button
                        onClick={() =>
                          setLikedMessages((prev) =>
                            prev.includes(message.id)
                              ? prev.filter((id) => id !== message.id)
                              : [...prev, message.id]
                          )
                        }
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                          likedMessages.includes(message.id)
                            ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
                            : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground hover:border-white/20'
                        }`}
                        aria-label="Hữu ích"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span className="text-[10px]">Thích</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thinking Indicator */}
            {isThinking && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[11px] font-bold text-violet-300">
                  <Sparkles className="h-3 w-3 animate-spin text-amber-400" /> Coach đang xử lý lượng tử...
                </div>
                <div className="flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-background/70 px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-pink-400" />
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="shrink-0 border-t border-white/5 bg-white/[0.015] px-4 py-2">
            <div className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {QUICK_PROMPTS.map((prompt) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={prompt.label}
                    onClick={() => sendPrompt(prompt.label)}
                    disabled={isThinking || isStreaming}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${prompt.color}`}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{prompt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Footer */}
          <div className="shrink-0 border-t border-white/5 bg-card/30 p-3 sm:p-4">
            {attachedFile && (
              <div className="mb-2 flex w-fit items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300">
                <FileText className="h-3.5 w-3.5" />
                <span className="max-w-[200px] truncate">{attachedFile}</span>
                <button onClick={() => setAttachedFile('')} aria-label="Bỏ tệp đính kèm">
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <div className="relative rounded-2xl border border-white/10 bg-slate-900/90 p-2.5 transition-all shadow-xl focus-within:border-purple-500/60 focus-within:ring-2 focus-within:ring-purple-500/20">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendPrompt(input);
                    }
                  }}
                  rows={2}
                  placeholder={`Hỏi Coach về ${contextSubject}... (Enter để gửi, Shift+Enter xuống dòng)`}
                  className="w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground/70"
                />

                <div className="flex items-center justify-between border-t border-white/5 pt-2">
                  <div className="flex items-center gap-2">
                    <label
                      className="cursor-pointer rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
                      aria-label="Đính kèm tài liệu"
                    >
                      <Paperclip className="h-4 w-4" />
                      <input
                        type="file"
                        className="sr-only"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => setAttachedFile(e.target.files?.[0]?.name ?? '')}
                      />
                    </label>

                    {/* Hologram Status Pill */}
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-medium text-purple-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="hidden sm:inline">Hologram Quantum Core</span> 120FPS
                    </span>
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={!input.trim() || isThinking || isStreaming}
                    className="gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 font-bold text-white shadow-md shadow-purple-500/25 transition-all hover:from-indigo-400 hover:to-purple-500 hover:shadow-purple-500/40 disabled:opacity-50"
                  >
                    <span>Gửi</span>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <p className="text-center text-[10px] text-muted-foreground">
                AI Coach hỗ trợ ôn tập và cá nhân hóa lộ trình. Hãy đối chiếu tài liệu môn học khi chuẩn bị thi cử.
              </p>
            </form>
          </div>
        </div>

        {/* Right Sidebar: Hologram Quantum Orb + Energy + AI Plan + Radar */}
        <aside className="h-full min-h-0 min-w-0 overflow-y-auto space-y-4 pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Hologram Quantum Orb Card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 p-4 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="inline-block rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                  Quantum Core 3D
                </span>
                <h3 className="font-heading mt-1 text-sm font-bold text-foreground">
                  Lõi Lượng Tử AI
                </h3>
              </div>
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-500" />
              </span>
            </div>

            {/* 3D Canvas */}
            <QuantumOrb3D
              emotion={orbEmotion}
              isStreaming={isStreaming}
              celebrateTrigger={celebrateCount}
              className="h-[230px]"
            />

            <div className="mt-2 flex items-center justify-between rounded-2xl border border-white/5 bg-background/60 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Trạng thái:</span>
              <span className="font-mono font-bold text-cyan-300">
                {orbEmotion === 'thinking' || isThinking
                  ? 'Đang tính toán...'
                  : orbEmotion === 'celebrate'
                  ? '✨ Bùng nổ +XP!'
                  : orbEmotion === 'happy'
                  ? 'Đồng bộ tối đa ⚡'
                  : 'Lắng nghe nhịp học'}
              </span>
            </div>
          </div>

          {/* Energy Gauge Card */}
          <div className="rounded-3xl border border-white/10 bg-card/40 p-4.5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mức sẵn sàng
                </p>
                <p className="mt-0.5 font-heading text-sm font-bold text-foreground">
                  Hôm nay
                </p>
              </div>

              <div
                className="relative flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#3DE8FF 0% ${readinessScore}%, #1E1E2E ${readinessScore}% 100%)`,
                }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-card">
                  <span className="font-mono text-base font-black text-foreground">
                    {readinessScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Energy Tabs */}
            <div className="mt-3.5 grid grid-cols-3 gap-2">
              <button
                onClick={() => setEnergy('low')}
                className={`rounded-2xl border p-2 text-center transition-all ${
                  energy === 'low'
                    ? 'border-rose-400/40 bg-rose-500/15 text-rose-300 font-bold shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                    : 'border-white/5 text-muted-foreground hover:bg-white/[0.05]'
                }`}
              >
                <Frown className="mx-auto h-4 w-4" />
                <span className="mt-1 block text-[10px]">Hơi mệt</span>
              </button>

              <button
                onClick={() => setEnergy('okay')}
                className={`rounded-2xl border p-2 text-center transition-all ${
                  energy === 'okay'
                    ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300 font-bold shadow-[0_0_15px_rgba(61,232,255,0.2)]'
                    : 'border-white/5 text-muted-foreground hover:bg-white/[0.05]'
                }`}
              >
                <Meh className="mx-auto h-4 w-4" />
                <span className="mt-1 block text-[10px]">Ổn định</span>
              </button>

              <button
                onClick={() => setEnergy('great')}
                className={`rounded-2xl border p-2 text-center transition-all ${
                  energy === 'great'
                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300 font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'border-white/5 text-muted-foreground hover:bg-white/[0.05]'
                }`}
              >
                <Smile className="mx-auto h-4 w-4" />
                <span className="mt-1 block text-[10px]">Rất tốt</span>
              </button>
            </div>
          </div>

          {/* AI Plan Card */}
          <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/[0.08] via-card/40 to-card/40 p-4 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="inline-block rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-violet-300">
                  Lộ trình đề xuất
                </span>
                <h4 className="font-heading mt-1 text-sm font-bold text-foreground">
                  {sidebarPlan.title} · {sidebarPlan.totalMinutes}p
                </h4>
              </div>
              {planAccepted && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
            </div>

            <div className="space-y-2 mt-3">
              {sidebarPlan.blocks.map((item, index) => (
                <div
                  key={item.id || index}
                  className="relative flex gap-2.5 rounded-2xl border border-white/5 bg-background/50 p-2.5"
                >
                  <div className="relative flex flex-col items-center">
                    <span className={`mt-1 h-2 w-2 rounded-full ${item.color}`} />
                    {index < sidebarPlan.blocks.length - 1 && (
                      <span className="absolute top-3.5 h-8 w-px bg-white/10" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-violet-300">
                        {item.time}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {item.durationMin}p
                      </span>
                    </div>
                    <p className="text-xs font-bold text-foreground truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                {planAccepted ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Đã thêm vào Lịch & Dashboard!</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 gap-2 rounded-xl bg-emerald-600 font-bold hover:bg-emerald-500"
                        onClick={() =>
                          startFocusSession(
                            sidebarPlan.blocks[0]?.subject || 'Mạng máy tính',
                            sidebarPlan.blocks[0]?.durationMin || 45
                          )
                        }
                      >
                        <Play className="h-3.5 w-3.5 fill-current" /> Bắt đầu ngay
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleUndoSidebarPlan}
                        className="rounded-xl border border-white/10"
                        aria-label="Hoàn tác kế hoạch"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={handleAcceptSidebarPlan}
                    className="w-full gap-2 rounded-2xl border border-violet-400/30 bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-white shadow-[0_0_15px_rgba(124,92,255,0.25)] hover:from-violet-500 hover:to-indigo-500"
                  >
                    <Check className="h-4 w-4" /> Chấp nhận kế hoạch (+25 XP)
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Knowledge Radar Card */}
          <div className="rounded-3xl border border-white/10 bg-card/40 p-4 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
            <h4 className="font-heading mb-1 flex items-center gap-2 text-sm font-bold">
              <Sparkles className="h-4 w-4 text-amber-400" /> Radar Độ Nắm Vững
            </h4>
            <KnowledgeRadarChart
              onTopicClick={(topic) => {
                sendPrompt(`Giải thích trọng tâm ôn thi chủ đề ${topic}`);
              }}
            />
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-white/10 bg-card/40 p-3.5 backdrop-blur-2xl">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Flame className="h-4 w-4" />
                <span className="font-mono text-xs font-bold">Streak</span>
              </div>
              <p className="mt-1.5 font-mono text-xl font-black text-foreground">
                {state.streak || 1} ngày
              </p>
              <p className="text-[10px] text-muted-foreground">Không gián đoạn</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-card/40 p-3.5 backdrop-blur-2xl">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span className="font-mono text-xs font-bold">Điểm XP</span>
              </div>
              <p className="mt-1.5 font-mono text-xl font-black text-foreground">
                {state.xp || 0} XP
              </p>
              <p className="text-[10px] text-muted-foreground">Cấp {state.level || 1}</p>
            </div>
          </div>
        </aside>
      </section>

      {/* Focus Mode */}
      <StrictPomodoroModal
        open={focusOpen}
        onClose={() => setFocusOpen(false)}
        initialMinutes={focusInitialMin}
        onSessionComplete={() => {
          triggerCelebration();
        }}
      />
    </div>
  );
}
