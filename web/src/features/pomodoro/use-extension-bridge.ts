'use client';

/**
 * CampusOS Chrome Extension Bridge Hook (Milestone 4)
 * Facilitates bidirectional communication between the CampusOS Web App and
 * the "AI Giám Sát Học Tập Cực Đoan" Chrome Extension Manifest V3.
 *
 * Responsibilities:
 * - Sends START_FOCUS, PAUSE_FOCUS, STOP_FOCUS, and REQUEST_EXEMPTION commands.
 * - Listens for EXTENSION_VIOLATION events forwarded by the extension content script.
 * - Invokes penalizeViolation(50, domain) on the shared campus store (-50 XP floor clamped).
 * - Emits custom DOM notifications ('campusos:toast', 'campusos:violation-alert') for reactive UI.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { penalizeViolation, type PenaltyResult } from '../../lib/campus-store.ts';

export type ExtensionAction =
  | 'PING'
  | 'START_FOCUS'
  | 'PAUSE_FOCUS'
  | 'STOP_FOCUS'
  | 'REQUEST_EXEMPTION'
  | 'SYNC_STATE'
  | 'UPDATE_BLACKLIST'
  | 'TOGGLE_WEBCAM';

export type ExtensionMessage =
  | { action: 'PING' }
  | { action: 'START_FOCUS'; durationSeconds?: number; characterSlug?: string; mode?: string }
  | { action: 'PAUSE_FOCUS' }
  | { action: 'STOP_FOCUS' }
  | { action: 'REQUEST_EXEMPTION'; durationSeconds?: number }
  | { action: 'SYNC_STATE' }
  | { action: 'UPDATE_BLACKLIST'; blacklist: string[] }
  | { action: 'TOGGLE_WEBCAM'; enabled: boolean };

export type ExtensionState = 'idle' | 'focusing' | 'break' | 'disconnected';

export interface ViolationPayload {
  action: 'EXTENSION_VIOLATION';
  domain: string;
  reason: 'blacklist_url' | 'face_away' | 'sleep' | string;
  penaltyXp: 50 | number;
  timestamp: number;
  violationCount?: number;
}

export interface UseExtensionBridgeOptions {
  onViolation?: (payload: ViolationPayload, penalty: PenaltyResult) => void;
  autoPenalize?: boolean;
  emitToast?: boolean;
}

export interface UseExtensionBridgeReturn {
  isInstalled: boolean;
  extensionState: ExtensionState;
  lastViolation: ViolationPayload | null;
  violationAlert: string | null;
  clearAlert: () => void;
  startFocus: (durationSeconds?: number, characterSlug?: string, mode?: string) => Promise<any>;
  pauseFocus: () => Promise<any>;
  stopFocus: () => Promise<any>;
  requestExemption: (durationSeconds?: number) => Promise<any>;
  ping: () => Promise<any>;
  sendMessage: (message: ExtensionMessage) => Promise<any>;
}

/**
 * Standalone asynchronous message sender communicating via window.postMessage relay
 * or direct chrome.runtime.sendMessage if available.
 */
export async function sendExtensionMessage<T = any>(
  message: ExtensionMessage,
  timeoutMs = 1500
): Promise<T | null> {
  if (typeof window === 'undefined') return null;

  // Direct Chrome extension API if running in privileged context
  const winChrome = (window as any).chrome;
  if (winChrome && winChrome.runtime?.sendMessage) {
    try {
      return await new Promise<T>((resolve) => {
        winChrome.runtime.sendMessage(message, (response: any) => {
          if (winChrome.runtime?.lastError) {
            resolve(null as any);
          } else {
            resolve(response);
          }
        });
      });
    } catch {
      // Fallback to window.postMessage relay
    }
  }

  // Fallback to window.postMessage relay handled by extension content script
  return new Promise<T | null>((resolve) => {
    const requestId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const responseHandler = (event: MessageEvent) => {
      if (event.source !== window || !event.data || typeof event.data !== 'object') return;
      if (
        event.data.type === 'CAMPUSOS_EXTENSION_RESPONSE' &&
        event.data.id === requestId
      ) {
        if (timer) clearTimeout(timer);
        window.removeEventListener('message', responseHandler);
        resolve(event.data.response as T);
      }
    };

    timer = setTimeout(() => {
      window.removeEventListener('message', responseHandler);
      resolve(null);
    }, timeoutMs);

    window.addEventListener('message', responseHandler);
    window.postMessage(
      {
        type: 'CAMPUSOS_EXTENSION_REQUEST',
        id: requestId,
        payload: message,
      },
      '*'
    );
  });
}

/**
 * Primary React hook for CampusOS Web App components to interact with the Chrome Extension.
 */
