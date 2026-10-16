'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Sparkles, Calendar, Clock, MapPin, Tag } from 'lucide-react';
import { type CalendarEvent, type EventType } from '@/lib/campus-store';
import { parseVietnameseEventInput } from '@/lib/nlp-calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EVENT_META } from './smart-filters';

interface NlpQuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  onCreateEvent: (event: CalendarEvent) => void;
}

export function NlpQuickCreateModal({
  isOpen,
  onClose,
  defaultDate,
  onCreateEvent,
}: NlpQuickCreateModalProps) {
  const [naturalText, setNaturalText] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('study');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]!);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:30');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // Update date when defaultDate prop changes
  useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate);
    }
  }, [defaultDate]);

  // Real-time NLP parsing as the user types
  const parsedPreview = useMemo(() => {
    if (!naturalText.trim()) return null;
    return parseVietnameseEventInput(naturalText.trim(), new Date());
  }, [naturalText]);

  // When NLP recognizes high confidence, sync to form
  const handleApplyNlp = () => {
    if (!parsedPreview) return;
    setTitle(parsedPreview.title);
    setType(parsedPreview.type);
    setDate(parsedPreview.date);
    setStart(parsedPreview.start);
    setEnd(parsedPreview.end);
    if (parsedPreview.location) setLocation(parsedPreview.location);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = (title.trim() || parsedPreview?.title || naturalText.trim());
    if (!finalTitle) return;

    const newEvent: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title: finalTitle,
      type: type || parsedPreview?.type || 'study',
      date: date || parsedPreview?.date || defaultDate || new Date().toISOString().split('T')[0]!,
      start: start || parsedPreview?.start || '09:00',
      end: end || parsedPreview?.end || '10:30',
      location: (location.trim() || parsedPreview?.location || '').trim(),
      description: description.trim(),
      done: false,
    };

    onCreateEvent(newEvent);
    // Reset
    setNaturalText('');
    setTitle('');
    setLocation('');
    setDescription('');
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
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nlp-create-title"
        className="relative w-full max-w-lg rounded-[26px] border-2 border-white/20 bg-[#121222] p-6 shadow-[8px_8px_0px_#000] hard-border space-y-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-aurora-lime/40 bg-aurora-lime/15 px-2.5 py-0.5 text-[11px] font-bold text-aurora-lime">
              <Sparkles className="h-3 w-3" />
              <span>NLP QUICK-CREATE</span>
            </div>
            <h3 id="nlp-create-title" className="font-heading text-xl font-bold text-foreground mt-1">
              Thêm Sự Kiện / Lịch Mới
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* NLP Natural Language Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold text-muted-foreground">
            Nhập câu tự nhiên (AI tự phân tích):
          </label>
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={naturalText}
              onChange={(e) => setNaturalText(e.target.value)}
              placeholder="VD: ôn xác suất 19h thứ 6 tại thư viện..."
              className="w-full rounded-xl border-2 border-white/20 bg-black/50 px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-aurora-lime focus:outline-none"
            />
          </div>

          {/* Live NLP Parse Preview Chip */}
          {parsedPreview && (
            <div className="flex items-center justify-between rounded-xl border border-aurora-lime/50 bg-aurora-lime/10 p-2.5 text-xs text-aurora-lime animate-fade-in">
              <div className="space-y-0.5">
                <p className="font-bold">✨ Nhận diện: &quot;{parsedPreview.title}&quot;</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  Loại: {parsedPreview.type} · {parsedPreview.date} · {parsedPreview.start}-{parsedPreview.end}
                  {parsedPreview.location ? ` · ${parsedPreview.location}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={handleApplyNlp}
                className="rounded-lg bg-aurora-lime px-2 py-1 font-mono text-[11px] font-bold text-black hover:brightness-110"
              >
                Áp dụng
              </button>
            </div>
          )}
        </div>

        {/* Manual Adjustments / Direct Fields */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div>
            <label className="text-[11px] font-mono text-muted-foreground">Tiêu đề sự kiện:</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={parsedPreview?.title || 'Tên sự kiện / buổi học'}
              className="mt-1 h-9 rounded-xl border-white/20 bg-black/40 text-xs text-foreground"
            />
          </div>

          {/* Type Selector */}
          <div>
            <label className="text-[11px] font-mono text-muted-foreground">Loại:</label>
            <div className="grid grid-cols-5 gap-1.5 mt-1">
              {(Object.keys(EVENT_META) as EventType[]).map((t) => {
                const meta = EVENT_META[t];
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`rounded-lg border p-1.5 text-center text-[10px] font-bold transition-all ${
                      active ? `${meta.bg} ${meta.border} border-2` : 'border-white/10 text-muted-foreground'
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-mono text-muted-foreground">Ngày:</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 h-9 rounded-xl border-white/20 bg-black/40 text-xs text-foreground font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-muted-foreground">Bắt đầu:</label>
              <Input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1 h-9 rounded-xl border-white/20 bg-black/40 text-xs text-foreground font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-muted-foreground">Kết thúc:</label>
              <Input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-1 h-9 rounded-xl border-white/20 bg-black/40 text-xs text-foreground font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono text-muted-foreground">Địa điểm:</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Phòng học, hội trường hoặc link Meet..."
              className="mt-1 h-9 rounded-xl border-white/20 bg-black/40 text-xs text-foreground"
            />
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
          <Button variant="outline" type="button" onClick={onClose} className="border-white/20">
            Hủy
          </Button>
          <Button type="submit" className="bg-aurora-lime text-black font-extrabold shadow-[2px_2px_0px_#000]">
            Lưu sự kiện
          </Button>
        </div>
      </form>
    </div>
  );
}
