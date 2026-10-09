import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';
import type { Response } from 'express';

import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../infrastructure/redis/redis.service.js';
import { MailService } from '../infrastructure/mail/mail.service.js';

import {
  generateRefreshToken,
  generateSessionId,
  getRefreshTokenCookieOptions,
  hashRefreshToken,
  REFRESH_TOKEN_COOKIE,
} from './utils/token.util.js';
import { passwordResetConfirmationTemplate } from '../infrastructure/mail/templates/auth-email.templates.js';
import { successResponse } from '../common/response/api-response.js';

import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { VerifyLoginOtpDto } from './dto/verify-login-otp.dto.js';
import type { VerifyEmailDto } from './dto/verify-email.dto.js';
import type { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import type { ResetPasswordDto } from './dto/reset-password.dto.js';
import type {
  AuthenticatedUser,
  EmailVerificationChallenge,
  OtpChallenge,
  RequestContext,
} from './types/auth.types.js';

import { AuthHelperService } from './helpers/auth-helper.service.js';
import {
  BCRYPT_ROUNDS,
  KEY_EMAIL_VERIFY,
  KEY_LOGIN_OTP,
  KEY_PASSWORD_RESET,
  KEY_SESSION_CACHE,
  REFRESH_TOKEN_EXPIRY_MS,
} from './helpers/auth-helper.service.js';

/**
 * Core authentication service for Aayeshol.
 *
 * ### Context
 * Acts as the centralized domain service for all identity and access management workflows within the application.
 *
 * ### Actual Behavior
 * Implements a robust 2-Step OTP authentication process for both user registration and login.
 * Orchestrates interactions between the database (Prisma), caching layer (Redis), and email delivery (MailService).
 * Manages JWT access token issuance and secure HTTP-only refresh token rotation.
 *
 * ### Purpose
 * Protects user data and platform access through modern security best practices, eliminating the reliance on
 * standalone long-lived passwords by introducing mandatory email verification and short-lived OTP challenges.
 *
 * ### Security & Architecture
 * - Passwords are hashed with bcrypt (12 rounds) before storage.
 * - All OTP challenges are hashed with SHA-256 before being temporarily stored in Redis.
 * - Refresh tokens are cryptographically secure random strings, stored as SHA-256 hashes in PostgreSQL.
 * - Access tokens are short-lived (8 min) JWTs signed with a dedicated secret key.
 * - Client sessions track IP addresses, user agents, and device IDs for comprehensive audit trails.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly helper: AuthHelperService,
  ) {}

  // ─── REGISTER ────────────────────────────────────────────────────────────

  /**
   * Registers a new user account and initiates the email verification process.
   *
   * ### Context
   * Step 1 of the user onboarding workflow. Creates the account in an unverified state.
   *
   * ### Actual Behavior
   * 1. Checks PostgreSQL for an existing user with the same email.
   * 2. Hashes the raw password using bcrypt (12 rounds).
   * 3. Executes a Prisma transaction to create the `User` and `Account` records.
   * 4. Generates a 6-digit OTP, stores its SHA-256 hash in Redis, and dispatches a verification email.
   *
   * ### Purpose
   * Securely persists new user credentials while enforcing email ownership verification before granting access.
   *
   * @param dto - Registration payload containing email, password, name, and optional avatar.
   * @param ctx - Request context for structured logging (IP, User-Agent, Request ID).
   * @returns A promise resolving to a success response containing the `challengeId` and `userId`.
   *
   * @throws `ConflictException` if the email is already registered.
   * @throws `InternalServerErrorException` if the database transaction or email dispatch fails.
   *
   * @security Passwords are never stored in plaintext. The account cannot be used to log in until `verifyEmail` is successful.
   */
  async register(dto: RegisterDto, ctx: RequestContext) {
    try {
      const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });

      if (existingUser) {
        throw new ConflictException('An account with this email already exists');
      }

      const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

      const user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: dto.name,
            lastName: dto.lastName ?? null,
            email: dto.email,
            avatar: dto.avatar ?? null,
          },
        });

        await tx.account.create({
          data: {
            userId: newUser.id,
            password: passwordHash,
          },
        });

        return newUser;
      });

      const challengeId = await this.helper.issueEmailVerificationChallenge(
        user.id,
        user.email,
        user.name,
        ctx,
      );

      this.logger.log(
        `User registered: ${user.id} | Email verification OTP sent${this.helper.formatContext(ctx)}`,
      );

      return successResponse(
        'Registration successful. Please check your email to verify your account.',
        {
          challengeId,
          userId: user.id,
        },
      );
    } catch (error) {
      this.helper.handleError(this.logger, `Registration for ${dto.email}`, error, ctx);
    }
  }

  // ─── VERIFY EMAIL ─────────────────────────────────────────────────────────

  /**
   * Verifies the email verification OTP and activates the user account.
   *
   * ### Context
   * Step 2 of the user onboarding workflow. Consumes the challenge created during registration.
   *
   * ### Actual Behavior
   * 1. Retrieves the challenge metadata from Redis using the provided `challengeId`.
   * 2. Validates the submitted OTP against the stored SHA-256 hash (max 5 attempts).
   * 3. Updates the `User.emailVerified` flag to `true` in PostgreSQL.
   * 4. Deletes the challenge key from Redis to prevent replay attacks.
   *
   * ### Purpose
   * Confirms the user owns the provided email address, unlocking the ability to authenticate.
   *
   * @param dto - Verification payload containing the `challengeId` and 6-digit `otp`.
   * @param ctx - Request context for structured logging.
   * @returns A promise resolving to a generic success response.
   *
   * @throws `BadRequestException` if the challenge is missing, expired, OTP is incorrect, or max attempts exceeded.
   *
   * @security The Redis key (`auth:email-verify:{challengeId}`) expires automatically after 15 minutes.
   */
  async verifyEmail(dto: VerifyEmailDto, ctx: RequestContext) {
    try {
      const key = KEY_EMAIL_VERIFY(dto.challengeId);
      const challenge = await this.redis.getObject<EmailVerificationChallenge>(key, ctx);

      this.helper.validateOtpChallenge(challenge, dto.otp, 'email verification');

      await this.prisma.user.update({
        where: { id: challenge!.userId },
        data: { emailVerified: true },
      });

      await this.redis.del(key, ctx);

      this.logger.log(
        `Email verified for user: ${challenge!.userId}${this.helper.formatContext(ctx)}`,
      );
      return successResponse('Email verified successfully', null);
    } catch (error) {
      this.helper.handleError(
        this.logger,
        `Email verification for challenge ${dto.challengeId}`,
        error,
        ctx,
      );
    }
  }

  // ─── RESEND EMAIL VERIFICATION ────────────────────────────────────────────

  /**
   * Resends the email verification OTP for an unverified user account.
   *
   * ### Context
   * A recovery workflow for users whose registration OTP expired before they could use it.
   *
   * ### Actual Behavior
   * 1. Looks up the user by email in PostgreSQL.
   * 2. Checks if the user exists and their `emailVerified` flag is `false`.
   * 3. If so, generates a new 6-digit OTP, stores it in Redis under a new `challengeId`, and emails the user.
   * 4. Returns a generic success response regardless of the outcome.
   *
   * ### Purpose
   * Allows users to request a fresh verification code without exposing whether the email is registered in the system.
   *
   * @param email - The email address of the unverified user.
   * @param ctx - Request context for structured logging.
   * @returns A promise resolving to a success response.
   *
   * @security Returns the exact same response whether the email exists, is already verified, or is unverified.
   * This prevents malicious actors from enumerating registered email addresses.
   */
  async resendVerification(email: string, ctx: RequestContext) {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });

      if (user && !user.emailVerified) {
        const challengeId = await this.helper.issueEmailVerificationChallenge(
          user.id,
          user.email,
          user.name,
          ctx,
        );
        this.logger.log(
          `Resent verification OTP for user: ${user.id}, challengeId: ${challengeId}`,
        );
      }

      return successResponse(
        'If your email is registered and unverified, a new verification code has been sent.',
        null,
      );
    } catch (error) {
      this.helper.handleError(this.logger, `Resend verification for ${email}`, error, ctx);
    }
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────

  /**
   * Step 1 of Two-Factor Login: Validates user credentials and dispatches a login OTP.
   *
   * ### Context
   * The entry point for authenticating an existing user session.
   *
   * ### Actual Behavior
   * 1. Retrieves the user and their associated `Account` record from PostgreSQL by email.
   * 2. Compares the submitted password against the stored bcrypt hash (12 rounds).
   * 3. Asserts that the account's email address is verified (`emailVerified === true`).
   * 4. Generates a 6-digit OTP, stores its SHA-256 hash in Redis (`auth:login-otp:{challengeId}`), and emails the OTP.
   *
   * ### Purpose
   * Implements two-step login security to protect accounts against credential stuffing and stolen passwords.
   *
   * @param dto - Login payload containing the user's `email` and `password`.
   * @param ctx - Request context for structured logging.
   * @returns A promise resolving to a success response containing the `challengeId`.
   *
   * @throws `UnauthorizedException` if credentials don't match, email is unverified, or the user does not exist.
   *
   * @security Does not issue JWT tokens. Requires completion of Step 2 (`verifyLoginOtp`).
   * Returns a generic "Invalid email or password" error to prevent user enumeration.
   *
   * @remarks
   * Uses helper functions from `auth.helpers.ts`:
   * - `issueLoginOtpChallenge`: Generates and emails the OTP.
   * - `formatContext`: Formats context for logging.
   * - `handleError`: Centralized error mapping.
   */
  async login(dto: LoginDto, ctx: RequestContext) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
        include: { account: true },
      });

      // Use a consistent generic error to prevent user enumeration
      const credentialError = new UnauthorizedException('Invalid email or password');

      if (!user || !user.account) throw credentialError;

      const passwordValid = await bcrypt.compare(dto.password, user.account.password);
      if (!passwordValid) throw credentialError;

      if (!user.emailVerified) {
        throw new UnauthorizedException(
          'Email address not verified. Please verify your email first.',
        );
      }

      const challengeId = await this.helper.issueLoginOtpChallenge(user.email, user.name, ctx);

      this.logger.log(`Login OTP issued for user: ${user.id}${this.helper.formatContext(ctx)}`);
      return successResponse('A verification code has been sent to your email.', { challengeId });
    } catch (error) {
      this.helper.handleError(this.logger, `Login for ${dto.email}`, error, ctx);
    }
  }

  // ─── VERIFY LOGIN OTP ─────────────────────────────────────────────────────

  /**
   * Step 2 of Two-Factor Login: Verifies the login OTP and establishes a session.
   *
   * ### Context
   * The conclusion of the authentication workflow. Issues session credentials upon successful OTP validation.
   *
   * ### Actual Behavior
   * 1. Retrieves the login challenge from Redis using `challengeId`.
   * 2. Validates the OTP against the stored hash (max 5 attempts).
   * 3. Looks up the user in PostgreSQL using the email stored in the challenge.
   * 4. Deletes the Redis challenge key.
   * 5. Creates a new `Session` record in the database tracking device, IP, and User-Agent.
   * 6. Generates an 8-minute JWT access token and a 7-hour high-entropy refresh token.
   * 7. Sets the refresh token as an `httpOnly`, `SameSite=Lax` secure cookie on the Express response.
   *
   * ### Purpose
   * Completes the login process and provides the client with the tokens needed to access protected routes.
   *
   * @param dto - Payload containing the `challengeId` and 6-digit `otp`.
   * @param res - Express Response object, used to attach the `refreshToken` cookie.
   * @param ctx - Optional request context for telemetry (IP, User-Agent).
   * @returns A promise resolving to a success response containing the JWT `accessToken` and user profile.
   *
   * @throws `BadRequestException` if the challenge is missing, expired, OTP is incorrect, or max attempts exceeded.
   * @throws `UnauthorizedException` if the user record cannot be found.
   *
   * @security The refresh token is strictly transmitted via an `httpOnly` cookie to prevent XSS exfiltration.
   *
   * @remarks
   * Uses helper functions from `auth.helpers.ts`:
   * - `validateOtpChallenge`: Verifies OTP and manages attempt counts.
   * - `createSessionAndTokens`: DB transaction to generate tokens and sessions.
   * - `toSafeUser`: Strips sensitive data from the user object.
   * - `formatContext`: Formats context for logging.
   * - `handleError`: Centralized error handling.
   */
  async verifyLoginOtp(dto: VerifyLoginOtpDto, res: Response, ctx?: RequestContext) {
    try {
      const key = KEY_LOGIN_OTP(dto.challengeId);
      const challenge = await this.redis.getObject<OtpChallenge>(key, ctx);

      this.helper.validateOtpChallenge(challenge, dto.otp, 'login');

      // Look up user by the email stored in the challenge
      const user = await this.prisma.user.findUnique({ where: { email: challenge!.email } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Consume challenge
      await this.redis.del(key, ctx);

      // Create session + tokens
      const tokens = await this.helper.createSessionAndTokens(
        user.id,
        ctx?.ipAddress,
        ctx?.userAgent,
      );

      // Set refresh token cookie
      const isProduction = this.config.get<string>('NODE_ENV') === 'production';
      res.cookie(
        REFRESH_TOKEN_COOKIE,
        tokens.refreshToken,
        getRefreshTokenCookieOptions(REFRESH_TOKEN_EXPIRY_MS, isProduction),
      );

      this.logger.log(
        `Session created for user: ${user.id} | Session: ${tokens.sessionId}${this.helper.formatContext(ctx)}`,
      );

      return successResponse('Login successful', {
        accessToken: tokens.accessToken,
        user: this.helper.toSafeUser(user),
      });
    } catch (error) {
      this.helper.handleError(
        this.logger,
        `Verify login OTP for challenge ${dto.challengeId}`,
        error,
        ctx,
      );
    }
  }

  // ─── REFRESH TOKEN ────────────────────────────────────────────────────────

  /**
   * Rotates the refresh token and issues a new access token.
   *
   * ### Context
   * Allows clients to seamlessly maintain their authenticated state without re-prompting the user for credentials.
   *
   * ### Actual Behavior
   * 1. Hashes the incoming refresh token (from the `httpOnly` cookie).
   * 2. Queries PostgreSQL for an active `Account` record matching the token hash.
   * 3. Validates the token's expiration date. If expired, revokes the token in DB and clears the cookie.
   * 4. Generates a new refresh token and a new session ID.
   * 5. Updates the `Account` record with the new refresh token hash and new 7-hour expiry date.
   * 6. Sets the new refresh token in the `httpOnly` cookie on the Express response.
   * 7. Signs and returns a new 8-minute JWT access token.
   *
   * ### Purpose
   * Implements Refresh Token Rotation (RTR) to provide continuous access while proactively invalidating old tokens
   * to detect and mitigate token reuse/replay attacks.
   *
   * @param refreshTokenCookie - The raw refresh token string extracted from the request cookies.
   * @param res - Express Response object, used to update the `refreshToken` cookie.
   * @param ctx - Optional request context for logging.
   * @returns A promise resolving to a success response containing the new JWT `accessToken`.
   *
   * @throws `UnauthorizedException` if the token is missing, invalid, revoked, or expired.
   *
   * @security If an expired token is presented, the system proactively revokes the token family to prevent misuse.
   *
   * @remarks
   * Uses helper functions from `auth.helpers.ts`:
   * - `clearRefreshCookie`: Removes the httpOnly cookie.
   * - `signAccessToken`: Generates the short-lived JWT.
   * - `formatContext`: Formats context for logging.
   * - `handleError`: Centralized error handling.
   */
  async refreshTokens(refreshTokenCookie: string | undefined, res: Response, ctx?: RequestContext) {
    try {
      if (!refreshTokenCookie) {
        throw new UnauthorizedException('No refresh token provided');
      }

      const tokenHash = hashRefreshToken(refreshTokenCookie);
      const account = await this.prisma.account.findFirst({
        where: { refreshToken: tokenHash, isRevoked: false },
        include: { user: true },
      });

      if (!account || !account.refreshTokenExpiresAt) {
        throw new UnauthorizedException('Invalid or revoked refresh token');
      }

      if (new Date() > account.refreshTokenExpiresAt) {
        // Token expired — revoke and clear cookie
        await this.prisma.account.update({
          where: { id: account.id },
          data: { isRevoked: true, refreshToken: null },
        });
        this.helper.clearRefreshCookie(res);
        throw new UnauthorizedException('Refresh token expired. Please log in again.');
      }

      // Rotate token
      const newRefreshToken = generateRefreshToken();
      const newRefreshTokenHash = hashRefreshToken(newRefreshToken);
      const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
      const sessionId = generateSessionId();

      await this.prisma.account.update({
        where: { id: account.id },
        data: {
          refreshToken: newRefreshTokenHash,
          refreshTokenExpiresAt: newExpiresAt,
          isRevoked: false,
        },
      });

      const accessToken = this.helper.signAccessToken(account.userId, sessionId);
      const isProduction = this.config.get<string>('NODE_ENV') === 'production';

      res.cookie(
        REFRESH_TOKEN_COOKIE,
        newRefreshToken,
        getRefreshTokenCookieOptions(REFRESH_TOKEN_EXPIRY_MS, isProduction),
      );

      this.logger.log(
        `Tokens rotated for user: ${account.userId}${this.helper.formatContext(ctx)}`,
      );
      return successResponse('Tokens refreshed', { accessToken });
    } catch (error) {
      this.helper.handleError(this.logger, 'Refresh tokens', error, ctx);
    }
  }

  // ─── LOGOUT ───────────────────────────────────────────────────────────────

  /**
   * Terminates the active user session and clears authentication cookies.
   *
   * ### Context
   * Explicit logout endpoint to securely end the user's session.
   *
   * ### Actual Behavior
   * 1. Hashes the provided refresh token.
   * 2. Updates the `Account` record in PostgreSQL to revoke the token (`isRevoked: true`, clears hash and expiry).
   * 3. Deletes the specific `Session` record from PostgreSQL matching the user's active `sessionId`.
   * 4. Clears the `refreshToken` cookie from the client by setting an expired HTTP header.
   *
   * ### Purpose
   * Ensures that neither the server nor the client retain valid session credentials after logout.
   *
   * @param user - The authenticated user payload extracted from the current JWT token.
   * @param refreshTokenCookie - The raw refresh token string extracted from the request cookies.
   * @param res - Express Response object, used to clear the `refreshToken` cookie.
   * @param ctx - Optional request context for logging.
   * @returns A promise resolving to a generic success response.
   *
   * @security DB errors during revocation are caught and logged as warnings rather than failing the logout process,
   * ensuring the cookie is still cleared on the client side.
   *
   * @remarks
   * Uses helper functions from `auth.helpers.ts`:
   * - `clearRefreshCookie`: Invalidates client cookies.
   * - `formatContext`: Formats context for logging.
   * - `handleError`: Centralized error handling.
   */
  async logout(
    user: AuthenticatedUser,
    refreshTokenCookie: string | undefined,
    res: Response,
    ctx?: RequestContext,
  ) {
    try {
      if (refreshTokenCookie) {
        const tokenHash = hashRefreshToken(refreshTokenCookie);
        await this.prisma.account
          .updateMany({
            where: { userId: user.userId, refreshToken: tokenHash },
            data: { isRevoked: true, refreshToken: null, refreshTokenExpiresAt: null },
          })
          .catch((err: Error) => {
            this.logger.warn(
              `Could not revoke refresh token during logout: ${err.message}${this.helper.formatContext(ctx)}`,
            );
          });
      } else {
        await this.prisma.account
          .updateMany({
            where: { userId: user.userId },
            data: { isRevoked: true, refreshToken: null, refreshTokenExpiresAt: null },
          })
          .catch((err: Error) => {
            this.logger.warn(
              `Could not revoke refresh token during logout: ${err.message}${this.helper.formatContext(ctx)}`,
            );
          });
      }

      // 1. Delete the session record from PostgreSQL
      await this.prisma.session
        .deleteMany({ where: { id: user.sessionId } })
        .catch((err: Error) => {
          this.logger.warn(
            `Could not delete session during logout: ${err.message}${this.helper.formatContext(ctx)}`,
          );
        });

      // 2. Immediately delete session cache from Redis so access token fails JwtAuthGuard instantly!
      await this.redis.del(KEY_SESSION_CACHE(user.sessionId), ctx).catch((err: Error) => {
        this.logger.warn(
          `Could not delete session cache during logout: ${err.message}${this.helper.formatContext(ctx)}`,
        );
      });

      this.helper.clearRefreshCookie(res);
      this.logger.log(`User logged out: ${user.userId}${this.helper.formatContext(ctx)}`);
      return successResponse('Logged out successfully', null);
    } catch (error) {
      this.helper.handleError(this.logger, `Logout for user ${user.userId}`, error, ctx);
    }
  }

  // ─── GET ME ───────────────────────────────────────────────────────────────

  /**
   * Retrieves safe profile details for the currently authenticated user.
   *
   * ### Context
   * Allows frontend clients to hydrate the current user state upon initial load or page refresh.
   *
   * ### Actual Behavior
   * 1. Uses the `userId` from the decoded JWT payload.
   * 2. Queries PostgreSQL for the latest `User` record.
   * 3. Maps the raw DB record to a `SafeUser` object (omitting sensitive fields like the password hash relation).
   *
   * ### Purpose
   * Provides verified, up-to-date account details bound to the active session.
   *
   * @param user - The authenticated user payload extracted from the JWT token.
   * @param ctx - Request context for structured logging.
   * @returns A promise resolving to a success response containing the `SafeUser` profile.
   *
   * @throws `UnauthorizedException` if the user record no longer exists in the database.
   *
   * @remarks
   * Uses helper functions from `auth.helpers.ts`:
   * - `toSafeUser`: Strips sensitive fields (like password relations).
   * - `handleError`: Centralized error handling.
   */
  async getMe(user: AuthenticatedUser, ctx: RequestContext) {
    try {
      const dbUser = await this.prisma.user.findUnique({ where: { id: user.userId } });
      if (!dbUser) throw new UnauthorizedException('User not found');
      return successResponse('User profile', this.helper.toSafeUser(dbUser));
    } catch (error) {
      this.helper.handleError(this.logger, `Get profile for user ${user.userId}`, error, ctx);
    }
  }

  // ─── FORGOT PASSWORD ──────────────────────────────────────────────────────

  /**
   * Initiates the password reset flow by sending a verification OTP.
   *
   * ### Context
   * The first step in the self-service account recovery process for users who lost their passwords.
   *
   * ### Actual Behavior
   * 1. Queries PostgreSQL to check if the provided email exists.
   * 2. If the user exists, generates a 6-digit OTP, stores its SHA-256 hash in Redis (`auth:password-reset:{challengeId}`), and emails it.
   * 3. Returns a consistent success response regardless of whether the email was found.
   *
   * ### Purpose
   * Allows legitimate users to recover access securely via out-of-band email verification.
   *
   * @param dto - Payload containing the target `email` address.
   * @param ctx - Request context for structured logging.
   * @returns A promise resolving to a generic success response.
   *
   * @security Returns the exact same HTTP response whether the email exists or not to prevent user enumeration attacks.
   *
   * @remarks
   * Uses helper functions from `auth.helpers.ts`:
   * - `issuePasswordResetChallenge`: Generates and sends the OTP.
   * - `handleError`: Centralized error handling.
   */
  async forgotPassword(dto: ForgotPasswordDto, ctx: RequestContext) {
    try {
      const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

      let challengeId: string;

      if (user) {
        challengeId = await this.helper.issuePasswordResetChallenge(user.email, user.name, ctx);
        this.logger.log(
          `Password reset OTP issued for user: ${user.id}, challengeId: ${challengeId}`,
        );
      } else {
        challengeId = crypto.randomUUID();
      }

      return successResponse(
        'If this email is registered, you will receive a password reset code shortly.',
        { challengeId },
      );
    } catch (error) {
      this.helper.handleError(this.logger, `Forgot password for ${dto.email}`, error, ctx);
    }
  }

  // ─── RESET PASSWORD ───────────────────────────────────────────────────────

  /**
   * Verifies the reset OTP and securely updates the user's password.
   *
   * ### Context
   * The final step of account recovery. Persists the new credentials and invalidates active sessions.
   *
   * ### Actual Behavior
   * 1. Retrieves the password reset challenge from Redis using the provided `challengeId`.
   * 2. Validates the submitted OTP against the stored hash (max 5 attempts).
   * 3. Hashes the new password using bcrypt (12 rounds).
   * 4. Executes a Prisma transaction to:
   *    - Update the `Account` record with the new password.
   *    - Revoke all existing refresh tokens for the user (`isRevoked: true`).
   *    - Delete all existing `Session` records for the user.
   * 5. Deletes the Redis challenge key.
   * 6. Dispatches a non-blocking confirmation email to the user.
   *
   * ### Purpose
   * Replaces forgotten credentials while aggressively invalidating all active sessions to mitigate account takeover risks.
   *
   * @param dto - Payload containing the `challengeId`, 6-digit `otp`, and `newPassword`.
   * @param ctx - Request context for structured logging.
   * @returns A promise resolving to a success response.
   *
   * @throws `BadRequestException` if the challenge is invalid, OTP is incorrect, max attempts exceeded, or user not found.
   *
   * @security Automatically terminates all existing user sessions globally to ensure compromised credentials cannot be reused.
   *
   * @remarks
   * Uses helper functions from `auth.helpers.ts`:
   * - `validateOtpChallenge`: Verifies OTP and manages attempts.
   * - `formatContext`: Formats context for logging.
   * - `handleError`: Centralized error handling.
   */
  async resetPassword(dto: ResetPasswordDto, ctx: RequestContext) {
    try {
      const key = KEY_PASSWORD_RESET(dto.challengeId);
      const challenge = await this.redis.getObject<OtpChallenge>(key, ctx);

      this.helper.validateOtpChallenge(challenge, dto.otp, 'password reset');

      const user = await this.prisma.user.findUnique({ where: { email: challenge!.email } });
      if (!user) throw new BadRequestException('User not found');

      const newPasswordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

      await this.prisma.$transaction(async (tx) => {
        await tx.account.updateMany({
          where: { userId: user.id },
          data: {
            password: newPasswordHash,
            refreshToken: null,
            refreshTokenExpiresAt: null,
            isRevoked: true,
          },
        });

        // Delete all sessions for this user
        await tx.session.deleteMany({ where: { userId: user.id } });
      });

      await this.redis.del(key, ctx);

      // Send confirmation email (non-blocking — don't fail if email fails)
      this.mail
        .sendEmail(
          user.email,
          'Your Aayeshol password has been changed',
          passwordResetConfirmationTemplate(user.name),
        )
        .catch((err: Error) => {
          this.logger.warn(
            `Failed to send password reset confirmation to ${user.email}: ${err.message}`,
          );
        });

      this.logger.log(
        `Password reset completed for user: ${user.id}${this.helper.formatContext(ctx)}`,
      );
      return successResponse(
        'Password has been reset successfully. Please log in with your new password.',
        null,
      );
    } catch (error) {
      this.helper.handleError(
        this.logger,
        `Reset password for challenge ${dto.challengeId}`,
        error,
        ctx,
      );
    }
  }
}
