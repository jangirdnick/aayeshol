import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Geist, Playfair_Display } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Providers } from './providers';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
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
      className={cn('font-sans', geist.variable, playfair.variable)}
    >
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground transition-colors duration-200`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
