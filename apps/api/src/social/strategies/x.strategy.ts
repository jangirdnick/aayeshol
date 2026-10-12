import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as OAuth2Strategy, type VerifyCallback } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { Platform } from '../../generated/prisma/client.js';
import { OAUTH_SCOPES } from '../constants/social.constants.js';
import type { SocialAuthProfile } from '../types/social.types.js';

interface TwitterUserMeResponse {
  data: {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
  };
}

/**
 * Passport.js Strategy for X (Twitter) account connection via OAuth 2.0 with PKCE.
 *
 * ### Architecture & Compatibility Notice
 * The legacy `passport-twitter` package exclusively implements OAuth 1.0a (requiring consumer keys,
 * request token exchanges, and HMAC-SHA1 signatures). Modern Twitter developer apps and API v2
 * (which manage automated tweet creation and media publishing) require OAuth 2.0 Authorization Code Flow
 * with PKCE (Proof Key for Code Exchange) and confidentiality client credentials.
 *
 * To ensure full compatibility with Twitter API v2 without breaking or forcing an incompatible legacy flow,
 * this strategy extends the robust `passport-oauth2` base strategy targeting the official Twitter v2 endpoints:
 * - Authorization URL: `https://twitter.com/i/oauth2/authorize`
 * - Token URL: `https://api.twitter.com/2/oauth2/token`
 * - Scopes: `tweet.read`, `tweet.write`, `users.read`, `offline.access`
 *
 * ### Security
 * - Strictly isolated from Aayeshol user authentication.
 * - Enforces PKCE (`pkce: true`) and state validation to prevent authorization code interception and CSRF.
 */
@Injectable()
export class XStrategy extends PassportStrategy(OAuth2Strategy, 'x') {
  private readonly logger = new Logger(XStrategy.name);

  constructor(private readonly configService: ConfigService) {
    super({
      authorizationURL: 'https://twitter.com/i/oauth2/authorize',
      tokenURL: 'https://api.twitter.com/2/oauth2/token',
      clientID: configService.getOrThrow<string>('TWITTER_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('TWITTER_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('TWITTER_CALLBACK_URL'),
      scope: [...OAUTH_SCOPES.X_TWITTER],
      pkce: true,
      state: true,
      passReqToCallback: true,
    });
  }

  /**
   * Retrieves the authenticated user profile using the Twitter API v2 `/users/me` endpoint.
   *
   * @param accessToken - Plaintext OAuth 2.0 Bearer access token.
   * @param done - Callback passed by passport-oauth2.
   */
  override userProfile(
    accessToken: string,
    done: (err?: Error | null, profile?: TwitterUserMeResponse['data']) => void,
  ): void {
    fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,username', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Twitter API v2 /users/me failed (${response.status}): ${errorText}`);
        }
        return response.json() as Promise<TwitterUserMeResponse>;
      })
      .then((body) => {
        done(null, body.data);
      })
      .catch((error: Error) => {
        this.logger.error(`Failed to fetch Twitter v2 user profile: ${error.message}`);
        done(error);
      });
  }

  /**
   * Passport verify callback executed after successful OAuth 2.0 token exchange with Twitter.
   *
   * @param req - Express Request object.
   * @param accessToken - Plaintext OAuth 2.0 access token issued by Twitter.
   * @param refreshToken - Plaintext OAuth 2.0 refresh token (issued when `offline.access` is requested).
   * @param params - Additional token response parameters containing `expires_in` and `scope`.
   * @param profile - Twitter API v2 user data fetched via `userProfile()`.
   * @param done - Passport completion callback.
   */
  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string | undefined,
    params: { expires_in?: number; scope?: string },
    profile: TwitterUserMeResponse['data'],
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const expiresIn = params?.expires_in ? Number(params.expires_in) : undefined;
      const tokenExpiry = expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined;

      const socialProfile: SocialAuthProfile = {
        provider: Platform.X_TWITTER,
        providerId: profile.id,
        name: profile.name || `@${profile.username}`,
        avatar: profile.profile_image_url,
        accessToken,
        refreshToken: refreshToken || undefined,
        tokenExpiry,
        grantedScopes: params?.scope ? params.scope.split(' ') : undefined,
      };

      done(null, socialProfile);
    } catch (error) {
      this.logger.error(
        `Failed to parse X (Twitter) OAuth profile: ${(error as Error).message}`,
        (error as Error).stack,
      );
      done(error as Error);
    }
  }
}
