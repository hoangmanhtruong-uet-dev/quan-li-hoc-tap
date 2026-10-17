'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Check,
  X,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [done, setDone] = useState(false);

  const confirmEntered = confirmPassword.length > 0;
  const passwordsMatch = Boolean(password && confirmPassword && password === confirmPassword);

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

    if (!token) {
      triggerShake('Mã xác thực không hợp lệ hoặc đã hết hạn.');
      return;
    }

    if (!password) {
      triggerShake('Vui lòng nhập mật khẩu mới.');
      return;
    }

    if (password.length < 6) {
      triggerShake('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      triggerShake('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setDone(true);
        setTimeout(() => {
          router.push('/login');
        }, 2500);
      } else {
        const data = await res.json();
        triggerShake(data.error || 'Đặt lại mật khẩu không thành công. Liên kết có thể đã hết hạn.');
      }
    } catch {
      triggerShake('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }

  // State 1: Missing or invalid token link
  if (!token) {
    return (
      <div className="w-full max-w-md backdrop-blur-2xl bg-card/60 border border-white/10 shadow-[0_0_50px_rgba(61,232,255,0.15)] rounded-3xl p-6 sm:p-8 text-center relative">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-slate-950 shadow-lg shadow-rose-500/25 mb-4">
          <ShieldAlert className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white font-display">
          Liên Kết Không Hợp Lệ
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
          Đường dẫn đặt lại mật khẩu thiếu mã thông báo bảo mật (token) hoặc đã hết thời gian hiệu lực.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href="/forgot-password"
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 px-4 text-xs font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all"
          >
            Yêu cầu liên kết mới
          </Link>
          <Link
            href="/login"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors py-1"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  // State 2: Success Confirmation View
  if (done) {
    return (
      <div className="w-full max-w-md backdrop-blur-2xl bg-card/60 border border-white/10 shadow-[0_0_50px_rgba(61,232,255,0.15)] rounded-3xl p-6 sm:p-8 text-center relative animate-fade-in">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/25 mb-4">
          <CheckCircle2 className="h-7 w-7 text-slate-950" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white font-display">
          Đặt Lại Mật Khẩu Thành Công!
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
          Mật khẩu tài khoản sinh viên của bạn đã được cập nhật an toàn. Đang chuyển hướng về trang đăng nhập...
        </p>
        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 px-5 text-xs font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.35)]"
          >
            <span>Đăng nhập ngay</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // State 3: Active Reset Password Form
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
          <span>Bảo Mật Tài Khoản</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
          Đặt Lại Mật Khẩu
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
          Nhập mật khẩu mới an toàn cho tài khoản sinh viên CampusOS
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
            <p className="font-semibold text-rose-300">Không thể đặt lại mật khẩu</p>
            <p className="mt-0.5 text-rose-200/90">{error}</p>
          </div>
        </div>
      )}

      {/* Reset Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password Input Field */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Mật khẩu mới
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 pl-10 pr-11 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(61,232,255,0.25)] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Embedded Password Strength Meter */}
        <div className="pt-1">
          <PasswordStrengthMeter password={password} />
        </div>

        {/* Confirm New Password Input Field */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Xác nhận mật khẩu mới
            </label>
            {confirmEntered && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all duration-200 ${
                  passwordsMatch
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'border border-rose-500/30 bg-rose-500/10 text-rose-300'
                }`}
              >
                {passwordsMatch ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span>Khớp mật khẩu</span>
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3 text-rose-400" />
                    <span>Chưa khớp</span>
                  </>
                )}
              </span>
            )}
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className={`w-full rounded-xl border bg-slate-900/60 pl-10 pr-11 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                confirmEntered && !passwordsMatch
                  ? 'border-rose-500/60 focus:border-rose-400 focus:shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                  : 'border-white/10 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(61,232,255,0.25)]'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 py-3 px-4 font-bold text-white shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(6,182,212,0.55)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none mt-2"
        >
          <span className="relative z-10 flex items-center justify-center gap-2 text-sm">
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Đang cập nhật mật khẩu...</span>
              </>
            ) : (
              <>
                <span>Xác nhận đặt lại mật khẩu</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </span>
        </button>
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] w-full items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}