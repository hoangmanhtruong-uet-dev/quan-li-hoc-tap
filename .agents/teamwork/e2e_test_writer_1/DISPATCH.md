## 2026-10-17T01:01:39Z
You are e2e_test_writer_1.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\e2e_test_writer_1

MANDATORY FIRST STEP:
Read the authoritative user request at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically header ## 2026-10-17T00:51:59Z).
Also read:
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_survey_3\handoff.md
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_2\handoff.md

Exclusive Write Ownership:
You exclusively own and may create/modify:
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\TEST_INFRA.md
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\TEST_READY.md
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\tests\extension-manifest.test.ts
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\tests\extension-bridge.test.ts
Do NOT modify files outside your ownership.

Mission:
Establish the E2E Testing Track for the Chrome Extension and Web App integration.
1. Create `TEST_INFRA.md` at project root using the standard 4-Tier methodology:
   - Tier 1: Feature Coverage (>=5 tests per feature for manifest, background FSM, blacklist matching, lockout trigger, exemption, -50 XP penalty, popup sync).
   - Tier 2: Boundary & Corner Cases (empty URLs, complex subdomains, malformed inputs, rapid consecutive clicks, zero XP clamp, expired exemptions).
   - Tier 3: Cross-Feature Combinations (Pomodoro start -> Blacklist visit -> Lockout -> Exemption -> Expire -> Close tab & -50 XP).
   - Tier 4: Real-world Student Workflows (study session with YouTube music vs Facebook distraction vs research exemption).
2. Implement robust automated unit test suites using the Node 20 built-in test runner (`node:test` and `node:assert/strict`):
   - `web/tests/extension-manifest.test.ts`: Validates `extension/manifest.json` schema, permissions (tabs, storage, activeTab, scripting, declarativeNetRequest), `externally_connectable` rules, background worker type, icons, web accessible resources.
   - `web/tests/extension-bridge.test.ts`: Validates blacklist domain matching algorithm, subdomains, internal exemptions, FSM session transitions, exemption 3-minute cooldown calculation, and -50 XP penalty calculation with 0 floor.
3. Run verification tests in `web/` using:
   `node --experimental-strip-types --test tests/extension-manifest.test.ts tests/extension-bridge.test.ts`
   and verify full test suite:
   `npm test`
4. Once tests pass, publish `TEST_READY.md` at project root with test runner command, tier coverage counts, and feature checklist.
5. Write your handoff report to `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\e2e_test_writer_1\handoff.md` and send a completion message to the parent orchestrator.
