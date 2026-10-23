import Link from 'next/link';
import { ShieldCheck, Mail, ArrowUpRight } from 'lucide-react';

export function LegalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-border/40 bg-muted/10 py-12 transition-colors print:hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Security */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center -space-x-1" aria-hidden="true">
                <span className="h-4.5 w-2.5 rounded-full bg-foreground transform -rotate-12" />
                <span className="size-4 rounded-full bg-foreground" />
              </div>
              <span className="font-heading text-base font-bold tracking-tight text-foreground">
                aayeshol
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
              AI-powered social media scheduling, cross-platform media delivery, and intelligent
              content automation. Built with bank-grade AES-256 token encryption and privacy-first
              infrastructure.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-500 font-medium">
              <ShieldCheck className="size-3.5" />
              <span>Full compliance with Meta, Google, X & LinkedIn developer policies</span>
            </div>
          </div>

          {/* Col 2: Legal Documents */}
          <div className="flex flex-col gap-2.5 text-xs">
            <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-foreground">
              Legal Documents
            </span>
            <Link
              href="/privacy-policy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy-policy#data-deletion-instructions"
              className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <span>User Data Deletion</span>
              <ArrowUpRight className="size-3" />
            </Link>
            <Link
              href="/privacy-policy#google-limited-use"
              className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <span>Google API Limited Use</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>

          {/* Col 3: Contact & Rights */}
          <div className="flex flex-col gap-2.5 text-xs">
            <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-foreground">
              Privacy & Support
            </span>
            <a
              href="mailto:Hello@nickdev.space"
              className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
            >
              <Mail className="size-3.5" />
              <span>Hello@nickdev.space</span>
            </a>
            <span className="text-[11px] text-muted-foreground pt-1">
              Response timeframe: Within 24-48 business hours
            </span>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between border-t border-border/40 pt-6 text-[11px] text-muted-foreground">
          <p>© {currentYear} Aayeshol Inc. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-mono">Platform Version 2.0 • Security Verified</p>
        </div>
      </div>
    </footer>
  );
}
