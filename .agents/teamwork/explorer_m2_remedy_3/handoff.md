# Milestone 2 Remedy Blueprint: Gamification Level Recalculation & Dynamic Exam Ticket

**Author**: `explorer_m2_remedy_3`  
**Target Milestone**: M2 Remedy (Dashboard S1–S7 Gate Fixes)  
**Parent Orchestrator**: `orchestrator_7` (`5bd8e140-4c1e-4580-b966-e8064ec8f7d3`)  
**Scope**: 
1. `web/src/components/dashboard/deadline-arena.tsx` (XP + Level + RankTitle recalculation)
2. `web/src/components/dashboard/squad-kanban-exam.tsx` (Dynamic Concert-Ticket Exam countdown & date binding)

---

## Executive Summary

This blueprint delivers an exact, production-ready remediation plan for Defect 3 and Defect 4 flagged during the Milestone 2 review gate (`GATE_STATUS.md`):
- **Defect 4 (`deadline-arena.tsx`)**: Ticking off a deadline awarded +50 XP via `update((prev) => ({ xp: prev.xp + 50 }))` without recalculating `level` or `rankTitle`. If a student crossed a level threshold (e.g. 2,680 XP -> 2,730 XP for Level 7 "Sinh viên cày thuê"), their displayed Level and Rank Title remained frozen at the previous level. The remedy integrates `calculateLevelProgress(newXp)` from `@/lib/gamification` directly into the store updater.
- **Defect 3 (`squad-kanban-exam.tsx`)**: The Concert-Ticket Exam card initialized countdown state with arbitrary static literals `{ days: 8, hours: 14, minutes: 22, seconds: 45 }`, hardcoded a static date stub ("Tháng 8, 28, Thứ Năm"), and hardcoded "28/08" in the AI outline modal. The remedy dynamically binds to the nearest upcoming exam from `state.deadlines` (or `dsa-final`), parses the real system date delta, computes live clock countdowns against `Date.now()`, and formats the Vietnamese ticket stub dynamically.

---

## 1. Observation

### 1.1 `deadline-arena.tsx` Level & Rank Title Desynchronization
- **File**: `web/src/components/dashboard/deadline-arena.tsx`
- **Lines 30, 148–179**:
  ```tsx
  // Line 30:
  const { state, update, recordSession } = useCampusStore();
  
  // Lines 148-179:
  const handleToggleDeadline = (deadlineId: string, e: React.MouseEvent) => {
    ...
    if (nextCompleted) {
      triggerConfetti(clickX, clickY);
      setFloatingXp({ id: deadlineId, x: clickX, y: clickY });
      setTimeout(() => setFloatingXp(null), 900);

      // Award XP in store
      recordSession(0, 100);
      update((prev) => ({
        xp: prev.xp + 50,
        deadlines: prev.deadlines.map((d) =>
          d.id === deadlineId ? { ...d, completed: true } : d
        ),
      }));
    } else {
      update((prev) => ({
        deadlines: prev.deadlines.map((d) =>
          d.id === deadlineId ? { ...d, completed: false } : d
        ),
      }));
    }
  };
  ```
- **Direct finding**:
  1. `recordSession(0, 100)` invokes `recordCompletedSession(0, 100)` in `campus-store.ts:613`. Because `minutes === 0`, `calculateSessionXp(0, 100).totalXp === 0`, awarding 0 XP.
  2. The subsequent `update((prev) => ({ xp: prev.xp + 50, ... }))` mutates `prev.xp`, but **does NOT** update `level` or `rankTitle`.
  3. `calculateLevelProgress` from `src/lib/gamification.ts` is not imported or called.

### 1.2 `gamification.ts` Level Progress Contract
- **File**: `web/src/lib/gamification.ts`
- **Lines 82–127**:
  ```typescript
  export interface LevelProgress {
    currentLevel: number;
    rankTitle: string;
    badgeCode: string;
    totalXp: number;
    currentLevelMinXp: number;
    nextLevelMinXp: number;
    xpInCurrentLevel: number;
    xpRequiredForLevel: number;
    progressPercent: number; // 0 - 100
    xpToNextLevel: number;
    isMaxLevel: boolean;
  }

  export function calculateLevelProgress(xp: number): LevelProgress {
    const safeXp = Math.max(0, Math.floor(xp));
    const current = getLevelInfo(safeXp);
    ...
    return {
      currentLevel: current.level,
      rankTitle: current.rankTitle,
      badgeCode: current.badgeCode,
      totalXp: safeXp,
      ...
    };
  }
  ```
