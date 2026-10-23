'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { SocialPlatformConfig } from '../types';

interface DisconnectDialogProps {
  platform: SocialPlatformConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDisconnecting?: boolean;
}

export function DisconnectDialog({
  platform,
  open,
  onOpenChange,
  onConfirm,
  isDisconnecting = false,
}: DisconnectDialogProps) {
  if (!platform) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg">
        <DialogHeader>
          <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="size-4.5" />
          </div>
          <DialogTitle className="text-base font-semibold">Disconnect {platform.name}?</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Revoking authorization for{' '}
            <strong className="text-foreground font-medium">
              {platform.account?.name || platform.name}
            </strong>{' '}
            will pause any upcoming scheduled posts for this channel until reconnected.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDisconnecting}
            className="rounded-md text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isDisconnecting}
            className="rounded-md text-xs cursor-pointer"
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
