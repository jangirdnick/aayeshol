# Aayeshol v2 Frontend - AI Engineering Instructions & Architecture

This document serves as the dedicated engineering manual and AI coding agent instruction file for **`apps/web`**. All AI agents and developers working on the frontend MUST read and strictly adhere to the guidelines, architecture, and principles defined here in conjunction with the root `GEMINI.md`.

---

## 1. Frontend Overview & Mission

`apps/web` is the user-facing web application of the Aayeshol v2 platform. It delivers a fast, responsive, and aesthetically stunning interface for managing multi-platform social media campaigns, connecting accounts, drafting AI-assisted posts with Gemini, previewing media from Google Drive, and scheduling background publication.

### Core Frontend Responsibilities:

- **Authentication Views**: High-conversion, accessible UI for 2-step OTP registration, login, forgot password, and session handling.
- **Account & Social Management**: OAuth connection dashboards for LinkedIn, X (Twitter), Instagram/Meta, and YouTube.
- **AI Content Studio**: Interactive Gemini prompt studio for platform-specific captions, hashtags, and media previews.
- **Post Composer & Scheduler**: Multi-platform post creator with interactive date/time picker, character counters, and preview cards.
- **Publishing Analytics & History**: Real-time status badges (`SCHEDULED`, `PUBLISHED`, `FAILED`) and job history.

---

## 2. Directory Structure & Key Files

The frontend application is built using the **Next.js 16 App Router** in `apps/web`:

```text
apps/web/
├── app/                          # Next.js App Router root directory
│   ├── layout.tsx                # Root layout (fonts, providers, metadata, HTML shell)
│   ├── page.tsx                  # Root landing / dashboard home view
│   ├── globals.css               # Tailwind CSS v4 @theme inline & shadcn tokens
│   └── account/                  # Authentication & account management routes
│       └── login/                # 2-step OTP login view
├── components/                   # UI components
│   └── ui/                       # shadcn/ui components (button, card, input, etc.)
├── lib/                          # Utility functions
│   └── utils.ts                  # Shared cn() class-merging helper
├── public/                       # Static public assets
├── .agents/                      # Curated frontend AI agent skills
│   └── skills/
│       ├── design-system/        # Token architecture, component specs & design system
│       ├── nextjs-best-practices/# Server vs Client components & App Router guidance
│       ├── shadcn/               # Official shadcn CLI, component composition & rules
│       ├── tanstack-query/       # React Query v5 caching & optimistic mutations
│       ├── ui-ux-pro-max/        # Design intelligence, palettes & accessibility
│       └── zod/                  # Zod v4 schema validation & type inference
├── components.json               # shadcn/ui CLI configuration file
├── postcss.config.mjs            # PostCSS configuration with @tailwindcss/postcss
├── tsconfig.json                 # TypeScript configuration with @/* import alias
├── package.json                  # Next.js 16, React 19 & dependencies
└── GEMINI.md                     # This frontend manual
```

---

## 3. Technology Stack & Key Dependencies

- **Framework**: Next.js 16 (with Turbopack and React Server Components).
- **Core Library**: React 19 (`react`, `react-dom`).
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`, `postcss`, `tw-animate-css`).
- **Component Primitives**: shadcn/ui (`base-nova` style, Base UI `@base-ui/react`, `cva`, `lucide-react`).
- **Server State & Caching**: `@tanstack/react-query` v5 (`QueryClient`, `useQuery`, `useMutation`).
- **Schema Validation**: `zod` v4 (`z.object`, `safeParse`, `z.infer`).
- **Shared Workspace Library**: `@aayeshol/types` (imported as `workspace:*`).

---

## 4. Styling System & shadcn/ui Best Practices

The styling architecture uses **Tailwind CSS v4** with a CSS-first token configuration in `app/globals.css`.

### A. Critical CSS Cascade Rule (No Unlayered Resets)

In CSS Cascading Level 5, **unlayered CSS rules take precedence over all `@layer` rules**. Because Tailwind v4 utilities (`px-4`, `py-2`, `gap-3`) are defined inside `@layer utilities`:

- **NEVER** write global unlayered element resets such as `* { padding: 0; margin: 0; }` or `* { box-sizing: border-box; }` outside a layer. Doing so immediately overrides and breaks padding/margin on buttons, cards, and inputs.
- All base modifications must go inside `@layer base { ... }` or rely on Tailwind's built-in preflight.

### B. Theme Tokens & Semantic Colors

`app/globals.css` declares theme variables using OKLCH color spaces:

- `--background`, `--foreground`: Base canvas and high-contrast text.
- `--primary`, `--primary-foreground`: Primary action elements (buttons, active states).
- `--secondary`, `--secondary-foreground`: Secondary interactive elements.
- `--card`, `--card-foreground`: Elevated card surfaces.
- `--muted`, `--muted-foreground`: Subdued backgrounds and helper text.
- `--accent`, `--accent-foreground`: Highlighted hover surfaces.
- `--destructive`: Destructive actions and error messages.
- `--border`, `--input`, `--ring`: Element borders and focus rings.

**Rule**: Never hardcode hex values like `#3b82f6` or raw tailwind color classes like `bg-blue-500` in UI components. Always use semantic classes: `bg-primary`, `text-muted-foreground`, `border-border`.

### C. Layout & Composition Standards (shadcn Rules)

1. **Spacing**: Use `flex flex-col gap-4` or `grid gap-4`. Do not use deprecated `space-y-*` or `space-x-*`.
2. **Dimensions**: Use `size-*` for equal dimensions (`size-8` instead of `w-8 h-8`).
3. **Card Composition**: Always compose structured cards using `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`.
4. **Buttons**: Never create custom styled `<button>` tags when `Button` from `@/components/ui/button` is available. Pass icons using `data-icon="inline-start"` or `data-icon="inline-end"`.
5. **Class Merging**: Always merge conditional classes with `cn(...)` from `@/lib/utils`.

