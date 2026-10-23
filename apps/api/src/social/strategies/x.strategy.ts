import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as OAuth2Strategy, type StrategyOptionsWithRequest } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import * as crypto from 'node:crypto';
import { Platform } from '../../generated/prisma/client.js';
import { OAUTH_SCOPES } from '../constants/social.constants.js';
import type { SocialAuthProfile } from '../types/social.types.js';
import { RedisService } from '../../infrastructure/redis/redis.service.js';

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
 * Uses a Redis-backed PKCE store to avoid requiring Express session middleware.
 */
@Injectable()
export class XStrategy extends PassportStrategy(OAuth2Strategy, 'x', true) {
  private readonly logger = new Logger(XStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {
    const clientID = configService.getOrThrow<string>('TWITTER_CLIENT_ID');
    const clientSecret = configService.getOrThrow<string>('TWITTER_CLIENT_SECRET');
    const basicAuth = Buffer.from(`${clientID}:${clientSecret}`).toString('base64');

    const pkceStore = {
      store: (
        req: Request,
        verifier: string,
        state: unknown,
        meta: unknown,
        cb: (err: Error | null, handle?: string) => void,
      ) => {
        const actualState =
          typeof state === 'object' && state && 'id' in state
            ? (state as { id: string }).id
            : typeof state === 'string'
              ? state
              : crypto.randomUUID();

        this.redis
          .set(`social:x:pkce:${actualState}`, verifier, 600)
          .then(() => cb(null, actualState))
          .catch((err) => cb(err as Error));
      },
      verify: (
        req: Request,
        state: string,
        cb: (err: Error | null, verifier?: string | boolean, state?: string) => void,
      ) => {
        this.redis
          .get(`social:x:pkce:${state}`)
          .then(async (verifier) => {
            if (!verifier) {
              return cb(new Error('PKCE code verifier not found or expired in Redis'));
            }
            await this.redis.del(`social:x:pkce:${state}`).catch(() => {});
            cb(null, verifier, state);
          })
          .catch((err) => cb(err as Error));
      },
    };

    super({
      authorizationURL: 'https://twitter.com/i/oauth2/authorize',
      tokenURL: 'https://api.twitter.com/2/oauth2/token',
      clientID,
      clientSecret,
      callbackURL: configService.getOrThrow<string>('TWITTER_CALLBACK_URL'),
      scope: [...OAUTH_SCOPES.X_TWITTER],
      pkce: true,
      store: pkceStore as unknown as any,
      passReqToCallback: true,
    } as unknown as StrategyOptionsWithRequest);

    // Modern Twitter API v2 OAuth 2.0 PKCE requires Basic Auth header without client_secret in the body.
    // Overriding getOAuthAccessToken ensures compliant token exchange without node-oauth body parameter pollution.
    (this as any)._oauth2.getOAuthAccessToken = async (
      code: string,
      params: Record<string, string>,
      callback: (
        err: Error | null,
        accessToken?: string,
        refreshToken?: string,
        results?: any,
      ) => void,
    ) => {
      try {
        const bodyParams = new URLSearchParams();
        bodyParams.set('code', code);
        bodyParams.set('grant_type', params.grant_type || 'authorization_code');
        if (params.redirect_uri) bodyParams.set('redirect_uri', params.redirect_uri);
        if (params.code_verifier) bodyParams.set('code_verifier', params.code_verifier);

        const response = await fetch('https://api.twitter.com/2/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`,
          },
          body: bodyParams.toString(),
        });

        const data = await response.json();
        if (!response.ok) {
          const errMsg = data?.error_description || data?.error || response.statusText;
          return callback(
            new Error(`Twitter token exchange failed (${response.status}): ${errMsg}`),
          );
        }

        return callback(null, data.access_token, data.refresh_token, data);
      } catch (err) {
        return callback(err as Error);
      }
    };
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
   * @returns Normalized SocialAuthProfile payload.
   */
  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string | undefined,
    params: { expires_in?: number; scope?: string },
    profile: TwitterUserMeResponse['data'],
  ): Promise<SocialAuthProfile> {
    const expiresIn = params?.expires_in ? Number(params.expires_in) : 7200;
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

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

    return socialProfile;
  }
}
