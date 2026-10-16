'use client';

import React, { memo, useEffect, useRef } from 'react';
import { Flame, Hand } from 'lucide-react';
import type { CatSkinType } from './characters-data';
import { pomodoroAudio } from './audio-engine';
import type { AvatarMood } from './talking-tom-3d';

interface MemeCatStageProps {
  mood: AvatarMood;
  characterName: string;
  timerLabel: string;
  skinType?: CatSkinType;
  isSpeaking?: boolean;
  running?: boolean;
  currentSpeech?: string;
  onPoke?: () => void;
}

/**
 * MemeCatStage: Tái hiện chuẩn 100% bức ảnh mẫu của User:
 * - Chú Mèo Cam Mập ảnh thật tách nền nằm chễm chệ góc phải với ánh mắt lườm phán xét
 * - Hộp đồng hồ xám полу-trong suốt (0:52) nằm bên trái
 * - Siêu mượt 120FPS (Sử dụng GPU CSS Transform thuần, 0% giật lag!)
 * - Khi nói: Miệng mèo mở/đóng và thân mèo rung theo nhịp âm thanh thật
 */
export const MemeCatStage = memo(function MemeCatStage({
  mood,
  characterName,
  timerLabel,
  skinType = 'teacher',
  isSpeaking = false,
  running = false,
  currentSpeech,
  onPoke,
}: MemeCatStageProps) {
  const catBodyRef = useRef<HTMLDivElement | null>(null);
  const mouthOverlayRef = useRef<HTMLDivElement | null>(null);
  const isSpeakingRef = useRef<boolean>(isSpeaking);
  const moodRef = useRef<AvatarMood>(mood);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  // Vòng lặp siêu nhẹ chỉ điều khiển độ mở miệng và độ nhún của ảnh Mèo khi đang phát giọng Bắc
  useEffect(() => {
    let rafId: number;

    const updateLipSync = () => {
      rafId = requestAnimationFrame(updateLipSync);
      if (document.hidden) return;

      const catEl = catBodyRef.current;
      const mouthEl = mouthOverlayRef.current;
      if (!catEl || !mouthEl) return;

      if (isSpeakingRef.current) {
        const openness = pomodoroAudio.getMouthOpenness();
        // Miệng mở theo âm lượng thật
        const mouthScaleY = 0.2 + openness * 1.45;
        mouthEl.style.opacity = openness > 0.05 ? '1' : '0';
        mouthEl.style.transform = `translate(-50%, -50%) scale(1, ${mouthScaleY.toFixed(2)})`;

        // Thân mèo nhún nhẹ theo từng chữ mắng
        const bounce = 1 + openness * 0.035;
        const tilt = (moodRef.current === 'angry' || moodRef.current === 'roasting')
          ? Math.sin(performance.now() * 0.025) * 1.8
          : 0;
        catEl.style.transform = `scale(${bounce.toFixed(3)}) rotate(${tilt.toFixed(2)}deg)`;
      } else {
        mouthEl.style.opacity = '0';
        mouthEl.style.transform = 'translate(-50%, -50%) scale(1, 0.2)';
        catEl.style.transform = 'scale(1) rotate(0deg)';
      }
    };

    updateLipSync();
    return () => cancelAnimationFrame(rafId);
  }, []);

  const isFurious = mood === 'angry' || mood === 'roasting';

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 shadow-2xl select-none">
      {/* Giả lập nền trang web bị Mèo đè lên giống bức ảnh mẫu */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="h-7 w-full bg-slate-800/80 border-b border-white/10 flex items-center px-3 gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="ml-3 h-3.5 w-48 rounded-full bg-slate-700" />
        </div>
        <div className="p-4 space-y-2.5 text-[10px] font-mono text-slate-400">
          <div className="h-3 w-3/4 rounded bg-slate-700/60" />
          <div className="h-3 w-1/2 rounded bg-slate-700/40" />
          <div className="h-16 w-2/3 rounded-xl bg-slate-800/50" />
          <div className="h-3 w-5/6 rounded bg-slate-700/50" />
        </div>
      </div>

      {/* Bố cục chính: Bảng Đồng Hồ Xám bên trái + Mèo Cam Mập khổng lồ bên phải */}
      <div className="relative flex min-h-[300px] sm:min-h-[330px] items-center justify-between px-4 pt-6 pb-2">
        {/* 1. HỘP ĐỒNG HỒ XÁM BÁN TRONG SUỐT (Chuẩn y hệt ảnh mẫu 0:52) */}
        <div className="relative z-20 ml-1 sm:ml-4 flex flex-col items-start">
          <div
            className={`flex flex-col items-center justify-center rounded-2xl px-6 py-4 sm:px-8 sm:py-5 shadow-2xl transition-colors duration-300 ${
              isFurious
                ? 'bg-rose-900/85 border-2 border-rose-400/60'
                : 'bg-neutral-600/85 border border-white/20'
            }`}
            style={{ backdropFilter: 'blur(4px)' }}
          >
            <span className="font-sans text-5xl sm:text-6xl font-bold tracking-tight text-white drop-shadow-md">
              {timerLabel}
            </span>
            <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/80">
              {running ? 'Đang canh màn hình' : 'Sẵn sàng học'}
            </span>
          </div>

          {/* Bong bóng lời thoại giọng Bắc */}
          {currentSpeech && (
            <div className="mt-3 max-w-[240px] sm:max-w-[270px] rounded-2xl border border-rose-500/40 bg-slate-950/95 px-3.5 py-2.5 text-xs font-semibold leading-relaxed text-rose-100 shadow-xl">
              &ldquo;{currentSpeech}&rdquo;
            </div>
          )}
        </div>

        {/* 2. CHÚ MÈO CAM MẬP ẢNH THẬT TÁCH NỀN (Nằm chễm chệ góc phải) */}
        <div
          ref={catBodyRef}
          onClick={() => {
            pomodoroAudio.playAlertSound('poke');
            onPoke?.();
          }}
          title="Chọc vào bụng Mèo Cam Mập thử xem!"
          className="relative z-10 -mr-4 -mb-4 w-[270px] sm:w-[340px] cursor-pointer transition-transform duration-75"
        >
          {/* Hình Mèo Cam Mập thật đã tách nền PNG trong suốt */}
          <img
            src="/images/fat-orange-cat.png"
            alt={characterName}
            draggable={false}
            className="w-full h-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)]"
          />

          {/* Miệng nhép động khớp vị trí mõm của chú Mèo Cam */}
          <div
            ref={mouthOverlayRef}
            style={{
              left: '72.3%',
              top: '42.8%',
              width: '7.5%',
              height: '4.2%',
              opacity: 0,
            }}
            className="pointer-events-none absolute rounded-full bg-rose-950 border border-rose-400/50 shadow-inner transition-opacity duration-75"
          >
            <div className="mx-auto mt-1 h-1/2 w-2/3 rounded-full bg-rose-400" />
          </div>

          {/* Phụ kiện Skin đeo trực tiếp lên Mèo Cam Mập */}
          {skinType === 'teacher' && (
            /* Kính gọng vàng Cô Giáo */
            <svg
              viewBox="0 0 120 45"
              style={{ left: '59.5%', top: '25.5%', width: '25%' }}
              className="pointer-events-none absolute drop-shadow-md"
            >
              <circle cx="32" cy="22" r="16" fill="none" stroke="#fbbf24" strokeWidth="3.5" />
              <circle cx="88" cy="22" r="16" fill="none" stroke="#fbbf24" strokeWidth="3.5" />
              <line x1="48" y1="22" x2="72" y2="22" stroke="#fbbf24" strokeWidth="3.5" />
            </svg>
          )}

          {skinType === 'ceo' && (
            /* Kính râm đen Tổng Tài */
            <svg
              viewBox="0 0 120 45"
              style={{ left: '59%', top: '26%', width: '26%' }}
              className="pointer-events-none absolute drop-shadow-lg"
            >
              <rect x="12" y="8" width="40" height="24" rx="4" fill="#090d16" stroke="#fbbf24" strokeWidth="2.5" />
              <rect x="68" y="8" width="40" height="24" rx="4" fill="#090d16" stroke="#fbbf24" strokeWidth="2.5" />
              <line x1="52" y1="16" x2="68" y2="16" stroke="#fbbf24" strokeWidth="3" />
            </svg>
          )}

          {(skinType === 'boss' || skinType === 'teacher') && (
            /* Cà vạt đỏ KPI trước ngực mèo */
            <svg
              viewBox="0 0 60 90"
              style={{ left: '68%', top: '47%', width: '11%' }}
              className="pointer-events-none absolute drop-shadow-md rotate-[8deg]"
            >
              <polygon points="22,0 38,0 35,16 25,16" fill="#be123c" />
              <polygon points="25,16 35,16 42,68 30,85 18,68" fill="#e11d48" />
            </svg>
          )}

          {/* Hiệu ứng Biểu tượng Tức Giận trên trán mèo khi đang mắng */}
          {isFurious && (
            <div
              style={{ left: '82%', top: '12%' }}
              className="pointer-events-none absolute flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white shadow-lg animate-bounce"
            >
              <Flame className="h-3 w-3 fill-current" /> Quạo!
            </div>
          )}
        </div>
      </div>

      {/* Thanh trạng thái dưới chân */}
      <div className="relative z-20 flex items-center justify-between border-t border-white/10 bg-slate-950/90 px-4 py-2 text-[11px]">
        <span className="font-bold text-amber-300">{characterName}</span>
        <span className="flex items-center gap-1 text-slate-400">
          <Hand className="h-3 w-3 text-amber-400" /> Bấm vào bụng mèo để trêu mèo
        </span>
      </div>
    </div>
  );
});
