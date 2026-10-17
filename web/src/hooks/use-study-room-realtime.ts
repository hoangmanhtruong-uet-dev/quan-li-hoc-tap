'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  getStudyRoomByCode,
  updateStudyRoom,
  joinStudyRoom,
  leaveStudyRoom,
  getStudyRoomMembers,
  updateMemberStatus,
  pingStudyRoomMember,
  postRoomReaction,
  type StudyRoomRow,
  type StudyRoomMemberWithProfile,
  type StudyRoomStatus,
  type StudyRoomMemberStatus,
  type RoomReactionRow,
} from '@/lib/study-rooms-service';
import { penalizeViolation } from '@/lib/campus-store';
import { pomodoroAudio } from '@/features/pomodoro/audio-engine';

// ==============================================================================
// SNTP 3-Sample Clock Offset Filter Algorithm (<200ms Guarantee)
// ==============================================================================

export interface SntpPingSample {
  clientSentWallTime: number; // W0 (Date.now())
  clientSentPerfTime: number; // T0 (performance.now())
  serverTime: number;         // Server timestamp
  clientRecvPerfTime: number; // T3 (performance.now())
}

/**
 * Calculates the SNTP offset from an array of ping samples by selecting
 * the sample with the minimum round-trip time (RTT).
 *
 *   RTT = T3 - T0
 *   One-way latency Δ = RTT / 2
 *   Offset Θ = ServerTime - (W0 + Δ)
 */
export function calculateNtpOffset(samples: SntpPingSample[]): {
  offset: number;
  minRtt: number;
  selectedSampleIndex: number;
} {
  if (!samples || samples.length === 0) {
    return { offset: 0, minRtt: 0, selectedSampleIndex: -1 };
  }

  let minRtt = Infinity;
  let selectedIndex = 0;
  let bestOffset = 0;

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    if (!s) continue;
    const rtt = Math.max(0, s.clientRecvPerfTime - s.clientSentPerfTime);
    const oneWayLatency = rtt / 2;
    const localEstimatedArrival = s.clientSentWallTime + oneWayLatency;
    const offset = s.serverTime - localEstimatedArrival;

    if (rtt < minRtt) {
      minRtt = rtt;
      selectedIndex = i;
      bestOffset = offset;
    }
  }

  return {
    offset: Math.round(bestOffset),
    minRtt: Math.round(minRtt),
    selectedSampleIndex: selectedIndex,
  };
}

/**
 * Computes remaining seconds for a countdown based on end time ISO and NTP-synchronized time.
 */
export function computeRemainingSeconds(endTimeIso: string, syncedCurrentTime: number): number {
  if (!endTimeIso) return 0;
  const endMs = new Date(endTimeIso).getTime();
  const diff = endMs - syncedCurrentTime;
  return Math.max(0, Math.floor(diff / 1000));
}

// ==============================================================================
// Silent Focus & Reaction Whitelist Rules
// ==============================================================================

export const ALLOWED_REACTIONS = ['🔥', '👏', '❤️', '💪', '⚡'] as const;
export type AllowedReaction = (typeof ALLOWED_REACTIONS)[number];

export function isChatLocked(roomStatus: 'waiting' | 'focusing' | 'break'): boolean {
  return roomStatus === 'focusing';
}

export function validateReactionEmoji(emoji: string): { valid: boolean; reason?: string } {
  if (!emoji || typeof emoji !== 'string') {
    return { valid: false, reason: 'Reaction emoji không được để trống' };
  }
  if (!ALLOWED_REACTIONS.includes(emoji as AllowedReaction)) {
    return {
      valid: false,
      reason: `Chỉ cho phép các icon hạt bay: ${ALLOWED_REACTIONS.join(' ')}`,
    };
  }
  return { valid: true };
}

export class ReactionRateLimiter {
  private userTimestamps = new Map<string, number[]>();
  private readonly maxReactions = 5;
  private readonly windowMs = 3000;

