# Remediation Blueprint: Dashboard Task Quick Capture & Voice Brain-Dump Integration (Defect 2)

**Agent**: `explorer_m2_remedy_2`  
**Parent Orchestrator**: `orchestrator_7` (`5bd8e140-4c1e-4580-b966-e8064ec8f7d3`)  
**Target Files**: `web/src/app/(main)/dashboard/page.tsx`, `web/src/components/dashboard/dashboard-hero.tsx`  
**Status**: COMPLETE (Read-Only Blueprint)  
**Date**: 2026-10-13T02:25:00Z  

---

## Executive Summary

This blueprint delivers an exact, production-ready fix strategy for **Defect 2** identified in `GATE_STATUS.md`:
1. **Defect**: Native blocking `window.prompt` is invoked during quick task creation in `web/src/app/(main)/dashboard/page.tsx:81`, which blocks the browser UI thread, freezes 120FPS animations and Web Audio synthesis, and violates Neo-Brutal Aurora design principles and accessibility standards.
2. **Defect**: When speech is recognized in `web/src/components/dashboard/dashboard-hero.tsx` (Voice Brain-Dump via Web Speech API or fallback modal), the transcript is dispatched via `new CustomEvent('campusos:quick-create-task', { detail: { initialTitle: transcript } })`. However, `dashboard/page.tsx:128` disregards `detail.initialTitle` completely and invokes `handleQuickCreateTask()`, forcing the user to re-type their task into a blank browser prompt.
3. **Remedy**:
   - Create a dedicated, accessible, Neo-Brutal inline modal component: `QuickTaskModal` (`web/src/components/dashboard/quick-task-modal.tsx`).
   - Wire `QuickTaskModal` into `dashboard/page.tsx` via dynamic import (`{ ssr: false }`).
   - Support `title`, `course`, `dueDate`, `dueTime`, and `urgent` toggle (Panic Mode) with preset chips and keyboard ergonomics (`Enter` to submit, `Esc` to close).
   - Listen for `campusos:quick-create-task` and seamlessly pre-fill the modal with `detail.initialTitle` from Voice Brain-Dump, displaying an intuitive badge: `🎙️ Điền từ Voice Brain-Dump`.

---

## 1. Observation

### 1.1 Direct Source Code Observations in `web/src/app/(main)/dashboard/page.tsx`

1. **Lines 78–103 (`handleQuickCreateTask`)**:
   ```tsx
   // ---------------------------------------------------------------------------
   // Quick Task Creation (N trigger)
   // ---------------------------------------------------------------------------
   const handleQuickCreateTask = useCallback(() => {
     if (typeof window !== 'undefined') {
       const title = window.prompt('Nhập nhanh tên nhiệm vụ / deadline mới:');
       if (title && title.trim()) {
         const todayStr = new Date().toISOString().split('T')[0]!;
         update((prev) => ({
           deadlines: [
             {
               id: `quick-${Date.now()}`,
               title: title.trim(),
               course: 'Nhiệm vụ nhanh',
               dueDate: `${todayStr}T23:59:00`,
               date: todayStr,
               displayDate: 'Hôm nay · 23:59',
               urgent: true,
               completed: false,
               isExam: false,
             },
             ...prev.deadlines,
           ],
         }));
         setToastNotification(`Đã tạo nhanh nhiệm vụ: "${title.trim()}"`);
         setTimeout(() => setToastNotification(null), 4000);
       }
     }
   }, [update]);
   ```
   - **Observation**: `window.prompt` is synchronous and thread-blocking. It stops JavaScript execution, freezes requestAnimationFrame loops, and halts Web Audio synthesis until the prompt is resolved.
   - **Observation**: Fields are hardcoded: `course` is always `'Nhiệm vụ nhanh'`, `displayDate` is `'Hôm nay · 23:59'`, and `urgent` is unconditionally `true`.

