'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import {
  calculatePasswordStrength,
  type PasswordStrengthResult,
  PASSWORD_STRENGTH_CONFIG,
} from '@/lib/auth-validation';

export interface PasswordStrengthMeterProps {
  password: string;
  showCriteria?: boolean;
  className?: string;
}

interface CriteriaItem {
  key: string;
  label: string;
  valid: boolean;
}

export function PasswordStrengthMeter({
  password = '',
  showCriteria = true,
  className = '',
}: PasswordStrengthMeterProps) {
  const strength: PasswordStrengthResult = calculatePasswordStrength(password);
  const hasInput = Boolean(password && password.length > 0);

  // 4-tier segment mapping: 0 if no input, 1 for weak, 2 for medium, 3 for good, 4 for strong
  const activeSegments = !hasInput
    ? 0
    : strength.tier === 'weak'
    ? 1
    : strength.tier === 'medium'
    ? 2
    : strength.tier === 'good'
    ? 3
    : 4;

  const criteriaList: CriteriaItem[] = [
    {
      key: 'minLength',
      label: 'Tối thiểu 8 ký tự',
      valid: strength.criteria.minLength,
    },
    {
      key: 'hasUppercase',
      label: 'Chữ hoa (A-Z)',
      valid: strength.criteria.hasUppercase,
    },
    {
      key: 'hasNumber',
      label: 'Chữ số (0-9)',
      valid: strength.criteria.hasNumber,
    },
    {
      key: 'hasSpecial',
      label: 'Ký tự đặc biệt (!@#$)',
      valid: strength.criteria.hasSpecial,
    },
  ];

  return (
    <div className={`space-y-2.5 w-full ${className}`}>
      {/* Header: Label and Percent */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Độ mạnh mật khẩu</span>
        <div className="flex items-center gap-1.5 font-bold">
          <span
            style={{ color: hasInput ? strength.color : '#94A3B8' }}
            className="transition-colors duration-200"
          >
            {hasInput ? strength.label : 'Chưa nhập'}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            ({hasInput ? strength.percent : 0}%)
          </span>
        </div>
      </div>

      {/* 4-tier Segmented Progress Bar with Dynamic Glow */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[0, 1, 2, 3].map((index) => {
          const isActive = index < activeSegments;
          return (
            <div
              key={index}
              className="h-full rounded-full transition-all duration-300 relative overflow-hidden"
              style={{
                backgroundColor: isActive ? strength.color : 'rgba(255, 255, 255, 0.08)',
                boxShadow: isActive
                  ? `0 0 10px ${strength.color}99, 0 0 4px ${strength.color}`
                  : 'none',
              }}
            />
          );
        })}
      </div>

      {/* 4 Criteria Badges with Live Check/Cross Icons */}
      {showCriteria && (
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {criteriaList.map((item) => (
            <div
              key={item.key}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] transition-all duration-200 border ${
                item.valid
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                  : 'border-white/5 bg-slate-900/40 text-slate-500'
              }`}
            >
              {item.valid ? (
                <Check className="h-3 w-3 shrink-0 text-emerald-400" />
              ) : (
                <X className="h-3 w-3 shrink-0 text-slate-500" />
              )}
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PasswordStrengthMeter;
