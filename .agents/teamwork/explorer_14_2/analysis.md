# Deep Technical Analysis: Storage Buckets, Storage Engine, and Offline-First Sync Engine & Realtime WebSockets

**Author**: `explorer_14_2` (Storage & Sync Explorer)  
**Date**: 2026-10-16  
**Scope**: Milestone R2 (Storage Buckets) & R3 (Offline-First Sync Engine & Realtime WebSockets)  
**Project**: CampusOS Next.js 14 App Router  
**Target Codebase Paths**:
- `src/lib/storage-engine.ts`
- `src/lib/supabase-sync.ts`
- `src/lib/supabase.ts`
- `src/lib/campus-store.ts`
- `supabase/migrations/`

---

## 1. Executive Summary

CampusOS requires a enterprise-grade, offline-first backend architecture powered by Supabase. In this investigation, we audited the existing file storage and synchronization subsystems.

### Core Discoveries:
1. **Storage Engine Current State**:
   - `src/lib/storage-engine.ts` is implemented as a rudimentary single-bucket client pointing to a legacy `'academic-vault'` bucket.
   - It is actively imported across 5 major UI components: Course Detail (`courses/[id]`), Task Detail Drawer (`task-detail-drawer.tsx`), QuickAdd Modal (`quick-add-modal.tsx`), Workspace Kanban (`workspace-kanban.tsx`), and PDF Preview Modal (`pdf-preview-modal.tsx`).
   - Profile avatars in `holographic-student-card.tsx` currently only convert images to base64 Data URLs saved in `localStorage`, bypassing the storage engine entirely.
   - Existing test `tests/storage-engine.test.ts` asserts `assert.equal(STORAGE_BUCKET, 'academic-vault')`. To preserve backward compatibility and guarantee all 339 existing unit tests continue to pass with 0 failures, `STORAGE_BUCKET` must remain exported as `'academic-vault'`, alongside the new `STORAGE_BUCKETS` dictionary and bucket routing logic.
2. **Sync Engine Current State**:
   - `src/lib/supabase-sync.ts` only implements partial synchronization for `student_profiles`, `student_deadlines`, and `student_calendar_events`.
   - **Critical Gap**: It completely lacks synchronization for `tasks` (`TaskItem`), `student_notifications`, and `workspaces`.
   - **Critical Gap**: There is currently **zero** Realtime WebSocket implementation (`supabase.channel(...)` does not exist anywhere in the codebase).
   - **Critical Gap**: If the browser is offline or Supabase Cloud is unconfigured, mutations are not queued in a persistent retry buffer.
3. **Environment & Resilience**:
   - Neither `.env` nor `.env.local` exists in the repository. `src/lib/supabase.ts` defaults to `'https://mock-supabase.supabase.co'`.
   - Therefore, offline fallback and resilience against unconfigured Supabase Cloud is the **primary operating mode** during local development and testing. The app must run 100% smoothly at 60–120FPS with 0ms UI lag and zero console/runtime crashes when disconnected.

---

## 2. Storage Buckets & Storage Engine (R2 Specification)

### 2.1 The 3 Required Storage Buckets

| Bucket Name | Target Content | Access Policy | Max Size | Allowed MIME Types | Target Call Sites |
|---|---|---|---|---|---|
| `academic-materials` | Weekly lecture slide decks, course syllabi, academic PDF papers | **Public** (CDN Cached) | 50 MB | `application/pdf`, `.ppt`, `.pptx`, `.doc`, `.docx`, octet-stream | `courses/[id]/page.tsx`, `workspace-documents.tsx` |
| `task-attachments` | Homework submissions, student project attachments, code archives, lab logs | **Public** (Direct 0ms preview) | 25 MB | `*/*` (Any: docs, images, archives, code) | `task-detail-drawer.tsx`, `quick-add-modal.tsx`, `workspace-kanban.tsx` |
| `student-avatars` | Holographic student identity photos, Squad avatars | **Public** (Fast display across UI) | 5 MB | `image/png`, `image/jpeg`, `image/webp`, `image/gif`, `image/svg+xml` | `holographic-student-card.tsx`, `profile/page.tsx` |

