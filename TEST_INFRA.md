# Test Infrastructure & Runner Architecture: Chrome Extension & Web App Integration

## 1. Overview
This document specifies the end-to-end testing architecture, test tiers, runner configuration, and verification methodology for the **CampusOS AI Giám Sát Học Tập Cực Đoan** Chrome Extension (Manifest V3) and Next.js Web App integration.

The test infrastructure validates:
1. **Extension Manifest V3 Configuration & Security**: Schema integrity, permissions (`tabs`, `storage`, `activeTab`, `scripting`, `declarativeNetRequest`), `externally_connectable` access control, and MV3 service worker declarations.
2. **Background Service Worker & FSM Engine**: Session state lifecycle (`idle`, `focusing`, `break`), 14 default blacklist domain matching, subdomain resolution, and internal domain exemption.
3. **Supervisor Arbitration & Lockout Coordination**: 5-second countdown triggers, tab close coordination, focus redirection to CampusOS, and 180-second exemption cooldown math.
4. **Two-Way Web App Bridge & Gamification Sync**: Protocol contracts (`START_FOCUS`, `CHECK_URL`, `LOCKOUT_VIOLATION`), -50 XP penalty with 0 floor, level/rank demotions, and Supabase cloud sync compatibility.

---

## 2. Test Runner Architecture
- **Engine**: Node.js 20+ native test runner (`node:test`, `node:assert/strict`) with TypeScript type stripping support (`--experimental-strip-types`).
- **Zero Overhead**: Does not rely on heavy runtime wrappers (Vitest/Jest/Playwright daemon overhead), executing all 435 tests project-wide in under 2.8 seconds.
- **Execution Mode**: Native ECMAScript Modules (ESM) with explicit `.ts` and `.js` relative imports.
- **Offline & Isolation Guarantee**: Tests are 100% self-contained, requiring zero active internet connections, live Supabase cloud credentials, or browser window servers.

---

## 3. Directory & File Layout
```
d:/MyProjects/MyProjectToMoney/Web-quan-li-hoc-tap/
├── extension/
│   ├── manifest.json                  # Manifest V3 specification
│   ├── background.js                  # Service worker FSM & message router
│   ├── content.js                     # Cyber-Glass Lockout HUD & 5s timer
│   └── assets/fat-orange-cat.png      # Supervisor mascot graphic
├── web/
│   ├── src/lib/
│   │   ├── gamification.ts            # Level, XP progress, and rank calculations
│   │   ├── campus-store.ts            # Reactive store & penalty dispatch
│   │   └── supabase-sync.ts           # Supabase sync & offline mutation queue
│   ├── tests/
│   │   ├── extension-manifest.test.ts # 11 tests: Manifest V3 schema & security
│   │   ├── extension-bridge.test.ts   # 44 tests: 4-Tier bridge & FSM validation
│   │   ├── supervisor-arbiter.test.ts # 3 tests: Fat Orange Cat discipline arbitration
│   │   ├── tasks-redesign.test.ts     # 40 tests: Tasks NLP & store gamification
│   │   └── ... (25 additional test suites covering full CampusOS stack)
│   └── package.json                   # "test": "node --experimental-strip-types --test tests/*.test.ts"
├── TEST_INFRA.md                      # This specification document
└── TEST_READY.md                      # Test completion & readiness certification
```

---

## 4. Standard 4-Tier Test Suite Specification

### Tier 1: Feature Coverage (Core Functional Capabilities)
Minimum 5 atomic tests per feature covering the primary behavior and interface contracts:

| Feature Area | Minimum Tests | Implemented Tests | Covered Scenarios |
|---|---|---|---|
| **Manifest V3 Schema & Permissions** | 5 | 11 | JSON parsing, manifest_version 3, semver versioning, permissions (`tabs`, `storage`, `activeTab`, `scripting`, `declarativeNetRequest`), prohibited permission exclusion, background module type, popup action, icons, web accessible resources, anti-MV2 deprecation audit. |
| **Blacklist Domain Matching** | 5 | 5 | Exact match for all 14 default domains (`facebook.com`, `youtube.com`, `tiktok.com`, `twitter.com`, `x.com`, `instagram.com`, `netflix.com`, `bilibili.com`, `shopee.vn`, `reddit.com`, `threads.net`, `twitch.tv`, `discord.com`, `lazada.vn`), multi-level subdomains, safe/educational domain exclusion, `normalizeDomain` utility, custom blacklist CRUD. |
| **Internal Exemptions & System URLs** | 5 | 5 | `localhost:3000` & `127.0.0.1:3000` dev origins, `campusos.vn` production/staging domains, browser internal schemes (`chrome://`, `about:blank`, `edge://`), non-web schemes (`file://`, `data:`, `blob:`), FQDN trailing dot normalization. |
| **Background FSM Lifecycle** | 5 | 5 | Initial `idle` state, `startFocus` transition & start timestamp, `pauseFocus` elapsed time preservation, `stopFocus` reset, `startBreak` relaxation mode. |
| **Lockout Trigger & Message Protocol** | 5 | 5 | `PING` handshake, `CHECK_URL` active tab assessment, `LOCKOUT_VIOLATION` counter increment, `TOGGLE_WEBCAM` flag persistence, `GET_POPUP_DATA` / `SYNC_STATE` full state export. |
| **Exemption Management & Cooldown** | 5 | 5 | First request grant (180s grace), `isExempt` active check, second request denial within 180s cooldown, exact `waitSeconds` calculation in error response, renewal after 180s expiry. |
| **-50 XP Penalty & Gamification** | 5 | 5 | Standard 50 XP deduction, 0 XP floor clamp (never negative), exact 0 XP input, Level 2 demotion to Level 1, multi-violation successive penalties with progression recalculation. |

