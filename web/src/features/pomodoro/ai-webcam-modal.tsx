'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Eye,
  EyeOff,
  Camera,
  CameraOff,
  ShieldCheck,
  Activity,
  Sparkles,
  X,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  useWebcamTracking,
  type UseWebcamTrackingReturn,
  type WebcamTelemetry,
} from './use-webcam-tracking';
import { CHARACTERS, type CharacterConfig } from './characters-data';
import { SupervisorArbiter } from './supervisor-arbiter';

export interface AiWebcamModalProps {
  open: boolean;
  onClose: () => void;
  characterSlug?: string;
  arbiter?: SupervisorArbiter;
  tracking?: UseWebcamTrackingReturn;
  onViolation?: (type: 'sleep' | 'face_away', details: any) => void;
}

export function AiWebcamModal({
  open,
  onClose,
  characterSlug = 'co-giao-chu-nhiem',
  arbiter,
  tracking: externalTracking,
  onViolation,
}: AiWebcamModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Internal hook instance if external tracking hook is not supplied
  const internalTracking = useWebcamTracking({
    enabled: open,
    characterSlug,
    arbiter,
    onViolation,
  });

  const tracking = externalTracking || internalTracking;
  const {
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
  } = tracking;

  // Active character
  const character: CharacterConfig =
    CHARACTERS[characterSlug] ?? CHARACTERS['co-giao-chu-nhiem']!;

  if (!open || !mounted) return null;

  // Derived values for gauges
  const ear = telemetry.ear;
  const isEarNormal = ear >= 0.20;
  const earPercentage = Math.min(100, Math.max(0, (ear / 0.40) * 100));

  const yaw = telemetry.angles.yaw;
  const pitch = telemetry.angles.pitch;
  const roll = telemetry.angles.roll;

  const isYawNormal = Math.abs(yaw) <= 30;
  const isPitchNormal = pitch >= -25 && pitch <= 35;
  const isPoseNormal = isYawNormal && isPitchNormal;

  // Crosshair coordinate mapping (-45° to +45° maps to 10% - 90%)
  const crosshairX = Math.min(90, Math.max(10, 50 + (yaw / 45) * 40));
  const crosshairY = Math.min(90, Math.max(10, 50 - (pitch / 45) * 40));

  const drowsySeconds = (telemetry.drowsyDurationMs / 1000).toFixed(1);
  const awaySeconds = (telemetry.awayDurationMs / 1000).toFixed(1);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 backdrop-blur-xl p-3 sm:p-6 animate-fade-in"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Cài đặt AI Webcam Giám Sát Khuôn Mặt"
        className="relative my-auto w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/15 bg-gradient-to-b from-[#121220]/95 to-[#090912]/98 p-5 sm:p-7 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.85)]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C5CFF]/30 to-[#FF3DA5]/30 border border-[#7C5CFF]/40 shadow-[0_0_15px_rgba(124,92,255,0.3)]">
              <Eye className="h-5 w-5 text-[#3DE8FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase tracking-wider text-white">
                  AI Giám Sát Khuôn Mặt
                </h3>
                <Badge
                  variant="outline"
                  className="border-[#C6FF3D]/40 bg-[#C6FF3D]/10 text-[#C6FF3D] text-[10px] font-bold"
                >
                  MediaPipe Mesh
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Phát hiện ngủ gục (EAR &lt; 0.20) và quay mặt đi (&gt; 30°) liên tục &gt; 10 giây
              </p>
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-9 w-9 rounded-full text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Đóng cửa sổ"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Privacy Assurance Banner */}
        <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-200">
            <span className="font-bold text-emerald-300">
              100% In-Memory Local Processing:
            </span>{' '}
            Khung hình camera chỉ được phân tích trực tiếp trên bộ nhớ RAM để tính 468 mốc khuôn mặt và
            giải phóng ngay lập tức. Tuyệt đối KHÔNG lưu ảnh/video vào ổ đĩa và KHÔNG gửi dữ liệu
            lên bất kỳ máy chủ nào.
          </div>
        </div>

        {/* Main Grid: Video Preview & Gauges */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Video Preview Canvas Box */}
          <div className="relative aspect-video rounded-2xl border border-white/10 bg-black/60 overflow-hidden flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover -scale-x-100 transition-opacity duration-300 ${
                isTracking ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {!isTracking && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mb-3 text-slate-400">
                  <CameraOff className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-slate-300 mb-1">Camera đang tạm tắt</p>
                <p className="text-[11px] text-slate-500 mb-3 max-w-[200px]">
                  Bật camera để kiểm tra góc nhìn và tỷ lệ mở mắt
                </p>
                <Button
                  size="sm"
                  onClick={requestCamera}
                  className="rounded-xl bg-gradient-to-r from-[#7C5CFF] to-[#FF3DA5] hover:opacity-90 text-white font-bold text-xs h-8 px-4"
                >
                  <Camera className="h-3.5 w-3.5 mr-1.5" /> Bật Camera
                </Button>
              </div>
            )}

            {/* Live Telemetry Overlay on Active Stream */}
            {isTracking && (
              <>
                {/* Status Badge in corner */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${
                      telemetry.status === 'drowsy'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                        : telemetry.status === 'looking_away'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                        : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        telemetry.status === 'drowsy'
                          ? 'bg-rose-400'
                          : telemetry.status === 'looking_away'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                    {telemetry.status === 'drowsy'
                      ? `NGỦ GỤC (${drowsySeconds}s)`
                      : telemetry.status === 'looking_away'
                      ? `QUAY MẶT (${awaySeconds}s)`
                      : 'BÌNH THƯỜNG'}
                  </span>
                </div>

                {/* FPS Badge */}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono text-slate-400">
                  12.5 FPS · LOCAL
                </div>

                {/* Bottom Readout Strip */}
                <div className="absolute bottom-2 inset-x-2 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-300">
                  <span>EAR: {ear.toFixed(2)}</span>
                  <span>Yaw: {yaw > 0 ? `+${yaw}` : yaw}°</span>
                  <span>Pitch: {pitch > 0 ? `+${pitch}` : pitch}°</span>
                </div>
              </>
            )}
          </div>

          {/* Telemetry Gauges Side */}
          <div className="flex flex-col gap-3">
            {/* Eye Aspect Ratio (EAR) Bento Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#3DE8FF]" />
                  <span className="text-xs font-bold text-slate-200">
                    Tỷ Lệ Mở Mắt (EAR)
                  </span>
                </div>
                <span
                  className={`text-xs font-mono font-black ${
                    isEarNormal ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {ear.toFixed(3)}
                </span>
              </div>

              {/* Progress Bar with Threshold Marker at 0.20 (50% of 0.40 scale) */}
              <div className="relative h-2.5 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full transition-all duration-150 ${
                    isEarNormal
                      ? 'bg-gradient-to-r from-emerald-500 to-[#C6FF3D]'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${earPercentage}%` }}
                />
                {/* 0.20 Threshold Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-400 shadow-[0_0_4px_#f43f5e]"
                  style={{ left: '50%' }}
                  title="Ngưỡng nhắm mắt: 0.20"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Nhắm (&lt; 0.20)</span>
                <span className="font-semibold text-slate-300">
                  {telemetry.drowsyDurationMs > 0
                    ? `Nhắm: ${drowsySeconds}s / 10s`
                    : 'Mắt mở bình thường'}
                </span>
                <span>Mở (~0.30)</span>
              </div>
            </div>

            {/* Head Pose Bento Card with Compass Crosshair */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-[#FF3DA5]" />
                  <span className="text-xs font-bold text-slate-200">
                    Góc Đầu (Head Pose)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className={isYawNormal ? 'text-emerald-400' : 'text-amber-400'}>
                    Y: {yaw > 0 ? `+${yaw}` : yaw}°
                  </span>
                  <span className={isPitchNormal ? 'text-emerald-400' : 'text-amber-400'}>
                    P: {pitch > 0 ? `+${pitch}` : pitch}°
                  </span>
                </div>
              </div>

              {/* Interactive Crosshair Visualizer */}
              <div className="relative h-20 w-full rounded-xl bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center">
                {/* Safe zone circle (±30° bounds) */}
                <div
                  className={`h-12 w-16 rounded-lg border border-dashed transition-colors ${
                    isPoseNormal ? 'border-emerald-500/40' : 'border-amber-500/60 bg-amber-500/5'
                  }`}
                />
                {/* Center target indicator */}
                <div
                  className={`absolute h-3 w-3 rounded-full transition-all duration-100 -translate-x-1/2 -translate-y-1/2 shadow-lg ${
                    isPoseNormal
                      ? 'bg-[#3DE8FF] shadow-[0_0_8px_#3de8ff]'
                      : 'bg-amber-400 shadow-[0_0_10px_#f59e0b]'
                  }`}
                  style={{
                    left: `${crosshairX}%`,
                    top: `${crosshairY}%`,
                  }}
                />
                {/* Crosshair grid lines */}
                <div className="absolute inset-x-0 top-1/2 h-px bg-white/10 pointer-events-none" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-white/10 pointer-events-none" />
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>Quay trái/phải: ±30°</span>
                <span className="font-semibold text-slate-300">
                  {telemetry.awayDurationMs > 0
                    ? `Quay mặt: ${awaySeconds}s / 10s`
                    : 'Nhìn thẳng màn hình'}
                </span>
                <span>Gục đầu: -25°</span>
              </div>
            </div>
          </div>
        </div>

        {/* Supervisor Character Reaction Card */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-lg">
            🐱
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">{character.name}</span>
              <span className="text-[10px] text-slate-400">({character.role})</span>
            </div>
            <p className="text-[11px] text-slate-300 italic truncate">
              &quot;{character.quotes.face_away[0] || character.tagline}&quot;
            </p>
          </div>
        </div>

        {/* Footer Settings & Controls */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          {/* Toggle Switch */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isEnabled}
              onClick={() => toggleEnabled()}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isEnabled ? 'bg-gradient-to-r from-[#7C5CFF] to-[#3DE8FF]' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <div className="text-left">
              <span className="block text-xs font-bold text-slate-200">
                {isEnabled ? 'Đang Bật AI Giám Sát' : 'Đã Tắt AI Giám Sát'}
              </span>
              <span className="block text-[10px] text-slate-400">
                Tự động kiểm tra trong suốt buổi học
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {isTracking ? (
              <Button
                size="sm"
                variant="outline"
                onClick={stopCamera}
                className="rounded-xl border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs h-9 font-bold"
              >
                <CameraOff className="h-3.5 w-3.5 mr-1.5" /> Tắt Camera
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={requestCamera}
                className="rounded-xl bg-gradient-to-r from-[#7C5CFF] to-[#FF3DA5] hover:opacity-90 text-white text-xs h-9 font-bold"
              >
                <Camera className="h-3.5 w-3.5 mr-1.5" /> Thử Camera
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-white/20 text-slate-200 hover:bg-white/10 text-xs h-9 font-bold px-4"
            >
              Xong
            </Button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-center text-xs text-rose-400 bg-rose-500/10 py-1.5 px-3 rounded-xl border border-rose-500/20">
            {error}
          </p>
        )}
      </section>
    </div>,
    document.body
  );
}
