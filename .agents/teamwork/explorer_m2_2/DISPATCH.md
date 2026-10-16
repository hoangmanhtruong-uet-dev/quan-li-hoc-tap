## 2026-10-13T01:50:24Z
You are explorer_m2_2, working in metadata directory d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_2.
Your parent orchestrator is orchestrator_7 (conversation ID: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3).

MANDATORY FIRST STEP:
Read the authoritative user request at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md.
Also read the project architecture at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_7\PROJECT.md.
Read docs/CampusOS_Dashboard_Redesign_Plan.md.

YOUR TASK (Milestone M2 - Dashboard S4, S5 Specifications & Strategy):
Design drop-in ready implementation blueprints for:
1. `src/components/dashboard/ai-mascot-coach.tsx` (S4 AI Coach "Squad" Mascot):
   - Animated mascot character with cursor-tracking eyes, blinking, and mood expressions matching `dailyMood`.
   - Typewriter chat study proposal (e.g. 45-min Subnetting review).
   - Quick adjustment chips (`Dời xuống tối`, `Ngắn hơn 25p`, `Ôn kiểu flashcard`).
   - Action buttons: `Chấp nhận kế hoạch` (inserts study block directly into Today's timeline and Calendar in `useCampusStore()`) and `Bỏ qua`.
2. `src/components/dashboard/game-hud-stats.tsx` (S5 Stats & Goal "Game HUD"):
   - Weekly study goal ring (`8.5 / 12 giờ`, count-up animation, liquid fill / gradient ring).
   - XP bar + Level progression + unlockable badges from `gamification.ts` (Level 7 "Sinh viên cày thuê").
   - 12-week GitHub-style study streak heatmap with exact hour tooltips on hover.
   - Neo-brutal warning sticker for "Môn cần chú ý" (e.g. `⚠ Xác suất đang tụt`) with animated SVG path grade sparkline.

Do NOT modify source code. Produce structured blueprints.

OUTPUT:
Write your full report to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_m2_2\handoff.md.
Send a brief completion message to orchestrator_7 with your report summary and path.
