'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DashboardPageHeader } from '@/modular/dashboard';
import type { FilterStatus } from '../types';

interface IntegrationsHeaderProps {
  totalPlatforms: number;
  connectedCount: number;
  filterStatus: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefreshAll?: () => void;
  isRefreshing?: boolean;
}

export function IntegrationsHeader({
  totalPlatforms,
  connectedCount,
  filterStatus,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onRefreshAll,
  isRefreshing = false,
}: IntegrationsHeaderProps) {
  return (
    <DashboardPageHeader
      title="Integrations"
      badge={
        <Badge
          variant="outline"
          className="gap-1.5 rounded-full border-border/80 bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-foreground shrink-0"
        >
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            {connectedCount} of {totalPlatforms} Connected
          </span>
        </Badge>
      }
      rightSlot={
        onRefreshAll && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="rounded-md h-8 text-xs font-medium border-border/70 gap-1.5 cursor-pointer"
          >
            <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
            <span>Sync Accounts</span>
          </Button>
        )
      }
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search platforms, channels, or capabilities..."
      onFilterClick={() => {
        // Toggle filter status cycle on filter icon click: ALL -> CONNECTED -> DISCONNECTED -> ALL
        if (filterStatus === 'ALL') onFilterChange('CONNECTED');
        else if (filterStatus === 'CONNECTED') onFilterChange('DISCONNECTED');
        else onFilterChange('ALL');
      }}
      isFilterActive={filterStatus !== 'ALL'}
      toolbarRight={
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant={filterStatus === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('ALL')}
            className={cn(
              'rounded-md h-8 px-3 text-xs font-medium cursor-pointer',
              filterStatus !== 'ALL' &&
                'border-border/70 text-muted-foreground hover:text-foreground',
            )}
          >
            All ({totalPlatforms})
          </Button>
          <Button
            type="button"
            variant={filterStatus === 'CONNECTED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('CONNECTED')}
            className={cn(
              'rounded-md h-8 px-3 text-xs font-medium cursor-pointer',
              filterStatus !== 'CONNECTED' &&
                'border-border/70 text-muted-foreground hover:text-foreground',
            )}
          >
            Connected ({connectedCount})
          </Button>
          <Button
            type="button"
            variant={filterStatus === 'DISCONNECTED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('DISCONNECTED')}
            className={cn(
              'rounded-md h-8 px-3 text-xs font-medium cursor-pointer',
              filterStatus !== 'DISCONNECTED' &&
                'border-border/70 text-muted-foreground hover:text-foreground',
            )}
          >
            Available ({totalPlatforms - connectedCount})
          </Button>
        </div>
      }
    />
  );
}
