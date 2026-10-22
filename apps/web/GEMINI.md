# Aayeshol v2 Frontend - AI Engineering Instructions & Architecture

This document serves as the dedicated engineering manual and AI coding agent instruction file for **`apps/web`**. All AI agents and developers working on the frontend MUST read and strictly adhere to the guidelines, architecture, and principles defined here in conjunction with the root `GEMINI.md`.

---

## 1. Frontend Overview & Mission

`apps/web` is the user-facing web application of the Aayeshol v2 platform. It delivers a fast, responsive, and aesthetically stunning interface for managing multi-platform social media campaigns, connecting accounts, drafting AI-assisted posts with Gemini, previewing media from Google Drive, and scheduling background publication.

### Core Frontend Responsibilities:

- **Authentication Views**: High-conversion, accessible UI for 2-step OTP registration, login, forgot password, and session handling (`modular/account`).
- **Dashboard Shell & Layout**: Fully responsive desktop sticky sidebar and mobile drawer with brand controls, user profile card, divider borders, and light/dark theme switch (`modular/dashboard`).
- **AI Content Studio**: Interactive Gemini prompt studio for platform-specific captions, hashtags, and media previews (`/dashboard/ai-studio`).
- **Publishing Calendar & Pipeline**: Calendar view for delayed publication jobs managed by BullMQ (`/dashboard/calendar`).
- **Asset Library**: High-capacity media browser streaming assets directly from Google Drive (`/dashboard/assets`).
- **Account & Social Integrations**: OAuth connection dashboards for LinkedIn, X (Twitter), Instagram/Meta, and YouTube (`/dashboard/integrations`).
- **Settings & User Preferences**: Dedicated panel for profile details, credentials, and app preferences (`/dashboard/settings`).

---

## 2. Directory Structure & Key Files

The frontend application uses **Next.js 16 App Router** with a **modular domain-driven structure**:

