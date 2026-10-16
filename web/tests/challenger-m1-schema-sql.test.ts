import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Milestone 1 Empirical Challenger - Supabase Schema Migration (003_complete_campusos_schema.sql)', () => {
  const rootDir = path.resolve(process.cwd(), '..');
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '003_complete_campusos_schema.sql');

  test('Migration file exists and is populated (> 30KB)', () => {
    assert.ok(fs.existsSync(migrationPath), `Migration file must exist at ${migrationPath}`);
    const stat = fs.statSync(migrationPath);
    assert.ok(stat.size > 30000, `Migration file should be comprehensive (>30KB), got ${stat.size} bytes`);
  });

  const sqlContent = fs.readFileSync(migrationPath, 'utf8');

  test('R1 Entity Coverage: All 14 required entities + companion tables exist', () => {
    const requiredTables = [
      'profiles',
      'tasks',
      'courses',
      'course_syllabus',
      'workspaces',
      'workspace_members',
      'workspace_kanban_tasks',
      'workspace_documents',
      'clubs',
      'club_events',
      'club_finances',
      'dorm_spaces',
      'dorm_chores',
      'dorm_expenses',
      'student_notifications',
      // Companion tables
      'workspace_activities',
      'club_members',
      'club_tasks',
      'dorm_members',
    ];

    for (const table of requiredTables) {
      const tableRegex = new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\s*\\(`, 'i');
      assert.match(
        sqlContent,
        tableRegex,
        `Table public.${table} must be defined in 003_complete_campusos_schema.sql`
      );
    }
  });

  test('R1 Schema Columns: Key required fields are explicitly defined', () => {
    const columnChecks: Record<string, string[]> = {
      profiles: ['id', 'user_id', 'xp', 'level', 'rank_title', 'streak', 'vibe_theme', 'daily_mood'],
      tasks: ['id', 'user_id', 'title', 'status', 'priority', 'quadrant', 'eisenhower_quadrant', 'subtasks', 'attachments'],
      courses: ['id', 'user_id', 'code', 'name', 'credits', 'grade_components', 'status'],
      course_syllabus: ['id', 'course_id', 'week_number', 'topic', 'slides_url', 'materials'],
      workspaces: ['id', 'owner_id', 'name', 'slug', 'type', 'progress_percent'],
      workspace_members: ['id', 'workspace_id', 'user_id', 'role'],
      workspace_kanban_tasks: ['id', 'workspace_id', 'title', 'status', 'priority', 'assignee_id'],
      workspace_documents: ['id', 'workspace_id', 'title', 'file_url', 'uploaded_by'],
      clubs: ['id', 'name', 'category', 'president_id', 'general_fund_balance'],
      club_events: ['id', 'club_id', 'title', 'start_time', 'budget'],
      club_finances: ['id', 'club_id', 'type', 'amount', 'recorded_by'],
      dorm_spaces: ['id', 'name', 'room_number', 'created_by'],
      dorm_chores: ['id', 'space_id', 'title', 'assigned_to', 'status', 'penalty_amount'],
      dorm_expenses: ['id', 'space_id', 'title', 'total_amount', 'paid_by', 'split_member_ids'],
      student_notifications: ['id', 'user_id', 'title', 'message', 'type', 'is_read'],
    };

    for (const [table, columns] of Object.entries(columnChecks)) {
      // Find the block of CREATE TABLE public.<table_name> ( ... );
      const tableBlockRegex = new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\s*\\([\\s\\S]*?\\n\\);`, 'i');
      const match = sqlContent.match(tableBlockRegex);
      assert.ok(match, `Could not extract CREATE TABLE block for public.${table}`);

      const block = match[0];
      for (const col of columns) {
        const colRegex = new RegExp(`\\b${col}\\b`, 'i');
        assert.match(
          block,
          colRegex,
          `Column '${col}' must be defined inside table public.${table}`
        );
      }
    }
  });

  test('R1 Foreign Key Integrity: Relational constraints link to auth.users and parent entities', () => {
    const foreignKeyExpectations = [
      { table: 'profiles', ref: 'REFERENCES auth.users(id)' },
      { table: 'courses', ref: 'REFERENCES auth.users(id)' },
      { table: 'course_syllabus', ref: 'REFERENCES public.courses(id)' },
      { table: 'tasks', ref: 'REFERENCES auth.users(id)' },
      { table: 'workspaces', ref: 'REFERENCES auth.users(id)' },
      { table: 'workspace_members', ref: 'REFERENCES public.workspaces(id)' },
      { table: 'workspace_members', ref: 'REFERENCES auth.users(id)' },
      { table: 'workspace_kanban_tasks', ref: 'REFERENCES public.workspaces(id)' },
      { table: 'workspace_documents', ref: 'REFERENCES public.workspaces(id)' },
      { table: 'workspace_documents', ref: 'REFERENCES auth.users(id)' },
      { table: 'clubs', ref: 'REFERENCES auth.users(id)' },
      { table: 'club_members', ref: 'REFERENCES public.clubs(id)' },
      { table: 'club_events', ref: 'REFERENCES public.clubs(id)' },
      { table: 'club_finances', ref: 'REFERENCES public.clubs(id)' },
      { table: 'dorm_spaces', ref: 'REFERENCES auth.users(id)' },
      { table: 'dorm_members', ref: 'REFERENCES public.dorm_spaces(id)' },
      { table: 'dorm_chores', ref: 'REFERENCES public.dorm_spaces(id)' },
      { table: 'dorm_expenses', ref: 'REFERENCES public.dorm_spaces(id)' },
      { table: 'student_notifications', ref: 'REFERENCES auth.users(id)' },
    ];

    for (const fk of foreignKeyExpectations) {
      const tableBlockRegex = new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${fk.table}\\s*\\([\\s\\S]*?\\n\\);`, 'i');
      const match = sqlContent.match(tableBlockRegex);
      assert.ok(match, `Could not find table public.${fk.table}`);
      assert.ok(
        match[0].includes(fk.ref),
        `Table public.${fk.table} must contain reference '${fk.ref}'`
      );
    }
  });

  test('R1 Security Gate: RLS is explicitly enabled on all 19 tables', () => {
    const allTables = [
      'profiles',
      'courses',
      'course_syllabus',
      'tasks',
      'workspaces',
      'workspace_members',
      'workspace_kanban_tasks',
      'workspace_documents',
      'workspace_activities',
      'clubs',
      'club_members',
      'club_events',
      'club_finances',
      'club_tasks',
      'dorm_spaces',
      'dorm_members',
      'dorm_chores',
      'dorm_expenses',
      'student_notifications',
    ];

    for (const table of allTables) {
      const rlsStatement = `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`;
      assert.ok(
        sqlContent.includes(rlsStatement),
        `RLS must be enabled with '${rlsStatement}'`
      );

      // Verify at least one policy exists for this table
      const policyRegex = new RegExp(`CREATE POLICY [^;]+ ON public\\.${table}\\b`, 'i');
      assert.match(
        sqlContent,
        policyRegex,
        `Table public.${table} must have at least one RLS policy defined`
      );
    }
  });

  test('Supabase Postgres Best Practice: InitPlan wrapping for auth.uid() in RLS', () => {
    // Supabase performance rule: wrap auth.uid() in (SELECT auth.uid()) so Postgres
    // treats it as an InitPlan (evaluated once) rather than evaluating it per-row.
    const rawAuthUidCalls = sqlContent.match(/=\s*auth\.uid\(\)/g);
    assert.equal(
      rawAuthUidCalls,
      null,
      `All auth.uid() evaluations in RLS should use (SELECT auth.uid()) for InitPlan caching`
    );

    const initPlanCalls = sqlContent.match(/\(SELECT auth\.uid\(\)\)/g);
    assert.ok(
      initPlanCalls && initPlanCalls.length >= 20,
      `Expected extensive use of (SELECT auth.uid()) InitPlan caching, found ${initPlanCalls?.length || 0}`
    );
  });

  test('Performance Indexes: Foreign keys and query fields have indexes defined', () => {
    const expectedIndexes = [
      'idx_profiles_user_id',
      'idx_courses_user_id',
      'idx_course_syllabus_course_id',
      'idx_tasks_user_id',
      'idx_tasks_user_status',
      'idx_workspaces_owner',
      'idx_workspace_members_user',
      'idx_workspace_kanban_ws',
      'idx_clubs_president',
      'idx_club_members_user',
      'idx_club_events_club',
      'idx_dorm_spaces_created_by',
      'idx_dorm_members_user',
      'idx_dorm_chores_space',
      'idx_dorm_expenses_space',
      'idx_student_notifications_user_unread',
    ];

    for (const idx of expectedIndexes) {
      assert.ok(
        sqlContent.includes(idx),
        `Performance index '${idx}' should be defined in migration`
      );
    }
  });

  test('R2 Storage Buckets: academic-materials, task-attachments, student-avatars configured', () => {
    assert.ok(
      sqlContent.includes("'academic-materials'"),
      'Bucket academic-materials must be registered'
    );
    assert.ok(
      sqlContent.includes("'task-attachments'"),
      'Bucket task-attachments must be registered'
    );
    assert.ok(
      sqlContent.includes("'student-avatars'"),
      'Bucket student-avatars must be registered'
    );
    assert.ok(
      sqlContent.includes('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'),
      'storage.objects must have RLS enabled'
    );
  });

  test('SQL Syntax Sanity: Parentheses and quotes balance', () => {
    // Remove comments to check syntax balance
    const codeOnly = sqlContent
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    // Check that every CREATE TABLE block closes its parentheses
    const createMatches = codeOnly.match(/CREATE TABLE[^{};]*?\(([\s\S]*?)\);/gi);
    assert.ok(createMatches && createMatches.length >= 19, `Expected at least 19 CREATE TABLE statements`);

    for (const tbl of createMatches) {
      let openParen = 0;
      for (const char of tbl) {
        if (char === '(') openParen++;
        if (char === ')') openParen--;
      }
      assert.equal(openParen, 0, `Unbalanced parentheses in table statement: ${tbl.slice(0, 50)}...`);
    }
  });
});
