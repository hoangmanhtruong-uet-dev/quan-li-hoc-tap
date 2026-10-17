'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  useCampusStore,
  awardXp,
  convertCoursesToRecurringEvents,
  batchAddCalendarEvents,
  type CalendarEvent,
  type EventType,
} from '@/lib/campus-store';
import { useGlobalShortcuts } from '@/components/common/use-global-shortcuts';
import type { ExtractedScheduleCourse } from '@/lib/period-time-mapper';

// Dynamic import for heavy modal overlays to preserve 120FPS initial load
const StrictPomodoroModal = dynamic(
  () =>
    import('@/features/pomodoro/strict-pomodoro-modal').then(
      (mod) => mod.StrictPomodoroModal
    ),
  { ssr: false }
);

const ScheduleScanModal = dynamic(
  () =>
    import('@/components/calendar/schedule-scan-modal').then(
      (mod) => mod.ScheduleScanModal
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

// Modular Calendar Components
import { MonthPosterHeader, type CalendarViewMode } from '@/components/calendar/month-poster-header';
import { SmartFilters, type FilterState, EVENT_META } from '@/components/calendar/smart-filters';
import { MonthGrid } from '@/components/calendar/month-grid';
import { TimeGrid } from '@/components/calendar/time-grid';
import { AgendaView } from '@/components/calendar/agenda-view';
import { SemesterTimeline } from '@/components/calendar/semester-timeline';
import { DayDrawer } from '@/components/calendar/day-drawer';
import { UpcomingRail } from '@/components/calendar/upcoming-rail';
import { AiSchedulerModal } from '@/components/calendar/ai-scheduler-modal';
import { NlpQuickCreateModal } from '@/components/calendar/nlp-quick-create-modal';
import { IcsDialog } from '@/components/calendar/ics-dialog';

export default function CalendarPage() {
  const { state, update, recordSession } = useCampusStore();

  // ---------------------------------------------------------------------------
  // Date & View States (Anchor "Hôm nay" to real system date)
  // ---------------------------------------------------------------------------
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    activeTypes: ['class', 'study', 'exam', 'club', 'personal'],
    searchQuery: '',
    hideWeekends: false,
    showFreeSlots: true,
    squadOverlay: false,
  });

  // Modal Overlays
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiSchedulerOpen, setAiSchedulerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [icsDialogOpen, setIcsDialogOpen] = useState(false);
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [focusInitialMinutes, setFocusInitialMinutes] = useState(25);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [scheduleScanOpen, setScheduleScanOpen] = useState(false);

  // Undo Toast state for drag & drop rescheduling
  const [undoToast, setUndoToast] = useState<{
    message: string;
    undoAction: () => void;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // Filtered Events Calculation
  // ---------------------------------------------------------------------------
  const filteredEvents = useMemo(() => {
    return state.events.filter((ev) => {
      // Type filter
      if (!filters.activeTypes.includes(ev.type)) return false;
      // Search filter
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesLoc = ev.location?.toLowerCase().includes(q) ?? false;
        if (!matchesTitle && !matchesLoc) return false;
      }
      return true;
    });
  }, [filters.activeTypes, filters.searchQuery, state.events]);

  // Event counts for filter badges
  const eventCounts = useMemo(() => {
    const counts: Record<EventType, number> = {
      class: 0,
      study: 0,
      exam: 0,
      club: 0,
      personal: 0,
    };
    for (const e of state.events) {
      if (counts[e.type] !== undefined) {
        counts[e.type]++;
      }
    }
    return counts;
  }, [state.events]);

  const selectedDateEvents = useMemo(() => {
    return filteredEvents.filter((e) => e.date === selectedDate);
  }, [filteredEvents, selectedDate]);

  // ---------------------------------------------------------------------------
  // Date Nav Handlers
  // ---------------------------------------------------------------------------
  const handlePrevMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const copy = new Date(prev);
      copy.setMonth(copy.getMonth() - 1);
      return copy;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const copy = new Date(prev);
      copy.setMonth(copy.getMonth() + 1);
      return copy;
    });
  }, []);

  const handleGoToday = useCallback(() => {
    const now = new Date();
    setCurrentDate(now);
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setSelectedDate(todayStr);
  }, []);

  const handleSelectDate = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
    const parts = dateStr.split('-').map(Number);
    const d = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
    if (d.getMonth() !== currentDate.getMonth()) {
      setCurrentDate(new Date(d));
    }
    setDrawerOpen(true);
  }, [currentDate]);

  // ---------------------------------------------------------------------------
  // Event Manipulation Handlers
  // ---------------------------------------------------------------------------
  const handleEventMove = useCallback(
    (eventId: string, targetDateStr: string) => {
      const target = state.events.find((e) => e.id === eventId);
      if (!target || target.date === targetDateStr) return;

      const previousDate = target.date;

      update((prev) => ({
        events: prev.events.map((e) =>
          e.id === eventId ? { ...e, date: targetDateStr } : e
        ),
      }));

      // Show Undo Toast
      setUndoToast({
        message: `Đã dời "${target.title}" sang ${targetDateStr}`,
        undoAction: () => {
          update((prev) => ({
            events: prev.events.map((e) =>
              e.id === eventId ? { ...e, date: previousDate } : e
            ),
          }));
          setUndoToast(null);
        },
      });

      setTimeout(() => setUndoToast(null), 5000);
    },
    [state.events, update]
  );

  const handleCreateEvent = useCallback(
    (newEvent: CalendarEvent) => {
      update((prev) => ({
        events: [newEvent, ...prev.events],
      }));
    },
    [update]
  );

  const handleToggleDone = useCallback(
    (eventId: string) => {
      update((prev) => ({
        events: prev.events.map((e) =>
          e.id === eventId ? { ...e, done: !e.done } : e
        ),
      }));
    },
    [update]
  );

  const handleDeleteEvent = useCallback(
    (eventId: string) => {
      update((prev) => ({
        events: prev.events.filter((e) => e.id !== eventId),
      }));
    },
    [update]
  );

  const handleAcceptAiBlocks = useCallback(
    (blocks: CalendarEvent[]) => {
      update((prev) => ({
        events: [...blocks, ...prev.events],
      }));
    },
    [update]
  );

  const handleImportIcsEvents = useCallback(
    (imported: CalendarEvent[]) => {
      update((prev) => ({
        events: [...imported, ...prev.events],
      }));
    },
    [update]
  );

  const handleResolveConflict = useCallback(
    (eventToMove: CalendarEvent, newSlot: { start: string; end: string }) => {
      update((prev) => ({
        events: prev.events.map((e) =>
          e.id === eventToMove.id ? { ...e, start: newSlot.start, end: newSlot.end } : e
        ),
      }));
    },
    [update]
  );

  const handleCommitScannedSchedule = useCallback(
    (courses: ExtractedScheduleCourse[]) => {
      if (!courses || courses.length === 0) return;
      const newEvents = convertCoursesToRecurringEvents(courses, 15);
      batchAddCalendarEvents(newEvents);
      awardXp(100, 'Quét TKB bằng AI');
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Focus Mode Integration
  // ---------------------------------------------------------------------------
  const handleLaunchFocus = useCallback((minutes = 25) => {
    setFocusInitialMinutes(minutes);
    setFocusModalOpen(true);
  }, []);

  const handleFocusComplete = useCallback(
    (stats: { focusMinutes: number; shameCount: number; disciplineScore: number }) => {
      recordSession(stats.focusMinutes, stats.disciplineScore);
    },
    [recordSession]
  );

  // ---------------------------------------------------------------------------
  // Global & Keyboard Shortcuts
  // ---------------------------------------------------------------------------
  useGlobalShortcuts({
    onToggleCommandPalette: () => setCommandPaletteOpen((prev) => !prev),
    onToggleShortcutsModal: () => setShortcutsModalOpen((prev) => !prev),
    onQuickCreateTask: () => setCreateModalOpen(true),
    onTriggerFocusMode: () => handleLaunchFocus(25),
    onEscape: () => {
      setDrawerOpen(false);
      setAiSchedulerOpen(false);
      setCreateModalOpen(false);
      setIcsDialogOpen(false);
      setFocusModalOpen(false);
      setCommandPaletteOpen(false);
      setShortcutsModalOpen(false);
      setScheduleScanOpen(false);
    },
  });

  // Listen for global event to open AI Schedule Scanner
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onOpenScannerEvt = () => setScheduleScanOpen(true);
    window.addEventListener('campusos:open-schedule-scanner', onOpenScannerEvt);

    return () => {
      window.removeEventListener('campusos:open-schedule-scanner', onOpenScannerEvt);
    };
  }, []);

  // Calendar specific key listener (←/→, T, M, W, D, A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevMonth();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextMonth();
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleGoToday();
      } else if (e.key.toLowerCase() === 'm') {
        setViewMode('month');
      } else if (e.key.toLowerCase() === 'w') {
        setViewMode('week');
      } else if (e.key.toLowerCase() === 'd') {
        setViewMode('day');
      } else if (e.key.toLowerCase() === 'a') {
        setViewMode('agenda');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGoToday, handleNextMonth, handlePrevMonth]);

  return (
    <div
      data-vibe={state.vibeTheme}
      data-reduced-motion={state.reducedMotion ? 'true' : 'false'}
      className="relative min-h-screen overflow-x-hidden text-foreground antialiased selection:bg-primary selection:text-black"
    >
      {/* Ambient Aurora Blobs Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
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
        <div className="absolute inset-0 aurora-noise pointer-events-none" />
      </div>

      {/* Undo Toast Notification */}
      {undoToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border-2 border-aurora-lime bg-[#121224] px-5 py-3 shadow-[6px_6px_0px_#000] hard-border animate-slide-up">
          <span className="text-xs font-bold text-foreground">{undoToast.message}</span>
          <button
            type="button"
            onClick={undoToast.undoAction}
            className="rounded-lg bg-aurora-lime px-2.5 py-1 font-mono text-xs font-extrabold text-black hover:brightness-110"
          >
            Hoàn tác ↩
          </button>
        </div>
      )}

      {/* Main Page Content */}
      <div className="relative z-10 mx-auto w-full max-w-[1500px] min-w-0 space-y-6 px-4 pb-12 pt-6">
        {/* S1: Month Poster Header */}
        <MonthPosterHeader
          currentDate={currentDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleGoToday}
          onOpenCreate={() => setCreateModalOpen(true)}
          onOpenAiScheduler={() => setAiSchedulerOpen(true)}
          onOpenIcsDialog={() => setIcsDialogOpen(true)}
          onOpenScheduleScan={() => setScheduleScanOpen(true)}
        />

        {/* S2: Smart Filters */}
        <SmartFilters
          filters={filters}
          onChange={setFilters}
          eventCounts={eventCounts}
        />

        {/* S3, S4, S5: Primary Calendar View Switch */}
        {viewMode === 'month' && (
          <MonthGrid
            currentDate={currentDate}
            selectedDate={selectedDate}
            events={filteredEvents}
            hideWeekends={filters.hideWeekends}
            onSelectDate={handleSelectDate}
            onEventMove={handleEventMove}
            onQuickCreate={(dateStr) => {
              setSelectedDate(dateStr);
              setCreateModalOpen(true);
            }}
          />
        )}

        {viewMode === 'week' && (
          <TimeGrid
            currentDate={currentDate}
            selectedDate={selectedDate}
            isWeekView={true}
            events={filteredEvents}
            onSelectEvent={(ev) => {
              setSelectedDate(ev.date);
              setDrawerOpen(true);
            }}
            onSlotClick={(dateStr) => {
              setSelectedDate(dateStr);
              setCreateModalOpen(true);
            }}
            onStartFocus={handleLaunchFocus}
            onResolveConflict={handleResolveConflict}
          />
        )}

        {viewMode === 'day' && (
          <TimeGrid
            currentDate={currentDate}
            selectedDate={selectedDate}
            isWeekView={false}
            events={filteredEvents}
            onSelectEvent={(ev) => {
              setSelectedDate(ev.date);
              setDrawerOpen(true);
            }}
            onSlotClick={(dateStr) => {
              setSelectedDate(dateStr);
              setCreateModalOpen(true);
            }}
            onStartFocus={handleLaunchFocus}
            onResolveConflict={handleResolveConflict}
          />
        )}

        {viewMode === 'agenda' && (
          <AgendaView
            events={filteredEvents}
            selectedDate={selectedDate}
            onSelectEvent={(ev) => {
              setSelectedDate(ev.date);
              setDrawerOpen(true);
            }}
            onSelectDate={setSelectedDate}
            onToggleDone={handleToggleDone}
            onOpenCreate={(dateStr) => {
              if (dateStr) setSelectedDate(dateStr);
              setCreateModalOpen(true);
            }}
          />
        )}

        {viewMode === 'timeline' && (
          <SemesterTimeline
            events={filteredEvents}
            deadlines={state.deadlines}
            onSelectDate={handleSelectDate}
          />
        )}

        {/* S6: Upcoming Rail */}
        <UpcomingRail
          events={filteredEvents}
          onSelectEvent={(ev) => {
            setSelectedDate(ev.date);
            setDrawerOpen(true);
          }}
        />
      </div>

      {/* Slide-over Selected Day Drawer */}
      <DayDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedDate={selectedDate}
        events={selectedDateEvents}
        onStartFocus={handleLaunchFocus}
        onOpenCreate={(dStr) => {
          setSelectedDate(dStr);
          setCreateModalOpen(true);
        }}
        onToggleDone={handleToggleDone}
        onDeleteEvent={handleDeleteEvent}
      />

      {/* AI Auto-Scheduler Modal */}
      <AiSchedulerModal
        isOpen={aiSchedulerOpen}
        onClose={() => setAiSchedulerOpen(false)}
        onAcceptBlocks={handleAcceptAiBlocks}
      />

      {/* NLP Quick-Create Modal */}
      <NlpQuickCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        defaultDate={selectedDate}
        onCreateEvent={handleCreateEvent}
      />

      {/* ICS Import/Export Dialog */}
      <IcsDialog
        isOpen={icsDialogOpen}
        onClose={() => setIcsDialogOpen(false)}
        onImportEvents={handleImportIcsEvents}
      />

      {/* Strict Pomodoro Focus Modal with Fat Orange Cat & Chill 4-7-8 Breathing */}
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

      {/* AI Smart OCR Schedule Importer Modal */}
      <ScheduleScanModal
        isOpen={scheduleScanOpen}
        onClose={() => setScheduleScanOpen(false)}
        onCommitSchedule={handleCommitScannedSchedule}
      />
    </div>
  );
}
