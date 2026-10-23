'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { SidebarThemeToggleProps } from '../../types/navigation.types';

export function SidebarThemeToggle({ isCollapsed }: SidebarThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted ? resolvedTheme === 'dark' : true;

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <div className="pt-2">
      {/* Bottom Divider below the last Nav Group */}
      <div className="mb-2.5 h-px bg-sidebar-border" role="separator" />

      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
                aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                className="flex size-10 mx-auto items-center justify-center rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring outline-none cursor-pointer"
              />
            }
          >
            {isDarkMode ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </TooltipTrigger>
          <TooltipContent side="right">
            {isDarkMode ? 'Dark Mode (Active)' : 'Light Mode (Active)'}
          </TooltipContent>
        </Tooltip>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-sidebar-border/60 bg-sidebar-accent/30 px-3.5 py-2.5 transition-colors">
          <div className="flex items-center gap-2.5">
            {isDarkMode ? (
              <Moon className="size-4 text-muted-foreground shrink-0" />
            ) : (
              <Sun className="size-4 text-muted-foreground shrink-0" />
            )}
            <span className="text-xs font-medium text-sidebar-foreground">Dark Mode</span>
          </div>

          {mounted ? (
            <Switch
              checked={isDarkMode}
              onCheckedChange={handleThemeChange}
              aria-label="Toggle dark mode"
            />
          ) : (
            <div className="h-5 w-9 rounded-full bg-muted animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
}
