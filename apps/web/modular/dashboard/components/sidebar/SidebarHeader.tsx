'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { SidebarHeaderProps } from '../../types/navigation.types';

export function SidebarHeader({ isCollapsed, onToggleCollapse, onNavigate }: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center',
        isCollapsed ? 'flex-col gap-3 justify-center' : 'justify-between px-1',
      )}
    >
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-3 outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-sidebar-ring group"
      >
        <div className="relative size-8 shrink-0 overflow-hidden rounded-lg shadow-sm ring-1 ring-border/80">
          <Image
            src="/aayeshol-logo.png"
            alt="Aayeshol Logo"
            width={32}
            height={32}
            className="size-full object-cover"
            priority
          />
        </div>

        {!isCollapsed && (
          <span className="font-heading font-bold text-lg tracking-tight text-sidebar-foreground group-hover:opacity-90 transition-opacity">
            Aayeshol
          </span>
        )}
      </Link>

      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="flex size-7 shrink-0 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-muted-foreground shadow-2xs hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all focus-visible:ring-2 focus-visible:ring-sidebar-ring outline-none cursor-pointer"
            />
          }
        >
          {isCollapsed ? (
            <ChevronRight className="size-3.5" />
          ) : (
            <ChevronLeft className="size-3.5" />
          )}
        </TooltipTrigger>
        <TooltipContent side="right">
          {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