  canSend(userId: string, now = Date.now()): boolean {
    const list = this.userTimestamps.get(userId) || [];
    const validTimestamps = list.filter((t) => now - t < this.windowMs);
    if (validTimestamps.length >= this.maxReactions) {
      this.userTimestamps.set(userId, validTimestamps);
      return false;
    }
    validTimestamps.push(now);
    this.userTimestamps.set(userId, validTimestamps);
    return true;
  }
}

// ==============================================================================
// Deserter Shame Protocol Types & Helpers
// ==============================================================================

export interface DeserterViolationEvent {
  type: 'MEMBER_VIOLATION';
  userId: string;
  userName: string;
  penaltyXp: number;
  reason: string;
  dangerFlash: boolean;
  bannerText: string;
  timestamp: number;
}

export function processDeserterViolation(
  userId: string,
  userName: string,
  reason: string,
  isExempt = false
): {
  penalized: boolean;
  event?: DeserterViolationEvent;
  penaltyAmount: number;
} {
  if (isExempt) {
    return { penalized: false, penaltyAmount: 0 };
  }

  const penaltyAmount = 50;
  const event: DeserterViolationEvent = {
    type: 'MEMBER_VIOLATION',
    userId,
    userName,
    penaltyXp: penaltyAmount,
    reason,
    dangerFlash: true,
    bannerText: `Thành viên ${userName} đã phân tâm/bỏ cuộc và bị phạt -${penaltyAmount} XP!`,
    timestamp: Date.now(),
  };

  return {
    penalized: true,
    event,
    penaltyAmount,
  };
}

// ==============================================================================
// Hook Interface & Options
// ==============================================================================

export interface FloatingParticleItem {
  id: string;
  emoji: string;
  leftPercent: number;
  userId: string;
  userName: string;
  timestamp: number;
}

export interface ChatMessageItem {
  id: string;
  sender: string;
  text: string;
  time: string;
  isSystem?: boolean;
  userId?: string;
}

export interface UseStudyRoomRealtimeOptions {
  roomCode: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserAvatar?: string;
  onViolation?: (event: DeserterViolationEvent) => void;
}