- **Direct finding**: Calling `calculateLevelProgress(newXp)` returns `{ currentLevel, rankTitle }`, which maps directly to `CampusOSSharedState.level` and `CampusOSSharedState.rankTitle`.

### 1.3 `squad-kanban-exam.tsx` Static Mock Countdown & Decoupled Exam Date
- **File**: `web/src/components/dashboard/squad-kanban-exam.tsx`
- **Lines 240–269**:
  ```tsx
  const [examCountdown, setExamCountdown] = useState({
    days: 8,
    hours: 14,
    minutes: 22,
    seconds: 45,
  });
  const [prepProgress, setPrepProgress] = useState(62);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setExamCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  ```
- **Lines 590–616 (Date Stub & Exam Title)**:
  ```tsx
  {/* Date Stub */}
  <div className="p-3 rounded-2xl bg-gradient-to-b from-aurora-violet/30 to-aurora-pink/20 border-2 border-aurora-violet/50 text-center shrink-0 shadow-[3px_3px_0px_#000]">
    <span className="block text-[10px] font-mono uppercase tracking-wider text-aurora-cyan">Tháng 8</span>
    <span className="block font-display font-black text-2xl text-foreground">28</span>
    <span className="block text-[9px] font-mono text-muted-foreground">Thứ Năm</span>
  </div>

  {/* Exam Title & Location */}
  <div className="min-w-0 flex-1">
    <div className="flex items-center gap-2 mb-1">
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-aurora-pink/20 text-aurora-pink border border-aurora-pink/40">
        Thi cuối kỳ
      </span>
    </div>
    <h4 className="font-heading font-bold text-sm text-foreground leading-snug">
      CS201 · Cấu trúc dữ liệu & Giải thuật
    </h4>
    <p className="text-xs text-muted-foreground font-sans mt-1">
      09:00 - 11:00 (120 phút) · Phòng 302 · Tự luận
    </p>
  </div>
  ```
- **Line 706 (AI Syllabus Modal subtitle)**:
  ```tsx
  <p className="text-xs text-muted-foreground font-sans">
    Lộ trình 4 tuần nước rút trước kỳ thi 28/08
  </p>
  ```
- **Direct finding**:
  1. The countdown state is hardcoded to an arbitrary literal instead of calculating `diff = targetDueTime - Date.now()`.
  2. The date stub displays `"Tháng 8"`, `"28"`, `"Thứ Năm"`, completely ignoring the user's real calendar date and store data.
  3. In `campus-store.ts:423-432`, `dsa-final` has `dueDate: ${dayPlus8}T09:00:00` and `e-next-7` in `events` has `date: dayPlus8, start: '09:00', end: '11:00', location: 'Phòng 302'`. The component ignores these fields.

---

## 2. Logic Chain

### 2.1 Logic Chain for `deadline-arena.tsx` (XP & Level Recalculation)
1. **Observation**: `state.xp`, `state.level`, and `state.rankTitle` are synchronized across `/dashboard` and `/calendar` via `useCampusStore()`.
2. **Observation**: `calculateLevelProgress(xp)` from `src/lib/gamification.ts` takes an XP number and returns the exact level (`currentLevel: 1..10`) and Vietnamese humorous title (`rankTitle`).
3. **Trace**: When a user completes a deadline in S3, `handleToggleDeadline` adds 50 XP to `prev.xp`.
4. **Defect**: By only returning `{ xp: prev.xp + 50, deadlines: ... }`, `level` and `rankTitle` in the shared store remain unmodified. If `prev.xp` was 2,680 (Level 6), `newXp` becomes 2,730 (Level 7: "Sinh viên cày thuê"), but `state.level` stays 6.
5. **Resolution**: Compute `const newXp = prev.xp + 50; const progress = calculateLevelProgress(newXp);` inside the `update` callback, and return `{ xp: newXp, level: progress.currentLevel, rankTitle: progress.rankTitle, deadlines: ... }`. Also remove redundant `recordSession(0, 100)`.

