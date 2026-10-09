import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import * as crypto from 'node:crypto';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { AuthenticatedUser, JwtAccessPayload } from '../types/auth.types.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { KEY_SESSION_CACHE } from '../helpers/auth-helper.service.js';
import { RedisService } from '@/infrastructure/redis/redis.service.js';

export const SESSION_CACHE_KEY = KEY_SESSION_CACHE;
const SESSION_CACHE_TTL_S = 8 * 60; // 8 minutes, aligns with access token expiry

interface CachedSession {
  userId: string;
  sessionId: string;
}

/**
 * Global JWT authentication guard.
 * Validates the Bearer access token on every route unless marked with \@Public().
 *
 * Security improvements:
 * - Validates token signature, expiration, and purpose.
 * - Extracts and verifies session state against Redis and Prisma.
 * - Caches validated sessions to avoid DB hits on every request.
 * - Enriches `request.user` with userId, sessionId, requestId, ipAddress, and userAgent.
 * - Safely handles cache misses and DB outages.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();

    // Resolve requestId, ipAddress, userAgent
    const requestId =
      (request.headers['x-request-id'] as string | undefined) ?? crypto.randomUUID();
    const ipAddress =
      (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      request.ip;
    const userAgent = request.headers['user-agent'] ?? 'unknown';
    const path = request.path;
    const method = request.method;

    const token = this.extractBearerToken(request);
    if (!token) {
      this.logger.warn(
        `Authorization header is missing or malformed [requestId=${requestId}, ip=${ipAddress}, path=${method} ${path}]`,
      );
      throw new UnauthorizedException('Missing access token');
    }

    let payload: JwtAccessPayload;
    try {
      const secret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
      payload = this.jwtService.verify<JwtAccessPayload>(token, { secret });
    } catch (err) {
      const error = err as Error;
      this.logger.warn(
        `JWT verification failed [requestId=${requestId}, name=${error.name}, reason=${error.message}, ip=${ipAddress}, ua=${userAgent}]`,
      );
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (payload.purpose !== 'access') {
      this.logger.warn(
        `Invalid token purpose: ${String((payload as unknown as Record<string, unknown>).purpose)} [requestId=${requestId}, ip=${ipAddress}, path=${method} ${path}]`,
      );
      throw new UnauthorizedException('Invalid token purpose');
    }

    const { sub: userId, sessionId } = payload;

    // Validate Session
    let isSessionValid = false;

    try {
      const cacheKey = SESSION_CACHE_KEY(sessionId);
      const cachedSession = await this.redis.getObject<CachedSession>(cacheKey);

      if (cachedSession) {
        if (cachedSession.userId !== userId) {
          this.logger.warn(
            `Session user mismatch in cache [requestId=${requestId}, sessionUserId=${cachedSession.userId}, tokenUserId=${userId}]`,
          );
          throw new UnauthorizedException('Invalid session');
        }
        isSessionValid = true;
      } else {
        // Cache miss, check DB
        const session = await this.prisma.session.findUnique({
          where: { id: sessionId },
          include: { user: true },
        });

        if (!session) {
          this.logger.warn(
            `Session not found in DB [requestId=${requestId}, sessionId=${sessionId}]`,
          );
          throw new UnauthorizedException('Invalid or expired session');
        }

        if (session.userId !== userId) {
          this.logger.warn(
            `Session user mismatch in DB [requestId=${requestId}, sessionUserId=${session.userId}, tokenUserId=${userId}]`,
          );
          throw new UnauthorizedException('Invalid session');
        }

        if (session.expiresAt < new Date()) {
          this.logger.warn(
            `Session expired in DB [requestId=${requestId}, sessionId=${sessionId}]`,
          );
          throw new UnauthorizedException('Session expired');
        }

        if (!session.user) {
          this.logger.warn(
            `User for session not found in DB [requestId=${requestId}, userId=${userId}]`,
          );
          throw new UnauthorizedException('Invalid user');
        }

        // Cache the valid session
        await this.redis.setObject(
          cacheKey,
          { userId: session.userId, sessionId: session.id },
          SESSION_CACHE_TTL_S,
        );
        isSessionValid = true;
      }
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }

      const error = err as Error;
      this.logger.error(
        `Session validation error [requestId=${requestId}, error=${error.message}, ip=${ipAddress}, ua=${userAgent}, path=${method} ${path}]`,
        error.stack,
      );
      throw new InternalServerErrorException('Authentication service error');
    }

    if (!isSessionValid) {
      throw new UnauthorizedException('Session validation failed');
    }

    request.user = {
      userId,
      sessionId,
      requestId,
      ipAddress,
      userAgent,
    };

    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.slice(7).trim() || null;
  }
}