#### Rationale for Public vs. Private:
1. **Direct 0ms Preview**: In the Cyber-Glass UI, student users expect instant file preview via `<PdfPreviewModal>` (which uses an `<iframe>`) and instant avatar rendering via `<img>`. Private buckets would require an extra asynchronous roundtrip to create a signed URL with a finite expiration token, degrading the 120FPS zero-lag experience and failing when offline.
2. **Security through Unguessable Path Hashing**: Files are stored with secure path prefixes: `${folder}/${Date.now()}_${crypto.randomUUID()}_${cleanFilename}`.
3. **CDN Edge Caching**: `cacheControl: '3600'` ensures Supabase Storage CDN caches assets close to the client.

### 2.2 Storage Bucket SQL Migrations & RLS Policies

To be included in `supabase/migrations/003_complete_campusos_schema.sql`:

```sql
-- ============================================================================
-- Supabase Storage Buckets Setup
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'academic-materials',
    'academic-materials',
    true,
    52428800, -- 50 MB
    ARRAY['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream']
  ),
  (
    'task-attachments',
    'task-attachments',
    true,
    26214400, -- 25 MB
    NULL -- All MIME types accepted
  ),
  (
    'student-avatars',
    'student-avatars',
    true,
    5242880, -- 5 MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies on storage.objects
-- 1. Public Read Access
CREATE POLICY "Public Read academic-materials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'academic-materials');

CREATE POLICY "Public Read task-attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'task-attachments');

CREATE POLICY "Public Read student-avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'student-avatars');

-- 2. Insert Access (Authenticated + Anon fallback for dev/demo)
CREATE POLICY "Allow Upload to academic-materials"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'academic-materials');

CREATE POLICY "Allow Upload to task-attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'task-attachments');

CREATE POLICY "Allow Upload to student-avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'student-avatars');

-- 3. Delete / Update Access (Owner or Admin)
CREATE POLICY "Allow Owner Delete academic-materials"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'academic-materials');

CREATE POLICY "Allow Owner Delete task-attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'task-attachments');

CREATE POLICY "Allow Owner Delete student-avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'student-avatars');
```

### 2.3 Upgraded `src/lib/storage-engine.ts` Architecture

#### Proposed Interfaces & API:
```ts
export const STORAGE_BUCKET = 'academic-vault'; // Preserved for backward-compatibility with tests

export const STORAGE_BUCKETS = {
  ACADEMIC_MATERIALS: 'academic-materials',
  TASK_ATTACHMENTS: 'task-attachments',
  STUDENT_AVATARS: 'student-avatars',
  LEGACY_VAULT: 'academic-vault',
} as const;

export type StorageBucketId = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS] | string;

export interface StoredFile {
  id: string;
  name: string;
  url: string;
  sizeBytes: number;
  type: 'pdf' | 'slide' | 'doc' | 'image' | 'other';
  uploadedAt: string;
  isLocalFallback?: boolean;
  bucket?: StorageBucketId;
}

/**
 * Maps logical folder / upload intent to the appropriate bucket
 */
export function resolveBucketForFolder(folder: string): StorageBucketId {
  switch (folder) {
    case 'lectures':
    case 'syllabus':
    case 'academic':
      return STORAGE_BUCKETS.ACADEMIC_MATERIALS;
    case 'tasks':
    case 'attachments':
    case 'workspaces':
      return STORAGE_BUCKETS.TASK_ATTACHMENTS;
    case 'avatars':
    case 'profiles':
      return STORAGE_BUCKETS.STUDENT_AVATARS;
    default:
      return STORAGE_BUCKETS.ACADEMIC_MATERIALS;
  }
}
```

