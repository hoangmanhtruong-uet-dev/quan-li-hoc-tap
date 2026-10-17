# CampusOS Testing Infrastructure (`TEST_INFRA.md`)

## 1. Overview & Architectural Principles

CampusOS utilizes the native Node.js Test Runner (`node:test` and `node:assert/strict`) leveraging Node's built-in TypeScript type stripping (`--experimental-strip-types`). This architecture achieves:
- **Instant Execution**: Over 500+ unit, integration, and mathematical tests execute in **< 3.5 seconds** without compilation overhead or Babel/esbuild bundling lag.
- **Zero Heavy Dependencies**: Eliminates bulky test frameworks (Jest, Mocha, Vitest) in `web/`, reducing `node_modules` weight and eliminating cross-package version conflicts.
- **Deterministic & Isolated**: Tests run in clean Node processes with isolated in-memory stores, mathematical mocks, and deterministic fixtures.
- **Strict Empirical Verification**: Assertions verify exact DDL migrations, PostgreSQL RLS policies, TypeScript database contracts, SNTP clock offsets, game theory mechanics, and WebGL memory disposal.

---

## 2. Test Runner Configuration

The test runner is configured directly in `web/package.json`:

```json
{
  "scripts": {
    "test": "node --experimental-strip-types --test tests/*.test.ts"
  }
}
```

### Execution Commands

| Target | Command | Description |
|---|---|---|
| **All Test Suites** | `npm test` (inside `web/`) | Runs all test suites in `web/tests/*.test.ts` |
| **Pomodoro Party Suite** | `node --experimental-strip-types --test tests/pomodoro-party.test.ts` | Runs the 7-suite Pomodoro Party real-time test suite |
| **Typecheck** | `npm run typecheck` (inside `web/`) | Validates TypeScript compiler with 0 errors (`tsc --noEmit`) |
| **Production Build** | `npm run build` (inside `web/`) | Compiles all static/dynamic Next.js routes with 0 errors |

---

## 3. Test Suite Catalog

The test infrastructure encompasses 35 distinct test suites covering frontend, backend, AI, gamification, and real-time multiplayer systems:

| # | Test File | Domain / Scope | Coverage Areas |
|---|---|---|---|
| 1 | `pomodoro-party.test.ts` | **Pomodoro Party Realtime** | DDL migration 006, DB types, NTP sync (<200ms), PIN/Room auth, Silent Focus, Deserter penalty, 3D memory safety |
| 2 | `campus-redesign.test.ts` | Core Engine & Gamification | XP progression, Streak/Freeze rules, Calendar load score, Conflicts, NLP calendar, ICS roundtrip |
| 3 | `tasks-redesign.test.ts` | Tasks & Eisenhower Matrix | Vietnamese NLP quickadd, 4 Eisenhower quadrants, date grouping, task lifecycle, Pomodoro drawer |
| 4 | `pomodoro-leo.test.ts` | 3D Mèo Leo Supervisor | Squash & stretch physics, jiggle spring dynamics, 3-point lighting, micro-saccades, TTS lip-sync |
| 5 | `quick-task-nlp-sync.test.ts` | Quick Task Modal | NLP multi-entity extraction, 4 priority tiers, 3D particle state, store synchronization |
| 6 | `supabase-sync-engine.test.ts` | Offline-First Sync Engine | Optimistic mutations, echo suppression, offline queue replay, custom event propagation |
| 7 | `challenger-m1-schema-sql.test.ts` | SQL Migration 003 Contracts | Master DDL validation, table column checks, RLS security policies, index naming conventions |
| 8 | `challenger-m1-database-types.test.ts` | Database TypeScript Types | Type fidelity between `003_complete_campusos_schema.sql` and `web/src/types/database.ts` |
| 9 | `extension-sync-penalty.test.ts` | Extension Violation Bridge | Two-way communication, URL blacklist detection, -50 XP penalty, lockout HUD triggers |
| 10 | `ai-webcam-tracking.test.ts` | AI Face Mesh & Posture | Head pose calculation, eye aspect ratio (EAR), distraction detection, alarm triggers |
| 11 | `workspace-engine.test.ts` | Workspace & Projects | RBAC permissions (OWNER, ADMIN, MANAGER, MEMBER, VIEWER), Kanban board, audit logs |
| 12 | `workspace-permissions.test.ts` | Workspace Security | Permission boundary enforcement, immutable owner protection, privilege escalation guards |
| 13 | `club-engine.test.ts` | Student Clubs Ecosystem | Club events, financial ledger balances, member directory, committee task delegation |
| 14 | `dorm-engine.test.ts` | Dormitory Management | Room chore rotation, roommate expense splitting, shared utility accounting |
| 15 | `profile-notifications-settings.test.ts` | Student Hub & Preferences | Holographic student ID, academic radar chart, notification tabs, Google Calendar sync |
| 16 | `ai-study-hub.test.ts` | AI Academic Hub | Syllabus summarization, automated quiz generation, course flashcards, PDF QA |
| 17 | `supabase-auth-profile.test.ts` | Auth & Session Security | Supabase auth integration, session tokens, user onboarding, automatic profile seeding |
| 18 | `supervisor-arbiter.test.ts` | Supervisor Discipline Rules | Mắng cooldown, "Tôi đang tra tài liệu" grace periods, discipline scores |
| 19 | ... (17 additional test suites) | Component & Unit Suites | Academic calculation, growth engines, coach heuristics, storage buckets |

