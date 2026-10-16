'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Volume2,
  VolumeX,
  Volume1,
  Flame,
  FileSearch,
  CheckCircle2,
  Settings,
  PictureInPicture2,
  Cat,
  Wind,
  Sparkles,
  Headphones,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CatCanvas } from '@/components/cat/CatCanvas';
import { determineCatState } from '@/components/cat/CatStateMachine';
import type { CatActionState } from '@/components/cat/CatRig';
import { CHARACTERS, type CharacterConfig } from './characters-data';
import { pomodoroAudio, type SpeechTone } from './audio-engine';
import { useTabDetection } from './use-tab-detection';
import { SupervisorArbiter } from './supervisor-arbiter';
import { usePomodoroSettings } from './pomodoro-settings-store';

interface StrictPomodoroModalProps {
  open: boolean;
  onClose: () => void;
  onSessionComplete?: (stats: {
    focusMinutes: number;
    shameCount: number;
    disciplineScore: number;
  }) => void;
  initialMinutes?: number;
}

export type FocusSessionMode = 'extreme_cat' | 'chill_breathing';

export function StrictPomodoroModal({
  open,
  onClose,
  onSessionComplete,
  initialMinutes,
}: StrictPomodoroModalProps) {
  // Shared Reactive Pomodoro Settings Store (đồng bộ trực tiếp từ /settings)
  const {
    settings,
    stats,
    updateSettings,
    incrementShame,
    recordCompleted,
  } = usePomodoroSettings();

  // Primary Session Mode: Mèo Mập Giám Thị vs Chill Thở 4-7-8
  const [focusMode, setFocusMode] = useState<FocusSessionMode>('extreme_cat');

  // Timer & Execution States
  const targetMinutes = initialMinutes ?? settings.defaultMinutes;
  const [minutes, setMinutes] = useState(targetMinutes);
  const [seconds, setSeconds] = useState(targetMinutes * 60);
  const [running, setRunning] = useState(false);

  // Character & Supervisor reaction states
  const [currentSpeech, setCurrentSpeech] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAwayTab, setIsAwayTab] = useState(false);
  const [shameCount, setShameCount] = useState(0);
  const [exemptRemaining, setExemptRemaining] = useState(0);
  const [isPoked, setIsPoked] = useState(false);
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  // 4-7-8 Breathing States
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathSeconds, setBreathSeconds] = useState(0);
  const [breathCycleCount, setBreathCycleCount] = useState(0);
  const [lofiAudioEnabled, setLofiAudioEnabled] = useState(true);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isPipActive, setIsPipActive] = useState(false);
  const lofiAudioCtxRef = useRef<AudioContext | null>(null);
  const lofiOscillatorsRef = useRef<OscillatorNode[]>([]);
  const pokeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const arbiterRef = useRef<SupervisorArbiter>(new SupervisorArbiter(20));

  const characterSlug = settings.characterSlug || 'co-giao-chu-nhiem';
  const character: CharacterConfig =
    CHARACTERS[characterSlug] ?? CHARACTERS['co-giao-chu-nhiem']!;

  // Cập nhật thời lượng khi chưa bấm chạy và defaultMinutes ở Cài Đặt thay đổi
  useEffect(() => {
    if (!running) {
      const min = initialMinutes ?? settings.defaultMinutes;
      setMinutes(min);
      setSeconds(min * 60);
    }
  }, [initialMinutes, running, settings.defaultMinutes]);

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
  }, []);

  // Web Audio Procedural Lo-Fi Ambient Sound
  const stopLofiSynth = useCallback(() => {
    lofiOscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    lofiOscillatorsRef.current = [];
    if (lofiAudioCtxRef.current) {
      try {
        lofiAudioCtxRef.current.close();
      } catch {}
      lofiAudioCtxRef.current = null;
    }
  }, []);

  const startLofiSynth = useCallback(() => {
    stopLofiSynth();
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      lofiAudioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.04, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, ctx.currentTime);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(196, ctx.currentTime);

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(293.66, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      lofiOscillatorsRef.current = [osc1, osc2];
    } catch {}
  }, [stopLofiSynth]);

  useEffect(() => {
    if (running && focusMode === 'chill_breathing' && lofiAudioEnabled) {
      startLofiSynth();
    } else {
      stopLofiSynth();
    }
    return () => {
      stopLofiSynth();
    };
  }, [focusMode, lofiAudioEnabled, running, startLofiSynth, stopLofiSynth]);

  // 4-7-8 Breathing Cycle Tick
  useEffect(() => {
    if (!running || focusMode !== 'chill_breathing') return;

    const timer = setInterval(() => {
      setBreathSeconds((prev) => {
        const next = prev + 1;
        if (next < 4) {
          setBreathPhase('inhale');
        } else if (next < 11) {
          setBreathPhase('hold');
        } else if (next < 19) {
          setBreathPhase('exhale');
        } else {
          setBreathCycleCount((c) => c + 1);
          setBreathPhase('inhale');
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [focusMode, running]);

  // Speech Roast Trigger
  const triggerRoast = useCallback(
    (
      speechText: string,
      alertType: 'warning' | 'penalty' | 'start' | 'success' | 'poke',
      tone: SpeechTone = 'sarcastic'
    ) => {
      if (focusMode === 'chill_breathing') return;
      setCurrentSpeech(speechText);
      if (settings.audioMuted) return;

      pomodoroAudio.playAlertSound(alertType);
      setIsSpeaking(true);

      pomodoroAudio.speak(
        speechText,
        () => {
          setIsSpeaking(false);
        },
        {
          gender: character.voiceGender,
          tone,
        }
      );
    },
    [character.voiceGender, focusMode, settings.audioMuted]
  );

  const handleFinish = useCallback(() => {
    const actualFocusMin = Math.max(1, Math.round((minutes * 60 - seconds) / 60));
    const score = arbiterRef.current.calculateDisciplineScore(actualFocusMin, minutes);

    setIsSessionFinished(true);
    recordCompleted();

    if (focusMode === 'extreme_cat') {
      const completedQuotes = character.quotes.completed;
      const endQuote =
        completedQuotes[Math.floor(Math.random() * completedQuotes.length)] ||
        completedQuotes[0] ||
        'Hoàn thành phiên học!';
      triggerRoast(endQuote, 'success', 'praise');
    }

    onSessionComplete?.({
      focusMinutes: actualFocusMin,
      shameCount,
      disciplineScore: focusMode === 'chill_breathing' ? 100 : score,
    });
  }, [character.quotes.completed, focusMode, minutes, onSessionComplete, recordCompleted, seconds, shameCount, triggerRoast]);

  // Countdown timer
  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setRunning(false);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });

      if (focusMode === 'extreme_cat') {
        if (arbiterRef.current.isExempt()) {
          setExemptRemaining(arbiterRef.current.getRemainingExemptionSeconds());
        } else {
          setExemptRemaining(0);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [focusMode, handleFinish, running]);

  // Tab switch detection
  useTabDetection({
    enabled: running && focusMode === 'extreme_cat',
    toleranceSeconds: 3,
    onTabViolation: (_awaySec) => {
      setIsAwayTab(true);
      if (!arbiterRef.current.canRoast()) return;

      const { roastCount } = arbiterRef.current.registerRoast();
      setShameCount(roastCount);
      incrementShame();

      const isExtreme = settings.roastLevel === 'extreme' || roastCount > 2;
      const quotes = isExtreme
        ? character.quotes.tab_switch_extreme
        : character.quotes.tab_switch_warning;

      const randomQuote =
        quotes[Math.floor(Math.random() * quotes.length)] ||
        quotes[0] ||
        'Tập trung học bài ngay!';

      triggerRoast(
        randomQuote,
        isExtreme ? 'penalty' : 'warning',
        isExtreme ? 'angry' : 'sarcastic'
      );
    },
    onTabReturn: (_durationSec) => {
      setIsAwayTab(false);
    },
  });

  const handleStartOrPause = async () => {
    if (!running) {
      setIsSessionFinished(false);
      if (focusMode === 'extreme_cat') {
        await pomodoroAudio.unlock();
        const startQuotes = character.quotes.start;
        const initialQuote =
          startQuotes[Math.floor(Math.random() * startQuotes.length)] ||
          startQuotes[0] ||
          'Bắt đầu học bài!';
        setRunning(true);
        triggerRoast(initialQuote, 'start', 'normal');
      } else {
        setRunning(true);
      }
    } else {
      setRunning(false);
      pomodoroAudio.stopSpeaking();
      setIsSpeaking(false);
    }
  };

  const handleTestVoice = async () => {
    await pomodoroAudio.unlock();
    const sampleQuotes = character.quotes.tab_switch_warning;
    const sample =
      sampleQuotes[Math.floor(Math.random() * sampleQuotes.length)] ||
      character.tagline;
    triggerRoast(sample, 'warning', settings.roastLevel === 'extreme' ? 'angry' : 'sarcastic');
  };

  const handlePokeCat = useCallback(async (region?: string) => {
    setIsPoked(true);
    if (pokeTimerRef.current) clearTimeout(pokeTimerRef.current);
    pokeTimerRef.current = setTimeout(() => setIsPoked(false), 800);

    await pomodoroAudio.unlock();
    const pokeQuotes = character.quotes.poke;
    const quote =
      pokeQuotes[Math.floor(Math.random() * pokeQuotes.length)] ||
      (region === 'belly' ? 'Này! Đừng có bấm vào bụng tôi!' : 'Bỏ tay ra khỏi màn hình!');
    triggerRoast(quote, 'poke', 'sarcastic');
  }, [character.quotes.poke, triggerRoast]);

  const handleOpenFloatingMemePiP = async () => {
    try {
      const docPiP = (window as unknown as {
        documentPictureInPicture?: {
          requestWindow: (opts: { width: number; height: number }) => Promise<Window>;
        };
      }).documentPictureInPicture;

      if (docPiP) {
        const pipWin = await docPiP.requestWindow({ width: 520, height: 320 });
        pipWin.document.body.style.margin = '0';
        pipWin.document.body.style.background = '#0f172a';
        pipWin.document.body.style.overflow = 'hidden';
        pipWin.document.body.style.fontFamily = 'sans-serif';
        pipWin.document.body.innerHTML = `
          <div style="position:relative;width:100vw;height:100vh;display:flex;align-items:center;justify-content:space-between;padding:0 20px;box-sizing:border-box;background:linear-gradient(135deg,#0a0a14,#181829);">
            <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);padding:16px 24px;border-radius:20px;color:#fff;font-size:46px;font-weight:900;z-index:10;box-shadow:0 10px 30px rgba(0,0,0,0.5);" id="pip-timer">
              ${timerLabel}
            </div>
            <img src="${window.location.origin}/images/leo-turnaround.png" style="width:280px;height:auto;position:absolute;right:0;bottom:-10px;filter:drop-shadow(0 10px 20px rgba(0,0,0,0.6));" />
          </div>
        `;
        setIsPipActive(true);
        return;
      }

      const canvas = canvasRef.current;
      const video = pipVideoRef.current;
      if (canvas && video) {
        const stream = canvas.captureStream(30);
        video.srcObject = stream;
        await video.play();
        await video.requestPictureInPicture();
        setIsPipActive(true);
      }
    } catch (err) {
      console.warn('Không thể mở cửa sổ nổi PiP:', err);
    }
  };

  const handleExemptionClick = () => {
    arbiterRef.current.requestExemption(120);
    setExemptRemaining(120);
    triggerRoast(
      'Được rồi, tôi tạm tha cho hai phút để tra tài liệu bài học. Đừng có mà lén lút mở Facebook đấy nhé!',
      'warning',
      'sarcastic'
    );
  };

  const timerLabel = useMemo(
    () => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
    [seconds]
  );

  // Tính toán CatActionState cho CatCanvas
  const catState: CatActionState = useMemo(() => {
    return determineCatState({
      running,
      focusMode,
      isSpeaking,
      isAwayTab,
      shameCount,
      roastLevel: settings.roastLevel,
      isSessionFinished,
      isPoked,
    });
  }, [focusMode, isAwayTab, isPoked, isSessionFinished, isSpeaking, running, settings.roastLevel, shameCount]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-fade-in"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !running) onClose();
      }}
    >
      <video ref={pipVideoRef} className="hidden" muted playsInline />

      <section
        role="dialog"
        aria-modal="true"
        aria-label="Màn hình Pomodoro Mèo Leo"
        className="relative my-auto w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-white/15 bg-gradient-to-b from-[#121220]/95 to-[#090912]/98 p-5 sm:p-7 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.85)]"
      >
        {/* Top Header Mode Switcher & Quick Actions Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={running}
              onClick={() => setFocusMode('extreme_cat')}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-black transition-all ${
                focusMode === 'extreme_cat'
                  ? 'border border-amber-500 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Cat className="h-4 w-4 text-amber-400" />
              <span>MÈO LEO GIÁM THỊ</span>
            </button>

            <button
              type="button"
              disabled={running}
              onClick={() => setFocusMode('chill_breathing')}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-black transition-all ${
                focusMode === 'chill_breathing'
                  ? 'border border-[#3DE8FF] bg-[#3DE8FF]/20 text-[#3DE8FF] shadow-[0_0_15px_rgba(61,232,255,0.2)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Wind className="h-4 w-4" />
              <span>THỞ 4-7-8 + LO-FI</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Nút Nghe mắng thử giọng & cử chỉ miệng */}
            <Button
              size="sm"
              variant="outline"
              type="button"
              className="h-8 gap-1.5 rounded-xl border-rose-500/30 bg-rose-500/10 px-2.5 text-[11px] font-bold text-rose-200 hover:bg-rose-500/20"
              onClick={handleTestVoice}
              title="Nghe thử giọng mắng và cử chỉ nhép miệng của Mèo"
            >
              <Volume1 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nghe mắng</span>
            </Button>

            {/* Nút ⚙ Cài đặt -> /settings#giam-sat */}
            <Link href="/settings#giam-sat" onClick={onClose}>
              <Button
                size="sm"
                variant="outline"
                type="button"
                className="h-8 gap-1.5 rounded-xl border-amber-500/30 bg-amber-500/10 px-3 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20"
                title="Mở cấu hình nhân cách & âm thanh tại Cài Đặt"
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">⚙ Cài đặt</span>
              </Button>
            </Link>

            {/* Công tắc âm thanh */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-xl text-slate-400 hover:text-white"
              onClick={() => updateSettings({ audioMuted: !settings.audioMuted })}
              title={settings.audioMuted ? 'Bật âm thanh mắng' : 'Tắt âm thanh'}
            >
              {settings.audioMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-amber-400" />}
            </Button>

            {/* Cửa sổ nổi PiP */}
            <Button
              size="icon"
              variant="ghost"
              className={`h-8 w-8 rounded-xl ${
                isPipActive ? 'text-emerald-400 bg-emerald-500/15' : 'text-slate-400 hover:text-white'
              }`}
              onClick={handleOpenFloatingMemePiP}
              title="Đè cửa sổ nổi góc màn hình"
            >
              <PictureInPicture2 className="h-4 w-4" />
            </Button>

            {!running && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white transition-colors ml-1"
                title="Đóng modal"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bố cục mới: Mèo Leo là nhân vật chính trên nền trong suốt */}
        <div className="relative flex flex-col items-center justify-center py-4 sm:py-6">
          {focusMode === 'extreme_cat' ? (
            <>
              {/* Speech Bubble đồng bộ thoại TTS typewriter */}
              <div
                className={`transition-all duration-300 min-h-[48px] max-w-md w-full flex items-center justify-center mb-1 ${
                  currentSpeech ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}
              >
                {currentSpeech && (
                  <div className="relative rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/80 to-rose-950/80 px-4 py-2.5 text-center text-xs font-semibold text-amber-100 shadow-[0_8px_20px_rgba(0,0,0,0.6)] backdrop-blur-md animate-fade-in">
                    <span className="mr-1 text-amber-400 font-bold">💬</span>
                    &ldquo;{currentSpeech}&rdquo;
                    {/* Mũi nhọn speech bubble trỏ xuống đầu mèo */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-amber-950/80" />
                  </div>
                )}
              </div>

              {/* MÈO LEO THREE.JS CANVAS (Hoàn toàn trong suốt, không card nền) */}
              <div className="relative flex items-center justify-center w-full max-w-[420px] h-[390px] sm:h-[410px]">
                <CatCanvas
                  characterSlug={characterSlug}
                  state={catState}
                  isSpeaking={isSpeaking}
                  visualMode={settings.visualMode}
                  reducedMotion={settings.reducedMotion}
                  onPoke={handlePokeCat}
                  onCanvasReady={handleCanvasReady}
                />
              </div>

              {/* Status chips nhỏ gọn hiển thị bên dưới mèo */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <Badge className="border border-amber-500/30 bg-amber-500/10 text-amber-300 font-medium text-[11px] px-3 py-0.5">
                  <Flame className="mr-1 h-3 w-3 text-amber-400 fill-amber-400" />
                  {character.name} · {settings.roastLevel === 'extreme' ? 'Cực gắt ⚡' : settings.roastLevel === 'medium' ? 'Mỉa mai' : 'Nhắc nhẹ'}
                </Badge>

                <Badge className="border border-rose-500/30 bg-rose-500/10 text-rose-300 font-mono text-[11px] px-3 py-0.5">
                  <ShieldAlert className="mr-1 h-3 w-3 text-rose-400" />
                  Số lần bị mắng: {shameCount}
                </Badge>

                {exemptRemaining > 0 && (
                  <Badge className="border border-sky-500/30 bg-sky-500/10 text-sky-300 font-mono text-[11px] px-3 py-0.5">
                    Đang tạm tha: {exemptRemaining}s
                  </Badge>
                )}
              </div>
            </>
          ) : (
            /* Chill 4-7-8 Breathing Mode */
            <div className="my-auto flex flex-col items-center justify-center py-6 space-y-5">
              <div className="flex items-center justify-between w-full max-w-md">
                <Badge className="border border-[#3DE8FF]/40 bg-[#3DE8FF]/15 text-[#3DE8FF]">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Kỹ thuật thở 4-7-8
                </Badge>

                <button
                  type="button"
                  onClick={() => setLofiAudioEnabled((e) => !e)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold transition-all ${
                    lofiAudioEnabled
                      ? 'border-aurora-lime bg-aurora-lime/20 text-aurora-lime'
                      : 'border-white/10 text-muted-foreground'
                  }`}
                >
                  <Headphones className="h-3.5 w-3.5" />
                  <span>Lo-Fi: {lofiAudioEnabled ? 'Bật' : 'Tắt'}</span>
                </button>
              </div>

              {/* Glowing Breathing Orb */}
              <div className="relative flex items-center justify-center h-56 w-56 my-2">
                <div
                  className={`absolute inset-0 rounded-full blur-2xl transition-all duration-1000 ${
                    breathPhase === 'inhale'
                      ? 'bg-[#3DE8FF]/30 scale-125'
                      : breathPhase === 'hold'
                      ? 'bg-[#7C5CFF]/40 scale-125 animate-pulse'
                      : 'bg-[#FF3DA5]/20 scale-90'
                  }`}
                />

                <div
                  style={{
                    transitionDuration:
                      breathPhase === 'inhale' ? '4000ms' : breathPhase === 'hold' ? '7000ms' : '8000ms',
                  }}
                  className={`relative flex flex-col items-center justify-center rounded-full border-4 shadow-2xl transition-all ${
                    breathPhase === 'inhale'
                      ? 'h-48 w-48 border-[#3DE8FF] bg-gradient-to-br from-[#3DE8FF]/30 to-[#7C5CFF]/30 scale-110'
                      : breathPhase === 'hold'
                      ? 'h-48 w-48 border-aurora-lime bg-gradient-to-br from-[#7C5CFF]/40 to-aurora-lime/30 scale-110'
                      : 'h-36 w-36 border-[#FF3DA5] bg-gradient-to-br from-[#FF3DA5]/20 to-[#0A0A14] scale-90'
                  }`}
                >
                  <span className="font-heading text-lg font-black text-white">
                    {breathPhase === 'inhale' ? 'HÍT VÀO' : breathPhase === 'hold' ? 'GIỮ HƠI' : 'THỞ RA'}
                  </span>
                  <span className="font-mono text-xl font-black text-aurora-lime mt-0.5">
                    {timerLabel}
                  </span>
                  <span className="text-[10px] font-mono text-slate-300 mt-0.5">
                    Chu kỳ: {breathCycleCount}
                  </span>
                </div>
              </div>

              <p className="text-center text-xs text-slate-300 max-w-sm italic">
                {breathPhase === 'inhale' && '🌿 Hít vào chậm rãi bằng mũi trong 4 giây...'}
                {breathPhase === 'hold' && '✨ Giữ yên hơi thở trong 7 giây... Tĩnh lặng tâm trí.'}
                {breathPhase === 'exhale' && '💨 Thở ra từ từ bằng miệng trong 8 giây... Thư giãn hoàn toàn.'}
              </p>
            </div>
          )}

          {/* Đồng hồ đếm ngược to rõ */}
          <div className="mt-4 text-center">
            <span className="font-mono text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              {timerLabel}
            </span>
          </div>

          {/* Dải nút điều khiển gọn gàng dưới đồng hồ */}
          <div className="mt-5 flex w-full max-w-md items-center gap-2.5">
            <Button
              size="lg"
              className={`h-12 flex-1 rounded-2xl text-sm font-black shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all hover:brightness-110 ${
                focusMode === 'chill_breathing'
                  ? 'bg-aurora-lime text-black hover:bg-aurora-lime/90'
                  : 'bg-rose-600 text-white hover:bg-rose-500'
              }`}
              onClick={handleStartOrPause}
            >
              {running ? (
                <>
                  <Pause className="mr-2 h-4 w-4 fill-current" /> Tạm dừng
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4 fill-current" /> Bắt đầu tập trung ({timerLabel})
                </>
              )}
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-2xl border-white/15 bg-white/5 text-slate-300 hover:text-white"
              onClick={() => {
                setRunning(false);
                setSeconds(minutes * 60);
                setCurrentSpeech('');
                arbiterRef.current.reset();
                setShameCount(0);
                setIsAwayTab(false);
                setBreathSeconds(0);
                setBreathCycleCount(0);
              }}
              disabled={running}
              title="Đặt lại đồng hồ"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Các nút phụ trợ khi đang chạy hoặc hoàn thành sớm */}
          <div className="mt-3 flex w-full max-w-md items-center justify-between gap-2">
            {running && focusMode === 'extreme_cat' ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-xl border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-300 hover:bg-amber-500/20"
                onClick={handleExemptionClick}
                disabled={exemptRemaining > 0}
              >
                <FileSearch className="mr-1.5 h-3.5 w-3.5" />
                {exemptRemaining > 0 ? `Miễn trừ (${exemptRemaining}s)` : 'Xin tra tài liệu (2p)'}
              </Button>
            ) : <div />}

            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 ml-auto"
              onClick={handleFinish}
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Hoàn thành phiên (+XP)
            </Button>
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
}
