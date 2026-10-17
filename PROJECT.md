# Project: CampusOS Đấu Trường Học Nhóm Realtime (Pomodoro Party)

## Architecture
- **Database & Realtime Layer (`supabase/migrations/006_pomodoro_party.sql`)**:
  - `public.study_rooms`: Room registry with `code` (unique 16-char), `room_type` ('public', 'private_pin', 'workspace'), `pin_code`, `workspace_id`, `focus_duration_minutes`, `break_duration_minutes`, `current_status` ('waiting', 'focusing', 'break'), `start_time_iso`, `end_time_iso`, `is_active`.
  - `public.study_room_members`: Online participants tracking with `room_id`, `user_id`, `status` ('focusing', 'distracted', 'break'), `joined_at`, `total_minutes_contributed`, `camera_on`, `last_ping_at`, with `UNIQUE(room_id, user_id)`.
  - `public.room_reactions`: High-frequency reaction broadcast channel (`room_id`, `user_id`, `emoji`, `created_at`).
  - Row Level Security: `is_study_room_member(p_room_id)` helper function, `(SELECT auth.uid())` InitPlan wrapping, foreign key indexes, and `REPLICA IDENTITY FULL` + `supabase_realtime` publication.
  - TypeScript bindings in `web/src/types/database.ts`.
- **Client & Offline Sync Service (`web/src/lib/study-rooms-service.ts`)**:
  - Abstraction layer supporting live Supabase queries and seamless mock/offline-first local fallback with sample study rooms.
- **Lobby & Multi-Modal Routing (`web/src/app/(main)/study/rooms/`)**:
  - `/study/rooms`: Cyber-Glass lobby with tab filtering (Tất cả, Môn đại cương, Môn chuyên ngành, Đồ án nhóm), quick stats, "Tạo phòng mới" modal with 3 types (Public, 6-digit PIN, Workspace-bound), and "Nhập PIN" modal.
  - `/study/rooms/[code]`: Realtime room arena route with PIN challenge, server synchronization, and state rendering.
  - `/workspaces/[workspaceId]`: Embedded 5th tab `study_room` (`WorkspaceStudyRoomPanel`) allowing direct study room launch inside project workspaces.
- **Realtime Synchronization & Silent Focus (`web/src/hooks/use-study-room-realtime.ts`)**:
  - SNTP 3-sample ping algorithm via `GET /api/study/rooms/time` calculating server clock offset `< 200ms`.
  - Supabase Realtime channel `study_room:${code}` with Broadcast (`timer_sync`, `reaction`, `member_violation`) and Presence tracking.
  - Silent Focus rule: Chat input disabled during focus phase; floating particle reactions (🔥, 👏, ❤️, 💪, ⚡) with GPU-accelerated CSS keyframes.
  - Break Mode: Chat unlocked, procedural / ambient lo-fi music, document sharing.
  - Deserter/Shame Penalty: Triggered when user switches tabs or quits early; avatar flashes red border, siren alarm sounds, public banner announces deserter, and -50 XP is penalized via `penalizeViolation(50)`.
- **3D Three.js Weekly Leaderboard Arena (`web/src/app/(main)/study/rooms/leaderboard/`)**:
  - Procedural vanilla Three.js scene: 3-tier podium (Gold, Silver, Bronze), rotating spotlight, hovering cyberpunk gold trophy with neon gem, neon particle fireworks, and top 3 student holographic cards.
  - Strict resource disposal on unmount (geometries, materials, renderer, event listeners, RAF).
- **Test Infrastructure (`web/tests/pomodoro-party.test.ts`)**:
  - Native Node test runner (`node --experimental-strip-types --test`) testing DDL schema contracts, TypeScript database types, NTP math, room access/PIN, Silent Focus logic, Leaderboard calculations, and 3D memory safety.

