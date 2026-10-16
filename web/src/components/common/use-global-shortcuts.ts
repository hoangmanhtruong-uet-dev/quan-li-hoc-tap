'use client';

import { useEffect, useRef } from 'react';

export interface UseGlobalShortcutsOptions {
  onToggleCommandPalette?: () => void;
  onToggleShortcutsModal?: () => void;
  onQuickCreateTask?: () => void;
  onTriggerFocusMode?: () => void;
  onEscape?: () => void;
  onKonamiCode?: () => void;
  onLogoEasterEgg?: () => void;
}

const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

export function useGlobalShortcuts(options: UseGlobalShortcutsOptions = {}) {
  const konamiIndexRef = useRef(0);
  const logoClicksRef = useRef<number[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // 1. Command Palette: Cmd/Ctrl + K (allowed everywhere, even in inputs)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (options.onToggleCommandPalette) {
          options.onToggleCommandPalette();
        } else if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('campusos:toggle-command-palette'));
        }
        return;
      }

      // 2. Escape key
      if (e.key === 'Escape') {
        if (options.onEscape) {
          options.onEscape();
        } else if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('campusos:escape-pressed'));
        }
        return;
      }

      // If user is currently typing in an input field, block single-key shortcuts
      if (isInput) return;

      // 3. Question mark (?) - Open Shortcuts modal
      if (e.key === '?') {
        e.preventDefault();
        if (options.onToggleShortcutsModal) {
          options.onToggleShortcutsModal();
        } else if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('campusos:open-shortcuts-modal'));
        }
        return;
      }

      // 4. Focus Mode (F)
      if (e.key === 'f' || e.key === 'F') {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          if (options.onTriggerFocusMode) {
            options.onTriggerFocusMode();
          } else if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('campusos:trigger-focus'));
          }
          return;
        }
      }

      // 5. Quick Create Task (N)
      if (e.key === 'n' || e.key === 'N') {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          if (options.onQuickCreateTask) {
            options.onQuickCreateTask();
          } else if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('campusos:quick-create-task'));
          }
          return;
        }
      }

      // 6. Konami Code Progression
      const currentExpected = KONAMI_SEQUENCE[konamiIndexRef.current];
      if (currentExpected && e.key.toLowerCase() === currentExpected.toLowerCase()) {
        konamiIndexRef.current += 1;
        if (konamiIndexRef.current === KONAMI_SEQUENCE.length) {
          konamiIndexRef.current = 0;
          if (options.onKonamiCode) {
            options.onKonamiCode();
          } else if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('campusos:konami-unlocked'));
          }
        }
      } else {
        konamiIndexRef.current = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options]);

  // Logo 5-click easter egg handler
  const handleLogoClick = () => {
    const now = Date.now();
    logoClicksRef.current = [...logoClicksRef.current.filter((t) => now - t < 2000), now];
    if (logoClicksRef.current.length >= 5) {
      logoClicksRef.current = [];
      if (options.onLogoEasterEgg) {
        options.onLogoEasterEgg();
      } else if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('campusos:logo-easter-egg'));
      }
    }
  };

  return { handleLogoClick };
}
