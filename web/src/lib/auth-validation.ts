/**
 * CampusOS Authentication Validation & Security Engine
 * Pure TypeScript utilities for password evaluation, student domain validation,
 * anti-spam cooldown state, and canonical demo student credentials.
 */

export type PasswordStrengthTier = 'weak' | 'medium' | 'good' | 'strong';

export interface PasswordCriteria {
  minLength: boolean;    // >= 8 chars
  hasUppercase: boolean; // [A-Z]
  hasLowercase: boolean; // [a-z]
  hasNumber: boolean;    // [0-9]
  hasSpecial: boolean;   // [!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]
}

export interface PasswordStrengthResult {
  score: number;         // 0 to 5
  percent: number;       // 0, 25, 50, 75, 100
  tier: PasswordStrengthTier;
  label: string;         // 'Yếu' | 'Trung bình' | 'Tốt' | 'Cực mạnh'
  color: string;         // Hex code
  criteria: PasswordCriteria;
}

export interface CooldownState {
  remainingSeconds: number; // 0 to cooldownDuration
  canResend: boolean;       // true if remainingSeconds === 0
  formattedLabel: string;   // e.g. "Gửi lại mã sau (45s)" or "Gửi lại mã"
}

export const DEMO_STUDENT_CREDENTIALS = {
  email: 'minh.nguyen@campus.edu.vn',
  password: 'Demo@123456',
  fullName: 'Nguyễn Nhật Minh',
} as const;

export const PASSWORD_STRENGTH_CONFIG = {
  weak: { label: 'Yếu', color: '#EF4444', percent: 25 },
  medium: { label: 'Trung bình', color: '#F59E0B', percent: 50 },
  good: { label: 'Tốt', color: '#06B6D4', percent: 75 },
  strong: { label: 'Cực mạnh', color: '#22C55E', percent: 100 },
} as const;

/**
 * Strict regex validating Vietnamese higher-education student emails (.edu.vn).
 * Rejects commercial domains (e.g. gmail.com) and spoofing attempts (e.g. user@evil-edu.vn, user@edu.vn.evil.com).
 */
export const EDU_VN_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.edu\.vn$/i;

/**
 * Evaluates password strength against 5 criteria and classifies into 4 real-time tiers.
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    return {
      score: 0,
      percent: 0,
      tier: 'weak',
      label: 'Yếu',
      color: '#EF4444',
      criteria: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false,
      },
    };
  }

  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  // Matches standard ASCII special characters as well as unicode symbols/punctuation
  const hasSpecial =
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password) ||
    /[^\p{L}\p{N}\s]/u.test(password);

  let score = 0;
  if (minLength) score++;
  if (hasUppercase) score++;
  if (hasLowercase) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  const criteria: PasswordCriteria = {
    minLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
  };

  // Tier classification logic
  // Short passwords (< 6 chars) are always weak even if diverse
  if (password.length < 6 || score <= 1) {
    return {
      score,
      percent: score === 0 ? 0 : 25,
      tier: 'weak',
      label: 'Yếu',
      color: '#EF4444',
      criteria,
    };
  }

  // Medium tier: score 2 or length < 8 with multiple criteria
  if (score === 2 || !minLength) {
    return {
      score,
      percent: 50,
      tier: 'medium',
      label: 'Trung bình',
      color: '#F59E0B',
      criteria,
    };
  }

  // Good tier: length >= 8 and meets 3 or 4 criteria
  if (score < 5) {
    return {
      score,
      percent: 75,
      tier: 'good',
      label: 'Tốt',
      color: '#06B6D4',
      criteria,
    };
  }

  // Strong tier: all 5 criteria satisfied (length >= 8, upper, lower, number, special)
  return {
    score: 5,
    percent: 100,
    tier: 'strong',
    label: 'Cực mạnh',
    color: '#22C55E',
    criteria,
  };
}

/**
 * Validates whether an email string belongs to an authorized Vietnamese .edu.vn student domain.
 */
export function isValidEduVnEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) {
    return false;
  }

  // Reject consecutive dots or multiple '@' signs
  if (trimmed.includes('..') || trimmed.indexOf('@') !== trimmed.lastIndexOf('@')) {
    return false;
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [local, domain] = parts;
  if (!local || !domain || domain.startsWith('.') || domain.endsWith('.')) {
    return false;
  }

  return EDU_VN_EMAIL_REGEX.test(trimmed);
}

/**
 * Calculates remaining anti-spam cooldown state based on timestamp differences.
 * Prevents timer flakiness and provides clock-skew protection.
 */
export function calculateCooldownState(
  lastSentTimestamp?: number | null,
  cooldownDurationSeconds: number = 60,
  currentTimestamp: number = Date.now()
): CooldownState {
  if (!lastSentTimestamp || typeof lastSentTimestamp !== 'number' || lastSentTimestamp <= 0) {
    return {
      remainingSeconds: 0,
      canResend: true,
      formattedLabel: 'Gửi lại mã',
    };
  }

  // Protect against clock adjustments (skew)
  let elapsedMs = currentTimestamp - lastSentTimestamp;
  if (elapsedMs < 0) {
    elapsedMs = 0;
  }

  const cooldownMs = cooldownDurationSeconds * 1000;
  if (elapsedMs >= cooldownMs) {
    return {
      remainingSeconds: 0,
      canResend: true,
      formattedLabel: 'Gửi lại mã',
    };
  }

  const remainingSeconds = Math.max(
    0,
    Math.min(cooldownDurationSeconds, Math.ceil((cooldownMs - elapsedMs) / 1000))
  );
  const canResend = remainingSeconds === 0;

  return {
    remainingSeconds,
    canResend,
    formattedLabel: canResend ? 'Gửi lại mã' : `Gửi lại mã sau (${remainingSeconds}s)`,
  };
}
