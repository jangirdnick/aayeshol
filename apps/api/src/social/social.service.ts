import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Platform } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../infrastructure/redis/redis.service.js';
import { MailService } from '../infrastructure/mail/mail.service.js';
import { KEY_OAUTH_STATE, OAUTH_STATE_TTL_SECONDS } from './constants/social.constants.js';
import type {
  ConnectedAccountResponse,
  OAuthStateData,
  SocialAuthProfile,
} from './types/social.types.js';
import { deriveEncryptionKey, encryptToken, decryptToken } from './utils/crypto.util.js';
import { socialAccountConnectedTemplate } from './templates/social-email.template.js';
import { successResponse } from '../common/response/api-response.js';
import type { RequestContext } from '../auth/types/auth.types.js';

/**
 * Service managing social account connections, secure token persistence, and OAuth transaction state.
 *
 * ### Context
 * Exclusively responsible for social media automation integrations (YouTube, LinkedIn, X, Instagram).
 * Binds external social identities to existing authenticated Aayeshol user profiles.
 *
 * ### Architecture & Security Rules
 * - All access and refresh tokens are AES-256-GCM encrypted prior to database persistence.
 * - Raw token values are NEVER exposed to the frontend or printed in application logs.
 * - OAuth state parameters are single-use, stored in Redis with a 10-minute TTL, and immediately evicted upon validation.
 * - Prevents account hijacking by verifying that provider IDs are not already claimed by a different user.
 * - Dispatches a Resend confirmation email strictly after successful database commit.
 */
