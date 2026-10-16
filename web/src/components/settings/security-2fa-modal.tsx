'use client';

import React, { useState } from 'react';
import {
  Check,
  Copy,
  KeyRound,
  Lock,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';

export const SIMULATED_2FA_SECRET = 'JBSWY3DPEHPK3PXP';

export const DEFAULT_BACKUP_CODES = [
  'A93B-4421',
  '7C92-E810',
  'B14F-9023',
  '4E81-A655',
  'D329-8711',
  '91CF-3304',
  '55B2-7109',
  '88A1-4920',
];

export function validateTotpCode(code: string): boolean {
  const clean = code.trim();
  // Valid TOTP is a 6-digit number
  return /^\d{6}$/.test(clean);
}

export function generateBackupCodes(): string[] {
  return [
    'A93B-4421',
    '7C92-E810',
    'B14F-9023',
    '4E81-A655',
    'D329-8711',
    '91CF-3304',
    '55B2-7109',
    '88A1-4920',
  ];
}

interface Security2faModalProps {
  isOpen: boolean;
  onClose: () => void;
  is2faEnabled: boolean;
  onToggle2fa: (enabled: boolean) => void;
}

export function Security2faModal({
  isOpen,
  onClose,
  is2faEnabled,
  onToggle2fa,
}: Security2faModalProps) {
  const [totpInput, setTotpInput] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  if (!isOpen) return null;

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(SIMULATED_2FA_SECRET);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(DEFAULT_BACKUP_CODES.join('\n'));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleVerifyAndEnable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTotpCode(totpInput)) {
      setErrorMsg('Mã xác thực TOTP phải bao gồm đúng 6 chữ số.');
      return;
    }

    setErrorMsg('');
    setShowBackupCodes(true);
  };

  const handleCompleteSetup = () => {
    onToggle2fa(true);
    setShowBackupCodes(false);
    setTotpInput('');
    onClose();
  };

  const handleDisable2fa = () => {
    onToggle2fa(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-slate-950 p-6 shadow-2xl space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-500/10 text-emerald-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Xác Thực Hai Bước (2FA - TOTP)
            </h3>
            <p className="text-xs text-muted-foreground">
              Bảo vệ tài khoản CampusOS với ứng dụng Google Authenticator hoặc Authy
            </p>
          </div>
        </div>

        {/* State 1: Currently Enabled -> Option to Disable */}
        {is2faEnabled && !showBackupCodes ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">2FA đang hoạt động an toàn</p>
                <p className="text-[11px] text-emerald-300">
                  Mỗi lần đăng nhập bạn sẽ được yêu cầu nhập mã 6 số từ thiết bị di động.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 border border-white/10 hover:bg-white/10"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleDisable2fa}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-300 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20"
              >
                Tắt xác thực 2 bước
              </button>
            </div>
          </div>
        ) : showBackupCodes ? (
          /* State 2: Show Backup Recovery Codes After Activation */
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3.5 flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200">
                Hãy lưu lại 8 mã dự phòng này ở nơi an toàn. Mỗi mã có thể dùng một lần nếu bạn mất điện thoại.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-slate-900/60 p-3 font-mono text-xs font-bold text-cyan-300 text-center">
              {DEFAULT_BACKUP_CODES.map((code) => (
                <div key={code} className="py-1 px-2 rounded bg-white/5 border border-white/5">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyBackupCodes}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200"
              >
                {copiedCodes ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copiedCodes ? 'Đã sao chép tất cả' : 'Sao chép mã dự phòng'}
              </button>

              <button
                type="button"
                onClick={handleCompleteSetup}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md"
              >
                Tôi đã lưu mã & Hoàn tất
              </button>
            </div>
          </div>
        ) : (
          /* State 3: Setup Form with QR Code & Secret */
          <form onSubmit={handleVerifyAndEnable} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-white/10 bg-slate-900/40 p-4">
              {/* QR Code Graphic */}
              <div className="p-2 rounded-xl bg-white shadow-lg shrink-0">
                <QrCode className="h-24 w-24 text-slate-950" />
              </div>

              <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
                <span className="block text-[11px] font-bold text-slate-300">
                  Bước 1: Quét mã QR hoặc nhập khóa bí mật
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Mở ứng dụng Google Authenticator / Microsoft Authenticator trên điện thoại và quét mã QR này.
                </p>

                <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-lg p-1.5 px-2.5 font-mono text-xs text-cyan-300 justify-between">
                  <span className="truncate">{SIMULATED_2FA_SECRET}</span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Sao chép khóa bí mật"
                  >
                    {copiedSecret ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* TOTP 6-Digit Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200">
                Bước 2: Nhập mã 6 chữ số từ ứng dụng
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={totpInput}
                  onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ví dụ: 123456"
                  className="w-full h-11 rounded-xl border border-white/15 bg-slate-900/60 px-4 text-center font-mono text-lg font-black tracking-widest text-cyan-300 focus:outline-none focus:border-cyan-400 shadow-inner"
                  autoFocus
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-400 font-semibold">{errorMsg}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 border border-white/15 hover:bg-white/10"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md"
              >
                Kích hoạt 2FA
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
