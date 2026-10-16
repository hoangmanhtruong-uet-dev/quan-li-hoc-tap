'use client';

import React, { useRef, useState } from 'react';
import { X, Download, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { type CalendarEvent, useCampusStore } from '@/lib/campus-store';
import { exportToIcs, parseIcs } from '@/lib/ics-calendar';
import { Button } from '@/components/ui/button';

interface IcsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportEvents: (events: CalendarEvent[]) => void;
}

export function IcsDialog({ isOpen, onClose, onImportEvents }: IcsDialogProps) {
  const { state } = useCampusStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Export handler
  const handleExport = () => {
    const icsContent = exportToIcs(state.events);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `campusos-schedule-${new Date().toISOString().split('T')[0]}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        try {
          const parsed = parseIcs(text);
          if (parsed.length > 0) {
            const mappedEvents: CalendarEvent[] = parsed.map((p: any, idx: number) => ({
              id: p.id || `imported-${Date.now()}-${idx}`,
              title: p.title || 'Sự kiện nhập',
              date: p.date,
              start: p.start || '09:00',
              end: p.end || '10:00',
              type: p.type || 'study',
              location: p.location || '',
              description: p.description || '',
              done: false,
            }));
            onImportEvents(mappedEvents);
            setImportStatus(`Đã nhập thành công ${mappedEvents.length} sự kiện!`);
            setTimeout(() => {
              setImportStatus(null);
              onClose();
            }, 1500);
          } else {
            setImportStatus('Không tìm thấy sự kiện hợp lệ trong file .ics');
          }
        } catch {
          setImportStatus('Lỗi khi đọc file .ics!');
        }
      }
    };
    reader.readAsText(file);
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
        aria-labelledby="ics-dialog-title"
        className="w-full max-w-md rounded-[26px] border-2 border-white/20 bg-[#121222] p-6 shadow-[8px_8px_0px_#000] hard-border space-y-5"
      >
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div>
            <h3 id="ics-dialog-title" className="font-heading text-xl font-bold text-foreground">
              Đồng bộ Lịch iCalendar (.ics)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Xuất hoặc nhập thời khóa biểu với Google Calendar, Apple Calendar, Outlook.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {importStatus && (
          <div className="rounded-xl border border-aurora-lime/50 bg-aurora-lime/15 p-3 text-xs font-bold text-aurora-lime flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Export CTA */}
          <button
            type="button"
            onClick={handleExport}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-white/20 bg-[#16162a] p-5 text-center transition-all hover:border-aurora-lime hover:scale-[1.02] shadow-[3px_3px_0px_#000]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-aurora-lime/20 text-aurora-lime">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <p className="font-heading text-sm font-bold text-foreground">Xuất .ICS</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Tải file lịch ({state.events.length} sự kiện)
              </p>
            </div>
          </button>

          {/* Import CTA */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-white/20 bg-[#16162a] p-5 text-center transition-all hover:border-[#3DE8FF] hover:scale-[1.02] shadow-[3px_3px_0px_#000]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3DE8FF]/20 text-[#3DE8FF]">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="font-heading text-sm font-bold text-foreground">Nhập .ICS</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Chọn file .ics từ máy tính
              </p>
            </div>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".ics,text/calendar"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex justify-end border-t border-white/10 pt-3">
          <Button variant="outline" onClick={onClose} className="border-white/20">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