#### Dual-Environment Resilient Fallback:
1. **Node.js & SSR Safety**:
   In `fileToDataUrl(file: File | Blob)`:
   If `typeof FileReader === 'undefined'`, safely read via:
   ```ts
   if (typeof FileReader === 'undefined') {
     const buffer = Buffer.from(await file.arrayBuffer());
     const mime = file.type || 'application/octet-stream';
     return `data:${mime};base64,${buffer.toString('base64')}`;
   }
   ```
2. **Immediate Offline Bypassing**:
   Before calling `supabase.storage.from(...)`, check `isSupabaseConfigured() && (typeof navigator === 'undefined' || navigator.onLine)`. If false, instantly generate local fallback with `isLocalFallback: true` and 0ms latency, completely avoiding network timeout latency.
3. **Local Offline Registry**:
   Track offline uploaded files in `campusos_offline_attachments_v1` in `localStorage` so they can be re-synced if needed.
4. **Dedicated Helpers**:
   - `uploadLectureSlide(file: File): Promise<StoredFile>`
   - `uploadTaskAttachment(file: File): Promise<StoredFile>`
   - `uploadStudentAvatar(file: File): Promise<StoredFile>`

---

## 3. Offline-First Sync Engine & Realtime WebSockets (R3 Specification)

### 3.1 Architectural Pillars

```
+--------------------------------------------------------------------------+
|                            CampusOS UI Layer                             |
|  (/dashboard, /calendar, /tasks, /workspaces, /profile, /notifications)  |
+------------------------------------+-------------------------------------+
                                     |
               Synchronous 0ms Reads | Optimistic Synchronous Writes
                                     v
+--------------------------------------------------------------------------+
|                  CampusStore (useSyncExternalStore)                      |
|                  Reactive In-Memory State Layer                          |
+------------------------------------+-------------------------------------+
                                     |
                      Synchronous    | Async Debounced
                      Mirroring      | Background Push
                                     v
+------------------------+  +----------------------------------------------+
| localStorage Cache     |  | CampusOS Sync Engine (supabase-sync.ts)      |
| (0ms Boot Persistence) |  | - Persistent Offline Mutation Queue          |
+------------------------+  | - Bidirectional Smart Merging Engine         |
                            | - Network State Observer (online/offline)    |
                            +--------------------+-------------------------+
                                                 |
                                 REST / Realtime | WebSockets
                                                 v
                            +----------------------------------------------+
                            | Supabase Cloud / Postgres Backend            |
                            | - postgres_changes on tasks, notifications   |
                            | - Row Level Security (RLS) enforcement       |
                            +----------------------------------------------+
```

### 3.2 0ms Local Cache Loading

1. `campus-store.ts` already implements synchronous 0ms cache loading on boot:
   - `getSharedState()` executes `window.localStorage.getItem(CAMPUS_STORAGE_KEY)`.
   - If present, parses instantly and returns `memoryState`.
   - No `await`, no loading spinners, no UI freeze.
2. In `supabase-sync.ts`, expose `getSyncEngineStatus()` and `isLocalCacheReady()` so any component can inspect sync health without causing side effects.
3. Cloud pull (`pullFromSupabaseCloud()`) is triggered non-blockingly via `hydrateFromCloudIfAvailable()`, reconciling in the background.

### 3.3 Two-Way Optimistic Sync Queue

#### Mutation Queue Contract:
```ts
export interface SyncMutation {
  id: string; // UUID
  entity: 'task' | 'deadline' | 'event' | 'profile' | 'notification' | 'workspace_task';
  action: 'UPSERT' | 'DELETE';
  payload: any;
  timestamp: number;
  retries: number;
}
```

#### Queue Storage & Reconnect Protocol:
1. When an optimistic action occurs in the UI:
   - `campus-store.ts` applies the state change synchronously to `memoryState` and `localStorage`.
   - A mutation record is enqueued in the local sync queue: `campusos_sync_queue_v1`.
2. When online and Supabase is configured:
   - `pushToSupabaseCloudDebounced` flushes the queue sequentially or in bulk.
   - On successful upsert, mutation is removed from the queue.
