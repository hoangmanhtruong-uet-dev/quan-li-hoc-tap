'use client';

import React, { useEffect, useRef } from 'react';

interface InteractiveCursorProps {
  reducedMotion?: boolean;
}

export function InteractiveCursor({ reducedMotion = false }: InteractiveCursorProps) {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Guard against SSR, touch devices, and reduced motion
    if (typeof window === 'undefined') return;
    const isTouch = !window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouch || prefersReducedMotion || reducedMotion) {
      return;
    }

    // 2. High-performance position tracking without React re-renders
    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isHovering = false;
    let isClicking = false;
    let isVisible = false;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        if (dotRef.current) dotRef.current.style.opacity = '1';
        if (ringRef.current) ringRef.current.style.opacity = '1';
      }
    };

    const onMouseDown = () => {
      isClicking = true;
    };

    const onMouseUp = () => {
      isClicking = false;
    };

    const onMouseLeave = () => {
      isVisible = false;
      if (dotRef.current) dotRef.current.style.opacity = '0';
      if (ringRef.current) ringRef.current.style.opacity = '0';
    };

    const onMouseEnter = () => {
      isVisible = true;
      if (dotRef.current) dotRef.current.style.opacity = '1';
      if (ringRef.current) ringRef.current.style.opacity = '1';
    };

    // Detect interactive target hover
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactiveEl = target.closest(
        'a, button, input, select, textarea, [role="button"], [data-interactive="true"], .neo-card, .sticker-badge, kbd'
      );
      isHovering = !!interactiveEl;
    };

    // 3. 120FPS animation frame loop using linear interpolation
    const render = () => {
      // Lerp ring toward mouse
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }

      if (ringRef.current) {
        const ringScale = isClicking ? 0.75 : isHovering ? 1.6 : 1;
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) scale(${ringScale})`;
        if (isHovering) {
          ringRef.current.style.borderColor = 'var(--theme-accent, #C6FF3D)';
          ringRef.current.style.boxShadow = '0 0 16px -2px var(--theme-accent, #C6FF3D)';
        } else {
          ringRef.current.style.borderColor = 'rgba(255, 255, 255, 0.45)';
          ringRef.current.style.boxShadow = 'none';
        }
      }

      rafId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    window.addEventListener('mouseover', onMouseOver, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none">
      {/* Central sharp neon dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 -ml-1 -mt-1 w-2 h-2 rounded-full bg-primary opacity-0 transition-opacity duration-150 shadow-[0_0_8px_var(--theme-accent,#C6FF3D)]"
        style={{ willChange: 'transform' }}
      />
      {/* Trailing expanding ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 -ml-4 -mt-4 w-8 h-8 rounded-full border-2 border-white/50 opacity-0 transition-opacity duration-150 backdrop-blur-[0.5px]"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
}
