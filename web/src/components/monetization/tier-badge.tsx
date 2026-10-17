'use client';

import React from 'react';
import { Shield, Zap, FlaskConical, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type LabTier, getTierConfig } from '@/lib/monetization-matrix';

export interface TierBadgeProps {
  tier?: LabTier;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TierBadge({
  tier = 'free',
  size = 'sm',
  showIcon = true,
  showText = true,
  interactive = false,
  onClick,
  className,
}: TierBadgeProps) {
  const config = getTierConfig(tier);

  // Size specifications
  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1 rounded-md font-mono',
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 rounded-lg font-mono',
    md: 'text-xs px-2.5 py-1 gap-1.5 rounded-xl font-mono',
    lg: 'text-sm px-3.5 py-1.5 gap-2 rounded-xl font-mono',
  }[size];

  const iconSizes = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  }[size];

  // Cyber-Glass visual styling per tier
  const tierStyles = {
    free: {
      container:
        'border border-slate-700/60 bg-slate-900/60 text-slate-300 shadow-none hover:border-slate-600',
      icon: Shield,
      iconColor: 'text-slate-400',
      dot: 'bg-slate-500',
      tilt: 'rotate-0',
    },
    plus: {
      container:
        'border border-cyan-400/50 bg-cyan-950/60 text-cyan-300 shadow-[0_0_12px_rgba(61,232,255,0.25)] hover:border-cyan-300 hover:shadow-[0_0_16px_rgba(61,232,255,0.4)]',
      icon: Zap,
      iconColor: 'text-cyan-400 fill-cyan-400/20',
      dot: 'bg-cyan-400 animate-pulse',
      tilt: '-rotate-1',
    },
    pro: {
      container:
        'border border-violet-400/60 bg-gradient-to-r from-violet-950/70 to-purple-950/60 text-violet-200 shadow-[0_0_16px_rgba(124,92,255,0.35)] hover:border-violet-300 hover:shadow-[0_0_20px_rgba(124,92,255,0.5)]',
      icon: FlaskConical,
      iconColor: 'text-violet-300',
      dot: 'bg-violet-400',
      tilt: 'rotate-1',
    },
    ultra: {
      container:
        'border border-amber-400/80 bg-gradient-to-r from-amber-950/80 via-yellow-950/70 to-orange-950/80 text-amber-200 ring-1 ring-amber-400/40 shadow-[0_0_20px_rgba(255,186,8,0.45)] hover:shadow-[0_0_28px_rgba(255,186,8,0.65)] hover:border-amber-300',
      icon: Crown,
      iconColor: 'text-amber-300 fill-amber-300/30',
      dot: 'bg-amber-400 animate-ping',
      tilt: 'rotate-[1.5deg]',
    },
  }[tier] || {
    container: 'border border-slate-700/60 bg-slate-900/60 text-slate-300',
    icon: Shield,
    iconColor: 'text-slate-400',
    dot: 'bg-slate-500',
    tilt: 'rotate-0',
  };

  const IconComponent = tierStyles.icon;

  return (
    <span
      onClick={onClick}
      role={interactive || onClick ? 'button' : undefined}
      tabIndex={interactive || onClick ? 0 : undefined}
      className={cn(
        'inline-flex items-center font-bold tracking-wide transition-all select-none backdrop-blur-md',
        tierStyles.container,
        tierStyles.tilt,
        sizeClasses,
        (interactive || onClick) && 'cursor-pointer hover:scale-105 active:scale-95',
        className
      )}
      title={`Campus LAB: Gói ${config.badgeTitle}`}
    >
      {showIcon && <IconComponent className={cn(iconSizes, tierStyles.iconColor)} />}
      {showText && <span>{config.badgeTitle}</span>}
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', tierStyles.dot)} />
    </span>
  );
}
