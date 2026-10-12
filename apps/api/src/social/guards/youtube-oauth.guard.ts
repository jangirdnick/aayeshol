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
 * Guard for initiating YouTube OAuth 2.0 authorization.
 * Ensures caller is an authenticated Aayeshol user, generates a secure random state,
 * records it in Redis, and configures Google offline consent options.
 */
@Injectable()
export class YoutubeOAuthGuard extends AuthGuard('youtube') {
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
      platform: Platform.YOUTUBE,
      sessionId: user.sessionId,
      createdAt: Date.now(),
    });

    return {
      state,
      accessType: 'offline',
      prompt: 'consent',
      scope: OAUTH_SCOPES.YOUTUBE,
    };
  }
}

/**
 * Guard for handling YouTube OAuth 2.0 callback code exchange.
 * Validates provider response, handles user denial, and returns normalized profile.
 */
@Injectable()
export class YoutubeCallbackGuard extends AuthGuard('youtube') {
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
        'YouTube authorization was cancelled or failed';

      if (req.headers['accept']?.includes('application/json') || req.query?.format === 'json') {
        throw new BadRequestException(errorMsg);
      }

      res.redirect(
        `${frontendUrl}/settings/connections?status=error&platform=youtube&message=${encodeURIComponent(errorMsg)}`,
      );
      return null as unknown as TUser;
    }
    return user;
  }
}
