import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  AlertTriangle,
  Scale,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Share2,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { LegalNavbar, TableOfContents, LegalFooter, type TocItem } from '@/modular/legal';

export const metadata: Metadata = {
  title: 'Terms of Service | Aayeshol',
  description:
    'Terms of Service and User Agreement for Aayeshol v2. Details acceptable use, social platform API compliance (Meta, YouTube, X, LinkedIn), AI content generation, and customer data ownership.',
  openGraph: {
    title: 'Terms of Service | Aayeshol',
    description:
      'Review the legal terms governing your use of Aayeshol v2, including social account integrations, scheduled publishing, and Gemini AI tools.',
  },
};

const TOC_ITEMS: TocItem[] = [
  { id: 'agreement', title: '1. Agreement to Terms' },
  { id: 'description-of-service', title: '2. Description of Service' },
  { id: 'account-security', title: '3. Accounts & Authentication', badge: '2-Step OTP' },
  {
    id: 'social-integrations',
    title: '4. Social Platform Integrations & OAuth',
    badge: 'Meta & Google',
  },
  { id: 'acceptable-use', title: '5. Acceptable Use Policy', badge: 'Strict' },
  { id: 'user-content-ownership', title: '6. User Content & Data Ownership', badge: '100% Yours' },
  { id: 'ai-assistant', title: '7. AI Content Assistant (Gemini API)' },
  { id: 'intellectual-property', title: '8. Intellectual Property of Aayeshol' },
  { id: 'billing-subscriptions', title: '9. Billing, Subscriptions & Quotas' },
  { id: 'availability-slas', title: '10. Availability & API Limitations' },
  { id: 'limitation-of-liability', title: '11. Limitation of Liability', badge: 'Important' },
  { id: 'indemnification', title: '12. Indemnification' },
  { id: 'termination', title: '13. Termination & Token Eviction' },
  { id: 'dispute-resolution', title: '14. Dispute Resolution & Governing Law' },
  { id: 'modifications', title: '15. Modifications to Terms' },
  { id: 'contact', title: '16. Contact Information' },
];

