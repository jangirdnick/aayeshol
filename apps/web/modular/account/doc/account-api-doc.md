# Account Modular API Reference & Integration Guide

This document provides a comprehensive technical reference for all HTTP REST APIs consumed by the **Account Module** (`apps/web/modular/account`), how they map to the backend authentication controller (`apps/api/src/auth`), accepted payload data formats, TypeScript contracts, Axios client configuration, and response envelopes.

---

## 1. Global Architecture & Communication Protocol

### Base URL & Environment Configuration

The web client communicates with the NestJS API server via the centralized Axios client configured in `apps/web/modular/lib/http/axios-client.ts`:

- **Production/Local Environment Variable**: `NEXT_PUBLIC_API_URL`
- **Default Base URL**:
  - Browser runtime: `/api` (proxied or resolved via Next.js rewrite / direct API routing)
  - SSR / Container runtime: `http://localhost:3001` (Docker API port)
- **Cookie Policy**: `withCredentials: true` (mandatory for automatic transmission of HTTP-only `refresh_token` cookies across origin boundaries).
- **Default Headers**:
  - `Content-Type: application/json`
  - `Accept: application/json`

---

## 2. Standardized Response Envelope (`ApiResponse<T>`)

Every API response from `apps/api` adheres to the strict monorepo response contract defined in `@aayeshol/types` and exported through `@/modular/account/types`:

### A. Success Envelope (`2xx OK / Created`)

```typescript
export interface ApiSuccessResponse<T = null> {
  success: true;
  message: string; // Human-readable message suitable for Toast UI notifications
  data: T; // Typed response payload
}
```

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "user": { ... }
  }
}
```

### B. Error Envelope (`4xx / 5xx`)

```typescript
export interface ApiErrorResponse {
  success: false;
  message: string; // User-facing localized error description
  error: string; // Error classification code (e.g. "UNAUTHORIZED", "BAD_REQUEST")
}
```

```json
{
  "success": false,
  "message": "Invalid verification code or code has expired.",
  "error": "Unauthorized"
}
```

### C. Validation Error Response (`400 Bad Request`)

When DTO validation fails via NestJS `ValidationPipe`, errors are returned as an array:

```json
{
  "statusCode": 400,
  "message": [
    "Email address must be a valid format (e.g. user@example.com).",
    "Password must not exceed 128 characters."
  ],
  "error": "Bad Request"
}
```

---

## 3. Account Module API Endpoints Catalog

The following table summarizes all APIs consumed by the modular account system:

| #     | Route Endpoint              | HTTP Method | Auth Required | Purpose in UI                                   | Input Payload                  | Return Data Payload (`data`)                |
| ----- | --------------------------- | ----------- | ------------- | ----------------------------------------------- | ------------------------------ | ------------------------------------------- |
| **1** | `/auth/login`               | `POST`      | Public        | Step 1: Validate email & password, send OTP     | `LoginRequestPayload`          | `LoginChallengeResponse` (`challengeId`)    |
| **2** | `/auth/verify-otp`          | `POST`      | Public        | Step 2: Validate 6-digit OTP, establish session | `VerifyLoginOtpRequestPayload` | `TokenPairResponse` (`accessToken`, `user`) |
| **3** | `/auth/forgot-password`     | `POST`      | Public        | Initiate password reset, send 6-digit OTP       | `ForgotPasswordRequestPayload` | `LoginChallengeResponse` (`challengeId`)    |
| **4** | `/auth/reset-password`      | `POST`      | Public        | Complete password reset with OTP & new password | `ResetPasswordRequestPayload`  | `null`                                      |
| **5** | `/auth/refresh`             | `POST`      | Cookie Only   | Rotate tokens via HTTP-only `refresh_token`     | None                           | `{ accessToken: string }`                   |
| **6** | `/auth/me`                  | `GET`       | Bearer Token  | Fetch current active user profile               | None                           | `SafeUser`                                  |
| **7** | `/auth/logout`              | `POST`      | Bearer Token  | Invalidate current session and clear cookie     | None                           | `null`                                      |
| **8** | `/auth/resend-verification` | `POST`      | Public        | Request a fresh email verification code         | `{ email: string }`            | `null`                                      |

---

## 4. In-Depth Endpoint Specifications

### 1. User Login — Step 1 (`POST /auth/login`)

Validates user credentials. Upon success, generates a numeric 6-digit OTP cached in Redis under `auth:login-otp:{challengeId}` (TTL: 5 minutes) and dispatches an email via Resend.

- **Axios Helper**: `http.post<LoginChallengeResponse>('/auth/login', payload)`
- **Full URL**: `${NEXT_PUBLIC_API_URL}/auth/login`
- **Component**: `<LoginForm />` (Credentials Step)

#### Request Payload (`LoginRequestPayload` / `LoginFormData`)

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

| Field      | Type     | Required | Constraints & Sanitization                          | Validation Error Message                                          |
| ---------- | -------- | -------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| `email`    | `string` | **Yes**  | Trimmed, lowercased, max 255 chars, regex validated | `"Email address must be a valid format (e.g. user@example.com)."` |
| `password` | `string` | **Yes**  | 1 to 128 chars                                      | `"Password cannot be empty."`                                     |

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "A verification code has been sent to your email.",
  "data": {
    "challengeId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

### 2. Verify Login OTP — Step 2 (`POST /auth/verify-otp`)

Verifies the 6-digit OTP against the Redis challenge, registers an active `Session` in PostgreSQL with IP & User-Agent telemetry, generates tokens, and sets the HTTP-only cookie.

- **Axios Helper**: `http.post<TokenPairResponse>('/auth/verify-otp', payload)`
- **Full URL**: `${NEXT_PUBLIC_API_URL}/auth/verify-otp`
- **Component**: `<LoginForm />` (OTP Step) / `<OtpVerificationForm />`

#### Request Payload (`VerifyLoginOtpRequestPayload` / `VerifyOtpFormData`)

```json
{
  "challengeId": "550e8400-e29b-41d4-a716-446655440000",
  "otp": "482910"
}
```

| Field         | Type     | Required | Constraints                            | Validation Error Message          |
| ------------- | -------- | -------- | -------------------------------------- | --------------------------------- |
| `challengeId` | `string` | **Yes**  | Valid UUIDv4 string returned in Step 1 | `"Challenge ID is required."`     |
| `otp`         | `string` | **Yes**  | Exactly 6 numeric digits (`^\d{6}$`)   | `"OTP must be exactly 6 digits."` |

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cm8abc123456789",
      "name": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@example.com",
      "emailVerified": true,
      "avatar": "https://example.com/avatar.jpg",
      "role": "USER",
      "createdAt": "2026-10-15T12:00:00.000Z",
      "updatedAt": "2026-10-18T10:30:00.000Z"
    }
  }
}
```