### 2.2 Logic Chain for `squad-kanban-exam.tsx` (Dynamic Countdown & Date Binding)
1. **Observation**: `state.deadlines` contains upcoming deadlines, including exam items such as `dsa-final` (`CS201 - CTDL & GT`, `dueDate: ${dayPlus8}T09:00:00`) and `prob-exam` (`isExam: true`).
2. **Observation**: `state.events` contains calendar events including `e-next-7` (`Thi Cấu trúc dữ liệu & Giải thuật`, `date: dayPlus8`, `start: '09:00'`, `end: '11:00'`, `location: 'Phòng 302'`).
3. **Defect**: `squad-kanban-exam.tsx` declares an isolated countdown state `{ days: 8, hours: 14, minutes: 22, seconds: 45 }` and hardcodes `"Tháng 8, 28, Thứ Năm"` and `"28/08"`. If the user opens the application in October, the card still shows August 28. If the tab stays open or is backgrounded, `setInterval` decrementing drifts.
4. **Resolution**:
   - Query `state.deadlines` for upcoming incomplete exams (`d.isExam || d.id === 'dsa-final'`), prioritizing `dsa-final` to align with the CS201 AI Syllabus.
   - Parse `dueDate` (e.g. `${dayPlus8}T09:00:00`) into a JavaScript `Date` object (with a clean 8-day dynamic fallback).
   - Maintain a 1-second timestamp ticker `now = Date.now()`.
   - Compute `examCountdown` directly from clock delta: `diff = Math.max(0, examDate.getTime() - now)`, deriving `days`, `hours`, `minutes`, and `seconds`. This eliminates drift and tab-throttling lag.
   - Format the ticket stub dynamically using Vietnamese date names:
     - Month: `Tháng ${examDate.getMonth() + 1}`
     - Day: zero-padded `String(examDate.getDate()).padStart(2, '0')`
     - Weekday: `VIETNAMESE_DAYS[examDate.getDay()]` (`'Thứ Hai'`, `'Thứ Ba'`, ...)
     - Short format: `DD/MM` for the AI modal subtitle (`Lộ trình 4 tuần nước rút trước kỳ thi ${shortDate}`).
   - Look up matching exam event in `state.events` to display real start/end time and room location (`Phòng 302 · Tự luận`).

---

## 3. Caveats

1. **Other Gate Findings**: This blueprint addresses Defect 3 and Defect 4. Defect 1 (`dashboard-hero.tsx` falsy coercion `|| 1`) and Defect 2 (`page.tsx` native `window.prompt`) are complementary fixes handled in parallel.
2. **Exam Precedence**: `dsa-final` is paired specifically with the CS201 Data Structures AI syllabus (modules on Big-O, AVL, Dijkstra, DP). If a student has multiple exams, `dsa-final` is prioritized when incomplete; if `dsa-final` is completed or absent, the nearest upcoming incomplete exam is chosen.
3. **Empty Deadlines Array**: If a user clears all deadlines, `examDate` safely falls back to `new Date(Date.now() + 8 * 86400000)`, preventing runtime crashes or `NaN` values.

---

## 4. Conclusion & Concrete Code Blueprint

### Blueprint 1: `deadline-arena.tsx`

#### Target File
`web/src/components/dashboard/deadline-arena.tsx`

#### Target Line Ranges
- Lines 3–14 (imports)
- Line 30 (hook destructuring)
- Lines 160–175 (`handleToggleDeadline`)

#### Exact Patch: Before vs. After

