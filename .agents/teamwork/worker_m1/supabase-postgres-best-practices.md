# Supabase Postgres Best Practices (Local Copy)

Source: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agent\skills\supabase-postgres-best-practices\SKILL.md`

## Key Rules Applied:
1. **Schema Design**:
   - Always index foreign key columns (`schema-foreign-key-indexes.md`).
   - Use lowercase snake_case identifiers.
   - Primary keys: UUID default `gen_random_uuid()` or identity, timestamps with time zone `timestamptz default timezone('utc'::text, now())` or `now()`.
   - Constraints: explicit CHECK constraints on status, member roles, reaction types, etc.
2. **Security & RLS**:
   - Always enable RLS on every table created (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
   - Use `(select auth.uid())` instead of `auth.uid()` in RLS policies for caching and index scan performance (`security-rls-performance.md`).
   - Create indexes on columns used in RLS policies (e.g. `user_id`, `created_by`, `room_id`).
3. **Query Performance**:
   - Create indexes for composite queries (e.g. `(room_id, is_active)` or `(room_id, created_at desc)`).
   - Realtime publication: `ALTER PUBLICATION supabase_realtime ADD TABLE ...` where realtime updates are needed.
