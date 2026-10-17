'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { AuthFeatureCarousel } from '@/components/auth/auth-feature-carousel';

// Dynamic import Auth3DShowcase with ssr: false to prevent SSR hydration mismatch with WebGL
const Auth3DShowcase = dynamic(
  () => import('@/components/auth/auth-3d-showcase').then((mod) => mod.Auth3DShowcase),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[360px] flex items-center justify-center">
        <div className="h-16 w-16 rounded-full border-2 border-cyan-400/40 border-t-cyan-400 animate-spin" />
      </div>
    ),
  }
);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-[#080d19] text-white flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden select-none">
      {/* =========================================================================
          LEFT PANE (50% DESKTOP): 3D SHOWCASE & SUPERPOWER CAROUSEL
          (Hidden on mobile/tablet < 1024px for 120FPS GPU & battery efficiency)
          ========================================================================= */}
      <section
        aria-label="CampusOS 3D Showcase & Superpowers"
        className="hidden lg:flex lg:w-1/2 h-full flex-col justify-between border-r border-white/10 relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#0a0f24] to-[#080d19] p-8 xl:p-12 z-10"
      >
        {/* Ambient Aurora Glow in Left Pane */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-cyan-500/15 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-violet-600/15 blur-[100px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.04),transparent_70%)]" />

        {/* 1. Brand Header Top-Left */}
        <div className="relative z-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 font-black text-white text-xl shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform duration-300">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl tracking-tight text-white font-display">CampusOS</span>
                <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                  v2.5 Neo
                </span>
              </div>
              <p className="text-[11px] font-medium uppercase tracking-[.22em] text-slate-400">
                Student Companion Platform
              </p>
            </div>
          </Link>

          {/* Live Study Hours Badge */}
          <div className="hidden xl:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs text-slate-300 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] font-semibold tracking-wide">12,450+ GIỜ HỌC HÔM NAY</span>
          </div>
        </div>

        {/* 2. Middle: Three.js 3D Hologram Stage */}
        <div className="relative z-20 my-auto flex-1 flex flex-col items-center justify-center max-h-[440px]">
          <Auth3DShowcase />
        </div>

        {/* 3. Bottom: Dynamic Feature Carousel & Quotes */}
        <div className="relative z-20 mt-auto">
          <AuthFeatureCarousel />
        </div>
      </section>

      {/* =========================================================================
          RIGHT PANE (50% DESKTOP / 100% MOBILE): AUTH FORMS CONTAINER
          (Internal scrolling on desktop prevents outer double scrollbars)
          ========================================================================= */}
      <main
        role="main"
        className="flex-1 lg:w-1/2 h-full overflow-y-auto overflow-x-hidden scrollbar-thin relative flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12"
      >
        {/* Fluid Ambient Aurora Blobs */}
        <div className="pointer-events-none absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-cyan-500/15 blur-[130px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-violet-600/15 blur-[130px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/10 blur-[150px]" />

        {/* Mobile/Tablet Compact Brand Header (< 1024px) */}
        <div className="lg:hidden w-full max-w-md mx-auto mb-6 flex items-center justify-between z-10 pt-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 font-black text-white text-base shadow-md shadow-cyan-500/20">
              C
            </div>
            <div>
              <span className="font-black text-lg text-white font-display">CampusOS</span>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Student Companion</p>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Cyber-Glass</span>
          </div>
        </div>

        {/* Auth Form Children Container */}
        <div className="w-full max-w-md my-auto relative z-10">
          {children}
        </div>

        {/* Footer Copyright */}
        <div className="w-full max-w-md mx-auto mt-6 text-center text-xs text-slate-500 z-10 pb-4">
          <span>&copy; {new Date().getFullYear()} CampusOS &middot; Nền tảng học tập thông minh sinh viên Việt Nam</span>
        </div>
      </main>
    </div>
  );
}
