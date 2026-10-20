'use client';

import type { ReactNode } from 'react';
import { AuthGuard } from '@/modular/account';

/**
 * Protected Dashboard Layout.
 * Enforces authentication and restricts access exclusively to users with the 'ADMIN' role.
 * Non-logged-in users are redirected to /account/login with return redirect query param.
 * Logged-in non-admins receive a dedicated Access Restricted screen.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requiredRoles={['ADMIN']}>
      <div className="min-h-screen bg-background text-foreground antialiased">{children}</div>
    </AuthGuard>
  );
}
