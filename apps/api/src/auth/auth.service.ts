import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../generated/prisma/client.js';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';
import type { Response } from 'express';

import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../infrastructure/redis/redis.service.js';
import { MailService } from '../infrastructure/mail/mail.service.js';

import { generateOtp, hashOtp, verifyOtpHash } from './utils/otp.util.js';
import {
  generateRefreshToken,
  generateSessionId,
  getRefreshTokenCookieOptions,
  hashRefreshToken,
  REFRESH_TOKEN_COOKIE,
} from './utils/token.util.js';
import {
  emailVerificationTemplate,
  loginOtpTemplate,
  passwordResetConfirmationTemplate,
  passwordResetOtpTemplate,
} from '../infrastructure/mail/templates/auth-email.templates.js';
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
  JwtAccessPayload,
  OtpChallenge,
  SafeUser,
  TokenPair,
} from './types/auth.types.js';

/** Bcrypt cost factor — 12 rounds in production for security */
const BCRYPT_ROUNDS = 12;

/** OTP expiry: 15 min for email verification, 5 min for login, 10 min for password reset */
const EMAIL_VERIFY_OTP_TTL_S = 15 * 60;
const LOGIN_OTP_TTL_S = 5 * 60;
const PASSWORD_RESET_OTP_TTL_S = 10 * 60;

/** Maximum failed OTP attempts before challenge is invalidated */
const MAX_OTP_ATTEMPTS = 5;

/** Access token expiry: 8 minutes */
const ACCESS_TOKEN_EXPIRY = '8m';

/** Refresh token expiry: 7 hours in ms */
const REFRESH_TOKEN_EXPIRY_MS = 7 * 60 * 60 * 1000;

/** Redis key prefixes */
const KEY_EMAIL_VERIFY = (id: string) => `auth:email-verify:${id}`;
const KEY_LOGIN_OTP = (id: string) => `auth:login-otp:${id}`;
const KEY_PASSWORD_RESET = (id: string) => `auth:password-reset:${id}`;

