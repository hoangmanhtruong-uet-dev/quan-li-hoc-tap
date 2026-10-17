## 2026-10-17T05:13:32Z
You are worker_m3.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m3
Project Root: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap
Authoritative user request file: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically 2026-10-17T04:34:11Z). Read this file first!
Project Plan: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
Testing Explorer Findings: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_realtime_3d\handoff.md
UI Explorer Findings: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_ui\handoff.md
Service Layer: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\src\lib\study-rooms-service.ts

Write Ownership:
- web/src/app/api/study/rooms/time/route.ts
- web/src/hooks/use-study-room-realtime.ts
- web/src/components/study/floating-reactions.tsx
- web/src/components/study/deserter-shame-banner.tsx
- web/src/components/study/break-room-chat.tsx
- web/src/app/(main)/study/rooms/[code]/page.tsx

Tasks:
1. Build `route.ts` for `/api/study/rooms/time` returning server timestamp.
2. Build `use-study-room-realtime.ts` with SNTP 3-sample ping (<200ms offset), Supabase Realtime Broadcast & Presence, and Deserter detection (visibilityChange).
3. Build `floating-reactions.tsx` (🔥, 👏, ❤️, 💪, ⚡) with GPU-accelerated CSS animations and auto-cleanup.
4. Build `deserter-shame-banner.tsx` (callout banner with -50 XP penalty announcement and danger flash red border).
5. Build `break-room-chat.tsx` with break mode chat and lo-fi audio player.
6. Connect all into `/study/rooms/[code]/page.tsx`.
7. Verify with `npm run typecheck`, `npm test`, and `npm run build`.
8. Document in `handoff.md` and notify with `send_message`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. Integrity violations WILL be detected and rejected.
