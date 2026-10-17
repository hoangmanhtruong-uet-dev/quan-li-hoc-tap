'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  listStudyRooms,
  createStudyRoom,
  getStudyRoomMembers,
  type StudyRoomRow,
  type StudyRoomMemberWithProfile,
} from '@/lib/study-rooms-service';
import {
  Timer,
  Users,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Plus,
  Play,
  Coffee,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Radio,
  Loader2,
} from 'lucide-react';

export interface WorkspaceStudyRoomPanelProps {
  workspaceId: string;
  workspaceName?: string;
}

export function WorkspaceStudyRoomPanel({
  workspaceId,
  workspaceName = 'Đồ án tốt nghiệp',
}: WorkspaceStudyRoomPanelProps) {
  const router = useRouter();
  const [room, setRoom] = useState<StudyRoomRow | null>(null);
  const [members, setMembers] = useState<StudyRoomMemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Load dedicated study room for this workspace
  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaceRoom() {
      setIsLoading(true);
      try {
        const rooms = await listStudyRooms({ workspace_id: workspaceId });
        if (!isMounted) return;

        if (rooms && rooms.length > 0 && rooms[0]) {
          const firstRoom = rooms[0];
          setRoom(firstRoom);
          const mems = await getStudyRoomMembers(firstRoom.id);
          if (isMounted) setMembers(mems);
        } else {
          setRoom(null);
          setMembers([]);
        }
      } catch (err) {
        console.error('Failed to load workspace study room:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadWorkspaceRoom();
    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  // Create 1-click workspace study room
  const handleCreateWorkspaceRoom = async () => {
    setIsCreating(true);
    try {
      const newRoom = await createStudyRoom({
        title: `Phòng học nhóm: ${workspaceName}`,
        subject: 'Cày đồ án & Thảo luận nhóm',
        room_type: 'workspace',
        workspace_id: workspaceId,
        focus_duration_minutes: 50,
        break_duration_minutes: 10,
        max_participants: 12,
      });

      setRoom(newRoom);
      const mems = await getStudyRoomMembers(newRoom.id);
      setMembers(mems);
    } catch (err) {
      console.error('Failed to create workspace room:', err);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-card/20 backdrop-blur-xl p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
        <p className="text-xs font-bold text-slate-400">Đang tải phòng học nhóm...</p>
      </div>
    );
  }

  // Case 1: No room yet -> Provide 1-click create
  if (!room) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl shadow-cyan-950/20 text-center">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />

        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 mb-4 shadow-lg shadow-cyan-500/20">
          <Timer className="h-8 w-8" />
        </div>

        <h3 className="text-xl font-black text-white tracking-tight">
          Chưa Có Phòng Học Pomodoro Riêng Cho Nhóm Này
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-2 leading-relaxed">
          Kích hoạt Đấu Trường Học Nhóm để đồng bộ đồng hồ Pomodoro thời gian thực, kỷ luật
          Silent Focus và cùng nhau hoàn thành nhiệm vụ đồ án đúng hạn!
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleCreateWorkspaceRoom}
            disabled={isCreating}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang khởi tạo phòng học...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>🚀 Kích hoạt phòng học cho nhóm ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const isFocusing = room.current_status === 'focusing';
  const isBreak = room.current_status === 'break';

  // Case 2: Room exists -> Render active panel
  return (
    <div className="space-y-6">
      {/* Hero Dedicated Room Card */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-400/30 bg-card/40 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/20">
        {/* Glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl border border-white/15 bg-black/60 px-3 py-1 font-mono text-xs font-black tracking-wider text-cyan-300">
                {room.code}
              </span>
              <span className="rounded-xl border border-purple-400/30 bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                <span>Phòng Đồ Án</span>
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold border ${
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
                <span>{isFocusing ? 'Đang Silent Focus' : isBreak ? 'Giờ giải lao' : 'Chờ bắt đầu'}</span>
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white">{room.title}</h3>
            <p className="text-xs text-slate-300">{room.subject}</p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span>{room.focus_duration_minutes} phút tập trung</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Coffee className="h-4 w-4 text-amber-400" />
                <span>{room.break_duration_minutes} phút giải lao</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-purple-400" />
                <span>{members.length} thành viên đang online</span>
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <Link
              href={`/study/rooms/${room.code}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Vào phòng học toàn màn hình</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Online Member Presence Preview */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Users className="h-4 w-4 text-cyan-400" />
          <span>Thành viên nhóm đang trong phòng ({members.length})</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-white/10 bg-card/30 backdrop-blur-xl p-3.5 flex items-center gap-3"
            >
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 font-bold text-xs">
                  {m.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{m.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{m.total_minutes_contributed}p cày</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