```text
apps/web/
├── app/                              # Next.js 16 App Router directory
│   ├── layout.tsx                    # Root HTML shell, fonts, providers, SEO metadata
│   ├── page.tsx                      # Root landing page (redirects to /account/login)
│   ├── providers.tsx                 # Client QueryClientProvider and ThemeProvider wrapper
│   ├── globals.css                   # Tailwind CSS v4 @theme inline & shadcn OKLCH tokens
│   ├── account/                      # Auth routes (GuestGuard protected)
│   │   ├── layout.tsx                # Auth layout wrapper
│   │   ├── login/page.tsx            # 2-step OTP login view
│   │   ├── forgot-password/page.tsx  # Forgot password OTP challenge view
│   │   └── reset-password/page.tsx   # Reset password with OTP confirmation view
│   └── dashboard/                    # Dashboard routes (AuthGuard requiredRoles=['ADMIN'])
│       ├── layout.tsx                # Mounts AuthGuard and DashboardShell
│       ├── page.tsx                  # Dashboard overview & real-time metrics cards
│       ├── ai-studio/page.tsx        # Gemini AI prompt & caption studio
│       ├── calendar/page.tsx         # Publication calendar & timeline view
│       ├── assets/page.tsx           # Google Drive streaming media library
│       ├── integrations/page.tsx     # Social accounts OAuth connection panel
│       └── settings/page.tsx         # Account preferences & security settings
├── modular/                          # Domain-driven modular feature architecture
│   ├── account/                      # Authentication domain module
│   │   ├── api/                      # Auth API service client
│   │   ├── components/               # Auth form fields, OTP verification & layouts
│   │   ├── hooks/                    # TanStack Query auth mutations & current user query
│   │   ├── providers/                # AuthProvider, AuthGuard, GuestGuard
│   │   ├── schemas/                  # Zod v4 validation schemas (login, OTP, reset)
│   │   ├── store/                    # Zustand auth store & token management
│   │   ├── types/                    # Auth contract & form types
│   │   ├── utils/                    # Regex validators and error mappers
│   │   └── index.ts                  # Public module barrel export
│   └── dashboard/                    # Dashboard feature domain module
│       ├── components/               # Dashboard layout components
│       │   ├── sidebar/              # Tightly coupled sidebar subcomponents
│       │   │   ├── Sidebar.tsx            # Main composite Sidebar component
│       │   │   ├── SidebarHeader.tsx      # Logo + collapse/expand control
│       │   │   ├── SidebarUserProfile.tsx # User avatar, initials, role subtitle & trigger
│       │   │   ├── SidebarProfileMenu.tsx # Lazy-loaded profile dropdown menu
│       │   │   ├── SidebarNav.tsx         # Nav items list with dividers & active states
│       │   │   └── SidebarThemeToggle.tsx # Bottom switch-style light/dark toggle
│       │   ├── DashboardShell.tsx    # Responsive shell (desktop sidebar + mobile drawer)
│       │   └── index.ts              # Components barrel export
│       ├── constants/                # Navigation items and localStorage keys
│       │   ├── navigation.constants.ts
│       │   └── index.ts
│       ├── hooks/                    # Dashboard hooks (useSidebarCollapse)
│       │   ├── useSidebarCollapse.ts
│       │   └── index.ts
│       ├── types/                    # Navigation and shell TypeScript interfaces
│       │   ├── navigation.types.ts
│       │   └── index.ts
│       └── index.ts                  # Public module barrel export
├── components/                       # Shared design system UI components
│   ├── mode-toggle.tsx               # Standalone theme icon button toggle
│   ├── theme-provider.tsx            # Application-wide ThemeProvider & useTheme hook
│   └── ui/                           # shadcn / Base UI primitives
│       ├── avatar.tsx                # Avatar, AvatarImage, AvatarFallback (@base-ui/react)
│       ├── button.tsx                # Button with cva variants (@base-ui/react)
│       ├── card.tsx                  # Card, CardHeader, CardTitle, CardContent, CardFooter
│       ├── dropdown-menu.tsx         # DropdownMenu primitives (@base-ui/react/menu)
│       ├── input.tsx                 # Accessible input field (@base-ui/react/input)
│       ├── input-otp.tsx             # One-time-password segmented input (input-otp)
│       ├── switch.tsx                # Switch toggle with thumb (@base-ui/react/switch)
│       └── tooltip.tsx               # Tooltip popup with portal (@base-ui/react/tooltip)
├── lib/                              # Shared frontend utilities
│   ├── query.ts                      # QueryClient configuration & cache invalidation
│   └── utils.ts                      # Shared cn() class-merging helper
├── public/                           # Static public assets
│   ├── aayeshol-logo.png             # Official brand logo glyph (used in side nav)
│   ├── application-side-nav.jpg      # Official UI/UX reference design for dashboard side nav
│   └── favicon.ico                   # Browser tab icon
├── .agents/skills/                   # Curated frontend AI agent skills
│   ├── design-system/                # Token architecture, component specs & design system
│   ├── nextjs-best-practices/        # Server vs Client components & App Router guidance
│   ├── shadcn/                       # Official shadcn CLI, component composition & rules
│   ├── tanstack-query/               # React Query v5 caching & optimistic mutations
│   ├── ui-ux-pro-max/                # Design intelligence, palettes & accessibility
│   └── zod/                          # Zod v4 schema validation & type inference
├── components.json                   # shadcn/ui configuration (base-nova, Base UI)
├── postcss.config.mjs                # PostCSS configuration with @tailwindcss/postcss
├── tsconfig.json                     # TypeScript configuration with @/* import alias
├── package.json                      # Next.js 16, React 19 & dependencies
└── GEMINI.md                         # This frontend manual
```

---

## 3. Technology Stack & Key Dependencies