2. **Lines 108–118 (`useGlobalShortcuts`)**:
   ```tsx
   useGlobalShortcuts({
     onToggleCommandPalette: () => setCommandPaletteOpen((prev) => !prev),
     onToggleShortcutsModal: () => setShortcutsModalOpen((prev) => !prev),
     onQuickCreateTask: handleQuickCreateTask,
     onTriggerFocusMode: () => handleLaunchFocus(25),
     onEscape: () => {
       setFocusModalOpen(false);
       setCommandPaletteOpen(false);
       setShortcutsModalOpen(false);
     },
   });
   ```
   - **Observation**: Pressing shortcut key `N` triggers `handleQuickCreateTask`, firing `window.prompt`.
   - **Observation**: `onEscape` does not manage task modal dismissal state.

3. **Lines 128–143 (Event Listener Disconnect)**:
   ```tsx
   const onQuickTaskEvt = () => handleQuickCreateTask();
   ...
   window.addEventListener('campusos:quick-create-task', onQuickTaskEvt);
   ```
   - **Observation**: `onQuickTaskEvt` takes 0 arguments and ignores `(e as CustomEvent).detail`. Any payload dispatched via `campusos:quick-create-task` is completely discarded.

4. **Line 184 (`DashboardHero` Prop)**:
   ```tsx
   <DashboardHero
     onStartFocus={() => handleLaunchFocus(25)}
     onAddTask={handleQuickCreateTask}
   />
   ```
   - **Observation**: Clicking the "+ Thêm nhiệm vụ" button inside Hero directly invokes `handleQuickCreateTask`, launching `window.prompt`.

### 1.2 Direct Source Code Observations in `web/src/components/dashboard/dashboard-hero.tsx`

1. **Lines 319–331 (Speech Recognition Handler)**:
   ```tsx
   recognition.onresult = (event: any) => {
     const transcript = event.results?.[0]?.[0]?.transcript;
     if (transcript) {
       setVoiceNotice(`Đã nhận diện: "${transcript}"`);
       // Dispatch quick task create
       window.dispatchEvent(
         new CustomEvent('campusos:quick-create-task', {
           detail: { initialTitle: transcript },
         })
       );
     }
     setIsListening(false);
   };
   ```
   - **Observation**: `dashboard-hero.tsx` accurately captures spoken Vietnamese words and dispatches `campusos:quick-create-task` with `detail: { initialTitle: transcript }`.

2. **Lines 349–359 (Voice Fallback Modal Handler)**:
   ```tsx
   const handleFallbackSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!fallbackText.trim()) return;
     window.dispatchEvent(
       new CustomEvent('campusos:quick-create-task', {
         detail: { initialTitle: fallbackText.trim() },
       })
     );
     setFallbackText('');
     setVoiceFallbackOpen(false);
   };
   ```
   - **Observation**: Fallback text entry also dispatches `campusos:quick-create-task` with `detail: { initialTitle: fallbackText.trim() }`.

3. **Lines 473–487 (Hero CTA Button)**:
   ```tsx
   <Button
     size="lg"
     variant="outline"
     onClick={() => {
       if (onAddTask) {
         onAddTask();
       } else {
         window.dispatchEvent(new CustomEvent('campusos:quick-create-task'));
       }
     }}
     ...
   >
     <Plus className="mr-2 h-4 w-4" />
     Thêm nhiệm vụ
   </Button>
   ```

### 1.3 Other Dispatches in Codebase
Grep search confirmed `campusos:quick-create-task` is dispatched from:
- `web/src/components/dashboard/deadline-arena.tsx:224`: "+ Thêm deadline" button.
- `web/src/components/common/command-palette.tsx:102`: "Thêm nhiệm vụ mới" command item.
- `web/src/components/common/use-global-shortcuts.ts:97`: Global shortcut `N`.

---

## 2. Logic Chain

1. **Step 1 — UI Thread Interruption**:
   - `window.prompt` is an unstyled, blocking browser primitive.
   - While open, it freezes the JavaScript main event loop.
   - In a 120FPS application featuring Canvas2D aurora shaders and Web Audio ambient synthesis (Lo-fi Pomodoro), blocking the main loop causes stutter, dropped frames, and audio glitching.
   - Therefore, `window.prompt` violates the zero-lag constraint and design requirements.