## Code Layout
- `supabase/migrations/006_pomodoro_party.sql` — PostgreSQL DDL, indexes, RLS, Realtime publication
- `web/src/types/database.ts` — TypeScript type definitions for study rooms, members, reactions
- `web/src/lib/study-rooms-service.ts` — Service layer for study room operations with mock/Supabase fallback
- `web/src/app/api/study/rooms/time/route.ts` — SNTP server time endpoint for <200ms clock offset sync
- `web/src/hooks/use-study-room-realtime.ts` — Realtime Broadcast, Presence, and NTP clock sync hook
- `web/src/components/study/create-room-modal.tsx` — Create Room modal (Public, 6-digit PIN, Workspace)
- `web/src/components/study/pin-entry-modal.tsx` — 6-digit numeric PIN entry modal
- `web/src/components/study/workspace-study-room-panel.tsx` — Embedded study room tab panel for workspaces
- `web/src/components/study/floating-reactions.tsx` — GPU-accelerated floating emoji reactions overlay
- `web/src/components/study/deserter-shame-banner.tsx` — Public callout banner & sound trigger for deserters
- `web/src/components/study/break-room-chat.tsx` — Break mode chat and lo-fi audio player
- `web/src/components/study/member-holo-grid.tsx` — Holographic member avatar grid with neon status lights
- `web/src/components/study/leaderboard-3d-arena.tsx` — Vanilla Three.js 3D podium, trophy, spotlight & fireworks
- `web/src/app/(main)/study/rooms/page.tsx` — Lobby page with filter tabs and room list
- `web/src/app/(main)/study/rooms/[code]/page.tsx` — Realtime study room main stage page
- `web/src/app/(main)/study/rooms/leaderboard/page.tsx` — Weekly Leaderboard Arena page
- `web/src/app/(main)/workspaces/[workspaceId]/page.tsx` — Updated workspace detail page with 5th tab `study_room`
- `web/tests/pomodoro-party.test.ts` — Comprehensive test suite for Pomodoro Party

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | Schema Migration 006 | `006_pomodoro_party.sql` with tables `study_rooms`, `study_room_members`, `room_reactions` | M1 | ORIGINAL_REQUEST § R1 |
| F02 | Row Level Security & Indexes | RLS policies using `(SELECT auth.uid())`, `is_study_room_member` function, FK indexes | M1 | ORIGINAL_REQUEST § R1 |
| F03 | Realtime Publication | Enable `supabase_realtime` and `REPLICA IDENTITY FULL` on study room tables | M1 | ORIGINAL_REQUEST § R1 |
| F04 | TypeScript Database Types | Updated `Database` interface in `web/src/types/database.ts` with row/insert/update types | M1 | ORIGINAL_REQUEST § R1 |
| F05 | Study Rooms Service Layer | `study-rooms-service.ts` with offline/mock fallback for unconfigured Supabase Cloud | M1 | ORIGINAL_REQUEST § R1 |
| F06 | Cyber-Glass Study Lobby | `/study/rooms` page with filtering tabs (Tất cả, Môn đại cương, Môn chuyên ngành, Nhóm Đồ Án) | M2 | ORIGINAL_REQUEST § R2 |
| F07 | Create Room Modal | Modal supporting 3 room types: Public, 6-digit PIN, Workspace-bound | M2 | ORIGINAL_REQUEST § R2 |
| F08 | PIN Entry Modal | 6-digit numeric PIN modal with validation and auto-focus | M2 | ORIGINAL_REQUEST § R2 |
| F09 | Dynamic Room Route | `/study/rooms/[code]` dynamic page with PIN gate and room loading | M2 | ORIGINAL_REQUEST § R2 |
| F10 | Workspace Embedded Room | 5th tab `study_room` in `/workspaces/[workspaceId]` with `<WorkspaceStudyRoomPanel />` | M2 | ORIGINAL_REQUEST § R2 |
| F11 | Server NTP Offset Route | `GET /api/study/rooms/time` SNTP endpoint calculating client-server offset (<200ms) | M3 | ORIGINAL_REQUEST § R3 |
| F12 | Realtime Clock Sync Hook | `use-study-room-realtime.ts` synchronizing timer countdown across all clients | M3 | ORIGINAL_REQUEST § R3 |
| F13 | Silent Focus Chat Lock | Text chat input disabled during focusing phase | M3 | ORIGINAL_REQUEST § R3 |
| F14 | Floating Particle Reactions | Floating reactions (🔥, 👏, ❤️, 💪, ⚡) with GPU-accelerated CSS animations | M3 | ORIGINAL_REQUEST § R3 |
| F15 | Break Mode Experience | Unlocked chat, lo-fi relaxation music, and resource sharing during breaks | M3 | ORIGINAL_REQUEST § R3 |
| F16 | Deserter Shame Mechanism | Red pulsing danger border, alarm siren, callout banner, and -50 XP penalty on tab switch/quit | M3 | ORIGINAL_REQUEST § R3 |
| F17 | Member Holographic Stage | Grid displaying member 3D holographic avatars with neon status lights (Green, Red, Yellow) | M4 | ORIGINAL_REQUEST § R4 |
| F18 | 3D Three.js Leaderboard Arena | 3-tier podium (Gold, Silver, Bronze), rotating spotlight, cyberpunk gold trophy, neon fireworks | M4 | ORIGINAL_REQUEST § R4 |
| F19 | Weekly Leaderboard Page | `/study/rooms/leaderboard` page with top 3 focus students and ranking table | M4 | ORIGINAL_REQUEST § R4 |
| F20 | Three.js Memory Safety | Explicit cleanup of geometries, materials, renderer, event listeners, and animation loop | M4 | ORIGINAL_REQUEST § R4 |
| F21 | E2E & Unit Test Suite | `web/tests/pomodoro-party.test.ts` covering 7 distinct test suites | M5 | ORIGINAL_REQUEST § Quality Gates |
| F22 | Quality Gates Verification | 100% test pass (513+ tests), 0 typecheck errors, 100% build pass | M5 | ORIGINAL_REQUEST § Quality Gates |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Supabase Realtime & Schema + Types | `006_pomodoro_party.sql`, `web/src/types/database.ts`, `study-rooms-service.ts` | none | DONE |
| M2 | Lobby & 3 Study Room types UI | `/study/rooms`, `/study/rooms/[code]`, `/workspaces/[workspaceId]` 5th tab, modals | M1 | DONE |
| M3 | Realtime Study Room Core & NTP Sync | `/api/study/rooms/time`, realtime hook, Silent Focus, particles, Deserter penalty | M1, M2 | DONE |
| M4 | Member Stage & 3D Three.js Leaderboard | `/study/rooms/leaderboard`, 3D podium, trophy, spotlight, fireworks, holo grid | M1, M2 | DONE |
| M5 | Test Suite & Quality Gates Verification | `web/tests/pomodoro-party.test.ts`, npm test, typecheck, build verification | M1, M2, M3, M4 | DONE |

## Interface Contracts
### Study Room Realtime Message Types
```typescript
export type RoomType = 'public' | 'private_pin' | 'workspace';
export type RoomStatus = 'waiting' | 'focusing' | 'break';
export type MemberStatus = 'focusing' | 'distracted' | 'break';

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
```

### NTP Server Time API Contract
```typescript
// GET /api/study/rooms/time
export interface ServerTimeResponse {
  serverTime: number; // Date.now() timestamp
  iso: string;        // new Date().toISOString()
}
```
