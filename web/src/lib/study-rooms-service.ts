import { supabase, isSupabaseConfigured } from './supabase.ts';
import type {
  StudyRoomRow,
  StudyRoomInsert,
  StudyRoomUpdate,
  StudyRoomMemberRow,
  StudyRoomMemberInsert,
  StudyRoomMemberUpdate,
  RoomReactionRow,
  RoomReactionInsert,
  StudyRoomType,
  StudyRoomStatus,
  StudyRoomMemberStatus,
} from '../types/database.ts';

// Re-export core types for consumers
export type {
  StudyRoomRow,
  StudyRoomInsert,
  StudyRoomUpdate,
  StudyRoomMemberRow,
  StudyRoomMemberInsert,
  StudyRoomMemberUpdate,
  RoomReactionRow,
  RoomReactionInsert,
  StudyRoomType,
  StudyRoomStatus,
  StudyRoomMemberStatus,
};

export type RoomType = StudyRoomType;
export type RoomStatus = StudyRoomStatus;
export type MemberStatus = StudyRoomMemberStatus;

export interface StudyRoomRealtimeState {
  room: {
    id: string;
    code: string;
    title: string;
    subject: string;
    current_status: RoomStatus;
    start_time_iso: string | null;
    end_time_iso: string | null;
    focus_duration_minutes: number;
    break_duration_minutes: number;
    host_id: string | null;
    room_type: RoomType;
  };
  members: Array<{
    user_id: string;
    name: string;
    avatar_url?: string;
    status: MemberStatus;
    total_minutes: number;
    last_ping_at: string;
  }>;
}

export type RealtimeBroadcastEvent =
  | { type: 'TIMER_SYNC'; status: RoomStatus; startTimeIso: string; endTimeIso: string; serverTimestamp: number }
  | { type: 'REACTION'; id: string; userId: string; userName: string; emoji: string; xPercent: number; timestamp: number }
  | { type: 'MEMBER_VIOLATION'; userId: string; userName: string; reason: string; penaltyXp: number; timestamp: number };

export interface LeaderboardStudent {
  rank: number;
  userId: string;
  name: string;
  avatarUrl?: string;
  totalFocusHours: number;
  completedSessions: number;
  currentStreakDays: number;
  badge: string;
  rankTitle: string;
}

export interface CreateStudyRoomInput {
  code?: string;
  title: string;
  subject?: string;
  host_id?: string | null;
  room_type?: StudyRoomType;
  pin_code?: string | null;
  workspace_id?: string | null;
  focus_duration_minutes?: number;
  break_duration_minutes?: number;
  max_participants?: number;
}

export interface StudyRoomMemberWithProfile extends StudyRoomMemberRow {
  name: string;
  avatar_url?: string;
}

// ==============================================================================
// Utility Functions
// ==============================================================================

/**
 * Generates a clean, readable 6-character uppercase alphanumeric room code.
 * Excludes ambiguous characters (0, O, 1, I).
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a unique UUID v4 compatible string in any environment.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Calculates remaining countdown seconds based on start time and duration.
 */
export function calculateRemainingSeconds(
  startTimeIso: string | null,
  durationMinutes: number,
  nowMs: number = Date.now()
): number {
  if (!startTimeIso) {
    return durationMinutes * 60;
  }
  const startTime = new Date(startTimeIso).getTime();
  const totalMs = durationMinutes * 60 * 1000;
  const elapsedMs = Math.max(0, nowMs - startTime);
  const remainingMs = Math.max(0, totalMs - elapsedMs);
  return Math.ceil(remainingMs / 1000);
}

/**
 * Filter helper for Lobby tabs: 'all', 'general', 'major', 'workspace'
 */
