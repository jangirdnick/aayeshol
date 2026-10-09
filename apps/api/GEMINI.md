# Aayeshol v2 Backend

Aayeshol v2 is an AI-powered multi-platform social media management and scheduling SaaS.

This document extends the root `GEMINI.md` and contains the detailed backend-specific architecture, conventions, and implementation rules for the NestJS application.

The backend is a containerized NestJS application with a modular architecture. Its major responsibilities include:

- Authentication
- OTP verification
- JWT authorization
- Social account/OAuth linking
- Secure token management
- AI content generation through Gemini
- Google Drive media access/streaming
- Post creation
- Post scheduling
- Redis and BullMQ queue management
- Background workers
- Social media publishing
- Email notifications through Resend
- PostgreSQL database operations

### Authentication & Session Flow

The system employs a 2-step OTP flow for Registration, Login, and Password Reset:

```text
Step 1: Initiate
Client (Email + Password)
      ↓
Validation (Strict Regex for Email/Password)
      ↓
Generate OTP & Challenge ID (UUIDv4)
      ↓
Store OTP temporarily in Redis
      ↓
Send OTP through Resend
      ↓
Return Challenge ID to Client

Step 2: Verify
Client (Challenge ID + OTP)
      ↓
Validate OTP against Redis
      ↓
Issue Access Token (JWT - 8m) & Refresh Token (HTTP-Only Cookie - 7h)
      ↓
Create Session in DB & Cache in Redis
```

Authentication must consider secure password handling, strict regex validation for emails/passwords, UUID(4) validation for challenge IDs, OTP expiration/TTL, retry/attempt limits, JWT expiration, guards, authorization, rate limiting, and safe error handling.

#### Session Management

Sessions are managed via the `JwtAuthGuard`. The guard validates sessions by first checking the Redis session cache (`auth:session:${sessionId}`). If a cache miss occurs, it falls back to the PostgreSQL `Session` table to verify session validity. On logout, both the database session and the Redis cache entry must be immediately evicted to prevent session bypass. Redis keys must be managed centrally via `AuthHelperService` (e.g., `KEY_PASSWORD_RESET`, `KEY_SESSION_CACHE`).

### Social OAuth

Users can connect platforms such as:

- LinkedIn
- X
- Meta

Platform-specific OAuth, token handling, media requirements, publishing APIs, rate limits, and errors must remain isolated through clean provider/adapter abstractions where appropriate.

Access/refresh tokens are sensitive and must be securely stored, never logged, and never unnecessarily exposed to the frontend.

### AI Content Assistant

Gemini is used to generate platform-specific content such as captions, hashtags, and titles.

Keep Gemini integration isolated behind a reusable service/provider.

Handle:

- Validation
- Prompt construction
- Structured output
- Invalid responses
- Timeouts
- Rate limits
- External API failures
- Safe logging

Never blindly trust external AI responses.

### Google Drive / Media

Google Drive is used as the media source.

Large media should be streamed where practical instead of unnecessarily loading entire files into memory.

Consider:

- Large files
- Streams
- Timeouts
- Network failures
- Permissions
- Authentication
- Missing files
- External API limitations

### Post Scheduling & Background Processing

Scheduling must use Redis + BullMQ.

Expected flow:

```text
Client
  ↓
NestJS API
  ↓
Validate Request
  ↓
Persist Post
  ↓
Create BullMQ Job
  ↓
Redis
  ↓
Scheduled Time
  ↓
BullMQ Worker
  ↓
Fetch Post + Tokens
  ↓
Stream Media from Google Drive
  ↓
Publish to Social API
  ↓
Update Database Status
  ↓
Send Success Email
```

The API must not stay open waiting for scheduled execution.

Workers must support production concerns such as:

- Retries
- Exponential backoff
- Timeouts
- Idempotency
- Duplicate-job prevention
- Worker crashes
- Partial failures
- External API rate limits
- Failed jobs
- Graceful shutdown
- Concurrency
- Horizontal scaling

The database should remain the durable source of truth for business state.

### Docker

The backend must support containerized execution because background jobs and large media operations should not depend on serverless request timeouts.

Keep API and worker responsibilities logically separated so workers can run independently.

---

## Backend Engineering Rules

### Modular Architecture

Code must be modular, readable, maintainable, and easy to update.

Keep responsibilities separated:

- Controllers
- Services
- DTOs
- Types/interfaces
- Providers
- Guards/strategies
- Infrastructure services
- External integrations
- Queue/worker logic

Do not create giant files or giant services containing unrelated responsibilities.

Infrastructure services such as Redis (currently `src/infrastructure/redis`) and Resend (currently `src/infrastructure/mail`) should not have controllers unless they genuinely expose an HTTP resource.

Do not split code into meaningless micro-files either. Modularity should improve clarity, not create unnecessary complexity.

### Existing Code First

Before implementing anything:

1. Inspect the relevant existing code.
2. Search for similar functionality.
3. Reuse existing services, utilities, types, modules, and patterns.
4. Extend existing architecture when appropriate.
5. Do not recreate existing models/controllers/services/providers.
6. Do not introduce duplicate logic.

