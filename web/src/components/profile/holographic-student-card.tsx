'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Check, Copy, QrCode, RotateCw, ShieldCheck, Sparkles, Wifi } from 'lucide-react';
import { uploadStudentAvatar } from '@/lib/storage-engine';
import { TierBadge } from '@/components/monetization/tier-badge';
import { type LabTier } from '@/lib/monetization-matrix';
import { useCampusStore } from '@/lib/campus-store';

export interface StudentProfileData {
  fullName: string;
  studentId: string;
  email: string;
  major: string;
  university: string;
  cohort: string;
  avatarUrl?: string;
}

export interface HolographicStudentCardProps {
  profile: StudentProfileData;
  tier?: LabTier;
  onAvatarChange?: (newAvatarUrl: string) => void;
  reducedMotion?: boolean;
  className?: string;
}

export function HolographicStudentCard({
  profile,
  tier,
  onAvatarChange,
  reducedMotion = false,
  className = '',
}: HolographicStudentCardProps) {
  const { state: campusState } = useCampusStore();
  const effectiveTier = tier || campusState.tier || 'free';
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(profile.avatarUrl);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (profile.avatarUrl) {
      setAvatarUrl(profile.avatarUrl);
    } else if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('campusos-profile-avatar-v1');
      if (saved) {
        setAvatarUrl(saved);
      }
    }
  }, [profile.avatarUrl]);

  // Handle 3D perspective tilt
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt: -12 to +12 degrees
      const rotY = ((clientX - centerX) / centerX) * 12;
      const rotX = -((clientY - centerY) / centerY) * 12;

      // Calculate glare coordinates (0-100%)
      const glareX = (clientX / rect.width) * 100;
      const glareY = (clientY / rect.height) * 100;

      setRotateX(rotX);
      setRotateY(rotY);
      setGlarePos({ x: glareX, y: glareY, opacity: 0.65 });
    },
    [reducedMotion]
  );

  const handlePointerLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos({ x: 50, y: 50, opacity: 0 });
  }, []);

  const handleCopyId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(profile.studentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setIsUploading(true);
    try {
      const stored = await uploadStudentAvatar(file, profile.studentId);
      if (stored?.url) {
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem('campusos-profile-avatar-v1', stored.url);
          } catch {
            // Storage quota fallback
          }
        }
        setAvatarUrl(stored.url);
        onAvatarChange?.(stored.url);
      }
    } catch (err) {
      console.warn('[HolographicStudentCard] Avatar upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const initials = profile.fullName
    .split(' ')
    .slice(-2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* 3D Perspective Card Container */}
      <div
        className="w-full max-w-[440px] h-[260px] sm:h-[270px] cursor-pointer"
        style={{ perspective: '1100px' }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={() => setIsFlipped((prev) => !prev)}
      >
        <div
          ref={cardRef}
          className="relative w-full h-full rounded-2xl transition-transform duration-300 ease-out preserve-3d"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY + (isFlipped ? 180 : 0)}deg)`,
          }}
        >
          {/* ================= FRONT FACE ================= */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl p-5 overflow-hidden border border-white/20 bg-slate-950/70 backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.5),0_0_20px_rgba(61,232,255,0.15)] flex flex-col justify-between"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* Holographic Sheen Overlay */}
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl mix-blend-color-dodge transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(61, 232, 255, 0.4) 0%, rgba(124, 92, 255, 0.3) 30%, rgba(198, 255, 61, 0.25) 55%, transparent 75%)`,
                opacity: glarePos.opacity,
              }}
            />

            {/* Subtle Diagonal Holographic Rainbow Texture */}
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-20"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(135deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 2px, transparent 2px, transparent 10px)',
              }}
            />

            {/* Card Header */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-600 shadow-md">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="block text-[10px] font-black tracking-widest text-cyan-400 uppercase">
                    CAMPUS OS · SMART PASS
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {profile.university || 'Đại học Quốc gia Hà Nội'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TierBadge tier={effectiveTier} size="xs" />
                <Wifi className="h-4 w-4 text-cyan-300 rotate-90" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-cyan-400/40 bg-cyan-500/10 text-cyan-300">
                  K66
                </span>
              </div>
            </div>

            {/* Golden Security Microchip & Contactless Coil */}
            <div className="relative z-10 flex items-center gap-4 my-auto">
              {/* Golden Smart Microchip SVG */}
              <div className="relative h-11 w-14 rounded-md border border-amber-400/60 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)] overflow-hidden shrink-0">
                <svg viewBox="0 0 56 44" className="w-full h-full opacity-70">
                  <line x1="0" y1="14" x2="56" y2="14" stroke="#8A5A00" strokeWidth="1" />
                  <line x1="0" y1="30" x2="56" y2="30" stroke="#8A5A00" strokeWidth="1" />
                  <line x1="28" y1="0" x2="28" y2="44" stroke="#8A5A00" strokeWidth="1" />
                  <rect x="20" y="10" width="16" height="24" rx="3" fill="#D49B00" stroke="#5C3B00" strokeWidth="1" />
                </svg>
              </div>

              {/* Holographic Watermark Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] font-medium text-slate-300 tracking-wider">
                  VERIFIED STUDENT
                </span>
              </div>

              <TierBadge tier={effectiveTier} size="sm" showIcon />
            </div>

            {/* Student Info & Photo Row */}
            <div className="relative z-10 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-black tracking-tight text-white truncate drop-shadow-sm">
                  {profile.fullName}
                </h3>
                <p className="text-xs text-cyan-200/90 font-medium truncate">
                  {profile.major || 'Khoa học Máy tính & Kỹ thuật'}
                </p>

                {/* Copyable Student ID */}
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-300 hover:text-cyan-300 transition-colors px-2 py-0.5 rounded bg-white/5 border border-white/10"
                  title="Nhấn để sao chép MSSV"
                >
                  <span>MSSV: {profile.studentId}</span>
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-slate-400 hover:text-white" />
                  )}
                </button>
              </div>

              {/* Avatar with Camera Uploader */}
              <div className="relative group shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className="h-16 w-16 rounded-xl overflow-hidden border-2 border-cyan-400/50 bg-gradient-to-tr from-cyan-600 to-violet-600 shadow-lg flex items-center justify-center">
                  {(avatarUrl || profile.avatarUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl || profile.avatarUrl}
                      alt={profile.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-black text-white">{initials}</span>
                  )}
                </div>

                <label
                  aria-label="Cập nhật ảnh đại diện"
                  className={`absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-cyan-500 text-slate-950 shadow-md hover:bg-cyan-400 hover:scale-110 transition-transform ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Camera className="h-3 w-3" />
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* ================= BACK FACE ================= */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl p-5 overflow-hidden border border-white/20 bg-slate-950/85 backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.5)] flex flex-col justify-between"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Magnetic Stripe */}
            <div className="-mx-5 -mt-2 h-10 bg-gradient-to-r from-slate-900 via-black to-slate-900 border-y border-white/10" />

            {/* Back Details */}
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Gói dịch vụ Campus LAB:</span>
                <TierBadge tier={effectiveTier} size="xs" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Khóa đào tạo:</span>
                <span className="font-mono font-semibold text-slate-200">2023 - 2027</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Hệ đào tạo:</span>
                <span className="font-semibold text-cyan-300">Chính quy Chất lượng cao</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Email trường:</span>
                <span className="font-mono text-slate-300 truncate max-w-[200px]">
                  {profile.email}
                </span>
              </div>
            </div>

            {/* QR Code Pass & Barcode */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="space-y-1">
                <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                  CAMPUS DIGITAL BARCODE
                </span>
                {/* SVG Barcode Mock */}
                <div className="flex items-center gap-[2px] h-6">
                  {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3].map((w, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-300 h-full"
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </div>
              </div>

              {/* Vector QR Pass */}
              <div className="p-1.5 rounded-lg bg-white shadow-md">
                <QrCode className="h-10 w-10 text-slate-950" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Helper Tip */}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <RotateCw className="h-3.5 w-3.5 text-cyan-400 animate-spin-slow" />
        <span>Nhấn vào thẻ để lật mặt sau · Rê chuột để xem hiệu ứng Hologram</span>
      </div>
    </div>
  );
}
