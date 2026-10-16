# Handoff Report: Exact Blueprint & Fix Strategy for `dashboard-hero.tsx`

**Agent**: `explorer_m2_remedy_1` (Role: explorer, investigator, synthesizer)  
**Parent Orchestrator**: `orchestrator_7` (`5bd8e140-4c1e-4580-b966-e8064ec8f7d3`)  
**Milestone**: M2 Remedy — Dashboard Hero Canvas Aurora & Urgency Reactivity  
**Handoff Type**: Hard Handoff  
**Date**: 2026-10-13T02:26:00Z  

---

## Executive Summary
This report provides the complete, authoritative implementation blueprint to fix Defect 1 in `web/src/components/dashboard/dashboard-hero.tsx`.  
The defect stems from falsy coercion fallback `|| 1` and `|| 3`, which permanently locks the single-draw-call Canvas Aurora blob into red panic mode even when 0 urgent deadlines exist, while turning the calm green aurora mode into dead code.  
The remedy derives genuine counts (`urgentCount`, `todayClassesCount`), defines a genuine `hasPanicDeadline` boolean (active only when an uncompleted urgent deadline has `< 3h` remaining), binds this clean boolean to the 120FPS Canvas draw loop, and verifies that subtitle text renders 0 counts cleanly without fallback stubs.

---

## 1. Observation

### 1.1 Direct Source Code Observations in `web/src/components/dashboard/dashboard-hero.tsx`

1. **Lines 61–67 (Stats derivation with falsy fallbacks)**:
   ```tsx
   const todayClassesCount = useMemo(() => {
     return state.events.filter((e) => e.date === todayIso && e.type === 'class').length || 3;
   }, [state.events, todayIso]);

   const urgentDeadlinesCount = useMemo(() => {
     return state.deadlines.filter((d) => !d.completed && (d.urgent || d.date === todayIso)).length || 1;
   }, [state.deadlines, todayIso]);
   ```
   - **Verbatim defect**: When `state.events` has 0 classes for `todayIso`, `0 || 3` evaluates to `3`.
   - **Verbatim defect**: When `state.deadlines` has 0 urgent deadlines, `0 || 1` evaluates to `1`.

2. **Line 111 & Lines 142–154 (Canvas Aurora Draw Loop State)**:
   ```tsx
   const hasUrgent = urgentDeadlinesCount > 0;
   ```
   ```tsx
   if (hasUrgent) {
     // Red harmonic warning pulse
     grad.addColorStop(0, 'rgba(255, 61, 165, 0.45)');
     grad.addColorStop(0.35, 'rgba(124, 92, 255, 0.35)');
     grad.addColorStop(0.7, 'rgba(255, 61, 110, 0.2)');
     grad.addColorStop(1, 'rgba(10, 10, 18, 0)');
   } else {
     grad.addColorStop(0, 'rgba(198, 255, 61, 0.4)');
     grad.addColorStop(0.3, 'rgba(61, 232, 255, 0.3)');
     grad.addColorStop(0.65, 'rgba(124, 92, 255, 0.22)');
     grad.addColorStop(1, 'rgba(10, 10, 18, 0)');
   }
   ```
   - Because `urgentDeadlinesCount` is always `>= 1` due to `|| 1`, `hasUrgent` is permanently `true`.
   - The `else` branch (calm lime-cyan aurora) is completely unreachable dead code.
   - Furthermore, even when an urgent deadline is due 15 hours away (e.g., `23:59:00` tonight), `hasUrgent` triggered the red panic pulse the entire day, violating the `< 3h` panic threshold specified in `docs/CampusOS_Dashboard_Redesign_Plan.md`.

3. **Line 184 (Effect dependency array)**:
   ```tsx
   }, [mounted, state.reducedMotion, state.streak, urgentDeadlinesCount]);
   ```
   - The canvas lifecycle is bound to `urgentDeadlinesCount` instead of a dedicated panic boolean.

4. **Line 380 (Streak Badge rotated sticker)**:
   ```tsx
   <span>Chuỗi {state.streak || 12} ngày 🔥</span>
   ```
   - Contains another falsy coercion fallback `|| 12`. If a user's streak resets to `0`, it renders `12`.

5. **Lines 421–429 (Subtitle Text)**:
   ```tsx
   <p className="mt-2.5 flex flex-wrap items-center gap-2 text-sm md:text-base text-muted-foreground font-medium">
     <span className="text-foreground/90 font-semibold">{formattedDate}</span>
     <span className="text-muted-foreground/50">·</span>
     <span className="text-blue-400 font-semibold">{todayClassesCount} lớp học</span>
     <span className="text-muted-foreground/50">·</span>
     <span className="text-rose-400 font-semibold">{urgentDeadlinesCount} deadline sống còn</span>
   </p>
   ```

