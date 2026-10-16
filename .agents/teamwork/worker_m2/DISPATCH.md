## 2026-10-13T01:58:49Z
You are worker_m2, working in metadata directory d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m2.
Your parent orchestrator is orchestrator_7 (conversation ID: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3).

MANDATORY FIRST STEP:
Read the authoritative user request at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md.
Also read the project architecture at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_7\PROJECT.md.

Read the detailed implementation blueprints authored by the M2 Explorers:
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_1\handoff.md (S1 Hero, S2 Today Timeline, S3 Deadline Arena)
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_2\handoff.md (S4 AI Mascot Coach, S5 Game HUD Stats)
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_3\handoff.md (S6 Squad Kanban & Exam, S7 Marquee & Daily Wrapped, Dashboard Page Assembly)
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_3\proposed_squad-kanban-exam.tsx
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_3\proposed_marquee-daily-wrapped.tsx
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_3\proposed_dashboard_page.tsx

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP (You own ONLY these files in web/):
- web/src/components/dashboard/dashboard-hero.tsx
- web/src/components/dashboard/today-timeline.tsx
- web/src/components/dashboard/deadline-arena.tsx
- web/src/components/dashboard/ai-mascot-coach.tsx
- web/src/components/dashboard/game-hud-stats.tsx
- web/src/components/dashboard/squad-kanban-exam.tsx
- web/src/components/dashboard/marquee-daily-wrapped.tsx
- web/src/app/(main)/dashboard/page.tsx

YOUR TASK:
1. Implement the 7 modular dashboard components in `web/src/components/dashboard/`:
   - `dashboard-hero.tsx` (S1): Stagger reveal heading ("CHÀO BUỔI SÁNG, MINH."), pointer-reactive 1-draw-call Canvas2D Aurora blob, rotated `🔥 12` streak sticker with particle burst, Streak Freeze indicator, Mood Check-in (`😴 😐 😎 🔥`), Voice Brain-Dump mic, magnetic CTAs.
   - `today-timeline.tsx` (S2): Horizontal scrollable/draggable class timeline, real-time "now" clock line indicator, live pulsing neon border and progress bar on active class, countdown on upcoming classes, 3D tilt hover cards with quick actions (`Vào lớp`, `Mở tài liệu`, `Ghi chú nhanh`).
   - `deadline-arena.tsx` (S3): Asymmetric Bento layout, hero bento cell with giant live `HH:MM:SS` countdown, color shift (`lime → orange → red`), panic shake (< 3h), completion circle with SVG path draw checkmark (`✓`), confetti, floating `+XP`.
   - `ai-mascot-coach.tsx` (S4): Animated mascot with cursor-tracking eyes, blinking, mood expressions, typewriter chat study proposal, quick adjustment chips, `Chấp nhận kế hoạch` (commits study block to today timeline and calendar events in `useCampusStore()`) and `Bỏ qua`.
   - `game-hud-stats.tsx` (S5): Weekly study goal ring (`8.5 / 12 giờ`, count-up animation, liquid fill / gradient ring), XP bar + Level badge from `gamification.ts` (Level 7 "Sinh viên cày thuê"), 12-week GitHub study streak heatmap with tooltips, "Môn cần chú ý" warning sticker with animated SVG grade sparkline.
   - `squad-kanban-exam.tsx` (S6): 3-column mini Kanban (`Đang làm`, `Chờ review`, `Xong`) with task movement, stacked member avatars, Squad Leaderboard, `Nhắc bạn (Poke)` toast, Concert-Ticket Exam card with live countdown, prep progress, and `Tạo đề cương AI` modal.
   - `marquee-daily-wrapped.tsx` (S7): Dual-direction infinite Gen Z quote marquee, `Chốt ngày hôm nay` button, Spotify-Wrapped-style Daily Wrapped 5-slide story modal.
2. Rebuild `web/src/app/(main)/dashboard/page.tsx`:
   - Assemble all 7 sections seamlessly using `useCampusStore()`.
   - Wire Focus Mode launch triggers to open `StrictPomodoroModal`.
   - Wire shortcuts (`N`, `Cmd+K`, `?`, `F`).
3. Run verification commands in `web/`:
   - `npm test`
   - `npm run typecheck`
   - `npm run build`
   Ensure ALL 3 commands exit code 0 with 0 errors.