```diff
--- a/web/src/components/dashboard/deadline-arena.tsx
+++ b/web/src/components/dashboard/deadline-arena.tsx
@@ -2,6 +2,7 @@
 
 import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
 import { useCampusStore } from '@/lib/campus-store';
+import { calculateLevelProgress } from '@/lib/gamification';
 import {
   Clock,
   AlertTriangle,
@@ -27,7 +28,7 @@
 }
 
 export function DeadlineArena({ onStartFocus }: DeadlineArenaProps = {}) {
-  const { state, update, recordSession } = useCampusStore();
+  const { state, update } = useCampusStore();
   const [mounted, setMounted] = useState(false);
   const [floatingXp, setFloatingXp] = useState<{ id: string; x: number; y: number } | null>(null);
   const canvasRef = useRef<HTMLCanvasElement | null>(null);
@@ -161,13 +162,17 @@
       setFloatingXp({ id: deadlineId, x: clickX, y: clickY });
       setTimeout(() => setFloatingXp(null), 900);
 
-      // Award XP in store
-      recordSession(0, 100);
-      update((prev) => ({
-        xp: prev.xp + 50,
-        deadlines: prev.deadlines.map((d) =>
-          d.id === deadlineId ? { ...d, completed: true } : d
-        ),
-      }));
+      // Award XP in store & recalculate Level + Rank Title
+      update((prev) => {
+        const newXp = prev.xp + 50;
+        const progress = calculateLevelProgress(newXp);
+        return {
+          xp: newXp,
+          level: progress.currentLevel,
+          rankTitle: progress.rankTitle,
+          deadlines: prev.deadlines.map((d) =>
+            d.id === deadlineId ? { ...d, completed: true } : d
+          ),
+        };
+      });
     } else {
       update((prev) => ({
```

---

### Blueprint 2: `squad-kanban-exam.tsx`

#### Target File
`web/src/components/dashboard/squad-kanban-exam.tsx`

#### Target Line Ranges
- Lines 18–19 (store imports)
- Lines 240–270 (countdown state & ticker)
- Lines 584–645 (ticket date stub & countdown UI)
- Lines 700–712 (AI modal subtitle date)

#### Detailed Implementation Blueprint

**Step 1: Replace Static State with Dynamic Selector & Clock Ticker**
```tsx
  // ---------------------------------------------------------------------------
  // 4. Concert-Ticket Upcoming Exam Card & Live Dynamic Countdown
  // ---------------------------------------------------------------------------
  const [prepProgress, setPrepProgress] = useState(62);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // 1-second ticker for live countdown without drift
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Nearest upcoming exam from state.deadlines (prioritize dsa-final to match CS201 AI Syllabus)
  const nearestExam = useMemo(() => {
    const deadlines = state.deadlines || [];
    const upcomingExams = deadlines
      .filter((d) => !d.completed && (d.isExam || d.id === 'dsa-final' || d.title.toLowerCase().includes('thi')))
      .map((d) => {
        const time = d.dueDate
          ? new Date(d.dueDate).getTime()
          : d.date
          ? new Date(`${d.date}T09:00:00`).getTime()
          : 0;
        return { item: d, time };
      })
      .filter((e) => e.time > now)
      .sort((a, b) => a.time - b.time);

    // Prefer dsa-final if upcoming to preserve alignment with CS201 outline modal
    const dsaMatch = upcomingExams.find((e) => e.item.id === 'dsa-final' || e.item.course?.includes('CS201'));
    if (dsaMatch) return dsaMatch.item;
    if (upcomingExams.length > 0) return upcomingExams[0]!.item;

    return (
      deadlines.find((d) => d.id === 'dsa-final') ||
      deadlines.find((d) => d.isExam) ||
      null
    );
  }, [state.deadlines, now]);

  // Exam Date resolution with dynamic 8-day fallback
  const examDate = useMemo(() => {
    if (nearestExam?.dueDate) {
      const parsed = new Date(nearestExam.dueDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    if (nearestExam?.date) {
      const parsed = new Date(`${nearestExam.date}T09:00:00`);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date(Date.now() + 8 * 86400000);
  }, [nearestExam]);

  // Real-time clock delta countdown
  const examCountdown = useMemo(() => {
    const diff = Math.max(0, examDate.getTime() - now);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds, diff };
  }, [examDate, now]);

  // Formatted Vietnamese date tokens
  const VIETNAMESE_DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const monthLabel = `Tháng ${examDate.getMonth() + 1}`;
  const dayLabel = String(examDate.getDate()).padStart(2, '0');
  const weekdayLabel = VIETNAMESE_DAYS[examDate.getDay()] || 'Thứ Năm';
  const formattedShortDate = `${dayLabel}/${String(examDate.getMonth() + 1).padStart(2, '0')}`;

  // Matching event from state.events for venue and duration details
  const matchingEvent = useMemo(() => {
    return (
      state.events.find(
        (e) =>
          e.type === 'exam' &&
          (e.id === 'e-next-7' ||
            e.date === nearestExam?.date ||
            (nearestExam?.dueDate && nearestExam.dueDate.startsWith(e.date)) ||
            e.title.toLowerCase().includes('cấu trúc') ||
            e.title.toLowerCase().includes('ctdl'))
      ) || null
    );
  }, [state.events, nearestExam]);
```

