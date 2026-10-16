# Supabase Postgres Best Practices Local Skill Copy

Reference from `.agent/skills/supabase-postgres-best-practices/SKILL.md`

## Key Rules Relevant to Database Schema & Remediation:
1. schema-foreign-key-indexes: Every foreign key column must have an explicit B-tree index to avoid slow joins and table locking during cascading deletes/updates.
2. security-rls-performance: Avoid redundant subqueries, ensure functions used in RLS are marked STABLE or SECURITY DEFINER appropriately, and avoid permissive `FOR ALL` policies when distinct roles have distinct privileges.
3. RLS Privilege Escalation: Policies must explicitly separate `INSERT` and `UPDATE` checks to ensure users cannot self-escalate roles or forge records.
4. Storage Objects RLS: Storage policies must cover SELECT, INSERT, UPDATE, and DELETE operations to ensure full CRUD lifecycle without unexpected permission denied errors.