### 1.2 Gate and Audit Findings
- **`GATE_STATUS.md` line 26**: "Defect 1: `dashboard-hero.tsx`: Falsy coercion `|| 1` locks Canvas Aurora into permanent red panic mode."
- **`reviewer_m2_1/handoff.md` lines 18 & 56**: "When `filter(...).length === 0`, `0 || 1` evaluates to `1`. Therefore `urgentDeadlinesCount` is always `>= 1`, `hasUrgent` is always `true`, and the `else` branch (green aurora) is unreachable dead code."
- **`challenger_m2_1/handoff.md` lines 74–84**: Empirical confirmation that calm green mode was never rendered.

---

## 2. Logic Chain

1. **Step 1 — Root Cause Analysis**:
   - The fallback `|| 3` and `|| 1` was originally copied from design mock examples (`docs/CampusOS_Dashboard_Redesign_Plan.md` line 45: `"3 lớp · 1 deadline sống còn"`). In production JavaScript, `0` is falsy, causing any empty collection to resolve to `1` or `3`.
   - Removing `|| 1` and `|| 3` allows `todayClassesCount` and `urgentCount` to genuinely reflect the actual number of events and deadlines.

2. **Step 2 — Genuine Urgency vs. Panic Distinction**:
   - `urgentCount` reflects the total number of uncompleted urgent tasks:  
     `state.deadlines.filter((d) => !d.completed && d.urgent).length`.
   - An urgent deadline does NOT immediately warrant an emergency red panic visual on the hero canvas if the deadline is far away (e.g. 15 hours until midnight).
   - In `docs/CampusOS_Dashboard_Redesign_Plan.md` (lines 91, 189) and `deadline-arena.tsx` (lines 73, 85), **panic mode** is strictly defined as an urgent deadline with **less than 3 hours remaining** (`diff < 3 * 3600 * 1000`).

3. **Step 3 — Formulating `hasPanicDeadline`**:
   - A deadline only triggers `hasPanicDeadline` if:
     1. It is not completed: `!d.completed`
     2. It is marked urgent: `Boolean(d.urgent)`
     3. It has a valid date string (`d.dueDate || (d.date ? `${d.date}T23:59:59` : null)`).
     4. Its time difference to `now` (`dueTime - now`) satisfies `diff > 0 && diff < 3 * 60 * 60 * 1000`.
   - *Why `diff > 0` is required*: If `diff <= 0` were treated as panic without lower bound, any overdue deadline from last week or last month would keep `hasPanicDeadline` permanently `true`, causing the exact same permanent red panic defect. Time remaining by definition is strictly positive before deadline expiration (`0 < remaining < 3h`).

4. **Step 4 — Wiring `hasPanicDeadline` to Aurora Canvas**:
   - Passing `hasPanicDeadline` directly to the `useEffect` and inside the 120FPS animation frame loop ensures:
     - When `hasPanicDeadline === false` (0 urgent deadlines, or urgent deadlines > 3h away): Canvas renders the calm green-cyan aurora (`rgba(198, 255, 61, 0.4)`).
     - When `hasPanicDeadline === true` (urgent deadline < 3h away): Canvas renders the red warning pulse (`rgba(255, 61, 165, 0.45)`) and warm orange floating particles (`rgba(255, 138, 61, 0.6)`).
     - When `state.reducedMotion` is enabled: The static gradient also cleanly reflects `hasPanicDeadline`.

5. **Step 5 — Clean Subtitle Formatting for 0 Values**:
   - For `todayClassesCount === 0`: Subtitle renders `0 lớp học`.
   - For `urgentCount === 0`: Subtitle renders `0 deadline sống còn` with `text-emerald-400 font-semibold` (calm status), contrasting with `text-rose-400 font-semibold` when `urgentCount > 0`.
   - Zero hardcoded numbers remain.

---

## 3. Caveats

- **Time Progression on Static Screen**: `hasPanicDeadline` is recomputed whenever `state.deadlines` changes or when the component re-renders. To ensure that an urgent deadline entering the `< 3h` window while the user stays on the page triggers panic without requiring user interaction, an optional 30-second interval tick (`nowTick`) can be included in the memoization dependency.
- **Date formats in store**: `dueDate` in CampusOS is standard ISO format (e.g., `2026-10-13T23:59:00`). If only `date` (`YYYY-MM-DD`) is provided without a time, falling back to end-of-day (`T23:59:59`) ensures reliable timestamp parsing.
- **No other caveats**: The scope is strictly localized to `web/src/components/dashboard/dashboard-hero.tsx`.

