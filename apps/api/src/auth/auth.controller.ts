import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as crypto from 'node:crypto';

import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { Public } from './decorators/public.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { REFRESH_TOKEN_COOKIE } from './utils/token.util.js';
import type { AuthenticatedUser, RequestContext } from './types/auth.types.js';

/**
 * Authentication Controller handling HTTP endpoints under `/api/auth`.
 *
 * ### Context
 * Serves as the primary entry point for HTTP authentication workflows within Aayeshol v2.
 * It interfaces between client REST requests and the underlying `AuthService` business logic layer.
 *
 * ### Actual Behavior
 * - Exposes public authentication routes (user registration, email verification, 2FA/login OTP, password recovery, refresh token rotation).
 * - Exposes protected routes (session termination, user profile retrieval).
 * - Extracts request metadata (Request ID, IP address, User-Agent) via a private `getRequestContext` helper
 *   and injects it into service invocations for centralized structured logging and telemetry audit trails.
 *
 * ### Purpose
 * Provides a secure, standardized REST API for account lifecycle management, session establishment, and token lifecycle control.
 *
 * ### Usage
 * Managed by `AuthModule`. Protected routes require a valid Bearer JWT access token evaluated by `JwtAuthGuard`
 * unless annotated with the `@Public()` custom decorator.
 *
 * ### Security & Architecture
 * - Employs a 2-Step OTP authentication process for login and registration.
 * - Stores refresh tokens securely in `httpOnly` cookies with Strict/Lax SameSite flags.
 * - Enforces Refresh Token Rotation (RTR) to prevent token reuse and session hijacking.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Helper method to construct a structured `RequestContext` object from Express `Request` headers.
   *
   * ### Context
   * Needed to ensure every authentication service call carries client environment telemetry for structured logging.
   *
   * ### Actual Behavior
   * Extracts or generates:
   * - `requestId`: Reads `x-request-id` header or generates a random UUID v4 if missing.
   * - `ipAddress`: Resolves the client IP from `x-forwarded-for` header (taking the first proxy IP) or fallback `req.ip`.
   * - `userAgent`: Reads the `user-agent` header or defaults to `'unknown'`.
   *
   * @param req - Express `Request` object.
   * @returns Structured `RequestContext` object containing `requestId`, `ipAddress`, and `userAgent`.
   */
  private getRequestContext(req: Request): RequestContext {
    return {
      requestId: (req.headers['x-request-id'] as string | undefined) ?? crypto.randomUUID(),
      ipAddress:
        (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip,
      userAgent: req.headers['user-agent'] ?? 'unknown',
    };
  }

  // ─── PUBLIC ROUTES ────────────────────────────────────────────────────────

  /**
   * `POST /api/auth/register`
   * Registers a new user account and initiates email verification.
   *
   * ### Context
   * Endpoint for initial user onboarding. Initiates account creation in an unverified state.
   *
   * ### Actual Behavior
   * Delegates registration to `AuthService.register()`:
   * 1. Checks if the email is already registered in PostgreSQL.
   * 2. Hashes password using bcrypt (12 rounds).
   * 3. Creates an unverified `User` record in DB.
   * 4. Generates a 6-digit verification OTP and stores its SHA-256 hash in Redis (`auth:email-verify:{challengeId}`) with a 15-minute TTL.
   * 5. Dispatches a verification email via `MailService` (Resend).
   *
   * ### Purpose
   * Registers user credentials safely while verifying email ownership before granting full platform access.
   *
   * @param dto - `RegisterDto` containing user full name, email, and raw password.
   * @param req - Express `Request` object used to extract request telemetry.
   * @returns `ApiResponse` containing 201 Created status, success message, `challengeId`, and challenge expiration timestamp.
   *
   * @throws `ConflictException` (409) - If an account with the specified email already exists.
   * @throws `InternalServerErrorException` (500) - If password hashing, database operations, or email delivery fails.
   *
   * @security Public endpoint (`@Public()`). Password validation rules enforced via DTO pipes.
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, this.getRequestContext(req));
  }

  /**
   * `POST /api/auth/verify-email`
   * Verifies the user's email address using the registration OTP challenge.
   *
   * ### Context
   * Step 2 of registration onboarding. Activates user accounts upon successful OTP validation.
   *
   * ### Actual Behavior
   * Delegates verification to `AuthService.verifyEmail()`:
   * 1. Fetches the OTP challenge from Redis using `challengeId`.
   * 2. Increments failed attempt counter (invalidates challenge if attempts exceed 5).
   * 3. Compares SHA-256 hash of the provided OTP against the stored challenge hash.
   * 4. Updates `User.isEmailVerified` to `true` in PostgreSQL DB.
   * 5. Deletes the challenge key from Redis.
   *
   * ### Purpose
   * Confirms email address authenticity before allowing the user to initiate login sessions.
   *
   * @param dto - `VerifyEmailDto` containing `challengeId` and 6-digit numeric `otp`.
   * @param req - Express `Request` object used to extract request telemetry.
   * @returns `ApiResponse` containing 200 OK status and account verification confirmation.
   *
   * @throws `BadRequestException` (400) - If the challenge is invalid, expired, OTP is incorrect, or maximum attempts (5) are exceeded.
   *
   * @security Public endpoint (`@Public()`). Rate limited by max failed attempts in Redis challenge payload.
   */
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: Request) {
    return this.authService.verifyEmail(dto, this.getRequestContext(req));
  }

  /**
   * `POST /api/auth/resend-verification`
   * Resends the email verification OTP for an unverified user account.
   *
   * ### Context
   * Recovery endpoint for users whose registration OTP expired or was not received.
   *
   * ### Actual Behavior
   * Delegates resending to `AuthService.resendVerification()`:
   * 1. Finds user by email in PostgreSQL DB and asserts `isEmailVerified === false`.
   * 2. Generates a new 6-digit OTP and stores its SHA-256 hash under a fresh `challengeId` in Redis (15-min TTL).
   * 3. Sends a new verification email via `MailService`.
   *
   * ### Purpose
   * Ensures users are not locked out of registration onboarding due to transient email delivery failures or expired TTLs.
   *
   * @param email - Registered user's email address from request body.
   * @param req - Express `Request` object used to extract request telemetry.
   * @returns `ApiResponse` containing 200 OK status, new `challengeId`, and expiration timestamp.
   *
   * @throws `BadRequestException` (400) - If the user does not exist or has already verified their email.
   *
   * @security Public endpoint (`@Public()`). Prevents issuing OTPs to already verified accounts.
   */
  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(@Body('email') email: string, @Req() req: Request) {
    return this.authService.resendVerification(email, this.getRequestContext(req));
  }

  /**
   * `POST /api/auth/login`
   * Step 1 of Two-Factor Login: Validates user credentials and dispatches a login OTP.
   *
   * ### Context
   * Initial stage of account authentication. Verifies primary password credentials before requiring OTP verification.
   *
   * ### Actual Behavior
   * Delegates primary authentication to `AuthService.login()`:
   * 1. Queries PostgreSQL for user record by email.
   * 2. Verifies password against stored bcrypt hash (12 rounds).
   * 3. Asserts that the account's email address is verified (`isEmailVerified === true`).
   * 4. Generates a 6-digit OTP, stores its SHA-256 hash in Redis (`auth:login-otp:{challengeId}`) with a 5-minute TTL.
   * 5. Sends login OTP to the user's email address via `MailService`.
   *
   * ### Purpose
   * Implements two-step login security to protect accounts against credential stuffing and stolen passwords.
   *
   * @param dto - `LoginDto` containing user `email` and raw `password`.
   * @param req - Express `Request` object used to extract request telemetry.
   * @returns `ApiResponse` containing 200 OK status, `challengeId`, masked target email, and challenge expiration timestamp.
   *
   * @throws `UnauthorizedException` (401) - If email is not found, password does not match, or email is unverified.
   *
   * @security Public endpoint (`@Public()`). Does not return session tokens; requires completion of Step 2 (`POST /verify-otp`).
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, this.getRequestContext(req));
  }

  /**
   * `POST /api/auth/verify-otp`
   * Step 2 of Two-Factor Login: Validates the login OTP and issues authentication tokens.
   *
   * ### Context
   * Concluding stage of login authentication. Completes 2FA and establishes a user session.
   *
   * ### Actual Behavior
   * Delegates token issuance to `AuthService.verifyLoginOtp()`:
   * 1. Validates OTP from Redis (`auth:login-otp:{challengeId}`), tracking attempt counters (max 5).
   * 2. On success, removes the Redis challenge key.
   * 3. Generates a short-lived JWT access token (8-minute expiry).
   * 4. Generates a high-entropy random refresh token string.
   * 5. Persists a new `Session` record in PostgreSQL with SHA-256 hashed refresh token, user agent, IP, and 7-hour expiry.
   * 6. Sets `refreshToken` as an `httpOnly`, `SameSite=Lax`, secure cookie on the Express `Response`.
   *
   * ### Purpose
   * Establishes a verified server-side session and provides short-lived access credentials to the client.
   *
   * @param dto - `VerifyLoginOtpDto` containing `challengeId` and 6-digit numeric `otp`.
   * @param res - Express `Response` object used to attach the HTTP-only refresh token cookie.
   * @param req - Express `Request` object used to extract request telemetry.
   * @returns `ApiResponse` containing 200 OK status, user profile details, and JWT `accessToken`.
   *
   * @throws `BadRequestException` (400) - If the challenge is expired, OTP is invalid, or maximum attempts (5) are exceeded.
   * @throws `UnauthorizedException` (401) - If the target user account cannot be found.
   *
   * @security Public endpoint (`@Public()`). Transmits refresh token exclusively via `httpOnly` cookie to protect against XSS attack vectors.
   */
  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyLoginOtp(
    @Body() dto: VerifyLoginOtpDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    return this.authService.verifyLoginOtp(dto, res, this.getRequestContext(req));
  }

  /**
   * `POST /api/auth/forgot-password`
   * Initiates password reset by sending a reset OTP to the user's email.
   *
   * ### Context
   * Self-service password recovery initiation endpoint.
   *
   * ### Actual Behavior
   * Delegates password recovery initiation to `AuthService.forgotPassword()`:
   * 1. Verifies user existence by email in PostgreSQL DB.
   * 2. Generates a 6-digit reset OTP and stores its SHA-256 hash in Redis (`auth:password-reset:{challengeId}`) with a 10-minute TTL.
   * 3. Dispatches password reset email via `MailService`.
   *
   * ### Purpose
   * Allows users who lost their password to initiate account recovery safely via out-of-band email verification.
   *
   * @param dto - `ForgotPasswordDto` containing registered user `email`.
   * @param req - Express `Request` object used to extract request telemetry.
   * @returns `ApiResponse` containing 200 OK status, `challengeId`, and challenge expiration timestamp.
   *
   * @throws `BadRequestException` (400) - If no account is registered with the provided email.
   *
   * @security Public endpoint (`@Public()`). OTP expires strictly after 10 minutes in Redis.
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.authService.forgotPassword(dto, this.getRequestContext(req));
  }

  /**
   * `POST /api/auth/reset-password`
   * Finalizes password reset by verifying OTP challenge and updating user password.
   *
   * ### Context
   * Step 2 of self-service password recovery. Updates credentials and invalidates active sessions.
   *
   * ### Actual Behavior
   * Delegates password update to `AuthService.resetPassword()`:
   * 1. Validates OTP against Redis challenge (`auth:password-reset:{challengeId}`) (max 5 attempts).
   * 2. Hashes new password with bcrypt (12 rounds).
   * 3. Updates `User.password` hash in PostgreSQL DB.
   * 4. Deletes Redis challenge key.
   * 5. Revokes all existing active `Session` records for the user in PostgreSQL DB.
   * 6. Sends password reset confirmation email via `MailService`.
   *
   * ### Purpose
   * Securely replaces forgotten credentials while invalidating existing active sessions to prevent unauthorized access.
   *
   * @param dto - `ResetPasswordDto` containing `challengeId`, 6-digit `otp`, and `newPassword`.
   * @param req - Express `Request` object used to extract request telemetry.
   * @returns `ApiResponse` containing 200 OK status and confirmation message.
   *
   * @throws `BadRequestException` (400) - If challenge is expired, OTP is invalid, or maximum attempts (5) are exceeded.
   *
   * @security Public endpoint (`@Public()`). Automatically revokes all existing active user sessions upon password update.
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.authService.resetPassword(dto, this.getRequestContext(req));
  }

  /**
   * `POST /api/auth/refresh`
   * Rotates refresh tokens and issues a new short-lived JWT access token.
   *
   * ### Context
   * Token refresh endpoint for maintaining authenticated user sessions without re-prompting for credentials.
   *
   * ### Actual Behavior
   * Reads refresh token from `req.cookies.refreshToken` and delegates to `AuthService.refreshTokens()`:
   * 1. Hashes the incoming refresh token using SHA-256.
   * 2. Looks up matching active session in PostgreSQL `Session` table.
   * 3. Asserts session is not expired (7-hour lifespan).
   * 4. Deletes old session record (Refresh Token Rotation - RTR).
   * 5. Generates a new refresh token and stores its SHA-256 hash in a new `Session` DB record.
   * 6. Attaches the new refresh token in `httpOnly` cookie on response.
   * 7. Returns a newly signed JWT access token (8-minute expiry).
   *
   * ### Purpose
   * Implements Refresh Token Rotation (RTR) to keep sessions active while detecting token replay/reuse attacks.
   *
   * @param req - Express `Request` object containing the `refreshToken` cookie.
   * @param res - Express `Response` object used to set the updated `refreshToken` cookie.
   * @returns `ApiResponse` containing 200 OK status and new JWT `accessToken`.
   *
   * @throws `UnauthorizedException` (401) - If `refreshToken` cookie is missing, invalid, expired, or session was revoked.
   *
   * @security Public endpoint (`@Public()`) protected by HTTP-only cookie validation and database session check.
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    return this.authService.refreshTokens(refreshToken, res, this.getRequestContext(req));
  }

  // ─── PROTECTED ROUTES ─────────────────────────────────────────────────────

  /**
   * `POST /api/auth/logout`
   * Terminate the active user session and clear authentication cookies.
   *
   * ### Context
   * Protected endpoint invoked when a user explicitly logs out of the application.
   *
   * ### Actual Behavior
   * Delegates session revocation to `AuthService.logout()`:
   * 1. Extracts refresh token from request cookie.
   * 2. Hashes refresh token with SHA-256 and deletes the corresponding `Session` record from PostgreSQL DB.
   * 3. Clears the `refreshToken` cookie on the client response by setting an expired cookie header.
   *
   * ### Purpose
   * Safely invalidates server-side session state and removes stored credentials from client cookies.
   *
   * @param user - Authenticated user object injected by `JwtAuthGuard` via `@CurrentUser()`.
   * @param req - Express `Request` object containing cookies and request headers.
   * @param res - Express `Response` object used to clear the `refreshToken` cookie.
   * @returns `ApiResponse` containing 200 OK status and logout confirmation message.
   *
   * @throws `UnauthorizedException` (401) - If the user is unauthenticated or the Bearer JWT token is invalid/expired.
   *
   * @security Protected endpoint requiring a valid Bearer JWT access token.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    // For protected routes, user already contains context, but we can pass user as ctx
    return this.authService.logout(user, refreshToken, res, user);
  }

  /**
   * `GET /api/auth/me`
   * Retrieves profile details for the currently authenticated user.
   *
   * ### Context
   * Protected endpoint for client applications to hydrate user session state upon app load or page refresh.
   *
   * ### Actual Behavior
   * Delegates profile fetching to `AuthService.getMe()`:
   * 1. Uses `user.userId` from JWT payload.
   * 2. Queries PostgreSQL `User` table for latest user state.
   * 3. Excludes password hash and returns safe user profile data.
   *
   * ### Purpose
   * Provides client applications with verified, current user account details.
   *
   * @param user - Authenticated user object injected by `JwtAuthGuard` via `@CurrentUser()`.
   * @returns `ApiResponse` containing 200 OK status and `SafeUser` object (ID, email, name, verification status, role, timestamps).
   *
   * @throws `UnauthorizedException` (401) - If Bearer token is missing/invalid or user account no longer exists in DB.
   *
   * @security Protected endpoint requiring a valid Bearer JWT access token.
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user, user);
  }
}
