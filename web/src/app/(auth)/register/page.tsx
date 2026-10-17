'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import { isValidEduVnEmail } from '@/lib/auth-validation';
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter';

function RegisterForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const emailEntered = email.trim().length > 0;
  const isEmailValid = isValidEduVnEmail(email);

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

    if (!fullName.trim()) {
      triggerShake('Vui lòng nhập họ và tên của bạn.');
      return;
    }

    if (!email.trim()) {
      triggerShake('Vui lòng nhập email sinh viên.');
      return;
    }

    if (!isValidEduVnEmail(email)) {
      triggerShake('Email phải thuộc tên miền giáo dục sinh viên .edu.vn hợp lệ.');
      return;
    }

    if (!password) {
      triggerShake('Vui lòng nhập mật khẩu.');
      return;
    }

    if (password.length < 6) {
      triggerShake('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      triggerShake('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    if (!agreeTerms) {
      triggerShake('Bạn phải đồng ý với Điều khoản Dịch vụ & Quy chuẩn Học thuật CampusOS.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        triggerShake(data.error || 'Đăng ký tài khoản không thành công. Vui lòng thử lại.');
      }
    } catch {
      triggerShake('Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
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

      {/* Card Header */}
      <div className="relative text-center mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 mb-3 shadow-[0_0_15px_rgba(61,232,255,0.2)]">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Khởi Tạo Tài Khoản Sinh Viên</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
          Đăng Ký CampusOS
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
          Gia nhập cộng đồng sinh viên thông minh với không gian số CampusOS
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
            <p className="font-semibold text-rose-300">Đăng ký chưa thành công</p>
            <p className="mt-0.5 text-rose-200/90">{error}</p>
          </div>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name Input Field */}
        <div className="space-y-1.5">
          <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Họ và tên sinh viên
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <User className="h-4 w-4" />
            </div>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Nhật Minh"
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(61,232,255,0.25)] transition-all"
            />
          </div>
        </div>

        {/* Student Email Input Field with Real-time .edu.vn Validation Badge */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Email sinh viên (.edu.vn)
            </label>
            {emailEntered && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all duration-200 ${
                  isEmailValid
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
                }`}
              >
                {isEmailValid ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span>Hợp lệ .edu.vn</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 text-amber-400" />
                    <span>Yêu cầu .edu.vn</span>
                  </>
                )}
              </span>
            )}
          </div>
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
              className={`w-full rounded-xl border bg-slate-900/60 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                emailEntered && !isEmailValid
                  ? 'border-amber-500/60 focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'border-white/10 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(61,232,255,0.25)]'
              }`}
            />
          </div>
        </div>

        {/* Password Input Field */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Mật khẩu
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

        {/* Password Strength Meter Component */}
        <div className="pt-1">
          <PasswordStrengthMeter password={password} />
        </div>

        {/* Confirm Password Field with Real-time Match Indicator */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Xác nhận mật khẩu
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

        {/* Terms of Service Checkbox */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-300 hover:text-white transition-colors">
            <input
              id="agreeTerms"
              name="agreeTerms"
              type="checkbox"
              required
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0 focus:ring-offset-slate-950 transition-all cursor-pointer accent-cyan-400 shrink-0"
            />
            <span className="leading-relaxed">
              Tôi đồng ý với{' '}
              <span className="text-cyan-400 font-medium">Điều khoản Dịch vụ</span> &amp;{' '}
              <span className="text-cyan-400 font-medium">Quy chuẩn Học thuật CampusOS</span>
            </span>
          </label>
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
                <span>Đang tạo tài khoản sinh viên...</span>
              </>
            ) : (
              <>
                <span>Đăng ký tài khoản CampusOS</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </span>
        </button>
      </form>

      {/* Navigation link to /login */}
      <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-slate-400">
        <span>Đã có tài khoản sinh viên? </span>
        <Link
          href="/login"
          className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
        >
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] w-full items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}