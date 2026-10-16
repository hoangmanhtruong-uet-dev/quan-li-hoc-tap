# BRIEFING — 2026-10-13T08:18:50Z

## Mission
Investigate the Pomodoro Supervisor, audio, interactive features, mode switching (Mèo Mập vs Chill Breathing 4-7-8 + Lo-fi), XP/minutes/streak reward pipeline, and store synchronization across /dashboard and /calendar.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigator, synthesis
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_2
- Original parent: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3
- Milestone: milestone_1_architecture_investigation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Base findings strictly on codebase verification
- Must follow 5-component handoff report

## Current Parent
- Conversation ID: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3
- Updated: 2026-10-13T08:18:50Z

## Investigation State
- **Explored paths**:
  - `src/features/pomodoro/strict-pomodoro-modal.tsx`
  - `src/features/pomodoro/meme-cat-stage.tsx`
  - `src/features/pomodoro/audio-engine.ts`
  - `src/features/pomodoro/characters-data.ts`
  - `src/features/pomodoro/supervisor-arbiter.ts`
  - `src/features/pomodoro/use-tab-detection.ts`
  - `src/app/api/tts/route.ts`
  - `src/app/(main)/dashboard/page.tsx`
  - `src/app/(main)/calendar/page.tsx`
  - `src/app/(main)/study/page.tsx`
  - `tests/supervisor-arbiter.test.ts`
  - `tailwind.config.js`
- **Key findings**:
  - Pomodoro modal is currently implemented in `strict-pomodoro-modal.tsx` with `MemeCatStage` and `TalkingTom3D`.
  - Mode A is fully operational with cutout PNG `/images/fat-orange-cat.png`, Document PiP / video PiP, Web Audio alerts, and Northern Vietnamese TTS (`msedge-tts` with `vi-VN-NamMinhNeural` / `vi-VN-HoaiMyNeural`).
  - Mode B (Chill Breathing 4-7-8 + procedural Lo-fi synth) can be seamlessly integrated via a new stage component `chill-breathing-stage.tsx` and a Web Audio synth without any external audio asset dependencies.
  - The shared store across `/dashboard` and `/calendar` is currently fragmented in separate `localStorage` keys; a unified store (`campus-store.ts`) + pure gamification calculations (`gamification.ts`) will synchronize study minutes, +XP, streak, and goal ring upon session completion.
  - Tailwind config is missing `./src/features/**/*.{js,ts,jsx,tsx,mdx}` in its content array.
- **Unexplored areas**: None for survey scope.

## Key Decisions Made
- Architecture design: Mode switcher in `StrictPomodoroModal` header; shared countdown timer across modes; pure Web Audio synth for Lo-fi (0KB asset overhead); unified `gamification.ts` with test suite matching `node --test` runner.

## Artifact Index
- `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_2\handoff.md` — Comprehensive findings and proposed architecture report