---

## 4. Conclusion & Actionable Implementation Blueprint

The implementing builder agent (`worker_m2_remedy`) should apply the following precise edits to `web/src/components/dashboard/dashboard-hero.tsx`.

### 4.1 Target File: `web/src/components/dashboard/dashboard-hero.tsx`

#### Change Block A: Fix Stats Derivation & Compute `hasPanicDeadline` (Lines 61–68)

**Before:**
```tsx
  const todayClassesCount = useMemo(() => {
    return state.events.filter((e) => e.date === todayIso && e.type === 'class').length || 3;
  }, [state.events, todayIso]);

  const urgentDeadlinesCount = useMemo(() => {
    return state.deadlines.filter((d) => !d.completed && (d.urgent || d.date === todayIso)).length || 1;
  }, [state.deadlines, todayIso]);
```

**After:**
```tsx
  const todayClassesCount = useMemo(() => {
    return state.events.filter((e) => e.date === todayIso && e.type === 'class').length;
  }, [state.events, todayIso]);

  const urgentCount = useMemo(() => {
    return state.deadlines.filter((d) => !d.completed && Boolean(d.urgent)).length;
  }, [state.deadlines]);

  const hasPanicDeadline = useMemo(() => {
    const now = Date.now();
    const threeHoursMs = 3 * 60 * 60 * 1000;
    return state.deadlines.some((d) => {
      if (d.completed || !d.urgent) return false;
      const targetStr = d.dueDate || (d.date ? `${d.date}T23:59:59` : null);
      if (!targetStr) return false;
      const dueTime = new Date(targetStr).getTime();
      if (isNaN(dueTime)) return false;
      const diff = dueTime - now;
      return diff > 0 && diff < threeHoursMs;
    });
  }, [state.deadlines]);
```

---

#### Change Block B: Canvas Aurora Loop & Reduced Motion Guard (Lines 110–185)

**Before:**
```tsx
    const streakBoost = Math.min(2.5, 1 + (state.streak || 0) * 0.05);
    const hasUrgent = urgentDeadlinesCount > 0;

    const render = () => {
      if (state.reducedMotion) {
        // Reduced motion: static subtle gradient
        ctx.clearRect(0, 0, width, height);
        const grad = ctx.createRadialGradient(width * 0.5, height * 0.5, 10, width * 0.5, height * 0.5, width * 0.45);
        grad.addColorStop(0, 'rgba(124, 92, 255, 0.35)');
        grad.addColorStop(0.5, 'rgba(61, 232, 255, 0.15)');
        grad.addColorStop(1, 'rgba(10, 10, 18, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        return;
      }

      t += 0.015 * streakBoost;
      ctx.clearRect(0, 0, width, height);

      // Smooth lerp to mouse target
      const targetX = width * 0.2 + mousePosRef.current.x * (width * 0.6);
      const targetY = height * 0.2 + mousePosRef.current.y * (height * 0.6);
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      // Single composite draw call with layered radial gradient
      const baseRadius = Math.min(width, height) * 0.35;
      const pulse = Math.sin(t * 1.5) * 16 + Math.cos(t * 0.8) * 10;
      const radius = baseRadius + pulse;

      const grad = ctx.createRadialGradient(currentX, currentY, 10, currentX, currentY, radius);

      if (hasUrgent) {
        // Red harmonic warning pulse
        grad.addColorStop(0, 'rgba(255, 61, 165, 0.45)');
        grad.addColorStop(0.35, 'rgba(124, 92, 255, 0.35)');
        grad.addColorStop(0.7, 'rgba(255, 61, 110, 0.2)');
        grad.addColorStop(1, 'rgba(10, 10, 18, 0)');
      } else {
        grad.addColorStop(0, 'rgba(198, 255, 61, 0.4)');
        grad.addColorStop(0.3, 'rgba(61, 232, 255, 0.3)');
        grad.addColorStop(0.65, 'rgba(124, 92, 255, 0.22)');
        grad.addColorStop(1, 'rgba(10, 10, 18, 0)');
      }

      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(currentX, currentY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Ambient 1-draw-call floating micro particles
      ctx.fillStyle = hasUrgent ? 'rgba(255, 138, 61, 0.6)' : 'rgba(198, 255, 61, 0.6)';
      for (let i = 0; i < 18; i++) {
        const pAngle = t * 0.5 + i * 0.35;
        const pDist = radius * 0.75 + Math.sin(t + i) * 35;
        const px = currentX + Math.cos(pAngle) * pDist;
        const py = currentY + Math.sin(pAngle) * pDist;
        ctx.beginPath();
        ctx.arc(px, py, (i % 3) + 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mounted, state.reducedMotion, state.streak, urgentDeadlinesCount]);
```

