'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  MessageSquareOff,
  Send,
  Lock,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Disc3,
  Sparkles,
  Coffee,
  Music,
} from 'lucide-react';
import type { ChatMessageItem } from '@/hooks/use-study-room-realtime';
import type { RoomStatus } from '@/lib/study-rooms-service';
import { pomodoroAudio } from '@/features/pomodoro/audio-engine';

interface BreakRoomChatProps {
  roomStatus: RoomStatus;
  messages: ChatMessageItem[];
  onSendMessage: (text: string) => void;
  currentUserId: string;
}

interface LofiTrack {
  id: string;
  title: string;
  description: string;
  baseFreq: number; // Root frequency in Hz
}

const LOFI_TRACKS: LofiTrack[] = [
  { id: 'campus-chill', title: 'Lo-Fi Campus Chill', description: 'Giai điệu thư giãn êm dịu', baseFreq: 196.0 }, // G3
  { id: 'rainy-library', title: 'Rainy Library Cafe', description: 'Tiếng mưa rơi ấm áp & đàn Rhodes', baseFreq: 174.61 }, // F3
  { id: 'synth-midnight', title: 'Synthwave Midnight', description: 'Bầu không khí học đêm êm đềm', baseFreq: 220.0 }, // A3
];

const QUICK_CHIPS = [
  'Nghỉ tay uống nước 💧',
  'Trà sữa đê 🧋',
  'Vừa xong 1 bài tập lớn! 🎉',
  'Nhạc lofi chill quá 🎧',
  'Cố lên hiệp tới nhé! 💪',
];

