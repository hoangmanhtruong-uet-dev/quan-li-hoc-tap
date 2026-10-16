'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { sidebarSections } from '@/config/nav';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  BookOpen,
  Layers,
  Book,
  BarChart3,
  Map,
  Zap,
  Users,
  Home,
  Bell,
  User,
  Settings,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  calendar: Calendar,
  'check-square': CheckSquare,
  'book-open': BookOpen,
  layers: Layers,
  book: Book,
  'bar-chart-3': BarChart3,
  map: Map,
  zap: Zap,
  users: Users,
  home: Home,
  bell: Bell,
  user: User,
  settings: Settings,
  sparkles: Sparkles,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[17rem] shrink-0 flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-xl md:flex">
      <div className="flex h-[4.5rem] items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-black text-white shadow-lg shadow-blue-500/20">
          C
        </div>
        <div><span className="block text-base font-bold tracking-tight text-sidebar-foreground">CampusOS</span><span className="block text-[10px] font-medium uppercase tracking-[.18em] text-sidebar-muted">Student companion</span></div>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-5" aria-label="Sidebar navigation">
          {sidebarSections.map((section) => (
            <div key={section.label}>
              <span className="mb-1 block px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
                {section.label}
              </span>
              <ul role="list" className="space-y-1">
                {section.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  const isActive =
                    item.segment === 'study'
                      ? pathname.startsWith('/study')
                      : item.segment === 'clubs'
                        ? pathname.startsWith('/clubs')
                        : item.segment === 'roadmaps'
                          ? pathname.startsWith('/roadmaps')
                          : item.segment === 'skills'
                            ? pathname.startsWith('/skills')
                            : item.segment === 'living'
                              ? pathname.startsWith('/living')
                              : pathname === item.href;

                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-primary/12 text-blue-400 ring-1 ring-primary/15'
                            : 'text-sidebar-foreground hover:bg-white/[.04] hover:text-white'
                        )}
                      >
                        {Icon && <Icon className={cn('h-[18px] w-[18px]', isActive && 'drop-shadow-[0_0_8px_rgba(59,130,246,.55)]')} />}
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