@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);
  private readonly encryptionKey: Buffer;
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    const rawSecret =
      this.configService.get<string>('ENCRYPTION_KEY') ||
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.encryptionKey = deriveEncryptionKey(rawSecret);
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  /**
   * Helper to format request context for structured logging.
   */
  private formatContext(ctx?: RequestContext): string {
    if (!ctx) return '';
    return ` [requestId=${ctx.requestId}, ip=${ctx.ipAddress ?? 'unknown'}, ua=${ctx.userAgent ?? 'unknown'}]`;
  }

  /**
   * Helper to construct RequestContext from Express request.
   */
  private getRequestContext(req: Request): RequestContext {
    return {
      requestId: (req.headers['x-request-id'] as string | undefined) ?? crypto.randomUUID(),
      ipAddress:
        (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip,
      userAgent: req.headers['user-agent'] ?? 'unknown',
    };
  }

  /**
   * Records a temporary OAuth state transaction in Redis bound to the initiating user.
   *
   * @param stateData - State transaction metadata.
   */
  async createOAuthState(stateData: OAuthStateData): Promise<void> {
    const cacheKey = KEY_OAUTH_STATE(stateData.state);
    await this.redis.setObject(cacheKey, stateData, OAUTH_STATE_TTL_SECONDS);
    this.logger.log(
      `Created OAuth state for user=${stateData.userId}, platform=${stateData.platform}, state=${stateData.state}`,
    );
  }

  /**
   * Verifies and immediately consumes an OAuth state transaction from Redis.
   * Prevents replay attacks and verifies the target platform matches the expected provider.
   *
   * @param state - The state UUID returned by the OAuth provider.
   * @param expectedPlatform - The platform handling the callback.
   * @param ctx - Optional request context for logging.
   * @returns The validated OAuth state payload.
   * @throws {BadRequestException} If state is missing, expired, or platform mismatches.
   */
  async verifyAndConsumeOAuthState(
    state: string,
    expectedPlatform: Platform,
    ctx?: RequestContext,
  ): Promise<OAuthStateData> {
    if (!state) {
      this.logger.warn(`Missing OAuth state parameter${this.formatContext(ctx)}`);
      throw new BadRequestException('Missing OAuth state parameter');
    }

    const cacheKey = KEY_OAUTH_STATE(state);
    const stateData = await this.redis.getObject<OAuthStateData>(cacheKey, ctx);

    if (!stateData) {
      this.logger.warn(
        `OAuth state not found or expired in Redis: state=${state}${this.formatContext(ctx)}`,
      );
      throw new BadRequestException('Invalid, expired, or already used OAuth state');
    }

    if (stateData.platform !== expectedPlatform) {
      this.logger.warn(
        `OAuth platform mismatch: expected=${expectedPlatform}, found=${stateData.platform}${this.formatContext(ctx)}`,
      );
      throw new BadRequestException('OAuth state platform mismatch');
    }

    // Immediately evict state to ensure single-use semantics
    await this.redis.del(cacheKey, ctx);

    return stateData;
  }

  /**
   * Helper to redirect browser to frontend integrations page with an error status query.
   */
  handleCallbackError(platform: string, error: unknown, res: Response): void {
    if (res.headersSent) return;
    const msg = error instanceof Error ? error.message : 'OAuth connection failed';
    this.logger.error(`Error during ${platform} OAuth callback: ${msg}`);
    res.redirect(
      `${this.frontendUrl}/dashboard/integrations?status=error&platform=${platform}&message=${encodeURIComponent(msg)}`,
    );
  }

  /**
   * Processes a verified OAuth callback: persists account metadata, encrypts tokens,
   * sends a confirmation email via Resend, and returns a JSON response or redirect.
   *
   * @param state - Incoming state query string.
   * @param profile - Normalized social profile and token payload from Passport strategy.
   * @param res - Express Response object.
   * @param req - Express Request object.
   */
  async handleOAuthCallback(
    state: string,
    profile: SocialAuthProfile,
    res: Response,
    req: Request,
  ): Promise<any> {
    if (res.headersSent) {
      return;
    }

    if (!profile) {
      return res.redirect(
        `${this.frontendUrl}/dashboard/integrations?status=error&message=${encodeURIComponent('Missing social profile payload')}`,
      );
    }

    const ctx = this.getRequestContext(req);

    // 1. Validate and consume state bound to initiating user
    const stateData = await this.verifyAndConsumeOAuthState(state, profile.provider, ctx);
    const userId = stateData.userId;

    // 2. Verify target user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.error(
        `OAuth state refers to non-existent user: ${userId}${this.formatContext(ctx)}`,
      );
      throw new UnauthorizedException('Authenticated user no longer exists');
    }

    // 3. Inspect existing social account for duplicate/ownership conflict
    const existingAccount = await this.prisma.socialAccount.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
      include: {
        tokenData: true,
      },
    });

    if (existingAccount && existingAccount.userId !== userId) {
      this.logger.warn(
        `Social account conflict: provider=${profile.provider}, providerId=${profile.providerId} already linked to user=${existingAccount.userId}, attempt by user=${userId}${this.formatContext(ctx)}`,
      );
      throw new ConflictException(
        `This ${profile.provider} account is already connected to another Aayeshol user workspace`,
      );
    }

    // 4. Encrypt sensitive tokens with AES-256-GCM
    const encryptedAccessToken = encryptToken(profile.accessToken, this.encryptionKey);

    // If new refresh token is omitted (e.g. Google reconnect without consent prompt), preserve existing
    let encryptedRefreshToken: string | null = null;
    if (profile.refreshToken) {
      encryptedRefreshToken = encryptToken(profile.refreshToken, this.encryptionKey);
    } else if (existingAccount?.tokenData?.refreshToken) {
      encryptedRefreshToken = existingAccount.tokenData.refreshToken;
    }

    // 5. Persist account and encrypted tokens in a Prisma database transaction
    const savedAccount = await this.prisma.$transaction(async (tx) => {
      return tx.socialAccount.upsert({
        where: {
          provider_providerId: {
            provider: profile.provider,
            providerId: profile.providerId,
          },
        },
        create: {
          provider: profile.provider,
          providerId: profile.providerId,
          name: profile.name,
          email: profile.email,
          avatar: profile.avatar,
          userId: userId,
          tokenData: {
            create: {
              accessToken: encryptedAccessToken,
              refreshToken: encryptedRefreshToken,
              tokenExpiry: profile.tokenExpiry,
            },
          },
        },
        update: {
          name: profile.name,
          email: profile.email,
          avatar: profile.avatar,
          userId: userId,
          tokenData: {
            upsert: {
              create: {
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                tokenExpiry: profile.tokenExpiry,
              },
              update: {
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                tokenExpiry: profile.tokenExpiry,
              },
            },
          },
        },
      });
    });

    this.logger.log(
      `Successfully linked ${profile.provider} account "${profile.name || profile.providerId}" for user=${userId}${this.formatContext(ctx)}`,
    );

    // 6. Trigger confirmation email through Resend (strictly after successful persistence)
    try {
      const emailHtml = socialAccountConnectedTemplate({
        userName: user.name,
        platform: this.formatPlatformName(profile.provider),
        accountName: profile.name || profile.providerId,
        accountId: profile.providerId,
        connectedAt: new Date(),
        frontendUrl: this.frontendUrl,
      });

      await this.mailService.sendEmail(
        user.email,
        `Social Account Connected: ${this.formatPlatformName(profile.provider)}`,
        emailHtml,
        undefined,
        ctx,
      );
      this.logger.log(
        `Dispatched connection confirmation email to ${user.email}${this.formatContext(ctx)}`,
      );
    } catch (mailError) {
      // Do not abort connection if email delivery encounters a transient failure
      this.logger.error(
        `Failed to deliver confirmation email for connected ${profile.provider} account: ${(mailError as Error).message}${this.formatContext(ctx)}`,
        (mailError as Error).stack,
      );
    }

    // 7. Handle response: return JSON or redirect to frontend UI
    const isJsonRequested =
      req.headers['accept']?.includes('application/json') || req.query?.format === 'json';

    if (isJsonRequested) {
      return successResponse('Social account connected successfully', {
        id: savedAccount.id,
        provider: savedAccount.provider,
        name: savedAccount.name,
        email: savedAccount.email,
        avatar: savedAccount.avatar,
        connectedAt: savedAccount.updatedAt,
      });
    }

    // Redirect to frontend connected accounts dashboard with query parameters
    const redirectUrl = `${this.frontendUrl}/dashboard/integrations?status=success&platform=${profile.provider.toLowerCase()}&account=${encodeURIComponent(savedAccount.name || '')}`;
    return res.redirect(redirectUrl);
  }

  /**
   * Retrieves all social accounts connected by the authenticated user.
   * Omits all sensitive token information.
   *
   * @param userId - ID of the authenticated Aayeshol user.
   * @returns List of safe connected account response objects.
   */
  async getConnectedAccounts(userId: string): Promise<ConnectedAccountResponse[]> {
    const accounts = await this.prisma.socialAccount.findMany({
      where: { userId },
      include: {
        tokenData: {
          select: {
            refreshToken: true,
            tokenExpiry: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map((account) => ({
      id: account.id,
      provider: account.provider,
      providerId: account.providerId,
      name: account.name,
      email: account.email,
      avatar: account.avatar,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      hasRefreshToken: Boolean(account.tokenData?.refreshToken),
      tokenExpiresAt: account.tokenData?.tokenExpiry ?? null,
    }));
  }

  /**
   * Disconnects and deletes a connected social account and its associated tokens.
   *
   * @param userId - Authenticated user ID.
   * @param accountId - ID of the social account to delete.
   * @throws {NotFoundException} If account does not exist or belongs to another user.
   */
  async disconnectAccount(userId: string, accountId: string): Promise<void> {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Connected social account not found');
    }

    await this.prisma.socialAccount.delete({
      where: { id: accountId },
    });

    this.logger.log(
      `User ${userId} disconnected social account ${accountId} (${account.provider})`,
    );
  }

  /**
   * Helper to retrieve decrypted tokens for background worker publishing.
   *
   * @param accountId - Target SocialAccount ID.
   * @returns Plaintext tokens and expiry.
   */
  async getDecryptedTokens(accountId: string): Promise<{
    accessToken: string;
    refreshToken: string | null;
    tokenExpiry: Date | null;
  }> {
    const tokenRecord = await this.prisma.socialToken.findUnique({
      where: { socialAccountId: accountId },
    });

    if (!tokenRecord) {
      throw new NotFoundException('OAuth tokens not found for social account');
    }

    const accessToken = decryptToken(tokenRecord.accessToken, this.encryptionKey);
    const refreshToken = tokenRecord.refreshToken
      ? decryptToken(tokenRecord.refreshToken, this.encryptionKey)
      : null;

    return {
      accessToken,
      refreshToken,
      tokenExpiry: tokenRecord.tokenExpiry,
    };
  }

  /**
   * Helper to format platform enum to readable display name.
   */
  private formatPlatformName(platform: Platform): string {
    switch (platform) {
      case Platform.YOUTUBE:
        return 'YouTube';
      case Platform.LINKEDIN:
        return 'LinkedIn';
      case Platform.X_TWITTER:
        return 'X (Twitter)';
      case Platform.INSTAGRAM:
        return 'Instagram';
      default:
        return platform;
    }
  }
}
