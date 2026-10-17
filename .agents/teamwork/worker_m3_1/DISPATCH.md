## 2026-10-17T01:44:50Z
You are worker_m3_1.
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_m3_1

MANDATORY FIRST STEP:
Read the authoritative user request at: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (specifically header ## 2026-10-17T00:51:59Z).
Also read:
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\spec_miner_survey_3\handoff.md (§ 2.4 & § 3)
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_survey_1\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusive Write Ownership:
You exclusively own and may create/modify:
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\extension\ai\webcam-tracker.js
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\src\features\pomodoro\ai-webcam-modal.tsx
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\src\features\pomodoro\use-webcam-tracking.ts
- d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web\tests\ai-webcam-tracking.test.ts
Do NOT touch or modify any other files.

Mission:
Implement Milestone 3: AI Webcam Face Tracking (MediaPipe Face Mesh algorithms, EAR, Head Pose, settings toggle, and tests).

1. `extension/ai/webcam-tracker.js`:
   - Pure, robust mathematical implementations of:
     - `calculateEyeAspectRatio(eyePoints)`: Euclidean distance ratio formula.
     - `detectDrowsiness(ear, durationMs, threshold = 0.20, requiredMs = 10000)`: Evaluates if eyes closed continuously > 10s.
     - `estimateHeadPose(landmarks)`: Approximates yaw, pitch, roll angles.
     - `detectLookingAway(angles, durationMs, requiredMs = 10000)`: Evaluates if yaw > 30° or pitch < -25° continuously > 10s.
   - `WebcamFaceMonitor` engine class managing frame processing, duration accumulator, event callbacks (`onSleepDetected`, `onFaceAwayDetected`, `onNormal`), and toggle flags.
   - Throttled loop (10-15fps) keeping CPU usage minimal.
   - 100% in-memory local processing guarantee (zero video upload).
2. `web/src/features/pomodoro/use-webcam-tracking.ts`:
   - React hook managing webcam media stream, camera permissions, active monitoring, and callback integration with `SupervisorArbiter` and `characters-data.ts` (triggers Vietnamese TTS scolding for `sleep` and `face_away`).
3. `web/src/features/pomodoro/ai-webcam-modal.tsx`:
   - Cyber-Glass themed modal with video preview canvas, live EAR & Head Pose telemetry gauges, toggle switch, and privacy assurance banner.
4. `web/tests/ai-webcam-tracking.test.ts`:
   - Comprehensive test suite covering:
     - Eye Aspect Ratio calculation on open eyes (~0.30) vs closed eyes (~0.12).
     - Sleeping detection duration thresholds (< 10s normal, >= 10s triggers sleep alert).
     - Head Pose yaw and pitch calculation.
     - Looking away detection duration thresholds (< 10s normal, >= 10s triggers look-away alert).
     - Monitor start, stop, pause, and toggle lifecycle.
5. Verification:
   Run in `web/`:
   `node --experimental-strip-types --test tests/ai-webcam-tracking.test.ts`
   `npm test`
   `npm run typecheck`
   Ensure all tests pass 100% with 0 errors.
6. Document changes and test results in `handoff.md` in your working directory. Send completion message when done.
