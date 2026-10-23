import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { Platform } from '../../generated/prisma/client.js';
import { SocialService } from '../social.service.js';
import type { AuthenticatedUser } from '../../auth/types/auth.types.js';
import { OAUTH_SCOPES } from '../constants/social.constants.js';

/**
 * Guard for initiating LinkedIn OAuth 2.0 authorization.
 * Ensures caller is an authenticated Aayeshol user, generates a secure random state,
 * and records it in Redis bound to the initiating user.
 */
@Injectable()
export class LinkedinOAuthGuard extends AuthGuard('linkedin') {
  constructor(private readonly socialService: SocialService) {
    super();
  }

  override async getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    const user = req.user;
    if (!user || !user.userId) {
      throw new UnauthorizedException('Authentication required before connecting a social account');
    }

    const state = crypto.randomUUID();
    await this.socialService.createOAuthState({
      state,
      userId: user.userId,
      platform: Platform.LINKEDIN,
      sessionId: user.sessionId,
      createdAt: Date.now(),
    });

    return {
      state,
      scope: OAUTH_SCOPES.LINKEDIN,
    };
  }
}

/**
 * Guard for handling LinkedIn OAuth 2.0 callback code exchange.
 */
@Injectable()
export class LinkedinCallbackGuard extends AuthGuard('linkedin') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  override handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      const req = context.switchToHttp().getRequest<Request>();
      const res = context.switchToHttp().getResponse<Response>();
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const errorMsg =
        err?.message ||
        (req.query?.error_description as string) ||
        (req.query?.error as string) ||
        'LinkedIn authorization was cancelled or failed';

      if (req.headers['accept']?.includes('application/json') || req.query?.format === 'json') {
        throw new BadRequestException(errorMsg);
      }

      res.redirect(
        `${frontendUrl}/dashboard/integrations?status=error&platform=linkedin&message=${encodeURIComponent(errorMsg)}`,
      );
      return null as unknown as TUser;
    }
    return user;
  }
}