#### Set-Cookie Header (Handled automatically by Browser)

```http
Set-Cookie: refresh_token=opaque_high_entropy_token; Path=/; HttpOnly; SameSite=Lax; Max-Age=25200; Secure
```

---

### 3. Forgot Password (`POST /auth/forgot-password`)

Initiates self-service password recovery by generating a reset challenge and sending a 6-digit OTP to the user's registered email.

- **Axios Helper**: `http.post<LoginChallengeResponse>('/auth/forgot-password', payload)`
- **Full URL**: `${NEXT_PUBLIC_API_URL}/auth/forgot-password`
- **Component**: `<ForgotPasswordForm />`

#### Request Payload (`ForgotPasswordRequestPayload` / `ForgotPasswordFormData`)

```json
{
  "email": "user@example.com"
}
```

| Field   | Type     | Required | Constraints                             | Validation Error Message                  |
| ------- | -------- | -------- | --------------------------------------- | ----------------------------------------- |
| `email` | `string` | **Yes**  | Trimmed, lowercased, valid email format | `"Please provide a valid email address."` |

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "If this email is registered, you will receive a password reset code shortly.",
  "data": {
    "challengeId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

### 4. Reset Password (`POST /auth/reset-password`)

Completes password recovery by verifying the OTP challenge and updating the user's password in PostgreSQL using bcrypt (12 rounds).

- **Axios Helper**: `http.post<null>('/auth/reset-password', payload)`
- **Full URL**: `${NEXT_PUBLIC_API_URL}/auth/reset-password`
- **Component**: `<ResetPasswordForm />`

#### Request Payload (`ResetPasswordRequestPayload` / `ResetPasswordFormData`)

```json
{
  "challengeId": "550e8400-e29b-41d4-a716-446655440000",
  "otp": "482910",
  "newPassword": "SecurePassword123!"
}
```

| Field             | Type     | Required        | Constraints                                                                             | Validation Error Message                                                                                      |
| ----------------- | -------- | --------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `challengeId`     | `string` | **Yes**         | UUIDv4 challenge identifier                                                             | `"Challenge ID is required."`                                                                                 |
| `otp`             | `string` | **Yes**         | Exactly 6 numeric digits                                                                | `"OTP must be exactly 6 digits."`                                                                             |
| `newPassword`     | `string` | **Yes**         | Min 8, max 128 chars, requires: 1 uppercase, 1 lowercase, 1 number, 1 special character | `"Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character."` |
| `confirmPassword` | `string` | **Client Only** | Must match `newPassword`                                                                | `"Passwords do not match."`                                                                                   |

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Password has been reset successfully. Please log in with your new password.",
  "data": null
}
```

---

### 5. Refresh Access Token (`POST /auth/refresh`)

Rotates the refresh token and issues a new 8-minute JWT access token without requiring re-authentication.

- **Axios Helper**: `http.post<{ accessToken: string }>('/auth/refresh')`
- **Request Body**: None (Payload transmitted via `refresh_token` HTTP-only cookie)
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Tokens refreshed",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

---

### 6. Get Current User Profile (`GET /auth/me`)

Retrieves profile data for the currently authenticated user.

- **Axios Helper**: `http.get<SafeUser>('/auth/me', { headers: { Authorization: `Bearer ${token}` } })`
- **Header**: `Authorization: Bearer <accessToken>`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "User profile",
    "data": {
      "id": "cm8abc123456789",
      "name": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@example.com",
      "emailVerified": true,
      "avatar": null,
      "role": "USER",
      "createdAt": "2026-10-15T12:00:00.000Z",
      "updatedAt": "2026-10-18T10:30:00.000Z"
    }
  }
  ```

