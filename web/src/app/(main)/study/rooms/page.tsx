'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  listStudyRooms,
  filterRoomsByTab,
  type StudyRoomRow,
  type StudyRoomType,
  type StudyRoomStatus,
} from '@/lib/study-rooms-service';
import { CreateRoomModal } from '@/components/study/create-room-modal';
import { PinEntryModal } from '@/components/study/pin-entry-modal';
import {
  Users,
  Clock,
  Sparkles,
  Lock,
  Globe,
  Layers,
  Search,
  Plus,
  Trophy,
  Flame,
  ArrowRight,
  Filter,
  RefreshCw,
  Coffee,
  CheckCircle2,
  Zap,
  ShieldAlert,
} from 'lucide-react';

type TabKey = 'all' | 'general' | 'major' | 'workspace';
type StatusFilterKey = 'all' | 'focusing' | 'waiting' | 'break';

export default function StudyRoomsLobbyPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<StudyRoomRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPinRoom, setSelectedPinRoom] = useState<StudyRoomRow | null>(null);

  // Load study rooms
  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const data = await listStudyRooms();
      setRooms(data);
    } catch (err) {
      console.error('Failed to load study rooms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
    // Auto-refresh rooms every 15 seconds
    const interval = setInterval(loadRooms, 15000);
    return () => clearInterval(interval);
  }, []);

  // Filtered rooms logic
  const filteredRooms = useMemo(() => {
    // 1. Tab filter
    let list = filterRoomsByTab(rooms, activeTab);

    // 2. Status filter
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.current_status === statusFilter);
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const titleMatch = (r.title || '').toLowerCase().includes(q);
        const codeMatch = (r.code || '').toLowerCase().includes(q);
        const subjectMatch = (r.subject || '').toLowerCase().includes(q);
        return titleMatch || codeMatch || subjectMatch;
      });
    }

    return list;
  }, [rooms, activeTab, statusFilter, searchQuery]);

  // Compute live Lobby stats
  const stats = useMemo(() => {
    const totalOpen = rooms.length;
    const activeFocusing = rooms.filter((r) => r.current_status === 'focusing').length;
    const breakRooms = rooms.filter((r) => r.current_status === 'break').length;
    // Approximated live students
    const estimatedOnline = rooms.reduce((acc, r) => {
      return acc + (r.current_status === 'focusing' ? 6 : r.current_status === 'break' ? 4 : 2);
    }, 0);

    return { totalOpen, activeFocusing, breakRooms, estimatedOnline };
  }, [rooms]);

  // Handle Join click
  const handleJoinClick = (room: StudyRoomRow) => {
    if (room.room_type === 'private_pin') {
      setSelectedPinRoom(room);
    } else {
      router.push(`/study/rooms/${room.code}`);
    }
  };

  // Handle PIN success
  const handlePinSuccess = (room: StudyRoomRow, enteredPin: string) => {
    try {
      sessionStorage.setItem(`room_pin_${room.code}`, enteredPin);
    } catch (_err) {
      // Ignore quota
    }
    router.push(`/study/rooms/${room.code}?pin=${encodeURIComponent(enteredPin)}`);
  };

  // Handle Quick Join
  const handleQuickJoin = () => {
    const publicRoom = rooms.find((r) => r.room_type === 'public' && r.current_status === 'focusing')
      || rooms.find((r) => r.room_type === 'public')
      || rooms[0];

    if (publicRoom) {
      handleJoinClick(publicRoom);
    } else {
      setIsCreateOpen(true);
    }
  };

  return (
    <div className="relative min-h-screen space-y-8 pb-16 overflow-x-hidden min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* 1. Hero Cyber-Glass Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/20">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-bold text-cyan-300">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>POMODORO PARTY REALTIME</span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white font-display">
              Đấu Trường Học Nhóm Realtime
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Cùng ngồi học trực tuyến với đồng đội. Kỷ luật tương tác{' '}
              <strong className="text-emerald-300">Silent Focus</strong>, bêu tên kẻ phân tâm bỏ cuộc,
              thả hiệu ứng hạt bay và vinh danh trên bục 3D hàng tuần.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo phòng mới</span>
              </button>

              <button
                type="button"
                onClick={handleQuickJoin}
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/40 bg-cyan-500/15 px-5 py-3 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25 hover:text-white transition-all"
              >
                <Zap className="h-4 w-4 text-cyan-300" />
                <span>Vào nhanh phòng học</span>
              </button>

              <Link
                href="/study/rooms/leaderboard"
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-3 text-xs font-bold text-amber-300 hover:bg-amber-500/20 hover:text-amber-100 transition-all"
              >
                <Trophy className="h-4 w-4 text-amber-400" />
                <span>Bục Vinh Danh 3D</span>
              </Link>
            </div>
          </div>

          {/* Stats Bar HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 lg:w-72 shrink-0">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 text-center">
              <div className="text-2xl font-black font-mono text-cyan-300">{stats.totalOpen}</div>
              <div className="text-[11px] font-bold text-slate-400 mt-0.5">Phòng đang mở</div>
            </div>

            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3.5 text-center">
              <div className="text-2xl font-black font-mono text-emerald-300">{stats.activeFocusing}</div>
              <div className="text-[11px] font-bold text-slate-400 mt-0.5">Đang Silent Focus</div>
            </div>

            <div className="rounded-2xl border border-purple-400/30 bg-purple-500/10 p-3.5 text-center">
              <div className="text-2xl font-black font-mono text-purple-300">{stats.estimatedOnline}</div>
              <div className="text-[11px] font-bold text-slate-400 mt-0.5">Sinh viên online</div>
            </div>

            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3.5 text-center">
              <div className="text-2xl font-black font-mono text-amber-300">96.4%</div>
              <div className="text-[11px] font-bold text-slate-400 mt-0.5">Tỷ lệ hoàn thành</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar: 4 Tabs + Search & Status Controls */}
      <div className="space-y-4">
        {/* 4 Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Tất cả phòng', icon: Sparkles },
              { id: 'general', label: 'Môn học đại cương', icon: Globe },
              { id: 'major', label: 'Môn chuyên ngành', icon: Zap },
              { id: 'workspace', label: 'Nhóm Đồ Án', icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const count = filterRoomsByTab(rooms, tab.id as TabKey).length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabKey)}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-300 shadow-md shadow-cyan-500/15'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                      isActive ? 'bg-cyan-400/20 text-cyan-200' : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={loadRooms}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-300' : ''}`} />
            <span className="hidden sm:inline">Cập nhật</span>
          </button>
        </div>

        {/* Search & Status Pill Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên phòng, mã code (ví dụ GT1-01), môn học..."
              className="w-full rounded-2xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Tất cả trạng thái' },
              { id: 'focusing', label: '🟢 Đang focus' },
              { id: 'waiting', label: '🔵 Đang chờ' },
              { id: 'break', label: '🟡 Giải lao' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id as StatusFilterKey)}
                className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all ${
                  statusFilter === st.id
                    ? 'border border-cyan-400/40 bg-cyan-500/20 text-cyan-300'
                    : 'border border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-card/20 backdrop-blur-xl p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 mb-4">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Chưa có phòng học nào phù hợp</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-md">
            Không tìm thấy phòng học khớp với bộ lọc hiện tại. Bạn có thể tạo phòng mới và mời bạn bè tham gia!
          </p>
          <div className="flex items-center gap-3 mt-5">
            {(searchQuery || statusFilter !== 'all' || activeTab !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setActiveTab('all');
                }}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
              >
                Xóa bộ lọc
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo phòng ngay</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => {
            const isFocusing = room.current_status === 'focusing';
            const isBreak = room.current_status === 'break';
            const isWaiting = room.current_status === 'waiting';
            const isPin = room.room_type === 'private_pin';
            const isWorkspace = room.room_type === 'workspace';

            return (
              <div
                key={room.id}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-card/40 backdrop-blur-2xl p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                  isFocusing
                    ? 'border-emerald-500/30 hover:border-emerald-400/60 shadow-emerald-950/20'
                    : isPin
                    ? 'border-amber-400/30 hover:border-amber-400/60 shadow-amber-950/20'
                    : isWorkspace
                    ? 'border-purple-400/30 hover:border-purple-400/60 shadow-purple-950/20'
                    : 'border-white/10 hover:border-cyan-400/50 shadow-cyan-950/20'
                }`}
              >
                {/* Glow accent */}
                <div
                  className={`pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full blur-2xl transition-opacity opacity-20 group-hover:opacity-40 ${
                    isFocusing ? 'bg-emerald-500' : isPin ? 'bg-amber-500' : isWorkspace ? 'bg-purple-500' : 'bg-cyan-500'
                  }`}
                />

                <div className="space-y-4">
                  {/* Card Header: Code + Type + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-xl border border-white/15 bg-black/60 px-2.5 py-1 font-mono text-xs font-black tracking-wider text-cyan-300 shadow-inner">
                        {room.code}
                      </span>

                      {/* Type Badge */}
                      {isPin && (
                        <span className="inline-flex items-center gap-1 rounded-xl border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                          <Lock className="h-3 w-3" />
                          <span>Mã PIN</span>
                        </span>
                      )}
                      {isWorkspace && (
                        <span className="inline-flex items-center gap-1 rounded-xl border border-purple-400/30 bg-purple-500/10 px-2.5 py-1 text-[10px] font-bold text-purple-300">
                          <Layers className="h-3 w-3" />
                          <span>Đồ án</span>
                        </span>
                      )}
                      {!isPin && !isWorkspace && (
                        <span className="inline-flex items-center gap-1 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300">
                          <Globe className="h-3 w-3" />
                          <span>Công khai</span>
                        </span>
                      )}
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isFocusing
                            ? 'bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20'
                            : isBreak
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-blue-400'
                        }`}
                      />
                      <span
                        className={`text-[11px] font-bold ${
                          isFocusing
                            ? 'text-emerald-300'
                            : isBreak
                            ? 'text-amber-300'
                            : 'text-blue-300'
                        }`}
                      >
                        {isFocusing ? 'Đang focus' : isBreak ? 'Giải lao' : 'Chờ bắt đầu'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Subject */}
                  <div>
                    <h3 className="text-base font-black text-white group-hover:text-cyan-200 transition-colors line-clamp-2">
                      {room.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1 flex items-center gap-1.5">
                      <span className="text-slate-500">Môn:</span>
                      <strong className="text-slate-300 font-medium">{room.subject}</strong>
                    </p>
                  </div>

                  {/* Timers & Specs */}
                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/5 bg-black/30 p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300">
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{room.focus_duration_minutes}p focus</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300">
                      <Coffee className="h-3.5 w-3.5 text-amber-400" />
                      <span>{room.break_duration_minutes}p nghỉ</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Participants + Join CTA */}
                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>Tối đa {room.max_participants} bạn</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleJoinClick(room)}
                    className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold transition-all shadow-md ${
                      isPin
                        ? 'border border-amber-400/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 hover:text-white shadow-amber-950/20'
                        : isFocusing
                        ? 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 hover:text-white shadow-emerald-950/20'
                        : 'border border-cyan-400/40 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30 hover:text-white shadow-cyan-950/20'
                    }`}
                  >
                    <span>{isPin ? 'Nhập mã PIN' : 'Vào học ngay'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(created) => {
          loadRooms();
          router.push(`/study/rooms/${created.code}`);
        }}
      />

      <PinEntryModal
        isOpen={Boolean(selectedPinRoom)}
        room={selectedPinRoom}
        onClose={() => setSelectedPinRoom(null)}
        onSuccess={handlePinSuccess}
      />
    </div>
  );
}
