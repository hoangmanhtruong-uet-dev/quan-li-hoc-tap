'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RoastLevel } from './supervisor-arbiter';

export interface PomodoroSettings {
  characterSlug: string;
  roastLevel: RoastLevel;
  defaultMinutes: number;
  audioMuted: boolean;
  floatingPipEnabled: boolean;
  visualMode: '3d_model' | '2d_leo';
  reducedMotion: boolean;
}

export interface PomodoroStats {
  totalShameCount: number;
  sessionsCompleted: number;
  lastSessionTimestamp: number | null;
}

const STORAGE_SETTINGS_KEY = 'campusos-pomodoro-settings-v1';
const STORAGE_STATS_KEY = 'campusos-pomodoro-stats-v1';

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  characterSlug: 'co-giao-chu-nhiem',
  roastLevel: 'medium',
  defaultMinutes: 25,
  audioMuted: false,
  floatingPipEnabled: false,
  visualMode: '3d_model',
  reducedMotion: false,
};

export const DEFAULT_POMODORO_STATS: PomodoroStats = {
  totalShameCount: 0,
  sessionsCompleted: 0,
  lastSessionTimestamp: null,
};

// Event for cross-component reactive updates in the same window
const SETTINGS_EVENT = 'campusos:pomodoro-settings-change';
const STATS_EVENT = 'campusos:pomodoro-stats-change';

export function getStoredPomodoroSettings(): PomodoroSettings {
  if (typeof window === 'undefined') return DEFAULT_POMODORO_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_POMODORO_SETTINGS;
    return { ...DEFAULT_POMODORO_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_POMODORO_SETTINGS;
  }
}

export function saveStoredPomodoroSettings(settings: Partial<PomodoroSettings>): PomodoroSettings {
  const current = getStoredPomodoroSettings();
  const next = { ...current, ...settings };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: next }));
    } catch (e) {
      console.warn('Failed to save pomodoro settings to localStorage:', e);
    }
  }
  return next;
}

export function getStoredPomodoroStats(): PomodoroStats {
  if (typeof window === 'undefined') return DEFAULT_POMODORO_STATS;
  try {
    const raw = localStorage.getItem(STORAGE_STATS_KEY);
    if (!raw) return DEFAULT_POMODORO_STATS;
    return { ...DEFAULT_POMODORO_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_POMODORO_STATS;
  }
}

export function incrementPomodoroShame(amount = 1): PomodoroStats {
  const current = getStoredPomodoroStats();
  const next: PomodoroStats = {
    ...current,
    totalShameCount: current.totalShameCount + amount,
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(STATS_EVENT, { detail: next }));
    } catch {}
  }
  return next;
}

export function recordPomodoroSessionCompleted(): PomodoroStats {
  const current = getStoredPomodoroStats();
  const next: PomodoroStats = {
    ...current,
    sessionsCompleted: current.sessionsCompleted + 1,
    lastSessionTimestamp: Date.now(),
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(STATS_EVENT, { detail: next }));
    } catch {}
  }
  return next;
}

export function resetPomodoroStats(): PomodoroStats {
  const next = { ...DEFAULT_POMODORO_STATS };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(STATS_EVENT, { detail: next }));
    } catch {}
  }
  return next;
}

export function usePomodoroSettings() {
  const [settings, setSettingsState] = useState<PomodoroSettings>(DEFAULT_POMODORO_SETTINGS);
  const [stats, setStatsState] = useState<PomodoroStats>(DEFAULT_POMODORO_STATS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettingsState(getStoredPomodoroSettings());
    setStatsState(getStoredPomodoroStats());
    setHydrated(true);

    const handleSettingsChange = (e: Event) => {
      const custom = e as CustomEvent<PomodoroSettings>;
      if (custom.detail) {
        setSettingsState(custom.detail);
      } else {
        setSettingsState(getStoredPomodoroSettings());
      }
    };

    const handleStatsChange = (e: Event) => {
      const custom = e as CustomEvent<PomodoroStats>;
      if (custom.detail) {
        setStatsState(custom.detail);
      } else {
        setStatsState(getStoredPomodoroStats());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_SETTINGS_KEY) {
        setSettingsState(getStoredPomodoroSettings());
      } else if (e.key === STORAGE_STATS_KEY) {
        setStatsState(getStoredPomodoroStats());
      }
    };

    window.addEventListener(SETTINGS_EVENT, handleSettingsChange);
    window.addEventListener(STATS_EVENT, handleStatsChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(SETTINGS_EVENT, handleSettingsChange);
      window.removeEventListener(STATS_EVENT, handleStatsChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateSettings = useCallback((partial: Partial<PomodoroSettings>) => {
    const updated = saveStoredPomodoroSettings(partial);
    setSettingsState(updated);
  }, []);

  return {
    settings,
    stats,
    hydrated,
    updateSettings,
    incrementShame: incrementPomodoroShame,
    recordCompleted: recordPomodoroSessionCompleted,
    resetStats: resetPomodoroStats,
  };
}
