# Explorer 2 Gen2 Dispatch - PayOS & Supabase Hybrid Sync Integrity Audit

## Objective
Survey and analyze the codebase for Requirement R2 (Part A):
1. PayOS payment link creation:
   - Inspect `src/lib/payos.ts`, `src/app/api/payment/...` and any payment checkout flows.
   - Verify how real credentials vs test environment fallbacks are handled.
   - Ensure resilient fallback in test environments while supporting real credentials properly.
2. Supabase Hybrid Sync:
   - Inspect `src/lib/supabase-hybrid.ts`, `src/lib/supabase.ts`, wallet / reading / profile persistence.
   - Verify proper handling for all 4 tables: `profiles`, `readings`, `couple_rooms`, and star wallet transactions.
   - Identify any missing tables, edge cases, error handlers, or sync gaps.

## Deliverables
Inspect the files and write your comprehensive report to:
`d:\MyProjects\MyProjectToMoney\TarotCouple\.agents\teamwork\explorer_2_golive_gen2\report.md`
and send a completion message with summary.