---

## 5. Next.js 16 Architectural Conventions

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
- **Route Groups**: Organize routes with parenthesis notation like `(auth)` or `(dashboard)` to structure layouts without altering URLs.
- **Metadata**: Define typed `export const metadata: Metadata = { title, description }` on pages for SEO.

---

## 6. Server State Management (TanStack Query v5)

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

### Query & Mutation Pattern

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiResponse, PostDto } from '@aayeshol/types';

export function useScheduledPosts() {
  return useQuery({
    queryKey: ['posts', { status: 'SCHEDULED' }],
    queryFn: async (): Promise<PostDto[]> => {
      const res = await fetch('/api/posts?status=SCHEDULED');
      if (!res.ok) throw new Error('Failed to fetch scheduled posts');
      const json: ApiResponse<PostDto[]> = await res.json();
      return json.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
```

---

## 7. Form Handling & Schema Validation (Zod v4)

Every user input must be validated at the system boundary using Zod:

```tsx
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

- Always use `schema.safeParse(data)` before dispatching API mutations.
- Export both the Zod schema and its inferred TypeScript type (`z.infer`).
- Map validation errors directly to accessible form field helpers.

---

## 8. Frontend Agent Skills (`apps/web/.agents/skills`)

The frontend workspace contains 6 specialized agent skills. AI agents working on `apps/web` must check and follow these skills:

| Skill Name                  | Path                                            | Domain & Purpose                                                                                  | When to Use (Triggers)                                                                                  |
| --------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **`shadcn`**                | `apps/web/.agents/skills/shadcn`                | Official shadcn CLI, component composition, form rules, styling patterns, preset management       | Adding/editing UI components (`Button`, `Card`, `Dialog`), running `shadcn add`, styling, design tokens |
| **`nextjs-best-practices`** | `apps/web/.agents/skills/nextjs-best-practices` | Next.js App Router rules, Server vs Client split, routing, caching, metadata, bundle optimization | Creating new routes, layouts, server components, data fetching strategies, loading/error states         |
| **`tanstack-query`**        | `apps/web/.agents/skills/tanstack-query`        | React Query v5 server-state caching, optimistic updates, query keys, hydration                    | Fetching API data, cache invalidation, polling scheduled posts, mutations                               |
| **`zod`**                   | `apps/web/.agents/skills/zod`                   | Zod v4 schemas, parsing, type inference, safeParse, error handling                                | Writing form validation, API response validation, request payloads                                      |
| **`ui-ux-pro-max`**         | `apps/web/.agents/skills/ui-ux-pro-max`         | Design intelligence, color harmony, typography pairings, UX accessibility guidelines              | Designing new pages, reviewing UI quality, contrast verification, responsive layout                     |
| **`design-system`**         | `apps/web/.agents/skills/design-system`         | Three-layer token architecture (primitive → semantic → component), CSS variables, component specs | Modifying global design tokens, spacing scales, theme variables                                         |

---

## 9. Application & Skills Collaboration Workflow

When implementing frontend features, follow this 8-step workflow:

```text
1. Identify Task Scope (e.g. Account Login view in apps/web)
       ↓
2. Read apps/web/GEMINI.md for architectural patterns
       ↓
3. Match Applicable Skills:
   - UI structure & layout → `ui-ux-pro-max` & `shadcn`
   - Route layout & Client/Server split → `nextjs-best-practices`
   - Form validation → `zod`
   - API data submission → `tanstack-query`
       ↓
4. Read the corresponding SKILL.md and reference docs
       ↓
5. Inspect Existing Implementations (check components/ui/ and @aayeshol/types)
       ↓
6. Implement modularly following conventions:
   - Reuse shadcn components (Button, Input, Card)
   - Use semantic color tokens (bg-background, text-foreground)
   - Enforce type safety (no any)
       ↓
7. Validate:
   - pnpm --filter web check-types
   - pnpm --filter web lint
   - pnpm format
       ↓
8. Verify UI rendering and report results
```

---

## 10. Concrete Implementation Examples

### Example 1: Implementing a Login Feature

- **Step 1**: Read `apps/web/GEMINI.md` and `apps/web/.agents/skills/shadcn/SKILL.md`.
- **Step 2**: Create the Zod validation schema in `login.schema.ts` with `email` and `password`.
- **Step 3**: Check installed components in `components/ui/` (`button`, `card`, `input`). If any are missing, install them via `pnpm dlx shadcn@latest add <component>`.
- **Step 4**: Construct the view in `app/account/login/page.tsx` composing `Card`, `Input`, and `Button` using semantic tokens and `cn()`.
- **Step 5**: Hook form submission into TanStack Query mutation calling the backend OTP challenge endpoint.

### Example 2: Consuming Shared Types

- Reference types directly from `@aayeshol/types`:
  ```tsx
  import type { ApiResponse, UserSessionDto } from '@aayeshol/types';
  ```
- Ensure any new shared DTO is added to `packages/types/src/` and built before using in `apps/web`.

---

## 11. Definition of Done for Frontend Tasks

A frontend change is complete only when:

- It uses Server Components by default, marking `"use client"` only where interactivity is required.
- All styles use Tailwind CSS v4 semantic tokens without unlayered global CSS resets.
- UI elements compose official shadcn components rather than ad-hoc styled divs.
- Form inputs are validated with Zod schemas using `safeParse`.
- Server state is managed via TanStack Query with structured query keys.
- Types are strict with zero `any` usage.
- `pnpm --filter web check-types` passes with zero errors.
- `pnpm lint` and `pnpm format` pass cleanly.
