## 2026-10-13T01:50:24Z
You are explorer_m2_1, working in metadata directory d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_1.
Your parent orchestrator is orchestrator_7 (conversation ID: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3).

MANDATORY FIRST STEP:
Read the authoritative user request at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md.
Also read the project architecture at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_7\PROJECT.md.
Read docs/CampusOS_Dashboard_Redesign_Plan.md.

YOUR TASK (Milestone M2 - Dashboard S1, S2, S3 Specifications & Strategy):
Design drop-in ready implementation blueprints for:
1. `src/components/dashboard/dashboard-hero.tsx` (S1 Hero "Vũ trụ học tập"):
   - Stagger character/word reveal heading (`CHÀO BUỔI SÁNG, MINH.`) with animated gradient/glitch highlight.
   - Dynamic live date subtitle.
   - Pointer-reactive 1-draw-call Aurora/3D canvas blob (reactive to pointer, streak, urgency).
   - Rotated `🔥 12` streak sticker (±1.5°) with particle burst on click + Streak Freeze shield indicator.
   - Mood Check-in (`😴 😐 😎 🔥`) updating `dailyMood` in `useCampusStore()`.
   - Voice Brain-Dump mic button with Web Speech API and dialog prompt fallback.
   - Magnetic CTAs (`+ Thêm nhiệm vụ`, `▶ Bắt đầu phiên học`).
2. `src/components/dashboard/today-timeline.tsx` (S2 "Hôm nay" Timeline):
   - Horizontal scrollable/draggable class timeline.
   - Real-time "now" clock line indicator.
   - Live pulsing neon border and progress bar on active class.
   - Countdown on upcoming classes, dimmed past classes.
   - 3D tilt hover cards with quick actions (`Vào lớp`, `Mở tài liệu`, `Ghi chú nhanh`).
3. `src/components/dashboard/deadline-arena.tsx` (S3 Deadline Arena):
   - Asymmetric Bento grid layout.
   - Hero bento cell for most urgent deadline with giant live `HH:MM:SS` countdown.
   - Dynamic color shifting (`lime → orange → red`).
   - Panic shake mode when < 3h remaining.
   - Reordering/drag affordance.
   - Completion circle with SVG path draw checkmark (`✓`), confetti explosion, and floating `+XP` badge updating shared store.

Do NOT modify source code. Produce structured blueprints.

OUTPUT:
Write your full report to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_1\handoff.md.
Send a brief completion message to orchestrator_7 with your report summary and path.
