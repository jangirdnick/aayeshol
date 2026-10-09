import {
  ExecutionContext,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard, SESSION_CACHE_KEY } from './jwt-auth.guard.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../infrastructure/redis/redis.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { describe, it, expect, beforeEach, afterEach, vi, type Mocked } from 'vitest';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: Mocked<JwtService>;
  let reflector: Mocked<Reflector>;
  let configService: Mocked<ConfigService>;
  let prisma: Mocked<PrismaService>;
  let redis: Mocked<RedisService>;

  let mockRequest: any;
  let mockContext: Mocked<ExecutionContext>;

  beforeEach(() => {
    jwtService = { verify: vi.fn() } as any;
    reflector = { getAllAndOverride: vi.fn() } as any;
    configService = { getOrThrow: vi.fn().mockReturnValue('test-secret') } as any;

    prisma = {
      session: {
        findUnique: vi.fn(),
      },
    } as any;

    redis = {
      getObject: vi.fn(),
      setObject: vi.fn(),
    } as any;

    mockRequest = {
      headers: {
        authorization: 'Bearer valid-token',
        'x-request-id': 'req-123',
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'test-agent',
      },
    };

    mockContext = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: () => mockRequest,
      }),
    } as any;

    guard = new JwtAuthGuard(
      jwtService as any,
      reflector as any,
      configService as any,
      prisma as any,
      redis as any,
    );
    // Suppress expected logs during tests
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Public Routes', () => {
    it('should allow access to public routes', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });
  });

  describe('Token Validation', () => {
    it('should throw UnauthorizedException if token is missing', async () => {
      mockRequest.headers.authorization = undefined;
      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token format is invalid', async () => {
      mockRequest.headers.authorization = 'InvalidFormat token';
      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token verification fails', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });
      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token purpose is not "access"', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'user-1',
        sessionId: 'session-1',
        purpose: 'refresh',
      });
      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Session Validation & Caching', () => {
    beforeEach(() => {
      jwtService.verify.mockReturnValue({
        sub: 'user-1',
        sessionId: 'session-1',
        purpose: 'access',
      });
    });

    it('should allow access if valid session is in Redis cache', async () => {
      redis.getObject.mockResolvedValue({ userId: 'user-1', sessionId: 'session-1' });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(prisma.session.findUnique).not.toHaveBeenCalled();
      expect(mockRequest.user).toEqual({
        userId: 'user-1',
        sessionId: 'session-1',
        requestId: 'req-123',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });
    });

    it('should throw UnauthorizedException if cached session userId mismatches', async () => {
      redis.getObject.mockResolvedValue({ userId: 'other-user', sessionId: 'session-1' });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should query DB and cache if session is missing from Redis', async () => {
      redis.getObject.mockResolvedValue(null);
      const mockSession = {
        id: 'session-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 10000),
        user: { id: 'user-1' },
      };
      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        include: { user: true },
      });
      expect(redis.setObject).toHaveBeenCalledWith(
        SESSION_CACHE_KEY('session-1'),
        { userId: 'user-1', sessionId: 'session-1' },
        expect.any(Number),
      );
      expect(mockRequest.user.userId).toBe('user-1');
    });

    it('should throw UnauthorizedException if session missing from DB', async () => {
      redis.getObject.mockResolvedValue(null);
      vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if session is expired in DB', async () => {
      redis.getObject.mockResolvedValue(null);
      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() - 10000), // expired
        user: { id: 'user-1' },
      } as any);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if DB session userId mismatches', async () => {
      redis.getObject.mockResolvedValue(null);
      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'session-1',
        userId: 'different-user',
        expiresAt: new Date(Date.now() + 10000),
        user: { id: 'different-user' },
      } as any);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if DB session has no user', async () => {
      redis.getObject.mockResolvedValue(null);
      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 10000),
        user: null, // user deleted or disabled if soft delete
      } as any);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      jwtService.verify.mockReturnValue({
        sub: 'user-1',
        sessionId: 'session-1',
        purpose: 'access',
      });
    });

    it('should propagate UnauthorizedException correctly', async () => {
      redis.getObject.mockResolvedValue(null);
      vi.mocked(prisma.session.findUnique).mockResolvedValue(null); // throws UnauthorizedException internally

      await expect(guard.canActivate(mockContext)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw InternalServerErrorException for Redis failures', async () => {
      redis.getObject.mockRejectedValue(new Error('Redis connection lost'));

      await expect(guard.canActivate(mockContext)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException for Database failures', async () => {
      redis.getObject.mockResolvedValue(null);
      vi.mocked(prisma.session.findUnique).mockRejectedValue(new Error('DB timeout'));

      await expect(guard.canActivate(mockContext)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
