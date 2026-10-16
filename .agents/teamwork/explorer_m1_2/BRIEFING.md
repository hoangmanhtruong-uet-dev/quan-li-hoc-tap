# BRIEFING — 2026-10-13T13:08:00Z

## Mission
Analyze 4 priority tiers (`low`, `medium`, `high`, `urgent`), course catalog matching ("Giải tích"), and title cleaning in `web/src/types/tasks.ts` and `web/src/lib/tasks-engine.ts`, producing an exact implementation blueprint for Milestone M1.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_2
- Original parent: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3 (orchestrator_7)
- Milestone: M1 (Unified Persistent Store Strategy)
- Current Dispatch Parent: 164cb181-dfe2-4bd4-a53c-f6b55f1d3bee (orchestrator_10)
- Current Milestone: M1 (Quick Task Priority Tiers, Courses Catalog & Title Cleaning)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement in source code files.
- Recommend concrete implementation blueprints.
- Do NOT run unauthorized commands if denied.
- Deliver self-contained 5-component handoff report.

## Current Parent
- Conversation ID: 164cb181-dfe2-4bd4-a53c-f6b55f1d3bee
- Updated: 2026-10-13T13:01:33Z

## Investigation State
- **Explored paths**:
  - `web/src/types/tasks.ts` (TaskPriority definition, TaskItem, ParsedTaskResult)
  - `web/src/lib/tasks-engine.ts` (computeEisenhowerQuadrant, KNOWN_COURSES, parseVietnameseTaskInput)
  - `web/src/app/(main)/tasks/page.tsx` (pMap priority sorting, priorityFilter)
  - `web/src/components/tasks/controls/controls-bar.tsx` (TaskPriorityFilter, live count computation)
  - `web/src/components/tasks/drawer/task-detail-drawer.tsx` (Priority radio buttons, COURSES_LIST)
  - `web/src/components/tasks/drawer/unselected-hero.tsx` (pMap sorting for most urgent task)
  - `web/src/components/tasks/create/quick-add-modal.tsx` (Quick courses, quick priorities, chips)
  - `web/src/lib/campus-store.ts` (DeadlineItem schema, addQuickTask integration)
  - `web/tests/tasks-redesign.test.ts` & `web/tests/challenger-m1-1-tasks-engine.test.ts` (Current test coverage & assertions)
- **Key findings**:
  - `TaskPriority` expansion to `'low' | 'medium' | 'high' | 'urgent'` requires strict precedence handling in NLP regex to prevent "gấp" from greedily consuming "siêu gấp", "cực gấp", or "không gấp".
  - Precedence order: `urgent` ("siêu gấp", "cực gấp", "hỏa tốc", "khẩn cấp", "p0") -> `low` ("không gấp", "chưa gấp", "p3") -> `high` ("gấp", "ưu tiên cao", "urgent", "p1", "quan trọng") -> `medium` ("ưu tiên vừa", "bình thường", "trung bình", "p2").
  - "Giải tích" regex in `KNOWN_COURSES`: `/(?:toán\s+)?giải\s+tích(?:\s*[123]|I{1,3})?/i` resolves to `name: 'Giải tích'` without conflicting with CTDL "giải thuật".
  - In `computeEisenhowerQuadrant`, `urgent` priority must be treated as both intrinsically urgent and important, classifying it into Q1 (`do_first`), while `high` priority continues to rely on 48h proximity (Q1 if <=48h, Q2 if >48h).
  - Title cleaning fallback cleanly defaults to `Bài tập ${detectedCourse}` if a course was matched, or `Nhiệm vụ mới` if input was empty/punctuation/metadata-only.
- **Unexplored areas**:
  - None within explorer M1.2 scope.

## Key Decisions Made
- Priority extraction adopts strict 4-pass sequential evaluation (`urgent` -> `low` -> `high` -> `medium`) with negative lookbehind on `gấp` (`(?<!không\s+|chưa\s+|siêu\s+|cực\s+)gấp`).
- Word boundaries for priority tokens use Unicode character classes `(?:^|[^\p{L}\p{N}])` and `(?=$|[^\p{L}\p{N}])` to prevent false positive matches on words like "mp3", "step0".
- `computeEisenhowerQuadrant` ensures `task.priority === 'urgent'` unconditionally routes to Q1 `do_first`.

## Artifact Index
- `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_2\handoff.md` — 5-component handoff report.
- `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m1_2\DISPATCH.md` — Preserved dispatch logs.
