import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Milestone 1 Empirical Challenger - TypeScript Contracts (database.ts vs 003_complete_campusos_schema.sql)', () => {
  const rootDir = path.resolve(process.cwd(), '..');
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '003_complete_campusos_schema.sql');
  const databaseTsPath = path.resolve(process.cwd(), 'src', 'types', 'database.ts');

  test('Target files exist and are non-empty', () => {
    assert.ok(fs.existsSync(migrationPath), `Migration file must exist at ${migrationPath}`);
    assert.ok(fs.existsSync(databaseTsPath), `TypeScript definitions file must exist at ${databaseTsPath}`);
    const tsStat = fs.statSync(databaseTsPath);
    assert.ok(tsStat.size > 20000, `database.ts should be substantial (>20KB), got ${tsStat.size} bytes`);
  });

  const sqlContent = fs.readFileSync(migrationPath, 'utf8');
  const tsContent = fs.readFileSync(databaseTsPath, 'utf8');

  // Extract all SQL tables and columns
  const tableRegex = /CREATE TABLE IF NOT EXISTS public\.(\w+)\s*\(([\s\S]*?)\n\);/g;
  let match;
  const sqlTables: Record<string, Record<string, { rawDef: string; isNotNull: boolean; hasDefault: boolean }>> = {};

  while ((match = tableRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const body = match[2];

    const colDefs: string[] = [];
    let current = '';
    let parenDepth = 0;
    for (let i = 0; i < body.length; i++) {
      const ch = body[i];
      if (ch === '(') parenDepth++;
      else if (ch === ')') parenDepth--;

      if (ch === ',' && parenDepth === 0) {
        colDefs.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim()) colDefs.push(current.trim());

    const columns: Record<string, { rawDef: string; isNotNull: boolean; hasDefault: boolean }> = {};
    for (const rawLine of colDefs) {
      const line = rawLine.replace(/\s+/g, ' ').trim();
      if (!line || line.startsWith('--') || line.startsWith('CONSTRAINT') || line.startsWith('PRIMARY KEY') || line.startsWith('UNIQUE')) continue;

      const parts = line.split(' ');
      const colName = parts[0];
      const colDef = parts.slice(1).join(' ');

      const isNotNull = /\bNOT NULL\b/i.test(colDef) || /\bPRIMARY KEY\b/i.test(colDef);
      const hasDefault = /\bDEFAULT\b/i.test(colDef) || /\bgen_random_uuid\(\)/i.test(colDef);

      columns[colName] = {
        rawDef: colDef,
        isNotNull,
        hasDefault,
      };
    }
    sqlTables[tableName] = columns;
  }

  // Parse TS Tables
  const tablesBlockMatch = tsContent.match(/Tables:\s*\{([\s\S]*?)\n\s*\}\s*;\s*\n\s*Views:/);
  assert.ok(tablesBlockMatch, 'Could not find Tables block in database.ts');
  const tablesContent = tablesBlockMatch[1];
  const tsTableRegex = /(\w+):\s*\{\s*Row:\s*\{([\s\S]*?)\};\s*Insert:\s*\{([\s\S]*?)\};\s*Update:\s*\{([\s\S]*?)\};/g;

  const tsTables: Record<
    string,
    {
      row: Record<string, { optional: boolean; type: string }>;
      insert: Record<string, { optional: boolean; type: string }>;
      update: Record<string, { optional: boolean; type: string }>;
    }
  > = {};

  while ((match = tsTableRegex.exec(tablesContent)) !== null) {
    const tableName = match[1];
    const rowContent = match[2];
    const insertContent = match[3];
    const updateContent = match[4];

    const parseFields = (content: string) => {
      const fields: Record<string, { optional: boolean; type: string }> = {};
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//')) continue;
        const fMatch = trimmed.match(/^(\w+)(\??):\s*([^;]+);/);
        if (fMatch) {
          fields[fMatch[1]] = {
            optional: fMatch[2] === '?',
            type: fMatch[3].trim(),
          };
        }
      }
      return fields;
    };

    tsTables[tableName] = {
      row: parseFields(rowContent),
      insert: parseFields(insertContent),
      update: parseFields(updateContent),
    };
  }

  test('All 19 SQL tables exist in Database["public"]["Tables"]', () => {
    const sqlTableNames = Object.keys(sqlTables);
    assert.equal(sqlTableNames.length, 19, `Expected 19 tables in SQL schema, found ${sqlTableNames.length}`);

    for (const tableName of sqlTableNames) {
      assert.ok(
        tsTables[tableName],
        `Table '${tableName}' from SQL schema 003 is missing in Database['public']['Tables'] in database.ts`
      );
    }
  });

  test('Every SQL column is represented in Row, Insert, and Update for all 19 tables', () => {
    for (const [tableName, sqlCols] of Object.entries(sqlTables)) {
      const tsTable = tsTables[tableName];
      assert.ok(tsTable, `Table ${tableName} missing in TS`);

      for (const colName of Object.keys(sqlCols)) {
        assert.ok(
          tsTable.row[colName],
          `Column '${tableName}.${colName}' missing in TS Row type`
        );
        assert.ok(
          tsTable.insert[colName],
          `Column '${tableName}.${colName}' missing in TS Insert type`
        );
        assert.ok(
          tsTable.update[colName],
          `Column '${tableName}.${colName}' missing in TS Update type`
        );
      }
    }
  });

  test('TS Update fields are strictly optional across all 19 tables', () => {
    for (const [tableName, tsTable] of Object.entries(tsTables)) {
      if (!sqlTables[tableName]) continue; // Skip legacy tables
      for (const [colName, fieldInfo] of Object.entries(tsTable.update)) {
        assert.ok(
          fieldInfo.optional,
          `Field '${tableName}.${colName}' in TS Update must be marked optional (?)`
        );
      }
    }
  });

  test('All 5 SECURITY DEFINER PostgreSQL helper functions exist in Database["public"]["Functions"]', () => {
    const requiredFunctions = [
      'is_workspace_member',
      'is_workspace_admin',
      'is_club_member',
      'is_club_admin',
      'is_dorm_member',
    ];

    for (const fn of requiredFunctions) {
      const fnRegex = new RegExp(`${fn}:\\s*\\{[\\s\\S]*?Returns:\\s*boolean;`, 'i');
      assert.match(
        tsContent,
        fnRegex,
        `Function '${fn}' must be defined in Database['public']['Functions'] returning boolean`
      );
    }
  });

  test('Exported entity aliases exist for all 19 domain tables', () => {
    const expectedAliases = [
      ['ProfileRow', 'ProfileInsert', 'ProfileUpdate'],
      ['TaskRow', 'TaskInsert', 'TaskUpdate'],
      ['CourseRow', 'CourseInsert', 'CourseUpdate'],
      ['CourseSyllabusRow', 'CourseSyllabusInsert', 'CourseSyllabusUpdate'],
      ['WorkspaceRow', 'WorkspaceInsert', 'WorkspaceUpdate'],
      ['WorkspaceMemberRow', 'WorkspaceMemberInsert', 'WorkspaceMemberUpdate'],
      ['WorkspaceKanbanTaskRow', 'WorkspaceKanbanTaskInsert', 'WorkspaceKanbanTaskUpdate'],
      ['WorkspaceDocumentRow', 'WorkspaceDocumentInsert', 'WorkspaceDocumentUpdate'],
      ['WorkspaceActivityRow', 'WorkspaceActivityInsert', 'WorkspaceActivityUpdate'],
      ['ClubRow', 'ClubInsert', 'ClubUpdate'],
      ['ClubMemberRow', 'ClubMemberInsert', 'ClubMemberUpdate'],
      ['ClubEventRow', 'ClubEventInsert', 'ClubEventUpdate'],
      ['ClubFinanceRow', 'ClubFinanceInsert', 'ClubFinanceUpdate'],
      ['ClubTaskRow', 'ClubTaskInsert', 'ClubTaskUpdate'],
      ['DormSpaceRow', 'DormSpaceInsert', 'DormSpaceUpdate'],
      ['DormMemberRow', 'DormMemberInsert', 'DormMemberUpdate'],
      ['DormChoreRow', 'DormChoreInsert', 'DormChoreUpdate'],
      ['DormExpenseRow', 'DormExpenseInsert', 'DormExpenseUpdate'],
      ['StudentNotificationRow', 'StudentNotificationInsert', 'StudentNotificationUpdate'],
    ];

    for (const [rowAlias, insertAlias, updateAlias] of expectedAliases) {
      assert.ok(
        tsContent.includes(`export type ${rowAlias} =`),
        `Type alias ${rowAlias} must be exported`
      );
      assert.ok(
        tsContent.includes(`export type ${insertAlias} =`),
        `Type alias ${insertAlias} must be exported`
      );
      assert.ok(
        tsContent.includes(`export type ${updateAlias} =`),
        `Type alias ${updateAlias} must be exported`
      );
    }
  });
});
