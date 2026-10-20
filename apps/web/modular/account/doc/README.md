# Account Modular System Documentation

Welcome to the technical documentation for the **Account Modular System** (`apps/web/modular/account`). This module encapsulates all UI components, Zod validation schemas, state machines, and API integration contracts for authentication and user account management in the Aayeshol frontend.

---

## 📚 Documentation Index

| Document                                                                                                | Description                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 📘 **[Account API Reference (`account-api-doc.md`)](./account-api-doc.md)**                             | Exhaustive catalog of all backend API endpoints (`/auth/*`), HTTP methods, accepted form/JSON payload formats, DTO validation constraints, TypeScript contracts, response envelopes (`ApiResponse<T>`), and production Axios code examples. |
| 🏗️ **[Account Architecture & UI Guide (`account-architecture-doc.md`)](./account-architecture-doc.md)** | Explains how Next.js App Router routes (`apps/web/app/account/*`) integrate with modular components, 2-Step OTP state machine, Zod schemas, Mermaid sequence diagrams, and end-to-end data flows with `apps/api`.                           |

---

## ⚡ Quick Reference

### 1. Route to Component Mapping

| App Router Route           | File Location                                   | Modular Component        | Target API                                                      |
| -------------------------- | ----------------------------------------------- | ------------------------ | --------------------------------------------------------------- |
| `/account/login`           | `apps/web/app/account/login/page.tsx`           | `<LoginForm />`          | `POST /auth/login` (Step 1)<br>`POST /auth/verify-otp` (Step 2) |
| `/account/forgot-password` | `apps/web/app/account/forgot-password/page.tsx` | `<ForgotPasswordForm />` | `POST /auth/forgot-password`                                    |
| `/account/reset-password`  | `apps/web/app/account/reset-password/page.tsx`  | `<ResetPasswordForm />`  | `POST /auth/reset-password`                                     |

### 2. Core API Endpoints (`apps/api/src/auth`)

```text
POST /api/auth/login            -> Step 1: Validates credentials, issues 5m OTP challengeId
POST /api/auth/verify-otp       -> Step 2: Validates OTP, issues accessToken + HTTP-only refresh cookie
POST /api/auth/forgot-password  -> Issues password recovery challengeId & sends 6-digit OTP
POST /api/auth/reset-password   -> Validates OTP and updates password in PostgreSQL
POST /api/auth/refresh          -> Rotates HTTP-only cookie and issues new 8-minute JWT accessToken
GET  /api/auth/me               -> Returns active user profile (SafeUser)
POST /api/auth/logout           -> Clears active Session in PostgreSQL and revokes cookie
```

### 3. Quick Axios Snippet

```typescript
import { http } from '@/modular/lib/http';
import type { LoginRequestPayload, LoginChallengeResponse } from '@/modular/account';

// Step 1: Initiate 2-Step OTP Login
const { data } = await http.post<LoginChallengeResponse>('/auth/login', {
  email: 'user@example.com',
  password: 'Password123!',
});

console.log('OTP Challenge ID:', data.challengeId);
```

### 4. Zustand Auth Store & Utilities Usage

```typescript
import { useAuthStore, getAuthToken, isAdminUser, isSessionValid } from '@/modular/account';

// Inside React components:
const { user, isLoggedIn, logout } = useAuthStore();

// Outside React components (e.g. Axios interceptors, route guards):
const token = getAuthToken(); // returns string | null
const isAdmin = isAdminUser(); // returns boolean (checks user.role === 'ADMIN')
const valid = isSessionValid(); // verifies token exists and is not expired
```

### 5. AuthProvider & useAuth Hook

```typescript
import { useAuth } from '@/modular/account';

export function UserProfileHeader() {
  const { user, isLoggedIn, isAdmin, refreshSession, logout } = useAuth();

  return (
    <div>
      <p>{user?.name} ({user?.role})</p>
      {isAdmin && <span className="badge">ADMIN</span>}
      <button onClick={refreshSession}>Rotate Token</button>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

### 6. Protected Routes with AuthGuard (AuthChecker)

```typescript
'use client';

import { AuthGuard } from '@/modular/account';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Restricts access exclusively to users with 'ADMIN' role.
  // Non-logged-in users are redirected to /account/login?redirect=/dashboard.
  // Logged-in non-admins receive a dedicated "Access Restricted" screen.
  return (
    <AuthGuard requiredRoles={['ADMIN']} fallbackUrl="/account/login">
      {children}
    </AuthGuard>
  );
}
```

### 7. Axios Client & Token Rotation Engine

- **Base URL**: Resolves strictly from `process.env.NEXT_PUBLIC_BACKEND_API_URL` (e.g. `http://localhost:3001/api`).
- **Concurrent 401 Queue**: Coordinates simultaneous 401 responses through a single in-flight refresh request.
- **Refresh Token Rotation (RTR)**: Communicates with `/api/auth/refresh` via HTTP-only credentials cookie (`withCredentials: true`), preserving rotated session state.
- **Max Retries**: Retries original requests at most once (`_retry: true`) to eliminate recursive loops.
- **Zero Leakage**: Purges TanStack Query cache (`clearUserSessionCache()`) and clears Zustand store on session revocation.
