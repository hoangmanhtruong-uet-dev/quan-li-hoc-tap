'use client';

import { Suspense, useState, useEffect, FormEvent } from 'react';
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
} from 'lucide-react';
import { isValidEduVnEmail, calculateCooldownState } from '@/lib/auth-validation';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [lastSentTimestamp, setLastSentTimestamp] = useState<number | null>(null);
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(Date.now());

  // Tick every second to drive live cooldown countdown
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

  async function sendResetLink(targetEmail: string) {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });

      if (res.ok) {
        setSent(true);
        const now = Date.now();
        setLastSentTimestamp(now);
        setCurrentTimestamp(now);
      } else {
        const data = await res.json();
        triggerShake(data.error || 'Không thể gửi liên kết khôi phục. Vui lòng kiểm tra lại.');
      }
    } catch {
      triggerShake('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      triggerShake('Vui lòng nhập email sinh viên của bạn.');
      return;
    }

    if (!isValidEduVnEmail(trimmedEmail)) {
      triggerShake('Vui lòng nhập đúng định dạng email sinh viên (.edu.vn).');
      return;
    }

    await sendResetLink(trimmedEmail);
  }

  async function handleResend() {
    if (!cooldown.canResend || loading) return;
    await sendResetLink(email.trim());
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

      {/* Card Header */}
      <div className="relative text-center mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 mb-3 shadow-[0_0_15px_rgba(61,232,255,0.2)]">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Khôi Phục Quyền Truy Cập</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
          Quên Mật Khẩu
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
          Nhập email sinh viên .edu.vn để nhận liên kết thiết lập lại mật khẩu
        </p>
      </div>

      {/* Neon Red Panic Alert Banner */}
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-500/50 bg-rose-950/70 p-3.5 text-xs text-rose-200 shadow-[0_0_25px_rgba(244,63,94,0.3)] animate-slide-up"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-300">Yêu cầu không thành công</p>
            <p className="mt-0.5 text-rose-200/90">{error}</p>
          </div>
        </div>
      )}

      {/* State A: Email Sent Confirmation View with 60-Second Cooldown */}
      {sent ? (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/25 mb-3">
              <CheckCircle2 className="h-7 w-7 text-slate-950" />
            </div>
            <h2 className="text-lg font-bold text-white font-display">Kiểm tra hộp thư đến</h2>
            <p className="text-xs text-slate-300 mt-1.5 max-w-xs leading-relaxed">
              Nếu tài khoản tồn tại, hệ thống đã gửi liên kết khôi phục tới:
            </p>
            <p className="text-xs font-mono font-bold text-cyan-300 mt-1 bg-slate-900/80 px-3 py-1 rounded-lg border border-white/10">
              {email}
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              Vui lòng kiểm tra cả mục Spam hoặc Quảng cáo nếu chưa thấy thư.
            </p>
          </div>

          {/* Interactive 60s Cooldown Resend Section */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={!cooldown.canResend || loading}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold transition-all duration-300 ${
                cooldown.canResend && !loading
                  ? 'border border-cyan-400/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(61,232,255,0.25)] cursor-pointer'
                  : 'border border-white/5 bg-slate-900/40 text-slate-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
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

            <button
              type="button"
              onClick={() => {
                setSent(false);
                setError('');
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors py-1"
            >
              Nhập email khác
            </button>
          </div>
        </div>
      ) : (
        /* State B: Email Entry Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Email sinh viên (.edu.vn)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sinhvien@campus.edu.vn"
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(61,232,255,0.25)] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 py-3 px-4 font-bold text-white shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(6,182,212,0.55)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none mt-2"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-sm">
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Đang gửi liên kết...</span>
                </>
              ) : (
                <>
                  <span>Gửi liên kết đặt lại mật khẩu</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </span>
          </button>
        </form>
      )}

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

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] w-full items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}