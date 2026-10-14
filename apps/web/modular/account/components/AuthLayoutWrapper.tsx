'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';

export interface BackNavigationConfig {
  /** If specified, executes onClick handler instead of route navigation */
  onClick?: () => void;
  /** Route path to navigate to when clicked */
  href?: string;
  /** Accessible button label */
  label?: string;
}

export interface AuthLayoutWrapperProps {
  children: React.ReactNode;
  backAction?: BackNavigationConfig;
  className?: string;
}

/**
 * Editorial split-screen layout wrapper for authentication screens.
 * Contains the pointillism artwork on the left and the editorial interactive panel on the right.
 */
export function AuthLayoutWrapper({ children, backAction, className }: AuthLayoutWrapperProps) {
  return (
    <section className="w-full min-h-screen md:h-screen p-0 sm:p-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Left Column: Pointillism Artwork */}
      <div className="relative w-full h-80 md:h-full rounded-2xl md:rounded-r-none md:rounded-l-2xl overflow-hidden max-md:hidden bg-neutral-200 dark:bg-neutral-800 border border-neutral-300/40 dark:border-neutral-800/80 shadow-xs">
        <Image
          src="https://ik.imagekit.io/ey4pcsgfy/artwork.webp"
          alt="Where Knowledge Comes Alive"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-center"
        />
      </div>

      {/* Right Column: Editorial Authentication Container */}
      <div className="relative w-full h-full flex flex-col justify-between py-4 sm:py-7 px-5 sm:px-9 md:px-12 lg:px-16 md:rounded-l-none md:rounded-r-2xl bg-[#f1f1f1] dark:bg-neutral-900 text-foreground border border-neutral-300/40 dark:border-neutral-800/80 shadow-xs transition-colors duration-200">
        {/* Top bar: Back navigation & Mode toggle */}
        <div className="flex items-center justify-between w-full h-9">
          {backAction ? (
            backAction.onClick ? (
              <button
                type="button"
                onClick={backAction.onClick}
                className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-foreground transition-colors cursor-pointer"
                aria-label={backAction.label || 'Go back'}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{backAction.label || 'Go back'}</span>
              </button>
            ) : backAction.href ? (
              <Link
                href={backAction.href}
                className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-foreground transition-colors cursor-pointer"
                aria-label={backAction.label || 'Go back'}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{backAction.label || 'Go back'}</span>
              </Link>
            ) : (
              <div />
            )
          ) : (
            <div />
          )}

          <ModeToggle />
        </div>

        {/* Center Content Slot */}
        <div className={`my-auto max-w-md w-full mx-auto md:mx-0 py-6 sm:py-8 ${className ?? ''}`}>
          {children}
        </div>

        {/* Bottom Bar: Aayeshol Brand & Tagline */}
        <div className="flex items-center gap-3 md:pt-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center -space-x-1" aria-hidden="true">
              <span className="w-3.5 h-6 rounded-full bg-neutral-950 dark:bg-white transform -rotate-12" />
              <span className="w-5.5 h-5.5 rounded-full bg-neutral-950 dark:bg-white" />
            </div>
            <span className="font-semibold text-xl tracking-tight text-neutral-950 dark:text-white">
              aayeshol
            </span>
          </div>

          <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-700 mx-1" />

          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-tight max-w-[200px]">
            Shared Knowledge for a Responsible AI Future.
          </p>
        </div>
      </div>
    </section>
  );
}
