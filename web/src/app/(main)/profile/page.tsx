'use client';

import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Check,
  Edit3,
  Flame,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCampusStore } from '@/lib/campus-store';
import { HolographicStudentCard } from '@/components/profile/holographic-student-card';
import { CompetenceRadarChart } from '@/components/profile/competence-radar-chart';
import { AcademicCreditStats } from '@/components/profile/academic-credit-stats';
import { AchievementsShowcase } from '@/components/profile/achievements-showcase';

interface ProfileDetails {
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  major: string;
  university: string;
  cohort: string;
  bio: string;
}

const defaultProfile: ProfileDetails = {
  fullName: 'Minh Nguyễn',
  studentId: '21020485',
  email: 'minh.nguyen@campus.edu.vn',
  phone: '090 123 4567',
  major: 'Khoa học Máy tính & Kỹ thuật',
  university: 'Đại học Công nghệ - ĐHQGHN',
  cohort: 'K66-CACLC2',
  bio: 'Sinh viên năm 3 đam mê lập trình Web, Hệ thống phân tán và Trí tuệ nhân tạo. Luôn cố gắng dọn sạch Deadline trước 23h!',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { state: campusState } = useCampusStore();

  const [profile, setProfile] = useState<ProfileDetails>(defaultProfile);
  const [draft, setDraft] = useState<ProfileDetails>(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('campusos-profile-v1');
    const savedAvatar = window.localStorage.getItem('campusos-profile-avatar-v1');

    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    }

    if (saved) {
      try {
        const stored = JSON.parse(saved) as ProfileDetails;
        setProfile(stored);
        setDraft(stored);
        return;
      } catch {
        window.localStorage.removeItem('campusos-profile-v1');
      }
    }

    if (user) {
      const authProfile: ProfileDetails = {
        ...defaultProfile,
        fullName: user.fullName || defaultProfile.fullName,
        email: user.email || defaultProfile.email,
      };
      setProfile(authProfile);
      setDraft(authProfile);
    }
  }, [user]);

  function handleSaveProfile() {
    const updated: ProfileDetails = {
      ...draft,
      fullName: draft.fullName.trim() || profile.fullName,
    };
    setProfile(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('campusos-profile-v1', JSON.stringify(updated));
    }
    setEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  }

  function handleCancelEdit() {
    setDraft(profile);
    setEditing(false);
  }

  function handleAvatarChange(newUrl: string) {
    setAvatarUrl(newUrl);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('campusos-profile-avatar-v1', newUrl);
      } catch {
        // Handle storage quota if any
      }
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-[1400px] overflow-x-hidden min-w-0 space-y-6 pb-12">
      {/* Background Fluid Ambient Aurora Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-purple-500/15 blur-[130px]" />
        <div className="absolute -bottom-40 left-1/4 h-[460px] w-[460px] rounded-full bg-emerald-500/15 blur-[120px]" />
      </div>

      {/* Top Banner / Student Identity Hero Section */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-card/40 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Holographic 3D Tilt Student Card */}
          <div className="w-full lg:w-auto shrink-0 flex justify-center">
            <HolographicStudentCard
              profile={{
                fullName: profile.fullName,
                studentId: profile.studentId,
                email: profile.email,
                major: profile.major,
                university: profile.university,
                cohort: profile.cohort,
                avatarUrl,
              }}
              onAvatarChange={handleAvatarChange}
              reducedMotion={campusState.reducedMotion}
            />
          </div>

          {/* Student Overview & Stats */}
          <div className="flex-1 min-w-0 space-y-5 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-cyan-400/40 bg-cyan-500/10 text-cyan-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    CampusOS Citizen
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-400/40 bg-emerald-500/10 text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Sinh viên chính quy
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight truncate">
                  {profile.fullName}
                </h1>
                <p className="text-sm text-cyan-200/80 font-medium mt-1">
                  {profile.major} · {profile.university}
                </p>
              </div>

              {/* Edit Profile Action Button */}
              <button
                type="button"
                onClick={() => (editing ? handleCancelEdit() : setEditing(true))}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors self-start sm:self-auto ${
                  editing
                    ? 'border border-white/20 bg-white/10 text-slate-200 hover:bg-white/20'
                    : 'border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                }`}
              >
                {editing ? (
                  <>
                    <X className="h-4 w-4" /> Hủy chỉnh sửa
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4" /> Chỉnh sửa hồ sơ
                  </>
                )}
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
                  <GraduationCap className="h-4 w-4" /> CPA Tích lũy
                </div>
                <p className="mt-1 font-mono text-xl font-black text-white">3.62</p>
                <span className="text-[10px] text-muted-foreground">Thang điểm 4.0</span>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
                <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold">
                  <Zap className="h-4 w-4" /> Cấp độ (Level)
                </div>
                <p className="mt-1 font-mono text-xl font-black text-white">
                  {campusState.level || 7}
                </p>
                <span className="text-[10px] text-muted-foreground truncate block">
                  {campusState.rankTitle || 'Sinh viên cày thuê'}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                  <Flame className="h-4 w-4" /> Chuỗi học tập
                </div>
                <p className="mt-1 font-mono text-xl font-black text-white">
                  {campusState.streak || 12} ngày
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {campusState.streakFreezes ? `${campusState.streakFreezes} khiên bảo vệ` : 'Không gián đoạn'}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <Trophy className="h-4 w-4" /> Điểm kinh nghiệm
                </div>
                <p className="mt-1 font-mono text-xl font-black text-white">
                  {campusState.xp || 2750} XP
                </p>
                <span className="text-[10px] text-muted-foreground">Vinh danh sinh viên</span>
              </div>
            </div>

            {/* Bio Quote */}
            <p className="text-xs sm:text-sm text-slate-300 italic rounded-xl border border-white/5 bg-white/[0.02] p-3.5 leading-relaxed">
              &ldquo;{profile.bio}&rdquo;
            </p>
          </div>
        </div>

        {/* Inline Profile Editing Drawer/Form */}
        {editing && (
          <div className="mt-6 pt-6 border-t border-white/10 animate-in fade-in space-y-4">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <UserRound className="h-4 w-4" /> Chỉnh sửa thông tin cá nhân
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={draft.fullName}
                  onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Mã sinh viên (MSSV)
                </label>
                <input
                  type="text"
                  value={draft.studentId}
                  onChange={(e) => setDraft({ ...draft, studentId: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Chuyên ngành
                </label>
                <input
                  type="text"
                  value={draft.major}
                  onChange={(e) => setDraft({ ...draft, major: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Trường đại học
                </label>
                <input
                  type="text"
                  value={draft.university}
                  onChange={(e) => setDraft({ ...draft, university: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Lớp khóa học
                </label>
                <input
                  type="text"
                  value={draft.cohort}
                  onChange={(e) => setDraft({ ...draft, cohort: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Giới thiệu bản thân (Bio)
                </label>
                <textarea
                  rows={2}
                  value={draft.bio}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 border border-white/15 hover:bg-white/10"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md"
              >
                <Save className="h-4 w-4" /> Lưu thông tin
              </button>
            </div>
          </div>
        )}

        {/* Save feedback toast */}
        {savedSuccess && (
          <div className="mt-4 p-2.5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="h-4 w-4" />
            Đã lưu thông tin hồ sơ thành công vào bộ nhớ hệ thống.
          </div>
        )}
      </section>

      {/* Mid Section: Academic Progress & Competence Radar */}
      <section className="grid gap-6 lg:grid-cols-2">
        <AcademicCreditStats
          completedCredits={94}
          totalCredits={135}
          cpa={3.62}
        />
        <CompetenceRadarChart />
      </section>

      {/* Bottom Section: Achievements Showcase */}
      <section>
        <AchievementsShowcase storeState={campusState} />
      </section>
    </div>
  );
}
