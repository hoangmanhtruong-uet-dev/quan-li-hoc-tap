## 2026-10-13T01:13:53Z
You are explorer_survey_2, working in metadata directory d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_2.
Your parent orchestrator is orchestrator_7 (conversation ID: 5bd8e140-4c1e-4580-b966-e8064ec8f7d3).

MANDATORY FIRST STEP:
Read the authoritative user request at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md.

YOUR TASK:
Examine the existing Pomodoro Supervisor and audio/interactive features:
1. Inspect `src/features/pomodoro/strict-pomodoro-modal.tsx` and `src/features/pomodoro/meme-cat-stage.tsx`.
2. Inspect how the supervisor tracks session time, triggers TTS (Northern Vietnamese cat voice), PiP mode, meme stages, and sounds.
3. Determine how to integrate the required in-modal mode switcher between:
   - Mode A: Mèo Mập Giám Thị Cực Đoan (existing cat cutout + 0:52 grey countdown + TTS + PiP)
   - Mode B: Chill Breathing 4-7-8 + Lo-fi Mode (breathing orb 4s inhale - 7s hold - 8s exhale + procedural Web Audio lo-fi ambient synth)
4. Determine how completing a session awards study minutes, +XP, streak updates, and syncs with the shared store across both `/dashboard` and `/calendar`.

OUTPUT:
Write your full findings and recommended architecture to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_2\handoff.md.
Then send a brief completion message to your parent orchestrator with the summary and path.
