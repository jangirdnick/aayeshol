'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from './sidebar/Sidebar';
import { useSidebarCollapse } from '../hooks/useSidebarCollapse';
import type { DashboardShellProps } from '../types/navigation.types';

export function DashboardShell({ children }: DashboardShellProps) {
  const { isCollapsed, toggleCollapse } = useSidebarCollapse();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Close mobile sidebar on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  // Prevent background scrolling when mobile sidebar is open
  React.useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  return (
    <div className="relative flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar (hidden on screens smaller than md) */}
      <div className="hidden md:flex h-screen sticky top-0 shrink-0 z-30">
        <Sidebar isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />
      </div>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-0 z-50 flex md:hidden"
        >
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over Drawer Panel */}
          <div className="relative z-50 flex h-full w-72 max-w-[85vw] flex-col bg-sidebar shadow-2xl animate-in slide-in-from-left duration-250">
            <Sidebar
              isCollapsed={false}
              onToggleCollapse={() => setIsMobileOpen(false)}
              onNavigate={() => setIsMobileOpen(false)}
              className="w-full border-r-0"
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
        {/* Mobile Header Bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-1 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation menu"
              className="text-foreground"
            >
              <Menu className="size-5" />
            </Button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="relative size-7 shrink-0 overflow-hidden rounded-md ring-1 ring-border/80">
                <Image
                  src="/aayeshol-logo.png"
                  alt="Aayeshol Logo"
                  width={28}
                  height={28}
                  className="size-full object-cover"
                />
              </div>
              <span className="font-heading font-bold text-sm tracking-tight">Aayeshol</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 focus:outline-none" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