---

### Tier 2: Boundary & Corner Cases
Adversarial inputs and extreme boundary stress:
- **T2.1: Empty & Malformed Inputs**: Empty strings, `null`, `undefined`, numbers, objects, and whitespace-only URLs return `null` / `false` without throwing.
- **T2.2: Invalid URL Formatting**: Missing schemes, spaces in hostnames, query-only strings, unsupported protocols (FTP) handled safely.
- **T2.3: Deep Subdomains & False Positive Rejection**: Multi-segmented subdomains (`alpha.beta.gamma.m.facebook.com`) match root blacklist, while lookalike domains (`notfacebook.com`) are correctly permitted.
- **T2.4: HTTP Authentication Credentials**: URLs containing basic auth credentials (`http://user:pass@reddit.com/r/all`) parse cleanly without bypass.
- **T2.5: Rapid Exemption Spam**: Rapid consecutive exemption button clicks (10 calls in 1ms) execute cleanly with only 1 grant and 9 controlled cooldown rejections.
- **T2.6: Millisecond Cooldown Boundary**: Exact boundary evaluation (at t = 179,999ms request is denied; at t = 180,000ms request is granted).
- **T2.7: Extreme Penalty Clamping**: Excessive penalty values (e.g. 1000 XP penalty on 1 XP) cleanly floor at 0 XP.

---

### Tier 3: Cross-Feature Combinations
End-to-end multi-step flows simulating integrated operations:
- **T3.1: Full Enforcement Pipeline**: `START_FOCUS` -> visit `facebook.com` (Violates, count=1) -> click "Tôi đang tra tài liệu" (Granted, 180s) -> visit `youtube.com` (Permitted during grace) -> Exemption expires -> visit `tiktok.com` (Violates, count=2) -> Close tab signal & -50 XP penalty applied.
- **T3.2: State Interruption (Pause & Resume)**: `startFocus` -> `pauseFocus` -> visit `youtube.com` (no violation because paused) -> resume `startFocus` -> visit `youtube.com` (violation triggered immediately).
- **T3.3: Break Mode Interruption**: `startBreak` -> visit `youtube.com` (no violation because break mode suppresses enforcement) -> session returns to focus -> enforcement resumes.
- **T3.4: Dynamic Blacklist Customization in Session**: Removing `reddit.com` from blacklist during live focus allows access -> re-adding `reddit.com` re-enables blocking immediately.

---

### Tier 4: Real-World Student Workflows
Realistic Vietnamese student scenarios:
- **T4.1: Mixed Research & Accidental Distraction**: Student researches across `campusos.vn`, `github.com`, and `stackoverflow.com` without hindrance -> accidentally clicks `facebook.com` notification -> Lockout HUD & violation registered.
- **T4.2: Legitimate Video Research Grace Period**: Student needs a 2-minute PostgreSQL video tutorial on YouTube -> clicks "Tôi đang tra tài liệu" -> watches video within 180s grace period -> returns to CampusOS before cooldown expiration with 0 violations.
- **T4.3: Penalty & Recovery Gamification Cycle**: Student at 85 XP incurs -50 XP penalty (down to 35 XP) -> regains focus and completes a 25-minute Pomodoro session (+100 XP) -> recovers to 135 XP with Level 1 progression.

---

## 5. Test Invocation Commands

### 1. Execute Extension & Bridge Suites Only
```powershell
cd web
node --experimental-strip-types --test tests/extension-manifest.test.ts tests/extension-bridge.test.ts
```
*Expected*: 55 tests pass in < 200ms with 0 failures.

### 2. Execute Entire Project Test Suite
```powershell
cd web
npm test
```
*Expected*: 435 tests pass in < 3.0s with 0 failures.

### 3. Verify TypeScript Compilation & Type Safety
```powershell
cd web
npm run typecheck
```
*Expected*: Exit code 0, 0 TypeScript errors.

---

## 6. Environment Invariants
- Node.js >= 20.0.0 (supports native test runner & `--experimental-strip-types`).
- Cross-platform compatible (Windows, macOS, Linux).
- Absolute path independence: manifest path resolution uses `import.meta.url` and works regardless of current shell directory.