3. When offline or server returns 5xx/network error:
   - Mutation stays in `localStorage`.
   - `window.addEventListener('online', () => flushSyncQueue())` automatically replays queued mutations as soon as network returns.
   - Exponential backoff (1s, 2s, 4s, 8s, up to max 30s) prevents hammering during intermittent connectivity.

### 3.4 Tasks Synchronization Protocol

#### Database Schema Mapping:
`TaskItem` in `src/types/tasks.ts` maps directly to Postgres `tasks` table:

| TypeScript `TaskItem` Field | Postgres `tasks` Column | Type |
|---|---|---|
| `id` | `id` | `TEXT PRIMARY KEY` |
| `'default_student'` or `auth.uid()` | `user_id` | `TEXT` / `UUID` |
| `title` | `title` | `TEXT NOT NULL` |
| `description` | `description` | `TEXT` |
| `course` | `course` | `TEXT` |
| `subjectId` | `subject_id` | `TEXT` |
| `status` | `status` | `TEXT DEFAULT 'todo'` |
| `priority` | `priority` | `TEXT DEFAULT 'medium'` |
| `difficulty` | `difficulty` | `INT DEFAULT 3` |
| `dueAt` | `due_at` | `TIMESTAMPTZ` / `TEXT` |
| `estimateMin` | `estimate_min` | `INT DEFAULT 45` |
| `actualMin` | `actual_min` | `INT DEFAULT 0` |
| `steps` | `steps` | `JSONB DEFAULT '[]'` |
| `tags` | `tags` | `JSONB DEFAULT '[]'` |
| `assigneeIds` | `assignee_ids` | `JSONB DEFAULT '[]'` |
| `pomodoros` | `pomodoros` | `JSONB` |
| `quadrant` | `quadrant` | `TEXT` |
| `order` | `order_num` | `INT DEFAULT 0` |
| `notes` | `notes` | `TEXT` |
| `attachments` | `attachments` | `JSONB DEFAULT '[]'` |
| `activityLog` | `activity_log` | `JSONB DEFAULT '[]'` |
| `createdAt` | `created_at` | `TIMESTAMPTZ DEFAULT NOW()` |
| `completedAt` | `completed_at` | `TIMESTAMPTZ` |

#### Reconciling Tasks on Pull:
In `pullFromSupabaseCloud()`:
```ts
// 4. Fetch Tasks
const { data: tasksData } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', userId);

if (tasksData && tasksData.length > 0) {
  partialState.tasks = tasksData.map(mapPostgresToTaskItem);
}
```
In `campus-store.ts` (`hydrateFromCloudIfAvailable`):
- For tasks present in cloud but absent locally: add to local state.
- For tasks present in both: compare `completedAt` or `updated_at`. If local has uncommitted pending mutations in the sync queue, preserve local; otherwise adopt cloud state.

### 3.5 Realtime WebSockets: `supabase.channel('campusos-realtime')`

#### Subscription Specification:
```ts
let realtimeChannel: RealtimeChannel | null = null;

export function initRealtimeSync(): () => void {
  if (typeof window === 'undefined') return () => {};
  
  if (!isSupabaseConfigured()) {
    console.info('[CampusOS Realtime] Supabase Cloud unconfigured. Realtime runs in local-offline mode.');
    return () => {};
  }

  try {
    realtimeChannel = supabase.channel('campusos-realtime')
      // 1. Tasks Listener
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => handleRealtimeTaskChange(payload)
      )
      // 2. Notifications Listener
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_notifications' },
        (payload) => handleRealtimeNotificationChange(payload)
      )
      // 3. Workspaces Listener
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workspaces' },
        (payload) => handleRealtimeWorkspaceChange(payload)
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          syncState.realtimeConnected = true;
          notifySyncSubscribers();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          syncState.realtimeConnected = false;
          notifySyncSubscribers();
        }
      });
  } catch (err) {
    console.warn('[CampusOS Realtime] Subscription error:', err);
  }

  return () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  };
}
```

