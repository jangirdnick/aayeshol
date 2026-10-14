# Aayeshol v2 - AI Engineering Instructions & Monorepo Architecture

This document serves as the primary repository-wide engineering manual and AI coding agent instruction file for **Aayeshol v2**. All AI agents and developers working across this monorepo MUST read and strictly adhere to the guidelines, architecture, and principles defined here.

---

## 1. Project Overview & Purpose

**Aayeshol v2** is an advanced, AI-powered, multi-platform social media management and scheduling SaaS. Its mission is to automate and streamline the repetitive workflows involved in daily social media publishing:

- **Authentication**: Advanced 2-step OTP flow (Registration, Login, Password Reset) using short-lived JWT access tokens (8m), HTTP-only cookie-based refresh tokens (7h), UUIDv4 challenge IDs, and Redis-backed session caching with PostgreSQL fallback. Enforces strict regex validation for credentials.
- **Social Integrations**: Secure linking of social accounts (LinkedIn, X / Twitter, Meta / Instagram, YouTube) via isolated OAuth/API adapter strategies.
- **Media Ingestion**: Google Drive integration acting as a high-capacity media source, streaming large image and video assets directly to background workers without overloading memory.
- **AI Content Assistant**: Integration with the Gemini API to generate platform-tailored post captions, hashtags, and titles from user prompts.
- **Publishing & Scheduling**: Direct immediate publishing or delayed scheduling via BullMQ and Redis.
- **Automated Delivery Engine**: Reliable background workers executing scheduled publications, handling retry logic, exponential backoff, rate limits, and failure recovery.
- **Transactional Notifications**: Real-time email notifications (via Resend) alerting users of publication successes or failures.

---

## 2. Monorepo Structure & Workspace Responsibilities

This repository is structured as a TypeScript monorepo orchestrated with **Turborepo** and **pnpm workspaces**:

```text
aayeshol/
├── apps/
│   ├── api/                  # NestJS 11 Backend API & Background Workers
│   │   ├── src/              # Application source (auth, social, infrastructure, prisma)
│   │   ├── prisma/           # Prisma 7 schema and migration files
│   │   ├── .agents/skills/   # Backend Prisma and database agent skills
│   │   └── GEMINI.md         # Dedicated Backend Architecture Guide
│   └── web/                  # Next.js 16 Frontend Application (App Router, React 19)
│       ├── app/              # App Router routes, layouts, and page views
│       ├── components/ui/    # shadcn/ui components (Base UI primitives)
│       ├── lib/              # Shared frontend utilities (cn helper)
│       ├── .agents/skills/   # Frontend agent skills (shadcn, nextjs, tanstack-query, zod, etc.)
│       └── GEMINI.md         # Dedicated Frontend Architecture Guide
├── packages/
│   └── types/                # @aayeshol/types: Shared TypeScript types, DTOs & API response contracts
├── .husky/                   # Git pre-commit hooks (lint-staged)
├── .gitignore                # Global monorepo git ignore rules
├── package.json              # Root package metadata & turbo scripts
├── pnpm-workspace.yaml       # Workspace declarations & dependency catalogs
├── turbo.json                # Turborepo task pipelines & cache configurations
└── GEMINI.md                 # Root AI Engineering Manual (this file)
```

### Workspace Responsibilities

1. **`apps/api` (Backend)**:
   - Houses the core business logic, database queries, and background processes.
   - Built on **NestJS 11** with Fastify/Express under the hood.
   - Manages Prisma 7 ORM connecting to **PostgreSQL** via `@prisma/adapter-pg`.
   - Manages **Redis** for temporary OTP challenge storage, session caching, and **BullMQ** job queues.
   - Executes background workers for scheduling social publishing and sending emails via **Resend**.

2. **`apps/web` (Frontend)**:
   - Delivers the user-facing web interface and dashboard.
   - Built on **Next.js 16** with React 19 and the App Router.
   - Styled with **Tailwind CSS v4** utilizing `@theme inline`, OKLCH color tokens, and **shadcn/ui** (Base UI primitives + Lucide icons).
   - Manages server state using **@tanstack/react-query v5** and client-side form validation via **Zod v4**.

3. **`packages/types` (`@aayeshol/types`)**:
   - Internal shared library referenced by both `apps/api` and `apps/web` via `workspace:*`.
   - Houses common data transfer contracts, authentication payloads, session models, and standard response envelopes (`ApiResponse<T>`).

---

## 3. Technology Stack

