import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { cn } from '@/lib/utils';
import { Providers } from './providers';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-sans',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Aayeshol - Where Knowledge Comes Alive',
  description: 'AI-Powered Multi-Platform Social Media Management and Publishing Engine',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('font-sans', geistSans.variable, geistMono.variable)}
    >
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen bg-background text-foreground transition-colors duration-200"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
