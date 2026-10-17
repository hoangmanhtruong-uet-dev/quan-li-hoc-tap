'use client';

import { useState } from 'react';
import { Search, Menu, LogOut, Timer, Sparkles, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { NotificationCenter } from '@/components/shared/notification-center';
import { StudySessionModal } from '@/components/shared/study-session-modal';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { CloudSyncIndicator } from './cloud-sync-indicator';
import { TierBadge } from '@/components/monetization/tier-badge';
import { VietQrCheckoutModal } from '@/components/monetization/vietqr-checkout-modal';
import { useCampusStore } from '@/lib/campus-store';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { state } = useCampusStore();
  const [studyOpen, setStudyOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const tier = state.tier || 'free';
  const isVip = state.isLabVip || tier !== 'free';

  return (
    <header className="sticky top-0 z-30 flex h-[4.5rem] items-center gap-4 border-b border-border/70 bg-background/75 px-4 backdrop-blur-xl md:px-7">
      <button
        className="md:hidden -ml-2 p-2 text-foreground"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden sm:flex relative flex-1 max-w-md items-center">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Tìm môn học, tài liệu, nhiệm vụ..."
          className="h-10 rounded-xl border-border/70 bg-card/65 pl-9 pr-12 text-sm focus-visible:ring-1 focus-visible:ring-primary/40"
          aria-label="Search"
        />
        <kbd className="pointer-events-none absolute right-3 hidden h-5 select-none items-center gap-1 rounded border border-border/80 bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground md:inline-flex">
          ⌘K
        </kbd>
      </div>
      <div className="flex flex-1 sm:hidden" />
      <div className="flex items-center gap-2">
        <CloudSyncIndicator className="mr-1" />

        {/* Campus LAB VIP Upgrade CTA or Active Tier Link */}
        {!isVip ? (
          <Button
            size="sm"
            onClick={() => setCheckoutOpen(true)}
            className="hidden h-8 items-center gap-1.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-2.5 text-xs font-bold text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:from-amber-500/30 hover:to-orange-500/30 sm:inline-flex"
          >
            <Crown className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span>Nâng cấp VIP</span>
          </Button>
        ) : (
          <Link href="/lab" className="hidden sm:inline-flex">
            <TierBadge tier={tier} size="sm" interactive />
          </Link>
        )}

        <Link href="/coach" className="hidden h-9 items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-500/5 px-3 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/10 lg:inline-flex">
          <Sparkles className="h-4 w-4" /> Trợ lý AI
        </Link>
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Mở bộ đếm tập trung" onClick={() => setStudyOpen(true)}>
          <Timer className="h-5 w-5" />
        </Button>
        <NotificationCenter />

        {/* User Avatar with subtle Tier Glow Ring */}
        <div className="relative flex items-center">
          <Link href="/profile" title={user?.fullName || 'Tài khoản'}>
            <Avatar
              fallback={user?.fullName?.charAt(0) || 'U'}
              alt={user?.fullName || 'User'}
              className={`h-8 w-8 cursor-pointer ring-2 transition-all ${
                isVip
                  ? 'ring-amber-500/70 hover:ring-amber-400'
                  : 'ring-white/15 hover:ring-cyan-400/50'
              }`}
            />
          </Link>
        </div>

        <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <StudySessionModal open={studyOpen} onClose={() => setStudyOpen(false)} />

      <VietQrCheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        defaultTier="plus"
        userId={user?.email || 'STUDENT'}
      />
    </header>
  );
}
