# BRIEFING — 2026-10-13T12:58:00Z

## Mission
Survey Vietnamese NLP parsing logic, date/time/subject extraction, priority tiers, and test infrastructure in web/src/lib/ and web/tests/.

## 🔒 My Identity
- Archetype: explorer
- Roles: read-only investigation, survey NLP parsing & tests
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_quicktask_2
- Original parent: 164cb181-dfe2-4bd4-a53c-f6b55f1d3bee
- Milestone: Quick Task Redesign Survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Focus on Vietnamese NLP parsing, date/time/subject extraction, priority tiers, and test infrastructure in web/src/lib/ and web/tests/
- Produce structured 5-component handoff.md in working directory
- Communicate completion to parent via send_message

## Current Parent
- Conversation ID: 164cb181-dfe2-4bd4-a53c-f6b55f1d3bee
- Updated: 2026-10-13T12:58:00Z

## Investigation State
- **Explored paths**:
  - `web/src/lib/tasks-engine.ts`: `parseVietnameseTaskInput`, `computeEisenhowerQuadrant`, `getUrgencyLevel`
  - `web/src/lib/nlp-calendar.ts`: `parseVietnameseEventInput`
  - `web/src/types/tasks.ts`: `TaskPriority`, `TaskItem`, `ParsedTaskResult`
  - `web/src/lib/campus-store.ts`: `addTask`, `completeTask`, `updateTask`, `deleteTask`, `DeadlineItem`
  - `web/src/components/tasks/create/quick-add-modal.tsx`: Existing QuickAdd modal
  - `web/src/components/dashboard/deadline-arena.tsx`: Deadline Arena data consumption
  - `web/src/app/(main)/dashboard/page.tsx`: Existing rudimentary inline quick task form
  - `web/tests/`: 8 test suites, 109 passing tests (`tasks-redesign.test.ts`, `challenger-m1-1-tasks-engine.test.ts`, etc.)
- **Key findings**:
  - Date extraction lacks "cuối tuần", "tuần sau", "thứ X tuần sau".
  - Time extraction lacks "11 giờ đêm" ("đêm" period and "giờ" without "h"), "cuối ngày" (23:59).
  - Course catalog lacks "Giải tích" and user-provided custom courses.
  - Priority system only supports 3 tiers ('high' | 'medium' | 'low'); needs 4 tiers ('low' | 'medium' | 'high' | 'urgent').
  - Store synchronization gap: `addTask` only writes to `state.tasks`, not `state.deadlines`; dashboard quick task only wrote to `state.deadlines`.
  - All 109 tests run via native Node runner in ~2.5s; new tests can be co-located in `web/tests/quick-task-nlp-sync.test.ts`.
- **Unexplored areas**: None within assigned survey scope.

## Key Decisions Made
- Recommending non-breaking extension of `TaskPriority` union type to `'low' | 'medium' | 'high' | 'urgent'`.
- Recommending `addQuickTask` helper in `campus-store.ts` that atomically updates both `tasks` and `deadlines` and awards +10 XP with undo capability.

## Artifact Index
- DISPATCH.md — Task assignment and instructions
- BRIEFING.md — Persistent working memory
- progress.md — Heartbeat and status tracking
- handoff.md — 5-component handoff report
