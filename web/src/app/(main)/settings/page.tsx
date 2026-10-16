'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  Calendar,
  Cat,
  Check,
  ChevronRight,
  Download,
  Eye,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  Moon,
  Palette,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCampusStore, type VibeTheme } from '@/lib/campus-store';
import { PomodoroSupervisorSettings } from '@/features/pomodoro/pomodoro-supervisor-settings';
import { GoogleCalendarSyncCard } from '@/components/settings/google-calendar-sync-card';
import { Security2faModal } from '@/components/settings/security-2fa-modal';
import { ChangePasswordModal } from '@/components/settings/change-password-modal';

type ThemePreset = 'aurora' | 'dark' | 'light' | 'system';

interface UserSettingsPreferences {
  theme: ThemePreset;
  language: string;
  compact: boolean;
  reducedMotion: boolean;
  emailDigest: boolean;
  pushNotifications: boolean;
  deadlineAlerts: boolean;
  clubAlerts: boolean;
  dndFocusMode: boolean;
  twoFactorEnabled: boolean;
}

const defaultPreferences: UserSettingsPreferences = {
  theme: 'aurora',
  language: 'vi',
  compact: false,
  reducedMotion: false,
  emailDigest: false,
  pushNotifications: true,
  deadlineAlerts: true,
  clubAlerts: true,
  dndFocusMode: true,
  twoFactorEnabled: false,
};

