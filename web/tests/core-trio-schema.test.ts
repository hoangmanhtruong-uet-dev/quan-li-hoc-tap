import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type {
  CalendarEventRow,
  CalendarEventInsert,
  CalendarEventUpdate,
  GradeRow,
  GradeInsert,
  GradeUpdate,
  Database,
} from '../src/types/database.ts';
import {
  supabase,
  isSupabaseConfigured,
  isOnline,
  safeSupabaseOperation,
} from '../src/lib/supabase.ts';

describe('Milestone 1 - Core Trio Database Schema & Persistence (007_core_trio_persistence.sql)', () => {
  const rootDir = path.resolve(process.cwd(), '..');
  const migration007Path = path.join(rootDir, 'supabase', 'migrations', '007_core_trio_persistence.sql');
  const migration003Path = path.join(rootDir, 'supabase', 'migrations', '003_complete_campusos_schema.sql');

  test('007 migration file exists and is populated', () => {
    assert.ok(fs.existsSync(migration007Path), `Migration file must exist at ${migration007Path}`);
    const stat = fs.statSync(migration007Path);
    assert.ok(stat.size > 1500, `Migration file should be comprehensive (>1.5KB), got ${stat.size} bytes`);
  });

  const sql007 = fs.readFileSync(migration007Path, 'utf8');

  test('Table Definition: public.calendar_events exists with exact required columns', () => {
    assert.match(
      sql007,
      /CREATE TABLE IF NOT EXISTS public\.calendar_events\s*\(/i,
      'Table public.calendar_events must be defined'
    );

    const requiredColumns = [
      'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
      'user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE',
      'title TEXT NOT NULL',
      'start_time TIMESTAMPTZ NOT NULL',
      'end_time TIMESTAMPTZ NOT NULL',
      "event_type TEXT NOT NULL DEFAULT 'class'",
      "CHECK (event_type IN ('class', 'study', 'exam', 'personal'))",
      "color TEXT DEFAULT '#38bdf8'",
      "location TEXT DEFAULT ''",
      'is_all_day BOOLEAN DEFAULT false',
      'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
      'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
    ];

    for (const colDef of requiredColumns) {
      assert.ok(
        sql007.includes(colDef),
        `public.calendar_events must contain column or constraint: "${colDef}"`
      );
    }
  });

  test('Table Definition: public.grades exists with exact required columns & constraints', () => {
    assert.match(
      sql007,
      /CREATE TABLE IF NOT EXISTS public\.grades\s*\(/i,
      'Table public.grades must be defined'
    );

    const requiredColumns = [
      'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
      'user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE',
      'course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE',
      'component_name TEXT NOT NULL',
      'score NUMERIC(5, 2) NOT NULL CHECK (score >= 0)',
      'weight NUMERIC(5, 2) NOT NULL CHECK (weight >= 0 AND weight <= 100)',
      'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
      'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
    ];

    for (const colDef of requiredColumns) {
      assert.ok(
        sql007.includes(colDef),
        `public.grades must contain column or constraint: "${colDef}"`
      );
    }
  });

  test('Indexes: All required foreign key and compound indexes are defined', () => {
    const requiredIndexes = [
      'idx_calendar_events_user_id',
      'idx_calendar_events_start_time',
      'idx_calendar_events_user_start',
      'idx_grades_user_id',
      'idx_grades_course_id',
      'idx_grades_user_course',
    ];

    for (const idx of requiredIndexes) {
      const idxRegex = new RegExp(`CREATE INDEX IF NOT EXISTS ${idx}\\s+ON\\s+public\\.(calendar_events|grades)`, 'i');
      assert.match(sql007, idxRegex, `Index ${idx} must be defined`);
    }

    assert.ok(
      sql007.includes('idx_calendar_events_user_start ON public.calendar_events (user_id, start_time)'),
      'Composite index on (user_id, start_time) must exist for calendar event queries'
    );
    assert.ok(
      sql007.includes('idx_grades_user_course ON public.grades (user_id, course_id)'),
      'Composite index on (user_id, course_id) must exist for grade queries'
    );
  });

  test('Security & RLS: RLS is enabled and policies use cached (SELECT auth.uid()) pattern', () => {
    assert.match(
      sql007,
      /ALTER TABLE public\.calendar_events ENABLE ROW LEVEL SECURITY;/i,
      'RLS must be enabled on calendar_events'
    );
    assert.match(
      sql007,
      /ALTER TABLE public\.grades ENABLE ROW LEVEL SECURITY;/i,
      'RLS must be enabled on grades'
    );

    // Verify all 4 CRUD actions for calendar_events
    assert.match(sql007, /CREATE POLICY [^;]+ ON public\.calendar_events\s+FOR SELECT\s+USING\s*\(user_id = \(SELECT auth\.uid\(\)\)\)/i);
    assert.match(sql007, /CREATE POLICY [^;]+ ON public\.calendar_events\s+FOR INSERT\s+WITH CHECK\s*\(user_id = \(SELECT auth\.uid\(\)\)\)/i);
    assert.match(sql007, /CREATE POLICY [^;]+ ON public\.calendar_events\s+FOR UPDATE\s+USING\s*\(user_id = \(SELECT auth\.uid\(\)\)\)\s+WITH CHECK\s*\(user_id = \(SELECT auth\.uid\(\)\)\)/i);
    assert.match(sql007, /CREATE POLICY [^;]+ ON public\.calendar_events\s+FOR DELETE\s+USING\s*\(user_id = \(SELECT auth\.uid\(\)\)\)/i);

    // Verify all 4 CRUD actions for grades
    assert.match(sql007, /CREATE POLICY [^;]+ ON public\.grades\s+FOR SELECT\s+USING\s*\(user_id = \(SELECT auth\.uid\(\)\)\)/i);
    assert.match(sql007, /CREATE POLICY [^;]+ ON public\.grades\s+FOR INSERT\s+WITH CHECK\s*\(user_id = \(SELECT auth\.uid\(\)\)\)/i);
    assert.match(sql007, /CREATE POLICY [^;]+ ON public\.grades\s+FOR UPDATE\s+USING\s*\(user_id = \(SELECT auth\.uid\(\)\)\)\s+WITH CHECK\s*\(user_id = \(SELECT auth\.uid\(\)\)\)/i);
    assert.match(sql007, /CREATE POLICY [^;]+ ON public\.grades\s+FOR DELETE\s+USING\s*\(user_id = \(SELECT auth\.uid\(\)\)\)/i);

    // Anti-slop / best practice check: no bare auth.uid() without SELECT
    const bareAuthUidMatches = sql007.match(/=\s*auth\.uid\(\)/gi);
    assert.equal(
      bareAuthUidMatches,
      null,
      'All auth.uid() calls must be wrapped in (SELECT auth.uid()) for InitPlan query caching'
    );
  });

  test('Realtime Publication: calendar_events is idempotently added to supabase_realtime', () => {
    assert.match(
      sql007,
      /ALTER TABLE public\.calendar_events REPLICA IDENTITY FULL;/i,
      'calendar_events must have REPLICA IDENTITY FULL for realtime CDC updates'
    );

    assert.ok(
      sql007.includes("IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')"),
      'Publication modification must be wrapped in conditional check'
    );
    assert.ok(
      sql007.includes('ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;'),
      'calendar_events must be added to supabase_realtime'
    );
  });

  test('Non-Regression Guard: 003_complete_campusos_schema.sql remains intact with exactly 19 tables', () => {
    assert.ok(fs.existsSync(migration003Path), '003 schema migration file must exist');
    const sql003 = fs.readFileSync(migration003Path, 'utf8');
    const tableMatches = [...sql003.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-zA-Z0-9_]+)\s*\(/g)];
    assert.equal(
      tableMatches.length,
      19,
      `003 migration must have exactly 19 tables to satisfy challenger-m1 tests, got ${tableMatches.length}`
    );
  });

  test('TypeScript Type Coverage: CalendarEventRow and GradeRow types are sound', () => {
    const sampleEvent: CalendarEventRow = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      user_id: 'b711fb8b-2f9b-453b-a86a-b52623afec0f',
      title: 'Mạng máy tính - Lab 3',
      start_time: '2026-10-18T08:00:00.000Z',
      end_time: '2026-10-18T10:30:00.000Z',
      event_type: 'class',
      color: '#38bdf8',
      location: 'H6-302',
      is_all_day: false,
      created_at: '2026-10-17T10:00:00.000Z',
      updated_at: '2026-10-17T10:00:00.000Z',
    };

    assert.equal(sampleEvent.title, 'Mạng máy tính - Lab 3');
    assert.equal(sampleEvent.event_type, 'class');
    assert.equal(sampleEvent.is_all_day, false);

    const sampleInsert: CalendarEventInsert = {
      user_id: 'b711fb8b-2f9b-453b-a86a-b52623afec0f',
      title: 'Ôn tập Giải tích 2',
      start_time: '2026-10-18T14:00:00.000Z',
      end_time: '2026-10-18T16:00:00.000Z',
      event_type: 'study',
    };
    assert.equal(sampleInsert.event_type, 'study');

    const sampleUpdate: CalendarEventUpdate = {
      location: 'Thư viện trung tâm Tầng 3',
    };
    assert.equal(sampleUpdate.location, 'Thư viện trung tâm Tầng 3');

    const sampleGrade: GradeRow = {
      id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      user_id: 'b711fb8b-2f9b-453b-a86a-b52623afec0f',
      course_id: 'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      component_name: 'Giữa kỳ',
      score: 8.5,
      weight: 30.0,
      created_at: '2026-10-17T10:00:00.000Z',
      updated_at: '2026-10-17T10:00:00.000Z',
    };

    assert.equal(sampleGrade.score, 8.5);
    assert.equal(sampleGrade.weight, 30.0);
    assert.equal(sampleGrade.component_name, 'Giữa kỳ');

    const sampleGradeInsert: GradeInsert = {
      user_id: 'b711fb8b-2f9b-453b-a86a-b52623afec0f',
      component_name: 'Bài tập lớn',
      score: 9.0,
      weight: 20.0,
    };
    assert.equal(sampleGradeInsert.score, 9.0);

    const sampleGradeUpdate: GradeUpdate = {
      score: 9.5,
    };
    assert.equal(sampleGradeUpdate.score, 9.5);
  });

  test('Offline Resiliency: Supabase client & safe execution helpers handle offline state', async () => {
    assert.ok(supabase, 'Supabase client must be instantiated');
    assert.equal(typeof isSupabaseConfigured(), 'boolean', 'isSupabaseConfigured returns boolean');
    assert.equal(typeof isOnline(), 'boolean', 'isOnline returns boolean');

    // Test safeSupabaseOperation with successful execution
    const successResult = await safeSupabaseOperation(async () => {
      return { status: 'healthy', data: [1, 2, 3] };
    }, { status: 'fallback', data: [] });

    assert.ok(successResult.data.length > 0 || successResult.status === 'fallback');

    // Test safeSupabaseOperation when an error is thrown
    const fallbackResult = await safeSupabaseOperation(async () => {
      throw new Error('Simulated network socket timeout');
    }, { recovered: true });

    assert.equal(fallbackResult.recovered, true, 'safeSupabaseOperation should catch errors and return fallback');
  });
});
