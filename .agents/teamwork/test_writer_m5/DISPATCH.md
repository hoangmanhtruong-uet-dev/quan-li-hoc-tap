## 2026-10-17T07:26:41Z
You are test_writer_m5.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\test_writer_m5
Project Root: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap
Authoritative user request file: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md
Scope document: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
Test survey blueprint: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\survey_explorer_3\handoff.md

You MUST read ORIGINAL_REQUEST.md, PROJECT.md, and survey_explorer_3's handoff.md before starting work.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All test implementations must be genuine tests verifying real implementation logic. DO NOT hardcode trivial passes.

EXCLUSIVE WRITE OWNERSHIP (You may only create/modify this 1 file):
- web/tests/auth-redesign.test.ts

TASKS FOR MILESTONE M5 TEST WRITER:
Implement the comprehensive test suite web/tests/auth-redesign.test.ts using Node.js native test runner (`node:test` and `node:assert/strict`) covering the 6 suites outlined in survey_explorer_3's report:
1. Suite 1: Password Strength Calculation Logic (8 tests: empty/whitespace, short passwords, medium criteria, good criteria, strong 5/5 criteria including Demo@123456, unicode, color/label mappings, criteria breakdown flags).
2. Suite 2: Demo 1-Click Login Credentials & Auth (6 tests: DEMO_STUDENT_CREDENTIALS constant matching minh.nguyen@campus.edu.vn / Demo@123456, email validity, password strength tier strong, signInWithEmail mock resolution, mock session role, LoginPage demo button contract).
3. Suite 3: Student Email (.edu.vn) Strict Validation (8 tests: standard .edu.vn, case insensitivity, whitespace trimming, commercial domain rejection, missing .vn/.edu rejection, domain spoof rejection, malformed syntax rejection, boundary inputs).
4. Suite 4: 60-Second Cooldown Timer & Resend Logic (6 tests: initial state, immediate post-send, mid-cooldown, boundary expiration, post-cooldown, clock skew protection).
5. Suite 5: Split-Screen Layout & Three.js 3D Lifecycle Contracts (6+ tests: layout split-screen 50/50 contracts, 100vh containment, Auth3DShowcase Three.js import, geometry, spotlights, pointer event listener cleanup, strict memory disposal, prefers-reduced-motion fallback).
6. Suite 6: Feature Carousel & 5 Cyber-Glass Auth Pages Contracts (8+ tests: Superpower Trio carousel data, live stats 12,450+, auto-slide timer cleanup, LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage contracts and Cyber-Glass tokens).

Note on Node 22 runner: Node's `--experimental-strip-types` parses pure TypeScript in `.ts` files (like `src/lib/auth-validation.ts` and `src/lib/auth.ts`), but does NOT evaluate JSX/TSX. Therefore, use direct imports for pure logic functions from `../src/lib/auth-validation.ts`, and use `fs.readFileSync` for component contract/lifecycle checks.

Run `node --experimental-strip-types --test tests/auth-redesign.test.ts` and `npm test` in web/ to verify tests execute cleanly.
Write your complete report to d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\test_writer_m5\handoff.md and message orchestrator_17 when finished.
