'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { NAV_GROUPS } from '../../constants/navigation.constants';
import type { SidebarNavProps } from '../../types/navigation.types';

export function SidebarNav({ isCollapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Sidebar Navigation" className="flex flex-col">
      {/* Top Divider above Dashboard */}
      <div className="mb-2.5 h-px bg-sidebar-border" role="separator" />

      {NAV_GROUPS.map((group, groupIndex) => (
        <React.Fragment key={group.id}>
          {groupIndex > 0 && groupIndex !== 2 && (
            <div className="my-2.5 h-px bg-sidebar-border" role="separator" />
          )}
          <div className="flex flex-col gap-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href ||
                    (item.href.includes('#') ? false : pathname?.startsWith(item.href));

              const navLinkContent = (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group relative flex items-center rounded-lg text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                    isCollapsed
                      ? 'size-10 justify-center mx-auto'
                      : 'h-10 px-3.5 gap-3 justify-between',
                    isActive
                      ? 'bg-neutral-800 text-white dark:bg-neutral-800 dark:text-neutral-50 border border-neutral-700/60 dark:border-white/10 shadow-xs font-semibold'
                      : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground border border-transparent',
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={cn(
                        'size-4.5 shrink-0 transition-colors',
                        isActive
                          ? 'text-white dark:text-neutral-50'
                          : 'text-muted-foreground group-hover:text-sidebar-foreground',
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      className={cn(
                        'flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-[11px] font-semibold',
                        isActive
                          ? 'bg-neutral-700 text-white'
                          : 'bg-sidebar-accent border border-sidebar-border text-sidebar-foreground',
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger render={navLinkContent} />
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                );
              }

              return navLinkContent;
            })}
          </div>
        </React.Fragment>
      ))}
    </nav>
  );
}
