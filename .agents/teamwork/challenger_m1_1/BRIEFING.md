# BRIEFING — 2026-10-13T08:55:00Z

## Mission
Empirically stress-test the algorithmic engine in `web/src/lib/tasks-engine.ts` for Milestone 1 (Store, Types & Tasks Engine) of CampusOS /tasks page rebuild project.

## 🔒 My Identity
- Archetype: EMPIRICAL CHALLENGER
- Roles: critic, specialist
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\challenger_m1_1\
- Original parent: d87bbdd2-41e0-4e96-8205-9ea9461c7df0
- Milestone: Milestone 1 (Store, Types & Tasks Engine)
- Instance: 1 of 1

## 🔒 Key Constraints
- Review-only — do NOT modify implementation code (report findings, do NOT fix them directly)
- Do NOT trust claims or logs blindly; empirical proof required for all findings
- Verify with tests, fuzzing scripts, and test runner executions

## Current Parent
- Conversation ID: d87bbdd2-41e0-4e96-8205-9ea9461c7df0
- Updated: 2026-10-13T08:55:00Z

## Review Scope
- **Files to review**: `web/src/lib/tasks-engine.ts`, `web/src/types/tasks.ts`, `web/tests/tasks-redesign.test.ts`
- **Interface contracts**: `PROJECT.md`, `TEST_READY.md`, `ORIGINAL_REQUEST.md`
- **Review criteria**: Date grouping boundary conditions, Vietnamese NLP regex parser edge cases, Eisenhower classification robustness, test suite thoroughness

## Attack Surface
- **Hypotheses tested**:
  1. Timezone offset parsing in `parseSafeIsoTime` when evaluated against local time.
  2. ASCII `\b` boundary failure on non-ASCII Vietnamese letters in academic keyword regex for Eisenhower classification.
  3. Decomposed Unicode (NFD) normalization failure in NLP quickadd parsing.
  4. Missing word boundaries on day-of-week abbreviations (`cn`) matching inside words like `cntt` and `cnpm`.
  5. Standalone hour expressions (`20h`) misclassified as duration instead of due time.
  6. Leap year, month-end, and Sunday midnight week boundary transitions.
- **Vulnerabilities found**:
  1. **CRITICAL**: Forced `'Z'` in `parseSafeIsoTime` causes 7-hour timezone skew in UTC+7 (Vietnam), creating a 7-hour ghost extension, preventing red panic alerts, and causing direct contradiction between `getTaskDateGroup` (overdue) and `getUrgencyLevel` (active).
  2. **CRITICAL**: ASCII `\b` word boundary in `computeEisenhowerQuadrant` fails for Vietnamese keywords starting or ending with non-ASCII letters (`cuối kỳ`, `giữa kỳ`, `đồ án`, `chuyên đề`), incorrectly demoting urgent academic tasks to Q3 or Q4.
  3. **HIGH**: Lack of `rawInput.normalize('NFC')` causes complete failure to extract course, priority, and cleaned title on NFD Unicode strings.
  4. **MEDIUM**: Lack of word boundary on `"cn"` in `dowRegex` matches substrings of major abbreviations like `cntt` (Công nghệ thông tin) and `cnpm` (Công nghệ phần mềm), rescheduling tasks to Sunday and truncating titles.
  5. **MEDIUM**: Standalone hour patterns like `"nộp bài 20h"` misclassified as 1200 minutes study duration rather than 20:00 due time.
- **Untested angles**:
  1. Long-term browser localStorage quota limits under 10,000+ completed tasks.
  2. Live Supabase edge network latency during debounced remote sync.

## Loaded Skills
- Source: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agent\skills\verification-before-completion\SKILL.md
- Core methodology: Evidence before assertions always, run verification commands and confirm output

## Key Decisions Made
- Authored empirical challenge test suite in `web/tests/challenger-m1-1-tasks-engine.test.ts` with 14 stress tests covering all 4 objective areas.
- Confirmed baseline of 102 tests passing across `web/tests/`.
- Issued formal verdict of **REQUEST_CHANGES** due to two critical algorithmic bugs (Timezone countdown desynchronization and ASCII boundary Vietnamese keyword failure).

## Artifact Index
- `DISPATCH.md` — Inbound task dispatch
- `BRIEFING.md` — Persistent identity and situational awareness
- `progress.md` — Heartbeat and step tracking
- `handoff.md` — Final handoff report with verdict
- `web/tests/challenger-m1-1-tasks-engine.test.ts` — Empirical challenge test suite
