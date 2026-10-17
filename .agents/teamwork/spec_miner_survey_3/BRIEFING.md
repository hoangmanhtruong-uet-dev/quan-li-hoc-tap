# BRIEFING — 2026-10-17T01:01:00Z

## Mission
Inspect the project root for existing extension files and produce a rigorous specification for Chrome Extension Manifest V3 "AI Giám Sát Học Tập Cực Đoan".

## 🔒 My Identity
- Archetype: Specification Miner
- Roles: Specification Mining, Interface Definition, Behavior Observation, Edge Case Mapping
- Working directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_survey_3
- Original parent: 051c51ec-d4c0-431c-b685-75179c16a0da
- Milestone: Chrome Extension Manifest V3 "AI Giám Sát Học Tập Cực Đoan" Survey

## 🔒 Key Constraints
- Read-only: Do NOT write or modify source code files. Only write to own workspace folder (.agents/teamwork/spec_miner_survey_3/).
- Prioritize authoritative sources over LLM prior knowledge.
- Must document all features thoroughly with tables (Features Discovered, Edge Cases).
- Check `extension/` directory existence and all sub-files.
- Detail exact specifications for Manifest V3 (manifest.json, background.js, content.js, AI Webcam Face Tracking, popup).

## Current Parent
- Conversation ID: 051c51ec-d4c0-431c-b685-75179c16a0da
- Updated: 2026-10-17T01:01:00Z

## Task Summary
- **What to build/specify**: Complete specification for Manifest V3 Chrome Extension ("AI Giám Sát Học Tập Cực Đoan") bridging with CampusOS Web App & Supabase.
- **Success criteria**: Rigorous, actionable specification covering manifest.json, background.js, content.js, AI Webcam Face Tracking, and popup UI, along with edge case matrix and integration interfaces.
- **Interface contracts**: ORIGINAL_REQUEST.md (§ 2026-10-17T00:51:59Z), Web App existing Pomodoro store and Supabase schema.
- **Code layout**: `extension/` root (`manifest.json`, `background.js`, `content.js`, `popup/`, etc.).

## Key Decisions Made
- Audited `extension/`: Discovered existing `manifest.json` (incomplete permissions), `content.js` (simple overlay), and `assets/fat-orange-cat.png`. Confirmed `background.js` and `popup/` are missing.
- Discovered and aligned with `docs/Plan_Pomodoro_Cuc_Doan.txt` for exact mathematical thresholds (EAR < 0.20 for 10s sleep, Yaw/Pitch for 10s looking away, 180s exemption cooldown, 5s countdown, -50 XP penalty).
- Formulated dual-channel bridge architecture (direct `externally_connectable` and web content script postMessage relay) for zero-config unpacked extension development.
- Completed comprehensive 20-feature discovery table and 18-edge-case matrix.

## Artifact Index
- DISPATCH.md — Dispatch assignment
- BRIEFING.md — Working memory & identity
- progress.md — Liveness heartbeat & task progress
- handoff.md — Comprehensive specification mining report
