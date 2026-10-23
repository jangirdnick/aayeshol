import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy as GoogleStrategy,
  type Profile as GoogleProfile,
  type GoogleCallbackParameters,
} from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { Platform } from '../../generated/prisma/client.js';
import { OAUTH_SCOPES } from '../constants/social.constants.js';
import type { SocialAuthProfile } from '../types/social.types.js';

/**
 * Passport.js Strategy for YouTube account connection via Google OAuth 2.0.
 *
 * ### Context
 * Used exclusively for social automation and publishing (video uploads, channel metadata retrieval).
 * It is NOT used for Aayeshol user authentication or login.
 *
 * ### Security & Permissions
 * - Requests offline access (`accessType: 'offline'`) and `prompt: 'consent'` to ensure a refresh token is granted.
 * - Requests granular YouTube and Profile scopes for automated uploads.
 * - Captures token expiration from `params.expires_in`.
 */
@Injectable()
export class YoutubeStrategy extends PassportStrategy(GoogleStrategy, 'youtube', true) {
  private readonly logger = new Logger(YoutubeStrategy.name);

  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('YOUTUBE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('YOUTUBE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('YOUTUBE_CALLBACK_URL'),
      scope: [...OAUTH_SCOPES.YOUTUBE],
      passReqToCallback: true,
    });
  }

  /**
   * Passport verify callback executed after successful Google authorization code exchange.
   *
   * @param req - Express Request object containing incoming query state.
   * @param accessToken - Plaintext OAuth access token returned by Google.
   * @param refreshToken - Plaintext OAuth refresh token returned by Google (when consent is prompted).
   * @param params - Additional token response parameters containing `expires_in` and `token_type`.
   * @param profile - Normalized Google profile object.
   * @returns Normalized SocialAuthProfile payload.
   */
  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string | undefined,
    params: GoogleCallbackParameters,
    profile: GoogleProfile,
  ): Promise<SocialAuthProfile> {
    const expiresIn = params?.expires_in ? Number(params.expires_in) : 3600;
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

    const socialProfile: SocialAuthProfile = {
      provider: Platform.YOUTUBE,
      providerId: profile.id,
      name: profile.displayName || profile.name?.givenName,
      email: profile.emails?.[0]?.value,
      avatar: profile.photos?.[0]?.value,
      accessToken,
      refreshToken: refreshToken || undefined,
      tokenExpiry,
      grantedScopes: params?.scope ? params.scope.split(' ') : undefined,
    };

    return socialProfile;
  }
}
