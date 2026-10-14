'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModeToggleProps {
  className?: string;
}

export function ModeToggle({ className }: ModeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        className={cn('size-9 rounded-full text-muted-foreground', className)}
      >
        <span className="size-4" />
      </Button>
    );
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      className={cn(
        'size-9 rounded-full text-foreground hover:bg-neutral-200/80 dark:hover:bg-neutral-800 transition-colors cursor-pointer',
        className,
      )}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="size-4 transition-transform duration-200 rotate-0 scale-100" />
      ) : (
        <Moon className="size-4 transition-transform duration-200 rotate-0 scale-100" />
      )}
    </Button>
  );
}
