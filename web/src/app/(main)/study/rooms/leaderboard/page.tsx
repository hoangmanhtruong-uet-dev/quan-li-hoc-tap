'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  getWeeklyStudyLeaderboard,
  listStudyRooms,
  getStudyRoomMembers,
  type LeaderboardStudent,
  type StudyRoomMemberWithProfile,
} from '@/lib/study-rooms-service';
import { MemberHoloGrid, type MemberHoloItem } from '@/components/study/member-holo-grid';
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Clock,
  Sparkles,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Zap,
  Users,
  Shield,
  Star,
  Award,
  ChevronRight,
  TrendingUp,
  X,
} from 'lucide-react';

// Dynamic import with SSR false for Three.js 3D canvas
const Leaderboard3DArena = dynamic(
  () => import('@/components/study/leaderboard-3d-arena'),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-[400px] sm:h-[460px] overflow-hidden rounded-3xl border border-white/10 bg-card/30 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-pulse">
        <Trophy className="h-12 w-12 text-amber-400/40 mb-3 animate-spin" />
        <div className="text-sm font-bold text-slate-300">Đang khởi tạo Sân Khấu 3D Three.js...</div>
        <div className="text-xs text-slate-500 mt-1">Chuẩn bị bục vinh danh và hiệu ứng pháo hoa neon</div>
      </div>
    ),
  }
);

type TimePeriod = 'week' | 'month' | 'all_time';

export default function WeeklyLeaderboardArenaPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardStudent[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<StudyRoomMemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<LeaderboardStudent | null>(null);
  const [pokedMessage, setPokedMessage] = useState<string | null>(null);

  // Load Leaderboard data and live online members
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [lbData, rooms] = await Promise.all([
          getWeeklyStudyLeaderboard(),
          listStudyRooms({ is_active: true }),
        ]);

        if (!isMounted) return;
        setLeaderboard(lbData);

        // Fetch members from active rooms to populate the holographic stage
        if (rooms && rooms.length > 0) {
          const membersPromises = rooms.slice(0, 3).map((r) => getStudyRoomMembers(r.id));
          const membersArrays = await Promise.all(membersPromises);
          const flattened = membersArrays.flat();
          // Remove duplicates
          const seen = new Set<string>();
          const uniqueMembers = flattened.filter((m) => {
            if (seen.has(m.user_id)) return false;
            seen.add(m.user_id);
            return true;
          });
          setOnlineMembers(uniqueMembers);
        }
      } catch (err) {
        console.error('Failed to load leaderboard data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Top 3 Podium Students
  const top3 = useMemo(() => {
    return leaderboard.slice(0, 3);
  }, [leaderboard]);

  const rank1 = top3[0];
  const rank2 = top3[1];
  const rank3 = top3[2];

  // Filtered leaderboard table
  const filteredRankings = useMemo(() => {
    let list = leaderboard;

    // Simulate adjustments for period toggle
    if (timePeriod === 'month') {
      list = list.map((s, idx) => ({
        ...s,
        totalFocusHours: Math.round(s.totalFocusHours * 3.8 * 10) / 10,
        completedSessions: Math.round(s.completedSessions * 3.8),
      }));
    } else if (timePeriod === 'all_time') {
      list = list.map((s, idx) => ({
        ...s,
        totalFocusHours: Math.round(s.totalFocusHours * 12.5 * 10) / 10,
        completedSessions: Math.round(s.completedSessions * 12.5),
      }));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rankTitle.toLowerCase().includes(q) ||
          s.badge.toLowerCase().includes(q)
      );
    }

    return list;
  }, [leaderboard, timePeriod, searchQuery]);

  // Overall Statistics computed
  const stats = useMemo(() => {
    const totalHours = leaderboard.reduce((acc, s) => acc + s.totalFocusHours, 0);
    const totalSessions = leaderboard.reduce((acc, s) => acc + s.completedSessions, 0);
    const topHours = rank1?.totalFocusHours || 1;
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      totalSessions,
      topHours,
      activeChampions: leaderboard.length,
    };
  }, [leaderboard, rank1]);

  const handlePokeMember = (member: MemberHoloItem) => {
    setPokedMessage(`Đã gửi lời cổ vũ đến ${member.name}! 🔥`);
    setTimeout(() => setPokedMessage(null), 3000);
  };

  return (
    <div className="relative min-h-screen space-y-8 pb-16 overflow-x-hidden min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* Toast Notification for Member Poke */}
      {pokedMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl border border-cyan-400/50 bg-slate-900/95 px-4 py-2.5 text-xs font-bold text-cyan-200 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl animate-fade-in flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>{pokedMessage}</span>
        </div>
      )}

      {/* 1. Header Navigation & Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Link
              href="/study/rooms"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Sảnh phòng học</span>
            </Link>

            <span className="text-slate-600">/</span>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-0.5 text-[11px] font-black text-amber-300">
              <Trophy className="h-3 w-3 text-amber-400" />
              <span>ĐẤU TRƯỜNG VINH DANH</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white font-display">
            Bảng Vinh Danh Đấu Trường Tuần
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Tôn vinh các chiến thần cày cuốc có số giờ tập trung cao nhất tuần. Đặt lại vào{' '}
            <strong className="text-amber-300 font-mono">Chủ Nhật 23:59</strong>.
          </p>
        </div>

        {/* Global Hub Metric Badges */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-3 text-center min-w-[90px]">
            <div className="text-xs font-bold text-slate-400">Tổng giờ tuần</div>
            <div className="text-lg font-black font-mono text-cyan-300 mt-0.5">
              {stats.totalHours}h
            </div>
          </div>
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 backdrop-blur-xl p-3 text-center min-w-[90px]">
            <div className="text-xs font-bold text-amber-300">Kỷ lục #1</div>
            <div className="text-lg font-black font-mono text-amber-200 mt-0.5">
              {rank1 ? `${rank1.totalFocusHours}h` : '0h'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Three.js 3D Podium Arena Canvas */}
      <section className="space-y-2">
        <Leaderboard3DArena
          topStudents={leaderboard}
          onSelectStudent={(student) => setSelectedStudent(student)}
        />
      </section>

      {/* 3. Top 3 Spotlight Cards (Gold, Silver, Bronze) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-black text-white font-display">
              TOP 3 CHIẾN THẦN TIÊU BIỂU
            </h2>
          </div>
          <div className="text-xs text-slate-400">Nhấp vào thẻ để xem huy hiệu</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rank 2: Silver Card */}
          {rank2 && (
            <div
              onClick={() => setSelectedStudent(rank2)}
              className="relative overflow-hidden rounded-3xl border border-slate-300/40 bg-card/40 backdrop-blur-2xl p-5 shadow-xl shadow-slate-950/40 hover:scale-[1.02] hover:border-slate-200 cursor-pointer transition-all duration-300 group"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-slate-300/10 blur-2xl" />
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-xl border border-slate-300/40 bg-slate-300/10 px-2.5 py-1 text-xs font-black text-slate-200">
                  <Medal className="h-3.5 w-3.5 text-slate-300" /> 🥈 Á QUÂN TUẦN
                </span>
                <span className="text-[11px] font-mono text-cyan-300 font-bold">HẠNG #2</span>
              </div>

              <div className="mt-4 flex items-center gap-3.5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-300/60 bg-slate-800/80 text-lg font-black text-slate-200 shadow-inner group-hover:scale-105 transition-transform">
                  {rank2.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-white truncate group-hover:text-cyan-200">
                    {rank2.name}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">{rank2.rankTitle}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 mt-1 font-semibold">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    {rank2.badge}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
                <div>
                  <div className="text-[11px] text-slate-400">Giờ Focus</div>
                  <div className="text-sm font-black font-mono text-cyan-300">
                    {rank2.totalFocusHours}h
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Số phiên</div>
                  <div className="text-sm font-black font-mono text-white">
                    {rank2.completedSessions}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Streak</div>
                  <div className="text-sm font-black font-mono text-amber-400 flex items-center justify-center gap-0.5">
                    <Flame className="h-3.5 w-3.5 text-amber-400" />
                    {rank2.currentStreakDays}d
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rank 1: Gold Champion Card */}
          {rank1 && (
            <div
              onClick={() => setSelectedStudent(rank1)}
              className="relative overflow-hidden rounded-3xl border-2 border-amber-400 bg-amber-500/10 backdrop-blur-2xl p-6 shadow-2xl shadow-amber-950/50 hover:scale-[1.03] hover:border-amber-300 cursor-pointer transition-all duration-300 group md:-translate-y-2"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-400/20 blur-3xl animate-pulse" />
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/60 bg-amber-500/25 px-3 py-1 text-xs font-black text-amber-200">
                  <Crown className="h-4 w-4 text-amber-400 animate-bounce" /> 👑 QUÁN QUÂN TUẦN
                </span>
                <span className="rounded-full bg-amber-400/20 border border-amber-400/50 px-2 py-0.5 text-xs font-black font-mono text-amber-300">
                  CHAMPION
                </span>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-400 bg-amber-600/30 text-xl font-black text-amber-100 shadow-xl shadow-amber-950/60 group-hover:scale-110 transition-transform">
                  {rank1.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-amber-200 truncate group-hover:text-amber-100">
                    {rank1.name}
                  </h3>
                  <p className="text-xs text-amber-300/80 font-bold truncate">{rank1.rankTitle}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-amber-300 mt-1 font-black">
                    <Trophy className="h-3.5 w-3.5 text-amber-400" />
                    {rank1.badge}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-amber-400/20 pt-4 text-center">
                <div>
                  <div className="text-[11px] text-slate-300">Giờ Focus</div>
                  <div className="text-base font-black font-mono text-amber-300">
                    {rank1.totalFocusHours}h
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-300">Số phiên</div>
                  <div className="text-base font-black font-mono text-white">
                    {rank1.completedSessions}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-300">Streak</div>
                  <div className="text-base font-black font-mono text-amber-400 flex items-center justify-center gap-0.5">
                    <Flame className="h-4 w-4 text-amber-400" />
                    {rank1.currentStreakDays}d
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rank 3: Bronze Card */}
          {rank3 && (
            <div
              onClick={() => setSelectedStudent(rank3)}
              className="relative overflow-hidden rounded-3xl border border-amber-700/50 bg-card/40 backdrop-blur-2xl p-5 shadow-xl shadow-amber-950/30 hover:scale-[1.02] hover:border-amber-600 cursor-pointer transition-all duration-300 group"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-amber-700/10 blur-2xl" />
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-xl border border-amber-700/50 bg-amber-800/15 px-2.5 py-1 text-xs font-black text-amber-400">
                  <Medal className="h-3.5 w-3.5 text-amber-500" /> 🥉 QUÝ QUÂN TUẦN
                </span>
                <span className="text-[11px] font-mono text-amber-500 font-bold">HẠNG #3</span>
              </div>

              <div className="mt-4 flex items-center gap-3.5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-700/60 bg-amber-950/60 text-lg font-black text-amber-300 shadow-inner group-hover:scale-105 transition-transform">
                  {rank3.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-white truncate group-hover:text-amber-200">
                    {rank3.name}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">{rank3.rankTitle}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 mt-1 font-semibold">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    {rank3.badge}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
                <div>
                  <div className="text-[11px] text-slate-400">Giờ Focus</div>
                  <div className="text-sm font-black font-mono text-cyan-300">
                    {rank3.totalFocusHours}h
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Số phiên</div>
                  <div className="text-sm font-black font-mono text-white">
                    {rank3.completedSessions}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Streak</div>
                  <div className="text-sm font-black font-mono text-amber-400 flex items-center justify-center gap-0.5">
                    <Flame className="h-3.5 w-3.5 text-amber-400" />
                    {rank3.currentStreakDays}d
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Full Rankings Table */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-6 shadow-2xl shadow-cyan-950/20 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-black text-white font-display">BẢNG XẾP HẠNG TOÀN DIỆN</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Time Period Filter Switcher */}
            <div className="flex items-center rounded-2xl border border-white/10 bg-black/40 p-1 text-xs">
              <button
                type="button"
                onClick={() => setTimePeriod('week')}
                className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
                  timePeriod === 'week'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-950/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tuần này
              </button>
              <button
                type="button"
                onClick={() => setTimePeriod('month')}
                className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
                  timePeriod === 'month'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-950/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tháng này
              </button>
              <button
                type="button"
                onClick={() => setTimePeriod('all_time')}
                className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
                  timePeriod === 'all_time'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-950/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mọi lúc
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên sinh viên..."
                className="h-9 w-40 sm:w-52 rounded-xl border border-white/10 bg-black/30 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase text-[11px] font-bold">
                <th className="py-3 px-3">Hạng</th>
                <th className="py-3 px-4">Sinh viên</th>
                <th className="py-3 px-4">Giờ tập trung</th>
                <th className="py-3 px-4 hidden sm:table-cell">Số phiên</th>
                <th className="py-3 px-4">Chuỗi Streak</th>
                <th className="py-3 px-4 hidden md:table-cell">Danh hiệu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {filteredRankings.map((student, idx) => {
                const rankNum = idx + 1;
                const isTop1 = rankNum === 1;
                const isTop2 = rankNum === 2;
                const isTop3 = rankNum === 3;
                const isSelf = student.name.includes('Bạn') || student.userId === 'default_student_id';
                const progressPct = Math.min(
                  100,
                  Math.round((student.totalFocusHours / (stats.topHours || 1)) * 100)
                );

                return (
                  <tr
                    key={student.userId || idx}
                    onClick={() => setSelectedStudent(student)}
                    className={`cursor-pointer transition-colors hover:bg-white/5 ${
                      isSelf
                        ? 'bg-cyan-500/10 font-bold'
                        : isTop1
                        ? 'bg-amber-500/5'
                        : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {isTop1 ? (
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/60 font-black text-amber-300">
                            1
                          </span>
                        ) : isTop2 ? (
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-400/20 border border-slate-300/50 font-black text-slate-200">
                            2
                          </span>
                        ) : isTop3 ? (
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-800/20 border border-amber-700/50 font-black text-amber-500">
                            3
                          </span>
                        ) : (
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl font-mono text-slate-400">
                            #{rankNum}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Student Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${
                            isTop1
                              ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
                              : isTop2
                              ? 'border-slate-300/60 bg-slate-400/20 text-slate-200'
                              : isTop3
                              ? 'border-amber-700/60 bg-amber-800/20 text-amber-300'
                              : 'border-white/10 bg-white/5 text-slate-300'
                          }`}
                        >
                          {student.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white truncate hover:text-cyan-300">
                              {student.name}
                            </span>
                            {isSelf && (
                              <span className="rounded-full bg-cyan-500/20 border border-cyan-400/40 px-1.5 py-0.2 text-[9px] font-black text-cyan-300">
                                BẠN
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{student.rankTitle}</p>
                        </div>
                      </div>
                    </td>

                    {/* Total Hours with relative bar */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-cyan-300 text-sm">
                          {student.totalFocusHours}h
                        </div>
                        <div className="h-1.5 w-24 sm:w-32 rounded-full bg-white/10 overflow-hidden">
                          <div
                            style={{ width: `${progressPct}%` }}
                            className={`h-full rounded-full ${
                              isTop1
                                ? 'bg-amber-400'
                                : isTop2
                                ? 'bg-cyan-400'
                                : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                            }`}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Completed Sessions */}
                    <td className="py-3 px-4 hidden sm:table-cell font-mono text-slate-300">
                      {student.completedSessions} phiên
                    </td>

                    {/* Current Streak */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-400/30 px-2 py-0.5 text-xs font-mono font-bold text-amber-300">
                        <Flame className="h-3 w-3 text-amber-400" />
                        {student.currentStreakDays} ngày
                      </span>
                    </td>

                    {/* Badge */}
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        {student.badge}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Live Champions in Rooms (Holographic Member Grid Integration) */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-6 shadow-2xl shadow-cyan-950/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-black text-white font-display">
                CHIẾN THẦN ĐANG HỌC TRỰC TUYẾN
              </h2>
              <p className="text-xs text-slate-400">
                Thành viên đang ngồi trong các phòng Pomodoro Party với đèn trạng thái neon
              </p>
            </div>
          </div>

          <Link
            href="/study/rooms"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-cyan-200"
          >
            <span>Vào sảnh tham gia</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <MemberHoloGrid
          members={onlineMembers}
          onPokeMember={handlePokeMember}
          compact={false}
          showControls={true}
        />
      </section>

      {/* 6. Student Detail Modal */}
      {selectedStudent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-slate-900/95 backdrop-blur-2xl p-6 shadow-2xl shadow-cyan-950/50 space-y-5"
          >
            {/* Top ambient glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />

            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-300">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span>HẠNG #{selectedStudent.rank} ARENA</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-cyan-400 bg-cyan-500/20 text-xl font-black text-cyan-200">
                {selectedStudent.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-white">{selectedStudent.name}</h3>
                <p className="text-xs text-cyan-300 font-bold">{selectedStudent.rankTitle}</p>
                <div className="flex items-center gap-1 text-xs text-amber-300 mt-0.5">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span>{selectedStudent.badge}</span>
                </div>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-center">
                <div className="text-[11px] text-slate-400">Giờ Focus</div>
                <div className="text-base font-black font-mono text-cyan-300 mt-0.5">
                  {selectedStudent.totalFocusHours}h
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-center">
                <div className="text-[11px] text-slate-400">Phiên học</div>
                <div className="text-base font-black font-mono text-white mt-0.5">
                  {selectedStudent.completedSessions}
                </div>
              </div>
              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-center">
                <div className="text-[11px] text-amber-300">Chuỗi ngày</div>
                <div className="text-base font-black font-mono text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                  <Flame className="h-4 w-4 text-amber-400" />
                  {selectedStudent.currentStreakDays}d
                </div>
              </div>
            </div>

            {/* Motivational Quote / Achievement */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 text-xs text-slate-300 leading-relaxed">
              💬 &ldquo;Kỷ luật tự giác là chiếc chìa khóa duy nhất để bước lên bục vinh danh CampusOS.&rdquo;
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all"
              >
                Đóng thông tin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
