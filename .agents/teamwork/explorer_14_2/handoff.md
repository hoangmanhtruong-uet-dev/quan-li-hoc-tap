# 5-Component Handoff Report: Storage & Sync Engine Architecture (R2 & R3)

**Agent**: `explorer_14_2` (Storage & Sync Explorer)  
**Parent / Recipient**: `orchestrator_14` (`530cc211-532a-4177-8502-4fb34c026648`)  
**Date**: 2026-10-16  
**Deliverables**:
- Full Analysis: `.agents/teamwork/explorer_14_2/analysis.md`
- Handoff Report: `.agents/teamwork/explorer_14_2/handoff.md`

---

## 1. Observation

1. **Storage Engine Implementation (`src/lib/storage-engine.ts`)**:
   - Line 13: `export const STORAGE_BUCKET = 'academic-vault';`
   - Lines 76-79: `export async function uploadAcademicFile(file: File, folder: 'lectures' | 'tasks' | 'general' = 'general'): Promise<StoredFile>`
   - Line 87: `const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { cacheControl: '3600', upsert: true });`
   - Lines 107-120: Fallback catches any error and converts file to Base64 data URL via `fileToDataUrl(file)`, returning `isLocalFallback: true`.
   - Lines 64-70: `fileToDataUrl` relies directly on `new FileReader()`, which is undefined in Node.js test runner and SSR unless guarded.

2. **Storage Engine Usage Across the App**:
   - `src/components/common/pdf-preview-modal.tsx:13`: imports `formatBytes`. Renders PDF directly in `<iframe src={`${file.url}#toolbar=1&navpanes=0`} />`.
   - `src/app/(main)/study/courses/[id]/page.tsx:214`: calls `uploadAcademicFile(file, 'lectures')`.
   - `src/components/tasks/drawer/task-detail-drawer.tsx:91`: calls `uploadAcademicFile(file, 'tasks')`.
   - `src/components/tasks/create/quick-add-modal.tsx:121`: calls `uploadAcademicFile(file, 'tasks')`.
   - `src/components/workspaces/workspace-kanban.tsx:95`: calls `uploadAcademicFile(file, 'tasks')`.
   - `src/components/profile/holographic-student-card.tsx:79-89`: performs standalone Base64 conversion using `FileReader` saving to `localStorage.getItem('campusos-profile-avatar-v1')`, bypassing `storage-engine.ts`.

3. **Existing Storage Test Invariant (`tests/storage-engine.test.ts`)**:
   - Lines 32-34:
     ```ts
     test('Storage Engine (3/4): STORAGE_BUCKET is configured as academic-vault', () => {
       assert.equal(STORAGE_BUCKET, 'academic-vault');
     });
     ```
   - Running `npm test` executes 339 tests across 22 suites, and all 339 pass with 0 failures.

4. **Sync Engine Current Implementation (`src/lib/supabase-sync.ts`)**:
   - Lines 11-94: `pullFromSupabaseCloud()` queries only `student_profiles`, `student_deadlines`, and `student_calendar_events`.
   - Lines 98-169: `pushToSupabaseCloudDebounced(state: CampusOSSharedState, delayMs = 2000)` pushes only `student_profiles`, `student_deadlines`, and `student_calendar_events`.
   - Lines 171-193: `logFocusSessionToSupabase(session)` inserts into `student_focus_sessions`.
   - **Absence of Tasks Sync**: Despite `state.tasks` (`TaskItem[]`) existing in `CampusOSSharedState` (defined in `campus-store.ts:172`), `supabase-sync.ts` does NOT read, pull, or push `tasks`.
   - **Absence of Realtime WebSockets**: Grep for `channel(` across the entire repository returned 0 matches. No Realtime WebSocket listener exists.
   - **Absence of Offline Queue**: Mutations that fail when offline or unconfigured are merely logged via `console.warn` without persistent queuing or retry mechanisms.

5. **Supabase Client & Environment Configuration (`src/lib/supabase.ts`)**:
   - Lines 3-6:
     ```ts
     const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-supabase.supabase.co';
     const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';
     export const supabase = createClient(supabaseUrl, supabaseAnonKey);
     ```
   - No `.env` or `.env.local` exists in the repository. Unconfigured/offline mode is the default local development state.

---

## 2. Logic Chain

1. **Storage Bucket Architecture**:
   - *Observation 1 & 3*: Existing code and tests expect `STORAGE_BUCKET === 'academic-vault'`, but ORIGINAL_REQUEST.md explicitly requires 3 buckets: `academic-materials`, `task-attachments`, `student-avatars`.
   - *Deduction*: We must preserve `export const STORAGE_BUCKET = 'academic-vault'` for backward compatibility, while exporting `STORAGE_BUCKETS` containing the 3 official buckets:
     - `ACADEMIC_MATERIALS = 'academic-materials'` (50MB, public, PDF/Office)
     - `TASK_ATTACHMENTS = 'task-attachments'` (25MB, public, all types)
     - `STUDENT_AVATARS = 'student-avatars'` (5MB, public, images)
   - *Observation 2*: Call sites pass folder strings `'lectures'` and `'tasks'`.
   - *Deduction*: Mapping `'lectures' -> 'academic-materials'` and `'tasks' -> 'task-attachments'` enables automatic, zero-breakage routing of existing upload calls to their correct buckets.

