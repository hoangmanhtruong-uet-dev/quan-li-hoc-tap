'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useCampusStore } from '@/lib/campus-store';
import { useGlobalShortcuts } from '@/components/common/use-global-shortcuts';

// Dynamic import for heavy modal overlays to preserve 120FPS initial load and avoid SSR mismatch
const StrictPomodoroModal = dynamic(
  () =>
    import('@/features/pomodoro/strict-pomodoro-modal').then(
      (mod) => mod.StrictPomodoroModal
    ),
  { ssr: false }
);

const CommandPalette = dynamic(
  () =>
    import('@/components/common/command-palette').then(
      (mod) => mod.CommandPalette
    ),
  { ssr: false }
);

const KeyboardShortcutsModal = dynamic(
  () =>
    import('@/components/common/keyboard-shortcuts-modal').then(
      (mod) => mod.KeyboardShortcutsModal
    ),
  { ssr: false }
);

// 7 Modular Dashboard Sections
import { DashboardHero } from '@/components/dashboard/dashboard-hero';
import { TodayTimeline } from '@/components/dashboard/today-timeline';
import { DeadlineArena } from '@/components/dashboard/deadline-arena';
import { AiMascotCoach } from '@/components/dashboard/ai-mascot-coach';
import { GameHudStats } from '@/components/dashboard/game-hud-stats';
import { SquadKanbanExam } from '@/components/dashboard/squad-kanban-exam';
import { MarqueeDailyWrapped } from '@/components/dashboard/marquee-daily-wrapped';

export default function DashboardPage() {
  const { state, update, recordSession } = useCampusStore();

  // ---------------------------------------------------------------------------
  // Modal Overlays State
  // ---------------------------------------------------------------------------
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [focusInitialMinutes, setFocusInitialMinutes] = useState(25);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Focus Mode Trigger & Completion Handler
  // ---------------------------------------------------------------------------
  const handleLaunchFocus = useCallback((minutes = 25) => {
    setFocusInitialMinutes(minutes);
    setFocusModalOpen(true);
  }, []);

  const handleFocusComplete = useCallback(
    (stats: { focusMinutes: number; shameCount: number; disciplineScore: number }) => {
      const result = recordSession(stats.focusMinutes, stats.disciplineScore);
      setToastNotification(
        `🎉 Hoàn thành phiên ${stats.focusMinutes}p! Nhận +${result.xpGained} XP. ${
          result.streakUpdated ? 'Streak đã tăng! 🔥' : ''
        }`
      );
      setTimeout(() => setToastNotification(null), 5000);
    },
    [recordSession]
  );

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

  // ---------------------------------------------------------------------------
  // Global Keyboard Shortcuts (N, Cmd+K, ?, F) & Custom Event Wireup
  // ---------------------------------------------------------------------------
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onFocusEvt = (e: Event) => {
      const custom = e as CustomEvent<{ minutes?: number }>;
      handleLaunchFocus(custom.detail?.minutes ?? 25);
    };

    const onQuickTaskEvt = () => handleQuickCreateTask();
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
  }, [handleLaunchFocus, handleQuickCreateTask]);

  return (
    <div
      data-vibe={state.vibeTheme}
      data-reduced-motion={state.reducedMotion ? 'true' : 'false'}
      className="relative min-h-screen text-foreground antialiased selection:bg-primary selection:text-black"
    >
      {/* ===================================================================
          120FPS AMBIENT AURORA BLOBS & 4% GRAIN OVERLAY
          =================================================================== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Slow-moving GPU CSS Aurora Glow Blobs */}
        <div
          className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full blur-[140px] opacity-25"
          style={{ background: 'var(--aurora-blob-1, rgba(124, 92, 255, 0.28))' }}
        />
        <div
          className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full blur-[150px] opacity-20"
          style={{ background: 'var(--aurora-blob-2, rgba(255, 61, 165, 0.24))' }}
        />
        <div
          className="absolute -bottom-32 left-1/4 w-[600px] h-[600px] rounded-full blur-[160px] opacity-20"
          style={{ background: 'var(--aurora-blob-3, rgba(61, 232, 255, 0.20))' }}
        />
        {/* 4% Noise Overlay */}
        <div className="absolute inset-0 aurora-noise pointer-events-none" />
      </div>

      {/* Floating System Toast */}
      {toastNotification && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-[#121220]/95 border-2 border-aurora-lime text-foreground rounded-2xl shadow-[6px_6px_0px_#000] font-sans text-xs max-w-sm animate-fade-in hard-border">
          {toastNotification}
        </div>
      )}

      {/* Main Page Layout Container */}
      <div className="relative z-10 mx-auto w-full max-w-[1440px] space-y-10 md:space-y-14">
        {/* S1: HERO "VŨ TRỤ HỌC TẬP" */}
        <DashboardHero
          onStartFocus={() => handleLaunchFocus(25)}
          onAddTask={handleQuickCreateTask}
        />

        {/* S2: "HÔM NAY" HORIZONTAL INTERACTIVE TIMELINE */}
        <TodayTimeline
          onStartFocus={handleLaunchFocus}
        />

        {/* S3 & S4: ASYMMETRIC GRID (DEADLINE ARENA & AI MASCOT COACH) */}
        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr] items-start">
          {/* S3: DEADLINE ARENA */}
          <DeadlineArena
            onStartFocus={handleLaunchFocus}
          />

          {/* S4: AI COACH "SQUAD" MASCOT & STUDY PLAN PROPOSAL */}
          <AiMascotCoach
            onStartFocus={handleLaunchFocus}
          />
        </div>

        {/* S5: STATS & GOAL "GAME HUD" */}
        <GameHudStats />

        {/* S6: SQUAD KANBAN & CONCERT-TICKET UPCOMING EXAMS */}
        <SquadKanbanExam />

        {/* S7: DUAL MARQUEE FOOTER & SPOTIFY-STYLE DAILY WRAPPED */}
        <MarqueeDailyWrapped />
      </div>

      {/* ===================================================================
          MODAL OVERLAYS (STRICT POMODORO, COMMAND PALETTE, SHORTCUTS)
          =================================================================== */}
      <StrictPomodoroModal
        open={focusModalOpen}
        initialMinutes={focusInitialMinutes}
        onClose={() => setFocusModalOpen(false)}
        onSessionComplete={handleFocusComplete}
      />

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onThemeChange={(theme) => update(() => ({ vibeTheme: theme }))}
        onToggleReducedMotion={() => update((prev) => ({ reducedMotion: !prev.reducedMotion }))}
        isReducedMotion={state.reducedMotion}
      />

      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </div>
  );
}
