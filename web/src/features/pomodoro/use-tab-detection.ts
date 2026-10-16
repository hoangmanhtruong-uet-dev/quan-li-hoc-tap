'use client';

import { useEffect, useRef } from 'react';

interface TabDetectionOptions {
  enabled: boolean;
  toleranceSeconds?: number; // Thời gian đệm tránh mắng nhầm khi giật lag
  onTabViolation: (durationSeconds: number) => void;
  onTabReturn: (durationSeconds: number) => void;
}

/**
 * Hook phát hiện rời tab (Page Visibility API) và mất focus cửa sổ (window blur).
 * Áp dụng cơ chế lọc nhiễu 3 giây theo tài liệu thiết kế.
 */
export function useTabDetection({
  enabled,
  toleranceSeconds = 3,
  onTabViolation,
  onTabReturn,
}: TabDetectionOptions) {
  const hiddenTimeRef = useRef<number | null>(null);
  const violationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isViolatingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled) {
      if (violationTimerRef.current) clearTimeout(violationTimerRef.current);
      hiddenTimeRef.current = null;
      isViolatingRef.current = false;
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab bị ẩn đi (người dùng chuyển sang Facebook, YouTube, ứng dụng khác...)
        hiddenTimeRef.current = Date.now();

        // Chờ hết thời gian đệm (toleranceSeconds) mới kích hoạt vi phạm
        violationTimerRef.current = setTimeout(() => {
          isViolatingRef.current = true;
          const awaySec = Math.round((Date.now() - (hiddenTimeRef.current || Date.now())) / 1000);
          onTabViolation(awaySec);
        }, toleranceSeconds * 1000);
      } else {
        // Người dùng vừa quay trở lại tab
        if (violationTimerRef.current) {
          clearTimeout(violationTimerRef.current);
          violationTimerRef.current = null;
        }

        if (hiddenTimeRef.current) {
          const durationSec = Math.round((Date.now() - hiddenTimeRef.current) / 1000);
          if (isViolatingRef.current) {
            onTabReturn(durationSec);
          }
        }
        hiddenTimeRef.current = null;
        isViolatingRef.current = false;
      }
    };

    const handleWindowBlur = () => {
      // Khi cửa sổ mất focus (ví dụ bấm sang ứng dụng khác)
      if (!hiddenTimeRef.current && !document.hidden) {
        hiddenTimeRef.current = Date.now();
        violationTimerRef.current = setTimeout(() => {
          isViolatingRef.current = true;
          const awaySec = Math.round((Date.now() - (hiddenTimeRef.current || Date.now())) / 1000);
          onTabViolation(awaySec);
        }, toleranceSeconds * 1000);
      }
    };

    const handleWindowFocus = () => {
      if (violationTimerRef.current) {
        clearTimeout(violationTimerRef.current);
        violationTimerRef.current = null;
      }
      if (hiddenTimeRef.current && isViolatingRef.current) {
        const durationSec = Math.round((Date.now() - hiddenTimeRef.current) / 1000);
        onTabReturn(durationSec);
      }
      hiddenTimeRef.current = null;
      isViolatingRef.current = false;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      if (violationTimerRef.current) clearTimeout(violationTimerRef.current);
    };
  }, [enabled, toleranceSeconds, onTabViolation, onTabReturn]);
}
