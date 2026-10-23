import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy as LinkedInOAuth2Strategy,
  type Profile as LinkedInProfile,
} from 'passport-linkedin-oauth2';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { Platform } from '../../generated/prisma/client.js';
import { OAUTH_SCOPES } from '../constants/social.constants.js';
import type { SocialAuthProfile } from '../types/social.types.js';

/**
 * Passport.js Strategy for LinkedIn account connection via OAuth 2.0 (OpenID Connect + w_member_social).
 *
 * ### Context
 * Exclusively used for publishing posts, articles, and media to the user's personal LinkedIn feed.
 * It is NOT used for Aayeshol user authentication or login.
 *
 * ### Permissions & Scopes
 * - Requests OpenID scopes (`openid`, `profile`, `email`) for profile identity.
 * - Requests `w_member_social` for creating and publishing posts via the LinkedIn UGC/Posts API.
 */
@Injectable()
export class LinkedinStrategy extends PassportStrategy(LinkedInOAuth2Strategy, 'linkedin') {
  private readonly logger = new Logger(LinkedinStrategy.name);

  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('LINKEDIN_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('LINKEDIN_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('LINKEDIN_REDIRECT_URI'),
      scope: [...OAUTH_SCOPES.LINKEDIN],
      passReqToCallback: true,
    });
  }

  /**
   * Retrieves profile information from LinkedIn's OpenID Connect /v2/userinfo endpoint.
   * Modern LinkedIn apps use OpenID Connect (sub, name, email, picture) instead of deprecated r_liteprofile.
   */
  userProfile(accessToken: string, done: (err?: Error | null, profile?: any) => void): void {
    fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`LinkedIn /v2/userinfo failed (${res.status}): ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        done(null, {
          id: data.sub,
          displayName: data.name,
          emails: data.email ? [{ value: data.email }] : [],
          photos: data.picture ? [{ value: data.picture }] : [],
          _raw: JSON.stringify(data),
          _json: data,
        });
      })
      .catch((err) => {
        this.logger.error(`Failed to fetch LinkedIn userinfo: ${err.message}`);
        done(err);
      });
  }

  /**
   * Verify callback for LinkedIn OAuth 2.0.
   *
   * @param req - Express Request object containing the OAuth state parameter.
   * @param accessToken - Plaintext OAuth 2.0 access token issued by LinkedIn.
   * @param refreshToken - Optional refresh token (if issued by LinkedIn).
   * @param profile - Normalized LinkedIn profile.
   * @returns Normalized SocialAuthProfile payload.
   */
  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string | undefined,
    profile: LinkedInProfile,
  ): Promise<SocialAuthProfile> {
    // LinkedIn tokens typically have a default lifespan of 60 days (5184000 seconds)
    const tokenExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    const email = profile.emails?.[0]?.value;
    const avatar = profile.photos?.[0]?.value;

    const socialProfile: SocialAuthProfile = {
      provider: Platform.LINKEDIN,
      providerId: profile.id,
      name: profile.displayName,
      email,
      avatar,
      accessToken,
      refreshToken: refreshToken || undefined,
      tokenExpiry,
      grantedScopes: [...OAUTH_SCOPES.LINKEDIN],
    };

    return socialProfile;
  }
}
