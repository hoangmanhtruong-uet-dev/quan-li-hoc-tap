# Handoff Report: Supabase Migrations, Sync Engine, and Test Infrastructure Survey

- **Agent**: explorer_2
- **Milestone**: M1_SURVEY
- **Date**: 2026-10-17
- **Target Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_2`

---

## 1. Observation

### 1.1 Supabase Database Migrations Location & Schemas
- **Directory Path Discrepancy**:
  The dispatch requested inspecting `web/supabase/migrations/`, but this directory does not exist (`search directory d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\supabase\migrations does not exist`).
  The actual migration directory is located at the root: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\supabase\migrations/`.
  This is confirmed by `web/tests/challenger-m1-schema-sql.test.ts:7-8`:
  ```ts
  const rootDir = path.resolve(process.cwd(), '..');
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '003_complete_campusos_schema.sql');
  ```
- **Files Present in `supabase/migrations/`**:
  1. `001_pomodoro_schema.sql` (6,669 bytes)
  2. `002_dashboard_calendar_sync.sql` (3,860 bytes)
  3. `003_complete_campusos_schema.sql` (39,242 bytes)
  4. Also companion `supabase/seed.sql` (4,654 bytes)

- **Schema for `profiles`**:
  Defined in `supabase/migrations/003_complete_campusos_schema.sql` lines 16–48:
  ```sql
  CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    student_id TEXT,
    school TEXT DEFAULT 'Đại học Quốc gia TP.HCM',
    major TEXT DEFAULT 'Khoa học Máy tính',
    academic_year TEXT DEFAULT 'K2023',
    bio TEXT,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'PLATFORM_ADMIN')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned')),
    email_verified BOOLEAN NOT NULL DEFAULT false,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    rank_title TEXT NOT NULL DEFAULT 'Tân sinh viên ngơ ngác',
    streak INTEGER NOT NULL DEFAULT 1,
    streak_freezes INTEGER NOT NULL DEFAULT 1,
    study_minutes_total INTEGER NOT NULL DEFAULT 0,
    weekly_goal_minutes INTEGER NOT NULL DEFAULT 720,
    weekly_study_minutes INTEGER NOT NULL DEFAULT 0,
    last_study_date TEXT,
    daily_mood TEXT,
    vibe_theme TEXT NOT NULL DEFAULT 'aurora' CHECK (vibe_theme IN ('aurora', 'y2k', 'cyber', 'pastel')),
    reduced_motion BOOLEAN NOT NULL DEFAULT false,
    gpa NUMERIC(3,2) DEFAULT 0.0,
    badges JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```
  *Key Finding*: The `profiles` table has `xp`, `level`, `rank_title`, and `streak`, but **does NOT have a `violation_count` column**.

- **Schema for `student_focus_sessions`**:
  Defined in `supabase/migrations/002_dashboard_calendar_sync.sql` lines 59–68:
  ```sql
  CREATE TABLE IF NOT EXISTS public.student_focus_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL DEFAULT 'default_student',
    focus_minutes INT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'extreme_cat',
    discipline_score INT NOT NULL DEFAULT 100,
    shame_count INT NOT NULL DEFAULT 0,
    xp_gained INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```
  *Key Finding*: `student_focus_sessions` has `shame_count`, `discipline_score`, and `xp_gained`, but **does NOT have a dedicated `violation_count` column**, nor was it updated in `003_complete_campusos_schema.sql`.

- **Row Level Security (RLS) Policies**:
  - `student_focus_sessions` (`002_dashboard_calendar_sync.sql:88–89`):
    ```sql
    ALTER TABLE public.student_focus_sessions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Cho phép đọc focus_sessions" ON public.student_focus_sessions FOR SELECT USING (true);
    CREATE POLICY "Cho phép ghi focus_sessions" ON public.student_focus_sessions FOR ALL USING (true);
    ```
  - `profiles` (`003_complete_campusos_schema.sql:588–604`):
    - SELECT allows public view: `USING (true)`.
    - INSERT / UPDATE / DELETE restricted to owner: `USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()))`.
  - Helper functions in `003_complete_campusos_schema.sql` (lines 51–102 and 466–561):
    - `public.handle_new_user()` (SECURITY DEFINER, auto-populates `profiles` on `auth.users` insert).
    - `public.is_workspace_member()`, `public.is_workspace_admin()`, `public.is_club_member()`, `public.is_club_admin()`, `public.is_dorm_member()`, `public.is_dorm_admin()` all use `SECURITY DEFINER` with `SET search_path = ''`.