export function filterRoomsByTab(
  rooms: StudyRoomRow[],
  tab: 'all' | 'general' | 'major' | 'workspace'
): StudyRoomRow[] {
  if (!rooms) return [];
  switch (tab) {
    case 'general':
      return rooms.filter((r) => {
        const sub = (r.subject || '').toLowerCase();
        const title = (r.title || '').toLowerCase();
        return (
          sub.includes('đại cương') ||
          sub.includes('toán') ||
          sub.includes('triết') ||
          sub.includes('lý') ||
          sub.includes('hóa') ||
          sub.includes('tiếng anh') ||
          title.includes('đại cương') ||
          title.includes('giải tích') ||
          title.includes('triết')
        );
      });
    case 'major':
      return rooms.filter((r) => {
        const sub = (r.subject || '').toLowerCase();
        const title = (r.title || '').toLowerCase();
        return (
          sub.includes('chuyên ngành') ||
          sub.includes('máy tính') ||
          sub.includes('mạng') ||
          sub.includes('hệ điều hành') ||
          sub.includes('thuật toán') ||
          sub.includes('ai') ||
          sub.includes('phần mềm') ||
          title.includes('hệ điều hành') ||
          title.includes('mạng') ||
          title.includes('icpc')
        );
      });
    case 'workspace':
      return rooms.filter((r) => r.room_type === 'workspace' || Boolean(r.workspace_id));
    case 'all':
    default:
      return rooms.filter((r) => r.is_active);
  }
}

// ==============================================================================
// Seeded In-Memory / LocalStorage Mock State
// ==============================================================================

const STORAGE_KEY_ROOMS = 'campusos_study_rooms_v1';
const STORAGE_KEY_MEMBERS = 'campusos_study_room_members_v1';
const STORAGE_KEY_REACTIONS = 'campusos_study_room_reactions_v1';

const DEFAULT_MOCK_ROOMS: StudyRoomRow[] = [
  {
    id: 'room-gt1-01',
    code: 'GT1-01',
    title: 'Giải Tích 1 - Cày bài tập lớn & Ôn thi giữa kỳ',
    subject: 'Toán đại cương',
    host_id: 'default_student_id',
    room_type: 'public',
    pin_code: null,
    workspace_id: null,
    focus_duration_minutes: 50,
    break_duration_minutes: 10,
    current_status: 'focusing',
    start_time_iso: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    end_time_iso: new Date(Date.now() + 35 * 60 * 1000).toISOString(),
    is_active: true,
    max_participants: 24,
    created_at: new Date('2026-10-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-10-10T08:00:00Z').toISOString(),
  },
  {
    id: 'room-hdh-os',
    code: 'HDH-OS',
    title: 'Hệ Điều Hành & Lập trình mạng (Silent Focus)',
    subject: 'Khoa học máy tính',
    host_id: 'student-tech-lead',
    room_type: 'public',
    pin_code: null,
    workspace_id: null,
    focus_duration_minutes: 45,
    break_duration_minutes: 5,
    current_status: 'waiting',
    start_time_iso: null,
    end_time_iso: null,
    is_active: true,
    max_participants: 20,
    created_at: new Date('2026-10-12T10:00:00Z').toISOString(),
    updated_at: new Date('2026-10-12T10:00:00Z').toISOString(),
  },
  {
    id: 'room-cap-26',
    code: 'CAP-26',
    title: 'Đồ Án Tốt Nghiệp Capstone 2026 - AI Agent',
    subject: 'Đồ án tốt nghiệp',
    host_id: 'default_student_id',
    room_type: 'workspace',
    pin_code: null,
    workspace_id: 'ws-capstone-ai',
    focus_duration_minutes: 60,
    break_duration_minutes: 10,
    current_status: 'focusing',
    start_time_iso: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    end_time_iso: new Date(Date.now() + 35 * 60 * 1000).toISOString(),
    is_active: true,
    max_participants: 12,
    created_at: new Date('2026-10-14T14:00:00Z').toISOString(),
    updated_at: new Date('2026-10-14T14:00:00Z').toISOString(),
  },
  {
    id: 'room-vip-77',
    code: 'VIP-77',
    title: 'Phòng học kín bí mật - Đội tuyển ICPC',
    subject: 'Thuật toán chuyên sâu',
    host_id: 'student-icpc-coach',
    room_type: 'private_pin',
    pin_code: '888888',
    workspace_id: null,
    focus_duration_minutes: 50,
    break_duration_minutes: 10,
    current_status: 'waiting',
    start_time_iso: null,
    end_time_iso: null,
    is_active: true,
    max_participants: 8,
    created_at: new Date('2026-10-15T09:00:00Z').toISOString(),
    updated_at: new Date('2026-10-15T09:00:00Z').toISOString(),
  },
  {
    id: 'room-triet-1',
    code: 'TRIET1',
    title: 'Ôn thi Triết học Mác-Lênin (Chống buồn ngủ)',
    subject: 'Lý luận chính trị đại cương',
    host_id: 'student-philosophy',
    room_type: 'public',
    pin_code: null,
    workspace_id: null,
    focus_duration_minutes: 25,
    break_duration_minutes: 5,
    current_status: 'break',
    start_time_iso: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    end_time_iso: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    is_active: true,
    max_participants: 30,
    created_at: new Date('2026-10-16T11:00:00Z').toISOString(),
    updated_at: new Date('2026-10-16T11:00:00Z').toISOString(),
  },
];

