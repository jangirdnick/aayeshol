'use client';

import * as React from 'react';
import {
  ExternalLink,
  CheckCircle2,
  MoreVertical,
  Unlink,
  RefreshCw,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { PlatformBrandIcon } from './PlatformBrandIcon';
import type { SocialPlatformConfig } from '../types';

interface PlatformCardProps {
  platform: SocialPlatformConfig;
  onConnect: (platform: SocialPlatformConfig) => void;
  onRequestDisconnect: (platform: SocialPlatformConfig) => void;
  isConnecting?: boolean;
}

export function PlatformCard({
  platform,
  onConnect,
  onRequestDisconnect,
  isConnecting = false,
}: PlatformCardProps) {
  const isConnected = Boolean(platform.account);

  const formattedConnectedDate = React.useMemo(() => {
    if (!platform.account?.connectedAt) return null;
    const date = new Date(platform.account.connectedAt);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }, [platform.account?.connectedAt]);

  const tokenExpiryInfo = React.useMemo(() => {
    if (!platform.account?.tokenExpiresAt) return null;
    const expiry = new Date(platform.account.tokenExpiresAt);
    if (Number.isNaN(expiry.getTime())) return null;

    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const isExpired = diffMs <= 0;
    const diffMinutes = Math.floor(Math.abs(diffMs) / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    let label: string;
    let isUrgent = false;

    if (isExpired) {
      label = 'Token expired';
      isUrgent = true;
    } else if (diffDays >= 1) {
      label = `Expires in ${diffDays}d (${expiry.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`;
      isUrgent = diffDays <= 3;
    } else if (diffHours >= 1) {
      label = `Expires in ${diffHours}h`;
      isUrgent = true;
    } else {
      label = `Expires in ${Math.max(1, diffMinutes)}m`;
      isUrgent = true;
    }

    const fullFormatted = expiry.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      isExpired,
      isUrgent,
      label,
      fullFormatted,
    };
  }, [platform.account?.tokenExpiresAt]);

  const initials = React.useMemo(() => {
    if (!platform.account?.name) return platform.name.slice(0, 2).toUpperCase();
    const parts = platform.account.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return platform.account.name.slice(0, 2).toUpperCase();
  }, [platform.account?.name, platform.name]);

  return (
    <Card
      className={cn(
        'group flex flex-col justify-between rounded-lg border border-border/70 bg-card p-5 transition-all hover:border-border/90 hover:shadow-xs',
        isConnected && 'border-border/90',
      )}
    >
      <div className="flex flex-col gap-4">
        {/* Header: Brand Icon, Name, Category & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <PlatformBrandIcon
              platform={platform.id}
              className="size-10 rounded-lg shadow-2xs shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <h3 className="font-heading text-sm font-semibold text-foreground truncate">
                {platform.name}
              </h3>
              <span className="text-xs text-muted-foreground truncate">{platform.category}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isConnected ? (
              <Badge
                variant="outline"
                className="gap-1.5 rounded-full py-0.5 px-2 text-[11px] font-medium border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
              >
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Connected
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="rounded-full text-[11px] font-medium text-muted-foreground border-border/70 bg-muted/20 py-0.5 px-2"
              >
                Available
              </Badge>
            )}

            {isConnected && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      aria-label={`${platform.name} options`}
                      className="flex size-7 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                    />
                  }
                >
                  <MoreVertical className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="bottom" className="w-48 rounded-lg">
                  {platform.account?.profileUrl && (
                    <DropdownMenuItem
                      onClick={() =>
                        window.open(
                          platform.account?.profileUrl || '#',
                          '_blank',
                          'noopener,noreferrer',
                        )
                      }
                      className="rounded-md"
                    >
                      <ExternalLink className="size-4 mr-2" />
                      <span>View public profile</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onConnect(platform)} className="rounded-md">
                    <RefreshCw className="size-4 mr-2" />
                    <span>Rotate / Renew token</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onRequestDisconnect(platform)}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-md"
                  >
                    <Unlink className="size-4 mr-2" />
                    <span>Disconnect</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Connected Profile Snippet */}
        {isConnected && platform.account && (
          <div className="flex flex-col gap-2 rounded-md border border-border/60 bg-muted/20 p-2.5 text-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="size-7 rounded-full shrink-0 ring-1 ring-border/80">
                  {platform.account.avatar && (
                    <AvatarImage
                      src={platform.account.avatar}
                      alt={platform.account.name || platform.name}
                    />
                  )}
                  <AvatarFallback className="rounded-full bg-neutral-800 text-[10px] text-white font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-foreground truncate text-xs">
                    {platform.account.name || 'Connected Channel'}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {platform.account.username
                      ? `@${platform.account.username.replace(/^@/, '')}`
                      : platform.account.email || 'Active'}
                  </span>
                </div>
              </div>

              {formattedConnectedDate && (
                <span className="text-[11px] text-muted-foreground shrink-0">
                  Linked {formattedConnectedDate}
                </span>
              )}
            </div>

            {/* Token Expiration & Rotation Notice */}
            {tokenExpiryInfo && (
              <div
                className={cn(
                  'flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[11px] border transition-colors',
                  tokenExpiryInfo.isExpired
                    ? 'border-destructive/30 bg-destructive/10 text-destructive'
                    : tokenExpiryInfo.isUrgent
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                      : 'border-border/50 bg-muted/40 text-muted-foreground',
                )}
                title={`Token Expiration: ${tokenExpiryInfo.fullFormatted}`}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  {tokenExpiryInfo.isExpired || tokenExpiryInfo.isUrgent ? (
                    <AlertTriangle className="size-3.5 shrink-0" />
                  ) : (
                    <Clock className="size-3.5 shrink-0" />
                  )}
                  <span className="font-medium">Token:</span>
                  <span className="truncate">{tokenExpiryInfo.label}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onConnect(platform)}
                  className={cn(
                    'shrink-0 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer text-[11px]',
                    tokenExpiryInfo.isExpired || tokenExpiryInfo.isUrgent
                      ? 'font-semibold'
                      : 'text-foreground',
                  )}
                  title="Reconnect account to rotate/renew OAuth token"
                >
                  <RefreshCw className="size-3" />
                  <span>Rotate</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Supported Capabilities */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {platform.capabilities.map((capability) => (
            <span
              key={capability}
              className="inline-flex items-center rounded-md bg-muted/60 border border-border/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {capability}
            </span>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/50 pt-3">
        {isConnected ? (
          <>
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
              <CheckCircle2 className="size-3.5 shrink-0" />
              <span>Ready to publish</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRequestDisconnect(platform)}
              className="rounded-md h-8 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 cursor-pointer"
            >
              Disconnect
            </Button>
          </>
        ) : (
          <>
            <span className="text-xs text-muted-foreground">Direct API publishing</span>
            <Button
              variant="default"
              size="sm"
              onClick={() => onConnect(platform)}
              disabled={isConnecting}
              className="rounded-md h-8 px-3.5 text-xs font-medium cursor-pointer"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin mr-1.5" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
