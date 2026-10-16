'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background/40 overflow-x-hidden">
      <Sidebar />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex flex-1 flex-col md:ml-0 min-w-0 overflow-x-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 w-full min-w-0 px-4 py-6 pb-24 md:px-6 md:py-8 lg:px-8 lg:py-8 overflow-x-hidden">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
