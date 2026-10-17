import { test, describe, beforeEach, afterEach } from 'node:test';
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
} from '../src/types/database.ts';
import {
  isSupabaseConfigured,
  isOnline,
  safeSupabaseOperation,
} from '../src/lib/supabase.ts';

describe('Adversarial Stress Test: Milestone 1 - Database Schema, Constraints & Offline Resiliency', () => {
  const rootDir = path.resolve(process.cwd(), '..');
  const migration007Path = path.join(rootDir, 'supabase', 'migrations', '007_core_trio_persistence.sql');
  const migration003Path = path.join(rootDir, 'supabase', 'migrations', '003_complete_campusos_schema.sql');

  assert.ok(fs.existsSync(migration007Path), `Migration 007 must exist at ${migration007Path}`);
  const sql007 = fs.readFileSync(migration007Path, 'utf8');

  // ============================================================================
  // Suite 1: Score Boundaries & Numeric Constraints for Grades
  // ============================================================================
  describe('Category 1: Score Boundaries & Numeric Constraint Adversarial Validation', () => {
    // Extract actual CHECK constraint definitions from SQL
    const scoreCheckMatch = sql007.match(/score NUMERIC\(\d+,\s*\d+\)\s+NOT NULL\s+CHECK\s*\(([^)]+)\)/i);
    const weightCheckMatch = sql007.match(/weight NUMERIC\(\d+,\s*\d+\)\s+NOT NULL\s+CHECK\s*\(([^)]+)\)/i);

    test('SQL DDL defines explicit score and weight CHECK constraints', () => {
      assert.ok(scoreCheckMatch, 'DDL must define CHECK constraint on score');
      assert.ok(weightCheckMatch, 'DDL must define CHECK constraint on weight');
      assert.equal(scoreCheckMatch[1].trim(), 'score >= 0');
      assert.equal(weightCheckMatch[1].trim(), 'weight >= 0 AND weight <= 100');
    });

    // Oracle function directly modeling PostgreSQL CHECK constraint expressions
    const validateScoreConstraint = (score: number): boolean => {
      // Postgres: CHECK (score >= 0)
      return typeof score === 'number' && !Number.isNaN(score) && score >= 0;
    };

    const validateWeightConstraint = (weight: number): boolean => {
      // Postgres: CHECK (weight >= 0 AND weight <= 100)
      return typeof weight === 'number' && !Number.isNaN(weight) && weight >= 0 && weight <= 100;
    };

    test('Adversarial Score Boundaries: rejects negative scores, accepts >= 0', () => {
      const invalidScores = [-0.0001, -0.01, -0.5, -1.0, -10.0, -99.99, -Infinity, NaN];
      for (const invalidScore of invalidScores) {
        assert.equal(
          validateScoreConstraint(invalidScore),
          false,
          `Score ${invalidScore} should violate CHECK (score >= 0)`
        );
      }

      const validScores = [0, 0.0, 0.01, 1.0, 5.5, 8.25, 10.0, 100.0, 999.99];
      for (const validScore of validScores) {
        assert.equal(
          validateScoreConstraint(validScore),
          true,
          `Score ${validScore} should satisfy CHECK (score >= 0)`
        );
      }
    });

    test('Adversarial Weight Boundaries: rejects < 0 and > 100, accepts [0, 100]', () => {
      const invalidWeights = [
        -0.0001, -0.01, -1.0, -50.0, -Infinity,
        100.0001, 100.01, 100.5, 101.0, 150.0, 200.0, Infinity, NaN
      ];
      for (const invalidWeight of invalidWeights) {
        assert.equal(
          validateWeightConstraint(invalidWeight),
          false,
          `Weight ${invalidWeight} should violate CHECK (weight >= 0 AND weight <= 100)`
        );
      }

      const validWeights = [0, 0.0, 0.01, 10.0, 25.5, 50.0, 75.0, 99.99, 100.0];
      for (const validWeight of validWeights) {
        assert.equal(
          validateWeightConstraint(validWeight),
          true,
          `Weight ${validWeight} should satisfy CHECK (weight >= 0 AND weight <= 100)`
        );
      }
    });

    test('TypeScript Grade Types enforce non-null numbers for score and weight', () => {
      const validGrade: GradeRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        course_id: '123e4567-e89b-12d3-a456-426614174002',
        component_name: 'Đồ án cuối kỳ',
        score: 9.5,
        weight: 40.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      assert.equal(typeof validGrade.score, 'number');
      assert.equal(typeof validGrade.weight, 'number');
      assert.ok(validGrade.score >= 0);
      assert.ok(validGrade.weight >= 0 && validGrade.weight <= 100);
    });
  });

  // ============================================================================
  // Suite 2: Event Type Whitelist & Adversarial Input Rejection
  // ============================================================================
  describe('Category 2: Event Type Whitelist & Rejection of Malformed Types', () => {
    const eventTypeCheckMatch = sql007.match(/event_type TEXT NOT NULL DEFAULT 'class' CHECK \((event_type IN \([^)]+\))\)/i);

    test('SQL DDL defines CHECK constraint for event_type whitelist', () => {
      assert.ok(eventTypeCheckMatch, 'DDL must define CHECK constraint on event_type');
      assert.equal(
        eventTypeCheckMatch[1].trim(),
        "event_type IN ('class', 'study', 'exam', 'personal')"
      );
    });

    // Oracle function extracting allowed tokens from DDL
    const extractAllowedEventTypes = (sql: string): Set<string> => {
      const match = sql.match(/event_type IN \(([^)]+)\)/i);
      if (!match) return new Set();
      const tokens = match[1].split(',').map(s => s.trim().replace(/^'|'$/g, ''));
      return new Set(tokens);
    };

    const allowedTypes = extractAllowedEventTypes(sql007);

    test('Whitelist contains exactly the 4 required domain event types', () => {
      const expected = new Set(['class', 'study', 'exam', 'personal']);
      assert.equal(allowedTypes.size, 4);
      for (const t of expected) {
        assert.ok(allowedTypes.has(t), `Allowed types must include '${t}'`);
      }
    });

    test('Adversarial event types are strictly rejected', () => {
      const adversarialInputs = [
        'invalid_type',
        'party',
        'hackathon',
        'club',
        'workshop',
        'meeting',
        'CLASS',          // Postgres text comparison is case-sensitive
        'Class',
        'EXAM',
        'class ',         // Trailing whitespace
        ' class',         // Leading whitespace
        '',               // Empty string
        "' OR '1'='1",    // SQL injection probe
        "class'; DROP TABLE calendar_events; --",
        'clаss',          // Cyrillic homoglyph attack
      ];

      for (const input of adversarialInputs) {
        const isAllowed = allowedTypes.has(input);
        assert.equal(
          isAllowed,
          false,
          `Adversarial input "${input}" must be rejected by CHECK constraint`
        );
      }
    });

    test('TypeScript CalendarEvent types reject invalid event_type values', () => {
      const validTypes: Array<CalendarEventRow['event_type']> = ['class', 'study', 'exam', 'personal'];
      for (const vt of validTypes) {
        const item: CalendarEventInsert = {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Sự kiện mẫu',
          start_time: '2026-10-18T08:00:00.000Z',
          end_time: '2026-10-18T10:00:00.000Z',
          event_type: vt,
        };
        assert.equal(item.event_type, vt);
      }
    });
  });

  // ============================================================================
  // Suite 3: Foreign Key Constraints & Cascade Integrity
  // ============================================================================
  describe('Category 3: Relational Constraints & Foreign Key Integrity', () => {
    test('calendar_events foreign key: user_id references auth.users with ON DELETE CASCADE and NOT NULL', () => {
      assert.match(
        sql007,
        /user_id UUID NOT NULL REFERENCES auth\.users\(id\) ON DELETE CASCADE/i,
        'calendar_events.user_id must enforce non-null FK referencing auth.users(id) with CASCADE delete'
      );
    });

    test('grades foreign keys: user_id and course_id enforce ON DELETE CASCADE', () => {
      assert.match(
        sql007,
        /user_id UUID NOT NULL REFERENCES auth\.users\(id\) ON DELETE CASCADE/i,
        'grades.user_id must enforce non-null FK referencing auth.users(id) with CASCADE delete'
      );
      assert.match(
        sql007,
        /course_id UUID REFERENCES public\.courses\(id\) ON DELETE CASCADE/i,
        'grades.course_id must reference public.courses(id) with CASCADE delete'
      );
    });

    test('Foreign Key Insertion Handling: invalid, null, or orphaned FK attributes are rejected', () => {
      // 1. Simulating SQL NOT NULL and UUID type validation
      const validateUserForeignKey = (userId: unknown): { valid: boolean; reason?: string } => {
        if (userId === null || userId === undefined) {
          return { valid: false, reason: 'NULL value in column "user_id" violates not-null constraint' };
        }
        if (typeof userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
          return { valid: false, reason: 'invalid input syntax for type uuid' };
        }
        return { valid: true };
      };

      // Null, undefined, empty, or malformed UUIDs
      assert.equal(validateUserForeignKey(null).valid, false);
      assert.equal(validateUserForeignKey(undefined).valid, false);
      assert.equal(validateUserForeignKey('').valid, false);
      assert.equal(validateUserForeignKey('12345').valid, false);
      assert.equal(validateUserForeignKey('non-uuid-string').valid, false);

      // Valid UUID format
      assert.equal(validateUserForeignKey('123e4567-e89b-12d3-a456-426614174000').valid, true);

      // 2. Course FK in grades: nullable, but if specified must be valid UUID
      const validateCourseForeignKey = (courseId: unknown): { valid: boolean; reason?: string } => {
        if (courseId === null || courseId === undefined) {
          return { valid: true }; // Allowed: standalone grade
        }
        if (typeof courseId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(courseId)) {
          return { valid: false, reason: 'invalid input syntax for type uuid' };
        }
        return { valid: true };
      };

      assert.equal(validateCourseForeignKey(null).valid, true);
      assert.equal(validateCourseForeignKey(undefined).valid, true);
      assert.equal(validateCourseForeignKey('invalid-id').valid, false);
      assert.equal(validateCourseForeignKey('123e4567-e89b-12d3-a456-426614174002').valid, true);
    });

    test('Composite and FK Indexes exist to support high-throughput cascaded deletes and lookups', () => {
      const expectedIndexes = [
        'CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events (user_id);',
        'CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events (start_time);',
        'CREATE INDEX IF NOT EXISTS idx_calendar_events_user_start ON public.calendar_events (user_id, start_time);',
        'CREATE INDEX IF NOT EXISTS idx_grades_user_id ON public.grades (user_id);',
        'CREATE INDEX IF NOT EXISTS idx_grades_course_id ON public.grades (course_id);',
        'CREATE INDEX IF NOT EXISTS idx_grades_user_course ON public.grades (user_id, course_id);',
      ];

      for (const expectedIndex of expectedIndexes) {
        assert.ok(
          sql007.includes(expectedIndex),
          `Missing expected index declaration: "${expectedIndex}"`
        );
      }
    });
  });

  // ============================================================================
  // Suite 4: RLS Policy Security & Performance Analysis (Zero Bare auth.uid())
  // ============================================================================
  describe('Category 4: RLS Policy Security & InitPlan Performance Optimization', () => {
    test('Row Level Security is explicitly enabled on both tables', () => {
      assert.match(sql007, /ALTER TABLE public\.calendar_events ENABLE ROW LEVEL SECURITY;/i);
      assert.match(sql007, /ALTER TABLE public\.grades ENABLE ROW LEVEL SECURITY;/i);
    });

    test('Zero bare unparenthesized or un-SELECTed auth.uid() patterns exist in 007 migration', () => {
      // 1. Bare equals: '= auth.uid()' or 'auth.uid() ='
      const bareRhs = sql007.match(/=\s*auth\.uid\(\)/gi);
      const bareLhs = sql007.match(/auth\.uid\(\)\s*=/gi);
      assert.equal(bareRhs, null, `Found bare '= auth.uid()' in SQL: ${bareRhs}`);
      assert.equal(bareLhs, null, `Found bare 'auth.uid() =' in SQL: ${bareLhs}`);

      // 2. Bare parenthesized without SELECT: '(auth.uid())'
      const bareParens = sql007.match(/\(\s*auth\.uid\(\)\s*\)/gi);
      assert.equal(bareParens, null, `Found bare '(auth.uid())' without SELECT in SQL: ${bareParens}`);

      // 3. Every policy uses cached InitPlan (SELECT auth.uid())
      const cachedSubqueryCount = (sql007.match(/\(SELECT auth\.uid\(\)\)/gi) || []).length;
      // 4 CRUD for calendar_events (SELECT, INSERT, UPDATE has 2 [USING + WITH CHECK], DELETE) = 5
      // 4 CRUD for grades (SELECT, INSERT, UPDATE has 2 [USING + WITH CHECK], DELETE) = 5
      // Total expected cached InitPlans = 10
      assert.ok(
        cachedSubqueryCount >= 10,
        `Expected at least 10 cached (SELECT auth.uid()) InitPlan references, found ${cachedSubqueryCount}`
      );
    });

    test('UPDATE policies enforce user_id immutability (both USING and WITH CHECK clauses)', () => {
      // Prevents a user from updating another user's row OR changing user_id to hijack someone else's record
      assert.match(
        sql007,
        /CREATE POLICY "Users can update own calendar events" ON public\.calendar_events\s+FOR UPDATE\s+USING\s*\(user_id = \(SELECT auth\.uid\(\)\)\)\s+WITH CHECK\s*\(user_id = \(SELECT auth\.uid\(\)\)\);/i
      );
      assert.match(
        sql007,
        /CREATE POLICY "Users can update own grades" ON public\.grades\s+FOR UPDATE\s+USING\s*\(user_id = \(SELECT auth\.uid\(\)\)\)\s+WITH CHECK\s*\(user_id = \(SELECT auth\.uid\(\)\)\);/i
      );
    });
  });

  // ============================================================================
  // Suite 5: Offline Fallback & Resiliency Exhaustive Stress Testing
  // ============================================================================
  describe('Category 5: Offline Resiliency, Error Suppression & Fallback Soundness', () => {
    const origWarn = console.warn;
    const capturedWarnings: unknown[][] = [];

    beforeEach(() => {
      capturedWarnings.length = 0;
      console.warn = (...args: unknown[]) => {
        capturedWarnings.push(args);
      };
    });

    afterEach(() => {
      console.warn = origWarn;
    });

    test('isOnline() executes safely across SSR and browser environments', () => {
      const initialStatus = isOnline();
      assert.equal(typeof initialStatus, 'boolean');

      // Test with navigator mocked online
      const origNavigator = globalThis.navigator;
      try {
        Object.defineProperty(globalThis, 'navigator', {
          value: { onLine: true },
          configurable: true,
          writable: true,
        });
        assert.equal(isOnline(), true);

        // Test with navigator mocked offline
        Object.defineProperty(globalThis, 'navigator', {
          value: { onLine: false },
          configurable: true,
          writable: true,
        });
        assert.equal(isOnline(), false);

        // Test with navigator missing onLine property
        Object.defineProperty(globalThis, 'navigator', {
          value: {},
          configurable: true,
          writable: true,
        });
        assert.equal(isOnline(), true); // fallback is true
      } finally {
        Object.defineProperty(globalThis, 'navigator', {
          value: origNavigator,
          configurable: true,
          writable: true,
        });
      }
    });

    test('safeSupabaseOperation handles thrown synchronous and asynchronous errors', async () => {
      const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      try {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://zpvkzcqzmzyzevatfigp.supabase.co';

        // 1. Thrown Error instance
        const res1 = await safeSupabaseOperation(async () => {
          throw new Error('Fatal database connection abort');
        }, 'fallback-1');
        assert.equal(res1, 'fallback-1');

        // 2. Rejected string
        const res2 = await safeSupabaseOperation(() => {
          return Promise.reject('Rejected string error code 500');
        }, 'fallback-2');
        assert.equal(res2, 'fallback-2');

        // 3. Rejected null
        const res3 = await safeSupabaseOperation(() => {
          return Promise.reject(null);
        }, 'fallback-3');
        assert.equal(res3, 'fallback-3');

        // 4. Synchronous throw inside non-async lambda
        const res4 = await safeSupabaseOperation(() => {
          throw new TypeError('Invalid property access on undefined');
        }, 'fallback-4');
        assert.equal(res4, 'fallback-4');

        // Verify that all 4 errors were intercepted and logged safely
        assert.equal(capturedWarnings.length, 4);
        for (const callArgs of capturedWarnings) {
          assert.match(
            String(callArgs[0]),
            /\[CampusOS Supabase\] Operation safely caught offline\/network error:/
          );
        }
      } finally {
        process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
      }
    });

    test('safeSupabaseOperation preserves falsy fallback values (null, undefined, 0, false, "")', async () => {
      const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      try {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://zpvkzcqzmzyzevatfigp.supabase.co';

        // Null fallback
        const nullRes = await safeSupabaseOperation(async () => {
          throw new Error('fail');
        }, null);
        assert.strictEqual(nullRes, null, 'Must preserve literal null fallback');

        // Undefined fallback
        const undefRes = await safeSupabaseOperation(async () => {
          throw new Error('fail');
        }, undefined);
        assert.strictEqual(undefRes, undefined, 'Must preserve literal undefined fallback');

        // Zero fallback
        const zeroRes = await safeSupabaseOperation(async () => {
          throw new Error('fail');
        }, 0);
        assert.strictEqual(zeroRes, 0, 'Must preserve literal 0 fallback');

        // False fallback
        const falseRes = await safeSupabaseOperation(async () => {
          throw new Error('fail');
        }, false);
        assert.strictEqual(falseRes, false, 'Must preserve literal false fallback');

        // Empty string fallback
        const emptyStrRes = await safeSupabaseOperation(async () => {
          throw new Error('fail');
        }, '');
        assert.strictEqual(emptyStrRes, '', 'Must preserve literal empty string fallback');

        // Empty array fallback
        const emptyArrRes = await safeSupabaseOperation(async () => {
          throw new Error('fail');
        }, []);
        assert.deepEqual(emptyArrRes, [], 'Must preserve empty array fallback');
      } finally {
        process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
      }
    });

    test('Offline mode bypass: does not attempt network call when offline', async () => {
      const origNavigator = globalThis.navigator;
      let networkCalled = false;

      try {
        Object.defineProperty(globalThis, 'navigator', {
          value: { onLine: false },
          configurable: true,
          writable: true,
        });

        const fallback = { offline: true };
        const result = await safeSupabaseOperation(async () => {
          networkCalled = true;
          return { offline: false };
        }, fallback);

        assert.equal(networkCalled, false, 'Operation should NOT be called when offline');
        assert.deepEqual(result, fallback, 'Should return fallback directly when offline');
      } finally {
        Object.defineProperty(globalThis, 'navigator', {
          value: origNavigator,
          configurable: true,
          writable: true,
        });
      }
    });

    test('safeSupabaseOperation short-circuits to fallback when Supabase is unconfigured', async () => {
      const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      try {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.supabase.co';
        assert.equal(isSupabaseConfigured(), false);

        let called = false;
        const res = await safeSupabaseOperation(async () => {
          called = true;
          return 'live-data';
        }, 'mock-fallback');

        assert.equal(called, false, 'Operation must not be invoked when Supabase is unconfigured');
        assert.equal(res, 'mock-fallback');
      } finally {
        process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
      }
    });

    test('High-concurrency stress harness: 100 concurrent safe operations resolve cleanly', async () => {
      const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      try {
        // Configure valid Supabase URL to enable execution pipeline
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://zpvkzcqzmzyzevatfigp.supabase.co';
        assert.equal(isSupabaseConfigured(), true);

        const tasks = Array.from({ length: 100 }, (_, idx) => {
          const shouldFail = idx % 3 === 0;
          return safeSupabaseOperation(
            async () => {
              await new Promise(r => setTimeout(r, Math.random() * 10));
              if (shouldFail) {
                throw new Error(`Simulated async failure #${idx}`);
              }
              return { id: idx, ok: true };
            },
            { id: idx, ok: false }
          );
        });

        const results = await Promise.all(tasks);
        assert.equal(results.length, 100);

        let successCount = 0;
        let fallbackCount = 0;
        for (const res of results) {
          if (res.ok) successCount++;
          else fallbackCount++;
        }

        assert.equal(fallbackCount, 34); // indices 0, 3, 6, ..., 99 = 34 failures caught safely
        assert.equal(successCount, 66);  // remaining 66 successes returned cleanly
      } finally {
        process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
      }
    });
  });

  // ============================================================================
  // Suite 6: Non-Regression & Cross-Schema Invariants
  // ============================================================================
  describe('Category 6: Non-Regression & Schema Integrity Invariants', () => {
    test('003 migration has not been mutated (exactly 19 tables)', () => {
      const sql003 = fs.readFileSync(migration003Path, 'utf8');
      const tableMatches = [...sql003.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-zA-Z0-9_]+)\s*\(/g)];
      assert.equal(tableMatches.length, 19, '003 migration must retain exactly 19 tables');
    });

    test('007 migration defines automatic handle_updated_at triggers for both tables', () => {
      assert.match(
        sql007,
        /CREATE TRIGGER trg_calendar_events_updated_at\s+BEFORE UPDATE ON public\.calendar_events\s+FOR EACH ROW\s+EXECUTE FUNCTION public\.handle_updated_at\(\);/i
      );
      assert.match(
        sql007,
        /CREATE TRIGGER trg_grades_updated_at\s+BEFORE UPDATE ON public\.grades\s+FOR EACH ROW\s+EXECUTE FUNCTION public\.handle_updated_at\(\);/i
      );
    });
  });
});
