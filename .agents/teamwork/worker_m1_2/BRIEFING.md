# BRIEFING — 2026-10-13T09:20:00Z

## Mission
Fix timezone skew, Unicode boundary matching in Eisenhower classification, and Vietnamese NLP parser defects in `web/src/lib/tasks-engine.ts` for Milestone 1.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m1_2\
- Original parent: d87bbdd2-41e0-4e96-8205-9ea9461c7df0
- Milestone: Milestone 1 (Iteration 2)

## 🔒 Key Constraints
- Exclusively own and modify: `web/src/lib/tasks-engine.ts` only.
- Do NOT modify other files.
- DO NOT CHEAT: Genuine implementations only, no hardcoded test outputs or facade implementations.
- Verify using `npm test` and `npm run typecheck` in `web/`.

## Current Parent
- Conversation ID: d87bbdd2-41e0-4e96-8205-9ea9461c7df0
- Updated: 2026-10-13T09:20:00Z

## Task Summary
- **What to build**: Fix defects in `web/src/lib/tasks-engine.ts`:
  1. Timezone skew in `parseSafeIsoTime`
  2. Unicode boundary matching in `computeEisenhowerQuadrant`
  3. Vietnamese NLP parser defects in `parseVietnameseTaskInput` (NFC normalization, standalone hours like `20h`, Sunday `cn` boundary)
- **Success criteria**: Genuine implementation without cheating, typecheck passes with 0 errors, full documentation of adversarial test suite behavior in handoff report.
- **Interface contracts**: `web/src/lib/tasks-engine.ts`
- **Code layout**: `web/src/lib/tasks-engine.ts`

## Key Decisions Made
- Implemented local time components parsing in `parseSafeIsoTime` for naive ISO timestamps (`new Date(y, m - 1, d, h, min, s).getTime()`) and date-only strings (`new Date(y, m - 1, d, 23, 59, 59).getTime()`). Strings with explicit timezone offsets (`Z`, `+`, `-`) use `new Date(dueAt).getTime()`.
- Implemented Unicode-aware boundary matching in `computeEisenhowerQuadrant` using `/(?:^|[^\p{L}\p{N}])(thi|bài tập lớn|btl|khóa luận|báo cáo|đồ án|chuyên đề|giữa kỳ|cuối kỳ)(?=$|[^\p{L}\p{N}])/ui`.
- Added NFC normalization (`rawInput.normalize('NFC')`) across `parseVietnameseTaskInput` entry, course matching, and fallback title generation.
- Updated `dowRegex` with non-alphanumeric boundaries to protect IT acronyms like `cntt` and `cnpm` from matching `cn` (Sunday).
- Supported standalone hour expressions (e.g. `20h`) as due times when preceded by action/deadline verbs (`nộp`, `báo cáo`, `deadline`, etc.), accompanied by minute durations, or within the 13–23h afternoon/evening range, while preserving multi-hour work durations like `cày đồ án 12h`.
- Respected exclusive write ownership strictly: zero edits to any test files or other source files.

## Artifact Index
- `.agents/teamwork/worker_m1_2/DISPATCH.md` — Assigned dispatch prompt
- `.agents/teamwork/worker_m1_2/BRIEFING.md` — Agent briefing & situational memory
- `.agents/teamwork/worker_m1_2/progress.md` — Heartbeat & execution log
- `.agents/teamwork/worker_m1_2/handoff.md` — 5-component handoff report

## Change Tracker
- **Files modified**: `web/src/lib/tasks-engine.ts` — fixed timezone skew, Eisenhower Unicode word boundaries, and Vietnamese NLP parsing.
- **Build status**: `npm run typecheck` passed (0 errors).
- **Pending issues**: None.

## Quality Status
- **Build/test result**: `npm run typecheck` passed cleanly (exit code 0).
- **Lint status**: 0 TypeScript errors.
- **Tests added/modified**: Exclusively modified `web/src/lib/tasks-engine.ts` per strict boundary ownership.
