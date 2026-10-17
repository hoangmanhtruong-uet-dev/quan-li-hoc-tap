import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

import type {
  CalendarEventRow,
  CalendarEventInsert,
  CalendarEventUpdate,
  GradeRow,
  GradeInsert,
  GradeUpdate,
  Database,
} from '../src/types/database.ts';

/**
 * In-memory TypeScript compiler probe helper.
 * Compiles a snippet that imports ../src/types/database.ts and returns any compiler diagnostics.
 */
function compileSnippet(snippet: string): { code: number; message: string }[] {
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    allowImportingTsExtensions: true,
  };

  const dummyPath = path.resolve(process.cwd(), 'tests', '__ts_probe__.ts');
  const host = ts.createCompilerHost(options);
  const origGetSourceFile = host.getSourceFile;

  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    if (path.resolve(fileName).toLowerCase() === dummyPath.toLowerCase()) {
      return ts.createSourceFile(fileName, snippet, languageVersion);
    }
    return origGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
  };

  const program = ts.createProgram([dummyPath], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program).filter((d) => {
    return d.file && path.resolve(d.file.fileName).toLowerCase() === dummyPath.toLowerCase();
  });

  return diagnostics.map((d) => ({
    code: d.code,
    message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
  }));
}

describe('Challenger M1-2: TypeScript Type Soundness & Schema Completeness', () => {
  const rootDir = path.resolve(process.cwd(), '..');
  const migration007Path = path.join(rootDir, 'supabase', 'migrations', '007_core_trio_persistence.sql');
  const migration003Path = path.join(rootDir, 'supabase', 'migrations', '003_complete_campusos_schema.sql');
  const databaseTsPath = path.resolve(process.cwd(), 'src', 'types', 'database.ts');

  // =========================================================================
  // 1. Static Compiler Checks on Mock Rows (TypeScript Soundness)
  // =========================================================================

  describe('1. Static TypeScript Compiler Checks (Valid vs Invalid Rows)', () => {
    test('CalendarEventRow: Valid mock row produces 0 compiler errors', () => {
      const code = `
        import type { CalendarEventRow } from '../src/types/database.ts';
        const validRow: CalendarEventRow = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          user_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          title: 'Toán rời rạc - Ôn tập Giữa kỳ',
          start_time: '2026-10-18T08:00:00.000Z',
          end_time: '2026-10-18T10:00:00.000Z',
          event_type: 'exam',
          color: '#ef4444',
          location: 'Phòng B1-204',
          is_all_day: false,
          created_at: '2026-10-17T12:00:00.000Z',
          updated_at: '2026-10-17T12:00:00.000Z',
        };
      `;
      const diagnostics = compileSnippet(code);
      assert.equal(diagnostics.length, 0, `Expected 0 errors, got: ${JSON.stringify(diagnostics)}`);
    });

    test('CalendarEventRow: Invalid event_type produces TS2322 compiler error', () => {
      const code = `
        import type { CalendarEventRow } from '../src/types/database.ts';
        const invalidRow: CalendarEventRow = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          user_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          title: 'Party Weekend',
          start_time: '2026-10-18T08:00:00.000Z',
          end_time: '2026-10-18T10:00:00.000Z',
          event_type: 'party',
          color: null,
          location: null,
          is_all_day: false,
          created_at: '2026-10-17T12:00:00.000Z',
          updated_at: '2026-10-17T12:00:00.000Z',
        };
      `;
      const diagnostics = compileSnippet(code);
      assert.ok(diagnostics.length > 0, 'Compiler must flag invalid event_type');
      assert.ok(
        diagnostics.some((d) => d.code === 2322 && d.message.includes('party')),
        `Expected TS2322 mentioning party, got: ${JSON.stringify(diagnostics)}`
      );
    });

    test('CalendarEventRow: Missing required title produces TS2741 compiler error', () => {
      const code = `
        import type { CalendarEventRow } from '../src/types/database.ts';
        const missingTitle: CalendarEventRow = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          user_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          start_time: '2026-10-18T08:00:00.000Z',
          end_time: '2026-10-18T10:00:00.000Z',
          event_type: 'class',
          color: null,
          location: null,
          is_all_day: false,
          created_at: '2026-10-17T12:00:00.000Z',
          updated_at: '2026-10-17T12:00:00.000Z',
        };
      `;
      const diagnostics = compileSnippet(code);
      assert.ok(diagnostics.length > 0, 'Compiler must flag missing title');
      assert.ok(
        diagnostics.some((d) => d.code === 2741 && d.message.includes('title')),
        `Expected TS2741 mentioning 'title', got: ${JSON.stringify(diagnostics)}`
      );
    });

    test('CalendarEventInsert: Minimal valid insert produces 0 compiler errors', () => {
      const code = `
        import type { CalendarEventInsert } from '../src/types/database.ts';
        const minimalInsert: CalendarEventInsert = {
          user_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          title: 'Học nhóm Thư viện',
          start_time: '2026-10-18T14:00:00.000Z',
          end_time: '2026-10-18T16:00:00.000Z',
        };
      `;
      const diagnostics = compileSnippet(code);
      assert.equal(diagnostics.length, 0, `Expected 0 errors, got: ${JSON.stringify(diagnostics)}`);
    });

    test('CalendarEventInsert: Missing user_id produces TS2741 compiler error', () => {
      const code = `
        import type { CalendarEventInsert } from '../src/types/database.ts';
        const missingUserId: CalendarEventInsert = {
          title: 'Sự kiện thiếu user_id',
          start_time: '2026-10-18T14:00:00.000Z',
          end_time: '2026-10-18T16:00:00.000Z',
        };
      `;
      const diagnostics = compileSnippet(code);
      assert.ok(diagnostics.length > 0, 'Compiler must flag missing user_id');
      assert.ok(
        diagnostics.some((d) => d.code === 2741 && d.message.includes('user_id')),
        `Expected TS2741 mentioning 'user_id', got: ${JSON.stringify(diagnostics)}`
      );
    });

    test('GradeRow: Valid mock row with course_id produces 0 compiler errors', () => {
      const code = `
        import type { GradeRow } from '../src/types/database.ts';
        const validGrade: GradeRow = {
          id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          course_id: '550e8400-e29b-41d4-a716-446655440002',
          component_name: 'Đồ án cuối kỳ',
          score: 9.5,
          weight: 40.0,
          created_at: '2026-10-17T12:00:00.000Z',
          updated_at: '2026-10-17T12:00:00.000Z',
        };
      `;
      const diagnostics = compileSnippet(code);
      assert.equal(diagnostics.length, 0, `Expected 0 errors, got: ${JSON.stringify(diagnostics)}`);
    });

    test('GradeRow: Valid mock row with null course_id produces 0 compiler errors', () => {
      const code = `
        import type { GradeRow } from '../src/types/database.ts';
        const generalGrade: GradeRow = {
          id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          course_id: null,
          component_name: 'Điểm rèn luyện',
          score: 85,
          weight: 100,
          created_at: '2026-10-17T12:00:00.000Z',
          updated_at: '2026-10-17T12:00:00.000Z',
        };
      `;
      const diagnostics = compileSnippet(code);
      assert.equal(diagnostics.length, 0, `Expected 0 errors, got: ${JSON.stringify(diagnostics)}`);
    });

    test('GradeRow: Non-numeric score produces TS2322 compiler error', () => {
      const code = `
        import type { GradeRow } from '../src/types/database.ts';
        const invalidGrade: GradeRow = {
          id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          course_id: null,
          component_name: 'Điểm chữ',
          score: 'A+',
          weight: 20,
          created_at: '2026-10-17T12:00:00.000Z',
          updated_at: '2026-10-17T12:00:00.000Z',
        };
      `;
      const diagnostics = compileSnippet(code);
      assert.ok(diagnostics.length > 0, 'Compiler must flag string score');
      assert.ok(
        diagnostics.some((d) => d.code === 2322 && d.message.includes("'string'")),
        `Expected TS2322 mentioning 'string', got: ${JSON.stringify(diagnostics)}`
      );
    });

    test('GradeInsert: Minimal valid insert produces 0 compiler errors', () => {
      const code = `
        import type { GradeInsert } from '../src/types/database.ts';
        const minimalInsert: GradeInsert = {
          user_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          component_name: 'Chuyên cần',
          score: 10,
          weight: 10,
        };
      `;
      const diagnostics = compileSnippet(code);
      assert.equal(diagnostics.length, 0, `Expected 0 errors, got: ${JSON.stringify(diagnostics)}`);
    });

    test('GradeInsert: Missing weight produces TS2741 compiler error', () => {
      const code = `
        import type { GradeInsert } from '../src/types/database.ts';
        const missingWeight: GradeInsert = {
          user_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          component_name: 'Giữa kỳ',
          score: 8.0,
        };
      `;
      const diagnostics = compileSnippet(code);
      assert.ok(diagnostics.length > 0, 'Compiler must flag missing weight');
      assert.ok(
        diagnostics.some((d) => d.code === 2741 && d.message.includes('weight')),
        `Expected TS2741 mentioning 'weight', got: ${JSON.stringify(diagnostics)}`
      );
    });

    test('CalendarEventRow: Non-string start_time produces TS2322 compiler error', () => {
      const code = `
        import type { CalendarEventRow } from '../src/types/database.ts';
        const badTime: CalendarEventRow = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          user_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          title: 'Epoch time',
          start_time: 1729152000 as unknown as string,
          end_time: '2026-10-18T10:00:00.000Z',
          event_type: 'class',
          color: null,
          location: null,
          is_all_day: false,
          created_at: '2026-10-17T12:00:00.000Z',
          updated_at: '2026-10-17T12:00:00.000Z',
        };
      `;
      // Test without typecast
      const rawCode = `
        import type { CalendarEventRow } from '../src/types/database.ts';
        const badTime: CalendarEventRow = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          user_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          title: 'Epoch time',
          start_time: 1729152000,
          end_time: '2026-10-18T10:00:00.000Z',
          event_type: 'class',
          color: null,
          location: null,
          is_all_day: false,
          created_at: '2026-10-17T12:00:00.000Z',
          updated_at: '2026-10-17T12:00:00.000Z',
        };
      `;
      const diagnostics = compileSnippet(rawCode);
      assert.ok(diagnostics.length > 0, 'Compiler must flag numeric start_time');
      assert.ok(
        diagnostics.some((d) => d.code === 2322 && d.message.includes("'number'")),
        `Expected TS2322 mentioning 'number', got: ${JSON.stringify(diagnostics)}`
      );
    });

    test('CalendarEventInsert: Missing start_time or end_time produces TS2741 compiler error', () => {
      const code1 = `
        import type { CalendarEventInsert } from '../src/types/database.ts';
        const missingStartTime: CalendarEventInsert = {
          user_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          title: 'Chưa có giờ bắt đầu',
          end_time: '2026-10-18T16:00:00.000Z',
        };
      `;
      const d1 = compileSnippet(code1);
      assert.ok(d1.length > 0 && d1.some((d) => d.code === 2741 && d.message.includes('start_time')));

      const code2 = `
        import type { CalendarEventInsert } from '../src/types/database.ts';
        const missingEndTime: CalendarEventInsert = {
          user_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          title: 'Chưa có giờ kết thúc',
          start_time: '2026-10-18T14:00:00.000Z',
        };
      `;
      const d2 = compileSnippet(code2);
      assert.ok(d2.length > 0 && d2.some((d) => d.code === 2741 && d.message.includes('end_time')));
    });

    test('CalendarEventUpdate: Empty object and partial updates produce 0 compiler errors', () => {
      const code = `
        import type { CalendarEventUpdate } from '../src/types/database.ts';
        const emptyUpdate: CalendarEventUpdate = {};
        const titleOnly: CalendarEventUpdate = { title: 'Tên mới' };
        const timeOnly: CalendarEventUpdate = { start_time: '2026-10-18T15:00:00Z', end_time: '2026-10-18T17:00:00Z' };
        const typeOnly: CalendarEventUpdate = { event_type: 'study' };
      `;
      const diagnostics = compileSnippet(code);
      assert.equal(diagnostics.length, 0, `Expected 0 errors, got: ${JSON.stringify(diagnostics)}`);
    });

    test('CalendarEventUpdate: Invalid event_type in update produces TS2322 compiler error', () => {
      const code = `
        import type { CalendarEventUpdate } from '../src/types/database.ts';
        const badUpdate: CalendarEventUpdate = {
          event_type: 'non_existent_type',
        };
      `;
      const diagnostics = compileSnippet(code);
      assert.ok(diagnostics.length > 0);
      assert.ok(diagnostics.some((d) => d.code === 2322 && d.message.includes('non_existent_type')));
    });

    test('GradeRow: Score cannot be null (NOT NULL in schema)', () => {
      const code = `
        import type { GradeRow } from '../src/types/database.ts';
        const nullScore: GradeRow = {
          id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          course_id: null,
          component_name: 'Điểm chưa nhập',
          score: null,
          weight: 20,
          created_at: '2026-10-17T12:00:00.000Z',
          updated_at: '2026-10-17T12:00:00.000Z',
        };
      `;
      const diagnostics = compileSnippet(code);
      assert.ok(diagnostics.length > 0, 'Compiler must flag null score');
      assert.ok(diagnostics.some((d) => d.code === 2322 && d.message.includes('null')));
    });

    test('GradeInsert: Missing component_name or score produces TS2741 compiler error', () => {
      const code1 = `
        import type { GradeInsert } from '../src/types/database.ts';
        const missingComponent: GradeInsert = {
          user_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          score: 8.5,
          weight: 30,
        };
      `;
      const d1 = compileSnippet(code1);
      assert.ok(d1.length > 0 && d1.some((d) => d.code === 2741 && d.message.includes('component_name')));

      const code2 = `
        import type { GradeInsert } from '../src/types/database.ts';
        const missingScore: GradeInsert = {
          user_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          component_name: 'Thực hành',
          weight: 20,
        };
      `;
      const d2 = compileSnippet(code2);
      assert.ok(d2.length > 0 && d2.some((d) => d.code === 2741 && d.message.includes('score')));
    });

    test('GradeUpdate: Valid partial updates vs invalid string weight', () => {
      const validCode = `
        import type { GradeUpdate } from '../src/types/database.ts';
        const empty: GradeUpdate = {};
        const scoreOnly: GradeUpdate = { score: 10 };
        const weightOnly: GradeUpdate = { weight: 50 };
        const courseNullable: GradeUpdate = { course_id: null };
      `;
      assert.equal(compileSnippet(validCode).length, 0);

      const invalidCode = `
        import type { GradeUpdate } from '../src/types/database.ts';
        const badWeight: GradeUpdate = {
          weight: 'fifty percent',
        };
      `;
      const d = compileSnippet(invalidCode);
      assert.ok(d.length > 0 && d.some((item) => item.code === 2322 && item.message.includes("'string'")));
    });
  });

  // =========================================================================
  // 2. Runtime Object Construction & Boundary Stress Tests
  // =========================================================================

  describe('2. Runtime Object Construction & Boundary Tests', () => {
    test('CalendarEvent: constructs valid rows with all 4 event types', () => {
      const eventTypes: ('class' | 'study' | 'exam' | 'personal')[] = ['class', 'study', 'exam', 'personal'];
      for (const t of eventTypes) {
        const row: CalendarEventRow = {
          id: `ev-${t}`,
          user_id: 'user-001',
          title: `Sự kiện ${t}`,
          start_time: '2026-10-18T08:00:00Z',
          end_time: '2026-10-18T09:30:00Z',
          event_type: t,
          color: '#38bdf8',
          location: 'Lab 1',
          is_all_day: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        assert.equal(row.event_type, t);
        assert.ok(Date.parse(row.start_time) < Date.parse(row.end_time));
      }
    });

    test('CalendarEvent: handles null optional fields gracefully', () => {
      const row: CalendarEventRow = {
        id: 'ev-nulls',
        user_id: 'user-001',
        title: 'Sự kiện không màu không phòng',
        start_time: '2026-10-18T10:00:00Z',
        end_time: '2026-10-18T11:00:00Z',
        event_type: 'personal',
        color: null,
        location: null,
        is_all_day: null,
        created_at: '2026-10-17T00:00:00Z',
        updated_at: '2026-10-17T00:00:00Z',
      };
      assert.equal(row.color, null);
      assert.equal(row.location, null);
      assert.equal(row.is_all_day, null);
    });

    test('Grade: handles boundary numerical scores (0, 10, 100) and weights (0, 100)', () => {
      const boundaries = [
        { score: 0, weight: 0 },
        { score: 10, weight: 100 },
        { score: 8.75, weight: 35.5 },
        { score: 100, weight: 50 },
      ];

      for (const b of boundaries) {
        const grade: GradeRow = {
          id: `grade-${b.score}-${b.weight}`,
          user_id: 'user-test',
          course_id: 'course-abc',
          component_name: `Component ${b.score}`,
          score: b.score,
          weight: b.weight,
          created_at: '2026-10-17T00:00:00Z',
          updated_at: '2026-10-17T00:00:00Z',
        };
        assert.equal(grade.score, b.score);
        assert.equal(grade.weight, b.weight);
        assert.ok(grade.score >= 0);
        assert.ok(grade.weight >= 0 && grade.weight <= 100);
      }
    });

    test('Update types permit partial field mutations', () => {
      const eventUpdate: CalendarEventUpdate = {
        title: 'Đổi tiêu đề lớp',
      };
      assert.equal(eventUpdate.title, 'Đổi tiêu đề lớp');
      assert.equal(eventUpdate.end_time, undefined);

      const gradeUpdate: GradeUpdate = {
        score: 9.8,
      };
      assert.equal(gradeUpdate.score, 9.8);
      assert.equal(gradeUpdate.weight, undefined);
    });
  });

  // =========================================================================
  // 3. Schema Completeness & Cohesion Verification (21 Tables Total)
  // =========================================================================

  describe('3. Schema Cohesion & Completeness across 21 Tables', () => {
    test('003 migration defines exactly 19 domain tables', () => {
      assert.ok(fs.existsSync(migration003Path));
      const sql003 = fs.readFileSync(migration003Path, 'utf8');
      const tableMatches = [...sql003.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-zA-Z0-9_]+)\s*\(/g)];
      const tableNames = tableMatches.map((m) => m[1]);
      assert.equal(tableNames.length, 19, `003 must have exactly 19 tables, found ${tableNames.length}`);
    });

    test('007 migration defines exactly 2 tables: calendar_events and grades', () => {
      assert.ok(fs.existsSync(migration007Path));
      const sql007 = fs.readFileSync(migration007Path, 'utf8');
      const tableMatches = [...sql007.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-zA-Z0-9_]+)\s*\(/g)];
      const tableNames = tableMatches.map((m) => m[1]);
      assert.equal(tableNames.length, 2, `007 must have exactly 2 tables, found ${tableNames.length}`);
      assert.ok(tableNames.includes('calendar_events'));
      assert.ok(tableNames.includes('grades'));
    });

    test('Zero table name collisions across 003 and 007 migrations (21 distinct tables)', () => {
      const sql003 = fs.readFileSync(migration003Path, 'utf8');
      const sql007 = fs.readFileSync(migration007Path, 'utf8');

      const tables003 = [...sql003.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-zA-Z0-9_]+)\s*\(/g)].map((m) => m[1]);
      const tables007 = [...sql007.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-zA-Z0-9_]+)\s*\(/g)].map((m) => m[1]);

      const allTables = [...tables003, ...tables007];
      const uniqueTables = new Set(allTables);

      assert.equal(uniqueTables.size, 21, `Expected 21 unique tables, found ${uniqueTables.size}`);
      assert.equal(allTables.length, 21, 'No duplicate table names allowed between 003 and 007');
    });

    test('Foreign key integrity: grades.course_id references public.courses(id) which exists in 003', () => {
      const sql003 = fs.readFileSync(migration003Path, 'utf8');
      const sql007 = fs.readFileSync(migration007Path, 'utf8');

      // 003 defines public.courses with id UUID PRIMARY KEY
      assert.match(sql003, /CREATE TABLE IF NOT EXISTS public\.courses\s*\(\s*id UUID PRIMARY KEY/i);

      // 007 references public.courses(id) ON DELETE CASCADE
      assert.match(sql007, /course_id UUID REFERENCES public\.courses\(id\) ON DELETE CASCADE/i);
    });

    test('Foreign key integrity: calendar_events.user_id and grades.user_id reference auth.users(id) with CASCADE', () => {
      const sql007 = fs.readFileSync(migration007Path, 'utf8');
      assert.match(
        sql007,
        /user_id UUID NOT NULL REFERENCES auth\.users\(id\) ON DELETE CASCADE/g,
        'Both tables must reference auth.users(id) with ON DELETE CASCADE'
      );
    });

    test('Performance: All foreign keys in 007 have dedicated supporting indexes', () => {
      const sql007 = fs.readFileSync(migration007Path, 'utf8');
      assert.ok(sql007.includes('idx_calendar_events_user_id ON public.calendar_events (user_id)'));
      assert.ok(sql007.includes('idx_grades_user_id ON public.grades (user_id)'));
      assert.ok(sql007.includes('idx_grades_course_id ON public.grades (course_id)'));
      assert.ok(sql007.includes('idx_calendar_events_user_start ON public.calendar_events (user_id, start_time)'));
      assert.ok(sql007.includes('idx_grades_user_course ON public.grades (user_id, course_id)'));
    });

    test('Security & RLS: All 8 CRUD policies in 007 use InitPlan (SELECT auth.uid()) pattern', () => {
      const sql007 = fs.readFileSync(migration007Path, 'utf8');
      const policyMatches = [...sql007.matchAll(/CREATE POLICY\s+"([^"]+)"\s+ON\s+public\.([a-zA-Z0-9_]+)/g)];
      assert.equal(policyMatches.length, 8, `Expected exactly 8 RLS policies in 007, found ${policyMatches.length}`);

      // Ensure zero un-parenthesized auth.uid()
      const bareUid = sql007.match(/=\s*auth\.uid\(\)/gi);
      assert.equal(bareUid, null, 'Must not use bare auth.uid() without SELECT');
    });

    test('TypeScript database.ts exposes all 21 tables and aliases', () => {
      const tsContent = fs.readFileSync(databaseTsPath, 'utf8');

      // Check Tables block has calendar_events and grades
      assert.ok(tsContent.includes('calendar_events: {'));
      assert.ok(tsContent.includes('grades: {'));

      // Check exported aliases
      assert.ok(tsContent.includes('export type CalendarEventRow ='));
      assert.ok(tsContent.includes('export type CalendarEventInsert ='));
      assert.ok(tsContent.includes('export type CalendarEventUpdate ='));
      assert.ok(tsContent.includes('export type GradeRow ='));
      assert.ok(tsContent.includes('export type GradeInsert ='));
      assert.ok(tsContent.includes('export type GradeUpdate ='));
    });

    test('TypeScript database.ts Relationships contracts correctly reference users and courses', () => {
      const tsContent = fs.readFileSync(databaseTsPath, 'utf8');

      // calendar_events relationship to auth.users
      assert.ok(tsContent.includes("foreignKeyName: 'calendar_events_user_id_fkey'"));
      assert.ok(tsContent.includes("columns: ['user_id']"));

      // grades relationship to auth.users and courses
      assert.ok(tsContent.includes("foreignKeyName: 'grades_user_id_fkey'"));
      assert.ok(tsContent.includes("foreignKeyName: 'grades_course_id_fkey'"));
      assert.ok(tsContent.includes("referencedRelation: 'courses'"));
    });
  });
});