#### Loop & Echo Prevention:
When a mutation is pushed from the local client to Supabase, Supabase Realtime emits a `postgres_changes` event back to the same client.
To prevent infinite update loops:
1. Attach a client mutation timestamp or UUID: `client_updated_at`.
2. Compare incoming payload timestamp with local entity timestamp.
3. If the incoming payload timestamp is `<= local timestamp`, discard the event.
4. When applying remote realtime changes to `campus-store.ts`, use an internal `applyRemoteRealtimeUpdate()` that mutates the store without scheduling another push to Supabase!

### 3.6 Fault Tolerance & Safe Fallback

1. **Unconfigured Supabase Guard**:
   Add `isSupabaseConfigured()` to `src/lib/supabase.ts`:
   ```ts
   export function isSupabaseConfigured(): boolean {
     const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
     const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
     return Boolean(
       url &&
       key &&
       !url.includes('mock-supabase') &&
       url.startsWith('https://') &&
       key !== 'mock-anon-key'
     );
   }
   ```
2. **Defensive Async Operations**:
   Every function (`pullFromSupabaseCloud`, `pushToSupabaseCloudDebounced`, `uploadAcademicFile`, `initRealtimeSync`) is wrapped in `try/catch`. Unhandled rejections are impossible.
3. **Never Block UI**:
   All sync actions are decoupled from React render loops via `useSyncExternalStore` and background microtasks. The UI runs at 120FPS with 0ms input latency regardless of network latency or outage.

---

## 4. Test Environment & Verification Plan

### 4.1 Current Test Harness
- Test runner: `node --experimental-strip-types --test tests/*.test.ts`.
- Status: **339 tests passing, 0 failures, 0 skipped**.
- TypeScript compiler: `npm run typecheck` passes with **0 errors**.

### 4.2 Verification Matrix for R2 & R3
When R2 and R3 are implemented, the following test suites must be created/expanded:
1. `tests/storage-engine.test.ts`:
   - Keep existing 4 tests passing (`formatBytes`, `inferFileType`, `STORAGE_BUCKET === 'academic-vault'`, `StoredFile`).
   - Add tests for `STORAGE_BUCKETS` dictionary (`academic-materials`, `task-attachments`, `student-avatars`).
   - Add tests for `resolveBucketForFolder` mapping logic.
   - Add tests for offline base64 fallback in Node.js test environment (verifying `fileToDataUrl` with `File` or `Blob`).
2. `tests/supabase-sync-engine.test.ts`:
   - Test `isSupabaseConfigured()`.
   - Test offline queue serialization (`enqueueSyncMutation`, queue retrieval, queue deduplication).
   - Test task entity mapping between `TaskItem` and Postgres table record.
   - Test 0ms cache loading and conflict resolution logic (merging XP, streak, tasks, deadlines).
   - Test safe fallback when Supabase Cloud returns network error or is disconnected.

---

## 5. Conclusion & Recommendations for Implementer

1. **R2 Implementation Order**:
   - Update `src/lib/storage-engine.ts` with `STORAGE_BUCKETS`, `resolveBucketForFolder`, Node.js buffer fallback in `fileToDataUrl`, and bucket-routing upload functions.
   - Maintain `STORAGE_BUCKET = 'academic-vault'` export for backward-compatibility.
   - Update `supabase/migrations/003_complete_campusos_schema.sql` to include the bucket definitions and storage RLS policies.
   - Wire `HolographicStudentCard` to use the storage engine for student avatar uploads.
2. **R3 Implementation Order**:
   - Update `src/lib/supabase.ts` to export `isSupabaseConfigured()`.
   - Upgrade `src/lib/supabase-sync.ts` with offline mutation queue, full `tasks` table syncing, and Realtime WebSocket channel (`campusos-realtime`).
   - Wire `campus-store.ts` to sync `tasks` in `pushToSupabaseCloudDebounced` and `hydrateFromCloudIfAvailable`.
   - Add unit tests in `tests/supabase-sync-engine.test.ts` to ensure coverage across all sync states.
