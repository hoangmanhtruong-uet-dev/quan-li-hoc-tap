'use client';

import React, { useState } from 'react';
import { X, Sparkles, Check, Plus, Calendar, Clock, MapPin } from 'lucide-react';
import { type CalendarEvent, useCampusStore } from '@/lib/campus-store';
import { generateSuggestedStudyBlocks } from '@/lib/auto-scheduler';
import { Button } from '@/components/ui/button';
import { EVENT_META } from './smart-filters';

interface AiSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptBlocks: (blocks: CalendarEvent[]) => void;
}

export function AiSchedulerModal({ isOpen, onClose, onAcceptBlocks }: AiSchedulerModalProps) {
  const { state } = useCampusStore();
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());

  // Generate suggested study blocks
  const suggestedBlocks = React.useMemo(() => {
    if (!isOpen) return [];
    const blocks = generateSuggestedStudyBlocks(state.deadlines, state.events, new Date(), {
      windowDays: 14,
      studyBlockDurationMinutes: 60,
      dailyMaxLoadScore: 60,
    });
    return blocks;
  }, [isOpen, state.deadlines, state.events]);

  // Select all by default when modal opens
  React.useEffect(() => {
    if (suggestedBlocks.length > 0) {
      setSelectedBlockIds(new Set(suggestedBlocks.map((b) => b.id)));
    }
  }, [suggestedBlocks]);

  if (!isOpen) return null;

  const toggleBlock = (id: string) => {
    const next = new Set(selectedBlockIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedBlockIds(next);
  };

  const handleConfirm = () => {
    const blocksToApply = suggestedBlocks.filter((b) => selectedBlockIds.has(b.id));
    if (blocksToApply.length > 0) {
      onAcceptBlocks(blocksToApply);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-scheduler-title"
        className="relative flex w-full max-w-2xl max-h-[85vh] flex-col rounded-[26px] border-2 border-violet-500/60 bg-[#121224] p-6 shadow-[8px_8px_0px_#000] hard-border"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-300">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span>AI AUTO-SCHEDULER</span>
            </div>
            <h2 id="ai-scheduler-title" className="font-heading text-2xl font-black text-foreground mt-2">
              ✨ Xếp Lịch Ôn Tập Tự Động
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              AI đã quét các kỳ thi & deadline sắp tới và tìm các khung giờ trống lý tưởng nhất để bạn ôn bài.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-muted-foreground hover:text-foreground"
            aria-label="Đóng hộp thoại"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Suggested Blocks List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {suggestedBlocks.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="font-bold">Lịch của bạn đã quá tối ưu hoặc không có deadline mới!</p>
              <p className="text-xs mt-1">Không cần chèn thêm phiên học nào.</p>
            </div>
          ) : (
            suggestedBlocks.map((block) => {
              const isChecked = selectedBlockIds.has(block.id);
              return (
                <div
                  key={block.id}
                  onClick={() => toggleBlock(block.id)}
                  className={`flex items-center justify-between rounded-xl border-2 p-3.5 transition-all cursor-pointer hard-border ${
                    isChecked
                      ? 'border-violet-500 bg-violet-950/30 shadow-[3px_3px_0px_#7C5CFF]'
                      : 'border-white/10 bg-black/40 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 ${
                        isChecked ? 'border-violet-400 bg-violet-500 text-black' : 'border-white/30'
                      }`}
                    >
                      {isChecked && <Check className="h-4 w-4 stroke-[3]" />}
                    </div>

                    <div>
                      <h4 className="font-heading text-sm font-bold text-foreground">
                        {block.title}
                      </h4>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                        <span className="text-aurora-lime font-bold">📅 {block.date}</span>
                        <span>⏰ {block.start} - {block.end}</span>
                        <span>📍 {block.location}</span>
                      </div>
                    </div>
                  </div>

                  <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-violet-300">
                    60 phút
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer CTAs */}
        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">
            Đã chọn: <strong className="text-aurora-lime">{selectedBlockIds.size}</strong> khối học
          </span>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="border-white/20">
              Hủy
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedBlockIds.size === 0}
              className="bg-aurora-lime text-black font-extrabold shadow-[2px_2px_0px_#000] hover:brightness-110"
            >
              Chấp nhận và đưa vào Lịch ({selectedBlockIds.size})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
