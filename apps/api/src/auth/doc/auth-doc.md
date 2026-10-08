# Aayeshol Authentication API Documentation

This document describes all available endpoints in the Authentication module. It is designed to act as a reference for frontend developers and for testing via Postman.

## Global Response Envelope

All API endpoints return data wrapped in a standardized envelope.

**Success Response (2xx)**

```json
{
  "success": true,
  "message": "Human readable message (safe to display in Toast notifications)",
  "data": {/* Response Payload */}
}
```

_(If there is no data to return, `"data": null`)_

**Error Response (4xx/5xx)**

```json
{
  "success": false,
  "message": "Human readable error message",
  "error": "Error Type/Context"
}
```

---

## 1. Register User

Creates a new account and sends an OTP to the provided email.

- **URL:** `/auth/register`
- **Method:** `POST`
- **Auth Required:** No

### Request Body

```json
{
  "name": "John",
  "lastName": "Doe", // Optional
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "avatar": "https://example.com/avatar.jpg" // Optional
}
```

### Success Response (`201 Created`)

```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "challengeId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-uuid"
  }
}
```

> **Frontend Flow:** Save the `challengeId` from this response. You will need to send it along with the OTP that the user types in to the `/auth/verify-email` endpoint.

---

## 2. Verify Email

Validates the OTP sent during registration.

- **URL:** `/auth/verify-email`
- **Method:** `POST`
- **Auth Required:** No

### Request Body

```json
{
  "challengeId": "550e8400-e29b-41d4-a716-446655440000",
  "otp": "123456"
}
```

### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": null
}
```

> **Frontend Flow:** Redirect the user to the Login page after this is successful.

---

## 3. Resend Verification Email

If the user didn't receive the OTP or it expired, request a new one.

- **URL:** `/auth/resend-verification`
- **Method:** `POST`
- **Auth Required:** No

### Request Body

```json
{
  "email": "john@example.com"
}
```

### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "If your email is registered and unverified, a new verification code has been sent.",
  "data": null
}
```

---

## 4. Login (Step 1)

Validates email and password, then sends a Two-Factor OTP to the user's email.

- **URL:** `/auth/login`
- **Method:** `POST`
- **Auth Required:** No

### Request Body

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "A verification code has been sent to your email.",
  "data": {
    "challengeId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

> **Frontend Flow:** Keep the `challengeId`. Show the OTP input screen to the user.

---

## 5. Verify Login OTP (Step 2)

Verifies the OTP and logs the user in, returning the access token and setting the HTTP-only Refresh Token cookie.

- **URL:** `/auth/verify-otp`
- **Method:** `POST`
- **Auth Required:** No

### Request Body

```json
{
  "challengeId": "550e8400-e29b-41d4-a716-446655440000",
  "otp": "123456"
}
```

### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUz...",
    "user": {
      "id": "user-uuid",
      "name": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "emailVerified": true,
      "avatar": "https://example.com/avatar.jpg",
      "role": "USER",
      "createdAt": "2026-10-08T10:00:00.000Z",
      "updatedAt": "2026-10-08T10:00:00.000Z"
    }
  }
}
```

> **Note:** A `refreshToken` is also set in the response headers as an `HttpOnly`, `Secure` cookie. You don't need to manually store it in the frontend. Store `accessToken` in memory.

---

## 6. Refresh Token

Generates a new access token using the HTTP-only refresh token cookie.

- **URL:** `/auth/refresh`
- **Method:** `POST`
- **Auth Required:** No (but requires the valid Refresh Token cookie)

### Request Body

_None_

### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Tokens refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUz... (new token)"
  }
}
```

---

## 7. Get Current User Profile

Fetches the profile of the currently logged-in user.

- **URL:** `/auth/me`
- **Method:** `GET`
- **Auth Required:** Yes (Requires Bearer token)

### Headers

```
Authorization: Bearer <accessToken>
```

### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "User profile",
  "data": {
    "id": "user-uuid",
    "name": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "emailVerified": true,
    "avatar": "https://example.com/avatar.jpg",
    "role": "USER",
    "createdAt": "2026-10-08T10:00:00.000Z",
    "updatedAt": "2026-10-08T10:00:00.000Z"
  }
}
```

---

## 8. Forgot Password

Sends a password reset OTP to the user's email.

- **URL:** `/auth/forgot-password`
- **Method:** `POST`
- **Auth Required:** No

### Request Body

```json
{
  "email": "john@example.com"
}
```

### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "If this email is registered, you will receive a password reset code shortly.",
  "data": null
}
```

---

## 9. Reset Password

Resets the password using the OTP from the email.

- **URL:** `/auth/reset-password`
- **Method:** `POST`
- **Auth Required:** No

### Request Body

```json
{
  "challengeId": "550e8400-e29b-41d4-a716-446655440000",
  "otp": "123456",
  "newPassword": "NewSecurePassword123!"
}
```

### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Password has been reset successfully. Please log in with your new password.",
  "data": null
}
```

---

## 10. Logout

Logs the user out, invalidating their current session and clearing the refresh token cookie.

- **URL:** `/auth/logout`
- **Method:** `POST`
- **Auth Required:** Yes (Requires Bearer token)

### Headers

```
Authorization: Bearer <accessToken>
```

### Request Body

_None_

### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```
