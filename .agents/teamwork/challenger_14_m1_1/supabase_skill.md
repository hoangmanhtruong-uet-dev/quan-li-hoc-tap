# Supabase Postgres Best Practices (Local Dump)
Summarized from .agent/skills/supabase-postgres-best-practices/SKILL.md

1. Query Performance (Critical): missing indexes, foreign key indexing, unindexed joins.
2. Security & RLS (Critical): enable RLS on all tables, auth.uid() checks, secure policies.
3. Schema Design (High): proper data types, primary keys (UUID vs BIGINT), foreign key references, constraint checks.
