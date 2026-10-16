# Plan: Final Go-Live Audit & Zero-Defect Production Gate

## Objectives
Deliver a flawless, production-ready Tarot Couple application fulfilling R1 (Codebase Cleanliness & Web Interface Polish), R2 (PayOS, Supabase & Gemini AI End-to-End Integrity), and R3 (Zero-Defect Production Gate: 0 tsc errors, 100% vitest pass across 357+ tests, 118 routes Next.js build, git commit & push to origin/main).

## Step-by-Step Execution Plan

### Phase 1: In-Depth Exploration & Gap Analysis (Current)
- Dispatch 3 parallel Explorers:
  - **Explorer 1 (`explorer_1_r1_ui`)**:
    - Inspect `src/components/CoupleModeView.tsx` & `src/components/FollowupChatModal.tsx` for form inputs/textareas/buttons accessibility, `aria-label`, visible focus rings (`focus-visible:ring-2`), and replace straight dots `...` with canonical typographic ellipses `…`.
    - Audit `@vercel/analytics/next` and PulseWatch tracker scripts (`src/app/layout.tsx` etc.) for safe operation without console warnings or hydration mismatches.
  - **Explorer 2 (`explorer_2_r2_backend`)**:
    - Inspect PayOS payment link creation (`src/lib/payos.ts` or routes), verifying handling of real credentials vs fallback for test environments.
    - Inspect Supabase Hybrid Sync (`src/lib/supabase-hybrid.ts`, `src/lib/quota-store.ts`, wallet) handling of `profiles`, `readings`, `couple_rooms`, and star wallet transactions.
    - Inspect Google Gemini AI 5-key rotation (`src/lib/ai-provider.ts`), verifying card indices normalization and preservation of `usedFallback: false` when valid keys are configured.
  - **Explorer 3 (`explorer_3_r3_cleanliness_verification`)**:
    - Inspect codebase for redundant debugging logs (`console.log`, `console.debug`, temporary trace statements).
    - Verify all external asset URLs (Cloudinary, Unsplash, Supabase storage, etc.) for valid HTTPS and fallback safety.
    - Check current baseline of test suite (`vitest`), TypeScript check (`tsc`), and routes build.

### Phase 2: Implementation & Polish
- Synthesize findings from Explorers into clear, surgical action tasks.
- Dispatch `worker_golive_polish` with exclusive file boundaries and mandatory anti-cheat integrity constraints.
- Worker implements fixes, removes redundant logs, verifies asset URLs, fixes UI accessibility/ellipses/focus rings, verifies PayOS/Supabase/Gemini integrations, and verifies build/tests.

### Phase 3: Multi-Agent Review, Challenge & Forensic Audit Gate
- Dispatch 2 independent Reviewers (`reviewer_1_golive`, `reviewer_2_golive`) to verify code quality, accessibility, invariants, and interface contracts.
- Dispatch 2 Challengers (`challenger_1_golive`, `challenger_2_golive`) to test edge cases, error resilience, and regressions.
- Dispatch 1 Forensic Auditor (`auditor_golive`) to conduct anti-cheat verification, static analysis, and authentic implementation proof.
- Evaluate gate strictly in `GATE_STATUS.md`.

### Phase 4: Production Gate & Git Push
- Verify 0 TypeScript errors (`npx tsc --noEmit`).
- Verify 100% vitest pass across all 357+ tests.
- Verify clean build of all 118 Next.js routes (`npm run build`).
- Commit all improvements with structured git messages and push to `origin/main`.
- Deliver comprehensive victory report with verified evidence to parent.
