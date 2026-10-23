'use client';

import type { ReactNode } from 'react';
import { AuthGuard } from '@/modular/account';
import { DashboardShell } from '@/modular/dashboard';

/**
 * Protected Dashboard Layout.
 * Enforces authentication and restricts access exclusively to users with the 'ADMIN' role.
 * Wraps dashboard views with the responsive production sidebar shell.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requiredRoles={['ADMIN']}>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
