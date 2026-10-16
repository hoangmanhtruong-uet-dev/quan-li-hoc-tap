'use client';

import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, Play, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SuggestedStudyPlan } from '@/lib/coach-engine';
import { syncStudyPlanToCampusEvents } from '@/lib/coach-client-sync';

interface StudyPlanCardProps {
  plan: SuggestedStudyPlan;
  onAccepted?: () => void;
  onStartFocus?: (subject: string, minutes: number) => void;
}

export function StudyPlanCard({
  plan,
  onAccepted,
  onStartFocus,
}: StudyPlanCardProps) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [undoFn, setUndoFn] = useState<(() => void) | null>(null);

  const handleAccept = () => {
    const { undo } = syncStudyPlanToCampusEvents(plan);
    setUndoFn(() => undo);
    setIsAccepted(true);
    if (onAccepted) onAccepted();
  };

  const handleUndo = () => {
    if (undoFn) {
      undoFn();
      setUndoFn(null);
    }
    setIsAccepted(false);
  };

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-violet-500/30 bg-background/70 p-4 shadow-[0_4px_24px_rgba(124,92,255,0.12)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-bold text-violet-300">
          <Sparkles className="mr-1 inline-block h-3 w-3 text-cyan-400" /> Lộ trình gợi ý từ AI
        </span>
        <span className="flex items-center gap-1 font-mono text-xs font-semibold text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-cyan-400" /> {plan.totalMinutes} phút
        </span>
      </div>

      <h4 className="font-heading mb-3 text-sm font-bold text-foreground">
        {plan.title}
      </h4>

      {/* Plan Blocks */}
      <div className="space-y-2">
        {plan.blocks.map((block, idx) => (
          <div
            key={block.id || idx}
            className="relative flex items-start gap-3 rounded-xl border border-white/5 bg-background/50 p-2.5 transition-colors hover:border-violet-500/30"
          >
            <div className="mt-0.5 flex flex-col items-center">
              <span className={`h-2 w-2 rounded-full ${block.color || 'bg-violet-400'}`} />
              {idx < plan.blocks.length - 1 && (
                <span className="mt-1 h-8 w-px bg-white/10" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[11px] font-bold text-violet-300">
                  {block.time || `${block.start} - ${block.end}`}
                </span>
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {block.durationMin}p
                </span>
              </div>
              <p className="mt-0.5 text-xs font-bold text-foreground truncate">
                {block.title}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {block.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="mt-3 pt-2">
        {isAccepted ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Đã thêm vào Lịch học & Dashboard (+25 XP)</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 gap-2 rounded-xl bg-emerald-600 font-bold hover:bg-emerald-500"
                onClick={() =>
                  onStartFocus?.(
                    plan.blocks[0]?.subject || 'Mạng máy tính',
                    plan.blocks[0]?.durationMin || 45
                  )
                }
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Bắt đầu Focus khối đầu
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                className="gap-1 rounded-xl border border-white/10 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Hoàn tác
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={handleAccept}
            className="w-full gap-2 rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-white shadow-[0_0_15px_rgba(124,92,255,0.25)] hover:from-violet-500 hover:to-indigo-500"
          >
            <Calendar className="h-4 w-4" /> Chấp nhận kế hoạch (+25 XP)
          </Button>
        )}
      </div>
    </div>
  );
}