export function useExtensionBridge(
  options: UseExtensionBridgeOptions = {}
): UseExtensionBridgeReturn {
  const { onViolation, autoPenalize = true, emitToast = true } = options;

  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).__CAMPUSOS_EXTENSION_INSTALLED__);
  });

  const [extensionState, setExtensionState] = useState<ExtensionState>('idle');
  const [lastViolation, setLastViolation] = useState<ViolationPayload | null>(null);
  const [violationAlert, setViolationAlert] = useState<string | null>(null);

  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  const clearAlert = useCallback(() => {
    setViolationAlert(null);
  }, []);

  const handleViolation = useCallback(
    (payload: ViolationPayload) => {
      setLastViolation(payload);
      const alertMsg = `-50 XP! Mèo Cam bắt quả tang bạn mở "${payload.domain || 'trang giải trí'}" trong giờ học!`;
      setViolationAlert(alertMsg);

      let penalty: PenaltyResult = { xpDeducted: 0, nextXp: 0, level: 1, rankTitle: '' };
      if (autoPenalize) {
        penalty = penalizeViolation(payload.penaltyXp || 50, payload.domain || 'blacklist_url');
      }

      if (emitToast && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('campusos:toast', {
            detail: {
              type: 'error',
              title: 'CẢNH CÁO KỶ LUẬT!',
              message: alertMsg,
              penaltyAmount: payload.penaltyXp || 50,
            },
          })
        );
      }

      if (onViolationRef.current) {
        onViolationRef.current(payload, penalty);
      }
    },
    [autoPenalize, emitToast]
  );

  // Send helpers
  const ping = useCallback(async () => {
    const res = await sendExtensionMessage({ action: 'PING' });
    if (res && (res.status === 'PONG' || res.installed)) {
      setIsInstalled(true);
      if (res.state) {
        setExtensionState(res.state);
      }
      return res;
    }
    return null;
  }, []);

  const startFocus = useCallback(
    async (durationSeconds = 1500, characterSlug = 'cat', mode = 'extreme') => {
      // Dispatch DOM custom event for instant zero-latency content script relay
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('campusos:pomodoro-start', {
            detail: { durationSeconds, characterSlug, mode },
          })
        );
      }
      const res = await sendExtensionMessage({
        action: 'START_FOCUS',
        durationSeconds,
        characterSlug,
        mode,
      });
      if (res) {
        setIsInstalled(true);
        setExtensionState('focusing');
      }
      return res;
    },
    []
  );

  const pauseFocus = useCallback(async () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('campusos:pomodoro-pause'));
    }
    const res = await sendExtensionMessage({ action: 'PAUSE_FOCUS' });
    if (res) {
      setExtensionState('idle');
    }
    return res;
  }, []);

  const stopFocus = useCallback(async () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('campusos:pomodoro-stop'));
    }
    const res = await sendExtensionMessage({ action: 'STOP_FOCUS' });
    if (res) {
      setExtensionState('idle');
    }
    return res;
  }, []);

  const requestExemption = useCallback(async (durationSeconds = 180) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('campusos:request-exemption', {
          detail: { durationSeconds },
        })
      );
    }
    return sendExtensionMessage({
      action: 'REQUEST_EXEMPTION',
      durationSeconds,
    });
  }, []);

  const sendMessage = useCallback(async (message: ExtensionMessage) => {
    return sendExtensionMessage(message);
  }, []);

  // Listen for extension events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check readiness banner
    if ((window as any).__CAMPUSOS_EXTENSION_INSTALLED__) {
      setIsInstalled(true);
    }

    // 2. Window postMessage listener
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window || !event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'CAMPUSOS_EXTENSION_BRIDGE_READY') {
        setIsInstalled(true);
      }

      if (event.data.type === 'CAMPUSOS_EXTENSION_EVENT') {
        const payload = event.data.payload as ViolationPayload;
        if (payload && payload.action === 'EXTENSION_VIOLATION') {
          handleViolation(payload);
        }
      }
    };

    // 3. Custom DOM Event listener
    const handleCustomViolation = (event: Event) => {
      const customEvent = event as CustomEvent<ViolationPayload>;
      if (customEvent.detail && customEvent.detail.action === 'EXTENSION_VIOLATION') {
        handleViolation(customEvent.detail);
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('campusos:extension-violation', handleCustomViolation);

    // Initial ping
    void ping();

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('campusos:extension-violation', handleCustomViolation);
    };
  }, [handleViolation, ping]);

  return {
    isInstalled,
    extensionState,
    lastViolation,
    violationAlert,
    clearAlert,
    startFocus,
    pauseFocus,
    stopFocus,
    requestExemption,
    ping,
    sendMessage,
  };
}
