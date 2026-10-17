'use client';

import React, { useEffect, useCallback } from 'react';
import { ALLOWED_REACTIONS, type AllowedReaction } from '@/hooks/use-study-room-realtime';

export interface FloatingParticle {
  id: string;
  emoji: string;
  leftPercent: number;
  userName?: string;
  timestamp?: number;
}

interface FloatingReactionsProps {
  particles: FloatingParticle[];
  onSendReaction: (emoji: string) => void;
  disabled?: boolean;
  isFocusing?: boolean;
}

const REACTION_CONFIGS: Array<{ emoji: AllowedReaction; label: string; key: string; glow: string }> = [
  { emoji: '🔥', label: 'Hừng hực chiến đấu', key: '1', glow: 'hover:shadow-[0_0_16px_rgba(255,138,61,0.5)]' },
  { emoji: '👏', label: 'Vỗ tay cổ vũ', key: '2', glow: 'hover:shadow-[0_0_16px_rgba(198,255,61,0.5)]' },
  { emoji: '❤️', label: 'Tiếp thêm năng lượng', key: '3', glow: 'hover:shadow-[0_0_16px_rgba(255,61,165,0.5)]' },
  { emoji: '💪', label: 'Quyết tâm không nản', key: '4', glow: 'hover:shadow-[0_0_16px_rgba(61,232,255,0.5)]' },
  { emoji: '⚡', label: 'Tăng tốc bứt phá', key: '5', glow: 'hover:shadow-[0_0_16px_rgba(124,92,255,0.5)]' },
];

export function FloatingReactions({
  particles,
  onSendReaction,
  disabled = false,
  isFocusing = true,
}: FloatingReactionsProps) {
  // Keyboard shortcut listener (1-5 to send reactions)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;
      // Do not trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const match = REACTION_CONFIGS.find((r) => r.key === e.key);
      if (match) {
        e.preventDefault();
        onSendReaction(match.emoji);
      }
    },
    [disabled, onSendReaction]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Scoped GPU Keyframes for Particle Float */}
      <style>{`
        @keyframes float-reaction {
          0% {
            transform: translate3d(0, 0, 0) scale(0.6);
            opacity: 0;
          }
          15% {
            transform: translate3d(0, -60px, 0) scale(1.2);
            opacity: 1;
          }
          50% {
            transform: translate3d(12px, -260px, 0) scale(1.0);
            opacity: 0.9;
          }
          80% {
            transform: translate3d(-10px, -500px, 0) scale(0.9);
            opacity: 0.7;
          }
          100% {
            transform: translate3d(0, -680px, 0) scale(0.7);
            opacity: 0;
          }
        }
        .animate-float-reaction {
          animation: float-reaction 2.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes float-reaction {
            0% { opacity: 0; transform: scale(0.8); }
            20% { opacity: 1; transform: scale(1.1); }
            80% { opacity: 0.8; transform: scale(1.0); }
            100% { opacity: 0; transform: scale(0.8); }
          }
        }
      `}</style>

      {/* 1. Floating Particles Overlay (GPU Accelerated) */}
      <div
        className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
        aria-hidden="true"
      >
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              left: `${Math.max(5, Math.min(92, p.leftPercent))}%`,
              bottom: '5rem',
            }}
            className="absolute select-none will-change-transform animate-float-reaction"
          >
            <div className="flex flex-col items-center">
              <span className="text-4xl sm:text-5xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] transform hover:scale-125 transition-transform">
                {p.emoji}
              </span>
              {p.userName && (
                <span className="mt-1 max-w-[120px] truncate rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-400/30 backdrop-blur-md shadow-md">
                  {p.userName}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 2. Cyber-Glass Reaction Bar */}
      <div className="flex flex-col items-center gap-2">
        {isFocusing && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Silent Focus: Thả biểu cảm bay để động viên nhau</span>
            <span className="text-slate-500 hidden sm:inline">(phím 1-5)</span>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 p-1.5 shadow-2xl backdrop-blur-2xl">
          {REACTION_CONFIGS.map(({ emoji, label, key, glow }) => (
            <button
              key={emoji}
              type="button"
              disabled={disabled}
              onClick={() => onSendReaction(emoji)}
              aria-label={label}
              title={`${label} (Phím ${key})`}
              className={`group relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/5 bg-white/5 text-2xl transition-all duration-200 hover:scale-115 active:scale-95 disabled:pointer-events-none disabled:opacity-40 ${glow}`}
            >
              <span className="transform transition-transform duration-200 group-hover:-translate-y-0.5 group-active:translate-y-0.5">
                {emoji}
              </span>

              {/* Hotkey Badge */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 border border-white/20 text-[9px] font-mono font-bold text-slate-300 shadow">
                {key}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
