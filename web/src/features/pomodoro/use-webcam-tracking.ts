'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
// @ts-ignore - Extension JS module
import * as WebcamTracker from '../../../../extension/ai/webcam-tracker.js';

const {
  WebcamFaceMonitor,
  DEFAULT_EAR_THRESHOLD,
  DEFAULT_SLEEP_DURATION_MS,
  DEFAULT_AWAY_YAW_THRESHOLD,
  DEFAULT_AWAY_PITCH_DOWN_THRESHOLD,
  DEFAULT_AWAY_PITCH_UP_THRESHOLD,
  DEFAULT_AWAY_DURATION_MS,
  DEFAULT_TARGET_FPS,
} = WebcamTracker as any;

import { SupervisorArbiter, type ViolationType } from './supervisor-arbiter';
import { CHARACTERS, type CharacterConfig } from './characters-data';
import { pomodoroAudio } from './audio-engine';

export const WEBCAM_STORAGE_KEY = 'campusos_webcam_enabled';

export type WebcamPermissionStatus =
  | 'idle'
  | 'prompt'
  | 'granted'
  | 'denied'
  | 'unsupported';

export interface WebcamTelemetry {
  ear: number;
  angles: { yaw: number; pitch: number; roll: number };
  status: 'idle' | 'normal' | 'drowsy' | 'looking_away' | 'no_face';
  drowsyDurationMs: number;
  awayDurationMs: number;
  deltaMs?: number;
}

export interface UseWebcamTrackingOptions {
  enabled?: boolean;
  characterSlug?: string;
  arbiter?: SupervisorArbiter;
  audioMuted?: boolean;
  onViolation?: (
    type: 'sleep' | 'face_away',
    details: { durationMs: number; metric: number | { yaw: number; pitch: number; roll: number } }
  ) => void;
  onTelemetry?: (telemetry: WebcamTelemetry) => void;
}

export interface IWebcamFaceMonitor {
  start: () => IWebcamFaceMonitor;
  stop: () => IWebcamFaceMonitor;
  pause: () => IWebcamFaceMonitor;
  resume: () => IWebcamFaceMonitor;
  toggle: (force?: boolean) => boolean;
  setEnabled: (enabled: boolean) => boolean;
  reset: () => IWebcamFaceMonitor;
  processFrame: (landmarks: any, deltaTimeMs?: number) => any;
  getTelemetry: () => any;
  isEnabled: boolean;
  isRunning: boolean;
  isPaused: boolean;
  currentStatus: string;
  drowsyDurationMs: number;
  awayDurationMs: number;
}

export interface UseWebcamTrackingReturn {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  permissionStatus: WebcamPermissionStatus;
  isTracking: boolean;
  isEnabled: boolean;
  telemetry: WebcamTelemetry;
  error: string | null;
  requestCamera: () => Promise<boolean>;
  stopCamera: () => void;
  toggleEnabled: (force?: boolean) => boolean;
  monitorRef: React.MutableRefObject<IWebcamFaceMonitor | null>;
  processFrameDirect: (landmarks: any, deltaMs?: number) => any;
}

/**
 * Hook quản lý theo dõi khuôn mặt bằng AI Webcam (MediaPipe Face Mesh algorithms)
 * Tích hợp chặt chẽ với SupervisorArbiter và kho lời thoại tiếng Việt characters-data.ts
 */
