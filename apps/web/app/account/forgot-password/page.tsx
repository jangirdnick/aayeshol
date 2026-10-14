import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/modular/account';

export const metadata: Metadata = {
  title: 'Forgot Password — Aayeshol',
  description: 'Request a password recovery verification code for your Aayeshol account.',
};

/**
 * Self-service forgot password initiation page.
 * Thin Server Component rendering the modular ForgotPasswordForm.
 */
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
