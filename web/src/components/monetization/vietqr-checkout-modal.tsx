'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Copy,
  Check,
  RefreshCw,
  Zap,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type LabTier,
  TIER_CONFIGS,
  generateVietQrUrl,
  formatVnd,
} from '@/lib/monetization-matrix';
import { useCampusStore, upgradeLabTier } from '@/lib/campus-store';
import { pushProfileMutation, recordLabTransactionToSupabase } from '@/lib/supabase-sync';

export interface VietQrCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTier?: LabTier;
  userId?: string;
  onSuccess?: (tier: LabTier) => void;
}

interface ConfettiDot {
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

const CONFETTI_COLORS = [
  '#C6FF3D', // Acid Lime
  '#3DE8FF', // Cyber Cyan
  '#FF3DA5', // Hot Pink
  '#7C5CFF', // Aurora Violet
  '#FF8A3D', // Sticker Orange
  '#FFD700', // Gold
  '#FFFFFF',
];

export function VietQrCheckoutModal({
  isOpen,
  onClose,
  defaultTier = 'plus',
  userId = 'STUDENT',
  onSuccess,
}: VietQrCheckoutModalProps) {
  const { state } = useCampusStore();
  const [selectedTier, setSelectedTier] = useState<LabTier>(
    defaultTier === 'free' ? 'plus' : defaultTier
  );
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 minutes = 900s
  const [imgError, setImgError] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync default tier
  useEffect(() => {
    if (defaultTier && defaultTier !== 'free') {
      setSelectedTier(defaultTier);
    }
  }, [defaultTier]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(900);
      setImgError(false);
      setCopiedKey(null);
      setToastMessage(null);
      setIsSimulating(false);
      setSimulatedSuccess(false);
    }
  }, [isOpen]);

  // 15-Minute Countdown Timer
  useEffect(() => {
    if (!isOpen || simulatedSuccess || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, simulatedSuccess, timeLeft]);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSimulating) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSimulating, onClose]);

  // Format MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 140-Particle Canvas2D Confetti Celebration Burst (120FPS Zero-Lag)
  const triggerCelebrationConfetti = useCallback((originX: number, originY: number) => {
    if (state.reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const dots: ConfettiDot[] = [];
    const count = 140;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 6 + Math.random() * 10;
      dots.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        size: 4 + Math.random() * 5,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
      });
    }

    const startTime = performance.now();
    let animId: number;

    const frame = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dots.forEach((dot) => {
        dot.x += dot.vx;
        dot.y += dot.vy;
        dot.vy += 0.22; // Gravity
        dot.vx *= 0.98; // Friction
        dot.rotation += dot.vRot;
        dot.alpha = Math.max(0, 1 - elapsed / 1200);

        ctx.save();
        ctx.globalAlpha = dot.alpha;
        ctx.translate(dot.x, dot.y);
        ctx.rotate(dot.rotation);
        ctx.fillStyle = dot.color;
        ctx.fillRect(-dot.size / 2, -dot.size / 2, dot.size, dot.size * 1.5);
        ctx.restore();
      });

      if (elapsed < 1200) {
        animId = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animId = requestAnimationFrame(frame);
  }, [state.reducedMotion]);

  // Copy to clipboard with fallback
  const handleCopy = async (key: string, text: string, label: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedKey(key);
      setToastMessage(`Đã sao chép ${label}!`);
      setTimeout(() => setCopiedKey(null), 2000);
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage('Không thể sao chép, vui lòng nhập thủ công');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const activeConfig = TIER_CONFIGS[selectedTier];
  const qrData = generateVietQrUrl({
    amount: activeConfig.priceVnd,
    userId,
    tier: selectedTier,
  });

  // 1-Click Dev Mode Simulation
  const handleDevModeSimulate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isSimulating) return;
    setIsSimulating(true);

    const clickX = e.clientX || (typeof window !== 'undefined' ? window.innerWidth / 2 : 200);
    const clickY = e.clientY || (typeof window !== 'undefined' ? window.innerHeight / 2 : 200);

    // Trigger celebration burst
    triggerCelebrationConfetti(clickX, clickY);

    // 1. Upgrade in Campus Shared Store
    upgradeLabTier(selectedTier);

    // 2. Dispatch store update event for cross-component listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('campusos-store-update'));
    }

    // 3. Persist mutation to Supabase profiles
    try {
      await pushProfileMutation({
        isLabVip: true,
        tier: selectedTier,
      } as any);
    } catch (err) {
      console.warn('[VietQRCheckoutModal] Cloud sync warning:', err);
    }

    // 4. Record transaction audit
    try {
      await recordLabTransactionToSupabase({
        tier: selectedTier,
        amount: activeConfig.priceVnd,
        currency: 'VND',
        status: 'completed',
        payment_method: 'dev_simulation',
        transaction_code: `DEV_${selectedTier.toUpperCase()}_${Date.now()}`,
        metadata: {
          simulatedBy: userId,
          tierName: activeConfig.name,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (txErr) {
      console.warn('[VietQRCheckoutModal] Transaction audit warning:', txErr);
    }

    setSimulatedSuccess(true);
    onSuccess?.(selectedTier);

    // Auto close after celebration animation
    setTimeout(() => {
      setIsSimulating(false);
      onClose();
    }, 1400);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSimulating) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      {/* 120FPS Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      />

      <div className="relative w-full max-w-xl rounded-[28px] border-2 border-white/20 bg-[#10101C] p-5 sm:p-7 shadow-[10px_10px_0px_#000] hard-border overflow-hidden space-y-5 text-foreground max-h-[95vh] flex flex-col justify-between">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/40 text-[10px] font-mono font-bold text-cyan-300">
                <Sparkles className="h-3 w-3" />
                NAPAS 247 · VIETQR
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                {timeLeft > 0 ? (
                  <span className="text-amber-300 font-bold">{formatTimer(timeLeft)}</span>
                ) : (
                  <span className="text-rose-400 font-bold">Hết hạn</span>
                )}
              </span>
            </div>
            <h2 id="checkout-modal-title" className="font-heading text-xl sm:text-2xl font-black tracking-tight text-white">
              Nâng cấp Campus LAB VIP
            </h2>
          </div>

          <button
            onClick={onClose}
            disabled={isSimulating}
            className="p-2 rounded-xl text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tier Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10">
          {(['plus', 'pro', 'ultra'] as LabTier[]).map((t) => {
            const item = TIER_CONFIGS[t];
            const isSelected = selectedTier === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setSelectedTier(t);
                  setImgError(false);
                }}
                className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-bold font-mono transition-all flex flex-col items-center gap-0.5 ${
                  isSelected
                    ? t === 'ultra'
                      ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-300 border border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                      : t === 'pro'
                        ? 'bg-violet-500/25 text-violet-300 border border-violet-400/60 shadow-[0_0_12px_rgba(167,139,250,0.3)]'
                        : 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <span>{item.badgeTitle}</span>
                <span className="text-[10px] opacity-80">{formatVnd(item.priceVnd)}</span>
              </button>
            );
          })}
        </div>

        {/* QR Section & Banking Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          {/* Left: Dynamic QR Code Box */}
          <div className="relative flex flex-col items-center justify-center p-4 rounded-2xl bg-white border-2 border-white/20 shadow-[4px_4px_0px_#000] text-center min-h-[220px]">
            {timeLeft <= 0 ? (
              <div className="flex flex-col items-center gap-2 p-4 text-slate-900">
                <AlertTriangle className="h-10 w-10 text-rose-500 animate-bounce" />
                <span className="text-xs font-bold text-rose-600">Mã QR đã hết hạn</span>
                <Button
                  size="sm"
                  onClick={() => setTimeLeft(900)}
                  className="mt-1 bg-slate-900 text-white hover:bg-slate-800 text-xs gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Làm mới mã QR
                </Button>
              </div>
            ) : imgError ? (
              <div className="flex flex-col items-center justify-center gap-2 py-4 text-slate-900">
                <QrCode className="h-28 w-28 text-slate-800" />
                <span className="text-[10px] font-mono text-slate-600 font-bold">
                  Quét thủ công bằng App Ngân Hàng
                </span>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrData.qrUrl}
                alt="Mã VietQR Napas 247"
                onError={() => setImgError(true)}
                className="w-44 h-44 object-contain"
              />
            )}

            <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Napas 247 Xác thực tự động</span>
            </div>
          </div>

          {/* Right: Banking Information Fields */}
          <div className="space-y-2.5 text-xs">
            {/* Field 1: Bank Name */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Ngân hàng</span>
              <div className="font-bold text-foreground text-xs">{qrData.bankName}</div>
            </div>

            {/* Field 2: Account Number */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Số tài khoản</span>
                <div className="font-mono font-black text-sm text-cyan-300">{qrData.bankAccount}</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('account', qrData.bankAccount, 'Số tài khoản')}
                className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/15 text-muted-foreground hover:text-white transition-colors"
                title="Sao chép số tài khoản"
              >
                {copiedKey === 'account' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {/* Field 3: Amount */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Số tiền</span>
                <div className="font-mono font-black text-sm text-[#C6FF3D]">{formatVnd(qrData.amount)}</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('amount', String(qrData.amount), 'Số tiền')}
                className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/15 text-muted-foreground hover:text-white transition-colors"
                title="Sao chép số tiền"
              >
                {copiedKey === 'amount' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {/* Field 4: Syntax */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Cú pháp bắt buộc</span>
                <div className="font-mono font-black text-xs text-amber-300 truncate">{qrData.syntax}</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('syntax', qrData.syntax, 'Cú pháp chuyển khoản')}
                className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/15 text-muted-foreground hover:text-white transition-colors"
                title="Sao chép cú pháp"
              >
                {copiedKey === 'syntax' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="text-center text-xs font-bold text-[#C6FF3D] animate-fade-in bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 py-1.5 rounded-xl">
            {toastMessage}
          </div>
        )}

        {/* 1-Click Dev Mode Simulation Button */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <button
            type="button"
            onClick={handleDevModeSimulate}
            disabled={isSimulating}
            className={`w-full py-3 px-4 rounded-xl font-heading text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] ${
              simulatedSuccess
                ? 'bg-emerald-400 text-black border-2 border-emerald-300 animate-pulse'
                : 'bg-gradient-to-r from-[#C6FF3D] via-[#3DE8FF] to-[#C6FF3D] bg-[length:200%_auto] text-black border-2 border-white/30 hover:brightness-110 active:scale-98'
            }`}
          >
            <Zap className={`h-4 w-4 ${isSimulating ? 'animate-spin' : 'animate-bounce'}`} />
            <span>
              {simulatedSuccess
                ? `🎉 ĐÃ KÍCH HOẠT THÀNH CÔNG GÓI ${activeConfig.badgeTitle.toUpperCase()}!`
                : '⚡ Giả lập thanh toán thành công (Dev Mode)'}
            </span>
          </button>

          <p className="text-[10px] text-center text-muted-foreground font-mono">
            *Dành cho giám khảo & kiểm thử: Nhấn 1-click để mở khóa tức thì mà không cần chuyển khoản thật.
          </p>
        </div>
      </div>
    </div>
  );
}