| Layer                    | Technologies                                                                |
| ------------------------ | --------------------------------------------------------------------------- |
| **Package Manager**      | `pnpm` (v11+)                                                               |
| **Monorepo Engine**      | `turbo` (Turborepo v2)                                                      |
| **Runtime Environment**  | Node.js `>= 24`                                                             |
| **Backend Framework**    | NestJS 11                                                                   |
| **Database & ORM**       | PostgreSQL + Prisma 7 (`@prisma/adapter-pg`, driver adapters)               |
| **Caching & Queues**     | Redis (`@nestjs-modules/ioredis` / `ioredis`) + BullMQ                      |
| **Email Service**        | Resend API (`resend`)                                                       |
| **AI Assistant**         | Google Gemini API (`@google/genai` / REST)                                  |
| **Frontend Framework**   | Next.js 16 (Turbopack, App Router) + React 19                               |
| **Frontend Styling**     | Tailwind CSS v4 (`@tailwindcss/postcss`, PostCSS 8) + `tw-animate-css`      |
| **UI Components**        | shadcn/ui (`base-nova` preset, `@base-ui/react`, `cva`, `lucide-react`)     |
| **Client State / Cache** | `@tanstack/react-query` v5                                                  |
| **Runtime Validation**   | Zod v4 (frontend/shared), `class-validator` / `class-transformer` (backend) |
| **Formatting & Linting** | Prettier 3, ESLint 9, Oxlint, lint-staged, Husky 9                          |

---

## 4. Architectural Entry Points & Important Data Flows

### Application Entry Points

- **Backend API**: `apps/api/src/main.ts`
  - Bootstraps the NestJS IoC container.
  - Listens on port `4000` (or `PORT` env var).
  - Registers global validation pipes, standardized response interceptors, cookie parsers, and CORS headers.
- **Frontend App**: `apps/web/app/layout.tsx` & `apps/web/app/page.tsx`
  - Bootstraps the Next.js App Router root layout.
  - Mounts global CSS (`app/globals.css`), typography fonts (`next/font/local` & `next/font/google`), and React Query providers.
  - Listens on port `3000`.

### Core Data Flow 1: 2-Step OTP Authentication Flow

```text
Step 1: Initiate (Login / Register / Forgot Password)
Client (Email + Password)
  ↓
Validation (Strict regex for Email and Password in DTO)
  ↓
Generate numeric OTP + Challenge ID (UUIDv4)
  ↓
Cache OTP challenge in Redis (auth:otp:{challengeId}, TTL: 5-10m)
  ↓
Send OTP email via Resend (MailService)
  ↓
Return Challenge ID to Client

Step 2: Verify & Issue Tokens
Client (Challenge ID + OTP)
  ↓
Verify OTP against Redis challenge key
  ↓
Evict Redis OTP challenge key immediately
  ↓
Create/Update User and Session record in PostgreSQL (Prisma)
  ↓
Cache active session in Redis (auth:session:{sessionId})
  ↓
Issue Access Token (JWT - 8 min lifetime)
Issue Refresh Token (HTTP-Only Secure Cookie - 7 hours lifetime)
```

### Core Data Flow 2: The Publishing & Background Execution Engine

```text
1. Schedule Post: User creates a post with target platforms and scheduled timestamp via API.
2. Enqueue Job: The API creates a post record in DB and enqueues a delayed job in BullMQ (backed by Redis).
3. Background Worker: At the target time, a dedicated BullMQ worker process picks up the job.
4. Data Hydration: Worker queries Prisma for post payload, decrypted social access tokens, and author details.
5. Media Streaming: If media is attached, the worker streams media files directly from connected Google Drive.
6. Multi-Platform Publishing: Worker calls target social media adapters (LinkedIn, X, Instagram, YouTube).
7. Status Persistence: Worker updates post and execution logs in PostgreSQL (e.g. PUBLISHED, FAILED).
8. Notification: Worker triggers MailService (Resend) to email the author regarding the outcome.
```

---

## 5. Development Workflow & Monorepo Scripts

Always execute commands from the repository root using `pnpm`. Turborepo handles task orchestration, dependency graphs, and caching:

```bash
# Start all applications in development mode (API on :4000, Web on :3000)
pnpm dev

# Build all applications and packages
pnpm build

# Run strict TypeScript type-checking across all workspaces
pnpm check-types

# Run linting across the monorepo
pnpm lint

# Automatically fix lint issues where supported
pnpm lint:fix

# Format all files using Prettier
pnpm format

# Verify formatting without modifying files
pnpm format:check

# Run security audit warnings
pnpm audit:warn
```

### Workspace-Specific Package Management

Never install dependencies directly into the root `node_modules` unless they are repository-wide tooling. Add dependencies to specific workspaces using the `--filter` flag:

```bash
# Add dependency to API
pnpm --filter api add <pkg>
pnpm --filter api add -D <pkg>

# Add dependency to Web
pnpm --filter web add <pkg>
pnpm --filter web add -D <pkg>

# Add dependency to shared Types
pnpm --filter @aayeshol/types add <pkg>
```

---

