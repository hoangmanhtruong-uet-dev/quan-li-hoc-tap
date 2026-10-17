'use client';

import { Suspense, useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { DEMO_STUDENT_CREDENTIALS } from '@/lib/auth-validation';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const bannedReason = searchParams.get('reason') === 'banned';
  const registeredSuccess = searchParams.get('registered') === 'true';

  // Load remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('campusos_remember_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // Ignore localStorage access restrictions
    }
  }, []);

  function triggerShake(errorMessage: string) {
    setError(errorMessage);
    setShake(true);
    setTimeout(() => {
      setShake(false);
    }, 750);
  }

  async function executeLogin(targetEmail: string, targetPassword: string, isDemo = false) {
    setError('');
    if (isDemo) {
      setDemoLoading(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        try {
          if (rememberMe) {
            localStorage.setItem('campusos_remember_email', targetEmail);
          } else {
            localStorage.removeItem('campusos_remember_email');
          }
        } catch {
          // Ignore localStorage errors
        }

        if (data.needsOnboarding) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      } else {
        const data = await res.json();
        triggerShake(data.error || 'Email hoặc mật khẩu không chính xác.');
      }
    } catch {
      triggerShake('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
      setDemoLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !password) {
      triggerShake('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }
    await executeLogin(email.trim(), password);
  }

  async function handleDemoLogin() {
    setEmail(DEMO_STUDENT_CREDENTIALS.email);
    setPassword(DEMO_STUDENT_CREDENTIALS.password);
    await executeLogin(DEMO_STUDENT_CREDENTIALS.email, DEMO_STUDENT_CREDENTIALS.password, true);
  }

  async function handleSocialLogin(provider: 'google' | 'github') {
    setError('');
    setSocialLoading(provider);

    try {
      if (isSupabaseConfigured()) {
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (oauthError) {
          triggerShake(oauthError.message);
        }
      } else {
        // Graceful offline mock fallback
        const mockEmail = `${provider}.demo@campus.edu.vn`;
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: mockEmail,
            password: 'Demo@123456',
          }),
        });

        if (res.ok) {
          router.push('/dashboard');
        } else {
          const data = await res.json();
          triggerShake(data.error || `Đăng nhập qua ${provider} không thành công`);
        }
      }
    } catch (err: any) {
      triggerShake(err?.message || `Lỗi kết nối với cổng xác thực ${provider}`);
    } finally {
      setSocialLoading(null);
    }
  }

  return (
    <div
      className={`w-full max-w-md backdrop-blur-2xl bg-card/60 border border-white/10 shadow-[0_0_50px_rgba(61,232,255,0.15)] rounded-3xl p-6 sm:p-8 transition-all duration-300 relative ${
        shake ? 'animate-panic-shake border-rose-500/80 shadow-[0_0_40px_rgba(244,63,94,0.35)]' : ''
      }`}
    >
      {/* Glow highlight */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl" />

      {/* Card Header */}
      <div className="relative text-center mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 mb-3 shadow-[0_0_15px_rgba(61,232,255,0.2)]">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Cổng Xác Thực Sinh Viên</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
          Đăng Nhập CampusOS
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
          Tiếp tục hành trình học tập bứt phá cùng AI Companion
        </p>
      </div>

      {/* 1-Click Demo Login Button */}
      <div className="relative mb-6">
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading || demoLoading}
          aria-label="Đăng nhập nhanh Demo 1-Click"
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 p-[1.5px] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(251,191,36,0.45)] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
        >
          <div className="flex items-center justify-between gap-3 rounded-[15px] bg-slate-950/90 px-4 py-3 transition-colors group-hover:bg-slate-950/75">
            <div className="flex items-center gap-3 text-left">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-black text-slate-950 shadow-md shadow-amber-500/30">
                ⚡
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-extrabold text-amber-300">
                    ⚡ Đăng nhập nhanh Demo 1-Click
                  </span>
                  <span className="rounded bg-amber-400/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-200">
                    VIP
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {demoLoading ? 'Đang kích hoạt phiên sinh viên mẫu...' : 'minh.nguyen@campus.edu.vn · Không cần gõ'}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-amber-400 transition-transform group-hover:translate-x-1" />
          </div>
        </button>
      </div>

      {/* Social OAuth Buttons */}
      <div className="space-y-3 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {/* Google Button */}
          <button
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={loading || Boolean(socialLoading)}
            aria-label="Đăng nhập bằng Google"
            className="flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-slate-900/60 py-2.5 px-3 text-xs font-semibold text-slate-200 transition-all hover:border-cyan-400/40 hover:bg-slate-800/80 hover:shadow-[0_0_15px_rgba(61,232,255,0.15)] disabled:opacity-50"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{socialLoading === 'google' ? 'Đang xác thực...' : 'Google'}</span>
          </button>

          {/* GitHub Button */}
          <button
            type="button"
            onClick={() => handleSocialLogin('github')}
            disabled={loading || Boolean(socialLoading)}
            aria-label="Đăng nhập bằng GitHub"
            className="flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-slate-900/60 py-2.5 px-3 text-xs font-semibold text-slate-200 transition-all hover:border-cyan-400/40 hover:bg-slate-800/80 hover:shadow-[0_0_15px_rgba(61,232,255,0.15)] disabled:opacity-50"
          >
            <svg className="h-4 w-4 shrink-0 fill-current text-white" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>{socialLoading === 'github' ? 'Đang xác thực...' : 'GitHub'}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative bg-[#0d1424] px-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            hoặc qua email
          </span>
        </div>
      </div>

      {/* Account Suspended Alert Banner */}
      {bannedReason && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-950/60 p-3.5 text-xs text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.25)] animate-slide-up"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-300">Tài khoản bị tạm ngưng</p>
            <p className="mt-0.5 text-rose-200/90">
              Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản trị CampusOS để được hỗ trợ.
            </p>
          </div>
        </div>
      )}

      {/* Registration Success Notification Banner */}
      {registeredSuccess && (
        <div
          role="status"
          className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/60 p-3.5 text-xs text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-slide-up"
        >
          <div className="h-2 w-2 rounded-full bg-emerald-400 mt-1.5 animate-pulse" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-300">Đăng ký thành công</p>
            <p className="mt-0.5 text-emerald-200/90">
              Vui lòng đăng nhập bằng tài khoản sinh viên vừa tạo để bắt đầu.
            </p>
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
            <p className="font-semibold text-rose-300">Đăng nhập không thành công</p>
            <p className="mt-0.5 text-rose-200/90">{error}</p>
          </div>
        </div>
      )}

      {/* Main Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input Field */}
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

        {/* Password Input Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Mật khẩu
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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

        {/* Remember Me Checkbox */}
        <div className="flex items-center pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300 hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0 focus:ring-offset-slate-950 transition-all cursor-pointer accent-cyan-400"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || demoLoading}
          className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 py-3 px-4 font-bold text-white shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(6,182,212,0.55)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
        >
          <span className="relative z-10 flex items-center justify-center gap-2 text-sm">
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Đang xử lý đăng nhập...</span>
              </>
            ) : (
              <>
                <span>Đăng nhập vào CampusOS</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </span>
        </button>
      </form>

      {/* Card Footer: Navigation Link to /register */}
      <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-slate-400">
        <span>Chưa có tài khoản sinh viên? </span>
        <Link
          href="/register"
          className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
        >
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] w-full items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}