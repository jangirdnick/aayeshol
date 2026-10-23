'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { EllipsisVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/modular/account';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { SidebarUserProfileProps } from '../../types/navigation.types';

// Lazy-load profile dropdown menu content to optimize initial dashboard bundle
const DynamicProfileMenu = dynamic(() => import('./SidebarProfileMenu'), {
  ssr: false,
});

export function SidebarUserProfile({ isCollapsed, onNavigate }: SidebarUserProfileProps) {
  const { user, logout } = useAuth();

  const displayName = React.useMemo(() => {
    if (!user) return 'Anton Avilov';
    const fullName = `${user.name || ''} ${user.lastName || ''}`.trim();
    return fullName || user.email?.split('@')[0] || 'Anton Avilov';
  }, [user]);

  const displayRole = React.useMemo(() => {
    if (!user?.role) return 'Admin account';
    return `${user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()} account`;
  }, [user?.role]);

  const initials = React.useMemo(() => {
    if (!user?.name) return 'AA';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  }, [user?.name]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      window.location.href = '/account/login';
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-sidebar-border/80 bg-sidebar-accent/50 p-2.5 transition-all',
        isCollapsed ? 'flex justify-center p-2' : 'flex items-center justify-between gap-3',
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="size-9 shrink-0 rounded-lg ring-1 ring-sidebar-border">
          {user?.avatar ? <AvatarImage src={user.avatar} alt={displayName} /> : null}
          <AvatarFallback className="rounded-lg bg-neutral-800 font-semibold text-white text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>

        {!isCollapsed && (
          <div className="flex flex-col min-w-0 text-left">
            <span className="truncate text-xs font-semibold leading-normal text-sidebar-foreground">
              {displayName}
            </span>
            <span className="truncate text-[11px] text-muted-foreground leading-normal">
              {displayRole}
            </span>
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="User account actions"
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring outline-none transition-colors cursor-pointer',
                isCollapsed && 'hidden',
              )}
            />
          }
        >
          <EllipsisVertical className="size-4" />
        </DropdownMenuTrigger>
        <DynamicProfileMenu
          displayName={displayName}
          email={user?.email || 'admin@aayeshol.com'}
          onNavigate={onNavigate}
          onLogout={handleLogout}
        />
      </DropdownMenu>
    </div>
  );
}
