'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Sparkles,
  User,
  type LucideIcon,
} from 'lucide-react';

const items: { label: string; href: string; icon: string }[] = [
  { label: 'Hôm nay', href: '/dashboard', icon: 'layout-dashboard' },
  { label: 'Học tập', href: '/study', icon: 'book-open' },
  { label: 'Coach', href: '/coach', icon: 'sparkles' },
  { label: 'Nhóm', href: '/clubs', icon: 'users' },
  { label: 'Cá nhân', href: '/profile', icon: 'user' },
];

const iconMap: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  'book-open': BookOpen,
  users: Users,
  sparkles: Sparkles,
  user: User,
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-3 left-3 right-3 z-40 flex h-16 items-center justify-around rounded-2xl border border-border/80 bg-card/95 px-1 shadow-2xl backdrop-blur-xl md:hidden"
      aria-label="Mobile navigation"
    >
      {items.map((item) => {
        const Icon = iconMap[item.icon];
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {Icon && <Icon className="h-5 w-5" />}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
