'use client';

import * as React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DashboardPageHeaderProps {
  /** Page or route title on the left of top bar */
  title: string;
  /** Optional badge or counter next to title */
  badge?: React.ReactNode;
  /** Center slot for route-specific navigation, tabs, or buttons */
  centerSlot?: React.ReactNode;
  /** Right slot for route-specific action buttons or status */
  rightSlot?: React.ReactNode;

  /** Left slot of the toolbar (defaults to filter icon button) */
  toolbarLeft?: React.ReactNode;
  /** On click handler for the default filter button */
  onFilterClick?: () => void;
  /** Whether the filter is currently active */
  isFilterActive?: boolean;

  /** Search input value */
  searchValue?: string;
  /** Search input change handler */
  onSearchChange?: (value: string) => void;
  /** Custom placeholder for search input */
  searchPlaceholder?: string;

  /** Right slot of toolbar for functional action buttons or tabs */
  toolbarRight?: React.ReactNode;
  className?: string;
}

export function DashboardPageHeader({
  title,
  badge,
  centerSlot,
  rightSlot,
  toolbarLeft,
  onFilterClick,
  isFilterActive = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  toolbarRight,
  className,
}: DashboardPageHeaderProps) {
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Focus search input on '/' keyboard shortcut when not typing in another input
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={cn('flex flex-col w-full border-b border-border/70 bg-background', className)}>
      {/* ─── Top Row: Title, Route Center Slot, Route Right Slot ─── */}
      <div className="flex h-14 md:h-15.5 items-center justify-between px-2.5 md:px-4 border-b border-border/60 gap-4">
        {/* Left: Heading + Optional Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="font-heading text-base md:text-lg font-bold tracking-tight text-foreground truncate">
            {title}
          </h1>
          {badge}
        </div>

        {/* Center: Route-specific content (tabs, nav links, etc.) */}
        <div className="hidden md:flex items-center justify-center flex-1 min-w-0">
          {centerSlot}
        </div>

        {/* Right: Route-specific action buttons / status */}
        <div className="flex items-center gap-2 shrink-0">{rightSlot}</div>
      </div>

      {/* ─── Bottom Row: Filter Icon, Search Input with '/', Action Buttons ─── */}
      <div className="flex items-center gap-3 px-2.5 py-4 md:px-4 md:py-6 flex-wrap sm:flex-nowrap">
        {/* Left Filter Button */}
        {toolbarLeft ? (
          toolbarLeft
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onFilterClick}
            aria-label="Filter"
            className={cn(
              'size-9 rounded-md border-border/70 bg-card/60 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer',
              isFilterActive && 'border-primary/50 text-foreground bg-accent/40',
            )}
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        )}

        {/* Search Bar with Shortcut Indicator */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 pr-8 h-9 text-xs rounded-md border-border/70 bg-card/50 placeholder:text-muted-foreground/70 w-full focus-visible:ring-1"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center justify-center h-5 min-w-5 px-1 rounded border border-border/70 bg-muted/40 font-mono text-[10px] text-muted-foreground pointer-events-none select-none">
            /
          </kbd>
        </div>

        {/* Right Action Buttons */}
        {toolbarRight && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            {toolbarRight}
          </div>
        )}
      </div>
    </div>
  );
}
