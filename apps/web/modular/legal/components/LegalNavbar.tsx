'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Shield, FileText, Printer } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function LegalNavbar() {
  const pathname = usePathname();
  const isPrivacy = pathname.startsWith('/privacy');
  const isTerms = pathname.startsWith('/terms');

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/75 backdrop-blur-md transition-colors print:hidden">
      <div className="mx-auto flex h-15 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand & Return Navigation */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
            aria-label="Aayeshol Home"
          >
            <div className="flex items-center -space-x-1" aria-hidden="true">
              <span className="h-5 w-3 rounded-full bg-foreground transform -rotate-12" />
              <span className="size-4.5 rounded-full bg-foreground" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight text-foreground">
              aayeshol
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-muted-foreground/40 font-mono text-sm">/</span>
            <Badge
              variant="outline"
              className="rounded-full border-border/50 bg-muted/20 px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground"
            >
              Legal &amp; Compliance
            </Badge>
          </div>
        </div>

        {/* Center: Tabs Switcher (Vercel / Perplexity Capsule) */}
        <nav
          aria-label="Legal Documents Navigation"
          className="flex items-center rounded-full border border-border/50 bg-muted/30 p-1 text-xs"
        >
          <Link
            href="/privacy-policy"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 font-medium transition-all duration-200',
              isPrivacy
                ? 'bg-foreground text-background shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Shield className="size-3.5" />
            <span>Privacy Policy</span>
          </Link>
          <Link
            href="/terms-of-service"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 font-medium transition-all duration-200',
              isTerms
                ? 'bg-foreground text-background shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <FileText className="size-3.5" />
            <span>Terms of Service</span>
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            aria-label="Print Document"
            className="hidden sm:inline-flex h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Printer className="size-3.5" />
            <span>Print</span>
          </Button>

          <ModeToggle />

          <Link href="/dashboard" className="hidden xs:inline-flex">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs font-medium border-border/80 hover:bg-muted cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