- **Framework**: Next.js 16 (with Turbopack and React Server Components).
- **Core Library**: React 19 (`react`, `react-dom`).
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`, `postcss`, `tw-animate-css`).
- **Component Primitives**: shadcn/ui (`base-nova` style, Base UI `@base-ui/react`, `cva`, `lucide-react`).
- **Server State & Caching**: `@tanstack/react-query` v5 (`QueryClient`, `useQuery`, `useMutation`).
- **Schema Validation**: `zod` v4 (`z.object`, `safeParse`, `z.infer`).
- **Client State**: `zustand` v5 (in-memory auth session cache).
- **Shared Workspace Library**: `@aayeshol/types` (imported as `workspace:*`).

---

## 4. Styling System, OKLCH Tokens & Brand Rules

The styling architecture uses **Tailwind CSS v4** with a CSS-first token configuration in `app/globals.css`.

### A. Critical CSS Cascade Rule (No Unlayered Resets)

In CSS Cascading Level 5, **unlayered CSS rules take precedence over all `@layer` rules**:

- **NEVER** write global unlayered element resets such as `* { padding: 0; margin: 0; }` or `* { box-sizing: border-box; }` outside a layer. Doing so immediately overrides and breaks padding/margin on buttons, cards, and inputs.
- All base modifications must go inside `@layer base { ... }` or rely on Tailwind's built-in preflight.

### B. Pure Pitch Black Background in Dark Mode

Dark mode canvas is configured to solid pitch black **`#000000`** to match high-end OLED aesthetics:

```css
.dark {
  color-scheme: dark;
  --background: oklch(0 0 0); /* Pure #000000 */
  --foreground: oklch(0.985 0 0);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  ...
}
```

- In dark mode, canvas uses `--background` (`oklch(0 0 0)`). Elevated surfaces (cards, sidebars) use subtle OKLCH elevations (`--card`, `--sidebar-accent`) with border delimiters (`border-border`, `border-sidebar-border`).

### C. Layout & Composition Standards

1. **Spacing**: Use `flex flex-col gap-4` or `grid gap-4`. Do not use deprecated `space-y-*` or `space-x-*`.
2. **Dimensions**: Use `size-*` for equal dimensions (`size-8` instead of `w-8 h-8`).
3. **Card Composition**: Always compose structured cards using `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`.
4. **Buttons**: Never create custom styled `<button>` tags when `Button` from `@/components/ui/button` is available.
5. **Class Merging**: Always merge conditional classes with `cn(...)` from `@/lib/utils`.

---

## 5. Domain-Driven Modular Pattern (`modular/`)

All major business domains live in dedicated directories under `apps/web/modular/<domain>/`.

### Architecture Guidelines for Modular Domains:

1. **Subdirectory Structure**:
   - `components/`: UI components exclusive to this feature. If components are tightly coupled to a parent (e.g. `SidebarHeader`, `SidebarNav` inside `Sidebar`), group them in a dedicated subfolder (`components/sidebar/`).
   - `hooks/`: Domain-specific React hooks (e.g. `useSidebarCollapse`, `useLoginMutation`).
   - `constants/`: Configuration tables, navigation menus, and storage keys.
   - `types/`: Strict TypeScript interfaces and types for the domain.
   - `api/`: API service clients wrapping HTTP calls.
   - `index.ts`: The domain barrel export defining the public interface.
2. **Client Component Encapsulation**: Keep interactive logic (`'use client'`) encapsulated inside modular components, allowing Next.js server components in `app/` to import them seamlessly.
3. **Bundle Optimization & Lazy Loading**:
   - Non-critical or conditionally opened interactive components (such as `SidebarProfileMenu` dropdown content) should be loaded on-demand via `next/dynamic` (`{ ssr: false }`) or `React.lazy` to keep the initial client bundle minimal.
4. **Clean Import Paths**: Always import domain features via `@/modular/<domain>`, e.g.:
   ```tsx
   import { DashboardShell } from '@/modular/dashboard';
   import { AuthGuard, useAuth } from '@/modular/account';
   ```