---

## 4. Testing Conventions & Coding Standards

### 4.1 Native Assertions
Tests strictly use `node:test` and `node:assert/strict`:
```typescript
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('Suite Name', () => {
  test('descriptive behavior statement', () => {
    assert.strictEqual(actual, expected);
    assert.deepStrictEqual(actualObj, expectedObj);
    assert.match(str, /regex/);
    assert.ok(condition, 'diagnostic failure message');
  });
});
```

### 4.2 Verifiable Genuine Assertions (No Cheating / No Facades)
- **Zero Vacuous Tests**: Tests must never assert trivially true statements (`assert.ok(true)`).
- **Authoritative Expected Output**: Every assertion derives from mathematical proofs, PostgreSQL specification constraints, or documented architectural contracts in `PROJECT.md`.
- **Adversarial & Boundary Verification**: Every feature includes stress tests with:
  1. Boundary numbers (0, negative, extreme values, precision floats).
  2. Malformed strings (empty, whitespace, special characters, unicode, SQL meta-characters).
  3. Network jitter, out-of-order latency packets, and clock skew.

---

## 5. Isolation & Mocking Strategy

### 5.1 SNTP Clock Synchronization Mock
Network latency and client clock drift are deterministically modeled via high-precision timestamps ($T_0, T_1, T_2, T_3$), validating that:
$$\Delta = \frac{T_3 - T_0}{2}, \quad \Theta = T_{\text{server}} - (W_{\text{client}} + \Delta)$$
Tests verify that clients with $\pm 15,000\text{ms}$ clock skews converge to $\Delta < 200\text{ms}$ (typically identical second countdowns).

### 5.2 WebGL & Three.js Memory Safety Mock
Because headless Node.js environments lack a hardware WebGL context, Three.js scenes are validated using procedural scene graphs and explicit disposal spies:
- Verifying `geometry.dispose()` is called for all instantiated geometries.
- Verifying `material.dispose()` is called across all material instances.
- Verifying `renderer.dispose()` releases the WebGL state.
- Verifying event listeners and `requestAnimationFrame` IDs are cancelled on component unmount.

### 5.3 Offline-First Store & Fallback Mocking
Tests verify fallback pathways when Supabase Cloud is unreachable (`mock-supabase.supabase.co`):
- Local mock study rooms are generated with deterministic IDs and statuses.
- Local broadcast channels or memory event buses mirror real-time message routing.

---

## 6. Continuous Quality Gates

All pull requests and milestones must satisfy the three mandatory Quality Gates:
1. **Type Safety**: `npm run typecheck` exits with code 0 (0 errors).
2. **Test Suite**: `npm test` passes 100% of all test suites (525+ tests, 0 failures, 0 skipped).
3. **Build Integrity**: `npm run build` succeeds cleanly across all 35+ routes.