---

### 7. User Logout (`POST /auth/logout`)

Deletes the active `Session` in PostgreSQL and invalidates the `refresh_token` HTTP-only cookie.

- **Axios Helper**: `http.post<null>('/auth/logout')`
- **Header**: `Authorization: Bearer <accessToken>`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully",
    "data": null
  }
  ```

---

## 5. TypeScript Contract Reference (`@aayeshol/types`)

All models and payloads are strictly typed across the monorepo:

```typescript
// Safe User entity without security fields
export interface SafeUser {
  id: string;
  name: string;
  lastName: string | null;
  email: string;
  emailVerified: boolean;
  avatar: string | null;
  role: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Request Models
export interface LoginRequestPayload {
  email: string;
  password: string;
}

export interface VerifyLoginOtpRequestPayload {
  challengeId: string;
  otp: string;
}

export interface ForgotPasswordRequestPayload {
  email: string;
}

export interface ResetPasswordRequestPayload {
  challengeId: string;
  otp: string;
  newPassword: string;
}

// Response Models
export interface LoginChallengeResponse {
  challengeId: string;
}

export interface TokenPairResponse {
  accessToken: string;
  user?: SafeUser;
}
```

---

## 6. Axios Integration Code Samples

### Complete Login Flow Implementation Example

```typescript
import { http } from '@/modular/lib/http';
import type {
  LoginRequestPayload,
  LoginChallengeResponse,
  VerifyLoginOtpRequestPayload,
  TokenPairResponse,
} from '@/modular/account';

// Step 1: Submit credentials to receive challengeId
export async function initiateLogin(credentials: LoginRequestPayload): Promise<string> {
  const response = await http.post<LoginChallengeResponse>('/auth/login', credentials);
  return response.data.challengeId;
}

// Step 2: Submit OTP code along with challengeId to obtain session
export async function completeLoginOtp(
  payload: VerifyLoginOtpRequestPayload,
): Promise<TokenPairResponse> {
  const response = await http.post<TokenPairResponse>('/auth/verify-otp', payload);
  return response.data;
}
```

### Password Reset Flow Implementation Example

```typescript
import { http } from '@/modular/lib/http';
import type {
  ForgotPasswordRequestPayload,
  LoginChallengeResponse,
  ResetPasswordRequestPayload,
} from '@/modular/account';

// Step 1: Request password reset code
export async function requestPasswordReset(payload: ForgotPasswordRequestPayload): Promise<string> {
  const response = await http.post<LoginChallengeResponse>('/auth/forgot-password', payload);
  return response.data.challengeId;
}

// Step 2: Submit verification code and new password
export async function submitNewPassword(payload: ResetPasswordRequestPayload): Promise<void> {
  await http.post<null>('/auth/reset-password', payload);
}
```

---

## 7. Zustand Store Integration & Token Security

The client application integrates a production-grade Zustand store (`useAuthStore`) in `apps/web/modular/account/store/auth.store.ts` for reactive session management and automatic token injection.

### A. In-Memory Token Security Model

In compliance with OWASP guidelines and modern SPA security best practices:

1. **Short-Lived Access Token (8 minutes)**:
   - Stored **exclusively in JavaScript memory** inside the Zustand store (`accessToken: string | null`).
   - **Never persisted in `localStorage` or `sessionStorage`**, preventing token exfiltration via Cross-Site Scripting (XSS).
2. **Long-Lived Refresh Token (7 hours)**:
   - Stored in an **HTTP-only, Secure, SameSite=Lax** browser cookie.
   - Completely inaccessible to client-side JavaScript (`document.cookie` cannot read or steal it).
   - Automatically attached by the browser on `/auth/refresh` requests when `withCredentials: true`.

### B. Axios Automatic Token Injection

The centralized Axios client (`apps/web/modular/lib/http/axios-client.ts`) directly reads the in-memory access token on every outgoing HTTP request:

```typescript
// Request Interceptor: Injects Bearer token automatically
instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### C. 401 Session Expiration & Refresh Flow

When an access token expires (after 8 minutes), protected API requests respond with `401 Unauthorized`. The Axios response interceptor immediately reacts:

```typescript
// Response Interceptor: Catches 401 and flags session expiration
if (status === 401 && typeof window !== 'undefined') {
  useAuthStore.getState().setSessionExpired(true);
  window.dispatchEvent(new CustomEvent('auth:unauthorized'));
}
```

### D. Store Actions & Helper Utilities

```typescript
import { useAuthStore, getAuthToken, isAuthenticated } from '@/modular/account';

// 1. Inside React Components:
const { user, isLoggedIn, logout } = useAuthStore();

// 2. Outside React Components (e.g. background tasks, Axios interceptors):
const token = getAuthToken(); // returns string | null
const isAuthed = isAuthenticated(); // returns boolean
```
