# Aayeshol v2 - AI Engineering Instructions & Architecture

This document serves as the primary engineering manual and AI-agent instruction file for **Aayeshol v2**. All AI agents and developers working on this codebase MUST read and adhere to the guidelines, architecture, and principles defined here.

## 1. Project Overview

**Aayeshol v2** is an advanced, AI-powered, multi-platform social media management and scheduling SaaS.
Its primary objective is to automate and streamline the repetitive tasks involved in daily social media publishing.

### Core Capabilities:

- **Authentication**: Custom authentication flow for user account creation and login.
- **Integrations**: Link social media accounts (OAuth/API) and connect Google Drive as a media source.
- **AI Content Assistant**: Leverage Gemini API to generate platform-specific content (captions, hashtags, titles) based on user prompts.
- **Publishing & Scheduling**: Build posts with platform-specific content and choose to either **Direct Post** or **Schedule Post** for a specific date and time.
- **Automated Delivery**: Background workers handle the scheduled publishing reliably without user intervention.
- **Notifications**: Email notifications (via Resend) sent after successful or failed publishing attempts.

---

## 2. Monorepo Architecture

This project is structured as a JavaScript/TypeScript **Monorepo** using **Turborepo** and **pnpm workspaces**.

### General Structure (Expected)

- `apps/api`: NestJS Backend API (Handles core logic, database, auth, queues).
- `apps/web`: Frontend Application (React/Next.js/Vite - UI and user interactions).
- `packages/*`: Shared internal packages (e.g., UI components, TypeScript configs, ESLint configs).

_(Note: Specific instructions for `apps/web` and `apps/api` will be provided in their respective `GEMINI.md` files later. This file governs the global architecture.)_

---

## 3. Core Background Flow (The Engine)

The most critical component of Aayeshol v2 is the reliable execution of scheduled posts via background jobs.

**The execution flow must strictly adhere to the following sequence:**

1. **Scheduled Post**: User schedules a post via the API.
2. **BullMQ Queue**: The API enqueues a job in BullMQ (backed by Redis) scheduled for the target time.
3. **Background Worker**: A BullMQ worker process picks up the job at the scheduled time.
4. **Data Hydration**: The worker fetches the Post payload and the necessary Social Media Access Tokens from the Database (Prisma).
5. **Media Fetching**: If media is attached, the worker fetches/streams the media files from the connected Google Drive.
6. **Publishing**: The worker pushes the compiled content and media to the target Social Media API.
7. **Status Update**: The worker updates the Post/Publishing status in the database (e.g., `PUBLISHED`, `FAILED`).
8. **Notification**: The worker triggers an Email Notification (via MailService/Resend) to inform the user of the outcome.

---

## 4. Engineering Principles & Coding Standards

To maintain a clean, consistent, and production-ready codebase, adhere strictly to these principles across the entire monorepo:

### A. Type Safety & TypeScript

- **Strict Typing**: Avoid `any`. Use `unknown` for unknown data and cast/narrow appropriately.
- **Interfaces & Types**: Define clear interfaces/types for all configurations, payloads, and API responses.
- **JSDoc**: Use JSDoc comments (`/** ... */`) to document classes, methods, complex logic, and provide `@example` blocks where helpful.

### B. Error Handling

- Never silently swallow errors.
- In background workers/services, log errors extensively (including stack traces) using a centralized Logger.
- In the API layer, throw appropriate HTTP Exceptions (e.g., `InternalServerErrorException`) so that global exception filters can handle them consistently.

### C. Modularity & Reusability

- **DRY (Don't Repeat Yourself)**: If logic or configuration is used across multiple apps, extract it to a shared package in `packages/`.
- **Dependency Injection**: Leverage DI (e.g., NestJS DI container) for services to keep modules loosely coupled and testable.
- Do not create "god files". Break down large functions and classes into focused, single-responsibility units.

### D. Configuration & Secrets

- Never hardcode secrets, API keys, or environment-specific URLs.
- Always use environment variables, parsed and validated through a configuration service (e.g., `@nestjs/config`).

### E. Code Formatting & Linting

- **Prettier**: A shared root Prettier configuration governs all formatting.
- **ESLint/Oxlint**: Follow the established linting rules. Ensure code passes lint checks before committing.

---

## 5. Tooling & Infrastructure Stack

- **Package Manager**: `pnpm`
- **Monorepo Tool**: Turborepo (`turbo`)
- **Backend Framework**: NestJS
- **Database ORM**: Prisma
- **Database Engine**: PostgreSQL
- **Caching & Queues**: Redis (via `ioredis`) + BullMQ
- **Email Service**: Resend

## 6. Monorepo Scripts & Workflow

Always use the defined root scripts when working across multiple apps. These scripts leverage Turborepo for efficient caching and parallel execution.

- **`pnpm build`**: Compiles and builds all applications and packages (`turbo run build`).
- **`pnpm dev`**: Starts all applications in development mode (`turbo run dev`).
- **`pnpm lint`**: Runs ESLint/Oxlint across the monorepo to check for code quality issues.
- **`pnpm lint:fix`**: Automatically fixes linting errors where possible.
- **`pnpm format`**: Formats the entire codebase using Prettier (`prettier --write`).
- **`pnpm format:check`**: Verifies that the codebase adheres to Prettier formatting rules.
- **`pnpm check-types`**: Runs strict TypeScript type-checking across all workspaces.

---

## 7. AI Agent Guidelines

- Read this root `GEMINI.md` file FIRST before initiating major architectural changes.
- Ensure new dependencies are added to the correct workspace using `pnpm --filter <workspace> add <pkg>`.
- Prioritize existing conventions over introducing new patterns.
- Always run formatting and linting (`pnpm format`, `pnpm lint:fix`) before finalizing your changes.
