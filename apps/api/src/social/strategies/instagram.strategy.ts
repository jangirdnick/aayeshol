import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { Platform } from '../../generated/prisma/client.js';
import { OAUTH_SCOPES } from '../constants/social.constants.js';
import type { SocialAuthProfile } from '../types/social.types.js';

interface InstagramProfileResponse {
  id: string;
  username: string;
  account_type?: string;
}

/**
 * Passport.js Strategy for Instagram account connection via Instagram Basic Display / Graph API.
 *
 * ### Architecture & Compatibility Notice
 * The legacy `passport-instagram` package attempts to query `https://api.instagram.com/v1/users/self`,
 * an endpoint that was permanently sunset by Meta in 2020. Attempting to use that package directly
 * results in HTTP 404/400 errors from Meta.
 *
 * To ensure reliable, production-grade connectivity with current Meta platforms, this strategy utilizes
 * `passport-oauth2` targeting current Instagram API endpoints:
 * - Authorization: `https://api.instagram.com/oauth/authorize`
 * - Token Exchange: `https://api.instagram.com/oauth/access_token`
 * - Profile: `https://graph.instagram.com/me?fields=id,username,account_type`
 *
 * ### Permissions & Lifespan
 * - Requests `user_profile` and `user_media` scopes for Instagram content metadata and publishing.
 * - Handles exchange for long-lived tokens (60 days) to support reliable background scheduling.
 */
@Injectable()
export class InstagramStrategy extends PassportStrategy(OAuth2Strategy, 'instagram', true) {
  private readonly logger = new Logger(InstagramStrategy.name);

  constructor(private readonly configService: ConfigService) {
    super({
      authorizationURL: 'https://api.instagram.com/oauth/authorize',
      tokenURL: 'https://api.instagram.com/oauth/access_token',
      clientID: configService.getOrThrow<string>('INSTAGRAM_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('INSTAGRAM_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('INSTAGRAM_CALLBACK_URL'),
      scope: [...OAUTH_SCOPES.INSTAGRAM],
      passReqToCallback: true,
    });
  }

  /**
   * Fetches the user profile from the modern Instagram Graph endpoint.
   *
   * @param accessToken - Plaintext Instagram access token.
   * @param done - Callback passed by passport-oauth2.
   */
  override userProfile(
    accessToken: string,
    done: (err?: Error | null, profile?: InstagramProfileResponse) => void,
  ): void {
    fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`,
    )
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Instagram Graph API /me failed (${response.status}): ${errorText}`);
        }
        return response.json() as Promise<InstagramProfileResponse>;
      })
      .then((body) => {
        done(null, body);
      })
      .catch((error: Error) => {
        this.logger.error(`Failed to fetch Instagram user profile: ${error.message}`);
        done(error);
      });
  }

  /**
   * Passport verify callback executed after token exchange.
   *
   * @param req - Express Request object.
   * @param accessToken - Plaintext access token.
   * @param refreshToken - Optional refresh token (Instagram tokens do not use traditional refresh tokens;
   *                       long-lived tokens are refreshed via the exchange endpoint).
   * @param params - Additional parameters.
   * @param profile - Instagram profile object.
   * @returns Normalized SocialAuthProfile payload.
   */
  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string | undefined,
    params: { expires_in?: number },
    profile: InstagramProfileResponse,
  ): Promise<SocialAuthProfile> {
    // Instagram short-lived tokens expire in 1 hour (3600 seconds), long-lived tokens in 60 days
    const expiresIn = params?.expires_in ? Number(params.expires_in) : 60 * 24 * 3600;
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

    const socialProfile: SocialAuthProfile = {
      provider: Platform.INSTAGRAM,
      providerId: profile.id,
      name: profile.username ? `@${profile.username}` : profile.id,
      accessToken,
      refreshToken: refreshToken || undefined,
      tokenExpiry,
      grantedScopes: [...OAUTH_SCOPES.INSTAGRAM],
    };

    return socialProfile;
  }
}