### Production-Grade Code

All new backend code must be production-ready.

Prioritize:

- Type safety
- Security
- Validation
- Error handling
- Logging
- Observability
- Testability
- Performance
- Clear module boundaries
- Maintainability

Avoid:

- `any` unless genuinely unavoidable
- Hardcoded secrets
- Hardcoded environment-specific values
- Duplicate logic
- Silent errors
- Unnecessary abstractions
- Random utility files
- Business logic inside controllers
- Database logic inside controllers
- External API calls scattered throughout business logic

### Type Safety

Use strong TypeScript types.

- Avoid `any`.
- Avoid unnecessary type assertions.
- Reuse existing domain/shared types.
- Type service inputs and outputs.
- Validate external/untrusted data at runtime.
- Do not rely only on TypeScript types for external API responses.

### DTO & Validation

Use the existing validation architecture.

Where configured, use:

- `class-validator`
- `class-transformer`

DTOs must represent request contracts and should not simply be database models. Validate all untrusted input.

### Controllers

Controllers should remain thin:

```text
Request
  ↓
Validation / Transformation
  ↓
Application Service
  ↓
Response
```

Do not put complex business logic, database implementation, Redis logic, or external API logic inside controllers.

### Services

Services should have clear responsibilities.

Avoid generic or giant services such as `EverythingService`, `AppService`, `SocialService` when they contain unrelated responsibilities. Prefer focused, cohesive services.

### External Integrations

Gemini, Google Drive, LinkedIn, X, Meta, and Resend must have clear boundaries.

External integrations should be reusable, testable, and replaceable.

Handle: Timeouts, Network errors, Authentication errors, Rate limits, Invalid responses, Provider outages, Expired credentials, Permission failures.

Do not expose raw third-party errors directly to users.

### Redis

Redis is used for temporary application data such as OTPs and for BullMQ infrastructure. Centralize Redis connection/management logic using the existing `RedisModule` (`@nestjs-modules/ioredis`). Do not create Redis clients randomly throughout the application.

### Logging

Do not use `console.log`, `console.error`, etc. for production application logging. Use the project's logging system.

Where appropriate, logs should include: `requestId`, `userId`, `userAgent`, Operation, Module/service, Resource ID, Job ID, External provider, Error information, Duration.

Never log sensitive information: Passwords, OTPs, JWT secrets, Access tokens, Refresh tokens, OAuth credentials, API keys. Sensitive information must be redacted.

### Request Context

Use request/correlation IDs where supported by the existing architecture. For background jobs, preserve useful job/correlation identifiers so asynchronous operations can be traced back to their origin.

### JSDoc

Important public services, methods, providers, interfaces, and complex abstractions must have useful production-grade JSDoc.

JSDoc should explain: What it does, Parameters, Return value, Important behavior, Errors, Constraints, Usage expectations. Do not add meaningless comments to obvious code.

### Package Analysis

Before using an installed package:

1. Check its version.
2. Understand its purpose.
3. Inspect how it is already used.
4. Follow its actual NestJS/TypeScript integration.
5. Understand its lifecycle/API.
6. Avoid assumptions-based implementation.

Do not write random code simply because a package is installed.

---

## Agent Skills (`.agents/skills`)

The `apps/api/.agents/skills` directory contains specialized skill packages and guidance manuals for database management, Prisma ORM operations, schema design, and driver adapter configuration. AI agents and developers working on the backend MUST reference these skills before executing database modifications or writing data access logic.

### Available Skills Index

| Skill Name                             | Path                                                           | Domain / Scope                                                   | Primary Triggers                                      |
| -------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| `prisma-upgrade-v7`                    | `apps/api/.agents/skills/prisma-upgrade-v7`                    | Prisma v7 breaking changes, configuration, generator outputs     | Generator migration, v7 imports, `prisma7.config.ts`  |
| `prisma-client-api`                    | `apps/api/.agents/skills/prisma-client-api`                    | Type-safe queries, CRUD operations, transactions, relations      | Writing database queries, NestJS Prisma service logic |
| `prisma-orm-setup`                     | `apps/api/.agents/skills/prisma-orm-setup`                     | `schema.prisma` configuration, models, relations, field docs     | Schema updates, model creation, relation modeling     |
| `prisma-driver-adapter-implementation` | `apps/api/.agents/skills/prisma-driver-adapter-implementation` | Native driver adapter (`@prisma/adapter-pg`) setup               | Connecting Prisma Client via driver adapters          |
| `prisma-postgres`                      | `apps/api/.agents/skills/prisma-postgres`                      | PostgreSQL-specific data types, arrays, JSONB, composite indexes | Postgres schema design, index optimization            |
| `prisma-postgres-setup`                | `apps/api/.agents/skills/prisma-postgres-setup`                | PostgreSQL database instance & connection credentials            | DB setup, initial migrations, env configs             |
| `prisma-cli`                           | `apps/api/.agents/skills/prisma-cli`                           | Prisma CLI workflow (`generate`, `migrate`, `db push`)           | Running DB commands, migration scripts                |
| `prisma-database-setup`                | `apps/api/.agents/skills/prisma-database-setup`                | Database connectivity, connection pooling, SSL settings          | Connection troubleshooting, pool tuning               |

