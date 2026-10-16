# Plan — CampusOS Dashboard & Calendar Redesign

## Objective
Rebuild `/dashboard` and `/calendar` in Neo-Brutal Aurora Gen Z style with 120FPS performance, unified persistent store, Fat Orange Cat Pomodoro integration, and 100% test pass rate.

## Phases
1. **Phase 0: Survey & Scope Ingestion**
   - Explorer 1 (Spec Miner): Extract exact requirements from `docs/CampusOS_Dashboard_Redesign_Plan.md` and `docs/CampusOS_Calendar_Redesign_Plan.md`.
   - Explorer 2 (Codebase & Shell Inspector): Investigate existing app shell, layout, theme setup, font configurations, package.json dependencies, and existing tests in `web/`.
   - Explorer 3 (Pomodoro & Interactive Assets Inspector): Inspect `StrictPomodoroModal`, `meme-cat-stage.tsx`, Web Audio, TTS, and focus state mechanisms.
2. **Phase 1: Feature Inventory & Interface Contracts**
   - Synthesize survey findings into `PROJECT.md` Feature Inventory & Code Layout.
   - Define shared store interface, theme contracts, and API/data model interfaces.
3. **Phase 2: Milestone Execution**
   - **M1**: Neo-Brutal Aurora Visual Core & Shared Persistent Store + Global Shortcuts.
   - **M2**: Dashboard S1–S7 Complete Rebuild with all widgets and interactions.
   - **M3**: Calendar S1–S6 Complete Rebuild with real system date, engines (loadScore, conflicts, nlpParse, ics), views, and drawers.
   - **M4**: Focus Mode integration (Fat Orange Cat Supervisor + Chill 4-7-8 Breathing + Lo-fi) + shared minutes & XP sync.
4. **Phase 3: Dual-Track Testing & Adversarial Hardening**
   - Comprehensive test suite for all pure engines and utilities (`loadScore`, `conflicts`, `nlpParse`, `ics`, `xp/streak`).
   - Run typecheck, build, and tests via Worker.
   - Reviewer, Challenger, and Forensic Auditor verification loop.
5. **Phase 4: Synthesis & Sentinel Delivery**