---

### 1.2 Supabase Client, Sync Engine & API Routes
- **Supabase Client (`web/src/lib/supabase.ts`)**:
  - Initializes `supabase = createClient(supabaseUrl, supabaseAnonKey)`.
  - `isSupabaseConfigured()` checks if `NEXT_PUBLIC_SUPABASE_URL` is set and does not contain `'mock-supabase'`.

- **Sync Engine (`web/src/lib/supabase-sync.ts`)**:
  - Provides `taskToRow` and `rowToTask` bidirectional transforms.
  - Implements offline queue with `enqueueOfflineMutation`, `getOfflineQueue`, `flushOfflineQueue`.
  - Echo loop guard via `trackLocalMutation` and `isEchoEvent`.
  - Focus session logging at lines 692–714:
    ```ts
    export async function logFocusSessionToSupabase(session: {
      focusMinutes: number;
      mode: string;
      disciplineScore: number;
      shameCount: number;
      xpGained: number;
    }): Promise<void> {
      if (typeof window === 'undefined') return;
      try {
        await supabase.from('student_focus_sessions').insert({
          user_id: DEFAULT_USER_ID,
          focus_minutes: session.focusMinutes,
          mode: session.mode,
          discipline_score: session.disciplineScore,
          shame_count: session.shameCount,
          xp_gained: session.xpGained,
          completed_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[Supabase Sync] Log focus session skipped:', err);
      }
    }
    ```
  - *Key Finding*: There is **no violation logging function** or **penalty deduction function** currently in `supabase-sync.ts`.

- **Shared Gamification Store (`web/src/lib/campus-store.ts`)**:
  - In `recordCompletedSession` (lines 860–922), XP is only added:
    ```ts
    const sessionReward = calculateSessionXp(minutes, disciplineScore);
    const xpGained = sessionReward.totalXp;
    const prev = getSharedState();
    const nextXp = prev.xp + xpGained;
    const { level, rankTitle } = calculateLevelAndRank(nextXp);
    ```
  - Recalculation logic in `web/src/lib/gamification.ts:132-147` (`calculateLevelAndRank(xp)`) clamps `safeXp = Math.max(0, Math.floor(xp))` and accurately evaluates level and rank title even when XP decreases.
  - *Key Finding*: Currently, `campus-store.ts` lacks an explicit `applyPenalty(xpPenalty: number)` or `recordViolation(violation: FocusViolation)` action.

- **Supervisor Arbiter (`web/src/features/pomodoro/supervisor-arbiter.ts`)**:
  - Implements `SupervisorArbiter` with cooldown management, `requestExemption(120)` ("Tôi đang tra tài liệu"), `canRoast()`, `registerRoast()`, and `calculateDisciplineScore(actual, target)`.
  - Each roast deducts 5 discipline points: `const penalty = this.state.roastCount * 5;`.
  - *Key Finding*: `SupervisorArbiter` is already integrated into `strict-pomodoro-modal.tsx` and covered by `tests/supervisor-arbiter.test.ts`. It provides the exact logic needed for the extension bridge's grace period and roast throttling.

- **API Routes (`web/src/app/api/`)**:
  - Existing routes: `auth/*`, `coach`, `health`, `onboarding`, `tts`, `workspaces/*`.
  - *Key Finding*: There is **no API route** for handling violation sync or extension callbacks (e.g. `POST /api/focus/violation`).

