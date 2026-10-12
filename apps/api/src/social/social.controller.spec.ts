import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { SocialController } from './social.controller.js';
import { SocialService } from './social.service.js';
import { Platform } from '../generated/prisma/client.js';
import type { AuthenticatedUser } from '../auth/types/auth.types.js';

describe('SocialController', () => {
  let controller: SocialController;
  let service: Mocked<SocialService>;

  const mockUser: AuthenticatedUser = {
    userId: 'user-123',
    sessionId: 'session-456',
    requestId: 'req-789',
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  };

  beforeEach(() => {
    service = {
      handleOAuthCallback: vi.fn(),
      getConnectedAccounts: vi.fn(),
      disconnectAccount: vi.fn(),
    } as any;

    controller = new SocialController(service);
  });

  describe('getAccounts', () => {
    it('should delegate to SocialService.getConnectedAccounts and return formatted response', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          provider: Platform.YOUTUBE,
          providerId: 'yt-channel-1',
          name: 'My YouTube',
          email: 'yt@example.com',
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          hasRefreshToken: true,
          tokenExpiresAt: null,
        },
      ];
      service.getConnectedAccounts.mockResolvedValueOnce(mockAccounts);

      const response = await controller.getAccounts(mockUser);

      expect(service.getConnectedAccounts).toHaveBeenCalledWith(mockUser.userId);
      expect(response).toMatchObject({
        success: true,
        message: 'Connected accounts retrieved successfully',
        data: mockAccounts,
      });
    });
  });

  describe('disconnectAccount', () => {
    it('should delegate to SocialService.disconnectAccount', async () => {
      service.disconnectAccount.mockResolvedValueOnce(undefined);

      const response = await controller.disconnectAccount({ id: 'acc-1' }, mockUser);

      expect(service.disconnectAccount).toHaveBeenCalledWith(mockUser.userId, 'acc-1');
      expect(response).toMatchObject({
        success: true,
        message: 'Social account disconnected successfully',
      });
    });
  });

  describe('OAuth callbacks', () => {
    const mockRequest: any = {
      user: {
        provider: Platform.YOUTUBE,
        providerId: 'yt-1',
        accessToken: 'token-abc',
      },
    };
    const mockResponse: any = { redirect: vi.fn() };

    it('should delegate youtubeCallback to handleOAuthCallback', async () => {
      service.handleOAuthCallback.mockResolvedValueOnce({ success: true });

      const result = await controller.youtubeCallback(
        { state: 'test-state' },
        mockRequest,
        mockResponse,
      );

      expect(service.handleOAuthCallback).toHaveBeenCalledWith(
        'test-state',
        mockRequest.user,
        mockResponse,
        mockRequest,
      );
      expect(result).toEqual({ success: true });
    });

    it('should delegate linkedinCallback to handleOAuthCallback', async () => {
      service.handleOAuthCallback.mockResolvedValueOnce({ success: true });

      await controller.linkedinCallback({ state: 'linkedin-state' }, mockRequest, mockResponse);

      expect(service.handleOAuthCallback).toHaveBeenCalledWith(
        'linkedin-state',
        mockRequest.user,
        mockResponse,
        mockRequest,
      );
    });

    it('should delegate xCallback to handleOAuthCallback', async () => {
      service.handleOAuthCallback.mockResolvedValueOnce({ success: true });

      await controller.xCallback({ state: 'x-state' }, mockRequest, mockResponse);

      expect(service.handleOAuthCallback).toHaveBeenCalledWith(
        'x-state',
        mockRequest.user,
        mockResponse,
        mockRequest,
      );
    });

    it('should delegate instagramCallback to handleOAuthCallback', async () => {
      service.handleOAuthCallback.mockResolvedValueOnce({ success: true });

      await controller.instagramCallback({ state: 'ig-state' }, mockRequest, mockResponse);

      expect(service.handleOAuthCallback).toHaveBeenCalledWith(
        'ig-state',
        mockRequest.user,
        mockResponse,
        mockRequest,
      );
    });
  });
});
