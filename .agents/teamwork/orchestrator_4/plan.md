# Execution Plan: Final Go-Live Audit & Zero-Defect Production Gate

## Objectives
Perform a comprehensive Final Go-Live Audit, polish, and verification for Tarot Couple Next.js 15 app at `d:\MyProjects\MyProjectToMoney\TarotCouple`:
1. R1: Codebase Cleanliness & Web Interface Polish (eliminate redundant console logs, verify external asset URLs, CoupleModeView & FollowupChatModal accessibility & focus-visible & typography `…`, Vercel analytics & PulseWatch safety).
2. R2: PayOS, Supabase & Gemini AI End-to-End Integrity (PayOS real vs fallback credentials, Supabase hybrid sync tables profiles/readings/couple_rooms/star wallet, Gemini AI 5-key rotation card index normalization & usedFallback: false).
3. R3: Zero-Defect Production Gate (tsc, vitest 357+ tests, 118 routes next build, structured git commit & push to origin/main).

## Milestones & Workflow
- **M1: Survey & Codebase Exploration**:
  - Explorer 1: UI Polish & Accessibility (`CoupleModeView.tsx`, `FollowupChatModal.tsx`, typography ellipses `…`, `focus-visible:ring-2`, `aria-label`, analytics/PulseWatch scripts).
  - Explorer 2: External APIs & Database Integrity (PayOS payment links, Supabase hybrid sync tables, star wallet transactions).
  - Explorer 3: AI Engine & Codebase Cleanliness (Gemini 5-key rotation, card indices normalization, redundant console.log/debug audit, asset URLs).
- **M2: Implementation & Polish**:
  - Worker: Executes all identified fixes and polish items, runs test suites, verifies builds.
- **M3: Independent Quality & Security Gate**:
  - Reviewer 1 & Reviewer 2: Code inspection, interface conformance, regressions.
  - Challenger 1 & Challenger 2: Adversarial edge cases, stress testing, test suite verification.
  - Auditor: Forensic integrity audit (no cheating, no mock bypasses, genuine logic).
- **M4: Production Gate & Git Push**:
  - Worker executes `tsc --noEmit`, `vitest run`, `next build`, git status check, structured commit and push to `origin/main`.
- **M5: Parent Reporting**:
  - Synthesize and send full victory report to caller parent agent.