2. **Offline Fallback & Node.js Test Safety**:
   - *Observation 1 & 5*: In tests and unconfigured dev, `supabase.storage.from(...).upload` will fail, and `FileReader` is undefined in Node.js.
   - *Deduction*: `fileToDataUrl` must provide a fallback using `file.arrayBuffer()` -> `Buffer.from(...).toString('base64')` when `typeof FileReader === 'undefined'`.
   - *Deduction*: If `isSupabaseConfigured()` is false or navigator is offline, the upload function should bypass the doomed remote network attempt immediately, returning the local fallback Data URL with 0ms latency.

3. **Sync Engine Missing Tasks & Realtime**:
   - *Observation 4*: `campus-store.ts` already triggers `pushToSupabaseCloudDebounced(next)` on every store mutation (`addTask`, `completeTask`, `updateTask`, `deleteTask`).
   - *Deduction*: By adding `tasks` table upsert to `pushToSupabaseCloudDebounced` and `tasks` select to `pullFromSupabaseCloud`, the entire task subsystem becomes automatically synchronized to Supabase with zero changes needed to individual store actions.
   - *Observation 4*: `supabase.channel('campusos-realtime')` is completely absent.
   - *Deduction*: We must implement `initRealtimeSync()` subscribing to postgres changes on `tasks`, `student_notifications`, and `workspaces`, guarded by `isSupabaseConfigured()`, with timestamp comparison to prevent echo loops.

4. **0ms Local Cache & Offline Queue**:
   - *Observation 4 & 5*: `campus-store.ts` reads `localStorage` synchronously (0ms).
   - *Deduction*: The offline-first design must retain synchronous local reads and immediate optimistic state updates, queuing pending mutations in `localStorage` under `campusos_sync_queue_v1` and flushing upon the browser `'online'` event.

---

## 3. Caveats

1. **Supabase Schema Creation Dependency**:
   - The tables `tasks`, `profiles`, `workspaces`, `student_notifications` and storage buckets `academic-materials`, `task-attachments`, `student-avatars` must be declared in PostgreSQL migration `003_complete_campusos_schema.sql` (under R1). Until that migration is applied to a live Supabase instance, all cloud calls will fail gracefully to offline fallback.
2. **Realtime Broadcast in Serverless/Local Mock**:
   - When running against `mock-supabase.supabase.co`, WebSocket connections cannot be established. The Realtime engine must detect this via `isSupabaseConfigured()` and enter silent local-offline mode to avoid throwing errors or flooding browser console logs.
3. **Storage Quota in Local Fallback**:
   - Base64 Data URLs for large files (e.g., lecture slides > 5MB) stored in `localStorage` may exceed the browser's ~5–10MB quota. In offline mode, the storage engine should store large files in memory/IndexedDB or provide user feedback if quota is reached.

---

## 4. Conclusion

1. **R2 Storage Buckets**:
   - Define the 3 public buckets in SQL (`academic-materials`, `task-attachments`, `student-avatars`) with appropriate MIME filters and size limits.
   - Upgrade `src/lib/storage-engine.ts` with `STORAGE_BUCKETS`, folder-to-bucket resolver, Node/SSR safe Base64 fallback, and helper functions (`uploadLectureSlide`, `uploadTaskAttachment`, `uploadStudentAvatar`), while preserving `STORAGE_BUCKET = 'academic-vault'` to keep existing tests green.
   - Connect student avatar uploads in `holographic-student-card.tsx` to the storage engine.
2. **R3 Offline-First Sync Engine & Realtime**:
   - Upgrade `src/lib/supabase.ts` with `isSupabaseConfigured()`.
   - Upgrade `src/lib/supabase-sync.ts` into a complete bidirectional engine:
     - Sync `tasks` table (translating between `TaskItem` and Postgres schema).
     - Add persistent offline mutation queue in `localStorage` with auto-flush on reconnect.
     - Add Realtime WebSocket listener: `supabase.channel('campusos-realtime')` on `tasks`, `student_notifications`, and `workspaces`.
     - Implement timestamp-based echo loop prevention and tear-free subscription cleanup.
3. **Quality Gates & Invariants**:
   - All 339 existing tests and `npm run typecheck` will remain completely green (0 errors).

---

## 5. Verification Method

1. **Run Current Test Suites**:
   ```bash
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm test
   ```
   *Expected*: Passes all 339 tests across 22 suites with 0 failures.

2. **Run TypeScript Check**:
   ```bash
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run typecheck
   ```
   *Expected*: Exits with code 0.

3. **Verify Existing Storage Test**:
   ```bash
   node --experimental-strip-types --test tests/storage-engine.test.ts
   ```
   *Expected*: Passes all 4 tests including `STORAGE_BUCKET is configured as academic-vault`.

4. **Verify Storage Bucket Mapping & Offline Fallback**:
   - Inspect `src/lib/storage-engine.ts` and verify `resolveBucketForFolder('lectures') === 'academic-materials'` and `resolveBucketForFolder('tasks') === 'task-attachments'`.
   - Test offline upload by passing a `File` or `Blob` and verifying that `isLocalFallback: true` and a valid Data URL are returned without throwing.

5. **Verify Realtime Channel Subscription Guard**:
   - In unconfigured environment (`mock-supabase.supabase.co`), verify that calling `initRealtimeSync()` does NOT throw, does not log errors, and returns a teardown function cleanly.