---

### When, Where & How to Use Skills (Kab, Kaha, Kase)

#### 1. `prisma-upgrade-v7`

- **Kab (When)**: When configuring Prisma v7, modifying generator blocks, fixing import errors post-upgrade, or setting up `prisma7.config.ts`.
- **Kaha (Where)**: `apps/api/prisma/schema.prisma`, `apps/api/prisma7.config.ts`, and `apps/api/src/prisma/prisma.service.ts`.
- **Kase (How)**: Read `SKILL.md` in `prisma-upgrade-v7`. Ensure generator uses `provider = "prisma-client"` with explicit `output = "../generated/prisma"`. Import client from `../generated/prisma/client` and pass `@prisma/adapter-pg` driver adapter to `PrismaClient`.

#### 2. `prisma-client-api`

- **Kab (When)**: When implementing database queries, service methods (e.g. Auth, Post scheduling, Social account CRUD), transactions (`$transaction`), or complex filters.
- **Kaha (Where)**: NestJS services in `apps/api/src/` (e.g., `user.service.ts`, `post.service.ts`, `prisma.service.ts`).
- **Kase (How)**: Use strict type safety with `satisfies Prisma.<Model>Select`, avoid raw queries where ORM methods exist, handle nullability, and wrap multi-step DB operations in `$transaction`.

#### 3. `prisma-orm-setup`

- **Kab (When)**: When designing new database tables, updating enum types, establishing table relationships (1-to-1, 1-to-Many), or adding JSDoc comments (`///`) to schema fields.
- **Kaha (Where)**: `apps/api/prisma/schema.prisma`.
- **Kase (How)**: Use UUID primary keys (`@id @default(uuid())`), explicit onDelete actions (`onDelete: Cascade`), meaningful JSDoc triple-slash (`///`) docstrings for models/fields, and run `pnpm exec prisma generate` after schema edits.

#### 4. `prisma-driver-adapter-implementation`

- **Kab (When)**: When initializing `PrismaClient` with native PostgreSQL driver adapters (`pg` pool management).
- **Kaha (Where)**: `apps/api/src/prisma/prisma.service.ts` or database provider initialization modules.
- **Kase (How)**: Instantiate `PrismaPg` adapter using `pg.Pool`, pass the adapter instance to `new PrismaClient({ adapter })`, and ensure clean disconnect on module destruction.

#### 5. `prisma-postgres` & `prisma-postgres-setup`

- **Kab (When)**: When leveraging Postgres features (e.g. `String[]` arrays, `@db.Text`, composite indexes `@@index([status, publishAt])`) or setting up DB connections.
- **Kaha (Where)**: `schema.prisma`, environment variable configurations (`.env`), and database migration scripts.
- **Kase (How)**: Configure connection string `DATABASE_URL`, add index attributes for frequent query filters (e.g. BullMQ worker post polling), and follow Postgres best practices.

#### 6. `prisma-cli`

- **Kab (When)**: When running database commands such as migrations, schema generation, or database inspection.
- **Kaha (Where)**: Terminal / npm scripts in `apps/api/package.json`.
- **Kase (How)**: Use `pnpm exec prisma generate` for client generation, `pnpm exec prisma migrate dev --name <migration_name>` for local schema migrations, and never run destructive commands on production databases.

---

## File & Folder Rules

Before creating a new file or folder:

1. Inspect the existing structure (currently basic `src/` app files and `src/infrastructure/` for core services).
2. Identify the correct domain/module.
3. Search for reusable existing functionality.
4. Follow established naming conventions.
5. Keep related code together.
6. Create a new folder only when it represents a meaningful responsibility.
7. Do not create random generic folders such as unnecessary `utils`, `helpers`, or `services`.

The actual repository structure must be treated as the source of truth. Features like Auth, Social, and Post are yet to be implemented.

---

## Implementation Workflow

Every backend task should follow:

```text
Read root GEMINI.md
        ↓
Read apps/api/GEMINI.md
        ↓
Inspect existing implementation
        ↓
Analyze related packages/dependencies
        ↓
Search for reusable code
        ↓
Understand architecture/data flow
        ↓
Plan the change
        ↓
Implement modularly
        ↓
Add validation + types
        ↓
Add useful JSDoc
        ↓
Add proper error handling/logging
        ↓
Run TypeScript/build checks
        ↓
Run ESLint
        ↓
Run tests where applicable
        ↓
Review for duplication/security
```

Do not start coding before understanding the existing implementation.

---

## Definition of Done

A backend feature is complete only when:

- It follows the correct module boundary.
- It is production-ready.
- It is type-safe.
- Inputs are validated.
- Errors are handled correctly.
- Logging is appropriate.
- Sensitive information is protected.
- JSDoc is added where useful.
- No duplicate logic was introduced.
- No unnecessary files were created.
- Existing functionality was not accidentally broken.
- ESLint passes.
- TypeScript/build checks pass.
- Tests pass where available.
