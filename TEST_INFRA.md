# Test Infrastructure & Runner Architecture

## Overview
This document specifies the test execution environment, test runner architecture, suite layout, and invocation commands for the CampusOS /tasks page rebuild project and all related modules.

## Test Runner Architecture
- **Engine**: Node.js native test runner (`node:test`, `node:assert/strict`) with TypeScript type stripping support (`--experimental-strip-types`).
- **Zero Extra Dependencies**: Relies purely on Node's native runner without heavy test orchestrator overhead, ensuring fast execution (< 400ms for 73+ tests).
- **Execution Mode**: ESM module loading with explicit `.ts` relative imports.

## Directory & File Layout
```
web/
├── tests/
│   ├── tasks-redesign.test.ts        # 40 tests: 4 tiers for Tasks NLP, Eisenhower, Date Groups, Store
│   ├── campus-redesign.test.ts       # 14 tests: Gamification, Calendar load score, Conflicts, ICS, NLP
│   ├── challenger-m1-2-stress.test.ts # 10 tests: Empirical Stress & Boundary tests
│   ├── supervisor-arbiter.test.ts    # 3 tests: Fat Orange Cat discipline arbitration
│   └── workspace-permissions.test.ts # 6 tests: RBAC workspace permissions
└── package.json                      # "test": "node --experimental-strip-types --test tests/*.test.ts"
```

## Running Tests

### 1. Execute All Test Suites
Run the entire test suite across the application:
```bash
cd web
npm test
```
*Current suite status: 73 passed, 0 failed, duration ~365ms.*

### 2. Execute Tasks Redesign Tests Only
To run only the newly created comprehensive 4-tier /tasks test suite:
```bash
cd web
node --experimental-strip-types --test tests/tasks-redesign.test.ts
```
*Tasks suite status: 40 passed, 0 failed, duration ~260ms.*

### 3. Run Static Type Checking
```bash
cd web
npm run typecheck
```
*TypeScript status: 0 errors.*

## Test Suite Tier Design (`tests/tasks-redesign.test.ts`)
The 40 tests are organized into 4 systematic tiers:

| Tier | Focus Area | Test Count | Key Scenarios Covered |
|---|---|---|---|
| **Tier 1** | Feature Coverage | 25 tests | NLP parser (6), Eisenhower matrix (6), Date grouping & Urgency (6), Reactive store actions (7) |
| **Tier 2** | Boundary & Corner Cases | 6 tests | Empty/punctuation input, extreme durations (0m to 12h), midnight/noon boundaries, 48h Eisenhower boundary, leap year & month rollover, special characters/emojis |
| **Tier 3** | Cross-Feature Combinations | 3 tests | NLP -> Eisenhower -> Date Grouping pipeline, Full task lifecycle with subtask checklist, Batch quadrant partitioning and bulk priority updates |
| **Tier 4** | Real-World Workload Scenarios | 6 tests | Vietnamese student homework/exam/lab prompts, Subtask progress bar math, "Clear the Board" streak bonus (+50 XP), Multi-criteria sorting |

## Environment Requirements
- Node.js >= 22.0.0 (supports `--experimental-strip-types`)
- Windows / Linux / macOS compatible
- Offline-first: Tests do not require network access, Supabase live credentials, or browser DOM.
