import { Suspense, type ReactNode } from 'react';
import { GuestGuard } from '@/modular/account';

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <GuestGuard>{children}</GuestGuard>
    </Suspense>
  );
}