## 6. Engineering Principles & Coding Standards

### A. Strict Type Safety & No `any` Policy

- Strictly avoid `any`. Use `unknown` for unknown payloads and narrow with type guards or Zod schemas.
- Contract-first design: define shared schemas and interfaces in `packages/types`.
- Use JSDoc comments (`/** ... */`) on public methods, classes, and complex logic.

### B. Defensive Error Handling & Observability

- Never silently swallow errors (`try { ... } catch {}`).
- API controllers must throw appropriate NestJS HTTP exceptions (`BadRequestException`, `UnauthorizedException`, `InternalServerErrorException`) handled by global filters.
- Background workers must log stack traces and details using structured logging.
- Never use `console.log` in production code. Use the centralized Logger.

### C. Modularity & Clean Boundaries

- Follow Single Responsibility Principle (SRP). Avoid monolithic "god files" or "god services".
- Infrastructure services (Redis, Resend, S3/Drive) should not contain HTTP routing logic.
- External API calls (Gemini, Google Drive, Social OAuth) must remain isolated behind dedicated providers.

### D. Safe Secret Management & Redaction

- Never commit secrets, credentials, or `.env` files to git.
- Always read configurations via `@nestjs/config` in the API and typed environment configs in Web.
- Sensitive values (passwords, OTPs, JWT secrets, OAuth client secrets, social tokens) must be redacted from logs and never sent to frontend clients.

---

## 7. Curated Agent Skills Catalog

The monorepo contains specialized AI agent skill packages inside `.agents/skills/` for both backend and frontend domains. AI agents MUST inspect and follow these skills before making code changes:

### A. Backend & Database Skills (`apps/api/.agents/skills`)

| Skill Name                                 | Path                                                           | Scope & Primary Triggers                                                                                  | Instructions                                                                            |
| ------------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **`prisma-upgrade-v7`**                    | `apps/api/.agents/skills/prisma-upgrade-v7`                    | Prisma v7 breaking changes, configuration, generator outputs (`prisma7.config.ts`, `../generated/prisma`) | Read when upgrading Prisma, fixing generator issues, or configuring v7 driver adapters. |
| **`prisma-client-api`**                    | `apps/api/.agents/skills/prisma-client-api`                    | Type-safe queries, CRUD operations, `$transaction`, relations, and filters                                | Read before writing database queries or service methods in NestJS.                      |
| **`prisma-orm-setup`**                     | `apps/api/.agents/skills/prisma-orm-setup`                     | `schema.prisma` configuration, models, UUID keys, cascades, JSDoc (`///`) comments                        | Read when adding/modifying Prisma models, enums, or relationships.                      |
| **`prisma-driver-adapter-implementation`** | `apps/api/.agents/skills/prisma-driver-adapter-implementation` | Native driver adapter (`@prisma/adapter-pg`) connection setup                                             | Read when configuring PostgreSQL connection pools and driver adapters.                  |
| **`prisma-postgres`**                      | `apps/api/.agents/skills/prisma-postgres`                      | PostgreSQL-specific features: JSONB, text types, composite indexes (`@@index`)                            | Read when designing postgres indexes, performance tuning, or schema types.              |
| **`prisma-postgres-setup`**                | `apps/api/.agents/skills/prisma-postgres-setup`                | PostgreSQL instance connections, credential setup, migration initialization                               | Read when configuring database credentials and migration pipelines.                     |
| **`prisma-cli`**                           | `apps/api/.agents/skills/prisma-cli`                           | Prisma CLI workflows (`prisma generate`, `prisma migrate dev`, `prisma db push`)                          | Read when running database migrations or regenerating client types.                     |
| **`prisma-database-setup`**                | `apps/api/.agents/skills/prisma-database-setup`                | Database connectivity, connection pooling, SSL parameters, timeout configs                                | Read when troubleshooting DB connections or tuning pg pools.                            |

### B. Frontend & UI Skills (`apps/web/.agents/skills`)

| Skill Name                  | Path                                            | Scope & Primary Triggers                                                                    | Instructions                                                                                                      |
| --------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **`shadcn`**                | `apps/web/.agents/skills/shadcn`                | Official shadcn CLI, component composition, form rules, styling patterns, preset management | Read when adding/updating UI components (`Button`, `Card`, `Dialog`), running `shadcn add`, or verifying styling. |
| **`nextjs-best-practices`** | `apps/web/.agents/skills/nextjs-best-practices` | Next.js App Router rules, Server vs Client split, routing, caching, metadata                | Read when creating new routes, layouts, server components, or data fetching strategies.                           |
| **`tanstack-query`**        | `apps/web/.agents/skills/tanstack-query`        | React Query v5 server-state caching, optimistic updates, query keys, hydration              | Read when connecting frontend components to API routes, polling status, or mutations.                             |
| **`zod`**                   | `apps/web/.agents/skills/zod`                   | Zod v4 schemas, parsing, type inference, safeParse, error handling                          | Read when implementing form validations, API response contracts, or schema parsing.                               |
| **`ui-ux-pro-max`**         | `apps/web/.agents/skills/ui-ux-pro-max`         | Design intelligence, color harmony, typography pairings, UX accessibility guidelines        | Read when designing new views, ensuring contrast, spacing, and mobile responsiveness.                             |
| **`design-system`**         | `apps/web/.agents/skills/design-system`         | Three-layer token architecture (primitive → semantic → component), CSS variables            | Read when editing `globals.css` design tokens, themes, or custom typography scales.                               |