- **Chrome Extension Status (`extension/`)**:
  - `extension/manifest.json`: Currently only has `"permissions": ["storage"]`. Missing `"tabs"`, `"activeTab"`, `"scripting"`, `"declarativeNetRequest"`, and `"externally_connectable"`.
  - `extension/content.js`: Early standalone prototype with fixed scold quotes and local DOM overlay. Missing 2-way postMessage/runtime bridge, 200ms lockout, tab closing, and Supabase violation reporting.
  - Background service worker `background.js` and `popup/` are currently not created.

---

### 1.3 Test Infrastructure & Coverage
- **Scripts in `web/package.json`**:
  ```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "node --experimental-strip-types --test tests/*.test.ts"
  }
  ```
- **Test Runner**:
  - Built-in Node.js 20+ test runner (`node:test`, `node:assert/strict`) with `--experimental-strip-types`.
  - No Vitest, Jest, or Babel dependencies needed.
- **Current Test Run Execution**:
  - `npm test`: Exited with code 0.
  - Test summary:
    - **380 tests passed, 0 failed, 0 skipped** across 27 test files.
    - Total duration: ~2.69s.
- **Typecheck & Build**:
  - `npm run typecheck`: Passed cleanly with 0 TypeScript errors.
  - `npm run build`: Compiled 33 static pages successfully with 0 errors.

---

## 2. Logic Chain

1. **Schema Extension Requirement**:
   - The user specification mandates:
     *"Khi Extension phát hiện vi phạm: Trừ ngay -50 XP, tăng số lần vi phạm violation_count, và ghi nhận trực tiếp vào bảng student_focus_sessions và profiles trên Supabase Cloud."*
   - Observation 1.1 reveals neither `profiles` nor `student_focus_sessions` contains a `violation_count` column.
   - Therefore, a new Supabase migration (`supabase/migrations/004_extension_focus_violations.sql`) must be added to:
     - `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS violation_count INTEGER NOT NULL DEFAULT 0;`
     - `ALTER TABLE public.student_focus_sessions ADD COLUMN IF NOT EXISTS violation_count INTEGER NOT NULL DEFAULT 0;`
     - (Optionally for fallback sync) `ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS violation_count INTEGER NOT NULL DEFAULT 0;`
     - Update `web/src/types/database.ts` accordingly so TypeScript types match SQL definitions.

2. **XP Deduction & Sync Flow**:
   - Observation 1.2 shows `calculateLevelAndRank(xp)` in `gamification.ts` handles downwards XP adjustments cleanly with `Math.max(0, xp)`.
   - In `campus-store.ts`, an `applyFocusViolation({ penaltyXp = 50, reason = 'blacklist_url' })` method must:
     1. Decrement state XP: `nextXp = Math.max(0, prev.xp - penaltyXp)`.
     2. Recalculate level and rank: `const { level, rankTitle } = calculateLevelAndRank(nextXp);`.
     3. Increment `violationCount`: `state.violationCount = (state.violationCount || 0) + 1`.
     4. Call `recordFocusViolationToSupabase({ penaltyXp, violationCount, reason })`.
     5. Dispatch update and push to Supabase Cloud via optimistic sync / offline queue.

3. **Two-Way Extension Bridge Architecture**:
   - For the Extension (`extension/`) to communicate with the Web App:
     - `extension/manifest.json` needs:
       - Permissions: `["tabs", "storage", "activeTab", "scripting", "declarativeNetRequest"]`.
       - `externally_connectable`: `{"matches": ["http://localhost:3000/*", "https://*.campusos.edu.vn/*"]}`.
       - Background service worker: `"background": {"service_worker": "background.js"}`.
     - Web App bridge (`web/src/features/pomodoro/extension-bridge.ts`):
       - Listens for window/runtime messages (`CAMPUSOS_FOCUS_START`, `CAMPUSOS_FOCUS_STOP`, `CAMPUSOS_FOCUS_VIOLATION`).
       - On violation message, invokes `applyFocusViolation(50)` and logs to Supabase.
     - An HTTP endpoint `POST /api/focus/violation` provides a resilient fallback if the extension communicates directly with the backend.

