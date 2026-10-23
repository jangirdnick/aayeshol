'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarHeader } from './SidebarHeader';
import { SidebarUserProfile } from './SidebarUserProfile';
import { SidebarNav } from './SidebarNav';
import { SidebarThemeToggle } from './SidebarThemeToggle';
import type { SidebarProps } from '../../types/navigation.types';

export function Sidebar({ isCollapsed, onToggleCollapse, onNavigate, className }: SidebarProps) {
  return (
    <TooltipProvider>
      <aside
        data-collapsed={isCollapsed}
        className={cn(
          'relative flex h-full flex-col justify-between border-r border-sidebar-border text-sidebar-foreground transition-all duration-300 ease-in-out select-none',
          isCollapsed ? 'w-20 px-2.5 py-6' : 'w-64 px-4 py-6',
          className,
        )}
      >
        {/* Top Area: Logo, Profile, Navigation */}
        <div className="flex flex-col gap-4">
          <SidebarHeader
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            onNavigate={onNavigate}
          />
          <SidebarUserProfile isCollapsed={isCollapsed} onNavigate={onNavigate} />
          <SidebarNav isCollapsed={isCollapsed} onNavigate={onNavigate} />
        </div>

        {/* Bottom Area: Theme Mode Switch Toggle */}
        <SidebarThemeToggle isCollapsed={isCollapsed} />
      </aside>
    </TooltipProvider>
  );
}