2. **Step 2 — Data Loss in Voice Brain-Dump Flow**:
   - The user clicks the microphone button in S1 Hero or types into the Brain-Dump fallback dialog.
   - `dashboard-hero.tsx` packages the transcription into `{ detail: { initialTitle: transcript } }` and dispatches `campusos:quick-create-task`.
   - `dashboard/page.tsx:128` registers `const onQuickTaskEvt = () => handleQuickCreateTask()`.
   - Because `onQuickTaskEvt` omits the event parameter, `e.detail.initialTitle` is dropped.
   - `handleQuickCreateTask()` calls `window.prompt('Nhập nhanh tên nhiệm vụ / deadline mới:')` with an empty string.
   - Result: The user spoke or typed their task, but the application opens a blank browser popup forcing them to type it a second time.
   - Therefore, Voice Brain-Dump is disconnected from store ingestion.

3. **Step 3 — Architectural Solution**:
   - Replacing `window.prompt` with an inline accessible modal (`QuickTaskModal`) provides:
     - Non-blocking asynchronous interaction.
     - Full keyboard accessibility (`Escape` to close, `Enter` to submit, autofocus on title input).
     - Field controls for title, course, due time, and urgent toggle.
     - Automatic pre-fill of `initialTitle` when triggered by Voice Brain-Dump or fallback text.
     - Strict visual alignment with the "Neo-Brutal Aurora" design system (2px hard borders, 6px hard shadows, `#C6FF3D` acid lime buttons, rotated sticker badges).
     - 120FPS performance via Next.js dynamic import (`{ ssr: false }`).

---

## 3. Caveats

- **Scope Boundary**: This investigation and blueprint focus exclusively on Defect 2 (`dashboard/page.tsx` task quick capture and Voice Brain-Dump integration). Defect 1 (falsy coercion in `dashboard-hero.tsx`), Defect 3 (exam countdown date sync in `squad-kanban-exam.tsx`), and Defect 4 (gamification XP recalculation in `deadline-arena.tsx`) are addressed by peer remedies.
- **Microphone Permissions**: Web Speech API is dependent on browser permissions (`vi-VN`). In environments where Web Speech API is unavailable or denied, the fallback dialog in `dashboard-hero.tsx` seamlessly dispatches the exact same custom event, ensuring the remedy functions reliably across all browsers.
- **Store Schema Compatibility**: The resulting task adheres strictly to the existing `DeadlineItem` interface defined in `web/src/lib/campus-store.ts` (`id`, `title`, `course`, `dueDate`, `date`, `displayDate`, `urgent`, `completed`, `isExam`).

---

## 4. Conclusion & Complete Implementation Blueprint

### 4.1 Component Blueprint: `web/src/components/dashboard/quick-task-modal.tsx`

Create this file to provide a reusable, accessible, Neo-Brutal modal for quick task creation:

```tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Plus,
  Flame,
  Clock,
  BookOpen,
  Mic,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface QuickTaskFormData {
  title: string;
  course: string;
  dueDate: string;
  dueTime: string;
  urgent: boolean;
}

interface QuickTaskModalProps {
  isOpen: boolean;
  initialTitle?: string;
  onClose: () => void;
  onSubmit: (data: QuickTaskFormData) => void;
}

const COURSE_PRESETS = [
  'CS301 - Mạng máy tính',
  'CTDL & GT',
  'Triết học Mác - Lênin',
  'Xác suất Thống kê',
  'Nhiệm vụ chung',
];

export function QuickTaskModal({
  isOpen,
  initialTitle = '',
  onClose,
  onSubmit,
}: QuickTaskModalProps) {
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('Nhiệm vụ chung');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [urgent, setUrgent] = useState(false);
  const [isFromVoice, setIsFromVoice] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Initialize dates and fields when modal opens
  useEffect(() => {
    if (isOpen) {
      const todayStr = new Date().toISOString().split('T')[0]!;
      setDueDate(todayStr);
      setDueTime('23:59');
      setCourse('Nhiệm vụ chung');
      setUrgent(false);

      if (initialTitle && initialTitle.trim()) {
        setTitle(initialTitle.trim());
        setIsFromVoice(true);
      } else {
        setTitle('');
        setIsFromVoice(false);
      }

      // Autofocus input on open
      setTimeout(() => {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      }, 50);

      // Prevent body scrolling
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden';
      }
    } else {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, initialTitle]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;

      onSubmit({
        title: trimmedTitle,
        course: course.trim() || 'Nhiệm vụ chung',
        dueDate: dueDate || new Date().toISOString().split('T')[0]!,
        dueTime: dueTime || '23:59',
        urgent,
      });
    },
    [title, course, dueDate, dueTime, urgent, onSubmit]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-task-modal-title"
      aria-describedby="quick-task-modal-desc"
    >
      <div
        className="w-full max-w-lg bg-[#0D0D17] border-2 border-white/20 rounded-[24px] shadow-[8px_8px_0px_#000000] overflow-hidden flex flex-col hard-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-white/10 bg-[#121220]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-aurora-lime text-black font-display font-black text-sm shadow-[2px_2px_0px_#000]">
              <Plus className="w-4 h-4 stroke-[3]" />
            </span>
            <div>
              <h2
                id="quick-task-modal-title"
                className="font-heading font-black text-lg text-foreground tracking-tight flex items-center gap-2"
              >
                TẠO NHIỆM VỤ NHANH
                {isFromVoice && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-aurora-cyan/30 bg-aurora-cyan/10 px-2 py-0.5 text-[10px] font-mono font-bold text-aurora-cyan">
                    <Mic className="w-2.5 h-2.5" /> Voice
                  </span>
                )}
              </h2>
              <p id="quick-task-modal-desc" className="text-xs text-muted-foreground font-sans">
                Thêm nhanh deadline hoặc việc cần làm vào CampusOS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 font-sans">
          {/* Field 1: Title Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="quick-task-title-input"
              className="text-xs font-heading font-bold text-foreground flex items-center justify-between"
            >
              <span>
                Tên nhiệm vụ / Deadline <span className="text-rose-400">*</span>
              </span>
              <span className="text-[10px] font-mono text-muted-foreground font-normal">
                Nhấn Enter để lưu nhanh
              </span>
            </label>
            <input
              id="quick-task-title-input"
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Nộp bài tập lớn Mạng máy tính, ôn thi giữa kỳ..."
              className="w-full rounded-xl border-2 border-white/20 bg-[#161626] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-aurora-lime focus:outline-none shadow-[2px_2px_0px_#000] transition-colors"
              required
            />
          </div>

          {/* Field 2: Course / Subject Selector */}
          <div className="space-y-2">
            <label className="text-xs font-heading font-bold text-foreground flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-aurora-cyan" />
              <span>Môn học / Phân loại</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COURSE_PRESETS.map((preset) => {
                const isSelected = course === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCourse(preset)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-2 border-aurora-lime bg-aurora-lime/15 text-aurora-lime shadow-[2px_2px_0px_#C6FF3D]'
                        : 'border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="Hoặc nhập tên môn khác..."
              className="w-full rounded-xl border border-white/15 bg-[#161626]/80 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-aurora-lime focus:outline-none"
            />
          </div>

          {/* Field 3: Date & Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="quick-task-date-input"
                className="text-xs font-heading font-bold text-foreground flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-aurora-violet" />
                <span>Hạn chót (Ngày)</span>
              </label>
              <input
                id="quick-task-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border-2 border-white/20 bg-[#161626] px-3 py-2 text-xs font-mono text-foreground focus:border-aurora-lime focus:outline-none shadow-[2px_2px_0px_#000]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="quick-task-time-input"
                className="text-xs font-heading font-bold text-foreground flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>Giờ</span>
              </label>
              <input
                id="quick-task-time-input"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full rounded-xl border-2 border-white/20 bg-[#161626] px-3 py-2 text-xs font-mono text-foreground focus:border-aurora-lime focus:outline-none shadow-[2px_2px_0px_#000]"
              />
            </div>
          </div>

          {/* Field 4: Urgent Toggle Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setUrgent((prev) => !prev)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                urgent
                  ? 'border-rose-500 bg-rose-500/15 text-rose-300 shadow-[3px_3px_0px_#FF3D6E]'
                  : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Flame
                  className={`w-4 h-4 ${
                    urgent ? 'text-rose-400 animate-pulse fill-rose-400' : 'text-muted-foreground'
                  }`}
                />
                <span className="text-xs font-bold font-heading">
                  {urgent ? 'Đang bật báo động khẩn cấp (Panic Mode)' : 'Đánh dấu là nhiệm vụ khẩn cấp'}
                </span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  urgent
                    ? 'border-rose-400/50 bg-rose-500/20 text-rose-300'
                    : 'border-white/10 text-muted-foreground'
                }`}
              >
                {urgent ? 'BẬT 🔥' : 'TẮT'}
              </span>
            </button>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 rounded-xl border-white/20 bg-transparent text-xs font-bold text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              Hủy bỏ (Esc)
            </Button>
            <Button
              type="submit"
              disabled={!title.trim()}
              className="h-10 rounded-xl bg-aurora-lime text-black font-heading font-black text-xs shadow-[3px_3px_0px_#000] hover:brightness-110 active:scale-95 transition-all"
            >
              Tạo nhiệm vụ (Enter)
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

