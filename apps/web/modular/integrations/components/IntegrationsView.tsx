'use client';

import * as React from 'react';
import { Search, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlatformCard } from './PlatformCard';
import { IntegrationsHeader } from './IntegrationsHeader';
import { DisconnectDialog } from './DisconnectDialog';
import { useIntegrations } from '../hooks';

export function IntegrationsView() {
  const {
    totalPlatforms,
    connectedCount,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    filteredPlatforms,
    disconnectTarget,
    setDisconnectTarget,
    isDisconnecting,
    connectingId,
    isRefreshing,
    feedbackMessage,
    setFeedbackMessage,
    connectPlatform,
    confirmDisconnect,
    refreshAllTokens,
  } = useIntegrations();

  return (
    <div className="flex flex-col w-full h-full">
      {/* Top Header & Search Section (Full-width 2-row layout matching reference) */}
      <IntegrationsHeader
        totalPlatforms={totalPlatforms}
        connectedCount={connectedCount}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefreshAll={refreshAllTokens}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <div className="flex flex-col justify-between gap-6 w-full h-full p-2.5 md:p-6">
        {/* Status Feedback Banner */}
        {feedbackMessage && (
          <div
            role="status"
            className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-400 transition-all animate-in fade-in-0 duration-200"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              <span className="font-medium text-foreground">{feedbackMessage.text}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFeedbackMessage(null)}
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground rounded-md cursor-pointer"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Platform Cards Grid (3 columns on medium+ screens) */}
        {filteredPlatforms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {filteredPlatforms.map((platform) => (
              <PlatformCard
                key={platform.id}
                platform={platform}
                onConnect={connectPlatform}
                onRequestDisconnect={setDisconnectTarget}
                isConnecting={connectingId === platform.id}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-card/40 p-12 text-center w-full">
            <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground mb-3">
              <Search className="size-5" />
            </div>
            <h3 className="font-heading text-sm font-semibold text-foreground">
              No platforms found
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              No social platforms match your current search &quot;{searchQuery}&quot;.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('ALL');
              }}
              className="mt-4 text-xs rounded-md cursor-pointer"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Bottom Security Assurance Banner */}
        <div className="rounded-lg border border-border/70 bg-card/40 px-4 py-3.5 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <ShieldCheck className="size-4" />
            </div>
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground font-medium">Bank-grade security:</strong> All
              credentials and OAuth tokens are AES-256 encrypted at rest and refreshed
              automatically. Client secrets are never exposed.
            </p>
          </div>

          <Badge
            variant="outline"
            className="rounded-full text-[11px] font-medium text-muted-foreground border-border/70 bg-muted/20 shrink-0 self-start sm:self-auto"
          >
            AES-256 Encrypted
          </Badge>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      <DisconnectDialog
        platform={disconnectTarget}
        open={Boolean(disconnectTarget)}
        onOpenChange={(open) => {
          if (!open) setDisconnectTarget(null);
        }}
        onConfirm={confirmDisconnect}
        isDisconnecting={isDisconnecting}
      />
    </div>
  );
}
