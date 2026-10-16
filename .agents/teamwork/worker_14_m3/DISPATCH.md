## 2026-10-16T21:11:57Z
You are worker_14_m3 (CampusOS Sync Engine Worker).
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_14_m3
Project root: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap
Web app directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
Authoritative request log: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md
Project plan: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
Sync Analysis: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_14_2\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your write ownership:
You exclusively own:
- `web/src/lib/supabase-sync.ts`
- `web/tests/supabase-sync-engine.test.ts`

Your mission:
Upgrade `web/src/lib/supabase-sync.ts` into the full **CampusOS Sync Engine** (R3):
1. **0ms Local Cache & Optimistic Sync**:
   - Maintain fast local loading from `localStorage` / memory.
   - Keep existing `pullFromSupabaseCloud` and `pushToSupabaseCloudDebounced` exports.
2. **Tasks 2-Way Sync**:
   - Map `TaskItem` in `CampusOSSharedState` to `public.tasks` table schema:
     - `TaskItem.id` -> `id`
     - `TaskItem.title` -> `title`
     - `TaskItem.description` -> `description`
     - `TaskItem.status` -> `status`
     - `TaskItem.priority` -> `priority`
     - `TaskItem.dueDate` -> `due_date`
     - `TaskItem.estimatedMinutes` -> `estimated_minutes`
     - `TaskItem.course` -> `course_id`
     - `TaskItem.quadrant` -> `eisenhower_quadrant`
     - `TaskItem.subtasks` -> `subtasks` (JSONB)
     - `TaskItem.attachments` -> `attachments` (JSONB)
     - `TaskItem.completedAt` -> `completed_at`
     - `TaskItem.updatedAt` -> `updated_at`
   - In `pushToSupabaseCloud`: Upsert `tasks` into Supabase `tasks` table.
   - In `pullFromSupabaseCloud`: Select `tasks` from Supabase `tasks` table and map back to `TaskItem[]`.
3. **Persistent Offline Mutation Queue**:
   - Store queued mutations under `localStorage.getItem('campusos_sync_queue_v1')`.
   - When offline or when Supabase push fails, add mutation payload to queue.
   - Export `flushOfflineQueue(): Promise<{ flushedCount: number, success: boolean }>`.
   - Export `getOfflineQueueSize(): number`.
   - Attach listener to `window.addEventListener('online', ...)` to auto-flush queued items when network is restored.
4. **Realtime WebSockets**:
   - Export `initCampusOSRealtimeSync(callbacks?: { onTaskChange?: (payload: any) => void, onNotification?: (payload: any) => void, onWorkspaceChange?: (payload: any) => void }): () => void`.
   - Use `supabase.channel('campusos-realtime')` to subscribe to Postgres changes:
     - Table `tasks`: event: '*'
     - Table `student_notifications`: event: '*'
     - Table `workspaces`: event: '*'
   - Guard against echo loops (track last local mutation timestamp / source ID so incoming realtime events caused by the current client do not trigger duplicate store updates).
   - Safe unconfigured fallback: if `!isSupabaseConfigured()` or `typeof window === 'undefined'`, do NOT attempt websocket connection; return a no-op cleanup function `() => {}` silently without throwing.
5. **Testing**:
   - In `web/tests/supabase-sync-engine.test.ts`:
     - Test `taskToRow` and `rowToTask` conversion accuracy.
     - Test offline queueing and queue storage.
     - Test `flushOfflineQueue`.
     - Test `initCampusOSRealtimeSync` in offline/mock environment returns a teardown function cleanly.
6. **Verification**:
   - `npm run typecheck` in `web/` (0 errors).
   - `npm test` in `web/` (100% tests pass, now 365+ tests).
   - `npm run build` in `web/` (34/34 routes pass).
7. Deliver `handoff.md` with complete verification command outputs.