export default function TermsOfServicePage() {
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
              className="gap-1.5 rounded-full border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-xs font-medium text-blue-500"
            >
              <Scale className="size-3.5" />
              <span>Standard SaaS User Agreement</span>
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full border-border/50 bg-muted/20 px-3 py-0.5 font-mono text-xs text-muted-foreground"
            >
              Document Ref: AY-TERMS-2026
            </Badge>
            <Badge
              variant="outline"
              className="gap-1 rounded-full border-border/50 bg-muted/20 px-2.5 py-0.5 text-[11px] text-muted-foreground"
            >
              <Clock className="size-3" />
              <span>9 min read</span>
            </Badge>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Terms of Service &amp; User Agreement
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
            Please read these Terms of Service carefully before utilizing Aayeshol v2. These terms
            govern your access to our social media publishing infrastructure, scheduled delivery
            engine, Google Drive media streaming pipelines, and AI content assistant tools.
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

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sticky Left Sidebar: Table of Contents */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 print:hidden">
            <div className="sticky top-24 rounded-lg border border-border/60 bg-card/40 p-4 backdrop-blur-xs">
              <TableOfContents items={TOC_ITEMS} title="Agreement Sections" />

              <div className="mt-6 border-t border-border/50 pt-4">
                <div className="flex flex-col gap-2 rounded-md bg-muted/40 p-3 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Looking for Privacy Information?
                  </span>
                  <p className="leading-snug">
                    Learn how we encrypt OAuth tokens and protect your personal information.
                  </p>
                  <Link
                    href="/privacy-policy"
                    className="font-medium text-foreground hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    <span>Read Privacy Policy</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Terms Content */}
          <article className="lg:col-span-8 xl:col-span-9 space-y-12 leading-relaxed text-sm text-foreground/90">
            {/* Executive Summary Card */}
            <Card className="border-border/60 bg-muted/20 p-5 sm:p-6 backdrop-blur-xs">
              <div className="flex items-start gap-3.5">
                <div className="rounded-md bg-blue-500/10 p-2 text-blue-500">
                  <FileText className="size-5" />
                </div>
                <div>
                  <h2 className="font-heading text-base font-semibold text-foreground">
                    Plain English Summary of Key Rights &amp; Responsibilities
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This summary is provided for clarity; the full terms below constitute the
                    binding legal agreement.
                  </p>
                  <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                      <span>
                        <strong>Your Content is Yours:</strong> You retain 100% ownership of your
                        media and posts.
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                      <span>
                        <strong>OAuth Disconnect Anytime:</strong> Revoke social account permissions
                        instantly.
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                      <span>
                        <strong>No Spam or Abuse:</strong> Zero tolerance for coordinated
                        inauthentic activity or spam.
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                      <span>
                        <strong>AI Review Responsibility:</strong> You must review AI captions
                        before scheduling.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Section 1 */}
            <section id="agreement" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <span>1. Agreement to Terms &amp; Eligibility</span>
              </h2>
              <p>
                These Terms of Service (&quot;<strong>Terms</strong>&quot;) constitute a legally
                binding agreement between you (whether individually or on behalf of an entity,
                &quot;<strong>User</strong>&quot; or &quot;<strong>you</strong>&quot;) and Aayeshol
                Inc. (&quot;<strong>Aayeshol</strong>&quot;, &quot;<strong>we</strong>&quot;, &quot;
                <strong>us</strong>&quot;, or &quot;<strong>our</strong>&quot;). By accessing or
                using the Aayeshol web application (available at{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                  aayeshol.com
                </code>{' '}
                or any associated domains), creating an account, linking social media accounts, or
                scheduling automated publications, you acknowledge that you have read, understood,
                and agreed to be bound by all of these Terms and our companion{' '}
                <Link
                  href="/privacy-policy"
                  className="text-foreground font-medium underline underline-offset-4 hover:text-muted-foreground"
                >
                  Privacy Policy
                </Link>
                .
              </p>
              <div className="rounded-md border border-border/60 bg-card p-4 space-y-2 text-xs">
                <p className="font-medium text-foreground">Eligibility Requirements:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    You must be at least 18 years of age, or the age of legal majority in your
                    jurisdiction.
                  </li>
                  <li>
                    If you represent a company or agency, you warrant and represent that you have
                    full legal authority to bind that entity to these Terms.
                  </li>
                  <li>
                    You are not prohibited from receiving services under United States, European
                    Union, or applicable local laws and trade sanctions.
                  </li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                If you do not agree with all of these Terms, you are expressly prohibited from using
                Aayeshol and must immediately cease use and disconnect any linked accounts.
              </p>
            </section>

            {/* Section 2 */}
            <section id="description-of-service" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <span>2. Description of Service</span>
              </h2>
              <p>
                Aayeshol v2 is a cloud-based multi-platform social media orchestration SaaS. Key
                platform capabilities include:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Social Integration Gateway:</strong> Authorization management for
                  third-party social networks including Meta (Instagram Business &amp; Creator,
                  Facebook Pages), Google YouTube, X (Twitter), and LinkedIn.
                </li>
                <li>
                  <strong>Automated Scheduling &amp; Publishing:</strong> Immediate dispatch and
                  delayed scheduling orchestrated by BullMQ job queues and Redis worker processes.
                </li>
                <li>
                  <strong>Cloud Media Streaming:</strong> Ingestion and direct binary streaming of
                  high-resolution images and videos directly from connected Google Drive
                  repositories to social platform endpoints without intermediate local caching.
                </li>
                <li>
                  <strong>AI Content Studio:</strong> Prompt-driven generation of tailored captions,
                  titles, and hashtag recommendations powered by the Google Gemini API.
                </li>
                <li>
                  <strong>Transactional Delivery Status:</strong> Real-time logging and dispatch
                  notifications transmitted via Resend.
                </li>
              </ul>
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-500 space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>Important Service Disclaimers:</span>
                </p>
                <p className="text-muted-foreground leading-normal">
                  Aayeshol does not guarantee specific post reach, engagement, impressions, or
                  algorithmic distribution on any social network. Aayeshol is an independent
                  automation platform and is not affiliated with, sponsored by, or endorsed by Meta
                  Platforms, Google LLC, X Corp., or LinkedIn Corporation.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="account-security" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <span>3. Accounts, Authentication &amp; Security</span>
              </h2>
              <p>
                To utilize the Service, you must register for an Aayeshol account. Authentication
                relies on our two-step numeric One-Time Password (OTP) verification architecture:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Credential Integrity:</strong> You must supply a valid, authentic email
                  address and create a strong password conforming to our system complexity rules
                  (minimum 8 characters, requiring uppercase, lowercase, numbers, and special
                  characters).
                </li>
                <li>
                  <strong>OTP Verification:</strong> Account creation, login, and password resets
                  issue time-limited numeric OTP challenges (TTL: 5–10 minutes) stored in volatile
                  Redis memory.
                </li>
                <li>
                  <strong>Session Security:</strong> Authenticated sessions issue short-lived JWT
                  access tokens (8-minute lifetime) and HTTP-only, secure, SameSite cookies for
                  refresh tokens (7-hour lifetime).
                </li>
                <li>
                  <strong>Prohibition on Account Sharing:</strong> Each account is designated for
                  single-operator or authorized agency team use. You may not resell, rent,
                  sublicense, or broker access to your Aayeshol authentication credentials.
                </li>
                <li>
                  <strong>Prompt Notification:</strong> You agree to immediately notify Aayeshol at{' '}
                  <a
                    href="mailto:Hello@nickdev.space"
                    className="font-mono text-foreground underline"
                  >
                    Hello@nickdev.space
                  </a>{' '}
                  if you discover or suspect unauthorized access or compromise of your account.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="social-integrations" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <span>4. Third-Party Social Platform Integrations &amp; OAuth Governance</span>
                <Badge
                  variant="outline"
                  className="text-[10px] border-emerald-500/30 text-emerald-500"
                >
                  Compliance Mandates
                </Badge>
              </h2>
              <p>
                Aayeshol connects to third-party social platforms through official developer APIs
                and OAuth 2.0 authorization protocols. By connecting your social accounts, you
                expressly acknowledge and agree to comply with the terms and policies of each
                respective provider:
              </p>

              <div className="space-y-4 pt-2">
                {/* Meta */}
                <div className="rounded-md border border-border/60 bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Share2 className="size-4 text-blue-500" />
                      <span>Meta Platforms (Instagram &amp; Facebook)</span>
                    </span>
                    <a
                      href="https://developers.facebook.com/terms/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <span>Meta Platform Terms</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You agree to adhere to Meta&apos;s Platform Terms, Developer Policies, and
                    Instagram Community Guidelines. You authorize Aayeshol to request only necessary
                    permissions (
                    <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">
                      instagram_basic
                    </code>
                    ,{' '}
                    <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">
                      instagram_content_publish
                    </code>
                    ,{' '}
                    <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">
                      pages_show_list
                    </code>
                    ,{' '}
                    <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">
                      pages_read_engagement
                    </code>
                    ) strictly to verify page identity and publish your scheduled media. You may
                    revoke access at any time through our Integrations dashboard or via
                    Facebook/Instagram Account Settings &gt; Apps and Websites.
                  </p>
                </div>

                {/* Google & YouTube */}
                <div className="rounded-md border border-border/60 bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Share2 className="size-4 text-red-500" />
                      <span>Google Services (YouTube &amp; Google Drive)</span>
                    </span>
                    <div className="flex items-center gap-3 text-xs">
                      <a
                        href="https://www.youtube.com/t/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        <span>YouTube Terms</span>
                        <ExternalLink className="size-3" />
                      </a>
                      <a
                        href="https://myaccount.google.com/permissions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        <span>Google Permissions</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    By connecting YouTube, you agree to be bound by the{' '}
                    <strong>YouTube Terms of Service</strong> and Google Privacy Policy. When
                    connecting Google Drive, you authorize Aayeshol to stream designated media files
                    directly to target social networks during scheduled jobs. Aayeshol strictly
                    adheres to the{' '}
                    <strong>
                      Google API Services User Data Policy, including Limited Use requirements
                    </strong>
                    . We do not transfer Google user data to third parties other than publishing
                    designated assets to your selected social platforms.
                  </p>
                </div>

                {/* X / Twitter */}
                <div className="rounded-md border border-border/60 bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Share2 className="size-4 text-foreground" />
                      <span>X (Twitter) Developer Policy</span>
                    </span>
                    <a
                      href="https://developer.x.com/en/developer-terms/agreement-and-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <span>X Developer Agreement</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    All publications dispatched to X must comply with X Rules and Automation
                    Policies. Automated scheduling must not be utilized for spam, aggressive
                    hashtags, mass unsolicited mentions, or artificial trend manipulation.
                  </p>
                </div>

                {/* LinkedIn */}
                <div className="rounded-md border border-border/60 bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Share2 className="size-4 text-sky-500" />
                      <span>LinkedIn API Agreement</span>
                    </span>
                    <a
                      href="https://legal.linkedin.com/api-terms-of-use"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <span>LinkedIn API Terms</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Publications to personal LinkedIn profiles or Organization Pages must respect
                    LinkedIn Professional Community Policies and Consumer Solutions Terms.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="acceptable-use" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <span>5. Acceptable Use Policy</span>
                <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-500">
                  Prohibited Activities
                </Badge>
              </h2>
              <p>
                You are strictly prohibited from using Aayeshol to engage in any activity that harms
                the platform, violates third-party rights, or circumvents social platform policies.
                You agree not to:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-1">
                  <span className="font-semibold text-foreground">
                    Prohibited Content &amp; Conduct
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                    <li>Publish illegal, defamatory, abusive, harassing, or hateful media.</li>
                    <li>Upload media depicting non-consensual imagery or child exploitation.</li>
                    <li>Conduct deceptive practices, phishing scams, or financial fraud.</li>
                    <li>Impersonate individuals or organizations without authorization.</li>
                  </ul>
                </div>
                <div className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-1">
                  <span className="font-semibold text-foreground">
                    Technical &amp; API Violations
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                    <li>Circumvent API rate limits, worker queues, or quota restrictions.</li>
                    <li>Reverse-engineer, decompile, or extract the Aayeshol source code.</li>
                    <li>Deploy scrapers, spiders, or automated bots against our API endpoints.</li>
                    <li>Inject malicious code, viruses, or corrupted payloads.</li>
                  </ul>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Violation of our Acceptable Use Policy results in immediate, permanent suspension of
                your account and revocation of all social connection tokens without refund.
              </p>
            </section>

            {/* Section 6 */}
            <section id="user-content-ownership" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <span>6. User Content &amp; Data Ownership</span>
                <Badge
                  variant="outline"
                  className="text-[10px] border-emerald-500/30 text-emerald-500"
                >
                  100% Customer Owned
                </Badge>
              </h2>
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs space-y-2">
                <p className="font-bold text-foreground text-sm">Your Content Belongs to You.</p>
                <p className="text-muted-foreground leading-relaxed">
                  Aayeshol claims <strong>no ownership</strong> over any text, captions, graphics,
                  photographs, audio tracks, videos, or files you create, ingest, or schedule
                  through our platform (&quot;<strong>User Content</strong>&quot;). You retain all
                  copyright, patent, trademark, and proprietary rights in your media.
                </p>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  <strong>Limited Operational License:</strong> Solely to provide the publishing
                  services requested by you, you grant Aayeshol a non-exclusive, worldwide,
                  royalty-free, limited license to access, ingest, buffer, transmit, reformat, and
                  publish your User Content to designated social platform endpoints. This license
                  terminates automatically when the post is published or deleted.
                </p>
                <p>
                  <strong>Content Warranties:</strong> You represent and warrant that you own or
                  have obtained all necessary licenses, permissions, and rights to upload and
                  distribute your User Content, and that publication will not infringe upon
                  third-party copyrights or trademarks.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="ai-assistant" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <span>7. AI Content Studio (Google Gemini API) Disclosures</span>
                <Badge
                  variant="outline"
                  className="text-[10px] border-purple-500/30 text-purple-500"
                >
                  AI Governance
                </Badge>
              </h2>
              <p>
                Aayeshol integrates with the Google Gemini API to offer an intelligent AI Assistant
                for drafting post captions, hashtag clusters, and publishing titles:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
                <li>
                  <strong>Input Prompts:</strong> Text prompts you submit to the AI Studio are
                  transmitted to Google Cloud exclusively to generate requested completions. We do
                  not use your private drafts to train foundational AI models.
                </li>
                <li>
                  <strong>Human-in-the-Loop Requirement:</strong> Generative AI models can produce
                  hallucinations, factual inaccuracies, or unintentional biases. You bear sole legal
                  responsibility for reading, verifying, fact-checking, and editing all AI-generated
                  content before scheduling or publishing it.
                </li>
                <li>
                  <strong>No Infringement Warranty:</strong> Aayeshol makes no representation or
                  warranty that AI-generated suggestions are free from third-party copyright claims
                  or trademark conflicts.
                </li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="intellectual-property" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <span>8. Intellectual Property Rights of Aayeshol</span>
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Except for User Content, the Aayeshol platform—including our proprietary source
                code, software architecture, UI design system, database schemas, BullMQ queue
                dispatch orchestration, API adapters, brand logos, and documentation—is the
                exclusive intellectual property of Aayeshol Inc. and is protected by United States
                and international copyright, trademark, and trade secret laws. We grant you a
                limited, non-exclusive, non-transferable, revocable license to access the web
                application in accordance with your plan.
              </p>
            </section>

            {/* Section 9 */}
            <section id="billing-subscriptions" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <span>9. Billing, Subscriptions &amp; Usage Quotas</span>
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
                <li>
                  <strong>Subscription Cycles:</strong> Paid tiers (if applicable) are billed in
                  advance on a recurring monthly or annual basis.
                </li>
                <li>
                  <strong>Usage Quotas:</strong> Accounts are subject to monthly publication quotas
                  and connected social account limits based on tier. Excessive API usage exceeding
                  fair usage thresholds may be temporarily throttled.
                </li>
                <li>
                  <strong>Cancellation &amp; Refunds:</strong> You may cancel your subscription at
                  any time via Account Settings. Access continues through the end of the paid
                  billing period. Fees paid are non-refundable except where mandated by applicable
                  consumer protection laws.
                </li>
                <li>
                  <strong>Price Changes:</strong> We reserve the right to revise pricing upon 30
                  days prior notice communicated via email or dashboard notification.
                </li>
              </ul>
            </section>

            {/* Section 10 */}
            <section id="availability-slas" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <span>10. Service Availability, Maintenance &amp; API Limitations</span>
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                While we strive for 99.9% uptime, Aayeshol is provided on an &quot;AS IS&quot; and
                &quot;AS AVAILABLE&quot; basis. We do not warrant that service will be
                uninterrupted, error-free, or completely immune to downtime. Factors beyond our
                reasonable control include:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                <li>Third-party social network API outages or sudden endpoint deprecations.</li>
                <li>
                  Temporary rate-limiting or account locks imposed directly by Meta, YouTube, X, or
                  LinkedIn on user accounts.
                </li>
                <li>
                  Scheduled infrastructure maintenance windows (announced in advance when possible).
                </li>
                <li>
                  Force majeure events including ISP failures, cyberattacks, or cloud provider
                  disruptions.
                </li>
              </ul>
            </section>

            {/* Section 11 */}
            <section id="limitation-of-liability" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <span>11. Limitation of Liability</span>
                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500">
                  Read Carefully
                </Badge>
              </h2>
              <div className="rounded-md border border-border/60 bg-muted/20 p-4 space-y-2 text-xs">
                <p className="font-semibold text-foreground uppercase tracking-wide">
                  Disclaimer of Consequential Damages &amp; Maximum Liability Cap:
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL AAYESHOL
                  INC., ITS DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR
                  ANY INDIRECT, CONSEQUENTIAL, INCIDENTAL, SPECIAL, PUNITIVE, OR EXEMPLARY DAMAGES,
                  INCLUDING LOST PROFITS, LOST REVENUE, LOSS OF DATA, SOCIAL ACCOUNT RESTRICTION,
                  LOSS OF GOODWILL, OR BUSINESS INTERRUPTION ARISING FROM YOUR USE OF THE SERVICE,
                  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  OUR TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR
                  USE OF AAYESHOL SHALL IN NO EVENT EXCEED THE TOTAL AMOUNT ACTUALLY PAID BY YOU TO
                  AAYESHOL IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR FIFTY UNITED STATES
                  DOLLARS ($50.00 USD), WHICHEVER IS GREATER.
                </p>
              </div>
            </section>

            {/* Section 12 */}
            <section id="indemnification" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <span>12. Indemnification</span>
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You agree to defend, indemnify, and hold harmless Aayeshol Inc., its officers,
                directors, employees, and agents from and against any claims, liabilities, damages,
                losses, and expenses (including reasonable attorneys&apos; fees) arising out of or
                in any way connected with: (a) your access to or use of the Service; (b) your User
                Content, including claims of copyright infringement or defamation; (c) your
                violation of these Terms; or (d) your violation of any third-party social media
                developer policy or platform terms.
              </p>
            </section>

            {/* Section 13 */}
            <section id="termination" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <span>13. Account Termination &amp; OAuth Token Eviction</span>
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
                <li>
                  <strong>Termination by You:</strong> You may terminate your account at any time
                  via Account Settings or by contacting{' '}
                  <a
                    href="mailto:Hello@nickdev.space"
                    className="font-mono text-foreground underline"
                  >
                    Hello@nickdev.space
                  </a>
                  .
                </li>
                <li>
                  <strong>Immediate Token Purge:</strong> When you disconnect an integration in{' '}
                  <Link href="/dashboard/integrations" className="text-foreground underline">
                    /dashboard/integrations
                  </Link>{' '}
                  or close your account, all associated encrypted OAuth access tokens, refresh
                  tokens, and cache keys are immediately and permanently evicted from PostgreSQL and
                  Redis.
                </li>
                <li>
                  <strong>Termination by Us:</strong> We may terminate or suspend your access
                  immediately without notice if you materially breach these Terms or create legal or
                  operational risk.
                </li>
                <li>
                  <strong>Survival:</strong> Sections 6, 8, 11, 12, 14, and 16 shall survive
                  termination of these Terms.
                </li>
              </ul>
            </section>

            {/* Section 14 */}
            <section id="dispute-resolution" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <span>14. Dispute Resolution &amp; Governing Law</span>
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                These Terms and any disputes arising out of or related hereto shall be governed by
                and construed in accordance with the laws of the State of Delaware, United States,
                without regard to its conflict of law principles. Any dispute, claim, or controversy
                that cannot be resolved through informal negotiations within thirty (30) days shall
                be settled by binding arbitration in accordance with the Commercial Arbitration
                Rules of the American Arbitration Association (AAA). You agree that any arbitration
                or proceeding shall be conducted solely on an individual basis and not as a class
                action or representative proceeding.
              </p>
            </section>

            {/* Section 15 */}
            <section id="modifications" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <span>15. Modifications to Terms</span>
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We may revise these Terms from time to time to reflect changes in our service,
                security practices, or regulatory requirements. When material changes are made, we
                will provide at least thirty (30) days advance notice via email or a prominent
                banner in your dashboard prior to the changes taking effect. Your continued use of
                Aayeshol after the effective date of the revised Terms constitutes your acceptance.
              </p>
            </section>

            {/* Section 16 */}
            <section id="contact" className="scroll-mt-24 space-y-4">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <span>16. Contact Information &amp; Legal Notices</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                For questions regarding these Terms of Service or to submit formal legal inquiries,
                please contact our legal team:
              </p>
              <div className="rounded-md border border-border/60 bg-card p-4 space-y-2 text-xs">
                <p>
                  <strong>Aayeshol Legal & Privacy Office</strong>
                </p>
                <p>
                  Privacy & Support:{' '}
                  <a
                    href="mailto:Hello@nickdev.space"
                    className="font-mono text-foreground underline"
                  >
                    Hello@nickdev.space
                  </a>
                </p>
                <p>Response Timeframe: Within 24–48 business hours</p>
              </div>
            </section>
          </article>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
