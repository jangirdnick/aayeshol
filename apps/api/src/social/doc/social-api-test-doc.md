# Aayeshol Social Media OAuth Integration - API Testing & Integration Guide

Is document me **Social Account Connection & OAuth Integration** ke sabhi API endpoints ko test karne ka complete step-by-step guide diya gaya hai. Yeh document Frontend Developers, Backend Engineers aur QA Testers ke liye exact reference provide karta hai (Postman, Browser, aur cURL testing ke liye).

---

## 1. Overview & Core Architecture Rules

> **Important Architectural Rule:**
> Yeh feature **Social Media Automation & Publishing** (YouTube, LinkedIn, X, Instagram) ke liye banaya gaya hai.
> Yeh Aayeshol application ka login/signup feature **nahi** hai. Iska use sirf ek already logged-in Aayeshol user ke social profiles ko connect karne ke liye hota hai.

### Global Response Envelope (`ApiSuccessResponse<T>`)

Jab API se direct JSON format me response manga jata hai (`Accept: application/json` ya `?format=json`), response standard wrapper me return hota hai:

#### Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Human readable success message (safe for Toast notification)",
  "data": {/* Response payload */}
}
```

#### Generic Error Response (`4xx / 5xx`)

```json
{
  "statusCode": 400,
  "message": "Invalid, expired, or already used OAuth state",
  "error": "Bad Request"
}
```

---

## 2. Authentication Requirement

Sabhi Social Connection endpoints ko initiate karne ke liye user ka pehle se Aayeshol me login hona zaroori hai.
Request me **Bearer Access Token** bhejna mandatory hai:

```http
Authorization: Bearer <AAYESHOL_JWT_ACCESS_TOKEN>
```

---

## 3. Endpoints Matrix

| Action                      | Method   | URL Path                         | Auth Required                | Success Response / Behavior                                  |
| :-------------------------- | :------- | :------------------------------- | :--------------------------- | :----------------------------------------------------------- |
| **YouTube Connect**         | `GET`    | `/api/social/youtube`            | **Yes (Bearer JWT)**         | `302 Redirect` to Google Consent Screen                      |
| **YouTube Callback**        | `GET`    | `/api/social/youtube/callback`   | **Public (State Protected)** | `302 Redirect` to Frontend `/settings/connections` (or JSON) |
| **LinkedIn Connect**        | `GET`    | `/api/social/linkedin`           | **Yes (Bearer JWT)**         | `302 Redirect` to LinkedIn Consent Screen                    |
| **LinkedIn Callback**       | `GET`    | `/api/social/linkedin/callback`  | **Public (State Protected)** | `302 Redirect` to Frontend `/settings/connections` (or JSON) |
| **X (Twitter) Connect**     | `GET`    | `/api/social/x`                  | **Yes (Bearer JWT)**         | `302 Redirect` to X v2 PKCE Consent Screen                   |
| **X Callback**              | `GET`    | `/api/social/x/callback`         | **Public (State Protected)** | `302 Redirect` to Frontend `/settings/connections` (or JSON) |
| **Instagram Connect**       | `GET`    | `/api/social/instagram`          | **Yes (Bearer JWT)**         | `302 Redirect` to Instagram Consent Screen                   |
| **Instagram Callback**      | `GET`    | `/api/social/instagram/callback` | **Public (State Protected)** | `302 Redirect` to Frontend `/settings/connections` (or JSON) |
| **List Connected Accounts** | `GET`    | `/api/social/accounts`           | **Yes (Bearer JWT)**         | `200 OK` JSON with connected accounts                        |
| **Disconnect Account**      | `DELETE` | `/api/social/accounts/:id`       | **Yes (Bearer JWT)**         | `200 OK` JSON confirmation                                   |

---

## 4. Detailed API Specifications & Testing Steps

---

### A. YouTube (Google OAuth 2.0)

#### 1. Initiate Connection

User ko Google consent screen par redirect karne ke liye request bheji jati hai.

- **Endpoint:** `GET /api/social/youtube`
- **Headers:**
  ```http
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI...
  ```
- **Backend Flow:**
  1. `JwtAuthGuard` verify karta hai ki caller authenticated user hai (`req.user.userId`).
  2. `YoutubeOAuthGuard` cryptographically secure `UUIDv4` state generate karta hai.
  3. State ko Redis me 10-minute TTL ke saath save karta hai (`social:oauth-state:<state>`).
  4. Google OAuth 2.0 authorization URL par `302 Redirect` karta hai with requested offline scopes (`youtube`, `youtube.force-ssl`, `youtube.upload`, `youtube.readonly`, `drive.readonly`, `drive.file`, `userinfo.profile`, `userinfo.email`).
- **Response:**
  - `302 Found`
  - `Location: https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=...&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fsocial%2Fyoutube%2Fcallback&scope=...&state=<UUID>&access_type=offline&prompt=consent`

#### 2. Provider Callback

Google consent dene ke baad browser ko is callback URL par redirect karta hai:

- **Endpoint:** `GET /api/social/youtube/callback`
- **Query Parameters:**
  - `code` (string, required): Google authorization code.
  - `state` (string, required): Original state UUID.
  - `scope` (string, optional): Granted scopes.
- **Backend Flow:**
  1. Passport strategy authorization code ko exchange karke tokens (`access_token`, `refresh_token`, `expires_in`) aur Google profile fetch karti hai.
  2. `SocialService` Redis se state verify karke immediately delete (evict) karta hai (Replay Attack protection).
  3. Tokens ko AES-256-GCM se encrypt karta hai.
  4. Prisma `$transaction` me `SocialAccount` aur `SocialToken` upsert karta hai.
  5. User ko Resend ke through connection confirmation email dispatch karta hai.
  6. Frontend dashboard par redirect karta hai.
- **Standard Browser Response:**
  - `302 Found`
  - `Location: http://localhost:3000/settings/connections?status=success&platform=youtube&account=My%20Channel`
