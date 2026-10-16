'use client';

import { useState } from 'react';
import { Search, Menu, LogOut, Timer, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { NotificationCenter } from '@/components/shared/notification-center';
import { StudySessionModal } from '@/components/shared/study-session-modal';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [studyOpen, setStudyOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-[4.5rem] items-center gap-4 border-b border-border/70 bg-background/75 px-4 backdrop-blur-xl md:px-7">
      <button
        className="md:hidden -ml-2 p-2 text-foreground"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden sm:flex relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm môn học, tài liệu, nhiệm vụ..."
          className="h-10 rounded-xl border-border/70 bg-card/65 pl-9"
          aria-label="Search"
        />
      </div>
      <div className="flex flex-1 sm:hidden" />
      <div className="flex items-center gap-2">
        <Link href="/coach" className="hidden h-9 items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-500/5 px-3 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/10 lg:inline-flex"><Sparkles className="h-4 w-4" /> Trợ lý AI</Link>
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Mở bộ đếm tập trung" onClick={() => setStudyOpen(true)}><Timer className="h-5 w-5" /></Button>
        <NotificationCenter />
        <Link href="/profile">
          <Avatar
            fallback={user?.fullName?.charAt(0) || 'U'}
            alt={user?.fullName || 'User'}
            className="h-8 w-8 cursor-pointer"
          />
        </Link>
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
      <StudySessionModal open={studyOpen} onClose={() => setStudyOpen(false)} />
    </header>
  );
}