**Step 2: Update Ticket Date Stub in JSX (Lines 590–618)**
```tsx
              <div className="flex items-start gap-4">
                {/* Date Stub - Dynamically computed */}
                <div className="p-3 rounded-2xl bg-gradient-to-b from-aurora-violet/30 to-aurora-pink/20 border-2 border-aurora-violet/50 text-center shrink-0 shadow-[3px_3px_0px_#000]">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-aurora-cyan">
                    {monthLabel}
                  </span>
                  <span className="block font-display font-black text-2xl text-foreground">
                    {dayLabel}
                  </span>
                  <span className="block text-[9px] font-mono text-muted-foreground">
                    {weekdayLabel}
                  </span>
                </div>

                {/* Exam Title & Location */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-aurora-pink/20 text-aurora-pink border border-aurora-pink/40">
                      {nearestExam?.title.toLowerCase().includes('cuối kỳ') ? 'Thi cuối kỳ' : 'Kỳ thi sắp tới'}
                    </span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-foreground leading-snug">
                    {nearestExam?.course
                      ? `${nearestExam.course} · ${nearestExam.title}`
                      : nearestExam?.title || 'CS201 · Cấu trúc dữ liệu & Giải thuật'}
                  </h4>
                  <p className="text-xs text-muted-foreground font-sans mt-1">
                    {matchingEvent
                      ? `${matchingEvent.start} - ${matchingEvent.end} · ${matchingEvent.location || 'Phòng 302'} · ${matchingEvent.description || 'Tự luận'}`
                      : '09:00 - 11:00 (120 phút) · Phòng 302 · Tự luận'}
                  </p>
                </div>
              </div>
```

**Step 3: Update AI Outline Modal Subtitle (Line 706)**
```tsx
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-aurora-lime text-black font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-foreground">
                    ĐỀ CƯƠNG ÔN TẬP CS201 (AI COPILOT)
                  </h3>
                  <p className="text-xs text-muted-foreground font-sans">
                    Lộ trình 4 tuần nước rút trước kỳ thi {formattedShortDate}
                  </p>
                </div>
              </div>
```

---

## 5. Verification Method

### 5.1 Programmatic Verification Commands
In `web/`:
```powershell
cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
npm run typecheck
npm test
```
Expected output:
- `npm run typecheck`: 0 errors.
- `npm test`: 33 passed, 0 failed.

### 5.2 Independent Verification Invariants
1. **Level Up Invariant on Deadline Completion**:
   - Initialize state with `state.xp = 2680` (Level 6: "Chiến thần thuyết trình").
   - Click deadline tick circle in `DeadlineArena` (+50 XP -> 2,730 XP).
   - Verify `state.xp === 2730`.
   - Verify `state.level === 7`.
   - Verify `state.rankTitle === 'Sinh viên cày thuê'`.
   - Invalidation condition: `state.level` remaining 6 when `state.xp >= 2700`.

2. **Exam Ticket Date Binding Invariant**:
   - Seed `state.deadlines` with `dsa-final` whose `dueDate` is anchored to `${dayPlus8}T09:00:00`.
   - Inspect `SquadKanbanExam` rendered output:
     - `monthLabel` must match `examDate.getMonth() + 1`.
     - `dayLabel` must match `examDate.getDate()`.
     - `weekdayLabel` must match `VIETNAMESE_DAYS[examDate.getDay()]`.
     - `examCountdown.days` must match `Math.floor((examDate.getTime() - Date.now()) / 86400000)`.
   - Invalidation condition: Static date stub displaying "Tháng 8, 28" when current date is in a different month.