- **JSON Mode Response (`format=json` ya `Accept: application/json`):**
  - **Status:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Social account connected successfully",
    "data": {
      "id": "cm4abc1230001...",
      "provider": "YOUTUBE",
      "name": "Tech Reviews Channel",
      "email": "creator@gmail.com",
      "avatar": "https://lh3.googleusercontent.com/...",
      "connectedAt": "2026-10-11T17:40:00.000Z"
    }
  }
  ```

---

### B. LinkedIn (OAuth 2.0)

#### 1. Initiate Connection

- **Endpoint:** `GET /api/social/linkedin`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response:** `302 Redirect` to `https://www.linkedin.com/oauth/v2/authorization?...`

#### 2. Provider Callback

- **Endpoint:** `GET /api/social/linkedin/callback`
- **Query Parameters:** `code=<AUTH_CODE>&state=<STATE_UUID>`
- **Response (Browser):**
  - `302 Found`
  - `Location: http://localhost:3000/settings/connections?status=success&platform=linkedin&account=John%20Doe`
- **Response (JSON Mode):**
  - **Status:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Social account connected successfully",
    "data": {
      "id": "cm4def4560002...",
      "provider": "LINKEDIN",
      "name": "Nandlal Jangid",
      "email": "nandlal@example.com",
      "avatar": "https://media.licdn.com/dms/image/...",
      "connectedAt": "2026-10-11T17:42:00.000Z"
    }
  }
  ```

---

### C. X / Twitter (OAuth 2.0 with PKCE)

#### 1. Initiate Connection

- **Endpoint:** `GET /api/social/x`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response:** `302 Redirect` to `https://twitter.com/i/oauth2/authorize?...` with PKCE parameters (`code_challenge`).

#### 2. Provider Callback

- **Endpoint:** `GET /api/social/x/callback`
- **Query Parameters:** `code=<AUTH_CODE>&state=<STATE_UUID>`
- **Response (Browser):**
  - `302 Found`
  - `Location: http://localhost:3000/settings/connections?status=success&platform=x&account=%40nickdev`
- **Response (JSON Mode):**
  - **Status:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Social account connected successfully",
    "data": {
      "id": "cm4ghi7890003...",
      "provider": "X_TWITTER",
      "name": "@nickdev",
      "email": null,
      "avatar": "https://pbs.twimg.com/profile_images/...",
      "connectedAt": "2026-10-11T17:45:00.000Z"
    }
  }
  ```

---

### D. Instagram (Graph API)

#### 1. Initiate Connection

- **Endpoint:** `GET /api/social/instagram`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response:** `302 Redirect` to `https://api.instagram.com/oauth/authorize?...`

#### 2. Provider Callback

- **Endpoint:** `GET /api/social/instagram/callback`
- **Query Parameters:** `code=<AUTH_CODE>&state=<STATE_UUID>`
- **Response (Browser):**
  - `302 Found`
  - `Location: http://localhost:3000/settings/connections?status=success&platform=instagram&account=%40myinsta`