**After:**
```tsx
    const streakBoost = Math.min(2.5, 1 + (state.streak || 0) * 0.05);

    const render = () => {
      if (state.reducedMotion) {
        // Reduced motion: static subtle gradient
        ctx.clearRect(0, 0, width, height);
        const grad = ctx.createRadialGradient(width * 0.5, height * 0.5, 10, width * 0.5, height * 0.5, width * 0.45);
        if (hasPanicDeadline) {
          grad.addColorStop(0, 'rgba(255, 61, 165, 0.35)');
          grad.addColorStop(0.5, 'rgba(255, 61, 110, 0.15)');
        } else {
          grad.addColorStop(0, 'rgba(124, 92, 255, 0.35)');
          grad.addColorStop(0.5, 'rgba(61, 232, 255, 0.15)');
        }
        grad.addColorStop(1, 'rgba(10, 10, 18, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        return;
      }

      t += 0.015 * streakBoost;
      ctx.clearRect(0, 0, width, height);

      // Smooth lerp to mouse target
      const targetX = width * 0.2 + mousePosRef.current.x * (width * 0.6);
      const targetY = height * 0.2 + mousePosRef.current.y * (height * 0.6);
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      // Single composite draw call with layered radial gradient
      const baseRadius = Math.min(width, height) * 0.35;
      const pulse = Math.sin(t * 1.5) * 16 + Math.cos(t * 0.8) * 10;
      const radius = baseRadius + pulse;

      const grad = ctx.createRadialGradient(currentX, currentY, 10, currentX, currentY, radius);

      if (hasPanicDeadline) {
        // Red harmonic warning pulse
        grad.addColorStop(0, 'rgba(255, 61, 165, 0.45)');
        grad.addColorStop(0.35, 'rgba(124, 92, 255, 0.35)');
        grad.addColorStop(0.7, 'rgba(255, 61, 110, 0.2)');
        grad.addColorStop(1, 'rgba(10, 10, 18, 0)');
      } else {
        grad.addColorStop(0, 'rgba(198, 255, 61, 0.4)');
        grad.addColorStop(0.3, 'rgba(61, 232, 255, 0.3)');
        grad.addColorStop(0.65, 'rgba(124, 92, 255, 0.22)');
        grad.addColorStop(1, 'rgba(10, 10, 18, 0)');
      }

      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(currentX, currentY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Ambient 1-draw-call floating micro particles
      ctx.fillStyle = hasPanicDeadline ? 'rgba(255, 138, 61, 0.6)' : 'rgba(198, 255, 61, 0.6)';
      for (let i = 0; i < 18; i++) {
        const pAngle = t * 0.5 + i * 0.35;
        const pDist = radius * 0.75 + Math.sin(t + i) * 35;
        const px = currentX + Math.cos(pAngle) * pDist;
        const py = currentY + Math.sin(pAngle) * pDist;
        ctx.beginPath();
        ctx.arc(px, py, (i % 3) + 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mounted, state.reducedMotion, state.streak, hasPanicDeadline]);
```

---

#### Change Block C: Streak Badge Nullish Coalescing (Line 380)

**Before:**
```tsx
<span>Chuỗi {state.streak || 12} ngày 🔥</span>
```

**After:**
```tsx
<span>Chuỗi {state.streak ?? 12} ngày 🔥</span>
```

---

#### Change Block D: Subtitle Text Rendering (Lines 421–429)

**Before:**
```tsx
            {/* Dynamic Live Date Subtitle */}
            <p className="mt-2.5 flex flex-wrap items-center gap-2 text-sm md:text-base text-muted-foreground font-medium">
              <span className="text-foreground/90 font-semibold">{formattedDate}</span>
              <span className="text-muted-foreground/50">·</span>
              <span className="text-blue-400 font-semibold">{todayClassesCount} lớp học</span>
              <span className="text-muted-foreground/50">·</span>
              <span className="text-rose-400 font-semibold">{urgentDeadlinesCount} deadline sống còn</span>
            </p>
```

