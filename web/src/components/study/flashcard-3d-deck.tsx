'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { calculateSm2Review, type AiGeneratedFlashcard, type Sm2Quality } from '@/lib/ai-study-engine';

interface Flashcard3dDeckProps {
  initialCards: AiGeneratedFlashcard[];
  onCompleteSession?: (cardsReviewed: number, totalXpEarned: number) => void;
}

export function Flashcard3dDeck({ initialCards, onCompleteSession }: Flashcard3dDeckProps) {
  const [cards, setCards] = useState<AiGeneratedFlashcard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionXp, setSessionXp] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [justRatedQuality, setJustRatedQuality] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardGroupRef = useRef<THREE.Group | null>(null);
  const targetRotationYRef = useRef(0);
  const currentRotationYRef = useRef(0);
  const mouseTiltRef = useRef({ x: 0, y: 0 });

  const currentCard = cards[currentIndex] || null;

  // Flip card
  const toggleFlip = useCallback(() => {
    setIsFlipped((prev) => {
      const next = !prev;
      targetRotationYRef.current = next ? Math.PI : 0;
      return next;
    });
  }, []);

  const handleNextCard = useCallback(() => {
    setIsFlipped(false);
    targetRotationYRef.current = 0;
    setJustRatedQuality(null);
    setCurrentIndex((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
  }, [cards.length]);

  const handlePrevCard = useCallback(() => {
    setIsFlipped(false);
    targetRotationYRef.current = 0;
    setJustRatedQuality(null);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : cards.length - 1));
  }, [cards.length]);

  // Keyboard shortcut: Space to flip, Arrow keys to navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        toggleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextCard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFlip, handleNextCard, handlePrevCard]);

  // Three.js 3D Glass Card Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Group holding the 3D card
    const cardGroup = new THREE.Group();
    scene.add(cardGroup);
    cardGroupRef.current = cardGroup;

    // Card Body: Rounded Box Geometry (Glass aesthetic)
    const cardGeo = new THREE.BoxGeometry(2.8, 1.8, 0.06);
    const cardMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const cardMesh = new THREE.Mesh(cardGeo, cardMat);
    cardGroup.add(cardMesh);

    // Neon Edge Wireframe
    const edges = new THREE.EdgesGeometry(cardGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.6,
    });
    const edgeLines = new THREE.LineSegments(edges, lineMat);
    cardGroup.add(edgeLines);

    // Ambient & Point Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const cyanPoint = new THREE.PointLight(0x06b6d4, 3, 10);
    cyanPoint.position.set(2, 2, 2.5);
    scene.add(cyanPoint);

    const purplePoint = new THREE.PointLight(0xa855f7, 3, 10);
    purplePoint.position.set(-2, -2, 2.5);
    scene.add(purplePoint);

    // Mouse Move Tilt Effect
    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      mouseTiltRef.current = { x: x * 0.15, y: y * 0.15 };
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth rotation toward target flip
      currentRotationYRef.current += (targetRotationYRef.current - currentRotationYRef.current) * 0.12;

      if (cardGroupRef.current) {
        cardGroupRef.current.rotation.y = currentRotationYRef.current + mouseTiltRef.current.x;
        cardGroupRef.current.rotation.x = mouseTiltRef.current.y;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      cardGeo.dispose();
      cardMat.dispose();
      edges.dispose();
      lineMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);


  const handleRateSm2 = (quality: Sm2Quality) => {
    if (!currentCard) return;

    const nextState = calculateSm2Review(
      currentCard.repetitions,
      currentCard.intervalDays,
      currentCard.easeFactor,
      quality
    );

    const updatedCard: AiGeneratedFlashcard = {
      ...currentCard,
      repetitions: nextState.repetitions,
      intervalDays: nextState.intervalDays,
      easeFactor: nextState.easeFactor,
      nextReviewAt: nextState.nextReviewAt,
    };

    const newCards = [...cards];
    newCards[currentIndex] = updatedCard;
    setCards(newCards);

    // XP calculation: 10 XP for review + quality bonus
    const xpBonus = quality >= 3 ? 15 : 5;
    setSessionXp((prev) => prev + xpBonus);
    setReviewedCount((prev) => prev + 1);
    setJustRatedQuality(quality);

    // Auto flip back and move to next card after 600ms
    setTimeout(() => {
      handleNextCard();
    }, 600);
  };

  if (!currentCard) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-white/10 rounded-2xl bg-card/40">
        Không tìm thấy thẻ ghi nhớ nào trong bộ học liệu này.
      </div>
    );
  }

  const difficultyColors = {
    EASY: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    MEDIUM: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    HARD: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header bar: Progress, Session XP & Quick info */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 font-mono font-bold border border-cyan-400/30">
            Thẻ {currentIndex + 1} / {cards.length}
          </span>
          <span className={`px-2.5 py-1 rounded-lg border font-mono font-medium ${difficultyColors[currentCard.difficulty]}`}>
            {currentCard.difficulty}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 text-muted-foreground border border-white/10">
            {currentCard.category}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-400/30 font-bold font-mono">
            <Award className="w-3.5 h-3.5" />
            <span>+{sessionXp} XP</span>
          </div>
          <span className="text-muted-foreground font-mono">
            Khoảng ôn: {currentCard.intervalDays} ngày (EF: {currentCard.easeFactor.toFixed(2)})
          </span>
        </div>
      </div>

      {/* 3D Glass Interactive Card Stage */}
      <div
        onClick={toggleFlip}
        className="relative w-full h-[320px] sm:h-[360px] rounded-3xl overflow-hidden cursor-pointer group border border-white/10 hover:border-cyan-400/40 transition-all shadow-[0_0_30px_rgba(6,182,212,0.15)] flex items-center justify-center bg-slate-950/60"
      >
        {/* Three.js Background Canvas */}
        <div ref={containerRef} className="absolute inset-0 pointer-events-none" />

        {/* Foreground Content (Front vs Back) */}
        <div className="relative z-10 max-w-xl mx-auto px-6 py-8 text-center space-y-4 pointer-events-none">
          {!isFlipped ? (
            /* FRONT FACE */
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-semibold">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Mặt trước: Câu hỏi / Khái niệm</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug drop-shadow-md">
                {currentCard.front}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">
                [Bấm chuột hoặc gõ <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300">Space</kbd> để lật đáp án]
              </p>
            </div>
          ) : (
            /* BACK FACE */
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mặt sau: Định nghĩa & Giải thích</span>
              </div>
              <div className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed max-h-48 overflow-y-auto px-2">
                {currentCard.back}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono pt-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ôn kế tiếp: Sau {currentCard.intervalDays} ngày</span>
              </div>
            </div>
          )}
        </div>

        {/* Flip Badge Indicator */}
        <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground bg-background/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 pointer-events-none">
          <RotateCcw className="w-3 h-3 text-cyan-400" />
          <span>{isFlipped ? 'Đang mở mặt sau' : 'Lật thẻ 180°'}</span>
        </div>
      </div>

      {/* SM-2 Rating Controls (Revealed when card is flipped) */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-center text-muted-foreground">
          {isFlipped
            ? 'Đánh giá độ ghi nhớ của bạn (Thuật toán SuperMemo SM-2):'
            : 'Lật thẻ để tự đánh giá độ ghi nhớ và tính lịch ôn tập ngắt quãng.'}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            type="button"
            disabled={!isFlipped}
            onClick={() => handleRateSm2(1)}
            className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center gap-0.5"
          >
            <span>Quên hẳn (0-1)</span>
            <span className="text-[10px] opacity-70 font-mono">Lặp lại ngay</span>
          </button>

          <button
            type="button"
            disabled={!isFlipped}
            onClick={() => handleRateSm2(2)}
            className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center gap-0.5"
          >
            <span>Nhớ mang máng (2)</span>
            <span className="text-[10px] opacity-70 font-mono">Ôn sau 1 ngày</span>
          </button>

          <button
            type="button"
            disabled={!isFlipped}
            onClick={() => handleRateSm2(3)}
            className="p-2.5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center gap-0.5"
          >
            <span>Đúng nhưng khó (3)</span>
            <span className="text-[10px] opacity-70 font-mono">Khoảng 1-6 ngày</span>
          </button>

          <button
            type="button"
            disabled={!isFlipped}
            onClick={() => handleRateSm2(4)}
            className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center gap-0.5"
          >
            <span>Nhớ tốt (4)</span>
            <span className="text-[10px] opacity-70 font-mono">Tăng khoảng cách</span>
          </button>

          <button
            type="button"
            disabled={!isFlipped}
            onClick={() => handleRateSm2(5)}
            className="p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed col-span-2 sm:col-span-1 flex flex-col items-center gap-0.5 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            <span>Hoàn hảo (5)</span>
            <span className="text-[10px] opacity-70 font-mono">+15 XP • Tối ưu</span>
          </button>
        </div>
      </div>

      {/* Navigation Buttons: Previous / Next */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <button
          type="button"
          onClick={handlePrevCard}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-foreground border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Thẻ trước</span>
        </button>

        <div className="text-xs text-muted-foreground font-mono">
          Đã ôn: <span className="text-cyan-400 font-bold">{reviewedCount}</span> lượt
        </div>

        <button
          type="button"
          onClick={handleNextCard}
          className="px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(61,232,255,0.15)]"
        >
          <span>Thẻ kế tiếp</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
