import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SocialService } from './social.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../infrastructure/redis/redis.service.js';
import { MailService } from '../infrastructure/mail/mail.service.js';
import { ConfigService } from '@nestjs/config';
import { Platform } from '../generated/prisma/client.js';
import type { SocialAuthProfile } from './types/social.types.js';

describe('SocialService', () => {
  let service: SocialService;
  let prisma: any;
  let redis: Mocked<RedisService>;
  let mailService: Mocked<MailService>;
  let configService: Mocked<ConfigService>;

  const mockEncryptionKey = 'test-encryption-key-with-at-least-32-chars!!';
  const mockFrontendUrl = 'http://localhost:3000';

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
      },
      socialAccount: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        delete: vi.fn(),
        upsert: vi.fn(),
      },
      socialToken: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prisma)),
    } as any;

    redis = {
      getObject: vi.fn(),
      setObject: vi.fn(),
      del: vi.fn(),
    } as any;

    mailService = {
      sendEmail: vi.fn().mockResolvedValue({ id: 'mock-mail-id' }),
    } as any;

    configService = {
      get: vi.fn((key: string) => {
        if (key === 'ENCRYPTION_KEY') return mockEncryptionKey;
        if (key === 'FRONTEND_URL') return mockFrontendUrl;
        return null;
      }),
      getOrThrow: vi.fn((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return mockEncryptionKey;
        return 'test-secret';
      }),
    } as any;

    service = new SocialService(prisma, redis, mailService, configService);
  });

  describe('createOAuthState', () => {
    it('should store OAuth state in Redis with 10-minute TTL', async () => {
      const stateData = {
        state: 'test-uuid-state',
        userId: 'user-123',
        platform: Platform.YOUTUBE,
        sessionId: 'session-abc',
        createdAt: Date.now(),
      };

      await service.createOAuthState(stateData);

      expect(redis.setObject).toHaveBeenCalledWith(
        'social:oauth-state:test-uuid-state',
        stateData,
        600,
      );
    });
  });

  describe('verifyAndConsumeOAuthState', () => {
    it('should throw BadRequestException if state is missing', async () => {
      await expect(service.verifyAndConsumeOAuthState('', Platform.YOUTUBE)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if state is not found or expired', async () => {
      redis.getObject.mockResolvedValueOnce(null);

      await expect(
        service.verifyAndConsumeOAuthState('expired-state', Platform.YOUTUBE),
      ).rejects.toThrow('Invalid, expired, or already used OAuth state');
    });

    it('should throw BadRequestException if platform mismatches', async () => {
      redis.getObject.mockResolvedValueOnce({
        state: 'valid-state',
        userId: 'user-123',
        platform: Platform.LINKEDIN,
        createdAt: Date.now(),
      });

      await expect(
        service.verifyAndConsumeOAuthState('valid-state', Platform.YOUTUBE),
      ).rejects.toThrow('OAuth state platform mismatch');
    });

    it('should delete state from Redis immediately upon successful retrieval (single-use)', async () => {
      const validState = {
        state: 'valid-state',
        userId: 'user-123',
        platform: Platform.YOUTUBE,
        createdAt: Date.now(),
      };
      redis.getObject.mockResolvedValueOnce(validState);

      const result = await service.verifyAndConsumeOAuthState('valid-state', Platform.YOUTUBE);

      expect(result).toEqual(validState);
      expect(redis.del).toHaveBeenCalledWith('social:oauth-state:valid-state', undefined);
    });
  });

  describe('handleOAuthCallback', () => {
    const mockProfile: SocialAuthProfile = {
      provider: Platform.YOUTUBE,
      providerId: 'yt-channel-123',
      name: 'Test YouTube Channel',
      email: 'creator@example.com',
      avatar: 'https://example.com/avatar.jpg',
      accessToken: 'raw-access-token-123',
      refreshToken: 'raw-refresh-token-456',
      tokenExpiry: new Date(Date.now() + 3600 * 1000),
    };

    const mockRequest: any = {
      headers: {
        'x-request-id': 'req-999',
        accept: 'application/json',
      },
      query: { format: 'json' },
      ip: '127.0.0.1',
    };

    const mockResponse: any = {
      redirect: vi.fn(),
    };

    it('should throw UnauthorizedException if initiating user does not exist in DB', async () => {
      redis.getObject.mockResolvedValueOnce({
        state: 'state-1',
        userId: 'deleted-user',
        platform: Platform.YOUTUBE,
        createdAt: Date.now(),
      });
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.handleOAuthCallback('state-1', mockProfile, mockResponse, mockRequest),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ConflictException if social account is already connected to another user', async () => {
      redis.getObject.mockResolvedValueOnce({
        state: 'state-1',
        userId: 'user-initiating',
        platform: Platform.YOUTUBE,
        createdAt: Date.now(),
      });
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-initiating',
        name: 'Alice',
        email: 'alice@example.com',
      } as any);

      // Existing account owned by Bob
      prisma.socialAccount.findUnique.mockResolvedValueOnce({
        id: 'acc-1',
        provider: Platform.YOUTUBE,
        providerId: 'yt-channel-123',
        userId: 'user-bob',
      } as any);

      await expect(
        service.handleOAuthCallback('state-1', mockProfile, mockResponse, mockRequest),
      ).rejects.toThrow(ConflictException);
    });

    it('should encrypt tokens, persist via Prisma transaction, send confirmation email, and return success', async () => {
      redis.getObject.mockResolvedValueOnce({
        state: 'state-1',
        userId: 'user-alice',
        platform: Platform.YOUTUBE,
        createdAt: Date.now(),
      });
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-alice',
        name: 'Alice',
        email: 'alice@example.com',
      } as any);

      prisma.socialAccount.findUnique.mockResolvedValueOnce(null); // No previous connection
      prisma.socialAccount.upsert.mockResolvedValueOnce({
        id: 'new-account-id',
        provider: Platform.YOUTUBE,
        providerId: 'yt-channel-123',
        name: 'Test YouTube Channel',
        email: 'creator@example.com',
        avatar: 'https://example.com/avatar.jpg',
        updatedAt: new Date(),
      } as any);

      const result = await service.handleOAuthCallback(
        'state-1',
        mockProfile,
        mockResponse,
        mockRequest,
      );

      // Verify Prisma transaction was called
      expect(prisma.$transaction).toHaveBeenCalled();

      // Verify email was sent via MailService strictly after commit
      expect(mailService.sendEmail).toHaveBeenCalledWith(
        'alice@example.com',
        'Social Account Connected: YouTube',
        expect.stringContaining('Social Account Connected Successfully'),
        undefined,
        expect.anything(),
      );

      // Verify JSON response
      expect(result).toMatchObject({
        success: true,
        data: {
          id: 'new-account-id',
          provider: Platform.YOUTUBE,
          name: 'Test YouTube Channel',
        },
      });
    });

    it('should preserve existing refresh token if provider omits it on reconnect', async () => {
      const profileWithoutRefreshToken = {
        ...mockProfile,
        refreshToken: undefined,
      };

      redis.getObject.mockResolvedValueOnce({
        state: 'state-1',
        userId: 'user-alice',
        platform: Platform.YOUTUBE,
        createdAt: Date.now(),
      });
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-alice',
        name: 'Alice',
        email: 'alice@example.com',
      } as any);

      // Previous account with stored encrypted refresh token
      prisma.socialAccount.findUnique.mockResolvedValueOnce({
        id: 'acc-1',
        provider: Platform.YOUTUBE,
        providerId: 'yt-channel-123',
        userId: 'user-alice',
        tokenData: {
          refreshToken: 'existing-encrypted-refresh-token',
        },
      } as any);

      prisma.socialAccount.upsert.mockResolvedValueOnce({
        id: 'acc-1',
        provider: Platform.YOUTUBE,
        name: 'Test YouTube Channel',
        updatedAt: new Date(),
      } as any);

      await service.handleOAuthCallback(
        'state-1',
        profileWithoutRefreshToken,
        mockResponse,
        mockRequest,
      );

      expect(prisma.socialAccount.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            tokenData: expect.objectContaining({
              upsert: expect.objectContaining({
                update: expect.objectContaining({
                  refreshToken: 'existing-encrypted-refresh-token',
                }),
              }),
            }),
          }),
        }),
      );
    });

    it('should not fail the connection if Resend email delivery fails', async () => {
      redis.getObject.mockResolvedValueOnce({
        state: 'state-1',
        userId: 'user-alice',
        platform: Platform.YOUTUBE,
        createdAt: Date.now(),
      });
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-alice',
        name: 'Alice',
        email: 'alice@example.com',
      } as any);

      prisma.socialAccount.findUnique.mockResolvedValueOnce(null);
      prisma.socialAccount.upsert.mockResolvedValueOnce({
        id: 'new-acc-id',
        provider: Platform.YOUTUBE,
        name: 'Test Channel',
        updatedAt: new Date(),
      } as any);

      // Email service throws error
      mailService.sendEmail.mockRejectedValueOnce(new Error('Resend network timeout'));

      const result = await service.handleOAuthCallback(
        'state-1',
        mockProfile,
        mockResponse,
        mockRequest,
      );

      // Account was still saved successfully
      expect(result).toMatchObject({
        success: true,
      });
    });
  });

  describe('getConnectedAccounts', () => {
    it('should return connected accounts omitting raw token secrets', async () => {
      prisma.socialAccount.findMany.mockResolvedValueOnce([
        {
          id: 'acc-1',
          provider: Platform.YOUTUBE,
          providerId: 'yt-1',
          name: 'My Channel',
          email: 'me@example.com',
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          tokenData: {
            refreshToken: 'enc-refresh-token',
            tokenExpiry: new Date(),
          },
        },
      ] as any);

      const accounts = await service.getConnectedAccounts('user-123');

      expect(accounts).toHaveLength(1);
      expect(accounts[0]).toMatchObject({
        id: 'acc-1',
        provider: Platform.YOUTUBE,
        hasRefreshToken: true,
      });
      expect(accounts[0]).not.toHaveProperty('accessToken');
    });
  });

  describe('disconnectAccount', () => {
    it('should throw NotFoundException if account does not exist or belongs to another user', async () => {
      prisma.socialAccount.findFirst.mockResolvedValueOnce(null);

      await expect(service.disconnectAccount('user-123', 'acc-xyz')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete the account when found for the user', async () => {
      prisma.socialAccount.findFirst.mockResolvedValueOnce({
        id: 'acc-xyz',
        userId: 'user-123',
        provider: Platform.LINKEDIN,
      } as any);
      prisma.socialAccount.delete.mockResolvedValueOnce({} as any);

      await service.disconnectAccount('user-123', 'acc-xyz');

      expect(prisma.socialAccount.delete).toHaveBeenCalledWith({
        where: { id: 'acc-xyz' },
      });
    });
  });
});
