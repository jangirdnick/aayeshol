import type { Metadata } from 'next';
import { LoginForm } from '@/modular/account';

export const metadata: Metadata = {
  title: 'Log In — Aayeshol',
  description:
    'Sign in to your Aayeshol account to manage and schedule multi-platform social media publications.',
};

/**
 * Authentication route entry point for user login.
 * Thin Next.js Server Component rendering the modular 2-Step OTP login workflow.
 */
export default function LoginPage() {
  return <LoginForm />;
}
