'use client';

import Link from 'next/link';
import { User, ShieldCheck, FileText, LogOut, Radio } from 'lucide-react';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';

interface SidebarProfileMenuProps {
  displayName: string;
  email: string;
  onNavigate?: () => void;
  onLogout: () => void;
}

export function SidebarProfileMenu({
  displayName,
  email,
  onNavigate,
  onLogout,
}: SidebarProfileMenuProps) {
  return (
    <DropdownMenuContent align="end" side="right" className="w-56 rounded-lg">
      <DropdownMenuLabel>
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-xs">{displayName}</span>
          <span className="text-[11px] text-muted-foreground font-normal">{email}</span>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuLabel className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 font-semibold">
          Preferences
        </DropdownMenuLabel>
        <DropdownMenuItem className="rounded-md">
          <Link
            href="/dashboard/settings"
            onClick={onNavigate}
            className="flex w-full items-center gap-2"
          >
            <User className="size-4 mr-2" />
            <span>Profile settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-md">
          <Link
            href="/dashboard/integrations"
            onClick={onNavigate}
            className="flex w-full items-center gap-2"
          >
            <Radio className="size-4 mr-2" />
            <span>Social accounts</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuLabel className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 font-semibold">
          Legal &amp; Policy
        </DropdownMenuLabel>
        <DropdownMenuItem className="rounded-md">
          <Link
            href="/privacy-policy"
            onClick={onNavigate}
            className="flex w-full items-center gap-2"
          >
            <ShieldCheck className="size-4 mr-2" />
            <span>Privacy Policy</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-md">
          <Link
            href="/terms-of-service"
            onClick={onNavigate}
            className="flex w-full items-center gap-2"
          >
            <FileText className="size-4 mr-2" />
            <span>Terms of Service</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={onLogout}
        className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-md"
      >
        <LogOut className="size-4 mr-2" />
        <span>Log out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

export default SidebarProfileMenu;