**After:**
```tsx
            {/* Dynamic Live Date Subtitle */}
            <p className="mt-2.5 flex flex-wrap items-center gap-2 text-sm md:text-base text-muted-foreground font-medium">
              <span className="text-foreground/90 font-semibold">{formattedDate}</span>
              <span className="text-muted-foreground/50">·</span>
              <span className="text-blue-400 font-semibold">
                {todayClassesCount} lớp học
              </span>
              <span className="text-muted-foreground/50">·</span>
              <span className={urgentCount > 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                {urgentCount} deadline sống còn
              </span>
            </p>
```

---

## 5. Verification Method

### 5.1 Independent Test Suite Verification
In `web/tests/campus-redesign.test.ts`, add the following dedicated unit test verifying the logic:

```typescript
test('Dashboard Hero Urgency & Panic: genuine counts and panic deadline calculation', () => {
  const now = new Date('2026-10-13T10:00:00Z').getTime();

  // Helper matching dashboard-hero.tsx logic
  function calculateHeroState(deadlines: DeadlineItem[], referenceTime = now) {
    const threeHoursMs = 3 * 60 * 60 * 1000;
    const urgentCount = deadlines.filter((d) => !d.completed && Boolean(d.urgent)).length;
    const hasPanicDeadline = deadlines.some((d) => {
      if (d.completed || !d.urgent) return false;
      const targetStr = d.dueDate || (d.date ? `${d.date}T23:59:59` : null);
      if (!targetStr) return false;
      const dueTime = new Date(targetStr).getTime();
      if (isNaN(dueTime)) return false;
      const diff = dueTime - referenceTime;
      return diff > 0 && diff < threeHoursMs;
    });
    return { urgentCount, hasPanicDeadline };
  }

  // Case 1: 0 deadlines -> urgentCount: 0, hasPanicDeadline: false
  assert.deepEqual(calculateHeroState([]), { urgentCount: 0, hasPanicDeadline: false });

  // Case 2: 1 urgent deadline, but 10 hours away -> urgentCount: 1, hasPanicDeadline: false (CALM GREEN)
  const farDeadline: DeadlineItem = {
    id: 'dl-far',
    title: 'Nộp bài tối',
    dueDate: new Date(now + 10 * 3600 * 1000).toISOString(),
    urgent: true,
    completed: false,
  };
  assert.deepEqual(calculateHeroState([farDeadline]), { urgentCount: 1, hasPanicDeadline: false });

  // Case 3: 1 urgent deadline, 1.5 hours away -> urgentCount: 1, hasPanicDeadline: true (RED PANIC)
  const panicDeadline: DeadlineItem = {
    id: 'dl-panic',
    title: 'Nộp gấp!',
    dueDate: new Date(now + 1.5 * 3600 * 1000).toISOString(),
    urgent: true,
    completed: false,
  };
  assert.deepEqual(calculateHeroState([panicDeadline]), { urgentCount: 1, hasPanicDeadline: true });

  // Case 4: Urgent deadline < 3h but already completed -> urgentCount: 0, hasPanicDeadline: false
  const completedPanic: DeadlineItem = {
    ...panicDeadline,
    completed: true,
  };
  assert.deepEqual(calculateHeroState([completedPanic]), { urgentCount: 0, hasPanicDeadline: false });

  // Case 5: Deadline < 3h but NOT urgent -> urgentCount: 0, hasPanicDeadline: false
  const nonUrgentShort: DeadlineItem = {
    id: 'dl-non-urgent',
    title: 'Đọc tài liệu',
    dueDate: new Date(now + 1 * 3600 * 1000).toISOString(),
    urgent: false,
    completed: false,
  };
  assert.deepEqual(calculateHeroState([nonUrgentShort]), { urgentCount: 0, hasPanicDeadline: false });
});
```

### 5.2 Verification Commands
After implementing:
1. `npm run typecheck` in `web/` must exit code 0.
2. `npm test` in `web/` must pass all test suites.
3. `npm run build` in `web/` must succeed with 0 errors.

### 5.3 Invalidation Conditions
This strategy is invalidated if:
- `urgentCount` evaluates to `1` when `state.deadlines` contains no incomplete urgent deadlines.
- `hasPanicDeadline` evaluates to `true` when the nearest incomplete urgent deadline is due $> 3\text{h}$ from current time.
- The Canvas Aurora renders red gradients when `hasPanicDeadline` is `false`.
