## 2026-10-17T04:36:32Z
You are explorer_survey_db.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_db
Authoritative user request file: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically the latest section 2026-10-17T04:34:11Z). Read this file first!

Survey existing Database, Supabase schema migrations, types, and XP mechanics:
1. Examine all files in supabase/migrations/ (e.g. 001, 002, 003, etc.). Note table naming, triggers, RLS policies, and realtime publications.
2. Check web/src/types/database.ts: How Database type is exported and how tables/enums are defined.
3. Check Supabase client setup in web/src/lib/ (e.g. supabase-client.ts, supabase-sync.ts, etc.) and how fallback/mocking works.
4. Check XP calculation and penalty mechanics in existing stores (campus-store.ts) or tables (profiles, student_focus_sessions).
5. Specify exact SQL required for 006_pomodoro_party.sql (study_rooms, study_room_members, room_reactions, RLS policies, realtime publication).

Document full findings and evidence in d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_db\handoff.md and notify with send_message when done.
