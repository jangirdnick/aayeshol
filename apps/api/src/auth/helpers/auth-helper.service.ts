import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import * as crypto from 'node:crypto';

import { Prisma } from '@/generated/prisma/client.js';
import { PrismaService } from '@/prisma/prisma.service.js';
import { RedisService } from '@/infrastructure/redis/redis.service.js';
import { MailService } from '@/infrastructure/mail/mail.service.js';

import { generateOtp, hashOtp, verifyOtpHash } from '../utils/otp.util.js';
import {
  generateRefreshToken,
  generateSessionId,
  hashRefreshToken,
  REFRESH_TOKEN_COOKIE,
} from '../utils/token.util.js';
import {
  emailVerificationTemplate,
  loginOtpTemplate,
  passwordResetOtpTemplate,
} from '@/infrastructure/mail/templates/auth-email.templates.js';

import type {
  EmailVerificationChallenge,
  JwtAccessPayload,
  OtpChallenge,
  RequestContext,
  SafeUser,
  TokenPair,
} from '../types/auth.types.js';

/**
 * Bcrypt salt rounds used for password hashing across authentication workflows.
 * Set to 12 rounds in production for high security against brute-force attacks.
 */
export const BCRYPT_ROUNDS = 12;

/**
 * Time-to-live (in seconds) for email verification OTP challenges stored in Redis.
 * Defaults to 15 minutes (900 seconds).
 */
export const EMAIL_VERIFY_OTP_TTL_S = 15 * 60;

/**
 * Time-to-live (in seconds) for two-step login OTP challenges stored in Redis.
 * Defaults to 5 minutes (300 seconds).
 */
export const LOGIN_OTP_TTL_S = 5 * 60;

/**
 * Time-to-live (in seconds) for password reset OTP challenges stored in Redis.
 * Defaults to 10 minutes (600 seconds).
 */
export const PASSWORD_RESET_OTP_TTL_S = 10 * 60;

/**
 * Maximum permitted failed OTP validation attempts before a challenge is invalidated.
 */
export const MAX_OTP_ATTEMPTS = 5;

/**
 * Lifespan string format for JWT access tokens signed by JwtService.
 * Access tokens expire in 8 minutes to minimize window of vulnerability.
 */
export const ACCESS_TOKEN_EXPIRY = '8m';

/**
 * Lifespan (in milliseconds) for server-side sessions and refresh tokens.
 * Defaults to 7 hours (25,200,000 ms).
 */
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 60 * 60 * 1000;

/**
 * Constructs a Redis key for storing email verification OTP challenge payloads.
 * @param id Unique challenge UUID.
 * @returns Redis key string formatted as `auth:email-verify:${id}`.
 */
export const KEY_EMAIL_VERIFY = (id: string) => `auth:email-verify:${id}`;

/**
 * Constructs a Redis key for storing 2-step login OTP challenge payloads.
 * @param id Unique challenge UUID.
 * @returns Redis key string formatted as `auth:login-otp:${id}`.
 */
export const KEY_LOGIN_OTP = (id: string) => `auth:login-otp:${id}`;

/**
 * Constructs a Redis key for storing password reset OTP challenge payloads.
 * @param id Unique challenge UUID.
 * @returns Redis key string formatted as `auth:password-reset:${id}`.
 */
export const KEY_PASSWORD_RESET = (id: string) => `auth:password-reset:${id}`;

/**
 * Constructs a Redis key for caching active session states evaluated by JwtAuthGuard.
 * @param sessionId Unique session UUID.
 * @returns Redis key string formatted as `auth:session:${sessionId}`.
 */
export const KEY_SESSION_CACHE = (sessionId: string) => `auth:session:${sessionId}`;

/**
 * Auxiliary helper service for the authentication domain (`AuthModule`).
 *
 * ### Context
 * Extracted from `AuthService` to promote modularity, Single Responsibility Principle (SRP),
 * and separation of core domain workflows from low-level helper operations.
 *
 * ### Actual Behavior
 * Encapsulates reusable utility operations required during identity & session management:
 * - **OTP Challenge Lifecycle**: Generates, hashes, caches in Redis, dispatches via `MailService`, and validates 6-digit OTP codes.
 * - **Session & Token Management**: Creates database `Session` records and updates user `Account` refresh token hashes atomically via Prisma `$transaction`.
 * - **JWT Signing**: Issues signed short-lived JWT access tokens via `JwtService`.
 * - **Error Handling**: Centralizes error logging and translates database exceptions (e.g. Prisma `P2002`) into NestJS HTTP exceptions.
 * - **User Serialization**: Maps Prisma `User` entities into client-safe `SafeUser` objects.
 *
 * ### Dependencies
 * - `PrismaService`: Database queries and transaction execution for user sessions and accounts.
 * - `RedisService`: Fast transient storage for OTP challenge objects with auto-expiring TTLs.
 * - `MailService`: Transports personalized email templates containing unhashed OTP codes.
 * - `JwtService`: Signs JWT access tokens using configured environment secrets.
 * - `ConfigService`: Accesses runtime configuration (e.g. `JWT_ACCESS_SECRET`, `NODE_ENV`).
 *
 * @example
 * // Injected into AuthService or specific guards/handlers:
 * const safeUser = this.authHelper.toSafeUser(user);
 * const tokenPair = await this.authHelper.createSessionAndTokens(user.id, req.ip, req.headers['user-agent']);
 */