const settingsSections = [
  { id: 'appearance', label: 'Giao diện & Chủ đề', icon: Palette },
  { id: 'giam-sat', label: 'Giám sát Cực Đoan', icon: Cat },
  { id: 'calendar-sync', label: 'Lịch Google & .ics', icon: Calendar },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
  { id: 'security', label: 'Bảo mật & Tài khoản', icon: ShieldCheck },
  { id: 'data', label: 'Dữ liệu & Quyền riêng tư', icon: Download },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { state: campusState, update: updateCampusStore } = useCampusStore();

  const [prefs, setPrefs] = useState<UserSettingsPreferences>(defaultPreferences);
  const [activeSection, setActiveSection] = useState('appearance');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Modals state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);

  // Read URL Hash on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (settingsSections.some((s) => s.id === hash)) {
        setActiveSection(hash);
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, []);

  // Hydrate preferences from LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('campusos-settings-v2');
      if (raw) {
        const stored = JSON.parse(raw);
        setPrefs((prev) => ({
          ...prev,
          ...stored,
          reducedMotion: campusState.reducedMotion ?? stored.reducedMotion ?? false,
        }));
      }
    } catch {
      window.localStorage.removeItem('campusos-settings-v2');
    }
    setHydrated(true);
  }, [campusState.reducedMotion]);

  // Sync theme attribute to document element
  useEffect(() => {
    if (!hydrated || typeof document === 'undefined') return;
    if (prefs.theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.removeAttribute('data-vibe');
    } else if (prefs.theme === 'aurora') {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.dataset.vibe = 'aurora';
    } else {
      document.documentElement.dataset.theme = prefs.theme;
      document.documentElement.removeAttribute('data-vibe');
    }
  }, [prefs.theme, hydrated]);

  function handleUpdatePreference<K extends keyof UserSettingsPreferences>(
    key: K,
    value: UserSettingsPreferences[K]
  ) {
    setPrefs((prev) => ({ ...prev, [key]: value }));

    // If reducedMotion changed, sync directly with campus-store
    if (key === 'reducedMotion') {
      updateCampusStore(() => ({ reducedMotion: Boolean(value) }));
    }

    // If theme changed to aurora, sync vibeTheme
    if (key === 'theme') {
      const themeVal = value as ThemePreset;
      const mappedVibe: VibeTheme = themeVal === 'aurora' ? 'aurora' : 'cyber';
      updateCampusStore(() => ({ vibeTheme: mappedVibe }));
    }

    setSavedSuccess(false);
  }

  function handleSaveAll() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('campusos-settings-v2', JSON.stringify(prefs));
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  }

  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          handleUpdatePreference('pushNotifications', true);
        } else {
          handleUpdatePreference('pushNotifications', false);
        }
      } catch {
        // Fallback
      }
    }
  };

  const handleExportAllData = () => {
    const bundle = {
      exportedAt: new Date().toISOString(),
      user: {
        fullName: user?.fullName || 'Minh Nguyễn',
        email: user?.email || 'minh.nguyen@campus.edu.vn',
      },
      preferences: prefs,
      campusState,
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campusos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative mx-auto w-full max-w-[1300px] overflow-x-hidden min-w-0 space-y-6 pb-12">
      {/* Background Ambient Aurora Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 right-1/4 h-[460px] w-[460px] rounded-full bg-violet-500/15 blur-[120px]" />
        <div className="absolute top-1/2 -left-40 h-[480px] w-[480px] rounded-full bg-cyan-500/15 blur-[130px]" />
        <div className="absolute -bottom-40 right-10 h-[450px] w-[450px] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      {/* Header Hub */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-card/40 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-violet-400/30 bg-violet-500/10 text-violet-300 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              Thiết lập cá nhân hóa
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Cài Đặt Hệ Thống
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl leading-relaxed">
              Tùy biến giao diện Cyber-Glass, đồng bộ lịch Google Calendar, quản lý bảo mật 2FA và chế độ Mèo Leo giám thị.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            className={`inline-flex items-center gap-2 h-11 px-5 rounded-xl font-bold text-xs transition-all shadow-md ${
              savedSuccess
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="h-4 w-4" /> Đã lưu thay đổi
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Lưu tất cả thay đổi
              </>
            )}
          </button>
        </div>
      </section>

      {/* Main Settings Grid: Sticky Navigation Sidebar + Content Panels */}
      <section className="grid gap-6 lg:grid-cols-[16rem_1fr] items-start">
        {/* Navigation Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-2.5 shadow-lg space-y-1">
            {settingsSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;

              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(sec.id);
                    document
                      .getElementById(sec.id)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(61,232,255,0.15)]'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{sec.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                </button>
              );
            })}
          </div>

          {/* User Account Quick Card */}
          <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-4 shadow-lg space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 text-sm font-black text-white shadow-md">
                {user?.fullName?.charAt(0) || 'M'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">
                  {user?.fullName || 'Minh Nguyễn'}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {user?.email || 'minh.nguyen@campus.edu.vn'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        </aside>

        {/* Content Panels */}
        <div className="space-y-6">
          {/* ================= 1. GIAO DIỆN & CHỦ ĐỀ ================= */}
          <div
            id="appearance"
            className="scroll-mt-24 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 sm:p-6 shadow-lg space-y-5"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Palette className="h-5 w-5 text-violet-400" />
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Giao Diện & Trải Nghiệm
                </h3>
                <p className="text-xs text-muted-foreground">
                  Lựa chọn bảng màu và hiệu ứng hiển thị tối ưu cho phiên học tập
                </p>
              </div>
            </div>

            {/* Theme Presets Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2.5">
                Chủ đề giao diện (Theme Presets)
              </label>
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { id: 'aurora', label: 'Cyber Aurora', desc: 'Neon Cyberpunk & Aurora', icon: Sparkles },
                  { id: 'dark', label: 'Dark OLED', desc: 'Đen sâu tiết kiệm pin', icon: Moon },
                  { id: 'light', label: 'Light Clean', desc: 'Sáng thanh lịch', icon: Sun },
                  { id: 'system', label: 'Theo hệ thống', desc: 'Tự động theo OS', icon: Laptop },
                ].map((th) => {
                  const Icon = th.icon;
                  const isSelected = prefs.theme === th.id;

                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => handleUpdatePreference('theme', th.id as ThemePreset)}
                      className={`flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_15px_rgba(61,232,255,0.15)] ring-1 ring-cyan-400/30'
                          : 'border-white/10 bg-slate-900/30 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                        {isSelected && <Check className="h-4 w-4 text-cyan-400" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{th.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{th.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experience Toggles */}
            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <ToggleCard
                icon={Eye}
                title="Giao diện thu gọn (Compact Mode)"
                desc="Tối ưu mật độ thông tin, giảm khoảng cách lề trên màn hình lớn."
                checked={prefs.compact}
                onChange={(val) => handleUpdatePreference('compact', val)}
              />

              <ToggleCard
                icon={Sparkles}
                title="Giảm chuyển động (Reduced Motion)"
                desc="Tắt hiệu ứng 3D Three.js và giảm hoạt ảnh theo chuẩn trợ năng."
                checked={prefs.reducedMotion}
                onChange={(val) => handleUpdatePreference('reducedMotion', val)}
              />
            </div>
          </div>

          {/* ================= 2. GIÁM SÁT CỰC ĐOAN (MÈO LEO) ================= */}
          <div id="giam-sat" className="scroll-mt-24">
            <PomodoroSupervisorSettings />
          </div>

          {/* ================= 3. ĐỒNG BỘ LỊCH GOOGLE CALENDAR ================= */}
          <div id="calendar-sync" className="scroll-mt-24">
            <GoogleCalendarSyncCard />
          </div>

          {/* ================= 4. THÔNG BÁO & NHẮC NHỞ ================= */}
          <div
            id="notifications"
            className="scroll-mt-24 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 sm:p-6 shadow-lg space-y-4"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Bell className="h-5 w-5 text-cyan-400" />
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Kênh Thông Báo & Cảnh Báo
                </h3>
                <p className="text-xs text-muted-foreground">
                  Tùy chỉnh thông báo đẩy trên trình duyệt và các mốc cảnh báo thời gian
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <ToggleCard
                icon={Smartphone}
                title="Thông báo đẩy trình duyệt (Web Push)"
                desc="Nhận chuông báo deadline và lịch học ngay cả khi đóng tab."
                checked={prefs.pushNotifications}
                onChange={(val) => {
                  if (val) handleRequestPushPermission();
                  else handleUpdatePreference('pushNotifications', false);
                }}
              />

              <ToggleCard
                icon={Bell}
                title="Cảnh báo Deadline & Lịch học khẩn cấp"
                desc="Bật đèn báo đỏ và âm thanh nhắc nhở trước khi deadline kết thúc 12 giờ."
                checked={prefs.deadlineAlerts}
                onChange={(val) => handleUpdatePreference('deadlineAlerts', val)}
              />

              <ToggleCard
                icon={UserRound}
                title="Tin tức hoạt động Câu lạc bộ"
                desc="Nhận thông báo khi CLB đã tham gia mở đơn đăng ký workshop hoặc sự kiện."
                checked={prefs.clubAlerts}
                onChange={(val) => handleUpdatePreference('clubAlerts', val)}
              />

              <ToggleCard
                icon={Moon}
                title="Không làm phiền khi đang Focus (DND)"
                desc="Tự động tắt thông báo khi đang trong phiên học Pomodoro với Mèo Leo."
                checked={prefs.dndFocusMode}
                onChange={(val) => handleUpdatePreference('dndFocusMode', val)}
              />
            </div>
          </div>

          {/* ================= 5. BẢO MẬT & TÀI KHOẢN ================= */}
          <div
            id="security"
            className="scroll-mt-24 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 sm:p-6 shadow-lg space-y-4"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Tài Khoản & Bảo Mật
                </h3>
                <p className="text-xs text-muted-foreground">
                  Quản lý mật khẩu, khóa xác thực hai lớp (2FA) và các phiên đăng nhập
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Email Display */}
              <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3.5 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-white">Email đăng nhập</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {user?.email || 'minh.nguyen@campus.edu.vn'}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-400/30 bg-emerald-500/10">
                  <Check className="h-3 w-3" /> Đã xác thực
                </span>
              </div>

              {/* Password Action Row */}
              <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-cyan-400 shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-white">Đổi mật khẩu</span>
                    <span className="text-[11px] text-muted-foreground">
                      Cập nhật lần cuối: 42 ngày trước
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 transition-colors"
                >
                  Cập nhật
                </button>
              </div>

              {/* 2FA Action Row */}
              <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="block text-xs font-bold text-white">
                        Xác thực hai bước (2FA)
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold border border-cyan-400/40 bg-cyan-500/10 text-cyan-300">
                        Khuyên dùng
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {prefs.twoFactorEnabled
                        ? 'Đang bật bảo vệ qua Google Authenticator'
                        : 'Thêm lớp mã 6 số bảo vệ khi đăng nhập'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIs2faModalOpen(true)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    prefs.twoFactorEnabled
                      ? 'border border-emerald-400/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                      : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                  }`}
                >
                  {prefs.twoFactorEnabled ? 'Quản lý' : 'Thiết lập'}
                </button>
              </div>
            </div>
          </div>

          {/* ================= 6. DỮ LIỆU & QUYỀN RIÊNG TƯ ================= */}
          <div
            id="data"
            className="scroll-mt-24 rounded-2xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 sm:p-6 shadow-lg space-y-4"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Download className="h-5 w-5 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Dữ Liệu & Quyền Riêng Tư
                </h3>
                <p className="text-xs text-muted-foreground">
                  Sao lưu toàn bộ dữ liệu học tập cá nhân hoặc đặt lại trạng thái hệ thống
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3.5 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-white">
                    Xuất toàn bộ dữ liệu cá nhân (.json)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Tải về bản sao dự phòng bao gồm nhiệm vụ, thời khóa biểu, điểm số và huy hiệu
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleExportAllData}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Tải về</span>
                </button>
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.03] p-4 space-y-2">
                <span className="block text-xs font-bold text-rose-300 uppercase tracking-wider">
                  Khu vực nhạy cảm
                </span>
                <p className="text-xs text-muted-foreground">
                  Nếu bạn gặp sự cố dữ liệu không đồng bộ, bạn có thể xóa cache bộ nhớ tạm thời trên thiết bị này.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.localStorage.removeItem('campusos-shared-v2');
                      window.location.reload();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs font-bold transition-colors"
                >
                  Đặt lại dữ liệu cache cục bộ
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Modals */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      <Security2faModal
        isOpen={is2faModalOpen}
        onClose={() => setIs2faModalOpen(false)}
        is2faEnabled={prefs.twoFactorEnabled}
        onToggle2fa={(enabled) => handleUpdatePreference('twoFactorEnabled', enabled)}
      />
    </div>
  );
}

function ToggleCard({
  icon: Icon,
  title,
  desc,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-slate-400 shrink-0" />
        <div className="min-w-0">
          <span className="block text-xs font-bold text-white truncate">{title}</span>
          <span className="text-[10px] text-muted-foreground line-clamp-1">{desc}</span>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${
          checked ? 'bg-cyan-500' : 'bg-slate-800'
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-slate-950 transition-transform ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
