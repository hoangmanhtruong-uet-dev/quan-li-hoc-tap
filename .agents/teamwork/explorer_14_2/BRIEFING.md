# BRIEFING — 2026-10-16T20:35:00Z

## Mission
Investigate Storage Buckets, Storage Engine, and Offline-First Sync Engine & Realtime WebSockets to prepare for R2 and R3.

## 🔒 My Identity
- Archetype: explorer
- Roles: Storage & Sync Explorer
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_14_2
- Original parent: 530cc211-532a-4177-8502-4fb34c026648
- Milestone: Investigation for R2 & R3

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Inspect storage engine, offline fallback, buckets, sync engine, realtime WebSockets, store integration, resilient fallback

## Current Parent
- Conversation ID: 530cc211-532a-4177-8502-4fb34c026648
- Updated: 2026-10-16T20:35:00Z

## Investigation State
- **Explored paths**:
  - `src/lib/storage-engine.ts`
  - `src/lib/supabase-sync.ts`
  - `src/lib/supabase.ts`
  - `src/lib/campus-store.ts`
  - `src/lib/tasks-engine.ts`
  - `src/types/tasks.ts`
  - `src/components/common/pdf-preview-modal.tsx`
  - `src/components/profile/holographic-student-card.tsx`
  - `src/app/(main)/study/courses/[id]/page.tsx`
  - `supabase/migrations/001_pomodoro_schema.sql`
  - `supabase/migrations/002_dashboard_calendar_sync.sql`
  - `tests/storage-engine.test.ts`
- **Key findings**:
  - Storage bucket requirements: 3 buckets (`academic-materials` 50MB, `task-attachments` 25MB, `student-avatars` 5MB), all public with RLS policies on `storage.objects`.
  - Invariant: `STORAGE_BUCKET = 'academic-vault'` must remain exported for backward-compat with `tests/storage-engine.test.ts`, while adding `STORAGE_BUCKETS` dictionary and folder resolver.
  - Storage offline fallback needs Node.js buffer conversion when `FileReader` is undefined.
  - Critical Gap in `supabase-sync.ts`: It does NOT sync `tasks` table, has 0 Realtime WebSocket subscriptions, and lacks persistent offline queue.
  - Architecture defined for R3: 0ms synchronous local cache read, background optimistic 2-way sync queue (`campusos_sync_queue_v1`), Realtime WebSocket channel (`supabase.channel('campusos-realtime')`) listening to `tasks`, `student_notifications`, `workspaces` with echo loop prevention and unconfigured resilience (`isSupabaseConfigured()`).
- **Unexplored areas**: None within assigned scope; investigation is complete and delivered.

## Key Decisions Made
- Designed folder-to-bucket resolver (`lectures` -> `academic-materials`, `tasks` -> `task-attachments`, `avatars` -> `student-avatars`) preserving all 5 existing call sites.
- Preserved `STORAGE_BUCKET = 'academic-vault'` export to ensure zero breaking changes for existing test suite.
- Designed Realtime WebSocket state machine and timestamp-based echo loop prevention.

## Artifact Index
- analysis.md — Full deep-dive technical analysis for R2 and R3
- handoff.md — 5-component handoff report (Observation, Logic Chain, Caveats, Conclusion, Verification Method)
- progress.md — Investigation progress tracker
- DISPATCH.md — Timestamped dispatch log
