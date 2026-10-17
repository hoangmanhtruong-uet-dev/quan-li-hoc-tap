# Supabase Postgres Best Practices (Local Copy)
See original: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agent\skills\supabase-postgres-best-practices\SKILL.md

Key rules applied for Audit:
1. Schema & Indexes: Foreign key columns must have dedicated indexes (e.g., host_id, workspace_id, room_id, user_id).
2. RLS Security: Must wrap `(SELECT auth.uid())` to enable Postgres initPlan caching and prevent per-row auth evaluation overhead.
3. Functions: Security definer functions must set `search_path = ''` to prevent search path hijacking.
4. Realtime: Must set `REPLICA IDENTITY FULL` on tables added to publication.