4. **Test Infrastructure Alignment**:
   - Observation 1.3 confirms all tests use Node test runner format: `import test from 'node:test'; import assert from 'node:assert/strict';`.
   - All tests run via glob `tests/*.test.ts`.
   - To verify the new functionality without breaking existing tests, 4 dedicated test suites must be created following this exact pattern.

---

## 3. Caveats

1. **Migration Execution**:
   - Local investigation cannot execute live PostgreSQL migrations against remote Supabase Cloud without active network credentials. Migration files must be syntactically valid PostgreSQL DDL and verified empirically via regex/schema parser tests (`tests/challenger-m1-schema-sql.test.ts`).
2. **Chrome Extension Environment**:
   - Node.js test runner cannot natively invoke `chrome.tabs` or `chrome.runtime`. Tests for the extension bridge, blacklist matcher, and background service worker must use mock chrome runtime objects or abstracted pure functions.
3. **User Authentication Context**:
   - In offline/demo mode, `DEFAULT_USER_ID = 'default_student'` is used by `supabase-sync.ts`. In authenticated mode, `auth.uid()` from Supabase Auth is used. Both cases must be supported seamlessly.

---

## 4. Conclusion

The repository is healthy, with 380/380 tests passing, 0 TypeScript errors, and successful Next.js builds.

### Concrete Action Items for Implementation:
1. **Migration (`supabase/migrations/004_extension_focus_violations.sql`)**:
   - Add `violation_count` and `penalties_xp` columns to `profiles`, `student_profiles`, and `student_focus_sessions`.
   - Update `web/src/types/database.ts` to keep TypeScript contracts in sync.
2. **Sync Engine & Store (`web/src/lib/` & `web/src/features/pomodoro/`)**:
   - Add `applyFocusViolation(penaltyXp = 50)` to `campus-store.ts`.
   - Add `recordFocusViolationToSupabase(...)` to `supabase-sync.ts` with offline mutation queue support.
   - Implement `web/src/features/pomodoro/extension-bridge.ts` to manage communication with the Chrome Extension.
   - Implement `POST /api/focus/violation` route in `web/src/app/api/focus/violation/route.ts`.
3. **Chrome Extension (`extension/`)**:
   - Upgrade `manifest.json` to Manifest V3 with permissions, `externally_connectable`, and `background.js`.
   - Implement `background.js` (tab listener, blacklist check, heartbeat sync).
   - Upgrade `content.js` with Cyber-Glass lockout HUD (<200ms blur, 5s countdown, audio roast, grace button "Tôi đang tra tài liệu").
   - Create `extension/popup/` for countdown and custom blacklist management.
4. **New Unit Tests in `web/tests/`**:
   - `extension-bridge.test.ts`: Protocol validation, message schemas, origin checks.
   - `blacklist-matcher.test.ts`: URL patterns, subdomains, wildcards, exemption cooldown.
   - `xp-penalty.test.ts`: -50 XP deduction, 0 XP floor clamp, level demotion/rank recalculation, violation counter.
   - `focus-violation-sync.test.ts`: Supabase session mapping, offline queue mutation fallback, schema compliance.

---

## 5. Verification Method

To independently verify the codebase and any proposed changes:

1. **Run Full Test Suite**:
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm test
   ```
   *Expected*: Passes all 380 existing tests + new unit tests with 0 failures.

2. **Run TypeScript Check**:
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run typecheck
   ```
   *Expected*: Code exits with status code 0 and 0 type errors.

3. **Run Production Build**:
   ```powershell
   cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
   npm run build
   ```
   *Expected*: Next.js App Router successfully compiles all 33+ static/dynamic routes.

4. **Verify Manifest V3 Syntax**:
   Inspect `extension/manifest.json` ensuring valid JSON, `manifest_version: 3`, and valid permissions.

5. **Invalidation Conditions**:
   - Any test failure in `npm test`.
   - TypeScript error caused by schema discrepancies between `database.ts` and migrations.
   - Negative XP values occurring on penalty (`xp < 0`).
