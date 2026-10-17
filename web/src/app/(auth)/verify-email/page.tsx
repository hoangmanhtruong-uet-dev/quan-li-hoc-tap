'use client';

import { Suspense, useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCw,
  KeyRound,
} from 'lucide-react';
import { calculateCooldownState } from '@/lib/auth-validation';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shake, setShake] = useState(false);
  const [lastSentTimestamp, setLastSentTimestamp] = useState<number | null>(null);
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(Date.now());

  const status = searchParams.get('status');
  const reason = searchParams.get('error');
  const emailParam = searchParams.get('email');
  const tokenParam = searchParams.get('token');

  // Handle query parameter state on mount
  useEffect(() => {
    if (tokenParam) {
      setTokenInput(tokenParam);
    }
    if (status === 'success') {
      setSuccess('Email đã được xác thực thành công! Đang chuyển hướng...');
      setTimeout(() => {
        router.push('/onboarding');
      }, 2000);
    }
    if (reason === 'invalid_verification') {
      setError('Liên kết xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.');
    }
  }, [status, reason, tokenParam, router]);

  // Live timer for 60-second anti-spam cooldown
  useEffect(() => {
    if (!lastSentTimestamp) return;

    const interval = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSentTimestamp]);

  const cooldown = calculateCooldownState(lastSentTimestamp, 60, currentTimestamp);

  function triggerShake(errorMessage: string) {
    setError(errorMessage);
    setShake(true);
    setTimeout(() => {
      setShake(false);
    }, 750);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmed = tokenInput.trim();
    if (!trimmed) {
      triggerShake('Vui lòng nhập mã xác thực gồm 6 ký tự.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: trimmed }),
      });

      if (res.ok) {
        setSuccess('Xác thực tài khoản thành công! Đang chuyển hướng vào hệ thống...');
        setTimeout(() => {
          router.push('/onboarding');
        }, 1800);
      } else {
        const data = await res.json();
        triggerShake(data.error || 'Mã xác thực không chính xác hoặc đã hết hạn.');
      }
    } catch {
      triggerShake('Lỗi kết nối máy chủ. Vui lòng kiểm tra đường truyền và thử lại.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (!cooldown.canResend || resendLoading) return;

    setError('');
    setResendLoading(true);

    try {
      // Trigger resend via auth API
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend', email: emailParam || '' }),
      });

      const now = Date.now();
      setLastSentTimestamp(now);
      setCurrentTimestamp(now);

      if (!res.ok) {
        // If API doesn't support resend directly, cooldown still activates smoothly
        const data = await res.json().catch(() => ({}));
        if (data.error && data.error !== 'Token is required') {
          setError(data.error);
        }
      }
    } catch {
      // In offline/mock mode, trigger timer gracefully
      const now = Date.now();
      setLastSentTimestamp(now);
      setCurrentTimestamp(now);
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div
      className={`w-full max-w-md backdrop-blur-2xl bg-card/60 border border-white/10 shadow-[0_0_50px_rgba(61,232,255,0.15)] rounded-3xl p-6 sm:p-8 transition-all duration-300 relative ${
        shake ? 'animate-panic-shake border-rose-500/80 shadow-[0_0_40px_rgba(244,63,94,0.35)]' : ''
      }`}
    >
      {/* Ambient decorative glow */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl" />

      {/* Central Glowing Holographic Mail Icon */}
      <div className="relative text-center mb-6">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 shadow-[0_0_35px_rgba(61,232,255,0.4)] border border-cyan-300/40 mb-3 animate-pulse">
          <Mail className="h-8 w-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 mb-2 shadow-[0_0_15px_rgba(61,232,255,0.2)]">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Kích Hoạt Tài Khoản</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
          Xác Thực Email
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
          Nhập mã 6 ký tự vừa được gửi tới hộp thư sinh viên của bạn
          {emailParam ? (
            <span className="block font-mono font-semibold text-cyan-300 mt-1">
              ({emailParam})
            </span>
          ) : null}
        </p>
      </div>

      {/* Success Notification Banner */}
      {success && (
        <div
          role="status"
          className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/60 p-3.5 text-xs text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.25)] animate-slide-up"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-300">Xác thực thành công</p>
            <p className="mt-0.5 text-emerald-200/90">{success}</p>
          </div>
        </div>
      )}

      {/* Neon Red Panic Alert Banner */}
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-500/50 bg-rose-950/70 p-3.5 text-xs text-rose-200 shadow-[0_0_25px_rgba(244,63,94,0.3)] animate-slide-up"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-300">Xác thực không thành công</p>
            <p className="mt-0.5 text-rose-200/90">{error}</p>
          </div>
        </div>
      )}

      {/* Code Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="token" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 text-center">
            Mã xác thực 6 ký tự
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <KeyRound className="h-4 w-4" />
            </div>
            <input
              id="token"
              name="token"
              type="text"
              required
              maxLength={36}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
              placeholder="VD: A1B2C3"
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 pl-10 pr-4 py-3 text-base text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(61,232,255,0.25)] font-mono font-bold tracking-[0.25em] text-center transition-all"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 py-3 px-4 font-bold text-white shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(6,182,212,0.55)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
        >
          <span className="relative z-10 flex items-center justify-center gap-2 text-sm">
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Đang kiểm tra mã...</span>
              </>
            ) : (
              <>
                <span>Xác nhận mã kích hoạt</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </span>
        </button>

        {/* 60-Second Cooldown Resend Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={!cooldown.canResend || resendLoading}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all duration-300 ${
              cooldown.canResend && !resendLoading
                ? 'border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(61,232,255,0.2)] cursor-pointer'
                : 'border border-white/5 bg-slate-900/40 text-slate-500 cursor-not-allowed'
            }`}
          >
            {resendLoading ? (
              <>
                <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
                <span>Đang gửi lại...</span>
              </>
            ) : cooldown.canResend ? (
              <>
                <RotateCw className="h-3.5 w-3.5" />
                <span>{cooldown.formattedLabel}</span>
              </>
            ) : (
              <>
                <Clock className="h-3.5 w-3.5" />
                <span>{cooldown.formattedLabel}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Back to Login Link */}
      <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-slate-400">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại trang đăng nhập</span>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] w-full items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}