---

## 8. Integrated Agent Workflow & Practical Scenarios

All AI coding agents must follow this unified 8-step workflow when executing tasks across the monorepo:

```text
Step 1: Identify Task Scope (Backend, Frontend, Shared Packages, or Tooling)
       ↓
Step 2: Read Appropriate GEMINI.md (Root + apps/api/GEMINI.md or apps/web/GEMINI.md)
       ↓
Step 3: Determine Applicable Skills (Match triggers from Section 7 catalog)
       ↓
Step 4: Read Skill Instructions (Examine SKILL.md and relevant reference files)
       ↓
Step 5: Inspect Existing Code (Search for existing patterns, services, and shared types)
       ↓
Step 6: Implement Following Patterns & Reusing Shared Utilities
       ↓
Step 7: Validate Systematically:
        - pnpm check-types  (Verify strict type-checking across workspaces)
        - pnpm lint         (Verify ESLint/Oxlint standards)
        - pnpm format       (Format files according to root Prettier rules)
       ↓
Step 8: Transparent Reporting (Document files changed, skills used, and exact validation outputs)
```

---

### Concrete Task Scenarios

#### Scenario A: Adding a Frontend Feature (e.g. Account Login / Social Connection View)

1. **Scope**: `apps/web`.
2. **Docs**: Read `apps/web/GEMINI.md`.
3. **Skills**:
   - `ui-ux-pro-max` for layout, responsive grid, and accessible color contrast.
   - `shadcn` for UI component composition (`Card`, `Input`, `Button`).
   - `zod` for request form schema and input validation.
   - `tanstack-query` for API mutation and token/session caching.
4. **Execution**:
   - Validate form input using `schema.safeParse()`.
   - Compose accessible shadcn components without manual `space-y-*` or unlayered resets.
   - Trigger the login mutation via TanStack Query and handle errors.
5. **Validation**: Run `pnpm --filter web check-types` and `pnpm lint`.

#### Scenario B: Modifying an API Integration (e.g. Adding a New Social OAuth Strategy)

1. **Scope**: `apps/api`.
2. **Docs**: Read `apps/api/GEMINI.md`.
3. **Skills**:
   - `prisma-client-api` for persisting social accounts and tokens in PostgreSQL.
   - `prisma-postgres` for indexing composite fields like `@@unique([provider, providerAccountId])`.
4. **Execution**:
   - Create isolated OAuth strategy extending passport/custom auth guard in `apps/api/src/social/strategies/`.
   - Encrypt access and refresh tokens using existing encryption utilities (`crypto.util.ts`).
   - Ensure secrets are loaded from `@nestjs/config` and never logged.
5. **Validation**: Run `pnpm --filter api check-types` and `pnpm lint`.

#### Scenario C: Fixing a Bug (e.g. CSS Reset Overriding Button Padding or Session Cache Miss)

1. **Scope**: Identify whether bug is frontend (styling/hydration) or backend (caching/queues).
2. **Docs & Skills**:
   - For frontend styling bugs: Check `apps/web/GEMINI.md` and `apps/web/.agents/skills/shadcn/SKILL.md`. Notice CSS Cascade layer rules (never write unlayered `* { padding: 0 }` rules that override `@layer utilities`).
   - For session cache bugs: Check `apps/api/GEMINI.md` session cache flow (verify Redis key pattern `auth:session:${id}` and DB fallback).
3. **Execution**: Apply surgical fix preserving existing code conventions.
4. **Validation**: Run `pnpm check-types` and verify in dev environment.

#### Scenario D: Updating Shared Code in `packages/types`

1. **Scope**: `packages/types` and affected workspaces (`apps/api`, `apps/web`).
2. **Execution**:
   - Define new DTO/interface in `packages/types/src/` (e.g., `SocialPublishPayloadDto`).
   - Export from `packages/types/src/index.ts`.
   - Build package: `pnpm --filter @aayeshol/types build`.
   - Consume in `apps/api` and `apps/web` via `@aayeshol/types`.
3. **Validation**: Run root `pnpm check-types` to confirm all consumers compile without type errors.
