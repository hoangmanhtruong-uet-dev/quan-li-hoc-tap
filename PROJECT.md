# Project: CampusOS Supabase Backend Consolidation

## Architecture
- **Ecosystem**: 100% Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS), Realtime WebSockets (`supabase.channel`), and Supabase Storage (`storage.objects`).
- **Data Model & Synchronization**: Offline-First with Optimistic Sync.
  - 0ms instant local read from `localStorage` / memory on initial page load.
  - Immediate optimistic local UI update on store mutations.
  - Debounced 2-way background synchronization to Supabase Cloud tables (`profiles`, `tasks`, `student_deadlines`, `student_calendar_events`, `workspaces`, `student_notifications`).
  - Persistent offline mutation queue (`campusos_sync_queue_v1`) stored in `localStorage` that automatically retries and flushes on browser `'online'` event.
  - Live Realtime WebSocket subscription (`campusos-realtime`) listening for `INSERT`/`UPDATE`/`DELETE` on `tasks`, `student_notifications`, and `workspaces`, with timestamp-based echo loop prevention.
  - Graceful, silent fallback when Supabase Cloud is unconfigured (`mock-supabase.supabase.co`) or offline, guaranteeing zero UI crashes or freezes.
- **Storage Strategy**:
  - 3 dedicated buckets in Supabase Storage: `academic-materials` (50MB, public), `task-attachments` (25MB, public), `student-avatars` (5MB, public).
  - Maintained backward compatibility for `STORAGE_BUCKET = 'academic-vault'` to satisfy existing unit tests.
  - Automatic Node.js `Buffer` fallback in `fileToDataUrl` ensuring SSR and test runner safety without `FileReader`.
- **Auth & Security**:
  - Supabase Auth replacing legacy MySQL `users` table.
  - Automatic student profile creation via PostgreSQL trigger `on_auth_user_created` (`handle_new_user()`), backed by application-level read-through fallback `ensureDefaultProfile()`.
  - Next.js edge middleware validating session tokens and protecting routes: `/dashboard`, `/calendar`, `/tasks`, `/study`, `/roadmaps`, `/skills`, `/clubs`, `/living`, `/notifications`, `/profile`, `/settings`, `/onboarding`, `/workspaces`, `/coach`.
  - 100% elimination of legacy `mysql2` and raw MySQL queries.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Complete Postgres Schema | 19 tables in `003_complete_campusos_schema.sql` (profiles, tasks, courses, syllabus, workspaces, members, kanban, docs, clubs, events, finances, dorms, chores, expenses, notifications) | M1 | ORIGINAL_REQUEST §R1 |
| 2 | RLS Policies & RBAC | Strict Row Level Security on all 19 tables with Security Definer helper functions and cached `(SELECT auth.uid())` | M1 | ORIGINAL_REQUEST §R1 |
| 3 | TypeScript Database Types | `src/types/database.ts` generating full Supabase database type definitions | M1 | explorer_14_1 |
| 4 | Storage Buckets Provisioning | 3 Supabase Storage buckets (`academic-materials`, `task-attachments`, `student-avatars`) with public download & authenticated upload policies | M2 | ORIGINAL_REQUEST §R2 |
| 5 | Storage Engine Upgrade | `storage-engine.ts` updated with `STORAGE_BUCKETS`, folder-to-bucket routing, Node Buffer fallback, and avatar upload helper | M2 | ORIGINAL_REQUEST §R2 |
| 6 | 0ms Local & Offline Queue Sync | CampusOS Sync Engine with 0ms local reads, optimistic mutations, and persistent offline queue (`campusos_sync_queue_v1`) | M3 | ORIGINAL_REQUEST §R3 |
| 7 | Full Tasks 2-Way Sync | Full synchronization of `tasks` table between `CampusOSSharedState` and Supabase PostgreSQL | M3 | ORIGINAL_REQUEST §R3 |
| 8 | Realtime WebSockets Channel | Realtime subscription on `supabase.channel('campusos-realtime')` for `tasks`, `notifications`, `workspaces` with echo prevention | M3 | ORIGINAL_REQUEST §R3 |
| 9 | Supabase Auth Migration | Refactor `auth.ts`, `auth-context.tsx`, and `api/auth/*` routes to use Supabase Auth with offline dev fallback | M4 | ORIGINAL_REQUEST §R4 |
| 10 | Profile Auto-Initialization | PostgreSQL trigger `handle_new_user()` + application-level `ensureDefaultProfile()` | M4 | ORIGINAL_REQUEST §R4 |
| 11 | Middleware Route Protection | Protect all student routes including `/workspaces` and `/coach` via Supabase session verification | M4 | ORIGINAL_REQUEST §R4 |
| 12 | MySQL Dependency Elimination | Eliminate `mysql2` package, remove `db.ts`, and refactor `workspace-service.ts`, `personal-workspace.ts`, and `health/route.ts` to Supabase Postgres | M4 | ORIGINAL_REQUEST §R4 |
| 13 | Comprehensive Quality Verification | 0 TS errors, 365+ tests passing (339 existing + new sync/auth/storage tests), 100% build pass on all 51 routes | M5 | Acceptance Criteria |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Schema Migrations & RLS Policies | Write `003_complete_campusos_schema.sql` and `src/types/database.ts` | none | DONE |
| M2 | Storage Buckets & Storage Engine Upgrade | Upgrade `src/lib/storage-engine.ts`, support 3 buckets + fallback, connect avatar upload | M1 | DONE |
| M3 | CampusOS Offline-First Sync Engine & Realtime | Upgrade `src/lib/supabase-sync.ts`, tasks sync, offline queue, `campusos-realtime` channel | M1, M2 | DONE |
| M4 | Supabase Auth, Middleware & MySQL Cleanup | Refactor auth, profile auto-init, middleware, clean up MySQL dependencies & `db.ts` | M1, M3 | IN_PROGRESS |
| M5 | E2E Testing, Quality Gates & Forensic Audit | Unit tests for Sync, Storage & Auth (365+ tests), typecheck 0 errors, build pass, forensic audit | M1, M2, M3, M4 | PLANNED |

---

## Code Layout
- `supabase/migrations/`:
  - `001_pomodoro_schema.sql` (existing)
  - `002_dashboard_calendar_sync.sql` (existing)
  - `003_complete_campusos_schema.sql` (new complete schema + RLS + storage buckets)
- `web/src/types/`:
  - `database.ts` (PostgreSQL / Supabase TypeScript types)
- `web/src/lib/`:
  - `supabase.ts` (Supabase client & `isSupabaseConfigured`)
  - `supabase-sync.ts` (CampusOS Sync Engine & Realtime listener)
  - `storage-engine.ts` (Storage buckets & offline Data URL fallback)
  - `auth.ts` (Supabase Auth functions & session verification)
  - `auth-context.tsx` (Client Auth provider)
  - `workspace-service.ts` & `personal-workspace.ts` (PostgreSQL/Supabase workspace persistence)
- `web/src/middleware.ts` (Route protection)
- `web/src/app/api/`:
  - `auth/*` (Supabase Auth endpoints)
  - `health/route.ts` (Health check reporting Supabase connectivity)
- `web/tests/`:
  - `supabase-sync-engine.test.ts` (new)
  - `supabase-auth-profile.test.ts` (new)
  - `supabase-storage-buckets.test.ts` (new)
