'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { formatBytes } from '@/lib/storage-engine';

export interface PdfPreviewItem {
  name: string;
  url: string;
  sizeBytes?: number;
}

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: PdfPreviewItem | null;
}

export function PdfPreviewModal({ isOpen, onClose, file }: PdfPreviewModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full flex flex-col rounded-3xl backdrop-blur-2xl bg-card/95 border border-cyan-400/30 shadow-[0_0_50px_rgba(61,232,255,0.15)] overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'h-[98vh] max-w-[98vw]' : 'h-[88vh] max-w-5xl'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-background/50">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-foreground truncate">{file.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                {file.sizeBytes ? <span>{formatBytes(file.sizeBytes)}</span> : null}
                <span className="w-1 h-1 rounded-full bg-cyan-400" />
                <span className="text-cyan-400">Cyber-Glass PDF Reader</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              title="Tải về máy"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5 text-xs font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Tải về</span>
            </button>

            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Mở tab mới"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all hidden sm:flex items-center justify-center"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              title="Đóng"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="relative flex-1 w-full bg-slate-950/60 p-2 sm:p-4 overflow-hidden">
          <iframe
            src={`${file.url}#toolbar=1&navpanes=0`}
            title={file.name}
            className="w-full h-full rounded-2xl border border-white/10 bg-slate-950 shadow-inner"
          />

          {/* Fallback overlay in case iframe cannot be displayed */}
          <noscript>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-card/90">
              <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
              <p className="text-sm text-foreground font-semibold mb-2">Trình duyệt không hỗ trợ xem trực tiếp</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Nhấn để tải file PDF về máy
              </button>
            </div>
          </noscript>
        </div>
      </div>
    </div>
  );
}
export default PdfPreviewModal;
