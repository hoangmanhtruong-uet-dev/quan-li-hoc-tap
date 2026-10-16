# BRIEFING — 2026-10-16T20:45:00Z

## Mission
Create `supabase/migrations/003_complete_campusos_schema.sql` and `web/src/types/database.ts` implementing a 100% production-ready Supabase Postgres schema with RLS, performance indexing, security definer functions, storage buckets, and complete TypeScript database typing.

## 🔒 My Identity
- Archetype: Database Schema & Types Specialist
- Roles: implementer, qa, specialist
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_14_m1
- Original parent: 530cc211-532a-4177-8502-4fb34c026648
- Milestone: M1 (Database Schema & Types)

## 🔒 Key Constraints
- Do not cheat: genuine implementation, no dummy mocks, no hardcoded verification strings.
- Exclusively own `supabase/migrations/003_complete_campusos_schema.sql` and `web/src/types/database.ts`. Do not edit other milestone files.
- Follow Supabase Postgres best practices:
  - Explicit indexes on foreign keys and filter columns.
  - Avoid RLS recursion with SECURITY DEFINER functions (`is_workspace_member`, `is_workspace_admin`, `is_club_member`, `is_club_admin`, `is_dorm_member`) with `SET search_path = ''`.
  - Wrap `(SELECT auth.uid())` in policies so PostgreSQL can cache execution plans (InitPlan).
  - Use UUID primary keys with `gen_random_uuid()`.
  - Auto user profile trigger `on_auth_user_created` (`handle_new_user()`).
  - Storage bucket definitions in `storage.buckets` (`academic-materials`, `task-attachments`, `student-avatars`) with storage RLS.
- Verification: `npm run typecheck` 0 errors, `npm test` 339+ tests passing 100%.

## Current Parent
- Conversation ID: 530cc211-532a-4177-8502-4fb34c026648
- Updated: 2026-10-16T20:45:00Z

## Task Summary
- **What to build**:
  - `supabase/migrations/003_complete_campusos_schema.sql`: Full DDL for profiles, tasks, courses, course_syllabus, workspaces, workspace_members, workspace_kanban_tasks, workspace_documents, workspace_activities, clubs, club_members, club_events, club_finances, club_tasks, dorm_spaces, dorm_members, dorm_chores, dorm_expenses, student_notifications, plus RLS policies, security definer functions, triggers, and storage buckets.
  - `web/src/types/database.ts`: TypeScript database schema definition matching Supabase JavaScript client generic `Database` contract with Row, Insert, Update types and helper aliases.
- **Success criteria**:
  - Valid PostgreSQL DDL adhering to all Supabase best practices.
  - `web/src/types/database.ts` compiles cleanly with TypeScript without any errors.
  - `npm run typecheck` passes with 0 errors.
  - `npm test` passes all 339 tests.
  - `npm run build` succeeds cleanly.
- **Interface contracts**: PROJECT.md, explorer_14_1/analysis.md
- **Code layout**: `supabase/migrations/003_complete_campusos_schema.sql`, `web/src/types/database.ts`

## Key Decisions Made
- Implemented full schema covering all 19 entities with explicit UUID primary keys (`gen_random_uuid()`), foreign key constraints with cascade/set null rules, and check constraints for domain integrity.
- Used `SECURITY DEFINER` functions with `SET search_path = ''` to prevent RLS recursion on membership tables (`workspace_members`, `club_members`, `dorm_members`).
- Cached `(SELECT auth.uid())` across all RLS policies for InitPlan performance optimization.
- Defined storage buckets `academic-materials`, `task-attachments`, and `student-avatars` with public/private access policies.
- Generated comprehensive `Database` interface in `web/src/types/database.ts` with typed `Row`, `Insert`, `Update`, relationships, and entity row/insert/update aliases for seamless client usage.

## Artifact Index
- `supabase/migrations/003_complete_campusos_schema.sql` — PostgreSQL DDL & RLS Migration
- `web/src/types/database.ts` — TypeScript Supabase Database Definitions

## Change Tracker
- **Files created**:
  - `supabase/migrations/003_complete_campusos_schema.sql`: Complete DDL, functions, triggers, indexes, RLS policies, and storage buckets.
  - `web/src/types/database.ts`: TypeScript database definitions and entity aliases.
- **Build status**: `npm run typecheck` 0 errors, `npm test` 339/339 tests passed, `npm run build` 34/34 routes passed.
- **Pending issues**: none

## Quality Status
- **Build/test result**: Pass (339 tests passed, 0 failures, 0 TS errors, clean Next.js 14 build)
- **Lint status**: clean
- **Tests added/modified**: schema & types foundation for M2-M5

## Loaded Skills
- **Source**: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agent\skills\supabase-postgres-best-practices\SKILL.md
- **Local copy**: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_14_m1\skills\supabase-postgres-best-practices.md
- **Core methodology**: Postgres performance optimization, explicit FK indexes, InitPlan auth.uid() caching, recursion prevention in RLS via Security Definer.