---

## 6. Next.js 16 Architectural Conventions

### Server vs. Client Components Decision Tree

```text
Does the component require:
├── Interactive event handlers (onClick, onChange)?
├── React hooks (useState, useEffect, useMemo, useRef)?
├── Browser-only APIs (localStorage, window, document)?
├── TanStack Query hooks (useQuery, useMutation)?
│   └── YES → Mark with 'use client' at the top of the file
│
└── NO → Leave as React Server Component (Default)
    └── Layouts, static headers, page wrappers, SEO metadata
```

- **Keep client boundaries at the leaves**: Wrap interactive widgets in client components while keeping their parents as Server Components.
- **Route Guards**: `AuthGuard` in `app/dashboard/layout.tsx` guarantees that only authenticated users with required roles can render dashboard pages.

---

## 7. Server State Management (TanStack Query v5)

TanStack Query governs all communication with the backend API.

### Query Key Conventions

Query keys must be hierarchical, serializable arrays:

```tsx
[
  'posts',
] // All posts list
[
  ('posts', { status: 'SCHEDULED' })
] // Filtered posts
[
  ('posts', postId)
] // Single post detail
[('user', 'profile')]; // Authenticated user profile
```

---

## 8. Frontend Agent Skills (`apps/web/.agents/skills`)

The frontend workspace contains 6 specialized agent skills. AI agents working on `apps/web` must inspect and follow these skills:

| Skill Name                  | Path                                            | Domain & Purpose                                                                                  | When to Use (Triggers)                                                                                   |
| --------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **`shadcn`**                | `apps/web/.agents/skills/shadcn`                | Official shadcn CLI, Base UI primitives composition, preset management                            | Adding/editing UI components (`Button`, `Card`, `Dialog`, `DropdownMenu`), running `shadcn add`, styling |
| **`nextjs-best-practices`** | `apps/web/.agents/skills/nextjs-best-practices` | Next.js App Router rules, Server vs Client split, routing, caching, metadata, bundle optimization | Creating new routes, layouts, server components, data fetching strategies, loading/error states          |
| **`tanstack-query`**        | `apps/web/.agents/skills/tanstack-query`        | React Query v5 server-state caching, optimistic updates, query keys, hydration                    | Fetching API data, cache invalidation, polling scheduled posts, mutations                                |
| **`zod`**                   | `apps/web/.agents/skills/zod`                   | Zod v4 schemas, parsing, type inference, safeParse, error handling                                | Writing form validation, API response validation, request payloads                                       |
| **`ui-ux-pro-max`**         | `apps/web/.agents/skills/ui-ux-pro-max`         | Design intelligence, color harmony, typography pairings, UX accessibility guidelines              | Designing new pages, reviewing UI quality, contrast verification, responsive layout                      |
| **`design-system`**         | `apps/web/.agents/skills/design-system`         | Three-layer token architecture (primitive → semantic → component), CSS variables, component specs | Modifying global design tokens, spacing scales, theme variables                                          |

---

## 9. Definition of Done for Frontend Tasks

A frontend change is complete only when:

- It uses Server Components by default, marking `"use client"` only where interactivity is required.
- All styles use Tailwind CSS v4 semantic tokens without unlayered global CSS resets.
- Dark mode canvas adheres to `--background: oklch(0 0 0)` (#000000).
- Modular domains strictly follow the `modular/<domain>/` directory standard with public exports in `index.ts`.
- UI elements compose official shadcn / Base UI components rather than ad-hoc styled divs.
- Form inputs are validated with Zod schemas using `safeParse`.
- Server state is managed via TanStack Query with structured query keys.
- Types are strict with zero `any` usage.
- `pnpm --filter web check-types` passes with zero errors.
- `pnpm lint` and `pnpm format` pass cleanly.
