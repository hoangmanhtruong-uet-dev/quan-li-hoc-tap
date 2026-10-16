'use client';

import { useEffect, useRef } from 'react';
import { pomodoroAudio } from '@/features/pomodoro/audio-engine';

interface UseCatAudioLipSyncProps {
  isSpeaking: boolean;
  onJawOpenChange: (openness: number) => void;
  sensitivity?: number;
}

export function useCatAudioLipSync({
  isSpeaking,
  onJawOpenChange,
  sensitivity = 1.0,
}: UseCatAudioLipSyncProps) {
  const isSpeakingRef = useRef(isSpeaking);
  const onJawOpenChangeRef = useRef(onJawOpenChange);
  const sensitivityRef = useRef(sensitivity);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    onJawOpenChangeRef.current = onJawOpenChange;
  }, [onJawOpenChange]);

  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  useEffect(() => {
    let animId: number;

    const tick = () => {
      if (isSpeakingRef.current) {
        const openness = pomodoroAudio.getMouthOpenness() * sensitivityRef.current;
        onJawOpenChangeRef.current(Math.min(1.0, Math.max(0, openness)));
      } else {
        onJawOpenChangeRef.current(0);
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);
}
