# Aayeshol Authentication API Documentation

This document describes all available endpoints in the Authentication module along with strict **DTO Validation Rules**. It serves as an exact reference for frontend integration and API testing (e.g. Postman, Insomnia).

---

## Global Response Envelope

All API endpoints return data wrapped in a standardized envelope.

### Success Response (`2xx`)

```json
{
  "success": true,
  "message": "Human readable message (safe to display in Toast notifications)",
  "data": {/* Response Payload */}
}
```

_(If there is no data to return, `"data": null`)_

### Generic Error Response (`4xx/5xx`)

```json
{
  "success": false,
  "message": "Human readable error message",
  "error": "Error Type/Context"
}
```

### Validation Error Response (`400 Bad Request`)

When DTO validation fails (e.g., missing required fields, weak password, invalid email format), NestJS `ValidationPipe` returns a `400 Bad Request` with structured error messages:

```json
{
  "statusCode": 400,
  "message": [
    "Email is required.",
    "Please provide a valid email address.",
    "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, and 1 number."
  ],
  "error": "Bad Request"
}
```

---

## DTO Validation Summary

The API enforces strict validation using `class-validator` and automatic transformation using `class-transformer`:

| Field Type                             | Rules & Decorators                                                                                                                                                        | Notes / Sanitization                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Email**                              | `@IsNotEmpty()`, `@IsEmail()`, `@MaxLength(255)`                                                                                                                          | Automatically trimmed and lowercased                         |
| **Strong Password** (Register & Reset) | `@IsNotEmpty()`, `@IsString()`, `@MinLength(8)`, `@MaxLength(128)`, `@IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })` | Must include at least 1 uppercase, 1 lowercase, and 1 number |
| **Login Password**                     | `@IsNotEmpty()`, `@IsString()`, `@MinLength(1)`, `@MaxLength(128)`                                                                                                        | Cannot be empty or exceed 128 characters                     |
| **Name / Last Name**                   | `@IsNotEmpty()` (name), `@IsOptional()` (lastName), `@MinLength(2)` (name), `@MaxLength(60)`                                                                              | Whitespace automatically trimmed                             |
| **OTP Code**                           | `@IsNotEmpty()`, `@IsString()`, `@Length(6, 6)`                                                                                                                           | Exactly 6 numeric characters                                 |
| **Challenge ID**                       | `@IsNotEmpty()`, `@IsString()`                                                                                                                                            | Valid UUID string returned from initial step                 |

---

## 1. Register User

Creates a new account and sends an email verification OTP to the user.

- **URL:** `/auth/register`
- **Method:** `POST`
- **Auth Required:** No

### Request DTO Validation & Body

```json
{
  "name": "John", // Required | string | min 2, max 60 chars | trimmed
  "lastName": "Doe", // Optional | string | max 60 chars | trimmed
  "email": "john.doe@example.com", // Required | valid email | max 255 chars | lowercased & trimmed
  "password": "SecurePassword123", // Required | string | 8-128 chars | min 1 uppercase, 1 lowercase, 1 number
  "avatar": "https://example.com/avatar.jpg" // Optional | valid URL | max 500 chars
}
```

#### Field Validation Rules:

- `name`: Required (`@IsNotEmpty`). Must be a string between 2 and 60 characters. Leading/trailing whitespace is auto-trimmed.
- `lastName`: Optional. If provided, must be a string up to 60 characters. Auto-trimmed.
- `email`: Required (`@IsNotEmpty`). Must be a valid email format (`@IsEmail`) up to 255 characters. Automatically transformed to lowercase and trimmed.
- `password`: Required (`@IsNotEmpty`). Must be 8 to 128 characters long and meet strong password criteria (`@IsStrongPassword`: min 1 uppercase, min 1 lowercase, min 1 number).
- `avatar`: Optional. If provided, must be a valid URL (`@IsUrl`) up to 500 characters.

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

> **Frontend Flow:** Save `challengeId`. Prompt the user for the 6-digit OTP sent to their email and send both to `/auth/verify-email`.

---

## 2. Verify Email

Validates the OTP sent during registration.

- **URL:** `/auth/verify-email`
- **Method:** `POST`
- **Auth Required:** No

### Request DTO Validation & Body

```json
{
  "challengeId": "550e8400-e29b-41d4-a716-446655440000", // Required | string
  "otp": "123456" // Required | string | exactly 6 characters
}
```

#### Field Validation Rules:

- `challengeId`: Required (`@IsNotEmpty`). Must be a string.
- `otp`: Required (`@IsNotEmpty`). Must be a 6-digit string (`@Length(6, 6)`).

### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": null
}
```

> **Frontend Flow:** Redirect the user to the Login page.

---

## 3. Resend Verification Email

Requests a new email verification OTP if the previous one expired or was not received.

- **URL:** `/auth/resend-verification`
- **Method:** `POST`
- **Auth Required:** No

### Request DTO Validation & Body

```json
{
  "email": "john.doe@example.com" // Required | valid email | max 255 chars | lowercased & trimmed
}
```

#### Field Validation Rules:

- `email`: Required (`@IsNotEmpty`). Must be a valid email up to 255 characters (`@IsEmail`). Auto-lowercased and trimmed.

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

Validates email and password credentials, then sends a 2FA OTP to the user's email.

- **URL:** `/auth/login`
- **Method:** `POST`
- **Auth Required:** No

### Request DTO Validation & Body

```json
{
  "email": "john.doe@example.com", // Required | valid email | max 255 chars | lowercased & trimmed
  "password": "SecurePassword123" // Required | string | min 1, max 128 chars
}
```

#### Field Validation Rules:

- `email`: Required (`@IsNotEmpty`). Valid email format up to 255 characters (`@IsEmail`). Lowercased and trimmed.
- `password`: Required (`@IsNotEmpty`). String between 1 and 128 characters.

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

> **Frontend Flow:** Store `challengeId` and display the OTP verification screen.

---

## 5. Verify Login OTP (Step 2)

Verifies the 2FA OTP, logs the user in, returns an access token in the JSON body, and sets the HTTP-only Refresh Token cookie.

- **URL:** `/auth/verify-otp`
- **Method:** `POST`
- **Auth Required:** No

### Request DTO Validation & Body

```json
{
  "challengeId": "550e8400-e29b-41d4-a716-446655440000", // Required | string
  "otp": "123456" // Required | string | exactly 6 characters
}
```

#### Field Validation Rules:

- `challengeId`: Required (`@IsNotEmpty`). Must be a string.
- `otp`: Required (`@IsNotEmpty`). Must be a 6-digit string (`@Length(6, 6)`).

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
      "email": "john.doe@example.com",
      "emailVerified": true,
      "avatar": "https://example.com/avatar.jpg",
      "role": "USER",
      "createdAt": "2026-10-08T10:00:00.000Z",
      "updatedAt": "2026-10-08T10:00:00.000Z"
    }
  }
}
```

> **Note:** Set-Cookie header automatically includes `refresh_token` (`HttpOnly`, `SameSite=Lax`, `Secure` in production). Store `accessToken` in application memory.

---

## 6. Refresh Token

Generates a new access token using the valid HTTP-only refresh token cookie.

- **URL:** `/auth/refresh`
- **Method:** `POST`
- **Auth Required:** No (Requires HTTP-only `refresh_token` cookie)

### Request Body

_None_

### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Tokens refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUz..."
  }
}
```

---

## 7. Get Current User Profile

Fetches profile details of the authenticated user.

- **URL:** `/auth/me`
- **Method:** `GET`
- **Auth Required:** Yes (Bearer Token in `Authorization` header)

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
    "email": "john.doe@example.com",
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

Initiates a password reset by sending an OTP code to the user's email.

- **URL:** `/auth/forgot-password`
- **Method:** `POST`
- **Auth Required:** No

### Request DTO Validation & Body

```json
{
  "email": "john.doe@example.com" // Required | valid email | max 255 chars | lowercased & trimmed
}
```

#### Field Validation Rules:

- `email`: Required (`@IsNotEmpty`). Valid email format up to 255 characters (`@IsEmail`). Lowercased and trimmed.

### Success Response (`200 OK`)

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

## 9. Reset Password

Resets the account password using the 6-digit OTP code.

- **URL:** `/auth/reset-password`
- **Method:** `POST`
- **Auth Required:** No

### Request DTO Validation & Body

```json
{
  "challengeId": "550e8400-e29b-41d4-a716-446655440000", // Required | string
  "otp": "123456", // Required | string | exactly 6 characters
  "newPassword": "NewSecurePassword123" // Required | string | 8-128 chars | min 1 uppercase, 1 lowercase, 1 number
}
```

#### Field Validation Rules:

- `challengeId`: Required (`@IsNotEmpty`). Must be a string.
- `otp`: Required (`@IsNotEmpty`). Must be a 6-digit string (`@Length(6, 6)`).
- `newPassword`: Required (`@IsNotEmpty`). Must be 8 to 128 characters long and satisfy strong password requirements (`@IsStrongPassword`: min 1 uppercase, 1 lowercase, 1 number).

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

Terminates the user session and invalidates the refresh token cookie.

- **URL:** `/auth/logout`
- **Method:** `POST`
- **Auth Required:** Yes (Bearer Token in `Authorization` header)

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