const DEFAULT_MOCK_MEMBERS: StudyRoomMemberWithProfile[] = [
  {
    id: 'mem-1',
    room_id: 'room-gt1-01',
    user_id: 'default_student_id',
    status: 'focusing',
    joined_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    total_minutes_contributed: 120,
    camera_on: true,
    last_ping_at: new Date().toISOString(),
    name: 'Bạn (Minh)',
    avatar_url: '/avatars/default.png',
  },
  {
    id: 'mem-2',
    room_id: 'room-gt1-01',
    user_id: 'student-2',
    status: 'focusing',
    joined_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    total_minutes_contributed: 95,
    camera_on: false,
    last_ping_at: new Date().toISOString(),
    name: 'Nguyễn Văn Hùng',
    avatar_url: '/avatars/hung.png',
  },
  {
    id: 'mem-3',
    room_id: 'room-gt1-01',
    user_id: 'student-3',
    status: 'distracted',
    joined_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    total_minutes_contributed: 45,
    camera_on: false,
    last_ping_at: new Date().toISOString(),
    name: 'Trần Thảo Ly',
    avatar_url: '/avatars/ly.png',
  },
  {
    id: 'mem-4',
    room_id: 'room-cap-26',
    user_id: 'default_student_id',
    status: 'focusing',
    joined_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    total_minutes_contributed: 180,
    camera_on: true,
    last_ping_at: new Date().toISOString(),
    name: 'Bạn (Minh)',
    avatar_url: '/avatars/default.png',
  },
  {
    id: 'mem-5',
    room_id: 'room-cap-26',
    user_id: 'student-4',
    status: 'focusing',
    joined_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    total_minutes_contributed: 160,
    camera_on: true,
    last_ping_at: new Date().toISOString(),
    name: 'Lê Hoàng Minh',
    avatar_url: '/avatars/minh.png',
  },
];

const DEFAULT_MOCK_REACTIONS: RoomReactionRow[] = [
  {
    id: 'react-1',
    room_id: 'room-gt1-01',
    user_id: 'student-2',
    emoji: '🔥',
    created_at: new Date(Date.now() - 30 * 1000).toISOString(),
  },
  {
    id: 'react-2',
    room_id: 'room-gt1-01',
    user_id: 'student-3',
    emoji: '💪',
    created_at: new Date(Date.now() - 15 * 1000).toISOString(),
  },
];