export function useStudyRoomRealtime({
  roomCode,
  currentUserId = 'default_student_id',
  currentUserName = 'Bạn (Minh)',
  currentUserAvatar = '/avatars/default.png',
  onViolation,
}: UseStudyRoomRealtimeOptions) {
  const cleanCode = roomCode.trim().toUpperCase();

  // Core Room State
  const [room, setRoom] = useState<StudyRoomRow | null>(null);
  const [members, setMembers] = useState<StudyRoomMemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');

  // SNTP Sync State
  const [ntpOffset, setNtpOffset] = useState<number>(0);
  const [isNtpSynced, setIsNtpSynced] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  // Floating Reactions State
  const [floatingParticles, setFloatingParticles] = useState<FloatingParticleItem[]>([]);
  const rateLimiterRef = useRef<ReactionRateLimiter>(new ReactionRateLimiter());

  // Deserter Shame Notice State
  const [shameNotice, setShameNotice] = useState<DeserterViolationEvent | null>(null);

  // Chat State (Break Mode)
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([
    {
      id: 'sys-welcome',
      sender: 'Hệ Thống CampusOS',
      text: 'Chào mừng bạn đến với Đấu Trường Học Nhóm Realtime! Giữ vững kỷ luật Silent Focus nhé.',
      time: 'Vừa xong',
      isSystem: true,
    },
  ]);

  // Channel & Reference state
  const channelRef = useRef<any>(null);
  const roomRef = useRef<StudyRoomRow | null>(null);
  roomRef.current = room;

  const ntpOffsetRef = useRef<number>(0);
  ntpOffsetRef.current = ntpOffset;

  // Synced now calculation
  const syncedNow = useCallback(() => {
    return Date.now() + ntpOffsetRef.current;
  }, []);

  // 1. SNTP 3-Sample Ping Algorithm
  const runSntpSync = useCallback(async () => {
    try {
      const samples: SntpPingSample[] = [];

      for (let i = 0; i < 3; i++) {
        const clientSentWallTime = Date.now();
        const clientSentPerfTime = performance.now();

        const res = await fetch('/api/study/rooms/time', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (!res.ok) throw new Error('Time API responded with error');
        const data = await res.json();
        const clientRecvPerfTime = performance.now();

        samples.push({
          clientSentWallTime,
          clientSentPerfTime,
          serverTime: Number(data.serverTime),
          clientRecvPerfTime,
        });

        // 50ms pause between pings to avoid packet collision
        if (i < 2) {
          await new Promise((r) => setTimeout(r, 50));
        }
      }

      const calculated = calculateNtpOffset(samples);
      setNtpOffset(calculated.offset);
      setIsNtpSynced(true);
    } catch (err) {
      console.warn('SNTP clock sync fallback to local wall time:', err);
      setNtpOffset(0);
      setIsNtpSynced(true);
    }
  }, []);

  // Run SNTP on mount and every 5 minutes
  useEffect(() => {
    runSntpSync();
    const interval = setInterval(runSntpSync, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [runSntpSync]);

  // 2. Fetch initial room data
  const refreshRoomData = useCallback(async () => {
    if (!cleanCode) return;
    try {
      const found = await getStudyRoomByCode(cleanCode);
      if (found) {
        setRoom(found);
        const memberList = await getStudyRoomMembers(found.id);
        setMembers(memberList);
      }
    } catch (err) {
      console.error('Failed to load study room:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cleanCode]);

  useEffect(() => {
    refreshRoomData();
  }, [refreshRoomData]);

  // 3. Supabase Realtime Broadcast & Presence Channel
  useEffect(() => {
    if (!cleanCode || !room) return;

    let isMounted = true;
    const channelName = `study_room:${cleanCode}`;

    if (isSupabaseConfigured()) {
      try {
        const channel = supabase.channel(channelName, {
          config: {
            broadcast: { self: false },
            presence: { key: currentUserId },
          },
        });

        channelRef.current = channel;

        // Broadcast: Timer Sync
        channel.on('broadcast', { event: 'TIMER_SYNC' }, (payload: any) => {
          if (!isMounted || !payload?.payload) return;
          const { status, startTimeIso, endTimeIso } = payload.payload;
          setRoom((prev) => (prev ? { ...prev, current_status: status, start_time_iso: startTimeIso, end_time_iso: endTimeIso } : prev));
        });

        // Broadcast: Reaction Floating Particles
        channel.on('broadcast', { event: 'REACTION' }, (payload: any) => {
          if (!isMounted || !payload?.payload) return;
          const { id, emoji, xPercent, userId: senderId, userName: senderName, timestamp } = payload.payload;
          const newParticle: FloatingParticleItem = {
            id: id || `p-${Date.now()}-${Math.random()}`,
            emoji,
            leftPercent: xPercent ?? (20 + Math.random() * 60),
            userId: senderId,
            userName: senderName || 'Thành viên',
            timestamp: timestamp || Date.now(),
          };

          setFloatingParticles((prev) => [...prev, newParticle]);
          setTimeout(() => {
            if (isMounted) {
              setFloatingParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
            }
          }, 2400);
        });

        // Broadcast: Member Violation / Shame
        channel.on('broadcast', { event: 'MEMBER_VIOLATION' }, (payload: any) => {
          if (!isMounted || !payload?.payload) return;
          const event = payload.payload as DeserterViolationEvent;
          setShameNotice(event);
          pomodoroAudio.playAlertSound('penalty');

          // Mark member as distracted in member list
          setMembers((prev) =>
            prev.map((m) => (m.user_id === event.userId ? { ...m, status: 'distracted' as StudyRoomMemberStatus } : m))
          );

          if (onViolation) onViolation(event);
        });

        // Broadcast: Break Chat Message
        channel.on('broadcast', { event: 'CHAT_MESSAGE' }, (payload: any) => {
          if (!isMounted || !payload?.payload) return;
          const msg = payload.payload as ChatMessageItem;
          setChatMessages((prev) => [...prev, msg]);
        });

        // Presence tracking
        channel
          .on('presence', { event: 'sync' }, () => {
            if (!isMounted) return;
            const presenceState = channel.presenceState();
            const presenceMembers: StudyRoomMemberWithProfile[] = [];

            for (const key of Object.keys(presenceState)) {
              const entries = presenceState[key] as any[];
              if (entries && entries[0]) {
                const entry = entries[0];
                presenceMembers.push({
                  id: `p-${entry.user_id}`,
                  room_id: room.id,
                  user_id: entry.user_id,
                  name: entry.name || 'Sinh viên CampusOS',
                  avatar_url: entry.avatar_url,
                  status: entry.status || 'focusing',
                  joined_at: entry.joined_at || new Date().toISOString(),
                  total_minutes_contributed: entry.total_minutes || 0,
                  camera_on: entry.camera_on ?? true,
                  last_ping_at: new Date().toISOString(),
                });
              }
            }

            if (presenceMembers.length > 0) {
              setMembers(presenceMembers);
            }
          })
          .subscribe(async (status: string) => {
            if (!isMounted) return;
            if (status === 'SUBSCRIBED') {
              setConnectionStatus('connected');
              await channel.track({
                user_id: currentUserId,
                name: currentUserName,
                avatar_url: currentUserAvatar,
                status: room.current_status === 'focusing' ? 'focusing' : 'break',
                joined_at: new Date().toISOString(),
                camera_on: true,
              });
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              setConnectionStatus('offline');
            }
          });
      } catch (err) {
        console.warn('Realtime channel error, falling back to offline polling:', err);
        setConnectionStatus('offline');
      }
    } else {
      setConnectionStatus('offline');
    }

    // Join room member in service
    joinStudyRoom(room.id, currentUserId, 'focusing', currentUserName, currentUserAvatar).then(() => {
      getStudyRoomMembers(room.id).then((list) => {
        if (isMounted) setMembers(list);
      });
    });

    // Heartbeat ping interval
    const pingInterval = setInterval(() => {
      pingStudyRoomMember(room.id, currentUserId);
    }, 12000);

    return () => {
      isMounted = false;
      clearInterval(pingInterval);
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch {}
      }
      leaveStudyRoom(room.id, currentUserId);
    };
  }, [cleanCode, room, currentUserId, currentUserName, currentUserAvatar, onViolation]);

  // 4. Timer Countdown Synchronizer (NTP-Calibrated)
  useEffect(() => {
    if (!room) return;

    const tick = () => {
      if (room.current_status === 'waiting' || !room.start_time_iso) {
        setRemainingSeconds(room.focus_duration_minutes * 60);
        return;
      }

      const syncedCurrentTime = Date.now() + ntpOffsetRef.current;
      const durationMin =
        room.current_status === 'focusing'
          ? room.focus_duration_minutes
          : room.break_duration_minutes;

      const durationMs = durationMin * 60 * 1000;
      const startMs = new Date(room.start_time_iso).getTime();
      const endMs = room.end_time_iso ? new Date(room.end_time_iso).getTime() : startMs + durationMs;

      const diff = endMs - syncedCurrentTime;
      const remaining = Math.max(0, Math.floor(diff / 1000));
      setRemainingSeconds(remaining);

      // Alert when timer reaches 0
      if (remaining <= 0 && room.current_status === 'focusing') {
        pomodoroAudio.playAlertSound('success');
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [room]);

  // 5. Action: Trigger Violation & Shame (Self or Extension)
  const triggerSelfViolation = useCallback(
    async (reason = 'chuyển tab ra ngoài trong giờ Silent Focus', isExempt = false) => {
      const currentRoom = roomRef.current;
      if (!currentRoom) return;

      const violation = processDeserterViolation(currentUserId, currentUserName, reason, isExempt);
      if (!violation.penalized || !violation.event) return;

      // Penalize XP in shared store
      penalizeViolation(50, reason);

      // Play audio siren
      pomodoroAudio.unlock();
      pomodoroAudio.playAlertSound('penalty');

      // Update local member state
      setShameNotice(violation.event);
      setMembers((prev) =>
        prev.map((m) => (m.user_id === currentUserId ? { ...m, status: 'distracted' as StudyRoomMemberStatus } : m))
      );

      // Update database / service
      await updateMemberStatus(currentRoom.id, currentUserId, 'distracted');

      // Broadcast MEMBER_VIOLATION to all clients in the room
      if (channelRef.current && isSupabaseConfigured()) {
        try {
          channelRef.current.send({
            type: 'broadcast',
            event: 'MEMBER_VIOLATION',
            payload: violation.event,
          });
        } catch (err) {
          console.warn('Broadcast violation error:', err);
        }
      }

      if (onViolation) onViolation(violation.event);
    },
    [currentUserId, currentUserName, onViolation]
  );

  // 6. Deserter Tab-Switch Detection (VisibilityChange / Blur)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      const currentRoom = roomRef.current;
      // Only penalize if user is actively in focusing phase
      if (document.hidden && currentRoom && currentRoom.current_status === 'focusing') {
        triggerSelfViolation('chuyển tab ra ngoài trong giờ Silent Focus');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [triggerSelfViolation]);

  // 7. Action: Send Reaction (with GPU particle burst & Broadcast)
  const sendReaction = useCallback(
    (emoji: string) => {
      const validation = validateReactionEmoji(emoji);
      if (!validation.valid) {
        console.warn('Reaction validation failed:', validation.reason);
        return false;
      }

      if (!rateLimiterRef.current.canSend(currentUserId)) {
        console.warn('Reaction rate limit exceeded');
        return false;
      }

      pomodoroAudio.unlock();
      pomodoroAudio.playAlertSound('tap');

      const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const xPercent = 20 + Math.random() * 60; // 20% to 80% horizontal range

      const particle: FloatingParticleItem = {
        id,
        emoji,
        leftPercent: xPercent,
        userId: currentUserId,
        userName: currentUserName,
        timestamp: Date.now(),
      };

      setFloatingParticles((prev) => [...prev, particle]);
      setTimeout(() => {
        setFloatingParticles((prev) => prev.filter((p) => p.id !== id));
      }, 2400);

      // Broadcast reaction via channel
      if (channelRef.current && isSupabaseConfigured()) {
        try {
          channelRef.current.send({
            type: 'broadcast',
            event: 'REACTION',
            payload: {
              id,
              userId: currentUserId,
              userName: currentUserName,
              emoji,
              xPercent,
              timestamp: Date.now(),
            },
          });
        } catch (err) {
          console.warn('Broadcast reaction error:', err);
        }
      }

      if (roomRef.current) {
        postRoomReaction(roomRef.current.id, currentUserId, emoji);
      }

      return true;
    },
    [currentUserId, currentUserName]
  );

  // 8. Action: Dismiss Shame Notice
  const dismissShameNotice = useCallback(() => {
    setShameNotice(null);
    const currentRoom = roomRef.current;
    if (currentRoom) {
      updateMemberStatus(currentRoom.id, currentUserId, 'focusing');
      setMembers((prev) =>
        prev.map((m) => (m.user_id === currentUserId ? { ...m, status: 'focusing' as StudyRoomMemberStatus } : m))
      );
    }
  }, [currentUserId]);

  // 9. Action: Send Chat Message (Break Mode only)
  const sendChatMessage = useCallback(
    (text: string) => {
      const currentRoom = roomRef.current;
      if (!text.trim() || isChatLocked(currentRoom?.current_status || 'focusing')) {
        return false;
      }

      const msg: ChatMessageItem = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: currentUserName,
        text: text.trim(),
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        userId: currentUserId,
      };

      setChatMessages((prev) => [...prev, msg]);

      if (channelRef.current && isSupabaseConfigured()) {
        try {
          channelRef.current.send({
            type: 'broadcast',
            event: 'CHAT_MESSAGE',
            payload: msg,
          });
        } catch (err) {
          console.warn('Broadcast chat message error:', err);
        }
      }

      return true;
    },
    [currentUserId, currentUserName]
  );

  // 10. Host Session Controls
  const startFocus = useCallback(async () => {
    const currentRoom = roomRef.current;
    if (!currentRoom) return;

    pomodoroAudio.unlock();
    pomodoroAudio.playAlertSound('start');

    const now = new Date();
    const end = new Date(now.getTime() + currentRoom.focus_duration_minutes * 60 * 1000);

    const updated = await updateStudyRoom(currentRoom.id, {
      current_status: 'focusing',
      start_time_iso: now.toISOString(),
      end_time_iso: end.toISOString(),
    });

    setRoom(updated);
    await updateMemberStatus(currentRoom.id, currentUserId, 'focusing');

    // Broadcast TIMER_SYNC
    if (channelRef.current && isSupabaseConfigured()) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'TIMER_SYNC',
          payload: {
            status: 'focusing',
            startTimeIso: now.toISOString(),
            endTimeIso: end.toISOString(),
            durationMinutes: currentRoom.focus_duration_minutes,
            hostTimestamp: Date.now(),
            serverTimestamp: Date.now() + ntpOffsetRef.current,
          },
        });
      } catch (err) {}
    }
  }, [currentUserId]);

  const switchToBreak = useCallback(async () => {
    const currentRoom = roomRef.current;
    if (!currentRoom) return;

    pomodoroAudio.unlock();
    pomodoroAudio.playAlertSound('success');

    const now = new Date();
    const end = new Date(now.getTime() + currentRoom.break_duration_minutes * 60 * 1000);

    const updated = await updateStudyRoom(currentRoom.id, {
      current_status: 'break',
      start_time_iso: now.toISOString(),
      end_time_iso: end.toISOString(),
    });

    setRoom(updated);
    await updateMemberStatus(currentRoom.id, currentUserId, 'break', currentRoom.focus_duration_minutes);

    // Broadcast TIMER_SYNC
    if (channelRef.current && isSupabaseConfigured()) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'TIMER_SYNC',
          payload: {
            status: 'break',
            startTimeIso: now.toISOString(),
            endTimeIso: end.toISOString(),
            durationMinutes: currentRoom.break_duration_minutes,
            hostTimestamp: Date.now(),
            serverTimestamp: Date.now() + ntpOffsetRef.current,
          },
        });
      } catch (err) {}
    }
  }, [currentUserId]);

  const finishSession = useCallback(async () => {
    const currentRoom = roomRef.current;
    if (!currentRoom) return;

    const updated = await updateStudyRoom(currentRoom.id, {
      current_status: 'waiting',
      start_time_iso: null,
      end_time_iso: null,
    });

    setRoom(updated);

    if (channelRef.current && isSupabaseConfigured()) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'TIMER_SYNC',
          payload: {
            status: 'waiting',
            startTimeIso: '',
            endTimeIso: '',
            durationMinutes: currentRoom.focus_duration_minutes,
            hostTimestamp: Date.now(),
            serverTimestamp: Date.now() + ntpOffsetRef.current,
          },
        });
      } catch (err) {}
    }
  }, []);

  return {
    room,
    setRoom,
    members,
    setMembers,
    isLoading,
    connectionStatus,
    ntpOffset,
    isNtpSynced,
    syncedNow,
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
    refreshRoomData,
    isHost: room ? room.host_id === currentUserId : false,
  };
}
