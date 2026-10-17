# BRIEFING — 2026-10-17T01:05:00Z

## Mission
Survey the CampusOS frontend and state architecture to identify all integration points for the Chrome Extension "AI Giám Sát Học Tập Cực Đoan".

## 🔒 My Identity
- Archetype: explorer
- Roles: read-only investigation, architectural survey, synthesis & handoff report
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_1
- Original parent: 051c51ec-d4c0-431c-b685-75179c16a0da
- Milestone: Chrome Extension Integration Survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify source code files
- Write only to own directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_1
- Produce structured 5-component handoff report

## Current Parent
- Conversation ID: 051c51ec-d4c0-431c-b685-75179c16a0da
- Updated: 2026-10-17T01:05:00Z

## Investigation State
- **Explored paths**:
  - `web/src/features/pomodoro/` (`strict-pomodoro-modal.tsx`, `use-tab-detection.ts`, `supervisor-arbiter.ts`, `audio-engine.ts`, `characters-data.ts`, `meme-cat-stage.tsx`, `pomodoro-settings-store.ts`, `pomodoro-supervisor-settings.tsx`)
  - `web/src/lib/campus-store.ts`, `web/src/lib/supabase-sync.ts`, `web/src/lib/supabase.ts`
  - `web/src/app/api/tts/route.ts`
  - `supabase/migrations/` (`001_pomodoro_schema.sql`, `002_dashboard_calendar_sync.sql`, `003_complete_campusos_schema.sql`)
  - `extension/` (`manifest.json`, `content.js`, `assets/fat-orange-cat.png`)
- **Key findings**:
  1. `StrictPomodoroModal` manages sessions, character quotes, and audio triggers, but only monitors tab switching in-page via `useTabDetection`.
  2. `campus-store.ts` handles XP, levels, streak, and syncs via `logFocusSessionToSupabase`, but lacks a `penalizeViolation` action to deduct XP upon distraction.
  3. No existing extension bridge exists in `web/src`. A two-way bridge using `window.postMessage` + `externally_connectable` is optimal.
  4. Audio engine has production-grade Edge Neural TTS (`/api/tts`) and Web Audio lip-sync analyser, with Web Speech API fallback.
  5. Zero camera code currently in codebase; however `characters-data.ts` and `supervisor-arbiter.ts` already define `face_away` and `sleep` quotes and violation types.
- **Unexplored areas**: None for the survey phase.

## Key Decisions Made
- Structure handoff report using strict 5-component format with exact code quotations and actionable architecture blueprints.

## Artifact Index
- DISPATCH.md — dispatch record
- BRIEFING.md — persistent working memory
- progress.md — liveness heartbeat
- handoff.md — comprehensive survey report