const DEFAULT_WEEKLY_LEADERBOARD: LeaderboardStudent[] = [
  {
    rank: 1,
    userId: 'student-leader-1',
    name: 'Nguyễn Văn Hùng',
    avatarUrl: '/avatars/hung.png',
    totalFocusHours: 38.5,
    completedSessions: 46,
    currentStreakDays: 14,
    badge: '👑 Quán Quân Tuần',
    rankTitle: 'Chiến thần qua môn',
  },
  {
    rank: 2,
    userId: 'student-leader-2',
    name: 'Trần Thảo Ly',
    avatarUrl: '/avatars/ly.png',
    totalFocusHours: 32.0,
    completedSessions: 39,
    currentStreakDays: 11,
    badge: '🥈 Á Quân Bền Bỉ',
    rankTitle: 'Giáo sư tự phong',
  },
  {
    rank: 3,
    userId: 'student-leader-3',
    name: 'Lê Hoàng Minh',
    avatarUrl: '/avatars/minh.png',
    totalFocusHours: 27.5,
    completedSessions: 33,
    currentStreakDays: 9,
    badge: '🥉 Quý Quân Tập Trung',
    rankTitle: 'Trùm phao cứu sinh',
  },
  {
    rank: 4,
    userId: 'student-leader-4',
    name: 'Phạm Quỳnh Nga',
    avatarUrl: '/avatars/nga.png',
    totalFocusHours: 22.0,
    completedSessions: 26,
    currentStreakDays: 7,
    badge: '⚡ Top 5 Chiến Binh',
    rankTitle: 'Sinh viên cày thuê',
  },
  {
    rank: 5,
    userId: 'student-leader-5',
    name: 'Đặng Tuấn Kiệt',
    avatarUrl: '/avatars/kiet.png',
    totalFocusHours: 19.5,
    completedSessions: 24,
    currentStreakDays: 6,
    badge: '⚡ Top 5 Chiến Binh',
    rankTitle: 'Chiến thần thuyết trình',
  },
];

// In-Memory store singletons
let memoryRooms: Map<string, StudyRoomRow> | null = null;
let memoryMembers: Map<string, StudyRoomMemberWithProfile> | null = null;
let memoryReactions: RoomReactionRow[] | null = null;

function getMemoryRooms(): Map<string, StudyRoomRow> {
  if (memoryRooms) return memoryRooms;
  memoryRooms = new Map();

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_ROOMS);
      if (raw) {
        const parsed: StudyRoomRow[] = JSON.parse(raw);
        for (const r of parsed) {
          memoryRooms.set(r.id, r);
        }
      }
    } catch (_err) {
      // Ignore parse errors, fallback to defaults
    }
  }

  if (memoryRooms.size === 0) {
    for (const r of DEFAULT_MOCK_ROOMS) {
      memoryRooms.set(r.id, { ...r });
    }
  }
  return memoryRooms;
}

function saveMemoryRooms(rooms: Map<string, StudyRoomRow>): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const arr = Array.from(rooms.values());
      window.localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(arr));
    } catch (_err) {
      // Ignore quota errors
    }
  }
}

function getMemoryMembers(): Map<string, StudyRoomMemberWithProfile> {
  if (memoryMembers) return memoryMembers;
  memoryMembers = new Map();

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_MEMBERS);
      if (raw) {
        const parsed: StudyRoomMemberWithProfile[] = JSON.parse(raw);
        for (const m of parsed) {
          memoryMembers.set(`${m.room_id}_${m.user_id}`, m);
        }
      }
    } catch (_err) {
      // Ignore parse errors
    }
  }

  if (memoryMembers.size === 0) {
    for (const m of DEFAULT_MOCK_MEMBERS) {
      memoryMembers.set(`${m.room_id}_${m.user_id}`, { ...m });
    }
  }
  return memoryMembers;
}

function saveMemoryMembers(members: Map<string, StudyRoomMemberWithProfile>): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const arr = Array.from(members.values());
      window.localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(arr));
    } catch (_err) {
      // Ignore quota errors
    }
  }
}

