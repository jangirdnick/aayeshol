import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Database,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Sparkles,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { LegalNavbar, TableOfContents, LegalFooter, type TocItem } from '@/modular/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy & Data Protection | Aayeshol',
  description:
    'Comprehensive Privacy Policy for Aayeshol v2 detailing our data handling practices, social integration token security, Google API Limited Use compliance, and Meta user data deletion instructions.',
  openGraph: {
    title: 'Privacy Policy | Aayeshol',
    description:
      'Learn how Aayeshol protects your social media accounts, encrypts OAuth tokens, handles Google Drive media streaming, and respects user privacy.',
  },
};

const TOC_ITEMS: TocItem[] = [
  { id: 'overview', title: '1. Overview & Scope' },
  { id: 'data-collection', title: '2. Information We Collect', badge: 'OAuth Data' },
  { id: 'data-usage', title: '3. How We Use Data' },
  { id: 'meta-facebook-policy', title: '4. Meta & Instagram Practices', badge: 'App Review' },
  {
    id: 'data-deletion-instructions',
    title: '5. User Data Deletion Instructions',
    badge: 'Meta Required',
  },
  { id: 'google-limited-use', title: '6. Google API Limited Use', badge: 'Google Required' },
  { id: 'x-linkedin-compliance', title: '7. X & LinkedIn Compliance' },
  { id: 'gemini-ai-practices', title: '8. Gemini AI Assistant Disclosures' },
  { id: 'security-encryption', title: '9. Security & AES-256 Encryption', badge: 'AES-256' },
  { id: 'data-retention', title: '10. Data Retention & Purge' },
  { id: 'user-rights', title: '11. Your Legal Rights (GDPR/CCPA)' },
  { id: 'contact', title: '12. Contact & Data Protection Officer' },
];

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 24, 2026';
  const effectiveDate = 'October 24, 2026';

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-foreground selection:text-background">
      {/* Subtle atmospheric glow & grid (Vercel / Perplexity classic finish) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(120,119,198,0.1),transparent)] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(120,119,198,0.06),transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"
        aria-hidden="true"
      />

      <LegalNavbar />

      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Page Header */}
        <header className="mb-12 border-b border-border/50 pb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge
              variant="outline"
              className="gap-1.5 rounded-full border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-500"
            >
              <CheckCircle2 className="size-3.5" />
              <span>Verified Compliance Standards</span>
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full border-border/50 bg-muted/20 px-3 py-0.5 font-mono text-xs text-muted-foreground"
            >
              Document Ref: AY-PRIV-2026
            </Badge>
            <Badge
              variant="outline"
              className="gap-1 rounded-full border-border/50 bg-muted/20 px-2.5 py-0.5 text-[11px] text-muted-foreground"
            >
              <Clock className="size-3" />
              <span>7 min read</span>
            </Badge>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Privacy Policy &amp; Data Protection Practices
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
            Aayeshol v2 is designed with privacy-first engineering. This document clearly
            articulates how we ingest, process, store, encrypt, and delete information when you
            authenticate, schedule, and automate multi-platform publications across Meta (Instagram,
            Facebook), Google (YouTube, Drive), X (Twitter), and LinkedIn.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              <span>Effective Date: {effectiveDate}</span>
            </span>
            <span>•</span>
            <span>Last Updated: {lastUpdated}</span>
          </div>
        </header>

        {/* 2-Column Layout: Sidebar TOC + Main Policy Prose */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sticky Left Sidebar: Table of Contents */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 print:hidden">
            <div className="sticky top-24 rounded-lg border border-border/60 bg-card/40 p-4 backdrop-blur-xs">
              <TableOfContents items={TOC_ITEMS} title="Policy Sections" />

              <div className="mt-6 border-t border-border/50 pt-4 space-y-3">
                <div className="flex flex-col gap-2 rounded-md bg-muted/40 p-3 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">Need immediate data deletion?</span>
                  <p className="leading-snug">
                    You can purge your connected social tokens instantly from your dashboard.
                  </p>
                  <Link
                    href="/dashboard/integrations"
                    className="font-medium text-foreground hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    <span>Manage Connections</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>

                <div className="flex flex-col gap-2 rounded-md bg-muted/40 p-3 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">Looking for User Agreement?</span>
                  <p className="leading-snug">
                    Review our terms of use, acceptable use, and customer data ownership guarantees.
                  </p>
                  <Link
                    href="/terms-of-service"
                    className="font-medium text-foreground hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    <span>Read Terms of Service</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Policy Content */}
          <article className="lg:col-span-8 xl:col-span-9 space-y-12 leading-relaxed text-sm text-foreground/90">
            {/* Quick Summary Card */}
            <Card className="rounded-xl border border-border/80 bg-card/60 p-6 shadow-xs">
              <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                <Shield className="size-5 text-emerald-500" />
                <span>Executive Privacy Summary</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div className="space-y-1 border-l-2 border-emerald-500/50 pl-3">
                  <strong className="text-foreground font-medium block">Zero Token Selling</strong>
                  <span>
                    We never sell, rent, or monetize your social tokens or personal content.
                  </span>
                </div>
                <div className="space-y-1 border-l-2 border-emerald-500/50 pl-3">
                  <strong className="text-foreground font-medium block">
                    AES-256-GCM Encryption
                  </strong>
                  <span>
                    All OAuth access & refresh tokens are encrypted at rest with isolated keys.
                  </span>
                </div>
                <div className="space-y-1 border-l-2 border-emerald-500/50 pl-3">
                  <strong className="text-foreground font-medium block">
                    Google Limited Use Adherence
                  </strong>
                  <span>
                    Google Drive media is streamed on-demand and never used for model training.
                  </span>
                </div>
                <div className="space-y-1 border-l-2 border-emerald-500/50 pl-3">
                  <strong className="text-foreground font-medium block">
                    Instant User Data Deletion
                  </strong>
                  <span>
                    One-click account disconnect purges all linked credentials immediately.
                  </span>
                </div>
              </div>
            </Card>

            {/* 1. Overview */}
            <section id="overview" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground border-b border-border/50 pb-2">
                1. Overview & Scope
              </h2>
              <p>
                This Privacy Policy explains how <strong>Aayeshol</strong> (&quot;we&quot;,
                &quot;our&quot;, or &quot;us&quot;) handles information collected through our web
                applications, APIs, and automated background scheduling workers located at{' '}
                <code>https://aayeshol.com</code> and related domains.
              </p>
              <p>
                Aayeshol is a SaaS platform engineered to help creators, businesses, and agency
                managers streamline content creation and scheduling across social platforms
                including Instagram (via Meta Graph API), YouTube (via Google OAuth & YouTube Data
                API), Google Drive, X (formerly Twitter), and LinkedIn.
              </p>
            </section>

            {/* 2. Information We Collect */}
            <section id="data-collection" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground border-b border-border/50 pb-2">
                2. Information We Collect
              </h2>
              <p>
                We strictly limit our data collection to what is required to execute authenticated
                social media management:
              </p>

              <div className="space-y-3">
                <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                  <h3 className="font-semibold text-foreground text-sm">
                    A. Account Credentials & Contact Data
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    When you create an account, we collect your name, email address, and an
                    encrypted salted password hash (bcrypt). For two-step OTP verification and
                    authentication challenges, we temporarily record numeric OTP tokens in Redis
                    with a strict 5 to 10 minute expiration.
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                  <h3 className="font-semibold text-foreground text-sm">
                    B. Connected Social Media Accounts & Tokens
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    When you link an external social account via OAuth 2.0 (Meta/Instagram, YouTube,
                    X, or LinkedIn), we collect public identity attributes: provider ID, display
                    name, handle/username, and avatar URL. We receive OAuth access tokens and
                    refresh tokens which are <strong>immediately encrypted with AES-256-GCM</strong>{' '}
                    prior to persistence. We never receive or store your third-party account
                    passwords.
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                  <h3 className="font-semibold text-foreground text-sm">
                    C. Google Drive Media Stream Data
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    When you connect Google Drive to attach high-resolution images or videos to your
                    scheduled posts, our integration requests read-only access (
                    <code>https://www.googleapis.com/auth/drive.readonly</code>). Media files
                    selected by you are streamed transiently through background publishing workers
                    directly to the destination social platforms. We do not index your personal
                    drive, copy unrelated files, or store media permanently on our servers.
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                  <h3 className="font-semibold text-foreground text-sm">
                    D. AI Content Studio Prompts
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Prompts, keywords, and draft captions submitted to our AI Content Assistant are
                    transmitted to the Google Gemini API to generate platform-tailored suggestions.
                    Neither Aayeshol nor Google uses your private prompts to train public foundation
                    models without consent.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. How We Use Data */}
            <section id="data-usage" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground border-b border-border/50 pb-2">
                3. How We Use Information
              </h2>
              <p>We process your data strictly to fulfill the core capabilities of the service:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
                <li>
                  Authenticating user sessions and validating short-lived JSON Web Tokens (JWT).
                </li>
                <li>
                  Executing immediate and delayed post publication across connected platforms via
                  BullMQ.
                </li>
                <li>
                  Streaming selected video and image media assets from Google Drive to destination
                  platforms.
                </li>
                <li>
                  Generating captions, hashtag suggestions, and titles via Gemini API based on user
                  input.
                </li>
                <li>
                  Dispatching transactional notifications (OTP codes, post publication
                  success/failure) via Resend.
                </li>
                <li>
                  Monitoring application health, rate limits, and preventing fraudulent or abusive
                  bot behavior.
                </li>
              </ul>
              <p className="text-xs font-semibold text-foreground">
                We do NOT sell personal data, license user-generated content to third-party data
                brokers, or use OAuth tokens for surveillance or advertising tracking.
              </p>
            </section>

            {/* 4. Meta & Instagram Practices */}
            <section id="meta-facebook-policy" className="scroll-mt-24 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                  4. Meta (Instagram & Facebook) Data Practices
                </h2>
                <Badge
                  variant="outline"
                  className="border-blue-500/30 bg-blue-500/10 text-blue-400 font-mono text-[10px]"
                >
                  Meta Platform Terms
                </Badge>
              </div>

              <p>
                To provide Instagram and Facebook post scheduling, analytics, and comment
                management, our application interacts with the Meta Graph API and requests the
                following specific permissions:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                  <code className="text-foreground font-semibold">instagram_basic</code>
                  <p className="mt-1 text-muted-foreground">
                    Read Instagram account profile info, username, and connected Facebook page
                    mapping.
                  </p>
                </div>
                <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                  <code className="text-foreground font-semibold">instagram_content_publish</code>
                  <p className="mt-1 text-muted-foreground">
                    Publish single photos, carousels, video reels, and scheduled feed posts on user
                    behalf.
                  </p>
                </div>
                <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                  <code className="text-foreground font-semibold">instagram_manage_comments</code>
                  <p className="mt-1 text-muted-foreground">
                    Read, post, and moderate comments on user-published Instagram posts.
                  </p>
                </div>
                <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                  <code className="text-foreground font-semibold">
                    pages_show_list & pages_read_engagement
                  </code>
                  <p className="mt-1 text-muted-foreground">
                    Discover Instagram professional accounts linked to user Facebook Pages.
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                In strict accordance with the Meta Developer Policies, Aayeshol only accesses Meta
                user data when actively requested by the user, encrypts all user access tokens, and
                complies with Meta data retention and deletion mandates.
              </p>
            </section>

            {/* 5. User Data Deletion Instructions (Meta Compliance Mandatory) */}
            <section
              id="data-deletion-instructions"
              className="scroll-mt-24 space-y-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-6"
            >
              <div className="flex items-center gap-2 text-emerald-500">
                <Trash2 className="size-5 shrink-0" />
                <h2 className="font-heading text-xl font-bold text-foreground">
                  5. User Data Deletion Instructions (Meta / Facebook Compliance)
                </h2>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                As required by the Meta Platform Terms and global data protection regulations,
                Aayeshol provides an immediate, transparent, and automated mechanism for users to
                request and verify the permanent deletion of all data obtained through Facebook and
                Instagram:
              </p>

              <div className="space-y-3 pt-2">
                <div className="rounded-lg border border-border/80 bg-background/80 p-4 space-y-2">
                  <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider font-mono">
                    Method 1: Instant Self-Service Disconnect (Recommended)
                  </h3>
                  <ol className="list-decimal pl-5 text-xs text-muted-foreground space-y-1">
                    <li>
                      Log in to your Aayeshol workspace and navigate to{' '}
                      <strong>Dashboard &gt; Social Connections</strong> (
                      <code>/dashboard/integrations</code>).
                    </li>
                    <li>
                      Locate the <strong>Instagram</strong> or <strong>Facebook</strong> platform
                      card.
                    </li>
                    <li>
                      Click <strong>&quot;Disconnect&quot;</strong> and confirm the prompt in the
                      modal.
                    </li>
                    <li>
                      <strong>Automatic Execution:</strong> Our backend immediately deletes your
                      social account record, permanently purges encrypted access and refresh tokens
                      from PostgreSQL, and clears all associated Redis cache keys.
                    </li>
                  </ol>
                </div>

                <div className="rounded-lg border border-border/80 bg-background/80 p-4 space-y-2">
                  <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider font-mono">
                    Method 2: Remove Access via Facebook / Instagram Settings
                  </h3>
                  <ol className="list-decimal pl-5 text-xs text-muted-foreground space-y-1">
                    <li>
                      Go to your Facebook profile{' '}
                      <strong>Settings & Privacy &gt; Settings &gt; Apps and Websites</strong>.
                    </li>
                    <li>
                      Find <strong>Aayeshol</strong> in the list of authorized applications.
                    </li>
                    <li>
                      Click <strong>Remove</strong>. This immediately invalidates our OAuth token
                      and stops all synchronization.
                    </li>
                  </ol>
                </div>

                <div className="rounded-lg border border-border/80 bg-background/80 p-4 space-y-2">
                  <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider font-mono">
                    Method 3: Formal Manual Deletion Request
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    If you wish to delete your entire account including past execution logs and
                    author metadata, email our Data Protection team at{' '}
                    <a
                      href="mailto:Hello@nickdev.space"
                      className="text-foreground underline font-medium"
                    >
                      Hello@nickdev.space
                    </a>{' '}
                    with the subject <em>&quot;Data Deletion Request&quot;</em>. Requests are
                    confirmed and permanently fulfilled within thirty (30) calendar days.
                  </p>
                </div>
              </div>
            </section>

            {/* 6. Google API User Data Policy Compliance */}
            <section
              id="google-limited-use"
              className="scroll-mt-24 space-y-4 rounded-xl border border-border/80 bg-card/60 p-6"
            >
              <div className="flex items-center gap-2 text-foreground">
                <Database className="size-5 text-blue-500" />
                <h2 className="font-heading text-xl font-bold text-foreground">
                  6. Google API Services User Data Policy & Limited Use Disclosure
                </h2>
              </div>

              <div className="rounded-lg border-l-4 border-blue-500 bg-muted/40 p-4 text-xs italic text-foreground/90">
                &quot;Aayeshol&apos;s use and transfer to any other app of information received from
                Google APIs will adhere to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-0.5"
                >
                  Google API Services User Data Policy
                  <ExternalLink className="size-3" />
                </a>
                , including the Limited Use requirements.&quot;
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  <strong>YouTube Data API (v3):</strong> We request the{' '}
                  <code>youtube.force-ssl</code> scope exclusively to upload videos, set titles,
                  descriptions, tags, and retrieve upload status on your authorized YouTube channel.
                  We do not modify unrelated channel settings or access private user history.
                </p>
                <p>
                  <strong>Google Drive API:</strong> We request read-only access (
                  <code>drive.readonly</code>) solely to permit you to select and stream your own
                  image and video files directly to our scheduled publishing pipeline. We do not
                  read, copy, modify, or retain files from your Drive other than the specific media
                  assets you schedule.
                </p>
                <p>
                  <strong>Non-Use for AI Training:</strong> In strict compliance with Google Limited
                  Use guidelines, data received from Google APIs (including Drive files and YouTube
                  channel details) is never used to develop, train, or fine-tune machine learning or
                  artificial intelligence models.
                </p>
              </div>
            </section>

            {/* 7. X (Twitter) & LinkedIn Compliance */}
            <section id="x-linkedin-compliance" className="scroll-mt-24 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                  7. X (Twitter) &amp; LinkedIn Developer Compliance
                </h2>
                <Badge
                  variant="outline"
                  className="border-border/60 bg-muted/30 font-mono text-[10px]"
                >
                  X &amp; LinkedIn APIs
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* X / Twitter */}
                <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                      <span>X (formerly Twitter) API v2</span>
                    </span>
                    <a
                      href="https://developer.x.com/en/developer-terms/agreement-and-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <span>Policy</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We authenticate via OAuth 2.0 PKCE with client authorization headers. We only
                    request granular scopes:
                  </p>
                  <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                    <span className="rounded bg-muted px-1.5 py-0.5">tweet.read</span>
                    <span className="rounded bg-muted px-1.5 py-0.5">tweet.write</span>
                    <span className="rounded bg-muted px-1.5 py-0.5">users.read</span>
                    <span className="rounded bg-muted px-1.5 py-0.5">media.write</span>
                    <span className="rounded bg-muted px-1.5 py-0.5">offline.access</span>
                  </div>
                  <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1 pt-1">
                    <li>We honor tweet deletions and user privacy settings in real time.</li>
                    <li>Tokens are AES-256 encrypted and stored with expiration tracking.</li>
                    <li>Zero tolerance for automated spam or hashtag manipulation.</li>
                  </ul>
                </div>

                {/* LinkedIn */}
                <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                      <span className="text-sky-500">LinkedIn Community API</span>
                    </span>
                    <a
                      href="https://legal.linkedin.com/api-terms-of-use"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <span>Policy</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We connect via LinkedIn OAuth 2.0 (OpenID Connect) strictly to publish
                    authorized professional posts:
                  </p>
                  <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                    <span className="rounded bg-muted px-1.5 py-0.5">openid</span>
                    <span className="rounded bg-muted px-1.5 py-0.5">profile</span>
                    <span className="rounded bg-muted px-1.5 py-0.5">email</span>
                    <span className="rounded bg-muted px-1.5 py-0.5">w_member_social</span>
                  </div>
                  <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1 pt-1">
                    <li>Tokens have a 60-day lifecycle with manual/automated rotation notices.</li>
                    <li>We never scrape member connections, private messages, or company data.</li>
                    <li>Strict compliance with LinkedIn Professional Community Policies.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 8. Gemini AI Assistant Disclosures */}
            <section id="gemini-ai-practices" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-amber-500" />
                <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground border-b border-border/50 pb-2 flex-1">
                  8. Google Gemini AI Content Studio Disclosures
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Aayeshol integrates with the Google Gemini API to offer an intelligent AI Content
                Assistant. When you ask the assistant to draft a caption, generate hashtags, or
                rephrase a post:
              </p>
              <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                <li>
                  Your prompts are transmitted via encrypted TLS directly to the Gemini API
                  endpoint.
                </li>
                <li>
                  Output suggestions are presented to you in draft state; you maintain sole
                  editorial review before scheduling.
                </li>
                <li>
                  Your proprietary prompts and generated content are not used by Aayeshol to train
                  competing AI models.
                </li>
              </ul>
            </section>

            {/* 9. Security & Encryption */}
            <section id="security-encryption" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="size-5 text-emerald-500" />
                <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground border-b border-border/50 pb-2 flex-1">
                  9. Security & AES-256-GCM Encryption Architecture
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                We employ defense-in-depth architectural standards to protect sensitive tokens and
                user data:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <strong className="text-foreground font-semibold block">
                    AES-256-GCM Encryption
                  </strong>
                  <span className="text-muted-foreground">
                    All third-party OAuth access and refresh tokens are encrypted at rest with
                    unique initialization vectors and cryptographically authenticated tags.
                  </span>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <strong className="text-foreground font-semibold block">
                    Stateless JWT + Secure Cookies
                  </strong>
                  <span className="text-muted-foreground">
                    Short-lived access tokens (8 minutes) and HTTP-only, SameSite=Lax secure refresh
                    cookies (7 hours) prevent session hijacking and XSS leakage.
                  </span>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <strong className="text-foreground font-semibold block">
                    Single-Use OAuth State in Redis
                  </strong>
                  <span className="text-muted-foreground">
                    Cryptographic UUIDv4 OAuth state challenges prevent CSRF cross-site request
                    forgery and are evicted immediately upon completion.
                  </span>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <strong className="text-foreground font-semibold block">
                    Zero Plaintext Token Logging
                  </strong>
                  <span className="text-muted-foreground">
                    Token credentials and client secrets are strictly redacted from internal
                    application and server logs.
                  </span>
                </div>
              </div>
            </section>

            {/* 10. Data Retention */}
            <section id="data-retention" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground border-b border-border/50 pb-2">
                10. Data Retention & Revocation Policy
              </h2>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  <strong>Active Accounts:</strong> We retain account data, post scheduling history,
                  and encrypted tokens as long as your Aayeshol workspace remains active.
                </p>
                <p>
                  <strong>Disconnected Accounts:</strong> When a social connection is disconnected
                  by the user, its tokens and profile records are purged immediately.
                </p>
                <p>
                  <strong>Terminated Accounts:</strong> Upon permanent account deletion, all
                  personal data, sessions, and scheduling records are deleted within 30 days and
                  erased from database backup snapshots within 90 days.
                </p>
              </div>
            </section>

            {/* 11. User Rights */}
            <section id="user-rights" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground border-b border-border/50 pb-2">
                11. Your Legal Rights (GDPR & CCPA/CPRA)
              </h2>
              <p className="text-xs text-muted-foreground">
                Depending on your geographic location, you possess statutory rights concerning your
                personal data:
              </p>
              <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                <li>
                  <strong>Right of Access:</strong> Request an export of your stored personal
                  information.
                </li>
                <li>
                  <strong>Right to Rectification:</strong> Correct inaccurate or incomplete profile
                  data.
                </li>
                <li>
                  <strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request
                  permanent deletion of all data.
                </li>
                <li>
                  <strong>Right to Portability:</strong> Obtain your post schedule and content in a
                  structured, machine-readable format.
                </li>
                <li>
                  <strong>Right to Withdraw Consent:</strong> Revoke OAuth permissions at any time
                  via our integrations dashboard.
                </li>
              </ul>
            </section>

            {/* 12. Contact */}
            <section id="contact" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground border-b border-border/50 pb-2">
                12. Contact & Inquiries
              </h2>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-5 space-y-2 text-xs text-muted-foreground">
                <p className="text-foreground font-medium">
                  Aayeshol Data Privacy & Legal Compliance Office
                </p>
                <p>
                  Privacy & Support:{' '}
                  <a href="mailto:Hello@nickdev.space" className="text-foreground underline">
                    Hello@nickdev.space
                  </a>
                </p>
                <p className="pt-2 text-[11px]">
                  For platform verification questions or urgent data deletion requests, inquiries
                  are acknowledged and addressed within 24 to 48 business hours.
                </p>
              </div>
            </section>
          </article>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
