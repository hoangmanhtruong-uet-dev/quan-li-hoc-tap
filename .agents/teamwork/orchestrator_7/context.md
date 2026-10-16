# Orchestrator Dispatch Context

## Objective
Rebuild Tổng quan (`/dashboard`) and Lịch & kế hoạch (`/calendar`) pages of CampusOS Next.js web application in the **Neo-Brutal Aurora** Gen Z design direction specified in `docs/CampusOS_Dashboard_Redesign_Plan.md` and `docs/CampusOS_Calendar_Redesign_Plan.md`. Deliver a cohesive, high-energy Vietnamese student companion experience that runs at 60–120FPS with zero GPU lag and integrates directly with the existing **Fat Orange Cat Supervisor (`StrictPomodoroModal`)**.

## Locations & Specs
- App working directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`
- Metadata directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_7`
- Original Request: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md`
- Dashboard Redesign Spec: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\docs\CampusOS_Dashboard_Redesign_Plan.md`
- Calendar Redesign Spec: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\docs\CampusOS_Calendar_Redesign_Plan.md`

## Key Requirements Summary
1. R1: Neo-Brutal Aurora Visual System, Zero-Lag 120FPS Rendering (lightweight 1-draw-call canvas shaders, GPU transforms, reduced motion toggle), Unified Shared Store (`localStorage`-backed XP, Level, Streak, Mood, Vibe Theme, study minutes, tasks, Kanban, calendar events), and Global Shortcuts (`Cmd+K`, `?`, `N`, `F`, Easter Eggs).
2. R2: Rebuild `/dashboard` (All 7 Sections S1-S7 + P0/P1/P2 features per specification).
3. R3: Rebuild `/calendar` (Month Poster Header, Smart Filters, Month Grid with load heat-bar and full tooltips + popover, Week/Day Time-Grid 06:00-23:00 with conflict detection & free-slot finder, Agenda & Semester Timeline views, AI Auto-Scheduler "Xếp lịch giúp tao", NLP Quick-Create, `.ics` import/export, and Slide-Over Day Drawer).
4. R4: Focus Mode integration with Fat Orange Cat Supervisor (`StrictPomodoroModal`), with in-modal mode switcher between Fat Orange Cat Supervisor and Chill Breathing 4-7-8 + Lo-fi mode. Sync completed minutes and XP to shared store.
5. Verification:
   - `npm run typecheck` in `web/` passes with 0 errors.
   - `npm run build` in `web/` succeeds with 0 errors.
   - `npm test` passes all existing tests plus new unit tests covering:
     - loadScore
     - conflicts
     - nlpParse
     - ics
     - shared XP/Level/Streak calculation