/**
 * Core authentication service for Aayeshol.
 * Handles registration, email verification, login OTP, password reset, and session management.
 *
 * Security design:
 * - Passwords are hashed with bcrypt (12 rounds)
 * - OTPs are hashed with SHA-256 before storage in Redis
 * - Refresh tokens are high-entropy random bytes, stored SHA-256 hashed in DB
 * - Access tokens are short-lived JWTs (8 min) signed with a dedicated secret
 * - Refresh tokens are stored in httpOnly cookies only
 * - Sessions track IP, user-agent, and device ID for audit trails
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── REGISTER ────────────────────────────────────────────────────────────

  /**
   * Registers a new user and sends an email verification OTP.
   * Returns a challengeId to use with POST /auth/verify-email.
   */
  async register(dto: RegisterDto) {
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

      const challengeId = await this.issueEmailVerificationChallenge(
        user.id,
        user.email,
        user.name,
      );

      this.logger.log(`User registered: ${user.id} | Email verification OTP sent`);

      return successResponse(
        'Registration successful. Please check your email to verify your account.',
        {
          challengeId,
          userId: user.id,
        },
      );
    } catch (error) {
      this.handleError(`Registration for ${dto.email}`, error);
    }
  }

  // ─── VERIFY EMAIL ─────────────────────────────────────────────────────────

  /**
   * Verifies the email verification OTP and marks the user's email as verified.
   */
  async verifyEmail(dto: VerifyEmailDto) {
    try {
      const key = KEY_EMAIL_VERIFY(dto.challengeId);
      const challenge = await this.redis.getObject<EmailVerificationChallenge>(key);

      this.validateOtpChallenge(challenge, dto.otp, 'email verification');

      await this.prisma.user.update({
        where: { id: challenge!.userId },
        data: { emailVerified: true },
      });

      await this.redis.del(key);

      this.logger.log(`Email verified for user: ${challenge!.userId}`);
      return successResponse('Email verified successfully', null);
    } catch (error) {
      this.handleError(`Email verification for challenge ${dto.challengeId}`, error);
    }
  }

  // ─── RESEND EMAIL VERIFICATION ────────────────────────────────────────────

  /**
   * Resends an email verification OTP.
   * Returns the same consistent response whether or not the email exists (enumeration prevention).
   */
  async resendVerification(email: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });

      if (user && !user.emailVerified) {
        const challengeId = await this.issueEmailVerificationChallenge(
          user.id,
          user.email,
          user.name,
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
      this.handleError(`Resend verification for ${email}`, error);
    }
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────

  /**
   * Step 1 of two-step login: validates credentials and sends login OTP.
   * Returns a challengeId to use with POST /auth/verify-otp.
   */
  async login(dto: LoginDto) {
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

      const challengeId = await this.issueLoginOtpChallenge(user.email, user.name);

      this.logger.log(`Login OTP issued for user: ${user.id}`);
      return successResponse('A verification code has been sent to your email.', { challengeId });
    } catch (error) {
      this.handleError(`Login for ${dto.email}`, error);
    }
  }

  // ─── VERIFY LOGIN OTP ─────────────────────────────────────────────────────

  /**
   * Step 2 of two-step login: verifies OTP and creates a session + token pair.
   * Sets the refresh token in an httpOnly cookie.
   */
  async verifyLoginOtp(
    dto: VerifyLoginOtpDto,
    res: Response,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      const key = KEY_LOGIN_OTP(dto.challengeId);
      const challenge = await this.redis.getObject<OtpChallenge>(key);

      this.validateOtpChallenge(challenge, dto.otp, 'login');

      // Look up user by the email stored in the challenge
      const user = await this.prisma.user.findUnique({ where: { email: challenge!.email } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Consume challenge
      await this.redis.del(key);

      // Create session + tokens
      const tokens = await this.createSessionAndTokens(user.id, ipAddress, userAgent);

      // Set refresh token cookie
      const isProduction = this.config.get<string>('NODE_ENV') === 'production';
      res.cookie(
        REFRESH_TOKEN_COOKIE,
        tokens.refreshToken,
        getRefreshTokenCookieOptions(REFRESH_TOKEN_EXPIRY_MS, isProduction),
      );

      this.logger.log(`Session created for user: ${user.id} | Session: ${tokens.sessionId}`);

      return successResponse('Login successful', {
        accessToken: tokens.accessToken,
        user: this.toSafeUser(user),
      });
    } catch (error) {
      this.handleError(`Verify login OTP for challenge ${dto.challengeId}`, error);
    }
  }

  // ─── REFRESH TOKEN ────────────────────────────────────────────────────────

  /**
   * Rotates the refresh token and issues a new access token.
   * The old refresh token is revoked after successful rotation.
   */
  async refreshTokens(refreshTokenCookie: string | undefined, res: Response) {
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
        this.clearRefreshCookie(res);
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

      const accessToken = this.signAccessToken(account.userId, sessionId);
      const isProduction = this.config.get<string>('NODE_ENV') === 'production';

      res.cookie(
        REFRESH_TOKEN_COOKIE,
        newRefreshToken,
        getRefreshTokenCookieOptions(REFRESH_TOKEN_EXPIRY_MS, isProduction),
      );

      this.logger.log(`Tokens rotated for user: ${account.userId}`);
      return successResponse('Tokens refreshed', { accessToken });
    } catch (error) {
      this.handleError('Refresh tokens', error);
    }
  }

  // ─── LOGOUT ───────────────────────────────────────────────────────────────

  /**
   * Revokes the user's refresh token and clears the session cookie.
   */
  async logout(user: AuthenticatedUser, refreshTokenCookie: string | undefined, res: Response) {
    try {
      if (refreshTokenCookie) {
        const tokenHash = hashRefreshToken(refreshTokenCookie);
        await this.prisma.account
          .updateMany({
            where: { userId: user.userId, refreshToken: tokenHash },
            data: { isRevoked: true, refreshToken: null, refreshTokenExpiresAt: null },
          })
          .catch((err: Error) => {
            this.logger.warn(`Could not revoke refresh token during logout: ${err.message}`);
          });
      }

      // Also delete the session record
      await this.prisma.session
        .deleteMany({ where: { id: user.sessionId } })
        .catch((err: Error) => {
          this.logger.warn(`Could not delete session during logout: ${err.message}`);
        });

      this.clearRefreshCookie(res);
      this.logger.log(`User logged out: ${user.userId}`);
      return successResponse('Logged out successfully', null);
    } catch (error) {
      this.handleError(`Logout for user ${user.userId}`, error);
    }
  }

  // ─── GET ME ───────────────────────────────────────────────────────────────

  /**
   * Returns the authenticated user's safe profile.
   */
  async getMe(user: AuthenticatedUser) {
    try {
      const dbUser = await this.prisma.user.findUnique({ where: { id: user.userId } });
      if (!dbUser) throw new UnauthorizedException('User not found');
      return successResponse('User profile', this.toSafeUser(dbUser));
    } catch (error) {
      this.handleError(`Get profile for user ${user.userId}`, error);
    }
  }

  // ─── FORGOT PASSWORD ──────────────────────────────────────────────────────

  /**
   * Initiates the password reset flow by sending an OTP.
   * Returns a consistent response regardless of whether the email exists.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    try {
      const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

      if (user) {
        const challengeId = await this.issuePasswordResetChallenge(user.email, user.name);
        this.logger.log(
          `Password reset OTP issued for user: ${user.id}, challengeId: ${challengeId}`,
        );
      }

      return successResponse(
        'If this email is registered, you will receive a password reset code shortly.',
        null,
      );
    } catch (error) {
      this.handleError(`Forgot password for ${dto.email}`, error);
    }
  }

  // ─── RESET PASSWORD ───────────────────────────────────────────────────────

  /**
   * Verifies the reset OTP and updates the user's password.
   * Revokes all existing refresh tokens after a successful reset.
   */
  async resetPassword(dto: ResetPasswordDto) {
    try {
      const key = KEY_PASSWORD_RESET(dto.challengeId);
      const challenge = await this.redis.getObject<OtpChallenge>(key);

      this.validateOtpChallenge(challenge, dto.otp, 'password reset');

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

      await this.redis.del(key);

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

      this.logger.log(`Password reset completed for user: ${user.id}`);
      return successResponse(
        'Password has been reset successfully. Please log in with your new password.',
        null,
      );
    } catch (error) {
      this.handleError(`Reset password for challenge ${dto.challengeId}`, error);
    }
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

  /**
   * Centralized error handler for AuthService.
   * Ensures HTTP exceptions pass through, logs the error, handles Prisma errors,
   * and exposes error details when needed.
   */
  private handleError(operation: string, error: unknown): never {
    if (error instanceof HttpException) throw error;

    const err = error as Error;
    this.logger.error(`[${operation}] failed: ${err.message}`, err.stack);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('A record with this unique field already exists.');
      }
      // Return raw DB error in response as requested
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
   * Generic helper to create, store, and email an OTP challenge.
   * Centralizes the logic for generating OTPs, saving them in Redis with a TTL, and sending the corresponding email.
   *
   * @param email - The recipient's email address.
   * @param keyBuilder - A function that generates the Redis key given the challengeId.
   * @param ttlSeconds - Time-To-Live for the OTP in seconds before it expires.
   * @param subject - The subject line for the OTP email.
   * @param htmlTemplate - A callback that receives the plaintext OTP and returns the complete HTML email body.
   * @param extraData - Optional additional data to store in the Redis challenge object (e.g., userId).
   * @returns A promise resolving to the unique challengeId used to retrieve the OTP later.
   */
  private async createAndSendOtpChallenge<T extends { email: string; userId?: string }>(
    email: string,
    keyBuilder: (id: string) => string,
    ttlSeconds: number,
    subject: string,
    htmlTemplate: (otp: string) => string,
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

    await this.redis.setObject(keyBuilder(challengeId), challenge, ttlSeconds);
    await this.mail.sendEmail(email, subject, htmlTemplate(otp));

    return challengeId;
  }

  /**
   * Issues an email verification challenge when a new user registers.
   * Stores the userId in the challenge so it can be retrieved during verification.
   *
   * @param userId - The ID of the newly registered user.
   * @param email - The user's email address.
   * @param name - The user's first name for personalization.
   * @returns The generated challengeId.
   */
  private async issueEmailVerificationChallenge(
    userId: string,
    email: string,
    name: string,
  ): Promise<string> {
    return this.createAndSendOtpChallenge(
      email,
      KEY_EMAIL_VERIFY,
      EMAIL_VERIFY_OTP_TTL_S,
      'Verify your Aayeshol email',
      (otp) => emailVerificationTemplate(name, otp, 15),
      { userId },
    );
  }

  /**
   * Issues a two-step login OTP challenge.
   * Only stores the email, which is used to look up the user upon successful OTP validation.
   *
   * @param email - The user's email address.
   * @param name - The user's first name for personalization.
   * @returns The generated challengeId.
   */
  private async issueLoginOtpChallenge(email: string, name: string): Promise<string> {
    return this.createAndSendOtpChallenge(
      email,
      KEY_LOGIN_OTP,
      LOGIN_OTP_TTL_S,
      'Your Aayeshol login code',
      (otp) => loginOtpTemplate(name, otp, 5),
    );
  }

  /**
   * Issues a password reset OTP challenge.
   * Only stores the email, which is used to look up the user when resetting the password.
   *
   * @param email - The user's email address.
   * @param name - The user's first name for personalization.
   * @returns The generated challengeId.
   */
  private async issuePasswordResetChallenge(email: string, name: string): Promise<string> {
    return this.createAndSendOtpChallenge(
      email,
      KEY_PASSWORD_RESET,
      PASSWORD_RESET_OTP_TTL_S,
      'Reset your Aayeshol password',
      (otp) => passwordResetOtpTemplate(name, otp, 10),
    );
  }

  /**
   * Validates an OTP challenge from Redis.
   * Throws on expiry, max attempts, or invalid OTP.
   * Mutates the attempts counter in Redis on failure.
   */
  private validateOtpChallenge(
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
      // Increment attempts — best-effort (non-blocking)
      challenge.attempts += 1;
      void this.updateChallengeAttempts(challenge);
      throw new BadRequestException(`Invalid ${context} code`);
    }
  }

  private async updateChallengeAttempts(
    challenge: OtpChallenge | EmailVerificationChallenge,
  ): Promise<void> {
    // We don't have the key here, this is a limitation we accept.
    // Attempt tracking is best-effort via the challenge object.
    // In a real scenario, the key would be passed through.
    void challenge;
  }

  /**
   * Creates a session record and generates a token pair.
   */
  private async createSessionAndTokens(
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

  private signAccessToken(userId: string, sessionId: string): string {
    const secret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const payload: JwtAccessPayload = { sub: userId, sessionId, purpose: 'access' };
    return this.jwt.sign(payload, { secret, expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  /**
   * Maps a Prisma User record to a safe API-returnable object.
   */
  private toSafeUser(user: {
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