- **Response (JSON Mode):**
  - **Status:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Social account connected successfully",
    "data": {
      "id": "cm4jkl0120004...",
      "provider": "INSTAGRAM",
      "name": "@myinsta",
      "email": null,
      "avatar": null,
      "connectedAt": "2026-10-11T17:48:00.000Z"
    }
  }
  ```

---

### E. Get Connected Accounts List

Authenticated user ke sabhi active social accounts ki list fetch karta hai. **Security note:** Tokens (`accessToken`, `refreshToken`) kabhi bhi return nahi hote.

- **Endpoint:** `GET /api/social/accounts`
- **Method:** `GET`
- **Headers:**
  ```http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  ```
- **Status Code:** `200 OK`
- **Response Payload:**
  ```json
  {
    "success": true,
    "message": "Connected accounts retrieved successfully",
    "data": [
      {
        "id": "cm4abc1230001",
        "provider": "YOUTUBE",
        "providerId": "UC1234567890",
        "name": "Tech Reviews Channel",
        "email": "creator@gmail.com",
        "avatar": "https://lh3.googleusercontent.com/...",
        "createdAt": "2026-10-11T17:40:00.000Z",
        "updatedAt": "2026-10-11T17:40:00.000Z",
        "hasRefreshToken": true,
        "tokenExpiresAt": "2026-10-11T18:40:00.000Z"
      },
      {
        "id": "cm4def4560002",
        "provider": "LINKEDIN",
        "providerId": "urn:li:person:xyz987",
        "name": "Nandlal Jangid",
        "email": "nandlal@example.com",
        "avatar": "https://media.licdn.com/dms/image/...",
        "createdAt": "2026-10-11T17:42:00.000Z",
        "updatedAt": "2026-10-11T17:42:00.000Z",
        "hasRefreshToken": false,
        "tokenExpiresAt": "2026-12-10T17:42:00.000Z"
      }
    ]
  }
  ```

---

### F. Disconnect Social Account

Ek connected social account aur uske corresponding AES-encrypted tokens ko permanent delete karta hai.

- **Endpoint:** `DELETE /api/social/accounts/:id`
- **Method:** `DELETE`
- **Path Parameters:**
  - `id` (string, required): `SocialAccount` ki CUID ID.
- **Headers:**
  ```http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  ```
- **Status Code:** `200 OK`
- **Response Payload:**
  ```json
  {
    "success": true,
    "message": "Social account disconnected successfully",
    "data": null
  }
  ```

---

## 5. Error Scenarios & Status Codes

| Scenario                                                   | HTTP Status        | Response / Behavior                                                                                                                   |
| :--------------------------------------------------------- | :----------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| **Missing Bearer Token on Initiate**                       | `401 Unauthorized` | `{"statusCode": 401, "message": "Missing access token", "error": "Unauthorized"}`                                                     |
| **User cancels on provider consent screen**                | `302 Redirect`     | Redirects to `${FRONTEND_URL}/settings/connections?status=error&message=User%20denied%20authorization`                                |
| **Missing / Expired State on Callback**                    | `400 Bad Request`  | `{"statusCode": 400, "message": "Invalid, expired, or already used OAuth state", "error": "Bad Request"}`                             |
| **State Platform Mismatch**                                | `400 Bad Request`  | `{"statusCode": 400, "message": "OAuth state platform mismatch", "error": "Bad Request"}`                                             |
| **Social Account Already Linked to Another User**          | `409 Conflict`     | `{"statusCode": 409, "message": "This YOUTUBE account is already connected to another Aayeshol user workspace", "error": "Conflict"}` |
| **Account to disconnect not found or owned by other user** | `404 Not Found`    | `{"statusCode": 404, "message": "Connected social account not found", "error": "Not Found"}`                                          |

---

## 6. How to Test (Step-by-Step)

### Step 1: Login in Aayeshol & Get Access Token

Pehle regular login API (`POST /api/auth/login` + `POST /api/auth/verify-otp`) call karke Bearer Access Token hasil karein.

### Step 2: Open Browser and Initiate

Browser me new tab open karein aur initiate endpoint par visit karein:

```
http://localhost:3001/api/social/youtube
```

_(Tip: Agar browser se directly open kar rahe hain, to headers ke bajaye frontend app me button click karein jo Bearer token bhejta hai ya window redirect karta hai)._

### Step 3: Grant Consent on Provider Screen

Google / LinkedIn / Twitter / Instagram screen par jaakar permissions approve karein.

### Step 4: Verify Callback Execution & Redirect

App automatically redirect hogi:
`http://localhost:3000/settings/connections?status=success&platform=youtube&account=MyChannel`

### Step 5: Verify Confirmation Email (Resend)

User ke registered email inbox me Resend se confirmation email verify karein:

- **Subject:** `Social Account Connected: YouTube`
- **Template:** Dark theme card with connected platform and account name details.

### Step 6: Verify Database Records (Prisma)

PostgreSQL me check karein:

1. `SocialAccount` table me new row created hai with `userId`.
2. `SocialToken` table me `accessToken` format `iv:authTag:ciphertext` me encrypted hai (Plaintext token leak nahi hua).
