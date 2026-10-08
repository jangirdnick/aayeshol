import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { AuthenticatedUser, JwtAccessPayload } from '../types/auth.types.js';

/**
 * Global JWT authentication guard.
 * Validates the Bearer access token on every route unless marked with \@Public().
 *
 * Validates:
 * - Token presence and Bearer format
 * - JWT signature and expiration (via JwtService)
 * - Token purpose claim must equal 'access'
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const secret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
      const payload = this.jwtService.verify<JwtAccessPayload>(token, { secret });

      if (payload.purpose !== 'access') {
        throw new UnauthorizedException('Invalid token purpose');
      }

      request.user = {
        userId: payload.sub,
        sessionId: payload.sessionId,
      };

      return true;
    } catch (err) {
      this.logger.warn(`JWT validation failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private extractBearerToken(request: Request): string | null {
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.slice(7).trim() || null;
  }
}
