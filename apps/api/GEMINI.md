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

### Authentication Flow

```text
Email + Password
      ↓
Credential Validation
      ↓
Generate OTP
      ↓
Store OTP temporarily in Redis
      ↓
Send OTP through Resend
      ↓
User verifies OTP
      ↓
Issue JWT
```

Authentication must consider secure password handling, OTP expiration/TTL, retry/attempt limits, JWT expiration, guards, authorization, rate limiting, and safe error handling.

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
