'use client';

import React, { useState } from 'react';
import { Check, Eye, EyeOff, KeyRound, ShieldAlert, ShieldCheck, X } from 'lucide-react';

export interface PasswordStrengthResult {
  score: number; // 0..4
  label: string;
  color: string;
  barWidth: string;
  feedback: string[];
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      label: 'Chưa nhập',
      color: 'bg-slate-700',
      barWidth: '0%',
      feedback: ['Vui lòng nhập mật khẩu mới'],
    };
  }

  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Tối thiểu 8 ký tự');
  }

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Bao gồm chữ hoa và chữ thường');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Bao gồm ít nhất một chữ số (0-9)');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Bao gồm ít nhất một ký tự đặc biệt (!@#$...)');
  }

  if (score <= 1) {
    return {
      score: 1,
      label: 'Yếu',
      color: 'bg-rose-500',
      barWidth: '25%',
      feedback,
    };
  }

  if (score === 2) {
    return {
      score: 2,
      label: 'Trung bình',
      color: 'bg-amber-500',
      barWidth: '50%',
      feedback,
    };
  }

  if (score === 3) {
    return {
      score: 3,
      label: 'Khá mạnh',
      color: 'bg-cyan-500',
      barWidth: '75%',
      feedback,
    };
  }

  return {
    score: 4,
    label: 'Rất mạnh',
    color: 'bg-emerald-400',
    barWidth: '100%',
    feedback: ['Mật khẩu đạt độ bảo mật tối ưu'],
  };
}

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const strength = calculatePasswordStrength(newPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentPassword) {
      setErrorMsg('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('Mật khẩu mới phải có độ dài tối thiểu 8 ký tự.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMsg('Mật khẩu mới không được trùng với mật khẩu cũ.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onSuccess?.();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-slate-950 p-6 shadow-2xl space-y-4">
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
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/10 text-cyan-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">Đổi Mật Khẩu</h3>
            <p className="text-xs text-muted-foreground">
              Cập nhật mật khẩu để bảo vệ tài khoản của bạn
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 shadow-lg">
              <Check className="h-8 w-8" />
            </div>
            <h4 className="text-base font-bold text-white">Đổi mật khẩu thành công!</h4>
            <p className="text-xs text-slate-300">
              Mật khẩu mới đã được lưu vào hệ thống an toàn.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu đang dùng"
                  className="w-full h-10 rounded-xl border border-white/15 bg-slate-900/60 px-3 pr-10 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự, chữ hoa & số"
                  className="w-full h-10 rounded-xl border border-white/15 bg-slate-900/60 px-3 pr-10 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Độ mạnh mật khẩu:</span>
                    <span className="font-bold text-white">{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.barWidth }}
                    />
                  </div>
                  {strength.feedback.length > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      Gợi ý: {strength.feedback.join(' · ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full h-10 rounded-xl border border-white/15 bg-slate-900/60 px-3 pr-10 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 font-semibold">{errorMsg}</p>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
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
                Cập nhật mật khẩu
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