### 4.2 Integration Blueprint in `web/src/app/(main)/dashboard/page.tsx`

Apply the following modifications to `web/src/app/(main)/dashboard/page.tsx`:

#### 1. Dynamic Import for `QuickTaskModal` (preserve 120FPS profile):
```tsx
const QuickTaskModal = dynamic(
  () =>
    import('@/components/dashboard/quick-task-modal').then(
      (mod) => mod.QuickTaskModal
    ),
  { ssr: false }
);
```

#### 2. Replace state and `handleQuickCreateTask`:
```tsx
  // ---------------------------------------------------------------------------
  // Modal Overlays State
  // ---------------------------------------------------------------------------
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [focusInitialMinutes, setFocusInitialMinutes] = useState(25);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [quickTaskModalOpen, setQuickTaskModalOpen] = useState(false);
  const [quickTaskInitialTitle, setQuickTaskInitialTitle] = useState('');
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Quick Task Creation (Accessible Neo-Brutal Modal & Voice Ingestion)
  // ---------------------------------------------------------------------------
  const handleOpenQuickTask = useCallback((initialTitle = '') => {
    setQuickTaskInitialTitle(initialTitle);
    setQuickTaskModalOpen(true);
  }, []);

  const handleSaveQuickTask = useCallback(
    (data: {
      title: string;
      course: string;
      dueDate: string;
      dueTime: string;
      urgent: boolean;
    }) => {
      const todayStr = new Date().toISOString().split('T')[0]!;
      const targetDate = data.dueDate || todayStr;
      const targetTime = data.dueTime || '23:59';
      const displayDate =
        targetDate === todayStr
          ? `Hôm nay · ${targetTime}`
          : `${targetDate} · ${targetTime}`;

      update((prev) => ({
        deadlines: [
          {
            id: `quick-${Date.now()}`,
            title: data.title.trim(),
            course: data.course.trim() || 'Nhiệm vụ nhanh',
            dueDate: `${targetDate}T${targetTime}:00`,
            date: targetDate,
            displayDate,
            urgent: data.urgent,
            completed: false,
            isExam: false,
          },
          ...prev.deadlines,
        ],
      }));

      setToastNotification(`Đã tạo nhanh nhiệm vụ: "${data.title.trim()}"`);
      setTimeout(() => setToastNotification(null), 4000);
      setQuickTaskModalOpen(false);
    },
    [update]
  );
```

#### 3. Update `useGlobalShortcuts` & Escape Handling:
```tsx
  useGlobalShortcuts({
    onToggleCommandPalette: () => setCommandPaletteOpen((prev) => !prev),
    onToggleShortcutsModal: () => setShortcutsModalOpen((prev) => !prev),
    onQuickCreateTask: () => handleOpenQuickTask(''),
    onTriggerFocusMode: () => handleLaunchFocus(25),
    onEscape: () => {
      setFocusModalOpen(false);
      setCommandPaletteOpen(false);
      setShortcutsModalOpen(false);
      setQuickTaskModalOpen(false);
    },
  });
```