@Injectable()
export class AuthHelperService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Formats HTTP request metadata from a `RequestContext` into a readable bracketed string for logging.
   *
   * ### Context
   * Helper utility used across `AuthService` log calls to correlate log output with specific incoming requests.
   *
   * ### Actual Behavior
   * Extracts `requestId`, `ipAddress`, and `userAgent` from the optional `ctx` object and builds a formatted string.
   * If `ctx` is omitted or undefined, returns an empty string `''`.
   *
   * @param ctx Optional request context captured by NestJS execution context.
   * @returns Formatted metadata string ` [requestId=..., ip=..., ua=...]` or `''`.
   *
   * @example
   * const logPrefix = this.authHelper.formatContext(ctx);
   * logger.log(`User logged in${logPrefix}`);
   * // Log output: "User logged in [requestId=req_abc123, ip=192.168.1.1, ua=Mozilla/5.0]"
   */
  formatContext(ctx?: RequestContext): string {
    if (!ctx) return '';
    return ` [requestId=${ctx.requestId}, ip=${ctx.ipAddress ?? 'unknown'}, ua=${ctx.userAgent ?? 'unknown'}]`;
  }

  /**
   * Centralized exception handler and logger for authentication service operations.
   *
   * ### Context
   * Called within `try-catch` blocks throughout `AuthService` to ensure consistent error handling,
   * detailed logging, and proper translation of database errors into user-friendly NestJS HTTP exceptions.
   *
   * ### Actual Behavior
   * 1. If `error` is already a NestJS `HttpException` (e.g. `BadRequestException`, `UnauthorizedException`), re-throws it directly.
   * 2. Logs the operation failure, error message, stack trace, and request context using the provided `Logger`.
   * 3. Catches Prisma `PrismaClientKnownRequestError`:
   *    - Converts unique constraint code `P2002` into a NestJS `ConflictException`.
   *    - Converts other known database errors into `InternalServerErrorException`.
   * 4. Catches Prisma `PrismaClientValidationError` and throws `InternalServerErrorException`.
   * 5. Sanitizes unknown unexpected errors in `production` (`NODE_ENV === 'production'`) to prevent leaking internal stack details.
   *
   * @param logger NestJS `Logger` instance from the calling service.
   * @param operation Name of the executing operation (e.g. `'register'`, `'login'`, `'verifyEmail'`).
   * @param error Caught exception of unknown type.
   * @param ctx Optional request context for log correlation.
   * @returns Never returns normally; always throws an `HttpException`.
   * @throws `HttpException` Re-throws or translates errors into NestJS HTTP exceptions.
   *
   * @example
   * try {
   *   await this.prisma.user.create(...);
   * } catch (error) {
   *   this.authHelper.handleError(this.logger, 'register', error, ctx);
   * }
   */
  handleError(logger: Logger, operation: string, error: unknown, ctx?: RequestContext): never {
    if (error instanceof HttpException) throw error;

    const err = error as Error;
    logger.error(`[${operation}] failed: ${err.message}${this.formatContext(ctx)}`, err.stack);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('A record with this unique field already exists.');
      }
      throw new InternalServerErrorException(`Database Error (${error.code}): ${error.message}`);
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new InternalServerErrorException(`Database Validation Error: ${error.message}`);
    }

    throw new InternalServerErrorException(
      this.config.get<string>('NODE_ENV') === 'production'
        ? 'An unexpected error occurred. Please try again later.'
        : err.message,
    );
  }

  /**
   * Generates, stores, and dispatches a 6-digit One-Time Password (OTP) challenge via email.
   *
   * ### Context
   * Shared pipeline powering all 2-step OTP flows (email verification, login code, password reset).
   *
   * ### Actual Behavior
   * 1. Generates a random UUID `challengeId` via `crypto.randomUUID()`.
   * 2. Generates a raw 6-digit numeric OTP and computes its SHA-256 hash (`hashOtp`).
   * 3. Calculates absolute expiration epoch timestamp based on `ttlSeconds`.
   * 4. Assembles challenge payload containing `otpHash`, `expiresAt`, `attempts: 0`, `email`, and `extraData`.
   * 5. Caches payload in Redis under `keyBuilder(challengeId)` with auto-expire TTL.
   * 6. Sends unhashed 6-digit OTP code to `email` via `MailService.sendEmail`.
   * 7. Returns `challengeId` UUID string to be sent back to client.
   *
   * @template T Extra metadata shape attached to challenge payload (e.g. `{ userId: string }`).
   * @param email Recipient user email address.
   * @param keyBuilder Function building Redis key prefix (e.g. `KEY_EMAIL_VERIFY`).
   * @param ttlSeconds Challenge lifespan in seconds.
   * @param subject Email message subject.
   * @param htmlTemplate Function returning formatted HTML string containing raw unhashed OTP.
   * @param ctx Optional request context for logging.
   * @param extraData Additional properties to merge into stored challenge object.
   * @returns Promise resolving to newly created challenge UUID string.
   * @throws `InternalServerErrorException` If Redis caching or email dispatch fails.
   *
   * @example
   * const challengeId = await helper.createAndSendOtpChallenge(
   *   'user@example.com',
   *   KEY_LOGIN_OTP,
   *   300,
   *   'Your Login Code',
   *   (otp) => `<p>Your code is: ${otp}</p>`,
   *   ctx,
   * );
   */
  async createAndSendOtpChallenge<T extends { email: string; userId?: string }>(
    email: string,
    keyBuilder: (id: string) => string,
    ttlSeconds: number,
    subject: string,
    htmlTemplate: (otp: string) => string,
    ctx?: RequestContext,
    extraData: Partial<T> = {},
  ): Promise<string> {
    const challengeId = crypto.randomUUID();
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = Date.now() + ttlSeconds * 1000;

    const challenge = {
      otpHash,
      expiresAt,
      attempts: 0,
      email,
      ...extraData,
    };

    await this.redis.setObject(keyBuilder(challengeId), challenge, ttlSeconds, ctx);
    await this.mail.sendEmail(email, subject, htmlTemplate(otp), undefined, ctx);

    return challengeId;
  }

  /**
   * Issues an email verification OTP challenge when a new user registers.
   *
   * ### Context
   * Helper called by `AuthService.register` to send a 15-minute verification code upon account creation.
   *
   * ### Actual Behavior
   * Delegates to `createAndSendOtpChallenge` using `KEY_EMAIL_VERIFY`, `EMAIL_VERIFY_OTP_TTL_S` (15 min),
   * subject `'Verify your Aayeshol email'`, `emailVerificationTemplate`, and binds `{ userId }`.
   *
   * @param userId Database ID of newly registered user.
   * @param email Target user email address.
   * @param name User display name for template personalization.
   * @param ctx Optional request context.
   * @returns Promise resolving to challenge UUID string.
   *
   * @example
   * const challengeId = await helper.issueEmailVerificationChallenge('usr_123', 'user@example.com', 'John', ctx);
   */
  async issueEmailVerificationChallenge(
    userId: string,
    email: string,
    name: string,
    ctx?: RequestContext,
  ): Promise<string> {
    return this.createAndSendOtpChallenge(
      email,
      KEY_EMAIL_VERIFY,
      EMAIL_VERIFY_OTP_TTL_S,
      'Verify your Aayeshol email',
      (otp) => emailVerificationTemplate(name, otp, 15),
      ctx,
      { userId },
    );
  }

  /**
   * Issues a two-step login OTP challenge.
   *
   * ### Context
   * Helper called during step 1 of user login (`AuthService.login`) to send a 5-minute login verification code.
   *
   * ### Actual Behavior
   * Delegates to `createAndSendOtpChallenge` using `KEY_LOGIN_OTP`, `LOGIN_OTP_TTL_S` (5 min),
   * subject `'Your Aayeshol login code'`, and `loginOtpTemplate`.
   *
   * @param email Recipient user email address.
   * @param name User display name for template personalization.
   * @param ctx Optional request context.
   * @returns Promise resolving to challenge UUID string.
   *
   * @example
   * const challengeId = await helper.issueLoginOtpChallenge('user@example.com', 'John', ctx);
   */
  async issueLoginOtpChallenge(email: string, name: string, ctx?: RequestContext): Promise<string> {
    return this.createAndSendOtpChallenge(
      email,
      KEY_LOGIN_OTP,
      LOGIN_OTP_TTL_S,
      'Your Aayeshol login code',
      (otp) => loginOtpTemplate(name, otp, 5),
      ctx,
    );
  }

  /**
   * Issues a password reset OTP challenge.
   *
   * ### Context
   * Helper called during forgot password requests (`AuthService.forgotPassword`) to send a 10-minute reset code.
   *
   * ### Actual Behavior
   * Delegates to `createAndSendOtpChallenge` using `KEY_PASSWORD_RESET`, `PASSWORD_RESET_OTP_TTL_S` (10 min),
   * subject `'Reset your Aayeshol password'`, and `passwordResetOtpTemplate`.
   *
   * @param email Recipient user email address.
   * @param name User display name for template personalization.
   * @param ctx Optional request context.
   * @returns Promise resolving to challenge UUID string.
   *
   * @example
   * const challengeId = await helper.issuePasswordResetChallenge('user@example.com', 'John', ctx);
   */
  async issuePasswordResetChallenge(
    email: string,
    name: string,
    ctx?: RequestContext,
  ): Promise<string> {
    return this.createAndSendOtpChallenge(
      email,
      KEY_PASSWORD_RESET,
      PASSWORD_RESET_OTP_TTL_S,
      'Reset your Aayeshol password',
      (otp) => passwordResetOtpTemplate(name, otp, 10),
      ctx,
    );
  }

  /**
   * Validates a user-submitted OTP code against a challenge payload retrieved from Redis.
   *
   * ### Context
   * Helper called by verification endpoints (`verifyEmail`, `verifyLoginOtp`, `resetPassword`)
   * to verify 6-digit OTP codes before completing authentication or password reset.
   *
   * ### Actual Behavior
   * 1. Checks if `challenge` is null/undefined -> Throws `BadRequestException('Invalid or expired ${context} code')`.
   * 2. Checks if `Date.now() > challenge.expiresAt` -> Throws `BadRequestException('The ${context} code has expired. Please request a new one.')`.
   * 3. Checks if `challenge.attempts >= MAX_OTP_ATTEMPTS` -> Throws `BadRequestException('Too many failed attempts. Please request a new ${context} code.')`.
   * 4. Verifies hash using `verifyOtpHash(submittedOtp, challenge.otpHash)` (constant-time comparison).
   * 5. If hash check fails: increments `challenge.attempts`, triggers `updateChallengeAttempts(challenge)`, and throws `BadRequestException('Invalid ${context} code')`.
   *
   * @param challenge Challenge payload fetched from Redis (or null if key expired).
   * @param submittedOtp Raw 6-digit OTP string entered by user.
   * @param context Human-readable flow label (e.g. `'verification'`, `'login'`, `'password reset'`) used in exception messages.
   * @throws `BadRequestException` If challenge is missing, expired, lock-out threshold exceeded, or OTP code is incorrect.
   *
   * @example
   * const challenge = await redis.getObject<OtpChallenge>('auth:login-otp:uuid-123');
   * helper.validateOtpChallenge(challenge, '123456', 'login');
   */
  validateOtpChallenge(
    challenge: OtpChallenge | EmailVerificationChallenge | null,
    submittedOtp: string,
    context: string,
  ): void {
    if (!challenge) {
      throw new BadRequestException(`Invalid or expired ${context} code`);
    }

    if (Date.now() > challenge.expiresAt) {
      throw new BadRequestException(`The ${context} code has expired. Please request a new one.`);
    }

    if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
      throw new BadRequestException(
        `Too many failed attempts. Please request a new ${context} code.`,
      );
    }

    if (!verifyOtpHash(submittedOtp, challenge.otpHash)) {
      challenge.attempts += 1;
      void this.updateChallengeAttempts(challenge);
      throw new BadRequestException(`Invalid ${context} code`);
    }
  }

  /**
   * Persists incremented failed attempt counts for active OTP challenges back to Redis.
   *
   * ### Context
   * Helper invoked asynchronously when OTP hash verification fails during `validateOtpChallenge`.
   *
   * ### Actual Behavior
   * Currently a placeholder method receiving the modified challenge object (no-op).
   *
   * @param challenge Modified challenge object containing updated `attempts` count.
   * @returns Promise resolving when update completes.
   *
   * @example
   * void helper.updateChallengeAttempts(challenge);
   */
  async updateChallengeAttempts(
    challenge: OtpChallenge | EmailVerificationChallenge,
  ): Promise<void> {
    void challenge;
  }

  /**
   * Creates a server-side user session in Prisma DB and issues an access/refresh token pair.
   *
   * ### Context
   * Called upon successful user authentication (login OTP verification or email verification)
   * to establish an active session and issue security tokens.
   *
   * ### Actual Behavior
   * 1. Generates a new `sessionId` UUID (`generateSessionId()`).
   * 2. Generates a high-entropy random `refreshToken` string (`generateRefreshToken()`) and computes its SHA-256 hash (`hashRefreshToken`).
   * 3. Calculates refresh token expiration date (`Date.now() + 7 hours`).
   * 4. Executes an atomic Prisma `$transaction`:
   *    - Inserts a new `Session` record linked to `userId`, storing device UUID, `ipAddress`, `userAgent`, and `expiresAt`.
   *    - Updates user `Account` record with `refreshToken` hash, expiration date, and sets `isRevoked: false`.
   * 5. Signs a short-lived JWT access token via `signAccessToken(userId, sessionId)`.
   * 6. Returns `TokenPair` containing `accessToken`, raw unhashed `refreshToken`, and `sessionId`.
   *
   * @param userId Target user database ID.
   * @param ipAddress Optional IP address of client request.
   * @param userAgent Optional HTTP User-Agent string.
   * @returns Promise resolving to `TokenPair` containing `{ accessToken, refreshToken, sessionId }`.
   * @throws `InternalServerErrorException` If Prisma transaction or token signing fails.
   *
   * @example
   * const tokenPair = await helper.createSessionAndTokens('usr_123', '192.168.1.1', 'Mozilla/5.0');
   * // Returns { accessToken: 'eyJhbG...', refreshToken: 'ref_xyz...', sessionId: 'sess_123...' }
   */
  async createSessionAndTokens(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const sessionId = generateSessionId();
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await this.prisma.$transaction(async (tx) => {
      await tx.session.create({
        data: {
          id: sessionId,
          userId,
          deviceId: crypto.randomUUID(),
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
          expiresAt: refreshTokenExpiresAt,
        },
      });

      await tx.account.update({
        where: { userId },
        data: {
          refreshToken: refreshTokenHash,
          refreshTokenExpiresAt,
          isRevoked: false,
        },
      });
    });

    const accessToken = this.signAccessToken(userId, sessionId);

    return { accessToken, refreshToken, sessionId };
  }

  /**
   * Signs a short-lived JWT access token for authorization header authentication.
   *
   * ### Context
   * Called during session initialization (`createSessionAndTokens`) and token refresh (`AuthService.refreshToken`).
   *
   * ### Actual Behavior
   * Retrieves `JWT_ACCESS_SECRET` from `ConfigService`, constructs `JwtAccessPayload` containing
   * `{ sub: userId, sessionId, purpose: 'access' }`, and signs JWT with `expiresIn: '8m'`.
   *
   * @param userId User ID assigned to JWT `sub` payload field.
   * @param sessionId Active session ID assigned to JWT `sessionId` payload field.
   * @returns Signed JWT access token string valid for 8 minutes.
   *
   * @example
   * const accessToken = helper.signAccessToken('usr_123', 'sess_abc456');
   */
  signAccessToken(userId: string, sessionId: string): string {
    const secret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const payload: JwtAccessPayload = { sub: userId, sessionId, purpose: 'access' };
    return this.jwt.sign(payload, { secret, expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  /**
   * Clears the HTTP-only refresh token cookie from the client response.
   *
   * ### Context
   * Invoked during user logout (`AuthService.logout`) or cookie revocation to remove client cookie.
   *
   * ### Actual Behavior
   * Calls Express `res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' })` to clear cookie `refresh_token`.
   *
   * @param res Express HTTP response object.
   *
   * @example
   * helper.clearRefreshCookie(res);
   */
  clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  /**
   * Sanitizes a Prisma `User` database record into a safe, client-returnable `SafeUser` DTO.
   *
   * ### Context
   * Used before returning user details in API responses to prevent sensitive database fields from leaking to clients.
   *
   * ### Actual Behavior
   * Extracts and returns public fields: `id`, `name`, `lastName`, `email`, `emailVerified`, `avatar`, `role`, `createdAt`, `updatedAt`.
   *
   * @param user Raw Prisma `User` database entity.
   * @returns Sanitized `SafeUser` object.
   *
   * @example
   * const dbUser = await prisma.user.findUnique({ where: { id: 'usr_123' } });
   * const safeUser = helper.toSafeUser(dbUser);
   */
  toSafeUser(user: {
    id: string;
    name: string;
    lastName: string | null;
    email: string;
    emailVerified: boolean;
    avatar: string | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }): SafeUser {
    return {
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      emailVerified: user.emailVerified,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
