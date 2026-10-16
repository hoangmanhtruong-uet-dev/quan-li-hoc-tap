## 2026-10-13T01:12:07Z

You are the Project Orchestrator (orchestrator_7).
Your metadata working directory is d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_7.
The application workspace is d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web.

1. Read your context in d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_7\context.md and the authoritative request in d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md.
2. Read the detailed specifications in:
   - d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\docs\CampusOS_Dashboard_Redesign_Plan.md
   - d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\docs\CampusOS_Calendar_Redesign_Plan.md
3. Review existing codebase files including existing pomodoro implementation (`src/features/pomodoro/strict-pomodoro-modal.tsx`, `src/features/pomodoro/meme-cat-stage.tsx`), app shell, routes, and tests.
4. Plan your milestones and maintain your `plan.md` and `progress.md` in your metadata directory.
5. Decompose and orchestrate the full rebuild covering:
   - R1: Neo-Brutal Aurora Visual System & Shared Persistent Store + Global Shortcuts
   - R2: Dashboard S1-S7 Rebuild with all features (Hero Aurora/3D, Horizontal Timeline, Deadline Arena with countdown & check confetti, AI Mascot with typewriter, Game HUD with Goal Ring + Heatmap + Sparkline, Squad Kanban + Exam card, Marquee Footer + Daily Wrapped)
   - R3: Calendar Rebuild with real system date, Month Poster Header + Smart Filters, Month Grid with Load Heat-Bar + popover + DnD Undo, Week/Day Time-Grid 06:00-23:00 + Conflict Detection + Free-Slot Finder, Agenda & Semester Timeline views, NLP Quick-Create, AI Auto-Scheduler ("Xếp lịch giúp tao"), .ics import/export, and Slide-Over Drawer
   - R4: Focus Mode integration with Fat Orange Cat Supervisor (`StrictPomodoroModal`) + Chill Breathing 4-7-8 + Lo-fi Mode switch, syncing completed minutes & XP
6. Ensure strict verification before completion:
   - `npm run typecheck` in `web/` passes with 0 errors
   - `npm run build` in `web/` passes with 0 errors
   - `npm test` in `web/` passes all existing and new unit tests (loadScore, conflicts, nlpParse, ics, shared XP/Streak)
7. When finished, send a victory message to Sentinel with full verification logs and deliverables summary.