function getMemoryReactions(): RoomReactionRow[] {
  if (memoryReactions) return memoryReactions;
  memoryReactions = [];

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_REACTIONS);
      if (raw) {
        memoryReactions = JSON.parse(raw);
      }
    } catch (_err) {
      // Ignore parse errors
    }
  }

  if (!memoryReactions || memoryReactions.length === 0) {
    memoryReactions = [...DEFAULT_MOCK_REACTIONS];
  }
  return memoryReactions;
}

function saveMemoryReactions(reactions: RoomReactionRow[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY_REACTIONS, JSON.stringify(reactions));
    } catch (_err) {
      // Ignore quota errors
    }
  }
}

// ==============================================================================
// Service Operations (Supabase with Resilient Offline Fallback)
// ==============================================================================

/**
 * List all study rooms, optionally filtered by room type, active status, or subject.
 */
export async function listStudyRooms(filter?: {
  room_type?: StudyRoomType;
  is_active?: boolean;
  subject?: string;
  workspace_id?: string;
}): Promise<StudyRoomRow[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('study_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter?.room_type) {
        query = query.eq('room_type', filter.room_type);
      }
      if (filter?.is_active !== undefined) {
        query = query.eq('is_active', filter.is_active);
      }
      if (filter?.workspace_id) {
        query = query.eq('workspace_id', filter.workspace_id);
      }
      if (filter?.subject) {
        query = query.ilike('subject', `%${filter.subject}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as StudyRoomRow[];
      }
    } catch (err) {
      console.warn('listStudyRooms Supabase fallback:', err);
    }
  }

  // Fallback: In-memory store
  const rooms = getMemoryRooms();
  let result = Array.from(rooms.values());

  if (filter?.is_active !== undefined) {
    result = result.filter((r) => r.is_active === filter.is_active);
  } else {
    result = result.filter((r) => r.is_active);
  }

  if (filter?.room_type) {
    result = result.filter((r) => r.room_type === filter.room_type);
  }
  if (filter?.workspace_id) {
    result = result.filter((r) => r.workspace_id === filter.workspace_id);
  }
  if (filter?.subject) {
    const s = filter.subject.toLowerCase();
    result = result.filter((r) => (r.subject || '').toLowerCase().includes(s));
  }

  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Retrieves a single study room by unique 6-character code (case-insensitive).
 */
export async function getStudyRoomByCode(code: string): Promise<StudyRoomRow | null> {
  const cleanCode = code.trim().toUpperCase();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('study_rooms')
        .select('*')
        .ilike('code', cleanCode)
        .maybeSingle();

      if (!error && data) {
        return data as StudyRoomRow;
      }
    } catch (err) {
      console.warn('getStudyRoomByCode Supabase fallback:', err);
    }
  }

  // Fallback: In-memory store
  const rooms = getMemoryRooms();
  for (const room of rooms.values()) {
    if (room.code.toUpperCase() === cleanCode) {
      return room;
    }
  }
  return null;
}

/**
 * Retrieves a single study room by UUID.
 */
export async function getStudyRoomById(id: string): Promise<StudyRoomRow | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('study_rooms')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return data as StudyRoomRow;
      }
    } catch (err) {
      console.warn('getStudyRoomById Supabase fallback:', err);
    }
  }

  // Fallback: In-memory store
  const rooms = getMemoryRooms();
  return rooms.get(id) || null;
}

/**
 * Creates a new study room. Automatically generates a 6-character code if omitted.
 */
export async function createStudyRoom(input: CreateStudyRoomInput): Promise<StudyRoomRow> {
  const code = (input.code && input.code.trim().length > 0)
    ? input.code.trim().toUpperCase()
    : generateRoomCode();

  const roomType: StudyRoomType = input.room_type || 'public';
  const pinCode = roomType === 'private_pin' ? (input.pin_code?.trim() || null) : null;

  const nowIso = new Date().toISOString();
  const newRoom: StudyRoomRow = {
    id: generateUUID(),
    code,
    title: input.title.trim(),
    subject: input.subject?.trim() || 'Học tự do',
    host_id: input.host_id || 'default_student_id',
    room_type: roomType,
    pin_code: pinCode,
    workspace_id: input.workspace_id || null,
    focus_duration_minutes: input.focus_duration_minutes || 45,
    break_duration_minutes: input.break_duration_minutes || 5,
    current_status: 'waiting',
    start_time_iso: null,
    end_time_iso: null,
    is_active: true,
    max_participants: input.max_participants || 24,
    created_at: nowIso,
    updated_at: nowIso,
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('study_rooms')
        .insert({
          code: newRoom.code,
          title: newRoom.title,
          subject: newRoom.subject,
          host_id: newRoom.host_id,
          room_type: newRoom.room_type,
          pin_code: newRoom.pin_code,
          workspace_id: newRoom.workspace_id,
          focus_duration_minutes: newRoom.focus_duration_minutes,
          break_duration_minutes: newRoom.break_duration_minutes,
          current_status: newRoom.current_status,
          is_active: newRoom.is_active,
          max_participants: newRoom.max_participants,
        })
        .select()
        .single();

      if (!error && data) {
        return data as StudyRoomRow;
      }
    } catch (err) {
      console.warn('createStudyRoom Supabase fallback:', err);
    }
  }

  // Fallback: In-memory store
  const rooms = getMemoryRooms();
  rooms.set(newRoom.id, newRoom);
  saveMemoryRooms(rooms);
  return newRoom;
}

/**
 * Updates an existing study room's state (status, timer stamps, etc.).
 */
export async function updateStudyRoom(
  id: string,
  updates: Partial<StudyRoomUpdate>
): Promise<StudyRoomRow> {
  const nowIso = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('study_rooms')
        .update({ ...updates, updated_at: nowIso })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as StudyRoomRow;
      }
    } catch (err) {
      console.warn('updateStudyRoom Supabase fallback:', err);
    }
  }

  // Fallback: In-memory store
  const rooms = getMemoryRooms();
  const existing = rooms.get(id);
  if (!existing) {
    throw new Error(`Study room with ID ${id} not found`);
  }

  const updated: StudyRoomRow = {
    ...existing,
    ...updates,
    updated_at: nowIso,
  };
  rooms.set(id, updated);
  saveMemoryRooms(rooms);
  return updated;
}

/**
 * Verifies a 6-digit numeric PIN for a private study room.
 */
export async function verifyRoomPin(
  roomOrCode: StudyRoomRow | string,
  enteredPin: string
): Promise<boolean> {
  let room: StudyRoomRow | null = null;
  if (typeof roomOrCode === 'string') {
    room = await getStudyRoomByCode(roomOrCode);
  } else {
    room = roomOrCode;
  }

  if (!room) return false;
  if (room.room_type !== 'private_pin') return true;
  if (!room.pin_code) return true;

  return room.pin_code.trim() === enteredPin.trim();
}

/**
 * Deactivates or removes a study room.
 */
export async function deleteStudyRoom(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('study_rooms')
        .update({ is_active: false })
        .eq('id', id);

      if (!error) return true;
    } catch (err) {
      console.warn('deleteStudyRoom Supabase fallback:', err);
    }
  }

  const rooms = getMemoryRooms();
  const room = rooms.get(id);
  if (room) {
    room.is_active = false;
    saveMemoryRooms(rooms);
    return true;
  }
  return false;
}

// ==============================================================================
// Study Room Members Operations
// ==============================================================================

/**
 * Adds a user to a study room, or updates their existing membership.
 */
export async function joinStudyRoom(
  roomId: string,
  userId: string,
  initialStatus: StudyRoomMemberStatus = 'focusing',
  userName?: string,
  avatarUrl?: string
): Promise<StudyRoomMemberWithProfile> {
  const nowIso = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('study_room_members')
        .upsert(
          {
            room_id: roomId,
            user_id: userId,
            status: initialStatus,
            last_ping_at: nowIso,
          },
          { onConflict: 'room_id,user_id' }
        )
        .select()
        .single();

      if (!error && data) {
        return {
          ...(data as StudyRoomMemberRow),
          name: userName || 'Sinh viên CampusOS',
          avatar_url: avatarUrl,
        };
      }
    } catch (err) {
      console.warn('joinStudyRoom Supabase fallback:', err);
    }
  }

  // Fallback: In-memory store
  const members = getMemoryMembers();
  const key = `${roomId}_${userId}`;
  const existing = members.get(key);

  const member: StudyRoomMemberWithProfile = {
    id: existing?.id || generateUUID(),
    room_id: roomId,
    user_id: userId,
    status: initialStatus,
    joined_at: existing?.joined_at || nowIso,
    total_minutes_contributed: existing?.total_minutes_contributed || 0,
    camera_on: existing?.camera_on || false,
    last_ping_at: nowIso,
    name: userName || existing?.name || 'Bạn',
    avatar_url: avatarUrl || existing?.avatar_url,
  };

  members.set(key, member);
  saveMemoryMembers(members);
  return member;
}

/**
 * Removes a member from a study room.
 */
export async function leaveStudyRoom(roomId: string, userId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('study_room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (!error) return true;
    } catch (err) {
      console.warn('leaveStudyRoom Supabase fallback:', err);
    }
  }

  const members = getMemoryMembers();
  const key = `${roomId}_${userId}`;
  const deleted = members.delete(key);
  if (deleted) {
    saveMemoryMembers(members);
  }
  return true;
}

/**
 * Lists all online members in a given study room.
 */
export async function getStudyRoomMembers(
  roomId: string
): Promise<StudyRoomMemberWithProfile[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('study_room_members')
        .select('*, profiles(display_name, avatar_url)')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          room_id: row.room_id,
          user_id: row.user_id,
          status: row.status as StudyRoomMemberStatus,
          joined_at: row.joined_at,
          total_minutes_contributed: row.total_minutes_contributed,
          camera_on: row.camera_on,
          last_ping_at: row.last_ping_at,
          name: row.profiles?.display_name || 'Sinh viên CampusOS',
          avatar_url: row.profiles?.avatar_url,
        }));
      }
    } catch (err) {
      console.warn('getStudyRoomMembers Supabase fallback:', err);
    }
  }

  // Fallback: In-memory store
  const members = getMemoryMembers();
  const list: StudyRoomMemberWithProfile[] = [];
  for (const m of members.values()) {
    if (m.room_id === roomId) {
      list.push({ ...m });
    }
  }

  // If no members in room, add default user as host/participant for immediate playability
  if (list.length === 0) {
    const defaultHost: StudyRoomMemberWithProfile = {
      id: generateUUID(),
      room_id: roomId,
      user_id: 'default_student_id',
      status: 'focusing',
      joined_at: new Date().toISOString(),
      total_minutes_contributed: 0,
      camera_on: true,
      last_ping_at: new Date().toISOString(),
      name: 'Bạn (Host)',
      avatar_url: '/avatars/default.png',
    };
    members.set(`${roomId}_default_student_id`, defaultHost);
    list.push(defaultHost);
  }

  return list;
}

/**
 * Updates a member's status ('focusing' | 'distracted' | 'break') and optionally adds minutes.
 */
export async function updateMemberStatus(
  roomId: string,
  userId: string,
  status: StudyRoomMemberStatus,
  minutesContributedDelta: number = 0
): Promise<StudyRoomMemberWithProfile | null> {
  const nowIso = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('study_room_members')
        .update({
          status,
          last_ping_at: nowIso,
        })
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (!error && data) {
        return {
          ...(data as StudyRoomMemberRow),
          name: 'Sinh viên CampusOS',
        };
      }
    } catch (err) {
      console.warn('updateMemberStatus Supabase fallback:', err);
    }
  }

  // Fallback: In-memory store
  const members = getMemoryMembers();
  const key = `${roomId}_${userId}`;
  const member = members.get(key);
  if (!member) return null;

  member.status = status;
  member.last_ping_at = nowIso;
  if (minutesContributedDelta > 0) {
    member.total_minutes_contributed += minutesContributedDelta;
  }

  saveMemoryMembers(members);
  return { ...member };
}

/**
 * Updates a member's heartbeat ping timestamp.
 */
export async function pingStudyRoomMember(roomId: string, userId: string): Promise<boolean> {
  const nowIso = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('study_room_members')
        .update({ last_ping_at: nowIso })
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (!error) return true;
    } catch (err) {
      // Non-critical fallback
    }
  }

  const members = getMemoryMembers();
  const key = `${roomId}_${userId}`;
  const m = members.get(key);
  if (m) {
    m.last_ping_at = nowIso;
    saveMemoryMembers(members);
    return true;
  }
  return false;
}

// ==============================================================================
// Room Reactions Operations
// ==============================================================================

/**
 * Posts a real-time emoji reaction to a study room.
 */
export async function postRoomReaction(
  roomId: string,
  userId: string,
  emoji: string
): Promise<RoomReactionRow> {
  const newReaction: RoomReactionRow = {
    id: generateUUID(),
    room_id: roomId,
    user_id: userId,
    emoji: emoji.slice(0, 20),
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('room_reactions')
        .insert({
          room_id: newReaction.room_id,
          user_id: newReaction.user_id,
          emoji: newReaction.emoji,
        })
        .select()
        .single();

      if (!error && data) {
        return data as RoomReactionRow;
      }
    } catch (err) {
      console.warn('postRoomReaction Supabase fallback:', err);
    }
  }

  // Fallback: In-memory store
  const reactions = getMemoryReactions();
  reactions.unshift(newReaction);
  if (reactions.length > 100) {
    reactions.length = 100;
  }
  saveMemoryReactions(reactions);
  return newReaction;
}

/**
 * Retrieves recent floating reactions for a study room.
 */
export async function getRecentReactions(
  roomId: string,
  limit: number = 20
): Promise<RoomReactionRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('room_reactions')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data as RoomReactionRow[];
      }
    } catch (err) {
      console.warn('getRecentReactions Supabase fallback:', err);
    }
  }

  // Fallback: In-memory store
  const reactions = getMemoryReactions();
  return reactions
    .filter((r) => r.room_id === roomId)
    .slice(0, limit);
}

// ==============================================================================
// Weekly Leaderboard Operations
// ==============================================================================

/**
 * Retrieves the weekly study leaderboard for the 3D Three.js Podium Arena.
 */
export async function getWeeklyStudyLeaderboard(): Promise<LeaderboardStudent[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, avatar_url, xp, level, rank_title, streak')
        .order('xp', { ascending: false })
        .limit(10);

      if (!error && data && data.length >= 3) {
        return data.map((p: any, idx: number) => ({
          rank: idx + 1,
          userId: p.id,
          name: p.display_name || p.full_name || 'Chiến thần CampusOS',
          avatarUrl: p.avatar_url,
          totalFocusHours: Math.round(((p.xp || 100) / 60) * 10) / 10,
          completedSessions: Math.round((p.xp || 100) / 50),
          currentStreakDays: p.streak || 1,
          badge: idx === 0 ? '👑 Quán Quân Tuần' : idx === 1 ? '🥈 Á Quân Bền Bỉ' : idx === 2 ? '🥉 Quý Quân Tập Trung' : '⚡ Top Chiến Binh',
          rankTitle: p.rank_title || 'Sinh viên cày thuê',
        }));
      }
    } catch (err) {
      console.warn('getWeeklyStudyLeaderboard Supabase fallback:', err);
    }
  }

  // Fallback: Curated Vietnamese high-achiever leaderboard
  return [...DEFAULT_WEEKLY_LEADERBOARD];
}
