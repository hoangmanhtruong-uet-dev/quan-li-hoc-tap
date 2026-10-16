'use client';

import React, { useState } from 'react';
import { useClubs, ClubDetail } from '@/lib/club-engine';
import { CyberClub3D } from '@/components/clubs/cyber-club-3d';
import { ClubCard } from '@/components/clubs/club-card';
import {
  Search,
  Filter,
  Sparkles,
  Users,
  Calendar,
  Coins,
  Shield,
  Trophy,
  Check,
  Compass,
} from 'lucide-react';

export default function ClubsListingPage() {
  const { clubs, metrics, toggleRsvp } = useClubs();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');

  const categories = ['Tất cả', 'Công nghệ', 'Ngoại ngữ', 'Nghệ thuật', 'Thể thao'];

  const filteredClubs = clubs.filter((club) => {
    const matchCategory = selectedCategory === 'Tất cả' || club.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      searchQuery === '' ||
      club.name.toLowerCase().includes(q) ||
      club.shortName.toLowerCase().includes(q) ||
      club.description.toLowerCase().includes(q) ||
      club.tags.some((tag) => tag.toLowerCase().includes(q));
    return matchCategory && matchSearch;
  });

  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(val);

  // Collect all upcoming events from clubs
  const allEvents = clubs
    .flatMap((c) =>
      c.events.map((e) => ({
        ...e,
        clubName: c.name,
        clubShortName: c.shortName,
        clubId: c.id,
      })),
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="relative min-h-screen space-y-8 pb-16 overflow-x-hidden min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* 1. 120FPS Three.js 3D Emblem Header */}
      <CyberClub3D
        totalClubs={metrics.totalClubs}
        totalMembers={metrics.totalMembers}
        totalEvents={metrics.totalEvents}
        totalTreasury={metrics.totalTreasury}
        onExploreClick={() => {
          const el = document.getElementById('clubs-directory');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 2. Asymmetric Bento Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Clubs */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 transition-all duration-300 hover:border-cyan-400/30 hover:bg-card/60">
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-cyan-500/10 blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Câu lạc bộ trường
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {metrics.totalClubs}
            </span>
            <span className="text-xs text-slate-400 font-medium">CLB chính thức</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Được phê duyệt bởi Hội Sinh viên</p>
        </div>

        {/* Card 2: Members */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 transition-all duration-300 hover:border-purple-400/30 hover:bg-card/60">
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-purple-500/10 blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cộng đồng sinh viên
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-400/30 text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {metrics.totalMembers}
            </span>
            <span className="text-xs text-slate-400 font-medium">thành viên tích cực</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Phân bố trên 4 lĩnh vực chính</p>
        </div>

        {/* Card 3: Events */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 transition-all duration-300 hover:border-emerald-400/30 hover:bg-card/60">
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sự kiện trong kỳ
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {metrics.totalEvents}
            </span>
            <span className="text-xs text-slate-400 font-medium">workshop &amp; giải đấu</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Đăng ký tham gia trực tiếp</p>
        </div>

        {/* Card 4: Total Treasury */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 transition-all duration-300 hover:border-amber-400/30 hover:bg-card/60">
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-amber-500/10 blur-xl" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tổng quỹ tài chính
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-400">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-xl font-extrabold font-mono text-amber-300 tracking-tight">
              {formatVND(metrics.totalTreasury)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Thu chi minh bạch thời gian thực</p>
        </div>
      </div>

      {/* 3. Search and Category Filter Toolbar */}
      <div id="clubs-directory" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm CLB theo tên, viết tắt (CTC, ESC...), mô tả hoặc hashtag..."
              className="w-full rounded-2xl border border-white/10 bg-card/40 pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 backdrop-blur-2xl focus:border-cyan-400/50 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 text-cyan-200 shadow-md shadow-cyan-950/30'
                    : 'border border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Clubs Grid */}
        {filteredClubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-card/30 p-12 text-center text-slate-400 backdrop-blur-2xl">
            <Shield className="h-10 w-10 text-slate-500 mb-3" />
            <h3 className="text-base font-bold text-white">Không tìm thấy câu lạc bộ nào</h3>
            <p className="mt-1 text-xs text-slate-400">
              Hãy thử tìm kiếm với từ khóa khác hoặc chuyển danh mục &quot;Tất cả&quot;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredClubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        )}
      </div>

      {/* 5. Highlight Upcoming Community Events */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-400" />
              <span>Sự kiện &amp; Hoạt động Nổi bật</span>
            </h2>
            <p className="text-xs text-slate-400">
              Lịch trình workshop, giải đấu và giao lưu toàn trường
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {allEvents.slice(0, 3).map((event) => {
            const isAttending = event.attendeeIds.includes('ctc-m1');
            return (
              <div
                key={event.id}
                className="flex flex-col justify-between rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-5 shadow-lg hover:border-cyan-400/30 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-cyan-500/10 border border-cyan-400/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                      {event.clubShortName}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {event.date.split('-').reverse().slice(0, 2).join('/')} · {event.startTime}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 truncate max-w-[130px]">
                    📍 {event.location}
                  </span>

                  <button
                    onClick={() => toggleRsvp(event.clubId, event.id, 'ctc-m1')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      isAttending
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-white/10 text-white hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400/30 border border-transparent'
                    }`}
                  >
                    {isAttending ? '✓ Đã tham gia' : 'Đăng ký'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
