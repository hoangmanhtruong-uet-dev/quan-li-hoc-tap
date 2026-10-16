'use client';

import React from 'react';
import { Sparkles, AlertTriangle, Flame } from 'lucide-react';

export type AvatarMood = 'idle' | 'watching' | 'angry' | 'roasting';

interface StrictAvatarProps {
  mood: AvatarMood;
  characterName: string;
  avatarColor?: string;
  isSpeaking?: boolean;
}

export function StrictAvatar({
  mood,
  characterName,
  avatarColor = 'from-amber-500 to-rose-500',
  isSpeaking = false,
}: StrictAvatarProps) {
  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Glow Effect phía sau Avatar */}
      <div
        className={`absolute h-44 w-44 rounded-full blur-2xl transition-all duration-500 ${
          mood === 'angry' || mood === 'roasting'
            ? 'bg-rose-500/30 scale-125'
            : mood === 'watching'
            ? 'bg-amber-500/20 scale-110'
            : 'bg-blue-500/15'
        }`}
      />

      {/* Khung viền Avatar chính */}
      <div
        className={`relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-tr ${avatarColor} p-1 shadow-2xl transition-transform duration-300 ${
          mood === 'angry' || mood === 'roasting' ? 'animate-bounce' : ''
        }`}
      >
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-950/90 border border-white/10">
          {/* Biểu cảm khuôn mặt 2D dạng SVG động */}
          <svg className="h-24 w-24" viewBox="0 0 100 100" fill="none">
            {/* Lông mày */}
            {mood === 'angry' || mood === 'roasting' ? (
              <>
                <line x1="25" y1="28" x2="42" y2="36" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
                <line x1="75" y1="28" x2="58" y2="36" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
              </>
            ) : mood === 'watching' ? (
              <>
                <line x1="25" y1="32" x2="42" y2="30" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                <line x1="75" y1="32" x2="58" y2="30" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
              </>
            ) : (
              <>
                <line x1="28" y1="32" x2="42" y2="32" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                <line x1="72" y1="32" x2="58" y2="32" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
              </>
            )}

            {/* Đôi mắt */}
            {mood === 'angry' || mood === 'roasting' ? (
              <>
                <circle cx="35" cy="45" r="7" fill="#f43f5e" />
                <circle cx="65" cy="45" r="7" fill="#f43f5e" />
                <circle cx="36" cy="44" r="2.5" fill="#fff" />
                <circle cx="66" cy="44" r="2.5" fill="#fff" />
              </>
            ) : mood === 'watching' ? (
              <>
                <circle cx="35" cy="45" r="8" fill="#f59e0b" />
                <circle cx="65" cy="45" r="8" fill="#f59e0b" />
                <circle cx="35" cy="45" r="3" fill="#fff" />
                <circle cx="65" cy="45" r="3" fill="#fff" />
              </>
            ) : (
              <>
                <circle cx="35" cy="45" r="6" fill="#38bdf8" />
                <circle cx="65" cy="45" r="6" fill="#38bdf8" />
                <circle cx="36" cy="43" r="2" fill="#fff" />
                <circle cx="66" cy="43" r="2" fill="#fff" />
              </>
            )}

            {/* Miệng (nhép theo giọng nói khi isSpeaking) */}
            {isSpeaking ? (
              <ellipse
                cx="50"
                cy="70"
                rx="14"
                ry={mood === 'roasting' ? '12' : '8'}
                fill="#f43f5e"
                className="animate-pulse"
              />
            ) : mood === 'angry' ? (
              <path d="M 35 72 Q 50 62 65 72" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
            ) : mood === 'watching' ? (
              <line x1="38" y1="70" x2="62" y2="70" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
            ) : (
              <path d="M 38 68 Q 50 76 62 68" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
            )}
          </svg>

          {/* Badge trạng thái */}
          <div className="absolute bottom-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold">
            {mood === 'angry' || mood === 'roasting' ? (
              <span className="flex items-center text-rose-400">
                <Flame className="mr-0.5 h-3 w-3 fill-current" /> Đang mắng
              </span>
            ) : mood === 'watching' ? (
              <span className="flex items-center text-amber-400">
                <AlertTriangle className="mr-0.5 h-3 w-3" /> Giám sát
              </span>
            ) : (
              <span className="flex items-center text-sky-400">
                <Sparkles className="mr-0.5 h-3 w-3" /> Quan sát
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-200">{characterName}</p>
    </div>
  );
}
