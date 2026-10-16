'use client';

import React, { useEffect, useRef, useState, useCallback, useId } from 'react';

export interface ProgressRingProps {
  percentage: number; // 0 to 100
  size?: number; // default 52
  strokeWidth?: number; // default 5
  className?: string;
  showText?: boolean;
  reducedMotion?: boolean;
  onFullBurst?: () => void;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  vRot: number;
}

export function ProgressRing({
  percentage = 0,
  size = 52,
  strokeWidth = 5,
  className = '',
  showText = true,
  reducedMotion = false,
  onFullBurst,
}: ProgressRingProps) {
  const safePercent = Math.max(0, Math.min(100, isNaN(percentage) ? 0 : percentage));
  const [displayPercent, setDisplayPercent] = useState<number>(reducedMotion ? safePercent : 0);
  const prevPercentRef = useRef<number>(displayPercent);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiAnimRef = useRef<number | null>(null);
  const burstTriggeredRef = useRef<boolean>(false);

  const gradientId = useId();
  const filterId = useId();

  // Circle dimensions
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayPercent / 100) * circumference;

  // Mini Canvas 2D Confetti burst at 100%
  const triggerMiniConfetti = useCallback(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const originX = w / 2;
    const originY = h / 2;

    const colors = ['#3DFFB0', '#C6FF3D', '#3DE8FF', '#FF3DA5', '#FF8A3D', '#FFFFFF'];
    const count = 32;
    const particles: ConfettiParticle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 2.2 + Math.random() * 4.2;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: 2.5 + Math.random() * 3.5,
        color: colors[Math.floor(Math.random() * colors.length)] ?? '#3DFFB0',
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
      });
    }

    if (confettiAnimRef.current) {
      cancelAnimationFrame(confettiAnimRef.current);
    }

    const startTime = performance.now();
    const duration = 750;

    const frame = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p) continue;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // Gravity
        p.rotation += p.vRot;
        p.alpha = Math.max(0, 1 - elapsed / duration);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }

      if (elapsed < duration) {
        confettiAnimRef.current = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, w, h);
        confettiAnimRef.current = null;
      }
    };

    confettiAnimRef.current = requestAnimationFrame(frame);
    onFullBurst?.();
  }, [reducedMotion, onFullBurst]);

  // Animated Count-Up
  useEffect(() => {
    if (reducedMotion) {
      setDisplayPercent(safePercent);
      if (safePercent >= 100 && prevPercentRef.current < 100) {
        triggerMiniConfetti();
      }
      prevPercentRef.current = safePercent;
      return;
    }

    let startVal = prevPercentRef.current;
    const endVal = safePercent;
    const startTime = performance.now();
    const duration = 500;
    let animId: number;

    const animatePercent = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * ease;
      setDisplayPercent(current);

      if (progress < 1) {
        animId = requestAnimationFrame(animatePercent);
      } else {
        setDisplayPercent(endVal);
        prevPercentRef.current = endVal;
        if (endVal >= 100 && !burstTriggeredRef.current) {
          burstTriggeredRef.current = true;
          triggerMiniConfetti();
        } else if (endVal < 100) {
          burstTriggeredRef.current = false;
        }
      }
    };

    animId = requestAnimationFrame(animatePercent);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [safePercent, reducedMotion, triggerMiniConfetti]);

  // Clean up canvas RAF on unmount
  useEffect(() => {
    return () => {
      if (confettiAnimRef.current) {
        cancelAnimationFrame(confettiAnimRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Background & Progress SVG */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        aria-hidden="true"
      >
        <defs>
          {/* Liquid gradient fill */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3DFFB0" />
            <stop offset="50%" stopColor="#3DE8FF" />
            <stop offset="100%" stopColor="#C6FF3D" />
          </linearGradient>

          {/* Liquid neon glow filter */}
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#3DFFB0" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Track circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Animated Liquid Progress Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          filter={`url(#${filterId})`}
          style={{
            transition: reducedMotion ? 'none' : 'stroke-dashoffset 0.15s ease-out',
          }}
        />
      </svg>

      {/* Center Percentage Display */}
      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-mono font-black text-[11px] tracking-tight text-white drop-shadow-sm">
            {Math.round(displayPercent)}%
          </span>
        </div>
      )}

      {/* Confetti Overlay Canvas */}
      <canvas
        ref={canvasRef}
        width={size * 2.4}
        height={size * 2.4}
        className="pointer-events-none absolute -inset-6 z-20"
        aria-hidden="true"
      />
    </div>
  );
}
