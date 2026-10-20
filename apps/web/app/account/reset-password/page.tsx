import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/modular/account';

export const metadata: Metadata = {
  title: 'Reset Password — Aayeshol',
  description: 'Complete password reset using your 6-digit recovery verification code.',
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ email?: string; challengeId?: string }>;
}

/**
 * Password reset completion page.
 * Thin Server Component rendering the modular ResetPasswordForm.
 */
export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const resolvedParams = await searchParams;

  return (
    <Suspense fallback={null}>
      <ResetPasswordForm
        email={resolvedParams?.email}
        initialChallengeId={resolvedParams?.challengeId}
      />
    </Suspense>
  );
}
