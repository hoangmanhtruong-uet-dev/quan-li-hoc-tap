# BRIEFING — 2026-10-17T04:24:00Z

## Mission
Hợp nhất toàn bộ Backend của CampusOS sang hệ sinh thái Supabase (PostgreSQL, Supabase Auth, Row Level Security, Realtime WebSockets, Supabase Storage) theo mô hình Offline-First with Optimistic Sync.

## 🔒 My Identity
- Archetype: orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_14
- Original parent: Sentinel / Parent Agent
- Original parent conversation ID: 645ca59b-c15e-4c76-9d4f-b67636ba16e3

## 🔒 My Workflow
- **Pattern**: Project Pattern (Survey -> Decompose & Delegate / Iteration Loop)
- **Scope document**: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
- **Iteration config**: 3 Explorers for survey, Worker -> Reviewer -> Challenger -> Auditor cycle
1. **Decompose**: Decompose backend migration into clear architectural milestones.
2. **Dispatch & Execute**:
   - Survey phase: Completed.
   - Milestone 1: Completed & Passed Gate (19 tables, RLS policies, RBAC functions, 3 buckets, database.ts).
   - Milestone 2: Completed & Passed Gate (multi-bucket storage engine, offline fallback, Node Buffer fallback, avatar integration).
   - Milestone 3: Completed & Passed Gate (CampusOS Sync Engine, 2-way tasks sync, offline queue campusos_sync_queue_v1, realtime WebSockets, 368 tests).
   - Milestone 4: Next for Gen 2 (Supabase Auth, Middleware, Profile Auto-Init & MySQL Deprecation).
   - Milestone 5: Next for Gen 2 (E2E Verification & Final Victory Handoff).
3. **On failure**:
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
4. **Succession**: At 16 spawns, write handoff.md, spawn successor.
- **Milestones**:
  1. Survey & Architecture Mapping [DONE]
  2. M1: Schema Migrations & Row Level Security [DONE]
  3. M2: Storage Buckets & Storage Engine Upgrade [DONE]
  4. M3: Offline-First Optimistic Sync Engine & Realtime WebSockets [DONE]
  5. M4: Supabase Auth, Middleware & MySQL Cleanup [PLANNED - FOR GEN 2]
  6. M5: E2E Verification & Test Suite Pass (368+ tests, 0 TS errors, 100% build) [PLANNED - FOR GEN 2]
- **Current phase**: Self-Succession (Gen 1 -> Gen 2)
- **Current focus**: Spawning orchestrator_14_gen2

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- NEVER investigate or explore the problem at the code level — dispatch Explorers for technical investigation.
- File-editing tools ONLY for metadata/state files (.md) in .agents/teamwork/.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh.
- Binary veto on Forensic Auditor integrity violations.

## Current Parent
- Conversation ID: 645ca59b-c15e-4c76-9d4f-b67636ba16e3
- Updated: 2026-10-17T04:24:00Z

## Key Decisions Made
- Milestone 1 PASSED Gate.
- Milestone 2 PASSED Gate.
- Milestone 3 PASSED Gate.
- 16 spawns reached, all 16 subagents completed.
- Written soft handoff `handoff.md` for `orchestrator_14_gen2`.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| explorer_14_1 | teamwork_preview_explorer | DB Schema & Migrations & Legacy MySQL | completed | 22e251f9-f1b5-4f05-81cb-04c530160b4d |
| explorer_14_2 | teamwork_preview_explorer | Storage Engine, Sync Engine & Realtime | completed | 01b19d9a-360b-4ecd-b726-fca4323ff959 |
| explorer_14_3 | teamwork_preview_explorer | Supabase Auth, Middleware & Testing Suite | completed | 3ed2edec-8bc3-475c-a721-ade1b76df978 |
| worker_14_m1 | teamwork_preview_worker | M1: 003_complete_campusos_schema.sql & database.ts | completed | 093bb06b-2ed0-4d8b-af08-6ec43e611a10 |
| reviewer_14_m1_1 | teamwork_preview_reviewer | M1: Primary Review | completed | 7ad90792-ee66-462e-a6b5-05180fc0bf37 |
| reviewer_14_m1_2 | teamwork_preview_reviewer | M1: Adversarial Review | completed | 5debd29b-9042-4fc5-bc81-2396db6ef802 |
| challenger_14_m1_1 | teamwork_preview_challenger | M1: SQL Verification | completed | 76561fdc-fce9-4767-bb6c-02d5ca852c44 |
| challenger_14_m1_2 | teamwork_preview_challenger | M1: Type Verification | completed | ea6cd7e4-819e-4633-bd60-d475ad009d7d |
| auditor_14_m1 | teamwork_preview_auditor | M1: Forensic Audit | completed | 3365a1e1-2a4e-4929-9567-af1462425a84 |
| worker_14_m1_fix | teamwork_preview_worker | M1: Remediation | completed | 45545514-3f4f-4a6c-b8f4-64d82e21f68d |
| reviewer_14_m1_verify | teamwork_preview_reviewer | M1: Remediation Verification | completed | 5c96ea33-2b2f-48e3-8acd-6be015a9e7ac |
| worker_14_m2 | teamwork_preview_worker | M2: Storage Engine Upgrade | completed | 8d34eff7-48bb-40a0-a198-b8a89995ff44 |
| reviewer_14_m2 | teamwork_preview_reviewer | M2: Review | completed | 75db1b38-a290-4038-a6bf-d348f1e8b7b7 |
| auditor_14_m2 | teamwork_preview_auditor | M2: Forensic Audit | completed | 4d5bb0d5-40e4-4e1d-9682-867f71cfe78e |
| worker_14_m3 | teamwork_preview_worker | M3: Sync Engine & Realtime | completed | 99a1f2a4-4eb2-4fbe-bb0f-b7574889deb4 |
| reviewer_14_m3 | teamwork_preview_reviewer | M3: Review & Audit | completed | ae5432bf-7973-442d-abef-d1047d1a931d |

## Succession Status
- Succession required: yes (executing now)
- Spawn count: 16 / 16
- Pending subagents: none
- Predecessor: none
- Successor: spawning now

## Active Timers
- Heartbeat cron: 530cc211-532a-4177-8502-4fb34c026648/task-10 (will kill prior to spawn)
- Safety timer: none

## Artifact Index
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md — Global project plan
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md — Authoritative User Request
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_14\DISPATCH.md — Dispatch log
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_14\BRIEFING.md — Persistent context & state
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_14\progress.md — Liveness & iteration progress
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_14\GATE_STATUS.md — Gate tracking
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_14\handoff.md — Soft Handoff for Gen 2
