'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, ArrowRight, Sparkles, RotateCcw, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { QuizQuestion } from '@/lib/coach-engine';
import { updateSharedState, calculateLevelAndRank } from '@/lib/campus-store';

interface InteractiveQuizCardProps {
  quiz: QuizQuestion[];
  onAnswerCorrect?: () => void;
  onComplete?: (score: number, totalXp: number) => void;
}

export function InteractiveQuizCard({
  quiz,
  onAnswerCorrect,
  onComplete,
}: InteractiveQuizCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [totalXpGained, setTotalXpGained] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = quiz[currentIndex];
  if (!quiz || quiz.length === 0 || !currentQ) return null;

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedIndex(index);
    setIsAnswered(true);

    const isCorrect = index === currentQ.correctIndex;
    if (isCorrect) {
      setScore((s) => s + 1);
      const xp = currentQ.xpReward || 15;
      setTotalXpGained((x) => x + xp);

      // Award XP to campus store immediately
      updateSharedState((prev) => {
        const nextXp = prev.xp + xp;
        const { level, rankTitle } = calculateLevelAndRank(nextXp);
        return { xp: nextXp, level, rankTitle };
      });

      if (onAnswerCorrect) {
        onAnswerCorrect();
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < quiz.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      if (onComplete) {
        onComplete(score + (selectedIndex === currentQ.correctIndex ? 1 : 0), totalXpGained);
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setIsAnswered(false);
    setScore(0);
    setTotalXpGained(0);
    setIsFinished(false);
  };

  if (isFinished) {
    const perfect = score === quiz.length;
    return (
      <div className="my-3 overflow-hidden rounded-2xl border border-emerald-400/30 bg-background/70 p-5 shadow-[0_4px_24px_rgba(16,185,129,0.15)] backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Award className="h-7 w-7" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-black">
              ★
            </span>
          </div>

          <span className="mb-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-300">
            Hoàn thành Mini Quiz
          </span>

          <h3 className="font-heading text-base font-bold">
            {perfect ? '🎉 Điểm tuyệt đối! Xuất sắc!' : '💪 Đã hoàn thành thử thách!'}
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Bạn đã trả lời đúng <strong className="text-foreground">{score}/{quiz.length}</strong> câu hỏi môn{' '}
            <strong className="text-violet-300">{currentQ.subject}</strong>.
          </p>

          <div className="my-3.5 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-amber-300">
            <Sparkles className="h-4 w-4" />
            <span className="font-mono text-xs font-bold">+{totalXpGained} XP thưởng đã nhận</span>
          </div>

          <Button
            onClick={handleRestart}
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold hover:bg-white/[0.08]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Thử sức lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-violet-500/30 bg-background/70 p-4 shadow-[0_4px_24px_rgba(124,92,255,0.12)] backdrop-blur-xl">
      {/* Header with question count and subject badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-bold text-violet-300">
          <Sparkles className="mr-1 inline-block h-3 w-3" /> {currentQ.subject}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            Câu {currentIndex + 1}/{quiz.length}
          </span>
          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
            +{currentQ.xpReward} XP
          </span>
        </div>
      </div>

      {/* Progress line */}
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / quiz.length) * 100}%` }}
        />
      </div>

      {/* Question title */}
      <p className="font-heading mb-4 text-sm font-bold leading-snug text-foreground">
        {currentQ.question}
      </p>

      {/* Options */}
      <div className="space-y-2">
        {currentQ.options.map((option, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = idx === currentQ.correctIndex;

          let btnStyle = 'border-border/70 bg-background/60 hover:border-violet-400 hover:bg-muted/40 text-foreground';

          if (isAnswered) {
            if (isCorrect) {
              btnStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-200 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.2)]';
            } else if (isSelected) {
              btnStyle = 'border-rose-500 bg-rose-500/15 text-rose-200 font-semibold';
            } else {
              btnStyle = 'border-border/40 opacity-50 text-muted-foreground';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={isAnswered}
              className={`w-full rounded-xl border-2 p-3 text-left text-xs transition-all ${btnStyle}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="leading-relaxed">{option}</span>
                {isAnswered && isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : isAnswered && isSelected && !isCorrect ? (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback & Explanation */}
      {isAnswered && (
        <div className="mt-3 rounded-xl border border-border/80 bg-background/70 p-3">
          <div className="mb-1 flex items-center gap-1.5 font-bold">
            {selectedIndex === currentQ.correctIndex ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Chính xác! (+{currentQ.xpReward} XP)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-rose-400">
                <XCircle className="h-3.5 w-3.5" /> Chưa chính xác!
              </span>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {currentQ.explanation}
          </p>

          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              onClick={handleNext}
              className="gap-1.5 rounded-xl bg-violet-600 font-bold hover:bg-violet-500"
            >
              {currentIndex < quiz.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