#### 4. Update Event Listener for `campusos:quick-create-task`:
```tsx
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onFocusEvt = (e: Event) => {
      const custom = e as CustomEvent<{ minutes?: number }>;
      handleLaunchFocus(custom.detail?.minutes ?? 25);
    };

    const onQuickTaskEvt = (e: Event) => {
      const custom = e as CustomEvent<{ initialTitle?: string }>;
      handleOpenQuickTask(custom.detail?.initialTitle || '');
    };

    const onTogglePaletteEvt = () => setCommandPaletteOpen((prev) => !prev);
    const onOpenShortcutsEvt = () => setShortcutsModalOpen(true);

    window.addEventListener('campusos:trigger-focus', onFocusEvt);
    window.addEventListener('campusos:quick-create-task', onQuickTaskEvt);
    window.addEventListener('campusos:toggle-command-palette', onTogglePaletteEvt);
    window.addEventListener('campusos:open-shortcuts-modal', onOpenShortcutsEvt);

    return () => {
      window.removeEventListener('campusos:trigger-focus', onFocusEvt);
      window.removeEventListener('campusos:quick-create-task', onQuickTaskEvt);
      window.removeEventListener('campusos:toggle-command-palette', onTogglePaletteEvt);
      window.removeEventListener('campusos:open-shortcuts-modal', onOpenShortcutsEvt);
    };
  }, [handleLaunchFocus, handleOpenQuickTask]);
```

#### 5. Pass prop to `DashboardHero`:
```tsx
  <DashboardHero
    onStartFocus={() => handleLaunchFocus(25)}
    onAddTask={() => handleOpenQuickTask('')}
  />
```

#### 6. Render `<QuickTaskModal>` in Overlay Section:
```tsx
  <QuickTaskModal
    isOpen={quickTaskModalOpen}
    initialTitle={quickTaskInitialTitle}
    onClose={() => setQuickTaskModalOpen(false)}
    onSubmit={handleSaveQuickTask}
  />
```

---

## 5. Verification Method

### 5.1 Verification Checklist

| Scenario | Trigger | Expected Outcome | Verification Tool / Command |
|---|---|---|---|
| **Shortcut Trigger** | Press `N` anywhere on `/dashboard` (outside inputs) | `QuickTaskModal` opens with empty input, autofocus on title, 0 blocking prompts | Manual / Playwright test |
| **Hero Button Trigger** | Click `+ Thêm nhiệm vụ` in Hero | `QuickTaskModal` opens smoothly with zero thread stall | Click event inspection |
| **Arena Button Trigger** | Click `+ Thêm deadline` in S3 Bento header | `campusos:quick-create-task` fires -> `QuickTaskModal` opens | Event listener trace |
| **Voice Brain-Dump Ingestion** | Speak Vietnamese or submit text in Brain-Dump fallback modal | Modal opens immediately with `initialTitle` pre-filled and `🎙️ Voice` tag visible | Inspect `initialTitle` prop |
| **One-Click Enter Commit** | Press `Enter` in title input | Form submits, adds item to `state.deadlines`, closes modal, shows toast | Inspect `state.deadlines[0]` |
| **Keyboard Dismissal** | Press `Escape` | Modal closes immediately, zero errors | Keydown listener check |
| **A11y Compliance** | Screen reader check | Contains `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby` | DOM attribute validation |

### 5.2 Independent Terminal Verification Commands

```powershell
# 1. Typecheck the Next.js project
cd d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
npm run typecheck

# 2. Run existing unit test suite
npm test

# 3. Production build test
npm run build
```

### 5.3 Invalidation Conditions
- Any occurrence of `window.prompt` in `src/app/(main)/dashboard/page.tsx` or related components invalidates this remedy.
- Any dropping of `(e as CustomEvent).detail.initialTitle` on `campusos:quick-create-task` invalidates this remedy.
