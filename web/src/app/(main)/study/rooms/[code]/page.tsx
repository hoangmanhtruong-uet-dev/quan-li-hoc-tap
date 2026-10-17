'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  getStudyRoomByCode,
  verifyRoomPin,
  postRoomReaction,
  type StudyRoomRow,
} from '@/lib/study-rooms-service';
import { useStudyRoomRealtime } from '@/hooks/use-study-room-realtime';
import { FloatingReactions } from '@/components/study/floating-reactions';
import { DeserterShameBanner } from '@/components/study/deserter-shame-banner';
import { BreakRoomChat } from '@/components/study/break-room-chat';
import {
  ArrowLeft,
  Clock,
  Coffee,
  Users,
  Lock,
  Sparkles,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Play,
  Square,
  ShieldAlert,
  Loader2,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Radio,
  Wifi,
} from 'lucide-react';

export default function StudyRoomRealtimePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const code = typeof params.code === 'string' ? params.code.toUpperCase() : '';
  const initialPinParam = searchParams.get('pin') || '';

  // PIN Gate State
  const [initialRoom, setInitialRoom] = useState<StudyRoomRow | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState(initialPinParam);
  const [pinError, setPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // UI Local State
  const [isZenMode, setIsZenMode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [myCameraOn, setMyCameraOn] = useState(true);
  const [myMicOn, setMyMicOn] = useState(false);

  const currentUserId = 'default_student_id';
  const currentUserName = 'Bạn (Minh)';
  const currentUserAvatar = '/avatars/default.png';

  // 1. Initial Room Inspection for PIN protection
  useEffect(() => {
    let isMounted = true;

    async function loadInitialRoom() {
      if (!code) return;
      setIsLoadingRoom(true);
      try {
        const found = await getStudyRoomByCode(code);
        if (!isMounted) return;

        if (!found) {
          setInitialRoom(null);
          setIsLoadingRoom(false);
          return;
        }

        setInitialRoom(found);

        if (found.room_type !== 'private_pin') {
          setIsPinVerified(true);
        } else {
          // Check query param or session storage
          let pinToTest = initialPinParam;
          if (!pinToTest && typeof window !== 'undefined') {
            try {
              pinToTest = sessionStorage.getItem(`room_pin_${found.code}`) || '';
            } catch {}
          }

          if (pinToTest && (await verifyRoomPin(found, pinToTest))) {
            setIsPinVerified(true);
          } else {
            setIsPinVerified(false);
          }
        }
      } catch (err) {
        console.error('Failed to load room:', err);
      } finally {
        if (isMounted) setIsLoadingRoom(false);
      }
    }

    loadInitialRoom();
    return () => {
      isMounted = false;
    };
  }, [code, initialPinParam]);

  // 2. Realtime Synchronization Hook
  const {
    room,
    members,
    isLoading: isRealtimeLoading,
    connectionStatus,
    ntpOffset,
    isNtpSynced,
    remainingSeconds,
    floatingParticles,
    sendReaction,
    shameNotice,
    triggerSelfViolation,
    dismissShameNotice,
    chatMessages,
    sendChatMessage,
    startFocus,
    switchToBreak,
    finishSession,
  } = useStudyRoomRealtime({
    roomCode: code,
    currentUserId,
    currentUserName,
    currentUserAvatar,
  });

  // Effective room instance
  const activeRoom = room || initialRoom;

  // Handle PIN submission
  const handleVerifyPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom || isVerifyingPin) return;

    if (pinInput.trim().length !== 6) {
      setPinError('Vui lòng nhập đủ 6 chữ số mã PIN');
      return;
    }

    setIsVerifyingPin(true);
    setPinError('');

    try {
      const ok = await verifyRoomPin(activeRoom, pinInput.trim());
      if (ok) {
        setIsPinVerified(true);
        try {
          sessionStorage.setItem(`room_pin_${activeRoom.code}`, pinInput.trim());
        } catch {}
      } else {
        setPinError('Mã PIN không chính xác! Vui lòng thử lại.');
      }
    } catch (err: any) {
      setPinError(err?.message || 'Có lỗi khi kiểm tra mã PIN');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Handle Copy Room Code
  const handleCopyCode = () => {
    if (!activeRoom) return;
    navigator.clipboard.writeText(activeRoom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Format timer MM:SS
  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.floor(Math.max(0, totalSeconds) % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 404 Room Not Found State
  if (!isLoadingRoom && !activeRoom) {
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center text-center px-4 max-w-xl mx-auto">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 mb-4 shadow-xl">
          <Users className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Không tìm thấy phòng học #{code}</h2>
        <p className="mt-2 text-sm text-slate-400">
          Phòng học này có thể đã kết thúc phiên hoặc mã phòng không chính xác.
        </p>
        <Link
          href="/study/rooms"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 px-6 py-3 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Sảnh phòng học</span>
        </Link>
      </div>
    );
  }

  // Loading state
  if (isLoadingRoom || !activeRoom) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400 mb-3" />
        <p className="text-sm font-bold text-slate-300">Đang đồng bộ dữ liệu phòng học #{code}...</p>
      </div>
    );
  }

  // PIN Gate Screen
  if (!isPinVerified && activeRoom.room_type === 'private_pin') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-400/40 bg-slate-900/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-amber-950/40 text-center">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" />

          <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 mb-4 shadow-lg shadow-amber-500/20">
            <Lock className="h-7 w-7" />
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">Phòng Học Bảo Mật PIN</h2>
          <p className="text-xs text-slate-400 mt-1">
            Phòng <strong className="text-white">{activeRoom.title}</strong> yêu cầu mã PIN 6 chữ số để tham gia.
          </p>

          <form onSubmit={handleVerifyPinSubmit} className="relative mt-6 space-y-4">
            <div>
              <input
                type="text"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, ''));
                  if (pinError) setPinError('');
                }}
                placeholder="••••••"
                className="w-full h-14 rounded-2xl border border-amber-400/40 bg-black/60 px-4 text-center font-mono text-3xl font-black tracking-[0.4em] text-amber-300 placeholder-amber-500/30 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-400/20 shadow-inner"
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-rose-400 mt-2 font-semibold">{pinError}</p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/study/rooms"
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-semibold text-slate-300 hover:bg-white/10"
              >
                Quay lại
              </Link>
              <button
                type="submit"
                disabled={isVerifyingPin || pinInput.length !== 6}
                className="flex-1 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-xs font-bold text-white shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-orange-500 transition-all disabled:opacity-40"
              >
                {isVerifyingPin ? 'Đang mở...' : 'Vào phòng học'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const isFocusing = activeRoom.current_status === 'focusing';
  const isBreak = activeRoom.current_status === 'break';
  const isWaiting = activeRoom.current_status === 'waiting';

  // Handle Reaction Broadcast & Database Log
  const handleSendReaction = (emoji: string) => {
    sendReaction(emoji);
    if (activeRoom) {
      postRoomReaction(activeRoom.id, currentUserId, emoji);
    }
  };

  return (
    <div
      className={`relative min-h-screen space-y-6 pb-24 overflow-x-hidden min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 transition-all ${
        shameNotice ? 'ring-2 ring-rose-500/60 rounded-3xl p-4 bg-rose-950/10' : ''
      }`}
    >
      {/* 1. GPU Floating Reactions Overlay */}
      <FloatingReactions
        particles={floatingParticles}
        onSendReaction={handleSendReaction}
        isFocusing={isFocusing}
      />

      {/* 2. Public Shame Banner (Cơ chế Bêu Tên Kẻ Bỏ Cuộc) */}
      {shameNotice && (
        <DeserterShameBanner
          notice={shameNotice}
          onDismiss={dismissShameNotice}
          isSelf={shameNotice.userId === currentUserId}
        />
      )}

      {/* 3. Room Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/study/rooms"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Rời phòng</span>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white line-clamp-1">{activeRoom.title}</h1>
              {/* Room Code with Copy */}
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-black/60 px-2.5 py-1 font-mono text-xs font-bold text-cyan-300 hover:border-cyan-400/50 transition-all"
                title="Sao chép mã phòng"
              >
                <span>{activeRoom.code}</span>
                {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-slate-400" />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{activeRoom.subject}</p>
          </div>
        </div>

        {/* Badges & Session Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* NTP Sync Offset Indicator */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-bold border ${
              isNtpSynced
                ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300 shadow-sm shadow-cyan-500/10'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}
            title={`Độ lệch đồng hồ NTP với máy chủ: ${ntpOffset}ms (Bảo đảm < 200ms)`}
          >
            <Radio className={`h-3.5 w-3.5 ${isNtpSynced ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <span>NTP &lt; 200ms {ntpOffset !== 0 ? `(${ntpOffset > 0 ? `+${ntpOffset}` : ntpOffset}ms)` : '⚡'}</span>
          </div>

          {/* Realtime Channel Connection status */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-bold border ${
              connectionStatus === 'connected'
                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                : 'border-white/10 bg-white/5 text-slate-400'
            }`}
          >
            <Wifi className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {connectionStatus === 'connected' ? 'Realtime Live' : 'Offline Mode'}
            </span>
          </div>

          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-bold border ${
              isFocusing
                ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300'
                : isBreak
                ? 'border-amber-400/40 bg-amber-500/20 text-amber-300'
                : 'border-blue-400/40 bg-blue-500/20 text-blue-300'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isFocusing ? 'bg-emerald-400 animate-pulse' : isBreak ? 'bg-amber-400' : 'bg-blue-400'
              }`}
            />
            <span>{isFocusing ? 'SILENT FOCUS' : isBreak ? 'GIỜ GIẢI LAO' : 'CHỜ BẮT ĐẦU'}</span>
          </span>

          {/* Test Violation / Shame Simulator Button */}
          <button
            type="button"
            onClick={() => triggerSelfViolation('chuyển tab sang trang giải trí (kiểm thử)')}
            className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-all"
            title="Kiểm thử cơ chế bêu tên kẻ bỏ cuộc (-50 XP)"
          >
            🚨 Thử Bêu Tên
          </button>

          {/* Zen Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsZenMode(!isZenMode)}
            className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            title={isZenMode ? 'Thoát Zen Mode' : 'Chế độ tập trung Zen'}
          >
            {isZenMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* 4. Main Arena Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Synchronized Clock + Virtual Stage */}
        <div className={isZenMode ? 'lg:col-span-3 space-y-6' : 'lg:col-span-2 space-y-6'}>
          {/* Synchronized Pomodoro Clock Stage */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl text-center">
            {/* Ambient glows */}
            <div
              className={`pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full blur-3xl transition-all ${
                isFocusing ? 'bg-emerald-500/20' : isBreak ? 'bg-amber-500/20' : 'bg-cyan-500/20'
              }`}
            />

            <div className="relative space-y-3">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                {isFocusing
                  ? '🔒 GIAI ĐOẠN SILENT FOCUS - GIỮ IM LẶNG TUYỆT ĐỐI'
                  : isBreak
                  ? '☕ GIAI ĐOẠN NGHỈ NGƠI & THẢ LỎNG'
                  : 'SẴN SÀNG BẮT ĐẦU PHIÊN HỌC'}
              </div>

              {/* Tabular Countdown Timer */}
              <div className="py-2">
                <div
                  className={`font-mono text-6xl sm:text-8xl font-black tracking-tight ${
                    isFocusing
                      ? 'text-emerald-300 drop-shadow-[0_0_25px_rgba(52,211,153,0.35)]'
                      : isBreak
                      ? 'text-amber-300 drop-shadow-[0_0_25px_rgba(251,191,36,0.35)]'
                      : 'text-cyan-300'
                  }`}
                >
                  {formatTimer(remainingSeconds)}
                </div>
              </div>

              {/* Progress & Duration Details */}
              <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span>{activeRoom.focus_duration_minutes} phút tập trung</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Coffee className="h-4 w-4 text-amber-400" />
                  <span>{activeRoom.break_duration_minutes} phút giải lao</span>
                </span>
              </div>

              {/* Host Session Controls */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-white/10">
                {isWaiting && (
                  <button
                    type="button"
                    onClick={startFocus}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Play className="h-4 w-4" />
                    <span>▶ Bắt đầu Silent Focus ({activeRoom.focus_duration_minutes}p)</span>
                  </button>
                )}

                {isFocusing && (
                  <>
                    <button
                      type="button"
                      onClick={switchToBreak}
                      className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/20 px-5 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-500/30 transition-all"
                    >
                      <Coffee className="h-4 w-4" />
                      <span>Nghỉ giải lao sớm ({activeRoom.break_duration_minutes}p)</span>
                    </button>
                    <button
                      type="button"
                      onClick={finishSession}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/10"
                    >
                      <Square className="h-3.5 w-3.5" />
                      <span>Dừng phiên</span>
                    </button>
                  </>
                )}

                {isBreak && (
                  <button
                    type="button"
                    onClick={startFocus}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:scale-[1.02] transition-all"
                  >
                    <Play className="h-4 w-4" />
                    <span>Vào hiệp Focus tiếp theo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Virtual Stage: Member Hologram Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <span>Sân Khấu Thành Viên Đang Cùng Học ({members.length})</span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMyCameraOn(!myCameraOn)}
                  className={`rounded-xl border p-1.5 text-xs transition-all ${
                    myCameraOn
                      ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-slate-400'
                  }`}
                  title={myCameraOn ? 'Tắt camera ảo' : 'Bật camera ảo'}
                >
                  {myCameraOn ? <Camera className="h-3.5 w-3.5" /> : <CameraOff className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setMyMicOn(!myMicOn)}
                  className={`rounded-xl border p-1.5 text-xs transition-all ${
                    myMicOn
                      ? 'border-cyan-400/40 bg-cyan-500/20 text-cyan-300'
                      : 'border-white/10 bg-white/5 text-slate-400'
                  }`}
                  title={myMicOn ? 'Tắt mic' : 'Bật mic'}
                >
                  {myMicOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {members.map((member) => {
                const isMemberDistracted = member.status === 'distracted';
                const isMemberFocusing = member.status === 'focusing';

                return (
                  <div
                    key={member.id}
                    className={`relative overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-xl p-4 transition-all duration-300 ${
                      isMemberDistracted
                        ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/40 animate-pulse'
                        : isMemberFocusing
                        ? 'border-emerald-400/40 shadow-lg shadow-emerald-950/20'
                        : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl border font-bold text-sm text-white ${
                            isMemberDistracted
                              ? 'border-rose-400 bg-rose-500/30 text-rose-200'
                              : isMemberFocusing
                              ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                              : 'border-white/20 bg-white/10'
                          }`}
                        >
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        {/* Status dot */}
                        <span
                          className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${
                            isMemberDistracted
                              ? 'bg-rose-500 animate-ping'
                              : isMemberFocusing
                              ? 'bg-emerald-400 animate-pulse'
                              : 'bg-amber-400'
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{member.name}</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {member.total_minutes_contributed} phút cày
                        </div>
                      </div>
                    </div>

                    {/* Member status banner */}
                    <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-semibold">
                      <span
                        className={
                          isMemberDistracted
                            ? 'text-rose-400 font-bold'
                            : isMemberFocusing
                            ? 'text-emerald-300'
                            : 'text-amber-300'
                        }
                      >
                        {isMemberDistracted ? '🚨 BỊ PHẠT PHÂN TÂM' : isMemberFocusing ? '⚡ TẬP TRUNG CAO' : '☕ GIẢI LAO'}
                      </span>
                      <span className="text-slate-400">
                        {member.camera_on ? 'Cam ON' : 'Cam OFF'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Break Room Chat & Lo-Fi Soundscape */}
        {!isZenMode && (
          <div className="space-y-6">
            <BreakRoomChat
              roomStatus={activeRoom.current_status}
              messages={chatMessages}
              onSendMessage={sendChatMessage}
              currentUserId={currentUserId}
            />

            {/* Quick Link to 3D Leaderboard Arena */}
            <div className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-5 backdrop-blur-2xl text-center space-y-2 shadow-xl shadow-amber-950/20">
              <div className="text-xs font-black text-amber-300 uppercase tracking-wider">
                BỤC VINH DANH TUẦN 3D
              </div>
              <p className="text-[11px] text-slate-300">
                Top 3 sinh viên có giờ cày cao nhất tuần được đứng trên bục vinh danh Cyberpunk!
              </p>
              <Link
                href="/study/rooms/leaderboard"
                className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 px-4 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/30 transition-all"
              >
                <span>Xem Bảng Vàng 3D</span>
                <Sparkles className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
