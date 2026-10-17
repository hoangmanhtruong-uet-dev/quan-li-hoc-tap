'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  verifyRoomPin,
  type StudyRoomRow,
} from '@/lib/study-rooms-service';
import {
  Lock,
  X,
  ShieldCheck,
  AlertCircle,
  Loader2,
  KeyRound,
  ArrowRight,
} from 'lucide-react';

export interface PinEntryModalProps {
  isOpen: boolean;
  room: StudyRoomRow | null;
  onClose: () => void;
  onSuccess: (room: StudyRoomRow, enteredPin: string) => void;
}

export function PinEntryModal({
  isOpen,
  room,
  onClose,
  onSuccess,
}: PinEntryModalProps) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset and focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      setIsVerifying(false);
      setShake(false);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, room]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isVerifying) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isVerifying]);

  if (!isOpen || !room) return null;

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isVerifying) return;

    const cleanPin = pin.trim();
    if (cleanPin.length !== 6) {
      setErrorMsg('Vui lòng nhập đủ 6 chữ số mã PIN');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    try {
      const isValid = await verifyRoomPin(room, cleanPin);
      if (isValid) {
        onSuccess(room, cleanPin);
        onClose();
      } else {
        setErrorMsg('Mã PIN không chính xác. Vui lòng kiểm tra lại!');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPin('');
        inputRef.current?.focus();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi khi xác thực mã PIN');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(val);
    if (errorMsg) setErrorMsg('');
    // Auto-verify once 6 digits are typed
    if (val.length === 6) {
      setTimeout(() => {
        // Trigger verification
        verifyRoomPin(room, val).then((isValid) => {
          if (isValid) {
            onSuccess(room, val);
            onClose();
          } else {
            setErrorMsg('Mã PIN không chính xác. Vui lòng kiểm tra lại!');
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setPin('');
            inputRef.current?.focus();
          }
        });
      }, 150);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={() => {
          if (!isVerifying) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-modal-title"
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-400/30 bg-slate-900/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-amber-950/40 text-left transition-all z-10 ${
          shake ? 'animate-panic-shake border-rose-500' : ''
        }`}
      >
        {/* Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-purple-500/15 blur-3xl" />

        {/* Header */}
        <div className="relative flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-lg shadow-amber-500/20">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 id="pin-modal-title" className="text-base font-black text-white tracking-tight">
                Phòng Học Riêng Tư
              </h3>
              <p className="text-xs text-slate-400">
                Mã phòng: <span className="font-mono font-bold text-amber-300">{room.code}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isVerifying}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Room Info Snippet */}
        <div className="relative mt-4 rounded-2xl border border-white/10 bg-white/5 p-3.5">
          <div className="text-xs font-bold text-white line-clamp-1">{room.title}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
            <span>{room.subject}</span>
            <span>•</span>
            <span>{room.focus_duration_minutes} phút focus</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="relative mt-5 space-y-4">
          <div>
            <label htmlFor="pin-code-input" className="block text-xs font-bold text-amber-200 mb-2 text-center">
              Nhập mã PIN 6 chữ số để mở khóa
            </label>
            <div className="relative">
              <input
                id="pin-code-input"
                ref={inputRef}
                type="text"
                maxLength={6}
                value={pin}
                onChange={handleChange}
                disabled={isVerifying}
                placeholder="••••••"
                className="w-full h-14 rounded-2xl border border-amber-400/40 bg-black/60 px-4 text-center font-mono text-2xl font-black tracking-[0.5em] text-amber-300 placeholder-amber-500/30 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-400/20 shadow-inner disabled:opacity-50"
                autoComplete="off"
              />
            </div>

            {/* Error Message */}
            {errorMsg ? (
              <div className="flex items-center justify-center gap-1.5 mt-2.5 text-xs text-rose-400 font-bold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Hỏi chủ phòng mã PIN nếu bạn chưa có
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isVerifying}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isVerifying || pin.length !== 6}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-orange-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:hover:scale-100"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang mở khóa...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  <span>Vào phòng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
