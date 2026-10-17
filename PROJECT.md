# Project: CampusOS AI Giám Sát Học Tập Cực Đoan (Chrome Extension Manifest V3)

## Architecture
- **Chrome Extension Manifest V3 (`extension/`)**:
  - `manifest.json`: Manifest V3 standard with permissions `["tabs", "storage", "activeTab", "scripting", "declarativeNetRequest"]`, `externally_connectable` matching `http://localhost:3000/*` and production domain.
  - `background.js`: Background Service Worker running FSM session states (`idle`, `focusing`, `break`), 14 default blacklist domains with `chrome.storage.sync` sync, `chrome.tabs.onActivated` and `chrome.tabs.onUpdated` event listeners, message routing between Web App, Content Script, and Popup, tab closure and focus switching to CampusOS.
  - `content.js`: Cyber-Glass Lockout HUD injected via Shadow DOM with `backdrop-filter: blur(25px)`, screen shake CSS animation, Fat Orange Cat supervisor character, Vietnamese TTS scolding, 5-second countdown with auto tab close and CampusOS focus, and an exemption button ("Tôi đang tra tài liệu") limited to 1 use per 3 minutes.
  - `popup/`: Extension popup (`popup.html`, `popup.js`, `popup.css`) with real-time synced Pomodoro countdown, customizable blacklist domain manager (add/remove), and AI Webcam toggle.
  - `ai/`: AI Webcam Face Tracking module running MediaPipe Face Mesh / Web Worker to calculate Eye Aspect Ratio (EAR < 0.20 for sleeping > 10s) and Head Pose (Yaw/Pitch > 10s for looking away), with settings toggle.
- **Web App CampusOS (`web/`)**:
  - `web/src/lib/campus-store.ts`: `penalizeViolation(amount = 50, reason)` to deduct -50 XP, update level/rank titles, and trigger store updates.
  - `web/src/lib/supabase-sync.ts`: `recordFocusViolationToSupabase(...)` with offline queue support and optimistic update.
  - `web/src/features/pomodoro/use-extension-bridge.ts`: 2-way postMessage / runtime messaging bridge connecting Pomodoro sessions and receiving violation events.
  - `web/src/app/api/focus/violation/route.ts`: Fallback REST endpoint for extension violation logging.
  - `web/src/types/database.ts`: TypeScript contracts for `violation_count`.
- **Database (`supabase/migrations/`)**:
  - `004_extension_focus_violations.sql`: DDL adding `violation_count` to `profiles`, `student_profiles`, and `student_focus_sessions`.