export function BreakRoomChat({
  roomStatus,
  messages,
  onSendMessage,
  currentUserId,
}: BreakRoomChatProps) {
  const [inputText, setInputText] = useState('');
  const [isPlayingLofi, setIsPlayingLofi] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<LofiTrack>(LOFI_TRACKS[0]!);
  const [lofiVolume, setLofiVolume] = useState(0.4);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Web Audio Procedural Lo-Fi Generator Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  const isLocked = roomStatus === 'focusing';

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Procedural Lo-Fi Audio Synthesis Engine
  const startLofiSoundscape = (track: LofiTrack, vol: number) => {
    stopLofiSoundscape();
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(vol * 0.15, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      // Chord progression: Root, minor 3rd, 5th, major 7th
      const intervals = [1, 1.2, 1.5, 1.875];
      const oscs: OscillatorNode[] = [];

      intervals.forEach((interval, idx) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const oscGain = ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(track.baseFreq * interval, ctx.currentTime);

        // Low-pass filter for cozy warm Lo-Fi warmth
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450 + idx * 80, ctx.currentTime);

        // Subtle vibrato LFO
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.2 + idx * 0.1, ctx.currentTime);
        lfoGain.gain.setValueAtTime(1.5, ctx.currentTime);
        lfo.connect(osc.frequency);
        lfo.start();

        oscGain.gain.setValueAtTime(0.25 / intervals.length, ctx.currentTime);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(masterGain);

        osc.start();
        oscs.push(osc);
      });

      oscillatorsRef.current = oscs;

      // Gentle vinyl/rain noise simulation
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.015;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1000, ctx.currentTime);
      noiseFilter.Q.setValueAtTime(0.8, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.04, ctx.currentTime);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);

      whiteNoise.start();
      noiseNodeRef.current = whiteNoise;
    } catch (err) {
      console.warn('Procedural lo-fi synthesis error:', err);
    }
  };

  const stopLofiSoundscape = () => {
    try {
      oscillatorsRef.current.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      oscillatorsRef.current = [];

      if (noiseNodeRef.current) {
        try {
          (noiseNodeRef.current as any).stop?.();
          noiseNodeRef.current.disconnect();
        } catch {}
        noiseNodeRef.current = null;
      }

      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    } catch {}
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLofiSoundscape();
    };
  }, []);

  const toggleLofiPlay = () => {
    pomodoroAudio.unlock();
    if (isPlayingLofi) {
      stopLofiSoundscape();
      setIsPlayingLofi(false);
    } else {
      startLofiSoundscape(selectedTrack, lofiVolume);
      setIsPlayingLofi(true);
    }
  };

  const handleTrackChange = (track: LofiTrack) => {
    setSelectedTrack(track);
    if (isPlayingLofi) {
      startLofiSoundscape(track, lofiVolume);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setLofiVolume(newVol);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVol * 0.15, audioCtxRef.current.currentTime);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl">
      {/* 1. Header: Status & Lo-Fi Audio Player */}
      <div className="border-b border-white/10 bg-slate-950/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
              {isLocked ? <Lock className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{isLocked ? 'Khung Chat Silent Focus' : 'Khung Chat Giờ Giải Lao'}</span>
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    isLocked ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
                  }`}
                />
              </div>
              <div className="text-[10px] text-slate-400">
                {isLocked ? 'Đang tạm khóa để giữ im lặng' : 'Thoải mái trò chuyện & nạp năng lượng'}
              </div>
            </div>
          </div>

          {/* Lo-Fi Play / Pause Button */}
          <button
            type="button"
            onClick={toggleLofiPlay}
            className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-bold transition-all ${
              isPlayingLofi
                ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/20'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title={isPlayingLofi ? 'Tạm dừng nhạc Lo-Fi' : 'Phát nhạc Lo-Fi thư giãn'}
          >
            <Disc3 className={`h-4 w-4 ${isPlayingLofi ? 'animate-spin-slow text-cyan-300' : ''}`} />
            <span className="hidden sm:inline">{isPlayingLofi ? 'Đang phát Lo-Fi' : 'Bật Lo-Fi'}</span>
            {isPlayingLofi ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
        </div>

        {/* Lo-Fi Player Controls Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-black/40 border border-white/5 px-3 py-2">
          {/* Track selector chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <Music className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            {LOFI_TRACKS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTrackChange(t)}
                className={`rounded-xl px-2 py-0.5 text-[10px] font-bold transition-all shrink-0 ${
                  selectedTrack.id === t.id
                    ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleVolumeChange(lofiVolume === 0 ? 0.4 : 0)}
              className="text-slate-400 hover:text-white"
            >
              {lofiVolume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={lofiVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              aria-label="Âm lượng Lo-Fi"
              className="h-1 w-16 accent-cyan-400 cursor-pointer bg-slate-700 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* 2. Messages List or Silent Focus Lock Screen */}
      <div className="relative flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[360px]">
        {isLocked ? (
          <div className="flex h-full flex-col items-center justify-center text-center px-4 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-300 mb-3 shadow-lg shadow-amber-500/10">
              <MessageSquareOff className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-white">Kỷ Luật Silent Focus Đang Bật</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-xs leading-relaxed">
              Khung chat tạm khóa trong 45-50 phút tập trung cao độ để toàn phòng không bị phân tâm.
            </p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold text-cyan-300 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Hãy dùng thanh biểu cảm 🔥 👏 ❤️ để cổ vũ nhau nhé!</span>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isMe = msg.userId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isSystem ? 'items-center text-center' : isMe ? 'items-end' : 'items-start'}`}
                >
                  {msg.isSystem ? (
                    <div className="rounded-xl border border-white/5 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-400">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="max-w-[85%]">
                      <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-400 font-semibold px-1">
                        <span>{msg.sender}</span>
                        <span>·</span>
                        <span>{msg.time}</span>
                      </div>
                      <div
                        className={`rounded-2xl px-3.5 py-2 text-xs font-medium leading-relaxed break-words shadow-md ${
                          isMe
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none'
                            : 'bg-white/10 border border-white/10 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 3. Quick Chips (when unlocked) */}
      {!isLocked && (
        <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-1.5 border-t border-white/5 bg-slate-950/40">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onSendMessage(chip)}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400/40 transition-all shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* 4. Chat Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-white/10 bg-slate-950/80 p-3">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLocked}
            placeholder={
              isLocked
                ? 'Khung chat đã khóa trong giờ Silent Focus...'
                : 'Nhập tin nhắn giải lao cùng đồng đội...'
            }
            className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLocked || !inputText.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 active:scale-95 transition-all disabled:pointer-events-none disabled:opacity-40"
            title="Gửi tin nhắn"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