export function useWebcamTracking(options: UseWebcamTrackingOptions = {}): UseWebcamTrackingReturn {
  const {
    enabled = true,
    characterSlug = 'co-giao-chu-nhiem',
    arbiter,
    audioMuted = false,
    onViolation,
    onTelemetry,
  } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<WebcamPermissionStatus>('idle');
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const stored = localStorage.getItem(WEBCAM_STORAGE_KEY);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const [telemetry, setTelemetry] = useState<WebcamTelemetry>({
    ear: 0.30,
    angles: { yaw: 0, pitch: 0, roll: 0 },
    status: 'idle',
    drowsyDurationMs: 0,
    awayDurationMs: 0,
  });

  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const monitorRef = useRef<IWebcamFaceMonitor | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const loopIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Active character resolution
  const character: CharacterConfig = CHARACTERS[characterSlug] ?? CHARACTERS['co-giao-chu-nhiem']!;

  // Trigger Vietnamese TTS scolding for webcam violation
  const triggerWebcamRoast = useCallback(
    (violationType: 'sleep' | 'face_away') => {
      const currentArbiter = arbiter;
      if (currentArbiter && !currentArbiter.canRoast()) {
        return; // Respect 20s cooldown and exemption status
      }

      if (currentArbiter) {
        currentArbiter.registerRoast();
      }

      const quotes =
        violationType === 'sleep'
          ? character.quotes.sleep
          : character.quotes.face_away;

      const randomQuote =
        quotes[Math.floor(Math.random() * quotes.length)] ||
        quotes[0] ||
        (violationType === 'sleep'
          ? 'Tỉnh dậy học bài ngay!'
          : 'Nhìn thẳng vào màn hình học bài!');

      if (!audioMuted) {
        pomodoroAudio.playAlertSound('penalty');
        pomodoroAudio.speak(randomQuote, undefined, {
          gender: character.voiceGender,
          tone: 'angry',
        });
      }
    },
    [arbiter, audioMuted, character]
  );

  // Initialize WebcamFaceMonitor engine
  useEffect(() => {
    const monitor = new WebcamFaceMonitor({
      enabled: isEnabled && enabled,
      sleepDurationMs: DEFAULT_SLEEP_DURATION_MS,
      awayDurationMs: DEFAULT_AWAY_DURATION_MS,
      earThreshold: DEFAULT_EAR_THRESHOLD,
      awayYawThreshold: DEFAULT_AWAY_YAW_THRESHOLD,
      awayPitchDownThreshold: DEFAULT_AWAY_PITCH_DOWN_THRESHOLD,
      awayPitchUpThreshold: DEFAULT_AWAY_PITCH_UP_THRESHOLD,
      targetFps: DEFAULT_TARGET_FPS,
      onSleepDetected: (e: any) => {
        triggerWebcamRoast('sleep');
        onViolation?.('sleep', { durationMs: e.durationMs, metric: e.ear });
      },
      onFaceAwayDetected: (e: any) => {
        triggerWebcamRoast('face_away');
        onViolation?.('face_away', { durationMs: e.durationMs, metric: e.angles });
      },
      onFrame: (t: any) => {
        const nextTelemetry: WebcamTelemetry = {
          ear: t.ear,
          angles: t.angles,
          status: t.status,
          drowsyDurationMs: t.drowsyDurationMs,
          awayDurationMs: t.awayDurationMs,
          deltaMs: t.deltaMs,
        };
        setTelemetry(nextTelemetry);
        onTelemetry?.(nextTelemetry);
      },
    });

    monitorRef.current = monitor;
    if (isEnabled && enabled) {
      monitor.start();
    }

    return () => {
      monitor.stop();
      monitorRef.current = null;
    };
  }, [character, enabled, isEnabled, onTelemetry, onViolation, triggerWebcamRoast]);

  // Request camera permission and start video stream
  const requestCamera = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setPermissionStatus('unsupported');
      setError('Trình duyệt không hỗ trợ truy cập Webcam (MediaDevices API).');
      return false;
    }

    try {
      setPermissionStatus('prompt');
      setError(null);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      setStream(mediaStream);
      setPermissionStatus('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      monitorRef.current?.start();
      return true;
    } catch (err: any) {
      const isDenied =
        err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      setPermissionStatus(isDenied ? 'denied' : 'unsupported');
      setError(
        isDenied
          ? 'Người dùng đã từ chối cấp quyền truy cập Camera.'
          : err?.message || 'Không thể khởi động thiết bị Camera.'
      );
      return false;
    }
  }, []);

  // Stop camera and release hardware device
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    monitorRef.current?.stop();
    setTelemetry((prev) => ({
      ...prev,
      status: 'idle',
      drowsyDurationMs: 0,
      awayDurationMs: 0,
    }));
  }, [stream]);

  // Toggle monitoring on/off
  const toggleEnabled = useCallback(
    (force?: boolean): boolean => {
      const next = typeof force === 'boolean' ? force : !isEnabled;
      setIsEnabled(next);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(WEBCAM_STORAGE_KEY, String(next));
          window.dispatchEvent(
            new CustomEvent('campusos:webcam-toggle', { detail: { enabled: next } })
          );
        } catch {
          // ignore
        }
      }
      monitorRef.current?.toggle(next);
      if (!next && stream) {
        stopCamera();
      }
      return next;
    },
    [isEnabled, stopCamera, stream]
  );

  // Sync video element when stream is ready
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  // Process frame direct helper (used for testing or custom canvas loops)
  const processFrameDirect = useCallback((landmarks: any, deltaMs?: number) => {
    if (!monitorRef.current) return null;
    return monitorRef.current.processFrame(landmarks, deltaMs);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [stream]);

  const isTracking = Boolean(stream && isEnabled && permissionStatus === 'granted');

  return {
    stream,
    videoRef,
    permissionStatus,
    isTracking,
    isEnabled,
    telemetry,
    error,
    requestCamera,
    stopCamera,
    toggleEnabled,
    monitorRef,
    processFrameDirect,
  };
}