## Code Layout
- `extension/manifest.json` — Manifest V3 definition
- `extension/background.js` — Service worker FSM, blacklist matcher, tab monitor, message router
- `extension/content.js` — Cyber-Glass Lockout HUD, screen shake, Vietnamese TTS, 5s countdown, exemption handler
- `extension/popup/popup.html` — Extension popup UI
- `extension/popup/popup.js` — Popup controller and real-time Pomodoro sync
- `extension/popup/popup.css` — Cyber-Glass popup styles
- `extension/ai/webcam-tracker.js` — MediaPipe Face Mesh worker / EAR & Head Pose algorithms
- `extension/assets/fat-orange-cat.png` — Supervisor mascot image asset
- `web/src/features/pomodoro/use-extension-bridge.ts` — Web App to Extension messaging hook
- `web/src/features/pomodoro/ai-webcam-modal.tsx` — Web App camera monitoring & permission modal
- `web/src/lib/campus-store.ts` — XP penalty and store dispatch
- `web/src/lib/supabase-sync.ts` — Supabase violation logging
- `web/src/app/api/focus/violation/route.ts` — Violation API endpoint
- `web/src/types/database.ts` — Database types with `violation_count`
- `supabase/migrations/004_extension_focus_violations.sql` — PostgreSQL migration DDL
- `web/tests/extension-bridge.test.ts` — Unit tests for extension bridge, blacklist matching, and penalty calculation
- `web/tests/extension-manifest.test.ts` — Tests validating manifest.json syntax and MV3 compliance

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | Manifest V3 Configuration | Complete `manifest.json` with permissions, icons, background worker, popup, and web accessible resources | M1 | ORIGINAL_REQUEST § R1 |
| F02 | `externally_connectable` | Allows Web App (`localhost:3000` & prod) to communicate directly with extension | M1 | ORIGINAL_REQUEST § R1 |
| F03 | Background FSM Session | Service worker managing `idle`, `focusing`, `break` states | M1 | ORIGINAL_REQUEST § R1 |
| F04 | Blacklist Storage Sync | 14 default domains with `chrome.storage.sync` and local fallback | M1 | ORIGINAL_REQUEST § R1 |
| F05 | `tabs.onActivated` Listener | Monitors tab switching during focus to detect distracting websites | M1 | ORIGINAL_REQUEST § R1 |
| F06 | `tabs.onUpdated` Listener | Monitors URL changes to trigger lockout HUD in < 200ms | M1 | ORIGINAL_REQUEST § R1 |
| F07 | Tab Close & CampusOS Focus | Automatically closes violating tab and restores focus to CampusOS | M1 | ORIGINAL_REQUEST § R2 |
| F08 | Cyber-Glass DOM Modal | Shadow DOM modal injection with `backdrop-filter: blur(25px)` | M2 | ORIGINAL_REQUEST § R2 |
| F09 | Screen Shake Effect | CSS multi-directional shake animation on violation | M2 | ORIGINAL_REQUEST § R2 |
| F10 | Vietnamese TTS Audio | Scolding voice synthesis with Fat Orange Cat speech bubble | M2 | ORIGINAL_REQUEST § R2 |
| F11 | 5s Countdown Timer | 5-second animated progress bar and forced closure countdown | M2 | ORIGINAL_REQUEST § R2 |
| F12 | Exemption Button ("Tra tài liệu") | Grace period button with 1 use per 3 minutes limit | M2 | ORIGINAL_REQUEST § R2 |
| F13 | MediaPipe Face Mesh Worker | Face landmark detection running on worker thread at 10-15fps | M3 | ORIGINAL_REQUEST § R3 |
| F14 | Drowsy/Sleep EAR Detection | Eye Aspect Ratio < 0.20 for > 10s triggers wake-up alert | M3 | ORIGINAL_REQUEST § R3 |
| F15 | Looking Away Head Pose Detection | Yaw > 30° or Pitch < -25° for > 10s triggers focus alert | M3 | ORIGINAL_REQUEST § R3 |
| F16 | Webcam Toggle Switch | User toggle in settings/popup to enable/disable camera tracking | M3 | ORIGINAL_REQUEST § R3 |
| F17 | Realtime Popup Pomodoro | Synchronized `MM:SS` countdown and session controls in popup | M4 | ORIGINAL_REQUEST § R4 |
| F18 | Blacklist Management in Popup | Add, remove, and restore default blacklisted domains | M4 | ORIGINAL_REQUEST § R4 |
| F19 | -50 XP Penalty & Supabase Sync | Deduct -50 XP and increment `violation_count` on Supabase Cloud | M4 | ORIGINAL_REQUEST § R4 |
| F20 | Focus Start Sync from Web | Starting Pomodoro on Web App automatically triggers extension focus mode | M4 | ORIGINAL_REQUEST § R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Manifest V3 & Background Service Worker | `extension/manifest.json`, `extension/background.js`, blacklist storage sync, tab listeners, message routing | none | DONE |
| M2 | Cyber-Glass Lockout HUD & Vietnamese TTS | `extension/content.js`, Shadow DOM, 25px blur, screen shake, Vietnamese TTS, 5s countdown, exemption cooldown | M1 | DONE |
| M3 | AI Webcam Face Tracking | `extension/ai/webcam-tracker.js`, MediaPipe Face Mesh, EAR < 0.20 sleep, Head Pose yaw/pitch > 10s, toggle | M1 | DONE |
| M4 | Web App Bridge, Supabase -50 XP & Realtime Popup | `campus-store.ts`, `supabase-sync.ts`, `004_extension_focus_violations.sql`, `use-extension-bridge.ts`, `extension/popup/` | M1, M2 | DONE |
| M5 | Final E2E Verification & Security Audit | 100% tests pass (505/505 tests), 0 typecheck errors, Next.js build clean, Extension unpacked load validation | M1, M2, M3, M4 | DONE |

## Interface Contracts
### Web App ↔ Extension Messaging Contract
```typescript
export type ExtensionMessage =
  | { action: 'PING' }
  | { action: 'START_FOCUS'; durationSeconds: number; characterSlug?: string; mode?: string }
  | { action: 'PAUSE_FOCUS' }
  | { action: 'STOP_FOCUS' }
  | { action: 'REQUEST_EXEMPTION'; durationSeconds?: number }
  | { action: 'SYNC_STATE' }
  | { action: 'UPDATE_BLACKLIST'; blacklist: string[] }
  | { action: 'TOGGLE_WEBCAM'; enabled: boolean };

export type ExtensionResponse =
  | { status: 'PONG'; installed: boolean; version: string; state: 'idle' | 'focusing' | 'break' }
  | { status: 'OK'; state: string }
  | { status: 'EXEMPTION_GRANTED'; exemptUntil: number }
  | { status: 'EXEMPTION_DENIED'; waitSeconds: number };

export type ViolationPayload = {
  action: 'EXTENSION_VIOLATION';
  domain: string;
  reason: 'blacklist_url' | 'face_away' | 'sleep';
  penaltyXp: 50;
  timestamp: number;
};
```

### Supabase DDL Contract
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS violation_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS violation_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.student_focus_sessions ADD COLUMN IF NOT EXISTS violation_count INTEGER NOT NULL DEFAULT 0;
```
