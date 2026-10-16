# Handoff Report: Pomodoro Supervisor, Audio/Interactive Architecture & Cross-Page Store Sync

**Agent**: `explorer_survey_2`  
**Working Directory**: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_2`  
**Parent Orchestrator**: `orchestrator_7` (`5bd8e140-4c1e-4580-b966-e8064ec8f7d3`)  
**Scope**: Full architectural survey of `StrictPomodoroModal`, `MemeCatStage`, Web Audio & TTS pipelines, in-modal Mode Switcher (Mode A: Mèo Mập vs Mode B: Chill Breathing 4-7-8 + Lo-fi), and the +XP / streak / study minutes store synchronization across `/dashboard` and `/calendar`.

---

## 1. Observation

### 1.1 Existing Pomodoro Supervisor & Stage Components
- **`src/features/pomodoro/strict-pomodoro-modal.tsx` (566 lines)**:
  - Lines 29–38: Defines `StrictPomodoroModalProps`:
    ```typescript
    interface StrictPomodoroModalProps {
      open: boolean;
      onClose: () => void;
      onSessionComplete?: (stats: {
        focusMinutes: number;
        shameCount: number;
        disciplineScore: number;
      }) => void;
      initialMinutes?: number;
    }
    ```
  - Lines 46–63: Manages local session states: `characterSlug`, `roastLevel`, `minutes`, `seconds`, `running`, `audioMuted`, `visualMode` (`'meme_photo' | '3d_model'`), `mood` (`'idle' | 'watching' | 'angry' | 'roasting'`), `currentSpeech`, `isSpeaking`, `shameCount`, `exemptRemaining`, `isPipActive`.
  - Lines 73–99: `triggerRoast()` plays sound via `pomodoroAudio.playAlertSound(alertType)`, sets mood, and invokes `pomodoroAudio.speak(speechText, ..., { gender, tone })`.
  - Lines 101–117: `handleFinish()` computes `actualFocusMin = Math.round((minutes * 60 - seconds) / 60)`, gets `disciplineScore` from `arbiterRef.current.calculateDisciplineScore(actualFocusMin, minutes)`, triggers praise TTS, and fires `onSessionComplete`.
  - Lines 120–141: Active 1-second interval ticking countdown `seconds` and updating exemption countdown.
  - Lines 144–173: `useTabDetection()` hook checks tab visibility / blur; on violation calls `arbiterRef.current.canRoast()` and `arbiterRef.current.registerRoast()`, selects warning or extreme scolding quote, and triggers roast.
  - Lines 214–253: `handleOpenFloatingMemePiP()` utilizes `window.documentPictureInPicture.requestWindow({ width: 520, height: 320 })` to open an always-on-top window rendering the grey timer box (`0:52`) and `/images/fat-orange-cat.png`. Fallback uses `canvas.captureStream(30)` to `<video>` for native video PiP.
  - Lines 272–564: Modal rendered via `createPortal(..., document.body)`. Left column hosts the stage (`MemeCatStage` or `TalkingTom3D`) and start/pause/reset controls; right column hosts character cards, roast level chips, duration pills (1, 25, 45, 60 min), shame counter, 2-minute exemption button ("Tôi đang tra tài liệu"), and manual complete button.

- **`src/features/pomodoro/meme-cat-stage.tsx` (228 lines)**:
  - Lines 27–36: Props include `mood`, `characterName`, `timerLabel`, `skinType`, `isSpeaking`, `running`, `currentSpeech`, `onPoke`.
  - Lines 51–84: High-performance `requestAnimationFrame` loop monitors `pomodoroAudio.getMouthOpenness()`:
    - Scales `mouthOverlayRef` vertically: `scale(1, ${mouthScaleY})` at position `left: 72.3%, top: 42.8%`.
    - Tilts & bounces `catBodyRef` (`scale`, `rotate`) based on speech intensity and angry mood.
  - Lines 108–132: Left element: semi-transparent grey timer box (`bg-neutral-600/85`, `backdrop-filter: blur(4px)`) rendering large `timerLabel` (`0:52`), status subtext, and quotation speech bubble.
  - Lines 135–215: Right element: high-resolution cutout cat (`src="/images/fat-orange-cat.png"`, verified present in `public/images/fat-orange-cat.png`, 405KB) with mouth overlay, skin SVG accessories (teacher glasses, CEO sunglasses, red KPI tie), and anger flame sticker (`Flame` icon). Click triggers `onPoke`.

### 1.2 TTS, Audio Synthesis & Tab Polling Engine
- **`src/features/pomodoro/audio-engine.ts` (293 lines)**:
  - Lines 11–59: Singleton `pomodoroAudio` wrapping `AudioContext`, `AnalyserNode` (`fftSize = 256`), and `MediaStreamAudioDestinationNode`.
  - Lines 72–93: `unlock()` method resumes suspended `AudioContext` upon user interaction.
  - Lines 98–114: `getMouthOpenness()` averages FFT frequency bins 2 through 40 to return normalized amplitude `0.0`–`1.0`.
  - Lines 119–187: `playAlertSound()` synthesizes alerts procedurally via Web Audio API oscillators:
    - `'tap'`: 180Hz -> 90Hz sine blip (Bongo cat tap)
    - `'poke'`: 520Hz -> 880Hz -> 340Hz sawtooth boing (cat meow/poke)
    - `'start'`: 440Hz -> 880Hz sine chime
    - `'warning'`: 320Hz -> 260Hz sawtooth buzz
    - `'penalty'`: 640Hz -> 300Hz triangle horn
    - `'success'`: C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz) major triad chime
  - Lines 192–245: `speak()` posts to `/api/tts` with `{ text, gender, tone }`, decodes response MP3 buffer into `AudioBufferSourceNode`, routes through `AnalyserNode` to `destination`, and invokes `onEnd` callback.
  - Lines 247–273: `speakFallback()` uses browser `SpeechSynthesisUtterance` with `vi-VN` voice if network TTS is unavailable.

- **`src/app/api/tts/route.ts` (86 lines)**:
  - Lines 18–22: Uses `msedge-tts` (Microsoft Edge Neural TTS) with voices:
    - Male: `vi-VN-NamMinhNeural` (Northern Vietnamese male)
    - Female: `vi-VN-HoaiMyNeural` (Northern Vietnamese female)
  - Lines 25–45: Configures pitch/rate/volume prosody:
    - `sarcastic`: pitch `+10Hz`, rate `1.08`, volume `95`
    - `angry`: pitch `+14Hz` (female) / `-5Hz` (male), rate `1.18`, volume `100`
    - `praise`: pitch `+4Hz`, rate `1.0`, volume `90`
    - `normal`: pitch `+0Hz`, rate `1.05`, volume `90`

- **`src/features/pomodoro/supervisor-arbiter.ts` (83 lines)**:
  - Cooldown: 20 seconds (`cooldownSeconds: 20`).
  - Exemption: 120 seconds (`requestExemption(120)`).
  - Scoring: `calculateDisciplineScore(actualFocusMinutes, targetMinutes)` starts at 100 and deducts 5 points per violation roast.

- **`src/features/pomodoro/use-tab-detection.ts` (100 lines)**:
  - Debounced tab switch detection via `document.visibilitychange`, `window.blur`, `window.focus` with a 3-second buffer (`toleranceSeconds: 3`).

### 1.3 State Isolation in Existing Dashboard & Calendar
- **`src/app/(main)/dashboard/page.tsx`**:
  - Uses `StudySessionModal` (generic study modal in `src/components/shared/study-session-modal.tsx`), NOT `StrictPomodoroModal`.
  - Persists state in `window.localStorage.getItem('campusos-dashboard-v1')` storing only `{ completedDeadlines, completedGroupTasks, aiStatus, extraStudyMinutes }`.
  - Hardcodes streak to 12 days (`Flame` icon) and base weekly study minutes to `510 + extraStudyMinutes` (8.5 / 12h goal).
  - Lacks XP progression, Level, Mood, and Vibe theme persistence.

- **`src/app/(main)/calendar/page.tsx`**:
  - Persists events in `window.localStorage.getItem('campusos-calendar-v1')`.
  - Hardcodes `todayKey = '2026-08-20'` (does not track real system date).
  - Hardcodes streak to 12 days.
  - Completely detached from study minutes or XP earned in Pomodoro sessions.

- **`src/app/(main)/study/page.tsx`**:
  - Contains an existing usage of `StrictPomodoroModal`:
    ```tsx
    <StrictPomodoroModal
      open={strictFocusOpen}
      onClose={() => setStrictFocusOpen(false)}
      onSessionComplete={(stats) => {
        setStudyMinutes((value) => value + stats.focusMinutes);
        setStrictFocusOpen(false);
      }}
    />
    ```
  - Persists state in `campusos-study-hub-v1`, completely disjointed from `/dashboard` and `/calendar`.

### 1.4 Test Runner & Build Environment
- In `web/package.json`:
  ```json
  "scripts": {
    "test": "node --experimental-strip-types --test tests/*.test.ts",
    "typecheck": "tsc --noEmit",
    "build": "next build"
  }
  ```
- Executing `npm test` runs Node 20's built-in test runner with 9 passing tests in 126ms across `supervisor-arbiter.test.ts` and `workspace-permissions.test.ts`.
- Critical configuration observation in `tailwind.config.js`:
  ```javascript
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/streamdown/dist/*.js',
  ]
  ```
  `./src/features/**/*.{js,ts,jsx,tsx,mdx}` is currently **absent** from the `content` list! Any Tailwind CSS classes used only inside `src/features/pomodoro/` risk being purged during production builds unless added.

---

## 2. Logic Chain

### 2.1 Supervisor Execution & Voice Loop
1. When user clicks "Bắt đầu học", `handleStartOrPause()` calls `await pomodoroAudio.unlock()`, resuming the Web Audio `AudioContext`.
2. A random start quote from `character.quotes.start` is passed to `triggerRoast(initialQuote, 'start', 'normal')`.
3. `triggerRoast` plays a synthesized chime, posts speech text to `/api/tts`, and streams MP3 audio back to the browser.
4. The decoded audio runs through `AnalyserNode`. `MemeCatStage` polls `pomodoroAudio.getMouthOpenness()` at 60–120FPS to open the mouth sprite overlay and bounce the cat cutout.
5. If user changes tabs or blurs the browser window for > 3 seconds, `useTabDetection` fires `onTabViolation`.
6. `arbiterRef.current.canRoast()` checks whether 20-second cooldown has elapsed and whether the 120-second exemption window is inactive.
7. If permitted, `arbiterRef.current.registerRoast()` increments `shameCount`, selects an escalated roast quote (`tab_switch_extreme` if `roastCount > 2`), and triggers TTS scolding.
8. If user clicks "Nổi lên màn hình", Document PiP creates an always-on-top window with the grey 0:52 box and cutout cat.

### 2.2 Mode Switcher Architecture (Mode A vs Mode B)
Requirements demand an in-modal switch between:
- **Mode A: Mèo Mập Giám Thị Cực Đoan**:
  - Existing cutout fat orange cat (`/images/fat-orange-cat.png`) + grey countdown box (`0:52`) + Northern Vietnamese TTS scolding + tab violation detection + Document PiP.
- **Mode B: Chill Breathing 4-7-8 + Lo-fi Mode**:
  - Calm breathing orb guiding 4s inhale – 7s hold – 8s exhale (19-second cycle).
  - Procedural Web Audio lo-fi ambient synth.

**Architectural Rationale for Procedural Lo-Fi Audio**:
- **Why NOT static MP3 files**: Static files can fail on network errors, incur loading delays, face licensing/copyright constraints, and cannot dynamically swell or filter with breathing phases.
- **Web Audio Procedural Synth**:
  - Synthesize a warm, lush 4-chord pad progression (e.g., EbMaj9: Eb3 155.56Hz, G3 196Hz, Bb3 233.08Hz, D4 293.66Hz, F4 349.23Hz) using sine/triangle oscillators.
  - Route through a `BiquadFilterNode` (`lowpass`, 450Hz–750Hz cutoff) with a slow LFO (~0.2Hz) to emulate vintage tape wow & flutter.
  - Generate subtle vinyl crackle using a 2-second looped low-amplitude noise buffer with randomized impulse clicks.
  - Dynamic breathing swell: Automatically swell gain by +25% during 4s inhale, sustain during 7s hold, and softly decay during 8s exhale.
  - Volume control / mute toggle integrated directly with modal controls.

**State Contiguity during Mode Switch**:
- `minutes`, `seconds`, and `running` countdown state MUST remain shared so switching modes does not reset the student's timer.
- Switching to Mode B stops active TTS speech, deactivates aggressive tab-switch scolding, and starts the procedural lo-fi ambient synth.
- Switching back to Mode A stops the lo-fi synth, re-engages the cat supervisor arbiter, and restores the meme cat visual stage.

### 2.3 Reward Pipeline & Cross-Page Synchronization (/dashboard & /calendar)
Currently, `/dashboard` and `/calendar` maintain isolated `localStorage` keys without a shared reactive event bus.
To fulfill R1.3 and R4:
1. **Pure Gamification Engine (`src/lib/gamification.ts`)**:
   - `calculateLevel(xp: number)`:
     - Implements 10 levels with humorous Vietnamese titles:
       - Level 1: "Tân sinh viên lơ ngơ" (0–299 XP)
       - Level 2: "Cú đêm ôn thi" (300–699 XP)
       - Level 3: "Chiến thần bài tập" (700–1199 XP)
       - Level 4: "Thợ săn tín chỉ" (1200–1799 XP)
       - Level 5: "Hacker phòng lab" (1800–2499 XP)
       - Level 6: "Trùm cuối đồ án" (2500–3299 XP)
       - **Level 7: "Sinh viên cày thuê"** (3300–4199 XP — explicitly mandated in R1.3)
       - Level 8: "Bậc thầy thời gian" (4200–5199 XP)
       - Level 9: "Chiến thần học bổng" (5200–6299 XP)
       - Level 10: "Huyền thoại CampusOS" (6300+ XP)
   - `calculateStreak(currentStreak, lastStudyDate, todayKey, hasStreakFreeze)`:
     - If studied today (`lastStudyDate === todayKey`): maintains streak.
     - If studied yesterday: increments streak (`currentStreak + 1`).
     - If missed a day: consumes Streak Freeze if available; otherwise resets to 1.
   - `calculateSessionRewards(focusMinutes, disciplineScore, mode)`:
     - Base XP: `focusMinutes * 2` (50 XP for 25 min, 90 XP for 45 min).
     - Discipline / Zen bonus:
       - Mode A: +25 XP if `disciplineScore >= 90` ("Kỷ luật thép"), +15 XP if `shameCount === 0`.
       - Mode B: +20 XP ("Tâm trí vững vàng - Thở 4-7-8").
2. **Unified Shared Store (`src/lib/campus-store.ts`)**:
   - Backed by `window.localStorage` key `campusos_shared_store_v1`.
   - Uses `window.dispatchEvent(new CustomEvent('campusos_sync'))` and listens to `window.addEventListener('storage')` for multi-tab and cross-component reactivity.
   - Holds:
     - `xp`: number (default 2450)
     - `level`: number (derived)
     - `title`: string (derived)
     - `streak`: number (default 12)
     - `streakFreezeAvailable`: boolean (default true)
     - `lastStudyDate`: string
     - `weeklyGoalMinutes`: number (default 720 = 12h)
     - `studyMinutes`: number (default 510 = 8.5h)
     - `dailyMood`: `'sleepy' | 'neutral' | 'cool' | 'fire' | null`
     - `vibeTheme`: `'aurora' | 'y2k' | 'cyber' | 'pastel'`
     - `completedDeadlines`: string[]
     - `completedGroupTasks`: string[]
     - `calendarEvents`: CalendarEvent[]
   - Exposes `completeFocusSession({ focusMinutes, shameCount, disciplineScore, mode })`:
     - Adds `focusMinutes` to `studyMinutes`.
     - Adds `xpEarned` to `xp`.
     - Updates `lastStudyDate` and increments streak.
     - Updates weekly goal ring (e.g. from 8.5h to 8.5h + `focusMinutes/60`).
3. **Integration Points in Pages**:
   - `/dashboard`:
     - Hero CTA `▶ Bắt đầu phiên học` and AI Coach `Bắt đầu học` open `StrictPomodoroModal`.
     - Pressing shortcut `F` opens `StrictPomodoroModal`.
     - On completion: Goal Ring liquid fill count-up animation advances, XP bar floats `+XP`, Streak sticker bursts confetti.
   - `/calendar`:
     - Free-Slot Finder `+ Học ở đây` and Slide-Over Drawer `Vào học` open `StrictPomodoroModal`.
     - Pressing shortcut `F` opens `StrictPomodoroModal`.
     - On completion: Streak sticker updates, load heat-scores recalculate.

---

## 3. Caveats

1. **Tailwind Purge Configuration**:
   - File `tailwind.config.js` does NOT include `'./src/features/**/*.{js,ts,jsx,tsx,mdx}'` in its `content` array. Any new Tailwind classes introduced in `src/features/pomodoro/` will be stripped in production unless `tailwind.config.js` is patched to include `./src/features/**`.
2. **Document Picture-in-Picture Browser Support**:
   - `window.documentPictureInPicture` is supported on Chromium (Chrome/Edge 111+). On unsupported browsers (Firefox, Safari), the modal falls back to native canvas-video PiP or in-page minimized pill.
3. **Edge TTS API Runtime**:
   - `/api/tts/route.ts` utilizes the Node.js package `msedge-tts`, which relies on Node streams and buffers. It must remain on standard Node.js server runtime (`nodejs`), not Edge runtime.
4. **Node Test Runner File Extensions**:
   - The project test runner (`node --experimental-strip-types --test tests/*.test.ts`) requires explicit file extensions when importing internal TypeScript modules (e.g., `import { calculateLevel } from '../src/lib/gamification.ts'`).
5. **Autoplay Restrictions**:
   - Browsers block audio playback until user interaction occurs. The existing `pomodoroAudio.unlock()` method must be invoked on the initial click event of "Bắt đầu học", "Nghe thử mắng", or mode toggle.

---

## 4. Conclusion & Recommended Architecture

### Proposed File Layout
```
src/
├── features/
│   └── pomodoro/
│       ├── strict-pomodoro-modal.tsx       # Enhanced with Mode Switcher & Store integration
│       ├── meme-cat-stage.tsx              # Mode A: Cutout cat + 0:52 box + lip-sync
│       ├── chill-breathing-stage.tsx       # Mode B: Breathing Orb 4-7-8 + Zen controls (NEW)
│       ├── audio-engine.ts                 # Web Audio alerts & TTS integration
│       ├── lofi-audio-engine.ts            # Procedural Web Audio Lo-Fi synth (NEW)
│       ├── characters-data.ts              # Cat personalities & Northern voice quotes
│       ├── supervisor-arbiter.ts           # Anti-cheat, cooldowns, and discipline scoring
│       └── use-tab-detection.ts            # Visibility & blur detection
├── lib/
│   ├── gamification.ts                     # Pure XP, Level 1-10, Streak & Reward logic (NEW)
│   └── campus-store.ts                     # Shared reactive persistent store (NEW)
tests/
└── gamification.test.ts                    # Unit test suite for XP, Level, Streak calculations (NEW)
```

### Component Architecture Details

#### 1. `chill-breathing-stage.tsx` (Mode B UI)
- **Breathing Orb**:
  - Center orb container with multi-layer neon radial aura (`#3DE8FF` cyan and `#7C5CFF` purple).
  - 19-second breathing cycle:
    - `0s – 4s`: "Hít vào" (Inhale) — orb smoothly expands scale from `1.0` to `1.55` with glowing cyan trail.
    - `4s – 11s`: "Giữ hơi" (Hold) — orb sustains scale at `1.55` with gentle gold/purple resting pulse.
    - `11s – 19s`: "Thở ra" (Exhale) — orb contracts smoothly from `1.55` back to `1.0` with soft indigo fade.
  - Large live countdown for the active phase (`4..1`, `7..1`, `8..1`) and overall session timer (`24:59`).
  - Completed breath cycles count-up badge (e.g. `Chu kỳ 4`).
- **Lo-Fi Soundscape Widget**:
  - Procedural synth controls: Soundscape preset picker (`"Hoàng hôn phòng học"`, `"Mưa đêm thư viện"`, `"Alpha Wave 432Hz"`), volume slider, and mute toggle.

#### 2. `lofi-audio-engine.ts` (Procedural Web Audio Synth)
- Implements `LofiAmbientSynth`:
  - 4-chord generative pad using 5 harmonized sine/triangle oscillators.
  - `BiquadFilterNode` lowpass filter (cutoff 500Hz) modulated by a 0.2Hz LFO for analog tape warmth.
  - Looped procedural noise buffer with bandpass filtering for gentle vinyl warmth.
  - Dynamic breathing swell hooks (`onPhaseChange(phase)`):
    - Inhale: gain ramps from 0.08 to 0.14.
    - Hold: sustains at 0.14.
    - Exhale: gain decays to 0.06.
  - Zero external MP3 downloads — 100% self-contained Web Audio API.

#### 3. In-Modal Switcher in `strict-pomodoro-modal.tsx`
- Adds `focusMode: 'strict_cat' | 'chill_breathing'` state.
- Renders top Neo-Brutal segmented tabs:
  - `🐱 Mèo Mập Giám Thị Cực Đoan`
  - `🫧 Chill Breathing 4-7-8 & Lo-fi`
- Shared timer: `minutes`, `seconds`, `running` continue seamlessly across mode switches.
- Adapts right panel:
  - Mode A: Personality cards (Cô giáo, Sếp khó tính, Tổng tài, Senpai), roast levels, and 2-minute exemption button.
  - Mode B: Breathing guide & soundscape options, zen tips, and peaceful session finish.

#### 4. Shared Reward Integration in `campus-store.ts`
- Dispatches completion event with `{ focusMinutes, xpEarned, disciplineScore, mode }`.
- Automatically increments `studyMinutes`, checks and updates `streak`, recalculates `level` and title (Level 7: "Sinh viên cày thuê"), and syncs with `/dashboard` and `/calendar` simultaneously.

---

## 5. Verification Method

### 5.1 Programmatic Unit Tests
1. **Gamification & Reward Calculation**:
   - Create `tests/gamification.test.ts` verifying:
     - Level 7 evaluates to `"Sinh viên cày thuê"` at 3300–4199 XP.
     - XP progression percentage and title calculation across all 10 tiers.
     - Streak calculation: maintaining streak today, incrementing tomorrow, utilizing Streak Freeze when missed.
     - Session rewards: base XP + discipline bonus for Mode A and zen bonus for Mode B.
   - Run command:
     ```powershell
     npm test
     ```
     Ensure all suites pass with 0 failures.

2. **TypeScript Type Safety**:
   - Run command:
     ```powershell
     npm run typecheck
     ```
     Verify 0 TypeScript compilation errors.

3. **Production Build**:
   - Run command:
     ```powershell
     npm run build
     ```
     Verify Next.js build succeeds with 0 errors across `/dashboard`, `/calendar`, and `/study`.

### 5.2 Functional Inspection Points
1. **In-Modal Switcher**:
   - Open Pomodoro modal; verify top segmented toggle switches between `MemeCatStage` and `ChillBreathingStage` without interrupting the active countdown.
2. **Audio & Voice Verification**:
   - In Mode A: verify "Nghe thử mắng" triggers Northern Vietnamese TTS (`vi-VN-NamMinhNeural` / `vi-VN-HoaiMyNeural`) and mouth overlay scales in sync with speech audio.
   - In Mode B: verify procedural Lo-Fi ambient synth plays gentle warm chord pad and swells with the 4-7-8 breathing phase without external network requests.
3. **Cross-Page Store Sync**:
   - Start and complete a 25-minute session from `/dashboard` or `/calendar`.
   - Verify study minutes increase (+25 min), +XP floats upward, Goal Ring updates from 8.5h to 8.9h, and both `/dashboard` and `/calendar` reflect identical synced stats.

### Invalidation Conditions
- If `StrictPomodoroModal` resets timer duration when toggling modes.
- If Mode B requires external audio files that fail offline or produce 404 errors.
- If Level 7 rank title is not `"Sinh viên cày thuê"`.
- If completing a session on `/dashboard` fails to update the Goal Ring or Streak on `/calendar`.
- If `tailwind.config.js` purges classes from `src/features/pomodoro`.
